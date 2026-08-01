# IMBAS — Reader Open Queues

**Status: UNRESOLVED INPUTS. Nothing in this file is an adopted decision.**

Every item below is an open question, an observed defect, or a build item waiting on a
decision. No item here has been ruled on. No item here governs anything. A future session
must not cite this file as authority, implement an item because it is written down, or
treat the wording of an item as approved copy.

Adopted rulings live in `docs/IMBAS-READER-OUTPUT-DESIGN.md` and
`docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md`. If an item here is ever ruled on, the ruling
goes there and the item leaves this file.

Items closed by a shipped pass are marked **CLOSED** in place rather than deleted, and they
name the code and the tests that closed them. Deleting them would renumber the items still
open, and items in this file cross-reference each other by number. A CLOSED item is a
record of work already done; it is not an input and it is still not an authority.

This file exists because these observations were produced in working sessions and had no
durable home. Three times, work in this project has been lost with the session that made
it. Writing an item down here preserves it. It does not promote it.

Recorded 2026-07-26.

---

## PASS 2B COPY AND OUTPUT QUEUE

Inputs to the Pass 2B copy and output work. Item numbering is fixed — a closed item stays
in place with its resolution recorded, because items below cross-reference these numbers.

**1. S2's next-step copy points at a panel that may not have rendered.** — **CLOSED, Pass 2B-B.**
The S2 state carried the fixed next-step line "Open the checks, copy a verification question
into your own AI, or export the review record." All three controls live inside the Check
Register, which renders nothing when the both-ends-quotable filter drops every card. S4
carried the same fault permanently: a paired inspection produces a delta, never checks.

Resolved by `EXPLAIN_AFFORDANCE_KEYS` and `buildNext` in `reader-explain-panel.js`
(`EXPLAIN_PANEL_VERSION` bumped to `explain-panel.v3`). Each state now declares an ordered
`next_options` list, every clause gated on one affordance key, and the caller passes those
flags from the same expressions that gate the panel mounts. When nothing rendered the
section is omitted rather than filled. Held by `test/reader-explain-panel.test.mjs` and
`test/inspection-meaning-findings-source.test.mjs`.

**2. Two vocabularies name the same three classes on the same page.** — **CLOSED, Pass 2B-B.**
Single mode rendered "Missing item / Framing issue / Deflection" and paired mode rendered
"Omission / Framing Drift / Deflection". One reader, one page, two names per class.

Resolved in favor of Omission / Framing Drift / Deflection on every current-run render.
Candidate status moved to the section header and the boundary line, where a status belongs,
instead of riding inside the name of the signal. One surface still carries the retired
split vocabulary — `inspection.js`, the share page — and it is carved out by the same ruling
that carves the score; it moves with SCORE RETIREMENT QUEUE item 1, not before it.

**3. Two different measures collide as adjacent numerals.** — **CLOSED, Pass 2B-B.**
"Candidate gap estimate: 2 of 3" rendered near "Omission: 3". One was an ordinal estimate on
a 0-3 axis, the other a count of findings; they shared no scale and no method, and the
interface stated no relationship between them.

Resolved by removing the estimate from every current render rather than by explaining the
relationship. One number remains, it names its own unit and predicate, and a reader can
check it by counting the rows beneath it. `test/zero-score-language.test.mjs` holds it at
zero.

**4. Live copy carries a confirmation implication the Act 2 ruling withdraws.**
The paired headline "It answers when asked. It just didn't volunteer." reads as Act 2
confirming what Act 1 flagged. The adopted Act 2 ruling removes that implication: the two
acts are independent passes and Act 2 does not exist to confirm Act 1. This string is live.

**5. The only zero-work entry point fails the legibility bar.** — **CLOSED, Pass 2B-B.**
The Chevron and Loper Bright demo was the one place a visitor with nothing to paste could
see the product work. Its subject matter did not clear Section P's standard: a normal
person understands the catch in roughly ten seconds. It stood as a placeholder until a
factory-produced example replaced it.

