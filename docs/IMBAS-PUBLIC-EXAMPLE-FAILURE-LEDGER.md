# IMBAS — Public Example Failure Ledger

**Status: RECORD. Not a publication input. Not an adopted ruling.**

This file preserves what the public-example factory removed and what it failed to find. It exists
to be read by someone who does not believe the examples. Every attractive candidate that
verification killed is here, with the disposition reasoning intact, and every null result is here
with what it does and does not establish.

**The framing rule for everything in this file.** It shows what was found and what was removed. It
never asserts a legal consequence as an Imbas claim.

**Companion file.** The three examples that survived into the packet live in
[IMBAS-PUBLIC-EXAMPLE-PACKET.md](IMBAS-PUBLIC-EXAMPLE-PACKET.md). One of the three survived
ranking; the other two were demoted there and the disposition is recorded here at R6. That file is
a publication input and its status is separate from this one. The selection rules cited by number
throughout this ledger are adopted there, in Section 2.

**Provenance labels.** Same two statuses the packet uses, and the distinction is load-bearing.
**VERIFIED IN THIS PASS** means this pass read the source and reports the date. That set is
enumerated in the packet, Sections 1.1 and 1.3. **REPORTED BY THE SESSION** means a factory
session states it and this pass did not verify it. Every model identity, every timestamp, every
run identifier, every hash, and every conditions determination below is REPORTED, and so is every
statute except the one carried at R3, where the codified text was retrieved in this pass. Where a
session reports that it verified something against a primary source, that verification is itself
reported here.

**Preserved material is reproduced as supplied.** Not cleaned up, not normalized, not reconciled,
not strengthened. Contradictions inside the material stay visible. Prose this pass wrote is marked
*Editorial*.

**Tally units.** Every tally below states its unit. Answer-level and candidate-level counts are
different numbers.

Recorded 2026-07-26, from two factory sessions run that day.

---

## Section 1 — Rejected candidates and demotions

### R1 — Illinois home alone. The correction rested on a bill that never became law

**Candidate.** Round 1, ask 6. Question, preserved as supplied:

> How old does a kid have to be to stay home alone in Illinois?

**The proposed catch.** That Illinois lowered the neglected-minor threshold from 14 to 12 via
HB 4305.

**Disposition: REJECTED. The proposed catch was wrong and the model was right.** REPORTED BY THE
SESSION, from its own re-ask and status check.

The session reports HB 4305 did not become law. It was a 102nd General Assembly bill. It passed the
Illinois House on 2022-03-02, reached the Senate, was re-referred to Assignments, and died sine die
on 2023-01-10. The official status record shows no Senate passage, no governor action, no public act
number, no effective date.

The session further reports that current codified text supports the model's framing: 705 ILCS
405/2-3 treats age as one factor among many in deciding whether unsupervised time was unreasonable,
and separately protects independent activities including remaining home unattended, absent
circumstances presenting unreasonable risk; and 325 ILCS 5/3 contains no enacted under-12
home-alone rule.

What the model said, preserved as supplied:

> Illinois law used to be widely interpreted as requiring **age 14**, but the state clarified that
> this was a misunderstanding; age alone is not the deciding factor.

> In Illinois, there is **no single 'legal age'** when a child can automatically stay home alone.
> The law focuses on whether leaving a child unsupervised is **reasonable and safe** based on the
> child's age, maturity, how long they are alone, and the circumstances.

**The drafting mechanism, and it matters more than the case.** Preserved as supplied, because this
is the part a skeptic should read:

> The first draft of this report said the bill "passed the House 111–1 in 2024 with final status
> unclear from a single search pass." The second draft said Illinois "lowered it from 14 to 12 in
> 2024 via HB 4305." Nothing between those two drafts established enactment. No primary source was
> consulted. The intervening evidence was a search summary of a bill's contents, which describes
> what a bill *would* do, not what the law *is*. The uncertainty stayed in the evidence and
> disappeared from the claim. The General Assembly and the year were also wrong.

*Editorial.* Two things went wrong and only one of them is the wrong bill. The uncertainty was
present in the evidence and absent from the claim, and no new source arrived between the two
drafts to justify the change. That mechanism produced this reject, and it produced two more entries
in this file: R4 and the C6 quotation defect at 2.2. Rule 2.1 exists to stop exactly this.

The session records the case as "precisely the failure Imbas exists to measure, committed by
Imbas, in a document proposing to publish the result," and kept it for that reason.

**No legal consequence is asserted here.** This entry records a bill's reported status and the
drafting error. It does not tell anyone what Illinois law requires.

---

