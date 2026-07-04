// test/grant-reconcile.test.mjs — pure-logic tests for the grant reconciliation engine.
// Synthetic fixtures only: no real Gmail bodies, addresses, subjects, or grant content,
// and no real network calls (applyPlans is driven by an injected fake fetch).

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CATEGORIES,
  WRITE_FIELDS,
  STRONG_RESULTS,
  normalizeValue,
  sameValue,
  classifyEvidence,
  planRowUpdate,
  reconcile,
  formatReport,
  applyPlans,
  parseArgs,
  ValidationError,
} from "../scripts/grant-reconcile.mjs";

// Synthetic field-id map (shape only; values are not real Airtable ids).
const FM = {
  submitted: "fldSubmit00000001",
  submissionDate: "fldSubdate0000001",
  responseCategory: "fldRespcat0000001",
  actionRequired: "fldAction00000001",
  evidenceRef: "fldEviref00000001",
  result: "fldResult00000001",
};

const ackItem = (over = {}) => ({
  grant_key: "ACME", funder: "Acme Fund", record_id: "recAAAA00000000001",
  submitted_date: "2026-07-01", source: "gmail", evidence_id: "thread-acme-1",
  from_domain: "acme.org", reply_type: "acknowledgment", asks_response: false, responded: false,
  ...over,
});

// ---------------------------------------------------------------------------
// classifyEvidence
// ---------------------------------------------------------------------------
test("acknowledgment confirms submission, no action, no review", () => {
  const c = classifyEvidence(ackItem(), { inLedger: true });
  assert.equal(c.category, CATEGORIES.ACK);
  assert.equal(c.submissionConfirmed, true);
  assert.equal(c.actionRequired, false);
  assert.equal(c.needsReview, false);
  assert.equal(c.confidence, "high");
});

test("full_copy_receipt and agreement_copy also count as acknowledgment receipts", () => {
  for (const t of ["full_copy_receipt", "agreement_copy"]) {
    const c = classifyEvidence(ackItem({ reply_type: t }), { inLedger: true });
    assert.equal(c.category, CATEGORIES.ACK);
    assert.equal(c.submissionConfirmed, true);
  }
});

test("ack that explicitly asks for a reply (not yet sent) becomes reply-required + action", () => {
  const c = classifyEvidence(ackItem({ asks_response: true, responded: false }), { inLedger: true });
  assert.equal(c.category, CATEGORIES.REPLY_REQUIRED);
  assert.equal(c.actionRequired, true);
});

test("ack that asked for a reply already sent is a closed acknowledgment", () => {
  const c = classifyEvidence(ackItem({ asks_response: true, responded: true }), { inLedger: true });
  assert.equal(c.category, CATEGORIES.ACK);
  assert.equal(c.actionRequired, false);
});

test("no receipt (source=none) never confirms submission and is routed to review", () => {
  const c = classifyEvidence(ackItem({ source: "none", evidence_id: "", reply_type: "none" }), { inLedger: true });
  assert.equal(c.submissionConfirmed, false);
  assert.equal(c.needsReview, true);
  assert.equal(c.confidence, "asserted");
});

test("not-in-ledger acknowledgment is flagged for review even with a receipt", () => {
  const c = classifyEvidence(ackItem(), { inLedger: false });
  assert.equal(c.needsReview, true);
  assert.match(c.reasons.join(" "), /not present in submissions ledger/);
});

test("award is only decisive (high confidence) when explicitly marked", () => {
  const soft = classifyEvidence(ackItem({ reply_type: "award" }), { inLedger: true });
  assert.equal(soft.category, CATEGORIES.AWARD);
  assert.equal(soft.needsReview, true);       // not decisive → review
  assert.equal(soft.confidence, "uncertain");
  const hard = classifyEvidence(ackItem({ reply_type: "award", decisive: true }), { inLedger: true });
  assert.equal(hard.needsReview, false);
  assert.equal(hard.confidence, "high");
  assert.equal(hard.actionRequired, true);
});

test("interview and more-info require action; status-update does not", () => {
  assert.equal(classifyEvidence(ackItem({ reply_type: "interview" }), { inLedger: true }).category, CATEGORIES.INTERVIEW);
  assert.equal(classifyEvidence(ackItem({ reply_type: "interview" }), { inLedger: true }).actionRequired, true);
  assert.equal(classifyEvidence(ackItem({ reply_type: "more-info" }), { inLedger: true }).actionRequired, true);
  assert.equal(classifyEvidence(ackItem({ reply_type: "status-update" }), { inLedger: true }).actionRequired, false);
});

test("gmail reply with an unknown type is uncertain and routed to review", () => {
  const c = classifyEvidence(ackItem({ reply_type: "uncertain" }), { inLedger: true });
  assert.equal(c.category, CATEGORIES.UNCERTAIN);
  assert.equal(c.needsReview, true);
});

