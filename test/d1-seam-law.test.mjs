// d1-seam-law.test.mjs — the machine check behind the D1/D2 seam law.
//
// THE RULE (IMBAS-2BD-SCOPE-MEMO section 2). D1 may create registry, capture,
// artifact, source-observation, lineage, amendment and typed-relation records.
// D1 may not compute or publish a comparison claim. D2 may consume D1's records
// and may not mutate them.
//
// WHY IT EXISTS. D1 establishes what exists and who owns it; D2 decides what may
// be inferred from it. The seam holds only while nothing in D1 can produce a
// finding, because a comparison computed during import would arrive already
// carrying an interpretation that no reviewer ever admitted, wearing the
// authority of the custody layer. Intention does not hold that line across
// future passes. This file does.
//
// FIVE ENFORCEMENT POINTS, INSPECTED STRUCTURALLY:
//
//   1. SURFACE CENSUS. D1's public exports must equal an approved list exactly.
//      Not a subset — equal. A new export fails until it is named here, which
//      forces the question "is this a custody operation?" to be answered in a
//      diff rather than assumed.
//
//   2. IMPORT-GRAPH CLOSURE. Every specifier a D1 module imports must resolve to
//      a node builtin or another D1 module. This is stronger than a denylist of
//      D2 module names: D2 does not exist yet, so a denylist would pass by
//      accident and keep passing after D2 lands.
//
//   3. CONTENT CONFINEMENT. The exports that legitimately take more than one
//      capture are fed synthetic captures carrying marker strings in their
//      answer and artifact fields. Their return values must contain the
//      capture_ids and none of the markers. This is the real question behind
//      "no operation takes two captures and returns a finding": whether content
//      from two captures can meet inside a D1 return value at all.
//
//   4. RELATION RETURN SCHEMA. A created relation's keys must equal the identity
//      and linkage allowlist, and createCaptureRelation must refuse a capture
//      record where a capture_id belongs — so a relation cannot be built by a
//      function that has read what it is linking.
//
//   5. MUTATION PROOF. The checks in 1 and 3 are functions, and this file runs
//      them against a synthetic namespace with a comparison-like export added.
//      A test that cannot fail proves nothing, so the failure is demonstrated
//      here rather than asserted to be possible.
//
// NOT A KEYWORD GREP. Nothing here scans prose for banned words. The census
// reads the export table, closure reads import specifiers, confinement reads
// return values, and the schema check reads emitted keys. A word ratchet could
// supplement this; it would not be the proof.
//
// WHAT EACH TEST CATCHES. Verified by mutation when this file was written —
// reapply any of these and the named test should go red:
//   · export a compareCaptures() from registry/index.mjs ....... surface census
//   · import a module outside registry/ into a D1 module ...... import closure
//   · the same, written as a bare side-effect import ............ scanner forms
//   · cohortByEffectiveCaptureStatus returns records not ids ..... confinement
//   · createCaptureRelation copies a field off a capture ....... relation schema
//   · createCaptureRelation accepts objects instead of ids ...... relation refusal
//
// The bare-import case is on that list because it got through the first version
// of this file: the scanner keyed on `from`, and `import "../reader-checks.js"`
// has no `from` to key on.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import * as d1 from "../registry/index.mjs";
import { RELATION_RECORD_KEYS, createCaptureRelation } from "../registry/relation-types.mjs";
import { cohortByEffectiveCaptureStatus } from "../registry/capture-record.mjs";
import { findOrphanRelations } from "../registry/relation-types.mjs";

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "registry");

