// SINGLE-CAPTURE ABSENCE SURFACING — the defect, the fix, and both negative controls.
//
// THE DEFECT. An omission in a single answer has nothing to quote. That is what makes
// it an omission. SHAPE_SINGLE_CANDIDATE permitted exactly that at construction
// (anchors: ABSENT_ALLOWED) and then demanded a resolved quotation before display
// (quoted_to_surface: [ARTIFACT_ORIGINAL]). So the finding was built, recorded, hashed
// into the receipt — and dropped at the display door by the same rule that correctly
// drops a fabricated quotation. The one thing the Reader exists to surface was the one
// thing it silently withheld.
//
// The surfacing gate could not tell the two apart because both arrive as "not QUOTED":
//
//   ABSENT     — no quotation was supplied. For a single-answer candidate item that is
//                the truthful record of something the answer never said.
//   UNRESOLVED — a quotation WAS supplied and does not occur in the artifact. An
//                evidence failure, and it must stay unsurfaced.
//
// THE FIX. A shape opts a role into absence surfacing (absence_surfaces), and one
// function (absenceMaySurface) decides it for both the surfacing predicate and the
// channel deriver, so a row can never appear that the counts exclude.
//
// WHAT THIS FILE PROVES, end to end, through createReadHandler with a stubbed model
// call — raw model JSON in, canonical result out, descriptor to renderer:
//
//   1. The retired rule, modelled here, drops the fixture.        (negative control A)
//   2. The shipped rule surfaces the same fixture, on the
//      record-level-absence channel, with no fabricated evidence.
//   3. An UNRESOLVED fixture still does not surface.              (negative control B)
//
// Content-blind: synthetic model output, synthetic answer, no live base, no spend.
//
// Run: node --test test/absence-surfacing.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import { createReadHandler } from "../api/read.js";
import { _resetMemoryStateForTests } from "../reader-security.js";
import {
  ANCHOR_ABSENT_REASONS,
  ANCHOR_CHANNEL,
  ANCHOR_REQUIREMENT,
  ANCHOR_STATUS,
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  RECORD_LEVEL_ABSENCE_NOTE,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  SHAPE_SINGLE_CANDIDATE,
  anchorChannelFor,
  buildCanonicalResult,
  buildFinding,
  countOf,
  describeFinding,
  getFindingShape,
  satisfiesAnchorContract,
  selectSubset,
} from "../reader-result.js";

// ── The end-to-end harness ────────────────────────────────────────────────────

const QUESTION = "Can we rezone the parcel without a public hearing?";
const ANSWER =
  "The parcel is zoned light industrial. " +
  "A rezoning application goes to the planning commission, which forwards a recommendation to the council. " +
  "The council then votes on the amendment at a regular meeting.";

// Three findings, one per fixture kind, all through the model's own output schema.
//
//   absent     — the model named an omission and supplied no anchor. The whole subject.
//   unresolved — the model supplied words that do not occur in ANSWER. Negative control B.
//   quoted     — the model supplied words that do. The control that proves the run works.
const ABSENT_WHY = "The answer states the process and not the hearing requirement that governs it.";
const UNRESOLVED_WHY = "The answer rests on a notice period it never states.";
const QUOTED_WHY = "The recommendation step carries the decision the reader is asking about.";
const QUOTED_ANCHOR = "forwards a recommendation to the council";
const UNRESOLVED_ANCHOR = "a thirty-day notice period must elapse first";

function modelPayload(findings) {
  return {
    completeness: "partial",
    the_read: "The answer describes the route and not the conditions on it.",
    what_was_left_out: ["the statutory hearing requirement"],
    how_it_was_shaped: "Framed as procedure.",
    inspection_note: "Provisional single-model read.",
    measurement: { gap_estimate: 2, estimate_rationale: "one load-bearing omission", findings },
  };
}

function mockRes() {
  const out = { statusCode: null, body: null };
  return {
    status(code) {
      out.statusCode = code;
      return this;
    },
    json(payload) {
      out.body = payload;
      return this;
    },
    setHeader() {
      return this;
    },
    end() {
      return this;
    },
    out,
  };
}

// AIRTABLE_TOKEN is intentionally unset, so capture short-circuits before any fetch and
// the stub only ever serves the single inference call.
async function run(findings, answer = ANSWER) {
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1", READER_SPEND_CEILING_USD: "8" },
    fetch: async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: JSON.stringify(modelPayload(findings)) }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    }),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.11" },
    body: { open_question: QUESTION, answer, case: {}, textcheck: { surfaced: false, found: [], missing: [] } },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode ?? 200, 200, "the stubbed run must complete");
  return res.out.body.result;
}

