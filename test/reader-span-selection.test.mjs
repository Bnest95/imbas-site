// SPAN SELECTION — what a person's drag over the answer resolves to, and what may be
// offered over it.
//
// WHAT THIS IS FOR. A person is mid-argument with a model that is looping, or claiming
// work it did not do. They select the words that are the problem. Everything downstream —
// the quoted passage in a composed request, the decision to surface a register question
// instead of composing one — rests on two offsets into the inspected answer. If those
// offsets are wrong, the request quotes words the person did not choose, confidently.
//
// WHAT IS PROVEN HERE, against the SHIPPED body rendered into a real node tree:
//
//   1. DIRECTION IS NOT PART OF THE SELECTION. A right-to-left drag and a left-to-right
//      drag over the same words produce byte-identical spans, and byte-identical composed
//      messages. Dragging backwards is how people select when they overshoot.
//   2. TWO FINDINGS ARE NOT ONE QUESTION. A selection touching marks from two distinct
//      register cards produces the narrowing state — never a composed question, never one
//      of the two cards picked for the person — and produces it identically across
//      repeated renders and across a reversed traversal order.
//   3. THE BODY IS THE BOUNDARY. A drag that leaves the answer offers nothing rather than
//      clipping to the body's edge, and a caret is not a selection.
//
// The offsets are never written down as literals. They are resolved from the rendered
// nodes by test/span-dom.mjs, which counts raw text and knows nothing about the module
// under test, and the module is asked to arrive at the same numbers from the other
// direction.
//
// Content-blind: synthetic answer, synthetic findings, no live base, no spend, no model
// call — there is no model call anywhere in this lane.
//
// Run: node --test test/reader-span-selection.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ARTIFACT_ORIGINAL,
  REGISTER_STATUS,
  SHAPE_SINGLE_CANDIDATE,
  buildFinding,
  buildSourceReading,
  describeFinding,
  registerDisposition,
} from "../reader-result.js";
import { buildCard } from "../reader-checks.js";
import {
  MARK_NUMBER_ATTR,
  SPAN_ACTION,
  SPAN_UI,
  SPAN_MODES,
  composeSpanRequest,
  narrowingLine,
  resolveAnswerOffset,
  resolveSelectionSpan,
  resolveSpanAction,
  selectionCardIds,
} from "../reader-span-selection.js";
import { renderSourceReading, renderSpanAffordances } from "./source-reading-render.mjs";
import { boundaryAtAnswerIndex, findByClass, rangeOf, renderedAnswerText, toNodeTree } from "./span-dom.mjs";

// ── The fixture ──────────────────────────────────────────────────────────────
//
// Two marked sentences with a stretch of unmarked prose between them, so a selection can
// sit inside one mark, cross from a mark into open prose, or span both marks. Each mark's
// finding carries a DISTINCT register card, which is what makes the narrowing case real
// rather than constructed.

const FIRST = "A landlord must return a security deposit within 30 days of the tenant moving out.";
const MIDDLE = "If the landlord keeps any part of the deposit, they have to send an itemized list of deductions.";
const LAST = "Most tenants get the full amount back without any trouble, so there is usually nothing to worry about.";
const ANSWER = [FIRST, MIDDLE, LAST].join(" ");

const CARD_A = "check-deposit-deadline";
const CARD_B = "check-most-tenants";

function findingOf(index, quote, cardId) {
  return buildFinding({
    index,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement: `A statement ${index}.`,
    quotations: { [ARTIFACT_ORIGINAL]: quote },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
    check_register: cardId
      ? registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: cardId })
      : registerDisposition({ status: REGISTER_STATUS.ELIGIBLE }),
  });
}

// Built through the register's own card builder rather than by hand, so a rename of
// `verification_question` breaks this file instead of leaving it green against a shape
// that no longer ships.
function cardOf(id, question) {
  return buildCard({ id, verification_action: { question, resolver: "document" } }, null);
}

const QUESTION_A = "Which state's law sets this 30-day deadline?";
const QUESTION_B = "What share of deposits is returned in full, and over what period?";

function fixture({ reverseFindings = false, cards = true } = {}) {
  const built = [findingOf(0, FIRST, CARD_A), findingOf(1, LAST, CARD_B)];
  const ordered = reverseFindings ? [built[1], built[0]] : built;
  const findings = ordered.map(describeFinding);
  const reading = buildSourceReading({ artifactText: ANSWER, findings });
  const cardsById = new Map(
    cards
      ? [
          [CARD_A, cardOf(CARD_A, QUESTION_A)],
          [CARD_B, cardOf(CARD_B, QUESTION_B)],
        ]
      : [],
  );
  return { findings, reading, cardsById };
}

