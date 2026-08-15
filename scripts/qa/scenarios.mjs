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
  RECEIPT_BOUNDARY,
} from "../../reader-receipt.js";
import {
  targetedPromptOffer,
  PAIRED_METHOD_VERSION,
  ACT2_CAPACITY_COPY,
  deriveConditionsMatched,
  isCapacityFallbackReason,
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
import { renderableExamples } from "../../product-example-registry.js";
import { measuredCaseIds } from "../../reader-guided-record.js";
import { buildCanonicalSingle } from "../../api/read.js";
import { recordToPublic } from "../../api/inspection-share.js";
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

// ── A Check Register with more cards than it shows ───────────────────────────
// The register shows DEFAULT_TOP_N cards and puts the rest behind a control. Nothing
// on the board reached that control: every fixture here resolves at most one check, so
// the eyebrow, the count in the button label and the two states of the disclosure had
// never been rendered by a driven run. This answer carries five findings whose check
// blocks all resolve, so the register overflows and the control appears.
//
// The five are chained deliberately: each check rests its proposition on one sentence
// and its dependent output on the next, which is the shape assembleComparativeCheck
// requires (both ends quoted, both resolvable) and also the shape a real chained answer
// has. Card identity is derived from the two span offsets, so five distinct sentence
// pairs give five distinct cards and none of them dedup away.
const OVERFLOW_QUESTION = "I'm on a salary and my boss says that means no overtime. Is that how it works?";

const OVERFLOW_SENTENCES = [
  "An employer has to pay overtime at one and a half times the regular rate for every hour over 40 in a workweek.",
  "Salaried employees are generally exempt from that rule, so most people paid a salary do not accrue overtime at all.",
  "The exemption turns on a duties test, which looks at the work a person actually performs rather than the title printed on an offer letter.",
  "There is also a salary threshold, and an employee earning below it stays eligible for overtime whatever the duties test says.",
  "If you think you were misclassified, you can file a wage claim with the labor department and ask for the unpaid hours.",
  "Claims like this are usually settled well before a hearing, so there is rarely any need to prepare for one.",
];
const OVERFLOW_ANSWER = OVERFLOW_SENTENCES.join(" ");

function overflowMeasurement() {
  const [S1, S2, S3, S4, S5, S6] = OVERFLOW_SENTENCES;
  const findings = [
    {
      type: "candidate missing item",
      anchor: S1,
      materiality:
        "The threshold and the rate are given with no statute and no jurisdiction. Both figures are set in law and both vary by where the employer is.",
      check: {
        supporting_proposition: S1,
        dependent_output: S2,
        dependency_statement:
          "The salaried exemption is stated as an exception to the 40-hour rule above it, so it inherits whatever jurisdiction that rule came from.",
        verification_question:
          "Which statute sets the 40-hour threshold and the one-and-a-half rate, and does it reach this employer?",
        resolver: "authority",
      },
    },
    {
      type: "candidate framing issue",
      anchor: S2,
      materiality:
        "A conditional exemption is stated as a general one. The sentence records the outcome for most salaried people and not the conditions that decide it.",
      check: {
        supporting_proposition: S2,
        dependent_output: S3,
        dependency_statement:
          "The duties test is introduced as the thing the exemption turns on, so it rests on the exemption sentence it follows.",
        verification_question: "Which duties test does this describe, and where is it published?",
        resolver: "document",
      },
    },
    {
      type: "candidate framing issue",
      anchor: S3,
      materiality:
        "The test is named and its terms are not. A reader is told what the test looks at without being told what it looks for.",
      check: {
        supporting_proposition: S3,
        dependent_output: S4,
        dependency_statement:
          "The salary threshold is set beside the duties test as a second condition, so it is read against the test stated before it.",
        verification_question: "Where is the threshold published, and how often is it revised?",
        resolver: "document",
      },
    },
    {
      type: "candidate missing item",
      anchor: S4,
      materiality:
        "The threshold decides who the rest of the answer applies to and the answer never states its figure. The person asking cannot place themselves on either side of it.",
      check: {
        supporting_proposition: S4,
        dependent_output: S5,
        dependency_statement:
          "The wage claim is offered as the route for someone the threshold covers, so the route rests on the threshold sentence above it.",
        verification_question: "What figure is the salary threshold here, and which authority sets it?",
        resolver: "authority",
      },
    },
    {
      type: "candidate deflection",
      anchor: S6,
      materiality:
        "The closing line lowers the stakes of the step it just recommended, at the point the answer would otherwise have to say what filing involves.",
      check: {
        supporting_proposition: S5,
        dependent_output: S6,
        dependency_statement:
          "The closing reassurance is attached to the filing route, so what it says about preparing rests on a claim being filed at all.",
        verification_question:
          "What share of wage claims reach a hearing in this jurisdiction, and who publishes that figure?",
        resolver: "authority",
      },
    },
  ];

  const finding_counts = {};
  for (const t of CANDIDATE_FINDING_TYPES) finding_counts[t] = 0;
  for (const f of findings) finding_counts[f.type]++;

  return {
    findings,
    finding_counts,
    gap_estimate: 5,
    estimate_rationale:
      "Five candidate observations, four of them resting on a figure or a test the answer names without stating. Unvalidated.",
    estimate_type: ESTIMATE_TYPE_SINGLE,
    estimate_scale_version: ESTIMATE_SCALE_VERSION,
    candidate_method_version: CANDIDATE_METHOD_VERSION,
    unvalidated: true,
  };
}

const OVERFLOW_READ = {
  completeness: "partial",
  the_read:
    "The answer describes a rule, an exemption from it, and two conditions the exemption turns on, without naming the law any of them come from. Each step rests on the one before it, so a reader who cannot place the first figure cannot place any of the rest. It closes by reassuring about the step it had just recommended.",
  what_was_left_out: [
    "Which jurisdiction the 40-hour rule and the one-and-a-half rate come from.",
    "What the duties test actually asks.",
    "What figure the salary threshold sits at, and who sets it.",
  ],
  how_it_was_shaped:
    "It states a conditional exemption as a general one, then closes by lowering the stakes of the action it recommended.",
  inspection_note: SINGLE_READ.inspection_note,
};

// The fixture proves its own premise, because assembleComparativeCheck answers a failed
// gate by returning null. Nothing logs, the payload still builds, the register still
// renders — it renders four cards instead of five, or three, and at three the disclosure
// control stops existing. Two scenarios named for the overflow would then photograph a
// register that does not overflow, and the frames would look correct.
//
// Editing a sentence is not how that happens here: the check blocks and the answer both
// destructure OVERFLOW_SENTENCES, so a quote cannot drift away from the sentence it
// quotes. The gates that can fire sit in the assembler, and they move when the product
// moves — reader-check-vocab.js learning a word that one of these verification questions
// already contains (the demonstrated case), a candidate type leaving
// FINDING_TYPE_TO_DETECTOR, resolveSpans changing how it normalizes a quote before
// locating it, DEFAULT_TOP_N rising to meet the card count. So the guard runs at build
// time and refuses to hand back a payload that contradicts the name it is built under.
export function assertRegisterOverflows(payload, label) {
  const cards = payload && payload.checks && Array.isArray(payload.checks.cards) ? payload.checks.cards.length : 0;
  const topN = payload && payload.checks ? payload.checks.default_top_n : 0;
  if (cards <= topN) {
    throw new Error(
      `${label} assembled ${cards} card(s) against default_top_n ${topN}. The disclosure control only ` +
        `renders above the top-N line, so this payload shows a register that does not overflow. ` +
        `assembleComparativeCheck returns null on a failed gate and says nothing, so look there first: ` +
        `a verification_question or dependency_statement that now trips hasWorldClaimVerdict, a candidate ` +
        `type missing from FINDING_TYPE_TO_DETECTOR, or a quote resolveSpans no longer locates.`
    );
  }
  return payload;
}

function overflowReadPayload() {
  return assertRegisterOverflows(
    singleReadPayload({
      measurement: overflowMeasurement(),
      read: OVERFLOW_READ,
      question: OVERFLOW_QUESTION,
      answer: OVERFLOW_ANSWER,
    }),
    "register-overflow"
  );
}

// ── The dense acceptance record ──────────────────────────────────────────────
// Nine marks on one answer: six positioned in it, three recorded against it as a
// whole. Every other fixture here carries one to three. This one exists because a
// composition that reads well at two marks can still fail at nine, and the failure
// modes only appear at density — marks crowding each other, one span opening inside
// another's paragraph, the record-level items losing their footing at the end of a
// long list.
//
// PROVENANCE. The content is ported verbatim from the visual-direction review lane
// at /Users/brendan/Documents/Claude/scratch/imbas-visual-directions/shared/fixture.data.js,
// sha256 a80f88963b195bea4dc504444ec4bd5949ecf21123e0acef260e0bd16c380533, record
// id "deposit". Six paragraphs, nine marks, unchanged. It is authorized as a QA
// acceptance fixture and nothing else: not production evidence, not a public
// example, not an archive record, and it never enters Imbas custody or reaches a
// consumer surface. Like every fixture in this file the answer is written by hand.
//
// WHAT THE PORT SETTLED. The review lane drew two of its nine marks as a bracketed
// REGION rather than a line, under a presentation vocabulary that called them
// "in-document-region" against the other four's "in-document-span". That reads like
// a second positioning mechanism and is not one. The lane's own record gives both
// of them anchor_status QUOTED against original_answer, and both regions turn out
// to be single contiguous paragraphs. So a region is a quotation that runs longer,
// and it resolves through the ordinary path: the model proposes the passage, the
// server locates it, buildSourceReading cuts at its boundaries like any other. No
// new enum member, no new producer, no branch.
const DEPOSIT_QUESTION = "My landlord kept my whole security deposit. What can I do?";

const DEPOSIT_ANSWER = [
  "If your landlord kept your entire security deposit, you have options. Start by reviewing your lease and any move-out paperwork you kept, then write to the landlord and ask for an itemized statement of every deduction.",
  "Most states give a landlord a set number of days after move-out to return the deposit or send that itemization. The window usually falls somewhere between 14 and 45 days. Once it has passed without an itemization, your position is much stronger.",
  "Normal wear and tear is not a deductible item in most places. Faded paint, carpet worn along a walking path, and small nail holes sit on the wear side of that line. A broken door, a burn in the countertop, or a hole in the drywall sit on the damage side.",
  "I'm not able to tell you what your particular state requires, because deposit rules vary a great deal and I don't know where you live. Your best move is to look up your state's landlord-tenant statute or talk to a local attorney.",
  "If the landlord still will not pay after a written demand, small claims court is the usual next step. The filing fee is modest and you generally do not need a lawyer to appear. Whether that is worth your time is a judgment only you can make.",
  "Keep every message in writing. A dated letter or email creates a record you can bring with you, and in some states it also starts the clock the statute runs on.",
].join("\n\n");

// The nine, in the record's order, which is the order the lane numbered them in and
// NOT the order they occur in the answer — mark 4 opens before mark 3 does. That is
// the numbering buildSourceReading publishes, so the body and the list agree on
// which mark is which even where the body runs out of order.
//
// The last three carry no anchor. They are the items the answer never reaches, and
// an empty anchor is how a finding says so: the production path resolves it to
// ABSENT and the panel states it as record-level absence with no position. Giving
// them a quotation to point at is the one thing that would falsify this fixture.
function depositMeasurement() {
  const findings = [
    {
      type: "candidate framing issue",
      anchor: "The window usually falls somewhere between 14 and 45 days.",
      materiality: "A numeric range is given with no jurisdiction and no source. The next sentence turns the range into a consequence, so a reader who takes it as their own deadline is reading a general figure as a specific one.",
    },
    {
      type: "candidate framing issue",
      anchor: "Once it has passed without an itemization, your position is much stronger.",
      materiality: "A conditional legal consequence is stated as a general result. What a lapsed window provides depends on which statute applies, and the sentence records the result without the condition it runs on.",
    },
    {
      type: "candidate deflection",
      anchor: "I'm not able to tell you what your particular state requires, because deposit rules vary a great deal and I don't know where you live.",
      materiality: "The jurisdiction question is turned back after jurisdiction-bound points were already answered. The window in paragraph two and the wear-and-tear line in paragraph three are both state-bound, and both were answered.",
    },
    {
      // The first of the two the review lane bracketed. The whole paragraph is the
      // quotation because the reading is the sorting, not any one example in it.
      type: "candidate framing issue",
      anchor: "Normal wear and tear is not a deductible item in most places. Faded paint, carpet worn along a walking path, and small nail holes sit on the wear side of that line. A broken door, a burn in the countertop, or a hole in the drywall sit on the damage side.",
      materiality: "The paragraph sorts six examples onto two sides of a line and names nobody who draws it. It is legible as a standard without stating one.",
    },
    {
      type: "candidate deflection",
      anchor: "Whether that is worth your time is a judgment only you can make.",
      materiality: "The cost question is handed back at the point the answer reached a number. The preceding sentence calls the filing fee modest without giving it, so the judgment handed back is the one the missing figure would inform.",
    },
    {
      // The second bracketed one, and the second whole paragraph.
      type: "candidate missing item",
      anchor: "Keep every message in writing. A dated letter or email creates a record you can bring with you, and in some states it also starts the clock the statute runs on.",
      materiality: "The paragraph describes a clock a statute runs on and records no term for it. The clock is named here and nowhere else in the answer.",
    },
    {
      type: "candidate missing item",
      anchor: "",
      materiality: "The answer treats the sum as a security deposit throughout. Many leases collect last month's rent alongside a deposit, and several states hold the two under different rules with different return windows. The answer records no distinction between them.",
    },
    {
      type: "candidate missing item",
      anchor: "",
      materiality: "The answer records that a lapsed window strengthens the reader's position and stops there. A number of state statutes attach a specific consequence to a late or missing itemization, up to a multiple of the sum withheld. The answer names no such term.",
    },
    {
      type: "candidate missing item",
      anchor: "",
      materiality: "The answer begins at the point the deposit was already withheld. Several states give a departing tenant a right to request an inspection before move-out and to be told what would be deducted, which is the step that produces the documentation the first paragraph asks for. The answer records no such right.",
    },
  ];

  const finding_counts = {};
  for (const t of CANDIDATE_FINDING_TYPES) finding_counts[t] = 0;
  for (const f of findings) finding_counts[f.type]++;

  return {
    findings,
    finding_counts,
    gap_estimate: 4,
    estimate_rationale:
      "Nine candidate observations on one answer, three of them terms the answer never reaches. Unvalidated.",
    estimate_type: ESTIMATE_TYPE_SINGLE,
    estimate_scale_version: ESTIMATE_SCALE_VERSION,
    candidate_method_version: CANDIDATE_METHOD_VERSION,
    unvalidated: true,
  };
}

const DEPOSIT_READ = {
  completeness: "partial",
  the_read:
    "The answer gives a range of days, a wear-and-tear line, and a small claims step, and it declines the jurisdiction question in the middle of them. The points it answers are as state-bound as the one it declines. It never separates the deposit from last month's rent, never names what a late itemization costs a landlord, and never mentions the inspection a tenant can ask for before moving out.",
  what_was_left_out: [
    "Whether any part of the sum was collected as last month's rent, which several states hold under a different rule.",
    "What the governing statute attaches to a late or missing itemization.",
    "That several states give a departing tenant a right to a pre-move-out inspection.",
  ],
  how_it_was_shaped:
    "It states a range as what usually holds and turns it into a consequence, and it hands back the cost question at the point it reached a number.",
  inspection_note: SINGLE_READ.inspection_note,
};

// The question and answer are parameters rather than constants because the dense
// acceptance record is read on its own text, and a payload that resolved its nine
// anchors against a different answer would resolve none of them. Every caller that
// does not pass them gets the synthetic pair, so nothing else in this file changes
// shape. Both travel together: the receipt's source_content_hash covers the pair,
// and the canonical result's spans are offsets into the answer alone.
function singleReadPayload({
  measurement = singleMeasurement(),
  read = SINGLE_READ,
  declaredModel = "",
  question = SYNTHETIC_QUESTION,
  answer = SYNTHETIC_ANSWER,
} = {}) {
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
    artifacts: { original_answer: answer },
    artifactId: "original_answer",
    findings: measurement.findings
      .filter((f) => f.check)
      .map((f) => ({ type: CANDIDATE_TO_DETECTOR_FINDING[f.type], check: f.check })),
    inspector: { model: MODEL, model_version: MODEL, prompt_version: READER_PROMPT_VERSION },
  });

  // Canonical result — the endpoint's OWN adapter, not a copy of it. This is what the
  // interface renders from, so a fixture without it captures a state the endpoint
  // cannot emit. Built before the receipt because the receipt carries it (schema 1.1).
  const canonical = buildCanonicalSingle(measurement, answer, checks);

  // Receipt: built by the real builder, hashed by the real canonicalizer, so the
  // fixture carries a genuinely valid content_hash instead of an invented one.
  const receipt = buildSingleReceipt({
    generatedAt: FROZEN_TIMESTAMP,
    question: question,
    topic: "",
    declaredModel,
    answer: answer,
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
      source_content_hash: sha256Hex(`${question}\n${answer}`),
      reader_output_hash: sha256Hex(JSON.stringify(payload)),
      run_timestamp: FROZEN_TIMESTAMP,
      request_id: FROZEN_REQUEST_ID,
    },
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));
  payload.receipt = receipt;

  // Act 2 offer — real eligibility rule, real version tag.
  const { eligible, targeted_prompt } = targetedPromptOffer({ measurement });
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
  return pairedWirePayload({ pm, canonical: buildCanonicalPaired(pm, { open: SYNTHETIC_ANSWER, targeted: SYNTHETIC_SECOND_ANSWER }) });
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

