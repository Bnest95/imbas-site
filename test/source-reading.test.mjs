// READ — the answer with its marks positioned in it.
//
// WHAT WAS WRONG. Every QUOTED anchor has carried exact offsets into the artifact
// since the server started resolving them, and no surface consumed them. The interface
// printed the excerpt beside the finding and left the reader to locate it in their own
// text by eye. The evidence was the words; the position was thrown away. So a reader
// could not see how much of their answer was marked, how much was not, or where the
// Reader had actually looked.
//
// WHAT THIS FILE HOLDS. Three claims, and they are not the same claim:
//
//   1. THE REGISTER. The text the body renders is byte-identical to the text the spans
//      were resolved against. Proven end to end through the endpoint's own builders,
//      with a paired negative control showing the compose field is NOT that text.
//   2. THE POSITIONING. Segments cover the artifact exactly, overlap resolves without
//      dropping or shortening a mark, and a span that does not reproduce throws rather
//      than drawing a mark over the wrong words.
//   3. THE CHANNEL RULE, unchanged by the rebuild. In-document marks are QUOTED-only.
//      An absence is numbered and never positioned. An unresolved quotation is not a
//      mark at all and reaches no surface.
//
// The render assertions run the SHIPPED component, lifted from workbench-app.jsx by
// symbol name and compiled with the bundle's own JSX settings, because a source scan
// would prove the file contains the right words — which is also true of a component
// nothing mounts.
//
// Content-blind: synthetic answer, synthetic findings, no live base, no spend.
//
// Run: node --test test/source-reading.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import {
  ANCHOR_CHANNEL,
  ARTIFACT_ORIGINAL,
  SHAPE_SINGLE_CANDIDATE,
  buildFinding,
  buildSourceReading,
  describeFinding,
  selectSubset,
} from "../reader-result.js";
import { buildCanonicalSingle } from "../api/read.js";
import { buildSingleReceipt } from "../reader-receipt.js";

// ── The answer under inspection ──────────────────────────────────────────────
// Three sentences, so a mark can sit at the very start of the artifact, another can
// sit at the very end, and a stretch of unmarked text can stand between them. The
// offsets are never written down here; they are resolved, which is the point.

const ANSWER = [
  "A landlord must return a security deposit within 30 days of the tenant moving out.",
  "If the landlord keeps any part of the deposit, they have to send an itemized list of deductions.",
  "Most tenants get the full amount back without any trouble, so there is usually nothing to worry about.",
].join(" ");

const FIRST_SENTENCE = "A landlord must return a security deposit within 30 days of the tenant moving out.";
const LAST_SENTENCE =
  "Most tenants get the full amount back without any trouble, so there is usually nothing to worry about.";

