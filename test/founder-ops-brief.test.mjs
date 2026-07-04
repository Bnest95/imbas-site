// test/founder-ops-brief.test.mjs — pure-logic tests for the Founder Ops Daily Brief engine.
//
// Synthetic fixtures ONLY. No real Gmail bodies/addresses/subjects, no real grant text, no
// real Airtable ids, no real case content, and no network. Funders are fake ("Acme Fund"),
// thread ids and hashes are placeholders, case IDs are made up. The engine is fed the same
// body-free bundle shape the agent assembles from MCP reads, so these tests exercise the
// real reused logic (grant-reconcile, check-submission-snapshots, imbas-metrics) end to end.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildBrief,
  renderBrief,
  summarizeGrants,
  detectGrantContradictions,
  summarizeSnapshots,
  summarizeImbas,
  actionCandidatesFrom,
  scoreAction,
  rankAndSplit,
  diffState,
  stateFromBrief,
  assertStateClean,
  buildWarnings,
  parseArgs,
  STATE_SCHEMA,
  SCORE_MAX,
  TIER_HIGH,
  TIER_MEDIUM,
} from "../scripts/founder-ops-brief.mjs";

// ---------------------------------------------------------------------------
// Synthetic fixture factories. Field ids are shape-only placeholders.
// ---------------------------------------------------------------------------
const FM = {
  submitted: "fldSubmit00000001",
  submissionDate: "fldSubdate0000001",
  responseCategory: "fldRespcat0000001",
  actionRequired: "fldAction00000001",
  evidenceRef: "fldEviref00000001",
  result: "fldResult00000001",
  status: "fldStatus00000001",
};

function ledger(ids) {
  return { submissions: ids.map((id) => ({ grant_id: id, funder: id })) };
}

// A body-free funder-reply evidence item. Only operational hints — never a body/subject.
function ev(over = {}) {
  return {
    grant_key: "ACME",
    funder: "Acme Fund",
    record_id: "recACME0000000001",
    submitted_date: "2026-07-01",
    source: "gmail",
    evidence_id: "thread-placeholder",
    from_domain: "example.org",
    reply_type: "acknowledgment",
    asks_response: false,
    responded: false,
    ...over,
  };
}

function row(record_id, funder, fields = {}) {
  return { record_id, funder, fields };
}
function submittedRow(record_id, funder) {
  return row(record_id, funder, { [FM.status]: "Submitted" });
}

function grantsBundle({ evidence = [], trackerRows = [], ledgerIds = [], available = true } = {}) {
  return { available, evidence, ledger: ledger(ledgerIds), tracker: trackerRows, fieldMap: FM };
}

function caseRec(id, { severity, name, source, humanConfirmed } = {}) {
  const fields = { "Case ID": id, Name: name ?? `Case ${id}` };
  if (severity !== undefined) fields["Severity"] = severity;
  if (source !== undefined) fields["Source Candidate ID"] = source;
  if (humanConfirmed !== undefined) fields["Human Confirmed"] = humanConfirmed;
  return { id: `rec${id}`, fields };
}
function repoRec(status, { promotedTo } = {}) {
  const fields = { "Triage Status": status };
  if (promotedTo !== undefined) fields["Promoted To Case"] = promotedTo;
  return { fields };
}
function runRec({ version, hash, source, model } = {}) {
  const fields = {};
  if (version !== undefined) fields["Reader Prompt Version"] = version;
  if (hash !== undefined) fields["Source Content Hash"] = hash;
  if (source !== undefined) fields["Source"] = source;
  if (model !== undefined) fields["Inspected AI Model"] = model;
  return { fields };
}
function imbasBundle({ cases = [], repository = [], readerRuns = [], available = true } = {}) {
  return { available, cases, repository, readerRuns };
}

function snapEntry(grant_id, present) {
  return present
    ? { grant_id, funder: grant_id, artifact_status: "snapshot_present", artifacts: [{ file: `${grant_id}.md`, sha256: "a".repeat(64) }] }
    : { grant_id, funder: grant_id, artifact_status: "submission_version_unknown", artifacts: [] };
}
function snapshotsBundle({ present = [], unknown = [], available = true } = {}) {
  return { available, ledger: { submissions: [...present.map((g) => snapEntry(g, true)), ...unknown.map((g) => snapEntry(g, false))] } };
}

