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
import {
  buildTargetedPrompt,
  PAIRED_METHOD_VERSION,
  deriveConditionsMatched,
  PAIR_CAPTURE_UI,
  PAIR_SAME_MODEL,
  PAIR_EDITS,
} from "../../reader-paired.js";
import { buildCheckRegister } from "../../reader-checks.js";
import { buildCanonicalSingle } from "../../api/read.js";
import {
  buildCanonicalPaired,
  parsePairedMeasurement,
  projectPairedDeltaItems,
  projectSignalCounts,
} from "../../api/read-paired.js";

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
// The last version that let the model's own prose reach the wire as a quotation.
// Frozen here as a literal, not imported: it is a version this build no longer
// produces, and the legacy fixture's whole purpose is to be a record from before.
const LEGACY_PAIRED_METHOD_VERSION = "1.1";
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
// client-side from the paste-back form, so both share one payload and differ only in
// the capture answers the drive steps give. Encoding that here keeps the harness
// honest about where the condition actually comes from.
//
// At paired_method_version 2.0 the canned part is the MODEL'S RAW OUTPUT, and nothing
// downstream of it is written by hand. Under 1.1 this fixture canned the delta items
// themselves — including their open_side and targeted_side prose — which is precisely
// the shape that let a fabricated quotation exist: the fixture could show a side no
// server ever resolved, and the baseline would have blessed it. Now the raw output
// goes through the endpoint's own parser, the construction door resolves each snippet
// against these two answers, and the wire fields are projected from the result. A
// snippet edited to something the answer does not contain therefore empties that side
// of the fixture, and assertScenarioIntegrity below fails on it.
//
// The snippets are lookup keys, so they must occur VERBATIM in the answer their role
// names. SYNTHETIC_ANSWER for original_answer, SYNTHETIC_SECOND_ANSWER for
// targeted_answer.
const PAIRED_MODEL_OUTPUT = {
  differences: [
    {
      signal_pattern: "Omission",
      interpretation:
        "The second answer names the deadline as state-set and gives a range, where the first gave a single national-sounding number.",
      snippets: [
        {
          artifact_role: "targeted_answer",
          verbatim_snippet: "It runs from 14 days in some states to 60 days in others",
        },
        {
          artifact_role: "original_answer",
          verbatim_snippet: "within 30 days of the tenant moving out",
        },
      ],
    },
    {
      // The first answer says nothing about a penalty, so there is no truthful
      // contextual quotation to show on the open side. ABSENT is the honest answer
      // and the reason the open-side blockquote is withheld in the render.
      signal_pattern: "Omission",
      interpretation: "The second answer names a penalty for a missed deadline; the first did not mention one.",
      snippets: [
        {
          artifact_role: "targeted_answer",
          verbatim_snippet: "require the landlord to pay the tenant a penalty",
        },
        { artifact_role: "original_answer", status: "ABSENT" },
      ],
    },
  ],
  gap_estimate: 2,
  estimate_rationale: "Counted only decision-relevant deltas, not the second answer's added length. Unvalidated.",
};

// The measured failure mode: a difference whose probe-side snippet is not in the
// second answer. Three of seven probe runs at 1.1 emitted one of these and it printed
// in quotation marks.
//
// This output keeps difference 1 and REPLACES difference 2 with the fabricated one,
// rather than appending it. Appending produced a capture byte-identical to
// paired-matched — correct behaviour, and a useless screenshot: two files showing the
// same picture prove nothing to whoever opens them, and the harness rejects the pair
// outright as a checksum collision. Held against paired-matched, this way the
// rejection IS the difference between the two images: one row instead of two, and
// Omission: 1 instead of 2.
const PAIRED_MODEL_OUTPUT_WITH_REJECTION = {
  ...PAIRED_MODEL_OUTPUT,
  differences: [
    PAIRED_MODEL_OUTPUT.differences[0],
    {
      signal_pattern: "Omission",
      interpretation: "The second answer warns that a tenant who waits loses the penalty entirely.",
      snippets: [
        {
          artifact_role: "targeted_answer",
          // Plausible, on topic, and nowhere in SYNTHETIC_SECOND_ANSWER.
          verbatim_snippet: "a tenant who waits too long forfeits the penalty entirely",
        },
        { artifact_role: "original_answer", status: "ABSENT" },
      ],
    },
  ],
};

