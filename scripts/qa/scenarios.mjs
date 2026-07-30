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
import { PUBLIC_EXAMPLE, PUBLIC_EXAMPLE_UI } from "../../reader-public-example.js";
import {
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  AUTHORIZED_CONDITIONS_SOURCES,
  CLIENT_DECLARATION_SOURCES,
  COMPARISON_DIRECTION,
  CONDITIONS_STATUS,
  FINDING_CLASSES,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  buildCanonicalResult,
  buildFinding,
  newResolutionTally,
  normalizeClass,
} from "../../reader-result.js";
import { CLAIM_STATE, describeClaimState, describeProvenance } from "../../reader-provenance.js";
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

// ── Single mode, nothing surfaced ────────────────────────────────────────────
// The other real outcome of a single read: the model returned a read and no
// findings. That is a result, not a failure, and the surface has to say so without
// sliding into "the answer was complete" — which is a claim about the answer that no
// inspection of one answer can support.
function singleEmptyMeasurement() {
  const finding_counts = {};
  for (const t of CANDIDATE_FINDING_TYPES) finding_counts[t] = 0;
  return {
    findings: [],
    finding_counts,
    gap_estimate: 0,
    estimate_rationale: "Nothing in the answer met the bar for a candidate observation. Unvalidated.",
    estimate_type: ESTIMATE_TYPE_SINGLE,
    estimate_scale_version: ESTIMATE_SCALE_VERSION,
    candidate_method_version: CANDIDATE_METHOD_VERSION,
    unvalidated: true,
  };
}

// The read prose, hoisted so the empty payload can carry its own. A fixture that
// reused this prose over an empty finding list would photograph a read describing
// three omissions above a panel reporting none, and the picture would be of a
// contradiction the product does not produce.
const SINGLE_READ = {
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
};

const SINGLE_EMPTY_READ = {
  // "full", not "partial". The badge gloss for partial reads "Some material context
  // was missing or shaped", and printing that above three panels reporting nothing
  // missing and no shaping is a contradiction no run produces — the fixture would be
  // photographing itself rather than the product. What the full gloss then says about
  // the answer is a separate problem, logged rather than rewritten here: the badge
  // gloss renders on every read, so it is copy for the register lane, not an empty
  // state this pass owns.
  completeness: "full",
  the_read:
    "The answer names one deadline, says what happens when a landlord keeps part of the deposit, and stops there. Nothing in it rose to a candidate observation on this pass.",
  what_was_left_out: [],
  how_it_was_shaped: "",
  inspection_note: SINGLE_READ.inspection_note,
};

