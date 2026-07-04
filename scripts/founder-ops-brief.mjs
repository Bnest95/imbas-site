// scripts/founder-ops-brief.mjs — Founder Ops Daily Brief engine (CLI, no public route).
//
// Turns the operational state we already collect — grant reconciliation, submission
// snapshot coverage, and the Imbas pipeline metrics — into ONE decision-ordered morning
// brief, plus a tiny durable state file so each run can say what changed since the last.
// It is an internal operating instrument, not a dashboard and not a public surface.
//
// WHY THIS SHAPE (the same constraint as grant-reconcile). There is no Gmail credential
// and no AIRTABLE_TOKEN in this environment; Gmail is reachable only through an agent's
// read-only MCP tools, and Airtable likewise. So the collection step — reading funder
// replies and live tables — is inherently agent-driven and cannot live in an unattended
// cron. What CAN be deterministic, tested, and reusable is everything downstream: grant
// classification (reused from grant-reconcile), snapshot coverage (reused from
// check-submission-snapshots), pipeline metrics (reused from imbas-metrics), the
// contradiction detector, the transparent priority model, change detection, and the
// render. That is this file. The agent assembles a body-free JSON bundle in the input
// shape below; the engine builds and renders the brief and writes an operational-only
// state file. Nothing here reads or sends email, opens Airtable, or spends money.
//
// EVIDENCE DISCIPLINE (inherited, non-negotiable). Submission is "confirmed" only from a
// funder/system receipt (grant-reconcile's classifier), never from a tracker Status, a
// checkbox, a draft, or a prior report. Four states are kept distinct and never collapsed:
//   1 confirmed submitted + as-submitted artifact preserved (snapshot_present)
//   2 confirmed submitted + exact artifact unknown            (submission_version_unknown)
//   3 submission asserted but unverified                      (contradiction / review)
//   4 not submitted / no evidence
// Acknowledgments are FYI, never actions. Deadlines are never invented. A human-confirmed
// Accepted/Rejected/Withdrawn is never downgraded. If a tracker row says Submitted but no
// receipt confirms it and no Submitted box is set, it is surfaced as unverified.
//
// PRIVACY. The rendered brief and the saved state carry operational summaries only —
// counts, IDs, public funder names, public case titles, category enums, a stable evidence
// thread id at most. Never an email body, address, subject, snippet, prompt, answer, AI
// output, hash value, token, or secret. stateFromBrief writes an allowlisted object and
// assertStateClean rejects anything outside it. The input bundle is body-free by contract;
// this engine never reads a field that could carry sensitive content.
//
// AUTONOMY. Not fully autonomous by itself: the bundle must be assembled by an agent (or a
// future credentialed job) with Gmail + Airtable read access. Given a bundle, the brief is
// fully deterministic and offline.
//
// Usage:
//   node scripts/founder-ops-brief.mjs --input bundle.json                 # print brief
//   node scripts/founder-ops-brief.mjs --input bundle.json \
//       --state .founder-ops/state.json                                    # + change detection
//   node scripts/founder-ops-brief.mjs --input bundle.json \
//       --state .founder-ops/state.json --save-state                       # + persist new state
//   node scripts/founder-ops-brief.mjs --input bundle.json --out brief.md  # write brief to file
//
// Exit codes: 0 ok · 2 bad usage / unreadable input · 1 runtime.
//
// Input bundle (all body-free; assembled by the agent from MCP reads):
//   {
//     "generatedAt": "<ISO>",                // run timestamp (agent-provided)
//     "date": "YYYY-MM-DD",
//     "grants": {                            // omit or {available:false} if the read failed
//       "available": true,
//       "evidence": [ <grant-reconcile evidence items, body-free> ],
//       "ledger":   { "submissions": [ ... ] },     // submissions-ledger.json
//       "tracker":  [ { "record_id", "funder", "fields": { "<fieldId>": <value> } } ],
//       "fieldMap": { "submitted","submissionDate","responseCategory","actionRequired",
//                     "evidenceRef","result","status" }   // logical -> Grant Tracker field id
//     },
//     "imbas": {                             // omit or {available:false} if the read failed
//       "available": true,
//       "cases":      [ { "fields": { "Case ID","Name","Severity","Human Confirmed",
//                                     "Source Candidate ID" } } ],
//       "repository": [ { "fields": { "Triage Status","Promoted To Case","Reviewed At" } } ],
//       "readerRuns": [ { "fields": { "Reader Prompt Version","Source Content Hash",
//                                     "Source","Inspected AI Model" } } ]
//     },
//     "snapshots": { "available": true, "ledger": { "submissions": [ ... ] } }
//   }

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import {
  reconcile,
  CATEGORIES,
  STRONG_RESULTS,
  normalizeValue,
} from "./grant-reconcile.mjs";
import { classifyLedger } from "./check-submission-snapshots.mjs";
import {
  classifyCases,
  triageDistribution,
  provenanceStats,
  selectName,
  pct,
} from "./imbas-metrics.mjs";

export const STATE_SCHEMA = "founder-ops-state.v1";

// ---------------------------------------------------------------------------
// Priority model. A bounded, transparent, deterministic factor score — no
// manufactured precision. Each factor is an ordinal 0..3; effort is inverted so
// a low-effort action gets a bonus. Weights are fixed and documented here so the
// ranking is testable and explainable in the brief itself.
//
//   score = upside*3 + probability*3 + urgency*4 + unblock*2
//         + integrityRisk*4 + (3 - effort)*2                 // max raw = 54
//
//   High >= 34 · Medium >= 20 · Low < 20
//
// The factors encode the rules the founder asked for:
//   • an acknowledgment is never an action (it produces no candidate at all);
//   • a reply-required / interview / more-info / award owes a response -> high;
//   • an unverified "Submitted" carries integrity risk but ZERO funding upside
//     (no confirmed submission), so a big number never floats to the top on a
//     submission we cannot prove;
//   • a small action that unblocks several downstream tasks gets unblock weight.
// ---------------------------------------------------------------------------
export const WEIGHTS = Object.freeze({
  upside: 3,
  probability: 3,
  urgency: 4,
  unblock: 2,
  integrityRisk: 4,
  effort: 2, // applied to (3 - effort)
});
export const TIER_HIGH = 34;
export const TIER_MEDIUM = 20;
export const SCORE_MAX = 54;

