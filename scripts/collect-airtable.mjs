// scripts/collect-airtable.mjs — unattended, Airtable-only collector for the Founder Ops Daily Brief.
//
// The daily brief is a two-stage system. COLLECTION (reading funder replies from Gmail and the
// live Airtable tables) is inherently agent-driven — there is no Gmail credential in an unattended
// job, and the nuanced read of a funder reply cannot be automated. RENDER (scripts/founder-ops-brief.mjs)
// is deterministic and offline. This collector is the unattended TIER-1 half of collection: it reads
// ONLY Airtable (which a scheduled job CAN do with a data.records:read PAT) and assembles the exact
// body-free bundle the render consumes. Gmail stays agent-side by design.
//
// WHAT THIS TIER CAN AND CANNOT SEE. Everything sourced from Airtable is populated live: the Grant
// Tracker momentum funnel, next deadlines, Action Required rows, Follow-up dates, unverified/contradictory
// submissions, and the whole Imbas operations block (Cases, Repository, Reader Runs). Everything sourced
// from a funder REPLY is absent: there is no reply evidence, so the reconciler's reply categories, the
// "new / decision replies" line, and the passive-acknowledgment list are deliberately empty — the render
// shows them as such rather than faking them. The bundle carries a fixed `notice` the render prints near
// the top so a reader always knows the run's scope. Snapshot coverage is a LOCAL artifact (as-submitted
// files + Gmail receipts, hand-curated in grant-engine/), not an Airtable read and not present in CI, so
// it degrades to unavailable (a labeled gap in the brief), never invented.
//
// REUSE, NOT DUPLICATION. The paginated, GET-only reader (fetchAllRecords) and the table ids come from
// imbas-metrics.mjs; the Grant Tracker id comes from grant-reconcile.mjs. This file adds only the
// projection into the render's bundle shape.
//
// PRIVACY / AUDIT-SAFETY. The bundle is body-free by construction, so `founder-ops-brief.mjs --audit`
// passes on it. Grant rows are projected to ONLY the nine logical fields the render maps (Funder/Grant ID
// are lifted to the row label and dropped as data), so freetext columns that may hold addresses or long
// notes (Contact, Notes, Materials, ...) never enter the bundle. Reader-run provenance keeps only a
// presence SENTINEL for Source Content Hash — the raw sha256 (a 32+ hex string the leak gate would flag)
// is discarded, its presence preserved as the literal "present".
//
// READ-ONLY by construction: Airtable GETs only, never PATCH/POST/DELETE. Writes exactly one local file
// (the bundle). Never reads or sends email, never writes Airtable, never spends money.
//
// Usage:
//   AIRTABLE_TOKEN=... node scripts/collect-airtable.mjs                 # write .founder-ops/input.json
//   AIRTABLE_TOKEN=... node scripts/collect-airtable.mjs --out b.json    # custom output path
//   node --env-file=.env scripts/collect-airtable.mjs                    # load token+ids from .env
//
// Env (same convention as imbas-metrics.mjs / grant-reconcile.mjs):
//   AIRTABLE_TOKEN         required — PAT with data.records:read on the base
//   AIRTABLE_BASE          optional — default appfxHraqlcpP1AAP
//   AIRTABLE_GRANTS_TABLE  optional — default tbllp4STmYOafMWy3 (Grant Tracker)
//   AIRTABLE_CASES_TABLE   optional — default tblf7c2RYUolaTVXJ (Cases)
//   AIRTABLE_REPO_TABLE    optional — default tblyPn1kp4PHbxTWz (Repository)
//   AIRTABLE_RUNS_TABLE    optional — default tblqmHiOCQ5YSXBN3 (Reader Runs)
//
// Exit codes: 0 ok · 2 bad usage · 3 missing token · 1 runtime / Airtable error.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { GRANTS_TABLE } from "./grant-reconcile.mjs";
import { fetchAllRecords, CASES_TABLE, REPO_TABLE, RUNS_TABLE, BASE } from "./imbas-metrics.mjs";

// The one fixed line the render prints near the top of an unattended run, so a reader always
// knows why the reply-driven sections are empty. Kept in sync with the render's guarded notice.
export const TIER1_NOTICE = "Unattended Airtable tier. Funder-reply items appear only in agent-run briefs.";

export const DEFAULT_OUT = ".founder-ops/input.json";

