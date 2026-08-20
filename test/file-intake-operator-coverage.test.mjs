// file-intake-operator-coverage — the seven text operators the probe never exercised.
//
// ══ WHAT THIS TEST IS FOR ══════════════════════════════════════════════════════
//
// The probe corpus established that advances are exact. It established it on fixtures
// that show one text run per line, so "exact" was scoped to n=1: a walker that
// computed a correct advance and then threw it away would have passed every one of
// them. Tm, TJ, Tz, Ts, Tc, Tw and T* are the operators that make that distinction
// visible, and this file is where the scope widens.
//
// ══ WHY THE EXPECTED NUMBERS ARE NOT CIRCULAR ══════════════════════════════════
//
// Every fixture uses one font that declares a uniform 500/1000 em width for every
// code from 32 to 126, at 10pt. One glyph therefore advances 5.0pt exactly, and every
// number below is arithmetic a reader can redo on paper from the content stream in
// scripts/build-file-intake-op-fixtures.mjs. Nothing here was copied out of a walker
// run. Two of these expectations were wrong about the walker when first written, and
// the walker was what changed.
//
// The formula being checked, from the PDF specification:
//
//   tx = ((w0/1000) * Tfs + Tc + (byte is 32 ? Tw : 0)) * Th
//
// with a TJ number contributing (-adj/1000) * Tfs * Th, and the whole thing landing on
// the text matrix so the NEXT run starts where the last one stopped.
//
// ══ WHAT IT ALREADY CAUGHT ═════════════════════════════════════════════════════
//
// op01 failed on first run with a null origin and a NaN effective size. pdf.js hands
// `transform` its six numbers as loose arguments and `setTextMatrix` the same six as a
// single Float32Array; reading the second with the first's accessor does not throw, it
// quietly yields NaN for every coordinate. Every f-series fixture passed throughout,
// because not one of them uses Tm. See matrixArg in file-graphics-walker.js.
//
// Run: node --test test/file-intake-operator-coverage.test.mjs

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

import { readPdf } from "../file-intake-pdfjs.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, "fixtures", "file-intake");
const STANDARD_FONT_DIR =
  path.join(HERE, "..", "node_modules", "pdfjs-dist", "standard_fonts") + path.sep;

// The emitted bytes are pinned. The generator is committed beside them, but a fixture
// whose bytes drift is a different measurement, and a test that re-derived them at run
// time would not notice.
const FIXTURE_SHA256 = {
  "op01_tm_setmatrix.pdf": "036d5f004a20be95644324a10a18c9a602e0715ef8b9e4309dbc82a7ae3b7304",
  "op02_tj_array.pdf": "b1a34891c7e3a37d57ed1d70144fa0023917bcc8fdb4e6cb40837de7887adcbe",
  "op03_tz_hscale.pdf": "0984f1ce9af1a4549d3581a7ae752eaaeeb376469e4274db9c68586ef6b85164",
  "op04_ts_rise.pdf": "694391be2845cb6f18c6472d8fa3611ccb256331b3bff778cfe66ba753edd104",
  "op05_tc_charspacing.pdf": "5d20138f2568f66bd7fa1fa996fceec1d295776aa40351d11ea83ae0453fd6bc",
  "op06_tw_wordspacing.pdf": "134cf505738ded09f281b43ec01e3c9852580b0b71384386af1806a07a8f4518",
  "op07_tstar_nextline.pdf": "503370d58e12cb9f38f5ecfdffaede209dbc1ccebb09e055616920e2d9986d39",
};

const walkCache = new Map();

async function runsOf(file) {
  if (!walkCache.has(file)) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(FIXTURE_DIR, file)));
    const record = await readPdf({
      pdfjsLib,
      data: bytes,
      standardFontDataUrl: STANDARD_FONT_DIR,
    });
    walkCache.set(file, record);
  }
  return walkCache.get(file).pages[0].text_runs;
}

/**
 * Assert one run field by field. Every argument is a number or a string the reader can
 * check against the content stream; nothing is compared as a formatted line.
 */
function assertRun(run, expected, label) {
  assert.equal(run.text, expected.text, `${label}: text`);
  assert.equal(run.origin_device.x, expected.x, `${label}: origin x`);
  assert.equal(run.origin_device.y, expected.y, `${label}: origin y`);
  assert.equal(run.effective_size_pt, expected.size, `${label}: effective size`);
  assert.equal(run.advance_text_space_pt, expected.advance, `${label}: advance in text space`);
  assert.equal(run.advance_device_pt, expected.advanceDevice, `${label}: advance in device space`);
  assert.deepEqual(run.box_device, expected.box, `${label}: device box`);
}

test("every operator-coverage fixture is byte-pinned", () => {
  for (const [file, expected] of Object.entries(FIXTURE_SHA256)) {
    const bytes = fs.readFileSync(path.join(FIXTURE_DIR, file));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, `${file} sha256`);
  }
});

