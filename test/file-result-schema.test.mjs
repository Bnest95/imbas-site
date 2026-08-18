// file-result-schema — file-result.v1 construction law (Input Integrity, Lane 1).
//
// Four jobs:
//   1. Every one of the eleven v1 phenomenon classes has a valid construction.
//   2. An absence-shaped field cannot enter the schema, by key or by value.
//   3. checks_run and thresholds_applied are mandatory on every finding, and the
//      mandate is the CLASS's declared set rather than a presence test.
//   4. reader-result.v1 is untouched. file-result.v1 is a sibling, and a sibling
//      that quietly edited FINDING_CLASSES would not be one.
//
// Run: node --test test/file-result-schema.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FILE_RESULT_SCHEMA_VERSION,
  FILE_CANON_ERROR_PREFIX,
  PHENOMENON_CLASSES,
  PHENOMENON_CLASS_IDS,
  assertNoAbsenceShapes,
  makeFileIdentity,
  makePage,
  makeFinding,
  makeFileResult,
} from "../file-result.js";
import { TEMPLATE_LINT_FIXTURES } from "../file-templates.js";
import { FINDING_CLASSES, RESULT_SCHEMA_VERSION } from "../reader-result.js";

const cp = (t) => [...t].map((c) => c.codePointAt(0));

const IDENTITY = {
  sha256: "c974a827468a5a8dccf8e18255ed2d6d0641d2f086241e2b0e81bd99daa8dd96",
  byte_size: 685,
  parser_name: "imbas-file-intake",
  parser_version: "0.1.0",
  predicate_versions: { text_render_mode: "1", codepoint_scan: "1" },
};

const PAGE = { index: 0, media_box: [0, 0, 612, 792], crop_box: [0, 0, 612, 792], rotation: 0 };

function validFinding() {
  return {
    class_label: "invisible_render_mode",
    extraction: {
      text: "hello",
      codepoints: cp("hello"),
      page_index: 0,
      position: { x: 72, y: 700 },
      effective_size_pt: 12,
    },
    graphics_state: { render_mode: 3 },
    checks_run: ["text_render_mode"],
    thresholds_applied: {},
  };
}

function rejects(fn, fragment) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof RangeError, `expected RangeError, got ${err && err.constructor && err.constructor.name}`);
    assert.ok(
      err.message.startsWith(FILE_CANON_ERROR_PREFIX),
      `expected the canon error prefix, got: ${err.message}`,
    );
    assert.ok(err.message.includes(fragment), `expected message to mention "${fragment}", got: ${err.message}`);
    return true;
  });
}

// ── The schema is versioned, and it is a sibling ────────────────────────────────

test("file-result.v1 is versioned and distinct from reader-result.v1", () => {
  assert.equal(FILE_RESULT_SCHEMA_VERSION, "file-result.v1");
  assert.equal(RESULT_SCHEMA_VERSION, "reader-result.v1");
  assert.notEqual(FILE_RESULT_SCHEMA_VERSION, RESULT_SCHEMA_VERSION);
});

test("reader-result's FINDING_CLASSES is untouched by this lane", () => {
  // Lane 1 adds a file vocabulary. It does not extend the answer vocabulary, and a
  // phenomenon class appearing here would mean the two instruments had been merged.
  assert.deepEqual(Object.keys(FINDING_CLASSES), ["omission", "framing_drift", "deflection"]);
  for (const id of PHENOMENON_CLASS_IDS) {
    assert.ok(!Object.prototype.hasOwnProperty.call(FINDING_CLASSES, id), `${id} leaked into FINDING_CLASSES`);
  }
});

test("the v1 class set is the eleven structural classes, and it is closed", () => {
  assert.deepEqual(PHENOMENON_CLASS_IDS, [
    "invisible_render_mode",
    "zero_alpha",
    "near_zero_alpha",
    "offpage_text",
    "tiny_text",
    "white_fill_unbacked",
    "covered_text",
    "annotation_text",
    "metadata_text",
    "hidden_ocg_text",
    "encoding_control_structures",
  ]);
  rejects(() => makeFinding({ ...validFinding(), class_label: "instruction_text" }), "class set is closed");
  rejects(() => makeFinding({ ...validFinding(), class_label: "prompt_injection" }), "class set is closed");
});

