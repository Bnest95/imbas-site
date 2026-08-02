// d1-registry-custody.test.mjs — the custody invariants D1 exists to hold.
//
// THE RULES, each from the D1 import contract (FR-2026-08-02-D1):
//
//   R13  Artifact statuses import as the literal strings the record wrote,
//        including the values outside the declared four. Coercing them into the
//        declared vocabulary reconstructs the record instead of carrying it.
//   R16  A row whose amendment supplies a status for cross-row use keeps both
//        values. Neither silently replaces the other, so the cohort a reader
//        gets by grouping on the amended value is larger than the one they get
//        by grouping on the recorded value — and that difference is the point.
//   R18  capture_status is frozen and its later additions live as dated
//        amendments beside it. A validator reading only the array rejects a
//        value the record permits; one that merges them loses the ability to say
//        which rows were judged against which vocabulary. ACCESS_RESTRICTED is a
//        capture status and never an artifact status.
//   R19  The continuity addendum is withdrawn: the term does not exist in the
//        governed record. What the record supports is that a retry gets its own
//        capture_id and preserves a reference to the first attempt. This sitting
//        has zero retries, so retry_of is prospective and never invented.
//
// and from the import contract's own numbered rules:
//
//   rule 2  A field the record does not carry is ABSENT from the imported
//        record. Creating the key and filling it with null asserts "we looked
//        and found nothing" where the record supports only "the schema never
//        carried it".
//
// WHY IT IS SPLIT IN TWO. The synthetic tests are the guarantee: they run
// everywhere, including CI, and they fail on the rule rather than on the data.
// The record-backed tests then assert the same invariants hold on the governed
// record, and SKIP when it is unreachable — it lives outside this repository
// and CI has no access to it. A skip is not a pass, and the import runner is
// what proves the record itself.
//
// WHAT THE RECORD-BACKED TESTS MAY ASSERT. This repository is public and the
// governed record is not. So these tests assert RELATIONSHIPS, never values:
// that the amended cohort strictly contains the recorded one, not how many rows
// are in it; that some artifact status falls outside the declared vocabulary,
// not which one. No capture_id, no hash, no count from the record appears in
// this file, and the last test in it enforces that.
//
// WHAT EACH TEST CATCHES. Verified by mutation when this file was written —
// reapply any of these and the named tests should go red:
//   · the importer aliases PRESENT onto CAPTURED ............... R13, synthetic
//                                                               and on the record
//   · carryPresentFields fills an absent key with null ..... rule 2, four tests,
//                                                               and four on the record
//   · the importer writes the amended status over capture_status .. R16, two
//                                                               synthetic and one on the record
//   · isValidArtifactStatus accepts ACCESS_RESTRICTED ......... R18 artifact bar
//   · captureStatusVocabulary ignores asJudgedOn .............. R18 prospectivity
//   · a capture identifier reaches any tracked file ........... tracked-tree scan
//
// The R16 pair is on that list twice because the first version of this file
// built its synthetic cohort as hand-written record shapes. That exercised
// effectiveCaptureStatus but never the importer, so an importer overwriting the
// recorded status was caught only by the record-backed test — which is to say,
// never in CI. The cohort now runs through importCaptureRecord.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { carryPresentFields, isAbsent, isPresentAndNull } from "../registry/field-custody.mjs";
import {
  ARTIFACT_STATUS_FROZEN,
  CAPTURE_STATUS_FROZEN,
  captureStatusVocabulary,
  classifyArtifactStatus,
  isValidArtifactStatus,
  isValidCaptureStatus,
  readStatusAmendments,
} from "../registry/status-vocabulary.mjs";
import {
  ARTIFACT_STATUS_FIELDS,
  CAPTURE_CONDITION_FIELDS,
  LINEAGE_FIELDS,
  cohortByEffectiveCaptureStatus,
  effectiveCaptureStatus,
  importCaptureRecord,
} from "../registry/capture-record.mjs";
import { importWave0, locateWave0Record, evaluateAcceptance } from "../registry/wave0-import.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const location = locateWave0Record();
const skipRecord = location.located
  ? false
  : `governed record unreachable (${location.reason}); it lives outside this repository`;

// One import, reused. Re-hashing every declared artifact is the expensive part
// and there is no reason to pay it per test.
let imported = null;
function record() {
  if (imported === null) imported = importWave0();
  return imported;
}

// ---------------------------------------------------------------------------
// Import contract rule 2 — absent and null are different claims
// ---------------------------------------------------------------------------

