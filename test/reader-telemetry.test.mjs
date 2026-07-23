import { test } from "node:test";
import assert from "node:assert/strict";
import {
  READER_EVENTS,
  READER_EVENT_NAMES,
  sanitizeEventProps,
  buildEvent,
  buildFunnel,
} from "../reader-telemetry.js";

// ── Content-minimal by construction ───────────────────────────────────────────

test("sanitizeEventProps keeps only allowlisted scalar props", () => {
  const out = sanitizeEventProps({
    run: "r-123",
    state: "gap_revealed",
    check: "quick",
    mode: "own",
    gap: 3,
    eligible: true,
    idempotent: false,
    source: "agent",
  });
  assert.deepEqual(out, {
    run: "r-123",
    state: "gap_revealed",
    check: "quick",
    mode: "own",
    gap: 3,
    eligible: true,
    idempotent: false,
    source: "agent",
  });
});

test("sanitizeEventProps drops any content-bearing or unknown key", () => {
  const out = sanitizeEventProps({
    answer: "the whole pasted answer text",
    question: "the user's question",
    point: "a measured omission",
    email: "a@b.com",
    state: "still_missing",
  });
  assert.deepEqual(out, { state: "still_missing" }); // only the allowlisted enum survives
});

test("sanitizeEventProps caps string length so an id cannot smuggle a payload", () => {
  const long = "x".repeat(500);
  const out = sanitizeEventProps({ run: long });
  assert.equal(out.run.length, 64);
});

test("sanitizeEventProps drops non-finite numbers, objects, and arrays", () => {
  const out = sanitizeEventProps({ gap: Infinity, state: { nested: 1 }, run: ["a"] });
  assert.deepEqual(out, {});
});

// ── Event building ────────────────────────────────────────────────────────────

test("buildEvent rejects an unknown name and stamps a known one", () => {
  assert.equal(buildEvent("not_a_real_event", {}), null);
  const e = buildEvent(READER_EVENTS.LOOP_COMPLETED, { state: "gap_revealed", answer: "leak" }, 1000);
  assert.deepEqual(e, { name: "loop_completed", ts: 1000, state: "gap_revealed" });
});

test("every event name is covered by the exported list", () => {
  assert.equal(READER_EVENT_NAMES.length, 15);
  assert.ok(READER_EVENT_NAMES.includes("target_question_copied"));
  assert.ok(READER_EVENT_NAMES.includes("loop_completed"));
  // User-chip lane events (design: item 3 telemetry, user-chip follow-up).
  assert.ok(READER_EVENT_NAMES.includes("chip_instruction_copied"));
  assert.ok(READER_EVENT_NAMES.includes("chip_pair_completed"));
});

// ── Funnel + north star ───────────────────────────────────────────────────────

test("buildFunnel north star is null with no baseline, a ratio once questions are copied", () => {
  assert.equal(buildFunnel([]).loop_completion_rate, null);
  const events = [
    buildEvent(READER_EVENTS.TARGET_QUESTION_COPIED, { run: "a" }),
    buildEvent(READER_EVENTS.TARGET_QUESTION_COPIED, { run: "b" }),
    buildEvent(READER_EVENTS.LOOP_RETURNED, { run: "a" }),
    buildEvent(READER_EVENTS.LOOP_COMPLETED, { run: "a", state: "gap_revealed" }),
  ];
  const f = buildFunnel(events);
  assert.equal(f.counts.target_question_copied, 2);
  assert.equal(f.counts.loop_completed, 1);
  assert.equal(f.loop_completion_rate, 0.5);
  assert.deepEqual(f.completed_by_state, { gap_revealed: 1 });
});

test("buildFunnel ignores malformed rows", () => {
  const f = buildFunnel([null, {}, { name: 5 }, buildEvent(READER_EVENTS.RUN_STARTED, {})]);
  assert.equal(f.counts.run_started, 1);
});
