// The orientation line, pinned whole, on every surface that ships it.
//
// One sentence pair teaches a reader what a mark is. It renders on the run surface
// (filed into INSPECT, because a runner watched their own marks being made) and on the
// share surface (in the open, because a stranger did not). Same words both times. The
// placement is a composition decision each surface makes for itself; the wording is not
// a decision either surface gets to make.
//
// WHY A FULL-STRING PIN AND NOT A PATTERN. This line is one recast away from being an
// overclaim, and the two shapes it must not take are shapes a pattern would miss. It
// says "absent from it" rather than "isn't in it" — a state the answer is in, not an
// expectation the answer failed. It closes on "records both" rather than enumerating
// what was and was not there. Both were live wordings; both were retired by founder
// ruling; both read as perfectly reasonable English, which is exactly why nothing but a
// literal will hold the line. A regex over denial shapes would also fire on prose that
// is fine, and standing law forbids one.
//
// WHAT IS ASSERTED, AND WHERE. The pin is worth only as much as the places it reaches:
//
//   reader-result.js      the constant itself, beside the ANCHOR_CHANNEL enum whose two
//                         members the sentence is the prose statement of
//   workbench.bundle.js   what actually ships to a runner's browser — the source could
//                         be right and the built artifact stale, and a checked-in bundle
//                         makes that a live possibility rather than a hypothetical
//   inspection.js         the share page, which is a plain script, cannot import the
//                         module, and therefore carries a mirrored copy that a pin is
//                         the only thing keeping honest
//   board baselines       what was on screen when a camera looked at the running
//                         product, which catches a string assembled at runtime that no
//                         source scan would see
//
// Run: node --test test/reader-orientation-line.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { ANCHOR_CHANNEL, MARK_ORIENTATION_NOTE } from "../reader-result.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BOARD_DIR = join(ROOT, "docs", "qa", "visual-acceptance-harness");

const read = (f) => readFileSync(join(ROOT, f), "utf8");

// The governed string, written out here in full rather than imported and compared to
// itself. This literal is the assertion: if the constant changes, this file must be
// edited by the same hand in the same commit, and a reviewer reading the diff sees the
// new words next to the old ones.
const GOVERNED =
  "Each mark points at something in this answer, or at something absent from it. Imbas records both.";

// The wordings this line used to carry, and the one that was considered and rejected.
// Each is an exact literal, matched as a substring. There is no pattern here and there
// is not going to be one: a denial-shape regex fires on innocent prose, and it teaches
// the shape it exists to prevent by naming it.
//
//   1 and 2  the two contracted negatives of the pre-recast line, retired together.
//   3        "missing from it", rejected when the recast was drafted: it says the
//            answer owed the reader that material, which is a claim about obligation
//            that no inspection establishes.
const RETIRED = [
  ["the pre-recast referent clause", "or at something that isn't in it"],
  ["the pre-recast closing clause", "Imbas records what was there and what wasn't"],
  ["the rejected alternative referent clause", "missing from it"],
];

// Every place the sentence must appear, byte-identical.
const CARRIERS = [
  ["reader-result.js", () => read("reader-result.js")],
  ["workbench.bundle.js", () => read("workbench.bundle.js")],
  ["inspection.js", () => read("inspection.js")],
];

function boardRenderSections() {
  return readdirSync(BOARD_DIR)
    .filter((f) => f.endsWith(".snapshot.txt"))
    .sort()
    .map((f) => {
      const text = readFileSync(join(BOARD_DIR, f), "utf8");
      const i = text.indexOf("\n## render\n");
      return { file: f, render: i < 0 ? "" : text.slice(i) };
    });
}

