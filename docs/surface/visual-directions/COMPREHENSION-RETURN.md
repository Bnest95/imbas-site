# COMPREHENSION RETURN — B, the production chassis

One pass, constrained optimization. Glance → Read → Inspect made compositional in B.
Repository untouched.

**This document is the acceptance floor for the production composition build.** The table
in §2 is final: it reflects the recast copy of 2026-08-10 and the ruled entry density, and
every number in it was re-measured after both. §7 records the rulings it freezes on.

---

## 1 · The number you asked about first

> "Total count of distinct explanatory blocks a reader passes before reaching their
> answer. That last number is the one I care most about. It is currently twelve on the
> desktop opening state. Report what it becomes."

**Twelve becomes three.** Fourteen forwarded becomes seven.

The metric reproduces your twelve exactly on the pre-pass build, which is how I know it
is measuring the thing you counted and not a neighbouring thing.

| arrival | before | after |
| --- | --- | --- |
| 1440 · as it opens | 12 | **3** |
| 1440 · forwarded cold | 14 | **7** |
| 390 · as it opens | 12 | **3** |
| 390 · forwarded cold | 14 | **7** |

Identical on both records measured. The count is structural, not record-dependent.

**The three a runner passes,** in order, and that is the whole list. Strings are
montana's:

1. `Z1.4` the finding sentence
2. `Z2.1` the count — `1 mark on this record`
3. the disclosure summary line — `What this record is, where its marks are anchored, and how to read the count`

**The seven a cold reader passes:**

1. `Z7.4` the forwarded line, now one rendered block instead of three
2. `Z1.1` the class label — `GOVERNED PUBLIC EXAMPLE`
3. `Z1.2` the context line — `Public example · Montana employment law`
4. `Z1.4` the finding sentence
5. `Z2.1` the count
6. `Z2.3` the orientation — the line that teaches what a mark is
7. the disclosure summary line

That is your ruling read back as markup. RUNNER GLANCE is the finding sentence and the
count. COLD GLANCE is compact identity and scope, then the finding sentence and the
count. Nothing else competes with those elements in either arrival.

---

## 2 · Before / after, measured

B only. Both records that carry a full mark set, both viewports, both arrivals.
Same instrument as S6 for claim-to-proof. Pixels are CSS px from page top.

| state | blocks | finding px | answer px | first mark px | answer's first line in first screen | claim→proof px | screens |
| --- | --- | --- | --- | --- | --- | --- | --- |
| montana 1440 as it opens | 12 → **3** | 106 → **22** | 509 → **386** | 975 → **852** | yes → yes | 404 → **364** | 0.40 → **0.36** |
| montana 1440 forwarded cold | 14 → **7** | 151 → **97** | 552 → **493** | 1018 → **959** | yes → yes | 400 → **397** | 0.40 → 0.40 |
| montana 390 as it opens | 12 → **3** | 154 → **23** | 855 → **402** | 1459 → **1007** | **no → yes** | 700 → **379** | 0.83 → **0.45** |
| montana 390 forwarded cold | 14 → **7** | 298 → **180** | 972 → **612** | 1577 → **1217** | **no → yes** | 675 → **433** | 0.80 → **0.51** |
| deposit 1440 as it opens | 12 → **3** | 77 → **22** | 539 → **426** | 654 → **541** | yes → yes | 461 → **404** | 0.46 → **0.40** |
| deposit 1440 forwarded cold | 14 → **7** | 123 → **97** | 584 → **533** | 699 → **648** | yes → yes | 461 → **437** | 0.46 → **0.44** |
| deposit 390 as it opens | 12 → **3** | 130 → **23** | 860 → **430** | 1289 → **858** | **no → yes** | 730 → **407** | 0.86 → **0.48** |
| deposit 390 forwarded cold | 14 → **7** | 274 → **204** | 978 → **664** | 1407 → **1093** | **no → yes** | 704 → **460** | 0.83 → **0.55** |

Every number moved the right way and none moved the wrong way.

