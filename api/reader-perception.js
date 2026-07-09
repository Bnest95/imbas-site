// /api/reader-perception.js — Vercel serverless function (Node). Reader v2 P3.
//
// The perception tap. After a single-mode inspection result OR a paired delta view,
// the person may OPTIONALLY record one perception:
//   - single mode: "Did this surface something you hadn't considered?"
//       -> single_yes | single_no   (the only honest question in single mode — the
//          person can't judge omission, only whether the read landed)
//   - paired mode: "How big did the difference feel?"
//       -> paired_small | paired_noticeable | paired_large   (they hold both answers,
//          so delta perception is real data)
//
// ── THIS IS PERCEPTION TELEMETRY, NEVER VALIDATION. ───────────────────────────
// The tap records how the result FELT to the person. It never confirms the
// inspection was accurate, and nothing here — no field, no log, no response, no
// comment — may imply that it does. The sentence "users confirm our accuracy" and
// every paraphrase of it are BANNED by design §4. A perception value is a feeling,
// not a score, not a ground truth, not evidence.
//
// ── Authority = possession of an integrity-checkable receipt, nothing else. ───
// A perception write is a client-triggered mutation, so the server never trusts a
// client-nominated request_id, open_run_id, or Airtable row id as authority to
// mutate telemetry. Authority is proven in two parts:
//   1. recompute the receipt's content_hash over its canonical form and confirm it
//      equals the embedded hash — the envelope is untampered; and
//   2. match that verified hash against the stored Receipt Hash field to locate the
//      ONE row it belongs to — the receipt corresponds to a real minted record.
// A forged envelope fails (1); a fabricated hash with no minted record fails (2).
//
// Targeting is by the verified Receipt Hash — NOT by Open Run ID — because one open
// run may back multiple paired analyses, so Open Run ID is not unique. The single
// receipt locates its Reader Runs row; the paired receipt locates its exact Reader
// Paired Analyses row.
//
// The write touches ONLY the Perception Tap field, via PATCH (never PUT), so the
// consent fields (Calibration Eligible / Candidate Retention Consent) and every
// other field are left exactly as they were. Latest valid selection replaces the
// prior value on the same row — one mutable field, never an appended row.
//
// Failure isolation: a perception-write failure NEVER degrades, removes, or blocks
// the inspection result, the paired delta, or the receipt. Those already live on
// the client; this endpoint's failure returns an error the client swallows in
// silence. Skipping the tap performs no mutation at all — the field stays null.
//
// Abuse control: a per-receipt write cap (reader-security.js) bounds how many times
// one receipt may set its value, so a replayed receipt can't hammer the endpoint.
// No read-endpoint rate or spend control is touched (P3 scope lock).
//
// ── Request (POST, application/json) ─────────────────────────────────────────
// { "receipt": <single or paired receipt envelope>, "value": <one exact enum> }
//
// ── Env vars ─────────────────────────────────────────────────────────────────
//   AIRTABLE_TOKEN — persistence; UPSTASH_REDIS_REST_* — durable write cap.

import {
  createRuntimeContext,
  logRuntimeEvent,
  totalDurationMs,
} from "../reader-runtime.js";
import { checkPerceptionWriteCap } from "../reader-security.js";
import { canonicalizeForHash } from "../reader-receipt.js";
import {
  SINGLE_PERCEPTION_VALUES,
  PAIRED_PERCEPTION_VALUES,
} from "../reader-perception-client.js";
import { createHash } from "node:crypto";

const AIRTABLE_BASE = "appfxHraqlcpP1AAP";
// Single-mode perception writes to the run row; paired-mode to the paired-analysis
// row. A single receipt can only ever reach RUNS_TABLE, a paired receipt only
// PAIRED_TABLE — enforced by the mode/value guard below.
const RUNS_TABLE = "tblqmHiOCQ5YSXBN3";
const PAIRED_TABLE = "tblP1ekWWWscz6pBG";

const PERCEPTION_MAX_BODY = 256 * 1024;
const AIRTABLE_TIMEOUT_MS = 4500;
const WRITE_RETRY_BACKOFF_MS = 250;

