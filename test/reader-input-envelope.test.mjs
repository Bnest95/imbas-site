// The input envelope: one ceiling, preflighted before submission, and no way back to armed.
//
// THE TWO PRODUCTION DEFECTS THIS FILE HOLDS CLOSED.
//
//   1. THE CLIENT DID NOT KNOW THE LIMIT. The endpoints reject an over-length answer with
//      a fast 400. The compose UI counted words, displayed the count, armed the run
//      button, and let an over-limit answer buy a round trip to learn what was knowable
//      while the person was still typing.
//
//   2. THE RE-ARM LOOP. After that rejection, re-pasting the SAME over-limit answer
//      cleared the error and re-armed the button, because the error was a stored verdict
//      from a past submission and any edit wiped it. The same doomed payload could be
//      sent again, with no warning, indefinitely.
//
// THE FIX BOTH SHARE. The over-limit state is DERIVED from the text in the box on every
// render, not stored from a past attempt. That is why defect 2 cannot come back while
// defect 1 stays fixed: there is no stored flag to clear, so re-pasting identical text
// recomputes identical state. Section 3 proves that by running the derivation twice
// across an error-clearing edit, which is the exact production sequence.
//
// WHY THE DERIVATIONS ARE EXECUTED, NOT PATTERN-MATCHED. Same discipline as
// test/workbench-own-mode-loop.test.mjs: the arming lines are lifted out of
// workbench-app.jsx and RUN against fakes, so a rewrite that re-opens either defect in
// different syntax still fails here. Point WORKBENCH_APP_JSX at a pre-fix snapshot
// (`git show master:workbench-app.jsx > /tmp/x.jsx`) to watch sections 2 and 3 fail.
//
// WHY THE DRIFT SECTION EXISTS. The whole point of the shared module is that the button
// and the gate cannot disagree. Section 4 proves the endpoints hold no private ceiling
// and no private counter, and section 5 runs the RETIRED server counter against the
// shared one over the edge cases that separate two whitespace implementations.
//
// Run: node --test test/reader-input-envelope.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  ANSWER_WORD_MAX,
  countAnswerWords,
  isAnswerOverWordMax,
  answerWordState,
  answerOverMaxNotice,
  secondAnswerOverMaxNotice,
  ANSWER_TOO_LONG_MESSAGE,
  SECOND_ANSWER_TOO_LONG_MESSAGE,
} from "../reader-input-envelope.js";

const SRC_PATH =
  process.env.WORKBENCH_APP_JSX ||
  fileURLToPath(new URL("../workbench-app.jsx", import.meta.url));
const SRC = readFileSync(SRC_PATH, "utf8");
const READ_JS = readFileSync(new URL("../api/read.js", import.meta.url), "utf8");
const READ_PAIRED_JS = readFileSync(new URL("../api/read-paired.js", import.meta.url), "utf8");
const BUNDLE = readFileSync(new URL("../workbench.bundle.js", import.meta.url), "utf8");

const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

// The ceiling moves by founder ruling — 1200 to 2500 on 2026-08-15 — so the behavioral
// tests name their fixtures by RELATIONSHIP to it rather than by value. A test that spelled
// the old number would not fail after a raise; it would quietly stop describing the
// boundary and start describing a legal answer. Only section 1's explicit pin and section
// 6's full-string pins state the number, which is exactly where stating it is the point.
const AT_CEILING = ANSWER_WORD_MAX;
const ONE_PAST = ANSWER_WORD_MAX + 1;
const WELL_OVER = ANSWER_WORD_MAX + 425;
const CLEAN = 528; // a real observed run, far under any ceiling this product has had
const TRIMMED = ANSWER_WORD_MAX - 300; // the edit that brings an over-limit answer back

// Lift one `const NAME = <expr>;` derivation out of ONE component and return it as a
// function of the names it reads. Whatever shape the expression takes, it runs.
//
// Scoped by component on purpose: three surfaces compose an answer, and two of them name
// their gate `answerOverMax`. An unscoped match would silently test one surface twice and
// leave the other unguarded.
function bodyOf(component) {
  const start = SRC.indexOf(`function ${component}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${component} — it composes an answer`);
  const end = SRC.indexOf("\n}\n", start);
  return SRC.slice(start, end === -1 ? undefined : end);
}

function derivation(component, name, params) {
  const m = new RegExp(`\\n\\s*const ${name} = ([^;]+);`).exec(bodyOf(component));
  assert.ok(m, `${component} must derive ${name} — it is the arming gate`);
  return new Function(...params, `return (${m[1]});`);
}