// Logical grant field -> Grant Tracker field NAME. The render is agnostic to id-vs-name: it only
// requires fieldMap keys to address tracker.fields keys, so a name-keyed map fetched by name is
// exactly as valid as the agent's id-keyed map. These names are verified against the live schema.
export const GRANT_FIELD_MAP = Object.freeze({
  status: "Status",
  deadline: "Deadline",
  submitted: "Submitted",
  submissionDate: "Submission Date",
  followUpDate: "Follow-up Date",
  responseCategory: "Response Category",
  actionRequired: "Action Required",
  evidenceRef: "Evidence Ref",
  result: "Result",
});

// Fields requested from the Grant Tracker: the nine mapped logical fields, plus Funder/Grant ID for
// the row label (never passed through as data). Deliberately excludes freetext columns.
export const GRANT_FETCH_FIELDS = Object.freeze([
  "Funder", "Grant ID",
  ...Object.values(GRANT_FIELD_MAP),
]);

// Imbas fetch lists — every field the render's summarizeImbas reads, and nothing else.
export const CASE_FETCH_FIELDS = Object.freeze(["Case ID", "Name", "Severity", "Human Confirmed", "Source Candidate ID"]);
export const REPO_FETCH_FIELDS = Object.freeze(["Triage Status", "Promoted To Case"]);
export const RUNS_FETCH_FIELDS = Object.freeze(["Reader Prompt Version", "Source Content Hash", "Source", "Inspected AI Model"]);

// buildGrantTracker — project each Grant Tracker record into the render's tracker-row shape
// { record_id, funder, fields }. `fields` keeps ONLY the nine mapped logical fields that are present
// (Airtable omits empty fields, so an unset checkbox/date/select simply does not appear — matching the
// agent bundle). Funder (falling back to Grant ID, then the record id) becomes the row label and never
// enters `fields`, so no freetext column can ride along.
export function buildGrantTracker(records) {
  const mapped = new Set(Object.values(GRANT_FIELD_MAP));
  return records.map((rec) => {
    const src = rec.fields || {};
    const label = String(src["Funder"] ?? src["Grant ID"] ?? "").trim() || rec.id;
    const fields = {};
    for (const k of Object.keys(src)) if (mapped.has(k)) fields[k] = src[k];
    return { record_id: rec.id, funder: label, fields };
  });
}

// sanitizeRuns — reduce each Reader Run to { fields }, replacing the Source Content Hash value with a
// presence sentinel so the provenance-present signal survives while the raw sha256 (which the render's
// --audit leak gate would flag as a content-hash) never enters the bundle. An absent/empty hash is
// dropped entirely, exactly as Airtable would omit it.
export function sanitizeRuns(records) {
  return records.map((rec) => {
    const fields = { ...(rec.fields || {}) };
    const h = fields["Source Content Hash"];
    if (typeof h === "string" && h.trim().length > 0) fields["Source Content Hash"] = "present";
    else delete fields["Source Content Hash"];
    return { fields };
  });
}

// fieldsOnly — keep only { fields } (drop Airtable id/createdTime), matching the agent bundle's imbas
// row shape. Used for Cases and Repository, whose fetched fields are all non-sensitive.
export function fieldsOnly(records) {
  return records.map((rec) => ({ fields: { ...(rec.fields || {}) } }));
}

// buildBundle — assemble the exact body-free bundle the render consumes. Live Airtable data populates
// grants.tracker + the imbas block; every Gmail/reply-driven input is explicitly empty; snapshots is
// marked unavailable (local, non-Airtable artifact). `notice` drives the render's tier line.
export function buildBundle({ grants = [], cases = [], repository = [], readerRuns = [] } = {}, { date, generatedAt } = {}) {
  const gen = typeof generatedAt === "string" && generatedAt ? generatedAt : new Date().toISOString();
  const d = typeof date === "string" && date ? date : gen.slice(0, 10);
  return {
    generatedAt: gen,
    date: d,
    notice: TIER1_NOTICE,
    grants: {
      available: true,
      evidence: [],                 // Gmail is agent-side; no funder-reply evidence in this tier.
      ledger: { submissions: [] },  // only consulted against evidence (none here), so kept empty.
      tracker: buildGrantTracker(grants),
      fieldMap: { ...GRANT_FIELD_MAP },
    },
    imbas: {
      available: true,
      cases: fieldsOnly(cases),
      repository: fieldsOnly(repository),
      readerRuns: sanitizeRuns(readerRuns),
    },
    // Snapshot coverage = as-submitted artifacts + Gmail receipts, hand-curated locally in grant-engine/
    // (not committed, not an Airtable read). Unattended runs cannot produce it, so it degrades to a
    // labeled gap in the brief rather than a faked count.
    snapshots: { available: false },
  };
}

