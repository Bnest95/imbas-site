/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var{useState:l,useEffect:Y,useRef:G}=React,_={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},X="'Fraunces', Georgia, serif",M="'Inter', ui-sans-serif, system-ui, sans-serif",P="'JetBrains Mono', ui-monospace, monospace",aa="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",W="wb-input wb-focus",ta=`
.wb-focus:focus-visible { outline: 2px solid ${_.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${_.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,ra=`
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
  font-family: ${X};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${_.text};
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
  font-family: ${P};
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
`,sa=`
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
  font-family: ${P};
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(222, 111, 56, 0.88);
  line-height: 1.35;
  flex-shrink: 0;
}
.wb-build-note__text {
  font-family: ${M};
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
  font-family: ${P};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${P};
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
  font-family: ${P};
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
  font-family: ${P};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${P};
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
`,oa=`
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
  font-family: ${P};
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
  font-family: ${M};
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
  font-family: ${P};
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
  font-family: ${X};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${_.text};
  margin: 0 0 0.36rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__heading {
  margin: 0 0 0.32rem;
}
.wb-suggest-module__eyebrow {
  font-family: ${P};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${X};
  font-size: 18px;
  line-height: 1.28;
  color: rgba(242, 232, 220, 0.94);
}
.wb-suggest-module__support {
  font-family: ${M};
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
  color: ${_.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${_.text} !important;
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
  color: ${_.textDim};
}
.wb-suggest-module__title {
  font-family: ${P};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${_.textDim};
  margin: 0 0 0.28rem;
  line-height: 1.32;
}
.wb-suggest-module__lead {
  font-family: ${M};
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
  color: ${_.text};
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
  background: ${_.accent} !important;
  border-color: ${_.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${_.accentSoft} !important;
  border-color: ${_.accentSoft} !important;
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
  font-family: ${M};
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
`,na=`
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
  font-family: ${P};
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
  font-family: ${M};
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
`,oe=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that models often describe Palantir\u2013ICE contracts without clearly naming the surveillance and deportation context.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",cardShort:"OxyContin & Sacklers"}],ia={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function la({caseId:e,caseTitle:a,model:t,verdict:s,runDate:o}){let{keyAnchor:n,significance:r}=ia[e],d={gap_held:`gap held \u2014 the answer did not name ${n}, ${r}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${n}, ${r}.`,key_found:`gap closed \u2014 the answer surfaced ${n}. This gap may be narrowing since May 2026.`},i=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${a}`,`My run (${t}, ${o}): ${d[s]}`,i,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var da=["ChatGPT","Claude","Gemini","Grok","Other"];function ca(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function ua(e){if(!(e!=null&&e.ready))return"";let a=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${a}`}function ma(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function We(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function Ee({c:e}){let a=e?We(e):null;return a?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},a.caseLine," \xB7 VERIFIED ",a.verified.toUpperCase())):null}function pa(e){return oe.find(a=>a.id===e)}function Ge(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function A({children:e,onClick:a,kind:t="primary",disabled:s,small:o,className:n=""}){let r={fontFamily:M,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:o?"10px 16px":"12px 22px",borderRadius:6,cursor:s?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:s?.4:1},d={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${t}${o?" wb-btn--small":""}${n?` ${n}`:""}`,onClick:s?void 0:a,disabled:s,style:{...r,...d[t]}},e)}function H({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function L({label:e,children:a}){return React.createElement("label",{className:"wb-field"},React.createElement(H,null,e),a)}function he({label:e,value:a,onChange:t,error:s,placeholder:o,rows:n=9,style:r,minAckLength:d=1}){let[i,u]=l(!1),[f,p]=l(null);return React.createElement(L,{label:e},React.createElement("textarea",{rows:n,value:a,onChange:N=>{let b=N.target.value;t(b),!Ye(b)&&b.trim().length>=d?(p(Ge(b)),u(!0)):(p(null),u(!1))},placeholder:o,className:`${W}${i?" is-paste-received":""}`,style:r||te,"aria-invalid":s?!0:void 0}),f&&!s?React.createElement("div",{className:"wb-paste-ack"},f," words received"):null,s?React.createElement("div",{className:"wb-field-error",role:"alert"},s):null)}var te={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:_.text,border:`1px solid ${_.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:M,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function fe({value:e,onChange:a}){return React.createElement("select",{value:e,onChange:t=>a(t.target.value),className:W,style:{...te,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),da.map(t=>React.createElement("option",{key:t,value:t,style:{color:"#111"}},t)))}function He({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function ba(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function wa(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var _e="imbas_wb_email";function Ue(){try{return localStorage.getItem(_e)||""}catch(e){return""}}function ga(e){try{e?localStorage.setItem(_e,e):localStorage.removeItem(_e)}catch(a){}}function ha({onFollow:e,onSkip:a}){let[t,s]=l(""),o=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(H,null,"Your email"),React.createElement("input",{type:"email",value:t,placeholder:"you@domain.com",onChange:n=>s(n.target.value),className:W,style:{...te,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(A,{kind:"primary",disabled:!o,onClick:()=>e(t)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(A,{kind:"ghost",onClick:a},"Continue without email \u2192")))}function fa(e,a){let t=a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${t}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function qe(e,a,t){let s=a.map(i=>({term:i,found:fa(e,i),isKey:t.includes(i)})),o=s.some(i=>i.found),n=s.some(i=>i.found&&i.isKey),r;o?n?r="key_found":r="partial":r="gap_held";let d={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[r];return{tokens:s,verdict:r,verdictLine:d}}function _a(e,a){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:a!=null&&a>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function Ce({title:e,children:a,className:t="",defaultOpen:s=!1}){let[o,n]=l(s);return React.createElement("div",{className:`wb-collapsible${o?" is-open":""}${t?` ${t}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>n(r=>!r),"aria-expanded":o},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},o?"Collapse":"Expand")),o?React.createElement("div",{className:"wb-collapsible__body"},a):null)}function va(e){if(!e.length)return[];let a=[...e].sort((s,o)=>s[0]-o[0]),t=[a[0]];for(let s=1;s<a.length;s++){let o=t[t.length-1];a[s][0]<=o[1]?o[1]=Math.max(o[1],a[s][1]):t.push(a[s])}return t}function ya(e,a){let t=[];for(let s of a){let o=s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),n=new RegExp(`(^|[^a-zA-Z0-9])(${o})($|[^a-zA-Z0-9])`,"gi"),r;for(;(r=n.exec(e||""))!==null;){let d=r.index+r[1].length;t.push([d,d+r[2].length])}}return va(t)}function Pe(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function xa(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var Te="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function Ye(e){let a=(e||"").trim().split(/\s+/).filter(Boolean);return a.length<20||a.some(t=>t.length>40)?Te:""}function Na(e,a){let t=a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),o=new RegExp(`(?:^|[^a-z0-9])${t}(?:[^a-z0-9]|$)`,"i").exec(e||"");return o?o.index:-1}function ka(e,a){let t=Ye(e);if(t)return t;let s=(e||"").trim();if(s.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let o=Pe(s);return xa(a).some(n=>Pe(n)===o)?"Paste the model's actual answer from your own chat.":""}function $e({text:e,terms:a,litTerms:t}){let s=t||new Set(a.filter(i=>i.found).map(i=>i.term)),o=a.filter(i=>i.found&&s.has(i.term)).map(i=>i.term),n=ya(e,o);if(!n.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:X,fontSize:15,lineHeight:1.55,color:_.text}},e);let r=[],d=0;return n.forEach(([i,u],f)=>{d<i&&r.push(React.createElement("span",{key:`t-${f}`},e.slice(d,i))),r.push(React.createElement("span",{key:`h-${f}`,style:{color:_.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(i,u))),d=u}),d<e.length&&r.push(React.createElement("span",{key:"tail"},e.slice(d))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:X,fontSize:15,lineHeight:1.55,color:_.text}},r)}var Fe="/api/repository";function Ca(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function Sa(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function ve(e){if(!Fe)return{ok:!1};let a=document.getElementById("wb-hp"),t=a&&typeof a.value=="string"?a.value:"";try{let s=await fetch(Fe,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:t})}),o=null;try{o=await s.json()}catch(n){}return!s.ok||o&&o.ok===!1?{ok:!1}:{ok:!0}}catch(s){return{ok:!1}}}function je({candidate:e}){let[a,t]=l(!1),s=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your record below and email it to brendan@imbaslabs.com"),React.createElement(Ce,{title:"Record data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},s),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(A,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(s),t(!0),setTimeout(()=>t(!1),1800)}catch(n){}}},a?"Copied \u2713":"Copy record"))))}function Aa({candidate:e,submitOk:a}){return a?React.createElement(Ra,{candidate:e}):React.createElement(je,{candidate:e})}function Ra({candidate:e}){let[a,t]=l(!1),s=JSON.stringify(e,null,2);return React.createElement(Ce,{title:"Record data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},s),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(A,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(s),t(!0),setTimeout(()=>t(!1),1800)}catch(n){}}},a?"Copied \u2713":"Copy record"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function Ea({caseId:e,caseTitle:a,model:t,anchors:s,runDate:o}){let[n,r]=l(!1),d=la({caseId:e,caseTitle:a,model:t,verdict:s.verdict,runDate:o}),i="https://twitter.com/intent/tweet?text="+encodeURIComponent(d);return React.createElement(Ce,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},d),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(A,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(d),r(!0),setTimeout(()=>r(!1),1800)}catch(f){}}},n?"Copied \u2713":"Copy result"),React.createElement("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function Se(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function ne(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function de(e,a){if(typeof window=="undefined"||!e){a==null||a();return}ne();let t=Se(),s=document.documentElement,o=parseFloat(getComputedStyle(s).getPropertyValue("--header-offset"))||77,n=parseFloat(getComputedStyle(s).getPropertyValue("--scroll-anchor-gap"))||12,r=e.getBoundingClientRect().top+window.scrollY-o-n-6;window.scrollTo({top:Math.max(0,r),behavior:t?"auto":"smooth"}),a&&window.setTimeout(a,t?0:420)}function Pa(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}var Ta="/api/read";function $a(e){let a=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:a.filter(t=>t.found).map(t=>t.term),missing:a.filter(t=>!t.found).map(t=>t.term)}}function Fa({mode:e,sel:a,question:t,answer:s,topic:o,model:n}){if(e==="guided"){let r=qe((s||"").trim(),a.detect||[],a.keyDetect||[]);return{case:{topic:a.topic||a.title||"Guided case",anchor:a.mechanism||a.anchor||"",why_it_matters:a.whyItMatters||""},open_question:a.openPrompt,answer:(s||"").trim(),inspected_model:(n||"").trim(),textcheck:$a(r)}}return{case:{topic:(o||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(t||"").trim(),answer:(s||"").trim(),inspected_model:(n||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function Ia(e){let a=await fetch(Ta,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!a.ok){if(a.status===400){let t=await a.json().catch(()=>({}));if(t&&t.error==="too_long")throw new Error("too_long")}throw new Error(`read_${a.status}`)}return a.json()}var we=800,Ie=100,Ma=80,Me=400,ge=700,ye=3,La=1.08;function Le(e){return 180-Math.min(Math.max(e,0),ye)/ye*180}function ae(e,a,t,s){let o=s*Math.PI/180;return{x:e+t*Math.cos(o),y:a-t*Math.sin(o)}}function Oe(e,a,t,s,o){let n=ae(e,a,t,s),r=ae(e,a,t,o),d=Math.abs(s-o)>180?1:0,i=s>o?1:0;return`M ${n.x} ${n.y} A ${t} ${t} 0 ${d} ${i} ${r.x} ${r.y}`}function Oa({needleValue:e,settled:a}){let n=Le(Math.min(e,ye)),r=ae(120,84,52,n),d=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${a?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:Oe(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:Oe(120,84,58,180,n),stroke:_.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:a?.76:.42}):null,d.map(i=>{let u=Le(i),f=ae(120,84,61,u),p=ae(120,84,50,u),m=ae(120,84,36,u);return React.createElement("g",{key:i},React.createElement("line",{x1:p.x,y1:p.y,x2:f.x,y2:f.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:m.x,y:m.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:P},i))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:r.x,y2:r.y,stroke:_.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:_.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:r.x,cy:r.y,r:"1.6",fill:_.accentSoft,opacity:a?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function Da({answer:e,anchors:a,caseId:t,caseTitle:s,model:o,runDate:n,gap:r,category:d,observedDate:i,candidate:u,submitOk:f,sequenceReady:p=!0,onAnotherCase:m,onEmailFollow:N}){let b=pa(t),w=r!=null?r:b==null?void 0:b.gap,E=d||(b==null?void 0:b.category),v=a.tokens,y=G(Se()),[$,O]=l(!1),x=G(null),[F,D]=l(!1),[U,q]=l(()=>y.current&&w!=null?w:0),[j,I]=l(()=>y.current&&w!=null?w:0),[ee,K]=l(y.current),[V,c]=l(()=>y.current?new Set(v.filter(h=>h.found).map(h=>h.term)):new Set),[z,g]=l(!1),[C,T]=l(y.current?v.length:0),[ie,re]=l(y.current),[le,J]=l(!1),[Ae,ce]=l(y.current),[Qe,ue]=l(y.current&&v.some(h=>!h.found)),[at,me]=l(y.current&&v.some(h=>h.isKey&&h.found)),pe=v.some(h=>!h.found),Ze=Ge(e);Y(()=>{var S;if(!x.current)return;let h=(S=x.current.closest(".wb-answer-row"))==null?void 0:S.querySelector(".wb-answer-row__bar");h&&h.style.setProperty("--sweep-travel",`${Math.max(h.offsetHeight-2,40)}px`)},[e,p]),Y(()=>{if(!p||w==null)return;if(y.current){q(w),I(w),K(!0);return}q(0),I(0),K(!1);let h=performance.now(),S=0,Q=Z=>1-(1-Z)**3,B=Z=>{let R=Math.min(1,(Z-h)/we);q(Math.round(Q(R)*w*10)/10);let k=w*La;if(R<.82){let se=R/.82;I(Q(se)*k)}else{let se=(R-.82)/.18;I(k+(w-k)*Q(se))}R<1?S=requestAnimationFrame(B):(I(w),K(!0))};return S=requestAnimationFrame(B),()=>cancelAnimationFrame(S)},[p,w,t]),Y(()=>{if(!p)return;if(y.current){c(new Set(v.filter(k=>k.found).map(k=>k.term))),g(!1),T(v.length),re(!0),J(!0),ce(!0),ue(pe),me(v.some(k=>k.isKey&&k.found));let R=setTimeout(()=>J(!1),50);return()=>clearTimeout(R)}c(new Set),g(!1),T(0),re(!1),J(!1),ce(!1),ue(!1),me(!1);let h=[],S=(R,k)=>{h.push(setTimeout(R,k))};v.forEach((R,k)=>{S(()=>{T(k+1),R.isKey&&R.found&&me(!0)},we+k*Ie)});let Q=we+v.length*Ie;pe&&S(()=>ue(!0),Q+50);let B=Q+Ma;S(()=>{re(!0),J(!0)},B),S(()=>ce(!0),B+Me),S(()=>J(!1),B+720);let Z=B+Me+120;return S(()=>g(!0),Z),v.forEach(R=>{if(!R.found)return;let k=Na(e,R.term),se=k>=0?k/Math.max(e.length,1)*ge:ge;S(()=>{c(ea=>new Set([...ea,R.term]))},Z+se)}),S(()=>g(!1),Z+ge),()=>{h.forEach(clearTimeout)}},[v.length,t,e,p]);let Xe=`wb-result-inner wb-output-module${le?" is-verdict-pulse":""}${y.current?" is-reveal-instant":""}`,be=b?We(b):null,Re=_a(a.verdict,w);return React.createElement("div",{className:Xe},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},be?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},be.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",be.verified))):null),React.createElement("div",{className:"wb-output-module__body"},w!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${w.toFixed(1)} out of 3`},U.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${Re.tone}${ie?" is-visible":""}`},Re.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(Oa,{needleValue:j,settled:ee}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},E?React.createElement("span",null,E):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(H,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},v.map((h,S)=>{let B=`wb-token-chip${S<C?" is-visible":""}${h.found?" is-found":" is-missing"}`;return React.createElement("li",{key:h.term,className:B},h.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},h.term,h.isKey?" (key)":""," \xB7 ",h.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${F?" is-expanded":""}`},React.createElement("div",{ref:x,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement($e,{text:e,terms:a.tokens,litTerms:V})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${z?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>D(h=>!h),"aria-expanded":F},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",Ze," words"),React.createElement("span",{className:`wb-answer-row__chevron${F?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${F?" is-open":""}`},React.createElement($e,{text:e,terms:a.tokens,litTerms:V})))),React.createElement("div",{className:"wb-result-footnote"},pe?React.createElement("p",{className:`wb-result-discovery-beat${Qe?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),t==="006"&&ie?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${Ae?" is-visible":""}`},React.createElement(Ea,{caseId:t,caseTitle:s,model:o,anchors:a,runDate:n}),React.createElement(Aa,{candidate:u,submitOk:f})),Ae&&!$&&!Ue()?React.createElement(ha,{onFollow:h=>{ga(h),O(!0),N&&N(h)},onSkip:()=>O(!0)}):null,m?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:m},"Test another case \u21BA")):null)}function za(){let[e,a]=l(oe[0]),[t,s]=l(0),[o,n]=l(()=>Ue()),[r,d]=l(""),[i,u]=l(""),[f,p]=l(!1),[m,N]=l(null),[b,w]=l(null),[E,v]=l(!1),[y,$]=l(""),[O,x]=l(!1),[F,D]=l("idle"),U=G(null),q=G(null),j=G(!1);Y(()=>{if(!j.current){j.current=!0,ne();return}if(t===2)return;let g=t===1?U.current:q.current,C=window.requestAnimationFrame(()=>de(g));return()=>window.cancelAnimationFrame(C)},[t]);let I=()=>{s(0),d(""),u(""),N(null),w(null),$(""),x(!1),p(!1)},ee=g=>{if(!g.ready||g.id===e.id)return;let C=Se(),T=()=>{a(g),I(),D("in"),window.setTimeout(()=>D("idle"),C?0:200)};if(C){T();return}D("out"),window.setTimeout(T,200)},K=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),v(!0),setTimeout(()=>v(!1),2e3)}catch(g){}},V=()=>{de(U.current,()=>x(!0))},c=async()=>{let g=ka(i,e);if(g){$(g);return}$(""),p(!0),x(!1);let C=qe(i,e.detect,e.keyDetect),T=C.verdict!=="key_found",ie=new Date().toISOString().slice(0,10),re={answer:i,anchors:C,caseId:e.id,caseTitle:e.title,model:r,runDate:ie,gap:e.gap,category:e.category,observedDate:e.observedDate},le=Ca({mode:"curated",case_id:e.id,model:r,email:o,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:i,gap_held:T,detect_verdict:C.verdict}),J=await ve(le);N({...re,submitOk:J.ok}),w(le),p(!1),s(2),window.requestAnimationFrame(V)},z=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",t===2?"is-result":"",F==="out"?"is-crossfade-out":"",F==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:q,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},oe.map(g=>{let C=g.id===e.id;return React.createElement("button",{key:g.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${C?" is-active":""}${g.ready?"":" is-disabled"}`,onClick:()=>ee(g),disabled:!g.ready},g.ready?React.createElement("div",{className:"wb-specimen-plate__label"},ca(g)):React.createElement(H,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},g.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:U,className:z},t===2&&m?React.createElement(Da,{...m,candidate:b,sequenceReady:O,onAnotherCase:I,onEmailFollow:g=>{n(g);let C={...b,email:g};w(C),ve(C)}}):t===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(Ee,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(L,{label:"Which AI did you ask?"},React.createElement(fe,{value:r,onChange:d}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"Paste the model's open answer",value:i,onChange:g=>{u(g),$("")},error:y,placeholder:"Paste the full response here\u2026",minAckLength:20})),y?React.createElement("div",{className:"wb-field-error"},y):null,React.createElement("div",{className:"wb-action-row"},React.createElement(A,{kind:"primary",disabled:f||!r||i.trim().length<200,onClick:c},"Compare with what Imbas observed \u2192")),!f&&!y&&i.trim().length>0&&i.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(Ee,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(H,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),t===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(H,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(He,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(A,{kind:"ghost",small:!0,onClick:K,className:E?"is-copied":""},E?"Copied \u2713":"Copy question"),React.createElement(A,{kind:"primary",onClick:()=>s(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(wa,null),React.createElement(ba,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(Ke,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var xe={...te,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},De={...xe,minHeight:"unset",resize:"vertical"};function Ke({variant:e="default"}){let[a,t]=l(!1),[s,o]=l("form"),[n,r]=l(""),[d,i]=l(""),[u,f]=l(""),[p,m]=l(""),[N,b]=l(!1),[w,E]=l(null),v=n.trim().length>=4,y=d.trim().length>=8,$=v&&y&&!N;async function O(){if(!$)return;b(!0),E(null);let x=Sa({topic:n.trim(),inspect_question:d.trim(),context:u.trim()||null,email:p.trim()||null,source:"workbench_suggest"}),F=await ve(x);b(!1),F.ok?o("done"):E(x)}return s==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):a?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(L,{label:"Topic or Question"},React.createElement("input",{className:W,type:"text",value:n,onChange:x=>r(x.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:xe}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(L,{label:"What should be inspected?"},React.createElement("textarea",{className:W,value:d,onChange:x=>i(x.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:De}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(L,{label:"Optional context, source, or link"},React.createElement("textarea",{className:W,value:u,onChange:x=>f(x.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:De}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(L,{label:"Optional email for follow-up"},React.createElement("input",{className:W,type:"email",value:p,onChange:x=>m(x.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:xe}))),w?React.createElement(je,{candidate:w}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(A,{kind:"primary",disabled:!$,onClick:O},N?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(A,{kind:"ghost",small:!0,onClick:()=>t(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(A,{kind:"primary",onClick:()=>t(!0)},"Suggest an investigation \u2192"))))}var ze={idle:"Paste an answer to run The Reader.",needQuestion:"Add the question you asked.",ready:"The Reader is ready.",inspecting:"Reader inspecting\u2026",result:"Reader complete."},Ba={full:"FULL",partial:"PARTIAL",thin:"THIN"},Ne={full:"The answer substantially served the question.",partial:"Some material context was missing or shaped.",thin:"The answer was evasive or substantially incomplete."};function Wa({state:e}){return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},ze[e]||ze.idle))}function Ga(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let t=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return t?t[1]:""}function Ha(e){let a=Ga(e).toLowerCase();return a==="ceiling"?"Reader limit reached \u2014 showing fallback check.":["no_key","disabled","api_error","network","bad_json"].includes(a)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function ke(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function Ve({mode:e,sel:a,result:t}){return(t==null?void 0:t.source)==="fallback"?"Fallback check":(t==null?void 0:t.source)!=="agent"?"Reader":e==="guided"&&(a!=null&&a.id)?`Reader agent \xB7 Case ${a.id}`:"Reader agent \xB7 Custom answer"}function Je(e){let a=(e==null?void 0:e.completeness)||"partial",t=a.toUpperCase(),s=Ne[a]||Ne.partial,o=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],n=((e==null?void 0:e.how_it_was_shaped)||"").trim(),r=((e==null?void 0:e.inspection_note)||"").trim(),d=[`Completeness: ${t}`,s,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...o.length?o.map(i=>`- ${i}`):["- (none identified)"],"","HOW IT WAS SHAPED",n||"(none detected)"];return r&&d.push("","INSPECTION NOTE",r),d.join(`
`).trim()}function Ua({mode:e,sel:a,question:t,answer:s,model:o,topic:n,result:r}){let d=e==="guided"?a==null?void 0:a.openPrompt:t,i=(n||"").trim()||(e==="guided"?((a==null?void 0:a.topic)||"").trim():""),u=[];return(r==null?void 0:r.source)==="agent"&&u.push("Inspection record",Ve({mode:e,sel:a,result:r}),""),u.push(`Question: ${(d||"").trim()}`),i&&u.push(`Topic / context: ${i}`),(o||"").trim()&&u.push(`AI used: ${o.trim()}`),u.push("","Answer",(s||"").trim()),r&&u.push("",Je(r)),u.push("","Behavior, not intent."),u.join(`
`).trim()}var Be=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`,qa="Creates an unlisted Workbench inspection. Anyone with the link can view it. It is not a reviewed archive case.";function Ya({mode:e,sel:a,question:t,answer:s,model:o,topic:n,result:r}){let d=e==="guided"?a==null?void 0:a.openPrompt:t,i=(n||"").trim()||(e==="guided"?((a==null?void 0:a.topic)||"").trim():"");return{question:(d||"").trim(),topic:i,ai_model:(o||"").trim(),answer:(s||"").trim(),source_label:e==="guided"?"Guided Case":"Custom Answer",case_label:e==="guided"&&(a!=null&&a.id)?`Case ${a.id}`:"",completeness:(r==null?void 0:r.completeness)||"partial",the_read:(r==null?void 0:r.the_read)||"",what_was_left_out:Array.isArray(r==null?void 0:r.what_was_left_out)?r.what_was_left_out.filter(Boolean):[],how_it_was_shaped:(r==null?void 0:r.how_it_was_shaped)||"",inspection_note:(r==null?void 0:r.inspection_note)||""}}function ja(e,a){return e===503||e===500||(a==null?void 0:a.error)==="unconfigured"?"Share links are not live yet. Copy the full record for now.":"Could not create share link. Copy the full record for now."}function Ka({result:e,context:a,shareUrl:t,setShareUrl:s}){let[o,n]=l("idle"),[r,d]=l("");return React.createElement("div",{className:"wb-reader-result__share"},React.createElement("p",{className:"wb-reader-result__share-trust"},qa),t&&(o==="ready"||o==="copied")?React.createElement("div",{className:"wb-reader-result__share-success",role:"status"},React.createElement("p",{className:"wb-reader-result__share-success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-result__share-url"},React.createElement("a",{href:t,target:"_blank",rel:"noopener noreferrer"},t)),React.createElement("div",{className:"wb-reader-result__share-actions"},React.createElement("a",{href:t,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-result__share-open"},"Open share record"),React.createElement(A,{kind:"ghost",small:!0,className:`wb-reader-result__share-copy${o==="copied"?" is-copied":""}`,onClick:async()=>{if(t)try{await navigator.clipboard.writeText(t),n("copied"),d(""),setTimeout(()=>n("ready"),1800)}catch(p){n("error"),d("Could not copy link. Select the link below and copy manually.")}}},o==="copied"?"Copied":"Copy share link"))):React.createElement(React.Fragment,null,React.createElement(A,{kind:"ghost",small:!0,className:"wb-reader-result__share-btn",onClick:async()=>{if(o!=="creating"){n("creating"),d("");try{let p=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Ya({...a,result:e}))}),m=await p.json().catch(()=>({}));if(!p.ok||!m.ok||!m.share_url){m.error==="unconfigured"?console.warn("[imbas] inspection-share unconfigured \u2014 set AIRTABLE_TOKEN and AIRTABLE_INSPECTION_SHARES_TABLE"):console.warn("[imbas] inspection-share failed",p.status,m),n("error"),d(ja(p.status,m));return}s(m.share_url),n("ready");try{await navigator.clipboard.writeText(m.share_url),n("copied"),setTimeout(()=>n("ready"),1600)}catch(N){}}catch(p){console.warn("[imbas] inspection-share network error",p),n("error"),d("Could not create share link. Copy the full record for now.")}}},disabled:o==="creating","aria-busy":o==="creating"},o==="creating"?"Creating share link\u2026":"Create share link"),r?React.createElement("p",{className:"wb-reader-result__share-fail",role:"alert"},r):null))}function Va({result:e,context:a,shareUrl:t}){let[s,o]=l(!1),[n,r]=l(!1),[d,i]=l(""),u=m=>{m(!0),i(""),setTimeout(()=>m(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(A,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Je(e)}

${Be(t)}`),u(o)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},s?"Copied":"Copy Result"),React.createElement(A,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Ua({...a,result:e})}

${Be(t)}`),u(r)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},n?"Copied":"Copy Full Record"),d?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},d):null)}function Ja({result:e,context:a,onRunAgain:t}){let[s,o]=l(""),n=(e==null?void 0:e.completeness)||"partial",r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],d=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=((e==null?void 0:e.inspection_note)||"").trim(),u=(e==null?void 0:e.source)==="fallback",f=(e==null?void 0:e.source)==="agent",p=Ve({mode:a.mode,sel:a.sel,result:e}),m=u?[ke()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${n}${u?" is-fallback":""}${f?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},f?React.createElement("div",{className:`wb-reader-result__status is-${n}`},React.createElement("div",{className:`wb-reader-result__badge is-${n}`},Ba[n]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},Ne[n])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),f?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},p)):null,u?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},Ha(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},u?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},m.length?m.map((N,b)=>React.createElement("p",{key:b},N)):React.createElement("p",null,u?ke():"No read returned."))),u?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What was left out"),r.length?React.createElement("ul",{className:"wb-reader-result__list"},r.map((N,b)=>React.createElement("li",{key:b},N))):React.createElement("p",{className:"wb-reader-result__empty"},"No major substantive omissions identified.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},d||"No meaningful shaping detected."))),i?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},i)):null,!u&&f?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),t?React.createElement("div",{className:`wb-reader-result__footer${u?" is-fallback":""}`},f?React.createElement(React.Fragment,null,React.createElement(Va,{result:e,context:a,shareUrl:s}),React.createElement(Ka,{result:e,context:a,shareUrl:s,setShareUrl:o})):null,React.createElement(A,{kind:"ghost",small:!0,onClick:t,className:"wb-reader-result__rerun"},"Run again")):null)}function Qa({sel:e}){return e!=null&&e.ready?React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},ua(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(H,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.readerProof||e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?"),React.createElement(He,{text:e.openPrompt})))):null}function Za(){let[e,a]=l("own"),[t,s]=l(oe[0]),[o,n]=l(""),[r,d]=l(""),[i,u]=l(""),[f,p]=l(""),[m,N]=l(!1),[b,w]=l(null),[E,v]=l({}),y=G(null),$=G(null),O=G(!1),x=!!(e==="guided"?t.openPrompt:o).trim(),F=!!r.trim(),D=x&&F,U=e==="own"&&F&&!x,q=m?"inspecting":b?"result":D?"ready":U?"needQuestion":"idle";Y(()=>{let c=()=>{window.location.hash==="#wb-reader-console"&&a("own")};return c(),window.addEventListener("hashchange",c),()=>window.removeEventListener("hashchange",c)},[]),Y(()=>{if(!O.current){O.current=!0,ne();return}if(e!=="guided")return;let c=window.requestAnimationFrame(()=>de(y.current));return()=>window.cancelAnimationFrame(c)},[t.id,e]),Y(()=>{if(b&&$.current){let c=window.requestAnimationFrame(()=>de($.current));return()=>window.cancelAnimationFrame(c)}},[b]);let j=c=>{c!==e&&(a(c),v({}),w(null),N(!1),c==="own"&&d(""))},I=c=>{!c.ready||c.id===t.id||(s(c),d(""),w(null),v({}),N(!1))},ee=c=>{d(c),v(z=>({...z,answer:""})),b&&w(null)},K=c=>{n(c),v(z=>({...z,question:""})),b&&w(null)},V=async()=>{if(m)return;let c={},z=e==="guided"?t.openPrompt:o,g=r;if(e==="own"&&!(z||"").trim()&&(c.question="Add the question you asked."),(g||"").trim()||(c.answer="Paste an answer to run The Reader."),Object.keys(c).length){v(c);return}v({}),N(!0),w(null);let C=Fa({mode:e,sel:t,question:o,answer:g,topic:i,model:f});try{let T=await Ia(C);w(T)}catch(T){T&&T.message==="too_long"?v({answer:"Answer is over 1200 words. Trim it and re-run."}):w({source:"fallback",completeness:"thin",the_read:ke(),what_was_left_out:[],how_it_was_shaped:"",reason:String(T.message||"network")})}finally{N(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},React.createElement("div",{className:"wb-reader-v2__agent-bar wb-reader-v2__agent-bar--compact"},React.createElement("div",{className:"wb-reader-v2__chip wb-reader-v2__chip--compact",role:"status"},React.createElement("span",{className:"wb-reader-v2__chip-dot","aria-hidden":"true"}),"LIVE READER AGENT"),React.createElement("p",{className:"wb-reader-v2__promise"},"Inspects the answer in front of you and turns it into an inspection record.")),React.createElement("div",{ref:y,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>j("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>j("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with a measured case."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},oe.map(c=>React.createElement("button",{key:c.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${c.id===t.id?" is-active":""}${c.ready?"":" is-disabled"}`,onClick:()=>I(c),disabled:!c.ready,title:c.title},c.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},ma(c)):React.createElement(H,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},c.cardShort||c.title)))),React.createElement(Qa,{sel:t})):React.createElement("div",{className:"wb-reader-v2__own-header"},React.createElement("p",{className:"wb-reader-v2__own-eyebrow"},"Run your own inspection"),React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste the question you asked and the answer you received.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(H,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(L,{label:"Which AI did you ask? (optional)"},React.createElement(fe,{value:f,onChange:p}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(he,{label:"AI answer received",value:r,onChange:ee,error:E.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(L,{label:"Question asked"},React.createElement("textarea",{className:W,value:o,onChange:c=>K(c.target.value),placeholder:"What did you ask the model?",rows:3,style:te,"aria-invalid":!!E.question})),E.question?React.createElement("div",{className:"wb-field-error",role:"alert"},E.question):null,U&&!E.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(L,{label:"Optional topic / context"},React.createElement("input",{className:W,value:i,onChange:c=>u(c.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:te}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(L,{label:"Which AI did you ask? (optional)"},React.createElement(fe,{value:f,onChange:p}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(he,{label:"AI answer received",value:r,onChange:ee,error:E.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1})))),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":m},React.createElement(Wa,{state:q}),React.createElement("p",{className:"wb-reader-v2__input-note wb-reader-v2__input-note--full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them."),React.createElement("p",{className:"wb-reader-v2__input-note wb-reader-v2__input-note--compact"},"Not published to the reviewed archive. Do not paste sensitive, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying."),b?null:React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(A,{kind:"primary",disabled:m||!D,onClick:V,className:`wb-reader-cta${D&&!m?" is-armed":""}${m?" is-inspecting":""}`},m?"Reader inspecting\u2026":"Run The Reader")))))),b?React.createElement("div",{ref:$,className:"wb-reader-v2__follow"},React.createElement(Ja,{result:b,context:{mode:e,sel:t,question:o,answer:r,model:f,topic:i},onRunAgain:V})):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(Ke,{variant:"reader-secondary"}))))}function Xa(){let e=G(null),[a]=l(()=>Pa());return Y(()=>{ne();let t=()=>ne();return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[]),React.createElement("div",{className:`wb-shell${a?" wb-shell--reader-v2":""}`,style:{color:_.text,minHeight:"100vh",fontFamily:M}},React.createElement("style",null,aa),React.createElement("style",null,ta,ra,sa,oa,na),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:X,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:P,fontSize:11,letterSpacing:"0.18em",color:_.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:_.line,marginBottom:22}}),a?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"See what your AI leaves out."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what was omitted, and how it was shaped."),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"#wb-reader-console"},"Paste your own answer ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Za,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:X,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:M,fontSize:16.5,lineHeight:1.6,color:_.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(za,null)),a?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:_.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:P,fontSize:11,color:_.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var et=ReactDOM.createRoot(document.getElementById("workbench-root"));et.render(React.createElement(Xa,null));})();