async function bodyOf(reading) {
  const body = findByClass(toNodeTree(await renderSourceReading(reading, { answer: ANSWER })), "wb-source__body");
  assert.ok(body, "the rendered tree must contain the source body");
  // The one precondition everything below rests on. If the body's text is not the answer,
  // every offset derived from it is about a different string.
  assert.equal(renderedAnswerText(body, MARK_NUMBER_ATTR), ANSWER, "the body must render the answer exactly");
  return body;
}

// A drag from answer index `a` to answer index `b`, expressed as the Range a browser hands
// back. The boundary points come from counting rendered text, not from the module.
function drag(body, a, b) {
  const from = boundaryAtAnswerIndex(body, a, MARK_NUMBER_ATTR);
  const to = boundaryAtAnswerIndex(body, b, MARK_NUMBER_ATTR);
  assert.ok(from && to, `both ends of the drag ${a}→${b} must fall in rendered text`);
  return rangeOf(from, to);
}

// ── 1. DIRECTION IS NOT PART OF THE SELECTION ────────────────────────────────

// Four drags, each a different relationship to the marks: wholly inside one, out of a mark
// into open prose, wholly in open prose, and across both marks. Direction has to stop
// mattering for all of them, not for the convenient one.
const DRAGS = [
  { name: "inside the first mark", start: 2, end: 24 },
  { name: "out of a mark into open prose", start: 60, end: FIRST.length + 30 },
  { name: "wholly in open prose", start: FIRST.length + 5, end: FIRST.length + 40 },
  { name: "across both marks", start: 10, end: ANSWER.length - 10 },
  { name: "the whole answer", start: 0, end: ANSWER.length },
];

test("a backward drag resolves byte-identically to the forward drag", async () => {
  const { reading } = fixture();
  const body = await bodyOf(reading);

  for (const d of DRAGS) {
    const forward = resolveSelectionSpan({ range: drag(body, d.start, d.end), bodyEl: body });
    const backward = resolveSelectionSpan({ range: drag(body, d.end, d.start), bodyEl: body });

    assert.deepEqual(forward, { start: d.start, end: d.end }, `${d.name}: forward drag`);
    assert.deepEqual(backward, forward, `${d.name}: a right-to-left drag is the same selection`);
    // And the words themselves, which is what a person is actually choosing.
    assert.equal(
      ANSWER.slice(backward.start, backward.end),
      ANSWER.slice(d.start, d.end),
      `${d.name}: the passage under a backward drag`,
    );
  }
});

test("the composed message is byte-identical under either drag direction", async () => {
  // The span is the intermediate value; the message is what a person pastes into the model
  // they are arguing with. Equal spans that produced unequal messages would still be a
  // defect, so the end of the chain is compared rather than the middle of it.
  const { reading } = fixture();
  const body = await bodyOf(reading);
  const { start, end } = DRAGS[2]; // open prose: no card, so this composes

  for (const mode of [SPAN_MODES.PROBLEM, SPAN_MODES.DESIRED]) {
    const f = composeSpanRequest({
      mode,
      answer: ANSWER,
      span: resolveSelectionSpan({ range: drag(body, start, end), bodyEl: body }),
    });
    const b = composeSpanRequest({
      mode,
      answer: ANSWER,
      span: resolveSelectionSpan({ range: drag(body, end, start), bodyEl: body }),
    });
    assert.equal(b.message, f.message, `${mode}: same words, same message, either direction`);
    assert.equal(f.passage, ANSWER.slice(start, end), "the quoted passage is sliced out of the answer verbatim");
    assert.equal(
      f.message.includes(`"${ANSWER.slice(start, end)}"`),
      true,
      "the message carries the person's own words, unaltered",
    );
  }
});