// ── (a) valid construction per class ────────────────────────────────────────────

test("every phenomenon class has a valid construction", () => {
  // The registry's own lint fixtures are constructed through makeFinding at module
  // load, so importing them IS the construction receipt. Asserting coverage here
  // means a new class without a constructible example fails this test rather than
  // shipping as an unreachable branch.
  const built = new Set(TEMPLATE_LINT_FIXTURES.map((f) => f.finding.class_label));
  assert.deepEqual([...built].sort(), [...PHENOMENON_CLASS_IDS].sort());
});

test("a whole file result constructs, and comes back deep-frozen", () => {
  const result = makeFileResult({ file: IDENTITY, pages: [PAGE], findings: [validFinding()] });
  assert.equal(result.result_schema_version, "file-result.v1");
  assert.equal(result.file.sha256, IDENTITY.sha256);
  assert.equal(result.pages.length, 1);
  assert.equal(result.findings.length, 1);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.findings[0].graphics_state));
  assert.ok(Object.isFrozen(result.file.predicate_versions));
  assert.throws(() => {
    "use strict";
    result.findings[0].graphics_state.render_mode = 0;
  }, TypeError);
});

test("an empty findings array is a count, not an absence", () => {
  const result = makeFileResult({ file: IDENTITY, pages: [PAGE], findings: [] });
  assert.deepEqual(result.findings, []);
});

test("file identity names the parser and its predicates", () => {
  rejects(() => makeFileIdentity({ ...IDENTITY, sha256: "abc" }), "64 lowercase hex");
  rejects(() => makeFileIdentity({ ...IDENTITY, byte_size: 0 }), "positive integer");
  rejects(() => makeFileIdentity({ ...IDENTITY, parser_name: "" }), "parser_name is required");
  rejects(() => makeFileIdentity({ ...IDENTITY, parser_version: "" }), "parser_version is required");
  rejects(() => makeFileIdentity({ ...IDENTITY, predicate_versions: {} }), "at least one predicate");
});

test("the page inventory is ordered, unique, and referenced by findings", () => {
  rejects(() => makePage({ ...PAGE, rotation: 45 }), "multiple of 90");
  rejects(() => makePage({ ...PAGE, crop_box: [0, 0, 612] }), "crop_box is not a rect");
  rejects(() => makeFileResult({ file: IDENTITY, pages: [], findings: [] }), "at least one page");
  rejects(
    () => makeFileResult({ file: IDENTITY, pages: [{ ...PAGE, index: 1 }], findings: [] }),
    "out of order",
  );
  const offPage = validFinding();
  offPage.extraction.page_index = 4;
  rejects(
    () => makeFileResult({ file: IDENTITY, pages: [PAGE], findings: [offPage] }),
    "not in the page inventory",
  );
});

// ── (a) rejection of absence-shaped fields ──────────────────────────────────────

test("an absence-shaped KEY cannot enter the schema", () => {
  for (const key of ["absent", "absence", "missing", "not_found", "no_backdrop", "without_font", "is_missing"]) {
    rejects(() => assertNoAbsenceShapes({ [key]: 1 }), "absence-shaped field");
  }
  // And through a real constructor, not only the walk in isolation.
  rejects(
    () =>
      makeFileResult({
        file: { ...IDENTITY, predicate_versions: { no_ocg_predicate: "1" } },
        pages: [PAGE],
        findings: [],
      }),
    "absence-shaped field",
  );
});

test("an absence-shaped VALUE cannot enter the schema", () => {
  for (const value of [null, undefined, NaN, "none", "N/A", "not found", "missing", "unknown"]) {
    rejects(() => assertNoAbsenceShapes({ backdrop_source: value }), "absence-shaped value");
  }
});