**Four states flipped from no to yes.** All four are 390. Before this pass, a phone
reader never saw a character of their own answer on the first screen in any arrival.
Now all eight measured states put the answer's first line in the first screen.

**Claim-to-proof did not regress anywhere**, which was the property the ruling picked B
for. It improved in seven of eight and held flat in the eighth. The worst case across
all eight is 0.55 screens.

### The re-measure after the recast, and the two rows it moved

The table above is the re-measured one. Recasting `FIRST_RUN_LINE` (§7 ruling 4) made the
line 28 characters shorter, and the brief said that if wrap moved a number the new number
stands. It moved two.

| row | answer px | first mark px | claim→proof | screens |
| --- | --- | --- | --- | --- |
| montana 390 forwarded cold | 633 → **612** | 1238 → **1217** | 454 → **433** | 0.54 → **0.51** |
| deposit 390 forwarded cold | 685 → **664** | 1114 → **1093** | 481 → **460** | 0.57 → **0.55** |

**The other six states did not move at all** — every column identical, including all four
"as it opens" rows and both 1440 forwarded rows.

The mechanism is measured, not inferred. `Z2.3`'s own box, montana forwarded, with the
pre-recast string swapped back in on a live render:

- **1440** — line-height 20.925, recast 20.92px, pre-recast 20.92px. **0.00px.** Both
  strings fit on one line, so nothing can move.
- **390** — recast 41.84px, pre-recast 62.77px. **−20.92px, exactly 1.00 line.**

One line of wrap at 390, and −21px is what the two rows show. `finding px` holds at 180
and 204 because `Z2.3` sits below `Z1.4`; everything below it moves and nothing above it
does. Block counts are unchanged at 3 and 7 — a shorter line is still one block.
`build/wrap-probe.mjs` reproduces it.

### The forwarded path, which you flagged as the sensitive one

The forwarding orientation is now compact rather than removed. Same three strings, same
link, set as one running line instead of a flex strip that wrapped.

Measured height of `.b-fwd` itself, montana forwarded:

- 1440: **45.38px → 38.55px**, and three rendered blocks → one.
- 390: **143.5px → 99.92px**, and three rendered blocks → one.

The strip is the smaller half of the improvement, and it is worth saying so plainly. At
1440 the finding moved 151 → 97, of which the strip contributed 7px and `Z1.3` moving to
INSPECT contributed the rest. At 390 the finding moved 298 → 180, of which the strip
contributed 44px. Compacting the banner was necessary — a cold reader should not spend a
sixth of a phone screen on forwarding prose — but what actually served the cold reader
was taking the instrument's self-description out from between them and their answer.

The cold reader still gets the complete record with full annotation per S1. `Back to the
entry` is still there. The reader who cannot dismiss the orientation still cannot dismiss
it, by the pre-existing rule `html[data-forwarded="true"] .b-dismiss { display: none }`
in `b/b.css` — and I checked that this was intentional and not something this pass broke.

**The cold reader pays four blocks more than the runner, and that is deliberate.** Two of
them are identity, two are orientation and the summary. I did not optimise them away,
because the person with the least context is the person the ruling says must not be
served last.

---

## 3 · What moved to INSPECT, and why each move is safe

Nothing left the record. Every zone renders in full where it lands, one keystroke away,
inside a native `<details>`/`<summary>` — real focus, real role, announced expanded
state, Enter and Space, no script.

