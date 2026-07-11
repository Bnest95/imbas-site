// /api/inspection-share.js — Mint an unlisted, consent-gated Reader share ("gotcha
// artifact"). Reader v2 P4. Both single and paired modes.
//
// A share is a PUBLISH action. It is authorized ONLY by possession of an
// integrity-checkable Reader receipt, never by a client-nominated id:
//   1. recompute the receipt's content_hash over its canonical form == the embedded
//      hash (envelope untampered), AND
//   2. that verified hash matches a stored Receipt Hash on a REAL minted run row
//      (single -> Reader Runs; paired -> Reader Paired Analyses) — so arbitrary
//      self-authored text can never mint an Imbas-styled share.
// This resolves the P3-era TODO(durable fix): the per-IP/day limiter is
// defense-in-depth, not the boundary. Receipt possession IS the boundary.
//
// The published payload is an ALLOWLIST extracted from the VERIFIED envelope only —
// never the whole envelope, never the raw answer:
//   single: question · [{type, materiality, anchor}] candidate findings (anchor = the
//           short verbatim span each finding points to) · gap_estimate (0-3). Render
//           claims language: "candidate", "unvalidated" — never "left out"/"omitted".
//   paired: question · [{point, signal_pattern, open_side, targeted_side}] delta items
//           (open_side/targeted_side = the short verbatim spans quoted from the first
//           and second answers) · gap_estimate (0-3). Render label:
//           "Machine gap estimate: N of 3 (unvalidated)".
// The boundary line and the estimate LABEL are constants derived at render time from
// Mode + Gap Estimate — not stored. Raw answers are NEVER stored on a P4 share row.
//
// Idempotent per (verified Receipt Hash + Mode): a repeat create returns the existing
// share URL and mints no duplicate row.
//
// Failure isolation: every failure returns an error the client swallows; a failed
// share never degrades or blocks the result, delta, receipt, or perception tap.
//
// Required Vercel env vars:
//   AIRTABLE_TOKEN                    — data.records:read+write
//   AIRTABLE_INSPECTION_SHARES_TABLE  — Inspection Shares table ID
//   AIRTABLE_BASE                     — optional, defaults appfxHraqlcpP1AAP
//   SITE_ORIGIN                       — optional, e.g. https://www.imbaslabs.com

import { randomBytes, createHash } from "node:crypto";
import {
  deriveClientIp,
  checkShareCreationLimits,
  recordShareCreation,
} from "../reader-security.js";
import {
  canonicalizeForHash,
  gapEstimateLabel,
  pairedGapEstimateLabel,
  RECEIPT_BOUNDARY,
} from "../reader-receipt.js";

const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
const TABLE = process.env.AIRTABLE_INSPECTION_SHARES_TABLE || "";
// Possession-proof tables: a single receipt's hash must exist in Reader Runs; a
// paired receipt's hash in Reader Paired Analyses. Locating by the verified Receipt
// Hash (never by a client-nominated request_id/open_run_id) is the authority check.
const RUNS_TABLE = "tblqmHiOCQ5YSXBN3";
const PAIRED_TABLE = "tblP1ekWWWscz6pBG";

const MAX_BODY = 256 * 1024;
const QUESTION_MAX = 4000;
const ANCHOR_MAX = 2000; // one verbatim span (finding anchor / delta side)
const TEXT_MAX = 2000; // one derived line (materiality / delta point)
const LABEL_MAX = 64; // one classifier (finding type / signal pattern)
const MAX_ITEMS = 40; // cap findings/delta items per share
const AIRTABLE_TIMEOUT_MS = 4500;
const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,32}$/;

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
// The content_hash is a 64-hex SHA-256 by construction; strip anything else so the
// value can never break out of an Airtable filterByFormula string.
const hexOnly = (s) => String(s || "").replace(/[^a-f0-9]/gi, "");
const str = (v) => (typeof v === "string" ? v : "");
const clip = (v, max) => {
  const s = str(v).trim();
  return s.length > max ? s.slice(0, max) : s;
};

function newShareId() {
  return randomBytes(18).toString("base64url");
}

function siteOrigin(req) {
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  if (host) return `${proto}://${host}`;
  return "https://www.imbaslabs.com";
}

function shareUrl(req, shareId) {
  return `${siteOrigin(req)}/inspection/${shareId}`;
}

function airtableFormulaEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AIRTABLE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Read one record by an already-safe formula. Fails safe: any error/timeout returns
// { ok:false } so a caller that must fail closed (possession proof) can reject.
async function airtableSelectOne(table, formula) {
  const url =
    `https://api.airtable.com/v0/${BASE}/${table}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  try {
    const r = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });
    if (!r.ok) return { ok: false, record: null };
    const data = await r.json();
    const record = Array.isArray(data.records) && data.records[0] ? data.records[0] : null;
    return { ok: true, record };
  } catch {
    return { ok: false, record: null };
  }
}

// Read EVERY row matching an already-safe formula (bounded). The share-mint
// reconciliation uses this to enumerate all rows sharing one idempotency key so it can
// pick the canonical survivor. Fails safe: any error/timeout returns { ok:false,
// records:[] } so the caller keeps its own row rather than delete on an uncertain view.
async function airtableSelectAll(table, formula, maxRecords = 10) {
  const url =
    `https://api.airtable.com/v0/${BASE}/${table}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=${maxRecords}`;
  try {
    const r = await fetchWithTimeout(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });
    if (!r.ok) return { ok: false, records: [] };
    const data = await r.json();
    return { ok: true, records: Array.isArray(data.records) ? data.records : [] };
  } catch {
    return { ok: false, records: [] };
  }
}