// ---------------------------------------------------------------------------
// planRowUpdate — guards
// ---------------------------------------------------------------------------
test("fresh row gets all high-confidence writes", () => {
  const cls = classifyEvidence(ackItem(), { inLedger: true });
  const plan = planRowUpdate({}, ackItem(), cls, FM);
  assert.equal(plan.sets[FM.submitted], true);
  assert.equal(plan.sets[FM.submissionDate], "2026-07-01");
  assert.equal(plan.sets[FM.responseCategory], CATEGORIES.ACK);
  assert.equal(plan.sets[FM.evidenceRef], "thread-acme-1");
  // Action Required=false is a no-op on an already-unchecked box (idempotent), not a write.
  assert.ok(!(FM.actionRequired in plan.sets));
  assert.ok(plan.noops.includes("actionRequired"));
});

test("actionRequired is written when true, and cleared true→false when resolved", () => {
  const item = ackItem({ reply_type: "interview" });
  const cls = classifyEvidence(item, { inLedger: true });
  assert.equal(cls.actionRequired, true);
  // Fresh row: the true flag is written.
  const set = planRowUpdate({}, item, cls, FM);
  assert.equal(set.sets[FM.actionRequired], true);
  // A prior true flag being resolved to false IS a real write (clearing), not a no-op.
  const ack = ackItem();
  const clr = planRowUpdate({ [FM.actionRequired]: true }, ack, classifyEvidence(ack, { inLedger: true }), FM);
  assert.equal(clr.sets[FM.actionRequired], false);
});

test("idempotency: re-running against already-reconciled values writes nothing", () => {
  const item = ackItem();
  const cls = classifyEvidence(item, { inLedger: true });
  const current = {
    [FM.submitted]: true,
    [FM.submissionDate]: "2026-07-01",
    [FM.responseCategory]: CATEGORIES.ACK,
    [FM.actionRequired]: false,
    [FM.evidenceRef]: "thread-acme-1",
  };
  const plan = planRowUpdate(current, item, cls, FM);
  assert.equal(Object.keys(plan.sets).length, 0);
  assert.ok(plan.noops.length > 0);
});

test("no-erase: an empty computed value never blanks a populated field", () => {
  // submitted_date missing → submissionDate must not be written at all.
  const item = ackItem({ submitted_date: "" });
  const cls = classifyEvidence(item, { inLedger: true });
  const plan = planRowUpdate({ [FM.submissionDate]: "2026-06-30" }, item, cls, FM);
  assert.ok(!(FM.submissionDate in plan.sets));
});

test("no-downgrade: a strong human Result is never overwritten", () => {
  const item = ackItem({ reply_type: "rejection", decisive: true });
  const cls = classifyEvidence(item, { inLedger: true });
  assert.ok(STRONG_RESULTS.has("Accepted"));
  const plan = planRowUpdate({ [FM.result]: "Accepted" }, item, cls, FM); // human says Accepted
  assert.ok(!(FM.result in plan.sets));
  assert.match(plan.skips.join(" "), /no downgrade/);
});

test("no-downgrade: an existing human Submission Date is preserved", () => {
  const item = ackItem({ submitted_date: "2026-07-01" });
  const cls = classifyEvidence(item, { inLedger: true });
  const plan = planRowUpdate({ [FM.submissionDate]: "2026-06-15" }, item, cls, FM);
  assert.ok(!(FM.submissionDate in plan.sets));
  assert.match(plan.skips.join(" "), /human value preserved/);
});

test("allowlist: a logical field with no configured id is skipped, not written", () => {
  const item = ackItem();
  const cls = classifyEvidence(item, { inLedger: true });
  const partial = { ...FM, evidenceRef: "" }; // unconfigured
  const plan = planRowUpdate({}, item, cls, partial);
  assert.ok(!Object.values(plan.sets).includes("thread-acme-1"));
});

test("needs-review rows write no reply category or action", () => {
  const item = ackItem({ source: "none", evidence_id: "", reply_type: "none" });
  const cls = classifyEvidence(item, { inLedger: true });
  const plan = planRowUpdate({}, item, cls, FM);
  assert.ok(!(FM.responseCategory in plan.sets));
  assert.ok(!(FM.submitted in plan.sets)); // no receipt → not confirmed
});

test("planRowUpdate only ever emits allowlisted field ids", () => {
  const item = ackItem();
  const cls = classifyEvidence(item, { inLedger: true });
  const plan = planRowUpdate({}, item, cls, FM);
  const allowed = new Set(WRITE_FIELDS.map((k) => FM[k]));
  for (const fid of Object.keys(plan.sets)) assert.ok(allowed.has(fid), `${fid} not allowlisted`);
});

