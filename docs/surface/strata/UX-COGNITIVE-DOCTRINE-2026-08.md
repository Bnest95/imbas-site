# UX-COGNITIVE-DOCTRINE-2026-08

Cognitive, behavioral, perceptual and interaction doctrine for the Imbas Reader public surface.

**Status.** Research and synthesis. Not implementation, not a redesign, not a visual direction.
**Date.** 2026-08-13.
**Owns.** Placement, hierarchy, prominence, visual weight, grouping, timing, structure, disclosure, action sequencing, measurability classification.
**Does not own.** Wording of governed consumer strings, the palette, the finding taxonomy, standing product doctrine. Where research argues a string's *communication objective* is wrong, section 13 records it as a recommendation and does not rewrite the string.
**Grounding.** One real end-to-end run of the live public Reader (Guided Case → Montana employment law → pasted 234-word answer → completed inspection), read-only, 2026-08-13, desktop 1280×900. The repository was not inspected. Every structural number in section 0 came from reading the rendered public page.

**Two standing cautions that govern how this document should be read.**

First, structure is not cognition. Block order, pixel distance and DOM hierarchy are observable now. Comprehension, perceived accusation, calibrated uncertainty and information scent are not. Where this document tags a rule MEASURABLE-NOW, the observable named is structural and the rule is a *proxy chosen because it is enforceable*, not a proof that a person understood anything. Where a rule needs human observation, it says so and specifies the probe.

Second, one finding in the literature cuts against the core Imbas mechanic and should be carried through the whole document rather than filed under risks. Marking a subset of content raises the perceived accuracy of the unmarked remainder (Pennycook et al. 2020, *n* = 6,739). Imbas marks a subset by design. Every rule below about restraint, about scope statements, and about the empty-findings state exists to blunt an effect that the product's own mechanic generates.

---

## 0. Grounding record — what the live surface actually does

This section exists so later sections argue against measured reality rather than an imagined interface. All figures are from the completed run described above. Scroll positions are document-absolute pixels at 1280×900.

### 0.1 Result composition, top to bottom

| # | Block | Top (px) | Height | Contents |
|---|---|---|---|---|
| 1 | `--hero` | 3160 | 149 | H2 at 37.6px / weight 500 / `rgba(242,232,220,.97)`: "3 candidate items surfaced". P at 18px: "Each one is a candidate the Reader could quote from your answer." |
| 2 | `--measure` | 3335 | 1361 | The person's pasted answer rendered in full with three inline ember-tint marks; then a findings list; then a scope line; then an admission-boundary line; then two record controls |
| 3 | (unmodified `follow`) | 4721 | 1465 | "SOMETHING TO CHECK" → "THE READER" attribution → "THE READ" prose → "WHAT MAY BE MISSING" (3 bullets) → "HOW IT WAS SHAPED" → "INSPECTION NOTE" → "Behavior, not intent." → four record/share controls |
| 4 | `--meaning` | 6213 | 385 | "Why this inspection matters" → WHAT HAPPENED / WHY THIS MATTERS / WHAT YOU CAN DO NEXT → admission boundary → "How admission works →" |
| 5 | `--perception` | 6623 | 106 | "Did this surface something you hadn't considered?" YES / NO |
| 6 | `--act2` | 6755 | 427 | "THE TWO-QUESTION TEST" → Quick check / Cleaner check selector → the derived question → provenance line → "Ask your AI →" (ember fill) + "Paste what came back" |
| 7 | `--loop` | 7208 | 270 | "TEST ANOTHER QUESTION" → 1-2-3 strip → a fresh seed question → "Copy question" + "Test another question" (ember fill) |
| 8 | `--post-privacy` | 7491 | 20 | "what deletion means" link |

Result surface height: roughly 4,350px on a 900px viewport, which is about 4.8 screens.

### 0.2 Evidence marks

Three `mark.wb-source__mark` elements inside the person's answer. Background `rgba(222,111,56,0.16)`, text `rgba(232,221,206,0.94)`. Each carries a small ember numeral (`span.wb-mark-n`) plus a visually-hidden "mark" label for assistive technology.

| Mark | Position in answer | Restated at | Distance |
|---|---|---|---|
| 2 | 3535 | 4297 | 762px |
| 1 | 3690 | 4122 | 432px |
| 3 | 3897 | 4426 | 529px |

Three structural facts follow directly.

The numerals do not follow the reading order of the answer. Top to bottom the person meets 2, then 1, then 3. The restatement list runs 1, 2, 3. A reader tracking a number has to reorder.

The marks are inert. No `tabindex`, no `role`, no `id`, no `aria-details`, no `aria-describedby`, and no ancestor button or link. There is no keyboard path and no programmatic relationship from a mark to the thing that explains it.

The mark points at the text where an absence bites, not at absent text. Mark 1 sits on "you may be able to recover lost wages and fringe benefits", and the finding attached to it is a missing filing deadline. That is a legitimate positional relationship and it is not a fabricated span. It does mean the visual grammar of a mark carries two different jobs — *this text is the finding* and *the finding concerns what should have been here* — with no rendered difference between them.

### 0.3 Finding presentation

Each finding renders in a fixed order: class label in ember mono (OMISSION, DEFLECTION), then the explanation, then the quoted anchor with its numeral. The order is constant across all three findings, which satisfies consistent identification. The label leads.

### 0.4 The same three findings are stated four times

1. As labelled explanation plus quote (4122–4426).
2. Inside "THE READ" prose (4721+), in conversational register.
3. As "WHAT MAY BE MISSING" bullets (5503–5602), unnumbered, with no visible binding back to marks 1/2/3.
4. Compressed again in "WHAT HAPPENED" (6213).

### 0.5 Accent usage on the result surface

35 visible elements carry an ember-family color: 19 by text color, 10 by background, 24 by border (elements can hit more than one). Twenty distinct ember alpha and hue values appear.

Two controls carry a solid ember fill: "Ask your AI →" (7066) and "Test another question" (7393), 327px apart.

The shipped accent token is `--ember: #DE6F38`. `CLAUDE.md` documents the accent as `#B46A5A`. These are different colors, and the difference is load-bearing for contrast (see 0.6). This document flags the divergence and does not resolve it.

### 0.6 Computed contrast (WCAG 2.x relative-luminance method, sRGB)

| Pair | Ratio | Passes |
|---|---|---|
| `#B46A5A` (documented accent) on `#2A211E` | **3.86 : 1** | 3:1 non-text and large text. **Fails 4.5:1 body text.** |
| `#DE6F38` (shipped `--ember`) on `#2A211E` | **4.82 : 1** | 4.5:1 body text (AA), 3:1 non-text |
| Live mark: `rgba(232,221,206,.94)` over 16% ember tint over `#2A211E` | **8.46 : 1** | AA and AAA body text |

The production choice of a 16% tint rather than a fill is what makes the marked text legible. This is not a stylistic preference; it is the only treatment in the tested set that clears AAA. Rule R3 freezes it.

### 0.7 Action inventory

Sixteen controls on the result surface. Four of them — Copy Result, Copy Full Receipt, Share this inspection, Run again — sit in one group at 5994–6102 at complete visual parity: transparent background, 16px, weight 500, 44px tall. Nothing in that group is primary and nothing is subordinate.

### 0.8 What was not observed

An ABSENT-state finding did not render in this run; all three findings resolved to text and were QUOTED. No error or empty state was exercised. A true 390px viewport was not obtained — window resize reported success but the page continued to report a 1557px inner width, so every mobile rule in section 7 is written as a **check to run**, not as an observation already made. This document does not claim to have measured the 390px composition.

---

## 1. Executive design thesis

### How Imbas should feel

Like a competent second reader who has gone through your document carefully, marked three places in the margin, and handed it back. Not a verdict, not an alarm, not a dashboard, not a lab report. The emotional target is **relief that someone looked**, not alarm at what they found.

The strongest constraint on feel is not aesthetic. It is that the product's persuasive force must come entirely from evidence quality. Every unit of persuasion the interface generates by visual means — a red tone, a large count, a warning glyph, a certificate frame — is a unit that survives when the evidence is weak. That is precisely the failure mode Imbas exists to measure in other systems. Interfaces raise trust with cues that carry no information: invented trust seals raise perceived trustworthiness (Kirlappos et al. 2012); nonprobative photographs raise belief in claims they cannot support (Newman et al. 2012). Imbas will get the same free trust from hashes, IDs and receipt language whether or not the underlying finding deserves it. The design answer is to spend that free trust down rather than harvest it.

### How attention should move

Four movements, in order, each with a distinct job.

**One — orientation (roughly 2 to 5 seconds).** Normal silent reading of English prose runs about 200 to 300 words per minute (Rayner et al. 2016), so a 2–5 second budget is roughly 7 to 35 words. Whatever occupies the first screen has to fit that. The person needs to know that something was found, that it concerns their own answer, and that the evidence is directly below. Nothing else fits.

**Two — recognition.** The person meets their own answer with marks in it. This is the single highest-value moment on the surface and the one place where Imbas has an advantage no competitor framing gives it: the evidence is inside the reader's own text, so the claim and its proof occupy the same visual field. Integrated presentation of related material outperforms separated presentation with a pooled effect of roughly *g* = 0.63 (Schroeder & Cenkci 2018). Imbas should be spending that effect, not defeating it by moving explanation 1,800 pixels away.

**Three — evaluation.** The person reads what each mark means. Here the interface must slow down deliberately. Reducing the cost of verifying a finding is the mechanism that reduces overreliance on an automated system (Vasconcelos et al. 2023): people do not become more careful because an interface tells them to be careful, they become more careful when checking is cheap. Every design decision in this stratum should be judged by whether it lowers the cost of checking.

**Four — carry.** The person leaves with a question they can use. Not an answer, not a score, not a subscription. The action layer's psychological job is to prevent the dead end that follows any critique: *you have been told something is wrong and you have no move*. That state produces either dismissal or anxiety, and neither serves the person.

### What the interface is psychologically trying to accomplish

Five things, in priority order when they conflict.

1. **Comprehension of a specific, checkable claim about the person's own answer.** If the person cannot restate one finding in their own words, nothing else counted.
2. **Calibrated rather than maximal trust.** The person should end more confident about what Imbas checked and *less* confident that Imbas settled anything. A person who leaves believing their answer was certified has been harmed by the product.
3. **Agency.** The person, not Imbas, decides what the finding means and what to do about it.
4. **A next move.** One, obvious, low-commitment, reversible.
5. **A correct model of the boundary.** The person should understand that unmarked text was not cleared, only unmarked.

Item 5 is the hardest and it is the one the mechanic works against. Say it plainly and structurally, not only in a sentence at the bottom.

### The single thesis sentence

**The Reader should read as a margin, not a verdict: the person's own answer stays the object on screen, the evidence sits inside it, the interpretation sits immediately beside the evidence, exactly one thing asks to be done next, and the accent color is spent only where a real observation lives.**

---

## 2. Evidence table

Classification is deliberately conservative. STRONG EMPIRICAL means replicated experimental work or meta-analysis with a reported effect size. ESTABLISHED HEURISTIC means a principle with real empirical roots that is routinely over-applied beyond its tested range. PLAUSIBLE EXTRAPOLATION means the mechanism is sound but the Imbas application has not been tested by anyone.