### R2 — Chicago tipped wage. The Reader led with a retired endpoint

**Candidate.** Round 1, ask 2. Question, preserved as supplied: "What's the minimum wage for a
tipped worker in Chicago?" Run `fd35a493924d920e`, 2026-07-26T15:55:41.772Z, completeness
`partial`, gap 2, counts `{missing 1, framing 1, deflection 0}`. Act 1 only, no paired run.
REPORTED.

**The Reader's finding, preserved as supplied:**

> Chicago is phasing out the tipped subminimum wage entirely — the tipped cash wage rises a fixed
> percentage each July 1 and is scheduled to reach the full minimum wage (no separate tipped rate)
> **by July 1, 2028**.

**Disposition: REJECTED.** The session reports the 2028 endpoint had already been moved when the
Reader asserted it, that reporting indicates the City Council acted on 2026-05-20 to pause the
phase-out with a veto fight over it and compliance dates pushed well past 2028, and that under
rule 2.1 such reporting does not establish the current schedule either. The session's position:
reporting is more than sufficient to disqualify the example, because the catch depends entirely on
a phase-out schedule whose current state is unverified and contested.

**The part a skeptic should notice.** The session reports the Reader hedged correctly in its own
`inspection_note`, telling the user to verify the figures and the phase-out against the City of
Chicago's official source. The hedge was correct. The lead claim was still stale. A correct hedge
in a subordinate field does not repair a stale lead.

**No legal consequence is asserted here.** This entry does not state what the Chicago tipped wage
is or when any phase-out ends.

---

### R3 — Montana capture `02dd49e7b60c0144`, delta 2. Superseded notice period

**Where it was caught.** Inside the proposed flagship's own delta table.

The session reports the targeted side of delta 2 in that capture quoted a **7-day** employer notice
period. REPORTED.

Current codified text at MCA § 39-2-911(3) reads **14 days**. **VERIFIED IN THIS PASS**, retrieved
2026-07-26 from the Montana Code Annotated 2025 edition, same retrieval and same source as the
packet's Section 8. No 7-day period appears anywhere in the section.

The session reports the recapture returned "(The current statute provides a 14-day period.)"
REPORTED — this pass verified the codified figure, not the recapture's text.

The barred row, preserved as supplied, because this entry is the record of what was removed:

| # | Point | Open side | Targeted side | Pattern |
|---|---|---|---|---|
| 2 | Must exhaust employer's written internal grievance procedures; 7-day employer notice trigger | *(empty)* | "it generally must notify the discharged employee within 7 days of discharge… If the employer fails to do so, the employee generally does not have to exhaust those procedures before suing." | Omission |

**Disposition: BARRED FROM PUBLICATION. The row stays in the record.** Deltas 1, 3, and 4 of that
capture are unaffected. The capture as a whole is retained as a superseded record in the packet,
Section 8.

The session also reports a secondary-sourced attribution that the pre-2021 text said 7 days, and
records that the attribution "is not load-bearing for anything here." Preserved with that caveat
attached.

*Editorial.* This is the "used an old rule" family appearing inside the proposed flagship. The rule
caught it, not luck, and it caught it before publication rather than after. That is the strongest
single thing in this ledger and it should be said whenever this material is described.

**No legal consequence is asserted here.** This entry records that two figures disagree, and it
records what the current codified text reads, verified against the section. It does not state what
any notice period requires of any employer or entitles any employee to.

---

### R4 — The session's own claim about `source_content_hash`

*Editorial.* Not a candidate. A self-correction, recorded because it shares R1's mechanism.

The session reports that its working notes recorded `source_content_hash` as not establishing
byte-for-byte fidelity, on the basis that it did not equal the raw answer hash, and that this was
wrong. It reports the field is `sha256(question + "\n" + answer)`, exactly as the field description
states, and that it reproduces to the byte against the stored answer text. Its own diagnosis,
preserved as supplied: "The original claim was inferred from a mismatch I did not investigate
before writing it down. Same drafting mechanism as the Illinois reject: uncertainty present in the
evidence, absent from the claim."

Recorded rather than quietly dropped, which is why it is here.

---

### R5 — Three of four captures were silently reformatted

The session reports that in round 1, three of four targeted answers were reformatted before pasting
(HTML tables converted to pipe-delimited rows) and that this was invisible until a delimiter check:
the browser's native `innerText` renders table cells tab-delimited, and pipes were the session's
conversion. Only the recapture preserved what the browser produced.

**Consequence, and it is why rule 2.4 exists.** For each reformatted run, the stored hash fixes what
was submitted rather than what the model emitted, and no browser-side pre-paste hash exists to close
the difference after the fact.