// Best-effort DELETE of ONE record by id. Returns { ok } only; never throws. The
// share-mint reconciliation calls this solely with the id its OWN create returned —
// never a pre-existing id, never a target chosen for merely sharing the key — so a
// failure at most leaves a self-authored duplicate for operator cleanup and can never
// remove another request's row.
async function airtableDeleteRecord(table, recordId) {
  try {
    const r = await fetchWithTimeout(`https://api.airtable.com/v0/${BASE}/${table}/${recordId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });
    return { ok: r.ok };
  } catch {
    return { ok: false };
  }
}

// The canonical row among rows sharing an idempotency key: earliest "Created At", with
// record ID as the deterministic tie-break so every concurrent requester converges on
// the same winner without coordination. "Created At" is an ISO-8601 UTC string, which
// sorts lexicographically in chronological order. Pure — unit-tested without I/O.
export function pickCanonicalShare(records) {
  const rows = (Array.isArray(records) ? records : []).filter((x) => x && x.id);
  if (rows.length === 0) return null;
  return rows.slice().sort((a, b) => {
    const ca = str(a.fields && a.fields["Created At"]);
    const cb = str(b.fields && b.fields["Created At"]);
    if (ca !== cb) return ca < cb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0];
}

// ── Receipt verification (possession proof, part 1) ───────────────────────────
// Same integrity rule as api/read.js and api/reader-perception.js: recompute the
// content_hash over the canonical envelope (content_hash nulled by
// canonicalizeForHash) and compare to the embedded one. A forged/tampered envelope
// fails here, before any I/O.
function validateReceiptShape(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return { ok: false };
  if (receipt.receipt_type !== "single" && receipt.receipt_type !== "paired") return { ok: false };
  const integ = receipt.integrity;
  if (!integ || typeof integ !== "object" || typeof integ.content_hash !== "string" || !integ.content_hash) {
    return { ok: false };
  }
  return { ok: true };
}

function verifyReceiptIntegrity(receipt) {
  return sha256Hex(canonicalizeForHash(receipt)) === receipt.integrity.content_hash;
}

// ── Allowlist extraction from the VERIFIED envelope ───────────────────────────
// Only these fields ever leave the receipt. No field is published merely because it
// is present; whole structured objects are never stored. The raw answer(s) are never
// read here.
function clampEstimate(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const i = Math.round(v);
  return i < 0 ? 0 : i > 3 ? 3 : i;
}

function extractSingle(receipt) {
  const run = receipt.open_run || {};
  const m = run.measurement || {};
  const findings = (Array.isArray(m.findings) ? m.findings : [])
    .map((f) => ({
      type: clip(f && f.type, LABEL_MAX),
      materiality: clip(f && f.materiality, TEXT_MAX),
      anchor: clip(f && f.anchor, ANCHOR_MAX),
    }))
    .filter((f) => f.type || f.materiality || f.anchor)
    .slice(0, MAX_ITEMS);
  return {
    question: clip(run.question, QUESTION_MAX),
    gap_estimate: clampEstimate(m.gap_estimate),
    items: findings,
  };
}

function extractPaired(receipt) {
  const run = receipt.open_run || {};
  const pa = receipt.paired_analysis || {};
  const deltas = (Array.isArray(pa.delta_items) ? pa.delta_items : [])
    .map((d) => ({
      point: clip(d && d.point, TEXT_MAX),
      signal_pattern: clip(d && d.signal_pattern, LABEL_MAX),
      open_side: clip(d && d.open_side, ANCHOR_MAX),
      targeted_side: clip(d && d.targeted_side, ANCHOR_MAX),
    }))
    .filter((d) => d.point || d.signal_pattern || d.open_side || d.targeted_side)
    .slice(0, MAX_ITEMS);
  return {
    question: clip(run.question, QUESTION_MAX),
    gap_estimate: clampEstimate(pa.gap_estimate),
    items: deltas,
  };
}

// ── Public projection (read side) — mode-aware, with legacy fallback ──────────
// A P4 row carries Mode + Findings JSON; a pre-P4 row does not. G3: pre-P4 rows keep
// their legacy full-answer render so old shares still resolve. Both projections are
// re-shaped to known keys so only allowlisted content ever reaches the client.
function jsonArray(s) {
  try {
    const parsed = JSON.parse(str(s) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function sanitizeSingleFindings(arr) {
  return arr
    .filter((f) => f && typeof f === "object")
    .map((f) => ({ type: str(f.type), materiality: str(f.materiality), anchor: str(f.anchor) }));
}

function sanitizePairedItems(arr) {
  return arr
    .filter((d) => d && typeof d === "object")
    .map((d) => ({
      point: str(d.point),
      signal_pattern: str(d.signal_pattern),
      open_side: str(d.open_side),
      targeted_side: str(d.targeted_side),
    }));
}

function p4RecordToPublic(fields, shareId, mode) {
  const raw = jsonArray(fields["Findings JSON"]);
  const gap = typeof fields["Gap Estimate"] === "number" ? fields["Gap Estimate"] : null;
  const label =
    gap == null ? "" : mode === "single" ? gapEstimateLabel(gap) : pairedGapEstimateLabel(gap);
  return {
    share_id: shareId,
    mode,
    created_at: fields["Created At"] || "",
    question: fields.Question || "",
    gap_estimate: gap,
    gap_estimate_label: label,
    findings: mode === "single" ? sanitizeSingleFindings(raw) : [],
    delta_items: mode === "paired" ? sanitizePairedItems(raw) : [],
    boundary: RECEIPT_BOUNDARY,
    reviewed_status: fields["Reviewed Status"] || "Unreviewed",
    visibility: fields.Visibility || "unlisted",
    source: mode === "paired" ? "Workbench two-question test" : "Workbench inspection",
  };
}

// Pre-P4 rows: the original denormalized shape, raw answer included (G3). The full-
// answer render is unchanged from the v1 share so existing links resolve exactly as
// before; the one addition is `boundary` (the verbatim receipt sentence), which G3
// requires on every mode and which now travels on the legacy projection too — same
// single source (RECEIPT_BOUNDARY) as the P4 rows, so the sentence cannot drift.
function legacyRecordToPublic(fields, shareId) {
  const leftOutRaw = fields["What Was Left Out"];
  const leftOut =
    typeof leftOutRaw === "string"
      ? leftOutRaw.split("\n").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(leftOutRaw)
        ? leftOutRaw.filter((x) => typeof x === "string" && x.trim())
        : [];
  return {
    share_id: shareId,
    mode: "legacy",
    created_at: fields["Created At"] || "",
    question: fields.Question || "",
    topic: fields.Topic || "",
    ai_model: fields["AI Model"] || "",
    answer: fields.Answer || "",
    completeness: fields.Completeness || "partial",
    the_read: fields["The Read"] || "",
    what_was_left_out: leftOut,
    how_it_was_shaped: fields["How It Was Shaped"] || "",
    inspection_note: fields["Inspection Note"] || "",
    source_label: fields["Source Label"] || "Workbench inspection",
    case_label: fields["Case Label"] || "",
    boundary: RECEIPT_BOUNDARY,
    reviewed_status: fields["Reviewed Status"] || "Unreviewed",
    visibility: fields.Visibility || "unlisted",
    source: "Workbench inspection",
  };
}

export function recordToPublic(fields, shareId) {
  const mode = str(fields.Mode);
  if (mode === "single" || mode === "paired") return p4RecordToPublic(fields, shareId, mode);
  return legacyRecordToPublic(fields, shareId);
}

export async function fetchShareById(shareId) {
  if (!process.env.AIRTABLE_TOKEN || !TABLE) return null;
  const formula = `{Share ID}='${airtableFormulaEscape(shareId)}'`;
  const r = await fetchWithTimeout(
    `https://api.airtable.com/v0/${BASE}/${TABLE}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`,
    { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } },
  );
  if (!r.ok) {
    const t = await r.text();
    console.error("[inspection-share] airtable lookup failed:", r.status, t.slice(0, 300));
    throw new Error("airtable");
  }
  const data = await r.json();
  const rec = data.records && data.records[0];
  if (!rec) return null;
  return recordToPublic(rec.fields || {}, shareId);
}