// Tracker Status values that assert the application was sent. If the Status claims
// submitted but no funder receipt confirms it and the Submitted box is unset and there is
// no strong human Result, the row is unverified/contradictory (state 3). Awarded/Rejected
// are strong human decisions and are handled by the no-downgrade rule, not flagged here.
export const CLAIMS_SUBMITTED = new Set(["Submitted", "Follow-up"]);

const clamp03 = (n) => Math.max(0, Math.min(3, Math.round(Number.isFinite(n) ? n : 0)));

// ---------------------------------------------------------------------------
// summarizeGrants — reuse grant-reconcile over the bundle. Returns the reconcile
// result plus a category tally and the passive-acknowledgment list. Pure.
// ---------------------------------------------------------------------------
export function summarizeGrants(grants) {
  if (!grants || grants.available === false) {
    return { available: false, plans: [], review: [], actions: [], byCategory: {}, acknowledgments: [], categoryByFunder: {}, trackerRows: 0 };
  }
  const evidence = grants.evidence || [];
  const ledger = grants.ledger || { submissions: [] };
  const tracker = grants.tracker || [];
  const fieldMap = grants.fieldMap || {};
  const { plans, review, actions } = reconcile({ evidence, ledger, tracker, fieldMap });

  const byCategory = {};
  const categoryByFunder = {};
  const acknowledgments = [];
  for (const p of plans) {
    // A plan's category is the reconciled classification of this row's latest reply.
    const cat = p.needsReview ? CATEGORIES.UNCERTAIN : p.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    categoryByFunder[p.funder] = cat;
    if (cat === CATEGORIES.ACK) acknowledgments.push(p.funder);
  }
  return { available: true, plans, review, actions, byCategory, acknowledgments, categoryByFunder, trackerRows: tracker.length };
}

// ---------------------------------------------------------------------------
// detectGrantContradictions — pure. A row is unverified/contradictory when its
// tracker Status claims submitted, but the reconciler did not confirm submission
// from a receipt, the Submitted box is unset, and there is no strong human Result.
// Never silently prefers Airtable: it surfaces the disagreement for the founder.
// ---------------------------------------------------------------------------
export function detectGrantContradictions(grants, grantSummary) {
  if (!grants || grants.available === false) return [];
  const fieldMap = grants.fieldMap || {};
  const statusId = fieldMap.status;
  const submittedId = fieldMap.submitted;
  const resultId = fieldMap.result;
  const confirmedByRec = new Map((grantSummary.plans || []).map((p) => [p.record_id, p.submissionConfirmed === true]));

  const out = [];
  for (const row of grants.tracker || []) {
    const fields = row.fields || {};
    const status = statusId ? selectName(fields[statusId]).trim() : "";
    if (!CLAIMS_SUBMITTED.has(status)) continue;
    const submittedBox = submittedId ? normalizeValue(fields[submittedId]) === true : false;
    const resultVal = resultId ? selectName(fields[resultId]).trim() : "";
    const strongResult = STRONG_RESULTS.has(resultVal);
    const confirmed = confirmedByRec.get(row.record_id) === true;
    if (confirmed || submittedBox || strongResult) continue;
    out.push({
      funder: row.funder,
      record_id: row.record_id,
      trackerStatus: status,
      reason:
        `Status "${status}" asserts the application went out, but no funder receipt confirms it, ` +
        `the Submitted box is unset, and there is no human Result. Treat as unverified — confirm ` +
        `whether it was actually submitted before relying on it.`,
    });
  }
  out.sort((a, b) => String(a.funder).localeCompare(String(b.funder)));
  return out;
}

// ---------------------------------------------------------------------------
// summarizeSnapshots — reuse classifyLedger for coverage of as-submitted artifacts.
// ---------------------------------------------------------------------------
export function summarizeSnapshots(snapshots) {
  if (!snapshots || snapshots.available === false) {
    return { available: false, total: 0, presentCount: 0, unknownCount: 0, present: [], unknown: [] };
  }
  const entries = (snapshots.ledger && snapshots.ledger.submissions) || [];
  const c = classifyLedger(entries);
  return { available: true, total: c.total, presentCount: c.presentCount, unknownCount: c.unknownCount, present: c.present, unknown: c.unknown };
}

