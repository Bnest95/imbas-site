# Iteration return — S1–S14

Scratch lane. Repository read only; `git status --short` at the main checkout shows
only the pre-existing `package.json` / `package-lock.json` playwright-core install the
brief instructs me to use, and `git write-tree` equals `HEAD^{tree}`
(`0b85a330d5a34614cb7aec58b79cd1a445bebb5f`) at start and at finish. No branch, no
commit, no PR.

Renderer: `Google Chrome for Testing 148.0.7778.96`, project-owned, unmodified.

Green at close: generate 531 strings / 0 violations · copy-inventory 181 strings /
0 violations · harness 156 checks / 0 failures across 13 assertions · gate 66 pages /
12 findings (the 4 known screened-and-kept, unchanged) · contrast 59 pairs /
0 below threshold, 0 zone-or-treatment failures · entry-fold 18 screens / 0 routes
past the fold · capture 72 frames / 24 parity rows / 0 mismatches.

Fixture freeze amended twice this pass. Pre-amendment
`479db83a306268eafb489e648f15b79c280112e214abc2c14fdf741924977fe7` →
S7 `37bfa4c0…` → census `a5064552…` → current
`954d088ddead4eb47b00be1a1ceb5177262848964ecb757f1bbdeb6b04139ebd`.

---

## 1 · AP3 — the shared density mechanism (proposal only, not implemented)

### The distinction the mechanism encodes

OVERVIEW versus FULL ANNOTATION. Never IMPORTANT versus LESS IMPORTANT. The two
states differ in **how much of each entry is written out**, never in **which entries
exist**. Every mark is present, numbered and reachable in both states. Nothing is
ranked, scored, or sorted by anything but document order.

### What changes visually

Each Check Register entry is a `[data-register-entry]` carrying `[data-field]`
children. Overview renders the identifying fields — mark number, anchor mode, what it
points at. Full annotation renders those *plus* materiality, the ask, the channel
note, and the anchor-mode meaning. The entry's frame, number and position never move;
fields appear inside it.

This is already how the implemented `density` control behaves, and G10 asserts it:
*density adds fields and never changes entries* — the two states carry identical
entry sets, professional is a strict superset of consumer, and it genuinely adds.
AP3 is the generalisation of that one control to the whole record.

### What remains present in both states

- Every mark, at its real number.
- Every anchor in the source text, in its authorised channel.
- The record-level band, with its own count.
- The census sentence, scope, boundary, provenance, identity, foot.
- The full source text at full size. **Source priority is never traded for density.**

### What the count means in both states

The same thing, and it is the same number. Z2.1 says "9 marks on this record" in
overview and in full annotation. The count is of marks, not of visible fields, so a
collapsed record cannot under-report. G2 already ties count ≡ rendered marks ≡
register entries, and G10 ties entry sets across densities; between them a density
state that changed the count would fail.

### Margin and inline treatments

Overview keeps the in-source anchors exactly as they are — the underline, the raised
numeral, the region bracket. What collapses is the *prose* beside or beneath them. In
B, the 23rem margin column keeps one line per mark in overview and expands in place;
in C, the apparatus panel stays closed in overview and the rail numerals persist; in
A, the inline panel opens on demand in both states and overview only shortens the
register entry. No direction removes an anchor from the source in either state.

### Mobile

At 390 both B and C already collapse their two-column grids to one. The proposal adds
nothing there: overview is the same field subset, stacked. The anchors stay in the
text at full size.

### How the user knows more evidence exists

The control is labelled by what it does, present at the register head, and it states
the field count it will add. It is never a disclosure triangle that implies "extra"
or "advanced". Because the entry frames are all present in overview, the reader can
see nine entries and see that each one has more to say.

### Why it stays neutral

Uniformity is the guarantee. The state is a single root attribute; every entry
renders through the same code path with the same field list. There is no per-mark
density, no per-mark override, and no severity input anywhere in the selection. A
mechanism that could collapse *some* marks is a mechanism that could rank them, so it
does not exist. Overview is never summarised into a verdict, a headline finding, or a
"top" anything.

### S1 — how density is prevented from reaching the forwarded record

Three things, and the third is the one that makes it structural rather than
intentional.