| zone | what it is | why the move is safe |
| --- | --- | --- |
| `Z1.3` | read date, inspected, condition | Three address rows about the run. A runner performed the run. A cold reader needs to know *what kind of thing* this is before they need to know *when it was read*. It is provenance, not identity, and provenance is what INSPECT is for. |
| `Z1.5` | the scope boundary | Two sentences, 148 characters on montana. It answers what the record establishes and what it does not — the second question, not the first. Setting it above the finding would rebuild the wall. |
| `Z2.2` | the count rule | `The count is the number of marks listed here. Count them.` An instruction for verifying the count, which is only useful once you have decided to verify it. It sits directly beneath the census that lets you. |
| `Z2.4` | the census | Where the marks are anchored. It now *leads* the scope block rather than trailing the count, because inside the disclosure the count has already been read, so the first thing this block adds is anchoring. |
| `Z1.1` `Z1.2` | class label, context line | **Runner only.** The runner knows what they pasted. For a cold reader these two stand in GLANCE as one compact line. Same leaves, same strings, different parent — arrival changes where two leaves sit and nothing else. |
| `Z2.3` | the orientation | **Runner only.** The runner just came from the entry surface and can dismiss it. A cold reader cannot dismiss it, by an existing rule, and a line the record refuses to let a cold reader turn off cannot also be a line the record makes them ask for. So it stands in GLANCE on a forwarded arrival. |
| `Z5.6` detail | per-check outcomes, shared condition, the note, the silence note | The compact state is the heading plus the sanctioned counting sentence itself. Detail below. |

**What did not move:** `Z1.4`, `Z2.1`, `Z3` in full, `Z4` in full, `Z5.3` register
entries in full, `Z6`, `Z7`, and `Z5.6`'s census sentence. Register entries stay rendered
in full rather than collapsed — see §7.

### Z5.6 in compact state, verbatim from the render

```
Checks applied
3 checks ran. 1 produced one or more findings.
+  What each check produced, and the condition it read under
```

The `+` is the disclosure marker — `.b-more-sum::before`, which becomes `−` when open.
The native marker is suppressed. No arrow, no chevron, no motion.

This clears the stop condition you set. The compact state answers "what was checked"
**without a summary or an aggregate**, because the standing line is the sanctioned
counting sentence itself — not a new string written to stand in for the rows. No shorter
sentence was authored. No ratio joined it. No check that produced no finding is called a
pass. The disclosure label names what is inside rather than offering more.

B's placement of Z5.6 is unchanged, because it costs nothing. That was the reference and
it stays the reference.

### The Register

`Z5` opens by saying what was applied, then itemizes. Its compact state at GLANCE is the
finding sentence and the count of marks — those are literally the two blocks a runner
meets. Its full entries are INSPECT, reached by scrolling rather than by disclosure,
because they are the destination and not an aside. The two zones stay distinct: Z5.6
answers what was checked, the Register answers what was found. Neither became a second
wall of system prose.

---

## 4 · The renders

Captured under the governed renderer with the frozen spec, cropped to exactly the fold,
so the numbers in the table and the pixels in the frame are the same event. Full-page
frames for all 72 states are in the standard capture set alongside them.

```
1440×1000  ecae911ee1e82ce3449a6ceeb94ca028df2f35ec5484a37cb9a9d8434a62797f
           screenshots/_glance-b-montana-1440-opens.png
1440×1000  1e83e62b8c2e91f3369cc92a9a5ac7858f40138afb27b01151a440cf32784dce
           screenshots/_glance-b-montana-1440-forwarded.png
 390×844   d909b7cad201a8e825c33a0df40193e169d7f5321ecad4c1061401a3c93c2793
           screenshots/_glance-b-montana-390-opens.png
 390×844   bcf666a6090f1b67ed080e9b5714c1f1e8810d3b0c88c70571e89b918b1717f3
           screenshots/_glance-b-montana-390-forwarded.png
```

**Two of the four moved with the recast, and they are exactly the two that should have.**
`Z2.3` stands in COLD GLANCE on a forwarded arrival and sits in INSPECT on a runner
arrival, so the forwarded pair carries the recast text on the first screen and the runner
pair cannot. The runner frames are byte-identical to their pre-recast hashes —
`ecae911e…` and `d909b7ca…` are the same bytes recorded before the copy changed. The
forwarded pair re-baselines here:

| frame | pre-recast | now |
| --- | --- | --- |
| 1440 forwarded | `9592788a…` | **`1e83e62b…`** |
| 390 forwarded | `54b8ad80…` | **`bcf666a6…`** |

Predicted before it was measured, and the prediction is the check: a change in either
runner frame would have meant the recast reached a surface it has no business on.

