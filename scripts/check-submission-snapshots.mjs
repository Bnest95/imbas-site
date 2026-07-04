// scripts/check-submission-snapshots.mjs — read-only integrity check for as-submitted
// grant snapshots.
//
// Grant applications are submitted by hand; when a submission is confirmed we keep an
// "as-submitted" copy of the exact artifact under grant-engine/applications/ as
// name-SUBMITTED-YYYY-MM-DD.ext. This script does NOT create those snapshots — it only
// verifies the ones that already exist, against a hand-maintained ledger:
//
//   grant-engine/applications/submissions-ledger.json
//
// For every ledger entry marked "snapshot_present" it recomputes the sha256 of each
// recorded artifact file and asserts it still matches the hash written in the ledger.
// That makes the snapshots tamper-evident: if a supposedly-frozen artifact is edited or
// goes missing, the check fails loudly. Entries marked "submission_version_unknown" are
// listed as open gaps for human review — they are NOT failures, because the honest state
// of most hand submissions is "we know it was submitted, we cannot prove which byte-exact
// draft went out." The script never fabricates a snapshot and never copies a live draft.
//
// READ-ONLY by construction: it reads the ledger and hashes the artifact files, and it
// writes nothing, touches no network, and never opens Airtable or Gmail. It does not print
// the contents of any artifact and does not print hash values — a mismatch is reported by
// filename and reason only.
//
// grant-engine/ is local scratch and is not committed, so in a fresh checkout the ledger
// is absent. That is not an error: the script says so and exits 0 (nothing to verify).
//
// Usage:
//   node scripts/check-submission-snapshots.mjs [--help]
//
// Exit codes: 0 ok (all present artifacts verify, or no ledger to check) · 2 bad usage ·
// 1 runtime (ledger unreadable / not valid JSON) · 4 check failed (a snapshot artifact is
// missing or its hash no longer matches, or the ledger is internally inconsistent).
//
// Run: node scripts/check-submission-snapshots.mjs

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

// Where the ledger and the artifacts live, relative to this script (scripts/..).
export const APPLICATIONS_DIR = "grant-engine/applications";
export const LEDGER_FILE = "submissions-ledger.json";

export const ARTIFACT_STATUS = Object.freeze({
  PRESENT: "snapshot_present",
  UNKNOWN: "submission_version_unknown",
});

const HEX64 = /^[0-9a-f]{64}$/;

const USAGE = `check-submission-snapshots — read-only integrity check for as-submitted grant snapshots.

Usage:
  node scripts/check-submission-snapshots.mjs [--help]

Verifies grant-engine/applications/submissions-ledger.json: for every entry marked
"snapshot_present" it rehashes the recorded artifact file(s) and asserts the sha256 still
matches. "submission_version_unknown" entries are listed as open gaps, not failures.
Read-only: writes nothing, no network, no Airtable, no Gmail. Never prints artifact
contents or hash values. Exits 0 when there is no ledger to check.`;

export function parseArgs(args) {
  for (const a of args) {
    if (a === "--help" || a === "-h") return { help: true };
    throw new Error(`unknown argument: ${a}`);
  }
  return { help: false };
}

// Validate the ledger's shape and per-entry invariants without touching disk. Returns the
// entries plus a list of human-readable structural problems; a non-empty problems list
// means the ledger itself is untrustworthy (fail before any hashing).
export function validateLedger(ledger) {
  const problems = [];
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) {
    return { entries: [], problems: ["ledger is not a JSON object"] };
  }
  const entries = ledger.submissions;
  if (!Array.isArray(entries)) {
    return { entries: [], problems: ['ledger.submissions must be an array'] };
  }

  entries.forEach((e, i) => {
    const where = `submissions[${i}]${e && e.grant_id ? ` (${e.grant_id})` : ""}`;
    if (!e || typeof e !== "object") {
      problems.push(`${where}: not an object`);
      return;
    }
    if (typeof e.grant_id !== "string" || !e.grant_id.trim()) problems.push(`${where}: missing grant_id`);
    if (typeof e.funder !== "string" || !e.funder.trim()) problems.push(`${where}: missing funder`);

    const status = e.artifact_status;
    const known = status === ARTIFACT_STATUS.PRESENT || status === ARTIFACT_STATUS.UNKNOWN;
    if (!known) problems.push(`${where}: artifact_status must be "${ARTIFACT_STATUS.PRESENT}" or "${ARTIFACT_STATUS.UNKNOWN}"`);

    const artifacts = e.artifacts;
    if (!Array.isArray(artifacts)) {
      problems.push(`${where}: artifacts must be an array`);
    } else if (status === ARTIFACT_STATUS.PRESENT) {
      if (artifacts.length === 0) problems.push(`${where}: snapshot_present requires at least one artifact`);
      artifacts.forEach((a, j) => {
        const aw = `${where}.artifacts[${j}]`;
        if (!a || typeof a !== "object") { problems.push(`${aw}: not an object`); return; }
        if (typeof a.file !== "string" || !a.file.trim()) problems.push(`${aw}: missing file`);
        if (typeof a.sha256 !== "string" || !HEX64.test(a.sha256)) problems.push(`${aw}: sha256 must be 64 lowercase hex chars`);
      });
    } else if (status === ARTIFACT_STATUS.UNKNOWN && artifacts.length !== 0) {
      // The honest invariant: if we cannot establish which artifact went out, we hold no
      // artifact for it. A populated unknown entry means someone attached a guess.
      problems.push(`${where}: submission_version_unknown must carry no artifacts (found ${artifacts.length})`);
    }
  });

  return { entries, problems };
}

