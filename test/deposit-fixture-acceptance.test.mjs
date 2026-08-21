// The dense acceptance record, through the production path and out the other side.
//
// WHY THIS FILE EXISTS. Every other single-mode fixture carries one to three marks. A
// composition can read well at that count and fail at nine — marks crowding, one span
// opening inside a paragraph another already covers, record-level items losing their
// footing under a list long enough to bury them. So the acceptance record is nine: six
// positioned in the answer, three recorded against it as a whole.
//
// WHAT THE PORT SETTLED, AND IT IS THE POINT OF THE FILE. The visual-direction lane
// drew two of its nine as a bracketed REGION rather than a line, under a presentation
// vocabulary that named them "in-document-region" against the other four's
// "in-document-span". Read quickly, that is a second positioning mechanism the
// production path does not have, and standing it up would have meant a new enum member
// with no producer behind it. It is not one. The lane's own record gives both regions
// anchor_status QUOTED against original_answer, and both turn out to be single
// contiguous paragraphs. A region is a quotation that runs longer. It resolves through
// the ordinary path — model proposes the passage, server locates it, buildSourceReading
// cuts at its boundaries — with no branch and nothing invented.
//
// WHAT IS ASSERTED. That the record renders through the SHIPPED renderer, from the
// payload the ENDPOINT'S OWN adapter builds, with no fixture-specific behavior anywhere
// in the path. The board photographs the viewport, and at nine marks the list runs
// below the fold on both viewports, so the rows are proven here by execution rather
// than by picture.
//
// The fixture is QA acceptance data and nothing else: not production evidence, not a
// public example, not an archive record, and it reaches no consumer surface. Its
// content is ported verbatim from the review lane's frozen record — provenance and
// source hash are recorded at the port site in scripts/qa/scenarios.mjs.
//
// Run: node --test test/deposit-fixture-acceptance.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import {
  ANCHOR_CHANNEL,
  ANCHOR_STATUS,
  MARK_ORIENTATION_NOTE,
  RECORD_LEVEL_ABSENCE_NOTE,
  buildSourceReading,
  describeFinding,
  selectSubset,
} from "../reader-result.js";
import { MARK_NUMBER_ATTR, SPAN_SEGMENT_ATTR, resolveSelectionSpan } from "../reader-span-selection.js";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);

