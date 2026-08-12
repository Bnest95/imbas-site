// Where a next step goes when the Reader has one to offer. Empty at launch.
//
// The result panel ends with three controls that are already earned: copy the result,
// copy the full receipt, share it, run it again. Every one of those acts on the run the
// reader is looking at. What has no home is the other kind of control — the one that
// sends a reader somewhere, because of something the run turned out to be. Open the
// record this cites. Read the case this repeats. Those are navigations, and today they
// get added by opening the result component and typing an anchor into the footer, which
// is how a footer accumulates four buttons nobody chose together.
//
// So the seam is a list, and the list is empty. Not a placeholder: the mechanism below
// is complete and tested, and adding the first action is a data edit here rather than a
// JSX edit in the panel. Empty is the honest launch state — no action has been ruled,
// and inventing one to justify the file would be the same defect as fabricating a field
// to satisfy a picker.
//
// TWO BOUNDARIES, both deliberate.
//
// 1. Navigations, not behaviors. An action is an id, words, a destination and the
//    conditions it needs. A control that must run code — copy to a clipboard, open a
//    consent dialog, mutate state — is a component and stays one. Data cannot carry a
//    handler, and a seam that tried would become a plugin system for the result panel.
//    ReaderResultCopyActions and ReaderShareAction are exactly that kind of control and
//    they are not moving here.
//
// 2. No styles until there is something to style. This file ships with no CSS, because
//    a rule for an element that never renders is dead the day it lands, and this repo is
//    presently deleting a token's worth of exactly that. The commit that seats the first
//    action brings the rules for it. Until then the seam costs nothing: `resultActions`
//    returns an empty array, the renderer returns null before it builds an element, and
//    no node, no box, no focus stop and no accessible name reaches the page.
//
// Pure by contract, like reader-guided-record.js: no node: imports, no DOM, no Date.now,
// no randomness.

export const RESULT_ACTIONS_VERSION = "reader-result-actions.v1";

// What a run has to be for an action to apply. Conditions are data, evaluated here
// against the result the reader is looking at, so an action declares what it needs
// instead of a component deciding when to draw it.
export const RESULT_ACTION_CONDITION = Object.freeze({
  // The run reached the agent and came back with a measurement. A fallback did not, so
  // an action that speaks about what was found must not surface on one.
  AGENT_RUN: "agent_run",
  // The run carries a receipt, which is what any durable destination is derived from.
  HAS_RECEIPT: "has_receipt",
  // The guided rotation supplied the record, so the run has a record to point back at.
  GUIDED_RECORD: "guided_record",
});

const CONDITIONS = Object.freeze(Object.values(RESULT_ACTION_CONDITION));

// Every field an action declares. Exactly these, which is what lets the seam stay
// data-driven rather than becoming a place to hang one more special case.
export const RESULT_ACTION_FIELDS = Object.freeze(["id", "label", "href", "conditions"]);

// The seam. Empty, and the export stays so that emptiness is a thing a test asserts
// rather than a fact about a file nobody opens.
export const RESULT_ACTIONS = Object.freeze([]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

// Checked when the list is read, not when it is written, because a frozen literal in
// this file is not the only way an action can arrive — a test injects one, and so will
// whatever seats the first real one. A malformed action throws rather than rendering a
// control with no words or no destination.
export function assertResultAction(action) {
  if (!action || typeof action !== "object") {
    throw new Error("a result action must be an object");
  }
  const keys = Object.keys(action);
  for (const key of keys) {
    if (!RESULT_ACTION_FIELDS.includes(key)) {
      throw new Error(`result action "${action.id}" declares "${key}", which is not a result action field`);
    }
  }
  for (const field of RESULT_ACTION_FIELDS) {
    if (!keys.includes(field)) {
      throw new Error(`a result action is missing "${field}"`);
    }
  }
  if (!isNonEmptyString(action.id)) throw new Error("a result action has no id");
  if (!isNonEmptyString(action.label)) throw new Error(`result action "${action.id}" has no label`);
  if (!isNonEmptyString(action.href)) throw new Error(`result action "${action.id}" has no href`);
  if (!Array.isArray(action.conditions)) {
    throw new Error(`result action "${action.id}" declares no conditions list`);
  }
  for (const condition of action.conditions) {
    if (!CONDITIONS.includes(condition)) {
      throw new Error(`result action "${action.id}" needs "${condition}", which is not a result action condition`);
    }
  }
  return action;
}

// What is true of the run in front of the reader. Read off the result and the context
// the panel already holds; nothing here reaches for anything the panel does not have.
export function resultConditions({ result, context } = {}) {
  const met = new Set();
  if (result && result.source === "agent") met.add(RESULT_ACTION_CONDITION.AGENT_RUN);
  if (result && result.receipt) met.add(RESULT_ACTION_CONDITION.HAS_RECEIPT);
  if (context && context.mode === "guided" && context.sel) met.add(RESULT_ACTION_CONDITION.GUIDED_RECORD);
  return met;
}

// The actions that apply to this run, in declared order. Every action is checked against
// the contract on the way out, so a malformed one fails at the seam rather than in the
// panel.
export function resultActions({ result, context } = {}, actions = RESULT_ACTIONS) {
  const met = resultConditions({ result, context });
  return actions.filter((action) => {
    assertResultAction(action);
    return action.conditions.every((condition) => met.has(condition));
  });
}