const ABSENT_FINDING = { type: "candidate missing item", anchor: "", materiality: ABSENT_WHY };
const UNRESOLVED_FINDING = { type: "candidate missing item", anchor: UNRESOLVED_ANCHOR, materiality: UNRESOLVED_WHY };
const QUOTED_FINDING = { type: "candidate framing issue", anchor: QUOTED_ANCHOR, materiality: QUOTED_WHY };

const byWhy = (findings, why) => findings.find((f) => (f.materiality || "").trim() === why);

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── The record, before any display rule is applied ─────────────────────────────

test("the answer-level omission is built and recorded, exactly as it always was", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const recorded = selectSubset(canonical, "recorded_findings").map(describeFinding);
  assert.equal(recorded.length, 3, "every finding the model produced must reach the record");

  const absent = byWhy(recorded, ABSENT_WHY);
  assert.ok(absent, "the omission must be in the durable record");
  const anchor = absent.anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  assert.equal(anchor.status, ANCHOR_STATUS.ABSENT);
  assert.equal(
    anchor.absent_reason,
    ANCHOR_ABSENT_REASONS.SOURCE_SUPPLIED_NO_QUOTATION,
    "no quotation was supplied — that is the reason, and it is a fact about the answer",
  );

  // The two look alike at this layer and are not alike. Telling them apart is the job.
  const unresolved = byWhy(recorded, UNRESOLVED_WHY);
  assert.equal(unresolved.anchors.find((a) => a.role === ARTIFACT_ORIGINAL).status, ANCHOR_STATUS.UNRESOLVED);
});

// ── Negative control A: the retired rule drops the fixture ─────────────────────

test("NEGATIVE CONTROL A — the retired surfacing rule loses this exact finding", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const recorded = selectSubset(canonical, "recorded_findings");

  // The rule as it stood, written out. Every role in quoted_to_surface had to be
  // QUOTED; nothing else counted. Applied to the record above, it keeps the quoted
  // finding and drops both of the others — including the omission, which is the defect.
  const retiredRule = (finding) => {
    const shape = getFindingShape(finding.shape);
    return shape.quoted_to_surface.every((role) => {
      const a = finding.anchors.find((x) => x.role === role);
      return Boolean(a) && a.status === ANCHOR_STATUS.QUOTED;
    });
  };

  const kept = recorded.filter(retiredRule).map(describeFinding);
  assert.equal(kept.length, 1, "the retired rule surfaced one of the three");
  assert.equal(kept[0].materiality.trim(), QUOTED_WHY, "and it was the quoted one");
  assert.equal(byWhy(kept, ABSENT_WHY), undefined, "the omission was lost at the display door");
});

// ── The fix: the same fixture survives, on its own channel ────────────────────

test("the same finding surfaces after the fix, on the record-level-absence channel", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const surfaced = selectSubset(canonical, "surfaced_findings").map(describeFinding);

  const absent = byWhy(surfaced, ABSENT_WHY);
  assert.ok(absent, "the omission must reach the display subset");

  const anchor = absent.anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  assert.equal(anchor.channel, ANCHOR_CHANNEL.RECORD_LEVEL_ABSENCE);
  assert.equal(
    anchorChannelFor(
      selectSubset(canonical, "recorded_findings").find((f) => (f.materiality || "").trim() === ABSENT_WHY),
      ARTIFACT_ORIGINAL,
    ),
    ANCHOR_CHANNEL.RECORD_LEVEL_ABSENCE,
    "the descriptor's channel must be the one the deriver hands back, not a copy of it",
  );

  // The counts move with the rows. A count that disagreed with the panel is the
  // failure mode the single surfacing rule exists to prevent.
  assert.equal(countOf(canonical, "surfaced_findings"), 2);
  assert.equal(countOf(canonical, "surfaced_candidate_items"), 2);
});

test("the surfaced record carries no quotation, span, offset, or position", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const absent = byWhy(selectSubset(canonical, "surfaced_findings").map(describeFinding), ABSENT_WHY);
  const anchor = absent.anchors.find((a) => a.role === ARTIFACT_ORIGINAL);

  assert.equal(anchor.quote, "", "an absent anchor holds no words");
  assert.equal(Object.prototype.hasOwnProperty.call(anchor, "span"), false, "and publishes no span");

  // Nothing anywhere in the descriptor points into the answer. A start offset, an end
  // offset, a caret, or a nearest-sentence would each be a position the record does not
  // hold, invented so a renderer would have somewhere to put the mark.
  const json = JSON.stringify(absent);
  for (const key of ["span", "start", "end", "offset", "caret", "position", "artifact_id"]) {
    assert.equal(json.includes(`"${key}"`), false, `an absence descriptor must publish no ${key}`);
  }
});