// ── 1. The ceiling and its counter ───────────────────────────────────────────

test("the ceiling is stated once and the counter agrees with it", () => {
  assert.equal(ANSWER_WORD_MAX, 2500, "the ceiling stands at 2500 by founder ruling, 2026-08-15");
  assert.equal(countAnswerWords(words(AT_CEILING)), AT_CEILING);
  assert.equal(isAnswerOverWordMax(words(AT_CEILING)), false, "exactly at the ceiling is accepted");
  assert.equal(isAnswerOverWordMax(words(ONE_PAST)), true, "one word past it is not");
  assert.deepEqual(answerWordState(words(WELL_OVER)), { words: WELL_OVER, max: ANSWER_WORD_MAX, over: true });
  assert.deepEqual(answerWordState(words(CLEAN)), { words: CLEAN, max: ANSWER_WORD_MAX, over: false });
});

test("empty and whitespace-only input count as zero, never as over", () => {
  for (const v of ["", "   ", "\n\n\t", null, undefined]) {
    assert.equal(countAnswerWords(v), 0);
    assert.equal(isAnswerOverWordMax(v), false);
  }
});

// ── 2. Defect 1: the CTA cannot arm for a request the server will reject ─────

test("the primary compose CTA does not arm on an over-limit answer", () => {
  const overMax = derivation("ReaderWorkbench", "answerOverMax", ["answer", "answerWordState"]);
  const isReady = derivation("ReaderWorkbench", "isReady", ["hasQuestion", "hasAnswer", "answerOverMax"]);

  const armed = (answer) => isReady(true, !!answer.trim(), overMax(answer, answerWordState));

  assert.equal(armed(words(CLEAN)), true, "a clean answer still arms — the fix is not a blanket block");
  assert.equal(armed(words(AT_CEILING)), true, "exactly at the ceiling still arms; the server accepts it");
  assert.equal(armed(words(WELL_OVER)), false, "an answer well past the ceiling must not arm");
  assert.equal(armed(words(ONE_PAST)), false, "one word past the ceiling must not arm");
});

test("the follow-up lane CTA does not arm on an over-limit second answer", () => {
  const overMax = derivation("PairedTest", "answerOverMax", ["targeted", "answerWordState"]);
  assert.equal(overMax(words(CLEAN), answerWordState), false);
  assert.equal(overMax(words(WELL_OVER), answerWordState), true);

  // The button's own disabled/armed expressions, lifted from the JSX it renders.
  const body = bodyOf("PairedTest");
  assert.match(body, /disabled=\{busy \|\| !hasAnswer \|\| answerOverMax\}/, "the CTA must be disabled while over-limit");
  assert.match(body, /hasAnswer && !answerOverMax && !busy \? " is-armed"/, "and must not present as armed");
});

test("the chip lane CTA does not arm on an over-limit second answer", () => {
  const overMax = derivation("ChipLane", "secondAnswerOverMax", ["secondAnswer", "answerWordState"]);
  const canCompare = derivation("ChipLane", "canCompare", [
    "entry", "firstAnswer", "secondAnswer", "secondAnswerOverMax",
  ]);

  const armed = (second) =>
    !!canCompare({ id: "chip" }, words(50), second, overMax(second, answerWordState));

  assert.equal(armed(words(CLEAN)), true);
  assert.equal(armed(words(WELL_OVER)), false);
});

test("the first answer is NOT preflighted — only the second is word-gated at the endpoint", () => {
  // Over-rejecting is its own defect: the open receipt's first answer never meets this
  // ceiling server-side, so refusing it client-side would block input the server accepts.
  const canCompare = derivation("ChipLane", "canCompare", [
    "entry", "firstAnswer", "secondAnswer", "secondAnswerOverMax",
  ]);
  assert.equal(!!canCompare({ id: "chip" }, words(ANSWER_WORD_MAX * 3), words(100), false), true);
});

// ── 3. Defect 2: an invalid payload cannot return to an armed state ──────────

