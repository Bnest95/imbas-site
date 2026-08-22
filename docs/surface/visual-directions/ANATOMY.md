# Review Record — shared anatomy specification

Version `record-anatomy.v2`. One anatomy, four record classes, one production
chassis and one archived pair.

This document is the class-level hierarchy. It names every zone and what that zone
carries. A direction supplies presentation metadata only: where a zone sits, how it
is set, how it opens. A direction may not add a zone, drop a zone, restate a zone's
content, or hold a local copy of any record string.

The reader's speed on their fiftieth record is what this buys. Per-page art
direction spends it.

**Selection closed on 2026-08-10. B is the production chassis; A and C are archived
evidence.** A and C are frozen against `record-anatomy.v1`, whose byte-identical
snapshot sits beside this file as `ANATOMY.v1.md`. They consume that document and
nothing in this one. B consumes this document. Where the two differ, the difference
is named in the amendment log and nowhere else, so a reader comparing an archived
render to a current one can see exactly what moved.

## The four record classes

| id | class | boundary register | pair | findings |
|---|---|---|---|---|
| `montana` | GOVERNED PUBLIC EXAMPLE | documents what the cited capture and named sources show | yes — probe answer | 1 |
| `furnace` | USER-SUPPLIED RUN | provisional, prompts for the reader's own review | no — one capture | 3 |
| `deposit` | PROTOCOL-MEASURED CASE | behavior observed under the conditions recorded here | no | 9 |
| `website` | ADHERENCE RECORD | one produced artifact against one assignment | no — assignment is not an answer | 5 |

`montana` is the one-finding floor. `deposit` is the nine-finding ceiling and the
quiet register: its findings are wording and absence, with nothing dramatic to
stage. `furnace` is the single capture. `website` is the assignment pair, whose
second document is an instruction set rather than a second answer.

An anatomy that only works on `montana` has overfit. Every zone below was checked
against all four.

## Reading strata

The zone list says what a record contains. It said nothing about what a person meets
first, and for four passes that silence was read as an instruction to render
everything at once. The measured result on the production chassis: twelve rendered
text blocks stood between the top of the page and the question, and at 390 the first
line of the person's own answer was never on the first screen in any arrival state.
Most of those twelve were the instrument describing itself.

Three strata answer that. They are a reading order, not a permission system.

| stratum | carries | rule |
|---|---|---|
| **GLANCE** | the finding sentence and the count | nothing competes with these two |
| **READ** | the person's own answer, with its marks on it | reached with nothing explanatory in between |
| **INSPECT** | scope detail, condition, census, orientation, provenance, applied checks, the full register | complete where it lands, reachable without a decision |

Arrival changes what GLANCE holds and nothing else. A runner knows what they pasted,
so GLANCE is `Z1.4` and `Z2.1`. A cold reader does not know what they are holding, so
a compact identity — `Z1.1` and `Z1.2` — precedes them, and `Z2.3` follows the count.
The same leaves, a different parent.

`Z2.3` is in the cold reader's GLANCE by rule rather than by taste. It is the line
that says what a mark can point at, it is dismissible for a runner, and a forwarded
record already refuses to let it be dismissed at all. **A zone the record will not let
a cold reader turn off may not be a zone the record makes a cold reader ask for.**

**Containment and reachability are not on the table.** A stratum may change what is
immediately visible. It may never change what the record contains, and it may never
put a zone behind a state a reader cannot reach. Concretely, and provable in the DOM:

- Every zone the record class requires is in the document on load, at full content,
  in the strata and in every arrival state. Nothing is fetched, deferred, or built on
  interaction.
- A zone placed in INSPECT renders **in full** where it lands. INSPECT is not a
  summary of a zone; it is the zone.
- Where INSPECT uses a disclosure, the disclosure is native `<details>`/`<summary>`,
  reachable and operable by keyboard with no scripting, and its summary states what is
  inside rather than inviting a click.
