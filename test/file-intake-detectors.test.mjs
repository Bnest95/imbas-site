// file-intake-detectors — the eleven classes, over the whole vendored corpus.
//
// ══ THE TWO CLAIMS ═════════════════════════════════════════════════════════════
//
// A detector set is worth something only if both halves hold. The fixtures that carry
// a phenomenon must produce its class, AND the controls must produce nothing. A
// detector that fires on everything passes the first half perfectly, which is why the
// expected sets below are EXACT rather than a containment check: an extra finding on
// any fixture fails just as hard as a missing one.
//
// The load-bearing pair is c8a/c8b. Both paint the same white run and the same black
// rectangle over the same coordinates, and they differ only in operator order. c8a
// must produce covered_text and c8b must not. Lane 1 grounded the presence of c8a's
// run by codepoints; this is where the discrimination itself is mechanical.
//
// c3 is the second discrimination pair, inside one file: a run whose box crosses the
// crop boundary and a run entirely above it. Only the second is offpage_text.
//
// ══ NO DETECTOR BYPASSES THE SCHEMA ════════════════════════════════════════════
//
// Every finding here was constructed by makeFinding in file-result.js. The last tests
// in this file prove that is enforced rather than merely true today: the constructed
// findings are frozen, and a graphics-state record that does not answer to its own
// extraction record is refused.
//
// Run: node --test test/file-intake-detectors.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { readPdf } from "../file-intake-pdfjs.js";
import { detectFileFindings, DEFAULT_THRESHOLDS, PREDICATE_SET_NAME } from "../file-detectors.js";
import { WALKER_NAME, WALKER_VERSION } from "../file-graphics-walker.js";
import { makeFinding, PHENOMENON_CLASS_IDS, FILE_CANON_ERROR_PREFIX } from "../file-result.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, "fixtures", "file-intake");
const STANDARD_FONT_DIR =
  path.join(HERE, "..", "node_modules", "pdfjs-dist", "standard_fonts") + path.sep;

const cache = new Map();

async function detect(file, thresholds) {
  const key = `${file}::${JSON.stringify(thresholds || null)}`;
  if (!cache.has(key)) {
    const data = new Uint8Array(fs.readFileSync(path.join(FIXTURE_DIR, file)));
    const record = await readPdf({ pdfjsLib, data, standardFontDataUrl: STANDARD_FONT_DIR });
    cache.set(key, detectFileFindings({ record, thresholds }));
  }
  return cache.get(key);
}

function classesOf(findings) {
  return findings.map((f) => f.class_label).sort();
}

// The complete expected output over every fixture in the corpus. Empty arrays are the
// controls, and they are the half of this table that is easy to get wrong.
const EXPECTED = {
  // ── controls: nothing to report ──────────────────────────────────────────────
  "c1_nocrop.pdf": [],
  "c2_cropoffset.pdf": [],
  "c4_ctm_path.pdf": [],
  "c5_attach_indirect.pdf": [],
  "c6_form_xobject.pdf": [],
  "c7_smask_blend.pdf": [],
  "c9_image_only.pdf": [],
  "f14_visible_control.pdf": [],
  "op01_tm_setmatrix.pdf": [],
  "op02_tj_array.pdf": [],
  "op03_tz_hscale.pdf": [],
  "op04_ts_rise.pdf": [],
  "op05_tc_charspacing.pdf": [],
  "op06_tw_wordspacing.pdf": [],
  "op07_tstar_nextline.pdf": [],

  // ── the discrimination pairs ─────────────────────────────────────────────────
  // One run crosses the crop boundary and one sits entirely above it.
  "c3_straddle.pdf": ["offpage_text"],
  // Same run, same rectangle, rectangle painted second.
  "c8a_covered_contrast.pdf": ["covered_text", "white_fill_unbacked"],
  // Same run, same rectangle, rectangle painted FIRST. Nothing to report — and not
  // even white_fill_unbacked, because by the time the run is shown the rectangle is
  // already under it and the backdrop is no longer the page default.
  "c8b_ontop_contrast.pdf": [],

  // ── one class each ───────────────────────────────────────────────────────────
  "f01_rendermode3.pdf": ["invisible_render_mode"],
  "f02_alpha_zero.pdf": ["zero_alpha"],
  "f03_alpha_near_zero.pdf": ["near_zero_alpha"],
  "f04_outside_cropbox.pdf": ["offpage_text"],
  "f05_tiny_font.pdf": ["tiny_text", "tiny_text"],
  "f06_white_on_white.pdf": ["white_fill_unbacked"],
  "f07_covered_text.pdf": ["covered_text"],
  "f08_annotation_text.pdf": ["annotation_text", "annotation_text", "annotation_text", "annotation_text"],
  "f09_metadata_text.pdf": new Array(8).fill("metadata_text"),
  "f10_hidden_ocg.pdf": ["hidden_ocg_text"],
  "f11_zero_width.pdf": ["encoding_control_structures"],
  "f12_bidi_override.pdf": ["encoding_control_structures"],
  "f13_tag_block.pdf": ["encoding_control_structures"],
  "f15_ocr_confound.pdf": ["invisible_render_mode"],
};

