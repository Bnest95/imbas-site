# IMBAS — Reader Open Queues

**Status: UNRESOLVED INPUTS. Nothing in this file is an adopted decision.**

Every item below is an open question, an observed defect, or a build item waiting on a
decision. No item here has been ruled on. No item here governs anything. A future session
must not cite this file as authority, implement an item because it is written down, or
treat the wording of an item as approved copy.

Adopted rulings live in `docs/IMBAS-READER-OUTPUT-DESIGN.md` and
`docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md`. If an item here is ever ruled on, the ruling
goes there and the item leaves this file.

This file exists because these observations were produced in working sessions and had no
durable home. Three times, work in this project has been lost with the session that made
it. Writing an item down here preserves it. It does not promote it.

Recorded 2026-07-26.

---

## PASS 2B COPY AND OUTPUT QUEUE

Inputs to the Pass 2B copy and output work. Unresolved.

**1. S2's next-step copy points at a panel that may not have rendered.**
`reader-explain-panel.js:80` gives the S2 state the next-step line "Open the checks, copy a
verification question into your own AI, or export the review record." "Open the checks"
directs the reader to a Check Register panel. Nothing establishes that the panel rendered
on that run. The copy assumes a surface it does not check for.

**2. Two vocabularies name the same three classes on the same page.**
Single mode renders "Missing item / Framing issue / Deflection"
(`workbench-app.jsx:3923`). Paired mode renders "Omission / Framing Drift / Deflection"
(`workbench-app.jsx:4124`). One reader, one page, two names per class. Which vocabulary
wins, and whether the loser survives anywhere, is undecided.

**3. Two different measures collide as adjacent numerals.**
"Candidate gap estimate: 2 of 3" renders near "Omission: 3". One is an ordinal estimate on
a 0-3 axis. The other is a count of findings. They share no scale and no method. The
interface states no relationship between them, so the reader supplies one.

**4. Live copy carries a confirmation implication the Act 2 ruling withdraws.**
The paired headline "It answers when asked. It just didn't volunteer." reads as Act 2
confirming what Act 1 flagged. The adopted Act 2 ruling removes that implication: the two
acts are independent passes and Act 2 does not exist to confirm Act 1. This string is live.

**5. The only zero-work entry point fails the legibility bar.**
The Chevron and Loper Bright demo is currently the one place a visitor with nothing to
paste can see the product work. Its subject matter does not clear Section P's standard: a
normal person understands the catch in roughly ten seconds. It stands as a placeholder
until a factory-produced example replaces it.

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

**5. The 1.0-to-1.1 prompt transition has no recorded decision trail.**
`buildTargetedPrompt` (`reader-paired.js`) reads its `measurement` argument only to decide
eligibility, then returns the constant `TARGETED_PROMPT_TEXT`. The name says it builds a
prompt from the measurement. It does not. That misleading name is forensic evidence of an
undecided transition from a derived prompt to a constant one, not a defect to tidy. Record
the decision trail before anyone renames the function or touches its argument.

**6. An undeclared custom property is consumed 14 times.**
workbench.css references --ink-dim 14 times. The custom property is declared nowhere in the
repository, so each declaration using it becomes invalid at computed-value time and falls
back through inheritance or the property's initial behavior. The exact visual consequence
depends on the property consuming the unresolved variable and must be audited before
choosing a replacement token.
