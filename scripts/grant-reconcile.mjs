// scripts/grant-reconcile.mjs — grant-status reconciliation engine (CLI, no public route).
//
// Turns body-free funder-reply evidence + the submissions ledger + a snapshot of the
// Grant Tracker into (1) a minimal, safe set of operational field writes, (2) a
// human-review list for anything ambiguous, and (3) an urgency-ordered action report.
//
// WHY THIS SHAPE. There is no Gmail credential in this environment; Gmail is reachable
// only through an agent's read-only MCP tools. So the nuanced step — reading a funder
// reply and deciding acknowledgment vs. award vs. interview — is inherently agent-driven
// and cannot live in an unattended cron. What CAN be made deterministic, tested, and
// reusable is everything downstream of that read: classification rules, matching to a
// tracker row, reconciliation against current values, the write allowlist, the
// no-downgrade / no-erase / idempotency guards, and the urgency ordering. That is this
// file. The agent (or a future credentialed run) gathers body-free evidence into the
// input shape below; the engine plans; the plan is applied — by --apply here when a
// token exists, or via the Airtable MCP otherwise.
//
// It NEVER: sends or reads email, invents a date/deadline/outcome, overwrites stronger
// human-entered data with weaker inferred data, erases a populated field, or writes a
// field outside WRITE_FIELDS. Ambiguous evidence is routed to human review, never
// written as fact. Re-running with the same evidence produces no new writes.
//
// Usage:
//   node scripts/grant-reconcile.mjs --evidence ev.json --ledger led.json \
//       --tracker snap.json --fieldmap map.json            # dry run: print the plan
//   AIRTABLE_TOKEN=... node scripts/grant-reconcile.mjs ... --apply   # write + verify
//
// Inputs (all JSON; see the schemas near each validator):
//   --evidence   array of body-free evidence items (thread id / sender domain / type)
//   --ledger     grant-engine/applications/submissions-ledger.json (membership check)
//   --tracker    snapshot: [{ record_id, funder, fields: { <fieldId>: value } }]
//   --fieldmap   { submitted, submissionDate, responseCategory, actionRequired,
//                  evidenceRef, result } → Grant Tracker field IDs
//
// Env (only needed for --apply; same convention as api/repository.js):
//   AIRTABLE_TOKEN   PAT with data.records:read + data.records:write on the base
//   AIRTABLE_BASE    optional — default appfxHraqlcpP1AAP
//   AIRTABLE_GRANTS_TABLE  optional — default tbllp4STmYOafMWy3 (Grant Tracker)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

export const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
export const GRANTS_TABLE = process.env.AIRTABLE_GRANTS_TABLE || "tbllp4STmYOafMWy3";

// ---------------------------------------------------------------------------
// Taxonomy. The closed set of reply categories the engine will ever assign.
// "other-uncertain" is the safe sink: anything that does not clear a specific
// bar lands here and is routed to human review rather than written.
// ---------------------------------------------------------------------------
export const CATEGORIES = Object.freeze({
  ACK: "acknowledgment",
  AWARD: "award",
  REJECTION: "rejection",
  INTERVIEW: "interview-meeting",
  MORE_INFO: "more-info-requested",
  REPLY_REQUIRED: "reply-required",
  STATUS_UPDATE: "decision-status-update",
  UNCERTAIN: "other-uncertain",
});

// Reply-type hints the agent may attach after reading a message. Receipt-class types
// prove a funder system received a submission; decision-class types assert an outcome.
const RECEIPT_TYPES = new Set(["acknowledgment", "full_copy_receipt", "agreement_copy"]);
const DECISION_TYPES = new Set(["award", "rejection"]);

// Result singleSelect values that are terminal human decisions — never overwrite these
// with an inferred value.
export const STRONG_RESULTS = new Set(["Accepted", "Rejected", "Withdrawn"]);

// The complete, closed set of logical fields this engine may write. Everything else on
// the Grant Tracker (asks, angle, objections, notes, human freetext) is off-limits.
export const WRITE_FIELDS = Object.freeze([
  "submitted", "submissionDate", "responseCategory", "actionRequired", "evidenceRef", "result",
]);

