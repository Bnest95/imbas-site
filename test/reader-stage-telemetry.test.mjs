// STAGE_ENTERED semantics.
//
// The event answers one question: was this stage reached. Once per stage, per session,
// however it was reached. WHY it was reached is a second and separate question, carried
// as `cause`, and it decides only whether the entry counts as forward conversion.
//
// The predecessor fused the two. It gated the emit on a clicked advance, so the two
// stages nobody clicks into — the result that appears when a fetch settles, and the
// degraded body that arrives instead of a read — were never recorded. A funnel that
// cannot see its own middle cannot tell "nobody finished" from "nobody was measured".
//
// So this file does not test stageEntry in isolation. It drives a fake component whose
// entry effect is a line-for-line copy of the one in workbench-app.jsx, and pushes it
// through the sequences a real browser produces: mount, advance, async settle, degraded
// settle, Back, Forward, remount, retry. The emitted list is the assertion.
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
  CAUSE_ASYNC,
  CAUSE_DEGRADED,
  CAUSE_INIT,
  CAUSE_POP,
  CAUSE_RESTORE,
  CAUSE_REMOUNT,
  PROGRESS_CAUSES,
  countsAsProgress,
  stageEntry,
} from "../reader-stage.js";
import { READER_EVENTS, buildEvent } from "../reader-telemetry.js";

/**
 * A stand-in for ReaderWorkbench's entry effect. `render(stage)` is one React commit.
 * The body between the markers is the same code as workbench-app.jsx — if the
 * component's effect changes, this must change with it or these tests stop meaning
 * anything.
 *
 * `mountWorkbench()` returns a fresh instance, which is what a remount is: refs start
 * over, including the record of which stages were already entered.
 */
function mountWorkbench(mode = "own") {
  const emitted = [];
  const prevStageRef = { current: null };
  const causeRef = { current: CAUSE_INIT };
  const enteredRef = { current: [] };

  return {
    emitted,
    // Every cause but the default is set by the code path that owns it, immediately
    // before the setter that moves the stage.
    cause(next) {
      causeRef.current = next;
    },
    advance() {
      causeRef.current = CAUSE_ADVANCE;
    },
    render(stage) {
      // ── mirrors workbench-app.jsx ──
      const from = prevStageRef.current;
      const cause = causeRef.current;
      causeRef.current = CAUSE_POP;
      prevStageRef.current = stage;
      const entry = stageEntry(stage, { from, cause, seen: enteredRef.current });
      if (!entry.emit) return;
      enteredRef.current = enteredRef.current.concat(stage);
      emitted.push({
        stage: entry.stage,
        prior_stage: entry.prior_stage,
        cause: entry.cause,
        mode,
      });
      // ── end mirror ──
    },
  };
}

// What conversion analysis does downstream, written once so the tests and the product
// cannot drift into two definitions.
const progress = (emitted) => emitted.filter((e) => countsAsProgress(e.cause));

// ── The end-to-end proof ───────────────────────────────────────────────────────

test("one complete run records every stage it reached, exactly once each", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE); // arrival
  wb.advance();
  wb.render(STAGE_INSPECTING); // "Run The Reader"
  wb.cause(CAUSE_ASYNC);
  wb.render(STAGE_FOLLOWUP); // the fetch settles with an eligible act 2
  wb.advance();
  wb.render(STAGE_COMPARE); // "Paste what came back"
  wb.advance();
  wb.render(STAGE_DELTA); // the paired answer lands

  assert.deepEqual(
    wb.emitted.map((e) => e.stage),
    [STAGE_COMPOSE, STAGE_INSPECTING, STAGE_FOLLOWUP, STAGE_COMPARE, STAGE_DELTA],
    "every stage reached appears, in the order reached",
  );
  for (const stage of new Set(wb.emitted.map((e) => e.stage))) {
    assert.equal(
      wb.emitted.filter((e) => e.stage === stage).length,
      1,
      `${stage} must be recorded exactly once`,
    );
  }
  assert.deepEqual(
    wb.emitted.map((e) => e.prior_stage),
    [null, STAGE_COMPOSE, STAGE_INSPECTING, STAGE_FOLLOWUP, STAGE_COMPARE],
    "prior_stage records the actual pair, and is absent on the first entry",
  );
  // The arrival is a real entry and is not progress. Everything after it is.
  assert.equal(wb.emitted[0].cause, CAUSE_INIT);
  assert.deepEqual(progress(wb.emitted).map((e) => e.stage), [
    STAGE_INSPECTING,
    STAGE_FOLLOWUP,
    STAGE_COMPARE,
    STAGE_DELTA,
  ]);
});

