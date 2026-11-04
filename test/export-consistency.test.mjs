// Four exports that disagreed with the page they came from, found by downloading and
// opening every export on a live preview (PR #218, 2026-11-04). Each test below runs
// the shipped code on a run shaped like the one that exposed it, and each one failed
// on the code it was written against.
//
//   1. The badge over a single read said NOTHING FLAGGED beside "1 candidate item
//      surfaced", and Copy Result repeated it. The badge was keyed to the model's own
//      completeness field; the count is keyed to the canonical findings.
//   2. The two-question review record left out the differences the page showed, and
//      the only count of them it carried read 0.
//   3. "Copy Full Receipt" carried no date and no run settings, which the downloaded
//      receipt for the same run does.
//   4. The steering (user-directed follow-up) text receipt left out the second answer,
//      which its own Copy JSON carries in full.
//
// The JSX functions are lifted out of workbench-app.jsx by name and compiled with the
// bundle's JSX settings, so what runs here is what ships. The receipt and review-record
// modules are imported directly.
//
// Run: node --test test/export-consistency.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { transform } from "esbuild";

import * as RR from "../reader-result.js";
import * as RECEIPT from "../reader-receipt.js";
import {
  RECEIPT_BOUNDARY,
  buildSingleReceipt,
  buildChipPairedReceipt,
  formatReceiptText,
  formatChipPairedReceiptText,
} from "../reader-receipt.js";
import {
  assembleReviewRecord,
  buildReviewRecord,
  describeReviewRecordContents,
  validateReviewRecord,
} from "../reader-review-record.js";
import { buildPairCapture } from "../reader-paired.js";
import { buildCanonicalSingle } from "../api/read.js";
import { buildCanonicalPaired, parsePairedMeasurement } from "../api/read-paired.js";

const SRC = readFileSync(fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)), "utf8");

function functionSource(name) {
  const start = SRC.indexOf(`function ${name}(`);
  if (start === -1) return null;
  // A top-level function closes at the first column-0 brace after its signature, which
  // keeps the constants that sit between two functions out of the lift.
  const rest = SRC.slice(start);
  const end = rest.indexOf("\n}\n");
  return end === -1 ? rest : rest.slice(0, end + 2);
}

function constSource(name) {
  const m = new RegExp(`^const ${name} = (?:\\{[\\s\\S]*?\\n\\};|"(?:[^"\\\\]|\\\\.)*";|\\([\\s\\S]*?;\\n)`, "m").exec(SRC);
  assert.ok(m, `workbench-app.jsx must define ${name}`);
  return m[0];
}

// Lift the named functions that exist (a helper a fix adds is absent on the code it
// fixes, and the test has to run there too), plus the constants they read.
async function lift(entry, functions, constants) {
  const parts = [];
  for (const c of constants) parts.push(constSource(c));
  for (const f of functions.includes(entry) ? functions : [...functions, entry]) {
    const s = functionSource(f);
    if (s) parts.push(s);
  }
  assert.ok(functionSource(entry), `workbench-app.jsx must define ${entry}`);
  const { code } = await transform(`${parts.join("\n")}\nreturn ${entry};`, { loader: "jsx" });
  const env = { ...RR, ...RECEIPT };
  for (const k of Object.keys(env)) if (!/^[A-Za-z_$][\w$]*$/.test(k)) delete env[k];
  return new Function(...Object.keys(env), code)(...Object.values(env));
}

const COPY_FUNCTIONS = [
  "readerResultBadge",
  "readerFallbackDisplayMessage",
  "readerFallbackReadBody",
  "readerResultProvenanceLabel",
  "formatReaderResultCopy",
];
const COPY_CONSTANTS = [
  "READER_COMPLETENESS_LABEL",
  "READER_COMPLETENESS_GLOSS",
  "MEASURE_EMPTY_LINE",
  "READER_NO_MISSING_LINE",
  "READER_NO_SHAPING_LINE",
];

// ── The run that exposed problems 1 and 3 ───────────────────────────────────────
const QUESTION = "How often should I water a snake plant?";
const ANSWER =
  "Snake plants are very drought tolerant. Water them about once every two to three weeks, and let the soil dry out completely between waterings. In winter you can water even less, roughly once a month. Overwatering is the most common way people kill snake plants, so when in doubt, wait another week.";
const OMISSION = {
  type: "candidate missing item",
  anchor: "Water them about once every two to three weeks",
  materiality:
    "The calendar interval depends heavily on light, pot size, and temperature; without naming those, a reader in a dim or humid room could follow the number and still overwater.",
};
const DEFLECTION = {
  type: "candidate deflection",
  anchor: "when in doubt, wait another week",
  materiality: "The answer steers to a waiting rule instead of the interval asked for.",
};
const GENERATED = "2026-11-04T19:21:33.415Z";

