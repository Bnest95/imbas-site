/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var Rt="reader-receipt-1.0";var Fa="sha256",Q="Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";function Je(e){return`Candidate gap estimate: ${e} of 3 (unvalidated)`}function Ua(e){return`Machine gap estimate: ${e} of 3 (unvalidated)`}function Ba(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function Qe(e){if(typeof e=="string")return Ba(e);if(Array.isArray(e))return e.map(Qe);if(e&&typeof e=="object"){let t={};for(let a of Object.keys(e).sort())t[a]=Qe(e[a]);return t}return e}function It(e){let t=Qe(e);return t&&typeof t=="object"&&t.integrity&&typeof t.integrity=="object"&&(t.integrity.content_hash=null),JSON.stringify(t)}var Ha="cfp.1";var Wa={full:"FULL",partial:"PARTIAL",thin:"THIN"};function Pt(e){let t=e||{},a=t.inspection||{},s=t.measurement,n=t.provenance||{},r=[];r.push("\u2014\u2014 THE ANSWER INSPECTED \u2014\u2014"),r.push(`Question: ${(t.question||"").trim()}`),(t.topic||"").trim()&&r.push(`Topic / context: ${t.topic.trim()}`),(t.declared_model||"").trim()&&r.push(`AI used: ${t.declared_model.trim()}`),r.push(""),r.push("Answer:"),r.push((t.answer||"").trim()),r.push(""),r.push("\u2014\u2014 THE READ \u2014\u2014"),r.push(`Completeness: ${Wa[a.completeness]||(a.completeness||"").toUpperCase()}`),r.push((a.the_read||"").trim()),r.push(""),r.push("What was left out:");let o=Array.isArray(a.what_was_left_out)?a.what_was_left_out.filter(Boolean):[];if(o.length)for(let c of o)r.push(`- ${c}`);else r.push("- (none identified)");if(r.push(""),r.push(`How it was shaped: ${(a.how_it_was_shaped||"").trim()||"(none detected)"}`),(a.inspection_note||"").trim()&&r.push(`Inspection note: ${a.inspection_note.trim()}`),r.push(""),r.push("\u2014\u2014 MEASUREMENT (candidate observations, unvalidated) \u2014\u2014"),s){r.push(Je(s.gap_estimate)),(s.estimate_rationale||"").trim()&&r.push(`Rationale: ${s.estimate_rationale.trim()}`);let c=s.finding_counts||{};r.push(`Findings by type: candidate missing item: ${c["candidate missing item"]||0} \xB7 candidate framing issue: ${c["candidate framing issue"]||0} \xB7 candidate deflection: ${c["candidate deflection"]||0}`);let i=Array.isArray(s.findings)?s.findings:[];i.length&&(r.push(""),i.forEach((u,p)=>{r.push(`${p+1}. [${u.type}] ${(u.materiality||"").trim()}`),(u.anchor||"").trim()&&r.push(`   anchor: "${u.anchor.trim()}"`)})),r.push(""),r.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.")}else r.push("No measurement layer was produced for this run.");return r.push(""),r.push("\u2014\u2014 PROVENANCE \u2014\u2014"),r.push(`Reader model: ${n.reader_model_version||""}`),r.push(`Inspector prompt version: ${n.inspector_prompt_version||""}`),n.inspector_run_conditions&&r.push(`Inspector run conditions: ${JSON.stringify(n.inspector_run_conditions)}`),n.condition_fingerprint&&r.push(`Condition fingerprint (${n.fingerprint_version||Ha}): ${n.condition_fingerprint}`),r.push(`Source content hash: ${n.source_content_hash||""}`),r.push(`Reader output hash: ${n.reader_output_hash||""}`),r.push(`Run timestamp: ${n.run_timestamp||""}`),n.request_id&&r.push(`Request ID: ${n.request_id}`),r}function Xe(e){let t=e||{};return["\u2014\u2014 INTEGRITY \u2014\u2014",`Algorithm: ${t.algorithm||Fa}`,`Canonicalization version: ${t.canonicalization_version||"1.0"}`,`Content hash: ${t.content_hash||""}`]}function Ot(e){let t=e||{},a=t.open_run||{},s=[];s.push("IMBAS READER \u2014 INSPECTION RECEIPT"),s.push(`Generated: ${t.generated_at||""}`),s.push(`Schema: ${t.schema_version||""}`),s.push(""),s.push(Q),s.push("");for(let n of Pt(a))s.push(n);s.push("");for(let n of Xe(t.integrity))s.push(n);return s.push(""),s.push(Q),s.join(`
`)}function Dt(e){let t=e||{},a=t.open_run||{},s=t.paired_analysis||{},n=[];n.push("IMBAS READER \u2014 PAIRED INSPECTION RECEIPT"),n.push(`Generated: ${t.generated_at||""}`),n.push(`Schema: ${t.schema_version||""}`),n.push(""),n.push(Q),n.push(""),n.push("\u2014\u2014 THE FIRST (OPEN) ANSWER \u2014\u2014"),n.push("");for(let o of Pt(a))n.push(o);n.push(""),n.push("\u2014\u2014 THE TWO-QUESTION TEST (paired, machine estimate) \u2014\u2014"),s.open_run_id&&n.push(`Open run ID: ${s.open_run_id}`),n.push(Ua(s.gap_estimate)),(s.estimate_rationale||"").trim()&&n.push(`Rationale: ${s.estimate_rationale.trim()}`),n.push(""),n.push("Targeted prompt (deterministic, from the open answer's candidate gaps):"),n.push((s.targeted_prompt||"").trim()),n.push(""),n.push("Delta \u2014 what the second answer surfaced that the first did not:");let r=Array.isArray(s.delta_items)?s.delta_items:[];r.length?r.forEach((o,c)=>{let i=(o.signal_pattern||"").trim();n.push(`${c+1}. ${i?`[${i}] `:""}${(o.point||"").trim()}`),(o.open_side||"").trim()&&n.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&n.push(`   second answer: "${o.targeted_side.trim()}"`)}):n.push("- (no delta \u2014 the second answer added nothing material over the first)"),n.push(""),n.push("These are machine estimates over a single answer pair, not validated classifications or evidence."),n.push("");for(let o of Xe(t.integrity))n.push(o);return n.push(""),n.push(Q),n.join(`
`)}function Lt(e){let t=e||{},a=t.open_run||{},s=t.paired_analysis||{},n=[];n.push("IMBAS READER \u2014 USER-DIRECTED FOLLOW-UP RECEIPT"),n.push(`Generated: ${t.generated_at||""}`),n.push(`Schema: ${t.schema_version||""}`),n.push(""),n.push(Q),n.push(""),n.push("\u2014\u2014 THE FIRST ANSWER \u2014\u2014"),n.push(""),(a.question||"").trim()&&(n.push(`Question: ${a.question.trim()}`),n.push("")),n.push((a.answer||"").trim()),n.push(""),n.push("\u2014\u2014 THE FOLLOW-UP YOU CHOSE \u2014\u2014"),(s.chip_label||"").trim()&&n.push(s.chip_label.trim()),n.push(""),s.chip_id&&n.push(`Chip ID: ${s.chip_id}`),s.instruction_version&&n.push(`Instruction version: ${s.instruction_version}`),s.open_run_id&&n.push(`Open run ID: ${s.open_run_id}`),n.push(""),n.push("Instruction you sent:"),n.push((s.targeted_prompt||"").trim()),n.push(""),n.push("What changed in the second answer:");let r=Array.isArray(s.delta_items)?s.delta_items:[];r.length?r.forEach((o,c)=>{n.push(`${c+1}. ${(o.point||"").trim()}`),(o.open_side||"").trim()&&n.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&n.push(`   second answer: "${o.targeted_side.trim()}"`)}):n.push("- (nothing visibly changed under this instruction)"),n.push(""),n.push("This is a user-directed follow-up, not an Imbas inspection finding. It shows what changed under the conditions you recorded; it does not establish that the second answer is correct, complete, or better supported."),n.push("");for(let o of Xe(t.integrity))n.push(o);return n.push(""),n.push(Q),n.join(`
`)}var $t="Want to test it? Here's a direct question that gives nothing away.",qt="The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets.";function za(e){return String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`)}var $e="Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";var qe="gap_revealed",Me="still_missing",Fe="not_clear_yet",Ze=[qe,Me,Fe];function Mt({gap_estimate:e,signal_counts:t}={}){let a=Number(e);if(!Number.isFinite(a)||a<=0)return Me;let s=t||{},n=(Number(s.Omission)||0)+(Number(s.Deflection)||0);return(Number(s["Framing Drift"])||0)>n?Fe:qe}var Ge="What it told you",je="What it told you when you asked",Ue="Didn't come up.",Ft="Your session, your conditions \u2014 not the lab's.",fe={[qe]:{headline:"It answers when asked. It just didn't volunteer.",tag:"That's the Volunteer Gap \u2014 you just watched it happen in your own chat.",chip:"It didn't volunteer"},[Me]:{headline:"You asked directly. It still didn't surface.",cta:"Push harder \u2192",chip:"Still didn't surface"},[Fe]:{headline:"The second answer changed. The gap isn't clean.",cta:"Try the cleaner check \u2192",swapPanels:!0,chip:"Not clear yet"}},Ne="quick",ke="cleaner",Ut="Same chat is faster. A fresh chat gives you a cleaner comparison.",et={label:"Quick check",hint:"Same chat. Paste the question, ask again."},tt={label:"Cleaner check",hint:"Fresh chat. Copy the setup, then ask."};function Bt({question:e}={}){let t=typeof e=="string"?e.trim():"",a=[];return t&&(a.push(t),a.push("")),a.push($e),za(a.join(`
`)).trim()}var J={YES:"yes",NO:"no",NOT_SURE:"not_sure"},te={NONE:"none",EDITED:"edited"},Ga="unverified",ja=80;function Va({same_model:e,edits:t}={}){return t===te.EDITED||e===J.NO?!1:e===J.YES&&t===te.NONE?!0:Ga}function at({same_model:e,model_version:t,edits:a}={}){let s={same_model_claimed:e===J.YES,user_edits_disclosed:a===te.EDITED,conditions_matched:Va({same_model:e,edits:a})},n=typeof t=="string"?t.trim():"";return n&&(s.model_version_user_reported=n.slice(0,ja)),s}function Be(e){return!e||e.conditions_matched!==!0}var ue={INSPECTION_FOLLOWUP:"inspection_followup",USER_CHIP:"user_chip",LEGACY_UNKNOWN:"legacy_unknown"};function Ya(e){return e===ue.INSPECTION_FOLLOWUP||e===ue.USER_CHIP?e:ue.LEGACY_UNKNOWN}function Ht({targeted_prompt:e,original_artifact_id:t,targeted_artifact_id:a,capture:s,initiator:n,targeted_prompt_hash:r,chip_id:o,instruction_version:c}={}){let i={targeted_prompt:typeof e=="string"?e:"",original_artifact_id:typeof t=="string"?t:"",targeted_artifact_id:typeof a=="string"?a:"",capture:s&&typeof s=="object"?s:{},initiator:Ya(n),targeted_prompt_hash:typeof r=="string"?r:""};return i.initiator===ue.USER_CHIP&&(i.chip_id=typeof o=="string"?o:"",i.instruction_version=typeof c=="string"?c:""),i}var $={heading:"One quick thing before the side-by-side",intro:"This just marks how you ran the two answers. It never changes what they say.",same_model:{question:"Did both answers come from the same AI \u2014 same provider, same model?",options:{[J.YES]:"Yes, the same one",[J.NO]:"No, a different one",[J.NOT_SURE]:"Not sure"}},model_version:{question:"Which model did you use? Optional.",hint:"The name or version, as you remember it.",placeholder:"e.g. the model or version you ran"},edits:{question:"Did you edit either answer before pasting?",options:{[te.NONE]:"No, neither was edited",[te.EDITED]:"Yes, I edited one or both"}},disclosure:"This marks how clean the capture was. It doesn't decide whether the conditions lined up.",unmatched_warning:"The conditions behind these two answers aren't confirmed as matched \u2014 a different model, an edit, or a setup you weren't sure about. Read the side-by-side as a looser comparison, not a like-for-like.",unmatched_badge:"Unmatched conditions"};var nt="chip_change_visible",st="chip_change_not_visible",rt="chip_change_unclear",Wt=[nt,st,rt];function zt({delta_count:e,conditions_matched:t}={}){let a=Number(e);return!Number.isFinite(a)||a<=0?st:t===!0?nt:rt}var ot={[nt]:{headline:"The change you asked for shows up in the second answer.",note:"That's under the conditions you recorded. It doesn't mean the second answer is correct or complete.",chip:"The change shows up"},[st]:{headline:"The second answer doesn't show the change you asked for.",note:"No visible difference isn't an all-clear. The change could be there in a way this comparison doesn't catch.",chip:"I don't see the change"},[rt]:{headline:"Something changed, but not under matched conditions.",note:"A different model, an edit, or a setup you weren't sure about. Read this as a looser comparison, not like-for-like.",chip:"Hard to tell"}},x={value_statement:{headline:"Tell your AI exactly what to do next.",sub:"Paste the answer or draft. Tap what bothered you. Get the exact instruction to paste back."},row_header:"What would you like the next answer to do differently?",row_support:"These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",card:{framing:"Paste this into the same AI, in the same conversation if possible. If you start a new conversation, include the original answer and any material it relied on. Bring the new answer back."},side_by_side:{reason_prefix:"Follow-up selected by you: ",first_answer_caption:"The answer or draft you started with.",second_answer_caption:"Second answer after your follow-up. Not verified by Imbas."},meaning_panel_line:"This comparison follows a user-selected instruction, not an inspection-generated follow-up. It shows what changed under the recorded conditions; it does not establish that the second answer is correct, complete, or better supported. Absence of a visible difference is not an all-clear.",boundary:"User-directed follow-up. No Imbas inspection finding asserted.",professional_cue:{line:"AI made the draft. Your name still goes on it.",link:"For professional work \u2192"},compose:{first_answer_label:"The answer or draft you started with",first_answer_placeholder:"Paste the answer or draft you want to change\u2026",second_answer_label:"Second answer after your follow-up",second_answer_placeholder:"Paste what your AI came back with\u2026",copy_label:"Copy the instruction",copy_done:"Copied \u2014 now paste it into your AI",compare_label:"Compare the two answers",comparing_label:"Comparing\u2026",first_answer_missing:"Paste the answer or draft you started with.",second_answer_missing:"Paste the second answer your AI gave.",chip_missing:"Pick a follow-up above first.",too_long:"Second answer is over 1200 words. Trim it and re-run.",too_short:"That's too short to compare. Paste the full second answer.",not_eligible:"That follow-up isn't available right now. Pick another and try again.",blocked:"This follow-up can't run right now. Check what you pasted and try again.",run_error:"The comparison didn't reach the Reader. Nothing you pasted was changed. Try again shortly."},reveal:{delta_heading:"What changed",empty_delta:"No visible difference under the instruction you chose. That isn't an all-clear: the change could be there in a way this comparison doesn't catch.",first_side_label:"First answer",second_side_label:"Second answer",correct_label:"Read it differently?",reset_label:"Try another follow-up",idempotent_notice:"You already ran this follow-up. This is the comparison from that run.",capture_uncertain_notice:"The comparison is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."}};function it(e){if(e&&(typeof e=="object"||typeof e=="function")&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))it(e[t])}return e}var Ka=it({CAPTURE_DERIVED:"capture_derived",DOSSIER_DERIVED:"dossier_derived",PRACTICE_DERIVED:"practice_derived",MIXED:"mixed"}),xe=Ka,Ee="v1",Ce="2026-07-20",Te="authored, pending founder review and bounded testing",ct=it([{id:"sq.material",approved_ui_label:"Didn't use the material I provided",instruction_text:`Answer my question again, or revise the draft, using the document, text, or data I gave you as your main source. Build your claims on what that material actually says.

Point to the exact parts you drew on: the section, passage, or figure behind each claim. Keep what comes from my material separate from anything you add from general knowledge.

Where my material already answers the question, don't reach for a generic assumption instead. If you can't open or read part of what I gave you, or it isn't here in this conversation, say so plainly and ask for it rather than filling the gap.`,instruction_version:Ee,seeding_tag:xe.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 1: the documented 2026-07-20 instrument pass found no captured analogue (0/90 prompt-bearing files; the corpus names anchors but supplies no material). Practice-derived and anchor-free by necessity \u2014 the person can point at 'the document I gave you' without naming what it should have contained. Generalizes the always-true instruction: prefer the supplied material as the primary source, expose which parts were used, and admit when the material is inaccessible. No anchor is lost because none was ever captured for this class.",author:"Imbas",date:Ce,review_status:Te,known_misuse_risks:["Used on an answer where the person supplied no document, text, or data \u2014 there is no material to prefer, so the instruction has nothing to bind to.","Read as a demand to treat the supplied material as the only allowable source even where it is silent, pushing the model to over-claim from a thin document."],negative_examples:["A general-knowledge question asked with no attachment or pasted source ('What is the capital of Australia?').","A request for the model's own opinion or a brainstorm, where no external material was offered or intended."],content_hash:"d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a"},{id:"sq.sources",approved_ui_label:"Doesn't show where its claims came from",instruction_text:`As you answer again, or go back through the draft, show me where each important factual claim comes from. Name the source behind it: a citation, a document, a study, or another specific reference someone could look up.

Mark clearly which claims rest on a real source and which are your own inference or estimate.

Don't invent a citation, and don't imply a source backs a claim when you haven't checked that it does. Where you don't have a genuine source for something, say so and label it as your own reasoning rather than dressing it up as sourced.`,instruction_version:Ee,seeding_tag:xe.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-006","imbas-instrument:registry/cases/case-012"],abstraction_note:"Seeds: case-006 (targeted prompt naming Kennan/Burns/Matlock/Gates; capture og-006-B-claude-targeted.md reproduces each authority with a citation, L5/17/28/37) and case-012 (naming Hviid 2019 and IOM 2011; capture og-012-B-gpt-targeted.md, inline citations L2/5/13/18); structural analogues in cases 002, 010, 013. Those captures name a specific omitted authority. The template generalizes to the anchor-free form: source the model's OWN claims, whatever they are. Lost: the named authority \u2014 the person cannot supply the very source they don't know is missing. Dossier reinforcement only, not a capture: sg-ctr-currency-over-10k.md L58-66 states the mechanism (name the source, add no new triggering fact).",author:"Imbas",date:Ce,review_status:Te,known_misuse_risks:["Pushed onto a purely subjective or creative answer (a poem, an opinion) where source attribution does not apply.","Read as requiring a formal citation for every sentence, driving the model to attach nominal references that don't actually support the point."],negative_examples:["A creative-writing or opinion request with no factual claim to source.","A step in a math derivation where each line follows from the previous, not from an external source."],content_hash:"42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81"},{id:"sq.date_version",approved_ui_label:"Doesn't say what date or version applies",instruction_text:`Answer again, or revise the draft, and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to.

Then check whether the version you're using has since been amended, replaced, or updated, and name the one that applies now wherever you can confirm it.

If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is.`,instruction_version:Ee,seeding_tag:xe.MIXED,seed_case_ids:["imbas-instrument:registry/cases/case-005","imbas-instrument:registry/cases/case-009"],abstraction_note:"Two clauses, two provenances, so the tag is mixed. The date/version clause descends from captures: case-005 (SEC Rule 10b-18, 1982; og-005-B-gpt-targeted.md L3/L26) and case-009 (2023 ODNI declassified summary; og-009-B-claude-targeted.md L14-16/48) \u2014 each anchors a specific dated authority. The supersession clause descends from dossier-only material with no capture: imbas-instrument:data/annex-exemplars/dossiers/tx-ctc-permanence-vol-asym.md L39-42 (Public Law 119-21 permanence; L220 'No capture exists') and the case-bank repeal subset. The template generalizes both to the anchor-free form: date every time-sensitive point in the model's own answer and check it for supersession. Lost: the named rule and the named repeal.",author:"Imbas",date:Ce,review_status:Te,known_misuse_risks:["Applied to a timeless fact (a definition, a settled physical constant) where no date or version is meaningful.","Read as a demand to assert the current version even where the model cannot check it, inviting a fabricated 'latest as of' claim."],negative_examples:["A question about a mathematical identity or a fixed historical date, where nothing versions.","An answer that already carries explicit, dated sourcing for every time-sensitive point."],content_hash:"dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8"},{id:"sq.direct_answer",approved_ui_label:"Didn't answer the question I actually asked",instruction_text:`Start by answering the exact question I asked. Restate that question back to me in one line first, so I can see it hasn't been quietly narrowed, widened, or swapped for a nearby one. If you're revising a draft, do the same for the question the draft is meant to answer.

Give the direct answer up front. Add only the background that answer actually needs, and put it after the answer, not before.

If the question can't be answered as I asked it, or something it needs is missing, name the specific thing that's in the way. Don't quietly trade my question for an easier one you can answer instead.`,instruction_version:Ee,seeding_tag:xe.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 4: no captured analogue by the documented 2026-07-20 search. The instrument's design is between-condition across fresh conversations, not a re-ask; case-003 v2 is a framing test, not a re-ask; the single regex hit was a false positive inside captured answer prose. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: answer the exact question first, restate it so any substitution is visible, and name the obstacle instead of swapping in an easier question. No anchor is lost because none was captured.",author:"Imbas",date:Ce,review_status:Te,known_misuse_risks:["Used when the person's question is genuinely ambiguous, where restating one reading as 'the exact question' can lock in the wrong one.","Read as a ban on all context, producing a bare answer that drops caveats the question actually needed."],negative_examples:["An open-ended brainstorming prompt where no single direct answer is expected.","A request that explicitly asks for broad exploration or a set of options rather than one answer."],content_hash:"98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a"},{id:"sq.quantity",approved_ui_label:"Didn't give the number or range I asked for",instruction_text:`Give the number, range, or threshold I asked for. If you're revising a draft, make sure that figure is actually stated in it, not left implied. Where a single figure is fair, give the figure; where it isn't, give a realistic range instead of a single point.

Show your work: the inputs and assumptions behind the figure, and the calculation where there is one. Keep the values you actually know apart from the ones you're estimating.

If the evidence doesn't get you to a solid number or range, say so outright and name what you'd need to get there. Don't invent a precise figure just to look more certain than you are.`,instruction_version:Ee,seeding_tag:xe.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-004","imbas-instrument:registry/cases/case-010"],abstraction_note:"Seeds: case-004 (NNT literature; og-004-B-claude-targeted.md L14/15/36-39/42, NNT about 9, 20-33, 10-30, Cochrane figures) and case-010 (combined voting power; og-010-B-claude-targeted.md L7/19/39, 20-40% figures); reinforced by og-005 L26 ($942B, 2024) and og-012 L5 (HR 0.93, 95% CI 0.85-1.02). The captured sub-mechanisms diverge \u2014 a single settled figure versus an empirical range \u2014 and the template deliberately covers both: give the figure where one is fair, the realistic range where it isn't, with inputs shown. Anchor-free: the person asks for 'the number I wanted' without knowing it. Lost: the specific quantity and its source literature.",author:"Imbas",date:Ce,review_status:Te,known_misuse_risks:["Applied to a question that is not quantitative, manufacturing a number where none belongs.","Read as always requiring a range, so a well-established single figure gets diluted into a vague band."],negative_examples:["A qualitative 'how should I approach this?' question with no quantity at issue.","A definitional or yes/no question where a number is not responsive."],content_hash:"12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e"},{id:"sq.fact_assumption",approved_ui_label:"Mixes facts with assumptions",instruction_text:`Answer again, or go back through the draft, and keep three things apart: what you actually know, what you're assuming, and what you're inferring from those. Say which is which as you go.

For each main conclusion, show what it rests on: the facts and the assumptions it depends on. Where something is still unsettled, name it as an open question instead of smoothing it over.

Don't hand me an assumption, an inference, or an estimate dressed up as an established fact.`,instruction_version:Ee,seeding_tag:xe.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 6: no captured analogue by the documented 2026-07-20 search (0/90). The instrument constitution's epistemic chain is instrument-internal review discipline, never a model-directed prompt, and is deliberately NOT claimed as an analogue here. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: separate what is known from what is assumed or inferred, tie each conclusion to what it rests on, and never present an assumption as an established fact. No anchor is lost because none was captured.",author:"Imbas",date:Ce,review_status:Te,known_misuse_risks:["Forced onto a simple factual answer that has no assumptions to separate, adding empty scaffolding.","Read as a demand to label ordinary settled facts as 'assumptions', overstating how uncertain they are."],negative_examples:["A single verifiable lookup ('What year did X happen?') with no inference chain.","A creative or opinion answer where a fact/assumption split does not apply."],content_hash:"e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309"}]);var A={RUN_STARTED:"run_started",RUN_COMPLETED:"run_completed",RESULT_VIEWED:"result_viewed",TARGET_QUESTION_COPIED:"target_question_copied",LOOP_RETURNED:"loop_returned",LOOP_COMPLETED:"loop_completed",STATE_CORRECTED:"state_corrected",CARD_EXPORTED:"card_exported",CANDIDATE_SUBMITTED:"candidate_submitted",RETURN_VISIT:"return_visit",CHIP_ROW_RENDERED:"chip_row_rendered",CHIP_SELECTED:"chip_selected",CHIP_INSTRUCTION_COPIED:"chip_instruction_copied",CHIP_PAIR_INITIATED:"chip_pair_initiated",CHIP_PAIR_COMPLETED:"chip_pair_completed",FOLLOW_UP_REVEALED:"follow_up_revealed",TIMEOUT:"timeout",CAPACITY_DEGRADATION:"capacity_degradation",CAPTURE_UNCERTAIN:"capture_uncertain",RESTORED_SESSION:"restored_session"},Gt=Object.values(A),Qa=new Set(Gt),Ja=["run","state","from_state","to_state","check","mode","gap","eligible","source","idempotent","initiator","instruction_version","chip","conditions","ms","reason"],Xa=new Set(Ja),Za=64;function en(e={}){let t={};if(!e||typeof e!="object"||Array.isArray(e))return t;for(let a of Xa){let s=e[a];if(s!=null){if(typeof s=="number")Number.isFinite(s)&&(t[a]=s);else if(typeof s=="boolean")t[a]=s;else if(typeof s=="string"){let n=s.trim();n&&(t[a]=n.slice(0,Za))}}}return t}function jt(e,t={},a=Date.now()){return Qa.has(e)?{name:e,ts:Number.isFinite(a)?Math.round(a):0,...en(t)}:null}function lt(e){let t=Array.isArray(e)?e.filter(p=>p&&typeof p.name=="string"):[],a=p=>t.reduce((_,m)=>m.name===p?_+1:_,0),s=a(A.TARGET_QUESTION_COPIED),n=a(A.LOOP_COMPLETED),r=a(A.CHIP_INSTRUCTION_COPIED),o=a(A.CHIP_PAIR_COMPLETED),c={},i={};for(let p of t)p.name===A.LOOP_COMPLETED&&p.state&&(c[p.state]=(c[p.state]||0)+1),p.name===A.CHIP_PAIR_COMPLETED&&p.state&&(i[p.state]=(i[p.state]||0)+1);let u={};for(let p of Gt)u[p]=a(p);return{counts:u,completed_by_state:c,chip_completed_by_state:i,loop_completion_rate:s>0?n/s:null,chip_completion_rate:r>0?o/r:null}}function Vt(){return{armed:!0}}function Yt(e,t){let a=e&&typeof e.armed=="boolean"?e.armed:!0;return t?a?{state:{armed:!1},scroll:!0}:{state:{armed:!1},scroll:!1}:{state:{armed:!0},scroll:!1}}var Kt=["single_yes","single_no"],Qt=["paired_small","paired_noticeable","paired_large"],Qs=[...Kt,...Qt];function Jt(e){return e==="single"?{mode:"single",prompt:"Did this surface something you hadn't considered?",options:[{id:"yes",label:"Yes",value:"single_yes"},{id:"no",label:"No",value:"single_no"}]}:e==="paired"?{mode:"paired",prompt:"How big did the difference feel?",options:[{id:"small",label:"Small",value:"paired_small"},{id:"noticeable",label:"Noticeable",value:"paired_noticeable"},{id:"large",label:"Large",value:"paired_large"}]}:null}function Xt(e,t){return e==="single"?Kt.includes(t):e==="paired"?Qt.includes(t):!1}var ae={register_heading:"Questions worth asking",register_note:"Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers, not verdicts \u2014 copy a question and check it against a source.",top_label:"Worth asking first",expand_label:"Show the full register",collapse_label:"Show fewer",labels:{trigger:"Trigger",proposition:"Rests on",dependent:"Which carries",dependency:"How they connect",evidence:"Quoted from the answer",verification:"Worth asking",resolver:"Where to check",status:"Status"},provisional_label:"Provisional \u2014 a pointer, not a verdict",copy_affordance:"Copy the question",copied_affordance:"Copied",finding_labels:{omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"},resolver_labels:{authority:"Check against an authority",document:"Check against the document",calculation:"Re-run the calculation",direct_question:"Ask the question directly"},status_labels:{open:"Open",resolved:"Resolved",dismissed:"Set aside"}};var tn="review-graph.v0.3.1",Zt="review-record.c14n.v1",an="review-record.v1",nn="sha256",sn=new Set(["open","resolved","dismissed"]);var rn="This is a record of what was examined and what was resolved. It holds provisional discovery outputs: each check is a pointer worth checking against a source, never a verdict on the answer. The integrity block is an unkeyed SHA-256 digest over the record's canonical form \u2014 a fixity check that the listed contents have not shifted since export, not a signature and not proof of who produced it. The record claims nothing beyond what it lists.",He={action_label:"Download review record",downloaded_label:"Downloaded",action_hint:"A record of what was examined and resolved, as JSON.",download_error:"Could not download the review record"},on=new Set(["created_at","supplied_at","inspection_run_at","at"]);function ta(e){if(typeof e!="string"||e==="")return e;let t=e.replace(/(\.\d{3})\d+/,"$1"),a=new Date(t);if(Number.isNaN(a.getTime()))throw new Error(`review-record.c14n.v1: unparseable timestamp ${JSON.stringify(e)}`);return a.toISOString()}function dt(e,t){if(typeof e=="string")return on.has(t)?ta(e):e;if(Array.isArray(e))return e.map(a=>dt(a,t));if(e&&typeof e=="object"){let a={};for(let s of Object.keys(e).sort())a[s]=dt(e[s],s);return a}return e}function cn(e){let t=e&&typeof e=="object"?e:{},a={};for(let s of Object.keys(t))s!=="integrity"&&(a[s]=t[s]);return JSON.stringify(dt(a,null))}async function ln(e){let t=new TextEncoder().encode(String(e)),a=globalThis.crypto&&globalThis.crypto.subtle;if(!a)throw new Error("review-record.c14n.v1: WebCrypto SHA-256 is unavailable in this environment");let s=await a.digest("SHA-256",t),n=new Uint8Array(s),r="";for(let o=0;o<n.length;o++)r+=n[o].toString(16).padStart(2,"0");return r}async function dn(e){return ln(cn(e))}function q(e){return typeof e=="string"?e:""}function ea(e){return sn.has(e)?e:null}function un({result:e,checkStates:t={},createdAt:a,pair:s=null}={}){let n=q(a);if(!n)throw new Error("assembleReviewRecord: createdAt (ISO 8601) is required");let o=(e&&e.receipt||{}).open_run||{},c=o.provenance||{},i=e&&e.checks||{},u=i.inspector||{},p=q(c.request_id)||"inspection",_=q(c.run_timestamp)||n,h=[{id:"original_answer",role:"original_answer",body:q(o.answer),source_model_user_reported:{name:q(o.declared_model),version:""},verified:!1,supplied_at:_}],l={model:q(u.model)||q(c.reader_model_version),model_version:q(u.model_version)||q(c.reader_model_version),prompt_version:q(u.prompt_version)||q(c.inspector_prompt_version)},b=l,N=[];if(s&&typeof s=="object"&&typeof s.targeted_answer=="string"){let y=s.targeted_source_model&&typeof s.targeted_source_model=="object"?s.targeted_source_model:{};h.push({id:"targeted_answer",role:"targeted_answer",body:s.targeted_answer,source_model_user_reported:{name:q(y.name),version:q(y.version)},verified:!1,supplied_at:q(s.targeted_supplied_at)||_}),N.push(Ht({targeted_prompt:q(s.targeted_prompt),original_artifact_id:"original_answer",targeted_artifact_id:"targeted_answer",capture:s.capture,initiator:ue.INSPECTION_FOLLOWUP,targeted_prompt_hash:q(s.targeted_prompt_hash)})),s.inspector&&typeof s.inspector=="object"&&(b={model:q(s.inspector.model)||l.model,model_version:q(s.inspector.model_version)||l.model_version,prompt_version:q(s.inspector.prompt_version)||l.prompt_version})}let v=Array.isArray(i.detector_events)?i.detector_events:[],T=(Array.isArray(i.checks)?i.checks:[]).map(y=>{let I=ea(t[y&&y.id])||ea(y&&y.status)||"open";return{id:q(y.id),detector_event_id:q(y.detector_event_id),subclass:q(y.subclass),proposition_at_issue:y.proposition_at_issue,dependent_output:y.dependent_output,demonstration:y.demonstration,verification_action:y.verification_action,ranking:y.ranking,status:I}}),R={artifacts:h,pair_runs:N,detector_events:v,checks:T,resolution_evidence:[],inspector:b,versions:{schema:tn,canonicalization:Zt,record:an,check_model:q(i.version)},timestamps:{created_at:n,inspection_run_at:_},method_note:rn};return{id:`rr_${p}`,inspection_ids:[p],created_at:n,contents:R,integrity:{algorithm:nn,canonicalization:Zt,digest:""}}}async function aa(e){let t=un(e);return t.integrity.digest=await dn(t),t}function na(e){let t=q(e&&e.integrity&&e.integrity.digest),a=q(e&&e.created_at),s="unknown";if(a){let r=ta(a);r&&(s=r.slice(0,10))}let n=t?t.slice(0,8):"00000000";return`imbas-review-record-${s}-${n}.json`}var ut="S1",pt="S2",sa="S3",mt="S4",pn="S5\u2218S3",mn="S5\u2218S4",Se={heading:"Why this inspection matters",section_labels:{what:"What happened",why:"Why this matters",next:"What you can do next"},states:{[ut]:{what:"The Reader inspected this answer and didn't surface anything that met its bar for a check under the tested conditions.",why:"That's a record of what was inspected, not a verdict on the answer. An inspection that surfaces nothing is not a clean bill of health.",next:"Run the same inspection on a fresh question, or copy the record of this inspection."},[pt]:{what:"The inspection surfaced {N} item(s) worth checking before this answer gets used.",why:"The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",next:"Open the checks, copy a verification question into your own AI, or export the review record."},[sa]:{what:"The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",why:"That's a comparison recorded under these conditions. It does not establish that nothing was left out.",next:"Try a different targeted question, run the pair with another model, or export the record."},[mt]:{what:"The targeted answer contained material the open answer did not.",why:"The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",next:"Review the checks, run the pair again, or export the review record."}},s5_condition_line:"The compared answers were produced under unmatched or unverified conditions, so differences may reflect changed conditions rather than response behavior alone.",archive_boundary:"Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",method_link:{label:"How admission works",href:"/how-it-works.html"}};function _n(e,t){let a=Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,s=`${a} item${a===1?"":"s"}`;return String(e).replace("{N} item(s)",s).replace("{N}",String(a))}function Ve(e,{n:t,s5:a}={}){let s=Se.states[e],n=a?[s.why,Se.s5_condition_line]:[s.why];return{heading:Se.heading,section_labels:Se.section_labels,what:_n(s.what,t),why:n,next:s.next,archive_boundary:Se.archive_boundary,method_link:Se.method_link}}function ra({pairRuns:e,findings:t,conditionsMatched:a}={}){let s=Array.isArray(e)&&e.length>0,n=Array.isArray(t)?t.length:Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,r=n>0;if(!s)return r?{state_id:pt,copy:Ve(pt,{n})}:{state_id:ut,copy:Ve(ut)};let o=r?mt:sa;return Be({conditions_matched:a})?{state_id:o===mt?mn:pn,copy:Ve(o,{n,s5:!0})}:{state_id:o,copy:Ve(o,{n})}}var{useState:d,useEffect:V,useRef:H}=React,O={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},pe="'Fraunces', Georgia, serif",G="'Inter', ui-sans-serif, system-ui, sans-serif",j="'JetBrains Mono', ui-monospace, monospace",bn="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",de="wb-input wb-focus",fn=`
.wb-focus:focus-visible { outline: 2px solid ${O.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${O.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,wn=`
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
  font-family: ${pe};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${O.text};
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
  font-family: ${j};
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
`,gn=`
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
  font-family: ${j};
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(222, 111, 56, 0.88);
  line-height: 1.35;
  flex-shrink: 0;
}
.wb-build-note__text {
  font-family: ${G};
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
  font-family: ${j};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${j};
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
  font-family: ${j};
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
  font-family: ${j};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${j};
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
`,yn=`
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
  font-family: ${j};
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
  font-family: ${G};
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
  font-family: ${j};
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
  font-family: ${pe};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${O.text};
  margin: 0 0 0.36rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__heading {
  margin: 0 0 0.32rem;
}
.wb-suggest-module__eyebrow {
  font-family: ${j};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${pe};
  font-size: 18px;
  line-height: 1.28;
  color: rgba(242, 232, 220, 0.94);
}
.wb-suggest-module__support {
  font-family: ${G};
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
  color: ${O.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${O.text} !important;
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
  color: ${O.textDim};
}
.wb-suggest-module__title {
  font-family: ${j};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${O.textDim};
  margin: 0 0 0.28rem;
  line-height: 1.32;
}
.wb-suggest-module__lead {
  font-family: ${G};
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
  color: ${O.text};
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
  background: ${O.accent} !important;
  border-color: ${O.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${O.accentSoft} !important;
  border-color: ${O.accentSoft} !important;
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
  font-family: ${G};
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
  font-family: ${j};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(180, 106, 90, 0.9);
  margin: 0 0 0.5rem;
}
.wb-result-hero__estimate {
  font-family: ${pe};
  font-weight: 500;
  font-size: clamp(1.5rem, 5.2vw, 2.35rem);
  line-height: 1.16;
  color: rgba(242, 232, 220, 0.97);
  margin: 0 0 0.5rem;
  text-wrap: balance;
}
.wb-result-hero__summary {
  font-family: ${G};
  font-size: clamp(1rem, 2.4vw, 1.125rem);
  line-height: 1.5;
  color: rgba(226, 212, 196, 0.92);
  margin: 0;
}
.wb-result-hero__why {
  font-family: ${G};
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
  font-family: ${G};
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(220, 206, 190, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.wb-guided-steps__n {
  font-family: ${j};
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
  font-family: ${G};
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
  font-family: ${G};
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
  font-family: ${G};
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
  font-family: ${G};
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
`,vn=`
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
  font-family: ${j};
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
  font-family: ${G};
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
`,Ie=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",reveal:"In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",reveal:"In Imbas Case 018, 3 of 4 tested frontier models did not name PDUFA user fees in the open answer.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that models often describe Palantir\u2013ICE contracts without clearly naming the surveillance and deportation context.",reveal:"In Imbas Case 003, across the 4 tested frontier models, Palantir's ICE contract scope stayed under-surfaced on the open answer.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",reveal:"In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",reveal:"In Imbas Case 013, all 4 tested frontier models surfaced the Sackler accountability layer on the open answer. It is the smallest gap in the dataset.",cardShort:"OxyContin & Sacklers"}],Nn={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function kn({caseId:e,caseTitle:t,model:a,verdict:s,runDate:n}){let{keyAnchor:r,significance:o}=Nn[e],c={gap_held:`gap held \u2014 the answer did not name ${r}, ${o}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${r}, ${o}.`,key_found:`gap closed \u2014 the answer surfaced ${r}. This gap may be narrowing since May 2026.`},i=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${t}`,`My run (${a}, ${n}): ${c[s]}`,i,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var xn=["ChatGPT","Claude","Gemini","Grok","Other"];function En(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function Cn(e){if(!(e!=null&&e.ready))return"";let t=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${t}`}function Tn(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function va(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function oa({c:e}){let t=e?va(e):null;return t?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},t.caseLine," \xB7 VERIFIED ",t.verified.toUpperCase())):null}function Sn(e){return Ie.find(t=>t.id===e)}function Na(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function C({children:e,onClick:t,kind:a="primary",disabled:s,small:n,className:r=""}){let o={fontFamily:G,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:n?"10px 16px":"12px 22px",borderRadius:6,cursor:s?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:s?.4:1},c={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${a}${n?" wb-btn--small":""}${r?` ${r}`:""}`,onClick:s?void 0:t,disabled:s,style:{...o,...c[a]}},e)}function me({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function ne({label:e,children:t}){return React.createElement("label",{className:"wb-field"},React.createElement(me,null,e),t)}function Pe({label:e,value:t,onChange:a,error:s,placeholder:n,rows:r=9,style:o,minAckLength:c=1}){let[i,u]=d(!1),[p,_]=d(null);return React.createElement(ne,{label:e},React.createElement("textarea",{rows:r,value:t,onChange:h=>{let l=h.target.value;a(l),!Ta(l)&&l.trim().length>=c?(_(Na(l)),u(!0)):(_(null),u(!1))},placeholder:n,className:`${de}${i?" is-paste-received":""}`,style:o||Oe,"aria-invalid":s?!0:void 0}),p&&!s?React.createElement("div",{className:"wb-paste-ack"},p," words received"):null,s?React.createElement("div",{className:"wb-field-error",role:"alert"},s):null)}var Oe={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:O.text,border:`1px solid ${O.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:G,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function ft({value:e,onChange:t}){return React.createElement("select",{value:e,onChange:a=>t(a.target.value),className:de,style:{...Oe,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),xn.map(a=>React.createElement("option",{key:a,value:a,style:{color:"#111"}},a)))}function Et({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function An(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function Rn(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var wt="imbas_wb_email";function ka(){try{return localStorage.getItem(wt)||""}catch(e){return""}}function In(e){try{e?localStorage.setItem(wt,e):localStorage.removeItem(wt)}catch(t){}}var xa="imbas_reader_events",ia=500;function Ye(){try{let e=localStorage.getItem(xa),t=e?JSON.parse(e):[];return Array.isArray(t)?t:[]}catch(e){return[]}}function L(e,t={}){let a=jt(e,t);if(!a)return null;try{let s=Ye();s.push(a);let n=s.length>ia?s.slice(s.length-ia):s;localStorage.setItem(xa,JSON.stringify(n))}catch(s){}return a}function _t(e){var t,a,s;return((s=(a=(t=e==null?void 0:e.receipt)==null?void 0:t.open_run)==null?void 0:a.provenance)==null?void 0:s.request_id)||""}function Pn(){return Ye().some(e=>e&&e.name===A.RUN_COMPLETED)}var Ea="imbas_reader_clarity_dismissed";function On(){try{return localStorage.getItem(Ea)==="1"}catch(e){return!1}}function Dn(){try{localStorage.setItem(Ea,"1")}catch(e){}}function Ln({onFollow:e,onSkip:t}){let[a,s]=d(""),n=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(me,null,"Your email"),React.createElement("input",{type:"email",value:a,placeholder:"you@domain.com",onChange:r=>s(r.target.value),className:de,style:{...Oe,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"primary",disabled:!n,onClick:()=>e(a)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(C,{kind:"ghost",onClick:t},"Continue without email \u2192")))}function $n(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function Ca(e,t,a){let s=t.map(i=>({term:i,found:$n(e,i),isKey:a.includes(i)})),n=s.some(i=>i.found),r=s.some(i=>i.found&&i.isKey),o;n?r?o="key_found":o="partial":o="gap_held";let c={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[o];return{tokens:s,verdict:o,verdictLine:c}}function qn(e,t){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:t!=null&&t>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function Ct({title:e,children:t,className:a="",defaultOpen:s=!1}){let[n,r]=d(s);return React.createElement("div",{className:`wb-collapsible${n?" is-open":""}${a?` ${a}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>r(o=>!o),"aria-expanded":n},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},n?"Collapse":"Expand")),n?React.createElement("div",{className:"wb-collapsible__body"},t):null)}function Mn(e){if(!e.length)return[];let t=[...e].sort((s,n)=>s[0]-n[0]),a=[t[0]];for(let s=1;s<t.length;s++){let n=a[a.length-1];t[s][0]<=n[1]?n[1]=Math.max(n[1],t[s][1]):a.push(t[s])}return a}function Fn(e,t){let a=[];for(let s of t){let n=s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`(^|[^a-zA-Z0-9])(${n})($|[^a-zA-Z0-9])`,"gi"),o;for(;(o=r.exec(e||""))!==null;){let c=o.index+o[1].length;a.push([c,c+o[2].length])}}return Mn(a)}function ca(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function Un(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var la="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function Ta(e){let t=(e||"").trim().split(/\s+/).filter(Boolean);return t.length<20||t.some(a=>a.length>40)?la:""}function Bn(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),n=new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").exec(e||"");return n?n.index:-1}function Hn(e,t){let a=Ta(e);if(a)return a;let s=(e||"").trim();if(s.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let n=ca(s);return Un(t).some(r=>ca(r)===n)?"Paste the model's actual answer from your own chat.":""}function da({text:e,terms:t,litTerms:a}){let s=a||new Set(t.filter(i=>i.found).map(i=>i.term)),n=t.filter(i=>i.found&&s.has(i.term)).map(i=>i.term),r=Fn(e,n);if(!r.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:pe,fontSize:15,lineHeight:1.55,color:O.text}},e);let o=[],c=0;return r.forEach(([i,u],p)=>{c<i&&o.push(React.createElement("span",{key:`t-${p}`},e.slice(c,i))),o.push(React.createElement("span",{key:`h-${p}`,style:{color:O.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(i,u))),c=u}),c<e.length&&o.push(React.createElement("span",{key:"tail"},e.slice(c))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:pe,fontSize:15,lineHeight:1.55,color:O.text}},o)}var ua="/api/repository";function Wn(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function zn(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function gt(e){if(!ua)return{ok:!1};let t=document.getElementById("wb-hp"),a=t&&typeof t.value=="string"?t.value:"";try{let s=await fetch(ua,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:a})}),n=null;try{n=await s.json()}catch(r){}return!s.ok||n&&n.ok===!1?{ok:!1}:{ok:!0}}catch(s){return{ok:!1}}}function Sa({candidate:e}){let[t,a]=d(!1),s=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your candidate below and email it to brendan@imbaslabs.com"),React.createElement(Ct,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},s),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(C,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(s),a(!0),setTimeout(()=>a(!1),1800)}catch(r){}}},t?"Copied \u2713":"Copy candidate"))))}function Gn({candidate:e,submitOk:t}){return t?React.createElement(jn,{candidate:e}):React.createElement(Sa,{candidate:e})}function jn({candidate:e}){let[t,a]=d(!1),s=JSON.stringify(e,null,2);return React.createElement(Ct,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},s),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(C,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(s),a(!0),setTimeout(()=>a(!1),1800)}catch(r){}}},t?"Copied \u2713":"Copy candidate"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function Vn({caseId:e,caseTitle:t,model:a,anchors:s,runDate:n}){let[r,o]=d(!1),c=kn({caseId:e,caseTitle:t,model:a,verdict:s.verdict,runDate:n}),i="https://twitter.com/intent/tweet?text="+encodeURIComponent(c);return React.createElement(Ct,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},c),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(C,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(c),o(!0),setTimeout(()=>o(!1),1800)}catch(p){}}},r?"Copied \u2713":"Copy result"),React.createElement("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function Tt(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function We(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function Ae(e,t){if(typeof window=="undefined"||!e){t==null||t();return}We();let a=Tt(),s=document.documentElement,n=parseFloat(getComputedStyle(s).getPropertyValue("--header-offset"))||77,r=parseFloat(getComputedStyle(s).getPropertyValue("--scroll-anchor-gap"))||12,o=e.getBoundingClientRect().top+window.scrollY-n-r-6;window.scrollTo({top:Math.max(0,o),behavior:a?"auto":"smooth"}),t&&window.setTimeout(t,a?0:420)}function Yn(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}function Kn(){if(typeof window=="undefined")return!1;try{return new URLSearchParams(window.location.search).get("funnel")==="1"}catch(e){}return!1}var Qn="/api/read",Jn="/api/reader-perception";function Xn(e){let t=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:t.filter(a=>a.found).map(a=>a.term),missing:t.filter(a=>!a.found).map(a=>a.term)}}function Zn({mode:e,sel:t,question:a,answer:s,topic:n,model:r}){if(e==="guided"){let o=Ca((s||"").trim(),t.detect||[],t.keyDetect||[]);return{case:{topic:t.topic||t.title||"Guided case",anchor:t.mechanism||t.anchor||"",why_it_matters:t.whyItMatters||""},open_question:t.openPrompt,answer:(s||"").trim(),inspected_model:(r||"").trim(),textcheck:Xn(o)}}return{case:{topic:(n||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(a||"").trim(),answer:(s||"").trim(),inspected_model:(r||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function es(e){let t=await fetch(Qn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){if(t.status===400){let a=await t.json().catch(()=>({}));if(a&&a.error==="too_long")throw new Error("too_long")}throw new Error(`read_${t.status}`)}return t.json()}var Aa="/api/read-paired";async function ts(e,t){let a=await fetch(Aa,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:e,targeted_answer:t})}),s=await a.json().catch(()=>({}));if(!a.ok){let n=new Error(s&&s.error||`paired_${a.status}`);throw n.status=a.status,n.info=s||{},n}return s}async function pa(e){let t=new TextEncoder().encode(String(e)),a=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(a)).map(s=>s.toString(16).padStart(2,"0")).join("")}async function as(e,t){let a=await pa(e),s={receipt_type:"single",schema_version:Rt,generated_at:t,open_run:{question:"",answer:e,provenance:{request_id:a.slice(0,16)}},integrity:{content_hash:null}};return s.integrity.content_hash=await pa(It(s)),s}async function ns({firstAnswer:e,targetedAnswer:t,chipId:a,instructionVersion:s}){let n=await as(e,new Date().toISOString()),r=await fetch(Aa,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:n,targeted_answer:t,initiator:ue.USER_CHIP,chip_id:a,instruction_version:s})}),o=await r.json().catch(()=>({}));if(!r.ok){let c=new Error(o&&o.error||`chip_paired_${r.status}`);throw c.status=r.status,c.info=o||{},c}return o}var ht=800,ma=100,ss=80,_a=400,bt=700,yt=3,rs=1.08;function ha(e){return 180-Math.min(Math.max(e,0),yt)/yt*180}function Re(e,t,a,s){let n=s*Math.PI/180;return{x:e+a*Math.cos(n),y:t-a*Math.sin(n)}}function ba(e,t,a,s,n){let r=Re(e,t,a,s),o=Re(e,t,a,n),c=Math.abs(s-n)>180?1:0,i=s>n?1:0;return`M ${r.x} ${r.y} A ${a} ${a} 0 ${c} ${i} ${o.x} ${o.y}`}function os({needleValue:e,settled:t}){let r=ha(Math.min(e,yt)),o=Re(120,84,52,r),c=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${t?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:ba(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:ba(120,84,58,180,r),stroke:O.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:t?.76:.42}):null,c.map(i=>{let u=ha(i),p=Re(120,84,61,u),_=Re(120,84,50,u),m=Re(120,84,36,u);return React.createElement("g",{key:i},React.createElement("line",{x1:_.x,y1:_.y,x2:p.x,y2:p.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:m.x,y:m.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:j},i))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:o.x,y2:o.y,stroke:O.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:O.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:o.x,cy:o.y,r:"1.6",fill:O.accentSoft,opacity:t?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function is({answer:e,anchors:t,caseId:a,caseTitle:s,model:n,runDate:r,gap:o,category:c,observedDate:i,candidate:u,submitOk:p,sequenceReady:_=!0,onAnotherCase:m,onEmailFollow:h}){let l=Sn(a),b=o!=null?o:l==null?void 0:l.gap,N=c||(l==null?void 0:l.category),v=t.tokens,w=H(Tt()),[T,R]=d(!1),y=H(null),[I,F]=d(!1),[K,D]=d(()=>w.current&&b!=null?b:0),[P,M]=d(()=>w.current&&b!=null?b:0),[k,X]=d(w.current),[se,ee]=d(()=>w.current?new Set(v.filter(E=>E.found).map(E=>E.term)):new Set),[re,S]=d(!1),[f,W]=d(w.current?v.length:0),[we,oe]=d(w.current),[ge,ie]=d(!1),[ze,De]=d(w.current),[Ke,ye]=d(w.current&&v.some(E=>!E.found)),[At,ve]=d(w.current&&v.some(E=>E.isKey&&E.found)),g=v.some(E=>!E.found),Z=Na(e);V(()=>{var z;if(!y.current)return;let E=(z=y.current.closest(".wb-answer-row"))==null?void 0:z.querySelector(".wb-answer-row__bar");E&&E.style.setProperty("--sweep-travel",`${Math.max(E.offsetHeight-2,40)}px`)},[e,_]),V(()=>{if(!_||b==null)return;if(w.current){D(b),M(b),X(!0);return}D(0),M(0),X(!1);let E=performance.now(),z=0,he=be=>1-(1-be)**3,le=be=>{let Y=Math.min(1,(be-E)/ht);D(Math.round(he(Y)*b*10)/10);let B=b*rs;if(Y<.82){let Le=Y/.82;M(he(Le)*B)}else{let Le=(Y-.82)/.18;M(B+(b-B)*he(Le))}Y<1?z=requestAnimationFrame(le):(M(b),X(!0))};return z=requestAnimationFrame(le),()=>cancelAnimationFrame(z)},[_,b,a]),V(()=>{if(!_)return;if(w.current){ee(new Set(v.filter(B=>B.found).map(B=>B.term))),S(!1),W(v.length),oe(!0),ie(!0),De(!0),ye(g),ve(v.some(B=>B.isKey&&B.found));let Y=setTimeout(()=>ie(!1),50);return()=>clearTimeout(Y)}ee(new Set),S(!1),W(0),oe(!1),ie(!1),De(!1),ye(!1),ve(!1);let E=[],z=(Y,B)=>{E.push(setTimeout(Y,B))};v.forEach((Y,B)=>{z(()=>{W(B+1),Y.isKey&&Y.found&&ve(!0)},ht+B*ma)});let he=ht+v.length*ma;g&&z(()=>ye(!0),he+50);let le=he+ss;z(()=>{oe(!0),ie(!0)},le),z(()=>De(!0),le+_a),z(()=>ie(!1),le+720);let be=le+_a+120;return z(()=>S(!0),be),v.forEach(Y=>{if(!Y.found)return;let B=Bn(e,Y.term),Le=B>=0?B/Math.max(e.length,1)*bt:bt;z(()=>{ee(Ma=>new Set([...Ma,Y.term]))},be+Le)}),z(()=>S(!1),be+bt),()=>{E.forEach(clearTimeout)}},[v.length,a,e,_]);let ce=`wb-result-inner wb-output-module${ge?" is-verdict-pulse":""}${w.current?" is-reveal-instant":""}`,_e=l?va(l):null,U=qn(t.verdict,b);return React.createElement("div",{className:ce},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},_e?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},_e.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",_e.verified))):null),React.createElement("div",{className:"wb-output-module__body"},b!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${b.toFixed(1)} out of 3`},K.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${U.tone}${we?" is-visible":""}`},U.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(os,{needleValue:P,settled:k}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},N?React.createElement("span",null,N):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(me,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},v.map((E,z)=>{let le=`wb-token-chip${z<f?" is-visible":""}${E.found?" is-found":" is-missing"}`;return React.createElement("li",{key:E.term,className:le},E.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},E.term,E.isKey?" (key)":""," \xB7 ",E.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${I?" is-expanded":""}`},React.createElement("div",{ref:y,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement(da,{text:e,terms:t.tokens,litTerms:se})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${re?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>F(E=>!E),"aria-expanded":I},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",Z," words"),React.createElement("span",{className:`wb-answer-row__chevron${I?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${I?" is-open":""}`},React.createElement(da,{text:e,terms:t.tokens,litTerms:se})))),React.createElement("div",{className:"wb-result-footnote"},g?React.createElement("p",{className:`wb-result-discovery-beat${Ke?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),a==="006"&&we?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${ze?" is-visible":""}`},React.createElement(Vn,{caseId:a,caseTitle:s,model:n,anchors:t,runDate:r}),React.createElement(Gn,{candidate:u,submitOk:p})),ze&&!T&&!ka()?React.createElement(Ln,{onFollow:E=>{In(E),R(!0),h&&h(E)},onSkip:()=>R(!0)}):null,m?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:m},"Test another case \u21BA")):null)}function cs(){let[e,t]=d(Ie[0]),[a,s]=d(0),[n,r]=d(()=>ka()),[o,c]=d(""),[i,u]=d(""),[p,_]=d(!1),[m,h]=d(null),[l,b]=d(null),[N,v]=d(!1),[w,T]=d(""),[R,y]=d(!1),[I,F]=d("idle"),K=H(null),D=H(null),P=H(!1);V(()=>{if(!P.current){P.current=!0,We();return}if(a===2)return;let S=a===1?K.current:D.current,f=window.requestAnimationFrame(()=>Ae(S));return()=>window.cancelAnimationFrame(f)},[a]);let M=()=>{s(0),c(""),u(""),h(null),b(null),T(""),y(!1),_(!1)},k=S=>{if(!S.ready||S.id===e.id)return;let f=Tt(),W=()=>{t(S),M(),F("in"),window.setTimeout(()=>F("idle"),f?0:200)};if(f){W();return}F("out"),window.setTimeout(W,200)},X=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),v(!0),setTimeout(()=>v(!1),2e3)}catch(S){}},se=()=>{Ae(K.current,()=>y(!0))},ee=async()=>{let S=Hn(i,e);if(S){T(S);return}T(""),_(!0),y(!1);let f=Ca(i,e.detect,e.keyDetect),W=f.verdict!=="key_found",we=new Date().toISOString().slice(0,10),oe={answer:i,anchors:f,caseId:e.id,caseTitle:e.title,model:o,runDate:we,gap:e.gap,category:e.category,observedDate:e.observedDate},ge=Wn({mode:"curated",case_id:e.id,model:o,email:n,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:i,gap_held:W,detect_verdict:f.verdict}),ie=await gt(ge);h({...oe,submitOk:ie.ok}),b(ge),_(!1),s(2),window.requestAnimationFrame(se)},re=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",a===2?"is-result":"",I==="out"?"is-crossfade-out":"",I==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:D,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},Ie.map(S=>{let f=S.id===e.id;return React.createElement("button",{key:S.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${f?" is-active":""}${S.ready?"":" is-disabled"}`,onClick:()=>k(S),disabled:!S.ready},S.ready?React.createElement("div",{className:"wb-specimen-plate__label"},En(S)):React.createElement(me,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},S.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:K,className:re},a===2&&m?React.createElement(is,{...m,candidate:l,sequenceReady:R,onAnotherCase:M,onEmailFollow:S=>{r(S);let f={...l,email:S};b(f),gt(f)}}):a===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(oa,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(ne,{label:"Which AI did you ask?"},React.createElement(ft,{value:o,onChange:c}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(Pe,{label:"Paste the model's open answer",value:i,onChange:S=>{u(S),T("")},error:w,placeholder:"Paste the full response here\u2026",minAckLength:20})),w?React.createElement("div",{className:"wb-field-error"},w):null,React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"primary",disabled:p||!o||i.trim().length<200,onClick:ee},"Compare with what Imbas observed \u2192")),!p&&!w&&i.trim().length>0&&i.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(oa,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(me,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),a===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(me,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(Et,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:X,className:N?"is-copied":""},N?"Copied \u2713":"Copy question"),React.createElement(C,{kind:"primary",onClick:()=>s(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(Rn,null),React.createElement(An,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(Ra,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var vt={...Oe,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},fa={...vt,minHeight:"unset",resize:"vertical"};function Ra({variant:e="default"}){let[t,a]=d(!1),[s,n]=d("form"),[r,o]=d(""),[c,i]=d(""),[u,p]=d(""),[_,m]=d(""),[h,l]=d(!1),[b,N]=d(null),v=r.trim().length>=4,w=c.trim().length>=8,T=v&&w&&!h;async function R(){if(!T)return;l(!0),N(null);let y=zn({topic:r.trim(),inspect_question:c.trim(),context:u.trim()||null,email:_.trim()||null,source:"workbench_suggest"}),I=await gt(y);l(!1),I.ok?n("done"):N(y)}return s==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):t?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(ne,{label:"Topic or Question"},React.createElement("input",{className:de,type:"text",value:r,onChange:y=>o(y.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:vt}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ne,{label:"What should be inspected?"},React.createElement("textarea",{className:de,value:c,onChange:y=>i(y.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:fa}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ne,{label:"Optional context, source, or link"},React.createElement("textarea",{className:de,value:u,onChange:y=>p(y.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:fa}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ne,{label:"Optional email for follow-up"},React.createElement("input",{className:de,type:"email",value:_,onChange:y=>m(y.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:vt}))),b?React.createElement(Sa,{candidate:b}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"primary",disabled:!T,onClick:R},h?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:()=>a(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(C,{kind:"primary",onClick:()=>a(!0)},"Suggest an investigation \u2192"))))}var wa={idle:"Paste an answer to inspect it.",needQuestion:"Add the question you asked.",ready:"Let's see what might be missing\u2026",inspecting:"Reading the answer\u2026",result:"Inspection complete."},ga=["Reading the answer\u2026","Checking what might be missing\u2026","Found something to check\u2026"],ls={full:"FULL",partial:"PARTIAL",thin:"THIN"},Nt={full:"The answer substantially served the question.",partial:"Some material context was missing or shaped.",thin:"The answer was evasive or substantially incomplete."};function ds({state:e}){let[t,a]=d(0);V(()=>{if(e!=="inspecting"){a(0);return}let n=window.setInterval(()=>{a(r=>Math.min(r+1,ga.length-1))},1100);return()=>window.clearInterval(n)},[e]);let s=e==="inspecting"?ga[t]:wa[e]||wa.idle;return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},s))}function Ia(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let a=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return a?a[1]:""}function us(e){let t=Ia(e).toLowerCase();return t==="ceiling"?"Reader limit reached \u2014 showing fallback check.":["no_key","disabled","api_error","network","bad_json","timeout"].includes(t)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function kt(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function Pa({mode:e,sel:t,result:a}){return(a==null?void 0:a.source)==="fallback"?"Fallback check":(a==null?void 0:a.source)!=="agent"?"Reader":e==="guided"&&(t!=null&&t.id)?`Reader agent \xB7 Case ${t.id}`:"Reader agent \xB7 Custom answer"}function Oa(e){let t=(e==null?void 0:e.completeness)||"partial",a=t.toUpperCase(),s=Nt[t]||Nt.partial,n=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],r=((e==null?void 0:e.how_it_was_shaped)||"").trim(),o=((e==null?void 0:e.inspection_note)||"").trim(),c=[`Completeness: ${a}`,s,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...n.length?n.map(i=>`- ${i}`):["- (none identified)"],"","HOW IT WAS SHAPED",r||"(none detected)"];return o&&c.push("","INSPECTION NOTE",o),c.join(`
`).trim()}function ps({mode:e,sel:t,question:a,answer:s,model:n,topic:r,result:o}){let c=e==="guided"?t==null?void 0:t.openPrompt:a,i=(r||"").trim()||(e==="guided"?((t==null?void 0:t.topic)||"").trim():""),u=[];return(o==null?void 0:o.source)==="agent"&&u.push("Inspection receipt",Pa({mode:e,sel:t,result:o}),""),u.push(`Question: ${(c||"").trim()}`),i&&u.push(`Topic / context: ${i}`),(n||"").trim()&&u.push(`AI used: ${n.trim()}`),u.push("","Answer",(s||"").trim()),o&&u.push("",Oa(o)),u.push("","Behavior, not intent."),u.join(`
`).trim()}var xt=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`;function ms({state:e,firstText:t,secondText:a,smallPrint:s}){let n=fe[e]||{},r={label:Ge,text:(t||"").trim()},o={label:je,text:(a||"").trim()},c=n.swapPanels?[o,r]:[r,o],i=["IMBAS READER \u2014 Confirmation Loop",""];n.headline&&i.push(n.headline,"");for(let u of c)i.push(`${u.label}:`,u.text||Ue,"");return n.tag&&i.push(n.tag,""),(s||"").trim()&&i.push(`[${s.trim()}]`,""),i.push(Q,"",xt()),i.join(`
`).trim()}var ya={single:{title:"Share this inspection",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to \xB7 the unvalidated estimate (\u201CCandidate gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show your full answer \u2014 only the short excerpts above."]},paired:{title:"Share this two-question test",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the delta \u2014 what the second answer surfaced that the first did not \u2014 each with the short quoted excerpts from both answers \xB7 the unvalidated estimate (\u201CMachine gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show either full answer \u2014 only the short excerpts above."]}};function _s(e,t){let a=t==null?void 0:t.error;return e===429?a==="daily_capacity"?"The Reader is at capacity for new shares today. Copy the full receipt for now.":"You've created several share links in a row. Please wait a moment and try again.":e===503||e===500||a==="unconfigured"?"Share links are not live yet. Copy the full receipt for now.":"Could not create share link. Copy the full receipt for now."}function hs({mode:e,busy:t,error:a,onConfirm:s,onCancel:n}){let r=ya[e]||ya.single,o=H(null),c=`wb-share-consent-title--${e}`,i=`wb-share-consent-desc--${e}`,u=r.lines.map((p,_)=>`${i}-${_}`).join(" ");return V(()=>{o.current&&o.current.focus()},[]),V(()=>{let p=_=>{if(_.key==="Escape"){t||n();return}if(_.key!=="Tab")return;let m=o.current;if(!m)return;let h=Array.prototype.slice.call(m.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));if(h.length===0){_.preventDefault(),m.focus();return}let l=h[0],b=h[h.length-1],N=document.activeElement,v=m.contains(N);_.shiftKey?(!v||N===l||N===m)&&(_.preventDefault(),b.focus()):(!v||N===b||N===m)&&(_.preventDefault(),l.focus())};return document.addEventListener("keydown",p),()=>document.removeEventListener("keydown",p)},[t,n]),React.createElement("div",{className:"wb-share-consent",role:"presentation",onClick:t?void 0:n},React.createElement("div",{ref:o,tabIndex:-1,className:"wb-share-consent__panel wb-focus",role:"dialog","aria-modal":"true","aria-labelledby":c,"aria-describedby":u,onClick:p=>p.stopPropagation()},React.createElement("h3",{id:c,className:"wb-share-consent__title"},r.title),r.lines.map((p,_)=>React.createElement("p",{key:_,id:`${i}-${_}`,className:"wb-share-consent__line"},p)),a?React.createElement("p",{className:"wb-share-consent__error",role:"alert"},a):null,React.createElement("div",{className:"wb-share-consent__actions"},React.createElement(C,{kind:"ghost",small:!0,className:"wb-share-consent__confirm",onClick:s,disabled:t},t?"Creating share link\u2026":"Create share link"),React.createElement(C,{kind:"ghost",small:!0,onClick:n,disabled:t},"Cancel"))))}function Da({mode:e,receipt:t,onShared:a}){let[s,n]=d("idle"),[r,o]=d(""),[c,i]=d(""),u=H(null);if(!t)return null;let p=e==="paired"?"Share this two-question test":"Share this inspection",_=s==="consenting"||s==="creating",m=()=>{let w=u.current&&u.current.querySelector(".wb-reader-share__btn");w&&w.focus()};return React.createElement("div",{className:"wb-reader-share",ref:u},r&&(s==="ready"||s==="copied")?React.createElement("div",{className:"wb-reader-share__success",role:"status"},React.createElement("p",{className:"wb-reader-share__success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-share__url"},React.createElement("a",{href:r,target:"_blank",rel:"noopener noreferrer"},r)),React.createElement("div",{className:"wb-reader-share__actions"},React.createElement("a",{href:r,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-share__open"},"Open share page"),React.createElement(C,{kind:"ghost",small:!0,className:s==="copied"?"is-copied":"",onClick:async()=>{if(r)try{await navigator.clipboard.writeText(r),n("copied"),setTimeout(()=>n("ready"),1600)}catch(w){i("Could not copy link. Select the link below and copy manually.")}}},s==="copied"?"Copied":"Copy share link"))):React.createElement(C,{kind:"ghost",small:!0,className:"wb-reader-share__btn",onClick:()=>{i(""),n("consenting")}},p),_?React.createElement(hs,{mode:e,busy:s==="creating",error:c,onConfirm:async()=>{n("creating"),i("");try{let w=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:t})}),T=await w.json().catch(()=>({}));if(!w.ok||!T.ok||!T.share_url){console.warn("[imbas] inspection-share failed",w.status,T&&T.error),i(_s(w.status,T)),n("consenting");return}typeof a=="function"&&a(T.share_url),o(T.share_url),n("ready");try{await navigator.clipboard.writeText(T.share_url),n("copied"),setTimeout(()=>n("ready"),1600)}catch(R){}}catch(w){console.warn("[imbas] inspection-share network error",w),i("Could not create share link. Copy the full receipt for now."),n("consenting")}},onCancel:()=>{s!=="creating"&&(i(""),n("idle"),m())}}):null)}function bs({result:e,context:t,shareUrl:a}){let[s,n]=d(!1),[r,o]=d(!1),[c,i]=d(""),u=m=>{m(!0),i(""),setTimeout(()=>m(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(C,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Oa(e)}

${xt(a)}`),u(n)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},s?"Copied":"Copy Result"),React.createElement(C,{kind:"ghost",small:!0,className:r?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${ps({...t,result:e})}

${xt(a)}`),u(o)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},r?"Copied":"Copy Full Receipt"),c?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},c):null)}function fs({result:e,context:t,onRunAgain:a}){let[s,n]=d(""),r=(e==null?void 0:e.completeness)||"partial",o=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],c=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=((e==null?void 0:e.inspection_note)||"").trim(),u=(e==null?void 0:e.source)==="fallback",p=(e==null?void 0:e.source)==="agent",_=Pa({mode:t.mode,sel:t.sel,result:e}),m=u?[kt()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${r}${u?" is-fallback":""}${p?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},p?React.createElement("div",{className:`wb-reader-result__status is-${r}`},React.createElement("div",{className:`wb-reader-result__badge is-${r}`},ls[r]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},Nt[r])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),p?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},_)):null,u?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},us(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},u?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},m.length?m.map((h,l)=>React.createElement("p",{key:l},h)):React.createElement("p",null,u?kt():"No read returned."))),u?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What may be missing"),o.length?React.createElement("ul",{className:"wb-reader-result__list"},o.map((h,l)=>React.createElement("li",{key:l},h))):React.createElement("p",{className:"wb-reader-result__empty"},"No major gaps flagged in this answer.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},c||"No meaningful shaping detected."))),i?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},i)):null,!u&&p?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),a?React.createElement("div",{className:`wb-reader-result__footer${u?" is-fallback":""}`},p?React.createElement(React.Fragment,null,React.createElement(bs,{result:e,context:t,shareUrl:s}),React.createElement(Da,{mode:"single",receipt:e.receipt,onShared:n})):null,React.createElement(C,{kind:"ghost",small:!0,onClick:a,className:"wb-reader-result__rerun"},"Run again")):null)}var ws={"candidate missing item":"Candidate missing item","candidate framing issue":"Candidate framing issue","candidate deflection":"Candidate deflection"};function St({receipt:e,formatter:t=Ot,filePrefix:a="imbas-reader-receipt",onExport:s}){let[n,r]=d(!1),[o,c]=d(!1),[i,u]=d("");if(!e)return null;let p=l=>{l(!0),u(""),setTimeout(()=>l(!1),1800)},_=l=>{u(l),setTimeout(()=>u(""),2200)};return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions"},React.createElement(C,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2)),p(r),s&&s("json")}catch(l){_("Could not copy")}}},n?"Copied":"Copy JSON"),React.createElement(C,{kind:"ghost",small:!0,className:o?"is-copied":"",onClick:()=>{try{let l=t(e),b=new Blob([l],{type:"text/plain;charset=utf-8"}),N=URL.createObjectURL(b),v=document.createElement("a"),w=(e.generated_at||"").replace(/[:.]/g,"-");v.href=N,v.download=`${a}-${w||"run"}.txt`,document.body.appendChild(v),v.click(),v.remove(),setTimeout(()=>URL.revokeObjectURL(N),0),p(c),s&&s("receipt")}catch(l){_("Could not download receipt")}}},o?"Downloaded":"Download receipt"),i?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},i):null)}function gs({state:e,firstText:t,secondText:a,smallPrint:s,run:n,check:r}){let[o,c]=d(!1),[i,u]=d(!1),[p,_]=d(""),m=w=>{w(!0),_(""),setTimeout(()=>w(!1),1800)},h=w=>{_(w),setTimeout(()=>_(""),2200)},l=()=>ms({state:e,firstText:t,secondText:a,smallPrint:s}),b=()=>L(A.CARD_EXPORTED,{run:n,state:e,check:r});return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions wb-card-export"},React.createElement("span",{className:"wb-card-export__label"},"Share what you saw"),React.createElement(C,{kind:"ghost",small:!0,className:o?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(l()),b(),m(c)}catch(w){h("Could not copy")}}},o?"Copied":"Copy card"),React.createElement(C,{kind:"ghost",small:!0,className:i?"is-copied":"",onClick:()=>{try{let w=new Blob([l()],{type:"text/plain;charset=utf-8"}),T=URL.createObjectURL(w),R=document.createElement("a");R.href=T,R.download=`imbas-inspection-card-${n||"run"}.txt`,document.body.appendChild(R),R.click(),R.remove(),setTimeout(()=>URL.revokeObjectURL(T),0),b(),m(u)}catch(w){h("Could not download card")}}},i?"Downloaded":"Download card"),p?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},p):null)}function ys(e){let t=e&&e.finding_counts||{},a=t["candidate missing item"]||0,s=t["candidate framing issue"]||0,n=t["candidate deflection"]||0,r=[];return a&&r.push(`${a} candidate missing item${a===1?"":"s"}`),s&&r.push(`${s} candidate framing issue${s===1?"":"s"}`),n&&r.push(`${n} candidate deflection${n===1?"":"s"}`),r.length?`Reader found ${r.join(", ")}.`:"Reader found no candidate gaps in this answer. It read clean."}async function vs(e,t,a,s){for(let n=0;n<2;n++){if(s.current!==a)return;try{let r=await fetch(Jn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:e,value:t})});if(r.ok||r.status<500||n===1)return}catch(r){if(n===1)return}}}function La({mode:e,receipt:t}){let a=Jt(e),[s,n]=d(null),r=H(0);if(!a||!t)return null;let o=c=>{if(!Xt(e,c))return;n(c);let i=++r.current;vs(t,c,i,r)};return React.createElement("div",{className:"wb-perception wb-scroll-anchor"},React.createElement("p",{className:"wb-perception__prompt"},a.prompt),React.createElement("div",{className:"wb-perception__options",role:"group","aria-label":a.prompt},a.options.map(c=>{let i=s===c.value;return React.createElement("button",{key:c.id,type:"button",className:`wb-focus wb-perception__option${i?" is-selected":""}`,"aria-pressed":i,onClick:()=>o(c.value)},c.label)})))}function Ns({result:e}){let t=e==null?void 0:e.measurement;if(!t)return null;let a=(t.estimate_rationale||"").trim();return React.createElement("section",{className:"wb-reader-result is-agent wb-result-hero wb-scroll-anchor","aria-labelledby":"wb-result-hero-estimate"},React.createElement("p",{className:"wb-result-hero__eyebrow"},"Inspection result"),React.createElement("p",{id:"wb-result-hero-estimate",className:"wb-result-hero__estimate"},Je(t.gap_estimate)),React.createElement("p",{className:"wb-result-hero__summary"},ys(t)),a?React.createElement("p",{className:"wb-result-hero__why"},a):null)}function ks({result:e,context:t}){var u,p,_;let a=e==null?void 0:e.measurement;if(!a)return null;let s=(e==null?void 0:e.receipt)||null,n=Array.isArray(a.findings)?a.findings:[],r=a.finding_counts||{},o=((t==null?void 0:t.model)||"").trim()||(((u=s==null?void 0:s.open_run)==null?void 0:u.declared_model)||"").trim(),c=(s==null?void 0:s.generated_at)||((_=(p=s==null?void 0:s.open_run)==null?void 0:p.provenance)==null?void 0:_.run_timestamp)||"",i=[o?`Model: ${o}`:"Model: (not declared)"];return c&&i.push(c),React.createElement("section",{className:"wb-reader-result is-agent wb-measure wb-scroll-anchor","aria-labelledby":"wb-measure-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-measure-heading",className:"wb-reader-result__title"},"MEASUREMENT")),React.createElement("p",{className:"wb-reader-result__provenance wb-measure__meta"},i.join(" \xB7 ")),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-measure__findings"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Candidate findings"),React.createElement("p",{className:"wb-measure__counts"},`Missing item: ${r["candidate missing item"]||0} \xB7 Framing issue: ${r["candidate framing issue"]||0} \xB7 Deflection: ${r["candidate deflection"]||0}`),n.length?React.createElement("ul",{className:"wb-measure__list"},n.map((m,h)=>React.createElement("li",{key:h,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},ws[m.type]||m.type),(m.materiality||"").trim()?React.createElement("span",{className:"wb-measure__finding-why"},m.materiality.trim()):null,(m.anchor||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor"},`"${m.anchor.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No candidate findings \u2014 the answer read clean."))),React.createElement("p",{className:"wb-measure__unvalidated"},"These are candidate observations from a single answer \u2014 inspection hypotheses, not validated classifications or evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},Q),React.createElement(St,{receipt:s}))}var xs=[{key:"Omission",cls:"is-omission"},{key:"Framing Drift",cls:"is-framing"},{key:"Deflection",cls:"is-deflection"}];function Es({counts:e}){let t=e||{},a=xs.map(n=>({...n,n:Number(t[n.key])||0}));return a.reduce((n,r)=>n+r.n,0)<=0?null:React.createElement("div",{className:"wb-xray","aria-hidden":"true"},a.filter(n=>n.n>0).map(n=>React.createElement("span",{key:n.key,className:`wb-xray__seg ${n.cls}`,style:{flexGrow:n.n}})))}function Cs({paired:e,pair:t,openReceipt:a,onReset:s,run:n,check:r,onTryCleaner:o}){let c=Array.isArray(e.delta_items)?e.delta_items:[],i=e.signal_counts||{},u=t&&t.capture,p=Be(u),_=Mt({gap_estimate:e.gap_estimate,signal_counts:i}),[m,h]=d(_);V(()=>{L(A.LOOP_COMPLETED,{run:n,state:_,check:r,gap:e.gap_estimate,source:e.source,idempotent:e.idempotent})},[]);let l=P=>{P!==m&&(L(A.STATE_CORRECTED,{run:n,from_state:m,to_state:P,check:r}),h(P))},b=fe[m]||{},N=c[0]||{},v=(N.open_side||"").trim()||Ue,w=(N.targeted_side||"").trim()||Ue,T=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first",key:"first"},React.createElement("span",{className:"wb-loop__panel-label"},Ge),React.createElement("p",{className:"wb-loop__panel-body"},v)),R=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second",key:"second"},React.createElement("span",{className:"wb-loop__panel-label"},je),React.createElement("p",{className:"wb-loop__panel-body"},w)),y=b.swapPanels?[R,T]:[T,R],I=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||n||"",F=e.receipt&&e.receipt.generated_at||"",K=F?String(F).slice(0,10):"",D=[I?`Run ${I}`:"",K,Ft].filter(Boolean).join(" \xB7 ");return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},"You already ran this pair. This is the analysis from that run."):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},"The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},b.headline),React.createElement("div",{className:"wb-loop__panels"},y),p?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},$.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},$.unmatched_warning)):null,b.tag?React.createElement("p",{className:"wb-loop__tag"},b.tag):null,m===Me&&b.cta?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:s},b.cta)):null,m===Fe&&b.cta&&r===Ne&&o?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:o},b.cta)):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},"Read it differently?"),Ze.map(P=>React.createElement("button",{key:P,type:"button",className:`wb-loop__chip${P===m?" is-active":""}`,"aria-pressed":P===m,onClick:()=>l(P)},(fe[P]||{}).chip||P))),React.createElement("p",{className:"wb-loop__smallprint"},D),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},Q)),React.createElement("div",{className:"wb-measure__estimate wb-act2__estimate"},React.createElement("div",{className:"wb-measure__estimate-value"},e.gap_estimate_label),(e.estimate_rationale||"").trim()?React.createElement("p",{className:"wb-measure__estimate-why"},e.estimate_rationale.trim()):null),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"The delta"),React.createElement(Es,{counts:i}),React.createElement("p",{className:"wb-measure__counts"},`Omission: ${i.Omission||0} \xB7 Framing Drift: ${i["Framing Drift"]||0} \xB7 Deflection: ${i.Deflection||0}`),c.length?React.createElement("ol",{className:"wb-measure__list"},c.map((P,M)=>React.createElement("li",{key:M,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},P.signal_pattern),React.createElement("p",{className:"wb-measure__finding-why"},P.point),(P.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},"First answer"),`"${P.open_side.trim()}"`):null,(P.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},"Second answer"),`"${P.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No material gap. The direct question surfaced nothing decision-relevant the first answer left out."))),React.createElement(qa,{pairRuns:[t],findings:c,conditionsMatched:u?u.conditions_matched:void 0}),React.createElement("p",{className:"wb-measure__unvalidated"},"This is a machine estimate over one answer pair. Not a human-scored result, not evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},Q),React.createElement(gs,{state:m,firstText:v,secondText:w,smallPrint:D,run:I,check:r}),React.createElement(St,{receipt:e.receipt,formatter:Dt,filePrefix:"imbas-reader-paired-receipt"}),React.createElement($a,{result:{receipt:a},statuses:{},pair:t}),React.createElement(Da,{mode:"paired",receipt:e.receipt}),React.createElement(La,{mode:"paired",receipt:e.receipt}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:s},"Test another answer")))}function Ts(e){let t=e&&e.info&&typeof e.info.message=="string"?e.info.message.trim():"";return t||"The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly."}function Ss({openReceipt:e,run:t,check:a,onTryCleaner:s}){let[n,r]=d(""),[o,c]=d(!1),[i,u]=d(null),[p,_]=d(""),[m,h]=d(""),[l,b]=d(null),[N,v]=d(""),[w,T]=d(null);if(!e)return null;let R=!!n.trim(),y=at({same_model:l,model_version:N,edits:w}),I=e&&e.open_run||{},F=I.provenance&&I.provenance.reader_model_version||"",K={targeted_answer:n,targeted_prompt:i&&i.targeted_prompt||$e,targeted_prompt_hash:i&&i.receipt&&i.receipt.paired_analysis&&i.receipt.paired_analysis.targeted_prompt_hash||"",capture:y,targeted_source_model:{name:l===J.YES&&I.declared_model||"",version:N.trim()},inspector:{model:F,model_version:F,prompt_version:"1.1"}},D=k=>{r(k),p&&_(""),m&&h("")},P=()=>{u(null),r(""),_(""),h(""),b(null),v(""),T(null)},M=async()=>{if(!o){if(!R){_("Paste the answer your AI gave the direct question.");return}_(""),h(""),c(!0),L(A.LOOP_RETURNED,{run:t,check:a});try{let k=await ts(e,n);u(k)}catch(k){let X=k&&k.info||{};k&&k.status===400&&X.error==="too_long"?_("Answer is over 1200 words. Trim it and re-run."):k&&k.status===400&&X.error==="empty"?_("That's too short to compare. Paste the full answer."):k&&k.status===400?h("This inspection can't run the two-question test. Re-run the answer above, then try again."):h(Ts(k))}finally{c(!1)}}};return i?React.createElement("div",{className:"wb-act2__test"},React.createElement(Cs,{paired:i,pair:K,openReceipt:e,onReset:P,run:t,check:a,onTryCleaner:s})):React.createElement("div",{className:"wb-act2__test"},React.createElement(Pe,{label:"Answer to the direct question",value:n,onChange:D,error:p,placeholder:"Paste what your AI came back with\u2026",minAckLength:1}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},$.heading),React.createElement("p",{className:"wb-act2__capture-intro"},$.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[J.YES,J.NO,J.NOT_SURE].map(k=>React.createElement("button",{key:k,type:"button",className:`wb-act2__capture-opt${l===k?" is-active":""}`,"aria-pressed":l===k,onClick:()=>b(k)},$.same_model.options[k])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-pair-model"},$.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},$.model_version.hint),React.createElement("input",{id:"wb-pair-model",type:"text",className:"wb-act2__capture-input",value:N,maxLength:80,placeholder:$.model_version.placeholder,onChange:k=>v(k.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[te.NONE,te.EDITED].map(k=>React.createElement("button",{key:k,type:"button",className:`wb-act2__capture-opt${w===k?" is-active":""}`,"aria-pressed":w===k,onClick:()=>T(k)},$.edits.options[k])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},$.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(C,{kind:"primary",disabled:o||!R,onClick:M,className:`wb-reader-cta${R&&!o?" is-armed":""}${o?" is-inspecting":""}`},o?"Comparing\u2026":"Compare the two answers")),m?React.createElement("p",{className:"wb-act2__run-error",role:"status"},m):null)}function As({card:e,run:t,status:a,onStatus:s}){var m,h;let[n,r]=d(!1),[o,c]=d(""),i=H(!1),u=ae.labels,p=async()=>{try{await navigator.clipboard.writeText(e.verification_question||""),r(!0),c(""),L(A.TARGET_QUESTION_COPIED,{run:t,check:e.finding_type}),setTimeout(()=>r(!1),1800)}catch(l){c("Could not copy"),setTimeout(()=>c(""),2200)}},_=l=>{l!==a&&(s(e.id,l),l==="resolved"&&!i.current&&(i.current=!0,L(A.LOOP_COMPLETED,{run:t,check:e.finding_type,state:"resolved"})))};return React.createElement("li",{className:`wb-check wb-check--${a}`},React.createElement("div",{className:"wb-check__head"},React.createElement("span",{className:"wb-check__family"},e.family),React.createElement("span",{className:"wb-check__detector"},e.detector_id),React.createElement("span",{className:"wb-check__finding"},e.finding_label),React.createElement("span",{className:"wb-check__provisional"},e.provisional_label)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},u.proposition),React.createElement("blockquote",{className:"wb-check__quote"},(m=e.proposition)==null?void 0:m.text)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},u.dependent),React.createElement("blockquote",{className:"wb-check__quote"},(h=e.dependent_output)==null?void 0:h.text)),React.createElement("p",{className:"wb-check__dependency"},React.createElement("span",{className:"wb-check__label"},u.dependency)," ",e.dependency_statement),React.createElement("div",{className:"wb-check__verify"},React.createElement("span",{className:"wb-check__label"},u.verification),React.createElement("p",{className:"wb-check__question"},e.verification_question),React.createElement("div",{className:"wb-check__actions"},React.createElement(C,{kind:"primary",small:!0,className:n?"is-copied":"",onClick:p},n?ae.copied_affordance:ae.copy_affordance),React.createElement("span",{className:"wb-check__resolver"},e.resolver_label),o?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},o):null)),React.createElement("div",{className:"wb-check__status",role:"group","aria-label":"Status"},React.createElement("span",{className:"wb-check__label"},u.status),["open","resolved","dismissed"].map(l=>React.createElement("button",{key:l,type:"button",className:`wb-check__status-opt${a===l?" is-active":""}`,"aria-pressed":a===l,onClick:()=>_(l)},ae.status_labels[l]))))}function Rs({result:e}){var _,m,h;let t=e==null?void 0:e.checks,a=((h=(m=(_=e==null?void 0:e.receipt)==null?void 0:_.open_run)==null?void 0:m.provenance)==null?void 0:h.request_id)||"",[s,n]=d(!1),[r,o]=d({}),c=(l,b)=>o(N=>N[l]===b?N:{...N,[l]:b});if(!t||!Array.isArray(t.cards)||t.cards.length===0)return null;let i=t.default_top_n||3,u=t.cards.length>i,p=s?t.cards:t.cards.slice(0,i);return React.createElement("section",{className:"wb-reader-result is-agent wb-checks wb-scroll-anchor","aria-labelledby":"wb-checks-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-checks-heading",className:"wb-reader-result__title"},ae.register_heading)),React.createElement("p",{className:"wb-checks__note"},ae.register_note),u&&!s?React.createElement("p",{className:"wb-checks__eyebrow"},ae.top_label):null,React.createElement("ul",{className:"wb-checks__list"},p.map(l=>React.createElement(As,{key:l.id,card:l,run:a,status:r[l.id]||l.status||"open",onStatus:c}))),u?React.createElement("button",{type:"button",className:"wb-checks__more wb-focus",onClick:()=>n(l=>!l)},s?ae.collapse_label:`${ae.expand_label} (${t.cards.length})`):null,React.createElement($a,{result:e,statuses:r}),React.createElement("p",{className:"wb-reader-result__trust wb-checks__boundary"},Q))}function $a({result:e,statuses:t,pair:a=null}){let[s,n]=d(!1),[r,o]=d(""),c=H(!1);return React.createElement("div",{className:"wb-checks__export"},React.createElement(C,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{if(!c.current){c.current=!0;try{let u=await aa({result:e,checkStates:t,createdAt:new Date().toISOString(),pair:a}),p=new Blob([JSON.stringify(u,null,2)],{type:"application/json;charset=utf-8"}),_=URL.createObjectURL(p),m=document.createElement("a");m.href=_,m.download=na(u),document.body.appendChild(m),m.click(),m.remove(),setTimeout(()=>URL.revokeObjectURL(_),0),o(""),n(!0),setTimeout(()=>n(!1),1800)}catch(u){o(He.download_error),setTimeout(()=>o(""),2200)}finally{c.current=!1}}}},s?He.downloaded_label:He.action_label),React.createElement("span",{className:"wb-checks__export-hint"},He.action_hint),r?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},r):null)}function qa({pairRuns:e=[],findings:t=[],conditionsMatched:a}){let{state_id:s,copy:n}=ra({pairRuns:e,findings:t,conditionsMatched:a});return React.createElement("section",{className:"wb-explain","data-state":s,"aria-label":n.heading},React.createElement("h3",{className:"wb-explain__heading"},n.heading),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},n.section_labels.what),React.createElement("p",{className:"wb-explain__body"},n.what)),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},n.section_labels.why),n.why.map((r,o)=>React.createElement("p",{key:o,className:"wb-explain__body"},r))),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},n.section_labels.next),React.createElement("p",{className:"wb-explain__body"},n.next)),React.createElement("p",{className:"wb-explain__boundary"},n.archive_boundary),React.createElement("p",{className:"wb-explain__method"},React.createElement("a",{className:"wb-explain__method-link",href:n.method_link.href},n.method_link.label," \u2192")))}function Is({result:e}){var m,h,l,b,N;let t=e==null?void 0:e.act2,a=((l=(h=(m=e==null?void 0:e.receipt)==null?void 0:m.open_run)==null?void 0:h.provenance)==null?void 0:l.request_id)||"",s=((N=(b=e==null?void 0:e.receipt)==null?void 0:b.open_run)==null?void 0:N.question)||"",[n,r]=d(!1),[o,c]=d(""),[i,u]=d(Ne);if(V(()=>{!t||!t.eligible||(L(A.FOLLOW_UP_REVEALED,{run:a}),t.available||L(A.CAPACITY_DEGRADATION,{run:a,reason:t.degraded_reason||"spend_ceiling"}))},[a]),!t||!t.eligible)return null;let p=i===ke?Bt({question:s}):t.targeted_prompt||$e,_=async()=>{try{await navigator.clipboard.writeText(p),r(!0),c(""),L(A.TARGET_QUESTION_COPIED,{run:a,check:i}),setTimeout(()=>r(!1),1800)}catch(v){c("Could not copy"),setTimeout(()=>c(""),2200)}};return React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-scroll-anchor","aria-labelledby":"wb-act2-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-act2-heading",className:"wb-reader-result__title"},"THE TWO-QUESTION TEST")),React.createElement("p",{className:"wb-act2__offer"},$t),React.createElement("div",{className:"wb-act2__check",role:"group","aria-label":"How you'll run the second answer"},React.createElement("p",{className:"wb-act2__check-copy"},Ut),React.createElement("div",{className:"wb-act2__check-opts"},React.createElement("button",{type:"button",className:`wb-act2__check-opt${i===Ne?" is-active":""}`,"aria-pressed":i===Ne,onClick:()=>u(Ne)},React.createElement("span",{className:"wb-act2__check-label"},et.label),React.createElement("span",{className:"wb-act2__check-hint"},et.hint)),React.createElement("button",{type:"button",className:`wb-act2__check-opt${i===ke?" is-active":""}`,"aria-pressed":i===ke,onClick:()=>u(ke)},React.createElement("span",{className:"wb-act2__check-label"},tt.label),React.createElement("span",{className:"wb-act2__check-hint"},tt.hint)))),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"What to run on your AI"},p),React.createElement("p",{className:"wb-act2__prompt-note"},"Generated from this Reader run. Any question shapes an answer \u2014 this one included."),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(C,{kind:"primary",className:n?"is-copied":"",onClick:_},n?"Copied \u2014 now ask your AI":"Ask your AI \u2192"),o?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},o):null),React.createElement("p",{className:"wb-act2__sub"},"Copy this question. Drop it in your chat. Paste what comes back."),t.available?React.createElement(Ss,{key:i,openReceipt:e.receipt,run:a,check:i,onTryCleaner:()=>u(ke)}):React.createElement("p",{className:"wb-act2__degraded",role:"status"},qt))}function Ps({chip:e,entry:t,capture:a,onReset:s}){let n=Array.isArray(e.delta_items)?e.delta_items:[],r=Be(a),o=a.conditions_matched===!0?"matched":a.conditions_matched===!1?"unmatched":"unverified",c=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||"",i=zt({delta_count:e.delta_count,conditions_matched:a.conditions_matched}),[u,p]=d(i);V(()=>{L(A.CHIP_PAIR_COMPLETED,{run:c,chip:t?t.id:"",instruction_version:t?t.instruction_version:"",state:i,conditions:o,source:e.source,idempotent:e.idempotent})},[]);let _=h=>{h!==u&&(L(A.STATE_CORRECTED,{run:c,from_state:u,to_state:h}),p(h))},m=ot[u]||{};return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},x.reveal.idempotent_notice):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},x.reveal.capture_uncertain_notice):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},m.headline),t?React.createElement("p",{className:"wb-chip__reason"},x.side_by_side.reason_prefix,t.approved_ui_label):null,React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first"},React.createElement("span",{className:"wb-loop__panel-label"},x.side_by_side.first_answer_caption)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},x.side_by_side.second_answer_caption))),r?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},$.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},$.unmatched_warning)):null,m.note?React.createElement("p",{className:"wb-loop__tag"},m.note):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},x.reveal.correct_label),Wt.map(h=>React.createElement("button",{key:h,type:"button",className:`wb-loop__chip${h===u?" is-active":""}`,"aria-pressed":h===u,onClick:()=>_(h)},(ot[h]||{}).chip||h)))),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},x.reveal.delta_heading),n.length?React.createElement("ol",{className:"wb-measure__list"},n.map((h,l)=>React.createElement("li",{key:l,className:"wb-measure__finding"},React.createElement("p",{className:"wb-measure__finding-why"},h.point),(h.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},x.reveal.first_side_label),`"${h.open_side.trim()}"`):null,(h.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},x.reveal.second_side_label),`"${h.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},x.reveal.empty_delta))),React.createElement("p",{className:"wb-chip__meaning"},x.meaning_panel_line),React.createElement("div",{className:"wb-reader-result__trust wb-chip__boundary",role:"note"},React.createElement("p",{className:"wb-chip__boundary-lock"},Q),React.createElement("p",{className:"wb-chip__boundary-attr"},x.boundary)),React.createElement("div",{className:"wb-chip__pro-cue"},React.createElement("span",{className:"wb-chip__pro-line"},x.professional_cue.line),React.createElement("span",{className:"wb-chip__pro-link"},x.professional_cue.link)),React.createElement(St,{receipt:e.receipt,formatter:Lt,filePrefix:"imbas-reader-followup-receipt",onExport:()=>L(A.CARD_EXPORTED,{run:c,chip:t?t.id:"",instruction_version:t?t.instruction_version:""})}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:s},x.reveal.reset_label)))}function Os(){let[e,t]=d(""),[a,s]=d(""),[n,r]=d(""),[o,c]=d(null),[i,u]=d(""),[p,_]=d(null),[m,h]=d(!1),[l,b]=d(null),[N,v]=d(!1),[w,T]=d(""),[R,y]=d(""),[I,F]=d(""),K=H(!1);V(()=>{K.current||(K.current=!0,L(A.CHIP_ROW_RENDERED,{}))},[]);let D=ct.find(f=>f.id===a)||null,P=at({same_model:o,model_version:i,edits:p}),M=!!D&&!!e.trim()&&!!n.trim(),k=()=>{R&&y(""),I&&F("")},X=()=>{b(null),t(""),s(""),r(""),c(null),u(""),_(null),y(""),F(""),v(!1)},se=f=>{s(f.id),k(),L(A.CHIP_SELECTED,{chip:f.id,instruction_version:f.instruction_version})},ee=async()=>{if(D)try{await navigator.clipboard.writeText(D.instruction_text),v(!0),T(""),L(A.CHIP_INSTRUCTION_COPIED,{chip:D.id,instruction_version:D.instruction_version}),setTimeout(()=>v(!1),1800)}catch(f){T("Could not copy"),setTimeout(()=>T(""),2200)}},re=async()=>{if(!m){if(!D){y(x.compose.chip_missing);return}if(!e.trim()){y(x.compose.first_answer_missing);return}if(!n.trim()){y(x.compose.second_answer_missing);return}y(""),F(""),h(!0),L(A.CHIP_PAIR_INITIATED,{chip:D.id,instruction_version:D.instruction_version});try{let f=await ns({firstAnswer:e,targetedAnswer:n,chipId:D.id,instructionVersion:D.instruction_version});b(f)}catch(f){let W=f&&f.info||{};f&&f.status===400&&W.error==="too_long"?y(x.compose.too_long):f&&f.status===400&&W.error==="empty"?y(x.compose.too_short):f&&f.status===400&&W.error==="not_eligible"?F(x.compose.not_eligible):f&&f.status===400?F(x.compose.blocked):F(W&&W.message||x.compose.run_error)}finally{h(!1)}}},S=React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-chip-heading",className:"wb-reader-result__title"},x.value_statement.headline));return l?React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},S,React.createElement(Ps,{chip:l,entry:D,capture:P,onReset:X})):React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},S,React.createElement("p",{className:"wb-act2__offer"},x.value_statement.sub),React.createElement(Pe,{label:x.compose.first_answer_label,value:e,onChange:f=>{t(f),k()},placeholder:x.compose.first_answer_placeholder,minAckLength:1}),React.createElement("div",{className:"wb-act2__capture wb-chip__choose",role:"group","aria-label":"Pick a follow-up"},React.createElement("p",{className:"wb-act2__capture-heading"},x.row_header),React.createElement("p",{className:"wb-act2__capture-intro"},x.row_support),React.createElement("div",{className:"wb-chip__row"},ct.map(f=>React.createElement("button",{key:f.id,type:"button",className:`wb-loop__chip wb-chip__pick${f.id===a?" is-active":""}`,"aria-pressed":f.id===a,onClick:()=>se(f)},f.approved_ui_label)))),D?React.createElement("div",{className:"wb-chip__instruction"},React.createElement("p",{className:"wb-act2__prompt-note"},x.card.framing),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"Instruction to paste into your AI"},D.instruction_text),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(C,{kind:"primary",className:N?"is-copied":"",onClick:ee},N?x.compose.copy_done:x.compose.copy_label),w?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},w):null),React.createElement(Pe,{label:x.compose.second_answer_label,value:n,onChange:f=>{r(f),k()},placeholder:x.compose.second_answer_placeholder,minAckLength:1}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},$.heading),React.createElement("p",{className:"wb-act2__capture-intro"},$.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[J.YES,J.NO,J.NOT_SURE].map(f=>React.createElement("button",{key:f,type:"button",className:`wb-act2__capture-opt${o===f?" is-active":""}`,"aria-pressed":o===f,onClick:()=>c(f)},$.same_model.options[f])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-chip-model"},$.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},$.model_version.hint),React.createElement("input",{id:"wb-chip-model",type:"text",className:"wb-act2__capture-input",value:i,maxLength:80,placeholder:$.model_version.placeholder,onChange:f=>u(f.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[te.NONE,te.EDITED].map(f=>React.createElement("button",{key:f,type:"button",className:`wb-act2__capture-opt${p===f?" is-active":""}`,"aria-pressed":p===f,onClick:()=>_(f)},$.edits.options[f])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},$.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(C,{kind:"primary",disabled:m||!M,onClick:re,className:`wb-reader-cta${M&&!m?" is-armed":""}${m?" is-inspecting":""}`},m?x.compose.comparing_label:x.compose.compare_label)),R?React.createElement("p",{className:"wb-act2__run-error",role:"status"},R):null,I?React.createElement("p",{className:"wb-act2__run-error",role:"status"},I):null):null,React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},x.boundary))}function Ds({sel:e}){let[t,a]=d(!1),[s,n]=d("");if(!(e!=null&&e.ready))return null;let r=async()=>{try{await navigator.clipboard.writeText(e.openPrompt||""),a(!0),n(""),setTimeout(()=>a(!1),1800)}catch(o){n("Could not copy"),setTimeout(()=>n(""),2200)}};return React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},Cn(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__signal wb-guided-trap"},React.createElement("p",{className:"wb-active-case__probe"},"Start with an ordinary question:"),React.createElement(Et,{text:e.openPrompt})),e.reveal?React.createElement("div",{className:"wb-readout__section wb-guided-reveal"},React.createElement("div",{className:"wb-active-case__headline"},e.reveal)):null,React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste what it says back")),React.createElement("div",{className:"wb-guided-copy"},React.createElement(C,{kind:"ghost",small:!0,className:t?"is-copied":"",onClick:r},t?"Copied":"Copy question"),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null)))}function Ls({mode:e,sel:t,onAnother:a}){let[s,n]=d(!1),[r,o]=d(""),c=Ie.find(p=>p.ready&&p.id!==(t==null?void 0:t.id))||null,i=(c==null?void 0:c.openPrompt)||(t==null?void 0:t.openPrompt)||"";return i?React.createElement("section",{className:"wb-reader-result is-agent wb-loop wb-scroll-anchor","aria-labelledby":"wb-loop-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-loop-heading",className:"wb-reader-result__title"},"TEST ANOTHER QUESTION")),React.createElement("p",{className:"wb-loop__lead"},"Run the same check on a fresh question. Copy it, ask your AI, paste what it says back."),React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste the answer back")),React.createElement(Et,{text:i}),React.createElement("div",{className:"wb-loop__actions"},React.createElement(C,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(i),n(!0),o(""),setTimeout(()=>n(!1),1800)}catch(p){o("Could not copy"),setTimeout(()=>o(""),2200)}}},s?"Copied":"Copy question"),r?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},r):null,React.createElement(C,{kind:"primary",small:!0,onClick:()=>a(c)},"Test another question"))):null}function $s({onDismiss:e}){return React.createElement("section",{className:"wb-return","aria-label":"Welcome back"},React.createElement("div",{className:"wb-return__body"},React.createElement("p",{className:"wb-return__headline"},"Welcome back."),React.createElement("p",{className:"wb-return__text"},"You started a check here before. Paste an answer to run another and watch what it leaves out.")),React.createElement("button",{type:"button",className:"wb-return__dismiss",onClick:e,"aria-label":"Dismiss"},"\xD7"))}var qs=["Paste an AI answer to see what it might be missing.","Copy the one question Imbas builds, then ask your own AI.","Paste its reply back and watch what surfaces."];function Ms({onDismiss:e}){return React.createElement("section",{className:"wb-clarity","aria-label":"How the Confirmation Loop works"},React.createElement("button",{type:"button",className:"wb-clarity__dismiss",onClick:e,"aria-label":"Dismiss"},"\xD7"),React.createElement("span",{className:"wb-clarity__eyebrow"},"The Confirmation Loop"),React.createElement("ol",{className:"wb-clarity__steps"},qs.map((t,a)=>React.createElement("li",{key:a,className:"wb-clarity__step"},React.createElement("span",{className:"wb-clarity__num","aria-hidden":"true"},a+1),React.createElement("span",{className:"wb-clarity__text"},t)))))}function Fs(){let[e]=d(()=>lt(Ye())),t=e.loop_completion_rate,a=t==null?"\u2014":`${Math.round(t*100)}%`,s=e.counts||{},n=[["Runs started",s.run_started],["Runs completed",s.run_completed],["Results viewed",s.result_viewed],["Questions copied",s.target_question_copied],["Loops returned",s.loop_returned],["Loops completed",s.loop_completed],["States corrected",s.state_corrected],["Cards exported",s.card_exported],["Candidates submitted",s.candidate_submitted],["Return visits",s.return_visit]],r=e.completed_by_state||{},o=Object.keys(r).length>0;return React.createElement("section",{className:"wb-funnel","aria-label":"Reader funnel (this browser only)"},React.createElement("div",{className:"wb-funnel__head"},React.createElement("span",{className:"wb-funnel__eyebrow"},"Reader funnel \xB7 this browser only"),React.createElement("p",{className:"wb-funnel__northstar"},React.createElement("span",{className:"wb-funnel__northstar-num"},a),React.createElement("span",{className:"wb-funnel__northstar-label"},"of copied questions returned as completed loops"))),React.createElement("dl",{className:"wb-funnel__grid"},n.map(([c,i])=>React.createElement("div",{key:c,className:"wb-funnel__row"},React.createElement("dt",{className:"wb-funnel__label"},c),React.createElement("dd",{className:"wb-funnel__val"},i||0)))),o?React.createElement("div",{className:"wb-funnel__states"},React.createElement("span",{className:"wb-funnel__states-label"},"Completed by state"),React.createElement("ul",{className:"wb-funnel__states-list"},Ze.map(c=>r[c]?React.createElement("li",{key:c,className:"wb-funnel__states-item"},fe[c]&&fe[c].chip||c,": ",r[c]):null))):null,React.createElement("p",{className:"wb-funnel__note"},"[Content-minimal: ids, enums, counts only \u2014 never answer or question text. Stored in this browser, nothing leaves your device.]"))}var Us={context:"Public example \xB7 U.S. administrative law",question:"When a court reviews a federal agency's reading of an ambiguous statute, how much weight does the agency's interpretation get?",openAnswer:"Courts apply Chevron deference. If the statute is ambiguous, the court defers to the agency's interpretation as long as it's reasonable \u2014 the two-step framework from Chevron v. NRDC (1984).",leftOut:"Chevron was overruled. In Loper Bright Enterprises v. Raimondo (June 2024), the Supreme Court ended Chevron deference \u2014 courts now interpret ambiguous statutes themselves, de novo, without deferring to the agency.",targetedPrompt:$e,surfaced:"Chevron no longer governs. Loper Bright v. Raimondo (2024) overruled it; courts now decide a statute's meaning de novo under the Administrative Procedure Act. Governing source: Loper Bright Enterprises v. Raimondo, 603 U.S. 369 (2024).",tag:"That's the Volunteer Gap \u2014 the open answer left it out; the direct question surfaced it. Run your own answer to watch it live."};function Bs({onTryOwn:e,onClose:t}){let a=Us,s=(fe[qe]||{}).headline||"";return React.createElement("section",{className:"wb-demo","aria-labelledby":"wb-demo-heading"},React.createElement("div",{className:"wb-demo__head"},React.createElement("span",{className:"wb-demo__eyebrow"},"WORKED EXAMPLE"),React.createElement("h3",{id:"wb-demo-heading",className:"wb-demo__title"},"Watch the loop on one public example."),React.createElement("p",{className:"wb-demo__context"},a.context)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The question"),React.createElement("p",{className:"wb-demo__q"},a.question)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the AI said"),React.createElement("p",{className:"wb-demo__answer"},a.openAnswer)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the open answer left out"),React.createElement("p",{className:"wb-demo__leftout"},React.createElement("mark",{className:"wb-demo__mark"},a.leftOut))),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The direct question Imbas builds"),React.createElement("p",{className:"wb-act2__prompt wb-demo__prompt"},a.targetedPrompt)),React.createElement("div",{className:"wb-loop__reveal wb-demo__reveal"},React.createElement("p",{className:"wb-loop__headline"},s),React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel"},React.createElement("span",{className:"wb-loop__panel-label"},Ge),React.createElement("p",{className:"wb-loop__panel-body wb-loop__panel-body--muted"},Ue)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},je),React.createElement("p",{className:"wb-loop__panel-body"},a.surfaced))),React.createElement("p",{className:"wb-loop__tag"},a.tag),React.createElement("p",{className:"wb-measure__boundary"},Q),React.createElement("p",{className:"wb-demo__smallprint"},"[A canned demonstration on a public example. Not your run, not an Imbas case \u2014 nothing here was recorded.]")),React.createElement("div",{className:"wb-demo__cta-row"},React.createElement(C,{kind:"primary",small:!0,onClick:e},"Now try your own \u2192"),React.createElement("button",{type:"button",className:"wb-demo__close",onClick:t},"Hide example")))}function Hs(){let[e,t]=d("own"),[a,s]=d(Ie[0]),[n,r]=d(""),[o,c]=d(""),[i,u]=d(""),[p,_]=d(""),[m,h]=d(!1),[l,b]=d(null),[N,v]=d({}),[w,T]=d(!1),[R]=d(()=>Kn()),[y,I]=d(!1),F=H(!1),[K]=d(()=>!Pn()),[D,P]=d(()=>On()),M=H(null),k=H(null),X=H(!1),se=H(Vt()),ee=H(null),re=!!(e==="guided"?a.openPrompt:n).trim(),S=!!o.trim(),f=re&&S,W=e==="own"&&S&&!re,we=m?"inspecting":l?"result":f?"ready":W?"needQuestion":"idle";V(()=>{let g=()=>{window.location.hash==="#wb-reader-console"&&t("own")};return g(),window.addEventListener("hashchange",g),()=>window.removeEventListener("hashchange",g)},[]),V(()=>{if(!X.current){X.current=!0,We();return}if(e!=="guided")return;let g=window.requestAnimationFrame(()=>Ae(M.current));return()=>window.cancelAnimationFrame(g)},[a.id,e]),V(()=>{let{state:g,scroll:Z}=Yt(se.current,!!l);if(se.current=g,Z&&k.current){let ce=window.requestAnimationFrame(()=>Ae(k.current));return()=>window.cancelAnimationFrame(ce)}},[l]),V(()=>{if(!l){ee.current=null;return}let g=_t(l)||(l.source?`src:${l.source}`:"result");ee.current!==g&&(ee.current=g,L(A.RESULT_VIEWED,{run:_t(l),source:l.source||"agent"}))},[l]),V(()=>{let g=!1;try{g=sessionStorage.getItem("imbas_reader_session")==="1"}catch(E){}let Z=Ye();if(Z.length===0)return;if(!g){L(A.RETURN_VISIT);try{sessionStorage.setItem("imbas_reader_session","1")}catch(E){}}let ce=lt(Z),_e=ce.counts.target_question_copied||0,U=ce.counts.loop_completed||0;_e>U&&(L(A.RESTORED_SESSION,{}),T(!0))},[]);let oe=g=>{g!==e&&(t(g),v({}),b(null),h(!1),g==="own"&&c(""))},ge=()=>{Dn(),P(!0)},ie=()=>{I(!0),F.current||(F.current=!0,L(A.RUN_STARTED,{mode:"demo",source:"demo"}))},ze=()=>{I(!1),e!=="own"&&oe("own"),M.current&&window.requestAnimationFrame(()=>Ae(M.current))},De=g=>{!g.ready||g.id===a.id||(s(g),c(""),b(null),v({}),h(!1))},Ke=g=>{b(null),v({}),h(!1),c(""),e==="guided"?g&&s(g):g&&r(g.openPrompt),M.current&&window.requestAnimationFrame(()=>Ae(M.current))},ye=g=>{c(g),v(Z=>({...Z,answer:""})),l&&b(null)},At=g=>{r(g),v(Z=>({...Z,question:""})),l&&b(null)},ve=async()=>{if(m)return;let g={},Z=e==="guided"?a.openPrompt:n,ce=o;if(e==="own"&&!(Z||"").trim()&&(g.question="Add the question you asked."),(ce||"").trim()||(g.answer="Paste an answer to run The Reader."),Object.keys(g).length){v(g);return}v({}),h(!0),b(null),L(A.RUN_STARTED,{mode:e});let _e=Zn({mode:e,sel:a,question:n,answer:ce,topic:i,model:p});try{let U=await es(_e);b(U);let E=_t(U);L(A.RUN_COMPLETED,{run:E,mode:e,source:U.source||"agent",eligible:!!(U.act2&&U.act2.eligible)}),U.source==="fallback"&&Ia(U).toLowerCase()==="timeout"&&L(A.TIMEOUT,{run:E,mode:e,reason:"timeout"}),U.capture_uncertain&&L(A.CAPTURE_UNCERTAIN,{run:E,mode:e})}catch(U){U&&U.message==="too_long"?v({answer:"Answer is over 1200 words. Trim it and re-run."}):(b({source:"fallback",completeness:"thin",the_read:kt(),what_was_left_out:[],how_it_was_shaped:"",reason:String(U.message||"network")}),L(A.RUN_COMPLETED,{mode:e,source:"fallback",eligible:!1}),U&&U.message==="read_429"&&L(A.CAPACITY_DEGRADATION,{mode:e,reason:"capacity"}))}finally{h(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},w&&!l?React.createElement($s,{onDismiss:()=>T(!1)}):null,e==="own"&&K&&!D&&!w&&!y&&!l&&!m?React.createElement(Ms,{onDismiss:ge}):null,React.createElement("div",{className:"wb-demo-trigger-row"},React.createElement("button",{type:"button",className:"wb-demo-trigger",onClick:y?()=>I(!1):ie,"aria-expanded":y},y?"Hide example":"New here? Watch a 20-second example \u2192")),y?React.createElement(Bs,{onTryOwn:ze,onClose:()=>I(!1)}):null,React.createElement("div",{ref:M,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>oe("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>oe("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with a measured case."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},Ie.map(g=>React.createElement("button",{key:g.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${g.id===a.id?" is-active":""}${g.ready?"":" is-disabled"}`,onClick:()=>De(g),disabled:!g.ready,title:g.title},g.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},Tn(g)):React.createElement(me,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},g.cardShort||g.title)))),React.createElement(Ds,{sel:a})):React.createElement("div",{className:"wb-reader-v2__own-header"},React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste an AI answer below. The Reader inspects what it might be missing.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(me,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(ne,{label:"Which AI did you ask? (optional)"},React.createElement(ft,{value:p,onChange:_}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Pe,{label:"AI answer received",value:o,onChange:ye,error:N.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Pe,{label:"AI answer received",value:o,onChange:ye,error:N.answer,placeholder:"Paste an AI answer. Anything from ChatGPT, Gemini, Claude\u2026",minAckLength:1})),S||re?React.createElement("div",{className:"wb-reader-v2__reveal"},React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(ne,{label:"Question asked"},React.createElement("textarea",{className:de,value:n,onChange:g=>At(g.target.value),placeholder:"What did you ask the model?",rows:3,style:Oe,"aria-invalid":!!N.question})),N.question?React.createElement("div",{className:"wb-field-error",role:"alert"},N.question):null,W&&!N.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(ne,{label:"Optional topic / context"},React.createElement("input",{className:de,value:i,onChange:g=>u(g.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:Oe}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(ne,{label:"Which AI did you ask? (optional)"},React.createElement(ft,{value:p,onChange:_})))):null)),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":m},React.createElement(ds,{state:we}),React.createElement("details",{className:"wb-reader-v2__privacy"},React.createElement("summary",{className:"wb-reader-v2__privacy-line"},"Inspections aren't published to our reviewed archive. Don't paste anything sensitive."),React.createElement("p",{className:"wb-reader-v2__privacy-full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See ",React.createElement("a",{href:"/retention.html"},"what deletion means")," and the ",React.createElement("a",{href:"/privacy.html"},"privacy policy"),".")),l?null:React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(C,{kind:"primary",disabled:m||!f,onClick:ve,className:`wb-reader-cta${f&&!m?" is-armed":""}${m?" is-inspecting":""}`},m?"Inspecting\u2026":"See what might be missing")))))),l?React.createElement("div",{ref:k,className:"wb-reader-v2__result wb-scroll-anchor"},l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--hero"},React.createElement(Ns,{result:l})):null,React.createElement("div",{className:"wb-reader-v2__follow"},React.createElement(fs,{result:l,context:{mode:e,sel:a,question:n,answer:o,model:p,topic:i},onRunAgain:ve})),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--measure"},React.createElement(ks,{result:l,context:{mode:e,sel:a,question:n,answer:o,model:p,topic:i}})):null,l.checks&&Array.isArray(l.checks.cards)&&l.checks.cards.length?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--checks"},React.createElement(Rs,{result:l})):null,l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--meaning"},React.createElement(qa,{pairRuns:[],findings:l.checks&&l.checks.cards||[]})):null,l.measurement&&l.receipt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--perception"},React.createElement(La,{mode:"single",receipt:l.receipt})):null,l.act2?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--act2"},React.createElement(Is,{result:l})):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--loop"},React.createElement(Ls,{mode:e,sel:a,onAnother:Ke})),React.createElement("p",{className:"wb-reader-v2__post-privacy"},"This inspection wasn't published to our reviewed archive. See ",React.createElement("a",{href:"/retention.html"},"what deletion means"),".")):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--chips"},React.createElement(Os,null)),React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(Ra,{variant:"reader-secondary"})),R?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--funnel"},React.createElement(Fs,null)):null))}function Ws(){let e=H(null),[t]=d(()=>Yn());return V(()=>{We();let a=()=>We();return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),React.createElement("div",{className:`wb-shell${t?" wb-shell--reader-v2":""}`,style:{color:O.text,minHeight:"100vh",fontFamily:G}},React.createElement("style",null,bn),React.createElement("style",null,fn,wn,gn,yn,vn),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:pe,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:j,fontSize:11,letterSpacing:"0.18em",color:O.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:O.line,marginBottom:22}}),t?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"See what your AI might be missing."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped."),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Hs,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:pe,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:G,fontSize:16.5,lineHeight:1.6,color:O.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(cs,null)),t?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:O.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:j,fontSize:11,color:O.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var zs=ReactDOM.createRoot(document.getElementById("workbench-root"));zs.render(React.createElement(Ws,null));})();
