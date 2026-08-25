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
import { PENDING_SCENARIOS, SCENARIOS, resolvePayloads } from "../scripts/qa/scenarios.mjs";
import { FINDING_CLASSES, normalizeClass } from "../reader-result.js";

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
  // AMENDED — the open takes the door the press came through, so the signature carries a
  // parameter. What it does with the reading position is unchanged.
  const open = block("const openChipLane = (via) => {", "\n  };");
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
  // AMENDED — the steering recenter puts two framed doors on the page where an inspection
  // has run, and the close path still focuses ONE control: the one the person pressed. The
  // ref is therefore seated through doorRefFor rather than written on the element, and the
  // "one door element holds it" invariant becomes a claim about that function.
  assert.match(JSX, /ref=\{doorRefFor\(via\)\}/, "the door carries the ref the close path focuses");
  assert.equal(countOf(JSX, "ref={doorRefFor(via)}"), 1, "one button is written, so one place can hold it");
  assert.equal(countOf(JSX, "ref={chipDoorRef}"), 0, "the ref is seated by the selector, never written on an element");

  // The selector itself: exactly one door can receive it. With a single door it is that
  // door; with two it is the one the recorded entry names, and every other door gets null.
  const selector = block("const doorRefFor = (via) => {", "\n  };");
  assert.match(selector, /if \(!twoDoors\) return chipDoorRef;/, "one door on the page is the door that holds the ref");
  assert.match(selector, /return via === seated \? chipDoorRef : null;/, "at most one of two doors holds it");
  assert.equal(countOf(selector, "chipDoorRef"), 2, "the selector is the only thing that hands out the ref");
});

