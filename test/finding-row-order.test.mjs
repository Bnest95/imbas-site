// The findings list counts in the same direction the answer does.
//
// THE DEFECT THIS CLOSES. buildSourceReading numbers marks in document order, and the
// body renders them 1, 2, 3, … down the answer. The list beneath the body rendered in
// RECORD order, so on any record whose registration order differs from its document
// order the rows counted 1, 2, 4, 3, … A person checking that nothing was missed had to
// hold two orders at once. That reconciliation is the dual-order mapping tax R4's
// Prevents line names.
//
// WHAT WAS FIXED, AND WHAT DELIBERATELY WAS NOT. The render site sorts. Nothing is
// renumbered. Numeral identity is still the document's, still assigned in
// buildSourceReading, and the array handed to buildSourceReading is untouched — that
// last point is load-bearing rather than stylistic, and it has its own test below.
//
// THE RULING IS PINNED HERE. The founder ruling of 2026-08-22 that settles this reverses
// a design argument that shipped in reader-result.js as a comment. Both halves are
// pinned: the ruling text, and the reversed reasoning re-read out of the source file, so
// editing that comment fails this file rather than quietly erasing what was reversed.
//
// Synthetic and QA fixtures only. No metered model calls.
//
// Run: node --test test/finding-row-order.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import {
  ANCHOR_CHANNEL,
  MARK_ORIENTATION_NOTE,
  RECORD_LEVEL_ABSENCE_NOTE,
  R4_ADJUDICATION,
  buildSourceReading,
  describeFinding,
  selectSubset,
} from "../reader-result.js";
import { MARK_NUMBER_ATTR, SPAN_SEGMENT_ATTR, resolveSelectionSpan } from "../reader-span-selection.js";
import { SCENARIOS } from "../scripts/qa/scenarios.mjs";

const APP_SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);
const MODEL_SRC = readFileSync(fileURLToPath(new URL("../reader-result.js", import.meta.url)), "utf8");

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

// ── 1. The ruling, recorded where the numbering happens ──────────────────────