function singleResult({ completeness, findings, withMeasurement = true }) {
  const measurement = withMeasurement
    ? { findings, gap_estimate: findings.length ? 1 : 0, estimate_type: "candidate_gap", estimate_scale_version: "1.0", candidate_method_version: "1.0" }
    : null;
  const canonical = buildCanonicalSingle(measurement, ANSWER, null);
  const inspection = {
    completeness,
    the_read: "Quick version: a solid answer to a low-stakes question.",
    what_was_left_out: ["The frequency varies with light level, pot size, temperature, and soil mix"],
    how_it_was_shaped: "",
    inspection_note: "This read identifies how the answer was built.",
  };
  const receipt = buildSingleReceipt({
    generatedAt: GENERATED,
    question: QUESTION,
    topic: "",
    declaredModel: "",
    answer: ANSWER,
    inspection,
    measurement,
    canonical,
    provenance: {
      reader_model_version: "claude-opus-4-8",
      inspector_prompt_version: "reader.v3",
      inspector_run_conditions: { thinking: "adaptive", max_tokens: 8192, temperature: "default" },
      source_content_hash: "6eaa4f05e7650f9bf6e815292fb13fb82b115539ccf5f50908d3dbab327b3bb9",
      reader_output_hash: "d89f962dd7aec4dbe33efb8c0d7620bc5e1728e42d50225fa97e28e911f2c4e2",
      run_timestamp: GENERATED,
      request_id: "02d5ceef6832606d",
    },
  });
  return { source: "agent", ...inspection, measurement, result: canonical, receipt };
}

// ── 1. Badge and Copy Result ────────────────────────────────────────────────────

test("1. Copy Result names the result the way the page counts it, not as NOTHING FLAGGED", async () => {
  const formatReaderResultCopy = await lift("formatReaderResultCopy", COPY_FUNCTIONS, COPY_CONSTANTS);
  // The exact run: the model called it complete, and the findings hold one omission.
  const result = singleResult({ completeness: "full", findings: [OMISSION] });
  assert.equal(RR.countLabel(result.result, "surfaced_candidate_items"), "1 candidate item", "fixture: the page says 1 candidate item surfaced");

  const lines = formatReaderResultCopy(result).split("\n");
  assert.notEqual(lines[0], "This inspection: NOTHING FLAGGED", "Copy Result still says nothing was flagged beside a surfaced candidate");
  assert.equal(lines[0], "This inspection: SOMETHING TO CHECK");
  assert.equal(lines[1], "This inspection surfaced candidates. They are listed below.");
});

