// reader-explain-panel — the Inspection Meaning panel's deterministic state→copy
// selection and its RENDER-ONLY invariant (Reader v3 EXPLAIN lane, site repo).
//
// Gates pinned here:
//   - Determinism table: every state (S1, S2, S3, S4, S5∘S3, S5∘S4) selects the exact
//     copy from the versioned table; identical state in → identical copy out; the {N}
//     count renders the exact singular/plural phrase ("1 item" / "3 items").
//   - The S5 wrapper fires EXACTLY when the existing UNMATCHED CONDITIONS predicate
//     (pairConditionsUnmatched, conditions_matched != true) fires — the same one
//     function the side-by-side callout and the review record use, so no drift — and
//     it only APPENDS its one line to Why, never replaces What/Why/Next of the base.
//   - RENDER-ONLY invariant: selecting panel copy over an inspection's state perturbs
//     neither the ReviewRecord canonical body / integrity digest NOR a reader-receipt
//     content_hash minted from the same run; the panel's copy sentences never appear
//     in either canonical preimage; and selection mutates none of its inputs.
//   - AT-5 vocab lint over the full copy table AND over every rendered state output
//     (pointer register only — also pinned in test/check-vocab-lint.test.mjs).
//
// Pure + content-blind: synthetic findings only, no DOM, no record content invented.
// Run: node --test test/reader-explain-panel.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  EXPLAIN_PANEL_VERSION,
  EXPLAIN_PANEL_UI,
  EXPLAIN_STATE_S1,
  EXPLAIN_STATE_S2,
  EXPLAIN_STATE_S3,
  EXPLAIN_STATE_S4,
  EXPLAIN_STATE_S5_S3,
  EXPLAIN_STATE_S5_S4,
  selectInspectionMeaning,
} from "../reader-explain-panel.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";
import {
  buildPairCapture,
  pairConditionsUnmatched,
  PAIR_SAME_MODEL,
  PAIR_EDITS,
} from "../reader-paired.js";
import { buildCheckRegister } from "../reader-checks.js";
import {
  assembleReviewRecord,
  serializeCanonical,
  digestReviewRecord,
} from "../reader-review-record.js";
import { buildSingleReceipt, canonicalizeForHash } from "../reader-receipt.js";

// ── Synthetic, content-blind fixtures ────────────────────────────────────────────
// The selection function reads only findings.length and pairRuns.length, so any
// object stands in for a finding; any object stands in for a pair_runs entry.
const F = { type: "omission" };
const PR = { targeted_answer: "synthetic second answer" };

const S = EXPLAIN_PANEL_UI.states;

// Assert the mode/state-independent shell of a selection result: the fixed heading,
// section labels, and the mandatory archive-boundary block + method link — present on
// ALL five states (the closing element the mission requires everywhere).
function expectShell(sel) {
  assert.equal(sel.copy.heading, EXPLAIN_PANEL_UI.heading);
  assert.deepEqual(sel.copy.section_labels, EXPLAIN_PANEL_UI.section_labels);
  assert.equal(sel.copy.archive_boundary, EXPLAIN_PANEL_UI.archive_boundary);
  assert.deepEqual(sel.copy.method_link, EXPLAIN_PANEL_UI.method_link);
  assert.ok(EXPLAIN_PANEL_UI.method_link.href, "the archive-boundary link has a destination");
  assert.ok(Array.isArray(sel.copy.why), "why is always an array of paragraph lines");
}

// The panel's own authored sentences for a result — what/why/next only. These are
// panel-unique prose (used for the leak scan); heading/labels/href are excluded
// because short labels could coincide with unrelated text.
function copySentences(copy) {
  return [copy.what, ...copy.why, copy.next];
}

// ── The copy table is versioned ──────────────────────────────────────────────────

test("the copy table is versioned", () => {
  assert.match(EXPLAIN_PANEL_VERSION, /^explain-panel\.v\d+$/);
});

// ── Determinism table: single mode (S1, S2) ──────────────────────────────────────

