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
//           short verbatim span each finding points to). Render claims language:
//           "candidate", "unvalidated" — never "left out"/"omitted".
//   paired: question · [{point, signal_pattern, open_side, targeted_side}] delta items
//           (open_side/targeted_side = the short verbatim spans quoted from the first
//           and second answers).
// The boundary line is a constant supplied at render time — not stored. Raw answers
// are NEVER stored on a P4 share row.
//
// Pass 2B-C: a share carries no score. The share page used to publish the receipt's
// 0-3 figure and a rendered label built from it, which put a number a reader cannot
// check on the one Imbas surface a stranger reaches first. What a share publishes now
// is the findings themselves, each with the span it points to, which a reader can hold
// against the question. The figure is untouched wherever it is still generated; this
// endpoint no longer extracts it, stores it, or projects it.
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
import { canonicalizeForHash, RECEIPT_BOUNDARY } from "../reader-receipt.js";
import { sanitizeRunDeclaration, DECLARATION_HISTORY } from "../reader-paired.js";
import {
  declarationIdList,
  serializeDeclarationIds,
  parseDeclarationIds,
  readDeclarationsByIds,
} from "../reader-declaration-log.js";
import { describeReceipt } from "../reader-receipt-page.js";

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
  // The declarations travel with the shared pair, read off the SAME hash-verified
  // receipt as the delta items. They are not one of them: the items are what Imbas
  // measured, and these are what the person said about how they ran it.
  //
  // IDENTITIES ONLY. What the share records is WHICH declarations existed at the moment
  // it was minted, not copies of their content. A snapshot would have to be kept in step
  // with the log to stay true, and the only two ways to do that are to update the share
  // (which would stop it being a dated record) or to let it drift (which would make it a
  // wrong one). The identities are enough: the rows they name are immutable, so reading
  // them back reconstructs the mint-time state exactly, and a declaration made afterward
  // is simply not in the list — which is the whole point. Answers change; this record
  // does not.
  //
  // A declaration this build cannot read stops the mint rather than being dropped from
  // the list. A share is dated and never edited, so an incomplete list written now is
  // wrong for as long as the link lives, and nothing downstream would ever be able to
  // tell that something was missing.
  const raw = Array.isArray(receipt.run_declarations) ? receipt.run_declarations : [];
  const declarations = [];
  let unreadable = false;
  for (const d of raw) {
    try {
      declarations.push(sanitizeRunDeclaration(d));
    } catch {
      unreadable = true;
    }
  }
  return {
    question: clip(run.question, QUESTION_MAX),
    items: deltas,
    declaration_ids: declarationIdList(declarations),
    declaration_unreadable: unreadable,
  };
}