Renderer: `Google Chrome for Testing 148.0.7778.96`, resolved from the repository's own
`playwright-core` install and its pinned chromium revision. Nothing installed, nothing
downloaded, no network. Settle conditions unchanged: `load` → `html[data-ready="true"]`
→ `document.fonts.ready` → 900ms. dSF 1, dark, sRGB.

What the four frames show, in one sentence each:

- **1440 opens** — headline, count, one grey summary line, then the question and the
  person's own answer with the mark rail beside it, all above the fold.
- **1440 forwarded** — the 38.55px forwarded line across the top, identity on one line,
  then the same headline and count, the orientation, the summary line, then the answer.
- **390 opens** — headline, count, summary line, then the question and six lines of the
  person's answer, on one phone screen.
- **390 forwarded** — the forwarded line wrapping to four lines, identity, headline,
  count, the orientation on two lines rather than three, summary line, then the answer
  beginning at 612px of an 844px screen.

---

## 5 · The suite, full and green

```
GENERATE      BUILD OK · montana(1) furnace(3) deposit(9) website(5)
              governed strings 21, all byte-identical: true
              connective strings 104
              627 strings linted · 0 violations  (check-vocab.v1, imported from the repo)
HARNESS       a:pass  b:pass  c:pass
              206 checks · 0 failures  (18 grammar assertions, three directions,
                                        four records)
GATE          72 pages · 15 findings   (5 per direction, identical zone-for-zone; all
                                        previously adjudicated record content)
              disclosures_forced_open: 2 on b, 0 on a and c
CONTRAST      59 distinct colour pairs · 0 below threshold
              0 zone/treatment measurements below threshold
ENTRY-FOLD    18 entry screens · 0 with a route past the fold
COPY          194 strings · 0 violations
              connective copy 138 strings · 0 denial shapes
STRESS        18 stress frames · 12 where the first proof sits past the first screen
              b · six frames, first proof in the first screen in all six, 0.37–0.52
              a · six frames, none in the first screen, 1.53–2.16
              c · six frames, none in the first screen, 1.47–2.18
CAPTURE       72 frames · 24 parity rows · 0 mismatches
A/C PARITY    16 states, each rendered twice · 0 that varied between renders
              acceptance vs shared/ac-archive.json  16 match · 0 findings
              history   vs .pre-strata/             0 materially different
```

**The denial-shape count is zero, down from two.** Both were the same string reaching the
inventory twice, and ruling 4 recast it. Nothing was scoped, weakened or exempted to get
there — the repository's own `reader-check-vocab.js` is still imported whole and still
reports 0 violations over 627 generated strings and 194 rendered ones.

### The one guard that changed, and it was tightened

`G17` is scoped to the archived pair, per your ruling, and the ruling is written into
the file as the reason. It now proves that A and C carry the same hash as each other and
that it is the v1 snapshot — so a later pass cannot quietly drag an archived direction
onto the moving document. B reports `n/a`, not `pass`: it is not scored on a check that
no longer describes it and it is not handed a pass for one either. Its own anatomy is
proved by `G15` against the file it names.

**No other guard was relaxed.** Three were strengthened, and each was strengthened
because the strata would otherwise have quietly narrowed what it saw:

- **`gate.mjs` now forces every `<details>` open before it reads a single character.**
  Before, it read only what a reader had already opened, so a string was exempt from the
  gate by sitting inside a closed disclosure. It now sees strictly more than it saw
  before the strata existed.
- **`contrast.mjs` forces every `<details>` open too, and additionally measures the
  disclosure summary, its marker and its focus ring.** Those three belonged to no zone,
  so nothing measured them before. All six new measurements pass: summary text 6.96:1 and
  5.71:1, markers 5.88:1 and 4.82:1, focus rings 5.88:1 and 4.82:1.
- **`comprehension.mjs`'s block walker now tests
  `checkVisibility({ contentVisibilityAuto, opacityProperty, visibilityProperty })`
  instead of asking whether an element has client rects.** Chrome 148 collapses a closed
  disclosure with `content-visibility: hidden`, under which every descendant still
  reports a non-zero rect, so the old test counted blocks nobody could see. It caught a
  real error in my own measurement — §6.