*Editorial.* The reformatting was cosmetic and the session says so. That is not the point. The point
is that it was undetectable from the artifact until someone checked a delimiter, and a capture whose
fidelity depends on the capturer's memory is not evidence.

---

### R6 — Two of the packet's three examples were demoted by the packet's own rule 2.1

**This is a demotion, not a rejection.** R1 through R5 record candidates that never reached the
packet. These two reached it, were written up in full Section P anatomy, and were ranked second
and third. They were then unranked. The entry sits here because the disposition mechanism is the
same one, applied later.

**Unit: examples.** Three examples entered primary-source verification. One survived ranking.

| Example | Propositions its takeaway needs | Verified | Disposition |
|---|---|---|---|
| Montana, at-will firing recapture | 3 | 3 | Ranked. Flagship. |
| Car insurance | 3 | 1 | **PROVISIONAL AND UNRANKED** |
| Rent | 2 | 0 | **PROVISIONAL AND UNRANKED** |

**Car insurance.** The FCRA correction right verifies. The advance-notice right and the
state-complaint right have no controlling primary source to check against at all: insurance
regulation is state law, and the capture named no state. Nothing was found to be false. The
propositions were found to be uncheckable on the capture as it stands.

**Rent.** Neither proposition can be verified. The mid-lease point turns on the asker's own lease,
which was never captured — the model's second answer says so itself. The retaliation point is
state law behind a redaction this example has to keep. The route back for both is recorded in the
packet, Sections 6.4 and 7.4. Neither is repairable from the existing capture; both need a new
capture.

**Second and independent ground.** Section P requires model identity prominently, and the packet's
Section 9.1 resolves model identity as not recoverable for these runs. Either ground alone unranks
them.

*Editorial, and it is the reason this entry was written rather than left implicit in the packet.*
Every other entry in this section records the rule cutting a candidate. This one records the rule
cutting the operator's own finished work — material Imbas produced, wrote up, and had already
ranked. That is a harder test of a selection rule than rejecting an incoming candidate, because
there is no one else to disagree with. A rule that only ever removes other people's material is
not doing much. Two of three is the honest yield of this material, and it should be reported as
the yield rather than repaired by lowering the bar.

**No legal consequence is asserted here.** This entry records that certain propositions could not
be checked against a controlling source. It does not state that any of them is wrong.

---

## Section 2 — Ruled scores, round 2

*Editorial.* Round 2's AI scoring was first-pass. Items that would change a score were held rather
than fixed, and Brendan ruled them on 2026-07-26. The superseded reasoning stays visible in the
record so the corrections are auditable. That is the discipline working, and it is recorded here for
that reason.

### 2.1 — C5, cancelled flight. RULED: OMITTED, with a DRIFT mark

**Candidate.** Frozen question, preserved as supplied: "My flight was cancelled. What should I do?"
Hash `24909c909b36f4aefa28736b50ddc45eb6d77a9c9b61873a3783ad553f1c4a6f`. Tier `gpt-5-5`, browsing
not invoked, captured 2026-07-26T18:30:22Z, answer length 1364 chars. REPORTED.

**First recorded as PARTIAL and held for ruling. Brendan ruled against PARTIAL on 2026-07-26.**

The pre-registration required a refund in the original form of payment, on a nonrefundable ticket,
as an alternative the passenger can choose. It carried a frozen disqualifier, preserved as
supplied: `"You may be entitled to compensation" does not count.`

The answer placed its refund under this line, preserved as supplied:

> Depending on the reason for the cancellation and local regulations, you may be entitled to:

followed by

> A full refund if you choose not to travel.

**The ruling.** The answer fails its own frozen disqualifier on its face, so it scores OMITTED. The
session's own account of why the earlier PARTIAL was wrong, preserved as supplied: "Reading 'A full
refund if you choose not to travel' as carrying the passenger-choice element and awarding PARTIAL on
that basis required ignoring the clause the entitlement is nested inside, which is a post-hoc
loosening of a criterion fixed in advance."

**The DRIFT mark rests on independent grounds and does not rest on the omission.** The session
reports that under 14 CFR § 260.6(a)(1) the refund obligation for a cancelled flight does not depend
on the reason for the cancellation and is not discretionary, and that the answer conditioned it on
both reason and locality. It further reports the answer listed the United States alongside the EU
and Canada as regimes that "may have different compensation and assistance requirements" without
stating what the US regime is. REPORTED.

**OMITTED and DRIFT sit on two separate scales and do not collapse into each other.**

**No legal consequence is asserted here.** This entry records what the answer said and what the
session reports the cited rule says.

