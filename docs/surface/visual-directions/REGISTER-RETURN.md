# Return — the applied-checks zone, instrument presence, and placement

Three requests: add a zone that represents checks which produced no finding; make that
zone the primary S5 mechanism; treat its position as an eighth direction question.

One anatomy change, propagated once. Directions A, B and C unchanged in every other
respect. No repository write. AP3 not implemented. No fourth direction.

---

## 0 · Two things in the brief that the measurement contradicts

Both stated up front, because the rest of this document rests on them.

### 0.1 The Check Register is not underneath provenance, and was not before this pass

> *"It is currently late in the record, underneath provenance and boundary material."*

Measured on the built pages, Deposit at 1440, document offsets of each zone's top:

| direction | `Z5.1` register opens | `Z6.1` provenance opens | register sits **above** provenance by |
|---|---|---|---|
| A | 3313 | 6002 | 2689px |
| B | 1726 | 4072 | 2346px |
| C | 3239 | 5546 | 2307px |

The register opens roughly 2,300–2,700px *before* provenance in all three, and that
was true in the pre-Z5.6 build too. It is late in absolute terms and it is beneath the
boundary material, and both of those are real. It is not underneath provenance.

I flag this because the instruction attached to the premise was *"Do not preserve that
order merely because it already exists"* — and the order that exists is not the order
described. The placement question is still live and still worth answering; it just is
not a rescue from burial under Z6.

### 0.2 Placing the zone early costs evidence proximity, and the cost is large

A and C both answered the placement question by putting `Z5.6` before the source. That
is a defensible answer and each direction's reason is in its own source. What was not
stated, until I measured it, is the price. Against the pre-Z5.6 build:

| direction | state | first proof before | after | Δ | screens before → after |
|---|---|---|---|---|---|
| A | Deposit 1440 | 1229 | 1951 | **+722** | 0.90 → 1.62 |
| A | Deposit 390 | 1036 | 1975 | **+939** | 0.99 → 2.10 |
| A | Furnace 1440 | 1229 | 1951 | **+722** | 1.01 → 1.73 |
| B | *all six frames* | — | — | **0** | unchanged to the pixel |
| C | Deposit 1440 | 939 | 1672 | **+733** | 0.76 → **1.50** |
| C | Deposit 390 | 1188 | 2069 | **+881** | 1.11 → 2.16 |
| C | Furnace 1440 | 939 | 1672 | **+733** | 0.76 → **1.50** |

Frames where the first proof sits past the first screen went from 11 of 18 to 13 of 18.
**Both frames that flipped are C's**, and they were the two the S6 pass had singled out
as C's strongest credential: C was the only direction whose Deposit and Furnace both
put proof inside the first screen at 1440. Neither does now.

This is the failure mode named in the brief — *"must not … displace the source/evidence
relationship"* — and it is measurable rather than arguable. **B is the only placement
that costs nothing**, and it does so without burying the zone: B opens the register
with it. Whether A and C should adopt B's position is a founder ruling, not mine, so
they stand as built with the price recorded at the point of composition.

I corrected three source comments in this pass, because each had claimed something the
measurement does not support:

- **A** claimed the zone cost *"two hundred pixels."* It costs 722 desktop, 939 mobile.
- **C** claimed *"a reader who never scrolls has already seen that three checks ran and
  what each produced."* At 1440 that reader sees the census sentence only (closes at
  809px); the first outcome line closes at 1067px, past a 1000px fold. At 390 nothing
  of the zone is in the first screen — the census closes at 1024px against an 844px
  fold. C keeps the first half of the claim and loses the second.
- **B** claimed the zone sat *"about two and a half screens down."* Measured, 1.9 screens
  on Deposit and 1.3 on Montana at 1440; 4.3 and 2.4 at 390.

---

## 1 · The zone

`Z5.6 · applied checks`, inside Z5, present on all four record classes.

### What it carries

Every declared check gets a row whether or not it produced anything. Each row carries
the check's identity, its own condition where the instrument genuinely has one, what it
produced, and — at professional density — the detector id and version. Rows that
produced findings name the mark numbers, so a check walks back to its evidence instead
of standing on a total.

### The three outcome states

| state | rendered sentence | when |
|---|---|---|
| `PRODUCED` | `Produced 4 findings: marks 6, 7, 8, 9.` | ran and produced findings |
| `NO_FINDING` | `Ran on this record and produced no finding.` | ran, under the condition shown, produced nothing |
| `NOT_APPLICABLE` | `Did not run on this record.` | these checks read an AI answer; this record holds none |