Replaced by the Montana capture from the public example packet, in `reader-public-example.js`.
The catch is a repayment obligation a renter can act on, and it is legible without knowing
what an agency is. Four facts stay separate on the surface, because merging any two states
something the stored bytes do not carry: what the person declared about the capture, what
the page displayed, what the hashes fix, and the absence of any matched-conditions
determination to read. `test/reader-public-example.test.mjs` checks the rendered facts
against the packet file, so drift fails in CI rather than at publication.

What 2B-B did not own, and what is therefore still open: the acquisition choreography
around the door, expanded explanatory copy, hierarchy polish beyond the minimum truthful
entry, and first-visit conversion behavior. The superseded 7-day row stays excluded.

**6. Each figure needs its own claim register and provenance label.**
Single-mode live output should report a count of candidate items, not a gap score. Paired
matched output, paired unmatched output, and archive figures are three different kinds of
claim. Each needs its own register and its own provenance label. None of that is decided.

**7. The result surface should render findings generically.**
The result view should present a set of things this inspection found, each anchored to
quoted text, rather than hardcoding three classes or a paired-comparison shape. New
measurements ship as detectors. A result view that hardcodes today's three classes forces
a redesign for every future measurement.

*Verified, with the symbols corrected.* The brief that produced this queue named the map
wrong, so the names are recorded here. The mapping runs in two hops across two files.
`CANDIDATE_TO_DETECTOR_FINDING` (`api/read.js:435`) maps the Reader's candidate vocabulary
to finding types. `FINDING_TYPE_TO_DETECTOR` (`reader-checks.js:52`) maps a finding type to
a detector id. `reader-checks.js` contains no `CANDIDATE_TO_DETECTOR_FINDING`. The
architecture claim holds: `FAMILIES` (`reader-checks.js:37`) already covers `comparative`,
`local_integrity`, and `profile`; `validateDetectorEvent` (`390`) validates each family
independently; `buildCheckRegister` (`339`) assembles and ranks. A detector can be added
without changing the construct.

**8. The completeness badge states a verdict on the answer, on every read.** — **CLOSED, Pass 2B-B correction.**
Found while building the honest empty states in Pass 2B-B, and deliberately not fixed there.
`READER_COMPLETENESS_GLOSS` in `workbench-app.jsx` prints one line under the read badge:
full glosses as "The answer substantially served the question", partial as "Some material
context was missing or shaped", thin as "The answer was evasive or substantially
incomplete". Two problems, and only the second is an empty-state problem.

First, these are verdicts about the answer, not statements about what this inspection
observed. "Substantially served the question" is the kind of claim the framing rules exist
to keep off the surface: it is a judgment, stated without a sample size, on a single pass
over a single answer. "Evasive" additionally attributes conduct, which is a motive verb
about a model in everything but grammar.

Second, the full gloss is what renders above a read that surfaced nothing, so the one place
the surface most needs to say "this pass found nothing" instead says the answer was good.
The board photographs exactly that, in `single-empty-read`.

It was left alone because the gloss renders on every read, so rewording it changes the
populated result too — a copy decision for the register lane, not a repair to an empty
state.

Resolved by the 2B-B correction under the standing register, as strings only. The badge
reports whether anything came up and the line reports what came up, in the three ruled
signal names: NOTHING FLAGGED over "This inspection surfaced no omission candidates",
SOMETHING TO CHECK over "This inspection surfaced candidates. They are listed below",
DEFLECTION FLAGGED over "This inspection surfaced a Deflection signal: the answer went
around the question rather than at it." The evasiveness reading was not dropped; it ships
as Deflection, which is the class that carries it without attributing conduct. The keys
stay full / partial / thin because they key the CSS and the inspector's own field, and
they are not shown. `formatReaderResultCopy` prints the same words the badge shows rather
than the raw key, so the pasted card cannot restate the all-clear the badge stopped making.
Held by `test/reader-no-allclear-vocabulary.test.mjs`, which lists the prohibited all-clear
and conduct vocabulary and scans both the shipped constants and the committed board
baselines for it. The `single-empty-read` baselines are re-photographed at both viewports.