// Urgency order for the action report (most urgent first). Mirrors the ordering fixed in
// grant-engine/campaign-status.md so the report and the doc never drift.
const URGENCY = [
  CATEGORIES.AWARD,
  CATEGORIES.INTERVIEW,
  CATEGORIES.MORE_INFO,
  CATEGORIES.REPLY_REQUIRED,
  "due-soon",
  CATEGORIES.STATUS_UPDATE,
  CATEGORIES.REJECTION,
  "unmatched",
];

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Airtable returns singleSelect as {id,name,color} via the metadata API but as a plain
// string via REST; tolerate both, plus checkbox/empties, so diffs are robust.
export function normalizeValue(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean") return v;
  if (typeof v === "object" && typeof v.name === "string") return v.name;
  return String(v);
}

function isEmpty(v) {
  const n = normalizeValue(v);
  return n === "" || n === false;
}

// Compare a current cell value against a desired write, tolerant of how Airtable stores
// checkboxes: an unchecked box reads back as ABSENT (normalizes to ""), which must count
// as equal to a desired boolean false. Used for both the idempotency no-op check and the
// --apply read-back verify, so writing false (or clearing a true flag) stays idempotent
// and verifiable. String/date/select values fall through to plain equality.
export function sameValue(current, desired) {
  const d = normalizeValue(desired);
  const c = normalizeValue(current);
  if (typeof d === "boolean") return (c === true) === d;
  return c === d;
}

// ---------------------------------------------------------------------------
// classifyEvidence — pure. Maps one body-free evidence item to a classification.
// Never guesses an outcome: only an explicit decision-type hint yields award/rejection,
// and even then confidence must be "high" before it can drive a Result write. Anything
// without a receipt is submissionConfirmed:false and routed to review.
//
// evidence item shape:
//   { grant_key, funder, record_id, submitted_date,
//     source: "gmail"|"form"|"none", evidence_id: "<threadId>"|"",
//     from_domain, reply_type: "acknowledgment"|"full_copy_receipt"|"agreement_copy"|
//                              "award"|"rejection"|"interview"|"more-info"|
//                              "reply-required"|"status-update"|"none"|"uncertain",
//     asks_response: bool, responded: bool }
// ---------------------------------------------------------------------------
export function classifyEvidence(item, { inLedger } = { inLedger: true }) {
  const reasons = [];
  const source = item.source || "none";
  const type = item.reply_type || "none";
  const hasReceipt = source === "gmail" && RECEIPT_TYPES.has(type);

  // No funder receipt: submission is asserted by campaign records only. Do not confirm,
  // do not categorize a reply that doesn't exist — hand to human review.
  if (source !== "gmail") {
    reasons.push(`no funder email receipt (source=${source}); submission asserted by campaign records only`);
    if (!inLedger) reasons.push("grant not present in submissions ledger — unverified");
    return {
      submissionConfirmed: false,
      category: CATEGORIES.UNCERTAIN,
      actionRequired: false,
      needsReview: true,
      confidence: "asserted",
      reasons,
    };
  }

  if (!inLedger) reasons.push("grant not present in submissions ledger — unverified");

  // Receipt-class reply → acknowledgment (FYI). Promotes to reply-required only when the
  // funder explicitly asked for a response and Brendan has not already sent it.
  if (RECEIPT_TYPES.has(type)) {
    if (item.asks_response && !item.responded) {
      reasons.push("funder explicitly requested a confirmation reply, not yet sent");
      return { submissionConfirmed: true, category: CATEGORIES.REPLY_REQUIRED, actionRequired: true, needsReview: false, confidence: "high", reasons };
    }
    if (item.asks_response && item.responded) reasons.push("confirmation reply already sent — closed");
    reasons.push(`funder-system ${type} confirms receipt`);
    return { submissionConfirmed: true, category: CATEGORIES.ACK, actionRequired: false, needsReview: !inLedger, confidence: inLedger ? "high" : "uncertain", reasons };
  }

  if (type === "reply-required") {
    return { submissionConfirmed: true, category: CATEGORIES.REPLY_REQUIRED, actionRequired: !item.responded, needsReview: false, confidence: "high", reasons: [...reasons, "funder asked for a simple confirmation"] };
  }
  if (type === "interview") {
    return { submissionConfirmed: true, category: CATEGORIES.INTERVIEW, actionRequired: true, needsReview: false, confidence: "high", reasons: [...reasons, "funder asked to schedule a call/meeting"] };
  }
  if (type === "more-info") {
    return { submissionConfirmed: true, category: CATEGORIES.MORE_INFO, actionRequired: true, needsReview: false, confidence: "high", reasons: [...reasons, "funder requested additional information/materials"] };
  }
  if (type === "status-update") {
    return { submissionConfirmed: true, category: CATEGORIES.STATUS_UPDATE, actionRequired: false, needsReview: false, confidence: "high", reasons: [...reasons, "logistics/status update, not a decision"] };
  }
  if (DECISION_TYPES.has(type)) {
    // A decision was asserted. Surface it, but keep it out of automated Result writes
    // unless the agent marked it decisive — "never mark awarded/rejected from weak
    // matching alone."
    const decisive = item.decisive === true;
    const category = type === "award" ? CATEGORIES.AWARD : CATEGORIES.REJECTION;
    return {
      submissionConfirmed: true,
      category,
      actionRequired: type === "award",
      needsReview: !decisive,
      confidence: decisive ? "high" : "uncertain",
      reasons: [...reasons, decisive ? `decision (${type}) marked decisive` : `possible ${type} — not marked decisive, routed to human review`],
    };
  }

  // gmail source but no usable type → uncertain.
  reasons.push("reply present but type could not be established with confidence");
  return { submissionConfirmed: true, category: CATEGORIES.UNCERTAIN, actionRequired: false, needsReview: true, confidence: "uncertain", reasons };
}

