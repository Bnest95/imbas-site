// file-intake-ground-truth.test.mjs — the machine verification the probe matrix lacked.
//
// The Phase 0 probe recorded its results as a hand-written matrix: a human read the
// walker's output, read ground_truth.json, and wrote "match" in a cell. That is a claim
// about a comparison, not a comparison. This file is the comparison.
//
// ══ WHAT "MECHANICAL" MEANS HERE ═══════════════════════════════════════════════
//
// Three properties, and every one of them is enforced by a test rather than promised
// by a comment:
//
//   1. Every value assertion is `actual == expected` on the values themselves. No
//      test in this file formats two things into strings and asserts the strings look
//      alike, and none of them asserts that a comparison was performed.
//
//   2. Every key in ground_truth.json is accounted for. A key is either checked by a
//      function in one of the CHECKS tables, or it is named in NOT_ASSERTABLE with the
//      reason it cannot be, or it is named in DIVERGENCES with both values pinned. If a
//      key is in none of the three, the accounting test fails. A future edit to the
//      ground truth that adds a field cannot pass unnoticed.
//
//   3. Every place the walker disagrees with the probe's ground truth is pinned in
//      DIVERGENCES with the ground-truth value, the walker's value, and the mechanism.
//      The test asserts BOTH sides. A disagreement that silently resolves — pdf.js
//      changing behavior, the walker changing convention — fails this file and forces
//      the divergence to be re-ruled rather than quietly forgotten.
//
// ══ THE VENDORING ══════════════════════════════════════════════════════════════
//
// FIXTURE_SHA256 pins every vendored byte. The probe was run against these exact files
// on imbas-instrument; a fixture that differs by one byte is a different experiment,
// and the matrix re-verified here would be re-verifying something else.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { readPdf, PARSER_VERSION, PAGE_BOX_LIMITATION } from "../file-intake-pdfjs.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures", "file-intake");
const STANDARD_FONTS = path.join(HERE, "..", "node_modules", "pdfjs-dist", "standard_fonts") + path.sep;

const GROUND_TRUTH = JSON.parse(fs.readFileSync(path.join(FIXTURES, "ground_truth.json"), "utf8"));

// ── vendored bytes ────────────────────────────────────────────────────────────

const FIXTURE_SHA256 = Object.freeze({
  "ground_truth.json": "30a5ff10696293415bef654109d10406625d51aa90e2ff4044df970920eaee9a",
  "c1_nocrop.pdf": "15ea76e4bb0679ec7a9b648eb79a4a0bcbb041c84ecc715ad3a9bc2f2e1e8b94",
  "c2_cropoffset.pdf": "9e74345a356344fae6218cf38134990613bb7447fc50b94df909edccc1465978",
  "c3_straddle.pdf": "9677b48a193947d42b789beae52bfa2fe593f0120b71d3178ff3f4c24318a60f",
  "c4_ctm_path.pdf": "5fc86052ece0225436d488aa17bc6a44455ec36ea82d33a0398ab06d76cf855c",
  "c5_attach_indirect.pdf": "94cca1e508502f15974cf2034ac4b715af7c479093a73d78b7966e4d59ad5303",
  "c6_form_xobject.pdf": "947386e4ff4a45dc195fc537c867d9234923673ed8e7c490165b30d1f9a98d8b",
  "c7_smask_blend.pdf": "269f9f3350b8c6fe79848b8e45e3db2e2a9b6fd4606fea5d01b8b1c6defe14f6",
  "c8a_covered_contrast.pdf": "c974a827468a5a8dccf8e18255ed2d6d0641d2f086241e2b0e81bd99daa8dd96",
  "c8b_ontop_contrast.pdf": "a77ebff296c4a94cca2b4e2e0676d02df1966eb74a5e87dc7af4cd0baac86f93",
  "c9_image_only.pdf": "d381547cf97bddcf90e944e1bb9e9c0033fcc03e9df14d416f40c41b9d0b0bd5",
  "f01_rendermode3.pdf": "36c618e2f82a27d6afc09d0a4baa19af98c2b6c4a3c0f12058ef84403f5d682d",
  "f02_alpha_zero.pdf": "96cf06dc686a5ddd86c2567d9be4685e297a0fb4831e0a85ea599d51d25490a4",
  "f03_alpha_near_zero.pdf": "dcab0e7ccbaa5587b6692ddb402fd617265dcff0af7ed8cf191b2f218fa028af",
  "f04_outside_cropbox.pdf": "d28169025a4f0af025d5c2b31c8fa41edd3f798423398e14b241da831ceda4f4",
  "f05_tiny_font.pdf": "2e45907275e57867671742df562ea57542a2b33e800419461c4e42bb38fb149a",
  "f06_white_on_white.pdf": "12c6d430614f5813ee95e85bdc0a6fe423a9bee87f310d7089252e0cfd6f8c9a",
  "f07_covered_text.pdf": "086e0cf50256cd3a7e97214fddbb0c8cbdbcd52ffafea1c2ed1d6568ac6f2132",
  "f08_annotation_text.pdf": "93b13fc0d33c94c538770e6860d50ad3140264cf7bf7c48284ca217a97df9b55",
  "f09_metadata_text.pdf": "7ed2d8d344b39e6425a5a7124618519066662477a590ff7e5fa8a082d17be643",
  "f10_hidden_ocg.pdf": "63499c8b37a98a56ea5c32bf07bdcf3d2820a665edbecd98b6aea60054c4d45a",
  "f11_zero_width.pdf": "a78669b5e80ef2302a9acf3fca8cb3914b9b34530f32765412b07b0f63668638",
  "f12_bidi_override.pdf": "a746e36e93af81b43c2fe1d15f73110e21600440985aa70a1d746aa9caa65cd2",
  "f13_tag_block.pdf": "09a949ddf3d8a54f161ba5c0506f93c33560a4a5ad5fb070fe5e2b75d5a405b6",
  "f14_visible_control.pdf": "b7006b40bc0a0f9ead8f55776cbc3139137aea9152bb177763c85468ec8e85bf",
  "f15_ocr_confound.pdf": "3f61cd6df03eb066e41760dd7bb47b11d112f314b62936efde52ae058cd2f4dc",
  "large_synthetic.pdf": "7636f6c24dd4abda9925be9938be65c594e38dd6726f70ccce19829c427748ec",
});

