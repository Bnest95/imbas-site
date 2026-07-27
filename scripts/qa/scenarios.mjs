// scripts/qa/scenarios.mjs — canned API payloads + drive steps for the visual
// acceptance harness. One entry per app state we capture.
//
// WHY THESE ARE BUILT, NOT HAND-WRITTEN JSON
// A hand-written fixture drifts from the endpoint the moment the endpoint changes,
// and it can encode a payload the server could never actually emit (a wrong receipt
// hash, a check block whose quotes don't resolve against the answer). So every
// derived part of a payload here is produced by the SAME product modules the
// endpoints use — reader-receipt.js, reader-paired.js, reader-checks.js. Only the
// parts a model authors (the read prose, the findings, the delta items) are canned,
// because those are canned by definition. The canonical result goes one better: the
// endpoint's own adapter is imported and called, so that part of the payload cannot
// drift from the endpoint at all.
//
// Shape derived from, and only from:
//   api/read.js        — parseMeasurement (:466), the payload literal (:1050),
//                        buildAct2 (:524), buildChecks (:547),
//                        buildCanonicalSingle (imported, not copied)
//   api/read-paired.js — parsePairedMeasurement (:305), buildPairedPayload (:387)
//   reader-paired.js   — deriveConditionsMatched (:210), PAIR_* enums
//
// EVERY FIXTURE HERE IS SYNTHETIC. The answers, questions, findings, and deltas are
// invented to exercise interface behavior. They are not captures, not candidate
// material, and not evidence, and nothing here may be quoted as a finding. This is
// the "clearly marked synthetic fixtures" tier of the v3.1 §P source order — the
// tier permitted only for demonstrating interface behavior.

import { createHash } from "node:crypto";
import {
  buildSingleReceipt,
  buildPairedReceipt,
  canonicalizeForHash,
  pairedGapEstimateLabel,
} from "../../reader-receipt.js";
import { buildTargetedPrompt, PAIRED_METHOD_VERSION, deriveConditionsMatched, PAIR_SAME_MODEL, PAIR_EDITS } from "../../reader-paired.js";
import { buildCheckRegister } from "../../reader-checks.js";
import { buildCanonicalSingle } from "../../api/read.js";
import { buildCanonicalPaired } from "../../api/read-paired.js";

const sha256Hex = (s) => createHash("sha256").update(s).digest("hex");

// Mirrors api/read.js — kept as local constants because the endpoint does not
// export them. Nothing checks these against the endpoint: if api/read.js changes
// one of these values, this file keeps the old one and the harness reports no
// change. Edit both together.
const MODEL = "claude-opus-4-8";
const READER_PROMPT_VERSION = "reader.v3";
const CANDIDATE_METHOD_VERSION = "1.0";
const ESTIMATE_SCALE_VERSION = "1.0";
const ESTIMATE_TYPE_SINGLE = "candidate_gap";
const ESTIMATE_TYPE_PAIRED = "paired_gap";
const RUBRIC_VERSION = "1.0";
const CANDIDATE_FINDING_TYPES = ["candidate missing item", "candidate framing issue", "candidate deflection"];
const CANDIDATE_TO_DETECTOR_FINDING = {
  "candidate missing item": "omission",
  "candidate framing issue": "framing_drift",
  "candidate deflection": "deflection",
};
const INSPECTOR_RUN_CONDITIONS = { thinking: "adaptive", max_tokens: 8192, temperature: "default" };

// Frozen so a capture is byte-reproducible: a live clock would change the receipt
// hash and the rendered timestamp on every run, and two captures of the same state
// would never compare equal.
const FROZEN_TIMESTAMP = "2026-07-25T12:00:00.000Z";
const FROZEN_REQUEST_ID = "0000000000000000";

// ── Synthetic source material ────────────────────────────────────────────────
// The check blocks below quote this text verbatim. reader-checks.js resolves every
// quote as an exact span against the answer and DROPS any check it cannot resolve
// from both ends, so editing this string without editing the quotes silently empties
// the Check Register. assertScenarioIntegrity() below fails loudly if that happens.
const SYNTHETIC_QUESTION = "My landlord still has my security deposit. How long do they have to return it?";

const SYNTHETIC_ANSWER = [
  "A landlord must return a security deposit within 30 days of the tenant moving out.",
  "If the landlord keeps any part of the deposit, they have to send an itemized list of deductions.",
  "Most tenants get the full amount back without any trouble, so there is usually nothing to worry about.",
].join(" ");

