// d1-capture-provenance.test.mjs — the ontology boundary above D1.
//
// THE TWO RULES, from the D1 ontology note.
//
//   1. A CAPTURE must not be precluded from having a parent INSPECTION. Capture
//      identity has to be referenceable by a higher-level object without a
//      schema change later, and no wave, slot or series may be assumed to be a
//      capture's only parent.
//
//   2. A capture's provenance class — PROTOCOL_CAPTURE against USER_SUPPLIED —
//      must have a canonical location, and it must be impossible for a
//      higher-level Inspection to render the two with equivalent evidentiary
//      authority.
//
// WHY THE ENVELOPE AND NOT THE ROW. The reasoning is in the header of
// registry/capture-provenance.mjs. What this file holds is the consequence: the
// capture record stays protocol-only and gains no provenance field, so the
// import contract's no-invented-key rule keeps holding, and the provenance
// envelope is a separate object bound to capture_id.
//
// WHY THESE TESTS ARE ENTIRELY SYNTHETIC. Nothing here needs the governed
// record. Provenance is a rule about what a capture must be able to show, and a
// rule is better tested against constructed cases — including the ones the
// governed record cannot produce, like a forged protocol claim — than against
// eighteen rows that all pass. The record-backed proof that the real import
// mints only PROTOCOL_CAPTURE lives in the acceptance criteria.
//
// WHAT EACH TEST CATCHES. Verified by mutation when this file was written —
// reapply any of these and the named tests should go red:
//   · createCaptureProvenance mints PROTOCOL_CAPTURE without custody ... forgery
//   · hasProtocolAuthority defaults to true on a missing envelope ..... default
//   · a USER_SUPPLIED envelope reports protocol authority ............. laundering
//   · capture-record.mjs grows a provenance field ..................... ownership
//   · a capture record requires a wave or slot to be constructed ...... parentage

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  ARTIFACT_CUSTODY_STATES,
  CAPTURE_PROVENANCE_CLASSES,
  PROTOCOL_CUSTODY_BASIS_KEYS,
  createCaptureProvenance,
  groupByProvenanceClass,
  hasProtocolAuthority,
  requireProtocolAuthority,
} from "../registry/capture-provenance.mjs";
import {
  CAPTURE_IDENTITY_FIELDS,
  ARTIFACT_STATUS_FIELDS,
  CAPTURE_CONDITION_FIELDS,
  LINEAGE_FIELDS,
  importCaptureRecord,
} from "../registry/capture-record.mjs";
import { createCaptureRelation } from "../registry/relation-types.mjs";
import { isAbsent } from "../registry/field-custody.mjs";

const REGISTRY_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "registry");

const GOVERNED_BASIS = Object.freeze({
  protocol_version: "synthetic/v1.0",
  record_status: "APPROVED",
  ledger_sha256: "0".repeat(64),
  instrument_version: "SYN-INSTRUMENT-1",
});

