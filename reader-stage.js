// reader-stage.js — the Workbench stage spine.
//
// One route, one spine (architecture v3.1 §N). This module owns the answer to three
// questions the Workbench kept answering inconsistently in the render tree:
//   1. which stage is the person in,
//   2. which single input may accept an answer there,
//   3. does a forward move deserve a funnel event.
//
// Pure: no DOM, no React, no imports. Same contract as reader-scroll.js, so Node can
// unit-test the whole state machine without a browser.
//
// It carries NO user-facing copy. Degraded stages name a next-action identifier; the
// component renders the already-approved sentence (ACT2_CAPACITY_COPY in reader-paired.js).
// Keeping copy out of here is deliberate — a stage module that owned copy would become a
// second place to author it.

// ── Lanes ──────────────────────────────────────────────────────────────────────
export const LANE_INSPECT = "inspect";
export const LANE_CHIPS = "chips";

// ── Stages ─────────────────────────────────────────────────────────────────────
export const STAGE_COMPOSE = "compose";
export const STAGE_INSPECTING = "inspecting";
export const STAGE_RESULT = "result";
export const STAGE_FOLLOWUP = "followup";
export const STAGE_COMPARE = "compare";
export const STAGE_DELTA = "delta";
export const STAGE_CHIPS = "chips";

// Forward order of the inspect lane. STAGE_CHIPS is a parallel lane, not a step in
// this sequence, and is handled explicitly in isForwardStage.
export const STAGE_ORDER = [
  STAGE_COMPOSE,
  STAGE_INSPECTING,
  STAGE_RESULT,
  STAGE_FOLLOWUP,
  STAGE_COMPARE,
  STAGE_DELTA,
];

export const ALL_STAGES = [...STAGE_ORDER, STAGE_CHIPS];

// ── Answer-entry inputs ────────────────────────────────────────────────────────
// The invariant this module exists to hold: at most ONE of these is live per stage.
export const ENTRY_COMPOSE_ANSWER = "compose-answer";
export const ENTRY_PAIRED_ANSWER = "paired-answer";
export const ENTRY_CHIP_ANSWER = "chip-answer";

// ── Transition causes ──────────────────────────────────────────────────────────
// Only ADVANCE is a person moving themselves forward through the product. Everything
// else is the browser, the framework, or a restore putting them somewhere.
export const CAUSE_ADVANCE = "advance";
export const CAUSE_INIT = "init";
export const CAUSE_POP = "pop";
export const CAUSE_RESTORE = "restore";
export const CAUSE_NORMALIZE = "normalize";
export const CAUSE_REMOUNT = "remount";

/**
 * Which stage the person is in, derived from what actually exists.
 * Derivation beats stored stage: a stage is a view of the data, never a fact of its own.
 */
export function deriveStage(state = {}) {
  const {
    lane = LANE_INSPECT,
    busy = false,
    hasResult = false,
    hasAct2 = false,
    followUpOpen = false,
    hasDelta = false,
  } = state;

  if (lane === LANE_CHIPS) return STAGE_CHIPS;
  if (busy) return STAGE_INSPECTING;
  if (!hasResult) return STAGE_COMPOSE;
  if (hasDelta) return STAGE_DELTA;
  if (followUpOpen) return STAGE_COMPARE;
  if (hasAct2) return STAGE_FOLLOWUP;
  return STAGE_RESULT;
}

/**
 * The visibility contract. Exactly one answerEntry (or null) per stage — this is the
 * machine-checkable form of "no stage may expose more than one answer-entry textarea".
 *
 * readOnly lists inputs that stay VISIBLE as context but accept no input, so a person
 * can still see what they submitted without it competing for their next keystroke.
 *
 * `loop` is the standing restart offer. It is true exactly where a finished result is on
 * screen and no stage-specific input is live. At STAGE_COMPARE it is false: that stage
 * already hands the person one question to run, and the loop hands them a different one.
 * Two questions and two copy buttons above a single paste box is the same competition the
 * textarea rule exists to stop, in another form.
 */