function bundle({ grants, imbas, snapshots, date = "2026-07-03", generatedAt = "2026-07-03T12:00:00.000Z" } = {}) {
  const b = { generatedAt, date };
  if (grants !== undefined) b.grants = grants;
  if (imbas !== undefined) b.imbas = imbas;
  if (snapshots !== undefined) b.snapshots = snapshots;
  return b;
}

// A representative bundle exercising all three sources, with one ack, one unverified
// contradiction, an unscored substantive case, an untriaged repo, and a synthetic probe.
function fullBundle() {
  return bundle({
    grants: grantsBundle({
      ledgerIds: ["ACME"],
      evidence: [ev()],
      trackerRows: [
        row("recACME0000000001", "Acme Fund", { [FM.status]: "Submitted", [FM.submitted]: true }),
        submittedRow("recPULITZER00001", "Pulitzer Center"),
      ],
    }),
    imbas: imbasBundle({
      cases: [caseRec("001", { severity: 2 }), caseRec("002", {})],
      repository: [repoRec("new"), repoRec("new")],
      readerRuns: [runRec({}), runRec({ version: "reader-v3", hash: "h".repeat(16), source: "probe", model: "provenance-probe" })],
    }),
    snapshots: snapshotsBundle({ present: ["g1"], unknown: ["g2"] }),
  });
}

// ---------------------------------------------------------------------------
// Priority model — deterministic bounded score + tier.
// ---------------------------------------------------------------------------
test("scoreAction applies the fixed weight formula and tiers", () => {
  // 1*3 + 1*3 + 1*4 + 1*2 + 1*4 + (3-1)*2 = 20 → Medium boundary.
  const mid = scoreAction({ factors: { upside: 1, probability: 1, urgency: 1, unblock: 1, integrityRisk: 1, effort: 1 } });
  assert.equal(mid.score, 20);
  assert.equal(mid.tier, "Medium");
  assert.equal(TIER_MEDIUM, 20);

  // Everything maxed with zero effort: 9+9+12+6+12+6 = 54 = SCORE_MAX.
  const hi = scoreAction({ factors: { upside: 3, probability: 3, urgency: 3, unblock: 3, integrityRisk: 3, effort: 0 } });
  assert.equal(hi.score, SCORE_MAX);
  assert.equal(hi.score, 54);
  assert.equal(hi.tier, "High");
  assert.ok(hi.score >= TIER_HIGH);

  // All zero, max effort → 0, Low.
  const lo = scoreAction({ factors: { upside: 0, probability: 0, urgency: 0, unblock: 0, integrityRisk: 0, effort: 3 } });
  assert.equal(lo.score, 0);
  assert.equal(lo.tier, "Low");
  assert.equal(lo.effortLabel, "large");

  // Out-of-range factors are clamped to 0..3, not trusted blindly.
  const clamped = scoreAction({ factors: { upside: 99, probability: -5, urgency: 3, unblock: 3, integrityRisk: 3, effort: 7 } });
  assert.equal(clamped.factors.upside, 3);
  assert.equal(clamped.factors.probability, 0);
  assert.equal(clamped.factors.effort, 3);
});

test("documented category presets score to their documented tiers", () => {
  const preset = (factors) => scoreAction({ factors }).score;
  assert.equal(preset({ upside: 3, probability: 3, urgency: 3, unblock: 2, integrityRisk: 1, effort: 1 }), 42); // award
  assert.equal(preset({ upside: 3, probability: 3, urgency: 3, unblock: 1, integrityRisk: 1, effort: 1 }), 40); // interview
  assert.equal(preset({ upside: 3, probability: 3, urgency: 3, unblock: 1, integrityRisk: 1, effort: 2 }), 38); // more-info
  assert.equal(preset({ upside: 2, probability: 3, urgency: 3, unblock: 1, integrityRisk: 1, effort: 0 }), 39); // reply-required
  assert.equal(preset({ upside: 0, probability: 2, urgency: 2, unblock: 1, integrityRisk: 3, effort: 1 }), 32); // unverified
  assert.equal(preset({ upside: 1, probability: 2, urgency: 1, unblock: 2, integrityRisk: 1, effort: 1 }), 25); // triage / first-promotion
  assert.equal(preset({ upside: 1, probability: 2, urgency: 1, unblock: 1, integrityRisk: 1, effort: 2 }), 21); // unscored substantive
  assert.equal(preset({ upside: 0, probability: 1, urgency: 1, unblock: 1, integrityRisk: 2, effort: 2 }), 19); // snapshot gaps
});