test("a drag that starts or ends inside a mark numeral still resolves to answer offsets", async () => {
  // A person dragging across a marked sentence usually passes through its numeral. Those
  // characters are in the DOM and not in the answer, so the offsets they produce have to
  // be clean answer positions or every quotation after a mark is shifted.
  const { reading } = fixture();
  const body = await bodyOf(reading);
  const firstMark = findByClass(body, "wb-source__mark");
  const numeral = findByClass(firstMark, "wb-mark-n");
  assert.ok(numeral, "the marked run renders a numeral");

  const markStart = Number(firstMark.getAttribute("data-start"));
  const tail = boundaryAtAnswerIndex(body, markStart + 20, MARK_NUMBER_ATTR);

  const forward = resolveSelectionSpan({
    range: rangeOf({ node: numeral, offset: 0 }, tail),
    bodyEl: body,
  });
  const backward = resolveSelectionSpan({
    range: rangeOf(tail, { node: numeral, offset: 0 }),
    bodyEl: body,
  });

  assert.deepEqual(forward, { start: markStart, end: markStart + 20 }, "the numeral resolves to where its words begin");
  assert.deepEqual(backward, forward, "and direction still does not matter");
  assert.equal(
    ANSWER.slice(forward.start, forward.end),
    FIRST.slice(0, 20),
    "no numeral characters reached the passage",
  );
});

// ── 2. TWO FINDINGS ARE NOT ONE QUESTION ─────────────────────────────────────

test("a selection spanning two cards produces the narrowing state, deterministically", async () => {
  const { reading, findings, cardsById } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({ range: drag(body, 10, ANSWER.length - 10), bodyEl: body });

  assert.deepEqual(selectionCardIds({ span, reading, findings }), [CARD_A, CARD_B].sort());

  for (const mode of [SPAN_MODES.PROBLEM, SPAN_MODES.DESIRED]) {
    const action = resolveSpanAction({ span, reading, findings, cardsById, mode, answer: ANSWER });
    assert.equal(action.kind, SPAN_ACTION.NARROW, `${mode}: two cards is not a question and not a composition`);
    assert.equal(action.count, 2);
    assert.equal(action.line, narrowingLine(2));
    assert.equal(action.line, "This selection touches 2 findings. Narrow it to one.");
    // The two things that must NOT be here. A card_id would be the surface deciding which
    // of the person's two findings they meant; a message would be a second, unregistered
    // question about words the register already covers twice.
    assert.equal("card_id" in action, false, "no card is chosen");
    assert.equal("message" in action, false, "nothing is composed");
    assert.equal("question" in action, false, "no card's question is surfaced");
  }
});

test("the narrowing result does not depend on the order the marks are walked", async () => {
  // selectionCardIds iterates reading.marks, whose order follows the order the findings
  // arrived in. Passing them the other way round is a real reordering of that walk — the
  // sort inside the module is what makes the answer identical.
  const forward = fixture();
  const reversed = fixture({ reverseFindings: true });

  assert.notDeepEqual(
    forward.reading.marks.map((m) => m.finding_id),
    reversed.reading.marks.map((m) => m.finding_id),
    "the control is only a control if the traversal order actually differs",
  );

  const bodyF = await bodyOf(forward.reading);
  const bodyR = await bodyOf(reversed.reading);
  const spanF = resolveSelectionSpan({ range: drag(bodyF, 10, ANSWER.length - 10), bodyEl: bodyF });
  const spanR = resolveSelectionSpan({ range: drag(bodyR, 10, ANSWER.length - 10), bodyEl: bodyR });
  assert.deepEqual(spanR, spanF, "the same words, whichever order the findings arrived in");

  // The card ids come back in ONE order, not in the order the marks happened to be walked.
  // Written as a literal rather than as `[CARD_A, CARD_B].sort()`, which would agree with
  // whatever the module returned.
  assert.deepEqual(selectionCardIds({ span: spanF, ...forward }), [CARD_A, CARD_B]);
  assert.deepEqual(selectionCardIds({ span: spanR, ...reversed }), [CARD_A, CARD_B]);

  const of = (f, span) =>
    resolveSpanAction({
      span,
      reading: f.reading,
      findings: f.findings,
      cardsById: f.cardsById,
      mode: SPAN_MODES.PROBLEM,
      answer: ANSWER,
    });

  assert.deepEqual(
    of(reversed, spanR),
    of(forward, spanF),
    "the narrowing state is a function of the record and the selection alone",
  );
});

test("repeated renders of the narrowing state are identical", async () => {
  // Rendered, not just resolved: the state a person reads has to be stable, and a fresh
  // render of the shipped component is the honest way to say so.
  const { reading, findings, cardsById } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({ range: drag(body, 10, ANSWER.length - 10), bodyEl: body });

  const renders = [];
  for (let i = 0; i < 3; i += 1) {
    renders.push(await renderSpanAffordances({ span, answer: ANSWER, reading, findings, cardsById }));
  }
  const [first, ...rest] = renders.map((r) => JSON.stringify(r));
  for (const other of rest) assert.equal(other, first, "three renders, one frame");
});

