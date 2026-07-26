// The Workbench stage spine (reader-stage.js).
//
// The production bug this exists to stop: four answer textareas visible on one result
// page at the same time. The fix is not "render fewer boxes" — it is a spine that names
// which stage a person is in and which single input may accept an answer there.
//
// So the central test is EXHAUSTIVE, not a snapshot: it walks every reachable
// combination of the six state flags the Workbench actually holds, derives the stage,
// and asserts the visibility contract on each one. A count of textareas can be gamed by
// deleting a box; these invariants cannot.
// Run: node --test test/reader-stage.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LANE_INSPECT,
  LANE_CHIPS,
  STAGE_COMPOSE,
  STAGE_INSPECTING,
  STAGE_RESULT,
  STAGE_FOLLOWUP,
  STAGE_COMPARE,
  STAGE_DELTA,
  STAGE_CHIPS,
  STAGE_ORDER,
  ALL_STAGES,
  ENTRY_COMPOSE_ANSWER,
  ENTRY_PAIRED_ANSWER,
  ENTRY_CHIP_ANSWER,
  deriveStage,
  stageView,
  isForwardStage,
  parseArrival,
  normalizeArrivalStage,
  stageHash,
} from "../reader-stage.js";

const ENTRIES = [ENTRY_COMPOSE_ANSWER, ENTRY_PAIRED_ANSWER, ENTRY_CHIP_ANSWER];

// Every combination of the flags ReaderWorkbench holds. 2^6 = 64 states, all of which a
// person can be put into by some sequence of real actions plus an async settle.
function everyState() {
  const out = [];
  for (const lane of [LANE_INSPECT, LANE_CHIPS]) {
    for (const busy of [false, true]) {
      for (const hasResult of [false, true]) {
        for (const hasAct2 of [false, true]) {
          for (const followUpOpen of [false, true]) {
            for (const hasDelta of [false, true]) {
              out.push({ lane, busy, hasResult, hasAct2, followUpOpen, hasDelta });
            }
          }
        }
      }
    }
  }
  return out;
}

// ── The invariant ──────────────────────────────────────────────────────────────

test("no reachable state exposes more than one answer-entry input", () => {
  const states = everyState();
  assert.equal(states.length, 64);
  for (const s of states) {
    const stage = deriveStage(s);
    const v = stageView(stage);
    const label = `${JSON.stringify(s)} → ${stage}`;

    // At most one live entry, and it must be one of the three known ids.
    if (v.answerEntry !== null) {
      assert.ok(ENTRIES.includes(v.answerEntry), `${label}: unknown answerEntry ${v.answerEntry}`);
    }

    // The live entry is never also listed as read-only context. A field cannot be both
    // the thing you type into and the thing you are only allowed to look at.
    assert.ok(!v.readOnly.includes(v.answerEntry), `${label}: live entry also marked read-only`);

    // Read-only context carries no duplicates, so nothing is listed twice.
    assert.equal(new Set(v.readOnly).size, v.readOnly.length, `${label}: duplicate read-only entry`);
  }
});

test("the paired input and the chip lane are never live together", () => {
  for (const s of everyState()) {
    const v = stageView(deriveStage(s));
    assert.ok(
      !(v.pairedInput && v.chipLane),
      `${JSON.stringify(s)}: paired input and chip lane both live`,
    );
  }
});

test("a live paired-answer input suppresses the standing composer, its door, and the loop", () => {
  for (const s of everyState()) {
    const v = stageView(deriveStage(s));
    if (v.answerEntry !== ENTRY_PAIRED_ANSWER) continue;
    assert.equal(v.chipLane, false, "chip lane must not render beside a live paired input");
    assert.equal(v.chipDoor, false, "the chip door must not render beside a live paired input");
    assert.equal(v.loop, false, "the restart loop offers a second question to copy; not here");
  }
});