// Tm ────────────────────────────────────────────────────────────────────────────
// `2 0 0 2 40 150 Tm` scales the text by two and places it at (40,150). The scale is
// what makes 10pt render at 20pt and what makes a 20pt text-space advance cover 40pt
// of the page. The SECOND run is the load-bearing one: it can only land at x=80 if the
// walker both advanced the text matrix past the first run and carried the Tm scale
// into that advance. A walker that forgot either lands it back at x=40.
test("Tm sets the text matrix, and the advance is carried through its scale", async () => {
  const runs = await runsOf("op01_tm_setmatrix.pdf");
  assert.equal(runs.length, 2);
  assertRun(runs[0], {
    text: "ABCD", x: 40, y: 150, size: 20,
    advance: 20, advanceDevice: 40, box: [40, 150, 80, 170],
  }, "op01 run 0");
  assertRun(runs[1], {
    text: "EFGH", x: 80, y: 150, size: 20,
    advance: 20, advanceDevice: 40, box: [80, 150, 120, 170],
  }, "op01 run 1");
});

// TJ ────────────────────────────────────────────────────────────────────────────
// [(A) -1000 (B) 500 (C)] TJ. Three glyphs at 5pt each is 15. The -1000 adds
// (1000/1000)*10 = 10; the 500 subtracts (500/1000)*10 = 5. Total 20, against 15 for
// the same three glyphs shown with Tj — so a walker that ignored the numbers would be
// off by exactly 5 and a walker that got their sign backwards would report 10.
test("TJ number elements adjust the advance, with the sign the spec gives them", async () => {
  const runs = await runsOf("op02_tj_array.pdf");
  assert.equal(runs.length, 1);
  assertRun(runs[0], {
    text: "ABC", x: 50, y: 100, size: 10,
    advance: 20, advanceDevice: 20, box: [50, 100, 70, 110],
  }, "op02 run 0");
  assert.equal(runs[0].codepoints.length, 3, "op02: the TJ numbers are not glyphs");
});

// Tz ────────────────────────────────────────────────────────────────────────────
// `200 Tz` doubles the horizontal advance and changes nothing vertical. Five glyphs
// advance 50 instead of 25 while the effective size stays 10. The size assertion is
// the point: horizontal scaling is a common way to make text render at a size its Tf
// operand does not admit to, and a walker that folded Th into the size would report
// this run as 20pt and mis-rank it against a tiny-text threshold.
test("Tz scales the advance horizontally and leaves the effective size alone", async () => {
  const runs = await runsOf("op03_tz_hscale.pdf");
  assert.equal(runs.length, 1);
  assert.equal(runs[0].horizontal_scale, 2, "op03: Tz operand is recorded as a ratio");
  assertRun(runs[0], {
    text: "ABCDE", x: 50, y: 100, size: 10,
    advance: 50, advanceDevice: 50, box: [50, 100, 100, 110],
  }, "op03 run 0");
});

// Ts ────────────────────────────────────────────────────────────────────────────
// Rise moves the baseline without touching the text matrix, so run 2 sits 6pt up and
// run 3 sits 4pt down while both advance normally in x. If rise were applied to the
// matrix instead of the origin, run 3 would inherit run 2's displacement and land at
// y=102 rather than y=96.
test("Ts raises and lowers the baseline without accumulating into the matrix", async () => {
  const runs = await runsOf("op04_ts_rise.pdf");
  assert.equal(runs.length, 3);
  assertRun(runs[0], {
    text: "AB", x: 50, y: 100, size: 10,
    advance: 10, advanceDevice: 10, box: [50, 100, 60, 110],
  }, "op04 run 0");
  assertRun(runs[1], {
    text: "CD", x: 60, y: 106, size: 10,
    advance: 10, advanceDevice: 10, box: [60, 106, 70, 116],
  }, "op04 run 1");
  assertRun(runs[2], {
    text: "EF", x: 70, y: 96, size: 10,
    advance: 10, advanceDevice: 10, box: [70, 96, 80, 106],
  }, "op04 run 2");
  assert.equal(runs[0].text_rise, 0);
  assert.equal(runs[1].text_rise, 6);
  assert.equal(runs[2].text_rise, -4);
});

// Tc ────────────────────────────────────────────────────────────────────────────
// Character spacing applies after every glyph, the last one included, so three glyphs
// at 3pt spacing advance (5+3)*3 = 24 and not 5*3 + 3*2 = 21. The second run proves it
// both starts where the first ended and picks up the reset to zero.
test("Tc adds to every glyph including the last, and resets", async () => {
  const runs = await runsOf("op05_tc_charspacing.pdf");
  assert.equal(runs.length, 2);
  assertRun(runs[0], {
    text: "ABC", x: 50, y: 100, size: 10,
    advance: 24, advanceDevice: 24, box: [50, 100, 74, 110],
  }, "op05 run 0");
  assertRun(runs[1], {
    text: "DEF", x: 74, y: 100, size: 10,
    advance: 15, advanceDevice: 15, box: [74, 100, 89, 110],
  }, "op05 run 1");
});