function pairedReadPayload(modelOutput = PAIRED_MODEL_OUTPUT) {
  const openPayload = singleReadPayload();
  const targetedPrompt = openPayload.act2.targeted_prompt;

  // The endpoint's own parser, then the endpoint's own adapter. The canonical result
  // is built FIRST and the wire fields are derived from it, in that order, exactly as
  // the handler does — so this fixture cannot carry a delta item the door rejected.
  const pm = parsePairedMeasurement(modelOutput);
  const canonical = buildCanonicalPaired(pm, SYNTHETIC_ANSWER, SYNTHETIC_SECOND_ANSWER);
  const delta_items = projectPairedDeltaItems(canonical, "probe_surfaced_differences");

  const pairedAnalysis = {
    open_run_id: FROZEN_REQUEST_ID,
    targeted_prompt: targetedPrompt,
    targeted_prompt_hash: sha256Hex(targetedPrompt),
    targeted_answer: SYNTHETIC_SECOND_ANSWER,
    targeted_answer_hash: sha256Hex(SYNTHETIC_SECOND_ANSWER),
    delta_items,
    gap_estimate: pm.gap_estimate,
    estimate_rationale: pm.estimate_rationale,
    estimate_type: ESTIMATE_TYPE_PAIRED,
    rubric_version: RUBRIC_VERSION,
    paired_method_version: PAIRED_METHOD_VERSION,
    canonical,
  };

  const receipt = buildPairedReceipt({
    generatedAt: FROZEN_TIMESTAMP,
    openRun: openPayload.receipt.open_run,
    pairedAnalysis,
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));

  // Exactly buildPairedPayload (api/read-paired.js:590).
  return {
    source: "agent",
    delta_items,
    signal_counts: projectSignalCounts(canonical),
    result: canonical,
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

const pairedRejectedPayload = () => pairedReadPayload(PAIRED_MODEL_OUTPUT_WITH_REJECTION);

// A record written under the OLD method, replayed by today's build. This is what
// reconstructPairedFromRecord returns for a stored row with no snippet candidates:
// no canonical result, the four stored wire keys, and the version the row was
// written under. It is built by hand ON PURPOSE — no product module can produce it
// any more, and that is the point. The sides below are the 1.1 defect verbatim:
// prose presented as quotation that does not occur in the answer it names.
function pairedLegacyPayload() {
  const openPayload = singleReadPayload();
  const targetedPrompt = openPayload.act2.targeted_prompt;

  const delta_items = [
    {
      point: "The second answer treats the deadline as state-set where the first gave one national figure.",
      open_side: "A landlord has 30 days from move-out to return the deposit in full.",
      targeted_side: "Deposit deadlines are set state by state and range from two weeks to two months.",
      signal_pattern: "Omission",
    },
    {
      point: "The second answer names a penalty the first left out.",
      open_side: "",
      targeted_side: "Many states impose a penalty of two to three times the deposit on a late landlord.",
      signal_pattern: "Omission",
    },
  ];

  const pairedAnalysis = {
    open_run_id: FROZEN_REQUEST_ID,
    targeted_prompt: targetedPrompt,
    targeted_prompt_hash: sha256Hex(targetedPrompt),
    targeted_answer: SYNTHETIC_SECOND_ANSWER,
    targeted_answer_hash: sha256Hex(SYNTHETIC_SECOND_ANSWER),
    delta_items,
    gap_estimate: 2,
    estimate_rationale: "Counted only decision-relevant deltas. Unvalidated.",
    estimate_type: ESTIMATE_TYPE_PAIRED,
    rubric_version: RUBRIC_VERSION,
    paired_method_version: LEGACY_PAIRED_METHOD_VERSION,
    canonical: null,
  };

  const receipt = buildPairedReceipt({
    generatedAt: FROZEN_TIMESTAMP,
    openRun: openPayload.receipt.open_run,
    pairedAnalysis,
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));

  return {
    source: "agent",
    delta_items,
    signal_counts: projectSignalCounts(null),
    result: null,
    gap_estimate: pairedAnalysis.gap_estimate,
    gap_estimate_label: pairedGapEstimateLabel(pairedAnalysis.gap_estimate),
    estimate_rationale: pairedAnalysis.estimate_rationale,
    estimate_type: ESTIMATE_TYPE_PAIRED,
    rubric_version: RUBRIC_VERSION,
    paired_method_version: LEGACY_PAIRED_METHOD_VERSION,
    targeted_prompt: targetedPrompt,
    unvalidated: true,
    idempotent: true,
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

// The Act 2 paste-back flow, appended to the single-mode read that produces the
// receipt it needs. Written now because Pass 2B-A2 changed what the paired surface
// renders from, and a change to a surface nobody can photograph is a change nobody
// can check.
//
// Two details that are not obvious:
//   - The compare stage opens through the "Paste what came back" ghost button, NOT
//     "Ask your AI →". That one copies to the clipboard first and only opens the box
//     on success; headless Chrome has no clipboard permission, so it lands in the
//     catch and the box never opens.
//   - Conditions are disclosed by clicking the option BUTTONS by their label text.
//     The two groups share a class, but no label string is a substring of another,
//     so clickText hits exactly one.
const drivePaired = ({ edits }) => [
  ...DRIVE_SINGLE,
  { waitFor: ".wb-act2__actions" },
  { clickText: ".wb-act2__actions button", text: "Paste what came back" },
  { waitFor: ".wb-act2__test textarea" },
  { fill: ".wb-act2__test textarea", text: SYNTHETIC_SECOND_ANSWER },
  { clickText: ".wb-act2__capture-opt", text: PAIR_CAPTURE_UI.same_model.options[PAIR_SAME_MODEL.YES] },
  { clickText: ".wb-act2__capture-opt", text: PAIR_CAPTURE_UI.edits.options[edits] },
  { waitFor: ".wb-act2__test-cta button:not([disabled])" },
  { click: ".wb-act2__test-cta button" },
  { waitFor: ".wb-act2__delta" },
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

  // The paired scenarios were fixture-only until Pass 2B-A2: their payloads were
  // checked but no drive steps existed, so the harness refused to capture them
  // rather than drive the single-mode flow and file the image under a paired name.
  // This pass changed what the paired surface renders from, so it owes the steps.
  "paired-matched": {
    name: "paired-matched",
    drivable: true,
    state: "Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED",
    expected:
      "The delta lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. Counts read 'Omission: 2 · Framing Drift: 0 · Deflection: 0' — the same collection as the rows. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "The delta",
      "Omission: 2 · Framing Drift: 0 · Deflection: 0",
      "The Reader's reading",
      "It runs from 14 days in some states to 60 days in others",
    ],
    assertSelector: ".wb-act2__delta .wb-measure__list li.wb-measure__finding",
    focus: ".wb-act2__delta .wb-measure__list",
  },

  // Row 2's open side is ABSENT: the first answer says nothing about a penalty, so
  // there is no truthful contextual quotation and the blockquote is withheld rather
  // than filled. Same payload as paired-matched — the state is a row, not a run.
  "paired-unmatched": {
    name: "paired-unmatched",
    drivable: true,
    state: "Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED",
    expected:
      "The delta lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    steps: drivePaired({ edits: PAIR_EDITS.EDITED }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "The delta",
      "Omission: 2 · Framing Drift: 0 · Deflection: 0",
      "require the landlord to pay the tenant a penalty",
    ],
    assertSelector: ".wb-act2__delta .wb-measure__list li.wb-measure__finding",
    focus: ".wb-act2__delta .wb-measure__list",
  },

  // The measured failure mode, made visible by its absence. The model proposed two
  // differences; the second named second-answer text that is not in the second
  // answer. It is recorded in the canonical result and it is not here. Read this
  // against paired-matched, which proposed two and resolved both: same flow, same
  // answers, one row fewer and one count lower.
  "paired-rejected-snippet": {
    name: "paired-rejected-snippet",
    drivable: true,
    state: "Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced",
    expected:
      "The delta lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The counts read 'Omission: 1 · Framing Drift: 0 · Deflection: 0' against paired-matched's 'Omission: 2'.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedRejectedPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["The delta", "Omission: 1 · Framing Drift: 0 · Deflection: 0"],
    assertSelector: ".wb-act2__delta .wb-measure__list li.wb-measure__finding",
    focus: ".wb-act2__delta .wb-measure__list",
  },

  // A record written under 1.1, replayed by this build. The legacy path renders its
  // readings and withholds its excerpts, because this build cannot say they are real.
  //
  // This state is captured TWICE, and the reason is worth stating because it looks
  // like duplication. assertText reads whole-page innerText, so it passes whether or
  // not a string sits inside the captured rectangle; only the FOCUS target is
  // guaranteed to be in frame. The legacy delta block is taller than a 1440x900
  // viewport, so no single frame holds both the version notice at its top and the
  // rows near its bottom — and each carries half the quarantine claim. Framed on the
  // rows alone, the image is indistinguishable from a current run that found nothing
  // quotable; framed on the notice alone, nothing shows that the readings render
  // without excerpts. Two frames, one per claim, is the honest way to photograph it.
  "paired-legacy": {
    name: "paired-legacy",
    drivable: true,
    state: "Paired record at method 1.1 — the version notice and the suppressed panels",
    expected:
      "A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedLegacyPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "an earlier method (1.1)",
      "Its excerpts are withheld.",
      "The second answer names a penalty the first left out.",
    ],
    assertSelector: ".wb-act2__notice--legacy",
    focus: ".wb-act2__notice--legacy",
  },

  // The same record, framed on the rows: the other half of the claim.
  "paired-legacy-rows": {
    name: "paired-legacy-rows",
    drivable: true,
    state: "Paired record at method 1.1 — the readings, rendered without excerpts",
    expected:
      "Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedLegacyPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "an earlier method (1.1)",
      "The second answer treats the deadline as state-set where the first gave one national figure.",
      "The second answer names a penalty the first left out.",
    ],
    assertSelector: ".wb-act2__delta .wb-measure__list li.wb-measure__finding",
    focus: ".wb-act2__delta .wb-measure__list",
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

  // Only the two scenarios whose NAME makes a conditions claim are held to it. The
  // others carry a capture because the flow needs one, and assert nothing about it.
  // "-unmatched" is tested first: it does not end in "-matched", but reading that off
  // the string twice is cheaper than trusting anyone to notice.
  if (scenario.capture) {
    const derived = deriveConditionsMatched(scenario.capture);
    const wants = scenario.name.endsWith("-unmatched") ? false : scenario.name.endsWith("-matched") ? true : null;
    if (wants === true && derived !== true) {
      problems.push(`scenario claims matched conditions but deriveConditionsMatched returned ${JSON.stringify(derived)}`);
    }
    if (wants === false && derived === true) {
      problems.push("scenario claims unmatched conditions but deriveConditionsMatched returned true");
    }
  }

  // Paired, at 2.0. The failure this guards is the one the pass exists to close: a
  // fixture showing an excerpt no server resolved. Under 1.1 that was possible by
  // construction, because the fixture wrote the sides itself.
  const paired = payloads["/api/read-paired"];
  if (paired) {
    const legacy = paired.result === null;
    if (legacy) {
      // The legacy fixture must stay legacy. If a later pass makes it resolvable, it
      // stops testing the path it was built for and nothing says so.
      if (paired.paired_method_version === PAIRED_METHOD_VERSION) {
        problems.push(
          `legacy paired fixture reports the CURRENT method version ${PAIRED_METHOD_VERSION} — it no longer exercises the legacy render path`
        );
      }
      const total = Object.values(paired.signal_counts || {}).reduce((a, b) => a + b, 0);
      if (total !== 0) {
        problems.push(`legacy paired fixture carries a visible tally (${total}); a 1.x record must drive no counts`);
      }
    } else {
      if (paired.paired_method_version !== PAIRED_METHOD_VERSION) {
        problems.push(
          `paired fixture reports method ${paired.paired_method_version || "(none)"} but carries a canonical result built at ${PAIRED_METHOD_VERSION}`
        );
      }
      // Every side on the wire must reproduce verbatim in the answer it names. The
      // door already guarantees this; asserting it here catches a fixture that
      // bypassed the door, which is exactly how the last one went wrong.
      const artifacts = {
        open_side: SYNTHETIC_ANSWER,
        targeted_side: SYNTHETIC_SECOND_ANSWER,
      };
      for (const [i, d] of (paired.delta_items || []).entries()) {
        for (const [key, text] of Object.entries(artifacts)) {
          const side = d[key] || "";
          if (side && !text.includes(side)) {
            problems.push(`paired delta item ${i} ${key} is not verbatim in the answer it names: ${JSON.stringify(side)}`);
          }
        }
      }
      // The visible tally and the visible rows are one collection.
      const surfaced = paired.result.counts.probe_surfaced_differences.value;
      if ((paired.delta_items || []).length !== surfaced) {
        problems.push(
          `paired fixture wire carries ${(paired.delta_items || []).length} delta item(s) for ${surfaced} surfaced finding(s)`
        );
      }
      const tally = Object.values(paired.signal_counts || {}).reduce((a, b) => a + b, 0);
      if (tally !== surfaced) {
        problems.push(`paired signal counts total ${tally} for ${surfaced} surfaced finding(s)`);
      }
      // The rejection scenario must actually reject something, or it captures the
      // ordinary state under a name that promises otherwise.
      const recorded = paired.result.counts.recorded_findings.value;
      const wantsRejection = scenario.name.includes("rejected");
      if (wantsRejection && recorded <= surfaced) {
        problems.push(
          `scenario promises a rejected snippet but the door surfaced all ${recorded} recorded finding(s) — nothing was rejected`
        );
      }
      if (!wantsRejection && recorded !== surfaced) {
        problems.push(
          `paired fixture records ${recorded} finding(s) but surfaces ${surfaced}; this scenario does not declare a rejection`
        );
      }
    }
  }

  return problems;
}

export const SYNTHETIC = { SYNTHETIC_QUESTION, SYNTHETIC_ANSWER, SYNTHETIC_SECOND_ANSWER };