1. **One writer.** `boot()` in `shared/kit.js` is the only place `data-density` is set
   at load, and it runs its parameters through `canonical()` first:

   ```js
   function canonical(p) {
     if (!p.forwarded) return p;
     p.density = "professional";
     return p;
   }
   ```

   A forwarded record is forced to full annotation regardless of the inbound query
   string. No direction can route around it, because no direction writes the
   attribute.

2. **Dismiss is refused on arrival too.** `wireDismiss()` is now the single shared
   handler (all three directions previously implemented this themselves, and A's
   version set `hidden` on the parent, which removed the marks explanation from the
   accessibility tree). It no-ops when `data-forwarded="true"`, so the orientation
   cannot be taken off a travelling record even by the second reader.

3. **There is no persistence layer at all.** Grepping `localStorage`,
   `sessionStorage`, `document.cookie`, `indexedDB`, `history.replaceState` and
   `history.pushState` across `shared/`, `a/`, `b/`, `c/` and `compare/` returns one
   hit: `compare/compare.js:276`, which is founder review tooling and never a record
   page. A view preference therefore cannot outlive the tab it was expressed in, let
   alone reach a URL someone else opens.

**This was a live defect, not a hypothetical.** Before this pass `boot()` set
`data-density` straight from the URL, so a forwarded record arrived at consumer
density with register fields stripped. A screenshot of that state looks entirely
reasonable — what is wrong with it is what it does not contain.

G12 now asserts it, loaded the way a hostile forward would arrive
(`&forwarded=1&density=consumer`), with the dismiss control clicked, compared
field-for-field against the professional reading of the same record. I verified it
fails when the guarantee is removed: commenting out `p.density = "professional"` fails
all four records with `density=consumer fields-match-full=false`; restored and
confirmed byte-identical by checksum.

### Two candidate mobile defaults at 390 — described, not chosen

**Overview-first.** The record opens at overview at 390. The reader meets nine
complete entries, each one line, and the whole register fits roughly one and a half
screens instead of five. Reaching any single mark's full reasoning costs one tap.
*What it buys:* the shape of the finding is graspable before the reading is. A
first-time reader on a phone sees "nine, here is where each sits" rather than a wall.
*What it costs:* the professional inspecting on a phone taps before they can read, and
the cold forwarded reader — who by S1 gets full annotation — now sees a *different*
default from the runner, which is a second inconsistency to explain.

**Full-first.** The record opens at full annotation at every viewport. 390 and 1440
differ only in layout, never in content.
*What it buys:* one record, one default, everywhere; the forwarded rule and the
opening rule are the same rule, and nothing has to be explained. Everything is
present for the scrolling reader with no interaction at all.
*What it costs:* Deposit at nine marks is a long scroll at 390, and the reader who
only wanted to know what was found pays for the reader who wanted to check it.

Not chosen. Founder ruling.

---

## 2 · The eighteen stress captures

`screenshots/stress/`, viewport-clipped, at rest, Frames mode, motion ordinary.
Full-page versions of the same states remain in `screenshots/`.

| | Deposit 1440 opens | Deposit 1440 fwd | Deposit 390 opens | Deposit 390 fwd | Furnace 1440 | Furnace 390 |
|---|---|---|---|---|---|---|
| **A** | `a__deposit__1440__opens` | `a__deposit__1440__forwarded` | `a__deposit__390__opens` | `a__deposit__390__forwarded` | `a__furnace__1440__opens` | `a__furnace__390__opens` |
| **B** | `b__deposit__1440__opens` | `b__deposit__1440__forwarded` | `b__deposit__390__opens` | `b__deposit__390__forwarded` | `b__furnace__1440__opens` | `b__furnace__390__opens` |
| **C** | `c__deposit__1440__opens` | `c__deposit__1440__forwarded` | `c__deposit__390__opens` | `c__deposit__390__forwarded` | `c__furnace__1440__opens` | `c__furnace__390__opens` |

The Deposit forwarded frames carry the professional-density Check Register by
construction — that is what S1 forces — so the professional register is shown in the
forwarded-cold state rather than in a separate contrived capture.

---

## 3 · S6 — the pause, measured

