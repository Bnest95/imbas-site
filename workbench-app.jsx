import {
  RECEIPT_BOUNDARY,
  RECEIPT_SCHEMA_VERSION,
  formatReceiptText,
  formatPairedReceiptText,
  formatChipPairedReceiptText,
  canonicalizeForHash,
} from "./reader-receipt.js";
import {
  buildSourceReading,
  countLabel,
  countOf,
  describeFinding,
  selectSubset,
  ANCHOR_CHANNEL,
  ANCHOR_STATUS,
  RECORD_LEVEL_ABSENCE_NOTE,
  MARK_ORIENTATION_NOTE,
  RESULT_CAPABILITY_UI,
  RESULT_CAPABILITY_ANCHORS,
  resultCapabilityLinks,
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
} from "./reader-result.js";
import {
  ACT2_OFFER_COPY,
  ACT2_CAPACITY_COPY,
  isCapacityFallbackReason,
  TARGETED_PROMPT_TEXT,
  buildCleanerBundle,
  suggestLoopStateFromCanonical,
  LOOP_STATE_STILL_MISSING,
  LOOP_STATE_NOT_CLEAR,
  LOOP_STATES,
  LOOP_STATE_COPY,
  loopRevealCopy,
  LOOP_PANEL_FIRST_LABEL,
  LOOP_PANEL_SECOND_LABEL,
  LOOP_DIDNT_COME_UP,
  LOOP_CONDITIONS_LINE,
  CHECK_QUICK,
  CHECK_CLEANER,
  CHECK_CHOICE_COPY,
  CHECK_QUICK_COPY,
  CHECK_CLEANER_COPY,
  buildPairCapture,
  DECLARATION_STAGE,
  pairConditionsUnmatched,
  PAIR_SAME_MODEL,
  PAIR_EDITS,
  PAIR_CAPTURE_UI,
  PAIRED_VALUE_CLOSE,
  PAIRED_EMPTY_CLOSE,
  PAIRED_METHOD_VERSION,
  PAIR_INITIATOR,
  CHIP_ENTRY_VIA,
  normalizeChipEntryVia,
  CHIP_UI,
  CHIP_LOOP_STATES,
  CHIP_LOOP_STATE_COPY,
  suggestChipState,
} from "./reader-paired.js";
import { SECOND_QUESTION_BANK } from "./reader-second-question-bank.js";
import {
  ANSWER_WORD_MAX,
  countAnswerWords,
  answerWordState,
  answerOverMaxNotice,
  secondAnswerOverMaxNotice,
  ANSWER_TOO_LONG_MESSAGE,
  SECOND_ANSWER_TOO_LONG_MESSAGE,
} from "./reader-input-envelope.js";
import { READER_EVENTS, buildEvent, buildFunnel } from "./reader-telemetry.js";
import { initialScrollState, nextResultScroll } from "./reader-scroll.js";
import { perceptionTap, isPerceptionValueForMode } from "./reader-perception-client.js";
import { CHECK_UI } from "./reader-checks.js";
import {
  buildReviewRecord,
  reviewRecordFilename,
  describeReviewRecordContents,
  REVIEW_RECORD_UI,
} from "./reader-review-record.js";
import { selectInspectionMeaning } from "./reader-explain-panel.js";
import { describeProvenance, describeClaimState, PROVENANCE_UI } from "./reader-provenance.js";
import { PUBLIC_EXAMPLE, PUBLIC_EXAMPLE_UI } from "./reader-public-example.js";
import {
  getExample,
  placementRoute,
  renderableExamples,
  resolvePlacement,
} from "./product-example-registry.js";
import {
  GUIDED_RECORD_KIND,
  buildGuidedRotation,
  measuredCaseIds,
} from "./reader-guided-record.js";
import { resultActions } from "./reader-result-actions.js";
import {
  LANE_INSPECT,
  LANE_CHIPS,
  STAGE_COMPOSE,
  STAGE_COMPARE,
  STAGE_CHIPS,
  STAGE_FOLLOWUP,
  CAUSE_ADVANCE,
  CAUSE_ASYNC,
  CAUSE_DEGRADED,
  CAUSE_INIT,
  CAUSE_POP,
  deriveStage,
  stageView,
  stageEntry,
  startsNewOccurrence,
  parseArrival,
  normalizeArrivalStage,
  stageHash,
} from "./reader-stage.js";
import {
  SPAN_SEGMENT_ATTR,
  MARK_NUMBER_ATTR,
  SPAN_UI,
  SPAN_ACTION,
  SPAN_AFFORDANCES,
  resolveSelectionSpan,
  resolveSpanAction,
} from "./reader-span-selection.js";

const { useState, useEffect, useRef } = React;

/*
  IMBAS — WORKBENCH v0
  ------------------------------------------------------------------
  First live product surface. Lets anyone test the Volunteer Gap on
  their own AI. Two modes:

    CURATED (default) — a case Imbas has already measured. The screen
      shows WHAT IMBAS OBSERVED (a past measurement, stated plainly),
      the user copies the open prompt, runs it in their own AI, pastes
      the answer back, and the result resolves from what they pasted.
      No result is shown before the paste. Nothing is predicted.

    SUGGEST — topic submission channel. Users propose what Imbas should
      investigate next. No scoring, no result generation — acknowledgment
      only after submit. Routes to the repository for human review.

  Honesty rules enforced in copy + logic:
    - Describe, never predict. Past observation is stated as past.
      "Your run may differ — that's the point."
    - No result text exists until the user has pasted something real.
    - Behavior, not intent. Never "hid / censored / biased."
    - Everything produced is PROVISIONAL and routes to the repository
      (captured pool), never the validated archive.
    - Evidence is quoted from the user's pasted text, never invented.

  v0 technical notes (for whoever integrates this):
    - No client-side scoring API. Curated runs entirely in the browser
      (term-presence check + local quote pull). Suggest an Investigation
      is a lightweight submission form — no score is generated in the browser.
    - submitCandidate(candidate): POSTs to IMBAS_ENDPOINT when set;
      until then capture falls back to copy-to-clipboard so nothing is
      lost. One constant flips real public ingestion on.
    - Email optional after result; follow-up capture persists to localStorage
      and re-submits the candidate record when provided.
    - Colors/fonts are local constants for standalone preview. At site
      integration, replace them with the homepage's CSS variables.
*/

// ---- THEME (local for preview; swap to site CSS vars at integration) ----
const C = {
  text: "var(--ink-primary)",
  textDim: "var(--ink-secondary)",
  textFaint: "var(--ink-muted)",
  accent: "var(--ember)",
  accentSoft: "var(--ember-soft)",
  line: "var(--line-soft)",
  lineControl: "rgba(var(--ember-rgb), 0.28)",
};
// Brand-locked fonts (Notion source of truth): Fraunces / Inter / JetBrains Mono.
// At site integration these come from the homepage's loaded fonts; the @import
// below is only so the standalone preview renders on-brand.
const SERIF = "'Fraunces', Georgia, serif";
const SANS = "'Inter', ui-sans-serif, system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');";
const INPUT_CLS = "wb-input wb-focus";
const WORKBENCH_A11Y_CSS = `
.wb-focus:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${C.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`;
const WORKBENCH_RESULT_GAP_CSS = `
.wb-result-score-panel {
  padding: 0.85rem 0.7rem 0.58rem;
  background: rgba(12, 9, 7, 0.94);
  border: 1px solid rgba(242, 232, 220, 0.18);
  border-radius: 4px;
  box-shadow:
    inset 0 1px 0 rgba(242, 232, 220, 0.06),
    0 1px 0 rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wb-result-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}
.wb-result-header__primary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.42rem 0.72rem;
  width: 100%;
}
.wb-result-header__primary .wb-result-gap-hero__score {
  width: auto;
  flex: 0 1 auto;
  text-align: center;
}
.wb-result-gap-readout {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 10.75rem);
  margin: 0.06rem auto 0;
  opacity: 0.9;
}
.wb-result-gap-gauge {
  position: relative;
  width: 100%;
  line-height: 0;
}
.wb-result-gap-gauge__face {
  display: block;
  width: 100%;
  height: auto;
  position: relative;
  z-index: 1;
}
.wb-result-gap-gauge__bloom {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 62%;
  height: 52%;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at center, rgba(222, 111, 56, 0.18) 0%, rgba(222, 111, 56, 0.05) 45%, transparent 72%);
  opacity: 0;
  transition: opacity 0.55s ease 0.04s;
  pointer-events: none;
  z-index: 0;
}
.wb-result-gap-gauge.is-settled .wb-result-gap-gauge__bloom,
.wb-result-inner.is-reveal-instant .wb-result-gap-gauge__bloom {
  opacity: 1;
}
.wb-result-gap-gauge.is-settled .wb-result-gap-gauge__face {
  filter: drop-shadow(0 0 12px rgba(222, 111, 56, 0.18));
  transition: filter 0.55s ease;
}
.wb-result-gap-gauge__scan {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 6%;
  height: 72%;
  border-radius: 999px 999px 0 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    rgba(20, 14, 12, 0) 0px,
    rgba(20, 14, 12, 0) 2px,
    rgba(242, 232, 220, 0.04) 2px,
    rgba(242, 232, 220, 0.04) 3px
  );
  mix-blend-mode: soft-light;
  z-index: 2;
}
.wb-result-gap-gauge__needle-line {
  transition: none;
}
.wb-result-gap-gauge__tick-label {
  font-size: 8.5px;
  fill: rgba(140, 124, 107, 0.58);
}
.wb-result-gap-gauge.is-settled .wb-result-gap-gauge__track-fill {
  opacity: 0.76;
}
.wb-result-gap-hero__score {
  font-family: ${SERIF};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${C.text};
  margin: 0;
  padding: 0;
  text-align: center;
  width: 100%;
  text-shadow: 0 2px 18px rgba(222, 111, 56, 0.22);
}
/* Where the live verdict badge sat. It is one archive sentence now, so it is set as
   a sentence: reading measure, sentence case, no tone colours. Tone colours were part
   of the problem — a green pill and an amber pill grade a visitor's answer before a
   single word is read. */
.wb-result-archive {
  margin: 0;
  max-width: 34rem;
  color: rgba(228, 214, 196, 0.9);
  font-size: 0.9375rem;
  line-height: 1.5;
  text-align: center;
  text-wrap: balance;
}
.wb-result-archive__tier {
  display: block;
  margin-top: 0.3rem;
  color: rgba(148, 136, 122, 0.72);
  font-family: ${MONO};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.wb-result-score-panel .wb-readout__run-strip--compact {
  margin-top: 0.38rem;
  margin-bottom: 0;
  padding: 0.22rem 0.42rem;
  gap: 0.18rem 0.55rem;
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.05em;
  line-height: 1.32;
  background: transparent;
  border: none;
  box-shadow: none;
  width: 100%;
  box-sizing: border-box;
  justify-content: center;
}
.wb-result-score-panel .wb-readout__run-strip--compact span {
  color: rgba(148, 136, 122, 0.62);
}
.wb-result-inner.is-reveal-instant .wb-result-gap-gauge__face { filter: drop-shadow(0 0 10px rgba(222, 111, 56, 0.16)); transition: none; }
@media (max-width: 480px) {
  .wb-result-gap-readout {
    width: min(100%, 11rem);
    margin: 0.1rem auto 0;
  }
  .wb-result-gap-gauge {
    max-width: 10.5rem;
    margin: 0 auto;
  }
  .wb-result-gap-gauge__face {
    max-height: 3.35rem;
    width: auto;
    margin: 0 auto;
  }
  .wb-result-gap-gauge__scan {
    top: 3%;
    height: 70%;
  }
  .wb-result-gap-gauge__bloom {
    top: 40%;
    width: 58%;
    height: 48%;
  }
  .wb-result-score-panel {
    padding: 0.55rem 0.45rem 0.42rem;
  }
  .wb-result-gap-hero__score {
    font-size: clamp(1.9rem, 10vw, 2.35rem);
    line-height: 0.92;
    text-shadow: 0 1px 12px rgba(222, 111, 56, 0.16);
  }
  .wb-result-archive {
    font-size: 0.875rem;
    line-height: 1.45;
  }
  .wb-result-header__primary {
    gap: 0.34rem 0.52rem;
  }
  .wb-result-score-panel .wb-readout__run-strip--compact {
    margin-top: 0.32rem;
    padding: 0.18rem 0.32rem;
    font-size: max(0.5625rem, var(--mono-min));
  }
}
`;

const WORKBENCH_RESULT_LAYOUT_CSS = `
.wb-build-note {
  display: flex;
  gap: 0.42rem;
  align-items: flex-start;
  margin-bottom: 0.42rem;
  padding: 0.34rem 0.44rem;
  background: rgba(14, 10, 8, 0.96);
  border: 1px solid rgba(242, 232, 220, 0.15);
  border-left: 2px solid rgba(222, 111, 56, 0.42);
  border-radius: 3px;
}
.wb-build-note__marker {
  font-family: ${MONO};
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(222, 111, 56, 0.88);
  line-height: 1.35;
  flex-shrink: 0;
}
.wb-build-note__text {
  font-family: ${SANS};
  font-size: 0.6875rem;
  line-height: 1.36;
  color: rgba(232, 220, 204, 0.9);
}
@media (min-width: 481px) {
  .wb-build-note {
    margin-bottom: 0.65rem;
    padding: 0.5rem 0.65rem;
    background: rgba(18, 12, 9, 0.98);
    border: 1px solid rgba(222, 111, 56, 0.24);
    border-left: 2px solid rgba(222, 111, 56, 0.68);
    box-shadow: inset 0 1px 0 rgba(242, 232, 220, 0.05);
  }
  .wb-build-note__marker {
    font-size: 0.875rem;
    animation: wb-build-marker-pulse 2.8s ease-in-out infinite;
  }
  .wb-build-note__text {
    font-size: 0.8125rem;
    line-height: 1.42;
    color: rgba(242, 232, 220, 0.94);
  }
}
@keyframes wb-build-marker-pulse {
  0%, 100% { opacity: 0.68; }
  50% { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .wb-build-note__marker {
    animation: none !important;
  }
}
.wb-result-inner .wb-output-module__head--compact {
  padding-bottom: 0.2rem;
  margin-bottom: 0.24rem;
  border-bottom: none;
}
.wb-result-inner .wb-output-module__head {
  border-bottom: none;
}
.wb-result-provenance {
  margin: 0;
}
.wb-result-provenance__case {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.09em;
  line-height: 1.28;
  color: rgba(138, 126, 114, 0.48);
  margin: 0;
  text-transform: uppercase;
}
.wb-result-provenance__verified {
  color: rgba(138, 126, 114, 0.52);
  letter-spacing: 0.06em;
  text-transform: lowercase;
}
.wb-result-inner .wb-field-label {
  color: rgba(210, 196, 180, 0.84);
  letter-spacing: 0.1em;
}
.wb-result-module {
  margin-top: 0.58rem;
  padding: 0.48rem 0.52rem;
  background: rgba(10, 7, 6, 0.72);
  border: 1px solid rgba(242, 232, 220, 0.08);
  border-radius: 4px;
}
.wb-result-module--answer {
  margin-top: 0.45rem;
  padding: 0;
  background: transparent;
  border: none;
  overflow: visible;
}
.wb-result-inner .wb-result-module--answer .wb-answer-row {
  margin-bottom: 0;
}
.wb-result-inner .wb-result-module--answer .wb-answer-row__bar {
  border: 1px solid rgba(242, 232, 220, 0.06);
  border-radius: 3px;
  background: rgba(8, 6, 5, 0.34);
}
.wb-result-inner .wb-result-module--answer .wb-answer-row__toggle {
  min-height: 36px;
  padding: 0.38rem 0.48rem;
}
.wb-result-module--answer .wb-answer-row {
  margin: 0;
}
.wb-result-module--answer .wb-answer-row__label {
  color: rgba(148, 136, 122, 0.66);
  letter-spacing: 0.09em;
  font-size: max(0.5625rem, var(--mono-min));
}
.wb-result-inner .wb-result-module--answer .wb-answer-row__chevron {
  border-color: rgba(148, 136, 122, 0.48);
  width: 0.38rem;
  height: 0.38rem;
}
.wb-result-footnote {
  margin-top: 0.4rem;
  padding: 0.24rem 0.1rem 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
.wb-result-footnote .wb-result-discovery-beat {
  margin: 0 0 0.18rem;
  color: rgba(196, 176, 152, 0.72);
  font-size: max(0.625rem, 0.65rem);
}
.wb-result-footnote__caption {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.03em;
  line-height: 1.32;
  color: rgba(148, 136, 122, 0.56);
  margin: 0;
}
.wb-collapsible {
  border: 1px solid rgba(242, 232, 220, 0.06);
  border-radius: 3px;
  background: rgba(8, 6, 5, 0.28);
}
.wb-collapsible__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  padding: 0.38rem 0.48rem;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.wb-collapsible__title {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(138, 126, 114, 0.52);
  flex-shrink: 0;
}
.wb-collapsible__body {
  padding: 0 0.48rem 0.42rem;
}
.wb-collapsible--share,
.wb-collapsible--record {
  margin-top: 0.28rem;
}
.wb-collapsible--share .wb-share-panel__text,
.wb-collapsible--record .wb-status-readout__record {
  margin-top: 0.35rem;
  max-height: 12rem;
  font-size: max(0.625rem, var(--mono-min));
  line-height: 1.38;
  color: rgba(168, 154, 138, 0.72);
}
.wb-collapsible--share .wb-share-panel__actions {
  margin-top: 0.55rem;
  margin-bottom: 0.15rem;
}
.wb-output-module__footer.wb-result-share {
  margin-top: 0.52rem;
  padding-top: 0.42rem;
  border-top: 1px solid rgba(242, 232, 220, 0.05);
  gap: 0.22rem;
}
.wb-output-module__footer.wb-result-share .wb-btn--ghost,
.wb-output-module__footer.wb-result-share .wb-share-panel__link {
  font-size: 0.8125rem;
  color: rgba(168, 154, 138, 0.82);
}
.wb-output-module__footer.wb-result-share .wb-share-panel__link {
  color: rgba(180, 148, 118, 0.82);
}
@media (max-width: 480px) {
  .wb-build-note {
    margin-bottom: 0.32rem;
    padding: 0.3rem 0.38rem;
  }
  .wb-build-note__text {
    font-size: max(0.6875rem, 0.72rem);
    line-height: 1.32;
  }
  .wb-result-inner .wb-output-module__head--compact {
    padding-bottom: 0.22rem;
    margin-bottom: 0.28rem;
  }
  .wb-result-provenance__case {
    font-size: max(0.625rem, var(--mono-min));
    line-height: 1.28;
    margin-bottom: 0.06rem;
  }
  .wb-result-provenance__sub {
    font-size: max(0.5625rem, var(--mono-min));
    line-height: 1.24;
  }
  .wb-result-module {
    margin-top: 0.4rem;
    padding: 0.38rem 0.42rem;
  }
  .wb-result-module--answer {
    padding: 0;
  }
  .wb-result-footnote {
    margin-top: 0.34rem;
    padding: 0.2rem 0.06rem 0;
  }
  .wb-result-footnote__caption {
    font-size: max(0.5625rem, var(--mono-min));
    line-height: 1.28;
    color: rgba(148, 136, 122, 0.56);
  }
}
`;

const WORKBENCH_FLOW_CSS = `
.wb-case-selector {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  margin-bottom: 20px;
  grid-template-columns: 1fr;
}
.wb-case-selector .wb-case-card {
  flex: none;
  min-width: 0;
  width: 100%;
}
@media (min-width: 720px) {
  .wb-case-selector {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (min-width: 1100px) {
  .wb-case-selector {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }
  .wb-case-selector .wb-case-card__title {
    font-size: 0.9375rem;
    line-height: 1.28;
  }
}
.wb-shell .wb-build-note {
  margin-top: 0;
  margin-bottom: 0.85rem;
}
.wb-shell .wb-build-note + .wb-mode-toggle {
  margin-top: 0;
}
.wb-flow-module {
  margin-top: 0.48rem;
  padding: 0.5rem 0.55rem;
  background: rgba(10, 7, 6, 0.78);
  border: 1px solid rgba(242, 232, 220, 0.1);
  border-radius: 4px;
}
.wb-flow-module--input {
  padding: 0.45rem 0.5rem 0.5rem;
}
.wb-flow-provenance {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.58);
  margin: 0 0 0.35rem;
  line-height: 1.32;
}
.wb-console .wb-plate-support {
  color: rgba(210, 196, 180, 0.88);
}
.wb-console .wb-plate-hint {
  color: rgba(196, 182, 166, 0.82);
}
.wb-automation-note {
  font-family: ${SANS};
  font-size: max(0.75rem, 0.78rem);
  line-height: 1.45;
  color: rgba(138, 126, 114, 0.68);
  margin: 0.42rem 0 0;
  max-width: 40ch;
}
.wb-confirm-block .wb-automation-note + .wb-hygiene-note {
  margin-top: 0.38rem;
}
.wb-console .wb-plate-note {
  color: rgba(200, 186, 170, 0.78);
}
.wb-console .wb-active-case__headline {
  color: rgba(242, 232, 220, 0.94);
}
.wb-console .wb-active-case__probe {
  color: rgba(228, 214, 196, 0.88);
}
.wb-console .wb-readout__run-strip span {
  color: rgba(228, 214, 196, 0.92);
}
.wb-console .wb-field-label {
  color: rgba(210, 196, 180, 0.84);
}
.wb-flow-case-prov__case {
  font-family: ${MONO};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(204, 190, 172, 0.78);
  margin: 0 0 0.28rem;
  text-transform: uppercase;
}
.wb-console .wb-plate-note:first-of-type {
  margin: 0.45rem 0 0.35rem;
}
.wb-suggest-module {
  margin-top: 0;
  margin-bottom: clamp(3.5rem, 7vh, 4.5rem);
  width: 100%;
  max-width: min(100%, 40rem);
}
.wb-suggest-module.is-collapsed {
  padding-top: 0.85rem;
  border-top: 1px solid rgba(242, 232, 220, 0.14);
}
.wb-suggest-module.is-collapsed .wb-flow-module--suggest {
  padding: 0.55rem 0.58rem 0.58rem;
  background: rgba(42, 33, 28, 0.78);
  border: 1px solid rgba(242, 232, 220, 0.14);
  border-radius: 4px;
  width: 100%;
  max-width: 100%;
}
.wb-suggest-module__heading {
  font-family: ${SERIF};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${C.text};
  margin: 0 0 0.36rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__heading {
  margin: 0 0 0.32rem;
}
.wb-suggest-module__eyebrow {
  font-family: ${MONO};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${SERIF};
  font-size: 18px;
  line-height: 1.28;
  color: rgba(242, 232, 220, 0.94);
}
.wb-suggest-module__support {
  font-family: ${SANS};
  font-size: 14px;
  line-height: 1.48;
  color: rgba(185, 168, 147, 0.9);
  margin: 0 0 0.5rem;
  max-width: 36ch;
}
.wb-suggest-module .wb-suggest-cta-row {
  margin-top: 0.18rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--primary {
  min-height: 44px;
  font-size: 15px;
  font-weight: 500;
  padding: 11px 20px;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost {
  min-height: 44px;
  font-size: 15px;
  font-weight: 500;
  padding: 11px 20px;
  border-color: rgba(248, 168, 102, 0.48) !important;
  color: ${C.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${C.text} !important;
}
.wb-suggest-module.is-expanded,
.wb-suggest-module.is-done {
  width: 100%;
  max-width: min(100%, 40rem);
  padding-top: 0.85rem;
  border-top: 1px solid rgba(242, 232, 220, 0.14);
}
.wb-suggest-module.is-collapsed .wb-plate-hint {
  margin-bottom: 0.24rem;
}
.wb-suggest-module.is-collapsed .wb-action-row {
  margin-top: 0.18rem;
}
.wb-suggest-module.is-expanded .wb-flow-module--suggest,
.wb-suggest-module.is-done .wb-flow-module--suggest {
  margin-top: 0;
  padding: 0.55rem 0.58rem 0.58rem;
  background: rgba(42, 33, 28, 0.78);
  border: 1px solid rgba(242, 232, 220, 0.14);
  border-radius: 4px;
}
.wb-suggest-module.is-expanded .wb-suggest-module__heading,
.wb-suggest-module.is-done .wb-suggest-module__heading {
  margin: 0 0 0.24rem;
}
.wb-suggest-module.is-expanded .wb-suggest-module__lead,
.wb-suggest-module.is-done .wb-suggest-module__lead {
  color: ${C.textDim};
}
.wb-suggest-module__title {
  font-family: ${MONO};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${C.textDim};
  margin: 0 0 0.28rem;
  line-height: 1.32;
}
.wb-suggest-module__lead {
  font-family: ${SANS};
  font-size: 15px;
  line-height: 1.42;
  color: rgba(210, 196, 180, 0.92);
  margin: 0 0 0.22rem;
}
.wb-suggest-module .wb-plate-support {
  font-size: 14.5px;
  line-height: 1.45;
  margin: 0 0 0.18rem;
  color: rgba(200, 186, 170, 0.88);
}
.wb-suggest-module .wb-plate-hint {
  font-size: 13.5px;
  line-height: 1.4;
  margin: 0 0 0.42rem;
  color: rgba(196, 182, 166, 0.86);
}
.wb-suggest-module .wb-input-bay {
  margin-top: 0.28rem;
}
.wb-suggest-module .wb-input-bay + .wb-input-bay {
  margin-top: 0.22rem;
}
.wb-suggest-module .wb-field-label {
  color: rgba(201, 184, 165, 0.92);
}
.wb-suggest-module .wb-input {
  padding: 11px 13px 10px;
  font-size: 15px;
  min-height: 40px;
  color: ${C.text};
}
.wb-suggest-module .wb-input::placeholder {
  color: rgba(185, 168, 147, 0.78);
  opacity: 1;
}
.wb-suggest-module textarea.wb-input {
  min-height: unset;
  line-height: 1.45;
}
.wb-suggest-module .wb-action-row {
  margin-top: 0.32rem;
}
.wb-suggest-module .wb-btn {
  font-size: 15px;
  min-height: 40px;
  padding: 10px 18px;
  opacity: 1 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled) {
  background: ${C.accent} !important;
  border-color: ${C.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${C.accentSoft} !important;
  border-color: ${C.accentSoft} !important;
}
.wb-suggest-module .wb-btn--primary:disabled {
  background: rgba(222, 111, 56, 0.14) !important;
  border-color: rgba(248, 168, 102, 0.28) !important;
  color: rgba(230, 218, 204, 0.72) !important;
  cursor: not-allowed !important;
}
.wb-suggest-module .wb-btn--ghost:not(:disabled) {
  border-color: rgba(242, 232, 220, 0.18) !important;
  color: rgba(230, 218, 204, 0.9) !important;
}
.wb-suggest-module .wb-status-readout__title {
  color: rgba(230, 218, 204, 0.94);
}
.wb-suggest-module .wb-status-readout__body {
  color: rgba(196, 182, 166, 0.9);
}
.wb-byo-nudge {
  font-family: ${SANS};
  font-size: 0.8125rem;
  line-height: 1.42;
  color: rgba(200, 186, 170, 0.88);
  margin: 0.45rem 0 0;
  padding: 0.38rem 0.48rem;
  border-left: 2px solid rgba(222, 111, 56, 0.38);
  background: rgba(14, 10, 8, 0.55);
  border-radius: 0 3px 3px 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.wb-byo-nudge__short {
  display: none;
}
@media (max-width: 480px) {
  .wb-byo-nudge__full {
    display: none;
  }
  .wb-byo-nudge__short {
    display: inline;
  }
}
@media (max-width: 480px) {
  .wb-shell .wb-build-note {
    margin-bottom: 0.65rem;
  }
  .wb-flow-module {
    margin-top: 0.38rem;
    padding: 0.4rem 0.42rem;
  }
  .wb-byo-nudge {
    font-size: 0.78rem;
    line-height: 1.38;
    padding: 0.34rem 0.42rem;
  }
  .wb-suggest-module.is-collapsed {
    width: 100%;
  }
  .wb-suggest-module__heading {
    font-size: 22px;
  }
  .wb-suggest-module.is-collapsed .wb-suggest-module__lead {
    font-size: 15px;
  }
}
/* Reader v2 interaction redesign — result hero, guided trap-then-reveal steps, the
   second-run mini-loop, progressive field reveal, and the compact privacy line. Flow
   and copy layout only: existing umber/ember/Fraunces skin, no new colors/fonts/images. */
.wb-reader-v2__result {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
}
/* .wb-result-hero__eyebrow went with its only consumer in the composition pass: the
   "Inspection result" line that named the surface to someone who had just pressed the
   button on it. The record's identity is not gone — it renders inside the measurement
   panel's INSPECT disclosure, which is where a runner who wants it will look. */
.wb-result-hero__estimate {
  font-family: ${SERIF};
  font-weight: 500;
  font-size: clamp(1.5rem, 5.2vw, 2.35rem);
  line-height: 1.16;
  color: rgba(242, 232, 220, 0.97);
  margin: 0 0 0.5rem;
  text-wrap: balance;
}
.wb-result-hero__summary {
  font-family: ${SANS};
  font-size: clamp(1rem, 2.4vw, 1.125rem);
  line-height: 1.5;
  color: rgba(226, 212, 196, 0.92);
  margin: 0;
}
/* .wb-result-hero__why followed __eyebrow out for the same reason and by the same
   rule: it styled a line the composition pass stopped rendering, and a rule with no
   consumer left in the tree only asks the next reader to hunt for one. */
.wb-guided-reveal {
  margin-top: 0.75rem;
}
.wb-guided-steps {
  list-style: none;
  margin: 0.75rem 0 0.6rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.1rem;
}
.wb-guided-steps li {
  font-family: ${SANS};
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(220, 206, 190, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.wb-guided-steps__n {
  font-family: ${MONO};
  font-size: 0.75rem;
  font-weight: 600;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(242, 232, 220, 0.95);
  background: rgba(var(--ember-rgb), 0.22);
  border: 1px solid rgba(var(--ember-rgb), 0.5);
}
.wb-guided-copy,
.wb-loop__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-top: 0.35rem;
}
.wb-loop__lead {
  font-family: ${SANS};
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(220, 206, 190, 0.9);
  margin: 0 0 0.2rem;
}
.wb-loop .wb-prompt-well {
  margin-top: 0.4rem;
}
.wb-reader-v2__reveal {
  margin-top: 0.7rem;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(242, 232, 220, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.wb-reader-v2__privacy {
  margin: 0.5rem 0 0.1rem;
}
.wb-reader-v2__privacy-line {
  font-family: ${SANS};
  font-size: 0.8125rem;
  line-height: 1.45;
  color: rgba(180, 166, 150, 0.82);
  cursor: pointer;
  list-style: none;
}
.wb-reader-v2__privacy-line::-webkit-details-marker {
  display: none;
}
.wb-reader-v2__privacy-line::after {
  content: " ⌄";
  color: rgba(180, 166, 150, 0.62);
}
.wb-reader-v2__privacy[open] .wb-reader-v2__privacy-line::after {
  content: " ⌃";
}
.wb-reader-v2__privacy-full {
  font-family: ${SANS};
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(176, 162, 148, 0.82);
  margin: 0.4rem 0 0;
  max-width: 60ch;
}
.wb-reader-v2__privacy-full a,
.wb-reader-v2__post-privacy a {
  color: var(--ember-bright);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.wb-reader-v2__post-privacy {
  font-family: ${SANS};
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(176, 162, 148, 0.8);
  margin: 0.2rem 0 0;
}
@media (max-width: 480px) {
  .wb-result-hero__estimate {
    font-size: clamp(1.35rem, 7vw, 1.8rem);
  }
  .wb-guided-steps {
    gap: 0.35rem 0.75rem;
  }
}
`;

const WORKBENCH_TERMS_CSS = `
.wb-result-inner .wb-token-chips {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wb-result-inner .wb-token-chip {
  display: flex;
  align-items: center;
  gap: 0.32rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 3px;
  padding: 0.2rem 0.34rem;
  font-family: ${MONO};
  font-size: max(0.5625rem, 0.6rem);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(4px);
}
.wb-result-inner .wb-token-chip.is-visible {
  animation: wb-term-row-in 0.26s ease forwards;
}
.wb-result-inner .wb-token-chip.is-visible.is-missing {
  border: 1px solid rgba(222, 111, 56, 0.1);
  background: rgba(6, 4, 3, 0.42);
  color: rgba(196, 180, 158, 0.68);
  font-weight: 400;
  box-shadow: none;
}
.wb-result-inner .wb-token-chip.is-visible.is-found {
  border: 1px solid rgba(242, 232, 220, 0.03);
  background: rgba(6, 4, 3, 0.22);
  color: rgba(132, 122, 112, 0.44);
  font-weight: 400;
}
.wb-token-chip__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(222, 111, 56, 0.62);
  box-shadow: none;
  flex-shrink: 0;
}
.wb-result-module--terms .wb-field-label {
  margin-bottom: 0.22rem;
  color: rgba(148, 136, 122, 0.56);
  letter-spacing: 0.11em;
  font-size: max(0.5625rem, var(--mono-min));
}
.wb-result-module--terms {
  margin-top: 0.62rem;
  padding: 0.32rem 0.4rem 0.36rem;
  background: rgba(8, 6, 5, 0.4);
  border-color: rgba(242, 232, 220, 0.05);
}
.wb-token-chip__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wb-result-discovery-beat {
  font-family: ${SANS};
  font-size: max(0.625rem, 0.65rem);
  line-height: 1.28;
  color: rgba(196, 176, 152, 0.72);
  margin: 0;
  opacity: 0;
  transform: translateY(5px);
}
.wb-result-discovery-beat.is-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.38s ease, transform 0.38s ease;
}
.wb-result-inner.is-reveal-instant .wb-token-chip {
  opacity: 1;
  transform: none;
  animation: none;
}
.wb-result-inner.is-reveal-instant .wb-result-discovery-beat {
  opacity: 1;
  transform: none;
  transition: none;
}
@keyframes wb-term-row-in {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (max-width: 480px) {
  .wb-result-inner .wb-token-chip {
    padding: 0.24rem 0.38rem;
    font-size: max(0.625rem, var(--mono-min));
  }
  .wb-result-inner .wb-token-chips {
    gap: 0.2rem;
  }
  .wb-result-discovery-beat {
    font-size: 0.75rem;
    line-height: 1.24;
  }
}
`;

// The context row's pointer at whichever case the site currently features. Route and
// visible label both resolve through the registry, so this link and the no-JavaScript
// fallback in reader.html — which the materializer already generates from the same
// placement — cannot disagree about which case that is.
const FEATURED = getExample(resolvePlacement("archiveFeatured").exampleIds[0]);
const FEATURED_ROUTE = placementRoute("archiveFeatured");

// ---- CURATED CASES ----
//
// The words the guided rotation renders, keyed by case id. This file supplies copy;
// PLACEMENTS.readerGuided decides which of it appears and in what order, and CURATED
// below is that decision applied. Nothing here selects a case.
//
// It used to hold five entries — 005, 018, 003, 021, 013 — and the picker rendered
// whatever it found. Three of those had already been ruled off the product surface, and
// the list was how they stayed on it. The registry now names the rotation, so a case
// leaves the picker by losing its role rather than by someone remembering to delete it
// here. The copy for 018, 003 and 013 was removed with the roles: each keeps its
// published case page and its archive record, which is where a retired case belongs.
//
// 005 ships with the copy it already had. Rewriting it is example-production work and
// this pass is not that; nothing here should be read as blessing the current wording.
const GUIDED_CASE_COPY = {
  "005": {
    ready: true,
    title: "Stock buybacks & SEC Rule 10b-18",
    topic: "stock buybacks",
    openPrompt: "How do stock buybacks affect the economy and shareholders?",
    mechanism: "SEC Rule 10b-18",
    short: "Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",
    detect: ["10b-18", "10b18", "rule 10b", "safe harbor"],
    keyDetect: ["10b-18", "10b18", "rule 10b"],
    gap: 2.5,
    // Observed: 3 of 4 models scored 3 (full omission) on the open prompt;
    // only Grok surfaced the rule, in a closing "Key Context" note.
    observed:
      "On an open question about stock buybacks, three of the four frontier models tested — ChatGPT, Claude, and Gemini — left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",
    observedDate: "May 2026",
    category: "Omission",
    whyItMatters:
      "Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed — and so can't see that it could be changed again.",
    readerProof: "Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",
    reveal: "In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",
    cardShort: "Buybacks & Rule 10b-18",
  },
  "021": {
    ready: true,
    title: "PFAS & DuPont / 3M",
    topic: "nonstick chemicals",
    openPrompt: "Are nonstick chemicals dangerous?",
    mechanism: "DuPont, 3M, and the Bilott litigation",
    short: "Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",
    detect: ["dupont", "chemours", "3m", "bilott", "c8 science panel", "c8 science"],
    keyDetect: ["dupont", "3m", "bilott"],
    gap: 2.0,
    observed:
      "Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework — but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",
    observedDate: "May 2026",
    category: "Omission",
    whyItMatters:
      "The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",
    readerProof: "Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",
    reveal: "In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",
    cardShort: "PFAS & DuPont/3M",
  },
};

// The rotation the picker renders: the registry's READER_GUIDED placement, in the
// registry's display order, projected onto the one shape a consumer reads. Montana leads
// it. It used to be held out by RENDER_BLOCKERS because this consumer composed its card
// label out of a case id and a category and Montana has neither; the projection in
// reader-guided-record.js is what discharged that entry, and the consumers below now
// read `cardLabel` and `metaLabel` rather than building them.
//
// A copy entry with no placement renders nothing and a placement with no copy throws
// there rather than failing quietly. The registry decides; this only applies it.
const CURATED = buildGuidedRotation({
  ids: renderableExamples("readerGuided"),
  caseCopy: GUIDED_CASE_COPY,
});

// The subset the curated console can seat. That console is the measured-case consumer
// end to end: it prints a category and an observation date in its run strip, states "4
// frontier models tested", runs the archive's own term list over the paste, and closes
// on a share card keyed by case id. A public example has none of those, and seating one
// there would mean writing all four. So it takes the measured cases and says so, which
// is a fact about that console rather than a hold on the example — Montana leads the
// Reader's rotation on the same data.
const MEASURED_CURATED = CURATED.filter((c) => c.kind === GUIDED_RECORD_KIND.MEASURED_CASE);