test("rule 2: a field the source does not carry stays absent, and is not created as null", () => {
  const source = { present_value: "PRESENT", present_null: null };
  const carried = carryPresentFields(source, ["present_value", "present_null", "never_existed"]);

  assert.deepEqual(Object.keys(carried).sort(), ["present_null", "present_value"]);
  assert.ok(isAbsent(carried, "never_existed"), "an absent field must not gain a key");
  assert.ok(
    isPresentAndNull(carried, "present_null"),
    "a field the record carries as null keeps its null; that is a different claim from absence",
  );
  assert.equal("never_existed" in carried, false);
});

test("rule 2: absence and present-null are distinguishable after a round trip through JSON", () => {
  const carried = carryPresentFields({ a: null }, ["a", "b"]);
  const round = JSON.parse(JSON.stringify(carried));
  assert.ok(isPresentAndNull(round, "a"));
  assert.ok(isAbsent(round, "b"), "serialization must not turn absence into a null-valued key");
});

test("R19: retry_of is prospective, nullable, and never invented", () => {
  assert.ok(LINEAGE_FIELDS.includes("retry_of"), "retry_of exists as a prospective lineage field");

  const historical = importCaptureRecord({ capture_id: "SYN-A", capture_status: "COMPLETE" });
  assert.ok(
    isAbsent(historical.lineage, "retry_of"),
    "a row that carries no retry_of must not gain one; a retry is not inferred from anything",
  );

  const prospective = importCaptureRecord({
    capture_id: "SYN-B",
    capture_status: "COMPLETE",
    retry_of: "SYN-A",
  });
  assert.equal(prospective.lineage.retry_of, "SYN-A", "a row that carries retry_of keeps it");
});

test("a replicate_of_pair label is carried as provenance and never becomes a relation", () => {
  const carried = importCaptureRecord({
    capture_id: "SYN-A",
    capture_status: "COMPLETE",
    replicate_of_pair: "slotN-PROVIDER",
    replicate_index: 2,
  });
  assert.equal(carried.lineage.replicate_of_pair, "slotN-PROVIDER");
  assert.ok(
    isAbsent(carried.lineage, "retry_of"),
    "replicate_of_pair is a variance-design label, not retry lineage (FR-2026-08-02-REPLICATION)",
  );
  assert.equal(
    JSON.stringify(carried).includes("REPLICATE"),
    false,
    "importing a replicate label must not produce a REPLICATE classification",
  );
});

// ---------------------------------------------------------------------------
// R13 — literal statuses
// ---------------------------------------------------------------------------

test("R13: an artifact status outside the declared vocabulary imports as written", () => {
  const outsider = "PRESERVED";
  assert.equal(
    ARTIFACT_STATUS_FROZEN.includes(outsider),
    false,
    "this test is only meaningful while the value is outside the declared vocabulary",
  );

  const carried = importCaptureRecord({
    capture_id: "SYN-A",
    capture_status: "COMPLETE",
    answer_artifact_status: outsider,
    source_panel_status: "NOT_CAPTURED",
  });

  assert.equal(carried.artifact_statuses.answer_artifact_status, outsider, "no coercion");
  assert.equal(classifyArtifactStatus(outsider).in_declared_vocabulary, false);
  assert.equal(classifyArtifactStatus("NOT_CAPTURED").in_declared_vocabulary, true);
});

test("R13: classification reports vocabulary membership and never maps one value onto another", () => {
  for (const value of ["COMPLETE", "PRESENT", "PRESERVED", "OBSERVED", "PARTIAL_INTERFACE"]) {
    const classified = classifyArtifactStatus(value);
    assert.equal(classified.value, value, "the reported value is the value that came in");
    assert.deepEqual(
      Object.keys(classified).sort(),
      ["in_declared_vocabulary", "value"],
      "classification carries no target, alias, or suggested replacement",
    );
  }
});

test("NOT_PRESENT and NOT_CAPTURED are different claims and neither collapses into the other", () => {
  const carried = importCaptureRecord({
    capture_id: "SYN-A",
    capture_status: "COMPLETE",
    source_panel_status: "NOT_PRESENT",
    suggested_followups_status: "NOT_CAPTURED",
  });
  assert.equal(carried.artifact_statuses.source_panel_status, "NOT_PRESENT");
  assert.equal(carried.artifact_statuses.suggested_followups_status, "NOT_CAPTURED");
  assert.ok(isValidArtifactStatus("NOT_PRESENT") && isValidArtifactStatus("NOT_CAPTURED"));
});

// ---------------------------------------------------------------------------
// R18 — the amendment-aware validator
// ---------------------------------------------------------------------------