`build/stress.mjs`, `shared/stress-report.json`. FIRST CLAIM is Z1.4, the finding
sentence: the first thing on the page that asserts something about the answer rather
than about the record. FIRST PROOF is whichever of the source text or the first
in-source mark the reader meets first — taking the earliest is the honest reading and
it is also the choice that makes every number smaller, so it cannot be accused of
inflating one direction's pause to flatter another. Distances are document offsets:
what a reader scrolls, not what a layout intends.

| dir | state | claim px | proof px | gap px | screens | proof in first screen |
|---|---|---|---|---|---|---|
| A | Deposit 1440 opens | 330 | 1229 | 899 | 0.90 | no |
| A | Deposit 1440 fwd | 422 | 1229 | 807 | 0.81 | no |
| A | Deposit 390 opens | 201 | 1036 | 835 | 0.99 | no |
| A | Deposit 390 fwd | 403 | 1191 | 788 | 0.93 | no |
| A | Furnace 1440 | 222 | 1229 | 1007 | 1.01 | no |
| A | Furnace 390 | 171 | 1065 | 894 | 1.06 | no |
| B | Deposit 1440 opens | 79 | 519 | 440 | 0.44 | **yes** |
| B | Deposit 1440 fwd | 125 | 565 | 440 | 0.44 | **yes** |
| B | Deposit 390 opens | 131 | 841 | 710 | 0.84 | **yes** |
| B | Deposit 390 fwd | 275 | 959 | 684 | 0.81 | no |
| B | Furnace 1440 | 86 | 517 | 431 | 0.43 | **yes** |
| B | Furnace 390 | 131 | 817 | 686 | 0.81 | **yes** |
| C | Deposit 1440 opens | 177 | 939 | 762 | 0.76 | **yes** |
| C | Deposit 1440 fwd | 314 | 1050 | 736 | 0.74 | no |
| C | Deposit 390 opens | 247 | 1188 | 941 | 1.11 | no |
| C | Deposit 390 fwd | 425 | 1340 | 915 | 1.08 | no |
| C | Furnace 1440 | 177 | 939 | 762 | 0.76 | **yes** |
| C | Furnace 390 | 226 | 1143 | 917 | 1.09 | no |

11 of 18 put the first proof past the first screen.

### The psychological function of the pause

It is the interval in which the reader decides what kind of thing they are holding.
Claim, then a held beat, then evidence. Used well it converts a sentence into a
question the reader wants answered — *nine marks, show me* — and the answer arrives
as relief rather than as assertion. Used badly it is the interval in which a reader
decides the page is going to keep talking about itself.

A's pause is a full screen in every state. That is a deliberate cinematic hold and it
is the largest single design bet in this lane. B's is under half a screen at 1440. C's
sits between and is architectural rather than dramatic — the docket has to finish
before the exhibit can begin.

### Runner versus cold reader — the same pause does different work

The **runner** arrives carrying prior expectation. They pasted the answer; they
already know what it said; they are waiting to find out what Imbas saw in it. For
them the pause is anticipation, and A's full screen is the direction that most
rewards it — the finding sentence lands against a memory of the answer.

The **cold forwarded reader** has no prior. They do not know the question, the answer,
the sender's reason, or what Imbas is. For them the same interval is not anticipation
but unverified assertion: a large confident sentence about a document they have never
seen. The pause is doing the opposite job.

**One fixed pause is used, and the cost falls entirely on the cold reader.** The
number is not merely unchanged when forwarded — it gets *worse*. The forwarded banner
adds 46–200px above everything, so in every single state the cold reader's claim sits
lower and their proof sits further down the document than the runner's:

- A 1440: claim 330 → 422. B 1440: 79 → 125. C 1440: 177 → 314.
- B 390 crosses the line because of it: 0.84 screens with proof in the first screen,
  0.81 screens with proof **out** of it.
- C 1440 likewise: in the first screen as it opens, out of it when forwarded.

**This is the most important finding in the pause analysis.** The reader with the
least context is served last. The mechanism that makes the forwarded record
trustworthy (S1: it arrives complete, it announces that it travelled) is the same
mechanism that pushes its evidence further away. That is a genuine tension between S1
and S6, not a bug in either.

### Load-bearing or separable

- **A: load-bearing.** The pause *is* the direction. Remove the hold and A becomes a
  serif-headline version of B. Any fix here is a change of direction, not a tuning.
- **B: separable.** B's pause is short because its header is compact. It could be
  lengthened or shortened without B ceasing to be B.