test("S1 — single, no findings — selects S1 verbatim with a single-paragraph Why", () => {
  const sel = selectInspectionMeaning({ pairRuns: [], findings: [] });
  assert.equal(sel.state_id, EXPLAIN_STATE_S1);
  expectShell(sel);
  assert.equal(sel.copy.what, S[EXPLAIN_STATE_S1].what);
  assert.deepEqual(sel.copy.why, [S[EXPLAIN_STATE_S1].why]);
  assert.equal(sel.copy.next, S[EXPLAIN_STATE_S1].next);
});

test("S1 is the safe fallback for absent/empty/degenerate input", () => {
  for (const arg of [undefined, {}, { findings: 0 }, { findings: -4 }, { findings: NaN }, { findings: "x" }]) {
    const sel = selectInspectionMeaning(arg);
    assert.equal(sel.state_id, EXPLAIN_STATE_S1, `expected S1 for ${JSON.stringify(arg)}`);
  }
});

test("S2 — single, findings — renders {N} exactly (singular vs plural) and keeps a single-paragraph Why", () => {
  const one = selectInspectionMeaning({ pairRuns: [], findings: [F] });
  assert.equal(one.state_id, EXPLAIN_STATE_S2);
  expectShell(one);
  assert.equal(one.copy.what, "The inspection surfaced 1 item worth checking before this answer gets used.");
  assert.deepEqual(one.copy.why, [S[EXPLAIN_STATE_S2].why]);
  assert.equal(one.copy.next, S[EXPLAIN_STATE_S2].next);

  const three = selectInspectionMeaning({ findings: [F, F, F] });
  assert.equal(three.state_id, EXPLAIN_STATE_S2);
  assert.equal(three.copy.what, "The inspection surfaced 3 items worth checking before this answer gets used.");
});

test("S2 — a finite number is accepted as the count directly", () => {
  const n = selectInspectionMeaning({ pairRuns: [], findings: 2 });
  assert.equal(n.state_id, EXPLAIN_STATE_S2);
  assert.equal(n.copy.what, "The inspection surfaced 2 items worth checking before this answer gets used.");
});

// ── Determinism table: paired mode, conditions matched (S3, S4 — no S5) ───────────

test("S3 — paired, no surfaced difference, matched conditions — selects S3 with no condition line", () => {
  const sel = selectInspectionMeaning({ pairRuns: [PR], findings: [], conditionsMatched: true });
  assert.equal(sel.state_id, EXPLAIN_STATE_S3);
  expectShell(sel);
  assert.equal(sel.copy.what, S[EXPLAIN_STATE_S3].what);
  assert.deepEqual(sel.copy.why, [S[EXPLAIN_STATE_S3].why]);
  assert.equal(sel.copy.next, S[EXPLAIN_STATE_S3].next);
  assert.ok(!sel.copy.why.includes(EXPLAIN_PANEL_UI.s5_condition_line));
});

test("S4 — paired, findings, matched conditions — selects S4 with no condition line", () => {
  const sel = selectInspectionMeaning({ pairRuns: [PR], findings: [F], conditionsMatched: true });
  assert.equal(sel.state_id, EXPLAIN_STATE_S4);
  expectShell(sel);
  assert.equal(sel.copy.what, S[EXPLAIN_STATE_S4].what);
  assert.deepEqual(sel.copy.why, [S[EXPLAIN_STATE_S4].why]);
  assert.equal(sel.copy.next, S[EXPLAIN_STATE_S4].next);
});

// ── Determinism table: the S5 wrapper compositions (S5∘S3, S5∘S4) ─────────────────

test("S5∘S3 — paired, no difference, unmatched/unverified conditions — wraps S3, appends exactly one line", () => {
  for (const cm of [false, "unverified", undefined]) {
    const sel = selectInspectionMeaning({ pairRuns: [PR], findings: [], conditionsMatched: cm });
    assert.equal(sel.state_id, EXPLAIN_STATE_S5_S3, `state for conditionsMatched=${String(cm)}`);
    expectShell(sel);
    // The base S3 What/Next are untouched; S5 only appends its line to Why.
    assert.equal(sel.copy.what, S[EXPLAIN_STATE_S3].what);
    assert.equal(sel.copy.next, S[EXPLAIN_STATE_S3].next);
    assert.deepEqual(sel.copy.why, [S[EXPLAIN_STATE_S3].why, EXPLAIN_PANEL_UI.s5_condition_line]);
  }
});