// ---------------------------------------------------------------------------
// planRowUpdate — pure. Given the row's CURRENT allowlisted values, the evidence, and
// its classification, compute the minimal field writes, honoring every guard:
//   • allowlist   — only WRITE_FIELDS, only via provided field IDs
//   • no-erase    — never write empty/false over a populated value
//   • no-downgrade— never overwrite a strong human Result, or a human Submission Date
//   • idempotency — drop any field whose current value already equals the target
// Returns { record_id, funder, sets:{fieldId:value}, noops:[...], skips:[...], reasons }.
// ---------------------------------------------------------------------------
export function planRowUpdate(current, item, cls, fieldMap) {
  const cur = current || {};
  const sets = {};
  const noops = [];
  const skips = [];
  const reasons = [];

  const want = {}; // logical field -> desired value, before guards

  // Evidence reference / idempotency anchor: always the stable evidence id when present.
  if (item.evidence_id) want.evidenceRef = item.evidence_id;

  // Only categorize the reply when we are confident. Uncertain/needs-review rows write
  // nothing operational — they go to the review list instead.
  if (!cls.needsReview && cls.category !== CATEGORIES.UNCERTAIN) {
    want.responseCategory = cls.category;
    want.actionRequired = cls.actionRequired === true;
  }

  // Submission confirmation comes only from a funder receipt, never from an assertion.
  if (cls.submissionConfirmed) {
    want.submitted = true;
    if (item.submitted_date) want.submissionDate = item.submitted_date;
  }

  // A terminal outcome may touch Result only when decisive (high confidence).
  if ((cls.category === CATEGORIES.AWARD || cls.category === CATEGORIES.REJECTION) && cls.confidence === "high") {
    want.result = cls.category === CATEGORIES.AWARD ? "Accepted" : "Rejected";
  }

  for (const logical of WRITE_FIELDS) {
    if (!(logical in want)) continue;
    const fieldId = fieldMap[logical];
    if (!fieldId) { skips.push(`${logical}: no field id configured`); continue; }

    const desired = want[logical];

    // no-erase: never let a computed value blank out a field.
    if (isEmpty(desired) && logical !== "actionRequired") { skips.push(`${logical}: refused to write empty`); continue; }

    const currentVal = normalizeValue(cur[fieldId]);

    // idempotency: already equal (checkbox-tolerant) → no-op.
    if (sameValue(cur[fieldId], desired)) { noops.push(logical); continue; }

    // no-downgrade on Result: keep a strong human decision.
    if (logical === "result" && STRONG_RESULTS.has(currentVal) && currentVal !== normalizeValue(desired)) {
      skips.push(`result: kept human value "${currentVal}" (no downgrade)`);
      continue;
    }
    // no-downgrade on Submission Date: a populated human date wins over an inferred one.
    if (logical === "submissionDate" && currentVal && currentVal !== normalizeValue(desired)) {
      skips.push(`submissionDate: kept existing "${currentVal}" (human value preserved)`);
      continue;
    }
    // Response Category / Action Required: if a human already set a different value, do
    // not clobber it on a same-evidence re-run; only supersede when evidence changed.
    if ((logical === "responseCategory") && currentVal && currentVal !== normalizeValue(desired)) {
      const evChanged = normalizeValue(cur[fieldMap.evidenceRef]) !== (item.evidence_id || "");
      if (!evChanged) { skips.push(`responseCategory: kept existing "${currentVal}" (same evidence)`); continue; }
    }

    sets[fieldId] = desired;
  }

  if (Object.keys(sets).length === 0) reasons.push("no changes — row already reconciled");
  return { record_id: item.record_id, funder: item.funder, sets, noops, skips, reasons };
}

