// Four routed strings, cured of denial-by-naming, pinned whole.
//
// THE RULE THESE FOUR BROKE. A line that says what something is NOT hands the reader the
// frame it is trying to keep out of their head, in the Reader's own voice, and the frame
// is what they carry away. "An inspection that surfaces nothing is not a clean bill of
// health" is the clearest case: a person who reads it now has "clean bill of health"
// available and a denial to weigh against it. The cure is not deletion. Each of these
// carried real propositions — a scope, a limit, a warning — and every one of them is
// preserved, restated as the extent of what the record establishes.
//
// WHY FULL-STRING LITERALS AND NOT A PATTERN. Standing law forbids a generic
// denial-by-naming regex, and the reason is that one cannot be written: "not" before a
// noun is ordinary English and any pattern loose enough to catch these would fire on
// prose that is fine, while any pattern tight enough to be safe would miss the next
// recast. So each cured string is written out here in full, and each retired wording is
// written out here in full and asserted absent. If a cured line changes, this file must
// be edited by the same hand in the same commit, and a reviewer sees the new words next
// to the old ones.
//
// WHERE THE PINS REACH. A cure that only holds in source is not a cure:
//
//   the module      the constant itself, where an editor would touch it
//   the bundle      what actually ships to a browser — a checked-in artifact can be
//                   stale, and three of these four compile into it
//   the board       what was on screen when a camera looked at the running product,
//                   which is the only check that sees a string assembled at runtime
//
// A NOTE ON THE BUNDLE'S BYTES. esbuild escapes non-ASCII, so an em-dash in source is
// — in the bundle. A naive substring check for a cured line containing one would
// pass vacuously by never matching anything. Section 0 proves each bundle form is
// findable before section 3 relies on it.
//
// Run: node --test test/reader-copy-cures.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { CHIP_LOOP_STATE_COPY, CHIP_LOOP_STATE_VISIBLE } from "../reader-paired.js";
import { EXPLAIN_PANEL_UI, EXPLAIN_STATE_S1, EXPLAIN_STATE_S3 } from "../reader-explain-panel.js";
import { CHECK_UI } from "../reader-checks.js";
import { lintChipStrings, lintUserFacingStrings } from "../reader-check-vocab.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const BOARD_DIR = join(ROOT, "docs", "qa", "visual-acceptance-harness");
const read = (f) => readFileSync(join(ROOT, f), "utf8");

const BUNDLE = read("workbench.bundle.js");