const SYNTHETIC_VOCABULARY = Object.freeze({
  capture_status: [...CAPTURE_STATUS_FROZEN],
  artifact_status: [...ARTIFACT_STATUS_FROZEN],
  "amendment_2026-08-02_R18_access_restricted": {
    authority: "FR-2026-08-02-D1 R18",
    new_status: "ACCESS_RESTRICTED",
    class: "CAPTURE/ARM status. NEVER an artifact status.",
    effective: "PROSPECTIVE ONLY. Forward from 2026-08-02.",
    retrofit: "NONE.",
  },
});

test("R18: the frozen array alone rejects a value the record permits", () => {
  assert.equal(
    CAPTURE_STATUS_FROZEN.includes("ACCESS_RESTRICTED"),
    false,
    "the frozen array is left exactly as the governed rows were judged against it",
  );
  assert.equal(isValidCaptureStatus("ACCESS_RESTRICTED", []), false);
});

test("R18: the validator reading the array plus its amendments accepts it", () => {
  const amendments = readStatusAmendments(SYNTHETIC_VOCABULARY);
  assert.equal(amendments.length, 1);
  assert.equal(amendments[0].admitted_to, "capture_status");
  assert.equal(amendments[0].effective_from, "2026-08-02");
  assert.ok(isValidCaptureStatus("ACCESS_RESTRICTED", amendments));
});

test("R18: the amendment is prospective, so a vocabulary as judged earlier excludes it", () => {
  const amendments = readStatusAmendments(SYNTHETIC_VOCABULARY);
  assert.equal(
    isValidCaptureStatus("ACCESS_RESTRICTED", amendments, { asJudgedOn: "2026-07-30" }),
    false,
    "a row judged before the amendment was judged against a vocabulary without it",
  );
  assert.ok(isValidCaptureStatus("ACCESS_RESTRICTED", amendments, { asJudgedOn: "2026-08-02" }));

  const asJudged = captureStatusVocabulary(amendments, { asJudgedOn: "2026-07-30" });
  assert.deepEqual(asJudged.all, CAPTURE_STATUS_FROZEN);
  assert.deepEqual(asJudged.amendments_applied, []);
});

test("R18: an amended capture status never validates as an artifact status", () => {
  const amendments = readStatusAmendments(SYNTHETIC_VOCABULARY);
  assert.ok(isValidCaptureStatus("ACCESS_RESTRICTED", amendments));
  assert.equal(
    isValidArtifactStatus("ACCESS_RESTRICTED"),
    false,
    "artifact_status has no amendment channel; the amendment says so in its own words",
  );
  assert.equal(classifyArtifactStatus("ACCESS_RESTRICTED").in_declared_vocabulary, false);
});

test("R18: an amendment that does not say which vocabulary it extends is not admitted", () => {
  const vague = {
    capture_status: [...CAPTURE_STATUS_FROZEN],
    "amendment_2026-09-01_unclear": { new_status: "SOMETHING", class: "a new status" },
  };
  const [amendment] = readStatusAmendments(vague);
  assert.equal(amendment.admitted_to, null, "D1 does not infer which vocabulary to widen");
  assert.equal(isValidCaptureStatus("SOMETHING", [amendment]), false);
  assert.match(amendment.not_admitted_reason, /will not infer/);
});

// ---------------------------------------------------------------------------
// R16 — the amended cohort
// ---------------------------------------------------------------------------

// Built from synthetic rows shaped like governed ones and run through the
// importer, so the rule is enforced on the path the record actually takes.
// Asserting against hand-built record shapes would leave an importer that
// overwrites capture_status with the amended value undetected everywhere the
// governed record is unreachable, which is everywhere CI runs.
function syntheticCohort() {
  return [
    { capture_id: "SYN-1", capture_status: "PARTIAL_INTERFACE" },
    { capture_id: "SYN-2", capture_status: "PARTIAL_INTERFACE" },
    {
      capture_id: "SYN-3",
      capture_status: "COMPLETE",
      "amendment_2026-08-02_R16_synthetic": {
        recorded_capture_status: "COMPLETE",
        effective_for_comparison: "PARTIAL_INTERFACE",
        d1_instruction: "Never substitute one for the other silently.",
      },
    },
    { capture_id: "SYN-4", capture_status: "COMPLETE" },
  ].map(importCaptureRecord);
}

test("R16: an amended row keeps its recorded status and supplies a separate effective one", () => {
  const [, , amendedRow] = syntheticCohort();
  assert.equal(amendedRow.capture_status, "COMPLETE", "the recorded status is not overwritten");
  const effective = effectiveCaptureStatus(amendedRow);
  assert.equal(effective.status, "PARTIAL_INTERFACE");
  assert.equal(
    effective.basis,
    "amendment_2026-08-02_R16_synthetic",
    "the effective status names the amendment it came from, so neither value is silent",
  );
});

