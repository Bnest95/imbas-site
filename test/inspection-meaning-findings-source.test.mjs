// Guardrail: the single-mode Inspection Meaning mount in workbench-app.jsx must count the
// distinct items the reader can actually SEE — and, since Pass 2B-B, must name only the
// next steps that actually rendered.
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
// surfaced_findings from it — the same subset MeasurementPanel lists. So the union arithmetic
// is gone, and with it the hypothetical it defended against — a card cannot exist without the
// finding it was derived from, because api/read.js buildChecks filters measurement.findings and
// buildCheckRegister only drops and dedups. Test 2 below now pins the stronger property: the
// count does not consult the Check Register at all, so no number of cards, including zero, can
// move it. Test 6 pins the other side: a finding whose quotation does not resolve is recorded
// and cannot raise this count, so the interpretation can never describe an item that has no row.
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
  EXPLAIN_AFFORDANCE_KEYS,
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

// Extract the JS expression from a named attribute on the InspectionMeaningPanel mount
// identified by its pairRuns signature (single mode → `pairRuns={[]}`, paired mode →
// `pairRuns={[pair]}`; both are unique in the source). Brace-matches from the first `{`
// after the attribute name to its partner so a multi-line expression is captured whole.
// Assumes no `{`/`}` inside string literals in the attribute — true for both mounts.
function extractAttrExpr(src, pairRunsSignature, attrName) {
  const anchor = src.indexOf(pairRunsSignature);
  assert.notEqual(anchor, -1, `mount with ${pairRunsSignature} must exist`);
  const attr = src.indexOf(attrName, anchor);
  assert.notEqual(attr, -1, `mount must have a ${attrName} attribute after pairRuns`);
  const open = src.indexOf("{", attr);
  assert.notEqual(open, -1, `${attrName} must be a JSX expression container`);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  assert.notEqual(end, -1, `${attrName} expression container must be brace-balanced`);
  return src.slice(open + 1, end).trim();
}

const extractFindingsExpr = (src, pairRunsSignature) =>
  extractAttrExpr(src, pairRunsSignature, "findings=");

const SINGLE_EXPR = extractFindingsExpr(SRC, "pairRuns={[]}");
// eslint-disable-next-line no-new-func -- the guard's whole point is to run the real call-site expression.
const evalSingleFindings = new Function("readerResult", "countOf", `return (${SINGLE_EXPR});`);

// Shape a synthetic single-mode reader result. The canonical block is built by the endpoint's
// own adapter through the real construction door, so the number the mount reads is the number
// production would produce. Every anchor occurs verbatim in the answer text unless `unresolved`
// asks for findings whose supplied quotation is absent from it — those are recorded and must not
// be counted.
function singleResult({ findings = 0, cards = 0, unresolved = 0 }) {
  const resolved = Array.from({ length: findings }, (_, i) => ({
    type: "candidate missing item",
    anchor: `resolved anchor ${i}`,
    materiality: `why ${i}`,
  }));
  const missing = Array.from({ length: unresolved }, (_, i) => ({
    type: "candidate missing item",
    anchor: `words the answer never contains ${i}`,
    materiality: `why unresolved ${i}`,
  }));
  const measurement = { findings: [...resolved, ...missing] };
  const answer = resolved.map((f) => f.anchor).join(". ") || "an answer with nothing quotable in it.";
  const checks = { cards: Array.from({ length: cards }, (_, i) => ({ id: `card-${i}` })) };
  return { measurement, checks, result: buildCanonicalSingle(measurement, answer, checks) };
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
  assert.ok(sel.copy.what.includes("3 item"), `surfaced findings is 3; got: ${sel.copy.what}`);
  assert.ok(!sel.copy.what.includes("5 item"), "must not sum findings and their own derived cards");
});

