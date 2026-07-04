// check-submission-snapshots — integrity logic for the as-submitted snapshot checker.
// Pure functions only, exercised with synthetic in-memory fixtures. These tests never read
// grant-engine/ (which is uncommitted local scratch and absent in CI), never touch disk,
// and never hit the network — importing the module does not run main() (guarded on being
// the entry file). Hashes here are synthetic 64-hex strings, not real document digests.
// Run: node --test test/check-submission-snapshots.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ARTIFACT_STATUS,
  parseArgs,
  validateLedger,
  classifyLedger,
  verifyArtifacts,
  pct,
  formatReport,
} from "../scripts/check-submission-snapshots.mjs";

// Deterministic synthetic digests — clearly not real document hashes.
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);

function presentEntry(over = {}) {
  return {
    grant_id: "FORESIGHT",
    funder: "Foresight Institute",
    submitted_date: "2026-06-30",
    artifact_status: ARTIFACT_STATUS.PRESENT,
    artifacts: [{ file: "foresight-SUBMITTED-2026-06-30.md", sha256: HASH_A }],
    confirmation_evidence: { source: "gmail", type: "acknowledgment" },
    ...over,
  };
}

function unknownEntry(over = {}) {
  return {
    grant_id: "EMERGENT-VENTURES",
    funder: "Mercatus / Emergent Ventures",
    submitted_date: "2026-07-01",
    artifact_status: ARTIFACT_STATUS.UNKNOWN,
    artifacts: [],
    confirmation_evidence: { source: "gmail", type: "acknowledgment" },
    ...over,
  };
}

test("parseArgs accepts help and empty argv, rejects unknown flags", () => {
  assert.deepEqual(parseArgs([]), { help: false });
  assert.deepEqual(parseArgs(["--help"]), { help: true });
  assert.deepEqual(parseArgs(["-h"]), { help: true });
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
  assert.throws(() => parseArgs(["stray"]), /unknown argument/);
});

test("validateLedger accepts a well-formed ledger with no problems", () => {
  const { entries, problems } = validateLedger({
    schema: 1,
    submissions: [presentEntry(), unknownEntry()],
  });
  assert.equal(entries.length, 2);
  assert.deepEqual(problems, []);
});

test("validateLedger rejects non-object and missing submissions array", () => {
  assert.deepEqual(validateLedger(null).problems, ["ledger is not a JSON object"]);
  assert.deepEqual(validateLedger([]).problems, ["ledger is not a JSON object"]);
  assert.deepEqual(validateLedger({}).problems, ["ledger.submissions must be an array"]);
});

test("validateLedger flags missing grant_id and funder", () => {
  const { problems } = validateLedger({
    submissions: [{ artifact_status: ARTIFACT_STATUS.UNKNOWN, artifacts: [] }],
  });
  assert.ok(problems.some((p) => /missing grant_id/.test(p)));
  assert.ok(problems.some((p) => /missing funder/.test(p)));
});

test("validateLedger flags an unknown artifact_status", () => {
  const { problems } = validateLedger({
    submissions: [presentEntry({ artifact_status: "submitted" })],
  });
  assert.ok(problems.some((p) => /artifact_status must be/.test(p)));
});

test("validateLedger requires >=1 artifact for snapshot_present", () => {
  const { problems } = validateLedger({
    submissions: [presentEntry({ artifacts: [] })],
  });
  assert.ok(problems.some((p) => /snapshot_present requires at least one artifact/.test(p)));
});

test("validateLedger validates artifact file and sha256 shape", () => {
  const { problems } = validateLedger({
    submissions: [
      presentEntry({ artifacts: [{ file: "", sha256: HASH_A }] }),
      presentEntry({ grant_id: "X", artifacts: [{ file: "a.md", sha256: "not-hex" }] }),
      presentEntry({ grant_id: "Y", artifacts: [{ file: "b.md", sha256: HASH_A.toUpperCase() }] }),
    ],
  });
  assert.ok(problems.some((p) => /missing file/.test(p)));
  assert.equal(problems.filter((p) => /sha256 must be 64 lowercase hex/.test(p)).length, 2);
});

test("validateLedger forbids artifacts on submission_version_unknown", () => {
  const { problems } = validateLedger({
    submissions: [unknownEntry({ artifacts: [{ file: "guess.md", sha256: HASH_A }] })],
  });
  assert.ok(problems.some((p) => /must carry no artifacts/.test(p)));
});

test("classifyLedger splits present vs unknown and sorts by grant_id", () => {
  const entries = [
    unknownEntry({ grant_id: "ZULU" }),
    presentEntry({ grant_id: "MIKE" }),
    unknownEntry({ grant_id: "ALPHA" }),
    presentEntry({ grant_id: "BRAVO" }),
  ];
  const c = classifyLedger(entries);
  assert.equal(c.total, 4);
  assert.equal(c.presentCount, 2);
  assert.equal(c.unknownCount, 2);
  assert.deepEqual(c.present.map((e) => e.grant_id), ["BRAVO", "MIKE"]);
  assert.deepEqual(c.unknown.map((e) => e.grant_id), ["ALPHA", "ZULU"]);
});

test("verifyArtifacts passes when every recorded hash matches (Map input)", () => {
  const present = [presentEntry()];
  const hashes = new Map([["foresight-SUBMITTED-2026-06-30.md", HASH_A]]);
  const v = verifyArtifacts(present, hashes);
  assert.equal(v.checked, 1);
  assert.equal(v.verified, 1);
  assert.deepEqual(v.failures, []);
});