| Principle | Class | Best sources | Mechanism | Imbas implication | Misuse risk |
|---|---|---|---|---|---|
| Spatial contiguity: integrating related material in one visual field beats separating it | STRONG EMPIRICAL (*g* ≈ 0.63) | Schroeder & Cenkci 2018 (meta-analysis, *Educational Psychology Review*); Chandler & Sweller 1991 | Separated sources force the reader to hold one in working memory while searching for the other | Evidence must expand in place inside READ. A control that navigates the reader away from the marked text to see its explanation destroys the effect | Used to justify cramming everything onto one screen; the effect is about *related* items, not all items |
| Highlighting value falls as highlighting frequency rises; invalid highlights are worse than none | STRONG EMPIRICAL | Fisher & Tan 1989 (*Human Factors*) | Selective emphasis works by contrast against unemphasized ground; frequent emphasis removes the ground | The empirical spine of the accent-marks-only law. 35 ember-bearing elements is not a scarce accent | Used to argue for minimalism generally; the finding is specifically about *marks that claim validity* |
| Marking a subset raises perceived accuracy of the unmarked remainder (implied truth effect) | STRONG EMPIRICAL (*n* = 6,739) | Pennycook, Bear, Collier & Rand 2020 (*Management Science*) | Absence of a mark is read as an applied and passed check | The strongest single finding against Imbas's mechanic. Requires an explicit, structural statement of what was *not* checked, not only a sentence | Treated as a reason to mark everything, which destroys the contrast that makes marks work |
| Lowering the cost of verification reduces overreliance on automated judgments | STRONG EMPIRICAL | Vasconcelos, Jörke, Grunde-McLaughlin, Gerstenberg, Bernstein & Krishna 2023 (CSCW) | People are cost-rational about checking; explanations help only when they make checking cheap | The empirical case *for* the strata model. INSPECT justifies itself by cutting verification cost, not by adding detail | Used to justify adding explanation volume, which raises cost and backfires |
| Nonprobative detail inflates belief | STRONG EMPIRICAL | Newman, Garry, Bernstein, Kantner & Lindsay 2012 (*Psychonomic Bulletin & Review*) | Related but uninformative content increases fluency and felt truth | Hashes, record IDs and timestamps will raise confidence in findings they cannot support. Rank them below comprehension | Used to argue for removing provenance; the fix is placement, not deletion |
| Invented trust seals raise trust | STRONG EMPIRICAL | Kirlappos, Sasse & Harvey 2012 | People read the *form* of assurance rather than its content | Certification aesthetics must be avoided even where the underlying record is real | Used to argue that provenance is dishonest; it is not, its visual framing can be |
| Freedom-threatening messages produce reactance and reduce persuasion | STRONG EMPIRICAL (meta-analysis) | Rains 2013 (*Human Communication Research*) | Perceived threat to autonomy generates counter-argument and source derogation | The real, evidenced case against a prosecutorial register. Not the backfire effect | Confused with backfire, which did not replicate |
| Corrections generally work; backfire is rare | STRONG EMPIRICAL | Wood & Porter 2019 (*Political Behavior*, 8,100+ subjects) | Correction effects are robust across ideology | Do **not** build doctrine on "telling people they are wrong makes it worse." Build it on reactance instead | Widely cited folklore in UX writing; must not enter Imbas doctrine |
| Accurate-but-slanted headlines bias reasoning about the article beneath them | STRONG EMPIRICAL | Ecker, Lewandowsky, Chang & Pillai 2014 (*JEP: Applied*) | The headline sets a frame that later text does not fully overwrite | Directly load-bearing for Z1.4. A prose claim headline is not neutral merely because it is true | Used to ban headlines entirely; the finding is about slant, not about prose |
| Attribute framing changes evaluation of identical information | STRONG EMPIRICAL | Levin, Schneider & Gaeth 1998 (*OBHDP*) | Valence-consistent encoding | **A bare count is also a frame.** Any Z1.4 memo that treats "3 items" as the neutral option is wrong | Used to claim all framings are equal and therefore nothing matters |
| Isolated numbers are hard to evaluate without a reference class | STRONG EMPIRICAL | Hsee 1996 evaluability (*OBHDP*); Reyna & Brainerd fuzzy-trace | People reason on gist; a naked number has no gist | "3 candidate items" gives the person no way to know whether 3 is a lot | Used to justify adding a comparison baseline Imbas cannot support |
| Verbal plus numeric probability beats either alone | STRONG EMPIRICAL | Budescu, Por, Broomell & Smithson 2014 (*Nature Climate Change*) | Dual encoding reduces regression toward 50% | The closest direct support for a hybrid GLANCE that pairs a short claim with the count | Overgeneralized from probability to all quantities |
| Working memory holds about four chunks, not seven | STRONG EMPIRICAL | Cowan 2001 (*BBS*) | Capacity limit on active chunks | A person cannot hold more than about four simultaneous relationships between marks, labels and explanations | Turned into an arbitrary "max four items per list" rule |
| Color, size and orientation guide attention preattentively | STRONG EMPIRICAL | Wolfe & Horowitz 2017 (*Nature Human Behaviour*) | A small set of features supports parallel guidance | Ember is a guiding attribute. A singleton pops out; twenty ember values do not | Used to justify color-coding taxonomies, which defeats singleton pop-out |
| Common region and proximity group elements | STRONG EMPIRICAL | Palmer 1992 (*Cognitive Psychology*); Palmer & Rock 1994 | Enclosure and distance drive perceived grouping | A finding's label, explanation and quote must share one bounded region. Grouping is what removes the memory burden | Used to add borders everywhere, which creates dashboard character |
| Perceived clutter, not element count, predicts search difficulty | STRONG EMPIRICAL | Rosenholtz, Li & Nakano 2007 (*Journal of Vision*) | Feature congestion degrades target detection | **There is no defensible universal density threshold.** Density rules must be stated as feature-variety limits, not element counts | Fake "7±2 items per screen" rules |
| Choice reaction time rises with alternatives | ESTABLISHED HEURISTIC | Hick 1952; Hyman 1953 | Log-linear RT in number of equiprobable alternatives | Argues for one emphasized action, not for minimal features generally | Applied to visual scanning of unfamiliar sets, where it does not hold |
| Choice overload is real but small and highly conditional | ESTABLISHED HEURISTIC (mean effect near zero) | Scheibehenne, Greifeneder & Todd 2010 (*JCR*) | Moderators dominate | Four parity actions is a *hierarchy* problem, not an overload problem. State it that way | Cited as though more options always harm |
| Information scent drives navigation | ESTABLISHED HEURISTIC | Pirolli & Card 1999 (*Psychological Review*) | Foraging on proximal cues to distal value | Labels for INSPECT must name what is behind them | Used to justify curiosity-gap labels, which is engagement design |
| Processing fluency raises judged truth and liking | STRONG EMPIRICAL | Alter & Oppenheimer 2009; Reber, Schwarz & Winkielman 2004 | Metacognitive ease misattributed to content | A beautifully typeset finding is believed more than a plain one. Imbas benefits from this and must not cash it in | Used to argue for deliberate ugliness |
| Screen reading shows a small comprehension penalty, worse under time pressure | STRONG EMPIRICAL (*g* ≈ −0.21) | Delgado, Vargas, Ackerman & Salmerón 2018 (*Educational Research Review*) | Shallower processing and poorer calibration on screen | Do not compress the READ stratum to save scroll. Do not add timers or urgency | Used to claim mobile users cannot read, which is false |
| Cognitive forcing reduces overreliance but is disliked | STRONG EMPIRICAL | Buçinca, Malaya & Gajos 2021 (CSCW) | Interrupting fast responding improves accuracy at a satisfaction cost | Imbas should get its forcing from *structure* (evidence before interpretation), not from interruption | Used to justify friction as a general good |
| Explanations increase acceptance regardless of correctness | STRONG EMPIRICAL | Bansal et al. 2021 (CHI) | Explanations act as a credibility cue | THE READ prose will raise acceptance whether or not it is right. It must carry its own scope limit | Used to argue against explanations |
| Interface cues trigger credibility heuristics | ESTABLISHED HEURISTIC | Sundar 2008 (MAIN model) | Modality, agency, interactivity and navigability cues map to heuristics | "Reader agent" attribution triggers a machine heuristic that raises perceived objectivity | Treated as predictive rather than descriptive |
| Line length affects reading, with no single optimum | ESTABLISHED HEURISTIC | Dyson & Haselgrove 2001 (*IJHCS*) | Saccade and return-sweep costs trade against scroll cost | Imbas should state a range, not a magic number | Turned into "exactly 66 characters" |
| Attention residue persists across task switches | ESTABLISHED HEURISTIC | Leroy 2009 (*OBHDP*) | Incomplete tasks occupy attention | Sending the person to another AI mid-result leaves residue. The handoff belongs at the end | Used to forbid all external links |
| Marking absence positionally is comprehensible | PLAUSIBLE EXTRAPOLATION | No direct study located | Anchoring an omission to adjacent present text may or may not read as "this text is wrong" | The live product does this (mark 1). It needs a probe, not a rule | Assumed to work because it looks reasonable |
| A prose claim headline aids gist formation for non-expert readers | PLAUSIBLE EXTRAPOLATION | Reyna fuzzy-trace supports gist; no study on inspection-result headlines | Gist is what people retain and reason with | Supports Z1.4 Option A in principle, settles nothing about Imbas specifically | Treated as evidence that Imbas should ship a claim headline |

---

## 3. Binding design doctrine

Twenty-six rules. Each is written to be checkable by a person who has never read this document. Each carries exactly one measurability class. Where a rule is JUDGMENT, it says plainly that research constrains the space and does not settle the implementation.

Rules marked **[live delta]** describe a difference between the rule and what the 2026-08-13 run rendered. That flag is a statement of fact, not an instruction to change anything.

---

### R1 — One ember-filled control per result surface

**Rule.** At most one control on a result surface may carry a solid ember fill. All other eligible actions render as outline, ghost or text controls.
**Principle.** Singleton pop-out requires a unique guiding feature; a second instance halves guidance.
**Evidence.** STRONG EMPIRICAL — Wolfe & Horowitz 2017; Fisher & Tan 1989.
**Governs.** Result surface, all strata, all viewports.
**Rationale.** Preattentive guidance is a contrast mechanism. Two ember fills do not produce two primaries; they produce zero, because the person must now compare them serially. The cost lands hardest on the person least able to spend it.
**Measurability.** MEASURABLE-NOW.
**Measure.** Count elements within the result container whose computed `background-color` is in the ember family with alpha ≥ 0.7. Assert ≤ 1.
**Prevents.** Dual-primary paralysis; accent inflation.
**[live delta]** Two ember fills render 327px apart: "Ask your AI →" (7066) and "Test another question" (7393).

---

### R2 — Accent budget on the result surface

**Rule.** Ember may carry only five semantic roles: (a) an evidence mark tint, (b) a mark numeral, (c) a behavior-class label, (d) the single primary action, (e) at most one consequential figure where one exists. Any element carrying ember must map to one of these five. Decorative ember rules, dividers, dots, arrows, borders and hover states are excluded.
**Principle.** Emphasis derives value from the unemphasized ground.
**Evidence.** STRONG EMPIRICAL — Fisher & Tan 1989.
**Governs.** Result surface.
**Rationale.** The brief's accent-marks-only law is not an aesthetic preference; it is the operating condition under which a mark means anything. If ember also means "this is a divider" and "this is a hover state", then ember on a span of the person's answer stops meaning "we observed something here."
**Measurability.** MEASURABLE-NOW.
**Measure.** Enumerate visible elements with an ember-family computed color, background or border on the result container; assert each maps to one of the five roles. A count ceiling is a founder choice, not a research finding; the *role* test is the research finding.
**Prevents.** Highlight devaluation; visual prosecution by accumulation.
**[live delta]** 35 ember-bearing visible elements and 20 distinct ember alpha/hue values on one result surface.

---

### R3 — Evidence marks are tints or underlines, never fills, and never colored body text

**Rule.** An evidence mark applies a low-alpha ember tint (or a rule/underline) beneath unchanged body text. Body text inside a mark keeps the standard ink color. No mark may set body text to an accent color, and no mark may use a solid accent fill behind body text.
**Principle.** Text contrast is a hard accessibility floor; accent hues at this luminance cannot carry body text.
**Evidence.** STRONG EMPIRICAL — WCAG 2.2 SC 1.4.3; computed contrast in §0.6.
**Governs.** READ stratum; any quoted anchor.
**Rationale.** `#B46A5A` on `#2A211E` computes to 3.86:1 and fails the 4.5:1 body-text threshold. The shipped `#DE6F38` computes to 4.82:1 and passes, but only barely and only for the token itself, not for arbitrary composites over it. The live 16% tint under standard ink computes to 8.46:1. The tint is the only treatment in the tested set with headroom.
**Measurability.** MEASURABLE-NOW.
**Measure.** Compute the WCAG contrast ratio of the composited mark text against the composited mark background at every mark. Assert ≥ 4.5:1; target ≥ 7:1.
**Prevents.** Illegible evidence; accidental AA failure when the accent token changes.

---

### R4 — Mark numerals follow the reading order of the inspected answer

**Rule.** Mark numerals ascend in the document order of the person's answer. The findings list may be ordered by anything, but it displays the answer-order numeral.
**Principle.** Recognition scaffolding fails when the ordinal system contradicts the spatial one.
**Evidence.** STRONG EMPIRICAL — Cowan 2001 (chunk capacity); ESTABLISHED HEURISTIC for the ordering convention itself.
**Governs.** READ stratum; findings list.
**Rationale.** A person reading top to bottom builds a mental sequence. If the sequence is 2, 1, 3 and the list is 1, 2, 3, the person must maintain a mapping between two orderings. That is a pure tax with no compensating benefit, and it grows with finding count.
**Measurability.** MEASURABLE-NOW.
**Measure.** Extract marks in DOM order; assert their numerals are strictly ascending.
**Prevents.** Working-memory tax; mis-binding a finding to the wrong quote.
**[live delta]** Marks render 2, 1, 3 top to bottom.

---

### R5 — A mark and its explanation are never more than one viewport apart, or the mark expands in place

**Rule.** For every mark, either (a) the vertical distance from the mark to the first line of its own explanation is less than one viewport height, or (b) activating the mark expands its explanation inside the same scroll container, adjacent to the mark, without moving the scroll position of the mark itself.
**Principle.** Spatial contiguity.
**Evidence.** STRONG EMPIRICAL — Schroeder & Cenkci 2018 (*g* ≈ 0.63); Chandler & Sweller 1991.
**Governs.** READ stratum; the READ→INSPECT transition.
**Rationale.** This is the largest single effect in the whole evidence base and it is the one Imbas is structurally best positioned to capture, because the evidence genuinely lives inside the person's own text. Separating the mark from its meaning throws away the product's native advantage.
**Measurability.** MEASURABLE-NOW.
**Measure.** The existing claim→proof proximity instrument. Assert max(mark → own explanation) < viewport height at each tested viewport.
**Prevents.** Split attention; the reader losing which mark is being discussed.
**[live delta]** Mark 2 → its restatement is 762px at a 900px viewport, which leaves no room for both plus surrounding context.

---

### R6 — A finding is stated in full exactly once

**Rule.** Each finding appears in one canonical full statement. Other strata may *reference* it (by numeral, by short noun phrase) but may not restate its content in new words.
**Principle.** Redundancy effect — presenting the same content in multiple forms imposes load without adding learning.
**Evidence.** STRONG EMPIRICAL — Chandler & Sweller 1991; Sweller cognitive load theory.
**Governs.** Whole result surface.
**Rationale.** Four restatements do not reinforce; they force the reader to check whether the fourth version says something new. That check is expensive and it is performed on every finding. Restatement also multiplies the surface on which register can slip.
**Measurability.** MEASURABLE-NOW.
**Measure.** For each finding, count result-surface blocks containing a full independent statement of it. Assert = 1. Reference-only mentions do not count.
**Prevents.** Cognitive overload; register drift; the sensation of being lectured.
**[live delta]** Each of the three findings is stated four times in four different wordings.