// The ref follows the press. Focus on close belongs on the control the person opened from,
// and with two framings on the page that is a different element depending on which one they
// chose — so the selector reads the recorded entry, not a fixed door.
test("with two framings on the page, the ref follows the door that was pressed", () => {
  const CHIP_ENTRY_VIA = {
    INSPECTION_REACTIVE: "inspection_reactive",
    INSPECTION_PROACTIVE: "inspection_proactive",
    DIRECT_STANDING: "direct_standing",
  };
  const chipDoorRef = { current: null };
  // The shipped selector, transcribed. Pinned against source above so it cannot drift.
  const doorRefFor = (via, twoDoors, chipEntry) => {
    if (!twoDoors) return chipDoorRef;
    const seated = chipEntry === CHIP_ENTRY_VIA.INSPECTION_PROACTIVE
      ? CHIP_ENTRY_VIA.INSPECTION_PROACTIVE
      : CHIP_ENTRY_VIA.INSPECTION_REACTIVE;
    return via === seated ? chipDoorRef : null;
  };
  const seatedCount = (twoDoors, chipEntry) =>
    [CHIP_ENTRY_VIA.INSPECTION_REACTIVE, CHIP_ENTRY_VIA.INSPECTION_PROACTIVE]
      .filter((via) => doorRefFor(via, twoDoors, chipEntry) === chipDoorRef).length;

  // Whatever was recorded — including nothing yet — exactly one door holds the ref.
  for (const chipEntry of [null, ...Object.values(CHIP_ENTRY_VIA)]) {
    assert.equal(seatedCount(true, chipEntry), 1, `two doors, entry ${chipEntry}: exactly one holds the ref`);
  }
  // And it is the door that was pressed.
  assert.equal(
    doorRefFor(CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, true, CHIP_ENTRY_VIA.INSPECTION_PROACTIVE),
    chipDoorRef,
    "a proactive press returns focus to the proactive door",
  );
  assert.equal(
    doorRefFor(CHIP_ENTRY_VIA.INSPECTION_REACTIVE, true, CHIP_ENTRY_VIA.INSPECTION_REACTIVE),
    chipDoorRef,
    "a reactive press returns focus to the reactive door",
  );
  // Before any press, the first door holds it — which is where a keyboard reaching this
  // block lands anyway, so focus never goes nowhere.
  assert.equal(doorRefFor(CHIP_ENTRY_VIA.INSPECTION_REACTIVE, true, null), chipDoorRef);
  // The standing door is one control and always holds it.
  assert.equal(doorRefFor(CHIP_ENTRY_VIA.DIRECT_STANDING, false, CHIP_ENTRY_VIA.DIRECT_STANDING), chipDoorRef);
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
  // Scoped to the question prop, and deliberately not to the whole mount. The answer does
  // reach the lane now — the lane holds the inspected one and shows it read-only — so a
  // check over every prop would forbid the contract instead of the confusion. What must
  // never happen is the QUESTION arriving as answer content, or a second answer variable
  // being handed over beside the receipt.
  const openedFrom = /openedFrom=\{[^\n]*/.exec(mount)[0];
  for (const forbidden of ["answer", "pastedAnswer", "composeAnswer", "pairedAnswer", "readerResult.answer"]) {
    assert.ok(!openedFrom.includes(forbidden), `the origin reference must not carry ${forbidden}`);
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
  // The note says the text is still here, so it renders off the text. A degraded run
  // carries a question and no receipt, and over one of those the lane holds nothing — the
  // note would be describing an empty box the person is about to type into.
  assert.match(
    origin,
    /\{held \? <p className="wb-chip__origin-note">\{CHIP_UI\.compose\.opened_from_note\}<\/p> : null\}/,
    "the still-here note is gated on there being something held",
  );
  // And the answer body itself is not reproduced here. It is held once, in the field.
  assert.ok(!origin.includes("firstAnswer") && !origin.includes("heldAnswer"), "the origin block is not a second copy of the answer");
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

// ── The governed scenario that photographs the composition ──────────────────
//
// Everything above holds the two fixes at source level. What none of it holds is the
// STATE THEY COMPOSE: a findings-bearing inspection with the lane opened over it, where
// `openedFrom` is non-empty and the origin block and the from-an-inspection return label
// exist at all. `chip-arrival` cannot stand in for it — it arrives through ?start=chips
// with nothing behind it, so `openedFrom` is "" and neither surface mounts.
//
// `chips-from-inspection` is that state. It waits in PENDING_SCENARIOS because a board
// scenario owes a committed baseline and this lane holds every baseline until the founder
// releases them, so these assertions are what hold the scenario meanwhile. They are
// written against whichever registry holds it, so they keep passing unchanged on the day
// it is promoted. The live drive is proven in scripts/qa/pending-scenario-proof.mjs.

const composed = () => {
  const s = PENDING_SCENARIOS["chips-from-inspection"] || SCENARIOS["chips-from-inspection"];
  assert.ok(s, "chips-from-inspection is in neither registry");
  return s;
};

test("the scenario composes the state through the shipped door, over a real findings result", () => {
  const s = composed();
  const steps = JSON.stringify(s.steps);

  // A real inspection first: the source boxes are filled and submitted, and the drive
  // waits on a rendered finding rather than on the response.
  assert.match(steps, /"fill":"\.wb-reader-v2__field--answer textarea"/, "a real answer is pasted");
  assert.match(steps, /"fill":"\.wb-reader-v2__reveal textarea"/, "and a real question");
  assert.match(steps, /"click":"button\.wb-reader-cta"/, "and it is actually run");
  assert.match(steps, /"waitFor":"\.wb-measure__list li\.wb-measure__finding"/, "and findings rendered before the door is touched");

  // Then the door — the shipped control, pressed, not a query parameter.
  assert.match(steps, /"click":"\.wb-chip-door"/, "the lane is opened by pressing the door");
  assert.ok(!s.query, "no arrival query; this scenario composes the state rather than arriving at it");

  // The order is the whole point: the door press has to come after the findings.
  assert.ok(
    steps.indexOf('"waitFor":".wb-measure__list li.wb-measure__finding"') < steps.indexOf('"click":".wb-chip-door"'),
    "the door must be pressed over a result, or openedFrom is empty and this is chip-arrival again",
  );
});

test("the scenario reuses the findings fixture the board already carries", () => {
  // No new fixture architecture. The route entry is the same builder object that
  // single-findings declares — identity on the builder, because resolvePayloads returns a
  // fresh payload per call and comparing the results would pass for a copied fixture too.
  assert.equal(
    composed().routes["/api/read"],
    SCENARIOS["single-findings"].routes["/api/read"],
    "chips-from-inspection must drive the existing findings builder, not a fixture of its own",
  );
});

test("the scenario pins the stage, the way back and the origin reference", () => {
  const s = composed();
  const claims = s.assertText || [];

  // Stage is CHIPS and open: the lane's own headline and the sentence over its chip row.
  // Neither string exists in the document until the lane renders.
  assert.ok(claims.includes(CHIP_UI.value_statement.headline), "the lane's headline");
  assert.ok(claims.includes(CHIP_UI.row_header), "the sentence over the chip row");

  // The way back exists, in the form that only exists over an inspection.
  assert.ok(claims.includes(CHIP_UI.compose.return_to_inspection), "the from-an-inspection return label");
  assert.ok(
    !claims.includes(CHIP_UI.compose.return_to_reader),
    "the standing label would pass over an empty lane and prove nothing about this state",
  );

  // The origin reference exists: its label, the question it names, and its note.
  assert.ok(claims.includes(CHIP_UI.compose.opened_from_label), "the origin label");
  assert.ok(claims.includes(CHIP_UI.compose.opened_from_note), "the origin note");
  assert.equal(s.assertSelector, ".wb-chip__origin-question", "and the question element must be visibly painted");

  // The question the fixture asked is the question the origin reference must show.
  const typed = [...s.steps].reverse().find((step) => step.fill === ".wb-reader-v2__reveal textarea");
  assert.ok(typed, "the drive types a question");
  assert.ok(claims.includes(typed.text), "the origin reference must be asserted to carry that same question");
});

test("the scenario pins that the underlying result keeps its findings", () => {
  // The failure this guards is the lane opening over a result that quietly lost content.
  // assertText reads the whole document, so these hold whether or not the result is still
  // inside the photographed window — an assertion about the page, not about the frame.
  const s = composed();
  const read = resolvePayloads(s)["/api/read"];
  const claims = s.assertText || [];

  const findings = read.measurement.findings;
  assert.ok(findings.length >= 2, "the fixture must carry findings for their survival to mean anything");

  // Every mark the fixture produces must be named by an assertion. The label is derived
  // through the product's own alias table, so renaming a signal class breaks this test
  // rather than silently leaving the scenario asserting a string nothing renders.
  for (const f of findings) {
    const label = FINDING_CLASSES[normalizeClass(f.type)];
    assert.ok(label, `the fixture carries an unmappable finding type: ${f.type}`);
    assert.ok(claims.includes(label), `no assertion holds the ${label} mark after the lane opens`);
  }

  // The count line, and the count in it. Findings can survive as rows while the number
  // above them is rewritten, so the asserted count is checked against the fixture.
  const counted = claims.find((c) => /\d+ candidate items? surfaced/.test(c));
  assert.ok(counted, "the count line must be asserted");
  assert.equal(
    Number(counted.match(/(\d+) candidate items? surfaced/)[1]),
    findings.length,
    "the asserted count must be the count the fixture produces",
  );
});

test("no source paste box can be restored into the lane, structurally", () => {
  // The absence a render assertion cannot express. The source boxes live in
  // .wb-reader-v2__field wrappers; the lane's markup contains no such wrapper and the
  // mount point holds nothing but the lane, so there is no place for one to reappear.
  const lane = block("function ChipLane({", "\n}\n");
  assert.ok(!lane.includes("wb-reader-v2__field"), "ChipLane must not render a source field wrapper");
  assert.ok(!lane.includes("wb-reader-v2__reveal"), "nor the reveal wrapper");

  // From the lane's id to the close of the div that carries it. Derived rather than a
  // fixed-width window, which a comment at the mount point can push the element out of.
  const from = JSX.indexOf('id="wb-chip-lane"');
  const inside = JSX.slice(from, JSX.indexOf("</div>", from));
  assert.ok(inside.includes("<ChipLane"), "the mount point holds the lane");
  assert.ok(!inside.includes("wb-reader-v2__field"), "and nothing else that could carry a source box");

  // The lane's own first answer box is a different thing and is supposed to be there.
  // What it must never be is a copy of the QUESTION. That is the rule; the draft's
  // initial value is not.
  //
  // This assertion used to read `useState("")` and so pinned the box empty in every mode,
  // which outlawed the lane referencing the answer its inspection actually ran on. The
  // rule it was reaching for is below, and is about the question.
  assert.ok(
    !lane.includes("setDraftAnswer(openedFrom)") &&
      !lane.includes("useState(openedFrom)") &&
      !/const\s+heldAnswer\s*=\s*[^;]*openedFrom/.test(lane),
    "the lane must never seed an answer from the question it was opened over",
  );
});

// ── The held first answer: referenced, not owned ────────────────────────────
//
// The contract the assertion above used to over-reach on. Steering continues from the
// answer that was actually inspected, so the authoritative first state is
// receipt.open_run.answer and the lane REFERENCES it. An editable second copy could drift
// away from the state the receipt attests to, and then the compare would run over one
// answer while the receipt named another.

test("the lane reads its held first answer off the inspection receipt, and owns only a draft", () => {
  const lane = block("function ChipLane({", "\n}\n");
  // AMENDED — the steering recenter hands the lane one more prop, enteredVia, which records
  // which door was pressed. It is provenance about the entry, not about the held state, and
  // the held-state contract below is unchanged by it.
  assert.match(
    lane,
    /function ChipLane\(\{ headingRef, onReturn, openedFrom, heldReceipt, enteredVia \}\)/,
  );
  assert.match(
    lane,
    /const heldAnswer = \(heldReceipt && heldReceipt\.open_run && heldReceipt\.open_run\.answer\) \|\| "";/,
    "the authoritative first state is the answer on the open run of the receipt",
  );
  assert.match(lane, /const firstAnswer = held \? heldAnswer : draftAnswer;/);
  // The draft is the OTHER mode and still exists: the standing door and ?start=chips open
  // the lane over no inspection, and a degraded run returns no receipt at all.
  assert.match(lane, /const \[draftAnswer, setDraftAnswer\] = useState\(""\);/);
  assert.match(lane, /const held = !!heldAnswer\.trim\(\);/, "held-ness is read off the answer, never the question");
});

test("a held first answer cannot be mutated from inside the lane", () => {
  const lane = block("function ChipLane({", "\n}\n");
  // One setter, and it writes the draft. Nothing in the lane can write heldAnswer.
  assert.equal(countOf(lane, "setDraftAnswer("), 2, "one declaration and one onChange, and no third writer");
  assert.ok(!lane.includes("setHeldAnswer"), "there is no setter for the held answer");
  assert.match(lane, /readOnly=\{held \|\| !!entry\}/, "a held answer is read-only from the moment the lane opens");
  // The control that unlocks a chip-locked box must not offer to unlock a held one.
  assert.match(lane, /\{entry && !held \? \(/, "no edit-the-first-answer door over a held answer");
});

test("the workbench hands the lane the whole receipt, so the answer and its parent agree", () => {
  const mount = block("<ChipLane", "/>");
  assert.match(
    mount,
    /heldReceipt=\{readerResult \? readerResult\.receipt \|\| null : null\}/,
    "the receipt itself, so the held answer and the receipt it continues cannot come from different runs",
  );
  // The question expression is unchanged and still carries no answer.
  const openedFrom = /openedFrom=\{[^\n]*/.exec(mount)[0];
  for (const forbidden of ["answer", "pastedAnswer", "composeAnswer", "pairedAnswer", "readerResult.answer"]) {
    assert.ok(!openedFrom.includes(forbidden), `the origin question must not carry ${forbidden}`);
  }
});

test("the frame is aimed at the head block, so the three surfaces are in it", () => {
  // The captured rectangle is a window, and __qa.scrollToDeterministic CENTRES whatever
  // the focus names. Aiming it at #wb-chip-lane centres a lane taller than the viewport
  // and puts its head above the top edge — measured at 375x812, heading at top -206.
  // Aiming at the head block frames the heading, the way back and the origin reference,
  // which are the three things this scenario exists to photograph.
  assert.equal(composed().focus, "#wb-chip-lane .wb-reader-result__head");
  const lane = block("function ChipLane({", "\n}\n");
  assert.equal(countOf(lane, 'className="wb-reader-result__head"'), 1, "one head block, so the focus is unambiguous");
});

// ── The receipt chain ───────────────────────────────────────────────────────
//
// inspect → steer → compare → receipt has to be one STATED lineage. Before this, the chip
// open receipt recorded nothing about the inspection it continued: its open_run_id is the
// hash of the answer alone, so a chip pair run over an inspected answer was
// indistinguishable from the same text pasted cold. Two artifacts sharing a hash is a
// coincidence; a receipt naming the receipt it continues is evidence.
//
// The behaviour of the reference — that it survives the embed into the paired receipt and
// that its absence changes nothing — is executed end-to-end in test/reader-paired.test.mjs.
// What is pinned here is that the client mints it, and mints it from the held receipt.

test("the chip open receipt records which receipt it continues", () => {
  const fn = block("async function buildChipOpenReceipt(", "\n}\n");
  // AMENDED — the steering recenter adds a fourth argument, the door the lane was entered
  // by. It sits beside continues in open_run and answers a different question: entered_via
  // is where the person came from, continues is what the run continues. A standing-door run
  // over a pasted answer has an entry origin and continues nothing.
  assert.match(
    fn,
    /async function buildChipOpenReceipt\(firstAnswer, generatedAt, parentReceipt, enteredVia\)/,
  );
  assert.match(fn, /continues: parentHash\s*\?/, "the reference is minted from the parent's own content hash");
  assert.match(fn, /content_hash: parentHash,/);
  assert.match(fn, /request_id: \(parentProv && parentProv\.request_id\) \|\| "",/);
  assert.match(fn, /: null,/, "and is an explicit null when the lane continues nothing");

  // Inside open_run, because that is the block the paired and chip-paired envelopes embed
  // verbatim. A top-level sibling would be dropped at that hop and the chain would end at
  // the open receipt.
  const openRun = fn.slice(fn.indexOf("open_run: {"), fn.indexOf("integrity: {"));
  assert.ok(openRun.includes("continues:"), "the reference must sit inside open_run, which travels whole");

  // And it stays out of the idempotency key. That id is the join key already written to
  // the Reader Runs row and owned by value.
  assert.match(fn, /provenance: \{ request_id: answerHex\.slice\(0, 16\) \}/, "the open_run_id is still the answer's own hash");
  assert.ok(!/answerHex[^\n]*parentHash|parentHash[^\n]*answerHex/.test(fn), "the parent must not enter the open_run_id");
});

test("the lane passes the receipt it read the held answer from, and nothing else", () => {
  const lane = block("function ChipLane({", "\n}\n");
  assert.match(
    lane,
    /parentReceipt: held \? heldReceipt : null,/,
    "the parent is the receipt the held answer came from, or an honest null in draft mode",
  );
  const client = block("async function runChipPairedReader(", "\n}\n");
  assert.match(client, /parentReceipt, enteredVia \}\)/, "and the client threads it");
  assert.match(
    client,
    /buildChipOpenReceipt\(firstAnswer, new Date\(\)\.toISOString\(\), parentReceipt, enteredVia\)/,
  );
});

// ── The authored failure that had no way of being seen ──────────────────────
//
// CHIP_UI.compose.first_answer_missing was written, shipped, and unreachable: canCompare is
// false with an empty first answer, so the CTA is disabled, and the only place the string
// was set is inside submit() behind that disabled button. Authored copy nobody can reach is
// dead copy. The server now rejects an open receipt whose answer is empty, and that
// rejection is what the sentence explains.

test("the empty-first-answer rejection reaches the sentence written for it", () => {
  const lane = block("function ChipLane({", "\n}\n");
  assert.match(
    lane,
    /info\.error === "invalid_receipt" && info\.detail === "content_empty"\) \{\s*setFieldError\(CHIP_UI\.compose\.first_answer_missing\);/,
    "the server's own reason for refusing an empty first state must reach the field it is about",
  );
  // The preflight guard stays. It is the courtesy; the server rule is the rule.
  assert.match(lane, /if \(!firstAnswer\.trim\(\)\) \{ setFieldError\(CHIP_UI\.compose\.first_answer_missing\); return; \}/);
  assert.equal(CHIP_UI.compose.first_answer_missing, "Paste the answer or draft you started with.");
  assert.deepEqual(lintChipString(CHIP_UI.compose.first_answer_missing), []);
});

// ── The lane constants this file reasons about ──────────────────────────────

test("the two lanes are the two this file names", () => {
  assert.notEqual(LANE_CHIPS, LANE_INSPECT);
  assert.match(JSX, /setLane\(LANE_CHIPS\)/);
  assert.match(JSX, /setLane\(LANE_INSPECT\)/);
});