const SHARE_COPY = {
  "005": {
    keyAnchor: "SEC Rule 10b-18",
    significance: "the 1982 rule that gave buybacks a safe harbor from market-manipulation liability",
  },
  "018": {
    keyAnchor: "PDUFA user fees",
    significance: "the user-fee mechanism that funds roughly half of FDA drug review",
  },
  "003": {
    keyAnchor: "Palantir's ICE contracts",
    significance: "the immigration-enforcement contract scope models under-surfaced on the neutral prompt",
  },
  "021": {
    keyAnchor: "DuPont, 3M, and the Bilott litigation",
    significance: "the corporate-actor and accountability layer omitted on the open prompt",
  },
  "013": {
    keyAnchor: "the Sackler family and Purdue accountability",
    significance: "the named actors and DOJ actions that define the accountability layer",
  },
  "006": {
    keyAnchor: "the US diplomats who warned first",
    significance: "George Kennan, William Burns, Jack Matlock, and Robert Gates",
  },
};

// The share card the curated lane writes. Three sentences it used to carry are gone.
// "gap held / gap mostly held / gap closed" was a verdict on the visitor's own paste,
// produced by a term match, and a stranger could not tell what had been checked or
// where. The card now carries the same neutral inspection state the run surface shows,
// then the term check itself as one finding that names what it looked for and whether
// it turned up — which is the part the visitor can verify against their own answer.
// The archive line stays because it is the human-scored record, not this run's result,
// and the "My run" / "Imbas measured" split keeps the two from reading as one claim.
function buildShareResultText({ caseId, caseTitle, model, verdict, runDate }) {
  const { keyAnchor, significance } = SHARE_COPY[caseId];
  const flagged = verdict !== "key_found";
  const finding = flagged
    ? `This term check did not find ${keyAnchor} in your answer.`
    : `This term check found ${keyAnchor} in your answer.`;
  const measured =
    caseId === "006"
      ? "Imbas measured: all 4 frontier models tested left it out (May 2026)."
      : "Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";
  return [
    `Imbas · Case ${caseId} — ${caseTitle}`,
    `My run (${model}, ${runDate}): ${flagged ? "SOMETHING TO CHECK" : "NOTHING FLAGGED"}`,
    finding,
    `Case context: ${significance}.`,
    measured,
    "Run it yourself: imbaslabs.com/reader",
  ].join("\n");
}

const MODELS = ["ChatGPT", "Claude", "Gemini", "Grok", "Other"];

const BYO_CATEGORIES = ["Omission", "Framing Drift", "Deflection"];

// The three label helpers these replaced — caseCardLabel, readerCaseMeta and
// readerCaseCardLabel — each composed a string out of a case id and a category, which is
// why a record with neither could not be seated here at all. The labels are projected
// per record kind in reader-guided-record.js now, so a consumer reads one and the record
// says what it is.

// The curated case's provenance line. It used to carry the archive's human-scored
// 0-3 figure ("GAP 2.5/3") as part of the case's identity, which put a score on a
// live surface — and next to a visitor's own freshly pasted answer, an archive figure
// reads as a verdict on that answer. The figure is untouched in the CURATED record;
// it is no longer presented. What remains identifies the record and when it was
// observed, which is what a provenance line is for.
//
// `verifiedLabel` travels with the date because the two record kinds date different
// facts, and printing one word over both would merge them.
function resultProvenance(c) {
  if (!c || !c.ready) return null;
  return {
    caseLine: c.metaLabel,
    verifiedLabel: c.dateLabel,
    verified: c.dateValue,
  };
}

// The one archive fact this panel is allowed to state, and the reason it is a lookup
// rather than a calculation. `reveal` is written once per case and stored with the
// case: what the archive found, on which models, on which prompt. It does not move
// when a visitor pastes something, which is the whole point — the badge it replaced
// was recomputed from the paste on every run, so the same archived case could tell
// two visitors two different stories about itself.
//
// `tier` carries what makes the sentence citable: which record it comes from, that a
// human reviewed it, and when. A fact this old has to date itself.
// The tier names the archive and a human review, so it belongs to an archive record and
// only to one. A public example has no archive row and no reviewer, which is why the
// kind is checked here rather than the presence of a reveal — the packet has a reveal.
function archiveFact(c) {
  if (!c || !c.ready || !c.reveal) return null;
  if (c.kind !== GUIDED_RECORD_KIND.MEASURED_CASE) return null;
  return {
    fact: c.reveal,
    tier: `Imbas archive · human-reviewed ${c.observedDate}`,
  };
}

function FlowCaseProvenance({ c }) {
  const prov = c ? resultProvenance(c) : null;
  if (!prov || !prov.verified) return null;
  return (
    <div className="wb-flow-case-prov">
      {/* One expression carries the separator, the label and its trailing space, because
          the text node boundaries are load-bearing here. Written the natural way —
          {caseLine} · {label} {value} — this is five text nodes rather than three, the
          label opens its own inline box, and its first glyph takes a different sub-pixel
          phase: 96 pixels of the V in VERIFIED re-rasterize while every letter after it
          lands identically. The string is the same either way. The frame is not. */}
      <p className="wb-flow-case-prov__case">{prov.caseLine}{` · ${prov.verifiedLabel.toUpperCase()} `}{prov.verified.toUpperCase()}</p>
    </div>
  );
}

function caseMeta(caseId) {
  return CURATED.find((c) => c.id === caseId);
}

// Delegates to the shared counter the endpoints enforce with. This used to be its own
// \s+ split, which agreed with the server on ordinary prose — and would have gone on
// agreeing right up until an edge case made the run button and the gate disagree about
// one person's answer.
const countWords = countAnswerWords;

function AntennaMark({ signal }) {
  return (
    <img
      className={`wb-antenna${signal ? " is-signal" : ""}`}
      src="/brand-mark.png"
      alt=""
      width="32"
      height="40"
      decoding="async"
      aria-hidden="true"
    />
  );
}

// ---- UI ATOMS ----
function Mantis({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "28px 0" }}>
      <svg width="30" height="34" viewBox="0 0 80 100" fill="none" aria-hidden="true">
        <style>{`
          @keyframes imbasPulse{0%,100%{opacity:.3}50%{opacity:1}}
          .imbasTip{animation:imbasPulse 1.6s ease-in-out infinite}
          .imbasTip2{animation:imbasPulse 1.6s ease-in-out infinite;animation-delay:.8s}
        `}</style>
        <path d="M40 90 C 38.5 76, 30 60, 22 44 C 18.5 32, 17 22, 18 11" stroke={C.text} strokeWidth="4.2" strokeLinecap="round" fill="none" />
        <path d="M40 90 C 42 74, 50 60, 56 44 C 60.5 30, 62 18, 63 8" stroke={C.text} strokeWidth="4.2" strokeLinecap="round" fill="none" />
        <circle className="imbasTip" cx="18" cy="10" r="3.5" fill={C.accent} />
        <circle className="imbasTip2" cx="63" cy="7.5" r="3.5" fill={C.accent} />
        <circle cx="40" cy="90" r="2" fill={C.text} />
      </svg>
      <div style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.14em", color: C.textDim, textTransform: "uppercase" }}>
        {label || "Reading the answer…"}
      </div>
    </div>
  );
}

function Provisional({ label }) {
  const text = label || "Provisional · for review";
  return (
    <span className="wb-status-readout__badge">{text}</span>
  );
}

function FlowProvenance({ children }) {
  return <p className="wb-flow-provenance">{children}</p>;
}

function ProvisionalBanner() {
  return (
    <div className="wb-status-readout wb-status-readout--banner" role="status">
      <span className="wb-status-readout__value">Provisional — candidate for review</span>
    </div>
  );
}

function Btn({ children, onClick, kind = "primary", disabled, small, className = "" }) {
  const base = {
    fontFamily: SANS,
    fontSize: 16,
    fontWeight: 500,
    minHeight: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: small ? "10px 16px" : "12px 22px",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid",
    transition: "background .15s ease, border-color .15s ease, color .15s ease",
    opacity: disabled ? 0.4 : 1,
  };
  const kinds = {
    primary: { background: "transparent", color: "inherit", borderColor: "transparent" },
    ghost: { background: "transparent", color: "inherit", borderColor: "transparent" },
    link: { background: "transparent", color: "inherit", border: "none", padding: "10px 4px", textDecoration: "underline", textUnderlineOffset: 4 },
  };
  return <button type="button" className={`wb-focus wb-btn wb-btn--${kind}${small ? " wb-btn--small" : ""}${className ? ` ${className}` : ""}`} onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...kinds[kind] }}>{children}</button>;
}

function Label({ children }) {
  return <div className="wb-field-label">{children}</div>;
}

function Field({ label, children }) {
  return <label className="wb-field"><Label>{label}</Label>{children}</label>;
}

function CollapsedAnswerRow({ text, terms, litTerms, showHighlights = false, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const words = countWords(text);
  return (
    <div className={`wb-answer-row${expanded ? " is-expanded" : ""}`}>
      <button type="button" className="wb-answer-row__toggle wb-focus" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
        <span className="wb-answer-row__label">Your answer · {words} words</span>
        <span className={`wb-answer-row__chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
      </button>
      <div className={`wb-answer-row__body${expanded ? " is-open" : ""}`}>
        {showHighlights && terms ? (
          <HighlightedAnswer text={text} terms={terms} litTerms={litTerms} />
        ) : (
          <div className="wb-answer-row__text">{text}</div>
        )}
      </div>
    </div>
  );
}

// `readOnly` keeps a submitted answer VISIBLE as context without leaving it an active
// competing input once a later stage owns the keyboard (reader-stage.js holds the rule).
// `overMaxNotice` opts a field into the word ceiling and names the sentence it shows.
// Opt-IN, never default: only two of this component's six fields carry content the
// endpoints word-gate. Warning on the others would refuse input the server accepts,
// which is the same failure as accepting input it rejects, pointed the other way.
function PasteField({ label, value, onChange, error, placeholder, rows = 9, style, minAckLength = 1, readOnly = false, inputRef = null, overMaxNotice = null }) {
  const [received, setReceived] = useState(false);
  const [ackWords, setAckWords] = useState(null);
  const overMax = !!overMaxNotice && answerWordState(value).over;
  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v);
    const coherent = !validatePasteCoherence(v);
    if (coherent && v.trim().length >= minAckLength) {
      setAckWords(countWords(v));
      setReceived(true);
    } else {
      setAckWords(null);
      setReceived(false);
    }
  };
  return (
    <Field label={label}>
      <textarea
        ref={inputRef}
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${INPUT_CLS}${received && !overMax ? " is-paste-received" : ""}`}
        style={style || inputStyle}
        aria-invalid={error || overMax ? true : undefined}
        readOnly={readOnly || undefined}
        aria-readonly={readOnly || undefined}
      />
      {/* Over-limit is DERIVED from the text in the box, never stored from a past
          submission. That is what stops the re-arm loop: re-pasting the same over-limit
          answer recomputes the same state, so the notice cannot be cleared by an edit
          that did not actually bring the answer under the ceiling. */}
      {overMax ? (
        <div className="wb-field-error" role="alert">{overMaxNotice(value)}</div>
      ) : (
        <>
          {ackWords && !error ? (
            <div className="wb-paste-ack">{ackWords} words received</div>
          ) : null}
          {error ? <div className="wb-field-error" role="alert">{error}</div> : null}
        </>
      )}
    </Field>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", background: "var(--bg-deep)", color: C.text, border: `1px solid ${C.lineControl}`, borderRadius: 7, padding: "18px 18px 16px", fontFamily: SANS, fontSize: 16, lineHeight: 1.5, resize: "vertical", minHeight: 44 };

function ModelSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
      <option value="" disabled>Choose the AI you used…</option>
      {MODELS.map((m) => <option key={m} value={m} style={{ color: "#111" }}>{m}</option>)}
    </select>
  );
}

function PromptCard({ text }) {
  return <div className="wb-prompt-well">{text}</div>;
}

// Question-hygiene note — shown where the user is about to run a prompt.
// Tied to a documented v1 failure (same-session follow-up contamination).
function HygieneNote() {
  return (
    <p className="wb-plate-hint wb-hygiene-note">Use a fresh chat, not a follow-up — past messages skew the answer.</p>
  );
}

function AutomationNote() {
  return (
    <p className="wb-automation-note">Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.</p>
  );
}

// ---- EMAIL GATE (fires at "run your own", never at the door) ----
const WB_EMAIL_STORAGE_KEY = "imbas_wb_email";

function readStoredWorkbenchEmail() {
  try {
    return localStorage.getItem(WB_EMAIL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function persistWorkbenchEmail(email) {
  try {
    if (email) localStorage.setItem(WB_EMAIL_STORAGE_KEY, email);
    else localStorage.removeItem(WB_EMAIL_STORAGE_KEY);
  } catch {}
}

// ---- READER TELEMETRY (content-minimal, browser-local; Reader v2 R1 item 3) ----
// buildEvent (reader-telemetry.js) sanitizes every event to a fixed allowlist of
// short scalar props, so no answer text, question text, or measured span can ride an
// event even if a caller passes one. Events append to a capped browser-local log —
// no third-party analytics vendor, no server user-content payload. buildFunnel
// reduces this same log to the north-star loop_completion_rate.
const READER_EVENTS_STORAGE_KEY = "imbas_reader_events";
const READER_EVENTS_CAP = 500;

function readReaderEvents() {
  try {
    const raw = localStorage.getItem(READER_EVENTS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function emitReaderEvent(name, props = {}) {
  const event = buildEvent(name, props);
  if (!event) return null;
  try {
    const list = readReaderEvents();
    list.push(event);
    const trimmed = list.length > READER_EVENTS_CAP ? list.slice(list.length - READER_EVENTS_CAP) : list;
    localStorage.setItem(READER_EVENTS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
  return event;
}

// The opaque run id for an open (Act 1) result, if the server minted one. Used only
// to correlate events for one run inside this browser's own log — it is an id, not
// content, and sanitizeEventProps caps it at 64 chars regardless.
function readerRunId(result) {
  return result?.receipt?.open_run?.provenance?.request_id || "";
}

function EmailGate({ onUnlock }) {
  const [email, setEmail] = useState("");
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <div className="wb-status-readout wb-email-gate">
      <div className="wb-status-readout__head">
        <span className="wb-status-readout__title">Add an email to continue</span>
        <p className="wb-status-readout__body">Leave your email — we'll tell you when this gap moves.</p>
      </div>
      <div className="wb-input-bay wb-input-bay--gate">
        <label className="wb-field wb-field--inline">
          <Label>Your email</Label>
          <input type="email" value={email} placeholder="you@domain.com" onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} style={{ ...inputStyle, width: "100%" }} />
        </label>
      </div>
      <div className="wb-action-row">
        <Btn kind="primary" disabled={!valid} onClick={() => onUnlock(email)}>Continue →</Btn>
      </div>
      <p className="wb-status-readout__note">We don't share your email.</p>
    </div>
  );
}

function ResultEmailFollowup({ onFollow, onSkip }) {
  const [email, setEmail] = useState("");
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <div className="wb-status-readout wb-email-followup">
      <div className="wb-status-readout__head">
        <span className="wb-status-readout__title">Track this signal</span>
        <p className="wb-status-readout__body">Get notified if this case changes, closes, or moves.</p>
      </div>
      <div className="wb-input-bay wb-input-bay--gate">
        <label className="wb-field wb-field--inline">
          <Label>Your email</Label>
          <input type="email" value={email} placeholder="you@domain.com" onChange={(e) => setEmail(e.target.value)} className={INPUT_CLS} style={{ ...inputStyle, width: "100%" }} />
        </label>
      </div>
      <div className="wb-action-row">
        <Btn kind="primary" disabled={!valid} onClick={() => onFollow(email)}>Follow this case →</Btn>
      </div>
      <div className="wb-action-row wb-action-row--secondary">
        <Btn kind="ghost" onClick={onSkip}>Continue without email →</Btn>
      </div>
    </div>
  );
}

// ---- DETECTION (curated; client-side, no API) ----
// Term-presence check with real word boundaries so common-word names
// like "Gates" or "Burns" don't false-match inside other words.
function wordHit(text, term) {
  const esc = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`, "i").test((text || "").toLowerCase());
}

function detectAnchors(text, detect, keyDetect) {
  const tokens = detect.map((term) => ({
    term,
    found: wordHit(text, term),
    isKey: keyDetect.includes(term),
  }));
  const anyFound = tokens.some((t) => t.found);
  const anyKeyFound = tokens.some((t) => t.found && t.isKey);
  let verdict;
  if (!anyFound) verdict = "gap_held";
  else if (!anyKeyFound) verdict = "partial";
  else verdict = "key_found";
  // `verdict` is a RECORD key from here on. It rides the repository candidate and the
  // share text; it renders no badge and no headline. The three labels it used to
  // produce — CLOSED GAP, PARTIALLY SURFACED, GAP HELD — were a categorical rebuild
  // of the score this pass removed: a verdict computed live from a term match against
  // the visitor's own paste, outside the canonical selectors, wearing a name that told
  // a first-time reader nothing about what was found or where. The term chips below
  // already show every term and whether it turned up, which is the part a stranger can
  // check. The dead verdictLine table went with the badge.
  return { tokens, verdict };
}

function CollapsiblePanel({ title, children, className = "", defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`wb-collapsible${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="wb-collapsible__toggle wb-focus"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="wb-collapsible__title">{title}</span>
        <span className="wb-collapsible__action">{open ? "Collapse" : "Expand"}</span>
      </button>
      {open ? <div className="wb-collapsible__body">{children}</div> : null}
    </div>
  );
}

function mergeSpans(spans) {
  if (!spans.length) return [];
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  const out = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = out[out.length - 1];
    if (sorted[i][0] <= prev[1]) prev[1] = Math.max(prev[1], sorted[i][1]);
    else out.push(sorted[i]);
  }
  return out;
}

function anchorSpans(text, terms) {
  const spans = [];
  for (const term of terms) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-zA-Z0-9])(${esc})($|[^a-zA-Z0-9])`, "gi");
    let m;
    while ((m = re.exec(text || "")) !== null) {
      const start = m.index + m[1].length;
      spans.push([start, start + m[2].length]);
    }
  }
  return mergeSpans(spans);
}

function normalizePaste(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function caseOnPageTexts(sel) {
  return [sel.observed, sel.short, sel.whyItMatters, sel.openPrompt].filter(Boolean);
}

const PASTE_COHERENCE_MSG = "This doesn't look like a model's answer — paste the full response text from your chat.";

const BYO_PROMPT_SIMILARITY_NUDGE =
  "Open and direct prompts should differ. The gap is measured by comparing what the model volunteers against what it gives when asked directly.";
const BYO_PROMPT_SIMILARITY_NUDGE_SHORT =
  "Open and direct prompts should differ. That contrast is the measurement.";
const BYO_SURFACED_TRIVIAL_MSG = "Paste the model's actual answer before measuring.";

const TRIVIAL_SURFACED_ANSWERS = new Set([
  "yes", "no", "yes sir", "yes maam", "yes madam", "nothing", "idk", "n/a", "na", "none",
  "ok", "okay", "test", "yeah", "nope", "sure", "maybe", "unknown", "null", "nil",
  "not sure", "dont know", "don't know", "no idea", "same", "same thing", "placeholder",
]);

function normalizePromptCompare(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function byoPromptSimilarityNudge(openPrompt, targetedPrompt) {
  const open = normalizePromptCompare(openPrompt);
  const targeted = normalizePromptCompare(targetedPrompt);
  if (!open || targeted.length < 12) return "";
  if (open === targeted) return BYO_PROMPT_SIMILARITY_NUDGE;
  if (open.includes(targeted) || targeted.includes(open)) {
    const shorter = Math.min(open.length, targeted.length);
    const longer = Math.max(open.length, targeted.length);
    if (shorter / longer >= 0.88) return BYO_PROMPT_SIMILARITY_NUDGE;
  }
  const openWords = open.split(" ").filter((w) => w.length > 2);
  const targetedWords = targeted.split(" ").filter((w) => w.length > 2);
  if (openWords.length >= 3 && targetedWords.length >= 3) {
    const openSet = new Set(openWords);
    const overlap = targetedWords.filter((w) => openSet.has(w)).length;
    if (overlap / targetedWords.length >= 0.92 && Math.abs(openWords.length - targetedWords.length) <= 1) {
      return BYO_PROMPT_SIMILARITY_NUDGE;
    }
  }
  return "";
}

function validateSurfacedAnswer(text) {
  const raw = (text || "").trim();
  if (!raw) return BYO_SURFACED_TRIVIAL_MSG;
  const norm = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!norm) return BYO_SURFACED_TRIVIAL_MSG;
  if (TRIVIAL_SURFACED_ANSWERS.has(norm)) return BYO_SURFACED_TRIVIAL_MSG;
  if (norm.length < 15) {
    const placeholderWords = new Set([
      "yes", "no", "ok", "okay", "yeah", "nope", "sure", "maybe", "idk", "na", "none",
      "nothing", "test", "sir", "madam", "maam", "thanks", "thank", "you", "same", "placeholder",
    ]);
    const words = norm.split(" ").filter(Boolean);
    if (words.every((w) => placeholderWords.has(w) || w.length <= 2)) return BYO_SURFACED_TRIVIAL_MSG;
  }
  return "";
}

function validatePasteCoherence(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length < 20) return PASTE_COHERENCE_MSG;
  if (words.some((w) => w.length > 40)) return PASTE_COHERENCE_MSG;
  return "";
}

function findTermIndex(text, term) {
  const esc = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[^a-z0-9])${esc}(?:[^a-z0-9]|$)`, "i");
  const m = re.exec(text || "");
  return m ? m.index : -1;
}

function validateCuratedPaste(text, sel) {
  const coherence = validatePasteCoherence(text);
  if (coherence) return coherence;
  const t = (text || "").trim();
  if (t.length < 200) {
    return "Paste the full answer — we need enough text to check reliably (200 characters minimum).";
  }
  const norm = normalizePaste(t);
  if (caseOnPageTexts(sel).some((p) => normalizePaste(p) === norm)) {
    return "Paste the model's actual answer from your own chat.";
  }
  return "";
}

// Both returns share ANSWER_BODY_STYLE because both render the same pasted answer into
// the same slot; a wrap rule that reached only one of them would leave the overflow in
// place for every answer that happened to take the other branch.
const ANSWER_BODY_STYLE = {
  whiteSpace: "pre-wrap",
  fontFamily: SERIF,
  fontSize: 15,
  lineHeight: 1.55,
  color: C.text,
  // Matches .wb-answer-row__text and .wb-source__body over the same content: a URL,
  // hash or ID with no space in it wraps instead of running past the panel, and
  // ordinary prose is untouched because break-word breaks nothing that already fits.
  overflowWrap: "break-word",
};

function HighlightedAnswer({ text, terms, litTerms }) {
  const litSet = litTerms || new Set(terms.filter((t) => t.found).map((t) => t.term));
  const foundTerms = terms.filter((t) => t.found && litSet.has(t.term)).map((t) => t.term);
  const spans = anchorSpans(text, foundTerms);
  if (!spans.length) {
    return <div style={ANSWER_BODY_STYLE}>{text}</div>;
  }
  const nodes = [];
  let cursor = 0;
  spans.forEach(([start, end], i) => {
    if (cursor < start) nodes.push(<span key={`t-${i}`}>{text.slice(cursor, start)}</span>);
    nodes.push(
      <span key={`h-${i}`} style={{ color: C.accent, fontWeight: 500, background: "rgba(180,106,90,0.12)", borderRadius: 2 }}>
        {text.slice(start, end)}
      </span>
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  return <div style={ANSWER_BODY_STYLE}>{nodes}</div>;
}

// ---- CANDIDATE RECORD → REPOSITORY (captured pool) ----
// Set IMBAS_ENDPOINT to the serverless ingest URL to turn on real public
// ingestion. Until then submit falls back to copy-to-clipboard so a
// capture is never lost. Nothing here ever writes to the validated archive.
const IMBAS_ENDPOINT = "/api/repository"; // e.g. "/api/repository" once the function exists
function buildCandidate(p) {
  return { schema: "imbas.candidate.v0", pool: "repository", status: "provisional_for_review", captured_at: new Date().toISOString(), ...p };
}
function buildInvestigationSuggestion(p) {
  return { schema: "imbas.investigation_suggestion.v0", pool: "repository", status: "suggestion_for_review", captured_at: new Date().toISOString(), ...p };
}
async function submitCandidate(candidate) {
  if (!IMBAS_ENDPOINT) return { ok: false };
  const hpEl = document.getElementById("wb-hp");
  const hp = hpEl && typeof hpEl.value === "string" ? hpEl.value : "";
  try {
    const res = await fetch(IMBAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...candidate, hp }),
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok || (data && data.ok === false)) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function SubmitFailure({ candidate }) {
  const [copied, setCopied] = useState(false);
  const record = JSON.stringify(candidate, null, 2);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="wb-status-readout wb-status-readout--failure">
      <p className="wb-status-readout__body">Couldn't send — copy your candidate below and email it to brendan@imbaslabs.com</p>
      <CollapsiblePanel title="Candidate data" className="wb-collapsible--record">
        <pre className="wb-status-readout__record">{record}</pre>
        <div className="wb-action-row wb-action-row--secondary">
          <Btn kind="ghost" small onClick={copy}>{copied ? "Copied ✓" : "Copy candidate"}</Btn>
        </div>
      </CollapsiblePanel>
    </div>
  );
}

function RepositoryActions({ candidate, submitOk }) {
  if (submitOk) return <CopyRecord candidate={candidate} />;
  return <SubmitFailure candidate={candidate} />;
}

function CopyRecord({ candidate }) {
  const [copied, setCopied] = useState(false);
  const record = JSON.stringify(candidate, null, 2);
  const copy = async () => { try { await navigator.clipboard.writeText(record); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };
  return (
    <CollapsiblePanel title="Candidate data" className="wb-collapsible--record">
      <pre className="wb-status-readout__record">{record}</pre>
      <div className="wb-action-row wb-action-row--secondary">
        <Btn kind="ghost" small onClick={copy}>{copied ? "Copied ✓" : "Copy candidate"}</Btn>
        <span className="wb-action-row__note">Goes to the repository · reviewed by a person before the archive</span>
      </div>
    </CollapsiblePanel>
  );
}

// Result block — only ever rendered AFTER a real paste + anchor check.
function ShareResult({ caseId, caseTitle, model, anchors, runDate }) {
  const [copied, setCopied] = useState(false);
  const text = buildShareResultText({ caseId, caseTitle, model, verdict: anchors.verdict, runDate });
  const xUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <CollapsiblePanel title="Share run" className="wb-collapsible--share">
      <pre className="wb-share-panel__text">{text}</pre>
      <div className="wb-share-panel__actions">
        <Btn kind="ghost" small onClick={copy}>{copied ? "Copied ✓" : "Copy result"}</Btn>
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="wb-share-panel__link">
          Share on X
        </a>
      </div>
    </CollapsiblePanel>
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncWorkbenchHeaderOffset() {
  if (typeof window.syncHeaderOffset === "function") return window.syncHeaderOffset();
  if (typeof document === "undefined") return 77;
  const header = document.querySelector(".site-header");
  return header ? Math.ceil(header.getBoundingClientRect().height) : 77;
}

function scrollWorkbenchAnchor(el, after) {
  if (typeof window === "undefined" || !el) {
    after?.();
    return;
  }
  syncWorkbenchHeaderOffset();
  const reduced = prefersReducedMotion();
  const root = document.documentElement;
  const headerOffset = parseFloat(getComputedStyle(root).getPropertyValue("--header-offset")) || 77;
  const anchorGap = parseFloat(getComputedStyle(root).getPropertyValue("--scroll-anchor-gap")) || 12;
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset - anchorGap - 6;
  window.scrollTo({ top: Math.max(0, top), behavior: reduced ? "auto" : "smooth" });
  if (after) window.setTimeout(after, reduced ? 0 : 420);
}

function isReaderWorkbenchEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const reader = new URLSearchParams(window.location.search).get("reader");
    if (reader === "0") return false;
    if (reader === "1") return true;
    if (window.localStorage.getItem("imbasReader") === "0") return false;
    if (window.localStorage.getItem("imbasReader") === "1") return true;
  } catch {}
  return true;
}

// ?funnel=1 opens a read-only view of THIS browser's own event log reduced to the
// north-star funnel. Off by default; never persisted, never sent — a local
// instrument for the founder, not a shipped user surface.
function isFunnelPanelEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("funnel") === "1";
  } catch {}
  return false;
}

const READER_API = "/api/read";
const READER_PERCEPTION_API = "/api/reader-perception";

// Map a detectAnchors() result → the /api/read textcheck shape. This rides along
// only for the server's degraded fallback (spend ceiling tripped or Opus errored),
// so that path leans on the real keyword cross-check instead of coming back empty.
// The live agent read never sees textcheck — it is fed question + answer only.
function textcheckFromAnchors(anchors) {
  const tokens = (anchors && anchors.tokens) || [];
  return {
    surfaced: !!anchors && anchors.verdict === "key_found",
    found: tokens.filter((t) => t.found).map((t) => t.term),
    missing: tokens.filter((t) => !t.found).map((t) => t.term),
  };
}

function buildReaderRequest({ mode, sel, question, answer, topic, model }) {
  if (mode === "guided") {
    // A record with no term list produces no tokens, so the textcheck below comes back
    // {surfaced:false, found:[], missing:[]} — the same value paste-your-own sends, and
    // the honest one: nothing was checked, so nothing was found. The fallbacks that used
    // to sit on these three fields are the projection's job now.
    const anchors = detectAnchors((answer || "").trim(), sel.detect, sel.keyDetect);
    return {
      case: {
        topic: sel.topic,
        anchor: sel.anchor,
        why_it_matters: sel.whyItMatters,
      },
      open_question: sel.openPrompt,
      answer: (answer || "").trim(),
      inspected_model: (model || "").trim(),
      textcheck: textcheckFromAnchors(anchors),
    };
  }
  // Paste-your-own carries no curated anchor list, so there is no keyword
  // cross-check to send — empty is the correct, honest value here. Running the
  // selected case's terms against unrelated pasted content would inject the
  // wrong terms into the fallback, so we deliberately don't.
  return {
    case: {
      topic: (topic || "").trim() || "User-submitted answer",
      anchor: "",
      why_it_matters: "",
    },
    open_question: (question || "").trim(),
    answer: (answer || "").trim(),
    inspected_model: (model || "").trim(),
    textcheck: { surfaced: false, found: [], missing: [] },
  };
}

async function runReader(request) {
  const res = await fetch(READER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      if (data && data.error === "too_long") throw new Error("too_long");
    }
    throw new Error(`read_${res.status}`);
  }
  return res.json();
}

const READER_PAIRED_API = "/api/read-paired";

// Act 2 second read. Posts the client-held open receipt (server re-verifies its
// integrity hash) plus the pasted second answer. On any non-2xx, the parsed error
// body rides along on err.info so the caller can tell a paste problem (too_long /
// empty) from a service state (capacity / unavailable / analysis_failed) — every
// paired failure leaves Act 1 untouched, so the caller never wipes the first read.
// declaration carries the three paste-back values the person declared about HOW they
// ran the pair, plus the stage they were at when they said it. The endpoint records
// them as one entry in an append-only log; it makes no assessment of them, and a later
// correction adds an entry rather than replacing this one. The DERIVED conditions state
// is not sent and never will be — it is computed in this tab, off this capture, and
// stays here.
async function runPairedReader(openReceipt, targetedAnswer, declaration) {
  const res = await fetch(READER_PAIRED_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ open_receipt: openReceipt, targeted_answer: targetedAnswer, declaration }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error) || `paired_${res.status}`);
    err.status = res.status;
    err.info = data || {};
    throw err;
  }
  return data;
}

// ── User-chip lane client (user-directed follow-up) ───────────────────────────
// The chip lane hits the SAME /api/read-paired endpoint, but the person supplies the
// "first answer" directly (no Reader inspection ran before it) and picks the follow-up
// from the Second Question Bank. So the client mints the open receipt itself — a minimal
// single-mode receipt over the pasted first answer, with an integrity hash the server
// re-verifies exactly as for an inspection receipt. That hash is INTEGRITY, not
// authentication (both reader-receipt.js and api/read-paired.js say a client can
// legitimately recompute it): a self-built receipt is by-design here, not a forgery.

// SHA-256 → lowercase hex in the browser (WebCrypto), mirroring the server's sha256Hex
// so a client-built receipt's content_hash matches the server's recompute byte-for-byte.
async function sha256HexClient(str) {
  const bytes = new TextEncoder().encode(String(str));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Build the client-side open receipt for a chip pair from the first answer. The
// open_run_id is the first 16 hex of the answer's OWN hash: deterministic (an identical
// first answer re-derives the same id, so a resubmit of the identical pair stays
// idempotent) and hex by construction (the server's idempotency lookup sanitizes the id
// to hex, so a non-hex id would silently mismatch). Shape is the minimum
// validateOpenReceipt requires; content_hash is taken over the canonical envelope with
// content_hash nulled — identical to the server's rule (reader-receipt.js).
//
// `parentReceipt` is the inspection receipt this open run continues, and it is what turns
// inspect → steer → compare → receipt into one stated chain instead of four artifacts that
// happen to share a hash. Without it, a chip pair run over an inspected answer is
// indistinguishable from the same text pasted cold: both hash to the same open_run_id,
// because the id is taken over the answer alone. `continues` says which receipt the answer
// was read from, so the claim is written down rather than inferred.
//
// It sits INSIDE open_run deliberately. The paired and chip-paired envelopes embed open_run
// verbatim (reader-receipt.js: `open_run: openRun || null`), so a field placed here survives
// into the downstream receipt and travels with the artifact; a top-level sibling would be
// dropped at that hop and the chain would end at the open receipt.
//
// It does NOT enter the open_run_id. That id is the join key already written to the
// Reader Runs row and is owned by value, so folding a parent hash into it would change what
// existing rows join on. The reference is additive and stands beside the id.
//
// Null when there is no parent: the standing chip door, ?start=chips, and a degraded run
// that returned no receipt all open the lane over nothing. A stated null is the honest
// record that this open run continues no inspection.
//
// `enteredVia` is the other provenance fact, and it answers a different question. See
// CHIP_ENTRY_VIA in reader-paired.js for why the two cannot be folded into one: continues
// is about the RECORD this run extends, entered_via is about the ENTRY the person made.
// Both inspection doors produce a continuation, so continues alone cannot tell a reactive
// steer from a proactive one. It sits inside open_run for the same reason continues does —
// the downstream envelope embeds open_run verbatim and drops nothing else.
//
// Normalized here rather than trusted: an unrecognized value resolves to the direct
// origin, which asserts no inspection. The field is self-reported by construction (only
// the client knows which button was pressed) and rides a hash that is integrity, not
// authentication — so the guarantee is that a malformed value cannot become a stronger
// claim than the truth, never that the value is attested.
async function buildChipOpenReceipt(firstAnswer, generatedAt, parentReceipt, enteredVia) {
  const answerHex = await sha256HexClient(firstAnswer);
  const parent = parentReceipt && typeof parentReceipt === "object" ? parentReceipt : null;
  const parentRun = (parent && parent.open_run) || null;
  const parentProv = (parentRun && parentRun.provenance) || null;
  const parentHash = (parent && parent.integrity && parent.integrity.content_hash) || "";
  const receipt = {
    receipt_type: "single",
    schema_version: RECEIPT_SCHEMA_VERSION,
    generated_at: generatedAt,
    open_run: {
      question: "",
      answer: firstAnswer,
      provenance: { request_id: answerHex.slice(0, 16) },
      entered_via: normalizeChipEntryVia(enteredVia),
      continues: parentHash
        ? {
            receipt_schema_version: parent.schema_version || "",
            content_hash: parentHash,
            request_id: (parentProv && parentProv.request_id) || "",
            generated_at: parent.generated_at || "",
          }
        : null,
    },
    integrity: { content_hash: null },
  };
  receipt.integrity.content_hash = await sha256HexClient(canonicalizeForHash(receipt));
  return receipt;
}

// Chip second read. Same endpoint + failure contract as runPairedReader, plus the
// user-chip provenance the server needs to look the instruction up in the FROZEN bank:
// the server never trusts client-supplied instruction text, only chip_id +
// instruction_version. Builds the open receipt on the way out.
async function runChipPairedReader({ firstAnswer, targetedAnswer, chipId, instructionVersion, declaration, parentReceipt, enteredVia }) {
  const openReceipt = await buildChipOpenReceipt(firstAnswer, new Date().toISOString(), parentReceipt, enteredVia);
  const res = await fetch(READER_PAIRED_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      open_receipt: openReceipt,
      targeted_answer: targetedAnswer,
      initiator: PAIR_INITIATOR.USER_CHIP,
      chip_id: chipId,
      instruction_version: instructionVersion,
      declaration,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data && data.error) || `chip_paired_${res.status}`);
    err.status = res.status;
    err.info = data || {};
    throw err;
  }
  return data;
}