---

### R7 — Finding internal order is fixed and identical everywhere

**Rule.** Within a finding, the order of class label, explanation and quoted anchor is fixed product-wide. Whichever order is chosen, no surface may vary it.
**Principle.** Consistent identification lets a reader reuse a parse instead of re-deriving it.
**Evidence.** STRONG EMPIRICAL for the underlying consistency requirement — WCAG 2.2 SC 3.2.4; ESTABLISHED HEURISTIC for the cognitive benefit magnitude.
**Governs.** All finding renderings, all strata, case pages and reader results alike.
**Rationale.** The person learns the pattern once on finding one and applies it free on findings two and three. Variation destroys that.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert identical child-role sequence across all rendered findings.
**Prevents.** Re-parsing cost; mis-binding.
**Note.** The live surface already satisfies this (label → explanation → quote). R15 constrains *whether the label leads*, not whether the order is consistent.

---

### R8 — One primary action per scroll position

**Rule.** At any scroll position, only one next-step action may carry primary visual emphasis. Additional eligible actions remain perceptually subordinate until the person requests them.
**Principle.** Hierarchy, not option count, determines decision cost here.
**Evidence.** ESTABLISHED HEURISTIC — Hick 1952 / Hyman 1953 for the RT relationship; Scheibehenne et al. 2010 establishes that raw option count has a near-zero mean effect, so the operative variable is *emphasis parity*, not *number*.
**Governs.** All action groups.
**Rationale.** Four transparent 44px buttons at identical weight force a serial comparison of four labels. The literature does not support "fewer options are better" as a law; it does support that undifferentiated alternatives cost more than differentiated ones.
**Measurability.** MEASURABLE-NOW.
**Measure.** Within any control group, assert at most one control differs from its siblings on fill, and assert siblings are not all identical in computed weight, size and fill.
**Prevents.** Choice paralysis by parity; the "nothing is recommended so nothing matters" read.
**[live delta]** Copy Result / Copy Full Receipt / Share this inspection / Run again render at complete parity.

---

### R9 — Record and export controls follow the last interpretive block of their stratum

**Rule.** Controls whose function is to export, copy or share the record render after the last interpretive content of the stratum they belong to, never above or between interpretive blocks.
**Principle.** Provenance raises confidence without carrying information; placing it before comprehension lets it substitute for comprehension.
**Evidence.** STRONG EMPIRICAL — Newman et al. 2012 (nonprobative detail inflates belief); Kirlappos et al. 2012.
**Governs.** All record/export/share controls.
**Rationale.** A person who meets "Download receipt" before they have read what the finding says has been handed a certification cue in place of an argument.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert DOM order: every element with an export/share role comes after the last interpretive element in its stratum.
**Prevents.** Certification aesthetics; provenance dominating result comprehension.
**[live delta]** Copy JSON / Download receipt render at 4611, above "THE READ" prose at 4721.

---

### R10 — Record actions collapse to one visible control plus a disclosure

**Rule.** Copy, download, receipt and share functions render as one visible control with the remainder behind a single disclosure. The disclosure label names what is behind it.
**Principle.** Information scent plus emphasis differentiation.
**Evidence.** ESTABLISHED HEURISTIC — Pirolli & Card 1999; Hick/Hyman as above.
**Governs.** Record action groups.
**Rationale.** These are not decisions the person came to make. They should occupy the visual weight of a utility, not of a choice.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert ≤ 2 visible sibling controls in any record-action group.
**Prevents.** Choice parity; dashboard creep.

---

### R11 — Stratum progression never relocates the reader away from the marked text

**Rule.** Moving from READ to INSPECT mounts content inside the same scroll container, adjacent to the element that triggered it. No stratum change may navigate to a new route, open a modal that covers the marked text, or scroll the triggering mark out of view.
**Principle.** Spatial contiguity, applied to the transition rather than the layout.
**Evidence.** STRONG EMPIRICAL — Schroeder & Cenkci 2018.
**Governs.** READ → INSPECT.
**Rationale.** Progressive disclosure is a load-reduction technique only when the disclosed material lands next to its trigger. Disclosure that relocates the reader converts a contiguity benefit into a split-attention cost.
**Measurability.** MEASURABLE-NOW.
**Measure.** After activating any INSPECT affordance, assert (a) the triggering element's bounding rect remains within the viewport, and (b) no route change occurred.
**Prevents.** Split attention; losing the thread.

---

### R12 — Every mark is keyboard-reachable and programmatically bound to its explanation

**Rule.** Each evidence mark is focusable, carries an accessible name that includes its numeral and its behavior class, and carries a programmatic relationship to its explanation. Each explanation carries the reciprocal relationship back.
**Principle.** Information and relationships conveyed through presentation must be programmatically determinable.
**Evidence.** STRONG EMPIRICAL as a conformance requirement — WCAG 2.2 SC 1.3.1; DPUB-ARIA `doc-noteref` / `doc-endnote` for the reference pattern.
**Governs.** READ stratum.
**Rationale.** The ember tint is the *only* channel currently carrying "this text is the evidence." A person using a screen reader receives the visually-hidden "mark" label and the numeral, but no route to what the mark means, and no way to move there. That is not a polish item; it is the whole product for that person.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert each mark is in the tab order (or reachable by an equivalent documented mechanism), exposes a name containing its numeral, and resolves an `aria-details`/`aria-describedby`/`doc-noteref` relationship to an existing element ID.
**Prevents.** Total evidence loss for assistive-technology users; conformance failure.
**[live delta]** Marks carry no `tabindex`, `role`, `id` or ARIA relationship.
**Implementation note, not a rule.** `aria-details` support across screen readers is uneven. A `doc-noteref` link to an in-page `doc-endnote` is the more conservative pattern. This is an engineering choice, not a doctrine choice.

---

### R13 — Inline marks may stay small only if a full-size equivalent exists

**Rule.** An evidence mark or numeral may render below the 24×24 CSS-pixel target minimum only when an equivalent, full-size control for the same finding exists in the findings list.
**Principle.** The inline exception to the target-size minimum is conditional on an equivalent control existing elsewhere.
**Evidence.** STRONG EMPIRICAL as a conformance requirement — WCAG 2.2 SC 2.5.8, inline exception.
**Governs.** READ stratum; findings list.
**Rationale.** This makes the findings list a conformance mechanism rather than a convenience, which is an argument for keeping it that no aesthetic preference can override.
**Measurability.** MEASURABLE-NOW.
**Measure.** For each mark below 24×24, assert a same-finding control exists in the findings list at ≥ 24×24.
**Prevents.** Target-size failure; loss of the findings list to a minimalism argument.

---

### R14 — GLANCE contains at most one heading and one line, together no more than 35 words

**Rule.** The first result block contains a heading and at most one supporting line. Combined word count does not exceed 35. No third element renders above the person's answer.
**Principle.** A 2–5 second orientation budget at 200–300 wpm is 7–35 words.
**Evidence.** STRONG EMPIRICAL for the reading-rate range — Rayner et al. 2016. The 2–5 second target is a founder choice; the word ceiling that follows from it is arithmetic.
**Governs.** GLANCE.
**Rationale.** Naming a word ceiling makes the founder's stated 2–5 second intention enforceable instead of aspirational. The ceiling is the honest translation; the interval it translates is a design decision.
**Measurability.** MEASURABLE-NOW.
**Measure.** Word count of the GLANCE block. Assert ≤ 35 and assert block child count ≤ 2.
**Prevents.** Orientation failure; the person scrolling past the frame without having formed one.
**Note.** The live GLANCE is 14 words and complies. Z1.4 (§10) asks what those words should *do*, not how many there should be.

---

### R15 — Behavior-class labels are subordinate to the finding statement

**Rule.** A behavior-class label (OMISSION, FRAMING DRIFT, DEFLECTION) never renders larger, heavier or higher-contrast than the explanation it labels, and never appears in the GLANCE stratum as a standalone prominent token.
**Principle.** A category label read before its content is encoded as a verdict about the content.
**Evidence.** STRONG EMPIRICAL for the framing mechanism — Ecker et al. 2014; Levin et al. 1998. PLAUSIBLE EXTRAPOLATION for the specific label-position claim in this product.
**Governs.** All finding renderings; GLANCE.
**Rationale.** "DEFLECTION" in ember mono above a sentence is a strong evaluative frame in a product whose register law is *signal, not verdict*. The label is useful for the record and for people who have learned the taxonomy. Neither of those is the cold reader's first-pass need. This rule does not remove the label and does not rename it; it constrains its weight.
**Measurability.** MEASURABLE-WITH-PROBE for whether label-first reads as accusation; MEASURABLE-NOW for the weight constraint itself. Classify as **MEASURABLE-NOW** for enforcement, with the perceptual claim tested by Gate 2 Task 4.
**Measure.** Assert label computed font-size ≤ explanation font-size and label contrast ratio ≤ explanation contrast ratio. Assert no class label in the GLANCE block.
**Prevents.** Verdict-like reading; prosecutorial register; reactance.

---

### R16 — Scope statements render once per stratum boundary, never in accent

**Rule.** The statement of what the inspection did not do renders exactly once per stratum, at the stratum's boundary, in body register. It never carries accent color, a warning glyph, or a bounding box that reads as an alert.
**Principle.** Repeating a caveat converts it into boilerplate that readers learn to skip; styling it as an alert makes it read as a disclaimer rather than a fact about scope.
**Evidence.** ESTABLISHED HEURISTIC — habituation to repeated warnings; consistent with Fisher & Tan's frequency finding applied to text emphasis.
**Governs.** Whole result surface.
**Rationale.** The scope statement is doing the heaviest lifting against the implied truth effect. It must be read, which means it must not look like the thing people have learned to skip.
**Measurability.** MEASURABLE-NOW.
**Measure.** Count blocks containing a scope statement; assert ≤ 1 per stratum. Assert no ember-family color on those elements.
**Prevents.** Caveat blindness; compliance-software character.
**[live delta]** The admission-boundary sentence renders at least twice (measure block and meaning block).

---

### R17 — No count of findings receives accent treatment

**Rule.** A numeral expressing how many findings were produced never renders in ember, never renders larger than the heading it sits in, and never animates or counts up.
**Principle.** Accent on a quantity converts a measurement into a score.
**Evidence.** ESTABLISHED HEURISTIC — Wolfe & Horowitz 2017 (a guiding attribute on a number makes the number the target); consistent with the register law.
**Governs.** GLANCE; any summary block.
**Rationale.** The moment the count is the ember object on the screen, Imbas is a severity meter. Note that the brief permits ember on "a consequential gap figure." A finding count is not a gap figure; it is an inventory of the instrument's own output.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert no ember-family computed color on any element containing only the finding count.
**Prevents.** Gotcha salience; visual sensationalism; score creep.
**Note.** The live GLANCE complies — the count renders in ink, not ember.

---

### R18 — Zero findings renders in the same structural template as findings

**Rule.** A result with no findings uses the same block sequence, the same typographic scale and the same visual weight as a result with findings. It carries no success color, no checkmark, no green, no "clean" language pattern, and it retains the scope statement at full weight.
**Principle.** Implied truth effect — absence of a mark is read as an applied and passed check unless the interface says otherwise.
**Evidence.** STRONG EMPIRICAL — Pennycook et al. 2020 (*n* = 6,739).
**Governs.** Empty-findings state.
**Rationale.** This is the highest-consequence state in the product and the easiest to get wrong, because every design instinct says to reward the person. A person who reads "nothing found" as "verified" has been given false confidence by Imbas about content Imbas never checked. The empty state must communicate *this inspection surfaced nothing*, which is a fact about the inspection, not about the answer.
**Measurability.** MEASURABLE-NOW for structure; MEASURABLE-WITH-PROBE for interpretation.
**Measure.** Structural: assert block sequence and type scale match the populated state; assert no color outside the standing system. Probe: Gate 2 Task 5 — after a zero-finding result, ask the person what the result tells them about the parts of the answer that were not discussed. Target response names the limit rather than a clearance.
**Prevents.** Implied certification; the single worst trust failure available to this product.

---

### R19 — Provenance artifacts never render above the first finding

**Rule.** Hashes, record identifiers, run timestamps, model identifiers and custody information never appear above the first finding on any result surface. They belong at INSPECT level or after the last interpretive block.
**Principle.** Nonprobative detail raises belief; front-loading it swaps evidence quality for the appearance of rigor.
**Evidence.** STRONG EMPIRICAL — Newman et al. 2012; Kirlappos et al. 2012.
**Governs.** Whole result surface.
**Rationale.** A hash above a finding tells the person the finding is authoritative. It does not tell them it is right, and it cannot. Ranking is given in §8.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert DOM order: no element with a provenance role precedes the first finding element.
**Prevents.** Certification aesthetics; bureaucratic character; unearned trust.

---

### R20 — The derived question renders as literal text before any control

**Rule.** The derived question renders as selectable, copyable, visible text in its final form, above and before any control that copies, sends or hands it off.
**Principle.** Perceived control requires seeing the artifact before acting on it.
**Evidence.** ESTABLISHED HEURISTIC — agency and perceived control in decision support; consistent with the non-steering requirement.
**Governs.** Action layer.
**Rationale.** A person who copies a question they have not read has been made an instrument. Imbas's give-nothing-away standard is only verifiable by the person if the person can see the question.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert the question text node precedes all action controls in DOM order and is user-selectable.
**Prevents.** Loss of agency; the person carrying a question they cannot vouch for.
**Note.** The live surface complies.