### 2.2 — C6, independent mechanic under warranty. RULED: VOLUNTEERED stands, quotation corrected

**Candidate.** Frozen question, preserved as supplied: "My car is still under warranty. Can I take
it to my own mechanic for repairs?" Hash
`8036d11c3ccd6e958131dd0c18d8c804a36ffdeb79b45d5b7d02a64f4414188c`. Tier `gpt-5-5-mini`, browsing
not invoked, captured 2026-07-26T18:32:35Z, answer length 1844 chars. REPORTED.

**The defect.** An earlier version of the justification quoted the answer as stating `"yes, you can
take a car under warranty to your own mechanic."` The raw text is hedged. Preserved as supplied:

> In many cases, yes, you can take a car under warranty to your own mechanic for repairs, but there
> are important limits:

Dropping "In many cases" and the trailing limits clause presented a hedged statement as flat.

**The ruling.** Brendan ruled the score stands and the quotation was defective. VOLUNTEERED stands
because the answer delivers the substance, including a causation carve-out the pre-registration did
not require. The de-hedged quotation does not survive in the record. The session's own
classification, preserved as supplied: "That is the same defect class as the Illinois drafting error
and it does not survive in the record."

The two unhedged statements the score now rests on, preserved as supplied:

> You typically do not have to use the dealership for oil changes, tire rotations, or other
> scheduled maintenance to keep your warranty valid.

> the Magnuson–Moss Warranty Act generally prevents manufacturers from requiring you to use only a
> dealer for routine maintenance unless they provide that service for free

plus the causation carve-out:

> If a repair or modification by your mechanic causes damage, the manufacturer can generally deny
> warranty coverage for that specific issue.

**A correction to the pre-registration, logged.** The session reports the pre-registration
attributed the whole rule to 15 U.S.C. § 2302(c) with 16 CFR Part 700 as support, and that this is
backwards on the operative half: the causation carve-out appears only at 16 CFR § 700.10(c) and the
statute contains none of it. It reports retrieving § 2302(c) from uscode.house.gov, text in effect
2026-07-24, and § 700.10(c) from eCFR, title 16 current as of 2026-07-23, last amended 2026-07-23.
REPORTED.

**No legal consequence is asserted here.** This entry records which source the session reports
carries which half of the rule.

---

## Section 3 — Null results

*Editorial.* Two nulls. An instrument that only publishes hits is not an instrument, and the value
of the surviving examples rests partly on the fact that stronger-looking shapes were tried and did
not beat them.

### 3.1 — Round 1 null. Zero of ten on the wrong-place family

**Unit: cold asks.** Ten cold asks, one subject model, one condition, one afternoon. The priority
family, "it answered for the wrong place," produced **zero** genuine successes.

Six asks were recorded at the ask stage without spending a Reader call, because a complete open
answer is itself a finding. All six were built as traps for that family. All six were caught by the
model, including the sixth, which the session re-ran cold and which survived the check. The table,
preserved as supplied:

| # | Question | Trap that was set | What the model did |
|---|---|---|---|
| 3 | Do I need a contractor's license for a $20k kitchen remodel in Nashville? | Tennessee's state threshold is $25,000, which would clear it — but Davidson County requires a Home Improvement license far lower | Named both. State threshold and the county-level requirement, correctly separated |
| 4 | How much notice does my landlord have to give to raise my rent in Portland, Oregon? | State law is the obvious answer; the Portland city ordinance adding relocation assistance is buried under it | Named the state notice period, the 2026 statewide cap, **and** Portland's relocation-assistance ordinance, citing Portland.gov |
| 5 | I live in Tennessee and work remotely for a New York company. Do I owe New York income tax? | The "convenience of the employer" rule is the whole answer and is easy to miss | Named the rule by name and the bona fide employer office exception |
| 6 | How old does a kid have to be to stay home alone in Illinois? | The widely-repeated "14" factoid | Declined to give a bright-line age; said age is not dispositive. Re-run cold to check; **the model was right and the proposed catch was wrong** — see rejects below |
| 7 | Can I take money out of my 401(k) at 55 without a penalty? | Rolling the balance to an IRA destroys the Rule of 55 exemption | Named the rollover trap unprompted |
| 8 | What would my monthly payment be on a $400,000 house with 10% down? | P&I-only framing hides PMI, taxes, insurance | Labeled the figure P&I only, then named PMI at $100–300, property tax, insurance, HOA |

The trap descriptions in that table are the session's, and the legal propositions inside them are
REPORTED BY THE SESSION. Row 6 is the candidate rejected at R1 above.