- A forwarded record opens complete, per `Z7.4` and invariant 12. Strata do not
  qualify that guarantee.

**The canonical sequence is a containment order, not a viewing order.** Before this
amendment the two were the same document order, which is why moving `Z1.4` above
`Z1.1` reads as a violation. It is not one: the record still carries Z1.1 through
Z1.5 and Z2.1 through Z2.4, whole, in the masthead group. What changed is which of
them a reader meets first.

## Canonical zone sequence

Zones appear in this order in the document. A direction may place a zone in a
column, a margin, a plate or a rail; it may not move a zone outside the record.

**Within `Z1` and `Z2`, order is released to the reading strata above.** A direction
composing to the strata may lead with `Z1.4` and `Z2.1` and file their neighbours in
INSPECT. Across zone groups the sequence holds: no direction may move `Z5` above
`Z3`, or file `Z3.4` behind a disclosure. The released span is exactly the span the
strata name, and the reason is that Z1 and Z2 are the only groups where every leaf
addresses the same reader at the same moment and the group's internal order was
therefore an editorial choice rather than a structural one.

**One zone is exempt, by ruling: `Z5.6`.** Its contents are frozen exactly like every
other zone — the same rows, the same census sentence, the same outcome wording,
emitted by the shared kit so no direction can shorten the list. Its *position and
compositional weight* are released to the direction, and each direction states its
placement and the reason for it in the source at the point of composition. The zone
records what was applied to the artifact, and where that belongs in a reading is a
real question with more than one defensible answer; freezing it into the sequence
would have answered the question by inheritance. Nothing else is released. A
direction may not move Z5.6 outside the record, may not drop a row, may not render
rows selectively, and may not restate the zone's strings.

### Z1 · MASTHEAD

| zone | carries | present on |
|---|---|---|
| `Z1.1` record class label | `GOVERNED PUBLIC EXAMPLE` / `USER-SUPPLIED RUN` / `PROTOCOL-MEASURED CASE` / `ADHERENCE RECORD` | all |
| `Z1.2` context line | subject and domain of the record | all |
| `Z1.3` record address | when it was read, what was inspected, and the condition it was read under | all |
| `Z1.4` finding sentence | the record's own plain statement of what it holds | all |
| `Z1.5` scope boundary | what this record documents and what it establishes | all |

Z1.4 is a sentence about this record, never about the model in general. Z1.5 is
carried by the record itself, in the record's own anatomy, not by site copy.

### Z2 · SCOPE AND COUNT

| zone | carries | present on |
|---|---|---|
| `Z2.1` count line | `N marks on this record` — N equals the marks rendered | all |
| `Z2.2` count rule | the count is the number of marks listed here | all |
| `Z2.3` orientation line | what a mark points at; dismissible | all |
| `Z2.4` census | where the marks sit — how many in the document, how many outside it | all |

The count is arithmetic, not a score. It equals the length of the mark list and the
number of entries in the Check Register. The harness asserts all three agree. Z2.4
is that same arithmetic split by channel, so a record whose marks sit outside the
document says so at the count rather than at the mark.

### Z3 · SOURCE

| zone | carries | present on |
|---|---|---|
| `Z3.1` prompt label + prompt | what was put to the model | all |
| `Z3.2` expectation artifact | the assignment, in full, plus its machinery disclosure | `website` |
| `Z3.3` source label | what the marked document is | all |
| `Z3.4` source body | the artifact, verbatim and selectable | all |
| `Z3.5` second artifact | the probe prompt and what it drew | `montana` |
| `Z3.6` capture shape | stated positively — how many captures this record holds | `furnace`, `deposit` |

Z3.4 is never paraphrased, truncated, reordered or restyled to accommodate a mark.
Responsive reflow of the line box is not an edit; the characters do not change.

### Z4 · FINDINGS LAYER