// Every name D1 is permitted to expose. Each one creates, validates, or reads
// back a record. None of them compares two captures.
const APPROVED_EXPORTS = [
  "ARTIFACT_CLASS_TO_ROLE",
  "ARTIFACT_CUSTODY_STATES",
  "ARTIFACT_ROLES",
  "ARTIFACT_STATUS_FIELDS",
  "ARTIFACT_STATUS_FROZEN",
  "CAPTURE_CONDITION_FIELDS",
  "CAPTURE_IDENTITY_FIELDS",
  "CAPTURE_PROVENANCE_CLASSES",
  "CAPTURE_STATUS_FROZEN",
  "HASH_CONVENTION",
  "LINEAGE_FIELDS",
  "OBSERVATION_LIST_PATHS",
  "OBSERVATION_LIST_SOURCES",
  "PROTOCOL_CUSTODY_BASIS_KEYS",
  "READING_STATES",
  "RELATION_RECORD_KEYS",
  "RELATION_TYPES",
  "RESEARCH_STATUSES",
  "SERIES_FIELD_MAPPING",
  "SERIES_RECORD_KEYS",
  "WAVE_SCHEDULE_KEYS",
  "auditArtifactStatuses",
  "captureStatusVocabulary",
  "carryPresentFields",
  "checkDeclaredCounts",
  "classifyArtifactStatus",
  "cohortByEffectiveCaptureStatus",
  "createCaptureProvenance",
  "createCaptureRelation",
  "diffAgainstRecordVocabulary",
  "effectiveCaptureStatus",
  "evaluateAcceptance",
  "extractSourceObservations",
  "findOrphanRelations",
  "groupByProvenanceClass",
  "hasProtocolAuthority",
  "importCaptureRecord",
  "importWave0",
  "inventoryEnumerableLists",
  "isAbsent",
  "isPresentAndNull",
  "isValidArtifactStatus",
  "isValidCaptureStatus",
  "locateWave0Record",
  "presentKeys",
  "readCaptureAmendments",
  "readStatusAmendments",
  "regenerateBankHashes",
  "registerQuestionSeries",
  "requireProtocolAuthority",
  "seriesPresentKeys",
  "sha256Utf8",
  "verifyBankRegeneration",
  "waveScheduleFromBankEntry",
].sort();

// ---------------------------------------------------------------------------
// The checkers. Exported as functions so part 5 can run them against a
// namespace built to fail.
// ---------------------------------------------------------------------------

function auditSurfaceCensus(namespace, approved) {
  const actual = Object.keys(namespace).sort();
  const unapproved = actual.filter((name) => !approved.includes(name));
  const missing = approved.filter((name) => !actual.includes(name));
  return { passed: unapproved.length === 0 && missing.length === 0, unapproved, missing };
}

const MARKERS = Object.freeze({
  answer: "MARKER-ANSWER-TEXT-THAT-MUST-NOT-CROSS",
  artifact: "MARKER-ARTIFACT-BODY-THAT-MUST-NOT-CROSS",
  note: "MARKER-CONDITIONS-NOTE-THAT-MUST-NOT-CROSS",
});

function syntheticCapture(capture_id, capture_status, amendment) {
  return Object.freeze({
    capture_id,
    question_group_id: "QG-SYNTHETIC",
    research_status: "STANDARD",
    capture_status,
    answer_text: MARKERS.answer,
    artifact_statuses: Object.freeze({ answer_artifact_status: MARKERS.artifact }),
    conditions: Object.freeze({ notes: MARKERS.note }),
    amendments: Object.freeze(amendment ? [amendment] : []),
  });
}

function auditContentConfinement(returnValue, capture_ids) {
  const serialized = JSON.stringify(returnValue);
  const leaked = Object.entries(MARKERS)
    .filter(([, marker]) => serialized.includes(marker))
    .map(([field]) => field);
  const carried = capture_ids.filter((id) => serialized.includes(id));
  return { passed: leaked.length === 0, leaked, carried };
}

// ---------------------------------------------------------------------------
// 1. SURFACE CENSUS
// ---------------------------------------------------------------------------

test("seam law 1: D1's public surface equals the approved list exactly", () => {
  const audit = auditSurfaceCensus(d1, APPROVED_EXPORTS);
  assert.deepEqual(
    audit.unapproved,
    [],
    "registry/index.mjs exports a name that is not on the approved list. If it is a " +
      "custody operation, add it here in the same commit. If it compares two captures, " +
      "it belongs in D2.",
  );
  assert.deepEqual(audit.missing, [], "an approved export disappeared from registry/index.mjs");
});

