// The chip door: what it promises the screen reader, where it sits, and what happens
// to the lane behind it at a narrow width.
// Run: node --test test/chip-door-contract.test.mjs
//
// The stage table already has its own tests — ?start=chips, the deep link, which stages
// withhold the door — and this file does not repeat them. See test/reader-stage.test.mjs.
// What is unpinned is everything between the table and the screen: the door's disclosure
// pair, the id it names, whether closing the lane unmounts it, and whether six follow-up
// choices can be read on a 320px phone without pushing the page sideways.
//
// ── The position, and why it is asserted rather than fixed ───────────────────
// Measured on the governed renderer against the single-findings scenario, with the lane
// closed, which is the state a person meets it in:
//
//   1440x1000   door top 5453 of 6086   89.6%
//    390x844    door top 6763 of 7804   86.7%
//    375x812    door top 6941 of 8063   86.1%
//
// That is late, and the door is already the first node after the result block — the
// depth is the result block's height, not the door's place among its siblings. Moving it
// higher means moving it INSIDE that block, and the two tests at the end of this file are
// why that is not a free change: the lane keeps its draft across a close because it is
// hidden rather than unmounted, and a change of parent unmounts it. So the position is
// recorded here as a measured fact rather than quietly improved, and a future pass that
// moves it will have to move these numbers deliberately.
//
// AMENDED — the pass that moved it. Those numbers are the BEFORE state and stay written
// down, because they are what the change had to answer for. The door now has two mount
// points and one definition. Inside the result block, after the act-2 offer, it renders
// at the FOLLOW-UP stage; below the whole block, where it always rendered, it renders on
// every other stage the table gives it. The reparenting cost the paragraph above warns
// about is not paid: the LANE never moved. It is still the same single mounted node in
// the same place, and the early trigger toggles the same `lane` state the late one does,
// so a half-typed answer still survives a close from either mount point. Nothing was
// added to the stage table — `stageView` is untouched — and the stand-down is written at
// the late mount point alone. See "one definition, two mount points" below.
//
// CORRECTED — which stage the early mount stands on. One pass seated it on STAGE_RESULT,
// reasoning that an act-2 offer moves the stage to FOLLOWUP and so RESULT was the stage
// left holding a buried door. The tree disproved it. `buildAct2` (api/read.js) returns
// null on exactly one condition — `measurement` is null — so STAGE_RESULT is the degraded
// fallback path and nothing else, while every successful read carries an act2 OBJECT and
// derives STAGE_FOLLOWUP even when that object says eligible:false. The numbers at the top
// of this file were measured on `single-findings`, which is a FOLLOWUP page. So the RESULT
// cut moved the door on error and capacity surfaces and left the page it was measured on
// untouched, and it was rejected for exactly that: it paid a reflow cost on the states a
// person reaches when something has already gone wrong. The stage named below is FOLLOWUP,
// and RESULT keeps the late-door behaviour it always had.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  stageView,
  ALL_STAGES,
  STAGE_COMPOSE,
  STAGE_INSPECTING,
  STAGE_RESULT,
  STAGE_FOLLOWUP,
  STAGE_COMPARE,
  STAGE_DELTA,
  STAGE_CHIPS,
} from "../reader-stage.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const JSX = read("workbench-app.jsx");
const WORKBENCH_CSS = read("workbench.css");

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "");

const DOOR_CLASS = 'className="wb-demo-trigger wb-chip-door"';

// The two mount conditions, verbatim. Written once here so a test cannot silently drift
// onto a different stage than the one the file's header explains.
const EARLY_MOUNT = "{stage === STAGE_FOLLOWUP ? chipDoorControl() : null}";
const LATE_MOUNT = "{view.chipDoor && stage !== STAGE_FOLLOWUP ? chipDoorControl() : null}";

const countOf = (haystack, needle) => haystack.split(needle).length - 1;

// The door's JSX, isolated from its opening tag to the closing button, so an assertion
// about "the door" cannot accidentally match some other button on the page. The door is
// written once and mounted twice, so this still resolves to a single element — and the
// assertion below is what keeps that true, because two copies of the markup is exactly
// how the two mount points would start drifting apart.
function doorMarkup() {
  const start = JSX.indexOf(DOOR_CLASS);
  assert.notEqual(start, -1, "workbench-app.jsx must render the door at .wb-demo-trigger.wb-chip-door");
  assert.equal(
    countOf(JSX, DOOR_CLASS),
    1,
    "the door's markup must be written exactly once; a second copy is a second door that can drift from the first",
  );
  const open = JSX.lastIndexOf("<button", start);
  const close = JSX.indexOf("</button>", start);
  assert.ok(open !== -1 && close > open, "the door's button element is not readable");
  return JSX.slice(open, close);
}

