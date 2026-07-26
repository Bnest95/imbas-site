// STAGE_ENTERED semantics.
//
// The event answers one question: was this stage reached. Once per stage, per RUN
// OCCURRENCE, however it was reached. WHY it was reached is a second and separate
// question, carried as `cause`, and it decides only whether the entry counts as forward
// conversion.
//
// The predecessor fused the two. It gated the emit on a clicked advance, so no stage a
// person does not click into was recorded — whichever stage a settling fetch lands on,
// and STAGE_RESULT above all, which is what deriveStage returns for every run that comes
// back with a read and no follow-up offer. That is the entire degraded population. A
// funnel that cannot see its own middle cannot tell "nobody finished" from "nobody was
// measured".
//
// Deduping per session rather than per occurrence had the same shape of defect one level
// up: a person's second inspection recorded nothing, so the north star counted first
// attempts and went blind to repeat use.
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
  CAUSE_REVERSE,
  PROGRESS_CAUSES,
  countsAsProgress,
  stageEntry,
  startsNewOccurrence,
  deriveStage,
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
  const occurrenceRef = { current: 1 };

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
      if (startsNewOccurrence(from, stage)) {
        occurrenceRef.current += 1;
        enteredRef.current = [];
      }
      const entry = stageEntry(stage, { from, cause, seen: enteredRef.current });
      if (!entry.emit) return;
      enteredRef.current = enteredRef.current.concat(stage);
      emitted.push({
        stage: entry.stage,
        prior_stage: entry.prior_stage,
        cause: entry.cause,
        occurrence: occurrenceRef.current,
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
  wb.render(STAGE_FOLLOWUP);
  wb.advance();
  wb.render(STAGE_COMPARE);
  wb.advance();
  wb.render(STAGE_DELTA);
  const forward = progress(wb.emitted).length;
  const records = wb.emitted.length;

  // Walking back and forth WITHIN the run. Every one of these is unattributed, so each
  // arrives as CAUSE_POP.
  wb.render(STAGE_COMPARE); // Back
  wb.render(STAGE_DELTA); // Forward
  wb.render(STAGE_COMPARE); // Back again
  assert.equal(
    progress(wb.emitted).length,
    forward,
    "walking the same stages again is not new progress",
  );
  assert.equal(wb.emitted.length, records, "and adds no duplicate records either");

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

test("a run that returns a read with no act 2 records entry into result", () => {
  // The population this exists for: every run whose payload carries no follow-up offer,
  // which is where the degraded path lands. The stage is not asserted by hand — it is
  // derived from the payload shape the client actually builds, so if deriveStage ever
  // stopped returning `result` for a no-act2 read, this fails rather than passing on a
  // hardcoded constant.
  const degraded = deriveStage({ busy: false, hasResult: true, hasAct2: false });
  assert.equal(degraded, STAGE_RESULT, "a read with no follow-up offer derives to result");
  assert.equal(
    deriveStage({ busy: false, hasResult: true, hasAct2: true }),
    STAGE_FOLLOWUP,
    "and one with an offer does not, which is why result is its own countable stage",
  );

  const wb = mountWorkbench();
  wb.render(deriveStage({}));
  wb.advance();
  wb.render(deriveStage({ busy: true }));
  wb.cause(CAUSE_DEGRADED);
  wb.render(degraded);

  assert.deepEqual(wb.emitted.map((e) => e.stage), [
    STAGE_COMPOSE,
    STAGE_INSPECTING,
    STAGE_RESULT,
  ]);
  assert.equal(wb.emitted[2].cause, CAUSE_DEGRADED);
  assert.ok(countsAsProgress(CAUSE_DEGRADED), "the person still reached a read");
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

// ── Repeat use ─────────────────────────────────────────────────────────────────

test("two consecutive runs in one session produce two complete entry sequences", () => {
  const wb = mountWorkbench();
  const run = () => {
    wb.advance();
    wb.render(STAGE_INSPECTING);
    wb.cause(CAUSE_ASYNC);
    wb.render(STAGE_FOLLOWUP);
    wb.advance();
    wb.render(STAGE_COMPARE);
    wb.advance();
    wb.render(STAGE_DELTA);
  };

  wb.render(STAGE_COMPOSE); // arrival
  run();
  wb.advance();
  wb.render(STAGE_COMPOSE); // "Edit the answer" — the first run is over
  run();

  const sequence = [STAGE_COMPOSE, STAGE_INSPECTING, STAGE_FOLLOWUP, STAGE_COMPARE, STAGE_DELTA];
  assert.deepEqual(
    wb.emitted.map((e) => e.stage),
    [...sequence, ...sequence],
    "the second inspection is recorded in full, not swallowed as already-seen",
  );
  assert.deepEqual(
    wb.emitted.map((e) => e.occurrence),
    [1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    "and the two are separable, so the funnel counts two runs rather than one long one",
  );
  // Both runs converted. Under session-wide dedupe the second contributed nothing.
  assert.equal(progress(wb.emitted).filter((e) => e.occurrence === 1).length, 4);
  assert.equal(progress(wb.emitted).filter((e) => e.occurrence === 2).length, 4);
});

test("the occurrence boundary is landing back on compose, from anywhere", () => {
  assert.equal(startsNewOccurrence(STAGE_DELTA, STAGE_COMPOSE), true);
  assert.equal(startsNewOccurrence(STAGE_RESULT, STAGE_COMPOSE), true);
  // Leaving the chip lane counts too: treating it as the same run would leave the
  // person's next inspection entirely unrecorded, which is the failure being fixed.
  assert.equal(startsNewOccurrence(STAGE_CHIPS, STAGE_COMPOSE), true);
  // Not a boundary: the first paint, staying put, or any move that is not back to compose.
  assert.equal(startsNewOccurrence(null, STAGE_COMPOSE), false);
  assert.equal(startsNewOccurrence(STAGE_COMPOSE, STAGE_COMPOSE), false);
  assert.equal(startsNewOccurrence(STAGE_COMPOSE, STAGE_INSPECTING), false);
  assert.equal(startsNewOccurrence(STAGE_DELTA, STAGE_CHIPS), false);
});

test("a second visit to the chip lane in the same run is still recorded once", () => {
  // Occurrence resets must not become a loophole that lets any re-entry re-record.
  const wb = mountWorkbench();
  wb.render(STAGE_COMPOSE);
  wb.advance();
  wb.render(STAGE_CHIPS);
  wb.render(STAGE_COMPOSE); // leaving the lane starts run 2
  wb.advance();
  wb.render(STAGE_CHIPS);
  wb.render(STAGE_CHIPS); // and re-rendering inside it adds nothing
  assert.deepEqual(
    wb.emitted.map((e) => [e.stage, e.occurrence]),
    [
      [STAGE_COMPOSE, 1],
      [STAGE_CHIPS, 1],
      [STAGE_COMPOSE, 2],
      [STAGE_CHIPS, 2],
    ],
  );
});

// ── Arrival ────────────────────────────────────────────────────────────────────

test("arriving on ?start=chips records the chip stage it landed on", () => {
  // The known interpretation limit the predecessor carried: its first recorded event was
  // an advance OUT of a stage the funnel never saw anyone enter. The arrival is now a
  // real entry with cause init, which conversion analysis excludes.
  const wb = mountWorkbench();
  wb.render(STAGE_CHIPS);
  assert.deepEqual(wb.emitted, [
    { stage: STAGE_CHIPS, prior_stage: null, cause: CAUSE_INIT, occurrence: 1, mode: "own" },
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
  for (const cause of [
    CAUSE_INIT,
    CAUSE_POP,
    CAUSE_RESTORE,
    CAUSE_REMOUNT,
    CAUSE_REVERSE,
    "normalize",
  ]) {
    assert.equal(countsAsProgress(cause), false, `${cause} must not count`);
  }
});

test("a forward cause that lands on an earlier stage reaches the wire as reverse", () => {
  // The caller can only claim a cause; whether the move is forward depends on where the
  // person already was, which only stageEntry knows. Analysis reads cause alone, so the
  // claim is corrected here or it is never corrected.
  const back = stageEntry(STAGE_COMPOSE, { from: STAGE_DELTA, cause: CAUSE_ADVANCE });
  assert.equal(back.cause, CAUSE_REVERSE);
  assert.equal(back.progress, false);
  assert.equal(back.emit, true, "the stage was still entered, and that record must exist");

  // A cause that already fails the predicate keeps its own name: pop is accurate, and
  // rewriting it would throw away the fact that it was history navigation.
  assert.equal(stageEntry(STAGE_COMPOSE, { from: STAGE_DELTA, cause: CAUSE_POP }).cause, CAUSE_POP);

  // Forward moves are untouched, including into the chip lane, which is deeper in.
  const on = (to, from) => stageEntry(to, { from, cause: CAUSE_ADVANCE }).cause;
  assert.equal(on(STAGE_DELTA, STAGE_COMPARE), CAUSE_ADVANCE);
  assert.equal(on(STAGE_CHIPS, STAGE_COMPOSE), CAUSE_ADVANCE);
  assert.equal(on(STAGE_COMPOSE, null), CAUSE_ADVANCE, "an arrival has nothing to be behind");
});

// ── The wire ───────────────────────────────────────────────────────────────────

test("the event carries stage identifiers, cause and mode, and no content survives", () => {
  const e = buildEvent(
    READER_EVENTS.STAGE_ENTERED,
    {
      stage: STAGE_COMPARE,
      prior_stage: STAGE_RESULT,
      cause: CAUSE_ADVANCE,
      occurrence: 2,
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
    occurrence: 2,
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
    occurrence: 3,
    mode: "guided",
    run: "r-1",
  });
  for (const key of Object.keys(e)) {
    assert.ok(
      ["name", "ts", "stage", "prior_stage", "cause", "occurrence", "mode", "run"].includes(key),
      `unexpected key on the wire: ${key}`,
    );
  }
  // occurrence is a counter, not an identifier. It starts at 1 for every page life, is
  // held only in memory, and says nothing about who the person is or what they typed.
  assert.equal(typeof e.occurrence, "number");
});
