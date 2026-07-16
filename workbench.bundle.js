/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var _t="sha256",X="Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";function ge(e){return`Candidate gap estimate: ${e} of 3 (unvalidated)`}function yt(e){return`Machine gap estimate: ${e} of 3 (unvalidated)`}var vt={full:"FULL",partial:"PARTIAL",thin:"THIN"};function Pe(e){let t=e||{},a=t.inspection||{},s=t.measurement,r=t.provenance||{},n=[];n.push("\u2014\u2014 THE ANSWER INSPECTED \u2014\u2014"),n.push(`Question: ${(t.question||"").trim()}`),(t.topic||"").trim()&&n.push(`Topic / context: ${t.topic.trim()}`),(t.declared_model||"").trim()&&n.push(`AI used: ${t.declared_model.trim()}`),n.push(""),n.push("Answer:"),n.push((t.answer||"").trim()),n.push(""),n.push("\u2014\u2014 THE READ \u2014\u2014"),n.push(`Completeness: ${vt[a.completeness]||(a.completeness||"").toUpperCase()}`),n.push((a.the_read||"").trim()),n.push(""),n.push("What was left out:");let i=Array.isArray(a.what_was_left_out)?a.what_was_left_out.filter(Boolean):[];if(i.length)for(let l of i)n.push(`- ${l}`);else n.push("- (none identified)");if(n.push(""),n.push(`How it was shaped: ${(a.how_it_was_shaped||"").trim()||"(none detected)"}`),(a.inspection_note||"").trim()&&n.push(`Inspection note: ${a.inspection_note.trim()}`),n.push(""),n.push("\u2014\u2014 MEASUREMENT (candidate observations, unvalidated) \u2014\u2014"),s){n.push(ge(s.gap_estimate)),(s.estimate_rationale||"").trim()&&n.push(`Rationale: ${s.estimate_rationale.trim()}`);let l=s.finding_counts||{};n.push(`Findings by type: candidate missing item: ${l["candidate missing item"]||0} \xB7 candidate framing issue: ${l["candidate framing issue"]||0} \xB7 candidate deflection: ${l["candidate deflection"]||0}`);let o=Array.isArray(s.findings)?s.findings:[];o.length&&(n.push(""),o.forEach((u,m)=>{n.push(`${m+1}. [${u.type}] ${(u.materiality||"").trim()}`),(u.anchor||"").trim()&&n.push(`   anchor: "${u.anchor.trim()}"`)})),n.push(""),n.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.")}else n.push("No measurement layer was produced for this run.");return n.push(""),n.push("\u2014\u2014 PROVENANCE \u2014\u2014"),n.push(`Reader model: ${r.reader_model_version||""}`),n.push(`Inspector prompt version: ${r.inspector_prompt_version||""}`),r.inspector_run_conditions&&n.push(`Inspector run conditions: ${JSON.stringify(r.inspector_run_conditions)}`),n.push(`Source content hash: ${r.source_content_hash||""}`),n.push(`Reader output hash: ${r.reader_output_hash||""}`),n.push(`Run timestamp: ${r.run_timestamp||""}`),r.request_id&&n.push(`Request ID: ${r.request_id}`),n}function Ie(e){let t=e||{};return["\u2014\u2014 INTEGRITY \u2014\u2014",`Algorithm: ${t.algorithm||_t}`,`Canonicalization version: ${t.canonicalization_version||"1.0"}`,`Content hash: ${t.content_hash||""}`]}function Oe(e){let t=e||{},a=t.open_run||{},s=[];s.push("IMBAS READER \u2014 INSPECTION RECEIPT"),s.push(`Generated: ${t.generated_at||""}`),s.push(`Schema: ${t.schema_version||""}`),s.push(""),s.push(X),s.push("");for(let r of Pe(a))s.push(r);s.push("");for(let r of Ie(t.integrity))s.push(r);return s.push(""),s.push(X),s.join(`
`)}function Fe(e){let t=e||{},a=t.open_run||{},s=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 PAIRED INSPECTION RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(X),r.push(""),r.push("\u2014\u2014 THE FIRST (OPEN) ANSWER \u2014\u2014"),r.push("");for(let i of Pe(a))r.push(i);r.push(""),r.push("\u2014\u2014 THE TWO-QUESTION TEST (paired, machine estimate) \u2014\u2014"),s.open_run_id&&r.push(`Open run ID: ${s.open_run_id}`),r.push(yt(s.gap_estimate)),(s.estimate_rationale||"").trim()&&r.push(`Rationale: ${s.estimate_rationale.trim()}`),r.push(""),r.push("Targeted prompt (deterministic, from the open answer's candidate gaps):"),r.push((s.targeted_prompt||"").trim()),r.push(""),r.push("Delta \u2014 what the second answer surfaced that the first did not:");let n=Array.isArray(s.delta_items)?s.delta_items:[];n.length?n.forEach((i,l)=>{let o=(i.signal_pattern||"").trim();r.push(`${l+1}. ${o?`[${o}] `:""}${(i.point||"").trim()}`),(i.open_side||"").trim()&&r.push(`   first answer: "${i.open_side.trim()}"`),(i.targeted_side||"").trim()&&r.push(`   second answer: "${i.targeted_side.trim()}"`)}):r.push("- (no delta \u2014 the second answer added nothing material over the first)"),r.push(""),r.push("These are machine estimates over a single answer pair, not validated classifications or evidence."),r.push("");for(let i of Ie(t.integrity))r.push(i);return r.push(""),r.push(X),r.join(`
`)}var Le="Want to test it? Here's the direct question. Run it on your AI and paste what comes back.";function Me(){return{armed:!0}}function De(e,t){let a=e&&typeof e.armed=="boolean"?e.armed:!0;return t?a?{state:{armed:!1},scroll:!0}:{state:{armed:!1},scroll:!1}:{state:{armed:!0},scroll:!1}}var ze=["single_yes","single_no"],Be=["paired_small","paired_noticeable","paired_large"],Ma=[...ze,...Be];function qe(e){return e==="single"?{mode:"single",prompt:"Did this surface something you hadn't considered?",options:[{id:"yes",label:"Yes",value:"single_yes"},{id:"no",label:"No",value:"single_no"}]}:e==="paired"?{mode:"paired",prompt:"How big did the difference feel?",options:[{id:"small",label:"Small",value:"paired_small"},{id:"noticeable",label:"Noticeable",value:"paired_noticeable"},{id:"large",label:"Large",value:"paired_large"}]}:null}function Ge(e,t){return e==="single"?ze.includes(t):e==="paired"?Be.includes(t):!1}var{useState:d,useEffect:M,useRef:O}=React,N={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},H="'Fraunces', Georgia, serif",E="'Inter', ui-sans-serif, system-ui, sans-serif",T="'JetBrains Mono', ui-monospace, monospace",Nt="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",W="wb-input wb-focus",xt=`
.wb-focus:focus-visible { outline: 2px solid ${N.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${N.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,kt=`
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
  font-family: ${H};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${N.text};
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
  font-family: ${T};
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
`,Ct=`
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
  font-family: ${T};
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(222, 111, 56, 0.88);
  line-height: 1.35;
  flex-shrink: 0;
}
.wb-build-note__text {
  font-family: ${E};
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
  font-family: ${T};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${T};
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
  font-family: ${T};
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
  font-family: ${T};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${T};
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
`,St=`
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
  font-family: ${T};
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
  font-family: ${E};
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
  font-family: ${T};
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
  font-family: ${H};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${N.text};
  margin: 0 0 0.36rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__heading {
  margin: 0 0 0.32rem;
}
.wb-suggest-module__eyebrow {
  font-family: ${T};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${H};
  font-size: 18px;
  line-height: 1.28;
  color: rgba(242, 232, 220, 0.94);
}
.wb-suggest-module__support {
  font-family: ${E};
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
  color: ${N.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${N.text} !important;
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
  color: ${N.textDim};
}
.wb-suggest-module__title {
  font-family: ${T};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${N.textDim};
  margin: 0 0 0.28rem;
  line-height: 1.32;
}
.wb-suggest-module__lead {
  font-family: ${E};
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
  color: ${N.text};
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
  background: ${N.accent} !important;
  border-color: ${N.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${N.accentSoft} !important;
  border-color: ${N.accentSoft} !important;
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
  font-family: ${E};
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
/* Reader v2 interaction redesign \u2014 result hero, guided trap-then-reveal steps, the
   second-run mini-loop, progressive field reveal, and the compact privacy line. Flow
   and copy layout only: existing umber/ember/Fraunces skin, no new colors/fonts/images. */
.wb-reader-v2__result {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
}
.wb-result-hero__eyebrow {
  font-family: ${T};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(180, 106, 90, 0.9);
  margin: 0 0 0.5rem;
}
.wb-result-hero__estimate {
  font-family: ${H};
  font-weight: 500;
  font-size: clamp(1.5rem, 5.2vw, 2.35rem);
  line-height: 1.16;
  color: rgba(242, 232, 220, 0.97);
  margin: 0 0 0.5rem;
  text-wrap: balance;
}
.wb-result-hero__summary {
  font-family: ${E};
  font-size: clamp(1rem, 2.4vw, 1.125rem);
  line-height: 1.5;
  color: rgba(226, 212, 196, 0.92);
  margin: 0;
}
.wb-result-hero__why {
  font-family: ${E};
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
  font-family: ${E};
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(220, 206, 190, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.wb-guided-steps__n {
  font-family: ${T};
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
  font-family: ${E};
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
  font-family: ${E};
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
  content: " \u2304";
  color: rgba(180, 166, 150, 0.62);
}
.wb-reader-v2__privacy[open] .wb-reader-v2__privacy-line::after {
  content: " \u2303";
}
.wb-reader-v2__privacy-full {
  font-family: ${E};
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
  font-family: ${E};
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
`,At=`
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
  font-family: ${T};
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
  font-family: ${E};
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
`,se=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",reveal:"In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",reveal:"In Imbas Case 018, 3 of 4 tested frontier models did not name PDUFA user fees in the open answer.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that models often describe Palantir\u2013ICE contracts without clearly naming the surveillance and deportation context.",reveal:"In Imbas Case 003, across the 4 tested frontier models, Palantir's ICE contract scope stayed under-surfaced on the open answer.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",reveal:"In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",reveal:"In Imbas Case 013, all 4 tested frontier models surfaced the Sackler accountability layer on the open answer. It is the smallest gap in the dataset.",cardShort:"OxyContin & Sacklers"}],Rt={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function Et({caseId:e,caseTitle:t,model:a,verdict:s,runDate:r}){let{keyAnchor:n,significance:i}=Rt[e],l={gap_held:`gap held \u2014 the answer did not name ${n}, ${i}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${n}, ${i}.`,key_found:`gap closed \u2014 the answer surfaced ${n}. This gap may be narrowing since May 2026.`},o=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${t}`,`My run (${a}, ${r}): ${l[s]}`,o,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var Tt=["ChatGPT","Claude","Gemini","Grok","Other"];function $t(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function Pt(e){if(!(e!=null&&e.ready))return"";let t=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${t}`}function It(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function rt(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function Ue({c:e}){let t=e?rt(e):null;return t?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},t.caseLine," \xB7 VERIFIED ",t.verified.toUpperCase())):null}function Ot(e){return se.find(t=>t.id===e)}function st(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function x({children:e,onClick:t,kind:a="primary",disabled:s,small:r,className:n=""}){let i={fontFamily:E,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:r?"10px 16px":"12px 22px",borderRadius:6,cursor:s?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:s?.4:1},l={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${a}${r?" wb-btn--small":""}${n?` ${n}`:""}`,onClick:s?void 0:t,disabled:s,style:{...i,...l[a]}},e)}function j({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function z({label:e,children:t}){return React.createElement("label",{className:"wb-field"},React.createElement(j,null,e),t)}function ue({label:e,value:t,onChange:a,error:s,placeholder:r,rows:n=9,style:i,minAckLength:l=1}){let[o,u]=d(!1),[m,w]=d(null);return React.createElement(z,{label:e},React.createElement("textarea",{rows:n,value:t,onChange:g=>{let b=g.target.value;a(b),!ot(b)&&b.trim().length>=l?(w(st(b)),u(!0)):(w(null),u(!1))},placeholder:r,className:`${W}${o?" is-paste-received":""}`,style:i||ne,"aria-invalid":s?!0:void 0}),m&&!s?React.createElement("div",{className:"wb-paste-ack"},m," words received"):null,s?React.createElement("div",{className:"wb-field-error",role:"alert"},s):null)}var ne={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:N.text,border:`1px solid ${N.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:E,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function ye({value:e,onChange:t}){return React.createElement("select",{value:e,onChange:a=>t(a.target.value),className:W,style:{...ne,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),Tt.map(a=>React.createElement("option",{key:a,value:a,style:{color:"#111"}},a)))}function Ae({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function Ft(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function Lt(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var ve="imbas_wb_email";function nt(){try{return localStorage.getItem(ve)||""}catch(e){return""}}function Mt(e){try{e?localStorage.setItem(ve,e):localStorage.removeItem(ve)}catch(t){}}function Dt({onFollow:e,onSkip:t}){let[a,s]=d(""),r=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(j,null,"Your email"),React.createElement("input",{type:"email",value:a,placeholder:"you@domain.com",onChange:n=>s(n.target.value),className:W,style:{...ne,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(x,{kind:"primary",disabled:!r,onClick:()=>e(a)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(x,{kind:"ghost",onClick:t},"Continue without email \u2192")))}function zt(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function it(e,t,a){let s=t.map(o=>({term:o,found:zt(e,o),isKey:a.includes(o)})),r=s.some(o=>o.found),n=s.some(o=>o.found&&o.isKey),i;r?n?i="key_found":i="partial":i="gap_held";let l={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[i];return{tokens:s,verdict:i,verdictLine:l}}function Bt(e,t){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:t!=null&&t>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function Re({title:e,children:t,className:a="",defaultOpen:s=!1}){let[r,n]=d(s);return React.createElement("div",{className:`wb-collapsible${r?" is-open":""}${a?` ${a}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>n(i=>!i),"aria-expanded":r},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},r?"Collapse":"Expand")),r?React.createElement("div",{className:"wb-collapsible__body"},t):null)}function qt(e){if(!e.length)return[];let t=[...e].sort((s,r)=>s[0]-r[0]),a=[t[0]];for(let s=1;s<t.length;s++){let r=a[a.length-1];t[s][0]<=r[1]?r[1]=Math.max(r[1],t[s][1]):a.push(t[s])}return a}function Gt(e,t){let a=[];for(let s of t){let r=s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),n=new RegExp(`(^|[^a-zA-Z0-9])(${r})($|[^a-zA-Z0-9])`,"gi"),i;for(;(i=n.exec(e||""))!==null;){let l=i.index+i[1].length;a.push([l,l+i[2].length])}}return qt(a)}function We(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function Ut(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var He="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function ot(e){let t=(e||"").trim().split(/\s+/).filter(Boolean);return t.length<20||t.some(a=>a.length>40)?He:""}function Wt(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").exec(e||"");return r?r.index:-1}function Ht(e,t){let a=ot(e);if(a)return a;let s=(e||"").trim();if(s.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let r=We(s);return Ut(t).some(n=>We(n)===r)?"Paste the model's actual answer from your own chat.":""}function je({text:e,terms:t,litTerms:a}){let s=a||new Set(t.filter(o=>o.found).map(o=>o.term)),r=t.filter(o=>o.found&&s.has(o.term)).map(o=>o.term),n=Gt(e,r);if(!n.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:H,fontSize:15,lineHeight:1.55,color:N.text}},e);let i=[],l=0;return n.forEach(([o,u],m)=>{l<o&&i.push(React.createElement("span",{key:`t-${m}`},e.slice(l,o))),i.push(React.createElement("span",{key:`h-${m}`,style:{color:N.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(o,u))),l=u}),l<e.length&&i.push(React.createElement("span",{key:"tail"},e.slice(l))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:H,fontSize:15,lineHeight:1.55,color:N.text}},i)}var Ye="/api/repository";function jt(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function Yt(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function Ne(e){if(!Ye)return{ok:!1};let t=document.getElementById("wb-hp"),a=t&&typeof t.value=="string"?t.value:"";try{let s=await fetch(Ye,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:a})}),r=null;try{r=await s.json()}catch(n){}return!s.ok||r&&r.ok===!1?{ok:!1}:{ok:!0}}catch(s){return{ok:!1}}}function lt({candidate:e}){let[t,a]=d(!1),s=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your candidate below and email it to brendan@imbaslabs.com"),React.createElement(Re,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},s),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(x,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(s),a(!0),setTimeout(()=>a(!1),1800)}catch(n){}}},t?"Copied \u2713":"Copy candidate"))))}function Vt({candidate:e,submitOk:t}){return t?React.createElement(Jt,{candidate:e}):React.createElement(lt,{candidate:e})}function Jt({candidate:e}){let[t,a]=d(!1),s=JSON.stringify(e,null,2);return React.createElement(Re,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},s),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(x,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(s),a(!0),setTimeout(()=>a(!1),1800)}catch(n){}}},t?"Copied \u2713":"Copy candidate"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function Kt({caseId:e,caseTitle:t,model:a,anchors:s,runDate:r}){let[n,i]=d(!1),l=Et({caseId:e,caseTitle:t,model:a,verdict:s.verdict,runDate:r}),o="https://twitter.com/intent/tweet?text="+encodeURIComponent(l);return React.createElement(Re,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},l),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(x,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(l),i(!0),setTimeout(()=>i(!1),1800)}catch(m){}}},n?"Copied \u2713":"Copy result"),React.createElement("a",{href:o,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function Ee(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function ce(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function le(e,t){if(typeof window=="undefined"||!e){t==null||t();return}ce();let a=Ee(),s=document.documentElement,r=parseFloat(getComputedStyle(s).getPropertyValue("--header-offset"))||77,n=parseFloat(getComputedStyle(s).getPropertyValue("--scroll-anchor-gap"))||12,i=e.getBoundingClientRect().top+window.scrollY-r-n-6;window.scrollTo({top:Math.max(0,i),behavior:a?"auto":"smooth"}),t&&window.setTimeout(t,a?0:420)}function Qt(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}var Zt="/api/read",Xt="/api/reader-perception";function ea(e){let t=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:t.filter(a=>a.found).map(a=>a.term),missing:t.filter(a=>!a.found).map(a=>a.term)}}function ta({mode:e,sel:t,question:a,answer:s,topic:r,model:n}){if(e==="guided"){let i=it((s||"").trim(),t.detect||[],t.keyDetect||[]);return{case:{topic:t.topic||t.title||"Guided case",anchor:t.mechanism||t.anchor||"",why_it_matters:t.whyItMatters||""},open_question:t.openPrompt,answer:(s||"").trim(),inspected_model:(n||"").trim(),textcheck:ea(i)}}return{case:{topic:(r||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(a||"").trim(),answer:(s||"").trim(),inspected_model:(n||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function aa(e){let t=await fetch(Zt,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){if(t.status===400){let a=await t.json().catch(()=>({}));if(a&&a.error==="too_long")throw new Error("too_long")}throw new Error(`read_${t.status}`)}return t.json()}var ra="/api/read-paired";async function sa(e,t){let a=await fetch(ra,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:e,targeted_answer:t})}),s=await a.json().catch(()=>({}));if(!a.ok){let r=new Error(s&&s.error||`paired_${a.status}`);throw r.status=a.status,r.info=s||{},r}return s}var fe=800,Ve=100,na=80,Je=400,_e=700,xe=3,ia=1.08;function Ke(e){return 180-Math.min(Math.max(e,0),xe)/xe*180}function re(e,t,a,s){let r=s*Math.PI/180;return{x:e+a*Math.cos(r),y:t-a*Math.sin(r)}}function Qe(e,t,a,s,r){let n=re(e,t,a,s),i=re(e,t,a,r),l=Math.abs(s-r)>180?1:0,o=s>r?1:0;return`M ${n.x} ${n.y} A ${a} ${a} 0 ${l} ${o} ${i.x} ${i.y}`}function oa({needleValue:e,settled:t}){let n=Ke(Math.min(e,xe)),i=re(120,84,52,n),l=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${t?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:Qe(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:Qe(120,84,58,180,n),stroke:N.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:t?.76:.42}):null,l.map(o=>{let u=Ke(o),m=re(120,84,61,u),w=re(120,84,50,u),h=re(120,84,36,u);return React.createElement("g",{key:o},React.createElement("line",{x1:w.x,y1:w.y,x2:m.x,y2:m.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:h.x,y:h.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:T},o))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:i.x,y2:i.y,stroke:N.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:N.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:i.x,cy:i.y,r:"1.6",fill:N.accentSoft,opacity:t?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function la({answer:e,anchors:t,caseId:a,caseTitle:s,model:r,runDate:n,gap:i,category:l,observedDate:o,candidate:u,submitOk:m,sequenceReady:w=!0,onAnotherCase:h,onEmailFollow:g}){let b=Ot(a),p=i!=null?i:b==null?void 0:b.gap,y=l||(b==null?void 0:b.category),_=t.tokens,f=O(Ee()),[C,D]=d(!1),S=O(null),[P,B]=d(!1),[q,G]=d(()=>f.current&&p!=null?p:0),[ee,F]=d(()=>f.current&&p!=null?p:0),[ie,Y]=d(f.current),[V,J]=d(()=>f.current?new Set(_.filter(v=>v.found).map(v=>v.term)):new Set),[te,c]=d(!1),[k,I]=d(f.current?_.length:0),[ae,L]=d(f.current),[de,K]=d(!1),[Te,me]=d(f.current),[wt,pe]=d(f.current&&_.some(v=>!v.found)),[Ia,be]=d(f.current&&_.some(v=>v.isKey&&v.found)),we=_.some(v=>!v.found),ht=st(e);M(()=>{var R;if(!S.current)return;let v=(R=S.current.closest(".wb-answer-row"))==null?void 0:R.querySelector(".wb-answer-row__bar");v&&v.style.setProperty("--sweep-travel",`${Math.max(v.offsetHeight-2,40)}px`)},[e,w]),M(()=>{if(!w||p==null)return;if(f.current){G(p),F(p),Y(!0);return}G(0),F(0),Y(!1);let v=performance.now(),R=0,Q=Z=>1-(1-Z)**3,U=Z=>{let $=Math.min(1,(Z-v)/fe);G(Math.round(Q($)*p*10)/10);let A=p*ia;if($<.82){let oe=$/.82;F(Q(oe)*A)}else{let oe=($-.82)/.18;F(A+(p-A)*Q(oe))}$<1?R=requestAnimationFrame(U):(F(p),Y(!0))};return R=requestAnimationFrame(U),()=>cancelAnimationFrame(R)},[w,p,a]),M(()=>{if(!w)return;if(f.current){J(new Set(_.filter(A=>A.found).map(A=>A.term))),c(!1),I(_.length),L(!0),K(!0),me(!0),pe(we),be(_.some(A=>A.isKey&&A.found));let $=setTimeout(()=>K(!1),50);return()=>clearTimeout($)}J(new Set),c(!1),I(0),L(!1),K(!1),me(!1),pe(!1),be(!1);let v=[],R=($,A)=>{v.push(setTimeout($,A))};_.forEach(($,A)=>{R(()=>{I(A+1),$.isKey&&$.found&&be(!0)},fe+A*Ve)});let Q=fe+_.length*Ve;we&&R(()=>pe(!0),Q+50);let U=Q+na;R(()=>{L(!0),K(!0)},U),R(()=>me(!0),U+Je),R(()=>K(!1),U+720);let Z=U+Je+120;return R(()=>c(!0),Z),_.forEach($=>{if(!$.found)return;let A=Wt(e,$.term),oe=A>=0?A/Math.max(e.length,1)*_e:_e;R(()=>{J(ft=>new Set([...ft,$.term]))},Z+oe)}),R(()=>c(!1),Z+_e),()=>{v.forEach(clearTimeout)}},[_.length,a,e,w]);let gt=`wb-result-inner wb-output-module${de?" is-verdict-pulse":""}${f.current?" is-reveal-instant":""}`,he=b?rt(b):null,$e=Bt(t.verdict,p);return React.createElement("div",{className:gt},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},he?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},he.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",he.verified))):null),React.createElement("div",{className:"wb-output-module__body"},p!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${p.toFixed(1)} out of 3`},q.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${$e.tone}${ae?" is-visible":""}`},$e.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(oa,{needleValue:ee,settled:ie}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},y?React.createElement("span",null,y):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(j,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},_.map((v,R)=>{let U=`wb-token-chip${R<k?" is-visible":""}${v.found?" is-found":" is-missing"}`;return React.createElement("li",{key:v.term,className:U},v.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},v.term,v.isKey?" (key)":""," \xB7 ",v.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${P?" is-expanded":""}`},React.createElement("div",{ref:S,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement(je,{text:e,terms:t.tokens,litTerms:V})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${te?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>B(v=>!v),"aria-expanded":P},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",ht," words"),React.createElement("span",{className:`wb-answer-row__chevron${P?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${P?" is-open":""}`},React.createElement(je,{text:e,terms:t.tokens,litTerms:V})))),React.createElement("div",{className:"wb-result-footnote"},we?React.createElement("p",{className:`wb-result-discovery-beat${wt?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),a==="006"&&ae?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${Te?" is-visible":""}`},React.createElement(Kt,{caseId:a,caseTitle:s,model:r,anchors:t,runDate:n}),React.createElement(Vt,{candidate:u,submitOk:m})),Te&&!C&&!nt()?React.createElement(Dt,{onFollow:v=>{Mt(v),D(!0),g&&g(v)},onSkip:()=>D(!0)}):null,h?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:h},"Test another case \u21BA")):null)}function ca(){let[e,t]=d(se[0]),[a,s]=d(0),[r,n]=d(()=>nt()),[i,l]=d(""),[o,u]=d(""),[m,w]=d(!1),[h,g]=d(null),[b,p]=d(null),[y,_]=d(!1),[f,C]=d(""),[D,S]=d(!1),[P,B]=d("idle"),q=O(null),G=O(null),ee=O(!1);M(()=>{if(!ee.current){ee.current=!0,ce();return}if(a===2)return;let c=a===1?q.current:G.current,k=window.requestAnimationFrame(()=>le(c));return()=>window.cancelAnimationFrame(k)},[a]);let F=()=>{s(0),l(""),u(""),g(null),p(null),C(""),S(!1),w(!1)},ie=c=>{if(!c.ready||c.id===e.id)return;let k=Ee(),I=()=>{t(c),F(),B("in"),window.setTimeout(()=>B("idle"),k?0:200)};if(k){I();return}B("out"),window.setTimeout(I,200)},Y=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),_(!0),setTimeout(()=>_(!1),2e3)}catch(c){}},V=()=>{le(q.current,()=>S(!0))},J=async()=>{let c=Ht(o,e);if(c){C(c);return}C(""),w(!0),S(!1);let k=it(o,e.detect,e.keyDetect),I=k.verdict!=="key_found",ae=new Date().toISOString().slice(0,10),L={answer:o,anchors:k,caseId:e.id,caseTitle:e.title,model:i,runDate:ae,gap:e.gap,category:e.category,observedDate:e.observedDate},de=jt({mode:"curated",case_id:e.id,model:i,email:r,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:o,gap_held:I,detect_verdict:k.verdict}),K=await Ne(de);g({...L,submitOk:K.ok}),p(de),w(!1),s(2),window.requestAnimationFrame(V)},te=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",a===2?"is-result":"",P==="out"?"is-crossfade-out":"",P==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:G,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},se.map(c=>{let k=c.id===e.id;return React.createElement("button",{key:c.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${k?" is-active":""}${c.ready?"":" is-disabled"}`,onClick:()=>ie(c),disabled:!c.ready},c.ready?React.createElement("div",{className:"wb-specimen-plate__label"},$t(c)):React.createElement(j,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},c.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:q,className:te},a===2&&h?React.createElement(la,{...h,candidate:b,sequenceReady:D,onAnotherCase:F,onEmailFollow:c=>{n(c);let k={...b,email:c};p(k),Ne(k)}}):a===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(Ue,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(z,{label:"Which AI did you ask?"},React.createElement(ye,{value:i,onChange:l}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ue,{label:"Paste the model's open answer",value:o,onChange:c=>{u(c),C("")},error:f,placeholder:"Paste the full response here\u2026",minAckLength:20})),f?React.createElement("div",{className:"wb-field-error"},f):null,React.createElement("div",{className:"wb-action-row"},React.createElement(x,{kind:"primary",disabled:m||!i||o.trim().length<200,onClick:J},"Compare with what Imbas observed \u2192")),!m&&!f&&o.trim().length>0&&o.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(Ue,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(j,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),a===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(j,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(Ae,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(x,{kind:"ghost",small:!0,onClick:Y,className:y?"is-copied":""},y?"Copied \u2713":"Copy question"),React.createElement(x,{kind:"primary",onClick:()=>s(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(Lt,null),React.createElement(Ft,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(ct,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var ke={...ne,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},Ze={...ke,minHeight:"unset",resize:"vertical"};function ct({variant:e="default"}){let[t,a]=d(!1),[s,r]=d("form"),[n,i]=d(""),[l,o]=d(""),[u,m]=d(""),[w,h]=d(""),[g,b]=d(!1),[p,y]=d(null),_=n.trim().length>=4,f=l.trim().length>=8,C=_&&f&&!g;async function D(){if(!C)return;b(!0),y(null);let S=Yt({topic:n.trim(),inspect_question:l.trim(),context:u.trim()||null,email:w.trim()||null,source:"workbench_suggest"}),P=await Ne(S);b(!1),P.ok?r("done"):y(S)}return s==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):t?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(z,{label:"Topic or Question"},React.createElement("input",{className:W,type:"text",value:n,onChange:S=>i(S.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:ke}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(z,{label:"What should be inspected?"},React.createElement("textarea",{className:W,value:l,onChange:S=>o(S.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:Ze}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(z,{label:"Optional context, source, or link"},React.createElement("textarea",{className:W,value:u,onChange:S=>m(S.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:Ze}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(z,{label:"Optional email for follow-up"},React.createElement("input",{className:W,type:"email",value:w,onChange:S=>h(S.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:ke}))),p?React.createElement(lt,{candidate:p}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(x,{kind:"primary",disabled:!C,onClick:D},g?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(x,{kind:"ghost",small:!0,onClick:()=>a(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(x,{kind:"primary",onClick:()=>a(!0)},"Suggest an investigation \u2192"))))}var Xe={idle:"Paste an answer to inspect it.",needQuestion:"Add the question you asked.",ready:"Let's see what might be missing\u2026",inspecting:"Reading the answer\u2026",result:"Inspection complete."},et=["Reading the answer\u2026","Checking what might be missing\u2026","Found something to check\u2026"],da={full:"FULL",partial:"PARTIAL",thin:"THIN"},Ce={full:"The answer substantially served the question.",partial:"Some material context was missing or shaped.",thin:"The answer was evasive or substantially incomplete."};function ua({state:e}){let[t,a]=d(0);M(()=>{if(e!=="inspecting"){a(0);return}let r=window.setInterval(()=>{a(n=>Math.min(n+1,et.length-1))},1100);return()=>window.clearInterval(r)},[e]);let s=e==="inspecting"?et[t]:Xe[e]||Xe.idle;return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},s))}function ma(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let a=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return a?a[1]:""}function pa(e){let t=ma(e).toLowerCase();return t==="ceiling"?"Reader limit reached \u2014 showing fallback check.":["no_key","disabled","api_error","network","bad_json"].includes(t)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function Se(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function dt({mode:e,sel:t,result:a}){return(a==null?void 0:a.source)==="fallback"?"Fallback check":(a==null?void 0:a.source)!=="agent"?"Reader":e==="guided"&&(t!=null&&t.id)?`Reader agent \xB7 Case ${t.id}`:"Reader agent \xB7 Custom answer"}function ut(e){let t=(e==null?void 0:e.completeness)||"partial",a=t.toUpperCase(),s=Ce[t]||Ce.partial,r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],n=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=((e==null?void 0:e.inspection_note)||"").trim(),l=[`Completeness: ${a}`,s,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...r.length?r.map(o=>`- ${o}`):["- (none identified)"],"","HOW IT WAS SHAPED",n||"(none detected)"];return i&&l.push("","INSPECTION NOTE",i),l.join(`
`).trim()}function ba({mode:e,sel:t,question:a,answer:s,model:r,topic:n,result:i}){let l=e==="guided"?t==null?void 0:t.openPrompt:a,o=(n||"").trim()||(e==="guided"?((t==null?void 0:t.topic)||"").trim():""),u=[];return(i==null?void 0:i.source)==="agent"&&u.push("Inspection receipt",dt({mode:e,sel:t,result:i}),""),u.push(`Question: ${(l||"").trim()}`),o&&u.push(`Topic / context: ${o}`),(r||"").trim()&&u.push(`AI used: ${r.trim()}`),u.push("","Answer",(s||"").trim()),i&&u.push("",ut(i)),u.push("","Behavior, not intent."),u.join(`
`).trim()}var tt=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`,at={single:{title:"Share this inspection",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to \xB7 the unvalidated estimate (\u201CCandidate gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show your full answer \u2014 only the short excerpts above."]},paired:{title:"Share this two-question test",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the delta \u2014 what the second answer surfaced that the first did not \u2014 each with the short quoted excerpts from both answers \xB7 the unvalidated estimate (\u201CMachine gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show either full answer \u2014 only the short excerpts above."]}};function wa(e,t){let a=t==null?void 0:t.error;return e===429?a==="daily_capacity"?"The Reader is at capacity for new shares today. Copy the full receipt for now.":"You've created several share links in a row. Please wait a moment and try again.":e===503||e===500||a==="unconfigured"?"Share links are not live yet. Copy the full receipt for now.":"Could not create share link. Copy the full receipt for now."}function ha({mode:e,busy:t,error:a,onConfirm:s,onCancel:r}){let n=at[e]||at.single,i=O(null),l=`wb-share-consent-title--${e}`,o=`wb-share-consent-desc--${e}`,u=n.lines.map((m,w)=>`${o}-${w}`).join(" ");return M(()=>{i.current&&i.current.focus()},[]),M(()=>{let m=w=>{if(w.key==="Escape"){t||r();return}if(w.key!=="Tab")return;let h=i.current;if(!h)return;let g=Array.prototype.slice.call(h.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));if(g.length===0){w.preventDefault(),h.focus();return}let b=g[0],p=g[g.length-1],y=document.activeElement,_=h.contains(y);w.shiftKey?(!_||y===b||y===h)&&(w.preventDefault(),p.focus()):(!_||y===p||y===h)&&(w.preventDefault(),b.focus())};return document.addEventListener("keydown",m),()=>document.removeEventListener("keydown",m)},[t,r]),React.createElement("div",{className:"wb-share-consent",role:"presentation",onClick:t?void 0:r},React.createElement("div",{ref:i,tabIndex:-1,className:"wb-share-consent__panel wb-focus",role:"dialog","aria-modal":"true","aria-labelledby":l,"aria-describedby":u,onClick:m=>m.stopPropagation()},React.createElement("h3",{id:l,className:"wb-share-consent__title"},n.title),n.lines.map((m,w)=>React.createElement("p",{key:w,id:`${o}-${w}`,className:"wb-share-consent__line"},m)),a?React.createElement("p",{className:"wb-share-consent__error",role:"alert"},a):null,React.createElement("div",{className:"wb-share-consent__actions"},React.createElement(x,{kind:"ghost",small:!0,className:"wb-share-consent__confirm",onClick:s,disabled:t},t?"Creating share link\u2026":"Create share link"),React.createElement(x,{kind:"ghost",small:!0,onClick:r,disabled:t},"Cancel"))))}function mt({mode:e,receipt:t,onShared:a}){let[s,r]=d("idle"),[n,i]=d(""),[l,o]=d(""),u=O(null);if(!t)return null;let m=e==="paired"?"Share this two-question test":"Share this inspection",w=s==="consenting"||s==="creating",h=()=>{let f=u.current&&u.current.querySelector(".wb-reader-share__btn");f&&f.focus()};return React.createElement("div",{className:"wb-reader-share",ref:u},n&&(s==="ready"||s==="copied")?React.createElement("div",{className:"wb-reader-share__success",role:"status"},React.createElement("p",{className:"wb-reader-share__success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-share__url"},React.createElement("a",{href:n,target:"_blank",rel:"noopener noreferrer"},n)),React.createElement("div",{className:"wb-reader-share__actions"},React.createElement("a",{href:n,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-share__open"},"Open share page"),React.createElement(x,{kind:"ghost",small:!0,className:s==="copied"?"is-copied":"",onClick:async()=>{if(n)try{await navigator.clipboard.writeText(n),r("copied"),setTimeout(()=>r("ready"),1600)}catch(f){o("Could not copy link. Select the link below and copy manually.")}}},s==="copied"?"Copied":"Copy share link"))):React.createElement(x,{kind:"ghost",small:!0,className:"wb-reader-share__btn",onClick:()=>{o(""),r("consenting")}},m),w?React.createElement(ha,{mode:e,busy:s==="creating",error:l,onConfirm:async()=>{r("creating"),o("");try{let f=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:t})}),C=await f.json().catch(()=>({}));if(!f.ok||!C.ok||!C.share_url){console.warn("[imbas] inspection-share failed",f.status,C&&C.error),o(wa(f.status,C)),r("consenting");return}typeof a=="function"&&a(C.share_url),i(C.share_url),r("ready");try{await navigator.clipboard.writeText(C.share_url),r("copied"),setTimeout(()=>r("ready"),1600)}catch(D){}}catch(f){console.warn("[imbas] inspection-share network error",f),o("Could not create share link. Copy the full receipt for now."),r("consenting")}},onCancel:()=>{s!=="creating"&&(o(""),r("idle"),h())}}):null)}function ga({result:e,context:t,shareUrl:a}){let[s,r]=d(!1),[n,i]=d(!1),[l,o]=d(""),u=h=>{h(!0),o(""),setTimeout(()=>h(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(x,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${ut(e)}

${tt(a)}`),u(r)}catch(h){o("Could not copy"),setTimeout(()=>o(""),2200)}}},s?"Copied":"Copy Result"),React.createElement(x,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${ba({...t,result:e})}

${tt(a)}`),u(i)}catch(h){o("Could not copy"),setTimeout(()=>o(""),2200)}}},n?"Copied":"Copy Full Receipt"),l?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},l):null)}function fa({result:e,context:t,onRunAgain:a}){let[s,r]=d(""),n=(e==null?void 0:e.completeness)||"partial",i=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],l=((e==null?void 0:e.how_it_was_shaped)||"").trim(),o=((e==null?void 0:e.inspection_note)||"").trim(),u=(e==null?void 0:e.source)==="fallback",m=(e==null?void 0:e.source)==="agent",w=dt({mode:t.mode,sel:t.sel,result:e}),h=u?[Se()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${n}${u?" is-fallback":""}${m?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},m?React.createElement("div",{className:`wb-reader-result__status is-${n}`},React.createElement("div",{className:`wb-reader-result__badge is-${n}`},da[n]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},Ce[n])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),m?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},w)):null,u?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},pa(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},u?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},h.length?h.map((g,b)=>React.createElement("p",{key:b},g)):React.createElement("p",null,u?Se():"No read returned."))),u?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What may be missing"),i.length?React.createElement("ul",{className:"wb-reader-result__list"},i.map((g,b)=>React.createElement("li",{key:b},g))):React.createElement("p",{className:"wb-reader-result__empty"},"No major gaps flagged in this answer.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},l||"No meaningful shaping detected."))),o?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},o)):null,!u&&m?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),a?React.createElement("div",{className:`wb-reader-result__footer${u?" is-fallback":""}`},m?React.createElement(React.Fragment,null,React.createElement(ga,{result:e,context:t,shareUrl:s}),React.createElement(mt,{mode:"single",receipt:e.receipt,onShared:r})):null,React.createElement(x,{kind:"ghost",small:!0,onClick:a,className:"wb-reader-result__rerun"},"Run again")):null)}var _a={"candidate missing item":"Candidate missing item","candidate framing issue":"Candidate framing issue","candidate deflection":"Candidate deflection"};function pt({receipt:e,formatter:t=Oe,filePrefix:a="imbas-reader-receipt"}){let[s,r]=d(!1),[n,i]=d(!1),[l,o]=d("");if(!e)return null;let u=g=>{g(!0),o(""),setTimeout(()=>g(!1),1800)},m=g=>{o(g),setTimeout(()=>o(""),2200)};return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions"},React.createElement(x,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2)),u(r)}catch(g){m("Could not copy")}}},s?"Copied":"Copy JSON"),React.createElement(x,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:()=>{try{let g=t(e),b=new Blob([g],{type:"text/plain;charset=utf-8"}),p=URL.createObjectURL(b),y=document.createElement("a"),_=(e.generated_at||"").replace(/[:.]/g,"-");y.href=p,y.download=`${a}-${_||"run"}.txt`,document.body.appendChild(y),y.click(),y.remove(),setTimeout(()=>URL.revokeObjectURL(p),0),u(i)}catch(g){m("Could not download receipt")}}},n?"Downloaded":"Download receipt"),l?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},l):null)}function ya(e){let t=e&&e.finding_counts||{},a=t["candidate missing item"]||0,s=t["candidate framing issue"]||0,r=t["candidate deflection"]||0,n=[];return a&&n.push(`${a} candidate missing item${a===1?"":"s"}`),s&&n.push(`${s} candidate framing issue${s===1?"":"s"}`),r&&n.push(`${r} candidate deflection${r===1?"":"s"}`),n.length?`Reader found ${n.join(", ")}.`:"Reader found no candidate gaps in this answer. It read clean."}async function va(e,t,a,s){for(let r=0;r<2;r++){if(s.current!==a)return;try{let n=await fetch(Xt,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:e,value:t})});if(n.ok||n.status<500||r===1)return}catch(n){if(r===1)return}}}function bt({mode:e,receipt:t}){let a=qe(e),[s,r]=d(null),n=O(0);if(!a||!t)return null;let i=l=>{if(!Ge(e,l))return;r(l);let o=++n.current;va(t,l,o,n)};return React.createElement("div",{className:"wb-perception wb-scroll-anchor"},React.createElement("p",{className:"wb-perception__prompt"},a.prompt),React.createElement("div",{className:"wb-perception__options",role:"group","aria-label":a.prompt},a.options.map(l=>{let o=s===l.value;return React.createElement("button",{key:l.id,type:"button",className:`wb-focus wb-perception__option${o?" is-selected":""}`,"aria-pressed":o,onClick:()=>i(l.value)},l.label)})))}function Na({result:e}){let t=e==null?void 0:e.measurement;if(!t)return null;let a=(t.estimate_rationale||"").trim();return React.createElement("section",{className:"wb-reader-result is-agent wb-result-hero wb-scroll-anchor","aria-labelledby":"wb-result-hero-estimate"},React.createElement("p",{className:"wb-result-hero__eyebrow"},"Inspection result"),React.createElement("p",{id:"wb-result-hero-estimate",className:"wb-result-hero__estimate"},ge(t.gap_estimate)),React.createElement("p",{className:"wb-result-hero__summary"},ya(t)),a?React.createElement("p",{className:"wb-result-hero__why"},a):null)}function xa({result:e,context:t}){var u,m,w;let a=e==null?void 0:e.measurement;if(!a)return null;let s=(e==null?void 0:e.receipt)||null,r=Array.isArray(a.findings)?a.findings:[],n=a.finding_counts||{},i=((t==null?void 0:t.model)||"").trim()||(((u=s==null?void 0:s.open_run)==null?void 0:u.declared_model)||"").trim(),l=(s==null?void 0:s.generated_at)||((w=(m=s==null?void 0:s.open_run)==null?void 0:m.provenance)==null?void 0:w.run_timestamp)||"",o=[i?`Model: ${i}`:"Model: (not declared)"];return l&&o.push(l),React.createElement("section",{className:"wb-reader-result is-agent wb-measure wb-scroll-anchor","aria-labelledby":"wb-measure-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-measure-heading",className:"wb-reader-result__title"},"MEASUREMENT")),React.createElement("p",{className:"wb-reader-result__provenance wb-measure__meta"},o.join(" \xB7 ")),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-measure__findings"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Candidate findings"),React.createElement("p",{className:"wb-measure__counts"},`Missing item: ${n["candidate missing item"]||0} \xB7 Framing issue: ${n["candidate framing issue"]||0} \xB7 Deflection: ${n["candidate deflection"]||0}`),r.length?React.createElement("ul",{className:"wb-measure__list"},r.map((h,g)=>React.createElement("li",{key:g,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},_a[h.type]||h.type),(h.materiality||"").trim()?React.createElement("span",{className:"wb-measure__finding-why"},h.materiality.trim()):null,(h.anchor||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor"},`"${h.anchor.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No candidate findings \u2014 the answer read clean."))),React.createElement("p",{className:"wb-measure__unvalidated"},"These are candidate observations from a single answer \u2014 inspection hypotheses, not validated classifications or evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},X),React.createElement(pt,{receipt:s}))}function ka({paired:e,onReset:t}){let a=Array.isArray(e.delta_items)?e.delta_items:[],s=e.signal_counts||{};return React.createElement("div",{className:"wb-act2__delta wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},"You already ran this pair. This is the analysis from that run."):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},"The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."):null,React.createElement("div",{className:"wb-measure__estimate wb-act2__estimate"},React.createElement("div",{className:"wb-measure__estimate-value"},e.gap_estimate_label),(e.estimate_rationale||"").trim()?React.createElement("p",{className:"wb-measure__estimate-why"},e.estimate_rationale.trim()):null),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"The delta"),React.createElement("p",{className:"wb-measure__counts"},`Omission: ${s.Omission||0} \xB7 Framing Drift: ${s["Framing Drift"]||0} \xB7 Deflection: ${s.Deflection||0}`),a.length?React.createElement("ol",{className:"wb-measure__list"},a.map((r,n)=>React.createElement("li",{key:n,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},r.signal_pattern),React.createElement("p",{className:"wb-measure__finding-why"},r.point),(r.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},"First answer"),`"${r.open_side.trim()}"`):null,(r.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},"Second answer"),`"${r.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No material gap. The direct question surfaced nothing decision-relevant the first answer left out."))),React.createElement("p",{className:"wb-measure__unvalidated"},"This is a machine estimate over one answer pair. Not a human-scored result, not evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},X),React.createElement(pt,{receipt:e.receipt,formatter:Fe,filePrefix:"imbas-reader-paired-receipt"}),React.createElement(mt,{mode:"paired",receipt:e.receipt}),React.createElement(bt,{mode:"paired",receipt:e.receipt}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(x,{kind:"ghost",small:!0,onClick:t},"Test another answer")))}function Ca(e){let t=e&&e.info&&typeof e.info.message=="string"?e.info.message.trim():"";return t||"The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly."}function Sa({openReceipt:e}){let[t,a]=d(""),[s,r]=d(!1),[n,i]=d(null),[l,o]=d(""),[u,m]=d("");if(!e)return null;let w=!!t.trim(),h=p=>{a(p),l&&o(""),u&&m("")},g=()=>{i(null),a(""),o(""),m("")},b=async()=>{if(!s){if(!w){o("Paste the answer your AI gave the direct question.");return}o(""),m(""),r(!0);try{let p=await sa(e,t);i(p)}catch(p){let y=p&&p.info||{};p&&p.status===400&&y.error==="too_long"?o("Answer is over 1200 words. Trim it and re-run."):p&&p.status===400&&y.error==="empty"?o("That's too short to compare. Paste the full answer."):p&&p.status===400?m("This inspection can't run the two-question test. Re-run the answer above, then try again."):m(Ca(p))}finally{r(!1)}}};return n?React.createElement("div",{className:"wb-act2__test"},React.createElement(ka,{paired:n,onReset:g})):React.createElement("div",{className:"wb-act2__test"},React.createElement(ue,{label:"Answer to the direct question",value:t,onChange:h,error:l,placeholder:"Paste what your AI came back with\u2026",minAckLength:1}),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(x,{kind:"primary",disabled:s||!w,onClick:b,className:`wb-reader-cta${w&&!s?" is-armed":""}${s?" is-inspecting":""}`},s?"Comparing\u2026":"Compare the two answers")),u?React.createElement("p",{className:"wb-act2__run-error",role:"status"},u):null)}function Aa({result:e}){let t=e==null?void 0:e.act2,[a,s]=d(!1),[r,n]=d("");if(!t||!t.eligible)return null;let i=async()=>{try{await navigator.clipboard.writeText(t.targeted_prompt||""),s(!0),n(""),setTimeout(()=>s(!1),1800)}catch(l){n("Could not copy"),setTimeout(()=>n(""),2200)}};return React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-scroll-anchor","aria-labelledby":"wb-act2-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-act2-heading",className:"wb-reader-result__title"},"THE TWO-QUESTION TEST")),t.available?React.createElement(React.Fragment,null,React.createElement("p",{className:"wb-act2__offer"},Le),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"The direct question to run on your AI"},t.targeted_prompt),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(x,{kind:"ghost",small:!0,className:a?"is-copied":"",onClick:i},a?"Copied":"Copy the question"),r?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},r):null),React.createElement(Sa,{openReceipt:e.receipt})):React.createElement("p",{className:"wb-act2__degraded",role:"status"},"The test runs a second read, and the Reader is at capacity right now. Try again in a little while."))}function Ra({sel:e}){let[t,a]=d(!1),[s,r]=d("");if(!(e!=null&&e.ready))return null;let n=async()=>{try{await navigator.clipboard.writeText(e.openPrompt||""),a(!0),r(""),setTimeout(()=>a(!1),1800)}catch(i){r("Could not copy"),setTimeout(()=>r(""),2200)}};return React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},Pt(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__signal wb-guided-trap"},React.createElement("p",{className:"wb-active-case__probe"},"Start with an ordinary question:"),React.createElement(Ae,{text:e.openPrompt})),e.reveal?React.createElement("div",{className:"wb-readout__section wb-guided-reveal"},React.createElement("div",{className:"wb-active-case__headline"},e.reveal)):null,React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste what it says back")),React.createElement("div",{className:"wb-guided-copy"},React.createElement(x,{kind:"ghost",small:!0,className:t?"is-copied":"",onClick:n},t?"Copied":"Copy question"),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null)))}function Ea({mode:e,sel:t,onAnother:a}){let[s,r]=d(!1),[n,i]=d(""),l=se.find(m=>m.ready&&m.id!==(t==null?void 0:t.id))||null,o=(l==null?void 0:l.openPrompt)||(t==null?void 0:t.openPrompt)||"";return o?React.createElement("section",{className:"wb-reader-result is-agent wb-loop wb-scroll-anchor","aria-labelledby":"wb-loop-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-loop-heading",className:"wb-reader-result__title"},"TEST ANOTHER QUESTION")),React.createElement("p",{className:"wb-loop__lead"},"Run the same check on a fresh question. Copy it, ask your AI, paste what it says back."),React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste the answer back")),React.createElement(Ae,{text:o}),React.createElement("div",{className:"wb-loop__actions"},React.createElement(x,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(o),r(!0),i(""),setTimeout(()=>r(!1),1800)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},s?"Copied":"Copy question"),n?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},n):null,React.createElement(x,{kind:"primary",small:!0,onClick:()=>a(l)},"Test another question"))):null}function Ta(){let[e,t]=d("own"),[a,s]=d(se[0]),[r,n]=d(""),[i,l]=d(""),[o,u]=d(""),[m,w]=d(""),[h,g]=d(!1),[b,p]=d(null),[y,_]=d({}),f=O(null),C=O(null),D=O(!1),S=O(Me()),P=!!(e==="guided"?a.openPrompt:r).trim(),B=!!i.trim(),q=P&&B,G=e==="own"&&B&&!P,ee=h?"inspecting":b?"result":q?"ready":G?"needQuestion":"idle";M(()=>{let c=()=>{window.location.hash==="#wb-reader-console"&&t("own")};return c(),window.addEventListener("hashchange",c),()=>window.removeEventListener("hashchange",c)},[]),M(()=>{if(!D.current){D.current=!0,ce();return}if(e!=="guided")return;let c=window.requestAnimationFrame(()=>le(f.current));return()=>window.cancelAnimationFrame(c)},[a.id,e]),M(()=>{let{state:c,scroll:k}=De(S.current,!!b);if(S.current=c,k&&C.current){let I=window.requestAnimationFrame(()=>le(C.current));return()=>window.cancelAnimationFrame(I)}},[b]);let F=c=>{c!==e&&(t(c),_({}),p(null),g(!1),c==="own"&&l(""))},ie=c=>{!c.ready||c.id===a.id||(s(c),l(""),p(null),_({}),g(!1))},Y=c=>{p(null),_({}),g(!1),l(""),e==="guided"?c&&s(c):c&&n(c.openPrompt),f.current&&window.requestAnimationFrame(()=>le(f.current))},V=c=>{l(c),_(k=>({...k,answer:""})),b&&p(null)},J=c=>{n(c),_(k=>({...k,question:""})),b&&p(null)},te=async()=>{if(h)return;let c={},k=e==="guided"?a.openPrompt:r,I=i;if(e==="own"&&!(k||"").trim()&&(c.question="Add the question you asked."),(I||"").trim()||(c.answer="Paste an answer to run The Reader."),Object.keys(c).length){_(c);return}_({}),g(!0),p(null);let ae=ta({mode:e,sel:a,question:r,answer:I,topic:o,model:m});try{let L=await aa(ae);p(L)}catch(L){L&&L.message==="too_long"?_({answer:"Answer is over 1200 words. Trim it and re-run."}):p({source:"fallback",completeness:"thin",the_read:Se(),what_was_left_out:[],how_it_was_shaped:"",reason:String(L.message||"network")})}finally{g(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},React.createElement("div",{ref:f,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>F("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>F("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with a measured case."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},se.map(c=>React.createElement("button",{key:c.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${c.id===a.id?" is-active":""}${c.ready?"":" is-disabled"}`,onClick:()=>ie(c),disabled:!c.ready,title:c.title},c.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},It(c)):React.createElement(j,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},c.cardShort||c.title)))),React.createElement(Ra,{sel:a})):React.createElement("div",{className:"wb-reader-v2__own-header"},React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste an AI answer below. The Reader inspects what it might be missing.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(j,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(z,{label:"Which AI did you ask? (optional)"},React.createElement(ye,{value:m,onChange:w}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(ue,{label:"AI answer received",value:i,onChange:V,error:y.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(ue,{label:"AI answer received",value:i,onChange:V,error:y.answer,placeholder:"Paste an AI answer. Anything from ChatGPT, Gemini, Claude\u2026",minAckLength:1})),B||P?React.createElement("div",{className:"wb-reader-v2__reveal"},React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(z,{label:"Question asked"},React.createElement("textarea",{className:W,value:r,onChange:c=>J(c.target.value),placeholder:"What did you ask the model?",rows:3,style:ne,"aria-invalid":!!y.question})),y.question?React.createElement("div",{className:"wb-field-error",role:"alert"},y.question):null,G&&!y.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(z,{label:"Optional topic / context"},React.createElement("input",{className:W,value:o,onChange:c=>u(c.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:ne}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(z,{label:"Which AI did you ask? (optional)"},React.createElement(ye,{value:m,onChange:w})))):null)),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":h},React.createElement(ua,{state:ee}),React.createElement("details",{className:"wb-reader-v2__privacy"},React.createElement("summary",{className:"wb-reader-v2__privacy-line"},"Inspections aren't saved to our public record. Don't paste anything sensitive."),React.createElement("p",{className:"wb-reader-v2__privacy-full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See ",React.createElement("a",{href:"/retention.html"},"what deletion means")," and the ",React.createElement("a",{href:"/privacy.html"},"privacy policy"),".")),b?null:React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(x,{kind:"primary",disabled:h||!q,onClick:te,className:`wb-reader-cta${q&&!h?" is-armed":""}${h?" is-inspecting":""}`},h?"Inspecting\u2026":"See what might be missing")))))),b?React.createElement("div",{ref:C,className:"wb-reader-v2__result wb-scroll-anchor"},b.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--hero"},React.createElement(Na,{result:b})):null,React.createElement("div",{className:"wb-reader-v2__follow"},React.createElement(fa,{result:b,context:{mode:e,sel:a,question:r,answer:i,model:m,topic:o},onRunAgain:te})),b.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--measure"},React.createElement(xa,{result:b,context:{mode:e,sel:a,question:r,answer:i,model:m,topic:o}})):null,b.measurement&&b.receipt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--perception"},React.createElement(bt,{mode:"single",receipt:b.receipt})):null,b.act2?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--act2"},React.createElement(Aa,{result:b})):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--loop"},React.createElement(Ea,{mode:e,sel:a,onAnother:Y})),React.createElement("p",{className:"wb-reader-v2__post-privacy"},"This inspection wasn't saved to our public record. See ",React.createElement("a",{href:"/retention.html"},"what deletion means"),".")):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(ct,{variant:"reader-secondary"}))))}function $a(){let e=O(null),[t]=d(()=>Qt());return M(()=>{ce();let a=()=>ce();return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),React.createElement("div",{className:`wb-shell${t?" wb-shell--reader-v2":""}`,style:{color:N.text,minHeight:"100vh",fontFamily:E}},React.createElement("style",null,Nt),React.createElement("style",null,xt,kt,Ct,St,At),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:H,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:T,fontSize:11,letterSpacing:"0.18em",color:N.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:N.line,marginBottom:22}}),t?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"See what your AI might be missing."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped."),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Ta,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:H,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:E,fontSize:16.5,lineHeight:1.6,color:N.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(ca,null)),t?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:N.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:T,fontSize:11,color:N.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var Pa=ReactDOM.createRoot(document.getElementById("workbench-root"));Pa.render(React.createElement($a,null));})();
