// Honest empty states (PASS 2B-B item 9).
//
// A null result is the state most likely to be misread. Nothing surfaced, so the
// surface has to say what that means, and the failure mode is a line that quietly
// upgrades "this inspection surfaced nothing" into "the answer is fine". Two of the
// shipped lines did exactly that: "It read clean" and "the answer read clean" were
// verdicts on the answer, which is the one claim a null run cannot support.
//
// The gate here is a positive property, not a banned-word list. Every null-result
// empty state must either name the conditions its claim holds under, or state
// outright what it does not establish. A line that does neither is asserting more
// than the run found, whatever words it uses.
//
// Coverage is enumerate-then-close: the inventory below lists every current-run
// empty state, and a second pass extracts every `wb-reader-result__empty` render in
// the component and fails on any the inventory does not name. A new empty state
// cannot ship past this file without being declared.
//
// Source-reading, because workbench-app.jsx is JSX and Node cannot import it. Run:
//   node --test test/reader-empty-states.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CHIP_UI, PAIRED_EMPTY_CLOSE } from "../reader-paired.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const SRC = readFileSync(fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)), "utf8");

// One of these must appear in a null-result empty state: either the conditions the
// claim holds under, or an explicit statement of what the run does not establish.
const HONESTY_MARKERS = [
  /under the tested conditions/,
  /under the conditions you reported/,
  /under the instruction you chose/,
  /not a verdict/,
  /isn't an all-clear/,
  /not a finding that/,
  // "That doesn't mean either answer is complete." The refusal stated as a refusal,
  // which is the shortest honest form of the same property: it names the reading the
  // run does not support instead of naming the conditions it holds under.
  /does(?:n't| not) mean/,
];

// kind "null_result" — the run completed and surfaced nothing. Subject to the marker
// rule above.
// kind "no_output"  — the model returned no text for that section at all. A different
// fact, and stating it plainly is already the honest thing; adding a conditions
// clause would dress up a missing response as a measured result.
const EMPTY_STATES = [
  {
    site: "readerCandidateSummary — the line under the hero count",
    kind: "null_result",
    text: "Reader surfaced no Omission, Framing Drift, or Deflection items here. That records what this inspection found, not a verdict on the answer.",
  },
  {
    site: "MeasurementPanel — the Candidate findings list",
    kind: "null_result",
    text: "No candidate finding surfaced under the tested conditions.",
  },
  {
    site: "PairedDeltaView — the zero-delta side-by-side",
    kind: "null_result",
    text: PAIRED_EMPTY_CLOSE,
    expression: "{PAIRED_EMPTY_CLOSE}",
  },
  {
    site: "ReaderResultBlock — What may be missing",
    kind: "null_result",
    text: "The Reader flagged nothing missing under the tested conditions.",
  },
  {
    site: "ReaderResultBlock — How it was shaped",
    kind: "null_result",
    text: "The Reader recorded no shaping under the tested conditions.",
  },
  {
    site: "chip loop reveal — the empty delta (chip.1.0 copy, single-sourced)",
    kind: "null_result",
    text: CHIP_UI.reveal.empty_delta,
    expression: "{CHIP_UI.reveal.empty_delta}",
  },
  {
    site: "ReaderResultBlock — The read",
    kind: "no_output",
    text: "No read returned.",
  },
];

// The lines this pass retired. Each asserted something about the answer that the run
// did not establish; none may come back anywhere in the component.
const RETIRED = [
  "It read clean.",
  "No candidate findings",
  "the answer read clean",
  "No material gap.",
  "No major gaps flagged",
  "No meaningful shaping detected",
  // Retired by the 2B-B correction: it put the absence on the two answers, and one
  // probe returning nothing is a fact about the probe. PAIRED_EMPTY_CLOSE replaced it.
  "surfaced nothing decision-relevant the first left out",
];

// Grading the answer is the failure; refusing to grade it is the point. "either
// answer is complete" is a verdict on its own and a disclaimer under "not a finding
// that", so the pattern cannot be judged in isolation — each hit is kept only when no
// negator governs it. Any negator in the preceding clause counts, which over-forgives
// a contrived sentence and never over-accuses an honest one.
const GRADE = /\b(?:the |this |either |both )?answers? (?:is|are|was|were) (?:fine|accurate|complete|correct|sound)\b|\bnothing (?:is|was) missing\b/gi;
// Contracted auxiliaries carry no `not` for `\b` to find — "doesn't mean either answer
// is complete" reads as a verdict to a word-boundary match and is the opposite of one.
const NEGATOR =
  /\b(?:not|never|no|isn't|aren't|wasn't|weren't|without|doesn't|don't|didn't|can't|cannot|won't)\b[^.;:]*$/i;

function affirmativeGrades(text) {
  const hits = [];
  for (const m of String(text).matchAll(GRADE)) {
    const clause = text.slice(0, m.index).split(/(?<=[.;:])\s+/).pop() || "";
    if (!NEGATOR.test(clause)) hits.push(m[0]);
  }
  return hits;
}

test("the grading detector reads negation (guarding the guard)", () => {
  assert.deepEqual(affirmativeGrades("The answer is complete."), ["The answer is complete"]);
  assert.deepEqual(affirmativeGrades("Nothing is missing."), ["Nothing is missing"]);
  assert.deepEqual(affirmativeGrades("That is not a finding that either answer is complete."), []);
  assert.deepEqual(affirmativeGrades("That doesn't mean either answer is complete."), []);
  // A negator in an EARLIER sentence must not launder a verdict in a later one.
  assert.deepEqual(affirmativeGrades("This is not a verdict. The answer is complete."), ["The answer is complete"]);
  assert.deepEqual(affirmativeGrades("It doesn't matter. The answer is complete."), ["The answer is complete"]);
});

test("every declared empty state renders verbatim from the component", () => {
  for (const state of EMPTY_STATES) {
    const needle = state.expression || state.text;
    assert.ok(SRC.includes(needle), `${state.site}: not found in workbench-app.jsx`);
  }
});

test("a null-result empty state names its conditions or states what it does not establish", () => {
  for (const state of EMPTY_STATES) {
    if (state.kind !== "null_result") continue;
    assert.ok(
      HONESTY_MARKERS.some((re) => re.test(state.text)),
      `${state.site}: a null result claims nothing about the answer, so the line must scope itself; got:\n  ${state.text}`,
    );
  }
});

test("no empty state pronounces on the answer", () => {
  for (const state of EMPTY_STATES) {
    // "clean" in any form is a verdict on the answer. The negated construction the
    // interpretation panel uses ("not a clean bill of health") lives there, not here:
    // an empty state that has to disclaim the word is better off not using it.
    assert.doesNotMatch(state.text, /\bclean\b/i, `${state.site}: pronounces the answer clean`);
    assert.deepEqual(affirmativeGrades(state.text), [], `${state.site}: grades the answer`);
    assert.deepEqual(lintUserFacingStrings(state.text), [], `${state.site}: AT-5`);
  }
});

test("the retired verdict lines are gone from the component", () => {
  for (const dead of RETIRED) {
    assert.ok(!SRC.includes(dead), `retired empty-state copy is back in workbench-app.jsx: "${dead}"`);
  }
});

test("coverage: every wb-reader-result__empty render in the component is declared here", () => {
  // Capture the child of each <p className="wb-reader-result__empty">…</p>, whether it
  // is a literal or a single expression container.
  const rendered = [...SRC.matchAll(/className="wb-reader-result__empty">([\s\S]*?)<\/p>/g)].map((m) => m[1].trim());
  assert.ok(rendered.length > 0, "the extractor found no empty states — the class or markup changed");

  const declared = new Set(EMPTY_STATES.map((s) => s.expression || s.text));
  for (const found of rendered) {
    assert.ok(
      declared.has(found),
      `an undeclared empty state renders in workbench-app.jsx. Add it to EMPTY_STATES and let the honesty rule judge it:\n  ${found}`,
    );
  }

  // …and the class-bearing entries in the inventory all showed up, so a deleted state
  // does not sit here passing forever as documentation of something that is gone.
  const seen = new Set(rendered);
  for (const state of EMPTY_STATES) {
    if (state.kind === "no_output") continue; // rendered without the class, checked above
    const needle = state.expression || state.text;
    if (!seen.has(needle)) {
      assert.ok(
        SRC.includes(needle),
        `${state.site}: declared here but no longer rendered anywhere in the component`,
      );
    }
  }
});