const RESULT_GAP_COUNT_MS = 800;
const RESULT_CHIP_STAGGER_MS = 100;
const RESULT_VERDICT_BEAT_MS = 80;
const RESULT_SHARE_DELAY_MS = 400;
const RESULT_ANSWER_SWEEP_MS = 700;
// `gap` is deliberately not destructured. The caller still spreads it in from the
// curated record, because the record keeps its archive figure; this panel no longer
// reads it for anything.
function AnchorResult({ answer, anchors, caseId, caseTitle, model, runDate, category, observedDate, candidate, submitOk, sequenceReady = true, onAnotherCase, onEmailFollow }) {
  const meta = caseMeta(caseId);
  const categoryLabel = category || meta?.category;
  const tokens = anchors.tokens;
  const reduced = useRef(prefersReducedMotion());
  const [emailFollowupDismissed, setEmailFollowupDismissed] = useState(false);
  const measureRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [litTerms, setLitTerms] = useState(() => (reduced.current ? new Set(tokens.filter((t) => t.found).map((t) => t.term)) : new Set()));
  const [sweeping, setSweeping] = useState(false);
  const [visibleChips, setVisibleChips] = useState(reduced.current ? tokens.length : 0);
  const [showVerdict, setShowVerdict] = useState(reduced.current);
  const [verdictPulse, setVerdictPulse] = useState(false);
  const [showShare, setShowShare] = useState(reduced.current);
  const [showDiscoveryLine, setShowDiscoveryLine] = useState(reduced.current && tokens.some((t) => !t.found));
  const [antennaSignal, setAntennaSignal] = useState(reduced.current && tokens.some((t) => t.isKey && t.found));
  const hasMissing = tokens.some((t) => !t.found);
  const words = countWords(answer);

  useEffect(() => {
    if (!measureRef.current) return;
    const bar = measureRef.current.closest(".wb-answer-row")?.querySelector(".wb-answer-row__bar");
    if (bar) {
      bar.style.setProperty("--sweep-travel", `${Math.max(bar.offsetHeight - 2, 40)}px`);
    }
  }, [answer, sequenceReady]);

  useEffect(() => {
    if (!sequenceReady) return undefined;
    if (reduced.current) {
      setLitTerms(new Set(tokens.filter((t) => t.found).map((t) => t.term)));
      setSweeping(false);
      setVisibleChips(tokens.length);
      setShowVerdict(true);
      setVerdictPulse(true);
      setShowShare(true);
      setShowDiscoveryLine(hasMissing);
      setAntennaSignal(tokens.some((t) => t.isKey && t.found));
      const t = setTimeout(() => setVerdictPulse(false), 50);
      return () => clearTimeout(t);
    }

    setLitTerms(new Set());
    setSweeping(false);
    setVisibleChips(0);
    setShowVerdict(false);
    setVerdictPulse(false);
    setShowShare(false);
    setShowDiscoveryLine(false);
    setAntennaSignal(false);

    const timers = [];
    const schedule = (fn, ms) => { timers.push(setTimeout(fn, ms)); };

    tokens.forEach((t, i) => {
      schedule(() => {
        setVisibleChips(i + 1);
        if (t.isKey && t.found) setAntennaSignal(true);
      }, RESULT_GAP_COUNT_MS + i * RESULT_CHIP_STAGGER_MS);
    });

    const afterRows = RESULT_GAP_COUNT_MS + tokens.length * RESULT_CHIP_STAGGER_MS;
    if (hasMissing) {
      schedule(() => setShowDiscoveryLine(true), afterRows + 50);
    }
    const verdictAt = afterRows + RESULT_VERDICT_BEAT_MS;
    schedule(() => {
      setShowVerdict(true);
      setVerdictPulse(true);
    }, verdictAt);
    schedule(() => setShowShare(true), verdictAt + RESULT_SHARE_DELAY_MS);
    schedule(() => setVerdictPulse(false), verdictAt + 720);

    const sweepStart = verdictAt + RESULT_SHARE_DELAY_MS + 120;
    schedule(() => setSweeping(true), sweepStart);
    tokens.forEach((t) => {
      if (!t.found) return;
      const idx = findTermIndex(answer, t.term);
      const at = idx >= 0 ? (idx / Math.max(answer.length, 1)) * RESULT_ANSWER_SWEEP_MS : RESULT_ANSWER_SWEEP_MS;
      schedule(() => {
        setLitTerms((prev) => new Set([...prev, t.term]));
      }, sweepStart + at);
    });
    schedule(() => setSweeping(false), sweepStart + RESULT_ANSWER_SWEEP_MS);

    return () => { timers.forEach(clearTimeout); };
  }, [tokens.length, caseId, answer, sequenceReady]);

  const innerCls = `wb-result-inner wb-output-module${verdictPulse ? " is-verdict-pulse" : ""}${reduced.current ? " is-reveal-instant" : ""}`;

  const prov = meta ? resultProvenance(meta) : null;
  const archive = meta ? archiveFact(meta) : null;

  return (
    <div className={innerCls}>
      <div className="wb-output-module__head wb-output-module__head--compact">
        {prov ? (
          <div className="wb-result-provenance">
            <p className="wb-result-provenance__case">{prov.caseLine}</p>
            {/* "verified May 2026" left a stranger to guess what was verified and by
                whom. The tier is the answer, and it is the same one the archive line
                below carries, so the panel says it once in each register. */}
            <p className="wb-result-provenance__sub">
              Measurement output
              <span className="wb-result-provenance__verified"> · human-reviewed {prov.verified}</span>
            </p>
          </div>
        ) : null}
      </div>
      <div className="wb-output-module__body">
      {/* Two heroes have stood here and both were wrong. First the archive's 0-3 figure
          on an animated gauge, which graded a visitor's fresh answer with a number
          measured from four other models months earlier. Then a badge — CLOSED GAP,
          PARTIALLY SURFACED, GAP HELD — computed live from a term match against the
          paste. The second was the first one again in words: a single categorical
          verdict, produced outside the canonical selectors, that told a first-time
          reader nothing about what was found or where.
          What sits here now is the archived case stating what it found, fixed and
          dated. It does not move when someone pastes. The visitor's own result is the
          term chips below it, which name every term and whether it turned up — and a
          person can check those by reading their own answer. */}
      <div className="wb-result-score-panel">
        <div className="wb-result-header">
          <div className="wb-result-header__primary">
            {archive ? (
              <p className="wb-result-archive">
                {archive.fact}
                <span className="wb-result-archive__tier">{archive.tier}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta">
          {categoryLabel ? <span>{categoryLabel}</span> : null}
          <span>4 frontier models tested</span>
        </div>
      </div>
      <div className="wb-result-module wb-result-module--terms">
        <Label>Looked for</Label>
        <ul className="wb-token-chips">
          {tokens.map((t, i) => {
            const visible = i < visibleChips;
            const cls = `wb-token-chip${visible ? " is-visible" : ""}${t.found ? " is-found" : " is-missing"}`;
            return (
              <li key={t.term} className={cls}>
                {!t.found ? <span className="wb-token-chip__dot" aria-hidden="true" /> : null}
                <span className="wb-token-chip__label">
                  {t.term}{t.isKey ? " (key)" : ""} · {t.found ? "found" : "missing"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="wb-result-module wb-result-module--answer">
        <div className={`wb-answer-row${expanded ? " is-expanded" : ""}`}>
          <div ref={measureRef} className="wb-answer-sweep-measure" aria-hidden="true">
            <HighlightedAnswer text={answer} terms={anchors.tokens} litTerms={litTerms} />
          </div>
          <div className={`wb-answer-row__bar wb-answer-sweep${sweeping ? " is-sweeping" : ""}`}>
            <button type="button" className="wb-answer-row__toggle wb-focus" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
              <span className="wb-answer-row__label">Your answer · {words} words</span>
              <span className={`wb-answer-row__chevron${expanded ? " is-open" : ""}`} aria-hidden="true" />
            </button>
            <div className="wb-sweep-line" aria-hidden="true" />
          </div>
          <div className={`wb-answer-row__body${expanded ? " is-open" : ""}`}>
            <HighlightedAnswer text={answer} terms={anchors.tokens} litTerms={litTerms} />
          </div>
        </div>
      </div>
      <div className="wb-result-footnote">
        {/* Was "Gap surfaced: this appeared in your answer, not the model's." — a
            sentence whose "this" and whose "the model" a first-time reader cannot
            resolve, over a check that only ever established one thing. It states that
            thing now, and points at the chips that show it. */}
        {hasMissing ? (
          <p className={`wb-result-discovery-beat${showDiscoveryLine ? " is-visible" : ""}`}>
            Some terms this case looks for did not turn up in your answer. The chips above show which.
          </p>
        ) : null}
        <p className="wb-result-footnote__caption">
          Text check only: named terms, not full-response quality.
        </p>
      </div>
      {caseId === "006" && showVerdict ? (
        <p className="wb-plate-note">
          This case measures attribution. Detection here checks whether the named US diplomats appear at all.
        </p>
      ) : null}
      </div>
      <div className={`wb-output-module__footer wb-reveal-rise wb-result-share${showShare ? " is-visible" : ""}`}>
        <ShareResult caseId={caseId} caseTitle={caseTitle} model={model} anchors={anchors} runDate={runDate} />
        <RepositoryActions candidate={candidate} submitOk={submitOk} />
      </div>
      {showShare && !emailFollowupDismissed && !readStoredWorkbenchEmail() ? (
        <ResultEmailFollowup
          onFollow={(addr) => {
            persistWorkbenchEmail(addr);
            setEmailFollowupDismissed(true);
            if (onEmailFollow) onEmailFollow(addr);
          }}
          onSkip={() => setEmailFollowupDismissed(true)}
        />
      ) : null}
      {onAnotherCase ? (
        <div className="wb-result-actions">
          <button type="button" className="wb-another-case wb-focus" onClick={onAnotherCase}>Test another case ↺</button>
        </div>
      ) : null}
    </div>
  );
}

function Curated() {
  const [sel, setSel] = useState(MEASURED_CURATED[0]);
  const [step, setStep] = useState(0); // 0 observe+copy, 1 paste, 2 result
  const [email, setEmail] = useState(() => readStoredWorkbenchEmail());
  const [model, setModel] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [copied, setCopied] = useState(false);
  const [pasteError, setPasteError] = useState("");
  const [sequenceReady, setSequenceReady] = useState(false);
  const [plateFade, setPlateFade] = useState("idle");
  const plateRef = useRef(null);
  const stepAnchorRef = useRef(null);
  const stepScrollReady = useRef(false);

  useEffect(() => {
    if (!stepScrollReady.current) {
      stepScrollReady.current = true;
      syncWorkbenchHeaderOffset();
      return undefined;
    }
    if (step === 2) return undefined;
    const el = step === 1 ? plateRef.current : stepAnchorRef.current;
    const id = window.requestAnimationFrame(() => scrollWorkbenchAnchor(el));
    return () => window.cancelAnimationFrame(id);
  }, [step]);

  const resetRun = () => {
    setStep(0);
    setModel("");
    setAnswer("");
    setResult(null);
    setCandidate(null);
    setPasteError("");
    setSequenceReady(false);
    setBusy(false);
  };

  const pick = (c) => {
    if (!c.ready || c.id === sel.id) return;
    const reduced = prefersReducedMotion();
    const apply = () => {
      setSel(c);
      resetRun();
      setPlateFade("in");
      window.setTimeout(() => setPlateFade("idle"), reduced ? 0 : 200);
    };
    if (reduced) {
      apply();
      return;
    }
    setPlateFade("out");
    window.setTimeout(apply, 200);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(sel.openPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const scrollPlateThenReveal = () => {
    scrollWorkbenchAnchor(plateRef.current, () => setSequenceReady(true));
  };

  const check = async () => {
    const err = validateCuratedPaste(answer, sel);
    if (err) { setPasteError(err); return; }
    setPasteError("");
    setBusy(true);
    setSequenceReady(false);
    const anchors = detectAnchors(answer, sel.detect, sel.keyDetect);
    const gapHeld = anchors.verdict !== "key_found";
    const runDate = new Date().toISOString().slice(0, 10);
    const res = { answer, anchors, caseId: sel.id, caseTitle: sel.title, model, runDate, gap: sel.gap, category: sel.category, observedDate: sel.observedDate };
    const cand = buildCandidate({
      mode: "curated",
      case_id: sel.id,
      model,
      email,
      open_prompt: sel.openPrompt,
      // The candidate field keeps its name; the record's is `anchor`, and for a measured
      // case it holds that case's `mechanism` verbatim. Same value written, same column.
      mechanism: sel.anchor,
      open_answer: answer,
      gap_held: gapHeld,
      detect_verdict: anchors.verdict,
    });
    const submitResult = await submitCandidate(cand);
    setResult({ ...res, submitOk: submitResult.ok });
    setCandidate(cand);
    setBusy(false);
    setStep(2);
    window.requestAnimationFrame(scrollPlateThenReveal);
  };

  const plateCls = [
    "wb-specimen-plate",
    "wb-run-plate",
    "wb-measure-channel",
    "wb-scroll-anchor",
    step === 2 ? "is-result" : "",
    plateFade === "out" ? "is-crossfade-out" : "",
    plateFade === "in" ? "is-crossfade-in" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className="wb-console">
      <div className="wb-console__main">
      <div ref={stepAnchorRef} className="wb-scroll-anchor" />
      <p className="wb-plate-note">Curated cases are drawn from the archive. Public case pages are published separately.</p>
      <div className="wb-case-selector">
        {MEASURED_CURATED.map((c) => {
          const active = c.id === sel.id;
          return (
            <button key={c.id} type="button" className={`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${active ? " is-active" : ""}${!c.ready ? " is-disabled" : ""}`} onClick={() => pick(c)} disabled={!c.ready}>
              {c.ready ? (
                <div className="wb-specimen-plate__label">{c.metaLabel}</div>
              ) : (
                <Label>To add</Label>
              )}
              <div className="wb-case-card__title">{c.title}</div>
            </button>
          );
        })}
      </div>

      {!sel.ready ? (
        <div className="wb-plate-note wb-plate-note--dashed">{sel.note}</div>
      ) : (
        <div className="wb-console__measure">
          <div className="wb-console__measure-main">
            <div ref={plateRef} className={plateCls}>
              {step === 2 && result ? (
                <AnchorResult
                  {...result}
                  candidate={candidate}
                  sequenceReady={sequenceReady}
                  onAnotherCase={resetRun}
                  onEmailFollow={(addr) => {
                    setEmail(addr);
                    const updated = { ...candidate, email: addr };
                    setCandidate(updated);
                    submitCandidate(updated);
                  }}
                />
              ) : step === 1 ? (
                <div className="wb-flow-module wb-flow-module--input">
                  <FlowCaseProvenance c={sel} />
                  <div className="wb-input-bay">
                    <Field label="Which AI did you ask?"><ModelSelect value={model} onChange={setModel} /></Field>
                  </div>
                  <div className="wb-input-bay">
                    <PasteField
                      label="Paste the model's open answer"
                      value={answer}
                      onChange={(v) => { setAnswer(v); setPasteError(""); }}
                      error={pasteError}
                      placeholder="Paste the full response here…"
                      minAckLength={20}
                    />
                  </div>
                  {pasteError ? (
                    <div className="wb-field-error">{pasteError}</div>
                  ) : null}
                  <div className="wb-action-row">
                    <Btn kind="primary" disabled={busy || !model || answer.trim().length < 200} onClick={check}>Compare with what Imbas observed →</Btn>
                  </div>
                  {!busy && !pasteError && answer.trim().length > 0 && answer.trim().length < 200 ? (
                    <p className="wb-plate-hint">Paste the full answer — we need enough text to check reliably (200 characters minimum).</p>
                  ) : null}
                </div>
              ) : (
                <div className="wb-flow-module wb-flow-module--readout">
                <div className="wb-readout">
                  <div className="wb-readout__specimen">
                    <FlowCaseProvenance c={sel} />
                  </div>
                  <div className="wb-readout__rule" aria-hidden="true" />
                  <div className="wb-readout__section">
                    <Label>What Imbas measured</Label>
                    <div className="wb-active-case__headline">{sel.short}</div>
                  </div>
                  <div className="wb-readout__signal">
                    <p className="wb-active-case__probe">Will your model surface it?</p>
                  </div>
                  <div className="wb-readout__run-strip">
                    <span>{sel.category}</span>
                    <span>4 frontier models tested</span>
                    <span>observed {sel.observedDate}</span>
                  </div>
                  <div className="wb-readout__rule" aria-hidden="true" />
                  <p className="wb-plate-support wb-readout__notes">{sel.whyItMatters}</p>
                </div>
                </div>
              )}
            </div>

            {step === 0 && (
              <div className="wb-confirm-block wb-flow-module">
                <Label>Confirm it yourself</Label>
                <div className="wb-input-bay">
                  <span className="wb-input-bay__tag">Open prompt</span>
                  <PromptCard text={sel.openPrompt} />
                </div>
                <div className="wb-action-row">
                  <Btn kind="ghost" small onClick={copyPrompt} className={copied ? "is-copied" : ""}>{copied ? "Copied ✓" : "Copy question"}</Btn>
                  <Btn kind="primary" onClick={() => setStep(1)}>Ran it — paste the answer →</Btn>
                </div>
                <AutomationNote />
                <HygieneNote />
                <p className="wb-plate-hint">Models change, so your run may differ — a closed gap is a result too.</p>
              </div>
            )}

            <SuggestInvestigation />

          </div>
        </div>
      )}
      </div>
    </div>
  );
}

const suggestInputStyle = { ...inputStyle, padding: "11px 13px 10px", fontSize: 15, minHeight: 40, resize: "none" };
const suggestTextareaStyle = { ...suggestInputStyle, minHeight: "unset", resize: "vertical" };

// ---- SUGGEST AN INVESTIGATION (secondary submission channel; no scoring) ----
function SuggestInvestigation({ variant = "default" }) {
  const [expanded, setExpanded] = useState(false);
  const [step, setStep] = useState("form");
  const [topic, setTopic] = useState("");
  const [inspect, setInspect] = useState("");
  const [context, setContext] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(null);

  const topicOk = topic.trim().length >= 4;
  const inspectOk = inspect.trim().length >= 8;
  const canSubmit = topicOk && inspectOk && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitFailed(null);
    const payload = buildInvestigationSuggestion({
      topic: topic.trim(),
      inspect_question: inspect.trim(),
      context: context.trim() || null,
      email: email.trim() || null,
      source: "workbench_suggest",
    });
    const res = await submitCandidate(payload);
    setSubmitting(false);
    if (res.ok) setStep("done");
    else setSubmitFailed(payload);
  }

  if (step === "done") {
    return (
      <section id="wb-suggest-module" className="wb-suggest-module is-done" aria-labelledby="wb-suggest-heading">
        <div className="wb-flow-module wb-flow-module--suggest">
          <div className="wb-status-readout">
            <p className="wb-status-readout__title">Thank you.</p>
            <p className="wb-status-readout__body">Your submission has been recorded for review.</p>
            <p className="wb-plate-hint">Selected investigations may become future Imbas cases after human review.</p>
          </div>
        </div>
      </section>
    );
  }

  if (!expanded) {
    if (variant === "reader-secondary") {
      return (
        <section id="wb-suggest-module" className="wb-suggest-module is-collapsed is-reader-secondary" aria-labelledby="wb-suggest-heading">
          <div className="wb-flow-module wb-flow-module--suggest">
            <h2 id="wb-suggest-heading" className="wb-suggest-module__heading">Suggest an Investigation</h2>
            <p className="wb-suggest-module__lead">Have a case we should inspect? Send it.</p>
            <div className="wb-action-row wb-suggest-cta-row">
              <Btn kind="ghost" small onClick={() => setExpanded(true)}>Suggest</Btn>
            </div>
          </div>
        </section>
      );
    }
    return (
      <section id="wb-suggest-module" className="wb-suggest-module is-collapsed" aria-labelledby="wb-suggest-heading">
        <div className="wb-flow-module wb-flow-module--suggest">
          <p className="wb-suggest-module__eyebrow">Field contribution</p>
          <h2 id="wb-suggest-heading" className="wb-suggest-module__heading">Suggest an Investigation</h2>
          <p className="wb-suggest-module__lead">Help expand the archive.</p>
          <p className="wb-suggest-module__support">Submit a topic, claim, or behavior pattern that may deserve inspection.</p>
          <div className="wb-action-row wb-suggest-cta-row">
            <Btn kind="primary" onClick={() => setExpanded(true)}>Suggest an investigation →</Btn>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="wb-suggest-module" className="wb-suggest-module is-expanded" aria-labelledby="wb-suggest-heading">
      <div className="wb-flow-module wb-flow-module--input wb-flow-module--suggest">
        <p className="wb-suggest-module__eyebrow">Field contribution</p>
        <h2 id="wb-suggest-heading" className="wb-suggest-module__heading">Suggest an Investigation</h2>
        <p className="wb-suggest-module__lead">Help expand the archive.</p>
        <p className="wb-suggest-module__support">Submit a topic, claim, or behavior pattern that may deserve inspection.</p>
        <p className="wb-plate-hint">Selected submissions may become future Imbas records after review.</p>

        <div className="wb-input-bay">
          <Field label="Topic or Question">
            <input
              className={INPUT_CLS}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Model claims about historical events"
              autoComplete="off"
              style={suggestInputStyle}
            />
          </Field>
        </div>

        <div className="wb-input-bay">
          <Field label="What should be inspected?">
            <textarea
              className={INPUT_CLS}
              value={inspect}
              onChange={(e) => setInspect(e.target.value)}
              placeholder="Describe the claim, behavior, or pattern Imbas should examine"
              rows={3}
              style={suggestTextareaStyle}
            />
          </Field>
        </div>

        <div className="wb-input-bay">
          <Field label="Optional context, source, or link">
            <textarea
              className={INPUT_CLS}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="URL, excerpt, or background (optional)"
              rows={2}
              style={suggestTextareaStyle}
            />
          </Field>
        </div>

        <div className="wb-input-bay">
          <Field label="Optional email for follow-up">
            <input
              className={INPUT_CLS}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com (optional)"
              autoComplete="email"
              style={suggestInputStyle}
            />
          </Field>
        </div>

        {submitFailed ? <SubmitFailure candidate={submitFailed} /> : null}

        <div className="wb-action-row">
          <Btn kind="primary" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Submitting…" : "Submit Investigation"}
          </Btn>
        </div>
      </div>
    </section>
  );
}

// ---- READER V2 (feature-flagged) ----
const READER_SIGIL_COPY = {
  idle: { primary: "Paste an answer to run The Reader.", secondary: "" },
  ready: { primary: "The Reader is ready.", secondary: "" },
  inspecting: { primary: "Reader inspecting…", secondary: "" },
  result: { primary: "Reader complete.", secondary: "" },
};

const READER_STATUS_COPY = {
  idle: "Paste an answer to inspect it.",
  needQuestion: "Add the question you asked.",
  ready: "Let's see what might be missing…",
  inspecting: "Reading the answer…",
  result: "Inspection complete.",
  // A run that ended in a fallback used to land on "result" and say "Inspection
  // complete." over a banner explaining that the Reader was unavailable. Two lines,
  // one screen, opposite claims — and the status line is the one a person glances at.
  // The fallback surface already carries the reason; this only has to stop asserting
  // an inspection that never happened. `is-degraded` matches no rule in workbench.css,
  // so the dot and the text render in the neutral base treatment rather than borrowing
  // the completed-run colour, which is the honest look for it.
  degraded: "The Reader didn't run.",
};

// The status line while the request is open. It narrates the instrument, never the
// result: at the moment any of these renders, the response has not arrived and
// nothing has been found. The third line used to announce a discovery anyway, before
// any response existed — and it is the line a slow request leaves on screen longest,
// so it was also the one most people read. It is not reproduced here: a ratchet reads
// this file, and a banned string in a comment explaining the ban still reads as the
// string coming back.
//
// What stands there now tells the person why they are still waiting, which is the
// only thing the product actually knows at that moment. The list advances twice and
// holds on the last line, so a wait of any length ends in the same words; no spinner
// art, existing tokens.
const READER_INSPECTING_NARRATION = [
  "Reading the answer…",
  "Checking what might be missing…",
  "Still reading. Long answers take longer.",
];

// The badge over a single-answer read, and the line under it. Both used to grade the
// answer: FULL meant "the answer substantially served the question", THIN meant "the
// answer was evasive or substantially incomplete". Neither is a thing this run can
// establish. One inspector pass over one answer produces flags, not a verdict on
// whether an answer served anyone — and "evasive" attributes conduct to a model,
// which the standing register forbids outright.
//
// What ships instead reports the flags. The badge says whether anything came up; the
// line says what came up, in the three ruled signal names. The evasiveness reading
// ships as Deflection, which is the observation the class exists to carry: the answer
// went around the question rather than at it.
//
// The keys stay full / partial / thin because they key the CSS and the inspector's
// own field. They are not shown; the labels below are.
const READER_COMPLETENESS_LABEL = {
  full: "NOTHING FLAGGED",
  partial: "SOMETHING TO CHECK",
  thin: "DEFLECTION FLAGGED",
};
const READER_COMPLETENESS_GLOSS = {
  full: "This inspection surfaced no omission candidates.",
  partial: "This inspection surfaced candidates. They are listed below.",
  thin: "This inspection surfaced a Deflection signal: the answer went around the question rather than at it.",
};

/** V2F — text-only status; V2G — instrument readout with ember dot */
function ReaderStatusLine({ state }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (state !== "inspecting") {
      setStep(0);
      return undefined;
    }
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, READER_INSPECTING_NARRATION.length - 1));
    }, 1100);
    return () => window.clearInterval(id);
  }, [state]);
  const text =
    state === "inspecting"
      ? READER_INSPECTING_NARRATION[step]
      : READER_STATUS_COPY[state] || READER_STATUS_COPY.idle;
  return (
    <div className={`wb-reader-v2__status-wrap is-${state}`} role="status" aria-live="polite">
      <span className="wb-reader-v2__status-dot" aria-hidden="true" />
      <p className={`wb-reader-v2__status is-${state}`}>{text}</p>
    </div>
  );
}

/* Preserved device/sigil components — not rendered in V2F stacked Reader form */
function MantisSigilSvg() {
  return (
    <svg
      className="wb-reader-sigil__glyph"
      viewBox="0 0 220 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="wb-sigil-lens-glow" cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor="rgba(255, 238, 210, 0.92)" />
          <stop offset="38%" stopColor="rgba(222, 111, 56, 0.52)" />
          <stop offset="100%" stopColor="rgba(12, 8, 6, 0)" />
        </radialGradient>
        <radialGradient id="wb-sigil-tip-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255, 220, 160, 0.98)" />
          <stop offset="42%" stopColor="rgba(222, 111, 56, 0.78)" />
          <stop offset="100%" stopColor="rgba(222, 111, 56, 0)" />
        </radialGradient>
      </defs>

      <g className="wb-reader-sigil__tips">
        <circle className="wb-reader-sigil__tip-halo wb-reader-sigil__tip-halo--l" cx="8" cy="6" r="12" />
        <circle className="wb-reader-sigil__tip-node wb-reader-sigil__tip-node--l" cx="8" cy="6" r="4.2" />
        <circle className="wb-reader-sigil__tip-halo wb-reader-sigil__tip-halo--r" cx="212" cy="6" r="12" />
        <circle className="wb-reader-sigil__tip-node wb-reader-sigil__tip-node--r" cx="212" cy="6" r="4.2" />
        <circle className="wb-reader-sigil__tip-spark wb-reader-sigil__tip-spark--l" cx="4" cy="2" r="1.2" />
        <circle className="wb-reader-sigil__tip-spark wb-reader-sigil__tip-spark--r" cx="216" cy="2" r="1.2" />
      </g>

      <path className="wb-reader-sigil__stroke wb-reader-sigil__antenna" d="M 102 66 C 78 42 42 20 8 6" />
      <path className="wb-reader-sigil__stroke wb-reader-sigil__antenna" d="M 118 66 C 142 42 178 20 212 6" />

      <circle className="wb-reader-sigil__stroke wb-reader-sigil__joint" cx="100" cy="62" r="2" />
      <circle className="wb-reader-sigil__stroke wb-reader-sigil__joint" cx="120" cy="62" r="2" />

      <path className="wb-reader-sigil__stroke" d="M 110 74 L 118 76 L 172 94 L 180 116 L 166 176 L 110 232 L 54 176 L 40 116 L 48 94 Z" />
      <path className="wb-reader-sigil__stroke" d="M 110 74 L 110 232" />
      <path className="wb-reader-sigil__stroke" d="M 88 98 L 132 98" />
      <path className="wb-reader-sigil__stroke" d="M 110 88 L 116 104 L 110 120 L 104 104 Z" />
      <path className="wb-reader-sigil__stroke" d="M 110 120 L 114 140 L 110 158 L 106 140 Z" />
      <path className="wb-reader-sigil__stroke" d="M 110 158 L 112 178 L 110 198 L 108 178 Z" />

      <g className="wb-reader-sigil__lens wb-reader-sigil__lens--l" transform="rotate(-18 54 118)">
        <ellipse className="wb-reader-sigil__lens-glow" cx="54" cy="118" rx="12" ry="27" />
        <ellipse className="wb-reader-sigil__lens-lid" cx="54" cy="118" rx="12" ry="27" />
        <ellipse className="wb-reader-sigil__lens-ring" cx="54" cy="118" rx="12" ry="27" />
        <path className="wb-reader-sigil__lens-glint" d="M 44 108 Q 54 102 64 108" />
      </g>

      <g className="wb-reader-sigil__lens wb-reader-sigil__lens--r" transform="rotate(18 166 118)">
        <ellipse className="wb-reader-sigil__lens-glow" cx="166" cy="118" rx="12" ry="27" />
        <ellipse className="wb-reader-sigil__lens-lid" cx="166" cy="118" rx="12" ry="27" />
        <ellipse className="wb-reader-sigil__lens-ring" cx="166" cy="118" rx="12" ry="27" />
        <path className="wb-reader-sigil__lens-glint" d="M 156 108 Q 166 102 176 108" />
      </g>
    </svg>
  );
}

function ReaderDiagnostic({ state, completeness, isFallback }) {
  const reduced = prefersReducedMotion();
  const comp = completeness || "partial";
  const cls = [
    "wb-reader-diagnostic",
    `is-${state}`,
    state === "result" && !isFallback ? `is-${comp}` : "",
    isFallback ? "is-fallback" : "",
    reduced ? "is-reduced" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} aria-hidden="true">
      <div className="wb-reader-diagnostic__scan-sweep" />
      <div className="wb-reader-diagnostic__scanline" />
      <div className="wb-reader-diagnostic__halo-ticks">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span key={i} className="wb-reader-diagnostic__halo-tick" style={{ "--ti": `${i * 0.18}s` }} />
        ))}
      </div>
      <div className="wb-reader-diagnostic__channels">
        {["SURFACE", "OMIT", "SHAPE"].map((label, i) => (
          <div key={label} className={`wb-reader-diagnostic__channel is-${label.toLowerCase()}`}>
            <span className="wb-reader-diagnostic__label">{label}</span>
            <span className="wb-reader-diagnostic__bar">
              <span className="wb-reader-diagnostic__bar-fill" style={{ "--ci": i }} />
            </span>
          </div>
        ))}
      </div>
      <svg className="wb-reader-diagnostic__needle" viewBox="0 0 120 34" aria-hidden="true">
        <path d="M 14 28 A 46 46 0 0 1 106 28" fill="none" stroke="rgba(242, 232, 220, 0.14)" strokeWidth="1.1" />
        {[0, 1, 2, 3].map((t) => {
          const deg = 180 - t * 60;
          const rad = (deg * Math.PI) / 180;
          const cx = 60;
          const cy = 28;
          const r = 44;
          const x1 = cx + (r - 6) * Math.cos(rad);
          const y1 = cy - (r - 6) * Math.sin(rad);
          const x2 = cx + (r + 2) * Math.cos(rad);
          const y2 = cy - (r + 2) * Math.sin(rad);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(242, 232, 220, 0.22)" strokeWidth="1" />;
        })}
        <line className="wb-reader-diagnostic__needle-arm" x1="60" y1="28" x2="60" y2="6" stroke="rgba(222, 111, 56, 0.85)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="60" cy="28" r="2.4" fill="rgba(242, 232, 220, 0.75)" />
      </svg>
    </div>
  );
}

function ReaderSigil({ state, completeness }) {
  const reduced = prefersReducedMotion();
  const comp = completeness || "partial";
  const copy = READER_SIGIL_COPY[state] || READER_SIGIL_COPY.idle;
  const cls = [
    "wb-reader-sigil",
    `is-${state}`,
    state === "result" ? `is-${comp}` : "",
    reduced ? "is-reduced" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} aria-live={state === "inspecting" ? "polite" : "off"}>
      <div className="wb-reader-sigil__frame">
        <div className="wb-reader-sigil__halo-disc" aria-hidden="true" />
        <div className="wb-reader-sigil__occult-ring" aria-hidden="true" />
        <div className="wb-reader-sigil__float">
          <MantisSigilSvg />
        </div>
        <div className="wb-reader-sigil__reflection" aria-hidden="true" />
      </div>
      {copy.primary ? <p className="wb-reader-sigil__status">{copy.primary}</p> : null}
      {copy.secondary ? <p className="wb-reader-sigil__sub">{copy.secondary}</p> : null}
    </div>
  );
}

function ReaderDevice({ state, completeness, isFallback }) {
  const reduced = prefersReducedMotion();
  const comp = completeness || "partial";
  const cls = [
    "wb-reader-device",
    "wb-reader-chamber",
    `is-${state}`,
    state === "result" && !isFallback ? `is-${comp}` : "",
    isFallback ? "is-fallback" : "",
    reduced ? "is-reduced" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} aria-label="The Reader device">
      <div className="wb-reader-chamber__veil" aria-hidden="true" />
      <div className="wb-reader-chamber__outer-aura" aria-hidden="true" />
      <div className="wb-reader-chamber__occult-halo" aria-hidden="true" />
      <div className="wb-reader-chamber__glow wb-reader-chamber__glow--violet" aria-hidden="true" />
      <div className="wb-reader-chamber__glow wb-reader-chamber__glow--amber" aria-hidden="true" />
      <div className="wb-reader-chamber__scanlines" aria-hidden="true" />
      <div className="wb-reader-chamber__radial-sweep" aria-hidden="true" />
      <div className="wb-reader-chamber__embers" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="wb-reader-chamber__ember"
            style={{
              "--ex": `${8 + (i * 7.3) % 84}%`,
              "--ey": `${72 + (i % 5) * 4}%`,
              "--ed": `${(i * 0.42).toFixed(2)}s`,
            }}
          />
        ))}
      </div>
      <span className="wb-reader-chamber__corner wb-reader-chamber__corner--tl" aria-hidden="true" />
      <span className="wb-reader-chamber__corner wb-reader-chamber__corner--tr" aria-hidden="true" />
      <span className="wb-reader-chamber__corner wb-reader-chamber__corner--bl" aria-hidden="true" />
      <span className="wb-reader-chamber__corner wb-reader-chamber__corner--br" aria-hidden="true" />
      <div className="wb-reader-chamber__frame">
        <ReaderSigil state={state} completeness={completeness} />
        <ReaderDiagnostic state={state} completeness={completeness} isFallback={isFallback} />
      </div>
      <div className="wb-reader-chamber__floor" aria-hidden="true" />
    </div>
  );
}

function readerFallbackReasonCode(result) {
  if (result?.reason) return String(result.reason).replace(/^read_/, "");
  const read = result?.the_read || "";
  const match = read.match(/\(([a-z_]+)\)/i);
  return match ? match[1] : "";
}

function readerFallbackDisplayMessage(result) {
  const code = readerFallbackReasonCode(result).toLowerCase();
  // Capacity family (ceiling / timeout / provider-unavailable / rate-limited): show the
  // one founder-approved capacity sentence verbatim so the three modes speak with one
  // voice. The follow-up instruction stays available below via the always-on chips.
  if (isCapacityFallbackReason(code)) return ACT2_CAPACITY_COPY;
  // Configuration or parse states are not capacity — keep the neutral line.
  if (["no_key", "disabled", "bad_json"].includes(code)) {
    return "Reader temporarily unavailable — showing fallback check.";
  }
  return "Reader unavailable — showing fallback check.";
}

function readerFallbackReadBody() {
  return "The full Reader is unavailable. Your question and answer are preserved above — this is not a full inspection.";
}

function readerResultProvenanceLabel({ mode, sel, result }) {
  if (result?.source === "fallback") return "Fallback check";
  if (result?.source !== "agent") return "Reader";
  // The record names itself. Composing "Case ${sel.id}" here printed "Case
  // montana-employment" the moment the rotation held something that is not a case.
  if (mode === "guided" && sel?.recordName) return `Reader agent · ${sel.recordName}`;
  return "Reader agent · Custom answer";
}

// Item 3, R22. One string per empty condition, read by the surface that renders it and
// by the artifact that travels off it. These lived as literals in two components and a
// clipboard formatter, which is how the page came to say "The Reader flagged nothing
// missing under the tested conditions" while the card a person pasted said "(none
// identified)" — the same result, named twice, and the second naming reads as a clean
// bill the first one refuses to give.
const MEASURE_EMPTY_LINE = "No candidate finding surfaced under the tested conditions.";
const READER_NO_MISSING_LINE = "The Reader flagged nothing missing under the tested conditions.";
const READER_NO_SHAPING_LINE = "The Reader recorded no shaping under the tested conditions.";

function formatReaderResultCopy(result) {
  // A fallback is not an inspection, and this branch comes first so nothing below it
  // can reach for a reading that was never taken. The card is the copy that travels:
  // pasted into a document, a signal name over a failed request is a finding Imbas
  // never made, with nothing around it to say so. It used to be exactly that — the
  // flag lookup below ran over the fallback's `completeness` key, which the client set
  // to drive the muted styling rather than because anything was observed. The key is
  // `display_treatment` now and no lookup here reads it.
  if (result?.source === "fallback") {
    return [
      "This inspection did not run.",
      readerFallbackDisplayMessage(result),
      "",
      readerFallbackReadBody(),
    ].join("\n").trim();
  }
  const compKey = result?.completeness || "partial";
  // The card carries the same words the badge shows, not the raw key. Printing
  // "Completeness: FULL" here would put back the all-clear the badge just stopped
  // making, in the one artifact a person pastes somewhere else.
  const comp = READER_COMPLETENESS_LABEL[compKey] || READER_COMPLETENESS_LABEL.partial;
  const gloss = READER_COMPLETENESS_GLOSS[compKey] || READER_COMPLETENESS_GLOSS.partial;
  const leftOut = Array.isArray(result?.what_was_left_out) ? result.what_was_left_out.filter(Boolean) : [];
  const shaped = (result?.how_it_was_shaped || "").trim();
  const inspectionNote = (result?.inspection_note || "").trim();
  // Item 3, R22 — PARTIAL, and the residual is named rather than left implied. This
  // artifact used to travel with the three narrative sections and nothing else, so the
  // copy a person pasted into a document was an account of an inspection that never
  // carried the inspection's own statement of what it found. The finding's materiality
  // line is that statement. It leads here for the same reason it leads on the page, and
  // the narrative follows rather than stands in for it. The section names and the
  // empty-condition lines are the page's own, single-sourced above, because a card that
  // named the same result in different words would be a second account of it.
  //
  // What this does NOT reach: the_read, what_was_left_out and how_it_was_shaped are
  // written by the model, against the system prompt in api/read.js. The renderer places
  // them and cannot police their wording, so any one of them may still independently
  // restate a finding in full and R22 would not catch it here. That residual is open,
  // it is a founder call because closing it means editing the system prompt, and no
  // pass should read the roles above as evidence that it is closed.
  const record = selectSubset(result?.result, "surfaced_findings").map(describeFinding);
  const recordLines = record.length
    ? record.map((f) => {
        const why = (f.materiality || "").trim();
        return why ? `- ${f.class_display}: ${why}` : `- ${f.class_display}`;
      })
    : [`- ${MEASURE_EMPTY_LINE}`];
  const lines = [
    `This inspection: ${comp}`,
    gloss,
    "",
    "WHAT THE READER RECORDED",
    ...recordLines,
    "",
    "THE READ",
    result?.the_read || "",
    "",
    "WHAT MAY BE MISSING",
    ...(leftOut.length ? leftOut.map((item) => `- ${item}`) : [`- ${READER_NO_MISSING_LINE}`]),
    "",
    "HOW IT WAS SHAPED",
    shaped || READER_NO_SHAPING_LINE,
  ];
  if (inspectionNote) {
    lines.push("", "INSPECTION NOTE", inspectionNote);
  }
  return lines.join("\n").trim();
}