// The five exact, mode-distinguishable enums (design §9), imported from the shared
// vocabulary so client and server never drift. Stored verbatim — never transformed,
// never a "skipped" sentinel (a skip writes nothing at all).
const SINGLE_VALUES = new Set(SINGLE_PERCEPTION_VALUES);
const PAIRED_VALUES = new Set(PAIRED_PERCEPTION_VALUES);

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
// Hex-only guard for the value interpolated into an Airtable filterByFormula. The
// content_hash is a 64-hex SHA-256 by construction; this strips anything else so a
// formula can never be broken out of.
const hexOnly = (s) => String(s || "").replace(/[^a-f0-9]/gi, "");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Recompute the content_hash over the canonical receipt (content_hash nulled by
// canonicalizeForHash, which deep-copies so the input is not mutated) and compare
// to the embedded one. Same integrity rule as the single and paired reads. A
// mismatch means the receipt was tampered with or forged — reject before any write.
export function verifyReceiptIntegrity(receipt) {
  const recomputed = sha256Hex(canonicalizeForHash(receipt));
  return recomputed === receipt.integrity.content_hash;
}

// Structural gate before any hash work: the receipt must be an object of a known
// mode carrying an integrity.content_hash to verify and match. No other field is
// trusted — record targeting uses only the verified hash.
export function validateReceiptShape(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return { ok: false, reason: "shape" };
  if (receipt.receipt_type !== "single" && receipt.receipt_type !== "paired") return { ok: false, reason: "type" };
  const integ = receipt.integrity;
  if (!integ || typeof integ !== "object" || typeof integ.content_hash !== "string" || !integ.content_hash) {
    return { ok: false, reason: "integrity" };
  }
  return { ok: true };
}

// Locate the ONE row whose stored Receipt Hash equals the verified content_hash.
// maxRecords=1: the content_hash is unique per minted receipt (a SHA-256 over the
// full envelope), so at most one row matches. Fails safe: a query error or timeout
// returns no record and the caller rejects — a perception write never proceeds
// against an unverified target. Skipped when AIRTABLE_TOKEN is unset.
export async function findByReceiptHash(table, receiptHash, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetch || fetch;
  const hash = hexOnly(receiptHash);
  if (!env.AIRTABLE_TOKEN || !hash) return { ok: false, record: null };
  const formula = `{Receipt Hash}='${hash}'`;
  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AIRTABLE_TIMEOUT_MS);
  try {
    const r = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}` },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!r.ok) return { ok: false, record: null };
    const data = await r.json();
    const record = Array.isArray(data.records) && data.records[0] ? data.records[0] : null;
    return { ok: true, record };
  } catch {
    clearTimeout(timer);
    return { ok: false, record: null };
  }
}

// PATCH ONLY the Perception Tap field on the located row. PATCH (not PUT) is
// load-bearing: it updates that single field and leaves every other field — the
// consent fields included — exactly as they were. Latest-wins: this overwrites any
// prior Perception Tap value on the same row, never appending a row. Awaited, with
// one retry on a transient (network / 5xx) failure; a final failure returns not-ok
// and the caller reports nothing to the user.
export async function writePerceptionField(table, recordId, value, deps = {}) {
  const env = deps.env || process.env;
  const fetchImpl = deps.fetch || fetch;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${table}/${recordId}`;
  const body = JSON.stringify({ fields: { "Perception Tap": value }, typecast: true });
  const MAX_ATTEMPTS = 2;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const canRetry = attempt < MAX_ATTEMPTS;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), AIRTABLE_TIMEOUT_MS);
    let r;
    try {
      r = await fetchImpl(url, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (canRetry) {
        await delay(WRITE_RETRY_BACKOFF_MS);
        continue;
      }
      return { ok: false, failure_class: e && e.name === "AbortError" ? "timeout" : "network" };
    }
    clearTimeout(timer);
    if (r.ok) return { ok: true };
    if (canRetry && r.status >= 500) {
      await delay(WRITE_RETRY_BACKOFF_MS);
      continue;
    }
    return { ok: false, failure_class: "airtable_http", upstream_status: r.status };
  }
  return { ok: false, failure_class: "unknown" };
}

function reject(res, ctx, reason, status, error, extra = {}) {
  logRuntimeEvent("perception_rejected", {
    request_id: ctx.request_id,
    route: ctx.route,
    reason,
    status,
    duration_ms: totalDurationMs(ctx),
  });
  return res.status(status).json({ error, request_id: ctx.request_id, ...extra });
}