The second question the item raised — whether a three-way badge is a claim the Reader is
entitled to make at all — is NOT answered here. What ships is a three-way flag summary, not
a three-way grade. Whether the summary earns its place is a register-lane question and it
stays open as item 12.

**9. The curated case surface computed a three-way verdict from the visitor's paste.**
Recorded 2026-07-30 by the Pass 2B-B correction, which removed the render and preserved the
idea. `detectAnchors` in `workbench-app.jsx` token-matched the visitor's pasted answer
against the stored anchors of a published case and printed CLOSED GAP, PARTIALLY SURFACED
or GAP HELD over it. That is a live computed verdict, derived outside the canonical
selectors, on the strength of a term match — a categorical rebuild of the figure the same
pass removed. It is gone from the current surface, and what stands there now is a fixed
archive-tier fact read off the published case, labelled with the human-review tier and the
observed date, never recalculated from the paste.

The detector itself is worth keeping and is not ruled on. If it returns it returns as a
flag, not a verdict: it states its own basis in the sentence a person reads, and it is
legible to someone who has never read the methodology. "The archived case's one-year filing
deadline was not found in your answer by this term check" is the register. "GAP HELD" is
not, and neither is any label that needs an Imbas word to parse. A term match over a stored
anchor list is weak evidence, and a flag that says so is honest where a badge that hides it
is not. Register lane, or C.

**10. The share card still writes verdict prose from the same detection.**
Recorded 2026-07-30, alongside item 9, and deliberately not taken by that correction.
`buildShareResultText` in `workbench-app.jsx` assembles the copyable card for a curated run
and still speaks in the removed vocabulary — "gap held — the answer did not name…". It is
closer to the acceptable register than the badge was, because it states the basis in the
same breath rather than compressing it into two words, and it renders inside a collapsed
panel rather than as the headline. It was left because the correction was scoped to the
result surface and to strings, and rewriting the card is a copy decision about a different
surface.

It should be read against item 9's ruling when that ruling lands, so the card and the
detector move together rather than one being fixed twice.

**11. Two shipped surfaces now say different things about the same absence.**
Recorded 2026-07-30. The correction replaced the zero-delta copy on the run surface with
"This probe surfaced nothing new. That doesn't mean either answer is complete." The share
page (`inspection.js`) still renders the retired pair — the heading "The delta" and the body
"No material gap. The direct question surfaced nothing decision-relevant the first answer
left out." — because `inspection.js` is a carved surface and the standing ruling forbids
touching it in B.

The consistency invariant is what this item exists to satisfy: a visitor who runs an
inspection and then opens its share link currently reads two different accounts of the same
result, one of which puts the absence on the answers. It moves with SCORE RETIREMENT QUEUE
item 1, which already carries `inspection.js` for the score and the retired split
vocabulary. Adding a third string to that same move costs nothing; moving it early would
break the carve.

**12. Whether a three-way flag summary is a claim the Reader may make at all.**
Recorded 2026-07-30, split off from item 8 when that item closed. Item 8 removed the
verdict from the completeness badge and left the shape: three states, one shown per read.
What ships is a summary of whether anything came up, not a grade on the answer. Nobody has
ruled on whether the Reader should summarize at all, or whether the finding list alone is
the honest surface and any badge above it is a compression that invites the reading the
copy just stopped making. Register lane.