function quotedFinding(index, quote, statement = `A statement ${index}.`) {
  return buildFinding({
    index,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement,
    quotations: { [ARTIFACT_ORIGINAL]: quote },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
}

function readingOf(findings, artifactText = ANSWER) {
  return buildSourceReading({ artifactText, findings: findings.map(describeFinding) });
}

// ── 1. THE REGISTER ──────────────────────────────────────────────────────────
//
// A mark is positioned by an offset into a string. If the surface renders a DIFFERENT
// string from the one the offsets were resolved against, every mark lands somewhere
// else and the interface points confidently at words nobody measured. Nothing about
// that failure is visible: the marks still look like marks.
//
// api/read.js hands `input.answer || ""` to the canonical builder and to the receipt
// builder in the same scope, so receipt.open_run.answer IS the artifact. This is that
// claim executed rather than read.

function endpointRun(answer) {
  const measurement = {
    findings: [
      { type: "candidate missing item", anchor: FIRST_SENTENCE, materiality: "One deadline, no jurisdiction." },
      { type: "candidate framing issue", anchor: LAST_SENTENCE, materiality: "The close lowers the stakes." },
    ],
  };
  const canonical = buildCanonicalSingle(measurement, answer, null);
  const receipt = buildSingleReceipt({
    generatedAt: "2026-08-12T00:00:00.000Z",
    question: "How long does a landlord have?",
    topic: "",
    declaredModel: "",
    answer,
    inspection: { completeness: "partial", the_read: "A read.", what_was_left_out: [], how_it_was_shaped: "" },
    measurement,
    canonical,
    provenance: {},
  });
  return { canonical, receipt };
}

test("the text the body renders is the text the spans were resolved against", () => {
  // The client trims on the way out, so this is what the endpoint receives and stores.
  const sent = ANSWER;
  const { canonical, receipt } = endpointRun(sent);
  const findings = selectSubset(canonical, "surfaced_findings").map(describeFinding);

  const spans = findings.flatMap((f) => f.anchors.filter((a) => a.span).map((a) => a));
  assert.equal(spans.length, 2, "the run must produce the spans this claim is about");

  // buildSourceReading re-derives every span before it positions anything, so a
  // register mismatch throws here rather than drawing a mark over the wrong words.
  const reading = buildSourceReading({ artifactText: receipt.open_run.answer, findings });
  assert.equal(reading.marks.every((m) => m.in_document), true, "every mark resolved against the receipt's answer");
  for (const m of reading.marks) {
    assert.equal(
      receipt.open_run.answer.slice(m.span.start, m.span.end),
      m.quote,
      "the receipt's answer must reproduce every span verbatim",
    );
  }
});

test("NEGATIVE CONTROL — the compose field is not that text, and the check catches it", () => {
  // What a person actually has in the textarea when they press the button: their
  // pasted answer with a leading blank line. buildReaderRequest trims it away, so the
  // server resolves offsets against the trimmed string and React state keeps the
  // untrimmed one. One newline is enough to move every mark.
  const composeState = `\n${ANSWER}`;
  const { canonical, receipt } = endpointRun(composeState.trim());

  assert.notEqual(composeState, receipt.open_run.answer, "the control is only a control if the two differ");

  const findings = selectSubset(canonical, "surfaced_findings").map(describeFinding);
  assert.throws(
    () => buildSourceReading({ artifactText: composeState, findings }),
    /does not reproduce its quotation/,
    "rendering the compose field against receipt-resolved offsets must fail loudly, not quietly misplace a mark",
  );

  // And the same findings against the artifact itself resolve, which is what makes the
  // failure above about the STRING and not about the findings.
  const ok = buildSourceReading({ artifactText: receipt.open_run.answer, findings });
  assert.equal(ok.marks.every((m) => m.in_document), true);
});

test("a span that drifts by one code unit throws, and names what it could not reproduce", () => {
  const [f] = [quotedFinding(0, FIRST_SENTENCE)];
  const described = describeFinding(f);
  const anchor = described.anchors.find((a) => a.span);
  const drifted = {
    ...described,
    anchors: [{ ...anchor, span: { ...anchor.span, start: anchor.span.start + 1, end: anchor.span.end + 1 } }],
  };
  assert.throws(
    () => buildSourceReading({ artifactText: ANSWER, findings: [drifted] }),
    /does not reproduce its quotation/,
  );
});

test("a span that runs past the end of the artifact throws before it is used", () => {
  const described = describeFinding(quotedFinding(0, LAST_SENTENCE));
  const anchor = described.anchors.find((a) => a.span);
  const overrun = {
    ...described,
    anchors: [{ ...anchor, span: { ...anchor.span, end: ANSWER.length + 5 } }],
  };
  assert.throws(
    () => buildSourceReading({ artifactText: ANSWER, findings: [overrun] }),
    /falls outside the artifact/,
  );
});

// ── 2. THE POSITIONING ───────────────────────────────────────────────────────

test("the segments are an exact cover of the answer, character for character", () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), quotedFinding(1, LAST_SENTENCE)]);
  assert.equal(
    reading.segments.map((s) => s.text).join(""),
    ANSWER,
    "the pieces must rejoin into the answer with nothing inserted, dropped, or reordered",
  );
  // And they are contiguous and ordered, which is what makes the join above a cover
  // rather than a coincidence.
  let cursor = 0;
  for (const seg of reading.segments) {
    assert.equal(seg.start, cursor, "a segment must begin where the last one ended");
    assert.equal(seg.end, seg.start + seg.text.length, "a segment's bounds must match its own text");
    cursor = seg.end;
  }
  assert.equal(cursor, ANSWER.length, "the last segment must reach the end of the answer");
});