// Tw ────────────────────────────────────────────────────────────────────────────
// Word spacing applies to single-byte code 32 and nothing else. "A B C" is five
// glyphs, two of them spaces, so 25 + (2 * 4) = 33 against 25 with Tw at zero. The
// fixture uses a simple-encoded Type1 font on purpose: under a two-byte Identity-H
// encoding, Tw has no code 32 to apply to and this test would pass while asserting
// nothing.
test("Tw applies to code 32 only", async () => {
  const runs = await runsOf("op06_tw_wordspacing.pdf");
  assert.equal(runs.length, 2);
  assertRun(runs[0], {
    text: "A B C", x: 50, y: 100, size: 10,
    advance: 33, advanceDevice: 33, box: [50, 100, 83, 110],
  }, "op06 run 0");
  assertRun(runs[1], {
    text: "A B C", x: 83, y: 100, size: 10,
    advance: 25, advanceDevice: 25, box: [83, 100, 108, 110],
  }, "op06 run 1");
  assert.equal(runs[0].word_spacing, 4);
  assert.equal(runs[1].word_spacing, 0);
});

// T* ───────────────────────────────────────────────────────────────────────────
// T* moves to the next line by resetting the text matrix from the LINE matrix and
// stepping down by the leading. The x coordinates are what carry the claim: each run
// advanced 10pt in x, so a walker that stepped the text matrix down without restoring
// it from the line matrix would put run 1 at x=60 and run 2 at x=70.
//
// The second block covers the other half of T*: TD sets the leading as a side effect,
// negated. `0 -20 TD` therefore means every subsequent T* steps 20 down, and nothing
// in the stream ever says `20 TL`.
test("T* restores x from the line matrix and steps down by the leading", async () => {
  const runs = await runsOf("op07_tstar_nextline.pdf");
  assert.equal(runs.length, 5);
  assertRun(runs[0], {
    text: "AA", x: 50, y: 150, size: 10,
    advance: 10, advanceDevice: 10, box: [50, 150, 60, 160],
  }, "op07 run 0");
  assertRun(runs[1], {
    text: "BB", x: 50, y: 136, size: 10,
    advance: 10, advanceDevice: 10, box: [50, 136, 60, 146],
  }, "op07 run 1");
  assertRun(runs[2], {
    text: "CC", x: 50, y: 122, size: 10,
    advance: 10, advanceDevice: 10, box: [50, 122, 60, 132],
  }, "op07 run 2");

  assertRun(runs[3], {
    text: "DD", x: 50, y: 40, size: 10,
    advance: 10, advanceDevice: 10, box: [50, 40, 60, 50],
  }, "op07 run 3");
  assertRun(runs[4], {
    text: "EE", x: 50, y: 20, size: 10,
    advance: 10, advanceDevice: 10, box: [50, 20, 60, 30],
  }, "op07 run 4");

  assert.equal(runs[0].leading, 14, "op07: TL operand");
  assert.equal(runs[3].leading, 20, "op07: TD set the leading, negated");
});

// The seven fixtures cover seven operators, and this asserts the walker actually saw
// each one rather than reaching the right numbers by a route that skipped it.
test("each fixture's operator list contains the operator it was authored for", async () => {
  const expected = {
    "op01_tm_setmatrix.pdf": "setTextMatrix",
    "op03_tz_hscale.pdf": "setHScale",
    "op04_ts_rise.pdf": "setTextRise",
    "op05_tc_charspacing.pdf": "setCharSpacing",
    "op06_tw_wordspacing.pdf": "setWordSpacing",
    "op07_tstar_nextline.pdf": "nextLine",
  };
  for (const [file, opName] of Object.entries(expected)) {
    const bytes = new Uint8Array(fs.readFileSync(path.join(FIXTURE_DIR, file)));
    const record = await readPdf({
      pdfjsLib,
      data: bytes,
      standardFontDataUrl: STANDARD_FONT_DIR,
    });
    assert.ok(
      record.pages[0].operator_names.includes(opName),
      `${file}: expected operator ${opName} in ${record.pages[0].operator_names.join(",")}`,
    );
  }

  // TJ has no operator of its own — pdf.js folds Tj and TJ into one showText whose
  // argument carries the adjustment numbers inline. Asserting a "setTJ" that does not
  // exist would be asserting a fiction, so the TJ claim is the advance in op02.
  const tj = await runsOf("op02_tj_array.pdf");
  assert.equal(tj[0].advance_text_space_pt, 20);
});