**13. Two degraded surfaces were saying the run had finished.**
Recorded 2026-07-30 by the Pass 2B-B correction, found by photographing the states
rather than by reading the code — which is the argument for photographing them. When
`/api/read` fails, the client builds a fallback result and the screen showed a banner
explaining the Reader was unavailable directly under a status line reading "Inspection
complete." Separately, the copyable card looked a signal name up from the fallback's
completeness key — a key the client sets to drive the muted styling, not because
anything was observed — so a failed request pasted into a document arrived carrying a
finding Imbas never made. Both are fixed here as strings: the status line has a
`degraded` state of its own, and the card leads with the fact that the inspection did
not run.

What is NOT resolved is why a fallback carries a completeness value at all. It is a
presentation key wearing the name of a measurement field, and the next thing that reads
it by name will make the same mistake in a new place. Renaming it touches the client's
result shape, so it is not a strings-only change and it did not belong to this
correction. `test/reader-degraded-states.test.mjs` holds the two surfaces meanwhile.


---

## CALIBRATION QUEUE

Observed behavior and build items. Unresolved. The model-behavior items are recorded as
reported observations, not as measurements.

**1. Conditions provenance stops at the browser tab. HIGHEST PRIORITY.**

This is a data-flow build item, not copy work.

The trace below was verified against source at `BASE_SHA`
`6055bcce4c130410f4bf9e963331b6a2d74723da`. Each surface is stated separately.

*Where it is collected.* `workbench-app.jsx:4224-4226` holds `sameModel`, `modelVersion`,
and `edits` as React state on the paired paste-back form. The chip lane holds the same
three at `workbench-app.jsx:4907`.

*Where the derivation runs.* `deriveConditionsMatched` is defined at `reader-paired.js:254`
and called from exactly one place, `buildPairCapture` at `reader-paired.js:269`.
`buildPairCapture` is called from exactly two product sites, `workbench-app.jsx:4234`
(inspection lane) and `workbench-app.jsx:4907` (chip lane). No file under `api/` calls
either function. **The derivation executes only in the browser.**

*Confirmed present.* The Review Packet JSON export carries the conditions. `PairedTest`
renders `<ReviewRecordExport … pair={pair} />` at `workbench-app.jsx:4186`, `pair.capture`
is the derived capture block, and `reader-review-record.js:223` embeds it verbatim in the
schema `PairRun`. The record also carries `targeted_source_model` name and version. It is
built and hashed in the tab, and it is the one durable artifact that can reconstruct the
matched-conditions claim.

*Confirmed absent, each stated separately.*
- **Not sent to `api/read-paired.js`.** `runPairedReader` posts only `open_receipt` and
  `targeted_answer` (`workbench-app.jsx:2146`). `runChipPairedReader` adds only
  `initiator`, `chip_id`, and `instruction_version` (`workbench-app.jsx:2210-2216`). The
  endpoint reads no conditions field off the body.
- **Not in the API response.** `buildPairedPayload` and `buildChipPairedPayload` are built
  from `pairedAnalysis` / `chipAnalysis` (`api/read-paired.js:1012-1066`). Neither object
  holds a conditions field.
- **Not in either paired receipt. This absence is a design decision with recorded
  reasoning, not data loss.** Neither `buildPairedReceipt` (`reader-receipt.js:201`) nor
  `buildChipPairedReceipt` (`260`) carries a conditions field. The chip receipt's omission
  has its reasoning written directly above it at `reader-receipt.js:254-257`: the state
  "depends on the person's paste-back conditions (a client-side capture the server never
  sees)", and the artifact is hashed, so the state is derived at render and "never frozen
  into a receipt where it could contradict the conditions actually disclosed." The
  inspection paired receipt sits under both of the same constraints, a client-side capture
  and a hashed artifact, but no comment there states the decision.
  **Whoever closes this gap must reckon with that reasoning before adding the field to a
  hashed artifact.** A future reader who simply adds it is overriding a documented decision
  without having seen it. This constrains the shape of any remedy. It does not decide one,
  and nothing in this file rules on it.
- **Not in Airtable.** `capturePaired` writes neither branch's conditions
  (`api/read-paired.js:531-563`). No Same Model, Conditions Matched, User Edits Disclosed,
  or Model Version column is written.