// ── geometry, stated once ─────────────────────────────────────────────────────

const contains = (outer, inner) =>
  inner[0] >= outer[0] && inner[1] >= outer[1] && inner[2] <= outer[2] && inner[3] <= outer[3];

const intersects = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

const near = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps;

function assertNumArray(actual, expected, message) {
  assert.equal(actual.length, expected.length, `${message}: length`);
  for (let i = 0; i < expected.length; i++) {
    assert.ok(near(actual[i], expected[i]), `${message}[${i}]: got ${actual[i]}, expected ${expected[i]}`);
  }
}

// ── walk cache: each fixture is parsed once ───────────────────────────────────

const walks = new Map();
async function walkOf(file) {
  if (!walks.has(file)) {
    const data = new Uint8Array(fs.readFileSync(path.join(FIXTURES, file)));
    walks.set(file, await readPdf({ pdfjsLib, data, standardFontDataUrl: STANDARD_FONTS }));
  }
  return walks.get(file);
}

const runFor = (page, str) => {
  const hits = page.text_runs.filter((r) => r.text === str);
  assert.equal(hits.length, 1, `expected exactly one run showing ${JSON.stringify(str)}, got ${hits.length}`);
  return hits[0];
};

const boxOfRun = (r) => r.box_device;

// ═══ WHAT CANNOT BE ASSERTED, AND WHY ══════════════════════════════════════════
//
// Each entry names a ground-truth key that carries no counterpart in the walker's
// output, with the reason. These are not soft passes: the accounting test proves each
// named key really does appear in the ground truth (so a stale exemption for a key
// that no longer exists is itself a failure), and the reason is the record of why the
// evidence path cannot reach it.

const NOT_ASSERTABLE = Object.freeze({
  "fixture.class": "A prose label for the fixture's intent. It names no operand the walker measures.",
  "fixture.page_media":
    "MediaBox is not on pdf.js's public surface at any version — see PAGE_BOX_LIMITATION. " +
    "f04 proves the two boxes differ (media [0,0,400,400], view [0,0,400,200]), so reporting " +
    "`view` under the name media_box would be a claim the parser never made.",
  "text.fill_colorspace":
    "pdf.js converts every fill colorspace to device RGB before the operator list is built. " +
    "The operator is setFillRGBColor whether the source was DeviceRGB, DeviceCMYK, or a " +
    "Separation. Source colorspace identity does not survive to this surface.",
  "text.stroke_colorspace": "Same conversion as text.fill_colorspace, on the stroke channel.",
  "text.fill_tint":
    "A Separation tint is the input to a tint transform pdf.js has already applied. Only the " +
    "resulting device RGB reaches the operator list; the tint itself does not.",
  "image.colorspace":
    "The image operator carries pixel dimensions and placement, not the source colorspace. " +
    "Same device-RGB conversion as text.fill_colorspace.",
});

