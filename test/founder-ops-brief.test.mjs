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
  summarizeGrantMomentum,
  summarizeAttention,
  parseDeadline,
  summarizeSnapshots,
  summarizeImbas,
  actionCandidatesFrom,
  scoreAction,
  rankAndSplit,
  diffState,
  stateFromBrief,
  assertStateClean,
  buildWarnings,
  auditBundle,
  scanForSensitive,
  SENSITIVE_MAX_STRING,
  parseArgs,
  STATE_SCHEMA,
  SCORE_MAX,
  TIER_HIGH,
  TIER_MEDIUM,
  DEADLINE_WINDOW_DAYS,
  PIPELINE_ENUM_CAP,
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
  deadline: "fldDeadline000001",
  followUpDate: "fldFollowup000001",
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
  // Body-free by contract: only status + a filename count reach the bundle — never a raw
  // artifact hash (the engine consumes artifact_status only; a sha256 is a "hash value").
  return present
    ? { grant_id, funder: grant_id, artifact_status: "snapshot_present", artifacts: [{ file: `${grant_id}.md` }] }
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
  const o = parseArgs(["--input=bundle.json", "--state", "s.json", "--save-state", "--audit"]);
  assert.equal(o.input, "bundle.json");
  assert.equal(o.state, "s.json");
  assert.equal(o.saveState, true);
  assert.equal(o.audit, true);
  assert.equal(o.out, "");
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
  assert.throws(() => parseArgs(["--input"]), /missing value/);
});

// ---------------------------------------------------------------------------
// Unattended leak gate (--audit / auditBundle / scanForSensitive).
// ---------------------------------------------------------------------------
test("auditBundle passes a clean body-free bundle", () => {
  assert.deepEqual(auditBundle(fullBundle()), []);
});

test("audit flags a planted email address by path and kind, never the value", () => {
  const b = fullBundle();
  b.grants.evidence[0].from_domain = "grants@secret-funder.org"; // full address, not a domain
  const hits = auditBundle(b);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, "email-address");
  assert.match(hits[0].path, /grants\.evidence\[0\]\.from_domain/);
  // the report object carries path + kind only — the matched value is never echoed
  assert.deepEqual(Object.keys(hits[0]).sort(), ["kind", "path"]);
  assert.equal(JSON.stringify(hits).includes("secret-funder"), false);
});

test("audit flags a content-hash and an api-token but allows a 16-hex thread id", () => {
  const b = fullBundle();
  b.grants.evidence[0].evidence_id = "19f1c58aa9e34095";        // 16-hex Gmail thread id — allowed
  b.imbas.readerRuns[1].fields["Source Content Hash"] = "d".repeat(64); // real hash — blocked
  b.grants.tracker[0].fields[FM.evidenceRef] = "sk-ant-api03-DEADbeef"; // token — blocked
  const kinds = auditBundle(b).map((h) => h.kind).sort();
  assert.deepEqual(kinds, ["api-token", "content-hash"]);
});

test("audit flags an overlong string (a body/prompt/answer stuffed into a field)", () => {
  const b = fullBundle();
  b.grants.evidence[0].reply_type = "x".repeat(SENSITIVE_MAX_STRING + 1);
  const hits = scanForSensitive(b, "bundle");
  assert.equal(hits.some((h) => h.kind === "overlong-string"), true);
});

test("scanForSensitive also guards the rendered brief and state (output side)", () => {
  // A clean run's own render and state must themselves pass the same gate. The brief is a
  // document (legitimately long), so the length heuristic is disabled for it; pattern checks stay.
  const model = buildBrief(fullBundle(), null);
  assert.deepEqual(scanForSensitive(renderBrief(model), "brief", { maxString: Infinity }), []);
  assert.deepEqual(scanForSensitive(model.state, "state"), []);
});

// ---------------------------------------------------------------------------
// GRANT MOMENTUM — the forward funnel read straight from the tracker snapshot.
// ---------------------------------------------------------------------------
const JUL5 = new Date(Date.UTC(2026, 6, 5)); // 2026-07-05, UTC midnight
function momentumGrants(trackerRows) {
  return { available: true, evidence: [], ledger: ledger([]), tracker: trackerRows, fieldMap: FM };
}