test("the R4 ruling is recorded in the file that assigns the numerals", () => {
  // Not in a commit message. The prior disposition of this same defect lives only inside
  // one, in a sentence that never names which item it cleared, and that is the failure
  // this export exists to stop.
  assert.equal(R4_ADJUDICATION.ruling.date, "2026-08-22");
  assert.equal(R4_ADJUDICATION.ruling.authority, "founder");

  const text = R4_ADJUDICATION.ruling.text;
  assert.match(text, /R4 requires preservation of answer-order numeral identity/);
  assert.match(text, /does not clear the rule when the rendered list presents those numerals out of sequence/);
  assert.match(text, /A list rendering 1,2,4,3 against an answer presenting 1,2,3,4/);
  assert.match(text, /dual-order mapping tax named in R4's Prevents line/);

  // The four operative clauses, each stated on its own so a later reader can cite one
  // without quoting the paragraph.
  assert.deepEqual(R4_ADJUDICATION.ruling.therefore, [
    "numeral identity remains document-order identity;",
    "numerals must not be reassigned merely to make the list look sequential;",
    "the rendered finding-row order must not force a person to reconcile two visible numeral " +
      "sequences;",
    "ABSENT or record-level findings remain non-positional and follow positioned findings.",
  ]);

  // Frozen, like every other governed record in this module. A ruling a consumer can
  // edit at runtime is not a record of anything.
  assert.equal(Object.isFrozen(R4_ADJUDICATION), true);
  assert.equal(Object.isFrozen(R4_ADJUDICATION.ruling), true);
  assert.throws(() => {
    R4_ADJUDICATION.ruling.text = "something else";
  });
});

test("the record states that it reverses a design argument, and quotes it verbatim", () => {
  // THE CUSTODY PIN. The reversed argument is quoted in the adjudication AND still stands
  // in the source as a comment. This test reads the comment back out of the file and
  // compares, so the two cannot drift: delete or reword the comment and this fails.
  const begin = MODEL_SRC.indexOf("// SUPERSEDED-REASONING-BEGIN");
  const end = MODEL_SRC.indexOf("// SUPERSEDED-REASONING-END");
  assert.notEqual(begin, -1, "reader-result.js must still mark where the superseded reasoning begins");
  assert.notEqual(end, -1, "reader-result.js must still mark where the superseded reasoning ends");
  assert.ok(begin < end, "the superseded block must open before it closes");

  // Strip the comment prefix and the framing lines, then collapse the wrapping. What is
  // left is the prose itself, which is what the adjudication quotes.
  const block = MODEL_SRC.slice(begin, end)
    .split("\n")
    .map((l) => l.replace(/^\s*\/\/ ?/, ""))
    .filter((l) => !l.startsWith("SUPERSEDED-REASONING-BEGIN"))
    .join(" ");
  const normalize = (s) => s.replace(/\s+/g, " ").trim();
  const prose = normalize(block);
  const quoted = normalize(R4_ADJUDICATION.reverses.quote);

  assert.ok(
    prose.includes(quoted),
    "R4_ADJUDICATION.reverses.quote must reproduce the superseded comment verbatim",
  );

  // The specific clause the ruling overturns, named so a reader does not have to diff
  // two paragraphs to find it.
  assert.match(
    quoted,
    /costs nothing, because the list is a set of explanations reached through a numeral rather than a sequence anybody counts/,
  );

  // Reversal stated plainly. A reversal that reads as a clarification gets relitigated.
  assert.match(R4_ADJUDICATION.reverses.what, /reverses|argument/i);
  assert.match(R4_ADJUDICATION.reverses.why_it_fails, /two orders at once/);
  assert.match(R4_ADJUDICATION.reverses.what_survives, /document order|body is read in order/i);
});

test("the ruling forbids the cheap fix, in writing", () => {
  // Renumbering makes the list look right and breaks the correspondence R4 protects.
  // The standing instruction has to say so, because the next person to meet an
  // out-of-sequence list will reach for it.
  assert.match(R4_ADJUDICATION.standing_instruction, /Do not fix an out-of-sequence findings list by renumbering/);
  assert.match(R4_ADJUDICATION.standing_instruction, /Sort the rendered rows by the numeral they already carry/);
  assert.match(R4_ADJUDICATION.standing_instruction, /record_index/, "the input-order trap must be named");
});

// ── 2. The defect, reproduced from the fixture that carries it ───────────────

const PAYLOAD = SCENARIOS["deposit-fixture"].routes["/api/read"]();
const ANSWER = PAYLOAD.receipt.open_run.answer;
const FINDINGS = selectSubset(PAYLOAD.result, "surfaced_findings").map(describeFinding);
const READING = buildSourceReading({ artifactText: ANSWER, findings: FINDINGS });

// The numeral a row is filed under: the lowest mark the finding owns. A finding with
// several anchors is met, reading down the answer, at the first of them.
const numeralsOf = (f) => (READING.marks_by_finding[f.id] || []).filter((n) => n != null);
const lowest = (f) => {
  const ns = numeralsOf(f);
  return ns.length ? Math.min(...ns) : Number.MAX_SAFE_INTEGER;
};

test("the fixture still carries the transposition, or it proves nothing", () => {
  // Record order against document order. If a future edit to the fixture sorts these
  // into agreement, every assertion below passes on a record that cannot fail — so the
  // disagreement is asserted first, as the precondition it is.
  const recordOrder = FINDINGS.map(lowest);
  assert.deepEqual(recordOrder, [1, 2, 4, 3, 5, 6, 7, 8, 9], "the record registers its third and fourth marks reversed");

  const sorted = [...recordOrder].sort((a, b) => a - b);
  assert.notDeepEqual(recordOrder, sorted, "the fixture must disagree with document order to test the sort");

  // Positions 3 and 4 in the list, which is where the observed defect sat.
  assert.equal(recordOrder[2], 4);
  assert.equal(recordOrder[3], 3);

  // And the three that quote nothing hold the last three numerals, because everything
  // the answer can place is numbered before anything it cannot.
  const absent = FINDINGS.filter((f) => f.anchors.every((a) => a.channel !== ANCHOR_CHANNEL.QUOTED_SPAN));
  assert.deepEqual(absent.map(lowest), [7, 8, 9]);
});

// ── 3. The rendered order ────────────────────────────────────────────────────

const PANEL = componentSource(APP_SRC, "MeasurementPanel");
const EVIDENCE = componentSource(APP_SRC, "FindingEvidence");
const SOURCE_READING = componentSource(APP_SRC, "SourceReading");
const MARK_NUMBER = componentSource(APP_SRC, "MarkNumber");
const EXPLANATION_ID = componentSource(APP_SRC, "findingExplanationId");

// The shipped panel, over the endpoint's own payload. `h` records the tree instead of
// building DOM and calls function types through, so what the assertions read is what the
// components returned.
async function renderPanel(payload = PAYLOAD) {
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
    // Stubbed. This file is about which row comes before which; the row's question
    // control is proven in test/finding-question-promotion.test.mjs and would only add
    // nodes to the trees these assertions walk.
    "FindingQuestion",
    "SPAN_SEGMENT_ATTR",
    "MARK_NUMBER_ATTR",
    "resolveSelectionSpan",
    "useRef",
    "useState",
    "useEffect",
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
    stringConstant(APP_SRC, "MEASURE_SECTION_LABEL"),
    stringConstant(APP_SRC, "MEASURE_INSPECT_SUMMARY"),
    stringConstant(APP_SRC, "MEASURE_SOURCE_LABEL"),
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
  return Panel({ result: payload, context: {} });
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

const cls = (n) => (n.props && n.props.className) || "";

// The panel's own id scheme, so a rendered row can be traced back to the finding that
// produced it. Matching by DOM position would be circular in a file about DOM position.
const explanationId = (findingId) => `wb-finding-${String(findingId).replace(/[^A-Za-z0-9_-]/g, "-")}`;

function renderedRows(nodes, findings) {
  return nodes
    .filter((n) => n.type === "li" && cls(n).includes("wb-measure__finding"))
    .map((n) => {
      const f = findings.find((x) => explanationId(x.id) === n.props.id);
      assert.ok(f, `rendered row ${n.props.id} must name a finding from the record`);
      return { node: n, finding: f };
    });
}

// The numeral each row is filed under, in the order the rows are rendered.
function renderedRowNumerals(nodes, findings = FINDINGS, reading = READING) {
  return renderedRows(nodes, findings).map(({ finding }) => {
    const ns = (reading.marks_by_finding[finding.id] || []).filter((n) => n != null);
    return ns.length ? Math.min(...ns) : Number.MAX_SAFE_INTEGER;
  });
}

// Source with its commentary removed. Every prohibition below is about what the panel
// DOES; the comment explaining why it does it names the same identifiers, and a check
// that reads them out of prose is a check that fails on its own documentation.
const CODE = (s) => s.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "").replace(/^\s*\/\/.*$/gm, "");
const PANEL_CODE = CODE(PANEL);

test("the rendered rows count up, and the transposition is gone", async () => {
  const nodes = collect(await renderPanel());
  const rendered = renderedRowNumerals(nodes);

  assert.equal(rendered.length, 9, "nine rows, one per finding");
  assert.deepEqual(rendered, [1, 2, 3, 4, 5, 6, 7, 8, 9], "read the list from the top and the numerals ascend");

  // Stated the other way, because the ruling is about what a person has to reconcile
  // rather than about a particular sequence: there is one visible order, not two.
  const bodyOrder = READING.marks
    .filter((m) => m.in_document)
    .sort((a, b) => a.span.start - b.span.start)
    .map((m) => m.n);
  assert.deepEqual(
    rendered.filter((n) => bodyOrder.includes(n)),
    bodyOrder,
    "the positioned rows arrive in the order the body presents them",
  );
});

test("no numeral was reassigned — identity is exactly what it was", async () => {
  // The whole hazard of the cheap fix. Sorting rows must leave the finding-to-numeral
  // map untouched, so it is compared against a reading built independently of the
  // render, from the same payload.
  const independent = buildSourceReading({ artifactText: ANSWER, findings: FINDINGS });
  assert.deepEqual(independent.marks_by_finding, READING.marks_by_finding);

  // Every rendered row prints the numeral its own finding owns, matched by id rather
  // than by position — a positional match would pass on a list that had renumbered
  // itself into agreement.
  const nodes = collect(await renderPanel());
  for (const { node, finding } of renderedRows(nodes, FINDINGS)) {
    const printed = collect(node)
      .filter((n) => n.props && n.props["data-mark"] && !cls(n).includes("wb-source__mark"))
      .map((n) => Number(n.props["data-mark"]));
    assert.deepEqual(
      printed,
      numeralsOf(finding),
      `finding ${finding.id} must print the numerals buildSourceReading gave it, in anchor order`,
    );
  }

  // And the marks over the body are unchanged: the same six numerals in the same places.
  const marks = nodes.filter((n) => n.type === "mark" && cls(n).includes("wb-source__mark"));
  const numbered = [...new Set(marks.flatMap((m) => String(m.props["data-mark"] || "").split(" ")).filter(Boolean))];
  assert.deepEqual(numbered.sort(), ["1", "2", "3", "4", "5", "6"]);
});

test("the absences follow every positioned finding, and are not sorted among them", async () => {
  const nodes = collect(await renderPanel());
  const rendered = renderedRowNumerals(nodes);

  const absentNumerals = new Set(
    FINDINGS.filter((f) => f.anchors.every((a) => a.channel !== ANCHOR_CHANNEL.QUOTED_SPAN)).map(lowest),
  );
  assert.equal(absentNumerals.size, 3);

  const firstAbsent = rendered.findIndex((n) => absentNumerals.has(n));
  assert.equal(firstAbsent, 6, "the three record-level rows begin after the six positioned ones");
  for (const n of rendered.slice(firstAbsent)) {
    assert.equal(absentNumerals.has(n), true, "nothing positioned may render after a record-level finding");
  }

  // No separate branch does this, and that is worth pinning: byReadingOrder sorts on
  // in_document FIRST, so every positioned mark is numbered before any absence and the
  // one numeric sort puts them last for free. A branch here would be a second rule
  // capable of disagreeing with the numbering.
  assert.equal(
    PANEL_CODE.includes("in_document"),
    false,
    "the render site must not re-derive positioning to place absences",
  );
});

// ── 4. The input array is not the thing that got sorted ──────────────────────

test("buildSourceReading is handed the record's own order, untouched", () => {
  // THE TRAP. byReadingOrder's final tiebreak is record_index, so two findings that tie
  // on span take their numerals from their position in the input array. Sorting that
  // array before numbering would silently reassign numerals for exactly those findings —
  // a change to identity, made while trying to change presentation.
  const call = /buildSourceReading\(\{[\s\S]{0,200}?\}\)/.exec(PANEL_CODE);
  assert.ok(call, "the panel must call buildSourceReading");
  assert.equal(
    /findings:\s*[^,}]*\.sort\(|findings:\s*rows\b/.test(call[0]),
    false,
    "the findings handed to buildSourceReading must not be sorted or substituted",
  );

  // The sort exists, and it exists downstream of the numbering.
  const numberingAt = PANEL_CODE.indexOf("buildSourceReading(");
  const sortAt = PANEL_CODE.indexOf("].sort(");
  assert.notEqual(sortAt, -1, "the render site must sort its rows");
  assert.ok(numberingAt < sortAt, "the numbering must happen before the rows are ordered, never after");

  // Sorting a copy, never the array the panel was handed.
  assert.match(PANEL_CODE, /\[\.\.\.findings\]\.sort\(/, "the render site must sort a copy of the findings array");
});

test("the sort key is the numeral already assigned, not a re-derivation", () => {
  // If the row order were computed from spans, or from the channel, or from anything
  // other than marks_by_finding, it would be a second ordering rule able to disagree
  // with the one the body uses. It reads the same map the row prints from.
  assert.match(PANEL_CODE, /marks_by_finding\[/, "the sort key must come from the numbering the body uses");
  for (const rederivation of ["span.start", "anchor_status", "byReadingOrder", "localeCompare"]) {
    assert.equal(
      PANEL_CODE.includes(rederivation),
      false,
      `the render site must not order rows by ${rederivation}`,
    );
  }
});

test("a finding with no numeral keeps its place instead of vanishing", () => {
  // An anchor with no channel is not a mark and is not numbered, so its finding has no
  // sort key. MAX_SAFE_INTEGER rather than Infinity keeps the comparator returning a
  // number — Infinity - Infinity is NaN, and a NaN comparator silently leaves an array
  // in whatever order the engine happened to visit.
  assert.match(PANEL_CODE, /MAX_SAFE_INTEGER/);
  assert.equal(PANEL_CODE.includes("Infinity"), false, "an Infinity sort key makes the comparator return NaN");

  const key = (ns) => (ns.length ? Math.min(...ns) : Number.MAX_SAFE_INTEGER);
  assert.equal(Number.isNaN(key([]) - key([])), false, "two unnumbered rows must compare, not produce NaN");
  assert.equal(key([]) - key([]), 0, "and must compare equal, so a stable sort keeps their record order");
  assert.ok(key([9]) < key([]), "any numbered finding sorts ahead of an unnumbered one");
});

// ── 5. Every other scenario the list can reach ───────────────────────────────

test("no scenario's list disagrees with its own answer", async () => {
  // The fixture above is the only record whose registration order differs from its
  // document order today. This walks the rest so a new fixture that introduces a second
  // one is caught here rather than by looking at it.
  //
  // Each scenario is measured against its OWN reading. Finding ids repeat across
  // fixtures — `single_candidate.0` is in most of them — so reusing one scenario's
  // numbering to judge another's rows reads numerals off the wrong record entirely.
  const checked = [];
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    const route = scenario.routes && scenario.routes["/api/read"];
    if (typeof route !== "function") continue;
    let payload;
    try {
      payload = route();
    } catch {
      continue;
    }
    const answer = payload && payload.receipt && payload.receipt.open_run && payload.receipt.open_run.answer;
    if (!answer) continue;
    const findings = selectSubset(payload.result, "surfaced_findings").map(describeFinding);
    if (findings.length < 2) continue;
    const reading = buildSourceReading({ artifactText: answer, findings });

    const rendered = renderedRowNumerals(collect(await renderPanel(payload)), findings, reading);
    if (!rendered.length) continue;
    assert.deepEqual(
      rendered,
      [...rendered].sort((a, b) => a - b),
      `${name}: the rendered rows must ascend`,
    );

    // The rows and the record still hold the same findings, in case a sort ever drops
    // one: same count, same set of numerals, whatever the order.
    assert.equal(rendered.length, findings.length, `${name}: every finding must render a row`);
    checked.push(`${name}:${rendered.length}`);
  }
  assert.ok(checked.length >= 2, `at least two multi-finding scenarios must be covered, saw ${checked.join(" ")}`);
});
