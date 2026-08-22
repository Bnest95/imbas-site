// reader-span-selection.js — resolving a person's text selection back to offsets in the
// inspected answer, and deciding what may be offered over it.
//
// THE PROBLEM THIS SOLVES. The source-reading body renders the answer as a run of
// segments, cut at every mark boundary, with mark numerals injected before the marked
// words. A person drags across some words. The browser hands back DOM nodes and
// intra-node offsets, which say nothing about where those words sit in the answer. Every
// offset this module produces is an index into `receipt.open_run.answer` and nothing else,
// because that is the one string the marks were resolved against.
//
// WHY THE DOM CARRIES THE OFFSETS. `data-start` is emitted on EVERY segment element,
// marked and unmarked alike, so resolution never depends on counting segments, on
// traversal order, or on reconstructing the cut. A boundary point resolves by walking up
// to its nearest `[data-start]` and adding the answer characters that precede it inside
// that element. Unmarked segments carry the attribute too: without it, a selection that
// begins in ordinary prose would have to count backwards through its siblings, and the
// count would be wrong the moment a mark numeral sat among them.
//
// MARK NUMERALS ARE NOT ANSWER TEXT. `MarkNumber` injects "mark 3" into the marked
// element, before the words it labels. Those characters exist in the DOM and do not exist
// in the answer. Every walk in this module skips `[data-mark-number]` subtrees, and a
// boundary point that lands INSIDE one resolves to the segment's own start — the clean
// offset, because a numeral renders ahead of the text it labels and there is no answer
// character under the person's cursor. The test proves the exclusion is load-bearing by
// walking the same DOM without it and showing the offsets drift.
//
// FORWARD AND BACKWARD DRAGS ARE THE SAME SELECTION. Dragging right-to-left gives a
// Selection whose anchor is after its focus, and a Range whose boundary points can arrive
// in either order depending on how the caller built it. Resolution therefore ends in
// min/max over the two resolved offsets rather than trusting their order. Direction is a
// property of the gesture; the span is a property of the words.
//
// PURE JS, NO DOM GLOBALS. Like reader-paired.js and reader-check-vocab.js: no node:
// imports, and nothing here reaches for `document`, `window`, or `Node`. It operates on
// nodes handed to it through the standard interface — nodeType, parentNode, childNodes,
// data, hasAttribute, getAttribute — so a Node test drives it directly and the browser
// imports it unchanged.

import { READER_SPAN_BANK, SPAN_MODES, defaultSpanEntry } from "./reader-span-bank.js";

export const SPAN_SELECTION_VERSION = "span-selection.v1";

// The attribute that carries a segment's answer offset. One name, one place.
export const SPAN_SEGMENT_ATTR = "data-start";

// The attribute that marks a subtree as instrument chrome rather than answer text. It is
// an explicit contract rather than a class-name check: `wb-mark-n` is a styling hook and a
// later restyle could rename it, which would silently start counting numerals as answer
// characters — the exact defect that puts every offset after a mark out of register.
export const MARK_NUMBER_ATTR = "data-mark-number";

// ── UI copy ──────────────────────────────────────────────────────────────────────────
// Every string here is registered in BOTH lint lanes by test/check-vocab-lint.test.mjs.
// Registration is not optional and unregistered is not "passing" — it is unexamined.
//
// The two affordance labels are the founder's own phrasing family, pre-cleared: "Click the
// problem" / "Click what you want". They are kept verbatim rather than smoothed into
// button-ese ("This is the problem") because his words govern copy. The natural label for
// the first mode — "Click the part that is wrong" — fails check-vocab.v2 on `wrong`, which
// is why the word does not appear on this surface at all.
export const SPAN_UI = Object.freeze({
  problem_affordance: "Click the problem",
  desired_affordance: "Click what you want",

  // Same two words the register's own copy affordance uses. One act, one name.
  copied_affordance: "Copied",
  copy_failed: "Could not copy",

  // ONE ATTRIBUTION LINE, and it is the whole of the attribution. Not a block, not a
  // panel, not a disclosure — a line beside the two buttons. Its semantic content is
  // fixed: the selection is the person's choice, and Imbas did not mark it. It exists
  // because the surrounding surface is dense with marks that Imbas DID place, and a
  // person who has just dragged across words needs to know which kind of highlight they
  // are looking at. Stated positively first (what the person did), then the boundary.
  attribution: "You selected this passage. Imbas did not mark it.",

  // The narrowing state. ONE template with the live count set into it — never a parallel
  // sentence per count — so the number a person reads and the number the code resolved
  // cannot drift apart.
  narrowing_template: "This selection touches {n} findings. Narrow it to one.",
});