| zone | carries | present on |
|---|---|---|
| `Z4.1` in-document marks | `QUOTED_SPAN` and `PASSAGE_CONTEXT` anchors, numbered | all |
| `Z4.2` record-level block | `RECORD_LEVEL_ABSENCE` marks, outside the document | `montana`, `furnace`, `deposit` |
| `Z4.3` record-level rule | `Not anywhere in this answer.` | wherever Z4.2 renders |
| `Z4.4` mark detail | the expanded body of one mark | all |

Three anchor modes, three authorized visual channels, no overlap:

- `QUOTED_SPAN` — **in-document, span channel.** The mark sits on the characters it
  quotes. The quote resolves in the source body exactly once.
- `PASSAGE_CONTEXT` — **in-document, region channel.** The mark brackets a region
  between a start line and an end line. It marks where the reading is legible, not a
  single character range, because the observation is about the region.
- `RECORD_LEVEL_ABSENCE` — **out-of-document channel only.** There is no place in the
  answer where this sits. The mark therefore renders outside the source body, never
  in a margin beside it, never with a caret, gap, insertion point or ghost line. A
  direction states the mode by *where the mark cannot go*.

### Z5 · CHECK REGISTER

| zone | carries | present on |
|---|---|---|
| `Z5.1` heading | `Check Register` | all |
| `Z5.2` register note | what one entry is | all |
| `Z5.3` entries | one per mark, numbered as beside the source | all |
| `Z5.4` density control | consumer / professional | all |
| `Z5.5` register close | signal classes, counts line, source line, closing tag | all |
| `Z5.6` applied checks | every declared check, its condition where it has one, and what it produced — including checks that produced nothing | all |

Entry fields at **consumer** density: number, what the mark points at, the question
worth asking. Entry fields added at **professional** density: anchor mode and what
the mode means, evidence state, signal class, what the finding rests on, how the
two documents connect, and the expectation quote where the record has one.

Density is a register over one record, not two records. No entry appears at one
density and vanishes at the other; professional adds fields to the same entries.

#### Z5.6 · the applied checks

Z5.3 lists one entry per mark, so it can only speak when something surfaced. A record
with one finding collapses to an almost-empty artifact, and a reader has no way to
tell a record where little was found from a record where little was looked for. Z5.6
is the stratum that answers that: it lists the checks themselves, and a check that
produced nothing holds a row exactly like a check that produced findings.

Every row carries: the check's identity, its own condition where the instrument
genuinely has one, what it produced, and the detector id and version at professional
density. Rows that produced findings name the mark numbers, so a check can be walked
back to the evidence it produced rather than standing on a total.

**Three outcome states, and the record may only claim a state the instrument
supports.**

| state | means |
|---|---|
| `PRODUCED` | ran on this record and produced one or more findings, named by mark number |
| `NO_FINDING` | ran on this record, under the condition shown, and produced nothing |
| `NOT_APPLICABLE` | did not run on this record — these checks read an AI answer, and this record does not hold one |

The declared checks are joined at build time from the repository's own
`FINDING_CLASSES` and `FINDING_TYPE_TO_DETECTOR` by their shared key. No detector
list is written by hand in this lane, so the register stops building the moment the
instrument's own map changes. Exactly one check family is built there —
`comparative` / `finding_derived` — and the register declares exactly that. Check
families that have validators but are not built are not declared, because the
register records what ran and a check that does not exist did not run.

Application is not selection. Every finding an inspection produces is routed through
the same detector map; there is no step that picks a subset of detectors for a given
answer. All declared checks are therefore in force over every record that holds an
answer, which is what permits a row saying a check ran and produced nothing.

**Counting doctrine.** The census here is literal and its permitted form is fixed:

> `N checks ran. M produced one or more findings.`

`N` is checks actually run. `M` is checks that produced at least one finding. Where
nothing ran, the record says how many checks are declared and why none of them ran.

