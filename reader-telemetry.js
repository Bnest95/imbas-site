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
// Transmission is implemented but DISABLED by default: events stay browser-local
// unless the server delivers an explicit enable flag (config.enabled === true) and a
// founder approves the privacy line. The only wire path, prepareTelemetryBatch,
// re-runs the allowlist, so the content-minimal guarantee holds on the wire too —
// proven by test/reader-telemetry.test.mjs.
//
// Pure JS by contract, like reader-paired.js / reader-receipt.js: no node:
// imports, no DOM, no storage — the impure emit + persistence live with the client
// so this stays unit-testable in isolation. The one import is reader-stage.js, which is
// itself pure and is the single place stage ids are named: the funnel has to speak the
// same stage vocabulary as the spine, and re-typing the ids here is how the two drift.
import {
  STAGE_INSPECTING,
  STAGE_RESULT,
  STAGE_FOLLOWUP,
  STAGE_COMPARE,
  STAGE_DELTA,
  ALL_STAGES as FUNNEL_STAGES,
} from "./reader-stage.js";

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
  // Stage spine (reader-stage.js). STAGE_ENTERED means one thing: this stage was
  // reached. Once per stage, per session, however it was reached — the primary action,
  // a fetch settling, a degraded body arriving, an arrival deep link. It replaced
  // stage_changed, which emitted only on a clicked forward advance and so recorded
  // neither the result stage nor the degraded stage: the two the person never clicks
  // into, and the two the funnel most needs. The name had stopped describing the event.
  //
  // WHY the stage was entered rides along as `cause`, and stays a separate question
  // from whether it was entered. Back, Forward, restore, remount and normalization all
  // produce real entries with causes that reader-stage.countsAsProgress excludes, so
  // conversion analysis drops them without the record disappearing.
  //
  // Carries stage / prior_stage / cause / occurrence / mode — stage ids, enums and a
  // small counter, never content, never identity. `occurrence` is which run within the
  // current page life (1, 2, 3…): it resets on reload, is held only in memory, and
  // exists so a person's second inspection is a second countable funnel rather than
  // silence. Deduping across a whole session would blind the north star to repeat use.
  STAGE_ENTERED: "stage_entered",
  // Operational / resilience lane (Phase 0 §D). Content-free by construction like
  // the rest: they carry an opaque run id, an enum reason, and small operational
  // integers, never user text. Ceiling *trip* is a server-side runtime event
  // (fallback_returned reason:ceiling — the read fails closed to the instruction-only
  // capacity fallback, no paid call), so the only client-visible capacity
  // signal is CAPACITY_DEGRADATION — the moment the automated comparison lane is
  // withheld and the person is routed to the self-run path.
  FOLLOW_UP_REVEALED: "follow_up_revealed",
  TIMEOUT: "timeout",
  CAPACITY_DEGRADATION: "capacity_degradation",
  CAPTURE_UNCERTAIN: "capture_uncertain",
  RESTORED_SESSION: "restored_session",
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
  "stage", // stage_entered: the stage reached (reader-stage.js id)
  "prior_stage", // stage_entered: the stage left, absent on the first entry
  "cause", // stage_entered: advance | async | degraded | init | pop | restore | normalize | remount | reverse
  "occurrence", // stage_entered: which run within this page life — 1, 2, 3…
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
  "ms", // operational latency, integer milliseconds (never content)
  "reason", // operational cause enum: timeout | network | ceiling | api_error | disabled | no_key | bad_json
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

  // Stage entries broken out by stage id. counts.stage_entered is one number for every
  // stage in the product, so on its own it cannot answer whether anyone got a result.
  const stageEntries = {};
  for (const stage of FUNNEL_STAGES) stageEntries[stage] = 0;
  for (const e of list) {
    if (e.name === READER_EVENTS.STAGE_ENTERED && typeof e.stage === "string") {
      stageEntries[e.stage] = (stageEntries[e.stage] || 0) + 1;
    }
  }

  return {
    counts,
    stage_entries: stageEntries,
    // The four milestones, named in the same stage vocabulary the code and tests use.
    //
    // result_delivered sums `result` and `followup` because those are the only two
    // stages a run can land on first once a read exists: deriveStage returns `followup`
    // when the payload carries an Act 2 offer and `result` when it does not, and
    // normalizeArrivalStage only ever resolves a deep link DOWN, so `compare` and
    // `delta` are unreachable without passing through one of them. Counting all four
    // would count the same run up to three times.
    stage_funnel: {
      inspection_started: stageEntries[STAGE_INSPECTING],
      result_delivered: stageEntries[STAGE_RESULT] + stageEntries[STAGE_FOLLOWUP],
      follow_up_opened: stageEntries[STAGE_COMPARE],
      comparison_completed: stageEntries[STAGE_DELTA],
    },
    completed_by_state: completedByState,
    chip_completed_by_state: chipCompletedByState,
    // NORTH STAR — % of copied questions that return as completed loops.
    loop_completion_rate: copied > 0 ? completed / copied : null,
    // User-chip loop: % of copied instructions that return as a completed pair.
    chip_completion_rate: chipCopied > 0 ? chipCompleted / chipCopied : null,
  };
}

// ── Transmission (Phase 0 §D — implemented, DISABLED by default) ────────────────
//
// Events are collected browser-local today; nothing leaves the device. This scaffold
// is the ONLY path that could ever transmit, and it is off unless the server delivers
// an explicit enable flag (see DEPLOY.md → "Telemetry privacy boundary"). Two gates
// make an accidental leak structurally impossible:
//   1. shouldTransmitTelemetry — the gate is the server-delivered config alone. It
//      returns true ONLY for a config object with enabled === true; undefined, null,
//      malformed, or enabled-not-strictly-true all resolve to false. There is no
//      in-source enable constant: this module compiles into the browser bundle, which
//      carries no process.env, so a build-time default would be the wrong switch.
//      Absent a server flag, transmission stays off.
//   2. prepareTelemetryBatch — re-runs every row through the same allowlist as
//      capture, so the wire shape is provably {name, ts, ...allowlisted-scalars}.
//      Even a hand-forged localStorage row carrying answer text is stripped here.
export function shouldTransmitTelemetry(config) {
  // The server-delivered flag is the whole gate: default off, malformed off.
  return !!(config && typeof config === "object" && config.enabled === true);
}

// Re-sanitize a persisted event list into the wire batch. Unknown names are dropped,
// the original timestamp is preserved, and props are re-allowlisted — so no content
// can ride the wire even if it was somehow persisted locally.
export function prepareTelemetryBatch(events) {
  const list = Array.isArray(events) ? events : [];
  const out = [];
  for (const e of list) {
    if (!e || typeof e !== "object" || Array.isArray(e)) continue;
    if (!READER_EVENT_NAME_SET.has(e.name)) continue;
    const ts = Number.isFinite(e.ts) ? Math.round(e.ts) : 0;
    out.push({ name: e.name, ts, ...sanitizeEventProps(e) });
  }
  return out;
}
