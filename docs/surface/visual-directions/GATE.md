# The acceptance gate — 34 checks per direction

Ten research principles from `08 Research Principles.md` and twenty-four anti-patterns
from `03 Anti-Patterns.md`, run against every direction. 102 checks.

Where a check is decidable against the rendered DOM it was decided there, by
`build/gate.mjs` (66 pages, every expandable finding opened first) or by
`build/harness.mjs` (132 grammar assertions). Those results are cited, not restated.
Where a check is a judgement, the judgement is written out and the evidence it rests
on is named. **One check lands short in all three directions and is recorded as such:
AP3.**

Verdicts: **pass** · **partial** — holds in part, gap named · **fail**.

---

## The ten principles

### P1 · The prior must be the user's own

| | verdict | evidence |
|---|---|---|
| A | pass | `build/entry-fold.mjs` — both routes inside the first screen, both viewports |
| B | pass | same |
| C | pass | same |

No direction supplies a specimen answer, a "try this" prompt, or a worked setup for the
reader's own route. The `answer` state is reached by the reader pasting their own text,
and the paste field's only copy is "Paste the answer you want to look at."

All three directions do offer the governed public example from the entry screen, in
every state, through the same three strings and the same link — "Watch it on one
recorded pair" / "Open the public example". That is an offered demonstration, and it is
not a manufactured prior: it is labelled as the public example, it opens a record whose
Z1.1 reads GOVERNED PUBLIC EXAMPLE, and it sits beside the reader's own route rather
than in front of it. P1's failure mode is a page that forms the expectation it then
violates; a separately-labelled recorded pair the reader may choose to open does not do
that.

The brief's own entry rule — neither of the first two states may obscure the other — is
measured rather than asserted. `build/entry-fold.mjs` reports the bounding box of Z8.1
(paste) and Z8.3 (recorded pair) against the first screen for all three directions in
all three states at both viewports: **18 screens, 0 with a governed route past the
fold.** A's stage originally stood at `min-height: 100vh`, which put whichever route sat
below it one pixel past the fold in both the empty and the answer state; the stage now
stops at 74vh and both routes break the first screen. That measurement caught it — the
screenshot alone did not.

In the `shared` state the recorded-pair block falls past the fold for A at both
viewports and for B and C at mobile. The rule names the first two states, and in the
third the arrived record legitimately holds priority, so this is reported rather than
counted short.

The `shared` state is also the one case where the prior is not the reader's own, and all
three directions say so in that state's own copy rather than staging it as a reveal.

### P2 · The source holds the privileged position, unaltered

| | verdict | evidence |
|---|---|---|
| A | pass | G7 pass · Z3.4 is the widest measure on the page |
| B | pass | G7 pass · Z3.4 holds the left column, full height |
| C | pass | G7 pass · Z3.4 is the inset plate, the page's only bordered object |

`G7 source text renders exactly` compares every rendered source character against the
fixture and passes for all three. Marks are drawn in CSS — `content: attr(data-anchor)`,
underlines, grounds, gutter rules — so no mark inserts a character into a source text
node. G5 additionally proves no direction holds a local copy of any record string.

### P3 · Absence is marked at its site, in flat register, under a uniform standard

| | verdict | evidence |
|---|---|---|
| A | pass | G3, G4 pass |
| B | pass | G3, G4 pass |
| C | pass | G3, G4 pass |

`G3 anchor modes use only their authorized channel` and `G4 record-level absence stays
outside the document` are the machine form of this principle. Record-level absence has
no site inside the document, and each direction states that by giving it a channel that
cannot point: A a full-bleed band after the source column closes, B a block below both
columns where the rail has already ended, C a second plate with no gutter.

Flat register is carried by the fixture, not by the directions: every mark has the same
field set, and no field ranks one mark above another.

### P4 · Instance before aggregate

| | verdict | evidence |
|---|---|---|
| A | pass | Z1.4 finding sentence is the first viewport; Z7.2 aggregate is the last zone |
| B | pass | same order |
| C | pass | same order |

The only aggregate on the record is the numbers-ledger line in Z7.2, and in all three
directions it sits in the footer, after the whole record. It carries N in the form the
principle asks for: "500 recorded captures across 4 models on 50 cases, 37 of them
scored."

### P5 · Itemization outranks the score

| | verdict | evidence |
|---|---|---|
| A | pass | no score exists to outrank; AP2 sweep clean |
| B | pass | same |
| C | pass | same |