Not permitted, in any zone of this anatomy: `M of N failed`, `X% passed`, failure
rate, success rate, pass, fail, scores, grades, ratios, percentages, or any aggregate
verdict. The same two integers produce a record of what was examined or a grade on
the answer depending only on the sentence they are put in, and this anatomy carries a
record. A check that produced nothing is never represented as a *pass*; it is
represented literally, as a check that ran and produced nothing.

The build lints every rendered string against that doctrine (`build/gate.mjs`, rule
`COUNT`).

**Compact state.** Under the reading strata, Z5.6's compact state is the census
sentence and nothing else: `N checks ran. M produced one or more findings.` That
sentence already answers *what was checked* on its own terms, which is why it can be
the compact state without becoming a summary — a summary would be a new string
standing in for the rows, and this is the sanctioned string the rows are counted
into. The rows, the shared condition, the per-check conditions, the detector
identities and the silence note are the zone's INSPECT detail and render in full
there. The census sentence is never replaced by a shorter one, never joined by a
ratio, and never accompanied by a control that implies the detail is optional
reading.

The Register answers a different question — *what was found* — and takes the same
shape. Its compact state is the finding sentence and the count of marks, both of
which are already zones (`Z1.4`, `Z2.1`) sitting in GLANCE. Its entries (`Z5.3`) are
INSPECT. Neither zone becomes a second wall of system prose, and neither is permitted
to answer the other's question.

### Z6 · PROVENANCE

| zone | carries | present on |
|---|---|---|
| `Z6.1` heading | `Provenance` | all |
| `Z6.2` rows | label and body, one row per basis | all |
| `Z6.3` record identity | the durable machine handles — run id, packet version, anatomy version | all |

Bases stay apart. What a person reported, what the page displayed, what the hashes
support and what no field determines are four rows, because merging any two states a
claim the record cannot carry. Fixture records carry a fixture row. Z6.3 holds the
identifiers that were once in the masthead: kept in full, filed where a reader who
wants to cite or re-fetch the record goes looking, rather than met on first contact.

### Z7 · FOOT

| zone | carries | present on |
|---|---|---|
| `Z7.1` method pointer | where the rubric, prompts and capture protocol are read | all |
| `Z7.2` archive line | the aggregate, after the instance | all |
| `Z7.3` citation line | how to cite this record | all |
| `Z7.4` forwarded header | present when the record is opened cold | forwarded state |

Instance before aggregate. Z7.2 sits at the foot so the personal instance lands
first and the archive supplies weight afterwards.

### Z8 · READER ENTRY

A separate surface that shares this vocabulary. Three states, each of which must be
reachable from either of the others without obscuring it:

| zone | carries |
|---|---|
| `Z8.1` entry field | where the answer goes |
| `Z8.2` entry action | the control that runs the check |
| `Z8.3` mechanism display | how the visitor with nothing to paste sees the check work |
| `Z8.4` arriving record | the shared record a visitor arrived through |
| `Z8.5` entry scope | what the check reads and what it records |

- `empty` — nothing to paste. Z8.3 leads; Z8.1 stays reachable.
- `answer` — an answer in hand. Z8.1 leads; Z8.3 stays reachable.
- `shared` — arrived from someone else's record. Z8.4 leads; Z8.1 stays reachable.

## Invariants the harness proves

1. Every zone required for a record class renders in every direction.
2. The count in Z2.1 equals the rendered marks and the Check Register entries.
3. Each anchor mode uses only its authorized channel.
4. No record-level absence renders inside the source body or in a margin beside it.
5. No direction holds a local copy of any record string.
6. Governed strings render byte-identical to the packet field.
7. Every user-facing string clears the repository lint.
8. Reduced motion changes no rendered evidence.
9. Z5.6 renders every declared check in every direction. The findings attributed
   across its rows total the marks the page drew that carry a signal class — no more,
   because a row cannot invent a finding, and no fewer, because a mark no declared
   check claims would be a mark the register silently drops. The census numerals on
   the page equal that same arithmetic.