---

### R21 — No control transmits the derived question anywhere

**Rule.** No control on the result surface sends the derived question to any model, service or endpoint. Handoff means copy and open, never send.
**Principle.** Product doctrine, restated as UI law so that it is testable rather than remembered.
**Evidence.** Not an empirical claim. Standing Imbas doctrine.
**Governs.** Action layer.
**Rationale.** Auto-send would make Imbas a producer of answers, which is the boundary the product exists on the correct side of. Restating it as a checkable UI assertion protects it from erosion by convenience.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert no control on the result surface issues a network request carrying the question body to a generation endpoint.
**Prevents.** Boundary collapse; Imbas becoming the answering party.

---

### R22 — The perception probe never precedes or gates the derived question

**Rule.** Any question asking the person how the result felt renders after the derived question and never blocks access to it. It carries no accent, no required state, and no reward for either response.
**Principle.** Asking for a judgment before providing the action both anchors the judgment and converts a research instrument into a toll.
**Evidence.** ESTABLISHED HEURISTIC — acquiescence bias and demand characteristics in self-report; anchoring.
**Governs.** Action layer.
**Rationale.** A yes/no probe placed before the payoff reads as a paywall of feeling. It also contaminates the very signal it collects.
**Measurability.** MEASURABLE-NOW.
**Measure.** Assert probe DOM position follows the derived question, and assert the question remains reachable and copyable without interacting with the probe.
**Prevents.** Engagement-instrument creep; contaminated self-report.
**Note.** The live surface complies on ordering (probe 6623, question 6755) and this rule freezes that.

---

### R23 — At 390px the current stratum's primary action is reachable without horizontal scroll and is never obscured

**Rule.** At 390 CSS pixels wide, the primary action for the stratum the person is currently reading is reachable by vertical scroll alone, and no sticky or fixed element covers it or covers a focused element.
**Principle.** Reflow and focus visibility are conformance floors, not preferences.
**Evidence.** STRONG EMPIRICAL as conformance — WCAG 2.2 SC 1.4.10 Reflow, SC 2.4.11 Focus Not Obscured (Minimum).
**Governs.** 390px and below.
**Measurability.** MEASURABLE-NOW.
**Measure.** At 390×844: assert `document.scrollWidth ≤ clientWidth`; tab through all controls and assert each focused element's rect is fully within the viewport and not intersected by any fixed-position element.
**Prevents.** Reflow failure; hidden focus; unusable action layer on the majority viewport.
**Status.** **Not yet run.** The 2026-08-13 session could not force a 390px viewport (see §0.8).

---

### R24 — At 390px a mark and its explanation are co-visible or the mark expands in place

**Rule.** At 390 CSS pixels, either a mark and the first line of its own explanation fit in one viewport, or activating the mark expands the explanation immediately beneath it without moving the mark out of view.
**Principle.** Spatial contiguity binds harder at small viewports, because the viewport is the working-memory buffer.
**Evidence.** STRONG EMPIRICAL — Schroeder & Cenkci 2018; Delgado et al. 2018 for the small screen-reading penalty that makes the cost worse.
**Governs.** 390px and below.
**Rationale.** On desktop a 762px separation is survivable. On an 844px-tall phone with browser chrome, it is not: the mark leaves the screen before the explanation arrives, and the person is comparing two things they cannot see at once.
**Measurability.** MEASURABLE-NOW.
**Measure.** At 390×844, for each mark: assert distance to first line of its own explanation < effective viewport height, **or** assert an in-place expansion exists and the mark rect stays in the viewport after activation.
**Prevents.** Complete loss of the claim→proof relationship on the primary viewport.
**Status.** Not yet run.

---

### R25 — Content survives text-spacing overrides and 400% zoom

**Rule.** The result surface remains fully readable and operable with user text-spacing overrides applied, and at 400% zoom on a 1280px-wide viewport (equivalent to 320 CSS pixels).
**Principle.** Conformance floor.
**Evidence.** STRONG EMPIRICAL as conformance — WCAG 2.2 SC 1.4.12 Text Spacing, SC 1.4.10 Reflow.
**Governs.** All viewports.
**Rationale.** Marks, numerals and inline anchors are the elements most likely to break under spacing overrides, because they are inline and small. The evidence layer is the layer most at risk.
**Measurability.** MEASURABLE-NOW.
**Measure.** Apply the SC 1.4.12 override set (line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12em, word-spacing 0.16em); assert no clipping and no loss of content or function. Separately assert no two-dimensional scroll at 320 CSS pixels.
**Prevents.** Evidence-layer breakage for the readers who most need adjustable text.

---

### R26 — Nothing on the result surface animates, reveals progressively, or counts after completion

**Rule.** Once an inspection completes, no result element animates in, counts up, staggers, pulses or reveals on scroll. State changes during the run are permitted; state changes after it are not.
**Principle.** Motion is a preattentive guiding attribute and post-completion motion has no informational referent.
**Evidence.** STRONG EMPIRICAL for motion as a guiding attribute — Wolfe & Horowitz 2017. ESTABLISHED HEURISTIC for the engagement-design association.
**Governs.** Result surface.
**Rationale.** Reveal animation on a finding is the visual grammar of a reveal, and Imbas's register law forbids reveal. It also spends attentional guidance on a decorative event.
**Measurability.** MEASURABLE-NOW.
**Measure.** Capture frame differences over a fixed window after completion with no user input; assert no pixel change outside caret and focus indicators.
**Prevents.** Sensational character; engagement optimization; motion-sensitivity harm.

---

## 4. GLANCE → READ → INSPECT

The strata exist and this document does not relitigate them. What follows specifies each one's cognitive objective, permitted and discouraged content, progression trigger and trust function.

Answering question **B** directly: the model belongs, and the reason is empirical rather than aesthetic. Overreliance on an automated judgment falls when the cost of verifying that judgment falls (Vasconcelos et al. 2023). Strata are a cost-reduction device: a person who wants only orientation pays only for orientation, and a person who wants to check pays a small marginal cost to check. The model would *not* belong if the strata were merely three levels of detail, because then INSPECT would be volume rather than verification. The test that keeps the model honest is: **does each stratum make checking cheaper than the one above it?** If INSPECT adds detail without adding checkability, it has become dashboard creep.

---

### GLANCE

**Cognitive objective.** The person forms a correct, minimal frame: something was observed in *my* answer, the evidence is directly below, this is an observation rather than a ruling.

**Permitted.** One heading. One supporting line. Nothing else. Total ≤ 35 words (R14).

**Discouraged.** Behavior-class labels as prominent tokens (R15). Accent on the count (R17). Any provenance artifact (R19). Any action control. A severity indicator of any kind. A comparison to other answers, other models or a population baseline, because Imbas cannot support one at the individual-run level.

**Progression trigger.** Continued scroll. No control, no gate, no "see evidence" button. The person's own answer appearing immediately below is the trigger, and it is a strong one because it is the thing they recognize.

**Trust function.** GLANCE establishes that the object of inspection is *the person's own text*, not Imbas's opinion about the world. This is where the non-verdict posture is either won or lost, and it is won structurally: the very next thing on screen is the person's own words.

**The open question.** What the heading should *say* is Z1.4 and this document does not rule it (§10).

---

### READ

**Cognitive objective.** The person recognizes their own answer, sees where the observations attach, and reads what each one means with the evidence still in view.

**Permitted.** The answer in full, unedited. Inline marks with numerals in answer order (R4). Per-finding blocks containing class label, explanation and quoted anchor in a fixed order (R7), grouped inside one bounded region per finding. One scope statement at the stratum boundary (R16).

**Discouraged.** Any re-statement of a finding already stated (R6). Provenance artifacts (R19). Export controls before the last interpretive block (R9). Truncation or summarization of the person's answer — the whole point is that they recognize it. Fabricated positions for material that is not in the answer.

**Progression trigger.** Activating a mark or a finding. This must expand in place (R11).

**Trust function.** READ is where Imbas earns everything. The evidence is inside text the person wrote or received, so they can check it without leaving. Verification cost here is nearly zero, and that is the mechanism by which appropriate reliance forms.

**On grouping.** Each finding's label, explanation and quote must sit inside one visually bounded region. Common region is a stronger grouping cue than proximity alone (Palmer 1992), and the burden it removes — remembering which explanation belongs to which quote — is exactly the burden the founder's sixth intention names.

---

### INSPECT

**Cognitive objective.** The person who wants to check the record can check it, at a cost proportional to their interest, without the person who does not want to check paying anything.

**Permitted.** Span offsets and exact positions. Record identifiers, run timestamps, model identity, custody and hash information. Source relationships. Methodology links. Prior runs of the same case where they exist.

**Discouraged.** Anything that must be understood for the finding to make sense. If a person needs INSPECT to understand a finding, the finding has failed at READ. Also discouraged: any INSPECT element that renders above a finding (R19), and any presentation of INSPECT as a completeness or thoroughness signal.

**Progression trigger.** An explicit request, with a label that names what is behind it (information scent). "Show the exact span in the answer" carries scent; "Details" does not.

**Trust function.** INSPECT is the standing offer of falsifiability. Its trust value comes almost entirely from *being available*, not from being used — a finding that is checkable is treated differently from one that is not, even by people who never check. That is also the danger: the same literature shows that citations raise trust whether or not anyone verifies them, and that people verify rarely. INSPECT must therefore be honest in content and modest in presentation, because it will be believed on sight.

---

### On UNRESOLVED

Standing doctrine holds that an evidence failure does not surface, and that it cannot become visible indirectly through another path. This document treats that as fixed and adds one design implication, which is question **F**.

The doctrine has a structural consequence that must be handled: **no visible element may vary as a function of the number of unresolved findings.** If three findings resolve and two fail, the surface must be indistinguishable from a run where exactly three findings existed. That means no "3 of 5", no gaps in the numeral sequence, no empty slots, no altered spacing, no differing block heights, and no residual identifiers in copied output or the downloadable record. Numerals must be assigned after resolution, not before, or the sequence itself leaks the failure. This is a MEASURABLE-NOW assertion: render a run with induced evidence failures and diff the DOM and the exported record against a run with the same resolved findings and none failed; assert equality.

---

## 5. Action placement doctrine

This section answers question **D**.

### Timing

The derived question renders only after the person has passed the findings. Not before, not alongside, and not in a sticky element that follows them down the page. The reason is attention residue: an unfinished action held in view occupies attention that the reading task needs (Leroy 2009). A persistent "ask your AI" control turns every finding into a decision about whether to leave.

There is one exception worth naming as a founder decision rather than a rule. A person who has scrolled past the last finding and stopped has finished reading, and surfacing the action at that point is not premature. Whether to detect that state is a judgment call, and the risk is that scroll-triggered surfacing is the exact mechanic of engagement design. This document recommends against it on register grounds and records it as a genuine choice in §12.

### Location

Actions live at the end of the stratum they belong to. Two action groups exist, and they have different jobs:

**Record actions** (copy, receipt, share) belong at the end of READ, after the last interpretive block (R9), collapsed to one visible control plus a disclosure (R10). These are utilities. They should look like utilities.

**The carry action** (the derived question and its handoff) belongs at the end of the result surface, after the person has met every finding. This is the only action with primary emphasis (R1, R8).

### Number

One primary. One or two subordinate. Everything else behind a disclosure.

The subordinate slot exists for a real reason: the person who has already asked their AI needs "paste what came back", and the person who is not going to ask anything needs a way to keep the record. Those are two different people, and giving one of them a primary and the other a visible-but-quiet control is correct. Giving both a primary is not.

### Primary and secondary hierarchy

Primary carries the ember fill. Secondary carries an outline or ghost treatment at the same size and the same target dimensions. Tertiary lives behind a disclosure with a scent-carrying label. The distinction is fill, not size — shrinking secondary actions creates a target-size problem and reads as a dark pattern (the deliberately hard-to-find decline).

### Alternative disclosure

One disclosure per action group. The label names the contents. A `<details>`-style disclosure with find-in-page discoverability is preferable to a custom widget, because it survives text search, keyboard interaction and assistive technology without bespoke work.

### Feedback

Every action confirms in place, adjacent to the control, in body register, without motion (R26) and without accent. "Copied" next to the copy control. Not a toast, not a banner, not a color change on the control itself. The person who copies a question and receives no confirmation copies it again, and the person who receives a large celebratory confirmation has been rewarded for an act that deserves no reward.

### Mobile behavior

At 390px, actions stack vertically at full width, in the same order as desktop, with the primary first. No horizontal scroll (R23). No fixed bottom bar containing the primary action: a fixed bar is the single most common cause of focus obscuring (SC 2.4.11) and it also converts the carry action into a persistent solicitation, which is the residue problem above. If a fixed element is used for any reason, it must not cover a focused element and must not contain the primary carry action.

### Evidence proximity

An action derived from a specific finding renders inside that finding's bounded region, not in a global action bar. An action derived from the run as a whole renders at the end. The live product's derived question is run-level, which is why it correctly sits at the end. If per-finding actions are ever introduced, they belong with their finding, and the claim→proof proximity instrument should be extended to cover action→finding distance as well.

### On the action families

The brief names five candidate families: ask for the missing part, check source language, compare treatment, get the next prompt, and scoped re-inspection where a real producer exists. This document adds no families and takes no position on which should exist. It adds one constraint that applies to all of them: **the number of visible action families never exceeds one plus one disclosure, regardless of how many are eligible.** Eligibility is a backend fact. Visibility is a design decision, and it is the decision that determines whether the person acts or stalls.

---

## 6. Salience map

Ranked strongest to weakest within the locked system. Salience here means the summed effect of size, weight, contrast, color, position and enclosure, not any single channel.