All three states occur in the fixtures, and all three are supported by the current
instrument. `montana` exercises `PRODUCED` and `NO_FINDING` on one record — one check
produced a single finding, two ran and produced nothing. `website` is the whole-zone
`NOT_APPLICABLE` case: it is an adherence record, holding one produced artifact against
one assignment, so the three answer-reading checks have no answer to read.

### What is declared, and why exactly three

Joined at build time from the repository's own `FINDING_CLASSES` and
`FINDING_TYPE_TO_DETECTOR` on their shared key. No detector list is written by hand in
this lane, so the register stops building the moment the instrument's own map changes.

Exactly one check family is built in `reader-checks.js` — `comparative` /
`finding_derived` — giving `vg.omission`, `vg.framing_drift`, `vg.deflection`.
`local_integrity` and `profile` have validators but are marked *not built here*, so they
are not declared: the register records what ran, and a check that does not exist did not
run. **No future check family, suite-selection behavior or applicability semantics was
invented to populate the zone.**

Application is not selection. Every finding an inspection produces is routed through the
same detector map; no step picks a subset of detectors for a given answer. That is what
permits a row saying a check ran and produced nothing — the claim is true because
uniform application is how the instrument is built, not because the page asserts it.

Only omission carries its own condition, and it is a real one from the instrument:

> `Condition. An omission has no second end to quote, because the wording is not in the
> answer. It resolves against the record instead of against a span.`

The shared condition above the rows is the both-ends-quotable rule:

> `A check produces a finding where both ends resolve to exact text of the answer above:
> the wording a reading rests on, and the wording that carries it. Where an end does not
> resolve, the check produces nothing rather than something weaker.`

### The counting doctrine, as implemented

Permitted form, and the only one emitted:

> `3 checks ran. 1 produced one or more findings.`

Where nothing ran, the record says how many checks are declared and why none of them
ran: `3 checks are declared. None ran on this record, because each of them reads an AI
answer.`

Not emitted anywhere: `M of N failed`, `X% passed`, failure rate, success rate, pass,
fail, scores, grades, ratios, percentages, aggregate verdicts. A check that produced
nothing is never a *pass*; the sentence is literal — it ran and produced nothing.

The build lints every rendered string against that doctrine (`build/gate.mjs`, rule
`COUNT`). The rule is scoped to the record's own voice, determined from anatomy
`data-*` attributes only, never from direction class names. It has to be: the anatomy's
strongest invariant is that the inspected answer renders verbatim, so a counting rule
that fired on the artifact could only ever produce pressure to edit evidence. Every
other gate rule stays in force everywhere.

### That a row which produced nothing is not visually demoted

Same face, same ink, same size, same rule weight as a row that produced findings. This
is the whole point of the zone and it is the easiest thing to lose. No badge, no tick,
no muted treatment, no collapsed state, no colour distinction.

### Proof

Two new harness assertions, both proven able to fail and then restored byte-identical.

**G14** reads the zone off the DOM at professional density and joins it to the register
entries. It checks: one row per declared key; every declared key has a row; every row
carries a detector; a condition appears on exactly the check that has one; per-row mark
numbers parse out of the sentence and match the stated count; no mark claimed twice; and
the join — every mark's signal class in the register equals the check that claims it.
The census numerals must equal that same arithmetic.

**G15** checks the register is whole at *consumer* density — a density is a register
over one record, not a way to shorten this list — and that the anatomy hash stamped on
the document is current.

Mutations run, each caught:

| mutation | caught by |
|---|---|
| kit renders only `PRODUCED` rows | G14 `1 rows for 3 declared checks` + G15 `consumer-rows=1/3` |
| swap two checks' marks so totals still close | G14 `mark 1: entry shows Framing Drift, register attributes it to Deflection` |
| edit `ANATOMY.md` without rebuilding | G15 hash mismatch on all four records |

The second mutation matters most: an earlier attempt to add a phantom mark was caught at
build time by generate's own arithmetic, so I designed one where the totals still close
and only the page-level join can see it. It saw it.

### The amendment

