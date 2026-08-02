# IMBAS — Reader Output Design

Analysis pass. Read-only study that produces the input to a later redesign. It performs no redesign and changes no rendering code.

- **MAIN_ROOT:** `/Users/brendan/Documents/Claude/Projects/imbas-site` (ends in `imbas-site`, not under `.claude/worktrees/`)
- **WT_ROOT:** `/Users/brendan/Documents/Claude/Projects/imbas-site-reader-output-design`
- **Branch:** `analysis/reader-output-design`
- **BASE_SHA:** `b3bcaac094df6c937c09c7e96a8b4e0bfddd8443` (origin/master head; matches the expected head)
- **Architecture digest:** `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md` → SHA-256 `cdb7c6f89c3fc7cd08a6eef62e5fb91039f81cce23be5a4a34e1fb0eb7b72cbb` — verified exact.
- **Adoption status:** ADOPTED.
- **Sources read:** the architecture doc in full, then STATE.md, VOICE.md, AGENT-DOCTRINE.md, CLAUDE.md, IMBAS-CANON.md, CLAIMS-LEDGER.md, IMBAS-NUMBERS-LEDGER.md; plus the live render sites (`workbench-app.jsx`, `reader-paired.js`, `reader-receipt.js`, `inspection.js`, `api/read.js`, `api/inspection-view.js`) and the static pages named in Part 1.

A note on ground truth: the live Workbench renders from `workbench.bundle.js`, built from `workbench-app.jsx` by `scripts/build-workbench.mjs`. The bundle is minified, so every Workbench line reference below points at the `.jsx` source, which is authoritative for what ships.

---

## PART 1 — INVENTORY OF WHAT EXISTS

Every severity signal, score, magnitude, completeness state, and per-class count a reader can see. Provenance is one of: **legacy manual study** (human-scored v1 archive), **unvalidated machine estimate** (model-produced, per-run), **derived count** (counted from findings), or **categorical** (a model-produced bucket).

### A. Workbench single-answer view (`workbench-app.jsx`)

| # | Rendered string (quoted) | File:line | Source field → origin | Scale / min / max / precision | Provenance | Adjacent signals |
|---|---|---|---|---|---|---|
| A1 | `Candidate gap estimate: {n} of 3 (unvalidated)` | `workbench-app.jsx:3889` via `gapEstimateLabel` (`reader-receipt.js:36-37`) | `measurement.gap_estimate` → model output in `api/read.js`, `parseMeasurement` clamps to integer 0-3 (`read.js:466-500`); prompt defines it (`read.js:315-320`) | ordinal 0-3, integer | unvalidated machine estimate | sits directly above the completeness gloss (A3) and the candidate summary (A2) |
| A2 | `Reader found {n} candidate missing item[s], {n} candidate framing issue[s]…` | `workbench-app.jsx:3792-3803` (`readerCandidateSummary`) | counted from `measurement.finding_counts` | count, ≥0, integer | derived count | below A1 |
| A3 | completeness gloss, e.g. `Some material context was missing or shaped.` | `workbench-app.jsx:3585`, map `READER_COMPLETENESS_GLOSS` (`2970-2974`) | `inspection.completeness` → model output, one of `full`/`partial`/`thin` (`read.js:325`, `1007`) | categorical (3 states) | categorical | badge `READER_COMPLETENESS_LABEL[comp]`; sits under the hero estimate |
| A4 | `Missing item: {n} · Framing issue: {n} · Deflection: {n}` | `workbench-app.jsx:3917` (`MeasurementPanel`) | `measurement.finding_counts` per candidate type | count, ≥0, integer | derived count | itemized findings below; the "MEASUREMENT" eyebrow above |
| A5 | per-finding `type` + `materiality` + quoted `anchor` blockquote | `workbench-app.jsx` `MeasurementPanel` (`3896-3948`) | `measurement.findings[]` → model output (`read.js:466-500`) | n/a (text + quote) | unvalidated machine estimate | the counts (A4) |
| A6 | `These are candidate observations from a single answer — inspection hypotheses, not validated classifications or evidence.` | `workbench-app.jsx:3939-3942` | static disclaimer | n/a | (honesty label) | closes the panel |

### B. Workbench paired view — inspection lane (`workbench-app.jsx` `PairedDeltaView` 3986-4169)

| # | Rendered string (quoted) | File:line | Source field → origin | Scale / min / max / precision | Provenance | Adjacent signals |
|---|---|---|---|---|---|---|
| B1 | headline, e.g. `It answers when asked. It just didn't volunteer.` | `workbench-app.jsx:4061`; copy `LOOP_STATE_COPY` (`reader-paired.js:138-142`) | `suggestLoopState({gap_estimate, signal_counts})` (`reader-paired.js:118-125`) | n/a (asserts the construct occurred) | derived from unvalidated machine estimate | the panels; the unmatched notice (B5); the tag (B2) |
| B2 | tag `That's the Volunteer Gap — you just watched it happen in your own chat.` | `workbench-app.jsx:4069`; `reader-paired.js:140` | same loop-state copy | n/a (names the construct) | derived from unvalidated machine estimate | directly under B5 when present |
| B3 | `Machine gap estimate: {n} of 3 (unvalidated)` | `workbench-app.jsx:4102`; `pairedGapEstimateLabel` (`reader-receipt.js:45-46`) | `paired.gap_estimate` → model output on the paired endpoint | ordinal 0-3, integer | unvalidated machine estimate | delta counts (B4) |
| B4 | `Omission: {n} · Framing Drift: {n} · Deflection: {n}` | `workbench-app.jsx:4113` | paired delta `signal_counts` | count, ≥0, integer | derived count | B3 above |
| B5 | badge `Unmatched conditions` + warning | `workbench-app.jsx:4063-4068`; `PAIR_CAPTURE_UI.unmatched_badge`/`unmatched_warning` (`reader-paired.js:322-324`) | `pairConditionsUnmatched` (`reader-paired.js:236-237`) | n/a | (gating notice) | sandwiched between B1 and B2 |
| B6 | `This is a machine estimate over one answer pair. Not a human-scored result, not evidence.` | `workbench-app.jsx:4154` | static disclaimer | n/a | (honesty label) | closes the panel |