// ---------------------------------------------------------------------------
// GRANTS — acknowledgments are FYI, replies that owe a response are actions.
// ---------------------------------------------------------------------------
test("an acknowledgment is FYI and never becomes an action", () => {
  const m = buildBrief(
    bundle({ grants: grantsBundle({ ledgerIds: ["ACME"], evidence: [ev()], trackerRows: [row("recACME0000000001", "Acme Fund")] }) }),
    null,
  );
  assert.ok(m.grantSummary.acknowledgments.includes("Acme Fund"));
  // No action candidate at all references the acknowledged funder.
  const all = [...m.ranked.today, ...m.ranked.week];
  assert.equal(all.find((a) => a.id.includes("Acme Fund")), undefined);
  // The reconciler owes nothing.
  assert.equal(m.grantSummary.actions.filter((a) => a.actionRequired === true).length, 0);
  // It is listed under NO-ACTION, not as a task.
  assert.match(renderBrief(m), /funder acknowledgment\(s\) on file/);
});

test("a reply-required funder message becomes a High today action (score 39)", () => {
  const m = buildBrief(
    bundle({ grants: grantsBundle({ ledgerIds: ["ACME"], evidence: [ev({ reply_type: "reply-required", responded: false })], trackerRows: [row("recACME0000000001", "Acme Fund")] }) }),
    null,
  );
  const a = m.ranked.today.find((x) => x.id === "grant:reply-required:Acme Fund");
  assert.ok(a, "reply-required action present today");
  assert.equal(a.tier, "High");
  assert.equal(a.score, 39);
});

test("interview outranks more-info, and both are High today actions", () => {
  const m = buildBrief(
    bundle({
      grants: grantsBundle({
        ledgerIds: ["ACME", "BETA"],
        evidence: [
          ev({ grant_key: "ACME", funder: "Acme Fund", record_id: "recACME0000000001", reply_type: "interview" }),
          ev({ grant_key: "BETA", funder: "Beta Trust", record_id: "recBETA0000000001", reply_type: "more-info" }),
        ],
        trackerRows: [row("recACME0000000001", "Acme Fund"), row("recBETA0000000001", "Beta Trust")],
      }),
    }),
    null,
  );
  const ids = m.ranked.today.map((a) => a.id);
  const iIdx = ids.indexOf("grant:interview-meeting:Acme Fund");
  const mIdx = ids.indexOf("grant:more-info-requested:Beta Trust");
  assert.ok(iIdx !== -1 && mIdx !== -1);
  assert.ok(iIdx < mIdx, "interview ranks above more-info");
  assert.equal(m.ranked.today[iIdx].score, 40);
  assert.equal(m.ranked.today[iIdx].tier, "High");
  assert.equal(m.ranked.today[mIdx].score, 38);
  assert.equal(m.ranked.today[mIdx].tier, "High");
});

test("a decisive award is the top-ranked today action (score 42)", () => {
  const m = buildBrief(
    bundle({ grants: grantsBundle({ ledgerIds: ["ACME"], evidence: [ev({ reply_type: "award", decisive: true })], trackerRows: [row("recACME0000000001", "Acme Fund")] }) }),
    null,
  );
  const a = m.ranked.today[0];
  assert.equal(a.id, "grant:award:Acme Fund");
  assert.equal(a.score, 42);
  assert.equal(a.tier, "High");
});