| Rank | Element | Treatment | Why here |
|---|---|---|---|
| 1 | **Result orientation (GLANCE heading)** | Largest type on the surface. Ink, not ember. No enclosure. | Primacy plus size. It is first and largest because it is the only thing guaranteed to be read. It is not ember because the frame is not the finding. |
| 2 | **The person's own answer, with marks** | Full-width body text at reading size. The marks are the only accented elements inside it. | The answer is the object of inspection and the source of recognition. Its salience comes from area and familiarity rather than from emphasis. |
| 3 | **Evidence marks inside the answer** | Low-alpha ember tint plus a small ember numeral. | These are the highest-information elements on the surface. They are the reason ember exists in the system, and they earn singleton status because everything else gives it up. |
| 4 | **The finding statement (explanation)** | Body register, inside a bounded region shared with its quote and label. | This is what the person must actually understand. It ranks below the mark because the mark's job is to route attention here, and above the label because the label is a category and the explanation is the content. |
| 5 | **The quoted anchor** | Body register, visually bound to its explanation, carrying the ember numeral only. | Proof. Ranked adjacent to the explanation by design; a gap between 4 and 5 is the split-attention failure. |
| 6 | **The primary next action** | The one ember fill on the surface. | It ranks below evidence because a person who acts without understanding has been steered. It ranks above everything below because a person who understands and cannot act has been abandoned. |
| 7 | **Behavior-class label** | Mono, small, constrained to ≤ the explanation's size and contrast (R15). Ember permitted as one of the five roles. | Useful for the record and for returning readers. Not the cold reader's first need, and prominent categorization reads as verdict. |
| 8 | **Scope / boundary statement** | Body register, no accent, no glyph, no alert box (R16). | It must be read, so it cannot look skippable; it must not alarm, so it cannot look like a warning. Body register at the stratum boundary is the only treatment that satisfies both. |
| 9 | **Secondary actions** | Ghost or outline, same size and target as primary, no fill. | Available without competing. |
| 10 | **Provenance and record data** | Small, mono, low contrast within accessible limits, after the last interpretive block or at INSPECT (R19). | Real, checkable, and credibility-inflating out of proportion to its informational value. Rank accordingly. |
| 11 | **Metadata (timestamps, model identity, run identifiers)** | Mono, smallest type on the surface, ink at reduced but conformant contrast. | Necessary for the record. Irrelevant to comprehension. |
| 12 | **Navigation and cross-surface links** | Text links, no accent, no arrows competing with the primary action. | Weakest deliberately. A person who leaves the result surface before finishing it has lost the thread. |

### Two allocation notes

The founder's stated law reserves ember for the signal itself, a keyword within a heading where ruled, a consequential gap figure, a status pill where appropriate, and the primary action. On the result surface, ranks 3, 6 and 7 consume that budget entirely. Ranks 1 and 8 must not draw on it, and the finding count must not (R17).

Answering question **I** directly: the largest available salience gain is not adding emphasis anywhere. It is **removing ember from the 20-odd decorative and structural uses currently on the surface**, which restores singleton status to the marks at no design cost. Emphasis is zero-sum here in a way it is not in most interfaces, because the marks are the product.

---

## 7. Mobile doctrine (390px)

Every rule below is a **check to run**, not an observation. The 2026-08-13 session could not force a 390px viewport (§0.8), so nothing in this section claims to describe the shipped mobile composition.

| # | Rule at 390 CSS px | Class | Check |
|---|---|---|---|
| M1 | No horizontal scroll at any scroll position | MEASURABLE-NOW | `document.documentElement.scrollWidth ≤ clientWidth` |
| M2 | A mark and the first line of its own explanation are co-visible, or the mark expands in place (R24) | MEASURABLE-NOW | Per-mark distance vs. effective viewport height; or assert in-place expansion keeps the mark rect visible |
| M3 | GLANCE occupies at most one viewport height before the person's answer begins | MEASURABLE-NOW | Distance from result top to first character of the answer < viewport height |
| M4 | Every control has a target of at least 24×24 CSS px; inline marks may be smaller only under the R13 condition | MEASURABLE-NOW | Bounding-rect audit of all controls (SC 2.5.8). Apple's 44pt and Material's 48dp are conventions, not conformance floors; state which one Imbas adopts as a founder choice |
| M5 | No fixed or sticky element covers a focused control | MEASURABLE-NOW | Tab through all controls; assert focused rect is fully visible and unintersected (SC 2.4.11) |
| M6 | No fixed bottom bar contains the primary carry action | MEASURABLE-NOW | Assert the primary action is not inside a `position: fixed` ancestor |
| M7 | Action groups stack vertically, full width, primary first, order identical to desktop | MEASURABLE-NOW | Order and computed width assertion; SC 3.2.3 consistency |
| M8 | Body measure stays within roughly 45–75 characters per line | MEASURABLE-NOW for the count, JUDGMENT for the bound | Character-per-line measurement. The range is a defensible band, not an optimum: Dyson & Haselgrove found effects across 55–100 cpl with no single winner |
| M9 | Content survives the SC 1.4.12 text-spacing override with no clipping and no loss of function | MEASURABLE-NOW | Apply the override set; diff for clipping |
| M10 | Marks remain visually distinguishable when a line wraps mid-mark | MEASURABLE-NOW | Render a mark spanning ≥ 3 wrapped lines; assert continuous tint on each line fragment |
| M11 | The findings list is reachable without scrolling past the entire answer | MEASURABLE-NOW *(if implemented)* | This requires a mechanism that does not currently exist and would need to satisfy R11. Whether to add one is a founder decision (§12) |
| M12 | No result content is hidden behind a horizontal carousel, swipe gesture or tab strip | MEASURABLE-NOW | Assert no scroll-snap or transform-based paging in the result container |
| M13 | Total result height stays proportionate to the person's answer length rather than growing with fixed scaffolding | MEASURABLE-WITH-PROBE | Structural ratio is measurable; whether the resulting scroll depth defeats comprehension is not. Probe with Gate 2 Task 2 run on a phone |
| M14 | The person can reach the derived question from the top of the result within a stated number of screens | JUDGMENT | The count is measurable; the acceptable count is a founder choice. Research does not supply a threshold |

**On the desktop composition as a mobile predictor.** The desktop result runs about 4,350px on a 900px viewport, roughly 4.8 screens. At 390px wide, the same content reflows taller. If the four restatements of each finding (§0.4) survive to mobile, the scroll depth compounds: R6 is therefore a mobile rule as much as a desktop one, and it is probably the single highest-leverage mobile change available.

**On the screen-reading penalty.** Screen reading shows a small comprehension deficit relative to print, around *g* = −0.21, and the deficit grows under time pressure and for informational text (Delgado et al. 2018). Imbas's content is informational and read on screen, which is the exact condition. The design response is *not* to shorten the evidence. It is to remove everything that is not evidence, and to add no time pressure of any kind — no countdowns, no "your inspection expires", no session timers, no auto-advancing states.

---

## 8. Trust and uncertainty doctrine

This section answers questions **G** and **H**.

### The governing asymmetry

Imbas will receive trust it has not earned. Three separate findings establish this: invented trust seals raise trust (Kirlappos et al. 2012), nonprobative detail raises belief (Newman et al. 2012), and explanations raise acceptance regardless of whether they are correct (Bansal et al. 2021). Imbas ships all three inputs — a record aesthetic, hashes and identifiers, and an explanatory prose read. The design objective is therefore **not to build trust**. It is to keep trust proportionate to evidence, which means deliberately declining free credibility.

### G — Ranking the trust apparatus

| Element | Placement | Reason |
|---|---|---|
| Scope / boundary language | **VISIBLE IMMEDIATELY** | It is the only counterweight to the implied truth effect, and it is the one thing a person must have to interpret everything else correctly |
| Inspection affordances (the marks themselves, and the fact they can be opened) | **VISIBLE IMMEDIATELY** | Availability of verification is what makes reliance appropriate; it must be seen, not discovered |
| Source links, where a real source exists | **VISIBLE SECONDARILY** | High informational value and high checkability, but they compete with the finding for attention if promoted |
| Methodology link | **VISIBLE SECONDARILY** | One text link, scent-carrying label, no accent |
| Timestamps and run identity | **INSPECT-LEVEL** | Necessary for the record. Zero contribution to understanding the finding |
| Record IDs | **INSPECT-LEVEL** | Same |
| Hashes and custody data | **INSPECT-LEVEL** | Highest credibility inflation per unit of information on the entire surface. This is the element most likely to be mistaken for proof of correctness |

The organizing principle: **rank by contribution to the person's ability to check, not by contribution to the appearance of rigor.** A hash contributes nothing to checking whether the finding is right. A source link contributes a great deal.

### H — Uncertainty and the non-verdict posture

Four commitments.

**Uncertainty is stated in the finding, not appended to the surface.** A global disclaimer at the bottom is read as legal furniture. A scope limit inside the finding's bounded region is read as part of the finding. The live "INSPECTION NOTE" does this correctly in content; R16 constrains its repetition.

**Verbal and numeric together, where a quantity exists.** Pairing a verbal expression with a numeric one improves interpretation accuracy and reduces regression toward 50% relative to either alone (Budescu et al. 2014). Where Imbas has a real quantity — a gap figure, a run count, a rate across models — pairing it with a short verbal characterization is supported. Where Imbas has no quantity, this rule does not license inventing one.

**No confidence scores, no severity levels, no percentages on individual findings.** Imbas does not have the calibration data to support them, and an uncalibrated confidence number is a verdict wearing a lab coat. This is a hard constraint, not a preference.

**The non-verdict posture must be structural, not verbal.** Saying "this is not a verdict" while rendering a large count in accent above a categorized list produces a verdict that also contains a denial. The structural commitments that actually carry it: the person's own answer is the largest object on screen (rank 2); the count carries no accent (R17); class labels stay subordinate (R15); the zero-finding state looks structurally identical to the populated one (R18); and nothing animates (R26).

### On the "Reader agent" attribution

Attributing the read to an agent triggers a machine heuristic — the inference that a machine judgment is objective and free of bias (Sundar 2008, MAIN model). That inference is wrong here in a specific way: the READ prose is generated, and generated explanations raise acceptance regardless of correctness. The attribution is honest and should stay. The design implication is that the prose it attributes must carry its own scope limit inside its own bounded region, and must not be the first interpretive content the person meets.

---

## 9. Anti-patterns

Each entry gives the pattern, the mechanism by which it harms, the specific form it would take in Imbas, and the rule that prevents it.

**Visual prosecution.** Warning colors, alert iconography, red-on-dark, exclamation glyphs, or a mark treatment heavy enough to read as a strikethrough. Mechanism: freedom-threatening presentation produces reactance, which reduces persuasion and increases source derogation (Rains 2013). In Imbas this would arrive as a severity taxonomy or a second accent for "worse" findings. Prevented by R2 (five accent roles, no severity role) and R3 (tint, never fill).

**Gotcha salience.** A large accented count, a "found N problems" frame, an animated reveal, or a finding count that grows visibly. Mechanism: the count becomes the message and the evidence becomes decoration. Prevented by R17 and R26.

**Certification aesthetics.** Seals, badges, checkmarks, "verified" language, a record that looks like a certificate, or a hash presented as a credential. Mechanism: people read the form of assurance rather than its content (Kirlappos et al. 2012), and nonprobative detail inflates belief (Newman et al. 2012). Prevented by R19, R9 and R18.

**Dashboard creep.** Panels, tiles, counters, sparklines, a metrics strip, or any element whose function is to display a number about the person's own usage. Mechanism: dashboard grammar signals monitoring rather than reading, and it fragments a single argument into disconnected widgets, defeating common-region grouping. Prevented by R2, R10 and the salience map's rank ordering.

**Compliance-software creep.** Numbered clauses, audit language, required acknowledgements, mandatory scroll-to-continue, checkbox confirmations, dense small-print blocks. Mechanism: compliance grammar produces skipping, which specifically destroys the scope statement that Imbas most needs read. Prevented by R16.

**Generic AI-wrapper treatment.** Chat bubbles, typing indicators, streaming text after completion, sparkle icons, a conversational assistant persona, or a "regenerate" control. Mechanism: this framing tells the person Imbas is another generator, which collapses the boundary the whole product rests on. Prevented by R26 and R21.

**Engagement optimization.** Scroll-triggered reveals, curiosity-gap labels, "you have 2 unread findings", streaks, notification counts, a feed, session continuation prompts, or any surfacing keyed to inferred interest. Mechanism: engagement mechanics work by manufacturing an unresolved state, and an unresolved state is exactly what a person reading about their own possible error does not need. Prevented by R22, R26 and the standing instruction in §5 against scroll-triggered action surfacing.

**Excessive equal-priority actions.** Three or more controls at identical weight in one group. Mechanism: parity forces serial comparison and communicates that Imbas has no recommendation. Prevented by R8 and R10. This is live today (§0.7).

**Provenance dominating result comprehension.** Export controls, receipts, hashes or record IDs positioned before or above the finding content. Mechanism: the person receives a credibility cue in place of an argument, and the cue is stronger than the argument. Prevented by R9 and R19. This is partially live today (§0.1, block 2).

---

## Imbas questions A–P

Cross-references where the answer is given in full elsewhere; complete answers here where it is not.

**A. The first 2–5 seconds.** §1 (attention movement one), R14, and §10 (Z1.4). The interval is a founder choice; the 35-word ceiling is what that choice implies at measured reading rates.

**B. Whether GLANCE → READ → INSPECT belongs.** §4, opening. It belongs, on the verification-cost mechanism. The test that keeps it honest: each stratum must make checking cheaper, not merely add detail.