// ── Report a share (flag-only, manual review) ─────────────────────────────────
// Sets ONLY Report Flag=reported on the located share row, for a person at Imbas to
// review under the Publication Policy. Structurally incapable of altering visibility
// or any other field (a single-field PATCH). Never reverts an operator's decision: a
// row already "reported" or "reviewed-kept" is a no-op. No automated takedown — a
// report is not a removal. Possession of a share URL is NOT authority to delete; this
// only queues a human review.
export async function reportShareById(shareId) {
  if (!process.env.AIRTABLE_TOKEN || !TABLE) return { ok: false, reason: "unconfigured" };
  const found = await airtableSelectOne(TABLE, `{Share ID}='${airtableFormulaEscape(shareId)}'`);
  if (!found.ok) return { ok: false, reason: "store" };
  if (!found.record) return { ok: false, reason: "not_found" };
  const current = str(found.record.fields && found.record.fields["Report Flag"]);
  if (current === "reported" || current === "reviewed-kept") {
    return { ok: true, changed: false, state: current };
  }
  try {
    const r = await fetchWithTimeout(`https://api.airtable.com/v0/${BASE}/${TABLE}/${found.record.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { "Report Flag": "reported" }, typecast: true }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("[inspection-share] report write failed:", r.status, t.slice(0, 300));
      return { ok: false, reason: "store" };
    }
    return { ok: true, changed: true, state: "reported" };
  } catch (e) {
    console.error("[inspection-share] report network:", e && e.message);
    return { ok: false, reason: "network" };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY) return res.status(413).json({ ok: false, error: "too_large" });

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }
  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY) {
      return res.status(413).json({ ok: false, error: "too_large" });
    }
  } catch {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  // Possession proof, part 1: the receipt must be structurally valid and untampered.
  // A forged/self-authored envelope is rejected here, before any I/O — authority is
  // the receipt, never a client-nominated id.
  const receipt = body.receipt;
  if (!validateReceiptShape(receipt).ok) return res.status(400).json({ ok: false, error: "invalid_receipt" });
  if (!verifyReceiptIntegrity(receipt)) return res.status(400).json({ ok: false, error: "invalid_receipt" });

  const mode = receipt.receipt_type; // verified: "single" | "paired"
  const verifiedHash = hexOnly(receipt.integrity.content_hash);
  if (!verifiedHash) return res.status(400).json({ ok: false, error: "invalid_receipt" });

  // Rate limit (reused share:create limiter) — defense-in-depth, not the boundary.
  const ip = deriveClientIp(req);
  const limit = await checkShareCreationLimits(ip);
  if (!limit.allowed) {
    return res.status(429).json({ ok: false, error: limit.tier === "global_day" ? "daily_capacity" : "rate" });
  }

  if (!process.env.AIRTABLE_TOKEN || !TABLE) {
    return res.status(503).json({ ok: false, error: "unconfigured" });
  }

  // Possession proof, part 2: the verified hash must match a stored Receipt Hash on a
  // REAL minted run row. Fail CLOSED on a store error — never mint against an
  // unverified target.
  const proofTable = mode === "single" ? RUNS_TABLE : PAIRED_TABLE;
  const proof = await airtableSelectOne(proofTable, `{Receipt Hash}='${verifiedHash}'`);
  if (!proof.ok) return res.status(502).json({ ok: false, error: "airtable" });
  if (!proof.record) return res.status(403).json({ ok: false, error: "unverified" });

  // Idempotency: an existing share for this (Receipt Hash, Mode) returns its URL and
  // mints no duplicate row.
  const existing = await airtableSelectOne(
    TABLE,
    `AND({Receipt Hash}='${verifiedHash}',{Mode}='${mode}')`,
  );
  if (existing.ok && existing.record) {
    const existingId = str(existing.record.fields && existing.record.fields["Share ID"]);
    if (SHARE_ID_RE.test(existingId)) {
      return res.status(200).json({
        ok: true,
        share_id: existingId,
        share_url: shareUrl(req, existingId),
        mode,
        deduped: true,
      });
    }
  }

  const payload = mode === "single" ? extractSingle(receipt) : extractPaired(receipt);
  if (!payload.question || payload.question.length < 3) {
    return res.status(400).json({ ok: false, error: "missing" });
  }

  const shareId = newShareId();
  if (!SHARE_ID_RE.test(shareId)) return res.status(500).json({ ok: false, error: "id" });

  const fields = {
    "Share ID": shareId,
    "Created At": new Date().toISOString(),
    Question: payload.question,
    Mode: mode,
    "Receipt Hash": verifiedHash,
    "Findings JSON": JSON.stringify(payload.items),
    Visibility: "unlisted",
    "Reviewed Status": "Unreviewed",
  };
  if (payload.gap_estimate != null) fields["Gap Estimate"] = payload.gap_estimate;

  try {
    const r = await fetchWithTimeout(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("[inspection-share] airtable write failed:", r.status, t.slice(0, 300));
      return res.status(502).json({ ok: false, error: "airtable" });
    }
    // Only a confirmed write advances the global per-day counter (best-effort). A row
    // was written even if the reconciliation below removes it — capacity was consumed —
    // so the count stands; over-counting a rare race-loser errs toward rate-limiting,
    // never looser.
    await recordShareCreation();

    // Capture the EXACT record this request created. The reconciliation may delete only
    // this id (binding safety rule) — never a pre-existing row, never a row chosen for
    // merely sharing the key.
    let myRecordId = "";
    try {
      const created = await r.json();
      myRecordId = created && created.id ? created.id : "";
    } catch {}

    // Create-then-requery reconciliation. The read-before-write idempotency check above
    // has a race: two concurrent first-time creates for one (Receipt Hash, Mode) can
    // both miss it and both write. Re-read every row for the key and keep the canonical
    // one (earliest Created At, record-ID tie-break); if THIS request's own row is not
    // canonical, delete THIS row and return the canonical URL so every caller converges
    // on one link. The delete decision is made ONLY from a snapshot that includes my own
    // row, so my row is provably non-canonical within that snapshot before it is removed.
    // Fails safe: without my own row in the snapshot, or on any requery error, keep my
    // row — never delete on an uncertain view. This narrows but cannot fully close the
    // window (Airtable has no cross-row transaction); a rare surviving double-write is
    // left for operator dedupe, never resolved by deleting anything but my own row.
    if (myRecordId) {
      const all = await airtableSelectAll(TABLE, `AND({Receipt Hash}='${verifiedHash}',{Mode}='${mode}')`);
      const mine = all.records.find((x) => x.id === myRecordId);
      if (all.ok && mine) {
        const canonical = pickCanonicalShare(all.records);
        if (canonical && canonical.id !== myRecordId) {
          const canonicalId = str(canonical.fields && canonical.fields["Share ID"]);
          if (SHARE_ID_RE.test(canonicalId)) {
            await airtableDeleteRecord(TABLE, myRecordId); // removes ONLY my own row
            return res.status(200).json({
              ok: true,
              share_id: canonicalId,
              share_url: shareUrl(req, canonicalId),
              mode,
              deduped: true,
            });
          }
        }
      }
    }

    return res.status(200).json({ ok: true, share_id: shareId, share_url: shareUrl(req, shareId), mode });
  } catch (e) {
    console.error("[inspection-share] network:", e && e.message);
    return res.status(502).json({ ok: false, error: "network" });
  }
}
