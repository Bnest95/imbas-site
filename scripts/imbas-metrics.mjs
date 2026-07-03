// scripts/imbas-metrics.mjs — read-only pipeline metrics for the Imbas data layer.
//
// Prints a small operational snapshot of the two-tier archive so counts can be checked
// at a glance without opening Airtable or hand-tallying rows:
//
//   Cases        total, Severity coverage (X / total), and the exact Case IDs that
//                still need a Severity score — with intentionally-unscored controls
//                listed separately so a baseline item is never mistaken for a gap.
//   Repository   triage-status distribution (how many candidates sit at each stage).
//   Reader Runs  total, and how many carry provenance (prompt version + source hash).
//
// READ-ONLY by construction: it issues Airtable GETs only and never PATCHes, POSTs, or
// DELETEs. It requests only the few fields each metric needs, and it never prints
// captured content — no prompts, answers, emails, or hash values. Provenance is a
// presence count only: the hash strings are tested for presence and discarded, never
// logged.
//
// Controls are detected from live data, not a hardcoded ID list. A Case is treated as a
// control when its Name carries the parenthetical annotation the archive uses for
// baseline items — "(control)", "(CONTROL)", "(control, ...)". Change the naming
// convention and this rule follows the data. The report prints the control IDs it
// excluded, so a misclassification is visible rather than silent.
//
// Usage:
//   AIRTABLE_TOKEN=... node scripts/imbas-metrics.mjs [--help]
//
// Env (same convention as scripts/promote-candidate.mjs):
//   AIRTABLE_TOKEN        required — PAT with data.records:read on the base
//   AIRTABLE_BASE         optional — default appfxHraqlcpP1AAP
//   AIRTABLE_CASES_TABLE  optional — default tblf7c2RYUolaTVXJ (Cases)
//   AIRTABLE_REPO_TABLE   optional — default tblyPn1kp4PHbxTWz (Repository)
//   AIRTABLE_RUNS_TABLE   optional — default tblqmHiOCQ5YSXBN3 (Reader Runs)
//
// Exit codes: 0 ok · 2 bad usage · 3 missing token · 1 runtime / Airtable error.
//
// Run: AIRTABLE_TOKEN=... node scripts/imbas-metrics.mjs

import { pathToFileURL } from "node:url";

export const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
export const CASES_TABLE = process.env.AIRTABLE_CASES_TABLE || "tblf7c2RYUolaTVXJ";
export const REPO_TABLE = process.env.AIRTABLE_REPO_TABLE || "tblyPn1kp4PHbxTWz";
export const RUNS_TABLE = process.env.AIRTABLE_RUNS_TABLE || "tblqmHiOCQ5YSXBN3";

// Fields requested from each table. Deliberately minimal — nothing sensitive (no
// prompts, answers, or emails) is ever fetched. "Name" is read only to detect controls
// and is never printed; "Source Content Hash" is read only to test presence.
export const CASE_FIELDS = ["Case ID", "Name", "Severity"];
export const REPO_FIELDS = ["Triage Status"];
export const RUNS_FIELDS = ["Reader Prompt Version", "Source Content Hash"];

export const AIRTABLE_PAGE_SIZE = 100; // REST maximum records per page.

const USAGE = `imbas-metrics — read-only pipeline metrics for the Imbas data layer.

Usage:
  AIRTABLE_TOKEN=... node scripts/imbas-metrics.mjs [--help]

Reports Cases total + Severity coverage + unscored Case IDs (controls listed
separately), Repository triage-status distribution, and Reader Runs provenance
population. Read-only: issues Airtable GETs only, never writes. Never prints
prompts, answers, emails, or hash values.`;

export function parseArgs(args) {
  for (const a of args) {
    if (a === "--help" || a === "-h") return { help: true };
    throw new Error(`unknown argument: ${a}`);
  }
  return { help: false };
}

const airtableHeaders = (token) => ({ Authorization: `Bearer ${token}` });