- **C: separable in principle, awkward in practice.** C's pause is the height of the
  docket, and the docket is a list of record facts. Shortening it means removing
  docket rows, which means removing record facts from first contact — so it is
  separable from the *aesthetic* but entangled with the *content decision*.

---

## 4 · S3 — the Furnace opening, stated plainly

Furnace has one mark and no paired record. The Montana sentence — *"The second answer
carried the deadline. The first one did not."* — cannot exist here, because it is a
comparison and there is nothing to compare. Whatever each direction does at the top of
Furnace is what it actually has when drama is unavailable.

- **A.** The opening moment is **scale and air**. The finding sentence is set large in
  the display face with roughly 180px of clearance above and below, and nothing else
  competes on the first screen. With one mark instead of nine the sentence is shorter,
  so the hold gets *longer* — Furnace 1440 is A's worst pause in the set at 1.01
  screens, worse than Deposit's 0.90. **A's opening depends on the sentence being
  worth the room.** At one mark it is a short sentence in a large field.
  → **This goes on A's load-bearing list: A's hero assumes a consequential sentence.**

- **B.** The opening moment is **the count and the census, immediately**. B has no hero;
  it has a header that states what the record is and then gets out of the way. Furnace
  and Deposit open almost identically (claim at 86 versus 79, proof at 517 versus 519)
  because B's opening is structural, not dramatic. **B is the only direction whose
  opening is indifferent to how much was found.**
  → **Nothing added to B's load-bearing list from S3.**

- **C.** The opening moment is **the docket completing itself**. C opens with class,
  first-contact metadata, finding sentence, context, boundary, count, census and
  orientation as consecutive ruled rows — the reader watches a record get identified.
  Furnace and Deposit are byte-identical in geometry at 1440 (claim 177, proof 939 in
  both) because the docket's height is set by the record's *fields*, not its findings.
  **C's opening is a function of record identity, so it survives a thin record
  completely.**
  → **Nothing added to C's load-bearing list from S3.**

---

## 5 · S5 — instrument presence, per direction

The test: *if the same visual treatment would look identical with no governed process
behind it, it does not prove instrument presence.* By that test most of what reads as
"serious" in all three directions proves nothing — the hairlines, the mono register,
the numbers ledger in the foot and the record class label would render exactly the
same on an empty page. I am reporting them as **atmosphere**, not evidence.

### The mechanism: composition as a function of record facts

Four things in this lane change shape according to what actually ran, and all four are
asserted rather than asserted-about.

1. **Channel routing (Z4).** `RECORD_LEVEL_ABSENCE` marks render out-of-document in
   their own band; `QUOTED_SPAN` renders on the characters; `PASSAGE_CONTEXT` brackets
   a region. Website has no record-level band **at all** because it produced no
   record-level marks. The page's structure is therefore a readout of what kind of
   thing the run found. G3 and G4 assert the routing.
2. **The census (Z2.4) — new this pass.** One sentence, composed at build from the
   marks themselves: *"Where they are anchored: 4 quote the answer's own words, 2
   bracket a passage, 3 describe the answer as a whole."* Furnace says *"1 quotes the
   answer's own words, 2 describe the answer as a whole."* This is the one line above
   the fold that could not read the same way if a different run had produced a
   different record.
3. **First-contact condition (Z1.3) — reordered this pass.** *"Read on its own, under
   the case protocol"* versus *"Each read against the other"* versus *"Read against
   the written assignment."* Three records, three actual protocols, three different
   sentences.
4. **Record identity (Z6.3) — new this pass.** A governed public example carries Run
   and Packet; a lane record carries Record. Different record classes carry a
   *different number of identifiers*, so even the tombstone's shape is a fact.

**Where it appears, per direction.** All four are kit-emitted, so they appear in all
three directions in the same order with the same strings: Z1.3 in the masthead, Z2.4
directly under the count, Z4 in the findings layer, Z6.3 at the end of provenance. A
places Z2.4 under the count in the masthead foot; B places it in the count block
beside the boundary; C gives it its own docket row. **No direction can drop them** —
`scope()`, `provenance()` and the identity block are built in `shared/kit.js`, and
Z2.4 and Z6.3 are both in the harness's `ALWAYS` zone list.