// ---------------------------------------------------------------------------
// summarizeImbas — reuse the metrics functions, then add lineage/review state and
// a synthetic-probe count (a provenance-populated run whose Inspected AI Model is a
// probe, not organic traffic). Returns operational counts + ID lists only — no case
// names in the numbers that flow to state; names stay for the human-readable brief.
// ---------------------------------------------------------------------------
export function summarizeImbas(imbas) {
  if (!imbas || imbas.available === false) {
    return {
      available: false,
      cases: { total: 0, scored: 0, unscored: 0, unscoredSubstantive: [], unscoredControls: [], humanConfirmed: 0 },
      repository: { total: 0, byStatus: {}, newCount: 0, reviewCount: 0, promotedCount: 0 },
      readerRuns: { total: 0, populated: 0, ratePct: 0, promptVersions: [], bySource: {}, syntheticProbe: 0 },
      lineage: { casesWithSource: 0, repoPromoted: 0, operated: false },
      caseTitles: {},
    };
  }
  const caseRecords = imbas.cases || [];
  const repoRecords = imbas.repository || [];
  const runRecords = imbas.readerRuns || [];

  const cases = classifyCases(caseRecords);
  let humanConfirmed = 0;
  const caseTitles = {};
  let casesWithSource = 0;
  for (const rec of caseRecords) {
    const f = rec.fields || {};
    if (f["Human Confirmed"] === true) humanConfirmed += 1;
    const id = typeof f["Case ID"] === "string" ? f["Case ID"].trim() : String(f["Case ID"] ?? "").trim();
    if (id && typeof f["Name"] === "string") caseTitles[id] = f["Name"];
    const src = f["Source Candidate ID"];
    if (typeof src === "string" && src.trim().length > 0) casesWithSource += 1;
  }

  const triage = triageDistribution(repoRecords);
  const byStatus = {};
  for (const [k, v] of triage.counts.entries()) byStatus[k] = v;
  let repoPromoted = 0;
  for (const rec of repoRecords) {
    const f = rec.fields || {};
    const promoted = f["Promoted To Case"];
    if (typeof promoted === "string" && promoted.trim().length > 0) repoPromoted += 1;
  }
  const newCount = byStatus["new"] || 0;
  const reviewCount = byStatus["candidate_for_review"] || 0;
  const promotedStatusCount = byStatus["promoted"] || 0;

  const prov = provenanceStats(runRecords);
  const bySource = {};
  let syntheticProbe = 0;
  for (const rec of runRecords) {
    const f = rec.fields || {};
    const source = typeof f["Source"] === "string" ? f["Source"].trim() || "(unset)" : "(unset)";
    bySource[source] = (bySource[source] || 0) + 1;
    const inspected = typeof f["Inspected AI Model"] === "string" ? f["Inspected AI Model"].trim().toLowerCase() : "";
    const version = typeof f["Reader Prompt Version"] === "string" ? f["Reader Prompt Version"].trim() : "";
    const hashPresent = typeof f["Source Content Hash"] === "string" && f["Source Content Hash"].trim().length > 0;
    if (version && hashPresent && /probe/.test(inspected)) syntheticProbe += 1;
  }
  const promptVersions = [...prov.versions.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([v, n]) => ({ version: v, count: n }));

  // The promotion/lineage workflow has "operated" only when at least one real link exists
  // in either direction: a Repository row promoted, or a Case carrying a Source Candidate ID.
  const operated = repoPromoted > 0 || promotedStatusCount > 0 || casesWithSource > 0;

  return {
    available: true,
    cases: {
      total: cases.total,
      scored: cases.scored,
      unscored: cases.unscored,
      unscoredSubstantive: cases.unscoredSubstantive,
      unscoredControls: cases.unscoredControls,
      humanConfirmed,
    },
    repository: { total: triage.total, byStatus, newCount, reviewCount, promotedCount: promotedStatusCount },
    readerRuns: {
      total: prov.total,
      populated: prov.populated,
      ratePct: Number((prov.rate * 100).toFixed(1)),
      promptVersions,
      bySource,
      syntheticProbe,
    },
    lineage: { casesWithSource, repoPromoted, operated },
    caseTitles,
  };
}

// ---------------------------------------------------------------------------
// actionCandidatesFrom — pure. Turns the summaries into candidate actions with
// EXPLICIT factors. This is where the priority rules live. Acknowledgments never
// produce a candidate. Each candidate declares its horizon (today | week).
// ---------------------------------------------------------------------------
export function actionCandidatesFrom({ grantSummary, contradictions, snapshots, imbas }) {
  const out = [];

  // Grant response actions (owed to a funder). Reuse the reconciler's action queue,
  // which already excludes acknowledgments. Map each category to factors.
  const CAT_FACTORS = {
    [CATEGORIES.AWARD]: { upside: 3, probability: 3, urgency: 3, unblock: 2, integrityRisk: 1, effort: 1 },
    [CATEGORIES.INTERVIEW]: { upside: 3, probability: 3, urgency: 3, unblock: 1, integrityRisk: 1, effort: 1 },
    [CATEGORIES.MORE_INFO]: { upside: 3, probability: 3, urgency: 3, unblock: 1, integrityRisk: 1, effort: 2 },
    [CATEGORIES.REPLY_REQUIRED]: { upside: 2, probability: 3, urgency: 3, unblock: 1, integrityRisk: 1, effort: 0 },
  };
  for (const a of (grantSummary && grantSummary.actions) || []) {
    if (a.actionRequired !== true) continue; // only owed responses; watches are not actions
    const factors = CAT_FACTORS[a.category];
    if (!factors) continue; // unmatched/uncertain watches are surfaced in GRANTS review, not ranked
    out.push({
      id: `grant:${a.category}:${a.funder}`,
      source: "grant",
      title: `Respond to ${a.funder} — ${a.category.replace(/-/g, " ")}`,
      why: `A funder reply owes ${a.funder} a response (${a.category.replace(/-/g, " ")}). Time-sensitive; it can move the outcome.`,
      basis: a.deadline ? `funder reply; watch ~${a.deadline}` : `funder reply classified ${a.category}`,
      horizon: "today",
      factors,
    });
  }

  // Unverified / contradictory submissions (state 3). Real integrity work, but ZERO
  // funding upside because the submission is not confirmed.
  for (const c of contradictions || []) {
    out.push({
      id: `grant:unverified:${c.funder}`,
      source: "integrity",
      title: `Verify whether ${c.funder} was actually submitted`,
      why: `Tracker Status "${c.trackerStatus}" claims submitted, but no receipt, no Submitted box, no human Result confirms it. A standing false belief here costs a real opportunity either way.`,
      basis: `unverified: Status="${c.trackerStatus}", no confirming evidence`,
      horizon: "today",
      factors: { upside: 0, probability: 2, urgency: 2, unblock: 1, integrityRisk: 3, effort: 1 },
    });
  }

  // Repository triage backlog — candidates sitting at "new" feed the archive once triaged.
  if (imbas && imbas.available && imbas.repository.newCount > 0) {
    const n = imbas.repository.newCount;
    out.push({
      id: "imbas:triage-backlog",
      source: "imbas",
      title: `Triage ${n} Repository candidate${n === 1 ? "" : "s"} at "new"`,
      why: `${n} captured candidate${n === 1 ? " is" : "s are"} waiting at first-pass triage. Triaging unblocks promotion into the public archive — compounding value.`,
      basis: `Repository: ${n} at new, 0 reviewed`,
      horizon: "week",
      factors: { upside: 1, probability: 2, urgency: 1, unblock: 2, integrityRisk: 1, effort: 1 },
    });
  }

  // First promotion — if the lineage workflow has never operated, promoting one reviewed
  // candidate creates the first Repository->Case link and exercises the pipeline end to end.
  if (imbas && imbas.available && !imbas.lineage.operated && imbas.repository.total > 0) {
    out.push({
      id: "imbas:first-promotion",
      source: "imbas",
      title: "Promote one candidate to create the first lineage link",
      why: "No Repository candidate has been promoted and no Case carries a Source Candidate ID — the promotion/lineage workflow has never operated on live data. Running it once proves the pipeline and grows the archive.",
      basis: "lineage: 0 promoted, 0 cases with source",
      horizon: "week",
      factors: { upside: 1, probability: 2, urgency: 1, unblock: 2, integrityRisk: 1, effort: 1 },
    });
  }

  // Unscored substantive cases — a real scoring gap in the archive (controls excluded).
  if (imbas && imbas.available && imbas.cases.unscoredSubstantive.length > 0) {
    const ids = imbas.cases.unscoredSubstantive;
    out.push({
      id: "imbas:unscored-substantive",
      source: "imbas",
      title: `Score ${ids.length} substantive case${ids.length === 1 ? "" : "s"} lacking a Severity`,
      why: `${ids.length} non-control case${ids.length === 1 ? " has" : "s have"} no Severity score. Scoring them strengthens the independent record.`,
      basis: `unscored substantive: ${ids.slice(0, 12).join(", ")}${ids.length > 12 ? " …" : ""}`,
      horizon: "week",
      factors: { upside: 1, probability: 2, urgency: 1, unblock: 1, integrityRisk: 1, effort: 2 },
    });
  }

  // Snapshot coverage gap — confirmed submissions with no as-submitted artifact preserved.
  if (snapshots && snapshots.available && snapshots.unknownCount > 0) {
    out.push({
      id: "grant:snapshot-gaps",
      source: "grant",
      title: `Establish as-submitted artifacts for ${snapshots.unknownCount} confirmed submission${snapshots.unknownCount === 1 ? "" : "s"}`,
      why: `${snapshots.unknownCount} submission${snapshots.unknownCount === 1 ? " is" : "s are"} confirmed but the exact submitted draft is not preserved (state 2). Capturing the artifact protects positioning ground-truth.`,
      basis: `snapshot coverage: ${snapshots.presentCount}/${snapshots.total} present`,
      horizon: "week",
      factors: { upside: 0, probability: 1, urgency: 1, unblock: 1, integrityRisk: 2, effort: 2 },
    });
  }

  return out;
}

