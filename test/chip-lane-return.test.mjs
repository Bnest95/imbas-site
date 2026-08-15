// Opening the chip lane, and getting back out of it.
// Run: node --test test/chip-lane-return.test.mjs
//
// ── The two defects this file pins the fix for ───────────────────────────────
//
// 1. DISORIENTATION ON OPEN. Pressing the door transitions FOLLOWUP → CHIPS, which drops
//    both paste boxes out of the stage. The page above the door collapses by ~1029px and
//    the door travels with it, up past the top of the viewport, while the scroll position
//    holds where it was. The person pressed a control and the control left the screen.
//
//    The focus half had its own mechanism. `stageView(STAGE_CHIPS).focus` is "chip-answer",
//    and the workbench's FOCUS_TARGETS map names only "compose-answer" and "paired-answer",
//    so the CHIPS transition fell through to the fallback — which was `resultHeadingRef`,
//    the top of the region the person had just left. The stage table is not the defect and
//    is not touched: `stageView` still returns "chip-answer" for STAGE_CHIPS, and the
//    fallback is what became stage-aware.
//
// 2. APPARENT CONTEXT LOSS. Both source textareas unmount on the same transition, so the
//    answer the person was reading visibly disappears. The data survives — that was
//    disproven as loss and the persistence is not redesigned here. What is fixed is the
//    appearance: the lane now carries a read-only tie back to the inspection it was opened
//    over, and a way back to it.
//
// ── What is pinned, and why ─────────────────────────────────────────────────
//   the heading is the focus target and the scroll target, and focus does not fight the
//   scroll (preventScroll) · the reading position is read BEFORE the state change, because
//   that is the last moment it is still on the page to read · closing restores it and
//   returns focus to the door, which is the control at that position · the lane is hidden
//   and never unmounted, so a half-typed draft survives · the origin reference carries the
//   question and never the answer body.
//
// These are source-level assertions because that is where the guarantee lives. The suite
// has no browser; the live behaviour is probed in scripts/qa/chip-lane-return.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { stageView, STAGE_CHIPS, LANE_CHIPS, LANE_INSPECT } from "../reader-stage.js";
import { CHIP_UI } from "../reader-paired.js";
import { lintChipString } from "../reader-check-vocab.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const JSX = read("workbench-app.jsx");
const BUNDLE = read("workbench.bundle.js");
const CSS = read("workbench.css");
const SITE_CSS = read("styles.css");

const countOf = (haystack, needle) => haystack.split(needle).length - 1;

// A named declaration's body, from its opening line to the first line that closes at
// column 0 or at the arrow-function's own indentation. Comments are kept: several of the
// assertions below are about what the code does, and stripping them changes no match.
function block(startMarker, endMarker) {
  const start = JSX.indexOf(startMarker);
  assert.notEqual(start, -1, `workbench-app.jsx no longer contains: ${startMarker}`);
  const end = JSX.indexOf(endMarker, start);
  assert.ok(end > start, `could not find the end of: ${startMarker}`);
  return JSX.slice(start, end + endMarker.length);
}

// ── The stage table is untouched ────────────────────────────────────────────

test("the CHIPS stage still asks for the chip answer, and the map still does not name it", () => {
  const view = stageView(STAGE_CHIPS);
  assert.equal(view.focus, "chip-answer");
  assert.equal(view.chipLane, true);
  assert.equal(view.chipDoor, true);
  // The mechanism of the 1029px collapse, stated as a fact of the table rather than as a
  // measurement: the CHIPS stage renders no paste box, so everything above the door goes.
  assert.equal(view.pasteBox, false);

  // The map is the whole of what FOCUS_TARGETS resolves. If a later pass adds
  // "chip-answer" to it, the fallback below stops being the thing that runs on this
  // transition and this file's premise is gone — so the map's keys are pinned.
  const map = block("const FOCUS_TARGETS = {", "\n  };");
  const keys = [...map.matchAll(/^\s+"([a-z-]+)":/gm)].map((m) => m[1]);
  assert.deepEqual(keys, ["compose-answer", "paired-answer"]);
  assert.ok(!keys.includes(view.focus), "the CHIPS focus token is answered by the fallback, not by the map");
});

test("the fallback resolves to the top of the region the person just opened", () => {
  const effect = block("const prev = focusStageRef.current;", "}, [stage]);");
  assert.match(
    effect,
    /const regionTop = stage === STAGE_CHIPS \? chipHeadingRef : resultHeadingRef;/,
    "the fallback must be stage-aware; a single ref sends the CHIPS transition to the region it left",
  );
  assert.match(effect, /FOCUS_TARGETS\[view\.focus\] \|\| regionTop/);
  // Focus must not fight the scroll the lane effect is about to run.
  assert.match(effect, /\.focus\(\{ preventScroll: true \}\)/);
});

// ── Bringing the lane into view ─────────────────────────────────────────────

