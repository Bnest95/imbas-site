// The capability strip: what it may say, and when each thing it says is allowed on
// the page at all.
// Run: node --test test/result-capability-strip.test.mjs
//
// ── The defect this answers ──────────────────────────────────────────────────
// A finished result runs to roughly seven thousand pixels. Two thousand in, a person
// has read the count and the marks, and nothing on screen tells them that a register,
// a per-mark control, a working copy, a comparison and a follow-up are below. The
// audit measured that as the highest-value fix on the surface: the capabilities were
// built, shipped and unreachable, because reaching them required already knowing they
// were there.
//
// ── Why the proof is split in two ────────────────────────────────────────────
// The strip must never name a section that is not on the page. A dead anchor on a
// zero-findings result would be worse than the silence it replaced: it would promise
// a register to someone whose answer produced none, and send them to the bottom of
// the page to find out.
//
// That guarantee has two halves and they live in different files.
//
//   resultCapabilityLinks (reader-result.js) decides what a state may show. It is a
//   pure function, so the whole per-state table is decidable here without a browser,
//   exhaustively, and the table below is that enumeration.
//
//   The MOUNT GATES (workbench-app.jsx) decide whether that state is the real one.
//   A perfect function fed the wrong booleans still emits a dead link, so the second
//   half of this file reads the source and asserts that each gate handed to the
//   function is the same expression that mounts the section it stands for.
//
// Neither half is worth anything alone, which is why both are here.
//
// ── The strings ──────────────────────────────────────────────────────────────
// Pinned whole rather than by pattern, and written out as literals rather than
// imported and compared to themselves, so a copy edit has to be made twice by the
// same hand in the same commit and a reviewer sees the new words beside the old.
// The labels are noun phrases by ruling. A verb phrase reads as an instruction, and
// an instruction implies the thing is owed — that something on this record wants
// attending to. The strip states where things are; it reports no state.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RESULT_CAPABILITY_UI,
  RESULT_CAPABILITY_ANCHORS,
  resultCapabilityLinks,
} from "../reader-result.js";
import { lintUserFacingStrings, CHIP_BANNED_CONSTRUCTIONS } from "../reader-check-vocab.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const JSX = read("workbench-app.jsx");
const BUNDLE = read("workbench.bundle.js");
const WORKBENCH_CSS = read("workbench.css");
const STYLES_CSS = read("styles.css");

const countOf = (haystack, needle) => haystack.split(needle).length - 1;

// The governed copy, in full.
const HEADING = "Further down this page";
const LABELS = {
  checks: "The full list of what to check",
  triage: "Where you stand on each mark",
  reviewRecord: "A working copy to take with you",
  comparison: "A second answer beside this one",
  followUp: "A follow-up question of your own",
};

// ── The strings ship as written, everywhere they ship ────────────────────────

test("the strip's heading and five labels are pinned whole", () => {
  assert.equal(RESULT_CAPABILITY_UI.heading, HEADING);
  for (const key of Object.keys(LABELS)) {
    assert.equal(RESULT_CAPABILITY_UI[key], LABELS[key], `RESULT_CAPABILITY_UI.${key} changed`);
  }
  // Five labels and a heading, and no sixth string smuggled into the map without a pin.
  assert.deepEqual(
    Object.keys(RESULT_CAPABILITY_UI).sort(),
    ["checks", "comparison", "followUp", "heading", "reviewRecord", "triage"],
  );
});

// The built artifact is what a runner's browser reads, and a checked-in bundle can be
// stale while the source is right.
test("every strip string reaches the shipped bundle exactly once", () => {
  for (const s of [HEADING, ...Object.values(LABELS)]) {
    assert.equal(countOf(BUNDLE, s), 1, `workbench.bundle.js must carry "${s}" exactly once`);
  }
});

test("the strip copy carries no banned construction", () => {
  assert.deepEqual(lintUserFacingStrings(RESULT_CAPABILITY_UI), []);
});

// The rule that encodes "nothing implying Imbas found a problem". It is borrowed from
// the chip lane's list rather than restated, because the sentence it forbids is the
// same sentence in both places and one list is better than two that can drift.
test("no label claims Imbas found, detected or fixed anything on this record", () => {
  const rule = CHIP_BANNED_CONSTRUCTIONS.find((r) => r.id === "chip-imbas-action");
  assert.ok(rule, "the Imbas-action rule must still exist to borrow");
  for (const s of [HEADING, ...Object.values(LABELS)]) {
    assert.doesNotMatch(s, rule.pattern, `"${s}" claims an Imbas action`);
  }
});