There is no score, and the gate's numeric-compression pattern (`\d\s?%`, `n/5`, `n/10`)
returns nothing across 66 pages. The count line Z2.1 states a quantity of marks, which
is an itemization header rather than a score: it is the number of things listed below
it, and every one of them is listed.

### P6 · The record belongs to a class with fixed anatomy

| | verdict | evidence |
|---|---|---|
| A | pass | G1 pass across 4 record classes |
| B | pass | G1 pass |
| C | pass | G1 pass |

`ANATOMY.md` fixes zones Z1–Z8. `G1 required zones render` passes for all three
directions on all four record classes — governed public-example packet, user-supplied
run, protocol-measured case, adherence record — at one mark, three, five and nine.
Z1.1 states the class in words on every record.

### P7 · Every claim resolves at zero distance, every unit at a stable address

| | verdict | evidence |
|---|---|---|
| A | pass | Z1.3 address · marks resolve in place |
| B | pass | Z1.3 address · rail entry is level with its block |
| C | pass | Z1.3 address · gutter numeral is adjacent to its line |

Zero distance is met differently by each — A opens the mark under the block it sits in,
B keeps a standing entry level with that block, C sets a numeral in the gutter beside
the line — but in all three the finding and the thing it points at are visible together
without scrolling between them. Stable address is Z1.3: record class, run id, read
date, and per-mark ordinal, present on every record.

### P8 · Scope is stated by the artifact itself, and the artifact refuses the verdict

| | verdict | evidence |
|---|---|---|
| A | pass | Z1.5 scope · Z5.5 register close · G8 lint pass |
| B | pass | same |
| C | pass | same |

Scope is a zone, not a disclaimer: Z1.5 carries the record's own boundary statement and
Z6.2 carries provenance. `G8 rendered strings clear the repository lint` runs the
repository's own `reader-check-vocab.js` unmodified over every rendered string and
returns zero violations, including its world-claim-verdict check.

Scope copy is stated positively throughout. Three provenance strings originally ended
in a denial and were rewritten; see the copy inventory.

### P9 · Independence is displayed practice, not claimed virtue

| | verdict | evidence |
|---|---|---|
| A | pass | Z6 provenance · AP19 sweep clean |
| B | pass | same |
| C | pass | same |

Every record carries a provenance zone naming how its conditions were established and
where its statements were read. The borrowed-authority pattern returns nothing across
66 pages: no seals, no logo wall, no "as seen in", no endorsement claim. Nothing on any
surface asserts that Imbas is independent — the zone shows the practice instead.

### P10 · The record argues at rest, for its second reader

| | verdict | evidence |
|---|---|---|
| A | pass | G11 pass · forwarded state renders complete |
| B | pass | G11 pass |
| C | pass | G11 pass |

`G11 reduced motion changes no rendered evidence` passes for all three: the reduced-motion
render carries the same zones, marks, register entries and text as the ordinary render.
The record's canonical form is its static form. The forwarded-cold state is captured for
all three and adds an arrival zone without removing anything, so a second reader who
never saw the entry screen receives the whole record.

---

## The twenty-four anti-patterns

### AP1 · The verdict dek — **pass** (A, B, C)

The first line of every record is the finding sentence Z1.4, and it states what the
marks point at rather than what the answer is worth: "Nine marks sit on this answer.
Five point at wording it carries, and four at terms it does not." The gate's verdict
lexicon — `wrong`, `false`, `misleading`, `debunked`, `caught`, `exposed`, `lies` —
returns nothing across 66 pages in any direction.

### AP2 · Score compression — **pass** (A, B, C)

No score, percentage, grade or confidence value renders anywhere. One lexicon hit per
direction, reviewed and cleared: `"37 of them scored"` in the Z7.2 numbers-ledger line.
That word reports how many archive cases have been through human scoring — a sample-size
statement of the kind P4 and AP17 both require — and it names no score for the record in
front of the reader. Screened, kept.

### AP3 · Every mark at equal weight — **partial** (A, B, C)

This is the one check all three land short on, and the shortfall is the same in each.

Every in-document mark is drawn at identical visual weight, deliberately, because P3
requires a flat register and AP24 forbids marking selectively where it is dramatic. The
Check Register density control changes the *fields shown per entry*; it does not change
the *number of marks drawn in the document*. On the nine-mark deposit record there is
therefore no reader-controlled way to quiet the mark layer, which is precisely the
Simple Markup affordance Word added to fix this failure in Track Changes (R20).