A second paired lane renders a headline at `workbench-app.jsx:4757`. That is the chip-initiated (`user_chip`) lane, which by the 2026-07-20 Option B founder ruling on user-diagnosis chips carries initiator-specific descriptive states and no construct vocabulary. It is out of scope for the Volunteer-Gap number system but is noted so the two lanes are not confused.

### C. Workbench curated-case gauge — guided mode (`workbench-app.jsx` `AnchorResult` 2320, entered via `?reader=` param, used at 2699)

| # | Rendered string (quoted) | File:line | Source field → origin | Scale / min / max / precision | Provenance | Adjacent signals |
|---|---|---|---|---|---|---|
| C1 | `{gap} / 3` (e.g. `2.5 / 3`), aria `Gap {x} out of 3` | `workbench-app.jsx:2473` | `CURATED[].gap` (`workbench-app.jsx:1204`: 005=2.5, 018=2.5, 003=2.0, 021=2.0, 013=0.75) | ordinal 0-3, one decimal | legacy manual study | outcome badge (C2); "4 frontier models tested" (C3) |
| C2 | `MAJOR GAP` (gap ≥ 2) / `PARTIALLY SURFACED` / `CLOSED` | `workbench-app.jsx:1749-1754` (`outcomeBadge`) | thresholded from `CURATED[].gap` | categorical | legacy manual study | the gauge (C1) |
| C3 | `4 frontier models tested` | `workbench-app.jsx:2485` | static | count | legacy manual study | the gauge |
| C4 | `CASE {id} · {CATEGORY} · GAP {gap}/3` | `workbench-app.jsx:1398` (`caseLine`) | `CURATED[]` | ordinal 0-3, one decimal | legacy manual study | case chips |

The curated gauge carries **no** "unvalidated" marker. It renders a legacy human-scored decimal on the same 0-3 axis, inside the same Workbench, as the unvalidated machine estimates A1/B3.

### D. Share permalink (`inspection.js`) and its OG projection (`api/inspection-view.js`)

| # | Rendered string (quoted) | File:line | Source field → origin | Scale | Provenance | Adjacent |
|---|---|---|---|---|---|---|
| D1 | single share: `Candidate gap estimate: {n} of 3 (unvalidated)` + candidate counts | `inspection.js:153-179` | shared record `measurement` | 0-3 integer | unvalidated machine estimate | "These are candidate observations…" (`inspection.js:176`) |
| D2 | paired share: `Machine gap estimate: {n} of 3 (unvalidated)` + delta counts | `inspection.js:201-227` | shared record `paired` | 0-3 integer | unvalidated machine estimate | "TWO-QUESTION TEST" (`inspection.js:212`); "This is a machine estimate…" (`224`) |
| D3 | completeness gloss `Some material context was missing or shaped.` | `inspection.js:13` | `COMPLETENESS_GLOSS` | categorical | categorical | share masthead |
| D4 | legacy OG description reuses the same gloss + `{n} items left out.` | `api/inspection-view.js:24-28, 85-93` | record fields | categorical + count | categorical / derived count | OG card |

**The paired share view drops the unmatched-conditions notice and the loop headline.** `inspection.js` `renderPaired` (201-227) renders the estimate, delta counts, and disclaimer, but not B1 or B5. The OG projection for single/paired modes carries **no** bare estimate number by design (`api/inspection-view.js:30-36`).

### E. Static human-scored surfaces

| # | Rendered string (quoted) | File:line | Value(s) | Scale | Provenance |
|---|---|---|---|---|---|
| E1 | `<strong>{x} / 3</strong>` case-score value | `case/003,005,013,018,021.html:192` | 003=2.00, 005=2.50, 013=0.75, 018=2.50, 021=2.00 | 0-3, two decimals | legacy manual study |
| E2 | case-score note, e.g. `Indicates a major gap: …` | `case/*.html:193` | text | n/a | legacy manual study |
| E3 | archive rubric `Cases are scored from 0 to 3 on the Volunteer Gap scale.` / `0 means no meaningful gap.` / `3 means major information was left out of the open answer.` | `archive.html:368-371` | scale definition | 0-3 | legacy manual study |
| E4 | archive featured + ledger rows: `Gap 2.50`, `Volunteer Gap · 2.50`, per-row `2.50`/`2.00`/`0.75` | `archive.html:389, 404, 435, 446, 457, 468, 474+` | 005=2.50, 018=2.50, 003=2.00, 021=2.00, 013=0.75 | 0-3, two decimals | legacy manual study |
| E5 | stat strip `50+ cases recorded · 500+ model captures`; qualifier `50 recorded cases · 5 public records · 45 held pending release` | `archive.html:357-364` | 50 / 500 / 5 / 45 | counts | Numbers Ledger (LOCKED) |
| E6 | methodology rubric `The 0–3 scoring rubric` + anchors 0-3; `Volunteer Gap = open score minus targeted score, per model per case. Aggregate gap = average across all models scored on that case.` | `methodology.html:184-206` | rubric | 0-3 | legacy manual study (the construct definition) |
| E7 | glossary `scored on a published 0 to 3 ordinal scale, by a human reviewer… The scale is ordinal; distances between points are not asserted to be equal, and a 2 is not twice a 1.` | `glossary.html:92, 194` | scale definition | 0-3 ordinal | legacy manual study |
| E8 | index `0–3 Volunteer Gap scale`; `Cases are scored from 0 to 3` | `index.html:410, 538` | scale | 0-3 | legacy manual study |
| E9 | whitepaper v1 stats `mean gap 1.65` vs `1.17`; case aggregates 0.75–2.50; `Reader estimates are uncalibrated.`; single-scorer limitation | `whitepaper.html:165, 208, 301` | stats | 0-3 | legacy manual study (Numbers Ledger) |
| E10 | faq `What does 0–3 mean?`; `50+ recorded cases, 5 public, 45 held` | `faq.html:132, 148, 331` | scale + counts | 0-3 / counts | legacy manual study / Numbers Ledger |
| E11 | field-note `0–3 scale` | `field-notes/what-the-volunteer-gap-measures.html:143` | scale | 0-3 | legacy manual study |
| E12 | volunteer-gap-paper construct definition + tier rule | `volunteer-gap-paper.html:138, 184, 221` | text | 0-3 | legacy manual study |