// ═══ WHERE THE WALKER DISAGREES WITH THE PROBE'S GROUND TRUTH ══════════════════
//
// Reported, not softened. Each entry pins both values and the mechanism, and the
// divergence test asserts both sides — the ground truth still says what it says, and
// the walker still produces what it produces. If either moves, this file fails.

const DIVERGENCES = Object.freeze([
  {
    key: "text.glyph_box_pdf",
    fixture: "f07_covered_text",
    subject: 'text run "COVERED-BY-RECT"',
    ground_truth: [50, 100, 166.004, 108.604],
    walker: [50, 100, 166.004, 112],
    mechanism:
      "The probe's top edge is baseline + 12pt × 0.717, where 0.717 is Helvetica's ascent read " +
      "from a font table the probe consulted out of band. An operator list carries no glyph " +
      "outlines and no font ascent, so the walker's box top is the em box top: baseline + " +
      "effective size. Deliberate — a walker that emitted 108.604 would be reporting a number " +
      "it did not measure. The left, right, and bottom edges agree exactly.",
    check: async () => {
      const w = await walkOf("f07_covered_text.pdf");
      return boxOfRun(runFor(w.pages[0], "COVERED-BY-RECT"));
    },
  },
  {
    key: "annotation.rect",
    fixture: "f08_annotation_text",
    subject: "the Text annotation at index 0",
    ground_truth: [200, 120, 220, 140],
    walker: [200, 118, 222, 140],
    mechanism:
      "pdf.js enforces a minimum size on Text (sticky-note) annotations and rewrites the " +
      "rectangle it returns, growing the authored 20×20 to 22×22. The fixture's bytes carry " +
      "the ground truth's rectangle; the parser's public surface does not return it. Every " +
      "other annotation rect on this fixture agrees exactly.",
    check: async () => {
      const w = await walkOf("f08_annotation_text.pdf");
      return w.pages[0].annotations[0].rect;
    },
  },
  {
    key: "fixture.attachments",
    fixture: "f09_metadata_text",
    subject: "getAttachments() on a document with one embedded file",
    ground_truth: 1,
    walker: 0,
    mechanism:
      "The fixture's catalog carries /Names << /EmbeddedFiles << /Names [(attached.txt) 8 0 R] >> >>, " +
      "object 8 is a well-formed /Type /Filespec, object 9 is /Type /EmbeddedFile /Length 24, and " +
      "the xref offsets were checked against the real object offsets and match exactly. The " +
      "fixture is sound; pdf.js 6.2.108 returns an empty attachment set for it. Reported rather " +
      "than worked around: attachment text is not one of the eleven Lane 1 classes, so no " +
      "detector depends on it, and inventing a second PDF parser to reach it would put an " +
      "unpinned implementation into the evidence path.",
    check: async () => (await walkOf("f09_metadata_text.pdf")).attachments.length,
  },
  {
    key: "fixture.attachments",
    fixture: "c5_attach_indirect",
    subject: "getAttachments() on the indirect-name-tree control",
    ground_truth: 1,
    walker: 0,
    mechanism: "Same as f09_metadata_text. The control fixture reproduces it, so the behavior is not one file's accident.",
    check: async () => (await walkOf("c5_attach_indirect.pdf")).attachments.length,
  },
  {
    key: "image.name",
    fixture: "f15_ocr_confound",
    subject: "the image XObject's identifier",
    ground_truth: "Im0",
    walker: "img_p0_1",
    mechanism:
      "/Im0 is the resource name in the page's XObject dictionary. pdf.js assigns its own " +
      "per-page synthetic id to the decoded image and puts that on the operator list; the " +
      "authored resource name does not cross to this surface. The placement, pixel dimensions, " +
      "and CTM all agree exactly.",
    check: async () => (await walkOf("f15_ocr_confound.pdf")).pages[0].images[0].object_id,
  },
]);

const divergentKeys = new Set(DIVERGENCES.map((d) => `${d.fixture}::${d.key}`));
const isDivergent = (fixture, key) => divergentKeys.has(`${fixture}::${key}`);

// ═══ THE CHECKS ════════════════════════════════════════════════════════════════