test("every marked segment carries the marks that span it, and the unmarked ones carry none", () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), quotedFinding(1, LAST_SENTENCE)]);
  for (const seg of reading.segments) {
    for (const n of seg.marks) {
      const mark = reading.marks.find((m) => m.n === n);
      assert.ok(mark.span.start <= seg.start && mark.span.end >= seg.end, `mark ${n} does not span its own segment`);
    }
    for (const mark of reading.marks.filter((m) => m.in_document)) {
      const overlaps = mark.span.start < seg.end && mark.span.end > seg.start;
      assert.equal(
        seg.marks.includes(mark.n),
        overlaps,
        `segment [${seg.start}, ${seg.end}) disagrees with mark ${mark.n} about whether it covers it`,
      );
    }
  }
});

test("two marks that share words produce one segment carrying both, and neither is shortened", () => {
  // Overlap is not hypothetical: a framing observation about a clause inside a sentence
  // an omission is anchored to is the ordinary case. The rule is that neither mark is
  // dropped, truncated, or reordered to make room for the other.
  const outer = "If the landlord keeps any part of the deposit, they have to send an itemized list of deductions.";
  const inner = "keeps any part of the deposit";
  const reading = readingOf([quotedFinding(0, outer), quotedFinding(1, inner)]);

  assert.equal(reading.marks.length, 2);
  assert.equal(reading.marks.every((m) => m.in_document), true, "both marks are in the document");

  const shared = reading.segments.filter((s) => s.marks.length > 1);
  assert.equal(shared.length, 1, "the shared words must be exactly one segment");
  assert.deepEqual(shared[0].marks, [1, 2], "and it must name both marks");
  assert.equal(shared[0].text, inner, "the shared segment is the inner mark's own words");

  // Full extent, both marks, reassembled from the segments that name them.
  for (const m of reading.marks) {
    const covered = reading.segments.filter((s) => s.marks.includes(m.n));
    assert.equal(covered.map((s) => s.text).join(""), m.quote, `mark ${m.n} lost part of its extent`);
  }

  // A mark is labelled once, where it begins, and not once per piece it was cut into.
  const starts = reading.segments.flatMap((s) => s.starts);
  assert.deepEqual(starts.slice().sort(), [1, 2], "each mark begins exactly once");
});

test("with no document there are no positions, and nothing throws", () => {
  // A caller holding the record but not the answer it was made against. The offsets
  // cannot be verified, so no mark is placed and no body renders. The marks are still
  // marks and still numbered; the list that quotes them needs no offsets.
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), quotedFinding(1, LAST_SENTENCE)], "");
  assert.deepEqual(reading.segments, [], "no document, no segments");
  assert.equal(reading.marks.length, 2, "the marks survive");
  assert.equal(reading.marks.every((m) => m.in_document === false), true);
  assert.equal(reading.marks.every((m) => m.span === null), true, "and none of them claims a position");
});

// ── 3. THE CHANNEL RULE ──────────────────────────────────────────────────────
//
// Ruling 3, unchanged by this rebuild: in-document marks are QUOTED-only, an absence
// renders outside the document with no fabricated position, and an unresolved
// quotation never surfaces. The rebuild is where that rule could most easily have been
// lost, because it is the first surface that has anywhere to put a position.

