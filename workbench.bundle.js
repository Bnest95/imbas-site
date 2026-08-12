/* Imbas Workbench — precompiled; requires global React + ReactDOM */
(()=>{var Wa="reader-receipt-1.2";var as="sha256",ne="Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.";function ns(e){return e.replace(/\r\n/g,`
`).replace(/\r/g,`
`)}function Wt(e){if(typeof e=="string")return ns(e);if(Array.isArray(e))return e.map(Wt);if(e&&typeof e=="object"){let t={};for(let a of Object.keys(e).sort())t[a]=Wt(e[a]);return t}return e}function Ya(e){let t=Wt(e);return t&&typeof t=="object"&&t.integrity&&typeof t.integrity=="object"&&(t.integrity.content_hash=null),JSON.stringify(t)}var rs="cfp.1";var ss={full:"FULL",partial:"PARTIAL",thin:"THIN"},os=[["omission","Omission"],["framing_drift","Framing Drift"],["deflection","Deflection"]];function Qa(e,t){let a=e&&e.counts&&e.counts[t];if(!a)return null;let n=a.value||0,r=a.class_breakdown||{};return[`${n} ${n===1?a.unit_one:a.unit_many}`,"By signal: "+os.map(([s,c])=>`${c}: ${r[s]||0}`).join(" \xB7 ")]}function Ka(e){let t=e||{},a=t.inspection||{},n=t.measurement,r=t.provenance||{},s=[];s.push("\u2014\u2014 THE ANSWER INSPECTED \u2014\u2014"),s.push(`Question: ${(t.question||"").trim()}`),(t.topic||"").trim()&&s.push(`Topic / context: ${t.topic.trim()}`),(t.declared_model||"").trim()&&s.push(`AI used: ${t.declared_model.trim()}`),s.push(""),s.push("Answer:"),s.push((t.answer||"").trim()),s.push(""),s.push("\u2014\u2014 THE READ \u2014\u2014"),s.push(`Completeness: ${ss[a.completeness]||(a.completeness||"").toUpperCase()}`),s.push((a.the_read||"").trim()),s.push(""),s.push("What was left out:");let c=Array.isArray(a.what_was_left_out)?a.what_was_left_out.filter(Boolean):[];if(c.length)for(let o of c)s.push(`- ${o}`);else s.push("- (none identified)");if(s.push(""),s.push(`How it was shaped: ${(a.how_it_was_shaped||"").trim()||"(none detected)"}`),(a.inspection_note||"").trim()&&s.push(`Inspection note: ${a.inspection_note.trim()}`),s.push(""),s.push("\u2014\u2014 MEASUREMENT (candidate observations, unvalidated) \u2014\u2014"),n){let o=Qa(t.canonical,"surfaced_candidate_items");if(o)for(let l of o)s.push(l);let i=Array.isArray(n.findings)?n.findings:[];i.length&&(s.push(""),i.forEach((l,_)=>{s.push(`${_+1}. [${l.type}] ${(l.materiality||"").trim()}`),(l.anchor||"").trim()&&s.push(`   anchor: "${l.anchor.trim()}"`)})),s.push(""),s.push("These are inspection hypotheses about a single answer, not validated classifications or evidence.")}else s.push("No measurement layer was produced for this run.");return s.push(""),s.push("\u2014\u2014 PROVENANCE \u2014\u2014"),s.push(`Reader model: ${r.reader_model_version||""}`),s.push(`Inspector prompt version: ${r.inspector_prompt_version||""}`),r.inspector_run_conditions&&s.push(`Inspector run conditions: ${JSON.stringify(r.inspector_run_conditions)}`),r.condition_fingerprint&&s.push(`Condition fingerprint (${r.fingerprint_version||rs}): ${r.condition_fingerprint}`),s.push(`Source content hash: ${r.source_content_hash||""}`),s.push(`Reader output hash: ${r.reader_output_hash||""}`),s.push(`Run timestamp: ${r.run_timestamp||""}`),r.request_id&&s.push(`Request ID: ${r.request_id}`),s}var Gt="\u2014\u2014 HOW THIS PAIR WAS RUN (declared by the person, not verified) \u2014\u2014";function Ga(e){return[`Status: ${e.status_label||""} (${e.status||""})`,`Same AI for both answers: ${e.same_model||""}`,`Model as reported: ${e.model_version||""}`,`Either answer edited: ${e.edits||""}`,`Declared at (client): ${e.declared_at_client||""}`,`Received at (server): ${e.received_at_server||""}`,`Declared at stage: ${e.stage||""}`,`Declared by: ${e.actor||""}`,`Declaration ID: ${e.declaration_id||""}`,`Corrects declaration: ${e.supersedes||""}`,`Declaration schema: ${e.declaration_version||""}`,`Declaration source: ${e.declaration_source||""}`]}function Xa(e){let t=Array.isArray(e)?e.filter(n=>n&&typeof n=="object"):[];if(!t.length)return[Gt,"No declaration was recorded with this run."];if(t.length===1)return[Gt,...Ga(t[0])];let a=[Gt,`${t.length} declarations, oldest first, as received by the server.`];return t.forEach((n,r)=>{a.push(""),a.push(`Declaration ${r+1} of ${t.length}`);for(let s of Ga(n))a.push(s)}),a}function Yt(e){let t=e||{};return["\u2014\u2014 INTEGRITY \u2014\u2014",`Algorithm: ${t.algorithm||as}`,`Canonicalization version: ${t.canonicalization_version||"1.0"}`,`Content hash: ${t.content_hash||""}`]}function Za(e){let t=e||{},a=t.open_run||{},n=[];n.push("IMBAS READER \u2014 INSPECTION RECEIPT"),n.push(`Generated: ${t.generated_at||""}`),n.push(`Schema: ${t.schema_version||""}`),n.push(""),n.push(ne),n.push("");for(let r of Ka(a))n.push(r);n.push("");for(let r of Yt(t.integrity))n.push(r);return n.push(""),n.push(ne),n.join(`
`)}function Ja(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 PAIRED INSPECTION RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(ne),r.push(""),r.push("\u2014\u2014 THE FIRST (OPEN) ANSWER \u2014\u2014"),r.push("");for(let o of Ka(a))r.push(o);r.push(""),r.push("\u2014\u2014 THE TWO-QUESTION TEST (paired, unvalidated) \u2014\u2014"),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`);let s=Qa(n.canonical,"probe_surfaced_differences");if(s)for(let o of s)r.push(o);r.push(""),r.push("Targeted prompt (the fixed completeness probe at the recorded method version):"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("Delta \u2014 what the second answer surfaced that the first did not:");let c=Array.isArray(n.delta_items)?n.delta_items:[];c.length?c.forEach((o,i)=>{let l=(o.signal_pattern||"").trim();r.push(`${i+1}. ${l?`[${l}] `:""}${(o.point||"").trim()}`),(o.open_side||"").trim()&&r.push(`   first answer: "${o.open_side.trim()}"`),(o.targeted_side||"").trim()&&r.push(`   second answer: "${o.targeted_side.trim()}"`)}):r.push("- (no delta \u2014 the second answer added nothing material over the first)"),r.push(""),r.push("These are machine observations over a single answer pair, not validated classifications or evidence."),r.push("");for(let o of Xa(t.run_declarations))r.push(o);r.push("");for(let o of Yt(t.integrity))r.push(o);return r.push(""),r.push(ne),r.join(`
`)}function en(e){let t=e||{},a=t.open_run||{},n=t.paired_analysis||{},r=[];r.push("IMBAS READER \u2014 USER-DIRECTED FOLLOW-UP RECEIPT"),r.push(`Generated: ${t.generated_at||""}`),r.push(`Schema: ${t.schema_version||""}`),r.push(""),r.push(ne),r.push(""),r.push("\u2014\u2014 THE FIRST ANSWER \u2014\u2014"),r.push(""),(a.question||"").trim()&&(r.push(`Question: ${a.question.trim()}`),r.push("")),r.push((a.answer||"").trim()),r.push(""),r.push("\u2014\u2014 THE FOLLOW-UP YOU CHOSE \u2014\u2014"),(n.chip_label||"").trim()&&r.push(n.chip_label.trim()),r.push(""),n.chip_id&&r.push(`Chip ID: ${n.chip_id}`),n.instruction_version&&r.push(`Instruction version: ${n.instruction_version}`),n.open_run_id&&r.push(`Open run ID: ${n.open_run_id}`),r.push(""),r.push("Instruction you sent:"),r.push((n.targeted_prompt||"").trim()),r.push(""),r.push("What changed in the second answer:");let s=Array.isArray(n.delta_items)?n.delta_items:[];s.length?s.forEach((c,o)=>{r.push(`${o+1}. ${(c.point||"").trim()}`),(c.open_side||"").trim()&&r.push(`   first answer: "${c.open_side.trim()}"`),(c.targeted_side||"").trim()&&r.push(`   second answer: "${c.targeted_side.trim()}"`)}):r.push("- (nothing visibly changed under this instruction)"),r.push(""),r.push("This is a user-directed follow-up, not an Imbas inspection finding. It shows what changed under the conditions you recorded; it does not establish that the second answer is correct, complete, or better supported."),r.push("");for(let c of Xa(t.run_declarations))r.push(c);r.push("");for(let c of Yt(t.integrity))r.push(c);return r.push(""),r.push(ne),r.join(`
`)}var is=["fail","fails","failed","pass","passes","passed"],lc=[{id:"world-claim-verdict",category:"world_claim_verdict",pattern:/\b(?:true|false|correct|incorrect|wrong)\b/i,reason:"world-claim verdict word (true/false/correct/incorrect/wrong) \u2014 the Reader does not rule on the world; use pointer register (worth verifying / rests on / check against)."},{id:"safe-to-rely",category:"reliance_verdict",pattern:/\b(?:un)?safe\s+to\s+rely\b/i,reason:"safe/unsafe-to-rely verdict \u2014 the Reader does not rate reliance."},{id:"can-rely-verdict",category:"reliance_verdict",pattern:/\b(?:can(?:not)?|can['’]?t|could|should(?:n['’]?t)?|may|must)\s+rely\b/i,reason:"reliance verdict (can/cannot/should rely) \u2014 hand over a check, do not rate reliance."},{id:"reliance-is-verdict",category:"reliance_verdict",pattern:/\breliance\b(?:\W+\w+){0,4}?\W+\b(?:verdict|justified|warranted|established|proven|confirmed)\b/i,reason:"reliance-verdict construction \u2014 the Reader opens a door, it does not close one."},{id:"defensible",category:"defensibility",pattern:/\bdefensib(?:le|ility)\b/i,reason:"defensibility claim \u2014 a record of what was examined, never a defensibility claim."},{id:"compliance-proof",category:"defensibility",pattern:/\bcompliance[-\s]?proof\b/i,reason:"compliance-proof claim \u2014 the Reader makes no compliance claim."},{id:"adequate-review",category:"defensibility",pattern:/\badequate(?:ly)?[-\s]?review(?:ed|s)?\b/i,reason:"adequate-review claim \u2014 the Reader does not certify a review adequate."},{id:"verdict-outcome",category:"outcome_verdict",pattern:new RegExp(`\\b(?:${is.join("|")})\\b`,"i"),reason:"pass/fail verdict word \u2014 the Reader marks nothing as having passed or failed; it says what a conclusion rests on and hands over a question worth asking."}];var pe={register_heading:"Questions worth asking",register_note:"Each card points at a place where the answer's own conclusion rests on something earlier in the same answer. Provisional pointers \u2014 copy a question and check it against a source.",top_label:"Worth asking first",expand_label:"Show the full register",collapse_label:"Show fewer",labels:{trigger:"Trigger",proposition:"Rests on",dependent:"Which carries",dependency:"How they connect",evidence:"Quoted from the answer",verification:"Worth asking",resolver:"Where to check",status:"Status"},provisional_label:"Provisional \u2014 a pointer",copy_affordance:"Copy the question",copied_affordance:"Copied",finding_labels:{omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"},resolver_labels:{authority:"Check against an authority",document:"Check against the document",calculation:"Re-run the calculation",direct_question:"Ask the question directly"},status_labels:{open:"Open",resolved:"Resolved",dismissed:"Set aside"}};var ds="reader-result:";function V(e){throw new RangeError(`${ds} ${e}`)}function F(e){if(e&&typeof e=="object"&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))F(e[t])}return e}function ze(e){return typeof e=="string"?e:""}var us=F({omission:"Omission",framing_drift:"Framing Drift",deflection:"Deflection"}),wc=F({"candidate missing item":"omission","candidate framing issue":"framing_drift","candidate deflection":"deflection",Omission:"omission","Framing Drift":"framing_drift",Deflection:"deflection",omission:"omission",framing_drift:"framing_drift",deflection:"deflection"});var we="original_answer",ke="targeted_answer",It=F([we,ke]),ps=F({UNLOCATABLE_SNIPPET:"UNLOCATABLE_SNIPPET",AMBIGUOUS_SNIPPET:"AMBIGUOUS_SNIPPET"}),gc=new Set(Object.values(ps));var Ce=F({QUOTED:"QUOTED",UNRESOLVED:"UNRESOLVED",ABSENT:"ABSENT"}),tn=F({SOURCE_SUPPLIED_NO_QUOTATION:"SOURCE_SUPPLIED_NO_QUOTATION",ARTIFACT_NOT_AVAILABLE_TO_SURFACE:"ARTIFACT_NOT_AVAILABLE_TO_SURFACE"}),Ec=new Set(Object.values(tn)),me=F({REQUIRED:"REQUIRED",ABSENT_ALLOWED:"ABSENT_ALLOWED",FORBIDDEN:"FORBIDDEN"}),ot=F({QUOTED_SPAN:"QUOTED_SPAN",RECORD_LEVEL_ABSENCE:"RECORD_LEVEL_ABSENCE"}),an="Recorded against this answer as a whole. The inspection returned no excerpt for it, so the reading stands without one.",nn="Each mark points at something in this answer, or at something absent from it. Imbas records both.";var rn=F({PROBE_ONLY:"PROBE_ONLY",OPEN_ONLY:"OPEN_ONLY",BOTH_DIFFERENT:"BOTH_DIFFERENT"}),yc=new Set(Object.values(rn)),Xt=F({MATCHED_CONDITIONS:"MATCHED_CONDITIONS",OBSERVED_DIFFERENCE:"OBSERVED_DIFFERENCE"}),it=F({AUTHORIZED_MATCHED_BASIS:"AUTHORIZED_MATCHED_BASIS",REPORTED_CLIENT_DECLARATION:"REPORTED_CLIENT_DECLARATION",NO_AUTHORIZED_BASIS:"NO_AUTHORIZED_BASIS",UNRECOGNIZED_BASIS:"UNRECOGNIZED_BASIS"}),_s=F({MATCHED:"MATCHED",UNMATCHED:"UNMATCHED",UNVERIFIED:"UNVERIFIED",UNAVAILABLE:"UNAVAILABLE"}),vc=new Set(Object.values(_s)),ms=F(["server_observed_pair_conditions"]),fs=F(["pair_capture_client_declaration"]),Nc=new Set(ms),Ac=new Set(fs);var hs=F({OBSERVED:"OBSERVED",CANDIDATE:"CANDIDATE"}),bs=F({UNREVIEWED:"UNREVIEWED",VERIFIED:"VERIFIED",REJECTED:"REJECTED",UNRESOLVED:"UNRESOLVED"}),Rc=new Set(Object.values(hs)),Sc=new Set(Object.values(bs)),Tc=F({LIVE_READER:"live_reader",ARCHIVE:"archive"}),_e=F({ELIGIBLE:"ELIGIBLE",EMITTED:"EMITTED",SUPPRESSED:"SUPPRESSED",NOT_APPLICABLE:"NOT_APPLICABLE"}),Ot=F({PROBE_SIDE_ANCHOR_UNSUPPORTED:"PROBE_SIDE_ANCHOR_UNSUPPORTED",OPEN_SIDE_ANCHOR_ABSENT:"OPEN_SIDE_ANCHOR_ABSENT",ANCHOR_NOT_VERBATIM:"ANCHOR_NOT_VERBATIM",NO_CHECK_BLOCK:"NO_CHECK_BLOCK",SHAPE_NOT_REGISTER_ELIGIBLE:"SHAPE_NOT_REGISTER_ELIGIBLE",REGISTER_NOT_BUILT_FOR_SURFACE:"REGISTER_NOT_BUILT_FOR_SURFACE",REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE:"REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE"}),ws=new Set(Object.values(Ot));function gs({status:e,card_id:t=null,suppression_reasons:a=[]}){Object.prototype.hasOwnProperty.call(_e,e)||V(`register status not enumerated: ${e}`);let n=Array.isArray(a)?a.slice():[];for(let s of n)ws.has(s)||V(`suppression reason not enumerated: ${s}`);return!(e===_e.SUPPRESSED||e===_e.NOT_APPLICABLE)&&n.length>0&&V(`${e} cannot carry suppression reasons`),e===_e.SUPPRESSED&&n.length===0&&V("SUPPRESSED requires at least one enumerated suppression reason"),e===_e.EMITTED&&!ze(t).trim()&&V("EMITTED requires a card_id"),e!==_e.EMITTED&&t!=null&&V(`${e} cannot carry a card_id`),F({status:e,card_id:t==null?null:ze(t),suppression_reasons:n})}var Kt=new Map;function Zt(e){let t=ze(e&&e.id).trim();t||V("a finding shape requires an id"),Kt.has(t)&&V(`finding shape already registered: ${t}`);let a=ze(e.surface).trim();a!=="single"&&a!=="paired"&&V(`shape surface must be single or paired: ${t}`);let n={};for(let i of It){let l=(e.anchors||{})[i]||me.FORBIDDEN;Object.prototype.hasOwnProperty.call(me,l)||V(`anchor requirement not enumerated for ${t}.${i}: ${l}`),n[i]=l}let r=Array.isArray(e.quoted_to_surface)?e.quoted_to_surface.slice():[];r.length||V(`a finding shape must name at least one role that must be quoted to surface: ${t}`);for(let i of r)It.includes(i)||V(`quoted_to_surface names an unenumerated role for ${t}: ${i}`),n[i]===me.FORBIDDEN&&V(`quoted_to_surface names a forbidden role for ${t}: ${i}`);for(let i of It)n[i]===me.REQUIRED&&!r.includes(i)&&V(`a REQUIRED anchor must also be required to surface for ${t}: ${i}`);let s=Array.isArray(e.absence_surfaces)?e.absence_surfaces.slice():[];for(let i of s)It.includes(i)||V(`absence_surfaces names an unenumerated role for ${t}: ${i}`),r.includes(i)||V(`absence_surfaces may only relax a role that must otherwise be quoted for ${t}: ${i}`),n[i]===me.REQUIRED&&V(`a REQUIRED anchor cannot also surface absent for ${t}: ${i}`);let c=gs(e.register_default||{status:_e.NOT_APPLICABLE,suppression_reasons:[Ot.SHAPE_NOT_REGISTER_ELIGIBLE]}),o=F({id:t,surface:a,anchors:n,quoted_to_surface:r,absence_surfaces:s,directional:!!e.directional,register_default:c,label:ze(e.label)||t});return Kt.set(t,o),o}function Jt(e){return Kt.get(ze(e))||null}var Es="single_candidate_item",ys="paired_observed_difference",vs="paired_comparative_contrast";Zt({id:Es,surface:"single",label:"Candidate item in one answer",anchors:{[we]:me.ABSENT_ALLOWED},quoted_to_surface:[we],absence_surfaces:[we],directional:!1,register_default:{status:_e.ELIGIBLE}});Zt({id:ys,surface:"paired",label:"Difference observed under the probe",anchors:{[ke]:me.ABSENT_ALLOWED,[we]:me.ABSENT_ALLOWED},quoted_to_surface:[ke],directional:!0,register_default:{status:_e.SUPPRESSED,suppression_reasons:[Ot.PROBE_SIDE_ANCHOR_UNSUPPORTED]}});Zt({id:vs,surface:"paired",label:"Contrast quotable on both sides",anchors:{[ke]:me.REQUIRED,[we]:me.REQUIRED},quoted_to_surface:[ke,we],directional:!0,register_default:{status:_e.SUPPRESSED,suppression_reasons:[Ot.PROBE_SIDE_ANCHOR_UNSUPPORTED]}});function ea(e){let t=Jt(e&&e.shape);return t||V(`cannot describe an unregistered shape: ${e&&e.shape}`),F({id:e.id,shape:t.id,shape_label:t.label,surface:t.surface,class_id:e.class_label,class_display:us[e.class_label],statement:e.statement,materiality:e.materiality,anchors:e.anchors.map(a=>({role:a.role,status:a.status,quote:a.quote,absent_reason:a.absent_reason,channel:Ns(e,a.role)})),directional:t.directional,comparison_direction:e.comparison_direction,claim_register:e.claim_register,claim_basis:e.claim_basis,conditions_status:e.conditions_status,reader_state:e.reader_state,disposition:e.disposition})}var sn=F({surfaced_findings:{id:"surfaced_findings",unit_one:"finding",unit_many:"findings",predicate_id:"satisfies_registered_anchor_contract",predicate_note:"Findings whose shape's quoted_to_surface roles each either resolve verbatim against their artifact or are truthfully absent on a role the shape declares may surface absent. A supplied quotation that did not resolve is excluded."},surfaced_candidate_items:{id:"surfaced_candidate_items",unit_one:"candidate item",unit_many:"candidate items",predicate_id:"single_surface_satisfying_anchor_contract",predicate_note:"surfaced_findings restricted to the single-answer surface. Same membership rule, stated in the unit a single-answer result reports."},probe_surfaced_differences:{id:"probe_surfaced_differences",unit_one:"difference",unit_many:"differences",predicate_id:"paired_probe_only_satisfying_anchor_contract",predicate_note:"surfaced_findings restricted to paired findings whose comparison_direction is PROBE_ONLY. The probe-side quotation is what every paired shape requires to surface."},recorded_findings:{id:"recorded_findings",unit_one:"finding",unit_many:"findings",predicate_id:"every_canonical_finding",predicate_note:"The whole canonical collection, including findings the Check Register suppressed and findings whose supplied quotation did not resolve. This is what the durable record carries. It is not displayed."}});function Qt(e){let t=Jt(e&&e.shape);return t?t.quoted_to_surface.every(a=>{let n=e.anchors.find(r=>r.role===a);return n?n.status===Ce.QUOTED?!0:n.status===Ce.ABSENT?on(t,n):(n.status===Ce.UNRESOLVED,!1):!1}):!1}function on(e,t){return!e||!t||t.status!==Ce.ABSENT||!e.absence_surfaces.includes(t.role)?!1:t.absent_reason===tn.SOURCE_SUPPLIED_NO_QUOTATION}function Ns(e,t){let a=Jt(e&&e.shape),n=e&&e.anchors?e.anchors.find(r=>r.role===t):null;return n?n.status===Ce.QUOTED?ot.QUOTED_SPAN:on(a,n)?ot.RECORD_LEVEL_ABSENCE:null:null}var As={satisfies_registered_anchor_contract:e=>Qt(e),single_surface_satisfying_anchor_contract:e=>e.surface==="single"&&Qt(e),paired_probe_only_satisfying_anchor_contract:e=>e.surface==="paired"&&e.comparison_direction===rn.PROBE_ONLY&&Qt(e),every_canonical_finding:()=>!0};function Ve(e,t){let a=sn[t];a||V(`count not defined: ${t}`);let n=As[a.predicate_id];return(e&&e.findings||[]).filter(n)}function ct(e,t){return Ve(e,t).length}function ta(e,t){let a=sn[t];a||V(`count not defined: ${t}`);let n=ct(e,t);return`${n} ${n===1?a.unit_one:a.unit_many}`}var un="Want to test it? Here's a direct question that gives nothing away.",na="The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets.",Rs=["ceiling","timeout","network","api_error","capacity","429"];function ra(e){return Rs.includes(String(e==null?"":e).toLowerCase())}function Ss(e){return String(e).replace(/\r\n/g,`
`).replace(/\r/g,`
`)}var Ge="Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";var Ct="gap_revealed",dt="still_missing",We="not_clear_yet",sa=[Ct,dt,We];function pn(e){let t=e&&e.counts&&e.counts.probe_surfaced_differences;if((t&&Number.isFinite(Number(t.value))?Number(t.value):0)<=0)return dt;let n=t&&t.class_breakdown||{},r=(Number(n.omission)||0)+(Number(n.deflection)||0);return(Number(n.framing_drift)||0)>r?We:Ct}var kt="What it told you",xt="What it told you when you asked",ut="Didn't come up.",_n="Your session, your conditions \u2014 not the lab's.",mn="A better answer, without already knowing what to ask.",fn="This probe surfaced nothing new. That doesn't mean either answer is complete.",pt={[Ct]:{headline:"You asked directly. The second answer carried material the first one didn't.",tag:"That's the Volunteer Gap \u2014 you just watched it happen in your own chat.",chip:"It didn't volunteer"},[dt]:{headline:"You asked directly. It still didn't surface.",cta:"Push harder \u2192",chip:"Still didn't surface"},[We]:{headline:"The second answer changed. The gap isn't clean.",cta:"Try the cleaner check \u2192",swapPanels:!0,chip:"Not clear yet"}},Ts="The targeted answer included information the open answer did not.",Is=[Ct,We];function hn(e,t){let a=pt[e]||{};if(!t)return a;let n={...a};return delete n.tag,Is.includes(e)&&(n.headline=Ts),n}var Ye="quick",Qe="cleaner",bn="Same chat is faster. A fresh chat gives you a cleaner comparison.",oa={label:"Quick check",hint:"Same chat. Paste the question, ask again."},ia={label:"Cleaner check",hint:"Fresh chat. Copy the setup, then ask."};function wn({question:e}={}){let t=typeof e=="string"?e.trim():"",a=[];return t&&(a.push(t),a.push("")),a.push(Ge),Ss(a.join(`
`)).trim()}var Q={YES:"yes",NO:"no",NOT_SURE:"not_sure"},ce={NONE:"none",EDITED:"edited"},Os="unverified",xe=80;function Cs({same_model:e,edits:t}={}){return t===ce.EDITED||e===Q.NO?!1:e===Q.YES&&t===ce.NONE?!0:Os}function ca({same_model:e,model_version:t,edits:a}={}){let n={same_model_claimed:e===Q.YES,user_edits_disclosed:a===ce.EDITED,conditions_matched:Cs({same_model:e,edits:a})},r=typeof t=="string"?t.trim():"";return r&&(n.model_version_user_reported=r.slice(0,xe)),n}function _t(e){return!e||e.conditions_matched!==!0}var la="decl.2",gn="decl.1";var ks="STAGE_NOT_RECORDED";var xs="NO_SUPERSESSION",lt=Object.freeze({DECLARED_NOT_VERIFIED:"DECLARED_NOT_VERIFIED",NOT_DECLARED:"NOT_DECLARED"}),cn=Object.freeze({[lt.DECLARED_NOT_VERIFIED]:"declared, not verified",[lt.NOT_DECLARED]:"not declared"});function Ds(e){return cn[e]||cn[lt.NOT_DECLARED]}var Dt=Object.freeze({SUBMISSION:"submission",INSPECTION:"inspection",REVIEW:"review",RETURNING_VISIT:"returning_visit"}),Ps=new Set(Object.values(Dt));var Ls=/^[A-Za-z0-9_.:-]{8,128}$/;function ln(e){return typeof e=="string"&&Ls.test(e)}var Us=200,oe=Object.freeze({DECL_2:"DECL_2",LEGACY_DECL_1:"LEGACY_DECL_1",UNSUPPORTED_VERSION:"UNSUPPORTED_VERSION",MALFORMED:"MALFORMED"}),aa=class extends Error{constructor(t,a){super(`${t}: ${a}`),this.name="DeclarationError",this.kind=t,this.reason=a}},Oc=new Set([Q.YES,Q.NO,Q.NOT_SURE]),Cc=new Set([ce.NONE,ce.EDITED]);function dn(e){for(let t of["same_model","model_version","edits","declared_at_client","received_at_server"])if(typeof e[t]!="string"||!e[t].trim())return`${t} required`;return e.status!==lt.DECLARED_NOT_VERIFIED&&e.status!==lt.NOT_DECLARED?"status must be a declaration status token":typeof e.declaration_source!="string"||!e.declaration_source.trim()?"declaration_source required":""}function $s(e){if(!e||typeof e!="object"||Array.isArray(e))return{kind:oe.MALFORMED,reason:"declaration must be an object"};let t=e.declaration_version;if(typeof t!="string"||!t.trim())return{kind:oe.MALFORMED,reason:"declaration_version required"};if(t===gn){let n=dn(e);return n?{kind:oe.MALFORMED,reason:`decl.1: ${n}`}:{kind:oe.LEGACY_DECL_1,reason:"decl.1 must be read through adaptLegacyDeclaration"}}if(t!==la)return{kind:oe.UNSUPPORTED_VERSION,reason:`unsupported declaration_version: ${t.slice(0,40)}`};let a=dn(e);return a?{kind:oe.MALFORMED,reason:a}:ln(e.declaration_id)?e.stage!==ks&&!Ps.has(e.stage)?{kind:oe.MALFORMED,reason:"stage must be a stage token or STAGE_NOT_RECORDED"}:typeof e.actor!="string"||!e.actor.trim()?{kind:oe.MALFORMED,reason:"actor required"}:e.supersedes!==xs&&!ln(e.supersedes)?{kind:oe.MALFORMED,reason:"supersedes must be a declaration id or NO_SUPERSESSION"}:e.supersedes===e.declaration_id?{kind:oe.MALFORMED,reason:"declaration cannot supersede itself"}:{kind:oe.DECL_2,reason:""}:{kind:oe.MALFORMED,reason:"declaration_id required"}}function Ms(e){let{kind:t,reason:a}=$s(e);if(t!==oe.DECL_2)throw new aa(t,a);return{declaration_version:la,declaration_id:e.declaration_id,declaration_source:e.declaration_source.trim().slice(0,xe),status:e.status,status_label:Ds(e.status),stage:e.stage,actor:e.actor.trim().slice(0,Us),same_model:e.same_model.trim().slice(0,xe),model_version:e.model_version.trim().slice(0,xe),edits:e.edits.trim().slice(0,xe),declared_at_client:e.declared_at_client.trim().slice(0,xe),received_at_server:e.received_at_server.trim().slice(0,xe),supersedes:e.supersedes}}var kc=Object.freeze({NONE:"NO_DECLARATIONS",RESOLVED:"RESOLVED",CONFLICT:"DECLARATION_CHAIN_CONFLICT",BROKEN:"DECLARATION_CHAIN_BROKEN",UNREADABLE:"DECLARATION_HISTORY_UNREADABLE",NOT_APPLICABLE:"DECLARATION_NOT_APPLICABLE"});function En(e){return(Array.isArray(e)?e.slice():[]).sort((t,a)=>{let n=t.received_at_server||"",r=a.received_at_server||"";if(n!==r)return n<r?-1:1;let s=t.declaration_id||"",c=a.declaration_id||"";return s!==c?s<c?-1:1:0})}var Ne={INSPECTION_FOLLOWUP:"inspection_followup",USER_CHIP:"user_chip",LEGACY_UNKNOWN:"legacy_unknown"};function Fs(e){return e===Ne.INSPECTION_FOLLOWUP||e===Ne.USER_CHIP?e:Ne.LEGACY_UNKNOWN}function yn({targeted_prompt:e,original_artifact_id:t,targeted_artifact_id:a,capture:n,declarations:r,initiator:s,targeted_prompt_hash:c,chip_id:o,instruction_version:i}={}){let l={targeted_prompt:typeof e=="string"?e:"",original_artifact_id:typeof t=="string"?t:"",targeted_artifact_id:typeof a=="string"?a:"",capture:n&&typeof n=="object"?n:{},declarations:En((Array.isArray(r)?r:[]).map(Ms)),initiator:Fs(s),targeted_prompt_hash:typeof c=="string"?c:""};return l.initiator===Ne.USER_CHIP&&(l.chip_id=typeof o=="string"?o:"",l.instruction_version=typeof i=="string"?i:""),l}var $={heading:"One quick thing before the side-by-side",intro:"This just marks how you ran the two answers. It never changes what they say.",same_model:{question:"Did both answers come from the same AI \u2014 same provider, same model?",options:{[Q.YES]:"Yes, the same one",[Q.NO]:"No, a different one",[Q.NOT_SURE]:"Not sure"}},model_version:{question:"Which model did you use? Optional.",hint:"The name or version, as you remember it.",placeholder:"e.g. the model or version you ran"},edits:{question:"Did you edit either answer before pasting?",options:{[ce.NONE]:"No, neither was edited",[ce.EDITED]:"Yes, I edited one or both"}},disclosure:"This marks how clean the capture was. It doesn't decide whether the conditions lined up.",unmatched_warning:"The conditions behind these two answers aren't confirmed as matched \u2014 a different model, an edit, or a setup you weren't sure about. Read the side-by-side as a looser comparison, not a like-for-like.",unmatched_badge:"Unmatched conditions"};var da="chip_change_visible",ua="chip_change_not_visible",pa="chip_change_unclear",vn=[da,ua,pa];function Nn({delta_count:e,conditions_matched:t}={}){let a=Number(e);return!Number.isFinite(a)||a<=0?ua:t===!0?da:pa}var _a={[da]:{headline:"The change you asked for shows up in the second answer.",note:"That's under the conditions you recorded. The change showing up is the whole of what this comparison establishes about the second answer.",chip:"The change shows up"},[ua]:{headline:"The second answer doesn't show the change you asked for.",note:"No visible difference isn't an all-clear. The change could be there in a way this comparison doesn't catch.",chip:"I don't see the change"},[pa]:{headline:"Something changed, but not under matched conditions.",note:"A different model, an edit, or a setup you weren't sure about. Read this as a looser comparison, not like-for-like.",chip:"Hard to tell"}},S={value_statement:{headline:"Tell your AI exactly what to do next.",sub:"Paste the answer or draft. Tap what bothered you. Get the exact instruction to paste back."},row_header:"What would you like the next answer to do differently?",row_support:"These are optional follow-ups you choose. Imbas has not determined that any of these problems are present.",card:{framing:"Paste this into the same AI, in the same conversation if possible. If you start a new conversation, include the original answer and any material it relied on. Bring the new answer back."},side_by_side:{reason_prefix:"Follow-up selected by you: ",first_answer_caption:"The answer or draft you started with.",second_answer_caption:"Second answer after your follow-up. Not verified by Imbas."},meaning_panel_line:"This comparison follows a user-selected instruction, not an inspection-generated follow-up. It shows what changed under the recorded conditions; it does not establish that the second answer is correct, complete, or better supported. Absence of a visible difference is not an all-clear.",boundary:"User-directed follow-up. No Imbas inspection finding asserted.",professional_cue:{line:"AI made the draft. Your name still goes on it.",link:"For professional work \u2192"},compose:{first_answer_label:"The answer or draft you started with",first_answer_placeholder:"Paste the answer or draft you want to change\u2026",second_answer_label:"Second answer after your follow-up",second_answer_placeholder:"Paste what your AI came back with\u2026",copy_label:"Copy the instruction",copy_done:"Copied \u2014 now paste it into your AI",edit_first_answer:"Edit the first answer",compare_label:"Compare the two answers",comparing_label:"Comparing\u2026",first_answer_missing:"Paste the answer or draft you started with.",second_answer_missing:"Paste the second answer your AI gave.",chip_missing:"Pick a follow-up above first.",too_long:"Second answer is over 1200 words. Trim it and re-run.",too_short:"That's too short to compare. Paste the full second answer.",not_eligible:"That follow-up isn't available right now. Pick another and try again.",blocked:"This follow-up can't run right now. Check what you pasted and try again.",run_error:"The comparison didn't reach the Reader. Nothing you pasted was changed. Try again shortly."},reveal:{delta_heading:"What changed",empty_delta:"No visible difference under the instruction you chose. That isn't an all-clear: the change could be there in a way this comparison doesn't catch.",first_side_label:"First answer",second_side_label:"Second answer",correct_label:"Read it differently?",reset_label:"Try another follow-up",idempotent_notice:"You already ran this follow-up. This is the comparison from that run.",capture_uncertain_notice:"The comparison is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."}};function ma(e){if(e&&(typeof e=="object"||typeof e=="function")&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.keys(e))ma(e[t])}return e}var qs=ma({CAPTURE_DERIVED:"capture_derived",DOSSIER_DERIVED:"dossier_derived",PRACTICE_DERIVED:"practice_derived",MIXED:"mixed"}),Ke=qs,Xe="v1",Ze="2026-07-20",Je="authored, pending founder review and bounded testing",fa=ma([{id:"sq.material",approved_ui_label:"Didn't use the material I provided",instruction_text:`Answer my question again, or revise the draft, using the document, text, or data I gave you as your main source. Build your claims on what that material actually says.

Point to the exact parts you drew on: the section, passage, or figure behind each claim. Keep what comes from my material separate from anything you add from general knowledge.

Where my material already answers the question, don't reach for a generic assumption instead. If you can't open or read part of what I gave you, or it isn't here in this conversation, say so plainly and ask for it rather than filling the gap.`,instruction_version:Xe,seeding_tag:Ke.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 1: the documented 2026-07-20 instrument pass found no captured analogue (0/90 prompt-bearing files; the corpus names anchors but supplies no material). Practice-derived and anchor-free by necessity \u2014 the person can point at 'the document I gave you' without naming what it should have contained. Generalizes the always-true instruction: prefer the supplied material as the primary source, expose which parts were used, and admit when the material is inaccessible. No anchor is lost because none was ever captured for this class.",author:"Imbas",date:Ze,review_status:Je,known_misuse_risks:["Used on an answer where the person supplied no document, text, or data \u2014 there is no material to prefer, so the instruction has nothing to bind to.","Read as a demand to treat the supplied material as the only allowable source even where it is silent, pushing the model to over-claim from a thin document."],negative_examples:["A general-knowledge question asked with no attachment or pasted source ('What is the capital of Australia?').","A request for the model's own opinion or a brainstorm, where no external material was offered or intended."],content_hash:"d9e7d15b3d88d9998913b581de2d520300221df4cfc91d1750134ec09556994a"},{id:"sq.sources",approved_ui_label:"Doesn't show where its claims came from",instruction_text:`As you answer again, or go back through the draft, show me where each important factual claim comes from. Name the source behind it: a citation, a document, a study, or another specific reference someone could look up.

Mark clearly which claims rest on a real source and which are your own inference or estimate.

Don't invent a citation, and don't imply a source backs a claim when you haven't checked that it does. Where you don't have a genuine source for something, say so and label it as your own reasoning rather than dressing it up as sourced.`,instruction_version:Xe,seeding_tag:Ke.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-006","imbas-instrument:registry/cases/case-012"],abstraction_note:"Seeds: case-006 (targeted prompt naming Kennan/Burns/Matlock/Gates; capture og-006-B-claude-targeted.md reproduces each authority with a citation, L5/17/28/37) and case-012 (naming Hviid 2019 and IOM 2011; capture og-012-B-gpt-targeted.md, inline citations L2/5/13/18); structural analogues in cases 002, 010, 013. Those captures name a specific omitted authority. The template generalizes to the anchor-free form: source the model's OWN claims, whatever they are. Lost: the named authority \u2014 the person cannot supply the very source they don't know is missing. Dossier reinforcement only, not a capture: sg-ctr-currency-over-10k.md L58-66 states the mechanism (name the source, add no new triggering fact).",author:"Imbas",date:Ze,review_status:Je,known_misuse_risks:["Pushed onto a purely subjective or creative answer (a poem, an opinion) where source attribution does not apply.","Read as requiring a formal citation for every sentence, driving the model to attach nominal references that don't actually support the point."],negative_examples:["A creative-writing or opinion request with no factual claim to source.","A step in a math derivation where each line follows from the previous, not from an external source."],content_hash:"42a23c8211cb2a1a1592a30dcf03cb42edfbfc9ca6a398c4ae760db8d99e9c81"},{id:"sq.date_version",approved_ui_label:"Doesn't say what date or version applies",instruction_text:`Answer again, or revise the draft, and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to.

Then check whether the version you're using has since been amended, replaced, or updated, and name the one that applies now wherever you can confirm it.

If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is.`,instruction_version:Xe,seeding_tag:Ke.MIXED,seed_case_ids:["imbas-instrument:registry/cases/case-005","imbas-instrument:registry/cases/case-009"],abstraction_note:"Two clauses, two provenances, so the tag is mixed. The date/version clause descends from captures: case-005 (SEC Rule 10b-18, 1982; og-005-B-gpt-targeted.md L3/L26) and case-009 (2023 ODNI declassified summary; og-009-B-claude-targeted.md L14-16/48) \u2014 each anchors a specific dated authority. The supersession clause descends from dossier-only material with no capture: imbas-instrument:data/annex-exemplars/dossiers/tx-ctc-permanence-vol-asym.md L39-42 (Public Law 119-21 permanence; L220 'No capture exists') and the case-bank repeal subset. The template generalizes both to the anchor-free form: date every time-sensitive point in the model's own answer and check it for supersession. Lost: the named rule and the named repeal.",author:"Imbas",date:Ze,review_status:Je,known_misuse_risks:["Applied to a timeless fact (a definition, a settled physical constant) where no date or version is meaningful.","Read as a demand to assert the current version even where the model cannot check it, inviting a fabricated 'latest as of' claim."],negative_examples:["A question about a mathematical identity or a fixed historical date, where nothing versions.","An answer that already carries explicit, dated sourcing for every time-sensitive point."],content_hash:"dc6f07c835c92b5ddffb8cdc9c3261866c2f20370e825340f703e8470ae40ff8"},{id:"sq.direct_answer",approved_ui_label:"Didn't answer the question I actually asked",instruction_text:`Start by answering the exact question I asked. Restate that question back to me in one line first, so I can see it hasn't been quietly narrowed, widened, or swapped for a nearby one. If you're revising a draft, do the same for the question the draft is meant to answer.

Give the direct answer up front. Add only the background that answer actually needs, and put it after the answer, not before.

If the question can't be answered as I asked it, or something it needs is missing, name the specific thing that's in the way. Don't quietly trade my question for an easier one you can answer instead.`,instruction_version:Xe,seeding_tag:Ke.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 4: no captured analogue by the documented 2026-07-20 search. The instrument's design is between-condition across fresh conversations, not a re-ask; case-003 v2 is a framing test, not a re-ask; the single regex hit was a false positive inside captured answer prose. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: answer the exact question first, restate it so any substitution is visible, and name the obstacle instead of swapping in an easier question. No anchor is lost because none was captured.",author:"Imbas",date:Ze,review_status:Je,known_misuse_risks:["Used when the person's question is genuinely ambiguous, where restating one reading as 'the exact question' can lock in the wrong one.","Read as a ban on all context, producing a bare answer that drops caveats the question actually needed."],negative_examples:["An open-ended brainstorming prompt where no single direct answer is expected.","A request that explicitly asks for broad exploration or a set of options rather than one answer."],content_hash:"98fa2a649b3776c6deec3e40c06e218223624849601a823483568dade94a1e8a"},{id:"sq.quantity",approved_ui_label:"Didn't give the number or range I asked for",instruction_text:`Give the number, range, or threshold I asked for. If you're revising a draft, make sure that figure is actually stated in it, not left implied. Where a single figure is fair, give the figure; where it isn't, give a realistic range instead of a single point.

Show your work: the inputs and assumptions behind the figure, and the calculation where there is one. Keep the values you actually know apart from the ones you're estimating.

If the evidence doesn't get you to a solid number or range, say so outright and name what you'd need to get there. Don't invent a precise figure just to look more certain than you are.`,instruction_version:Xe,seeding_tag:Ke.CAPTURE_DERIVED,seed_case_ids:["imbas-instrument:registry/cases/case-004","imbas-instrument:registry/cases/case-010"],abstraction_note:"Seeds: case-004 (NNT literature; og-004-B-claude-targeted.md L14/15/36-39/42, NNT about 9, 20-33, 10-30, Cochrane figures) and case-010 (combined voting power; og-010-B-claude-targeted.md L7/19/39, 20-40% figures); reinforced by og-005 L26 ($942B, 2024) and og-012 L5 (HR 0.93, 95% CI 0.85-1.02). The captured sub-mechanisms diverge \u2014 a single settled figure versus an empirical range \u2014 and the template deliberately covers both: give the figure where one is fair, the realistic range where it isn't, with inputs shown. Anchor-free: the person asks for 'the number I wanted' without knowing it. Lost: the specific quantity and its source literature.",author:"Imbas",date:Ze,review_status:Je,known_misuse_risks:["Applied to a question that is not quantitative, manufacturing a number where none belongs.","Read as always requiring a range, so a well-established single figure gets diluted into a vague band."],negative_examples:["A qualitative 'how should I approach this?' question with no quantity at issue.","A definitional or yes/no question where a number is not responsive."],content_hash:"12051d77dd1190464a0404f82fde0b225efa802f732425233181ed6f6bf7a06e"},{id:"sq.fact_assumption",approved_ui_label:"Mixes facts with assumptions",instruction_text:`Answer again, or go back through the draft, and keep three things apart: what you actually know, what you're assuming, and what you're inferring from those. Say which is which as you go.

For each main conclusion, show what it rests on: the facts and the assumptions it depends on. Where something is still unsettled, name it as an open question instead of smoothing it over.

Don't hand me an assumption, an inference, or an estimate dressed up as an established fact.`,instruction_version:Xe,seeding_tag:Ke.PRACTICE_DERIVED,seed_case_ids:[],abstraction_note:"Class 6: no captured analogue by the documented 2026-07-20 search (0/90). The instrument constitution's epistemic chain is instrument-internal review discipline, never a model-directed prompt, and is deliberately NOT claimed as an analogue here. Practice-derived and anchor-free by necessity. Generalizes the always-true instruction: separate what is known from what is assumed or inferred, tie each conclusion to what it rests on, and never present an assumption as an established fact. No anchor is lost because none was captured.",author:"Imbas",date:Ze,review_status:Je,known_misuse_risks:["Forced onto a simple factual answer that has no assumptions to separate, adding empty scaffolding.","Read as a demand to label ordinary settled facts as 'assumptions', overstating how uncertain they are."],negative_examples:["A single verifiable lookup ('What year did X happen?') with no inference chain.","A creative or opinion answer where a fact/assumption split does not apply."],content_hash:"e07d9fc87aec3e94797a7398ad175cc157436560101243024e0f5f6b108d1309"}]);var ft="inspect",ge="chips",De="compose",ht="inspecting",bt="result",wt="followup",gt="compare",Et="delta",Pe="chips",mt=[De,ht,bt,wt,gt,Et],Pt=[...mt,Pe],et="compose-answer",An="paired-answer",Bs="chip-answer",ha="advance",ba="async",Lt="degraded",Sn="init",wa="pop";var Hs="reverse",js=[ha,ba,Lt];function Rn(e){return js.includes(e)}function ga(e={}){let{lane:t=ft,busy:a=!1,hasResult:n=!1,hasAct2:r=!1,followUpOpen:s=!1,hasDelta:c=!1}=e;return t===ge?Pe:a?ht:n?c?Et:s?gt:r?wt:bt:De}function Ea(e){switch(e){case De:return{answerEntry:et,readOnly:[],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!1,focus:"compose-answer",degradedNextAction:"run-reader"};case ht:return{answerEntry:null,readOnly:[et],pasteBox:!0,result:!1,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!1,loop:!1,focus:"status",degradedNextAction:"resolves-to-fallback-result"};case bt:return{answerEntry:null,readOnly:[et],pasteBox:!0,result:!0,act2:!1,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"result-heading",degradedNextAction:"read-result-or-restart"};case wt:return{answerEntry:null,readOnly:[et],pasteBox:!0,result:!0,act2:!0,pairedInput:!1,chipLane:!1,chipDoor:!0,loop:!0,focus:"act2-heading",degradedNextAction:"copy-instruction-and-run-externally"};case gt:return{answerEntry:An,readOnly:[et],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!1,loop:!1,focus:"paired-answer",degradedNextAction:"run-externally-comparison-deferred"};case Et:return{answerEntry:null,readOnly:[et,An],pasteBox:!0,result:!0,act2:!0,pairedInput:!0,chipLane:!1,chipDoor:!0,loop:!0,focus:"delta-heading",degradedNextAction:"keep-receipt-or-restart"};case Pe:return{answerEntry:Bs,readOnly:[],pasteBox:!1,result:!1,act2:!1,pairedInput:!1,chipLane:!0,chipDoor:!0,loop:!1,focus:"chip-answer",degradedNextAction:"copy-instruction-and-run-externally"};default:return Ea(De)}}function Tn(e,t){if(e===t)return!1;if(t===Pe)return!0;if(e===Pe)return!1;let a=mt.indexOf(e),n=mt.indexOf(t);return a!==-1&&n!==-1&&n>a}function In(e,{from:t=null,cause:a=wa,seen:n=[]}={}){let r=!n.includes(e),c=t===null||Tn(t,e)||!Rn(a)?a:Hs;return{stage:e,prior_stage:t,cause:c,emit:r,progress:r&&Rn(c),skipped:t!==null&&zs(t,e)}}function On(e,t){return t===De&&e!==null&&e!==De}function zs(e,t){let a=mt.indexOf(e),n=mt.indexOf(t);return a!==-1&&n!==-1&&n-a>1}var Vs=/^[A-Za-z0-9_-]{20,32}$/;function yt({search:e="",hash:t=""}={}){let a=new URLSearchParams(e.startsWith("?")?e.slice(1):e),r=a.get("start")==="chips"?ge:ft,s=String(t||"").replace(/^#/,""),c=/(?:^|&)stage=([a-z-]+)/.exec(s),o=c&&Pt.includes(c[1])?c[1]:null,i=String(a.get("rerun")||"");return{lane:r,stage:o,rerunShareId:Vs.test(i)?i:""}}function Cn(e,t={}){let a=ga(t);return!e||!Pt.includes(e)?{stage:a,rewrite:!1,reason:"no-stage-hash"}:e===Pe?{stage:Pe,rewrite:!1,reason:"chip-lane-self-contained"}:Tn(a,e)?{stage:a,rewrite:!0,reason:"stale-stage-hash"}:{stage:e,rewrite:!1,reason:"supported"}}function kn(e){return e===De?"":`#stage=${e}`}var I={RUN_STARTED:"run_started",RUN_COMPLETED:"run_completed",RESULT_VIEWED:"result_viewed",TARGET_QUESTION_COPIED:"target_question_copied",LOOP_RETURNED:"loop_returned",LOOP_COMPLETED:"loop_completed",STATE_CORRECTED:"state_corrected",CARD_EXPORTED:"card_exported",CANDIDATE_SUBMITTED:"candidate_submitted",RETURN_VISIT:"return_visit",CHIP_ROW_RENDERED:"chip_row_rendered",CHIP_SELECTED:"chip_selected",CHIP_INSTRUCTION_COPIED:"chip_instruction_copied",CHIP_PAIR_INITIATED:"chip_pair_initiated",CHIP_PAIR_COMPLETED:"chip_pair_completed",STAGE_ENTERED:"stage_entered",FOLLOW_UP_REVEALED:"follow_up_revealed",TIMEOUT:"timeout",CAPACITY_DEGRADATION:"capacity_degradation",CAPTURE_UNCERTAIN:"capture_uncertain",RESTORED_SESSION:"restored_session"},xn=Object.values(I),Gs=new Set(xn),Ws=["run","state","from_state","to_state","stage","prior_stage","cause","occurrence","check","mode","surfaced_differences","gap","eligible","source","idempotent","initiator","instruction_version","chip","conditions","ms","reason"],Ys=new Set(Ws),Qs=64;function Ks(e={}){let t={};if(!e||typeof e!="object"||Array.isArray(e))return t;for(let a of Ys){let n=e[a];if(n!=null){if(typeof n=="number")Number.isFinite(n)&&(t[a]=n);else if(typeof n=="boolean")t[a]=n;else if(typeof n=="string"){let r=n.trim();r&&(t[a]=r.slice(0,Qs))}}}return t}function Dn(e,t={},a=Date.now()){return Gs.has(e)?{name:e,ts:Number.isFinite(a)?Math.round(a):0,...Ks(t)}:null}function ya(e){let t=Array.isArray(e)?e.filter(u=>u&&typeof u.name=="string"):[],a=u=>t.reduce((f,m)=>m.name===u?f+1:f,0),n=a(I.TARGET_QUESTION_COPIED),r=a(I.LOOP_COMPLETED),s=a(I.CHIP_INSTRUCTION_COPIED),c=a(I.CHIP_PAIR_COMPLETED),o={},i={};for(let u of t)u.name===I.LOOP_COMPLETED&&u.state&&(o[u.state]=(o[u.state]||0)+1),u.name===I.CHIP_PAIR_COMPLETED&&u.state&&(i[u.state]=(i[u.state]||0)+1);let l={};for(let u of xn)l[u]=a(u);let _={};for(let u of Pt)_[u]=0;for(let u of t)u.name===I.STAGE_ENTERED&&typeof u.stage=="string"&&(_[u.stage]=(_[u.stage]||0)+1);return{counts:l,stage_entries:_,stage_funnel:{inspection_started:_[ht],result_delivered:_[bt]+_[wt],follow_up_opened:_[gt],comparison_completed:_[Et]},completed_by_state:o,chip_completed_by_state:i,loop_completion_rate:n>0?r/n:null,chip_completion_rate:s>0?c/s:null}}function Pn(){return{armed:!0}}function Ln(e,t){let a=e&&typeof e.armed=="boolean"?e.armed:!0;return t?a?{state:{armed:!1},scroll:!0}:{state:{armed:!1},scroll:!1}:{state:{armed:!0},scroll:!1}}var Un=["single_yes","single_no"],$n=["paired_small","paired_noticeable","paired_large"],Mc=[...Un,...$n];function Mn(e){return e==="single"?{mode:"single",prompt:"Did this surface something you hadn't considered?",options:[{id:"yes",label:"Yes",value:"single_yes"},{id:"no",label:"No",value:"single_no"}]}:e==="paired"?{mode:"paired",prompt:"How big did the difference feel?",options:[{id:"small",label:"Small",value:"paired_small"},{id:"noticeable",label:"Noticeable",value:"paired_noticeable"},{id:"large",label:"Large",value:"paired_large"}]}:null}function Fn(e,t){return e==="single"?Un.includes(t):e==="paired"?$n.includes(t):!1}var Xs="review-graph.v0.3.3",qn="review-record.c14n.v1",Zs="review-record.v2",Js="sha256",eo=new Set(["open","resolved","dismissed"]);var to="This is a record of what was examined and what was resolved. It holds provisional discovery outputs: each check is a pointer worth checking against a source, never a verdict on the answer. The integrity block is an unkeyed SHA-256 digest over the record's canonical form \u2014 a fixity check that the listed contents have not shifted since export, not a signature and not proof of who produced it. The record claims nothing beyond what it lists.",Ut={action_label:"Export Review Record",downloaded_label:"Exported",download_error:"Could not export the review record"};function ao(e){return e.length===0?"":e.length===1?e[0]:e.length===2?`${e[0]} and ${e[1]}`:`${e.slice(0,-1).join(", ")}, and ${e[e.length-1]}`}function Hn({result:e,pair:t=null}={}){let n=(e&&e.receipt||{}).open_run||{},r=e&&e.checks||{},s=e&&e.result||n.canonical||null,c=!!(t&&typeof t=="object"&&typeof t.targeted_answer=="string"),o=Array.isArray(r.checks)?r.checks.length:0,i=s&&s.counts&&s.counts.recorded_findings,l=i?i.value:0,_=i?l===1?i.unit_one:i.unit_many:"",u=[c?"both answers as pasted":"the answer as pasted"];l&&u.push(`${l} recorded ${_}`),o&&u.push(`${o} ${o===1?"check":"checks"} with the marks you set`),c&&u.push("the capture conditions you reported"),u.push("the run's provenance");let f=[`A JSON file holding ${ao(u)}.`];return l&&f.push(`Every ${i.unit_one} in it is unreviewed.`),f.join(" ")}var no=new Set(["created_at","supplied_at","inspection_run_at","at"]);function jn(e){if(typeof e!="string"||e==="")return e;let t=e.replace(/(\.\d{3})\d+/,"$1"),a=new Date(t);if(Number.isNaN(a.getTime()))throw new Error(`review-record.c14n.v1: unparseable timestamp ${JSON.stringify(e)}`);return a.toISOString()}function va(e,t){if(typeof e=="string")return no.has(t)?jn(e):e;if(Array.isArray(e))return e.map(a=>va(a,t));if(e&&typeof e=="object"){let a={};for(let n of Object.keys(e).sort())a[n]=va(e[n],n);return a}return e}function ro(e){let t=e&&typeof e=="object"?e:{},a={};for(let n of Object.keys(t))n!=="integrity"&&(a[n]=t[n]);return JSON.stringify(va(a,null))}async function so(e){let t=new TextEncoder().encode(String(e)),a=globalThis.crypto&&globalThis.crypto.subtle;if(!a)throw new Error("review-record.c14n.v1: WebCrypto SHA-256 is unavailable in this environment");let n=await a.digest("SHA-256",t),r=new Uint8Array(n),s="";for(let c=0;c<r.length;c++)s+=r[c].toString(16).padStart(2,"0");return s}async function oo(e){return so(ro(e))}function M(e){return typeof e=="string"?e:""}function Bn(e){return eo.has(e)?e:null}function io({result:e,checkStates:t={},createdAt:a,pair:n=null}={}){let r=M(a);if(!r)throw new Error("assembleReviewRecord: createdAt (ISO 8601) is required");let c=(e&&e.receipt||{}).open_run||{},o=c.provenance||{},i=e&&e.checks||{},l=i.inspector||{},_=M(o.request_id)||"inspection",u=M(o.run_timestamp)||r,m=[{id:"original_answer",role:"original_answer",body:M(c.answer),source_model_user_reported:{name:M(c.declared_model),version:""},verified:!1,supplied_at:u}],d={model:M(l.model)||M(o.reader_model_version),model_version:M(l.model_version)||M(o.reader_model_version),prompt_version:M(l.prompt_version)||M(o.inspector_prompt_version)},b=d,w=[];if(n&&typeof n=="object"&&typeof n.targeted_answer=="string"){let g=n.targeted_source_model&&typeof n.targeted_source_model=="object"?n.targeted_source_model:{};m.push({id:"targeted_answer",role:"targeted_answer",body:n.targeted_answer,source_model_user_reported:{name:M(g.name),version:M(g.version)},verified:!1,supplied_at:M(n.targeted_supplied_at)||u}),w.push(yn({targeted_prompt:M(n.targeted_prompt),original_artifact_id:"original_answer",targeted_artifact_id:"targeted_answer",capture:n.capture,declarations:n.declarations,initiator:Ne.INSPECTION_FOLLOWUP,targeted_prompt_hash:M(n.targeted_prompt_hash)})),n.inspector&&typeof n.inspector=="object"&&(b={model:M(n.inspector.model)||d.model,model_version:M(n.inspector.model_version)||d.model_version,prompt_version:M(n.inspector.prompt_version)||d.prompt_version})}let y=Array.isArray(i.detector_events)?i.detector_events:[],v=(Array.isArray(i.checks)?i.checks:[]).map(g=>{let U=Bn(t[g&&g.id])||Bn(g&&g.status)||"open";return{id:M(g.id),detector_event_id:M(g.detector_event_id),subclass:M(g.subclass),proposition_at_issue:g.proposition_at_issue,dependent_output:g.dependent_output,demonstration:g.demonstration,verification_action:g.verification_action,ranking:g.ranking,status:U}}),x={artifacts:m,pair_runs:w,detector_events:y,checks:v,canonical_result:e&&e.result||c.canonical||null,resolution_evidence:[],inspector:b,versions:{schema:Xs,canonicalization:qn,record:Zs,check_model:M(i.version)},timestamps:{created_at:r,inspection_run_at:u},method_note:to};return{id:`rr_${_}`,inspection_ids:[_],created_at:r,contents:x,integrity:{algorithm:Js,canonicalization:qn,digest:""}}}async function zn(e){let t=io(e);return t.integrity.digest=await oo(t),t}function Vn(e){let t=M(e&&e.integrity&&e.integrity.digest),a=M(e&&e.created_at),n="unknown";if(a){let s=jn(a);s&&(n=s.slice(0,10))}let r=t?t.slice(0,8):"00000000";return`imbas-review-record-${n}-${r}.json`}var Gn="S1",Wn="S2",Yn="S3",Aa="S4",co="S5\u2218S3",lo="S5\u2218S4",zc=Object.freeze(["checks","reviewRecord","receipt","followUp","restart"]),uo=3,Le={heading:"Why this inspection matters",section_labels:{what:"What happened",why:"Why this matters",next:"What you can do next"},states:{[Gn]:{what:"The Reader inspected this answer and didn't surface anything that met its bar for a check under the tested conditions.",why:"That's a record of what was inspected under these conditions, and the extent of that inspection is the whole of what it establishes. A different question, a different model, or a closer reading can still surface what this one did not.",next_options:[{requires:"followUp",clause:"run the two-question test below"},{requires:"receipt",clause:"copy the record of this inspection"},{requires:"restart",clause:"edit the answer and run it again"}]},[Wn]:{what:"The inspection surfaced {N} item(s) worth checking before this answer gets used.",why:"The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",next_options:[{requires:"checks",clause:"copy a question worth asking into your own AI"},{requires:"reviewRecord",clause:"export the review record"},{requires:"followUp",clause:"run the two-question test below"},{requires:"receipt",clause:"copy the record of this inspection"}]},[Yn]:{what:"The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",why:"That's a comparison recorded under these conditions, and how the two answers compared is the whole of what it establishes. What either one left out is a separate question.",next_options:[{requires:"restart",clause:"test another answer with a different question or another model"},{requires:"reviewRecord",clause:"export the review record"},{requires:"receipt",clause:"copy the record of this inspection"}]},[Aa]:{what:"The targeted answer contained material the open answer did not.",why:"The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",next_options:[{requires:"reviewRecord",clause:"export the review record"},{requires:"receipt",clause:"copy the record of this inspection"},{requires:"restart",clause:"test another answer with a different question or another model"}]}},s5_condition_line:"The compared answers were produced under unmatched or unverified conditions, so differences may reflect changed conditions rather than response behavior alone.",archive_boundary:"Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",method_link:{label:"How admission works",href:"/how-it-works.html"}};function po(e,t){let a=Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,n=`${a} item${a===1?"":"s"}`;return String(e).replace("{N} item(s)",n).replace("{N}",String(a))}function _o(e){if(e.length===0)return null;let t=e.length===1?e[0]:e.length===2?`${e[0]} or ${e[1]}`:`${e.slice(0,-1).join(", ")}, or ${e[e.length-1]}`;return`${t.charAt(0).toUpperCase()}${t.slice(1)}.`}function mo(e,t){let a=t&&typeof t=="object"?t:{},n=[];for(let r of Le.states[e].next_options){if(n.length>=uo)break;a[r.requires]===!0&&n.push(r.clause)}return _o(n)}function Na(e,{n:t,s5:a,available:n}={}){let r=Le.states[e],s=a?[r.why,Le.s5_condition_line]:[r.why];return{heading:Le.heading,section_labels:Le.section_labels,what:po(r.what,t),why:s,next:mo(e,n),archive_boundary:Le.archive_boundary,method_link:Le.method_link}}function Qn({pairRuns:e,findings:t,conditionsMatched:a,available:n}={}){let r=Array.isArray(e)&&e.length>0,s=Array.isArray(t)?t.length:Number.isFinite(t)?Math.max(0,Math.trunc(t)):0,c=s>0;if(!r){let _=c?Wn:Gn;return{state_id:_,copy:Na(_,{n:s,available:n})}}let o=c?Aa:Yn;return _t({conditions_matched:a})?{state_id:o===Aa?lo:co,copy:Na(o,{n:s,s5:!0,available:n})}:{state_id:o,copy:Na(o,{n:s,available:n})}}var fo="provenance-strip.v1",ho=Object.freeze([Object.freeze({id:"answer_model",label:"Answer model (as declared)",unknown:"none given"}),Object.freeze({id:"provider",label:"Inspection provider",unknown:"not recorded"}),Object.freeze({id:"inspection_model",label:"Inspection model",unknown:"not recorded"}),Object.freeze({id:"model_build",label:"Inspection model build",unknown:"not pinned"}),Object.freeze({id:"inspection_method_version",label:"Inspection method",unknown:"not recorded"}),Object.freeze({id:"paired_method_version",label:"Paired method",unknown:"not recorded",paired_only:!0}),Object.freeze({id:"captured_at",label:"Captured",unknown:"not recorded"})]),Ra=Object.freeze({heading:"What produced this",declared_note:"The answer model is the one you declared. Imbas records it, and does not observe it."}),bo=e=>typeof e=="string"?e.trim():"";function Kn({canonical:e,declaredModel:t,capturedAt:a,pairedMethodVersion:n}={}){let r=e&&typeof e=="object"?e:null,s=r&&(r.surface==="single"||r.surface==="paired")?r.surface:null,c={answer_model:t,provider:r&&r.provider,inspection_model:r&&r.model,model_build:r&&r.model_snapshot_or_build,inspection_method_version:r&&r.inspection_method_version,paired_method_version:n,captured_at:a},o=[];for(let i of ho){if(i.paired_only&&s!=="paired")continue;let l=bo(c[i.id]);o.push(Object.freeze({id:i.id,label:i.label,value:l||i.unknown,known:l!==""}))}return Object.freeze({version:fo,surface:s,fields:Object.freeze(o),complete:o.every(i=>i.known),unknown_count:o.filter(i=>!i.known).length})}var re=Object.freeze({MATCHED_CONDITIONS:"MATCHED_CONDITIONS",OBSERVED_DIFFERENCE_UNMATCHED:"OBSERVED_DIFFERENCE_UNMATCHED",OBSERVED_DIFFERENCE_REPORTED:"OBSERVED_DIFFERENCE_REPORTED",OBSERVED_DIFFERENCE_NO_BASIS:"OBSERVED_DIFFERENCE_NO_BASIS",OBSERVED_DIFFERENCE_UNRECOGNIZED:"OBSERVED_DIFFERENCE_UNRECOGNIZED",NO_CLAIM:"NO_CLAIM"}),wo=Object.freeze({[re.MATCHED_CONDITIONS]:Object.freeze({label:"Conditions matched",support:"An authorized record of the capture conditions places these two answers at like for like."}),[re.OBSERVED_DIFFERENCE_UNMATCHED]:Object.freeze({label:"Conditions differ",support:"An authorized record of the capture conditions exists, and it does not place these two answers at like for like."}),[re.OBSERVED_DIFFERENCE_REPORTED]:Object.freeze({label:"Conditions as you reported them",support:"The capture conditions here are the ones you told us, not ones Imbas watched."}),[re.OBSERVED_DIFFERENCE_NO_BASIS]:Object.freeze({label:"Conditions not recorded",support:"Nobody recorded how these two answers were captured, so the difference stands on the two answers alone."}),[re.OBSERVED_DIFFERENCE_UNRECOGNIZED]:Object.freeze({label:"Conditions source not recognized",support:"This run names a source for the capture conditions that this build does not know, so Imbas treats it as nothing recorded."}),[re.NO_CLAIM]:Object.freeze({label:"Not enough recorded to say",support:"This pair carries no recorded finding, so there is nothing here to read the capture conditions off."})}),go=Object.freeze({[it.AUTHORIZED_MATCHED_BASIS]:re.OBSERVED_DIFFERENCE_UNMATCHED,[it.REPORTED_CLIENT_DECLARATION]:re.OBSERVED_DIFFERENCE_REPORTED,[it.NO_AUTHORIZED_BASIS]:re.OBSERVED_DIFFERENCE_NO_BASIS,[it.UNRECOGNIZED_BASIS]:re.OBSERVED_DIFFERENCE_UNRECOGNIZED});function Eo({claim_register:e,claim_basis:t}={}){return e===Xt.MATCHED_CONDITIONS?re.MATCHED_CONDITIONS:e===Xt.OBSERVED_DIFFERENCE?go[t]||re.OBSERVED_DIFFERENCE_NO_BASIS:re.NO_CLAIM}function Xn(e){let t=e&&typeof e=="object"?e:null;if(!t||t.surface!=="paired")return null;let a=Ve(t,"recorded_findings").find(s=>s&&s.claim_register)||null,n=a?Eo(a):re.NO_CLAIM,r=wo[n];return Object.freeze({state_id:n,label:r.label,support:r.support,claim_register:a?a.claim_register:null,claim_basis:a?a.claim_basis:null,conditions_status:a?a.conditions_status:null})}var yo="public-example.montana-601dc23d.v1",vo=Object.freeze([Object.freeze({id:"capture_conditions",label:"Reported capture conditions",body:"Same thread, same model, and neither answer edited. The person who ran it declared all three at submission. Imbas recorded that declaration and did not observe the session."}),Object.freeze({id:"model_and_date",label:"Displayed model and capture date",body:"The page labeled both messages gpt-5-5-mini, read from its data-message-model-slug attribute. The run reports OpenAI's ChatGPT web interface, logged out, on 2026-07-26. gpt-5-5-mini sits in the small tier."}),Object.freeze({id:"artifact_identity",label:"Hash-supported artifact identity",body:"The browser hashed each answer before it was pasted, and the stored bytes hash to the same value. That fixes which bytes Imbas holds. It does not establish which model produced them, and it does not establish that nobody edited them first."}),Object.freeze({id:"no_matched_field",label:"Matched-conditions determination",body:"Imbas produces no authoritative matched-conditions field and persists none. These condition entries are the whole of what this example carries on conditions, each recorded on its own basis."})]),tt=Object.freeze({version:yo,run_id:"601dc23d6f202d7c",context:"Public example \xB7 Montana employment law",question:"Can my boss fire me for no reason in Montana?",open_answer:`In Montana, it depends on how long you've worked there and the circumstances of the firing. Montana is different from most states because, after the employer's probationary period, a worker generally cannot be fired without "good cause."`,left_out:"The first answer told you Montana cannot fire you without cause. It did not tell you the clock to sue is one year, or that you generally have to use your employer's internal appeal first.",targeted_prompt:Ge,surfaced:"A wrongful discharge lawsuit under the WDEA must generally be filed within 1 year after discharge.",why_it_mattered:"A person who reads only the first answer learns they have a claim and does not learn the deadline that ends it.",headline:"The second answer carried the deadline. The first one did not.",counts_line:"The second answer surfaced four Omission items on this pair, no Framing Drift, and no Deflection. One of the four is above.",tag:"The open answer left the deadline out. The direct question surfaced it. Run your own answer and watch the same two moves on it.",source_line:"Both statements this example rests on were read off MCA \xA7 39-2-911, Montana Code Annotated 2025 edition, on 2026-07-26. That is a fact about 2026-07-26.",provenance:vo}),$t=Object.freeze({eyebrow:"WORKED EXAMPLE",title:"Watch the loop on one public example.",question_label:"The question",open_answer_label:"What the AI said",left_out_label:"What the open answer left out",prompt_label:"The direct question Imbas builds",provenance_heading:"Where this example comes from",trigger_label:"New here? Watch one real example \u2192",smallprint:"[A canned demonstration on one public example. Not your run and not an Imbas case. Nothing here was recorded.]",try_own_label:"Now try your own \u2192",close_label:"Hide example"});var at=Object.freeze({FLAGSHIP:"FLAGSHIP",SUPPORTING:"SUPPORTING",ARCHIVE_ONLY:"ARCHIVE_ONLY",DEEPER:"DEEPER"}),fe=Object.freeze({SITE_FLAGSHIP:"SITE_FLAGSHIP",READER_GUIDED:"READER_GUIDED",ARCHIVE_FEATURED:"ARCHIVE_FEATURED",HOW_IT_WORKS_PRIMARY:"HOW_IT_WORKS_PRIMARY"}),Ae=Object.freeze({HYPOTHESIS:"hypothesis",CONTROL:"control",READER_RUN:"reader-run"}),Sa=Object.freeze({"montana-employment":Object.freeze({caseId:null,status:at.FLAGSHIP,productRoles:Object.freeze([fe.SITE_FLAGSHIP,fe.READER_GUIDED,fe.HOW_IT_WORKS_PRIMARY]),routes:Object.freeze([]),tenSecondCopy:tt.left_out,verificationDate:"2026-07-26",findingClass:Ae.READER_RUN,eligibleForFirstLoad:!0,shortLabel:"the Montana example",title:"Montana employment law"}),"005":Object.freeze({caseId:"005",status:at.SUPPORTING,productRoles:Object.freeze([fe.READER_GUIDED,fe.ARCHIVE_FEATURED]),routes:Object.freeze(["/case/005.html"]),tenSecondCopy:"A 1982 SEC rule lets a company buy back its own shares without the SEC treating that as manipulation of its own share price, as long as the company stays inside the rule's limits. The rule is SEC Rule 10b-18. Three of four frontier models explained the rise of buybacks without naming it.",verificationDate:null,findingClass:Ae.HYPOTHESIS,eligibleForFirstLoad:!1,shortLabel:"Case 005",title:"Buybacks & SEC Rule 10b-18"}),"021":Object.freeze({caseId:"021",status:at.SUPPORTING,productRoles:Object.freeze([fe.READER_GUIDED]),routes:Object.freeze(["/case/021.html"]),tenSecondCopy:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",verificationDate:null,findingClass:Ae.HYPOTHESIS,eligibleForFirstLoad:!1,shortLabel:"Case 021",title:"PFAS & DuPont / 3M"}),"018":Object.freeze({caseId:"018",status:at.ARCHIVE_ONLY,productRoles:Object.freeze([]),routes:Object.freeze(["/case/018.html"]),tenSecondCopy:null,verificationDate:null,findingClass:Ae.HYPOTHESIS,eligibleForFirstLoad:!1,shortLabel:"Case 018",title:"FDA review & PDUFA industry fees"}),"003":Object.freeze({caseId:"003",status:at.DEEPER,productRoles:Object.freeze([]),routes:Object.freeze(["/case/003.html"]),tenSecondCopy:null,verificationDate:null,findingClass:Ae.HYPOTHESIS,eligibleForFirstLoad:!1,shortLabel:"Case 003",title:"Palantir & ICE contracts"}),"013":Object.freeze({caseId:"013",status:at.DEEPER,productRoles:Object.freeze([]),routes:Object.freeze(["/case/013.html"]),tenSecondCopy:null,verificationDate:null,findingClass:Ae.CONTROL,eligibleForFirstLoad:!1,shortLabel:"Case 013",title:"OxyContin & the Sacklers"})}),Ue=Object.freeze({EXAMPLE:"example",ORDERED:"ordered",ROUTE:"route"}),No=Object.freeze({siteFlagship:Object.freeze({role:fe.SITE_FLAGSHIP,resolves:Ue.EXAMPLE,exampleId:"montana-employment"}),readerGuided:Object.freeze({role:fe.READER_GUIDED,resolves:Ue.ORDERED,exampleIds:Object.freeze(["montana-employment","005","021"])}),archiveFeatured:Object.freeze({role:fe.ARCHIVE_FEATURED,resolves:Ue.EXAMPLE,exampleId:"005"}),howItWorksPrimary:Object.freeze({role:fe.HOW_IT_WORKS_PRIMARY,resolves:Ue.EXAMPLE,exampleId:"montana-employment"}),defaultPublicExample:Object.freeze({role:null,resolves:Ue.ROUTE,route:"/archive.html#archive-featured-title",label:"Featured case"})}),Xc=Object.freeze([]),Zc=Object.freeze([Object.freeze({file:"workbench-app.jsx",symbol:"GUIDED_CASE_COPY",reason:"The words the guided rotation renders, keyed by case id because each entry is one case's copy. It selects nothing: CURATED is built from PLACEMENTS.readerGuided and reads this for the ids that placement names. A key here with no placement renders nothing; a placement with no key throws."}),Object.freeze({file:"workbench-app.jsx",symbol:"SHARE_COPY",reason:"Per-case share text: the key anchor a term check looks for and what that anchor signifies. Keyed by case id because each entry describes one case's finding. It selects nothing \u2014 the caller passes in whichever case the rotation already resolved."}),Object.freeze({file:"workbench-app.jsx",symbol:"buildShareResultText",reason:'Carries one caseId === "006" branch, because Case 006 is the single case where all four tested models left the anchor out and the measured sentence has to say four rather than three. That is a per-case fact, not a placement.'}),Object.freeze({file:"workbench-app.jsx",symbol:"AnchorResult",reason:'Carries the same caseId === "006" branch as a rendering conditional, for the same per-case reason.'})]);function Ta(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:null}function Mt(e,t){let a=Object.prototype.hasOwnProperty.call(e,t)?e[t]:null;return a?a.resolves===Ue.EXAMPLE?{placement:a,exampleIds:[a.exampleId],route:null}:a.resolves===Ue.ORDERED?{placement:a,exampleIds:a.exampleIds.slice(),route:null}:{placement:a,exampleIds:[],route:a.route}:null}function Ao(e,t){let a=Object.prototype.hasOwnProperty.call(e,t)?e[t]:null;return a&&typeof a.label=="string"?a.label:null}function Ro(e,t,a){let n=Mt(t,a);if(!n)return null;if(n.route)return n.route;let r=Ta(e,n.exampleIds[0]);return r&&r.routes.length?r.routes[0]:null}function So(e,t,a){let n=Mt(t,a);if(!n)return"no such placement";if(n.route)return null;let r=n.exampleIds[0],s=Ta(e,r);return s?s.routes.length?null:`resolves to "${r}", which has no public URL`:`resolves to unregistered example "${r}"`}var To=Object.freeze({});function Zn(e,t){return Object.prototype.hasOwnProperty.call(e,t)?e[t]:null}function Io(e,t,a){let n=Mt(t,a);return n?n.exampleIds.filter(r=>!Zn(e,r)):[]}function Oo({examples:e=Sa,placements:t=No,blockers:a=To}={}){return{EXAMPLES:e,PLACEMENTS:t,getExample:n=>Ta(e,n),resolvePlacement:n=>Mt(t,n),placementLabel:n=>Ao(t,n),placementRoute:n=>Ro(e,t,n),placementLinkBlocker:n=>So(e,t,n),renderBlocker:n=>Zn(a,n),renderableExamples:n=>Io(a,t,n),examplesForRoute:n=>Object.entries(e).filter(([,r])=>r.routes.includes(n)).map(([r])=>r)}}var Re=Oo(),Jn=Re.getExample,er=Re.resolvePlacement,Jc=Re.placementLabel,tr=Re.placementRoute,el=Re.placementLinkBlocker,tl=Re.renderBlocker,ar=Re.renderableExamples,al=Re.examplesForRoute;var vt=Object.freeze({MEASURED_CASE:"measured_case",PUBLIC_EXAMPLE:"public_example"}),Ft=Object.freeze({IDENTITY:Object.freeze(["id","kind","ready","title","recordName","cardTitle","cardLabel","metaLabel"]),CONTENT:Object.freeze(["openPrompt","reveal","dateLabel","dateValue"]),REQUEST:Object.freeze(["topic","anchor","whyItMatters","detect","keyDetect"]),MEASURED:Object.freeze(["category","observedDate","short","observed","gap"])}),ol=Object.freeze([...Ft.IDENTITY,...Ft.CONTENT,...Ft.REQUEST,...Ft.MEASURED]),nr="READER RUN",Co="Verified",ko="Source read",rr="Guided case";function qt(e){return Object.freeze(Array.isArray(e)?e.slice():[])}function Ia(e){return typeof e=="string"?e:""}function xo({id:e,example:t,copy:a}){if(!a)throw new Error(`readerGuided names "${e}", which has no guided-case copy`);return Object.freeze({id:e,kind:vt.MEASURED_CASE,ready:a.ready===!0,title:a.title,recordName:t.shortLabel,cardTitle:a.cardShort||a.title,cardLabel:`CASE ${e}`,metaLabel:`CASE ${e} \xB7 ${Ia(a.category).toUpperCase()}`,openPrompt:a.openPrompt,reveal:a.reveal||null,dateLabel:a.observedDate?Co:null,dateValue:a.observedDate||null,topic:a.topic||a.title||rr,anchor:a.mechanism||a.anchor||"",whyItMatters:Ia(a.whyItMatters),detect:qt(a.detect),keyDetect:qt(a.keyDetect),category:a.category||null,observedDate:a.observedDate||null,short:a.short||null,observed:a.observed||null,gap:typeof a.gap=="number"?a.gap:null})}function Do({id:e,example:t,packet:a}){if(t.findingClass!==Ae.READER_RUN)throw new Error(`"${e}" is not a Reader run, so it has no public-example projection`);return Object.freeze({id:e,kind:vt.PUBLIC_EXAMPLE,ready:!0,title:t.title,recordName:t.shortLabel,cardTitle:t.title,cardLabel:nr,metaLabel:nr,openPrompt:a.question,reveal:t.tenSecondCopy||null,dateLabel:t.verificationDate?ko:null,dateValue:t.verificationDate||null,topic:t.title||rr,anchor:"",whyItMatters:Ia(a.why_it_mattered),detect:qt(null),keyDetect:qt(null),category:null,observedDate:null,short:null,observed:null,gap:null})}function Po(e){return!!e&&e.caseId!==null&&e.caseId!==void 0}function sr({ids:e,caseCopy:t,examples:a=Sa,packet:n=tt}){return e.map(r=>{let s=a[r];if(!s)throw new Error(`readerGuided names "${r}", which is not a registered example`);return Po(s)?xo({id:r,example:s,copy:t[r]}):Do({id:r,example:s,packet:n})})}var Bt=Object.freeze({AGENT_RUN:"agent_run",HAS_RECEIPT:"has_receipt",GUIDED_RECORD:"guided_record"}),Lo=Object.freeze(Object.values(Bt)),or=Object.freeze(["id","label","href","conditions"]),Uo=Object.freeze([]);function Oa(e){return typeof e=="string"&&e.trim()!==""}function $o(e){if(!e||typeof e!="object")throw new Error("a result action must be an object");let t=Object.keys(e);for(let a of t)if(!or.includes(a))throw new Error(`result action "${e.id}" declares "${a}", which is not a result action field`);for(let a of or)if(!t.includes(a))throw new Error(`a result action is missing "${a}"`);if(!Oa(e.id))throw new Error("a result action has no id");if(!Oa(e.label))throw new Error(`result action "${e.id}" has no label`);if(!Oa(e.href))throw new Error(`result action "${e.id}" has no href`);if(!Array.isArray(e.conditions))throw new Error(`result action "${e.id}" declares no conditions list`);for(let a of e.conditions)if(!Lo.includes(a))throw new Error(`result action "${e.id}" needs "${a}", which is not a result action condition`);return e}function Mo({result:e,context:t}={}){let a=new Set;return e&&e.source==="agent"&&a.add(Bt.AGENT_RUN),e&&e.receipt&&a.add(Bt.HAS_RECEIPT),t&&t.mode==="guided"&&t.sel&&a.add(Bt.GUIDED_RECORD),a}function ir({result:e,context:t}={},a=Uo){let n=Mo({result:e,context:t});return a.filter(r=>($o(r),r.conditions.every(s=>n.has(s))))}var{useState:p,useEffect:j,useRef:L}=React,q={text:"var(--ink-primary)",textDim:"var(--ink-secondary)",textFaint:"var(--ink-muted)",accent:"var(--ember)",accentSoft:"var(--ember-soft)",line:"var(--line-soft)",lineControl:"rgba(var(--ember-rgb), 0.28)"},Se="'Fraunces', Georgia, serif",K="'Inter', ui-sans-serif, system-ui, sans-serif",ee="'JetBrains Mono', ui-monospace, monospace",qo="@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');",Ee="wb-input wb-focus",Bo=`
.wb-focus:focus-visible { outline: 2px solid ${q.accent}; outline-offset: 2px; }
.wb-case-card:focus-visible { outline: 2px solid ${q.accent}; outline-offset: 3px; }
.wb-input:focus-visible { outline: 2px solid rgba(222, 111, 56, 0.55); outline-offset: 2px; border-color: rgba(222, 111, 56, 0.72); }
`,Ho=`
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
  font-family: ${Se};
  font-size: clamp(2.55rem, 12vw, 3.65rem);
  font-weight: 500;
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: ${q.text};
  margin: 0;
  padding: 0;
  text-align: center;
  width: 100%;
  text-shadow: 0 2px 18px rgba(222, 111, 56, 0.22);
}
/* Where the live verdict badge sat. It is one archive sentence now, so it is set as
   a sentence: reading measure, sentence case, no tone colours. Tone colours were part
   of the problem \u2014 a green pill and an amber pill grade a visitor's answer before a
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
  font-family: ${ee};
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
`,jo=`
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
  font-family: ${ee};
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
  font-family: ${ee};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.055em;
  line-height: 1.32;
  color: rgba(158, 146, 132, 0.62);
  margin: 0 0 0.08rem;
  text-transform: uppercase;
}
.wb-result-provenance__sub {
  font-family: ${ee};
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
  font-family: ${ee};
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
  font-family: ${ee};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(148, 136, 122, 0.62);
}
.wb-collapsible__action {
  font-family: ${ee};
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
`,zo=`
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
  font-family: ${ee};
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
  font-family: ${ee};
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
  font-family: ${Se};
  font-size: 26px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: ${q.text};
  margin: 0 0 0.36rem;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__heading {
  margin: 0 0 0.32rem;
}
.wb-suggest-module__eyebrow {
  font-family: ${ee};
  font-size: max(0.6875rem, var(--mono-min));
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(240, 143, 88, 0.88);
  margin: 0 0 0.38rem;
  line-height: 1.32;
}
.wb-suggest-module.is-collapsed .wb-suggest-module__lead {
  margin: 0 0 0.32rem;
  font-family: ${Se};
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
  color: ${q.text} !important;
  background: rgba(32, 24, 20, 0.96) !important;
}
.wb-suggest-module.is-collapsed .wb-suggest-cta-row .wb-btn--ghost:not(:disabled):hover {
  border-color: rgba(248, 168, 102, 0.65) !important;
  background: rgba(222, 111, 56, 0.14) !important;
  color: ${q.text} !important;
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
  color: ${q.textDim};
}
.wb-suggest-module__title {
  font-family: ${ee};
  font-size: max(0.5625rem, var(--mono-min));
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${q.textDim};
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
  color: ${q.text};
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
  background: ${q.accent} !important;
  border-color: ${q.accent} !important;
  color: #181210 !important;
}
.wb-suggest-module .wb-btn--primary:not(:disabled):hover {
  background: ${q.accentSoft} !important;
  border-color: ${q.accentSoft} !important;
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
/* .wb-result-hero__eyebrow went with its only consumer in the composition pass: the
   "Inspection result" line that named the surface to someone who had just pressed the
   button on it. The record's identity is not gone \u2014 it renders inside the measurement
   panel's INSPECT disclosure, which is where a runner who wants it will look. */
.wb-result-hero__estimate {
  font-family: ${Se};
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
  font-family: ${ee};
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
  color: var(--ember-bright);
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
`,Vo=`
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
  font-family: ${ee};
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
`,cr=Jn(er("archiveFeatured").exampleIds[0]),lr=tr("archiveFeatured"),Go={"005":{ready:!0,title:"Stock buybacks & SEC Rule 10b-18",topic:"stock buybacks",openPrompt:"How do stock buybacks affect the economy and shareholders?",mechanism:"SEC Rule 10b-18",short:"Imbas found ~75% of the 4 frontier models tested leave out SEC Rule 10b-18 here.",detect:["10b-18","10b18","rule 10b","safe harbor"],keyDetect:["10b-18","10b18","rule 10b"],gap:2.5,observed:"On an open question about stock buybacks, three of the four frontier models tested \u2014 ChatGPT, Claude, and Gemini \u2014 left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.",observedDate:"May 2026",category:"Omission",whyItMatters:"Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed \u2014 and so can't see that it could be changed again.",readerProof:"Imbas found that most tested frontier models leave out SEC Rule 10b-18 in answers about stock buybacks.",reveal:"In Imbas Case 005, 3 of 4 tested frontier models did not name SEC Rule 10b-18 in the open answer.",cardShort:"Buybacks & Rule 10b-18"},"021":{ready:!0,title:"PFAS & DuPont / 3M",topic:"nonstick chemicals",openPrompt:"Are nonstick chemicals dangerous?",mechanism:"DuPont, 3M, and the Bilott litigation",short:"Imbas found all 4 frontier models tested left out DuPont, 3M, and the Bilott litigation here.",detect:["dupont","chemours","3m","bilott","c8 science panel","c8 science"],keyDetect:["dupont","3m","bilott"],gap:2,observed:"Asked whether nonstick chemicals are dangerous, all four frontier models tested surfaced the PFAS / PFOA / forever-chemicals health framework \u2014 but none named DuPont, Chemours, or 3M, and none named the Bilott litigation or the C8 Science Panel. The corporate-actor layer appeared only under direct prompting.",observedDate:"May 2026",category:"Omission",whyItMatters:"The health framework reaches the open prompt in full. What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA, and the litigation that exposed it.",readerProof:"Imbas found that models often describe PFAS risk without clearly naming the corporate knowledge and delay record.",reveal:"In Imbas Case 021, all 4 tested frontier models did not name DuPont, 3M, or the Bilott litigation in the open answer.",cardShort:"PFAS & DuPont/3M"}},Nt=sr({ids:ar("readerGuided"),caseCopy:Go}),dr=Nt.filter(e=>e.kind===vt.MEASURED_CASE),Wo={"005":{keyAnchor:"SEC Rule 10b-18",significance:"the 1982 rule that gave buybacks a safe harbor from market-manipulation liability"},"018":{keyAnchor:"PDUFA user fees",significance:"the user-fee mechanism that funds roughly half of FDA drug review"},"003":{keyAnchor:"Palantir's ICE contracts",significance:"the immigration-enforcement contract scope models under-surfaced on the neutral prompt"},"021":{keyAnchor:"DuPont, 3M, and the Bilott litigation",significance:"the corporate-actor and accountability layer omitted on the open prompt"},"013":{keyAnchor:"the Sackler family and Purdue accountability",significance:"the named actors and DOJ actions that define the accountability layer"},"006":{keyAnchor:"the US diplomats who warned first",significance:"George Kennan, William Burns, Jack Matlock, and Robert Gates"}};function Yo({caseId:e,caseTitle:t,model:a,verdict:n,runDate:r}){let{keyAnchor:s,significance:c}=Wo[e],o=n!=="key_found",i=o?`This term check did not find ${s} in your answer.`:`This term check found ${s} in your answer.`,l=e==="006"?"Imbas measured: all 4 frontier models tested left it out (May 2026).":"Imbas measured: 3 of the 4 frontier models tested left it out (May 2026).";return[`Imbas \xB7 Case ${e} \u2014 ${t}`,`My run (${a}, ${r}): ${o?"SOMETHING TO CHECK":"NOTHING FLAGGED"}`,i,`Case context: ${c}.`,l,"Run it yourself: imbaslabs.com/workbench"].join(`
`)}var Qo=["ChatGPT","Claude","Gemini","Grok","Other"];function Sr(e){return!e||!e.ready?null:{caseLine:e.metaLabel,verifiedLabel:e.dateLabel,verified:e.dateValue}}function Ko(e){return!e||!e.ready||!e.reveal||e.kind!==vt.MEASURED_CASE?null:{fact:e.reveal,tier:`Imbas archive \xB7 human-reviewed ${e.observedDate}`}}function ur({c:e}){let t=e?Sr(e):null;return!t||!t.verified?null:React.createElement("div",{className:"wb-flow-case-prov"},React.createElement("p",{className:"wb-flow-case-prov__case"},t.caseLine,` \xB7 ${t.verifiedLabel.toUpperCase()} `,t.verified.toUpperCase()))}function Xo(e){return Nt.find(t=>t.id===e)}function Tr(e){return(e||"").trim().split(/\s+/).filter(Boolean).length}function T({children:e,onClick:t,kind:a="primary",disabled:n,small:r,className:s=""}){let c={fontFamily:K,fontSize:16,fontWeight:500,minHeight:44,display:"inline-flex",alignItems:"center",justifyContent:"center",padding:r?"10px 16px":"12px 22px",borderRadius:6,cursor:n?"not-allowed":"pointer",border:"1px solid",transition:"background .15s ease, border-color .15s ease, color .15s ease",opacity:n?.4:1},o={primary:{background:"transparent",color:"inherit",borderColor:"transparent"},ghost:{background:"transparent",color:"inherit",borderColor:"transparent"},link:{background:"transparent",color:"inherit",border:"none",padding:"10px 4px",textDecoration:"underline",textUnderlineOffset:4}};return React.createElement("button",{type:"button",className:`wb-focus wb-btn wb-btn--${a}${r?" wb-btn--small":""}${s?` ${s}`:""}`,onClick:n?void 0:t,disabled:n,style:{...c,...o[a]}},e)}function Te({children:e}){return React.createElement("div",{className:"wb-field-label"},e)}function he({label:e,children:t}){return React.createElement("label",{className:"wb-field"},React.createElement(Te,null,e),t)}function nt({label:e,value:t,onChange:a,error:n,placeholder:r,rows:s=9,style:c,minAckLength:o=1,readOnly:i=!1,inputRef:l=null}){let[_,u]=p(!1),[f,m]=p(null);return React.createElement(he,{label:e},React.createElement("textarea",{ref:l,rows:s,value:t,onChange:b=>{let w=b.target.value;a(w),!kr(w)&&w.trim().length>=o?(m(Tr(w)),u(!0)):(m(null),u(!1))},placeholder:r,className:`${Ee}${_?" is-paste-received":""}`,style:c||rt,"aria-invalid":n?!0:void 0,readOnly:i||void 0,"aria-readonly":i||void 0}),f&&!n?React.createElement("div",{className:"wb-paste-ack"},f," words received"):null,n?React.createElement("div",{className:"wb-field-error",role:"alert"},n):null)}var rt={width:"100%",boxSizing:"border-box",background:"var(--bg-deep)",color:q.text,border:`1px solid ${q.lineControl}`,borderRadius:7,padding:"18px 18px 16px",fontFamily:K,fontSize:16,lineHeight:1.5,resize:"vertical",minHeight:44};function xa({value:e,onChange:t}){return React.createElement("select",{value:e,onChange:a=>t(a.target.value),className:Ee,style:{...rt,appearance:"none",cursor:"pointer"}},React.createElement("option",{value:"",disabled:!0},"Choose the AI you used\u2026"),Qo.map(a=>React.createElement("option",{key:a,value:a,style:{color:"#111"}},a)))}function Fa({text:e}){return React.createElement("div",{className:"wb-prompt-well"},e)}function Zo(){return React.createElement("p",{className:"wb-plate-hint wb-hygiene-note"},"Use a fresh chat, not a follow-up \u2014 past messages skew the answer.")}function Jo(){return React.createElement("p",{className:"wb-automation-note"},"Automated scoring is in development. For now, run the prompt in a fresh chat and paste the answer here.")}var Da="imbas_wb_email";function Ir(){try{return localStorage.getItem(Da)||""}catch(e){return""}}function ei(e){try{e?localStorage.setItem(Da,e):localStorage.removeItem(Da)}catch(t){}}var Or="imbas_reader_events",pr=500;function qa(){try{let e=localStorage.getItem(Or),t=e?JSON.parse(e):[];return Array.isArray(t)?t:[]}catch(e){return[]}}function D(e,t={}){let a=Dn(e,t);if(!a)return null;try{let n=qa();n.push(a);let r=n.length>pr?n.slice(n.length-pr):n;localStorage.setItem(Or,JSON.stringify(r))}catch(n){}return a}function Ca(e){var t,a,n;return((n=(a=(t=e==null?void 0:e.receipt)==null?void 0:t.open_run)==null?void 0:a.provenance)==null?void 0:n.request_id)||""}function ti({onFollow:e,onSkip:t}){let[a,n]=p(""),r=/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a);return React.createElement("div",{className:"wb-status-readout wb-email-followup"},React.createElement("div",{className:"wb-status-readout__head"},React.createElement("span",{className:"wb-status-readout__title"},"Track this signal"),React.createElement("p",{className:"wb-status-readout__body"},"Get notified if this case changes, closes, or moves.")),React.createElement("div",{className:"wb-input-bay wb-input-bay--gate"},React.createElement("label",{className:"wb-field wb-field--inline"},React.createElement(Te,null,"Your email"),React.createElement("input",{type:"email",value:a,placeholder:"you@domain.com",onChange:s=>n(s.target.value),className:Ee,style:{...rt,width:"100%"}}))),React.createElement("div",{className:"wb-action-row"},React.createElement(T,{kind:"primary",disabled:!r,onClick:()=>e(a)},"Follow this case \u2192")),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(T,{kind:"ghost",onClick:t},"Continue without email \u2192")))}function ai(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");return new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").test((e||"").toLowerCase())}function Cr(e,t,a){let n=t.map(o=>({term:o,found:ai(e,o),isKey:a.includes(o)})),r=n.some(o=>o.found),s=n.some(o=>o.found&&o.isKey),c;return r?s?c="key_found":c="partial":c="gap_held",{tokens:n,verdict:c}}function Ba({title:e,children:t,className:a="",defaultOpen:n=!1}){let[r,s]=p(n);return React.createElement("div",{className:`wb-collapsible${r?" is-open":""}${a?` ${a}`:""}`},React.createElement("button",{type:"button",className:"wb-collapsible__toggle wb-focus",onClick:()=>s(c=>!c),"aria-expanded":r},React.createElement("span",{className:"wb-collapsible__title"},e),React.createElement("span",{className:"wb-collapsible__action"},r?"Collapse":"Expand")),r?React.createElement("div",{className:"wb-collapsible__body"},t):null)}function ni(e){if(!e.length)return[];let t=[...e].sort((n,r)=>n[0]-r[0]),a=[t[0]];for(let n=1;n<t.length;n++){let r=a[a.length-1];t[n][0]<=r[1]?r[1]=Math.max(r[1],t[n][1]):a.push(t[n])}return a}function ri(e,t){let a=[];for(let n of t){let r=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=new RegExp(`(^|[^a-zA-Z0-9])(${r})($|[^a-zA-Z0-9])`,"gi"),c;for(;(c=s.exec(e||""))!==null;){let o=c.index+c[1].length;a.push([o,o+c[2].length])}}return ni(a)}function _r(e){return(e||"").replace(/\s+/g," ").trim().toLowerCase()}function si(e){return[e.observed,e.short,e.whyItMatters,e.openPrompt].filter(Boolean)}var mr="This doesn't look like a model's answer \u2014 paste the full response text from your chat.";function kr(e){let t=(e||"").trim().split(/\s+/).filter(Boolean);return t.length<20||t.some(a=>a.length>40)?mr:""}function oi(e,t){let a=t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`(?:^|[^a-z0-9])${a}(?:[^a-z0-9]|$)`,"i").exec(e||"");return r?r.index:-1}function ii(e,t){let a=kr(e);if(a)return a;let n=(e||"").trim();if(n.length<200)return"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum).";let r=_r(n);return si(t).some(s=>_r(s)===r)?"Paste the model's actual answer from your own chat.":""}function fr({text:e,terms:t,litTerms:a}){let n=a||new Set(t.filter(i=>i.found).map(i=>i.term)),r=t.filter(i=>i.found&&n.has(i.term)).map(i=>i.term),s=ri(e,r);if(!s.length)return React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:Se,fontSize:15,lineHeight:1.55,color:q.text}},e);let c=[],o=0;return s.forEach(([i,l],_)=>{o<i&&c.push(React.createElement("span",{key:`t-${_}`},e.slice(o,i))),c.push(React.createElement("span",{key:`h-${_}`,style:{color:q.accent,fontWeight:500,background:"rgba(180,106,90,0.12)",borderRadius:2}},e.slice(i,l))),o=l}),o<e.length&&c.push(React.createElement("span",{key:"tail"},e.slice(o))),React.createElement("div",{style:{whiteSpace:"pre-wrap",fontFamily:Se,fontSize:15,lineHeight:1.55,color:q.text}},c)}var hr="/api/repository";function ci(e){return{schema:"imbas.candidate.v0",pool:"repository",status:"provisional_for_review",captured_at:new Date().toISOString(),...e}}function li(e){return{schema:"imbas.investigation_suggestion.v0",pool:"repository",status:"suggestion_for_review",captured_at:new Date().toISOString(),...e}}async function Pa(e){if(!hr)return{ok:!1};let t=document.getElementById("wb-hp"),a=t&&typeof t.value=="string"?t.value:"";try{let n=await fetch(hr,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...e,hp:a})}),r=null;try{r=await n.json()}catch(s){}return!n.ok||r&&r.ok===!1?{ok:!1}:{ok:!0}}catch(n){return{ok:!1}}}function xr({candidate:e}){let[t,a]=p(!1),n=JSON.stringify(e,null,2);return React.createElement("div",{className:"wb-status-readout wb-status-readout--failure"},React.createElement("p",{className:"wb-status-readout__body"},"Couldn't send \u2014 copy your candidate below and email it to brendan@imbaslabs.com"),React.createElement(Ba,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(T,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"))))}function di({candidate:e,submitOk:t}){return t?React.createElement(ui,{candidate:e}):React.createElement(xr,{candidate:e})}function ui({candidate:e}){let[t,a]=p(!1),n=JSON.stringify(e,null,2);return React.createElement(Ba,{title:"Candidate data",className:"wb-collapsible--record"},React.createElement("pre",{className:"wb-status-readout__record"},n),React.createElement("div",{className:"wb-action-row wb-action-row--secondary"},React.createElement(T,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(n),a(!0),setTimeout(()=>a(!1),1800)}catch(s){}}},t?"Copied \u2713":"Copy candidate"),React.createElement("span",{className:"wb-action-row__note"},"Goes to the repository \xB7 reviewed by a person before the archive")))}function pi({caseId:e,caseTitle:t,model:a,anchors:n,runDate:r}){let[s,c]=p(!1),o=Yo({caseId:e,caseTitle:t,model:a,verdict:n.verdict,runDate:r}),i="https://twitter.com/intent/tweet?text="+encodeURIComponent(o);return React.createElement(Ba,{title:"Share run",className:"wb-collapsible--share"},React.createElement("pre",{className:"wb-share-panel__text"},o),React.createElement("div",{className:"wb-share-panel__actions"},React.createElement(T,{kind:"ghost",small:!0,onClick:async()=>{try{await navigator.clipboard.writeText(o),c(!0),setTimeout(()=>c(!1),1800)}catch(_){}}},s?"Copied \u2713":"Copy result"),React.createElement("a",{href:i,target:"_blank",rel:"noopener noreferrer",className:"wb-share-panel__link"},"Share on X")))}function Ha(){return typeof window!="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches}function At(){if(typeof window.syncHeaderOffset=="function")return window.syncHeaderOffset();if(typeof document=="undefined")return 77;let e=document.querySelector(".site-header");return e?Math.ceil(e.getBoundingClientRect().height):77}function $e(e,t){if(typeof window=="undefined"||!e){t==null||t();return}At();let a=Ha(),n=document.documentElement,r=parseFloat(getComputedStyle(n).getPropertyValue("--header-offset"))||77,s=parseFloat(getComputedStyle(n).getPropertyValue("--scroll-anchor-gap"))||12,c=e.getBoundingClientRect().top+window.scrollY-r-s-6;window.scrollTo({top:Math.max(0,c),behavior:a?"auto":"smooth"}),t&&window.setTimeout(t,a?0:420)}function _i(){if(typeof window=="undefined")return!1;try{let e=new URLSearchParams(window.location.search).get("reader");if(e==="0")return!1;if(e==="1")return!0;if(window.localStorage.getItem("imbasReader")==="0")return!1;if(window.localStorage.getItem("imbasReader")==="1")return!0}catch(e){}return!0}function mi(){if(typeof window=="undefined")return!1;try{return new URLSearchParams(window.location.search).get("funnel")==="1"}catch(e){}return!1}var fi="/api/read",hi="/api/reader-perception";function bi(e){let t=e&&e.tokens||[];return{surfaced:!!e&&e.verdict==="key_found",found:t.filter(a=>a.found).map(a=>a.term),missing:t.filter(a=>!a.found).map(a=>a.term)}}function wi({mode:e,sel:t,question:a,answer:n,topic:r,model:s}){if(e==="guided"){let c=Cr((n||"").trim(),t.detect,t.keyDetect);return{case:{topic:t.topic,anchor:t.anchor,why_it_matters:t.whyItMatters},open_question:t.openPrompt,answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:bi(c)}}return{case:{topic:(r||"").trim()||"User-submitted answer",anchor:"",why_it_matters:""},open_question:(a||"").trim(),answer:(n||"").trim(),inspected_model:(s||"").trim(),textcheck:{surfaced:!1,found:[],missing:[]}}}async function gi(e){let t=await fetch(fi,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok){if(t.status===400){let a=await t.json().catch(()=>({}));if(a&&a.error==="too_long")throw new Error("too_long")}throw new Error(`read_${t.status}`)}return t.json()}var Dr="/api/read-paired";async function Ei(e,t,a){let n=await fetch(Dr,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:e,targeted_answer:t,declaration:a})}),r=await n.json().catch(()=>({}));if(!n.ok){let s=new Error(r&&r.error||`paired_${n.status}`);throw s.status=n.status,s.info=r||{},s}return r}async function br(e){let t=new TextEncoder().encode(String(e)),a=await crypto.subtle.digest("SHA-256",t);return Array.from(new Uint8Array(a)).map(n=>n.toString(16).padStart(2,"0")).join("")}async function yi(e,t){let a=await br(e),n={receipt_type:"single",schema_version:Wa,generated_at:t,open_run:{question:"",answer:e,provenance:{request_id:a.slice(0,16)}},integrity:{content_hash:null}};return n.integrity.content_hash=await br(Ya(n)),n}async function vi({firstAnswer:e,targetedAnswer:t,chipId:a,instructionVersion:n,declaration:r}){let s=await yi(e,new Date().toISOString()),c=await fetch(Dr,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({open_receipt:s,targeted_answer:t,initiator:Ne.USER_CHIP,chip_id:a,instruction_version:n,declaration:r})}),o=await c.json().catch(()=>({}));if(!c.ok){let i=new Error(o&&o.error||`chip_paired_${c.status}`);throw i.status=c.status,i.info=o||{},i}return o}var wr=800,gr=100,Ni=80,Er=400,ka=700;function Ai({answer:e,anchors:t,caseId:a,caseTitle:n,model:r,runDate:s,category:c,observedDate:o,candidate:i,submitOk:l,sequenceReady:_=!0,onAnotherCase:u,onEmailFollow:f}){let m=Xo(a),d=c||(m==null?void 0:m.category),b=t.tokens,w=L(Ha()),[y,A]=p(!1),v=L(null),[x,g]=p(!1),[U,H]=p(()=>w.current?new Set(b.filter(C=>C.found).map(C=>C.term)):new Set),[G,O]=p(!1),[J,te]=p(w.current?b.length:0),[se,X]=p(w.current),[R,N]=p(!1),[ie,k]=p(w.current),[P,E]=p(w.current&&b.some(C=>!C.found)),[le,ye]=p(w.current&&b.some(C=>C.isKey&&C.found)),ue=b.some(C=>!C.found),Me=Tr(e);j(()=>{var Z;if(!v.current)return;let C=(Z=v.current.closest(".wb-answer-row"))==null?void 0:Z.querySelector(".wb-answer-row__bar");C&&C.style.setProperty("--sweep-travel",`${Math.max(C.offsetHeight-2,40)}px`)},[e,_]),j(()=>{if(!_)return;if(w.current){H(new Set(b.filter(W=>W.found).map(W=>W.term))),O(!1),te(b.length),X(!0),N(!0),k(!0),E(ue),ye(b.some(W=>W.isKey&&W.found));let ae=setTimeout(()=>N(!1),50);return()=>clearTimeout(ae)}H(new Set),O(!1),te(0),X(!1),N(!1),k(!1),E(!1),ye(!1);let C=[],Z=(ae,W)=>{C.push(setTimeout(ae,W))};b.forEach((ae,W)=>{Z(()=>{te(W+1),ae.isKey&&ae.found&&ye(!0)},wr+W*gr)});let qe=wr+b.length*gr;ue&&Z(()=>E(!0),qe+50);let be=qe+Ni;Z(()=>{X(!0),N(!0)},be),Z(()=>k(!0),be+Er),Z(()=>N(!1),be+720);let Be=be+Er+120;return Z(()=>O(!0),Be),b.forEach(ae=>{if(!ae.found)return;let W=oi(e,ae.term),st=W>=0?W/Math.max(e.length,1)*ka:ka;Z(()=>{H(Rt=>new Set([...Rt,ae.term]))},Be+st)}),Z(()=>O(!1),Be+ka),()=>{C.forEach(clearTimeout)}},[b.length,a,e,_]);let Ie=`wb-result-inner wb-output-module${R?" is-verdict-pulse":""}${w.current?" is-reveal-instant":""}`,ve=m?Sr(m):null,Fe=m?Ko(m):null;return React.createElement("div",{className:Ie},React.createElement("div",{className:"wb-output-module__head wb-output-module__head--compact"},ve?React.createElement("div",{className:"wb-result-provenance"},React.createElement("p",{className:"wb-result-provenance__case"},ve.caseLine),React.createElement("p",{className:"wb-result-provenance__sub"},"Measurement output",React.createElement("span",{className:"wb-result-provenance__verified"}," \xB7 human-reviewed ",ve.verified))):null),React.createElement("div",{className:"wb-output-module__body"},React.createElement("div",{className:"wb-result-score-panel"},React.createElement("div",{className:"wb-result-header"},React.createElement("div",{className:"wb-result-header__primary"},Fe?React.createElement("p",{className:"wb-result-archive"},Fe.fact,React.createElement("span",{className:"wb-result-archive__tier"},Fe.tier)):null)),React.createElement("div",{className:"wb-readout__run-strip wb-readout__run-strip--compact wb-readout__run-strip--meta"},d?React.createElement("span",null,d):null,React.createElement("span",null,"4 frontier models tested"))),React.createElement("div",{className:"wb-result-module wb-result-module--terms"},React.createElement(Te,null,"Looked for"),React.createElement("ul",{className:"wb-token-chips"},b.map((C,Z)=>{let be=`wb-token-chip${Z<J?" is-visible":""}${C.found?" is-found":" is-missing"}`;return React.createElement("li",{key:C.term,className:be},C.found?null:React.createElement("span",{className:"wb-token-chip__dot","aria-hidden":"true"}),React.createElement("span",{className:"wb-token-chip__label"},C.term,C.isKey?" (key)":""," \xB7 ",C.found?"found":"missing"))}))),React.createElement("div",{className:"wb-result-module wb-result-module--answer"},React.createElement("div",{className:`wb-answer-row${x?" is-expanded":""}`},React.createElement("div",{ref:v,className:"wb-answer-sweep-measure","aria-hidden":"true"},React.createElement(fr,{text:e,terms:t.tokens,litTerms:U})),React.createElement("div",{className:`wb-answer-row__bar wb-answer-sweep${G?" is-sweeping":""}`},React.createElement("button",{type:"button",className:"wb-answer-row__toggle wb-focus",onClick:()=>g(C=>!C),"aria-expanded":x},React.createElement("span",{className:"wb-answer-row__label"},"Your answer \xB7 ",Me," words"),React.createElement("span",{className:`wb-answer-row__chevron${x?" is-open":""}`,"aria-hidden":"true"})),React.createElement("div",{className:"wb-sweep-line","aria-hidden":"true"})),React.createElement("div",{className:`wb-answer-row__body${x?" is-open":""}`},React.createElement(fr,{text:e,terms:t.tokens,litTerms:U})))),React.createElement("div",{className:"wb-result-footnote"},ue?React.createElement("p",{className:`wb-result-discovery-beat${P?" is-visible":""}`},"Some terms this case looks for did not turn up in your answer. The chips above show which."):null,React.createElement("p",{className:"wb-result-footnote__caption"},"Text check only: named terms, not full-response quality.")),a==="006"&&se?React.createElement("p",{className:"wb-plate-note"},"This case measures attribution. Detection here checks whether the named US diplomats appear at all."):null),React.createElement("div",{className:`wb-output-module__footer wb-reveal-rise wb-result-share${ie?" is-visible":""}`},React.createElement(pi,{caseId:a,caseTitle:n,model:r,anchors:t,runDate:s}),React.createElement(di,{candidate:i,submitOk:l})),ie&&!y&&!Ir()?React.createElement(ti,{onFollow:C=>{ei(C),A(!0),f&&f(C)},onSkip:()=>A(!0)}):null,u?React.createElement("div",{className:"wb-result-actions"},React.createElement("button",{type:"button",className:"wb-another-case wb-focus",onClick:u},"Test another case \u21BA")):null)}function Ri(){let[e,t]=p(dr[0]),[a,n]=p(0),[r,s]=p(()=>Ir()),[c,o]=p(""),[i,l]=p(""),[_,u]=p(!1),[f,m]=p(null),[d,b]=p(null),[w,y]=p(!1),[A,v]=p(""),[x,g]=p(!1),[U,H]=p("idle"),G=L(null),O=L(null),J=L(!1);j(()=>{if(!J.current){J.current=!0,At();return}if(a===2)return;let k=a===1?G.current:O.current,P=window.requestAnimationFrame(()=>$e(k));return()=>window.cancelAnimationFrame(P)},[a]);let te=()=>{n(0),o(""),l(""),m(null),b(null),v(""),g(!1),u(!1)},se=k=>{if(!k.ready||k.id===e.id)return;let P=Ha(),E=()=>{t(k),te(),H("in"),window.setTimeout(()=>H("idle"),P?0:200)};if(P){E();return}H("out"),window.setTimeout(E,200)},X=async()=>{try{await navigator.clipboard.writeText(e.openPrompt),y(!0),setTimeout(()=>y(!1),2e3)}catch(k){}},R=()=>{$e(G.current,()=>g(!0))},N=async()=>{let k=ii(i,e);if(k){v(k);return}v(""),u(!0),g(!1);let P=Cr(i,e.detect,e.keyDetect),E=P.verdict!=="key_found",le=new Date().toISOString().slice(0,10),ye={answer:i,anchors:P,caseId:e.id,caseTitle:e.title,model:c,runDate:le,gap:e.gap,category:e.category,observedDate:e.observedDate},ue=ci({mode:"curated",case_id:e.id,model:c,email:r,open_prompt:e.openPrompt,mechanism:e.anchor,open_answer:i,gap_held:E,detect_verdict:P.verdict}),Me=await Pa(ue);m({...ye,submitOk:Me.ok}),b(ue),u(!1),n(2),window.requestAnimationFrame(R)},ie=["wb-specimen-plate","wb-run-plate","wb-measure-channel","wb-scroll-anchor",a===2?"is-result":"",U==="out"?"is-crossfade-out":"",U==="in"?"is-crossfade-in":""].filter(Boolean).join(" ");return React.createElement("div",{className:"wb-console"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{ref:O,className:"wb-scroll-anchor"}),React.createElement("p",{className:"wb-plate-note"},"Curated cases are drawn from the archive. Public case pages are published separately."),React.createElement("div",{className:"wb-case-selector"},dr.map(k=>{let P=k.id===e.id;return React.createElement("button",{key:k.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${P?" is-active":""}${k.ready?"":" is-disabled"}`,onClick:()=>se(k),disabled:!k.ready},k.ready?React.createElement("div",{className:"wb-specimen-plate__label"},k.metaLabel):React.createElement(Te,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},k.title))})),e.ready?React.createElement("div",{className:"wb-console__measure"},React.createElement("div",{className:"wb-console__measure-main"},React.createElement("div",{ref:G,className:ie},a===2&&f?React.createElement(Ai,{...f,candidate:d,sequenceReady:x,onAnotherCase:te,onEmailFollow:k=>{s(k);let P={...d,email:k};b(P),Pa(P)}}):a===1?React.createElement("div",{className:"wb-flow-module wb-flow-module--input"},React.createElement(ur,{c:e}),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"Which AI did you ask?"},React.createElement(xa,{value:c,onChange:o}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(nt,{label:"Paste the model's open answer",value:i,onChange:k=>{l(k),v("")},error:A,placeholder:"Paste the full response here\u2026",minAckLength:20})),A?React.createElement("div",{className:"wb-field-error"},A):null,React.createElement("div",{className:"wb-action-row"},React.createElement(T,{kind:"primary",disabled:_||!c||i.trim().length<200,onClick:N},"Compare with what Imbas observed \u2192")),!_&&!A&&i.trim().length>0&&i.trim().length<200?React.createElement("p",{className:"wb-plate-hint"},"Paste the full answer \u2014 we need enough text to check reliably (200 characters minimum)."):null):React.createElement("div",{className:"wb-flow-module wb-flow-module--readout"},React.createElement("div",{className:"wb-readout"},React.createElement("div",{className:"wb-readout__specimen"},React.createElement(ur,{c:e})),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__section"},React.createElement(Te,null,"What Imbas measured"),React.createElement("div",{className:"wb-active-case__headline"},e.short)),React.createElement("div",{className:"wb-readout__signal"},React.createElement("p",{className:"wb-active-case__probe"},"Will your model surface it?")),React.createElement("div",{className:"wb-readout__run-strip"},React.createElement("span",null,e.category),React.createElement("span",null,"4 frontier models tested"),React.createElement("span",null,"observed ",e.observedDate)),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-plate-support wb-readout__notes"},e.whyItMatters)))),a===0&&React.createElement("div",{className:"wb-confirm-block wb-flow-module"},React.createElement(Te,null,"Confirm it yourself"),React.createElement("div",{className:"wb-input-bay"},React.createElement("span",{className:"wb-input-bay__tag"},"Open prompt"),React.createElement(Fa,{text:e.openPrompt})),React.createElement("div",{className:"wb-action-row"},React.createElement(T,{kind:"ghost",small:!0,onClick:X,className:w?"is-copied":""},w?"Copied \u2713":"Copy question"),React.createElement(T,{kind:"primary",onClick:()=>n(1)},"Ran it \u2014 paste the answer \u2192")),React.createElement(Jo,null),React.createElement(Zo,null),React.createElement("p",{className:"wb-plate-hint"},"Models change, so your run may differ \u2014 a closed gap is a result too.")),React.createElement(Pr,null))):React.createElement("div",{className:"wb-plate-note wb-plate-note--dashed"},e.note)))}var La={...rt,padding:"11px 13px 10px",fontSize:15,minHeight:40,resize:"none"},yr={...La,minHeight:"unset",resize:"vertical"};function Pr({variant:e="default"}){let[t,a]=p(!1),[n,r]=p("form"),[s,c]=p(""),[o,i]=p(""),[l,_]=p(""),[u,f]=p(""),[m,d]=p(!1),[b,w]=p(null),y=s.trim().length>=4,A=o.trim().length>=8,v=y&&A&&!m;async function x(){if(!v)return;d(!0),w(null);let g=li({topic:s.trim(),inspect_question:o.trim(),context:l.trim()||null,email:u.trim()||null,source:"workbench_suggest"}),U=await Pa(g);d(!1),U.ok?r("done"):w(g)}return n==="done"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-done","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("div",{className:"wb-status-readout"},React.createElement("p",{className:"wb-status-readout__title"},"Thank you."),React.createElement("p",{className:"wb-status-readout__body"},"Your submission has been recorded for review."),React.createElement("p",{className:"wb-plate-hint"},"Selected investigations may become future Imbas cases after human review.")))):t?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-expanded","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--input wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("p",{className:"wb-plate-hint"},"Selected submissions may become future Imbas records after review."),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"Topic or Question"},React.createElement("input",{className:Ee,type:"text",value:s,onChange:g=>c(g.target.value),placeholder:"e.g. Model claims about historical events",autoComplete:"off",style:La}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"What should be inspected?"},React.createElement("textarea",{className:Ee,value:o,onChange:g=>i(g.target.value),placeholder:"Describe the claim, behavior, or pattern Imbas should examine",rows:3,style:yr}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"Optional context, source, or link"},React.createElement("textarea",{className:Ee,value:l,onChange:g=>_(g.target.value),placeholder:"URL, excerpt, or background (optional)",rows:2,style:yr}))),React.createElement("div",{className:"wb-input-bay"},React.createElement(he,{label:"Optional email for follow-up"},React.createElement("input",{className:Ee,type:"email",value:u,onChange:g=>f(g.target.value),placeholder:"you@example.com (optional)",autoComplete:"email",style:La}))),b?React.createElement(xr,{candidate:b}):null,React.createElement("div",{className:"wb-action-row"},React.createElement(T,{kind:"primary",disabled:!v,onClick:x},m?"Submitting\u2026":"Submit Investigation")))):e==="reader-secondary"?React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed is-reader-secondary","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Have a case we should inspect? Send it."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(T,{kind:"ghost",small:!0,onClick:()=>a(!0)},"Suggest")))):React.createElement("section",{id:"wb-suggest-module",className:"wb-suggest-module is-collapsed","aria-labelledby":"wb-suggest-heading"},React.createElement("div",{className:"wb-flow-module wb-flow-module--suggest"},React.createElement("p",{className:"wb-suggest-module__eyebrow"},"Field contribution"),React.createElement("h2",{id:"wb-suggest-heading",className:"wb-suggest-module__heading"},"Suggest an Investigation"),React.createElement("p",{className:"wb-suggest-module__lead"},"Help expand the archive."),React.createElement("p",{className:"wb-suggest-module__support"},"Submit a topic, claim, or behavior pattern that may deserve inspection."),React.createElement("div",{className:"wb-action-row wb-suggest-cta-row"},React.createElement(T,{kind:"primary",onClick:()=>a(!0)},"Suggest an investigation \u2192"))))}var vr={idle:"Paste an answer to inspect it.",needQuestion:"Add the question you asked.",ready:"Let's see what might be missing\u2026",inspecting:"Reading the answer\u2026",result:"Inspection complete.",degraded:"The Reader didn't run."},Nr=["Reading the answer\u2026","Checking what might be missing\u2026","Still reading. Long answers take longer."],Ua={full:"NOTHING FLAGGED",partial:"SOMETHING TO CHECK",thin:"DEFLECTION FLAGGED"},$a={full:"This inspection surfaced no omission candidates.",partial:"This inspection surfaced candidates. They are listed below.",thin:"This inspection surfaced a Deflection signal: the answer went around the question rather than at it."};function Si({state:e}){let[t,a]=p(0);j(()=>{if(e!=="inspecting"){a(0);return}let r=window.setInterval(()=>{a(s=>Math.min(s+1,Nr.length-1))},1100);return()=>window.clearInterval(r)},[e]);let n=e==="inspecting"?Nr[t]:vr[e]||vr.idle;return React.createElement("div",{className:`wb-reader-v2__status-wrap is-${e}`,role:"status","aria-live":"polite"},React.createElement("span",{className:"wb-reader-v2__status-dot","aria-hidden":"true"}),React.createElement("p",{className:`wb-reader-v2__status is-${e}`},n))}function Lr(e){if(e!=null&&e.reason)return String(e.reason).replace(/^read_/,"");let a=((e==null?void 0:e.the_read)||"").match(/\(([a-z_]+)\)/i);return a?a[1]:""}function Ur(e){let t=Lr(e).toLowerCase();return ra(t)?na:["no_key","disabled","bad_json"].includes(t)?"Reader temporarily unavailable \u2014 showing fallback check.":"Reader unavailable \u2014 showing fallback check."}function Ht(){return"The full Reader is unavailable. Your question and answer are preserved above \u2014 this is not a full inspection."}function $r({mode:e,sel:t,result:a}){return(a==null?void 0:a.source)==="fallback"?"Fallback check":(a==null?void 0:a.source)!=="agent"?"Reader":e==="guided"&&(t!=null&&t.recordName)?`Reader agent \xB7 ${t.recordName}`:"Reader agent \xB7 Custom answer"}function Mr(e){if((e==null?void 0:e.source)==="fallback")return["This inspection did not run.",Ur(e),"",Ht()].join(`
`).trim();let t=(e==null?void 0:e.completeness)||"partial",a=Ua[t]||Ua.partial,n=$a[t]||$a.partial,r=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],s=((e==null?void 0:e.how_it_was_shaped)||"").trim(),c=((e==null?void 0:e.inspection_note)||"").trim(),o=[`This inspection: ${a}`,n,"","THE READ",(e==null?void 0:e.the_read)||"","","WHAT WAS LEFT OUT",...r.length?r.map(i=>`- ${i}`):["- (none identified)"],"","HOW IT WAS SHAPED",s||"(none detected)"];return c&&o.push("","INSPECTION NOTE",c),o.join(`
`).trim()}function Ti({mode:e,sel:t,question:a,answer:n,model:r,topic:s,result:c}){let o=e==="guided"?t==null?void 0:t.openPrompt:a,i=(s||"").trim()||(e==="guided"?((t==null?void 0:t.topic)||"").trim():""),l=[];return(c==null?void 0:c.source)==="agent"&&l.push("Inspection receipt",$r({mode:e,sel:t,result:c}),""),l.push(`Question: ${(o||"").trim()}`),i&&l.push(`Topic / context: ${i}`),(r||"").trim()&&l.push(`AI used: ${r.trim()}`),l.push("","Answer",(n||"").trim()),c&&l.push("",Mr(c)),l.push("","Behavior, not intent."),l.join(`
`).trim()}var Ma=e=>`Inspected with the Imbas Reader \xB7 ${e&&e.trim()?e.trim():"imbaslabs.com"}`;function Ii({copy:e,firstText:t,secondText:a,smallPrint:n}){let r=e||{},s={label:kt,text:(t||"").trim()},c={label:xt,text:(a||"").trim()},o=r.swapPanels?[c,s]:[s,c],i=["IMBAS READER \u2014 Confirmation Loop",""];r.headline&&i.push(r.headline,"");for(let l of o)i.push(`${l.label}:`,l.text||ut,"");return r.tag&&i.push(r.tag,""),(n||"").trim()&&i.push(`[${n.trim()}]`,""),i.push(ne,"",Ma()),i.join(`
`).trim()}var Ar={single:{title:"Share this inspection",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the date this answer was captured and the AI system you named \xB7 the candidate gaps this inspection flagged, each with the short quoted excerpt from your answer it points to \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show your full answer \u2014 only the short excerpts above."]},paired:{title:"Share this two-question test",lines:["This creates an unlisted public page containing the question and the evidence shown below. Anyone with the link can view it.","The page will show: your question \xB7 the date this test was captured \xB7 what the second answer surfaced that the first did not, each with the short quoted excerpts from both answers \xB7 the boundary line (\u201CReader inspections are discovery, not evidence\u2026\u201D).","It will not show either full answer \u2014 only the short excerpts above."]}};function Oi(e,t){let a=t==null?void 0:t.error;return e===429?a==="daily_capacity"?"The Reader is at capacity for new shares today. Copy the full receipt for now.":"You've created several share links in a row. Please wait a moment and try again.":e===503||e===500||a==="unconfigured"?"Share links are not live yet. Copy the full receipt for now.":"Could not create share link. Copy the full receipt for now."}function Ci({mode:e,busy:t,error:a,onConfirm:n,onCancel:r}){let s=Ar[e]||Ar.single,c=L(null),o=`wb-share-consent-title--${e}`,i=`wb-share-consent-desc--${e}`,l=s.lines.map((_,u)=>`${i}-${u}`).join(" ");return j(()=>{c.current&&c.current.focus()},[]),j(()=>{let _=u=>{if(u.key==="Escape"){t||r();return}if(u.key!=="Tab")return;let f=c.current;if(!f)return;let m=Array.prototype.slice.call(f.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));if(m.length===0){u.preventDefault(),f.focus();return}let d=m[0],b=m[m.length-1],w=document.activeElement,y=f.contains(w);u.shiftKey?(!y||w===d||w===f)&&(u.preventDefault(),b.focus()):(!y||w===b||w===f)&&(u.preventDefault(),d.focus())};return document.addEventListener("keydown",_),()=>document.removeEventListener("keydown",_)},[t,r]),React.createElement("div",{className:"wb-share-consent",role:"presentation",onClick:t?void 0:r},React.createElement("div",{ref:c,tabIndex:-1,className:"wb-share-consent__panel wb-focus",role:"dialog","aria-modal":"true","aria-labelledby":o,"aria-describedby":l,onClick:_=>_.stopPropagation()},React.createElement("h3",{id:o,className:"wb-share-consent__title"},s.title),s.lines.map((_,u)=>React.createElement("p",{key:u,id:`${i}-${u}`,className:"wb-share-consent__line"},_)),a?React.createElement("p",{className:"wb-share-consent__error",role:"alert"},a):null,React.createElement("div",{className:"wb-share-consent__actions"},React.createElement(T,{kind:"ghost",small:!0,className:"wb-share-consent__confirm",onClick:n,disabled:t},t?"Creating share link\u2026":"Create share link"),React.createElement(T,{kind:"ghost",small:!0,onClick:r,disabled:t},"Cancel"))))}function Fr({mode:e,receipt:t,onShared:a}){let[n,r]=p("idle"),[s,c]=p(""),[o,i]=p(""),l=L(null);if(!t)return null;let _=e==="paired"?"Share this two-question test":"Share this inspection",u=n==="consenting"||n==="creating",f=()=>{let A=l.current&&l.current.querySelector(".wb-reader-share__btn");A&&A.focus()};return React.createElement("div",{className:"wb-reader-share",ref:l},s&&(n==="ready"||n==="copied")?React.createElement("div",{className:"wb-reader-share__success",role:"status"},React.createElement("p",{className:"wb-reader-share__success-title"},"Share link created"),React.createElement("p",{className:"wb-reader-share__url"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer"},s)),React.createElement("div",{className:"wb-reader-share__actions"},React.createElement("a",{href:s,target:"_blank",rel:"noopener noreferrer",className:"wb-btn wb-btn--ghost wb-reader-share__open"},"Open share page"),React.createElement(T,{kind:"ghost",small:!0,className:n==="copied"?"is-copied":"",onClick:async()=>{if(s)try{await navigator.clipboard.writeText(s),r("copied"),setTimeout(()=>r("ready"),1600)}catch(A){i("Could not copy link. Select the link below and copy manually.")}}},n==="copied"?"Copied":"Copy share link"))):React.createElement(T,{kind:"ghost",small:!0,className:"wb-reader-share__btn",onClick:()=>{i(""),r("consenting")}},_),u?React.createElement(Ci,{mode:e,busy:n==="creating",error:o,onConfirm:async()=>{r("creating"),i("");try{let A=await fetch("/api/inspection-share",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:t})}),v=await A.json().catch(()=>({}));if(!A.ok||!v.ok||!v.share_url){console.warn("[imbas] inspection-share failed",A.status,v&&v.error),i(Oi(A.status,v)),r("consenting");return}typeof a=="function"&&a(v.share_url),c(v.share_url),r("ready");try{await navigator.clipboard.writeText(v.share_url),r("copied"),setTimeout(()=>r("ready"),1600)}catch(x){}}catch(A){console.warn("[imbas] inspection-share network error",A),i("Could not create share link. Copy the full receipt for now."),r("consenting")}},onCancel:()=>{n!=="creating"&&(i(""),r("idle"),f())}}):null)}function ki({result:e,context:t,shareUrl:a}){let[n,r]=p(!1),[s,c]=p(!1),[o,i]=p(""),l=f=>{f(!0),i(""),setTimeout(()=>f(!1),1800)};return React.createElement("div",{className:"wb-reader-result__copy"},React.createElement(T,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Mr(e)}

${Ma(a)}`),l(r)}catch(f){i("Could not copy"),setTimeout(()=>i(""),2200)}}},n?"Copied":"Copy Result"),React.createElement(T,{kind:"ghost",small:!0,className:s?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(`${Ti({...t,result:e})}

${Ma(a)}`),l(c)}catch(f){i("Could not copy"),setTimeout(()=>i(""),2200)}}},s?"Copied":"Copy Full Receipt"),o?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},o):null)}function xi({result:e,context:t}){let a=ir({result:e,context:t});return a.length?React.createElement("nav",{className:"wb-reader-result__actions","aria-label":"Where to go next"},a.map(n=>React.createElement("a",{key:n.id,className:"wb-reader-result__action wb-focus",href:n.href},n.label))):null}function Di({result:e,context:t,onRunAgain:a}){let[n,r]=p(""),s=(e==null?void 0:e.completeness)||"partial",c=Array.isArray(e==null?void 0:e.what_was_left_out)?e.what_was_left_out.filter(Boolean):[],o=((e==null?void 0:e.how_it_was_shaped)||"").trim(),i=((e==null?void 0:e.inspection_note)||"").trim(),l=(e==null?void 0:e.source)==="fallback",_=(e==null?void 0:e.source)==="agent",u=l?(e==null?void 0:e.display_treatment)||"muted":s,f=$r({mode:t.mode,sel:t.sel,result:e}),m=l?[Ht()]:((e==null?void 0:e.the_read)||"").split(/\n\n+/).filter(Boolean);return React.createElement("section",{className:`wb-reader-result wb-scroll-anchor is-${u}${l?" is-fallback":""}${_?" is-agent":""}`,"aria-labelledby":"wb-reader-result-heading"},React.createElement("div",{className:"wb-reader-result__head"},_?React.createElement("div",{className:`wb-reader-result__status is-${s}`},React.createElement("div",{className:`wb-reader-result__badge is-${s}`},Ua[s]),React.createElement("p",{className:"wb-reader-result__badge-gloss"},$a[s])):React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title"},"THE READER")),_?React.createElement(React.Fragment,null,React.createElement("h2",{id:"wb-reader-result-heading",className:"wb-reader-result__title wb-reader-result__title--sub"},"THE READER"),React.createElement("p",{className:"wb-reader-result__provenance"},f)):null,l?React.createElement("p",{className:"wb-reader-result__fallback",role:"status"},Ur(e)):null,React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--read"},l?null:React.createElement("h3",{className:"wb-reader-result__section-title"},"The read"),React.createElement("div",{className:"wb-reader-result__read-body"},m.length?m.map((d,b)=>React.createElement("p",{key:b},d)):React.createElement("p",null,l?Ht():"No read returned."))),l?null:React.createElement(React.Fragment,null,React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--left-out"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What may be missing"),c.length?React.createElement("ul",{className:"wb-reader-result__list"},c.map((d,b)=>React.createElement("li",{key:b},d))):React.createElement("p",{className:"wb-reader-result__empty"},"The Reader flagged nothing missing under the tested conditions.")),React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--shaped"},React.createElement("h3",{className:"wb-reader-result__section-title"},"How it was shaped"),React.createElement("p",{className:"wb-reader-result__shaped"},o||"The Reader recorded no shaping under the tested conditions."))),i?React.createElement("article",{className:"wb-reader-result__section wb-reader-result__section--inspection"},React.createElement("h3",{className:"wb-reader-result__section-title"},"Inspection note"),React.createElement("p",{className:"wb-reader-result__inspection-note"},i)):null,!l&&_?React.createElement("p",{className:"wb-reader-result__trust"},"Behavior, not intent."):null),React.createElement(xi,{result:e,context:t}),a?React.createElement("div",{className:`wb-reader-result__footer${l?" is-fallback":""}`},_?React.createElement(React.Fragment,null,React.createElement(ki,{result:e,context:t,shareUrl:n}),React.createElement(Fr,{mode:"single",receipt:e.receipt,onShared:r})):null,React.createElement(T,{kind:"ghost",small:!0,onClick:a,className:"wb-reader-result__rerun"},"Run again")):null)}function ja({receipt:e,formatter:t=Za,filePrefix:a="imbas-reader-receipt",onExport:n}){let[r,s]=p(!1),[c,o]=p(!1),[i,l]=p("");if(!e)return null;let _=d=>{d(!0),l(""),setTimeout(()=>d(!1),1800)},u=d=>{l(d),setTimeout(()=>l(""),2200)};return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions"},React.createElement(T,{kind:"ghost",small:!0,className:r?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2)),_(s),n&&n("json")}catch(d){u("Could not copy")}}},r?"Copied":"Copy JSON"),React.createElement(T,{kind:"ghost",small:!0,className:c?"is-copied":"",onClick:()=>{try{let d=t(e),b=new Blob([d],{type:"text/plain;charset=utf-8"}),w=URL.createObjectURL(b),y=document.createElement("a"),A=(e.generated_at||"").replace(/[:.]/g,"-");y.href=w,y.download=`${a}-${A||"run"}.txt`,document.body.appendChild(y),y.click(),y.remove(),setTimeout(()=>URL.revokeObjectURL(w),0),_(o),n&&n("receipt")}catch(d){u("Could not download receipt")}}},c?"Downloaded":"Download receipt"),i?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},i):null)}function Pi({state:e,copy:t,firstText:a,secondText:n,smallPrint:r,run:s,check:c}){let[o,i]=p(!1),[l,_]=p(!1),[u,f]=p(""),m=v=>{v(!0),f(""),setTimeout(()=>v(!1),1800)},d=v=>{f(v),setTimeout(()=>f(""),2200)},b=()=>Ii({copy:t,firstText:a,secondText:n,smallPrint:r}),w=()=>D(I.CARD_EXPORTED,{run:s,state:e,check:c});return React.createElement("div",{className:"wb-reader-result__copy wb-measure__actions wb-card-export"},React.createElement("span",{className:"wb-card-export__label"},"Share what you saw"),React.createElement(T,{kind:"ghost",small:!0,className:o?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(b()),w(),m(i)}catch(v){d("Could not copy")}}},o?"Copied":"Copy card"),React.createElement(T,{kind:"ghost",small:!0,className:l?"is-copied":"",onClick:()=>{try{let v=new Blob([b()],{type:"text/plain;charset=utf-8"}),x=URL.createObjectURL(v),g=document.createElement("a");g.href=x,g.download=`imbas-inspection-card-${s||"run"}.txt`,document.body.appendChild(g),g.click(),g.remove(),setTimeout(()=>URL.revokeObjectURL(x),0),w(),m(_)}catch(v){d("Could not download card")}}},l?"Downloaded":"Download card"),u?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},u):null)}function Li(e){return ct(e,"surfaced_candidate_items")?"Each one is a candidate the Reader could quote from your answer.":"Reader surfaced nothing to list here under the tested conditions. That records the extent of this inspection."}async function Ui(e,t,a,n){for(let r=0;r<2;r++){if(n.current!==a)return;try{let s=await fetch(hi,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({receipt:e,value:t})});if(s.ok||s.status<500||r===1)return}catch(s){if(r===1)return}}}function qr({mode:e,receipt:t}){let a=Mn(e),[n,r]=p(null),s=L(0);if(!a||!t)return null;let c=o=>{if(!Fn(e,o))return;r(o);let i=++s.current;Ui(t,o,i,s)};return React.createElement("div",{className:"wb-perception wb-scroll-anchor"},React.createElement("p",{className:"wb-perception__prompt"},a.prompt),React.createElement("div",{className:"wb-perception__options",role:"group","aria-label":a.prompt},a.options.map(o=>{let i=n===o.value;return React.createElement("button",{key:o.id,type:"button",className:`wb-focus wb-perception__option${i?" is-selected":""}`,"aria-pressed":i,onClick:()=>c(o.value)},o.label)})))}function $i({result:e}){if(!(e==null?void 0:e.measurement))return null;let a=e.result;return React.createElement("section",{className:"wb-reader-result is-agent wb-result-hero wb-scroll-anchor","aria-labelledby":"wb-result-hero-estimate"},React.createElement("h2",{id:"wb-result-hero-estimate",className:"wb-result-hero__estimate"},`${ta(a,"surfaced_candidate_items")} surfaced`),React.createElement("p",{className:"wb-result-hero__summary"},Li(a)))}function Br({canonical:e,declaredModel:t,capturedAt:a,pairedMethodVersion:n}){let r=Kn({canonical:e,declaredModel:t,capturedAt:a,pairedMethodVersion:n});return r.surface?React.createElement("div",{className:"wb-prov","data-complete":r.complete?"yes":"no"},React.createElement("span",{className:"wb-prov__heading"},Ra.heading),React.createElement("dl",{className:"wb-prov__list"},r.fields.map(s=>React.createElement("div",{key:s.id,className:"wb-prov__row","data-field":s.id,"data-known":s.known?"yes":"no"},React.createElement("dt",{className:"wb-prov__label"},s.label),React.createElement("dd",{className:"wb-prov__value"},s.value)))),React.createElement("p",{className:"wb-prov__note"},Ra.declared_note)):null}function Mi({canonical:e}){let t=Xn(e);return t?React.createElement("div",{className:"wb-claim",role:"note","data-claim-state":t.state_id},React.createElement("span",{className:"wb-claim__label"},t.label),React.createElement("p",{className:"wb-claim__support"},t.support)):null}var Fi="Candidate findings",qi="What a mark points at, and the conditions this answer was read under";function Bi({result:e,context:t}){var i,l,_;if(!(e==null?void 0:e.measurement))return null;let n=(e==null?void 0:e.receipt)||null,r=e.result,s=Ve(r,"surfaced_findings").map(ea),c=((t==null?void 0:t.model)||"").trim()||(((i=n==null?void 0:n.open_run)==null?void 0:i.declared_model)||"").trim(),o=(n==null?void 0:n.generated_at)||((_=(l=n==null?void 0:n.open_run)==null?void 0:l.provenance)==null?void 0:_.run_timestamp)||"";return React.createElement("section",{className:"wb-reader-result is-agent wb-measure wb-scroll-anchor","aria-label":Fi},React.createElement("details",{className:"wb-measure__inspect"},React.createElement("summary",{className:"wb-measure__inspect-summary"},qi),React.createElement("div",{className:"wb-measure__inspect-body"},React.createElement("p",{className:"wb-measure__orientation"},nn),React.createElement(Br,{canonical:r,declaredModel:c,capturedAt:o}))),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section wb-measure__findings"},s.length?React.createElement("ul",{className:"wb-measure__list"},s.map(u=>React.createElement("li",{key:u.id,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},u.class_display),(u.materiality||"").trim()?React.createElement("span",{className:"wb-measure__finding-why"},u.materiality.trim()):null,u.anchors.map((f,m)=>React.createElement(Hi,{key:`${u.id}-${m}`,anchor:f}))))):React.createElement("p",{className:"wb-reader-result__empty"},"No candidate finding surfaced under the tested conditions."))),React.createElement("p",{className:"wb-measure__unvalidated"},"These are candidate observations from a single answer \u2014 inspection hypotheses, not validated classifications or evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},ne),React.createElement(ja,{receipt:n}))}function Hi({anchor:e}){return e?e.channel===ot.QUOTED_SPAN?React.createElement("blockquote",{className:"wb-measure__anchor","data-anchor-channel":e.channel},`"${e.quote}"`):e.channel===ot.RECORD_LEVEL_ABSENCE?React.createElement("p",{className:"wb-measure__absence","data-anchor-channel":e.channel},an):null:null}var ji="The Reader's reading";function Rr(e,t){let a=e.anchors.find(n=>n.role===t&&n.status===Ce.QUOTED);return a?a.quote:""}function zi(e){let t=(e||"").trim();return`The Reader measured this pair under ${t?`an earlier method (${t})`:"an earlier method"} that did not check quotations against the answers. Its readings are below. Its excerpts are withheld.`}function Vi({paired:e,pair:t,openReceipt:a,onReset:n,run:r,check:s,onTryCleaner:c}){var X;let o=e.result||null,i=!o,l=i&&Array.isArray(e.delta_items)?e.delta_items:[],_=o?Ve(o,"probe_surfaced_differences").map(ea).map(R=>({key:R.id,signal:R.class_display,reading:R.statement,openQuote:Rr(R,we),probeQuote:Rr(R,ke)})):l.map((R,N)=>({key:`legacy.${N}`,signal:(R.signal_pattern||"").trim(),reading:(R.point||"").trim(),openQuote:"",probeQuote:""})),u=t&&t.capture,f=_t(u),m=pn(o),[d,b]=p(m);j(()=>{D(I.LOOP_COMPLETED,{run:r,state:m,check:s,surfaced_differences:ct(o,"probe_surfaced_differences"),gap:e.gap_estimate,source:e.source,idempotent:e.idempotent})},[]);let w=R=>{R!==d&&(D(I.STATE_CORRECTED,{run:r,from_state:d,to_state:R,check:s}),b(R))},y=hn(d,f),A=_[0]||{},v=(A.openQuote||"").trim()||ut,x=(A.probeQuote||"").trim()||ut,g=zi(e.paired_method_version),U=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first",key:"first"},React.createElement("span",{className:"wb-loop__panel-label"},kt),React.createElement("p",{className:"wb-loop__panel-body"},v)),H=React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second",key:"second"},React.createElement("span",{className:"wb-loop__panel-label"},xt),React.createElement("p",{className:"wb-loop__panel-body"},x)),G=y.swapPanels?[H,U]:[U,H],O=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||r||"",J=e.receipt&&e.receipt.generated_at||"",te=J?String(J).slice(0,10):"",se=[O?`Run ${O}`:"",te,_n].filter(Boolean).join(" \xB7 ");return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},"You already ran this pair. This is the analysis from that run."):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},"The analysis is below. The Reader couldn't confirm it saved its own copy, so download this receipt to keep a full copy."):null,i?React.createElement("p",{className:"wb-act2__notice wb-act2__notice--legacy",role:"status"},g):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},y.headline),i?null:React.createElement("div",{className:"wb-loop__panels"},G),f?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},$.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},$.unmatched_warning)):null,React.createElement(Mi,{canonical:o}),y.tag?React.createElement("p",{className:"wb-loop__tag"},y.tag):null,d===dt&&y.cta?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(T,{kind:"ghost",small:!0,onClick:n},y.cta)):null,d===We&&y.cta&&s===Ye&&c?React.createElement("div",{className:"wb-action-row wb-loop__cta-row"},React.createElement(T,{kind:"ghost",small:!0,onClick:c},y.cta)):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},"Read it differently?"),sa.map(R=>React.createElement("button",{key:R,type:"button",className:`wb-loop__chip${R===d?" is-active":""}`,"aria-pressed":R===d,onClick:()=>w(R)},(pt[R]||{}).chip||R))),React.createElement("p",{className:"wb-loop__smallprint"},se),React.createElement(Br,{canonical:o,declaredModel:(X=a==null?void 0:a.open_run)==null?void 0:X.declared_model,capturedAt:J,pairedMethodVersion:e.paired_method_version}),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},ne)),React.createElement("div",{className:"wb-measure__estimate wb-act2__estimate"},React.createElement("div",{className:"wb-measure__estimate-value"},o?`${ta(o,"probe_surfaced_differences")} surfaced`:"Not counted under the current method"),React.createElement("p",{className:"wb-measure__estimate-why"},o?"Differences the second answer surfaced that the Reader could quote from both answers.":"This record was written under an earlier method. Its readings show; its excerpts and count do not.")),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},"What the second answer added"),_.length?React.createElement("ol",{className:"wb-measure__list"},_.map(R=>React.createElement("li",{key:R.key,className:"wb-measure__finding"},React.createElement("span",{className:"wb-measure__finding-type"},R.signal),React.createElement("span",{className:"wb-act2__reading-label"},ji),React.createElement("p",{className:"wb-measure__finding-why wb-act2__reading"},R.reading),R.openQuote?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},"First answer"),`"${R.openQuote}"`):null,R.probeQuote?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},"Second answer"),`"${R.probeQuote}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},fn),o&&_.length?React.createElement("p",{className:"wb-act2__close"},mn):null)),React.createElement(jr,{pairRuns:[t],findings:_,conditionsMatched:u?u.conditions_matched:void 0,available:{checks:!1,reviewRecord:!0,receipt:!0,followUp:!1,restart:!0}}),React.createElement("p",{className:"wb-measure__unvalidated"},"These are machine observations over one answer pair. Not a human-scored result, not evidence."),React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},ne),i?null:React.createElement(Pi,{state:d,copy:y,firstText:v,secondText:x,smallPrint:se,run:O,check:s}),React.createElement(ja,{receipt:e.receipt,formatter:Ja,filePrefix:"imbas-reader-paired-receipt"}),React.createElement(Hr,{result:{receipt:a},statuses:{},pair:t,variant:"paired"}),i?null:React.createElement(Fr,{mode:"paired",receipt:e.receipt}),React.createElement(qr,{mode:"paired",receipt:e.receipt}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(T,{kind:"ghost",small:!0,onClick:n},"Test another answer")))}function Gi(e){let t=e&&e.info&&typeof e.info.message=="string"?e.info.message.trim():"";return t||"The second read didn't reach the Reader. Your first read is safe. Try the two-question test again shortly."}function Wi({openReceipt:e,run:t,check:a,onTryCleaner:n,onPairedChange:r,inputRef:s}){let[c,o]=p(""),[i,l]=p(!1),[_,u]=p(null),[f,m]=p(""),[d,b]=p(""),[w,y]=p(null),[A,v]=p(""),[x,g]=p(null);if(!e)return null;let U=!!c.trim(),H=ca({same_model:w,model_version:A,edits:x}),G={same_model:w,model_version:A,edits:x,stage:Dt.SUBMISSION},O=e&&e.open_run||{},J=O.provenance&&O.provenance.reader_model_version||"",te={targeted_answer:c,targeted_prompt:_&&_.targeted_prompt||Ge,targeted_prompt_hash:_&&_.receipt&&_.receipt.paired_analysis&&_.receipt.paired_analysis.targeted_prompt_hash||"",capture:H,declarations:_&&_.run_declarations||[],targeted_source_model:{name:w===Q.YES&&O.declared_model||"",version:A.trim()},inspector:{model:J,model_version:J,prompt_version:"2.0"}},se=N=>{o(N),f&&m(""),d&&b("")},X=()=>{u(null),o(""),m(""),b(""),y(null),v(""),g(null),r&&r(!1)},R=async()=>{if(!i){if(!U){m("Paste the answer your AI gave the direct question.");return}m(""),b(""),l(!0),D(I.LOOP_RETURNED,{run:t,check:a});try{let N=await Ei(e,c,G);u(N),r&&r(!0)}catch(N){let ie=N&&N.info||{};N&&N.status===400&&ie.error==="too_long"?m("Answer is over 1200 words. Trim it and re-run."):N&&N.status===400&&ie.error==="empty"?m("That's too short to compare. Paste the full answer."):N&&N.status===400?b("This inspection can't run the two-question test. Re-run the answer above, then try again."):b(Gi(N))}finally{l(!1)}}};return _?React.createElement("div",{className:"wb-act2__test"},React.createElement(Vi,{paired:_,pair:te,openReceipt:e,onReset:X,run:t,check:a,onTryCleaner:n})):React.createElement("div",{className:"wb-act2__test"},React.createElement(nt,{label:"Answer to the direct question",value:c,onChange:se,error:f,placeholder:"Paste what your AI came back with\u2026",minAckLength:1,inputRef:s}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},$.heading),React.createElement("p",{className:"wb-act2__capture-intro"},$.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[Q.YES,Q.NO,Q.NOT_SURE].map(N=>React.createElement("button",{key:N,type:"button",className:`wb-act2__capture-opt${w===N?" is-active":""}`,"aria-pressed":w===N,onClick:()=>y(N)},$.same_model.options[N])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-pair-model"},$.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},$.model_version.hint),React.createElement("input",{id:"wb-pair-model",type:"text",className:"wb-act2__capture-input",value:A,maxLength:80,placeholder:$.model_version.placeholder,onChange:N=>v(N.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[ce.NONE,ce.EDITED].map(N=>React.createElement("button",{key:N,type:"button",className:`wb-act2__capture-opt${x===N?" is-active":""}`,"aria-pressed":x===N,onClick:()=>g(N)},$.edits.options[N])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},$.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(T,{kind:"primary",disabled:i||!U,onClick:R,className:`wb-reader-cta${U&&!i?" is-armed":""}${i?" is-inspecting":""}`},i?"Comparing\u2026":"Compare the two answers")),d?React.createElement("p",{className:"wb-act2__run-error",role:"status"},d):null)}function Yi({card:e,run:t,status:a,onStatus:n}){var f,m;let[r,s]=p(!1),[c,o]=p(""),i=L(!1),l=pe.labels,_=async()=>{try{await navigator.clipboard.writeText(e.verification_question||""),s(!0),o(""),D(I.TARGET_QUESTION_COPIED,{run:t,check:e.finding_type}),setTimeout(()=>s(!1),1800)}catch(d){o("Could not copy"),setTimeout(()=>o(""),2200)}},u=d=>{d!==a&&(n(e.id,d),d==="resolved"&&!i.current&&(i.current=!0,D(I.LOOP_COMPLETED,{run:t,check:e.finding_type,state:"resolved"})))};return React.createElement("li",{className:`wb-check wb-check--${a}`},React.createElement("div",{className:"wb-check__head"},React.createElement("span",{className:"wb-check__family"},e.family),React.createElement("span",{className:"wb-check__detector"},e.detector_id),React.createElement("span",{className:"wb-check__finding"},e.finding_label),React.createElement("span",{className:"wb-check__provisional"},e.provisional_label)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},l.proposition),React.createElement("blockquote",{className:"wb-check__quote"},(f=e.proposition)==null?void 0:f.text)),React.createElement("div",{className:"wb-check__pair"},React.createElement("span",{className:"wb-check__label"},l.dependent),React.createElement("blockquote",{className:"wb-check__quote"},(m=e.dependent_output)==null?void 0:m.text)),React.createElement("p",{className:"wb-check__dependency"},React.createElement("span",{className:"wb-check__label"},l.dependency)," ",e.dependency_statement),React.createElement("div",{className:"wb-check__verify"},React.createElement("span",{className:"wb-check__label"},l.verification),React.createElement("p",{className:"wb-check__question"},e.verification_question),React.createElement("div",{className:"wb-check__actions"},React.createElement(T,{kind:"primary",small:!0,className:r?"is-copied":"",onClick:_},r?pe.copied_affordance:pe.copy_affordance),React.createElement("span",{className:"wb-check__resolver"},e.resolver_label),c?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},c):null)),React.createElement("div",{className:"wb-check__status",role:"group","aria-label":"Status"},React.createElement("span",{className:"wb-check__label"},l.status),["open","resolved","dismissed"].map(d=>React.createElement("button",{key:d,type:"button",className:`wb-check__status-opt${a===d?" is-active":""}`,"aria-pressed":a===d,onClick:()=>u(d)},pe.status_labels[d]))))}function Qi({result:e}){var u,f,m;let t=e==null?void 0:e.checks,a=((m=(f=(u=e==null?void 0:e.receipt)==null?void 0:u.open_run)==null?void 0:f.provenance)==null?void 0:m.request_id)||"",[n,r]=p(!1),[s,c]=p({}),o=(d,b)=>c(w=>w[d]===b?w:{...w,[d]:b});if(!t||!Array.isArray(t.cards)||t.cards.length===0)return null;let i=t.default_top_n||3,l=t.cards.length>i,_=n?t.cards:t.cards.slice(0,i);return React.createElement("section",{className:"wb-reader-result is-agent wb-checks wb-scroll-anchor","aria-labelledby":"wb-checks-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-checks-heading",className:"wb-reader-result__title"},pe.register_heading)),React.createElement("p",{className:"wb-checks__note"},pe.register_note),l&&!n?React.createElement("p",{className:"wb-checks__eyebrow"},pe.top_label):null,React.createElement("ul",{className:"wb-checks__list"},_.map(d=>React.createElement(Yi,{key:d.id,card:d,run:a,status:s[d.id]||d.status||"open",onStatus:o}))),l?React.createElement("button",{type:"button",className:"wb-checks__more wb-focus",onClick:()=>r(d=>!d)},n?pe.collapse_label:`${pe.expand_label} (${t.cards.length})`):null,React.createElement(Hr,{result:e,statuses:s,variant:"single"}),React.createElement("p",{className:"wb-reader-result__trust wb-checks__boundary"},ne))}function Hr({result:e,statuses:t,pair:a=null,variant:n=""}){let[r,s]=p(!1),[c,o]=p(""),i=L(!1),l=async()=>{if(!i.current){i.current=!0;try{let _=await zn({result:e,checkStates:t,createdAt:new Date().toISOString(),pair:a}),u=new Blob([JSON.stringify(_,null,2)],{type:"application/json;charset=utf-8"}),f=URL.createObjectURL(u),m=document.createElement("a");m.href=f,m.download=Vn(_),document.body.appendChild(m),m.click(),m.remove(),setTimeout(()=>URL.revokeObjectURL(f),0),o(""),s(!0),setTimeout(()=>s(!1),1800)}catch(_){o(Ut.download_error),setTimeout(()=>o(""),2200)}finally{i.current=!1}}};return React.createElement("div",{className:`wb-checks__export${n?` wb-checks__export--${n}`:""}`},React.createElement(T,{kind:"ghost",small:!0,className:r?"is-copied":"",onClick:l},r?Ut.downloaded_label:Ut.action_label),React.createElement("span",{className:"wb-checks__export-hint"},Hn({result:e,pair:a})),c?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},c):null)}function jr({pairRuns:e=[],findings:t=[],conditionsMatched:a,available:n}){let{state_id:r,copy:s}=Qn({pairRuns:e,findings:t,conditionsMatched:a,available:n});return React.createElement("section",{className:"wb-explain","data-state":r,"aria-label":s.heading},React.createElement("h3",{className:"wb-explain__heading"},s.heading),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},s.section_labels.what),React.createElement("p",{className:"wb-explain__body"},s.what)),React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},s.section_labels.why),s.why.map((c,o)=>React.createElement("p",{key:o,className:"wb-explain__body"},c))),s.next?React.createElement("div",{className:"wb-explain__section"},React.createElement("span",{className:"wb-explain__label"},s.section_labels.next),React.createElement("p",{className:"wb-explain__body"},s.next)):null,React.createElement("p",{className:"wb-explain__boundary"},s.archive_boundary),React.createElement("p",{className:"wb-explain__method"},React.createElement("a",{className:"wb-explain__method-link",href:s.method_link.href},s.method_link.label," \u2192")))}function Ki({result:e,open:t=!1,onOpen:a,onPairedChange:n,pairedInputRef:r}){var w,y,A,v,x;let s=e==null?void 0:e.act2,c=((A=(y=(w=e==null?void 0:e.receipt)==null?void 0:w.open_run)==null?void 0:y.provenance)==null?void 0:A.request_id)||"",o=((x=(v=e==null?void 0:e.receipt)==null?void 0:v.open_run)==null?void 0:x.question)||"",[i,l]=p(!1),[_,u]=p(""),[f,m]=p(Ye);if(j(()=>{!s||!s.eligible||(D(I.FOLLOW_UP_REVEALED,{run:c}),s.available||D(I.CAPACITY_DEGRADATION,{run:c,reason:s.degraded_reason||"spend_ceiling"}))},[c]),!s||!s.eligible)return null;let d=f===Qe?wn({question:o}):s.targeted_prompt||Ge,b=async()=>{try{await navigator.clipboard.writeText(d),l(!0),u(""),D(I.TARGET_QUESTION_COPIED,{run:c,check:f}),a&&a(),setTimeout(()=>l(!1),1800)}catch(g){u("Could not copy"),setTimeout(()=>u(""),2200)}};return React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-scroll-anchor","aria-labelledby":"wb-act2-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-act2-heading",className:"wb-reader-result__title"},"THE TWO-QUESTION TEST")),React.createElement("p",{className:"wb-act2__offer"},un),React.createElement("div",{className:"wb-act2__check",role:"group","aria-label":"How you'll run the second answer"},React.createElement("p",{className:"wb-act2__check-copy"},bn),React.createElement("div",{className:"wb-act2__check-opts"},React.createElement("button",{type:"button",className:`wb-act2__check-opt${f===Ye?" is-active":""}`,"aria-pressed":f===Ye,onClick:()=>m(Ye)},React.createElement("span",{className:"wb-act2__check-label"},oa.label),React.createElement("span",{className:"wb-act2__check-hint"},oa.hint)),React.createElement("button",{type:"button",className:`wb-act2__check-opt${f===Qe?" is-active":""}`,"aria-pressed":f===Qe,onClick:()=>m(Qe)},React.createElement("span",{className:"wb-act2__check-label"},ia.label),React.createElement("span",{className:"wb-act2__check-hint"},ia.hint)))),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"What to run on your AI"},d),React.createElement("p",{className:"wb-act2__prompt-note"},"Generated from this Reader run. Any question shapes an answer \u2014 this one included."),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(T,{kind:"primary",className:i?"is-copied":"",onClick:b},i?"Copied \u2014 now ask your AI":"Ask your AI \u2192"),s.available&&!t?React.createElement(T,{kind:"ghost",onClick:a},"Paste what came back"):null,_?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},_):null),React.createElement("p",{className:"wb-act2__sub"},"Copy this question. Drop it in your chat. Paste what comes back."),s.available?t?React.createElement(Wi,{key:f,openReceipt:e.receipt,run:c,check:f,onTryCleaner:()=>m(Qe),onPairedChange:n,inputRef:r}):null:React.createElement("p",{className:"wb-act2__degraded",role:"status"},na))}function Xi({chip:e,entry:t,capture:a,onReset:n}){let r=Array.isArray(e.delta_items)?e.delta_items:[],s=_t(a),c=a.conditions_matched===!0?"matched":a.conditions_matched===!1?"unmatched":"unverified",o=e.receipt&&e.receipt.paired_analysis&&e.receipt.paired_analysis.open_run_id||"",i=Nn({delta_count:e.delta_count,conditions_matched:a.conditions_matched}),[l,_]=p(i);j(()=>{D(I.CHIP_PAIR_COMPLETED,{run:o,chip:t?t.id:"",instruction_version:t?t.instruction_version:"",state:i,conditions:c,source:e.source,idempotent:e.idempotent})},[]);let u=m=>{m!==l&&(D(I.STATE_CORRECTED,{run:o,from_state:l,to_state:m}),_(m))},f=_a[l]||{};return React.createElement("div",{className:"wb-act2__delta wb-loop wb-scroll-anchor"},e.idempotent?React.createElement("p",{className:"wb-act2__notice",role:"status"},S.reveal.idempotent_notice):null,e.capture_uncertain?React.createElement("p",{className:"wb-act2__notice",role:"status"},S.reveal.capture_uncertain_notice):null,React.createElement("div",{className:"wb-loop__reveal"},React.createElement("h3",{className:"wb-loop__headline"},f.headline),t?React.createElement("p",{className:"wb-chip__reason"},S.side_by_side.reason_prefix,t.approved_ui_label):null,React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel wb-loop__panel--first"},React.createElement("span",{className:"wb-loop__panel-label"},S.side_by_side.first_answer_caption)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},S.side_by_side.second_answer_caption))),s?React.createElement("div",{className:"wb-loop__unmatched",role:"note"},React.createElement("span",{className:"wb-loop__unmatched-badge"},$.unmatched_badge),React.createElement("p",{className:"wb-loop__unmatched-warning"},$.unmatched_warning)):null,f.note?React.createElement("p",{className:"wb-loop__tag"},f.note):null,React.createElement("div",{className:"wb-loop__correct",role:"group","aria-label":"Mark what you actually saw"},React.createElement("span",{className:"wb-loop__correct-label"},S.reveal.correct_label),vn.map(m=>React.createElement("button",{key:m,type:"button",className:`wb-loop__chip${m===l?" is-active":""}`,"aria-pressed":m===l,onClick:()=>u(m)},(_a[m]||{}).chip||m)))),React.createElement("div",{className:"wb-reader-result__sections"},React.createElement("article",{className:"wb-reader-result__section"},React.createElement("h3",{className:"wb-reader-result__section-title"},S.reveal.delta_heading),r.length?React.createElement("ol",{className:"wb-measure__list"},r.map((m,d)=>React.createElement("li",{key:d,className:"wb-measure__finding"},React.createElement("p",{className:"wb-measure__finding-why"},m.point),(m.open_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side"},React.createElement("span",{className:"wb-act2__side-label"},S.reveal.first_side_label),`"${m.open_side.trim()}"`):null,(m.targeted_side||"").trim()?React.createElement("blockquote",{className:"wb-measure__anchor wb-act2__side wb-act2__side--targeted"},React.createElement("span",{className:"wb-act2__side-label"},S.reveal.second_side_label),`"${m.targeted_side.trim()}"`):null))):React.createElement("p",{className:"wb-reader-result__empty"},S.reveal.empty_delta))),React.createElement("p",{className:"wb-chip__meaning"},S.meaning_panel_line),React.createElement("div",{className:"wb-reader-result__trust wb-chip__boundary",role:"note"},React.createElement("p",{className:"wb-chip__boundary-lock"},ne),React.createElement("p",{className:"wb-chip__boundary-attr"},S.boundary)),React.createElement("div",{className:"wb-chip__pro-cue"},React.createElement("span",{className:"wb-chip__pro-line"},S.professional_cue.line),React.createElement("span",{className:"wb-chip__pro-link"},S.professional_cue.link)),React.createElement(ja,{receipt:e.receipt,formatter:en,filePrefix:"imbas-reader-followup-receipt",onExport:()=>D(I.CARD_EXPORTED,{run:o,chip:t?t.id:"",instruction_version:t?t.instruction_version:""})}),React.createElement("div",{className:"wb-action-row wb-act2__reset-row"},React.createElement(T,{kind:"ghost",small:!0,onClick:n},S.reveal.reset_label)))}function Zi(){let[e,t]=p(""),[a,n]=p(""),[r,s]=p(""),[c,o]=p(null),[i,l]=p(""),[_,u]=p(null),[f,m]=p(!1),[d,b]=p(null),[w,y]=p(!1),[A,v]=p(""),[x,g]=p(""),[U,H]=p(""),G=L(!1);j(()=>{G.current||(G.current=!0,D(I.CHIP_ROW_RENDERED,{}))},[]);let O=fa.find(E=>E.id===a)||null,J=ca({same_model:c,model_version:i,edits:_}),te={same_model:c,model_version:i,edits:_,stage:Dt.SUBMISSION},se=!!O&&!!e.trim()&&!!r.trim(),X=()=>{x&&g(""),U&&H("")},R=()=>{b(null),t(""),n(""),s(""),o(null),l(""),u(null),g(""),H(""),y(!1)},N=E=>{n(E.id),X(),D(I.CHIP_SELECTED,{chip:E.id,instruction_version:E.instruction_version})},ie=async()=>{if(O)try{await navigator.clipboard.writeText(O.instruction_text),y(!0),v(""),D(I.CHIP_INSTRUCTION_COPIED,{chip:O.id,instruction_version:O.instruction_version}),setTimeout(()=>y(!1),1800)}catch(E){v("Could not copy"),setTimeout(()=>v(""),2200)}},k=async()=>{if(!f){if(!O){g(S.compose.chip_missing);return}if(!e.trim()){g(S.compose.first_answer_missing);return}if(!r.trim()){g(S.compose.second_answer_missing);return}g(""),H(""),m(!0),D(I.CHIP_PAIR_INITIATED,{chip:O.id,instruction_version:O.instruction_version});try{let E=await vi({firstAnswer:e,targetedAnswer:r,chipId:O.id,instructionVersion:O.instruction_version,declaration:te});b(E)}catch(E){let le=E&&E.info||{};E&&E.status===400&&le.error==="too_long"?g(S.compose.too_long):E&&E.status===400&&le.error==="empty"?g(S.compose.too_short):E&&E.status===400&&le.error==="not_eligible"?H(S.compose.not_eligible):E&&E.status===400?H(S.compose.blocked):H(le&&le.message||S.compose.run_error)}finally{m(!1)}}},P=React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-chip-heading",className:"wb-reader-result__title"},S.value_statement.headline));return d?React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},P,React.createElement(Xi,{chip:d,entry:O,capture:J,onReset:R})):React.createElement("section",{className:"wb-reader-result is-agent wb-act2 wb-chip wb-scroll-anchor","aria-labelledby":"wb-chip-heading"},P,React.createElement("p",{className:"wb-act2__offer"},S.value_statement.sub),React.createElement(nt,{label:S.compose.first_answer_label,value:e,onChange:E=>{t(E),X()},placeholder:S.compose.first_answer_placeholder,minAckLength:1,readOnly:!!O}),O?React.createElement("div",{className:"wb-chip__edit-first"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:()=>n("")},`\u2190 ${S.compose.edit_first_answer}`)):null,React.createElement("div",{className:"wb-act2__capture wb-chip__choose",role:"group","aria-label":"Pick a follow-up"},React.createElement("p",{className:"wb-act2__capture-heading"},S.row_header),React.createElement("p",{className:"wb-act2__capture-intro"},S.row_support),React.createElement("div",{className:"wb-chip__row"},fa.map(E=>React.createElement("button",{key:E.id,type:"button",className:`wb-loop__chip wb-chip__pick${E.id===a?" is-active":""}`,"aria-pressed":E.id===a,onClick:()=>N(E)},E.approved_ui_label)))),O?React.createElement("div",{className:"wb-chip__instruction"},React.createElement("p",{className:"wb-act2__prompt-note"},S.card.framing),React.createElement("pre",{className:"wb-act2__prompt","aria-label":"Instruction to paste into your AI"},O.instruction_text),React.createElement("div",{className:"wb-reader-result__copy wb-act2__actions"},React.createElement(T,{kind:"primary",className:w?"is-copied":"",onClick:ie},w?S.compose.copy_done:S.compose.copy_label),A?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},A):null),React.createElement(nt,{label:S.compose.second_answer_label,value:r,onChange:E=>{s(E),X()},placeholder:S.compose.second_answer_placeholder,minAckLength:1}),React.createElement("div",{className:"wb-act2__capture",role:"group","aria-label":"How you ran the two answers"},React.createElement("p",{className:"wb-act2__capture-heading"},$.heading),React.createElement("p",{className:"wb-act2__capture-intro"},$.intro),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.same_model.question),React.createElement("div",{className:"wb-act2__capture-opts"},[Q.YES,Q.NO,Q.NOT_SURE].map(E=>React.createElement("button",{key:E,type:"button",className:`wb-act2__capture-opt${c===E?" is-active":""}`,"aria-pressed":c===E,onClick:()=>o(E)},$.same_model.options[E])))),React.createElement("div",{className:"wb-act2__capture-q"},React.createElement("label",{className:"wb-act2__capture-label",htmlFor:"wb-chip-model"},$.model_version.question),React.createElement("span",{className:"wb-act2__capture-hint"},$.model_version.hint),React.createElement("input",{id:"wb-chip-model",type:"text",className:"wb-act2__capture-input",value:i,maxLength:80,placeholder:$.model_version.placeholder,onChange:E=>l(E.target.value)})),React.createElement("fieldset",{className:"wb-act2__capture-q"},React.createElement("legend",{className:"wb-act2__capture-label"},$.edits.question),React.createElement("div",{className:"wb-act2__capture-opts"},[ce.NONE,ce.EDITED].map(E=>React.createElement("button",{key:E,type:"button",className:`wb-act2__capture-opt${_===E?" is-active":""}`,"aria-pressed":_===E,onClick:()=>u(E)},$.edits.options[E])))),React.createElement("p",{className:"wb-act2__capture-disclosure"},$.disclosure)),React.createElement("div",{className:"wb-action-row wb-act2__test-cta"},React.createElement(T,{kind:"primary",disabled:f||!se,onClick:k,className:`wb-reader-cta${se&&!f?" is-armed":""}${f?" is-inspecting":""}`},f?S.compose.comparing_label:S.compose.compare_label)),x?React.createElement("p",{className:"wb-act2__run-error",role:"status"},x):null,U?React.createElement("p",{className:"wb-act2__run-error",role:"status"},U):null):null,React.createElement("p",{className:"wb-reader-result__trust wb-measure__boundary"},S.boundary))}function Ji({sel:e}){let[t,a]=p(!1),[n,r]=p("");if(!(e!=null&&e.ready))return null;let s=async()=>{try{await navigator.clipboard.writeText(e.openPrompt||""),a(!0),r(""),setTimeout(()=>a(!1),1800)}catch(c){r("Could not copy"),setTimeout(()=>r(""),2200)}};return React.createElement("div",{className:"wb-run-plate wb-specimen-plate wb-measure-channel wb-reader-evidence"},React.createElement("div",{className:"wb-readout"},React.createElement("p",{className:"wb-reader-evidence__meta"},e.metaLabel,e.dateValue?` \xB7 ${e.dateLabel} ${e.dateValue}`:""),React.createElement("div",{className:"wb-readout__rule","aria-hidden":"true"}),React.createElement("div",{className:"wb-readout__signal wb-guided-trap"},React.createElement("p",{className:"wb-active-case__probe"},"Start with an ordinary question:"),React.createElement(Fa,{text:e.openPrompt})),e.reveal?React.createElement("div",{className:"wb-readout__section wb-guided-reveal"},React.createElement("div",{className:"wb-active-case__headline"},e.reveal)):null,React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste what it says back")),React.createElement("div",{className:"wb-guided-copy"},React.createElement(T,{kind:"ghost",small:!0,className:t?"is-copied":"",onClick:s},t?"Copied":"Copy question"),n?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},n):null)))}function ec({mode:e,sel:t,onAnother:a}){let[n,r]=p(!1),[s,c]=p(""),o=e==="guided",i=o&&Nt.find(u=>u.ready&&u.id!==(t==null?void 0:t.id))||null,l=o&&((i==null?void 0:i.openPrompt)||(t==null?void 0:t.openPrompt))||"";return o&&!l?null:React.createElement("section",{className:"wb-reader-result is-agent wb-loop wb-scroll-anchor","aria-labelledby":"wb-loop-heading"},React.createElement("div",{className:"wb-reader-result__head"},React.createElement("h2",{id:"wb-loop-heading",className:"wb-reader-result__title"},"TEST ANOTHER QUESTION")),o?React.createElement(React.Fragment,null,React.createElement("p",{className:"wb-loop__lead"},"Run the same check on a fresh question. Copy it, ask your AI, paste what it says back."),React.createElement("ol",{className:"wb-guided-steps"},React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"1")," Copy the question"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"2")," Ask your AI"),React.createElement("li",null,React.createElement("span",{className:"wb-guided-steps__n","aria-hidden":"true"},"3")," Paste the answer back")),React.createElement(Fa,{text:l})):React.createElement("p",{className:"wb-loop__lead"},"Run the same check on another answer."),React.createElement("div",{className:"wb-loop__actions"},o?React.createElement(React.Fragment,null,React.createElement(T,{kind:"ghost",small:!0,className:n?"is-copied":"",onClick:async()=>{try{await navigator.clipboard.writeText(l),r(!0),c(""),setTimeout(()=>r(!1),1800)}catch(u){c("Could not copy"),setTimeout(()=>c(""),2200)}}},n?"Copied":"Copy question"),s?React.createElement("span",{className:"wb-reader-result__copy-fail",role:"status"},s):null):null,React.createElement(T,{kind:"primary",small:!0,onClick:()=>a(i)},"Test another question")))}function tc({onDismiss:e}){return React.createElement("section",{className:"wb-return","aria-label":"Welcome back"},React.createElement("div",{className:"wb-return__body"},React.createElement("p",{className:"wb-return__headline"},"Welcome back."),React.createElement("p",{className:"wb-return__text"},"You started a check here before. Paste an answer to run another and watch what it leaves out.")),React.createElement("button",{type:"button",className:"wb-return__dismiss",onClick:e,"aria-label":"Dismiss"},"\xD7"))}var ac=["Paste an AI answer to see what it might be missing.","Copy the one question Imbas builds, then ask your own AI.","Paste its reply back and watch what surfaces."];function nc(){let[e]=p(()=>ya(qa())),t=e.loop_completion_rate,a=t==null?"\u2014":`${Math.round(t*100)}%`,n=e.counts||{},r=[["Runs started",n.run_started],["Runs completed",n.run_completed],["Results viewed",n.result_viewed],["Questions copied",n.target_question_copied],["Loops returned",n.loop_returned],["Loops completed",n.loop_completed],["States corrected",n.state_corrected],["Cards exported",n.card_exported],["Candidates submitted",n.candidate_submitted],["Return visits",n.return_visit]],s=e.completed_by_state||{},c=Object.keys(s).length>0;return React.createElement("section",{className:"wb-funnel","aria-label":"Reader funnel (this browser only)"},React.createElement("div",{className:"wb-funnel__head"},React.createElement("span",{className:"wb-funnel__eyebrow"},"Reader funnel \xB7 this browser only"),React.createElement("p",{className:"wb-funnel__northstar"},React.createElement("span",{className:"wb-funnel__northstar-num"},a),React.createElement("span",{className:"wb-funnel__northstar-label"},"of copied questions returned as completed loops"))),React.createElement("dl",{className:"wb-funnel__grid"},r.map(([o,i])=>React.createElement("div",{key:o,className:"wb-funnel__row"},React.createElement("dt",{className:"wb-funnel__label"},o),React.createElement("dd",{className:"wb-funnel__val"},i||0)))),c?React.createElement("div",{className:"wb-funnel__states"},React.createElement("span",{className:"wb-funnel__states-label"},"Completed by state"),React.createElement("ul",{className:"wb-funnel__states-list"},sa.map(o=>s[o]?React.createElement("li",{key:o,className:"wb-funnel__states-item"},pt[o]&&pt[o].chip||o,": ",s[o]):null))):null,React.createElement("p",{className:"wb-funnel__note"},"[Content-minimal: ids, enums, counts only \u2014 never answer or question text. Stored in this browser, nothing leaves your device.]"))}function rc({onTryOwn:e,onClose:t}){let a=tt,n=$t;return React.createElement("section",{className:"wb-demo","aria-labelledby":"wb-demo-heading","data-example":a.version},React.createElement("div",{className:"wb-demo__head"},React.createElement("span",{className:"wb-demo__eyebrow"},n.eyebrow),React.createElement("h3",{id:"wb-demo-heading",className:"wb-demo__title"},n.title),React.createElement("p",{className:"wb-demo__context"},a.context)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},n.question_label),React.createElement("p",{className:"wb-demo__q"},a.question)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},n.open_answer_label),React.createElement("p",{className:"wb-demo__answer"},a.open_answer)),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},n.left_out_label),React.createElement("p",{className:"wb-demo__leftout"},React.createElement("mark",{className:"wb-demo__mark"},a.left_out))),React.createElement("div",{className:"wb-demo__beat"},React.createElement("span",{className:"wb-demo__label"},n.prompt_label),React.createElement("p",{className:"wb-act2__prompt wb-demo__prompt"},a.targeted_prompt)),React.createElement("div",{className:"wb-loop__reveal wb-demo__reveal"},React.createElement("p",{className:"wb-loop__headline"},a.headline),React.createElement("div",{className:"wb-loop__panels"},React.createElement("div",{className:"wb-loop__panel"},React.createElement("span",{className:"wb-loop__panel-label"},kt),React.createElement("p",{className:"wb-loop__panel-body wb-loop__panel-body--muted"},ut)),React.createElement("div",{className:"wb-loop__panel wb-loop__panel--second"},React.createElement("span",{className:"wb-loop__panel-label"},xt),React.createElement("p",{className:"wb-loop__panel-body"},a.surfaced))),React.createElement("p",{className:"wb-demo__counts"},a.counts_line),React.createElement("p",{className:"wb-demo__why"},a.why_it_mattered),React.createElement("p",{className:"wb-loop__tag"},a.tag),React.createElement("p",{className:"wb-measure__boundary"},ne),React.createElement("p",{className:"wb-demo__smallprint"},n.smallprint)),React.createElement("div",{className:"wb-prov wb-demo__prov","data-complete":"yes"},React.createElement("span",{className:"wb-prov__heading"},n.provenance_heading),React.createElement("dl",{className:"wb-prov__list"},a.provenance.map(r=>React.createElement("div",{key:r.id,className:"wb-prov__row","data-field":r.id,"data-known":"yes"},React.createElement("dt",{className:"wb-prov__label"},r.label),React.createElement("dd",{className:"wb-prov__value"},r.body)))),React.createElement("p",{className:"wb-prov__note"},a.source_line)),React.createElement("div",{className:"wb-demo__cta-row"},React.createElement(T,{kind:"primary",small:!0,onClick:e},n.try_own_label),React.createElement("button",{type:"button",className:"wb-demo__close",onClick:t},n.close_label)))}function sc(){let[e,t]=p("own"),[a,n]=p(Nt[0]),[r,s]=p(""),[c,o]=p(""),[i,l]=p(""),[_,u]=p(""),[f,m]=p(!1),[d,b]=p(null),[w,y]=p({}),[A,v]=p(!1),[x]=p(()=>mi()),[g,U]=p(!1),H=L(!1),[G,O]=p(()=>yt(window.location).lane),[J,te]=p(()=>yt(window.location).lane===ge),[se,X]=p(!1),[R,N]=p(!1),[ie,k]=p(!1),P=L(null),E=L(null),le=L(!1),ye=L(Pn()),ue=L(null),Me=L(null),Ie=L(Sn),ve=L([]),Fe=L(1),C=L(null),Z=L(null),qe=L(null),be=L(!1),Be=L(null),ae=!!(e==="guided"?a.openPrompt:r).trim(),W=!!c.trim(),st=ae&&W,Rt=e==="own"&&W&&!ae,zr=f?"inspecting":d?d.source==="fallback"?"degraded":"result":st?"ready":Rt?"needQuestion":"idle",de=ga({lane:G,busy:f,hasResult:!!d,hasAct2:!!(d&&d.act2),followUpOpen:R,hasDelta:ie}),Oe=Ea(de),St=Oe.answerEntry==="compose-answer",jt=!!(d&&d.checks&&Array.isArray(d.checks.cards)&&d.checks.cards.length),Tt=()=>{Ie.current=ha};j(()=>{let h=Me.current,B=Ie.current;Ie.current=wa,Me.current=de,On(h,de)&&(Fe.current+=1,ve.current=[]);let z=In(de,{from:h,cause:B,seen:ve.current});z.emit&&(ve.current=ve.current.concat(de),D(I.STAGE_ENTERED,{stage:z.stage,prior_stage:z.prior_stage,cause:z.cause,occurrence:Fe.current,mode:e}))},[de]),j(()=>{let{stage:h}=yt(window.location);Cn(h,{lane:G,busy:!1,hasResult:!1}).rewrite&&window.history.replaceState(null,"",window.location.pathname+window.location.search)},[]),j(()=>{let{rerunShareId:h}=yt(window.location);if(!h)return;let B=!0;return fetch(`/api/inspection/${encodeURIComponent(h)}`).then(z=>z.ok?z.json():null).then(z=>{let He=z&&z.ok&&z.record?String(z.record.question||"").trim():"";!B||!He||(s(He),X(!0))}).catch(()=>{}),()=>{B=!1}},[]),j(()=>{if(!be.current){be.current=!0;return}let h=kn(de);window.location.hash!==h&&window.history.replaceState(null,"",window.location.pathname+window.location.search+h)},[de]),j(()=>{d||(N(!1),k(!1))},[d]);let Vr={"compose-answer":C,"paired-answer":Z};j(()=>{let h=Be.current;if(Be.current=de,h===null||h===de)return;let B=(Vr[Oe.focus]||qe).current;B&&typeof B.focus=="function"&&B.focus({preventScroll:!0})},[de]),j(()=>{let h=()=>{window.location.hash==="#wb-reader-console"&&t("own")};return h(),window.addEventListener("hashchange",h),()=>window.removeEventListener("hashchange",h)},[]),j(()=>{if(!le.current){le.current=!0,At();return}if(e!=="guided")return;let h=window.requestAnimationFrame(()=>$e(P.current));return()=>window.cancelAnimationFrame(h)},[a.id,e]),j(()=>{let{state:h,scroll:B}=Ln(ye.current,!!d);if(ye.current=h,B&&E.current){let z=window.requestAnimationFrame(()=>$e(E.current));return()=>window.cancelAnimationFrame(z)}},[d]),j(()=>{if(!d){ue.current=null;return}let h=Ca(d)||(d.source?`src:${d.source}`:"result");ue.current!==h&&(ue.current=h,D(I.RESULT_VIEWED,{run:Ca(d),source:d.source||"agent"}))},[d]),j(()=>{let h=!1;try{h=sessionStorage.getItem("imbas_reader_session")==="1"}catch(je){}let B=qa();if(B.length===0)return;if(!h){D(I.RETURN_VISIT);try{sessionStorage.setItem("imbas_reader_session","1")}catch(je){}}let z=ya(B),He=z.counts.target_question_copied||0,Y=z.counts.loop_completed||0;He>Y&&(D(I.RESTORED_SESSION,{}),v(!0))},[]);let zt=h=>{h!==e&&(t(h),y({}),b(null),m(!1),O(ft),h==="own"&&o(""))},Gr=()=>{G!==ge&&(Tt(),te(!0),O(ge))},Wr=()=>O(ft),Yr=()=>{R||(Tt(),N(!0))},Qr=h=>{h!==ie&&(h&&Tt(),k(h))},Kr=()=>{b(null),y({}),P.current&&window.requestAnimationFrame(()=>$e(P.current))},Xr=()=>{U(!0),H.current||(H.current=!0,D(I.RUN_STARTED,{mode:"demo",source:"demo"}))},Zr=()=>{U(!1),e!=="own"&&zt("own"),P.current&&window.requestAnimationFrame(()=>$e(P.current))},Jr=h=>{!h.ready||h.id===a.id||(n(h),o(""),b(null),y({}),m(!1))},es=h=>{b(null),y({}),m(!1),o(""),e==="guided"&&h&&n(h),P.current&&window.requestAnimationFrame(()=>$e(P.current))},za=h=>{o(h),y(B=>({...B,answer:""})),d&&b(null)},ts=h=>{s(h),y(B=>({...B,question:""})),d&&b(null)},Va=async()=>{if(f)return;let h={},B=e==="guided"?a.openPrompt:r,z=c;if(e==="own"&&!(B||"").trim()&&(h.question="Add the question you asked."),(z||"").trim()||(h.answer="Paste an answer to run The Reader."),Object.keys(h).length){y(h);return}y({}),Tt(),m(!0),b(null),D(I.RUN_STARTED,{mode:e});let He=wi({mode:e,sel:a,question:r,answer:z,topic:i,model:_});try{let Y=await gi(He);Ie.current=Y.source==="fallback"?Lt:ba,b(Y);let je=Ca(Y);if(D(I.RUN_COMPLETED,{run:je,mode:e,source:Y.source||"agent",eligible:!!(Y.act2&&Y.act2.eligible)}),Y.source==="fallback"){let Vt=Lr(Y).toLowerCase();ra(Vt)&&D(I.CAPACITY_DEGRADATION,{run:je,mode:e,reason:Vt}),Vt==="timeout"&&D(I.TIMEOUT,{run:je,mode:e,reason:"timeout"})}Y.capture_uncertain&&D(I.CAPTURE_UNCERTAIN,{run:je,mode:e})}catch(Y){Y&&Y.message==="too_long"?y({answer:"Answer is over 1200 words. Trim it and re-run."}):(Ie.current=Lt,b({source:"fallback",display_treatment:"muted",the_read:Ht(),what_was_left_out:[],how_it_was_shaped:"",reason:String(Y.message||"network")}),D(I.RUN_COMPLETED,{mode:e,source:"fallback",eligible:!1}),Y&&Y.message==="read_429"&&D(I.CAPACITY_DEGRADATION,{mode:e,reason:"capacity"}))}finally{m(!1)}};return React.createElement("div",{className:"wb-reader-v2"},React.createElement("div",{className:"wb-reader-v2__stack"},A&&!d?React.createElement(tc,{onDismiss:()=>v(!1)}):null,Oe.pasteBox?React.createElement("div",{ref:P,id:"wb-reader-console",className:"wb-console wb-reader-console wb-scroll-anchor"},React.createElement("div",{className:"wb-console__main"},React.createElement("div",{className:"wb-reader-v2__modes wb-reader-v2__modes--inline",role:"tablist","aria-label":"Workbench mode"},React.createElement("button",{type:"button",role:"tab","aria-selected":e==="own",className:`wb-reader-v2__mode wb-focus${e==="own"?" is-active":""}`,onClick:()=>zt("own")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Paste Your Own"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Bring any AI answer.")),React.createElement("button",{type:"button",role:"tab","aria-selected":e==="guided",className:`wb-reader-v2__mode wb-focus${e==="guided"?" is-active":""}`,onClick:()=>zt("guided")},React.createElement("span",{className:"wb-reader-v2__mode-name"},"Guided Case"),React.createElement("span",{className:"wb-reader-v2__mode-desc"},"Start with an example Imbas has already run."))),e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-case-selector wb-reader-case-grid"},Nt.map(h=>React.createElement("button",{key:h.id,type:"button",className:`wb-case-card wb-specimen-plate wb-focus wb-measure-channel${h.id===a.id?" is-active":""}${h.ready?"":" is-disabled"}`,onClick:()=>Jr(h),disabled:!h.ready,title:h.title},h.ready?React.createElement("div",{className:"wb-specimen-plate__label wb-reader-case-card__label"},h.cardLabel):React.createElement(Te,null,"To add"),React.createElement("div",{className:"wb-case-card__title"},h.cardTitle)))),React.createElement(Ji,{sel:a})):React.createElement("div",{className:"wb-reader-v2__own-header"},se?React.createElement("p",{className:"wb-reader-v2__own-intro wb-reader-v2__own-intro--rerun"},"You carried this question over from a record you were reading. Ask your AI again and paste what it says today. Imbas asks nothing on your behalf. What comes back becomes its own record with its own date, and the one you came from does not change."):React.createElement("p",{className:"wb-reader-v2__own-intro"},"Paste an AI answer below. The Reader inspects what it might be missing.")),React.createElement("div",{className:`wb-confirm-block wb-reader-confirm wb-flow-module${e==="own"?" wb-reader-confirm--own":""}`},e==="guided"?React.createElement(React.Fragment,null,React.createElement(Te,null,"Confirm it yourself"),React.createElement("p",{className:"wb-reader-confirm__lead"},"Paste the answer you got. The Reader will inspect how it handled the question.")):null,React.createElement("div",{className:"wb-reader-v2__fields"},e==="guided"?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(he,{label:"Which AI did you ask? (optional)"},React.createElement(xa,{value:_,onChange:u}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(nt,{label:"AI answer received",value:c,onChange:za,error:w.answer,placeholder:"Paste the full AI answer here\u2026",minAckLength:1,readOnly:!St,inputRef:C}))):React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--answer"},React.createElement(nt,{label:"AI answer received",value:c,onChange:za,error:w.answer,placeholder:"Paste an AI answer. Anything from ChatGPT, Gemini, Claude\u2026",minAckLength:1,readOnly:!St,inputRef:C})),W||ae?React.createElement("div",{className:"wb-reader-v2__reveal"},React.createElement("div",{className:"wb-reader-v2__field"},React.createElement(he,{label:"Question asked"},React.createElement("textarea",{className:Ee,value:r,onChange:h=>ts(h.target.value),placeholder:"What did you ask the model?",rows:3,style:rt,"aria-invalid":!!w.question,readOnly:!St||void 0,"aria-readonly":!St||void 0})),w.question?React.createElement("div",{className:"wb-field-error",role:"alert"},w.question):null,Rt&&!w.question?React.createElement("div",{className:"wb-field-error wb-field-error--hint",role:"status"},"Add the question you asked."):null),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(he,{label:"Optional topic / context"},React.createElement("input",{className:Ee,value:i,onChange:h=>l(h.target.value),placeholder:"e.g. climate policy, drug pricing\u2026",style:rt}))),React.createElement("div",{className:"wb-reader-v2__field wb-reader-v2__field--optional"},React.createElement(he,{label:"Which AI did you ask? (optional)"},React.createElement(xa,{value:_,onChange:u})))):null)),React.createElement("div",{className:"wb-reader-v2__action-row","aria-busy":f},React.createElement(Si,{state:zr}),React.createElement("details",{className:"wb-reader-v2__privacy"},React.createElement("summary",{className:"wb-reader-v2__privacy-line"},"Inspections aren't published to our reviewed archive. Don't paste anything sensitive."),React.createElement("p",{className:"wb-reader-v2__privacy-full"},"Inputs are used for this inspection and are not automatically published to the reviewed archive. Do not paste sensitive personal, confidential, privileged, regulated, or proprietary information. Reader outputs inspect answer behavior and are not professional advice; verify factual claims before relying on them. See ",React.createElement("a",{href:"/retention.html"},"what deletion means")," and the ",React.createElement("a",{href:"/privacy.html"},"privacy policy"),".")),d?React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row wb-reader-v2__cta-row--edit"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-edit-answer",onClick:Kr},"\u2190 Edit the answer")):React.createElement("div",{className:"wb-action-row wb-reader-v2__cta-row"},React.createElement(T,{kind:"primary",disabled:f||!st,onClick:Va,className:`wb-reader-cta${st&&!f?" is-armed":""}${f?" is-inspecting":""}`},f?"Inspecting\u2026":"See what might be missing")))))):null,Oe.pasteBox?React.createElement(React.Fragment,null,React.createElement("div",{className:"wb-demo-trigger-row"},React.createElement("button",{type:"button",className:"wb-demo-trigger",onClick:g?()=>U(!1):Xr,"aria-expanded":g},g?$t.close_label:$t.trigger_label)),g?React.createElement(rc,{onTryOwn:Zr,onClose:()=>U(!1)}):null,React.createElement("details",{className:"wb-clarity"},React.createElement("summary",{className:"wb-clarity__summary"},"How it works"),React.createElement("ol",{className:"wb-clarity__steps"},ac.map((h,B)=>React.createElement("li",{key:B,className:"wb-clarity__step"},React.createElement("span",{className:"wb-clarity__num","aria-hidden":"true"},B+1),React.createElement("span",{className:"wb-clarity__text"},h)))))):null,d?React.createElement("div",{ref:h=>{E.current=h,qe.current=h},tabIndex:-1,className:"wb-reader-v2__result wb-scroll-anchor"},d.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--hero"},React.createElement($i,{result:d})):null,d.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--measure"},React.createElement(Bi,{result:d,context:{mode:e,sel:a,question:r,answer:c,model:_,topic:i}})):null,React.createElement("div",{className:"wb-reader-v2__follow"},React.createElement(Di,{result:d,context:{mode:e,sel:a,question:r,answer:c,model:_,topic:i},onRunAgain:Va})),jt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--checks"},React.createElement(Qi,{result:d})):null,d.measurement?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--meaning"},React.createElement(jr,{pairRuns:[],findings:ct(d.result,"surfaced_findings"),available:{checks:jt,reviewRecord:jt,receipt:!!(d.measurement&&d.receipt),followUp:!!(d.act2&&d.act2.eligible),restart:!0}})):null,d.measurement&&d.receipt?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--perception"},React.createElement(qr,{mode:"single",receipt:d.receipt})):null,d.act2?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--act2"},React.createElement(Ki,{result:d,open:R,onOpen:Yr,onPairedChange:Qr,pairedInputRef:Z})):null,Oe.loop?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--loop"},React.createElement(ec,{mode:e,sel:a,onAnother:es})):null,React.createElement("p",{className:"wb-reader-v2__post-privacy"},"This inspection wasn't published to our reviewed archive. See ",React.createElement("a",{href:"/retention.html"},"what deletion means"),".")):null,Oe.chipDoor?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--chip-door"},React.createElement("button",{type:"button",className:"wb-demo-trigger wb-chip-door",onClick:G===ge?Wr:Gr,"aria-expanded":G===ge,"aria-controls":"wb-chip-lane"},G===ge?"Hide follow-up checks":"Show follow-up checks")):null,J?React.createElement("div",{id:"wb-chip-lane",className:"wb-reader-v2__follow wb-reader-v2__follow--chips",hidden:!Oe.chipLane},React.createElement(Zi,null)):null,React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--suggest"},React.createElement(Pr,{variant:"reader-secondary"})),x?React.createElement("div",{className:"wb-reader-v2__follow wb-reader-v2__follow--funnel"},React.createElement(nc,null)):null))}function oc(){let e=L(null),[t]=p(()=>_i());return j(()=>{At();let a=()=>At();return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),React.createElement("div",{className:`wb-shell${t?" wb-shell--reader-v2":""}`,style:{color:q.text,minHeight:"100vh",fontFamily:K}},React.createElement("style",null,qo),React.createElement("style",null,Bo,Ho,jo,zo,Vo),React.createElement("div",{className:"wb-shell__frame"},React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}},React.createElement("div",{style:{fontFamily:Se,fontSize:22,letterSpacing:"0.02em"}},"Imbas"),React.createElement("div",{style:{fontFamily:ee,fontSize:11,letterSpacing:"0.18em",color:q.textFaint,textTransform:"uppercase"}},"Workbench")),React.createElement("div",{style:{height:1,background:q.line,marginBottom:22}}),t?React.createElement("div",{className:"wb-reader-v2__flow"},React.createElement("p",{className:"wb-reader-v2__eyebrow"},"WORKBENCH"),React.createElement("h1",{ref:e,className:"wb-scroll-anchor wb-reader-v2__headline"},"Check your AI answer."),React.createElement("p",{className:"wb-reader-v2__subcopy"},"Paste an AI answer. The Reader shows what surfaced, what might be missing, and how it was shaped."),React.createElement(sc,null),React.createElement("div",{className:"wb-reader-v2__trust"},React.createElement("div",{className:"wb-reader-v2__trust-rule","aria-hidden":"true"}),React.createElement("p",{className:"wb-reader-v2__trust-note"},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication.")),React.createElement("div",{className:"page__cta-row wb-context-links wb-reader-v2__context-links"},React.createElement("a",{href:lr},"View ",cr.shortLabel," ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")))):React.createElement(React.Fragment,null,React.createElement("h1",{ref:e,className:"wb-scroll-anchor",style:{fontFamily:Se,fontSize:"clamp(28px, 5vw, 40px)",fontWeight:500,lineHeight:1.15,margin:"0 0 10px"}},"See what your AI leaves out."),React.createElement("p",{style:{fontFamily:K,fontSize:16.5,lineHeight:1.6,color:q.textDim,margin:"0 0 22px",maxWidth:560}},"Ask a model an open question and it can quietly skip the one fact that changes the picture. Pick a case, run it on your own AI, and see."),React.createElement("div",{className:"page__cta-row wb-context-links",style:{marginTop:0,marginBottom:22,paddingTop:0,borderTop:"none"}},React.createElement("a",{href:"/volunteer-gap.html"},"Read the Volunteer Gap ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:lr},"View ",cr.shortLabel," ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192")),React.createElement("a",{href:"/archive.html"},"Explore the Archive ",React.createElement("span",{className:"arrow","aria-hidden":"true"},"\u2192"))),React.createElement(Ri,null)),t?null:React.createElement(React.Fragment,null,React.createElement("div",{style:{height:1,background:q.line,margin:"48px 0 16px"}}),React.createElement("div",{style:{fontFamily:ee,fontSize:11,color:q.textFaint,lineHeight:1.7,letterSpacing:"0.03em"}},"Behavior, not intent. Results are provisional. Archive entries are reviewed before publication."))))}var ic=ReactDOM.createRoot(document.getElementById("workbench-root"));ic.render(React.createElement(oc,null));})();