test("the rendered narrowing state offers no way to pick a card", async () => {
  const { reading, findings, cardsById } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({ range: drag(body, 10, ANSWER.length - 10), bodyEl: body });
  const tree = await renderSpanAffordances({ span, answer: ANSWER, reading, findings, cardsById });

  const buttons = [];
  const text = [];
  (function walkVNode(node) {
    if (node == null || node === false || node === true) return;
    if (Array.isArray(node)) return node.forEach(walkVNode);
    if (typeof node === "string" || typeof node === "number") return void text.push(String(node));
    if (typeof node !== "object") return;
    if (node.type === "button" || node.type === "a") buttons.push(node.type);
    walkVNode(node.children);
  })(tree);

  const rendered = text.join("");
  assert.deepEqual(buttons, [], "no affordance that picks a card, because picking one is the founder's line");
  assert.equal(rendered.includes(narrowingLine(2)), true, "the count and the ask");
  assert.equal(rendered.includes(SPAN_UI.attribution), true, "one attribution line, still present");
  assert.equal(rendered.includes(QUESTION_A), false, "neither card's question leaks in");
  assert.equal(rendered.includes(QUESTION_B), false);
  assert.equal(rendered.includes(CARD_A), false, "and no card id reaches the surface");
  assert.equal(rendered.includes(CARD_B), false);
  // Never the word this surface is forbidden to use, in any state.
  assert.doesNotMatch(rendered, /\bwrong\b/i);
});

test("one card surfaces that card's existing question, verbatim and uncomposed", async () => {
  // The other side of the same ruling: composition is permitted on non-overlapping
  // selections only, so an overlapping selection re-enters the register's own question
  // rather than minting a second one about the same words.
  const { reading, findings, cardsById } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({ range: drag(body, 5, 40), bodyEl: body });

  const action = resolveSpanAction({
    span,
    reading,
    findings,
    cardsById,
    mode: SPAN_MODES.PROBLEM,
    answer: ANSWER,
  });
  assert.equal(action.kind, SPAN_ACTION.QUESTION);
  assert.equal(action.card_id, CARD_A);
  assert.equal(action.question, QUESTION_A, "verbatim off the card, not rephrased");
  assert.equal("message" in action, false, "nothing composed over a passage the register covers");
});

test("a selection over no card composes", async () => {
  const { reading, findings, cardsById } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({
    range: drag(body, FIRST.length + 5, FIRST.length + 40),
    bodyEl: body,
  });

  for (const mode of [SPAN_MODES.PROBLEM, SPAN_MODES.DESIRED]) {
    const action = resolveSpanAction({ span, reading, findings, cardsById, mode, answer: ANSWER });
    assert.equal(action.kind, SPAN_ACTION.COMPOSE, `${mode}: open prose is the composition case`);
    assert.equal(action.passage, ANSWER.slice(span.start, span.end));
    assert.equal("card_id" in action, false);
  }
});

test("the composed state renders two affordances and one attribution line", async () => {
  const { reading, findings, cardsById } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({
    range: drag(body, FIRST.length + 5, FIRST.length + 40),
    bodyEl: body,
  });
  const tree = await renderSpanAffordances({ span, answer: ANSWER, reading, findings, cardsById });

  const buttons = [];
  const attributions = [];
  (function walkVNode(node) {
    if (node == null || node === false || node === true) return;
    if (Array.isArray(node)) return node.forEach(walkVNode);
    if (typeof node !== "object") return;
    if (node.type === "button") buttons.push(node);
    if (String((node.props || {}).className || "") === "wb-span__attribution") attributions.push(node);
    walkVNode(node.children);
  })(tree);

  const labelOf = (b) => [].concat(b.children).flat(Infinity).filter((c) => typeof c === "string").join("");
  assert.deepEqual(
    buttons.map(labelOf),
    [SPAN_UI.problem_affordance, SPAN_UI.desired_affordance],
    "two affordances, in the founder's own words",
  );
  assert.deepEqual(buttons.map(labelOf), ["Click the problem", "Click what you want"]);
  assert.equal(attributions.length, 1, "exactly one attribution line — a line, never a block or a panel");
  assert.equal(attributions[0].children.flat(Infinity).join(""), SPAN_UI.attribution);
  // No event, no telemetry, no fetch: the only handler on either button is the copy.
  for (const b of buttons) {
    assert.deepEqual(Object.keys(b.props).filter((k) => k.startsWith("on")), ["onClick"]);
  }
});