**Supporting record facts.** Mark count, per-mark anchor mode, record class, run
identifier, packet version, anatomy version, read date, inspection condition. Every
one is a field on the frozen fixture, hashed in `HASHES.json`.

**Does it survive forwarding?** Yes, all four, and this is now enforced rather than
hoped: G12 loads a forwarded record with a hostile density parameter, clicks dismiss,
and requires the full zone set including Z2.4 and Z6.3 with a field set identical to
the professional reading.

**G13, new this pass, is what makes the census evidence rather than decoration.** It
reads the rendered sentence back off the page, parses the numerals out of the prose,
and checks them against the anchor modes of the marks that page rendered — not against
the fixture, which would only prove the generator agrees with itself. It also checks
the clause order is the fixed anatomy order, because sorting clauses by size would
turn a census into a ranking, and a ranking is one step from severity. I verified G13
fails: mutating the record-level clause to drop its numeral fails
`a/furnace spoken=[1] expected=[1,2]` and `a/deposit spoken=[4,2] expected=[4,2,3]`.

### What I could not beat

The hypothesis in the ruling — provenance-and-operation grammar — is right, and I did
not find anything stronger than "the composition is a function of the facts". I did
find that the *weak* form of it (printing identifiers prominently) is actively
counterproductive, which is S7 below.

---

## 6 · S7 / S8 — what changed, and one thing the change exposed

**S7.** Run, packet and anatomy were three mono identifiers directly under the record
class label, so the first thing a person met was a hex string. They now sit at Z6.3 at
the end of the provenance block, where a citing reader goes. **Nothing was removed and
no identifier lost a character.** First contact now carries three facts a person can
read without knowing anything about Imbas: `READ 4 August 2026 · INSPECTED One answer
· CONDITION Read on its own, under the case protocol`. The values left the mono face;
the labels kept it. The kit appends the identity block itself so no direction can
restore an identifier to the top of its own composition.

**S8.** The dismiss control was a bordered uppercase mono chip in A and B — the same
chip each gives a real action — sitting near the top of the record. It is now a plain
underlined word. All three directions previously implemented dismissal themselves;
they now call one shared `wireDismiss`, which is what made the S1 guarantee
enforceable at a single point. On a forwarded record the control is not rendered at
all.

**What subordinating it exposed.** I extended `build/contrast.mjs` to measure the
dismiss control, and found the probe had never measured `border-bottom` at all — it
inspected only Left and Top, because until this pass every ruled treatment in the lane
was a left or top rule. Adding Bottom immediately failed the new control at **1.21:1**
(`#262220` on `#120E0D`). Every `--line-*` token is a sub-3:1 hairline; that is correct
for a separator and unusable as the only mark identifying a control. The affordance is
now an underline in the label's own ink and measures **6.96:1**. Subordination is
carried by size, case and the absent chip, none of which costs a reader the
affordance.

The console summary was also printing `0 below threshold` from the palette list only
while a named treatment failed four rows above it. It now prints zone and treatment
failures and sets a non-zero exit code.

---

## 7 · S11 — stress analysis

### A — Investigative Cinematic

**Holds.** The finding sentence at nine marks is genuinely arresting, and the masthead
survives the S7 reorder better than the others — the three human-readable metadata
facts sit in one quiet line under the class label and read as a caption. Source
priority is absolute: the answer is the largest text on the page. Register at
professional density is calm because A gives entries room.

**Breaks.** The pause. A is the only direction where the first proof is past the first
screen in **all six** states, and its worst case is Furnace — the thin record — at
1.01 screens. The vertical air that makes one sentence land makes a nine-mark record
very long: the Deposit full-page frame is dominated by register scroll.

**Noisy.** Little. A gets quieter under load, not noisier, which is the opposite of
the usual failure.

**Hard to understand.** The nine-mark register is a long undifferentiated run of
entries at professional density. A normal person understands the top of the page
completely and is likely to stop before the register.

**Source priority survives?** Yes, most strongly of the three.
**Still feels like itself?** Yes at nine, and *more* like itself at one.
**Collapses toward another?** No.
**Normal person?** Yes at the top; the register is not for them.
**Professional inspects efficiently?** No. Most scrolling per mark of the three.
**Trustworthy forwarded cold?** Weakest of the three. A large confident sentence and a
full screen before anything checkable is exactly the shape of an assertion.
**Professional density reads as instrument or report?** Report. A's register is a
beautifully set document, not a working surface.