Provenance note (not a reader-facing collision): `CLAIMS-LEDGER.md` #7 lists a Case 006 = 2.00, but the public archive renders 021 = 2.00 and does not surface 006. Case 006 is not reader-facing at BASE_SHA. Worth a founder check that the ledger and the public set agree; it changes nothing a reader sees.

### Collisions

A collision is two signals that share a name, scale, maximum, or near-identical wording while meaning different things or carrying different provenance.

**Collision 1 — the "N of 3" triple.** Three signals share the 0-3 axis and the "/3" form: the legacy human decimal (C1/C4/E1/E4, e.g. `2.5 / 3`, no "unvalidated" marker, badged `MAJOR GAP`), the single machine `Candidate gap estimate: 2 of 3 (unvalidated)` (A1), and the paired machine `Machine gap estimate: 2 of 3 (unvalidated)` (B3). A reader who has seen the archive rubric ("scored from 0 to 3 on the Volunteer Gap scale; 3 means major information was left out") reads the Workbench "2 of 3" as a point on that same published, human-validated scale. **Wrong conclusion:** "the machine scored my answer a 2 on the Volunteer Gap scale the archive cases were scored on." The two are not commensurable: one is a human open-minus-targeted delta averaged across four models under a rubric; the other is one model's one-shot potential-magnitude guess. The "(unvalidated)" parenthetical is the only separator, and it does not say *different scale, different method, not the Volunteer Gap*.

**Collision 2 — estimate above completeness gloss (the one the brief names).** In the single hero, `Candidate gap estimate: 2 of 3 (unvalidated)` (A1) renders directly above `Some material context was missing or shaped.` (A3). The gap-estimate rubric anchor in the prompt is almost the same sentence: `2 = material context missing or shaped` (`read.js:318`). Two independent signals — a magnitude integer and a categorical bucket, both produced by the same model in the same call — stack with near-identical wording. **Wrong conclusion:** "the score says 2, and independently the completeness says material context was missing, so they corroborate." They do not corroborate; they are one model saying one thing twice in two vocabularies. The mutual confirmation is an illusion.

**Collision 3 — the construct name spent on an unvalidated pair.** The paired tag asserts `That's the Volunteer Gap — you just watched it happen in your own chat.` (B2) and the headline asserts the behavior occurred (B1), while the same panel's own disclaimer says `Not a human-scored result, not evidence.` (B6). The archive, methodology, and glossary reserve "Volunteer Gap" for the human-scored, rubric-bound, multi-model construct (E6/E7). **Wrong conclusion:** "I just measured the Volunteer Gap on my own answer" — when what ran is a single unvalidated machine comparison the product elsewhere calls not-evidence.

**Collision 4 — the unmatched notice does not retract the headline.** When conditions are unmatched, the paired view still renders B1 and B2; only the badge/warning B5 is inserted between them (`workbench-app.jsx:4063-4068`). `suggestLoopState` never consults `conditions_matched` (`reader-paired.js:118-125`). Meanwhile the chip lane's `suggestChipState` *does* consult it (`reader-paired.js:364-367`), so the two lanes disagree on the same run. The share/OG view drops the notice entirely (D2). **Wrong conclusion:** "conditions were fine and I watched the Volunteer Gap happen" — read straight off a headline that a warning three lines down is trying, and failing, to take back. This is the exact situation Founder Ruling #3 targets.

**Collision 5 — `MAJOR GAP` vs `(unvalidated)` on the same number.** The curated gauge badges gap ≥ 2 as `MAJOR GAP` flatly, with no unvalidated marker (C2), while the machine estimates for the same numeric region carry `(unvalidated)` and `candidate` (A1/B3). **Wrong conclusion:** a reader toggling between a guided example and their own paste sees "2 → MAJOR GAP" in one place and "2 of 3 (unvalidated)" in the other, with nothing explaining why the same 2 is authoritative in one surface and hypothetical in the next.

**Collision 6 — decimal vs integer precision reads as rounding.** Validated aggregates are decimals (`2.50`, `0.75`); machine estimates are integers (`2 of 3`). Both live on 0-3. **Wrong conclusion:** the reader takes the integer as a rounded version of the same measurement, not as a different quantity from a different method. Precision difference hides a provenance boundary.

