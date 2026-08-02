// The rule this file pins, stated once:
//
//   recorded_findings may preserve legacy or unresolved material.
//   surfaced_findings includes only findings satisfying their registered anchor contract.
//   Every visible tally uses surfaced_findings.
//   An unresolved required anchor cannot contribute to a visible count.
//
// Why it needs its own file. An UNRESOLVED anchor already rendered nothing — the row omitted
// its blockquote, because a blockquote asserts the words occur in the artifact. That is not
// enough. If such a finding stays eligible for the displayed subset, the hero reads "2 candidate
// items surfaced" above three rows, one of them blank. The count and the visible evidence then
// disagree, which is the contradiction Pass 2B-A exists to end. So the test below is not "does an
// unresolved row render quotation marks"; it is "can an unresolved finding reach a number a person
// reads", and the number is taken from the renderer's own source expressions.
//
// For paired omissions: open_side ABSENT is valid and is NOT unresolved. An omission has nothing
// to quote on the open side — that is what makes it an omission. The probe-side quotation stays
// required, because that is what the finding rests on.
// Run: node --test test/surfaced-findings-visible-count.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  ANCHOR_REQUIREMENT,
  ANCHOR_STATUS,
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  COMPARISON_DIRECTION,
  COUNT_DEFS,
  SHAPE_PAIRED_COMPARATIVE_CONTRAST,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  SHAPE_SINGLE_CANDIDATE,
  buildCanonicalResult,
  buildFinding,
  classBreakdown,
  countOf,
  getFindingShape,
  listFindingShapeIds,
  registerFindingShape,
  satisfiesAnchorContract,
  selectSubset,
} from "../reader-result.js";

const SRC = readFileSync(
  process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
  "utf8",
);

const ANSWER = "A landlord must return the deposit within 30 days. Deductions must be itemized.";
const PROBE = "The tenant may also file a complaint with the housing board within one year.";

function single({ index, quote, cls = "omission" }) {
  return buildFinding({
    index,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: cls,
    statement: `statement ${index}`,
    quotations: { [ARTIFACT_ORIGINAL]: quote },
    artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
  });
}

function pairedOmission({ index, probeQuote, openQuote = "" }) {
  return buildFinding({
    index,
    shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
    class_label: "omission",
    statement: `paired statement ${index}`,
    comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
    quotations: { [ARTIFACT_TARGETED]: probeQuote, [ARTIFACT_ORIGINAL]: openQuote },
    artifacts: { [ARTIFACT_TARGETED]: PROBE, [ARTIFACT_ORIGINAL]: ANSWER },
  });
}

// ---------------------------------------------------------------------------
// The subset rule itself.
// ---------------------------------------------------------------------------

test("an unresolved anchor is recorded and excluded from every surfaced subset", () => {
  const result = buildCanonicalResult({
    surface: "single",
    findings: [
      single({ index: 0, quote: "within 30 days" }),
      single({ index: 1, quote: "Deductions must be itemized", cls: "framing_drift" }),
      single({ index: 2, quote: "a sentence that is nowhere in the answer", cls: "deflection" }),
    ],
  });

  const anchorStatuses = result.findings.map((f) => f.anchors[0].status);
  assert.deepEqual(anchorStatuses, [ANCHOR_STATUS.QUOTED, ANCHOR_STATUS.QUOTED, ANCHOR_STATUS.UNRESOLVED]);

  assert.equal(countOf(result, "recorded_findings"), 3, "the record keeps the unresolved finding");
  assert.equal(countOf(result, "surfaced_findings"), 2, "an unresolved anchor cannot surface");
  assert.equal(countOf(result, "surfaced_candidate_items"), 2);

  // The class breakdown the panel prints is drawn from the same subset, so the three
  // numbers on the counts line sum to the number of rows and not to the record.
  const shown = classBreakdown(result, "surfaced_findings");
  assert.deepEqual(shown, { omission: 1, framing_drift: 1, deflection: 0 });
  assert.equal(
    Object.values(shown).reduce((a, b) => a + b, 0),
    selectSubset(result, "surfaced_findings").length,
  );
  assert.deepEqual(classBreakdown(result, "recorded_findings"), { omission: 1, framing_drift: 1, deflection: 1 });
});

