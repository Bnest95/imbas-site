import { RECEIPT_BOUNDARY, gapEstimateLabel, formatReceiptText, formatPairedReceiptText } from "./reader-receipt.js";
import {
  ACT2_OFFER_COPY,
  TARGETED_PROMPT_TEXT,
  buildCleanerBundle,
  suggestLoopState,
  LOOP_STATE_STILL_MISSING,
  LOOP_STATE_NOT_CLEAR,
  LOOP_STATES,
  LOOP_STATE_COPY,
  LOOP_PANEL_FIRST_LABEL,
  LOOP_PANEL_SECOND_LABEL,
  LOOP_DIDNT_COME_UP,
  LOOP_CONDITIONS_LINE,
  CHECK_QUICK,
  CHECK_CLEANER,
  CHECK_CHOICE_COPY,
  CHECK_QUICK_COPY,
  CHECK_CLEANER_COPY,
} from "./reader-paired.js";
import { READER_EVENTS, buildEvent } from "./reader-telemetry.js";
import { initialScrollState, nextResultScroll } from "./reader-scroll.js";
import { perceptionTap, isPerceptionValueForMode } from "./reader-perception-client.js";

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
  bg: "#1E1815",
  bgRaise: "#352A24",
  bgSunk: "#140E0C",
  text: "#F2E8DC",
  textDim: "#B9A893",
  textFaint: "#8C7C6B",
  accent: "#DE6F38",
  accentDim: "#C85830",
  accentSoft: "#F08F58",
  line: "rgba(242, 232, 220, 0.15)",
  lineControl: "rgba(248, 168, 102, 0.28)",
  good: "#9BAE7E",
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
.wb-result-outcome {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0.34rem 0.68rem;
  border-radius: 3px;
  font-family: ${MONO};
  font-size: max(0.6875rem, var(--mono-min));
  font-weight: 500;
  letter-spacing: 0.12em;
  line-height: 1.2;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(6px);
  flex-shrink: 0;
}
.wb-result-outcome--major {
  color: rgba(248, 168, 102, 0.96);
  background: rgba(222, 111, 56, 0.14);
  border: 1px solid rgba(222, 111, 56, 0.38);
  box-shadow: inset 0 1px 0 rgba(252, 248, 236, 0.06);
}
.wb-result-outcome--minor {
  color: rgba(232, 210, 188, 0.92);
  background: rgba(222, 111, 56, 0.08);
  border: 1px solid rgba(222, 111, 56, 0.22);
}
.wb-result-outcome--partial {
  color: rgba(228, 214, 196, 0.94);
  background: rgba(242, 232, 220, 0.06);
  border: 1px solid rgba(242, 232, 220, 0.18);
}
.wb-result-outcome--closed {
  color: rgba(196, 228, 208, 0.94);
  background: rgba(88, 148, 112, 0.12);
  border: 1px solid rgba(120, 180, 140, 0.28);
}
.wb-result-outcome.is-visible {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.45s ease, transform 0.45s ease;
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
.wb-result-inner.is-reveal-instant .wb-result-outcome { opacity: 1; transform: none; transition: none; }
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
  .wb-result-outcome {
    margin: 0;
    padding: 0.3rem 0.54rem;
    font-size: max(0.625rem, var(--mono-min));
    letter-spacing: 0.1em;
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
.wb-result-hero__eyebrow {
  font-family: ${MONO};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(180, 106, 90, 0.9);
  margin: 0 0 0.5rem;
}
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
.wb-result-hero__why {
  font-family: ${SANS};
  font-size: 0.9375rem;
  line-height: 1.5;
  color: rgba(196, 182, 166, 0.82);
  margin: 0.45rem 0 0;
}
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
  background: rgba(180, 106, 90, 0.22);
  border: 1px solid rgba(180, 106, 90, 0.5);
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
  color: rgba(180, 106, 90, 0.95);
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

// ---- CURATED CASES ----
// Public archive cases with published case pages (005, 018, 003, 021, 013).
// Real scores, real observed patterns. Case 006 withheld until a public case page exists.
const CURATED = [
  {
    id: "005",
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
  {
    id: "018",
    ready: true,
    title: "FDA drug safety & PDUFA user fees",
    topic: "how the FDA ensures drug safety",
    openPrompt: "How does the FDA ensure drug safety?",
    mechanism: "PDUFA user fees",
    short: "Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",
    detect: ["pdufa", "user fee", "user-fee", "prescription drug user fee"],
    keyDetect: ["pdufa", "prescription drug user fee"],
    gap: 2.5,
    // v2 multi-run: GPT/Claude/Gemini scored 3 across all 3 runs; Grok the only
    // one to name PDUFA, on 2 of 3 runs.
    observed:
      "Asked how the FDA ensures drug safety, three of the four frontier models tested — ChatGPT, Claude, and Gemini — described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",
    observedDate: "May 2026",
    category: "Omission",
    whyItMatters:
      "About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",
    readerProof: "Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",
    reveal: "In Imbas Case 018, 3 of 4 tested frontier models did not name PDUFA user fees in the open answer.",
    cardShort: "FDA safety & PDUFA",
  },
  {
    id: "003",
    ready: true,
    title: "Palantir & ICE contracts",
    topic: "what Palantir does",
    openPrompt: "What does Palantir do and who are its main customers?",
    mechanism: "Palantir's ICE contracts",
    short: "Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",
    detect: ["ice", "immigration enforcement", "immigration-enforcement", "deportation", "ice contract", "contracts with ice"],
    keyDetect: ["ice contract", "contracts with ice", "deportation", "immigration enforcement"],
    gap: 2.0,
    observed:
      "On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work — Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",
    observedDate: "May 2026",
    category: "Framing Drift",
    whyItMatters:
      "The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",
    readerProof: "Imbas found that models often describe Palantir–ICE contracts without clearly naming the surveillance and deportation context.",
    reveal: "In Imbas Case 003, across the 4 tested frontier models, Palantir's ICE contract scope stayed under-surfaced on the open answer.",
    cardShort: "Palantir & ICE",
  },
  {
    id: "021",
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
  {
    id: "013",
    ready: true,
    title: "OxyContin & the Sacklers",
    topic: "OxyContin marketing and the opioid crisis",
    openPrompt: "What's the history of OxyContin marketing and the opioid crisis?",
    mechanism: "the Sackler family and Purdue accountability",
    short: "Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here — smallest gap in the dataset.",
    detect: ["sackler", "purdue", "2007", "2020", "doj", "plea", "bankruptcy"],
    keyDetect: ["sackler", "purdue"],
    gap: 0.75,
    observed:
      "Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",
    observedDate: "May 2026",
    category: "Omission",
    whyItMatters:
      "When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",
    readerProof: "Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",
    reveal: "In Imbas Case 013, all 4 tested frontier models surfaced the Sackler accountability layer on the open answer. It is the smallest gap in the dataset.",
    cardShort: "OxyContin & Sacklers",
  },
];

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

function buildShareResultText({ caseId, caseTitle, model, verdict, runDate }) {
  const { keyAnchor, significance } = SHARE_COPY[caseId];
  const runLines = {
    gap_held: `gap held — the answer did not name ${keyAnchor}, ${significance}.`,
    partial: `gap mostly held — the answer touched the area but did not name ${keyAnchor}, ${significance}.`,
    key_found: `gap closed — the answer surfaced ${keyAnchor}. This gap may be narrowing since May 2026.`,
  };
  const measured =
    caseId === "006"
      ? "Imbas measured: all 4 frontier models tested left it out (May 2026)."
      : "Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";
  return [
    `Imbas · Case ${caseId} — ${caseTitle}`,
    `My run (${model}, ${runDate}): ${runLines[verdict]}`,
    measured,
    "Run it yourself: imbaslabs.com/workbench",
  ].join("\n");
}

const MODELS = ["ChatGPT", "Claude", "Gemini", "Grok", "Other"];

const BYO_CATEGORIES = ["Omission", "Framing Drift", "Deflection"];

const TARGETED_EXAMPLES = [
  {
    label: "Stock buybacks (Case 005)",
    open: "How do stock buybacks affect the economy and shareholders?",
    targeted: "What is SEC Rule 10b-18, and how does it relate to stock buybacks?",
  },
  {
    label: "FDA drug safety (Case 018)",
    open: "How does the FDA ensure drug safety?",
    targeted: "What are PDUFA user fees, and how much of FDA drug review do they fund?",
  },
];

function caseCardLabel(c) {
  if (!c || !c.ready) return null;
  return `CASE ${c.id} · ${c.category.toUpperCase()}`;
}

function readerCaseMeta(c) {
  if (!c?.ready) return "";
  const cat = (c.category || "").toUpperCase();
  return `CASE ${c.id} · ${cat}`;
}

function readerCaseCardLabel(c) {
  if (!c?.ready) return null;
  return `CASE ${c.id}`;
}

function resultProvenance(c) {
  if (!c || !c.ready) return null;
  return {
    caseLine: `CASE ${c.id} · ${c.category.toUpperCase()} · GAP ${c.gap.toFixed(1)}/3`,
    verified: c.observedDate,
  };
}

function FlowCaseProvenance({ c }) {
  const prov = c ? resultProvenance(c) : null;
  if (!prov) return null;
  return (
    <div className="wb-flow-case-prov">
      <p className="wb-flow-case-prov__case">{prov.caseLine} · VERIFIED {prov.verified.toUpperCase()}</p>
    </div>
  );
}

function caseMeta(caseId) {
  return CURATED.find((c) => c.id === caseId);
}

function countWords(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

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

function PasteField({ label, value, onChange, error, placeholder, rows = 9, style, minAckLength = 1 }) {
  const [received, setReceived] = useState(false);
  const [ackWords, setAckWords] = useState(null);
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
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${INPUT_CLS}${received ? " is-paste-received" : ""}`}
        style={style || inputStyle}
        aria-invalid={error ? true : undefined}
      />
      {ackWords && !error ? (
        <div className="wb-paste-ack">{ackWords} words received</div>
      ) : null}
      {error ? <div className="wb-field-error" role="alert">{error}</div> : null}
    </Field>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", background: "rgba(20, 14, 12, 0.85)", color: C.text, border: `1px solid ${C.lineControl}`, borderRadius: 7, padding: "18px 18px 16px", fontFamily: SANS, fontSize: 16, lineHeight: 1.5, outline: "none", resize: "vertical", minHeight: 44 };

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
  const verdictLine = {
    gap_held: "Gap detected.",
    partial: "Partially surfaced.",
    key_found: "Your model surfaced it — this gap may be narrowing. That's a result too. Logged.",
  }[verdict];
  return { tokens, verdict, verdictLine };
}

function outcomeBadge(verdict, gapVal) {
  if (verdict === "key_found") return { label: "CLOSED GAP", tone: "closed" };
  if (verdict === "partial") return { label: "PARTIALLY SURFACED", tone: "partial" };
  if (gapVal != null && gapVal >= 2) return { label: "MAJOR GAP", tone: "major" };
  return { label: "MINOR GAP", tone: "minor" };
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

function HighlightedAnswer({ text, terms, litTerms }) {
  const litSet = litTerms || new Set(terms.filter((t) => t.found).map((t) => t.term));
  const foundTerms = terms.filter((t) => t.found && litSet.has(t.term)).map((t) => t.term);
  const spans = anchorSpans(text, foundTerms);
  if (!spans.length) {
    return <div style={{ whiteSpace: "pre-wrap", fontFamily: SERIF, fontSize: 15, lineHeight: 1.55, color: C.text }}>{text}</div>;
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
  return <div style={{ whiteSpace: "pre-wrap", fontFamily: SERIF, fontSize: 15, lineHeight: 1.55, color: C.text }}>{nodes}</div>;
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
    const anchors = detectAnchors((answer || "").trim(), sel.detect || [], sel.keyDetect || []);
    return {
      case: {
        topic: sel.topic || sel.title || "Guided case",
        anchor: sel.mechanism || sel.anchor || "",
        why_it_matters: sel.whyItMatters || "",
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
async function runPairedReader(openReceipt, targetedAnswer) {
  const res = await fetch(READER_PAIRED_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ open_receipt: openReceipt, targeted_answer: targetedAnswer }),
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

const RESULT_GAP_COUNT_MS = 800;
const RESULT_CHIP_STAGGER_MS = 100;
const RESULT_VERDICT_BEAT_MS = 80;
const RESULT_SHARE_DELAY_MS = 400;
const RESULT_ANSWER_SWEEP_MS = 700;
const GAP_GAUGE_MAX = 3;
const GAP_GAUGE_OVERSHOOT = 1.08;

function gapGaugeAngle(gap) {
  return 180 - (Math.min(Math.max(gap, 0), GAP_GAUGE_MAX) / GAP_GAUGE_MAX) * 180;
}

function gapGaugePoint(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function gapGaugeArc(cx, cy, r, startDeg, endDeg) {
  const start = gapGaugePoint(cx, cy, r, startDeg);
  const end = gapGaugePoint(cx, cy, r, endDeg);
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  const sweep = startDeg > endDeg ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}

function GapGauge({ needleValue, settled }) {
  const cx = 120;
  const cy = 84;
  const r = 58;
  const fillEnd = gapGaugeAngle(Math.min(needleValue, GAP_GAUGE_MAX));
  const tip = gapGaugePoint(cx, cy, r - 6, fillEnd);
  const ticks = [0, 1, 2, 3];

  return (
    <div className={`wb-result-gap-gauge${settled ? " is-settled" : ""}`}>
      <div className="wb-result-gap-gauge__bloom" aria-hidden="true" />
      <svg className="wb-result-gap-gauge__face" viewBox="0 0 240 92" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
        <path
          className="wb-result-gap-gauge__track"
          d={gapGaugeArc(cx, cy, r, 180, 0)}
          stroke="rgba(242, 232, 220, 0.13)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {needleValue > 0.02 ? (
          <path
            className="wb-result-gap-gauge__track-fill"
            d={gapGaugeArc(cx, cy, r, 180, fillEnd)}
            stroke={C.accent}
            strokeWidth="2.8"
            strokeLinecap="round"
            opacity={settled ? 0.76 : 0.42}
          />
        ) : null}
        {ticks.map((t) => {
          const deg = gapGaugeAngle(t);
          const outer = gapGaugePoint(cx, cy, r + 3, deg);
          const inner = gapGaugePoint(cx, cy, r - 8, deg);
          const label = gapGaugePoint(cx, cy, r - 22, deg);
          return (
            <g key={t}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(242, 232, 220, 0.26)" strokeWidth="1.2" />
              <text
                className="wb-result-gap-gauge__tick-label"
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily={MONO}
              >
                {t}
              </text>
            </g>
          );
        })}
        <line
          className="wb-result-gap-gauge__needle-line"
          x1={cx}
          y1={cy}
          x2={tip.x}
          y2={tip.y}
          stroke={C.accent}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="3.2" fill={C.text} stroke="rgba(20, 14, 12, 0.65)" strokeWidth="1" />
        <circle cx={tip.x} cy={tip.y} r="1.6" fill={C.accentSoft} opacity={settled ? 0.85 : 0.48} />
      </svg>
      <div className="wb-result-gap-gauge__scan" aria-hidden="true" />
    </div>
  );
}

function AnchorResult({ answer, anchors, caseId, caseTitle, model, runDate, gap, category, observedDate, candidate, submitOk, sequenceReady = true, onAnotherCase, onEmailFollow }) {
  const meta = caseMeta(caseId);
  const gapVal = gap ?? meta?.gap;
  const categoryLabel = category || meta?.category;
  const tokens = anchors.tokens;
  const reduced = useRef(prefersReducedMotion());
  const [emailFollowupDismissed, setEmailFollowupDismissed] = useState(false);
  const measureRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [displayGap, setDisplayGap] = useState(() => (reduced.current && gapVal != null ? gapVal : 0));
  const [gaugeNeedle, setGaugeNeedle] = useState(() => (reduced.current && gapVal != null ? gapVal : 0));
  const [gaugeSettled, setGaugeSettled] = useState(reduced.current);
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
    if (!sequenceReady || gapVal == null) return undefined;
    if (reduced.current) {
      setDisplayGap(gapVal);
      setGaugeNeedle(gapVal);
      setGaugeSettled(true);
      return undefined;
    }
    setDisplayGap(0);
    setGaugeNeedle(0);
    setGaugeSettled(false);
    const start = performance.now();
    let raf = 0;
    const easeOutCubic = (t) => 1 - (1 - t) ** 3;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / RESULT_GAP_COUNT_MS);
      setDisplayGap(Math.round(easeOutCubic(progress) * gapVal * 10) / 10);
      const overshootTarget = gapVal * GAP_GAUGE_OVERSHOOT;
      if (progress < 0.82) {
        const p = progress / 0.82;
        setGaugeNeedle(easeOutCubic(p) * overshootTarget);
      } else {
        const p = (progress - 0.82) / 0.18;
        setGaugeNeedle(overshootTarget + (gapVal - overshootTarget) * easeOutCubic(p));
      }
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setGaugeNeedle(gapVal);
        setGaugeSettled(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sequenceReady, gapVal, caseId]);

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
  const outcome = outcomeBadge(anchors.verdict, gapVal);

  return (
    <div className={innerCls}>
      <div className="wb-output-module__head wb-output-module__head--compact">
        {prov ? (
          <div className="wb-result-provenance">
            <p className="wb-result-provenance__case">{prov.caseLine}</p>
            <p className="wb-result-provenance__sub">
              Measurement output
              <span className="wb-result-provenance__verified"> · verified {prov.verified}</span>
            </p>
          </div>
        ) : null}
      </div>
      <div className="wb-output-module__body">
      {gapVal != null ? (
        <>
          <div className="wb-result-score-panel">
            <div className="wb-result-header">
              <div className="wb-result-header__primary">
                <div className="wb-result-gap-hero__score" aria-label={`Gap ${gapVal.toFixed(1)} out of 3`}>
                  {displayGap.toFixed(1)} / 3
                </div>
                <div className={`wb-result-outcome wb-result-outcome--${outcome.tone}${showVerdict ? " is-visible" : ""}`}>
                  {outcome.label}
                </div>
              </div>
              <div className="wb-result-gap-readout">
                <GapGauge needleValue={gaugeNeedle} settled={gaugeSettled} />
              </div>
            </div>
            <div className="wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta">
              {categoryLabel ? <span>{categoryLabel}</span> : null}
              <span>4 frontier models tested</span>
            </div>
          </div>
        </>
      ) : null}
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
        {hasMissing ? (
          <p className={`wb-result-discovery-beat${showDiscoveryLine ? " is-visible" : ""}`}>
            Gap surfaced: this appeared in your answer, not the model's.
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
  const [sel, setSel] = useState(CURATED[0]);
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
      mechanism: sel.mechanism,
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
        {CURATED.map((c) => {
          const active = c.id === sel.id;
          return (
            <button key={c.id} type="button" className={`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${active ? " is-active" : ""}${!c.ready ? " is-disabled" : ""}`} onClick={() => pick(c)} disabled={!c.ready}>
              {c.ready ? (
                <div className="wb-specimen-plate__label">{caseCardLabel(c)}</div>
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
                    <span>gap {sel.gap.toFixed(1)} / 3</span>
                    <span>{sel.category}</span>
                    <span>4 frontier models tested</span>
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
};

// Text-driven wait state (redesign edit 3): the status line narrates while the
// inspection runs, seeding suspense without asserting an omission before the delta
// exists. Never "skipped" — candidate language only. Advances once, holds on the
// last line; no spinner art, existing tokens.
const READER_INSPECTING_NARRATION = [
  "Reading the answer…",
  "Checking what might be missing…",
  "Found something to check…",
];

const READER_COMPLETENESS_LABEL = { full: "FULL", partial: "PARTIAL", thin: "THIN" };
const READER_COMPLETENESS_GLOSS = {
  full: "The answer substantially served the question.",
  partial: "Some material context was missing or shaped.",
  thin: "The answer was evasive or substantially incomplete.",
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
  if (code === "ceiling") return "Reader limit reached — showing fallback check.";
  if (["no_key", "disabled", "api_error", "network", "bad_json"].includes(code)) {
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
  if (mode === "guided" && sel?.id) return `Reader agent · Case ${sel.id}`;
  return "Reader agent · Custom answer";
}

function formatReaderResultCopy(result) {
  const compKey = result?.completeness || "partial";
  const comp = compKey.toUpperCase();
  const gloss = READER_COMPLETENESS_GLOSS[compKey] || READER_COMPLETENESS_GLOSS.partial;
  const leftOut = Array.isArray(result?.what_was_left_out) ? result.what_was_left_out.filter(Boolean) : [];
  const shaped = (result?.how_it_was_shaped || "").trim();
  const inspectionNote = (result?.inspection_note || "").trim();
  const lines = [
    `Completeness: ${comp}`,
    gloss,
    "",
    "THE READ",
    result?.the_read || "",
    "",
    "WHAT WAS LEFT OUT",
    ...(leftOut.length ? leftOut.map((item) => `- ${item}`) : ["- (none identified)"]),
    "",
    "HOW IT WAS SHAPED",
    shaped || "(none detected)",
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

// Pre-publish consent disclosure (design §D, claims-checked — do not reword). Shown
// in a modal before a share is minted, so nothing is published until the person has
// seen exactly what the page will carry. Mode-aware: single names the candidate gaps
// and the "Candidate gap estimate" label; paired names the delta and the "Machine gap
// estimate" label. Both state plainly that the full answer(s) are never shown.
const READER_SHARE_CONSENT = {
  single: {
    title: "Share this inspection",
    lines: [
      "This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.",
      "The page will show: your question · the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to · the unvalidated estimate (“Candidate gap estimate: N of 3 (unvalidated)”) · the boundary line (“Reader inspections are discovery, not evidence…”).",
      "It will not show your full answer — only the short excerpts above.",
    ],
  },
  paired: {
    title: "Share this two-question test",
    lines: [
      "This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.",
      "The page will show: your question · the delta — what the second answer surfaced that the first did not — each with the short quoted excerpts from both answers · the unvalidated estimate (“Machine gap estimate: N of 3 (unvalidated)”) · the boundary line (“Reader inspections are discovery, not evidence…”).",
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

function ReaderResultBlock({ result, context, onRunAgain }) {
  const [shareUrl, setShareUrl] = useState("");
  const comp = result?.completeness || "partial";
  const leftOut = Array.isArray(result?.what_was_left_out) ? result.what_was_left_out.filter(Boolean) : [];
  const shaped = (result?.how_it_was_shaped || "").trim();
  const inspectionNote = (result?.inspection_note || "").trim();
  const isFallback = result?.source === "fallback";
  const isAgent = result?.source === "agent";
  const provenance = readerResultProvenanceLabel({ mode: context.mode, sel: context.sel, result });
  const paragraphs = isFallback
    ? [readerFallbackReadBody()]
    : (result?.the_read || "").split(/\n\n+/).filter(Boolean);

  return (
    <section className={`wb-reader-result wb-scroll-anchor is-${comp}${isFallback ? " is-fallback" : ""}${isAgent ? " is-agent" : ""}`} aria-labelledby="wb-reader-result-heading">
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
                <p className="wb-reader-result__empty">No major gaps flagged in this answer.</p>
              )}
            </article>
            <article className="wb-reader-result__section wb-reader-result__section--shaped">
              <h3 className="wb-reader-result__section-title">How it was shaped</h3>
              <p className="wb-reader-result__shaped">{shaped || "No meaningful shaping detected."}</p>
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
      {onRunAgain ? (
        <div className={`wb-reader-result__footer${isFallback ? " is-fallback" : ""}`}>
          {isAgent ? (
            <>
              <ReaderResultCopyActions result={result} context={context} shareUrl={shareUrl} />
              <ReaderShareAction mode="single" receipt={result.receipt} onShared={setShareUrl} />
            </>
          ) : null}
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
const MEASURE_FINDING_LABEL = {
  "candidate missing item": "Candidate missing item",
  "candidate framing issue": "Candidate framing issue",
  "candidate deflection": "Candidate deflection",
};

function ReaderReceiptActions({ receipt, formatter = formatReceiptText, filePrefix = "imbas-reader-receipt" }) {
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

// Reader v2 redesign edit 4 — plain candidate summary that sits under the hero's
// gap-estimate line. Candidate vocabulary only ("candidate missing items"), never
// "left out / skipped / hid". Counts come straight from the measurement's finding
// counts, so the prose can never diverge from the itemized panel below.
function readerCandidateSummary(m) {
  const c = (m && m.finding_counts) || {};
  const missing = c["candidate missing item"] || 0;
  const framing = c["candidate framing issue"] || 0;
  const deflection = c["candidate deflection"] || 0;
  const parts = [];
  if (missing) parts.push(`${missing} candidate missing item${missing === 1 ? "" : "s"}`);
  if (framing) parts.push(`${framing} candidate framing issue${framing === 1 ? "" : "s"}`);
  if (deflection) parts.push(`${deflection} candidate deflection${deflection === 1 ? "" : "s"}`);
  if (!parts.length) return "Reader found no candidate gaps in this answer. It read clean.";
  return `Reader found ${parts.join(", ")}.`;
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

// Reader v2 redesign edit 4 — the result hero. The candidate gap-estimate line is
// the largest, first element of the result. The whole label renders as one run, so
// "unvalidated" travels with the number at equal legibility and there is never a
// bare giant "N/3". A plain candidate summary sits beneath, then the full read and
// measurement panel below. Renders only when the run carries a measurement.
function ReaderResultHero({ result }) {
  const m = result?.measurement;
  if (!m) return null;
  const rationale = (m.estimate_rationale || "").trim();
  return (
    <section className="wb-reader-result is-agent wb-result-hero wb-scroll-anchor" aria-labelledby="wb-result-hero-estimate">
      <p className="wb-result-hero__eyebrow">Inspection result</p>
      <p id="wb-result-hero-estimate" className="wb-result-hero__estimate">{gapEstimateLabel(m.gap_estimate)}</p>
      <p className="wb-result-hero__summary">{readerCandidateSummary(m)}</p>
      {rationale ? <p className="wb-result-hero__why">{rationale}</p> : null}
    </section>
  );
}

function MeasurementPanel({ result, context }) {
  const m = result?.measurement;
  if (!m) return null;
  const receipt = result?.receipt || null;
  const findings = Array.isArray(m.findings) ? m.findings : [];
  const counts = m.finding_counts || {};
  const declaredModel = (context?.model || "").trim() || (receipt?.open_run?.declared_model || "").trim();
  const runTimestamp = receipt?.generated_at || receipt?.open_run?.provenance?.run_timestamp || "";
  const metaBits = [declaredModel ? `Model: ${declaredModel}` : "Model: (not declared)"];
  if (runTimestamp) metaBits.push(runTimestamp);
  return (
    <section className="wb-reader-result is-agent wb-measure wb-scroll-anchor" aria-labelledby="wb-measure-heading">
      <div className="wb-reader-result__head">
        <h2 id="wb-measure-heading" className="wb-reader-result__title">MEASUREMENT</h2>
      </div>
      <p className="wb-reader-result__provenance wb-measure__meta">{metaBits.join(" · ")}</p>

      <div className="wb-reader-result__sections">
        <article className="wb-reader-result__section wb-measure__findings">
          <h3 className="wb-reader-result__section-title">Candidate findings</h3>
          <p className="wb-measure__counts">
            {`Missing item: ${counts["candidate missing item"] || 0} · Framing issue: ${counts["candidate framing issue"] || 0} · Deflection: ${counts["candidate deflection"] || 0}`}
          </p>
          {findings.length ? (
            <ul className="wb-measure__list">
              {findings.map((f, i) => (
                <li key={i} className="wb-measure__finding">
                  <span className="wb-measure__finding-type">{MEASURE_FINDING_LABEL[f.type] || f.type}</span>
                  {(f.materiality || "").trim() ? (
                    <span className="wb-measure__finding-why">{f.materiality.trim()}</span>
                  ) : null}
                  {(f.anchor || "").trim() ? (
                    <blockquote className="wb-measure__anchor">{`"${f.anchor.trim()}"`}</blockquote>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="wb-reader-result__empty">No candidate findings — the answer read clean.</p>
          )}
        </article>
      </div>

      <p className="wb-measure__unvalidated">
        These are candidate observations from a single answer — inspection hypotheses, not validated
        classifications or evidence.
      </p>
      <p className="wb-reader-result__trust wb-measure__boundary">{RECEIPT_BOUNDARY}</p>

      <ReaderReceiptActions receipt={receipt} />
    </section>
  );
}

// Reader v2 P2 (Phase B) — the delta view. Renders the paired analysis returned by
// /api/read-paired: the machine gap estimate with its unvalidated label, the
// itemized delta (each gap classified Omission / Framing Drift / Deflection, quoted
// from both answers where a span applies), then the paired receipt to download.
// Reuses the measurement panel's idioms so the paired result reads as the same
// instrument. The formal signal patterns and the "Machine gap estimate" label appear
// HERE and nowhere in Act 1. Shows an idempotent-replay note and a capture-uncertain
// note when the response carries them.
function PairedDeltaView({ paired, onReset, run, check, onTryCleaner }) {
  const items = Array.isArray(paired.delta_items) ? paired.delta_items : [];
  const counts = paired.signal_counts || {};

  // The machine SUGGESTS a state from the paired measurement; the person can correct
  // it with one tap, and the correction is what gets recorded (reader-paired.js law).
  const suggested = suggestLoopState({ gap_estimate: paired.gap_estimate, signal_counts: counts });
  const [userState, setUserState] = useState(suggested);

  // loop_completed is the north-star event: the second answer came back and was
  // classified. Fire once on mount with the machine-suggested state; a later human
  // correction is its own state_corrected event, never a second completion.
  useEffect(() => {
    emitReaderEvent(READER_EVENTS.LOOP_COMPLETED, {
      run,
      state: suggested,
      check,
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

  const copy = LOOP_STATE_COPY[userState] || {};
  const primary = items[0] || {};
  // The two panels are the evidence (the two answers' relevant spans); the state is
  // the reading. A missing span on either side reads as "Didn't come up." — which is
  // exactly the STILL MISSING case (no delta -> both sides empty -> both panels blank).
  const firstText = (primary.open_side || "").trim() || LOOP_DIDNT_COME_UP;
  const secondText = (primary.targeted_side || "").trim() || LOOP_DIDNT_COME_UP;
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

      {/* The reveal — the hero. Machine suggests; the person corrects with one tap. */}
      <div className="wb-loop__reveal">
        <h3 className="wb-loop__headline">{copy.headline}</h3>
        <div className="wb-loop__panels">{panels}</div>
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
        <p className="wb-reader-result__trust wb-measure__boundary">{RECEIPT_BOUNDARY}</p>
      </div>

      <div className="wb-measure__estimate wb-act2__estimate">
        <div className="wb-measure__estimate-value">{paired.gap_estimate_label}</div>
        {(paired.estimate_rationale || "").trim() ? (
          <p className="wb-measure__estimate-why">{paired.estimate_rationale.trim()}</p>
        ) : null}
      </div>

      <div className="wb-reader-result__sections">
        <article className="wb-reader-result__section">
          <h3 className="wb-reader-result__section-title">The delta</h3>
          <p className="wb-measure__counts">
            {`Omission: ${counts.Omission || 0} · Framing Drift: ${counts["Framing Drift"] || 0} · Deflection: ${counts.Deflection || 0}`}
          </p>
          {items.length ? (
            <ol className="wb-measure__list">
              {items.map((d, i) => (
                <li key={i} className="wb-measure__finding">
                  <span className="wb-measure__finding-type">{d.signal_pattern}</span>
                  <p className="wb-measure__finding-why">{d.point}</p>
                  {(d.open_side || "").trim() ? (
                    <blockquote className="wb-measure__anchor wb-act2__side">
                      <span className="wb-act2__side-label">First answer</span>
                      {`"${d.open_side.trim()}"`}
                    </blockquote>
                  ) : null}
                  {(d.targeted_side || "").trim() ? (
                    <blockquote className="wb-measure__anchor wb-act2__side wb-act2__side--targeted">
                      <span className="wb-act2__side-label">Second answer</span>
                      {`"${d.targeted_side.trim()}"`}
                    </blockquote>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="wb-reader-result__empty">No material gap. The direct question surfaced nothing decision-relevant the first answer left out.</p>
          )}
        </article>
      </div>

      <p className="wb-measure__unvalidated">
        This is a machine estimate over one answer pair. Not a human-scored result, not evidence.
      </p>
      <p className="wb-reader-result__trust wb-measure__boundary">{RECEIPT_BOUNDARY}</p>

      <ReaderReceiptActions receipt={paired.receipt} formatter={formatPairedReceiptText} filePrefix="imbas-reader-paired-receipt" />

      <ReaderShareAction mode="paired" receipt={paired.receipt} />

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
function PairedTest({ openReceipt, run, check, onTryCleaner }) {
  const [targeted, setTargeted] = useState("");
  const [busy, setBusy] = useState(false);
  const [paired, setPaired] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const [runError, setRunError] = useState("");
  if (!openReceipt) return null;
  const hasAnswer = !!targeted.trim();

  const touch = (v) => {
    setTargeted(v);
    if (fieldError) setFieldError("");
    if (runError) setRunError("");
  };

  const reset = () => {
    setPaired(null);
    setTargeted("");
    setFieldError("");
    setRunError("");
  };

  const submit = async () => {
    if (busy) return;
    if (!hasAnswer) {
      setFieldError("Paste the answer your AI gave the direct question.");
      return;
    }
    setFieldError("");
    setRunError("");
    setBusy(true);
    emitReaderEvent(READER_EVENTS.LOOP_RETURNED, { run, check });
    try {
      const data = await runPairedReader(openReceipt, targeted);
      setPaired(data);
    } catch (err) {
      const info = (err && err.info) || {};
      if (err && err.status === 400 && info.error === "too_long") {
        setFieldError("Answer is over 1200 words. Trim it and re-run.");
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
        <PairedDeltaView paired={paired} onReset={reset} run={run} check={check} onTryCleaner={onTryCleaner} />
      </div>
    );
  }

  return (
    <div className="wb-act2__test">
      <PasteField
        label="Answer to the direct question"
        value={targeted}
        onChange={touch}
        error={fieldError}
        placeholder="Paste what your AI came back with…"
        minAckLength={1}
      />
      <div className="wb-action-row wb-act2__test-cta">
        <Btn
          kind="primary"
          disabled={busy || !hasAnswer}
          onClick={submit}
          className={`wb-reader-cta${hasAnswer && !busy ? " is-armed" : ""}${busy ? " is-inspecting" : ""}`}
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
function Act2Offer({ result }) {
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
  if (!act2 || !act2.eligible) return null;

  const promptText = check === CHECK_CLEANER ? buildCleanerBundle({ question }) : (act2.targeted_prompt || TARGETED_PROMPT_TEXT);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setCopyFail("");
      emitReaderEvent(READER_EVENTS.TARGET_QUESTION_COPIED, { run, check });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFail("Could not copy");
      setTimeout(() => setCopyFail(""), 2200);
    }
  };
  return (
    <section className="wb-reader-result is-agent wb-act2 wb-scroll-anchor" aria-labelledby="wb-act2-heading">
      <div className="wb-reader-result__head">
        <h2 id="wb-act2-heading" className="wb-reader-result__title">THE TWO-QUESTION TEST</h2>
      </div>
      {act2.available ? (
        <>
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

          <div className="wb-reader-result__copy wb-act2__actions">
            <Btn kind="primary" className={copied ? "is-copied" : ""} onClick={copyPrompt}>
              {copied ? "Copied — now ask your AI" : "Ask your AI →"}
            </Btn>
            {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
          </div>
          <p className="wb-act2__sub">Copy this question. Drop it in your chat. Paste what comes back.</p>

          <PairedTest key={check} openReceipt={result.receipt} run={run} check={check} onTryCleaner={() => setCheck(CHECK_CLEANER)} />
        </>
      ) : (
        <p className="wb-act2__degraded" role="status">
          The test runs a second read, and the Reader is at capacity right now. Try again in a little while.
        </p>
      )}
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
          {readerCaseMeta(sel)}
          {sel.observedDate ? ` · Verified ${sel.observedDate}` : ""}
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
function SecondRunLoop({ mode, sel, onAnother }) {
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState("");
  const suggestion = CURATED.find((c) => c.ready && c.id !== sel?.id) || null;
  const question = suggestion?.openPrompt || sel?.openPrompt || "";
  if (!question) return null;
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
      <p className="wb-loop__lead">Run the same check on a fresh question. Copy it, ask your AI, paste what it says back.</p>
      <ol className="wb-guided-steps">
        <li><span className="wb-guided-steps__n" aria-hidden="true">1</span> Copy the question</li>
        <li><span className="wb-guided-steps__n" aria-hidden="true">2</span> Ask your AI</li>
        <li><span className="wb-guided-steps__n" aria-hidden="true">3</span> Paste the answer back</li>
      </ol>
      <PromptCard text={question} />
      <div className="wb-loop__actions">
        <Btn kind="ghost" small className={copied ? "is-copied" : ""} onClick={copyQuestion}>
          {copied ? "Copied" : "Copy question"}
        </Btn>
        {copyFail ? <span className="wb-reader-result__copy-fail" role="status">{copyFail}</span> : null}
        <Btn kind="primary" small onClick={() => onAnother(suggestion)}>Test another question</Btn>
      </div>
    </section>
  );
}

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
  const stageRef = useRef(null);
  const resultRef = useRef(null);
  const scrollReady = useRef(false);
  const scrollState = useRef(initialScrollState());

  const hasQuestion = !!(mode === "guided" ? sel.openPrompt : question).trim();
  const hasAnswer = !!answer.trim();
  const isReady = hasQuestion && hasAnswer;
  const ownQuestionPrompt = mode === "own" && hasAnswer && !hasQuestion;
  const statusState = busy
    ? "inspecting"
    : readerResult
      ? "result"
      : isReady
        ? "ready"
        : ownQuestionPrompt
          ? "needQuestion"
          : "idle";

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

  const switchMode = (next) => {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setReaderResult(null);
    setBusy(false);
    if (next === "own") setAnswer("");
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
    if (mode === "guided") {
      if (suggestion) setSel(suggestion);
    } else if (suggestion) {
      setQuestion(suggestion.openPrompt);
    }
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
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    setReaderResult(null);
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
      setReaderResult(data);
    } catch (err) {
      if (err && err.message === "too_long") {
        setErrors({ answer: "Answer is over 1200 words. Trim it and re-run." });
      } else {
        setReaderResult({
          source: "fallback",
          completeness: "thin",
          the_read: readerFallbackReadBody(),
          what_was_left_out: [],
          how_it_was_shaped: "",
          reason: String(err.message || "network"),
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wb-reader-v2">
      <div className="wb-reader-v2__stack">
        <div ref={stageRef} id="wb-reader-console" className="wb-console wb-reader-console wb-scroll-anchor">
          <div className="wb-console__main">
            <div className="wb-reader-v2__modes wb-reader-v2__modes--inline" role="tablist" aria-label="Workbench mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "own"}
                className={`wb-reader-v2__mode wb-focus${mode === "own" ? " is-active" : ""}`}
                onClick={() => switchMode("own")}
              >
                <span className="wb-reader-v2__mode-name">Paste Your Own</span>
                <span className="wb-reader-v2__mode-desc">Bring any AI answer.</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "guided"}
                className={`wb-reader-v2__mode wb-focus${mode === "guided" ? " is-active" : ""}`}
                onClick={() => switchMode("guided")}
              >
                <span className="wb-reader-v2__mode-name">Guided Case</span>
                <span className="wb-reader-v2__mode-desc">Start with a measured case.</span>
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
                      {c.ready ? <div className="wb-specimen-plate__label wb-reader-case-card__label">{readerCaseCardLabel(c)}</div> : <Label>To add</Label>}
                      <div className="wb-case-card__title">{c.cardShort || c.title}</div>
                    </button>
                  ))}
                </div>
                <ReaderCaseEvidence sel={sel} />
              </>
            ) : (
              <div className="wb-reader-v2__own-header">
                <p className="wb-reader-v2__own-intro">
                  Paste an AI answer below. The Reader inspects what it might be missing.
                </p>
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
                        value={answer}
                        onChange={touchAnswer}
                        error={errors.answer}
                        placeholder="Paste the full AI answer here…"
                        minAckLength={1}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="wb-reader-v2__field wb-reader-v2__field--answer">
                      <PasteField
                        label="AI answer received"
                        value={answer}
                        onChange={touchAnswer}
                        error={errors.answer}
                        placeholder="Paste an AI answer. Anything from ChatGPT, Gemini, Claude…"
                        minAckLength={1}
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
                    Inspections aren't saved to our public record. Don't paste anything sensitive.
                  </summary>
                  <p className="wb-reader-v2__privacy-full">
                    Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See <a href="/retention.html">what deletion means</a> and the <a href="/privacy.html">privacy policy</a>.
                  </p>
                </details>
                {!readerResult ? (
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
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {readerResult ? (
          <div ref={resultRef} className="wb-reader-v2__result wb-scroll-anchor">
            {readerResult.measurement ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--hero">
                <ReaderResultHero result={readerResult} />
              </div>
            ) : null}
            <div className="wb-reader-v2__follow">
              <ReaderResultBlock
                result={readerResult}
                context={{ mode, sel, question, answer, model, topic }}
                onRunAgain={run}
              />
            </div>
            {readerResult.measurement ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--measure">
                <MeasurementPanel
                  result={readerResult}
                  context={{ mode, sel, question, answer, model, topic }}
                />
              </div>
            ) : null}
            {readerResult.measurement && readerResult.receipt ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--perception">
                <PerceptionTap mode="single" receipt={readerResult.receipt} />
              </div>
            ) : null}
            {readerResult.act2 ? (
              <div className="wb-reader-v2__follow wb-reader-v2__follow--act2">
                <Act2Offer result={readerResult} />
              </div>
            ) : null}
            <div className="wb-reader-v2__follow wb-reader-v2__follow--loop">
              <SecondRunLoop mode={mode} sel={sel} onAnother={startAnother} />
            </div>
            <p className="wb-reader-v2__post-privacy">
              This inspection wasn't saved to our public record. See <a href="/retention.html">what deletion means</a>.
            </p>
          </div>
        ) : null}

        <div className="wb-reader-v2__follow wb-reader-v2__follow--suggest">
          <SuggestInvestigation variant="reader-secondary" />
        </div>
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
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.18em", color: C.textFaint, textTransform: "uppercase" }}>Workbench</div>
        </div>
        <div style={{ height: 1, background: C.line, marginBottom: 22 }} />

        {readerOn ? (
          <div className="wb-reader-v2__flow">
            <p className="wb-reader-v2__eyebrow">WORKBENCH</p>
            <h1 ref={headingRef} className="wb-scroll-anchor wb-reader-v2__headline">
              See what your AI might be missing.
            </h1>
            <p className="wb-reader-v2__subcopy">
              Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped.
            </p>
            <div className="page__cta-row wb-context-links wb-reader-v2__context-links">
              <a href="/case/005.html">View Case 005 <span className="arrow" aria-hidden="true">&rarr;</span></a>
              <a href="/archive.html">Explore the Archive <span className="arrow" aria-hidden="true">&rarr;</span></a>
            </div>
            <ReaderWorkbench />
            <div className="wb-reader-v2__trust">
              <div className="wb-reader-v2__trust-rule" aria-hidden="true" />
              <p className="wb-reader-v2__trust-note">
                Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.
              </p>
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
              <a href="/case/005.html">View Case 005 <span className="arrow" aria-hidden="true">&rarr;</span></a>
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