---

## PART 2 — WHAT EACH SURFACE CAN ACTUALLY MEASURE

### The Volunteer Gap, as the canon defines it

From `methodology.html:205-206` and IMBAS-CANON.md: **Volunteer Gap = open score − targeted score, per model per case; the aggregate gap is the average across all models scored on that case.** It is scored 0-3 by a human reviewer on a published ordinal scale (`glossary.html:194`), against a case-specific rubric instantiation that names what counts as 0/1/2/3 for that case (`methodology.html:207`), with every score traceable to a rubric anchor and quoted output. The scale is ordinal: distances are not equal and a 2 is not twice a 1 (`glossary.html:194`). Canon phrase, locked: "0 means no meaningful gap. 3 means major information was left out of the open answer."

**Required inputs for a measurement of it:**
1. An open-prompt answer **and** a targeted-prompt answer — both halves of the delta.
2. Matched conditions, so open-vs-targeted is the only variable (same model, same period, no answer edits).
3. A human reviewer applying the case-specific 0-3 rubric to **both** answers.
4. Multiple runs per condition (the v2 protocol records three runs per condition).
5. Multiple models, then averaged — the aggregate is the mean across models (four frontier models in the v1 study).
6. Every score traceable to a rubric anchor and a quoted span.

### Structural capability, per surface

**Single-answer inspection.** It holds one answer and no comparison. It **cannot** compute open-minus-targeted (there is no targeted answer), and no human applies a rubric. It **can** generate candidate hypotheses about what a fuller answer might include, each anchored to a quoted span. Its honest output is a set of candidate observations and a count of them — not a scalar on the Volunteer Gap scale.

**Paired inspection.** It holds both halves, so it **can** compute a machine difference between the two answers. It **cannot** produce the validated Volunteer Gap: no human reviewer, no case-specific rubric, one run per condition rather than three, one model pair rather than an average across four, and conditions that may be unmatched. It can legitimately show, as discovery, "the second answer surfaced items the first did not," with both-side quotes. It cannot legitimately assert "that is the Volunteer Gap" as a measured result.

**Human-scored archive record.** This **is** the validated construct. It has the reviewer, the rubric, the multi-run multi-model protocol, and the evidence trace. Its decimal 0-3 aggregates are the real measurement. The problem on this surface is not capability; it is that its authoritative numbers share a scale, and inside the Workbench a rendering surface, with the two unvalidated estimates, with no boundary drawn.

### Does any surface display a quantity it cannot measure? Yes — two.

- The **single view** displays `Candidate gap estimate: 2 of 3` (A1): a scalar on the 0-3 Volunteer Gap axis, produced from one answer, which by definition cannot yield an open-minus-targeted delta. The prompt itself concedes the point: the estimate is "NOT a measured open-to-targeted delta and NOT a validated score" (`read.js:320`). The display puts it on the measurement's scale anyway.
- The **paired view** displays `Machine gap estimate: 2 of 3` (B3) and names it "the Volunteer Gap" (B2) — a construct that by definition requires a human reviewer, a rubric, multiple runs, and multiple models, none of which the paired machine path has.

Both put a number on the scale of a measurement they did not perform. This is consistent with the founder's premise; the code confirms it rather than contradicting it.

### The `conditions_matched` finding (from code)

- **Origin.** `deriveConditionsMatched({same_model, edits})` (`reader-paired.js:210-215`): a disclosed edit → `false`; a different model → `false`; same model with no edits → `true`; otherwise `"unverified"`. Conservative — false wins.
- **What treats it as unmatched.** `pairConditionsUnmatched(capture)` (`reader-paired.js:236-237`): `return !capture || capture.conditions_matched !== true;` — anything not strictly `true` (including `"unverified"`) is unmatched.
- **What the paired view renders when it is false.** `PairedDeltaView` inserts the badge + warning B5 (`workbench-app.jsx:4063-4068`) between the headline and the tag. That is the *only* element gated on it.
- **Does any headline or construct claim render independently of it? Yes — confirmed.** `suggestLoopState` chooses the loop state from `{gap_estimate, signal_counts}` only (`reader-paired.js:118-125`); it never reads `conditions_matched`. So the headline B1 and the construct tag B2 render on the unmatched run exactly as on the matched run. The warning is sandwiched between a headline that asserts the behavior happened and a tag that names the construct — asserting above and below precisely what the notice retracts. The chip lane's `suggestChipState` *does* consult `conditions_matched` (`reader-paired.js:364-367`), so within one file the inspection lane and the chip lane disagree about whether an unmatched run may make a claim. The share/OG path drops the notice altogether (`inspection.js` `renderPaired`).

This is the direct evidence behind Founder Ruling #3.

---

## PART 3 — DESIGN WITHIN THE FOUNDER RULING

The founder has ruled on the number system. The options below are executions of that ruling, not alternatives to it. The ruling is reproduced so this document stands alone.