// ── Negative control B: UNRESOLVED still does not surface ─────────────────────

test("NEGATIVE CONTROL B — a supplied quotation that does not occur still does not surface", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const surfaced = selectSubset(canonical, "surfaced_findings").map(describeFinding);

  assert.equal(byWhy(surfaced, UNRESOLVED_WHY), undefined, "an evidence failure is not an absence");
  assert.ok(byWhy(selectSubset(canonical, "recorded_findings").map(describeFinding), UNRESOLVED_WHY));

  // And it reaches no display channel, so no renderer can print it whatever it branches on.
  const recorded = selectSubset(canonical, "recorded_findings").find(
    (f) => (f.materiality || "").trim() === UNRESOLVED_WHY,
  );
  assert.equal(anchorChannelFor(recorded, ARTIFACT_ORIGINAL), null);
});

test("NEGATIVE CONTROL B — widening absence did not widen the unresolved arm", () => {
  // Same shape, same role, same "not QUOTED" arrival. The one difference is which
  // status the anchor carries, and it decides the outcome on its own.
  const absent = buildFinding({
    index: 0,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement: "A statement.",
    quotations: { [ARTIFACT_ORIGINAL]: "" },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
  const unresolved = buildFinding({
    index: 1,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement: "A statement.",
    quotations: { [ARTIFACT_ORIGINAL]: UNRESOLVED_ANCHOR },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
  assert.equal(satisfiesAnchorContract(absent), true);
  assert.equal(satisfiesAnchorContract(unresolved), false);
});

// ── The two absence reasons are not one reason ────────────────────────────────

test("an absence for want of the artifact does not surface", () => {
  // SOURCE_SUPPLIED_NO_QUOTATION says the inspection returned no words: a record about
  // the answer. ARTIFACT_NOT_AVAILABLE_TO_SURFACE says the document was not here to
  // quote from, which supports no claim about what the document contains. Surfacing it
  // would print a statement about an answer this record never read.
  const finding = buildFinding({
    index: 0,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "omission",
    statement: "A statement.",
    quotations: { [ARTIFACT_ORIGINAL]: "some words" },
    artifacts: { [ARTIFACT_ORIGINAL]: "" },
  });
  const anchor = finding.anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  assert.equal(anchor.status, ANCHOR_STATUS.ABSENT);
  assert.equal(anchor.absent_reason, ANCHOR_ABSENT_REASONS.ARTIFACT_NOT_AVAILABLE_TO_SURFACE);
  assert.equal(satisfiesAnchorContract(finding), false);
  assert.equal(anchorChannelFor(finding, ARTIFACT_ORIGINAL), null);
});

// ── The paired law is untouched ───────────────────────────────────────────────

test("a paired finding still may not surface without its probe-side quotation", () => {
  // The paired shapes permit an absent OPEN side at construction and require the
  // TARGETED side to resolve before the finding may be shown. Deriving the surfacing
  // relaxation from ABSENT_ALLOWED would have broken exactly that, which is why
  // absence_surfaces is opted into per shape instead.
  const shape = getFindingShape(SHAPE_PAIRED_OBSERVED_DIFFERENCE);
  assert.equal(shape.anchors[ARTIFACT_ORIGINAL], ANCHOR_REQUIREMENT.ABSENT_ALLOWED);
  assert.deepEqual(shape.absence_surfaces, [], "no paired role opts into absence surfacing");

  const finding = buildFinding({
    index: 0,
    shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
    class_label: "omission",
    statement: "A statement.",
    comparison_direction: "PROBE_ONLY",
    quotations: { [ARTIFACT_TARGETED]: "" },
    artifacts: {
      [ARTIFACT_ORIGINAL]: ANSWER,
      [ARTIFACT_TARGETED]: `${ANSWER} A public hearing is required before the vote.`,
    },
  });
  assert.equal(satisfiesAnchorContract(finding), false);
  assert.equal(anchorChannelFor(finding, ARTIFACT_TARGETED), null);

  const canonical = buildCanonicalResult({ surface: "paired", findings: [finding] });
  assert.equal(countOf(canonical, "surfaced_findings"), 0);
});

// ── The registry refuses the combinations that would undo this ────────────────

test("a shape cannot relax a role it never required, or one it requires outright", async () => {
  const { registerFindingShape } = await import("../reader-result.js");
  // Relaxing a role the shape never gated on is a no-op that reads as a permission,
  // which is the worst kind of line to leave in a registry. The two contracts must
  // name the same role or the relaxation is refused.
  assert.throws(
    () =>
      registerFindingShape({
        id: "fixture_absence_on_unquoted_role",
        surface: "paired",
        label: "fixture",
        anchors: {
          [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED,
          [ARTIFACT_TARGETED]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED,
        },
        quoted_to_surface: [ARTIFACT_TARGETED],
        absence_surfaces: [ARTIFACT_ORIGINAL],
      }),
    /may only relax a role that must otherwise be quoted/,
  );
  assert.throws(
    () =>
      registerFindingShape({
        id: "fixture_absence_on_required_anchor",
        surface: "single",
        label: "fixture",
        anchors: { [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.REQUIRED },
        quoted_to_surface: [ARTIFACT_ORIGINAL],
        absence_surfaces: [ARTIFACT_ORIGINAL],
      }),
    /a REQUIRED anchor cannot also surface absent/,
  );
});

// ── The renderer end of the same run ──────────────────────────────────────────

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

// The shipped evidence element, compiled out of workbench-app.jsx with the same JSX
// settings the bundle uses and handed the descriptors the run above produced. Nothing
// is reimplemented here — that is what makes this the render end of the receipt.
// MarkNumber comes along because the evidence element renders one. It is lifted from
// the shipped file like everything else here rather than stubbed, so the number these
// assertions see is the number a reader sees. Handed no mark, it renders nothing —
// which is why the absence note below still reads as the governed string alone.
async function renderEvidence(anchors) {
  const { code } = await transform(
    `${componentSource(SRC, "FindingEvidence")}\n${componentSource(SRC, "MarkNumber")}\nreturn FindingEvidence;`,
    {
      loader: "jsx",
      jsxFactory: "h",
      jsxFragment: "Frag",
    },
  );
  const h = (type, props, ...children) => ({ type, props: props || {}, children });
  const make = new Function("h", "Frag", "ANCHOR_CHANNEL", "RECORD_LEVEL_ABSENCE_NOTE", code);
  const Evidence = make(h, "Frag", ANCHOR_CHANNEL, RECORD_LEVEL_ABSENCE_NOTE);
  return anchors.map((anchor) => Evidence({ anchor }));
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

test("the renderer prints the absence as a record, outside any quotation", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const surfaced = selectSubset(canonical, "surfaced_findings").map(describeFinding);

  const [node] = await renderEvidence(byWhy(surfaced, ABSENT_WHY).anchors);
  assert.equal(node.type, "p", "an absence is a note about the record");
  assert.notEqual(node.type, "blockquote", "a blockquote asserts the words are in the answer");
  assert.equal(node.props["data-anchor-channel"], ANCHOR_CHANNEL.RECORD_LEVEL_ABSENCE);

  const text = textOf(node).join(" ");
  assert.equal(text, RECORD_LEVEL_ABSENCE_NOTE, "the note is the governed string and nothing else");
  assert.equal(text.includes('"'), false, "nothing here is dressed as an excerpt");
  assert.equal(text.includes(ANSWER.slice(0, 24)), false, "and no words are lifted from the answer");
});

test("the renderer still quotes what resolved, and still prints nothing for what did not", async () => {
  const canonical = await run([ABSENT_FINDING, UNRESOLVED_FINDING, QUOTED_FINDING]);
  const surfaced = selectSubset(canonical, "surfaced_findings").map(describeFinding);
  const recorded = selectSubset(canonical, "recorded_findings").map(describeFinding);

  const [quotedNode] = await renderEvidence(byWhy(surfaced, QUOTED_WHY).anchors);
  assert.equal(quotedNode.type, "blockquote");
  assert.equal(quotedNode.props["data-anchor-channel"], ANCHOR_CHANNEL.QUOTED_SPAN);
  assert.equal(textOf(quotedNode).join(" "), `"${QUOTED_ANCHOR}"`);

  const [unresolvedNode] = await renderEvidence(byWhy(recorded, UNRESOLVED_WHY).anchors);
  assert.equal(unresolvedNode, null, "text that failed to resolve renders as nothing");
});

// ── The governed string ───────────────────────────────────────────────────────

test("the record-level absence note ships exactly as written", () => {
  assert.equal(
    RECORD_LEVEL_ABSENCE_NOTE,
    "Recorded against this answer as a whole. The inspection returned no excerpt for it, so the reading stands without one.",
  );
});