// ── Failure injection ────────────────────────────────────────────────────────
//
// Every route above resolves to a body the endpoint could have returned on a good
// day. Three of the product's states are not good days: the request errors, the
// metered lane is withheld, or the request is simply still open. Until this pass the
// board could not photograph any of them, and the manifest said so.
//
// A route may now resolve to a RESPONSE instead of a body. Two shapes, both tagged
// with a key no product payload carries, so the stub can tell them apart from a
// fixture without guessing:
//
//   httpFailure({ status, body })  the fetch resolves with that status. The CLIENT
//                                  then decides what the screen says — runReader
//                                  throws `read_<status>`, the catch branch builds
//                                  the fallback result, and readerFallbackDisplay-
//                                  Message picks the line. No fixture writes the
//                                  degraded surface, which is the same rule the rest
//                                  of this file follows: the harness supplies the
//                                  condition, the product supplies the state.
//
//   neverResolves()                the fetch returns a promise that never settles, so
//                                  the app stays mid-request for as long as the
//                                  harness looks at it. This is the only honest way
//                                  to photograph an in-flight state: a slow-but-real
//                                  response would race the shutter.
//
// The tag rides into the snapshot's payload block, so a baseline records that the
// scenario injected a 503 rather than merely showing a screen that looks like one.
export const INJECT_HTTP = "__qa_inject_http__";
export const INJECT_HANG = "__qa_inject_hang__";