test("a measurement nobody made is omitted, and omission is legal", () => {
  // metadata_text declares no page, no position, no effective size. That is the
  // whole mechanism: the fields are absent, so the templates that depend on them are
  // ineligible. Recording them as null instead would make the hole renderable.
  const f = makeFinding({
    class_label: "metadata_text",
    extraction: { text: "hello", codepoints: cp("hello") },
    graphics_state: { container_kind: "metadata", metadata_key: "Keywords" },
    checks_run: ["metadata_inventory"],
    thresholds_applied: {},
  });
  assert.ok(!("page_index" in f.extraction));
  assert.ok(!("effective_size_pt" in f.extraction));

  rejects(
    () =>
      makeFinding({
        class_label: "metadata_text",
        extraction: { text: "hello", codepoints: cp("hello"), page_index: null },
        graphics_state: { container_kind: "metadata", metadata_key: "Keywords" },
        checks_run: ["metadata_inventory"],
        thresholds_applied: {},
      }),
    "not a valid index",
  );
});

test("document-supplied text is opaque to the absence rule", () => {
  // A PDF is entitled to a metadata key literally named "none". Refusing to record
  // it would be the schema editing the evidence to fit its own vocabulary.
  const f = makeFinding({
    class_label: "metadata_text",
    extraction: { text: "none", codepoints: cp("none") },
    graphics_state: { container_kind: "metadata", metadata_key: "none" },
    checks_run: ["metadata_inventory"],
    thresholds_applied: {},
  });
  assert.equal(f.extraction.text, "none");
  assert.equal(f.graphics_state.metadata_key, "none");
});

// ── (a) checks_run and thresholds_applied are mandatory ─────────────────────────

test("checks_run is mandatory on every finding", () => {
  for (const classLabel of PHENOMENON_CLASS_IDS) {
    const fixture = TEMPLATE_LINT_FIXTURES.find((f) => f.finding.class_label === classLabel).finding;
    const base = {
      class_label: classLabel,
      extraction: { ...fixture.extraction, codepoints: [...fixture.extraction.codepoints] },
      graphics_state: { ...fixture.graphics_state },
      thresholds_applied: { ...fixture.thresholds_applied },
    };
    rejects(() => makeFinding({ ...base }), "checks_run is mandatory");
    rejects(() => makeFinding({ ...base, checks_run: [] }), "checks_run is mandatory");
  }
});

test("checks_run must record the checks the class declares — presence is not enough", () => {
  rejects(
    () => makeFinding({ ...validFinding(), checks_run: ["something_else"] }),
    'checks_run must record the "text_render_mode" check',
  );
  const fixture = TEMPLATE_LINT_FIXTURES.find((f) => f.id === "covered_text.filled_path").finding;
  rejects(
    () =>
      makeFinding({
        class_label: "covered_text",
        extraction: { ...fixture.extraction, codepoints: [...fixture.extraction.codepoints] },
        graphics_state: { ...fixture.graphics_state },
        checks_run: ["paint_order"],
        thresholds_applied: { ...fixture.thresholds_applied },
      }),
    'checks_run must record the "bbox_overlap" check',
  );
});

test("thresholds_applied is mandatory on every finding", () => {
  for (const classLabel of PHENOMENON_CLASS_IDS) {
    const fixture = TEMPLATE_LINT_FIXTURES.find((f) => f.finding.class_label === classLabel).finding;
    rejects(
      () =>
        makeFinding({
          class_label: classLabel,
          extraction: { ...fixture.extraction, codepoints: [...fixture.extraction.codepoints] },
          graphics_state: { ...fixture.graphics_state },
          checks_run: [...fixture.checks_run],
        }),
      "thresholds_applied is mandatory",
    );
  }
});