const SYNTHETIC_SECOND_ANSWER = [
  "The deadline depends on the state. It runs from 14 days in some states to 60 days in others, so the 30-day figure is not a national rule.",
  "Several states also require the landlord to pay the tenant a penalty — often two or three times the deposit — when the deadline is missed.",
  "You should check your own state's statute before relying on any single number.",
].join(" ");

// ── Single mode, measurement findings present ────────────────────────────────
function singleMeasurement() {
  const findings = [
    {
      type: "candidate missing item",
      anchor: "A landlord must return a security deposit within 30 days of the tenant moving out.",
      materiality:
        "The deadline is set by state law and varies. The answer gives one number without naming which jurisdiction it applies to.",
      check: {
        supporting_proposition: "A landlord must return a security deposit within 30 days of the tenant moving out.",
        dependent_output: "If the landlord keeps any part of the deposit, they have to send an itemized list of deductions.",
        dependency_statement: "The itemization duty is stated as following from the 30-day deadline, so it inherits whatever jurisdiction that deadline came from.",
        verification_question: "Which state's statute sets this deadline, and what does that statute require?",
        resolver: "authority",
      },
    },
    {
      type: "candidate framing issue",
      anchor: "Most tenants get the full amount back without any trouble, so there is usually nothing to worry about.",
      materiality:
        "The closing line lowers the stakes of a question the person asked because the deadline had already passed.",
    },
  ];

  const finding_counts = {};
  for (const t of CANDIDATE_FINDING_TYPES) finding_counts[t] = 0;
  for (const f of findings) finding_counts[f.type]++;

  // Exactly the object parseMeasurement (api/read.js:466) returns.
  return {
    findings,
    finding_counts,
    gap_estimate: 2,
    estimate_rationale:
      "Two candidate observations, one of them a jurisdiction the answer never named. Unvalidated.",
    estimate_type: ESTIMATE_TYPE_SINGLE,
    estimate_scale_version: ESTIMATE_SCALE_VERSION,
    candidate_method_version: CANDIDATE_METHOD_VERSION,
    unvalidated: true,
  };
}

function singleReadPayload() {
  const measurement = singleMeasurement();

  const payload = {
    completeness: "partial",
    the_read:
      "The answer gives one deadline as if it were the only one. Security deposit deadlines are set state by state, and the answer never says which state it is describing, so a reader in the wrong state gets a confident number that does not apply to them. It then closes by lowering the stakes of the question that was actually asked.",
    what_was_left_out: [
      "Which jurisdiction the 30-day deadline comes from.",
      "That the deadline varies by state, from roughly two weeks to two months.",
      "That several states add a penalty when a landlord misses the deadline.",
    ],
    how_it_was_shaped:
      "It closes by reassuring, which softens a question the person asked because something had already gone wrong.",
    inspection_note:
      "This read identifies how the answer was shaped — what it surfaced, omitted, or framed — not whether its claims are true. Verify any factual claims independently before citing them.",
    source: "agent",
    measurement,
  };

  // Check Register — real assembler, real span resolution against the answer.
  const checks = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: SYNTHETIC_ANSWER,
    findings: measurement.findings
      .filter((f) => f.check)
      .map((f) => ({ type: CANDIDATE_TO_DETECTOR_FINDING[f.type], check: f.check })),
    inspector: { model: MODEL, model_version: MODEL, prompt_version: READER_PROMPT_VERSION },
  });

  // Canonical result — the endpoint's OWN adapter, not a copy of it. This is what the
  // interface renders from, so a fixture without it captures a state the endpoint
  // cannot emit. Built before the receipt because the receipt carries it (schema 1.1).
  const canonical = buildCanonicalSingle(measurement, SYNTHETIC_ANSWER, checks);

  // Receipt: built by the real builder, hashed by the real canonicalizer, so the
  // fixture carries a genuinely valid content_hash instead of an invented one.
  const receipt = buildSingleReceipt({
    generatedAt: FROZEN_TIMESTAMP,
    question: SYNTHETIC_QUESTION,
    topic: "",
    declaredModel: "",
    answer: SYNTHETIC_ANSWER,
    inspection: {
      completeness: payload.completeness,
      the_read: payload.the_read,
      what_was_left_out: payload.what_was_left_out,
      how_it_was_shaped: payload.how_it_was_shaped,
      inspection_note: payload.inspection_note,
    },
    measurement,
    canonical,
    provenance: {
      reader_model_version: MODEL,
      inspector_prompt_version: READER_PROMPT_VERSION,
      inspector_run_conditions: INSPECTOR_RUN_CONDITIONS,
      source_content_hash: sha256Hex(`${SYNTHETIC_QUESTION}\n${SYNTHETIC_ANSWER}`),
      reader_output_hash: sha256Hex(JSON.stringify(payload)),
      run_timestamp: FROZEN_TIMESTAMP,
      request_id: FROZEN_REQUEST_ID,
    },
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));
  payload.receipt = receipt;

  // Act 2 offer — real construction rule, real version tag.
  const { eligible, targeted_prompt } = buildTargetedPrompt({ measurement });
  payload.act2 = {
    eligible,
    available: true,
    degraded_reason: null,
    targeted_prompt: eligible ? targeted_prompt : "",
    targeted_prompt_hash: eligible ? sha256Hex(targeted_prompt) : "",
    paired_method_version: PAIRED_METHOD_VERSION,
  };

  payload.checks = checks;
  payload.result = canonical;

  return payload;
}