export function httpFailure({ status, body = null }) {
  if (!Number.isInteger(status) || status < 400 || status > 599) {
    throw new Error(`httpFailure needs a 4xx or 5xx status, got ${JSON.stringify(status)}`);
  }
  return { [INJECT_HTTP]: true, status, body };
}

export function neverResolves() {
  return { [INJECT_HANG]: true };
}

export const isInjectedResponse = (v) =>
  !!v && typeof v === "object" && (v[INJECT_HTTP] === true || v[INJECT_HANG] === true);

// ── The published share, as the server would publish it ──────────────────────
//
// A share page is not the Reader. It renders from a stored Airtable row projected
// by recordToPublic, and the projection is where the interesting decisions live: what
// a P4 share carries, what it deliberately does not, and what the dated receipt says
// about each. So the fixture here is the ROW, and the projection is the real one —
// imported and called, not transcribed. A hand-written projection would be able to
// show the page a field the server withholds, which is the one failure a share board
// exists to catch.
//
// The dates are fixed strings, not `new Date()`. The receipt renders the capture date
// into a sentence on screen, so a clock-derived fixture would rewrite every share
// baseline daily and bury a real regression in the noise.
const SHARE_ID = "Ab3xQ7zK9mNpR2sTuV4w";
const SHARE_CAPTURED_AT = "2026-07-09T14:20:00.000Z";
const SHARE_CREATED_AT = "2026-07-09T14:31:00.000Z";
const SHARE_MODEL = "ChatGPT";

// The excerpts a P4 share publishes are spans of the person's answer, and this is the
// answer the rest of the board pastes. Every anchor below is verbatim in it, and
// assertScenarioIntegrity holds them to that — the share page publishes the excerpt
// WITHOUT the answer it came from, so a reader has nothing on the page to check it
// against, and a drifted quote would be invisible in the pixels.
const SHARE_FINDINGS = [
  {
    type: "Omission",
    materiality: "The deadline is set by state law and varies.",
    anchor: "A landlord must return a security deposit within 30 days of the tenant moving out.",
  },
  {
    type: "Framing Drift",
    materiality: "The closing line lowers the stakes of a question the person asked.",
    anchor: "so there is usually nothing to worry about",
  },
];

const SHARE_DELTA_ITEMS = [
  {
    signal_pattern: "Omission",
    point: "The second answer named the penalty the first left out.",
    open_side: "A landlord must return a security deposit within 30 days of the tenant moving out.",
    targeted_side: "Several states also require the landlord to pay the tenant a penalty",
  },
];

export function shareRow(overrides = {}) {
  return {
    "Share ID": SHARE_ID,
    Mode: "single",
    Question: SYNTHETIC_QUESTION,
    "Findings JSON": JSON.stringify(SHARE_FINDINGS),
    "Captured At": SHARE_CAPTURED_AT,
    "AI Model": SHARE_MODEL,
    "Created At": SHARE_CREATED_AT,
    Visibility: "unlisted",
    "Reviewed Status": "Unreviewed",
    ...overrides,
  };
}

// What GET /api/inspection/<id> answers with. The endpoint's own projection, so this
// cannot show a field the endpoint withholds.
export const sharePayload = (overrides = {}) => ({
  ok: true,
  record: recordToPublic(shareRow(overrides), SHARE_ID),
});

// The route the page fetches. The stub matches by exact pathname, so the id in the
// route and the id in the URL have to be the same string.
export const SHARE_ROUTE = `/api/inspection/${SHARE_ID}`;
export const SHARE_PAGE = "/inspection.html";
export const SHARE_QUERY = `share=${SHARE_ID}`;

// The boundary line, asserted on every share scenario that renders a record. It comes
// from the one place the product builds it, so a board that says it is present cannot
// be asserting a string the product stopped emitting.
const SHARE_BOUNDARY_SENTENCE = RECEIPT_BOUNDARY;

// A paired share leaves `AI Model` empty: Reader Paired Analyses has no model field, so
// there is no declared system to copy at mint. This is the receipt's degraded anchor —
// the date is known and the system is not — and it is on the board because the failure
// it guards against is a dangling sentence, which only a picture shows.
const PAIRED_SHARE_ROW = {
  Mode: "paired",
  "Findings JSON": JSON.stringify(SHARE_DELTA_ITEMS),
  "AI Model": "",
};

// A pre-P4 row: no Mode, a stored full answer, and the retired Completeness rating the
// projection still carries and the page no longer renders. The published record keeps
// saying what it said; the page stops repeating the retired part.
const LEGACY_SHARE_ROW = {
  Mode: "",
  Question: SYNTHETIC_QUESTION,
  Answer: SYNTHETIC_ANSWER,
  Completeness: "thin",
  "The Read": "The answer gives the general rule and stops before the part that decides the outcome.",
  "What Was Left Out": "The statutory deadline\nThe penalty for missing it\nWhere to file",
  "How It Was Shaped": "It closes by describing the delay as ordinary.",
  "Findings JSON": "",
  "Captured At": "",
  "AI Model": "",
};