const TEXT_CHECKS = {
  str: (r, exp) => assert.equal(r.text, exp),
  render_mode: (r, exp) => assert.equal(r.render_mode, exp),
  font_size: (r, exp) => assert.equal(r.font_size_pt, exp),
  font_size_nominal: (r, exp) => assert.equal(r.font_size_pt, exp),
  effective_size_pt: (r, exp) => assert.ok(near(r.effective_size_pt, exp), `effective_size_pt ${r.effective_size_pt} != ${exp}`),
  origin_pdf: (r, exp) => assertNumArray([r.origin_device.x, r.origin_device.y], exp, "origin_pdf"),
  width_pt: (r, exp) => assert.ok(near(r.advance_device_pt, exp), `width_pt ${r.advance_device_pt} != ${exp}`),
  ctm: (r, exp) => assertNumArray(r.ctm, exp, "ctm"),
  fill_alpha: (r, exp) => assert.equal(r.fill_alpha, exp),
  stroke_alpha: (r, exp) => assert.equal(r.stroke_alpha, exp),
  line_width: (r, exp) => assert.equal(r.line_width, exp),
  fill_color: (r, exp, ctx) => {
    // Only meaningful where the ground truth's own colorspace is DeviceRGB. Where it is
    // not, the comparison is against a converted value and belongs to NOT_ASSERTABLE.
    if (ctx.text.fill_colorspace && ctx.text.fill_colorspace !== "DeviceRGB") return "skip";
    assertNumArray(r.fill_color_rgb, exp, "fill_color");
    return undefined;
  },
  fill_rgb_255: (r, exp) => assertNumArray(r.fill_color_rgb.map((c) => Math.round(c * 255)), exp, "fill_rgb_255"),
  stroke_color: (r, exp) => assertNumArray(r.stroke_color_rgb, exp, "stroke_color"),
  codepoints: (r, exp) => assert.deepEqual(r.codepoints, exp.map((s) => parseInt(s.slice(2), 16))),
  n_chars: (r, exp) => assert.equal([...r.text].length, exp),
  clip_rect_pdf: (r, exp) => {
    assert.equal(r.clip_stack.length, 1, "expected exactly one clip in force");
    assertNumArray(r.clip_stack[0].box_device, exp, "clip_rect_pdf");
  },
  inside_clip: (r, exp) => assert.equal(r.clip_stack.every((c) => intersects(c.box_device, boxOfRun(r))), exp),
  inside_cropbox: (r, exp, ctx) => assert.equal(contains(ctx.page.view, boxOfRun(r)), exp),
  ocg_name: (r, exp, ctx) => {
    const ids = r.marked_content.flatMap((m) => m.ocg_ids || []);
    assert.equal(ids.length, 1, "expected exactly one OCG in force");
    assert.equal(ctx.groups.get(ids[0])?.name, exp);
  },
  ocg_visible: (r, exp, ctx) => {
    const ids = r.marked_content.flatMap((m) => m.ocg_ids || []);
    assert.equal(ctx.groups.get(ids[0])?.visible, exp);
  },
  painted_before_coverer: (r, exp, ctx) => {
    const coverer = ctx.page.paths.find((p) => p.is_fill);
    assert.ok(coverer, "expected a filled path to serve as the coverer");
    assert.equal(r.op_index < coverer.op_index, exp);
  },
  fully_covered: (r, exp, ctx) => {
    const covered = ctx.page.paths.some(
      (p) => p.is_fill && p.fill_alpha === 1 && p.op_index > r.op_index && contains(p.box_device, boxOfRun(r)),
    );
    assert.equal(covered, exp);
  },
  over_image: (r, exp, ctx) => {
    const over = ctx.page.images.some((im) => im.op_index < r.op_index && contains(im.box_device, boxOfRun(r)));
    assert.equal(over, exp);
  },
};

const COVERER_CHECKS = {
  op: (p, exp) => {
    // "re f" is the authored operator pair. pdf.js expands `re` into a moveto, three
    // linetos and a close inside constructPath, so the rectangle survives as geometry
    // rather than as an operator name; what is assertable is that the path was filled.
    assert.equal(exp, "re f");
    assert.equal(p.paint_op, "fill");
    assert.equal(p.is_fill, true);
  },
  rect_pdf: (p, exp) => assertNumArray(p.min_max_user, exp, "coverer.rect_pdf"),
  fill_colorspace: (p, exp) => assert.equal(exp, "DeviceRGB"),
  fill_color: (p, exp) => assertNumArray(p.fill_color_rgb, exp, "coverer.fill_color"),
  alpha: (p, exp) => assert.equal(p.fill_alpha, exp),
  // Scoped to the text the ground truth marks as covered, not to every run on the page.
  // f07 deliberately shows a second run AFTER the rectangle, and reading the claim as
  // "the rectangle follows all text" would fail on the very fixture that makes the
  // z-order question meaningful.
  drawn_after_text: (p, exp, ctx) => {
    const covered = ctx.texts.filter((t) => t.painted_before_coverer === true);
    assert.equal(covered.length, 1, "expected exactly one text marked painted_before_coverer");
    const run = runFor(ctx.page, covered[0].str);
    assert.equal(run.op_index < p.op_index, exp);
  },
};