// Turn a non-2xx Airtable response into a clear message. The body slice is Airtable's own
// error JSON (type/message), which carries no record content.
export function describeHttpError(status, bodyText) {
  const hint =
    status === 401 ? "check AIRTABLE_TOKEN (unauthorized)" :
    status === 403 ? "token lacks permission on this base (forbidden)" :
    status === 404 ? "base or table id not found" :
    status === 422 ? "unprocessable request (check field names / table id)" :
    "unexpected status";
  const snippet = (bodyText || "").slice(0, 200);
  return `Airtable request failed (${status}): ${hint}${snippet ? ` — ${snippet}` : ""}`;
}

// Read every record from a table, following Airtable's offset pagination. GET only — no
// method, body, or query ever mutates. fetchImpl is injectable so pagination can be
// exercised in tests without a live base.
export async function fetchAllRecords({ token, table, fields, fetchImpl = fetch }) {
  const records = [];
  let offset;
  do {
    const params = new URLSearchParams();
    params.set("pageSize", String(AIRTABLE_PAGE_SIZE));
    for (const f of fields) params.append("fields[]", f);
    if (offset) params.set("offset", offset);
    const url = `https://api.airtable.com/v0/${BASE}/${table}?${params.toString()}`;
    const r = await fetchImpl(url, { headers: airtableHeaders(token) });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      throw new Error(describeHttpError(r.status, t));
    }
    const data = await r.json();
    if (!data || !Array.isArray(data.records)) {
      throw new Error(`Airtable returned an unexpected shape for ${table} (no records array)`);
    }
    for (const rec of data.records) records.push(rec);
    offset = data.offset;
  } while (offset);
  return records;
}

// Airtable's REST API returns singleSelect as a plain name string; tolerate the {id,name}
// object shape too so the reader is robust to either.
export function selectName(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.name === "string") return v.name;
  return String(v);
}

// A Case counts as a control when its Name carries the parenthetical control annotation
// the archive uses for baseline items — "(control)", "(CONTROL)", "(control, ...)".
// Paren-anchored so a topical mention of control in a title is not misread as a marker,
// and word-boundary anchored so "controls"/"controlled" do not match.
const CONTROL_MARKER = /\(\s*control\b/i;
export function isControlCase(name) {
  return CONTROL_MARKER.test(typeof name === "string" ? name : "");
}

// Severity is a number field; Airtable omits empty numbers from the response, so a
// present finite number (including 0) means the case has been scored.
export function hasSeverity(fields) {
  const v = fields ? fields["Severity"] : undefined;
  return typeof v === "number" && Number.isFinite(v);
}

export function caseIdOf(fields) {
  const v = fields ? fields["Case ID"] : undefined;
  if (typeof v === "string") return v.trim();
  return v == null ? "" : String(v).trim();
}

// Ascending sort for zero-padded numeric Case IDs ("023"). Numeric ids sort first and
// numerically; any non-numeric id (e.g. a "(no case id: ...)" placeholder) sorts last,
// lexically, so an anomaly lands at the end of the list where it stands out.
export function sortCaseIds(ids) {
  return [...ids].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    const aNum = Number.isFinite(na);
    const bNum = Number.isFinite(nb);
    if (aNum && bNum) return na - nb || String(a).localeCompare(String(b));
    if (aNum) return -1;
    if (bNum) return 1;
    return String(a).localeCompare(String(b));
  });
}

// Split Cases into scored vs unscored, and unscored into substantive (a real scoring
// gap) vs control (intentionally unscored). Scored controls are simply counted as
// scored — control status only matters for the unscored bucket.
export function classifyCases(records) {
  let total = 0;
  let scored = 0;
  const unscoredSubstantive = [];
  const unscoredControls = [];
  for (const rec of records) {
    const fields = rec.fields || {};
    total += 1;
    if (hasSeverity(fields)) {
      scored += 1;
      continue;
    }
    const id = caseIdOf(fields) || `(no case id: ${rec.id})`;
    if (isControlCase(fields["Name"])) unscoredControls.push(id);
    else unscoredSubstantive.push(id);
  }
  return {
    total,
    scored,
    unscored: total - scored,
    unscoredSubstantive: sortCaseIds(unscoredSubstantive),
    unscoredControls: sortCaseIds(unscoredControls),
  };
}