test("the chip answer is live only inside the chip lane", () => {
  for (const s of everyState()) {
    const v = stageView(deriveStage(s));
    if (v.answerEntry === ENTRY_CHIP_ANSWER) assert.equal(v.chipLane, true);
    if (!v.chipLane) assert.notEqual(v.answerEntry, ENTRY_CHIP_ANSWER);
  }
});

test("the compose answer accepts input only at the compose stage", () => {
  for (const s of everyState()) {
    const stage = deriveStage(s);
    const v = stageView(stage);
    if (v.answerEntry === ENTRY_COMPOSE_ANSWER) {
      assert.equal(stage, STAGE_COMPOSE, "only compose may take the compose answer");
    }
  }
});

test("once a result exists the compose answer stays visible as read-only context", () => {
  for (const s of everyState()) {
    const stage = deriveStage(s);
    if (stage === STAGE_COMPOSE || stage === STAGE_CHIPS) continue;
    const v = stageView(stage);
    assert.ok(
      v.readOnly.includes(ENTRY_COMPOSE_ANSWER),
      `${stage}: the person must still be able to see what they submitted`,
    );
  }
});

// ── No dead ends ───────────────────────────────────────────────────────────────

test("every stage names a next action when the metered lane is unavailable", () => {
  for (const stage of ALL_STAGES) {
    const v = stageView(stage);
    assert.equal(typeof v.degradedNextAction, "string");
    assert.ok(v.degradedNextAction.length > 0, `${stage}: degraded state strands the person`);
  }
});

test("every stage names a focus target", () => {
  for (const stage of ALL_STAGES) {
    assert.ok(stageView(stage).focus, `${stage}: nothing to move focus to`);
  }
});

test("an unknown stage falls back to compose rather than rendering nothing", () => {
  assert.deepEqual(stageView("not-a-stage"), stageView(STAGE_COMPOSE));
});

// ── Derivation ─────────────────────────────────────────────────────────────────

test("the stage is derived from what exists, in priority order", () => {
  assert.equal(deriveStage({}), STAGE_COMPOSE);
  assert.equal(deriveStage({ busy: true }), STAGE_INSPECTING);
  assert.equal(deriveStage({ hasResult: true }), STAGE_RESULT);
  assert.equal(deriveStage({ hasResult: true, hasAct2: true }), STAGE_FOLLOWUP);
  assert.equal(deriveStage({ hasResult: true, hasAct2: true, followUpOpen: true }), STAGE_COMPARE);
  assert.equal(deriveStage({ hasResult: true, hasAct2: true, followUpOpen: true, hasDelta: true }), STAGE_DELTA);
  // The chip lane is a lane, not a step: it wins over everything in the inspect lane.
  assert.equal(deriveStage({ lane: LANE_CHIPS, hasResult: true, hasDelta: true }), STAGE_CHIPS);
});

test("a fallback result with no Act 2 offer still reaches a result stage", () => {
  // Capacity degradation returns a result with no act2. That must not read as "no result".
  assert.equal(deriveStage({ hasResult: true, hasAct2: false }), STAGE_RESULT);
  assert.equal(stageView(STAGE_RESULT).result, true);
});

// ── Forward motion ─────────────────────────────────────────────────────────────

test("forward is forward, backward and sideways are not", () => {
  assert.equal(isForwardStage(STAGE_COMPOSE, STAGE_INSPECTING), true);
  assert.equal(isForwardStage(STAGE_RESULT, STAGE_COMPARE), true, "skipping ahead is still forward");
  assert.equal(isForwardStage(STAGE_DELTA, STAGE_RESULT), false);
  assert.equal(isForwardStage(STAGE_RESULT, STAGE_RESULT), false, "a retry in place is not a move");
});

test("entering the chip lane is forward; leaving it is not", () => {
  assert.equal(isForwardStage(STAGE_COMPOSE, STAGE_CHIPS), true);
  assert.equal(isForwardStage(STAGE_DELTA, STAGE_CHIPS), true);
  assert.equal(isForwardStage(STAGE_CHIPS, STAGE_COMPOSE), false);
  assert.equal(isForwardStage(STAGE_CHIPS, STAGE_DELTA), false);
});

