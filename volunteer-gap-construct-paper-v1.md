# The Volunteer Gap: A Behavioral Measurement Construct for What AI Systems Surface and Omit

**Brendan Nestor, Imbas · Working paper v1.0 · July 2026 · imbaslabs.com**

*Status: working paper. This document defines the construct the Imbas instrument measures. It is versioned; changes are logged, never silently edited. The companion whitepaper reports the instrument, governance, and results in full. Comments and challenges: see the challenge policy at imbaslabs.com.*

---

## Abstract

AI answers are becoming a default layer between people and information. Each answer looks complete to the person receiving it, because the person sees only what surfaced. This paper defines the Volunteer Gap: the measured difference between what an AI system surfaces in response to an open prompt and what it demonstrably produces under a targeted prompt in matched capture conditions. The construct measures surfacing behavior. It does not adjudicate truth, does not rank capability, and makes no claim about intent. Its central methodological move is that availability is established internally: the model's own targeted response is the evidence that the omitted material was producible under the same conditions, which removes the need for an external arbiter on availability. One human judgment remains and is named as such: materiality, which is prewritten per case, held as part of the case record, and open to challenge. The paper states the construct's definition, its operationalization, its scoring model, the principal threats to its validity and the control answering each, and its relation to adjacent constructs. Known limitations are stated flat. In the v1 study (May 2026), 13 cases were measured across 4 frontier models under this construct; those results are reported in the companion whitepaper and on the public record.

---

## 1. The measurement problem

Three properties of AI-mediated answers make a dedicated construct necessary.

**Answers are ephemeral.** An open question returns one answer, which shapes what the asker notices, believes, or does, and then disappears. Unlike a published article, the answer leaves no public record. It cannot be cited, compared, or contested after the fact unless it was captured when it existed.

**The pattern is invisible at the individual level.** One answer that omits the mechanism that matters is marginal. A repeated omission pattern across a model's answers exists only in aggregate, across an instrument applied over time. No single user is positioned to see it, which means no single user can be expected to correct for it.

**No measured party will publish this about itself.** Model developers run internal evaluations, on benchmarks they select, reported at their discretion. Whatever those evaluations find about surfacing behavior at the answer layer, an independent public record and a self-report from the examined party are different classes of evidence. The construct exists so that an independent record is possible at all.

A measurement construct is required before any of this can be recorded rather than merely asserted. Without one, claims about what AI answers leave out reduce to anecdote, and anecdote is the thing this instrument was built to exclude.

## 2. Construct definition

**The Volunteer Gap is the measured difference between what an AI system surfaces in response to an open prompt and what it demonstrably produces under a targeted prompt in matched capture conditions.**

Three terms carry the weight.

**Surfaces.** What the answer actually contains, as delivered to the user, quoted verbatim from a preserved capture. Not what the model could say, not what its training data contains, not what a different prompt might elicit. The unit of observation is the answer a user would have received.

**Demonstrably produces.** The construct's ground condition. A targeted prompt names the specific item the open answer omitted, for example a statute, a mechanism, a named warning, a counterparty, and asks about it directly under the same capture conditions. If the model then produces the item accurately, producibility under matched conditions is established by the model's own output. Throughout this paper, "possession" is defined shorthand for exactly that operational fact and nothing stronger: no claim is made about stable internal knowledge, representation, or what the model "knows." This is the construct's central move, and its scope is narrow on purpose: the availability standard is internal, the model compared against its own targeted output, no external authority consulted. What the answer should have contained, materiality, is a separate human judgment, handled below.

**Measured difference.** The gap is scored on a published 0 to 3 ordinal scale, by a human reviewer, with every score traceable to quoted output. The anchor definitions: 0 means no meaningful gap; 3 means major information was left out of the open answer.

One qualifier is built into the definition, and everything downstream leans on it: **the gap counts only when the omitted item is material to the open question, not when a narrower prompt simply yields a narrower answer.** A shorter answer is not a gap. A missing tangent is not a gap. Materiality is not a free-floating judgment: every case carries a prewritten materiality criterion, written before scoring and held as part of the case record. The working standard for writing those criteria is whether the open question can be competently answered without the item, and both the criterion and its application in scoring are open to challenge under the standing challenge policy. Materiality is the one place the construct relies on human judgment, and it is disclosed as such rather than dressed as a mechanical test.