// ── Paired mode ──────────────────────────────────────────────────────────────
// Matched vs unmatched is NOT a server field. reader-paired.js:210 derives it
// client-side from the paste-back form, so both paired scenarios share one payload
// and differ only in the capture answers the drive steps give. Encoding that here
// keeps the harness honest about where the condition actually comes from.
function pairedReadPayload() {
  const delta_items = [
    {
      type: "delta",
      point: "The second answer names the deadline as state-set and gives a range, where the first gave a single national-sounding number.",
      open_side: "A landlord must return a security deposit within 30 days of the tenant moving out.",
      targeted_side: "The deadline depends on the state. It runs from 14 days in some states to 60 days in others, so the 30-day figure is not a national rule.",
      signal_pattern: "Omission",
    },
    {
      type: "delta",
      point: "The second answer names a penalty for a missed deadline; the first did not mention one.",
      open_side: "",
      targeted_side: "Several states also require the landlord to pay the tenant a penalty — often two or three times the deposit — when the deadline is missed.",
      signal_pattern: "Omission",
    },
  ];

  const signal_counts = { Omission: 0, "Framing Drift": 0, Deflection: 0 };
  for (const d of delta_items) if (d.signal_pattern in signal_counts) signal_counts[d.signal_pattern]++;

  const openPayload = singleReadPayload();
  const targetedPrompt = openPayload.act2.targeted_prompt;

  const pairedAnalysis = {
    open_run_id: FROZEN_REQUEST_ID,
    targeted_prompt: targetedPrompt,
    targeted_prompt_hash: sha256Hex(targetedPrompt),
    targeted_answer: SYNTHETIC_SECOND_ANSWER,
    targeted_answer_hash: sha256Hex(SYNTHETIC_SECOND_ANSWER),
    delta_items,
    gap_estimate: 2,
    estimate_rationale:
      "Counted only decision-relevant deltas, not the second answer's added length. Unvalidated.",
    estimate_type: ESTIMATE_TYPE_PAIRED,
    rubric_version: RUBRIC_VERSION,
    paired_method_version: PAIRED_METHOD_VERSION,
  };
  // The endpoint's own adapter again. It reads delta_items and the estimate fields
  // off the analysis object, which is exactly what the endpoint hands it.
  pairedAnalysis.canonical = buildCanonicalPaired(pairedAnalysis, SYNTHETIC_ANSWER, SYNTHETIC_SECOND_ANSWER);

  const receipt = buildPairedReceipt({
    generatedAt: FROZEN_TIMESTAMP,
    openRun: openPayload.receipt.open_run,
    pairedAnalysis,
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));

  // Exactly buildPairedPayload (api/read-paired.js:387).
  return {
    source: "agent",
    delta_items,
    signal_counts,
    result: pairedAnalysis.canonical,
    gap_estimate: pairedAnalysis.gap_estimate,
    gap_estimate_label: pairedGapEstimateLabel(pairedAnalysis.gap_estimate),
    estimate_rationale: pairedAnalysis.estimate_rationale,
    estimate_type: ESTIMATE_TYPE_PAIRED,
    rubric_version: RUBRIC_VERSION,
    paired_method_version: PAIRED_METHOD_VERSION,
    targeted_prompt: targetedPrompt,
    unvalidated: true,
    idempotent: false,
    receipt,
  };
}

// ── Drive steps ──────────────────────────────────────────────────────────────
// A step is one of:
//   { fill: selector, text }        set a React-controlled input (native setter + input event)
//   { click: selector }             click the first match
//   { clickText: selector, text }   click the first match whose textContent contains text
//   { waitFor: selector }           wait until the selector matches and has a non-zero box
//   { waitForText: text }           wait until body text contains this string
const DRIVE_SINGLE = [
  { fill: ".wb-reader-v2__field--answer textarea", text: SYNTHETIC_ANSWER },
  { waitFor: ".wb-reader-v2__reveal textarea" },
  { fill: ".wb-reader-v2__reveal textarea", text: SYNTHETIC_QUESTION },
  { waitFor: "button.wb-reader-cta:not([disabled])" },
  { click: "button.wb-reader-cta" },
  { waitFor: ".wb-measure__list li.wb-measure__finding" },
];