test("grant momentum counts submitted, the decided breakdown, and awaiting (Pending folds into awaiting)", () => {
  const gm = summarizeGrantMomentum(momentumGrants([
    row("rec1", "Award Fund", { [FM.submitted]: true, [FM.result]: "Accepted" }),
    row("rec2", "Reject Fund", { [FM.submitted]: true, [FM.result]: "Rejected" }),
    row("rec3", "Noresp Fund", { [FM.submitted]: true, [FM.result]: "No response" }),
    row("rec4", "Pending Fund", { [FM.submitted]: true, [FM.result]: "Pending" }), // Pending → awaiting, NOT decided
    row("rec5", "Await Fund", { [FM.submitted]: true }), // empty Result → awaiting
    row("rec6", "Weird Fund", { [FM.submitted]: true, [FM.result]: "Interviewing" }), // out-of-enum → defensive "other"
  ]), { now: JUL5 });
  assert.equal(gm.submittedCount, 6);
  assert.deepEqual(gm.decided.awards.map((x) => x.funder), ["Award Fund"]);
  assert.deepEqual(gm.decided.declines.map((x) => x.funder), ["Noresp Fund", "Reject Fund"]);
  // Pending no longer lands in "other"; only a value outside the live Result enum does.
  assert.deepEqual(gm.decided.other.map((x) => x.funder), ["Weird Fund"]);
  assert.equal(gm.decided.other[0].result, "Interviewing");
  // Empty Result AND explicit "Pending" both count as awaiting, sorted by funder.
  assert.deepEqual(gm.awaiting.map((x) => x.funder), ["Await Fund", "Pending Fund"]);
});

test("pipeline outstanding excludes submitted rows and terminal-Status rows", () => {
  const gm = summarizeGrantMomentum(momentumGrants([
    row("rec1", "Drafting Fund", { [FM.status]: "Drafting" }),   // in flight → outstanding
    row("rec2", "Ready Fund", { [FM.status]: "Ready" }),          // in flight → outstanding
    row("rec3", "Skip Fund", { [FM.status]: "Skip" }),            // terminal, unsubmitted → excluded
    row("rec4", "Deferred Fund", { [FM.status]: "Deferred" }),    // terminal → excluded
    row("rec5", "Sent Fund", { [FM.status]: "Submitted", [FM.submitted]: true }), // submitted → excluded
    row("rec6", "Unset Fund", {}),                                // no status, unsubmitted → outstanding
  ]), { now: JUL5 });
  assert.deepEqual(gm.pipelineOutstanding.map((x) => x.funder), ["Drafting Fund", "Ready Fund", "Unset Fund"]);
  assert.equal(gm.pipelineOutstanding.find((x) => x.funder === "Unset Fund").status, "(unset)");
});

test("next deadlines: outstanding rows within the window, sorted, capped at 3; VERIFY split; past/rolling/far/submitted excluded", () => {
  const gm = summarizeGrantMomentum(momentumGrants([
    row("recA", "Due3", { [FM.status]: "Ready", [FM.deadline]: "2026-07-08" }),      // 3d
    row("recB", "Due10", { [FM.status]: "Drafting", [FM.deadline]: "2026-07-15" }),  // 10d
    row("recC", "Due1", { [FM.status]: "Qualified", [FM.deadline]: "2026-07-06" }),  // 1d
    row("recD", "Due20", { [FM.status]: "Ready", [FM.deadline]: "2026-07-25" }),     // 20d (4th → dropped by cap)
    row("recE", "TooFar", { [FM.status]: "Ready", [FM.deadline]: "2026-08-30" }),    // >21d → excluded
    row("recF", "Past", { [FM.status]: "Ready", [FM.deadline]: "2026-07-01" }),      // past → excluded
    row("recG", "Rolling", { [FM.status]: "Ready", [FM.deadline]: "Rolling" }),      // not a date → excluded
    row("recH", "Verify", { [FM.status]: "Ready", [FM.deadline]: "VERIFY" }),        // unverified → split list
    row("recI", "SentSoon", { [FM.status]: "Submitted", [FM.submitted]: true, [FM.deadline]: "2026-07-06" }), // submitted → excluded
  ]), { now: JUL5 });
  assert.deepEqual(gm.nextDeadlines.map((x) => x.funder), ["Due1", "Due3", "Due10"]);
  assert.deepEqual(gm.nextDeadlines.map((x) => x.daysOut), [1, 3, 10]);
  assert.equal(gm.nextDeadlines[0].date, "2026-07-06");
  assert.deepEqual(gm.verifyDeadlines.map((x) => x.funder), ["Verify"]);
});