test("re-pasting the identical over-limit answer does not re-arm the CTA", () => {
  const overMax = derivation("ReaderWorkbench", "answerOverMax", ["answer", "answerWordState"]);
  const isReady = derivation("ReaderWorkbench", "isReady", ["hasQuestion", "hasAnswer", "answerOverMax"]);

  const doomed = words(WELL_OVER);

  // The production sequence, in order.
  let errors = {};
  const armed = () => isReady(true, !!doomed.trim(), overMax(doomed, answerWordState));

  assert.equal(armed(), false, "1. over-limit: disarmed before the first submission");

  errors = { answer: ANSWER_TOO_LONG_MESSAGE }; // 2. the server's 400 lands
  assert.equal(armed(), false, "3. still disarmed while the rejection shows");

  // 4. The person re-pastes the SAME text. touchAnswer clears the stored error — this is
  //    the edit that used to re-arm the button.
  errors = { ...errors, answer: "" };
  assert.equal(errors.answer, "", "the stored error really is cleared by the edit");
  assert.equal(armed(), false, "5. and the CTA STAYS disarmed — this is the defect");

  // 6. Only trimming the answer under the ceiling arms it again.
  const trimmed = words(TRIMMED);
  assert.equal(isReady(true, true, overMax(trimmed, answerWordState)), true);
});

test("the over-limit notice is derived from the text, so it survives an error clear", () => {
  // A stored notice could be blanked; a derived one is recomputed from the same text and
  // comes back identical. Same string before and after proves it is not stored.
  const doomed = words(WELL_OVER);
  const before = answerOverMaxNotice(doomed);
  const after = answerOverMaxNotice(doomed);
  assert.equal(before, after);
  assert.match(before, new RegExp(`\\(${WELL_OVER}\\)`));
});

// ── 4. One source of truth: no endpoint keeps a private ceiling or counter ───

test("neither endpoint defines its own word ceiling or its own counter", () => {
  for (const [name, src] of [["api/read.js", READ_JS], ["api/read-paired.js", READ_PAIRED_JS]]) {
    assert.doesNotMatch(src, /const ANSWER_WORD_MAX\s*=/, `${name} must import the ceiling, not restate it`);
    assert.doesNotMatch(src, /const wordCount\s*=/, `${name} must import the counter, not restate it`);
    assert.match(src, /from "\.\.\/reader-input-envelope\.js"/, `${name} must import the shared envelope`);
    assert.match(src, /countAnswerWords\([^)]*\) > ANSWER_WORD_MAX/, `${name} must still enforce the ceiling`);
  }
});

test("no user-facing copy restates the ceiling as prose", () => {
  // The number reached the person through two hard-coded sentences. Both are generated
  // from the constant now, so a change to the ceiling cannot leave the copy behind.
  //
  // Built from the LIVE ceiling, not spelled. Spelling the number is how this assertion
  // dies quietly: after a raise, `/over 1200 words/` matches nothing and passes forever
  // while a fresh hard-coded 2500 sits right where the old one was.
  const asProse = new RegExp(`over ${ANSWER_WORD_MAX} words`);
  const paired = readFileSync(new URL("../reader-paired.js", import.meta.url), "utf8");
  for (const [name, src] of [["workbench-app.jsx", SRC], ["reader-paired.js", paired]]) {
    assert.doesNotMatch(src, asProse, `${name} must not hard-code the ceiling in prose`);
  }
});