test("the inspect lane order has no gaps and no repeats", () => {
  assert.deepEqual(STAGE_ORDER, [
    STAGE_COMPOSE,
    STAGE_INSPECTING,
    STAGE_RESULT,
    STAGE_FOLLOWUP,
    STAGE_COMPARE,
    STAGE_DELTA,
  ]);
  assert.equal(new Set(ALL_STAGES).size, ALL_STAGES.length);
});

// ── Arrival ────────────────────────────────────────────────────────────────────

test("?start=chips opens the chip lane; anything else opens the inspect lane", () => {
  assert.equal(parseArrival({ search: "?start=chips" }).lane, LANE_CHIPS);
  assert.equal(parseArrival({ search: "?start=chips&reader=1" }).lane, LANE_CHIPS);
  assert.equal(parseArrival({ search: "" }).lane, LANE_INSPECT);
  assert.equal(parseArrival({ search: "?start=elsewhere" }).lane, LANE_INSPECT);
});

test("a stage deep link is read only when it names a real stage", () => {
  assert.equal(parseArrival({ hash: "#stage=compare" }).stage, STAGE_COMPARE);
  assert.equal(parseArrival({ hash: "#stage=nonsense" }).stage, null);
  assert.equal(parseArrival({ hash: "#wb-reader-console" }).stage, null);
  assert.equal(parseArrival({}).stage, null);
});

// ── Stale hashes ───────────────────────────────────────────────────────────────
//
// Nothing in this product persists run content, so a hash naming a stage whose data
// does not exist is stale by construction. It normalizes DOWN and the dead entry is
// replaced away, so Back cannot land the person on a hash that resolves nowhere.

test("a stage hash past the available data normalizes down and asks to be rewritten", () => {
  const cold = { lane: LANE_INSPECT, busy: false, hasResult: false };
  const r = normalizeArrivalStage(STAGE_DELTA, cold);
  assert.equal(r.stage, STAGE_COMPOSE, "no run data supports a delta");
  assert.equal(r.rewrite, true, "the dead history entry must be replaced, not pushed past");
  assert.equal(r.reason, "stale-stage-hash");
});

test("a stage hash the data supports is honoured and left alone", () => {
  const warm = { lane: LANE_INSPECT, hasResult: true, hasAct2: true };
  const r = normalizeArrivalStage(STAGE_RESULT, warm);
  assert.equal(r.stage, STAGE_RESULT);
  assert.equal(r.rewrite, false);
});

test("the chip lane needs no prior run, so its deep link is never stale", () => {
  const r = normalizeArrivalStage(STAGE_CHIPS, { lane: LANE_INSPECT, hasResult: false });
  assert.equal(r.stage, STAGE_CHIPS);
  assert.equal(r.rewrite, false);
});

test("no hash and a junk hash both resolve to what the data supports", () => {
  assert.deepEqual(normalizeArrivalStage(null, {}), {
    stage: STAGE_COMPOSE,
    rewrite: false,
    reason: "no-stage-hash",
  });
  assert.equal(normalizeArrivalStage("not-a-stage", {}).stage, STAGE_COMPOSE);
});

test("normalization never invents a stage the data cannot support", () => {
  const cold = { lane: LANE_INSPECT, hasResult: false };
  for (const requested of STAGE_ORDER) {
    const r = normalizeArrivalStage(requested, cold);
    assert.equal(r.stage, STAGE_COMPOSE, `${requested} must not be reconstructed from nothing`);
  }
});

test("compose owns the bare URL so the hash never accumulates an empty stage", () => {
  assert.equal(stageHash(STAGE_COMPOSE), "");
  assert.equal(stageHash(STAGE_COMPARE), "#stage=compare");
  for (const stage of ALL_STAGES) {
    const h = stageHash(stage);
    if (!h) continue;
    assert.equal(parseArrival({ hash: h }).stage, stage, `${stage} must survive a round trip`);
  }
});