test("R16: an unamended row's effective status is its own, resolved rather than stored", () => {
  const [plain] = syntheticCohort();
  const effective = effectiveCaptureStatus(plain);
  assert.equal(effective.status, "PARTIAL_INTERFACE");
  assert.equal(effective.basis, "capture_status");
  assert.ok(
    isAbsent(plain, "effective_for_comparison"),
    "a row with no amendment must not gain an effective_for_comparison key it never had",
  );
});

test("R16: the cohort by effective status strictly contains the cohort by recorded status", () => {
  const rows = syntheticCohort();
  const byEffective = cohortByEffectiveCaptureStatus(rows).PARTIAL_INTERFACE;
  const byRecorded = rows
    .filter((row) => row.capture_status === "PARTIAL_INTERFACE")
    .map((row) => row.capture_id);

  for (const id of byRecorded) {
    assert.ok(byEffective.includes(id), "the amended cohort must contain every recorded member");
  }
  assert.ok(
    byEffective.length > byRecorded.length,
    "an aggregate taken on capture_status alone under-counts the cohort; that is the whole of R16",
  );
  assert.deepEqual(
    byEffective.filter((id) => !byRecorded.includes(id)),
    ["SYN-3"],
    "the difference is exactly the rows whose amendment supplies the value",
  );
});

// ---------------------------------------------------------------------------
// Record-backed. Skipped where the governed record is unreachable.
// ---------------------------------------------------------------------------

test("record: every governed row imports and none is dropped for its status", { skip: skipRecord }, () => {
  const result = record();
  assert.equal(result.counts.imported_rows, result.counts.governed_rows);
  assert.ok(result.counts.governed_rows > 0);
  assert.notEqual(
    result.counts.imported_rows,
    result.counts.planned_capture_count_declared,
    "acceptance keys to the governed manifest at acceptance, never to the planned count",
  );
});

test("record: no imported key was invented and none was dropped", { skip: skipRecord }, () => {
  for (const entry of record().captures) {
    const source = entry.record.source_row;
    for (const [group, fields] of [
      ["artifact_statuses", ARTIFACT_STATUS_FIELDS],
      ["conditions", CAPTURE_CONDITION_FIELDS],
      ["lineage", LINEAGE_FIELDS],
    ]) {
      assert.deepEqual(
        Object.keys(entry.record[group]).sort(),
        fields.filter((field) => Object.hasOwn(source, field)).sort(),
        `${group} must hold exactly the fields the governed row carries, no more and no fewer`,
      );
    }
  }
});

test("record: some artifact status falls outside the declared vocabulary and survived verbatim", { skip: skipRecord }, () => {
  const result = record();
  let outside = 0;
  for (const entry of result.captures) {
    const source = entry.record.source_row;
    for (const [field, value] of Object.entries(entry.record.artifact_statuses)) {
      assert.equal(value, source[field], "the imported status is the string the record wrote");
      if (!classifyArtifactStatus(value).in_declared_vocabulary) outside += 1;
    }
  }
  assert.ok(outside > 0, "R13 describes a record in which literal statuses exceed the declared four");
});

test("record: the amended cohort strictly contains the recorded one", { skip: skipRecord }, () => {
  const result = record();
  const rows = result.captures.map((entry) => entry.record);
  const byEffective = cohortByEffectiveCaptureStatus(rows).PARTIAL_INTERFACE ?? [];
  const byRecorded = rows
    .filter((row) => row.capture_status === "PARTIAL_INTERFACE")
    .map((row) => row.capture_id);

  for (const id of byRecorded) assert.ok(byEffective.includes(id));
  assert.ok(
    byEffective.length > byRecorded.length,
    "the governed record carries rows whose amendment supplies the comparison status",
  );
  for (const row of rows) {
    assert.equal(
      row.capture_status,
      row.source_row.capture_status,
      "no recorded capture_status was replaced by its amended value",
    );
  }
});

test("record: no imported row carries retry_of", { skip: skipRecord }, () => {
  for (const entry of record().captures) {
    assert.ok(isAbsent(entry.record.lineage, "retry_of"));
  }
});

test("record: D1 creates no relation from this sitting, and has no orphans", { skip: skipRecord }, () => {
  const result = record();
  assert.deepEqual(result.relation_orphans, []);
  assert.deepEqual(
    result.relations,
    [],
    "replicate_of_pair is bound to variance design and the record types no other link; " +
      "typing one here would be D1 classifying what the record has not classified",
  );
});