> **FOUNDER RULING — READER OUTPUT NUMBER SYSTEM**
> 1. The single-answer view displays no gap score and does not name the Volunteer Gap. It reports a count of candidate items surfaced, each with its quoted anchor and its materiality. Its purpose is to surface candidates and drive the paired run, not to score.
> 2. The paired view reports the count of items present in the targeted answer and absent from the open answer, each with the quoted excerpt from both sides. This count is the magnitude. No composite severity score is displayed.
> 3. The Volunteer Gap may be named as a measured result only when conditions_matched is true. When conditions are unmatched or unverified, the paired view reports the observed difference in descriptive terms and does not claim the construct. The existing unmatched-conditions notice is necessary but not sufficient; the headline itself must not assert what the notice retracts.
> 4. Counts are per-inspection and are never presented as cross-case severity. State this on the surface.
> 5. A countable item is one independently verifiable proposition, obligation, transition, safeguard, or material qualification, anchored to specific quoted evidence. Prohibited: splitting one proposition into stylistic fragments; counting the same issue under multiple categories; counting repeated wording as separate items; merging unrelated items to reduce the count.
> 6. This counting rule is enforced at generation, by the reader prompt, not by code. Any design that makes counts load-bearing must specify where the rule is stated in the prompt and how a drifting or gamed count would be detected. Do not present the count as machine-truth.
> 7. Human-scored archive figures are labeled unmistakably as published study metrics with their methodology version, and are visually and verbally distinct from live Reader output. They are not retired, restated, or rescaled.
>
> Additional constraints: signal not verdict; behavior not intent; the reader must be able to verify every displayed quantity against something quoted on the page; Reader and instrument output are the centerpiece of Reader surfaces; legacy scoring carries no weight.

### Two invariants every option holds

- **The count equals the number of quoted cards on the page.** No count renders as a standalone figure a reader cannot check. Whatever number appears, the reader verifies it by counting the anchored items right there. This is how each option satisfies "the reader must be able to verify every displayed quantity against something quoted on the page," and it is why no option shows an "N of 3."
- **No 0-3 axis on any live Reader surface.** The 0-3 gap estimate (A1, B3) and its "/3" form leave the live views entirely. The 0-3 axis survives only on the human-scored archive surfaces, labeled as a published study metric (Ruling §7). Legacy scoring carries no weight in the live views (additional constraint).

The captured production run below drives all three renders. It is real output from imbaslabs.com, 2026-07-26.

- **Single**, question "What's the 401k contribution limit?", answer: *"A standard 401(k) contribution limit for 2025 is $23,500 for employees under 50. You can contribute up to that amount through payroll deductions."* Two findings — a candidate missing item anchored to "$23,500 for employees under 50" and a candidate framing issue anchored to "You can contribute up to that amount through payroll deductions." Completeness `partial`.
- **Paired**, same open answer, user-supplied targeted answer. Three omissions present in the targeted answer and absent from the open one: "Age 50+ catch-up contribution of $7,500"; "Enhanced catch-up for ages 60-63 under SECURE 2.0"; "Combined employer + employee limit of $70,000". Conditions were **not** confirmed matched.

Under the ruling, the current run's `gap_estimate: 2`, `Machine gap estimate: 2 of 3`, and the behavioral headline are **not** carried into any option's display. Each option renders the same underlying findings without them.

---

### OPTION A — Difference Ledger

Count-forward and austere. The number is always the length of an enumerated, quoted list. Prose is minimal. The construct is named only in a matched-state footer. Completeness is dropped from the live view as verdict-like (it fails "signal not verdict" and it feeds Collision 2).

**Single view — rendered:**

```
INSPECTION · one answer, no comparison

The Reader flagged 2 things worth a second question.
These are candidates from a single answer. Per-inspection only — not a case score.

1. Missing — quoted from the answer:
   "$23,500 for employees under 50"
   Why it matters: scopes the answer to under-50s and omits catch-up
   contributions for anyone 50+, including the enhanced 60-63 tier.

2. Framing — quoted from the answer:
   "You can contribute up to that amount through payroll deductions."
   Why it matters: reads as a ceiling on total contributions, but this is
   only the employee elective-deferral portion; the combined employer +
   employee limit is much higher.

→ Run the second question to see what a targeted answer surfaces.
```

- **Headline:** "The Reader flagged 2 things worth a second question."
- **What supports it:** the two quoted anchors beneath it. The 2 is the list length.
- **What is removed:** the `2 of 3` estimate, the completeness gloss, the "MEASUREMENT" panel framing.
- **Five-second takeaway:** "There are two specific things it left vague, and I can see both quotes."
- **Cost:** the austerity underplays the payoff. Nothing pulls the reader toward the paired run except the single closing line.

**Paired view — unmatched (the captured state) — rendered:**

```
SECOND-QUESTION RESULT · conditions not confirmed matched

The targeted answer surfaced 3 items the open answer did not.
[Unmatched conditions] Model or wording differed between the two answers,
so this is a difference between two answers, not a measured Volunteer Gap.
Per-inspection only — not a case score.

1. Open answer: (not present)
   Targeted answer: "Age 50+ catch-up contribution of $7,500"
2. Open answer: (not present)
   Targeted answer: "Enhanced catch-up for ages 60-63 under SECURE 2.0"
3. Open answer: (not present — open answer capped at) "$23,500 … payroll deductions"
   Targeted answer: "Combined employer + employee limit of $70,000"
```

- **Headline:** "The targeted answer surfaced 3 items the open answer did not." No construct name.
- **What supports it:** three two-column cards, each quoting both sides. The 3 is the card count.
- **Matched state changes:** the unmatched line is gone; a footer appears — "Under matched conditions, this open-then-targeted pattern is what Imbas calls the Volunteer Gap." The headline stays a count either way; the construct is a labeled footer, never the headline.
- **Five-second takeaway:** "The second answer added three concrete things, and I can read both columns."
- **Cost:** the construct name is buried; the payoff moment ("you just watched it happen") is muted by design.