// Split entries by status. Pure; ordering is by grant_id so the report is deterministic.
export function classifyLedger(entries) {
  const present = [];
  const unknown = [];
  for (const e of entries) {
    if (e && e.artifact_status === ARTIFACT_STATUS.PRESENT) present.push(e);
    else unknown.push(e);
  }
  const byGrant = (a, b) => String(a.grant_id).localeCompare(String(b.grant_id));
  present.sort(byGrant);
  unknown.sort(byGrant);
  return {
    total: entries.length,
    present,
    unknown,
    presentCount: present.length,
    unknownCount: unknown.length,
  };
}

// Verify recorded artifact hashes against freshly-computed ones. hashesByFile maps an
// artifact filename to its current sha256 hex, or null when the file is missing on disk;
// injecting this map keeps the function pure and lets tests exercise every branch without
// real files. Never returns or echoes a hash value — only filenames and reasons.
export function verifyArtifacts(presentEntries, hashesByFile) {
  const get = (f) => (hashesByFile instanceof Map ? hashesByFile.get(f) : hashesByFile[f]);
  let checked = 0;
  let verified = 0;
  const failures = [];
  for (const e of presentEntries) {
    for (const a of e.artifacts || []) {
      checked += 1;
      const actual = get(a.file);
      if (actual == null) {
        failures.push({ grant_id: e.grant_id, file: a.file, reason: "artifact-missing" });
      } else if (actual !== a.sha256) {
        failures.push({ grant_id: e.grant_id, file: a.file, reason: "hash-mismatch" });
      } else {
        verified += 1;
      }
    }
  }
  return { checked, verified, failures };
}

export function pct(n, d) {
  if (!d) return "n/a";
  return `${((n / d) * 100).toFixed(1)}%`;
}

// A terse, body-free description of the confirmation evidence: source and type only. The
// ledger stores references (message-id / sender / subject / date), never email bodies, and
// the report deliberately surfaces even less — enough to see provenance, nothing quotable.
function confidenceTag(e) {
  const ev = e && e.confirmation_evidence;
  if (!ev || typeof ev !== "object") return "conf: none";
  const source = typeof ev.source === "string" && ev.source ? ev.source : "none";
  const type = typeof ev.type === "string" && ev.type ? ev.type : "none";
  return `conf: ${source}/${type}`;
}

function dateOf(e) {
  return (e && typeof e.submitted_date === "string" && e.submitted_date) || "date?";
}

export function formatReport({ classify, verify, ledgerPath }) {
  const lines = [];
  lines.push("As-submitted snapshot integrity (read-only)");
  if (ledgerPath) lines.push(`  ledger ${ledgerPath}`);
  lines.push("");
  lines.push(`Snapshot coverage: ${classify.presentCount} / ${classify.total} (${pct(classify.presentCount, classify.total)})`);
  lines.push(`  artifacts verified: ${verify.verified} / ${verify.checked}`);
  lines.push("");

  lines.push(`snapshot_present (${classify.presentCount})`);
  for (const e of classify.present) {
    const failedFiles = new Set(verify.failures.filter((f) => f.grant_id === e.grant_id).map((f) => f.file));
    lines.push(`  ${e.grant_id} — ${e.funder} — ${dateOf(e)} — ${confidenceTag(e)}`);
    for (const a of e.artifacts || []) {
      const mark = failedFiles.has(a.file) ? "FAIL" : "ok";
      lines.push(`      [${mark}] ${a.file}`);
    }
  }
  lines.push("");

  lines.push(`submission_version_unknown (${classify.unknownCount}) — need human review, exact submitted artifact not established`);
  for (const e of classify.unknown) {
    lines.push(`  ${e.grant_id} — ${e.funder} — ${dateOf(e)} — ${confidenceTag(e)}`);
  }

  if (verify.failures.length) {
    lines.push("");
    lines.push(`INTEGRITY FAILURES (${verify.failures.length})`);
    for (const f of verify.failures) {
      const why = f.reason === "artifact-missing"
        ? "recorded artifact file not found on disk"
        : "sha256 no longer matches the ledger (artifact changed)";
      lines.push(`  ${f.grant_id}: ${f.file} — ${f.reason}: ${why}`);
    }
  }

  return lines.join("\n");
}

// --- IO boundary -----------------------------------------------------------------------
// Everything below touches disk. The pure functions above hold all the logic so the tests
// never need a real ledger or real artifacts.

// sha256 of a file's bytes, or null when the file is absent. Content is hashed and
// discarded — never returned, stored, or printed.
export function fileSha256(path) {
  if (!existsSync(path)) return null;
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function repoRoot() {
  return dirname(dirname(fileURLToPath(import.meta.url)));
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

  const root = repoRoot();
  const appsDir = join(root, APPLICATIONS_DIR);
  const ledgerPath = join(appsDir, LEDGER_FILE);

  if (!existsSync(ledgerPath)) {
    console.log(`No submissions ledger at ${ledgerPath}`);
    console.log("grant-engine/ is local scratch and is not committed, so a fresh checkout has nothing to verify. Exiting 0.");
    return;
  }

  let ledger;
  try {
    ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
  } catch (e) {
    console.error(`error: could not read or parse ${ledgerPath}: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const { entries, problems } = validateLedger(ledger);
  if (problems.length) {
    console.error("error: submissions ledger is internally inconsistent:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 4;
    return;
  }

  const classify = classifyLedger(entries);

  // Hash each unique artifact referenced by a snapshot_present entry, once.
  const hashesByFile = new Map();
  for (const e of classify.present) {
    for (const a of e.artifacts || []) {
      if (!hashesByFile.has(a.file)) hashesByFile.set(a.file, fileSha256(resolve(appsDir, a.file)));
    }
  }

  const verify = verifyArtifacts(classify.present, hashesByFile);
  console.log(formatReport({ classify, verify, ledgerPath }));

  if (verify.failures.length) process.exitCode = 4;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
