// scripts/promote-candidate.mjs — internal review/linkage utility (CLI, no public route).
//
// When Brendan promotes a Repository candidate to an already-created public Case, this
// records the review + lineage fields in one call instead of hand-editing Airtable:
//
//   Repository row (found by Candidate ID):
//     Reviewed At      = now (ISO / UTC)
//     Triage Status    = "promoted"        (existing terminal-decision option)
//     Promoted To Case = <Case ID>
//     Reviewed By      = <--by>             (only when provided)
//   Cases row (found by Case ID):
//     Source Candidate ID = <Candidate ID>
//
// It does NOT create a case, publish, score, validate, or touch case evidence or any
// other field. Both rows must already exist; it fails safely (no writes) if either is
// missing or ambiguous, and it verifies every write by reading it back.
//
// This is not a serverless route and not automatic — Brendan runs it by hand at
// promotion time. The /api request path still never writes these fields.
//
// Usage:
//   AIRTABLE_TOKEN=... node scripts/promote-candidate.mjs --candidate CAND-abc12 --case 005 [--by "Name"] [--dry-run]
//
// Env (same convention as api/repository.js):
//   AIRTABLE_TOKEN        required — PAT with data.records:read + data.records:write on the base
//   AIRTABLE_BASE         optional — default appfxHraqlcpP1AAP
//   AIRTABLE_REPO_TABLE   optional — default tblyPn1kp4PHbxTWz (Repository)
//   AIRTABLE_CASES_TABLE  optional — default tblf7c2RYUolaTVXJ (Cases)

import { pathToFileURL } from "node:url";

export const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
export const REPO_TABLE = process.env.AIRTABLE_REPO_TABLE || "tblyPn1kp4PHbxTWz";
export const CASES_TABLE = process.env.AIRTABLE_CASES_TABLE || "tblf7c2RYUolaTVXJ";

// Existing terminal decision on Repository.Triage Status (schema choices:
// new, triaged, candidate_for_review, promoted, rejected, duplicate).
export const TRIAGE_PROMOTED = "promoted";

// The complete, closed set of fields this tool is ever allowed to write. Anything
// outside these lists (case evidence, scores, prompts, answers, email) is off-limits.
export const REPO_WRITE_FIELDS = ["Reviewed At", "Triage Status", "Promoted To Case", "Reviewed By"];
export const CASE_WRITE_FIELDS = ["Source Candidate ID"];

const CANDIDATE_MAX = 64;
const CASE_ID_MAX = 32;
const REVIEWED_BY_MAX = 128;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// True if the string contains any C0 control character or DEL. Uses char codes rather
// than a regex so the source stays plain ASCII.
export function hasControlChars(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c === 0x7f) return true;
  }
  return false;
}

// Candidate/Case IDs are interpolated into an Airtable filterByFormula, so the allowed
// charset is deliberately narrow (no quotes, backslashes, braces or parens) — that is
// what keeps interpolation injection-safe. Do not widen without switching to a
// parameterized lookup.
export function validateCandidateId(raw) {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) throw new ValidationError("candidate id is required (e.g. CAND-abc12)");
  if (v.length > CANDIDATE_MAX) throw new ValidationError(`candidate id too long (max ${CANDIDATE_MAX})`);
  if (!/^[A-Za-z0-9_-]+$/.test(v)) throw new ValidationError("candidate id has invalid characters (allowed: letters, digits, - _)");
  return v;
}

export function validateCaseId(raw) {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) throw new ValidationError("case id is required (e.g. 005)");
  if (v.length > CASE_ID_MAX) throw new ValidationError(`case id too long (max ${CASE_ID_MAX})`);
  if (!/^[A-Za-z0-9 ._-]+$/.test(v)) throw new ValidationError("case id has invalid characters (allowed: letters, digits, space . - _)");
  return v;
}

// Optional. Written verbatim in a JSON body (not a formula), so the charset is looser;
// still cap length and reject control characters.
export function validateReviewedBy(raw) {
  if (raw == null) return "";
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!v) return "";
  if (v.length > REVIEWED_BY_MAX) throw new ValidationError(`reviewer name too long (max ${REVIEWED_BY_MAX})`);
  if (hasControlChars(v)) throw new ValidationError("reviewer name has control characters");
  return v;
}

export function buildRepositoryFields({ caseId, now, reviewedBy }) {
  const fields = {
    "Reviewed At": now,
    "Triage Status": TRIAGE_PROMOTED,
    "Promoted To Case": caseId,
  };
  if (reviewedBy) fields["Reviewed By"] = reviewedBy;
  return fields;
}