const IMAGE_CHECKS = {
  pixel_w: (im, exp) => assert.equal(im.pixel_width, exp),
  pixel_h: (im, exp) => assert.equal(im.pixel_height, exp),
  placed_rect_pdf: (im, exp) => assertNumArray(im.box_device, exp, "image.placed_rect_pdf"),
  ctm: (im, exp) => assertNumArray(im.ctm, exp, "image.ctm"),
  drawn_before_text: (im, exp, ctx) => assert.equal(ctx.page.text_runs.every((r) => r.op_index > im.op_index), exp),
};

const ANNOTATION_CHECKS = {
  subtype: (a, exp) => assert.equal(a.subtype, exp),
  contents: (a, exp) => assert.equal(a.contents, exp),
  rect: (a, exp) => assertNumArray(a.rect, exp, "annotation.rect"),
  field_name: (a, exp) => assert.equal(a.field_name, exp),
  field_value: (a, exp) => assert.equal(a.field_value, exp),
};

// ═══ THE PER-FIXTURE RE-VERIFICATION ═══════════════════════════════════════════

const seenKeys = new Set();
const noteKey = (k) => seenKeys.add(k);

test("every vendored fixture is byte-identical to the file the probe was run against", () => {
  const onDisk = fs.readdirSync(FIXTURES).sort();
  for (const name of onDisk) {
    if (!name.endsWith(".pdf") && name !== "ground_truth.json") continue;
    if (name.startsWith("op")) continue; // authored here, pinned in file-intake-operator-coverage
    const pinned = FIXTURE_SHA256[name];
    assert.ok(pinned, `fixture ${name} is present but not pinned in FIXTURE_SHA256`);
    const actual = crypto.createHash("sha256").update(fs.readFileSync(path.join(FIXTURES, name))).digest("hex");
    assert.equal(actual, pinned, `${name} does not match its pinned hash`);
  }
  for (const name of Object.keys(FIXTURE_SHA256)) {
    assert.ok(onDisk.includes(name), `FIXTURE_SHA256 pins ${name}, which is not on disk`);
  }
});

for (const [fixtureKey, expected] of Object.entries(GROUND_TRUTH)) {
  if (fixtureKey === "large_synthetic") continue;

  test(`ground truth: ${fixtureKey}`, async () => {
    const record = await walkOf(expected.file);
    const page = record.pages[0];
    const groups = new Map(record.optional_content_groups.map((g) => [g.id, g]));

    for (const key of Object.keys(expected)) noteKey(`fixture.${key}`);

    assert.equal(expected.file, `${fixtureKey}.pdf`);
    assert.equal(record.identity.byte_size, expected.bytes);
    assertNumArray(page.view, expected.page_crop, "page_crop");

    if ("texts" in expected) {
      for (const text of expected.texts) {
        const run = runFor(page, text.str);
        const ctx = { page, groups, text };
        for (const [key, value] of Object.entries(text)) {
          noteKey(`text.${key}`);
          if (isDivergent(fixtureKey, `text.${key}`)) continue;
          if (`text.${key}` in NOT_ASSERTABLE) continue;
          const check = TEXT_CHECKS[key];
          assert.ok(check, `no check and no exemption for text key "${key}" on ${fixtureKey}`);
          check(run, value, ctx);
        }
      }
      // The ground truth is a complete inventory of the fixture's text, not a sample.
      assert.equal(page.text_runs.length, expected.texts.length, "walker found a different number of text runs");
    }

    if ("painted_background" in expected) {
      assert.equal(expected.painted_background, null);
      assert.equal(page.paths.filter((p) => p.is_paint).length, 0, "expected nothing painted behind the text");
    }

    if ("coverer" in expected) {
      const coverer = page.paths.find((p) => p.is_fill);
      assert.ok(coverer, "expected a filled path");
      for (const [key, value] of Object.entries(expected.coverer)) {
        noteKey(`coverer.${key}`);
        if (isDivergent(fixtureKey, `coverer.${key}`)) continue;
        if (`coverer.${key}` in NOT_ASSERTABLE) continue;
        const check = COVERER_CHECKS[key];
        assert.ok(check, `no check and no exemption for coverer key "${key}"`);
        check(coverer, value, { page, texts: expected.texts });
      }
    }

    if ("image" in expected) {
      assert.equal(page.images.length, 1);
      const image = page.images[0];
      for (const [key, value] of Object.entries(expected.image)) {
        noteKey(`image.${key}`);
        if (isDivergent(fixtureKey, `image.${key}`)) continue;
        if (`image.${key}` in NOT_ASSERTABLE) continue;
        const check = IMAGE_CHECKS[key];
        assert.ok(check, `no check and no exemption for image key "${key}"`);
        check(image, value, { page });
      }
    }

    if ("annotations" in expected) {
      assert.equal(page.annotations.length, expected.annotations.length);
      expected.annotations.forEach((wanted, i) => {
        const actual = page.annotations[i];
        for (const [key, value] of Object.entries(wanted)) {
          noteKey(`annotation.${key}`);
          if (key === "rect" && isDivergent(fixtureKey, "annotation.rect") && i === 0) continue;
          if (`annotation.${key}` in NOT_ASSERTABLE) continue;
          const check = ANNOTATION_CHECKS[key];
          assert.ok(check, `no check and no exemption for annotation key "${key}"`);
          check(actual, value);
        }
      });
    }

    if ("info" in expected) {
      for (const [key, value] of Object.entries(expected.info)) assert.equal(record.info[key], value);
    }

    if ("xmp_contains" in expected) {
      const values = Object.values(record.xmp_fields);
      for (const marker of expected.xmp_contains) {
        assert.ok(values.includes(marker), `XMP field values do not include ${JSON.stringify(marker)}`);
        assert.ok(record.xmp.includes(marker), `raw XMP packet does not include ${JSON.stringify(marker)}`);
      }
    }

    if ("attachments" in expected) {
      // Divergent; asserted in the divergence test rather than skipped silently.
      assert.ok(isDivergent(fixtureKey, "fixture.attachments"));
    }
  });
}