## 3. What the construct claims, and what it refuses to claim

The construct's claims are narrow by design, and the refusals are part of the definition, not disclaimers appended to it.

**It claims:** that under documented conditions, a specific model surfaced a specific answer to an open prompt; that the same model, asked directly, produced specific material absent from that answer; that the materiality of the absence was scored against a published rubric; and that the capture, the prompts, and the scores are preserved and checkable.

**It refuses to claim intent.** The construct records that a model did not surface an item, never that it withheld, hid, or chose to omit it. Surfacing behavior has many possible causes: training distribution, safety policy, decoding dynamics, interface constraints, fine-tuning objectives. The instrument does not distinguish among them and does not pretend to. Behavior, not intent, is a formal reporting rule of the instrument, not a stylistic preference.

**It refuses to adjudicate truth.** The Volunteer Gap is not fact-checking. An answer can be entirely accurate and still carry a large gap; an answer can be gap-free and wrong. The construct measures the distance between surfaced and produced, and production is established by the model's own targeted output, not by the reviewer's view of the truth.

**It refuses to rank capability.** A gap score is not a quality score, a benchmark, or a leaderboard entry. Models are compared to themselves under two prompt conditions; cross-model aggregate comparisons are reported descriptively with the sample stated, never as rankings.

**It refuses the word "bias" as a finding.** The instrument's reporting rule is of the form: these models surfaced X with frequency Y under condition Z. Whether a measured pattern constitutes bias in any evaluative sense is an interpretation the record enables others to argue; it is not a measurement the instrument outputs.

## 4. Operationalization

The construct is operationalized as a paired-prompt protocol with preserved custody.

**The pair.** Each case consists of an open prompt, the question a real user would plausibly ask, and one or more targeted prompts naming the candidate omitted items. Prompts are frozen in a registry before capture and hash-verified; the prompt as run is byte-identical to the registry entry or the deviation is recorded.

**Capture conditions.** Every capture is taken in a fresh conversation with memory and personalization documented, on a recorded surface, with the model version determined by a stated method and the determination method itself recorded. Captures are preserved verbatim under content-addressed custody: the response bytes, a hash, the timestamp, the conditions. Refusals are captures; a refusal is model behavior and is recorded as such.

**The three signal patterns.** Scored gaps are typed, because "something was missing" is not yet a measurement. The v1 typology: **Omission**, a material item absent from the open answer and produced under the targeted prompt; **Framing Drift**, the same substance surfaced under a materially different frame depending on prompt wording, such that what the user takes away changes; **Deflection**, the open answer routing around the question's load-bearing element, answering adjacent to it rather than about it. The typology is versioned with the rubric and may be extended by recorded decision, never by drift.

**Scoring.** Scores are assigned by a human reviewer against the published rubric, with a per-case rubric instantiation written before scoring that states what would count as material for that case, held as part of the case record, and challengeable under the standing challenge policy. Every score cites quoted spans from the captures. No model scores evidence; automated judgment is excluded from the validated record by constitutional rule, for the reason in section 7.

**Controls.** Alongside hypothesis cases, cases selected because a material gap was considered plausible, the protocol runs control cases where no particular gap is expected. Controls exist to answer the confound in section 6.1 and to keep the scale's zero honest. In the v1 study, the control set's lower bound included scores at 0.75 and a perfect 0; the record retains them.

**Custody and supersession.** Published case records are never silently edited. Corrections and updates are by append, with the original preserved. Rejected and contaminated captures are retained as method documentation rather than deleted.

## 5. Measurement model and reporting rules

**The scale is ordinal.** 0 to 3 with published anchors. Distances between points are not asserted to be equal; a 2 is not "twice" a 1. Aggregate figures, such as a mean gap across cases, are reported as descriptive summaries of the sample, with the sample always stated, and carry no claim of interval properties.

**The tier rule.** No number about the record is stated bare. Every count and every summary carries its tier: the v1 study (13 cases across 4 frontier models, May 2026, methodology public), the public archive ledger, or evidence custody. This is a reporting rule of the instrument because a bare number is itself a small omission, and the instrument should not exhibit the behavior it measures.

**Sample-first phrasing.** Findings are reported in the form "across N models on N cases" before the finding, not after it. Illustrative single cases are labeled as illustrative.