// No fixture shape. SHAPE_SINGLE_CANDIDATE already declares that its one role may
// surface absent — that is what SCAS settled — so the absence arm here runs on the
// shipped shape a live single read actually produces.
function absentFinding(index) {
  return buildFinding({
    index,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement: "The answer never names a jurisdiction.",
    quotations: { [ARTIFACT_ORIGINAL]: "" },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
}

function unresolvedFinding(index) {
  return buildFinding({
    index,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "framing_drift",
    statement: "A statement.",
    quotations: { [ARTIFACT_ORIGINAL]: "a sentence this answer does not contain" },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
}

test("an absence is numbered, and is in no segment anywhere in the body", () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), absentFinding(1)]);
  const absence = reading.marks.find((m) => m.channel === ANCHOR_CHANNEL.RECORD_LEVEL_ABSENCE);

  assert.ok(absence, "an absence is a mark the record holds and is counted as one");
  assert.equal(absence.n, 2, "and it takes its number in the record's own order");
  assert.equal(absence.in_document, false);
  assert.equal(absence.span, null, "with no position, because the record holds none");
  assert.equal(absence.quote, "", "and no words, because there are none");

  for (const seg of reading.segments) {
    assert.equal(seg.marks.includes(absence.n), false, "an absence must not be positioned in the body");
    assert.equal(seg.starts.includes(absence.n), false);
  }
  assert.equal(JSON.stringify(reading.segments).includes(`"${absence.n}"`), false);
});

test("NEGATIVE CONTROL — an unresolved quotation is not a mark and is numbered nowhere", () => {
  const findings = [quotedFinding(0, FIRST_SENTENCE), unresolvedFinding(1)].map(describeFinding);
  const reading = buildSourceReading({ artifactText: ANSWER, findings });

  assert.equal(reading.marks.length, 1, "text that did not resolve is not a mark");
  assert.equal(reading.marks[0].n, 1);

  const unresolved = findings[1];
  assert.equal(unresolved.anchors[0].channel, null, "the control depends on the channel being null");
  assert.deepEqual(
    reading.marks_by_finding[unresolved.id],
    [null],
    "an anchor with no channel takes no number, so no surface can print one for it",
  );
});

test("only a quotation is positioned, on every finding the reading holds", () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), absentFinding(1), quotedFinding(2, LAST_SENTENCE)]);
  for (const m of reading.marks) {
    assert.equal(
      m.in_document,
      m.channel === ANCHOR_CHANNEL.QUOTED_SPAN,
      `mark ${m.n} is positioned on the ${m.channel} channel`,
    );
  }
});

// ── One numbering, two views ─────────────────────────────────────────────────

test("the number over the words in the body is the number beside the quotation in the list", () => {
  const findings = [quotedFinding(0, FIRST_SENTENCE), absentFinding(1), quotedFinding(2, LAST_SENTENCE)].map(
    describeFinding,
  );
  const reading = buildSourceReading({ artifactText: ANSWER, findings });

  // The list renders f.anchors in order and reads marks_by_finding[f.id][i]. That index
  // alignment is the whole tie, so it is asserted rather than assumed.
  let expected = 0;
  for (const f of findings) {
    const numbering = reading.marks_by_finding[f.id];
    assert.equal(numbering.length, f.anchors.length, "the numbering must align index for index with the anchors");
    f.anchors.forEach((a, i) => {
      if (!a.channel) {
        assert.equal(numbering[i], null);
        return;
      }
      expected += 1;
      assert.equal(numbering[i], expected, "numbering runs in the record's order, across findings");
      const mark = reading.marks.find((m) => m.n === numbering[i]);
      assert.equal(mark.finding_id, f.id);
      assert.equal(mark.quote, a.quote);
      assert.equal(mark.channel, a.channel);
    });
  }
  assert.equal(expected, reading.marks.length, "every mark belongs to exactly one anchor");
});

// ── The shipped renderer, executed ───────────────────────────────────────────

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