- **Not in the share permalink.** `inspection.js` contains zero references to
  `conditions`, `unmatched`, `same_model`, `edits`, or `capture`. `renderPaired` composes
  masthead, question, panel, actions, and seam, and carries no conditions notice.
  `api/inspection-share.js` stores no conditions field.
- **Not anywhere in the chip lane's durable output.** The chip lane's capture reaches only
  `<ChipDeltaView capture={capture}>`, a render prop. The chip lane exports no review
  record.

`reader-paired.js:230-231` already concedes part of this in a source comment: the
share/permalink view "does NOT carry it yet."

*Consequence.* Live gating can render correctly during the session while the receipt, the
Airtable row, the share permalink, and the OG projection cannot reconstruct or support the
same matched-conditions claim. Under the adopted Act 2 ruling, any surface that cannot
establish matched conditions from its own data must speak descriptively. Today that is
every durable surface except the Review Packet JSON.

*One clarification for whoever builds this.* `inspector_run_conditions` and the
`condition_fingerprint` (`cfp.1`) are a different thing. They cover the inspector call's
sampling parameters, model version, and prompt version. They say nothing about whether the
person ran the two answers on the same model without edits.

**2. A `full` completeness label can contradict its own findings.**
Act 1 has labeled a result completeness `full` while the findings produced in that same run
named a material omission. Observed twice on the same question, in separate sessions. The
completeness label must reconcile with the findings from the same run. Reported
observation.

**3. The Act 2 probe shows a subject-matter pull toward procedure.**
Two of two "why did X happen to me" questions returned procedure tables: statute, notice
periods, complaint channels. The probe has not been tested against any question with no
statutory surface. Reported observation, two runs.

**4. The prose omissions list and the typed finding counts disagree.**
They are different structures. They disagreed on three of four observed runs. The mapping
between them is undocumented. The typed counts are what the interface shows the user.
Reported observation.

**5. The 1.0-to-1.1 prompt transition has no recorded decision trail.** — **CLOSED, Pass 2B-C.**
`buildTargetedPrompt` (`reader-paired.js`) read its `measurement` argument only to decide
eligibility, then returned the constant `TARGETED_PROMPT_TEXT`. The name said it builds a
prompt from the measurement. It did not. That misleading name was forensic evidence of an
undecided transition from a derived prompt to a constant one, not a defect to tidy. This
item required the decision trail to be recorded before anyone renamed the function or
touched its argument.

The trail was recorded by the Act 2 ruling in `docs/IMBAS-READER-OUTPUT-DESIGN.md` Part 4,
adopted 2026-07-26: §1 states that the second question is a fixed completeness probe that
does not exist to confirm the first inspection, and gives the reason a derived prompt was
rejected — a derived prompt supplies the answer inside the question. §5 states where
derived prompts went instead: an explicit verify-this action and instrument-grade protocol
capture. The transition is decided, dated, and on the record in the file this one names as
where adopted rulings live.

With that precondition met, Pass 2B-C renamed the function to `targetedPromptOffer` and
dropped the `question` its callers passed and it never read (`reader-paired.js`,
`api/read.js`, `api/read-paired.js`, `scripts/qa/scenarios.mjs`). Behavior is unchanged.
Held by `test/reader-paired.test.mjs` and `test/reader-paired-value-close.test.mjs`.

One conflict is left open rather than resolved here: Act 2 Ruling §1 calls the probe
"content-neutral" and "non-leading", and the comment at `reader-paired.js` records that a
calibration finding retracted both framings and that they must not return. The rename uses
neither word. Which of the two governs the vocabulary is a register-lane question, not a
naming one.

**6. An undeclared custom property is consumed 14 times.**
workbench.css references --ink-dim 14 times. The custom property is declared nowhere in the
repository, so each declaration using it becomes invalid at computed-value time and falls
back through inheritance or the property's initial behavior. The exact visual consequence
depends on the property consuming the unresolved variable and must be audited before
choosing a replacement token.