// ── Drive steps ──────────────────────────────────────────────────────────────
// A step is one of:
//   { fill: selector, text }        set a React-controlled input (native setter + input event)
//   { click: selector }             click the first match
//   { clickText: selector, text }   click the first match whose textContent contains text
//   { waitFor: selector }           wait until the selector matches and a reader could see it
//                                   (non-zero box AND checkVisibility — see `seen` in
//                                   visual-acceptance.mjs; a non-zero box alone is true of
//                                   content inside a closed <details>)
//   { waitForText: text }           wait until body text contains this string
const DRIVE_SINGLE_SUBMIT = [
  { fill: ".wb-reader-v2__field--answer textarea", text: SYNTHETIC_ANSWER },
  { waitFor: ".wb-reader-v2__reveal textarea" },
  { fill: ".wb-reader-v2__reveal textarea", text: SYNTHETIC_QUESTION },
  { waitFor: "button.wb-reader-cta:not([disabled])" },
  { click: "button.wb-reader-cta" },
];

const DRIVE_SINGLE = [...DRIVE_SINGLE_SUBMIT, { waitFor: ".wb-measure__list li.wb-measure__finding" }];

// The dense record is typed in the same two fields by the same two steps. What it
// waits on is a mark in the body, not a row in the list: the rows would render from
// the payload even if every span had failed to position, and this fixture exists to
// photograph the positions.
const DRIVE_DEPOSIT = [
  { fill: ".wb-reader-v2__field--answer textarea", text: DEPOSIT_ANSWER },
  { waitFor: ".wb-reader-v2__reveal textarea" },
  { fill: ".wb-reader-v2__reveal textarea", text: DEPOSIT_QUESTION },
  { waitFor: "button.wb-reader-cta:not([disabled])" },
  { click: "button.wb-reader-cta" },
  { waitFor: ".wb-measure__source mark.wb-source__mark" },
];

// The empty read cannot wait on a finding row, because the whole point is that no row
// exists. It waits on the panel's empty line instead. Waiting on the finding list
// would hang until the timeout and report a harness fault for a state the product
// renders correctly.
const DRIVE_SINGLE_EMPTY = [...DRIVE_SINGLE_SUBMIT, { waitFor: ".wb-measure__findings .wb-reader-result__empty" }];

// The export control renders inside the Check Register panel, which renders only when
// a check resolved. Waiting on the control itself is what proves the panel is there.
const DRIVE_SINGLE_EXPORT = [...DRIVE_SINGLE, { waitFor: ".wb-checks__export--single" }];

// The overflowing register. It waits on the disclosure control rather than on a card:
// cards render at any count, and the control is the thing that only exists above the
// top-N line. The expanded variant presses it and waits for the fifth card, so what
// proves the press is a card that was not in the document a moment earlier.
const DRIVE_REGISTER_OVERFLOW = [
  { fill: ".wb-reader-v2__field--answer textarea", text: OVERFLOW_ANSWER },
  { waitFor: ".wb-reader-v2__reveal textarea" },
  { fill: ".wb-reader-v2__reveal textarea", text: OVERFLOW_QUESTION },
  { waitFor: "button.wb-reader-cta:not([disabled])" },
  { click: "button.wb-reader-cta" },
  { waitFor: ".wb-checks__more" },
];

const DRIVE_REGISTER_OVERFLOW_EXPANDED = [
  ...DRIVE_REGISTER_OVERFLOW,
  { click: ".wb-checks__more" },
  { waitFor: ".wb-checks__list li:nth-child(5)" },
];

// The chip lane reached through its own front door. `?start=chips` is the shipped
// arrival contract — reader-stage.js parseArrival reads it, deriveStage returns the
// chip stage, and the lane mounts with no prior run because it is self-contained. The
// wait is on a chip rather than on the lane's container: the container renders whether
// or not the bank produced anything, and the chips are the arrival.
const DRIVE_CHIP_ARRIVAL = [{ waitFor: "#wb-chip-lane .wb-chip__row .wb-chip__pick" }];