test("opening scrolls the lane heading in, through the product's own anchor mechanism", () => {
  const effect = block("const prev = laneRef.current;", "}, [lane]);");
  assert.match(effect, /if \(prev === null \|\| prev === lane\) return undefined;/, "the first run is not a transition");
  assert.match(effect, /if \(lane === LANE_CHIPS\)/);
  assert.match(
    effect,
    /scrollWorkbenchAnchor\(chipHeadingRef\.current\)/,
    "the lane must use scrollWorkbenchAnchor — the same mechanism every other stage move uses",
  );
  assert.match(effect, /requestAnimationFrame/, "the scroll runs after the lane has laid out");
  assert.match(effect, /cancelAnimationFrame/, "and is cancelled if the lane state changes again first");

  // scrollWorkbenchAnchor is the header-token mechanism, not a bare scrollIntoView.
  const anchor = block("function scrollWorkbenchAnchor(el, after) {", "\n}");
  assert.match(anchor, /--header-offset/);
  assert.match(anchor, /--scroll-anchor-gap/);
  assert.match(anchor, /behavior: reduced \? "auto" : "smooth"/, "reduced motion is respected on the way in");
});

test("the heading is a real focus target and names the lane's own region", () => {
  const lane = block("function ChipLane({", "\n}\n");
  assert.match(
    lane,
    /<h2 id="wb-chip-heading" className="wb-reader-result__title" ref=\{headingRef\} tabIndex=\{-1\}>/,
    "the heading takes the ref and tabIndex -1; headings are not focusable on their own",
  );
  assert.equal(countOf(lane, 'ref={headingRef}'), 1, "one heading, one focus target");
  assert.match(lane, /aria-labelledby="wb-chip-heading"/, "the region the focus lands in is the region it names");
  assert.match(JSX, /headingRef=\{chipHeadingRef\}/, "the workbench's ref is what the lane receives");
});

// ── Getting back out ────────────────────────────────────────────────────────

test("the reading position is captured before the state change, not after", () => {
  const open = block("const openChipLane = () => {", "\n  };");
  const capture = open.indexOf("laneReturnRef.current = window.scrollY;");
  const setLane = open.indexOf("setLane(LANE_CHIPS)");
  assert.ok(capture !== -1, "the open must record the position it was made from");
  assert.ok(setLane !== -1);
  assert.ok(
    capture < setLane,
    "read scrollY BEFORE setLane — after the transition the paste boxes are gone and the position is not there to read",
  );
  assert.match(open, /if \(lane === LANE_CHIPS\) return;/, "a second press of an open door captures nothing");
});

test("closing restores the position and puts focus on the control at it", () => {
  const effect = block("const prev = laneRef.current;", "}, [lane]);");
  assert.match(effect, /const door = chipDoorRef\.current;/);
  assert.match(
    effect,
    /door\.focus\(\{ preventScroll: true \}\)/,
    "focus goes to the door, not to a control inside a lane that is about to be hidden",
  );
  assert.match(effect, /if \(laneReturnRef\.current === null\) return undefined;/, "no captured position, no scroll");
  assert.match(effect, /laneReturnRef\.current = null;/, "the position is consumed once");
  assert.match(
    effect,
    /window\.scrollTo\(\{ top, behavior: prefersReducedMotion\(\) \? "auto" : "smooth" \}\)/,
    "reduced motion is respected on the way back too",
  );
  assert.match(JSX, /ref=\{chipDoorRef\}/, "the door carries the ref the close path focuses");
  assert.equal(countOf(JSX, "ref={chipDoorRef}"), 1, "one door element holds it");
});