`ANATOMY.md` updated once, re-hashed once, and that single hash propagated to all three
directions through the shared fixture and stamped on the document element by the shared
kit. No direction carries its own copy of the anatomy, its version, or its hash.
Invariant 10 proves the three stamps are identical to each other and to the file on disk.

    ANATOMY.md  890405ee90ba55f195672489178a6bb81de48cf0460a530a6576ec926c2c0847

Two corrections rode along in the same amendment: `Z2.4` (census) and `Z6.3` (record
identity) had been rendering in all three directions since earlier passes and were
missing from the document. Both are now recorded, with no change to what renders.
`reader-checks.js` was added to the build's tracked repository inputs, since the
declared checks are joined out of its maps.

---

## 2 · S5 revised — the Register as the instrument-presence mechanism

The brief is right that this is stronger evidence than provenance grammar, and the
reason is specific: **the Register's content cannot honestly exist in the same form if
no governed process ran.** Provenance grammar can be typeset. A row that says
`vg.framing_drift` ran and produced nothing, on a record where another check produced
four findings that are individually walkable to numbered marks, is a shape that a
document-shaped artifact cannot fake without lying about something checkable.

### The five facts that carry it, in every direction

These are the same in A, B and C, because they are record facts rather than treatments:

1. **A check appears that produced nothing.** A decorative register lists what it found.
   This one lists what it ran. The `NO_FINDING` row is the single most load-bearing
   element in the zone, because it is the one no marketing surface would include.
2. **The rows name mark numbers, and the numbers resolve.** `Produced 3 findings: marks
   1, 2, 4.` — the reader goes to marks 1, 2 and 4 in the register beside the source and
   finds three entries whose signal class is Framing Drift. The claim is walkable.
3. **The arithmetic closes in three places at once.** The census numerals, the sum across
   the rows, and the count of classed marks the page actually drew are one number.
4. **The detector ids and versions are real handles.** `vg.omission · 1.0` is the
   instrument's own identifier, not a label chosen for this page.
5. **The condition is specific and asymmetric.** Only omission carries one, and it says
   something a designer would not invent: that an omission has no second end to quote.
   Asymmetry that tracks the instrument is hard to fake and easy to check.

### How the reader verifies them

Without leaving the page: count the rows against the census sentence; take any row's
mark numbers to the numbered entries; check the entries' signal classes agree. Leaving
the page: the detector ids and the anatomy version in `Z6.3` are quotable against the
method layer that `Z7.1` points to.

### Whether it survives the forwarded, static record

**Yes, unchanged, and this is the important part.** Nothing in the zone is live. There
is no fetch, no state, no timestamp that ages, no telemetry, no status light, no
progress metaphor. Every string is in the packet. The zone renders identically in the
forwarded cold state — G14 and G15 run against the built pages, and the forwarded frames
carry the same rows. A record someone was sent carries its own evidence of operation.

This was the failure mode of the pre-Register S5 answer: instrument presence that
depended on the reader having arrived by running something. The Register does not.

### What provenance grammar still does

It does not go away and it is not demoted. It now does a **narrower and better job**:
provenance says what the record's claims *rest on* — what a person reported, what the
page displayed, what the hashes support, what no field determines. Those are four
separate rows precisely because merging any two would state a claim the record cannot
carry.

The division after this pass: **the Register is evidence that a process ran; provenance
is the boundary on what that process establishes.** They answer different questions and
neither substitutes. A reader convinced by the Register that three checks genuinely ran
still needs Z6.2 to know that hash-supported artifact identity does not establish which
model produced the bytes. That is the sentence the Register cannot say.

Nothing was added that the record does not support. No dashboard activity, no telemetry,
no status lights, no progress metaphors, no operational claims.

---

## 3 · Question 8, per direction

> *Where does the Check Register sit in the reading sequence, how prominent is it, and why?*

Each direction's answer is stated in its own source at the point of composition, as the
amended anatomy requires. Contents are frozen and identical; only position and
compositional weight are released.

Deposit at 1440, document offsets:

| | `Z1.4` claim | `Z5.6` applied | `Z3.4` source | `Z5.1` register | `Z6.1` provenance | page |
|---|---|---|---|---|---|---|
| **A** | 330 | **1032** | 1951 | 3313 | 6002 | 6962 |
| **B** | 79 | **1924** | 519 | 1726 | 4072 | 4924 |
| **C** | 177 | **746** | 1672 | 3239 | 5546 | 6351 |

### A — before the source, as a staged beat