test("S5∘S4 — paired, findings, unmatched/unverified conditions — wraps S4, appends exactly one line", () => {
  for (const cm of [false, "unverified", undefined]) {
    const sel = selectInspectionMeaning({ pairRuns: [PR], findings: [F, F], conditionsMatched: cm });
    assert.equal(sel.state_id, EXPLAIN_STATE_S5_S4, `state for conditionsMatched=${String(cm)}`);
    expectShell(sel);
    assert.equal(sel.copy.what, S[EXPLAIN_STATE_S4].what);
    assert.equal(sel.copy.next, S[EXPLAIN_STATE_S4].next);
    assert.deepEqual(sel.copy.why, [S[EXPLAIN_STATE_S4].why, EXPLAIN_PANEL_UI.s5_condition_line]);
  }
});

test("S5 is a wrapper, never a replacement — it is always S5∘S3 or S5∘S4, never a bare S5", () => {
  const composed = [EXPLAIN_STATE_S5_S3, EXPLAIN_STATE_S5_S4];
  for (const findings of [[], [F]]) {
    const sel = selectInspectionMeaning({ pairRuns: [PR], findings, conditionsMatched: false });
    assert.ok(composed.includes(sel.state_id));
    assert.notEqual(sel.state_id, "S5");
  }
});

// ── No-drift: the S5 rule IS the shared UNMATCHED CONDITIONS predicate ─────────────

test("the S5 wrapper fires exactly when pairConditionsUnmatched fires (no drift with the callout)", () => {
  const inputs = [
    { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },      // matched → no S5
    { same_model: PAIR_SAME_MODEL.NO, edits: PAIR_EDITS.NONE },       // different model → S5
    { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED },    // disclosed edit → S5
    { same_model: PAIR_SAME_MODEL.NOT_SURE, edits: PAIR_EDITS.NONE }, // unverified → S5
  ];
  for (const input of inputs) {
    const capture = buildPairCapture(input);
    const predicate = pairConditionsUnmatched(capture);
    const sel = selectInspectionMeaning({ pairRuns: [PR], findings: [], conditionsMatched: capture.conditions_matched });
    const wrapped = sel.state_id === EXPLAIN_STATE_S5_S3;
    assert.equal(wrapped, predicate, `S5 wrapper must equal the callout predicate for ${JSON.stringify(input)}`);
    assert.equal(sel.copy.why.includes(EXPLAIN_PANEL_UI.s5_condition_line), predicate);
  }
});

// ── Determinism + purity ─────────────────────────────────────────────────────────

test("determinism: identical state in → byte-identical copy out", () => {
  const mk = () => selectInspectionMeaning({ pairRuns: [PR], findings: [F, F], conditionsMatched: "unverified" });
  assert.equal(JSON.stringify(mk()), JSON.stringify(mk()));
});

test("purity: selection mutates none of its inputs", () => {
  const pairRuns = [PR];
  const findings = [F, F];
  const beforePairRuns = JSON.stringify(pairRuns);
  const beforeFindings = JSON.stringify(findings);
  selectInspectionMeaning({ pairRuns, findings, conditionsMatched: false });
  assert.equal(JSON.stringify(pairRuns), beforePairRuns);
  assert.equal(JSON.stringify(findings), beforeFindings);
});

// ── RENDER-ONLY invariant ─────────────────────────────────────────────────────────
// A real single-mode inspection: synthetic answer + one finding, shaped the way
// api/read.js hands `result` to the exporter (register + receipt.open_run).
const ANSWER =
  "The report recommends approval. It rests on a projected figure of 4.2 million in the first year.";
const FINDING = {
  type: "omission",
  check: {
    supporting_proposition: "a projected figure of 4.2 million in the first year",
    dependent_output: "The report recommends approval",
    dependency_statement: "The recommendation rests on the projected figure.",
    verification_question: "What source gives the projected figure this recommendation depends on?",
    resolver: "authority",
    propagation: "recommendation_or_action",
  },
};
const INSPECTOR = { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: "reader.v3" };
const CREATED = "2026-07-17T12:00:00Z";