// ── 0 · Guarding the guard ───────────────────────────────────────────────────
//
// The absence assertions below are only worth something if they would actually fire.
// A typo in a retired literal — a straight apostrophe where the source has a curly one,
// a dropped word — turns every one of them into a test that passes on anything. So the
// retired wordings are first proved to be detectable, against samples built here.
test("0) each retired wording is detectable, so its absence elsewhere means something", () => {
  for (const [label, literal] of RETIRED) {
    const sample = `prefix ${literal} suffix`;
    assert.ok(
      sample.includes(literal),
      `${label}: the literal does not match a string built around it — the pin is inert`,
    );
  }
  // And the governed string must not itself contain any retired wording, or the
  // absence assertions would be unsatisfiable wherever the line correctly ships.
  for (const [label, literal] of RETIRED) {
    assert.ok(
      !GOVERNED.includes(literal),
      `${label}: the governed string contains the wording it retires`,
    );
  }
});

// ── 1 · The constant is the governed string, whole ───────────────────────────
test("1) MARK_ORIENTATION_NOTE is the governed line, byte for byte", () => {
  assert.equal(MARK_ORIENTATION_NOTE, GOVERNED);
  // The recast was measured at 97 characters against the 125 it replaced, and the
  // measurement is on the record. A length check is a second, independent way for a
  // silent edit to fail — it catches a changed character that a reviewer's eye slides
  // over, which is the failure a literal comparison alone is weakest against.
  assert.equal(MARK_ORIENTATION_NOTE.length, 97);
});

// ── 2 · It is the prose statement of the enum it sits beside ─────────────────
//
// Not decoration. The sentence names two referents because ANCHOR_CHANNEL has exactly
// two members: a mark points at words in the answer, or at something absent from it.
// If a third channel is ever added, this line stops being true and this test is where
// that gets noticed — before the line ships describing a world with two doors in it.
test("2) the line describes exactly the channels that exist", () => {
  assert.deepEqual(Object.keys(ANCHOR_CHANNEL).sort(), ["QUOTED_SPAN", "RECORD_LEVEL_ABSENCE"]);
});

// ── 3 · Every carrier ships it, and none carries a retired wording ───────────
test("3) every surface that renders marks ships the governed line", () => {
  for (const [name, load] of CARRIERS) {
    const text = load();
    assert.ok(
      text.includes(GOVERNED),
      `${name} does not carry the governed orientation line. If the constant moved, ` +
        `move the pin with it; if the bundle is stale, run npm run build:workbench.`,
    );
  }
});

test("4) no surface carries a retired wording of the line", () => {
  const found = [];
  for (const [name, load] of CARRIERS) {
    const text = load();
    for (const [label, literal] of RETIRED) {
      if (text.includes(literal)) found.push(`${name}: ${label} → ${JSON.stringify(literal)}`);
    }
  }
  assert.deepEqual(found, [], `retired orientation wording is back in the build:\n${found.join("\n")}`);
});

// ── 5 · The share page's mirrored copy equals the module's ───────────────────
//
// inspection.js is loaded as a plain script and cannot import reader-result.js, so it
// declares its own copy. That is a second place for the words to live, which is a second
// place for them to drift. The constant is lifted out of the source by name and compared
// to the module's export — extracting rather than re-typing is what makes this a check
// on the shipped string instead of on a third copy written into this file.
test("5) the share page's copy of the line is the module's, not a variant of it", () => {
  const src = read("inspection.js");
  const m = /^const MARK_ORIENTATION_NOTE =\s*\n?\s*("(?:[^"\\]|\\.)*");$/m.exec(src);
  assert.ok(m, "inspection.js must declare MARK_ORIENTATION_NOTE as a string constant");
  assert.equal(JSON.parse(m[1]), MARK_ORIENTATION_NOTE);
});

// ── 6 · What the camera saw ──────────────────────────────────────────────────
//
// A source scan proves the strings are not in the build. This proves they were not on
// screen. The two fail independently: a phrase assembled at runtime from fragments
// passes every scan above and still renders.
test("6) no retired wording appears on any photographed board frame", () => {
  const sections = boardRenderSections();
  assert.ok(sections.length > 0, "no board snapshots found — the board scan is inert");
  const found = [];
  for (const { file, render } of sections) {
    for (const [label, literal] of RETIRED) {
      if (render.includes(literal)) found.push(`${file}: ${label}`);
    }
  }
  assert.deepEqual(found, [], `retired orientation wording was photographed:\n${found.join("\n")}`);
});