// coverageSummary — counts only (no field values), safe to log in CI.
export function coverageSummary(bundle) {
  const g = bundle.grants;
  const i = bundle.imbas;
  const withField = (rows, name) => rows.filter((r) => r.fields && r.fields[name] !== undefined).length;
  return [
    "collect-airtable — Airtable-only tier-1 bundle",
    `  base ${BASE}`,
    `  date ${bundle.date}  ·  generatedAt ${bundle.generatedAt}`,
    "  POPULATED live (Airtable):",
    `    grants.tracker rows: ${g.tracker.length}  (submitted=${withField(g.tracker, "Submitted")}, deadline=${withField(g.tracker, "Deadline")}, action-required=${withField(g.tracker, "Action Required")}, follow-up=${withField(g.tracker, "Follow-up Date")}, result=${withField(g.tracker, "Result")})`,
    `    imbas.cases: ${i.cases.length}  ·  imbas.repository: ${i.repository.length}  ·  imbas.readerRuns: ${i.readerRuns.length}`,
    "  EMPTY by design (Gmail is agent-side):",
    `    grants.evidence: ${g.evidence.length}  ·  grants.ledger.submissions: ${g.ledger.submissions.length}`,
    "  LABELED GAP (local, non-Airtable):",
    `    snapshots.available: ${bundle.snapshots.available}`,
    `  notice: ${JSON.stringify(bundle.notice)}`,
  ].join("\n");
}

const USAGE = `collect-airtable — assemble the unattended, Airtable-only Founder Ops brief bundle.

Usage:
  AIRTABLE_TOKEN=... node scripts/collect-airtable.mjs [--out path] [--date YYYY-MM-DD]

Reads ONLY Airtable (GETs), writes ONE local JSON bundle in the render's body-free shape. Gmail
stays agent-side: reply-driven sections are empty by design; snapshot coverage degrades to a labeled
gap. Feed the output to \`node scripts/founder-ops-brief.mjs --input <path> --audit\`.

  --out    output bundle path (default ${DEFAULT_OUT})
  --date   override the brief date (default: today, UTC). Also fixes deadline days-out math.

Exit codes: 0 ok · 2 bad usage · 3 missing token · 1 runtime / Airtable error.`;

export function parseArgs(args) {
  const opts = { out: DEFAULT_OUT, date: "", help: false };
  for (let i = 0; i < args.length; i++) {
    let a = args[i];
    if (a === "--help" || a === "-h") { opts.help = true; continue; }
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
      case "--out": opts.out = takeValue(); break;
      case "--date": opts.date = takeValue(); break;
      default: throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

async function main(argv) {
  let opts;
  try { opts = parseArgs(argv); }
  catch (e) { console.error(`error: ${e.message}\n\n${USAGE}`); process.exitCode = 2; return; }
  if (opts.help) { console.log(USAGE); return; }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("error: AIRTABLE_TOKEN is not set (needs data.records:read on the base). No request made.");
    process.exitCode = 3;
    return;
  }

  try {
    const [grants, cases, repository, readerRuns] = await Promise.all([
      fetchAllRecords({ token, table: GRANTS_TABLE, fields: GRANT_FETCH_FIELDS }),
      fetchAllRecords({ token, table: CASES_TABLE, fields: CASE_FETCH_FIELDS }),
      fetchAllRecords({ token, table: REPO_TABLE, fields: REPO_FETCH_FIELDS }),
      fetchAllRecords({ token, table: RUNS_TABLE, fields: RUNS_FETCH_FIELDS }),
    ]);
    const bundle = buildBundle({ grants, cases, repository, readerRuns }, { date: opts.date });
    mkdirSync(dirname(opts.out), { recursive: true });
    writeFileSync(opts.out, JSON.stringify(bundle, null, 2) + "\n");
    console.error(coverageSummary(bundle));
    console.error(`\nBundle written to ${opts.out}`);
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