// scoreAction — pure. Deterministic bounded score + tier from a candidate's factors.
export function scoreAction(candidate) {
  const f = candidate.factors || {};
  const upside = clamp03(f.upside);
  const probability = clamp03(f.probability);
  const urgency = clamp03(f.urgency);
  const unblock = clamp03(f.unblock);
  const integrityRisk = clamp03(f.integrityRisk);
  const effort = clamp03(f.effort);
  const score =
    upside * WEIGHTS.upside +
    probability * WEIGHTS.probability +
    urgency * WEIGHTS.urgency +
    unblock * WEIGHTS.unblock +
    integrityRisk * WEIGHTS.integrityRisk +
    (3 - effort) * WEIGHTS.effort;
  const tier = score >= TIER_HIGH ? "High" : score >= TIER_MEDIUM ? "Medium" : "Low";
  return { ...candidate, factors: { upside, probability, urgency, unblock, integrityRisk, effort }, score, tier, effortLabel: EFFORT_LABEL[effort] };
}

const EFFORT_LABEL = ["trivial", "small", "medium", "large"];

// rankAndSplit — pure, deterministic. Scores every candidate, sorts by score desc with a
// stable id tiebreaker, and splits by horizon. No filler: fewer than five real items stays
// fewer than five.
export function rankAndSplit(candidates, { limit = 5 } = {}) {
  const scored = candidates.map(scoreAction);
  const byScore = (a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id));
  const today = scored.filter((c) => c.horizon === "today").sort(byScore).slice(0, limit);
  const week = scored.filter((c) => c.horizon === "week").sort(byScore).slice(0, limit);
  return { today, week, all: [...scored].sort(byScore) };
}

// ---------------------------------------------------------------------------
// diffState — pure. Material deltas between the previous saved state and now. Empty
// array means no material change. Baseline (no prior state) is signalled separately.
// ---------------------------------------------------------------------------
export function diffState(prev, curr) {
  if (!prev) return { isBaseline: true, changes: [] };
  const changes = [];
  const g0 = prev.grants || {};
  const g1 = curr.grants || {};
  const i0 = prev.imbas || {};
  const i1 = curr.imbas || {};

  // Per-funder grant category transitions (e.g. acknowledgment -> interview).
  const c0 = g0.categoryByFunder || {};
  const c1 = g1.categoryByFunder || {};
  for (const funder of Object.keys(c1).sort()) {
    if (funder in c0 && c0[funder] !== c1[funder]) {
      changes.push(`${funder}: ${c0[funder]} → ${c1[funder]}`);
    } else if (!(funder in c0)) {
      changes.push(`New funder reply reconciled: ${funder} (${c1[funder]})`);
    }
  }

  // Contradictions resolved or newly appeared (funder names only).
  const con0 = new Set(g0.contradictionFunders || []);
  const con1 = new Set(g1.contradictionFunders || []);
  for (const f of [...con1].sort()) if (!con0.has(f)) changes.push(`New unverified/contradictory grant record: ${f}`);
  for (const f of [...con0].sort()) if (!con1.has(f)) changes.push(`Previously unverified submission resolved: ${f}`);

  // Snapshot coverage.
  if (num(g0.snapshotPresent) !== num(g1.snapshotPresent)) changes.push(`Snapshot coverage: ${num(g0.snapshotPresent)} → ${num(g1.snapshotPresent)} present`);

  // Repository counts.
  if (num(i0.repoNew) !== num(i1.repoNew)) changes.push(`Repository "new": ${num(i0.repoNew)} → ${num(i1.repoNew)}`);
  if (num(i0.repoReview) !== num(i1.repoReview)) changes.push(`Repository "candidate_for_review": ${num(i0.repoReview)} → ${num(i1.repoReview)}`);
  if (num(i0.repoTotal) !== num(i1.repoTotal)) changes.push(`Repository total: ${num(i0.repoTotal)} → ${num(i1.repoTotal)}`);

  // Cases / scoring.
  if (num(i0.casesTotal) !== num(i1.casesTotal)) changes.push(`Cases total: ${num(i0.casesTotal)} → ${num(i1.casesTotal)}`);
  if (num(i0.casesScored) !== num(i1.casesScored)) changes.push(`Cases scored: ${num(i0.casesScored)} → ${num(i1.casesScored)}`);

  // Provenance coverage.
  if (num(i0.provenanceRatePct) !== num(i1.provenanceRatePct)) changes.push(`Provenance coverage: ${num(i0.provenanceRatePct)}% → ${num(i1.provenanceRatePct)}%`);
  if (num(i0.runsTotal) !== num(i1.runsTotal)) changes.push(`Reader Runs total: ${num(i0.runsTotal)} → ${num(i1.runsTotal)}`);

  // Promotion / lineage.
  if (Boolean(i0.lineageOperated) !== Boolean(i1.lineageOperated)) {
    changes.push(`Promotion/lineage workflow: ${i0.lineageOperated ? "operated" : "never operated"} → ${i1.lineageOperated ? "operated" : "never operated"}`);
  }

  return { isBaseline: false, changes };
}