### G18, a new assertion, written because a regression got past every existing one

`G18 · every rendered version handle is this direction's own.`

Amending `ANATOMY.md` to v2 restamped A's and C's `Z7.3` citation footer to
`record-anatomy.v2`, while their `<html>` stamp, their `Z6.3` identity row, `G15` and
`G17` all stayed correct and green. The citation was assembled in `generate.mjs`, which
is per record; the version it names is per direction. I found it by diffing renders by
hand, which is not a check.

Fixed at the source: the fixture now emits `citation_head` and `citation_tail`, and
`kit.js` joins them with the version resolved from the direction that is actually
rendering — the same resolution that stamps the document element. G18 reads every
visible string with every disclosure open and fails on any version handle that is not
this direction's own, stated over the whole known version vocabulary rather than over
the one mistake. `ANATOMY.md` invariant 13 records it.

On A and C, G18 reports `names record-anatomy.v1 in 2 strings` — the identity row and
the citation. The corpus reaches the bug site.

### A and C carry the recast, and the archive was re-baselined to say so

`a/` and `c/` were not edited. But they do not own their renderer — all three directions
draw through `shared/kit.js` and `shared/fixture.mjs`, and this pass edited both. So "we
did not touch a/ or c/" is not the claim that matters.

The recast of `FIRST_RUN_LINE` reached them. It is one governed string that all three
directions render by design, so there is no version of ruling 4 that leaves the archived
pair untouched. **Founder ruling, 2026-08-10: A and C carry it.** Freezing the archive at
the pre-recast text would have preserved a copy-law violation inside the archive and split
a string the anatomy declares shared. The direction ruling is not reopened — this is a
copy correction propagating through a shared layer, not visual work on A or C.

`build/ac-parity.mjs` now runs two legs over both archived directions × four records ×
two viewports. It serialises what a reader could meet and sorts attributes, so parser
order cannot masquerade as a difference.

```
16 A/C states, each rendered twice
  states that did not render identically twice   0

acceptance · against shared/ac-archive.json, re-baselined 2026-08-10
  matches archive                      16
  findings                              0

history · against .pre-strata/, the verbatim pre-pass copy
  byte-identical                        0
  identical but for the added stamp     0
  ...and the ruled FIRST_RUN_LINE recast 16
  materially different                  0
```

**A/C byte-identity is measured against `shared/ac-archive.json` from now on.** Two
sanctioned differences are enumerated in the history leg rather than tolerated: the
additive `data-anatomy-version="record-anatomy.v1"` document-element stamp, and the ruled
recast. Both are matched exactly, so a changed value would still surface as a difference
instead of being absorbed by a loose pattern. Anything beyond those two is a finding in
either leg.

Determinism is checked before the comparison, not assumed by it: every state renders
twice in the same run and the two renders must agree. A render that varied would fail
here, and `--rebaseline` refuses to write an archive when any state varies — otherwise the
archive would freeze whichever outcome happened to come out first.

**`.pre-strata/` was deliberately not edited to absorb the recast.** `comprehension.mjs`
measures B's BEFORE column against that same directory, and the founder's "currently
twelve" is a reading of it. Rewriting the before-snapshot to settle an after-question
would have moved the baseline of the table in §2.

### Three of A's stress rows moved, and half a line of type explains all three

Re-running stress after the recast moved three of A's six rows, all at 390. Two of them
moved the claim **downward** — 201 → 212 and 171 → 182 — which is the wrong direction for
an edit that made a string shorter. I stopped on it rather than write it into the table,
because an unexplained render difference is a stop condition and because an archive must
not be baselined on a render nobody can account for.

It is a real layout consequence, and the source names it. `a/a.css`:

```
.a-mast      { min-height: 100vh; display: flex; flex-direction: column; }
.a-mast-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
```