test("the expected table covers every fixture in the corpus", () => {
  const onDisk = fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => f.endsWith(".pdf") && f !== "large_synthetic.pdf")
    .sort();
  assert.deepEqual(Object.keys(EXPECTED).sort(), onDisk);
});

test("every fixture produces exactly its expected classes, controls included", async () => {
  for (const [file, expected] of Object.entries(EXPECTED)) {
    const { findings } = await detect(file);
    assert.deepEqual(classesOf(findings), [...expected].sort(), `${file}`);
  }
});

// ── the covered-text discrimination ───────────────────────────────────────────
test("c8a and c8b differ in operator order alone, and only c8a is covered_text", async () => {
  const a = await detect("c8a_covered_contrast.pdf");
  const b = await detect("c8b_ontop_contrast.pdf");

  const covered = a.findings.filter((f) => f.class_label === "covered_text");
  assert.equal(covered.length, 1);
  assert.equal(covered[0].extraction.text, "CONTRAST-COVER-TEST");
  assert.equal(covered[0].graphics_state.covering_object_kind, "filled_path");
  assert.deepEqual(covered[0].graphics_state.text_bbox, [50, 100, 197.336, 112]);
  assert.deepEqual(covered[0].graphics_state.covering_object_bbox, [45, 96, 175, 114]);
  // The rectangle is painted three operators after the run is shown.
  assert.equal(covered[0].graphics_state.z_order_delta, 3);

  assert.equal(b.findings.filter((f) => f.class_label === "covered_text").length, 0);

  // Both files carry the same run. The difference is order, and nothing else.
  const aRun = a.findings.find((f) => f.class_label === "white_fill_unbacked");
  assert.equal(aRun.extraction.text, "CONTRAST-COVER-TEST");
});

// c8a's rectangle covers 84.84% of the run's box — the rectangle ends at x=175 and the
// run advances to x=197.336. Recomputing it here from the recorded boxes is what makes
// the threshold auditable rather than a number a reader has to take on faith.
test("c8a's overlap fraction is recomputable from the finding's own boxes", async () => {
  const { findings } = await detect("c8a_covered_contrast.pdf");
  const f = findings.find((x) => x.class_label === "covered_text");
  const [tx0, ty0, tx1, ty1] = f.graphics_state.text_bbox;
  const [cx0, cy0, cx1, cy1] = f.graphics_state.covering_object_bbox;
  const overlap =
    (Math.min(tx1, cx1) - Math.max(tx0, cx0)) *
    (Math.min(ty1, cy1) - Math.max(ty0, cy0)) /
    ((tx1 - tx0) * (ty1 - ty0));
  assert.ok(Math.abs(overlap - 0.8484) < 0.0001, `overlap was ${overlap}`);
  assert.ok(overlap >= f.thresholds_applied.bbox_overlap_min);
});

test("raising the overlap threshold above c8a's measured fraction withdraws the finding", async () => {
  const strict = await detect("c8a_covered_contrast.pdf", { bbox_overlap_min: 0.9 });
  assert.equal(strict.findings.filter((f) => f.class_label === "covered_text").length, 0);
  // f07's rectangle contains its run outright, so it survives the same threshold.
  const f07 = await detect("f07_covered_text.pdf", { bbox_overlap_min: 0.9 });
  assert.equal(f07.findings.filter((f) => f.class_label === "covered_text").length, 1);
});

