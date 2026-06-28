/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var{useState:l,useEffect:J,useRef:z}=React,p={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},Q="'Fraunces', Georgia, serif",M="'Inter', ui-sans-serif, system-ui, sans-serif",P="'JetBrains Mono', ui-monospace, monospace",Je="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",O="wb-input wb-focus",Qe=`
.wb-focus:focus-visible { outline: 2px solid ${p.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${p.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,Ze=`
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
  font-family: ${Q};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${p.text};
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
`,Xe=`
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
`,ea=`
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
  font-family: ${Q};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${p.text};
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
  font-family: ${Q};
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
  color: ${p.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${p.text} !important;
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
  color: ${p.textDim};
}
.wb-suggest-module__title {
  font-family: ${P};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${p.textDim};
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
  color: ${p.text};
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
  background: ${p.accent} !important;
  border-color: ${p.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${p.accentSoft} !important;
  border-color: ${p.accentSoft} !important;
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
`,aa=`
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
`,se=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested frontier models leave out PDUFA user fees when explaining how the FDA ensures drug safety.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that Palantir's immigration-enforcement contracts are under-surfaced on neutral open prompts.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that DuPont, 3M, and the Bilott litigation are left out of most open answers about PFAS danger.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found strong accountability surfacing on OxyContin \u2014 the smallest measured gap in the archive.",cardShort:"OxyContin & Sacklers"}],ta={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function ra({caseId:e,caseTitle:a,model:t,verdict:r,runDate:s}){let{keyAnchor:i,significance:o}=ta[e],d={gap_held:`gap held \u2014 the answer did not name ${i}, ${o}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${i}, ${o}.`,key_found:`gap closed \u2014 the answer surfaced ${i}. This gap may be narrowing since May 2026.`},n=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${a}`,`My run (${t}, ${s}): ${d[r]}`,n,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var sa=["ChatGPT","Claude","Gemini","Grok","Other"];function oa(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function na(e){if(!(e!=null&&e.ready))return"";let a=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${a} \xB7 GAP ${e.gap.toFixed(1)}/3`}function ia(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function Oe(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function Ae({c:e}){let a=e?Oe(e):null;return a?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},a.caseLine," \xB7 VERIFIED ",a.verified.toUpperCase())):null}function la(e){return se.find(a=>a.id===e)}function ze(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function $({children:e,onClick:a,kind:t="primary",disabled:r,small:s,className:i=""}){let o={fontFamily:M,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:s?"10px 16px":"12px 22px",borderRadius:6,cursor:r?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:r?.4:1},d={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${t}${s?" wb-btn--small":""}${i?` ${i}`:""}`,onClick:r?void 0:a,disabled:r,style:{...o,...d[t]}},e)}function B({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function I({label:e,children:a}){return React.createElement("label",{className:"wb-field"},React.createElement(B,null,e),a)}function he({label:e,value:a,onChange:t,error:r,placeholder:s,rows:i=9,style:o,minAckLength:d=1}){let[n,h]=l(!1),[y,v]=l(null);return React.createElement(I,{label:e},React.createElement("textarea",{rows:i,value:a,onChange:A=>{let w=A.target.value;t(w),!We(w)&&w.trim().length>=d?(v(ze(w)),h(!0)):(v(null),h(!1))},placeholder:s,className:`${O}${n?" is-paste-received":""}`,style:o||ee}),y&&!r?React.createElement("div",{className:"wb-paste-ack"},y," words received"):null)}var ee={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:p.text,border:`1px solid ${p.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:M,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function fe({value:e,onChange:a}){return React.createElement("select",{value:e,onChange:t=>a(t.target.value),className:O,style:{...ee,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),sa.map(t=>React.createElement("option",{key:t,value:t,style:{color:"#111"}},t)))}function Be({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function da(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function ca(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var _e="imbas_wb_email";function Ge(){try{return localStorage.getItem(_e)||""}catch(e){return""}}function ua(e){try{e?localStorage.setItem(_e,e):localStorage.removeItem(_e)}catch(a){}}function ma({onFollow:e,onSkip:a}){let[t,r]=l(""),s=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(B,null,"Your email"),React.createElement("input",{type:"email",value:t,placeholder:"you@domain.com",onChange:i=>r(i.target.value),className:O,style:{...ee,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement($,{kind:"primary",disabled:!s,onClick:()=>e(t)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement($,{kind:"ghost",onClick:a},"Continue without email \u2192")))}function ba(e,a){let t=a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${t}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function pa(e,a,t){let r=a.map(n=>({term:n,found:ba(e,n),isKey:t.includes(n)})),s=r.some(n=>n.found),i=r.some(n=>n.found&&n.isKey),o;s?i?o="key_found":o="partial":o="gap_held";let d={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[o];return{tokens:r,verdict:o,verdictLine:d}}function ga(e,a){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:a!=null&&a>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function Ne({title:e,children:a,className:t="",defaultOpen:r=!1}){let[s,i]=l(r);return React.createElement("div",{className:`wb-collapsible${s?" is-open":""}${t?` ${t}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>i(o=>!o),"aria-expanded":s},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},s?"Collapse":"Expand")),s?React.createElement("div",{className:"wb-collapsible__body"},a):null)}function wa(e){if(!e.length)return[];let a=[...e].sort((r,s)=>r[0]-s[0]),t=[a[0]];for(let r=1;r<a.length;r++){let s=t[t.length-1];a[r][0]<=s[1]?s[1]=Math.max(s[1],a[r][1]):t.push(a[r])}return t}function ha(e,a){let t=[];for(let r of a){let s=r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),i=new RegExp(`(^|[^a-zA-Z0-9])(${s})($|[^a-zA-Z0-9])`,"gi"),o;for(;(o=i.exec(e||""))!==null;){let d=o.index+o[1].length;t.push([d,d+o[2].length])}}return wa(t)}function Re(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function fa(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var Pe="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function We(e){let a=(e||"").trim().split(/\s+/).filter(Boolean);return a.length<20||a.some(t=>t.length>40)?Pe:""}function _a(e,a){let t=a.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=new RegExp(`(?:^|[^a-z0-9])${t}(?:[^a-z0-9]|$)`,"i").exec(e||"");return s?s.index:-1}function va(e,a){let t=We(e);if(t)return t;let r=(e||"").trim();if(r.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let s=Re(r);return fa(a).some(i=>Re(i)===s)?"Paste the model's actual answer from your own chat.":""}function $e({text:e,terms:a,litTerms:t}){let r=t||new Set(a.filter(n=>n.found).map(n=>n.term)),s=a.filter(n=>n.found&&r.has(n.term)).map(n=>n.term),i=ha(e,s);if(!i.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:Q,fontSize:15,lineHeight:1.55,color:p.text}},e);let o=[],d=0;return i.forEach(([n,h],y)=>{d<n&&o.push(React.createElement("span",{key:`t-${y}`},e.slice(d,n))),o.push(React.createElement("span",{key:`h-${y}`,style:{color:p.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(n,h))),d=h}),d<e.length&&o.push(React.createElement("span",{key:"tail"},e.slice(d))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:Q,fontSize:15,lineHeight:1.55,color:p.text}},o)}var Ee="/api/repository";function ya(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function xa(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function ve(e){if(!Ee)return{ok:!1};let a=document.getElementById("wb-hp"),t=a&&typeof a.value=="string"?a.value:"";try{let r=await fetch(Ee,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:t})}),s=null;try{s=await r.json()}catch(i){}return!r.ok||s&&s.ok===!1?{ok:!1}:{ok:!0}}catch(r){return{ok:!1}}}function He({candidate:e}){let[a,t]=l(!1),r=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your record below and email it to brendan@imbaslabs.com"),React.createElement(Ne,{title:"Record data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},r),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement($,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(r),t(!0),setTimeout(()=>t(!1),1800)}catch(i){}}},a?"Copied \u2713":"Copy record"))))}function Na({candidate:e,submitOk:a}){return a?React.createElement(ka,{candidate:e}):React.createElement(He,{candidate:e})}function ka({candidate:e}){let[a,t]=l(!1),r=JSON.stringify(e,null,2);return React.createElement(Ne,{title:"Record data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},r),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement($,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(r),t(!0),setTimeout(()=>t(!1),1800)}catch(i){}}},a?"Copied \u2713":"Copy record"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function Ca({caseId:e,caseTitle:a,model:t,anchors:r,runDate:s}){let[i,o]=l(!1),d=ra({caseId:e,caseTitle:a,model:t,verdict:r.verdict,runDate:s}),n="https://twitter.com/intent/tweet?text="+encodeURIComponent(d);return React.createElement(Ne,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},d),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement($,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(d),o(!0),setTimeout(()=>o(!1),1800)}catch(y){}}},i?"Copied \u2713":"Copy result"),React.createElement("a",{href:n,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function ke(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function oe(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function le(e,a){if(typeof window=="undefined"||!e){a==null||a();return}oe();let t=ke(),r=document.documentElement,s=parseFloat(getComputedStyle(r).getPropertyValue("--header-offset"))||77,i=parseFloat(getComputedStyle(r).getPropertyValue("--scroll-anchor-gap"))||12,o=e.getBoundingClientRect().top+window.scrollY-s-i-6;window.scrollTo({top:Math.max(0,o),behavior:t?"auto":"smooth"}),a&&window.setTimeout(a,t?0:420)}function Sa(){if(typeof window=="undefined")return!1;try{if(new URLSearchParams(window.location.search).get("reader")==="1"||window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!1}var Aa="/api/read";function Ra({mode:e,sel:a,question:t,answer:r,topic:s}){return e==="guided"?{case:{topic:a.topic||a.title||"Guided case",anchor:a.mechanism||a.anchor||"",why_it_matters:a.whyItMatters||""},open_question:a.openPrompt,answer:(r||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}:{case:{topic:(s||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(t||"").trim(),answer:(r||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function Pa(e){let a=await fetch(Aa,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!a.ok)throw new Error(`read_${a.status}`);return a.json()}var ge=800,Te=100,$a=80,Fe=400,we=700,ye=3,Ea=1.08;function Me(e){return 180-Math.min(Math.max(e,0),ye)/ye*180}function X(e,a,t,r){let s=r*Math.PI/180;return{x:e+t*Math.cos(s),y:a-t*Math.sin(s)}}function Ie(e,a,t,r,s){let i=X(e,a,t,r),o=X(e,a,t,s),d=Math.abs(r-s)>180?1:0,n=r>s?1:0;return`M ${i.x} ${i.y} A ${t} ${t} 0 ${d} ${n} ${o.x} ${o.y}`}function Ta({needleValue:e,settled:a}){let i=Me(Math.min(e,ye)),o=X(120,84,52,i),d=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${a?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:Ie(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:Ie(120,84,58,180,i),stroke:p.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:a?.76:.42}):null,d.map(n=>{let h=Me(n),y=X(120,84,61,h),v=X(120,84,50,h),N=X(120,84,36,h);return React.createElement("g",{key:n},React.createElement("line",{x1:v.x,y1:v.y,x2:y.x,y2:y.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:N.x,y:N.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:P},n))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:o.x,y2:o.y,stroke:p.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:p.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:o.x,cy:o.y,r:"1.6",fill:p.accentSoft,opacity:a?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function Fa({answer:e,anchors:a,caseId:t,caseTitle:r,model:s,runDate:i,gap:o,category:d,observedDate:n,candidate:h,submitOk:y,sequenceReady:v=!0,onAnotherCase:N,onEmailFollow:A}){let w=la(t),m=o!=null?o:w==null?void 0:w.gap,E=d||(w==null?void 0:w.category),g=a.tokens,f=z(ke()),[T,L]=l(!1),_=z(null),[F,G]=l(!1),[Y,W]=l(()=>f.current&&m!=null?m:0),[c,C]=l(()=>f.current&&m!=null?m:0),[Z,q]=l(f.current),[H,ae]=l(()=>f.current?new Set(g.filter(u=>u.found).map(u=>u.term)):new Set),[de,b]=l(!1),[R,U]=l(f.current?g.length:0),[ne,te]=l(f.current),[ie,j]=l(!1),[Ce,ce]=l(f.current),[qe,ue]=l(f.current&&g.some(u=>!u.found)),[Ua,me]=l(f.current&&g.some(u=>u.isKey&&u.found)),be=g.some(u=>!u.found),je=ze(e);J(()=>{var k;if(!_.current)return;let u=(k=_.current.closest(".wb-answer-row"))==null?void 0:k.querySelector(".wb-answer-row__bar");u&&u.style.setProperty("--sweep-travel",`${Math.max(u.offsetHeight-2,40)}px`)},[e,v]),J(()=>{if(!v||m==null)return;if(f.current){W(m),C(m),q(!0);return}W(0),C(0),q(!1);let u=performance.now(),k=0,V=K=>1-(1-K)**3,D=K=>{let S=Math.min(1,(K-u)/ge);W(Math.round(V(S)*m*10)/10);let x=m*Ea;if(S<.82){let re=S/.82;C(V(re)*x)}else{let re=(S-.82)/.18;C(x+(m-x)*V(re))}S<1?k=requestAnimationFrame(D):(C(m),q(!0))};return k=requestAnimationFrame(D),()=>cancelAnimationFrame(k)},[v,m,t]),J(()=>{if(!v)return;if(f.current){ae(new Set(g.filter(x=>x.found).map(x=>x.term))),b(!1),U(g.length),te(!0),j(!0),ce(!0),ue(be),me(g.some(x=>x.isKey&&x.found));let S=setTimeout(()=>j(!1),50);return()=>clearTimeout(S)}ae(new Set),b(!1),U(0),te(!1),j(!1),ce(!1),ue(!1),me(!1);let u=[],k=(S,x)=>{u.push(setTimeout(S,x))};g.forEach((S,x)=>{k(()=>{U(x+1),S.isKey&&S.found&&me(!0)},ge+x*Te)});let V=ge+g.length*Te;be&&k(()=>ue(!0),V+50);let D=V+$a;k(()=>{te(!0),j(!0)},D),k(()=>ce(!0),D+Fe),k(()=>j(!1),D+720);let K=D+Fe+120;return k(()=>b(!0),K),g.forEach(S=>{if(!S.found)return;let x=_a(e,S.term),re=x>=0?x/Math.max(e.length,1)*we:we;k(()=>{ae(Ke=>new Set([...Ke,S.term]))},K+re)}),k(()=>b(!1),K+we),()=>{u.forEach(clearTimeout)}},[g.length,t,e,v]);let Ve=`wb-result-inner wb-output-module${ie?" is-verdict-pulse":""}${f.current?" is-reveal-instant":""}`,pe=w?Oe(w):null,Se=ga(a.verdict,m);return React.createElement("div",{className:Ve},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},pe?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},pe.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",pe.verified))):null),React.createElement("div",{className:"wb-output-module__body"},m!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${m.toFixed(1)} out of 3`},Y.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${Se.tone}${ne?" is-visible":""}`},Se.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(Ta,{needleValue:c,settled:Z}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},E?React.createElement("span",null,E):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(B,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},g.map((u,k)=>{let D=`wb-token-chip${k<R?" is-visible":""}${u.found?" is-found":" is-missing"}`;return React.createElement("li",{key:u.term,className:D},u.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},u.term,u.isKey?" (key)":""," \xB7 ",u.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${F?" is-expanded":""}`},React.createElement("div",{ref:_,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement($e,{text:e,terms:a.tokens,litTerms:H})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${de?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>G(u=>!u),"aria-expanded":F},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",je," words"),React.createElement("span",{className:`wb-answer-row__chevron${F?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${F?" is-open":""}`},React.createElement($e,{text:e,terms:a.tokens,litTerms:H})))),React.createElement("div",{className:"wb-result-footnote"},be?React.createElement("p",{className:`wb-result-discovery-beat${qe?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),t==="006"&&ne?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${Ce?" is-visible":""}`},React.createElement(Ca,{caseId:t,caseTitle:r,model:s,anchors:a,runDate:i}),React.createElement(Na,{candidate:h,submitOk:y})),Ce&&!T&&!Ge()?React.createElement(ma,{onFollow:u=>{ua(u),L(!0),A&&A(u)},onSkip:()=>L(!0)}):null,N?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:N},"Test another case \u21BA")):null)}function Ma(){let[e,a]=l(se[0]),[t,r]=l(0),[s,i]=l(()=>Ge()),[o,d]=l(""),[n,h]=l(""),[y,v]=l(!1),[N,A]=l(null),[w,m]=l(null),[E,g]=l(!1),[f,T]=l(""),[L,_]=l(!1),[F,G]=l("idle"),Y=z(null),W=z(null),c=z(!1);J(()=>{if(!c.current){c.current=!0,oe();return}if(t===2)return;let b=t===1?Y.current:W.current,R=window.requestAnimationFrame(()=>le(b));return()=>window.cancelAnimationFrame(R)},[t]);let C=()=>{r(0),d(""),h(""),A(null),m(null),T(""),_(!1),v(!1)},Z=b=>{if(!b.ready||b.id===e.id)return;let R=ke(),U=()=>{a(b),C(),G("in"),window.setTimeout(()=>G("idle"),R?0:200)};if(R){U();return}G("out"),window.setTimeout(U,200)},q=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),g(!0),setTimeout(()=>g(!1),2e3)}catch(b){}},H=()=>{le(Y.current,()=>_(!0))},ae=async()=>{let b=va(n,e);if(b){T(b);return}T(""),v(!0),_(!1);let R=pa(n,e.detect,e.keyDetect),U=R.verdict!=="key_found",ne=new Date().toISOString().slice(0,10),te={answer:n,anchors:R,caseId:e.id,caseTitle:e.title,model:o,runDate:ne,gap:e.gap,category:e.category,observedDate:e.observedDate},ie=ya({mode:"curated",case_id:e.id,model:o,email:s,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:n,gap_held:U,detect_verdict:R.verdict}),j=await ve(ie);A({...te,submitOk:j.ok}),m(ie),v(!1),r(2),window.requestAnimationFrame(H)},de=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",t===2?"is-result":"",F==="out"?"is-crossfade-out":"",F==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:W,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},se.map(b=>{let R=b.id===e.id;return React.createElement("button",{key:b.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${R?" is-active":""}${b.ready?"":" is-disabled"}`,onClick:()=>Z(b),disabled:!b.ready},b.ready?React.createElement("div",{className:"wb-specimen-plate__label"},oa(b)):React.createElement(B,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},b.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:Y,className:de},t===2&&N?React.createElement(Fa,{...N,candidate:w,sequenceReady:L,onAnotherCase:C,onEmailFollow:b=>{i(b);let R={...w,email:b};m(R),ve(R)}}):t===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(Ae,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(I,{label:"Which AI did you ask?"},React.createElement(fe,{value:o,onChange:d}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"Paste the model's open answer",value:n,onChange:b=>{h(b),T("")},error:f,placeholder:"Paste the full response here\u2026",minAckLength:20})),f?React.createElement("div",{className:"wb-field-error"},f):null,React.createElement("div",{className:"wb-action-row"},React.createElement($,{kind:"primary",disabled:y||!o||n.trim().length<200,onClick:ae},"Compare with what Imbas observed \u2192")),!y&&!f&&n.trim().length>0&&n.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(Ae,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(B,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),t===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(B,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(Be,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement($,{kind:"ghost",small:!0,onClick:q,className:E?"is-copied":""},E?"Copied \u2713":"Copy question"),React.createElement($,{kind:"primary",onClick:()=>r(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(ca,null),React.createElement(da,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(Ue,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var xe={...ee,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},Le={...xe,minHeight:"unset",resize:"vertical"};function Ue({variant:e="default"}){let[a,t]=l(!1),[r,s]=l("form"),[i,o]=l(""),[d,n]=l(""),[h,y]=l(""),[v,N]=l(""),[A,w]=l(!1),[m,E]=l(null),g=i.trim().length>=4,f=d.trim().length>=8,T=g&&f&&!A;async function L(){if(!T)return;w(!0),E(null);let _=xa({topic:i.trim(),inspect_question:d.trim(),context:h.trim()||null,email:v.trim()||null,source:"workbench_suggest"}),F=await ve(_);w(!1),F.ok?s("done"):E(_)}return r==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):a?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(I,{label:"Topic or Question"},React.createElement("input",{className:O,type:"text",value:i,onChange:_=>o(_.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:xe}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(I,{label:"What should be inspected?"},React.createElement("textarea",{className:O,value:d,onChange:_=>n(_.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:Le}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(I,{label:"Optional context, source, or link"},React.createElement("textarea",{className:O,value:h,onChange:_=>y(_.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:Le}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(I,{label:"Optional email for follow-up"},React.createElement("input",{className:O,type:"email",value:v,onChange:_=>N(_.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:xe}))),m?React.createElement(He,{candidate:m}):null,React.createElement("div",{className:"wb-action-row"},React.createElement($,{kind:"primary",disabled:!T,onClick:L},A?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement($,{kind:"ghost",small:!0,onClick:()=>t(!0)},"Suggest \u2192")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement($,{kind:"primary",onClick:()=>t(!0)},"Suggest an investigation \u2192"))))}var De={idle:"Paste an answer to wake The Reader.",ready:"The Reader is ready.",inspecting:"Reader inspecting\u2026",result:"Reader complete."},Ia={full:"FULL",partial:"PARTIAL",thin:"THIN"};function La({state:e}){return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},De[e]||De.idle))}function Ye(e){let a=((e==null?void 0:e.completeness)||"partial").toUpperCase(),t=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],r=((e==null?void 0:e.how_it_was_shaped)||"").trim();return[`Completeness: ${a}`,"","The read",(e==null?void 0:e.the_read)||"","","What was left out",...t.length?t.map(i=>`- ${i}`):["- (none identified)"],"","How it was shaped",r||"(none detected)"].join(`
`).trim()}function Da({mode:e,sel:a,question:t,answer:r,model:s,topic:i,result:o}){let n=["Question",((e==="guided"?a==null?void 0:a.openPrompt:t)||"").trim(),""];return(s||"").trim()&&n.push("AI used",s.trim(),""),e==="own"&&(i||"").trim()&&n.push("Topic / context",i.trim(),""),n.push("Answer",(r||"").trim(),""),o&&n.push("--- Reader output ---","",Ye(o)),n.join(`
`).trim()}function Oa({result:e,context:a}){let[t,r]=l(!1),[s,i]=l(!1);return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement($,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(Ye(e)),r(!0),setTimeout(()=>r(!1),1800)}catch(n){}}},t?"Copied \u2713":"Copy result"),React.createElement($,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(Da({...a,result:e})),i(!0),setTimeout(()=>i(!1),1800)}catch(n){}}},s?"Copied \u2713":"Copy full record"))}function za({result:e,context:a}){let t=(e==null?void 0:e.completeness)||"partial",r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],s=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=(e==null?void 0:e.source)==="fallback",o=(e==null?void 0:e.source)==="agent",d=((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${t}${i?" is-fallback":""}${o?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER"),o?React.createElement(Oa,{result:e,context:a}):null,i?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},"Reader unavailable \u2014 showing fallback check."):null),i?null:React.createElement("div",{className:`wb-reader-result__badge is-${t}`},Ia[t]),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},d.length?d.map((n,h)=>React.createElement("p",{key:h},n)):React.createElement("p",null,(e==null?void 0:e.the_read)||"No read returned."))),React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What was left out"),r.length?React.createElement("ul",{className:"wb-reader-result__list"},r.map((n,h)=>React.createElement("li",{key:h},n))):React.createElement("p",{className:"wb-reader-result__empty"},"No major substantive omissions identified.")),React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},s||"No meaningful shaping detected."))))}function Ba({sel:e}){return e!=null&&e.ready?React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},na(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(B,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.readerProof||e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?"),React.createElement(Be,{text:e.openPrompt})))):null}function Ga(){let[e,a]=l("guided"),[t,r]=l(se[0]),[s,i]=l(""),[o,d]=l(""),[n,h]=l(""),[y,v]=l(""),[N,A]=l(!1),[w,m]=l(null),[E,g]=l({}),f=z(null),T=z(null),L=z(!1),_=!!(e==="guided"?t.openPrompt:s).trim()&&!!o.trim(),F=N?"inspecting":w?"result":_?"ready":"idle";J(()=>{if(!L.current){L.current=!0,oe();return}if(e!=="guided")return;let c=window.requestAnimationFrame(()=>le(f.current));return()=>window.cancelAnimationFrame(c)},[t.id,e]),J(()=>{if(w&&T.current){let c=window.requestAnimationFrame(()=>le(T.current));return()=>window.cancelAnimationFrame(c)}},[w]);let G=c=>{c!==e&&(a(c),g({}),m(null),A(!1))},Y=c=>{!c.ready||c.id===t.id||(r(c),d(""),m(null),g({}),A(!1))},W=async()=>{let c={},C=e==="guided"?t.openPrompt:s,Z=o;if((C||"").trim()||(c.question="Enter the question you asked."),(Z||"").trim()||(c.answer="Paste the AI answer you received."),Object.keys(c).length){g(c);return}g({}),A(!0),m(null);let q=Ra({mode:e,sel:t,question:s,answer:Z,topic:n});try{let H=await Pa(q);m(H)}catch(H){m({source:"fallback",completeness:"thin",the_read:"The Reader could not be reached. Your input is preserved below.",what_was_left_out:[],how_it_was_shaped:"",reason:String(H.message||"network")})}finally{A(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},React.createElement("div",{className:"wb-reader-v2__agent-bar wb-reader-v2__agent-bar--compact"},React.createElement("div",{className:"wb-reader-v2__chip wb-reader-v2__chip--compact",role:"status"},React.createElement("span",{className:"wb-reader-v2__chip-dot","aria-hidden":"true"}),"LIVE READER AGENT"),React.createElement("p",{className:"wb-reader-v2__promise"},"Inspects what surfaced, skipped, softened, or reframed \u2014 not keywords.")),React.createElement("div",{ref:f,className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>G("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>G("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},se.map(c=>React.createElement("button",{key:c.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${c.id===t.id?" is-active":""}${c.ready?"":" is-disabled"}`,onClick:()=>Y(c),disabled:!c.ready,title:c.title},c.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},ia(c)):React.createElement(B,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},c.cardShort||c.title)))),React.createElement(Ba,{sel:t})):React.createElement("p",{className:"wb-reader-v2__own-intro"},"Bring any AI answer. The Reader will inspect what it surfaced, skipped, softened, or reframed."),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(B,null,"Confirm it yourself"):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(I,{label:"Which AI did you ask? (optional)"},React.createElement(fe,{value:y,onChange:v}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(he,{label:"AI answer received",value:o,onChange:c=>{d(c),g(C=>({...C,answer:""}))},error:E.answer,placeholder:"Paste the full response here\u2026",minAckLength:1}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(I,{label:"Question asked"},React.createElement("textarea",{className:O,value:s,onChange:c=>{i(c.target.value),g(C=>({...C,question:""}))},placeholder:"What did you ask the model?",rows:3,style:ee})),E.question?React.createElement("div",{className:"wb-field-error"},E.question):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(I,{label:"Optional topic / context"},React.createElement("input",{className:O,value:n,onChange:c=>h(c.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:ee}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(I,{label:"Which AI did you ask? (optional)"},React.createElement(fe,{value:y,onChange:v}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(he,{label:"AI answer received",value:o,onChange:c=>{d(c),g(C=>({...C,answer:""}))},error:E.answer,placeholder:"Paste the full response here\u2026",minAckLength:1})))),React.createElement("div",{className:"wb-reader-v2__action-row"},React.createElement(La,{state:F}),React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement($,{kind:"primary",disabled:N||!_,onClick:W,className:`wb-reader-cta${_&&!N?" is-armed":""}${N?" is-inspecting":""}`},N?"Reader inspecting\u2026":"Run The Reader")))))),w?React.createElement("div",{ref:T,className:"wb-reader-v2__follow"},React.createElement(za,{result:w,context:{mode:e,sel:t,question:s,answer:o,model:y,topic:n}})):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(Ue,{variant:"reader-secondary"}))))}function Wa(){let e=z(null),[a]=l(()=>Sa());return J(()=>{oe();let t=()=>oe();return window.addEventListener("resize",t),()=>window.removeEventListener("resize",t)},[]),React.createElement("div",{className:`wb-shell${a?" wb-shell--reader-v2":""}`,style:{color:p.text,minHeight:"100vh",fontFamily:M}},React.createElement("style",null,Je),React.createElement("style",null,Qe,Ze,Xe,ea,aa),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:Q,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:P,fontSize:11,letterSpacing:"0.18em",color:p.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:p.line,marginBottom:22}}),a?React.createElement(React.Fragment,null,React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"See what your AI leaves out."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Pick a case, ask the question, paste the answer. The Reader shows what the AI surfaced, skipped, softened, or reframed."),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Ga,null)):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:Q,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:M,fontSize:16.5,lineHeight:1.6,color:p.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Ma,null)),React.createElement("div",{style:{height:1,background:p.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:P,fontSize:11,color:p.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional and reviewed by a person before entering the archive.")))}var Ha=ReactDOM.createRoot(document.getElementById("workbench-root"));Ha.render(React.createElement(Wa,null));})();