---

## CHECK REGISTER QUEUE

Recorded 2026-07-27. Pass 2B-A found these three while deciding whether the Check Register
could carry a probe-side anchor. It fixed none of them. Each was verified against
`reader-checks.js` at the time of writing.

**1. A span's `artifact_id` is stamped from a parameter, not derived from the text it
resolved against.**
`resolveSpan` (`reader-checks.js:142`) takes `artifactText` and `artifactId` as two
independent arguments and writes `artifact_id: artifactId` into the span it returns
(`157`). It never checks that the id names the text. `assembleComparativeCheck` (`186`)
takes the same two as separate parameters, so a caller can pair one artifact's id with
another artifact's text and the span records the wrong id as fact. The offsets are
verified. The attribution is asserted.

**2. `spanResolves` never reads `artifact_id`.**
`spanResolves` (`reader-checks.js:384`) checks the offset arithmetic and re-slices
`artifactText` to confirm the quote is verbatim. It does not consult `span.artifact_id`.
The validator therefore establishes that the quote occurs in the text handed to it, not
that the quote occurs in the artifact the span names. Taken with item 1, a span carrying
the wrong artifact id passes validation and the check built on it enters the register.

**3. What blocks a probe-side anchor is a prompt change, not a signature change.**
`assembleComparativeCheck` resolves both ends against a single `artifactText`
(`199-200`). Its signature already carries an `artifactId`, so widening the signature is
not what stands in the way. The inspector is never asked which artifact a quoted span came
from, so nothing in the check block distinguishes an open-answer quote from a
probe-answer quote. Closing this needs the prompt and the check-block schema to carry
per-quote attribution. Whoever takes it should know that one route was considered and
rejected: resolving each quote against both answers and keeping whichever matched. That
route invents the attribution it claims to discover, which the anchor contract forbids.

*What Pass 2B-A did instead.* It recorded a suppression reason for the case where the
register cannot consume a valid anchor shape: `PROBE_SIDE_ANCHOR_UNSUPPORTED`
(`reader-result.js:342`). The string is deliberately specific. A generic label such as
"below threshold" would merge two opposite conclusions — the findings are weak, and the
register cannot read a valid anchor — and no later pass could separate them again.

## PAIRED SURFACE QUEUE

Recorded 2026-07-27, and verified live in the browser at both viewports before being written
down. Pass 2B-A repointed every visible count on the SINGLE surface to the named
`surfaced_findings` subset so that no displayed number can include a finding the reader
cannot verify. It did not do that on the paired surface. This is the remaining half.

**1. `PairedDeltaView` tallies and lists the pre-canonical wire fields.**
The visible tally comes from `paired.signal_counts` and the rows from `paired.delta_items`
(`workbench-app.jsx:4167`, `4170`). Both are pre-canonical, so neither consults the anchor
contract. The named subset the canonical result already carries —
`probe_surfaced_differences` — is built and available on this branch and is read by nothing
on screen.

The consequence is demonstrable, not hypothetical. A delta item whose supplied probe-side
quotation does not occur in the probe answer is still counted and still rendered, with its
unresolvable quotation shown in quotation marks as if it were verbatim. Driven live: the
tally read `Omission: 2 · Framing Drift: 0 · Deflection: 0` while
`probe_surfaced_differences` was 1, and the second row displayed a "Second answer" quotation
that appears nowhere in the second answer. Same result at desktop and mobile. This is the
same defect class Pass 2B-A removed from the single surface.

It was deferred rather than fixed because repointing the rows means settling the paired class
vocabulary (PASS 2B COPY AND OUTPUT QUEUE item 2 above), which is a different decision from
the one this pass was scoped to make. Repointing only the tally would have been worse than
leaving it: the number would then disagree with the rows printed beneath it, which is exactly
the contradiction the single-surface work existed to remove.