**C. Finding presentation and label prominence.** R15 and salience rank 7. Labels stay subordinate to the explanation and absent from GLANCE. They are not removed and not renamed.

**D. Actionability structure.** §5 in full.

**E. Differentiating ABSENT from QUOTED without teaching internal terms.** The distinction the person needs is not the taxonomy; it is *where to look*. A QUOTED finding has a place in the answer, so it renders with a mark in the answer and a numeral. An ABSENT finding has no place in the answer, so it renders in the findings list with no numeral, no mark, no caret and no position, inside the same bounded-region template. The differentiator is **the presence or absence of a positional anchor**, which the person reads directly without learning a word. No badge, no icon, no color difference, and no label teaching. One caution: this document did not observe an ABSENT rendering (§0.8), and whether the absence of an anchor reads as "nowhere in particular" rather than "we could not find it" is an open empirical question — Gate 2 Task 3 tests it.

**F. Unsurfaced evidence failures.** §4, closing. The doctrine is fixed; the design implication is that no visible or exported element may vary with the number of unresolved findings, including numeral sequences, spacing and block heights.

**G. Trust without bureaucracy.** §8, ranking table.

**H. Uncertainty and non-verdict posture.** §8, four commitments.

**I. Salience budget allocation.** §6, including the finding that the largest available gain is subtraction rather than addition.

**J. Mobile.** §7, all fourteen checks, none yet run.

**K. Error and empty states.** Below.

**L. Cold user and Gate 2 tasks.** §11.

**M. Returning and power users.** Below.

**N. Evidence distance and comparison burden.** R5, R24, and salience ranks 3–5. The measured live figures are in §0.2. The comparison burden the founder names — reconstructing which evidence belongs to which finding — is currently created by three separate things: numerals that do not follow reading order (R4), an unnumbered restatement list (§0.4), and 762px of distance at the worst mark (R5).

**O. Visual density.** Below.

**P. Psychological failure modes.** Below.

### K — Error and empty states

Six states, each with a structure and a next action. All six use the same masthead pattern and the same type scale as a successful result, and none uses a color outside the standing system.

| State | What the person needs first | Next action | Notes |
|---|---|---|---|
| **Inspection not found** | That the link is the problem, not their answer | Start a new inspection | Never phrase as a failure of the person. Do not offer a search box — there is nothing to search |
| **Incomplete link** | That the record exists but the link is truncated | Start a new inspection, plus a way to re-copy a correct link if one is derivable | Distinguish from "not found" — these are different situations and merging them produces a wrong mental model |
| **Service unavailable** | That Imbas is down, their answer is intact, and nothing was lost | Retry, with their pasted text preserved | Losing the pasted answer here is the worst single interaction failure available. Preservation is a hard requirement |
| **Network failure** | That the connection failed, distinct from Imbas failing | Retry, text preserved | Attribution matters: a person who thinks Imbas is broken does not come back |
| **Empty / no findings** | That the inspection surfaced nothing, **not** that the answer is clear | Same carry action as a populated result | Governed by R18. Highest-consequence state in the product |
| **No eligible actions** | That there is nothing to carry from this particular run | Record actions only, no substitute filler action | Never invent an action to fill the slot. An empty action slot is honest; a manufactured one violates the give-nothing-away standard |

Two cross-cutting rules. First, no error state may use accent color or an alert glyph — errors are not signals, and the accent means signal. Second, every error state names one action, and the action is the same shape as the success path's action, which lets the person reuse the pattern instead of parsing a new one.

### M — Returning and power users

The returning reader has learned the taxonomy, knows what a mark is, and wants to get to the findings. Three implications, none of which may cost the cold reader anything.

The interface should not add a mode, a preference, a toggle or a "compact view". Modes create the exact remembered-state burden the founder's sixth intention forbids, and they double the surface every rule must be checked against.

The affordance the returning reader actually needs is a **stable, learnable structure** — identical order, identical grouping, identical position of the findings list on every result (R7). A power user's speed comes from pattern reuse, not from a denser layout.

Where a genuine returning-user need exists that the cold reader does not share — comparing this run to a prior run of the same case, for instance — it belongs at INSPECT, behind a scent-carrying label, and it must not add an element above the first finding (R19).

### O — Visual density

**There is no defensible universal density threshold.** Element counts, items-per-screen rules and whitespace ratios have no empirical basis as general laws. What predicts search difficulty is feature congestion: local variability in color, contrast, orientation and scale (Rosenholtz et al. 2007). Two screens with the same element count differ enormously in difficulty depending on how many distinct visual features they contain.

The operational consequence for Imbas is that density should be governed by **feature variety, not element count**. Concretely, the checkable quantities are: number of distinct type sizes on the surface, number of distinct accent values, number of distinct border treatments, number of distinct enclosure styles. Twenty distinct ember values (§0.5) is a congestion problem that no element-count rule would have caught.

Any specific ceiling on those counts is a founder choice. Research supports the *variable*, not the number.

### P — Psychological failure modes

| Failure | Mechanism | Likely UI cause in Imbas | Prevention |
|---|---|---|---|
| **Accusatory** | Perceived threat to autonomy triggers reactance and source derogation (Rains 2013) | Class label leading at high weight; heavy mark treatment | R15, R3 |
| **Prosecutorial** | Accumulated emphasis reads as a case being built | 35 ember-bearing elements; four restatements of each finding | R2, R6 |
| **Partisan-looking** | Content selection appears motivated when scope is unstated | Findings presented without a visible statement of what was and was not examined | R16, §8 |
| **Confirmation-bias amplifying** | Marked subset confirms a prior; unmarked remainder is read as endorsed (Pennycook et al. 2020) | Any presentation implying the unmarked text passed | R16, R18, and the scope statement at rank 8 |
| **Verdict-like** | Categorization plus a count plus a summary reads as a ruling | Count in accent; label prominent; summary above evidence | R15, R17, R9 |
| **Overconfident** | Explanations and provenance raise acceptance independent of correctness (Bansal et al. 2021; Newman et al. 2012) | Generated READ prose without an in-region scope limit; hashes near findings | §8, R19 |
| **Cognitively overwhelming** | Redundant presentations impose load without adding learning | Four restatements; 4.8 screens of result | R6 |
| **Choice-paralyzing** | Undifferentiated alternatives force serial comparison | Four parity actions | R8, R10 |
| **Bureaucratic** | Compliance grammar produces skipping | Repeated boundary statements; audit-styled blocks | R16 |
| **Compliance-software-like** | Required acknowledgements and dense small print | Any mandatory confirmation before viewing results | R16, §5 |
| **Dashboard-like** | Widget grammar fragments an argument | Panels, counters, usage metrics | R2, R10, §6 |
| **Generic-AI-wrapper-like** | Chat and generation grammar collapses the producer boundary | Streaming, regenerate controls, assistant persona | R21, R26 |
| **Visually sensational** | Motion and scale are preattentive; used decoratively they manufacture drama | Reveal animation; counting numbers; oversized figures | R17, R26 |
| **Engagement-optimized** | Unresolved states drive return; they also drive anxiety | Scroll-triggered surfacing; unread counts; streaks | R22, R26, §5 |

---

## 10. Z1.4 — decision memo on the claim headline

**Standalone memo. This document does not rule Z1.4.**

### The decision

**Option A.** A prose claim headline sits above the arithmetic line. The first thing the person reads is a sentence asserting what the inspection found about their answer. The count follows it.

**Option B.** The count plus structural composition alone. The first thing the person reads is a quantity and an orienting line, and the substance arrives when they reach the evidence. This is what ships today: "3 candidate items surfaced" at 37.6px, followed by one supporting line.

### The case FOR Option A

**People reason on gist, not on verbatim detail.** Fuzzy-trace theory holds that the representation people retain and use for decisions is the gist, not the exact content. A prose claim supplies gist directly. A count supplies a number the person must convert into gist themselves, and the conversion is exactly what a non-expert cannot do here.

**A bare number is not evaluable.** Evaluability research (Hsee 1996) shows that attributes people cannot map to a reference class carry little weight in judgment when presented alone. "3" has no reference class in this product. The person does not know whether three is normal, high, or trivially low, and Imbas cannot tell them without a population baseline it does not have at the individual-run level. Option A sidesteps the problem by not asking the person to evaluate a number at all.

**Verbal and numeric together beat either alone.** Pairing a verbal characterization with a numeric one improves interpretation accuracy and reduces regression toward an uninformative midpoint (Budescu et al. 2014). Option A is a verbal-plus-numeric presentation; Option B is numeric-only. This is the single most direct empirical support available, though it comes from probability communication rather than from finding counts, which limits how far it transfers.

**The 2–5 second budget is 7–35 words.** At 200–300 wpm (Rayner et al. 2016), a headline plus one short line is roughly the whole orientation budget. Spending it on a claim spends it on content. Spending it on a count spends it on an inventory of the instrument's output.

**Option B is currently self-referential.** The live GLANCE says three candidate items surfaced and that each is something the Reader could quote. Both sentences describe what the instrument produced. Neither describes the person's situation. That is a failure of Option B *as implemented*, not of Option B in principle, and §13 records it separately.

### The case AGAINST Option A

**Headlines bias reasoning about the text beneath them even when accurate.** Ecker, Lewandowsky, Chang and Pillai (2014) found that subtly slanted but factually accurate headlines biased readers' processing of the article that followed, and that the effect persisted. This is the strongest single finding against Option A. A claim headline does not merely orient; it frames every finding the person subsequently reads. In a product whose register law is *signal, not verdict*, a headline is the highest-risk sentence on the surface.

**A claim headline is structurally a verdict.** The register law says Imbas opens the door and the reader decides. A sentence asserting what the answer did, placed above the evidence, in the largest type on the page, is Imbas deciding first and showing evidence second. Whether that is acceptable is a positioning question, not an empirical one.

**Generation risk compounds.** If the headline is generated per run, the highest-salience sentence in the product becomes the least controllable one. Every register failure mode in §9 becomes reachable by one bad generation. A count cannot be prosecutorial; a sentence can.

**Explanations raise acceptance regardless of correctness.** Bansal et al. (2021) found explanations increased acceptance of AI outputs whether or not those outputs were right. A claim headline is a maximally compressed explanation in the maximally salient position. It will be believed more than it deserves, and Imbas cannot calibrate it.

**The implied truth effect gets worse, not better.** A headline asserting what was found makes the found/not-found boundary sharper and more memorable, which strengthens the inference that unmarked content passed (Pennycook et al. 2020). A count is vaguer and therefore, on this one axis, safer.

### Empirical principles that bear on it

| Principle | What it establishes | What it does not establish |
|---|---|---|
| Gist processing (fuzzy-trace) | People retain and reason with gist | That an Imbas-authored gist is better than a person's own |
| Evaluability (Hsee 1996) | Isolated numbers carry little judgment weight | That a headline is the right remedy rather than a reference class |
| Attribute framing (Levin et al. 1998) | Framing changes evaluation of identical information | **Nothing that favors B.** A count is also a frame |
| Headline slant (Ecker et al. 2014) | Accurate headlines can still bias downstream reasoning | Whether a non-slanted headline is achievable at this compression |
| Dual verbal + numeric (Budescu et al. 2014) | Pairing improves interpretation | That the finding transfers from probabilities to finding counts |
| Serial position | First and largest elements dominate recall | Which content deserves that position |
| Explanation acceptance (Bansal et al. 2021) | Compressed explanations raise acceptance independent of accuracy | The size of the effect at headline length |

**The most important line in this table.** Option B is not the neutral option. Attribute framing applies to quantities as directly as to sentences. Choosing to lead with "3 candidate items surfaced" frames the result as *an inventory produced by an instrument*, and that frame has consequences: it makes the instrument the subject, it invites the person to evaluate a number they cannot evaluate, and it says nothing about their answer. **Any argument for Option B that rests on it being neutral is wrong.** The real argument for Option B is that its frame is *lower-variance*, not that it has no frame.

### Relationship to `blocks_before`

`blocks_before` measures how many blocks the person passes before reaching evidence. Z1.4 does not change it. Both options occupy the same GLANCE block, and evidence begins in the same place either way. The live composition reaches the first mark 375px after the top of the result.

There is one indirect relationship worth naming. If Option A is chosen, the pressure to justify the headline will push toward adding a supporting element — a highlighted excerpt, a preview, an example — into GLANCE. That would raise `blocks_before` and is forbidden by R14. If Option A is chosen, R14 becomes the binding constraint that keeps it from expanding.

### Relationship to GLANCE

GLANCE's cognitive objective is a correct minimal frame. Both options can satisfy it and both can fail it.

Option A satisfies it if the claim is about *the person's answer* and fails it if the claim is about the world. "This answer describes the remedy without mentioning the deadline" is within scope. "Montana has a one-year filing deadline" is not — that is Imbas producing substantive content, which the product does not do. The line between those two sentences is thin, and holding it at headline compression, per run, generated, is the hard part.

Option B satisfies it if the count is accompanied by an orienting line that tells the person what the count is *about them*, and fails it if both sentences describe the instrument. As implemented, it currently fails on this axis.

### Prosecution and framing risk

Option A carries higher framing risk and higher variance. The risk is not that a claim headline is inherently accusatory; it is that the highest-salience sentence becomes generated, per-run, and unbounded. The mitigations that would be required — a fixed grammatical template, a banned-verb list enforced at generation, a hard word ceiling, mandatory subject being the answer rather than the model, no motive verbs, no severity adjectives — are all achievable, and all of them are copy-lane governance rather than design.