test("summarizeGrantMomentum degrades safely when the grant source is unavailable", () => {
  const gm = summarizeGrantMomentum({ available: false }, { now: JUL5 });
  assert.equal(gm.available, false);
  assert.equal(gm.submittedCount, 0);
  assert.deepEqual(gm.nextDeadlines, []);
  assert.deepEqual(summarizeGrantMomentum(undefined, {}).pipelineOutstanding, []);
});

test("parseDeadline classifies date/VERIFY/Rolling/empty; days-out is UTC-calendar and deterministic", () => {
  assert.equal(parseDeadline("VERIFY", JUL5).kind, "verify");
  assert.equal(parseDeadline("  rolling  ", JUL5).kind, "rolling");
  assert.equal(parseDeadline("", JUL5).kind, "none");
  assert.equal(parseDeadline("not a date", JUL5).kind, "none");
  const d = parseDeadline("2026-07-12", JUL5);
  assert.equal(d.kind, "date");
  assert.equal(d.daysOut, 7);
  assert.equal(parseDeadline("2026-07-05", JUL5).daysOut, 0);
  assert.equal(parseDeadline("2026-07-04", JUL5).daysOut, -1);
  // Real Deadline fields prefix the ISO date with prose — extract it anywhere, not only at pos 0.
  const prefixed = parseDeadline("DL 2026-07-13 — APPLY NOW; fit 7", JUL5);
  assert.equal(prefixed.kind, "date");
  assert.equal(prefixed.daysOut, 8);
  assert.equal(parseDeadline("DL 2026-07-20 AoE; fit 8", JUL5).daysOut, 15);
  // A prose month-name date ("Jul 12 2026") is NOT ISO and stays unparsed — a known limitation.
  assert.equal(parseDeadline("Grants round DEADLINE Jul 12 2026 — apply now", JUL5).kind, "none");
  // VERIFY and Rolling are still checked first, so they win even over an extractable ISO date.
  assert.equal(parseDeadline("2026-07-20 — but please VERIFY the round", JUL5).kind, "verify");
  assert.equal(parseDeadline("target 2026-11-04; ROLLING pitch first", JUL5).kind, "rolling");
});

test("next deadlines extract an ISO date embedded in prose, and skip prose month-name dates", () => {
  const gm = summarizeGrantMomentum(momentumGrants([
    row("recDL", "PrefixDated", { [FM.status]: "Qualified", [FM.deadline]: "DL 2026-07-13 — APPLY NOW; fit 7" }), // 8d
    row("recPr", "ProseMonth", { [FM.status]: "Qualified", [FM.deadline]: "Grants round DEADLINE Jul 12 2026" }), // unparsed → none
  ]), { now: JUL5 });
  assert.deepEqual(gm.nextDeadlines.map((x) => x.funder), ["PrefixDated"]);
  assert.equal(gm.nextDeadlines[0].daysOut, 8);
  assert.equal(gm.nextDeadlines[0].date, "2026-07-13");
  // Both rows are still outstanding pipeline entries regardless of deadline parseability.
  assert.deepEqual(gm.pipelineOutstanding.map((x) => x.funder), ["PrefixDated", "ProseMonth"]);
});