Claim, boundary, what was applied, then the answer. A reads in sequence and stages one
beat at a time, so the operation is placed as a beat rather than as apparatus. An
investigative piece establishes its method before it produces the exhibit, and a reader
who meets nine marks without first knowing that the same three checks read every record
has been handed a story instead of a record.

Set as prose, full width, in the record's own voice — deliberately **not** a panel. A
panel here would be the first thing on the page that looked like an instrument readout,
and it would be sitting above the evidence.

**Cost, and it is the largest in the lane:** +722px desktop, +939px mobile on the
claim-to-proof distance, roughly doubling A's gap to 1.62 screens at 1440 and 2.10 at
390. And A buys no first-screen visibility for it — the census closes at 1086px against
a 1000px fold, so the zone is entirely below. What A buys is sequence, and only
sequence. That is a bet; the numbers are its price.

### B — opening the Register, after the source

B keeps the apparatus with the apparatus. The register opens by saying what was applied
and only then itemizes what each mark holds, so the first thing the register asserts is
its own operation rather than its first finding.

B does not hoist it above the source, and the reason is architectural rather than
habitual: B is the only direction that puts marks in a column beside the text, so its
reader is already inspecting after two paragraphs. Moving the zone up would push that
column down and interrupt the one relationship B exists to make — text beside note — to
answer a question B's reader has not asked yet.

**Cost: nothing measurable.** B's six stress frames are unchanged to the pixel. What it
costs is depth: the zone opens 1.9 screens down on Deposit and 1.3 on Montana at 1440,
4.3 and 2.4 at 390. A reader who stops at the source never learns three checks ran.
**B is the only direction that answers the founder's actual objection at zero cost** —
the zone is not buried under provenance, it is the first thing the register says.

### C — in the docket, as caption

C is a docket, and a docket's front matter is the caption: the particulars that identify
the record before its body begins. What was applied to the artifact is such a
particular, and a caption listing the marks but not the checks that produced them is an
incomplete caption.

The discipline that keeps it from becoming a panel: the same ruled row grammar as the
count, the census and the orientation — same label column, same rules, no border of its
own, no ground of its own, no ember. A fourth row-group reads as more caption, not as an
instrument readout.

**What it delivers:** at 1440 the census line closes at 809px inside a 1000px fold, so C
is the one direction where a reader who never scrolls has read that three checks ran and
how many produced findings. The rows are not in that screen, and at 390 none of the zone
is. **Cost:** +733px desktop, +881px mobile, and it spends C's best S6 credential — both
1440 frames leave the first screen.

---

## 4 · The four audiences

| audience | asks | best served | worst served |
|---|---|---|---|
| ordinary reader | *can I understand what Imbas actually checked?* | **C** — the census sentence is the one piece of this zone that reaches a non-scrolling reader, and it is plain English | **B** — 1.9–4.3 screens down; a reader who stops at the source never learns it |
| professional | *can I inspect the operation efficiently?* | **B** — the zone opens the register, so operation and per-mark detail are one continuous read; detector ids sit beside the entries they explain | **A** — the zone is 2,300px above the entries it describes, so joining a row to its marks is a long scroll in both directions |
| journalist / grant reviewer | *was application systematic rather than selective?* | **A** — method before exhibit is exactly this reader's habit, and A is the only direction where reaching a finding requires passing the checks first | **B** — the reader has to be trusted to arrive; nothing structurally prevents reading the marks first |
| investor / institutional | *is this a repeatable governed instrument or one polished document?* | **B**, narrowly — versioned detector ids reading as part of a working surface rather than as a document's front matter | **C** — the docket framing is the most document-shaped of the three, which is the exact suspicion this reader arrives with |

No direction wins twice. That is the honest read, and it is the reason the placement
question does not have one answer.

The tension the table exposes: the ordinary reader and the journalist are served by
*early*, the professional is served by *adjacent to the entries*, and only B's position
is adjacent while only A's and C's are early. A single placement cannot do both, because
the register entries are themselves late by necessity — they follow the source.

The zone did not become dashboard chrome in any direction: no border in C, no panel in
A, no ground of its own anywhere, no colour, no badge, no state.

---

## 5 · A governed repository string that violates the counting doctrine

Reporting, not fixing — repository writes are forbidden in this lane.

`PUBLIC_EXAMPLE.provenance[3].body` in `reader-public-example.js:68`, rendered at `Z6.2`
in all three directions and byte-identical by invariant G6:

> *"Imbas produces no authoritative matched-conditions field and persists none. Nothing
> here satisfies one and nothing here fails one. There is no such determination to read."*

Two problems, both in the record's own voice rather than in quoted artifact text:

1. **`fails`** — the counting doctrine's banned vocabulary. The gate flags it as the
   single `COUNT` finding in each direction, and it is the only `COUNT` hit that survives
   voice-scoping, which is the correct outcome: the rule fires on the record speaking,
   and here the record is speaking.
2. **It denies a misreading by naming it.** *"Nothing here satisfies one and nothing here
   fails one"* teaches the frame it is trying to prevent, against the standing
   composition rule. The third sentence already does the work positively.

The lane cannot correct it. Flagging for a repository pass.

Gate totals are now symmetric across the three directions — 5 distinct findings each,
the same five. The other four are previously reviewed and cleared: `"scored"` in the
Z7.2 numbers-ledger line, and `"withheld"` three times, all in the Deposit record where
a withheld security deposit is the subject matter rather than a motive attributed to a
model.

---

## 6 · State of the checks

    generate      BUILD OK · 629 strings linted · 0 violations (check-vocab.v1)
                  21 governed strings, all byte-identical
                  fixture.data.js  864f74507d2c9aef49ca9f776200cef45eefadf5b433ae7465e18113da27a88e
                  ANATOMY.md       890405ee90ba55f195672489178a6bb81de48cf0460a530a6576ec926c2c0847
    harness       180 checks · 0 failures        (15 assertions × 3 directions × 4 records)
    contrast      59 colour pairs · 0 below threshold · 0 zone measurements below threshold
    entry-fold    18 entry screens · 0 with a route past the fold
    copy          192 strings · 0 vocabulary violations · 2 pre-existing DENIAL shapes
    gate          72 pages · 15 findings (5 per direction, symmetric — §5)
    capture       72 frames · 24 parity rows · 0 mismatches
    stress        18 frames · 13 where the first proof sits past the first screen
    renderer      Google Chrome for Testing 148.0.7778.96 (project-owned)

The repository lint is imported and run unmodified over every rendered user-facing
string. Everything runs offline from the filesystem; no CDN, remote font, remote script,
analytics, API call or network asset, and no font file was downloaded, copied or bundled.

---

## 7 · Repository state

No branch, no commit, no PR, no `npm install`, no `npm ci`, no repository write.

    HEAD           251759b08d97c9a71c4bf0ab191b4a6410e789c7  (master, unchanged)
    index vs HEAD  0b85a330d5a34614cb7aec58b79cd1a445bebb5f == 0b85a330d5a34614cb7aec58b79cd1a445bebb5f
    git status     M package-lock.json
                   M package.json

**`git status --short` is not empty, and it was not empty when this lane started.**
Reporting rather than touching it, per the working tree guard.

Evidence:

- The lane's **first command**, `2026-08-07T02:03:09.601Z`, five seconds after session
  start, recorded exactly these two files as modified under the same HEAD. State is
  identical now. Twelve `git status` calls across the session, all the same.
- The files' mtime is **2026-08-06 17:39 EDT = 21:39 UTC**, four hours and 24 minutes
  before this session's first event (`2026-08-07T02:03:04.515Z`).
- Across every session log on this machine, **zero** Bash invocations ran `npm` with cwd
  at the main checkout.
- Content: a single added devDependency, `"playwright-core": "^1.60.0"`, plus its
  lockfile entries. The working-tree `package.json` is **byte-identical** to the version
  on `refs/heads/claude/beautiful-lederberg-997907` — so the main checkout's working tree
  carries that branch's content, unstaged, under master's HEAD.
- Nothing is staged. The index matches HEAD's tree exactly, at lane start and now.

I have not attributed this to any actor. It predates the lane, the lane did not cause
it, and the lane did not touch it.

---

## What was not done

No rename. AP3 not implemented. A, B and C not synthesized and no fourth direction. No
check or suite behavior invented. The anatomy freeze modified exactly once, in one file,
re-hashed once, propagated from that single recomputation, and recorded in the amendment
log.

Two placement questions are left open for a founder ruling rather than settled here:
whether A and C should move `Z5.6` to B's position now that its cost is measured, and
whether the `Z6.2` string in §5 gets a repository pass.