test("a class that declares a threshold cannot record a finding without it", () => {
  // The mandate that matters: a tiny_text finding cannot exist without the size
  // threshold that produced it, and a near_zero_alpha finding cannot exist without
  // the alpha threshold. The number in the record is the number the check applied.
  rejects(
    () =>
      makeFinding({
        class_label: "tiny_text",
        extraction: {
          text: "hello",
          codepoints: cp("hello"),
          page_index: 0,
          position: { x: 72, y: 700 },
          effective_size_pt: 0.4,
        },
        graphics_state: { font_size_pt: 4, text_matrix_scale: 0.1 },
        checks_run: ["effective_text_size"],
        thresholds_applied: {},
      }),
    'thresholds_applied must record "effective_size_pt_max"',
  );
  rejects(
    () =>
      makeFinding({
        class_label: "near_zero_alpha",
        extraction: {
          text: "hello",
          codepoints: cp("hello"),
          page_index: 0,
          position: { x: 72, y: 700 },
          effective_size_pt: 12,
        },
        graphics_state: { fill_alpha: 0.004 },
        checks_run: ["fill_alpha"],
        thresholds_applied: {},
      }),
    'thresholds_applied must record "fill_alpha_max"',
  );
});

test("an empty thresholds_applied records a structurally established class", () => {
  // Not an absence object: it says the class was reached with no numeric threshold
  // applied, which is a fact about the check rather than a claim about the document.
  const f = makeFinding(validFinding());
  assert.deepEqual(f.thresholds_applied, {});
  assert.equal(PHENOMENON_CLASSES.invisible_render_mode.thresholds.length, 0);
});

// ── Paired evidence: the two halves must answer to each other ───────────────────

test("codepoints must reproduce the extracted text", () => {
  const f = validFinding();
  f.extraction.codepoints = cp("goodbye");
  rejects(() => makeFinding(f), "do not reproduce");
});

test("a graphics-state record carries the class's declared fields and nothing else", () => {
  rejects(() => makeFinding({ ...validFinding(), graphics_state: {} }), "graphics_state.render_mode is required");
  rejects(
    () => makeFinding({ ...validFinding(), graphics_state: { render_mode: 3, fill_alpha: 0 } }),
    "graphics_state.fill_alpha is not a declared field",
  );
  rejects(
    () => makeFinding({ ...validFinding(), graphics_state: { render_mode: 0 } }),
    "must equal 3 for this class",
  );
});

test("a class's required extraction fields are required", () => {
  const f = validFinding();
  delete f.extraction.effective_size_pt;
  rejects(() => makeFinding(f), "extraction.effective_size_pt is required");
});

test("class invariants pair the graphics-state record to its own extraction record", () => {
  const encoding = TEMPLATE_LINT_FIXTURES.find((f) => f.id === "encoding_control_structures.zero_width").finding;
  rejects(
    () =>
      makeFinding({
        class_label: "encoding_control_structures",
        extraction: { ...encoding.extraction, codepoints: [...encoding.extraction.codepoints] },
        graphics_state: { control_category: "zero_width", control_codepoints: [0x202e] },
        checks_run: ["codepoint_scan"],
        thresholds_applied: {},
      }),
    "does not occur in the extracted span",
  );

  rejects(
    () =>
      makeFinding({
        class_label: "offpage_text",
        extraction: {
          text: "hello",
          codepoints: cp("hello"),
          page_index: 0,
          position: { x: 72, y: 700 },
          effective_size_pt: 12,
        },
        graphics_state: { text_bbox: [72, 690, 200, 706], crop_box: [0, 0, 612, 792] },
        checks_run: ["text_bbox_against_crop_box"],
        thresholds_applied: {},
      }),
    "does not intersect the crop box",
  );

  rejects(
    () =>
      makeFinding({
        class_label: "near_zero_alpha",
        extraction: {
          text: "hello",
          codepoints: cp("hello"),
          page_index: 0,
          position: { x: 72, y: 700 },
          effective_size_pt: 12,
        },
        graphics_state: { fill_alpha: 0 },
        checks_run: ["fill_alpha"],
        thresholds_applied: { fill_alpha_max: 0.05 },
      }),
    "alpha 0 is the zero_alpha class",
  );
});