export function buildCaseFields({ candidateId }) {
  return { "Source Candidate ID": candidateId };
}

// Defensive second gate: the value is already validated, but never let anything with
// formula metacharacters reach the query string.
export function buildLookupFormula(fieldName, value) {
  if (/['"\\{}()]/.test(value)) throw new ValidationError("unsafe lookup value");
  return `TRIM({${fieldName}})='${value}'`;
}

// Airtable's REST API returns singleSelect as a plain name string; tolerate the
// {id,name} object shape too so the diff logic is robust.
export function selectName(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.name === "string") return v.name;
  return String(v);
}

// Given the fields read back after the write, return human-readable mismatch strings.
export function diffRepositoryWrite(readFields, { caseId, reviewedBy }) {
  const problems = [];
  const triage = selectName(readFields["Triage Status"]);
  if (triage !== TRIAGE_PROMOTED) problems.push(`Triage Status is "${triage}", expected "${TRIAGE_PROMOTED}"`);
  if (!readFields["Reviewed At"]) problems.push("Reviewed At is empty");
  if ((readFields["Promoted To Case"] || "") !== caseId) {
    problems.push(`Promoted To Case is "${readFields["Promoted To Case"] || ""}", expected "${caseId}"`);
  }
  if (reviewedBy && (readFields["Reviewed By"] || "") !== reviewedBy) {
    problems.push(`Reviewed By is "${readFields["Reviewed By"] || ""}", expected "${reviewedBy}"`);
  }
  return problems;
}

export function diffCaseWrite(readFields, { candidateId }) {
  const problems = [];
  if ((readFields["Source Candidate ID"] || "") !== candidateId) {
    problems.push(`Source Candidate ID is "${readFields["Source Candidate ID"] || ""}", expected "${candidateId}"`);
  }
  return problems;
}

export function parseArgs(args) {
  const opts = { candidate: "", caseId: "", by: "", dryRun: false, help: false };
  for (let i = 0; i < args.length; i++) {
    let a = args[i];
    if (a === "--help" || a === "-h") { opts.help = true; continue; }
    if (a === "--dry-run") { opts.dryRun = true; continue; }
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
      case "--candidate": case "-c": opts.candidate = takeValue(); break;
      case "--case": case "-k": opts.caseId = takeValue(); break;
      case "--by": case "-b": opts.by = takeValue(); break;
      default: throw new ValidationError(`unknown argument: ${a}`);
    }
  }
  return opts;
}

const USAGE = `promote-candidate — record review + lineage for a promoted candidate.

Usage:
  AIRTABLE_TOKEN=... node scripts/promote-candidate.mjs --candidate CAND-abc12 --case 005 [--by "Name"] [--dry-run]

Options:
  -c, --candidate <id>   Repository Candidate ID (required)
  -k, --case <id>        Public Case ID the candidate was promoted to (required)
  -b, --by <name>        Reviewer name to record in Reviewed By (optional)
      --dry-run          Look up both rows and print the planned writes; change nothing
  -h, --help             Show this help

Writes (only these fields, only when both rows already exist):
  Repository: Reviewed At=now, Triage Status=promoted, Promoted To Case=<case>, [Reviewed By]
  Cases:      Source Candidate ID=<candidate>

It never creates a case, publishes, scores, validates, or edits case evidence.`;

const airtableHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

// Look up at most two matches so callers can detect ambiguity. Only the given fields are
// requested — sensitive columns (answers, prompts, email) are never fetched.
async function findMatches({ token, table, fieldName, value, returnFields }) {
  const params = new URLSearchParams();
  params.set("filterByFormula", buildLookupFormula(fieldName, value));
  params.set("maxRecords", "2");
  for (const f of returnFields) params.append("fields[]", f);
  const url = `https://api.airtable.com/v0/${BASE}/${table}?${params.toString()}`;
  const r = await fetch(url, { headers: airtableHeaders(token) });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Airtable lookup failed (${r.status}) on ${fieldName}: ${t.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.records || [];
}

async function patchRecord({ token, table, recordId, fields }) {
  const url = `https://api.airtable.com/v0/${BASE}/${table}/${recordId}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: airtableHeaders(token),
    body: JSON.stringify({ fields, typecast: true }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Airtable write failed (${r.status}) on ${table}/${recordId}: ${t.slice(0, 200)}`);
  }
  return r.json();
}

