import { test } from "node:test";
import assert from "node:assert/strict";
import {
  READER_EVENTS,
  READER_EVENT_NAMES,
  sanitizeEventProps,
  buildEvent,
  buildFunnel,
  shouldTransmitTelemetry,
  prepareTelemetryBatch,
} from "../reader-telemetry.js";
import { CHIP_ENTRY_VIA_VALUES } from "../reader-paired.js";

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

// ── The three segmentation dimensions ─────────────────────────────────────────
// Added 2026-08-25. Each one segments a series that would otherwise pool runs it should
// not: which door the person came through, which governed bank the chip came from, and
// which pinned prompt read the comparison. All three are ids or enums. None is content,
// and none identifies a person.

test("the three segmentation dimensions survive sanitization", () => {
  const out = sanitizeEventProps({
    entered_via: "inspection_reactive",
    bank_version: "second-question-bank.v1",
    paired_prompt_version: "chip.1.0",
    chip: "sq.sources",
  });
  assert.deepEqual(out, {
    entered_via: "inspection_reactive",
    bank_version: "second-question-bank.v1",
    paired_prompt_version: "chip.1.0",
    chip: "sq.sources",
  });
});

// The dimension has to speak the receipt's vocabulary or the two records disagree about
// the same run. This reads the enum from reader-paired.js rather than restating it, so a
// door added there without a matching thought about the series fails here.
test("entered_via carries the receipt's own door enum, unchanged", () => {
  for (const via of CHIP_ENTRY_VIA_VALUES) {
    assert.equal(sanitizeEventProps({ entered_via: via }).entered_via, via, `${via} passes through intact`);
    assert.ok(via.length <= 64, `${via} fits under the string cap without truncation`);
  }
  assert.equal(CHIP_ENTRY_VIA_VALUES.length, 3);
});

// The new keys widen the allowlist, so the thing worth proving is that they widened it by
// exactly three and carried no content in with them.
test("the new dimensions admit no content beside them", () => {
  const out = sanitizeEventProps({
    entered_via: "direct_standing",
    bank_version: "second-question-bank.v1",
    instruction_text: "Show me where each claim came from.",
    targeted_answer: "the second answer, in full",
    targeted_prompt_hash: "a".repeat(64),
    receipt_hash: "b".repeat(64),
  });
  assert.deepEqual(out, { entered_via: "direct_standing", bank_version: "second-question-bank.v1" });
});

test("a free-text value forced into a dimension is capped like any other id", () => {
  const out = sanitizeEventProps({ bank_version: "y".repeat(500) });
  assert.equal(out.bank_version.length, 64);
});

// ── Event building ────────────────────────────────────────────────────────────

test("buildEvent rejects an unknown name and stamps a known one", () => {
  assert.equal(buildEvent("not_a_real_event", {}), null);
  const e = buildEvent(READER_EVENTS.LOOP_COMPLETED, { state: "gap_revealed", answer: "leak" }, 1000);
  assert.deepEqual(e, { name: "loop_completed", ts: 1000, state: "gap_revealed" });
});