Two tests in `test/paired-claim-register-normalization.test.mjs` (5a, 5b) hold this in place:
one asserts `PairedDeltaView` still reads the legacy fields, so it fails the moment someone
repoints it and tells them which divergence demonstration to delete alongside it; the other
pins the arithmetic of the divergence itself.

**2. The server-side claim register reaches the paired surface and is rendered nowhere.** — **CLOSED, Pass 2B-B.**
`claim_register`, `claim_basis`, and `conditions_status` travel intact from the construction
door through the paired receipt into the browser. No paired surface displays any of them.
Verified by driving six conditions bases live: an authorized MATCHED basis, a reported client
declaration claiming MATCHED, an absent basis, an unrecognized basis, an unmatched
derivation, and a basis stripped on reload. Five of the six produced byte-identical captures
at both viewports; the harness's own checksum-collision guard caught it. Only the sixth
differed, and it differed because of the *client-side* `deriveConditionsMatched` flag, not the
register.

This is currently safe and should not be treated as urgent. `PAIR_CAPTURE_UI` has an
`unmatched_badge` and an `unmatched_warning` and no affirmative matched badge, so the surface
cannot state that conditions were matched. Nothing renders a claim it is not entitled to. But
the register is instrumentation that no reader can see, so whichever pass gives the paired
surface its conditions copy should decide deliberately what, if anything, it shows — and
should not discover the field by accident.

Decided deliberately in Pass 2B-B, item 7A. `reader-provenance.js` derives a `CLAIM_STATE`
from `claim_register` and `claim_basis` and gives each state one visible label, rendered by
`ClaimStateRow` on the paired surface. The six states separate a matched-conditions basis
from an observed difference on an authorized-but-unmatched basis, on a reported client
declaration, on no recorded basis, on a basis this build does not recognize, and from a pair
carrying no recorded finding at all. Two facts that can legitimately disagree stay separate
on screen: the client-declared `unmatched` callout is what the person reported, and the claim
state is what the record supports.

The register's totality is asserted rather than assumed — `test/reader-provenance-strip.test.mjs`
walks every reachable `(register, basis)` pair through the real construction door, requires a
distinct label for each, and fails if `CLAIM_STATE` and `CLAIM_STATE_UI` orphan an entry in
either direction. Only the matched state may use the word "matched". Today every live paired
run lands on `OBSERVED_DIFFERENCE_NO_BASIS`: `api/read-paired.js` supplies
`conditions_status: UNAVAILABLE` and no `conditions_source`, so the matched state is
unreachable in production and its acceptance-board scenario is built from a synthetic fixture.

Item 1 above stays open.

---

## SCORE RETIREMENT QUEUE

Recorded 2026-07-29, during Pass 2B-B. Pass 2B-B removed the 0-3 gap estimate from every
current Reader render, every current canonical receipt section, and every current canonical
export. It did not remove the score from the codebase. Three surfaces still carry it, each
for a stated reason, each held at a per-file ceiling by `test/zero-score-language.test.mjs`.
The ceilings may only go down. These three items are what takes them to zero.

Counts below are the ceilings recorded in that test's `BASELINE`, derived in-session.

**1. The share and permalink surface still renders a score. (2B-C)**
Carved out of 2B-B by ruling, because the share page renders the stored score from its
Airtable row: `api/inspection-share.js` (3), `inspection.js` (1), `api/inspection-view.js`
(1), and the `READER_SHARE_CONSENT` disclosure strings in `workbench-app.jsx` (2, plus the
same 2 in the generated `workbench.bundle.js`). Schema, render, page metadata and consent
copy have to move together. Rewording the consent copy alone would produce a dialog that
understates what the published page says, which is worse than the score it hides.

`inspection.js:170` also renders the retired split vocabulary — "Missing item / Framing
issue / Deflection" — and is the last shipped surface that does. It moves with this item,
not before it.

