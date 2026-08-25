// reader-chip-entry-surface — the two things the steering entry has to be able to show.
//
// One: the professional cue. `For professional work →` shipped as a <span>. It had the
// shape of a link, the arrow of a link, and none of the function of one — a person who
// clicked it got nothing, and a person navigating by keyboard could not reach it at all.
// It is now a real anchor at both places it appears, and this file is what keeps it one.
//
// Two: the held state. The standing rule adopted in this pass is that EVERY stage claiming
// a state is held must render the state it claims to hold, or point unambiguously at it.
// The delta stage said "what you pasted is still here" over a panel that showed only a
// caption. The answer itself was nowhere on the page. That is the failure this file pins
// shut for the one stage where it was real.
//
// Static contracts over the source: what is rendered, that it is reachable, and that the
// treatment neutralizing the global anchor rule is present. The computed appearance and
// the keyboard walk are measured separately in the pinned renderer.
//
// Run: node --test test/reader-chip-entry-surface.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { CHIP_UI } from "../reader-paired.js";

const JSX = fs.readFileSync(new URL("../workbench-app.jsx", import.meta.url), "utf8");
const CSS = fs.readFileSync(new URL("../workbench.css", import.meta.url), "utf8");
const countOf = (hay, needle) => hay.split(needle).length - 1;

// Every rule for one selector, so a later override cannot be missed by reading only the
// first block.
function rules(selector) {
  const out = [];
  const re = new RegExp(`(^|\\})\\s*\\${selector}\\s*(\\{[^}]*\\})`, "g");
  let m;
  while ((m = re.exec(CSS))) out.push(m[2]);
  return out;
}

// ── The cue is a link ───────────────────────────────────────────────────────

test("the cue's two sentences are the ratified copy", () => {
  assert.equal(CHIP_UI.professional_cue.line, "AI made the draft. Your name still goes on it.");
  assert.equal(CHIP_UI.professional_cue.link, "For professional work →");
});