function num(v) {
  return Number.isFinite(v) ? v : 0;
}

// ---------------------------------------------------------------------------
// buildBrief — pure. Assemble the whole model from a bundle + prior state.
// ---------------------------------------------------------------------------
export function buildBrief(bundle, prevState) {
  const generatedAt = typeof bundle.generatedAt === "string" ? bundle.generatedAt : new Date().toISOString();
  const date = typeof bundle.date === "string" ? bundle.date : generatedAt.slice(0, 10);

  const grantSummary = summarizeGrants(bundle.grants);
  const contradictions = detectGrantContradictions(bundle.grants, grantSummary);
  const snapshots = summarizeSnapshots(bundle.snapshots);
  const imbas = summarizeImbas(bundle.imbas);

  const candidates = actionCandidatesFrom({ grantSummary, contradictions, snapshots, imbas });
  const ranked = rankAndSplit(candidates);

  const availability = {
    grants: bundle.grants ? bundle.grants.available !== false : false,
    imbas: bundle.imbas ? bundle.imbas.available !== false : false,
    snapshots: bundle.snapshots ? bundle.snapshots.available !== false : false,
  };

  const model = { generatedAt, date, grantSummary, contradictions, snapshots, imbas, ranked, availability };
  const currState = stateFromBrief(model);
  model.diff = diffState(prevState, currState);
  model.state = currState;
  model.warnings = buildWarnings(model);
  return model;
}

// Real warnings only: an unavailable input source (never a silent clean bill of health),
// a live contradiction, or an integrity signal worth the founder's eye.
export function buildWarnings(model) {
  const w = [];
  if (!model.availability.grants) w.push("GRANTS INPUT UNAVAILABLE — the grant section is incomplete. Do not read a clean grant state; the Gmail/tracker read did not run or failed.");
  if (!model.availability.imbas) w.push("IMBAS INPUT UNAVAILABLE — the operations section is incomplete. The Airtable read did not run or failed.");
  if (!model.availability.snapshots) w.push("SNAPSHOT INPUT UNAVAILABLE — snapshot coverage is unknown this run.");
  if (model.contradictions.length) w.push(`${model.contradictions.length} grant record${model.contradictions.length === 1 ? "" : "s"} assert submission with no confirming evidence — see GRANTS › unverified.`);
  if (model.availability.imbas && !model.imbas.lineage.operated && model.imbas.repository.total > 0) {
    w.push("Promotion/lineage workflow has never operated on live data (0 promoted, 0 cases with a source link).");
  }
  if (model.availability.imbas && model.imbas.readerRuns.total > 0 && model.imbas.readerRuns.populated === model.imbas.readerRuns.syntheticProbe && model.imbas.readerRuns.syntheticProbe > 0) {
    w.push("Reader provenance is populated only by a synthetic probe — no organic run has captured provenance yet. Confirm the next real Reader run carries it.");
  }
  return w;
}

// ---------------------------------------------------------------------------
// stateFromBrief — pure. Allowlisted, operational-only state for change detection.
// Funder names and case IDs are public; category enums are non-sensitive. NO bodies,
// addresses, prompts, answers, hashes, tokens.
// ---------------------------------------------------------------------------
export function stateFromBrief(model) {
  const g = model.grantSummary;
  const i = model.imbas;
  const s = model.snapshots;
  return {
    schema: STATE_SCHEMA,
    generatedAt: model.generatedAt,
    date: model.date,
    grants: {
      trackerRows: g.trackerRows || 0,
      byCategory: { ...g.byCategory },
      categoryByFunder: { ...g.categoryByFunder },
      contradictionFunders: model.contradictions.map((c) => c.funder),
      replyActionCount: (g.actions || []).filter((a) => a.actionRequired === true).length,
      snapshotPresent: s.presentCount || 0,
      snapshotUnknown: s.unknownCount || 0,
    },
    imbas: {
      casesTotal: i.cases.total,
      casesScored: i.cases.scored,
      unscoredSubstantiveCount: i.cases.unscoredSubstantive.length,
      unscoredSubstantiveIds: i.cases.unscoredSubstantive,
      repoTotal: i.repository.total,
      repoNew: i.repository.newCount,
      repoReview: i.repository.reviewCount,
      repoPromoted: i.repository.promotedCount,
      runsTotal: i.readerRuns.total,
      provenancePopulated: i.readerRuns.populated,
      provenanceRatePct: i.readerRuns.ratePct,
      promptVersions: i.readerRuns.promptVersions.map((p) => p.version),
      lineageOperated: i.lineage.operated,
      casesWithLineage: i.lineage.casesWithSource,
    },
    topTodayIds: model.ranked.today.map((a) => a.id),
    topWeekIds: model.ranked.week.map((a) => a.id),
  };
}