test("verifyArtifacts flags a hash mismatch without leaking the hash value", () => {
  const present = [presentEntry()];
  const v = verifyArtifacts(present, new Map([["foresight-SUBMITTED-2026-06-30.md", HASH_B]]));
  assert.equal(v.verified, 0);
  assert.equal(v.failures.length, 1);
  assert.equal(v.failures[0].reason, "hash-mismatch");
  assert.equal(v.failures[0].file, "foresight-SUBMITTED-2026-06-30.md");
  // The failure record carries no hash values, recorded or actual.
  const serialized = JSON.stringify(v.failures);
  assert.ok(!serialized.includes(HASH_A), "must not leak the recorded hash");
  assert.ok(!serialized.includes(HASH_B), "must not leak the computed hash");
});

test("verifyArtifacts flags a missing artifact (null hash) and tolerates plain-object maps", () => {
  const present = [presentEntry({ artifacts: [{ file: "gone.md", sha256: HASH_A }] })];
  // null => missing on disk; a plain object works as well as a Map.
  const v = verifyArtifacts(present, { "gone.md": null });
  assert.equal(v.failures.length, 1);
  assert.equal(v.failures[0].reason, "artifact-missing");
  // A file the caller never hashed (undefined) is also treated as missing.
  const v2 = verifyArtifacts(present, {});
  assert.equal(v2.failures[0].reason, "artifact-missing");
});

test("verifyArtifacts checks every artifact of a multi-file snapshot", () => {
  const present = [presentEntry({
    grant_id: "LONGVIEW",
    artifacts: [
      { file: "longview-SUBMITTED-2026-07-02.md", sha256: HASH_A },
      { file: "longview-cv-SUBMITTED-2026-07-02.pdf", sha256: HASH_B },
    ],
  })];
  const hashes = new Map([
    ["longview-SUBMITTED-2026-07-02.md", HASH_A],
    ["longview-cv-SUBMITTED-2026-07-02.pdf", HASH_C], // wrong
  ]);
  const v = verifyArtifacts(present, hashes);
  assert.equal(v.checked, 2);
  assert.equal(v.verified, 1);
  assert.equal(v.failures.length, 1);
  assert.equal(v.failures[0].file, "longview-cv-SUBMITTED-2026-07-02.pdf");
});

test("pct formats one decimal and guards a zero denominator", () => {
  assert.equal(pct(2, 12), "16.7%");
  assert.equal(pct(2, 2), "100.0%");
  assert.equal(pct(0, 0), "n/a");
});

test("formatReport renders coverage, ok/FAIL marks, and unknown gaps; leaks no hash or email body", () => {
  const entries = [
    presentEntry(),
    presentEntry({
      grant_id: "LONGVIEW",
      funder: "Longview Philanthropy",
      submitted_date: "2026-07-02",
      artifacts: [
        { file: "longview-SUBMITTED-2026-07-02.md", sha256: HASH_A },
        { file: "longview-cv-SUBMITTED-2026-07-02.pdf", sha256: HASH_B },
      ],
      confirmation_evidence: {
        source: "gmail",
        type: "full_copy_receipt",
        // Reference fields the report must NOT surface as prose/body:
        subject: "SECRET-SUBJECT-LINE-should-not-appear",
        message_id: "MSGID-should-not-appear",
      },
    }),
    unknownEntry(),
  ];
  const classify = classifyLedger(entries);
  const hashes = new Map([
    ["foresight-SUBMITTED-2026-06-30.md", HASH_A],
    ["longview-SUBMITTED-2026-07-02.md", HASH_A],
    ["longview-cv-SUBMITTED-2026-07-02.pdf", HASH_C], // mismatch -> FAIL
  ]);
  const verify = verifyArtifacts(classify.present, hashes);
  const out = formatReport({ classify, verify, ledgerPath: "grant-engine/applications/submissions-ledger.json" });

  assert.match(out, /Snapshot coverage: 2 \/ 3 \(66\.7%\)/);
  assert.match(out, /artifacts verified: 2 \/ 3/);
  assert.match(out, /snapshot_present \(2\)/);
  assert.match(out, /\[ok\] foresight-SUBMITTED-2026-06-30\.md/);
  assert.match(out, /\[FAIL\] longview-cv-SUBMITTED-2026-07-02\.pdf/);
  assert.match(out, /submission_version_unknown \(1\)/);
  assert.match(out, /EMERGENT-VENTURES/);
  assert.match(out, /conf: gmail\/acknowledgment/);
  assert.match(out, /conf: gmail\/full_copy_receipt/);
  assert.match(out, /INTEGRITY FAILURES \(1\)/);

  // Never leak a hash value or an email reference field into the printed report.
  assert.ok(!out.includes(HASH_A), "report must not print hash values");
  assert.ok(!out.includes(HASH_B), "report must not print hash values");
  assert.ok(!out.includes("SECRET-SUBJECT-LINE-should-not-appear"), "report must not print email subjects");
  assert.ok(!out.includes("MSGID-should-not-appear"), "report must not print message ids");
});

test("formatReport reports a clean run with no failures section", () => {
  const classify = classifyLedger([presentEntry(), unknownEntry()]);
  const verify = verifyArtifacts(classify.present, new Map([["foresight-SUBMITTED-2026-06-30.md", HASH_A]]));
  const out = formatReport({ classify, verify, ledgerPath: "x" });
  assert.match(out, /Snapshot coverage: 1 \/ 2 \(50\.0%\)/);
  assert.ok(!out.includes("INTEGRITY FAILURES"), "no failures section when everything verifies");
});