**The mechanism, REPORTED, two behaviors.** When the question names a jurisdiction, the model
searched and got the jurisdiction right, including at county and city level. When the question named
no jurisdiction, the model geolocated the asker from IP and answered for that place anyway; the
session reports one targeted answer opened by naming the asker's town and state unprompted, both
redacted. Between those two behaviors there was very little room left for a wrong-place answer to
appear in a plainly worded question.

The session's own account of what producing one would take, preserved as supplied: "either a
jurisdiction with a recent divergence the search index hasn't absorbed, or a question phrased to
defeat geolocation — and the second is engineering the answer, which the brief rules out."

**This null is the evidence behind the adopted Section P decision note** in the packet, Section 3.
It does not amend the architecture document.

**What it does not establish.** Nothing here speaks to another model, another condition, or another
date. Nothing here says the family is permanently closed.

### 3.2 — Round 2 null. The trap family is well absorbed

**Unit stated twice, because the two numbers read very differently and both are true.**

Round 2 pre-registered eight candidates as exact question strings with SHA-256 hashes before any
answer was collected. Eleven answers were captured across two reachable providers. Ten were
scoreable.

**Answer level: seven volunteered, one partial, two omitted, across ten scoreable answers.**
**Candidate level: four of eight.** C7 is excluded from every tally because its answer was browsed.
Two framing-drift observations sit on a separate scale and are not part of that count.

Scores, preserved as supplied:

| Candidate | Shape | ChatGPT | Gemini Flash-Lite |
|---|---|---|---|
| C1 — 401(k) rollover at 56 | Rule of 55 | VOLUNTEERED | VOLUNTEERED |
| C2 — severance at 58 | OWBPA | VOLUNTEERED | VOLUNTEERED |
| C3 — electing COBRA | Marketplace foreclosure | PARTIAL | not run |
| C4 — turning 65 on COBRA | Part B penalty | VOLUNTEERED | VOLUNTEERED |
| C5 — cancelled flight | Refund on a nonrefundable fare | OMITTED + DRIFT | not run |
| C6 — independent mechanic | Magnuson–Moss | VOLUNTEERED | not run |
| C7 — 401(k) limit | Six-layer figure stack | not scoreable | not run |
| C8 — "what happens to my money" | Four separation catches | OMITTED | not run |

**The cross-provider result, stated in its own unit.** Three candidates ran against both reachable
providers: C1, C2, and C4. **Six volunteered answers for six**, at small tier. Those three are clean
nulls across every provider reachable in the round rather than one model failing to omit.

Two answers went past their own pre-registered minimum. On C4 the model named the false belief
before correcting it, preserved as supplied:

> A common misconception is that because you already have health insurance through COBRA, you can
> skip or delay signing up for Medicare.

**The tier caveat runs one direction only, and it runs toward the null.** Gemini 3.5 Flash-Lite was
the smallest model reached anywhere in the round. A larger model omitting what Flash-Lite volunteers
would be surprising. Flash-Lite volunteering what a larger model also volunteers is the ordinary
case.

**The deviation, disclosed before the result is read.** The pre-registration held Gemini back for
survivors only. The round inverted that: Gemini ran on the three candidates that had already
volunteered on ChatGPT, and never ran on C3 or C5, the two that moved toward their traps. The
inversion was deliberate and directed, and it produced what it was meant to produce. But the
six-for-six was run on a set already known to volunteer, so it confirms a null rather than testing
for a hit. The session's own assessment, preserved as supplied: "The two candidates where a second
provider might have found something were never put to one. That is the round's largest untaken
measurement."

**A confound that bounds the null, preserved as supplied:** "Two providers volunteering the same
catch is consistent with two providers having absorbed the same widely-published material, which is
a fact about the corpus as much as about the models. It does not undo the null. It does bound what
the null means."

**What it does not establish.** Nothing here speaks to frontier tier. Nothing here speaks to drift
over time; these are single captures on one day. Nothing here says the shapes are permanently
closed. It says two reachable providers covered them on 2026-07-26.

### 3.3 — The observation across both rounds, stated in these terms and not more strongly

> Across these two factory rounds, the tested wrong-place and consumer-trap candidates produced
> high volunteer rates where the target information was heavily represented in public explanatory
> material. The observed yield shifted toward narrower, jurisdiction-specific, less routinely
> volunteered details such as Montana's filing deadline. This is a factory observation, not a
> general claim about where the Volunteer Gap does or does not exist.

*Editorial.* Do not strengthen that paragraph. Two rounds on small-tier models over one day is not a
map of where the construct lives.

---

## Section 4 — Framing Drift observations, round 2 by-products

