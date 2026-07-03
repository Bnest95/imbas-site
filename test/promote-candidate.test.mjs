// promote-candidate — mapping/validation logic for the internal promotion-linkage CLI.
// Pure functions only: no network, no Airtable, no token needed. Importing the module
// does not run main() (it is guarded on being the entry file), so these tests never
// touch a live base.
// Run: node --test test/promote-candidate.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TRIAGE_PROMOTED,
  REPO_WRITE_FIELDS,
  CASE_WRITE_FIELDS,
  ValidationError,
  hasControlChars,
  validateCandidateId,
  validateCaseId,
  validateReviewedBy,
  buildRepositoryFields,
  buildCaseFields,
  buildLookupFormula,
  selectName,
  diffRepositoryWrite,
  diffCaseWrite,
  parseArgs,
} from "../scripts/promote-candidate.mjs";

const NUL = String.fromCharCode(0);
const TAB = String.fromCharCode(9);
const DEL = String.fromCharCode(127);

test("TRIAGE_PROMOTED is the existing terminal-decision option name", () => {
  assert.equal(TRIAGE_PROMOTED, "promoted");
});

test("validateCandidateId accepts valid ids and trims", () => {
  assert.equal(validateCandidateId("CAND-abc12"), "CAND-abc12");
  assert.equal(validateCandidateId("  CAND-xyz  "), "CAND-xyz");
  assert.equal(validateCandidateId("CAND_0001"), "CAND_0001");
});

test("validateCandidateId rejects empty, oversized, and unsafe ids", () => {
  assert.throws(() => validateCandidateId(""), /required/);
  assert.throws(() => validateCandidateId("   "), /required/);
  assert.throws(() => validateCandidateId(null), /required/);
  assert.throws(() => validateCandidateId("a".repeat(65)), /too long/);
  assert.throws(() => validateCandidateId("CAND 1"), /invalid characters/); // space
  assert.throws(() => validateCandidateId("CAND-1'; DROP"), /invalid characters/); // quote + space
  assert.throws(() => validateCandidateId("CAND{1}"), /invalid characters/);
  assert.throws(() => validateCandidateId("CAND(1)"), /invalid characters/);
});

test("validateCaseId accepts case ids and trims", () => {
  assert.equal(validateCaseId("005"), "005");
  assert.equal(validateCaseId(" 018 "), "018");
  assert.equal(validateCaseId("003-T1"), "003-T1");
  assert.equal(validateCaseId("a.b_c"), "a.b_c");
});

test("validateCaseId rejects empty, oversized, and unsafe ids", () => {
  assert.throws(() => validateCaseId(""), /required/);
  assert.throws(() => validateCaseId("x".repeat(33)), /too long/);
  assert.throws(() => validateCaseId("005'"), /invalid characters/);
  assert.throws(() => validateCaseId("005(x)"), /invalid characters/);
  assert.throws(() => validateCaseId("00{5}"), /invalid characters/);
});

test("validateReviewedBy is optional and allows spaces and hyphens in names", () => {
  assert.equal(validateReviewedBy(null), "");
  assert.equal(validateReviewedBy(undefined), "");
  assert.equal(validateReviewedBy(""), "");
  assert.equal(validateReviewedBy("   "), "");
  assert.equal(validateReviewedBy("Brendan Nestor"), "Brendan Nestor");
  assert.equal(validateReviewedBy("Jean-Luc"), "Jean-Luc");
  assert.equal(validateReviewedBy("  B  "), "B");
});

test("validateReviewedBy rejects oversized names and control characters", () => {
  assert.throws(() => validateReviewedBy("x".repeat(129)), /too long/);
  assert.throws(() => validateReviewedBy("bad" + NUL), /control characters/); // NUL survives trim
  assert.throws(() => validateReviewedBy("ba" + TAB + "d"), /control characters/); // interior tab survives trim
  assert.equal(validateReviewedBy("bad" + TAB), "bad"); // trailing tab is trimmed away, harmless
});