test("an UNRESOLVED required anchor cannot contribute to a visible count", () => {
  // Both sides REQUIRED. The probe side resolves; the open side was supplied and does not
  // occur in the open answer. The finding is built, recorded, and never surfaced.
  const finding = buildFinding({
    index: 0,
    shape: SHAPE_PAIRED_COMPARATIVE_CONTRAST,
    class_label: "framing_drift",
    statement: "a contrast claim",
    comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
    quotations: {
      [ARTIFACT_TARGETED]: "within one year",
      [ARTIFACT_ORIGINAL]: "text the open answer does not contain",
    },
    artifacts: { [ARTIFACT_TARGETED]: PROBE, [ARTIFACT_ORIGINAL]: ANSWER },
  });
  const open = finding.anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  assert.equal(getFindingShape(finding.shape).anchors[ARTIFACT_ORIGINAL], ANCHOR_REQUIREMENT.REQUIRED);
  assert.equal(open.status, ANCHOR_STATUS.UNRESOLVED);

  const result = buildCanonicalResult({ surface: "paired", findings: [finding] });
  assert.equal(countOf(result, "recorded_findings"), 1);
  assert.equal(countOf(result, "surfaced_findings"), 0);
  assert.equal(countOf(result, "probe_surfaced_differences"), 0, "a half-quoted contrast is not a difference");
});

test("a paired omission with an ABSENT open side surfaces: absent is not unresolved", () => {
  const result = buildCanonicalResult({
    surface: "paired",
    findings: [pairedOmission({ index: 0, probeQuote: "file a complaint with the housing board" })],
  });
  const open = result.findings[0].anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  assert.equal(open.status, ANCHOR_STATUS.ABSENT, "an omission has nothing to quote on the open side");
  assert.equal(countOf(result, "surfaced_findings"), 1, "ABSENT on the open side must not block surfacing");
  assert.equal(countOf(result, "probe_surfaced_differences"), 1);
});

test("the quoted probe-side anchor stays required, even when the open side is quoted", () => {
  const result = buildCanonicalResult({
    surface: "paired",
    findings: [
      pairedOmission({
        index: 0,
        probeQuote: "a probe sentence that is not in the probe answer",
        openQuote: "within 30 days",
      }),
    ],
  });
  const probe = result.findings[0].anchors.find((a) => a.role === ARTIFACT_TARGETED);
  const open = result.findings[0].anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  assert.equal(probe.status, ANCHOR_STATUS.UNRESOLVED);
  assert.equal(open.status, ANCHOR_STATUS.QUOTED);
  assert.equal(countOf(result, "recorded_findings"), 1);
  assert.equal(countOf(result, "surfaced_findings"), 0, "a quoted open side cannot substitute for the probe side");
  assert.equal(countOf(result, "probe_surfaced_differences"), 0);
});

test("every surfaced count delegates to the one contract; only the record subset does not", () => {
  const delegating = Object.values(COUNT_DEFS).filter((d) => d.predicate_id.includes("anchor_contract"));
  assert.equal(delegating.length, 3, "surfaced_findings and both restricted counts must delegate");
  assert.equal(COUNT_DEFS.recorded_findings.predicate_id, "every_canonical_finding");
  // Restricted counts are surfaced_findings plus a filter, never a second membership rule.
  const result = buildCanonicalResult({
    surface: "single",
    findings: [single({ index: 0, quote: "within 30 days" }), single({ index: 1, quote: "nowhere in the answer" })],
  });
  for (const f of selectSubset(result, "surfaced_candidate_items")) {
    assert.ok(satisfiesAnchorContract(f));
  }
  for (const f of result.findings) {
    assert.equal(satisfiesAnchorContract(f), selectSubset(result, "surfaced_findings").includes(f));
  }
});

test("on a single-answer result the hero's subset and the panel's subset are the same set", () => {
  // The hero states surfaced_candidate_items (for its unit) and the panel lists
  // surfaced_findings. buildCanonicalResult admits only single-surface findings onto a single
  // result, so the restriction removes nothing and the two cannot report different totals.
  const singleShapes = listFindingShapeIds().filter((id) => getFindingShape(id).surface === "single");
  assert.deepEqual(singleShapes, [SHAPE_SINGLE_CANDIDATE], "extend this fixture when a single-surface shape is added");
  for (const quotes of [[], ["within 30 days"], ["within 30 days", "nowhere at all"], ["nope", "also nope"]]) {
    const result = buildCanonicalResult({
      surface: "single",
      findings: quotes.map((q, i) => single({ index: i, quote: q })),
    });
    assert.deepEqual(
      selectSubset(result, "surfaced_findings"),
      selectSubset(result, "surfaced_candidate_items"),
      `hero and panel selected different findings for ${JSON.stringify(quotes)}`,
    );
  }
});