function buildResult() {
  const register = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: ANSWER,
    findings: [FINDING],
    inspector: INSPECTOR,
  });
  return {
    checks: register,
    receipt: {
      open_run: {
        answer: ANSWER,
        declared_model: "GPT-5",
        provenance: {
          request_id: "req_abc123",
          run_timestamp: "2026-07-17T11:59:00Z",
          reader_model_version: "claude-opus-4-8",
          inspector_prompt_version: "reader.v3",
        },
      },
    },
  };
}

test("RENDER-ONLY: selecting panel copy perturbs neither the record digest nor a receipt hash, and no copy sentence enters either canonical preimage", async () => {
  const result = buildResult();

  // The record's canonical body (integrity excluded) and its integrity digest.
  const record = assembleReviewRecord({ result, createdAt: CREATED });
  const bodyBefore = serializeCanonical(record);
  const digestBefore = await digestReviewRecord(record);

  // A reader-receipt content_hash minted from the same open run (as api/read.js does).
  const openRun = result.receipt.open_run;
  const envelope = buildSingleReceipt({
    generatedAt: CREATED,
    question: "Q",
    topic: "T",
    declaredModel: openRun.declared_model,
    answer: openRun.answer,
    provenance: openRun.provenance,
  });
  const receiptPreimage = JSON.stringify(canonicalizeForHash(envelope));
  const receiptHashBefore = createHash("sha256").update(receiptPreimage, "utf8").digest("hex");

  // Select the panel copy over the SAME inspection state — single mode, one card → S2.
  // This is exactly the data the single-mode wiring feeds the panel (checks.cards).
  const sel = selectInspectionMeaning({ pairRuns: [], findings: result.checks.cards });
  assert.equal(sel.state_id, EXPLAIN_STATE_S2, "one card → findings present → S2");

  // The record and the receipt are byte-for-byte what they were before selection.
  assert.equal(serializeCanonical(record), bodyBefore, "record canonical body unchanged by selection");
  assert.equal(await digestReviewRecord(record), digestBefore, "record integrity digest unchanged by selection");
  assert.equal(
    createHash("sha256").update(JSON.stringify(canonicalizeForHash(envelope)), "utf8").digest("hex"),
    receiptHashBefore,
    "receipt content_hash unchanged by selection",
  );

  // And nothing the panel produced leaked into either canonical preimage.
  const sentences = copySentences(sel.copy);
  assert.ok(sentences.length >= 3);
  for (const s of sentences) {
    assert.ok(!bodyBefore.includes(s), `panel copy leaked into the record body: "${s}"`);
    assert.ok(!receiptPreimage.includes(s), `panel copy leaked into the receipt preimage: "${s}"`);
  }
});

// ── AT-5 vocab lint (pointer register) ────────────────────────────────────────────

test("AT-5: the whole copy table contains no banned construction", () => {
  assert.deepEqual(lintUserFacingStrings(EXPLAIN_PANEL_UI), []);
});

test("AT-5: every rendered state output (with {N} filled and any S5 line appended) is pointer register", () => {
  const rendered = [
    selectInspectionMeaning({ findings: [] }), // S1
    selectInspectionMeaning({ findings: [F, F, F] }), // S2 (3 items)
    selectInspectionMeaning({ pairRuns: [PR], findings: [], conditionsMatched: true }), // S3
    selectInspectionMeaning({ pairRuns: [PR], findings: [F], conditionsMatched: true }), // S4
    selectInspectionMeaning({ pairRuns: [PR], findings: [], conditionsMatched: false }), // S5∘S3
    selectInspectionMeaning({ pairRuns: [PR], findings: [F], conditionsMatched: "unverified" }), // S5∘S4
  ].map((s) => s.copy);
  for (const copy of rendered) {
    assert.deepEqual(lintUserFacingStrings(copy), [], `rendered copy tripped the lint: ${JSON.stringify(copy)}`);
  }
});