// esbuild's escaping, applied to a source literal so the bundle can be searched for it.
// Only the characters these four lines actually contain — an em-dash and an apostrophe
// are the whole set — because a general escaper would be a second implementation of a
// bundler's rules and would drift from it silently.
const asBundled = (s) => s.replace(/[—‘’]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

// ── The adjudicated set ──────────────────────────────────────────────────────
//
// `cured` is the governed wording. `retired` is every wording that must not come back at
// that location: the shipped line this replaced, plus, where one existed, a wording
// considered during the recast and rejected. `where` names the source file the constant
// lives in — the pin on the module is by identity, so this is the file the absence
// assertions scan.
const CURES = [
  {
    key: "A",
    label: "CHIP_LOOP_STATE_COPY.chip_change_visible.note",
    where: "reader-paired.js",
    actual: () => CHIP_LOOP_STATE_COPY[CHIP_LOOP_STATE_VISIBLE].note,
    cured:
      "That's under the conditions you recorded. The change showing up is the whole of what this comparison establishes about the second answer.",
    retired: [
      // The shipped line. Two denials in one clause, and it spent them on the two words
      // a person most wants applied to an answer.
      "It doesn't mean the second answer is correct or complete.",
      // Considered and rejected: it keeps the denial and only softens the verb.
      "It isn't a claim that the second answer is correct or complete.",
    ],
  },
  {
    key: "B",
    label: "EXPLAIN_PANEL_UI.states.S1.why",
    where: "reader-explain-panel.js",
    actual: () => EXPLAIN_PANEL_UI.states[EXPLAIN_STATE_S1].why,
    cured:
      "That's a record of what was inspected under these conditions, and the extent of that inspection is the whole of what it establishes. A different question, a different model, or a closer reading can still surface what this one did not.",
    retired: [
      "That's a record of what was inspected, not a verdict on the answer.",
      "An inspection that surfaces nothing is not a clean bill of health.",
      // The phrase alone, because the sentence around it is the part most likely to be
      // reworded while the memorable four words survive the edit.
      "clean bill of health",
    ],
  },
  {
    key: "C",
    label: "EXPLAIN_PANEL_UI.states.S3.why",
    where: "reader-explain-panel.js",
    actual: () => EXPLAIN_PANEL_UI.states[EXPLAIN_STATE_S3].why,
    cured:
      "That's a comparison recorded under these conditions, and how the two answers compared is the whole of what it establishes. What either one left out is a separate question.",
    retired: [
      "It does not establish that nothing was left out.",
      // Considered and rejected: still a denial, and a vaguer one.
      "It does not mean nothing was left out.",
    ],
  },
  {
    key: "D",
    label: "CHECK_UI.provisional_label",
    where: "reader-checks.js",
    actual: () => CHECK_UI.provisional_label,
    cured: "Provisional — a pointer",
    retired: [
      "Provisional — a pointer, not a verdict",
      // The tail on its own. This is what must not come back, in any sentence, at this
      // location — the label repeats under every card, so a returning tail returns once
      // per card.
      ", not a verdict",
    ],
  },

  // ── Two more, found by the pins above rather than by the routing ────────────
  //
  // E and F were not on the routed list. Both were caught because D's pin is on the bare
  // tail rather than on the whole label, and both are kept here rather than pinned
  // around, because each one renders on the same surface as a routed cure and would have
  // left the retired construction on screen beside its own replacement. Narrowing a pin
  // to let a live instance through is the move that makes a pin decorative.
  {
    key: "E",
    label: "CHECK_UI.register_note",
    where: "reader-checks.js",
    actual: () => CHECK_UI.register_note,
    cured:
      "Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers — copy a question and check it against a source.",
    retired: [
      "Provisional pointers, not verdicts",
      ", not verdicts",
    ],
  },
  {
    key: "F",
    label: "readerCandidateSummary — the null-result line under the hero count",
    where: "workbench-app.jsx",
    // A JSX file Node cannot import, so the constant is read out of the source by the
    // function that returns it. Extracting rather than re-typing is what makes this a
    // check on the shipped string instead of on a copy written into this file.
    actual: () => {
      const src = read("workbench-app.jsx");
      const m = /function readerCandidateSummary\([\s\S]*?return ("(?:[^"\\]|\\.)*");/.exec(src);
      assert.ok(m, "readerCandidateSummary must return its null-result line as a string literal");
      return JSON.parse(m[1]);
    },
    cured:
      "Reader surfaced nothing to list here under the tested conditions. That records the extent of this inspection.",
    retired: [
      "That records what this inspection found, not a verdict on the answer.",
      "not a verdict on the answer",
    ],
  },
];

// ── 0 · Guarding the guard ───────────────────────────────────────────────────
//
// An absence assertion is only worth something if it would fire. A typo in a retired
// literal — a straight apostrophe where the source had a curly one, a dropped word —
// turns every assertion below into a test that passes on anything.
test("0) every retired wording is detectable, and no cured line contains one", () => {
  for (const c of CURES) {
    for (const dead of c.retired) {
      assert.ok(
        `prefix ${dead} suffix`.includes(dead),
        `${c.key}: the retired literal does not match a string built around it — the pin is inert`,
      );
      assert.ok(
        !c.cured.includes(dead),
        `${c.key}: the cured line still contains the wording it retires: ${JSON.stringify(dead)}`,
      );
    }
    // And the bundle-escaped form of each cured line is findable, so section 3 is not
    // asserting the presence of a string that could never appear.
    assert.ok(
      `prefix ${asBundled(c.cured)} suffix`.includes(asBundled(c.cured)),
      `${c.key}: the bundled form of the cured line is not matchable`,
    );
  }
});

// ── 1 · Each constant is its cured wording, whole ────────────────────────────
test("1) every cured string is exactly what this file says it is", () => {
  for (const c of CURES) {
    assert.equal(c.actual(), c.cured, `${c.label} is not the cured wording`);
  }
});

// ── 2 · The retired wordings are gone from the files they lived in ───────────
test("2) no retired wording survives in the module that carried it", () => {
  const found = [];
  for (const c of CURES) {
    const src = read(c.where);
    for (const dead of c.retired) {
      // The retired literals are quoted in THIS file by necessity; in the product source
      // they may appear only inside a comment explaining the cure, which is where the
      // reasoning belongs and is not a rendered string. So the scan is over the file with
      // its comments stripped of the quoted forms — done by requiring that any surviving
      // occurrence sit on a line that is not a comment.
      for (const line of src.split("\n")) {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
        if (line.includes(dead)) found.push(`${c.where}: ${c.key} → ${JSON.stringify(dead)}`);
      }
    }
  }
  assert.deepEqual(found, [], `retired copy is back in the product source:\n${found.join("\n")}`);
});

// ── 3 · What ships carries the cure, and not the retirement ──────────────────
//
// Three of the four compile into workbench.bundle.js. A source-only pin would pass on a
// stale artifact, which is a live possibility here because the bundle is checked in.
test("3) the shipped bundle carries every cured string", () => {
  const missing = [];
  for (const c of CURES) {
    if (!BUNDLE.includes(asBundled(c.cured))) missing.push(`${c.key} · ${c.label}`);
  }
  assert.deepEqual(
    missing,
    [],
    `the bundle does not carry these cured strings — run npm run build:workbench:\n${missing.join("\n")}`,
  );
});

test("4) the shipped bundle carries no retired wording", () => {
  const found = [];
  for (const c of CURES) {
    for (const dead of c.retired) {
      if (BUNDLE.includes(asBundled(dead))) found.push(`${c.key} → ${JSON.stringify(dead)}`);
    }
  }
  assert.deepEqual(found, [], `retired copy is in the shipped bundle:\n${found.join("\n")}`);
});

// ── 5 · What the camera saw ──────────────────────────────────────────────────
//
// A source scan proves the words are not in the build. This proves they were not on
// screen. The two fail independently: a phrase assembled at runtime out of fragments
// passes every scan above and still renders. D in particular rendered on 36 of the 62
// board frames, once under every check card.
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

test("5) no retired wording appears on any photographed board frame", () => {
  const sections = boardRenderSections();
  assert.ok(sections.length > 0, "no board snapshots found — the board scan is inert");
  const found = [];
  for (const { file, render } of sections) {
    for (const c of CURES) {
      for (const dead of c.retired) {
        if (render.includes(dead)) found.push(`${file}: ${c.key} → ${JSON.stringify(dead)}`);
      }
    }
  }
  assert.deepEqual(found, [], `retired copy was photographed:\n${found.join("\n")}`);
});

// ── 6 · The cures pass the linters that already govern their lanes ───────────
//
// Two registers, two lists: the chip lane has its own vocabulary and is deliberately
// never run through the world-claim linter. A cure that fixed the denial and introduced
// a banned construction would be a worse line than the one it replaced, so each cured
// string is put through the linter that governs the surface it renders on.
test("6) every cured string passes the linter that governs its surface", () => {
  assert.deepEqual(lintChipStrings(CHIP_LOOP_STATE_COPY), [], "the chip lane copy trips the chip lint");
  assert.deepEqual(lintUserFacingStrings(EXPLAIN_PANEL_UI), [], "the panel copy trips AT-5");
  assert.deepEqual(lintUserFacingStrings(CHECK_UI), [], "the check register copy trips AT-5");
});

// ── 7 · The propositions survived ────────────────────────────────────────────
//
// The point of a cure is that nothing was dropped. Each retired line carried something
// the reader needed, and this is where each one is checked as still present — asserted
// on the meaning rather than on the wording, so a later rewrite that keeps the sense is
// free and one that quietly drops a proposition is not.
test("7) each cure keeps what its retired line was there to say", () => {
  // A: the reading is scoped to the person's recorded conditions, and it claims nothing
  // about the second answer beyond the change appearing.
  const a = CHIP_LOOP_STATE_COPY[CHIP_LOOP_STATE_VISIBLE].note;
  assert.ok(a.includes("the conditions you recorded"), "A dropped the conditions scope");
  assert.ok(a.includes("the whole of what"), "A dropped the extent claim");
  assert.ok(a.includes("the second answer"), "A stopped naming what it is silent about");

  // B: the panel holds the extent of one inspection, and a null result leaves room for a
  // further one to surface something.
  const b = EXPLAIN_PANEL_UI.states[EXPLAIN_STATE_S1].why;
  assert.ok(b.includes("what was inspected"), "B dropped the record-of-inspection proposition");
  assert.ok(b.includes("the whole of what it establishes"), "B dropped the extent claim");
  assert.ok(b.includes("can still surface what this one did not"), "B dropped the null-result warning");

  // C: the comparison is bounded to what it measured, and completeness is a separate
  // question it did not answer.
  const c = EXPLAIN_PANEL_UI.states[EXPLAIN_STATE_S3].why;
  assert.ok(c.includes("recorded under these conditions"), "C dropped the conditions scope");
  assert.ok(c.includes("the whole of what it establishes"), "C dropped the extent claim");
  assert.ok(c.includes("left out is a separate question"), "C dropped the omission proposition");

  // D: the card is provisional and it is a pointer. Both words are load-bearing.
  assert.ok(CHECK_UI.provisional_label.includes("Provisional"), "D dropped provisionality");
  assert.ok(CHECK_UI.provisional_label.includes("a pointer"), "D dropped the pointer register");

  // E: the note still says what a card points at, still says the pointers are
  // provisional, and still hands over the action.
  assert.ok(CHECK_UI.register_note.includes("Each card points at"), "E dropped what a card points at");
  assert.ok(CHECK_UI.register_note.includes("Provisional pointers"), "E dropped provisionality");
  assert.ok(CHECK_UI.register_note.includes("check it against a source"), "E dropped the action");

  // F: the null-result line still names the conditions it holds under — which is what
  // test/reader-empty-states.test.mjs requires of every null-result state — and still
  // states what the run recorded.
  const f = CURES.find((x) => x.key === "F").actual();
  assert.ok(f.includes("under the tested conditions"), "F dropped the conditions scope");
  assert.ok(f.includes("the extent of this inspection"), "F dropped the extent claim");
});
