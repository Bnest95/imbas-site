// Guardrail: the single-mode Inspection Meaning mount in workbench-app.jsx must count the
// distinct items the reader can actually SEE.
//
// The bug this guards (seen in production): the mount passed `checks.cards` ALONE. The
// both-ends-quotable filter can legitimately drop every card, so a run with two measurement
// findings but zero cards fed [] to the panel and rendered S1 — "the Reader didn't surface
// anything" — directly below the two candidate findings the reader was already looking at.
//
// Pass 2B-A changed WHERE the count comes from. It used to be
// max(measurement.findings.length, checks.cards.length) — an unnamed count computed in the
// renderer to approximate the union of two sources. There is now one source: the canonical
// findings collection (reader-result.js), and the mount reads the named subset
// recorded_findings from it. So the union arithmetic is gone, and with it the hypothetical
// it defended against — a card cannot exist without the finding it was derived from, because
// api/read.js buildChecks filters measurement.findings and buildCheckRegister only drops and
// dedups. Test 2 below now pins the stronger property: the count does not consult the Check
// Register at all, so no number of cards, including zero, can move it.
//
// workbench-app.jsx is JSX and cannot be imported by Node, and this wiring lives entirely in
// the mount's `findings={...}` expression (selectInspectionMeaning is unchanged). So —
// following test/daily-brief-wiring.test.mjs — this reads the source, extracts that exact
// expression, evaluates it against synthetic reader results built by the REAL adapter and
// construction door, and feeds the number to the REAL selector, exactly as the mount does.
// Point WORKBENCH_APP_JSX at a pre-fix snapshot (`git show <base>:workbench-app.jsx >
// /tmp/x.jsx`) to watch tests 1 and 3 fail loudly.
// Run: node --test test/inspection-meaning-findings-source.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  EXPLAIN_PANEL_UI,
  EXPLAIN_STATE_S1,
  EXPLAIN_STATE_S2,
  EXPLAIN_STATE_S3,
  EXPLAIN_STATE_S4,
  selectInspectionMeaning,
} from "../reader-explain-panel.js";
import { countOf } from "../reader-result.js";
import { buildCanonicalSingle } from "../api/read.js";

const SRC_PATH =
  process.env.WORKBENCH_APP_JSX ||
  fileURLToPath(new URL("../workbench-app.jsx", import.meta.url));
const SRC = readFileSync(SRC_PATH, "utf8");

// Extract the JS expression from the `findings={...}` attribute on the InspectionMeaningPanel
// mount identified by its pairRuns signature (single mode → `pairRuns={[]}`, paired mode →
// `pairRuns={[pair]}`; both are unique in the source). Brace-matches from the first `{` after
// `findings=` to its partner so a multi-line expression is captured whole. Assumes no `{`/`}`
// inside string literals in the attribute — true for both mounts.
function extractFindingsExpr(src, pairRunsSignature) {
  const anchor = src.indexOf(pairRunsSignature);
  assert.notEqual(anchor, -1, `mount with ${pairRunsSignature} must exist`);
  const attr = src.indexOf("findings=", anchor);
  assert.notEqual(attr, -1, "mount must have a findings= attribute after pairRuns");
  const open = src.indexOf("{", attr);
  assert.notEqual(open, -1, "findings= must be a JSX expression container");
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  assert.notEqual(end, -1, "findings= expression container must be brace-balanced");
  return src.slice(open + 1, end).trim();
}

const SINGLE_EXPR = extractFindingsExpr(SRC, "pairRuns={[]}");
// eslint-disable-next-line no-new-func -- the guard's whole point is to run the real call-site expression.
const evalSingleFindings = new Function("readerResult", "countOf", `return (${SINGLE_EXPR});`);

// Shape a synthetic single-mode reader result. The canonical block is built by the endpoint's
// own adapter through the real construction door, so the number the mount reads is the number
// production would produce. The answer text is empty: anchors then record themselves as ABSENT
// (the shape allows it) and every finding still survives, which is the point.
function singleResult({ findings = 0, cards = 0 }) {
  const measurement = {
    findings: Array.from({ length: findings }, (_, i) => ({
      type: "candidate missing item",
      anchor: `anchor ${i}`,
      materiality: `why ${i}`,
    })),
  };
  const checks = { cards: Array.from({ length: cards }, (_, i) => ({ id: `card-${i}` })) };
  return { measurement, checks, result: buildCanonicalSingle(measurement, "", checks) };
}

// Run the extracted call-site expression, then the real selector — exactly as the mount does.
function selectFromWiring(result) {
  return selectInspectionMeaning({ pairRuns: [], findings: evalSingleFindings(result, countOf) });
}

test("1) two measurement findings, zero Check Register cards → S2 count 2 (the production regression)", () => {
  const sel = selectFromWiring(singleResult({ findings: 2, cards: 0 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S2, "findings present → must NOT be the S1 null-result state");
  assert.ok(sel.copy.what.includes("2 item"), `S2 count must equal the 2 findings the reader sees; got: ${sel.copy.what}`);
});

test("2) the count never consults the Check Register: cards cannot move it", () => {
  const none = selectFromWiring(singleResult({ findings: 3, cards: 0 }));
  const some = selectFromWiring(singleResult({ findings: 3, cards: 3 }));
  assert.equal(none.state_id, EXPLAIN_STATE_S2);
  assert.equal(some.state_id, EXPLAIN_STATE_S2);
  assert.equal(none.copy.what, some.copy.what, "register eligibility annotates findings; it never counts them");
  assert.ok(none.copy.what.includes("3 item"), `got: ${none.copy.what}`);
});

test("3) cards are a derived subset → S2 counts the findings, never the sum (no double-count)", () => {
  // 3 findings, 2 of which survived into cards. Distinct visible items = 3, not 5.
  const sel = selectFromWiring(singleResult({ findings: 3, cards: 2 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S2);
  assert.ok(sel.copy.what.includes("3 item"), `recorded findings is 3; got: ${sel.copy.what}`);
  assert.ok(!sel.copy.what.includes("5 item"), "must not sum findings and their own derived cards");
});

test("4) both empty → S1 (the only state that may report nothing surfaced)", () => {
  const sel = selectFromWiring(singleResult({ findings: 0, cards: 0 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S1);
  assert.equal(sel.copy.what, EXPLAIN_PANEL_UI.states[EXPLAIN_STATE_S1].what);
});

test("5) paired mount untouched: still forwards the delta items array, still selects S3/S4", () => {
  // The paired call site must remain `findings={items}` — guards against a collateral edit.
  assert.equal(
    extractFindingsExpr(SRC, "pairRuns={[pair]}"),
    "items",
    "paired mount must still forward the delta items array unchanged",
  );
  // And the selector's paired behavior is unchanged: findings → S4, none → S3.
  assert.equal(
    selectInspectionMeaning({ pairRuns: [{}], findings: [{ finding: "x" }], conditionsMatched: true }).state_id,
    EXPLAIN_STATE_S4,
  );
  assert.equal(
    selectInspectionMeaning({ pairRuns: [{}], findings: [], conditionsMatched: true }).state_id,
    EXPLAIN_STATE_S3,
  );
});