function formatReaderFullRecord({ mode, sel, question, answer, model, topic, result }) {
  const q = mode === "guided" ? sel?.openPrompt : question;
  const topicLine = (topic || "").trim() || (mode === "guided" ? (sel?.topic || "").trim() : "");
  const lines = [];
  if (result?.source === "agent") {
    lines.push("Inspection receipt", readerResultProvenanceLabel({ mode, sel, result }), "");
  }
  lines.push(`Question: ${(q || "").trim()}`);
  if (topicLine) lines.push(`Topic / context: ${topicLine}`);
  if ((model || "").trim()) lines.push(`AI used: ${model.trim()}`);
  lines.push("", "Answer", (answer || "").trim());
  if (result) {
    lines.push("", formatReaderResultCopy(result));
  }
  lines.push("", "Behavior, not intent.");
  return lines.join("\n").trim();
}

// Final line appended to copied records. Uses the live share link when one exists for
// the run, otherwise the bare domain.
const readerCreditLine = (shareUrl) =>
  `Inspected with the Imbas Reader · ${shareUrl && shareUrl.trim() ? shareUrl.trim() : "imbaslabs.com"}`;

// Reader v2 R1 (item 10) — the Inspection Card. A short, human-readable summary of ONE
// Confirmation Loop run, STATE-AWARE: the headline and the panel order follow the state
// the person landed on (or corrected to), mirroring the on-screen reveal (not_clear_yet
// swaps the two panels). This is a shareable paste artifact, not the audit receipt —
// behavioral verbs only (the state copy already says "carried / didn't surface", never
// measured/proven), the boundary sentence verbatim, and the run's truth
// small-print in [brackets]. Pure string builder, mirroring formatReaderResultCopy.
//
// It takes the ALREADY-RESOLVED copy object, never a bare state: this artifact leaves
// the page without the unmatched badge or warning attached, so it is the one surface
// where an ungated construct tag travels with nothing to qualify it. Resolving here
// would be a second read of conditions_matched and the two could drift apart again.
function formatInspectionCard({ copy, firstText, secondText, smallPrint }) {
  const c = copy || {};
  const first = { label: LOOP_PANEL_FIRST_LABEL, text: (firstText || "").trim() };
  const second = { label: LOOP_PANEL_SECOND_LABEL, text: (secondText || "").trim() };
  const ordered = c.swapPanels ? [second, first] : [first, second];
  const lines = ["IMBAS READER — Confirmation Loop", ""];
  if (c.headline) lines.push(c.headline, "");
  for (const p of ordered) lines.push(`${p.label}:`, p.text || LOOP_DIDNT_COME_UP, "");
  if (c.tag) lines.push(c.tag, "");
  if ((smallPrint || "").trim()) lines.push(`[${smallPrint.trim()}]`, "");
  lines.push(RECEIPT_BOUNDARY, "", readerCreditLine());
  return lines.join("\n").trim();
}

// Pre-publish consent disclosure (design §D, claims-checked). Shown in a modal before
// a share is minted, so nothing is published until the person has seen exactly what
// the page will carry. This is a disclosure, so it has to track the page: the share
// used to publish a figure, both lines named that figure, and after 2B-C neither the
// page nor these lines carries one. What each line promises is now the findings
// themselves and the excerpt each one points to.
//
// The share page became a dated record in 2B-C, so these lines name the two facts that
// dates it. The single line names the AI system and the paired line does not, and that
// asymmetry is real rather than an oversight: a paired capture records no system name,
// so promising one here would disclose something the page cannot show.
const READER_SHARE_CONSENT = {
  single: {
    title: "Share this inspection",
    lines: [
      "This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.",
      "The page will show: your question · the date this answer was captured and the AI system you named · the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to · the boundary line (“Reader inspections are discovery, not evidence…”).",
      "It will not show your full answer — only the short excerpts above.",
    ],
  },
  paired: {
    title: "Share this two-question test",
    lines: [
      "This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.",
      "The page will show: your question · the date this test was captured · what the second answer surfaced that the first did not, each with the short quoted excerpts from both answers · the boundary line (“Reader inspections are discovery, not evidence…”).",
      "It will not show either full answer — only the short excerpts above.",
    ],
  },
};

function shareFailureMessage(status, data) {
  const err = data?.error;
  if (status === 429) {
    return err === "daily_capacity"
      ? "The Reader is at capacity for new shares today. Copy the full receipt for now."
      : "You've created several share links in a row. Please wait a moment and try again.";
  }
  if (status === 503 || status === 500 || err === "unconfigured") {
    return "Share links are not live yet. Copy the full receipt for now.";
  }
  return "Could not create share link. Copy the full receipt for now.";
}

// Pre-publish consent modal (design §D). Renders the mode-aware disclosure and the
// [Create share link] [Cancel] pair. Backdrop click, Escape, and Cancel all dismiss
// without publishing (all disabled while a create is in flight). Focus moves into the
// panel on open; ReaderShareAction restores focus to the trigger on close.
function ShareConsentDialog({ mode, busy, error, onConfirm, onCancel }) {
  const copy = READER_SHARE_CONSENT[mode] || READER_SHARE_CONSENT.single;
  const panelRef = useRef(null);
  const titleId = `wb-share-consent-title--${mode}`;
  const descId = `wb-share-consent-desc--${mode}`;
  const descIds = copy.lines.map((_, i) => `${descId}-${i}`).join(" ");

  useEffect(() => {
    if (panelRef.current) panelRef.current.focus();
  }, []);
  // Escape dismisses (unless a create is in flight); Tab is trapped inside the panel so
  // keyboard focus can never land on the page behind this aria-modal dialog. Focus is
  // restored to the trigger by ReaderShareAction.closeConsent when the dialog unmounts.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (!busy) onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.prototype.slice.call(
        panel.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
      );
      // While busy both buttons are disabled → nothing is tabbable; park focus on the panel.
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = panel.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first || active === panel) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last || active === panel) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="wb-share-consent" role="presentation" onClick={busy ? undefined : onCancel}>
      <div
        ref={panelRef}
        tabIndex={-1}
        className="wb-share-consent__panel wb-focus"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descIds}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="wb-share-consent__title">{copy.title}</h3>
        {copy.lines.map((line, i) => (
          <p key={i} id={`${descId}-${i}`} className="wb-share-consent__line">{line}</p>
        ))}
        {error ? <p className="wb-share-consent__error" role="alert">{error}</p> : null}
        <div className="wb-share-consent__actions">
          <Btn kind="ghost" small className="wb-share-consent__confirm" onClick={onConfirm} disabled={busy}>
            {busy ? "Creating share link…" : "Create share link"}
          </Btn>
          <Btn kind="ghost" small onClick={onCancel} disabled={busy}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
}

// The share affordance. A share is a PUBLISH action authorized only by possession of
// the run's receipt: the button opens the §D consent modal, and confirming POSTs
// { receipt } to /api/inspection-share, which re-verifies the receipt's integrity and
// its existence on a real minted run before publishing. No receipt → nothing renders
// (a fallback run can't be shared). onShared lifts the created URL to the caller so a
// single-mode result can thread it into the copy-record credit line. Every failure
// keeps the modal open with one honest line; a failed share never blocks the result.
function ReaderShareAction({ mode, receipt, onShared }) {
  const [phase, setPhase] = useState("idle"); // idle | consenting | creating | ready | copied
  const [shareUrl, setShareUrl] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const containerRef = useRef(null);

  if (!receipt) return null;

  const label = mode === "paired" ? "Share this two-question test" : "Share this inspection";
  const dialogOpen = phase === "consenting" || phase === "creating";

  const focusTrigger = () => {
    const el = containerRef.current && containerRef.current.querySelector(".wb-reader-share__btn");
    if (el) el.focus();
  };
  const openConsent = () => {
    setErrMsg("");
    setPhase("consenting");
  };
  const closeConsent = () => {
    if (phase === "creating") return;
    setErrMsg("");
    setPhase("idle");
    focusTrigger();
  };

  const createShare = async () => {
    setPhase("creating");
    setErrMsg("");
    try {
      const res = await fetch("/api/inspection-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.share_url) {
        console.warn("[imbas] inspection-share failed", res.status, data && data.error);
        setErrMsg(shareFailureMessage(res.status, data));
        setPhase("consenting"); // keep the modal open, showing the failure line
        return;
      }
      if (typeof onShared === "function") onShared(data.share_url);
      setShareUrl(data.share_url);
      setPhase("ready");
      try {
        await navigator.clipboard.writeText(data.share_url);
        setPhase("copied");
        setTimeout(() => setPhase("ready"), 1600);
      } catch {
        /* success UI still shows the manual copy control */
      }
    } catch (err) {
      console.warn("[imbas] inspection-share network error", err);
      setErrMsg("Could not create share link. Copy the full receipt for now.");
      setPhase("consenting");
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setPhase("copied");
      setTimeout(() => setPhase("ready"), 1600);
    } catch {
      setErrMsg("Could not copy link. Select the link below and copy manually.");
    }
  };

  const showSuccess = shareUrl && (phase === "ready" || phase === "copied");

  return (
    <div className="wb-reader-share" ref={containerRef}>
      {showSuccess ? (
        <div className="wb-reader-share__success" role="status">
          <p className="wb-reader-share__success-title">Share link created</p>
          <p className="wb-reader-share__url">
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">{shareUrl}</a>
          </p>
          <div className="wb-reader-share__actions">
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="wb-btn wb-btn--ghost wb-reader-share__open"
            >
              Open share page
            </a>
            <Btn kind="ghost" small className={phase === "copied" ? "is-copied" : ""} onClick={copyShareUrl}>
              {phase === "copied" ? "Copied" : "Copy share link"}
            </Btn>
          </div>
        </div>
      ) : (
        <Btn kind="ghost" small className="wb-reader-share__btn" onClick={openConsent}>
          {label}
        </Btn>
      )}
      {dialogOpen ? (
        <ShareConsentDialog
          mode={mode}
          busy={phase === "creating"}
          error={errMsg}
          onConfirm={createShare}
          onCancel={closeConsent}
        />
      ) : null}
    </div>
  );
}

function ReaderResultCopyActions({ result, context, shareUrl }) {
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  const flashCopied = (setter) => {
    setter(true);
    setCopyFail("");
    setTimeout(() => setter(false), 1800);
  };
  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(`${formatReaderResultCopy(result)}\n\n${readerCreditLine(shareUrl)}`);
      flashCopied(setCopiedResult);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };
  const copyFull = async () => {
    try {
      await navigator.clipboard.writeText(`${formatReaderFullRecord({ ...context, result })}\n\n${readerCreditLine(shareUrl)}`);
      flashCopied(setCopiedFull);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };
  return (
    <div className="wb-reader-result__copy">
      <Btn kind="ghost" small className={copiedResult ? "is-copied" : ""} onClick={copyResult}>
        {copiedResult ? "Copied" : "Copy Result"}
      </Btn>
      <Btn kind="ghost" small className={copiedFull ? "is-copied" : ""} onClick={copyFull}>
        {copiedFull ? "Copied" : "Copy Full Receipt"}
      </Btn>
      {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
    </div>
  );
}

// The next-step seam, seated below the read and above the controls that act on the run
// itself. The list it renders is empty — see reader-result-actions.js for why that is
// the launch state and not a placeholder — so this returns before it builds anything.
//
// The early return is the zero-footprint guarantee and it has to stay an early return.
// An empty <nav> would still be an element: a flex or grid parent gives it a gap, a
// landmark role puts it in the accessibility tree, and `hidden` or display:none is a
// styled absence rather than an absence. Returning null emits no node at all, which is
// why the board frames for every result state are byte-identical across the commit that
// added this.
function ReaderResultActions({ result, context }) {
  const actions = resultActions({ result, context });
  if (!actions.length) return null;
  return (
    <nav className="wb-reader-result__actions" aria-label="Where to go next">
      {actions.map((action) => (
        <a key={action.id} className="wb-reader-result__action wb-focus" href={action.href}>
          {action.label}
        </a>
      ))}
    </nav>
  );
}

function ReaderResultBlock({ result, context, onRunAgain }) {
  const [shareUrl, setShareUrl] = useState("");
  const comp = result?.completeness || "partial";
  const leftOut = Array.isArray(result?.what_was_left_out) ? result.what_was_left_out.filter(Boolean) : [];
  const shaped = (result?.how_it_was_shaped || "").trim();
  const inspectionNote = (result?.inspection_note || "").trim();
  const isFallback = result?.source === "fallback";
  const isAgent = result?.source === "agent";
  // A fallback measured nothing, so it gets its presentation key, never the
  // measurement's. The two never mix: a run has one or the other.
  const tone = isFallback ? result?.display_treatment || "muted" : comp;
  const provenance = readerResultProvenanceLabel({ mode: context.mode, sel: context.sel, result });
  const paragraphs = isFallback
    ? [readerFallbackReadBody()]
    : (result?.the_read || "").split(/\n\n+/).filter(Boolean);

  return (
    <section className={`wb-reader-result wb-scroll-anchor is-${tone}${isFallback ? " is-fallback" : ""}${isAgent ? " is-agent" : ""}`} aria-labelledby="wb-reader-result-heading">
      <div className="wb-reader-result__head">
        {isAgent ? (
          <div className={`wb-reader-result__status is-${comp}`}>
            <div className={`wb-reader-result__badge is-${comp}`}>{READER_COMPLETENESS_LABEL[comp]}</div>
            <p className="wb-reader-result__badge-gloss">{READER_COMPLETENESS_GLOSS[comp]}</p>
          </div>
        ) : (
          <h2 id="wb-reader-result-heading" className="wb-reader-result__title">THE READER</h2>
        )}
      </div>
      {isAgent ? (
        <>
          <h2 id="wb-reader-result-heading" className="wb-reader-result__title wb-reader-result__title--sub">THE READER</h2>
          <p className="wb-reader-result__provenance">{provenance}</p>
        </>
      ) : null}
      {isFallback ? (
        <p className="wb-reader-result__fallback" role="status">
          {readerFallbackDisplayMessage(result)}
        </p>
      ) : null}
      <div className="wb-reader-result__sections">
        <article className="wb-reader-result__section wb-reader-result__section--read">
          {!isFallback ? <h3 className="wb-reader-result__section-title">The read</h3> : null}
          <div className="wb-reader-result__read-body">
            {paragraphs.length ? paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            )) : <p>{isFallback ? readerFallbackReadBody() : "No read returned."}</p>}
          </div>
        </article>
        {!isFallback ? (
          <>
            <article className="wb-reader-result__section wb-reader-result__section--left-out">
              <h3 className="wb-reader-result__section-title">What may be missing</h3>
              {leftOut.length ? (
                <ul className="wb-reader-result__list">
                  {leftOut.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ) : (
                // The prior line leaned on an unstated threshold for what counts as
                // major and read as a clean bill. Naming the condition is the whole fix.
                <p className="wb-reader-result__empty">{READER_NO_MISSING_LINE}</p>
              )}
            </article>
            <article className="wb-reader-result__section wb-reader-result__section--shaped">
              <h3 className="wb-reader-result__section-title">How it was shaped</h3>
              {/* The prior line graded the answer against a bar it never stated. The
                  replacement reports the run and nothing else. */}
              <p className="wb-reader-result__shaped">{shaped || READER_NO_SHAPING_LINE}</p>
            </article>
          </>
        ) : null}
        {inspectionNote ? (
          <article className="wb-reader-result__section wb-reader-result__section--inspection">
            <h3 className="wb-reader-result__section-title">Inspection note</h3>
            <p className="wb-reader-result__inspection-note">{inspectionNote}</p>
          </article>
        ) : null}
        {!isFallback && isAgent ? <p className="wb-reader-result__trust">Behavior, not intent.</p> : null}
      </div>
      {/* Outside the footer's condition on purpose. The footer only exists when the panel
          was given a way to run again, and a next step is a property of the run rather
          than of that control. */}
      <ReaderResultActions result={result} context={context} />
      {/* Item 8, R11+R8. The receipt pair used to close the measurement panel, which put
          an export between the marks and the reading of them. Both receipt controls
          land here instead, after the last interpretive block of the measure-plus-
          narrative sequence, beside the other artifacts a person can take away.

          Item 5, R7+R8+R11. Six controls carried one class between them and read as six
          peers. They are not: four produce a copy, one publishes a URL, and one starts
          another run. The four that produce a copy are peers and group as peers, in the
          subordinate register R11 gives an export. Publishing keeps its own row and its
          button chrome, because it is the one control here with an effect outside this
          page. Starting over leaves the group entirely — see below. */}
      {onRunAgain && isAgent ? (
        <div className="wb-reader-result__footer">
          <div className="wb-reader-result__keep">
            <ReaderResultCopyActions result={result} context={context} shareUrl={shareUrl} />
            <ReaderReceiptActions receipt={result.receipt} />
          </div>
          <ReaderShareAction mode="single" receipt={result.receipt} onShared={setShareUrl} />
        </div>
      ) : null}
      {/* Run again acts on the run, not on the artifacts, so it stands under the whole
          result on its own rule rather than sitting in a row of export controls. */}
      {onRunAgain ? (
        <div className="wb-reader-result__restart">
          <Btn kind="ghost" small onClick={onRunAgain} className="wb-reader-result__rerun">
            Run again
          </Btn>
        </div>
      ) : null}
    </section>
  );
}

// Reader v2 P1 — measurement panel. Sits one scroll below the inspection under its
// own header, so the narrative read stays on top and the professional layer is
// discoverable without competing. Renders ONLY when the run carries a measurement
// (agent runs with a valid measurement object); older runs, fallbacks, and
// malformed measurements have result.measurement == null and the panel is absent.
// Everything here is candidate vocabulary — unvalidated inspection hypotheses,
// never validated classifications, never evidence. The unvalidated label and the
// boundary line are non-negotiable and never below the fold.
// The row label used to come from a three-entry map here, keyed by class id. It held
// the same three strings reader-result.js already publishes as class_display, so it
// was a second copy of the one vocabulary and a place the view had to be edited for
// every finding type. The rows read the descriptor's own label now. What that map was
// protecting stands: ONE vocabulary across every surface, and the candidate status
// carried by the section header and the boundary line rather than smuggled into the
// name of the signal.
//
// onExport is an OPTIONAL success hook (kind "json" | "receipt"). Inspection callers
// omit it (unchanged); the user-chip lane passes one to emit the reused CARD_EXPORTED
// event, so a downloaded follow-up receipt counts on the same funnel row as an
// inspection card export — no duplicate export UI, no chip-specific event.
function ReaderReceiptActions({ receipt, formatter = formatReceiptText, filePrefix = "imbas-reader-receipt", onExport }) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  if (!receipt) return null;
  const flash = (setter) => {
    setter(true);
    setFailMsg("");
    setTimeout(() => setter(false), 1800);
  };
  const fail = (msg) => {
    setFailMsg(msg);
    setTimeout(() => setFailMsg(""), 2200);
  };
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
      flash(setCopiedJson);
      if (onExport) onExport("json");
    } catch {
      fail("Could not copy");
    }
  };
  const downloadReceipt = () => {
    try {
      const text = formatter(receipt);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = (receipt.generated_at || "").replace(/[:.]/g, "-");
      a.href = url;
      a.download = `${filePrefix}-${stamp || "run"}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      flash(setDownloaded);
      if (onExport) onExport("receipt");
    } catch {
      fail("Could not download receipt");
    }
  };
  return (
    <div className="wb-reader-result__copy wb-measure__actions">
      <Btn kind="ghost" small className={copiedJson ? "is-copied" : ""} onClick={copyJson}>
        {copiedJson ? "Copied" : "Copy JSON"}
      </Btn>
      <Btn kind="ghost" small className={downloaded ? "is-copied" : ""} onClick={downloadReceipt}>
        {downloaded ? "Downloaded" : "Download receipt"}
      </Btn>
      {failMsg ? <span className="wb-reader-result__copy-fail" role="status">{failMsg}</span> : null}
    </div>
  );
}

// Reader v2 R1 (item 10) — the Inspection Card export. Copy or download the state-aware
// summary built by formatInspectionCard. Distinct from the audit receipt (full JSON /
// text) and the share page (server-minted URL): this is the light, paste-anywhere
// artifact. A successful export emits the card_exported event (ids + enums only, via the
// content-minimal emitter) — the funnel already reserves a row for it. Client-only:
// clipboard + a Blob download, no network, no persistence.
function InspectionCardAction({ state, copy, firstText, secondText, smallPrint, run, check }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const flash = (setter) => {
    setter(true);
    setFailMsg("");
    setTimeout(() => setter(false), 1800);
  };
  const fail = (msg) => {
    setFailMsg(msg);
    setTimeout(() => setFailMsg(""), 2200);
  };
  const cardText = () => formatInspectionCard({ copy, firstText, secondText, smallPrint });
  const noteExport = () => emitReaderEvent(READER_EVENTS.CARD_EXPORTED, { run, state, check });
  const copyCard = async () => {
    try {
      await navigator.clipboard.writeText(cardText());
      noteExport();
      flash(setCopied);
    } catch {
      fail("Could not copy");
    }
  };
  const downloadCard = () => {
    try {
      const blob = new Blob([cardText()], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imbas-inspection-card-${run || "run"}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      noteExport();
      flash(setDownloaded);
    } catch {
      fail("Could not download card");
    }
  };
  return (
    <div className="wb-reader-result__copy wb-measure__actions wb-card-export">
      <span className="wb-card-export__label">Share what you saw</span>
      <Btn kind="ghost" small className={copied ? "is-copied" : ""} onClick={copyCard}>
        {copied ? "Copied" : "Copy card"}
      </Btn>
      <Btn kind="ghost" small className={downloaded ? "is-copied" : ""} onClick={downloadCard}>
        {downloaded ? "Downloaded" : "Download card"}
      </Btn>
      {failMsg ? <span className="wb-reader-result__copy-fail" role="status">{failMsg}</span> : null}
    </div>
  );
}

// The line that sits under the hero's count. It used to enumerate the run's items by
// class — "Reader surfaced 2 Omission items, 1 Framing Drift item." — which is an
// aggregate across the class vocabulary, and an aggregate is the one thing a person
// cannot check against what is on the screen. What the line says now is what the count
// counts: surfaced_candidate_items is the items carrying a quotation that resolved
// verbatim against the pasted answer, so the sentence states that predicate in plain
// words and every row carries the quotation that earned it a place.
//
// The empty branch keeps its second sentence, because a null result is the state most
// likely to be read as a verdict and the line has to say what it is instead. It used to
// say so by denial — "not a verdict on the answer" — which was cured with the routed
// four: this line renders directly under the count, on the same run where the Inspection
// Meaning panel's S1 state renders, and that panel's line carried the same denial in
// nearly the same words. Curing one and leaving the other would have put two registers
// for one proposition on a single screen. The conditions clause is untouched, which is
// what test/reader-empty-states.test.mjs requires of a null-result line.
function readerCandidateSummary(canonical) {
  if (!countOf(canonical, "surfaced_candidate_items")) {
    return "Reader surfaced nothing to list here under the tested conditions. That records the extent of this inspection.";
  }
  return "Each one is a candidate the Reader could quote from your answer.";
}

// Reader v2 P3 — the perception-tap write (design §4). A client-triggered telemetry
// mutation: the server authorizes it by verifying the receipt, so the client sends
// ONLY { receipt, value } — never a raw request_id, open_run_id, or Airtable row id.
// Latest wins: re-tapping PATCHes the same record server-side. The write is awaited
// and retried ONCE on a transient failure (network error or 5xx); a 4xx is terminal
// (nothing to retry) and a final failure is SWALLOWED — the result, delta, and
// receipt are never touched and the user is told nothing. The seq guard stops a
// superseded value from retrying after a newer tap, so re-tapping never burns the
// server's per-receipt write cap on stale values.
async function writePerception(receipt, value, seq, seqRef) {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (seqRef.current !== seq) return; // a newer tap superseded this write
    try {
      const res = await fetch(READER_PERCEPTION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt, value }),
      });
      if (res.ok) return;
      if (res.status < 500 || attempt === 1) return; // 4xx terminal; 5xx retried once
    } catch {
      if (attempt === 1) return; // network error on the retry — swallow
    }
  }
}

// Reader v2 P3 — the perception tap (design §4). ONE optional, mutable question after
// a result. THIS IS TELEMETRY, NEVER VALIDATION: it records how the read *felt*, not
// whether it was accurate. Nothing here — label, aria text, or state — may imply the
// tap confirms accuracy; "users confirm our accuracy" and every paraphrase is banned
// (see reader-perception-client.js, the shared source of the copy). Single mode asks
// whether the read landed (the only honest question when the person holds one answer
// and cannot judge omission); paired mode asks how big the delta felt (real data —
// they hold both answers). Skipping writes nothing; the field stays null. When the
// result unmounts this unmounts with it, so there is no re-prompt after the result is
// left and no cross-session state.
function PerceptionTap({ mode, receipt }) {
  const tap = perceptionTap(mode);
  const [selected, setSelected] = useState(null);
  const seqRef = useRef(0);
  if (!tap || !receipt) return null;

  const choose = (value) => {
    if (!isPerceptionValueForMode(mode, value)) return;
    setSelected(value); // optimistic + latest-wins; the UI never blocks on the network
    const seq = ++seqRef.current;
    void writePerception(receipt, value, seq, seqRef); // fire-and-forget, silent on failure
  };

  return (
    <div className="wb-perception wb-scroll-anchor">
      <p className="wb-perception__prompt">{tap.prompt}</p>
      <div className="wb-perception__options" role="group" aria-label={tap.prompt}>
        {tap.options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.id}
              type="button"
              className={`wb-focus wb-perception__option${active ? " is-selected" : ""}`}
              aria-pressed={active}
              onClick={() => choose(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Reader v2 redesign edit 4 — the result hero. The count line is the largest, first
// element of the result. A plain candidate summary sits beneath, then the full read
// and measurement panel below. Renders only when the run carries a measurement.
//
// Pass 2B-A: the line states a named count — surfaced_candidate_items, the items
// carrying at least one quotation that resolves verbatim against the pasted answer —
// and no longer a 0-3 gap estimate. The single-answer surface stops scoring: there
// is no completeness label, no gap score, and no judgment about how much the answer
// left out. The estimate is still recorded in the wire payload under its own version;
// it is no longer the thing the Reader tells a person it found.
//
// Pass 2B-B removes estimate_rationale from this hero too. It is one line of model
// prose written to justify the 0-3 estimate, so with the estimate gone it argues for
// a claim the surface no longer makes — and being unbounded model text about a score,
// nothing can guarantee it does not restate the figure the hero just stopped showing.
//
// Composition pass (Lane 4): this section is GLANCE, and GLANCE is exactly two
// rendered blocks — the count, then the sentence saying what the count counts. The
// third and last block a reader passes before the marks is the INSPECT summary line
// at the head of the panel below. Three, and then evidence.
//
// Two things that used to stand here are gone rather than restyled. An "Inspection
// result" eyebrow named the surface to someone who had just pressed the button on it,
// and a strip carrying the way back to the compose fields stood above the count. Each
// was a rendered block between a reader and their own marks, and the record identity
// they carried is not lost: it renders in full inside the panel's INSPECT disclosure,
// and the way back now sits on the compose block it re-opens, where it is the action
// row's own control instead of the result's first line.
function ReaderResultHero({ result }) {
  const m = result?.measurement;
  if (!m) return null;
  const canonical = result.result;
  return (
    <section className="wb-reader-result is-agent wb-result-hero wb-scroll-anchor" aria-labelledby="wb-result-hero-estimate">
      <h2 id="wb-result-hero-estimate" className="wb-result-hero__estimate">
        {`${countLabel(canonical, "surfaced_candidate_items")} surfaced`}
      </h2>
      <p className="wb-result-hero__summary">{readerCandidateSummary(canonical)}</p>
    </section>
  );
}

// What produced this result, field by field (reader-provenance.js owns the fields and
// the words for a missing one). Every field renders, including the ones the record does
// not hold: a row that disappears reads as "does not apply", and the truth is usually
// "was not recorded". data-known marks which is which so the acceptance board can
// photograph a complete strip and a partial one and tell them apart in the DOM.
//
// Nothing here is inferred. The answer model is whatever the person typed, and the note
// under the strip says so — Imbas does not observe which model wrote the answer it read.
function ProvenanceStrip({ canonical, declaredModel, capturedAt, pairedMethodVersion }) {
  const strip = describeProvenance({ canonical, declaredModel, capturedAt, pairedMethodVersion });
  // No canonical block means there is no result to describe the provenance OF. A
  // legacy record renders its own notice instead; a strip of seven "not recorded"
  // rows would be a form filled in with nothing.
  if (!strip.surface) return null;
  return (
    <div className="wb-prov" data-complete={strip.complete ? "yes" : "no"}>
      <span className="wb-prov__heading">{PROVENANCE_UI.heading}</span>
      <dl className="wb-prov__list">
        {strip.fields.map((f) => (
          <div key={f.id} className="wb-prov__row" data-field={f.id} data-known={f.known ? "yes" : "no"}>
            <dt className="wb-prov__label">{f.label}</dt>
            <dd className="wb-prov__value">{f.value}</dd>
          </div>
        ))}
      </dl>
      <p className="wb-prov__note">{PROVENANCE_UI.declared_note}</p>
    </div>
  );
}

// The canonical claim register, made visible. Until this landed, reader-result.js
// decided what a paired finding was allowed to claim and no surface said which claim
// it had made — so a pair standing on nothing but two pasted answers looked exactly
// like a pair standing on an observed record of the capture conditions.
//
// Paired only, and that is the module's decision, not this component's: a
// single-answer run has no conditions basis, so describeClaimState returns null and
// this renders nothing rather than answering a question the surface never asked.
function ClaimStateRow({ canonical }) {
  const claim = describeClaimState(canonical);
  if (!claim) return null;
  return (
    <div className="wb-claim" role="note" data-claim-state={claim.state_id}>
      <span className="wb-claim__label">{claim.label}</span>
      <p className="wb-claim__support">{claim.support}</p>
    </div>
  );
}

// The panel's accessible name. It was a visible `MEASUREMENT` heading until the
// composition pass, which is the one thing a reader arriving at their own marks does
// not need told. Deleting the heading outright would have left the section unnamed to
// anyone navigating by landmark, so the name moved to aria-label and stopped taking a
// rendered block. Screen-reader users keep the landmark; nobody reads a title.
const MEASURE_SECTION_LABEL = "Candidate findings";

// The INSPECT summary — the third block a reader passes, and the one that lets the
// other two be short. It states its contents rather than inviting a click, per the
// disclosure rule: a reader decides whether to open it by knowing what is in it.
//
// It names exactly what is behind it and in that order — the orientation line, then
// the provenance strip. If either moves out of the disclosure, this line is wrong and
// has to change with it.
const MEASURE_INSPECT_SUMMARY = "What a mark points at, and the conditions this answer was read under";

// READ's accessible name, on the same rule as the panel's: named for a landmark,
// unrendered as a heading. A reader looking at their own answer with numbers in it
// does not need a title telling them it is their answer.
const MEASURE_SOURCE_LABEL = "The answer, marked";

// READ — the answer with its marks positioned in it.
//
// This is what the spans were resolved for. Every QUOTED anchor has carried exact
// offsets into the artifact since the day the server started resolving them, and
// until now the interface rendered the excerpt beside the finding and left the
// reader to find it in their own text themselves. The excerpt was the evidence and
// the position was thrown away. Here the position is the evidence: the words are in
// the answer, at the place they occupy, and a reader can see how much of the answer
// is marked and how much is not without reading a single quotation twice.
//
// EVERYTHING POSITIONED HERE IS A QUOTATION, and that is structural rather than
// enforced: buildSourceReading positions a mark only from a span, only quotedAnchor
// mints a span, and it mints it against the artifact it proved the quotation from.
// A record-level absence has no offsets, so it cannot appear in this body and does
// not — it renders in the list below, outside the document, where it belongs. An
// unresolved quotation is not a mark at all and appears nowhere.
//
// The text is `pre-wrap` and it is the whole artifact, uncut. Any truncation would
// hide marks, and a scroll box would put the reader's own evidence behind a gesture;
// both would be the surface deciding how much of an answer is worth showing. The
// segmentation cuts at span boundaries only, so the pieces concatenate back to the
// artifact exactly and no character is inserted into, dropped from, or reordered
// within the answer a person pasted. The one thing added is the mark number, and it
// sits outside the text run it labels.
//
// No caret, no strikethrough, no suggested replacement, no "this should have said".
// A mark is an observation about words that are there. It is never a requested edit.
// The DOM id of the list item that explains one finding. Derived from the canonical
// finding id and nothing else, so the body and the list arrive at the same string
// without either being told what the other used, and so renumbering the marks cannot
// move it — the numeral is a display join key, the finding id is the identity.
function findingExplanationId(findingId) {
  const id = String(findingId || "").trim();
  return id ? `wb-finding-${id.replace(/[^A-Za-z0-9_-]/g, "-")}` : "";
}

function SourceReading({ reading, answer, findings, cardsById }) {
  // Hooks before the early return, because an empty reading must not change the hook
  // order. The effect below guards on the ref instead.
  const bodyRef = useRef(null);
  const [span, setSpan] = useState(null);

  // THE SELECTION HANDLER, SCOPED TO THIS BODY. It listens on the document because that
  // is the only place `selectionchange` fires, but every selection is resolved against
  // this element: resolveSelectionSpan returns null unless BOTH boundary points sit
  // inside it, so a drag that starts in the answer and ends in the explanation list below
  // offers nothing rather than clipping to the body's edge.
  //
  // Nothing is recorded. No event is emitted, no telemetry, no fetch — the resolved span
  // lives in this component's state and dies with it.
  useEffect(() => {
    const body = bodyRef.current;
    const doc = body && body.ownerDocument;
    if (!body || !doc) return undefined;
    const onSelectionChange = () => {
      const sel = doc.getSelection ? doc.getSelection() : null;
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSpan(null);
        return;
      }
      setSpan(resolveSelectionSpan({ range: sel.getRangeAt(0), bodyEl: body }));
    };
    doc.addEventListener("selectionchange", onSelectionChange);
    return () => doc.removeEventListener("selectionchange", onSelectionChange);
  }, [reading]);

  if (!reading || !reading.segments.length) return null;
  // mark number → the finding it belongs to, read off the reading's own mark table.
  // Nothing here recomputes the numbering; buildSourceReading published it already.
  const findingByMark = new Map((reading.marks || []).map((m) => [m.n, m.finding_id]));
  // A mark stood over the words and the explanation sat hundreds of pixels below it,
  // and the only thing joining them was a numeral a screen reader had no way to
  // follow. aria-details rather than aria-describedby: describedby would flatten the
  // whole explanation into a string and read it out every time the reader crossed the
  // marked words. This offers the relationship and lets the reader take it.
  //
  // Only marks in the body carry it, which is the whole reason ABSENT and UNRESOLVED
  // get none: an unresolved quotation is never numbered, and a record-level absence
  // is never positioned, so neither one reaches this element to be linked from.
  return (
    <div className="wb-measure__source" role="group" aria-label={MEASURE_SOURCE_LABEL}>
      {/* data-start on EVERY segment, marked and unmarked alike. An unmarked segment
          carrying no offset would force a selection that begins in ordinary prose to
          count backwards through its siblings, and that count goes wrong the moment a
          mark numeral sits among them. The attribute is the answer offset of this
          segment's own text — never of the numeral rendered before it. */}
      <p className="wb-source__body" ref={bodyRef}>
        {reading.segments.map((seg) => {
          if (!seg.marks.length) {
            return (
              <span key={seg.start} {...{ [SPAN_SEGMENT_ATTR]: seg.start }}>
                {seg.text}
              </span>
            );
          }
          const details = seg.marks
            .map((n) => findingExplanationId(findingByMark.get(n)))
            .filter(Boolean)
            .join(" ");
          return (
            <mark
              key={seg.start}
              className="wb-source__mark"
              data-mark={seg.marks.join(" ")}
              {...{ [SPAN_SEGMENT_ATTR]: seg.start }}
              aria-details={details || undefined}
            >
              {seg.starts.map((n) => {
                const target = findingExplanationId(findingByMark.get(n));
                return <MarkNumber key={n} n={n} href={target ? `#${target}` : undefined} />;
              })}
              {seg.text}
            </mark>
          );
        })}
      </p>
      <SpanAffordances
        span={span}
        answer={answer}
        reading={reading}
        findings={findings}
        cardsById={cardsById}
      />
    </div>
  );
}