### B — Editorial Instrument

**Holds.** Everything under load. B is the only direction that puts proof in the first
screen at 1440 (0.43–0.44 screens) and it does so at one mark and at nine
*identically*. The 23rem margin column means nine marks cost nine margin notes rather
than nine page-widths.

**Breaks.** 390 forwarded — the only B state where proof leaves the first screen, and
it leaves it by 115px. The two-column grid collapses at mobile and the margin notes
become interleaved blocks, which is the one place B's density reads as stacking rather
than annotating.

**Noisy.** The header. Class label, context, metadata line, finding sentence,
boundary, count, census, count rule, orientation and dismiss all arrive in the first
400px. It is dense rather than loud, but it is the most information per pixel in the
lane, and the census made it denser.

**Hard to understand.** The margin convention has to be learned, once. After that it
is the easiest of the three to scan.

**Source priority survives?** Yes, but by less margin than A — the annotation column is
a genuine competitor for attention at 1440.
**Still feels like itself?** Yes, unchanged from one mark to nine.
**Collapses toward another?** At 390 it collapses toward C — single column, sequential
blocks, ruled separations. This is real and visible in `b__deposit__390__forwarded`.
**Normal person?** Yes, provided they read the census; without it the header is a lot.
**Professional inspects efficiently?** Yes. Best of the three.
**Trustworthy forwarded cold?** Strongest at 1440. Weakest-improved at 390.
**Professional density reads as instrument or report?** Instrument, clearly.

### C — Forensic Manuscript

**Holds.** Identity. C's opening is a function of record *fields* rather than record
*findings*, so Furnace and Deposit open with byte-identical geometry at 1440 (claim
177, proof 939 in both). No other direction is that stable. The bounded exhibit is the
single most convincing "this is an artifact under inspection" device in the lane.

**Breaks.** 390. Three of C's four mobile states put proof past a full screen, and
Deposit 390 forwarded is the worst number in the entire matrix at 1.08 screens with
the claim already 425px down. C's ruled docket is many short rows, and rows do not
compress — they stack.

**Noisy.** The left rail. At 1440 the 3.4rem label column is empty for most docket and
plate rows, so a meaningful fraction of the page's left edge is dead width that exists
to keep the grid honest.

**Hard to understand.** The docket asks the reader to accept a lot of structure before
any content. A normal person meets six ruled rows before the question.

**Source priority survives?** Yes — the plate's own ground is the clearest
artifact/commentary boundary of the three.
**Still feels like itself?** Yes, at every record and every width.
**Collapses toward another?** No. C is the most distinctive under stress.
**Normal person?** Weakest of the three at first contact; the docket reads as
paperwork before it reads as a finding.
**Professional inspects efficiently?** Yes at 1440, poorly at 390.
**Trustworthy forwarded cold?** Strong. The docket answers "what is this?" before it
says anything consequential, which is precisely the cold reader's first question.
**Professional density reads as instrument or report?** Instrument — specifically a
legal or laboratory instrument.

---

## 8 · S12 — separability and load-bearing, updated

### A — load-bearing
- The full-screen pause between claim and proof. **Confirmed by measurement**, all six
  states.
- A hero sentence worth the room. **Added this pass from S3** — A's opening degrades on
  a thin record while B's and C's do not.
- The display-face finding sentence at hero scale.
- Vertical air as the primary rhythm.

### A — separable
- The masthead metadata treatment (now shared kit).
- Register entry styling.
- Dismiss treatment (now shared).

### B — load-bearing
- The 23rem margin column at ≥1100px. This is B's architecture; without it B is a
  single-column editorial page.
- The compact header. B's short pause is a consequence of it.

### B — separable
- Census placement within the count block.
- Header field ordering.
- Entry grid.

### C — load-bearing
- The ruled docket as first contact, and its row-per-fact grammar.
- The left rail as a page-wide alignment spine — **not just inside the plate.** See
  below.
- The bounded exhibit's own ground.

### C — separable
- Plate border radius, padding, max-width.
- Apparatus panel styling.

---

## 9 · S12 — is C's bounded exhibit portable into B? Answered from the implementation.

**Partly. The chrome ports; the meaning does not.**