What each direction does have is a stated shape before the marks: the finding sentence
Z1.4 tells the reader how many marks there are and how they divide, so the reader enters
the mark layer knowing its size. That is a mitigation, not the affordance AP3 asks for.

The resolution is available and unbuilt: a reader-controlled mark-density mode is
compatible with both P3 and AP24, because the reader chooses to collapse rather than the
record choosing which marks to show. Recorded as an open decision.

### AP4 · Chartjunk — **pass** (A, B, C)

No chart, graph, sparkline, meter or gauge exists in any direction. Every element that
carries ink carries a string, a mark address or a structural rule. The palette sweep
returns 45 / 49 / 35 distinct rendered colours for A / B / C, all inside the token
closure, and no colour encodes a magnitude.

### AP5 · The manufactured-alarm reveal — **pass** (A, B, C)

The alarm lexicon — `alarming`, `shocking`, `crisis`, `red flag`, `beware`, `warning:` —
returns nothing across 66 pages. There is no reveal animation, no pulsing, no colour
flood. The palette closure check is the structural guarantee here: an alarm colour ramp
cannot be introduced without a colour outside the umber tokens, and zero off-palette
colours were found in any direction.

### AP6 · Countdown and urgency mechanics — **pass** (A, B, C)

Urgency lexicon returns nothing. No timer, no expiry, no scarcity cue, no counter that
moves.

### AP7 · The cloned-Linear surface — **pass** (A, B, C)

None of the three uses the Linear signature: no sidebar-plus-content shell, no
command-palette affordance, no pill-shaped status chips, no muted-grey neutral ramp with
a single saturated accent on a light ground. The three take their lineage from long-form
investigation (A), the ruled editorial instrument (B), and the docketed legal exhibit (C)
respectively. All three are dark-ground and typographic.

### AP8 · Dashboard default — **pass** (A, B, C)

No KPI card, no chart grid, no tile. The Check Register in all three is a list of
entries in document order, not a metrics panel — C sets it as a ruled ledger, which is
the furthest any direction goes toward tabular form, and it remains one row per mark in
record order rather than a grid of measures.

### AP9 · Chatbot-wrapper framing — **pass** (A, B, C)

Chatbot lexicon returns nothing. The entry field is a paste target with the placeholder
"Paste the answer you want to look at." — the reader supplies text that already exists
rather than composing a message. No send affordance, no thread, no turn-taking, no
avatar, no typing indicator. The record surfaces are documents.

### AP10 · Benchmark-leaderboard framing — **pass** (A, B, C)

Leaderboard lexicon — `rank`, `leaderboard`, `top N`, `#N`, `beats`, `outperforms`,
`versus`, `vs.` — returns nothing across 66 pages. Only the Montana record involves two
artifacts, and they are labelled by role (`original_answer`, `targeted_answer`) rather
than set against each other; no direction places them in a comparison table or scores
one against the other.

### AP11 · Think-tank PDF stasis — **pass** (A, B, C)

Every direction has a working entry screen where the reader's own answer is the input,
and every mark is interactive: `G9 every mark is keyboard reachable and announces state`
passes for all three. There is no cover page and no executive summary.

### AP12 · Decorative futurism — **pass** (A, B, C)

No glow, no particle, no scanline, no terminal-green, no synthetic gradient. Verified
against source: the four ember tokens that carry alpha and read as emitted light —
`--ember-glow`, `--ember-trace`, `--ember-pulse`, `--ember-bloom` — appear in none of
`a.css`, `b.css` or `c.css`. They are inside the allowed palette closure and no
direction reaches for them. Type does the work in all three.

### AP13 · Polish exceeding the record — **pass** (A, B, C)

Each record states what it is: Z6.2 provenance on every one of the four records says the
record is written for visual-direction review and that every field comes from the review
fixture. No direction presents fixture content with a finish that implies a pipeline ran.

### AP14 · Scroll-jacking and forced pacing — **pass** (A, B, C)

No direction binds scroll position, intercepts wheel events, pins a section until a
threshold, or reveals content on scroll. Scroll is the browser's throughout. The one
scroll-linked behaviour in the lane is in the comparison index's `frames` mode, which is
review tooling and not a direction.

### AP15 · Motion as decoration — **pass** (A, B, C)

The only motion in any direction is the state transition when a mark opens or the density
changes, which is a reader-triggered change of evidence state. `G11` passes for all
three, proving the reduced-motion render carries identical evidence. Reduced-motion
frames are captured for both a record and an entry state.

### AP16 · Unsourced adjacency — **pass** (A, B, C)