function componentSource(text, name) {
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = text.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

function stringConstant(text, name) {
  const m = new RegExp(`^const ${name} = ("(?:[^"\\\\]|\\\\.)*");$`, "m").exec(text);
  assert.ok(m, `workbench-app.jsx must define ${name} as a single-line string constant`);
  return JSON.parse(m[1]);
}

// THE PAYLOAD IS NOT WRITTEN HERE. It is the scenario's own route handler, which calls
// buildCanonicalSingle — the endpoint's adapter, imported by the harness rather than
// copied. So the object under test is one the endpoint can actually emit, and a change
// to the endpoint reaches this file without anyone remembering to update it.
const PAYLOAD = SCENARIOS["deposit-fixture"].routes["/api/read"]();
const ANSWER = PAYLOAD.receipt.open_run.answer;
const FINDINGS = selectSubset(PAYLOAD.result, "surfaced_findings").map(describeFinding);
const READING = buildSourceReading({ artifactText: ANSWER, findings: FINDINGS });

// ── The structure ────────────────────────────────────────────────────────────

test("nine marks, and the six that sit in the answer are the six the record positions", () => {
  assert.equal(READING.marks.length, 9, "the record is nine marks");

  const inDocument = READING.marks.filter((m) => m.in_document).map((m) => m.n);
  const recordLevel = READING.marks.filter((m) => !m.in_document).map((m) => m.n);
  // Read down the record these arrive 1,2,4,3,5,6: the record's order carrying the
  // document's numbering, which is the point. As sets they are still the first six and
  // the last three, because everything the answer can place is numbered before
  // anything it cannot — an absence has no position to sort it by.
  assert.deepEqual([...inDocument].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(recordLevel, [7, 8, 9]);

  // The channel is what decides it, not the ordinal. Six quotations resolved and three
  // findings had nothing to quote, and those are two different facts about the record
  // rather than one fact about where a mark happens to fall in the list.
  for (const m of READING.marks) {
    assert.equal(
      m.in_document,
      m.channel === ANCHOR_CHANNEL.QUOTED_SPAN,
      `mark ${m.n} is positioned exactly when its channel is a quoted span`,
    );
  }
});

test("a bracketed region is a longer quotation, and it needs no mechanism of its own", () => {
  // The two the lane drew as regions. Both are whole paragraphs, and both resolve as
  // ordinary quoted spans — same channel, same span shape, same everything as mark 1.
  // Picked by what makes them regions, not by numeral. The numerals moved when the body
  // started counting in document order, and a test that pinned them would be asserting
  // the display key instead of the thing the display key names.
  const regions = READING.marks.filter((m) => m.span && m.span.end - m.span.start > 140);
  assert.equal(regions.length, 2, "the lane drew two bracketed regions and no more");
  for (const m of regions) {
    assert.equal(m.channel, ANCHOR_CHANNEL.QUOTED_SPAN, `mark ${m.n} resolves on the quoted-span channel`);
    assert.ok(m.span, `mark ${m.n} carries a span`);
    assert.equal(
      ANSWER.slice(m.span.start, m.span.end),
      m.quote,
      `mark ${m.n} reproduces its passage from the answer`,
    );
  }

  // And they are genuinely long: each covers a whole paragraph, which is what made
  // them look like a different kind of thing in the first place.
  for (const m of regions) {
    assert.equal(ANSWER.includes(`\n\n${m.quote}`), true, `mark ${m.n} starts a paragraph`);
  }
});

test("the numbering is the document's, and the body still reassembles", () => {
  // This asserted the opposite until R4, and this fixture is why it could: its third
  // and fourth marks are recorded in the reverse of the order they appear in, so the
  // body used to open mark 4 before mark 3. The count has moved to the document. The
  // same two marks now arrive as 3 then 4, and a reader meeting a passage first meets
  // the lower number.
  //
  // What did NOT move is the agreement the old note credited record order for. Body and
  // list agree because there is ONE numbering and two views of it, which was never a
  // consequence of which order that numbering ran in. `marks` is still the record's
  // order — only `n` is laid over it differently.
  const positioned = READING.marks.filter((m) => m.in_document);
  assert.deepEqual(
    [...positioned].sort((a, b) => a.span.start - b.span.start).map((m) => m.n),
    [1, 2, 3, 4, 5, 6],
    "read the answer from the top and the marks count up",
  );

  // The record's order is untouched and still disagrees with the document's, which is
  // what keeps this fixture a real test of the renumbering rather than a no-op on it.
  assert.notDeepEqual(
    positioned.map((m) => m.n),
    [1, 2, 3, 4, 5, 6],
    "the fixture no longer disagrees with the document, so it cannot prove the reorder",
  );

  // Whatever the order, the segments are still the answer.
  assert.equal(READING.segments.map((s) => s.text).join(""), ANSWER);

  // Every mark begins exactly once, so no mark was dropped or split by the cutting.
  const begins = READING.segments.flatMap((s) => s.starts);
  assert.deepEqual([...begins].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
});

test("the three that quote nothing are ABSENT, and carry no position to render from", () => {
  const absent = FINDINGS.flatMap((f) => f.anchors).filter((a) => a.status === ANCHOR_STATUS.ABSENT);
  assert.equal(absent.length, 3);
  for (const a of absent) {
    assert.equal(a.channel, ANCHOR_CHANNEL.RECORD_LEVEL_ABSENCE);
    // Not a null span — no span key at all. An absence descriptor that published a
    // position field with nothing in it would still be publishing a position field.
    assert.equal(Object.prototype.hasOwnProperty.call(a, "span"), false);
  }
  const json = JSON.stringify(absent);
  for (const key of ["span", "start", "end", "offset", "caret", "position"]) {
    assert.equal(json.includes(`"${key}"`), false, `an absence descriptor must publish no ${key}`);
  }
});

// ── The rendering ────────────────────────────────────────────────────────────

const PANEL = componentSource(SRC, "MeasurementPanel");
const EVIDENCE = componentSource(SRC, "FindingEvidence");
const SOURCE_READING = componentSource(SRC, "SourceReading");
const MARK_NUMBER = componentSource(SRC, "MarkNumber");

// Not a component. The body and the list both call it to name the same finding, so it
// belongs to neither slice and has to be in scope for both.
const EXPLANATION_ID = componentSource(SRC, "findingExplanationId");

// Every component here is the shipped one, and every model function handed in is the
// real one. Nothing is stubbed except the two sub-panels this file makes no claim
// about, so a pass means the real dispatch ran over the real descriptors.
async function renderPanel() {
  const { code } = await transform(
    `${PANEL}\n${EVIDENCE}\n${SOURCE_READING}\n${MARK_NUMBER}\n${EXPLANATION_ID}\nreturn MeasurementPanel;`,
    { loader: "jsx", jsxFactory: "h", jsxFragment: "Frag" },
  );
  const h = (type, props, ...children) => {
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
  const stub = () => null;
  const make = new Function(
    "h",
    "Frag",
    "selectSubset",
    "describeFinding",
    "buildSourceReading",
    "ANCHOR_CHANNEL",
    "RECORD_LEVEL_ABSENCE_NOTE",
    "MARK_ORIENTATION_NOTE",
    "MEASURE_SECTION_LABEL",
    "MEASURE_INSPECT_SUMMARY",
    "MEASURE_SOURCE_LABEL",
    "RECEIPT_BOUNDARY",
    "ProvenanceStrip",
    "ReaderReceiptActions",
    // Stubbed. This fixture is the dense positioning record — nine marks, six of them
    // in the body — and every assertion below is about where a mark lands and what a
    // row says about it. The row's question control is proven against real register
    // cards in test/finding-question-promotion.test.mjs; here it would only add nodes
    // to the trees these assertions walk.
    "FindingQuestion",
    // The span lane. SourceReading resolves a person's selection through this module, so
    // the real exports are handed in rather than mocks of them — the marked body these
    // assertions walk is the body the resolver has to agree with.
    "SPAN_SEGMENT_ATTR",
    "MARK_NUMBER_ATTR",
    "resolveSelectionSpan",
    // Hooks. There is no DOM here, so the ref is null, the effect never runs and the
    // selection state holds its initial null — the body as it stands before anyone has
    // dragged a cursor, which is the only state this fixture is about.
    "useRef",
    "useState",
    "useEffect",
    // Stubbed for the same reason as FindingQuestion. With the selection state null the
    // shipped component returns null anyway; what it renders after a drag is proven in
    // test/reader-span-selection.test.mjs.
    "SpanAffordances",
    code,
  );
  const Panel = make(
    h,
    "Frag",
    selectSubset,
    describeFinding,
    buildSourceReading,
    ANCHOR_CHANNEL,
    RECORD_LEVEL_ABSENCE_NOTE,
    MARK_ORIENTATION_NOTE,
    stringConstant(SRC, "MEASURE_SECTION_LABEL"),
    stringConstant(SRC, "MEASURE_INSPECT_SUMMARY"),
    stringConstant(SRC, "MEASURE_SOURCE_LABEL"),
    "boundary",
    stub,
    stub,
    stub,
    SPAN_SEGMENT_ATTR,
    MARK_NUMBER_ATTR,
    resolveSelectionSpan,
    () => ({ current: null }),
    (initial) => [initial, () => {}],
    () => {},
    stub,
  );
  // The whole payload, unpicked. The panel reads measurement, result and receipt off
  // it exactly as it does from a live response.
  return Panel({ result: PAYLOAD, context: {} });
}

function collect(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) collect(n, out);
    return out;
  }
  if (typeof node === "object" && node.type) out.push(node);
  if (node && node.children) collect(node.children, out);
  return out;
}

function textOf(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) textOf(n, out);
    return out;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (node.children) textOf(node.children, out);
  return out;
}

const cls = (n) => (n.props && n.props.className) || "";

test("the shipped panel renders the answer with six marks in it", async () => {
  const nodes = collect(await renderPanel());

  const marks = nodes.filter((n) => n.type === "mark" && cls(n).includes("wb-source__mark"));
  assert.ok(marks.length >= 6, "at least one marked run per mark");

  // Every mark number 1..6 is printed over the body exactly once.
  const numbered = marks.flatMap((m) => String(m.props["data-mark"] || "").split(" ")).filter(Boolean);
  assert.deepEqual([...new Set(numbered)].sort(), ["1", "2", "3", "4", "5", "6"]);

  // And the body is still the answer, verbatim, once the numbers are taken back out.
  const body = nodes.find((n) => cls(n) === "wb-source__body");
  assert.ok(body, "the panel renders a source body");
  const printed = textOf(body.children).join("");
  // The outer span only. A `includes` match would also catch the screen-reader label
  // nested inside it and count its text twice, which is exactly six "mark " prefixes
  // of slack — enough to make a broken body look right.
  const withoutNumbers = collect(body)
    .filter((n) => cls(n) === "wb-mark-n")
    .flatMap((n) => textOf(n))
    .join("");
  assert.equal(printed.length - withoutNumbers.length, ANSWER.length);
});

test("the list below the fold carries all nine rows, three of them absences", async () => {
  const nodes = collect(await renderPanel());

  const rows = nodes.filter((n) => n.type === "li" && cls(n).includes("wb-measure__finding"));
  assert.equal(rows.length, 9, "nine rows, one per finding");

  // The three record-level items state the absence note and quote nothing. This is the
  // assertion the board cannot make: at nine marks the list is below the fold at both
  // captured viewports, so nothing photographs it.
  const notes = nodes.filter((n) => cls(n).includes("wb-measure__absence"));
  assert.equal(notes.length, 3);
  for (const n of notes) {
    // The note carries its own mark number and then the governed string, whole. The
    // number is asserted as a prefix rather than stripped, because an absence losing
    // its number is the failure this record was built to catch: it is the channel with
    // no position in the body, so the row is the only place its number appears.
    const printed = textOf(n).join("");
    assert.match(printed, /^mark [789]/, "a record-level absence is a numbered mark");
    assert.equal(printed.replace(/^mark [789]/, ""), RECORD_LEVEL_ABSENCE_NOTE);
  }

  // Six blockquotes, one per resolved quotation, and none for an absence.
  const quotes = nodes.filter((n) => n.type === "blockquote");
  assert.equal(quotes.length, 6);

  // Every row is numbered, and the numbering runs 1..9 across both channels — the
  // absences are numbered members of the account, not a footnote after the marks.
  const rowMarks = nodes
    .filter((n) => n.props && n.props["data-mark"] && !cls(n).includes("wb-source__mark"))
    .map((n) => String(n.props["data-mark"]));
  assert.deepEqual([...new Set(rowMarks)].sort((a, b) => a - b), ["1", "2", "3", "4", "5", "6", "7", "8", "9"]);
});

// ── The prohibition ──────────────────────────────────────────────────────────

test("no part of the path knows this record exists", () => {
  // The renderer is generic or it is not. If any of these components named the fixture,
  // named a region mode, or branched on a mark count, the frames above would be proof
  // of a special case rather than proof of the composition.
  for (const [name, source] of [
    ["MeasurementPanel", PANEL],
    ["FindingEvidence", EVIDENCE],
    ["SourceReading", SOURCE_READING],
    ["MarkNumber", MARK_NUMBER],
    ["findingExplanationId", EXPLANATION_ID],
  ]) {
    for (const forbidden of ["deposit", "PASSAGE_CONTEXT", "region", "fixture", "in-document-region"]) {
      assert.equal(
        source.toLowerCase().includes(forbidden.toLowerCase()),
        false,
        `${name} must not mention ${forbidden}`,
      );
    }
  }

  // And the enum member with no producer was never added to buy this record.
  const model = readFileSync(fileURLToPath(new URL("../reader-result.js", import.meta.url)), "utf8");
  assert.equal(model.includes("PASSAGE_CONTEXT"), false, "reader-result.js registers no unproduced channel");
});