test("seam law 1: every approved export is a record operation, not a computation over two", () => {
  // Each export takes one record, one collection to validate, or configuration.
  // None takes a pair of captures as its first two positional parameters.
  const pairLike = /^\s*\(\s*[A-Za-z_$][\w$]*\s*,\s*[A-Za-z_$][\w$]*\s*\)/;
  const offenders = [];
  for (const [name, value] of Object.entries(d1)) {
    if (typeof value !== "function") continue;
    const signature = value.toString().slice(0, 200);
    const params = signature.slice(signature.indexOf("("));
    if (!pairLike.test(params)) continue;
    // Two positional parameters is only a problem when both name captures.
    const [, first, second] = /\(\s*([A-Za-z_$][\w$]*)\s*,\s*([A-Za-z_$][\w$]*)\s*\)/.exec(params);
    const capturey = (token) => /capture|record|observation|artifact/i.test(token);
    const idish = (token) => /id|ids|keys|key/i.test(token);
    if (capturey(first) && capturey(second) && !idish(first) && !idish(second)) {
      offenders.push({ name, first, second });
    }
  }
  assert.deepEqual(
    offenders,
    [],
    "a D1 export takes two capture-shaped positional parameters. D1 links captures " +
      "by identifier so that an operation cannot read what it is linking.",
  );
});

// ---------------------------------------------------------------------------
// 2. IMPORT-GRAPH CLOSURE
// ---------------------------------------------------------------------------