**Two vocabulary tiers, one construct.** The instrument produces **validated scores**: human-assigned, constitutionally gated, evidence-tier. The Imbas Reader, the consumer inspection surface, produces **machine gap estimates**: the same construct, same scale, same typology, estimated by an automated inspector, always labeled unvalidated, and never entering the evidence record. Machine gap estimates are heuristic product output, not instrument measurements; the shared vocabulary exists for commensurability, not equivalence. The two tiers share one vocabulary so that a Reader estimate and an archive score are commensurable statements about the same construct at different evidence standards. Agreement between machine estimates and subsequent validated scores on the same runs is itself a planned, published measurement; until that calibration data exists, no accuracy claim is made for the estimates.

## 6. Threats to validity, and the control answering each

A construct is defined as much by its named failure modes as by its definition. Seven, each with the control and the honest residual.

**6.1 The coverage-density confound.** The sharpest threat: an open-prompt omission might reflect where an item sits in the model's output distribution rather than any behavior worth measuring, and the targeted prompt might succeed simply because naming a thing raises its salience. Control: possession, as defined, is weak by construction, the construct asserts producibility under matched conditions, nothing about ease of retrieval or internal representation; control cases calibrate the baseline gap that ordinary narrowing produces; and the materiality qualifier excludes narrower-prompt-narrower-answer artifacts by rule. Residual: the construct cannot, from a single case, distinguish "structurally unlikely to surface" from any stronger claim, and does not try to. The measured object is the surfacing pattern itself, whatever its cause. Establishing an item's centrality independently of the omission is a design obligation on case construction, and case selection rationales are published so this can be contested per case.

**6.2 Prompt sensitivity.** The objection that the whole effect is "just prompt engineering." Control: prompting is the probe, not the finding. The finding is the measured distance between two documented, frozen, re-runnable conditions. One clever prompt is an anecdote; the same frozen prompts across models and time, with scored deltas, is an instrument. Where sensitivity itself is the object, the protocol turns it into the measurement: in the v1 study, one case ran the same substance under neutral and controversy-inviting framings, and one model's score moved 3 full points on the 0 to 3 scale on framing alone. That is Framing Drift measured, not a confound tolerated. Residual: results are conditional on the frozen prompts; generalization beyond them is a claim the record does not make.

**6.3 Sampling variance.** Model outputs are stochastic; a single capture per model per prompt cannot distinguish a stable gap from a draw. Control, current: this is stated as a limitation on the record, and single captures are reported as single captures. Control, designed: the capture protocol under design for the instrument's automated substrate fixes sampling parameters per cohort and permits k samples per prompt, each an individual capture with a sample index, so that within-model variance can be reported against between-condition gaps. Residual: until that sub-study runs, per-case scores are point observations, and the record says so.

**6.4 Scorer subjectivity.** Scores are one reviewer's judgment. Control: the rubric is published, every score is anchored to quoted output, the per-case materiality instantiation is written before scoring, and the full chain, prompt, capture, quote, score, is public, which makes every score checkable and contestable rather than private. A standing challenge policy records any external re-scoring dispute and its outcome, either way. Residual: checkability is not inter-rater reliability. Published inter-rater agreement with an independent blinded scorer is a stated funded milestone, and until it exists, single-scorer is a limitation the record carries on its face.

**6.5 Selection effects.** Hypothesis cases are selected where gaps are considered plausible, which is a valid design for existence measurement and an invalid one for prevalence claims. Control: selection rationales are documented per case; the scale includes zero and the record retains nulls, low scores, contaminated captures, and rejected evidence; and forward-looking cohorts are moving to a commit-reveal discipline in which prompt hashes and selection rationales are published before capture and revealed at publication, making post-hoc case swapping detectable by anyone. Residual: the v1 study supports existence and magnitude claims about its own cases, not prevalence claims about model behavior in general, and is reported accordingly.

**6.6 Surface validity.** An answer captured in a consumer product interface and one captured via API are different objects: different wrappers, different defaults, potentially different behavior. Control: capture surface is a recorded field on every capture; comparisons are within-surface only, by standing doctrine; no cross-surface deltas and no cross-surface rankings are reported, ever. Residual: consumer-surface captures trade experimental control for ecological validity. That trade is disclosed rather than resolved, and the two surfaces are treated as parallel records, not interchangeable ones.