test("record: the code's frozen vocabulary still agrees with the record's", { skip: skipRecord }, () => {
  const result = record();
  assert.deepEqual(result.vocabulary.diff.capture_status.missing_from_code, []);
  assert.deepEqual(result.vocabulary.diff.capture_status.absent_from_record, []);
  assert.deepEqual(result.vocabulary.diff.artifact_status.missing_from_code, []);
  assert.deepEqual(result.vocabulary.diff.artifact_status.absent_from_record, []);
  assert.ok(result.vocabulary.amendments.length > 0, "the record carries at least one amendment");
});

test("record: every observation row carries an instrument version", { skip: skipRecord }, () => {
  const result = record();
  assert.ok(result.observations.length > 0);
  for (const observation of result.observations) {
    assert.ok(observation.instrument_version, "an observation read under an unknown instrument is not admitted");
    assert.ok(["artifact", "capture"].includes(observation.instrument_version_source));
  }
});

test("record: every extracted list agrees with its own artifact's declared count", { skip: skipRecord }, () => {
  const result = record();
  assert.ok(result.observation_count_checks.length > 0);
  for (const check of result.observation_count_checks) {
    assert.equal(check.agrees, true, `${check.path} disagrees with the count its artifact declares`);
  }
});

test("record: bank regeneration from the registry reproduces the frozen hashes", { skip: skipRecord }, () => {
  const result = record();
  assert.ok(result.series.verification.length > 0);
  for (const entry of result.series.verification) {
    assert.deepEqual(entry.mismatches, []);
    assert.equal(entry.reproduced, true);
    assert.ok(entry.variants_checked > 0, "each series regenerates its authorized variant hashes too");
  }
});

test("record: research_status survives on every series and every capture", { skip: skipRecord }, () => {
  const result = record();
  for (const series of result.series.registered) {
    assert.ok(["STANDARD", "EXPLORATORY"].includes(series.research_status));
  }
  for (const entry of result.captures) {
    assert.ok(["STANDARD", "EXPLORATORY"].includes(entry.record.research_status));
  }
  assert.ok(
    result.series.registered.some((series) => series.research_status === "EXPLORATORY"),
    "the exploratory families are registered, and D1 stores them without gating them",
  );
});

test("record: series registration keeps schedule fields off the series", { skip: skipRecord }, () => {
  for (const series of record().series.registered) {
    assert.ok(isAbsent(series, "slot"), "a series outlives any wave's schedule");
    assert.ok(isAbsent(series, "capture_order"));
  }
  for (const entry of record().series.wave_schedule) {
    assert.ok(Object.hasOwn(entry, "slot"), "the schedule fields moved to the wave object");
  }
});

test("record: every acceptance criterion passes", { skip: skipRecord }, () => {
  const acceptance = evaluateAcceptance(record());
  const failed = acceptance.criteria.filter((entry) => !entry.passed).map((entry) => entry.criterion);
  assert.deepEqual(failed, []);
  assert.equal(acceptance.passed, true);
});

// ---------------------------------------------------------------------------
// The custody boundary of the test suite itself
// ---------------------------------------------------------------------------

test("no governed capture identifier appears anywhere in the tracked tree", () => {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: REPO_ROOT, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);

  const captureId = /W0-\d{2}-[A-Z]+-R\d/;
  const offenders = [];
  for (const path of tracked) {
    const full = join(REPO_ROOT, path);
    let stats;
    try {
      stats = statSync(full);
    } catch {
      continue;
    }
    if (!stats.isFile() || stats.size > 2_000_000) continue;
    let text;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (captureId.test(text)) offenders.push(path);
  }

  assert.deepEqual(
    offenders,
    [],
    "a governed capture identifier reached a tracked file. This repository is public " +
      "and the Wave 0 record is not; governed capture data must never become a public " +
      "Git artifact by way of the test suite or a comment explaining it.",
  );
});

test("the D1 import output directory is ignored, not tracked", () => {
  const ignore = readFileSync(join(REPO_ROOT, ".gitignore"), "utf8");
  assert.match(ignore, /^\.d1-import\/$/m, "the import report carries governed content verbatim");

  const tracked = execFileSync("git", ["ls-files", "-z", ".d1-import"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);
  assert.deepEqual(tracked, []);
});

test("the registry ships no fixture copied from the governed record", () => {
  const registryDir = join(REPO_ROOT, "registry");
  const nonModules = readdirSync(registryDir).filter((name) => !name.endsWith(".mjs"));
  assert.deepEqual(
    nonModules,
    [],
    "registry/ holds modules only. A stable fixture containing governed Wave 0 content " +
      "requires a custody and publication ruling before it exists.",
  );
});