test("hasControlChars distinguishes printable from control", () => {
  assert.equal(hasControlChars("clean-name"), false);
  assert.equal(hasControlChars("Brendan Nestor"), false); // space is printable
  assert.equal(hasControlChars(TAB), true);
  assert.equal(hasControlChars(NUL), true);
  assert.equal(hasControlChars(DEL), true);
  assert.equal(hasControlChars("a" + String.fromCharCode(31)), true);
});

test("buildRepositoryFields writes exactly the review + link fields", () => {
  const f = buildRepositoryFields({ caseId: "005", now: "2026-07-03T00:00:00.000Z" });
  assert.deepEqual(f, {
    "Reviewed At": "2026-07-03T00:00:00.000Z",
    "Triage Status": "promoted",
    "Promoted To Case": "005",
  });
  assert.ok(!("Reviewed By" in f)); // omitted when no reviewer
});

test("buildRepositoryFields includes Reviewed By only when provided", () => {
  const withBy = buildRepositoryFields({ caseId: "005", now: "T", reviewedBy: "Brendan" });
  assert.equal(withBy["Reviewed By"], "Brendan");
  const emptyBy = buildRepositoryFields({ caseId: "005", now: "T", reviewedBy: "" });
  assert.ok(!("Reviewed By" in emptyBy));
});

test("buildRepositoryFields never writes outside the allowlist", () => {
  const f = buildRepositoryFields({ caseId: "005", now: "T", reviewedBy: "Brendan" });
  for (const key of Object.keys(f)) {
    assert.ok(REPO_WRITE_FIELDS.includes(key), `unexpected field written: ${key}`);
  }
});

test("buildCaseFields writes only the back-link", () => {
  const f = buildCaseFields({ candidateId: "CAND-1" });
  assert.deepEqual(f, { "Source Candidate ID": "CAND-1" });
  for (const key of Object.keys(f)) {
    assert.ok(CASE_WRITE_FIELDS.includes(key), `unexpected field written: ${key}`);
  }
});

test("buildLookupFormula produces a safe TRIM-equality formula", () => {
  assert.equal(buildLookupFormula("Candidate ID", "CAND-1"), "TRIM({Candidate ID})='CAND-1'");
  assert.equal(buildLookupFormula("Case ID", "005"), "TRIM({Case ID})='005'");
});

test("buildLookupFormula refuses formula metacharacters", () => {
  assert.throws(() => buildLookupFormula("Candidate ID", "x'y"), /unsafe/);
  assert.throws(() => buildLookupFormula("Candidate ID", "a{b}"), /unsafe/);
  assert.throws(() => buildLookupFormula("Candidate ID", "a)b"), /unsafe/);
  assert.throws(() => buildLookupFormula("Candidate ID", 'a"b'), /unsafe/);
});

test("selectName handles string, object, and empty shapes", () => {
  assert.equal(selectName("promoted"), "promoted");
  assert.equal(selectName({ id: "sel1", name: "promoted" }), "promoted");
  assert.equal(selectName(null), "");
  assert.equal(selectName(undefined), "");
});

test("diffRepositoryWrite passes a correct read-back (string and object triage)", () => {
  const base = {
    "Triage Status": "promoted",
    "Reviewed At": "2026-07-03T00:00:00.000Z",
    "Promoted To Case": "005",
  };
  assert.deepEqual(diffRepositoryWrite(base, { caseId: "005", reviewedBy: "" }), []);
  const objTriage = { ...base, "Triage Status": { id: "selpGqRSloxhar1V8", name: "promoted" } };
  assert.deepEqual(diffRepositoryWrite(objTriage, { caseId: "005", reviewedBy: "" }), []);
});