test("pipeline splits into enumerated in-motion (Ready first + marked, deadline if dated) and a backlog count", () => {
  const gm = summarizeGrantMomentum(momentumGrants([
    row("recR", "Ready Fund", { [FM.status]: "Ready", [FM.deadline]: "2026-07-10" }),   // in motion, ready, dated
    row("recV", "Voice Fund", { [FM.status]: "Voice pass" }),                            // in motion, no date
    row("recD", "Draft Fund", { [FM.status]: "Drafting", [FM.deadline]: "Rolling" }),    // in motion, Rolling → no label
    row("recRt", "Redteam Fund", { [FM.status]: "Red-team" }),                           // in motion, no date
    row("recDisc", "Disc Fund", { [FM.status]: "Discovered" }),                          // backlog
    row("recRes", "Res Fund", { [FM.status]: "Researched" }),                            // backlog
    row("recQ1", "Q One", { [FM.status]: "Qualified" }),                                 // backlog
    row("recQ2", "Q Two", { [FM.status]: "Qualified" }),                                 // backlog
    row("recU", "Unset Fund", {}),                                                       // unset → backlog "(unset)"
  ]), { now: JUL5 });
  // Ready first (highest signal), then the rest alphabetical.
  assert.deepEqual(gm.inMotion.map((x) => x.funder), ["Ready Fund", "Draft Fund", "Redteam Fund", "Voice Fund"]);
  assert.equal(gm.inMotion[0].ready, true);
  assert.equal(gm.inMotion[0].deadlineLabel, "2026-07-10");
  assert.equal(gm.inMotion.filter((x) => x.ready).length, 1);
  assert.equal(gm.inMotion.find((x) => x.funder === "Draft Fund").deadlineLabel, null); // Rolling is not "dated"
  // Backlog is a count + per-status tally, never enumerated by funder.
  assert.equal(gm.backlog.count, 5);
  assert.deepEqual(gm.backlog.byStatus, { Discovered: 1, Researched: 1, Qualified: 2, "(unset)": 1 });
  // Total outstanding always reconciles: in-motion + backlog.
  assert.equal(gm.pipelineOutstanding.length, gm.inMotion.length + gm.backlog.count);
});

test("in-motion enumeration is hard-capped at PIPELINE_ENUM_CAP with a +K more tail; backlog never enumerates", () => {
  const rows = [];
  for (let i = 0; i < PIPELINE_ENUM_CAP + 3; i++) {
    const n = String(i).padStart(2, "0");
    rows.push(row(`rec${n}`, `Fund ${n}`, { [FM.status]: "Drafting" }));
  }
  const gm = summarizeGrantMomentum(momentumGrants(rows), { now: JUL5 });
  assert.equal(gm.inMotion.length, PIPELINE_ENUM_CAP + 3); // engine keeps them all; only the render caps
  const out = renderBrief(buildBrief(bundle({
    date: "2026-07-05",
    grants: { available: true, evidence: [], ledger: ledger([]), fieldMap: FM, tracker: rows },
  }), null));
  assert.match(out, /\+3 more in motion/);
  assert.equal(out.includes("Fund 12"), false); // 11th+ funder names are not enumerated
  assert.ok(out.includes("Fund 09"));           // the 10th IS enumerated (0-indexed)
});

// ---------------------------------------------------------------------------
// NEEDS YOUR ATTENTION — action-required rows only, with the four asked-for fields.
// ---------------------------------------------------------------------------
test("attention surfaces only Action-Required rows, with funder/category/evidence/submission-date", () => {
  const at = summarizeAttention(momentumGrants([
    row("rec1", "A Fund", { [FM.actionRequired]: true, [FM.responseCategory]: "reply-required", [FM.evidenceRef]: "19f1c58aa9e34095", [FM.submissionDate]: "2026-06-20" }),
    row("rec2", "B Fund", { [FM.actionRequired]: false, [FM.responseCategory]: "acknowledgment" }), // not flagged → excluded
    row("rec3", "C Fund", {}), // no flag → excluded
  ]), { reconcileMarker: "2026-07-05T09:00:00.000Z" });
  assert.equal(at.available, true);
  assert.equal(at.rows.length, 1);
  assert.deepEqual(at.rows[0], {
    funder: "A Fund",
    record_id: "rec1",
    responseCategory: "reply-required",
    evidenceRef: "19f1c58aa9e34095",
    submissionDate: "2026-06-20",
  });
  assert.equal(at.reconcileMarker, "2026-07-05T09:00:00.000Z");
});