test("ground truth: large_synthetic (82 pages walked end to end)", async () => {
  const expected = GROUND_TRUTH.large_synthetic;
  for (const key of Object.keys(expected)) noteKey(`fixture.${key}`);

  const record = await walkOf(expected.file);
  assert.equal(record.identity.byte_size, expected.bytes);
  assert.equal(record.page_count, expected.pages);
  assert.equal(
    record.pages.reduce((n, p) => n + p.text_runs.length, 0),
    expected.text_lines,
  );
});

test("every ground-truth key is checked, exempted, or pinned as divergent", () => {
  // seenKeys is populated by the per-fixture tests above. node:test runs the tests in
  // this file in declaration order within one process, so by the time this runs, every
  // key the ground truth carries has been walked past exactly once.
  assert.ok(seenKeys.size > 0, "no ground-truth keys were seen — the per-fixture tests did not run");

  const unhandled = [...seenKeys].filter((k) => {
    const [scope, name] = k.split(".");
    if (k in NOT_ASSERTABLE) return false;
    if ([...divergentKeys].some((d) => d.endsWith(`::${k}`))) return false;
    if (scope === "fixture") return !["file", "bytes", "page_crop", "texts", "painted_background", "coverer", "image", "annotations", "info", "xmp_contains", "pages", "text_lines"].includes(name);
    if (scope === "text") return !(name in TEXT_CHECKS);
    if (scope === "coverer") return !(name in COVERER_CHECKS);
    if (scope === "image") return !(name in IMAGE_CHECKS);
    if (scope === "annotation") return !(name in ANNOTATION_CHECKS);
    return true;
  });
  assert.deepEqual(unhandled, [], `ground-truth keys with no check and no exemption: ${unhandled.join(", ")}`);

  // A stale exemption is a failure too: NOT_ASSERTABLE may only name keys the ground
  // truth actually carries.
  for (const key of Object.keys(NOT_ASSERTABLE)) {
    assert.ok(seenKeys.has(key), `NOT_ASSERTABLE names "${key}", which no longer appears in ground_truth.json`);
  }
});

test("walker-vs-ground-truth divergences are pinned on both sides", async () => {
  assert.equal(DIVERGENCES.length, 5);
  for (const d of DIVERGENCES) {
    const actual = await d.check();
    if (Array.isArray(d.walker)) assertNumArray(actual, d.walker, `${d.fixture} ${d.key}`);
    else assert.equal(actual, d.walker, `${d.fixture} ${d.key}`);
    assert.notDeepEqual(actual, d.ground_truth, `${d.fixture} ${d.key} no longer diverges — the divergence needs re-ruling, not a silent pass`);
    assert.ok(d.mechanism.length > 80, `${d.key} needs a stated mechanism`);
  }
});