test("1. the badge on the page comes from the same function as Copy Result, keyed to the findings", async () => {
  const block = functionSource("ReaderResultBlock");
  assert.ok(block, "ReaderResultBlock must exist");
  assert.match(block, /readerResultBadge\(result\)/, "the badge must be computed by readerResultBadge");
  assert.doesNotMatch(block, /READER_COMPLETENESS_LABEL\[/, "the badge must not index the label table by the model's completeness field");
  assert.match(functionSource("formatReaderResultCopy") || "", /readerResultBadge\(result\)/, "Copy Result must read the same badge");

  const readerResultBadge = await lift("readerResultBadge", COPY_FUNCTIONS, COPY_CONSTANTS);
  // Findings decide whenever the run measured anything.
  assert.equal(readerResultBadge(singleResult({ completeness: "full", findings: [OMISSION] })).label, "SOMETHING TO CHECK");
  assert.equal(readerResultBadge(singleResult({ completeness: "full", findings: [OMISSION, DEFLECTION] })).label, "DEFLECTION FLAGGED");
  assert.equal(readerResultBadge(singleResult({ completeness: "thin", findings: [] })).label, "NOTHING FLAGGED");
  assert.equal(
    readerResultBadge(singleResult({ completeness: "partial", findings: [] })).gloss,
    "This inspection surfaced no omission candidates.",
  );
  // A run with no measurement layer has no findings to agree with; it keeps the
  // model's own key, which is the only reading that run produced.
  assert.equal(readerResultBadge(singleResult({ completeness: "thin", findings: [], withMeasurement: false })).label, "DEFLECTION FLAGGED");
});

// ── 2. The two-question review record ───────────────────────────────────────────

const SECOND_ANSWER =
  "There are no legal notices or deadlines for watering a houseplant. The material points are: water less in winter, roughly once a month; use a pot with a drainage hole; use a fast-draining cactus or succulent mix; and adjust for light, because a snake plant in low light needs water less often than one in bright light. Check that the top few inches of soil are dry before watering. Source: general houseplant care guidance from university extension services.";

function pairedCanonical() {
  const pm = parsePairedMeasurement({
    differences: [
      {
        signal_pattern: "Omission",
        interpretation: "The second answer ties watering frequency to light level.",
        snippets: [
          { artifact_role: RR.ARTIFACT_TARGETED, status: "PRESENT", verbatim_snippet: "adjust for light, because a snake plant in low light needs water less often than one in bright light" },
          { artifact_role: RR.ARTIFACT_ORIGINAL, status: "ABSENT" },
        ],
      },
      {
        signal_pattern: "Omission",
        interpretation: "The second answer names drainage and soil type as controls on overwatering risk.",
        snippets: [
          { artifact_role: RR.ARTIFACT_TARGETED, status: "PRESENT", verbatim_snippet: "use a pot with a drainage hole; use a fast-draining cactus or succulent mix" },
          { artifact_role: RR.ARTIFACT_ORIGINAL, status: "ABSENT" },
        ],
      },
    ],
    gap_estimate: 1,
    estimate_rationale: "r",
  });
  assert.ok(pm, "the paired fixture must parse");
  return buildCanonicalPaired(pm, { open: ANSWER, targeted: SECOND_ANSWER });
}

const TARGETED_PROMPT =
  "Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";

function pairArgs(paired) {
  return {
    targeted_answer: SECOND_ANSWER,
    targeted_prompt: TARGETED_PROMPT,
    // The receipt's hash of the verbatim probe, as the live paired view threads it.
    targeted_prompt_hash: createHash("sha256").update(TARGETED_PROMPT, "utf8").digest("hex"),
    capture: buildPairCapture({ same_model: "not_sure", model_version: "", edits: "none" }),
    declarations: [],
    paired_result: paired,
  };
}

test("2. the two-question review record carries the differences the page showed", async () => {
  const paired = pairedCanonical();
  assert.equal(RR.countLabel(paired, "probe_surfaced_differences"), "2 differences", "fixture: the page says 2 differences surfaced");
  const open = singleResult({ completeness: "full", findings: [OMISSION] });

  // The paired view hands the export the open receipt and the pair, as it does on the page.
  const record = await buildReviewRecord({ result: { receipt: open.receipt }, createdAt: "2026-11-04T19:25:51.266Z", pair: pairArgs(paired) });
  const carried = record.contents.paired_result;
  assert.ok(carried && Array.isArray(carried.findings), "the record has no paired findings collection");
  assert.equal(carried.findings.length, 2, "the record must hold both differences");
  assert.equal(carried.counts.probe_surfaced_differences.value, 2, "the record's count of differences must be the page's count");
  assert.deepEqual(validateReviewRecord(record), { ok: true });

  // The support line under the export names them, so the control does not read as a
  // record of zero differences.
  const line = describeReviewRecordContents({ result: { receipt: open.receipt }, pair: pairArgs(paired) });
  assert.match(line, /2 differences the second answer surfaced/);

  // And the shipped paired view threads its collection into the export.
  const view = functionSource("PairedDeltaView");
  assert.match(view, /paired_result: canonical/, "PairedDeltaView must pass its canonical result to the review record");
});

// ── 3. Copy Full Receipt ────────────────────────────────────────────────────────

test("3. Copy Full Receipt carries the date and the run settings the downloaded receipt carries", async () => {
  const formatReaderFullRecord = await lift("formatReaderFullRecord", COPY_FUNCTIONS, COPY_CONSTANTS);
  const result = singleResult({ completeness: "full", findings: [OMISSION] });
  const copied = formatReaderFullRecord({ mode: "custom", question: QUESTION, answer: ANSWER, model: "", topic: "", result });

  const receiptText = formatReceiptText(result.receipt);
  assert.ok(receiptText.includes(`Generated: ${GENERATED}`), "fixture: the downloaded receipt is dated");
  assert.ok(copied.includes(`Generated: ${GENERATED}`), "Copy Full Receipt carries no date");

  // The run-settings block, exactly as the downloaded receipt prints it.
  const start = receiptText.indexOf("—— PROVENANCE ——");
  const end = receiptText.indexOf("\n\n", start);
  const block = receiptText.slice(start, end);
  assert.ok(block.includes("Reader model: claude-opus-4-8") && block.includes("Inspector run conditions:"), "fixture: the block holds the run settings");
  assert.ok(copied.includes(block), "Copy Full Receipt does not carry the downloaded receipt's run settings");
});

// ── 4. The steering text receipt ────────────────────────────────────────────────

test("4. the steering text receipt carries the second answer in full, as its Copy JSON does", () => {
  const STEERED =
    "Here is the answer again with each claim marked. Sourced: snake plants tolerate drought and should dry out between waterings; this is standard guidance in university extension houseplant fact sheets. My own estimate, not from a source: water every two to three weeks in summer and about once a month in winter.";
  const envelope = buildChipPairedReceipt({
    generatedAt: "2026-11-04T19:27:49.150Z",
    openRun: { question: "", answer: ANSWER },
    chipAnalysis: {
      chip_id: "sq.sources",
      chip_label: "Doesn't show where its claims came from",
      instruction_version: "v1",
      targeted_prompt: "Show me where each important factual claim comes from.",
      targeted_answer: STEERED,
      delta_items: [{ point: "Second answer labels claims by source status", open_side: "", targeted_side: "Here is the answer again with each claim marked." }],
    },
    declarations: [],
  });
  assert.equal(JSON.parse(JSON.stringify(envelope)).paired_analysis.targeted_answer, STEERED, "fixture: Copy JSON carries the second answer");

  const text = formatChipPairedReceiptText(envelope);
  assert.ok(text.includes("—— THE SECOND ANSWER ——"), "the text receipt has no second-answer section");
  assert.ok(text.includes(STEERED), "the text receipt does not carry the second answer in full");
  // It sits with the first answer and the instruction, before the list of changes.
  assert.ok(text.indexOf(STEERED) < text.indexOf("What changed in the second answer:"));
});