test("attention marker normalizes: absent or blank marker becomes null", () => {
  const g = momentumGrants([]);
  assert.equal(summarizeAttention(g, {}).reconcileMarker, null);
  assert.equal(summarizeAttention(g, { reconcileMarker: "   " }).reconcileMarker, null);
  assert.equal(summarizeAttention({ available: false }, { reconcileMarker: "x" }).available, false);
});

test("attention surfaces follow-ups due on or before today, overdue-sorted, 0 = due today; ISO-only", () => {
  const at = summarizeAttention(momentumGrants([
    row("recA", "Today Fund", { [FM.followUpDate]: "2026-07-05" }),   // due today → overdue 0
    row("recB", "Over Fund", { [FM.followUpDate]: "2026-07-01" }),    // 4 days overdue
    row("recC", "Future Fund", { [FM.followUpDate]: "2026-07-20" }),  // future → excluded
    row("recD", "Empty Fund", {}),                                    // no follow-up date → excluded
    row("recE", "Prose Fund", { [FM.followUpDate]: "Jul 1 2026" }),   // non-ISO → not parsed → excluded
  ]), { now: JUL5 });
  assert.deepEqual(at.followUps.map((x) => x.funder), ["Over Fund", "Today Fund"]); // overdue desc
  assert.deepEqual(at.followUps.map((x) => x.overdue), [4, 0]);
  assert.equal(at.followUps[1].date, "2026-07-05"); // 0 = due today
  assert.deepEqual(at.rows, []); // follow-ups are independent of the Action-Required list
});

test("the brief renders GRANT MOMENTUM and NEEDS YOUR ATTENTION with a freshness line", () => {
  const b = bundle({
    date: "2026-07-05",
    grants: {
      available: true, evidence: [], ledger: ledger([]), fieldMap: FM,
      tracker: [
        row("rec1", "Ready Fund", { [FM.status]: "Ready", [FM.deadline]: "2026-07-10" }),
        row("rec2", "Sent Fund", { [FM.status]: "Submitted", [FM.submitted]: true, [FM.result]: "Accepted" }),
        row("rec3", "Owed Fund", { [FM.status]: "Follow-up", [FM.submitted]: true, [FM.actionRequired]: true, [FM.responseCategory]: "reply-required", [FM.evidenceRef]: "19f1c58aa9e34095", [FM.submissionDate]: "2026-06-20" }),
      ],
    },
  });
  const out = renderBrief(buildBrief(b, null, { reconcileMarker: "2026-07-05T09:00:00.000Z" }));
  assert.match(out, /## GRANT MOMENTUM/);
  assert.match(out, /\*\*Submitted:\*\* 2 /);
  assert.match(out, /awards: Sent Fund/);
  assert.match(out, /Ready Fund — Ready/);           // pipeline outstanding
  assert.match(out, /Ready Fund — 2026-07-10 · 5d out/); // next deadline
  assert.match(out, /## NEEDS YOUR ATTENTION/);
  assert.match(out, /Last reconcile: 2026-07-05T09:00:00\.000Z/);
  assert.match(out, /Owed Fund — reply-required · evidence 19f1c58aa9e34095 · submitted 2026-06-20/);
  assert.equal(DEADLINE_WINDOW_DAYS, 21);
});

test("when no reconcile marker is present the attention section says so, not a fake freshness", () => {
  const b = bundle({ grants: grantsBundle({ trackerRows: [row("rec1", "X Fund", { [FM.actionRequired]: true, [FM.responseCategory]: "award" })] }) });
  const out = renderBrief(buildBrief(b, null)); // no reconcileMarker
  assert.match(out, /No last-run marker found/);
  assert.match(out, /Refresh via `npm run reconcile:grants`/);
});

test("the brief renders in-motion [READY] marks, a backlog count, and follow-ups-due lines", () => {
  const b = bundle({
    date: "2026-07-05",
    grants: {
      available: true, evidence: [], ledger: ledger([]), fieldMap: FM,
      tracker: [
        row("recR", "Ready Fund", { [FM.status]: "Ready", [FM.deadline]: "2026-07-10" }),
        row("recD", "Draft Fund", { [FM.status]: "Drafting" }),
        row("recDisc", "Disc Fund", { [FM.status]: "Discovered" }),
        row("recQ", "Q Fund", { [FM.status]: "Qualified" }),
        row("recF", "FollowUp Fund", { [FM.submitted]: true, [FM.followUpDate]: "2026-07-03" }), // 2d overdue
        row("recT", "Today Fund", { [FM.submitted]: true, [FM.followUpDate]: "2026-07-05" }),    // due today
      ],
    },
  });
  const out = renderBrief(buildBrief(b, null, { reconcileMarker: "2026-07-05T09:00:00.000Z" }));
  assert.match(out, /\*\*In motion \(2\)\*\*/);
  assert.match(out, /\*\*\[READY\]\*\* Ready Fund — Ready · 2026-07-10/);
  assert.match(out, /\*\*Backlog \(2\)\*\* — not yet in drafting: Discovered×1, Qualified×1/);
  assert.match(out, /Follow-ups due — Follow-up Date on or before 2026-07-05 \(2\)/);
  assert.match(out, /FollowUp Fund — 2d overdue \(2026-07-03\)/);
  assert.match(out, /Today Fund — due today \(2026-07-05\)/);
});

// ---------------------------------------------------------------------------
// Leak-gate extension — the new fields must not become a bypass.
// ---------------------------------------------------------------------------
test("audit flags an email address planted in a Deadline field, by path and kind only", () => {
  const b = fullBundle();
  b.grants.tracker[0].fields[FM.deadline] = "email grants@secret-funder.org before noon";
  const hits = auditBundle(b);
  assert.ok(hits.some((h) => h.kind === "email-address" && /fldDeadline000001/.test(h.path)));
  assert.equal(JSON.stringify(hits).includes("secret-funder"), false); // value never echoed
});

test("audit flags an email planted in the reconcile marker string (input side)", () => {
  const hits = scanForSensitive("stamp person@leak.example.com", "reconcileMarker");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].kind, "email-address");
  assert.equal(hits[0].path, "reconcileMarker");
});