function singleReadPayload({ measurement = singleMeasurement(), read = SINGLE_READ, declaredModel = "" } = {}) {
  const payload = {
    completeness: read.completeness,
    the_read: read.the_read,
    what_was_left_out: read.what_was_left_out,
    how_it_was_shaped: read.how_it_was_shaped,
    inspection_note: read.inspection_note,
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
    declaredModel,
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
export const PAIRED_MODEL_OUTPUT = {
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

export function pairedReadPayload(modelOutput = PAIRED_MODEL_OUTPUT) {
  // The endpoint's own parser, then the endpoint's own adapter. The canonical result
  // is built FIRST and the wire fields are derived from it, in that order, exactly as
  // the handler does — so this fixture cannot carry a delta item the door rejected.
  const pm = parsePairedMeasurement(modelOutput);
  return pairedWirePayload({ pm, canonical: buildCanonicalPaired(pm, SYNTHETIC_ANSWER, SYNTHETIC_SECOND_ANSWER) });
}

// The wire half, shared. Every paired fixture assembles its payload here so the
// receipt, the delta items and the tally come from one place and from the endpoint's
// own projectors. What differs between fixtures is the canonical result handed in.
function pairedWirePayload({ pm, canonical, openPayload = singleReadPayload() }) {
  const targetedPrompt = openPayload.act2.targeted_prompt;
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

// A paired run in which the model proposed nothing. parsePairedMeasurement accepts an
// empty differences list — that is a clean result, not a parse failure — so this goes
// through the endpoint's own parser and adapter like every other paired fixture.
const pairedEmptyPayload = () =>
  pairedReadPayload({ differences: [], gap_estimate: 0, estimate_rationale: "No decision-relevant difference. Unvalidated." });

// ── Claim basis, constructed against the register ─────────────────────────────
//
// THE ONE PLACE A FIXTURE BYPASSES THE ENDPOINT ADAPTER, so the reason is in writing.
//
// buildCanonicalPaired stamps every finding conditions_status UNAVAILABLE and supplies
// no conditions_source, because the paste-back capture is client-side and the endpoint
// never receives it. Four of the six claim states reader-provenance.js can display are
// therefore unreachable through any endpoint in this build. A board that photographed
// only what the endpoints emit would ship four labels no one has ever seen rendered,
// and the first person to see them would be the first person whose run reached one.
//
// What stops this drifting away from the adapter: test/qa-board-coverage.test.mjs
// asserts this builder and buildCanonicalPaired produce the same result except for the
// claim triple. An adapter change this builder does not follow fails there, in CI,
// rather than silently blessing a fixture the endpoint could no longer produce.
//
// modelBuild is the one provenance field no live run records, so it is also the field
// that decides whether the strip renders complete or partial. Supplying it here is
// what makes the complete rendering photographable at all.
export function claimBasisCanonical({
  conditions_source = "",
  conditions_status = CONDITIONS_STATUS.UNAVAILABLE,
  modelBuild = "",
} = {}) {
  const pm = parsePairedMeasurement(PAIRED_MODEL_OUTPUT);
  const artifacts = { [ARTIFACT_ORIGINAL]: SYNTHETIC_ANSWER, [ARTIFACT_TARGETED]: SYNTHETIC_SECOND_ANSWER };
  const resolution_tally = newResolutionTally();
  const findings = pm.differences.map((d, index) => {
    const class_label = normalizeClass(d.signal_pattern);
    return buildFinding({
      index,
      shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
      class_label,
      statement: d.interpretation || FINDING_CLASSES[class_label],
      snippets: d.snippets || {},
      artifacts,
      resolution_tally,
      comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
      conditions_source,
      conditions_status,
    });
  });
  return buildCanonicalResult({
    surface: "paired",
    findings,
    resolution_tally,
    inspection_method_version: PAIRED_METHOD_VERSION,
    provider: "anthropic",
    model: MODEL,
    model_snapshot_or_build: modelBuild,
    legacy: { gap_estimate: pm.gap_estimate, estimate_type: pm.estimate_type, rubric_version: pm.rubric_version },
  });
}

// The four conditions inputs, named by what they represent rather than by the label
// they produce, so a copy change to a label cannot leave a fixture named after a
// state it no longer reaches. claimState on each scenario is what pins the mapping.
export const CLAIM_BASIS_INPUTS = {
  "authorized-match": {
    conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.MATCHED,
    // The only fixture that pins a build. An authorized conditions record and a pinned
    // inspection build are the same future: a run whose provenance was fully written
    // down. Photographing them together is the honest pairing.
    modelBuild: "claude-opus-4-8-20260615",
  },
  "authorized-mismatch": {
    conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.UNMATCHED,
  },
  "client-declaration": {
    conditions_source: CLIENT_DECLARATION_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.UNVERIFIED,
  },
  "unrecognized-source": {
    conditions_source: "some_future_conditions_oracle",
    conditions_status: CONDITIONS_STATUS.MATCHED,
  },
};

// A declared answer model rides along with every claim fixture. Own-mode drive steps
// never fill the model field, so a live own-mode strip reads "none given" on that row;
// guided mode does ask, and the server writes the answer onto the open run. This is
// what lets one board state show every provenance row recorded and another show two
// rows absent, both from states an endpoint can produce.
const DECLARED_ANSWER_MODEL = "GPT-5";

// BOTH routes of a claim scenario are built here, from one open payload, because the
// paired receipt embeds the open run and the /api/read receipt IS that open run. Built
// separately with different arguments, the two responses would disagree about what the
// person declared, and the paired receipt's hash would cover a run the first response
// never returned. assertScenarioIntegrity holds the two to each other.
function claimBasisRoutes(key) {
  const input = CLAIM_BASIS_INPUTS[key];
  if (!input) throw new Error(`unknown claim basis fixture: ${key}`);
  const openPayload = () => singleReadPayload({ declaredModel: DECLARED_ANSWER_MODEL });
  return {
    "/api/read": openPayload,
    "/api/read-paired": () =>
      pairedWirePayload({
        pm: parsePairedMeasurement(PAIRED_MODEL_OUTPUT),
        canonical: claimBasisCanonical(input),
        openPayload: openPayload(),
      }),
  };
}

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
const DRIVE_SINGLE_SUBMIT = [
  { fill: ".wb-reader-v2__field--answer textarea", text: SYNTHETIC_ANSWER },
  { waitFor: ".wb-reader-v2__reveal textarea" },
  { fill: ".wb-reader-v2__reveal textarea", text: SYNTHETIC_QUESTION },
  { waitFor: "button.wb-reader-cta:not([disabled])" },
  { click: "button.wb-reader-cta" },
];

const DRIVE_SINGLE = [...DRIVE_SINGLE_SUBMIT, { waitFor: ".wb-measure__list li.wb-measure__finding" }];

// The empty read cannot wait on a finding row, because the whole point is that no row
// exists. It waits on the panel's empty line instead. Waiting on the finding list
// would hang until the timeout and report a harness fault for a state the product
// renders correctly.
const DRIVE_SINGLE_EMPTY = [...DRIVE_SINGLE_SUBMIT, { waitFor: ".wb-measure__findings .wb-reader-result__empty" }];

// The export control renders inside the Check Register panel, which renders only when
// a check resolved. Waiting on the control itself is what proves the panel is there.
const DRIVE_SINGLE_EXPORT = [...DRIVE_SINGLE, { waitFor: ".wb-checks__export--single" }];

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
const drivePaired = ({ edits, then = [] }) => [
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
  ...then,
];

// Every claim-basis and provenance scenario drives the same flow and differs only in
// the payload. The capture answers are held constant on purpose: matched by
// declaration, every time. What varies is what the RECORD can stand on, and holding
// the declaration still is what makes that variation the only thing in the picture.
const drivePairedClaim = (then) => drivePaired({ edits: PAIR_EDITS.NONE, then });

const MATCHED_CAPTURE = { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE };

// Opening the door is one click on the entry action, by its own label. The two
// public-example frames share the steps and the assertions so a copy change cannot
// leave one frame checking the door and the other checking whatever replaced it.
const DRIVE_PUBLIC_EXAMPLE = [
  { waitFor: ".wb-demo-trigger" },
  { clickText: ".wb-demo-trigger", text: PUBLIC_EXAMPLE_UI.trigger_label },
  { waitFor: ".wb-demo__prov" },
];

// Read against docs/IMBAS-PUBLIC-EXAMPLE-PACKET.md Section 5. The four row labels are
// the distinctions of packet 4.2; the two sentences after them are the limits that
// stop a hash from becoming a model claim (4.3) and a missing field from becoming a
// determination (4.1).
// The curated console is the only board state that is not a Reader run, and the only
// one that needs a query string: it renders when the Reader flag is off, and the flag
// is read from the URL. Its first screen needs no click and no API — CURATED[0] is
// selected on mount and step 0 is the readout — so the door opens on load.
const DRIVE_CURATED = [{ waitFor: ".wb-readout__run-strip" }];

const PUBLIC_EXAMPLE_ASSERTIONS = [
  PUBLIC_EXAMPLE.question,
  PUBLIC_EXAMPLE.headline,
  PUBLIC_EXAMPLE.counts_line,
  "Reported capture conditions",
  "Displayed model and capture date",
  "Hash-supported artifact identity",
  "Matched-conditions determination",
  "It does not establish which model produced them",
  "There is no such determination to read.",
  "MCA § 39-2-911",
];

export const SCENARIOS = {
  "single-findings": {
    name: "single-findings",
    drivable: true,
    state: "Single mode, Reader result with measurement findings",
    expected:
      "MEASUREMENT panel renders with the Candidate findings list non-empty: counts read 'Omission: 1 · Framing Drift: 1 · Deflection: 0' and two finding rows are listed with their verbatim anchors.",
    routes: { "/api/read": singleReadPayload },
    steps: DRIVE_SINGLE,
    // Proof the captured pixels show the state, not just that a file was written.
    assertText: [
      "MEASUREMENT",
      "Candidate findings",
      "Omission: 1 · Framing Drift: 1 · Deflection: 0",
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

  // The zero-work door, in two frames. These are the only scenarios with an empty
  // route table: the example is canned, so nothing it renders comes from an API and
  // the harness has nothing to stub. `canned: true` buys that, and inverts the
  // called-a-route check — a canned scenario that reaches /api is not showing the
  // canned state.
  //
  // Both frames drive the same door and assert the same DOM. They differ only in what
  // the shutter is aimed at, because the door is taller than a viewport and the two
  // halves are separate claims: the loop, and the provenance under it.
  "public-example": {
    name: "public-example",
    drivable: true,
    state: "The public example door, opened from the paste box — the loop",
    expected:
      "The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name.",
    routes: {},
    canned: true,
    steps: DRIVE_PUBLIC_EXAMPLE,
    assertText: PUBLIC_EXAMPLE_ASSERTIONS,
    assertSelector: ".wb-demo__prov .wb-prov__row",
    focus: ".wb-demo",
  },

  // The half item 6 exists for. Four rows, four separate facts, none of them able to
  // be read as another.
  "public-example-provenance": {
    name: "public-example-provenance",
    drivable: true,
    state: "The public example door — the four provenance facts, kept apart",
    expected:
      "Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense.",
    routes: {},
    canned: true,
    steps: DRIVE_PUBLIC_EXAMPLE,
    assertText: PUBLIC_EXAMPLE_ASSERTIONS,
    assertSelector: ".wb-demo__prov .wb-prov__row",
    focus: ".wb-demo__prov",
  },

  // ── Empty states ───────────────────────────────────────────────────────────
  // The outcome nobody designs for and everybody eventually gets. Two frames,
  // because the two panels that go empty are a screen apart and each says a
  // different thing: the read panel reports what the Reader did not flag, the
  // MEASUREMENT panel reports what did not surface. Neither may say the answer was
  // complete, because no inspection of one answer can establish that.
  "single-empty": {
    name: "single-empty",
    drivable: true,
    empty: "single",
    state: "Single mode, a read with no candidate finding — the MEASUREMENT panel's empty state",
    expected:
      "The counts line reads all zeros and the finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer.",
    routes: { "/api/read": () => singleReadPayload({ measurement: singleEmptyMeasurement(), read: SINGLE_EMPTY_READ }) },
    steps: DRIVE_SINGLE_EMPTY,
    assertText: [
      "MEASUREMENT",
      "Omission: 0 · Framing Drift: 0 · Deflection: 0",
      "No candidate finding surfaced under the tested conditions.",
    ],
    assertSelector: ".wb-measure__findings .wb-reader-result__empty",
    focus: ".wb-measure__findings",
  },

  "single-empty-read": {
    name: "single-empty-read",
    drivable: true,
    empty: "single",
    state: "Single mode, a read with nothing left out and no shaping — the read panel's two empty states",
    expected:
      "'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean.",
    routes: { "/api/read": () => singleReadPayload({ measurement: singleEmptyMeasurement(), read: SINGLE_EMPTY_READ }) },
    steps: DRIVE_SINGLE_EMPTY,
    assertText: [
      "The Reader flagged nothing missing under the tested conditions.",
      "The Reader recorded no shaping under the tested conditions.",
    ],
    assertSelector: ".wb-reader-result__section--left-out .wb-reader-result__empty",
    focus: ".wb-reader-result__section--left-out",
  },

  // A paired run that surfaced nothing. Three things have to be true in one frame:
  // the empty line names the pair and the reported conditions rather than declaring
  // either answer complete, the claim row reads Basis unavailable because a result
  // with no recorded finding has no conditions basis to read, and the value close is
  // ABSENT — there is no surfaced material for it to be about.
  "paired-empty": {
    name: "paired-empty",
    drivable: true,
    empty: "paired",
    claimState: CLAIM_STATE.NO_CLAIM,
    state: "Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close",
    expected:
      "The count reads '0 differences surfaced'. The delta renders one line: the second answer surfaced nothing decision-relevant, stated as a result for this pair under reported conditions rather than a finding that either answer is complete. No value close appears anywhere on the page.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedEmptyPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "The delta",
      "0 differences surfaced",
      "not a finding that either answer is complete",
      // The claim row sits above the delta, outside this scenario's frame, so the
      // pixels do not carry it and the text assertion has to. NO_CLAIM is reached the
      // only way it can be reached: no recorded finding carries a claim triple, so
      // there is no basis to read rather than a basis that came back negative.
      "Basis unavailable",
      "no recorded finding, so there is no conditions basis to read",
    ],
    assertSelector: ".wb-act2__delta .wb-reader-result__empty",
    focus: ".wb-act2__delta",
  },

  // ── Claim-state legibility (item 7A) ───────────────────────────────────────
  // Four states no endpoint in this build can reach, photographed so the labels are
  // seen before a person's run is the first thing that renders them. Every one of
  // these declares MATCHED conditions in the capture form, so the client-derived
  // "unmatched conditions" callout never fires and the only thing changing between
  // the four images is what the RECORD says it stands on. That disagreement is the
  // reason the claim row exists.
  "claim-authorized-match": {
    name: "claim-authorized-match",
    drivable: true,
    claimState: CLAIM_STATE.MATCHED_CONDITIONS,
    state: "Paired result whose findings carry an authorized conditions record reading MATCHED",
    expected:
      "The claim row reads 'Matched conditions' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today.",
    routes: claimBasisRoutes("authorized-match"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Matched conditions", "places these two answers at like for like"],
    assertSelector: ".wb-claim[data-claim-state='MATCHED_CONDITIONS']",
    focus: ".wb-claim",
  },

  "claim-authorized-mismatch": {
    name: "claim-authorized-mismatch",
    drivable: true,
    claimState: CLAIM_STATE.OBSERVED_DIFFERENCE_UNMATCHED,
    state: "Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match",
    expected:
      "The claim row reads 'Observed difference · conditions not matched' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record's basis and the declaration disagree, and only the claim row carries that.",
    routes: claimBasisRoutes("authorized-mismatch"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Observed difference · conditions not matched", "does not place these two answers at like for like"],
    assertSelector: ".wb-claim[data-claim-state='OBSERVED_DIFFERENCE_UNMATCHED']",
    focus: ".wb-claim",
  },

  "claim-client-declaration": {
    name: "claim-client-declaration",
    drivable: true,
    claimState: CLAIM_STATE.OBSERVED_DIFFERENCE_REPORTED,
    state: "Paired result whose conditions basis is the person's own declaration, carried through to the record",
    expected:
      "The claim row reads 'Observed difference · conditions as reported' and says the conditions are the ones you reported and Imbas did not observe them. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded.",
    routes: claimBasisRoutes("client-declaration"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Observed difference · conditions as reported", "Imbas did not observe them."],
    assertSelector: ".wb-claim[data-claim-state='OBSERVED_DIFFERENCE_REPORTED']",
    focus: ".wb-claim",
  },

  // A record naming a conditions source this build does not know. The conservative
  // direction is the only safe one: an unrecognized source reads as no basis at all,
  // and the row says which of the two it is doing rather than quietly downgrading.
  "claim-unrecognized-source": {
    name: "claim-unrecognized-source",
    drivable: true,
    claimState: CLAIM_STATE.OBSERVED_DIFFERENCE_UNRECOGNIZED,
    state: "Paired result naming a conditions source this build does not recognize, with status MATCHED",
    expected:
      "The claim row reads 'Observed difference · conditions basis unrecognized' and says this build reads the named source as no basis at all. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set.",
    routes: claimBasisRoutes("unrecognized-source"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Observed difference · conditions basis unrecognized", "reads it as no basis at all"],
    assertSelector: ".wb-claim[data-claim-state='OBSERVED_DIFFERENCE_UNRECOGNIZED']",
    focus: ".wb-claim",
  },

  // ── Provenance strip (item 7), complete and partial ────────────────────────
  // Both frames aim inside .wb-loop__reveal. A paired screen carries two strips —
  // the single read's above and the paired one below — and a bare ".wb-prov" gets
  // whichever is first in the document, which is the wrong one and looks right.
  "provenance-complete": {
    name: "provenance-complete",
    drivable: true,
    claimState: CLAIM_STATE.MATCHED_CONDITIONS,
    state: "The provenance strip with every field recorded — seven rows, none unknown",
    expected:
      "Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed.",
    routes: claimBasisRoutes("authorized-match"),
    steps: drivePairedClaim([{ waitFor: ".wb-loop__reveal .wb-prov" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "What produced this",
      "Answer model (as declared)",
      "Paired method",
      "Imbas records it, and does not observe it.",
      // This scenario borrows the authorized-match fixture to get a pinned build, so it
      // renders MATCHED_CONDITIONS too. Asserting the label keeps the borrowing honest:
      // if the fixture's claim triple ever shifts, this fails here rather than silently
      // repainting the claim row in an image whose subject is the strip below it.
      "Matched conditions",
    ],
    assertSelector: ".wb-loop__reveal .wb-prov[data-complete='yes']",
    focus: ".wb-loop__reveal .wb-prov",
  },

  // What a live run actually renders. Two rows are unknown and both say so in words
  // chosen for the field: an undeclared answer model is "none given", an unpinned
  // build is "not pinned". Neither row is dropped, because a missing row reads as
  // "does not apply" when the truth is "was not recorded".
  "provenance-partial": {
    name: "provenance-partial",
    drivable: true,
    state: "The provenance strip on a live-shaped run — two fields unrecorded, both stated",
    expected:
      "Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    steps: drivePairedClaim([{ waitFor: ".wb-loop__reveal .wb-prov" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["What produced this", "none given", "not pinned"],
    assertSelector: ".wb-loop__reveal .wb-prov[data-complete='no']",
    focus: ".wb-loop__reveal .wb-prov",
  },

  // ── The export control (item 5) ────────────────────────────────────────────
  // Two frames because a paired screen renders two of these controls and they say
  // different things. The support line is generated from the fields the record will
  // actually carry, so the single frame must not advertise a paired capture and the
  // paired frame must not advertise checks.
  "export-single": {
    name: "export-single",
    drivable: true,
    state: "The Review Record export on a single-answer run — the control and its support line",
    expected:
      "The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim.",
    routes: { "/api/read": singleReadPayload },
    steps: DRIVE_SINGLE_EXPORT,
    assertText: [
      "Export Review Record",
      "A JSON file holding the answer as pasted",
      "Every finding in it is unreviewed.",
    ],
    assertSelector: ".wb-checks__export--single",
    focus: ".wb-checks__export--single",
  },

  "export-paired": {
    name: "export-paired",
    drivable: true,
    state: "The Review Record export on a paired run — the control and its support line",
    expected:
      "Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    steps: drivePairedClaim([{ waitFor: ".wb-checks__export--paired" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "Export Review Record",
      "A JSON file holding both answers as pasted",
      "the capture conditions you reported",
      "Every finding in it is unreviewed.",
    ],
    assertSelector: ".wb-checks__export--paired",
    focus: ".wb-checks__export--paired",
  },

  // ── The curated console ────────────────────────────────────────────────────
  // Not a Reader run, and on the board for one reason: this is where the archive's
  // human-scored figure used to be printed as a gauge next to a visitor's own pasted
  // answer, where an archive figure reads as a verdict on that answer. The figure is
  // untouched in the CURATED record. It is no longer presented, and this photographs
  // the surface without it.
  //
  // The only scenario with a query string. The curated console renders when the
  // Reader flag is off, and the flag is read from the URL.
  "curated-readout": {
    name: "curated-readout",
    drivable: true,
    canned: true,
    routes: {},
    query: "reader=0",
    state: "The curated case console, first screen — provenance and run strip with no score",
    expected:
      "The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. No gauge and no scored figure of any kind appears on the surface — the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself.",
    steps: DRIVE_CURATED,
    assertText: ["CASE 005 · OMISSION", "4 frontier models tested", "observed May 2026"],
    assertSelector: ".wb-flow-case-prov__case",
    focus: ".wb-readout",
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
    // A scenario either carries findings or declares that it does not. Both halves
    // are checked, so `empty` cannot be a way of switching a guard off: an empty
    // scenario whose fixture grew findings fails just as loudly as an ordinary one
    // whose fixture lost them.
    //
    // `empty` names WHICH surface goes empty, because a paired empty state needs a
    // full single read underneath it — the Act 2 offer is what opens the paste box,
    // and it only opens when the first read found something to probe.
    const singleFindings = read.measurement ? read.measurement.findings.length : -1;
    if (scenario.empty === "single") {
      if (singleFindings !== 0) {
        problems.push(`scenario declares an empty state but the single payload carries ${singleFindings} measurement finding(s)`);
      }
      // The read prose has to be empty too. Three named omissions above a panel
      // reporting none is a contradiction the product cannot produce, and a fixture
      // is the only place it could come from.
      if ((read.what_was_left_out || []).length) {
        problems.push("empty scenario's read still lists what was left out; the panels would contradict each other");
      }
    } else if (singleFindings <= 0) {
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
    // The two responses must describe ONE run. The paired receipt embeds the open run
    // wholesale, and the interface reads the provenance strip's declared answer model
    // off it — so a fixture whose two routes were built from different open payloads
    // renders a strip describing a run the first response never returned, and the
    // paired receipt's hash covers that run rather than the one on screen. This is how
    // the declared-model row was wrong the first time it was built.
    if (read && read.receipt && paired.receipt && paired.receipt.open_run) {
      if (JSON.stringify(read.receipt.open_run) !== JSON.stringify(paired.receipt.open_run)) {
        problems.push(
          "the open run inside the paired receipt differs from the /api/read receipt — the two routes were built from different open payloads"
        );
      }
    }

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
      // Both directions again, on the surface the paired scenarios actually name.
      if (scenario.empty === "paired" && (recorded !== 0 || surfaced !== 0)) {
        problems.push(
          `scenario declares an empty delta but the paired result records ${recorded} and surfaces ${surfaced}`
        );
      }
      if (scenario.empty !== "paired" && surfaced === 0) {
        problems.push("paired fixture surfaces nothing but the scenario does not declare an empty delta");
      }
    }

    // The second axis. The conditions check above reads the CAPTURE FORM — what the
    // person declared — and this reads the CANONICAL RECORD — what the result can
    // stand on. They are different facts and they are allowed to disagree; the whole
    // point of the claim row is that a reader can see when they do. So a scenario
    // that names a claim state is held to the register's own answer, not to its name
    // and not to the capture it drove.
    if (scenario.claimState) {
      const claim = describeClaimState(paired.result);
      const got = claim ? claim.state_id : "(null — not a paired result)";
      if (got !== scenario.claimState) {
        problems.push(
          `scenario declares claim state ${scenario.claimState} but describeClaimState returned ${got}`
        );
      }
      if (claim && !CLAIM_STATE[claim.state_id]) {
        problems.push(`claim state ${claim.state_id} is not in the CLAIM_STATE register`);
      }
    }
  } else if (scenario.claimState) {
    problems.push("scenario declares a claim state but stubs no paired route; nothing would produce one");
  }

  return problems;
}

// The provenance strip a scenario's paired payload will render, for the tests that
// assert the complete and partial cases. Derived from the same call the component
// makes, with the same three neighbouring values, so a test cannot assert a strip the
// interface would not draw.
export function scenarioPairedProvenance(scenario) {
  const payloads = resolvePayloads(scenario);
  const paired = payloads["/api/read-paired"];
  const open = payloads["/api/read"];
  if (!paired || !paired.result) return null;
  return describeProvenance({
    canonical: paired.result,
    declaredModel: open && open.receipt ? open.receipt.open_run.declared_model : "",
    capturedAt: paired.receipt ? paired.receipt.generated_at : "",
    pairedMethodVersion: paired.paired_method_version,
  });
}

export const SYNTHETIC = { SYNTHETIC_QUESTION, SYNTHETIC_ANSWER, SYNTHETIC_SECOND_ANSWER };