// Nothing may report that a capability was already used, or that this record has been
// worked. Both would be state, and the strip does not carry state.
test("no label reports that a capability was already used on this record", () => {
  for (const s of [HEADING, ...Object.values(LABELS)]) {
    assert.doesNotMatch(s, /\b(?:already|again|so far|remaining|still|yet)\b/i, `"${s}" reports progress`);
    assert.doesNotMatch(s, /\b(?:resolved|dismissed|reviewed|completed|done)\b/i, `"${s}" reports a status`);
  }
});

// ── Half one: what a state may show ──────────────────────────────────────────
// Every combination of the three gates, and the exact link list each produces. The
// zero-findings, fallback, degraded and paired states are all rows in this table —
// they differ from a full result in which gates are open and in nothing else.

const linkIds = (available) => resultCapabilityLinks(available).map((l) => l.id);

const EXPECTED = [
  [{ checks: false, comparison: false, followUp: false }, []],
  [{ checks: false, comparison: false, followUp: true }, ["wb-chip-door"]],
  [{ checks: false, comparison: true, followUp: false }, ["wb-act2"]],
  [{ checks: false, comparison: true, followUp: true }, ["wb-act2", "wb-chip-door"]],
  [
    { checks: true, comparison: false, followUp: false },
    ["wb-checks", "wb-checks-list", "wb-review-record--single"],
  ],
  [
    { checks: true, comparison: false, followUp: true },
    ["wb-checks", "wb-checks-list", "wb-review-record--single", "wb-chip-door"],
  ],
  [
    { checks: true, comparison: true, followUp: false },
    ["wb-checks", "wb-checks-list", "wb-review-record--single", "wb-act2"],
  ],
  [
    { checks: true, comparison: true, followUp: true },
    ["wb-checks", "wb-checks-list", "wb-review-record--single", "wb-act2", "wb-chip-door"],
  ],
];

test("every gate combination produces exactly its own link set, and no other", () => {
  assert.equal(EXPECTED.length, 8, "all three gates, both ways, is eight rows");
  for (const [available, ids] of EXPECTED) {
    assert.deepEqual(linkIds(available), ids, `gates ${JSON.stringify(available)}`);
  }
});

// The state a zero-findings result is actually in: measurement present, register
// empty. It must offer the comparison and the follow-up and name no register.
test("a zero-findings result names no register, no triage and no working copy", () => {
  const ids = linkIds({ checks: false, comparison: true, followUp: true });
  for (const dead of ["wb-checks", "wb-checks-list", "wb-review-record--single"]) {
    assert.ok(!ids.includes(dead), `${dead} must not be linked when the register does not mount`);
  }
});

// The three register controls stand or fall together, because they are one panel.
test("the register, the per-mark controls and the working copy share one gate", () => {
  const off = linkIds({ checks: false, comparison: true, followUp: true });
  const on = linkIds({ checks: true, comparison: true, followUp: true });
  assert.equal(on.length - off.length, 3, "opening the register gate adds exactly its three controls");
});

// A forgotten key is the shape a refactor leaves behind, and it must read as absent.
test("a missing or non-boolean gate is treated as not on the page", () => {
  assert.deepEqual(linkIds({}), []);
  assert.deepEqual(linkIds(), []);
  assert.deepEqual(linkIds({ checks: "yes", comparison: 1, followUp: {} }), []);
  assert.deepEqual(linkIds({ checks: undefined, comparison: null, followUp: 0 }), []);
});

test("the links carry the governed label for their own anchor", () => {
  const all = resultCapabilityLinks({ checks: true, comparison: true, followUp: true });
  for (const link of all) {
    const key = Object.keys(RESULT_CAPABILITY_ANCHORS).find((k) => RESULT_CAPABILITY_ANCHORS[k] === link.id);
    assert.ok(key, `${link.id} is not a governed anchor`);
    assert.equal(link.label, LABELS[key]);
  }
});

// ── Half two: the gates are the mount conditions ─────────────────────────────
// Read from the source, because this is the half a pure function cannot prove.