test("both cues are anchors to the advisory page, and nothing is left as a span", () => {
  const anchors = [...JSX.matchAll(/<a className="wb-chip__pro-link[^"]*" href="([^"]*)">/g)].map((m) => m[1]);
  assert.deepEqual(anchors, ["/advisory.html", "/advisory.html"], "two real anchors, both to the advisory page");
  assert.ok(
    !/<span className="wb-chip__pro-link/.test(JSX),
    "no cue label is left as a span, which is what shipped and went nowhere",
  );
  assert.equal(countOf(JSX, "CHIP_UI.professional_cue.link"), 2, "the label is the constant at both places");
  assert.equal(countOf(JSX, "CHIP_UI.professional_cue.line"), 2, "and so is the sentence above it");
});

// The two never co-occur: the entry cue renders where an inspection has finished and the
// lane is closed, the terminal cue renders inside the lane at the delta. A person sees one
// or the other, never the sentence twice on one screen.
test("the entry cue and the terminal cue are at opposite ends of the loop", () => {
  const entry = JSX.indexOf('className="wb-chip__pro-cue wb-chip-entry__cue"');
  const terminal = JSX.indexOf('<div className="wb-chip__pro-cue">');
  assert.ok(entry > 0, "the entry cue stands under the proactive door");
  assert.ok(terminal > 0, "and the terminal cue stands at the end of the loop");
  assert.notEqual(entry, terminal);
  // The entry block is inside the door control, which only renders with the lane closed.
  const doorBlock = JSX.slice(JSX.indexOf('<div className="wb-chip-entry"'), entry + 200);
  assert.match(doorBlock, /CHIP_UI\.entry\.proactive/, "the cue belongs to the proactive door, not to the block");
});

test("each cue is keyboard reachable by the app's own focus idiom", () => {
  const anchors = [...JSX.matchAll(/<a className="(wb-chip__pro-link[^"]*)"[^>]*>/g)].map((m) => m[1]);
  assert.equal(anchors.length, 2);
  for (const cls of anchors) {
    assert.ok(cls.includes("wb-focus"), `${cls} carries the shared focus outline`);
  }
  // The outline itself, so the class is not decoration over nothing.
  assert.match(JSX, /\.wb-focus:focus-visible \{ outline: 2px solid \$\{C\.accent\}; outline-offset: 2px; \}/);
});

test("nothing removes the cue anchors from the tab order", () => {
  const cueMarkup = [...JSX.matchAll(/<a className="wb-chip__pro-link[^>]*>/g)].map((m) => m[0]);
  assert.equal(cueMarkup.length, 2);
  for (const tag of cueMarkup) {
    for (const forbidden of ["tabIndex", "aria-hidden", "role="]) {
      assert.ok(!tag.includes(forbidden), `an anchor must not carry ${forbidden}`);
    }
  }
});

// The global `a` rule in styles.css gives every anchor a bottom border and padding. The cue
// reads as one sentence with a link at the end, so the rule is neutralized here rather than
// the anchor being downgraded back to a span.
test("the anchor treatment neutralizes the global border rather than the anchor", () => {
  const [link] = rules(".wb-chip__pro-link");
  assert.ok(link, "the link rule exists");
  assert.match(link, /border-bottom: 0;/);
  assert.match(link, /padding-bottom: 0;/);
  assert.match(link, /text-decoration: underline;/, "the link still reads as a link");
  assert.match(link, /text-underline-offset: 2px;/);
  // The colour is the one that shipped on the span, so the appearance is preserved.
  assert.match(link, /color: rgba\(200, 168, 150, 0\.95\);/);
});

// ── The entry framings ──────────────────────────────────────────────────────

test("the two framings are the ratified copy, under one heading", () => {
  assert.equal(CHIP_UI.entry.reactive, "Something's off.");
  assert.equal(CHIP_UI.entry.proactive, "Make it better.");
  assert.equal(CHIP_UI.entry.heading, "Steer the next answer");
});

test("the entry group is labelled by its own heading", () => {
  const block = JSX.slice(
    JSX.indexOf('<div className="wb-chip-entry"'),
    JSX.indexOf('<div className="wb-chip-entry"') + 1200,
  );
  assert.match(block, /role="group" aria-labelledby="wb-chip-entry-heading"/);
  assert.match(block, /id="wb-chip-entry-heading"/, "and the id it names is rendered in the same block");
  assert.equal(countOf(JSX, 'id="wb-chip-entry-heading"'), 1, "one heading, so the reference is unambiguous");
});

// One bank behind both doors. The framing is the entry, not a partition of the chips: the
// lane renders SECOND_QUESTION_BANK whole, and enteredVia reaches the receipt without ever
// reaching the row of choices.
test("neither framing changes which chips are offered", () => {
  const lane = JSX.slice(JSX.indexOf("function ChipLane({"), JSX.indexOf("function ChipLane({") + 30000);
  const row = lane.slice(lane.indexOf("SECOND_QUESTION_BANK.map("), lane.indexOf("SECOND_QUESTION_BANK.map(") + 900);
  assert.ok(row.length > 100, "the lane maps the bank to render the choices");
  assert.ok(!row.includes("enteredVia"), "the door must not filter, order, or gate the row");
  assert.ok(!/SECOND_QUESTION_BANK\.filter\(/.test(JSX), "and nothing anywhere renders a subset of the bank");
  // enteredVia is read in exactly one place inside the lane: the run it hands to the server.
  assert.equal(countOf(lane, "enteredVia"), 2, "once in the props, once in the run — never in the render");
});

// ── The held state is shown, not merely claimed ─────────────────────────────

test("the delta stage renders the first answer it says it is holding", () => {
  const lane = JSX.slice(JSX.indexOf("function ChipLane({"), JSX.indexOf("function ChipLane({") + 30000);
  const held = lane.indexOf('<details className="wb-chip__held">');
  assert.ok(held > 0, "the held first answer has a disclosure of its own at the delta");
  const block = lane.slice(held - 400, held + 500);
  assert.match(block, /\{firstAnswer\.trim\(\) \? \(/, "rendered only when there is a state to show");
  assert.match(block, /\{CHIP_UI\.compose\.first_answer_label\}/, "labelled in the same plain words as the compose step");
  assert.match(block, /\{firstAnswer\}/, "and the answer itself is in the DOM, not a caption about it");
});

test("the shown held state is the one the run was made on", () => {
  const lane = JSX.slice(JSX.indexOf("function ChipLane({"), JSX.indexOf("function ChipLane({") + 30000);
  // firstAnswer is the single derived value: the held answer off the receipt when there is
  // one, the draft otherwise. Showing anything else would be showing a state the receipt
  // does not attest to.
  assert.match(lane, /const firstAnswer = held \? heldAnswer : draftAnswer;/);
  assert.ok(!lane.includes("wb-chip__held-body\">{heldAnswer}"), "the panel shows firstAnswer, not a second source");
  assert.ok(!lane.includes("wb-chip__held-body\">{draftAnswer}"), "and not the draft directly");
});

test("the shown held state is read-only", () => {
  // A <details><p> is not an input. The only editable first-answer control in the lane is
  // the compose textarea, and it is read-only the moment the answer is held.
  const lane = JSX.slice(JSX.indexOf("function ChipLane({"), JSX.indexOf("function ChipLane({") + 30000);
  const held = lane.indexOf('<details className="wb-chip__held">');
  const block = lane.slice(held, held + 500);
  for (const editable of ["<textarea", "<input", "contentEditable", "onChange"]) {
    assert.ok(!block.includes(editable), `the held panel must not carry ${editable}`);
  }
  assert.match(lane, /readOnly=\{held \|\| !!entry\}/, "and the compose box is read-only over a held answer");
});

test("the held panel is styled without introducing a control affordance", () => {
  const [summary] = rules(".wb-chip__held-summary");
  const [body] = rules(".wb-chip__held-body");
  assert.ok(summary && body, "both rules exist");
  assert.match(summary, /list-style: none;/, "no default disclosure marker");
  assert.match(body, /white-space: pre-wrap;/, "the answer keeps the shape it was pasted in");
  assert.match(body, /overflow-wrap: anywhere;/, "and a long unbroken paste cannot overflow the panel");
});