test("every event name is covered by the exported list", () => {
  assert.equal(READER_EVENT_NAMES.length, 21);
  assert.ok(READER_EVENT_NAMES.includes("target_question_copied"));
  assert.ok(READER_EVENT_NAMES.includes("loop_completed"));
  // Stage spine (reader-stage.js). stage_changed was renamed: it recorded only clicked
  // forward advances, so the result and degraded stages never appeared in the funnel.
  assert.ok(READER_EVENT_NAMES.includes("stage_entered"));
  assert.ok(!READER_EVENT_NAMES.includes("stage_changed"));
  // User-chip lane events (design: item 3 telemetry, user-chip follow-up).
  assert.ok(READER_EVENT_NAMES.includes("chip_instruction_copied"));
  assert.ok(READER_EVENT_NAMES.includes("chip_pair_completed"));
  // Operational / resilience lane (Phase 0 §D).
  assert.ok(READER_EVENT_NAMES.includes("follow_up_revealed"));
  assert.ok(READER_EVENT_NAMES.includes("timeout"));
  assert.ok(READER_EVENT_NAMES.includes("capacity_degradation"));
  assert.ok(READER_EVENT_NAMES.includes("capture_uncertain"));
  assert.ok(READER_EVENT_NAMES.includes("restored_session"));
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

test("buildFunnel exposes the four stage milestones, not one lumped stage count", () => {
  const enter = (stage, occurrence) =>
    buildEvent(READER_EVENTS.STAGE_ENTERED, { stage, cause: "advance", occurrence });
  const f = buildFunnel([
    // Run 1 reached the delta. Run 2 got a read with no follow-up offer and stopped.
    enter("compose", 1),
    enter("inspecting", 1),
    enter("followup", 1),
    enter("compare", 1),
    enter("delta", 1),
    enter("compose", 2),
    enter("inspecting", 2),
    enter("result", 2),
  ]);
  assert.deepEqual(f.stage_funnel, {
    inspection_started: 2,
    result_delivered: 2, // one via followup, one via result — never both for one run
    follow_up_opened: 1,
    comparison_completed: 1,
  });
  assert.equal(f.stage_entries.result, 1, "the degraded run is visible on its own stage");
  assert.equal(f.stage_entries.chips, 0, "every stage is present, including the unreached");
  assert.equal(f.counts.stage_entered, 8, "the lumped count still exists, and is not the funnel");
});

test("buildFunnel ignores malformed rows", () => {
  const f = buildFunnel([null, {}, { name: 5 }, buildEvent(READER_EVENTS.RUN_STARTED, {})]);
  assert.equal(f.counts.run_started, 1);
});

// ── Transmission boundary (Phase 0 §D — disabled + content-free on the wire) ────

test("transmission is off by default and only a server-delivered enabled:true flag opens it", () => {
  // No in-source constant gates this anymore — the server-delivered config IS the whole
  // switch (the module compiles into the browser bundle, which has no process.env). So
  // absent/malformed all resolve to off, and only a config object with a strict
  // boolean-true enabled opens the wire.
  assert.equal(shouldTransmitTelemetry(), false); // absent
  assert.equal(shouldTransmitTelemetry(undefined), false); // unset
  assert.equal(shouldTransmitTelemetry(null), false); // null
  assert.equal(shouldTransmitTelemetry({}), false); // no flag
  assert.equal(shouldTransmitTelemetry({ enabled: false }), false);
  assert.equal(shouldTransmitTelemetry({ enabled: "true" }), false); // string, not boolean
  assert.equal(shouldTransmitTelemetry({ enabled: 1 }), false); // truthy, not boolean-true
  assert.equal(shouldTransmitTelemetry("enabled"), false); // non-object
  assert.equal(shouldTransmitTelemetry(true), false); // non-object truthy
  assert.equal(shouldTransmitTelemetry({ enabled: true }), true); // the only open state
});

test("prepareTelemetryBatch strips content even from a hand-forged persisted row", () => {
  // Simulate a tampered/legacy localStorage row that smuggled raw user text.
  const forged = [
    {
      name: "run_completed",
      ts: 1000,
      run: "r-1",
      mode: "own",
      answer: "the entire pasted answer text that must never transmit",
      question: "the user's private question",
      the_read: "a measured omission body",
      email: "person@example.com",
    },
    { name: "timeout", ts: 2000, run: "r-1", reason: "timeout", ms: 45000 },
    { name: "not_a_real_event", ts: 3000, answer: "leak" }, // unknown name → dropped
    null,
    { name: 5 },
  ];
  const batch = prepareTelemetryBatch(forged);
  assert.equal(batch.length, 2); // only the two known-name rows survive
  assert.deepEqual(batch[0], { name: "run_completed", ts: 1000, run: "r-1", mode: "own" });
  assert.deepEqual(batch[1], { name: "timeout", ts: 2000, run: "r-1", reason: "timeout", ms: 45000 });
  // No content key survives on any row of the wire batch.
  const wire = JSON.stringify(batch);
  for (const leak of ["answer", "question", "the_read", "email", "pasted", "private"]) {
    assert.ok(!wire.includes(leak), `wire batch must not contain "${leak}"`);
  }
});

test("prepareTelemetryBatch preserves the original timestamp, not a fresh one", () => {
  const batch = prepareTelemetryBatch([{ name: "restored_session", ts: 42, run: "r-9" }]);
  assert.deepEqual(batch, [{ name: "restored_session", ts: 42, run: "r-9" }]);
});