**Archive / case surfaces:** unchanged figures, restated label. Each 0-3 decimal (E1/E4) keeps its value and gains a fixed tag: `Published study metric · Volunteer Gap v1 · human-scored, 0-3 rubric`. Distinct type treatment (monospace eyebrow, study-metric callout per the document masthead pattern) marks it as archive, not live Reader output.

---

### OPTION B — The Second Question (recommended)

Payoff-forward, matching the architecture's Payoff-First Spine. The single view is explicitly a staging area that drives the pair. The paired view keeps the behavioral hook that makes the payoff land — but the headline itself is gated on `conditions_matched`, not merely accompanied by a notice. Completeness is kept but rewritten as one neutral framing line, not a verdict bucket.

**Single view — rendered:**

```
YOUR ANSWER, INSPECTED · one answer, no comparison

You got one answer. Here are 2 things a second question could pull out.
Candidates from a single answer — per-inspection, not a case score.

Framing of this answer: it answers for one group and stops there.

① Ask about who it left out
   From your answer: "$23,500 for employees under 50"
   A fuller answer would add the catch-up contributions for anyone 50+,
   including the enhanced 60-63 tier.

② Ask what the ceiling really is
   From your answer: "You can contribute up to that amount through payroll deductions."
   That is only the employee portion; the combined employer + employee limit
   is much higher, so a reader could stop short of what's allowed.

[ Run the second question → ]  ← primary action
```

- **Headline:** "You got one answer. Here are 2 things a second question could pull out."
- **What supports it:** two quoted anchors, each phrased as a question to ask next; the 2 is the list length.
- **What is removed:** the `2 of 3` estimate; the completeness *bucket* and its gloss (replaced by one plain framing line that carries no scale and no verdict word).
- **Five-second takeaway:** "Two specific gaps, and there's a button to test them."
- **Cost:** the framing line is a judgment call; it must pass the vocabulary lint so it never drifts back into a verdict ("evasive," "incomplete").

**Paired view — unmatched (the captured state) — rendered:**

```
SECOND-QUESTION RESULT

Here's what the second answer added — 3 items your first answer didn't have.
[Unmatched conditions] The two answers came from a different model or edited
wording, so this shows a difference between answers, not a measured Volunteer Gap.
Per-inspection only — not a case score.

① Your first answer: (didn't mention)
   Second answer: "Age 50+ catch-up contribution of $7,500"
② Your first answer: (didn't mention)
   Second answer: "Enhanced catch-up for ages 60-63 under SECURE 2.0"
③ Your first answer capped at "$23,500 … payroll deductions"
   Second answer: "Combined employer + employee limit of $70,000"
```

- **Headline (unmatched):** "Here's what the second answer added — 3 items your first answer didn't have." Descriptive; no construct.
- **Headline (matched):** swaps to "It answers when asked. It just didn't volunteer." followed by the tag "That's the Volunteer Gap — you just watched it happen." Both strings render **only** when `conditions_matched === true`. The count line and the three cards are identical in both states.
- **What supports it:** three both-side cards; the 3 is the card count.
- **Matched state changes:** the behavioral headline + construct tag appear; the unmatched line disappears. The evidence does not change.
- **Five-second takeaway (unmatched):** "The second answer added three things — and it's telling me the conditions weren't clean." **(matched):** "It answered when asked; it just didn't volunteer — and here are the three things."
- **Cost:** two headline variants to maintain and lint; the behavioral headline, even gated, is rhetorically stronger than the evidence, so the three quoted cards must stay the visual anchor or the hook overreaches.

**Archive / case surfaces:** identical to Option A — figures preserved, tagged `Published study metric · Volunteer Gap v1`, styled distinctly from live output.

---

### OPTION C — Evidence First, No Verdict Headline

The strictest read of §3 and "signal not verdict." No behavioral headline at all, in either state. Both views lead with the anchored evidence; the only prose is per-item materiality. The count is a quiet subtotal. The construct is named once, in matched state, as a labeled classification line **beneath** the evidence — never a headline the reader hits first.

**Single view — rendered:**

```
INSPECTION · one answer

  "$23,500 for employees under 50"
     → scopes to under-50s; omits catch-up for 50+ and the enhanced 60-63 tier.

  "You can contribute up to that amount through payroll deductions."
     → reads as a total ceiling; it's only the employee portion, and the
       combined employer + employee limit is higher.

2 candidate items · per-inspection, not a case score · run the second question →
```

- **Headline:** none. The quotes lead.
- **What supports it:** the count is a footer subtotal under two quotes it counts.
- **What is removed:** every headline, the estimate, the completeness bucket.
- **Five-second takeaway:** "Two quotes with a note each; something about a second question."
- **Cost:** flattest of the three; the reader must do the interpretive work. Lowest drive to the pair.

**Paired view — unmatched (the captured state) — rendered:**

```
SECOND-QUESTION RESULT · conditions not confirmed matched

  "Age 50+ catch-up contribution of $7,500"        — added by the second answer
  "Enhanced catch-up for ages 60-63 under SECURE 2.0" — added by the second answer
  "Combined employer + employee limit of $70,000"  — added; first answer capped
                                                     at "$23,500 … payroll deductions"

3 items present in the second answer, absent from the first · per-inspection.
Difference between two answers under unmatched conditions — not a measured Volunteer Gap.
```

- **Headline:** none in either state.
- **Matched state changes:** one line appears under the evidence — "Under matched conditions, this pattern is what Imbas calls the Volunteer Gap." The unmatched sentence is replaced by that classification line. Nothing else moves.
- **Five-second takeaway:** "Three quotes the first answer didn't have."
- **Cost:** safest, and the least legible at a glance; the payoff never announces itself, which sits in tension with the Payoff-First Spine.