// ── Capture facts, copied off the proof row at mint ───────────────────────────
//
// A dated receipt renders from its own record. It never joins to live state to display
// what it attests to, because a displayed value that depends on a second read
// succeeding is a live query wearing a receipt's clothes — and its failure mode is
// worse than a blank, since flickering to "not recorded" would assert NOT_CAPTURED
// about a value that was captured. So the capture time and the declared model are
// copied here, once, and the render side reads one row.
//
// The proof row is the capture record: it is located by the verified Receipt Hash, so
// the same receipt always resolves to the same row, and that row's timestamp does not
// move. Paired runs carry no model — Reader Paired Analyses has no field for one — and
// that absence is real, so the key is omitted and the receipt says the model was not
// observed rather than borrowing one from the single side.
function captureFromProof(proofFields, mode) {
  const f = proofFields || {};
  const out = {};
  const capturedAt = str(f.Created).trim();
  if (capturedAt) out["Captured At"] = capturedAt;
  const model = mode === "single" ? clip(f["Inspected AI Model"], LABEL_MAX) : "";
  if (model) out["AI Model"] = model;
  return out;
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

// Declaration state for a projection. `resolved` is what the caller read back from the
// declaration log using the ids this row stored at mint; a caller that did not read
// (the sync projection, the QA fixture) passes nothing and gets an honest unresolved
// state rather than a confident empty one.
//
// The states are kept apart on purpose, and this is the one place the earlier snapshot
// design was better and the trade was made anyway. A snapshot could always render;
// identities have to be looked up, and a lookup can fail. So the failure is named:
// NO_DECLARATIONS means the record holds none, UNREADABLE means it holds some this page
// could not read. Collapsing the second into the first would tell a reader that nobody
// declared anything, about a run where somebody did. NOT_APPLICABLE is the third: a
// single-mode share is not a pair, so it owns no declarations for a structural reason
// rather than because its log came back empty.
function declarationProjection(fields, mode, resolved) {
  if (mode !== "paired") {
    return { declaration_ids: [], run_declarations: [], declaration_state: DECLARATION_HISTORY.NOT_APPLICABLE };
  }
  const ids = parseDeclarationIds(fields["Declaration IDs"]);
  if (!ids.length) {
    return { declaration_ids: [], run_declarations: [], declaration_state: DECLARATION_HISTORY.NONE };
  }
  if (!resolved || !resolved.ok) {
    return {
      declaration_ids: ids,
      run_declarations: [],
      declaration_state: (resolved && resolved.state) || DECLARATION_HISTORY.UNREADABLE,
    };
  }
  const out = {
    declaration_ids: ids,
    run_declarations: Array.isArray(resolved.declarations) ? resolved.declarations : [],
    declaration_state: resolved.state,
  };
  if (Array.isArray(resolved.conflicts) && resolved.conflicts.length) {
    out.declaration_conflicts = resolved.conflicts;
  }
  return out;
}

function p4RecordToPublic(fields, shareId, mode, resolved) {
  const raw = jsonArray(fields["Findings JSON"]);
  return {
    share_id: shareId,
    mode,
    created_at: fields["Created At"] || "",
    // The dated receipt's two anchor facts. Empty means the record does not hold the
    // value, and the page says so — never a default, never the neighbouring clock.
    captured_at: fields["Captured At"] || "",
    ai_model: fields["AI Model"] || "",
    question: fields.Question || "",
    findings: mode === "single" ? sanitizeSingleFindings(raw) : [],
    delta_items: mode === "paired" ? sanitizePairedItems(raw) : [],
    // Paired only. A row with no ids — including every share minted before the column
    // existed — comes back NO_DECLARATIONS, so the page reports that nothing was
    // declared instead of rendering a blank the reader has to interpret.
    // The DERIVED matched state is not here and never was: it stayed in the browser.
    ...declarationProjection(fields, mode, resolved),
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
    // Uniform receipt shape across projections. Pre-P4 rows were minted before anything
    // copied the capture time, so this is empty on every one of them, and the receipt
    // states the capture time as unobserved rather than showing when the link was made.
    captured_at: fields["Captured At"] || "",
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

// `resolved` is the already-read declaration history for this row's stored identities.
// The projection stays synchronous so the QA harness and the unit tests can call it on a
// fixture row without a store; the read is the caller's job, and fetchShareById below
// does it.
export function recordToPublic(fields, shareId, resolved) {
  const mode = str(fields.Mode);
  const record =
    mode === "single" || mode === "paired"
      ? p4RecordToPublic(fields, shareId, mode, resolved)
      : legacyRecordToPublic(fields, shareId);
  // The dated receipt travels on the projection, built from the row that was just read
  // and from nothing else. The page is a classic script that computes nothing, and this
  // keeps it that way: one record in, one rendered receipt out, identical on every load.
  return { ...record, receipt: describeReceipt(record) };
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
  const fields = rec.fields || {};
  // The second read, and the only one. It resolves the declaration identities this row
  // stored at mint into the declarations themselves.
  //
  // This is a join, and this file otherwise refuses to join a dated receipt to live
  // state. The distinction that makes it allowed: declaration rows are append-only and
  // never updated, so the rows behind these ids cannot have changed since the share was
  // minted — there is no live value to disagree with. What can still happen is that the
  // read fails, and that outcome is carried through as UNREADABLE rather than as an
  // absence, which is the case the old snapshot design could not produce and the reason
  // the state is named on the projection at all.
  let resolved = null;
  if (str(fields.Mode) === "paired") {
    const ids = parseDeclarationIds(fields["Declaration IDs"]);
    if (ids.length) resolved = await readDeclarationsByIds(ids);
  }
  return recordToPublic(fields, shareId, resolved);
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
  // Refuse to mint a dated record whose declaration list is already known to be short.
  // Nothing downstream could ever detect the gap, and the link would carry it forever.
  if (payload.declaration_unreadable) {
    return res.status(400).json({ ok: false, error: "declaration" });
  }

  const shareId = newShareId();
  if (!SHARE_ID_RE.test(shareId)) return res.status(500).json({ ok: false, error: "id" });

  // The two facts a dated receipt is dated by. They come off the proof row, not the
  // client envelope and not this process's clock, and the proof row is already in hand
  // from the possession check above — so this costs no extra read and cannot disagree
  // with the row that authorized the share. Absent values are omitted, never written
  // empty: the receipt states an unheld value as unobserved, and an empty string in a
  // dateTime field is a write error rather than a recorded absence.
  const fields = {
    "Share ID": shareId,
    // Share-mint time. Distinct from "Captured At" below, and load-bearing on its own:
    // pickCanonicalShare resolves a concurrent-write race by earliest "Created At", so
    // this must stay this process's clock and must never be aliased to the capture time
    // — two mints of one receipt would carry an identical capture time and collapse the
    // tiebreak to record-ID alone.
    "Created At": new Date().toISOString(),
    Question: payload.question,
    Mode: mode,
    "Receipt Hash": verifiedHash,
    "Findings JSON": JSON.stringify(payload.items),
    // Paired only, and only when something was actually declared. Identities, newline-
    // joined, in the order the receipt carried them — the house convention for a list in
    // a text cell. Written once, here, and never PATCHed: the list is the set of
    // declarations that existed at this instant, and a later correction appends to the
    // LOG, not to this row. A single-mode share has no declaration to carry, and writing
    // an empty cell on a paired share nobody filled in would be indistinguishable from
    // one that predates the column — so the key is omitted and the read side supplies
    // the absence.
    ...(payload.declaration_ids && payload.declaration_ids.length
      ? { "Declaration IDs": serializeDeclarationIds(payload.declaration_ids) }
      : {}),
    Visibility: "unlisted",
    "Reviewed Status": "Unreviewed",
    // Written once, here, and never after. A product rerun mints a new row rather than
    // updating this one, which is what lets the page promise the record does not change.
    // Concurrent mints copy identical values from the same proof row, so this is safe
    // under the race the reconciliation below resolves.
    ...captureFromProof(proof.record.fields, mode),
  };

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