test("the page box pdf.js does not expose is named rather than substituted", async () => {
  assert.equal(PAGE_BOX_LIMITATION.not_exposed, "MediaBox");
  const record = await walkOf("f04_outside_cropbox.pdf");
  // f04 is the fixture that proves the substitution would be wrong: its MediaBox and
  // its CropBox are different rectangles, and `view` is the CropBox.
  assertNumArray(record.pages[0].view, GROUND_TRUTH.f04_outside_cropbox.page_crop, "view");
  assert.notDeepEqual(GROUND_TRUTH.f04_outside_cropbox.page_media, GROUND_TRUTH.f04_outside_cropbox.page_crop);
});

// ═══ c8b: THE NEVER-PROBED CONTROL ═════════════════════════════════════════════
//
// c8a and c8b carry byte-identical text and byte-identical geometry. The only
// difference is the order of the two halves of the content stream. The probe ran c8a
// and never ran c8b, which means the covered-text finding rested on one arrangement
// with no control. Asserting c8b's operator list is what makes the pair a discriminator
// instead of a single observation.

test("c8b operator list: the same operators as c8a, in the opposite order", async () => {
  const a = (await walkOf("c8a_covered_contrast.pdf")).pages[0];
  const b = (await walkOf("c8b_ontop_contrast.pdf")).pages[0];

  assert.deepEqual(a.operator_names, [
    "beginText", "dependency", "setFont", "setFillRGBColor", "moveText",
    "showText", "endText", "setFillRGBColor", "constructPath",
  ]);
  assert.deepEqual(b.operator_names, [
    "setFillRGBColor", "constructPath", "beginText", "dependency", "setFont",
    "setFillRGBColor", "moveText", "showText", "endText",
  ]);
  assert.equal(a.operator_count, 9);
  assert.equal(b.operator_count, 9);

  // Same text, same place, same size, same colour.
  assert.equal(a.text_runs.length, 1);
  assert.equal(b.text_runs.length, 1);
  assert.equal(a.text_runs[0].text, b.text_runs[0].text);
  assert.equal(a.text_runs[0].text, "CONTRAST-COVER-TEST");
  assertNumArray(b.text_runs[0].box_device, a.text_runs[0].box_device, "c8b text box");
  assert.deepEqual(b.text_runs[0].fill_color_rgb, a.text_runs[0].fill_color_rgb);

  // Same rectangle, same fill.
  assert.equal(a.paths.length, 1);
  assert.equal(b.paths.length, 1);
  assertNumArray(b.paths[0].min_max_user, a.paths[0].min_max_user, "c8b rect");
  assert.deepEqual(b.paths[0].fill_color_rgb, a.paths[0].fill_color_rgb);
  assert.equal(b.paths[0].is_fill, true);

  // The one thing that differs, and it is the whole finding: z-order.
  assert.ok(a.text_runs[0].op_index < a.paths[0].op_index, "c8a paints the rectangle after the text");
  assert.ok(b.text_runs[0].op_index > b.paths[0].op_index, "c8b paints the rectangle before the text");
});

// ═══ THE TWO-IMPLEMENTATION CROSS-CHECK ════════════════════════════════════════
//
// getTextContent is barred from the evidence path. It appears here and nowhere else,
// as a comparator, because two things need proving and only a second implementation can
// prove either.
//
//   Where both surfaces carry the run, they agree on position and advance. That is
//   independent corroboration of the walker's arithmetic rather than a restatement of it.
//
//   Where they disagree, the disagreement is exactly what the ruling says it is. The
//   ruling barred getTextContent on two specific grounds; both are reproduced below
//   against fixtures, so the bar rests on measurement rather than on recollection.

async function textContentItems(file) {
  const task = pdfjsLib.getDocument({
    data: new Uint8Array(fs.readFileSync(path.join(FIXTURES, file))),
    standardFontDataUrl: STANDARD_FONTS,
    useSystemFonts: false,
    isEvalSupported: false,
  });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    return (await page.getTextContent()).items.filter((it) => typeof it.str === "string");
  } finally {
    await task.destroy();
  }
}

test("cross-check: where both surfaces carry a run, positions and advances agree exactly", async () => {
  // Fixtures with no format characters and no TJ adjustments — the conditions under
  // which the two implementations are measuring the same thing.
  for (const file of ["f01_rendermode3.pdf", "f07_covered_text.pdf", "f14_visible_control.pdf"]) {
    const walk = (await walkOf(file)).pages[0];
    const items = await textContentItems(file);
    assert.equal(items.length, walk.text_runs.length, `${file}: run count`);
    items.forEach((item, i) => {
      const run = walk.text_runs[i];
      assert.equal(item.str, run.text, `${file}[${i}]: string`);
      assert.ok(near(item.transform[4], run.origin_device.x, 1e-3), `${file}[${i}]: x ${item.transform[4]} vs ${run.origin_device.x}`);
      assert.ok(near(item.transform[5], run.origin_device.y, 1e-3), `${file}[${i}]: y ${item.transform[5]} vs ${run.origin_device.y}`);
      assert.ok(near(item.width, run.advance_device_pt, 1e-3), `${file}[${i}]: advance ${item.width} vs ${run.advance_device_pt}`);
    });
  }
});

