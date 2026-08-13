// The shared presentation model, and the two properties it exists to hold.
//
// PROPERTY ONE — both record types satisfy one shape. That is the discharge condition
// RENDER_BLOCKERS named, and it is checked here by projecting the real rotation and
// asserting every record carries exactly the declared keys. A record type that could
// only be seated by adding a field would fail here rather than at the render.
//
// PROPERTY TWO — the projection authors nothing. Every value on a record traces to a
// record that already exists: the registry entry, the packet, or the per-case copy. The
// barred discharge was to type a category and a term list onto the flagship until the
// picker accepted it, and a projection cannot do that — so the tests below take each
// field back to its source and fail if one appeared from nowhere.
//
// The measured records are also pinned to the exact strings they rendered before the
// projection existed. That is what makes this a seam and not a redesign: 005 and 021
// come out the other side byte-identical, and the board frames that photograph them are
// unchanged for a reason a reader can check.
//
// Run: node --test test/reader-guided-record.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  EXAMPLES,
  FINDING_CLASS,
  renderableExamples,
  resolvePlacement,
} from "../product-example-registry.js";
import { PUBLIC_EXAMPLE } from "../reader-public-example.js";
import {
  GUIDED_RECORD_KIND,
  GUIDED_RECORD_KEYS,
  GUIDED_RECORD_FIELDS,
  MEASURED_DATE_LABEL,
  PUBLIC_EXAMPLE_DATE_LABEL,
  PUBLIC_EXAMPLE_RECORD_LABEL,
  buildGuidedRotation,
  isMeasuredCaseExample,
  measuredCaseIds,
  measuredCaseRecord,
  publicExampleRecord,
} from "../reader-guided-record.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const SRC = readFileSync(fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)), "utf8");

// The consumer's own per-case copy lives in workbench-app.jsx, which Node cannot import,
// and it stays there: EXEMPT_CASE_CONTENT records GUIDED_CASE_COPY as case-owned content
// in that file, and the registry ratchet fails if the symbol moves out from under that
// record. So the table is lifted out of the shipped source rather than duplicated here —
// a copy typed into this file would pass while the shipped one drifted.
function guidedCaseCopy() {
  const from = SRC.indexOf("const GUIDED_CASE_COPY = {");
  const to = SRC.indexOf("const CURATED = buildGuidedRotation(");
  assert.ok(from >= 0 && to > from, "could not lift GUIDED_CASE_COPY out of workbench-app.jsx");
  const body = SRC.slice(from, to) + "\nreturn GUIDED_CASE_COPY;";
  return new Function(body)();
}

const CASE_COPY = guidedCaseCopy();
const ROTATION_IDS = renderableExamples("readerGuided");
const ROTATION = buildGuidedRotation({ ids: ROTATION_IDS, caseCopy: CASE_COPY });
const byId = (id) => ROTATION.find((r) => r.id === id);

test("the rotation is the placement, and the flagship leads it", () => {
  assert.deepEqual(ROTATION_IDS, resolvePlacement("readerGuided").exampleIds);
  assert.deepEqual(ROTATION.map((r) => r.id), ["montana-employment", "005", "021"]);
  assert.deepEqual(
    ROTATION.map((r) => r.kind),
    [
      GUIDED_RECORD_KIND.PUBLIC_EXAMPLE,
      GUIDED_RECORD_KIND.MEASURED_CASE,
      GUIDED_RECORD_KIND.MEASURED_CASE,
    ],
  );
});

test("both record types carry exactly the declared field set", () => {
  // The shape is the discharge condition. A record with an extra key is a consumer
  // reading something the other kind cannot supply; a record with a missing key is the
  // same failure seen from the other side.
  assert.equal(new Set(GUIDED_RECORD_KEYS).size, GUIDED_RECORD_KEYS.length, "a key is declared twice");
  for (const record of ROTATION) {
    assert.deepEqual(
      Object.keys(record).slice().sort(),
      GUIDED_RECORD_KEYS.slice().sort(),
      `${record.id} does not carry the declared field set`,
    );
    assert.ok(Object.isFrozen(record), `${record.id} is mutable`);
  }
});

test("every record supplies a real value for identity and for the question", () => {
  for (const record of ROTATION) {
    for (const field of [...GUIDED_RECORD_FIELDS.IDENTITY, "openPrompt"]) {
      const value = record[field];
      if (field === "ready" || field === "kind") continue;
      assert.equal(typeof value, "string", `${record.id}.${field} is not a string`);
      assert.ok(value.length > 0, `${record.id}.${field} is empty`);
    }
    assert.equal(record.ready, true, `${record.id} is not ready`);
  }
});

