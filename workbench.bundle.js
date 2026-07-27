/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var ya="reader-receipt-1.1";var Yn="sha256",ee="Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";function Qn(e){return`Candidate gap estimate: ${e} of 3 (unvalidated)`}function Kn(e){return Number.isFinite(e)}function Jn(e){return`Machine gap estimate: ${e} of 3 (unvalidated)`}function Xn(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function Ct(e){if(typeof e=="string")return Xn(e);if(Array.isArray(e))return e.map(Ct);if(e&&typeof e=="object"){let t={};for(let a of Object.keys(e).sort())t[a]=Ct(e[a]);return t}return e}function va(e){let t=Ct(e);return t&&typeof t=="object"&&t.integrity&&typeof t.integrity=="object"&&(t.integrity.content_hash=null),JSON.stringify(t)}var Zn="cfp.1";var er={full:"FULL",partial:"PARTIAL",thin:"THIN"};function Na(e){let t=e||{},a=t.inspection||{},n=t.measurement,r=t.provenance||{},s=[];s.push("\u2014\u2014 THE ANSWER INSPECTED \u2014\u2014"),s.push(`Question: ${(t.question||"").trim()}`),(t.topic||"").trim()&&s.push(`Topic / context: ${t.topic.trim()}`),(t.declared_model||"").trim()&&s.push(`AI used: ${t.declared_model.trim()}`),s.push(""),s.push("Answer:"),s.push((t.answer||"").trim()),s.push(""),s.push("\u2014\u2014 THE READ \u2014\u2014"),s.push(`Completeness: ${er[a.completeness]||(a.completeness||"").toUpperCase()}`),s.push((a.the_read||"").trim()),s.push(""),s.push("What was left out:");let o=Array.isArray(a.what_was_left_out)?a.what_was_left_out.filter(Boolean):[];if(o.length)for(let c of o)s.push(`- ${c}`);else s.push("- (none identified)");if(s.push(""),s.push(`How it was shaped: ${(a.how_it_was_shaped||"").trim()||"(none detected)"}`),(a.inspection_note||"").trim()&&s.push(`Inspection note: ${a.inspection_note.trim()}`),s.push(""),s.push("\u2014\u2014 MEASUREMENT (candidate observations, unvalidated) \u2014\u2014"),n){Kn(n.gap_estimate)&&s.push(Qn(n.gap_estimate)),(n.estimate_rationale||"").trim()&&s.push(`Rationale: ${n.estimate_rationale.trim()}`);let c=n.finding_counts||{};s.push(`Findings by type: candidate missing item: ${c["candidate missing item"]||0} \xB7 candidate framing issue: ${c["candidate framing issue"]||0} \xB7 candidate deflection: ${c["candidate deflection"]||0}`);let i=Array.isArray(n.findings)?n.findings:[];i.length&&(s.push(""),i.forEach((u,_)=>{s.push(`${_+1}. [${u.type}] ${(u.materiality||"").trim()}`),(u.anchor||"").trim()&&s.push(`   anchor: "${u.anchor.trim()}"`)})),s.push(""),s.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.")}else s.push("No measurement layer was produced for this run.");return s.push(""),s.push("\u2014\u2014 PROVENANCE \u2014\u2014"),s.push(`Reader model: ${r.reader_model_version||""}`),s.push(`Inspector prompt version: ${r.inspector_prompt_version||""}`),r.inspector_run_conditions&&s.push(`Inspector run conditions: ${JSON.stringify(r.inspector_run_conditions)}`),r.condition_fingerprint&&s.push(`Condition fingerprint (${r.fingerprint_version||Zn}): ${r.condition_fingerprint}`),s.push(`Source content hash: ${r.source_content_hash||""}`),s.push(`Reader output hash: ${r.reader_output_hash||""}`),s.push(`Run timestamp: ${r.run_timestamp||""}`),r.request_id&&s.push(`Request ID: ${r.request_id}`),s}function Rt(e){let t=e||{};return["\u2014\u2014 INTEGRITY \u2014\u2014",`Algorithm: ${t.algorithm||Yn}`,`Canonicalization version: ${t.canonicalization_version||"1.0"}`,`Content hash: ${t.content_hash||""}`]}function Ea(e){let t=e||{},a=t.open_run||{},n=[];n.push("IMBAS READER \u2014 INSPECTION RECEIPT"),n.push(`Generated: ${t.generated_at||""}`),n.push(`Schema: ${t.schema_version||""}`),n.push(""),n.push(ee),n.push("");for(let r of Na(a))n.push(r);n.push("");for(let r of Rt(t.integrity))n.push(r);return n.push(""),n.push(ee),n.join(`
`)}function Sa(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 PAIRED INSPECTION RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(ee),r.push(""),r.push("\u2014\u2014 THE FIRST (OPEN) ANSWER \u2014\u2014"),r.push("");for(let o of Na(a))r.push(o);r.push(""),r.push("\u2014\u2014 THE TWO-QUESTION TEST (paired, machine estimate) \u2014\u2014"),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(Jn(n.gap_estimate)),(n.estimate_rationale||"").trim()&&r.push(`Rationale: ${n.estimate_rationale.trim()}`),r.push(""),r.push("Targeted prompt (deterministic, from the open answer's candidate gaps):"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("Delta \u2014 what the second answer surfaced that the first did not:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((o,c)=>{let i=(o.signal_pattern||"").trim();r.push(`${c+1}. ${i?`[${i}] `:""}${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (no delta \u2014 the second answer added nothing material over the first)"),r.push(""),r.push("These are machine estimates over a single answer pair, not validated classifications or evidence."),r.push("");for(let o of Rt(t.integrity))r.push(o);return r.push(""),r.push(ee),r.join(`
`)}function Aa(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 USER-DIRECTED FOLLOW-UP RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(ee),r.push(""),r.push("\u2014\u2014 THE FIRST ANSWER \u2014\u2014"),r.push(""),(a.question||"").trim()&&(r.push(`Question: ${a.question.trim()}`),r.push("")),r.push((a.answer||"").trim()),r.push(""),r.push("\u2014\u2014 THE FOLLOW-UP YOU CHOSE \u2014\u2014"),(n.chip_label||"").trim()&&r.push(n.chip_label.trim()),r.push(""),n.chip_id&&r.push(`Chip ID: ${n.chip_id}`),n.instruction_version&&r.push(`Instruction version: ${n.instruction_version}`),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(""),r.push("Instruction you sent:"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("What changed in the second answer:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((o,c)=>{r.push(`${c+1}. ${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (nothing visibly changed under this instruction)"),r.push(""),r.push("This is a user-directed follow-up, not an Imbas inspection finding. It shows what changed under the conditions you recorded; it does not establish that the second answer is correct, complete, or better supported."),r.push("");for(let o of Rt(t.integrity))r.push(o);return r.push(""),r.push(ee),r.join(`
`)}var de={register_heading:"Questions worth asking",register_note:"Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers, not verdicts \u2014 copy a question and check it against a source.",top_label:"Worth asking first",expand_label:"Show the full register",collapse_label:"Show fewer",labels:{trigger:"Trigger",proposition:"Rests on",dependent:"Which carries",dependency:"How they connect",evidence:"Quoted from the answer",verification:"Worth asking",resolver:"Where to check",status:"Status"},provisional_label:"Provisional \u2014 a pointer, not a verdict",copy_affordance:"Copy the question",copied_affordance:"Copied",finding_labels:{omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"},resolver_labels:{authority:"Check against an authority",document:"Check against the document",calculation:"Re-run the calculation",direct_question:"Ask the question directly"},status_labels:{open:"Open",resolved:"Resolved",dismissed:"Set aside"}};var tr="reader-result:";function re(e){throw new RangeError(`${tr} ${e}`)}function M(e){if(e&&typeof e=="object"&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))M(e[t])}return e}function Pe(e){return typeof e=="string"?e:""}var ka=M({omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"}),To=M({"candidate missing item":"omission","candidate framing issue":"framing_drift","candidate deflection":"deflection",Omission:"omission","Framing Drift":"framing_drift",Deflection:"deflection",omission:"omission",framing_drift:"framing_drift",deflection:"deflection"});var De="original_answer",ht="targeted_answer",ar=M([De,ht]),_t=M({QUOTED:"QUOTED",UNRESOLVED:"UNRESOLVED",ABSENT:"ABSENT"}),nr=M({SOURCE_SUPPLIED_NO_QUOTATION:"SOURCE_SUPPLIED_NO_QUOTATION",ARTIFACT_NOT_AVAILABLE_TO_SURFACE:"ARTIFACT_NOT_AVAILABLE_TO_SURFACE"}),Co=new Set(Object.values(nr)),Ae=M({REQUIRED:"REQUIRED",ABSENT_ALLOWED:"ABSENT_ALLOWED",FORBIDDEN:"FORBIDDEN"});var Ta=M({PROBE_ONLY:"PROBE_ONLY",OPEN_ONLY:"OPEN_ONLY",BOTH_DIFFERENT:"BOTH_DIFFERENT"}),Ro=new Set(Object.values(Ta)),xo=M({MATCHED_CONDITIONS:"MATCHED_CONDITIONS",OBSERVED_DIFFERENCE:"OBSERVED_DIFFERENCE"}),Io=M({AUTHORIZED_MATCHED_BASIS:"AUTHORIZED_MATCHED_BASIS",REPORTED_CLIENT_DECLARATION:"REPORTED_CLIENT_DECLARATION",NO_AUTHORIZED_BASIS:"NO_AUTHORIZED_BASIS",UNRECOGNIZED_BASIS:"UNRECOGNIZED_BASIS"}),rr=M({MATCHED:"MATCHED",UNMATCHED:"UNMATCHED",UNVERIFIED:"UNVERIFIED",UNAVAILABLE:"UNAVAILABLE"}),Oo=new Set(Object.values(rr)),sr=M(["server_observed_pair_conditions"]),or=M(["pair_capture_client_declaration"]),Po=new Set(sr),Do=new Set(or);var ir=M({OBSERVED:"OBSERVED",CANDIDATE:"CANDIDATE"}),cr=M({UNREVIEWED:"UNREVIEWED",VERIFIED:"VERIFIED",REJECTED:"REJECTED",UNRESOLVED:"UNRESOLVED"}),Lo=new Set(Object.values(ir)),$o=new Set(Object.values(cr)),Uo=M({LIVE_READER:"live_reader",ARCHIVE:"archive"}),ue=M({ELIGIBLE:"ELIGIBLE",EMITTED:"EMITTED",SUPPRESSED:"SUPPRESSED",NOT_APPLICABLE:"NOT_APPLICABLE"}),ft=M({PROBE_SIDE_ANCHOR_UNSUPPORTED:"PROBE_SIDE_ANCHOR_UNSUPPORTED",OPEN_SIDE_ANCHOR_ABSENT:"OPEN_SIDE_ANCHOR_ABSENT",ANCHOR_NOT_VERBATIM:"ANCHOR_NOT_VERBATIM",NO_CHECK_BLOCK:"NO_CHECK_BLOCK",SHAPE_NOT_REGISTER_ELIGIBLE:"SHAPE_NOT_REGISTER_ELIGIBLE",REGISTER_NOT_BUILT_FOR_SURFACE:"REGISTER_NOT_BUILT_FOR_SURFACE",REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE:"REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE"}),lr=new Set(Object.values(ft));function dr({status:e,card_id:t=null,suppression_reasons:a=[]}){Object.prototype.hasOwnProperty.call(ue,e)||re(`register status not enumerated: ${e}`);let n=Array.isArray(a)?a.slice():[];for(let s of n)lr.has(s)||re(`suppression reason not enumerated: ${s}`);return!(e===ue.SUPPRESSED||e===ue.NOT_APPLICABLE)&&n.length>0&&re(`${e} cannot carry suppression reasons`),e===ue.SUPPRESSED&&n.length===0&&re("SUPPRESSED requires at least one enumerated suppression reason"),e===ue.EMITTED&&!Pe(t).trim()&&re("EMITTED requires a card_id"),e!==ue.EMITTED&&t!=null&&re(`${e} cannot carry a card_id`),M({status:e,card_id:t==null?null:Pe(t),suppression_reasons:n})}var xt=new Map;function It(e){let t=Pe(e&&e.id).trim();t||re("a finding shape requires an id"),xt.has(t)&&re(`finding shape already registered: ${t}`);let a=Pe(e.surface).trim();a!=="single"&&a!=="paired"&&re(`shape surface must be single or paired: ${t}`);let n={};for(let o of ar){let c=(e.anchors||{})[o]||Ae.FORBIDDEN;Object.prototype.hasOwnProperty.call(Ae,c)||re(`anchor requirement not enumerated for ${t}.${o}: ${c}`),n[o]=c}let r=dr(e.register_default||{status:ue.NOT_APPLICABLE,suppression_reasons:[ft.SHAPE_NOT_REGISTER_ELIGIBLE]}),s=M({id:t,surface:a,anchors:n,directional:!!e.directional,register_default:r,label:Pe(e.label)||t});return xt.set(t,s),s}function ur(e){return xt.get(Pe(e))||null}var pr="single_candidate_item",mr="paired_observed_difference",_r="paired_comparative_contrast";It({id:pr,surface:"single",label:"Candidate item in one answer",anchors:{[De]:Ae.ABSENT_ALLOWED},directional:!1,register_default:{status:ue.ELIGIBLE}});It({id:mr,surface:"paired",label:"Difference observed under the probe",anchors:{[ht]:Ae.ABSENT_ALLOWED,[De]:Ae.ABSENT_ALLOWED},directional:!0,register_default:{status:ue.SUPPRESSED,suppression_reasons:[ft.PROBE_SIDE_ANCHOR_UNSUPPORTED]}});It({id:_r,surface:"paired",label:"Contrast quotable on both sides",anchors:{[ht]:Ae.REQUIRED,[De]:Ae.REQUIRED},directional:!0,register_default:{status:ue.SUPPRESSED,suppression_reasons:[ft.PROBE_SIDE_ANCHOR_UNSUPPORTED]}});function Ca(e){let t=ur(e&&e.shape);return t||re(`cannot describe an unregistered shape: ${e&&e.shape}`),M({id:e.id,shape:t.id,shape_label:t.label,surface:t.surface,class_id:e.class_label,class_display:ka[e.class_label],statement:e.statement,materiality:e.materiality,anchors:e.anchors.map(a=>({role:a.role,status:a.status,quote:a.quote,absent_reason:a.absent_reason})),directional:t.directional,comparison_direction:e.comparison_direction,claim_register:e.claim_register,claim_basis:e.claim_basis,conditions_status:e.conditions_status,reader_state:e.reader_state,disposition:e.disposition})}var Ra=M({surfaced_candidate_items:{id:"surfaced_candidate_items",unit_one:"candidate item",unit_many:"candidate items",predicate_id:"single_shape_with_at_least_one_quoted_anchor",predicate_note:"Findings on the single-answer surface carrying at least one anchor that resolves verbatim against the pasted answer."},probe_surfaced_differences:{id:"probe_surfaced_differences",unit_one:"difference",unit_many:"differences",predicate_id:"paired_probe_only_with_quoted_probe_anchor",predicate_note:"Paired findings whose comparison_direction is PROBE_ONLY and whose probe-side anchor resolves verbatim against the probe answer."},recorded_findings:{id:"recorded_findings",unit_one:"finding",unit_many:"findings",predicate_id:"every_canonical_finding",predicate_note:"The whole canonical collection, including findings the Check Register suppressed. This is what the durable record carries."}}),hr={single_shape_with_at_least_one_quoted_anchor:e=>e.surface==="single"&&e.anchors.some(t=>t.status===_t.QUOTED),paired_probe_only_with_quoted_probe_anchor:e=>e.surface==="paired"&&e.comparison_direction===Ta.PROBE_ONLY&&e.anchors.some(t=>t.role===ht&&t.status===_t.QUOTED),every_canonical_finding:()=>!0};function bt(e,t){let a=Ra[t];a||re(`count not defined: ${t}`);let n=hr[a.predicate_id];return(e&&e.findings||[]).filter(n)}function Ot(e,t){return bt(e,t).length}function Pt(e,t){let a={};for(let n of Object.keys(ka))a[n]=0;for(let n of bt(e,t))a[n.class_label]++;return a}function xa(e,t){let a=Ra[t];a||re(`count not defined: ${t}`);let n=Ot(e,t);return`${n} ${n===1?a.unit_one:a.unit_many}`}var Ia="Want to test it? Here's a direct question that gives nothing away.",Dt="The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets.",fr=["ceiling","timeout","network","api_error","capacity","429"];function Lt(e){return fr.includes(String(e==null?"":e).toLowerCase())}function br(e){return String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`)}var Ze="Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";var Le="gap_revealed",et="still_missing",$e="not_clear_yet",$t=[Le,et,$e];function Oa({gap_estimate:e,signal_counts:t}={}){let a=Number(e);if(!Number.isFinite(a)||a<=0)return et;let n=t||{},r=(Number(n.Omission)||0)+(Number(n.Deflection)||0);return(Number(n["Framing Drift"])||0)>r?$e:Le}var wt="What it told you",gt="What it told you when you asked",tt="Didn't come up.",Pa="Your session, your conditions \u2014 not the lab's.",Ue={[Le]:{headline:"It answers when asked. It just didn't volunteer.",tag:"That's the Volunteer Gap \u2014 you just watched it happen in your own chat.",chip:"It didn't volunteer"},[et]:{headline:"You asked directly. It still didn't surface.",cta:"Push harder \u2192",chip:"Still didn't surface"},[$e]:{headline:"The second answer changed. The gap isn't clean.",cta:"Try the cleaner check \u2192",swapPanels:!0,chip:"Not clear yet"}},wr="The targeted answer included information the open answer did not.",gr=[Le,$e];function Da(e,t){let a=Ue[e]||{};if(!t)return a;let n={...a};return delete n.tag,gr.includes(e)&&(n.headline=wr),n}var Fe="quick",qe="cleaner",La="Same chat is faster. A fresh chat gives you a cleaner comparison.",Ut={label:"Quick check",hint:"Same chat. Paste the question, ask again."},Ft={label:"Cleaner check",hint:"Fresh chat. Copy the setup, then ask."};function $a({question:e}={}){let t=typeof e=="string"?e.trim():"",a=[];return t&&(a.push(t),a.push("")),a.push(Ze),br(a.join(`
`)).trim()}var te={YES:"yes",NO:"no",NOT_SURE:"not_sure"},pe={NONE:"none",EDITED:"edited"},yr="unverified",vr=80;function Nr({same_model:e,edits:t}={}){return t===pe.EDITED||e===te.NO?!1:e===te.YES&&t===pe.NONE?!0:yr}function qt({same_model:e,model_version:t,edits:a}={}){let n={same_model_claimed:e===te.YES,user_edits_disclosed:a===pe.EDITED,conditions_matched:Nr({same_model:e,edits:a})},r=typeof t=="string"?t.trim():"";return r&&(n.model_version_user_reported=r.slice(0,vr)),n}function at(e){return!e||e.conditions_matched!==!0}var ge={INSPECTION_FOLLOWUP:"inspection_followup",USER_CHIP:"user_chip",LEGACY_UNKNOWN:"legacy_unknown"};function Er(e){return e===ge.INSPECTION_FOLLOWUP||e===ge.USER_CHIP?e:ge.LEGACY_UNKNOWN}function Ua({targeted_prompt:e,original_artifact_id:t,targeted_artifact_id:a,capture:n,initiator:r,targeted_prompt_hash:s,chip_id:o,instruction_version:c}={}){let i={targeted_prompt:typeof e=="string"?e:"",original_artifact_id:typeof t=="string"?t:"",targeted_artifact_id:typeof a=="string"?a:"",capture:n&&typeof n=="object"?n:{},initiator:Er(r),targeted_prompt_hash:typeof s=="string"?s:""};return i.initiator===ge.USER_CHIP&&(i.chip_id=typeof o=="string"?o:"",i.instruction_version=typeof c=="string"?c:""),i}var F={heading:"One quick thing before the side-by-side",intro:"This just marks how you ran the two answers. It never changes what they say.",same_model:{question:"Did both answers come from the same AI \u2014 same provider, same model?",options:{[te.YES]:"Yes, the same one",[te.NO]:"No, a different one",[te.NOT_SURE]:"Not sure"}},model_version:{question:"Which model did you use? Optional.",hint:"The name or version, as you remember it.",placeholder:"e.g. the model or version you ran"},edits:{question:"Did you edit either answer before pasting?",options:{[pe.NONE]:"No, neither was edited",[pe.EDITED]:"Yes, I edited one or both"}},disclosure:"This marks how clean the capture was. It doesn't decide whether the conditions lined up.",unmatched_warning:"The conditions behind these two answers aren't confirmed as matched \u2014 a different model, an edit, or a setup you weren't sure about. Read the side-by-side as a looser comparison, not a like-for-like.",unmatched_badge:"Unmatched conditions"};var Mt="chip_change_visible",Bt="chip_change_not_visible",Ht="chip_change_unclear",Fa=[Mt,Bt,Ht];function qa({delta_count:e,conditions_matched:t}={}){let a=Number(e);return!Number.isFinite(a)||a<=0?Bt:t===!0?Mt:Ht}var Gt={[Mt]:{headline:"The change you asked for shows up in the second answer.",note:"That's under the conditions you recorded. It doesn't mean the second answer is correct or complete.",chip:"The change shows up"},[Bt]:{headline:"The second answer doesn't show the change you asked for.",note:"No visible difference isn't an all-clear. The change could be there in a way this comparison doesn't catch.",chip:"I don't see the change"},[Ht]:{headline:"Something changed, but not under matched conditions.",note:"A different model, an edit, or a setup you weren't sure about. Read this as a looser comparison, not like-for-like.",chip:"Hard to tell"}},A={value_statement:{headline:"Tell your AI exactly what to do next.",sub:"Paste the answer or draft. Tap what bothered you. Get the exact instruction to paste back."},row_header:"What would you like the next answer to do differently?",row_support:"These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",card:{framing:"Paste this into the same AI, in the same conversation if possible. If you start a new conversation, include the original answer and any material it relied on. Bring the new answer back."},side_by_side:{reason_prefix:"Follow-up selected by you: ",first_answer_caption:"The answer or draft you started with.",second_answer_caption:"Second answer after your follow-up. Not verified by Imbas."},meaning_panel_line:"This comparison follows a user-selected instruction, not an inspection-generated follow-up. It shows what changed under the recorded conditions; it does not establish that the second answer is correct, complete, or better supported. Absence of a visible difference is not an all-clear.",boundary:"User-directed follow-up. No Imbas inspection finding asserted.",professional_cue:{line:"AI made the draft. Your name still goes on it.",link:"For professional work \u2192"},compose:{first_answer_label:"The answer or draft you started with",first_answer_placeholder:"Paste the answer or draft you want to change\u2026",second_answer_label:"Second answer after your follow-up",second_answer_placeholder:"Paste what your AI came back with\u2026",copy_label:"Copy the instruction",copy_done:"Copied \u2014 now paste it into your AI",edit_first_answer:"Edit the first answer",compare_label:"Compare the two answers",comparing_label:"Comparing\u2026",first_answer_missing:"Paste the answer or draft you started with.",second_answer_missing:"Paste the second answer your AI gave.",chip_missing:"Pick a follow-up above first.",too_long:"Second answer is over 1200 words. Trim it and re-run.",too_short:"That's too short to compare. Paste the full second answer.",not_eligible:"That follow-up isn't available right now. Pick another and try again.",blocked:"This follow-up can't run right now. Check what you pasted and try again.",run_error:"The comparison didn't reach the Reader. Nothing you pasted was changed. Try again shortly."},reveal:{delta_heading:"What changed",empty_delta:"No visible difference under the instruction you chose. That isn't an all-clear: the change could be there in a way this comparison doesn't catch.",first_side_label:"First answer",second_side_label:"Second answer",correct_label:"Read it differently?",reset_label:"Try another follow-up",idempotent_notice:"You already ran this follow-up. This is the comparison from that run.",capture_uncertain_notice:"The comparison is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."}};function Wt(e){if(e&&(typeof e=="object"||typeof e=="function")&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))Wt(e[t])}return e}var Sr=Wt({CAPTURE_DERIVED:"capture_derived",DOSSIER_DERIVED:"dossier_derived",PRACTICE_DERIVED:"practice_derived",MIXED:"mixed"}),Me=Sr,Be="v1",He="2026-07-20",Ge="authored, pending founder review and bounded testing",Vt=Wt([{id:"sq.material",approved_ui_label:"Didn't use the material I provided",instruction_text:`Answer my question again, or revise the draft, using the document, text, or data I gave you as your main source. Build your claims on what that material actually says.

Point to the exact parts you drew on: the section, passage, or figure behind each claim. Keep what comes from my material separate from anything you add from general knowledge.

Where my material already answers the question, don't reach for a generic assumption instead. If you can't open or read part of what I gave you, or it isn't here in this conversation, say so plainly and ask for it rather than filling the gap.`,instruction_version:Be,seeding_tag:Me.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 1: the documented 2026-07-20 instrument pass found no captured analogue (0/90 prompt-bearing files; the corpus names anchors but supplies no material). Practice-derived and anchor-free by necessity \u2014 the person can point at 'the document I gave you' without naming what it should have contained. Generalizes the always-true instruction: prefer the supplied material as the primary source, expose which parts were used, and admit when the material is inaccessible. No anchor is lost because none was ever captured for this class.",author:"Imbas",date:He,review_status:Ge,known_misuse_risks:["Used on an answer where the person supplied no document, text, or data \u2014 there is no material to prefer, so the instruction has nothing to bind to.","Read as a demand to treat the supplied material as the only allowable source even where it is silent, pushing the model to over-claim from a thin document."],negative_examples:["A general-knowledge question asked with no attachment or pasted source ('What is the capital of Australia?').","A request for the model's own opinion or a brainstorm, where no external material was offered or intended."],content_hash:"d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a"},{id:"sq.sources",approved_ui_label:"Doesn't show where its claims came from",instruction_text:`As you answer again, or go back through the draft, show me where each important factual claim comes from. Name the source behind it: a citation, a document, a study, or another specific reference someone could look up.

Mark clearly which claims rest on a real source and which are your own inference or estimate.

Don't invent a citation, and don't imply a source backs a claim when you haven't checked that it does. Where you don't have a genuine source for something, say so and label it as your own reasoning rather than dressing it up as sourced.`,instruction_version:Be,seeding_tag:Me.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-006","imbas-instrument:registry/cases/case-012"],abstraction_note:"Seeds: case-006 (targeted prompt naming Kennan/Burns/Matlock/Gates; capture og-006-B-claude-targeted.md reproduces each authority with a citation, L5/17/28/37) and case-012 (naming Hviid 2019 and IOM 2011; capture og-012-B-gpt-targeted.md, inline citations L2/5/13/18); structural analogues in cases 002, 010, 013. Those captures name a specific omitted authority. The template generalizes to the anchor-free form: source the model's OWN claims, whatever they are. Lost: the named authority \u2014 the person cannot supply the very source they don't know is missing. Dossier reinforcement only, not a capture: sg-ctr-currency-over-10k.md L58-66 states the mechanism (name the source, add no new triggering fact).",author:"Imbas",date:He,review_status:Ge,known_misuse_risks:["Pushed onto a purely subjective or creative answer (a poem, an opinion) where source attribution does not apply.","Read as requiring a formal citation for every sentence, driving the model to attach nominal references that don't actually support the point."],negative_examples:["A creative-writing or opinion request with no factual claim to source.","A step in a math derivation where each line follows from the previous, not from an external source."],content_hash:"42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81"},{id:"sq.date_version",approved_ui_label:"Doesn't say what date or version applies",instruction_text:`Answer again, or revise the draft, and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to.

Then check whether the version you're using has since been amended, replaced, or updated, and name the one that applies now wherever you can confirm it.

If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is.`,instruction_version:Be,seeding_tag:Me.MIXED,seed_case_ids:["imbas-instrument:registry/cases/case-005","imbas-instrument:registry/cases/case-009"],abstraction_note:"Two clauses, two provenances, so the tag is mixed. The date/version clause descends from captures: case-005 (SEC Rule 10b-18, 1982; og-005-B-gpt-targeted.md L3/L26) and case-009 (2023 ODNI declassified summary; og-009-B-claude-targeted.md L14-16/48) \u2014 each anchors a specific dated authority. The supersession clause descends from dossier-only material with no capture: imbas-instrument:data/annex-exemplars/dossiers/tx-ctc-permanence-vol-asym.md L39-42 (Public Law 119-21 permanence; L220 'No capture exists') and the case-bank repeal subset. The template generalizes both to the anchor-free form: date every time-sensitive point in the model's own answer and check it for supersession. Lost: the named rule and the named repeal.",author:"Imbas",date:He,review_status:Ge,known_misuse_risks:["Applied to a timeless fact (a definition, a settled physical constant) where no date or version is meaningful.","Read as a demand to assert the current version even where the model cannot check it, inviting a fabricated 'latest as of' claim."],negative_examples:["A question about a mathematical identity or a fixed historical date, where nothing versions.","An answer that already carries explicit, dated sourcing for every time-sensitive point."],content_hash:"dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8"},{id:"sq.direct_answer",approved_ui_label:"Didn't answer the question I actually asked",instruction_text:`Start by answering the exact question I asked. Restate that question back to me in one line first, so I can see it hasn't been quietly narrowed, widened, or swapped for a nearby one. If you're revising a draft, do the same for the question the draft is meant to answer.

Give the direct answer up front. Add only the background that answer actually needs, and put it after the answer, not before.

If the question can't be answered as I asked it, or something it needs is missing, name the specific thing that's in the way. Don't quietly trade my question for an easier one you can answer instead.`,instruction_version:Be,seeding_tag:Me.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 4: no captured analogue by the documented 2026-07-20 search. The instrument's design is between-condition across fresh conversations, not a re-ask; case-003 v2 is a framing test, not a re-ask; the single regex hit was a false positive inside captured answer prose. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: answer the exact question first, restate it so any substitution is visible, and name the obstacle instead of swapping in an easier question. No anchor is lost because none was captured.",author:"Imbas",date:He,review_status:Ge,known_misuse_risks:["Used when the person's question is genuinely ambiguous, where restating one reading as 'the exact question' can lock in the wrong one.","Read as a ban on all context, producing a bare answer that drops caveats the question actually needed."],negative_examples:["An open-ended brainstorming prompt where no single direct answer is expected.","A request that explicitly asks for broad exploration or a set of options rather than one answer."],content_hash:"98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a"},{id:"sq.quantity",approved_ui_label:"Didn't give the number or range I asked for",instruction_text:`Give the number, range, or threshold I asked for. If you're revising a draft, make sure that figure is actually stated in it, not left implied. Where a single figure is fair, give the figure; where it isn't, give a realistic range instead of a single point.

Show your work: the inputs and assumptions behind the figure, and the calculation where there is one. Keep the values you actually know apart from the ones you're estimating.

If the evidence doesn't get you to a solid number or range, say so outright and name what you'd need to get there. Don't invent a precise figure just to look more certain than you are.`,instruction_version:Be,seeding_tag:Me.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-004","imbas-instrument:registry/cases/case-010"],abstraction_note:"Seeds: case-004 (NNT literature; og-004-B-claude-targeted.md L14/15/36-39/42, NNT about 9, 20-33, 10-30, Cochrane figures) and case-010 (combined voting power; og-010-B-claude-targeted.md L7/19/39, 20-40% figures); reinforced by og-005 L26 ($942B, 2024) and og-012 L5 (HR 0.93, 95% CI 0.85-1.02). The captured sub-mechanisms diverge \u2014 a single settled figure versus an empirical range \u2014 and the template deliberately covers both: give the figure where one is fair, the realistic range where it isn't, with inputs shown. Anchor-free: the person asks for 'the number I wanted' without knowing it. Lost: the specific quantity and its source literature.",author:"Imbas",date:He,review_status:Ge,known_misuse_risks:["Applied to a question that is not quantitative, manufacturing a number where none belongs.","Read as always requiring a range, so a well-established single figure gets diluted into a vague band."],negative_examples:["A qualitative 'how should I approach this?' question with no quantity at issue.","A definitional or yes/no question where a number is not responsive."],content_hash:"12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e"},{id:"sq.fact_assumption",approved_ui_label:"Mixes facts with assumptions",instruction_text:`Answer again, or go back through the draft, and keep three things apart: what you actually know, what you're assuming, and what you're inferring from those. Say which is which as you go.

For each main conclusion, show what it rests on: the facts and the assumptions it depends on. Where something is still unsettled, name it as an open question instead of smoothing it over.

Don't hand me an assumption, an inference, or an estimate dressed up as an established fact.`,instruction_version:Be,seeding_tag:Me.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 6: no captured analogue by the documented 2026-07-20 search (0/90). The instrument constitution's epistemic chain is instrument-internal review discipline, never a model-directed prompt, and is deliberately NOT claimed as an analogue here. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: separate what is known from what is assumed or inferred, tie each conclusion to what it rests on, and never present an assumption as an established fact. No anchor is lost because none was captured.",author:"Imbas",date:He,review_status:Ge,known_misuse_risks:["Forced onto a simple factual answer that has no assumptions to separate, adding empty scaffolding.","Read as a demand to label ordinary settled facts as 'assumptions', overstating how uncertain they are."],negative_examples:["A single verifiable lookup ('What year did X happen?') with no inference chain.","A creative or opinion answer where a fact/assumption split does not apply."],content_hash:"e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309"}]);var rt="inspect",he="chips",ke="compose",st="inspecting",ot="result",it="followup",ct="compare",lt="delta",Te="chips",nt=[ke,st,ot,it,ct,lt],yt=[...nt,Te],We="compose-answer",Ma="paired-answer",Ar="chip-answer",zt="advance",jt="async",vt="degraded",Ha="init",Yt="pop";var kr="reverse",Tr=[zt,jt,vt];function Ba(e){return Tr.includes(e)}function Qt(e={}){let{lane:t=rt,busy:a=!1,hasResult:n=!1,hasAct2:r=!1,followUpOpen:s=!1,hasDelta:o=!1}=e;return t===he?Te:a?st:n?o?lt:s?ct:r?it:ot:ke}function Kt(e){switch(e){case ke:return{answerEntry:We,readOnly:[],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!1,focus:"compose-answer",degradedNextAction:"run-reader"};case st:return{answerEntry:null,readOnly:[We],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!1,loop:!1,focus:"status",degradedNextAction:"resolves-to-fallback-result"};case ot:return{answerEntry:null,readOnly:[We],pasteBox:!0,result:!0,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"result-heading",degradedNextAction:"read-result-or-restart"};case it:return{answerEntry:null,readOnly:[We],pasteBox:!0,result:!0,act2:!0,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"act2-heading",degradedNextAction:"copy-instruction-and-run-externally"};case ct:return{answerEntry:Ma,readOnly:[We],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!1,loop:!1,focus:"paired-answer",degradedNextAction:"run-externally-comparison-deferred"};case lt:return{answerEntry:null,readOnly:[We,Ma],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!0,loop:!0,focus:"delta-heading",degradedNextAction:"keep-receipt-or-restart"};case Te:return{answerEntry:Ar,readOnly:[],pasteBox:!1,result:!1,act2:!1,pairedInput:!1,chipLane:!0,chipDoor:!0,loop:!1,focus:"chip-answer",degradedNextAction:"copy-instruction-and-run-externally"};default:return Kt(ke)}}function Ga(e,t){if(e===t)return!1;if(t===Te)return!0;if(e===Te)return!1;let a=nt.indexOf(e),n=nt.indexOf(t);return a!==-1&&n!==-1&&n>a}function Wa(e,{from:t=null,cause:a=Yt,seen:n=[]}={}){let r=!n.includes(e),o=t===null||Ga(t,e)||!Ba(a)?a:kr;return{stage:e,prior_stage:t,cause:o,emit:r,progress:r&&Ba(o),skipped:t!==null&&Cr(t,e)}}function Va(e,t){return t===ke&&e!==null&&e!==ke}function Cr(e,t){let a=nt.indexOf(e),n=nt.indexOf(t);return a!==-1&&n!==-1&&n-a>1}function Nt({search:e="",hash:t=""}={}){let r=new URLSearchParams(e.startsWith("?")?e.slice(1):e).get("start")==="chips"?he:rt,s=String(t||"").replace(/^#/,""),o=/(?:^|&)stage=([a-z-]+)/.exec(s),c=o&&yt.includes(o[1])?o[1]:null;return{lane:r,stage:c}}function za(e,t={}){let a=Qt(t);return!e||!yt.includes(e)?{stage:a,rewrite:!1,reason:"no-stage-hash"}:e===Te?{stage:Te,rewrite:!1,reason:"chip-lane-self-contained"}:Ga(a,e)?{stage:a,rewrite:!0,reason:"stale-stage-hash"}:{stage:e,rewrite:!1,reason:"supported"}}function ja(e){return e===ke?"":`#stage=${e}`}var C={RUN_STARTED:"run_started",RUN_COMPLETED:"run_completed",RESULT_VIEWED:"result_viewed",TARGET_QUESTION_COPIED:"target_question_copied",LOOP_RETURNED:"loop_returned",LOOP_COMPLETED:"loop_completed",STATE_CORRECTED:"state_corrected",CARD_EXPORTED:"card_exported",CANDIDATE_SUBMITTED:"candidate_submitted",RETURN_VISIT:"return_visit",CHIP_ROW_RENDERED:"chip_row_rendered",CHIP_SELECTED:"chip_selected",CHIP_INSTRUCTION_COPIED:"chip_instruction_copied",CHIP_PAIR_INITIATED:"chip_pair_initiated",CHIP_PAIR_COMPLETED:"chip_pair_completed",STAGE_ENTERED:"stage_entered",FOLLOW_UP_REVEALED:"follow_up_revealed",TIMEOUT:"timeout",CAPACITY_DEGRADATION:"capacity_degradation",CAPTURE_UNCERTAIN:"capture_uncertain",RESTORED_SESSION:"restored_session"},Ya=Object.values(C),Rr=new Set(Ya),xr=["run","state","from_state","to_state","stage","prior_stage","cause","occurrence","check","mode","gap","eligible","source","idempotent","initiator","instruction_version","chip","conditions","ms","reason"],Ir=new Set(xr),Or=64;function Pr(e={}){let t={};if(!e||typeof e!="object"||Array.isArray(e))return t;for(let a of Ir){let n=e[a];if(n!=null){if(typeof n=="number")Number.isFinite(n)&&(t[a]=n);else if(typeof n=="boolean")t[a]=n;else if(typeof n=="string"){let r=n.trim();r&&(t[a]=r.slice(0,Or))}}}return t}function Qa(e,t={},a=Date.now()){return Rr.has(e)?{name:e,ts:Number.isFinite(a)?Math.round(a):0,...Pr(t)}:null}function Jt(e){let t=Array.isArray(e)?e.filter(p=>p&&typeof p.name=="string"):[],a=p=>t.reduce((m,h)=>h.name===p?m+1:m,0),n=a(C.TARGET_QUESTION_COPIED),r=a(C.LOOP_COMPLETED),s=a(C.CHIP_INSTRUCTION_COPIED),o=a(C.CHIP_PAIR_COMPLETED),c={},i={};for(let p of t)p.name===C.LOOP_COMPLETED&&p.state&&(c[p.state]=(c[p.state]||0)+1),p.name===C.CHIP_PAIR_COMPLETED&&p.state&&(i[p.state]=(i[p.state]||0)+1);let u={};for(let p of Ya)u[p]=a(p);let _={};for(let p of yt)_[p]=0;for(let p of t)p.name===C.STAGE_ENTERED&&typeof p.stage=="string"&&(_[p.stage]=(_[p.stage]||0)+1);return{counts:u,stage_entries:_,stage_funnel:{inspection_started:_[st],result_delivered:_[ot]+_[it],follow_up_opened:_[ct],comparison_completed:_[lt]},completed_by_state:c,chip_completed_by_state:i,loop_completion_rate:n>0?r/n:null,chip_completion_rate:s>0?o/s:null}}function Ka(){return{armed:!0}}function Ja(e,t){let a=e&&typeof e.armed=="boolean"?e.armed:!0;return t?a?{state:{armed:!1},scroll:!0}:{state:{armed:!1},scroll:!1}:{state:{armed:!0},scroll:!1}}var Xa=["single_yes","single_no"],Za=["paired_small","paired_noticeable","paired_large"],Vo=[...Xa,...Za];function en(e){return e==="single"?{mode:"single",prompt:"Did this surface something you hadn't considered?",options:[{id:"yes",label:"Yes",value:"single_yes"},{id:"no",label:"No",value:"single_no"}]}:e==="paired"?{mode:"paired",prompt:"How big did the difference feel?",options:[{id:"small",label:"Small",value:"paired_small"},{id:"noticeable",label:"Noticeable",value:"paired_noticeable"},{id:"large",label:"Large",value:"paired_large"}]}:null}function tn(e,t){return e==="single"?Xa.includes(t):e==="paired"?Za.includes(t):!1}var Dr="review-graph.v0.3.1",an="review-record.c14n.v1",Lr="review-record.v2",$r="sha256",Ur=new Set(["open","resolved","dismissed"]);var Fr="This is a record of what was examined and what was resolved. It holds provisional discovery outputs: each check is a pointer worth checking against a source, never a verdict on the answer. The integrity block is an unkeyed SHA-256 digest over the record's canonical form \u2014 a fixity check that the listed contents have not shifted since export, not a signature and not proof of who produced it. The record claims nothing beyond what it lists.",dt={action_label:"Download review record",downloaded_label:"Downloaded",action_hint:"A record of what was examined and resolved, as JSON.",download_error:"Could not download the review record"},qr=new Set(["created_at","supplied_at","inspection_run_at","at"]);function rn(e){if(typeof e!="string"||e==="")return e;let t=e.replace(/(\.\d{3})\d+/,"$1"),a=new Date(t);if(Number.isNaN(a.getTime()))throw new Error(`review-record.c14n.v1: unparseable timestamp ${JSON.stringify(e)}`);return a.toISOString()}function Xt(e,t){if(typeof e=="string")return qr.has(t)?rn(e):e;if(Array.isArray(e))return e.map(a=>Xt(a,t));if(e&&typeof e=="object"){let a={};for(let n of Object.keys(e).sort())a[n]=Xt(e[n],n);return a}return e}function Mr(e){let t=e&&typeof e=="object"?e:{},a={};for(let n of Object.keys(t))n!=="integrity"&&(a[n]=t[n]);return JSON.stringify(Xt(a,null))}async function Br(e){let t=new TextEncoder().encode(String(e)),a=globalThis.crypto&&globalThis.crypto.subtle;if(!a)throw new Error("review-record.c14n.v1: WebCrypto SHA-256 is unavailable in this environment");let n=await a.digest("SHA-256",t),r=new Uint8Array(n),s="";for(let o=0;o<r.length;o++)s+=r[o].toString(16).padStart(2,"0");return s}async function Hr(e){return Br(Mr(e))}function q(e){return typeof e=="string"?e:""}function nn(e){return Ur.has(e)?e:null}function Gr({result:e,checkStates:t={},createdAt:a,pair:n=null}={}){let r=q(a);if(!r)throw new Error("assembleReviewRecord: createdAt (ISO 8601) is required");let o=(e&&e.receipt||{}).open_run||{},c=o.provenance||{},i=e&&e.checks||{},u=i.inspector||{},_=q(c.request_id)||"inspection",p=q(c.run_timestamp)||r,h=[{id:"original_answer",role:"original_answer",body:q(o.answer),source_model_user_reported:{name:q(o.declared_model),version:""},verified:!1,supplied_at:p}],l={model:q(u.model)||q(c.reader_model_version),model_version:q(u.model_version)||q(c.reader_model_version),prompt_version:q(u.prompt_version)||q(c.inspector_prompt_version)},f=l,v=[];if(n&&typeof n=="object"&&typeof n.targeted_answer=="string"){let g=n.targeted_source_model&&typeof n.targeted_source_model=="object"?n.targeted_source_model:{};h.push({id:"targeted_answer",role:"targeted_answer",body:n.targeted_answer,source_model_user_reported:{name:q(g.name),version:q(g.version)},verified:!1,supplied_at:q(n.targeted_supplied_at)||p}),v.push(Ua({targeted_prompt:q(n.targeted_prompt),original_artifact_id:"original_answer",targeted_artifact_id:"targeted_answer",capture:n.capture,initiator:ge.INSPECTION_FOLLOWUP,targeted_prompt_hash:q(n.targeted_prompt_hash)})),n.inspector&&typeof n.inspector=="object"&&(f={model:q(n.inspector.model)||l.model,model_version:q(n.inspector.model_version)||l.model_version,prompt_version:q(n.inspector.prompt_version)||l.prompt_version})}let y=Array.isArray(i.detector_events)?i.detector_events:[],E=(Array.isArray(i.checks)?i.checks:[]).map(g=>{let O=nn(t[g&&g.id])||nn(g&&g.status)||"open";return{id:q(g.id),detector_event_id:q(g.detector_event_id),subclass:q(g.subclass),proposition_at_issue:g.proposition_at_issue,dependent_output:g.dependent_output,demonstration:g.demonstration,verification_action:g.verification_action,ranking:g.ranking,status:O}}),I={artifacts:h,pair_runs:v,detector_events:y,checks:E,canonical_result:e&&e.result||o.canonical||null,resolution_evidence:[],inspector:f,versions:{schema:Dr,canonicalization:an,record:Lr,check_model:q(i.version)},timestamps:{created_at:r,inspection_run_at:p},method_note:Fr};return{id:`rr_${_}`,inspection_ids:[_],created_at:r,contents:I,integrity:{algorithm:$r,canonicalization:an,digest:""}}}async function sn(e){let t=Gr(e);return t.integrity.digest=await Hr(t),t}function on(e){let t=q(e&&e.integrity&&e.integrity.digest),a=q(e&&e.created_at),n="unknown";if(a){let s=rn(a);s&&(n=s.slice(0,10))}let r=t?t.slice(0,8):"00000000";return`imbas-review-record-${n}-${r}.json`}var Zt="S1",ea="S2",cn="S3",ta="S4",Wr="S5\u2218S3",Vr="S5\u2218S4",Ve={heading:"Why this inspection matters",section_labels:{what:"What happened",why:"Why this matters",next:"What you can do next"},states:{[Zt]:{what:"The Reader inspected this answer and didn't surface anything that met its bar for a check under the tested conditions.",why:"That's a record of what was inspected, not a verdict on the answer. An inspection that surfaces nothing is not a clean bill of health.",next:"Run the same inspection on a fresh question, or copy the record of this inspection."},[ea]:{what:"The inspection surfaced {N} item(s) worth checking before this answer gets used.",why:"The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",next:"Open the checks, copy a verification question into your own AI, or export the review record."},[cn]:{what:"The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",why:"That's a comparison recorded under these conditions. It does not establish that nothing was left out.",next:"Try a different targeted question, run the pair with another model, or export the record."},[ta]:{what:"The targeted answer contained material the open answer did not.",why:"The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",next:"Review the checks, run the pair again, or export the review record."}},s5_condition_line:"The compared answers were produced under unmatched or unverified conditions, so differences may reflect changed conditions rather than response behavior alone.",archive_boundary:"Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",method_link:{label:"How admission works",href:"/how-it-works.html"}};function zr(e,t){let a=Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,n=`${a} item${a===1?"":"s"}`;return String(e).replace("{N} item(s)",n).replace("{N}",String(a))}function Et(e,{n:t,s5:a}={}){let n=Ve.states[e],r=a?[n.why,Ve.s5_condition_line]:[n.why];return{heading:Ve.heading,section_labels:Ve.section_labels,what:zr(n.what,t),why:r,next:n.next,archive_boundary:Ve.archive_boundary,method_link:Ve.method_link}}function ln({pairRuns:e,findings:t,conditionsMatched:a}={}){let n=Array.isArray(e)&&e.length>0,r=Array.isArray(t)?t.length:Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,s=r>0;if(!n)return s?{state_id:ea,copy:Et(ea,{n:r})}:{state_id:Zt,copy:Et(Zt)};let o=s?ta:cn;return at({conditions_matched:a})?{state_id:o===ta?Vr:Wr,copy:Et(o,{n:r,s5:!0})}:{state_id:o,copy:Et(o,{n:r})}}var{useState:d,useEffect:B,useRef:$}=React,L={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},ye="'Fraunces', Georgia, serif",K="'Inter', ui-sans-serif, system-ui, sans-serif",J="'JetBrains Mono', ui-monospace, monospace",Yr="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",fe="wb-input wb-focus",Qr=`
.wb-focus:focus-visible { outline: 2px solid ${L.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${L.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,Kr=`
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
  font-family: ${ye};
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
  font-family: ${J};
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
`,Jr=`
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
  font-family: ${J};
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(222, 111, 56, 0.88);
  line-height: 1.35;
  flex-shrink: 0;
}
.wb-build-note__text {
  font-family: ${K};
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
  font-family: ${J};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${J};
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
  font-family: ${J};
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
  font-family: ${J};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${J};
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
`,Xr=`
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
  font-family: ${J};
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
  font-family: ${K};
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
  font-family: ${J};
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
  font-family: ${ye};
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
  font-family: ${J};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${ye};
  font-size: 18px;
  line-height: 1.28;
  color: rgba(242, 232, 220, 0.94);
}
.wb-suggest-module__support {
  font-family: ${K};
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
  font-family: ${J};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${L.textDim};
  margin: 0 0 0.28rem;
  line-height: 1.32;
}
.wb-suggest-module__lead {
  font-family: ${K};
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
  font-family: ${K};
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
  font-family: ${J};
  font-size: max(0.625rem, var(--mono-min));
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(180, 106, 90, 0.9);
  margin: 0 0 0.5rem;
}
.wb-result-hero__estimate {
  font-family: ${ye};
  font-weight: 500;
  font-size: clamp(1.5rem, 5.2vw, 2.35rem);
  line-height: 1.16;
  color: rgba(242, 232, 220, 0.97);
  margin: 0 0 0.5rem;
  text-wrap: balance;
}
.wb-result-hero__summary {
  font-family: ${K};
  font-size: clamp(1rem, 2.4vw, 1.125rem);
  line-height: 1.5;
  color: rgba(226, 212, 196, 0.92);
  margin: 0;
}
.wb-result-hero__why {
  font-family: ${K};
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
  font-family: ${K};
  font-size: 0.9375rem;
  line-height: 1.4;
  color: rgba(220, 206, 190, 0.9);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}
.wb-guided-steps__n {
  font-family: ${J};
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
  font-family: ${K};
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
  font-family: ${K};
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
  font-family: ${K};
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
  font-family: ${K};
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
`,Zr=`
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
  font-family: ${J};
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
  font-family: ${K};
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
`,je=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",reveal:"In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",reveal:"In Imbas Case 018, 3 of 4 tested frontier models did not name PDUFA user fees in the open answer.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that models often describe Palantir\u2013ICE contracts without clearly naming the surveillance and deportation context.",reveal:"In Imbas Case 003, across the 4 tested frontier models, Palantir's ICE contract scope stayed under-surfaced on the open answer.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",reveal:"In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",reveal:"In Imbas Case 013, all 4 tested frontier models surfaced the Sackler accountability layer on the open answer. It is the smallest gap in the dataset.",cardShort:"OxyContin & Sacklers"}],es={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function ts({caseId:e,caseTitle:t,model:a,verdict:n,runDate:r}){let{keyAnchor:s,significance:o}=es[e],c={gap_held:`gap held \u2014 the answer did not name ${s}, ${o}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${s}, ${o}.`,key_found:`gap closed \u2014 the answer surfaced ${s}. This gap may be narrowing since May 2026.`},i=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${t}`,`My run (${a}, ${r}): ${c[n]}`,i,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var as=["ChatGPT","Claude","Gemini","Grok","Other"];function ns(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function rs(e){if(!(e!=null&&e.ready))return"";let t=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${t}`}function ss(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function An(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function dn({c:e}){let t=e?An(e):null;return t?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},t.caseLine," \xB7 VERIFIED ",t.verified.toUpperCase())):null}function os(e){return je.find(t=>t.id===e)}function kn(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function k({children:e,onClick:t,kind:a="primary",disabled:n,small:r,className:s=""}){let o={fontFamily:K,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:r?"10px 16px":"12px 22px",borderRadius:6,cursor:n?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:n?.4:1},c={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${a}${r?" wb-btn--small":""}${s?` ${s}`:""}`,onClick:n?void 0:t,disabled:n,style:{...o,...c[a]}},e)}function ve({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function me({label:e,children:t}){return React.createElement("label",{className:"wb-field"},React.createElement(ve,null,e),t)}function Ye({label:e,value:t,onChange:a,error:n,placeholder:r,rows:s=9,style:o,minAckLength:c=1,readOnly:i=!1,inputRef:u=null}){let[_,p]=d(!1),[m,h]=d(null);return React.createElement(me,{label:e},React.createElement("textarea",{ref:u,rows:s,value:t,onChange:f=>{let v=f.target.value;a(v),!xn(v)&&v.trim().length>=c?(h(kn(v)),p(!0)):(h(null),p(!1))},placeholder:r,className:`${fe}${_?" is-paste-received":""}`,style:o||Qe,"aria-invalid":n?!0:void 0,readOnly:i||void 0,"aria-readonly":i||void 0}),m&&!n?React.createElement("div",{className:"wb-paste-ack"},m," words received"):null,n?React.createElement("div",{className:"wb-field-error",role:"alert"},n):null)}var Qe={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:L.text,border:`1px solid ${L.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:K,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function sa({value:e,onChange:t}){return React.createElement("select",{value:e,onChange:a=>t(a.target.value),className:fe,style:{...Qe,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),as.map(a=>React.createElement("option",{key:a,value:a,style:{color:"#111"}},a)))}function ma({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function is(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function cs(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var oa="imbas_wb_email";function Tn(){try{return localStorage.getItem(oa)||""}catch(e){return""}}function ls(e){try{e?localStorage.setItem(oa,e):localStorage.removeItem(oa)}catch(t){}}var Cn="imbas_reader_events",un=500;function _a(){try{let e=localStorage.getItem(Cn),t=e?JSON.parse(e):[];return Array.isArray(t)?t:[]}catch(e){return[]}}function D(e,t={}){let a=Qa(e,t);if(!a)return null;try{let n=_a();n.push(a);let r=n.length>un?n.slice(n.length-un):n;localStorage.setItem(Cn,JSON.stringify(r))}catch(n){}return a}function aa(e){var t,a,n;return((n=(a=(t=e==null?void 0:e.receipt)==null?void 0:t.open_run)==null?void 0:a.provenance)==null?void 0:n.request_id)||""}function ds({onFollow:e,onSkip:t}){let[a,n]=d(""),r=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(ve,null,"Your email"),React.createElement("input",{type:"email",value:a,placeholder:"you@domain.com",onChange:s=>n(s.target.value),className:fe,style:{...Qe,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"primary",disabled:!r,onClick:()=>e(a)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(k,{kind:"ghost",onClick:t},"Continue without email \u2192")))}function us(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function Rn(e,t,a){let n=t.map(i=>({term:i,found:us(e,i),isKey:a.includes(i)})),r=n.some(i=>i.found),s=n.some(i=>i.found&&i.isKey),o;r?s?o="key_found":o="partial":o="gap_held";let c={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[o];return{tokens:n,verdict:o,verdictLine:c}}function ps(e,t){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:t!=null&&t>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function ha({title:e,children:t,className:a="",defaultOpen:n=!1}){let[r,s]=d(n);return React.createElement("div",{className:`wb-collapsible${r?" is-open":""}${a?` ${a}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>s(o=>!o),"aria-expanded":r},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},r?"Collapse":"Expand")),r?React.createElement("div",{className:"wb-collapsible__body"},t):null)}function ms(e){if(!e.length)return[];let t=[...e].sort((n,r)=>n[0]-r[0]),a=[t[0]];for(let n=1;n<t.length;n++){let r=a[a.length-1];t[n][0]<=r[1]?r[1]=Math.max(r[1],t[n][1]):a.push(t[n])}return a}function _s(e,t){let a=[];for(let n of t){let r=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=new RegExp(`(^|[^a-zA-Z0-9])(${r})($|[^a-zA-Z0-9])`,"gi"),o;for(;(o=s.exec(e||""))!==null;){let c=o.index+o[1].length;a.push([c,c+o[2].length])}}return ms(a)}function pn(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function hs(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var mn="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function xn(e){let t=(e||"").trim().split(/\s+/).filter(Boolean);return t.length<20||t.some(a=>a.length>40)?mn:""}function fs(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").exec(e||"");return r?r.index:-1}function bs(e,t){let a=xn(e);if(a)return a;let n=(e||"").trim();if(n.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let r=pn(n);return hs(t).some(s=>pn(s)===r)?"Paste the model's actual answer from your own chat.":""}function _n({text:e,terms:t,litTerms:a}){let n=a||new Set(t.filter(i=>i.found).map(i=>i.term)),r=t.filter(i=>i.found&&n.has(i.term)).map(i=>i.term),s=_s(e,r);if(!s.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:ye,fontSize:15,lineHeight:1.55,color:L.text}},e);let o=[],c=0;return s.forEach(([i,u],_)=>{c<i&&o.push(React.createElement("span",{key:`t-${_}`},e.slice(c,i))),o.push(React.createElement("span",{key:`h-${_}`,style:{color:L.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(i,u))),c=u}),c<e.length&&o.push(React.createElement("span",{key:"tail"},e.slice(c))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:ye,fontSize:15,lineHeight:1.55,color:L.text}},o)}var hn="/api/repository";function ws(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function gs(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function ia(e){if(!hn)return{ok:!1};let t=document.getElementById("wb-hp"),a=t&&typeof t.value=="string"?t.value:"";try{let n=await fetch(hn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:a})}),r=null;try{r=await n.json()}catch(s){}return!n.ok||r&&r.ok===!1?{ok:!1}:{ok:!0}}catch(n){return{ok:!1}}}function In({candidate:e}){let[t,a]=d(!1),n=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your candidate below and email it to brendan@imbaslabs.com"),React.createElement(ha,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(k,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"))))}function ys({candidate:e,submitOk:t}){return t?React.createElement(vs,{candidate:e}):React.createElement(In,{candidate:e})}function vs({candidate:e}){let[t,a]=d(!1),n=JSON.stringify(e,null,2);return React.createElement(ha,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(k,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function Ns({caseId:e,caseTitle:t,model:a,anchors:n,runDate:r}){let[s,o]=d(!1),c=ts({caseId:e,caseTitle:t,model:a,verdict:n.verdict,runDate:r}),i="https://twitter.com/intent/tweet?text="+encodeURIComponent(c);return React.createElement(ha,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},c),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(k,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(c),o(!0),setTimeout(()=>o(!1),1800)}catch(_){}}},s?"Copied \u2713":"Copy result"),React.createElement("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function fa(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function ut(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function Ce(e,t){if(typeof window=="undefined"||!e){t==null||t();return}ut();let a=fa(),n=document.documentElement,r=parseFloat(getComputedStyle(n).getPropertyValue("--header-offset"))||77,s=parseFloat(getComputedStyle(n).getPropertyValue("--scroll-anchor-gap"))||12,o=e.getBoundingClientRect().top+window.scrollY-r-s-6;window.scrollTo({top:Math.max(0,o),behavior:a?"auto":"smooth"}),t&&window.setTimeout(t,a?0:420)}function Es(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}function Ss(){if(typeof window=="undefined")return!1;try{return new URLSearchParams(window.location.search).get("funnel")==="1"}catch(e){}return!1}var As="/api/read",ks="/api/reader-perception";function Ts(e){let t=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:t.filter(a=>a.found).map(a=>a.term),missing:t.filter(a=>!a.found).map(a=>a.term)}}function Cs({mode:e,sel:t,question:a,answer:n,topic:r,model:s}){if(e==="guided"){let o=Rn((n||"").trim(),t.detect||[],t.keyDetect||[]);return{case:{topic:t.topic||t.title||"Guided case",anchor:t.mechanism||t.anchor||"",why_it_matters:t.whyItMatters||""},open_question:t.openPrompt,answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:Ts(o)}}return{case:{topic:(r||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(a||"").trim(),answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function Rs(e){let t=await fetch(As,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){if(t.status===400){let a=await t.json().catch(()=>({}));if(a&&a.error==="too_long")throw new Error("too_long")}throw new Error(`read_${t.status}`)}return t.json()}var On="/api/read-paired";async function xs(e,t){let a=await fetch(On,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:e,targeted_answer:t})}),n=await a.json().catch(()=>({}));if(!a.ok){let r=new Error(n&&n.error||`paired_${a.status}`);throw r.status=a.status,r.info=n||{},r}return n}async function fn(e){let t=new TextEncoder().encode(String(e)),a=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(a)).map(n=>n.toString(16).padStart(2,"0")).join("")}async function Is(e,t){let a=await fn(e),n={receipt_type:"single",schema_version:ya,generated_at:t,open_run:{question:"",answer:e,provenance:{request_id:a.slice(0,16)}},integrity:{content_hash:null}};return n.integrity.content_hash=await fn(va(n)),n}async function Os({firstAnswer:e,targetedAnswer:t,chipId:a,instructionVersion:n}){let r=await Is(e,new Date().toISOString()),s=await fetch(On,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:r,targeted_answer:t,initiator:ge.USER_CHIP,chip_id:a,instruction_version:n})}),o=await s.json().catch(()=>({}));if(!s.ok){let c=new Error(o&&o.error||`chip_paired_${s.status}`);throw c.status=s.status,c.info=o||{},c}return o}var na=800,bn=100,Ps=80,wn=400,ra=700,ca=3,Ds=1.08;function gn(e){return 180-Math.min(Math.max(e,0),ca)/ca*180}function ze(e,t,a,n){let r=n*Math.PI/180;return{x:e+a*Math.cos(r),y:t-a*Math.sin(r)}}function yn(e,t,a,n,r){let s=ze(e,t,a,n),o=ze(e,t,a,r),c=Math.abs(n-r)>180?1:0,i=n>r?1:0;return`M ${s.x} ${s.y} A ${a} ${a} 0 ${c} ${i} ${o.x} ${o.y}`}function Ls({needleValue:e,settled:t}){let s=gn(Math.min(e,ca)),o=ze(120,84,52,s),c=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${t?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:yn(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:yn(120,84,58,180,s),stroke:L.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:t?.76:.42}):null,c.map(i=>{let u=gn(i),_=ze(120,84,61,u),p=ze(120,84,50,u),m=ze(120,84,36,u);return React.createElement("g",{key:i},React.createElement("line",{x1:p.x,y1:p.y,x2:_.x,y2:_.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:m.x,y:m.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:J},i))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:o.x,y2:o.y,stroke:L.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:L.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:o.x,cy:o.y,r:"1.6",fill:L.accentSoft,opacity:t?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function $s({answer:e,anchors:t,caseId:a,caseTitle:n,model:r,runDate:s,gap:o,category:c,observedDate:i,candidate:u,submitOk:_,sequenceReady:p=!0,onAnotherCase:m,onEmailFollow:h}){let l=os(a),f=o!=null?o:l==null?void 0:l.gap,v=c||(l==null?void 0:l.category),y=t.tokens,N=$(fa()),[E,I]=d(!1),g=$(null),[O,G]=d(!1),[H,x]=d(()=>N.current&&f!=null?f:0),[P,j]=d(()=>N.current&&f!=null?f:0),[ae,se]=d(N.current),[T,ne]=d(()=>N.current?new Set(y.filter(S=>S.found).map(S=>S.term)):new Set),[X,R]=d(!1),[w,Y]=d(N.current?y.length:0),[be,we]=d(N.current),[le,oe]=d(!1),[Ke,Ne]=d(N.current),[pt,Re]=d(N.current&&y.some(S=>!S.found)),[St,xe]=d(N.current&&y.some(S=>S.isKey&&S.found)),Ee=y.some(S=>!S.found),Je=kn(e);B(()=>{var U;if(!g.current)return;let S=(U=g.current.closest(".wb-answer-row"))==null?void 0:U.querySelector(".wb-answer-row__bar");S&&S.style.setProperty("--sweep-travel",`${Math.max(S.offsetHeight-2,40)}px`)},[e,p]),B(()=>{if(!p||f==null)return;if(N.current){x(f),j(f),se(!0);return}x(0),j(0),se(!1);let S=performance.now(),U=0,ie=_e=>1-(1-_e)**3,Z=_e=>{let W=Math.min(1,(_e-S)/na);x(Math.round(ie(W)*f*10)/10);let V=f*Ds;if(W<.82){let Se=W/.82;j(ie(Se)*V)}else{let Se=(W-.82)/.18;j(V+(f-V)*ie(Se))}W<1?U=requestAnimationFrame(Z):(j(f),se(!0))};return U=requestAnimationFrame(Z),()=>cancelAnimationFrame(U)},[p,f,a]),B(()=>{if(!p)return;if(N.current){ne(new Set(y.filter(V=>V.found).map(V=>V.term))),R(!1),Y(y.length),we(!0),oe(!0),Ne(!0),Re(Ee),xe(y.some(V=>V.isKey&&V.found));let W=setTimeout(()=>oe(!1),50);return()=>clearTimeout(W)}ne(new Set),R(!1),Y(0),we(!1),oe(!1),Ne(!1),Re(!1),xe(!1);let S=[],U=(W,V)=>{S.push(setTimeout(W,V))};y.forEach((W,V)=>{U(()=>{Y(V+1),W.isKey&&W.found&&xe(!0)},na+V*bn)});let ie=na+y.length*bn;Ee&&U(()=>Re(!0),ie+50);let Z=ie+Ps;U(()=>{we(!0),oe(!0)},Z),U(()=>Ne(!0),Z+wn),U(()=>oe(!1),Z+720);let _e=Z+wn+120;return U(()=>R(!0),_e),y.forEach(W=>{if(!W.found)return;let V=fs(e,W.term),Se=V>=0?V/Math.max(e.length,1)*ra:ra;U(()=>{ne(At=>new Set([...At,W.term]))},_e+Se)}),U(()=>R(!1),_e+ra),()=>{S.forEach(clearTimeout)}},[y.length,a,e,p]);let Xe=`wb-result-inner wb-output-module${le?" is-verdict-pulse":""}${N.current?" is-reveal-instant":""}`,Ie=l?An(l):null,mt=ps(t.verdict,f);return React.createElement("div",{className:Xe},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},Ie?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},Ie.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",Ie.verified))):null),React.createElement("div",{className:"wb-output-module__body"},f!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${f.toFixed(1)} out of 3`},H.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${mt.tone}${be?" is-visible":""}`},mt.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(Ls,{needleValue:P,settled:ae}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},v?React.createElement("span",null,v):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(ve,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},y.map((S,U)=>{let Z=`wb-token-chip${U<w?" is-visible":""}${S.found?" is-found":" is-missing"}`;return React.createElement("li",{key:S.term,className:Z},S.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},S.term,S.isKey?" (key)":""," \xB7 ",S.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${O?" is-expanded":""}`},React.createElement("div",{ref:g,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement(_n,{text:e,terms:t.tokens,litTerms:T})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${X?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>G(S=>!S),"aria-expanded":O},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",Je," words"),React.createElement("span",{className:`wb-answer-row__chevron${O?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${O?" is-open":""}`},React.createElement(_n,{text:e,terms:t.tokens,litTerms:T})))),React.createElement("div",{className:"wb-result-footnote"},Ee?React.createElement("p",{className:`wb-result-discovery-beat${pt?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),a==="006"&&be?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${Ke?" is-visible":""}`},React.createElement(Ns,{caseId:a,caseTitle:n,model:r,anchors:t,runDate:s}),React.createElement(ys,{candidate:u,submitOk:_})),Ke&&!E&&!Tn()?React.createElement(ds,{onFollow:S=>{ls(S),I(!0),h&&h(S)},onSkip:()=>I(!0)}):null,m?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:m},"Test another case \u21BA")):null)}function Us(){let[e,t]=d(je[0]),[a,n]=d(0),[r,s]=d(()=>Tn()),[o,c]=d(""),[i,u]=d(""),[_,p]=d(!1),[m,h]=d(null),[l,f]=d(null),[v,y]=d(!1),[N,E]=d(""),[I,g]=d(!1),[O,G]=d("idle"),H=$(null),x=$(null),P=$(!1);B(()=>{if(!P.current){P.current=!0,ut();return}if(a===2)return;let R=a===1?H.current:x.current,w=window.requestAnimationFrame(()=>Ce(R));return()=>window.cancelAnimationFrame(w)},[a]);let j=()=>{n(0),c(""),u(""),h(null),f(null),E(""),g(!1),p(!1)},ae=R=>{if(!R.ready||R.id===e.id)return;let w=fa(),Y=()=>{t(R),j(),G("in"),window.setTimeout(()=>G("idle"),w?0:200)};if(w){Y();return}G("out"),window.setTimeout(Y,200)},se=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),y(!0),setTimeout(()=>y(!1),2e3)}catch(R){}},T=()=>{Ce(H.current,()=>g(!0))},ne=async()=>{let R=bs(i,e);if(R){E(R);return}E(""),p(!0),g(!1);let w=Rn(i,e.detect,e.keyDetect),Y=w.verdict!=="key_found",be=new Date().toISOString().slice(0,10),we={answer:i,anchors:w,caseId:e.id,caseTitle:e.title,model:o,runDate:be,gap:e.gap,category:e.category,observedDate:e.observedDate},le=ws({mode:"curated",case_id:e.id,model:o,email:r,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:i,gap_held:Y,detect_verdict:w.verdict}),oe=await ia(le);h({...we,submitOk:oe.ok}),f(le),p(!1),n(2),window.requestAnimationFrame(T)},X=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",a===2?"is-result":"",O==="out"?"is-crossfade-out":"",O==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:x,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},je.map(R=>{let w=R.id===e.id;return React.createElement("button",{key:R.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${w?" is-active":""}${R.ready?"":" is-disabled"}`,onClick:()=>ae(R),disabled:!R.ready},R.ready?React.createElement("div",{className:"wb-specimen-plate__label"},ns(R)):React.createElement(ve,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},R.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:H,className:X},a===2&&m?React.createElement($s,{...m,candidate:l,sequenceReady:I,onAnotherCase:j,onEmailFollow:R=>{s(R);let w={...l,email:R};f(w),ia(w)}}):a===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(dn,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Which AI did you ask?"},React.createElement(sa,{value:o,onChange:c}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(Ye,{label:"Paste the model's open answer",value:i,onChange:R=>{u(R),E("")},error:N,placeholder:"Paste the full response here\u2026",minAckLength:20})),N?React.createElement("div",{className:"wb-field-error"},N):null,React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"primary",disabled:_||!o||i.trim().length<200,onClick:ne},"Compare with what Imbas observed \u2192")),!_&&!N&&i.trim().length>0&&i.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(dn,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(ve,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),a===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(ve,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(ma,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:se,className:v?"is-copied":""},v?"Copied \u2713":"Copy question"),React.createElement(k,{kind:"primary",onClick:()=>n(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(cs,null),React.createElement(is,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(Pn,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var la={...Qe,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},vn={...la,minHeight:"unset",resize:"vertical"};function Pn({variant:e="default"}){let[t,a]=d(!1),[n,r]=d("form"),[s,o]=d(""),[c,i]=d(""),[u,_]=d(""),[p,m]=d(""),[h,l]=d(!1),[f,v]=d(null),y=s.trim().length>=4,N=c.trim().length>=8,E=y&&N&&!h;async function I(){if(!E)return;l(!0),v(null);let g=gs({topic:s.trim(),inspect_question:c.trim(),context:u.trim()||null,email:p.trim()||null,source:"workbench_suggest"}),O=await ia(g);l(!1),O.ok?r("done"):v(g)}return n==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):t?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Topic or Question"},React.createElement("input",{className:fe,type:"text",value:s,onChange:g=>o(g.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:la}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"What should be inspected?"},React.createElement("textarea",{className:fe,value:c,onChange:g=>i(g.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:vn}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Optional context, source, or link"},React.createElement("textarea",{className:fe,value:u,onChange:g=>_(g.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:vn}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Optional email for follow-up"},React.createElement("input",{className:fe,type:"email",value:p,onChange:g=>m(g.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:la}))),f?React.createElement(In,{candidate:f}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"primary",disabled:!E,onClick:I},h?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:()=>a(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(k,{kind:"primary",onClick:()=>a(!0)},"Suggest an investigation \u2192"))))}var Nn={idle:"Paste an answer to inspect it.",needQuestion:"Add the question you asked.",ready:"Let's see what might be missing\u2026",inspecting:"Reading the answer\u2026",result:"Inspection complete."},En=["Reading the answer\u2026","Checking what might be missing\u2026","Found something to check\u2026"],Fs={full:"FULL",partial:"PARTIAL",thin:"THIN"},da={full:"The answer substantially served the question.",partial:"Some material context was missing or shaped.",thin:"The answer was evasive or substantially incomplete."};function qs({state:e}){let[t,a]=d(0);B(()=>{if(e!=="inspecting"){a(0);return}let r=window.setInterval(()=>{a(s=>Math.min(s+1,En.length-1))},1100);return()=>window.clearInterval(r)},[e]);let n=e==="inspecting"?En[t]:Nn[e]||Nn.idle;return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},n))}function Dn(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let a=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return a?a[1]:""}function Ms(e){let t=Dn(e).toLowerCase();return Lt(t)?Dt:["no_key","disabled","bad_json"].includes(t)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function ua(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function Ln({mode:e,sel:t,result:a}){return(a==null?void 0:a.source)==="fallback"?"Fallback check":(a==null?void 0:a.source)!=="agent"?"Reader":e==="guided"&&(t!=null&&t.id)?`Reader agent \xB7 Case ${t.id}`:"Reader agent \xB7 Custom answer"}function $n(e){let t=(e==null?void 0:e.completeness)||"partial",a=t.toUpperCase(),n=da[t]||da.partial,r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],s=((e==null?void 0:e.how_it_was_shaped)||"").trim(),o=((e==null?void 0:e.inspection_note)||"").trim(),c=[`Completeness: ${a}`,n,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...r.length?r.map(i=>`- ${i}`):["- (none identified)"],"","HOW IT WAS SHAPED",s||"(none detected)"];return o&&c.push("","INSPECTION NOTE",o),c.join(`
`).trim()}function Bs({mode:e,sel:t,question:a,answer:n,model:r,topic:s,result:o}){let c=e==="guided"?t==null?void 0:t.openPrompt:a,i=(s||"").trim()||(e==="guided"?((t==null?void 0:t.topic)||"").trim():""),u=[];return(o==null?void 0:o.source)==="agent"&&u.push("Inspection receipt",Ln({mode:e,sel:t,result:o}),""),u.push(`Question: ${(c||"").trim()}`),i&&u.push(`Topic / context: ${i}`),(r||"").trim()&&u.push(`AI used: ${r.trim()}`),u.push("","Answer",(n||"").trim()),o&&u.push("",$n(o)),u.push("","Behavior, not intent."),u.join(`
`).trim()}var pa=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`;function Hs({copy:e,firstText:t,secondText:a,smallPrint:n}){let r=e||{},s={label:wt,text:(t||"").trim()},o={label:gt,text:(a||"").trim()},c=r.swapPanels?[o,s]:[s,o],i=["IMBAS READER \u2014 Confirmation Loop",""];r.headline&&i.push(r.headline,"");for(let u of c)i.push(`${u.label}:`,u.text||tt,"");return r.tag&&i.push(r.tag,""),(n||"").trim()&&i.push(`[${n.trim()}]`,""),i.push(ee,"",pa()),i.join(`
`).trim()}var Sn={single:{title:"Share this inspection",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to \xB7 the unvalidated estimate (\u201CCandidate gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show your full answer \u2014 only the short excerpts above."]},paired:{title:"Share this two-question test",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the delta \u2014 what the second answer surfaced that the first did not \u2014 each with the short quoted excerpts from both answers \xB7 the unvalidated estimate (\u201CMachine gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show either full answer \u2014 only the short excerpts above."]}};function Gs(e,t){let a=t==null?void 0:t.error;return e===429?a==="daily_capacity"?"The Reader is at capacity for new shares today. Copy the full receipt for now.":"You've created several share links in a row. Please wait a moment and try again.":e===503||e===500||a==="unconfigured"?"Share links are not live yet. Copy the full receipt for now.":"Could not create share link. Copy the full receipt for now."}function Ws({mode:e,busy:t,error:a,onConfirm:n,onCancel:r}){let s=Sn[e]||Sn.single,o=$(null),c=`wb-share-consent-title--${e}`,i=`wb-share-consent-desc--${e}`,u=s.lines.map((_,p)=>`${i}-${p}`).join(" ");return B(()=>{o.current&&o.current.focus()},[]),B(()=>{let _=p=>{if(p.key==="Escape"){t||r();return}if(p.key!=="Tab")return;let m=o.current;if(!m)return;let h=Array.prototype.slice.call(m.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));if(h.length===0){p.preventDefault(),m.focus();return}let l=h[0],f=h[h.length-1],v=document.activeElement,y=m.contains(v);p.shiftKey?(!y||v===l||v===m)&&(p.preventDefault(),f.focus()):(!y||v===f||v===m)&&(p.preventDefault(),l.focus())};return document.addEventListener("keydown",_),()=>document.removeEventListener("keydown",_)},[t,r]),React.createElement("div",{className:"wb-share-consent",role:"presentation",onClick:t?void 0:r},React.createElement("div",{ref:o,tabIndex:-1,className:"wb-share-consent__panel wb-focus",role:"dialog","aria-modal":"true","aria-labelledby":c,"aria-describedby":u,onClick:_=>_.stopPropagation()},React.createElement("h3",{id:c,className:"wb-share-consent__title"},s.title),s.lines.map((_,p)=>React.createElement("p",{key:p,id:`${i}-${p}`,className:"wb-share-consent__line"},_)),a?React.createElement("p",{className:"wb-share-consent__error",role:"alert"},a):null,React.createElement("div",{className:"wb-share-consent__actions"},React.createElement(k,{kind:"ghost",small:!0,className:"wb-share-consent__confirm",onClick:n,disabled:t},t?"Creating share link\u2026":"Create share link"),React.createElement(k,{kind:"ghost",small:!0,onClick:r,disabled:t},"Cancel"))))}function Un({mode:e,receipt:t,onShared:a}){let[n,r]=d("idle"),[s,o]=d(""),[c,i]=d(""),u=$(null);if(!t)return null;let _=e==="paired"?"Share this two-question test":"Share this inspection",p=n==="consenting"||n==="creating",m=()=>{let N=u.current&&u.current.querySelector(".wb-reader-share__btn");N&&N.focus()};return React.createElement("div",{className:"wb-reader-share",ref:u},s&&(n==="ready"||n==="copied")?React.createElement("div",{className:"wb-reader-share__success",role:"status"},React.createElement("p",{className:"wb-reader-share__success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-share__url"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer"},s)),React.createElement("div",{className:"wb-reader-share__actions"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-share__open"},"Open share page"),React.createElement(k,{kind:"ghost",small:!0,className:n==="copied"?"is-copied":"",onClick:async()=>{if(s)try{await navigator.clipboard.writeText(s),r("copied"),setTimeout(()=>r("ready"),1600)}catch(N){i("Could not copy link. Select the link below and copy manually.")}}},n==="copied"?"Copied":"Copy share link"))):React.createElement(k,{kind:"ghost",small:!0,className:"wb-reader-share__btn",onClick:()=>{i(""),r("consenting")}},_),p?React.createElement(Ws,{mode:e,busy:n==="creating",error:c,onConfirm:async()=>{r("creating"),i("");try{let N=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:t})}),E=await N.json().catch(()=>({}));if(!N.ok||!E.ok||!E.share_url){console.warn("[imbas] inspection-share failed",N.status,E&&E.error),i(Gs(N.status,E)),r("consenting");return}typeof a=="function"&&a(E.share_url),o(E.share_url),r("ready");try{await navigator.clipboard.writeText(E.share_url),r("copied"),setTimeout(()=>r("ready"),1600)}catch(I){}}catch(N){console.warn("[imbas] inspection-share network error",N),i("Could not create share link. Copy the full receipt for now."),r("consenting")}},onCancel:()=>{n!=="creating"&&(i(""),r("idle"),m())}}):null)}function Vs({result:e,context:t,shareUrl:a}){let[n,r]=d(!1),[s,o]=d(!1),[c,i]=d(""),u=m=>{m(!0),i(""),setTimeout(()=>m(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(k,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${$n(e)}

${pa(a)}`),u(r)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},n?"Copied":"Copy Result"),React.createElement(k,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Bs({...t,result:e})}

${pa(a)}`),u(o)}catch(m){i("Could not copy"),setTimeout(()=>i(""),2200)}}},s?"Copied":"Copy Full Receipt"),c?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},c):null)}function zs({result:e,context:t,onRunAgain:a}){let[n,r]=d(""),s=(e==null?void 0:e.completeness)||"partial",o=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],c=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=((e==null?void 0:e.inspection_note)||"").trim(),u=(e==null?void 0:e.source)==="fallback",_=(e==null?void 0:e.source)==="agent",p=Ln({mode:t.mode,sel:t.sel,result:e}),m=u?[ua()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${s}${u?" is-fallback":""}${_?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},_?React.createElement("div",{className:`wb-reader-result__status is-${s}`},React.createElement("div",{className:`wb-reader-result__badge is-${s}`},Fs[s]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},da[s])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),_?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},p)):null,u?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},Ms(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},u?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},m.length?m.map((h,l)=>React.createElement("p",{key:l},h)):React.createElement("p",null,u?ua():"No read returned."))),u?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What may be missing"),o.length?React.createElement("ul",{className:"wb-reader-result__list"},o.map((h,l)=>React.createElement("li",{key:l},h))):React.createElement("p",{className:"wb-reader-result__empty"},"No major gaps flagged in this answer.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},c||"No meaningful shaping detected."))),i?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},i)):null,!u&&_?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),a?React.createElement("div",{className:`wb-reader-result__footer${u?" is-fallback":""}`},_?React.createElement(React.Fragment,null,React.createElement(Vs,{result:e,context:t,shareUrl:n}),React.createElement(Un,{mode:"single",receipt:e.receipt,onShared:r})):null,React.createElement(k,{kind:"ghost",small:!0,onClick:a,className:"wb-reader-result__rerun"},"Run again")):null)}var js={omission:"Candidate missing item",framing_drift:"Candidate framing issue",deflection:"Candidate deflection"};function ba({receipt:e,formatter:t=Ea,filePrefix:a="imbas-reader-receipt",onExport:n}){let[r,s]=d(!1),[o,c]=d(!1),[i,u]=d("");if(!e)return null;let _=l=>{l(!0),u(""),setTimeout(()=>l(!1),1800)},p=l=>{u(l),setTimeout(()=>u(""),2200)};return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions"},React.createElement(k,{kind:"ghost",small:!0,className:r?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2)),_(s),n&&n("json")}catch(l){p("Could not copy")}}},r?"Copied":"Copy JSON"),React.createElement(k,{kind:"ghost",small:!0,className:o?"is-copied":"",onClick:()=>{try{let l=t(e),f=new Blob([l],{type:"text/plain;charset=utf-8"}),v=URL.createObjectURL(f),y=document.createElement("a"),N=(e.generated_at||"").replace(/[:.]/g,"-");y.href=v,y.download=`${a}-${N||"run"}.txt`,document.body.appendChild(y),y.click(),y.remove(),setTimeout(()=>URL.revokeObjectURL(v),0),_(c),n&&n("receipt")}catch(l){p("Could not download receipt")}}},o?"Downloaded":"Download receipt"),i?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},i):null)}function Ys({state:e,copy:t,firstText:a,secondText:n,smallPrint:r,run:s,check:o}){let[c,i]=d(!1),[u,_]=d(!1),[p,m]=d(""),h=E=>{E(!0),m(""),setTimeout(()=>E(!1),1800)},l=E=>{m(E),setTimeout(()=>m(""),2200)},f=()=>Hs({copy:t,firstText:a,secondText:n,smallPrint:r}),v=()=>D(C.CARD_EXPORTED,{run:s,state:e,check:o});return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions wb-card-export"},React.createElement("span",{className:"wb-card-export__label"},"Share what you saw"),React.createElement(k,{kind:"ghost",small:!0,className:c?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(f()),v(),h(i)}catch(E){l("Could not copy")}}},c?"Copied":"Copy card"),React.createElement(k,{kind:"ghost",small:!0,className:u?"is-copied":"",onClick:()=>{try{let E=new Blob([f()],{type:"text/plain;charset=utf-8"}),I=URL.createObjectURL(E),g=document.createElement("a");g.href=I,g.download=`imbas-inspection-card-${s||"run"}.txt`,document.body.appendChild(g),g.click(),g.remove(),setTimeout(()=>URL.revokeObjectURL(I),0),v(),h(_)}catch(E){l("Could not download card")}}},u?"Downloaded":"Download card"),p?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},p):null)}function Qs(e){let t=Pt(e,"surfaced_candidate_items"),a=t.omission||0,n=t.framing_drift||0,r=t.deflection||0,s=[];return a&&s.push(`${a} candidate missing item${a===1?"":"s"}`),n&&s.push(`${n} candidate framing issue${n===1?"":"s"}`),r&&s.push(`${r} candidate deflection${r===1?"":"s"}`),s.length?`Reader found ${s.join(", ")}.`:"Reader found no candidate gaps in this answer. It read clean."}async function Ks(e,t,a,n){for(let r=0;r<2;r++){if(n.current!==a)return;try{let s=await fetch(ks,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:e,value:t})});if(s.ok||s.status<500||r===1)return}catch(s){if(r===1)return}}}function Fn({mode:e,receipt:t}){let a=en(e),[n,r]=d(null),s=$(0);if(!a||!t)return null;let o=c=>{if(!tn(e,c))return;r(c);let i=++s.current;Ks(t,c,i,s)};return React.createElement("div",{className:"wb-perception wb-scroll-anchor"},React.createElement("p",{className:"wb-perception__prompt"},a.prompt),React.createElement("div",{className:"wb-perception__options",role:"group","aria-label":a.prompt},a.options.map(c=>{let i=n===c.value;return React.createElement("button",{key:c.id,type:"button",className:`wb-focus wb-perception__option${i?" is-selected":""}`,"aria-pressed":i,onClick:()=>o(c.value)},c.label)})))}function Js({result:e}){let t=e==null?void 0:e.measurement;if(!t)return null;let a=e.result,n=(t.estimate_rationale||"").trim();return React.createElement("section",{className:"wb-reader-result is-agent wb-result-hero wb-scroll-anchor","aria-labelledby":"wb-result-hero-estimate"},React.createElement("p",{className:"wb-result-hero__eyebrow"},"Inspection result"),React.createElement("p",{id:"wb-result-hero-estimate",className:"wb-result-hero__estimate"},`${xa(a,"surfaced_candidate_items")} surfaced`),React.createElement("p",{className:"wb-result-hero__summary"},Qs(a)),n?React.createElement("p",{className:"wb-result-hero__why"},n):null)}function Xs({result:e,context:t}){var _,p,m;if(!(e==null?void 0:e.measurement))return null;let n=(e==null?void 0:e.receipt)||null,r=e.result,s=bt(r,"recorded_findings").map(Ca),o=Pt(r,"recorded_findings"),c=((t==null?void 0:t.model)||"").trim()||(((_=n==null?void 0:n.open_run)==null?void 0:_.declared_model)||"").trim(),i=(n==null?void 0:n.generated_at)||((m=(p=n==null?void 0:n.open_run)==null?void 0:p.provenance)==null?void 0:m.run_timestamp)||"",u=[c?`Model: ${c}`:"Model: (not declared)"];return i&&u.push(i),React.createElement("section",{className:"wb-reader-result is-agent wb-measure wb-scroll-anchor","aria-labelledby":"wb-measure-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-measure-heading",className:"wb-reader-result__title"},"MEASUREMENT")),React.createElement("p",{className:"wb-reader-result__provenance wb-measure__meta"},u.join(" \xB7 ")),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-measure__findings"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Candidate findings"),React.createElement("p",{className:"wb-measure__counts"},`Missing item: ${o.omission||0} \xB7 Framing issue: ${o.framing_drift||0} \xB7 Deflection: ${o.deflection||0}`),s.length?React.createElement("ul",{className:"wb-measure__list"},s.map(h=>{let l=h.anchors.find(f=>f.role===De&&f.status===_t.QUOTED);return React.createElement("li",{key:h.id,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},js[h.class_id]||h.class_display),(h.materiality||"").trim()?React.createElement("span",{className:"wb-measure__finding-why"},h.materiality.trim()):null,l?React.createElement("blockquote",{className:"wb-measure__anchor"},`"${l.quote}"`):null)})):React.createElement("p",{className:"wb-reader-result__empty"},"No candidate findings \u2014 the answer read clean."))),React.createElement("p",{className:"wb-measure__unvalidated"},"These are candidate observations from a single answer \u2014 inspection hypotheses, not validated classifications or evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},ee),React.createElement(ba,{receipt:n}))}var Zs=[{key:"Omission",cls:"is-omission"},{key:"Framing Drift",cls:"is-framing"},{key:"Deflection",cls:"is-deflection"}];function eo({counts:e}){let t=e||{},a=Zs.map(r=>({...r,n:Number(t[r.key])||0}));return a.reduce((r,s)=>r+s.n,0)<=0?null:React.createElement("div",{className:"wb-xray","aria-hidden":"true"},a.filter(r=>r.n>0).map(r=>React.createElement("span",{key:r.key,className:`wb-xray__seg ${r.cls}`,style:{flexGrow:r.n}})))}function to({paired:e,pair:t,openReceipt:a,onReset:n,run:r,check:s,onTryCleaner:o}){let c=Array.isArray(e.delta_items)?e.delta_items:[],i=e.signal_counts||{},u=t&&t.capture,_=at(u),p=Oa({gap_estimate:e.gap_estimate,signal_counts:i}),[m,h]=d(p);B(()=>{D(C.LOOP_COMPLETED,{run:r,state:p,check:s,gap:e.gap_estimate,source:e.source,idempotent:e.idempotent})},[]);let l=P=>{P!==m&&(D(C.STATE_CORRECTED,{run:r,from_state:m,to_state:P,check:s}),h(P))},f=Da(m,_),v=c[0]||{},y=(v.open_side||"").trim()||tt,N=(v.targeted_side||"").trim()||tt,E=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first",key:"first"},React.createElement("span",{className:"wb-loop__panel-label"},wt),React.createElement("p",{className:"wb-loop__panel-body"},y)),I=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second",key:"second"},React.createElement("span",{className:"wb-loop__panel-label"},gt),React.createElement("p",{className:"wb-loop__panel-body"},N)),g=f.swapPanels?[I,E]:[E,I],O=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||r||"",G=e.receipt&&e.receipt.generated_at||"",H=G?String(G).slice(0,10):"",x=[O?`Run ${O}`:"",H,Pa].filter(Boolean).join(" \xB7 ");return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},"You already ran this pair. This is the analysis from that run."):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},"The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},f.headline),React.createElement("div",{className:"wb-loop__panels"},g),_?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},F.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},F.unmatched_warning)):null,f.tag?React.createElement("p",{className:"wb-loop__tag"},f.tag):null,m===et&&f.cta?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:n},f.cta)):null,m===$e&&f.cta&&s===Fe&&o?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:o},f.cta)):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},"Read it differently?"),$t.map(P=>React.createElement("button",{key:P,type:"button",className:`wb-loop__chip${P===m?" is-active":""}`,"aria-pressed":P===m,onClick:()=>l(P)},(Ue[P]||{}).chip||P))),React.createElement("p",{className:"wb-loop__smallprint"},x),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},ee)),React.createElement("div",{className:"wb-measure__estimate wb-act2__estimate"},React.createElement("div",{className:"wb-measure__estimate-value"},e.gap_estimate_label),(e.estimate_rationale||"").trim()?React.createElement("p",{className:"wb-measure__estimate-why"},e.estimate_rationale.trim()):null),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"The delta"),React.createElement(eo,{counts:i}),React.createElement("p",{className:"wb-measure__counts"},`Omission: ${i.Omission||0} \xB7 Framing Drift: ${i["Framing Drift"]||0} \xB7 Deflection: ${i.Deflection||0}`),c.length?React.createElement("ol",{className:"wb-measure__list"},c.map((P,j)=>React.createElement("li",{key:j,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},P.signal_pattern),React.createElement("p",{className:"wb-measure__finding-why"},P.point),(P.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},"First answer"),`"${P.open_side.trim()}"`):null,(P.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},"Second answer"),`"${P.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No material gap. The direct question surfaced nothing decision-relevant the first answer left out."))),React.createElement(Mn,{pairRuns:[t],findings:c,conditionsMatched:u?u.conditions_matched:void 0}),React.createElement("p",{className:"wb-measure__unvalidated"},"This is a machine estimate over one answer pair. Not a human-scored result, not evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},ee),React.createElement(Ys,{state:m,copy:f,firstText:y,secondText:N,smallPrint:x,run:O,check:s}),React.createElement(ba,{receipt:e.receipt,formatter:Sa,filePrefix:"imbas-reader-paired-receipt"}),React.createElement(qn,{result:{receipt:a},statuses:{},pair:t}),React.createElement(Un,{mode:"paired",receipt:e.receipt}),React.createElement(Fn,{mode:"paired",receipt:e.receipt}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:n},"Test another answer")))}function ao(e){let t=e&&e.info&&typeof e.info.message=="string"?e.info.message.trim():"";return t||"The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly."}function no({openReceipt:e,run:t,check:a,onTryCleaner:n,onPairedChange:r,inputRef:s}){let[o,c]=d(""),[i,u]=d(!1),[_,p]=d(null),[m,h]=d(""),[l,f]=d(""),[v,y]=d(null),[N,E]=d(""),[I,g]=d(null);if(!e)return null;let O=!!o.trim(),G=qt({same_model:v,model_version:N,edits:I}),H=e&&e.open_run||{},x=H.provenance&&H.provenance.reader_model_version||"",P={targeted_answer:o,targeted_prompt:_&&_.targeted_prompt||Ze,targeted_prompt_hash:_&&_.receipt&&_.receipt.paired_analysis&&_.receipt.paired_analysis.targeted_prompt_hash||"",capture:G,targeted_source_model:{name:v===te.YES&&H.declared_model||"",version:N.trim()},inspector:{model:x,model_version:x,prompt_version:"1.1"}},j=T=>{c(T),m&&h(""),l&&f("")},ae=()=>{p(null),c(""),h(""),f(""),y(null),E(""),g(null),r&&r(!1)},se=async()=>{if(!i){if(!O){h("Paste the answer your AI gave the direct question.");return}h(""),f(""),u(!0),D(C.LOOP_RETURNED,{run:t,check:a});try{let T=await xs(e,o);p(T),r&&r(!0)}catch(T){let ne=T&&T.info||{};T&&T.status===400&&ne.error==="too_long"?h("Answer is over 1200 words. Trim it and re-run."):T&&T.status===400&&ne.error==="empty"?h("That's too short to compare. Paste the full answer."):T&&T.status===400?f("This inspection can't run the two-question test. Re-run the answer above, then try again."):f(ao(T))}finally{u(!1)}}};return _?React.createElement("div",{className:"wb-act2__test"},React.createElement(to,{paired:_,pair:P,openReceipt:e,onReset:ae,run:t,check:a,onTryCleaner:n})):React.createElement("div",{className:"wb-act2__test"},React.createElement(Ye,{label:"Answer to the direct question",value:o,onChange:j,error:m,placeholder:"Paste what your AI came back with\u2026",minAckLength:1,inputRef:s}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},F.heading),React.createElement("p",{className:"wb-act2__capture-intro"},F.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},F.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[te.YES,te.NO,te.NOT_SURE].map(T=>React.createElement("button",{key:T,type:"button",className:`wb-act2__capture-opt${v===T?" is-active":""}`,"aria-pressed":v===T,onClick:()=>y(T)},F.same_model.options[T])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-pair-model"},F.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},F.model_version.hint),React.createElement("input",{id:"wb-pair-model",type:"text",className:"wb-act2__capture-input",value:N,maxLength:80,placeholder:F.model_version.placeholder,onChange:T=>E(T.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},F.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[pe.NONE,pe.EDITED].map(T=>React.createElement("button",{key:T,type:"button",className:`wb-act2__capture-opt${I===T?" is-active":""}`,"aria-pressed":I===T,onClick:()=>g(T)},F.edits.options[T])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},F.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(k,{kind:"primary",disabled:i||!O,onClick:se,className:`wb-reader-cta${O&&!i?" is-armed":""}${i?" is-inspecting":""}`},i?"Comparing\u2026":"Compare the two answers")),l?React.createElement("p",{className:"wb-act2__run-error",role:"status"},l):null)}function ro({card:e,run:t,status:a,onStatus:n}){var m,h;let[r,s]=d(!1),[o,c]=d(""),i=$(!1),u=de.labels,_=async()=>{try{await navigator.clipboard.writeText(e.verification_question||""),s(!0),c(""),D(C.TARGET_QUESTION_COPIED,{run:t,check:e.finding_type}),setTimeout(()=>s(!1),1800)}catch(l){c("Could not copy"),setTimeout(()=>c(""),2200)}},p=l=>{l!==a&&(n(e.id,l),l==="resolved"&&!i.current&&(i.current=!0,D(C.LOOP_COMPLETED,{run:t,check:e.finding_type,state:"resolved"})))};return React.createElement("li",{className:`wb-check wb-check--${a}`},React.createElement("div",{className:"wb-check__head"},React.createElement("span",{className:"wb-check__family"},e.family),React.createElement("span",{className:"wb-check__detector"},e.detector_id),React.createElement("span",{className:"wb-check__finding"},e.finding_label),React.createElement("span",{className:"wb-check__provisional"},e.provisional_label)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},u.proposition),React.createElement("blockquote",{className:"wb-check__quote"},(m=e.proposition)==null?void 0:m.text)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},u.dependent),React.createElement("blockquote",{className:"wb-check__quote"},(h=e.dependent_output)==null?void 0:h.text)),React.createElement("p",{className:"wb-check__dependency"},React.createElement("span",{className:"wb-check__label"},u.dependency)," ",e.dependency_statement),React.createElement("div",{className:"wb-check__verify"},React.createElement("span",{className:"wb-check__label"},u.verification),React.createElement("p",{className:"wb-check__question"},e.verification_question),React.createElement("div",{className:"wb-check__actions"},React.createElement(k,{kind:"primary",small:!0,className:r?"is-copied":"",onClick:_},r?de.copied_affordance:de.copy_affordance),React.createElement("span",{className:"wb-check__resolver"},e.resolver_label),o?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},o):null)),React.createElement("div",{className:"wb-check__status",role:"group","aria-label":"Status"},React.createElement("span",{className:"wb-check__label"},u.status),["open","resolved","dismissed"].map(l=>React.createElement("button",{key:l,type:"button",className:`wb-check__status-opt${a===l?" is-active":""}`,"aria-pressed":a===l,onClick:()=>p(l)},de.status_labels[l]))))}function so({result:e}){var p,m,h;let t=e==null?void 0:e.checks,a=((h=(m=(p=e==null?void 0:e.receipt)==null?void 0:p.open_run)==null?void 0:m.provenance)==null?void 0:h.request_id)||"",[n,r]=d(!1),[s,o]=d({}),c=(l,f)=>o(v=>v[l]===f?v:{...v,[l]:f});if(!t||!Array.isArray(t.cards)||t.cards.length===0)return null;let i=t.default_top_n||3,u=t.cards.length>i,_=n?t.cards:t.cards.slice(0,i);return React.createElement("section",{className:"wb-reader-result is-agent wb-checks wb-scroll-anchor","aria-labelledby":"wb-checks-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-checks-heading",className:"wb-reader-result__title"},de.register_heading)),React.createElement("p",{className:"wb-checks__note"},de.register_note),u&&!n?React.createElement("p",{className:"wb-checks__eyebrow"},de.top_label):null,React.createElement("ul",{className:"wb-checks__list"},_.map(l=>React.createElement(ro,{key:l.id,card:l,run:a,status:s[l.id]||l.status||"open",onStatus:c}))),u?React.createElement("button",{type:"button",className:"wb-checks__more wb-focus",onClick:()=>r(l=>!l)},n?de.collapse_label:`${de.expand_label} (${t.cards.length})`):null,React.createElement(qn,{result:e,statuses:s}),React.createElement("p",{className:"wb-reader-result__trust wb-checks__boundary"},ee))}function qn({result:e,statuses:t,pair:a=null}){let[n,r]=d(!1),[s,o]=d(""),c=$(!1);return React.createElement("div",{className:"wb-checks__export"},React.createElement(k,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{if(!c.current){c.current=!0;try{let u=await sn({result:e,checkStates:t,createdAt:new Date().toISOString(),pair:a}),_=new Blob([JSON.stringify(u,null,2)],{type:"application/json;charset=utf-8"}),p=URL.createObjectURL(_),m=document.createElement("a");m.href=p,m.download=on(u),document.body.appendChild(m),m.click(),m.remove(),setTimeout(()=>URL.revokeObjectURL(p),0),o(""),r(!0),setTimeout(()=>r(!1),1800)}catch(u){o(dt.download_error),setTimeout(()=>o(""),2200)}finally{c.current=!1}}}},n?dt.downloaded_label:dt.action_label),React.createElement("span",{className:"wb-checks__export-hint"},dt.action_hint),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null)}function Mn({pairRuns:e=[],findings:t=[],conditionsMatched:a}){let{state_id:n,copy:r}=ln({pairRuns:e,findings:t,conditionsMatched:a});return React.createElement("section",{className:"wb-explain","data-state":n,"aria-label":r.heading},React.createElement("h3",{className:"wb-explain__heading"},r.heading),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.what),React.createElement("p",{className:"wb-explain__body"},r.what)),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.why),r.why.map((s,o)=>React.createElement("p",{key:o,className:"wb-explain__body"},s))),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.next),React.createElement("p",{className:"wb-explain__body"},r.next)),React.createElement("p",{className:"wb-explain__boundary"},r.archive_boundary),React.createElement("p",{className:"wb-explain__method"},React.createElement("a",{className:"wb-explain__method-link",href:r.method_link.href},r.method_link.label," \u2192")))}function oo({result:e,open:t=!1,onOpen:a,onPairedChange:n,pairedInputRef:r}){var v,y,N,E,I;let s=e==null?void 0:e.act2,o=((N=(y=(v=e==null?void 0:e.receipt)==null?void 0:v.open_run)==null?void 0:y.provenance)==null?void 0:N.request_id)||"",c=((I=(E=e==null?void 0:e.receipt)==null?void 0:E.open_run)==null?void 0:I.question)||"",[i,u]=d(!1),[_,p]=d(""),[m,h]=d(Fe);if(B(()=>{!s||!s.eligible||(D(C.FOLLOW_UP_REVEALED,{run:o}),s.available||D(C.CAPACITY_DEGRADATION,{run:o,reason:s.degraded_reason||"spend_ceiling"}))},[o]),!s||!s.eligible)return null;let l=m===qe?$a({question:c}):s.targeted_prompt||Ze,f=async()=>{try{await navigator.clipboard.writeText(l),u(!0),p(""),D(C.TARGET_QUESTION_COPIED,{run:o,check:m}),a&&a(),setTimeout(()=>u(!1),1800)}catch(g){p("Could not copy"),setTimeout(()=>p(""),2200)}};return React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-scroll-anchor","aria-labelledby":"wb-act2-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-act2-heading",className:"wb-reader-result__title"},"THE TWO-QUESTION TEST")),React.createElement("p",{className:"wb-act2__offer"},Ia),React.createElement("div",{className:"wb-act2__check",role:"group","aria-label":"How you'll run the second answer"},React.createElement("p",{className:"wb-act2__check-copy"},La),React.createElement("div",{className:"wb-act2__check-opts"},React.createElement("button",{type:"button",className:`wb-act2__check-opt${m===Fe?" is-active":""}`,"aria-pressed":m===Fe,onClick:()=>h(Fe)},React.createElement("span",{className:"wb-act2__check-label"},Ut.label),React.createElement("span",{className:"wb-act2__check-hint"},Ut.hint)),React.createElement("button",{type:"button",className:`wb-act2__check-opt${m===qe?" is-active":""}`,"aria-pressed":m===qe,onClick:()=>h(qe)},React.createElement("span",{className:"wb-act2__check-label"},Ft.label),React.createElement("span",{className:"wb-act2__check-hint"},Ft.hint)))),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"What to run on your AI"},l),React.createElement("p",{className:"wb-act2__prompt-note"},"Generated from this Reader run. Any question shapes an answer \u2014 this one included."),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(k,{kind:"primary",className:i?"is-copied":"",onClick:f},i?"Copied \u2014 now ask your AI":"Ask your AI \u2192"),s.available&&!t?React.createElement(k,{kind:"ghost",onClick:a},"Paste what came back"):null,_?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},_):null),React.createElement("p",{className:"wb-act2__sub"},"Copy this question. Drop it in your chat. Paste what comes back."),s.available?t?React.createElement(no,{key:m,openReceipt:e.receipt,run:o,check:m,onTryCleaner:()=>h(qe),onPairedChange:n,inputRef:r}):null:React.createElement("p",{className:"wb-act2__degraded",role:"status"},Dt))}function io({chip:e,entry:t,capture:a,onReset:n}){let r=Array.isArray(e.delta_items)?e.delta_items:[],s=at(a),o=a.conditions_matched===!0?"matched":a.conditions_matched===!1?"unmatched":"unverified",c=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||"",i=qa({delta_count:e.delta_count,conditions_matched:a.conditions_matched}),[u,_]=d(i);B(()=>{D(C.CHIP_PAIR_COMPLETED,{run:c,chip:t?t.id:"",instruction_version:t?t.instruction_version:"",state:i,conditions:o,source:e.source,idempotent:e.idempotent})},[]);let p=h=>{h!==u&&(D(C.STATE_CORRECTED,{run:c,from_state:u,to_state:h}),_(h))},m=Gt[u]||{};return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},A.reveal.idempotent_notice):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},A.reveal.capture_uncertain_notice):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},m.headline),t?React.createElement("p",{className:"wb-chip__reason"},A.side_by_side.reason_prefix,t.approved_ui_label):null,React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first"},React.createElement("span",{className:"wb-loop__panel-label"},A.side_by_side.first_answer_caption)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},A.side_by_side.second_answer_caption))),s?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},F.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},F.unmatched_warning)):null,m.note?React.createElement("p",{className:"wb-loop__tag"},m.note):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},A.reveal.correct_label),Fa.map(h=>React.createElement("button",{key:h,type:"button",className:`wb-loop__chip${h===u?" is-active":""}`,"aria-pressed":h===u,onClick:()=>p(h)},(Gt[h]||{}).chip||h)))),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},A.reveal.delta_heading),r.length?React.createElement("ol",{className:"wb-measure__list"},r.map((h,l)=>React.createElement("li",{key:l,className:"wb-measure__finding"},React.createElement("p",{className:"wb-measure__finding-why"},h.point),(h.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},A.reveal.first_side_label),`"${h.open_side.trim()}"`):null,(h.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},A.reveal.second_side_label),`"${h.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},A.reveal.empty_delta))),React.createElement("p",{className:"wb-chip__meaning"},A.meaning_panel_line),React.createElement("div",{className:"wb-reader-result__trust wb-chip__boundary",role:"note"},React.createElement("p",{className:"wb-chip__boundary-lock"},ee),React.createElement("p",{className:"wb-chip__boundary-attr"},A.boundary)),React.createElement("div",{className:"wb-chip__pro-cue"},React.createElement("span",{className:"wb-chip__pro-line"},A.professional_cue.line),React.createElement("span",{className:"wb-chip__pro-link"},A.professional_cue.link)),React.createElement(ba,{receipt:e.receipt,formatter:Aa,filePrefix:"imbas-reader-followup-receipt",onExport:()=>D(C.CARD_EXPORTED,{run:c,chip:t?t.id:"",instruction_version:t?t.instruction_version:""})}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:n},A.reveal.reset_label)))}function co(){let[e,t]=d(""),[a,n]=d(""),[r,s]=d(""),[o,c]=d(null),[i,u]=d(""),[_,p]=d(null),[m,h]=d(!1),[l,f]=d(null),[v,y]=d(!1),[N,E]=d(""),[I,g]=d(""),[O,G]=d(""),H=$(!1);B(()=>{H.current||(H.current=!0,D(C.CHIP_ROW_RENDERED,{}))},[]);let x=Vt.find(w=>w.id===a)||null,P=qt({same_model:o,model_version:i,edits:_}),j=!!x&&!!e.trim()&&!!r.trim(),ae=()=>{I&&g(""),O&&G("")},se=()=>{f(null),t(""),n(""),s(""),c(null),u(""),p(null),g(""),G(""),y(!1)},T=w=>{n(w.id),ae(),D(C.CHIP_SELECTED,{chip:w.id,instruction_version:w.instruction_version})},ne=async()=>{if(x)try{await navigator.clipboard.writeText(x.instruction_text),y(!0),E(""),D(C.CHIP_INSTRUCTION_COPIED,{chip:x.id,instruction_version:x.instruction_version}),setTimeout(()=>y(!1),1800)}catch(w){E("Could not copy"),setTimeout(()=>E(""),2200)}},X=async()=>{if(!m){if(!x){g(A.compose.chip_missing);return}if(!e.trim()){g(A.compose.first_answer_missing);return}if(!r.trim()){g(A.compose.second_answer_missing);return}g(""),G(""),h(!0),D(C.CHIP_PAIR_INITIATED,{chip:x.id,instruction_version:x.instruction_version});try{let w=await Os({firstAnswer:e,targetedAnswer:r,chipId:x.id,instructionVersion:x.instruction_version});f(w)}catch(w){let Y=w&&w.info||{};w&&w.status===400&&Y.error==="too_long"?g(A.compose.too_long):w&&w.status===400&&Y.error==="empty"?g(A.compose.too_short):w&&w.status===400&&Y.error==="not_eligible"?G(A.compose.not_eligible):w&&w.status===400?G(A.compose.blocked):G(Y&&Y.message||A.compose.run_error)}finally{h(!1)}}},R=React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-chip-heading",className:"wb-reader-result__title"},A.value_statement.headline));return l?React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},R,React.createElement(io,{chip:l,entry:x,capture:P,onReset:se})):React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},R,React.createElement("p",{className:"wb-act2__offer"},A.value_statement.sub),React.createElement(Ye,{label:A.compose.first_answer_label,value:e,onChange:w=>{t(w),ae()},placeholder:A.compose.first_answer_placeholder,minAckLength:1,readOnly:!!x}),x?React.createElement("div",{className:"wb-chip__edit-first"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:()=>n("")},`\u2190 ${A.compose.edit_first_answer}`)):null,React.createElement("div",{className:"wb-act2__capture wb-chip__choose",role:"group","aria-label":"Pick a follow-up"},React.createElement("p",{className:"wb-act2__capture-heading"},A.row_header),React.createElement("p",{className:"wb-act2__capture-intro"},A.row_support),React.createElement("div",{className:"wb-chip__row"},Vt.map(w=>React.createElement("button",{key:w.id,type:"button",className:`wb-loop__chip wb-chip__pick${w.id===a?" is-active":""}`,"aria-pressed":w.id===a,onClick:()=>T(w)},w.approved_ui_label)))),x?React.createElement("div",{className:"wb-chip__instruction"},React.createElement("p",{className:"wb-act2__prompt-note"},A.card.framing),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"Instruction to paste into your AI"},x.instruction_text),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(k,{kind:"primary",className:v?"is-copied":"",onClick:ne},v?A.compose.copy_done:A.compose.copy_label),N?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},N):null),React.createElement(Ye,{label:A.compose.second_answer_label,value:r,onChange:w=>{s(w),ae()},placeholder:A.compose.second_answer_placeholder,minAckLength:1}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},F.heading),React.createElement("p",{className:"wb-act2__capture-intro"},F.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},F.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[te.YES,te.NO,te.NOT_SURE].map(w=>React.createElement("button",{key:w,type:"button",className:`wb-act2__capture-opt${o===w?" is-active":""}`,"aria-pressed":o===w,onClick:()=>c(w)},F.same_model.options[w])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-chip-model"},F.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},F.model_version.hint),React.createElement("input",{id:"wb-chip-model",type:"text",className:"wb-act2__capture-input",value:i,maxLength:80,placeholder:F.model_version.placeholder,onChange:w=>u(w.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},F.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[pe.NONE,pe.EDITED].map(w=>React.createElement("button",{key:w,type:"button",className:`wb-act2__capture-opt${_===w?" is-active":""}`,"aria-pressed":_===w,onClick:()=>p(w)},F.edits.options[w])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},F.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(k,{kind:"primary",disabled:m||!j,onClick:X,className:`wb-reader-cta${j&&!m?" is-armed":""}${m?" is-inspecting":""}`},m?A.compose.comparing_label:A.compose.compare_label)),I?React.createElement("p",{className:"wb-act2__run-error",role:"status"},I):null,O?React.createElement("p",{className:"wb-act2__run-error",role:"status"},O):null):null,React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},A.boundary))}function lo({sel:e}){let[t,a]=d(!1),[n,r]=d("");if(!(e!=null&&e.ready))return null;let s=async()=>{try{await navigator.clipboard.writeText(e.openPrompt||""),a(!0),r(""),setTimeout(()=>a(!1),1800)}catch(o){r("Could not copy"),setTimeout(()=>r(""),2200)}};return React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},rs(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__signal wb-guided-trap"},React.createElement("p",{className:"wb-active-case__probe"},"Start with an ordinary question:"),React.createElement(ma,{text:e.openPrompt})),e.reveal?React.createElement("div",{className:"wb-readout__section wb-guided-reveal"},React.createElement("div",{className:"wb-active-case__headline"},e.reveal)):null,React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste what it says back")),React.createElement("div",{className:"wb-guided-copy"},React.createElement(k,{kind:"ghost",small:!0,className:t?"is-copied":"",onClick:s},t?"Copied":"Copy question"),n?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},n):null)))}function uo({mode:e,sel:t,onAnother:a}){let[n,r]=d(!1),[s,o]=d(""),c=e==="guided",i=c&&je.find(p=>p.ready&&p.id!==(t==null?void 0:t.id))||null,u=c&&((i==null?void 0:i.openPrompt)||(t==null?void 0:t.openPrompt))||"";return c&&!u?null:React.createElement("section",{className:"wb-reader-result is-agent wb-loop wb-scroll-anchor","aria-labelledby":"wb-loop-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-loop-heading",className:"wb-reader-result__title"},"TEST ANOTHER QUESTION")),c?React.createElement(React.Fragment,null,React.createElement("p",{className:"wb-loop__lead"},"Run the same check on a fresh question. Copy it, ask your AI, paste what it says back."),React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste the answer back")),React.createElement(ma,{text:u})):React.createElement("p",{className:"wb-loop__lead"},"Run the same check on another answer."),React.createElement("div",{className:"wb-loop__actions"},c?React.createElement(React.Fragment,null,React.createElement(k,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(u),r(!0),o(""),setTimeout(()=>r(!1),1800)}catch(p){o("Could not copy"),setTimeout(()=>o(""),2200)}}},n?"Copied":"Copy question"),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null):null,React.createElement(k,{kind:"primary",small:!0,onClick:()=>a(i)},"Test another question")))}function po({onDismiss:e}){return React.createElement("section",{className:"wb-return","aria-label":"Welcome back"},React.createElement("div",{className:"wb-return__body"},React.createElement("p",{className:"wb-return__headline"},"Welcome back."),React.createElement("p",{className:"wb-return__text"},"You started a check here before. Paste an answer to run another and watch what it leaves out.")),React.createElement("button",{type:"button",className:"wb-return__dismiss",onClick:e,"aria-label":"Dismiss"},"\xD7"))}var mo=["Paste an AI answer to see what it might be missing.","Copy the one question Imbas builds, then ask your own AI.","Paste its reply back and watch what surfaces."];function _o(){let[e]=d(()=>Jt(_a())),t=e.loop_completion_rate,a=t==null?"\u2014":`${Math.round(t*100)}%`,n=e.counts||{},r=[["Runs started",n.run_started],["Runs completed",n.run_completed],["Results viewed",n.result_viewed],["Questions copied",n.target_question_copied],["Loops returned",n.loop_returned],["Loops completed",n.loop_completed],["States corrected",n.state_corrected],["Cards exported",n.card_exported],["Candidates submitted",n.candidate_submitted],["Return visits",n.return_visit]],s=e.completed_by_state||{},o=Object.keys(s).length>0;return React.createElement("section",{className:"wb-funnel","aria-label":"Reader funnel (this browser only)"},React.createElement("div",{className:"wb-funnel__head"},React.createElement("span",{className:"wb-funnel__eyebrow"},"Reader funnel \xB7 this browser only"),React.createElement("p",{className:"wb-funnel__northstar"},React.createElement("span",{className:"wb-funnel__northstar-num"},a),React.createElement("span",{className:"wb-funnel__northstar-label"},"of copied questions returned as completed loops"))),React.createElement("dl",{className:"wb-funnel__grid"},r.map(([c,i])=>React.createElement("div",{key:c,className:"wb-funnel__row"},React.createElement("dt",{className:"wb-funnel__label"},c),React.createElement("dd",{className:"wb-funnel__val"},i||0)))),o?React.createElement("div",{className:"wb-funnel__states"},React.createElement("span",{className:"wb-funnel__states-label"},"Completed by state"),React.createElement("ul",{className:"wb-funnel__states-list"},$t.map(c=>s[c]?React.createElement("li",{key:c,className:"wb-funnel__states-item"},Ue[c]&&Ue[c].chip||c,": ",s[c]):null))):null,React.createElement("p",{className:"wb-funnel__note"},"[Content-minimal: ids, enums, counts only \u2014 never answer or question text. Stored in this browser, nothing leaves your device.]"))}var ho={context:"Public example \xB7 U.S. administrative law",question:"When a court reviews a federal agency's reading of an ambiguous statute, how much weight does the agency's interpretation get?",openAnswer:"Courts apply Chevron deference. If the statute is ambiguous, the court defers to the agency's interpretation as long as it's reasonable \u2014 the two-step framework from Chevron v. NRDC (1984).",leftOut:"Chevron was overruled. In Loper Bright Enterprises v. Raimondo (June 2024), the Supreme Court ended Chevron deference \u2014 courts now interpret ambiguous statutes themselves, de novo, without deferring to the agency.",targetedPrompt:Ze,surfaced:"Chevron no longer governs. Loper Bright v. Raimondo (2024) overruled it; courts now decide a statute's meaning de novo under the Administrative Procedure Act. Governing source: Loper Bright Enterprises v. Raimondo, 603 U.S. 369 (2024).",tag:"That's the Volunteer Gap \u2014 the open answer left it out; the direct question surfaced it. Run your own answer to watch it live."};function fo({onTryOwn:e,onClose:t}){let a=ho,n=(Ue[Le]||{}).headline||"";return React.createElement("section",{className:"wb-demo","aria-labelledby":"wb-demo-heading"},React.createElement("div",{className:"wb-demo__head"},React.createElement("span",{className:"wb-demo__eyebrow"},"WORKED EXAMPLE"),React.createElement("h3",{id:"wb-demo-heading",className:"wb-demo__title"},"Watch the loop on one public example."),React.createElement("p",{className:"wb-demo__context"},a.context)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The question"),React.createElement("p",{className:"wb-demo__q"},a.question)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the AI said"),React.createElement("p",{className:"wb-demo__answer"},a.openAnswer)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the open answer left out"),React.createElement("p",{className:"wb-demo__leftout"},React.createElement("mark",{className:"wb-demo__mark"},a.leftOut))),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The direct question Imbas builds"),React.createElement("p",{className:"wb-act2__prompt wb-demo__prompt"},a.targetedPrompt)),React.createElement("div",{className:"wb-loop__reveal wb-demo__reveal"},React.createElement("p",{className:"wb-loop__headline"},n),React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel"},React.createElement("span",{className:"wb-loop__panel-label"},wt),React.createElement("p",{className:"wb-loop__panel-body wb-loop__panel-body--muted"},tt)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},gt),React.createElement("p",{className:"wb-loop__panel-body"},a.surfaced))),React.createElement("p",{className:"wb-loop__tag"},a.tag),React.createElement("p",{className:"wb-measure__boundary"},ee),React.createElement("p",{className:"wb-demo__smallprint"},"[A canned demonstration on a public example. Not your run, not an Imbas case \u2014 nothing here was recorded.]")),React.createElement("div",{className:"wb-demo__cta-row"},React.createElement(k,{kind:"primary",small:!0,onClick:e},"Now try your own \u2192"),React.createElement("button",{type:"button",className:"wb-demo__close",onClick:t},"Hide example")))}function bo(){let[e,t]=d("own"),[a,n]=d(je[0]),[r,s]=d(""),[o,c]=d(""),[i,u]=d(""),[_,p]=d(""),[m,h]=d(!1),[l,f]=d(null),[v,y]=d({}),[N,E]=d(!1),[I]=d(()=>Ss()),[g,O]=d(!1),G=$(!1),[H,x]=d(()=>Nt(window.location).lane),[P,j]=d(()=>Nt(window.location).lane===he),[ae,se]=d(!1),[T,ne]=d(!1),X=$(null),R=$(null),w=$(!1),Y=$(Ka()),be=$(null),we=$(null),le=$(Ha),oe=$([]),Ke=$(1),Ne=$(null),pt=$(null),Re=$(null),St=$(!1),xe=$(null),Ee=!!(e==="guided"?a.openPrompt:r).trim(),Je=!!o.trim(),Xe=Ee&&Je,Ie=e==="own"&&Je&&!Ee,mt=m?"inspecting":l?"result":Xe?"ready":Ie?"needQuestion":"idle",S=Qt({lane:H,busy:m,hasResult:!!l,hasAct2:!!(l&&l.act2),followUpOpen:ae,hasDelta:T}),U=Kt(S),ie=U.answerEntry==="compose-answer",Z=()=>{le.current=zt};B(()=>{let b=we.current,z=le.current;le.current=Yt,we.current=S,Va(b,S)&&(Ke.current+=1,oe.current=[]);let ce=Wa(S,{from:b,cause:z,seen:oe.current});ce.emit&&(oe.current=oe.current.concat(S),D(C.STAGE_ENTERED,{stage:ce.stage,prior_stage:ce.prior_stage,cause:ce.cause,occurrence:Ke.current,mode:e}))},[S]),B(()=>{let{stage:b}=Nt(window.location);za(b,{lane:H,busy:!1,hasResult:!1}).rewrite&&window.history.replaceState(null,"",window.location.pathname+window.location.search)},[]),B(()=>{if(!St.current){St.current=!0;return}let b=ja(S);window.location.hash!==b&&window.history.replaceState(null,"",window.location.pathname+window.location.search+b)},[S]),B(()=>{l||(se(!1),ne(!1))},[l]);let _e={"compose-answer":Ne,"paired-answer":pt};B(()=>{let b=xe.current;if(xe.current=S,b===null||b===S)return;let z=(_e[U.focus]||Re).current;z&&typeof z.focus=="function"&&z.focus({preventScroll:!0})},[S]),B(()=>{let b=()=>{window.location.hash==="#wb-reader-console"&&t("own")};return b(),window.addEventListener("hashchange",b),()=>window.removeEventListener("hashchange",b)},[]),B(()=>{if(!w.current){w.current=!0,ut();return}if(e!=="guided")return;let b=window.requestAnimationFrame(()=>Ce(X.current));return()=>window.cancelAnimationFrame(b)},[a.id,e]),B(()=>{let{state:b,scroll:z}=Ja(Y.current,!!l);if(Y.current=b,z&&R.current){let ce=window.requestAnimationFrame(()=>Ce(R.current));return()=>window.cancelAnimationFrame(ce)}},[l]),B(()=>{if(!l){be.current=null;return}let b=aa(l)||(l.source?`src:${l.source}`:"result");be.current!==b&&(be.current=b,D(C.RESULT_VIEWED,{run:aa(l),source:l.source||"agent"}))},[l]),B(()=>{let b=!1;try{b=sessionStorage.getItem("imbas_reader_session")==="1"}catch(Oe){}let z=_a();if(z.length===0)return;if(!b){D(C.RETURN_VISIT);try{sessionStorage.setItem("imbas_reader_session","1")}catch(Oe){}}let ce=Jt(z),kt=ce.counts.target_question_copied||0,Q=ce.counts.loop_completed||0;kt>Q&&(D(C.RESTORED_SESSION,{}),E(!0))},[]);let W=b=>{b!==e&&(t(b),y({}),f(null),h(!1),x(rt),b==="own"&&c(""))},V=()=>{H!==he&&(Z(),j(!0),x(he))},Se=()=>x(rt),At=()=>{ae||(Z(),se(!0))},Bn=b=>{b!==T&&(b&&Z(),ne(b))},Hn=()=>{f(null),y({}),X.current&&window.requestAnimationFrame(()=>Ce(X.current))},Gn=()=>{O(!0),G.current||(G.current=!0,D(C.RUN_STARTED,{mode:"demo",source:"demo"}))},Wn=()=>{O(!1),e!=="own"&&W("own"),X.current&&window.requestAnimationFrame(()=>Ce(X.current))},Vn=b=>{!b.ready||b.id===a.id||(n(b),c(""),f(null),y({}),h(!1))},zn=b=>{f(null),y({}),h(!1),c(""),e==="guided"&&b&&n(b),X.current&&window.requestAnimationFrame(()=>Ce(X.current))},wa=b=>{c(b),y(z=>({...z,answer:""})),l&&f(null)},jn=b=>{s(b),y(z=>({...z,question:""})),l&&f(null)},ga=async()=>{if(m)return;let b={},z=e==="guided"?a.openPrompt:r,ce=o;if(e==="own"&&!(z||"").trim()&&(b.question="Add the question you asked."),(ce||"").trim()||(b.answer="Paste an answer to run The Reader."),Object.keys(b).length){y(b);return}y({}),Z(),h(!0),f(null),D(C.RUN_STARTED,{mode:e});let kt=Cs({mode:e,sel:a,question:r,answer:ce,topic:i,model:_});try{let Q=await Rs(kt);le.current=Q.source==="fallback"?vt:jt,f(Q);let Oe=aa(Q);if(D(C.RUN_COMPLETED,{run:Oe,mode:e,source:Q.source||"agent",eligible:!!(Q.act2&&Q.act2.eligible)}),Q.source==="fallback"){let Tt=Dn(Q).toLowerCase();Lt(Tt)&&D(C.CAPACITY_DEGRADATION,{run:Oe,mode:e,reason:Tt}),Tt==="timeout"&&D(C.TIMEOUT,{run:Oe,mode:e,reason:"timeout"})}Q.capture_uncertain&&D(C.CAPTURE_UNCERTAIN,{run:Oe,mode:e})}catch(Q){Q&&Q.message==="too_long"?y({answer:"Answer is over 1200 words. Trim it and re-run."}):(le.current=vt,f({source:"fallback",completeness:"thin",the_read:ua(),what_was_left_out:[],how_it_was_shaped:"",reason:String(Q.message||"network")}),D(C.RUN_COMPLETED,{mode:e,source:"fallback",eligible:!1}),Q&&Q.message==="read_429"&&D(C.CAPACITY_DEGRADATION,{mode:e,reason:"capacity"}))}finally{h(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},N&&!l?React.createElement(po,{onDismiss:()=>E(!1)}):null,U.pasteBox?React.createElement("div",{ref:X,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>W("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>W("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with a measured case."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},je.map(b=>React.createElement("button",{key:b.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${b.id===a.id?" is-active":""}${b.ready?"":" is-disabled"}`,onClick:()=>Vn(b),disabled:!b.ready,title:b.title},b.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},ss(b)):React.createElement(ve,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},b.cardShort||b.title)))),React.createElement(lo,{sel:a})):React.createElement("div",{className:"wb-reader-v2__own-header"},React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste an AI answer below. The Reader inspects what it might be missing.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(ve,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(me,{label:"Which AI did you ask? (optional)"},React.createElement(sa,{value:_,onChange:p}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Ye,{label:"AI answer received",value:o,onChange:wa,error:v.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1,readOnly:!ie,inputRef:Ne}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Ye,{label:"AI answer received",value:o,onChange:wa,error:v.answer,placeholder:"Paste an AI answer. Anything from ChatGPT, Gemini, Claude\u2026",minAckLength:1,readOnly:!ie,inputRef:Ne})),Je||Ee?React.createElement("div",{className:"wb-reader-v2__reveal"},React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(me,{label:"Question asked"},React.createElement("textarea",{className:fe,value:r,onChange:b=>jn(b.target.value),placeholder:"What did you ask the model?",rows:3,style:Qe,"aria-invalid":!!v.question,readOnly:!ie||void 0,"aria-readonly":!ie||void 0})),v.question?React.createElement("div",{className:"wb-field-error",role:"alert"},v.question):null,Ie&&!v.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(me,{label:"Optional topic / context"},React.createElement("input",{className:fe,value:i,onChange:b=>u(b.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:Qe}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(me,{label:"Which AI did you ask? (optional)"},React.createElement(sa,{value:_,onChange:p})))):null)),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":m},React.createElement(qs,{state:mt}),React.createElement("details",{className:"wb-reader-v2__privacy"},React.createElement("summary",{className:"wb-reader-v2__privacy-line"},"Inspections aren't published to our reviewed archive. Don't paste anything sensitive."),React.createElement("p",{className:"wb-reader-v2__privacy-full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See ",React.createElement("a",{href:"/retention.html"},"what deletion means")," and the ",React.createElement("a",{href:"/privacy.html"},"privacy policy"),".")),l?null:React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(k,{kind:"primary",disabled:m||!Xe,onClick:ga,className:`wb-reader-cta${Xe&&!m?" is-armed":""}${m?" is-inspecting":""}`},m?"Inspecting\u2026":"See what might be missing")))))):null,U.pasteBox?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-demo-trigger-row"},React.createElement("button",{type:"button",className:"wb-demo-trigger",onClick:g?()=>O(!1):Gn,"aria-expanded":g},g?"Hide example":"New here? Watch a 20-second example \u2192")),g?React.createElement(fo,{onTryOwn:Wn,onClose:()=>O(!1)}):null,React.createElement("details",{className:"wb-clarity"},React.createElement("summary",{className:"wb-clarity__summary"},"How it works"),React.createElement("ol",{className:"wb-clarity__steps"},mo.map((b,z)=>React.createElement("li",{key:z,className:"wb-clarity__step"},React.createElement("span",{className:"wb-clarity__num","aria-hidden":"true"},z+1),React.createElement("span",{className:"wb-clarity__text"},b)))))):null,l?React.createElement("div",{ref:b=>{R.current=b,Re.current=b},tabIndex:-1,className:"wb-reader-v2__result wb-scroll-anchor"},React.createElement("div",{className:"wb-reader-v2__result-nav"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:Hn},"\u2190 Edit the answer")),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--hero"},React.createElement(Js,{result:l})):null,React.createElement("div",{className:"wb-reader-v2__follow"},React.createElement(zs,{result:l,context:{mode:e,sel:a,question:r,answer:o,model:_,topic:i},onRunAgain:ga})),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--measure"},React.createElement(Xs,{result:l,context:{mode:e,sel:a,question:r,answer:o,model:_,topic:i}})):null,l.checks&&Array.isArray(l.checks.cards)&&l.checks.cards.length?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--checks"},React.createElement(so,{result:l})):null,l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--meaning"},React.createElement(Mn,{pairRuns:[],findings:Ot(l.result,"recorded_findings")})):null,l.measurement&&l.receipt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--perception"},React.createElement(Fn,{mode:"single",receipt:l.receipt})):null,l.act2?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--act2"},React.createElement(oo,{result:l,open:ae,onOpen:At,onPairedChange:Bn,pairedInputRef:pt})):null,U.loop?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--loop"},React.createElement(uo,{mode:e,sel:a,onAnother:zn})):null,React.createElement("p",{className:"wb-reader-v2__post-privacy"},"This inspection wasn't published to our reviewed archive. See ",React.createElement("a",{href:"/retention.html"},"what deletion means"),".")):null,U.chipDoor?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--chip-door"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-chip-door",onClick:H===he?Se:V,"aria-expanded":H===he,"aria-controls":"wb-chip-lane"},H===he?"Hide follow-up checks":"Show follow-up checks")):null,P?React.createElement("div",{id:"wb-chip-lane",className:"wb-reader-v2__follow wb-reader-v2__follow--chips",hidden:!U.chipLane},React.createElement(co,null)):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(Pn,{variant:"reader-secondary"})),I?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--funnel"},React.createElement(_o,null)):null))}function wo(){let e=$(null),[t]=d(()=>Es());return B(()=>{ut();let a=()=>ut();return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),React.createElement("div",{className:`wb-shell${t?" wb-shell--reader-v2":""}`,style:{color:L.text,minHeight:"100vh",fontFamily:K}},React.createElement("style",null,Yr),React.createElement("style",null,Qr,Kr,Jr,Xr,Zr),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:ye,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:J,fontSize:11,letterSpacing:"0.18em",color:L.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:L.line,marginBottom:22}}),t?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"Check your AI answer."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped."),React.createElement(bo,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.")),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:ye,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:K,fontSize:16.5,lineHeight:1.6,color:L.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Us,null)),t?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:L.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:J,fontSize:11,color:L.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var go=ReactDOM.createRoot(document.getElementById("workbench-root"));go.render(React.createElement(wo,null));})();