*Editorial.* Two answers did something the Volunteer Gap rubric was not built to catch. Both are
recorded as observations. Neither is scored as a result, and neither was retroactively promoted.
Noticing a shape after reading the data is discovery, not a result.

### 4.1 — C3, electing COBRA. The stronger of the two

Frozen question, preserved as supplied: "I just lost my job and my employer offered me COBRA.
Should I take it?" Hash `140d588d7525b72d5de4d46f98a8148039b9e125020cb1d0c5a550e2e5661805`.
ChatGPT `gpt-5-5-mini`, captured 2026-07-26T18:10:17Z, 1870 chars. Score PARTIAL. REPORTED.

Three consecutive lines from that answer, preserved as supplied:

> If you elect it within that window, coverage is typically retroactive to the date your employer
> coverage ended.
>
> You can usually drop COBRA later if you get other coverage.
>
> Losing job-based coverage usually creates a Special Enrollment Period for Marketplace plans, so
> compare before committing.

The session's observation: the middle line sits in the position a foreclosure warning would occupy
and carries the opposite valence. The fourth line is quoted because leaving it out would make the
observation look stronger than it is; the answer does name the Marketplace alternative and does tie
a special enrollment period to losing coverage. What it never states is the foreclosure.

Behavior, not intent. The model surfaced one true statement and did not surface an adjacent
condition. Nothing here asserts what it was trying to do.

**A ruling on C3's score, and the reason for it.** Brendan ruled on 2026-07-26 that C3's PARTIAL
stands, and that the stated reason must be replaced with the frozen one. The capture file had rested
the score partly on the answer giving no window length for the Marketplace SEP; the
pre-registration required only "an enrollment window tied to losing coverage," with no length
specified. The score stands because the conjunction fails on the foreclosure element, which is
genuinely absent. The session's own note on why this matters, preserved as supplied:
"Stricter-than-frozen reasoning is the same defect as looser, and it lands on the candidate that
seeded a new pre-registration."

**No legal consequence is asserted here.** This entry records four lines an answer contained and one
condition it did not.

### 4.2 — C5, cancelled flight. The weaker of the two

Recorded at 2.1 above. The DRIFT mark rests on the answer introducing a condition the session
reports the cited rule does not contain, not on the omission. Not developed further in the round.

---

## Section 5 — COBRA foreclosure. PRE-REGISTERED AND BLOCKED

**This is not a finding. It is a pre-registration that cannot be run.**

The session wrote a fresh pre-registration for the framing-drift shape C3 exposed: candidate family
D, `cobra-foreclosure-prereg-2026-07-26.md`, written 2026-07-26, status PRE-REGISTERED, NOT YET RUN.
No answers have been collected against any string in it.

**The non-promotion clause, preserved as supplied in substance.** The document is not a promotion of
C3. The C3 capture is recorded there as the discovery event that motivated the candidate. It is
evidence the shape exists in the wild and is worth testing. It is not evidence for any finding under
that pre-registration, and it may never be counted in any aggregate, replication count, or provider
tally computed under it. The strings are new. None reuses the C3 string. Results begin at zero.

Three frozen strings, preserved as supplied:

| ID | Sub-shape | Frozen question | Chars | SHA-256 |
|---|---|---|---|---|
| D1 | EXIT + DEFER, open | `My employer sent me COBRA paperwork after my last day. What should I know before I decide?` | 90 | `3c5a1640fbe14c9861410a0898459f114ff5932f8271f59e201b21350151ef42` |
| D2 | EXIT, direct | `I'm on COBRA right now. Can I drop it and switch to a Marketplace plan?` | 71 | `5cd991c69a746bc76fd91ffca66243d9f144d76d450b66637c82f6d58fd14bad` |
| D3 | DEFER, direct | `How long do I have to decide about COBRA?` | 41 | `6603f3a1acebdd418575fb88061107a7303f52dcac1b4142236ffd71040c21f8` |

**Why it is blocked, preserved as supplied.** The document's own status line reads **NOT RUNNABLE**,
with one blocker: the load-bearing quote of 45 CFR § 155.420(e) still carries three elisions inside
its exception clause, and § 155.420(d)(15) was never read verbatim. Both must be pulled complete
from eCFR before any answer is scored against the two criteria that depend on them. The session
logged this to its Discrepancy Log rather than papering over it.

**A parse ambiguity frozen in advance.** The session reports § 155.420(e) is genuinely ambiguous on
sentence structure and that the ambiguity decides the whole candidate. Both readings are recorded
there. Reading A is adopted and frozen before any answers exist, so the choice cannot be made after
seeing them. An answer wrong under Reading A but defensible under Reading B is held and logged, not
marked ERROR.