// The complete set of keys allowed at each level of the saved state. assertStateClean
// walks the object and throws on anything outside the allowlist — defense in depth so a
// future edit cannot leak a body/hash/address into persisted state.
const STATE_ALLOW = {
  root: new Set(["schema", "generatedAt", "date", "grants", "imbas", "topTodayIds", "topWeekIds"]),
  grants: new Set(["trackerRows", "byCategory", "categoryByFunder", "contradictionFunders", "replyActionCount", "snapshotPresent", "snapshotUnknown"]),
  imbas: new Set(["casesTotal", "casesScored", "unscoredSubstantiveCount", "unscoredSubstantiveIds", "repoTotal", "repoNew", "repoReview", "repoPromoted", "runsTotal", "provenancePopulated", "provenanceRatePct", "promptVersions", "lineageOperated", "casesWithLineage"]),
};

export function assertStateClean(state) {
  for (const k of Object.keys(state)) {
    if (!STATE_ALLOW.root.has(k)) throw new Error(`state leak: unexpected root key "${k}"`);
  }
  for (const k of Object.keys(state.grants || {})) {
    if (!STATE_ALLOW.grants.has(k)) throw new Error(`state leak: unexpected grants key "${k}"`);
  }
  for (const k of Object.keys(state.imbas || {})) {
    if (!STATE_ALLOW.imbas.has(k)) throw new Error(`state leak: unexpected imbas key "${k}"`);
  }
  return true;
}

