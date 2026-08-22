// The next-step seam ships empty. These hold both halves of that: that it is empty and
// costs nothing today, and that the mechanism underneath it is complete — so the first
// real action is a data edit rather than a rebuild, and cannot skip the contract on its
// way in.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RESULT_ACTIONS,
  RESULT_ACTIONS_VERSION,
  RESULT_ACTION_CONDITION,
  RESULT_ACTION_FIELDS,
  assertResultAction,
  resultActions,
  resultConditions,
} from "../reader-result-actions.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = fs.readFileSync(path.join(ROOT, "workbench-app.jsx"), "utf8");

const AGENT_RUN = { source: "agent", receipt: { id: "r1" } };
const FALLBACK_RUN = { source: "fallback" };
const GUIDED = { mode: "guided", sel: { id: "005" } };
const PASTED = { mode: "paste", sel: null };

// A well-formed action that exists only here. The seam is proven with an injected action
// for the same reason the registry proves its blocker mechanism with an injected blocker:
// the mechanism has to be shown working while the shipped list stays empty.
const TEST_ACTION = Object.freeze({
  id: "test-only-open-record",
  label: "Open the record",
  href: "/archive.html",
  conditions: Object.freeze([RESULT_ACTION_CONDITION.AGENT_RUN]),
});

test("the seam is empty, and empty is asserted rather than assumed", () => {
  assert.equal(RESULT_ACTIONS_VERSION, "reader-result-actions.v1");
  assert.ok(Array.isArray(RESULT_ACTIONS), "the seam is not a list");
  assert.deepEqual(RESULT_ACTIONS, [], "the seam has an action in it, which no ruling has seated");
  assert.ok(Object.isFrozen(RESULT_ACTIONS), "the seam is not frozen");
});

test("an empty seam surfaces nothing, in every state a result can be in", () => {
  // Every combination the panel can hand it. None of them may produce an action, because
  // there is no action to produce.
  for (const result of [AGENT_RUN, FALLBACK_RUN, null, undefined, {}]) {
    for (const context of [GUIDED, PASTED, null, undefined, {}]) {
      assert.deepEqual(resultActions({ result, context }), []);
    }
  }
  assert.deepEqual(resultActions(), [], "called with nothing at all, the seam still returns a list");
});

test("the renderer returns before it builds an element, which is what costs nothing", () => {
  // The zero-footprint guarantee is the early return, not a style. An empty <nav> would
  // still take a gap from a flex parent, still carry a landmark role into the
  // accessibility tree, and still be a node the board would photograph. So the source is
  // pinned: the length check and its null return come before any JSX in the component.
  const from = SRC.indexOf("function ReaderResultActions({ result, context }) {");
  assert.ok(from >= 0, "ReaderResultActions is gone from workbench-app.jsx");
  const to = SRC.indexOf("\n}", from);
  const body = SRC.slice(from, to);
  const guard = body.indexOf("if (!actions.length) return null;");
  const firstElement = body.indexOf("<nav");
  assert.ok(guard >= 0, "the empty-list guard is gone");
  assert.ok(firstElement > guard, "the renderer builds an element before it checks whether it has anything to draw");
  // And no styles were shipped for a control that never renders.
  for (const file of ["workbench.css", "styles.css"]) {
    const css = fs.readFileSync(path.join(ROOT, file), "utf8");
    assert.ok(
      !css.includes("wb-reader-result__actions") && !css.includes("wb-reader-result__action "),
      `${file} carries rules for the empty seam — they are dead until an action is seated`,
    );
  }
});

test("the seam is seated in the panel, and outside the footer's condition", () => {
  assert.ok(
    SRC.includes("<ReaderResultActions result={result} context={context} />"),
    "the result panel no longer seats the action seam",
  );
  const seam = SRC.indexOf("<ReaderResultActions result={result} context={context} />");
  const sections = SRC.indexOf('</div>\n      {/* Outside the footer\'s condition on purpose.');
  // Item 5 (R7+R8+R11) split the old single footer row into a take-away rail and a
  // separate restart row, and dropped the is-fallback modifier with it — the rail now
  // renders only when there is something to take away. The seam's claim is unchanged:
  // it must sit above whichever conditional block comes first.
  const footer = SRC.indexOf('<div className="wb-reader-result__footer">');
  assert.ok(footer >= 0, "the take-away rail is gone from the result panel");
  assert.ok(sections >= 0 && sections < seam, "the seam moved above the read it is a next step from");
  assert.ok(seam < footer, "the seam is inside the footer, so a panel without a rerun control would lose it");
});

test("a seated action reaches a reader — the mechanism works while the list is empty", () => {
  assert.deepEqual(resultActions({ result: AGENT_RUN, context: GUIDED }, [TEST_ACTION]), [TEST_ACTION]);
});