// ---------------------------------------------------------------------------
// reconcile — pure. Runs the whole pipeline over the evidence set.
//   plans  : per-row write plans (only rows with a matched record_id)
//   review : ambiguous / unmatched items for a human (never written)
//   actions: urgency-ordered items that need Brendan
// ---------------------------------------------------------------------------
export function reconcile({ evidence, ledger, tracker, fieldMap }) {
  // The ledger keys each submission as grant_id; evidence items carry the same value as
  // grant_key. Tolerate either field name on the ledger side.
  const ledgerKeys = new Set((ledger?.submissions || []).map((s) => s.grant_id ?? s.grant_key));
  const trackerByRec = new Map((tracker || []).map((r) => [r.record_id, r]));
  const seenRecords = new Set();

  const plans = [];
  const review = [];
  const actions = [];

  for (const item of evidence || []) {
    const inLedger = ledgerKeys.has(item.grant_key);
    const cls = classifyEvidence(item, { inLedger });
    const row = item.record_id ? trackerByRec.get(item.record_id) : null;
    if (item.record_id) seenRecords.add(item.record_id);

    if (!row) {
      review.push({ funder: item.funder, grant_key: item.grant_key, why: "no Grant Tracker row matched this evidence", reasons: cls.reasons });
      actions.push({ funder: item.funder, category: "unmatched", actionRequired: false, deadline: item.expected_decision || "", reason: "evidence with no tracker row — needs human match" });
      continue;
    }

    const plan = planRowUpdate(row.fields, item, cls, fieldMap);
    plan.category = cls.category;
    plan.confidence = cls.confidence;
    plan.submissionConfirmed = cls.submissionConfirmed;
    plan.needsReview = cls.needsReview;
    plan.classReasons = cls.reasons;
    plans.push(plan);

    if (cls.needsReview) {
      review.push({ funder: item.funder, grant_key: item.grant_key, record_id: item.record_id, why: cls.reasons.join("; "), expected_decision: item.expected_decision || "" });
    }
    if (cls.actionRequired || (cls.needsReview && item.expected_decision)) {
      actions.push({
        funder: item.funder,
        category: cls.needsReview ? "unmatched" : cls.category,
        actionRequired: cls.actionRequired === true,
        deadline: item.expected_decision || "",
        reason: cls.actionRequired ? `${cls.category}: response owed` : `needs review; watch ~${item.expected_decision}`,
      });
    }
  }

  // Tracker rows that look submitted but no evidence spoke to them at all.
  for (const row of tracker || []) {
    if (seenRecords.has(row.record_id)) continue;
    review.push({ funder: row.funder, record_id: row.record_id, why: "tracker row not covered by any evidence item" });
  }

  actions.sort((a, b) => {
    const ai = URGENCY.indexOf(a.category); const bi = URGENCY.indexOf(b.category);
    const aj = ai === -1 ? URGENCY.length : ai; const bj = bi === -1 ? URGENCY.length : bi;
    if (aj !== bj) return aj - bj;
    // within a class, earliest real deadline first (empty deadlines last)
    const ad = a.deadline || "9999"; const bd = b.deadline || "9999";
    return ad < bd ? -1 : ad > bd ? 1 : 0;
  });

  return { plans, review, actions };
}