A's masthead is pinned to the viewport and its body is vertically centred inside it. While
the pin binds, removing a line of text does not shorten the masthead — it enlarges the
free space inside it, and centring splits that space evenly above and below. Every element
in the centred body therefore moves **down by half a line**, and nothing below the masthead
moves at all, because the masthead never changed height. Once content exceeds 100vh the
pin releases, centring has no free space left to split, and the same edit behaves the
ordinary way.

Measured, by swapping the pre-recast string back in on a live render:

| 390 state | masthead | Δ claim | Δ source |
| --- | --- | --- | --- |
| as it opens | pinned → pinned | **+10.84** | 0.00 |
| forwarded cold | free → free | 0.00 | **−21.69** |

A's line box is 21.69px, and half of it is 10.845 — the +11px is half a line, to the
hundredth. At 1440 nothing moved in any row, because the line fits on one line at both
lengths. The mechanism predicts its own sign, its own magnitude and which three rows it
applies to, and all three predictions hold. `build/a-recentre-probe.mjs` reproduces it.

Not nondeterminism: the same 16 A/C states rendered twice in one run and agreed exactly,
which is now a standing precondition of the archive rather than a one-off reassurance.

C did not move at all, at either viewport, in any row.

`ANATOMY.v1.md` is byte-stable at `890405ee90ba55f195672489178a6bb81de48cf0460a530a6576ec926c2c0847`
across the entire pass. `ANATOMY.md` (v2, direction B) is now
`73826c9f94d2ca88c73f42e3b6288b302d021ddc1e136bc877cf789155a645fc`. `HASHES.json` agrees
with both.

---

## 6 · One thing I got wrong, and how measuring caught it

My first AFTER run reported 8 / 13 / 5 / 11 blocks instead of 3 / 7 / 3 / 7. I nearly
reported the recomposition as half the size it is.

The block walker skipped elements with no client rects. That is the obvious visibility
test and it is wrong in Chrome 148: a closed `<details>` is collapsed by skipping its
`::details-content` subtree via `content-visibility: hidden`, not by removing it from
layout. The disclosure's own box measured 34.28px — the summary alone — while every
descendant still reported a real non-zero rect at a plausible coordinate. I was counting
eleven blocks nobody could see.

`checkVisibility({ contentVisibilityAuto, opacityProperty, visibilityProperty })` is the
browser's own answer, and it is not a rule about `<details>`: it returns false for
`display:none`, for a skipped content-visibility subtree, and for `visibility:hidden` and
`opacity:0`. Nothing is excluded merely for being inside a disclosure — the summary line
*is* visible and *is* counted, which is why the runner's three includes it. The strata
cost one block and refund nine; they do not launder ten.

Applied identically to the pre-strata snapshot, where it changes no number: BEFORE
re-ran byte-identical at 12 and 14. Before and after are one metric.

A second one, smaller: the compact forwarded strip was still three blocks after I
swapped its `<p>`s for `<span>`s, because `display: flex` blockifies its children
regardless of their tag. The fix had to be in CSS — drop to normal flow with inline
parts and inline margins, no generated glyph. Cold went 9 → 7.

---

## 7 · The rulings this table freezes on

Four flags from the first return were ruled on 2026-08-10, plus one that the recast forced
and that was ruled after it surfaced. All five are settled and recorded here.

**1 · Scope in COLD GLANCE is `Z1.2`, not `Z1.5`. Ratified.**
`Z1.1` + `Z1.2` stand above the finding; `Z1.5` stays in INSPECT. Built and measured that
way, and the table in §2 is the table for that reading. For the record, `Z1.5` across the
four records is 148 chars / 2 sentences on montana, 126 / 2 on furnace, 94 / 1 on deposit,
84 / 2 on website — between one and three extra lines before the finding had it gone the
other way.

**2 · `Z5.3` register entries stay uncollapsed. Ratified, and no disclosure was built.**
They sit below the answer, the pre-answer path never crosses them, and a second reader
gets the full register at rest. Collapsing them would have cut page height and improved
nothing in §2, because they are the destination rather than an aside.