const LANE_ID = "wb-chip-lane";

// workbench-app.jsx carries an inline stylesheet as well as the render tree, so a bare
// class name finds the CSS rule long before it finds the element. Landmarks used to prove
// source ORDER must therefore be matched in their JSX form.
function element(className) {
  const at = JSX.indexOf(`className="${className}"`);
  assert.notEqual(at, -1, `workbench-app.jsx must render an element with className="${className}"`);
  return at;
}

// The two mount points, in source order. Both must call the shared control; neither may
// inline markup of its own.
function mountPoints() {
  const calls = [...JSX.matchAll(/^.*chipDoorControl\(\).*$/gm)].map((m) => m[0].trim());
  return calls.filter((line) => !line.startsWith("const chipDoorControl"));
}

test("the door tells assistive technology what it controls, and names the lane by id", () => {
  const door = doorMarkup();
  assert.match(door, /aria-expanded=\{lane === LANE_CHIPS\}/, "aria-expanded must track the live lane state, not a separate flag that can drift from it");
  assert.match(door, new RegExp(`aria-controls="${LANE_ID}"`), `the door must name the lane it opens`);
  assert.match(JSX, new RegExp(`id="${LANE_ID}"`), "the id the door points at must exist on the lane");
});

test("the door's two labels are the plain-language pair, and neither says open or close", () => {
  const door = doorMarkup();
  const labels = [...door.matchAll(/"((?:Show|Hide)[^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(
    labels.sort(),
    ["Hide follow-up checks", "Show follow-up checks"],
    "the lane is hidden rather than unmounted, so Show/Hide describes what happens and Open/Close does not",
  );
});

test("the lane is hidden rather than unmounted, so a half-typed answer survives a close", () => {
  // This is the invariant that fixed the door's position for as long as the door had one
  // mount point, and it is still the invariant. ChipLane holds firstAnswer, secondAnswer
  // and chipResult in its own state, so anything that unmounts it discards a comparison
  // the person already ran.
  assert.match(
    JSX,
    /\{chipMounted \? \(\s*<div\s+id="wb-chip-lane"/,
    "the lane mounts on first open and is not re-gated on the lane being live",
  );
    assert.match(JSX, /hidden=\{!view\.chipLane\}/, "closing the lane must hide it, not unmount it");

  // The lane was NOT reparented to reach the door's earlier position. One mounted lane,
  // one place, and `chipMounted` still latches without ever being set false.
  assert.equal(countOf(JSX, `id="${LANE_ID}"`), 1, "there must be exactly one lane element");
  assert.equal(countOf(JSX, "<ChipLane"), 1, "there must be exactly one ChipLane, mounted once");
  assert.equal(
    countOf(JSX, "setChipMounted(false)"),
    0,
    "nothing may unmount the lane; that is what would throw the draft away",
  );
});

test("both mount points drive the same lane state, so a close from either one keeps the draft", () => {
  // Same handlers, same state. The early trigger is not a second door with a second flag —
  // it is the same control rendered somewhere else, and `lane` remains the only thing
  // either mount toggles.
  const door = doorMarkup();
  assert.match(door, /onClick=\{lane === LANE_CHIPS \? closeChipLane : openChipLane\}/, "one handler pair for both mount points");
  assert.match(JSX, /const closeChipLane = \(\) => setLane\(LANE_INSPECT\);/, "closing only moves the lane back; it clears nothing");
  assert.match(
    JSX,
    /const openChipLane = [\s\S]{0,400}?setChipMounted\(true\)/,
    "opening latches the mount; it does not remount a fresh lane",
  );
  assert.equal(
    countOf(JSX, "setLane(LANE_CHIPS)"),
    1,
    "one place opens the lane; a second would be a second chip state",
  );
});

// ── One definition, two mount points ─────────────────────────────────────────

test("the door is written once and mounted twice, so the two places cannot drift apart", () => {
  doorMarkup(); // asserts the markup appears exactly once
  const mounts = mountPoints();
  assert.equal(mounts.length, 2, "the door must have exactly two mount points: the early one and the late one");
  assert.equal(
    countOf(JSX, "const chipDoorControl"),
    1,
    "one control function; a second is a second door",
  );
});

test("the early mount is inside the result block and stands below the offer the inspection earned", () => {
  // The old position — first node AFTER the result block, at 86-90% of the page — is
  // recorded at the head of this file. This is the mount that answers it. It is placed
  // after the act-2 offer rather than above it: the offer is what the inspection earned,
  // and the door stays secondary to it. The act-2 offer is ON this page, which is the
  // point of choosing this stage: at FOLLOWUP there is a measurement and an earned
  // question above the door, so "secondary" is a thing the reader can actually see.
  const resultBlock = element("wb-reader-v2__result wb-scroll-anchor");
  const act2 = element("wb-reader-v2__follow wb-reader-v2__follow--act2");
  const early = JSX.indexOf(EARLY_MOUNT);
  const postPrivacy = element("wb-reader-v2__post-privacy");
  assert.notEqual(early, -1, "the follow-up stage must mount the door early, inside the result block");
  assert.ok(resultBlock < early, "the early mount must be inside the result block, not above it");
  assert.ok(act2 < early, "the door follows the act-2 offer; it does not outrank it");
  assert.ok(early < postPrivacy, "the early mount must still be inside the block, which the post-privacy line closes");

  // The rejected cut, named so it cannot come back quietly. STAGE_RESULT is the degraded
  // fallback path; moving the door there repositioned error and capacity surfaces. The
  // comments may explain that history — the CODE may not name the stage.
  assert.equal(
    countOf(stripComments(JSX), "STAGE_RESULT"),
    0,
    "the early mount must not be seated on STAGE_RESULT — that is the degraded fallback path",
  );
});

// The per-stage door count, DERIVED rather than asserted as a literal. Both mount
// conditions are read out of the JSX and evaluated against the real stageView for every
// stage, so this catches a mutation that any string match would miss: restoring the late
// door alongside the early one leaves both literals intact and still shows two doors.
function doorCountByStage() {
  assert.notEqual(JSX.indexOf(EARLY_MOUNT), -1, "the early mount must be present to be counted");
  assert.notEqual(JSX.indexOf(LATE_MOUNT), -1, "the late mount must be present to be counted");
  const earlyGate = (stage) => stage === STAGE_FOLLOWUP;
  const lateGate = (stage) => !!stageView(stage).chipDoor && stage !== STAGE_FOLLOWUP;
  // ALL_STAGES, not STAGE_ORDER: the chip stage sits off the funnel spine and STAGE_ORDER
  // leaves it out, which would have silently dropped ?start=chips from this count.
  const counts = {};
  for (const stage of ALL_STAGES) {
    counts[stage] = (earlyGate(stage) ? 1 : 0) + (lateGate(stage) ? 1 : 0);
  }
  return counts;
}

test("every stage shows exactly the doors it should, and no stage shows two", () => {
  // The founder's invariant table. RESULT is back to its prior late-door behaviour;
  // FOLLOWUP has exactly one door and it is the early one; nothing else moved.
  assert.deepEqual(doorCountByStage(), {
    [STAGE_COMPOSE]: 1,
    [STAGE_INSPECTING]: 0,
    [STAGE_RESULT]: 1,
    [STAGE_FOLLOWUP]: 1,
    [STAGE_COMPARE]: 0,
    [STAGE_DELTA]: 1,
    [STAGE_CHIPS]: 1,
  });
  for (const [stage, n] of Object.entries(doorCountByStage())) {
    assert.ok(n <= 1, `${stage} must never offer two competing chip entrances, found ${n}`);
  }
});

test("the late mount stands down on the follow-up stage only, and the stage table is not touched", () => {
  // The door renders on compose, result, follow-up, delta and chips. Only the follow-up
  // stage has an earlier mount, so only the follow-up stage suppresses this one. The gate
  // is written here, at the mount point, and NOT in stageView — reading `view.chipDoor`
  // still gives every stage exactly the value it shipped with.
  const late = JSX.indexOf(LATE_MOUNT);
  assert.notEqual(late, -1, "the late mount must render on view.chipDoor, minus the follow-up stage");

  const postPrivacy = element("wb-reader-v2__post-privacy");
  assert.ok(postPrivacy < late, "the late mount stays where it always was: after the whole result block");

  const lane = JSX.indexOf(`id="${LANE_ID}"`);
  assert.ok(late < lane, "the late door still comes before the lane it opens");

  // The suppression is a mount-point condition, not a stage-machine edit.
  const STAGE = read("reader-stage.js");
  const chipDoorValues = [...STAGE.matchAll(/chipDoor:\s*(true|false)/g)].map((m) => m[1]);
  assert.deepEqual(
    chipDoorValues,
    ["true", "false", "true", "true", "false", "true", "true"],
    "stageView's chipDoor column must be unchanged: compose, inspecting, result, followup, compare, delta, chips",
  );
});

test("the degraded fallback stage keeps the late door it always had", () => {
  // The RESULT-stage cut was rejected: read-error and read-capacity are what a person
  // meets when something has already gone wrong, and the reposition also pushed the
  // retention line out of the mobile capture viewport. RESULT takes the late mount, at
  // the depth it has always had, and the early mount must not name it.
  const counts = doorCountByStage();
  assert.equal(counts[STAGE_RESULT], 1, "the fallback stage still shows one door");
  assert.ok(
    stageView(STAGE_RESULT).chipDoor && STAGE_RESULT !== STAGE_FOLLOWUP,
    "and it is the LATE mount that draws it, exactly as before the chip work",
  );
});

test("?start=chips still opens the lane and still finds a door, because the chip stage is untouched", () => {
  // The arrival path: parseArrival reads the lane once, chipMounted initialises from the
  // same read, and deriveStage returns STAGE_CHIPS before it ever tests hasResult. So a
  // ?start=chips visitor is never on the follow-up stage, never meets the suppression, and
  // reaches the door at the late mount exactly as shipped.
  assert.match(
    JSX,
    /useState\(\(\) => parseArrival\(window\.location\)\.lane\)/,
    "the lane must still read the arrival intent",
  );
  assert.match(
    JSX,
    /useState\(\(\) => parseArrival\(window\.location\)\.lane === LANE_CHIPS\)/,
    "?start=chips must still mount the lane on arrival, with no click needed",
  );
  const STAGE = read("reader-stage.js");
  const laneFirst = STAGE.indexOf("LANE_CHIPS");
  const hasResult = STAGE.indexOf("hasResult");
  assert.ok(laneFirst !== -1 && hasResult !== -1);
  assert.ok(
    laneFirst < hasResult,
    "the chip lane must still be decided before any result test, or ?start=chips could land on the result stage",
  );
});

// ── The lane on a narrow screen ──────────────────────────────────────────────

function ruleBody(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = new RegExp(`(?:^|[,}])\\s*${escaped}\\s*\\{([^}]*)\\}`, "m").exec(stripComments(css));
  assert.ok(m, `workbench.css must carry a rule for ${selector}`);
  return m[1];
}

test("the follow-up choices wrap instead of pushing the page sideways", () => {
  // Measured with the lane open on the governed renderer: six choices, six rows, and
  // document.scrollWidth === clientWidth at 390, 375 and 320.
  const row = ruleBody(WORKBENCH_CSS, ".wb-chip__row");
  assert.match(row, /flex-wrap:\s*wrap/, "the row must wrap; nowrap turns six choices into a horizontal scroller");

  const pick = ruleBody(WORKBENCH_CSS, ".wb-chip__pick");
  assert.match(pick, /max-width:\s*100%/, "a choice may not exceed its row, whatever the flex basis asks for");
  assert.match(pick, /white-space:\s*normal/, "the choices are sentences; nowrap would make each one its own scroller");

  const basis = /flex:\s*1\s+1\s+([\d.]+)rem/.exec(pick);
  assert.ok(basis, ".wb-chip__pick must state its flex basis in rem so this can be checked against a viewport");
  // 320px is the narrowest reflow width the surface supports. The basis is a preferred
  // size and max-width already caps the result, but a basis wider than the screen would
  // mean every choice starts by asking to overflow.
  assert.ok(
    Number(basis[1]) * 16 <= 320,
    `the ${basis[1]}rem basis must fit inside the narrowest supported viewport`,
  );
});

test("the door is a text trigger, so it cannot outrank the offer it sits below", () => {
  // Measured heights on the same run: the door is 32px, the two-question test above it
  // is 427px at 1440 and 683px at 390. The rule below is what keeps that true — the door
  // borrows the demo trigger's treatment and declares no surface of its own.
  const door = doorMarkup();
  assert.match(door, /className="wb-demo-trigger wb-chip-door"/, "the door must stay on the shared text-trigger treatment");
  assert.equal(
    /\.wb-chip-door\s*\{/.test(stripComments(WORKBENCH_CSS)),
    false,
    "a rule of its own is how a secondary door starts competing with the earned action above it",
  );
});