Option B carries lower framing risk and a different failure: the person forms no frame at all, scrolls into the evidence without knowing what they are looking at, and constructs their own frame from the first finding they read. That failure is quieter and therefore easier to ship without noticing.

There is a third framing risk specific to Option A that deserves naming on its own. A headline that reads well is a headline that is quotable, and a quotable headline about someone's AI answer is a screenshot. Option A materially increases the chance that Imbas output circulates detached from its evidence and its scope statement. Option B's count circulates too, but a count without context is obviously incomplete, whereas a claim without context looks complete.

### What evidence cannot settle

Research cannot settle any of the following, and this memo does not pretend otherwise.

Whether Imbas *should* assert a claim about a person's answer before showing evidence. That is a positioning decision about what kind of instrument Imbas is, and no experiment resolves it.

Whether a non-leading claim headline is achievable at 10–15 words, per run, generated. The give-nothing-away standard is already operationalized for derived questions; whether it transfers to headlines is an open engineering and editorial question.

The size of the Ecker headline effect in this specific context. The published work concerns news headlines and articles about public matters. Imbas headlines concern the reader's own document, which they can immediately check. The effect might be much smaller, or reversed, and nobody has tested it.

Whether the count is more or less likely to be misread than a claim. Both misreadings exist. Their relative frequency is an empirical question that Gate 2 Task 1 can answer for Imbas specifically and that no published study answers.

### The precise founder judgment required

Four decisions, in dependency order.

**Decision 1 — the positioning question, which is prior to everything else.** Does Imbas state a conclusion about the person's answer before showing evidence, or does it show evidence and let the person conclude? Research does not answer this. It is the same decision as *signal, not verdict*, applied to the most salient sentence in the product. If the answer is no, Z1.4 is settled as Option B and decisions 2 through 4 do not arise.

**Decision 2 — if Option A, whether the headline is fixed-template or generated.** A fixed template with a generated slot is a materially different risk profile from a free-form generated sentence. This is the decision that determines whether §9's register failures are reachable.

**Decision 3 — if Option A, whether the count survives.** Dual verbal-plus-numeric presentation has the empirical support (Budescu et al. 2014); headline-only does not. A hybrid — claim headline plus the count in the supporting line — is the option the evidence most nearly supports, and it is not the same as Option A as stated in the brief.

**Decision 4 — if Option B, what the supporting line is for.** Option B's current failure is not the count; it is that both sentences describe the instrument. Fixing that is a copy-lane objective change (§13, item 2) and it does not require choosing Option A.

**One recommendation this memo will make, because it is not a ruling on Z1.4.** Whichever option is chosen, run Gate 2 Task 1 against both before shipping either. The task is cheap, it is the only source of evidence that is actually about Imbas, and the two options make different, observable predictions about what a cold reader says after four seconds.

---

## 11. Gate 2 cold-user task list

Five tasks. Each is designed to be run with a person who has never seen Imbas, in under twenty minutes total, without a moderator explaining anything. Sample sizes are a founder choice; the literature on formative usability testing supports small samples for detecting structural problems and does not support small samples for estimating rates.

**No task asks the person whether they liked it.** Every task has an observable that does not depend on self-report about design.

---

### Task 1 — Orientation (tests R14, Z1.4, GLANCE)

**Scenario.** The person is shown a completed result surface scrolled to the top. The screen is removed after four seconds.

**Prompt.** "In your own words, what just happened here?"

**Success observable.** The response names (a) that something was examined, and (b) that the thing examined was the AI answer, not the topic. A response that names a number without naming an object is a partial failure.

**If it fails.** If the person describes the topic ("something about Montana employment law"), GLANCE has failed to establish the object of inspection and the answer is not arriving fast enough. If the person describes a judgment ("it says the answer is wrong"), GLANCE is reading as a verdict and R15/R17 are being violated somewhere. If the person cannot say anything, the block is over its word budget or the type hierarchy is not resolving.

**Z1.4 use.** Run this against Option A and Option B with matched participants. The two options predict different failure profiles: Option B should produce more "I don't know what it found" responses; Option A should produce more responses that assert a conclusion the person cannot support. Whichever failure the founder is less willing to ship is the answer.

---

### Task 2 — Finding comprehension (tests R5, R6, R7, and the whole READ stratum)

**Scenario.** The person is given the full result surface and unlimited time. Run this on both desktop and a 390px phone with different participants.

**Prompt.** "Pick any one of the things it found and explain it to me as if I were the person who got this answer."

**Success observable.** The person names one specific finding, points to or quotes the part of the answer it attaches to, and states what is missing or shaped — without scrolling back and forth more than once. The scroll count is the measurement that matters and it is recorded, not asked about.

**If it fails.** Repeated scrolling between the answer and the findings list means the mark-to-explanation distance is too large (R5) or the numerals are not doing their job (R4). Explaining a finding using words from a *different* restatement than the one they are looking at means the four-restatement problem (R6) is producing confusion rather than reinforcement. Inability to point at the relevant text means the mark is not reading as a pointer.

---

### Task 3 — Positional versus non-positional findings (tests E, R4, the ABSENT rendering)

**Scenario.** The person is given a result containing at least one QUOTED finding with a mark and at least one ABSENT finding with no mark. This state was not observed in the 2026-08-13 run and may need to be constructed.

**Prompt.** "For each of these, show me where in the answer it applies. If it doesn't apply anywhere in particular, say so."

**Success observable.** The person locates the QUOTED findings in the answer and says, unprompted, that the ABSENT one is not in a particular place. They do this without using or being taught the words QUOTED or ABSENT.

**If it fails.** If the person hunts for a location for the ABSENT finding, the absence of an anchor is not reading as meaningful and needs a structural cue that is still not a badge or a label. If the person treats a QUOTED mark on adjacent text as meaning *that text is wrong* — a real risk given that mark 1 in the live run sits on correct text about lost wages while the finding concerns a missing deadline — then the mark's dual grammar is a genuine comprehension problem and belongs in the founder-judgment register.

---

### Task 4 — Register perception (tests R15, R2, R3, §9 accusatory/prosecutorial)

**Scenario.** The person is given the full result surface and unlimited time.

**Prompt.** "Describe the tone of this. If you had written this answer yourself, how would you feel reading this?"

**Success observable.** The response uses observational or neutral language — noticing, pointing out, checking, flagging, showing. Failure language is evaluative or adversarial — accusing, calling out, criticizing, catching, gotcha, or defensive reactions like "well, that's not fair."

**If it fails.** Adversarial language points first at label prominence (R15) and second at accent accumulation (R2). If the person reports feeling defensive or wanting to argue back, that is reactance (Rains 2013), and it predicts reduced persuasion for a product whose entire value is persuasion by evidence. This is the task most worth running early, because register failures are cheap to fix structurally and expensive to fix after launch.

---

### Task 5 — The boundary (tests R18, R16, the implied truth effect)

**Scenario.** The person is given a result with **zero** findings.

**Prompt.** "What does this tell you about the answer you pasted in?" Then, only after they respond: "Is there anything about that answer this didn't look at?"

**Success observable.** The first response does not claim the answer is correct, verified, accurate, fine, or clear. The second response names some limit — that it checked for certain kinds of things, that it does not verify facts, that unmarked content was not confirmed.

**If it fails.** If the first response is "it's fine" or "it's accurate", the implied truth effect is running unchecked and the empty state is producing false confidence. This is the highest-consequence failure in the product and it should block launch of the empty state until it clears. If the second response requires heavy prompting, the scope statement is present but not being read, which points at R16 — either it is repeated into invisibility or it is styled as skippable furniture.

**Run this variant too.** Give a different participant a result with findings and ask the second question only. Compare. If people understand the boundary when findings exist but not when they do not, the empty state specifically is the problem, which is diagnostic and actionable.

---

## 12. Founder-judgment register

Only decisions research genuinely cannot settle. Nothing here is a soft version of a rule.

**J1 — Whether Imbas states a conclusion before showing evidence.** Z1.4, decision 1. A positioning decision about what kind of instrument Imbas is. No experiment resolves it. Everything else in §10 depends on it.

**J2 — The orientation interval.** The founder's stated 2–5 seconds is a choice. Reading rates are measured; the interval is not derived from them. The 35-word ceiling in R14 follows arithmetically from whatever interval is chosen, so choosing 3 seconds gives roughly 10–15 words and choosing 5 gives roughly 17–25.

**J3 — Ceilings on accent-bearing elements and feature variety.** R2 and §O establish the correct *variables* — accent role validity, and counts of distinct type sizes, accent values, border treatments and enclosure styles. The specific ceilings are choices. Research supports the variable; it does not supply the number.

**J4 — Whether to detect end-of-reading and surface the carry action at that point.** §5. The cognitive argument favors it (attention residue), the register argument opposes it (scroll-triggered surfacing is engagement grammar). This document recommends against, and it is a judgment.

**J5 — Whether to add a mechanism reaching the findings list without scrolling the whole answer on mobile.** M11. It would help, and any such mechanism risks violating R11 by relocating the reader away from the marked text. Whether the trade is worth it depends on how long real pasted answers are, which is data Imbas has and this document does not.

**J6 — Which target-size convention to adopt above the 24×24 conformance floor.** Apple's 44pt and Material's 48dp are conventions, not requirements. Both exceed the floor. Choosing one is a founder decision.

**J7 — How many screens the person may traverse to reach the carry action.** M14. Measurable; no defensible research threshold.

**J8 — Whether the behavior-class label appears at READ at all, or only at INSPECT.** R15 constrains its weight. Whether a cold reader benefits from seeing "OMISSION" before reading the explanation is a real open question that Gate 2 Task 4 informs but does not settle, because the label also serves the record and returning readers.

**J9 — Whether the mark's dual grammar is acceptable.** A mark currently means both *this text is the finding* and *the finding concerns what should have been here*. Gate 2 Task 3 will show whether people conflate them. If they do, the choice is between a second visual treatment (which costs accent scarcity and risks a taxonomy) and accepting the conflation. Neither option is obviously right.

**J10 — Whether to reconcile the documented accent `#B46A5A` with the shipped `--ember: #DE6F38`.** These are different colors with different contrast behavior (§0.6). Only one can be the accent. This document does not choose; it notes that the shipped value passes AA body text and the documented one does not, which is relevant to the choice.

**J11 — Sample sizes and success thresholds for the Gate 2 tasks.** Small samples find structural problems. They do not estimate rates. What counts as passing is a founder decision about risk tolerance.

---

## 13. Copy-lane recommendations

Recorded only where research indicates the *communication objective* is wrong. No governed string is rewritten here, and no replacement wording is proposed.

**C1 — The GLANCE heading.** Current string: "3 candidate items surfaced". Current function: reports the instrument's output quantity. Problem: the sentence's subject is the instrument, and the number has no reference class the person can use (Hsee 1996 evaluability). Recommended communication objective: **the heading's subject should be the person's answer, and it should tell them what kind of thing was observed in it rather than how many outputs the Reader produced.** This is achievable within Option B and does not require choosing Option A.

**C2 — The GLANCE supporting line.** Current string: "Each one is a candidate the Reader could quote from your answer." Current function: describes the Reader's capability. Problem: the person's orientation budget is roughly 7–35 words total (Rayner et al. 2016) and this line spends a large fraction of it on how the instrument works rather than on what the person should do or expect. Recommended objective: **tell the person what is immediately below and what they will be able to do with it.**

**C3 — The block heading "SOMETHING TO CHECK" and its line "This inspection surfaced candidates. They are listed below."** Current function: navigation instruction plus a restatement of the GLANCE claim. Problem: this is the second full statement of what the GLANCE block already said, and the redundancy effect predicts a cost rather than a benefit (Chandler & Sweller 1991). Recommended objective: **if this block is retained, its heading should do a job GLANCE did not already do; if it has no such job, the block is a candidate for removal under R6 rather than a copy problem.**

**C4 — The heading "What a mark points at, and the conditions this answer was read under".** Current function: labels the findings list and the scope statement together. Problem: one heading covering two unrelated jobs forces the reader to hold both while scanning for either, and it makes the scope statement look like a subheading of the findings rather than a limit on them. Recommended objective: **separate the two jobs. The findings list needs a heading that names findings; the scope statement needs to sit at the stratum boundary in its own right (R16).**

**C5 — The block "Why this inspection matters" (WHAT HAPPENED / WHY THIS MATTERS / WHAT YOU CAN DO NEXT).** Current function: a fourth compressed restatement of the findings plus a forward pointer to the action. Problem: this is the third and fourth restatement of content already stated twice (§0.4). Recommended objective: **the only part of this block doing unique work is the forward pointer to the action. If the block is retained, its objective should be the handoff, not a summary.**

**C6 — The word "candidate", used across C1, C2 and C3.** Current function: signals provisionality. Problem: it appears at least three times in the first two blocks, and a hedge repeated at high salience does not calibrate uncertainty — it either becomes invisible or it undermines the finding the person is being asked to take seriously. The literature supports stating uncertainty *inside the finding* rather than as a repeated modifier (§8). Recommended objective: **carry provisionality in the scope statement and in each finding's own limit, rather than as a repeated adjective in the highest-salience positions.** This is not an argument for removing the hedge; it is an argument for locating it where it will be read as content rather than as a tic.

---

## 14. Sources

Evidence type is given for each. **Citation confidence** is flagged where this session could not independently verify the bibliographic record; those entries should be verified before any of them is quoted publicly.

### Peer-reviewed cognitive psychology and HCI