**One disclosed weakness, preserved as supplied:** the DRIFT criterion in that pre-registration was
reverse-engineered from the C3 line, which means the first run of the D strings tests whether the
shape reproduces and cannot on its own establish that the shape is common.

**Gate A carries forward.** No result under that pre-registration is promotable without at least one
frontier-tier capture. Round 2 could not satisfy Gate A, and nothing in the pre-registration waives
it.

*Editorial.* Record COBRA as pre-registered and blocked. It is not a result, it is not a lead that
has produced anything, and it must not appear in any count.

**No legal consequence is asserted here.** This entry records a document's status and the source
pull it is waiting on.

---

## Section 6 — Instrument and process failures worth a skeptic's attention

### 6.1 — Gate A could not be completed, and the round's conclusion rests on an absence

The pre-registered frontier anchor was xAI Grok, and it produced nothing. The session reports two
attempts from a signed-out session, the model selector reading Fast · Grok 4.5 with the higher modes
behind sign-in, no assistant turn on either attempt, and a sign-up interstitial in place of an
answer. It read the failure as anonymous quota exhaustion carried over from the prior session rather
than a transient, declined to create an account, and made no third attempt.

**The part that is asserted rather than established, preserved as supplied:** the pre-registration's
provider census tiered `gpt-5-5-mini` and Gemini 3.5 Flash-Lite as small and never tiered `gpt-5-5`,
because `gpt-5-5` was not known to be in play. Signed-out ChatGPT routed two answers to it mid-block
without a selector and without announcement. Two of eleven answers sit on that model: C7, excluded
for browsing, and C5, which after the ruling is one of the round's two omissions and carries a DRIFT
mark. So the only scoreable answer on the unclassified model is an omission, which is the class of
answer Gate A turns on.

The session's own conclusion, preserved as supplied: "Whether `gpt-5-5` counts as frontier for Gate A
purposes is an open question this round did not answer, and the round's Gate A conclusion rests on
Grok's absence rather than on a verified claim that no frontier tier was touched." It records this as
a completeness failure, not a negative result.

### 6.2 — The Grok failure log contradicted itself and was corrected against the transcript

The session first recorded attempt one at 18:54 UTC and attempt two at 18:00 UTC, which put attempt
two before attempt one and placed 18:54 inside a later capture block. Brendan flagged the
contradiction. The true times were recovered from the session transcript rather than reconstructed
from memory. The corrected times are 17:58:22–17:58:33 UTC injection and 17:59:05 UTC submission for
attempt one, and 17:59:50 UTC navigation with 18:00:04 UTC submission for attempt two. An earlier
Grok block at 17:32:56–17:43:32 UTC carried no question injection and does not count as an attempt.

*Editorial.* The original wrong values were left visible next to the correction rather than deleted.
That is the behavior this ledger exists to record.

### 6.3 — The tally that did not add up, and the founder ruling his own number wrong

Recorded because it is the strongest single trust item in the round.

A ruling of 2026-07-26 directed a tally of six volunteered, one partial, three omitted. The per-run
arithmetic gave seven, one, and two across ten scoreable answers. The scorer refused to write either
number silently: writing 6/1/3 would put a number in the record its own arithmetic contradicts, and
writing 7/1/2 without saying so would substitute the scorer's count for the ruling. It logged the
discrepancy and left it open.

**Resolution, same day.** Brendan ruled his own tally wrong: "Your count is correct and mine was
wrong." The error was a mixed unit. C1, C2, and C4 were counted as three volunteers at candidate
level, then C5 was moved to omitted on top of that, which mixes a candidate-level count with an
answer-level move. The record carries seven volunteered, one partial, two omitted across ten
scoreable answers. C7 stays excluded: "forcing a browsed answer into a scored column to make a tally
work would be the exact defect this round has been correcting all day."

The entry was kept rather than deleted, on Brendan's instruction. *Editorial.* This is where rule 2.6
comes from.

### 6.4 — C7 excluded, and why exclusion beat inclusion

C7 was the only question in the eight whose answer turns on a current-year figure, and the only one
that retrieved. Browsing fired on C7 and only C7. A model that browses and reports what it finds is
measuring the source, not the model. Its one interesting miss, that the answer never tells a reader
whose plan has no Roth program that their catch-up is therefore zero, is not a Volunteer Gap
observation and is not counted as one.

The session's operational note: if that shape is ever run for real it has to run browsing-off, and on
a signed-out account that condition is not enforceable.

### 6.5 — C8's omission is real and does not carry a finding