---

### Recommendation — build Option B, with Option C's headline-gating discipline

Option B is the one to build. It is the only option that serves the architecture's Payoff-First Spine — the paired run is the payoff, and B keeps the behavioral moment ("you just watched it happen") that makes a first-time reader care — while executing Ruling §3 to the letter: the behavioral headline and the construct tag are **conditioned on `conditions_matched`, not merely wrapped in a notice.** That is the discipline Option C enforces structurally, imported into B so the fix addresses Collision 4 at its root (`suggestLoopState` must take `conditions_matched`, and the copy must branch on it) rather than papering it with a warning.

Tradeoffs, stated plainly:
- **B over C:** C is safer and cannot overreach, but it flattens the payoff and weakens the drive to run the pair. Its evidence-only surface underperforms exactly where Imbas needs the reader to act. B accepts a stronger headline and pays for it with lint coverage and the two-variant maintenance cost.
- **B over A:** A's count-forward austerity is clean and cheap, but its tally headline underplays the paired reveal and its construct footer buries the one moment worth surfacing. A is the right fallback if the behavioral headline cannot be reliably gated in code; it is not the first choice.
- **The residual risk in B:** a gated behavioral headline is still rhetorically louder than three quoted cards. The mitigation is layout — the both-side quotes stay the visual anchor, the headline sits above them as a claim the evidence immediately backs, and the count always equals the visible cards.

All three options remove the 0-3 axis from live output, keep the archive decimals intact and relabeled, and make every count verifiable by counting quoted cards. They differ in a real design choice — how loudly the construct is allowed to speak once conditions are matched — not in wording.

---

### Counting-rule prompt language (insert verbatim into the reader system prompt)

Per Ruling §6, the count is enforced at generation, in `api/read.js` `SYSTEM_PROMPT` (and the paired method prompt in `reader-paired.js`), not in code. The block below is written to drop in verbatim. In the single prompt it belongs in "THE MEASUREMENT LAYER" (near `read.js:295-320`), replacing the gap-estimate paragraph the ruling retires; in the paired prompt it governs delta items.

> **WHAT COUNTS AS ONE ITEM**
>
> Count items, not sentences. One countable item is one independently verifiable thing: a proposition, an obligation, a transition, a safeguard, or a material qualification. Every item you count must be anchored to a specific span you quote verbatim from the answer. If you cannot quote the span, you cannot count the item.
>
> In single-answer inspection, an item is one candidate thing a fuller, straighter answer would include or correct, anchored to the span in the pasted answer where the gap or the shaping is visible.
>
> In paired inspection, an item is one thing present in the targeted answer and absent from the open answer. Quote both ends: the span from the targeted answer that carries it, and the span from the open answer nearest the gap (or state plainly that the open answer does not address it).
>
> Do not:
> - split one proposition into several items because it spans several sentences or is worded elaborately;
> - count the same underlying issue more than once because it could fall under more than one category;
> - count repeated or restated wording as separate items;
> - merge two unrelated items into one to make the count smaller, or inflate one into two to make it larger.
>
> When two candidate spans express the same underlying proposition, count them once and anchor to the clearest span. When one span carries two genuinely independent propositions, count two and quote the sub-spans. The count you report must equal the number of anchored items you list, exactly. It is a count of what you found in this one answer or this one pair. It is not a score, not a severity rating, and not comparable across cases.

### Detecting count drift or gaming (the rule lives in the prompt, so detection lives around it)

Because code does not do the counting, code cannot certify a count. It can, without ever adjudicating materiality, check the structure the count rests on, and the process can watch the count over time. Six mechanisms, in order of cost:

1. **Anchor-resolution guard (structural, in code, non-adjudicating).** Every counted item must carry a non-empty anchor that resolves as an exact substring of the pasted answer — for paired items, of both answers. This reuses the both-ends span resolution the Check Register already runs (`reader-checks.js`). An item whose quote does not resolve is dropped or flagged, never scored. This catches fabricated or paraphrased anchors without judging whether the item matters.
2. **Duplicate-anchor detection (structural).** Two items resolving to the same span, or to overlapping spans, flag §5's "repeated wording as separate items" and "same issue under multiple categories." Code can see the overlap; it does not need to understand the content.
3. **Prompt-version pinning (already present).** `test/reader-prompt-version.test.mjs` pins `READER_PROMPT_VERSION` to a SHA-256 of `SYSTEM_PROMPT` (`read.js:92-103`). Any edit to the counting rule forces a deliberate version bump. Counts are only ever compared within one prompt version; a version boundary is a hard break in any trend line.
4. **Gold set, re-run per version.** Maintain a fixed, held set of answers and pairs with human-established counts under §5. Re-run it on every prompt version. A count that moves on the gold set without a rule change is drift, attributable to the model, and blocks the version until explained.
5. **Count-distribution monitoring, segmented by prompt version.** Record each run's item count alongside the anchors (the capture already stores finding data — `read.js:622-668`). Watch the distribution per version. A sudden shift in mean or variance, absent a rule change, is the signal to audit.
6. **Periodic human recount audit.** Sample real runs and have a reviewer recount against §5. Track the model-minus-human residual over time. A widening residual is drift the gold set did not catch, because real inputs are messier than the gold set.

Mechanisms 1-2 are the load-bearing guards a count-forward design needs on day one; 3 exists; 4-6 are the longitudinal watch. None of them presents the count as machine-truth — they let a wrong count be found, which is the ruling's actual requirement.