The exhibit is `.c-plate`:

```css
.c-plate { max-width: 60rem; background: var(--bg-surface);
           border: 1px solid var(--line-soft); border-radius: 2px;
           padding: 0.4rem 1.6rem 1.4rem 0; }
.c-plate-row { display: grid; grid-template-columns: 3.4rem minmax(0, 1fr); }
.c-face { padding: 0.75rem 0 0.75rem 1.5rem; min-width: 0; }
```

**What ports cleanly.** The ground, border, radius and max-width — about fifteen lines
with no dependency on anything else in C. B could wrap `.b-body` in them tomorrow.

**CSS dependency that does not port.** `padding-left` on `.c-plate` is **zero**,
because the 3.4rem first grid column *is* the left padding. Every row inside the plate
must therefore be a `.c-plate-row`. Drop the plate into B and either every source
paragraph gains a grid wrapper or the text loses its left inset entirely.

**DOM assumption that does not port.** C renders each source line as
`el("div", {class: "c-plate-row c-src-row"})` wrapping a `.c-face`. B renders source
paragraphs as flat `<p class="b-para">` inside `.b-body`. This is a **DOM change, not
a CSS change** — B's paragraph loop would have to emit wrappers.

**Width dependency.** C's rail is 3.4rem at desktop and is explicitly reduced to
2.1rem under B's own breakpoint region (`c/c.css:418`). B spends 23rem on its margin
column (`.b-row { grid-template-columns: minmax(0,1fr) 23rem }`). Adding a 3.4rem rail
inside the plate takes it from the text column only, since the margin is fixed — so at
1440 the source text loses ~54px it currently spends on `max-width: 64ch`, and below
1100px where `.b-row` collapses to `1fr`, the rail becomes dead width in single
column.

**Margin dependency — this is the one that actually blocks it.** C's plate contains
*only the model's artifact*; C's own commentary lives outside it in the apparatus.
That boundary is the whole point of the device. B's marks live in a 23rem grid column
that is a **sibling of the source text**, not a separate section. So in B the plate
can enclose either:

- **column 1 only** — a box whose right edge runs down the middle of the page with
  Imbas's annotations floating outside it, severing the visual tie between a marked
  line and its note, which is B's entire reading model; or
- **both columns** — an "exhibit" containing Imbas's own commentary, which destroys the
  artifact boundary the box exists to draw.

Neither is C's exhibit. **The device is portable as decoration and not as meaning,
because its meaning is "everything inside this boundary is theirs, everything outside
is ours", and B's layout deliberately interleaves the two.**

**Typography dependency.** Minor and portable: `.c-para` is 17px/1.78 at `max-width:
62ch`; B's `.b-para` is 17.5px/1.72 at 64ch. Either survives the other's plate.

**Behaviour lost outside C.** The rail aligns the plate with the docket above it and
the register below it, so the whole page reads as one ruled instrument with a single
left spine. In B there is no other rail to align to, so the plate would be the only
boxed, railed element on the page — it would read as an embed rather than as the
page's governing structure.

---

## 10 · S2 — ember pushed, and the one real doctrine limit

Ember (`--ember #DE6F38`) is placed at: the record class label, the record-level
absence band and its numerals, the QUOTED_SPAN underline (`#F8A866` variant) and the
raised numeral, the register entry numerals, the focus ring, the forwarded banner, and
the primary CTA. That is signal, gap indicator, mono pill and CTA — all inside
doctrine. No heading in this lane carries two accented words; nothing is severity
coded; there is no large decorative fill.

**59 distinct colour pairs, 0 below threshold, 0 zone-or-treatment failures**,
measured on the real pages in the governed renderer across four records × two
viewports at full register.

**The one real limit found, with a capture.** It is not a palette limit — it is a
placement-doctrine limit, and it is in the `--line-*` family rather than in ember.

> Every line token is below 3:1 on every ground in this system.
> `--line-faint` 0.09α, `--line-soft` 0.15α, `--line-strong` 0.24α,
> `--line-luminous` 0.38α — on `--bg-page #120E0D` the soft token composites to
> `#262220`, which is **1.21:1**.