test("a mark whose finding carries no card is not an overlap for this lane", async () => {
  // Recorded as a decision rather than an accident: no card means no existing question to
  // re-enter, so there is nothing for composition to duplicate.
  const findings = [findingOf(0, FIRST, null)].map(describeFinding);
  assert.equal(findings[0].verification_card_id, null);
  const reading = buildSourceReading({ artifactText: ANSWER, findings });
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({ range: drag(body, 5, 40), bodyEl: body });

  assert.deepEqual(selectionCardIds({ span, reading, findings }), []);
  const action = resolveSpanAction({
    span,
    reading,
    findings,
    cardsById: new Map(),
    mode: SPAN_MODES.PROBLEM,
    answer: ANSWER,
  });
  assert.equal(action.kind, SPAN_ACTION.COMPOSE);
});

test("one card id that resolves to no card offers nothing at all", async () => {
  // A dangling id degrades to silence rather than to a control that copies an empty
  // string — the same thing FindingQuestion does with a card it cannot find.
  const { reading, findings } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({ range: drag(body, 5, 40), bodyEl: body });

  const action = resolveSpanAction({
    span,
    reading,
    findings,
    cardsById: new Map(),
    mode: SPAN_MODES.PROBLEM,
    answer: ANSWER,
  });
  assert.equal(action.kind, SPAN_ACTION.NONE);
  assert.equal(
    await renderSpanAffordances({ span, answer: ANSWER, reading, findings, cardsById: new Map() }),
    null,
    "nothing is offered, so nothing is rendered",
  );
});

// ── 3. THE BODY IS THE BOUNDARY ──────────────────────────────────────────────

test("a selection that leaves the answer offers nothing rather than clipping", async () => {
  const { reading } = fixture();
  const root = toNodeTree(await renderSourceReading(reading, { answer: ANSWER }));
  const body = findByClass(root, "wb-source__body");
  const outside = { nodeType: 3, data: "somewhere else entirely", parentNode: null, childNodes: [] };
  const inside = boundaryAtAnswerIndex(body, 10, MARK_NUMBER_ATTR);

  assert.equal(resolveSelectionSpan({ range: rangeOf(inside, { node: outside, offset: 3 }), bodyEl: body }), null);
  assert.equal(resolveSelectionSpan({ range: rangeOf({ node: outside, offset: 3 }, inside), bodyEl: body }), null);
  assert.equal(
    resolveSelectionSpan({ range: rangeOf({ node: outside, offset: 0 }, { node: outside, offset: 5 }), bodyEl: body }),
    null,
    "a selection wholly outside the body is not this surface's selection",
  );
});

test("a caret is not a selection", async () => {
  const { reading } = fixture();
  const body = await bodyOf(reading);
  const point = boundaryAtAnswerIndex(body, 12, MARK_NUMBER_ATTR);
  assert.equal(resolveSelectionSpan({ range: rangeOf(point, point), bodyEl: body }), null);
  assert.equal(resolveSpanAction({ span: null }).kind, SPAN_ACTION.NONE);
});

test("an element boundary point descends to the equivalent text position", async () => {
  // Selecting a whole paragraph typically yields (p, 0) and (p, childCount) rather than
  // text-node offsets. Both have to mean the same thing as the character positions they
  // stand for, or a select-all resolves to nothing.
  const { reading } = fixture();
  const body = await bodyOf(reading);
  const span = resolveSelectionSpan({
    range: rangeOf({ node: body, offset: 0 }, { node: body, offset: body.childNodes.length }),
    bodyEl: body,
  });
  assert.deepEqual(span, { start: 0, end: ANSWER.length }, "select-all is the whole answer");
});

test("a boundary point in the body but outside every segment resolves to nothing", async () => {
  // Not reachable from the shipped markup today — every child of the body is a segment.
  // Asserted anyway, because the failure it prevents is a guessed offset, and a guess here
  // puts a quotation over words nobody selected.
  const { reading } = fixture();
  const body = await bodyOf(reading);
  const stray = { nodeType: 3, data: "stray", parentNode: body, childNodes: [] };
  assert.equal(resolveAnswerOffset({ node: stray, offset: 2, bodyEl: body }), null);
});
