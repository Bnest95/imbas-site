// reader-telemetry.js — shared, pure-JS event schema + funnel reducer for the
// Confirmation Loop (Reader v2 R1, item 3).
//
// Content-minimal BY CONSTRUCTION: sanitizeEventProps allowlists a fixed set of
// short scalar keys (ids, enums, small integers, booleans) and drops everything
// else, so no answer text, question text, or measured span can ride an event even
// if a caller passes one. The client emitter (workbench-app.jsx) writes sanitized
// events to browser-local storage; no third-party analytics vendor, no server
// user-content payload. buildFunnel reduces those events to the north-star metric.
//
// Pure JS by contract, like reader-paired.js / reader-receipt.js: no node:
// imports, no DOM, no storage — the impure emit + persistence live with the client
// so this stays unit-testable in isolation.

// The Confirmation Loop and user-chip events (design: item 3 telemetry list, plus
// the user-chip lane). Names are the wire values; use the constants so a typo is a
// build error, not a silent miss.
export const READER_EVENTS = {
  RUN_STARTED: "run_started",
  RUN_COMPLETED: "run_completed",
  RESULT_VIEWED: "result_viewed",
  TARGET_QUESTION_COPIED: "target_question_copied",
  LOOP_RETURNED: "loop_returned",
  LOOP_COMPLETED: "loop_completed",
  STATE_CORRECTED: "state_corrected",
  CARD_EXPORTED: "card_exported",
  CANDIDATE_SUBMITTED: "candidate_submitted",
  RETURN_VISIT: "return_visit",
  // User-chip lane (user-directed follow-up). The person picks a follow-up from the
  // Second Question Bank rather than the Reader constructing a probe; the correction
  // (STATE_CORRECTED) and export (CARD_EXPORTED) events are reused, not duplicated.
  CHIP_ROW_RENDERED: "chip_row_rendered",
  CHIP_SELECTED: "chip_selected",
  CHIP_INSTRUCTION_COPIED: "chip_instruction_copied",
  CHIP_PAIR_INITIATED: "chip_pair_initiated",
  CHIP_PAIR_COMPLETED: "chip_pair_completed",
};
export const READER_EVENT_NAMES = Object.values(READER_EVENTS);
const READER_EVENT_NAME_SET = new Set(READER_EVENT_NAMES);

// The ONLY prop keys an event may carry. Every value is an id, an enum, a small
// integer, or a boolean — never free text. Anything outside this set is dropped.
const ALLOWED_PROP_KEYS = [
  "run", // opaque run/request id (not content)
  "state", // loop/chip state id (gap_revealed | still_missing | not_clear_yet | chip_change_visible | chip_change_not_visible | chip_change_unclear)
  "from_state", // state_corrected: machine-suggested state
  "to_state", // state_corrected: person-declared state
  "check", // quick | cleaner
  "mode", // own | guided | demo
  "gap", // integer gap estimate 0-3
  "eligible", // boolean: did the run earn an Act 2 offer
  "source", // agent | fallback | demo
  "idempotent", // boolean: replayed paired result
  "initiator", // inspection_followup | user_chip (pair provenance)
  "instruction_version", // user_chip: bank entry instruction_version (e.g. v1)
  "chip", // user_chip: bank entry id (e.g. sq.sources) — an id, never content
  "conditions", // user_chip: matched | unmatched | unverified (paste-back segmentation)
];
const ALLOWED_PROP_SET = new Set(ALLOWED_PROP_KEYS);
const STRING_PROP_CAP = 64;

// Keep only allowlisted scalar props. Strings are hard-capped so even an expected
// key (an id) cannot smuggle a payload; non-finite numbers and objects are dropped.
export function sanitizeEventProps(props = {}) {
  const out = {};
  if (!props || typeof props !== "object" || Array.isArray(props)) return out;
  for (const k of ALLOWED_PROP_SET) {
    const v = props[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "number") {
      if (Number.isFinite(v)) out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else if (typeof v === "string") {
      const s = v.trim();
      if (s) out[k] = s.slice(0, STRING_PROP_CAP);
    }
  }
  return out;
}

// Build a wire-ready event: a known name plus sanitized props plus a timestamp.
// Returns null for an unknown name so a typo never persists as a junk row.
export function buildEvent(name, props = {}, nowMs = Date.now()) {
  if (!READER_EVENT_NAME_SET.has(name)) return null;
  return { name, ts: Number.isFinite(nowMs) ? Math.round(nowMs) : 0, ...sanitizeEventProps(props) };
}

// Reduce a list of events to the funnel. The NORTH STAR is loop_completion_rate:
// the share of copied targeted questions that came back as a completed loop. It is
// null when nothing has been copied yet — no baseline is invented from zero.
export function buildFunnel(events) {
  const list = Array.isArray(events) ? events.filter((e) => e && typeof e.name === "string") : [];
  const count = (name) => list.reduce((n, e) => (e.name === name ? n + 1 : n), 0);
  const copied = count(READER_EVENTS.TARGET_QUESTION_COPIED);
  const completed = count(READER_EVENTS.LOOP_COMPLETED);
  const chipCopied = count(READER_EVENTS.CHIP_INSTRUCTION_COPIED);
  const chipCompleted = count(READER_EVENTS.CHIP_PAIR_COMPLETED);

  const completedByState = {};
  const chipCompletedByState = {};
  for (const e of list) {
    if (e.name === READER_EVENTS.LOOP_COMPLETED && e.state) {
      completedByState[e.state] = (completedByState[e.state] || 0) + 1;
    }
    if (e.name === READER_EVENTS.CHIP_PAIR_COMPLETED && e.state) {
      chipCompletedByState[e.state] = (chipCompletedByState[e.state] || 0) + 1;
    }
  }

  const counts = {};
  for (const name of READER_EVENT_NAMES) counts[name] = count(name);

  return {
    counts,
    completed_by_state: completedByState,
    chip_completed_by_state: chipCompletedByState,
    // NORTH STAR — % of copied questions that return as completed loops.
    loop_completion_rate: copied > 0 ? completed / copied : null,
    // User-chip loop: % of copied instructions that return as a completed pair.
    chip_completion_rate: chipCopied > 0 ? chipCompleted / chipCopied : null,
  };
}
