/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var na="reader-receipt-1.0";var Nn="sha256",X="Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";function ut(e){return`Candidate gap estimate: ${e} of 3 (unvalidated)`}function kn(e){return`Machine gap estimate: ${e} of 3 (unvalidated)`}function xn(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function dt(e){if(typeof e=="string")return xn(e);if(Array.isArray(e))return e.map(dt);if(e&&typeof e=="object"){let t={};for(let a of Object.keys(e).sort())t[a]=dt(e[a]);return t}return e}function ra(e){let t=dt(e);return t&&typeof t=="object"&&t.integrity&&typeof t.integrity=="object"&&(t.integrity.content_hash=null),JSON.stringify(t)}var En="cfp.1";var Cn={full:"FULL",partial:"PARTIAL",thin:"THIN"};function sa(e){let t=e||{},a=t.inspection||{},n=t.measurement,r=t.provenance||{},s=[];s.push("\u2014\u2014 THE ANSWER INSPECTED \u2014\u2014"),s.push(`Question: ${(t.question||"").trim()}`),(t.topic||"").trim()&&s.push(`Topic / context: ${t.topic.trim()}`),(t.declared_model||"").trim()&&s.push(`AI used: ${t.declared_model.trim()}`),s.push(""),s.push("Answer:"),s.push((t.answer||"").trim()),s.push(""),s.push("\u2014\u2014 THE READ \u2014\u2014"),s.push(`Completeness: ${Cn[a.completeness]||(a.completeness||"").toUpperCase()}`),s.push((a.the_read||"").trim()),s.push(""),s.push("What was left out:");let o=Array.isArray(a.what_was_left_out)?a.what_was_left_out.filter(Boolean):[];if(o.length)for(let c of o)s.push(`- ${c}`);else s.push("- (none identified)");if(s.push(""),s.push(`How it was shaped: ${(a.how_it_was_shaped||"").trim()||"(none detected)"}`),(a.inspection_note||"").trim()&&s.push(`Inspection note: ${a.inspection_note.trim()}`),s.push(""),s.push("\u2014\u2014 MEASUREMENT (candidate observations, unvalidated) \u2014\u2014"),n){s.push(ut(n.gap_estimate)),(n.estimate_rationale||"").trim()&&s.push(`Rationale: ${n.estimate_rationale.trim()}`);let c=n.finding_counts||{};s.push(`Findings by type: candidate missing item: ${c["candidate missing item"]||0} \xB7 candidate framing issue: ${c["candidate framing issue"]||0} \xB7 candidate deflection: ${c["candidate deflection"]||0}`);let i=Array.isArray(n.findings)?n.findings:[];i.length&&(s.push(""),i.forEach((d,m)=>{s.push(`${m+1}. [${d.type}] ${(d.materiality||"").trim()}`),(d.anchor||"").trim()&&s.push(`   anchor: "${d.anchor.trim()}"`)})),s.push(""),s.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.")}else s.push("No measurement layer was produced for this run.");return s.push(""),s.push("\u2014\u2014 PROVENANCE \u2014\u2014"),s.push(`Reader model: ${r.reader_model_version||""}`),s.push(`Inspector prompt version: ${r.inspector_prompt_version||""}`),r.inspector_run_conditions&&s.push(`Inspector run conditions: ${JSON.stringify(r.inspector_run_conditions)}`),r.condition_fingerprint&&s.push(`Condition fingerprint (${r.fingerprint_version||En}): ${r.condition_fingerprint}`),s.push(`Source content hash: ${r.source_content_hash||""}`),s.push(`Reader output hash: ${r.reader_output_hash||""}`),s.push(`Run timestamp: ${r.run_timestamp||""}`),r.request_id&&s.push(`Request ID: ${r.request_id}`),s}function pt(e){let t=e||{};return["\u2014\u2014 INTEGRITY \u2014\u2014",`Algorithm: ${t.algorithm||Nn}`,`Canonicalization version: ${t.canonicalization_version||"1.0"}`,`Content hash: ${t.content_hash||""}`]}function oa(e){let t=e||{},a=t.open_run||{},n=[];n.push("IMBAS READER \u2014 INSPECTION RECEIPT"),n.push(`Generated: ${t.generated_at||""}`),n.push(`Schema: ${t.schema_version||""}`),n.push(""),n.push(X),n.push("");for(let r of sa(a))n.push(r);n.push("");for(let r of pt(t.integrity))n.push(r);return n.push(""),n.push(X),n.join(`
`)}function ia(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 PAIRED INSPECTION RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(X),r.push(""),r.push("\u2014\u2014 THE FIRST (OPEN) ANSWER \u2014\u2014"),r.push("");for(let o of sa(a))r.push(o);r.push(""),r.push("\u2014\u2014 THE TWO-QUESTION TEST (paired, machine estimate) \u2014\u2014"),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(kn(n.gap_estimate)),(n.estimate_rationale||"").trim()&&r.push(`Rationale: ${n.estimate_rationale.trim()}`),r.push(""),r.push("Targeted prompt (deterministic, from the open answer's candidate gaps):"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("Delta \u2014 what the second answer surfaced that the first did not:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((o,c)=>{let i=(o.signal_pattern||"").trim();r.push(`${c+1}. ${i?`[${i}] `:""}${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (no delta \u2014 the second answer added nothing material over the first)"),r.push(""),r.push("These are machine estimates over a single answer pair, not validated classifications or evidence."),r.push("");for(let o of pt(t.integrity))r.push(o);return r.push(""),r.push(X),r.join(`
`)}function ca(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 USER-DIRECTED FOLLOW-UP RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(X),r.push(""),r.push("\u2014\u2014 THE FIRST ANSWER \u2014\u2014"),r.push(""),(a.question||"").trim()&&(r.push(`Question: ${a.question.trim()}`),r.push("")),r.push((a.answer||"").trim()),r.push(""),r.push("\u2014\u2014 THE FOLLOW-UP YOU CHOSE \u2014\u2014"),(n.chip_label||"").trim()&&r.push(n.chip_label.trim()),r.push(""),n.chip_id&&r.push(`Chip ID: ${n.chip_id}`),n.instruction_version&&r.push(`Instruction version: ${n.instruction_version}`),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(""),r.push("Instruction you sent:"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("What changed in the second answer:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((o,c)=>{r.push(`${c+1}. ${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (nothing visibly changed under this instruction)"),r.push(""),r.push("This is a user-directed follow-up, not an Imbas inspection finding. It shows what changed under the conditions you recorded; it does not establish that the second answer is correct, complete, or better supported."),r.push("");for(let o of pt(t.integrity))r.push(o);return r.push(""),r.push(X),r.join(`
`)}var la="Want to test it? Here's a direct question that gives nothing away.",mt="The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets.",An=["ceiling","timeout","network","api_error","capacity","429"];function _t(e){return An.includes(String(e==null?"":e).toLowerCase())}function Sn(e){return String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`)}var Ye="Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";var Re="gap_revealed",Ke="still_missing",Ie="not_clear_yet",ht=[Re,Ke,Ie];function da({gap_estimate:e,signal_counts:t}={}){let a=Number(e);if(!Number.isFinite(a)||a<=0)return Ke;let n=t||{},r=(Number(n.Omission)||0)+(Number(n.Deflection)||0);return(Number(n["Framing Drift"])||0)>r?Ie:Re}var rt="What it told you",st="What it told you when you asked",Qe="Didn't come up.",ua="Your session, your conditions \u2014 not the lab's.",Oe={[Re]:{headline:"It answers when asked. It just didn't volunteer.",tag:"That's the Volunteer Gap \u2014 you just watched it happen in your own chat.",chip:"It didn't volunteer"},[Ke]:{headline:"You asked directly. It still didn't surface.",cta:"Push harder \u2192",chip:"Still didn't surface"},[Ie]:{headline:"The second answer changed. The gap isn't clean.",cta:"Try the cleaner check \u2192",swapPanels:!0,chip:"Not clear yet"}},Tn="The targeted answer included information the open answer did not.",Rn=[Re,Ie];function pa(e,t){let a=Oe[e]||{};if(!t)return a;let n={...a};return delete n.tag,Rn.includes(e)&&(n.headline=Tn),n}var Pe="quick",De="cleaner",ma="Same chat is faster. A fresh chat gives you a cleaner comparison.",bt={label:"Quick check",hint:"Same chat. Paste the question, ask again."},ft={label:"Cleaner check",hint:"Fresh chat. Copy the setup, then ask."};function _a({question:e}={}){let t=typeof e=="string"?e.trim():"",a=[];return t&&(a.push(t),a.push("")),a.push(Ye),Sn(a.join(`
`)).trim()}var Z={YES:"yes",NO:"no",NOT_SURE:"not_sure"},oe={NONE:"none",EDITED:"edited"},In="unverified",On=80;function Pn({same_model:e,edits:t}={}){return t===oe.EDITED||e===Z.NO?!1:e===Z.YES&&t===oe.NONE?!0:In}function wt({same_model:e,model_version:t,edits:a}={}){let n={same_model_claimed:e===Z.YES,user_edits_disclosed:a===oe.EDITED,conditions_matched:Pn({same_model:e,edits:a})},r=typeof t=="string"?t.trim():"";return r&&(n.model_version_user_reported=r.slice(0,On)),n}function Je(e){return!e||e.conditions_matched!==!0}var fe={INSPECTION_FOLLOWUP:"inspection_followup",USER_CHIP:"user_chip",LEGACY_UNKNOWN:"legacy_unknown"};function Dn(e){return e===fe.INSPECTION_FOLLOWUP||e===fe.USER_CHIP?e:fe.LEGACY_UNKNOWN}function ha({targeted_prompt:e,original_artifact_id:t,targeted_artifact_id:a,capture:n,initiator:r,targeted_prompt_hash:s,chip_id:o,instruction_version:c}={}){let i={targeted_prompt:typeof e=="string"?e:"",original_artifact_id:typeof t=="string"?t:"",targeted_artifact_id:typeof a=="string"?a:"",capture:n&&typeof n=="object"?n:{},initiator:Dn(r),targeted_prompt_hash:typeof s=="string"?s:""};return i.initiator===fe.USER_CHIP&&(i.chip_id=typeof o=="string"?o:"",i.instruction_version=typeof c=="string"?c:""),i}var $={heading:"One quick thing before the side-by-side",intro:"This just marks how you ran the two answers. It never changes what they say.",same_model:{question:"Did both answers come from the same AI \u2014 same provider, same model?",options:{[Z.YES]:"Yes, the same one",[Z.NO]:"No, a different one",[Z.NOT_SURE]:"Not sure"}},model_version:{question:"Which model did you use? Optional.",hint:"The name or version, as you remember it.",placeholder:"e.g. the model or version you ran"},edits:{question:"Did you edit either answer before pasting?",options:{[oe.NONE]:"No, neither was edited",[oe.EDITED]:"Yes, I edited one or both"}},disclosure:"This marks how clean the capture was. It doesn't decide whether the conditions lined up.",unmatched_warning:"The conditions behind these two answers aren't confirmed as matched \u2014 a different model, an edit, or a setup you weren't sure about. Read the side-by-side as a looser comparison, not a like-for-like.",unmatched_badge:"Unmatched conditions"};var gt="chip_change_visible",yt="chip_change_not_visible",vt="chip_change_unclear",ba=[gt,yt,vt];function fa({delta_count:e,conditions_matched:t}={}){let a=Number(e);return!Number.isFinite(a)||a<=0?yt:t===!0?gt:vt}var Nt={[gt]:{headline:"The change you asked for shows up in the second answer.",note:"That's under the conditions you recorded. It doesn't mean the second answer is correct or complete.",chip:"The change shows up"},[yt]:{headline:"The second answer doesn't show the change you asked for.",note:"No visible difference isn't an all-clear. The change could be there in a way this comparison doesn't catch.",chip:"I don't see the change"},[vt]:{headline:"Something changed, but not under matched conditions.",note:"A different model, an edit, or a setup you weren't sure about. Read this as a looser comparison, not like-for-like.",chip:"Hard to tell"}},E={value_statement:{headline:"Tell your AI exactly what to do next.",sub:"Paste the answer or draft. Tap what bothered you. Get the exact instruction to paste back."},row_header:"What would you like the next answer to do differently?",row_support:"These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",card:{framing:"Paste this into the same AI, in the same conversation if possible. If you start a new conversation, include the original answer and any material it relied on. Bring the new answer back."},side_by_side:{reason_prefix:"Follow-up selected by you: ",first_answer_caption:"The answer or draft you started with.",second_answer_caption:"Second answer after your follow-up. Not verified by Imbas."},meaning_panel_line:"This comparison follows a user-selected instruction, not an inspection-generated follow-up. It shows what changed under the recorded conditions; it does not establish that the second answer is correct, complete, or better supported. Absence of a visible difference is not an all-clear.",boundary:"User-directed follow-up. No Imbas inspection finding asserted.",professional_cue:{line:"AI made the draft. Your name still goes on it.",link:"For professional work \u2192"},compose:{first_answer_label:"The answer or draft you started with",first_answer_placeholder:"Paste the answer or draft you want to change\u2026",second_answer_label:"Second answer after your follow-up",second_answer_placeholder:"Paste what your AI came back with\u2026",copy_label:"Copy the instruction",copy_done:"Copied \u2014 now paste it into your AI",edit_first_answer:"Edit the first answer",compare_label:"Compare the two answers",comparing_label:"Comparing\u2026",first_answer_missing:"Paste the answer or draft you started with.",second_answer_missing:"Paste the second answer your AI gave.",chip_missing:"Pick a follow-up above first.",too_long:"Second answer is over 1200 words. Trim it and re-run.",too_short:"That's too short to compare. Paste the full second answer.",not_eligible:"That follow-up isn't available right now. Pick another and try again.",blocked:"This follow-up can't run right now. Check what you pasted and try again.",run_error:"The comparison didn't reach the Reader. Nothing you pasted was changed. Try again shortly."},reveal:{delta_heading:"What changed",empty_delta:"No visible difference under the instruction you chose. That isn't an all-clear: the change could be there in a way this comparison doesn't catch.",first_side_label:"First answer",second_side_label:"Second answer",correct_label:"Read it differently?",reset_label:"Try another follow-up",idempotent_notice:"You already ran this follow-up. This is the comparison from that run.",capture_uncertain_notice:"The comparison is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."}};function kt(e){if(e&&(typeof e=="object"||typeof e=="function")&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))kt(e[t])}return e}var Ln=kt({CAPTURE_DERIVED:"capture_derived",DOSSIER_DERIVED:"dossier_derived",PRACTICE_DERIVED:"practice_derived",MIXED:"mixed"}),Le=Ln,$e="v1",qe="2026-07-20",Me="authored, pending founder review and bounded testing",xt=kt([{id:"sq.material",approved_ui_label:"Didn't use the material I provided",instruction_text:`Answer my question again, or revise the draft, using the document, text, or data I gave you as your main source. Build your claims on what that material actually says.

Point to the exact parts you drew on: the section, passage, or figure behind each claim. Keep what comes from my material separate from anything you add from general knowledge.

Where my material already answers the question, don't reach for a generic assumption instead. If you can't open or read part of what I gave you, or it isn't here in this conversation, say so plainly and ask for it rather than filling the gap.`,instruction_version:$e,seeding_tag:Le.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 1: the documented 2026-07-20 instrument pass found no captured analogue (0/90 prompt-bearing files; the corpus names anchors but supplies no material). Practice-derived and anchor-free by necessity \u2014 the person can point at 'the document I gave you' without naming what it should have contained. Generalizes the always-true instruction: prefer the supplied material as the primary source, expose which parts were used, and admit when the material is inaccessible. No anchor is lost because none was ever captured for this class.",author:"Imbas",date:qe,review_status:Me,known_misuse_risks:["Used on an answer where the person supplied no document, text, or data \u2014 there is no material to prefer, so the instruction has nothing to bind to.","Read as a demand to treat the supplied material as the only allowable source even where it is silent, pushing the model to over-claim from a thin document."],negative_examples:["A general-knowledge question asked with no attachment or pasted source ('What is the capital of Australia?').","A request for the model's own opinion or a brainstorm, where no external material was offered or intended."],content_hash:"d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a"},{id:"sq.sources",approved_ui_label:"Doesn't show where its claims came from",instruction_text:`As you answer again, or go back through the draft, show me where each important factual claim comes from. Name the source behind it: a citation, a document, a study, or another specific reference someone could look up.

Mark clearly which claims rest on a real source and which are your own inference or estimate.

Don't invent a citation, and don't imply a source backs a claim when you haven't checked that it does. Where you don't have a genuine source for something, say so and label it as your own reasoning rather than dressing it up as sourced.`,instruction_version:$e,seeding_tag:Le.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-006","imbas-instrument:registry/cases/case-012"],abstraction_note:"Seeds: case-006 (targeted prompt naming Kennan/Burns/Matlock/Gates; capture og-006-B-claude-targeted.md reproduces each authority with a citation, L5/17/28/37) and case-012 (naming Hviid 2019 and IOM 2011; capture og-012-B-gpt-targeted.md, inline citations L2/5/13/18); structural analogues in cases 002, 010, 013. Those captures name a specific omitted authority. The template generalizes to the anchor-free form: source the model's OWN claims, whatever they are. Lost: the named authority \u2014 the person cannot supply the very source they don't know is missing. Dossier reinforcement only, not a capture: sg-ctr-currency-over-10k.md L58-66 states the mechanism (name the source, add no new triggering fact).",author:"Imbas",date:qe,review_status:Me,known_misuse_risks:["Pushed onto a purely subjective or creative answer (a poem, an opinion) where source attribution does not apply.","Read as requiring a formal citation for every sentence, driving the model to attach nominal references that don't actually support the point."],negative_examples:["A creative-writing or opinion request with no factual claim to source.","A step in a math derivation where each line follows from the previous, not from an external source."],content_hash:"42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81"},{id:"sq.date_version",approved_ui_label:"Doesn't say what date or version applies",instruction_text:`Answer again, or revise the draft, and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to.

Then check whether the version you're using has since been amended, replaced, or updated, and name the one that applies now wherever you can confirm it.

If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is.`,instruction_version:$e,seeding_tag:Le.MIXED,seed_case_ids:["imbas-instrument:registry/cases/case-005","imbas-instrument:registry/cases/case-009"],abstraction_note:"Two clauses, two provenances, so the tag is mixed. The date/version clause descends from captures: case-005 (SEC Rule 10b-18, 1982; og-005-B-gpt-targeted.md L3/L26) and case-009 (2023 ODNI declassified summary; og-009-B-claude-targeted.md L14-16/48) \u2014 each anchors a specific dated authority. The supersession clause descends from dossier-only material with no capture: imbas-instrument:data/annex-exemplars/dossiers/tx-ctc-permanence-vol-asym.md L39-42 (Public Law 119-21 permanence; L220 'No capture exists') and the case-bank repeal subset. The template generalizes both to the anchor-free form: date every time-sensitive point in the model's own answer and check it for supersession. Lost: the named rule and the named repeal.",author:"Imbas",date:qe,review_status:Me,known_misuse_risks:["Applied to a timeless fact (a definition, a settled physical constant) where no date or version is meaningful.","Read as a demand to assert the current version even where the model cannot check it, inviting a fabricated 'latest as of' claim."],negative_examples:["A question about a mathematical identity or a fixed historical date, where nothing versions.","An answer that already carries explicit, dated sourcing for every time-sensitive point."],content_hash:"dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8"},{id:"sq.direct_answer",approved_ui_label:"Didn't answer the question I actually asked",instruction_text:`Start by answering the exact question I asked. Restate that question back to me in one line first, so I can see it hasn't been quietly narrowed, widened, or swapped for a nearby one. If you're revising a draft, do the same for the question the draft is meant to answer.

Give the direct answer up front. Add only the background that answer actually needs, and put it after the answer, not before.

If the question can't be answered as I asked it, or something it needs is missing, name the specific thing that's in the way. Don't quietly trade my question for an easier one you can answer instead.`,instruction_version:$e,seeding_tag:Le.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 4: no captured analogue by the documented 2026-07-20 search. The instrument's design is between-condition across fresh conversations, not a re-ask; case-003 v2 is a framing test, not a re-ask; the single regex hit was a false positive inside captured answer prose. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: answer the exact question first, restate it so any substitution is visible, and name the obstacle instead of swapping in an easier question. No anchor is lost because none was captured.",author:"Imbas",date:qe,review_status:Me,known_misuse_risks:["Used when the person's question is genuinely ambiguous, where restating one reading as 'the exact question' can lock in the wrong one.","Read as a ban on all context, producing a bare answer that drops caveats the question actually needed."],negative_examples:["An open-ended brainstorming prompt where no single direct answer is expected.","A request that explicitly asks for broad exploration or a set of options rather than one answer."],content_hash:"98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a"},{id:"sq.quantity",approved_ui_label:"Didn't give the number or range I asked for",instruction_text:`Give the number, range, or threshold I asked for. If you're revising a draft, make sure that figure is actually stated in it, not left implied. Where a single figure is fair, give the figure; where it isn't, give a realistic range instead of a single point.

Show your work: the inputs and assumptions behind the figure, and the calculation where there is one. Keep the values you actually know apart from the ones you're estimating.

If the evidence doesn't get you to a solid number or range, say so outright and name what you'd need to get there. Don't invent a precise figure just to look more certain than you are.`,instruction_version:$e,seeding_tag:Le.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-004","imbas-instrument:registry/cases/case-010"],abstraction_note:"Seeds: case-004 (NNT literature; og-004-B-claude-targeted.md L14/15/36-39/42, NNT about 9, 20-33, 10-30, Cochrane figures) and case-010 (combined voting power; og-010-B-claude-targeted.md L7/19/39, 20-40% figures); reinforced by og-005 L26 ($942B, 2024) and og-012 L5 (HR 0.93, 95% CI 0.85-1.02). The captured sub-mechanisms diverge \u2014 a single settled figure versus an empirical range \u2014 and the template deliberately covers both: give the figure where one is fair, the realistic range where it isn't, with inputs shown. Anchor-free: the person asks for 'the number I wanted' without knowing it. Lost: the specific quantity and its source literature.",author:"Imbas",date:qe,review_status:Me,known_misuse_risks:["Applied to a question that is not quantitative, manufacturing a number where none belongs.","Read as always requiring a range, so a well-established single figure gets diluted into a vague band."],negative_examples:["A qualitative 'how should I approach this?' question with no quantity at issue.","A definitional or yes/no question where a number is not responsive."],content_hash:"12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e"},{id:"sq.fact_assumption",approved_ui_label:"Mixes facts with assumptions",instruction_text:`Answer again, or go back through the draft, and keep three things apart: what you actually know, what you're assuming, and what you're inferring from those. Say which is which as you go.

For each main conclusion, show what it rests on: the facts and the assumptions it depends on. Where something is still unsettled, name it as an open question instead of smoothing it over.

Don't hand me an assumption, an inference, or an estimate dressed up as an established fact.`,instruction_version:$e,seeding_tag:Le.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 6: no captured analogue by the documented 2026-07-20 search (0/90). The instrument constitution's epistemic chain is instrument-internal review discipline, never a model-directed prompt, and is deliberately NOT claimed as an analogue here. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: separate what is known from what is assumed or inferred, tie each conclusion to what it rests on, and never present an assumption as an established fact. No anchor is lost because none was captured.",author:"Imbas",date:qe,review_status:Me,known_misuse_risks:["Forced onto a simple factual answer that has no assumptions to separate, adding empty scaffolding.","Read as a demand to label ordinary settled facts as 'assumptions', overstating how uncertain they are."],negative_examples:["A single verifiable lookup ('What year did X happen?') with no inference chain.","A creative or opinion answer where a fact/assumption split does not apply."],content_hash:"e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309"}]);var A={RUN_STARTED:"run_started",RUN_COMPLETED:"run_completed",RESULT_VIEWED:"result_viewed",TARGET_QUESTION_COPIED:"target_question_copied",LOOP_RETURNED:"loop_returned",LOOP_COMPLETED:"loop_completed",STATE_CORRECTED:"state_corrected",CARD_EXPORTED:"card_exported",CANDIDATE_SUBMITTED:"candidate_submitted",RETURN_VISIT:"return_visit",CHIP_ROW_RENDERED:"chip_row_rendered",CHIP_SELECTED:"chip_selected",CHIP_INSTRUCTION_COPIED:"chip_instruction_copied",CHIP_PAIR_INITIATED:"chip_pair_initiated",CHIP_PAIR_COMPLETED:"chip_pair_completed",STAGE_CHANGED:"stage_changed",FOLLOW_UP_REVEALED:"follow_up_revealed",TIMEOUT:"timeout",CAPACITY_DEGRADATION:"capacity_degradation",CAPTURE_UNCERTAIN:"capture_uncertain",RESTORED_SESSION:"restored_session"},wa=Object.values(A),$n=new Set(wa),qn=["run","state","from_state","to_state","check","mode","gap","eligible","source","idempotent","initiator","instruction_version","chip","conditions","ms","reason"],Mn=new Set(qn),Fn=64;function Un(e={}){let t={};if(!e||typeof e!="object"||Array.isArray(e))return t;for(let a of Mn){let n=e[a];if(n!=null){if(typeof n=="number")Number.isFinite(n)&&(t[a]=n);else if(typeof n=="boolean")t[a]=n;else if(typeof n=="string"){let r=n.trim();r&&(t[a]=r.slice(0,Fn))}}}return t}function ga(e,t={},a=Date.now()){return $n.has(e)?{name:e,ts:Number.isFinite(a)?Math.round(a):0,...Un(t)}:null}function Et(e){let t=Array.isArray(e)?e.filter(m=>m&&typeof m.name=="string"):[],a=m=>t.reduce((_,p)=>p.name===m?_+1:_,0),n=a(A.TARGET_QUESTION_COPIED),r=a(A.LOOP_COMPLETED),s=a(A.CHIP_INSTRUCTION_COPIED),o=a(A.CHIP_PAIR_COMPLETED),c={},i={};for(let m of t)m.name===A.LOOP_COMPLETED&&m.state&&(c[m.state]=(c[m.state]||0)+1),m.name===A.CHIP_PAIR_COMPLETED&&m.state&&(i[m.state]=(i[m.state]||0)+1);let d={};for(let m of wa)d[m]=a(m);return{counts:d,completed_by_state:c,chip_completed_by_state:i,loop_completion_rate:n>0?r/n:null,chip_completion_rate:s>0?o/s:null}}function ya(){return{armed:!0}}function va(e,t){let a=e&&typeof e.armed=="boolean"?e.armed:!0;return t?a?{state:{armed:!1},scroll:!0}:{state:{armed:!1},scroll:!1}:{state:{armed:!0},scroll:!1}}var Na=["single_yes","single_no"],ka=["paired_small","paired_noticeable","paired_large"],Ps=[...Na,...ka];function xa(e){return e==="single"?{mode:"single",prompt:"Did this surface something you hadn't considered?",options:[{id:"yes",label:"Yes",value:"single_yes"},{id:"no",label:"No",value:"single_no"}]}:e==="paired"?{mode:"paired",prompt:"How big did the difference feel?",options:[{id:"small",label:"Small",value:"paired_small"},{id:"noticeable",label:"Noticeable",value:"paired_noticeable"},{id:"large",label:"Large",value:"paired_large"}]}:null}function Ea(e,t){return e==="single"?Na.includes(t):e==="paired"?ka.includes(t):!1}var ie={register_heading:"Questions worth asking",register_note:"Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers, not verdicts \u2014 copy a question and check it against a source.",top_label:"Worth asking first",expand_label:"Show the full register",collapse_label:"Show fewer",labels:{trigger:"Trigger",proposition:"Rests on",dependent:"Which carries",dependency:"How they connect",evidence:"Quoted from the answer",verification:"Worth asking",resolver:"Where to check",status:"Status"},provisional_label:"Provisional \u2014 a pointer, not a verdict",copy_affordance:"Copy the question",copied_affordance:"Copied",finding_labels:{omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"},resolver_labels:{authority:"Check against an authority",document:"Check against the document",calculation:"Re-run the calculation",direct_question:"Ask the question directly"},status_labels:{open:"Open",resolved:"Resolved",dismissed:"Set aside"}};var Bn="review-graph.v0.3.1",Ca="review-record.c14n.v1",Hn="review-record.v1",Gn="sha256",Wn=new Set(["open","resolved","dismissed"]);var zn="This is a record of what was examined and what was resolved. It holds provisional discovery outputs: each check is a pointer worth checking against a source, never a verdict on the answer. The integrity block is an unkeyed SHA-256 digest over the record's canonical form \u2014 a fixity check that the listed contents have not shifted since export, not a signature and not proof of who produced it. The record claims nothing beyond what it lists.",Xe={action_label:"Download review record",downloaded_label:"Downloaded",action_hint:"A record of what was examined and resolved, as JSON.",download_error:"Could not download the review record"},jn=new Set(["created_at","supplied_at","inspection_run_at","at"]);function Sa(e){if(typeof e!="string"||e==="")return e;let t=e.replace(/(\.\d{3})\d+/,"$1"),a=new Date(t);if(Number.isNaN(a.getTime()))throw new Error(`review-record.c14n.v1: unparseable timestamp ${JSON.stringify(e)}`);return a.toISOString()}function Ct(e,t){if(typeof e=="string")return jn.has(t)?Sa(e):e;if(Array.isArray(e))return e.map(a=>Ct(a,t));if(e&&typeof e=="object"){let a={};for(let n of Object.keys(e).sort())a[n]=Ct(e[n],n);return a}return e}function Vn(e){let t=e&&typeof e=="object"?e:{},a={};for(let n of Object.keys(t))n!=="integrity"&&(a[n]=t[n]);return JSON.stringify(Ct(a,null))}async function Yn(e){let t=new TextEncoder().encode(String(e)),a=globalThis.crypto&&globalThis.crypto.subtle;if(!a)throw new Error("review-record.c14n.v1: WebCrypto SHA-256 is unavailable in this environment");let n=await a.digest("SHA-256",t),r=new Uint8Array(n),s="";for(let o=0;o<r.length;o++)s+=r[o].toString(16).padStart(2,"0");return s}async function Kn(e){return Yn(Vn(e))}function q(e){return typeof e=="string"?e:""}function Aa(e){return Wn.has(e)?e:null}function Qn({result:e,checkStates:t={},createdAt:a,pair:n=null}={}){let r=q(a);if(!r)throw new Error("assembleReviewRecord: createdAt (ISO 8601) is required");let o=(e&&e.receipt||{}).open_run||{},c=o.provenance||{},i=e&&e.checks||{},d=i.inspector||{},m=q(c.request_id)||"inspection",_=q(c.run_timestamp)||r,h=[{id:"original_answer",role:"original_answer",body:q(o.answer),source_model_user_reported:{name:q(o.declared_model),version:""},verified:!1,supplied_at:_}],l={model:q(d.model)||q(c.reader_model_version),model_version:q(d.model_version)||q(c.reader_model_version),prompt_version:q(d.prompt_version)||q(c.inspector_prompt_version)},b=l,v=[];if(n&&typeof n=="object"&&typeof n.targeted_answer=="string"){let g=n.targeted_source_model&&typeof n.targeted_source_model=="object"?n.targeted_source_model:{};h.push({id:"targeted_answer",role:"targeted_answer",body:n.targeted_answer,source_model_user_reported:{name:q(g.name),version:q(g.version)},verified:!1,supplied_at:q(n.targeted_supplied_at)||_}),v.push(ha({targeted_prompt:q(n.targeted_prompt),original_artifact_id:"original_answer",targeted_artifact_id:"targeted_answer",capture:n.capture,initiator:fe.INSPECTION_FOLLOWUP,targeted_prompt_hash:q(n.targeted_prompt_hash)})),n.inspector&&typeof n.inspector=="object"&&(b={model:q(n.inspector.model)||l.model,model_version:q(n.inspector.model_version)||l.model_version,prompt_version:q(n.inspector.prompt_version)||l.prompt_version})}let y=Array.isArray(i.detector_events)?i.detector_events:[],k=(Array.isArray(i.checks)?i.checks:[]).map(g=>{let P=Aa(t[g&&g.id])||Aa(g&&g.status)||"open";return{id:q(g.id),detector_event_id:q(g.detector_event_id),subclass:q(g.subclass),proposition_at_issue:g.proposition_at_issue,dependent_output:g.dependent_output,demonstration:g.demonstration,verification_action:g.verification_action,ranking:g.ranking,status:P}}),O={artifacts:h,pair_runs:v,detector_events:y,checks:k,resolution_evidence:[],inspector:b,versions:{schema:Bn,canonicalization:Ca,record:Hn,check_model:q(i.version)},timestamps:{created_at:r,inspection_run_at:_},method_note:zn};return{id:`rr_${m}`,inspection_ids:[m],created_at:r,contents:O,integrity:{algorithm:Gn,canonicalization:Ca,digest:""}}}async function Ta(e){let t=Qn(e);return t.integrity.digest=await Kn(t),t}function Ra(e){let t=q(e&&e.integrity&&e.integrity.digest),a=q(e&&e.created_at),n="unknown";if(a){let s=Sa(a);s&&(n=s.slice(0,10))}let r=t?t.slice(0,8):"00000000";return`imbas-review-record-${n}-${r}.json`}var At="S1",St="S2",Ia="S3",Tt="S4",Jn="S5\u2218S3",Xn="S5\u2218S4",Fe={heading:"Why this inspection matters",section_labels:{what:"What happened",why:"Why this matters",next:"What you can do next"},states:{[At]:{what:"The Reader inspected this answer and didn't surface anything that met its bar for a check under the tested conditions.",why:"That's a record of what was inspected, not a verdict on the answer. An inspection that surfaces nothing is not a clean bill of health.",next:"Run the same inspection on a fresh question, or copy the record of this inspection."},[St]:{what:"The inspection surfaced {N} item(s) worth checking before this answer gets used.",why:"The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",next:"Open the checks, copy a verification question into your own AI, or export the review record."},[Ia]:{what:"The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",why:"That's a comparison recorded under these conditions. It does not establish that nothing was left out.",next:"Try a different targeted question, run the pair with another model, or export the record."},[Tt]:{what:"The targeted answer contained material the open answer did not.",why:"The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",next:"Review the checks, run the pair again, or export the review record."}},s5_condition_line:"The compared answers were produced under unmatched or unverified conditions, so differences may reflect changed conditions rather than response behavior alone.",archive_boundary:"Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",method_link:{label:"How admission works",href:"/how-it-works.html"}};function Zn(e,t){let a=Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,n=`${a} item${a===1?"":"s"}`;return String(e).replace("{N} item(s)",n).replace("{N}",String(a))}function ot(e,{n:t,s5:a}={}){let n=Fe.states[e],r=a?[n.why,Fe.s5_condition_line]:[n.why];return{heading:Fe.heading,section_labels:Fe.section_labels,what:Zn(n.what,t),why:r,next:n.next,archive_boundary:Fe.archive_boundary,method_link:Fe.method_link}}function Oa({pairRuns:e,findings:t,conditionsMatched:a}={}){let n=Array.isArray(e)&&e.length>0,r=Array.isArray(t)?t.length:Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,s=r>0;if(!n)return s?{state_id:St,copy:ot(St,{n:r})}:{state_id:At,copy:ot(At)};let o=s?Tt:Ia;return Je({conditions_matched:a})?{state_id:o===Tt?Xn:Jn,copy:ot(o,{n:r,s5:!0})}:{state_id:o,copy:ot(o,{n:r})}}var tt="inspect",we="chips",Ze="compose",Rt="inspecting",It="result",Ot="followup",Pt="compare",Dt="delta",Ee="chips",et=[Ze,Rt,It,Ot,Pt,Dt],Da=[...et,Ee],Ue="compose-answer",Pa="paired-answer",er="chip-answer",Lt="advance",La="init",$a="pop";function $t(e={}){let{lane:t=tt,busy:a=!1,hasResult:n=!1,hasAct2:r=!1,followUpOpen:s=!1,hasDelta:o=!1}=e;return t===we?Ee:a?Rt:n?o?Dt:s?Pt:r?Ot:It:Ze}function qt(e){switch(e){case Ze:return{answerEntry:Ue,readOnly:[],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!1,focus:"compose-answer",degradedNextAction:"run-reader"};case Rt:return{answerEntry:null,readOnly:[Ue],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!1,loop:!1,focus:"status",degradedNextAction:"resolves-to-fallback-result"};case It:return{answerEntry:null,readOnly:[Ue],pasteBox:!0,result:!0,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"result-heading",degradedNextAction:"read-result-or-restart"};case Ot:return{answerEntry:null,readOnly:[Ue],pasteBox:!0,result:!0,act2:!0,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"act2-heading",degradedNextAction:"copy-instruction-and-run-externally"};case Pt:return{answerEntry:Pa,readOnly:[Ue],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!1,loop:!1,focus:"paired-answer",degradedNextAction:"run-externally-comparison-deferred"};case Dt:return{answerEntry:null,readOnly:[Ue,Pa],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!0,loop:!0,focus:"delta-heading",degradedNextAction:"keep-receipt-or-restart"};case Ee:return{answerEntry:er,readOnly:[],pasteBox:!1,result:!1,act2:!1,pairedInput:!1,chipLane:!0,chipDoor:!0,loop:!1,focus:"chip-answer",degradedNextAction:"copy-instruction-and-run-externally"};default:return qt(Ze)}}function qa(e,t){if(e===t)return!1;if(t===Ee)return!0;if(e===Ee)return!1;let a=et.indexOf(e),n=et.indexOf(t);return a!==-1&&n!==-1&&n>a}function Ma(e,t,a){let n=a===Lt&&qa(e,t);return{from:e,to:t,cause:a,emit:n,skipped:n&&tr(e,t)}}function tr(e,t){let a=et.indexOf(e),n=et.indexOf(t);return a!==-1&&n!==-1&&n-a>1}function Mt({search:e="",hash:t=""}={}){let r=new URLSearchParams(e.startsWith("?")?e.slice(1):e).get("start")==="chips"?we:tt,s=String(t||"").replace(/^#/,""),o=/(?:^|&)stage=([a-z-]+)/.exec(s),c=o&&Da.includes(o[1])?o[1]:null;return{lane:r,stage:c}}function Fa(e,t={}){let a=$t(t);return!e||!Da.includes(e)?{stage:a,rewrite:!1,reason:"no-stage-hash"}:e===Ee?{stage:Ee,rewrite:!1,reason:"chip-lane-self-contained"}:qa(a,e)?{stage:a,rewrite:!0,reason:"stale-stage-hash"}:{stage:e,rewrite:!1,reason:"supported"}}function Ua(e){return e===Ze?"":`#stage=${e}`}var{useState:u,useEffect:F,useRef:M}=React,L={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},ge="'Fraunces', Georgia, serif",Y="'Inter', ui-sans-serif, system-ui, sans-serif",K="'JetBrains Mono', ui-monospace, monospace",nr="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",me="wb-input wb-focus",rr=`
.wb-focus:focus-visible { outline: 2px solid ${L.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${L.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,sr=`
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
  font-family: ${ge};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${L.text};
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
  font-family: ${K};
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
`,or=`
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
  font-family: ${K};
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(222, 111, 56, 0.88);
  line-height: 1.35;
  flex-shrink: 0;
}
.wb-build-note__text {
  font-family: ${Y};
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
  font-family: ${K};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${K};
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
  font-family: ${K};
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
  font-family: ${K};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${K};
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
`,ir=`
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
  font-family: ${K};
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
  font-family: ${Y};
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
  font-family: ${K};
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
  font-family: ${ge};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${L.text};
  margin: 0 0 0.36rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__heading {
  margin: 0 0 0.32rem;
}
.wb-suggest-module__eyebrow {
  font-family: ${K};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${ge};
  font-size: 18px;
  line-height: 1.28;
  color: rgba(242, 232, 220, 0.94);
}
.wb-suggest-module__support {
  font-family: ${Y};
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
  color: ${L.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${L.text} !important;
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
  color: ${L.textDim};
}
.wb-suggest-module__title {
  font-family: ${K};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${L.textDim};
  margin: 0 0 0.28rem;
  line-height: 1.32;
}
.wb-suggest-module__lead {
  font-family: ${Y};
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
  color: ${L.text};
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
  background: ${L.accent} !important;
  border-color: ${L.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${L.accentSoft} !important;
  border-color: ${L.accentSoft} !important;
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
  font-family: ${Y};
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
  font-family: ${K};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(180, 106, 90, 0.9);
  margin: 0 0 0.5rem;
}
.wb-result-hero__estimate {
  font-family: ${ge};
  font-weight: 500;
  font-size: clamp(1.5rem, 5.2vw, 2.35rem);
  line-height: 1.16;
  color: rgba(242, 232, 220, 0.97);
  margin: 0 0 0.5rem;
  text-wrap: balance;
}
.wb-result-hero__summary {
  font-family: ${Y};
  font-size: clamp(1rem, 2.4vw, 1.125rem);
  line-height: 1.5;
  color: rgba(226, 212, 196, 0.92);
  margin: 0;
}
.wb-result-hero__why {
  font-family: ${Y};
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
  font-family: ${Y};
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(220, 206, 190, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.wb-guided-steps__n {
  font-family: ${K};
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
  font-family: ${Y};
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
  font-family: ${Y};
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
  font-family: ${Y};
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
  font-family: ${Y};
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
`,cr=`
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
  font-family: ${K};
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
  font-family: ${Y};
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
`,He=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",reveal:"In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",reveal:"In Imbas Case 018, 3 of 4 tested frontier models did not name PDUFA user fees in the open answer.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that models often describe Palantir\u2013ICE contracts without clearly naming the surveillance and deportation context.",reveal:"In Imbas Case 003, across the 4 tested frontier models, Palantir's ICE contract scope stayed under-surfaced on the open answer.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",reveal:"In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",reveal:"In Imbas Case 013, all 4 tested frontier models surfaced the Sackler accountability layer on the open answer. It is the smallest gap in the dataset.",cardShort:"OxyContin & Sacklers"}],lr={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function dr({caseId:e,caseTitle:t,model:a,verdict:n,runDate:r}){let{keyAnchor:s,significance:o}=lr[e],c={gap_held:`gap held \u2014 the answer did not name ${s}, ${o}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${s}, ${o}.`,key_found:`gap closed \u2014 the answer surfaced ${s}. This gap may be narrowing since May 2026.`},i=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${t}`,`My run (${a}, ${r}): ${c[n]}`,i,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var ur=["ChatGPT","Claude","Gemini","Grok","Other"];function pr(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function mr(e){if(!(e!=null&&e.ready))return"";let t=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${t}`}function _r(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function an(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function Ba({c:e}){let t=e?an(e):null;return t?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},t.caseLine," \xB7 VERIFIED ",t.verified.toUpperCase())):null}function hr(e){return He.find(t=>t.id===e)}function nn(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function C({children:e,onClick:t,kind:a="primary",disabled:n,small:r,className:s=""}){let o={fontFamily:Y,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:r?"10px 16px":"12px 22px",borderRadius:6,cursor:n?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:n?.4:1},c={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${a}${r?" wb-btn--small":""}${s?` ${s}`:""}`,onClick:n?void 0:t,disabled:n,style:{...o,...c[a]}},e)}function ye({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function ce({label:e,children:t}){return React.createElement("label",{className:"wb-field"},React.createElement(ye,null,e),t)}function Ge({label:e,value:t,onChange:a,error:n,placeholder:r,rows:s=9,style:o,minAckLength:c=1,readOnly:i=!1,inputRef:d=null}){let[m,_]=u(!1),[p,h]=u(null);return React.createElement(ce,{label:e},React.createElement("textarea",{ref:d,rows:s,value:t,onChange:b=>{let v=b.target.value;a(v),!cn(v)&&v.trim().length>=c?(h(nn(v)),_(!0)):(h(null),_(!1))},placeholder:r,className:`${me}${m?" is-paste-received":""}`,style:o||We,"aria-invalid":n?!0:void 0,readOnly:i||void 0,"aria-readonly":i||void 0}),p&&!n?React.createElement("div",{className:"wb-paste-ack"},p," words received"):null,n?React.createElement("div",{className:"wb-field-error",role:"alert"},n):null)}var We={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:L.text,border:`1px solid ${L.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:Y,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function Ht({value:e,onChange:t}){return React.createElement("select",{value:e,onChange:a=>t(a.target.value),className:me,style:{...We,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),ur.map(a=>React.createElement("option",{key:a,value:a,style:{color:"#111"}},a)))}function Qt({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function br(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function fr(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var Gt="imbas_wb_email";function rn(){try{return localStorage.getItem(Gt)||""}catch(e){return""}}function wr(e){try{e?localStorage.setItem(Gt,e):localStorage.removeItem(Gt)}catch(t){}}var sn="imbas_reader_events",Ha=500;function Jt(){try{let e=localStorage.getItem(sn),t=e?JSON.parse(e):[];return Array.isArray(t)?t:[]}catch(e){return[]}}function D(e,t={}){let a=ga(e,t);if(!a)return null;try{let n=Jt();n.push(a);let r=n.length>Ha?n.slice(n.length-Ha):n;localStorage.setItem(sn,JSON.stringify(r))}catch(n){}return a}function Ft(e){var t,a,n;return((n=(a=(t=e==null?void 0:e.receipt)==null?void 0:t.open_run)==null?void 0:a.provenance)==null?void 0:n.request_id)||""}function gr({onFollow:e,onSkip:t}){let[a,n]=u(""),r=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(ye,null,"Your email"),React.createElement("input",{type:"email",value:a,placeholder:"you@domain.com",onChange:s=>n(s.target.value),className:me,style:{...We,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"primary",disabled:!r,onClick:()=>e(a)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(C,{kind:"ghost",onClick:t},"Continue without email \u2192")))}function yr(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function on(e,t,a){let n=t.map(i=>({term:i,found:yr(e,i),isKey:a.includes(i)})),r=n.some(i=>i.found),s=n.some(i=>i.found&&i.isKey),o;r?s?o="key_found":o="partial":o="gap_held";let c={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[o];return{tokens:n,verdict:o,verdictLine:c}}function vr(e,t){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:t!=null&&t>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function Xt({title:e,children:t,className:a="",defaultOpen:n=!1}){let[r,s]=u(n);return React.createElement("div",{className:`wb-collapsible${r?" is-open":""}${a?` ${a}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>s(o=>!o),"aria-expanded":r},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},r?"Collapse":"Expand")),r?React.createElement("div",{className:"wb-collapsible__body"},t):null)}function Nr(e){if(!e.length)return[];let t=[...e].sort((n,r)=>n[0]-r[0]),a=[t[0]];for(let n=1;n<t.length;n++){let r=a[a.length-1];t[n][0]<=r[1]?r[1]=Math.max(r[1],t[n][1]):a.push(t[n])}return a}function kr(e,t){let a=[];for(let n of t){let r=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=new RegExp(`(^|[^a-zA-Z0-9])(${r})($|[^a-zA-Z0-9])`,"gi"),o;for(;(o=s.exec(e||""))!==null;){let c=o.index+o[1].length;a.push([c,c+o[2].length])}}return Nr(a)}function Ga(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function xr(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var Wa="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function cn(e){let t=(e||"").trim().split(/\s+/).filter(Boolean);return t.length<20||t.some(a=>a.length>40)?Wa:""}function Er(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").exec(e||"");return r?r.index:-1}function Cr(e,t){let a=cn(e);if(a)return a;let n=(e||"").trim();if(n.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let r=Ga(n);return xr(t).some(s=>Ga(s)===r)?"Paste the model's actual answer from your own chat.":""}function za({text:e,terms:t,litTerms:a}){let n=a||new Set(t.filter(i=>i.found).map(i=>i.term)),r=t.filter(i=>i.found&&n.has(i.term)).map(i=>i.term),s=kr(e,r);if(!s.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:ge,fontSize:15,lineHeight:1.55,color:L.text}},e);let o=[],c=0;return s.forEach(([i,d],m)=>{c<i&&o.push(React.createElement("span",{key:`t-${m}`},e.slice(c,i))),o.push(React.createElement("span",{key:`h-${m}`,style:{color:L.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(i,d))),c=d}),c<e.length&&o.push(React.createElement("span",{key:"tail"},e.slice(c))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:ge,fontSize:15,lineHeight:1.55,color:L.text}},o)}var ja="/api/repository";function Ar(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function Sr(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function Wt(e){if(!ja)return{ok:!1};let t=document.getElementById("wb-hp"),a=t&&typeof t.value=="string"?t.value:"";try{let n=await fetch(ja,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:a})}),r=null;try{r=await n.json()}catch(s){}return!n.ok||r&&r.ok===!1?{ok:!1}:{ok:!0}}catch(n){return{ok:!1}}}function ln({candidate:e}){let[t,a]=u(!1),n=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your candidate below and email it to brendan@imbaslabs.com"),React.createElement(Xt,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(C,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"))))}function Tr({candidate:e,submitOk:t}){return t?React.createElement(Rr,{candidate:e}):React.createElement(ln,{candidate:e})}function Rr({candidate:e}){let[t,a]=u(!1),n=JSON.stringify(e,null,2);return React.createElement(Xt,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(C,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function Ir({caseId:e,caseTitle:t,model:a,anchors:n,runDate:r}){let[s,o]=u(!1),c=dr({caseId:e,caseTitle:t,model:a,verdict:n.verdict,runDate:r}),i="https://twitter.com/intent/tweet?text="+encodeURIComponent(c);return React.createElement(Xt,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},c),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(C,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(c),o(!0),setTimeout(()=>o(!1),1800)}catch(m){}}},s?"Copied \u2713":"Copy result"),React.createElement("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function Zt(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function at(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function Ce(e,t){if(typeof window=="undefined"||!e){t==null||t();return}at();let a=Zt(),n=document.documentElement,r=parseFloat(getComputedStyle(n).getPropertyValue("--header-offset"))||77,s=parseFloat(getComputedStyle(n).getPropertyValue("--scroll-anchor-gap"))||12,o=e.getBoundingClientRect().top+window.scrollY-r-s-6;window.scrollTo({top:Math.max(0,o),behavior:a?"auto":"smooth"}),t&&window.setTimeout(t,a?0:420)}function Or(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}function Pr(){if(typeof window=="undefined")return!1;try{return new URLSearchParams(window.location.search).get("funnel")==="1"}catch(e){}return!1}var Dr="/api/read",Lr="/api/reader-perception";function $r(e){let t=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:t.filter(a=>a.found).map(a=>a.term),missing:t.filter(a=>!a.found).map(a=>a.term)}}function qr({mode:e,sel:t,question:a,answer:n,topic:r,model:s}){if(e==="guided"){let o=on((n||"").trim(),t.detect||[],t.keyDetect||[]);return{case:{topic:t.topic||t.title||"Guided case",anchor:t.mechanism||t.anchor||"",why_it_matters:t.whyItMatters||""},open_question:t.openPrompt,answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:$r(o)}}return{case:{topic:(r||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(a||"").trim(),answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function Mr(e){let t=await fetch(Dr,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){if(t.status===400){let a=await t.json().catch(()=>({}));if(a&&a.error==="too_long")throw new Error("too_long")}throw new Error(`read_${t.status}`)}return t.json()}var dn="/api/read-paired";async function Fr(e,t){let a=await fetch(dn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:e,targeted_answer:t})}),n=await a.json().catch(()=>({}));if(!a.ok){let r=new Error(n&&n.error||`paired_${a.status}`);throw r.status=a.status,r.info=n||{},r}return n}async function Va(e){let t=new TextEncoder().encode(String(e)),a=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(a)).map(n=>n.toString(16).padStart(2,"0")).join("")}async function Ur(e,t){let a=await Va(e),n={receipt_type:"single",schema_version:na,generated_at:t,open_run:{question:"",answer:e,provenance:{request_id:a.slice(0,16)}},integrity:{content_hash:null}};return n.integrity.content_hash=await Va(ra(n)),n}async function Br({firstAnswer:e,targetedAnswer:t,chipId:a,instructionVersion:n}){let r=await Ur(e,new Date().toISOString()),s=await fetch(dn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:r,targeted_answer:t,initiator:fe.USER_CHIP,chip_id:a,instruction_version:n})}),o=await s.json().catch(()=>({}));if(!s.ok){let c=new Error(o&&o.error||`chip_paired_${s.status}`);throw c.status=s.status,c.info=o||{},c}return o}var Ut=800,Ya=100,Hr=80,Ka=400,Bt=700,zt=3,Gr=1.08;function Qa(e){return 180-Math.min(Math.max(e,0),zt)/zt*180}function Be(e,t,a,n){let r=n*Math.PI/180;return{x:e+a*Math.cos(r),y:t-a*Math.sin(r)}}function Ja(e,t,a,n,r){let s=Be(e,t,a,n),o=Be(e,t,a,r),c=Math.abs(n-r)>180?1:0,i=n>r?1:0;return`M ${s.x} ${s.y} A ${a} ${a} 0 ${c} ${i} ${o.x} ${o.y}`}function Wr({needleValue:e,settled:t}){let s=Qa(Math.min(e,zt)),o=Be(120,84,52,s),c=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${t?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:Ja(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:Ja(120,84,58,180,s),stroke:L.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:t?.76:.42}):null,c.map(i=>{let d=Qa(i),m=Be(120,84,61,d),_=Be(120,84,50,d),p=Be(120,84,36,d);return React.createElement("g",{key:i},React.createElement("line",{x1:_.x,y1:_.y,x2:m.x,y2:m.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:p.x,y:p.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:K},i))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:o.x,y2:o.y,stroke:L.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:L.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:o.x,cy:o.y,r:"1.6",fill:L.accentSoft,opacity:t?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function zr({answer:e,anchors:t,caseId:a,caseTitle:n,model:r,runDate:s,gap:o,category:c,observedDate:i,candidate:d,submitOk:m,sequenceReady:_=!0,onAnotherCase:p,onEmailFollow:h}){let l=hr(a),b=o!=null?o:l==null?void 0:l.gap,v=c||(l==null?void 0:l.category),y=t.tokens,N=M(Zt()),[k,O]=u(!1),g=M(null),[P,H]=u(!1),[U,R]=u(()=>N.current&&b!=null?b:0),[I,z]=u(()=>N.current&&b!=null?b:0),[ee,te]=u(N.current),[x,J]=u(()=>N.current?new Set(y.filter(T=>T.found).map(T=>T.term)):new Set),[_e,S]=u(!1),[w,V]=u(N.current?y.length:0),[he,le]=u(N.current),[ve,se]=u(!1),[ze,Ae]=u(N.current),[je,Ne]=u(N.current&&y.some(T=>!T.found)),[nt,Se]=u(N.current&&y.some(T=>T.isKey&&T.found)),Ve=y.some(T=>!T.found),ae=nn(e);F(()=>{var B;if(!g.current)return;let T=(B=g.current.closest(".wb-answer-row"))==null?void 0:B.querySelector(".wb-answer-row__bar");T&&T.style.setProperty("--sweep-travel",`${Math.max(T.offsetHeight-2,40)}px`)},[e,_]),F(()=>{if(!_||b==null)return;if(N.current){R(b),z(b),te(!0);return}R(0),z(0),te(!1);let T=performance.now(),B=0,ue=pe=>1-(1-pe)**3,ne=pe=>{let j=Math.min(1,(pe-T)/Ut);R(Math.round(ue(j)*b*10)/10);let G=b*Gr;if(j<.82){let xe=j/.82;z(ue(xe)*G)}else{let xe=(j-.82)/.18;z(G+(b-G)*ue(xe))}j<1?B=requestAnimationFrame(ne):(z(b),te(!0))};return B=requestAnimationFrame(ne),()=>cancelAnimationFrame(B)},[_,b,a]),F(()=>{if(!_)return;if(N.current){J(new Set(y.filter(G=>G.found).map(G=>G.term))),S(!1),V(y.length),le(!0),se(!0),Ae(!0),Ne(Ve),Se(y.some(G=>G.isKey&&G.found));let j=setTimeout(()=>se(!1),50);return()=>clearTimeout(j)}J(new Set),S(!1),V(0),le(!1),se(!1),Ae(!1),Ne(!1),Se(!1);let T=[],B=(j,G)=>{T.push(setTimeout(j,G))};y.forEach((j,G)=>{B(()=>{V(G+1),j.isKey&&j.found&&Se(!0)},Ut+G*Ya)});let ue=Ut+y.length*Ya;Ve&&B(()=>Ne(!0),ue+50);let ne=ue+Hr;B(()=>{le(!0),se(!0)},ne),B(()=>Ae(!0),ne+Ka),B(()=>se(!1),ne+720);let pe=ne+Ka+120;return B(()=>S(!0),pe),y.forEach(j=>{if(!j.found)return;let G=Er(e,j.term),xe=G>=0?G/Math.max(e.length,1)*Bt:Bt;B(()=>{J(it=>new Set([...it,j.term]))},pe+xe)}),B(()=>S(!1),pe+Bt),()=>{T.forEach(clearTimeout)}},[y.length,a,e,_]);let de=`wb-result-inner wb-output-module${ve?" is-verdict-pulse":""}${N.current?" is-reveal-instant":""}`,be=l?an(l):null,ke=vr(t.verdict,b);return React.createElement("div",{className:de},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},be?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},be.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",be.verified))):null),React.createElement("div",{className:"wb-output-module__body"},b!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${b.toFixed(1)} out of 3`},U.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${ke.tone}${he?" is-visible":""}`},ke.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(Wr,{needleValue:I,settled:ee}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},v?React.createElement("span",null,v):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(ye,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},y.map((T,B)=>{let ne=`wb-token-chip${B<w?" is-visible":""}${T.found?" is-found":" is-missing"}`;return React.createElement("li",{key:T.term,className:ne},T.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},T.term,T.isKey?" (key)":""," \xB7 ",T.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${P?" is-expanded":""}`},React.createElement("div",{ref:g,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement(za,{text:e,terms:t.tokens,litTerms:x})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${_e?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>H(T=>!T),"aria-expanded":P},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",ae," words"),React.createElement("span",{className:`wb-answer-row__chevron${P?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${P?" is-open":""}`},React.createElement(za,{text:e,terms:t.tokens,litTerms:x})))),React.createElement("div",{className:"wb-result-footnote"},Ve?React.createElement("p",{className:`wb-result-discovery-beat${je?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),a==="006"&&he?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${ze?" is-visible":""}`},React.createElement(Ir,{caseId:a,caseTitle:n,model:r,anchors:t,runDate:s}),React.createElement(Tr,{candidate:d,submitOk:m})),ze&&!k&&!rn()?React.createElement(gr,{onFollow:T=>{wr(T),O(!0),h&&h(T)},onSkip:()=>O(!0)}):null,p?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:p},"Test another case \u21BA")):null)}function jr(){let[e,t]=u(He[0]),[a,n]=u(0),[r,s]=u(()=>rn()),[o,c]=u(""),[i,d]=u(""),[m,_]=u(!1),[p,h]=u(null),[l,b]=u(null),[v,y]=u(!1),[N,k]=u(""),[O,g]=u(!1),[P,H]=u("idle"),U=M(null),R=M(null),I=M(!1);F(()=>{if(!I.current){I.current=!0,at();return}if(a===2)return;let S=a===1?U.current:R.current,w=window.requestAnimationFrame(()=>Ce(S));return()=>window.cancelAnimationFrame(w)},[a]);let z=()=>{n(0),c(""),d(""),h(null),b(null),k(""),g(!1),_(!1)},ee=S=>{if(!S.ready||S.id===e.id)return;let w=Zt(),V=()=>{t(S),z(),H("in"),window.setTimeout(()=>H("idle"),w?0:200)};if(w){V();return}H("out"),window.setTimeout(V,200)},te=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),y(!0),setTimeout(()=>y(!1),2e3)}catch(S){}},x=()=>{Ce(U.current,()=>g(!0))},J=async()=>{let S=Cr(i,e);if(S){k(S);return}k(""),_(!0),g(!1);let w=on(i,e.detect,e.keyDetect),V=w.verdict!=="key_found",he=new Date().toISOString().slice(0,10),le={answer:i,anchors:w,caseId:e.id,caseTitle:e.title,model:o,runDate:he,gap:e.gap,category:e.category,observedDate:e.observedDate},ve=Ar({mode:"curated",case_id:e.id,model:o,email:r,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:i,gap_held:V,detect_verdict:w.verdict}),se=await Wt(ve);h({...le,submitOk:se.ok}),b(ve),_(!1),n(2),window.requestAnimationFrame(x)},_e=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",a===2?"is-result":"",P==="out"?"is-crossfade-out":"",P==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:R,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},He.map(S=>{let w=S.id===e.id;return React.createElement("button",{key:S.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${w?" is-active":""}${S.ready?"":" is-disabled"}`,onClick:()=>ee(S),disabled:!S.ready},S.ready?React.createElement("div",{className:"wb-specimen-plate__label"},pr(S)):React.createElement(ye,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},S.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:U,className:_e},a===2&&p?React.createElement(zr,{...p,candidate:l,sequenceReady:O,onAnotherCase:z,onEmailFollow:S=>{s(S);let w={...l,email:S};b(w),Wt(w)}}):a===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(Ba,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(ce,{label:"Which AI did you ask?"},React.createElement(Ht,{value:o,onChange:c}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(Ge,{label:"Paste the model's open answer",value:i,onChange:S=>{d(S),k("")},error:N,placeholder:"Paste the full response here\u2026",minAckLength:20})),N?React.createElement("div",{className:"wb-field-error"},N):null,React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"primary",disabled:m||!o||i.trim().length<200,onClick:J},"Compare with what Imbas observed \u2192")),!m&&!N&&i.trim().length>0&&i.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(Ba,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(ye,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),a===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(ye,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(Qt,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:te,className:v?"is-copied":""},v?"Copied \u2713":"Copy question"),React.createElement(C,{kind:"primary",onClick:()=>n(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(fr,null),React.createElement(br,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(un,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var jt={...We,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},Xa={...jt,minHeight:"unset",resize:"vertical"};function un({variant:e="default"}){let[t,a]=u(!1),[n,r]=u("form"),[s,o]=u(""),[c,i]=u(""),[d,m]=u(""),[_,p]=u(""),[h,l]=u(!1),[b,v]=u(null),y=s.trim().length>=4,N=c.trim().length>=8,k=y&&N&&!h;async function O(){if(!k)return;l(!0),v(null);let g=Sr({topic:s.trim(),inspect_question:c.trim(),context:d.trim()||null,email:_.trim()||null,source:"workbench_suggest"}),P=await Wt(g);l(!1),P.ok?r("done"):v(g)}return n==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):t?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(ce,{label:"Topic or Question"},React.createElement("input",{className:me,type:"text",value:s,onChange:g=>o(g.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:jt}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ce,{label:"What should be inspected?"},React.createElement("textarea",{className:me,value:c,onChange:g=>i(g.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:Xa}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ce,{label:"Optional context, source, or link"},React.createElement("textarea",{className:me,value:d,onChange:g=>m(g.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:Xa}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(ce,{label:"Optional email for follow-up"},React.createElement("input",{className:me,type:"email",value:_,onChange:g=>p(g.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:jt}))),b?React.createElement(ln,{candidate:b}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(C,{kind:"primary",disabled:!k,onClick:O},h?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:()=>a(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(C,{kind:"primary",onClick:()=>a(!0)},"Suggest an investigation \u2192"))))}var Za={idle:"Paste an answer to inspect it.",needQuestion:"Add the question you asked.",ready:"Let's see what might be missing\u2026",inspecting:"Reading the answer\u2026",result:"Inspection complete."},en=["Reading the answer\u2026","Checking what might be missing\u2026","Found something to check\u2026"],Vr={full:"FULL",partial:"PARTIAL",thin:"THIN"},Vt={full:"The answer substantially served the question.",partial:"Some material context was missing or shaped.",thin:"The answer was evasive or substantially incomplete."};function Yr({state:e}){let[t,a]=u(0);F(()=>{if(e!=="inspecting"){a(0);return}let r=window.setInterval(()=>{a(s=>Math.min(s+1,en.length-1))},1100);return()=>window.clearInterval(r)},[e]);let n=e==="inspecting"?en[t]:Za[e]||Za.idle;return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},n))}function pn(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let a=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return a?a[1]:""}function Kr(e){let t=pn(e).toLowerCase();return _t(t)?mt:["no_key","disabled","bad_json"].includes(t)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function Yt(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function mn({mode:e,sel:t,result:a}){return(a==null?void 0:a.source)==="fallback"?"Fallback check":(a==null?void 0:a.source)!=="agent"?"Reader":e==="guided"&&(t!=null&&t.id)?`Reader agent \xB7 Case ${t.id}`:"Reader agent \xB7 Custom answer"}function _n(e){let t=(e==null?void 0:e.completeness)||"partial",a=t.toUpperCase(),n=Vt[t]||Vt.partial,r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],s=((e==null?void 0:e.how_it_was_shaped)||"").trim(),o=((e==null?void 0:e.inspection_note)||"").trim(),c=[`Completeness: ${a}`,n,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...r.length?r.map(i=>`- ${i}`):["- (none identified)"],"","HOW IT WAS SHAPED",s||"(none detected)"];return o&&c.push("","INSPECTION NOTE",o),c.join(`
`).trim()}function Qr({mode:e,sel:t,question:a,answer:n,model:r,topic:s,result:o}){let c=e==="guided"?t==null?void 0:t.openPrompt:a,i=(s||"").trim()||(e==="guided"?((t==null?void 0:t.topic)||"").trim():""),d=[];return(o==null?void 0:o.source)==="agent"&&d.push("Inspection receipt",mn({mode:e,sel:t,result:o}),""),d.push(`Question: ${(c||"").trim()}`),i&&d.push(`Topic / context: ${i}`),(r||"").trim()&&d.push(`AI used: ${r.trim()}`),d.push("","Answer",(n||"").trim()),o&&d.push("",_n(o)),d.push("","Behavior, not intent."),d.join(`
`).trim()}var Kt=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`;function Jr({copy:e,firstText:t,secondText:a,smallPrint:n}){let r=e||{},s={label:rt,text:(t||"").trim()},o={label:st,text:(a||"").trim()},c=r.swapPanels?[o,s]:[s,o],i=["IMBAS READER \u2014 Confirmation Loop",""];r.headline&&i.push(r.headline,"");for(let d of c)i.push(`${d.label}:`,d.text||Qe,"");return r.tag&&i.push(r.tag,""),(n||"").trim()&&i.push(`[${n.trim()}]`,""),i.push(X,"",Kt()),i.join(`
`).trim()}var tn={single:{title:"Share this inspection",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to \xB7 the unvalidated estimate (\u201CCandidate gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show your full answer \u2014 only the short excerpts above."]},paired:{title:"Share this two-question test",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the delta \u2014 what the second answer surfaced that the first did not \u2014 each with the short quoted excerpts from both answers \xB7 the unvalidated estimate (\u201CMachine gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show either full answer \u2014 only the short excerpts above."]}};function Xr(e,t){let a=t==null?void 0:t.error;return e===429?a==="daily_capacity"?"The Reader is at capacity for new shares today. Copy the full receipt for now.":"You've created several share links in a row. Please wait a moment and try again.":e===503||e===500||a==="unconfigured"?"Share links are not live yet. Copy the full receipt for now.":"Could not create share link. Copy the full receipt for now."}function Zr({mode:e,busy:t,error:a,onConfirm:n,onCancel:r}){let s=tn[e]||tn.single,o=M(null),c=`wb-share-consent-title--${e}`,i=`wb-share-consent-desc--${e}`,d=s.lines.map((m,_)=>`${i}-${_}`).join(" ");return F(()=>{o.current&&o.current.focus()},[]),F(()=>{let m=_=>{if(_.key==="Escape"){t||r();return}if(_.key!=="Tab")return;let p=o.current;if(!p)return;let h=Array.prototype.slice.call(p.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));if(h.length===0){_.preventDefault(),p.focus();return}let l=h[0],b=h[h.length-1],v=document.activeElement,y=p.contains(v);_.shiftKey?(!y||v===l||v===p)&&(_.preventDefault(),b.focus()):(!y||v===b||v===p)&&(_.preventDefault(),l.focus())};return document.addEventListener("keydown",m),()=>document.removeEventListener("keydown",m)},[t,r]),React.createElement("div",{className:"wb-share-consent",role:"presentation",onClick:t?void 0:r},React.createElement("div",{ref:o,tabIndex:-1,className:"wb-share-consent__panel wb-focus",role:"dialog","aria-modal":"true","aria-labelledby":c,"aria-describedby":d,onClick:m=>m.stopPropagation()},React.createElement("h3",{id:c,className:"wb-share-consent__title"},s.title),s.lines.map((m,_)=>React.createElement("p",{key:_,id:`${i}-${_}`,className:"wb-share-consent__line"},m)),a?React.createElement("p",{className:"wb-share-consent__error",role:"alert"},a):null,React.createElement("div",{className:"wb-share-consent__actions"},React.createElement(C,{kind:"ghost",small:!0,className:"wb-share-consent__confirm",onClick:n,disabled:t},t?"Creating share link\u2026":"Create share link"),React.createElement(C,{kind:"ghost",small:!0,onClick:r,disabled:t},"Cancel"))))}function hn({mode:e,receipt:t,onShared:a}){let[n,r]=u("idle"),[s,o]=u(""),[c,i]=u(""),d=M(null);if(!t)return null;let m=e==="paired"?"Share this two-question test":"Share this inspection",_=n==="consenting"||n==="creating",p=()=>{let N=d.current&&d.current.querySelector(".wb-reader-share__btn");N&&N.focus()};return React.createElement("div",{className:"wb-reader-share",ref:d},s&&(n==="ready"||n==="copied")?React.createElement("div",{className:"wb-reader-share__success",role:"status"},React.createElement("p",{className:"wb-reader-share__success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-share__url"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer"},s)),React.createElement("div",{className:"wb-reader-share__actions"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-share__open"},"Open share page"),React.createElement(C,{kind:"ghost",small:!0,className:n==="copied"?"is-copied":"",onClick:async()=>{if(s)try{await navigator.clipboard.writeText(s),r("copied"),setTimeout(()=>r("ready"),1600)}catch(N){i("Could not copy link. Select the link below and copy manually.")}}},n==="copied"?"Copied":"Copy share link"))):React.createElement(C,{kind:"ghost",small:!0,className:"wb-reader-share__btn",onClick:()=>{i(""),r("consenting")}},m),_?React.createElement(Zr,{mode:e,busy:n==="creating",error:c,onConfirm:async()=>{r("creating"),i("");try{let N=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:t})}),k=await N.json().catch(()=>({}));if(!N.ok||!k.ok||!k.share_url){console.warn("[imbas] inspection-share failed",N.status,k&&k.error),i(Xr(N.status,k)),r("consenting");return}typeof a=="function"&&a(k.share_url),o(k.share_url),r("ready");try{await navigator.clipboard.writeText(k.share_url),r("copied"),setTimeout(()=>r("ready"),1600)}catch(O){}}catch(N){console.warn("[imbas] inspection-share network error",N),i("Could not create share link. Copy the full receipt for now."),r("consenting")}},onCancel:()=>{n!=="creating"&&(i(""),r("idle"),p())}}):null)}function es({result:e,context:t,shareUrl:a}){let[n,r]=u(!1),[s,o]=u(!1),[c,i]=u(""),d=p=>{p(!0),i(""),setTimeout(()=>p(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(C,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${_n(e)}

${Kt(a)}`),d(r)}catch(p){i("Could not copy"),setTimeout(()=>i(""),2200)}}},n?"Copied":"Copy Result"),React.createElement(C,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Qr({...t,result:e})}

${Kt(a)}`),d(o)}catch(p){i("Could not copy"),setTimeout(()=>i(""),2200)}}},s?"Copied":"Copy Full Receipt"),c?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},c):null)}function ts({result:e,context:t,onRunAgain:a}){let[n,r]=u(""),s=(e==null?void 0:e.completeness)||"partial",o=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],c=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=((e==null?void 0:e.inspection_note)||"").trim(),d=(e==null?void 0:e.source)==="fallback",m=(e==null?void 0:e.source)==="agent",_=mn({mode:t.mode,sel:t.sel,result:e}),p=d?[Yt()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${s}${d?" is-fallback":""}${m?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},m?React.createElement("div",{className:`wb-reader-result__status is-${s}`},React.createElement("div",{className:`wb-reader-result__badge is-${s}`},Vr[s]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},Vt[s])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),m?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},_)):null,d?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},Kr(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},d?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},p.length?p.map((h,l)=>React.createElement("p",{key:l},h)):React.createElement("p",null,d?Yt():"No read returned."))),d?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What may be missing"),o.length?React.createElement("ul",{className:"wb-reader-result__list"},o.map((h,l)=>React.createElement("li",{key:l},h))):React.createElement("p",{className:"wb-reader-result__empty"},"No major gaps flagged in this answer.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},c||"No meaningful shaping detected."))),i?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},i)):null,!d&&m?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),a?React.createElement("div",{className:`wb-reader-result__footer${d?" is-fallback":""}`},m?React.createElement(React.Fragment,null,React.createElement(es,{result:e,context:t,shareUrl:n}),React.createElement(hn,{mode:"single",receipt:e.receipt,onShared:r})):null,React.createElement(C,{kind:"ghost",small:!0,onClick:a,className:"wb-reader-result__rerun"},"Run again")):null)}var as={"candidate missing item":"Candidate missing item","candidate framing issue":"Candidate framing issue","candidate deflection":"Candidate deflection"};function ea({receipt:e,formatter:t=oa,filePrefix:a="imbas-reader-receipt",onExport:n}){let[r,s]=u(!1),[o,c]=u(!1),[i,d]=u("");if(!e)return null;let m=l=>{l(!0),d(""),setTimeout(()=>l(!1),1800)},_=l=>{d(l),setTimeout(()=>d(""),2200)};return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions"},React.createElement(C,{kind:"ghost",small:!0,className:r?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2)),m(s),n&&n("json")}catch(l){_("Could not copy")}}},r?"Copied":"Copy JSON"),React.createElement(C,{kind:"ghost",small:!0,className:o?"is-copied":"",onClick:()=>{try{let l=t(e),b=new Blob([l],{type:"text/plain;charset=utf-8"}),v=URL.createObjectURL(b),y=document.createElement("a"),N=(e.generated_at||"").replace(/[:.]/g,"-");y.href=v,y.download=`${a}-${N||"run"}.txt`,document.body.appendChild(y),y.click(),y.remove(),setTimeout(()=>URL.revokeObjectURL(v),0),m(c),n&&n("receipt")}catch(l){_("Could not download receipt")}}},o?"Downloaded":"Download receipt"),i?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},i):null)}function ns({state:e,copy:t,firstText:a,secondText:n,smallPrint:r,run:s,check:o}){let[c,i]=u(!1),[d,m]=u(!1),[_,p]=u(""),h=k=>{k(!0),p(""),setTimeout(()=>k(!1),1800)},l=k=>{p(k),setTimeout(()=>p(""),2200)},b=()=>Jr({copy:t,firstText:a,secondText:n,smallPrint:r}),v=()=>D(A.CARD_EXPORTED,{run:s,state:e,check:o});return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions wb-card-export"},React.createElement("span",{className:"wb-card-export__label"},"Share what you saw"),React.createElement(C,{kind:"ghost",small:!0,className:c?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(b()),v(),h(i)}catch(k){l("Could not copy")}}},c?"Copied":"Copy card"),React.createElement(C,{kind:"ghost",small:!0,className:d?"is-copied":"",onClick:()=>{try{let k=new Blob([b()],{type:"text/plain;charset=utf-8"}),O=URL.createObjectURL(k),g=document.createElement("a");g.href=O,g.download=`imbas-inspection-card-${s||"run"}.txt`,document.body.appendChild(g),g.click(),g.remove(),setTimeout(()=>URL.revokeObjectURL(O),0),v(),h(m)}catch(k){l("Could not download card")}}},d?"Downloaded":"Download card"),_?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},_):null)}function rs(e){let t=e&&e.finding_counts||{},a=t["candidate missing item"]||0,n=t["candidate framing issue"]||0,r=t["candidate deflection"]||0,s=[];return a&&s.push(`${a} candidate missing item${a===1?"":"s"}`),n&&s.push(`${n} candidate framing issue${n===1?"":"s"}`),r&&s.push(`${r} candidate deflection${r===1?"":"s"}`),s.length?`Reader found ${s.join(", ")}.`:"Reader found no candidate gaps in this answer. It read clean."}async function ss(e,t,a,n){for(let r=0;r<2;r++){if(n.current!==a)return;try{let s=await fetch(Lr,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:e,value:t})});if(s.ok||s.status<500||r===1)return}catch(s){if(r===1)return}}}function bn({mode:e,receipt:t}){let a=xa(e),[n,r]=u(null),s=M(0);if(!a||!t)return null;let o=c=>{if(!Ea(e,c))return;r(c);let i=++s.current;ss(t,c,i,s)};return React.createElement("div",{className:"wb-perception wb-scroll-anchor"},React.createElement("p",{className:"wb-perception__prompt"},a.prompt),React.createElement("div",{className:"wb-perception__options",role:"group","aria-label":a.prompt},a.options.map(c=>{let i=n===c.value;return React.createElement("button",{key:c.id,type:"button",className:`wb-focus wb-perception__option${i?" is-selected":""}`,"aria-pressed":i,onClick:()=>o(c.value)},c.label)})))}function os({result:e}){let t=e==null?void 0:e.measurement;if(!t)return null;let a=(t.estimate_rationale||"").trim();return React.createElement("section",{className:"wb-reader-result is-agent wb-result-hero wb-scroll-anchor","aria-labelledby":"wb-result-hero-estimate"},React.createElement("p",{className:"wb-result-hero__eyebrow"},"Inspection result"),React.createElement("p",{id:"wb-result-hero-estimate",className:"wb-result-hero__estimate"},ut(t.gap_estimate)),React.createElement("p",{className:"wb-result-hero__summary"},rs(t)),a?React.createElement("p",{className:"wb-result-hero__why"},a):null)}function is({result:e,context:t}){var d,m,_;let a=e==null?void 0:e.measurement;if(!a)return null;let n=(e==null?void 0:e.receipt)||null,r=Array.isArray(a.findings)?a.findings:[],s=a.finding_counts||{},o=((t==null?void 0:t.model)||"").trim()||(((d=n==null?void 0:n.open_run)==null?void 0:d.declared_model)||"").trim(),c=(n==null?void 0:n.generated_at)||((_=(m=n==null?void 0:n.open_run)==null?void 0:m.provenance)==null?void 0:_.run_timestamp)||"",i=[o?`Model: ${o}`:"Model: (not declared)"];return c&&i.push(c),React.createElement("section",{className:"wb-reader-result is-agent wb-measure wb-scroll-anchor","aria-labelledby":"wb-measure-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-measure-heading",className:"wb-reader-result__title"},"MEASUREMENT")),React.createElement("p",{className:"wb-reader-result__provenance wb-measure__meta"},i.join(" \xB7 ")),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-measure__findings"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Candidate findings"),React.createElement("p",{className:"wb-measure__counts"},`Missing item: ${s["candidate missing item"]||0} \xB7 Framing issue: ${s["candidate framing issue"]||0} \xB7 Deflection: ${s["candidate deflection"]||0}`),r.length?React.createElement("ul",{className:"wb-measure__list"},r.map((p,h)=>React.createElement("li",{key:h,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},as[p.type]||p.type),(p.materiality||"").trim()?React.createElement("span",{className:"wb-measure__finding-why"},p.materiality.trim()):null,(p.anchor||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor"},`"${p.anchor.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No candidate findings \u2014 the answer read clean."))),React.createElement("p",{className:"wb-measure__unvalidated"},"These are candidate observations from a single answer \u2014 inspection hypotheses, not validated classifications or evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},X),React.createElement(ea,{receipt:n}))}var cs=[{key:"Omission",cls:"is-omission"},{key:"Framing Drift",cls:"is-framing"},{key:"Deflection",cls:"is-deflection"}];function ls({counts:e}){let t=e||{},a=cs.map(r=>({...r,n:Number(t[r.key])||0}));return a.reduce((r,s)=>r+s.n,0)<=0?null:React.createElement("div",{className:"wb-xray","aria-hidden":"true"},a.filter(r=>r.n>0).map(r=>React.createElement("span",{key:r.key,className:`wb-xray__seg ${r.cls}`,style:{flexGrow:r.n}})))}function ds({paired:e,pair:t,openReceipt:a,onReset:n,run:r,check:s,onTryCleaner:o}){let c=Array.isArray(e.delta_items)?e.delta_items:[],i=e.signal_counts||{},d=t&&t.capture,m=Je(d),_=da({gap_estimate:e.gap_estimate,signal_counts:i}),[p,h]=u(_);F(()=>{D(A.LOOP_COMPLETED,{run:r,state:_,check:s,gap:e.gap_estimate,source:e.source,idempotent:e.idempotent})},[]);let l=I=>{I!==p&&(D(A.STATE_CORRECTED,{run:r,from_state:p,to_state:I,check:s}),h(I))},b=pa(p,m),v=c[0]||{},y=(v.open_side||"").trim()||Qe,N=(v.targeted_side||"").trim()||Qe,k=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first",key:"first"},React.createElement("span",{className:"wb-loop__panel-label"},rt),React.createElement("p",{className:"wb-loop__panel-body"},y)),O=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second",key:"second"},React.createElement("span",{className:"wb-loop__panel-label"},st),React.createElement("p",{className:"wb-loop__panel-body"},N)),g=b.swapPanels?[O,k]:[k,O],P=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||r||"",H=e.receipt&&e.receipt.generated_at||"",U=H?String(H).slice(0,10):"",R=[P?`Run ${P}`:"",U,ua].filter(Boolean).join(" \xB7 ");return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},"You already ran this pair. This is the analysis from that run."):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},"The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},b.headline),React.createElement("div",{className:"wb-loop__panels"},g),m?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},$.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},$.unmatched_warning)):null,b.tag?React.createElement("p",{className:"wb-loop__tag"},b.tag):null,p===Ke&&b.cta?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:n},b.cta)):null,p===Ie&&b.cta&&s===Pe&&o?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:o},b.cta)):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},"Read it differently?"),ht.map(I=>React.createElement("button",{key:I,type:"button",className:`wb-loop__chip${I===p?" is-active":""}`,"aria-pressed":I===p,onClick:()=>l(I)},(Oe[I]||{}).chip||I))),React.createElement("p",{className:"wb-loop__smallprint"},R),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},X)),React.createElement("div",{className:"wb-measure__estimate wb-act2__estimate"},React.createElement("div",{className:"wb-measure__estimate-value"},e.gap_estimate_label),(e.estimate_rationale||"").trim()?React.createElement("p",{className:"wb-measure__estimate-why"},e.estimate_rationale.trim()):null),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"The delta"),React.createElement(ls,{counts:i}),React.createElement("p",{className:"wb-measure__counts"},`Omission: ${i.Omission||0} \xB7 Framing Drift: ${i["Framing Drift"]||0} \xB7 Deflection: ${i.Deflection||0}`),c.length?React.createElement("ol",{className:"wb-measure__list"},c.map((I,z)=>React.createElement("li",{key:z,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},I.signal_pattern),React.createElement("p",{className:"wb-measure__finding-why"},I.point),(I.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},"First answer"),`"${I.open_side.trim()}"`):null,(I.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},"Second answer"),`"${I.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No material gap. The direct question surfaced nothing decision-relevant the first answer left out."))),React.createElement(wn,{pairRuns:[t],findings:c,conditionsMatched:d?d.conditions_matched:void 0}),React.createElement("p",{className:"wb-measure__unvalidated"},"This is a machine estimate over one answer pair. Not a human-scored result, not evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},X),React.createElement(ns,{state:p,copy:b,firstText:y,secondText:N,smallPrint:R,run:P,check:s}),React.createElement(ea,{receipt:e.receipt,formatter:ia,filePrefix:"imbas-reader-paired-receipt"}),React.createElement(fn,{result:{receipt:a},statuses:{},pair:t}),React.createElement(hn,{mode:"paired",receipt:e.receipt}),React.createElement(bn,{mode:"paired",receipt:e.receipt}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:n},"Test another answer")))}function us(e){let t=e&&e.info&&typeof e.info.message=="string"?e.info.message.trim():"";return t||"The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly."}function ps({openReceipt:e,run:t,check:a,onTryCleaner:n,onPairedChange:r,inputRef:s}){let[o,c]=u(""),[i,d]=u(!1),[m,_]=u(null),[p,h]=u(""),[l,b]=u(""),[v,y]=u(null),[N,k]=u(""),[O,g]=u(null);if(!e)return null;let P=!!o.trim(),H=wt({same_model:v,model_version:N,edits:O}),U=e&&e.open_run||{},R=U.provenance&&U.provenance.reader_model_version||"",I={targeted_answer:o,targeted_prompt:m&&m.targeted_prompt||Ye,targeted_prompt_hash:m&&m.receipt&&m.receipt.paired_analysis&&m.receipt.paired_analysis.targeted_prompt_hash||"",capture:H,targeted_source_model:{name:v===Z.YES&&U.declared_model||"",version:N.trim()},inspector:{model:R,model_version:R,prompt_version:"1.1"}},z=x=>{c(x),p&&h(""),l&&b("")},ee=()=>{_(null),c(""),h(""),b(""),y(null),k(""),g(null),r&&r(!1)},te=async()=>{if(!i){if(!P){h("Paste the answer your AI gave the direct question.");return}h(""),b(""),d(!0),D(A.LOOP_RETURNED,{run:t,check:a});try{let x=await Fr(e,o);_(x),r&&r(!0)}catch(x){let J=x&&x.info||{};x&&x.status===400&&J.error==="too_long"?h("Answer is over 1200 words. Trim it and re-run."):x&&x.status===400&&J.error==="empty"?h("That's too short to compare. Paste the full answer."):x&&x.status===400?b("This inspection can't run the two-question test. Re-run the answer above, then try again."):b(us(x))}finally{d(!1)}}};return m?React.createElement("div",{className:"wb-act2__test"},React.createElement(ds,{paired:m,pair:I,openReceipt:e,onReset:ee,run:t,check:a,onTryCleaner:n})):React.createElement("div",{className:"wb-act2__test"},React.createElement(Ge,{label:"Answer to the direct question",value:o,onChange:z,error:p,placeholder:"Paste what your AI came back with\u2026",minAckLength:1,inputRef:s}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},$.heading),React.createElement("p",{className:"wb-act2__capture-intro"},$.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[Z.YES,Z.NO,Z.NOT_SURE].map(x=>React.createElement("button",{key:x,type:"button",className:`wb-act2__capture-opt${v===x?" is-active":""}`,"aria-pressed":v===x,onClick:()=>y(x)},$.same_model.options[x])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-pair-model"},$.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},$.model_version.hint),React.createElement("input",{id:"wb-pair-model",type:"text",className:"wb-act2__capture-input",value:N,maxLength:80,placeholder:$.model_version.placeholder,onChange:x=>k(x.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[oe.NONE,oe.EDITED].map(x=>React.createElement("button",{key:x,type:"button",className:`wb-act2__capture-opt${O===x?" is-active":""}`,"aria-pressed":O===x,onClick:()=>g(x)},$.edits.options[x])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},$.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(C,{kind:"primary",disabled:i||!P,onClick:te,className:`wb-reader-cta${P&&!i?" is-armed":""}${i?" is-inspecting":""}`},i?"Comparing\u2026":"Compare the two answers")),l?React.createElement("p",{className:"wb-act2__run-error",role:"status"},l):null)}function ms({card:e,run:t,status:a,onStatus:n}){var p,h;let[r,s]=u(!1),[o,c]=u(""),i=M(!1),d=ie.labels,m=async()=>{try{await navigator.clipboard.writeText(e.verification_question||""),s(!0),c(""),D(A.TARGET_QUESTION_COPIED,{run:t,check:e.finding_type}),setTimeout(()=>s(!1),1800)}catch(l){c("Could not copy"),setTimeout(()=>c(""),2200)}},_=l=>{l!==a&&(n(e.id,l),l==="resolved"&&!i.current&&(i.current=!0,D(A.LOOP_COMPLETED,{run:t,check:e.finding_type,state:"resolved"})))};return React.createElement("li",{className:`wb-check wb-check--${a}`},React.createElement("div",{className:"wb-check__head"},React.createElement("span",{className:"wb-check__family"},e.family),React.createElement("span",{className:"wb-check__detector"},e.detector_id),React.createElement("span",{className:"wb-check__finding"},e.finding_label),React.createElement("span",{className:"wb-check__provisional"},e.provisional_label)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},d.proposition),React.createElement("blockquote",{className:"wb-check__quote"},(p=e.proposition)==null?void 0:p.text)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},d.dependent),React.createElement("blockquote",{className:"wb-check__quote"},(h=e.dependent_output)==null?void 0:h.text)),React.createElement("p",{className:"wb-check__dependency"},React.createElement("span",{className:"wb-check__label"},d.dependency)," ",e.dependency_statement),React.createElement("div",{className:"wb-check__verify"},React.createElement("span",{className:"wb-check__label"},d.verification),React.createElement("p",{className:"wb-check__question"},e.verification_question),React.createElement("div",{className:"wb-check__actions"},React.createElement(C,{kind:"primary",small:!0,className:r?"is-copied":"",onClick:m},r?ie.copied_affordance:ie.copy_affordance),React.createElement("span",{className:"wb-check__resolver"},e.resolver_label),o?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},o):null)),React.createElement("div",{className:"wb-check__status",role:"group","aria-label":"Status"},React.createElement("span",{className:"wb-check__label"},d.status),["open","resolved","dismissed"].map(l=>React.createElement("button",{key:l,type:"button",className:`wb-check__status-opt${a===l?" is-active":""}`,"aria-pressed":a===l,onClick:()=>_(l)},ie.status_labels[l]))))}function _s({result:e}){var _,p,h;let t=e==null?void 0:e.checks,a=((h=(p=(_=e==null?void 0:e.receipt)==null?void 0:_.open_run)==null?void 0:p.provenance)==null?void 0:h.request_id)||"",[n,r]=u(!1),[s,o]=u({}),c=(l,b)=>o(v=>v[l]===b?v:{...v,[l]:b});if(!t||!Array.isArray(t.cards)||t.cards.length===0)return null;let i=t.default_top_n||3,d=t.cards.length>i,m=n?t.cards:t.cards.slice(0,i);return React.createElement("section",{className:"wb-reader-result is-agent wb-checks wb-scroll-anchor","aria-labelledby":"wb-checks-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-checks-heading",className:"wb-reader-result__title"},ie.register_heading)),React.createElement("p",{className:"wb-checks__note"},ie.register_note),d&&!n?React.createElement("p",{className:"wb-checks__eyebrow"},ie.top_label):null,React.createElement("ul",{className:"wb-checks__list"},m.map(l=>React.createElement(ms,{key:l.id,card:l,run:a,status:s[l.id]||l.status||"open",onStatus:c}))),d?React.createElement("button",{type:"button",className:"wb-checks__more wb-focus",onClick:()=>r(l=>!l)},n?ie.collapse_label:`${ie.expand_label} (${t.cards.length})`):null,React.createElement(fn,{result:e,statuses:s}),React.createElement("p",{className:"wb-reader-result__trust wb-checks__boundary"},X))}function fn({result:e,statuses:t,pair:a=null}){let[n,r]=u(!1),[s,o]=u(""),c=M(!1);return React.createElement("div",{className:"wb-checks__export"},React.createElement(C,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{if(!c.current){c.current=!0;try{let d=await Ta({result:e,checkStates:t,createdAt:new Date().toISOString(),pair:a}),m=new Blob([JSON.stringify(d,null,2)],{type:"application/json;charset=utf-8"}),_=URL.createObjectURL(m),p=document.createElement("a");p.href=_,p.download=Ra(d),document.body.appendChild(p),p.click(),p.remove(),setTimeout(()=>URL.revokeObjectURL(_),0),o(""),r(!0),setTimeout(()=>r(!1),1800)}catch(d){o(Xe.download_error),setTimeout(()=>o(""),2200)}finally{c.current=!1}}}},n?Xe.downloaded_label:Xe.action_label),React.createElement("span",{className:"wb-checks__export-hint"},Xe.action_hint),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null)}function wn({pairRuns:e=[],findings:t=[],conditionsMatched:a}){let{state_id:n,copy:r}=Oa({pairRuns:e,findings:t,conditionsMatched:a});return React.createElement("section",{className:"wb-explain","data-state":n,"aria-label":r.heading},React.createElement("h3",{className:"wb-explain__heading"},r.heading),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.what),React.createElement("p",{className:"wb-explain__body"},r.what)),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.why),r.why.map((s,o)=>React.createElement("p",{key:o,className:"wb-explain__body"},s))),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.next),React.createElement("p",{className:"wb-explain__body"},r.next)),React.createElement("p",{className:"wb-explain__boundary"},r.archive_boundary),React.createElement("p",{className:"wb-explain__method"},React.createElement("a",{className:"wb-explain__method-link",href:r.method_link.href},r.method_link.label," \u2192")))}function hs({result:e,open:t=!1,onOpen:a,onPairedChange:n,pairedInputRef:r}){var v,y,N,k,O;let s=e==null?void 0:e.act2,o=((N=(y=(v=e==null?void 0:e.receipt)==null?void 0:v.open_run)==null?void 0:y.provenance)==null?void 0:N.request_id)||"",c=((O=(k=e==null?void 0:e.receipt)==null?void 0:k.open_run)==null?void 0:O.question)||"",[i,d]=u(!1),[m,_]=u(""),[p,h]=u(Pe);if(F(()=>{!s||!s.eligible||(D(A.FOLLOW_UP_REVEALED,{run:o}),s.available||D(A.CAPACITY_DEGRADATION,{run:o,reason:s.degraded_reason||"spend_ceiling"}))},[o]),!s||!s.eligible)return null;let l=p===De?_a({question:c}):s.targeted_prompt||Ye,b=async()=>{try{await navigator.clipboard.writeText(l),d(!0),_(""),D(A.TARGET_QUESTION_COPIED,{run:o,check:p}),a&&a(),setTimeout(()=>d(!1),1800)}catch(g){_("Could not copy"),setTimeout(()=>_(""),2200)}};return React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-scroll-anchor","aria-labelledby":"wb-act2-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-act2-heading",className:"wb-reader-result__title"},"THE TWO-QUESTION TEST")),React.createElement("p",{className:"wb-act2__offer"},la),React.createElement("div",{className:"wb-act2__check",role:"group","aria-label":"How you'll run the second answer"},React.createElement("p",{className:"wb-act2__check-copy"},ma),React.createElement("div",{className:"wb-act2__check-opts"},React.createElement("button",{type:"button",className:`wb-act2__check-opt${p===Pe?" is-active":""}`,"aria-pressed":p===Pe,onClick:()=>h(Pe)},React.createElement("span",{className:"wb-act2__check-label"},bt.label),React.createElement("span",{className:"wb-act2__check-hint"},bt.hint)),React.createElement("button",{type:"button",className:`wb-act2__check-opt${p===De?" is-active":""}`,"aria-pressed":p===De,onClick:()=>h(De)},React.createElement("span",{className:"wb-act2__check-label"},ft.label),React.createElement("span",{className:"wb-act2__check-hint"},ft.hint)))),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"What to run on your AI"},l),React.createElement("p",{className:"wb-act2__prompt-note"},"Generated from this Reader run. Any question shapes an answer \u2014 this one included."),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(C,{kind:"primary",className:i?"is-copied":"",onClick:b},i?"Copied \u2014 now ask your AI":"Ask your AI \u2192"),s.available&&!t?React.createElement(C,{kind:"ghost",onClick:a},"Paste what came back"):null,m?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},m):null),React.createElement("p",{className:"wb-act2__sub"},"Copy this question. Drop it in your chat. Paste what comes back."),s.available?t?React.createElement(ps,{key:p,openReceipt:e.receipt,run:o,check:p,onTryCleaner:()=>h(De),onPairedChange:n,inputRef:r}):null:React.createElement("p",{className:"wb-act2__degraded",role:"status"},mt))}function bs({chip:e,entry:t,capture:a,onReset:n}){let r=Array.isArray(e.delta_items)?e.delta_items:[],s=Je(a),o=a.conditions_matched===!0?"matched":a.conditions_matched===!1?"unmatched":"unverified",c=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||"",i=fa({delta_count:e.delta_count,conditions_matched:a.conditions_matched}),[d,m]=u(i);F(()=>{D(A.CHIP_PAIR_COMPLETED,{run:c,chip:t?t.id:"",instruction_version:t?t.instruction_version:"",state:i,conditions:o,source:e.source,idempotent:e.idempotent})},[]);let _=h=>{h!==d&&(D(A.STATE_CORRECTED,{run:c,from_state:d,to_state:h}),m(h))},p=Nt[d]||{};return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},E.reveal.idempotent_notice):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},E.reveal.capture_uncertain_notice):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},p.headline),t?React.createElement("p",{className:"wb-chip__reason"},E.side_by_side.reason_prefix,t.approved_ui_label):null,React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first"},React.createElement("span",{className:"wb-loop__panel-label"},E.side_by_side.first_answer_caption)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},E.side_by_side.second_answer_caption))),s?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},$.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},$.unmatched_warning)):null,p.note?React.createElement("p",{className:"wb-loop__tag"},p.note):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},E.reveal.correct_label),ba.map(h=>React.createElement("button",{key:h,type:"button",className:`wb-loop__chip${h===d?" is-active":""}`,"aria-pressed":h===d,onClick:()=>_(h)},(Nt[h]||{}).chip||h)))),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},E.reveal.delta_heading),r.length?React.createElement("ol",{className:"wb-measure__list"},r.map((h,l)=>React.createElement("li",{key:l,className:"wb-measure__finding"},React.createElement("p",{className:"wb-measure__finding-why"},h.point),(h.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},E.reveal.first_side_label),`"${h.open_side.trim()}"`):null,(h.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},E.reveal.second_side_label),`"${h.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},E.reveal.empty_delta))),React.createElement("p",{className:"wb-chip__meaning"},E.meaning_panel_line),React.createElement("div",{className:"wb-reader-result__trust wb-chip__boundary",role:"note"},React.createElement("p",{className:"wb-chip__boundary-lock"},X),React.createElement("p",{className:"wb-chip__boundary-attr"},E.boundary)),React.createElement("div",{className:"wb-chip__pro-cue"},React.createElement("span",{className:"wb-chip__pro-line"},E.professional_cue.line),React.createElement("span",{className:"wb-chip__pro-link"},E.professional_cue.link)),React.createElement(ea,{receipt:e.receipt,formatter:ca,filePrefix:"imbas-reader-followup-receipt",onExport:()=>D(A.CARD_EXPORTED,{run:c,chip:t?t.id:"",instruction_version:t?t.instruction_version:""})}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(C,{kind:"ghost",small:!0,onClick:n},E.reveal.reset_label)))}function fs(){let[e,t]=u(""),[a,n]=u(""),[r,s]=u(""),[o,c]=u(null),[i,d]=u(""),[m,_]=u(null),[p,h]=u(!1),[l,b]=u(null),[v,y]=u(!1),[N,k]=u(""),[O,g]=u(""),[P,H]=u(""),U=M(!1);F(()=>{U.current||(U.current=!0,D(A.CHIP_ROW_RENDERED,{}))},[]);let R=xt.find(w=>w.id===a)||null,I=wt({same_model:o,model_version:i,edits:m}),z=!!R&&!!e.trim()&&!!r.trim(),ee=()=>{O&&g(""),P&&H("")},te=()=>{b(null),t(""),n(""),s(""),c(null),d(""),_(null),g(""),H(""),y(!1)},x=w=>{n(w.id),ee(),D(A.CHIP_SELECTED,{chip:w.id,instruction_version:w.instruction_version})},J=async()=>{if(R)try{await navigator.clipboard.writeText(R.instruction_text),y(!0),k(""),D(A.CHIP_INSTRUCTION_COPIED,{chip:R.id,instruction_version:R.instruction_version}),setTimeout(()=>y(!1),1800)}catch(w){k("Could not copy"),setTimeout(()=>k(""),2200)}},_e=async()=>{if(!p){if(!R){g(E.compose.chip_missing);return}if(!e.trim()){g(E.compose.first_answer_missing);return}if(!r.trim()){g(E.compose.second_answer_missing);return}g(""),H(""),h(!0),D(A.CHIP_PAIR_INITIATED,{chip:R.id,instruction_version:R.instruction_version});try{let w=await Br({firstAnswer:e,targetedAnswer:r,chipId:R.id,instructionVersion:R.instruction_version});b(w)}catch(w){let V=w&&w.info||{};w&&w.status===400&&V.error==="too_long"?g(E.compose.too_long):w&&w.status===400&&V.error==="empty"?g(E.compose.too_short):w&&w.status===400&&V.error==="not_eligible"?H(E.compose.not_eligible):w&&w.status===400?H(E.compose.blocked):H(V&&V.message||E.compose.run_error)}finally{h(!1)}}},S=React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-chip-heading",className:"wb-reader-result__title"},E.value_statement.headline));return l?React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},S,React.createElement(bs,{chip:l,entry:R,capture:I,onReset:te})):React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},S,React.createElement("p",{className:"wb-act2__offer"},E.value_statement.sub),React.createElement(Ge,{label:E.compose.first_answer_label,value:e,onChange:w=>{t(w),ee()},placeholder:E.compose.first_answer_placeholder,minAckLength:1,readOnly:!!R}),R?React.createElement("div",{className:"wb-chip__edit-first"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:()=>n("")},`\u2190 ${E.compose.edit_first_answer}`)):null,React.createElement("div",{className:"wb-act2__capture wb-chip__choose",role:"group","aria-label":"Pick a follow-up"},React.createElement("p",{className:"wb-act2__capture-heading"},E.row_header),React.createElement("p",{className:"wb-act2__capture-intro"},E.row_support),React.createElement("div",{className:"wb-chip__row"},xt.map(w=>React.createElement("button",{key:w.id,type:"button",className:`wb-loop__chip wb-chip__pick${w.id===a?" is-active":""}`,"aria-pressed":w.id===a,onClick:()=>x(w)},w.approved_ui_label)))),R?React.createElement("div",{className:"wb-chip__instruction"},React.createElement("p",{className:"wb-act2__prompt-note"},E.card.framing),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"Instruction to paste into your AI"},R.instruction_text),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(C,{kind:"primary",className:v?"is-copied":"",onClick:J},v?E.compose.copy_done:E.compose.copy_label),N?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},N):null),React.createElement(Ge,{label:E.compose.second_answer_label,value:r,onChange:w=>{s(w),ee()},placeholder:E.compose.second_answer_placeholder,minAckLength:1}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},$.heading),React.createElement("p",{className:"wb-act2__capture-intro"},$.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[Z.YES,Z.NO,Z.NOT_SURE].map(w=>React.createElement("button",{key:w,type:"button",className:`wb-act2__capture-opt${o===w?" is-active":""}`,"aria-pressed":o===w,onClick:()=>c(w)},$.same_model.options[w])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-chip-model"},$.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},$.model_version.hint),React.createElement("input",{id:"wb-chip-model",type:"text",className:"wb-act2__capture-input",value:i,maxLength:80,placeholder:$.model_version.placeholder,onChange:w=>d(w.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[oe.NONE,oe.EDITED].map(w=>React.createElement("button",{key:w,type:"button",className:`wb-act2__capture-opt${m===w?" is-active":""}`,"aria-pressed":m===w,onClick:()=>_(w)},$.edits.options[w])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},$.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(C,{kind:"primary",disabled:p||!z,onClick:_e,className:`wb-reader-cta${z&&!p?" is-armed":""}${p?" is-inspecting":""}`},p?E.compose.comparing_label:E.compose.compare_label)),O?React.createElement("p",{className:"wb-act2__run-error",role:"status"},O):null,P?React.createElement("p",{className:"wb-act2__run-error",role:"status"},P):null):null,React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},E.boundary))}function ws({sel:e}){let[t,a]=u(!1),[n,r]=u("");if(!(e!=null&&e.ready))return null;let s=async()=>{try{await navigator.clipboard.writeText(e.openPrompt||""),a(!0),r(""),setTimeout(()=>a(!1),1800)}catch(o){r("Could not copy"),setTimeout(()=>r(""),2200)}};return React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},mr(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__signal wb-guided-trap"},React.createElement("p",{className:"wb-active-case__probe"},"Start with an ordinary question:"),React.createElement(Qt,{text:e.openPrompt})),e.reveal?React.createElement("div",{className:"wb-readout__section wb-guided-reveal"},React.createElement("div",{className:"wb-active-case__headline"},e.reveal)):null,React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste what it says back")),React.createElement("div",{className:"wb-guided-copy"},React.createElement(C,{kind:"ghost",small:!0,className:t?"is-copied":"",onClick:s},t?"Copied":"Copy question"),n?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},n):null)))}function gs({mode:e,sel:t,onAnother:a}){let[n,r]=u(!1),[s,o]=u(""),c=e==="guided",i=c&&He.find(_=>_.ready&&_.id!==(t==null?void 0:t.id))||null,d=c&&((i==null?void 0:i.openPrompt)||(t==null?void 0:t.openPrompt))||"";return c&&!d?null:React.createElement("section",{className:"wb-reader-result is-agent wb-loop wb-scroll-anchor","aria-labelledby":"wb-loop-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-loop-heading",className:"wb-reader-result__title"},"TEST ANOTHER QUESTION")),c?React.createElement(React.Fragment,null,React.createElement("p",{className:"wb-loop__lead"},"Run the same check on a fresh question. Copy it, ask your AI, paste what it says back."),React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste the answer back")),React.createElement(Qt,{text:d})):React.createElement("p",{className:"wb-loop__lead"},"Run the same check on another answer."),React.createElement("div",{className:"wb-loop__actions"},c?React.createElement(React.Fragment,null,React.createElement(C,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(d),r(!0),o(""),setTimeout(()=>r(!1),1800)}catch(_){o("Could not copy"),setTimeout(()=>o(""),2200)}}},n?"Copied":"Copy question"),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null):null,React.createElement(C,{kind:"primary",small:!0,onClick:()=>a(i)},"Test another question")))}function ys({onDismiss:e}){return React.createElement("section",{className:"wb-return","aria-label":"Welcome back"},React.createElement("div",{className:"wb-return__body"},React.createElement("p",{className:"wb-return__headline"},"Welcome back."),React.createElement("p",{className:"wb-return__text"},"You started a check here before. Paste an answer to run another and watch what it leaves out.")),React.createElement("button",{type:"button",className:"wb-return__dismiss",onClick:e,"aria-label":"Dismiss"},"\xD7"))}var vs=["Paste an AI answer to see what it might be missing.","Copy the one question Imbas builds, then ask your own AI.","Paste its reply back and watch what surfaces."];function Ns(){let[e]=u(()=>Et(Jt())),t=e.loop_completion_rate,a=t==null?"\u2014":`${Math.round(t*100)}%`,n=e.counts||{},r=[["Runs started",n.run_started],["Runs completed",n.run_completed],["Results viewed",n.result_viewed],["Questions copied",n.target_question_copied],["Loops returned",n.loop_returned],["Loops completed",n.loop_completed],["States corrected",n.state_corrected],["Cards exported",n.card_exported],["Candidates submitted",n.candidate_submitted],["Return visits",n.return_visit]],s=e.completed_by_state||{},o=Object.keys(s).length>0;return React.createElement("section",{className:"wb-funnel","aria-label":"Reader funnel (this browser only)"},React.createElement("div",{className:"wb-funnel__head"},React.createElement("span",{className:"wb-funnel__eyebrow"},"Reader funnel \xB7 this browser only"),React.createElement("p",{className:"wb-funnel__northstar"},React.createElement("span",{className:"wb-funnel__northstar-num"},a),React.createElement("span",{className:"wb-funnel__northstar-label"},"of copied questions returned as completed loops"))),React.createElement("dl",{className:"wb-funnel__grid"},r.map(([c,i])=>React.createElement("div",{key:c,className:"wb-funnel__row"},React.createElement("dt",{className:"wb-funnel__label"},c),React.createElement("dd",{className:"wb-funnel__val"},i||0)))),o?React.createElement("div",{className:"wb-funnel__states"},React.createElement("span",{className:"wb-funnel__states-label"},"Completed by state"),React.createElement("ul",{className:"wb-funnel__states-list"},ht.map(c=>s[c]?React.createElement("li",{key:c,className:"wb-funnel__states-item"},Oe[c]&&Oe[c].chip||c,": ",s[c]):null))):null,React.createElement("p",{className:"wb-funnel__note"},"[Content-minimal: ids, enums, counts only \u2014 never answer or question text. Stored in this browser, nothing leaves your device.]"))}var ks={context:"Public example \xB7 U.S. administrative law",question:"When a court reviews a federal agency's reading of an ambiguous statute, how much weight does the agency's interpretation get?",openAnswer:"Courts apply Chevron deference. If the statute is ambiguous, the court defers to the agency's interpretation as long as it's reasonable \u2014 the two-step framework from Chevron v. NRDC (1984).",leftOut:"Chevron was overruled. In Loper Bright Enterprises v. Raimondo (June 2024), the Supreme Court ended Chevron deference \u2014 courts now interpret ambiguous statutes themselves, de novo, without deferring to the agency.",targetedPrompt:Ye,surfaced:"Chevron no longer governs. Loper Bright v. Raimondo (2024) overruled it; courts now decide a statute's meaning de novo under the Administrative Procedure Act. Governing source: Loper Bright Enterprises v. Raimondo, 603 U.S. 369 (2024).",tag:"That's the Volunteer Gap \u2014 the open answer left it out; the direct question surfaced it. Run your own answer to watch it live."};function xs({onTryOwn:e,onClose:t}){let a=ks,n=(Oe[Re]||{}).headline||"";return React.createElement("section",{className:"wb-demo","aria-labelledby":"wb-demo-heading"},React.createElement("div",{className:"wb-demo__head"},React.createElement("span",{className:"wb-demo__eyebrow"},"WORKED EXAMPLE"),React.createElement("h3",{id:"wb-demo-heading",className:"wb-demo__title"},"Watch the loop on one public example."),React.createElement("p",{className:"wb-demo__context"},a.context)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The question"),React.createElement("p",{className:"wb-demo__q"},a.question)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the AI said"),React.createElement("p",{className:"wb-demo__answer"},a.openAnswer)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the open answer left out"),React.createElement("p",{className:"wb-demo__leftout"},React.createElement("mark",{className:"wb-demo__mark"},a.leftOut))),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The direct question Imbas builds"),React.createElement("p",{className:"wb-act2__prompt wb-demo__prompt"},a.targetedPrompt)),React.createElement("div",{className:"wb-loop__reveal wb-demo__reveal"},React.createElement("p",{className:"wb-loop__headline"},n),React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel"},React.createElement("span",{className:"wb-loop__panel-label"},rt),React.createElement("p",{className:"wb-loop__panel-body wb-loop__panel-body--muted"},Qe)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},st),React.createElement("p",{className:"wb-loop__panel-body"},a.surfaced))),React.createElement("p",{className:"wb-loop__tag"},a.tag),React.createElement("p",{className:"wb-measure__boundary"},X),React.createElement("p",{className:"wb-demo__smallprint"},"[A canned demonstration on a public example. Not your run, not an Imbas case \u2014 nothing here was recorded.]")),React.createElement("div",{className:"wb-demo__cta-row"},React.createElement(C,{kind:"primary",small:!0,onClick:e},"Now try your own \u2192"),React.createElement("button",{type:"button",className:"wb-demo__close",onClick:t},"Hide example")))}function Es(){let[e,t]=u("own"),[a,n]=u(He[0]),[r,s]=u(""),[o,c]=u(""),[i,d]=u(""),[m,_]=u(""),[p,h]=u(!1),[l,b]=u(null),[v,y]=u({}),[N,k]=u(!1),[O]=u(()=>Pr()),[g,P]=u(!1),H=M(!1),[U,R]=u(()=>Mt(window.location).lane),[I,z]=u(!1),[ee,te]=u(!1),x=M(null),J=M(null),_e=M(!1),S=M(ya()),w=M(null),V=M(null),he=M(La),le=M(null),ve=M(null),se=M(null),ze=M(!1),Ae=M(null),je=!!(e==="guided"?a.openPrompt:r).trim(),Ne=!!o.trim(),nt=je&&Ne,Se=e==="own"&&Ne&&!je,Ve=p?"inspecting":l?"result":nt?"ready":Se?"needQuestion":"idle",ae=$t({lane:U,busy:p,hasResult:!!l,hasAct2:!!(l&&l.act2),followUpOpen:I,hasDelta:ee}),de=qt(ae),be=de.answerEntry==="compose-answer",ke=()=>{he.current=Lt};F(()=>{let f=V.current,W=he.current;if(he.current=$a,V.current=ae,f===null)return;let re=Ma(f,ae,W);re.emit&&D(A.STAGE_CHANGED,{from_state:re.from,to_state:re.to,mode:e})},[ae]),F(()=>{let{stage:f}=Mt(window.location);Fa(f,{lane:U,busy:!1,hasResult:!1}).rewrite&&window.history.replaceState(null,"",window.location.pathname+window.location.search)},[]),F(()=>{if(!ze.current){ze.current=!0;return}let f=Ua(ae);window.location.hash!==f&&window.history.replaceState(null,"",window.location.pathname+window.location.search+f)},[ae]),F(()=>{l||(z(!1),te(!1))},[l]);let T={"compose-answer":le,"paired-answer":ve};F(()=>{let f=Ae.current;if(Ae.current=ae,f===null||f===ae)return;let W=(T[de.focus]||se).current;W&&typeof W.focus=="function"&&W.focus({preventScroll:!0})},[ae]),F(()=>{let f=()=>{window.location.hash==="#wb-reader-console"&&t("own")};return f(),window.addEventListener("hashchange",f),()=>window.removeEventListener("hashchange",f)},[]),F(()=>{if(!_e.current){_e.current=!0,at();return}if(e!=="guided")return;let f=window.requestAnimationFrame(()=>Ce(x.current));return()=>window.cancelAnimationFrame(f)},[a.id,e]),F(()=>{let{state:f,scroll:W}=va(S.current,!!l);if(S.current=f,W&&J.current){let re=window.requestAnimationFrame(()=>Ce(J.current));return()=>window.cancelAnimationFrame(re)}},[l]),F(()=>{if(!l){w.current=null;return}let f=Ft(l)||(l.source?`src:${l.source}`:"result");w.current!==f&&(w.current=f,D(A.RESULT_VIEWED,{run:Ft(l),source:l.source||"agent"}))},[l]),F(()=>{let f=!1;try{f=sessionStorage.getItem("imbas_reader_session")==="1"}catch(Te){}let W=Jt();if(W.length===0)return;if(!f){D(A.RETURN_VISIT);try{sessionStorage.setItem("imbas_reader_session","1")}catch(Te){}}let re=Et(W),ct=re.counts.target_question_copied||0,Q=re.counts.loop_completed||0;ct>Q&&(D(A.RESTORED_SESSION,{}),k(!0))},[]);let B=f=>{f!==e&&(t(f),y({}),b(null),h(!1),R(tt),f==="own"&&c(""))},ue=()=>{U!==we&&(ke(),R(we))},ne=()=>R(tt),pe=()=>{I||(ke(),z(!0))},j=f=>{f!==ee&&(f&&ke(),te(f))},G=()=>{b(null),y({}),x.current&&window.requestAnimationFrame(()=>Ce(x.current))},xe=()=>{P(!0),H.current||(H.current=!0,D(A.RUN_STARTED,{mode:"demo",source:"demo"}))},it=()=>{P(!1),e!=="own"&&B("own"),x.current&&window.requestAnimationFrame(()=>Ce(x.current))},gn=f=>{!f.ready||f.id===a.id||(n(f),c(""),b(null),y({}),h(!1))},yn=f=>{b(null),y({}),h(!1),c(""),e==="guided"&&f&&n(f),x.current&&window.requestAnimationFrame(()=>Ce(x.current))},ta=f=>{c(f),y(W=>({...W,answer:""})),l&&b(null)},vn=f=>{s(f),y(W=>({...W,question:""})),l&&b(null)},aa=async()=>{if(p)return;let f={},W=e==="guided"?a.openPrompt:r,re=o;if(e==="own"&&!(W||"").trim()&&(f.question="Add the question you asked."),(re||"").trim()||(f.answer="Paste an answer to run The Reader."),Object.keys(f).length){y(f);return}y({}),ke(),h(!0),b(null),D(A.RUN_STARTED,{mode:e});let ct=qr({mode:e,sel:a,question:r,answer:re,topic:i,model:m});try{let Q=await Mr(ct);b(Q);let Te=Ft(Q);if(D(A.RUN_COMPLETED,{run:Te,mode:e,source:Q.source||"agent",eligible:!!(Q.act2&&Q.act2.eligible)}),Q.source==="fallback"){let lt=pn(Q).toLowerCase();_t(lt)&&D(A.CAPACITY_DEGRADATION,{run:Te,mode:e,reason:lt}),lt==="timeout"&&D(A.TIMEOUT,{run:Te,mode:e,reason:"timeout"})}Q.capture_uncertain&&D(A.CAPTURE_UNCERTAIN,{run:Te,mode:e})}catch(Q){Q&&Q.message==="too_long"?y({answer:"Answer is over 1200 words. Trim it and re-run."}):(b({source:"fallback",completeness:"thin",the_read:Yt(),what_was_left_out:[],how_it_was_shaped:"",reason:String(Q.message||"network")}),D(A.RUN_COMPLETED,{mode:e,source:"fallback",eligible:!1}),Q&&Q.message==="read_429"&&D(A.CAPACITY_DEGRADATION,{mode:e,reason:"capacity"}))}finally{h(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},N&&!l?React.createElement(ys,{onDismiss:()=>k(!1)}):null,de.pasteBox?React.createElement("div",{ref:x,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>B("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>B("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with a measured case."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},He.map(f=>React.createElement("button",{key:f.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${f.id===a.id?" is-active":""}${f.ready?"":" is-disabled"}`,onClick:()=>gn(f),disabled:!f.ready,title:f.title},f.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},_r(f)):React.createElement(ye,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},f.cardShort||f.title)))),React.createElement(ws,{sel:a})):React.createElement("div",{className:"wb-reader-v2__own-header"},React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste an AI answer below. The Reader inspects what it might be missing.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(ye,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(ce,{label:"Which AI did you ask? (optional)"},React.createElement(Ht,{value:m,onChange:_}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Ge,{label:"AI answer received",value:o,onChange:ta,error:v.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1,readOnly:!be,inputRef:le}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Ge,{label:"AI answer received",value:o,onChange:ta,error:v.answer,placeholder:"Paste an AI answer. Anything from ChatGPT, Gemini, Claude\u2026",minAckLength:1,readOnly:!be,inputRef:le})),Ne||je?React.createElement("div",{className:"wb-reader-v2__reveal"},React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(ce,{label:"Question asked"},React.createElement("textarea",{className:me,value:r,onChange:f=>vn(f.target.value),placeholder:"What did you ask the model?",rows:3,style:We,"aria-invalid":!!v.question,readOnly:!be||void 0,"aria-readonly":!be||void 0})),v.question?React.createElement("div",{className:"wb-field-error",role:"alert"},v.question):null,Se&&!v.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(ce,{label:"Optional topic / context"},React.createElement("input",{className:me,value:i,onChange:f=>d(f.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:We}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(ce,{label:"Which AI did you ask? (optional)"},React.createElement(Ht,{value:m,onChange:_})))):null)),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":p},React.createElement(Yr,{state:Ve}),React.createElement("details",{className:"wb-reader-v2__privacy"},React.createElement("summary",{className:"wb-reader-v2__privacy-line"},"Inspections aren't published to our reviewed archive. Don't paste anything sensitive."),React.createElement("p",{className:"wb-reader-v2__privacy-full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See ",React.createElement("a",{href:"/retention.html"},"what deletion means")," and the ",React.createElement("a",{href:"/privacy.html"},"privacy policy"),".")),l?null:React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(C,{kind:"primary",disabled:p||!nt,onClick:aa,className:`wb-reader-cta${nt&&!p?" is-armed":""}${p?" is-inspecting":""}`},p?"Inspecting\u2026":"See what might be missing")))))):null,de.pasteBox?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-demo-trigger-row"},React.createElement("button",{type:"button",className:"wb-demo-trigger",onClick:g?()=>P(!1):xe,"aria-expanded":g},g?"Hide example":"New here? Watch a 20-second example \u2192")),g?React.createElement(xs,{onTryOwn:it,onClose:()=>P(!1)}):null,React.createElement("details",{className:"wb-clarity"},React.createElement("summary",{className:"wb-clarity__summary"},"How it works"),React.createElement("ol",{className:"wb-clarity__steps"},vs.map((f,W)=>React.createElement("li",{key:W,className:"wb-clarity__step"},React.createElement("span",{className:"wb-clarity__num","aria-hidden":"true"},W+1),React.createElement("span",{className:"wb-clarity__text"},f)))))):null,l?React.createElement("div",{ref:f=>{J.current=f,se.current=f},tabIndex:-1,className:"wb-reader-v2__result wb-scroll-anchor"},React.createElement("div",{className:"wb-reader-v2__result-nav"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:G},"\u2190 Edit the answer")),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--hero"},React.createElement(os,{result:l})):null,React.createElement("div",{className:"wb-reader-v2__follow"},React.createElement(ts,{result:l,context:{mode:e,sel:a,question:r,answer:o,model:m,topic:i},onRunAgain:aa})),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--measure"},React.createElement(is,{result:l,context:{mode:e,sel:a,question:r,answer:o,model:m,topic:i}})):null,l.checks&&Array.isArray(l.checks.cards)&&l.checks.cards.length?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--checks"},React.createElement(_s,{result:l})):null,l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--meaning"},React.createElement(wn,{pairRuns:[],findings:Math.max(Array.isArray(l.measurement.findings)?l.measurement.findings.length:0,l.checks&&Array.isArray(l.checks.cards)?l.checks.cards.length:0)})):null,l.measurement&&l.receipt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--perception"},React.createElement(bn,{mode:"single",receipt:l.receipt})):null,l.act2?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--act2"},React.createElement(hs,{result:l,open:I,onOpen:pe,onPairedChange:j,pairedInputRef:ve})):null,de.loop?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--loop"},React.createElement(gs,{mode:e,sel:a,onAnother:yn})):null,React.createElement("p",{className:"wb-reader-v2__post-privacy"},"This inspection wasn't published to our reviewed archive. See ",React.createElement("a",{href:"/retention.html"},"what deletion means"),".")):null,de.chipDoor?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--chip-door"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-chip-door",onClick:U===we?ne:ue,"aria-expanded":U===we,"aria-controls":"wb-chip-lane"},U===we?"Close this":`${E.value_statement.headline} \u2192`)):null,de.chipLane?React.createElement("div",{id:"wb-chip-lane",className:"wb-reader-v2__follow wb-reader-v2__follow--chips"},React.createElement(fs,null)):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(un,{variant:"reader-secondary"})),O?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--funnel"},React.createElement(Ns,null)):null))}function Cs(){let e=M(null),[t]=u(()=>Or());return F(()=>{at();let a=()=>at();return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),React.createElement("div",{className:`wb-shell${t?" wb-shell--reader-v2":""}`,style:{color:L.text,minHeight:"100vh",fontFamily:Y}},React.createElement("style",null,nr),React.createElement("style",null,rr,sr,or,ir,cr),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:ge,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:K,fontSize:11,letterSpacing:"0.18em",color:L.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:L.line,marginBottom:22}}),t?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"Check your AI answer."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped."),React.createElement(Es,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.")),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:ge,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:Y,fontSize:16.5,lineHeight:1.6,color:L.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(jr,null)),t?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:L.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:K,fontSize:11,color:L.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var As=ReactDOM.createRoot(document.getElementById("workbench-root"));As.render(React.createElement(Cs,null));})();