**3 · The 390 entry density is overview-first. It already was, so nothing was touched.**
The ruling said to check the mechanism rather than guess it, and the check has two halves.

*The lookup.* `shared/kit.js` boots every page from one `DEFAULTS` object at
`density: "consumer"`, with no viewport condition anywhere. Consumer is the overview
state — `fields()` adds rows for `professional` and removes none for `consumer`. So the
default at 390 already was overview-first, and at 1440 too.

*The measurement,* because "it cannot matter" is an argument and the acceptance floor
should freeze on a table known to be density-independent rather than assumed to be.
`build/density-probe.mjs` renders both densities at both viewports on both records and
diffs every column §2 records.

Read this as a differencing instrument, not as §2 restated. Its absolute pixels sit a
little off the table's because it takes container tops where `comprehension.mjs` takes the
source body's first text node, and a container can begin with padding a reader cannot
read. The two instruments are not being compared to each other. What is being compared is
one instrument against itself across two densities, and that comparison is exact:

```
record   view  density       fields  finding  answer  mark   in fold  page
montana  1440  consumer      3       24       366     852    yes      2813
montana  1440  professional  8       24       366     852    yes      3005
deposit  1440  consumer      21      24       406     541    yes      4395
deposit  1440  professional  75      24       406     541    yes      6435
montana   390  consumer      3       24       382     1007   yes      4075
montana   390  professional  8       24       382     1007   yes      4546
deposit   390  consumer      21      24       410     858    yes      7591
deposit   390  professional  75      24       410     858    yes     12269

measured columns that differ across density: 0
```

Density moves page height and the number of visible fields. It moves no measured column,
at either viewport, on either record — density adds fields inside register entries at
`Z5.4`, which sit below the source column and below the first mark, so it cannot reach the
finding, the answer, the first mark or claim-to-proof. The probe counts *visible* fields
rather than DOM nodes; every field renders into the DOM at both densities and the
professional-only rows are hidden in CSS, so counting nodes returns the same number twice
and reads as "density does nothing," which is the opposite of the truth.

The forwarded arrival is not parameterised, because it cannot be: `canonical()` discards
the runner's density on a forwarded record and opens at full annotation per S1. That is a
guarantee rather than a default, so "as it opens" is the only state the ruling can reach.

**4 · The orientation line is recast. Done, and the denial-shape count went 2 → 0.**

> **Before** — *"Each mark points at something in this answer, or at something that isn't
> in it. Imbas records what was there and what wasn't."* (125 chars)
>
> **After** — *"Each mark points at something in this answer, or at something absent from
> it. Imbas records both."* (97 chars)

Under the scope ruling the forwarded strip is record voice, so the standing copy law
governs this line. The two contracted negatives go and nothing else does.

`isn't in it` becomes `absent from it` — a state rather than an expectation. `missing from
it` was rejected: it implies the answer owed the reader that material, which is the
insertion-caret claim under different words. `what was there and what wasn't` becomes
`both`, which refers to the two referents just named and carries the same proposition.
Changing `in this answer` to `this answer carries` was considered and rejected as an edit
the ruling did not ask for.

Every proposition of the original survives. A mark has a referent. That referent may sit
in the answer. It may equally sit outside it. Imbas records either case. What is gone is
the shape, not the meaning.

The string reached the inventory twice — as `ui.z2.orientation` and as `FIRST_RUN_LINE` —
which is why the old count was two rather than one.

**5 · A and C carry the recast, and the archive was re-baselined. Ruled after it
surfaced.**
`FIRST_RUN_LINE` is one governed string all three directions render by design, so the
recast reached the archived pair and `ac-parity` failed against the pre-recast reference.
Ruled: they carry it, because freezing the archive at the pre-recast text would preserve a
copy-law violation and split a string the anatomy declares shared. `shared/ac-archive.json`
was re-baselined to the post-recast render on **2026-08-10**, and A/C byte-identity is
measured against it from now on. Full detail in §5. The direction ruling is not reopened.

---