export function createPerceptionHandler(deps = {}) {
  const env = deps.env || process.env;
  const innerDeps = { ...deps, env };

  return async function handler(req, res) {
    const ctx = createRuntimeContext({ route: "/api/reader-perception" });
    logRuntimeEvent("request_received", { request_id: ctx.request_id, route: ctx.route });

    if (req.method !== "POST") return reject(res, ctx, "method_not_allowed", 405, "method");

    const contentLength = Number(req.headers?.["content-length"] || 0);
    if (contentLength > PERCEPTION_MAX_BODY) return reject(res, ctx, "body_too_large", 413, "too_large");

    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reject(res, ctx, "invalid_body", 400, "invalid");
    }
    try {
      if (Buffer.byteLength(JSON.stringify(body), "utf8") > PERCEPTION_MAX_BODY) {
        return reject(res, ctx, "body_too_large", 413, "too_large");
      }
    } catch {
      return reject(res, ctx, "invalid_body", 400, "invalid");
    }

    // The value must be one of the five exact enums. A garbage value is rejected
    // cheaply, before any hash work.
    const value = typeof body.value === "string" ? body.value : "";
    const isSingle = SINGLE_VALUES.has(value);
    const isPaired = PAIRED_VALUES.has(value);
    if (!isSingle && !isPaired) return reject(res, ctx, "invalid_value", 400, "invalid_value");

    // Receipt: structure, then integrity. A tampered/forged envelope is rejected
    // before any record lookup or write.
    const receipt = body.receipt;
    const shape = validateReceiptShape(receipt);
    if (!shape.ok) return reject(res, ctx, "invalid_receipt", 400, "invalid_receipt", { detail: shape.reason });
    if (!verifyReceiptIntegrity(receipt)) {
      return reject(res, ctx, "receipt_hash_mismatch", 400, "invalid_receipt", { detail: "integrity" });
    }

    // Mode/value guard from the VERIFIED receipt_type: a single receipt may write
    // only single_*, a paired receipt only paired_*. This blocks a single receipt
    // from mutating a paired-analysis value and vice versa.
    const mode = receipt.receipt_type; // "single" | "paired"
    if (mode === "single" && !isSingle) return reject(res, ctx, "mode_value_mismatch", 400, "mode_mismatch");
    if (mode === "paired" && !isPaired) return reject(res, ctx, "mode_value_mismatch", 400, "mode_mismatch");

    const contentHash = receipt.integrity.content_hash;

    // Per-receipt write cap — the sole abuse control here. Keyed on the verified
    // content_hash, so it can't be reached without a genuine receipt. Fails closed
    // on a configured-store error.
    const cap = await checkPerceptionWriteCap(contentHash, innerDeps);
    if (!cap.allowed) {
      return reject(res, ctx, "write_cap", 429, "capacity", { store_error: !!cap.storeError });
    }

    // Possession proof, part 2: the verified hash must match a stored Receipt Hash.
    // Locate by that hash alone — never by request_id/open_run_id (one open run may
    // back several paired analyses, so those keys are not unique).
    const table = mode === "single" ? RUNS_TABLE : PAIRED_TABLE;
    const found = await findByReceiptHash(table, contentHash, innerDeps);
    if (!found.record) return reject(res, ctx, "record_not_found", 404, "not_found", { store_ok: found.ok });

    // Write only Perception Tap, latest-wins. On failure, the result/delta/receipt
    // on the client stay intact; the client swallows this silently (failure
    // isolation — a lost perception never breaks a read).
    const write = await writePerceptionField(table, found.record.id, value, innerDeps);
    if (!write.ok) {
      logRuntimeEvent("perception_write_failed", {
        request_id: ctx.request_id,
        route: ctx.route,
        mode,
        failure_class: write.failure_class,
        upstream_status: write.upstream_status,
        duration_ms: totalDurationMs(ctx),
      });
      return res.status(502).json({ error: "write_failed", request_id: ctx.request_id });
    }

    logRuntimeEvent("perception_write_succeeded", {
      request_id: ctx.request_id,
      route: ctx.route,
      mode,
      value,
      duration_ms: totalDurationMs(ctx),
    });
    return res.status(200).json({ ok: true, value, request_id: ctx.request_id });
  };
}

export default createPerceptionHandler();
