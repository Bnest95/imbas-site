// Guardrail: the single-mode Inspection Meaning mount in workbench-app.jsx must count the
// distinct items the reader can actually SEE. Those items are the candidate findings that
// MeasurementPanel renders (measurement.findings); the Check Register cards (checks.cards)
// are a DERIVED SUBSET of those same findings — api/read.js buildChecks filters
// measurement.findings and reader-checks.js buildCheckRegister only drops/dedups, never
// adds — so cards ⊆ findings and the count of distinct visible items is the union
// cardinality = max(measurement.findings.length, checks.cards.length). The mount may select
// S1 (the "didn't surface anything" null-result copy) ONLY when BOTH are empty; if either
// carries entries it must select S2 with that max count.
//
// The bug this guards (seen in production): the mount passed `checks.cards` ALONE. The
// both-ends-quotable filter can legitimately drop every card, so a run with two measurement
// findings but zero cards fed [] to the panel and rendered S1 — "the Reader didn't surface
// anything" — directly below the two candidate findings the reader was already looking at.
//
// workbench-app.jsx is JSX and cannot be imported by Node, and this fix lives entirely in
// the mount's `findings={...}` expression (selectInspectionMeaning is unchanged). So —
// following test/daily-brief-wiring.test.mjs — this reads the source, extracts that exact
// expression, evaluates it against synthetic reader results, and feeds the number to the
// REAL selector, exactly as the mount does. Point WORKBENCH_APP_JSX at a pre-fix snapshot
// (`git show <base>:workbench-app.jsx > /tmp/x.jsx`) to watch tests 1 and 3 fail loudly.
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
const evalSingleFindings = new Function("readerResult", `return (${SINGLE_EXPR});`);

// Shape a synthetic single-mode reader result. `measurement` is always present (the mount is
// gated on it); element shape is irrelevant — only the array lengths drive the wiring.
function singleResult({ findings = 0, cards = 0 }) {
  const items = (n, tag) => Array.from({ length: n }, (_, i) => ({ [tag]: `${tag}-${i}` }));
  return {
    measurement: { findings: items(findings, "finding") },
    checks: { cards: items(cards, "card") },
  };
}

// Run the extracted call-site expression, then the real selector — exactly as the mount does.
function selectFromWiring(result) {
  return selectInspectionMeaning({ pairRuns: [], findings: evalSingleFindings(result) });
}

test("1) two measurement findings, zero Check Register cards → S2 count 2 (the production regression)", () => {
  const sel = selectFromWiring(singleResult({ findings: 2, cards: 0 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S2, "findings present → must NOT be the S1 null-result state");
  assert.ok(sel.copy.what.includes("2 item"), `S2 count must equal the 2 findings the reader sees; got: ${sel.copy.what}`);
});

test("2) Check Register cards present, no measurement findings → S2 with the card count", () => {
  const sel = selectFromWiring(singleResult({ findings: 0, cards: 2 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S2, "either source non-empty → S2, never S1");
  assert.ok(sel.copy.what.includes("2 item"), `got: ${sel.copy.what}`);
});

test("3) both present (cards ⊆ findings) → S2 counts the union, never the sum (no double-count)", () => {
  // 3 findings, 2 of which survived into cards. Distinct visible items = 3, not 5.
  const sel = selectFromWiring(singleResult({ findings: 3, cards: 2 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S2);
  assert.ok(sel.copy.what.includes("3 item"), `union cardinality is 3; got: ${sel.copy.what}`);
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