test("the client counts with the shared counter, not a second implementation", () => {
  assert.doesNotMatch(
    SRC,
    /function countWords\(text\)[\s\S]{0,120}?split\(/,
    "workbench-app.jsx must not keep its own \\s+ split counter",
  );
  assert.match(SRC, /countAnswerWords/, "it must use the shared counter");
});

// ── 5. The drift the shared counter closes ──────────────────────────────────

test("the shared counter matches the retired server counter on the cases that separate them", () => {
  // The RETIRED implementations, verbatim. If a future edit changes countAnswerWords in a
  // way that moves any of these, the button and the gate have started to disagree.
  const retiredServer = (s) => (String(s).trim().match(/\S+/g) || []).length;
  const retiredClient = (text) => (text || "").trim().split(/\s+/).filter(Boolean).length;

  const corpus = [
    "",
    "   ",
    "one",
    "one two three",
    "tabs\tand\nnewlines\r\nmixed",
    "double  spaced  words",
    "non breaking spaces",
    "trailing space ",
    " leading space",
    "em—dash—joined",
    "hyphen-joined-token",
    "punctuation , . ; standing alone",
    words(AT_CEILING),
    words(ONE_PAST),
  ];

  for (const s of corpus) {
    assert.equal(countAnswerWords(s), retiredServer(s), `server parity broke on ${JSON.stringify(s)}`);
    assert.equal(countAnswerWords(s), retiredClient(s), `client parity broke on ${JSON.stringify(s)}`);
  }
});

// ── 6. Full-string pins ─────────────────────────────────────────────────────

test("the envelope strings are pinned whole, in the module and in the bundle", () => {
  // Spelled out, deliberately: this is the one place the exact sentence a person reads is
  // written down as itself. A raise is expected to move these, and moving them is a copy
  // change that wants founder eyes — which is the whole point of a pin that must be edited
  // by hand rather than one that recomputes and never fails.
  assert.equal(ANSWER_TOO_LONG_MESSAGE, "Answer is over 2500 words. Trim it and re-run.");
  assert.equal(SECOND_ANSWER_TOO_LONG_MESSAGE, "Second answer is over 2500 words. Trim it and re-run.");
  assert.equal(
    answerOverMaxNotice(words(2925)),
    "Answer is over 2500 words (2925). Trim it and re-run.",
  );
  assert.equal(
    secondAnswerOverMaxNotice(words(2925)),
    "Second answer is over 2500 words (2925). Trim it and re-run.",
  );

  // The count in those two pins must describe an answer the server would actually reject.
  // Without this, a raise past 2925 would leave the pins passing while they illustrate the
  // notice with a legal answer — a pin that no longer pins the case it was written for.
  assert.ok(2925 > ANSWER_WORD_MAX, "the pinned example count must sit above the live ceiling");

  // A cure that only holds in source is not a cure: these compile into what ships.
  assert.ok(BUNDLE.includes("Answer is over "), "the rejection sentence must reach the bundle");
  assert.ok(BUNDLE.includes("Second answer is over "), "the second-answer sentence must reach the bundle");
  assert.ok(BUNDLE.includes("Trim it and re-run."), "the action clause must reach the bundle");
});

// The preflight notice and the rejection it predicts are ONE sentence with an optional
// tally. Pinning them separately would let a copy edit move one and leave the other, so
// the relationship is asserted rather than the two strings independently.
test("the preflight notice is the rejection sentence carrying its count", () => {
  for (const [notice, rejection] of [
    [answerOverMaxNotice, ANSWER_TOO_LONG_MESSAGE],
    [secondAnswerOverMaxNotice, SECOND_ANSWER_TOO_LONG_MESSAGE],
  ]) {
    const shown = notice(words(WELL_OVER));
    // Asserted separately: strip-and-compare alone would pass a notice that never set
    // the count in at all, which is the failure the anchored insertion can actually have.
    assert.ok(shown.includes(`(${WELL_OVER})`), "the notice must carry the live count");
    assert.equal(shown.replace(` (${WELL_OVER})`, ""), rejection);
  }
});

// ── 7. The ceiling is opt-in per field ──────────────────────────────────────
// PasteField serves six fields and only two carry content an endpoint word-gates. A
// notice on the others would refuse input the server accepts. This pins the wiring: the
// gated fields name a notice, the ungated ones do not, and PasteField shows nothing
// without one.

test("only the server-gated paste fields opt into the word ceiling", () => {
  const src = bodyOf("PasteField");
  assert.match(
    src,
    /const overMax = !!overMaxNotice && /,
    "PasteField must treat the ceiling as opt-in — an unconditional check over-warns on the ungated fields",
  );

  // Every <PasteField ...> in the file, with the notice it opted into (or none).
  const fields = [...SRC.matchAll(/<PasteField\b([\s\S]*?)\/>/g)].map((m) => {
    const label = /label=\{?([^\n]*)/.exec(m[1]);
    const notice = /overMaxNotice=\{(\w+)\}/.exec(m[1]);
    return { label: label ? label[1].trim() : "", notice: notice ? notice[1] : null };
  });
  assert.equal(fields.length, 6, "six paste fields — update this test if a seventh is added");

  const gated = fields.filter((f) => f.notice);
  assert.equal(gated.length, 4, "four fields carry word-gated content: two open answers and two second answers");
  assert.equal(
    gated.filter((f) => f.notice === "secondAnswerOverMaxNotice").length,
    2,
    "the two second-answer fields must name the second-answer sentence, because that is what their endpoint rejects with",
  );

  // The chip lane's FIRST answer travels inside the client-minted receipt and is not
  // word-gated at the endpoint, so it must not warn. Same for the curated lane, which
  // posts to the candidate endpoint entirely.
  const ungated = fields.filter((f) => !f.notice);
  assert.equal(ungated.length, 2, "the chip lane's first answer and the curated paste are not word-gated");
});