export const SCENARIOS = {
  "single-findings": {
    name: "single-findings",
    drivable: true,
    state: "Single mode, Reader result with measurement findings",
    expected:
      "MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Missing item: 1 · Framing issue: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors.",
    routes: { "/api/read": singleReadPayload },
    steps: DRIVE_SINGLE,
    // Proof the captured pixels show the state, not just that a file was written.
    assertText: [
      "MEASUREMENT",
      "Candidate findings",
      "Missing item: 1 · Framing issue: 1 · Deflection: 0",
    ],
    assertSelector: ".wb-measure__list li.wb-measure__finding",
  },

  // The two paired scenarios are FIXTURE-ONLY. Their payloads are complete and
  // integrity-checked, but no drive steps exist yet for the Act 2 paste-back form,
  // so the harness refuses to capture them rather than driving the single-mode flow
  // and filing the resulting image under a paired name. A screenshot labelled with a
  // state it does not show is the exact failure this harness exists to prevent.
  //
  // To make these drivable, a later pass adds steps for the Act 2 panel:
  // the second-answer textarea inside .wb-act2__test, the two .wb-act2__capture-opt
  // button groups (same_model, then edits), and the .wb-act2__test-cta submit.
  "paired-matched": {
    name: "paired-matched",
    state: "Paired comparison, conditions derived as MATCHED",
    expected:
      "Side-by-side comparison renders with no unmatched-conditions warning. conditions_matched === true, derived client-side from same model + no edits.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    drivable: false,
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
  },

  "paired-unmatched": {
    name: "paired-unmatched",
    state: "Paired comparison, conditions derived as UNMATCHED",
    expected:
      "Side-by-side comparison renders WITH the unmatched-conditions warning. conditions_matched === false, derived client-side from a disclosed edit.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    drivable: false,
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
  },
};

// Resolve a scenario's route table to concrete payloads.
export function resolvePayloads(scenario) {
  const out = {};
  for (const [route, build] of Object.entries(scenario.routes)) {
    out[route] = typeof build === "function" ? build() : build;
  }
  return out;
}

// Fail loudly on the two silent-corruption modes a fixture can drift into:
// a check that no longer resolves against the answer, and a paired scenario whose
// declared condition disagrees with what the real derivation returns.
export function assertScenarioIntegrity(scenario) {
  const problems = [];
  const payloads = resolvePayloads(scenario);

  const read = payloads["/api/read"];
  if (read) {
    if (!read.measurement || !read.measurement.findings.length) {
      problems.push("single payload carries no measurement findings");
    }
    const cards = read.checks && Array.isArray(read.checks.cards) ? read.checks.cards.length : 0;
    const withCheck = read.measurement.findings.filter((f) => f.check).length;
    if (withCheck > 0 && cards === 0) {
      problems.push(
        `${withCheck} finding(s) carry a check block but buildCheckRegister produced 0 cards — a quote no longer resolves verbatim against SYNTHETIC_ANSWER`
      );
    }
    if (!read.receipt || !read.receipt.integrity || !read.receipt.integrity.content_hash) {
      problems.push("single payload receipt carries no content_hash");
    }
    // The construction door must not lose a finding on the way through. Every model
    // finding is one recorded finding, whatever the Check Register did with it.
    const recorded = read.result ? read.result.counts.recorded_findings.value : -1;
    if (recorded !== read.measurement.findings.length) {
      problems.push(
        `canonical result records ${recorded} finding(s) for ${read.measurement.findings.length} measurement finding(s)`
      );
    }
  }

  if (scenario.capture) {
    const derived = deriveConditionsMatched(scenario.capture);
    const wantsMatched = scenario.name.endsWith("-matched");
    if (wantsMatched && derived !== true) {
      problems.push(`scenario claims matched conditions but deriveConditionsMatched returned ${JSON.stringify(derived)}`);
    }
    if (!wantsMatched && derived === true) {
      problems.push("scenario claims unmatched conditions but deriveConditionsMatched returned true");
    }
  }

  return problems;
}

export const SYNTHETIC = { SYNTHETIC_QUESTION, SYNTHETIC_ANSWER, SYNTHETIC_SECOND_ANSWER };