// ---------------------------------------------------------------------------
// GRANTS — the Pulitzer failure mode. Status asserts submission; nothing proves it.
// ---------------------------------------------------------------------------
test("a tracker row that says Submitted with no confirming evidence stays UNVERIFIED", () => {
  const m = buildBrief(
    bundle({ grants: grantsBundle({ ledgerIds: [], evidence: [], trackerRows: [submittedRow("recPULITZER00001", "Pulitzer Center")] }) }),
    null,
  );
  const c = m.contradictions.find((x) => x.funder === "Pulitzer Center");
  assert.ok(c, "unverified Submitted row surfaced as a contradiction");
  assert.equal(c.trackerStatus, "Submitted");
  // It is never counted as confirmed/acknowledged.
  assert.equal(m.grantSummary.acknowledgments.includes("Pulitzer Center"), false);
  // It becomes an integrity action today (Medium, score 32) with ZERO funding upside.
  const act = m.ranked.today.find((x) => x.id === "grant:unverified:Pulitzer Center");
  assert.ok(act);
  assert.equal(act.score, 32);
  assert.equal(act.tier, "Medium");
  assert.equal(act.factors.upside, 0);
  // A warning is raised — never a silent clean grant state.
  assert.ok(m.warnings.some((w) => /assert submission with no confirming evidence/.test(w)));
});

test("Gmail/Airtable disagreement is surfaced, not silently resolved to Airtable", () => {
  // Tracker Status = Submitted, but the only evidence is a non-gmail campaign assertion.
  const m = buildBrief(
    bundle({
      grants: grantsBundle({
        ledgerIds: [],
        evidence: [ev({ grant_key: "NONLIN", funder: "Nonlinear", record_id: "recNONLIN0000001", source: "none", reply_type: "none", evidence_id: "" })],
        trackerRows: [row("recNONLIN0000001", "Nonlinear", { [FM.status]: "Submitted" })],
      }),
    }),
    null,
  );
  const c = m.contradictions.find((x) => x.funder === "Nonlinear");
  assert.ok(c, "disagreement surfaced when Status=Submitted but evidence does not confirm");
  assert.match(renderBrief(m), /Unverified \/ contradictory \(1\)/);
});

test("a human-confirmed strong Result or a set Submitted box is not re-flagged as unverified", () => {
  // Never downgrade a human Accepted/Rejected/Withdrawn, and respect a persisted Submitted box.
  const m = buildBrief(
    bundle({
      grants: grantsBundle({
        trackerRows: [
          row("recWON00000000001", "Won Fund", { [FM.status]: "Submitted", [FM.result]: "Accepted" }),
          row("recBOX00000000001", "Boxed Fund", { [FM.status]: "Submitted", [FM.submitted]: true }),
        ],
      }),
    }),
    null,
  );
  assert.equal(m.contradictions.find((c) => c.funder === "Won Fund"), undefined);
  assert.equal(m.contradictions.find((c) => c.funder === "Boxed Fund"), undefined);
});

// ---------------------------------------------------------------------------
// IMBAS OPERATIONS — live operational state, kept separate from public metrics.
// ---------------------------------------------------------------------------
test("summarizeImbas separates substantive from control gaps and counts lineage state", () => {
  const i = summarizeImbas(
    imbasBundle({
      cases: [
        caseRec("001", { severity: 2 }),
        caseRec("002", {}), // substantive gap
        caseRec("003", { name: "Baseline (control)" }), // control, intentionally unscored
        caseRec("004", { severity: 1, humanConfirmed: true }),
      ],
      repository: [repoRec("new"), repoRec("candidate_for_review"), repoRec("promoted")],
      readerRuns: [runRec({ version: "reader-v3", hash: "h".repeat(16), source: "live", model: "gpt-x" })],
    }),
  );
  assert.deepEqual(i.cases.unscoredSubstantive, ["002"]);
  assert.deepEqual(i.cases.unscoredControls, ["003"]);
  assert.equal(i.cases.scored, 2);
  assert.equal(i.cases.humanConfirmed, 1);
  assert.equal(i.repository.newCount, 1);
  assert.equal(i.repository.reviewCount, 1);
  assert.equal(i.repository.promotedCount, 1);
  assert.equal(i.lineage.operated, true); // a promoted status exists
  assert.equal(i.readerRuns.populated, 1);
  assert.equal(i.readerRuns.ratePct, 100);
});

test("a synthetic provenance probe is flagged, not read as organic coverage", () => {
  const m = buildBrief(
    bundle({ imbas: imbasBundle({ readerRuns: [runRec({ version: "reader-v3", hash: "h".repeat(16), source: "probe", model: "provenance-probe" })] }) }),
    null,
  );
  assert.equal(m.imbas.readerRuns.syntheticProbe, 1);
  assert.equal(m.imbas.readerRuns.populated, 1);
  assert.ok(m.warnings.some((w) => /synthetic probe/.test(w)));
});