Governed quotations carry a `data-gov` pointer to the packet field they quote, at both
densities, and `G6 governed strings render byte-identical to the packet` passes for all
three. The record's own sourcing is a permanent zone: Z6 provenance renders on every
record at every density and names how the conditions were established.

One qualification, checked in `shared/kit.js`: the per-mark attribution field
`declared_by` is in the professional field list only. At consumer density a mark shows
what it points at, the record-level rule where one applies, and the governed `observed`
quotation — so nothing at consumer density is unsourced, but the sentence naming who
declared each individual field is a professional-register field. That is a density
decision rather than an omission, and it is the same in all three directions.

### AP17 · Fake precision — **pass** (A, B, C)

The two-or-more-decimal pattern returns nothing across 66 pages. Every count on the
record is an integer count of things that are individually listed. The aggregate line
carries its N.

### AP18 · Motive verbs — **pass** (A, B, C)

Three lexicon hits per direction, all the same word, reviewed and cleared: `"withheld"`
in `"Protocol-measured case · security deposit withheld"` and in the body of mark 9.
The subject withholding the deposit is a landlord; the word is the subject matter of the
case and attributes nothing to a model. No motive verb takes a model as its subject
anywhere in the fixture — every mark is phrased as "The answer records…", "The answer
names no such term.", "The answer begins at the point…".

The pattern is written to step over second-person constructions for the same reason: the
placeholder "the answer you want to look at" describes the reader's intent, not a model's.

### AP19 · Borrowed-authority badges — **pass** (A, B, C)

Lexicon returns nothing. No seal, no logo, no endorsement, no institutional mark.

### AP20 · The gate before the value — **pass** (A, B, C)

Verified against source: no email field, no account affordance and no gate of any kind
exists on any entry screen or record screen in any direction. The reader pastes and the
record opens. Z7.2 carries a "run your own" affordance in the footer — after the record,
which is where the locked decision puts the gate.

### AP21 · The overlay that alters the source — **pass** (A, B, C)

`G7 source text renders exactly` is this check in machine form and passes for all three.
No direction paraphrases, truncates, ellipsises or reflows away any source character.
Marks are drawn entirely in CSS pseudo-content and backgrounds.

Selectability was tested in the governed renderer rather than inferred from the absence
of a `user-select` rule. Selecting the contents of Z3.4 on the nine-mark record returns
1356 / 1831 / 1357 characters for A / B / C, and the text inside an inline mark is part
of that selection in all three. The marks are `<span role="button" tabindex="0">` rather
than real `<button>` elements, which is what keeps their text selectable while still
making them keyboard-operable — a real `<button>` would have made the source text inside
it unselectable in this renderer.

### AP22 · Single-example overfit — **pass** (A, B, C)

The fixture holds four records across four classes with 1, 3, 9 and 5 marks, covering all
three anchor modes and all three signal classes, including one record whose findings are
entirely record-level absence (montana), one with a single capture and no second artifact
(furnace), one at the anatomy's ceiling with mixed modes (deposit), and one adherence
record with an expectation anchor and no record-level absence at all (website). Every
direction renders all four, and `G1` passes on each.

### AP23 · Silent correction — **pass** (A, B, C)

The silent-correction lexicon — `should have said`, `should say`, `correct version`,
`the right answer is`, `instead of that` — returns nothing across 66 pages. No direction
draws an insertion caret, a suggested replacement, or a "should have appeared here"
marker. Record-level absence is stated as an observation about the record, out of the
document, with no insertion location proposed.

### AP24 · Selective marking — **pass** (A, B, C)

`G2 count equals marks equals register entries` passes for all three on all four records:
the stated count, the number of marks drawn, and the number of Check Register entries are
the same number. Every mark the record holds is drawn, and every mark drawn has an entry.
No mark is dropped for being quiet and none is amplified for being dramatic — which is
the same uniformity that produces the AP3 shortfall above, and the tension between those
two is real rather than resolvable by wording.

---

## Tally

| | pass | partial | fail |
|---|---|---|---|
| A · Investigative Cinematic | 33 | 1 (AP3) | 0 |
| B · Editorial Instrument | 33 | 1 (AP3) | 0 |
| C · Forensic Manuscript | 33 | 1 (AP3) | 0 |

The identical shortfall across all three is expected: AP3 is a property of the shared
anatomy and the shared mark-drawing contract, not of any direction's composition. Fixing
it would be a change to `ANATOMY.md` and the kit, inherited by all three at once.