test("Back, Forward and remount contribute nothing to forward conversion", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_INSPECTING);
  wb.cause(CAUSE_ASYNC);
  wb.render(STAGE_RESULT);
  const forward = progress(wb.emitted).length;

  wb.render(STAGE_COMPOSE); // Back
  wb.render(STAGE_RESULT); // Forward
  wb.render(STAGE_COMPOSE); // Back again
  assert.equal(
    progress(wb.emitted).length,
    forward,
    "walking the same stages again is not new progress",
  );
  assert.equal(wb.emitted.length, 3, "and adds no duplicate records either");

  // A remount is a new instance. It records where it landed, attributed, and that entry
  // is excluded from conversion.
  const re = mountWorkbench();
  re.cause(CAUSE_REMOUNT);
  re.render(STAGE_RESULT);
  assert.equal(re.emitted.length, 1, "the record that the stage was entered must exist");
  assert.equal(re.emitted[0].cause, CAUSE_REMOUNT);
  assert.equal(progress(re.emitted).length, 0);
});

// ── The hole the rename exists to close ────────────────────────────────────────

test("the result stage is recorded even though nobody clicks into it", () => {
  // The predecessor's failure, stated as a test. One click, two stage moves: the click
  // reaches inspecting, the settle reaches the result. Gating on the click recorded the
  // first and dropped the second.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_INSPECTING);
  wb.cause(CAUSE_ASYNC);
  wb.render(STAGE_RESULT);
  assert.deepEqual(wb.emitted.map((e) => e.stage), [
    STAGE_COMPOSE,
    STAGE_INSPECTING,
    STAGE_RESULT,
  ]);
  assert.equal(wb.emitted[2].cause, CAUSE_ASYNC);
  assert.ok(countsAsProgress(CAUSE_ASYNC), "reaching a result is the middle of the funnel");
});

test("a degraded body is a stage entry with its own cause, not a missing one", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_INSPECTING);
  wb.cause(CAUSE_DEGRADED);
  wb.render(STAGE_RESULT); // a fallback body arrived instead of a read
  assert.equal(wb.emitted[2].cause, CAUSE_DEGRADED);
  assert.ok(
    countsAsProgress(CAUSE_DEGRADED),
    "the person still reached a result; segmenting it is the cause's job, not an omission",
  );
});

test("a fallback arriving without an inspecting frame still records the result", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.cause(CAUSE_DEGRADED);
  wb.render(STAGE_RESULT);
  assert.equal(wb.emitted.length, 2);
  assert.equal(wb.emitted[1].prior_stage, STAGE_COMPOSE, "the actual pair, not a synthesized path");
  assert.ok(stageEntry(STAGE_RESULT, { from: STAGE_COMPOSE }).skipped);
});

// ── Arrival ────────────────────────────────────────────────────────────────────

test("arriving on ?start=chips records the chip stage it landed on", () => {
  // The known interpretation limit the predecessor carried: its first recorded event was
  // an advance OUT of a stage the funnel never saw anyone enter. The arrival is now a
  // real entry with cause init, which conversion analysis excludes.
  const wb = mountWorkbench();
  wb.render(STAGE_CHIPS);
  assert.deepEqual(wb.emitted, [
    { stage: STAGE_CHIPS, prior_stage: null, cause: CAUSE_INIT, mode: "own" },
  ]);
  assert.equal(progress(wb.emitted).length, 0, "an arrival is not a move");
});

test("a restore records where the person was put back, and counts nothing", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.cause(CAUSE_RESTORE);
  wb.render(STAGE_RESULT);
  assert.equal(wb.emitted.length, 2);
  assert.equal(wb.emitted[1].cause, CAUSE_RESTORE);
  assert.equal(progress(wb.emitted).length, 0, "being put back where you were is not moving");
});