// ---------------------------------------------------------------------------
// reconcile — pipeline
// ---------------------------------------------------------------------------
// The real submissions-ledger.json keys each entry as grant_id — match that here so the
// membership check is exercised the way production runs it.
const ledgerOf = (...keys) => ({ submissions: keys.map((k) => ({ grant_id: k })) });

test("ledger membership is read from grant_id (matches submissions-ledger.json schema)", () => {
  const evidence = [ackItem({ grant_key: "IN", funder: "In Fund", record_id: "recIn" })];
  const tracker = [{ record_id: "recIn", funder: "In Fund", fields: {} }];
  const res = reconcile({ evidence, ledger: { submissions: [{ grant_id: "IN" }] }, tracker, fieldMap: FM });
  // In-ledger acknowledgment is high-confidence and must NOT be routed to review.
  assert.equal(res.review.length, 0);
  assert.match(res.plans[0].classReasons.join(" "), /confirms receipt/);
});

test("reconcile matches rows, collects review items, and orders actions by urgency", () => {
  const evidence = [
    ackItem({ grant_key: "ACK1", funder: "Ack Fund", record_id: "rec1" }),
    ackItem({ grant_key: "IVW", funder: "Interview Fund", record_id: "rec2", reply_type: "interview" }),
    ackItem({ grant_key: "AWD", funder: "Award Fund", record_id: "rec3", reply_type: "award", decisive: true }),
    ackItem({ grant_key: "NONE", funder: "No Receipt Fund", record_id: "rec4", source: "none", evidence_id: "", reply_type: "none", expected_decision: "2026-07-12" }),
  ];
  const tracker = [
    { record_id: "rec1", funder: "Ack Fund", fields: {} },
    { record_id: "rec2", funder: "Interview Fund", fields: {} },
    { record_id: "rec3", funder: "Award Fund", fields: {} },
    { record_id: "rec4", funder: "No Receipt Fund", fields: {} },
    { record_id: "rec5", funder: "Orphan Fund", fields: {} }, // no evidence at all
  ];
  const res = reconcile({ evidence, ledger: ledgerOf("ACK1", "IVW", "AWD"), tracker, fieldMap: FM });
  assert.equal(res.plans.length, 4);
  // Award first, then interview, in the action queue.
  assert.equal(res.actions[0].category, CATEGORIES.AWARD);
  assert.equal(res.actions[1].category, CATEGORIES.INTERVIEW);
  // Orphan tracker row + not-in-ledger no-receipt row are both in review.
  const reviewFunders = res.review.map((r) => r.funder);
  assert.ok(reviewFunders.includes("Orphan Fund"));
  assert.ok(reviewFunders.includes("No Receipt Fund"));
});

test("reconcile: evidence whose record_id matches no row goes to review + unmatched action", () => {
  const evidence = [ackItem({ grant_key: "X", funder: "Ghost", record_id: "recGhost" })];
  const res = reconcile({ evidence, ledger: ledgerOf("X"), tracker: [], fieldMap: FM });
  assert.equal(res.plans.length, 0);
  assert.equal(res.review[0].funder, "Ghost");
  assert.equal(res.actions[0].category, "unmatched");
});

// ---------------------------------------------------------------------------
// formatReport — must not leak private content
// ---------------------------------------------------------------------------
test("formatReport prints ids/categories but no email address, subject, or snippet", () => {
  const evidence = [ackItem({ from_domain: "secret.example.com" })];
  const res = reconcile({ evidence, ledger: ledgerOf("ACME"), tracker: [{ record_id: "recAAAA00000000001", funder: "Acme Fund", fields: {} }], fieldMap: FM });
  const out = formatReport(res, { apply: false });
  assert.match(out, /Acme Fund/);
  assert.match(out, /fldSubmit00000001/);
  assert.doesNotMatch(out, /@/);            // no email addresses
  assert.doesNotMatch(out, /subject/i);     // no subject lines
  assert.doesNotMatch(out, /snippet/i);     // no snippets
});

// ---------------------------------------------------------------------------
// applyPlans — injected fake fetch, no real network
// ---------------------------------------------------------------------------
function fakeAirtable() {
  const store = new Map();
  const calls = { patch: 0, get: 0 };
  const fetchImpl = async (url, init = {}) => {
    const recId = url.split("/").pop().split("?")[0];
    if ((init.method || "GET") === "PATCH") {
      calls.patch++;
      const body = JSON.parse(init.body);
      store.set(recId, { ...(store.get(recId) || {}), ...body.fields });
      return { ok: true, status: 200, json: async () => ({ id: recId, fields: store.get(recId) }) };
    }
    calls.get++;
    return { ok: true, status: 200, json: async () => ({ id: recId, fields: store.get(recId) || {} }) };
  };
  return { fetchImpl, calls, store };
}

