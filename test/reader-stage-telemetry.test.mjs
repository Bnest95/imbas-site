// STAGE_CHANGED semantics.
//
// The event means one thing: an explicit in-product stage advance the person initiated
// through the stage's primary action. It does NOT mean "the stage prop changed", which
// is what a naive implementation would emit and what would make the funnel unreadable —
// browser Back would look like progress, and a remount would look like a second visitor.
//
// So this file does not test stageTransition in isolation. It drives a fake component
// whose transition effect is a line-for-line copy of the one in workbench-app.jsx, and
// pushes it through the sequences a real browser produces: mount, advance, async settle,
// Back, Forward, remount, retry. The count of emitted events is the assertion.
// Run: node --test test/reader-stage-telemetry.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  STAGE_COMPOSE,
  STAGE_INSPECTING,
  STAGE_RESULT,
  STAGE_FOLLOWUP,
  STAGE_COMPARE,
  STAGE_DELTA,
  STAGE_CHIPS,
  CAUSE_ADVANCE,
  CAUSE_INIT,
  CAUSE_POP,
  CAUSE_RESTORE,
  CAUSE_REMOUNT,
  stageTransition,
} from "../reader-stage.js";
import { READER_EVENTS, buildEvent } from "../reader-telemetry.js";

/**
 * A stand-in for ReaderWorkbench's transition effect. `render(stage)` is one React
 * commit. The body between the markers is the same code as workbench-app.jsx — if the
 * component's effect changes, this must change with it or these tests stop meaning
 * anything.
 *
 * `mount()` returns a fresh instance, which is what a remount is: refs start over.
 */
function mountWorkbench(mode = "own") {
  const emitted = [];
  const prevStageRef = { current: null };
  const causeRef = { current: CAUSE_INIT };

  return {
    emitted,
    advance() {
      causeRef.current = CAUSE_ADVANCE;
    },
    // Cause set by something that is not the person's primary action.
    attribute(cause) {
      causeRef.current = cause;
    },
    render(stage) {
      // ── mirrors workbench-app.jsx ──
      const from = prevStageRef.current;
      const cause = causeRef.current;
      causeRef.current = CAUSE_POP;
      prevStageRef.current = stage;
      if (from === null) return; // initial render and remount never emit
      const t = stageTransition(from, stage, cause);
      if (t.emit) {
        emitted.push({ from: t.from, to: t.to, skipped: t.skipped, mode });
      }
      // ── end mirror ──
    },
  };
}

// ── The five cases the semantics have to survive ───────────────────────────────

test("an explicit advance emits exactly one event", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE); // mount
  wb.advance();
  wb.render(STAGE_INSPECTING);
  assert.equal(wb.emitted.length, 1);
  assert.deepEqual(wb.emitted[0], {
    from: STAGE_COMPOSE,
    to: STAGE_INSPECTING,
    skipped: false,
    mode: "own",
  });
});

test("browser Back emits nothing", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  wb.emitted.length = 0;
  // Back: the hash changes, React rerenders, nothing set a cause.
  wb.render(STAGE_COMPOSE);
  assert.equal(wb.emitted.length, 0);
});

test("browser Forward emits nothing", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  wb.render(STAGE_COMPOSE); // Back
  wb.emitted.length = 0;
  wb.render(STAGE_RESULT); // Forward — a forward-ordered move with no advance behind it
  assert.equal(wb.emitted.length, 0, "Forward re-enters a stage the person already counted");
});

test("a remount emits nothing, however deep the stage", () => {
  for (const stage of [STAGE_COMPOSE, STAGE_RESULT, STAGE_DELTA, STAGE_CHIPS]) {
    const wb = mountWorkbench();
    wb.attribute(CAUSE_REMOUNT);
    wb.render(stage);
    assert.equal(wb.emitted.length, 0, `${stage}: a remount is not a person moving`);
  }
});

test("a restore emits nothing", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.attribute(CAUSE_RESTORE);
  wb.render(STAGE_RESULT);
  assert.equal(wb.emitted.length, 0, "being put back where you were is not moving forward");
});

test("a second explicit advance emits exactly one new event", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_INSPECTING);
  wb.advance();
  wb.render(STAGE_RESULT);
  assert.equal(wb.emitted.length, 2);
  assert.deepEqual(wb.emitted.map((e) => `${e.from}->${e.to}`), [
    "compose->inspecting",
    "inspecting->result",
  ]);
});

// ── The cause is consumed, not held ────────────────────────────────────────────