test("an action surfaces only where the run meets what it declared", () => {
  // The one condition this action declares is not met by a fallback, so it does not
  // surface on one. This is the whole reason conditions are data: an action that speaks
  // about what was found must not appear over a run that found nothing.
  assert.deepEqual(resultActions({ result: FALLBACK_RUN, context: GUIDED }, [TEST_ACTION]), []);

  const needsRecord = { ...TEST_ACTION, conditions: [RESULT_ACTION_CONDITION.GUIDED_RECORD] };
  assert.deepEqual(resultActions({ result: AGENT_RUN, context: GUIDED }, [needsRecord]), [needsRecord]);
  assert.deepEqual(resultActions({ result: AGENT_RUN, context: PASTED }, [needsRecord]), []);

  // Two conditions means both, not either.
  const needsBoth = {
    ...TEST_ACTION,
    conditions: [RESULT_ACTION_CONDITION.AGENT_RUN, RESULT_ACTION_CONDITION.GUIDED_RECORD],
  };
  assert.deepEqual(resultActions({ result: AGENT_RUN, context: GUIDED }, [needsBoth]), [needsBoth]);
  assert.deepEqual(resultActions({ result: AGENT_RUN, context: PASTED }, [needsBoth]), []);
  assert.deepEqual(resultActions({ result: FALLBACK_RUN, context: GUIDED }, [needsBoth]), []);
});

test("conditions are read off the run the panel already holds", () => {
  const met = resultConditions({ result: AGENT_RUN, context: GUIDED });
  assert.ok(met.has(RESULT_ACTION_CONDITION.AGENT_RUN));
  assert.ok(met.has(RESULT_ACTION_CONDITION.HAS_RECEIPT));
  assert.ok(met.has(RESULT_ACTION_CONDITION.GUIDED_RECORD));

  const none = resultConditions({ result: FALLBACK_RUN, context: PASTED });
  assert.equal(none.size, 0, "a fallback on a pasted answer met a condition it does not satisfy");

  // A fallback carries no receipt, so no destination derived from one can be offered.
  assert.ok(!resultConditions({ result: FALLBACK_RUN, context: GUIDED }).has(RESULT_ACTION_CONDITION.HAS_RECEIPT));
});

test("an action cannot arrive without its words, its destination, or its conditions", () => {
  for (const field of RESULT_ACTION_FIELDS) {
    const missing = { ...TEST_ACTION };
    delete missing[field];
    assert.throws(
      () => assertResultAction(missing),
      new RegExp(`missing "${field}"`),
      `an action missing ${field} was accepted`,
    );
  }
  assert.throws(() => assertResultAction({ ...TEST_ACTION, id: "" }), /has no id/);
  assert.throws(() => assertResultAction({ ...TEST_ACTION, label: "  " }), /has no label/);
  assert.throws(() => assertResultAction({ ...TEST_ACTION, href: "" }), /has no href/);
  assert.throws(() => assertResultAction({ ...TEST_ACTION, conditions: "agent_run" }), /declares no conditions list/);
  assert.throws(() => assertResultAction(null), /must be an object/);
});

test("an action cannot smuggle in a field or a condition the seam does not define", () => {
  // A seam that quietly accepts an extra key is how the next special case gets in without
  // anyone ruling on it.
  assert.throws(
    () => assertResultAction({ ...TEST_ACTION, onClick: "doSomething" }),
    /declares "onClick", which is not a result action field/,
  );
  assert.throws(
    () => assertResultAction({ ...TEST_ACTION, conditions: ["has_score"] }),
    /needs "has_score", which is not a result action condition/,
  );
  // And the check runs when the list is read, so an injected malformed action fails at
  // the seam rather than rendering a control with no destination.
  assert.throws(() => resultActions({ result: AGENT_RUN }, [{ id: "x" }]), /is missing/);
});

test("the seam carries navigations, and the controls that run code stay components", () => {
  // The two controls in the footer own clipboard writes and a consent dialog. Data cannot
  // carry a handler, so neither is expressible here, and the field list is what says so.
  assert.deepEqual([...RESULT_ACTION_FIELDS], ["id", "label", "href", "conditions"]);
  assert.ok(!RESULT_ACTION_FIELDS.includes("onClick"));
  assert.ok(SRC.includes("<ReaderResultCopyActions"), "the copy controls left the panel");
  assert.ok(SRC.includes("<ReaderShareAction mode=\"single\""), "the share control left the panel");
});

test("no projected action string reaches a reader carrying a verdict", () => {
  // Vacuous today and deliberately so: it is the gate the first seated action meets.
  for (const action of RESULT_ACTIONS) {
    assertResultAction(action);
    assert.ok(!/\b(proves?|proven|verdict|caught|exposed|reveals?)\b/i.test(action.label), action.label);
  }
});