// The narrowing line for a given count, built from the one template.
export function narrowingLine(count) {
  return SPAN_UI.narrowing_template.replace("{n}", String(count));
}

// What the surface may offer over a selection. A closed set; nothing else is reachable.
export const SPAN_ACTION = Object.freeze({
  // The selection overlaps exactly one finding that carries a register card. That card's
  // existing question is surfaced verbatim. No composition happens.
  QUESTION: "question",
  // The selection touches two or more distinct cards. No card is chosen and nothing is
  // composed; the person is asked to narrow.
  NARROW: "narrow",
  // The selection overlaps no card. The bank composes.
  COMPOSE: "compose",
  // Nothing may be offered. See resolveSpanAction for the one case that reaches this.
  NONE: "none",
});

// ── DOM walking ──────────────────────────────────────────────────────────────────────

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const isElement = (n) => !!n && n.nodeType === ELEMENT_NODE;
const isText = (n) => !!n && n.nodeType === TEXT_NODE;

function childrenOf(node) {
  const kids = node && node.childNodes;
  if (!kids || typeof kids.length !== "number") return [];
  const out = [];
  for (let i = 0; i < kids.length; i++) out.push(kids[i]);
  return out;
}

function hasAttr(node, name) {
  return isElement(node) && typeof node.hasAttribute === "function" && node.hasAttribute(name);
}

const isMarkNumber = (node) => hasAttr(node, MARK_NUMBER_ATTR);

// Is `node` inside `root` (or is it `root`)? Walks parents rather than calling
// Node.contains, so a minimal node implementation satisfies this module.
function isWithin(node, root) {
  let n = node;
  while (n) {
    if (n === root) return true;
    n = n.parentNode;
  }
  return false;
}

// Is the boundary point sitting inside instrument chrome rather than answer text?
function inMarkNumber(node, stopAt) {
  let n = node;
  while (n && n !== stopAt) {
    if (isMarkNumber(n)) return true;
    n = n.parentNode;
  }
  return false;
}

// The nearest ancestor-or-self carrying data-start, bounded by the body. Returns null when
// the point is in the body but outside every segment.
function segmentElementFor(node, bodyEl) {
  let n = isElement(node) ? node : node && node.parentNode;
  while (n) {
    if (hasAttr(n, SPAN_SEGMENT_ATTR)) return n;
    if (n === bodyEl) return null;
    n = n.parentNode;
  }
  return null;
}