test("a clean bundle exercising momentum + attention (incl. a 16-hex evidence ref) passes the output scan", () => {
  const b = bundle({
    date: "2026-07-05",
    grants: {
      available: true, evidence: [], ledger: ledger([]), fieldMap: FM,
      tracker: [
        row("rec1", "Ready Fund", { [FM.status]: "Ready", [FM.deadline]: "2026-07-10" }),
        row("rec3", "Owed Fund", { [FM.status]: "Follow-up", [FM.submitted]: true, [FM.actionRequired]: true, [FM.responseCategory]: "reply-required", [FM.evidenceRef]: "19f1c58aa9e34095", [FM.submissionDate]: "2026-06-20" }),
      ],
    },
    imbas: imbasBundle({ cases: [caseRec("001", { severity: 1 })] }),
    snapshots: snapshotsBundle({ present: ["g1"] }),
  });
  const model = buildBrief(b, null, { reconcileMarker: "2026-07-05T09:00:00.000Z" });
  assert.deepEqual(auditBundle(b), []);
  assert.deepEqual(scanForSensitive(renderBrief(model), "brief", { maxString: Infinity }), []); // 16-hex ref allowed
  assert.deepEqual(scanForSensitive(model.state, "state"), []);
});

test("parseArgs reads --reconcile-marker and defaults it to the gitignored path", () => {
  assert.equal(parseArgs(["--input", "b.json"]).reconcileMarker, ".founder-ops/last-reconcile.txt");
  assert.equal(parseArgs(["--input", "b.json", "--reconcile-marker", "/tmp/x.txt"]).reconcileMarker, "/tmp/x.txt");
  assert.equal(parseArgs(["--input", "b.json", "--reconcile-marker=/tmp/y.txt"]).reconcileMarker, "/tmp/y.txt");
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