// ---------------------------------------------------------------------------
// scanForSensitive / auditBundle — pure. An UNATTENDED-mode leak gate (`--audit`).
//
// The engine is deliberately tolerant of junk in non-consumed fields: it reads only
// allowlisted keys, so a stray value provably never reaches the render or the state
// (that is the default, human-in-the-loop posture). When the brief runs unattended,
// there is no human to privacy-scan the output before it is written or delivered, so
// `--audit` adds a fail-closed gate: it deep-scans the input bundle, the rendered
// brief, and the state object for content that must never leave the box — an email
// address, a long content-hash, or an API/token prefix — and refuses to proceed if it
// finds any. Reports carry the PATH and the KIND only, never the matched value, so the
// gate itself cannot leak what it caught. A 16-hex Gmail thread id (a permitted stable
// evidence reference) is intentionally below the 32-hex hash threshold and is not flagged.
// ---------------------------------------------------------------------------
export const SENSITIVE_PATTERNS = Object.freeze([
  { kind: "email-address", re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { kind: "content-hash",  re: /[0-9a-fA-F]{32,}/ },
  { kind: "api-token",     re: /\bsk-[A-Za-z0-9_-]{8,}/ },
  { kind: "token-prefix",  re: /\b(?:ghp_|gho_|xox[baprs]-|AKIA[0-9A-Z]{12,})/ },
]);
export const SENSITIVE_MAX_STRING = 400;

// scanForSensitive(value, path, { maxString }) — walk a JSON value and return {path,kind}
// hits, value withheld. The overlong-string heuristic catches a body/prompt/answer stuffed
// into a structured field; pass maxString: Infinity to disable it when scanning a rendered
// document (a brief is legitimately long — only embedded addresses/hashes/tokens matter there).
export function scanForSensitive(value, path = "bundle", { maxString = SENSITIVE_MAX_STRING } = {}) {
  const hits = [];
  const walk = (v, p) => {
    if (typeof v === "string") {
      for (const { kind, re } of SENSITIVE_PATTERNS) {
        if (re.test(v)) { hits.push({ path: p, kind }); return; }
      }
      if (v.length > maxString) hits.push({ path: p, kind: "overlong-string" });
      return;
    }
    if (Array.isArray(v)) { v.forEach((el, i) => walk(el, `${p}[${i}]`)); return; }
    if (v && typeof v === "object") { for (const k of Object.keys(v)) walk(v[k], `${p}.${k}`); }
  };
  walk(value, path);
  return hits;
}

export function auditBundle(bundle) {
  return scanForSensitive(bundle, "bundle");
}

// ---------------------------------------------------------------------------
// renderBrief — pure. The morning brief in the fixed hierarchy. Markdown, concise.
// ---------------------------------------------------------------------------
export function renderBrief(model) {
  const L = [];
  const push = (s = "") => L.push(s);
  const g = model.grantSummary;
  const i = model.imbas;
  const s = model.snapshots;

  push("# FOUNDER OPS DAILY BRIEF");
  push(`**Date:** ${model.date}  ·  **Generated:** ${model.generatedAt}`);
  push("");

  // EXECUTIVE SIGNAL
  push("## EXECUTIVE SIGNAL");
  for (const line of executiveSignal(model)) push(line);
  push("");

  // WHAT CHANGED
  push("## WHAT CHANGED");
  if (model.diff.isBaseline) {
    push("_Baseline run — no prior state to compare. Future runs will report deltas here._");
  } else if (model.diff.changes.length === 0) {
    push("_No material changes since the prior run._");
  } else {
    for (const c of model.diff.changes) push(`- ${c}`);
  }
  push("");

  // TOP 5 TODAY
  push("## TOP 5 — TODAY");
  renderActions(push, model.ranked.today);
  push("");

  // TOP 5 THIS WEEK
  push("## TOP 5 — THIS WEEK");
  renderActions(push, model.ranked.week);
  push("");

  // GRANTS
  push("## GRANTS");
  if (!model.availability.grants) {
    push("> **INPUT UNAVAILABLE** — the grant read did not run. Section incomplete.");
  } else {
    const owed = (g.actions || []).filter((a) => a.actionRequired === true);
    push(`**Action-required replies (${owed.length}):**`);
    if (owed.length === 0) push("- (none owed)");
    for (const a of owed) push(`- ${a.funder} — ${a.category}${a.deadline ? ` · watch ~${a.deadline}` : ""} — ${a.reason}`);
    push("");
    const decisionCats = [CATEGORIES.AWARD, CATEGORIES.INTERVIEW, CATEGORIES.MORE_INFO, CATEGORIES.REPLY_REQUIRED, CATEGORIES.STATUS_UPDATE, CATEGORIES.REJECTION];
    const newReplies = decisionCats.map((c) => [c, g.byCategory[c] || 0]).filter(([, n]) => n > 0);
    push(`**New / decision replies:** ${newReplies.length ? newReplies.map(([c, n]) => `${c}×${n}`).join(", ") : "none since last reconcile"}`);
    push("");
    push(`**Unverified / contradictory (${model.contradictions.length}):**`);
    if (model.contradictions.length === 0) push("- (none)");
    for (const c of model.contradictions) push(`- ${c.funder} — Status "${c.trackerStatus}" but no confirming evidence. ${c.reason}`);
    push("");
    push(`**Passive acknowledgments — FYI, not actions (${g.acknowledgments.length}):**`);
    push(g.acknowledgments.length ? `- ${g.acknowledgments.slice().sort().join(", ")}` : "- (none)");
    push("");
    if (s.available) {
      push(`**Snapshot coverage:** ${s.presentCount}/${s.total} as-submitted artifacts preserved · ${s.unknownCount} confirmed-but-artifact-unknown.`);
      if (s.unknown.length) push(`- artifact unknown: ${s.unknown.map((e) => e.grant_id).join(", ")}`);
    } else {
      push("**Snapshot coverage:** input unavailable this run.");
    }
  }
  push("");

  // IMBAS OPERATIONS
  push("## IMBAS OPERATIONS");
  push("_Live operational counts — the internal instrument, deliberately separate from the locked public Numbers Ledger figures._");
  if (!model.availability.imbas) {
    push("> **INPUT UNAVAILABLE** — the Airtable read did not run. Section incomplete.");
  } else {
    push(`- **Cases:** ${i.cases.total} rows · ${i.cases.scored} carry a Severity (${pct(i.cases.scored, i.cases.total)}) · ${i.cases.humanConfirmed} human-confirmed.`);
    push(`  - Unscored substantive (${i.cases.unscoredSubstantive.length}): ${i.cases.unscoredSubstantive.length ? i.cases.unscoredSubstantive.join(", ") : "none"}`);
    push(`  - Unscored controls (${i.cases.unscoredControls.length}, intentionally unscored): ${i.cases.unscoredControls.length ? i.cases.unscoredControls.join(", ") : "none"}`);
    const statusStr = Object.entries(i.repository.byStatus).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => `${k}×${v}`).join(", ") || "none";
    push(`- **Repository:** ${i.repository.total} candidates — ${statusStr}. Waiting: ${i.repository.newCount} new, ${i.repository.reviewCount} candidate_for_review.`);
    const provStr = i.readerRuns.promptVersions.map((p) => `${p.version}×${p.count}`).join(", ") || "none";
    push(`- **Reader Runs:** ${i.readerRuns.total} total · provenance ${i.readerRuns.populated}/${i.readerRuns.total} (${i.readerRuns.ratePct}%) · prompt versions: ${provStr}${i.readerRuns.syntheticProbe ? ` · ${i.readerRuns.syntheticProbe} synthetic probe` : ""}.`);
    push(`- **Promotion / lineage:** ${i.lineage.operated ? "operated" : "NEVER operated"} — ${i.lineage.repoPromoted} Repository promoted, ${i.lineage.casesWithSource} case(s) with a Source Candidate ID.`);
  }
  push("");

  // WARNINGS / DRIFT
  push("## WARNINGS / DRIFT");
  if (model.warnings.length === 0) push("_None._");
  for (const w of model.warnings) push(`- ⚠️ ${w}`);
  push("");

  // NO-ACTION ITEMS
  push("## NO-ACTION ITEMS");
  const noAction = [];
  if (model.availability.grants && g.acknowledgments.length) noAction.push(`${g.acknowledgments.length} funder acknowledgment(s) on file — receipt only, nothing owed.`);
  if (model.availability.imbas && i.cases.unscoredControls.length) noAction.push(`${i.cases.unscoredControls.length} control case(s) intentionally unscored — not a gap.`);
  if (noAction.length === 0) push("_None._");
  for (const n of noAction) push(`- ${n}`);

  return L.join("\n");
}

function renderActions(push, actions) {
  if (!actions || actions.length === 0) {
    push("_No qualifying actions this run. (No filler — an empty list means nothing here meets the bar.)_");
    return;
  }
  let rank = 0;
  for (const a of actions) {
    rank += 1;
    push(`${rank}. **${a.title}** — _${a.tier}_ (score ${a.score}/${SCORE_MAX})`);
    push(`   - Why: ${a.why}`);
    push(`   - Basis: ${a.basis}`);
    push(`   - Effort: ${a.effortLabel}`);
  }
}