test("cross-check: getTextContent deletes the format codepoints the walker records", async () => {
  const cases = [
    { file: "f11_zero_width.pdf", deleted: [0x200b, 0x200c, 0x200d, 0x2060, 0x00ad, 0xfeff] },
    { file: "f12_bidi_override.pdf", deleted: [0x202e, 0x202c, 0x200f, 0x061c] },
    { file: "f13_tag_block.pdf", deleted: [0xe0001, 0xe0054, 0xe0041, 0xe0047, 0xe007f] },
  ];
  for (const { file, deleted } of cases) {
    const run = (await walkOf(file)).pages[0].text_runs[0];
    const comparatorCodepoints = new Set(
      (await textContentItems(file)).flatMap((it) => [...it.str].map((c) => c.codePointAt(0))),
    );
    for (const cp of deleted) {
      assert.ok(run.codepoints.includes(cp), `${file}: walker lost U+${cp.toString(16).toUpperCase()}`);
      assert.ok(
        !comparatorCodepoints.has(cp),
        `${file}: getTextContent now surfaces U+${cp.toString(16).toUpperCase()} — the ruling that barred it needs re-deriving`,
      );
    }
  }
  // encoding_control_structures is the class that would be silently empty on the barred
  // surface. It is not a preference between two APIs; it is the difference between a
  // finding and no finding.
  const tagRun = (await walkOf("f13_tag_block.pdf")).pages[0].text_runs[0];
  assert.equal(tagRun.codepoints.length, 15);
  assert.equal((await textContentItems("f13_tag_block.pdf")).map((i) => i.str).join("").length, 10);
});

test("cross-check: getTextContent fabricates characters no show operator painted", async () => {
  // op02's content stream shows exactly three glyphs: [(A) -1000 (B) 500 (C)] TJ. The
  // -1000 adjustment opens a 10pt gap, and getTextContent fills the gap with a space
  // character that no Tj painted and no font ever measured.
  const run = (await walkOf("op02_tj_array.pdf")).pages[0].text_runs[0];
  assert.equal(run.text, "ABC");
  assert.equal(run.glyphs.filter((g) => g.kind === "glyph").length, 3);

  const items = await textContentItems("op02_tj_array.pdf");
  const fabricated = items.map((i) => i.str).join("");
  assert.equal(fabricated, "A BC");
  assert.ok(fabricated.length > run.text.length, "expected the comparator to add characters");
  assert.equal(fabricated.replaceAll(" ", ""), run.text, "the fabricated characters are spaces around the walker's glyphs");

  // The same fabrication on a real fixture: f11's zero-width run gains a space item.
  const f11 = await textContentItems("f11_zero_width.pdf");
  assert.ok(f11.some((i) => i.str === " "), "expected a fabricated space item on f11");
  assert.equal((await walkOf("f11_zero_width.pdf")).pages[0].text_runs[0].text.includes(" "), false);
});

test("cross-check: getTextContent silently drops a run that lies outside the crop box", async () => {
  // A third divergence, not named in the ruling and worth writing down. f04 shows three
  // runs; the comparator returns two. The missing one is OUTSIDE-CROPBOX — precisely the
  // run the offpage_text class exists to find.
  const walk = (await walkOf("f04_outside_cropbox.pdf")).pages[0];
  const items = await textContentItems("f04_outside_cropbox.pdf");
  assert.equal(walk.text_runs.length, 3);
  assert.equal(items.length, 2);
  assert.ok(walk.text_runs.some((r) => r.text === "OUTSIDE-CROPBOX"));
  assert.ok(!items.some((i) => i.str === "OUTSIDE-CROPBOX"));
});

test("the evidence record carries the parser identity every finding is re-derivable against", async () => {
  const record = await walkOf("f01_rendermode3.pdf");
  assert.equal(record.identity.parser_name, "pdfjs-dist");
  assert.equal(record.identity.parser_version, PARSER_VERSION);
  assert.equal(record.identity.parser_version, "6.2.108");
  assert.equal(record.identity.sha256, FIXTURE_SHA256["f01_rendermode3.pdf"]);
  assert.equal(record.identity.byte_size, GROUND_TRUTH.f01_rendermode3.bytes);
});