export function triageDistribution(records) {
  const counts = new Map();
  for (const rec of records) {
    const status = selectName((rec.fields || {})["Triage Status"]).trim() || "(unset)";
    counts.set(status, (counts.get(status) || 0) + 1);
  }
  return { total: records.length, counts };
}

// A run is "provenance-populated" when it carries both the Reader prompt version tag and
// a source content hash. The hash is only tested for presence — its value is never
// returned or printed.
export function provenanceStats(records) {
  let populated = 0;
  const versions = new Map();
  for (const rec of records) {
    const fields = rec.fields || {};
    const version = typeof fields["Reader Prompt Version"] === "string"
      ? fields["Reader Prompt Version"].trim()
      : "";
    const hashPresent = typeof fields["Source Content Hash"] === "string"
      && fields["Source Content Hash"].trim().length > 0;
    if (version && hashPresent) {
      populated += 1;
      versions.set(version, (versions.get(version) || 0) + 1);
    }
  }
  const total = records.length;
  return { total, populated, rate: total > 0 ? populated / total : 0, versions };
}

export function pct(n, d) {
  if (!d) return "n/a";
  return `${((n / d) * 100).toFixed(1)}%`;
}

function sortedEntries(map) {
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export function formatReport({ cases, triage, prov }) {
  const lines = [];
  lines.push("Imbas pipeline metrics (read-only)");
  lines.push(`  base ${BASE}`);
  lines.push("");
  lines.push("Cases");
  lines.push(`  total:             ${cases.total}`);
  lines.push(`  severity coverage: ${cases.scored} / ${cases.total} (${pct(cases.scored, cases.total)})`);
  lines.push(`  unscored — substantive (need a score): ${cases.unscoredSubstantive.length}`);
  if (cases.unscoredSubstantive.length) lines.push(`    ${cases.unscoredSubstantive.join(", ")}`);
  lines.push(`  unscored — controls (intentionally unscored): ${cases.unscoredControls.length}`);
  if (cases.unscoredControls.length) lines.push(`    ${cases.unscoredControls.join(", ")}`);
  lines.push("");
  lines.push("Repository");
  lines.push(`  total: ${triage.total}`);
  for (const [status, n] of sortedEntries(triage.counts)) lines.push(`    ${status}: ${n}`);
  lines.push("");
  lines.push("Reader Runs");
  lines.push(`  total: ${prov.total}`);
  lines.push(`  provenance-populated: ${prov.populated} / ${prov.total} (${pct(prov.populated, prov.total)})`);
  if (prov.versions.size) {
    const vs = sortedEntries(prov.versions).map(([v, n]) => `${v}×${n}`).join(", ");
    lines.push(`    prompt versions (populated rows): ${vs}`);
  }
  return lines.join("\n");
}

async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    console.error(`error: ${e.message}\n\n${USAGE}`);
    process.exitCode = 2;
    return;
  }
  if (opts.help) {
    console.log(USAGE);
    return;
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("error: AIRTABLE_TOKEN is not set (needs data.records:read on the base). No request made.");
    process.exitCode = 3;
    return;
  }

  try {
    const [caseRecords, repoRecords, runRecords] = await Promise.all([
      fetchAllRecords({ token, table: CASES_TABLE, fields: CASE_FIELDS }),
      fetchAllRecords({ token, table: REPO_TABLE, fields: REPO_FIELDS }),
      fetchAllRecords({ token, table: RUNS_TABLE, fields: RUNS_FIELDS }),
    ]);
    const cases = classifyCases(caseRecords);
    const triage = triageDistribution(repoRecords);
    const prov = provenanceStats(runRecords);
    console.log(formatReport({ cases, triage, prov }));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
