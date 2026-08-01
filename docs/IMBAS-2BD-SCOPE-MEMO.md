# IMBAS-2BD-SCOPE-MEMO v0.2 — CONTROLLING D-PREP DOCUMENT

STATUS AT COMMIT: v0.2 founder-ratified 2026-07-30 (ratification record below). This file controls from this commit forward; D's brief-time session reads it from the tree, never from a paste. Gate state: B merged (imbas-site master 2ff97e7ebbd8d7c6c3e0b5254539147833c04d00, 2026-07-31); the current Wave 0 sitting reconciled — PENDING; C's final seam known — PENDING. The body below is the ratified v0.2 text verbatim, sections 0-10, from the 2026-07-29/30 review thread; later ratified additions appear only in the labeled AMENDMENTS section and nowhere inside the v0.2 body.

---

IMBAS-2BD-SCOPE-MEMO v0.2 — SHAPE PASSED BY BOTH REVIEWERS. AWAITING FOUNDER RATIFICATION. NOT A BRIEF. NOT FIREABLE. Implementation gates: B merged; the current Wave 0 sitting reconciled; C's final seam known.

0. DECISIONS ENCODED (both reviewers aligned; founder ratification pending)
- Evidence Ladder: OUT. Admission test, run on the record: what exact record state does a ladder make representable that claim state + candidate status + disposition + typed relations cannot? Result: none identified. "Replicated material change" is expressible as N capture_relations of type same-question-across-time whose linked review events carry material dispositions; "corroborated across providers" as the cross-provider relation with the same property. Any future proposal re-runs this test on the record before admission.
- Shape: D1/D2 recommended. Single-D survives only if the file inventory at brief time proves the seam forces duplicate or throwaway schema work.
- Schema: Wave 0's field vocabulary is the founding capture schema. D may normalize names, cardinality, enums, and ownership where implementation requires; no Wave 0 meaning changes silently; every rename or split carries an explicit mapping; all governed manifest rows must import without interpretive reconstruction. Semantic continuity, not byte worship.

1. FILE-LEVEL SCOPE — C-GATED PLACEHOLDER. Populated after C merges, from the post-C tree. Known now: D1 introduces new modules (registry, source-observation custody, relations, import) and touches no existing api/ semantics; D2 touches the share layer additively only, consuming C's receipt component. Placeholder fields: [D1 write set], [D2 write set], [post-C master SHA].