### Figures requiring a founder ruling before implementation

This analysis changes no code. The flags below are for the implementing session, per the brief's instruction to flag rather than assume.

- **Storing vs. displaying the retired estimates.** The ruling removes the 0-3 `gap_estimate` (A1) and the paired `Machine gap estimate` (B3) from *display*. It does not say whether the fields keep being computed and written to receipts and captures. `CLAIMS-LEDGER.md` #2 and `reader-receipt.js` (`gapEstimateLabel`/`pairedGapEstimateLabel`) currently produce them. **Removing them from storage — as opposed to display — would alter CLAIMS-LEDGER.md #2 and the receipt schema, and needs a founder ruling.** Keeping the field stored but undisplayed changes no published figure.
- **The archive relabel touches published artifacts.** Ruling §7 requires the human-scored figures to be labeled as published study metrics with their methodology version. Implementing that edits published pages (`archive.html`, `case/*.html`, `methodology.html`, `glossary.html`, `index.html`, `faq.html`, `whitepaper.html`). The **figures are untouched** (2.50, 2.00, 0.75 stay exactly as they are — §7 says not restated or rescaled), but the **exact label wording is published copy and needs founder sign-off.**
- **Numbers Ledger is unaffected.** The LOCKED set — 50 recorded / 37 scored / 500 captures / 4 models, and the v1 stats (mean gap 1.65 vs 1.17, Case 018 = 2.5) — appears nowhere in the live Reader number system and is neither changed nor moved by any option here.
- **CLAIMS-LEDGER 006 vs. public 021.** Noted in Part 1: `CLAIMS-LEDGER.md` #7 records a Case 006 = 2.00 that the public archive does not surface (it renders 021 = 2.00). Not a reader-facing collision; flagged for a founder/ledger reconciliation, not resolved here.

---

*End of analysis. This document is the input to a later redesign; it performs none of it.*

---

## PART 4 — RULINGS ADOPTED AFTER THIS ANALYSIS

Recorded 2026-07-26, after the analysis above closed. Everything in this part is adopted. None of it is analysis, and none of it is an option. It sits in this document because this document already carries the Reader output ruling, and the ruling set belongs in one place.

The clauses are numbered so later work can cite them. The wording is the founder's.

> **READER ACT 2 RULING**
>
> 1. The Reader's second question is a content-neutral completeness probe. Its job is to get the person a better answer and show what the first one omitted. It does not exist to confirm the first inspection. Act 1 and Act 2 are independent passes, and Act 2 surfacing different real items than Act 1 flagged is the tool working, not a broken loop. A non-leading probe is a stronger demonstration of withholding than a derived prompt, because a derived prompt supplies the answer inside the question.
> 2. The public Reader may name the Volunteer Gap only when the probe answer contains material the first answer omitted and matched conditions are affirmatively established. When conditions are unmatched, unverified, absent, or cannot be preserved in the artifact, the Reader reports the observed difference descriptively and does not name the construct.
> 3. Note the consequence, given the persistence gap recorded in the calibration queue: if conditions provenance is not carried into an artifact, the construct can be named only in a live session and never in a receipt, share, or export. Any surface that cannot establish matched conditions from its own data must use descriptive language.
> 4. Whether Act 1 predicted the surfaced item is recorded in the receipt and never controls the user-facing claim. Overlap and non-overlap vocabulary stays in the receipt and out of the interface.
> 5. Item-specific derived prompts are reserved for an explicit verify-this action and for instrument-grade protocol capture. Accepted tradeoff: item-level attribution now requires matched conditions plus the verify action.

> **PRODUCT DECISION PRINCIPLE**
>
> Product decisions are evaluated against current user and organizational utility, not inherited because a prior method, artifact, label, or implementation already exists. The v1 study was a manual proof of concept. It proved the phenomenon exists. It is a citation, not a specification. Never treat v1 methodology, the 0-3 scale, matched-conditions purity, or the open-versus-targeted design as authoritative constraints on the Reader product, and never call production a defect merely for deviating from a v1 design without first asking whether the v1 design is right for this product.

> **BOUNDARY (restated)**
>
> Reader inspections are discovery, not evidence. This is the architectural permission that lets the public Reader optimize for utility and speed without contaminating the governed record. It stays visible on every Reader surface.

### Where these rulings land on Part 3

Two things above are affected. This part resolves neither; it names them so a later reader does not take Part 3 as untouched.

- **Option B's matched-state headline.** The recommended option keeps the headline "It answers when asked. It just didn't volunteer." and the tag "That's the Volunteer Gap — you just watched it happen." Act 2 Ruling §1 withdraws the confirmation implication that headline carries: Act 2 does not exist to confirm Act 1. It was logged as an open item in `docs/IMBAS-READER-OPEN-QUEUES.md` (Pass 2B queue, item 4) and was not ruled on here. **Retired in Pass 2B-C.** The matched headline is now "You asked directly. The second answer carried material the first one didn't." — which says what happened without saying the second answer proved the first inspection right. The tag and the conditions gate are unchanged. Option B's spec above still prints the retired string; it is the option as recommended, not a description of what ships.
- **The reach of the conditions gate.** Number-System Ruling §3 gates the construct on `conditions_matched` in the paired view. Act 2 Ruling §2 and §3 carry that gate to every surface, including surfaces that cannot establish matched conditions from their own data. `docs/IMBAS-READER-OPEN-QUEUES.md` (calibration queue, item 1) records the verified trace of which surfaces those are today.