// Body-free text report. Prints funder + record id + field ids + category only. Never
// prints a subject line, email address beyond a sender domain, snippet, or body.
export function formatReport({ plans, review, actions }, { apply } = { apply: false }) {
  const lines = [];
  const totalSets = plans.reduce((n, p) => n + Object.keys(p.sets).length, 0);
  lines.push(apply ? "GRANT RECONCILE — APPLY" : "GRANT RECONCILE — DRY RUN (no writes)");
  lines.push(`Rows planned: ${plans.length} · field writes: ${totalSets} · review items: ${review.length} · actions: ${actions.length}`);
  lines.push("");
  lines.push("PLANNED WRITES");
  for (const p of plans) {
    const n = Object.keys(p.sets).length;
    if (n === 0) { lines.push(`  · ${p.funder} [${p.record_id}] — ${p.needsReview ? "no writes (routed to review)" : "no change (already reconciled)"}`); continue; }
    lines.push(`  ✎ ${p.funder} [${p.record_id}] — ${p.category}`);
    for (const [fid, val] of Object.entries(p.sets)) lines.push(`      ${fid} = ${JSON.stringify(val)}`);
    if (p.skips.length) for (const s of p.skips) lines.push(`      skip: ${s}`);
  }
  lines.push("");
  lines.push("HUMAN REVIEW");
  if (review.length === 0) lines.push("  (none)");
  for (const r of review) lines.push(`  ? ${r.funder}${r.record_id ? ` [${r.record_id}]` : ""} — ${r.why}${r.expected_decision ? ` (watch ~${r.expected_decision})` : ""}`);
  lines.push("");
  lines.push("ACTION QUEUE (urgency order)");
  if (actions.length === 0) lines.push("  (nothing owed)");
  for (const a of actions) lines.push(`  ! ${a.funder} — ${a.category}${a.deadline ? ` · ~${a.deadline}` : ""} — ${a.reason}`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Thin IO below. Pure logic above is the tested surface.
// ---------------------------------------------------------------------------
export function parseArgs(args) {
  const opts = { evidence: "", ledger: "", tracker: "", fieldmap: "", apply: false, help: false };
  for (let i = 0; i < args.length; i++) {
    let a = args[i];
    if (a === "--help" || a === "-h") { opts.help = true; continue; }
    if (a === "--apply") { opts.apply = true; continue; }
    if (a === "--dry-run") { opts.apply = false; continue; }
    let inlineVal = null;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) { inlineVal = a.slice(eq + 1); a = a.slice(0, eq); }
    }
    const takeValue = () => {
      if (inlineVal !== null) return inlineVal;
      const next = args[i + 1];
      if (next === undefined) throw new ValidationError(`missing value for ${a}`);
      i++;
      return next;
    };
    switch (a) {
      case "--evidence": opts.evidence = takeValue(); break;
      case "--ledger": opts.ledger = takeValue(); break;
      case "--tracker": opts.tracker = takeValue(); break;
      case "--fieldmap": opts.fieldmap = takeValue(); break;
      default: throw new ValidationError(`unknown argument: ${a}`);
    }
  }
  return opts;
}

const USAGE = `grant-reconcile — plan safe Grant Tracker updates from funder-reply evidence.

Usage:
  node scripts/grant-reconcile.mjs --evidence ev.json --ledger led.json \\
      --tracker snap.json --fieldmap map.json            # dry run (default)
  AIRTABLE_TOKEN=... node scripts/grant-reconcile.mjs ... --apply   # write + verify

Dry run prints the planned writes, the human-review list, and the urgency-ordered
action queue, and changes nothing. --apply writes only the allowlisted fields and reads
each row back to verify. Re-running with the same evidence writes nothing.`;

const airtableHeaders = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

async function patchRecord({ token, recordId, fields, fetchImpl }) {
  const url = `https://api.airtable.com/v0/${BASE}/${GRANTS_TABLE}/${recordId}`;
  const r = await fetchImpl(url, { method: "PATCH", headers: airtableHeaders(token), body: JSON.stringify({ fields, typecast: true }) });
  if (!r.ok) { const t = await r.text(); throw new Error(`Airtable write failed (${r.status}) on ${recordId}: ${t.slice(0, 200)}`); }
  return r.json();
}

async function getRecordFields({ token, recordId, fieldIds, fetchImpl }) {
  const params = new URLSearchParams();
  for (const f of fieldIds) params.append("fields[]", f);
  const url = `https://api.airtable.com/v0/${BASE}/${GRANTS_TABLE}/${recordId}?${params.toString()}`;
  const r = await fetchImpl(url, { headers: airtableHeaders(token) });
  if (!r.ok) { const t = await r.text(); throw new Error(`Airtable read-back failed (${r.status}) on ${recordId}: ${t.slice(0, 200)}`); }
  const data = await r.json();
  return data.fields || {};
}