// ── The cause is consumed, not held ────────────────────────────────────────────

test("one advance cannot pay for two moves", () => {
  // The cause resets on every commit. An un-attributed settle carries CAUSE_POP, which
  // still records the entry — it just does not count as progress.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_INSPECTING); // the click
  wb.render(STAGE_RESULT); // an unattributed settle
  assert.equal(wb.emitted.length, 3);
  assert.equal(wb.emitted[2].cause, CAUSE_POP);
  assert.deepEqual(progress(wb.emitted).map((e) => e.stage), [STAGE_INSPECTING]);
});

test("a retry that stays in the same stage records nothing", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  const before = wb.emitted.length;
  wb.advance();
  wb.render(STAGE_RESULT); // retry in place
  assert.equal(wb.emitted.length, before, "a stage that did not move was not entered again");
});

test("a degraded rerender inside one stage records nothing", () => {
  // Capacity degradation swaps the Act 2 body for approved copy. The stage is unchanged.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_FOLLOWUP);
  const before = wb.emitted.length;
  wb.cause(CAUSE_DEGRADED);
  wb.render(STAGE_FOLLOWUP);
  wb.render(STAGE_FOLLOWUP);
  assert.equal(wb.emitted.length, before);
});

test("a backward move under an advance cause records no progress", () => {
  // "Edit the answer" clears the result. It is the person's own action, but it is not
  // forward, and the funnel counts forward motion.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_RESULT);
  const forward = progress(wb.emitted).length;
  wb.advance();
  wb.render(STAGE_COMPOSE);
  assert.equal(progress(wb.emitted).length, forward);
});

// ── The chip lane ──────────────────────────────────────────────────────────────

test("entering the chip lane by choice is progress; leaving it is not", () => {
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_CHIPS);
  assert.deepEqual(progress(wb.emitted).map((e) => e.stage), [STAGE_CHIPS]);
  wb.advance();
  wb.render(STAGE_COMPOSE);
  assert.deepEqual(
    progress(wb.emitted).map((e) => e.stage),
    [STAGE_CHIPS],
    "closing the lane is a return, not progress",
  );
});

// ── The predicate ──────────────────────────────────────────────────────────────

test("only the person's own forward causes count as progress", () => {
  assert.deepEqual(PROGRESS_CAUSES, [CAUSE_ADVANCE, CAUSE_ASYNC, CAUSE_DEGRADED]);
  for (const cause of [CAUSE_INIT, CAUSE_POP, CAUSE_RESTORE, CAUSE_REMOUNT, "normalize"]) {
    assert.equal(countsAsProgress(cause), false, `${cause} must not count`);
  }
});

// ── The wire ───────────────────────────────────────────────────────────────────

test("the event carries stage identifiers, cause and mode, and no content survives", () => {
  const e = buildEvent(
    READER_EVENTS.STAGE_ENTERED,
    {
      stage: STAGE_COMPARE,
      prior_stage: STAGE_RESULT,
      cause: CAUSE_ADVANCE,
      mode: "own",
      // Anything a future caller might carelessly pass alongside.
      answer: "the pasted answer",
      question: "the person's question",
    },
    500,
  );
  assert.deepEqual(e, {
    name: "stage_entered",
    ts: 500,
    stage: "compare",
    prior_stage: "result",
    cause: "advance",
    mode: "own",
  });
});

test("the first entry omits prior_stage rather than inventing one", () => {
  const e = buildEvent(READER_EVENTS.STAGE_ENTERED, {
    stage: STAGE_COMPOSE,
    prior_stage: null,
    cause: CAUSE_INIT,
    mode: "guided",
  });
  assert.ok(!("prior_stage" in e));
});

test("stage_entered introduces no identity and no content-bearing field", () => {
  const e = buildEvent(READER_EVENTS.STAGE_ENTERED, {
    stage: STAGE_INSPECTING,
    prior_stage: STAGE_COMPOSE,
    cause: CAUSE_ADVANCE,
    mode: "guided",
    run: "r-1",
  });
  for (const key of Object.keys(e)) {
    assert.ok(
      ["name", "ts", "stage", "prior_stage", "cause", "mode", "run"].includes(key),
      `unexpected key on the wire: ${key}`,
    );
  }
});