// A DOM boundary point may sit on an element with a CHILD INDEX rather than on a text node
// with a character offset — selecting a whole paragraph typically yields (p, 0) and
// (p, childCount). Descend to the equivalent text-node position so everything downstream
// handles one shape. The guard bounds a malformed tree rather than trusting it.
function normalizeToTextBoundary(node, offset) {
  let n = node;
  let o = Number.isFinite(offset) ? offset : 0;
  let guard = 0;
  while (isElement(n) && guard++ < 10000) {
    const kids = childrenOf(n);
    if (!kids.length) break;
    if (o >= kids.length) {
      n = kids[kids.length - 1];
      o = isText(n) ? n.data.length : childrenOf(n).length;
    } else {
      n = kids[o];
      o = 0;
    }
  }
  return { node: n, offset: o };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Answer characters inside `segEl` that precede the boundary point, skipping mark-number
// subtrees entirely. Document order, depth first — the same order the text reads in.
function precedingAnswerChars(segEl, targetNode, targetOffset) {
  let count = 0;
  let found = false;
  const visit = (n) => {
    if (found) return;
    if (isMarkNumber(n)) return; // chrome: contributes no answer characters
    if (isText(n)) {
      const len = typeof n.data === "string" ? n.data.length : 0;
      if (n === targetNode) {
        count += clamp(targetOffset, 0, len);
        found = true;
        return;
      }
      count += len;
      return;
    }
    if (n === targetNode) {
      found = true;
      return;
    }
    for (const kid of childrenOf(n)) {
      visit(kid);
      if (found) return;
    }
  };
  for (const kid of childrenOf(segEl)) {
    visit(kid);
    if (found) break;
  }
  return count;
}

// One boundary point → one offset into the answer, or null when the point does not
// resolve. Null is returned rather than a guessed offset in every ambiguous case: a point
// outside the body, a point in the body but outside every segment, or a segment whose
// data-start is not a number. A guess here would put a composed quotation over the wrong
// words, which is the one failure this whole module exists to prevent.
export function resolveAnswerOffset({ node, offset, bodyEl }) {
  if (!node || !bodyEl) return null;
  if (!isWithin(node, bodyEl)) return null;

  const norm = normalizeToTextBoundary(node, offset);
  const segEl = segmentElementFor(norm.node, bodyEl);
  if (!segEl) return null;

  const base = Number(segEl.getAttribute(SPAN_SEGMENT_ATTR));
  if (!Number.isFinite(base)) return null;

  // A numeral has no answer character under it. Mark numerals render ahead of the words
  // they label, so the clean resolution is the start of the segment's own text.
  if (inMarkNumber(norm.node, segEl)) return base;

  return base + precedingAnswerChars(segEl, norm.node, norm.offset);
}

// Two boundary points → one canonical span. THIS is where drag direction stops mattering:
// the two resolved offsets are ordered by min/max, not by the order they arrived in. A
// right-to-left drag and a left-to-right drag over the same words produce byte-identical
// {start, end}.
export function resolveSpanBetween(pointA, pointB, bodyEl) {
  if (!pointA || !pointB) return null;
  const a = resolveAnswerOffset({ node: pointA.node, offset: pointA.offset, bodyEl });
  const b = resolveAnswerOffset({ node: pointB.node, offset: pointB.offset, bodyEl });
  if (a === null || b === null) return null; // either end unresolvable: offer nothing
  const start = Math.min(a, b);
  const end = Math.max(a, b);
  if (end <= start) return null; // collapsed: a caret is not a selection
  return { start, end };
}

// Adapter from a DOM Range. Both boundary points must sit inside the body; a selection
// that starts in the answer and ends in the explanation list below it resolves to null and
// offers nothing, rather than silently clipping to the body's edge.
export function resolveSelectionSpan({ range, bodyEl }) {
  if (!range || !bodyEl) return null;
  return resolveSpanBetween(
    { node: range.startContainer, offset: range.startOffset },
    { node: range.endContainer, offset: range.endOffset },
    bodyEl,
  );
}

// ── Overlap ──────────────────────────────────────────────────────────────────────────

// Do a mark and a selection share at least one character?
const intersects = (mark, span) => mark.start < span.end && mark.end > span.start;

// The set of distinct verification_card_id values across findings whose marks intersect
// the selection. This is the definition of "overlap" for this lane, and it is deliberately
// about CARDS rather than about marks: two marks belonging to one finding, or two findings
// routed to the same card, are one thing to ask about, not two.
//
// SORTED, so the result is a function of the record and the selection alone. An unsorted
// set would depend on the order marks happen to be walked, and the narrowing state's count
// would be stable while the identity behind a size-1 result was not.
export function selectionCardIds({ span, reading, findings }) {
  if (!span || !reading) return [];
  const byId = new Map((findings || []).map((f) => [f && f.id, f]));
  const ids = new Set();
  for (const m of reading.marks || []) {
    if (!m || !m.in_document || !m.span) continue;
    if (!intersects(m.span, span)) continue;
    const finding = byId.get(m.finding_id);
    const cardId = finding && finding.verification_card_id;
    if (cardId) ids.add(cardId);
  }
  return [...ids].sort();
}

// What may be offered over this selection. The whole decision, in one place.
//
// TWO OR MORE CARDS — narrow. No card is chosen and nothing is composed. Choosing one
// would be the surface deciding which of a person's two findings they meant, and composing
// a fresh question over a passage the register already covers twice would put a second,
// unregistered question beside two existing ones.
//
// EXACTLY ONE CARD — that card's existing question, verbatim. Composition is permitted on
// non-overlapping selections only, so an overlapping selection re-enters the card's own
// question rather than minting a second one about the same words.
//
// ONE CARD ID THAT RESOLVES TO NO CARD — nothing. This is the only path to NONE. The
// selection overlaps, so composition is not permitted; the card is missing, so there is no
// question to surface. A dangling id degrades to silence rather than to a control that
// copies an empty string, exactly as FindingQuestion does.
//
// NO CARDS — compose. This includes selections over marks whose findings carry no
// verification_card_id: no card means no overlap for this lane's purposes.
export function resolveSpanAction({ span, reading, findings, cardsById, mode, answer }) {
  if (!span) return { kind: SPAN_ACTION.NONE };
  const ids = selectionCardIds({ span, reading, findings });

  if (ids.length >= 2) {
    return { kind: SPAN_ACTION.NARROW, count: ids.length, line: narrowingLine(ids.length) };
  }

  if (ids.length === 1) {
    const card = cardsById && typeof cardsById.get === "function" ? cardsById.get(ids[0]) : null;
    const question = card && typeof card.verification_question === "string" ? card.verification_question.trim() : "";
    if (!question) return { kind: SPAN_ACTION.NONE };
    return { kind: SPAN_ACTION.QUESTION, card_id: ids[0], question, card };
  }

  const composed = composeSpanRequest({ mode, answer, span });
  if (!composed) return { kind: SPAN_ACTION.NONE };
  return { kind: SPAN_ACTION.COMPOSE, ...composed };
}

// ── Composition ──────────────────────────────────────────────────────────────────────

// The composed message: the bank's instruction, then the selected passage quoted verbatim
// off the answer. VERBATIM is the contract — the passage is sliced straight out of
// `receipt.open_run.answer` at the resolved offsets, never re-derived from the DOM, never
// trimmed, never normalized. If the offsets are right the quotation is right, and if they
// are wrong the quotation shows it rather than hiding it behind cleanup.
//
// No model call. Nothing here asks anything to generate text; the instruction is fixed
// authored copy and the passage is the person's own words off their own answer.
export function composeSpanRequest({ mode, answer, span }) {
  const entry = defaultSpanEntry(mode);
  if (!entry || !span) return null;
  const text = typeof answer === "string" ? answer : "";
  const passage = text.slice(span.start, span.end);
  if (!passage) return null;
  return {
    entry,
    entry_id: entry.id,
    instruction_version: entry.instruction_version,
    passage,
    message: `${entry.instruction_text}\n\n"${passage}"`,
  };
}

// Every string this module can put in front of a person, for the lint lanes to walk. The
// bank's instruction texts are registered separately, against the boundary rule as well as
// the two lanes.
export const SPAN_REGISTERED_UI = Object.freeze([
  SPAN_UI.problem_affordance,
  SPAN_UI.desired_affordance,
  SPAN_UI.copied_affordance,
  SPAN_UI.copy_failed,
  SPAN_UI.attribution,
  SPAN_UI.narrowing_template,
  // The template with a live value set in, because that is the string a person actually
  // reads. A template that lints clean and renders dirty is a template that was never
  // linted.
  narrowingLine(2),
  narrowingLine(3),
]);

// The two modes an affordance can carry, paired with the label that offers them. Exported
// so the component renders from this rather than hard-coding the pairing.
export const SPAN_AFFORDANCES = Object.freeze([
  Object.freeze({ mode: SPAN_MODES.PROBLEM, label: SPAN_UI.problem_affordance }),
  Object.freeze({ mode: SPAN_MODES.DESIRED, label: SPAN_UI.desired_affordance }),
]);

// Re-exported so a caller needs one import for the lane.
export { READER_SPAN_BANK, SPAN_MODES };