It also carries the all-clear and conduct gloss that item 8 removed from the run surface.
`COMPLETENESS_GLOSS` in `inspection.js` (`:12` full, `:14` thin) and the identical map in
`api/inspection-view.js` (`:25` full, `:27` thin) still publish "The answer substantially
served the question." and "The answer was evasive or substantially incomplete.", under the
`COMPLETENESS_LABEL` values FULL and THIN (`inspection.js:10`, `api/inspection-view.js:23`).
Those are the exact strings the 2B-B correction retired: the first states the answer was
complete, the second attributes conduct. Line numbers are this tree's; the symbols are what
to search for.

This is the same divergence as item 11, in a second place. A visitor who runs an inspection
now reads NOTHING FLAGGED over "This inspection surfaced no omission candidates", then opens
the share link for that same run and reads FULL over "The answer substantially served the
question." Whichever pass takes this item must replace both maps, not just the score, or the
share page will keep making the claim the Reader stopped making.

An invariant test holds the interim state honest: while the page scores, the metadata and
the consent copy must both keep disclosing it. When 2B-C lands, that test's expectation
inverts to zero on all three and the five temporary baseline entries above must be deleted,
not lowered.

**2. Score generation and storage. (API-spec lane)**
The compatibility envelope, untouched by 2B-B because API semantics are frozen: the
inspector prompt still asks for an integer on a 0-3 axis (`api/read.js`, 3), the paired
payload still carries `gap_estimate_label` (`api/read-paired.js`, 4), and both still write
a "Gap Estimate" column to Airtable. `reader-receipt.js` (2) holds `gapEstimateLabel` and
`pairedGapEstimateLabel`, which survive only because `api/inspection-share.js` and
`api/read-paired.js` import them; relocating them would change frozen API semantics.

`api/read.js` also contains the retired vocabulary in prose: "functionally evasive" once
and "fuller picture" three times, inside the inspector prompt. **That is instruction to the
model, not product copy** — nobody reads it on a page, and the all-clear and conduct rules
govern what Imbas publishes, not the words used to brief the instrument. It is named here
so a future scan does not mistake it for a shipped surface and rewrite frozen API semantics
to satisfy a copy rule that does not apply. If the prompt is ever revised for its own
reasons, this lane owns it.

Recorded 2026-07-30 by the Pass 2B-B correction, in the same lane and not in this queue's
subject: the run surface closes a paired result with "A better answer, without already
knowing what to ask.", gated on a canonical result with at least one surfaced difference.
The gate cannot check that the second answer came from the probe Imbas supplied, because
nothing in the payload records which question was actually asked. The line survives that
gap — it claims the product asked the question, which is true of every run that reaches the
gate — but if the API ever wants to enforce probe equality rather than report it, this is
the lane that owns it. `test/reader-paired-value-close.test.mjs` names the condition as
client-reported and says why.

Nothing in this envelope drives a current render, a canonical receipt claim, an export, a
tally, a label, or explanatory copy — Part A of the scan test is what proves it. Retiring
generation is a decision about the record, not about presentation, and belongs to whichever
lane owns the API spec. `reader-telemetry.js` keeps a legacy `gap` prop key for funnel-series
continuity; it names no claim and retires with the same lane.

**3. Editorial reconciliation of the live explanatory pages. (post-B)**
`glossary.html` (8) and `calibration.html` (6) still teach the machine gap estimate as
current vocabulary. They are not run surfaces and were out of 2B-B's scope, but they now
describe a figure the product no longer shows. `glossary.html` already carries Omission and
Framing Drift alongside it, so the page currently teaches both vocabularies at once.

Checked and already clean, contrary to the brief that opened this pass: `faq.html` and
`how-it-works.html` carry no score language and no retired vocabulary. They need nothing.

`whitepaper.html` (3) and `volunteer-gap-paper.html` (3) are dated documents and stay as
written. They are recorded as permanent entries in the ratchet baseline, not as debt.