// Deterministic 3–6 sentence executive summary generated from the computed model.
function executiveSignal(model) {
  const g = model.grantSummary;
  const i = model.imbas;
  const sents = [];

  // 1) Overall posture.
  const owed = model.availability.grants ? (g.actions || []).filter((a) => a.actionRequired === true).length : 0;
  const topToday = model.ranked.today[0];
  sents.push(
    owed > 0
      ? `${owed} funder repl${owed === 1 ? "y owes" : "ies owe"} a response — that is today's top pull.`
      : model.contradictions.length
        ? `No funder response is owed; today's real work is integrity — ${model.contradictions.length} grant record${model.contradictions.length === 1 ? "" : "s"} claim${model.contradictions.length === 1 ? "s" : ""} submission without evidence.`
        : `No funder response is owed and no live contradictions — the pipeline is in maintenance mode.`
  );

  // 2) What changed.
  if (model.diff.isBaseline) sents.push("This is the baseline run; deltas start next time.");
  else if (model.diff.changes.length === 0) sents.push("Nothing material changed since the last run.");
  else sents.push(`${model.diff.changes.length} material change${model.diff.changes.length === 1 ? "" : "s"} since the last run.`);

  // 3) Single most important thing today.
  if (topToday) sents.push(`Highest-ranked action: ${topToday.title.toLowerCase()} (${topToday.tier}).`);

  // 4) Imbas posture.
  if (model.availability.imbas) {
    sents.push(`Archive: ${i.cases.scored}/${i.cases.total} cases scored, ${i.repository.newCount} capture${i.repository.newCount === 1 ? "" : "s"} awaiting triage, provenance at ${i.readerRuns.ratePct}%.`);
  } else {
    sents.push("Imbas operational state is unavailable this run — treat the operations section as incomplete.");
  }

  // 5) Top warning, if any.
  if (model.warnings.length) sents.push(`Watch: ${model.warnings[0].replace(/\s+—.*$/, "").toLowerCase()}.`);

  return sents.map((s) => s);
}

// ---------------------------------------------------------------------------
// Thin IO below. All logic above is the tested surface.
// ---------------------------------------------------------------------------
export function parseArgs(args) {
  const opts = { input: "", state: "", out: "", saveState: false, audit: false, help: false };
  for (let i = 0; i < args.length; i++) {
    let a = args[i];
    if (a === "--help" || a === "-h") { opts.help = true; continue; }
    if (a === "--save-state") { opts.saveState = true; continue; }
    if (a === "--audit") { opts.audit = true; continue; }
    let inlineVal = null;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) { inlineVal = a.slice(eq + 1); a = a.slice(0, eq); }
    }
    const takeValue = () => {
      if (inlineVal !== null) return inlineVal;
      const next = args[i + 1];
      if (next === undefined) throw new Error(`missing value for ${a}`);
      i++;
      return next;
    };
    switch (a) {
      case "--input": opts.input = takeValue(); break;
      case "--state": opts.state = takeValue(); break;
      case "--out": opts.out = takeValue(); break;
      default: throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

const USAGE = `founder-ops-brief — assemble the Founder Ops Daily Brief from a body-free bundle.

Usage:
  node scripts/founder-ops-brief.mjs --input bundle.json [--state state.json] [--save-state] [--audit] [--out brief.md]

--input       required. Body-free JSON bundle the agent assembles from MCP reads.
--state       optional. Prior-run state file for change detection (and --save-state target).
--save-state  optional. Write the new operational state back to --state after rendering.
--audit       optional. Unattended leak gate: fail closed (exit 2) if the bundle, the
              rendered brief, or the state contains an address, hash, or token. Use for
              every scheduled/unattended run — nothing is written or delivered if it trips.
--out         optional. Write the brief to a file instead of stdout.

Reads no network, no Gmail, no Airtable. Prints/saves operational summaries only — never
email bodies, addresses, prompts, answers, hashes, or secrets. Exit: 0 ok · 2 bad usage · 1 runtime.`;

function readJson(path, label) {
  let raw;
  try { raw = readFileSync(path, "utf8"); }
  catch (e) { throw new Error(`cannot read ${label} file "${path}": ${e.message}`); }
  try { return JSON.parse(raw); }
  catch (e) { throw new Error(`invalid JSON in ${label} file "${path}": ${e.message}`); }
}

async function main(argv) {
  let opts;
  try { opts = parseArgs(argv); }
  catch (e) { console.error(`error: ${e.message}\n\n${USAGE}`); process.exitCode = 2; return; }
  if (opts.help) { console.log(USAGE); return; }
  if (!opts.input) { console.error(`error: --input is required\n\n${USAGE}`); process.exitCode = 2; return; }

  let bundle, prevState = null;
  try { bundle = readJson(opts.input, "input"); }
  catch (e) { console.error(`error: ${e.message}`); process.exitCode = 2; return; }

  if (opts.state && existsSync(opts.state)) {
    try { prevState = readJson(opts.state, "state"); }
    catch (e) { console.error(`error: ${e.message}`); process.exitCode = 2; return; }
  }

  const reportLeaks = (where, hits) => {
    console.error(`error: --audit blocked ${where} — ${hits.length} sensitive pattern(s) found (values withheld):`);
    for (const h of hits) console.error(`  ${h.path}: ${h.kind}`);
    console.error("Nothing was written or delivered.");
  };

  if (opts.audit) {
    const inHits = auditBundle(bundle);
    if (inHits.length) { reportLeaks("the input bundle", inHits); process.exitCode = 2; return; }
  }

  let model, rendered;
  try {
    model = buildBrief(bundle, prevState);
    assertStateClean(model.state); // defense in depth before anything is written
    rendered = renderBrief(model);
  } catch (e) { console.error(`error: ${e.message}`); process.exitCode = 1; return; }

  if (opts.audit) {
    const outHits = [
      ...scanForSensitive(rendered, "brief", { maxString: Infinity }), // a brief is legitimately long
      ...scanForSensitive(model.state, "state"),
    ];
    if (outHits.length) { reportLeaks("the rendered brief/state", outHits); process.exitCode = 2; return; }
  }

  if (opts.out) {
    try { mkdirSync(dirname(opts.out), { recursive: true }); writeFileSync(opts.out, rendered + "\n"); }
    catch (e) { console.error(`error: cannot write --out "${opts.out}": ${e.message}`); process.exitCode = 1; return; }
    console.log(`Brief written to ${opts.out}`);
  } else {
    console.log(rendered);
  }

  if (opts.saveState) {
    if (!opts.state) { console.error("error: --save-state requires --state <path>"); process.exitCode = 2; return; }
    try {
      assertStateClean(model.state);
      mkdirSync(dirname(opts.state), { recursive: true });
      writeFileSync(opts.state, JSON.stringify(model.state, null, 2) + "\n");
      console.error(`State saved to ${opts.state}`);
    } catch (e) { console.error(`error: cannot save state "${opts.state}": ${e.message}`); process.exitCode = 1; return; }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