async function renderBody(reading) {
  const { code } = await transform(
    `${componentSource(SRC, "SourceReading")}\n${componentSource(SRC, "MarkNumber")}\nreturn SourceReading;`,
    { loader: "jsx", jsxFactory: "h", jsxFragment: "Frag" },
  );
  const h = (type, props, ...children) => {
    if (typeof type === "function") return type({ ...(props || {}), children });
    return { type, props: props || {}, children };
  };
  const make = new Function("h", "Frag", "MEASURE_SOURCE_LABEL", code);
  return make(h, "Frag", stringConstant(SRC, "MEASURE_SOURCE_LABEL"))({ reading });
}

// Everything the rendered tree would say out loud, minus the mark numbers, which are
// the one thing this surface adds to the answer and are excluded here precisely so
// that what remains can be compared to the answer itself.
function answerTextOf(node, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) answerTextOf(n, out);
    return out;
  }
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (node.props && String(node.props.className || "").includes("wb-mark-n")) return out;
  if (node.children) answerTextOf(node.children, out);
  return out;
}

function nodesOfType(node, type, out = []) {
  if (node == null || node === false) return out;
  if (Array.isArray(node)) {
    for (const n of node) nodesOfType(n, type, out);
    return out;
  }
  if (typeof node === "object") {
    if (node.type === type) out.push(node);
    if (node.children) nodesOfType(node.children, type, out);
  }
  return out;
}

test("the body renders the answer verbatim, with the marks as the only thing added", async () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), quotedFinding(1, LAST_SENTENCE)]);
  const tree = await renderBody(reading);
  assert.equal(
    answerTextOf(tree).join(""),
    ANSWER,
    "the words a reader sees must be the answer they pasted, unaltered",
  );
});

test("the marked runs are <mark> elements naming their own marks", async () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE), quotedFinding(1, LAST_SENTENCE)]);
  const marks = nodesOfType(await renderBody(reading), "mark");
  assert.equal(marks.length, 2);
  assert.deepEqual(
    marks.map((m) => m.props["data-mark"]),
    ["1", "2"],
  );
  assert.deepEqual(
    marks.map((m) => answerTextOf(m).join("")),
    [FIRST_SENTENCE, LAST_SENTENCE],
    "a <mark> must hold exactly the words its span resolved to",
  );
});

test("the mark number is announced as a mark, never as a bare numeral", async () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE)]);
  const [mark] = nodesOfType(await renderBody(reading), "mark");
  const everything = [];
  (function walk(node) {
    if (node == null || node === false) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === "string" || typeof node === "number") return void everything.push(String(node));
    if (node.children) walk(node.children);
  })(mark);
  assert.equal(everything.join("").startsWith("mark 1"), true, "the number carries its own read-only label");
});

test("a reading with no document renders nothing at all", async () => {
  const reading = readingOf([quotedFinding(0, FIRST_SENTENCE)], "");
  assert.equal(await renderBody(reading), null, "no artifact, no body — not an empty frame around nothing");
});

test("READ leads the panel: the body mounts before the disclosure that explains it", () => {
  const panel = componentSource(SRC, "MeasurementPanel");
  const body = panel.indexOf("<SourceReading");
  const inspect = panel.indexOf('<details className="wb-measure__inspect"');
  const list = panel.indexOf('className="wb-measure__list"');
  assert.ok(body > 0, "MeasurementPanel must mount the source body");
  assert.ok(inspect > body, "INSPECT must follow READ, not precede it");
  assert.ok(list > inspect, "and the list follows both");
});

test("the panel reads its artifact off the receipt, never off the compose field", () => {
  // The context prop carries the untrimmed compose value. Reading the body from it
  // would put every mark one leading newline out of register, and nothing on screen
  // would say so. The negative control above proves the consequence; this proves the
  // shipped panel does not take that path.
  const panel = componentSource(SRC, "MeasurementPanel");
  assert.match(
    panel,
    /buildSourceReading\(\{\s*artifactText: receipt\?\.open_run\?\.answer \|\| ""/,
    "the artifact must come off the receipt",
  );
  assert.equal(
    /artifactText:\s*context/.test(panel),
    false,
    "the compose field is not the artifact the spans were resolved against",
  );
});