export function stageView(stage) {
  switch (stage) {
    case STAGE_COMPOSE:
      return {
        answerEntry: ENTRY_COMPOSE_ANSWER,
        readOnly: [],
        pasteBox: true,
        result: false,
        act2: false,
        pairedInput: false,
        chipLane: false,
        chipDoor: true,
        loop: false,
        focus: "compose-answer",
        degradedNextAction: "run-reader",
      };
    case STAGE_INSPECTING:
      return {
        answerEntry: null,
        readOnly: [ENTRY_COMPOSE_ANSWER],
        pasteBox: true,
        result: false,
        act2: false,
        pairedInput: false,
        chipLane: false,
        chipDoor: false,
        loop: false,
        focus: "status",
        degradedNextAction: "resolves-to-fallback-result",
      };
    case STAGE_RESULT:
      return {
        answerEntry: null,
        readOnly: [ENTRY_COMPOSE_ANSWER],
        pasteBox: true,
        result: true,
        act2: false,
        pairedInput: false,
        chipLane: false,
        chipDoor: true,
        loop: true,
        focus: "result-heading",
        degradedNextAction: "read-result-or-restart",
      };
    case STAGE_FOLLOWUP:
      return {
        answerEntry: null,
        readOnly: [ENTRY_COMPOSE_ANSWER],
        pasteBox: true,
        result: true,
        act2: true,
        pairedInput: false,
        chipLane: false,
        chipDoor: true,
        loop: true,
        // Instruction generation is free and survives capacity degradation (§C tier 1).
        focus: "act2-heading",
        degradedNextAction: "copy-instruction-and-run-externally",
      };
    case STAGE_COMPARE:
      return {
        answerEntry: ENTRY_PAIRED_ANSWER,
        readOnly: [ENTRY_COMPOSE_ANSWER],
        pasteBox: true,
        result: true,
        act2: true,
        pairedInput: true,
        // The standing composer must not render while a stage-specific paired-answer
        // input is live. Both the lane and its door go.
        chipLane: false,
        chipDoor: false,
        loop: false,
        focus: "paired-answer",
        degradedNextAction: "run-externally-comparison-deferred",
      };
    case STAGE_DELTA:
      return {
        answerEntry: null,
        readOnly: [ENTRY_COMPOSE_ANSWER, ENTRY_PAIRED_ANSWER],
        pasteBox: true,
        result: true,
        act2: true,
        pairedInput: true,
        chipLane: false,
        chipDoor: true,
        loop: true,
        focus: "delta-heading",
        degradedNextAction: "keep-receipt-or-restart",
      };
    case STAGE_CHIPS:
      return {
        answerEntry: ENTRY_CHIP_ANSWER,
        readOnly: [],
        pasteBox: false,
        result: false,
        act2: false,
        pairedInput: false,
        chipLane: true,
        chipDoor: true,
        loop: false,
        focus: "chip-answer",
        // §D: the chip instruction stage is itself the capacity-degradation surface.
        degradedNextAction: "copy-instruction-and-run-externally",
      };
    default:
      return stageView(STAGE_COMPOSE);
  }
}

/**
 * Is `to` forward of `from`? Only forward moves are funnel events.
 * Entering the chip lane counts as forward (it is a chosen step deeper into the
 * product); returning from it to the inspect lane does not.
 */
export function isForwardStage(from, to) {
  if (from === to) return false;
  if (to === STAGE_CHIPS) return true;
  if (from === STAGE_CHIPS) return false;
  const a = STAGE_ORDER.indexOf(from);
  const b = STAGE_ORDER.indexOf(to);
  return a !== -1 && b !== -1 && b > a;
}

/**
 * The single decision point for stage telemetry.
 *
 * STAGE_CHANGED means: an explicit in-product stage advance the person initiated
 * through the stage's primary action. Everything else moves the view without moving
 * the funnel. Back and browser Forward arrive as CAUSE_POP and emit nothing, which is
 * load-bearing because the hash drives stage and both fire hashchange.
 *
 * Skipping a stage is permitted (result → compare via the direct door, compose →
 * result when a fallback returns without an inspecting frame). One advance still emits
 * exactly one event, and from/to record the ACTUAL pair, never a synthesized path.
 */
export function stageTransition(from, to, cause) {
  const emit = cause === CAUSE_ADVANCE && isForwardStage(from, to);
  return { from, to, cause, emit, skipped: emit && skippedBetween(from, to) };
}

function skippedBetween(from, to) {
  const a = STAGE_ORDER.indexOf(from);
  const b = STAGE_ORDER.indexOf(to);
  return a !== -1 && b !== -1 && b - a > 1;
}

// ── Arrival ────────────────────────────────────────────────────────────────────

/**
 * Read the arrival intent off the URL. Uses the query flag the repo already uses for
 * `reader` and `funnel`; adds no new mechanism.
 *   ?start=chips  → the permanent chip direct door (§D)
 *   #stage=<id>   → an arrival deep link at a named stage
 */
export function parseArrival({ search = "", hash = "" } = {}) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const start = params.get("start");
  const lane = start === "chips" ? LANE_CHIPS : LANE_INSPECT;
  const raw = String(hash || "").replace(/^#/, "");
  const m = /(?:^|&)stage=([a-z-]+)/.exec(raw);
  const stage = m && ALL_STAGES.includes(m[1]) ? m[1] : null;
  return { lane, stage };
}

/**
 * A stage hash is a bookmark, not a save file. Nothing in this product persists run
 * content, so a hash naming a stage whose data does not exist is normalized DOWN to
 * the earliest stage the available data actually supports — never reconstructed.
 *
 * `rewrite` tells the caller to replace the stale hash (replaceState, not pushState)
 * so the dead entry leaves the history stack entirely and Back returns to wherever the
 * person genuinely came from instead of bouncing on a hash that resolves nowhere.
 */
export function normalizeArrivalStage(requested, available = {}) {
  const supported = deriveStage(available);
  if (!requested || !ALL_STAGES.includes(requested)) {
    return { stage: supported, rewrite: false, reason: "no-stage-hash" };
  }
  if (requested === STAGE_CHIPS) {
    // The chip lane needs no prior run: it is self-contained and always reachable.
    return { stage: STAGE_CHIPS, rewrite: false, reason: "chip-lane-self-contained" };
  }
  if (isForwardStage(supported, requested)) {
    return { stage: supported, rewrite: true, reason: "stale-stage-hash" };
  }
  return { stage: requested, rewrite: false, reason: "supported" };
}

export function stageHash(stage) {
  return stage === STAGE_COMPOSE ? "" : `#stage=${stage}`;
}