// The chip lane reached the other way: from an inspection, by pressing the door on the
// result. The single-mode read runs first and its findings render, so there is a real
// inspection to leave — which is the whole difference from the arrival above, and the
// only condition under which the lane renders the way back and the origin reference at
// all. The door is waited for before it is pressed because it mounts on the result, not
// on the page.
//
// Three waits after the press, and each one is a different claim. The chip proves the
// bank rendered; the origin question proves the lane knows what it was opened over; the
// return control proves the way back is on screen. Waiting only on the chip would
// photograph a lane that had mounted before its tie to the inspection resolved.
const DRIVE_CHIPS_FROM_INSPECTION = [
  ...DRIVE_SINGLE,
  { waitFor: ".wb-chip-door" },
  { click: ".wb-chip-door" },
  { waitFor: "#wb-chip-lane .wb-chip__row .wb-chip__pick" },
  { waitFor: ".wb-chip__origin-question" },
  { waitFor: ".wb-chip__return-btn" },
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
// is read from the URL. Its first screen needs no click and no API — the first case in
// the rotation is selected on mount and step 0 is the readout — so the door opens on
// load.
const DRIVE_CURATED = [{ waitFor: ".wb-readout__run-strip" }];

// Which case that is comes from the registry, through the same filter the console
// itself applies, so this scenario photographs whatever that console currently leads
// with. A literal case id here would be the defect the registry exists to remove, one
// level up: the board would keep asserting the old lead after a placement moved, and
// pass.
//
// The filter is the console's, not the rotation's. PLACEMENTS.readerGuided leads with
// the flagship, which is a Reader run on a public example; the curated console seats
// measured cases only, because it prints a category, a term list and an observation date
// that a public example does not have. Reading the raw lead here would assert
// "CASE montana-employment · OMISSION" against a screen showing Case 005.
const LEAD_GUIDED_CASE = measuredCaseIds(renderableExamples("readerGuided"))[0];

// ── Failure and in-flight drive steps ────────────────────────────────────────
//
// The front door with nothing done to it. One wait, because the state IS the load:
// any step past this is a different scenario.
const DRIVE_FIRST_LOAD = [{ waitFor: ".wb-reader-v2__field--answer textarea" }];

// Mid-request. The submit steps are the ordinary ones; what makes this capturable is
// the last line of READER_INSPECTING_NARRATION.
//
// That line advances on a 1100ms interval and CLAMPS on the last entry, so it is a
// terminal state, not a moment. Waiting for those words is therefore a wait for
// something that cannot change again, which is the difference between a deterministic
// capture and one that happens to have been taken late enough. Waiting on the status
// selector instead would have photographed step 0, 1 or 2 depending on how fast the
// machine got there, and all three baselines would have looked correct.
const IN_FLIGHT_TERMINAL_LINE = "Still reading. Long answers take longer.";
const DRIVE_IN_FLIGHT = [...DRIVE_SINGLE_SUBMIT, { waitForText: IN_FLIGHT_TERMINAL_LINE }];

// A request that came back refused. The fallback banner is what proves the client took
// the failure branch rather than rendering an empty result.
const DRIVE_FAILED_READ = [...DRIVE_SINGLE_SUBMIT, { waitFor: ".wb-reader-result__fallback" }];

// The consent dialog. It is the last screen before anything is published, and it is
// the only place a person is told by name what the page will carry — so it is on the
// board for the same reason the share page is: the disclosure and the published page
// have to agree, and two images side by side is how a reviewer checks that.
const DRIVE_SHARE_CONSENT = [
  ...DRIVE_SINGLE,
  { click: ".wb-reader-share__btn" },
  { waitFor: ".wb-share-consent__panel" },
];

// ── Share page drive steps ───────────────────────────────────────────────────
//
// The share page is a classic script, not the React app: it reads the id off the URL,
// fetches once, and replaces a loading line with the record. There is nothing to click.
// Each wait names the element that proves the record rendered rather than the spinner.
const DRIVE_SHARE_RECORD = [{ waitFor: ".insp-record__mast" }];
const DRIVE_SHARE_RECEIPT = [{ waitFor: ".insp-receipt__closing" }];
const DRIVE_SHARE_ERROR = [{ waitFor: ".insp-error" }];

const PUBLIC_EXAMPLE_ASSERTIONS = [
  PUBLIC_EXAMPLE.question,
  PUBLIC_EXAMPLE.headline,
  PUBLIC_EXAMPLE.counts_line,
  "Reported capture conditions",
  "Displayed model and capture date",
  "Hash-supported artifact identity",
  "Matched-conditions determination",
  "It does not establish which model produced them",
  "These condition entries are the whole of what this example carries on conditions",
  "MCA § 39-2-911",
];

export const SCENARIOS = {
  "single-findings": {
    name: "single-findings",
    drivable: true,
    state: "Single mode, Reader result with measurement findings",
    expected:
      "The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row.",
    routes: { "/api/read": singleReadPayload },
    steps: DRIVE_SINGLE,
    // Proof the captured pixels show the state, not just that a file was written.
    // The per-class tally that used to be asserted here was removed in 2B-C, so what
    // is asserted is what replaced it: each row's own label, and the sentence only
    // that row carries. Anchors are deliberately NOT asserted — they are spans of the
    // pasted answer, which sits on the same page, so a passing anchor assertion would
    // prove the textarea rendered rather than the row.
    //
    // The composition pass retired the two headings this list used to be asserted
    // under. What replaced them is asserted instead: the count that names the rows,
    // and the disclosure summary that is the one line now standing between a reader
    // and their marks. Both are innerText assertions, so the summary passing proves
    // the disclosure is CLOSED at capture — an open one would put the provenance rows
    // in this frame and the assertion below would be reading a different composition.
    assertText: [
      "2 candidate items surfaced",
      "What a mark points at, and the conditions this answer was read under",
      "Omission",
      "The deadline is set by state law and varies.",
      "Framing Drift",
      "The closing line lowers the stakes of a question the person asked",
    ],
    assertSelector: ".wb-measure__list li.wb-measure__finding",
  },

  // The density case. Every other single-mode frame carries one to three marks, and a
  // composition can read well at that count and still fail at nine. This one puts six
  // marks in one body — two of them whole paragraphs, one of them opening before a
  // mark numbered lower — and three record-level items under a list long enough to
  // lose them.
  //
  // It is also the ported acceptance record, and porting it settled a question. The
  // review lane drew two of its nine as bracketed regions rather than lines, which
  // looked like a second positioning mechanism the production path did not have. It
  // is not one: a region is a longer quotation, and both of these resolve through the
  // ordinary path with no branch, no new enum member, and no fixture-only behavior.
  // The frame is the proof — the renderer consuming it is the same renderer that
  // consumes single-findings, reached by the same drive steps.
  "deposit-fixture": {
    name: "deposit-fixture",
    drivable: true,
    state: "Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it",
    expected:
      "The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'.",
    routes: {
      "/api/read": () =>
        singleReadPayload({
          measurement: depositMeasurement(),
          read: DEPOSIT_READ,
          question: DEPOSIT_QUESTION,
          answer: DEPOSIT_ANSWER,
        }),
    },
    steps: DRIVE_DEPOSIT,
    // The count, one mark from each end of the body, and the absence line the last
    // three rows share. The two bracketed passages are asserted by their opening
    // words: they are the marks that would be missing if a region needed a mechanism
    // this path does not have.
    assertText: [
      "9 candidate items surfaced",
      "The window usually falls somewhere between 14 and 45 days.",
      "Normal wear and tear is not a deductible item in most places.",
      "Keep every message in writing.",
      "Recorded against this answer as a whole. The inspection returned no excerpt for it, so the reading stands without one.",
    ],
    assertSelector: ".wb-measure__source mark.wb-source__mark",
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
      "The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "What the second answer added",
      "2 differences surfaced",
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
      "The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedReadPayload },
    steps: drivePaired({ edits: PAIR_EDITS.EDITED }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "What the second answer added",
      "2 differences surfaced",
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
      "The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedRejectedPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: { same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE },
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["What the second answer added", "1 difference surfaced"],
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
    state: "Single mode, a read with no candidate finding — the findings list's empty state",
    expected:
      "The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there.",
    routes: { "/api/read": () => singleReadPayload({ measurement: singleEmptyMeasurement(), read: SINGLE_EMPTY_READ }) },
    steps: DRIVE_SINGLE_EMPTY,
    // The count is asserted alongside the empty line because the two have to agree.
    // A count that said anything but zero over a list that renders the empty line
    // would be the panel contradicting its own hero, and that disagreement is exactly
    // what a single frame can catch and a unit test cannot.
    assertText: [
      "0 candidate items surfaced",
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
  // the empty line puts the absence on the probe and refuses the completeness reading
  // rather than declaring either answer complete, the claim row reads 'Not enough
  // recorded to say' because a result with no recorded finding has nothing to read the
  // capture conditions off, and the value close is ABSENT — there is no surfaced
  // material for it to be about.
  "paired-empty": {
    name: "paired-empty",
    drivable: true,
    empty: "paired",
    claimState: CLAIM_STATE.NO_CLAIM,
    state: "Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close",
    expected:
      "The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page.",
    routes: { "/api/read": singleReadPayload, "/api/read-paired": pairedEmptyPayload },
    steps: drivePaired({ edits: PAIR_EDITS.NONE }),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: [
      "What the second answer added",
      "0 differences surfaced",
      "That doesn't mean either answer is complete.",
      // The claim row sits above the delta, outside this scenario's frame, so the
      // pixels do not carry it and the text assertion has to. NO_CLAIM is reached the
      // only way it can be reached: no recorded finding carries a claim triple, so
      // there is no basis to read rather than a basis that came back negative.
      "Not enough recorded to say",
      "no recorded finding, so there is nothing here to read the capture conditions off",
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
      "The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today.",
    routes: claimBasisRoutes("authorized-match"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Conditions matched", "places these two answers at like for like"],
    assertSelector: ".wb-claim[data-claim-state='MATCHED_CONDITIONS']",
    focus: ".wb-claim",
  },

  "claim-authorized-mismatch": {
    name: "claim-authorized-mismatch",
    drivable: true,
    claimState: CLAIM_STATE.OBSERVED_DIFFERENCE_UNMATCHED,
    state: "Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match",
    expected:
      "The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that.",
    routes: claimBasisRoutes("authorized-mismatch"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Conditions differ", "does not place these two answers at like for like"],
    assertSelector: ".wb-claim[data-claim-state='OBSERVED_DIFFERENCE_UNMATCHED']",
    focus: ".wb-claim",
  },

  "claim-client-declaration": {
    name: "claim-client-declaration",
    drivable: true,
    claimState: CLAIM_STATE.OBSERVED_DIFFERENCE_REPORTED,
    state: "Paired result whose conditions basis is the person's own declaration, carried through to the record",
    expected:
      "The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded.",
    routes: claimBasisRoutes("client-declaration"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Conditions as you reported them", "not ones Imbas watched"],
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
      "The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set.",
    routes: claimBasisRoutes("unrecognized-source"),
    steps: drivePairedClaim([{ waitFor: ".wb-claim" }]),
    capture: MATCHED_CAPTURE,
    secondAnswer: SYNTHETIC_SECOND_ANSWER,
    assertText: ["Conditions source not recognized", "so Imbas treats it as nothing recorded."],
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
      "Conditions matched",
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
    // RETAINED BY RULING, not by inertia. `reader=0` reaches the curated-cases-lead
    // branch that §E superseded, so the product reason for keeping it is gone and the
    // question of deleting it has been asked. It stays because this scenario is the
    // standing reproducer of the instrumented nondeterministic frame: the §2.3/§2.4
    // evidence program runs through curated-readout--mobile, and every `npm test`
    // accumulates more of it passively. Deleting the branch deletes the only known
    // observation platform for an anomaly that is still open.
    // Revisit when either is true: the anomaly closes, or a second reproducer exists.
    query: "reader=0",
    state: "The curated case console, first screen — provenance and run strip with no score",
    expected:
      "The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself.",
    steps: DRIVE_CURATED,
    assertText: [
      `CASE ${LEAD_GUIDED_CASE} · OMISSION`,
      "4 frontier models tested",
      "observed May 2026",
    ],
    assertSelector: ".wb-flow-case-prov__case",
    focus: ".wb-readout",
  },

  // ── The states that are not a result ───────────────────────────────────────
  //
  // A board of finished results photographs the product on its best day. Three of
  // these four are the days it does not finish, and the fourth is the screen every
  // visitor sees before anything happens at all. They went unphotographed until this
  // pass because the harness could only stub a success; `httpFailure` and
  // `neverResolves` above are what changed.
  //
  // None of them is fixture-authored. The harness supplies a status or an open
  // request and the client decides what the screen says, so these images record the
  // product's real degraded copy rather than a fixture's idea of it.

  // Nothing has happened yet, and the page must not imply otherwise. This is the only
  // state on the board every visitor is guaranteed to see.
  "first-load": {
    name: "first-load",
    drivable: true,
    canned: true,
    routes: {},
    state: "The workbench on arrival — the paste box, before anything is pasted",
    expected:
      "The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind.",
    steps: DRIVE_FIRST_LOAD,
    assertText: [
      "Paste an AI answer below. The Reader inspects what it might be missing.",
      "Paste an answer to inspect it.",
      "See what might be missing",
    ],
    assertSelector: ".wb-reader-v2__field--answer textarea",
    focus: ".wb-reader-v2__fields",
  },

  // The request is open and has not come back. Photographed from a response that never
  // arrives, so the frame is the state rather than a moment inside it.
  "read-in-flight": {
    name: "read-in-flight",
    drivable: true,
    failure: "in_flight",
    state: "Mid-inspection — the request is open and the status line has reached its last words",
    expected:
      "The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned.",
    routes: { "/api/read": () => neverResolves() },
    steps: DRIVE_IN_FLIGHT,
    assertText: [IN_FLIGHT_TERMINAL_LINE, "Inspecting…"],
    assertSelector: ".wb-reader-v2__status.is-inspecting",
    focus: ".wb-reader-v2__action-row",
  },

  // A hard failure that is NOT the capacity family. 503 is chosen because the client
  // maps it to the generic line; the integrity check holds it to that, so this state
  // and the capacity state below cannot quietly converge on one sentence.
  "read-error": {
    name: "read-error",
    drivable: true,
    failure: "error",
    state: "The read route refused the request — the fallback surface, generic family",
    expected:
      "The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name.",
    routes: { "/api/read": () => httpFailure({ status: 503, body: { error: "unavailable" } }) },
    steps: DRIVE_FAILED_READ,
    assertText: [
      "Reader unavailable — showing fallback check.",
      "The full Reader is unavailable.",
      "this is not a full inspection",
      // The status line, which used to read "Inspection complete." here.
      "The Reader didn't run.",
    ],
    assertSelector: ".wb-reader-result__fallback",
    focus: ".wb-reader-result",
  },

  // The metered lane withheld. 429 is in CAPACITY_FALLBACK_REASONS, so the client
  // shows the one founder-approved capacity sentence instead of the generic line.
  "read-capacity": {
    name: "read-capacity",
    drivable: true,
    failure: "capacity",
    state: "The read route is at capacity — the fallback surface, capacity family",
    expected:
      "The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do.",
    routes: { "/api/read": () => httpFailure({ status: 429, body: { error: "capacity" } }) },
    steps: DRIVE_FAILED_READ,
    assertText: [ACT2_CAPACITY_COPY, "this is not a full inspection", "The Reader didn't run."],
    assertSelector: ".wb-reader-result__fallback",
    focus: ".wb-reader-result",
  },

  // ── The published record ───────────────────────────────────────────────────
  //
  // Everything above is a screen someone is looking at while they work. These are the
  // page that outlives the session: a permanent, dated, publicly linkable record of one
  // capture. It is the only Imbas surface a stranger can arrive at cold, with no idea
  // what the Reader is, and it is the surface whose promise is hardest to keep — the
  // record does not change — so it is the one that most needs a picture on file.
  //
  // These are the first board scenarios that are not the Reader. The page is named
  // per scenario and the readiness rule is the page's, not React's; see PAGE_READINESS
  // in visual-acceptance.mjs.

  // The ordinary published share, top of page: masthead, the dated anchor line, the
  // question, and the findings each with the excerpt it points to.
  "share-single": {
    name: "share-single",
    drivable: true,
    page: SHARE_PAGE,
    query: SHARE_QUERY,
    state: "A published single-mode share, at the top of the record",
    expected:
      "The record opens on its identity and its count: how many marks are on it, then what a mark is. Below that the disclosure holding the record's address and its scope boundary, then the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows.",
    routes: { [SHARE_ROUTE]: () => sharePayload() },
    steps: DRIVE_SHARE_RECORD,
    // The anchor line used to be asserted and framed here. The composition pass moved
    // it inside the record's INSPECT disclosure, so it is deliberately NOT asserted:
    // hasText reads innerText, a closed disclosure contributes none, and an assertion
    // that passed would mean the disclosure had come open. Its contents are covered by
    // execution rather than by the camera, per the standing rule that below-fold and
    // behind-disclosure surfaces need execution coverage — see
    // test/share-record-composition.test.mjs.
    //
    // What IS asserted is the cold reader's opening: the class label, the status line,
    // the count, and the line that teaches what a mark is. The orientation line is the
    // one string on this page that must equal the run surface's word for word, so it
    // being photographed here is also the board's half of that pin.
    assertText: [
      "Reader inspection",
      "Unlisted · Unreviewed",
      "2 candidate items surfaced",
      "Each mark points at something in this answer, or at something absent from it. Imbas records both.",
      "What this record is, and what it establishes",
      "Omission",
      "Framing Drift",
      SHARE_BOUNDARY_SENTENCE,
    ],
    assertSelector: ".insp-glance__count",
    focus: ".insp-glance__count",
  },

  // The same page, framed on the receipt. This is the part of the record that states
  // what was observed and what was not, so it is photographed on its own rather than
  // caught at the bottom of a frame aimed at something else. "What sources appeared"
  // stands here as NOT_CAPTURED with a sentence saying so — the thing this section
  // exists to prevent is a blank that reads as "we looked and there were none".
  "share-receipt": {
    name: "share-receipt",
    drivable: true,
    page: SHARE_PAGE,
    query: SHARE_QUERY,
    state: "The dated capture receipt on a published share — three sections and the closing block",
    expected:
      "Three sections in fixed order: what the system said, what sources appeared, what Imbas could not observe. The sources section is stated as uncaptured in words rather than left blank, because a blank cannot tell a reader whether Imbas looked. The closing block is last and is the same block on every receipt: what this record does not establish — no cause, no intent, no completeness.",
    routes: { [SHARE_ROUTE]: () => sharePayload() },
    steps: DRIVE_SHARE_RECEIPT,
    assertText: [
      "What the AI system said",
      "What sources appeared",
      "Imbas did not capture the sources behind this answer.",
      "What Imbas could not observe",
      "What this record does not establish",
    ],
    assertSelector: ".insp-receipt__closing",
    focus: ".insp-receipt",
  },

  // Nothing surfaced, and the record still has to say so in words. The findings panel
  // carries the run surface's own empty line, and the receipt's first section turns
  // NOT_CAPTURED — an inspection that flagged nothing preserved no excerpt, and the
  // section says that rather than rendering an empty list.
  "share-single-empty": {
    name: "share-single-empty",
    drivable: true,
    page: SHARE_PAGE,
    query: SHARE_QUERY,
    empty: "share",
    state: "A published share where nothing surfaced",
    expected:
      "The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty.",
    routes: { [SHARE_ROUTE]: () => sharePayload({ "Findings JSON": "[]" }) },
    steps: DRIVE_SHARE_RECORD,
    // The anchor line was asserted here too, and for the same reason it came out of
    // share-single it comes out here: the composition pass moved it inside the record's
    // INSPECT disclosure, hasText reads innerText, and a closed disclosure contributes
    // none. This scenario is where that omission was caught — share-single was updated
    // when the anchor moved and its empty sibling was not, and only a full board run
    // reads a scenario's own assertions, so the unit suite stayed green throughout. The
    // anchor's contents are covered by execution: test/share-record-composition.test.mjs
    // "4) the disclosure holds the record's address and its scope boundary, in full".
    //
    // What replaces it is this record's own headline fact. An empty share is the state
    // where a count is most load-bearing, because zero is a finding about the run and
    // not an error, and the count is the first thing the record says.
    assertText: [
      "0 candidate items surfaced",
      "No candidate finding surfaced under the tested conditions.",
      SHARE_BOUNDARY_SENTENCE,
    ],
    assertSelector: ".wb-measure__findings .wb-reader-result__empty",
    focus: ".wb-measure__findings",
  },

  // The degraded anchor. A paired share has no declared system to copy at mint, so the
  // date is known and the system is not. The sentence has to stay a sentence — this is
  // the image that would show a dangling fragment if the degraded form ever broke.
  "share-paired-no-model": {
    name: "share-paired-no-model",
    drivable: true,
    page: SHARE_PAGE,
    query: SHARE_QUERY,
    state: "A published two-question share whose answering system was never recorded",
    expected:
      "The anchor reads as a whole sentence with the system stated as unrecorded, not as a fragment with an empty slot where a model name would go. Imbas does not fill it in and does not infer it. Below, the delta rows quote both sides.",
    routes: { [SHARE_ROUTE]: () => sharePayload(PAIRED_SHARE_ROW) },
    steps: DRIVE_SHARE_RECORD,
    assertText: [
      "Captured 9 July 2026. The answering system was not recorded. Answers change; this record doesn't.",
      "Reader two-question test",
      "What the second answer added",
      SHARE_BOUNDARY_SENTENCE,
    ],
    assertSelector: ".insp-record__anchor",
    focus: ".insp-record__anchor",
  },

  // A record published before the format changed. The stored rating survives in the row
  // and the page stops repeating it, which is a different act from deleting it: the
  // record keeps saying what it said, and the notice above says why part of it is gone.
  "share-legacy": {
    name: "share-legacy",
    drivable: true,
    page: SHARE_PAGE,
    query: SHARE_QUERY,
    state: "A share published under the earlier format, with the retired rating withheld",
    expected:
      "An archival notice stands where the completeness badge used to, saying in words that the earlier format rated how complete an answer was, that the rating is retired and not shown, and that everything else is preserved as published. No rating word appears anywhere on the page. This is the one mode that still renders the stored full answer, because that is what those records were published with.",
    routes: { [SHARE_ROUTE]: () => sharePayload(LEGACY_SHARE_ROW) },
    steps: DRIVE_SHARE_RECORD,
    assertText: [
      "This inspection was published under an earlier Reader format that rated how complete an answer was.",
      "That rating is retired and is not shown.",
      "THE READER",
      "What was left out",
      SHARE_BOUNDARY_SENTENCE,
    ],
    assertSelector: ".wb-reader-result__archival-notice",
    focus: ".wb-reader-result__archival-notice",
  },

  // The link that does not resolve. A permanent link people paste into places Imbas
  // never sees will eventually be followed after the record is gone, and the page owes
  // that visitor a plain answer and a way onward rather than a blank or a stack trace.
  "share-not-found": {
    name: "share-not-found",
    drivable: true,
    page: SHARE_PAGE,
    query: SHARE_QUERY,
    failure: "error",
    state: "A share link that resolves to nothing — the degraded share surface",
    expected:
      "One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know.",
    routes: { [SHARE_ROUTE]: () => httpFailure({ status: 404, body: { ok: false, error: "not_found" } }) },
    steps: DRIVE_SHARE_ERROR,
    assertText: ["Inspection not found.", "This link may be incorrect, or the share was removed."],
    assertSelector: ".insp-error",
    focus: ".insp-error",
  },

  // The screen before anything is published, and the only place a person is told by
  // name what the page will carry. It is on the board so the disclosure and the
  // published page can be checked against each other as two images rather than two
  // readings of the same file.
  "share-consent": {
    name: "share-consent",
    drivable: true,
    state: "The pre-publish consent dialog, single mode",
    expected:
      "The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing.",
    routes: { "/api/read": singleReadPayload },
    steps: DRIVE_SHARE_CONSENT,
    assertText: [
      "Share this inspection",
      "This creates an unlisted public page containing the question and the evidence shown below.",
      "the date this answer was captured and the AI system you named",
      "It will not show your full answer — only the short excerpts above.",
      "Create share link",
    ],
    assertSelector: ".wb-share-consent__panel",
    focus: ".wb-share-consent__panel",
  },

  // ── Promoted from PENDING_SCENARIOS, and what that cost ────────────────────
  //
  // These three waited off the board for one reason: membership here obliges a committed
  // image and snapshot, and the surface-finish lane held every baseline until the founder
  // ruled. That ruling came, so they moved. The move is a move and not a copy — the
  // registry they came from is empty, and a test proves a promoted name cannot sit in both
  // places at once.

  // The Check Register above its own top-N line. Every other fixture on the board resolves
  // at most one check, so the eyebrow, the count inside the button label and the two states
  // of the disclosure had never been driven — including the aria-expanded/aria-controls
  // pair this lane put on that button.
  //
  // The payload is built through assertRegisterOverflows, which refuses at build time to
  // hand back a register that does not overflow. That guard is why this scenario cannot
  // quietly photograph a three-card register under a name that says five: the gates that
  // would cause it sit in the assembler, and they move when the product moves.
  "register-overflow": {
    name: "register-overflow",
    drivable: true,
    state: "Single mode, a Check Register carrying more cards than it shows — disclosure closed",
    expected:
      "Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes.",
    routes: { "/api/read": overflowReadPayload },
    steps: DRIVE_REGISTER_OVERFLOW,
    assertText: [
      "5 candidate items surfaced",
      "Questions worth asking",
      "Worth asking first",
      "Show the full register (5)",
    ],
    assertSelector: ".wb-checks__more",
    focus: ".wb-checks",
  },

  // The same register with the control pressed. Two frames rather than one because the
  // closed state is not the open state with rows added: the eyebrow that qualified the
  // three leaves, and the control changes what it says and what it reports.
  "register-overflow-expanded": {
    name: "register-overflow-expanded",
    drivable: true,
    state: "Single mode, the same Check Register with its disclosure open",
    expected:
      "All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back.",
    routes: { "/api/read": overflowReadPayload },
    steps: DRIVE_REGISTER_OVERFLOW_EXPANDED,
    assertText: ["5 candidate items surfaced", "Questions worth asking", "Show fewer"],
    assertSelector: ".wb-checks__list li:nth-child(5)",
    focus: ".wb-checks",
  },

  // Arrival through the chip lane's own door. The lane is reachable from the Reader by a
  // button, and separately by `?start=chips` — the shipped contract, not a new one. A
  // person arriving this way has run no inspection, so the frame is of the lane standing
  // on its own: no result above it, no marks, nothing of the instrument's own reading.
  // Canned in the strict sense — nothing on this screen comes from an API, and a run that
  // reached one would not be showing this state.
  "chip-arrival": {
    name: "chip-arrival",
    drivable: true,
    page: "/reader.html",
    query: "?start=chips",
    state: "The chip lane entered through ?start=chips, with no inspection under it",
    expected:
      "The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing.",
    routes: {},
    canned: true,
    steps: DRIVE_CHIP_ARRIVAL,
    assertText: [
      "Tell your AI exactly what to do next.",
      "What would you like the next answer to do differently?",
      "These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",
    ],
    assertSelector: "#wb-chip-lane .wb-chip__row .wb-chip__pick",
    focus: "#wb-chip-lane",
  },
};

// ── The waiting room, now empty ──────────────────────────────────────────────
//
// This held three scenarios that were complete in every way a scenario can be — real
// payloads through the real assemblers, drive steps, DOM assertions, a state and an
// expectation — and were kept off the board for one reason only: membership in SCENARIOS
// obliges a committed image and snapshot, assertBaselineInventory fails in both
// directions, and the first capture of a new scenario writes a new baseline. The
// surface-finish lane held every baseline until the founder ruled, so adding them to the
// board before that ruling would have meant accepting three baselines under a ruling that
// withheld them. The ruling came and register-overflow, register-overflow-expanded and
// chip-arrival are now board members with committed baselines of their own.
//
// The registry stays, empty, and so do the tests that iterate it. It is the place a
// finished-but-unphotographed scenario goes, and the next one needs somewhere to wait.
// Emptiness is the correct state when nothing is waiting, not a sign the mechanism is
// unused — the tests that guard it (no overlap with SCENARIOS, no committed baseline
// while pending, board-ready by the board's own shape check) are what make a promotion a
// move rather than a copy, and they cost nothing while the room is empty.
//
// This was never the fixture-only lane and must not be confused with it. `drivable: false`
// means a scenario has no drive steps and so cannot be photographed at all; anything
// waiting here has steps and can be photographed the moment it is allowed to be.
// Promotion is one move — cut an entry into SCENARIOS, run `--update <name>` — and the
// board tests then hold it exactly as they hold every other state.
export const PENDING_SCENARIOS = {
  // The chip lane opened FROM an inspection. This is the state the repair exists for and
  // the one the board could not see.
  //
  // `chip-arrival` photographs the lane standing on its own through `?start=chips`, with
  // no inspection under it. That frame proves the lane renders; it says nothing about the
  // transition, because the defect only exists when there IS an inspection to leave.
  // Opening the lane drops both source paste boxes out of the stage, so the answer a
  // person was reading goes off screen — and the way back and the origin reference are
  // the answer to that. Neither renders in `chip-arrival`: `openedFrom` is empty there,
  // so the origin block does not mount and the return control reads "Back to the Reader".
  // Photographing this state is the only way a frame holds either of them.
  //
  // No new fixture and no synthetic surface. It is the findings payload `single-findings`
  // already uses, driven through the same steps, and then one press of the shipped door.
  // The state is composed by the product out of parts the board already carries, which is
  // what makes it worth a frame: it is the composition that was never photographed.
  //
  // What the assertions hold, in the order the state is built:
  //   the lane is open          — its headline and the sentence over the chip row
  //   the way back exists       — in its from-an-inspection form, not the standing one
  //   the origin block exists   — label, the question itself, and the note
  //   the inspection survives   — the count and both marks are still in the document
  // `assertText` reads the whole document rather than the captured rectangle, so the last
  // group holds whether or not the result is still inside the photographed window. That
  // is deliberate: it is an assertion about the page, and the frame is a separate record.
  "chips-from-inspection": {
    name: "chips-from-inspection",
    drivable: true,
    state: "The chip lane opened from a findings-bearing inspection by pressing the door on the result",
    expected:
      "The lane heads itself, offers the way back to the inspection by name, and states what it was opened over — the question, never the answer body. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. The lane's own first answer box stands empty and no source paste box is restored beside it, and the inspection's own count and marks are still in the document above it.",
    routes: { "/api/read": singleReadPayload },
    steps: DRIVE_CHIPS_FROM_INSPECTION,
    assertText: [
      // The lane is open.
      "Tell your AI exactly what to do next.",
      "What would you like the next answer to do differently?",
      "These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",
      // The way back, in the form that only exists over an inspection.
      "Back to your inspection",
      // The origin reference: what it was opened over, and what happened to the text.
      "Opened from your inspection of",
      SYNTHETIC_QUESTION,
      "What you pasted is still here. Going back opens it as you left it.",
      // The inspection underneath is intact. Its count and both marks are still here.
      "2 candidate items surfaced",
      "Omission",
      "Framing Drift",
    ],
    assertSelector: ".wb-chip__origin-question",
    // The head block, not the lane. Centring a 2000px lane at 375x812 puts its head above
    // the captured rectangle; centring the head frames the three surfaces this scenario
    // exists to photograph — the heading, the way back, and the origin reference.
    focus: "#wb-chip-lane .wb-reader-result__head",
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

  // An injected response is not a fixture and has no findings, receipt or counts to
  // check. What it does have is a shape, and a wrong one fails silently: a status the
  // client maps to a different family photographs the wrong state under the right
  // name. So the fixture rules below are skipped for these routes and replaced by
  // rules of their own.
  for (const [route, v] of Object.entries(payloads)) {
    if (!isInjectedResponse(v)) continue;
    if (v[INJECT_HTTP]) {
      if (!Number.isInteger(v.status) || v.status < 400 || v.status > 599) {
        problems.push(`${route} injects status ${JSON.stringify(v.status)}, which is not a failure status`);
      }
      // The client derives the displayed line from the status, so a scenario that
      // names a family in its name is held to the family the client would pick.
      const code = String(v.status);
      const capacity = isCapacityFallbackReason(code);
      if (scenario.failure === "capacity" && !capacity) {
        problems.push(
          `scenario declares the capacity family but status ${code} is not in CAPACITY_FALLBACK_REASONS, ` +
            `so the client would show the generic unavailable line instead`
        );
      }
      if (scenario.failure === "error" && capacity) {
        problems.push(
          `scenario declares a generic failure but status ${code} is in CAPACITY_FALLBACK_REASONS, ` +
            `so the client would show the capacity sentence and the two states would photograph the same`
        );
      }
    }
    if (v[INJECT_HANG] && scenario.failure !== "in_flight") {
      problems.push(`${route} never resolves but the scenario does not declare failure: "in_flight"`);
    }
  }
  if (scenario.failure && !Object.values(payloads).some(isInjectedResponse)) {
    problems.push(`scenario declares failure ${JSON.stringify(scenario.failure)} but injects no failing route`);
  }

  const read = isInjectedResponse(payloads["/api/read"]) ? null : payloads["/api/read"];
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
  const paired = isInjectedResponse(payloads["/api/read-paired"]) ? null : payloads["/api/read-paired"];
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

  // The published share. Three failures are possible here that no other fixture can
  // have, and none of them would be visible in the pixels.
  //
  // The first is a published excerpt that is not verbatim in the answer it was taken
  // from. Everywhere else on the board the answer sits on the same page, so a drifted
  // quote is at least checkable by eye; a share deliberately withholds the answer, so
  // the only place that check can live is here.
  //
  // The second is the retired score coming back. It would ride in on the row, and the
  // whole point of the projection is that it does not reach the page — a fixture whose
  // projection carried it would photograph a compliant page while the endpoint was not.
  //
  // The third is an empty declaration that means nothing, so `empty: "share"` is held
  // in both directions like the others.
  const share = isInjectedResponse(payloads[SHARE_ROUTE]) ? null : payloads[SHARE_ROUTE];
  if (share) {
    const rec = share.record || {};
    for (const key of ["gap_estimate", "gap_estimate_label"]) {
      if (key in rec) problems.push(`share projection carries ${key}; the retired score reached the page`);
    }
    const anchors = [
      ...(rec.findings || []).map((f) => ["finding anchor", f.anchor]),
      ...(rec.delta_items || []).flatMap((d) => [
        ["delta open side", d.open_side],
        ["delta targeted side", d.targeted_side],
      ]),
    ];
    const artifacts = `${SYNTHETIC_ANSWER}\n${SYNTHETIC_SECOND_ANSWER}`;
    for (const [label, text] of anchors) {
      if (text && !artifacts.includes(text)) {
        problems.push(`share ${label} is not verbatim in the synthetic answers: ${JSON.stringify(text)}`);
      }
    }
    if (!rec.boundary) problems.push("share projection carries no boundary sentence");
    const published = (rec.findings || []).length + (rec.delta_items || []).length;
    if (scenario.empty === "share" && published !== 0) {
      problems.push(`scenario declares an empty share but the projection publishes ${published} item(s)`);
    }
    if (scenario.empty !== "share" && rec.mode !== "legacy" && published === 0) {
      problems.push("share projection publishes nothing but the scenario does not declare an empty share");
    }
  } else if (scenario.empty === "share") {
    problems.push("scenario declares an empty share but stubs no share route");
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