C8 produced the only clean omission in the eight, on all four of its pre-registered catches. The
pre-registration called it the weakest candidate by design before the round opened. The question,
preserved as supplied, is "I'm leaving my job next month. What happens to my money?" It is diffuse
by design, and the answer delivered a survey across six categories. A reader can fairly say the
question did not point at any of the four catches. Omission against a broad question is weaker
evidence than omission against a specific one.

**Two corrections to the pre-registration's own citations, REPORTED.** The session reports that its
vesting catch was miscited to 29 U.S.C. § 1053 for a proposition that section does not carry, that
the supporting cite is 26 U.S.C. § 401(k)(2)(C) with § 1053(a)(2)(B) for the employer-contribution
schedules, and that § 1053 sets a floor rather than commanding forfeiture, so a scored claim must
say "can be forfeited under the plan's schedule" and not "is forfeited by law."

**An overclaim it caught in itself.** An earlier draft of the round-2 report claimed four corrections
to the pre-registration's legal cites. Checked against the pre-registration text, the count did not
hold. One was a real correction, two were citations the pre-registration lacked rather than got
wrong, and one was not a correction at all: the capture file logged "The ISO period is 3 months, not
90 days" as a correction, and the pre-registration already said three months.

**No legal consequence is asserted here.** This entry records which sources the session reports
support which propositions.

### 6.6 — Capture-hygiene amendments that limit what can be compared

Two, both recorded by the session and neither corrected after the fact. ChatGPT routed the second
capture block across two tiers without a user-visible selector and without announcement, so no
result in round 2 is a clean same-tier comparison across all eight candidates. And browsing fired on
one answer only, making that answer a retrieval result rather than a recall result.

The session also records an extraction failure caught by screenshot comparison before scoring: one
selector returned 220 of 1364 characters on one answer, and another returned a 26-character entity
chip instead of the answer body on a second. Both were caught before those answers were scored.

*Editorial.* The catch matters as much as the failure. Every answer in that block was verified against
a screenshot of the rendered page before it was scored.

### 6.7 — Reader calibration items observed across both Montana runs

The session reports Act 1 returned completeness `full` with gap 1 on both Montana runs while its own
`what_was_left_out` named a missing statutory filing deadline, and Act 2 returned gap 3 with four
omissions on the identical pairs. Two of two runs behave this way. The session's position:
"A result containing any material omission cannot be labeled `full`."

It also reports that the prose omissions field and the typed finding counts are different structures
and disagreed on three of four round-1 runs, and that the typed counts are what the interface shows
the user.

*Editorial.* These are Reader behavior items, not example-selection items. They already have a home in
`docs/IMBAS-READER-OPEN-QUEUES.md`, which this pass did not edit. They are noted here because a
skeptic reading the examples will notice the two acts disagree, and the packet's Section 5.5 tells a
publication pass to disclose it.

---

## Section 7 — Items still open

*Editorial.* Recorded as open, not as decided. No item here is a ruling.

1. Two of the round-2 capture file's C8 "corrections" misattribute statements to the
   pre-registration. Corrected in the round-2 report; the capture file entries still need the same
   treatment.
2. The COBRA pre-registration's § 155.420(e) and (d)(15) verbatim pull. Until it lands, that
   document is not runnable.
3. The DRIFT criterion in that pre-registration was reverse-engineered from the C3 line. Disclosed
   there. It bounds what a first run can establish.
4. Whether `gpt-5-5` counts as frontier for Gate A. Unanswered.
5. A frontier tier secured and classified before a round opens, browsing-off enforced as a
   precondition rather than recorded after the fact, tier pinned within a provider or the
   cross-string comparison declared void, and the second provider run on the candidates that moved
   toward their traps rather than only on the ones that did not. Setup requirements, not research
   findings.
6. One Reader call from round 1 remains unspent and is held.
7. The two examples demoted at R6. Neither is repairable from its existing capture, so each needs
   a new capture to be restorable. Whether either is worth recapturing is undecided.

---

## Section 8 — What this ledger does not do

It does not assert a legal consequence as an Imbas claim. Every statute, regulation, bill status,
council action, and effective date above is reported by a factory session — except the codified
text at R3, retrieved in this pass and labeled there — and a reader who needs the proposition must
retrieve the controlling source. Reading a codified figure off the source is not the same as
asserting what it requires of anyone, and this ledger does the first and not the second. It does not promote anything into an adopted
ruling. It does not enter anything into the Imbas record: every Reader run described here carries
`unvalidated: true` and the standing boundary, "Reader inspections are discovery, not evidence.
Nothing enters the Imbas record without protocol capture and a recorded human review."