test("diffRepositoryWrite flags each wrong field", () => {
  const wrongTriage = diffRepositoryWrite(
    { "Triage Status": "new", "Reviewed At": "T", "Promoted To Case": "005" },
    { caseId: "005", reviewedBy: "" },
  );
  assert.equal(wrongTriage.length, 1);
  assert.match(wrongTriage[0], /Triage Status/);

  const noReviewedAt = diffRepositoryWrite(
    { "Triage Status": "promoted", "Reviewed At": "", "Promoted To Case": "005" },
    { caseId: "005", reviewedBy: "" },
  );
  assert.equal(noReviewedAt.length, 1);
  assert.match(noReviewedAt[0], /Reviewed At/);

  const wrongCase = diffRepositoryWrite(
    { "Triage Status": "promoted", "Reviewed At": "T", "Promoted To Case": "999" },
    { caseId: "005", reviewedBy: "" },
  );
  assert.equal(wrongCase.length, 1);
  assert.match(wrongCase[0], /Promoted To Case/);
});

test("diffRepositoryWrite checks Reviewed By only when a reviewer was requested", () => {
  const readBack = { "Triage Status": "promoted", "Reviewed At": "T", "Promoted To Case": "005" };
  // reviewer requested but not written back -> problem
  const missing = diffRepositoryWrite(readBack, { caseId: "005", reviewedBy: "Brendan" });
  assert.equal(missing.length, 1);
  assert.match(missing[0], /Reviewed By/);
  // reviewer requested and matches -> clean
  const ok = diffRepositoryWrite({ ...readBack, "Reviewed By": "Brendan" }, { caseId: "005", reviewedBy: "Brendan" });
  assert.deepEqual(ok, []);
  // no reviewer requested -> Reviewed By is not asserted at all
  const ignored = diffRepositoryWrite({ ...readBack, "Reviewed By": "someone else" }, { caseId: "005", reviewedBy: "" });
  assert.deepEqual(ignored, []);
});

test("diffCaseWrite verifies the back-link", () => {
  assert.deepEqual(diffCaseWrite({ "Source Candidate ID": "CAND-1" }, { candidateId: "CAND-1" }), []);
  const wrong = diffCaseWrite({ "Source Candidate ID": "CAND-2" }, { candidateId: "CAND-1" });
  assert.equal(wrong.length, 1);
  assert.match(wrong[0], /Source Candidate ID/);
  const empty = diffCaseWrite({}, { candidateId: "CAND-1" });
  assert.equal(empty.length, 1);
});

test("parseArgs reads long flags, short flags, and inline =values", () => {
  assert.deepEqual(parseArgs(["--candidate", "CAND-1", "--case", "005"]), {
    candidate: "CAND-1", caseId: "005", by: "", dryRun: false, help: false,
  });
  assert.deepEqual(parseArgs(["--candidate=CAND-1", "--case=005", "--dry-run"]), {
    candidate: "CAND-1", caseId: "005", by: "", dryRun: true, help: false,
  });
  assert.deepEqual(parseArgs(["-c", "CAND-1", "-k", "005", "-b", "Bee"]), {
    candidate: "CAND-1", caseId: "005", by: "Bee", dryRun: false, help: false,
  });
  // order independence
  assert.deepEqual(parseArgs(["--by", "Bee", "-k", "005", "-c", "CAND-1"]), {
    candidate: "CAND-1", caseId: "005", by: "Bee", dryRun: false, help: false,
  });
});

test("parseArgs handles help and empty argv", () => {
  assert.equal(parseArgs(["--help"]).help, true);
  assert.equal(parseArgs(["-h"]).help, true);
  assert.deepEqual(parseArgs([]), { candidate: "", caseId: "", by: "", dryRun: false, help: false });
});

test("parseArgs throws on missing values and unknown flags", () => {
  assert.throws(() => parseArgs(["--candidate"]), ValidationError);
  assert.throws(() => parseArgs(["--candidate"]), /missing value/);
  assert.throws(() => parseArgs(["--case"]), /missing value/);
  assert.throws(() => parseArgs(["--wat"]), /unknown argument/);
  assert.throws(() => parseArgs(["extra"]), /unknown argument/);
});