// ── the crop-boundary discrimination ──────────────────────────────────────────
test("c3 reports the run above the crop box and not the one crossing it", async () => {
  const { findings } = await detect("c3_straddle.pdf");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].class_label, "offpage_text");
  assert.equal(findings[0].extraction.text, "JUST-ABOVE-CROP");
  assert.deepEqual(findings[0].graphics_state.text_bbox, [50, 205, 164.012, 217]);
  assert.deepEqual(findings[0].graphics_state.crop_box, [0, 0, 400, 200]);
});

// ── the classes whose fields carry the substance ──────────────────────────────
test("tiny_text records the nominal size and the scale separately", async () => {
  const { findings } = await detect("f05_tiny_font.pdf");
  const byText = Object.fromEntries(findings.map((f) => [f.extraction.text, f]));

  // Small because the Tf operand is small.
  assert.equal(byText["TINY-HALF-POINT"].graphics_state.font_size_pt, 0.5);
  assert.equal(byText["TINY-HALF-POINT"].graphics_state.text_matrix_scale, 1);
  assert.equal(byText["TINY-HALF-POINT"].extraction.effective_size_pt, 0.5);

  // Small because the matrix made it small. The Tf operand says 12.
  assert.equal(byText["CTM-SCALED-12PT"].graphics_state.font_size_pt, 12);
  assert.equal(byText["CTM-SCALED-12PT"].graphics_state.text_matrix_scale, 0.04);
  assert.equal(byText["CTM-SCALED-12PT"].extraction.effective_size_pt, 0.48);
});

test("near_zero_alpha records the alpha and the threshold that admitted it", async () => {
  const { findings } = await detect("f03_alpha_near_zero.pdf");
  assert.equal(findings[0].graphics_state.fill_alpha, 0.004);
  assert.equal(findings[0].thresholds_applied.fill_alpha_max, DEFAULT_THRESHOLDS.fill_alpha_max);

  // Below the threshold but not zero: lowering the threshold under the measured alpha
  // withdraws the finding, and it does not fall through to zero_alpha.
  const strict = await detect("f03_alpha_near_zero.pdf", { fill_alpha_max: 0.001 });
  assert.deepEqual(classesOf(strict.findings), []);
});

test("encoding classes name only codepoints the span actually carries", async () => {
  const zw = (await detect("f11_zero_width.pdf")).findings[0];
  assert.equal(zw.graphics_state.control_category, "zero_width");
  assert.deepEqual(zw.graphics_state.control_codepoints, [0x200b, 0x200c, 0x200d, 0x2060, 0x00ad, 0xfeff]);

  const bidi = (await detect("f12_bidi_override.pdf")).findings[0];
  assert.equal(bidi.graphics_state.control_category, "bidi_override");
  assert.deepEqual(bidi.graphics_state.control_codepoints, [0x202e, 0x202c, 0x200f, 0x061c]);

  // The tag block is the one that is silently wrong without standardFontDataUrl: the
  // same five glyphs resolve to their low seven bits, and every codepoint here would
  // be a different number. See the header note in file-intake-pdfjs.js.
  const tags = (await detect("f13_tag_block.pdf")).findings[0];
  assert.equal(tags.graphics_state.control_category, "unicode_tag_block");
  assert.deepEqual(tags.graphics_state.control_codepoints, [0xe0001, 0xe0054, 0xe0041, 0xe0047, 0xe007f]);

  for (const f of [zw, bidi, tags]) {
    const present = new Set(f.extraction.codepoints);
    for (const cp of f.graphics_state.control_codepoints) assert.ok(present.has(cp));
  }
});

test("hidden_ocg_text names the group that is off and leaves the visible one alone", async () => {
  const { findings } = await detect("f10_hidden_ocg.pdf");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].extraction.text, "HIDDEN-OCG-TEXT");
  assert.equal(findings[0].graphics_state.ocg_name, "HiddenLayer");
  assert.equal(findings[0].graphics_state.ocg_default_state, "off");
});

test("annotation_text reports each text-carrying field with its own subtype", async () => {
  const { findings } = await detect("f08_annotation_text.pdf");
  const pairs = findings.map((f) => [f.graphics_state.annotation_subtype, f.extraction.text]);
  assert.deepEqual(pairs.sort(), [
    ["FreeText", "FREETEXT-BODY-TEXT"],
    ["Text", "ANNOT-SECRET-TEXT"],
    ["Text", "probe-author"],
    ["Widget", "FIELDVALUE-42"],
  ]);
  // No page content is reported here. The page body run is an ordinary visible run,
  // and reporting it under a container it does not sit in would be the mis-attribution
  // this class exists to avoid.
  for (const f of findings) assert.equal(f.graphics_state.container_kind, "annotation");
});