test("the brief labels Imbas counts as live operational state, distinct from the public Ledger", () => {
  const out = renderBrief(buildBrief(fullBundle(), null));
  assert.match(out, /Live operational counts/);
  assert.match(out, /separate from the locked public Numbers Ledger/);
});

test("unscored substantive cases become a week action; controls never do", () => {
  const m = buildBrief(
    bundle({ imbas: imbasBundle({ cases: [caseRec("002", {}), caseRec("003", { name: "X (control)" })] }) }),
    null,
  );
  const a = m.ranked.week.find((x) => x.id === "imbas:unscored-substantive");
  assert.ok(a);
  assert.equal(a.score, 21);
  assert.match(a.basis, /002/);
  assert.ok(!a.basis.includes("003"), "control id is not a substantive gap");
});

// ---------------------------------------------------------------------------
// CHANGE DETECTION — baseline, no-change, and each delta type.
// ---------------------------------------------------------------------------
test("first run with no prior state is the baseline (no invented changes)", () => {
  const m = buildBrief(fullBundle(), null);
  assert.equal(m.diff.isBaseline, true);
  assert.deepEqual(m.diff.changes, []);
  assert.match(renderBrief(m), /Baseline run/);
});

test("a second run with identical evidence reports no material change", () => {
  const m1 = buildBrief(fullBundle(), null);
  const m2 = buildBrief(fullBundle(), m1.state);
  assert.equal(m2.diff.isBaseline, false);
  assert.deepEqual(m2.diff.changes, []);
  assert.match(renderBrief(m2), /No material changes since the prior run/);
});

test("a new funder reply appears as a delta", () => {
  const m1 = buildBrief(bundle({ grants: grantsBundle({ ledgerIds: [], evidence: [], trackerRows: [] }) }), null);
  const m2 = buildBrief(
    bundle({ grants: grantsBundle({ ledgerIds: ["ACME"], evidence: [ev({ reply_type: "interview" })], trackerRows: [row("recACME0000000001", "Acme Fund")] }) }),
    m1.state,
  );
  assert.ok(m2.diff.changes.some((c) => /New funder reply reconciled: Acme Fund \(interview-meeting\)/.test(c)));
});

test("snapshot coverage change is detected", () => {
  const m1 = buildBrief(bundle({ snapshots: snapshotsBundle({ present: ["g1"], unknown: ["g2"] }) }), null);
  const m2 = buildBrief(bundle({ snapshots: snapshotsBundle({ present: ["g1", "g2"], unknown: [] }) }), m1.state);
  assert.ok(m2.diff.changes.some((c) => /Snapshot coverage: 1 → 2 present/.test(c)));
});

test("Repository count/state change is detected", () => {
  const m1 = buildBrief(bundle({ imbas: imbasBundle({ repository: [repoRec("new"), repoRec("new")] }) }), null);
  const m2 = buildBrief(bundle({ imbas: imbasBundle({ repository: [repoRec("new"), repoRec("new"), repoRec("new")] }) }), m1.state);
  assert.ok(m2.diff.changes.some((c) => /Repository "new": 2 → 3/.test(c)));
  assert.ok(m2.diff.changes.some((c) => /Repository total: 2 → 3/.test(c)));
});

test("provenance coverage change is detected", () => {
  const m1 = buildBrief(bundle({ imbas: imbasBundle({ readerRuns: [runRec({}), runRec({})] }) }), null);
  const m2 = buildBrief(
    bundle({ imbas: imbasBundle({ readerRuns: [runRec({ version: "reader-v3", hash: "h".repeat(16) }), runRec({})] }) }),
    m1.state,
  );
  assert.ok(m2.diff.changes.some((c) => /Provenance coverage: 0% → 50%/.test(c)));
});

test("promotion/lineage state change is detected", () => {
  const m1 = buildBrief(bundle({ imbas: imbasBundle({ repository: [repoRec("new")], cases: [caseRec("001", { severity: 2 })] }) }), null);
  assert.equal(m1.imbas.lineage.operated, false);
  const m2 = buildBrief(
    bundle({ imbas: imbasBundle({ repository: [repoRec("new")], cases: [caseRec("001", { severity: 2, source: "cand-xyz" })] }) }),
    m1.state,
  );
  assert.equal(m2.imbas.lineage.operated, true);
  assert.ok(m2.diff.changes.some((c) => /Promotion\/lineage workflow: never operated → operated/.test(c)));
});