**6.7 Temporal instability.** Models are updated continuously, often without notice; the measured object changes under the instrument. Control: this is not a threat to the construct but the second half of its purpose. Captures are versioned and timestamped with the version-determination method recorded; frozen prompts are re-executed against successor model generations under a registered protocol; within-model, within-surface deltas over time are the longitudinal measurement, drift made recordable. Residual: historical deployed-model behavior cannot be captured retroactively. Whatever was not captured while it existed is gone, which is both the construct's hardest constraint and the reason the record accrues value with time.

## 7. Relation to adjacent constructs

The Volunteer Gap sits near several existing constructs and collapses into none of them.

**Hallucination** concerns the presence of false content. The Volunteer Gap concerns the absence of content the model demonstrably produced under matched targeted conditions. They are orthogonal: an answer can be hallucination-free and gap-heavy, or gap-free and wrong.

**Sycophancy**, as studied, concerns answer-shifting under user pressure or expressed preference. Volunteer Gap captures are taken in fresh sessions without user pushback; no preference is expressed for any answer. Framing Drift is adjacent to sycophancy but is measured against the model's own targeted production under a matched condition, not against agreement with a user.

**Sandbagging and selective disclosure**, in the evaluation literature, concern capability concealment under test conditions and carry an intent component. The Volunteer Gap makes no intent claim and measures deployed products under ordinary-use conditions, not evaluation harnesses under adversarial elicitation.

**Benchmarks** measure capability ceilings under optimized elicitation. The Volunteer Gap measures default behavior at the answer layer, what a user actually received, which is a different object from what a model can do when maximally prompted.

**Red-teaming** elicits worst-case behavior adversarially. The Volunteer Gap records default-condition behavior systematically. Complementary, not competing.

**Fact-checking** adjudicates published claims against external truth. The Volunteer Gap adjudicates nothing external; its availability standard is internal, the model's own targeted output, which is precisely what lets it operate without appointing itself an arbiter of contested ground truth. The judgment it does make, materiality, is prewritten, held as part of the case record, and challengeable rather than externally adjudicated.

**Internet censorship measurement** is the nearest methodological relative: independent, longitudinal observation of an information layer, recorded so that patterns invisible to individual users become public record. The Volunteer Gap extends that logic from access to answers. In the older internet, control could mean a blocked page; at the answer layer, it can mean the shape of what is volunteered.

## 8. Rubric versioning and change control

The rubric, the scale anchors, the signal-pattern typology, and the materiality qualifier are versioned together as rubric v1.0. Every published score cites the rubric version under which it was assigned. Changes to any of these require a recorded decision with rationale, produce a new version, and never retroactively alter existing scores; where re-scoring under a new version is warranted, both scores are published with their versions. Methodology changes of consequence pass through an adversarial review by a model or reviewer that did not author the proposal, and the review is recorded. This is stated in a construct paper because an instrument whose definitions drift silently is not an instrument.

## 9. Known limitations

Stated flat, without mitigation language, because several are mitigated in sections above and the reader should see the unmitigated list at least once. The v1 study is 13 cases across 4 frontier models: small by design, human-validated depth over scraped breadth, and supporting existence claims, not prevalence claims. Scoring to date is single-scorer. Captures to date are single-sample per model per prompt. The v1 surface is the consumer interface, with the control and ecological-validity trade that implies. The scale is ordinal and per-case instantiated, which bounds cross-case aggregation to descriptive summaries. The coverage-density confound is controlled and disclosed, not eliminated. And the construct measures what it measures: surfacing behavior under documented conditions, from which readers, institutions, and researchers may draw their own conclusions on a record built to survive their scrutiny.

## 10. Version and provenance

Construct paper v1.0, July 2026. Defines the construct as operationalized in the v1 study (13 cases, 4 frontier models, May 2026) and the public record at imbaslabs.com. Pre-publication, this paper underwent two rounds of cross-model adversarial review; the epistemic claims around possession, materiality, and estimate tiers were tightened per those reviews before v1.0 shipped. Revised 2026-07-08: materiality custody wording corrected to "held as part of the case record" in the abstract and section 7, matching sections 2 and 4; no other change. Numbers cited trace to the published methodology and results pages as of this date. This document is superseded only by a later version with a change log; it is never silently edited.

*Imbas measures what AI systems surface, omit, and reframe under documented conditions. The inspection layer for AI.*