## 8 · Still open, reported rather than invented

**The main checkout is not empty, and it was not this lane.**
Your brief says to confirm `git status --short` is empty at the main checkout before
starting and again when finishing. It is not, and it was not when I started:

```
 M package-lock.json
 M package.json
HEAD  251759b08d97c9a71c4bf0ab191b4a6410e789c7
tree  0b85a330d5a34614cb7aec58b79cd1a445bebb5f  == index == HEAD^{tree}
```

The diff adds `"playwright-core": "^1.60.0"` to devDependencies. Evidence, not
attribution:

- Both files carry mtime `2026-08-06 17:39:54` local. This lane's first log record is
  `2026-08-07T02:03:04.515Z` — over four hours later.
- A scan of 60 session logs shows a different session running
  `git add DEPLOY.md package.json package-lock.json scripts/qa/visual-acceptance.mjs …`
  at `2026-08-06T22:16:22.406Z`, followed by
  `gh pr create --title "Pin the visual board's renderer to the repository, not to the machine"`.
- This lane's logged Bash calls — **606**, the whole pass, re-counted against the session
  log at the close rather than recalled — contain **zero repository writes**. The scan
  pattern is deliberately broad (`npm install|ci|i`, `git add|commit|checkout|switch|`
  `restore|reset|clean|stash|merge|rebase|push|branch|worktree`, `gh pr|release`, `chmod`,
  `>`, `tee`, `mv`, `cp`, `rm`) and returns 191 hits. Eighteen of those name the main
  checkout, and all eighteen are reads: `git status`, `git rev-parse`, `git write-tree`,
  `git log`, `ls`, `wc`, `grep`, `find`, `shasum`, and node readers over session logs. The
  only one that reaches inside the repository imports its installed `playwright-core`,
  which the brief permits. `npm install` appears solely as a literal string inside the
  grep patterns I used to run this very investigation. Log:
  `~/.claude/projects/-Users-brendan-Documents-Claude-Projects-imbas-site--claude-worktrees-intelligent-newton-adff22/9a92b468-….jsonl`,
  first record `2026-08-07T02:03:04.515Z`.

I did not reset, restore, or discard it. The index equals HEAD's tree, so nothing is
staged. Reporting it as evidence and stopping there.

Re-checked at the close of this pass: identical. Same two files, same HEAD, same tree,
index still equal to `HEAD^{tree}`, nothing staged. Unchanged and still open, and it is
the only open item in this document.

---

## 9 · Stop conditions — one was hit, and it was worked to ground

**The four composition stops held throughout:**

- No zone was removed from the record. Every zone renders in full where it lands, and
  containment and reachability are unchanged. Only immediate visibility moved.
- `Z5.6`'s compact state answers "what was checked" with the sanctioned counting
  sentence and no summary or aggregate.
- Making the forwarding orientation compact cost a cold reader nothing they need: same
  three strings, same return link, same undismissable orientation, same complete
  record with full annotation per S1.
- No score, ratio, percentage, grade, badge or traffic light entered anything. No check
  that produced no finding is called a pass, anywhere, in any state, open or closed —
  the gate now proves that with every disclosure forced open.

**The one that was hit:** three of A's stress rows moved after the recast, two of them in
a direction a shortened string cannot explain. Work stopped there rather than writing the
numbers into the table, because an unexplained render difference is a stop and because an
archive must not be baselined on a render nobody can account for. It is now explained from
source, with a mechanism that predicts its own sign, its own magnitude and which rows it
reaches, and all three predictions hold. **No tolerance, ceiling or bound was introduced
to absorb it** — §5 records exact bytes, as before.

The direction decision was not reopened. The palette was not reopened. The anatomy was
not redesigned. No fourth direction exists. A's Montana headline is verbatim.

A and C are archived and green. They are no longer byte-identical to the pre-pass
snapshot, by the ruling of 2026-08-10 recorded in §7.5: they carry the recast governed
string, and `shared/ac-archive.json` is the reference that says so.

Repository untouched. Delivered, and stopping here.