test("metadata_text reports both the info dictionary and the XMP packet", async () => {
  const { findings } = await detect("f09_metadata_text.pdf");
  const byKey = Object.fromEntries(findings.map((f) => [f.graphics_state.metadata_key, f.extraction.text]));
  assert.deepEqual(byKey, {
    "info:Title": "META-TITLE-STRING",
    "info:Author": "META-AUTHOR-STRING",
    "info:Subject": "META-SUBJECT-STRING",
    "info:Keywords": "META-KEYWORD-ALPHA",
    "info:Creator": "probe-generator",
    "info:Producer": "hand-authored",
    "xmp:dc:title": "XMP-SECRET-MARKER",
    "xmp:dc:description": "XMP-DESCRIPTION-PAYLOAD",
  });
  // No page index and no position: a document's metadata has neither, and the schema
  // declares an empty extraction requirement for this class so none is invented.
  for (const f of findings) {
    assert.ok(!Object.prototype.hasOwnProperty.call(f.extraction, "page_index"));
    assert.ok(!Object.prototype.hasOwnProperty.call(f.extraction, "position"));
  }
});

// ── identity ──────────────────────────────────────────────────────────────────
test("the finding set carries a re-derivable identity", async () => {
  const { identity } = await detect("f01_rendermode3.pdf");
  assert.match(identity.sha256, /^[0-9a-f]{64}$/);
  assert.equal(identity.parser_name, "pdfjs-dist");
  assert.equal(identity.parser_version, "6.2.108");
  assert.equal(identity.predicate_versions[WALKER_NAME], WALKER_VERSION);
  assert.ok(identity.predicate_versions[PREDICATE_SET_NAME]);
  assert.ok(identity.byte_size > 0);
});

// ── the schema is the gate, not a formality ───────────────────────────────────
test("every emitted finding is a frozen product of the schema module", async () => {
  let total = 0;
  for (const file of Object.keys(EXPECTED)) {
    const { findings } = await detect(file);
    for (const f of findings) {
      total += 1;
      assert.ok(Object.isFrozen(f), `${file}: finding not frozen`);
      assert.ok(Object.isFrozen(f.graphics_state));
      assert.ok(PHENOMENON_CLASS_IDS.includes(f.class_label));
      assert.deepEqual(f.extraction.codepoints, [...f.extraction.text].map((c) => c.codePointAt(0)));
      assert.ok(Array.isArray(f.checks_run) && f.checks_run.length > 0);
    }
  }
  assert.equal(total, Object.values(EXPECTED).flat().length);
});

test("the schema refuses a finding whose halves disagree", () => {
  // A covered_text whose covering box does not reach its text box. If a detector could
  // emit this, the class would mean nothing.
  assert.throws(
    () =>
      makeFinding({
        class_label: "covered_text",
        extraction: {
          text: "AB",
          codepoints: [65, 66],
          page_index: 0,
          position: { x: 0, y: 0 },
          effective_size_pt: 10,
        },
        graphics_state: {
          text_bbox: [0, 0, 10, 10],
          covering_object_bbox: [100, 100, 110, 110],
          covering_object_kind: "filled_path",
          z_order_delta: 1,
        },
        checks_run: ["paint_order", "bbox_overlap"],
        thresholds_applied: { bbox_overlap_min: 0.5 },
      }),
    (err) => err instanceof RangeError && err.message.startsWith(FILE_CANON_ERROR_PREFIX),
  );

  // An offpage_text whose box sits inside the crop box.
  assert.throws(
    () =>
      makeFinding({
        class_label: "offpage_text",
        extraction: {
          text: "AB",
          codepoints: [65, 66],
          page_index: 0,
          position: { x: 5, y: 5 },
          effective_size_pt: 10,
        },
        graphics_state: { text_bbox: [5, 5, 15, 15], crop_box: [0, 0, 400, 200] },
        checks_run: ["text_bbox_against_crop_box"],
        thresholds_applied: {},
      }),
    (err) => err instanceof RangeError,
  );
});