test("4) both empty → S1 (the only state that may report nothing surfaced)", () => {
  const sel = selectFromWiring(singleResult({ findings: 0, cards: 0 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S1);
  assert.equal(sel.copy.what, EXPLAIN_PANEL_UI.states[EXPLAIN_STATE_S1].what);
});

test("5) paired mount forwards the visible rows, still selects S3/S4", () => {
  // Pass 2B-A2 moved this from `items` (the pre-canonical wire array) to `rows` — the
  // rows PairedDeltaView actually renders, built from the canonical subset. The guard
  // stays: the interpretation must describe the collection the person is looking at,
  // so this call site must forward that same collection and not a parallel one.
  assert.equal(
    extractFindingsExpr(SRC, "pairRuns={[pair]}"),
    "rows",
    "paired mount must forward the rendered rows, not a second collection",
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

test("6) an unresolved quotation is recorded and cannot raise the count", () => {
  const sel = selectFromWiring(singleResult({ findings: 2, cards: 0, unresolved: 1 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S2);
  assert.ok(sel.copy.what.includes("2 item"), `only the 2 quotable items may be counted; got: ${sel.copy.what}`);
  assert.ok(!sel.copy.what.includes("3 item"), "a finding with no verbatim quotation must not be counted");
  // And the record still holds all three, so nothing was dropped to achieve that.
  assert.equal(countOf(singleResult({ findings: 2, unresolved: 1 }).result, "recorded_findings"), 3);
});

test("7) every finding unresolved → S1, because nothing can be shown", () => {
  const sel = selectFromWiring(singleResult({ findings: 0, cards: 0, unresolved: 2 }));
  assert.equal(sel.state_id, EXPLAIN_STATE_S1, "no quotable finding → the interpretation must not claim items");
});

// ── The affordance flags (Pass 2B-B item 4) ──────────────────────────────────────
// The panel's What-you-can-do-next line is gated on flags the mount supplies, so the
// flags are only as honest as the expressions behind them. The panel test proves the
// gate works; these prove the mount wires it to the real render conditions. Extract the
// same way: read the attribute out of the source rather than re-describing it here.

const SINGLE_AVAILABLE = extractAttrExpr(SRC, "pairRuns={[]}", "available=");
const PAIRED_AVAILABLE = extractAttrExpr(SRC, "pairRuns={[pair]}", "available=");

test("8) the single mount gates the Check Register clauses on the same expression that mounts the panel", () => {
  // One named const decides whether CheckRegisterPanel renders. The register carries the
  // cards, the copy-the-question control AND the Review Record export, so both flags must
  // read that one const — not a re-derived copy that could drift out of step with it.
  assert.match(
    SINGLE_AVAILABLE,
    /checks:\s*checkRegisterVisible/,
    "checks must be gated on checkRegisterVisible",
  );
  assert.match(
    SINGLE_AVAILABLE,
    /reviewRecord:\s*checkRegisterVisible/,
    "the Review Record export lives inside the register, so it shares the register's gate",
  );
  // And that same identifier — not a duplicated expression — mounts the panel itself.
  assert.match(
    SRC,
    /\{checkRegisterVisible \? \(\s*<div className="wb-reader-v2__follow wb-reader-v2__follow--checks">/,
    "CheckRegisterPanel must mount on checkRegisterVisible",
  );
  assert.equal(
    (SRC.match(/const checkRegisterVisible = /g) || []).length,
    1,
    "checkRegisterVisible must be defined exactly once",
  );
});

test("9) the single mount declares every affordance key, so none defaults to silence by accident", () => {
  for (const key of EXPLAIN_AFFORDANCE_KEYS) {
    assert.match(SINGLE_AVAILABLE, new RegExp(`\\b${key}\\s*:`), `single mount must declare ${key}`);
    assert.match(PAIRED_AVAILABLE, new RegExp(`\\b${key}\\s*:`), `paired mount must declare ${key}`);
  }
});

test("10) the paired mount claims no checks and no follow-up, because a pair renders neither", () => {
  assert.match(PAIRED_AVAILABLE, /checks:\s*false/, "a paired inspection produces a delta, never checks");
  assert.match(PAIRED_AVAILABLE, /followUp:\s*false/, "the two-question test offer is upstream of the pair");
});