function protocolEnvelope(capture_id = "SYN-1", overrides = {}) {
  return createCaptureProvenance({
    capture_id,
    provenance_class: "PROTOCOL_CAPTURE",
    custody_basis: GOVERNED_BASIS,
    artifact_custody: "VERIFIED",
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Rule 1 — a capture may have a parent Inspection
// ---------------------------------------------------------------------------

test("rule 1: a capture record needs no wave, slot or series to exist", () => {
  const record = importCaptureRecord({ capture_id: "SYN-1", capture_status: "COMPLETE" });

  assert.equal(record.capture_id, "SYN-1");
  assert.ok(isAbsent(record.lineage, "slot"), "slot is carried only when the row carries it");
  assert.ok(
    isAbsent(record, "question_group_id"),
    "a capture that belongs to no series still imports; series membership is not identity",
  );
});

test("rule 1: no capture field names a single owning container", () => {
  const containerish = [
    ...CAPTURE_IDENTITY_FIELDS,
    ...ARTIFACT_STATUS_FIELDS,
    ...CAPTURE_CONDITION_FIELDS,
    ...LINEAGE_FIELDS,
  ].filter((field) => /^(wave|inspection|parent|belongs_to|container)/.test(field));

  assert.deepEqual(
    containerish,
    [],
    "a field asserting one owning container would have to be widened before an " +
      "Inspection could be a capture's parent, which is the schema change rule 1 forbids",
  );
});

test("rule 1: capture identity is referenceable by higher-level objects with no schema change", () => {
  const record = importCaptureRecord({ capture_id: "SYN-1", capture_status: "COMPLETE" });

  // Three independent object types already reference a capture by identifier
  // alone. A fourth — an Inspection — needs nothing this schema does not give.
  const provenance = protocolEnvelope(record.capture_id);
  const relation = createCaptureRelation({
    relation_type: "SAME_QUESTION_ACROSS_PROVIDERS",
    from_capture_id: record.capture_id,
    to_capture_id: "SYN-2",
    question_group_id: "QG-SYNTHETIC",
    research_status: "STANDARD",
  });

  assert.equal(provenance.capture_id, record.capture_id);
  assert.equal(relation.from_capture_id, record.capture_id);

  // The shape an Inspection would use: a bare reference by id, resolved without
  // consulting a wave, a slot or a series.
  const inspectionRef = { inspection_id: "INS-1", capture_ids: [record.capture_id] };
  const resolved = [record].filter((entry) => inspectionRef.capture_ids.includes(entry.capture_id));
  assert.equal(resolved.length, 1);
});

// ---------------------------------------------------------------------------
// Rule 2 — provenance class, and the authority that follows from it
// ---------------------------------------------------------------------------

test("rule 2: the provenance class is a closed set naming both classes", () => {
  assert.deepEqual([...CAPTURE_PROVENANCE_CLASSES], ["PROTOCOL_CAPTURE", "USER_SUPPLIED"]);
});

test("rule 2: the class lives on the envelope, never on the protocol capture schema", () => {
  const schemaFields = [
    ...CAPTURE_IDENTITY_FIELDS,
    ...ARTIFACT_STATUS_FIELDS,
    ...CAPTURE_CONDITION_FIELDS,
    ...LINEAGE_FIELDS,
  ];
  for (const field of schemaFields) {
    assert.ok(
      !/provenance|user_supplied|protocol_capture/i.test(field),
      `${field}: putting the class on the capture schema would make every ` +
        "protocol-required field optional, because a pasted answer carries none of them",
    );
  }

  // And the imported record gains no such key either.
  const record = importCaptureRecord({ capture_id: "SYN-1", capture_status: "COMPLETE" });
  for (const key of Object.keys(record)) {
    assert.ok(!/provenance/i.test(key), "the capture record carries no provenance field");
  }
});

test("rule 2: a protocol capture is minted against its custody, not its label", () => {
  for (const key of PROTOCOL_CUSTODY_BASIS_KEYS) {
    const incomplete = { ...GOVERNED_BASIS };
    delete incomplete[key];
    assert.throws(
      () =>
        createCaptureProvenance({
          capture_id: "SYN-1",
          provenance_class: "PROTOCOL_CAPTURE",
          custody_basis: incomplete,
        }),
      RangeError,
      `a PROTOCOL_CAPTURE missing ${key} must be refused, or the label is the only guard`,
    );
  }
});

test("rule 2: a user-supplied capture can never report protocol authority", () => {
  const pasted = createCaptureProvenance({
    capture_id: "SYN-PASTED",
    provenance_class: "USER_SUPPLIED",
  });

  assert.equal(pasted.protocol_authority, false);
  assert.equal(hasProtocolAuthority(pasted), false);
  assert.match(pasted.authority_denied_reason, /USER_SUPPLIED/);
});

test("rule 2: authority does not follow from presenting the governed custody of another capture", () => {
  // The laundering case: a pasted answer handed the marks of a governed record.
  // The class is what it is; the custody keys do not convert it.
  const dressed = createCaptureProvenance({
    capture_id: "SYN-PASTED",
    provenance_class: "USER_SUPPLIED",
    custody_basis: GOVERNED_BASIS,
    artifact_custody: "VERIFIED",
  });

  assert.equal(hasProtocolAuthority(dressed), false);
  assert.throws(() => requireProtocolAuthority(dressed), RangeError);
});

test("rule 2: a missing envelope is absence of authority, not permission", () => {
  assert.equal(hasProtocolAuthority(null), false);
  assert.equal(hasProtocolAuthority(undefined), false);
  assert.equal(hasProtocolAuthority({}), false);

  assert.throws(
    () => requireProtocolAuthority(null, "SYN-1"),
    /no provenance envelope/,
    "a caller that forgets to build an envelope must fail closed",
  );
});

test("rule 2: failed artifact custody withdraws protocol authority", () => {
  const failed = protocolEnvelope("SYN-1", { artifact_custody: "FAILED" });
  assert.equal(failed.provenance_class, "PROTOCOL_CAPTURE");
  assert.equal(hasProtocolAuthority(failed), false);
  assert.match(failed.authority_denied_reason, /re-hash/);
});

test("rule 2: declaring no artifact is not the same as failing to verify one", () => {
  // A refusal has nothing to hash. Denying it authority for that would punish a
  // governed row for a property of its outcome.
  const none = protocolEnvelope("SYN-1", { artifact_custody: "NONE_DECLARED" });
  assert.equal(hasProtocolAuthority(none), true);
  assert.deepEqual([...ARTIFACT_CUSTODY_STATES], ["VERIFIED", "NONE_DECLARED", "FAILED"]);
});

test("rule 2: a class outside the closed set is refused", () => {
  assert.throws(
    () => createCaptureProvenance({ capture_id: "SYN-1", provenance_class: "TRUSTED" }),
    RangeError,
  );
  assert.throws(
    () =>
      createCaptureProvenance({
        capture_id: "SYN-1",
        provenance_class: "PROTOCOL_CAPTURE",
        custody_basis: GOVERNED_BASIS,
        artifact_custody: "PROBABLY_FINE",
      }),
    RangeError,
  );
});

test("rule 2: provenance binds to a capture_id and refuses a capture record", () => {
  const record = importCaptureRecord({ capture_id: "SYN-1", capture_status: "COMPLETE" });
  assert.throws(
    () =>
      createCaptureProvenance({
        capture_id: record,
        provenance_class: "PROTOCOL_CAPTURE",
        custody_basis: GOVERNED_BASIS,
      }),
    TypeError,
    "establishing where a capture came from must never require reading what it contains",
  );
});

test("rule 2: grouping by provenance class returns identifiers only", () => {
  const groups = groupByProvenanceClass([
    protocolEnvelope("SYN-1"),
    protocolEnvelope("SYN-2"),
    createCaptureProvenance({ capture_id: "SYN-PASTED", provenance_class: "USER_SUPPLIED" }),
  ]);

  assert.deepEqual(groups.PROTOCOL_CAPTURE, ["SYN-1", "SYN-2"]);
  assert.deepEqual(groups.USER_SUPPLIED, ["SYN-PASTED"]);
  for (const ids of Object.values(groups)) {
    for (const id of ids) assert.equal(typeof id, "string");
  }
});

// ---------------------------------------------------------------------------
// Ownership boundary, read off the modules themselves
// ---------------------------------------------------------------------------

// Reads import specifiers rather than scanning the text. capture-record.mjs
// names capture-provenance.mjs in a comment on purpose — a reader arriving at
// the protocol schema should be told where the class went — and a prose grep
// would fail on that sentence while missing a real import written as a bare
// side-effect statement.
function importSpecifiers(source) {
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

test("the protocol capture schema does not import the provenance module", () => {
  const source = readFileSync(join(REGISTRY_DIR, "capture-record.mjs"), "utf8");
  const specifiers = importSpecifiers(source);

  assert.ok(specifiers.length > 0, "the specifier reader found nothing, so it proves nothing");
  assert.ok(
    !specifiers.some((specifier) => specifier.includes("capture-provenance")),
    "capture-record.mjs is protocol-only; the importer composes the two, which is " +
      "what keeps USER_SUPPLIED out of a schema that cannot represent it",
  );
});

test("USER_SUPPLIED is reserved, and no D1 module mints one", () => {
  const source = readFileSync(join(REGISTRY_DIR, "wave0-import.mjs"), "utf8");
  assert.ok(
    source.includes('provenance_class: "PROTOCOL_CAPTURE"'),
    "the governed import mints protocol captures",
  );
  assert.ok(
    !source.includes('provenance_class: "USER_SUPPLIED"'),
    "D1 reserves the class for the Reader and mints none itself",
  );
});