This is correct and intentional for separators, which WCAG exempts. It becomes a
failure the moment a line is the *only* mark identifying a control — which is exactly
what subordinating the dismiss control per S8 created. The system therefore has a
standing rule it had never had to state: **a control may be quietened by size, case,
weight and position, but its affordance must be drawn in text ink, never in a line
token.** I have not proposed a replacement colour and have not touched the palette;
the fix was to stop using a separator as an affordance.

Captures: the failing state is reproducible by reverting `.a-dismiss` to
`border-bottom: 1px solid var(--line-soft)` and running `node build/contrast.mjs`,
which now prints `FAIL a 1.21:1 dismiss · rule · border-bottom #262220 on #120E0D` and
exits non-zero. Current passing state measures `6.96:1`.

**Second limit, reported not worked around.** The probe itself was blind to
`border-bottom`. A measurement tool that silently skips a treatment and then reports a
clean total is worse than no tool, and it had been reporting clean totals for this
lane's whole life. Fixed in `build/contrast.mjs`.

---

## 11 · S13 — entry

Entry captures were **not materially affected** and are unchanged: `entry-fold`
reports 18 screens with 0 routes past the fold, identical to before this pass. The
metadata, dismiss and ember changes are all record-surface changes; entry carries no
Z1.3 address, no dismiss control and no census.

A's Montana headline is preserved exactly and was not edited:

> The second answer carried the deadline. The first one did not.

Verified byte-identical against `reader-public-example.js` by G6, which passes for all
three directions.

---

## 12 · S14 — multi-audience trust read of the cold forwarded artifact

One artifact, four readings. Not four interfaces.

- **Ordinary person.** Reads the finding sentence, the census, and the boundary, and
  stops. What they need is that those three are in plain English and adjacent. The
  census is the addition this pass makes for them specifically: *"where they are
  anchored"* tells them what kind of evidence is coming before they meet nine of it.
  **Best served by B** (proof in the first screen at 1440). **Worst by C** (six ruled
  rows before the question).
- **Professional.** Reads the register at full annotation and checks marks against the
  source. Needs efficient traversal and stable anchors. **Best served by B at 1440, C
  at 1440.** Both fail them at 390.
- **Journalist / grant reviewer.** Needs to know what was measured, under what
  conditions, and whether the claim is bounded. This is exactly what S7's reorder
  produced — `INSPECTED One answer · CONDITION Read on its own, under the case
  protocol` is written for this reader — plus the Z1.5 boundary and the Z6.3
  identifiers for citation. **Best served by C**, whose docket answers "what is this?"
  before it says anything consequential.
- **Investor / institutional reader.** Is asking whether a real process exists behind
  the page. The four S5 mechanisms are the whole answer, and the census is the one
  that works in a three-second glance. **Best served by C, then B.** A gives this
  reader the least in the first screen.

**The common failure.** All four are served worse when the record is forwarded,
because the forwarded banner pushes everything down — and three of these four
audiences meet Imbas *only* through a forwarded record. That is the structural finding
of this pass and it applies to all three directions equally.

---

## 13 · Two silent holes found and closed in the checking layer

Reported because a receipt that says "checked" about work that never happened is worse
than no receipt.

1. **`copy-inventory.mjs` was linting `undefined`.** `count_line` is composed at build
   time from the mark total, so it does not exist on the source fixture. The inventory
   read it from the source and got `undefined` for all four records — and
   `vocab.lintString(undefined)` returns `[]`, so the inventory reported them clean.
   The inventory now reads the built file that actually ships to the page.
2. **The entire `authored record content` list was being linted as objects.** Every
   record-content field is a `{ text, src }` pair. All 31 rows were handed to
   `lintString` whole, which returns `[]` for a non-string. That list has been
   reporting "31 strings, 0 violations" while checking nothing since it was written.

Both are now guarded: `requireText()` fails the build loudly if any inventory row is
not a non-empty string. The strings themselves were clean underneath — `generate.mjs`
lints the built output and G8 lints what renders, and both covered this content — so
no copy changed. The receipt is now real.

**Also fixed:** `K.scope()` returned an ordered array and all three directions indexed
into it, so inserting the census at index 1 silently moved the count rule and the
orientation one slot down in every composition. It returns named leaves now. A shared
kit that hands out ordered tuples makes every later addition a breaking change.

---

## Not done, as instructed

AP3 is proposed and not implemented. No direction was synthesized. No fourth direction
exists. The repository was not written to.
