/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var Sa="reader-receipt-1.1";var Xn="sha256",re="Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";function Zn(e){return`Candidate gap estimate: ${e} of 3 (unvalidated)`}function er(e){return Number.isFinite(e)}function tr(e){return`Machine gap estimate: ${e} of 3 (unvalidated)`}function ar(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function xt(e){if(typeof e=="string")return ar(e);if(Array.isArray(e))return e.map(xt);if(e&&typeof e=="object"){let t={};for(let a of Object.keys(e).sort())t[a]=xt(e[a]);return t}return e}function Aa(e){let t=xt(e);return t&&typeof t=="object"&&t.integrity&&typeof t.integrity=="object"&&(t.integrity.content_hash=null),JSON.stringify(t)}var nr="cfp.1";var rr={full:"FULL",partial:"PARTIAL",thin:"THIN"};function Ta(e){let t=e||{},a=t.inspection||{},n=t.measurement,r=t.provenance||{},s=[];s.push("\u2014\u2014 THE ANSWER INSPECTED \u2014\u2014"),s.push(`Question: ${(t.question||"").trim()}`),(t.topic||"").trim()&&s.push(`Topic / context: ${t.topic.trim()}`),(t.declared_model||"").trim()&&s.push(`AI used: ${t.declared_model.trim()}`),s.push(""),s.push("Answer:"),s.push((t.answer||"").trim()),s.push(""),s.push("\u2014\u2014 THE READ \u2014\u2014"),s.push(`Completeness: ${rr[a.completeness]||(a.completeness||"").toUpperCase()}`),s.push((a.the_read||"").trim()),s.push(""),s.push("What was left out:");let o=Array.isArray(a.what_was_left_out)?a.what_was_left_out.filter(Boolean):[];if(o.length)for(let i of o)s.push(`- ${i}`);else s.push("- (none identified)");if(s.push(""),s.push(`How it was shaped: ${(a.how_it_was_shaped||"").trim()||"(none detected)"}`),(a.inspection_note||"").trim()&&s.push(`Inspection note: ${a.inspection_note.trim()}`),s.push(""),s.push("\u2014\u2014 MEASUREMENT (candidate observations, unvalidated) \u2014\u2014"),n){er(n.gap_estimate)&&s.push(Zn(n.gap_estimate)),(n.estimate_rationale||"").trim()&&s.push(`Rationale: ${n.estimate_rationale.trim()}`);let i=n.finding_counts||{};s.push(`Findings by type: candidate missing item: ${i["candidate missing item"]||0} \xB7 candidate framing issue: ${i["candidate framing issue"]||0} \xB7 candidate deflection: ${i["candidate deflection"]||0}`);let c=Array.isArray(n.findings)?n.findings:[];c.length&&(s.push(""),c.forEach((p,m)=>{s.push(`${m+1}. [${p.type}] ${(p.materiality||"").trim()}`),(p.anchor||"").trim()&&s.push(`   anchor: "${p.anchor.trim()}"`)})),s.push(""),s.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.")}else s.push("No measurement layer was produced for this run.");return s.push(""),s.push("\u2014\u2014 PROVENANCE \u2014\u2014"),s.push(`Reader model: ${r.reader_model_version||""}`),s.push(`Inspector prompt version: ${r.inspector_prompt_version||""}`),r.inspector_run_conditions&&s.push(`Inspector run conditions: ${JSON.stringify(r.inspector_run_conditions)}`),r.condition_fingerprint&&s.push(`Condition fingerprint (${r.fingerprint_version||nr}): ${r.condition_fingerprint}`),s.push(`Source content hash: ${r.source_content_hash||""}`),s.push(`Reader output hash: ${r.reader_output_hash||""}`),s.push(`Run timestamp: ${r.run_timestamp||""}`),r.request_id&&s.push(`Request ID: ${r.request_id}`),s}function It(e){let t=e||{};return["\u2014\u2014 INTEGRITY \u2014\u2014",`Algorithm: ${t.algorithm||Xn}`,`Canonicalization version: ${t.canonicalization_version||"1.0"}`,`Content hash: ${t.content_hash||""}`]}function ka(e){let t=e||{},a=t.open_run||{},n=[];n.push("IMBAS READER \u2014 INSPECTION RECEIPT"),n.push(`Generated: ${t.generated_at||""}`),n.push(`Schema: ${t.schema_version||""}`),n.push(""),n.push(re),n.push("");for(let r of Ta(a))n.push(r);n.push("");for(let r of It(t.integrity))n.push(r);return n.push(""),n.push(re),n.join(`
`)}function Ca(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 PAIRED INSPECTION RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(re),r.push(""),r.push("\u2014\u2014 THE FIRST (OPEN) ANSWER \u2014\u2014"),r.push("");for(let o of Ta(a))r.push(o);r.push(""),r.push("\u2014\u2014 THE TWO-QUESTION TEST (paired, machine estimate) \u2014\u2014"),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(tr(n.gap_estimate)),(n.estimate_rationale||"").trim()&&r.push(`Rationale: ${n.estimate_rationale.trim()}`),r.push(""),r.push("Targeted prompt (deterministic, from the open answer's candidate gaps):"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("Delta \u2014 what the second answer surfaced that the first did not:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((o,i)=>{let c=(o.signal_pattern||"").trim();r.push(`${i+1}. ${c?`[${c}] `:""}${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (no delta \u2014 the second answer added nothing material over the first)"),r.push(""),r.push("These are machine estimates over a single answer pair, not validated classifications or evidence."),r.push("");for(let o of It(t.integrity))r.push(o);return r.push(""),r.push(re),r.join(`
`)}function Ra(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 USER-DIRECTED FOLLOW-UP RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(re),r.push(""),r.push("\u2014\u2014 THE FIRST ANSWER \u2014\u2014"),r.push(""),(a.question||"").trim()&&(r.push(`Question: ${a.question.trim()}`),r.push("")),r.push((a.answer||"").trim()),r.push(""),r.push("\u2014\u2014 THE FOLLOW-UP YOU CHOSE \u2014\u2014"),(n.chip_label||"").trim()&&r.push(n.chip_label.trim()),r.push(""),n.chip_id&&r.push(`Chip ID: ${n.chip_id}`),n.instruction_version&&r.push(`Instruction version: ${n.instruction_version}`),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(""),r.push("Instruction you sent:"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("What changed in the second answer:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((o,i)=>{r.push(`${i+1}. ${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (nothing visibly changed under this instruction)"),r.push(""),r.push("This is a user-directed follow-up, not an Imbas inspection finding. It shows what changed under the conditions you recorded; it does not establish that the second answer is correct, complete, or better supported."),r.push("");for(let o of It(t.integrity))r.push(o);return r.push(""),r.push(re),r.join(`
`)}var de={register_heading:"Questions worth asking",register_note:"Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers, not verdicts \u2014 copy a question and check it against a source.",top_label:"Worth asking first",expand_label:"Show the full register",collapse_label:"Show fewer",labels:{trigger:"Trigger",proposition:"Rests on",dependent:"Which carries",dependency:"How they connect",evidence:"Quoted from the answer",verification:"Worth asking",resolver:"Where to check",status:"Status"},provisional_label:"Provisional \u2014 a pointer, not a verdict",copy_affordance:"Copy the question",copied_affordance:"Copied",finding_labels:{omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"},resolver_labels:{authority:"Check against an authority",document:"Check against the document",calculation:"Re-run the calculation",direct_question:"Ask the question directly"},status_labels:{open:"Open",resolved:"Resolved",dismissed:"Set aside"}};var sr="reader-result:";function Q(e){throw new RangeError(`${sr} ${e}`)}function F(e){if(e&&typeof e=="object"&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))F(e[t])}return e}function Le(e){return typeof e=="string"?e:""}var ft=F({omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"}),Po=F({"candidate missing item":"omission","candidate framing issue":"framing_drift","candidate deflection":"deflection",Omission:"omission","Framing Drift":"framing_drift",Deflection:"deflection",omission:"omission",framing_drift:"framing_drift",deflection:"deflection"});var fe="original_answer",ke="targeted_answer",Ot=F([fe,ke]),or=F({UNLOCATABLE_SNIPPET:"UNLOCATABLE_SNIPPET",AMBIGUOUS_SNIPPET:"AMBIGUOUS_SNIPPET"}),Do=new Set(Object.values(or));var bt=F({QUOTED:"QUOTED",UNRESOLVED:"UNRESOLVED",ABSENT:"ABSENT"}),ir=F({SOURCE_SUPPLIED_NO_QUOTATION:"SOURCE_SUPPLIED_NO_QUOTATION",ARTIFACT_NOT_AVAILABLE_TO_SURFACE:"ARTIFACT_NOT_AVAILABLE_TO_SURFACE"}),Lo=new Set(Object.values(ir)),he=F({REQUIRED:"REQUIRED",ABSENT_ALLOWED:"ABSENT_ALLOWED",FORBIDDEN:"FORBIDDEN"});var xa=F({PROBE_ONLY:"PROBE_ONLY",OPEN_ONLY:"OPEN_ONLY",BOTH_DIFFERENT:"BOTH_DIFFERENT"}),$o=new Set(Object.values(xa)),Uo=F({MATCHED_CONDITIONS:"MATCHED_CONDITIONS",OBSERVED_DIFFERENCE:"OBSERVED_DIFFERENCE"}),qo=F({AUTHORIZED_MATCHED_BASIS:"AUTHORIZED_MATCHED_BASIS",REPORTED_CLIENT_DECLARATION:"REPORTED_CLIENT_DECLARATION",NO_AUTHORIZED_BASIS:"NO_AUTHORIZED_BASIS",UNRECOGNIZED_BASIS:"UNRECOGNIZED_BASIS"}),cr=F({MATCHED:"MATCHED",UNMATCHED:"UNMATCHED",UNVERIFIED:"UNVERIFIED",UNAVAILABLE:"UNAVAILABLE"}),Fo=new Set(Object.values(cr)),lr=F(["server_observed_pair_conditions"]),dr=F(["pair_capture_client_declaration"]),Mo=new Set(lr),Bo=new Set(dr);var ur=F({OBSERVED:"OBSERVED",CANDIDATE:"CANDIDATE"}),pr=F({UNREVIEWED:"UNREVIEWED",VERIFIED:"VERIFIED",REJECTED:"REJECTED",UNRESOLVED:"UNRESOLVED"}),Ho=new Set(Object.values(ur)),Go=new Set(Object.values(pr)),Wo=F({LIVE_READER:"live_reader",ARCHIVE:"archive"}),ue=F({ELIGIBLE:"ELIGIBLE",EMITTED:"EMITTED",SUPPRESSED:"SUPPRESSED",NOT_APPLICABLE:"NOT_APPLICABLE"}),wt=F({PROBE_SIDE_ANCHOR_UNSUPPORTED:"PROBE_SIDE_ANCHOR_UNSUPPORTED",OPEN_SIDE_ANCHOR_ABSENT:"OPEN_SIDE_ANCHOR_ABSENT",ANCHOR_NOT_VERBATIM:"ANCHOR_NOT_VERBATIM",NO_CHECK_BLOCK:"NO_CHECK_BLOCK",SHAPE_NOT_REGISTER_ELIGIBLE:"SHAPE_NOT_REGISTER_ELIGIBLE",REGISTER_NOT_BUILT_FOR_SURFACE:"REGISTER_NOT_BUILT_FOR_SURFACE",REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE:"REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE"}),mr=new Set(Object.values(wt));function _r({status:e,card_id:t=null,suppression_reasons:a=[]}){Object.prototype.hasOwnProperty.call(ue,e)||Q(`register status not enumerated: ${e}`);let n=Array.isArray(a)?a.slice():[];for(let s of n)mr.has(s)||Q(`suppression reason not enumerated: ${s}`);return!(e===ue.SUPPRESSED||e===ue.NOT_APPLICABLE)&&n.length>0&&Q(`${e} cannot carry suppression reasons`),e===ue.SUPPRESSED&&n.length===0&&Q("SUPPRESSED requires at least one enumerated suppression reason"),e===ue.EMITTED&&!Le(t).trim()&&Q("EMITTED requires a card_id"),e!==ue.EMITTED&&t!=null&&Q(`${e} cannot carry a card_id`),F({status:e,card_id:t==null?null:Le(t),suppression_reasons:n})}var Dt=new Map;function Lt(e){let t=Le(e&&e.id).trim();t||Q("a finding shape requires an id"),Dt.has(t)&&Q(`finding shape already registered: ${t}`);let a=Le(e.surface).trim();a!=="single"&&a!=="paired"&&Q(`shape surface must be single or paired: ${t}`);let n={};for(let i of Ot){let c=(e.anchors||{})[i]||he.FORBIDDEN;Object.prototype.hasOwnProperty.call(he,c)||Q(`anchor requirement not enumerated for ${t}.${i}: ${c}`),n[i]=c}let r=Array.isArray(e.quoted_to_surface)?e.quoted_to_surface.slice():[];r.length||Q(`a finding shape must name at least one role that must be quoted to surface: ${t}`);for(let i of r)Ot.includes(i)||Q(`quoted_to_surface names an unenumerated role for ${t}: ${i}`),n[i]===he.FORBIDDEN&&Q(`quoted_to_surface names a forbidden role for ${t}: ${i}`);for(let i of Ot)n[i]===he.REQUIRED&&!r.includes(i)&&Q(`a REQUIRED anchor must also be required to surface for ${t}: ${i}`);let s=_r(e.register_default||{status:ue.NOT_APPLICABLE,suppression_reasons:[wt.SHAPE_NOT_REGISTER_ELIGIBLE]}),o=F({id:t,surface:a,anchors:n,quoted_to_surface:r,directional:!!e.directional,register_default:s,label:Le(e.label)||t});return Dt.set(t,o),o}function Ia(e){return Dt.get(Le(e))||null}var hr="single_candidate_item",fr="paired_observed_difference",br="paired_comparative_contrast";Lt({id:hr,surface:"single",label:"Candidate item in one answer",anchors:{[fe]:he.ABSENT_ALLOWED},quoted_to_surface:[fe],directional:!1,register_default:{status:ue.ELIGIBLE}});Lt({id:fr,surface:"paired",label:"Difference observed under the probe",anchors:{[ke]:he.ABSENT_ALLOWED,[fe]:he.ABSENT_ALLOWED},quoted_to_surface:[ke],directional:!0,register_default:{status:ue.SUPPRESSED,suppression_reasons:[wt.PROBE_SIDE_ANCHOR_UNSUPPORTED]}});Lt({id:br,surface:"paired",label:"Contrast quotable on both sides",anchors:{[ke]:he.REQUIRED,[fe]:he.REQUIRED},quoted_to_surface:[ke,fe],directional:!0,register_default:{status:ue.SUPPRESSED,suppression_reasons:[wt.PROBE_SIDE_ANCHOR_UNSUPPORTED]}});function $t(e){let t=Ia(e&&e.shape);return t||Q(`cannot describe an unregistered shape: ${e&&e.shape}`),F({id:e.id,shape:t.id,shape_label:t.label,surface:t.surface,class_id:e.class_label,class_display:ft[e.class_label],statement:e.statement,materiality:e.materiality,anchors:e.anchors.map(a=>({role:a.role,status:a.status,quote:a.quote,absent_reason:a.absent_reason})),directional:t.directional,comparison_direction:e.comparison_direction,claim_register:e.claim_register,claim_basis:e.claim_basis,conditions_status:e.conditions_status,reader_state:e.reader_state,disposition:e.disposition})}var Oa=F({surfaced_findings:{id:"surfaced_findings",unit_one:"finding",unit_many:"findings",predicate_id:"satisfies_registered_anchor_contract",predicate_note:"Findings whose shape's quoted_to_surface roles all resolve verbatim against their artifact. An unresolved required anchor is excluded."},surfaced_candidate_items:{id:"surfaced_candidate_items",unit_one:"candidate item",unit_many:"candidate items",predicate_id:"single_surface_satisfying_anchor_contract",predicate_note:"surfaced_findings restricted to the single-answer surface. Same membership rule, stated in the unit a single-answer result reports."},probe_surfaced_differences:{id:"probe_surfaced_differences",unit_one:"difference",unit_many:"differences",predicate_id:"paired_probe_only_satisfying_anchor_contract",predicate_note:"surfaced_findings restricted to paired findings whose comparison_direction is PROBE_ONLY. The probe-side quotation is what every paired shape requires to surface."},recorded_findings:{id:"recorded_findings",unit_one:"finding",unit_many:"findings",predicate_id:"every_canonical_finding",predicate_note:"The whole canonical collection, including findings the Check Register suppressed and findings whose supplied quotation did not resolve. This is what the durable record carries. It is not displayed."}});function Pt(e){let t=Ia(e&&e.shape);return t?t.quoted_to_surface.every(a=>{let n=e.anchors.find(r=>r.role===a);return!!n&&n.status===bt.QUOTED}):!1}var wr={satisfies_registered_anchor_contract:e=>Pt(e),single_surface_satisfying_anchor_contract:e=>e.surface==="single"&&Pt(e),paired_probe_only_satisfying_anchor_contract:e=>e.surface==="paired"&&e.comparison_direction===xa.PROBE_ONLY&&Pt(e),every_canonical_finding:()=>!0};function et(e,t){let a=Oa[t];a||Q(`count not defined: ${t}`);let n=wr[a.predicate_id];return(e&&e.findings||[]).filter(n)}function Ut(e,t){return et(e,t).length}function gt(e,t){let a={};for(let n of Object.keys(ft))a[n]=0;for(let n of et(e,t))a[n.class_label]++;return a}function Pa(e,t){let a=Oa[t];a||Q(`count not defined: ${t}`);let n=Ut(e,t);return`${n} ${n===1?a.unit_one:a.unit_many}`}var Da="Want to test it? Here's a direct question that gives nothing away.",qt="The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets.",gr=["ceiling","timeout","network","api_error","capacity","429"];function Ft(e){return gr.includes(String(e==null?"":e).toLowerCase())}function yr(e){return String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`)}var tt="Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";var $e="gap_revealed",at="still_missing",Ue="not_clear_yet",Mt=[$e,at,Ue];function La({gap_estimate:e,signal_counts:t}={}){let a=Number(e);if(!Number.isFinite(a)||a<=0)return at;let n=t||{},r=(Number(n.Omission)||0)+(Number(n.Deflection)||0);return(Number(n["Framing Drift"])||0)>r?Ue:$e}var yt="What it told you",vt="What it told you when you asked",nt="Didn't come up.",$a="Your session, your conditions \u2014 not the lab's.",qe={[$e]:{headline:"It answers when asked. It just didn't volunteer.",tag:"That's the Volunteer Gap \u2014 you just watched it happen in your own chat.",chip:"It didn't volunteer"},[at]:{headline:"You asked directly. It still didn't surface.",cta:"Push harder \u2192",chip:"Still didn't surface"},[Ue]:{headline:"The second answer changed. The gap isn't clean.",cta:"Try the cleaner check \u2192",swapPanels:!0,chip:"Not clear yet"}},vr="The targeted answer included information the open answer did not.",Nr=[$e,Ue];function Ua(e,t){let a=qe[e]||{};if(!t)return a;let n={...a};return delete n.tag,Nr.includes(e)&&(n.headline=vr),n}var Fe="quick",Me="cleaner",qa="Same chat is faster. A fresh chat gives you a cleaner comparison.",Bt={label:"Quick check",hint:"Same chat. Paste the question, ask again."},Ht={label:"Cleaner check",hint:"Fresh chat. Copy the setup, then ask."};function Fa({question:e}={}){let t=typeof e=="string"?e.trim():"",a=[];return t&&(a.push(t),a.push("")),a.push(tt),yr(a.join(`
`)).trim()}var se={YES:"yes",NO:"no",NOT_SURE:"not_sure"},pe={NONE:"none",EDITED:"edited"},Er="unverified",Sr=80;function Ar({same_model:e,edits:t}={}){return t===pe.EDITED||e===se.NO?!1:e===se.YES&&t===pe.NONE?!0:Er}function Gt({same_model:e,model_version:t,edits:a}={}){let n={same_model_claimed:e===se.YES,user_edits_disclosed:a===pe.EDITED,conditions_matched:Ar({same_model:e,edits:a})},r=typeof t=="string"?t.trim():"";return r&&(n.model_version_user_reported=r.slice(0,Sr)),n}function rt(e){return!e||e.conditions_matched!==!0}var ve={INSPECTION_FOLLOWUP:"inspection_followup",USER_CHIP:"user_chip",LEGACY_UNKNOWN:"legacy_unknown"};function Tr(e){return e===ve.INSPECTION_FOLLOWUP||e===ve.USER_CHIP?e:ve.LEGACY_UNKNOWN}function Ma({targeted_prompt:e,original_artifact_id:t,targeted_artifact_id:a,capture:n,initiator:r,targeted_prompt_hash:s,chip_id:o,instruction_version:i}={}){let c={targeted_prompt:typeof e=="string"?e:"",original_artifact_id:typeof t=="string"?t:"",targeted_artifact_id:typeof a=="string"?a:"",capture:n&&typeof n=="object"?n:{},initiator:Tr(r),targeted_prompt_hash:typeof s=="string"?s:""};return c.initiator===ve.USER_CHIP&&(c.chip_id=typeof o=="string"?o:"",c.instruction_version=typeof i=="string"?i:""),c}var U={heading:"One quick thing before the side-by-side",intro:"This just marks how you ran the two answers. It never changes what they say.",same_model:{question:"Did both answers come from the same AI \u2014 same provider, same model?",options:{[se.YES]:"Yes, the same one",[se.NO]:"No, a different one",[se.NOT_SURE]:"Not sure"}},model_version:{question:"Which model did you use? Optional.",hint:"The name or version, as you remember it.",placeholder:"e.g. the model or version you ran"},edits:{question:"Did you edit either answer before pasting?",options:{[pe.NONE]:"No, neither was edited",[pe.EDITED]:"Yes, I edited one or both"}},disclosure:"This marks how clean the capture was. It doesn't decide whether the conditions lined up.",unmatched_warning:"The conditions behind these two answers aren't confirmed as matched \u2014 a different model, an edit, or a setup you weren't sure about. Read the side-by-side as a looser comparison, not a like-for-like.",unmatched_badge:"Unmatched conditions"};var Wt="chip_change_visible",Vt="chip_change_not_visible",jt="chip_change_unclear",Ba=[Wt,Vt,jt];function Ha({delta_count:e,conditions_matched:t}={}){let a=Number(e);return!Number.isFinite(a)||a<=0?Vt:t===!0?Wt:jt}var zt={[Wt]:{headline:"The change you asked for shows up in the second answer.",note:"That's under the conditions you recorded. It doesn't mean the second answer is correct or complete.",chip:"The change shows up"},[Vt]:{headline:"The second answer doesn't show the change you asked for.",note:"No visible difference isn't an all-clear. The change could be there in a way this comparison doesn't catch.",chip:"I don't see the change"},[jt]:{headline:"Something changed, but not under matched conditions.",note:"A different model, an edit, or a setup you weren't sure about. Read this as a looser comparison, not like-for-like.",chip:"Hard to tell"}},T={value_statement:{headline:"Tell your AI exactly what to do next.",sub:"Paste the answer or draft. Tap what bothered you. Get the exact instruction to paste back."},row_header:"What would you like the next answer to do differently?",row_support:"These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",card:{framing:"Paste this into the same AI, in the same conversation if possible. If you start a new conversation, include the original answer and any material it relied on. Bring the new answer back."},side_by_side:{reason_prefix:"Follow-up selected by you: ",first_answer_caption:"The answer or draft you started with.",second_answer_caption:"Second answer after your follow-up. Not verified by Imbas."},meaning_panel_line:"This comparison follows a user-selected instruction, not an inspection-generated follow-up. It shows what changed under the recorded conditions; it does not establish that the second answer is correct, complete, or better supported. Absence of a visible difference is not an all-clear.",boundary:"User-directed follow-up. No Imbas inspection finding asserted.",professional_cue:{line:"AI made the draft. Your name still goes on it.",link:"For professional work \u2192"},compose:{first_answer_label:"The answer or draft you started with",first_answer_placeholder:"Paste the answer or draft you want to change\u2026",second_answer_label:"Second answer after your follow-up",second_answer_placeholder:"Paste what your AI came back with\u2026",copy_label:"Copy the instruction",copy_done:"Copied \u2014 now paste it into your AI",edit_first_answer:"Edit the first answer",compare_label:"Compare the two answers",comparing_label:"Comparing\u2026",first_answer_missing:"Paste the answer or draft you started with.",second_answer_missing:"Paste the second answer your AI gave.",chip_missing:"Pick a follow-up above first.",too_long:"Second answer is over 1200 words. Trim it and re-run.",too_short:"That's too short to compare. Paste the full second answer.",not_eligible:"That follow-up isn't available right now. Pick another and try again.",blocked:"This follow-up can't run right now. Check what you pasted and try again.",run_error:"The comparison didn't reach the Reader. Nothing you pasted was changed. Try again shortly."},reveal:{delta_heading:"What changed",empty_delta:"No visible difference under the instruction you chose. That isn't an all-clear: the change could be there in a way this comparison doesn't catch.",first_side_label:"First answer",second_side_label:"Second answer",correct_label:"Read it differently?",reset_label:"Try another follow-up",idempotent_notice:"You already ran this follow-up. This is the comparison from that run.",capture_uncertain_notice:"The comparison is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."}};function Yt(e){if(e&&(typeof e=="object"||typeof e=="function")&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))Yt(e[t])}return e}var kr=Yt({CAPTURE_DERIVED:"capture_derived",DOSSIER_DERIVED:"dossier_derived",PRACTICE_DERIVED:"practice_derived",MIXED:"mixed"}),Be=kr,He="v1",Ge="2026-07-20",We="authored, pending founder review and bounded testing",Qt=Yt([{id:"sq.material",approved_ui_label:"Didn't use the material I provided",instruction_text:`Answer my question again, or revise the draft, using the document, text, or data I gave you as your main source. Build your claims on what that material actually says.

Point to the exact parts you drew on: the section, passage, or figure behind each claim. Keep what comes from my material separate from anything you add from general knowledge.

Where my material already answers the question, don't reach for a generic assumption instead. If you can't open or read part of what I gave you, or it isn't here in this conversation, say so plainly and ask for it rather than filling the gap.`,instruction_version:He,seeding_tag:Be.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 1: the documented 2026-07-20 instrument pass found no captured analogue (0/90 prompt-bearing files; the corpus names anchors but supplies no material). Practice-derived and anchor-free by necessity \u2014 the person can point at 'the document I gave you' without naming what it should have contained. Generalizes the always-true instruction: prefer the supplied material as the primary source, expose which parts were used, and admit when the material is inaccessible. No anchor is lost because none was ever captured for this class.",author:"Imbas",date:Ge,review_status:We,known_misuse_risks:["Used on an answer where the person supplied no document, text, or data \u2014 there is no material to prefer, so the instruction has nothing to bind to.","Read as a demand to treat the supplied material as the only allowable source even where it is silent, pushing the model to over-claim from a thin document."],negative_examples:["A general-knowledge question asked with no attachment or pasted source ('What is the capital of Australia?').","A request for the model's own opinion or a brainstorm, where no external material was offered or intended."],content_hash:"d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a"},{id:"sq.sources",approved_ui_label:"Doesn't show where its claims came from",instruction_text:`As you answer again, or go back through the draft, show me where each important factual claim comes from. Name the source behind it: a citation, a document, a study, or another specific reference someone could look up.

Mark clearly which claims rest on a real source and which are your own inference or estimate.

Don't invent a citation, and don't imply a source backs a claim when you haven't checked that it does. Where you don't have a genuine source for something, say so and label it as your own reasoning rather than dressing it up as sourced.`,instruction_version:He,seeding_tag:Be.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-006","imbas-instrument:registry/cases/case-012"],abstraction_note:"Seeds: case-006 (targeted prompt naming Kennan/Burns/Matlock/Gates; capture og-006-B-claude-targeted.md reproduces each authority with a citation, L5/17/28/37) and case-012 (naming Hviid 2019 and IOM 2011; capture og-012-B-gpt-targeted.md, inline citations L2/5/13/18); structural analogues in cases 002, 010, 013. Those captures name a specific omitted authority. The template generalizes to the anchor-free form: source the model's OWN claims, whatever they are. Lost: the named authority \u2014 the person cannot supply the very source they don't know is missing. Dossier reinforcement only, not a capture: sg-ctr-currency-over-10k.md L58-66 states the mechanism (name the source, add no new triggering fact).",author:"Imbas",date:Ge,review_status:We,known_misuse_risks:["Pushed onto a purely subjective or creative answer (a poem, an opinion) where source attribution does not apply.","Read as requiring a formal citation for every sentence, driving the model to attach nominal references that don't actually support the point."],negative_examples:["A creative-writing or opinion request with no factual claim to source.","A step in a math derivation where each line follows from the previous, not from an external source."],content_hash:"42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81"},{id:"sq.date_version",approved_ui_label:"Doesn't say what date or version applies",instruction_text:`Answer again, or revise the draft, and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to.

Then check whether the version you're using has since been amended, replaced, or updated, and name the one that applies now wherever you can confirm it.

If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is.`,instruction_version:He,seeding_tag:Be.MIXED,seed_case_ids:["imbas-instrument:registry/cases/case-005","imbas-instrument:registry/cases/case-009"],abstraction_note:"Two clauses, two provenances, so the tag is mixed. The date/version clause descends from captures: case-005 (SEC Rule 10b-18, 1982; og-005-B-gpt-targeted.md L3/L26) and case-009 (2023 ODNI declassified summary; og-009-B-claude-targeted.md L14-16/48) \u2014 each anchors a specific dated authority. The supersession clause descends from dossier-only material with no capture: imbas-instrument:data/annex-exemplars/dossiers/tx-ctc-permanence-vol-asym.md L39-42 (Public Law 119-21 permanence; L220 'No capture exists') and the case-bank repeal subset. The template generalizes both to the anchor-free form: date every time-sensitive point in the model's own answer and check it for supersession. Lost: the named rule and the named repeal.",author:"Imbas",date:Ge,review_status:We,known_misuse_risks:["Applied to a timeless fact (a definition, a settled physical constant) where no date or version is meaningful.","Read as a demand to assert the current version even where the model cannot check it, inviting a fabricated 'latest as of' claim."],negative_examples:["A question about a mathematical identity or a fixed historical date, where nothing versions.","An answer that already carries explicit, dated sourcing for every time-sensitive point."],content_hash:"dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8"},{id:"sq.direct_answer",approved_ui_label:"Didn't answer the question I actually asked",instruction_text:`Start by answering the exact question I asked. Restate that question back to me in one line first, so I can see it hasn't been quietly narrowed, widened, or swapped for a nearby one. If you're revising a draft, do the same for the question the draft is meant to answer.

Give the direct answer up front. Add only the background that answer actually needs, and put it after the answer, not before.

If the question can't be answered as I asked it, or something it needs is missing, name the specific thing that's in the way. Don't quietly trade my question for an easier one you can answer instead.`,instruction_version:He,seeding_tag:Be.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 4: no captured analogue by the documented 2026-07-20 search. The instrument's design is between-condition across fresh conversations, not a re-ask; case-003 v2 is a framing test, not a re-ask; the single regex hit was a false positive inside captured answer prose. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: answer the exact question first, restate it so any substitution is visible, and name the obstacle instead of swapping in an easier question. No anchor is lost because none was captured.",author:"Imbas",date:Ge,review_status:We,known_misuse_risks:["Used when the person's question is genuinely ambiguous, where restating one reading as 'the exact question' can lock in the wrong one.","Read as a ban on all context, producing a bare answer that drops caveats the question actually needed."],negative_examples:["An open-ended brainstorming prompt where no single direct answer is expected.","A request that explicitly asks for broad exploration or a set of options rather than one answer."],content_hash:"98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a"},{id:"sq.quantity",approved_ui_label:"Didn't give the number or range I asked for",instruction_text:`Give the number, range, or threshold I asked for. If you're revising a draft, make sure that figure is actually stated in it, not left implied. Where a single figure is fair, give the figure; where it isn't, give a realistic range instead of a single point.

Show your work: the inputs and assumptions behind the figure, and the calculation where there is one. Keep the values you actually know apart from the ones you're estimating.

If the evidence doesn't get you to a solid number or range, say so outright and name what you'd need to get there. Don't invent a precise figure just to look more certain than you are.`,instruction_version:He,seeding_tag:Be.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-004","imbas-instrument:registry/cases/case-010"],abstraction_note:"Seeds: case-004 (NNT literature; og-004-B-claude-targeted.md L14/15/36-39/42, NNT about 9, 20-33, 10-30, Cochrane figures) and case-010 (combined voting power; og-010-B-claude-targeted.md L7/19/39, 20-40% figures); reinforced by og-005 L26 ($942B, 2024) and og-012 L5 (HR 0.93, 95% CI 0.85-1.02). The captured sub-mechanisms diverge \u2014 a single settled figure versus an empirical range \u2014 and the template deliberately covers both: give the figure where one is fair, the realistic range where it isn't, with inputs shown. Anchor-free: the person asks for 'the number I wanted' without knowing it. Lost: the specific quantity and its source literature.",author:"Imbas",date:Ge,review_status:We,known_misuse_risks:["Applied to a question that is not quantitative, manufacturing a number where none belongs.","Read as always requiring a range, so a well-established single figure gets diluted into a vague band."],negative_examples:["A qualitative 'how should I approach this?' question with no quantity at issue.","A definitional or yes/no question where a number is not responsive."],content_hash:"12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e"},{id:"sq.fact_assumption",approved_ui_label:"Mixes facts with assumptions",instruction_text:`Answer again, or go back through the draft, and keep three things apart: what you actually know, what you're assuming, and what you're inferring from those. Say which is which as you go.

For each main conclusion, show what it rests on: the facts and the assumptions it depends on. Where something is still unsettled, name it as an open question instead of smoothing it over.

Don't hand me an assumption, an inference, or an estimate dressed up as an established fact.`,instruction_version:He,seeding_tag:Be.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 6: no captured analogue by the documented 2026-07-20 search (0/90). The instrument constitution's epistemic chain is instrument-internal review discipline, never a model-directed prompt, and is deliberately NOT claimed as an analogue here. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: separate what is known from what is assumed or inferred, tie each conclusion to what it rests on, and never present an assumption as an established fact. No anchor is lost because none was captured.",author:"Imbas",date:Ge,review_status:We,known_misuse_risks:["Forced onto a simple factual answer that has no assumptions to separate, adding empty scaffolding.","Read as a demand to label ordinary settled facts as 'assumptions', overstating how uncertain they are."],negative_examples:["A single verifiable lookup ('What year did X happen?') with no inference chain.","A creative or opinion answer where a fact/assumption split does not apply."],content_hash:"e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309"}]);var ot="inspect",be="chips",Ce="compose",it="inspecting",ct="result",lt="followup",dt="compare",ut="delta",Re="chips",st=[Ce,it,ct,lt,dt,ut],Nt=[...st,Re],Ve="compose-answer",Ga="paired-answer",Cr="chip-answer",Kt="advance",Jt="async",Et="degraded",Va="init",Xt="pop";var Rr="reverse",xr=[Kt,Jt,Et];function Wa(e){return xr.includes(e)}function Zt(e={}){let{lane:t=ot,busy:a=!1,hasResult:n=!1,hasAct2:r=!1,followUpOpen:s=!1,hasDelta:o=!1}=e;return t===be?Re:a?it:n?o?ut:s?dt:r?lt:ct:Ce}function ea(e){switch(e){case Ce:return{answerEntry:Ve,readOnly:[],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!1,focus:"compose-answer",degradedNextAction:"run-reader"};case it:return{answerEntry:null,readOnly:[Ve],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!1,loop:!1,focus:"status",degradedNextAction:"resolves-to-fallback-result"};case ct:return{answerEntry:null,readOnly:[Ve],pasteBox:!0,result:!0,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"result-heading",degradedNextAction:"read-result-or-restart"};case lt:return{answerEntry:null,readOnly:[Ve],pasteBox:!0,result:!0,act2:!0,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"act2-heading",degradedNextAction:"copy-instruction-and-run-externally"};case dt:return{answerEntry:Ga,readOnly:[Ve],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!1,loop:!1,focus:"paired-answer",degradedNextAction:"run-externally-comparison-deferred"};case ut:return{answerEntry:null,readOnly:[Ve,Ga],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!0,loop:!0,focus:"delta-heading",degradedNextAction:"keep-receipt-or-restart"};case Re:return{answerEntry:Cr,readOnly:[],pasteBox:!1,result:!1,act2:!1,pairedInput:!1,chipLane:!0,chipDoor:!0,loop:!1,focus:"chip-answer",degradedNextAction:"copy-instruction-and-run-externally"};default:return ea(Ce)}}function ja(e,t){if(e===t)return!1;if(t===Re)return!0;if(e===Re)return!1;let a=st.indexOf(e),n=st.indexOf(t);return a!==-1&&n!==-1&&n>a}function za(e,{from:t=null,cause:a=Xt,seen:n=[]}={}){let r=!n.includes(e),o=t===null||ja(t,e)||!Wa(a)?a:Rr;return{stage:e,prior_stage:t,cause:o,emit:r,progress:r&&Wa(o),skipped:t!==null&&Ir(t,e)}}function Ya(e,t){return t===Ce&&e!==null&&e!==Ce}function Ir(e,t){let a=st.indexOf(e),n=st.indexOf(t);return a!==-1&&n!==-1&&n-a>1}function St({search:e="",hash:t=""}={}){let r=new URLSearchParams(e.startsWith("?")?e.slice(1):e).get("start")==="chips"?be:ot,s=String(t||"").replace(/^#/,""),o=/(?:^|&)stage=([a-z-]+)/.exec(s),i=o&&Nt.includes(o[1])?o[1]:null;return{lane:r,stage:i}}function Qa(e,t={}){let a=Zt(t);return!e||!Nt.includes(e)?{stage:a,rewrite:!1,reason:"no-stage-hash"}:e===Re?{stage:Re,rewrite:!1,reason:"chip-lane-self-contained"}:ja(a,e)?{stage:a,rewrite:!0,reason:"stale-stage-hash"}:{stage:e,rewrite:!1,reason:"supported"}}function Ka(e){return e===Ce?"":`#stage=${e}`}var C={RUN_STARTED:"run_started",RUN_COMPLETED:"run_completed",RESULT_VIEWED:"result_viewed",TARGET_QUESTION_COPIED:"target_question_copied",LOOP_RETURNED:"loop_returned",LOOP_COMPLETED:"loop_completed",STATE_CORRECTED:"state_corrected",CARD_EXPORTED:"card_exported",CANDIDATE_SUBMITTED:"candidate_submitted",RETURN_VISIT:"return_visit",CHIP_ROW_RENDERED:"chip_row_rendered",CHIP_SELECTED:"chip_selected",CHIP_INSTRUCTION_COPIED:"chip_instruction_copied",CHIP_PAIR_INITIATED:"chip_pair_initiated",CHIP_PAIR_COMPLETED:"chip_pair_completed",STAGE_ENTERED:"stage_entered",FOLLOW_UP_REVEALED:"follow_up_revealed",TIMEOUT:"timeout",CAPACITY_DEGRADATION:"capacity_degradation",CAPTURE_UNCERTAIN:"capture_uncertain",RESTORED_SESSION:"restored_session"},Ja=Object.values(C),Or=new Set(Ja),Pr=["run","state","from_state","to_state","stage","prior_stage","cause","occurrence","check","mode","gap","eligible","source","idempotent","initiator","instruction_version","chip","conditions","ms","reason"],Dr=new Set(Pr),Lr=64;function $r(e={}){let t={};if(!e||typeof e!="object"||Array.isArray(e))return t;for(let a of Dr){let n=e[a];if(n!=null){if(typeof n=="number")Number.isFinite(n)&&(t[a]=n);else if(typeof n=="boolean")t[a]=n;else if(typeof n=="string"){let r=n.trim();r&&(t[a]=r.slice(0,Lr))}}}return t}function Xa(e,t={},a=Date.now()){return Or.has(e)?{name:e,ts:Number.isFinite(a)?Math.round(a):0,...$r(t)}:null}function ta(e){let t=Array.isArray(e)?e.filter(u=>u&&typeof u.name=="string"):[],a=u=>t.reduce((_,h)=>h.name===u?_+1:_,0),n=a(C.TARGET_QUESTION_COPIED),r=a(C.LOOP_COMPLETED),s=a(C.CHIP_INSTRUCTION_COPIED),o=a(C.CHIP_PAIR_COMPLETED),i={},c={};for(let u of t)u.name===C.LOOP_COMPLETED&&u.state&&(i[u.state]=(i[u.state]||0)+1),u.name===C.CHIP_PAIR_COMPLETED&&u.state&&(c[u.state]=(c[u.state]||0)+1);let p={};for(let u of Ja)p[u]=a(u);let m={};for(let u of Nt)m[u]=0;for(let u of t)u.name===C.STAGE_ENTERED&&typeof u.stage=="string"&&(m[u.stage]=(m[u.stage]||0)+1);return{counts:p,stage_entries:m,stage_funnel:{inspection_started:m[it],result_delivered:m[ct]+m[lt],follow_up_opened:m[dt],comparison_completed:m[ut]},completed_by_state:i,chip_completed_by_state:c,loop_completion_rate:n>0?r/n:null,chip_completion_rate:s>0?o/s:null}}function Za(){return{armed:!0}}function en(e,t){let a=e&&typeof e.armed=="boolean"?e.armed:!0;return t?a?{state:{armed:!1},scroll:!0}:{state:{armed:!1},scroll:!1}:{state:{armed:!0},scroll:!1}}var tn=["single_yes","single_no"],an=["paired_small","paired_noticeable","paired_large"],Xo=[...tn,...an];function nn(e){return e==="single"?{mode:"single",prompt:"Did this surface something you hadn't considered?",options:[{id:"yes",label:"Yes",value:"single_yes"},{id:"no",label:"No",value:"single_no"}]}:e==="paired"?{mode:"paired",prompt:"How big did the difference feel?",options:[{id:"small",label:"Small",value:"paired_small"},{id:"noticeable",label:"Noticeable",value:"paired_noticeable"},{id:"large",label:"Large",value:"paired_large"}]}:null}function rn(e,t){return e==="single"?tn.includes(t):e==="paired"?an.includes(t):!1}var Ur="review-graph.v0.3.1",sn="review-record.c14n.v1",qr="review-record.v2",Fr="sha256",Mr=new Set(["open","resolved","dismissed"]);var Br="This is a record of what was examined and what was resolved. It holds provisional discovery outputs: each check is a pointer worth checking against a source, never a verdict on the answer. The integrity block is an unkeyed SHA-256 digest over the record's canonical form \u2014 a fixity check that the listed contents have not shifted since export, not a signature and not proof of who produced it. The record claims nothing beyond what it lists.",pt={action_label:"Download review record",downloaded_label:"Downloaded",action_hint:"A record of what was examined and resolved, as JSON.",download_error:"Could not download the review record"},Hr=new Set(["created_at","supplied_at","inspection_run_at","at"]);function cn(e){if(typeof e!="string"||e==="")return e;let t=e.replace(/(\.\d{3})\d+/,"$1"),a=new Date(t);if(Number.isNaN(a.getTime()))throw new Error(`review-record.c14n.v1: unparseable timestamp ${JSON.stringify(e)}`);return a.toISOString()}function aa(e,t){if(typeof e=="string")return Hr.has(t)?cn(e):e;if(Array.isArray(e))return e.map(a=>aa(a,t));if(e&&typeof e=="object"){let a={};for(let n of Object.keys(e).sort())a[n]=aa(e[n],n);return a}return e}function Gr(e){let t=e&&typeof e=="object"?e:{},a={};for(let n of Object.keys(t))n!=="integrity"&&(a[n]=t[n]);return JSON.stringify(aa(a,null))}async function Wr(e){let t=new TextEncoder().encode(String(e)),a=globalThis.crypto&&globalThis.crypto.subtle;if(!a)throw new Error("review-record.c14n.v1: WebCrypto SHA-256 is unavailable in this environment");let n=await a.digest("SHA-256",t),r=new Uint8Array(n),s="";for(let o=0;o<r.length;o++)s+=r[o].toString(16).padStart(2,"0");return s}async function Vr(e){return Wr(Gr(e))}function q(e){return typeof e=="string"?e:""}function on(e){return Mr.has(e)?e:null}function jr({result:e,checkStates:t={},createdAt:a,pair:n=null}={}){let r=q(a);if(!r)throw new Error("assembleReviewRecord: createdAt (ISO 8601) is required");let o=(e&&e.receipt||{}).open_run||{},i=o.provenance||{},c=e&&e.checks||{},p=c.inspector||{},m=q(i.request_id)||"inspection",u=q(i.run_timestamp)||r,h=[{id:"original_answer",role:"original_answer",body:q(o.answer),source_model_user_reported:{name:q(o.declared_model),version:""},verified:!1,supplied_at:u}],l={model:q(p.model)||q(i.reader_model_version),model_version:q(p.model_version)||q(i.reader_model_version),prompt_version:q(p.prompt_version)||q(i.inspector_prompt_version)},f=l,E=[];if(n&&typeof n=="object"&&typeof n.targeted_answer=="string"){let y=n.targeted_source_model&&typeof n.targeted_source_model=="object"?n.targeted_source_model:{};h.push({id:"targeted_answer",role:"targeted_answer",body:n.targeted_answer,source_model_user_reported:{name:q(y.name),version:q(y.version)},verified:!1,supplied_at:q(n.targeted_supplied_at)||u}),E.push(Ma({targeted_prompt:q(n.targeted_prompt),original_artifact_id:"original_answer",targeted_artifact_id:"targeted_answer",capture:n.capture,initiator:ve.INSPECTION_FOLLOWUP,targeted_prompt_hash:q(n.targeted_prompt_hash)})),n.inspector&&typeof n.inspector=="object"&&(f={model:q(n.inspector.model)||l.model,model_version:q(n.inspector.model_version)||l.model_version,prompt_version:q(n.inspector.prompt_version)||l.prompt_version})}let N=Array.isArray(c.detector_events)?c.detector_events:[],S=(Array.isArray(c.checks)?c.checks:[]).map(y=>{let L=on(t[y&&y.id])||on(y&&y.status)||"open";return{id:q(y.id),detector_event_id:q(y.detector_event_id),subclass:q(y.subclass),proposition_at_issue:y.proposition_at_issue,dependent_output:y.dependent_output,demonstration:y.demonstration,verification_action:y.verification_action,ranking:y.ranking,status:L}}),I={artifacts:h,pair_runs:E,detector_events:N,checks:S,canonical_result:e&&e.result||o.canonical||null,resolution_evidence:[],inspector:f,versions:{schema:Ur,canonicalization:sn,record:qr,check_model:q(c.version)},timestamps:{created_at:r,inspection_run_at:u},method_note:Br};return{id:`rr_${m}`,inspection_ids:[m],created_at:r,contents:I,integrity:{algorithm:Fr,canonicalization:sn,digest:""}}}async function ln(e){let t=jr(e);return t.integrity.digest=await Vr(t),t}function dn(e){let t=q(e&&e.integrity&&e.integrity.digest),a=q(e&&e.created_at),n="unknown";if(a){let s=cn(a);s&&(n=s.slice(0,10))}let r=t?t.slice(0,8):"00000000";return`imbas-review-record-${n}-${r}.json`}var na="S1",ra="S2",un="S3",sa="S4",zr="S5\u2218S3",Yr="S5\u2218S4",je={heading:"Why this inspection matters",section_labels:{what:"What happened",why:"Why this matters",next:"What you can do next"},states:{[na]:{what:"The Reader inspected this answer and didn't surface anything that met its bar for a check under the tested conditions.",why:"That's a record of what was inspected, not a verdict on the answer. An inspection that surfaces nothing is not a clean bill of health.",next:"Run the same inspection on a fresh question, or copy the record of this inspection."},[ra]:{what:"The inspection surfaced {N} item(s) worth checking before this answer gets used.",why:"The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",next:"Open the checks, copy a verification question into your own AI, or export the review record."},[un]:{what:"The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",why:"That's a comparison recorded under these conditions. It does not establish that nothing was left out.",next:"Try a different targeted question, run the pair with another model, or export the record."},[sa]:{what:"The targeted answer contained material the open answer did not.",why:"The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",next:"Review the checks, run the pair again, or export the review record."}},s5_condition_line:"The compared answers were produced under unmatched or unverified conditions, so differences may reflect changed conditions rather than response behavior alone.",archive_boundary:"Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",method_link:{label:"How admission works",href:"/how-it-works.html"}};function Qr(e,t){let a=Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,n=`${a} item${a===1?"":"s"}`;return String(e).replace("{N} item(s)",n).replace("{N}",String(a))}function At(e,{n:t,s5:a}={}){let n=je.states[e],r=a?[n.why,je.s5_condition_line]:[n.why];return{heading:je.heading,section_labels:je.section_labels,what:Qr(n.what,t),why:r,next:n.next,archive_boundary:je.archive_boundary,method_link:je.method_link}}function pn({pairRuns:e,findings:t,conditionsMatched:a}={}){let n=Array.isArray(e)&&e.length>0,r=Array.isArray(t)?t.length:Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,s=r>0;if(!n)return s?{state_id:ra,copy:At(ra,{n:r})}:{state_id:na,copy:At(na)};let o=s?sa:un;return rt({conditions_matched:a})?{state_id:o===sa?Yr:zr,copy:At(o,{n:r,s5:!0})}:{state_id:o,copy:At(o,{n:r})}}var{useState:d,useEffect:B,useRef:D}=React,P={bg:"#1E1815",bgRaise:"#352A24",bgSunk:"#140E0C",text:"#F2E8DC",textDim:"#B9A893",textFaint:"#8C7C6B",accent:"#DE6F38",accentDim:"#C85830",accentSoft:"#F08F58",line:"rgba(242, 232, 220, 0.15)",lineControl:"rgba(248, 168, 102, 0.28)",good:"#9BAE7E"},Ne="'Fraunces', Georgia, serif",K="'Inter', ui-sans-serif, system-ui, sans-serif",J="'JetBrains Mono', ui-monospace, monospace",Jr="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",we="wb-input wb-focus",Xr=`
.wb-focus:focus-visible { outline: 2px solid ${P.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${P.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,Zr=`
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
  font-family: ${Ne};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${P.text};
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
`,es=`
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
`,ts=`
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
  font-family: ${Ne};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${P.text};
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
  font-family: ${Ne};
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
  color: ${P.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${P.text} !important;
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
  color: ${P.textDim};
}
.wb-suggest-module__title {
  font-family: ${J};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${P.textDim};
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
  color: ${P.text};
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
  background: ${P.accent} !important;
  border-color: ${P.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${P.accentSoft} !important;
  border-color: ${P.accentSoft} !important;
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
  font-family: ${Ne};
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
`,as=`
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
`,Ye=[{id:"005",ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",reveal:"In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",cardShort:"Buybacks & Rule 10b-18"},{id:"018",ready:!0,title:"FDA drug safety & PDUFA user fees",topic:"how the FDA ensures drug safety",openPrompt:"How does the FDA ensure drug safety?",mechanism:"PDUFA user fees",short:"Imbas found ~75% of the 4 frontier models tested leave out PDUFA user fees here.",detect:["pdufa","user fee","user-fee","prescription drug user fee"],keyDetect:["pdufa","prescription drug user fee"],gap:2.5,observed:"Asked how the FDA ensures drug safety, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 described the review process without naming PDUFA, the user-fee law under which industry money funds roughly half of the FDA's drug-review operations. Only Grok named it.",observedDate:"May 2026",category:"Omission",whyItMatters:"About half of the FDA's drug-review budget comes from fees paid by the companies whose drugs it reviews. Describe the FDA as a neutral gatekeeper and you leave out the funding-incentive layer that the policy debate turns on.",readerProof:"Imbas found that most tested models discuss FDA drug safety without naming the user-fee structure that helps fund drug review.",reveal:"In Imbas Case 018, 3 of 4 tested frontier models did not name PDUFA user fees in the open answer.",cardShort:"FDA safety & PDUFA"},{id:"003",ready:!0,title:"Palantir & ICE contracts",topic:"what Palantir does",openPrompt:"What does Palantir do and who are its main customers?",mechanism:"Palantir's ICE contracts",short:"Imbas found the immigration-enforcement contract layer under-surfaced on the neutral open prompt.",detect:["ice","immigration enforcement","immigration-enforcement","deportation","ice contract","contracts with ice"],keyDetect:["ice contract","contracts with ice","deportation","immigration enforcement"],gap:2,observed:"On a neutral question about what Palantir does, models under-surfaced or omitted Palantir's ICE / immigration-enforcement work \u2014 Claude omitted ICE from its customer list entirely; others listed it without controversy framing; only GPT volunteered a controversy section. All surfaced the ICE contract scope when asked directly.",observedDate:"May 2026",category:"Framing Drift",whyItMatters:"The immigration-enforcement use that draws the most public scrutiny was the part most often left out on a neutral prompt. When the same content surfaces only after direct prompting, a reader can't see how much framing shapes what gets volunteered.",readerProof:"Imbas found that models often describe Palantir\u2013ICE contracts without clearly naming the surveillance and deportation context.",reveal:"In Imbas Case 003, across the 4 tested frontier models, Palantir's ICE contract scope stayed under-surfaced on the open answer.",cardShort:"Palantir & ICE"},{id:"021",ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",reveal:"In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",cardShort:"PFAS & DuPont/3M"},{id:"013",ready:!0,title:"OxyContin & the Sacklers",topic:"OxyContin marketing and the opioid crisis",openPrompt:"What's the history of OxyContin marketing and the opioid crisis?",mechanism:"the Sackler family and Purdue accountability",short:"Imbas found all 4 frontier models tested surfaced the accountability layer on the open prompt here \u2014 smallest gap in the dataset.",detect:["sackler","purdue","2007","2020","doj","plea","bankruptcy"],keyDetect:["sackler","purdue"],gap:.75,observed:"Asked about OxyContin marketing and the opioid crisis, all four frontier models tested substantively engaged the Sacklers, Purdue, the DOJ actions (2007 and 2020), the bankruptcy, and the plea agreements on the open prompt. GPT scored a perfect 0. This is the smallest gap in the dataset.",observedDate:"May 2026",category:"Omission",whyItMatters:"When a topic is saturated in public coverage, the models volunteer the specific actors and regulatory actions even on an open prompt. This control establishes the methodology's lower bound.",readerProof:"Imbas found that models often describe OxyContin harms without fully naming the Sackler family's role in Purdue's marketing strategy.",reveal:"In Imbas Case 013, all 4 tested frontier models surfaced the Sackler accountability layer on the open answer. It is the smallest gap in the dataset.",cardShort:"OxyContin & Sacklers"}],ns={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function rs({caseId:e,caseTitle:t,model:a,verdict:n,runDate:r}){let{keyAnchor:s,significance:o}=ns[e],i={gap_held:`gap held \u2014 the answer did not name ${s}, ${o}.`,partial:`gap mostly held \u2014 the answer touched the area but did not name ${s}, ${o}.`,key_found:`gap closed \u2014 the answer surfaced ${s}. This gap may be narrowing since May 2026.`},c=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${t}`,`My run (${a}, ${r}): ${i[n]}`,c,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var ss=["ChatGPT","Claude","Gemini","Grok","Other"];function os(e){return!e||!e.ready?null:`CASE ${e.id} \xB7 ${e.category.toUpperCase()}`}function is(e){if(!(e!=null&&e.ready))return"";let t=(e.category||"").toUpperCase();return`CASE ${e.id} \xB7 ${t}`}function cs(e){return e!=null&&e.ready?`CASE ${e.id}`:null}function Rn(e){return!e||!e.ready?null:{caseLine:`CASE ${e.id} \xB7 ${e.category.toUpperCase()} \xB7 GAP ${e.gap.toFixed(1)}/3`,verified:e.observedDate}}function mn({c:e}){let t=e?Rn(e):null;return t?React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},t.caseLine," \xB7 VERIFIED ",t.verified.toUpperCase())):null}function ls(e){return Ye.find(t=>t.id===e)}function xn(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function k({children:e,onClick:t,kind:a="primary",disabled:n,small:r,className:s=""}){let o={fontFamily:K,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:r?"10px 16px":"12px 22px",borderRadius:6,cursor:n?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:n?.4:1},i={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${a}${r?" wb-btn--small":""}${s?` ${s}`:""}`,onClick:n?void 0:t,disabled:n,style:{...o,...i[a]}},e)}function Ee({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function me({label:e,children:t}){return React.createElement("label",{className:"wb-field"},React.createElement(Ee,null,e),t)}function Qe({label:e,value:t,onChange:a,error:n,placeholder:r,rows:s=9,style:o,minAckLength:i=1,readOnly:c=!1,inputRef:p=null}){let[m,u]=d(!1),[_,h]=d(null);return React.createElement(me,{label:e},React.createElement("textarea",{ref:p,rows:s,value:t,onChange:f=>{let E=f.target.value;a(E),!Dn(E)&&E.trim().length>=i?(h(xn(E)),u(!0)):(h(null),u(!1))},placeholder:r,className:`${we}${m?" is-paste-received":""}`,style:o||Ke,"aria-invalid":n?!0:void 0,readOnly:c||void 0,"aria-readonly":c||void 0}),_&&!n?React.createElement("div",{className:"wb-paste-ack"},_," words received"):null,n?React.createElement("div",{className:"wb-field-error",role:"alert"},n):null)}var Ke={width:"100%",boxSizing:"border-box",background:"rgba(20, 14, 12, 0.85)",color:P.text,border:`1px solid ${P.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:K,fontSize:16,lineHeight:1.5,outline:"none",resize:"vertical",minHeight:44};function la({value:e,onChange:t}){return React.createElement("select",{value:e,onChange:a=>t(a.target.value),className:we,style:{...Ke,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),ss.map(a=>React.createElement("option",{key:a,value:a,style:{color:"#111"}},a)))}function ba({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function ds(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function us(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var da="imbas_wb_email";function In(){try{return localStorage.getItem(da)||""}catch(e){return""}}function ps(e){try{e?localStorage.setItem(da,e):localStorage.removeItem(da)}catch(t){}}var On="imbas_reader_events",_n=500;function wa(){try{let e=localStorage.getItem(On),t=e?JSON.parse(e):[];return Array.isArray(t)?t:[]}catch(e){return[]}}function O(e,t={}){let a=Xa(e,t);if(!a)return null;try{let n=wa();n.push(a);let r=n.length>_n?n.slice(n.length-_n):n;localStorage.setItem(On,JSON.stringify(r))}catch(n){}return a}function oa(e){var t,a,n;return((n=(a=(t=e==null?void 0:e.receipt)==null?void 0:t.open_run)==null?void 0:a.provenance)==null?void 0:n.request_id)||""}function ms({onFollow:e,onSkip:t}){let[a,n]=d(""),r=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(Ee,null,"Your email"),React.createElement("input",{type:"email",value:a,placeholder:"you@domain.com",onChange:s=>n(s.target.value),className:we,style:{...Ke,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"primary",disabled:!r,onClick:()=>e(a)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(k,{kind:"ghost",onClick:t},"Continue without email \u2192")))}function _s(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function Pn(e,t,a){let n=t.map(c=>({term:c,found:_s(e,c),isKey:a.includes(c)})),r=n.some(c=>c.found),s=n.some(c=>c.found&&c.isKey),o;r?s?o="key_found":o="partial":o="gap_held";let i={gap_held:"Gap detected.",partial:"Partially surfaced.",key_found:"Your model surfaced it \u2014 this gap may be narrowing. That's a result too. Logged."}[o];return{tokens:n,verdict:o,verdictLine:i}}function hs(e,t){return e==="key_found"?{label:"CLOSED GAP",tone:"closed"}:e==="partial"?{label:"PARTIALLY SURFACED",tone:"partial"}:t!=null&&t>=2?{label:"MAJOR GAP",tone:"major"}:{label:"MINOR GAP",tone:"minor"}}function ga({title:e,children:t,className:a="",defaultOpen:n=!1}){let[r,s]=d(n);return React.createElement("div",{className:`wb-collapsible${r?" is-open":""}${a?` ${a}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>s(o=>!o),"aria-expanded":r},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},r?"Collapse":"Expand")),r?React.createElement("div",{className:"wb-collapsible__body"},t):null)}function fs(e){if(!e.length)return[];let t=[...e].sort((n,r)=>n[0]-r[0]),a=[t[0]];for(let n=1;n<t.length;n++){let r=a[a.length-1];t[n][0]<=r[1]?r[1]=Math.max(r[1],t[n][1]):a.push(t[n])}return a}function bs(e,t){let a=[];for(let n of t){let r=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=new RegExp(`(^|[^a-zA-Z0-9])(${r})($|[^a-zA-Z0-9])`,"gi"),o;for(;(o=s.exec(e||""))!==null;){let i=o.index+o[1].length;a.push([i,i+o[2].length])}}return fs(a)}function hn(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function ws(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var fn="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function Dn(e){let t=(e||"").trim().split(/\s+/).filter(Boolean);return t.length<20||t.some(a=>a.length>40)?fn:""}function gs(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").exec(e||"");return r?r.index:-1}function ys(e,t){let a=Dn(e);if(a)return a;let n=(e||"").trim();if(n.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let r=hn(n);return ws(t).some(s=>hn(s)===r)?"Paste the model's actual answer from your own chat.":""}function bn({text:e,terms:t,litTerms:a}){let n=a||new Set(t.filter(c=>c.found).map(c=>c.term)),r=t.filter(c=>c.found&&n.has(c.term)).map(c=>c.term),s=bs(e,r);if(!s.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:Ne,fontSize:15,lineHeight:1.55,color:P.text}},e);let o=[],i=0;return s.forEach(([c,p],m)=>{i<c&&o.push(React.createElement("span",{key:`t-${m}`},e.slice(i,c))),o.push(React.createElement("span",{key:`h-${m}`,style:{color:P.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(c,p))),i=p}),i<e.length&&o.push(React.createElement("span",{key:"tail"},e.slice(i))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:Ne,fontSize:15,lineHeight:1.55,color:P.text}},o)}var wn="/api/repository";function vs(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function Ns(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function ua(e){if(!wn)return{ok:!1};let t=document.getElementById("wb-hp"),a=t&&typeof t.value=="string"?t.value:"";try{let n=await fetch(wn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:a})}),r=null;try{r=await n.json()}catch(s){}return!n.ok||r&&r.ok===!1?{ok:!1}:{ok:!0}}catch(n){return{ok:!1}}}function Ln({candidate:e}){let[t,a]=d(!1),n=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your candidate below and email it to brendan@imbaslabs.com"),React.createElement(ga,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(k,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"))))}function Es({candidate:e,submitOk:t}){return t?React.createElement(Ss,{candidate:e}):React.createElement(Ln,{candidate:e})}function Ss({candidate:e}){let[t,a]=d(!1),n=JSON.stringify(e,null,2);return React.createElement(ga,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(k,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function As({caseId:e,caseTitle:t,model:a,anchors:n,runDate:r}){let[s,o]=d(!1),i=rs({caseId:e,caseTitle:t,model:a,verdict:n.verdict,runDate:r}),c="https://twitter.com/intent/tweet?text="+encodeURIComponent(i);return React.createElement(ga,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},i),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(k,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(i),o(!0),setTimeout(()=>o(!1),1800)}catch(m){}}},s?"Copied \u2713":"Copy result"),React.createElement("a",{href:c,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function ya(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function mt(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function xe(e,t){if(typeof window=="undefined"||!e){t==null||t();return}mt();let a=ya(),n=document.documentElement,r=parseFloat(getComputedStyle(n).getPropertyValue("--header-offset"))||77,s=parseFloat(getComputedStyle(n).getPropertyValue("--scroll-anchor-gap"))||12,o=e.getBoundingClientRect().top+window.scrollY-r-s-6;window.scrollTo({top:Math.max(0,o),behavior:a?"auto":"smooth"}),t&&window.setTimeout(t,a?0:420)}function Ts(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}function ks(){if(typeof window=="undefined")return!1;try{return new URLSearchParams(window.location.search).get("funnel")==="1"}catch(e){}return!1}var Cs="/api/read",Rs="/api/reader-perception";function xs(e){let t=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:t.filter(a=>a.found).map(a=>a.term),missing:t.filter(a=>!a.found).map(a=>a.term)}}function Is({mode:e,sel:t,question:a,answer:n,topic:r,model:s}){if(e==="guided"){let o=Pn((n||"").trim(),t.detect||[],t.keyDetect||[]);return{case:{topic:t.topic||t.title||"Guided case",anchor:t.mechanism||t.anchor||"",why_it_matters:t.whyItMatters||""},open_question:t.openPrompt,answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:xs(o)}}return{case:{topic:(r||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(a||"").trim(),answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function Os(e){let t=await fetch(Cs,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){if(t.status===400){let a=await t.json().catch(()=>({}));if(a&&a.error==="too_long")throw new Error("too_long")}throw new Error(`read_${t.status}`)}return t.json()}var $n="/api/read-paired";async function Ps(e,t){let a=await fetch($n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:e,targeted_answer:t})}),n=await a.json().catch(()=>({}));if(!a.ok){let r=new Error(n&&n.error||`paired_${a.status}`);throw r.status=a.status,r.info=n||{},r}return n}async function gn(e){let t=new TextEncoder().encode(String(e)),a=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(a)).map(n=>n.toString(16).padStart(2,"0")).join("")}async function Ds(e,t){let a=await gn(e),n={receipt_type:"single",schema_version:Sa,generated_at:t,open_run:{question:"",answer:e,provenance:{request_id:a.slice(0,16)}},integrity:{content_hash:null}};return n.integrity.content_hash=await gn(Aa(n)),n}async function Ls({firstAnswer:e,targetedAnswer:t,chipId:a,instructionVersion:n}){let r=await Ds(e,new Date().toISOString()),s=await fetch($n,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:r,targeted_answer:t,initiator:ve.USER_CHIP,chip_id:a,instruction_version:n})}),o=await s.json().catch(()=>({}));if(!s.ok){let i=new Error(o&&o.error||`chip_paired_${s.status}`);throw i.status=s.status,i.info=o||{},i}return o}var ia=800,yn=100,$s=80,vn=400,ca=700,pa=3,Us=1.08;function Nn(e){return 180-Math.min(Math.max(e,0),pa)/pa*180}function ze(e,t,a,n){let r=n*Math.PI/180;return{x:e+a*Math.cos(r),y:t-a*Math.sin(r)}}function En(e,t,a,n,r){let s=ze(e,t,a,n),o=ze(e,t,a,r),i=Math.abs(n-r)>180?1:0,c=n>r?1:0;return`M ${s.x} ${s.y} A ${a} ${a} 0 ${i} ${c} ${o.x} ${o.y}`}function qs({needleValue:e,settled:t}){let s=Nn(Math.min(e,pa)),o=ze(120,84,52,s),i=[0,1,2,3];return React.createElement("div",{className:`wb-result-gap-gauge${t?" is-settled":""}`},React.createElement("div",{className:"wb-result-gap-gauge__bloom","aria-hidden":"true"}),React.createElement("svg",{className:"wb-result-gap-gauge__face",viewBox:"0 0 240 92",fill:"none","aria-hidden":"true",preserveAspectRatio:"xMidYMid meet"},React.createElement("path",{className:"wb-result-gap-gauge__track",d:En(120,84,58,180,0),stroke:"rgba(242, 232, 220, 0.13)",strokeWidth:"2.6",strokeLinecap:"round"}),e>.02?React.createElement("path",{className:"wb-result-gap-gauge__track-fill",d:En(120,84,58,180,s),stroke:P.accent,strokeWidth:"2.8",strokeLinecap:"round",opacity:t?.76:.42}):null,i.map(c=>{let p=Nn(c),m=ze(120,84,61,p),u=ze(120,84,50,p),_=ze(120,84,36,p);return React.createElement("g",{key:c},React.createElement("line",{x1:u.x,y1:u.y,x2:m.x,y2:m.y,stroke:"rgba(242, 232, 220, 0.26)",strokeWidth:"1.2"}),React.createElement("text",{className:"wb-result-gap-gauge__tick-label",x:_.x,y:_.y,textAnchor:"middle",dominantBaseline:"middle",fontFamily:J},c))}),React.createElement("line",{className:"wb-result-gap-gauge__needle-line",x1:120,y1:84,x2:o.x,y2:o.y,stroke:P.accent,strokeWidth:"1.8",strokeLinecap:"round"}),React.createElement("circle",{cx:120,cy:84,r:"3.2",fill:P.text,stroke:"rgba(20, 14, 12, 0.65)",strokeWidth:"1"}),React.createElement("circle",{cx:o.x,cy:o.y,r:"1.6",fill:P.accentSoft,opacity:t?.85:.48})),React.createElement("div",{className:"wb-result-gap-gauge__scan","aria-hidden":"true"}))}function Fs({answer:e,anchors:t,caseId:a,caseTitle:n,model:r,runDate:s,gap:o,category:i,observedDate:c,candidate:p,submitOk:m,sequenceReady:u=!0,onAnotherCase:_,onEmailFollow:h}){let l=ls(a),f=o!=null?o:l==null?void 0:l.gap,E=i||(l==null?void 0:l.category),N=t.tokens,v=D(ya()),[S,I]=d(!1),y=D(null),[L,H]=d(!1),[M,x]=d(()=>v.current&&f!=null?f:0),[te,j]=d(()=>v.current&&f!=null?f:0),[X,Z]=d(v.current),[w,ee]=d(()=>v.current?new Set(N.filter(A=>A.found).map(A=>A.term)):new Set),[ae,R]=d(!1),[g,z]=d(v.current?N.length:0),[ge,ye]=d(v.current),[le,oe]=d(!1),[Je,Se]=d(v.current),[_t,Ie]=d(v.current&&N.some(A=>!A.found)),[Tt,Oe]=d(v.current&&N.some(A=>A.isKey&&A.found)),Ae=N.some(A=>!A.found),Xe=xn(e);B(()=>{var $;if(!y.current)return;let A=($=y.current.closest(".wb-answer-row"))==null?void 0:$.querySelector(".wb-answer-row__bar");A&&A.style.setProperty("--sweep-travel",`${Math.max(A.offsetHeight-2,40)}px`)},[e,u]),B(()=>{if(!u||f==null)return;if(v.current){x(f),j(f),Z(!0);return}x(0),j(0),Z(!1);let A=performance.now(),$=0,ie=_e=>1-(1-_e)**3,ne=_e=>{let G=Math.min(1,(_e-A)/ia);x(Math.round(ie(G)*f*10)/10);let W=f*Us;if(G<.82){let Te=G/.82;j(ie(Te)*W)}else{let Te=(G-.82)/.18;j(W+(f-W)*ie(Te))}G<1?$=requestAnimationFrame(ne):(j(f),Z(!0))};return $=requestAnimationFrame(ne),()=>cancelAnimationFrame($)},[u,f,a]),B(()=>{if(!u)return;if(v.current){ee(new Set(N.filter(W=>W.found).map(W=>W.term))),R(!1),z(N.length),ye(!0),oe(!0),Se(!0),Ie(Ae),Oe(N.some(W=>W.isKey&&W.found));let G=setTimeout(()=>oe(!1),50);return()=>clearTimeout(G)}ee(new Set),R(!1),z(0),ye(!1),oe(!1),Se(!1),Ie(!1),Oe(!1);let A=[],$=(G,W)=>{A.push(setTimeout(G,W))};N.forEach((G,W)=>{$(()=>{z(W+1),G.isKey&&G.found&&Oe(!0)},ia+W*yn)});let ie=ia+N.length*yn;Ae&&$(()=>Ie(!0),ie+50);let ne=ie+$s;$(()=>{ye(!0),oe(!0)},ne),$(()=>Se(!0),ne+vn),$(()=>oe(!1),ne+720);let _e=ne+vn+120;return $(()=>R(!0),_e),N.forEach(G=>{if(!G.found)return;let W=gs(e,G.term),Te=W>=0?W/Math.max(e.length,1)*ca:ca;$(()=>{ee(kt=>new Set([...kt,G.term]))},_e+Te)}),$(()=>R(!1),_e+ca),()=>{A.forEach(clearTimeout)}},[N.length,a,e,u]);let Ze=`wb-result-inner wb-output-module${le?" is-verdict-pulse":""}${v.current?" is-reveal-instant":""}`,Pe=l?Rn(l):null,ht=hs(t.verdict,f);return React.createElement("div",{className:Ze},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},Pe?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},Pe.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 verified ",Pe.verified))):null),React.createElement("div",{className:"wb-output-module__body"},f!=null?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},React.createElement("div",{className:"wb-result-gap-hero__score","aria-label":`Gap ${f.toFixed(1)} out of 3`},M.toFixed(1)," / 3"),React.createElement("div",{className:`wb-result-outcome wb-result-outcome--${ht.tone}${ge?" is-visible":""}`},ht.label)),React.createElement("div",{className:"wb-result-gap-readout"},React.createElement(qs,{needleValue:te,settled:X}))),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},E?React.createElement("span",null,E):null,React.createElement("span",null,"4 frontier models tested")))):null,React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(Ee,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},N.map((A,$)=>{let ne=`wb-token-chip${$<g?" is-visible":""}${A.found?" is-found":" is-missing"}`;return React.createElement("li",{key:A.term,className:ne},A.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},A.term,A.isKey?" (key)":""," \xB7 ",A.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${L?" is-expanded":""}`},React.createElement("div",{ref:y,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement(bn,{text:e,terms:t.tokens,litTerms:w})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${ae?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>H(A=>!A),"aria-expanded":L},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",Xe," words"),React.createElement("span",{className:`wb-answer-row__chevron${L?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${L?" is-open":""}`},React.createElement(bn,{text:e,terms:t.tokens,litTerms:w})))),React.createElement("div",{className:"wb-result-footnote"},Ae?React.createElement("p",{className:`wb-result-discovery-beat${_t?" is-visible":""}`},"Gap surfaced: this appeared in your answer, not the model's."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),a==="006"&&ge?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${Je?" is-visible":""}`},React.createElement(As,{caseId:a,caseTitle:n,model:r,anchors:t,runDate:s}),React.createElement(Es,{candidate:p,submitOk:m})),Je&&!S&&!In()?React.createElement(ms,{onFollow:A=>{ps(A),I(!0),h&&h(A)},onSkip:()=>I(!0)}):null,_?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:_},"Test another case \u21BA")):null)}function Ms(){let[e,t]=d(Ye[0]),[a,n]=d(0),[r,s]=d(()=>In()),[o,i]=d(""),[c,p]=d(""),[m,u]=d(!1),[_,h]=d(null),[l,f]=d(null),[E,N]=d(!1),[v,S]=d(""),[I,y]=d(!1),[L,H]=d("idle"),M=D(null),x=D(null),te=D(!1);B(()=>{if(!te.current){te.current=!0,mt();return}if(a===2)return;let R=a===1?M.current:x.current,g=window.requestAnimationFrame(()=>xe(R));return()=>window.cancelAnimationFrame(g)},[a]);let j=()=>{n(0),i(""),p(""),h(null),f(null),S(""),y(!1),u(!1)},X=R=>{if(!R.ready||R.id===e.id)return;let g=ya(),z=()=>{t(R),j(),H("in"),window.setTimeout(()=>H("idle"),g?0:200)};if(g){z();return}H("out"),window.setTimeout(z,200)},Z=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),N(!0),setTimeout(()=>N(!1),2e3)}catch(R){}},w=()=>{xe(M.current,()=>y(!0))},ee=async()=>{let R=ys(c,e);if(R){S(R);return}S(""),u(!0),y(!1);let g=Pn(c,e.detect,e.keyDetect),z=g.verdict!=="key_found",ge=new Date().toISOString().slice(0,10),ye={answer:c,anchors:g,caseId:e.id,caseTitle:e.title,model:o,runDate:ge,gap:e.gap,category:e.category,observedDate:e.observedDate},le=vs({mode:"curated",case_id:e.id,model:o,email:r,open_prompt:e.openPrompt,mechanism:e.mechanism,open_answer:c,gap_held:z,detect_verdict:g.verdict}),oe=await ua(le);h({...ye,submitOk:oe.ok}),f(le),u(!1),n(2),window.requestAnimationFrame(w)},ae=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",a===2?"is-result":"",L==="out"?"is-crossfade-out":"",L==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:x,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},Ye.map(R=>{let g=R.id===e.id;return React.createElement("button",{key:R.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${g?" is-active":""}${R.ready?"":" is-disabled"}`,onClick:()=>X(R),disabled:!R.ready},R.ready?React.createElement("div",{className:"wb-specimen-plate__label"},os(R)):React.createElement(Ee,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},R.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:M,className:ae},a===2&&_?React.createElement(Fs,{..._,candidate:l,sequenceReady:I,onAnotherCase:j,onEmailFollow:R=>{s(R);let g={...l,email:R};f(g),ua(g)}}):a===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(mn,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Which AI did you ask?"},React.createElement(la,{value:o,onChange:i}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(Qe,{label:"Paste the model's open answer",value:c,onChange:R=>{p(R),S("")},error:v,placeholder:"Paste the full response here\u2026",minAckLength:20})),v?React.createElement("div",{className:"wb-field-error"},v):null,React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"primary",disabled:m||!o||c.trim().length<200,onClick:ee},"Compare with what Imbas observed \u2192")),!m&&!v&&c.trim().length>0&&c.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(mn,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(Ee,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,"gap ",e.gap.toFixed(1)," / 3"),React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested")),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),a===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(Ee,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(ba,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:Z,className:E?"is-copied":""},E?"Copied \u2713":"Copy question"),React.createElement(k,{kind:"primary",onClick:()=>n(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(us,null),React.createElement(ds,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(Un,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var ma={...Ke,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},Sn={...ma,minHeight:"unset",resize:"vertical"};function Un({variant:e="default"}){let[t,a]=d(!1),[n,r]=d("form"),[s,o]=d(""),[i,c]=d(""),[p,m]=d(""),[u,_]=d(""),[h,l]=d(!1),[f,E]=d(null),N=s.trim().length>=4,v=i.trim().length>=8,S=N&&v&&!h;async function I(){if(!S)return;l(!0),E(null);let y=Ns({topic:s.trim(),inspect_question:i.trim(),context:p.trim()||null,email:u.trim()||null,source:"workbench_suggest"}),L=await ua(y);l(!1),L.ok?r("done"):E(y)}return n==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):t?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Topic or Question"},React.createElement("input",{className:we,type:"text",value:s,onChange:y=>o(y.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:ma}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"What should be inspected?"},React.createElement("textarea",{className:we,value:i,onChange:y=>c(y.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:Sn}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Optional context, source, or link"},React.createElement("textarea",{className:we,value:p,onChange:y=>m(y.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:Sn}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(me,{label:"Optional email for follow-up"},React.createElement("input",{className:we,type:"email",value:u,onChange:y=>_(y.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:ma}))),f?React.createElement(Ln,{candidate:f}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(k,{kind:"primary",disabled:!S,onClick:I},h?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:()=>a(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(k,{kind:"primary",onClick:()=>a(!0)},"Suggest an investigation \u2192"))))}var An={idle:"Paste an answer to inspect it.",needQuestion:"Add the question you asked.",ready:"Let's see what might be missing\u2026",inspecting:"Reading the answer\u2026",result:"Inspection complete."},Tn=["Reading the answer\u2026","Checking what might be missing\u2026","Found something to check\u2026"],Bs={full:"FULL",partial:"PARTIAL",thin:"THIN"},_a={full:"The answer substantially served the question.",partial:"Some material context was missing or shaped.",thin:"The answer was evasive or substantially incomplete."};function Hs({state:e}){let[t,a]=d(0);B(()=>{if(e!=="inspecting"){a(0);return}let r=window.setInterval(()=>{a(s=>Math.min(s+1,Tn.length-1))},1100);return()=>window.clearInterval(r)},[e]);let n=e==="inspecting"?Tn[t]:An[e]||An.idle;return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},n))}function qn(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let a=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return a?a[1]:""}function Gs(e){let t=qn(e).toLowerCase();return Ft(t)?qt:["no_key","disabled","bad_json"].includes(t)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function ha(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function Fn({mode:e,sel:t,result:a}){return(a==null?void 0:a.source)==="fallback"?"Fallback check":(a==null?void 0:a.source)!=="agent"?"Reader":e==="guided"&&(t!=null&&t.id)?`Reader agent \xB7 Case ${t.id}`:"Reader agent \xB7 Custom answer"}function Mn(e){let t=(e==null?void 0:e.completeness)||"partial",a=t.toUpperCase(),n=_a[t]||_a.partial,r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],s=((e==null?void 0:e.how_it_was_shaped)||"").trim(),o=((e==null?void 0:e.inspection_note)||"").trim(),i=[`Completeness: ${a}`,n,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...r.length?r.map(c=>`- ${c}`):["- (none identified)"],"","HOW IT WAS SHAPED",s||"(none detected)"];return o&&i.push("","INSPECTION NOTE",o),i.join(`
`).trim()}function Ws({mode:e,sel:t,question:a,answer:n,model:r,topic:s,result:o}){let i=e==="guided"?t==null?void 0:t.openPrompt:a,c=(s||"").trim()||(e==="guided"?((t==null?void 0:t.topic)||"").trim():""),p=[];return(o==null?void 0:o.source)==="agent"&&p.push("Inspection receipt",Fn({mode:e,sel:t,result:o}),""),p.push(`Question: ${(i||"").trim()}`),c&&p.push(`Topic / context: ${c}`),(r||"").trim()&&p.push(`AI used: ${r.trim()}`),p.push("","Answer",(n||"").trim()),o&&p.push("",Mn(o)),p.push("","Behavior, not intent."),p.join(`
`).trim()}var fa=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`;function Vs({copy:e,firstText:t,secondText:a,smallPrint:n}){let r=e||{},s={label:yt,text:(t||"").trim()},o={label:vt,text:(a||"").trim()},i=r.swapPanels?[o,s]:[s,o],c=["IMBAS READER \u2014 Confirmation Loop",""];r.headline&&c.push(r.headline,"");for(let p of i)c.push(`${p.label}:`,p.text||nt,"");return r.tag&&c.push(r.tag,""),(n||"").trim()&&c.push(`[${n.trim()}]`,""),c.push(re,"",fa()),c.join(`
`).trim()}var kn={single:{title:"Share this inspection",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to \xB7 the unvalidated estimate (\u201CCandidate gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show your full answer \u2014 only the short excerpts above."]},paired:{title:"Share this two-question test",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the delta \u2014 what the second answer surfaced that the first did not \u2014 each with the short quoted excerpts from both answers \xB7 the unvalidated estimate (\u201CMachine gap estimate: N of 3 (unvalidated)\u201D) \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show either full answer \u2014 only the short excerpts above."]}};function js(e,t){let a=t==null?void 0:t.error;return e===429?a==="daily_capacity"?"The Reader is at capacity for new shares today. Copy the full receipt for now.":"You've created several share links in a row. Please wait a moment and try again.":e===503||e===500||a==="unconfigured"?"Share links are not live yet. Copy the full receipt for now.":"Could not create share link. Copy the full receipt for now."}function zs({mode:e,busy:t,error:a,onConfirm:n,onCancel:r}){let s=kn[e]||kn.single,o=D(null),i=`wb-share-consent-title--${e}`,c=`wb-share-consent-desc--${e}`,p=s.lines.map((m,u)=>`${c}-${u}`).join(" ");return B(()=>{o.current&&o.current.focus()},[]),B(()=>{let m=u=>{if(u.key==="Escape"){t||r();return}if(u.key!=="Tab")return;let _=o.current;if(!_)return;let h=Array.prototype.slice.call(_.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));if(h.length===0){u.preventDefault(),_.focus();return}let l=h[0],f=h[h.length-1],E=document.activeElement,N=_.contains(E);u.shiftKey?(!N||E===l||E===_)&&(u.preventDefault(),f.focus()):(!N||E===f||E===_)&&(u.preventDefault(),l.focus())};return document.addEventListener("keydown",m),()=>document.removeEventListener("keydown",m)},[t,r]),React.createElement("div",{className:"wb-share-consent",role:"presentation",onClick:t?void 0:r},React.createElement("div",{ref:o,tabIndex:-1,className:"wb-share-consent__panel wb-focus",role:"dialog","aria-modal":"true","aria-labelledby":i,"aria-describedby":p,onClick:m=>m.stopPropagation()},React.createElement("h3",{id:i,className:"wb-share-consent__title"},s.title),s.lines.map((m,u)=>React.createElement("p",{key:u,id:`${c}-${u}`,className:"wb-share-consent__line"},m)),a?React.createElement("p",{className:"wb-share-consent__error",role:"alert"},a):null,React.createElement("div",{className:"wb-share-consent__actions"},React.createElement(k,{kind:"ghost",small:!0,className:"wb-share-consent__confirm",onClick:n,disabled:t},t?"Creating share link\u2026":"Create share link"),React.createElement(k,{kind:"ghost",small:!0,onClick:r,disabled:t},"Cancel"))))}function Bn({mode:e,receipt:t,onShared:a}){let[n,r]=d("idle"),[s,o]=d(""),[i,c]=d(""),p=D(null);if(!t)return null;let m=e==="paired"?"Share this two-question test":"Share this inspection",u=n==="consenting"||n==="creating",_=()=>{let v=p.current&&p.current.querySelector(".wb-reader-share__btn");v&&v.focus()};return React.createElement("div",{className:"wb-reader-share",ref:p},s&&(n==="ready"||n==="copied")?React.createElement("div",{className:"wb-reader-share__success",role:"status"},React.createElement("p",{className:"wb-reader-share__success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-share__url"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer"},s)),React.createElement("div",{className:"wb-reader-share__actions"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-share__open"},"Open share page"),React.createElement(k,{kind:"ghost",small:!0,className:n==="copied"?"is-copied":"",onClick:async()=>{if(s)try{await navigator.clipboard.writeText(s),r("copied"),setTimeout(()=>r("ready"),1600)}catch(v){c("Could not copy link. Select the link below and copy manually.")}}},n==="copied"?"Copied":"Copy share link"))):React.createElement(k,{kind:"ghost",small:!0,className:"wb-reader-share__btn",onClick:()=>{c(""),r("consenting")}},m),u?React.createElement(zs,{mode:e,busy:n==="creating",error:i,onConfirm:async()=>{r("creating"),c("");try{let v=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:t})}),S=await v.json().catch(()=>({}));if(!v.ok||!S.ok||!S.share_url){console.warn("[imbas] inspection-share failed",v.status,S&&S.error),c(js(v.status,S)),r("consenting");return}typeof a=="function"&&a(S.share_url),o(S.share_url),r("ready");try{await navigator.clipboard.writeText(S.share_url),r("copied"),setTimeout(()=>r("ready"),1600)}catch(I){}}catch(v){console.warn("[imbas] inspection-share network error",v),c("Could not create share link. Copy the full receipt for now."),r("consenting")}},onCancel:()=>{n!=="creating"&&(c(""),r("idle"),_())}}):null)}function Ys({result:e,context:t,shareUrl:a}){let[n,r]=d(!1),[s,o]=d(!1),[i,c]=d(""),p=_=>{_(!0),c(""),setTimeout(()=>_(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(k,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Mn(e)}

${fa(a)}`),p(r)}catch(_){c("Could not copy"),setTimeout(()=>c(""),2200)}}},n?"Copied":"Copy Result"),React.createElement(k,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Ws({...t,result:e})}

${fa(a)}`),p(o)}catch(_){c("Could not copy"),setTimeout(()=>c(""),2200)}}},s?"Copied":"Copy Full Receipt"),i?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},i):null)}function Qs({result:e,context:t,onRunAgain:a}){let[n,r]=d(""),s=(e==null?void 0:e.completeness)||"partial",o=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],i=((e==null?void 0:e.how_it_was_shaped)||"").trim(),c=((e==null?void 0:e.inspection_note)||"").trim(),p=(e==null?void 0:e.source)==="fallback",m=(e==null?void 0:e.source)==="agent",u=Fn({mode:t.mode,sel:t.sel,result:e}),_=p?[ha()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${s}${p?" is-fallback":""}${m?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},m?React.createElement("div",{className:`wb-reader-result__status is-${s}`},React.createElement("div",{className:`wb-reader-result__badge is-${s}`},Bs[s]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},_a[s])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),m?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},u)):null,p?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},Gs(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},p?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},_.length?_.map((h,l)=>React.createElement("p",{key:l},h)):React.createElement("p",null,p?ha():"No read returned."))),p?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What may be missing"),o.length?React.createElement("ul",{className:"wb-reader-result__list"},o.map((h,l)=>React.createElement("li",{key:l},h))):React.createElement("p",{className:"wb-reader-result__empty"},"No major gaps flagged in this answer.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},i||"No meaningful shaping detected."))),c?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},c)):null,!p&&m?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),a?React.createElement("div",{className:`wb-reader-result__footer${p?" is-fallback":""}`},m?React.createElement(React.Fragment,null,React.createElement(Ys,{result:e,context:t,shareUrl:n}),React.createElement(Bn,{mode:"single",receipt:e.receipt,onShared:r})):null,React.createElement(k,{kind:"ghost",small:!0,onClick:a,className:"wb-reader-result__rerun"},"Run again")):null)}var Ks={omission:"Candidate missing item",framing_drift:"Candidate framing issue",deflection:"Candidate deflection"};function va({receipt:e,formatter:t=ka,filePrefix:a="imbas-reader-receipt",onExport:n}){let[r,s]=d(!1),[o,i]=d(!1),[c,p]=d("");if(!e)return null;let m=l=>{l(!0),p(""),setTimeout(()=>l(!1),1800)},u=l=>{p(l),setTimeout(()=>p(""),2200)};return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions"},React.createElement(k,{kind:"ghost",small:!0,className:r?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2)),m(s),n&&n("json")}catch(l){u("Could not copy")}}},r?"Copied":"Copy JSON"),React.createElement(k,{kind:"ghost",small:!0,className:o?"is-copied":"",onClick:()=>{try{let l=t(e),f=new Blob([l],{type:"text/plain;charset=utf-8"}),E=URL.createObjectURL(f),N=document.createElement("a"),v=(e.generated_at||"").replace(/[:.]/g,"-");N.href=E,N.download=`${a}-${v||"run"}.txt`,document.body.appendChild(N),N.click(),N.remove(),setTimeout(()=>URL.revokeObjectURL(E),0),m(i),n&&n("receipt")}catch(l){u("Could not download receipt")}}},o?"Downloaded":"Download receipt"),c?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},c):null)}function Js({state:e,copy:t,firstText:a,secondText:n,smallPrint:r,run:s,check:o}){let[i,c]=d(!1),[p,m]=d(!1),[u,_]=d(""),h=S=>{S(!0),_(""),setTimeout(()=>S(!1),1800)},l=S=>{_(S),setTimeout(()=>_(""),2200)},f=()=>Vs({copy:t,firstText:a,secondText:n,smallPrint:r}),E=()=>O(C.CARD_EXPORTED,{run:s,state:e,check:o});return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions wb-card-export"},React.createElement("span",{className:"wb-card-export__label"},"Share what you saw"),React.createElement(k,{kind:"ghost",small:!0,className:i?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(f()),E(),h(c)}catch(S){l("Could not copy")}}},i?"Copied":"Copy card"),React.createElement(k,{kind:"ghost",small:!0,className:p?"is-copied":"",onClick:()=>{try{let S=new Blob([f()],{type:"text/plain;charset=utf-8"}),I=URL.createObjectURL(S),y=document.createElement("a");y.href=I,y.download=`imbas-inspection-card-${s||"run"}.txt`,document.body.appendChild(y),y.click(),y.remove(),setTimeout(()=>URL.revokeObjectURL(I),0),E(),h(m)}catch(S){l("Could not download card")}}},p?"Downloaded":"Download card"),u?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},u):null)}function Xs(e){let t=gt(e,"surfaced_candidate_items"),a=t.omission||0,n=t.framing_drift||0,r=t.deflection||0,s=[];return a&&s.push(`${a} candidate missing item${a===1?"":"s"}`),n&&s.push(`${n} candidate framing issue${n===1?"":"s"}`),r&&s.push(`${r} candidate deflection${r===1?"":"s"}`),s.length?`Reader found ${s.join(", ")}.`:"Reader found no candidate gaps in this answer. It read clean."}async function Zs(e,t,a,n){for(let r=0;r<2;r++){if(n.current!==a)return;try{let s=await fetch(Rs,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:e,value:t})});if(s.ok||s.status<500||r===1)return}catch(s){if(r===1)return}}}function Hn({mode:e,receipt:t}){let a=nn(e),[n,r]=d(null),s=D(0);if(!a||!t)return null;let o=i=>{if(!rn(e,i))return;r(i);let c=++s.current;Zs(t,i,c,s)};return React.createElement("div",{className:"wb-perception wb-scroll-anchor"},React.createElement("p",{className:"wb-perception__prompt"},a.prompt),React.createElement("div",{className:"wb-perception__options",role:"group","aria-label":a.prompt},a.options.map(i=>{let c=n===i.value;return React.createElement("button",{key:i.id,type:"button",className:`wb-focus wb-perception__option${c?" is-selected":""}`,"aria-pressed":c,onClick:()=>o(i.value)},i.label)})))}function eo({result:e}){let t=e==null?void 0:e.measurement;if(!t)return null;let a=e.result,n=(t.estimate_rationale||"").trim();return React.createElement("section",{className:"wb-reader-result is-agent wb-result-hero wb-scroll-anchor","aria-labelledby":"wb-result-hero-estimate"},React.createElement("p",{className:"wb-result-hero__eyebrow"},"Inspection result"),React.createElement("p",{id:"wb-result-hero-estimate",className:"wb-result-hero__estimate"},`${Pa(a,"surfaced_candidate_items")} surfaced`),React.createElement("p",{className:"wb-result-hero__summary"},Xs(a)),n?React.createElement("p",{className:"wb-result-hero__why"},n):null)}function to({result:e,context:t}){var m,u,_;if(!(e==null?void 0:e.measurement))return null;let n=(e==null?void 0:e.receipt)||null,r=e.result,s=et(r,"surfaced_findings").map($t),o=gt(r,"surfaced_findings"),i=((t==null?void 0:t.model)||"").trim()||(((m=n==null?void 0:n.open_run)==null?void 0:m.declared_model)||"").trim(),c=(n==null?void 0:n.generated_at)||((_=(u=n==null?void 0:n.open_run)==null?void 0:u.provenance)==null?void 0:_.run_timestamp)||"",p=[i?`Model: ${i}`:"Model: (not declared)"];return c&&p.push(c),React.createElement("section",{className:"wb-reader-result is-agent wb-measure wb-scroll-anchor","aria-labelledby":"wb-measure-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-measure-heading",className:"wb-reader-result__title"},"MEASUREMENT")),React.createElement("p",{className:"wb-reader-result__provenance wb-measure__meta"},p.join(" \xB7 ")),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-measure__findings"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Candidate findings"),React.createElement("p",{className:"wb-measure__counts"},`Missing item: ${o.omission||0} \xB7 Framing issue: ${o.framing_drift||0} \xB7 Deflection: ${o.deflection||0}`),s.length?React.createElement("ul",{className:"wb-measure__list"},s.map(h=>{let l=h.anchors.find(f=>f.role===fe&&f.status===bt.QUOTED);return React.createElement("li",{key:h.id,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},Ks[h.class_id]||h.class_display),(h.materiality||"").trim()?React.createElement("span",{className:"wb-measure__finding-why"},h.materiality.trim()):null,l?React.createElement("blockquote",{className:"wb-measure__anchor"},`"${l.quote}"`):null)})):React.createElement("p",{className:"wb-reader-result__empty"},"No candidate findings \u2014 the answer read clean."))),React.createElement("p",{className:"wb-measure__unvalidated"},"These are candidate observations from a single answer \u2014 inspection hypotheses, not validated classifications or evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},re),React.createElement(va,{receipt:n}))}var ao=[{key:"Omission",cls:"is-omission"},{key:"Framing Drift",cls:"is-framing"},{key:"Deflection",cls:"is-deflection"}];function no({counts:e}){let t=e||{},a=ao.map(r=>({...r,n:Number(t[r.key])||0}));return a.reduce((r,s)=>r+s.n,0)<=0?null:React.createElement("div",{className:"wb-xray","aria-hidden":"true"},a.filter(r=>r.n>0).map(r=>React.createElement("span",{key:r.key,className:`wb-xray__seg ${r.cls}`,style:{flexGrow:r.n}})))}var ro="The Reader's reading";function so(e){let t=gt(e,"probe_surfaced_differences"),a={};for(let[n,r]of Object.entries(ft))a[r]=t[n]||0;return a}function Cn(e,t){let a=e.anchors.find(n=>n.role===t&&n.status===bt.QUOTED);return a?a.quote:""}function oo(e){let t=(e||"").trim();return`The Reader measured this pair under ${t?`an earlier method (${t})`:"an earlier method"} that did not check quotations against the answers. Its readings are below. Its excerpts are withheld.`}function io({paired:e,pair:t,openReceipt:a,onReset:n,run:r,check:s,onTryCleaner:o}){let i=e.result||null,c=!i,p=c&&Array.isArray(e.delta_items)?e.delta_items:[],m=i?et(i,"probe_surfaced_differences").map($t).map(w=>({key:w.id,signal:w.class_display,reading:w.statement,openQuote:Cn(w,fe),probeQuote:Cn(w,ke)})):p.map((w,ee)=>({key:`legacy.${ee}`,signal:(w.signal_pattern||"").trim(),reading:(w.point||"").trim(),openQuote:"",probeQuote:""})),u=i?so(i):null,_=t&&t.capture,h=rt(_),l=La({gap_estimate:e.gap_estimate,signal_counts:u||{}}),[f,E]=d(l);B(()=>{O(C.LOOP_COMPLETED,{run:r,state:l,check:s,gap:e.gap_estimate,source:e.source,idempotent:e.idempotent})},[]);let N=w=>{w!==f&&(O(C.STATE_CORRECTED,{run:r,from_state:f,to_state:w,check:s}),E(w))},v=Ua(f,h),S=m[0]||{},I=(S.openQuote||"").trim()||nt,y=(S.probeQuote||"").trim()||nt,L=oo(e.paired_method_version),H=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first",key:"first"},React.createElement("span",{className:"wb-loop__panel-label"},yt),React.createElement("p",{className:"wb-loop__panel-body"},I)),M=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second",key:"second"},React.createElement("span",{className:"wb-loop__panel-label"},vt),React.createElement("p",{className:"wb-loop__panel-body"},y)),x=v.swapPanels?[M,H]:[H,M],te=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||r||"",j=e.receipt&&e.receipt.generated_at||"",X=j?String(j).slice(0,10):"",Z=[te?`Run ${te}`:"",X,$a].filter(Boolean).join(" \xB7 ");return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},"You already ran this pair. This is the analysis from that run."):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},"The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."):null,c?React.createElement("p",{className:"wb-act2__notice wb-act2__notice--legacy",role:"status"},L):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},v.headline),c?null:React.createElement("div",{className:"wb-loop__panels"},x),h?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},U.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},U.unmatched_warning)):null,v.tag?React.createElement("p",{className:"wb-loop__tag"},v.tag):null,f===at&&v.cta?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:n},v.cta)):null,f===Ue&&v.cta&&s===Fe&&o?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:o},v.cta)):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},"Read it differently?"),Mt.map(w=>React.createElement("button",{key:w,type:"button",className:`wb-loop__chip${w===f?" is-active":""}`,"aria-pressed":w===f,onClick:()=>N(w)},(qe[w]||{}).chip||w))),React.createElement("p",{className:"wb-loop__smallprint"},Z),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},re)),React.createElement("div",{className:"wb-measure__estimate wb-act2__estimate"},React.createElement("div",{className:"wb-measure__estimate-value"},e.gap_estimate_label),(e.estimate_rationale||"").trim()?React.createElement("p",{className:"wb-measure__estimate-why"},e.estimate_rationale.trim()):null),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"The delta"),u?React.createElement(no,{counts:u}):null,u?React.createElement("p",{className:"wb-measure__counts"},`Omission: ${u.Omission||0} \xB7 Framing Drift: ${u["Framing Drift"]||0} \xB7 Deflection: ${u.Deflection||0}`):null,m.length?React.createElement("ol",{className:"wb-measure__list"},m.map(w=>React.createElement("li",{key:w.key,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},w.signal),React.createElement("span",{className:"wb-act2__reading-label"},ro),React.createElement("p",{className:"wb-measure__finding-why wb-act2__reading"},w.reading),w.openQuote?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},"First answer"),`"${w.openQuote}"`):null,w.probeQuote?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},"Second answer"),`"${w.probeQuote}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},"No material gap. The direct question surfaced nothing decision-relevant the first answer left out."))),React.createElement(Wn,{pairRuns:[t],findings:m,conditionsMatched:_?_.conditions_matched:void 0}),React.createElement("p",{className:"wb-measure__unvalidated"},"This is a machine estimate over one answer pair. Not a human-scored result, not evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},re),c?null:React.createElement(Js,{state:f,copy:v,firstText:I,secondText:y,smallPrint:Z,run:te,check:s}),React.createElement(va,{receipt:e.receipt,formatter:Ca,filePrefix:"imbas-reader-paired-receipt"}),React.createElement(Gn,{result:{receipt:a},statuses:{},pair:t}),c?null:React.createElement(Bn,{mode:"paired",receipt:e.receipt}),React.createElement(Hn,{mode:"paired",receipt:e.receipt}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:n},"Test another answer")))}function co(e){let t=e&&e.info&&typeof e.info.message=="string"?e.info.message.trim():"";return t||"The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly."}function lo({openReceipt:e,run:t,check:a,onTryCleaner:n,onPairedChange:r,inputRef:s}){let[o,i]=d(""),[c,p]=d(!1),[m,u]=d(null),[_,h]=d(""),[l,f]=d(""),[E,N]=d(null),[v,S]=d(""),[I,y]=d(null);if(!e)return null;let L=!!o.trim(),H=Gt({same_model:E,model_version:v,edits:I}),M=e&&e.open_run||{},x=M.provenance&&M.provenance.reader_model_version||"",te={targeted_answer:o,targeted_prompt:m&&m.targeted_prompt||tt,targeted_prompt_hash:m&&m.receipt&&m.receipt.paired_analysis&&m.receipt.paired_analysis.targeted_prompt_hash||"",capture:H,targeted_source_model:{name:E===se.YES&&M.declared_model||"",version:v.trim()},inspector:{model:x,model_version:x,prompt_version:"2.0"}},j=w=>{i(w),_&&h(""),l&&f("")},X=()=>{u(null),i(""),h(""),f(""),N(null),S(""),y(null),r&&r(!1)},Z=async()=>{if(!c){if(!L){h("Paste the answer your AI gave the direct question.");return}h(""),f(""),p(!0),O(C.LOOP_RETURNED,{run:t,check:a});try{let w=await Ps(e,o);u(w),r&&r(!0)}catch(w){let ee=w&&w.info||{};w&&w.status===400&&ee.error==="too_long"?h("Answer is over 1200 words. Trim it and re-run."):w&&w.status===400&&ee.error==="empty"?h("That's too short to compare. Paste the full answer."):w&&w.status===400?f("This inspection can't run the two-question test. Re-run the answer above, then try again."):f(co(w))}finally{p(!1)}}};return m?React.createElement("div",{className:"wb-act2__test"},React.createElement(io,{paired:m,pair:te,openReceipt:e,onReset:X,run:t,check:a,onTryCleaner:n})):React.createElement("div",{className:"wb-act2__test"},React.createElement(Qe,{label:"Answer to the direct question",value:o,onChange:j,error:_,placeholder:"Paste what your AI came back with\u2026",minAckLength:1,inputRef:s}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},U.heading),React.createElement("p",{className:"wb-act2__capture-intro"},U.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},U.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[se.YES,se.NO,se.NOT_SURE].map(w=>React.createElement("button",{key:w,type:"button",className:`wb-act2__capture-opt${E===w?" is-active":""}`,"aria-pressed":E===w,onClick:()=>N(w)},U.same_model.options[w])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-pair-model"},U.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},U.model_version.hint),React.createElement("input",{id:"wb-pair-model",type:"text",className:"wb-act2__capture-input",value:v,maxLength:80,placeholder:U.model_version.placeholder,onChange:w=>S(w.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},U.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[pe.NONE,pe.EDITED].map(w=>React.createElement("button",{key:w,type:"button",className:`wb-act2__capture-opt${I===w?" is-active":""}`,"aria-pressed":I===w,onClick:()=>y(w)},U.edits.options[w])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},U.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(k,{kind:"primary",disabled:c||!L,onClick:Z,className:`wb-reader-cta${L&&!c?" is-armed":""}${c?" is-inspecting":""}`},c?"Comparing\u2026":"Compare the two answers")),l?React.createElement("p",{className:"wb-act2__run-error",role:"status"},l):null)}function uo({card:e,run:t,status:a,onStatus:n}){var _,h;let[r,s]=d(!1),[o,i]=d(""),c=D(!1),p=de.labels,m=async()=>{try{await navigator.clipboard.writeText(e.verification_question||""),s(!0),i(""),O(C.TARGET_QUESTION_COPIED,{run:t,check:e.finding_type}),setTimeout(()=>s(!1),1800)}catch(l){i("Could not copy"),setTimeout(()=>i(""),2200)}},u=l=>{l!==a&&(n(e.id,l),l==="resolved"&&!c.current&&(c.current=!0,O(C.LOOP_COMPLETED,{run:t,check:e.finding_type,state:"resolved"})))};return React.createElement("li",{className:`wb-check wb-check--${a}`},React.createElement("div",{className:"wb-check__head"},React.createElement("span",{className:"wb-check__family"},e.family),React.createElement("span",{className:"wb-check__detector"},e.detector_id),React.createElement("span",{className:"wb-check__finding"},e.finding_label),React.createElement("span",{className:"wb-check__provisional"},e.provisional_label)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},p.proposition),React.createElement("blockquote",{className:"wb-check__quote"},(_=e.proposition)==null?void 0:_.text)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},p.dependent),React.createElement("blockquote",{className:"wb-check__quote"},(h=e.dependent_output)==null?void 0:h.text)),React.createElement("p",{className:"wb-check__dependency"},React.createElement("span",{className:"wb-check__label"},p.dependency)," ",e.dependency_statement),React.createElement("div",{className:"wb-check__verify"},React.createElement("span",{className:"wb-check__label"},p.verification),React.createElement("p",{className:"wb-check__question"},e.verification_question),React.createElement("div",{className:"wb-check__actions"},React.createElement(k,{kind:"primary",small:!0,className:r?"is-copied":"",onClick:m},r?de.copied_affordance:de.copy_affordance),React.createElement("span",{className:"wb-check__resolver"},e.resolver_label),o?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},o):null)),React.createElement("div",{className:"wb-check__status",role:"group","aria-label":"Status"},React.createElement("span",{className:"wb-check__label"},p.status),["open","resolved","dismissed"].map(l=>React.createElement("button",{key:l,type:"button",className:`wb-check__status-opt${a===l?" is-active":""}`,"aria-pressed":a===l,onClick:()=>u(l)},de.status_labels[l]))))}function po({result:e}){var u,_,h;let t=e==null?void 0:e.checks,a=((h=(_=(u=e==null?void 0:e.receipt)==null?void 0:u.open_run)==null?void 0:_.provenance)==null?void 0:h.request_id)||"",[n,r]=d(!1),[s,o]=d({}),i=(l,f)=>o(E=>E[l]===f?E:{...E,[l]:f});if(!t||!Array.isArray(t.cards)||t.cards.length===0)return null;let c=t.default_top_n||3,p=t.cards.length>c,m=n?t.cards:t.cards.slice(0,c);return React.createElement("section",{className:"wb-reader-result is-agent wb-checks wb-scroll-anchor","aria-labelledby":"wb-checks-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-checks-heading",className:"wb-reader-result__title"},de.register_heading)),React.createElement("p",{className:"wb-checks__note"},de.register_note),p&&!n?React.createElement("p",{className:"wb-checks__eyebrow"},de.top_label):null,React.createElement("ul",{className:"wb-checks__list"},m.map(l=>React.createElement(uo,{key:l.id,card:l,run:a,status:s[l.id]||l.status||"open",onStatus:i}))),p?React.createElement("button",{type:"button",className:"wb-checks__more wb-focus",onClick:()=>r(l=>!l)},n?de.collapse_label:`${de.expand_label} (${t.cards.length})`):null,React.createElement(Gn,{result:e,statuses:s}),React.createElement("p",{className:"wb-reader-result__trust wb-checks__boundary"},re))}function Gn({result:e,statuses:t,pair:a=null}){let[n,r]=d(!1),[s,o]=d(""),i=D(!1);return React.createElement("div",{className:"wb-checks__export"},React.createElement(k,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{if(!i.current){i.current=!0;try{let p=await ln({result:e,checkStates:t,createdAt:new Date().toISOString(),pair:a}),m=new Blob([JSON.stringify(p,null,2)],{type:"application/json;charset=utf-8"}),u=URL.createObjectURL(m),_=document.createElement("a");_.href=u,_.download=dn(p),document.body.appendChild(_),_.click(),_.remove(),setTimeout(()=>URL.revokeObjectURL(u),0),o(""),r(!0),setTimeout(()=>r(!1),1800)}catch(p){o(pt.download_error),setTimeout(()=>o(""),2200)}finally{i.current=!1}}}},n?pt.downloaded_label:pt.action_label),React.createElement("span",{className:"wb-checks__export-hint"},pt.action_hint),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null)}function Wn({pairRuns:e=[],findings:t=[],conditionsMatched:a}){let{state_id:n,copy:r}=pn({pairRuns:e,findings:t,conditionsMatched:a});return React.createElement("section",{className:"wb-explain","data-state":n,"aria-label":r.heading},React.createElement("h3",{className:"wb-explain__heading"},r.heading),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.what),React.createElement("p",{className:"wb-explain__body"},r.what)),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.why),r.why.map((s,o)=>React.createElement("p",{key:o,className:"wb-explain__body"},s))),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},r.section_labels.next),React.createElement("p",{className:"wb-explain__body"},r.next)),React.createElement("p",{className:"wb-explain__boundary"},r.archive_boundary),React.createElement("p",{className:"wb-explain__method"},React.createElement("a",{className:"wb-explain__method-link",href:r.method_link.href},r.method_link.label," \u2192")))}function mo({result:e,open:t=!1,onOpen:a,onPairedChange:n,pairedInputRef:r}){var E,N,v,S,I;let s=e==null?void 0:e.act2,o=((v=(N=(E=e==null?void 0:e.receipt)==null?void 0:E.open_run)==null?void 0:N.provenance)==null?void 0:v.request_id)||"",i=((I=(S=e==null?void 0:e.receipt)==null?void 0:S.open_run)==null?void 0:I.question)||"",[c,p]=d(!1),[m,u]=d(""),[_,h]=d(Fe);if(B(()=>{!s||!s.eligible||(O(C.FOLLOW_UP_REVEALED,{run:o}),s.available||O(C.CAPACITY_DEGRADATION,{run:o,reason:s.degraded_reason||"spend_ceiling"}))},[o]),!s||!s.eligible)return null;let l=_===Me?Fa({question:i}):s.targeted_prompt||tt,f=async()=>{try{await navigator.clipboard.writeText(l),p(!0),u(""),O(C.TARGET_QUESTION_COPIED,{run:o,check:_}),a&&a(),setTimeout(()=>p(!1),1800)}catch(y){u("Could not copy"),setTimeout(()=>u(""),2200)}};return React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-scroll-anchor","aria-labelledby":"wb-act2-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-act2-heading",className:"wb-reader-result__title"},"THE TWO-QUESTION TEST")),React.createElement("p",{className:"wb-act2__offer"},Da),React.createElement("div",{className:"wb-act2__check",role:"group","aria-label":"How you'll run the second answer"},React.createElement("p",{className:"wb-act2__check-copy"},qa),React.createElement("div",{className:"wb-act2__check-opts"},React.createElement("button",{type:"button",className:`wb-act2__check-opt${_===Fe?" is-active":""}`,"aria-pressed":_===Fe,onClick:()=>h(Fe)},React.createElement("span",{className:"wb-act2__check-label"},Bt.label),React.createElement("span",{className:"wb-act2__check-hint"},Bt.hint)),React.createElement("button",{type:"button",className:`wb-act2__check-opt${_===Me?" is-active":""}`,"aria-pressed":_===Me,onClick:()=>h(Me)},React.createElement("span",{className:"wb-act2__check-label"},Ht.label),React.createElement("span",{className:"wb-act2__check-hint"},Ht.hint)))),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"What to run on your AI"},l),React.createElement("p",{className:"wb-act2__prompt-note"},"Generated from this Reader run. Any question shapes an answer \u2014 this one included."),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(k,{kind:"primary",className:c?"is-copied":"",onClick:f},c?"Copied \u2014 now ask your AI":"Ask your AI \u2192"),s.available&&!t?React.createElement(k,{kind:"ghost",onClick:a},"Paste what came back"):null,m?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},m):null),React.createElement("p",{className:"wb-act2__sub"},"Copy this question. Drop it in your chat. Paste what comes back."),s.available?t?React.createElement(lo,{key:_,openReceipt:e.receipt,run:o,check:_,onTryCleaner:()=>h(Me),onPairedChange:n,inputRef:r}):null:React.createElement("p",{className:"wb-act2__degraded",role:"status"},qt))}function _o({chip:e,entry:t,capture:a,onReset:n}){let r=Array.isArray(e.delta_items)?e.delta_items:[],s=rt(a),o=a.conditions_matched===!0?"matched":a.conditions_matched===!1?"unmatched":"unverified",i=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||"",c=Ha({delta_count:e.delta_count,conditions_matched:a.conditions_matched}),[p,m]=d(c);B(()=>{O(C.CHIP_PAIR_COMPLETED,{run:i,chip:t?t.id:"",instruction_version:t?t.instruction_version:"",state:c,conditions:o,source:e.source,idempotent:e.idempotent})},[]);let u=h=>{h!==p&&(O(C.STATE_CORRECTED,{run:i,from_state:p,to_state:h}),m(h))},_=zt[p]||{};return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},T.reveal.idempotent_notice):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},T.reveal.capture_uncertain_notice):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},_.headline),t?React.createElement("p",{className:"wb-chip__reason"},T.side_by_side.reason_prefix,t.approved_ui_label):null,React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first"},React.createElement("span",{className:"wb-loop__panel-label"},T.side_by_side.first_answer_caption)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},T.side_by_side.second_answer_caption))),s?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},U.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},U.unmatched_warning)):null,_.note?React.createElement("p",{className:"wb-loop__tag"},_.note):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},T.reveal.correct_label),Ba.map(h=>React.createElement("button",{key:h,type:"button",className:`wb-loop__chip${h===p?" is-active":""}`,"aria-pressed":h===p,onClick:()=>u(h)},(zt[h]||{}).chip||h)))),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},T.reveal.delta_heading),r.length?React.createElement("ol",{className:"wb-measure__list"},r.map((h,l)=>React.createElement("li",{key:l,className:"wb-measure__finding"},React.createElement("p",{className:"wb-measure__finding-why"},h.point),(h.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},T.reveal.first_side_label),`"${h.open_side.trim()}"`):null,(h.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},T.reveal.second_side_label),`"${h.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},T.reveal.empty_delta))),React.createElement("p",{className:"wb-chip__meaning"},T.meaning_panel_line),React.createElement("div",{className:"wb-reader-result__trust wb-chip__boundary",role:"note"},React.createElement("p",{className:"wb-chip__boundary-lock"},re),React.createElement("p",{className:"wb-chip__boundary-attr"},T.boundary)),React.createElement("div",{className:"wb-chip__pro-cue"},React.createElement("span",{className:"wb-chip__pro-line"},T.professional_cue.line),React.createElement("span",{className:"wb-chip__pro-link"},T.professional_cue.link)),React.createElement(va,{receipt:e.receipt,formatter:Ra,filePrefix:"imbas-reader-followup-receipt",onExport:()=>O(C.CARD_EXPORTED,{run:i,chip:t?t.id:"",instruction_version:t?t.instruction_version:""})}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(k,{kind:"ghost",small:!0,onClick:n},T.reveal.reset_label)))}function ho(){let[e,t]=d(""),[a,n]=d(""),[r,s]=d(""),[o,i]=d(null),[c,p]=d(""),[m,u]=d(null),[_,h]=d(!1),[l,f]=d(null),[E,N]=d(!1),[v,S]=d(""),[I,y]=d(""),[L,H]=d(""),M=D(!1);B(()=>{M.current||(M.current=!0,O(C.CHIP_ROW_RENDERED,{}))},[]);let x=Qt.find(g=>g.id===a)||null,te=Gt({same_model:o,model_version:c,edits:m}),j=!!x&&!!e.trim()&&!!r.trim(),X=()=>{I&&y(""),L&&H("")},Z=()=>{f(null),t(""),n(""),s(""),i(null),p(""),u(null),y(""),H(""),N(!1)},w=g=>{n(g.id),X(),O(C.CHIP_SELECTED,{chip:g.id,instruction_version:g.instruction_version})},ee=async()=>{if(x)try{await navigator.clipboard.writeText(x.instruction_text),N(!0),S(""),O(C.CHIP_INSTRUCTION_COPIED,{chip:x.id,instruction_version:x.instruction_version}),setTimeout(()=>N(!1),1800)}catch(g){S("Could not copy"),setTimeout(()=>S(""),2200)}},ae=async()=>{if(!_){if(!x){y(T.compose.chip_missing);return}if(!e.trim()){y(T.compose.first_answer_missing);return}if(!r.trim()){y(T.compose.second_answer_missing);return}y(""),H(""),h(!0),O(C.CHIP_PAIR_INITIATED,{chip:x.id,instruction_version:x.instruction_version});try{let g=await Ls({firstAnswer:e,targetedAnswer:r,chipId:x.id,instructionVersion:x.instruction_version});f(g)}catch(g){let z=g&&g.info||{};g&&g.status===400&&z.error==="too_long"?y(T.compose.too_long):g&&g.status===400&&z.error==="empty"?y(T.compose.too_short):g&&g.status===400&&z.error==="not_eligible"?H(T.compose.not_eligible):g&&g.status===400?H(T.compose.blocked):H(z&&z.message||T.compose.run_error)}finally{h(!1)}}},R=React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-chip-heading",className:"wb-reader-result__title"},T.value_statement.headline));return l?React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},R,React.createElement(_o,{chip:l,entry:x,capture:te,onReset:Z})):React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},R,React.createElement("p",{className:"wb-act2__offer"},T.value_statement.sub),React.createElement(Qe,{label:T.compose.first_answer_label,value:e,onChange:g=>{t(g),X()},placeholder:T.compose.first_answer_placeholder,minAckLength:1,readOnly:!!x}),x?React.createElement("div",{className:"wb-chip__edit-first"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:()=>n("")},`\u2190 ${T.compose.edit_first_answer}`)):null,React.createElement("div",{className:"wb-act2__capture wb-chip__choose",role:"group","aria-label":"Pick a follow-up"},React.createElement("p",{className:"wb-act2__capture-heading"},T.row_header),React.createElement("p",{className:"wb-act2__capture-intro"},T.row_support),React.createElement("div",{className:"wb-chip__row"},Qt.map(g=>React.createElement("button",{key:g.id,type:"button",className:`wb-loop__chip wb-chip__pick${g.id===a?" is-active":""}`,"aria-pressed":g.id===a,onClick:()=>w(g)},g.approved_ui_label)))),x?React.createElement("div",{className:"wb-chip__instruction"},React.createElement("p",{className:"wb-act2__prompt-note"},T.card.framing),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"Instruction to paste into your AI"},x.instruction_text),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(k,{kind:"primary",className:E?"is-copied":"",onClick:ee},E?T.compose.copy_done:T.compose.copy_label),v?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},v):null),React.createElement(Qe,{label:T.compose.second_answer_label,value:r,onChange:g=>{s(g),X()},placeholder:T.compose.second_answer_placeholder,minAckLength:1}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},U.heading),React.createElement("p",{className:"wb-act2__capture-intro"},U.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},U.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[se.YES,se.NO,se.NOT_SURE].map(g=>React.createElement("button",{key:g,type:"button",className:`wb-act2__capture-opt${o===g?" is-active":""}`,"aria-pressed":o===g,onClick:()=>i(g)},U.same_model.options[g])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-chip-model"},U.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},U.model_version.hint),React.createElement("input",{id:"wb-chip-model",type:"text",className:"wb-act2__capture-input",value:c,maxLength:80,placeholder:U.model_version.placeholder,onChange:g=>p(g.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},U.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[pe.NONE,pe.EDITED].map(g=>React.createElement("button",{key:g,type:"button",className:`wb-act2__capture-opt${m===g?" is-active":""}`,"aria-pressed":m===g,onClick:()=>u(g)},U.edits.options[g])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},U.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(k,{kind:"primary",disabled:_||!j,onClick:ae,className:`wb-reader-cta${j&&!_?" is-armed":""}${_?" is-inspecting":""}`},_?T.compose.comparing_label:T.compose.compare_label)),I?React.createElement("p",{className:"wb-act2__run-error",role:"status"},I):null,L?React.createElement("p",{className:"wb-act2__run-error",role:"status"},L):null):null,React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},T.boundary))}function fo({sel:e}){let[t,a]=d(!1),[n,r]=d("");if(!(e!=null&&e.ready))return null;let s=async()=>{try{await navigator.clipboard.writeText(e.openPrompt||""),a(!0),r(""),setTimeout(()=>a(!1),1800)}catch(o){r("Could not copy"),setTimeout(()=>r(""),2200)}};return React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},is(e),e.observedDate?` \xB7 Verified ${e.observedDate}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__signal wb-guided-trap"},React.createElement("p",{className:"wb-active-case__probe"},"Start with an ordinary question:"),React.createElement(ba,{text:e.openPrompt})),e.reveal?React.createElement("div",{className:"wb-readout__section wb-guided-reveal"},React.createElement("div",{className:"wb-active-case__headline"},e.reveal)):null,React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste what it says back")),React.createElement("div",{className:"wb-guided-copy"},React.createElement(k,{kind:"ghost",small:!0,className:t?"is-copied":"",onClick:s},t?"Copied":"Copy question"),n?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},n):null)))}function bo({mode:e,sel:t,onAnother:a}){let[n,r]=d(!1),[s,o]=d(""),i=e==="guided",c=i&&Ye.find(u=>u.ready&&u.id!==(t==null?void 0:t.id))||null,p=i&&((c==null?void 0:c.openPrompt)||(t==null?void 0:t.openPrompt))||"";return i&&!p?null:React.createElement("section",{className:"wb-reader-result is-agent wb-loop wb-scroll-anchor","aria-labelledby":"wb-loop-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-loop-heading",className:"wb-reader-result__title"},"TEST ANOTHER QUESTION")),i?React.createElement(React.Fragment,null,React.createElement("p",{className:"wb-loop__lead"},"Run the same check on a fresh question. Copy it, ask your AI, paste what it says back."),React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste the answer back")),React.createElement(ba,{text:p})):React.createElement("p",{className:"wb-loop__lead"},"Run the same check on another answer."),React.createElement("div",{className:"wb-loop__actions"},i?React.createElement(React.Fragment,null,React.createElement(k,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(p),r(!0),o(""),setTimeout(()=>r(!1),1800)}catch(u){o("Could not copy"),setTimeout(()=>o(""),2200)}}},n?"Copied":"Copy question"),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null):null,React.createElement(k,{kind:"primary",small:!0,onClick:()=>a(c)},"Test another question")))}function wo({onDismiss:e}){return React.createElement("section",{className:"wb-return","aria-label":"Welcome back"},React.createElement("div",{className:"wb-return__body"},React.createElement("p",{className:"wb-return__headline"},"Welcome back."),React.createElement("p",{className:"wb-return__text"},"You started a check here before. Paste an answer to run another and watch what it leaves out.")),React.createElement("button",{type:"button",className:"wb-return__dismiss",onClick:e,"aria-label":"Dismiss"},"\xD7"))}var go=["Paste an AI answer to see what it might be missing.","Copy the one question Imbas builds, then ask your own AI.","Paste its reply back and watch what surfaces."];function yo(){let[e]=d(()=>ta(wa())),t=e.loop_completion_rate,a=t==null?"\u2014":`${Math.round(t*100)}%`,n=e.counts||{},r=[["Runs started",n.run_started],["Runs completed",n.run_completed],["Results viewed",n.result_viewed],["Questions copied",n.target_question_copied],["Loops returned",n.loop_returned],["Loops completed",n.loop_completed],["States corrected",n.state_corrected],["Cards exported",n.card_exported],["Candidates submitted",n.candidate_submitted],["Return visits",n.return_visit]],s=e.completed_by_state||{},o=Object.keys(s).length>0;return React.createElement("section",{className:"wb-funnel","aria-label":"Reader funnel (this browser only)"},React.createElement("div",{className:"wb-funnel__head"},React.createElement("span",{className:"wb-funnel__eyebrow"},"Reader funnel \xB7 this browser only"),React.createElement("p",{className:"wb-funnel__northstar"},React.createElement("span",{className:"wb-funnel__northstar-num"},a),React.createElement("span",{className:"wb-funnel__northstar-label"},"of copied questions returned as completed loops"))),React.createElement("dl",{className:"wb-funnel__grid"},r.map(([i,c])=>React.createElement("div",{key:i,className:"wb-funnel__row"},React.createElement("dt",{className:"wb-funnel__label"},i),React.createElement("dd",{className:"wb-funnel__val"},c||0)))),o?React.createElement("div",{className:"wb-funnel__states"},React.createElement("span",{className:"wb-funnel__states-label"},"Completed by state"),React.createElement("ul",{className:"wb-funnel__states-list"},Mt.map(i=>s[i]?React.createElement("li",{key:i,className:"wb-funnel__states-item"},qe[i]&&qe[i].chip||i,": ",s[i]):null))):null,React.createElement("p",{className:"wb-funnel__note"},"[Content-minimal: ids, enums, counts only \u2014 never answer or question text. Stored in this browser, nothing leaves your device.]"))}var vo={context:"Public example \xB7 U.S. administrative law",question:"When a court reviews a federal agency's reading of an ambiguous statute, how much weight does the agency's interpretation get?",openAnswer:"Courts apply Chevron deference. If the statute is ambiguous, the court defers to the agency's interpretation as long as it's reasonable \u2014 the two-step framework from Chevron v. NRDC (1984).",leftOut:"Chevron was overruled. In Loper Bright Enterprises v. Raimondo (June 2024), the Supreme Court ended Chevron deference \u2014 courts now interpret ambiguous statutes themselves, de novo, without deferring to the agency.",targetedPrompt:tt,surfaced:"Chevron no longer governs. Loper Bright v. Raimondo (2024) overruled it; courts now decide a statute's meaning de novo under the Administrative Procedure Act. Governing source: Loper Bright Enterprises v. Raimondo, 603 U.S. 369 (2024).",tag:"That's the Volunteer Gap \u2014 the open answer left it out; the direct question surfaced it. Run your own answer to watch it live."};function No({onTryOwn:e,onClose:t}){let a=vo,n=(qe[$e]||{}).headline||"";return React.createElement("section",{className:"wb-demo","aria-labelledby":"wb-demo-heading"},React.createElement("div",{className:"wb-demo__head"},React.createElement("span",{className:"wb-demo__eyebrow"},"WORKED EXAMPLE"),React.createElement("h3",{id:"wb-demo-heading",className:"wb-demo__title"},"Watch the loop on one public example."),React.createElement("p",{className:"wb-demo__context"},a.context)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The question"),React.createElement("p",{className:"wb-demo__q"},a.question)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the AI said"),React.createElement("p",{className:"wb-demo__answer"},a.openAnswer)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"What the open answer left out"),React.createElement("p",{className:"wb-demo__leftout"},React.createElement("mark",{className:"wb-demo__mark"},a.leftOut))),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},"The direct question Imbas builds"),React.createElement("p",{className:"wb-act2__prompt wb-demo__prompt"},a.targetedPrompt)),React.createElement("div",{className:"wb-loop__reveal wb-demo__reveal"},React.createElement("p",{className:"wb-loop__headline"},n),React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel"},React.createElement("span",{className:"wb-loop__panel-label"},yt),React.createElement("p",{className:"wb-loop__panel-body wb-loop__panel-body--muted"},nt)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},vt),React.createElement("p",{className:"wb-loop__panel-body"},a.surfaced))),React.createElement("p",{className:"wb-loop__tag"},a.tag),React.createElement("p",{className:"wb-measure__boundary"},re),React.createElement("p",{className:"wb-demo__smallprint"},"[A canned demonstration on a public example. Not your run, not an Imbas case \u2014 nothing here was recorded.]")),React.createElement("div",{className:"wb-demo__cta-row"},React.createElement(k,{kind:"primary",small:!0,onClick:e},"Now try your own \u2192"),React.createElement("button",{type:"button",className:"wb-demo__close",onClick:t},"Hide example")))}function Eo(){let[e,t]=d("own"),[a,n]=d(Ye[0]),[r,s]=d(""),[o,i]=d(""),[c,p]=d(""),[m,u]=d(""),[_,h]=d(!1),[l,f]=d(null),[E,N]=d({}),[v,S]=d(!1),[I]=d(()=>ks()),[y,L]=d(!1),H=D(!1),[M,x]=d(()=>St(window.location).lane),[te,j]=d(()=>St(window.location).lane===be),[X,Z]=d(!1),[w,ee]=d(!1),ae=D(null),R=D(null),g=D(!1),z=D(Za()),ge=D(null),ye=D(null),le=D(Va),oe=D([]),Je=D(1),Se=D(null),_t=D(null),Ie=D(null),Tt=D(!1),Oe=D(null),Ae=!!(e==="guided"?a.openPrompt:r).trim(),Xe=!!o.trim(),Ze=Ae&&Xe,Pe=e==="own"&&Xe&&!Ae,ht=_?"inspecting":l?"result":Ze?"ready":Pe?"needQuestion":"idle",A=Zt({lane:M,busy:_,hasResult:!!l,hasAct2:!!(l&&l.act2),followUpOpen:X,hasDelta:w}),$=ea(A),ie=$.answerEntry==="compose-answer",ne=()=>{le.current=Kt};B(()=>{let b=ye.current,V=le.current;le.current=Xt,ye.current=A,Ya(b,A)&&(Je.current+=1,oe.current=[]);let ce=za(A,{from:b,cause:V,seen:oe.current});ce.emit&&(oe.current=oe.current.concat(A),O(C.STAGE_ENTERED,{stage:ce.stage,prior_stage:ce.prior_stage,cause:ce.cause,occurrence:Je.current,mode:e}))},[A]),B(()=>{let{stage:b}=St(window.location);Qa(b,{lane:M,busy:!1,hasResult:!1}).rewrite&&window.history.replaceState(null,"",window.location.pathname+window.location.search)},[]),B(()=>{if(!Tt.current){Tt.current=!0;return}let b=Ka(A);window.location.hash!==b&&window.history.replaceState(null,"",window.location.pathname+window.location.search+b)},[A]),B(()=>{l||(Z(!1),ee(!1))},[l]);let _e={"compose-answer":Se,"paired-answer":_t};B(()=>{let b=Oe.current;if(Oe.current=A,b===null||b===A)return;let V=(_e[$.focus]||Ie).current;V&&typeof V.focus=="function"&&V.focus({preventScroll:!0})},[A]),B(()=>{let b=()=>{window.location.hash==="#wb-reader-console"&&t("own")};return b(),window.addEventListener("hashchange",b),()=>window.removeEventListener("hashchange",b)},[]),B(()=>{if(!g.current){g.current=!0,mt();return}if(e!=="guided")return;let b=window.requestAnimationFrame(()=>xe(ae.current));return()=>window.cancelAnimationFrame(b)},[a.id,e]),B(()=>{let{state:b,scroll:V}=en(z.current,!!l);if(z.current=b,V&&R.current){let ce=window.requestAnimationFrame(()=>xe(R.current));return()=>window.cancelAnimationFrame(ce)}},[l]),B(()=>{if(!l){ge.current=null;return}let b=oa(l)||(l.source?`src:${l.source}`:"result");ge.current!==b&&(ge.current=b,O(C.RESULT_VIEWED,{run:oa(l),source:l.source||"agent"}))},[l]),B(()=>{let b=!1;try{b=sessionStorage.getItem("imbas_reader_session")==="1"}catch(De){}let V=wa();if(V.length===0)return;if(!b){O(C.RETURN_VISIT);try{sessionStorage.setItem("imbas_reader_session","1")}catch(De){}}let ce=ta(V),Ct=ce.counts.target_question_copied||0,Y=ce.counts.loop_completed||0;Ct>Y&&(O(C.RESTORED_SESSION,{}),S(!0))},[]);let G=b=>{b!==e&&(t(b),N({}),f(null),h(!1),x(ot),b==="own"&&i(""))},W=()=>{M!==be&&(ne(),j(!0),x(be))},Te=()=>x(ot),kt=()=>{X||(ne(),Z(!0))},Vn=b=>{b!==w&&(b&&ne(),ee(b))},jn=()=>{f(null),N({}),ae.current&&window.requestAnimationFrame(()=>xe(ae.current))},zn=()=>{L(!0),H.current||(H.current=!0,O(C.RUN_STARTED,{mode:"demo",source:"demo"}))},Yn=()=>{L(!1),e!=="own"&&G("own"),ae.current&&window.requestAnimationFrame(()=>xe(ae.current))},Qn=b=>{!b.ready||b.id===a.id||(n(b),i(""),f(null),N({}),h(!1))},Kn=b=>{f(null),N({}),h(!1),i(""),e==="guided"&&b&&n(b),ae.current&&window.requestAnimationFrame(()=>xe(ae.current))},Na=b=>{i(b),N(V=>({...V,answer:""})),l&&f(null)},Jn=b=>{s(b),N(V=>({...V,question:""})),l&&f(null)},Ea=async()=>{if(_)return;let b={},V=e==="guided"?a.openPrompt:r,ce=o;if(e==="own"&&!(V||"").trim()&&(b.question="Add the question you asked."),(ce||"").trim()||(b.answer="Paste an answer to run The Reader."),Object.keys(b).length){N(b);return}N({}),ne(),h(!0),f(null),O(C.RUN_STARTED,{mode:e});let Ct=Is({mode:e,sel:a,question:r,answer:ce,topic:c,model:m});try{let Y=await Os(Ct);le.current=Y.source==="fallback"?Et:Jt,f(Y);let De=oa(Y);if(O(C.RUN_COMPLETED,{run:De,mode:e,source:Y.source||"agent",eligible:!!(Y.act2&&Y.act2.eligible)}),Y.source==="fallback"){let Rt=qn(Y).toLowerCase();Ft(Rt)&&O(C.CAPACITY_DEGRADATION,{run:De,mode:e,reason:Rt}),Rt==="timeout"&&O(C.TIMEOUT,{run:De,mode:e,reason:"timeout"})}Y.capture_uncertain&&O(C.CAPTURE_UNCERTAIN,{run:De,mode:e})}catch(Y){Y&&Y.message==="too_long"?N({answer:"Answer is over 1200 words. Trim it and re-run."}):(le.current=Et,f({source:"fallback",completeness:"thin",the_read:ha(),what_was_left_out:[],how_it_was_shaped:"",reason:String(Y.message||"network")}),O(C.RUN_COMPLETED,{mode:e,source:"fallback",eligible:!1}),Y&&Y.message==="read_429"&&O(C.CAPACITY_DEGRADATION,{mode:e,reason:"capacity"}))}finally{h(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},v&&!l?React.createElement(wo,{onDismiss:()=>S(!1)}):null,$.pasteBox?React.createElement("div",{ref:ae,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>G("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>G("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with a measured case."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},Ye.map(b=>React.createElement("button",{key:b.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${b.id===a.id?" is-active":""}${b.ready?"":" is-disabled"}`,onClick:()=>Qn(b),disabled:!b.ready,title:b.title},b.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},cs(b)):React.createElement(Ee,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},b.cardShort||b.title)))),React.createElement(fo,{sel:a})):React.createElement("div",{className:"wb-reader-v2__own-header"},React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste an AI answer below. The Reader inspects what it might be missing.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(Ee,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(me,{label:"Which AI did you ask? (optional)"},React.createElement(la,{value:m,onChange:u}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Qe,{label:"AI answer received",value:o,onChange:Na,error:E.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1,readOnly:!ie,inputRef:Se}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(Qe,{label:"AI answer received",value:o,onChange:Na,error:E.answer,placeholder:"Paste an AI answer. Anything from ChatGPT, Gemini, Claude\u2026",minAckLength:1,readOnly:!ie,inputRef:Se})),Xe||Ae?React.createElement("div",{className:"wb-reader-v2__reveal"},React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(me,{label:"Question asked"},React.createElement("textarea",{className:we,value:r,onChange:b=>Jn(b.target.value),placeholder:"What did you ask the model?",rows:3,style:Ke,"aria-invalid":!!E.question,readOnly:!ie||void 0,"aria-readonly":!ie||void 0})),E.question?React.createElement("div",{className:"wb-field-error",role:"alert"},E.question):null,Pe&&!E.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(me,{label:"Optional topic / context"},React.createElement("input",{className:we,value:c,onChange:b=>p(b.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:Ke}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(me,{label:"Which AI did you ask? (optional)"},React.createElement(la,{value:m,onChange:u})))):null)),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":_},React.createElement(Hs,{state:ht}),React.createElement("details",{className:"wb-reader-v2__privacy"},React.createElement("summary",{className:"wb-reader-v2__privacy-line"},"Inspections aren't published to our reviewed archive. Don't paste anything sensitive."),React.createElement("p",{className:"wb-reader-v2__privacy-full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See ",React.createElement("a",{href:"/retention.html"},"what deletion means")," and the ",React.createElement("a",{href:"/privacy.html"},"privacy policy"),".")),l?null:React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(k,{kind:"primary",disabled:_||!Ze,onClick:Ea,className:`wb-reader-cta${Ze&&!_?" is-armed":""}${_?" is-inspecting":""}`},_?"Inspecting\u2026":"See what might be missing")))))):null,$.pasteBox?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-demo-trigger-row"},React.createElement("button",{type:"button",className:"wb-demo-trigger",onClick:y?()=>L(!1):zn,"aria-expanded":y},y?"Hide example":"New here? Watch a 20-second example \u2192")),y?React.createElement(No,{onTryOwn:Yn,onClose:()=>L(!1)}):null,React.createElement("details",{className:"wb-clarity"},React.createElement("summary",{className:"wb-clarity__summary"},"How it works"),React.createElement("ol",{className:"wb-clarity__steps"},go.map((b,V)=>React.createElement("li",{key:V,className:"wb-clarity__step"},React.createElement("span",{className:"wb-clarity__num","aria-hidden":"true"},V+1),React.createElement("span",{className:"wb-clarity__text"},b)))))):null,l?React.createElement("div",{ref:b=>{R.current=b,Ie.current=b},tabIndex:-1,className:"wb-reader-v2__result wb-scroll-anchor"},React.createElement("div",{className:"wb-reader-v2__result-nav"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:jn},"\u2190 Edit the answer")),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--hero"},React.createElement(eo,{result:l})):null,React.createElement("div",{className:"wb-reader-v2__follow"},React.createElement(Qs,{result:l,context:{mode:e,sel:a,question:r,answer:o,model:m,topic:c},onRunAgain:Ea})),l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--measure"},React.createElement(to,{result:l,context:{mode:e,sel:a,question:r,answer:o,model:m,topic:c}})):null,l.checks&&Array.isArray(l.checks.cards)&&l.checks.cards.length?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--checks"},React.createElement(po,{result:l})):null,l.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--meaning"},React.createElement(Wn,{pairRuns:[],findings:Ut(l.result,"surfaced_findings")})):null,l.measurement&&l.receipt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--perception"},React.createElement(Hn,{mode:"single",receipt:l.receipt})):null,l.act2?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--act2"},React.createElement(mo,{result:l,open:X,onOpen:kt,onPairedChange:Vn,pairedInputRef:_t})):null,$.loop?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--loop"},React.createElement(bo,{mode:e,sel:a,onAnother:Kn})):null,React.createElement("p",{className:"wb-reader-v2__post-privacy"},"This inspection wasn't published to our reviewed archive. See ",React.createElement("a",{href:"/retention.html"},"what deletion means"),".")):null,$.chipDoor?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--chip-door"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-chip-door",onClick:M===be?Te:W,"aria-expanded":M===be,"aria-controls":"wb-chip-lane"},M===be?"Hide follow-up checks":"Show follow-up checks")):null,te?React.createElement("div",{id:"wb-chip-lane",className:"wb-reader-v2__follow wb-reader-v2__follow--chips",hidden:!$.chipLane},React.createElement(ho,null)):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(Un,{variant:"reader-secondary"})),I?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--funnel"},React.createElement(yo,null)):null))}function So(){let e=D(null),[t]=d(()=>Ts());return B(()=>{mt();let a=()=>mt();return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),React.createElement("div",{className:`wb-shell${t?" wb-shell--reader-v2":""}`,style:{color:P.text,minHeight:"100vh",fontFamily:K}},React.createElement("style",null,Jr),React.createElement("style",null,Xr,Zr,es,ts,as),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:Ne,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:J,fontSize:11,letterSpacing:"0.18em",color:P.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:P.line,marginBottom:22}}),t?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"Check your AI answer."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped."),React.createElement(Eo,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.")),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:Ne,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:K,fontSize:16.5,lineHeight:1.6,color:P.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/case/005.html"},"View Case 005 ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Ms,null)),t?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:P.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:J,fontSize:11,color:P.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var Ao=ReactDOM.createRoot(document.getElementById("workbench-root"));Ao.render(React.createElement(So,null));})();