// ---------------------------------------------------------------------------
// Determinism.
// ---------------------------------------------------------------------------
test("ranking is deterministic regardless of input order", () => {
  const evs = [
    ev({ grant_key: "A", funder: "A Fund", record_id: "recA00000000000001", reply_type: "interview" }),
    ev({ grant_key: "B", funder: "B Fund", record_id: "recB00000000000001", reply_type: "more-info" }),
    ev({ grant_key: "C", funder: "C Fund", record_id: "recC00000000000001", reply_type: "reply-required" }),
  ];
  const rows = [row("recA00000000000001", "A Fund"), row("recB00000000000001", "B Fund"), row("recC00000000000001", "C Fund")];
  const mk = (order) => buildBrief(bundle({ grants: grantsBundle({ ledgerIds: ["A", "B", "C"], evidence: order, trackerRows: rows }) }), null);
  const a = mk(evs).ranked.today.map((x) => x.id);
  const b = mk([evs[2], evs[0], evs[1]]).ranked.today.map((x) => x.id);
  assert.deepEqual(a, b);
  // interview(40) > reply-required(39) > more-info(38).
  assert.deepEqual(a, ["grant:interview-meeting:A Fund", "grant:reply-required:C Fund", "grant:more-info-requested:B Fund"]);
});

// ---------------------------------------------------------------------------
// Privacy — no sensitive content in the render or saved state.
// ---------------------------------------------------------------------------
test("planted sensitive content in non-consumed fields never reaches the render or state", () => {
  const SECRET = "SECRET_DO_NOT_LEAK_9f3a";
  const EMAIL = "person@private.example.com";
  const m = buildBrief(
    bundle({
      grants: grantsBundle({
        ledgerIds: ["ACME"],
        evidence: [ev({ reply_type: "interview", subject: SECRET, body: SECRET, from_address: EMAIL })],
        trackerRows: [row("recACME0000000001", "Acme Fund", { [FM.status]: "Submitted", [FM.submitted]: true })],
      }),
      imbas: imbasBundle({
        cases: [{ id: "rec001", fields: { "Case ID": "001", Name: "Case 001", Prompt: SECRET, Answer: SECRET } }],
        readerRuns: [{ fields: { "Reader Prompt Version": "reader-v3", "Source Content Hash": SECRET, Source: "live", "Inspected AI Model": "gpt-x", Answer: SECRET } }],
      }),
      snapshots: snapshotsBundle({ present: ["g1"] }),
    }),
    null,
  );
  const out = renderBrief(m);
  const stateStr = JSON.stringify(m.state);
  assert.ok(!out.includes(SECRET), "secret absent from render");
  assert.ok(!stateStr.includes(SECRET), "secret absent from state (incl. the source hash value)");
  assert.ok(!out.includes(EMAIL), "email absent from render");
  assert.ok(!stateStr.includes("@"), "no email-like content in state");
});

test("saved state contains only allowlisted operational fields", () => {
  const m = buildBrief(fullBundle(), null);
  assert.equal(assertStateClean(m.state), true);
  assert.equal(m.state.schema, STATE_SCHEMA);
  assert.deepEqual(Object.keys(m.state).sort(), ["date", "generatedAt", "grants", "imbas", "schema", "topTodayIds", "topWeekIds"]);
  assert.deepEqual(
    Object.keys(m.state.grants).sort(),
    ["byCategory", "categoryByFunder", "contradictionFunders", "replyActionCount", "snapshotPresent", "snapshotUnknown", "trackerRows"],
  );
  assert.deepEqual(
    Object.keys(m.state.imbas).sort(),
    [
      "casesScored", "casesTotal", "casesWithLineage", "lineageOperated", "promptVersions", "provenancePopulated",
      "provenanceRatePct", "repoNew", "repoPromoted", "repoReview", "repoTotal", "runsTotal", "unscoredSubstantiveCount", "unscoredSubstantiveIds",
    ],
  );
  // Defense in depth: any stray key throws at every level.
  assert.throws(() => assertStateClean({ ...m.state, leaked: "x" }), /state leak: unexpected root key/);
  assert.throws(() => assertStateClean({ ...m.state, grants: { ...m.state.grants, oops: 1 } }), /state leak: unexpected grants key/);
  assert.throws(() => assertStateClean({ ...m.state, imbas: { ...m.state.imbas, oops: 1 } }), /state leak: unexpected imbas key/);
});