// All three ways a module can name a dependency. A bare side-effect import
// carries no `from` clause, so a scanner keyed on `from` reads straight past it
// — and worse, a lazy match starting at that `import` can run on to the next
// statement's `from` and report the wrong specifier as if it were the only one.
// Bounding on the statement's semicolon is what stops that.
export function readImportSpecifiers(source) {
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g,
    /(?:^|\n)\s*import\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  const specifiers = new Set();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function auditImportClosure(modules) {
  const foreign = [];
  for (const { filename, source } of modules) {
    for (const specifier of readImportSpecifiers(source)) {
      const isBuiltin = specifier.startsWith("node:");
      const isSibling = specifier.startsWith("./") && !specifier.includes("..");
      if (!isBuiltin && !isSibling) foreign.push({ filename, specifier });
    }
  }
  return { passed: foreign.length === 0, foreign };
}

function registryModules() {
  return readdirSync(REGISTRY_DIR)
    .filter((name) => name.endsWith(".mjs"))
    .map((filename) => ({
      filename,
      source: readFileSync(join(REGISTRY_DIR, filename), "utf8"),
    }));
}

test("seam law 2: D1 modules import only node builtins and other D1 modules", () => {
  const audit = auditImportClosure(registryModules());
  assert.deepEqual(
    audit.foreign,
    [],
    "a D1 module imports outside registry/. D1 owns custody and depends on nothing " +
      "that could compute or publish a comparison; a D2 denylist would not catch this " +
      "because D2 does not exist yet.",
  );
});

test("seam law 2: the import scanner catches every form a dependency can take", () => {
  const specifiers = readImportSpecifiers(
    [
      'import "../reader-checks.js";',
      'import { a } from "./field-custody.mjs";',
      'import {\n  b,\n} from "node:crypto";',
      'export { c } from "./relation-types.mjs";',
      'const d = await import("../api/reader-result.js");',
    ].join("\n"),
  );
  assert.deepEqual(
    specifiers.sort(),
    [
      "../api/reader-result.js",
      "../reader-checks.js",
      "./field-custody.mjs",
      "./relation-types.mjs",
      "node:crypto",
    ],
    "a dependency form the scanner misses is a hole in the closure check",
  );
  assert.equal(
    auditImportClosure([{ filename: "synthetic.mjs", source: 'import "../reader-checks.js";' }])
      .passed,
    false,
    "closure must reject a bare side-effect import reaching outside registry/",
  );
});

// ---------------------------------------------------------------------------
// 3. CONTENT CONFINEMENT
// ---------------------------------------------------------------------------

test("seam law 3: cohorting many captures returns identifiers, never their content", () => {
  const captures = [
    syntheticCapture("SYN-A", "COMPLETE"),
    syntheticCapture("SYN-B", "PARTIAL_INTERFACE"),
    syntheticCapture("SYN-C", "COMPLETE", {
      key: "amendment_2026-08-02_synthetic",
      effective_from: "2026-08-02",
      body: { effective_for_comparison: "PARTIAL_INTERFACE" },
    }),
  ];
  const cohorts = cohortByEffectiveCaptureStatus(captures);
  const audit = auditContentConfinement(cohorts, ["SYN-A", "SYN-B", "SYN-C"]);

  assert.deepEqual(
    audit.leaked,
    [],
    "content from a capture crossed into a value derived from several captures",
  );
  assert.equal(audit.carried.length, 3, "the cohort should carry every capture_id it grouped");
  assert.deepEqual(Object.keys(cohorts).sort(), ["COMPLETE", "PARTIAL_INTERFACE"]);
  assert.deepEqual(cohorts.PARTIAL_INTERFACE, ["SYN-B", "SYN-C"]);
});

test("seam law 3: orphan detection over many relations returns identifiers only", () => {
  const relations = [
    createCaptureRelation({
      relation_type: "SAME_QUESTION_ACROSS_PROVIDERS",
      from_capture_id: "SYN-A",
      to_capture_id: "SYN-MISSING",
      question_group_id: "QG-SYNTHETIC",
      research_status: "STANDARD",
    }),
  ];
  const orphans = findOrphanRelations(relations, ["SYN-A"]);
  const audit = auditContentConfinement(orphans, ["SYN-A", "SYN-MISSING"]);
  assert.deepEqual(audit.leaked, []);
  assert.deepEqual(orphans, [
    {
      relation_id: "SAME_QUESTION_ACROSS_PROVIDERS:SYN-A->SYN-MISSING",
      missing_capture_ids: ["SYN-MISSING"],
    },
  ]);
});

// ---------------------------------------------------------------------------
// 4. RELATION RETURN SCHEMA
// ---------------------------------------------------------------------------

test("seam law 4: a created relation carries identity and linkage and nothing else", () => {
  const relation = createCaptureRelation({
    relation_type: "SAME_QUESTION_ACROSS_TIME",
    from_capture_id: "SYN-A",
    to_capture_id: "SYN-B",
    question_group_id: "QG-SYNTHETIC",
    research_status: "EXPLORATORY",
    basis_ref: "FR-SYNTHETIC",
  });
  assert.deepEqual(
    Object.keys(relation).sort(),
    [...RELATION_RECORD_KEYS].sort(),
    "a relation gained a key outside the identity and linkage allowlist",
  );
  assert.equal(relation.research_status, "EXPLORATORY", "research_status travels with a relation");
  assert.ok(Object.isFrozen(relation), "a relation is frozen; D2 consumes D1 records, never mutates them");
});

test("seam law 4: relation creation refuses a capture record where a capture_id belongs", () => {
  const asRecord = () =>
    createCaptureRelation({
      relation_type: "REPLICATE",
      from_capture_id: syntheticCapture("SYN-A", "COMPLETE"),
      to_capture_id: syntheticCapture("SYN-B", "COMPLETE"),
      question_group_id: "QG-SYNTHETIC",
      research_status: "STANDARD",
    });
  assert.throws(asRecord, TypeError, "creating a relation must not be able to read its members");
});

test("seam law 4: the relation enum is closed", () => {
  assert.throws(
    () =>
      createCaptureRelation({
        relation_type: "MATERIAL_DRIFT",
        from_capture_id: "SYN-A",
        to_capture_id: "SYN-B",
        question_group_id: "QG-SYNTHETIC",
        research_status: "STANDARD",
      }),
    RangeError,
    "a relation type outside the closed enum must be refused at D1",
  );
});

// ---------------------------------------------------------------------------
// 5. MUTATION PROOF
// ---------------------------------------------------------------------------

test("seam law 5: a comparison-like export fails the surface census", () => {
  const withComparison = {
    ...d1,
    compareCaptures: (a, b) => ({ differs: a !== b }),
  };
  const audit = auditSurfaceCensus(withComparison, APPROVED_EXPORTS);
  assert.equal(audit.passed, false, "the census must reject an export it has not approved");
  assert.deepEqual(audit.unapproved, ["compareCaptures"]);
});

test("seam law 5: a return value carrying capture content fails content confinement", () => {
  const leaky = {
    COMPLETE: [
      { capture_id: "SYN-A", answer_text: MARKERS.answer },
      { capture_id: "SYN-C", answer_text: MARKERS.answer },
    ],
  };
  const audit = auditContentConfinement(leaky, ["SYN-A", "SYN-C"]);
  assert.equal(audit.passed, false, "confinement must reject content crossing the boundary");
  assert.deepEqual(audit.leaked, ["answer"]);
});