// The capability strip. Copy and anchor ids ship from reader-result.js; the reasoning
// for the wording is there, beside the words. This component is the render alone.
//
// Links, not buttons, and no card around them: the strip is an index of the page, and
// an index that competed with the count above it would have bought orientation at the
// cost of the thing a person came for. It reorders nothing and moves no content —
// every target is a section that was already mounted, in the order shown.
//
// `links` arrives pre-filtered. Rendering is unconditional on membership by design:
// this component cannot invent a link for a section that is not on the page, because
// it never tests for one. The caller holds every mount test, next to the mounts.
function ResultCapabilityStrip({ links }) {
  if (!links.length) return null;
  return (
    <nav className="wb-capstrip" aria-label={RESULT_CAPABILITY_UI.heading}>
      <span className="wb-capstrip__label">{RESULT_CAPABILITY_UI.heading}</span>
      <ul className="wb-capstrip__list">
        {links.map((link) => (
          <li key={link.id} className="wb-capstrip__item">
            <a className="wb-capstrip__link" href={`#${link.id}`}>{link.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// The panel lists surfaced_findings: the findings that satisfy their shape's
// registered surfacing contract. recorded_findings holds more — legacy material and
// findings whose supplied quotation did not resolve — and is the durable record, not
// a display subset. A finding that cannot be quoted must not be a row, because a row
// is a claim that the Reader found something in this answer.
//
// The hero states surfaced_candidate_items, which is surfaced_findings restricted to
// the single-answer surface. On a single-answer result every finding is single-surface
// by construction, so the two select the identical set and the hero cannot disagree
// with the rows beneath it. The unit differs, not the membership.
//
// Rows are rendered from describeFinding alone. Nothing here switches on shape or
// re-maps a class, so a newly registered finding shape renders through this list
// with no edit to this component.
function MeasurementPanel({ result, context }) {
  const m = result?.measurement;
  if (!m) return null;
  const receipt = result?.receipt || null;
  const canonical = result.result;
  const findings = selectSubset(canonical, "surfaced_findings").map(describeFinding);
  const declaredModel = (context?.model || "").trim() || (receipt?.open_run?.declared_model || "").trim();
  const runTimestamp = receipt?.generated_at || receipt?.open_run?.provenance?.run_timestamp || "";
  // The artifact comes off the receipt, not off the compose field. api/read.js hands
  // the same `input.answer` expression to the canonical builder and to the receipt
  // builder in the same scope, so receipt.open_run.answer is byte-identical to the
  // text the spans were resolved against. The compose field is not: the client trims
  // on the way out, so React state can be one leading newline out of register with
  // the coordinates, which is exactly enough to put every mark over the wrong words.
  const reading = buildSourceReading({ artifactText: receipt?.open_run?.answer || "", findings });
  // The register's cards, addressed by id, built once for the whole list rather than
  // scanned per row. The join itself is canonical — classifyRegisterOutcome made it
  // server-side and describeFinding hands each row the one card id it resolved to —
  // so this is a lookup table and never a second derivation of the relationship. A
  // row that finds nothing here renders nothing; see FindingQuestion.
  const cardsById = new Map(
    (result?.checks?.cards || []).map((c) => [c.id, c])
  );
  const run = receipt?.open_run?.provenance?.request_id || "";
  // THE ORDER THE ROWS ARE PRINTED IN, and nothing else. R4, closed by the founder
  // ruling of 2026-08-22, recorded as R4_ADJUDICATION in reader-result.js beside the
  // function that assigns the numerals.
  //
  // The numerals are the reading's, handed out in the answer's document order. This
  // list held the RECORD's order, so on an answer whose marks ascend 1..6 a reader met
  // rows numbered 1, 2, 4, 3, 5, 6 and had to reconcile two visible sequences to know
  // they were looking at one set of findings. That is the dual-order mapping tax R4
  // names, and it is not cured by the numeral being correct on both surfaces.
  //
  // NOTHING IS RENUMBERED. The sort key is the numeral buildSourceReading already
  // published, read back out of marks_by_finding, so this changes which row prints
  // first and cannot change which numeral a row carries. `findings` itself is left
  // alone: byReadingOrder tiebreaks on record_index, so reordering the array handed to
  // buildSourceReading would silently reassign numerals among marks that tie on span.
  //
  // A row with no numeral keeps the record's order behind the numbered ones. Nothing
  // here branches on what kind of finding a row holds, and nothing needs to:
  // byReadingOrder places every unpositioned mark after every positioned one, so a
  // record-level absence already carries a higher numeral than any marked passage and
  // lands after them on the numeral alone. A branch would be a second rule capable of
  // disagreeing with the numbering.
  const rowNumeral = (f) => {
    const ns = (reading.marks_by_finding[f.id] || []).filter((n) => n != null);
    return ns.length ? Math.min(...ns) : Number.MAX_SAFE_INTEGER;
  };
  const rows = [...findings].sort((a, b) => rowNumeral(a) - rowNumeral(b));
  return (
    <section className="wb-reader-result is-agent wb-measure wb-scroll-anchor" aria-label={MEASURE_SECTION_LABEL}>
      {/* READ leads the panel, because the answer with the marks in it is the thing a
          reader came for and everything else here is about it. */}
      {/* `answer` is the same receipt expression `reading` was cut from, passed
          separately because the span lane quotes the selected passage out of it
          verbatim. Both derive from receipt.open_run.answer and nothing else, so a
          composed request can never quote one string while the marks index another. */}
      <SourceReading
        reading={reading}
        answer={receipt?.open_run?.answer || ""}
        findings={findings}
        cardsById={cardsById}
      />

      {/* Nothing stands between the answer and the account of it.
          A visible `MEASUREMENT` title and a `Candidate findings` sub-title used to,
          and the strip of seven provenance rows stood between those two and the first
          excerpt. All three were the instrument describing itself in the one place a
          reader is trying to reach their own words. The section is still named — the
          count in GLANCE names it for a reader, aria-label names it for everyone else
          — and the provenance renders whole inside the disclosure, one key away.

          This is INSPECT, and it is the last block before the list. It is a native
          <details>, so it opens by keyboard with no script running and it prints open.
          The summary says what is inside it rather than inviting a click, which is why
          it names the two things it holds instead of saying "details". */}
      <details className="wb-measure__inspect">
        <summary className="wb-measure__inspect-summary">{MEASURE_INSPECT_SUMMARY}</summary>
        <div className="wb-measure__inspect-body">
          {/* Z2.3, the line that teaches what a mark is. A reader who pressed the
              button already knows they are reading their own answer, so it files here;
              a reader who was handed the record cold meets it in the open, on the
              share surface. Same string either way — reader-result.js owns it. */}
          <p className="wb-measure__orientation">{MARK_ORIENTATION_NOTE}</p>
          <ProvenanceStrip
            canonical={canonical}
            declaredModel={declaredModel}
            capturedAt={runTimestamp}
          />
        </div>
      </details>

      <div className="wb-reader-result__sections">
        <article className="wb-reader-result__section wb-measure__findings">
          {/* A per-class tally stood here. It summed the rows below into a figure the
              class vocabulary owned rather than the run, and it went stale the moment
              a shape registered outside those three names. The rows are the account. */}
          {findings.length ? (
            <ul className="wb-measure__list">
              {rows.map((f) => (
                // Item 1, R21. tabIndex -1 is what makes the mark's link land: a
                // fragment whose target cannot hold focus moves the viewport and leaves
                // focus behind, so the next Tab goes back to the answer instead of on
                // through the explanation.
                <li key={f.id} id={findingExplanationId(f.id)} tabIndex={-1} className="wb-measure__finding">
                  <span className="wb-measure__finding-type">{f.class_display}</span>
                  {(f.materiality || "").trim() ? (
                    <span className="wb-measure__finding-why">{f.materiality.trim()}</span>
                  ) : null}
                  {/* The numbering comes from the reading, keyed by finding and aligned
                      index for index with the anchors, so the number beside a quotation
                      here is the number standing over it in the body above. Neither
                      surface counts for itself; there is one numbering and two views of
                      it. A mark with no number is an anchor the reading did not number,
                      which is an anchor no surface may show, and the evidence element
                      renders nothing for it either way. */}
                  {f.anchors.map((a, i) => (
                    <FindingEvidence
                      key={`${f.id}-${i}`}
                      anchor={a}
                      mark={(reading.marks_by_finding[f.id] || [])[i]}
                    />
                  ))}
                  {/* Last in the row, because it is what a reader does after they have
                      read what the mark points at — not before. */}
                  <FindingQuestion card={cardsById.get(f.verification_card_id) || null} run={run} />
                </li>
              ))}
            </ul>
          ) : (
            // The hero above carries the "not a verdict" line and the interpretation
            // panel below carries the full framing, so this one states the condition
            // and stops. Naming the condition is what makes it honest: the claim is
            // about this inspection, not about the answer.
            <p className="wb-reader-result__empty">{MEASURE_EMPTY_LINE}</p>
          )}
        </article>
      </div>

      {/* Item 6, R13. This stratum used to close on two full scope statements: this
          line stated the whole scope, and the boundary below stated it again in the
          record's own words. One of them has to be the statement and the other has to
          point at it. The boundary owns the stratum's edge and is the string every
          other surface single-sources, so it keeps the full statement and this line
          became a pointer to it. */}
      <p className="wb-measure__unvalidated">
        These are candidate observations from a single answer. The boundary below states what
        entering the Imbas record requires.
      </p>
      <p className="wb-reader-result__trust wb-measure__boundary">{RECEIPT_BOUNDARY}</p>
    </section>
  );
}

// The evidence element under a finding row, dispatched on the anchor's channel and on
// nothing else. reader-result.js decides the channel with the same function the
// surfacing predicate reads, so this component cannot show an anchor the counts
// exclude and cannot withhold one they include.
//
// Two channels, two elements, and the difference between them is the whole point. A
// blockquote asserts that these words are in the answer, so only a resolved quotation
// gets one. A record-level absence has no words and no position, so it renders as a
// note about the record — outside any quotation, outside any span, and outside the
// document body. A finding about something an answer never said has nowhere in that
// answer to point, and a caret, an offset, or a nearest sentence supplied here would
// be the renderer manufacturing evidence the record does not hold.
//
// A null channel renders nothing. That is an anchor no surface may show: a quotation
// that did not resolve, or an absence on a role its shape does not surface.
//
// The dispatch is over the descriptor's own anchors, so a shape with one anchor and a
// shape with two both render here with no edit. Nothing in this component names a
// role, a status, a shape, or a class.
// The mark number rides both elements, because both are marks. It is the same number
// the body prints over the same words, and on the channel that has no position in the
// body it is the only place the number appears — which is what keeps a record-level
// absence a numbered part of the account rather than a footnote to the marks that
// happened to land in the text.
function FindingEvidence({ anchor, mark }) {
  if (!anchor) return null;
  if (anchor.channel === ANCHOR_CHANNEL.QUOTED_SPAN) {
    return (
      <blockquote className="wb-measure__anchor" data-anchor-channel={anchor.channel} data-mark={mark}>
        <MarkNumber n={mark} />
        {`"${anchor.quote}"`}
      </blockquote>
    );
  }
  if (anchor.channel === ANCHOR_CHANNEL.RECORD_LEVEL_ABSENCE) {
    return (
      <p className="wb-measure__absence" data-anchor-channel={anchor.channel} data-mark={mark}>
        <MarkNumber n={mark} />
        {RECORD_LEVEL_ABSENCE_NOTE}
      </p>
    );
  }
  return null;
}

// The run-specific question, promoted to the row that produced it.
//
// WHAT THIS FIXES. The Check Register generates a question per finding, and until
// now the only place to reach one was the register far below — so the fixed probe,
// which sits further down still, was what a person reached first. A register that
// named GI-bleed warning signs and phrased a question for them was routed past. The
// intelligence was on the page and the product walked over it. This puts the finding's
// own question one click from the finding.
//
// WHAT IT IS NOT. It does not advance the run. Copying here writes the question to the
// clipboard and stops; the paste box does not open, no stage changes, and the person
// carries the question to their own AI and comes back or does not. The two-question
// test below remains the one wired path into COMPARE, and its prompt is untouched.
//
// WHY A LINK AND NOT A BUTTON. The page has one filled-accent moment and it belongs to
// the primary CTA. Promoting this row action to a filled control would put a second
// one on the same screen and the accent would stop meaning anything. Ember text with a
// rule under it reads as the strongest thing in the row without competing with the
// page. It is a real <button> underneath, so it is keyboard-operable and announces as
// what it is.
//
// NO CARD, NO ELEMENT. Most findings never clear the both-ends-quotable rule, so most
// rows get nothing here — no placeholder, no disabled control, no focus stop, no
// spacing shell. A dangling id resolves to null and takes the same path, so a register
// that dropped a card between assembly and render degrades to silence rather than to a
// control that copies an empty string.
function FindingQuestion({ card, run }) {
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  if (!card || !(card.verification_question || "").trim()) return null;

  const copyQuestion = async () => {
    try {
      await navigator.clipboard.writeText(card.verification_question);
      setCopied(true);
      setCopyFail("");
      // The same event the register's own copy fires. One act, one name — a question
      // copied from the row and a question copied from the card are the same thing
      // happening, and splitting the event would split the count of it.
      emitReaderEvent(READER_EVENTS.TARGET_QUESTION_COPIED, { run, check: card.finding_type });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };

  return (
    <>
      {/* THE QUESTION ITSELF, where the finding is read. The row owned this string and
          showed a control that copied it; the words were legible only in the Check
          Register further down, so the one affordance here asked a person to take a
          question on trust and go elsewhere to learn what they had taken. R10 already
          requires the derived question to render as literal, selectable final text
          before any control that acts on it, and the span-directed site renders it that
          way; this is the same treatment on the surface that produced it.

          The string is card.verification_question verbatim — the register's own, not a
          second wording of it, so R22 sees one canonical question with two views and no
          new paraphrase. The label is the register's own too. No question is composed
          here and none is generated: a row with no card still renders nothing at all.

          GIVE-NOTHING-AWAY IS UNCHANGED. Showing the question is not asking it. Nothing
          here advances the run, opens the paste box, changes a stage, or sends anything;
          the copy control does what it did before and stops. */}
      <p className="wb-measure__question-text">
        <span className="wb-check__label">{CHECK_UI.labels.verification}</span>
        {card.verification_question}
      </p>
      <p className="wb-measure__question">
        <button
          type="button"
          className="wb-measure__question-link wb-focus"
          onClick={copyQuestion}
        >
          {copied ? CHECK_UI.copied_affordance : CHECK_UI.copy_affordance}
        </button>
        {copyFail ? (
          <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span>
        ) : null}
      </p>
    </>
  );
}

// One number, one element, everywhere a mark is named. The label is read and not
// seen, so a bare numeral never reaches a screen reader on its own.
// data-mark-number declares this subtree instrument chrome rather than answer text. The
// numeral's characters exist in the DOM and do not exist in the answer, so every offset
// walk in reader-span-selection.js skips it. It is an attribute rather than a class check
// because `wb-mark-n` is a styling hook: renaming it during a restyle would silently start
// counting numerals as answer characters and put every offset after a mark out of register.
//
// Item 1, R21+R17. `href` turns the numeral into the keyboard path from a mark to the
// explanation of it. aria-details already published that relationship, but a
// relationship a browser exposes only to assistive technology is not a path a keyboard
// can walk: a sighted keyboard reader could see the numeral and had no way to reach
// what it stood for. A link is the oldest keyboard-operable form of exactly this
// relationship and it needs no script, so a mark reaches its explanation with Enter.
//
// Only the marks IN THE ANSWER carry an href. The numerals repeated beside each
// quotation in the list get none: they are already inside the explanation, a link back
// to the words would be a second path to a place the reader just came from, and every
// one of them would be another tab stop between a person and the next finding.
//
// CORRECTION TO THE RECORD. The build-1 commit acccb03 described this anchor as
// "focusable but not a tab stop". That is wrong, and the sentence has been repeated
// since. An `<a href>` carrying no tabindex is a NATURAL SEQUENTIAL TAB STOP, and
// nothing here removes it from the focus order: there is no tabindex attribute on this
// element at all. Measured on single-findings at 1440 in the pinned renderer, the two
// in-answer numerals report tabIndex 0 and sit at sequential positions 20 and 21 of the
// 67 sequential stops on that page. What is true is the narrower claim the paragraph
// above makes: the numerals in the findings list add no further stops, so the number of
// stops the answer contributes is the number of marks and not a multiple of it.
//
// Being a tab stop is permitted rather than merely tolerated. R21 requires the
// mark-to-explanation relationship to be programmatically determinable and keyboard
// operable, and says only that every inline mark need not become an individual tab stop
// where an equivalent mechanism exists; section 7 risk 6 names the opposite reading,
// treating one-stop-per-mark as a defect, as accessibility overcorrection. Doctrine
// permits either. This surface chose the stop.
//
// draggable={false} because this element sits inside the span-selection surface. A
// bare anchor answers a press-and-drag with a link drag, which would take the gesture
// that selects a passage and spend it on dragging a URL.
function MarkNumber({ n, href }) {
  if (!n) return null;
  const inner = (
    <>
      <span className="wb-mark-n__label">mark </span>
      {n}
    </>
  );
  if (!href) {
    return (
      <span className="wb-mark-n" {...{ [MARK_NUMBER_ATTR]: "" }}>
        {inner}
      </span>
    );
  }
  return (
    <a className="wb-mark-n wb-mark-n--path wb-focus" href={href} draggable={false} {...{ [MARK_NUMBER_ATTR]: "" }}>
      {inner}
    </a>
  );
}

// What appears when a person has selected words in the answer.
//
// THE PRODUCER IS THE PERSON. Nothing here is offered until a selection exists. That is
// the whole basis of the carve-out from the do-not-build list's ban on AI-suggested chips:
// a suggestion arrives unasked, and this cannot arrive until someone has dragged a cursor.
//
// WHERE IT SITS, AND WHY NOT FLOATING. "Adjacent to the selection" would most literally
// mean a popover positioned off the selection's client rect. It renders here instead, in
// flow, directly beneath the body. A popover positioned from getBoundingClientRect couples
// its position to scroll offset and sub-pixel layout, and the acceptance board photographs
// this surface — an element whose position is measured at paint time is exactly the shape
// that produces an intermittent, unattributable frame difference, which CLAUDE.md makes a
// STOP rather than an acceptance. Flow position is deterministic. Recorded as a deliberate
// deviation, not an oversight.
//
// NOTHING IS RECORDED. No event, no telemetry, no fetch, no model call. Copying writes to
// the clipboard and stops.
function SpanAffordances({ span, answer, reading, findings, cardsById }) {
  const [copiedKey, setCopiedKey] = useState("");
  const [copyFail, setCopyFail] = useState("");
  if (!span) return null;

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setCopyFail("");
      setTimeout(() => setCopiedKey(""), 1800);
    } catch {
      setCopyFail(SPAN_UI.copy_failed);
      setTimeout(() => setCopyFail(""), 2200);
    }
  };

  // One decision per mode. Kind is mode-independent for every branch except COMPOSE, so
  // the first result names the state and the per-mode results carry the composed messages.
  const offers = SPAN_AFFORDANCES.map((a) => ({
    ...a,
    action: resolveSpanAction({ span, reading, findings, cardsById, mode: a.mode, answer }),
  }));
  const kind = offers.length ? offers[0].action.kind : SPAN_ACTION.NONE;
  if (kind === SPAN_ACTION.NONE) return null;

  // The attribution line. Exactly one short line, local to the affordances, never a block
  // or a panel. It is deliberately NOT styled like a mark: the surrounding body is full of
  // highlights Imbas placed, and a person who just dragged across words has to be able to
  // tell their own highlight from the instrument's. Says what the person did first, then
  // the boundary.
  const attribution = <p className="wb-span__attribution">{SPAN_UI.attribution}</p>;

  if (kind === SPAN_ACTION.NARROW) {
    // No affordance that picks a card. Two findings are two things to ask about, and
    // choosing one would be the surface deciding which the person meant. One line, the
    // count, and the ask.
    return (
      <div className="wb-span" role="group" aria-label={SPAN_UI.attribution}>
        <p className="wb-span__narrow">{offers[0].action.line}</p>
        {attribution}
      </div>
    );
  }

  if (kind === SPAN_ACTION.QUESTION) {
    // The register already has a question about these words. It re-enters verbatim; no
    // second question is composed about a passage the register covers.
    const { question } = offers[0].action;
    return (
      <div className="wb-span" role="group" aria-label={SPAN_UI.attribution}>
        <p className="wb-span__question">{question}</p>
        <p className="wb-measure__question">
          <button
            type="button"
            className="wb-measure__question-link wb-focus"
            onClick={() => copy(question, "question")}
          >
            {copiedKey === "question" ? CHECK_UI.copied_affordance : CHECK_UI.copy_affordance}
          </button>
          {copyFail ? (
            <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span>
          ) : null}
        </p>
        {attribution}
      </div>
    );
  }

  // COMPOSE. Two affordances, one per mode, each carrying its own composed message.
  return (
    <div className="wb-span" role="group" aria-label={SPAN_UI.attribution}>
      <p className="wb-span__actions">
        {offers.map((o) => (
          <button
            key={o.mode}
            type="button"
            className="wb-span__button wb-focus"
            onClick={() => copy(o.action.message, o.mode)}
          >
            {copiedKey === o.mode ? SPAN_UI.copied_affordance : o.label}
          </button>
        ))}
        {copyFail ? (
          <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span>
        ) : null}
      </p>
      {attribution}
    </div>
  );
}

// A proportional bar (the "Gap X-ray") stood here, with one segment per class, over a
// paired tally that stood beside it. Both are gone. The bar drew the delta's shape as
// a ratio between the three class names, which is a claim about proportions the run
// never measured — a decorative element cannot be aria-hidden and still be the thing
// a person reads the result off. The rows carry each difference with the words from
// both answers, and the count above them states how many there are.

// The three labels on a delta row. Two name an answer and sit above a quotation the
// server resolved; this one names the Reader and sits above a sentence the Reader
// wrote. Labelling it is how a person can tell the evidence from the reading of it.
const PAIRED_READING_LABEL = "The Reader's reading";

function quotedAnchorText(finding, role) {
  const a = finding.anchors.find((x) => x.role === role && x.status === ANCHOR_STATUS.QUOTED);
  return a ? a.quote : "";
}

// What a person sees when an older record replays. It names the limit plainly and
// does not dress it up: the readings are still worth showing, the excerpts are not
// verifiable, and this build will not print them as if they were.
function legacyPairedNotice(version) {
  const v = (version || "").trim();
  const which = v ? `an earlier method (${v})` : "an earlier method";
  return `The Reader measured this pair under ${which} that did not check quotations against the answers. Its readings are below. Its excerpts are withheld.`;
}

// Reader v2 P2 (Phase B) — the delta view. Renders the paired analysis returned by
// /api/read-paired: the itemized delta (each difference classified Omission /
// Framing Drift / Deflection, quoted from both answers where a span applies), the
// count of what survived the surfaced predicate, then the paired receipt to
// download. Reuses the measurement panel's idioms so the paired result reads as the
// same instrument. Shows an idempotent-replay note and a capture-uncertain note when
// the response carries them.
//
// There is no score on this surface. It used to open with a "Machine gap estimate"
// of N of 3, and the estimate drove the headline, the tag, the chips and the copied
// card beneath it. A 0-3 figure over a single answer pair is not a measurement a
// reader can check: it has no unit, no denominator anyone can inspect, and it
// compressed a set of quoted, individually verifiable rows into one number that
// looked more authoritative than the rows it summarized. What replaces it is the
// count of differences that survived the surfaced predicate — a number with a
// declared unit that a reader can verify by counting the rows on screen.
//
// At paired_method_version 2.0 every row, every quotation and the tally come from the
// canonical result's probe_surfaced_differences subset, and a quotation is text the
// server resolved to an exact span in the answer it names. A record written under an
// earlier method has no canonical result, so it renders through the legacy branch:
// its readings show, its excerpts do not, and it contributes no tally. It is neither
// upgraded nor trusted.
function PairedDeltaView({ paired, pair, openReceipt, onReset, run, check, onTryCleaner }) {
  const canonical = paired.result || null;
  const legacy = !canonical;
  const legacyItems = legacy && Array.isArray(paired.delta_items) ? paired.delta_items : [];

  // One row shape, two producers. Only the canonical producer can yield a quotation;
  // the legacy producer yields none, by construction rather than by discipline.
  const rows = canonical
    ? selectSubset(canonical, "probe_surfaced_differences")
        .map(describeFinding)
        .map((f) => ({
          key: f.id,
          signal: f.class_display,
          reading: f.statement,
          openQuote: quotedAnchorText(f, ARTIFACT_ORIGINAL),
          probeQuote: quotedAnchorText(f, ARTIFACT_TARGETED),
        }))
    : legacyItems.map((d, i) => ({
        key: `legacy.${i}`,
        signal: (d.signal_pattern || "").trim(),
        reading: (d.point || "").trim(),
        openQuote: "",
        probeQuote: "",
      }));

  // Run-the-pair v1: when the capture didn't come through as matched conditions
  // (a different model, a disclosed edit, or a setup the person wasn't sure about),
  // the same one-function rule that governs the review record fires the warning here
  // on the side-by-side. pairConditionsUnmatched keys off conditions_matched != true,
  // so the rule can never drift between this surface and the exported pair_runs entry.
  const capture = pair && pair.capture;
  const unmatched = pairConditionsUnmatched(capture);

  // The machine SUGGESTS a state from the paired measurement; the person can correct
  // it with one tap, and the correction is what gets recorded (reader-paired.js law).
  // Suggested from the canonical count, not the score: the same three states, keyed to
  // the differences that survived the surfaced predicate, so the suggested state and
  // the count the reader sees answer to one number. A legacy record has no canonical
  // result, and reads as no surfaced differences — the state that claims least.
  const suggested = suggestLoopStateFromCanonical(canonical);
  const [userState, setUserState] = useState(suggested);

  // loop_completed is the north-star event: the second answer came back and was
  // classified. Fire once on mount with the machine-suggested state; a later human
  // correction is its own state_corrected event, never a second completion.
  //
  // surfaced_differences is the canonical count — the number this surface now renders
  // and suggests from. `gap` is retained as a legacy analytics field so the existing
  // funnel series does not break mid-flight; it drives no render, no label and no
  // receipt claim, and nothing on this surface reads it back.
  useEffect(() => {
    emitReaderEvent(READER_EVENTS.LOOP_COMPLETED, {
      run,
      state: suggested,
      check,
      surfaced_differences: countOf(canonical, "probe_surfaced_differences"),
      gap: paired.gap_estimate,
      source: paired.source,
      idempotent: paired.idempotent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const correctTo = (next) => {
    if (next === userState) return;
    emitReaderEvent(READER_EVENTS.STATE_CORRECTED, { run, from_state: userState, to_state: next, check });
    setUserState(next);
  };

  // The reveal copy is resolved from the state AND the one `unmatched` determination
  // above, so the headline and the construct tag answer to the same flag that fires
  // the badge and the warning. Under unmatched conditions the construct-asserting
  // headlines are replaced with the descriptive one and no tag renders — the notice
  // no longer sits between a headline and a tag that assert what it retracts.
  const copy = loopRevealCopy(userState, unmatched);
  const primary = rows[0] || {};
  // The two panels are the evidence (the two answers' relevant spans); the state is
  // the reading. A missing span on either side reads as "Didn't come up." — which is
  // exactly the STILL MISSING case (no delta -> both sides empty -> both panels blank).
  // A legacy record has no resolved span at all, so it renders the notice instead:
  // "didn't come up" would be a claim about the answers this build cannot support.
  const firstText = (primary.openQuote || "").trim() || LOOP_DIDNT_COME_UP;
  const secondText = (primary.probeQuote || "").trim() || LOOP_DIDNT_COME_UP;
  const legacyNotice = legacyPairedNotice(paired.paired_method_version);
  const firstPanel = (
    <div className="wb-loop__panel wb-loop__panel--first" key="first">
      <span className="wb-loop__panel-label">{LOOP_PANEL_FIRST_LABEL}</span>
      <p className="wb-loop__panel-body">{firstText}</p>
    </div>
  );
  const secondPanel = (
    <div className="wb-loop__panel wb-loop__panel--second" key="second">
      <span className="wb-loop__panel-label">{LOOP_PANEL_SECOND_LABEL}</span>
      <p className="wb-loop__panel-body">{secondText}</p>
    </div>
  );
  const panels = copy.swapPanels ? [secondPanel, firstPanel] : [firstPanel, secondPanel];

  const openRunId = (paired.receipt && paired.receipt.paired_analysis && paired.receipt.paired_analysis.open_run_id) || run || "";
  const generatedAt = (paired.receipt && paired.receipt.generated_at) || "";
  const dateStr = generatedAt ? String(generatedAt).slice(0, 10) : "";
  const smallPrint = [openRunId ? `Run ${openRunId}` : "", dateStr, LOOP_CONDITIONS_LINE].filter(Boolean).join(" · ");

  return (
    <div className="wb-act2__delta wb-loop wb-scroll-anchor">
      {paired.idempotent ? (
        <p className="wb-act2__notice" role="status">You already ran this pair. This is the analysis from that run.</p>
      ) : null}
      {paired.capture_uncertain ? (
        <p className="wb-act2__notice" role="status">The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy.</p>
      ) : null}

      {/* The --legacy modifier carries no styling of its own and is not meant to: it
          names which notice this is, so the acceptance harness can point a camera at
          it. Three notices can stack here and they are otherwise indistinguishable in
          the DOM, and a legacy capture that frames the wrong one silently proves
          nothing. */}
      {legacy ? (
        <p className="wb-act2__notice wb-act2__notice--legacy" role="status">{legacyNotice}</p>
      ) : null}

      {/* The reveal — the hero. Machine suggests; the person corrects with one tap. */}
      <div className="wb-loop__reveal">
        <h3 className="wb-loop__headline">{copy.headline}</h3>
        {legacy ? null : <div className="wb-loop__panels">{panels}</div>}
        {unmatched ? (
          <div className="wb-loop__unmatched" role="note">
            <span className="wb-loop__unmatched-badge">{PAIR_CAPTURE_UI.unmatched_badge}</span>
            <p className="wb-loop__unmatched-warning">{PAIR_CAPTURE_UI.unmatched_warning}</p>
          </div>
        ) : null}
        {/* Two different facts, deliberately side by side. The callout above reports what
            the person told us about the capture; this reports what the canonical record
            can stand on. They can differ — someone can declare matched conditions on a
            run whose record carries no observed basis — and that difference is exactly
            what a reader needs to see. */}
        <ClaimStateRow canonical={canonical} />
        {copy.tag ? <p className="wb-loop__tag">{copy.tag}</p> : null}

        {userState === LOOP_STATE_STILL_MISSING && copy.cta ? (
          <div className="wb-action-row wb-loop__cta-row">
            <Btn kind="ghost" small onClick={onReset}>{copy.cta}</Btn>
          </div>
        ) : null}
        {userState === LOOP_STATE_NOT_CLEAR && copy.cta && check === CHECK_QUICK && onTryCleaner ? (
          <div className="wb-action-row wb-loop__cta-row">
            <Btn kind="ghost" small onClick={onTryCleaner}>{copy.cta}</Btn>
          </div>
        ) : null}

        <div className="wb-loop__correct" role="group" aria-label="Mark what you actually saw">
          <span className="wb-loop__correct-label">Read it differently?</span>
          {LOOP_STATES.map((s) => (
            <button
              key={s}
              type="button"
              className={`wb-loop__chip${s === userState ? " is-active" : ""}`}
              aria-pressed={s === userState}
              onClick={() => correctTo(s)}
            >
              {(LOOP_STATE_COPY[s] || {}).chip || s}
            </button>
          ))}
        </div>

        <p className="wb-loop__smallprint">{smallPrint}</p>
        {/* smallPrint stays as it is: it is also the caption on the shareable card, so
            it carries the run id and date and nothing more. The strip is the full
            account, and it carries the paired method version the card has no room for. */}
        <ProvenanceStrip
          canonical={canonical}
          declaredModel={openReceipt?.open_run?.declared_model}
          capturedAt={generatedAt}
          pairedMethodVersion={paired.paired_method_version}
        />
        <p className="wb-reader-result__trust wb-measure__boundary">{RECEIPT_BOUNDARY}</p>
      </div>

      {/* Where the 0-3 estimate used to sit. The count names its unit and comes from
          the same canonical selector that produces the rows below, so a reader can
          check it by counting them. A legacy record cannot be counted under the
          current predicate, and says so rather than printing a zero it did not
          measure. estimate_rationale is not rendered here: it is one line of model
          prose written to justify the estimate, and the estimate is gone. */}
      <div className="wb-measure__estimate wb-act2__estimate">
        <div className="wb-measure__estimate-value">
          {canonical
            ? `${countLabel(canonical, "probe_surfaced_differences")} surfaced`
            : "Not counted under the current method"}
        </div>
        <p className="wb-measure__estimate-why">
          {canonical
            ? "Differences the second answer surfaced that the Reader could quote from both answers."
            : "This record was written under an earlier method. Its readings show; its excerpts and count do not."}
        </p>
      </div>

      <div className="wb-reader-result__sections">
        <article className="wb-reader-result__section">
          {/* Was "The delta". Delta is a word from the data model, and it is the
              heading over the one thing the whole surface exists to show. */}
          <h3 className="wb-reader-result__section-title">What the second answer added</h3>
          {/* The proportional bar and the per-class tally that stood here are gone.
              The count above this section states how many differences surfaced, and
              each row below names its own signal and quotes both answers. */}
          {rows.length ? (
            <ol className="wb-measure__list">
              {rows.map((r) => (
                <li key={r.key} className="wb-measure__finding">
                  <span className="wb-measure__finding-type">{r.signal}</span>
                  {/* The Reader's reading, labelled as such. It is the one line here
                      the model wrote, so it never sits inside quotation marks. */}
                  <span className="wb-act2__reading-label">{PAIRED_READING_LABEL}</span>
                  <p className="wb-measure__finding-why wb-act2__reading">{r.reading}</p>
                  {r.openQuote ? (
                    <blockquote className="wb-measure__anchor wb-act2__side">
                      <span className="wb-act2__side-label">First answer</span>
                      {`"${r.openQuote}"`}
                    </blockquote>
                  ) : null}
                  {r.probeQuote ? (
                    <blockquote className="wb-measure__anchor wb-act2__side wb-act2__side--targeted">
                      <span className="wb-act2__side-label">Second answer</span>
                      {`"${r.probeQuote}"`}
                    </blockquote>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            // The prior line opened with a bare verdict on the pair and then read as a
            // closed account of what was there to find. What the run supports is
            // narrower still, and it is about the probe rather than about the answers.
            // The conditions are not restated here: the claim row above already carries
            // them, and repeating the record on the surface is how a plain line turns
            // back into a paragraph nobody finishes.
            <p className="wb-reader-result__empty">{PAIRED_EMPTY_CLOSE}</p>
          )}
          {/* The close. `canonical && rows.length` is the whole gate, and every exclusion
              the line needs falls out of those two terms — see the gate proof in
              test/reader-paired-value-close.test.mjs, which walks each excluded state to
              the term that stops it. A legacy record has no canonical block, so the first
              term is false. An empty pair, an unavailable answer, and a noncanonical
              result all reach zero rows. What the gate cannot check is that the second
              answer came from the fixed probe, because the product supplies the probe but
              the person supplies the paste; the line survives that because it claims the
              product asked, not that the person could not have. */}
          {canonical && rows.length ? <p className="wb-act2__close">{PAIRED_VALUE_CLOSE}</p> : null}
        </article>
      </div>

      {/* Render-only interpretation of the pair just shown. Keyed off the same state
          the side-by-side already carries: one pair_run ([pair]), the delta_items as
          findings, and conditions_matched (so the S5 wrapper fires exactly when the
          UNMATCHED CONDITIONS callout above fires — the panel adds interpretation
          beside that callout, never a second copy of it). Perturbs no record. */}
      {/* A paired inspection produces a delta, never checks, so the Check Register and its
          copy-the-question control cannot render here at all — checks and followUp are
          structurally false for every paired run. The three controls below this panel are
          unconditional: the receipt actions, the Review Record export, and Test another
          answer. */}
      <InspectionMeaningPanel
        pairRuns={[pair]}
        findings={rows}
        conditionsMatched={capture ? capture.conditions_matched : undefined}
        available={{ checks: false, reviewRecord: true, receipt: true, followUp: false, restart: true }}
      />

      <p className="wb-measure__unvalidated">
        These are machine observations over one answer pair. Not a human-scored result, not evidence.
      </p>
      <p className="wb-reader-result__trust wb-measure__boundary">{RECEIPT_BOUNDARY}</p>

      {/* Both of these put the two answers' text in front of someone else — the card
          as an image, the share as a public page. Neither is offered for a legacy
          record, because this build cannot say the excerpts it holds are real. */}
      {legacy ? null : (
        <InspectionCardAction
          state={userState}
          copy={copy}
          firstText={firstText}
          secondText={secondText}
          smallPrint={smallPrint}
          run={openRunId}
          check={check}
        />
      )}

      <ReaderReceiptActions receipt={paired.receipt} formatter={formatPairedReceiptText} filePrefix="imbas-reader-paired-receipt" />

      {/* Run-the-pair v1: the paired inspection exports as a ReviewRecord with the
          SECOND answer stored as a targeted_answer Artifact and one schema PairRun
          carrying the capture block (mode = paired). No checks ride along — the paired
          inspection produces a delta, not comparative checks (schema Checks from paired
          findings are v1.1). The single-mode export lives on the Check Register panel. */}
      <ReviewRecordExport result={{ receipt: openReceipt }} statuses={{}} pair={pair} variant="paired" />

      {legacy ? null : <ReaderShareAction mode="paired" receipt={paired.receipt} />}

      <PerceptionTap mode="paired" receipt={paired.receipt} />

      <div className="wb-action-row wb-act2__reset-row">
        <Btn kind="ghost" small onClick={onReset}>Test another answer</Btn>
      </div>
    </div>
  );
}

// Turn a paired run failure into one honest line. Prefer the server's own message
// (capacity / unavailable / analysis_failed all already say the first read is safe);
// fall back to a network line. Never surfaces a raw status code.
function pairedRunErrorCopy(err) {
  const msg = err && err.info && typeof err.info.message === "string" ? err.info.message.trim() : "";
  if (msg) return msg;
  return "The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly.";
}

// Reader v2 P2 (Phase B) — the paired test. Mounts under the Act 2 offer: a paste
// box for the second answer (same caps + escaping as the first paste, via
// PasteField), a compare button disabled while in flight (the client half of the
// double-submit guard; the server's idempotency lookup is the other half), then the
// delta view. Failure isolation: a failed second read only sets a local error and
// leaves the first read and its receipt untouched, so Act 2 can be retried.
function PairedTest({ openReceipt, run, check, onTryCleaner, onPairedChange, inputRef }) {
  const [targeted, setTargeted] = useState("");
  const [busy, setBusy] = useState(false);
  const [paired, setPaired] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const [runError, setRunError] = useState("");
  // Capture discipline (run-the-pair v1): how the person ran the two answers. Each
  // stays unset until tapped; an untouched question derives conditions_matched =
  // "unverified" (never invented as a positive claim). Never gates the compare — the
  // loop always completes (schema §1). buildPairCapture owns the conservative rule.
  const [sameModel, setSameModel] = useState(null);
  const [modelVersion, setModelVersion] = useState("");
  const [edits, setEdits] = useState(null);

  // The parent's delta flag is REPORTED from here, not latched by the caller, because
  // `paired` is the only authoritative answer to "is there a delta on screen" and it lives
  // in this component.
  //
  // The seam this closes: Act2Offer mounts this component under `key={check}`, and the
  // Quick/Cleaner toggle stays on screen after a comparison returns — PairedDeltaView even
  // offers its own "try the cleaner check" control, which calls back up to setCheck. So a
  // tap on either one changes the key and React remounts this component with `paired` back
  // to null. The delta is gone and the paste box is live again. When the flag was raised
  // once inside submit() and lowered only inside reset(), nothing in that path lowered it:
  // the workbench went on deriving STAGE_DELTA, which declares `answerEntry: null` and
  // lists the paired answer as read-only context, over a stage that was in fact showing a
  // live, editable paired answer box. That is the one-live-answer-input invariant broken by
  // a boolean that outlived the state it described.
  //
  // Reporting it from an effect on `paired` fixes it at the cause: a remount runs this with
  // `paired` null and tells the parent so, a returned comparison tells the parent so, and a
  // reset tells the parent so. The flag can no longer describe a delta that is not there.
  useEffect(() => {
    if (onPairedChange) onPairedChange(!!paired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!paired]);

  if (!openReceipt) return null;
  const hasAnswer = !!targeted.trim();
  // Same derived gate as the primary compose: the second answer meets the same ceiling
  // at the same endpoint, so it gets the same preflight rather than a round trip.
  const answerOverMax = answerWordState(targeted).over;

  // The capture the side-by-side and the review record both key off. Built from the
  // three loose-voice inputs; the second answer is stored verbatim as pasted. The
  // paired inspection ran on the production model under paired_method_version — a
  // populated pair_runs array is the schema's mode=paired marker.
  const capture = buildPairCapture({ same_model: sameModel, model_version: modelVersion, edits });
  // What the person DECLARED, kept apart from what the capture above DERIVES from it.
  //
  // Loose values plus the stage they were given at, not a finished artifact. The tab
  // says what the person reported and where in the flow they reported it; the server
  // stamps identity, schema, and receipt time, because those are facts about the RECORD
  // and this tab is not the record. The form collects no client-side declaration time,
  // so declared_at_client resolves to NOT_CAPTURED rather than being backfilled from
  // any other clock.
  //
  // No declaration_id is sent, deliberately. The server derives one from the declared
  // content, which makes it stable across a retry: a browser that re-sends after a
  // timeout produces the same id and gets the same row back. A client-minted random id
  // would produce a twin and put a correction in the record that nobody made.
  const declaration = {
    same_model: sameModel,
    model_version: modelVersion,
    edits,
    stage: DECLARATION_STAGE.SUBMISSION,
  };
  const openRun = (openReceipt && openReceipt.open_run) || {};
  const readerModel = (openRun.provenance && openRun.provenance.reader_model_version) || "";
  const pair = {
    targeted_answer: targeted,
    targeted_prompt: (paired && paired.targeted_prompt) || TARGETED_PROMPT_TEXT,
    // The receipt already carries the sha256 of the verbatim probe; thread it so the
    // review record binds the exact prompt text (schema v0.3.1, never recomputed here).
    targeted_prompt_hash:
      (paired && paired.receipt && paired.receipt.paired_analysis && paired.receipt.paired_analysis.targeted_prompt_hash) ||
      "",
    capture,
    // The declarations the SERVER has recorded for this pair, oldest first. Only the
    // server's copies go into the record: they carry identity and receipt time, which
    // this tab cannot know, and the record is a claim about what was stored rather than
    // about what was typed. Before the run returns there is nothing stored, so the list
    // is empty and the record says the pair carries no declaration — which is true at
    // that moment.
    declarations: (paired && paired.run_declarations) || [],
    targeted_source_model: {
      name: sameModel === PAIR_SAME_MODEL.YES ? (openRun.declared_model || "") : "",
      version: modelVersion.trim(),
    },
    inspector: { model: readerModel, model_version: readerModel, prompt_version: PAIRED_METHOD_VERSION },
  };

  const touch = (v) => {
    setTargeted(v);
    if (fieldError) setFieldError("");
    if (runError) setRunError("");
  };

  // Clearing `paired` is what lowers the parent's delta flag, via the effect above.
  const reset = () => {
    setPaired(null);
    setTargeted("");
    setFieldError("");
    setRunError("");
    setSameModel(null);
    setModelVersion("");
    setEdits(null);
  };

  const submit = async () => {
    if (busy) return;
    if (!hasAnswer) {
      setFieldError("Paste the answer your AI gave the direct question.");
      return;
    }
    if (answerOverMax) {
      setFieldError(secondAnswerOverMaxNotice(targeted));
      return;
    }
    setFieldError("");
    setRunError("");
    setBusy(true);
    emitReaderEvent(READER_EVENTS.LOOP_RETURNED, { run, check });
    try {
      // The delta replaces this paste box, so the stage moves. It lands async but the
      // person's "Compare the two answers" click is what initiated it — one action, one
      // stage change, one event. Setting `paired` is the whole of it: the effect above
      // reports the stage change from the state that caused it.
      const data = await runPairedReader(openReceipt, targeted, declaration);
      setPaired(data);
    } catch (err) {
      const info = (err && err.info) || {};
      if (err && err.status === 400 && info.error === "too_long") {
        // The second-answer sentence, because the gate this hits is the one on
        // targeted_answer. The preflight over this same box already says "Second
        // answer"; warning and rejecting under two different subjects made one box
        // describe itself two ways.
        setFieldError(SECOND_ANSWER_TOO_LONG_MESSAGE);
      } else if (err && err.status === 400 && info.error === "empty") {
        setFieldError("That's too short to compare. Paste the full answer.");
      } else if (err && err.status === 400) {
        setRunError("This inspection can't run the two-question test. Re-run the answer above, then try again.");
      } else {
        setRunError(pairedRunErrorCopy(err));
      }
    } finally {
      setBusy(false);
    }
  };

  if (paired) {
    return (
      <div className="wb-act2__test">
        <PairedDeltaView paired={paired} pair={pair} openReceipt={openReceipt} onReset={reset} run={run} check={check} onTryCleaner={onTryCleaner} />
      </div>
    );
  }

  return (
    <div className="wb-act2__test">
      <PasteField
        label="Answer to the direct question"
        overMaxNotice={secondAnswerOverMaxNotice}
        value={targeted}
        onChange={touch}
        error={fieldError}
        placeholder="Paste what your AI came back with…"
        minAckLength={1}
        inputRef={inputRef}
      />

      <div className="wb-act2__capture" role="group" aria-label="How you ran the two answers">
        <p className="wb-act2__capture-heading">{PAIR_CAPTURE_UI.heading}</p>
        <p className="wb-act2__capture-intro">{PAIR_CAPTURE_UI.intro}</p>

        <fieldset className="wb-act2__capture-q">
          <legend className="wb-act2__capture-label">{PAIR_CAPTURE_UI.same_model.question}</legend>
          <div className="wb-act2__capture-opts">
            {[PAIR_SAME_MODEL.YES, PAIR_SAME_MODEL.NO, PAIR_SAME_MODEL.NOT_SURE].map((v) => (
              <button
                key={v}
                type="button"
                className={`wb-act2__capture-opt${sameModel === v ? " is-active" : ""}`}
                aria-pressed={sameModel === v}
                onClick={() => setSameModel(v)}
              >
                {PAIR_CAPTURE_UI.same_model.options[v]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="wb-act2__capture-q">
          <label className="wb-act2__capture-label" htmlFor="wb-pair-model">{PAIR_CAPTURE_UI.model_version.question}</label>
          <span className="wb-act2__capture-hint">{PAIR_CAPTURE_UI.model_version.hint}</span>
          <input
            id="wb-pair-model"
            type="text"
            className="wb-act2__capture-input"
            value={modelVersion}
            maxLength={80}
            placeholder={PAIR_CAPTURE_UI.model_version.placeholder}
            onChange={(e) => setModelVersion(e.target.value)}
          />
        </div>

        <fieldset className="wb-act2__capture-q">
          <legend className="wb-act2__capture-label">{PAIR_CAPTURE_UI.edits.question}</legend>
          <div className="wb-act2__capture-opts">
            {[PAIR_EDITS.NONE, PAIR_EDITS.EDITED].map((v) => (
              <button
                key={v}
                type="button"
                className={`wb-act2__capture-opt${edits === v ? " is-active" : ""}`}
                aria-pressed={edits === v}
                onClick={() => setEdits(v)}
              >
                {PAIR_CAPTURE_UI.edits.options[v]}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="wb-act2__capture-disclosure">{PAIR_CAPTURE_UI.disclosure}</p>
      </div>

      <div className="wb-action-row wb-act2__test-cta">
        <Btn
          kind="primary"
          disabled={busy || !hasAnswer || answerOverMax}
          onClick={submit}
          className={`wb-reader-cta${hasAnswer && !answerOverMax && !busy ? " is-armed" : ""}${busy ? " is-inspecting" : ""}`}
        >
          {busy ? "Comparing…" : "Compare the two answers"}
        </Btn>
      </div>
      {runError ? <p className="wb-act2__run-error" role="status">{runError}</p> : null}
    </div>
  );
}

// Reader v2 P2 (Phase A) — the Act 2 offer. Sits one scroll below the measurement
// panel: after the single-answer read, offer the direct question built from the
// candidate missing items so the user can run it on their own AI (design §1). Two
// states only: the live offer (a targeted prompt to copy) when there is a missing
// item AND spend capacity, or a plain try-again-shortly when a second read would not
// clear the observable capacity (design §8). Renders nothing otherwise — no
// measurement, or a clean/framing-only answer with nothing to probe — so its absence
// never degrades Act 1. The paste box + paired analysis mount at the seam below.
// Check Register v1 (Reader v3 R3) — one finding-derived comparative check card.
// Each card points at a single place where a later output in the answer rests on an
// earlier proposition in the SAME answer — both quoted verbatim — and hands over a
// copyable, non-leading verification question. It is a provisional pointer, never a
// verdict. The head carries family + detector id + provisional status so a card
// screenshotted in isolation still shows its provenance (AT-6). The status control
// (open / resolved / set aside) is client-side only — no server persistence.
// Copying the question fires target_question_copied; marking the check resolved
// fires loop_completed once — so a completed check-loop counts toward the north-star
// exactly like the Confirmation Loop.
function CheckCard({ card, run, status, onStatus }) {
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  const completedRef = useRef(false);
  const labels = CHECK_UI.labels;

  const copyQuestion = async () => {
    try {
      await navigator.clipboard.writeText(card.verification_question || "");
      setCopied(true);
      setCopyFail("");
      emitReaderEvent(READER_EVENTS.TARGET_QUESTION_COPIED, { run, check: card.finding_type });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };

  const setStatusTo = (next) => {
    if (next === status) return;
    // Status is lifted to the register panel so the review-record export reflects it;
    // this card stays the control surface. No server persistence — client state only.
    onStatus(card.id, next);
    // A completed loop is the person closing the check after running it. Fire once
    // per card — reopening and re-resolving is not a second completion.
    if (next === "resolved" && !completedRef.current) {
      completedRef.current = true;
      emitReaderEvent(READER_EVENTS.LOOP_COMPLETED, { run, check: card.finding_type, state: "resolved" });
    }
  };

  return (
    <li className={`wb-check wb-check--${status}`}>
      <div className="wb-check__head">
        <span className="wb-check__family">{card.family}</span>
        <span className="wb-check__detector">{card.detector_id}</span>
        <span className="wb-check__finding">{card.finding_label}</span>
        <span className="wb-check__provisional">{card.provisional_label}</span>
      </div>

      <div className="wb-check__pair">
        <span className="wb-check__label">{labels.proposition}</span>
        <blockquote className="wb-check__quote">{card.proposition?.text}</blockquote>
      </div>
      <div className="wb-check__pair">
        <span className="wb-check__label">{labels.dependent}</span>
        <blockquote className="wb-check__quote">{card.dependent_output?.text}</blockquote>
      </div>
      <p className="wb-check__dependency">
        <span className="wb-check__label">{labels.dependency}</span> {card.dependency_statement}
      </p>

      <div className="wb-check__verify">
        <span className="wb-check__label">{labels.verification}</span>
        <p className="wb-check__question">{card.verification_question}</p>
        <div className="wb-check__actions">
          <Btn kind="primary" small className={copied ? "is-copied" : ""} onClick={copyQuestion}>
            {copied ? CHECK_UI.copied_affordance : CHECK_UI.copy_affordance}
          </Btn>
          <span className="wb-check__resolver">{card.resolver_label}</span>
          {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
        </div>
      </div>

      <div className="wb-check__status" role="group" aria-label="Status">
        <span className="wb-check__label">{labels.status}</span>
        {["open", "resolved", "dismissed"].map((s) => (
          <button
            key={s}
            type="button"
            className={`wb-check__status-opt${status === s ? " is-active" : ""}`}
            aria-pressed={status === s}
            onClick={() => setStatusTo(s)}
          >
            {CHECK_UI.status_labels[s]}
          </button>
        ))}
      </div>
    </li>
  );
}

// The Check Register panel: the top few cards by default, expandable to the full
// register. Renders nothing when the register carries no cards (the both-ends rule
// leaves most answers with none — silence, not an empty ceremony).
// The list is both the expand/collapse target and the strip's per-mark triage anchor.
// Written as a literal rather than read off RESULT_CAPABILITY_ANCHORS because the
// aria-controls contract in test/chip-door-contract.test.mjs resolves `const NAME =
// "literal";` and treats any form it cannot read as a failure — a reference it cannot
// resolve is a reference it cannot vouch for. The strip test asserts this equals the
// anchors map's triage entry, so the two still cannot drift apart.
const CHECKS_LIST_ID = "wb-checks-list";

function CheckRegisterPanel({ result }) {
  const reg = result?.checks;
  const run = result?.receipt?.open_run?.provenance?.request_id || "";
  const [showAll, setShowAll] = useState(false);
  // Client-held check status, lifted out of the cards so the review-record export
  // reflects every mark. Sparse: only touched cards appear; untouched checks keep
  // the register's "open". No server persistence — this map never leaves the tab.
  const [statuses, setStatuses] = useState({});
  const setStatus = (id, next) =>
    setStatuses((m) => (m[id] === next ? m : { ...m, [id]: next }));
  if (!reg || !Array.isArray(reg.cards) || reg.cards.length === 0) return null;
  const topN = reg.default_top_n || 3;
  const hasMore = reg.cards.length > topN;
  const cards = showAll ? reg.cards : reg.cards.slice(0, topN);
  return (
    <section
      id={RESULT_CAPABILITY_ANCHORS.checks}
      className="wb-reader-result is-agent wb-checks wb-scroll-anchor"
      aria-labelledby="wb-checks-heading"
    >
      <div className="wb-reader-result__head">
        <h2 id="wb-checks-heading" className="wb-reader-result__title">{CHECK_UI.register_heading}</h2>
      </div>
      <p className="wb-checks__note">{CHECK_UI.register_note}</p>
      {hasMore && !showAll ? <p className="wb-checks__eyebrow">{CHECK_UI.top_label}</p> : null}
      <ul id={CHECKS_LIST_ID} className="wb-checks__list wb-scroll-anchor">
        {cards.map((card) => (
          <CheckCard
            key={card.id}
            card={card}
            run={run}
            status={statuses[card.id] || card.status || "open"}
            onStatus={setStatus}
          />
        ))}
      </ul>
      {/* The list is what this button lengthens and shortens, so it names it and reports
          its own state. Without aria-expanded a screen reader heard "Show the full
          register (5)" and had no way to learn that pressing it had worked, or that the
          five were already showing. The same pattern the chip-lane toggle uses. */}
      {hasMore ? (
        <button
          type="button"
          className="wb-checks__more wb-focus"
          aria-expanded={showAll}
          aria-controls={CHECKS_LIST_ID}
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? CHECK_UI.collapse_label : `${CHECK_UI.expand_label} (${reg.cards.length})`}
        </button>
      ) : null}
      <ReviewRecordExport result={result} statuses={statuses} variant="single" />
      <p className="wb-reader-result__trust wb-checks__boundary">{RECEIPT_BOUNDARY}</p>
    </section>
  );
}

// Download the whole inspection as a ReviewRecord (the "Review Packet"): the pasted
// answer as an Artifact, the checks with their client-held status, the detector
// events, inspector provenance, versions, timestamps, a method note, and an
// unkeyed SHA-256 integrity digest over the record's canonical form. Built and
// hashed entirely in the tab and handed to the browser as a JSON file — no server
// round-trip, no persistence of the pasted answer anywhere. JSON only in v1.
// `variant` exists for one reason: a paired screen renders two of these, the
// single-mode control on the Check Register panel and the paired one below the delta.
// They are the same component and they say different things, and a harness aiming at
// ".wb-checks__export" gets whichever is first in the document. The modifier lets a
// camera name which one it means, the same way wb-act2__notice--legacy does.
function ReviewRecordExport({ result, statuses, pair = null, variant = "" }) {
  const [downloaded, setDownloaded] = useState(false);
  const [failMsg, setFailMsg] = useState("");
  const busyRef = useRef(false);
  const download = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const record = await buildReviewRecord({
        result,
        checkStates: statuses,
        createdAt: new Date().toISOString(),
        pair,
      });
      const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reviewRecordFilename(record);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      setFailMsg("");
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 1800);
    } catch {
      setFailMsg(REVIEW_RECORD_UI.download_error);
      setTimeout(() => setFailMsg(""), 2200);
    } finally {
      busyRef.current = false;
    }
  };
  return (
    <div
      /* Only the single-mode block is the strip's target; the paired one below the
         delta is a different control saying a different thing, and sharing an id
         would hand the jump to whichever rendered first. */
      id={variant === "single" ? RESULT_CAPABILITY_ANCHORS.reviewRecord : undefined}
      className={`wb-checks__export wb-scroll-anchor${variant ? ` wb-checks__export--${variant}` : ""}`}
    >
      <Btn kind="ghost" small className={downloaded ? "is-copied" : ""} onClick={download}>
        {downloaded ? REVIEW_RECORD_UI.downloaded_label : REVIEW_RECORD_UI.action_label}
      </Btn>
      {/* Generated from the fields assembleReviewRecord will actually write for THIS
          run, not a fixed line. A fixed line would advertise a paired capture on a
          single-answer record and checks on a record that carries none. */}
      <span className="wb-checks__export-hint">{describeReviewRecordContents({ result, pair })}</span>
      {failMsg ? <span className="wb-reader-result__copy-fail" role="status">{failMsg}</span> : null}
    </div>
  );
}

// The Inspection Meaning panel — one reusable, RENDER-ONLY interpretation block that
// sits beside the results and translates what the record ALREADY establishes into
// three short sections (What happened / Why this matters / What you can do next) plus
// the closing archive-boundary block. The copy is deterministic, selected by
// selectInspectionMeaning from existing inspection state (reader-explain-panel.js);
// this component invents no fact and touches no record. Nothing it renders enters the
// ReviewRecord, the canonical body, the digest, the receipt, or any export — it is
// presentation over existing state. aria-label (not a fixed id) because a single-mode
// and a paired instance can both be mounted, and a shared id would collide.
function InspectionMeaningPanel({ pairRuns = [], findings = [], conditionsMatched, available }) {
  const { state_id, copy } = selectInspectionMeaning({ pairRuns, findings, conditionsMatched, available });
  return (
    <section className="wb-explain" data-state={state_id} aria-label={copy.heading}>
      <h3 className="wb-explain__heading">{copy.heading}</h3>
      <div className="wb-explain__section">
        <span className="wb-explain__label">{copy.section_labels.what}</span>
        <p className="wb-explain__body">{copy.what}</p>
      </div>
      <div className="wb-explain__section">
        <span className="wb-explain__label">{copy.section_labels.why}</span>
        {copy.why.map((line, i) => (
          <p key={i} className="wb-explain__body">{line}</p>
        ))}
      </div>
      {/* Omitted, label and all, when no listed control rendered. An empty "What you can
          do next" heading would be its own small lie. */}
      {copy.next ? (
        <div className="wb-explain__section">
          <span className="wb-explain__label">{copy.section_labels.next}</span>
          <p className="wb-explain__body">{copy.next}</p>
        </div>
      ) : null}
      <p className="wb-explain__boundary">{copy.archive_boundary}</p>
      <p className="wb-explain__method">
        <a className="wb-explain__method-link" href={copy.method_link.href}>{copy.method_link.label} →</a>
      </p>
    </section>
  );
}

function Act2Offer({ result, open = false, onOpen, onPairedChange, pairedInputRef }) {
  const act2 = result?.act2;
  const run = result?.receipt?.open_run?.provenance?.request_id || "";
  const question = result?.receipt?.open_run?.question || "";
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  // How the person will run the second answer, stored as declared metadata (never
  // verified). Quick = the fixed probe alone, same chat. Cleaner = the original
  // scenario folded in front of the same probe, fresh chat. Both texts are
  // deterministic (reader-paired.js), so what they copy is what gets recorded.
  const [check, setCheck] = useState(CHECK_QUICK);
  // Fire once per reveal: the follow-up offer surfaced, and — if the metered
  // comparison lane is withheld — the capacity-degradation signal. Keyed on the
  // run id so a fresh result re-emits but a check toggle does not. Content-free.
  useEffect(() => {
    if (!act2 || !act2.eligible) return;
    emitReaderEvent(READER_EVENTS.FOLLOW_UP_REVEALED, { run });
    if (!act2.available) {
      emitReaderEvent(READER_EVENTS.CAPACITY_DEGRADATION, { run, reason: act2.degraded_reason || "spend_ceiling" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);
  if (!act2 || !act2.eligible) return null;

  const promptText = check === CHECK_CLEANER ? buildCleanerBundle({ question }) : (act2.targeted_prompt || TARGETED_PROMPT_TEXT);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setCopyFail("");
      emitReaderEvent(READER_EVENTS.TARGET_QUESTION_COPIED, { run, check });
      // Door 1 of 2 into the compare stage. Copying is the common path, so it opens the
      // paste box directly and the person comes back to a box already waiting.
      if (onOpen) onOpen();
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };
  return (
    <section
      id={RESULT_CAPABILITY_ANCHORS.comparison}
      className="wb-reader-result is-agent wb-act2 wb-scroll-anchor"
      aria-labelledby="wb-act2-heading"
    >
      <div className="wb-reader-result__head">
        <h2 id="wb-act2-heading" className="wb-reader-result__title">THE TWO-QUESTION TEST</h2>
      </div>
      {/* Instruction generation is free and stays available even under capacity
          degradation (§C tier 1): the person can always copy the follow-up and run
          it in their own AI (tier 2). Only the metered automated comparison
          (PairedTest, tier 3) is gated below. */}
      <p className="wb-act2__offer">{ACT2_OFFER_COPY}</p>

      <div className="wb-act2__check" role="group" aria-label="How you'll run the second answer">
        <p className="wb-act2__check-copy">{CHECK_CHOICE_COPY}</p>
        <div className="wb-act2__check-opts">
          <button
            type="button"
            className={`wb-act2__check-opt${check === CHECK_QUICK ? " is-active" : ""}`}
            aria-pressed={check === CHECK_QUICK}
            onClick={() => setCheck(CHECK_QUICK)}
          >
            <span className="wb-act2__check-label">{CHECK_QUICK_COPY.label}</span>
            <span className="wb-act2__check-hint">{CHECK_QUICK_COPY.hint}</span>
          </button>
          <button
            type="button"
            className={`wb-act2__check-opt${check === CHECK_CLEANER ? " is-active" : ""}`}
            aria-pressed={check === CHECK_CLEANER}
            onClick={() => setCheck(CHECK_CLEANER)}
          >
            <span className="wb-act2__check-label">{CHECK_CLEANER_COPY.label}</span>
            <span className="wb-act2__check-hint">{CHECK_CLEANER_COPY.hint}</span>
          </button>
        </div>
      </div>

      <pre className="wb-act2__prompt" aria-label="What to run on your AI">{promptText}</pre>
      <p className="wb-act2__prompt-note">Generated from this Reader run. Any question shapes an answer — this one included.</p>

      {/* Two doors into the compare stage, side by side and the same size. Copying is
          door 1. Door 2 exists because reading the question and retyping it into your own
          AI is a normal path, and gating the paste box on the clipboard would dead-end it
          one step from the payoff. It also carries anyone whose clipboard call failed. */}
      <div className="wb-reader-result__copy wb-act2__actions">
        <Btn kind="primary" className={copied ? "is-copied" : ""} onClick={copyPrompt}>
          {copied ? "Copied — now ask your AI" : "Ask your AI →"}
        </Btn>
        {act2.available && !open ? (
          <Btn kind="ghost" onClick={onOpen}>Paste what came back</Btn>
        ) : null}
        {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
      </div>
      <p className="wb-act2__sub">Copy this question. Drop it in your chat. Paste what comes back.</p>

      {act2.available ? (
        open ? (
          <PairedTest
            key={check}
            openReceipt={result.receipt}
            run={run}
            check={check}
            onTryCleaner={() => setCheck(CHECK_CLEANER)}
            onPairedChange={onPairedChange}
            inputRef={pairedInputRef}
          />
        ) : null
      ) : (
        <p className="wb-act2__degraded" role="status">{ACT2_CAPACITY_COPY}</p>
      )}
    </section>
  );
}

// User-chip lane — the result view. DESCRIPTIVE register only: it reports what visibly
// changed between the two answers under the instruction the person chose. It asserts no
// Imbas inspection finding, carries no gap estimate and no signal patterns, and borrows
// no construct vocabulary (those belong to the inspection lane). The machine SUGGESTS one
// of three chip states from delta presence + recorded conditions (suggestChipState); the
// person overrides it with one tap, and that correction — not the suggestion — is what a
// later state_corrected event records. No state celebrates, and none asserts the first
// answer failed or that the second is better.
function ChipDeltaView({ chip, entry, capture, onReset }) {
  const items = Array.isArray(chip.delta_items) ? chip.delta_items : [];
  const unmatched = pairConditionsUnmatched(capture);
  const conditionsTag =
    capture.conditions_matched === true
      ? "matched"
      : capture.conditions_matched === false
        ? "unmatched"
        : "unverified";
  const run = (chip.receipt && chip.receipt.paired_analysis && chip.receipt.paired_analysis.open_run_id) || "";

  const suggested = suggestChipState({ delta_count: chip.delta_count, conditions_matched: capture.conditions_matched });
  const [userState, setUserState] = useState(suggested);

  // chip_pair_completed is the chip lane's north-star completion: the second answer came
  // back and was read into a state. Fire once on mount with the machine-suggested state;
  // a later human correction is its own state_corrected event, never a re-completion.
  useEffect(() => {
    emitReaderEvent(READER_EVENTS.CHIP_PAIR_COMPLETED, {
      run,
      chip: entry ? entry.id : "",
      instruction_version: entry ? entry.instruction_version : "",
      state: suggested,
      conditions: conditionsTag,
      source: chip.source,
      idempotent: chip.idempotent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const correctTo = (next) => {
    if (next === userState) return;
    emitReaderEvent(READER_EVENTS.STATE_CORRECTED, { run, from_state: userState, to_state: next });
    setUserState(next);
  };

  const copy = CHIP_LOOP_STATE_COPY[userState] || {};

  return (
    <div className="wb-act2__delta wb-loop wb-scroll-anchor">
      {chip.idempotent ? (
        <p className="wb-act2__notice" role="status">{CHIP_UI.reveal.idempotent_notice}</p>
      ) : null}
      {chip.capture_uncertain ? (
        <p className="wb-act2__notice" role="status">{CHIP_UI.reveal.capture_uncertain_notice}</p>
      ) : null}

      <div className="wb-loop__reveal">
        <h3 className="wb-loop__headline">{copy.headline}</h3>
        {entry ? (
          <p className="wb-chip__reason">{CHIP_UI.side_by_side.reason_prefix}{entry.approved_ui_label}</p>
        ) : null}

        <div className="wb-loop__panels">
          <div className="wb-loop__panel wb-loop__panel--first">
            <span className="wb-loop__panel-label">{CHIP_UI.side_by_side.first_answer_caption}</span>
          </div>
          <div className="wb-loop__panel wb-loop__panel--second">
            <span className="wb-loop__panel-label">{CHIP_UI.side_by_side.second_answer_caption}</span>
          </div>
        </div>

        {unmatched ? (
          <div className="wb-loop__unmatched" role="note">
            <span className="wb-loop__unmatched-badge">{PAIR_CAPTURE_UI.unmatched_badge}</span>
            <p className="wb-loop__unmatched-warning">{PAIR_CAPTURE_UI.unmatched_warning}</p>
          </div>
        ) : null}

        {copy.note ? <p className="wb-loop__tag">{copy.note}</p> : null}

        <div className="wb-loop__correct" role="group" aria-label="Mark what you actually saw">
          <span className="wb-loop__correct-label">{CHIP_UI.reveal.correct_label}</span>
          {CHIP_LOOP_STATES.map((s) => (
            <button
              key={s}
              type="button"
              className={`wb-loop__chip${s === userState ? " is-active" : ""}`}
              aria-pressed={s === userState}
              onClick={() => correctTo(s)}
            >
              {(CHIP_LOOP_STATE_COPY[s] || {}).chip || s}
            </button>
          ))}
        </div>
      </div>

      <div className="wb-reader-result__sections">
        <article className="wb-reader-result__section">
          <h3 className="wb-reader-result__section-title">{CHIP_UI.reveal.delta_heading}</h3>
          {items.length ? (
            <ol className="wb-measure__list">
              {items.map((d, i) => (
                <li key={i} className="wb-measure__finding">
                  <p className="wb-measure__finding-why">{d.point}</p>
                  {(d.open_side || "").trim() ? (
                    <blockquote className="wb-measure__anchor wb-act2__side">
                      <span className="wb-act2__side-label">{CHIP_UI.reveal.first_side_label}</span>
                      {`"${d.open_side.trim()}"`}
                    </blockquote>
                  ) : null}
                  {(d.targeted_side || "").trim() ? (
                    <blockquote className="wb-measure__anchor wb-act2__side wb-act2__side--targeted">
                      <span className="wb-act2__side-label">{CHIP_UI.reveal.second_side_label}</span>
                      {`"${d.targeted_side.trim()}"`}
                    </blockquote>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="wb-reader-result__empty">{CHIP_UI.reveal.empty_delta}</p>
          )}
        </article>
      </div>

      {/* The full register note for this lane. Plain paragraph (NOT the InspectionMeaning
          panel, which speaks in inspection constructs) so the chip lane never borrows the
          instrument's vocabulary. */}
      <p className="wb-chip__meaning">{CHIP_UI.meaning_panel_line}</p>
      {/* One compact boundary treatment (NOT two stacked warning panels): the locked
          Reader boundary sentence, verbatim, carried on this surface exactly as it
          reads on every other — with the chip lane's user-attribution line beneath it,
          visually subordinate but part of the same block. */}
      <div className="wb-reader-result__trust wb-chip__boundary" role="note">
        <p className="wb-chip__boundary-lock">{RECEIPT_BOUNDARY}</p>
        <p className="wb-chip__boundary-attr">{CHIP_UI.boundary}</p>
      </div>

      {/* The same cue that stands under the proactive door, at the other end of the loop.
          It is a real anchor at both places: an arrow that went nowhere was the shape of a
          link and none of the function, and this is the moment a professional has just
          finished the work the sentence is about. */}
      <div className="wb-chip__pro-cue">
        <span className="wb-chip__pro-line">{CHIP_UI.professional_cue.line}</span>
        <a className="wb-chip__pro-link wb-focus" href="/advisory.html">{CHIP_UI.professional_cue.link}</a>
      </div>

      <ReaderReceiptActions
        receipt={chip.receipt}
        formatter={formatChipPairedReceiptText}
        filePrefix="imbas-reader-followup-receipt"
        onExport={() =>
          emitReaderEvent(READER_EVENTS.CARD_EXPORTED, {
            run,
            chip: entry ? entry.id : "",
            instruction_version: entry ? entry.instruction_version : "",
          })
        }
      />

      <div className="wb-action-row wb-act2__reset-row">
        <Btn kind="ghost" small onClick={onReset}>{CHIP_UI.reveal.reset_label}</Btn>
      </div>
    </div>
  );
}

// Reader v2 (user-chip lane) — the user-directed follow-up. A self-contained flow that
// does NOT require a prior inspection: paste the answer or draft you started with, tap the
// follow-up that bothered you (a Second Question Bank entry), copy the exact instruction to
// paste back into your own AI, then bring the second answer back to compare. It runs the
// same /api/read-paired endpoint as the inspection follow-up, but on the user_chip
// provenance path — the client mints its own open receipt (buildChipOpenReceipt) and the
// server derives the instruction text from the FROZEN bank by chip_id, never from the
// client. No chip is preselected: Imbas has determined nothing about the answer until the
// person chooses a follow-up.
//
// Four props. Two are about the way in and the way out: headingRef is what the workbench
// focuses and scrolls to when the lane opens, and onReturn closes it. Two carry the
// inspection the lane was opened over, and both are empty when there was none: openedFrom
// is that inspection's question, and heldReceipt is that inspection's own receipt.
//
// heldReceipt is why this lane owns no first answer of its own when it opens over an
// inspection. The authoritative first state is receipt.open_run.answer — the answer the
// inspection actually ran on — so steering continues from THAT answer: the lane references
// it and keeps no editable second copy that could drift away from it. A person who wants to
// steer a different first answer runs a new inspection.
//
// ONE prop and not two, because the answer and the parent identity have to come off the
// same receipt. The chip-open receipt this lane mints records which receipt it continues
// (open_run.continues), and that reference is only evidence if it names the receipt the
// held answer was actually read from. Passing them separately would let a caller hand over
// one inspection's answer under another inspection's hash and the chain would still look
// intact.
//
// The draft is the other mode and it stays: the standing chip door and ?start=chips open
// this lane with no inspection behind it, and a degraded run returns a read with no receipt
// at all (api/read.js fallback()), so there is nothing held there either. Held-ness is
// therefore read off the answer and never off the question — a fallback run has a question
// and no answer to hold.
function ChipLane({ headingRef, onReturn, openedFrom, heldReceipt, enteredVia }) {
  const [draftAnswer, setDraftAnswer] = useState("");
  const heldAnswer = (heldReceipt && heldReceipt.open_run && heldReceipt.open_run.answer) || "";
  const held = !!heldAnswer.trim();
  const firstAnswer = held ? heldAnswer : draftAnswer;
  const [chipId, setChipId] = useState("");
  const [secondAnswer, setSecondAnswer] = useState("");
  const [sameModel, setSameModel] = useState(null);
  const [modelVersion, setModelVersion] = useState("");
  const [edits, setEdits] = useState(null);
  const [busy, setBusy] = useState(false);
  const [chipResult, setChipResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [runError, setRunError] = useState("");
  const rowSeenRef = useRef(false);

  // chip_row_rendered fires once: the person has been shown the follow-up choices.
  useEffect(() => {
    if (rowSeenRef.current) return;
    rowSeenRef.current = true;
    emitReaderEvent(READER_EVENTS.CHIP_ROW_RENDERED, {});
  }, []);

  const entry = SECOND_QUESTION_BANK.find((e) => e.id === chipId) || null;
  const capture = buildPairCapture({ same_model: sameModel, model_version: modelVersion, edits });
  // Same split as the inspection lane: capture is the derivation and stays in the tab,
  // declaration is what the person said and travels, with the stage it was said at and
  // no identity — the server stamps that from the content so a retry cannot fork.
  const declaration = {
    same_model: sameModel,
    model_version: modelVersion,
    edits,
    stage: DECLARATION_STAGE.SUBMISSION,
  };
  // Only the second answer meets the word ceiling at the endpoint — the first travels
  // inside the client-minted receipt and is not word-gated — so only it is preflighted.
  // Preflighting the first would refuse input the server accepts.
  const secondAnswerOverMax = answerWordState(secondAnswer).over;
  const canCompare = !!entry && !!firstAnswer.trim() && !!secondAnswer.trim() && !secondAnswerOverMax;

  const clearErrors = () => {
    if (fieldError) setFieldError("");
    if (runError) setRunError("");
  };

  // Clears what this lane owns. A held first answer belongs to the inspection, not to the
  // lane, so running another follow-up over the same inspection leaves it standing.
  const reset = () => {
    setChipResult(null);
    setDraftAnswer("");
    setChipId("");
    setSecondAnswer("");
    setSameModel(null);
    setModelVersion("");
    setEdits(null);
    setFieldError("");
    setRunError("");
    setCopied(false);
  };

  const pickChip = (e) => {
    setChipId(e.id);
    clearErrors();
    emitReaderEvent(READER_EVENTS.CHIP_SELECTED, { chip: e.id, instruction_version: e.instruction_version });
  };

  const copyInstruction = async () => {
    if (!entry) return;
    try {
      await navigator.clipboard.writeText(entry.instruction_text);
      setCopied(true);
      setCopyFail("");
      emitReaderEvent(READER_EVENTS.CHIP_INSTRUCTION_COPIED, { chip: entry.id, instruction_version: entry.instruction_version });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };

  const submit = async () => {
    if (busy) return;
    if (!entry) { setFieldError(CHIP_UI.compose.chip_missing); return; }
    if (!firstAnswer.trim()) { setFieldError(CHIP_UI.compose.first_answer_missing); return; }
    if (!secondAnswer.trim()) { setFieldError(CHIP_UI.compose.second_answer_missing); return; }
    if (secondAnswerOverMax) { setFieldError(secondAnswerOverMaxNotice(secondAnswer)); return; }
    setFieldError("");
    setRunError("");
    setBusy(true);
    emitReaderEvent(READER_EVENTS.CHIP_PAIR_INITIATED, { chip: entry.id, instruction_version: entry.instruction_version });
    try {
      const data = await runChipPairedReader({
        firstAnswer,
        targetedAnswer: secondAnswer,
        chipId: entry.id,
        instructionVersion: entry.instruction_version,
        declaration,
        // The receipt the held answer was read from, or null in draft mode. Passed whole
        // so the open receipt names the inspection it continues.
        parentReceipt: held ? heldReceipt : null,
        // The door this steering run was entered through. Independent of the line above:
        // that one says which record is continued, this one says where the person pressed.
        enteredVia,
      });
      setChipResult(data);
    } catch (err) {
      const info = (err && err.info) || {};
      if (err && err.status === 400 && info.error === "too_long") {
        setFieldError(CHIP_UI.compose.too_long);
      } else if (err && err.status === 400 && info.error === "empty") {
        setFieldError(CHIP_UI.compose.too_short);
      // The server rejects an open receipt whose answer is empty. That is the first
      // answer, so this says so in the words the field uses, on the field itself.
      } else if (err && err.status === 400 && info.error === "invalid_receipt" && info.detail === "content_empty") {
        setFieldError(CHIP_UI.compose.first_answer_missing);
      } else if (err && err.status === 400 && info.error === "not_eligible") {
        setRunError(CHIP_UI.compose.not_eligible);
      } else if (err && err.status === 400) {
        setRunError(CHIP_UI.compose.blocked);
      } else {
        setRunError((info && info.message) || CHIP_UI.compose.run_error);
      }
    } finally {
      setBusy(false);
    }
  };

  // Built once and rendered by both branches below, so the way out and the tie back to
  // the inspection stand on the chip-choosing surface and on the comparison alike. The
  // heading takes tabIndex -1 because it is a focus target and headings are not
  // focusable on their own; it stays out of the tab order.
  const head = (
    <div className="wb-reader-result__head">
      <h2 id="wb-chip-heading" className="wb-reader-result__title" ref={headingRef} tabIndex={-1}>
        {CHIP_UI.value_statement.headline}
      </h2>
      <div className="wb-chip__return">
        <button type="button" className="wb-demo-trigger wb-chip__return-btn" onClick={onReturn}>
          {`← ${openedFrom ? CHIP_UI.compose.return_to_inspection : CHIP_UI.compose.return_to_reader}`}
        </button>
      </div>
      {/* The read-only tie to what the lane was opened over. The question only — the
          answer body is held once, in the first-answer field below, and is not reproduced
          here as a second copy of itself.
          The note states that the text is still here, so it is rendered off the text and
          not off the question. A degraded run carries a question and no receipt, and a
          lane opened over one has nothing held to say that about. */}
      {openedFrom ? (
        <div className="wb-chip__origin">
          <p className="wb-chip__origin-line">
            <span className="wb-chip__origin-label">{CHIP_UI.compose.opened_from_label}</span>{" "}
            <span className="wb-chip__origin-question">{openedFrom}</span>
          </p>
          {held ? <p className="wb-chip__origin-note">{CHIP_UI.compose.opened_from_note}</p> : null}
        </div>
      ) : null}
    </div>
  );

  if (chipResult) {
    return (
      <section className="wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor" aria-labelledby="wb-chip-heading">
        {head}
        {/* The first answer, still here at the far end of the loop. Until this, the head
            said the text was still here and the comparison below captioned a first-answer
            panel, and neither of them showed a word of it — the paste box that held it
            leaves with the compose phase. A stage that says it holds a state renders the
            state, and this is the reference that makes both claims true.

            Closed by default because the comparison is what the person came back for, and
            a wall of pasted text above it would bury the thing it is evidence for. It is
            read-only wherever it came from: a held answer belongs to the inspection that
            produced it, and a drafted one has already been run. */}
        {firstAnswer.trim() ? (
          <details className="wb-chip__held">
            <summary className="wb-chip__held-summary">{CHIP_UI.compose.first_answer_label}</summary>
            <p className="wb-chip__held-body">{firstAnswer}</p>
          </details>
        ) : null}
        <ChipDeltaView chip={chipResult} entry={entry} capture={capture} onReset={reset} />
      </section>
    );
  }

  return (
    <section className="wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor" aria-labelledby="wb-chip-heading">
      {head}
      <p className="wb-act2__offer">{CHIP_UI.value_statement.sub}</p>

      {/* Picking a follow-up opens the second paste box below, so this one stops accepting
          input and stays as context. One live answer field at a time, in this lane too.
          A held answer is read-only from the start: it is the state the inspection ran on,
          shown so the person can see what they are steering from, and it is not this lane's
          to edit. */}
      <PasteField
        label={CHIP_UI.compose.first_answer_label}
        value={firstAnswer}
        onChange={(v) => { setDraftAnswer(v); clearErrors(); }}
        placeholder={CHIP_UI.compose.first_answer_placeholder}
        minAckLength={1}
        readOnly={held || !!entry}
      />
      {/* Unlocks the box a picked chip locked. A held answer has no unlocked state to
          return to, so the control that offers one is not rendered over it. */}
      {entry && !held ? (
        <div className="wb-chip__edit-first">
          <button type="button" className="wb-demo-trigger wb-edit-answer" onClick={() => setChipId("")}>
            {`← ${CHIP_UI.compose.edit_first_answer}`}
          </button>
        </div>
      ) : null}

      <div className="wb-act2__capture wb-chip__choose" role="group" aria-label="Pick a follow-up">
        <p className="wb-act2__capture-heading">{CHIP_UI.row_header}</p>
        <p className="wb-act2__capture-intro">{CHIP_UI.row_support}</p>
        <div className="wb-chip__row">
          {SECOND_QUESTION_BANK.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`wb-loop__chip wb-chip__pick${e.id === chipId ? " is-active" : ""}`}
              aria-pressed={e.id === chipId}
              onClick={() => pickChip(e)}
            >
              {e.approved_ui_label}
            </button>
          ))}
        </div>
      </div>

      {entry ? (
        <div className="wb-chip__instruction">
          <p className="wb-act2__prompt-note">{CHIP_UI.card.framing}</p>
          <pre className="wb-act2__prompt" aria-label="Instruction to paste into your AI">{entry.instruction_text}</pre>
          <div className="wb-reader-result__copy wb-act2__actions">
            <Btn kind="primary" className={copied ? "is-copied" : ""} onClick={copyInstruction}>
              {copied ? CHIP_UI.compose.copy_done : CHIP_UI.compose.copy_label}
            </Btn>
            {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
          </div>

          <PasteField
            label={CHIP_UI.compose.second_answer_label}
            overMaxNotice={secondAnswerOverMaxNotice}
            value={secondAnswer}
            onChange={(v) => { setSecondAnswer(v); clearErrors(); }}
            placeholder={CHIP_UI.compose.second_answer_placeholder}
            minAckLength={1}
          />

          <div className="wb-act2__capture" role="group" aria-label="How you ran the two answers">
            <p className="wb-act2__capture-heading">{PAIR_CAPTURE_UI.heading}</p>
            <p className="wb-act2__capture-intro">{PAIR_CAPTURE_UI.intro}</p>

            <fieldset className="wb-act2__capture-q">
              <legend className="wb-act2__capture-label">{PAIR_CAPTURE_UI.same_model.question}</legend>
              <div className="wb-act2__capture-opts">
                {[PAIR_SAME_MODEL.YES, PAIR_SAME_MODEL.NO, PAIR_SAME_MODEL.NOT_SURE].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`wb-act2__capture-opt${sameModel === v ? " is-active" : ""}`}
                    aria-pressed={sameModel === v}
                    onClick={() => setSameModel(v)}
                  >
                    {PAIR_CAPTURE_UI.same_model.options[v]}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="wb-act2__capture-q">
              <label className="wb-act2__capture-label" htmlFor="wb-chip-model">{PAIR_CAPTURE_UI.model_version.question}</label>
              <span className="wb-act2__capture-hint">{PAIR_CAPTURE_UI.model_version.hint}</span>
              <input
                id="wb-chip-model"
                type="text"
                className="wb-act2__capture-input"
                value={modelVersion}
                maxLength={80}
                placeholder={PAIR_CAPTURE_UI.model_version.placeholder}
                onChange={(e) => setModelVersion(e.target.value)}
              />
            </div>

            <fieldset className="wb-act2__capture-q">
              <legend className="wb-act2__capture-label">{PAIR_CAPTURE_UI.edits.question}</legend>
              <div className="wb-act2__capture-opts">
                {[PAIR_EDITS.NONE, PAIR_EDITS.EDITED].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`wb-act2__capture-opt${edits === v ? " is-active" : ""}`}
                    aria-pressed={edits === v}
                    onClick={() => setEdits(v)}
                  >
                    {PAIR_CAPTURE_UI.edits.options[v]}
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="wb-act2__capture-disclosure">{PAIR_CAPTURE_UI.disclosure}</p>
          </div>

          <div className="wb-action-row wb-act2__test-cta">
            <Btn
              kind="primary"
              disabled={busy || !canCompare}
              onClick={submit}
              className={`wb-reader-cta${canCompare && !busy ? " is-armed" : ""}${busy ? " is-inspecting" : ""}`}
            >
              {busy ? CHIP_UI.compose.comparing_label : CHIP_UI.compose.compare_label}
            </Btn>
          </div>
          {fieldError ? <p className="wb-act2__run-error" role="status">{fieldError}</p> : null}
          {runError ? <p className="wb-act2__run-error" role="status">{runError}</p> : null}
        </div>
      ) : null}

      <p className="wb-reader-result__trust wb-measure__boundary">{CHIP_UI.boundary}</p>
    </section>
  );
}

function ArchiveSignalPanel({ sel, answer }) {
  if (!sel || !answer) return null;
  const anchors = detectAnchors(answer, sel.detect, sel.keyDetect);
  return (
    <CollapsiblePanel title="Archive signal" className="wb-reader-archive">
      <p className="wb-plate-support">{sel.short}</p>
      <div className="wb-reader-archive-terms">
        {anchors.tokens.map((t) => (
          <span key={t.term} className={`wb-reader-archive-term${t.found ? " is-found" : " is-missing"}`}>{t.term}</span>
        ))}
      </div>
      <p className="wb-plate-hint">The Reader inspects the full answer. This list is the legacy named-term check for this archive case.</p>
    </CollapsiblePanel>
  );
}

// Reader v2 redesign edit 2 — guided case, trap-then-reveal. Lead with the innocent
// question, then the reveal (denominator + case tier, per case; never bare-number
// prevalence, never "left out"). Numbered steps and a one-tap Copy question button so
// the reader can run it on their own AI. Copy targets the clipboard, never the answer
// paste field.
function ReaderCaseEvidence({ sel }) {
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  if (!sel?.ready) return null;
  const copyQuestion = async () => {
    try {
      await navigator.clipboard.writeText(sel.openPrompt || "");
      setCopied(true);
      setCopyFail("");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };
  return (
    <div className="wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence">
      <div className="wb-readout">
        <p className="wb-reader-evidence__meta">
          {sel.metaLabel}
          {sel.dateValue ? ` · ${sel.dateLabel} ${sel.dateValue}` : ""}
        </p>
        <div className="wb-readout__rule" aria-hidden="true" />
        <div className="wb-readout__signal wb-guided-trap">
          <p className="wb-active-case__probe">Start with an ordinary question:</p>
          <PromptCard text={sel.openPrompt} />
        </div>
        {sel.reveal ? (
          <div className="wb-readout__section wb-guided-reveal">
            <div className="wb-active-case__headline">{sel.reveal}</div>
          </div>
        ) : null}
        <ol className="wb-guided-steps">
          <li><span className="wb-guided-steps__n" aria-hidden="true">1</span> Copy the question</li>
          <li><span className="wb-guided-steps__n" aria-hidden="true">2</span> Ask your AI</li>
          <li><span className="wb-guided-steps__n" aria-hidden="true">3</span> Paste what it says back</li>
        </ol>
        <div className="wb-guided-copy">
          <Btn kind="ghost" small className={copied ? "is-copied" : ""} onClick={copyQuestion}>
            {copied ? "Copied" : "Copy question"}
          </Btn>
          {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
        </div>
      </div>
    </div>
  );
}

// Reader v2 redesign edit 5 — the second-run mini-loop. After the first result, offer
// one fresh QUESTION (from a different case) with the same three-step interaction.
// Hard rule: a question NEVER goes into the answer paste field. "Copy question" puts it
// on the clipboard for the reader to ask their own AI; "Test another question" resets
// the run (clearing the answer) and, in guided mode, switches to the suggested case.
// Loop close. Two shapes, because the two modes close differently.
//
// GUIDED: suggest the next curated case and hand over its open prompt to copy.
// OWN: suggest nothing. `mode` was accepted here and never read, and `sel` is seeded
// CURATED[0] for every visitor regardless of mode, so BOTH the `suggestion` lookup and
// the `sel?.openPrompt` fallback resolved to a curated question inside own-mode
// results — that is how "How does the FDA ensure drug safety?" reached people who had
// pasted their own answer. Own mode now reads no CURATED entry on either path.
//
// Dropping the question must not drop the restart: this sits exactly where §N's
// north-star (cross-user loop completion) is measured, so own mode keeps the reset
// action and loses only the borrowed content.
function SecondRunLoop({ mode, sel, onAnother }) {
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  const guided = mode === "guided";
  const suggestion = guided ? CURATED.find((c) => c.ready && c.id !== sel?.id) || null : null;
  const question = guided ? suggestion?.openPrompt || sel?.openPrompt || "" : "";
  if (guided && !question) return null;
  const copyQuestion = async () => {
    try {
      await navigator.clipboard.writeText(question);
      setCopied(true);
      setCopyFail("");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };
  return (
    <section className="wb-reader-result is-agent wb-loop wb-scroll-anchor" aria-labelledby="wb-loop-heading">
      <div className="wb-reader-result__head">
        <h2 id="wb-loop-heading" className="wb-reader-result__title">TEST ANOTHER QUESTION</h2>
      </div>
      {guided ? (
        <>
          <p className="wb-loop__lead">Run the same check on a fresh question. Copy it, ask your AI, paste what it says back.</p>
          <ol className="wb-guided-steps">
            <li><span className="wb-guided-steps__n" aria-hidden="true">1</span> Copy the question</li>
            <li><span className="wb-guided-steps__n" aria-hidden="true">2</span> Ask your AI</li>
            <li><span className="wb-guided-steps__n" aria-hidden="true">3</span> Paste the answer back</li>
          </ol>
          <PromptCard text={question} />
        </>
      ) : (
        <p className="wb-loop__lead">Run the same check on another answer.</p>
      )}
      <div className="wb-loop__actions">
        {guided ? (
          <>
            <Btn kind="ghost" small className={copied ? "is-copied" : ""} onClick={copyQuestion}>
              {copied ? "Copied" : "Copy question"}
            </Btn>
            {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
          </>
        ) : null}
        {/* Item 5, R7. This closed the page on a second filled control 281px under
            Act2's "Ask your AI", so a reader met two equally weighted primaries in one
            viewport and the page named no next step. Act2's control acts on the prompt
            directly above it and keeps the weight; leaving this run for another one is
            the subordinate of the two. */}
        <Btn kind="ghost" small onClick={() => onAnother(suggestion)}>Test another question</Btn>
      </div>
    </section>
  );
}

// Return-flow nudge for a visitor who copied a targeted question in an earlier
// session but never came back with a completed loop. It resumes nothing (no old
// content is stored or restored), it just points them back at the input. Dismissible.
function ReturnNudge({ onDismiss }) {
  return (
    <section className="wb-return" aria-label="Welcome back">
      <div className="wb-return__body">
        <p className="wb-return__headline">Welcome back.</p>
        <p className="wb-return__text">You started a check here before. Paste an answer to run another and watch what it leaves out.</p>
      </div>
      <button type="button" className="wb-return__dismiss" onClick={onDismiss} aria-label="Dismiss">×</button>
    </section>
  );
}

// The first-use clarity strip (Reader v2 R1 item 6). A newcomer landing on a blank
// paste box sees the whole Confirmation Loop as three plain moves before they start.
// Product register: second person, kinetic, no hedging beyond the one sanctioned
// "might." It never asserts a specific omission — it describes what the instrument
// does, not a verdict on any answer. Shown only when this browser has never completed
// a run and only in own mode; dismissible, and the dismissal persists.
const READER_CLARITY_STEPS = [
  "Paste an AI answer to see what it might be missing.",
  "Copy the one question Imbas builds, then ask your own AI.",
  "Paste its reply back and watch what surfaces.",
];


// ?funnel=1 diagnostic: THIS browser's own event log reduced to the north-star
// funnel. Read-only, one-shot read on mount. Every number is a count of
// content-minimal events — no answer or question text ever entered the log.
function ReaderFunnelPanel() {
  const [funnel] = useState(() => buildFunnel(readReaderEvents()));
  const rate = funnel.loop_completion_rate;
  const pct = rate == null ? "—" : `${Math.round(rate * 100)}%`;
  const c = funnel.counts || {};
  const rows = [
    ["Runs started", c.run_started],
    ["Runs completed", c.run_completed],
    ["Results viewed", c.result_viewed],
    ["Questions copied", c.target_question_copied],
    ["Loops returned", c.loop_returned],
    ["Loops completed", c.loop_completed],
    ["States corrected", c.state_corrected],
    ["Cards exported", c.card_exported],
    ["Candidates submitted", c.candidate_submitted],
    ["Return visits", c.return_visit],
  ];
  const states = funnel.completed_by_state || {};
  const hasStates = Object.keys(states).length > 0;
  return (
    <section className="wb-funnel" aria-label="Reader funnel (this browser only)">
      <div className="wb-funnel__head">
        <span className="wb-funnel__eyebrow">Reader funnel · this browser only</span>
        <p className="wb-funnel__northstar">
          <span className="wb-funnel__northstar-num">{pct}</span>
          <span className="wb-funnel__northstar-label">of copied questions returned as completed loops</span>
        </p>
      </div>
      <dl className="wb-funnel__grid">
        {rows.map(([label, n]) => (
          <div key={label} className="wb-funnel__row">
            <dt className="wb-funnel__label">{label}</dt>
            <dd className="wb-funnel__val">{n || 0}</dd>
          </div>
        ))}
      </dl>
      {hasStates ? (
        <div className="wb-funnel__states">
          <span className="wb-funnel__states-label">Completed by state</span>
          <ul className="wb-funnel__states-list">
            {LOOP_STATES.map((s) =>
              states[s] ? (
                <li key={s} className="wb-funnel__states-item">
                  {((LOOP_STATE_COPY[s] && LOOP_STATE_COPY[s].chip) || s)}: {states[s]}
                </li>
              ) : null
            )}
          </ul>
        </div>
      ) : null}
      <p className="wb-funnel__note">[Content-minimal: ids, enums, counts only — never answer or question text. Stored in this browser, nothing leaves your device.]</p>
    </section>
  );
}

// The instant demo (Reader v2, item 4). A first-timer watches the whole loop without
// pasting anything, on ONE public example. Everything is canned and deterministic:
// no /api/read call, no model, no spend. It is NOT the visitor's own run and NOT an
// Imbas case, and the small print says so.
//
// The example itself, and every provenance sentence under it, lives in
// reader-public-example.js and traces to docs/IMBAS-PUBLIC-EXAMPLE-PACKET.md
// Section 5. Read that module's header before editing any string here: it records
// which packet bar each line is holding.
function ReaderDemo({ onTryOwn, onClose }) {
  const d = PUBLIC_EXAMPLE;
  const ui = PUBLIC_EXAMPLE_UI;
  return (
    <section className="wb-demo" aria-labelledby="wb-demo-heading" data-example={d.version}>
      <div className="wb-demo__head">
        <span className="wb-demo__eyebrow">{ui.eyebrow}</span>
        <h3 id="wb-demo-heading" className="wb-demo__title">{ui.title}</h3>
        <p className="wb-demo__context">{d.context}</p>
      </div>

      <div className="wb-demo__beat">
        <span className="wb-demo__label">{ui.question_label}</span>
        <p className="wb-demo__q">{d.question}</p>
      </div>

      <div className="wb-demo__beat">
        <span className="wb-demo__label">{ui.open_answer_label}</span>
        <p className="wb-demo__answer">{d.open_answer}</p>
      </div>

      <div className="wb-demo__beat">
        <span className="wb-demo__label">{ui.left_out_label}</span>
        <p className="wb-demo__leftout"><mark className="wb-demo__mark">{d.left_out}</mark></p>
      </div>

      <div className="wb-demo__beat">
        <span className="wb-demo__label">{ui.prompt_label}</span>
        <p className="wb-act2__prompt wb-demo__prompt">{d.targeted_prompt}</p>
      </div>

      <div className="wb-loop__reveal wb-demo__reveal">
        <p className="wb-loop__headline">{d.headline}</p>
        <div className="wb-loop__panels">
          <div className="wb-loop__panel">
            <span className="wb-loop__panel-label">{LOOP_PANEL_FIRST_LABEL}</span>
            <p className="wb-loop__panel-body wb-loop__panel-body--muted">{LOOP_DIDNT_COME_UP}</p>
          </div>
          <div className="wb-loop__panel wb-loop__panel--second">
            <span className="wb-loop__panel-label">{LOOP_PANEL_SECOND_LABEL}</span>
            <p className="wb-loop__panel-body">{d.surfaced}</p>
          </div>
        </div>
        <p className="wb-demo__counts">{d.counts_line}</p>
        <p className="wb-demo__why">{d.why_it_mattered}</p>
        <p className="wb-loop__tag">{d.tag}</p>
        <p className="wb-measure__boundary">{RECEIPT_BOUNDARY}</p>
        <p className="wb-demo__smallprint">{ui.smallprint}</p>
      </div>

      {/* Four facts about this capture, kept apart. Merging any two of them states
          something the stored artifacts cannot carry (packet 4.2). */}
      <div className="wb-prov wb-demo__prov" data-complete="yes">
        <span className="wb-prov__heading">{ui.provenance_heading}</span>
        <dl className="wb-prov__list">
          {d.provenance.map((row) => (
            <div key={row.id} className="wb-prov__row" data-field={row.id} data-known="yes">
              <dt className="wb-prov__label">{row.label}</dt>
              <dd className="wb-prov__value">{row.body}</dd>
            </div>
          ))}
        </dl>
        <p className="wb-prov__note">{d.source_line}</p>
      </div>

      <div className="wb-demo__cta-row">
        <Btn kind="primary" small onClick={onTryOwn}>{ui.try_own_label}</Btn>
        <button type="button" className="wb-demo__close" onClick={onClose}>{ui.close_label}</button>
      </div>
    </section>
  );
}

// Said when a carry-over was asked for and did not arrive. Two sentences, and the
// second is the whole recovery: the ordinary Reader is untouched and still below.
//
// It names no cause, because the branch that renders it cannot tell one. A malformed
// id, a record that no longer resolves, a store that could not be reached and a row
// holding no question all land here, and the only fact common to them is that the
// question is not in the box. Guessing between them would put a reason on the screen
// the code does not hold.
const RERUN_UNRESOLVED_NOTICE =
  "The question didn't carry over. You can start a new inspection below.";

function ReaderWorkbench() {
  const [mode, setMode] = useState("own");
  const [sel, setSel] = useState(CURATED[0]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [topic, setTopic] = useState("");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [readerResult, setReaderResult] = useState(null);
  const [errors, setErrors] = useState({});
  // A returning visitor who copied a targeted question last session but never came
  // back with a completed loop. Set once from this browser's own event log (no server
  // read, no user content) to drive the finish-your-loop nudge below.
  const [returning, setReturning] = useState(false);
  const [showFunnel] = useState(() => isFunnelPanelEnabled());
  // The instant demo (item 4). Off until a first-timer opens it; deterministic and
  // canned, so it never calls the API. demoEmittedRef keeps the demo-open signal to
  // one emit per mount and out of the copied/completed north-star counts.
  const [demoOpen, setDemoOpen] = useState(false);
  const demoEmittedRef = useRef(false);
  // First-use clarity strip (item 6): show the three-move loop to a visitor whose own
  // browser log holds no completed run. Both flags read once from browser-local state —
  // no server read, no user content — and the dismissal persists across visits.
  // Stage spine (reader-stage.js). `lane` reads the arrival intent once — ?start=chips
  // is the permanent chip door (§D). `followUpOpen` and `hasDelta` are the two facts
  // the render tree cannot derive on its own; every other stage input is already here.
  const [lane, setLane] = useState(() => parseArrival(window.location).lane);
  const [chipMounted, setChipMounted] = useState(() => parseArrival(window.location).lane === LANE_CHIPS);
  // Which door the steering run was entered through — set at the press, read at the
  // receipt. A ?start=chips arrival is already through a door by the time this mounts,
  // and the door it came through is the standing one: nothing was inspected, and the
  // origin that claims the least is the truthful one to seed with. Null until a press
  // on any other arrival, because before the press there is no entry to record.
  const [chipEntry, setChipEntry] = useState(() =>
    parseArrival(window.location).lane === LANE_CHIPS ? CHIP_ENTRY_VIA.DIRECT_STANDING : null
  );
  // The product rerun (?rerun=<shareId>). True once a published question has been
  // carried over, which is the only thing it carries: the answer box stays empty
  // because the point is the answer you get today, and Imbas asks nothing on anyone's
  // behalf. Nothing is written back to the record named in the URL.
  const [rerunSeeded, setRerunSeeded] = useState(false);
  // The other outcome of the same arrival. A carry-over was asked for and the question
  // is not in the box, so the Reader says so instead of presenting itself as an
  // ordinary blank arrival the person never requested.
  const [rerunUnresolved, setRerunUnresolved] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [hasDelta, setHasDelta] = useState(false);
  const stageRef = useRef(null);
  const resultRef = useRef(null);
  const scrollReady = useRef(false);
  const scrollState = useRef(initialScrollState());
  // Guards RESULT_VIEWED to one emit per distinct result: holds the run id (or a
  // synthetic marker) of the result already counted as viewed. Reset when the result
  // clears so the next real result is counted once.
  const viewedRunRef = useRef(null);
  // Previous stage + why it moved. The cause defaults to CAUSE_POP so an unattributed
  // stage change can never be mistaken for a forward advance; only code paths that ARE
  // the person's primary action set CAUSE_ADVANCE, and the effect clears it each time.
  // enteredRef is the stages already recorded in the CURRENT run occurrence, which keeps
  // a stage entry to one record however many times the person walks back over it within
  // that run. occurrenceRef counts which run this is within the page's life; both reset
  // together at the occurrence boundary so a second inspection is a second full funnel.
  const prevStageRef = useRef(null);
  const causeRef = useRef(CAUSE_INIT);
  const enteredRef = useRef([]);
  const occurrenceRef = useRef(1);
  const composeAnswerRef = useRef(null);
  const pairedAnswerRef = useRef(null);
  const resultHeadingRef = useRef(null);
  // The chip lane's own heading and its door. Opening the lane drops the paste boxes
  // from the stage, so the page above the door collapses and the door — with the lane
  // under it — travels up past the top of the viewport while the scroll position holds.
  // These two refs are what puts the person back on the thing they just opened, and
  // back where they were when they close it: the heading is the top of the lane, the
  // door is the control they pressed. laneRef skips the effect's first run, and
  // laneReturnRef holds the scroll position the open was made from.
  const chipHeadingRef = useRef(null);
  const chipDoorRef = useRef(null);
  const laneRef = useRef(null);
  const laneReturnRef = useRef(null);
  // Both of these skip their own first run. The transition effect above already
  // consumed prevStageRef by the time these fire, so they cannot reuse it to detect
  // mount.
  const hashSyncedRef = useRef(false);
  const focusStageRef = useRef(null);

  const hasQuestion = !!(mode === "guided" ? sel.openPrompt : question).trim();
  const hasAnswer = !!answer.trim();
  // Derived from the answer currently in the box, on every render. The button may not
  // present as ready for a request the server will deterministically reject, and because
  // this is a view of the text rather than a stored verdict, re-pasting the same
  // over-limit answer cannot re-arm it.
  const answerOverMax = answerWordState(answer).over;
  const isReady = hasQuestion && hasAnswer && !answerOverMax;
  const ownQuestionPrompt = mode === "own" && hasAnswer && !hasQuestion;
  const statusState = busy
    ? "inspecting"
    : readerResult
      ? readerResult.source === "fallback"
        ? "degraded"
        : "result"
      : isReady
        ? "ready"
        : ownQuestionPrompt
          ? "needQuestion"
          : "idle";

  // The stage is DERIVED, never stored — a stage is a view of the data, not a fact of
  // its own, so it cannot drift out of sync with what actually exists. `view` is the
  // visibility contract: at most one live answer-entry input, and which one.
  const stage = deriveStage({
    lane,
    busy,
    hasResult: !!readerResult,
    hasAct2: !!(readerResult && readerResult.act2),
    followUpOpen,
    hasDelta,
  });
  const view = stageView(stage);
  const composeLive = view.answerEntry === "compose-answer";

  // The one expression that decides whether the Check Register renders. Hoisted so the
  // panel's mount and the Inspection Meaning panel's affordance flags read the same
  // test: the register carries the cards, the copy-the-question control, and the Review
  // Record export, so when it drops out all three of those next steps drop with it.
  const checkRegisterVisible = !!(
    readerResult &&
    readerResult.checks &&
    Array.isArray(readerResult.checks.cards) &&
    readerResult.checks.cards.length
  );

  // The door is one control at one of two mount points, and the two conditions below
  // are the complement of each other, so this is true exactly when the door is on the
  // page and never counts it twice.
  const chipDoorPresent = stage === STAGE_FOLLOWUP || view.chipDoor;

  // What the capability strip may link to, in document order. Every entry is gated on
  // the same expression that mounts the section itself, so a link cannot outlive its
  // target: checkRegisterVisible is the register's own mount test and carries all three
  // controls that live inside the register, and the comparison test is the early return
  // inside Act2Offer written out. A strip that promised a register to a result carrying
  // none would be a worse orientation than no strip at all.
  //
  // The follow-up link stands down while the lane is already open. The door does render
  // there — as the hide control — so this is not a dead-anchor question; it is the copy
  // law. Pointing a person at a follow-up they are standing in reports state, and this
  // strip states where things are.
  const capabilityLinks = resultCapabilityLinks({
    checks: checkRegisterVisible,
    comparison: !!(readerResult && readerResult.act2 && readerResult.act2.eligible),
    followUp: chipDoorPresent && lane !== LANE_CHIPS,
  });

  // Mark the next stage change as the person's own forward move. Called from the
  // primary action itself, immediately before the state setter that moves the stage.
  const advance = () => {
    causeRef.current = CAUSE_ADVANCE;
  };

  // One place records that a stage was reached. It fires on the first paint too: the
  // stage a person lands on is a stage they entered, and leaving it unrecorded is what
  // left ?start=chips visitors with a first event that advanced out of nowhere.
  //
  // The cause rides along and is never the gate. Back and Forward reach here as
  // CAUSE_POP and record a real entry that countsAsProgress excludes; whichever stage a
  // settling run lands on reaches here as CAUSE_ASYNC and counts, because reaching a
  // read is the middle of the funnel whether or not anyone clicked for it.
  //
  // Landing back on compose ends the occurrence and starts the next one, so the counters
  // clear here rather than persisting for the page's life. Without that, a person's
  // second inspection would record nothing at all.
  useEffect(() => {
    const from = prevStageRef.current;
    const cause = causeRef.current;
    causeRef.current = CAUSE_POP;
    prevStageRef.current = stage;
    if (startsNewOccurrence(from, stage)) {
      occurrenceRef.current += 1;
      enteredRef.current = [];
    }
    const entry = stageEntry(stage, { from, cause, seen: enteredRef.current });
    if (!entry.emit) return;
    enteredRef.current = enteredRef.current.concat(stage);
    emitReaderEvent(READER_EVENTS.STAGE_ENTERED, {
      stage: entry.stage,
      prior_stage: entry.prior_stage,
      cause: entry.cause,
      occurrence: occurrenceRef.current,
      mode,
    });
  }, [stage]);

  // Arrival (§D/§E), read through the query-flag pattern the repo already uses for
  // `reader` and `funnel`. Nothing here persists run content, so a #stage hash pointing
  // past the available data is stale by construction: normalize DOWN to what the data
  // supports and replaceState the dead entry away, so Back returns to wherever the
  // visitor actually came from instead of bouncing on a hash that resolves nowhere.
  useEffect(() => {
    const { stage: requested } = parseArrival(window.location);
    const norm = normalizeArrivalStage(requested, { lane, busy: false, hasResult: false });
    if (norm.rewrite) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // The product rerun. One GET against the share the visitor came from, to copy its
  // published question into the box — nothing else moves. The named record is read and
  // never written, so the receipt that offered this link reads the same afterwards as
  // before, and the run this starts is a separate record with its own date.
  //
  // This deliberately seeds the question and nothing else. Restoring the old answer
  // would recreate the old capture, and the reason to be here is the answer the system
  // gives now. A failed or missing read leaves the box blank rather than half-filled:
  // the person can type the question, and a rerun that quietly seeded the wrong text
  // would be worse than one that seeded none.
  useEffect(() => {
    const { rerunShareId, rerunRequested } = parseArrival(window.location);
    if (!rerunShareId) {
      // Asked for, in a shape this Reader cannot read. Every other arrival passes
      // through here too, so the acknowledgement is gated on the ask having been made.
      if (rerunRequested) setRerunUnresolved(true);
      return undefined;
    }
    let live = true;
    fetch(`/api/inspection/${encodeURIComponent(rerunShareId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const record = data && data.ok && data.record ? data.record : null;
        const q = record ? String(record.question || "").trim() : "";
        if (!live) return;
        if (!q) {
          setRerunUnresolved(true);
          return;
        }
        setQuestion(q);
        setRerunSeeded(true);
      })
      .catch(() => {
        if (live) setRerunUnresolved(true);
      });
    return () => {
      live = false;
    };
  }, []);

  // The hash mirrors the stage so deep links and bookmarks name something real. It is
  // maintained with replaceState, never pushState.
  //
  // APPROVED SCOPE AMENDMENT, and the consequences stated plainly rather than implied.
  // Browser history represents document navigation, not transient Workbench stages, so
  // stage advances add no history entries and browser Back exits the Workbench. Back
  // loses the current run. Run content is not restored after navigation or tab closure —
  // nothing here persists it, and a #stage hash is a bookmark, not a save file
  // (normalizeArrivalStage resolves a stage the data cannot support back down).
  //
  // Reversal inside the Workbench is handled by explicit in-product controls instead,
  // and changing an upstream answer may discard downstream results, because a result
  // derived from an answer stops being valid once that answer changes.
  //
  // The alternative was rejected on structural grounds: the stage is derived, never
  // stored, so making history able to set it would need either a stored stage — a second
  // source of truth, which is what the one-live-input fix rests on not having — or a
  // cache of per-stage results, which reintroduces stale async results one layer down.
  useEffect(() => {
    if (!hashSyncedRef.current) {
      // Mount leaves the arriving hash alone. The visitor's own anchor (#wb-reader-console)
      // still has to be readable by the handler below, and replaceState fires no hashchange,
      // so writing here would silently break that deep link. The arrival effect above has
      // already dealt with a stale #stage.
      hashSyncedRef.current = true;
      return;
    }
    const target = stageHash(stage);
    if (window.location.hash === target) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search + target);
  }, [stage]);

  // The follow-up flags belong to the result. When the result goes — a re-run, an edit,
  // a mode switch, "Test another question" — they go with it, so a later result can
  // never inherit a stale open follow-up and skip its own result stage.
  useEffect(() => {
    if (readerResult) return;
    setFollowUpOpen(false);
    setHasDelta(false);
  }, [readerResult]);

  // Focus follows the stage. Each transition puts the caret or the reading position on
  // the target the stage contract names, so a keyboard or screen-reader user is never
  // left behind on the previous stage. It never runs on mount: moving focus on first
  // paint would take a visitor straight past the hero they arrived to read.
  //
  // The two stages whose target is a live input get that input. Every other stage names
  // a heading or a status line, and landing on the top of the region a person just
  // opened is the point, since tabbing forward from there walks the new stage in order.
  //
  // Which region that is depends on the stage. Every inspect-lane stage names something
  // inside the result region, so the result heading is the top of what they opened. The
  // chip lane is not in the result region — it is a sibling below it — so the same rule
  // resolves to a different element there, and sending the person to the result heading
  // would have been sending them to the region they just left.
  const FOCUS_TARGETS = {
    "compose-answer": composeAnswerRef,
    "paired-answer": pairedAnswerRef,
  };
  useEffect(() => {
    const prev = focusStageRef.current;
    focusStageRef.current = stage;
    if (prev === null || prev === stage) return;
    const regionTop = stage === STAGE_CHIPS ? chipHeadingRef : resultHeadingRef;
    const target = (FOCUS_TARGETS[view.focus] || regionTop).current;
    if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
  }, [stage]);

  // Focus alone is not orientation. Opening the lane collapses the paste boxes above it,
  // so the lane can sit above the top of the viewport with the scroll position unmoved —
  // a sighted person sees the page jump to content that is nowhere near what they
  // pressed. Bring the lane's heading into view with the same anchor the rest of the
  // workbench scrolls with, so it obeys the header offset and reduced motion already.
  //
  // Closing is the same collapse in reverse: the paste boxes come back, everything below
  // them moves down by their height, and the person is left above the inspection they
  // were reading. Restoring the scroll position the open was made from puts them back on
  // it. Focus goes to the door, which is the control that governs the lane and sits at
  // that restored position — and on the return control's path it is the only place
  // focus can go, since the element it was on is about to be hidden.
  useEffect(() => {
    const prev = laneRef.current;
    laneRef.current = lane;
    if (prev === null || prev === lane) return undefined;
    if (lane === LANE_CHIPS) {
      const id = window.requestAnimationFrame(() => scrollWorkbenchAnchor(chipHeadingRef.current));
      return () => window.cancelAnimationFrame(id);
    }
    const door = chipDoorRef.current;
    if (door && typeof door.focus === "function") door.focus({ preventScroll: true });
    if (laneReturnRef.current === null) return undefined;
    const top = laneReturnRef.current;
    laneReturnRef.current = null;
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [lane]);

  useEffect(() => {
    const goOwnFromHash = () => {
      if (window.location.hash === "#wb-reader-console") setMode("own");
    };
    goOwnFromHash();
    window.addEventListener("hashchange", goOwnFromHash);
    return () => window.removeEventListener("hashchange", goOwnFromHash);
  }, []);

  useEffect(() => {
    if (!scrollReady.current) {
      scrollReady.current = true;
      syncWorkbenchHeaderOffset();
      return undefined;
    }
    if (mode !== "guided") return undefined;
    const id = window.requestAnimationFrame(() => scrollWorkbenchAnchor(stageRef.current));
    return () => window.cancelAnimationFrame(id);
  }, [sel.id, mode]);

  // Scroll to the result exactly ONCE on the transition into a result, never on a
  // same-run rerender (receipt tap, Act 2 state change, async field update). The pure
  // nextResultScroll machine (reader-scroll.js, unit-tested) makes the decision; it
  // re-arms when the result clears so the next real result scrolls once.
  useEffect(() => {
    const { state, scroll } = nextResultScroll(scrollState.current, !!readerResult);
    scrollState.current = state;
    if (scroll && resultRef.current) {
      const id = window.requestAnimationFrame(() => scrollWorkbenchAnchor(resultRef.current));
      return () => window.cancelAnimationFrame(id);
    }
    return undefined;
  }, [readerResult]);

  // RESULT_VIEWED once per distinct result. The run id keys the guard when present;
  // a fallback result has none, so a stable marker stands in. Clearing the result
  // re-arms the guard for the next run.
  useEffect(() => {
    if (!readerResult) {
      viewedRunRef.current = null;
      return;
    }
    const key = readerRunId(readerResult) || (readerResult.source ? `src:${readerResult.source}` : "result");
    if (viewedRunRef.current === key) return;
    viewedRunRef.current = key;
    emitReaderEvent(READER_EVENTS.RESULT_VIEWED, {
      run: readerRunId(readerResult),
      source: readerResult.source || "agent",
    });
  }, [readerResult]);

  // Return flow, browser-local only. Once per browser session (sessionStorage guard),
  // if this browser's own event log shows prior activity, emit RETURN_VISIT. If it
  // shows more targeted questions copied than loops completed, there's an open loop —
  // flag it so the finish-your-loop nudge renders. No server read, no user content;
  // buildFunnel reduces the same content-minimal log the emitter already wrote.
  useEffect(() => {
    let alreadyThisSession = false;
    try {
      alreadyThisSession = sessionStorage.getItem("imbas_reader_session") === "1";
    } catch {}
    const events = readReaderEvents();
    if (events.length === 0) return;
    if (!alreadyThisSession) {
      emitReaderEvent(READER_EVENTS.RETURN_VISIT);
      try {
        sessionStorage.setItem("imbas_reader_session", "1");
      } catch {}
    }
    const funnel = buildFunnel(events);
    const copied = funnel.counts.target_question_copied || 0;
    const completed = funnel.counts.loop_completed || 0;
    // An open loop from a prior visit is restorable: flag the finish-your-loop flow
    // and record the restore. Distinct from RETURN_VISIT (any prior activity) — this
    // fires only when there is resumable state. Content-free.
    if (copied > completed) {
      emitReaderEvent(READER_EVENTS.RESTORED_SESSION, {});
      setReturning(true);
    }
  }, []);

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setReaderResult(null);
    setBusy(false);
    setLane(LANE_INSPECT);
    if (next === "own") setAnswer("");
  };

  // The permanent chip door (§D): the follow-up path is never more than one tap deep.
  // Opening it is the person's own forward move, so it advances the funnel; closing it
  // returns to the inspect lane and does not. Opening also latches chipMounted, which
  // never returns to false: closing hides the lane instead of unmounting it, so a
  // half-typed answer is still there when the person opens it again. Latching is what
  // keeps chip_row_rendered honest — the lane is not mounted until it is opened, so the
  // event still means "the follow-up choices were shown".
  const openChipLane = (via) => {
    if (lane === LANE_CHIPS) return;
    // Read before the state changes: this is the reading position the person opened
    // from, and the only moment it is still on the page to read.
    laneReturnRef.current = window.scrollY;
    advance();
    setChipEntry(normalizeChipEntryVia(via));
    setChipMounted(true);
    setLane(LANE_CHIPS);
  };
  const closeChipLane = () => setLane(LANE_INSPECT);

  // ONE door, rendered at one of two places. The door was measured at ~90% of the page
  // on every viewport, and the depth was never the door's own position — it is already
  // the first node after the result block. What sits above it is the result block's
  // height. So the door does not move: a second mount point for the SAME control opens
  // inside the result block, in the continuation zone below the earned actions, and the
  // late mount stands down there and only there. That place is the follow-up stage —
  // where a measurement exists and the act-2 offer is on the page — because that is the
  // stage the ~90% figure was measured on.
  //
  // This is a mount point, not a second door. The function below is the only place the
  // control is written, so both sites carry the same two labels, the same disclosure
  // pair and the same handlers, and neither can drift from the other. There is no second
  // lane, no second piece of state, and no reparenting: `chipMounted` still holds the
  // one ChipLane where it has always been, and `lane` is still the only thing either
  // mount toggles. That matters more than the placement does — the lane is hidden rather
  // than unmounted precisely so a half-typed answer survives a close, and moving it
  // under a new parent would unmount it and throw that answer away.
  //
  // Two framings, one bank, one lane. Where an inspection stands behind the door, the
  // control renders as two ways in rather than one, because the two reasons a person
  // steers are not the same reason and a single neutral label served neither. They open
  // the identical lane over the identical bank; what differs is the entry recorded.
  // Everywhere else — the standing compose-surface door, and the open lane's own way
  // back out — one control stands, with the labels it has always carried.
  const twoDoors = lane !== LANE_CHIPS && !!readerResult;
  // The focus ref follows the door that was actually pressed. chipDoorRef is what returns
  // a closing person to the control they opened from, and with two controls on the page
  // only one of them is that control. chipEntry holds which, so the ref seats there and
  // nowhere else; before any press it seats on the first, which is where a keyboard
  // arriving at this block lands anyway.
  const doorRefFor = (via) => {
    if (!twoDoors) return chipDoorRef;
    const seated = chipEntry === CHIP_ENTRY_VIA.INSPECTION_PROACTIVE
      ? CHIP_ENTRY_VIA.INSPECTION_PROACTIVE
      : CHIP_ENTRY_VIA.INSPECTION_REACTIVE;
    return via === seated ? chipDoorRef : null;
  };
  const chipDoorButton = (via, label) => (
    <button
      type="button"
      ref={doorRefFor(via)}
      className="wb-demo-trigger wb-chip-door"
      onClick={lane === LANE_CHIPS ? closeChipLane : () => openChipLane(via)}
      aria-expanded={lane === LANE_CHIPS}
      /* The lane is not in the DOM until the door is first opened, so naming it
         unconditionally points assistive technology at an id that does not exist on
         an ordinary first visit. The name is carried once the lane is real and
         withheld before that. `hidden` is not absence: a closed-but-mounted lane is
         still a real element, so it is still named. aria-expanded stands either way. */
      aria-controls={chipMounted ? "wb-chip-lane" : undefined}
    >
      {label}
    </button>
  );
  const chipDoorControl = () => (
    /* One id across both mount points, which is safe because the two are mutually
       exclusive by construction: the early mount is exactly STAGE_FOLLOWUP and the
       late one is exactly its complement. The strip's follow-up link lands here. */
    <div
      id={RESULT_CAPABILITY_ANCHORS.followUp}
      className="wb-reader-v2__follow wb-reader-v2__follow--chip-door wb-scroll-anchor"
    >
      {twoDoors ? (
        <div className="wb-chip-entry" role="group" aria-labelledby="wb-chip-entry-heading">
          {/* The step named. Steering is what the Reader does after it reads, and until
              this line the page offered it without ever saying what it was. */}
          <p className="wb-chip-entry__heading" id="wb-chip-entry-heading">{CHIP_UI.entry.heading}</p>
          <div className="wb-chip-entry__ways">
            <div className="wb-chip-entry__way">
              {chipDoorButton(CHIP_ENTRY_VIA.INSPECTION_REACTIVE, CHIP_UI.entry.reactive)}
            </div>
            <div className="wb-chip-entry__way">
              {chipDoorButton(CHIP_ENTRY_VIA.INSPECTION_PROACTIVE, CHIP_UI.entry.proactive)}
              {/* The cue sits under this door and not the other one. A person improving a
                  draft is the person about to put their name on it, and that is the only
                  one of the two entries where the sentence is about them. It is not a
                  finding and it claims nothing about the answer above it. */}
              <p className="wb-chip__pro-cue wb-chip-entry__cue">
                <span className="wb-chip__pro-line">{CHIP_UI.professional_cue.line}</span>
                <a className="wb-chip__pro-link wb-focus" href="/advisory.html">{CHIP_UI.professional_cue.link}</a>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* The closed label names where the press goes, not what appears. Activation
           derives STAGE_CHIPS, and that stage's view drops pasteBox, result and act2,
           so the source text and the result leave the stage. "Show" promised mere
           disclosure and described the wrong operation. "Your own" is the line the
           lane's own copy already holds — the person chooses this follow-up and the
           inspection did not generate it — and the closed label is where it is needed,
           because the follow-up stage carries the act-2 offer at the same time.
           Hide stays on the open side, and not Close: the lane is hidden rather than
           unmounted and keeps whatever was typed in it. That label renders on
           STAGE_CHIPS alone, where the lane may be holding a comparison rather than a
           row of choices, so it names the follow-up and never the choices.

           This branch is the standing door: the compose surface, where nothing has been
           inspected, and the open lane's own way back out. Its press carries the direct
           origin, which is the truthful one — no inspection stands behind it. */
        chipDoorButton(
          CHIP_ENTRY_VIA.DIRECT_STANDING,
          lane === LANE_CHIPS ? "Hide your own follow-up" : "Choose your own follow-up",
        )
      )}
    </div>
  );

  // Both doors into the compare stage land here: the copy action and the explicit
  // "Paste what came back" control. Either one is the person's own forward move.
  const openFollowUp = () => {
    if (followUpOpen) return;
    advance();
    setFollowUpOpen(true);
  };
  const setPairedDelta = (present) => {
    if (present === hasDelta) return;
    if (present) advance();
    setHasDelta(present);
  };

  // In-product reversal from a result back to the paste box. Browser Back deliberately
  // does not do this (no stage pushes history), so this is the affordance that keeps
  // read-only context from being a one-way door.
  //
  // It does not call advance(), so the entry carries CAUSE_POP and counts as no forward
  // motion. It does still emit: landing back on compose is the run-occurrence boundary,
  // and that is where the next inspection's funnel begins.
  const editAnswer = () => {
    setReaderResult(null);
    setErrors({});
    if (stageRef.current) {
      window.requestAnimationFrame(() => scrollWorkbenchAnchor(stageRef.current));
    }
  };


  // Open the canned demo. Emit the demo-open signal ONCE per mount, tagged
  // mode/source "demo" so it stays filterable and never inflates the copied/completed
  // north star. The demo itself makes no API call.
  const openDemo = () => {
    setDemoOpen(true);
    if (!demoEmittedRef.current) {
      demoEmittedRef.current = true;
      emitReaderEvent(READER_EVENTS.RUN_STARTED, { mode: "demo", source: "demo" });
    }
  };

  // Leave the demo and drop the visitor at the paste box, ready to run their own.
  const tryOwnFromDemo = () => {
    setDemoOpen(false);
    if (mode !== "own") switchMode("own");
    if (stageRef.current) {
      window.requestAnimationFrame(() => scrollWorkbenchAnchor(stageRef.current));
    }
  };

  const pickCase = (c) => {
    if (!c.ready || c.id === sel.id) return;
    setSel(c);
    setAnswer("");
    setReaderResult(null);
    setErrors({});
    setBusy(false);
  };

  // Second-run mini-loop (redesign edit 5). Clear the run and stage a fresh QUESTION.
  // The answer field is always cleared; the suggested question goes to the case (guided)
  // or the question field (own) — NEVER into the answer paste field. Clearing the result
  // re-arms the scroll machine, so the next result scrolls once.
  const startAnother = (suggestion) => {
    setReaderResult(null);
    setErrors({});
    setBusy(false);
    setAnswer("");
    // Only guided mode carries a suggested next case. Own mode used to write the
    // suggestion's openPrompt into the question field, which was the third route a
    // curated question took into an own-mode run; own mode now clears the answer and
    // keeps whatever question the person wrote themselves.
    if (mode === "guided" && suggestion) setSel(suggestion);
    if (stageRef.current) {
      window.requestAnimationFrame(() => scrollWorkbenchAnchor(stageRef.current));
    }
  };

  const touchAnswer = (v) => {
    setAnswer(v);
    setErrors((e) => ({ ...e, answer: "" }));
    if (readerResult) setReaderResult(null);
  };

  const touchQuestion = (v) => {
    setQuestion(v);
    setErrors((e) => ({ ...e, question: "" }));
    if (readerResult) setReaderResult(null);
  };

  const run = async () => {
    if (busy) return;
    const nextErrors = {};
    const q = mode === "guided" ? sel.openPrompt : question;
    const a = answer;
    if (mode === "own" && !(q || "").trim()) nextErrors.question = "Add the question you asked.";
    if (!(a || "").trim()) nextErrors.answer = "Paste an answer to run The Reader.";
    // Preflight against the ceiling the endpoint enforces. The disabled button already
    // covers the pointer path; this covers every other way run() can be reached, so no
    // route spends a round trip on a request that is already known to be rejected.
    if (answerWordState(a).over) nextErrors.answer = answerOverMaxNotice(a);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    // Validation passed, so this click really is the stage's primary action. Set the
    // cause here, adjacent to the setter that moves the stage — never earlier, or a
    // bailed-out run would leave CAUSE_ADVANCE armed for an unrelated later change.
    advance();
    setBusy(true);
    setReaderResult(null);
    emitReaderEvent(READER_EVENTS.RUN_STARTED, { mode });
    const request = buildReaderRequest({
      mode,
      sel,
      question,
      answer: a,
      topic,
      model,
    });
    try {
      const data = await runReader(request);
      // The settle moves the stage a second time, and nobody clicked for it. Which stage
      // it lands on is deriveStage's call: `followup` when the payload carries an Act 2
      // offer, `result` when it does not — the whole degraded population. Attribute the
      // move here or that stage is entered with no cause of its own and reads as history
      // navigation, which is how the funnel lost its middle.
      causeRef.current = data.source === "fallback" ? CAUSE_DEGRADED : CAUSE_ASYNC;
      setReaderResult(data);
      const run = readerRunId(data);
      emitReaderEvent(READER_EVENTS.RUN_COMPLETED, {
        run,
        mode,
        source: data.source || "agent",
        eligible: !!(data.act2 && data.act2.eligible),
      });
      // Capacity family (ceiling / timeout / provider-unavailable): the metered lane was
      // withheld and the client shows the one capacity sentence, so log the coherent
      // capacity-degradation signal with its cause (§C/§D). Reason is the fallback enum
      // parsed from the body's "(reason)" marker — an enum, never content.
      if (data.source === "fallback") {
        const reasonCode = readerFallbackReasonCode(data).toLowerCase();
        if (isCapacityFallbackReason(reasonCode)) {
          emitReaderEvent(READER_EVENTS.CAPACITY_DEGRADATION, { run, mode, reason: reasonCode });
        }
        // A model timeout is additionally a distinct §A operational signal.
        if (reasonCode === "timeout") {
          emitReaderEvent(READER_EVENTS.TIMEOUT, { run, mode, reason: "timeout" });
        }
      }
      // Capture/persistence uncertainty: the run displayed but the pipeline write was
      // not confirmed. Content-free operational signal (§D).
      if (data.capture_uncertain) {
        emitReaderEvent(READER_EVENTS.CAPTURE_UNCERTAIN, { run, mode });
      }
    } catch (err) {
      if (err && err.message === "too_long") {
        setErrors({ answer: ANSWER_TOO_LONG_MESSAGE });
      } else {
        causeRef.current = CAUSE_DEGRADED;
        setReaderResult({
          source: "fallback",
          // Was `completeness: "thin"`. Nothing was measured, so there was no
          // completeness to carry; the value was set to drive the muted styling and it
          // was doing that under a measurement field's name, which is how the copyable
          // card came to look a signal name up from a request that never ran. It is a
          // presentation key and it is named as one now.
          display_treatment: "muted",
          the_read: readerFallbackReadBody(),
          what_was_left_out: [],
          how_it_was_shaped: "",
          reason: String(err.message || "network"),
        });
        emitReaderEvent(READER_EVENTS.RUN_COMPLETED, { mode, source: "fallback", eligible: false });
        // A hard 429 is the Reader's coherent capacity trip (rate or spend ceiling);
        // the ceiling-trip itself is logged server-side, this is the client's view.
        if (err && err.message === "read_429") {
          emitReaderEvent(READER_EVENTS.CAPACITY_DEGRADATION, { mode, reason: "capacity" });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wb-reader-v2">
      <div className="wb-reader-v2__stack">
        {returning && !readerResult ? <ReturnNudge onDismiss={() => setReturning(false)} /> : null}
        {/* The chip lane is self-contained (§D): it brings its own answer box, so the
            console has nothing to offer there. Leaving it mounted put an empty read-only
            paste box above the lane a ?start=chips visitor arrived for. */}
        {view.pasteBox ? (
        <div ref={stageRef} id="wb-reader-console" className="wb-console wb-reader-console wb-scroll-anchor">
          <div className="wb-console__main">
            {/* Not tabs, and the half-built tablist that used to sit here said they were.
                A tab controls one panel and swaps a view losslessly. These two control four
                disjoint regions — the case grid, the confirm block's heading, the field set,
                and the confirm block's own class — and switchMode discards the result, the
                errors and the pasted answer on the way through. There is no single element
                that could honestly take aria-controls, and inventing a wrapper to hold one
                would be building interaction architecture to satisfy a pattern the UI does
                not implement. They are what they look like: two buttons, one of them on. */}
            <div className="wb-reader-v2__modes wb-reader-v2__modes--inline" role="group" aria-label="Reader mode">
              <button
                type="button"
                aria-pressed={mode === "own"}
                className={`wb-reader-v2__mode wb-focus${mode === "own" ? " is-active" : ""}`}
                onClick={() => switchMode("own")}
              >
                <span className="wb-reader-v2__mode-name">Paste Your Own</span>
                <span className="wb-reader-v2__mode-desc">Bring any AI answer.</span>
              </button>
              <button
                type="button"
                aria-pressed={mode === "guided"}
                className={`wb-reader-v2__mode wb-focus${mode === "guided" ? " is-active" : ""}`}
                onClick={() => switchMode("guided")}
              >
                <span className="wb-reader-v2__mode-name">Guided Case</span>
                {/* "a measured case" described the rotation until the flagship joined it.
                    The flagship is a Reader run on a public example, not a scored case,
                    so the noun had to widen to what all three entries have in common. */}
                <span className="wb-reader-v2__mode-desc">Start with an example Imbas has already run.</span>
              </button>
            </div>

            {mode === "guided" ? (
              <>
                <div className="wb-case-selector wb-reader-case-grid">
                  {CURATED.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${c.id === sel.id ? " is-active" : ""}${!c.ready ? " is-disabled" : ""}`}
                      onClick={() => pickCase(c)}
                      disabled={!c.ready}
                      title={c.title}
                    >
                      {c.ready ? <div className="wb-specimen-plate__label wb-reader-case-card__label">{c.cardLabel}</div> : <Label>To add</Label>}
                      <div className="wb-case-card__title">{c.cardTitle}</div>
                    </button>
                  ))}
                </div>
                <ReaderCaseEvidence sel={sel} />
              </>
            ) : (
              <div className="wb-reader-v2__own-header">
                {rerunSeeded ? (
                  <p className="wb-reader-v2__own-intro wb-reader-v2__own-intro--rerun">
                    You carried this question over from a record you were reading. Ask your AI again and paste what it says today. Imbas asks nothing on your behalf. What comes back becomes its own record with its own date, and the one you came from does not change.
                  </p>
                ) : (
                  <>
                    {/* The notice stands ABOVE the standing intro rather than replacing
                        it. Replacing it would answer the failed carry-over by taking
                        away the instruction the person now needs, which is the opposite
                        of leaving the ordinary Reader intact. It borrows the rerun
                        line's treatment because it is the same kind of thing — arrival
                        context, not instruction — and so adds no rule of its own. */}
                    {rerunUnresolved ? (
                      <p className="wb-reader-v2__own-intro wb-reader-v2__own-intro--rerun" role="status">
                        {RERUN_UNRESOLVED_NOTICE}
                      </p>
                    ) : null}
                    <p className="wb-reader-v2__own-intro">
                      Paste an AI answer below. The Reader inspects what it might be missing.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className={`wb-confirm-block wb-reader-confirm wb-flow-module${mode === "own" ? " wb-reader-confirm--own" : ""}`}>
              {mode === "guided" ? (
                <>
                  <Label>Confirm it yourself</Label>
                  <p className="wb-reader-confirm__lead">Paste the answer you got. The Reader will inspect how it handled the question.</p>
                </>
              ) : null}

              <div className="wb-reader-v2__fields">
                {mode === "guided" ? (
                  <>
                    <div className="wb-reader-v2__field wb-reader-v2__field--optional">
                      <Field label="Which AI did you ask? (optional)"><ModelSelect value={model} onChange={setModel} /></Field>
                    </div>
                    <div className="wb-reader-v2__field wb-reader-v2__field--answer">
                      <PasteField
                        label="AI answer received"
                        overMaxNotice={answerOverMaxNotice}
                        value={answer}
                        onChange={touchAnswer}
                        error={errors.answer}
                        placeholder="Paste the full AI answer here…"
                        minAckLength={1}
                        readOnly={!composeLive}
                        inputRef={composeAnswerRef}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="wb-reader-v2__field wb-reader-v2__field--answer">
                      <PasteField
                        label="AI answer received"
                        overMaxNotice={answerOverMaxNotice}
                        value={answer}
                        onChange={touchAnswer}
                        error={errors.answer}
                        placeholder="Paste an AI answer. Anything from ChatGPT, Gemini, Claude…"
                        minAckLength={1}
                        readOnly={!composeLive}
                        inputRef={composeAnswerRef}
                      />
                    </div>
                    {hasAnswer || hasQuestion ? (
                      <div className="wb-reader-v2__reveal">
                        <div className="wb-reader-v2__field">
                          <Field label="Question asked">
                            <textarea
                              className={INPUT_CLS}
                              value={question}
                              onChange={(e) => touchQuestion(e.target.value)}
                              placeholder="What did you ask the model?"
                              rows={3}
                              style={inputStyle}
                              aria-invalid={!!errors.question}
                              readOnly={!composeLive || undefined}
                              aria-readonly={!composeLive || undefined}
                            />
                          </Field>
                          {errors.question ? <div className="wb-field-error" role="alert">{errors.question}</div> : null}
                          {ownQuestionPrompt && !errors.question ? (
                            <div className="wb-field-error wb-field-error--hint" role="status">Add the question you asked.</div>
                          ) : null}
                        </div>
                        <div className="wb-reader-v2__field wb-reader-v2__field--optional">
                          <Field label="Optional topic / context">
                            <input className={INPUT_CLS} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. climate policy, drug pricing…" style={inputStyle} />
                          </Field>
                        </div>
                        <div className="wb-reader-v2__field wb-reader-v2__field--optional">
                          <Field label="Which AI did you ask? (optional)"><ModelSelect value={model} onChange={setModel} /></Field>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div className="wb-reader-v2__action-row" aria-busy={busy}>
                <ReaderStatusLine state={statusState} />
                <details className="wb-reader-v2__privacy">
                  <summary className="wb-reader-v2__privacy-line">
                    Inspections aren't published to our reviewed archive. Don't paste anything sensitive.
                  </summary>
                  <p className="wb-reader-v2__privacy-full">
                    Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See <a href="/retention.html">what deletion means</a> and the <a href="/privacy.html">privacy policy</a>.
                  </p>
                </details>
                {/* One row, two states, because the fields above have two states. While
                    they are live it carries the button that runs the inspection. Once a
                    result exists they go read-only, and it carries the way back that
                    re-opens them.

                    That control headed the result block until the composition pass, where
                    it was a rendered block standing above the count — a reader met the way
                    out before they met the finding. It belongs to the thing it re-opens,
                    so it lives on the compose block now. It is still unconditional on a
                    result existing, which is what InspectionMeaningPanel's `restart` flag
                    asserts, and it still clears the result and emits nothing. */}
                {readerResult ? (
                  <div className="wb-action-row wb-reader-v2__cta-row wb-reader-v2__cta-row--edit">
                    <button type="button" className="wb-demo-trigger wb-edit-answer" onClick={editAnswer}>
                      ← Edit the answer
                    </button>
                  </div>
                ) : (
                  <div className="wb-action-row wb-reader-v2__cta-row">
                    <Btn
                      kind="primary"
                      disabled={busy || !isReady}
                      onClick={run}
                      className={`wb-reader-cta${isReady && !busy ? " is-armed" : ""}${busy ? " is-inspecting" : ""}`}
                    >
                      {busy ? "Inspecting…" : "See what might be missing"}
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {/* Both of these explain the paste box, so they follow it. In the chip lane there is
            no paste box to explain, and the demo's own "try your own" exit leads back to a
            console that lane does not render. */}
        {view.pasteBox ? (
        <React.Fragment>
        {/* §E: the paste box leads, and the ready example is the one quiet secondary under
            it. The demo used to sit above the box, where it competed with the thing it was
            meant to explain. Nothing was deleted — it moved. */}
        <div className="wb-demo-trigger-row">
          <button
            type="button"
            className="wb-demo-trigger"
            onClick={demoOpen ? () => setDemoOpen(false) : openDemo}
            aria-expanded={demoOpen}
          >
            {demoOpen ? PUBLIC_EXAMPLE_UI.close_label : PUBLIC_EXAMPLE_UI.trigger_label}
          </button>
        </div>
        {demoOpen ? <ReaderDemo onTryOwn={tryOwnFromDemo} onClose={() => setDemoOpen(false)} /> : null}

        {/* The collapsed "How it works". Same three steps the first-run strip used to push
            above the paste box, now one tap away and available to everyone every time
            rather than to first-timers once. */}
        <details className="wb-clarity">
          <summary className="wb-clarity__summary">How it works</summary>
          <ol className="wb-clarity__steps">
            {READER_CLARITY_STEPS.map((text, i) => (
              <li key={i} className="wb-clarity__step">
                <span className="wb-clarity__num" aria-hidden="true">{i + 1}</span>
                <span className="wb-clarity__text">{text}</span>
              </li>
            ))}
          </ol>
        </details>
        </React.Fragment>
        ) : null}

        {readerResult ? (
          <div
            ref={(node) => {
              resultRef.current = node;
              resultHeadingRef.current = node;
            }}
            tabIndex={-1}
            className="wb-reader-v2__result wb-scroll-anchor"
          >
            {/* GLANCE, then READ, then INSPECT, and the order of these three mounts is
                that rule made literal.

                The hero is GLANCE: the count and what it counts. The measurement panel
                is READ — the marks, which is the evidence a reader came for — and it
                now stands directly under the count instead of below the Reader's prose.
                The Reader's reading follows the marks rather than preceding them, which
                is the whole move: an interpretation is worth more to someone who has
                already seen what it interprets, and it was previously nine blocks of
                explanation standing between a person and their own excerpts.

                The way back to the compose fields used to head this block. It moved to
                the compose action row above, which is the thing it re-opens. */}
            {readerResult.measurement ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--hero">
                <ReaderResultHero result={readerResult} />
              </div>
            ) : null}
            {/* The strip sits between GLANCE and READ, and that is the only place it
                works. Above the hero it would meet a person before the count they came
                for; below the marks it would be another thing to scroll past on the way
                to the thing it describes. Here it is the first thing after the number,
                which is the moment a person has read the result and not yet learned that
                the page continues.

                Gated on `measurement`, the same test the hero carries, so it exists
                exactly where the hero it follows exists — never heading a degraded or
                fallback surface, where the sections it names are not on the page. */}
            {readerResult.measurement && capabilityLinks.length ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--capabilities">
                <ResultCapabilityStrip links={capabilityLinks} />
              </div>
            ) : null}
            {readerResult.measurement ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--measure">
                <MeasurementPanel
                  result={readerResult}
                  context={{ mode, sel, question, answer, model, topic }}
                />
              </div>
            ) : null}
            <div className="wb-reader-v2__follow">
              <ReaderResultBlock
                result={readerResult}
                context={{ mode, sel, question, answer, model, topic }}
                onRunAgain={run}
              />
            </div>
            {checkRegisterVisible ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--checks">
                <CheckRegisterPanel result={readerResult} />
              </div>
            ) : null}
            {/* Render-only interpretation of the single inspection. Gated on measurement
                (not on checks) so it renders for both S1 (no findings surfaced) and S2
                (findings present); single mode → no pair_runs, so conditions are never
                consulted. The count is surfaced_findings — the same named subset
                MeasurementPanel lists, so the panel and this interpretation cannot
                disagree about how many items surfaced. It replaces a max() over the
                findings array and the Check Register cards, which was an unnamed count
                computed in the renderer to approximate a union the canonical collection
                now states outright. Perturbs no record. */}
            {readerResult.measurement ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--meaning">
                {/* Each availability flag is the render test of the panel that carries the
                    control. checks and reviewRecord share checkRegisterVisible because the
                    export lives inside the register; receipt rides the Measurement panel,
                    which renders on the same condition this mount does; restart is the Edit
                    the answer control on the compose action row above, which renders on
                    exactly `readerResult` and so is unconditional wherever this mounts. */}
                <InspectionMeaningPanel
                  pairRuns={[]}
                  findings={countOf(readerResult.result, "surfaced_findings")}
                  available={{
                    checks: checkRegisterVisible,
                    reviewRecord: checkRegisterVisible,
                    receipt: !!(readerResult.measurement && readerResult.receipt),
                    followUp: !!(readerResult.act2 && readerResult.act2.eligible),
                    restart: true,
                  }}
                />
              </div>
            ) : null}
            {/* The tap asks whether this surfaced something. With nothing surfaced the
                question has no true answer, and both answers write the same two enums
                into the same field as every other run, so a Yes here and a Yes after
                four findings become one indistinguishable row. Telemetry that cannot be
                read back is worse than telemetry that was never collected, so the tap is
                not asked rather than reworded. The count is surfaced_findings, the subset
                the panel above lists, so the tap and the rows cannot disagree about
                whether anything surfaced; on a single-answer result it selects the same
                set as the hero's surfaced_candidate_items. Paired keeps its own tap: an
                empty delta still has a true answer to how big the difference felt. */}
            {readerResult.measurement && readerResult.receipt && countOf(readerResult.result, "surfaced_findings") > 0 ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--perception">
                <PerceptionTap mode="single" receipt={readerResult.receipt} />
              </div>
            ) : null}
            {readerResult.act2 ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--act2">
                <Act2Offer
                  result={readerResult}
                  open={followUpOpen}
                  onOpen={openFollowUp}
                  onPairedChange={setPairedDelta}
                  pairedInputRef={pairedAnswerRef}
                />
              </div>
            ) : null}
            {/* The door's early mount point, inside the result block, on the follow-up
                stage. It sits after the act-2 offer on purpose: the offer is the action the
                inspection earned, and the door stays secondary to it — the person meets the
                measured question first and the menu of other questions second.

                CORRECTED. An earlier cut of this mount stood on the result stage, on the
                reasoning that an available act-2 moves the stage to FOLLOWUP and so the
                result stage was the one left holding a buried door. The tree says otherwise
                and the stage is the wrong one: `buildAct2` (api/read.js) returns null only
                when `measurement` is null, so in production STAGE_RESULT is the degraded
                fallback path alone. The buried door was measured on a page with a real
                measurement on it, which is this stage. Moving it at RESULT repositioned the
                door on error and capacity surfaces — states reached when something has
                already gone wrong — and left the page the measurement was taken on
                untouched. */}
            {stage === STAGE_FOLLOWUP ? chipDoorControl() : null}
            {view.loop ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--loop">
                <SecondRunLoop mode={mode} sel={sel} onAnother={startAnother} />
              </div>
            ) : null}
            <p className="wb-reader-v2__post-privacy">
              This inspection wasn't published to our reviewed archive. See <a href="/retention.html">what deletion means</a>.
            </p>
          </div>
        ) : null}

        {/* User-chip lane — a self-contained user-directed follow-up, independent of whether
            an inspection ran above. Its own value statement heads it off, so it never reads as
            part of the inspection flow. The lane owns an answer-entry textarea, so it renders
            behind a door instead of unconditionally: two answer boxes on first load competed
            for the same first keystroke. The door closes at the compare stage, where a
            stage-specific paired-answer input is already live.

            This is the door's late mount point, and it stands down on one stage only.
            At the follow-up stage the door is mounted earlier, inside the result block, so
            rendering it here too would put the same control on the page twice; every other
            stage this door renders on — compose, result, delta, chips — is untouched and
            still reaches it here, at the depth it has always had. `stageView` is unchanged:
            the stand-down is written at this mount point, not in the stage machine.

            The stage named here was RESULT for one pass and is now FOLLOWUP. That is the
            whole correction: the result stage is the degraded fallback path, so standing
            down there moved the door on error and capacity surfaces and nowhere a
            measurement had been taken. Its prior late-door behaviour is restored. */}
        {view.chipDoor && stage !== STAGE_FOLLOWUP ? chipDoorControl() : null}
        {/* Mounted on first open and never unmounted after: `hidden` takes the lane out of
            the layout, the tab order and the accessibility tree, so the one-live-input
            invariant holds while a half-typed answer survives a close and reopen. */}
        {chipMounted ? (
          <div
            id="wb-chip-lane"
            className="wb-reader-v2__follow wb-reader-v2__follow--chips"
            hidden={!view.chipLane}
          >
            {/* openedFrom is the inspection's own question, and it is empty unless an
                inspection exists: the standing door and the ?start=chips arrival open
                this lane over nothing, and naming an inspection there would name a
                page the person never ran. It is the same expression the workbench
                already reads a question from, so the two cannot drift.

                heldReceipt is the inspection's own receipt, and the lane reads the
                authoritative first answer off it. It is deliberately the whole receipt
                rather than the answer alone: the chip-open receipt records which receipt
                it continues, and that reference only means anything if it names the
                receipt the answer came from. A degraded run carries no receipt, so this
                is null there and the lane opens on its own draft instead. */}
            <ChipLane
              headingRef={chipHeadingRef}
              onReturn={closeChipLane}
              openedFrom={readerResult ? (mode === "guided" ? sel.openPrompt : question).trim() : ""}
              heldReceipt={readerResult ? readerResult.receipt || null : null}
              enteredVia={chipEntry}
            />
          </div>
        ) : null}

        <div className="wb-reader-v2__follow wb-reader-v2__follow--suggest">
          <SuggestInvestigation variant="reader-secondary" />
        </div>

        {showFunnel ? (
          <div className="wb-reader-v2__follow wb-reader-v2__follow--funnel">
            <ReaderFunnelPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---- SHELL ----
function Workbench() {
  const headingRef = useRef(null);
  const [readerOn] = useState(() => isReaderWorkbenchEnabled());

  useEffect(() => {
    syncWorkbenchHeaderOffset();
    const onResize = () => syncWorkbenchHeaderOffset();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className={`wb-shell${readerOn ? " wb-shell--reader-v2" : ""}`} style={{ color: C.text, minHeight: "100vh", fontFamily: SANS }}>
      <style>{FONT_IMPORT}</style>
      <style>{WORKBENCH_A11Y_CSS}{WORKBENCH_RESULT_GAP_CSS}{WORKBENCH_RESULT_LAYOUT_CSS}{WORKBENCH_FLOW_CSS}{WORKBENCH_TERMS_CSS}</style>
      <div className="wb-shell__frame">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "0.02em" }}>Imbas</div>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: C.textFaint, textTransform: "uppercase" }}>Reader</div>
        </div>
        <div style={{ height: 1, background: C.line, marginBottom: 22 }} />

        {readerOn ? (
          <div className="wb-reader-v2__flow">
            <p className="wb-reader-v2__eyebrow">READER</p>
            <h1 ref={headingRef} className="wb-scroll-anchor wb-reader-v2__headline">
              Check your AI answer.
            </h1>
            <p className="wb-reader-v2__subcopy">
              Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped.
            </p>
            <ReaderWorkbench />
            <div className="wb-reader-v2__trust">
              <div className="wb-reader-v2__trust-rule" aria-hidden="true" />
              <p className="wb-reader-v2__trust-note">
                Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.
              </p>
            </div>
            {/* §E puts nothing between the headline and the paste box. These two doors are
                kept, not deleted — they move below the instrument they used to sit above. */}
            <div className="page__cta-row wb-context-links wb-reader-v2__context-links">
              <a href={FEATURED_ROUTE}>View {FEATURED.shortLabel} <span className="arrow" aria-hidden="true">&rarr;</span></a>
              <a href="/archive.html">Explore the Archive <span className="arrow" aria-hidden="true">&rarr;</span></a>
            </div>
          </div>
        ) : (
          <>
            <h1 ref={headingRef} className="wb-scroll-anchor" style={{ fontFamily: SERIF, fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 500, lineHeight: 1.15, margin: "0 0 10px" }}>
              See what your AI leaves out.
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 16.5, lineHeight: 1.6, color: C.textDim, margin: "0 0 22px", maxWidth: 560 }}>
              Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see.
            </p>
            <div className="page__cta-row wb-context-links" style={{ marginTop: 0, marginBottom: 22, paddingTop: 0, borderTop: "none" }}>
              <a href="/volunteer-gap.html">Read the Volunteer Gap <span className="arrow" aria-hidden="true">&rarr;</span></a>
              <a href={FEATURED_ROUTE}>View {FEATURED.shortLabel} <span className="arrow" aria-hidden="true">&rarr;</span></a>
              <a href="/archive.html">Explore the Archive <span className="arrow" aria-hidden="true">&rarr;</span></a>
            </div>
            <Curated />
          </>
        )}

        {!readerOn ? (
          <>
            <div style={{ height: 1, background: C.line, margin: "48px 0 16px" }} />
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.textFaint, lineHeight: 1.7, letterSpacing: "0.03em" }}>
              Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}


const root = ReactDOM.createRoot(document.getElementById('workbench-root'));
root.render(<Workbench />);