test("a measured case projects the exact strings it rendered before the projection", () => {
  // The seam changed which code composes these; it did not change one byte of what 005
  // and 021 print. Each expected value is composed here from the same two sources the
  // retired helpers read, so this fails on a drift rather than restating the answer.
  for (const id of ["005", "021"]) {
    const copy = CASE_COPY[id];
    const record = byId(id);
    assert.equal(record.cardLabel, `CASE ${id}`);
    assert.equal(record.metaLabel, `CASE ${id} · ${copy.category.toUpperCase()}`);
    assert.equal(record.cardTitle, copy.cardShort || copy.title);
    assert.equal(record.title, copy.title);
    assert.equal(record.recordName, EXAMPLES[id].shortLabel);
    assert.equal(record.dateLabel, MEASURED_DATE_LABEL);
    assert.equal(record.dateValue, copy.observedDate);
    assert.equal(record.openPrompt, copy.openPrompt);
    assert.equal(record.reveal, copy.reveal);
    // The request fields, with the fallbacks the request builder used to apply inline.
    assert.equal(record.topic, copy.topic || copy.title);
    assert.equal(record.anchor, copy.mechanism);
    assert.equal(record.whyItMatters, copy.whyItMatters);
    assert.deepEqual(record.detect.slice(), copy.detect);
    assert.deepEqual(record.keyDetect.slice(), copy.keyDetect);
    // Measurement output, carried through unchanged for the measured-case consumer.
    assert.equal(record.category, copy.category);
    assert.equal(record.observedDate, copy.observedDate);
    assert.equal(record.short, copy.short);
    assert.equal(record.observed, copy.observed);
    assert.equal(record.gap, copy.gap);
  }
  // The exact rendered strings, spelled out once, because "composed from the source"
  // would also be true of a wrong composition.
  assert.equal(byId("005").metaLabel, "CASE 005 · OMISSION");
  assert.equal(byId("005").cardLabel, "CASE 005");
  assert.equal(byId("005").recordName, "Case 005");
  assert.equal(byId("021").metaLabel, "CASE 021 · OMISSION");
});

test("the public example takes every value from a record that already exists", () => {
  // This is property two, stated field by field. Nothing below is a literal string
  // authored in the projection: each assertion names the record the value came out of.
  const record = byId("montana-employment");
  const example = EXAMPLES["montana-employment"];
  assert.equal(example.findingClass, FINDING_CLASS.READER_RUN);
  assert.equal(record.title, example.title);
  assert.equal(record.cardTitle, example.title);
  assert.equal(record.recordName, example.shortLabel);
  assert.equal(record.topic, example.title);
  assert.equal(record.dateValue, example.verificationDate);
  assert.equal(record.reveal, example.tenSecondCopy);
  assert.equal(record.reveal, PUBLIC_EXAMPLE.left_out, "the ten-second copy is the packet's own");
  assert.equal(record.openPrompt, PUBLIC_EXAMPLE.question);
  assert.equal(record.whyItMatters, PUBLIC_EXAMPLE.why_it_mattered);
});

test("the public example states no measurement, and names the date for what it is", () => {
  const record = byId("montana-employment");
  // Nobody measured this run, so every measurement field is null rather than a plausible
  // default. A zero, an empty string or an invented category would each read as a result.
  for (const field of GUIDED_RECORD_FIELDS.MEASURED) {
    assert.equal(record[field], null, `montana-employment carries a measured ${field}`);
  }
  assert.deepEqual(record.detect.slice(), []);
  assert.deepEqual(record.keyDetect.slice(), []);
  assert.equal(record.anchor, "", "the packet names no single anchor term");
  // The two dates are different facts and carry different labels. A measured case's is
  // the month four models were observed; this one's is the day a statute was read off
  // its primary source. One word over both would merge them.
  assert.equal(record.dateLabel, PUBLIC_EXAMPLE_DATE_LABEL);
  assert.notEqual(PUBLIC_EXAMPLE_DATE_LABEL, MEASURED_DATE_LABEL);
  assert.equal(record.cardLabel, PUBLIC_EXAMPLE_RECORD_LABEL);
  assert.equal(record.metaLabel, PUBLIC_EXAMPLE_RECORD_LABEL);
  // The label is the registry's own word for what this example is, not a coinage.
  assert.equal(PUBLIC_EXAMPLE_RECORD_LABEL, FINDING_CLASS.READER_RUN.replace("-", " ").toUpperCase());
});

test("no projected string reaches a reader carrying a verdict", () => {
  for (const record of ROTATION) {
    for (const field of ["cardLabel", "metaLabel", "cardTitle", "title", "dateLabel", "reveal"]) {
      const value = record[field];
      if (!value) continue;
      assert.deepEqual(lintUserFacingStrings(value), [], `${record.id}.${field}: AT-5`);
    }
  }
});

