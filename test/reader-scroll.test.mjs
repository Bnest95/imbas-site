// Reader v2 redesign — the one-time result-scroll rule (interaction redesign edit 4):
// the Workbench must auto-scroll to the result exactly ONCE on the transition into a
// result, and never on subsequent same-run rerenders (receipt tap, Act 2 state
// change, async field update). This exercises the pure state machine that decides it.
// Run: node --test test/reader-scroll.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import { initialScrollState, nextResultScroll } from "../reader-scroll.js";

// Drive a sequence of hasResult values through the machine, collecting each scroll
// decision, so a test reads like the real render sequence.
function run(sequence, state = initialScrollState()) {
  const scrolls = [];
  for (const hasResult of sequence) {
    const out = nextResultScroll(state, hasResult);
    state = out.state;
    scrolls.push(out.scroll);
  }
  return { state, scrolls };
}

test("scrolls exactly once on the transition into a result", () => {
  // idle mount (no result) -> result appears
  const { scrolls } = run([false, true]);
  assert.deepEqual(scrolls, [false, true]);
});

test("does not re-scroll on same-run rerenders (receipt tap, Act 2, async field)", () => {
  // result appears, then three same-run rerenders keep hasResult true
  const { scrolls } = run([true, true, true, true]);
  assert.deepEqual(scrolls, [true, false, false, false]);
});

test("re-arms after the result clears, then scrolls once on the next result", () => {
  // run 1 result -> cleared (edit input / switch) -> run 2 result
  const { scrolls } = run([true, false, true]);
  assert.deepEqual(scrolls, [true, false, true]);
});

test("the run() null-then-data sequence yields a single scroll", () => {
  // run() sets null (clear) then data (result); a fresh armed machine sees
  // false (re-arm, no scroll) then true (scroll once).
  const { scrolls } = run([false, true]);
  assert.equal(scrolls.filter(Boolean).length, 1);
});

test("a full multi-run session scrolls once per distinct result, never mid-run", () => {
  // mount, run A (+2 rerenders), edit clears, run B (+1 rerender), edit clears
  const { scrolls } = run([false, true, true, true, false, true, true, false]);
  assert.deepEqual(scrolls, [false, true, false, false, false, true, false, false]);
  assert.equal(scrolls.filter(Boolean).length, 2);
});

test("initialScrollState is armed so the first result scrolls", () => {
  const s = initialScrollState();
  assert.equal(s.armed, true);
  assert.equal(nextResultScroll(s, true).scroll, true);
});

test("tolerates a missing/garbage state by treating it as armed", () => {
  assert.equal(nextResultScroll(undefined, true).scroll, true);
  assert.equal(nextResultScroll({}, true).scroll, true);
  assert.equal(nextResultScroll(null, false).scroll, false);
});