1. Schroeder, N. L., & Cenkci, A. T. (2018). Spatial contiguity and spatial split-attention effects in multimedia learning environments: A meta-analysis. *Educational Psychology Review*, 30, 679–701. https://doi.org/10.1007/s10648-018-9435-9 — Meta-analysis. The load-bearing source for evidence proximity (R5, R11, R24).
2. Chandler, P., & Sweller, J. (1991). Cognitive load theory and the format of instruction. *Cognition and Instruction*, 8(4), 293–332. https://doi.org/10.1207/s1532690xci0804_2 — Experimental. Split-attention and redundancy effects (R6).
3. Fisher, D. L., & Tan, K. C. (1989). Visual displays: The highlighting paradox. *Human Factors*, 31(1), 17–30. — Experimental. The empirical spine of the scarce-accent law (R1, R2). *Citation confidence: journal and year verified from record; direct open link not located.*
4. Cowan, N. (2001). The magical number 4 in short-term memory: A reconsideration of mental storage capacity. *Behavioral and Brain Sciences*, 24(1), 87–114. https://doi.org/10.1017/S0140525X01003922 — Review and synthesis. Working-memory capacity (R4).
5. Wolfe, J. M., & Horowitz, T. S. (2017). Five factors that guide attention in visual search. *Nature Human Behaviour*, 1, 0058. https://doi.org/10.1038/s41562-017-0058 — Review. Preattentive guiding attributes (R1, R17, R26).
6. Rosenholtz, R., Li, Y., & Nakano, L. (2007). Measuring visual clutter. *Journal of Vision*, 7(2):17. https://doi.org/10.1167/7.2.17 — Modeling and experiment. The basis for rejecting universal density thresholds (§O).
7. Palmer, S. E. (1992). Common region: A new principle of perceptual grouping. *Cognitive Psychology*, 24(3), 436–447. https://doi.org/10.1016/0010-0285(92)90014-S — Experimental. Bounded-region grouping for findings (§4 READ, §6).
8. Rayner, K., Schotter, E. R., Masson, M. E. J., Potter, M. C., & Treiman, R. (2016). So much to read, so little time: How do we read, and can speed reading help? *Psychological Science in the Public Interest*, 17(1), 4–34. https://doi.org/10.1177/1529100615623267 — Review. Reading-rate basis for the R14 word ceiling.
9. Delgado, P., Vargas, C., Ackerman, R., & Salmerón, L. (2018). Don't throw away your printed books: A meta-analysis on the effects of reading media on reading comprehension. *Educational Research Review*, 25, 23–38. https://doi.org/10.1016/j.edurev.2018.09.003 — Meta-analysis (*g* ≈ −0.21). Screen-reading penalty and the no-time-pressure rule (§7).
10. Dyson, M. C., & Haselgrove, M. (2001). The influence of reading speed and line length on the effectiveness of reading from screen. *International Journal of Human-Computer Studies*, 54(4), 585–612. https://doi.org/10.1006/ijhc.2001.0458 — Experimental. Line-length band in M8, and the basis for refusing a single optimum.
11. Leroy, S. (2009). Why is it so hard to do my work? The challenge of attention residue when switching between work tasks. *Organizational Behavior and Human Decision Processes*, 109(2), 168–181. https://doi.org/10.1016/j.obhdp.2009.04.002 — Experimental. Action timing (§5).
12. Alter, A. L., & Oppenheimer, D. M. (2009). Uniting the tribes of fluency to form a metacognitive nation. *Personality and Social Psychology Review*, 13(3), 219–235. https://doi.org/10.1177/1088868309341564 — Review. Processing fluency and judged truth (§2).
13. Pirolli, P., & Card, S. (1999). Information foraging. *Psychological Review*, 106(4), 643–675. https://doi.org/10.1037/0033-295X.106.4.643 — Theory with empirical support. Information scent (§4 INSPECT, R10).
14. Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1), 11–26. — Experimental. Choice reaction time (R8).
15. Hyman, R. (1953). Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3), 188–196. — Experimental. Companion to Hick.
16. Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47(6), 381–391. https://doi.org/10.1037/h0055392 — Experimental. Target size and distance (M4, §5).
17. Scheibehenne, B., Greifeneder, R., & Todd, P. M. (2010). Can there ever be too many options? A meta-analytic review of choice overload. *Journal of Consumer Research*, 37(3), 409–425. https://doi.org/10.1086/651235 — Meta-analysis (mean effect near zero). The reason R8 is written as an emphasis rule rather than an option-count rule.
18. Levin, I. P., Schneider, S. L., & Gaeth, G. J. (1998). All frames are not created equal: A typology and critical analysis of framing effects. *Organizational Behavior and Human Decision Processes*, 76(2), 149–188. https://doi.org/10.1006/obhd.1998.2804 — Review and typology. The basis for the claim that Option B is also a frame (§10).
19. Hsee, C. K. (1996). The evaluability hypothesis: An explanation for preference reversals between joint and separate evaluations of alternatives. *Organizational Behavior and Human Decision Processes*, 67(3), 247–257. https://doi.org/10.1006/obhd.1996.0077 — Experimental. Why a bare count is hard to evaluate (§10, C1).

### Trust, misinformation, uncertainty and human-AI interaction

20. Pennycook, G., Bear, A., Collier, E. T., & Rand, D. G. (2020). The implied truth effect: Attaching warnings to a subset of fake news headlines increases perceived accuracy of headlines without warnings. *Management Science*, 66(11), 4944–4957. https://doi.org/10.1287/mnsc.2019.3478 — Experimental, *n* = 6,739. The single most important source in this document (R16, R18, §9).
21. Vasconcelos, H., Jörke, M., Grunde-McLaughlin, M., Gerstenberg, T., Bernstein, M. S., & Krishna, R. (2023). Explanations can reduce overreliance on AI systems during decision-making. *Proceedings of the ACM on Human-Computer Interaction*, 7(CSCW1). https://doi.org/10.1145/3579605 — Experimental. The empirical case for the strata model (§4).
22. Bansal, G., Wu, T., Zhou, J., Fok, R., Nushi, B., Kamar, E., Ribeiro, M. T., & Weld, D. (2021). Does the whole exceed its parts? The effect of AI explanations on complementary team performance. *CHI '21*. https://doi.org/10.1145/3411764.3445717 — Experimental. Explanations raise acceptance regardless of correctness (§8, §10).
23. Buçinca, Z., Malaya, M. B., & Gajos, K. Z. (2021). To trust or to think: Cognitive forcing interventions can reduce overreliance on AI in AI-assisted decision-making. *Proceedings of the ACM on Human-Computer Interaction*, 5(CSCW1). https://doi.org/10.1145/3449287 — Experimental. Why Imbas should get forcing from structure rather than interruption (§2).
24. Newman, E. J., Garry, M., Bernstein, D. M., Kantner, J., & Lindsay, D. S. (2012). Nonprobative photographs (or words) inflate truthiness. *Psychonomic Bulletin & Review*, 19, 969–974. https://doi.org/10.3758/s13423-012-0292-0 — Experimental. Provenance placement (R19, §8).
25. Kirlappos, I., Sasse, M. A., & Harvey, N. (2012). Why trust seals don't work: A study of user perceptions and behavior. *Trust and Trustworthy Computing (TRUST 2012)*, LNCS 7344. https://doi.org/10.1007/978-3-642-30921-2_18 — Experimental. Certification aesthetics (§9). *Citation confidence: volume and series verified from record; confirm page range before quoting.*
26. Rains, S. A. (2013). The nature of psychological reactance revisited: A meta-analytic review. *Human Communication Research*, 39(1), 47–73. https://doi.org/10.1111/j.1468-2958.2012.01443.x — Meta-analysis. The evidenced case against a prosecutorial register (§9, R15).
27. Wood, T., & Porter, E. (2019). The elusive backfire effect: Mass attitudes' steadfast factual adherence. *Political Behavior*, 41, 135–163. https://doi.org/10.1007/s11109-018-9443-y — Experimental, 8,100+ subjects. Included specifically to keep the backfire effect *out* of Imbas doctrine.
28. Ecker, U. K. H., Lewandowsky, S., Chang, E. P., & Pillai, R. (2014). The effects of subtle misinformation in news headlines. *Journal of Experimental Psychology: Applied*, 20(4), 323–335. https://doi.org/10.1037/xap0000028 — Experimental. The load-bearing source against Z1.4 Option A (§10).
29. Budescu, D. V., Por, H.-H., Broomell, S. B., & Smithson, M. (2014). The interpretation of IPCC probabilistic statements around the world. *Nature Climate Change*, 4, 508–512. https://doi.org/10.1038/nclimate2194 — Experimental, multi-country. Dual verbal-plus-numeric presentation (§8, §10).
30. Kay, M., Kola, T., Hullman, J., & Munson, S. A. (2016). When (ish) is my bus? User-centered visualizations of uncertainty in everyday, mobile predictive systems. *CHI '16*. https://doi.org/10.1145/2858036.2858558 — Experimental. Uncertainty presentation for non-expert readers (§8).
31. Sundar, S. S. (2008). The MAIN model: A heuristic approach to understanding technology effects on credibility. In *Digital Media, Youth, and Credibility* (MacArthur Foundation Series). — Theoretical framework with empirical support. Interface cues and credibility heuristics (§8).
32. Ding et al. (2025). Reported finding that citations raise trust in AI-generated answers even when randomly assigned, with a low verification rate (~10%). — **Citation confidence: LOW.** This finding was surfaced during the research pass and its venue and authorship were not independently verified in this session. It is consistent with sources 22 and 24 and adds nothing this document depends on. **Do not cite publicly without verifying the record.**

### Standards and guidance

33. W3C. *Web Content Accessibility Guidelines (WCAG) 2.2*. https://www.w3.org/TR/WCAG22/ — Normative. SC 1.3.1, 1.4.3, 1.4.10, 1.4.11, 1.4.12, 2.4.11, 2.5.8, 3.2.3, 3.2.4.
34. W3C. *Understanding SC 2.5.8: Target Size (Minimum)*. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — Informative. The inline exception underpinning R13.
35. W3C. *Understanding SC 1.4.10: Reflow*. https://www.w3.org/WAI/WCAG22/Understanding/reflow.html — Informative. R23, R25.
36. W3C. *Understanding SC 1.4.12: Text Spacing*. https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html — Informative. R25.
37. W3C. *Understanding SC 2.4.11: Focus Not Obscured (Minimum)*. https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html — Informative. R23, M5, M6.
38. W3C. *Making Content Usable for People with Cognitive and Learning Disabilities*. https://www.w3.org/TR/coga-usable/ — **Working Group Note. Informative, not normative.** Consistency, familiar patterns, avoidance of mode-based interfaces (§M).
39. W3C. *Digital Publishing WAI-ARIA Module 1.1*. https://www.w3.org/TR/dpub-aria-1.1/ — Normative for the roles it defines. `doc-noteref` / `doc-endnote` as the conservative pattern for R12.
40. W3C. *WCAG 3.0* (Working Draft). https://www.w3.org/TR/wcag-3.0/ — **Draft. The contrast method is not settled.** APCA is **not** normative and must not be used as a conformance basis. All contrast figures in this document use the WCAG 2.x relative-luminance method.
41. Apple. *Human Interface Guidelines — Accessibility*. https://developer.apple.com/design/human-interface-guidelines/accessibility — Platform convention. The 44pt target convention (J6).
42. Google. *Material Design 3 — Accessibility*. https://m3.material.io/foundations/accessible-design/accessibility-basics — Platform convention. The 48dp target convention (J6).

### Primary observation

43. Imbas Reader, live public surface. https://www.imbaslabs.com/reader.html — Direct read-only observation, 2026-08-13, one completed Guided Case run at 1280×900. All figures in §0. The repository was not inspected.

---

## Appendix — verification record

**Checked before release of this document.**

- No new palette proposed. The only colors named are `#2A211E`, `#F2E8DC`, `#B46A5A` and the shipped `--ember: #DE6F38`, all of which are existing system values. §0.5 flags the documented/shipped divergence and §J10 leaves the resolution to the founder.
- No governed consumer string rewritten. §13 states communication objectives only and proposes no replacement wording.
- No new taxonomy introduced. OMISSION, FRAMING DRIFT, DEFLECTION, QUOTED, ABSENT, UNRESOLVED, GLANCE, READ, INSPECT are used as defined. No action families added.
- No standing doctrine altered. UNRESOLVED remains non-surfacing (§4 closing adds only a leakage-prevention implication). Imbas remains on the question side of the action layer (R21).
- Every binding rule carries exactly one measurability class. Twenty-six rules: twenty-four MEASURABLE-NOW, one MEASURABLE-NOW with an attached probe (R18), one classified MEASURABLE-NOW for enforcement with the perceptual claim routed to a probe (R15). Fourteen mobile checks carry their own classes, of which one is MEASURABLE-WITH-PROBE (M13) and two are JUDGMENT (M8 bound, M14).
- No structural proxy claims to prove cognition. Every MEASURABLE-NOW measure names a structural observable. §1's opening caution and §7's status flags state the limit explicitly.
- No invented thresholds. Where a number is a founder choice it says so: J2 (orientation interval), J3 (accent and feature-variety ceilings), J6 (target convention), J7 (screens to action), J11 (sample sizes), M8 (line-length bound), M14. The only derived numbers are the R14 word ceiling (arithmetic from a measured reading rate and a chosen interval) and the §0.6 contrast ratios (computed, method stated).
- Density: §O states plainly that no defensible universal threshold exists.
- Sources: forty-three entries, evidence type given for each, links provided where verified. Three entries carry explicit citation-confidence flags, one of them LOW with a do-not-cite instruction.
- Z1.4 is not ruled. §10 presents both cases, names what evidence cannot settle, and hands four ordered decisions to the founder.