test("the return control is inside the lane, closes it, and is the only one", () => {
  const lane = block("function ChipLane({", "\n}\n");
  assert.match(
    lane,
    /<button type="button" className="wb-demo-trigger wb-chip__return-btn" onClick=\{onReturn\}>/,
    "the way out is a real button on the chip surface",
  );
  assert.equal(countOf(lane, "wb-chip__return-btn"), 1, "one way out");
  assert.match(JSX, /onReturn=\{closeChipLane\}/, "and it closes the lane the door opened");

  // The door and the return control drive the same one piece of state.
  const close = block("const closeChipLane = () => ", "\n");
  assert.match(close, /setLane\(LANE_INSPECT\)/);
  assert.doesNotMatch(close, /setChipMounted/, "closing must not unmount the lane; that is what loses the draft");
  assert.doesNotMatch(close, /setStage|setChipResult|setChipDraft/, "closing changes the lane and nothing else");

  // Keyboard reachable with a visible focus ring. A <button> is in the tab order by
  // definition, and the site's focus ring is declared once, unscoped, so a control that
  // adds no outline rule of its own gets it.
  assert.match(lane, /className="wb-demo-trigger wb-chip__return-btn"/);
  assert.match(SITE_CSS, /:focus-visible \{ outline: 2px solid var\(--ember\)/, "the site-wide focus ring");
  const returnRule = CSS.slice(CSS.indexOf(".wb-chip__return {"), CSS.indexOf(".wb-chip__origin {"));
  assert.doesNotMatch(returnRule, /outline\s*:/, "the return control must not opt out of that ring");
});

test("a half-typed draft survives a close and reopen, because the lane is hidden and never unmounted", () => {
  assert.equal(countOf(JSX, "setChipMounted(false)"), 0, "nothing may unmount the lane once it is up");
  assert.match(JSX, /\{chipMounted \? \(/, "the mount gate is chipMounted");
  assert.match(JSX, /hidden=\{!view\.chipLane\}/, "and the lane state only toggles `hidden`");
  // One mount point, so there is one draft and not two.
  assert.equal(countOf(JSX, "<ChipLane"), 1);
  assert.equal(countOf(JSX, 'id="wb-chip-lane"'), 1);
});

// ── Item 3: the read-only tie back to the inspection ────────────────────────

test("the origin reference carries the question, and never the answer body", () => {
  const mount = block("<ChipLane", "/>");
  assert.match(
    mount,
    /openedFrom=\{readerResult \? \(mode === "guided" \? sel\.openPrompt : question\)\.trim\(\) : ""\}/,
    "the same expression the workbench already reads a question from",
  );
  // The answer is what must not be duplicated onto this surface. None of the variables
  // that hold one appear in the expression.
  for (const forbidden of ["answer", "pastedAnswer", "composeAnswer", "pairedAnswer", "readerResult.answer"]) {
    assert.ok(!mount.includes(forbidden), `the origin reference must not carry ${forbidden}`);
  }
});

test("the origin block renders only over a real inspection, and is read-only", () => {
  const lane = block("function ChipLane({", "\n}\n");
  assert.match(lane, /\{openedFrom \? \(/, "no inspection behind the lane, no origin line");
  const origin = lane.slice(lane.indexOf("{openedFrom ? ("), lane.indexOf(") : null}"));
  assert.match(origin, /className="wb-chip__origin"/);
  assert.doesNotMatch(origin, /<textarea|<input|contentEditable/, "it is a reference, not a second editor");
  assert.doesNotMatch(origin, /onChange|onInput/, "nothing in it is a control");
  assert.match(origin, /\{CHIP_UI\.compose\.opened_from_label\}/);
  assert.match(origin, /\{openedFrom\}/);
  assert.match(origin, /\{CHIP_UI\.compose\.opened_from_note\}/);
});

// ── The strings ─────────────────────────────────────────────────────────────

test("the four new strings are pinned in full and pass the chip lint", () => {
  const strings = {
    return_to_inspection: "Back to your inspection",
    return_to_reader: "Back to the Reader",
    opened_from_label: "Opened from your inspection of",
    opened_from_note: "What you pasted is still here. Going back opens it as you left it.",
  };
  for (const [key, value] of Object.entries(strings)) {
    assert.equal(CHIP_UI.compose[key], value, `CHIP_UI.compose.${key}`);
    assert.deepEqual(lintChipString(value), [], `CHIP_UI.compose.${key} tripped a chip rule`);
  }
});

test("the return label says where it goes, and the two forms exist for the two ways in", () => {
  // The lane opens over an inspection, or from the standing door and ?start=chips with
  // nothing behind it. A single label would name a page the person never ran.
  const lane = block("function ChipLane({", "\n}\n");
  assert.match(
    lane,
    /`← \$\{openedFrom \? CHIP_UI\.compose\.return_to_inspection : CHIP_UI\.compose\.return_to_reader\}`/,
  );
});

test("the note states what happened to the text, not where to look for it", () => {
  const note = CHIP_UI.compose.opened_from_note;
  // "still on this page" would send a person hunting for a paste box that genuinely is
  // not rendered. The note says the text is kept and that going back opens it.
  assert.match(note, /still here/);
  assert.match(note, /Going back opens it/);
  assert.doesNotMatch(note, /\b(?:above|below|on this page|scroll)\b/i);
  // And it promises nothing about a state Imbas has not established.
  assert.doesNotMatch(note, /\b(?:saved|stored|backed up|recovered)\b/i);
});

// ── The shipped bundle carries it ───────────────────────────────────────────

test("the bundle is built from this source", () => {
  for (const needle of [
    "Back to your inspection",
    "Back to the Reader",
    "Opened from your inspection of",
    "What you pasted is still here. Going back opens it as you left it.",
    "wb-chip__return-btn",
    "wb-chip__origin",
  ]) {
    assert.ok(BUNDLE.includes(needle), `workbench.bundle.js is stale: missing ${needle}`);
  }
});

test("the new chip surfaces have styling of their own", () => {
  for (const rule of [".wb-chip__return", ".wb-chip__origin", ".wb-chip__origin-label", ".wb-chip__origin-question", ".wb-chip__origin-note"]) {
    assert.ok(CSS.includes(`${rule} {`) || CSS.includes(`${rule},`), `workbench.css is missing ${rule}`);
  }
});

// ── The lane constants this file reasons about ──────────────────────────────

test("the two lanes are the two this file names", () => {
  assert.notEqual(LANE_CHIPS, LANE_INSPECT);
  assert.match(JSX, /setLane\(LANE_CHIPS\)/);
  assert.match(JSX, /setLane\(LANE_INSPECT\)/);
});
