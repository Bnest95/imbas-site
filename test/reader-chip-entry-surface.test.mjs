// reader-chip-entry-surface — the two things the steering entry has to be able to show.
//
// One: the professional cue. `For professional work →` shipped as a <span>. It had the
// shape of a link, the arrow of a link, and none of the function of one — a person who
// clicked it got nothing, and a person navigating by keyboard could not reach it at all.
// It is now a real anchor, and this file is what keeps it one.
//
// It renders in exactly ONE place: under the proactive door. It also rendered at the end of
// the loop until the founder ruling of 2026-08-25 removed that. Two reasons, both about who
// receives the sentence: a proactive user met it twice in a single loop, and reactive and
// direct-standing users met it terminally having never chosen the framing it speaks for.
// The tests below hold the single placement, so re-adding the second one goes red.
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

test("the cue is an anchor to the advisory page, and nothing is left as a span", () => {
  const anchors = [...JSX.matchAll(/<a className="wb-chip__pro-link[^"]*" href="([^"]*)">/g)].map((m) => m[1]);
  assert.deepEqual(anchors, ["/advisory.html"], "one real anchor, to the advisory page");
  assert.ok(
    !/<span className="wb-chip__pro-link/.test(JSX),
    "no cue label is left as a span, which is what shipped and went nowhere",
  );
  assert.equal(countOf(JSX, "CHIP_UI.professional_cue.link"), 1, "the label is the constant, used once");
  assert.equal(countOf(JSX, "CHIP_UI.professional_cue.line"), 1, "and so is the sentence above it");
});

// The placement contract, founder ruling of 2026-08-25. The cue belongs to the door that
// means it. A reactive or direct-standing user never chose the professional framing, so
// they must not be handed its sentence at the end of a loop they entered another way — and
// a proactive user must not be handed it twice.
test("the cue stands under the proactive door and nowhere else", () => {
  const entry = JSX.indexOf('className="wb-chip__pro-cue wb-chip-entry__cue"');
  assert.ok(entry > 0, "the entry cue stands under the proactive door");
  assert.equal(countOf(JSX, "wb-chip__pro-cue"), 1, "exactly one cue block in the whole surface");
  assert.ok(
    !/<div className="wb-chip__pro-cue">/.test(JSX),
    "the terminal post-comparison cue is gone and must not come back",
  );
  // The entry block is inside the door control, which only renders with the lane closed.
  const doorBlock = JSX.slice(JSX.indexOf('<div className="wb-chip-entry"'), entry + 200);
  assert.match(doorBlock, /CHIP_UI\.entry\.proactive/, "the cue belongs to the proactive door, not to the block");
});

// The terminal surface keeps its boundary block. Removing the cue removed a marketing line,
// not the evidence boundary — those are different sentences doing different work, and the
// ratified boundary copy reaches all three origins regardless of how the lane was entered.
test("removing the cue left the terminal boundary block standing", () => {
  const boundary = JSX.indexOf('<div className="wb-reader-result__trust wb-chip__boundary" role="note">');
  assert.ok(boundary > 0, "the terminal boundary block still renders");
  const block = JSX.slice(boundary, boundary + 400);
  assert.match(block, /\{RECEIPT_BOUNDARY\}/, "the locked Reader boundary sentence, verbatim");
  assert.match(block, /\{CHIP_UI\.boundary\}/, "and the chip lane's user-attribution line beneath it");
  assert.ok(!block.includes("professional_cue"), "with no cue left inside it");
});

test("the cue is keyboard reachable by the app's own focus idiom", () => {
  const anchors = [...JSX.matchAll(/<a className="(wb-chip__pro-link[^"]*)"[^>]*>/g)].map((m) => m[1]);
  assert.equal(anchors.length, 1);
  for (const cls of anchors) {
    assert.ok(cls.includes("wb-focus"), `${cls} carries the shared focus outline`);
  }
  // The outline itself, so the class is not decoration over nothing.
  assert.match(JSX, /\.wb-focus:focus-visible \{ outline: 2px solid \$\{C\.accent\}; outline-offset: 2px; \}/);
});

test("nothing removes the cue anchor from the tab order", () => {
  const cueMarkup = [...JSX.matchAll(/<a className="wb-chip__pro-link[^>]*>/g)].map((m) => m[0]);
  assert.equal(cueMarkup.length, 1);
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
  // Every read of enteredVia inside the lane is classified, and the classification is the
  // guard — not the number. This assertion used to pin a bare count of 2, which the
  // 2026-08-25 founder ruling adding entered_via to the chip_row_rendered and chip_selected
  // emitters would have failed. Bumping the number to 4 would have bought the ruling at the
  // price of the law: any later read at all would then pass so long as two others were
  // removed. So the shape is pinned instead. A read that is not the prop, the run, or an
  // event dimension fails here whatever the total, and that includes any read reaching the
  // row of choices.
  const kinds = lane
    .split("\n")
    .filter((l) => l.includes("enteredVia"))
    .map((l) => {
      const t = l.trim();
      if (t.startsWith("function ChipLane({")) return "prop";
      if (t === "enteredVia,") return "run";
      if (/entered_via: normalizeChipEntryVia\(enteredVia\)/.test(t)) return "event";
      return `unclassified: ${t}`;
    });
  assert.deepEqual(
    kinds,
    ["prop", "event", "event", "run"],
    "the lane takes the door as a prop, reports it as an event dimension twice, and hands it to the server once",
  );
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