test("a shape cannot register a surfacing contract that lets an unquotable finding surface", () => {
  assert.throws(
    () =>
      registerFindingShape({
        id: "fixture_no_surfacing_contract",
        surface: "single",
        anchors: { [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED },
        quoted_to_surface: [],
      }),
    /at least one role that must be quoted to surface/,
  );
  assert.throws(
    () =>
      registerFindingShape({
        id: "fixture_required_but_not_surfacing",
        surface: "paired",
        anchors: {
          [ARTIFACT_TARGETED]: ANCHOR_REQUIREMENT.REQUIRED,
          [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.REQUIRED,
        },
        quoted_to_surface: [ARTIFACT_TARGETED],
        directional: true,
      }),
    /must also be required to surface/,
  );
  assert.throws(
    () =>
      registerFindingShape({
        id: "fixture_forbidden_surfacing_role",
        surface: "single",
        anchors: { [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED },
        quoted_to_surface: [ARTIFACT_TARGETED],
      }),
    /forbidden role/,
  );
});

// ---------------------------------------------------------------------------
// The visible count, taken from the renderer's own source.
// ---------------------------------------------------------------------------

// workbench-app.jsx is JSX and cannot be imported by Node. These read the component's real
// expressions out of the source and run them, so the assertion is about what the browser will
// compute, not about a re-statement of it here.
function componentSource(name) {
  const start = SRC.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `workbench-app.jsx must define ${name}`);
  const rest = SRC.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  return next === -1 ? rest : rest.slice(0, next);
}

function extractExpr(text, prefix) {
  const at = text.indexOf(prefix);
  assert.notEqual(at, -1, `expected ${prefix} in the component source`);
  const from = at + prefix.length;
  const semi = text.indexOf(";", from);
  return text.slice(from, semi).trim();
}

// This test used to hold a counts line beside the row list and check that the two
// agreed. 2B-C removed the counts line: a per-class tally is an aggregate the class
// vocabulary owns rather than the run, and a figure a person cannot check by looking at
// the screen. What it was really protecting survives and is asserted here — the number
// the hero states is the number of rows a person can count beneath it.
test("the hero's number is the number of rows the panel puts on the screen", () => {
  const PANEL = componentSource("MeasurementPanel");
  const listExpr = extractExpr(PANEL, "const findings = ");

  const result = buildCanonicalResult({
    surface: "single",
    findings: [
      single({ index: 0, quote: "within 30 days" }),
      single({ index: 1, quote: "Deductions must be itemized", cls: "framing_drift" }),
      single({ index: 2, quote: "text that does not occur", cls: "deflection" }),
    ],
  });

  const runList = new Function("canonical", "selectSubset", "describeFinding", `return (${listExpr});`);
  const rows = runList(result, selectSubset, (f) => f);

  assert.equal(rows.length, 2, "the unresolved finding must not be a row");

  // The hero's line, built by the real helper the component calls, must state the same total.
  const heroTotal = countOf(result, "surfaced_candidate_items");
  assert.equal(heroTotal, rows.length, "the hero count must equal the number of rows beneath it");
});

test("no visible surface reads the record subset", () => {
  // recorded_findings is serialized and exported; it is not shown. If it appears in a render
  // path again, this fails and whoever added it has to say why a person should see it.
  const PANEL = componentSource("MeasurementPanel");
  assert.equal(PANEL.includes("recorded_findings"), false);
  const meaningMount = SRC.slice(SRC.indexOf("pairRuns={[]}") - 900, SRC.indexOf("pairRuns={[]}") + 200);
  assert.match(meaningMount, /countOf\(readerResult\.result, "surfaced_findings"\)/);
  assert.equal(SRC.includes('countOf(readerResult.result, "recorded_findings")'), false);
  assert.equal(SRC.includes('classBreakdown(canonical, "recorded_findings")'), false);
  assert.equal(SRC.includes('selectSubset(canonical, "recorded_findings")'), false);
});