2. SEAM AND DEPENDENCY GRAPH
D1 — registry and custody: question-series registry; capture lineage; source-surface artifacts with custody; Wave 0 import; reference-change ledger formalized from the operating wave-0 file; relation identifiers (typed links exist, uninterpreted).
D2 — comparison and publication: comparison semantics over D1's relations; instrument rerun workflow; side-by-side comparison share; dated-record treatment for comparisons.
SEAM LAW, binding: D1 may create capture and relation records but may not compute or publish a comparison claim. D2 may consume D1 records but may not mutate their captured artifacts, conditions, hashes, or lineage. Enforcement lands at brief time as test-level assertions in the zero-score-scan pattern: D1 modules export no comparison computation; D2 holds no write path into D1 records.
Dependencies: Wave 0 records → D1 import (D1's acceptance proof). D1 registry + relations → D2 comparisons. C's single-capture dated receipt → D2's comparison share (extends it, never forks it). API-spec lane → any scheduled rerun (out of both).
The seam holds because D1 establishes what exists and who owns it; D2 decides what may be inferred, compared, rerun, and published from it. Nothing in D2 is needed to make D1's records true.

3. WAVE 0 → D FIELD MAPPING (founding vocabulary; every change explicit)
Adopted unchanged: question_group_id; question_sha256; prompt_role; research_status (STANDARD/EXPLORATORY); capture_id; provider / provider_code / provider_surface; model_label_displayed; capture_status enum (PLANNED, COMPLETE, REFUSAL, ERROR, TRUNCATED, PARTIAL_INTERFACE, UNREACHABLE, CONDITION_COMPROMISED); the four artifact statuses with the NOT_PRESENT / NOT_CAPTURED distinction; signed_in_state; browsing_search_status; fresh_chat_confirmed; timestamps with timezone; environment_ref; artifact_hashes; invalidation_status / invalidation_reason; compromises_ref; CPA instrument references (generalized: instrument_version on every observation row).
Normalized with mapping: replicate_of_pair (string key) → capture_relation rows of type REPLICATE; the original replicate_of_pair value is preserved on the imported row as provenance, and the mapping (slotN-PROVIDER → member capture_ids) is recorded in the import report. planned/actual_order_position and slot → wave/run object fields, not series fields (a series outlives any wave's schedule). order_deviation_reason rides the run object. Registry side adopts the bank's family registration verbatim: primary prompt, information need, wording sensitivities, authorized variants with per-variant roles and hashes, neutral-comparison marker, pressure_rationale, MATERIAL/IMMATERIAL change-review threshold, durable-authority reference.
Relation types (closed enum at D1, semantics at D2): REPLICATE; SAME_QUESTION_ACROSS_TIME; SAME_QUESTION_ACROSS_PROVIDERS; AUTHORIZED_VARIANT; CHANGED_CONDITIONS; CONTROL_COMPARISON.

4. ARTIFACT OWNERSHIP RULES
One owner per artifact. Answer text, inline citations, source panel, suggested follow-ups, screenshot: separate artifacts, never merged, each with role, ordinal, displayed text, url/domain where present, resolution status, instrument_version. Hashes immutable; every amendment is metadata-only under the CPA pattern. A span or observation resolves only against the artifact it cites; source-panel or follow-up text never becomes answer quotation by co-presence. An unavailable surface is NOT_CAPTURED, never an empty set.

5. COMPARISON-RELATION MODEL (D2)
No universal drift score, ever. Comparisons are per-dimension observations over an explicit relation: answer-text change; surfaced-finding change; source-set and source-order change; lead-proposition change; standard-or-threshold change; follow-up-suggestion change. Each observation carries its relation, its dimension, its basis, and its claim ceiling; material/immaterial screening uses the series' preregistered threshold and routes to human review — the threshold gates review entry, never establishes drift. EXPLORATORY families (both geopolitics series) produce relations and observations but no findings, comparisons-as-findings, or drift claims until an adopted construct ruling with external-authority anchors covers the family.

6. SOURCE-OBSERVATION CUSTODY MODEL
source_observation rows attach to a capture's specific artifact, carrying artifact_role (inline_citation / source_panel / browser_result / suggested_follow_up), ordinal position, displayed text, exact url where present, normalized domain where derivable, position relative to the answer, visual emphasis where captured, resolution_status, captured_at, instrument_version. First outputs are purely observational: domains added or removed, order changes, concentration changes, follow-ups added or removed, citations that stop resolving. No source-quality judgment anywhere in D.

7. SHARE BOUNDARY
C owns, untouched by D: the single-capture permalink migration, its consent copy, the dated capture receipt, and the product rerun ("run this exact question again" through the Reader). D2 owns only the side-by-side comparison share: same frozen question across providers or dates, explicit relation shown, separately preserved records, observed differences with conditions and limitations, no automatic manipulation or causation claim — built on C's receipt component additively. The instrument rerun (governed re-ask of a tracked question under capture protocol, new capture_id, inherits question_group_id, never overwrites) is D2's and never renders as a product feature. Two reruns, two names, no leakage.

8. EXPLICIT EXCLUSIONS
Scheduler and any automated re-capture (API-spec lane). Attribution, intent, campaign responsibility, poisoning conclusions. Source-quality judgment. Universal drift scoring. Evidence Ladder (test result above). C's migration scope. Any api/ or reader-result.js semantic change. Backfill or retrospective reconstruction of any prior row.

9. ACCEPTANCE — CRITERIA NOW, BOARD SHAPE C-GATED
All Wave 0 manifest rows import with zero interpretive reconstruction. For every planned row, D1 preserves: its final capture status; every artifact status; capture-procedure version; conditions and compromises references; lineage and relation identifiers; hashes for every preserved artifact. No row is dropped because it is incomplete, unreachable, errored, partially observed, or inconvenient. The imported row count must equal the final governed manifest row count — which may exceed the planned 58, since the continuity rules create new capture_ids for retries referencing first attempts.
Further criteria: bank regeneration from the registry reproduces the frozen question hashes; relations typed against the closed enum, zero orphans; the instrument rerun produces a new capture_id, inherits the group id, overwrites nothing; instrument_version present on every observation row; NOT_PRESENT / NOT_CAPTURED survives end to end; the EXPLORATORY gate enforced at the relation/disposition layer; the seam law enforced by test. Board scenarios and baselines: [C-gated placeholder].

10. STOP CONDITIONS
Import requires interpretive reconstruction → STOP, semantic-continuity violation, founder ruling. File inventory shows the D1/D2 seam forcing duplicate schema work → STOP, single-D decision returns to founder with the inventory. Any requirement to touch api/ semantics → STOP, API-lane deferral recorded. Any proposed taxonomy beyond the closed relation enum and existing claim vocabulary → runs the admission test on the record first.

---

## RATIFICATION RECORD (founder, 2026-07-30, verbatim)
Ratified.
Item 0 and the seam law are correct as written.
The strongest corrections are now locked:

* Evidence Ladder stays out unless it makes a concrete record state representable that the existing claim state, candidate status, disposition, and typed relations cannot.
* D1/D2 is the working architecture. D1 establishes custody and identity; D2 governs comparison and publication.
* Wave 0 is founding schema input, not a disposable pilot format.
* Import acceptance keys to the final governed manifest count, not the planned 58.
* No governed row is excluded because its status is inconvenient or incomplete.
* Instrument versions travel with observations.
* D1 cannot compute comparison claims.
* D2 cannot mutate D1 evidence.
* C retains single-capture sharing; D2 owns only relation-based comparison sharing.
* No universal drift score.
* Exploratory geopolitical families remain observational until a construct ruling authorizes findings.

The memo is correctly stopped at the boundary of known facts. The remaining placeholders genuinely require:

1. B's corrected merged state;
2. the reconciled Wave 0 manifest;
3. C's post-merge file and component seam.

No further D drafting should occur before one of those inputs changes. Keep IMBAS-2BD-SCOPE-MEMO v0.2 as the controlling prep document.

## AMENDMENTS — INCORPORATED RATIFIED ADDITIONS (2026-07-30 thread; do not edit the v0.2 body above)
A1. FIFTH CARRIAGE MODE: ANSWER_TEXT_MENTION joins the artifact roles of section 6 — a domain named inside the answer prose is a different fact than a citation. Mode, ordinal, displayed text, and date preserved; "surface migration" recorded as a named future research object, observed only, never scored. The relation enum of section 3 is unchanged.
A2. FUTURE-COMPATIBLE ADMISSION FIELDS, nullable and inert now: capture_operator_id, capture_tool_version, capture_procedure_version, operator_attestation, custody_status, admission_status, independent_replication_of; state ladder submitted → schema-valid → custody-verified → independently replicated → admitted. Intake stays HELD; the importer is specced as governed external capture record → registry, Wave 0 as its first instance — the doorway exists, the door stays closed.
A3. D2 CHANGE PACKET admission gate, all four before any public reviewed finding: identity (registered question or authorized variant); comparability (conditions and instrument versions support it); variation floor (difference exceeds ordinary variation as evidenced by the replicate record, with the floor's coverage limits stated in the packet); external context (reference-change ledger reviewed). The held Answer Incident Packet is merged or killed against this format at D2 brief time.
A4. Instrument Health Receipt: one per wave, the instrument publishes its own condition — failures, amendments, compromises included; first instance ships in Wave 0 close-out.