test("a public example cannot be projected as a measured case, or the reverse", () => {
  // The two projections are not interchangeable, and the failure has to be loud. A
  // measured projection over an example with no copy is the crash that used to protect
  // the picker; it still does, and it still names the placement that caused it.
  assert.throws(
    () => measuredCaseRecord({ id: "montana-employment", example: EXAMPLES["montana-employment"], copy: undefined }),
    /readerGuided names "montana-employment", which has no guided-case copy/,
  );
  // And a public-example projection over a scored case refuses rather than printing
  // "READER RUN" over an archive record.
  assert.throws(
    () => publicExampleRecord({ id: "005", example: EXAMPLES["005"], packet: PUBLIC_EXAMPLE }),
    /"005" is not a Reader run/,
  );
  assert.throws(
    () => buildGuidedRotation({ ids: ["no-such-example"], caseCopy: CASE_COPY }),
    /which is not a registered example/,
  );
});

test("the measured filter reads the registry, and agrees with the projected kind", () => {
  // Two consumers ask the same question two ways — the curated console filters projected
  // records by kind, the board scenario filters ids by registry entry — so the two
  // answers have to be the same list. They came apart once, which is how the board
  // asserted a case id against a screen showing a different one.
  assert.deepEqual(measuredCaseIds(ROTATION_IDS), ["005", "021"]);
  assert.deepEqual(
    ROTATION.filter((r) => r.kind === GUIDED_RECORD_KIND.MEASURED_CASE).map((r) => r.id),
    measuredCaseIds(ROTATION_IDS),
  );
  assert.equal(isMeasuredCaseExample(EXAMPLES["montana-employment"]), false);
  assert.equal(isMeasuredCaseExample(EXAMPLES["005"]), true);
  assert.equal(isMeasuredCaseExample(undefined), false);
});

// ── The consumers, read out of the shipped component ─────────────────────────

test("no consumer composes a label out of a case id or a category", () => {
  // The three helpers that did are gone, and the compositions they held must not come
  // back inline. Comment lines are skipped so the record above can quote what it retired.
  const retired = [
    "function caseCardLabel",
    "function readerCaseMeta",
    "function readerCaseCardLabel",
    "`CASE ${c.id}",
    "`CASE ${sel.id}",
    "`Reader agent · Case ${sel.id}`",
    "c.category.toUpperCase()",
    "sel.observedDate ? ` · Verified",
  ];
  for (const line of SRC.split("\n")) {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
    for (const dead of retired) {
      assert.ok(!line.includes(dead), `a retired label composition is back in workbench-app.jsx: ${dead}`);
    }
  }
});

test("the provenance line keeps the text node boundaries the committed frame was drawn with", () => {
  // Making the label a datum is what lets a public example name its own date, and it is
  // also how this line acquired two extra text nodes. `{caseLine} · {label} {value}` is
  // five children where the frame was photographed with three, so the label opens its
  // own inline box and its first glyph takes a different sub-pixel phase. The board
  // caught it: 96 pixels, the V of VERIFIED, every letter after it identical. Same
  // string, different frame. The separator, the label and its trailing space therefore
  // travel as ONE expression, which restores the three children the baseline holds.
  //
  // Byte proof, not argument: with the natural form the desktop frame came back
  // 88513ba2…, against a baseline of 1839d7a2…; with the form pinned below it came back
  // 1839d7a2…, equal to the committed bytes. No baseline was written for either.
  assert.ok(
    SRC.includes(
      '<p className="wb-flow-case-prov__case">{prov.caseLine}{` · ${prov.verifiedLabel.toUpperCase()} `}{prov.verified.toUpperCase()}</p>',
    ),
    "the provenance line's children changed shape — re-diff curated-readout before assuming the frame survived",
  );
  // The split form, named exactly, because it is the one a later edit reaches for.
  assert.ok(
    !SRC.includes("{prov.caseLine} · {prov.verifiedLabel.toUpperCase()} {prov.verified.toUpperCase()}"),
    "the provenance line is back to five text nodes, which moves the committed frame",
  );
});

test("the curated console seats measured cases only, and says which", () => {
  // The console prints a category, a term list and an observation date. It reads the
  // filtered list in both places it reads a rotation at all — the seeded selection and
  // the picker — because seating a public example there would mean writing all three.
  assert.ok(
    SRC.includes("const MEASURED_CURATED = CURATED.filter((c) => c.kind === GUIDED_RECORD_KIND.MEASURED_CASE);"),
    "the curated console's filter is not the projected kind",
  );
  assert.ok(SRC.includes("useState(MEASURED_CURATED[0])"), "the console seeds from the whole rotation");
  assert.ok(SRC.includes("{MEASURED_CURATED.map((c) => {"), "the console's picker reads the whole rotation");
  // And the Reader's own picker reads the whole rotation, which is the point of the
  // seam: the flagship is seated, not held out somewhere else.
  assert.ok(SRC.includes("{CURATED.map((c) => ("), "the Reader's picker no longer reads the rotation");
});