test("the strip is handed the register's own mount expression", () => {
  // The one expression that decides whether the register renders.
  assert.match(JSX, /\{checkRegisterVisible \? \(\s*<div className="wb-reader-v2__follow wb-reader-v2__follow--checks">/);
  // And the same identifier is what opens the strip's register gate.
  assert.match(JSX, /checks: checkRegisterVisible,/);
});

test("the strip is handed the comparison offer's own early return", () => {
  // Act2Offer renders nothing on either half of this test.
  assert.match(JSX, /if \(!act2 \|\| !act2\.eligible\) return null;/);
  assert.match(JSX, /comparison: !!\(readerResult && readerResult\.act2 && readerResult\.act2\.eligible\),/);
});

test("the strip is handed the door's two mount conditions, joined", () => {
  // The door is one control at one of two mount points, and the conditions are
  // complements, so their disjunction is "the door is on the page" exactly.
  assert.match(JSX, /\{stage === STAGE_FOLLOWUP \? chipDoorControl\(\) : null\}/);
  assert.match(JSX, /\{view\.chipDoor && stage !== STAGE_FOLLOWUP \? chipDoorControl\(\) : null\}/);
  assert.match(JSX, /const chipDoorPresent = stage === STAGE_FOLLOWUP \|\| view\.chipDoor;/);
  // And it stands down while the lane is already open, which is copy law rather than
  // a dead-anchor question: the door does render there, as the hide control.
  assert.match(JSX, /followUp: chipDoorPresent && lane !== LANE_CHIPS,/);
});

// ── The anchors exist, once, at a seam that scrolls correctly ────────────────

// The id literals live in one map and the render tree names the map, never the string.
// That is what makes a link and its target one edit apart rather than two.
//
// One id is exempt, and only one: "wb-checks-list" is also the register disclosure's
// aria-controls target, and two older contracts read that reference statically and fail
// on any form they cannot resolve. So it is re-typed once, as CHECKS_LIST_ID, and the
// test below pins the two spellings equal.
const TREE_LITERAL_ALLOWED = new Map([["wb-checks-list", 1]]);

test("every anchor id is written once, in the map, and referenced once from the tree", () => {
  const RESULT_JS = read("reader-result.js");
  for (const id of Object.values(RESULT_CAPABILITY_ANCHORS)) {
    assert.equal(
      countOf(RESULT_JS, `"${id}"`),
      1,
      `id "${id}" must be written once; a second copy is a second target the strip can pick wrongly`,
    );
    assert.equal(
      countOf(JSX, `"${id}"`),
      TREE_LITERAL_ALLOWED.get(id) || 0,
      `the render tree must name the map, not re-type "${id}"`,
    );
  }
  for (const key of Object.keys(RESULT_CAPABILITY_ANCHORS)) {
    assert.equal(
      countOf(JSX, `RESULT_CAPABILITY_ANCHORS.${key}`),
      key === "triage" ? 0 : 1,
      `RESULT_CAPABILITY_ANCHORS.${key} must be placed at exactly one seam`,
    );
  }
});

test("every anchor target carries the scroll-anchor class, so a jump clears the header", () => {
  // The class is the product's existing mechanism and the only one used here.
  assert.match(WORKBENCH_CSS, /\.wb-scroll-anchor \{\s*scroll-margin-top:/);
  const seams = [
    [RESULT_CAPABILITY_ANCHORS.checks, /id=\{RESULT_CAPABILITY_ANCHORS\.checks\}\s*className="wb-reader-result is-agent wb-checks wb-scroll-anchor"/],
    [RESULT_CAPABILITY_ANCHORS.triage, /<ul id=\{CHECKS_LIST_ID\} className="wb-checks__list wb-scroll-anchor">/],
    [RESULT_CAPABILITY_ANCHORS.reviewRecord, /className=\{`wb-checks__export wb-scroll-anchor\$\{/],
    [RESULT_CAPABILITY_ANCHORS.comparison, /id=\{RESULT_CAPABILITY_ANCHORS\.comparison\}\s*className="wb-reader-result is-agent wb-act2 wb-scroll-anchor"/],
    [RESULT_CAPABILITY_ANCHORS.followUp, /id=\{RESULT_CAPABILITY_ANCHORS\.followUp\}\s*className="wb-reader-v2__follow wb-reader-v2__follow--chip-door wb-scroll-anchor"/],
  ];
  for (const [id, re] of seams) {
    assert.match(JSX, re, `the seam for "${id}" must carry .wb-scroll-anchor`);
  }
});

// A paired screen mounts two export blocks. Only the single-mode one is the strip's,
// and an unscoped id would hand the jump to whichever rendered first.
test("the paired export block takes no id, so the strip cannot land on it", () => {
  assert.match(
    JSX,
    /id=\{variant === "single" \? RESULT_CAPABILITY_ANCHORS\.reviewRecord : undefined\}/,
    "only the single-mode export may carry the strip's anchor",
  );
  assert.equal(countOf(JSX, 'variant="paired"') + countOf(JSX, 'variant="single"'), 2, "still exactly two export variants");
});

test("the triage anchor and the register's expand target are the same id", () => {
  // CHECKS_LIST_ID is a literal, not a read off the anchors object, because two older
  // contracts resolve it statically: test/chip-door-contract.test.mjs fails any
  // aria-controls form it cannot read, and test/register-overflow-contract.test.mjs pins
  // this exact declaration. So the two ids are written in two places, and this is the
  // assertion that stops them drifting.
  assert.match(JSX, /const CHECKS_LIST_ID = "wb-checks-list";/);
  assert.equal(RESULT_CAPABILITY_ANCHORS.triage, "wb-checks-list");
});

// ── Placement and form ───────────────────────────────────────────────────────

test("the strip mounts between the hero and the measurement panel, and reorders nothing", () => {
  const hero = JSX.indexOf("<ReaderResultHero result={readerResult} />");
  const strip = JSX.indexOf("<ResultCapabilityStrip links={capabilityLinks} />");
  const measure = JSX.indexOf("<MeasurementPanel\n");
  assert.ok(hero !== -1 && strip !== -1 && measure !== -1, "all three mounts must be readable");
  assert.ok(hero < strip, "the strip follows the count a person came for");
  assert.ok(strip < measure, "the strip precedes the marks, or it is one more thing to scroll past");
});

test("the strip exists only where the hero it follows exists, and only with something to say", () => {
  assert.match(
    JSX,
    /\{readerResult\.measurement && capabilityLinks\.length \? \(/,
    "gated on measurement (the hero's own test) and on a non-empty link list",
  );
});

test("the strip renders plain links, not buttons, and carries no icon", () => {
  const start = JSX.indexOf("function ResultCapabilityStrip");
  const end = JSX.indexOf("\n}", JSX.indexOf("return (", start));
  const body = JSX.slice(start, end);
  assert.match(body, /<a className="wb-capstrip__link" href=\{`#\$\{link\.id\}`\}>/);
  assert.doesNotMatch(body, /<button/, "no buttons: the strip is an index, not a new primary action");
  assert.doesNotMatch(body, /aria-hidden|svg|Icon|→|↓/, "no icons");
  assert.match(body, /if \(!links\.length\) return null;/, "an empty strip renders nothing at all");
});

// Anchors are focusable elements, so the site-wide focus ring is the visible focus.
test("keyboard focus on a strip link is visible", () => {
  assert.match(
    STYLES_CSS,
    /:focus-visible \{ outline: 2px solid var\(--ember\); outline-offset: 3px;/,
    "the site-wide focus ring must still exist; it is what makes the strip's links reachable visibly",
  );
});

// 390 is the governed narrow viewport. Both lists wrap and neither can force a
// minimum width, which is what keeps a long label from pushing the page sideways.
test("the strip wraps at a narrow width instead of scrolling the page sideways", () => {
  const block = WORKBENCH_CSS.slice(WORKBENCH_CSS.indexOf(".wb-capstrip {"), WORKBENCH_CSS.indexOf(".wb-shell--reader-v2 .wb-reader-v2__follow .wb-suggest-module"));
  assert.equal(countOf(block, "flex-wrap: wrap;"), 2, "both the strip and its list must wrap");
  assert.equal(countOf(block, "min-width: 0;"), 2, "neither the list nor an item may hold a floor width");
  assert.match(block, /overflow-wrap: anywhere;/, "a single long label must be able to break");
  assert.doesNotMatch(block, /white-space: nowrap|overflow-x|width: max-content/, "nothing may force a horizontal run");
});

// The strip is secondary. It may not acquire a fill, a border or the accent role,
// any of which would make it a second primary beside the count above it.
test("the strip takes no fill, no border and no accent role", () => {
  const block = WORKBENCH_CSS.slice(WORKBENCH_CSS.indexOf(".wb-capstrip {"), WORKBENCH_CSS.indexOf(".wb-shell--reader-v2 .wb-reader-v2__follow .wb-suggest-module"));
  assert.doesNotMatch(block, /background|border(?!-radius)|box-shadow/, "no card");
  assert.doesNotMatch(block, /var\(--ember/, "the accent belongs to the earned actions, not to an index");
});