10. Every direction is built against a named anatomy document, and carries its
    SHA-256 stamped on the document element. The harness hashes the document on disk
    and compares. **The archived pair A and C are proved against `ANATOMY.v1.md`,
    identically to each other and to that file; B is proved against this file.**
    Until 2026-08-10 this invariant proved all three stamps identical. Its purpose was
    to stop three directions drifting onto three anatomies while a selection was open.
    Selection closed, so the cross-direction half of it is scoped to the archived pair
    and the currency half applies to each direction against its own document. The
    parity check was not relaxed and was not deleted; it was scoped, and this is the
    recorded reason.
11. Strata change visibility, never containment. For every zone the record class
    requires, in every arrival state and both strata states, the zone is present in
    the DOM with its full text content. Where a zone sits behind a disclosure, the
    disclosure is a native `<details>` whose `<summary>` is keyboard-operable, and
    opening every disclosure on the page yields the same zone set and the same text as
    the page already contained closed.
12. Lint, gate and contrast sweep the record with every disclosure open. A string is
    not exempt from any of the three because a reader has not opened the section it
    lives in.
13. The anatomy version reaches a reader in two places — the `Z6.3` identity row and
    the `Z7.3` citation — and both name the anatomy of the direction that is
    rendering. Neither is baked into the record fixture. The record is one thing and
    the anatomy it was drawn against is another; only the rendering direction knows
    the second, so both strings are assembled at render time from the same resolution
    that stamps the document element. The harness reads every visible string with
    every disclosure open and fails on any version handle that is not that direction's
    own.

    Written because it happened. The citation was assembled per record in the build,
    so amending this document to v2 restamped A and C's citation to v2 while their
    document stamp, their identity row and both anatomy assertions stayed correct and
    green. It was caught by diffing renders by hand, which is not a check; invariant
    13 is the check.

## Amendment log

| version | date | change |
|---|---|---|
| `record-anatomy.v1` | 2026-08-05 | Initial freeze. Z1–Z8, four record classes, eight invariants. |
| `record-anatomy.v1` | 2026-08-08 | **Z5.6 applied checks added**, with the counting doctrine and the three outcome states, so a record shows what was examined rather than speaking only when something surfaced. Z5.6's placement released to the direction; contents frozen. Invariants 9 and 10 added. Corrections in the same pass: `Z2.4` and `Z6.3` were rendering in all three directions from earlier passes and were missing from this document — both are recorded now, with no change to what renders. |
| `record-anatomy.v2` | 2026-08-10 | **Reading strata added — GLANCE, READ, INSPECT.** Selection closed: B is the production chassis and consumes this document; A and C are archived evidence and consume `ANATOMY.v1.md`, a byte-identical snapshot of the v1 text taken before this amendment. Internal order within `Z1` and `Z2` released to the strata, so a direction may lead with `Z1.4` and `Z2.1`; order across zone groups unchanged. Z5.6 and the Register given compact states, both drawn from strings the anatomy already froze. Invariant 10 scoped to the archived pair for parity and to each direction's own document for currency. Invariants 11 and 12 added, which are the containment and the sweep-coverage guarantees the strata make necessary. Invariant 13 added, on the two places the anatomy version reaches a reader — found by this amendment restamping the archived pair's citation while every existing assertion stayed green. Nothing was removed from any record. One correction in the same pass: `Z1.3` was still described as carrying run id, record id and anatomy version, which the S7 pass moved to `Z6.3`; it is described as what it actually renders now, with no change to what renders. |

An amendment updates one anatomy document once. Its hash is then recomputed and
propagated to the directions that consume it from that single recomputation. A
direction never carries its own copy of the anatomy, its version, or its hash.
`ANATOMY.v1.md` is closed: it is an archive, and an amendment to it would falsify the
renders it is the record for.