async function getRecordFields({ token, table, recordId, returnFields }) {
  const params = new URLSearchParams();
  for (const f of returnFields) params.append("fields[]", f);
  const url = `https://api.airtable.com/v0/${BASE}/${table}/${recordId}?${params.toString()}`;
  const r = await fetch(url, { headers: airtableHeaders(token) });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Airtable read-back failed (${r.status}) on ${table}/${recordId}: ${t.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.fields || {};
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

  let candidateId, caseId, reviewedBy;
  try {
    candidateId = validateCandidateId(opts.candidate);
    caseId = validateCaseId(opts.caseId);
    reviewedBy = validateReviewedBy(opts.by);
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
    return;
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("error: AIRTABLE_TOKEN is not set (needs data.records:read + write on the base). No changes made.");
    process.exitCode = 3;
    return;
  }

  const now = new Date().toISOString();

  try {
    // 1. Resolve BOTH rows before any write. If either is missing or ambiguous, stop
    //    here — nothing has been changed.
    const repoMatches = await findMatches({
      token, table: REPO_TABLE, fieldName: "Candidate ID", value: candidateId,
      returnFields: ["Candidate ID", "Triage Status"],
    });
    if (repoMatches.length === 0) throw new Error(`no Repository candidate with Candidate ID "${candidateId}". No changes made.`);
    if (repoMatches.length > 1) throw new Error(`multiple Repository rows match Candidate ID "${candidateId}"; refusing to guess. No changes made.`);
    const repo = repoMatches[0];

    const caseMatches = await findMatches({
      token, table: CASES_TABLE, fieldName: "Case ID", value: caseId,
      returnFields: ["Case ID", "Source Candidate ID"],
    });
    if (caseMatches.length === 0) throw new Error(`no public Case with Case ID "${caseId}". No changes made.`);
    if (caseMatches.length > 1) throw new Error(`multiple Cases rows match Case ID "${caseId}"; refusing to guess. No changes made.`);
    const kase = caseMatches[0];

    const repoFields = buildRepositoryFields({ caseId, now, reviewedBy });
    const caseFields = buildCaseFields({ candidateId });

    if (opts.dryRun) {
      console.log("DRY RUN — no writes performed.");
      console.log(`  Repository ${repo.id} (Candidate ID ${candidateId}) would set:`);
      console.log(`    ${JSON.stringify(repoFields)}`);
      const curTriage = selectName(repo.fields ? repo.fields["Triage Status"] : "");
      if (curTriage && curTriage !== TRIAGE_PROMOTED) console.log(`    note: Triage Status "${curTriage}" -> "${TRIAGE_PROMOTED}"`);
      console.log(`  Cases ${kase.id} (Case ID ${caseId}) would set:`);
      console.log(`    ${JSON.stringify(caseFields)}`);
      const curLink = (kase.fields && kase.fields["Source Candidate ID"]) || "";
      if (curLink && curLink !== candidateId) console.log(`    note: Source Candidate ID "${curLink}" -> "${candidateId}" (already linked)`);
      return;
    }

    // 2. Write Repository, then Cases.
    await patchRecord({ token, table: REPO_TABLE, recordId: repo.id, fields: repoFields });
    try {
      await patchRecord({ token, table: CASES_TABLE, recordId: kase.id, fields: caseFields });
    } catch (e) {
      throw new Error(
        `Repository ${repo.id} was updated, but the Cases link write failed: ${e.message}\n` +
        `  Finish by hand: set Cases "${caseId}" Source Candidate ID = "${candidateId}".`
      );
    }

    // 3. Verify by reading both rows back.
    const repoBack = await getRecordFields({ token, table: REPO_TABLE, recordId: repo.id, returnFields: REPO_WRITE_FIELDS });
    const caseBack = await getRecordFields({ token, table: CASES_TABLE, recordId: kase.id, returnFields: CASE_WRITE_FIELDS });
    const problems = [
      ...diffRepositoryWrite(repoBack, { caseId, reviewedBy }),
      ...diffCaseWrite(caseBack, { candidateId }),
    ];
    if (problems.length) throw new Error(`writes did not verify:\n  - ${problems.join("\n  - ")}`);

    console.log("Promotion linkage recorded and verified:");
    console.log(`  Repository ${repo.id}  Candidate ID ${candidateId}`);
    console.log(`    Triage Status    = ${selectName(repoBack["Triage Status"])}`);
    console.log(`    Reviewed At      = ${repoBack["Reviewed At"]}`);
    console.log(`    Promoted To Case = ${repoBack["Promoted To Case"]}`);
    if (reviewedBy) console.log(`    Reviewed By      = ${repoBack["Reviewed By"]}`);
    console.log(`  Cases ${kase.id}  Case ID ${caseId}`);
    console.log(`    Source Candidate ID = ${caseBack["Source Candidate ID"]}`);
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