// Apply a plan and verify by reading the written fields back. Exported for tests with an
// injected fetchImpl — never performs a real network call in tests.
export async function applyPlans(plans, { token, fetchImpl }) {
  const applied = [];
  for (const p of plans) {
    const ids = Object.keys(p.sets);
    if (ids.length === 0) { applied.push({ record_id: p.record_id, wrote: 0, verified: true }); continue; }
    await patchRecord({ token, recordId: p.record_id, fields: p.sets, fetchImpl });
    const back = await getRecordFields({ token, recordId: p.record_id, fieldIds: ids, fetchImpl });
    const problems = [];
    for (const [fid, val] of Object.entries(p.sets)) {
      if (!sameValue(back[fid], val)) problems.push(`${fid} read back as ${JSON.stringify(normalizeValue(back[fid]))}, expected ${JSON.stringify(normalizeValue(val))}`);
    }
    if (problems.length) throw new Error(`write did not verify for ${p.record_id}: ${problems.join("; ")}`);
    applied.push({ record_id: p.record_id, wrote: ids.length, verified: true });
  }
  return applied;
}

// ---------------------------------------------------------------------------
// writeReconcileMarker — stamp a local, gitignored freshness marker after a successful
// --apply, so the Founder Ops brief's NEEDS YOUR ATTENTION section can tell the founder how
// stale the Action Required flags are. Writes only an ISO timestamp — never evidence, funder
// names, or anything from a reply. Impls are injectable for tests; it never touches the
// network. Returns the ISO stamp written.
// ---------------------------------------------------------------------------
export const RECONCILE_MARKER_PATH = ".founder-ops/last-reconcile.txt";

export function writeReconcileMarker({ path = RECONCILE_MARKER_PATH, now = new Date(), writeFileImpl = writeFileSync, mkdirImpl = mkdirSync } = {}) {
  const stamp = (now instanceof Date ? now : new Date()).toISOString();
  mkdirImpl(dirname(path), { recursive: true });
  writeFileImpl(path, stamp + "\n");
  return stamp;
}

function readJson(path, label) {
  let raw;
  try { raw = readFileSync(path, "utf8"); }
  catch (e) { throw new ValidationError(`cannot read ${label} file "${path}": ${e.message}`); }
  try { return JSON.parse(raw); }
  catch (e) { throw new ValidationError(`invalid JSON in ${label} file "${path}": ${e.message}`); }
}

async function main(argv) {
  let opts;
  try { opts = parseArgs(argv); }
  catch (e) { console.error(`error: ${e.message}\n\n${USAGE}`); process.exitCode = 2; return; }
  if (opts.help) { console.log(USAGE); return; }

  for (const req of ["evidence", "ledger", "tracker", "fieldmap"]) {
    if (!opts[req]) { console.error(`error: --${req} is required\n\n${USAGE}`); process.exitCode = 2; return; }
  }

  let evidence, ledger, tracker, fieldMap;
  try {
    evidence = readJson(opts.evidence, "evidence");
    ledger = readJson(opts.ledger, "ledger");
    tracker = readJson(opts.tracker, "tracker");
    fieldMap = readJson(opts.fieldmap, "fieldmap");
  } catch (e) { console.error(`error: ${e.message}`); process.exitCode = 2; return; }

  let result;
  try { result = reconcile({ evidence, ledger, tracker, fieldMap }); }
  catch (e) { console.error(`error: ${e.message}`); process.exitCode = 1; return; }

  if (!opts.apply) { console.log(formatReport(result, { apply: false })); return; }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) { console.error("error: AIRTABLE_TOKEN is not set (needs data.records:read + write). No changes made."); process.exitCode = 3; return; }

  try {
    const applied = await applyPlans(result.plans, { token, fetchImpl: fetch });
    console.log(formatReport(result, { apply: true }));
    const wrote = applied.reduce((n, a) => n + a.wrote, 0);
    console.log(`\nApplied and verified ${wrote} field write(s) across ${applied.filter((a) => a.wrote > 0).length} row(s).`);
    // Stamp the freshness marker for the Founder Ops brief. Non-fatal: a marker failure must
    // never undo a verified Airtable write.
    try {
      const stamp = writeReconcileMarker({ now: new Date() });
      console.error(`Reconcile marker updated: ${stamp} (${RECONCILE_MARKER_PATH}).`);
    } catch (e) {
      console.error(`warning: could not write reconcile marker (${e.message}) — brief freshness will read stale.`);
    }
  } catch (e) { console.error(`error: ${e.message}`); process.exitCode = 4; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