// ---------------------------------------------------------------------------
// Robustness — a failed input source is surfaced, never a silent clean bill.
// ---------------------------------------------------------------------------
test("an unavailable grant source is surfaced as a warning and an incomplete section", () => {
  const m = buildBrief(
    bundle({ grants: { available: false }, imbas: imbasBundle({ cases: [caseRec("001", { severity: 1 })] }), snapshots: snapshotsBundle({ present: ["g1"] }) }),
    null,
  );
  assert.equal(m.availability.grants, false);
  assert.ok(m.warnings.some((w) => /GRANTS INPUT UNAVAILABLE/.test(w)));
  assert.match(renderBrief(m), /INPUT UNAVAILABLE/);
});

test("an unavailable imbas or snapshot source each raise their own warning", () => {
  const mi = buildBrief(bundle({ grants: grantsBundle({}), imbas: { available: false }, snapshots: snapshotsBundle({}) }), null);
  assert.ok(mi.warnings.some((w) => /IMBAS INPUT UNAVAILABLE/.test(w)));
  const ms = buildBrief(bundle({ grants: grantsBundle({}), imbas: imbasBundle({}), snapshots: { available: false } }), null);
  assert.ok(ms.warnings.some((w) => /SNAPSHOT INPUT UNAVAILABLE/.test(w)));
});

test("a fully empty bundle is all-unavailable, never a clean bill of health", () => {
  const m = buildBrief(bundle({}), null);
  assert.equal(m.availability.grants, false);
  assert.equal(m.availability.imbas, false);
  assert.equal(m.availability.snapshots, false);
  assert.ok(m.warnings.length >= 3);
  assert.equal(buildWarnings(m).length >= 3, true);
});

// ---------------------------------------------------------------------------
// CLI arg parsing.
// ---------------------------------------------------------------------------
test("parseArgs supports inline = , flags, and rejects bad usage", () => {
  const o = parseArgs(["--input=bundle.json", "--state", "s.json", "--save-state"]);
  assert.equal(o.input, "bundle.json");
  assert.equal(o.state, "s.json");
  assert.equal(o.saveState, true);
  assert.equal(o.out, "");
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
  assert.throws(() => parseArgs(["--input"]), /missing value/);
});

// ---------------------------------------------------------------------------
// Spot-checks on the smaller pure helpers used above.
// ---------------------------------------------------------------------------
test("summarizeSnapshots and summarizeGrants degrade safely when unavailable", () => {
  assert.equal(summarizeSnapshots({ available: false }).available, false);
  assert.equal(summarizeSnapshots(undefined).total, 0);
  assert.equal(summarizeGrants({ available: false }).available, false);
  assert.deepEqual(summarizeGrants(undefined).acknowledgments, []);
});

test("detectGrantContradictions returns nothing when the grant source is absent", () => {
  assert.deepEqual(detectGrantContradictions(undefined, summarizeGrants(undefined)), []);
  assert.deepEqual(detectGrantContradictions({ available: false }, summarizeGrants({ available: false })), []);
});

test("actionCandidatesFrom yields no candidates from empty summaries", () => {
  const cands = actionCandidatesFrom({
    grantSummary: summarizeGrants(undefined),
    contradictions: [],
    snapshots: summarizeSnapshots(undefined),
    imbas: summarizeImbas(undefined),
  });
  assert.deepEqual(cands, []);
  const { today, week } = rankAndSplit(cands);
  assert.deepEqual(today, []);
  assert.deepEqual(week, []);
});

test("diffState signals baseline only when there is no prior state", () => {
  assert.equal(diffState(null, stateFromBrief(buildBrief(fullBundle(), null))).isBaseline, true);
  const s = stateFromBrief(buildBrief(fullBundle(), null));
  assert.equal(diffState(s, s).isBaseline, false);
  assert.deepEqual(diffState(s, s).changes, []);
});