test("one advance cannot pay for two moves", () => {
  // The async settle after a run is a second render the person did not initiate. The
  // cause resets on every commit, so the settle carries CAUSE_POP and emits nothing.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_INSPECTING); // the click
  wb.render(STAGE_RESULT); // the fetch resolving
  assert.equal(wb.emitted.length, 1, "the settle rode in on the click's cause");
  assert.equal(wb.emitted[0].to, STAGE_INSPECTING);
});

test("a retry that stays in the same stage emits nothing", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  wb.emitted.length = 0;
  wb.advance();
  wb.render(STAGE_RESULT); // retry in place: same stage, real advance cause
  assert.equal(wb.emitted.length, 0, "a stage that did not move is not a transition");
});

test("a degraded rerender inside one stage emits nothing", () => {
  // Capacity degradation swaps the Act 2 body for approved copy. The stage is unchanged.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_FOLLOWUP);
  wb.emitted.length = 0;
  wb.render(STAGE_FOLLOWUP);
  wb.render(STAGE_FOLLOWUP);
  assert.equal(wb.emitted.length, 0);
});

test("a backward move under an advance cause still emits nothing", () => {
  // "Edit the answer" clears the result. It is the person's own action, but it is not
  // forward, and the funnel counts forward motion.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  wb.emitted.length = 0;
  wb.advance();
  wb.render(STAGE_COMPOSE);
  assert.equal(wb.emitted.length, 0);
});

// ── Skipping ───────────────────────────────────────────────────────────────────
//
// Skipping is permitted. Two real paths produce it: the direct "Paste what came back"
// door (result → compare), and a fallback result that returns before an inspecting
// frame ever paints (compose → result). One advance still emits exactly one event, and
// from/to record the ACTUAL pair — a synthesized path would invent stage entries that
// no person passed through.

test("a skipped stage emits one event carrying the real pair, not a synthesized path", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_RESULT);
  wb.advance();
  wb.render(STAGE_COMPARE); // straight past followup via the direct door
  assert.equal(wb.emitted.length, 1);
  assert.equal(wb.emitted[0].from, STAGE_RESULT);
  assert.equal(wb.emitted[0].to, STAGE_COMPARE);
  assert.equal(wb.emitted[0].skipped, true);
});

test("a fallback result arriving without an inspecting frame is one event", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  assert.equal(wb.emitted.length, 1);
  assert.equal(wb.emitted[0].skipped, true);
});

// ── The chip lane ──────────────────────────────────────────────────────────────

test("entering the chip lane by choice is one event; leaving it is none", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_CHIPS);
  assert.equal(wb.emitted.length, 1);
  assert.equal(wb.emitted[0].to, STAGE_CHIPS);
  wb.advance();
  wb.render(STAGE_COMPOSE);
  assert.equal(wb.emitted.length, 1, "closing the lane is a return, not progress");
});

test("arriving on ?start=chips emits nothing at all", () => {
  // Known interpretation limit, stated rather than patched: this visitor's first
  // recorded event will be an advance OUT of a stage the funnel never saw them enter.
  // Correct under these semantics — an arrival is not a move. No arrival event is added
  // in this pass.
  const wb = mountWorkbench();
  wb.render(STAGE_CHIPS); // initial render, lane read off the URL
  assert.equal(wb.emitted.length, 0);
});

// ── The wire ───────────────────────────────────────────────────────────────────

test("the event carries stage identifiers and mode, and no content survives", () => {
  const e = buildEvent(
    READER_EVENTS.STAGE_CHANGED,
    {
      from_state: STAGE_RESULT,
      to_state: STAGE_COMPARE,
      mode: "own",
      // Anything a future caller might carelessly pass alongside.
      answer: "the pasted answer",
      question: "the person's question",
    },
    500,
  );
  assert.deepEqual(e, {
    name: "stage_changed",
    ts: 500,
    from_state: "result",
    to_state: "compare",
    mode: "own",
  });
});

test("stage_changed introduces no identity and no content-bearing field", () => {
  const e = buildEvent(READER_EVENTS.STAGE_CHANGED, {
    from_state: STAGE_COMPOSE,
    to_state: STAGE_INSPECTING,
    mode: "guided",
    run: "r-1",
  });
  for (const key of Object.keys(e)) {
    assert.ok(
      ["name", "ts", "from_state", "to_state", "mode", "run"].includes(key),
      `unexpected key on the wire: ${key}`,
    );
  }
});