test("applyPlans writes each plan and verifies the read-back", async () => {
  const item = ackItem();
  const cls = classifyEvidence(item, { inLedger: true });
  const plan = planRowUpdate({}, item, cls, FM);
  plan.record_id = "recAAAA00000000001";
  const fake = fakeAirtable();
  const applied = await applyPlans([plan], { token: "fake", fetchImpl: fake.fetchImpl });
  assert.equal(applied[0].verified, true);
  assert.ok(applied[0].wrote > 0);
  assert.equal(fake.calls.patch, 1);
  assert.equal(fake.calls.get, 1);
});

test("applyPlans skips rows with no sets and makes no network calls for them", async () => {
  const fake = fakeAirtable();
  const applied = await applyPlans([{ record_id: "recEmpty", sets: {} }], { token: "fake", fetchImpl: fake.fetchImpl });
  assert.equal(applied[0].wrote, 0);
  assert.equal(fake.calls.patch, 0);
  assert.equal(fake.calls.get, 0);
});

test("applyPlans throws if a write does not verify", async () => {
  const badFetch = async (url, init = {}) => {
    if ((init.method || "GET") === "PATCH") return { ok: true, status: 200, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ fields: {} }) }; // read-back empty → mismatch
  };
  await assert.rejects(
    applyPlans([{ record_id: "recX", sets: { [FM.submitted]: true } }], { token: "fake", fetchImpl: badFetch }),
    /did not verify/,
  );
});

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------
test("parseArgs reads file flags and defaults to dry-run", () => {
  const o = parseArgs(["--evidence", "e.json", "--ledger", "l.json", "--tracker", "t.json", "--fieldmap", "m.json"]);
  assert.equal(o.evidence, "e.json");
  assert.equal(o.apply, false);
});

test("parseArgs supports --apply and inline = values", () => {
  const o = parseArgs(["--evidence=e.json", "--apply"]);
  assert.equal(o.evidence, "e.json");
  assert.equal(o.apply, true);
});

test("parseArgs throws on an unknown flag", () => {
  assert.throws(() => parseArgs(["--nope"]), ValidationError);
});

test("normalizeValue tolerates singleSelect object, string, boolean, and null", () => {
  assert.equal(normalizeValue({ id: "x", name: "Accepted" }), "Accepted");
  assert.equal(normalizeValue("Accepted"), "Accepted");
  assert.equal(normalizeValue(true), true);
  assert.equal(normalizeValue(null), "");
});

// ---------------------------------------------------------------------------
// Checkbox tolerance — Airtable returns an unchecked box as ABSENT, not false.
// ---------------------------------------------------------------------------
test("sameValue treats an absent cell as equal to a desired boolean false", () => {
  assert.equal(sameValue(undefined, false), true);   // unchecked box read-back
  assert.equal(sameValue("", false), true);
  assert.equal(sameValue(false, false), true);
  assert.equal(sameValue(true, false), false);
  assert.equal(sameValue(undefined, true), false);
  assert.equal(sameValue(true, true), true);
  assert.equal(sameValue("Accepted", "Accepted"), true);
  assert.equal(sameValue("Accepted", "Rejected"), false);
});

test("idempotency holds when Action Required=false was stored as an absent checkbox", () => {
  const item = ackItem();
  const cls = classifyEvidence(item, { inLedger: true });
  // Everything reconciled, but the false checkbox comes back absent (Airtable behavior).
  const current = {
    [FM.submitted]: true,
    [FM.submissionDate]: "2026-07-01",
    [FM.responseCategory]: CATEGORIES.ACK,
    // FM.actionRequired intentionally absent
    [FM.evidenceRef]: "thread-acme-1",
  };
  const plan = planRowUpdate(current, item, cls, FM);
  assert.equal(Object.keys(plan.sets).length, 0, "absent false checkbox must not trigger a re-write");
});

test("applyPlans verifies a false checkbox even when Airtable drops it on read-back", async () => {
  // Fake Airtable that stores writes but omits falsey checkbox values on read-back.
  const store = new Map();
  const fetchImpl = async (url, init = {}) => {
    const recId = url.split("/").pop().split("?")[0];
    if ((init.method || "GET") === "PATCH") {
      const body = JSON.parse(init.body);
      const kept = {};
      for (const [k, v] of Object.entries(body.fields)) if (v !== false) kept[k] = v; // drop false
      store.set(recId, { ...(store.get(recId) || {}), ...kept });
      return { ok: true, status: 200, json: async () => ({ fields: store.get(recId) }) };
    }
    return { ok: true, status: 200, json: async () => ({ fields: store.get(recId) || {} }) };
  };
  const plan = { record_id: "recCB", sets: { [FM.submitted]: true, [FM.actionRequired]: false } };
  const applied = await applyPlans([plan], { token: "fake", fetchImpl });
  assert.equal(applied[0].verified, true);
});
