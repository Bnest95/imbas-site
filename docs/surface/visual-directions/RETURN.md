# Imbas visual direction lane — return

Three directions on one record anatomy. Scratch work only; nothing was written to the
repository.

**Everything is at** `/Users/brendan/Documents/Claude/scratch/imbas-visual-directions/`
**Start at** `compare/index.html` — open it in a browser, no server needed.

---

## 1 · Identity block

```
repository        /Users/brendan/Documents/Claude/Projects/imbas-site
branch            master
HEAD              251759b08d97c9a71c4bf0ab191b4a6410e789c7
                  "Merge pull request #79 from Bnest95/claude/serene-mayer-15ec66"
git status        M package-lock.json
                  M package.json
index vs HEAD     git write-tree      0b85a330d5a34614cb7aec58b79cd1a445bebb5f
                  HEAD^{tree}         0b85a330d5a34614cb7aec58b79cd1a445bebb5f   equal
branches created  none
commits           none
PRs               none

renderer          Google Chrome for Testing 148.0.7778.96
                  chromium_headless_shell-1223, project-owned, reached in place
driver            playwright-core 1.60.0, from the repository's node_modules
```

**On the two modified files.** `package.json` and `package-lock.json` were already
modified when this lane began — they are the project-owned `playwright-core` devDependency
install, which the brief instructs me to use. I did not run `npm install`, `npm ci`, or
any other command that writes to the repository. The index-versus-HEAD tree comparison
above is the proof that nothing else moved: the tree the index would write is byte-identical
to HEAD's tree. The working tree ends exactly as I found it.

**Repository inputs, read only, hashed at read time:**

```
reader-public-example.js   9cc1de52041d23498e811dd6a2931d79a5175630630c8a9f15451a14c5e38a86
reader-result.js           3949cd04913e9fa947000ed6b999d6e4641bec4032bd9e32d3829931b3135e65
reader-check-vocab.js      675264071cf3398228037145724cb7ae872d247cbb888c23d89a81b28a2b45b9
styles.css                 490bf78599fce4e7a6c0f9a7d8bba69344b67c87dbf8431c28b3afdddc00ffdd
```

---

## 2 · The anatomy, and the freeze

`ANATOMY.md` — `record-anatomy.v1`. Eight zones, each named with the content it holds, and
eight invariants. It holds for four record classes, for dramatic and quiet findings, and at
one finding and at nine, because all four are built and all four are rendered by all three
directions.

```
Z1  record head        class, context, address, finding sentence, scope
Z2  the count          count line, rule, orientation
Z3  the source         question, role labels, capture shape, the answer, second artifact,
                       expectation
Z4  the findings layer in-document marks, out-of-document block, mark detail
Z5  Check Register     heading, density control, entries, fields, close
Z6  provenance         heading, rows
Z7  record foot        read again, run your own, version
Z8  reader entry       paste field, action, recorded pair, arriving
```

**Frozen files and their hashes:**

```
ANATOMY.md              68bc34c86de7c3bd8519ffbbaf4469b35d40765532b901655dca3daaaa0d28db
shared/fixture.mjs      479db83a306268eafb489e648f15b79c280112e214abc2c14fdf741924977fe7
shared/fixture.data.js  ac25382400662a1669c133132cf77f85349c6c456dde91586c5262b020b65312
shared/tokens.css       f6774ed83b09c97c26703d75acaf728de9d35f5806af0e82465aab3cbca6256b
```

Per-record hashes are in `HASHES.json`. The four records:

```
montana   1 mark   GOVERNED PUBLIC EXAMPLE    record-level absence only, two artifacts
furnace   3 marks  USER-SUPPLIED RUN          one capture, no second artifact
deposit   9 marks  PROTOCOL-MEASURED CASE     all three anchor modes, quiet register
website   5 marks  ADHERENCE RECORD           expectation anchor, no record-level absence
```

**Proof all three directions consume the frozen files.** Every one of the six pages loads
the same three shared files and nothing else:

```
a/record.html  b/record.html  c/record.html      ../shared/tokens.css
a/entry.html   b/entry.html   c/entry.html       ../shared/fixture.data.js
                                                 ../shared/kit.js
```

and `G5 no direction holds a local copy of a record string` passes for all three, which is
the stronger form of the same claim: it fails if any direction hardcodes a string the
fixture owns.

**Freeze amendment, declared.** The fixture was regenerated once after the freeze, to fix
four strings the positive-framing sweep and the gate found. The hashes above are
post-amendment; the pre-amendment fixture hash was
`c64c162f9ac920155bf598a1203b20992ae1eba937479bfd7c00a4b1aaf86375`. The freeze's purpose —
all three directions consume the same files — holds across the amendment, because
regeneration rewrites the one generated file all three read.

---

## 3 · Connective copy, and the lint

`shared/copy-inventory.json` holds three separate lists, as asked.

```
lint module      /Users/brendan/Documents/Claude/Projects/imbas-site/reader-check-vocab.js
lint version     check-vocab.v1        imported unmodified via createRequire
strings checked  168
violations       0

connective copy            112 strings     every word this lane wrote
governed source strings     25 strings     quoted from reader-public-example.js
authored record content     31 strings     the marks and finding text this lane authored
```

The repository lint also runs inside the harness against the rendered DOM
(`G8`, 503 strings, 0 violations) — so the lint passes both on the fixture and on what
actually reaches the screen.

### The positive-framing sweep

Standing rule: state positively what the record is, carries and supports; do not deny a
misreading by naming it. The inventory is swept for the shapes a denial takes.

**Four strings were found and rewritten.**

| where | was | now |
|---|---|---|
| `ui.nav.lane_tag` | "VISUAL DIRECTION · SCRATCH · NOT A PRODUCT SURFACE" | "VISUAL DIRECTION · SCRATCH · FOR REVIEW" |
| `furnace.provenance.fixture_notice` | "…written by hand. No detector ran." | "…written by hand, and every field on the record comes from the review fixture." |
| `deposit.provenance.fixture_notice` | "…written by hand. No detector ran and no case was scored." | same as above |
| `website.provenance.fixture_notice` | "…are authored. No instruction-set artifact role exists in production and no expectation anchor is resolved by any Imbas code." | "…are authored. The adherence class and its expectation anchor live in this lane, so the anatomy can be tested against an assignment." |

**The sweep itself had a hole, and that is worth more than the four fixes.** The first
version swept only the shared `BOUNDARIES` constant and the global UI strings — 83 strings.
The three provenance denials live on the individual records, which it never looked at. They
were caught by the *gate* sweeping the rendered DOM, not by the copy sweep reading the
fixture. The copy sweep now covers per-record provenance, register close and capture shape:
**112 strings, 29 more than before.** Re-tested against the three original strings, it
catches all three.

**Two remaining hits, screened and kept** — the same string reached by two paths:

> `ui.z2.orientation` and `FIRST_RUN_LINE` — "Each mark points at something in this answer,
> or at something that isn't in it. Imbas records what was there and what wasn't."

This matches the pattern on `isn't` and `wasn't`, and it is not a denial. It states the
subject matter of a mark — a mark points at presence or at absence — rather than denying a
reader's misreading. Absence is the thing Imbas measures; a rule that forbids naming it
would forbid the product. Kept deliberately.

### Copy-freeze conflict with the prototype

The prototype's `USER_SUPPLIED_RUN` boundary reads "…not evidence by themselves." That is
a denial by construction and the standing rule forbids it, so the fixture states the same
scope positively instead. **Reported as a conflict; the brief's rule governed.**

---

## 4 · Grammar assertions

One shared harness, `build/harness.mjs`. Eleven assertions × three directions × four
records where a record is involved.

```
G1   required zones render                                   a:pass  b:pass  c:pass
G2   count equals marks equals register entries              a:pass  b:pass  c:pass
G3   anchor modes use only their authorized channel          a:pass  b:pass  c:pass
G4   record-level absence stays outside the document         a:pass  b:pass  c:pass
G5   no direction holds a local copy of a record string      a:pass  b:pass  c:pass
G6   governed strings render byte-identical to the packet    a:pass  b:pass  c:pass
G7   source text renders exactly                             a:pass  b:pass  c:pass
G8   rendered strings clear the repository lint              a:pass  b:pass  c:pass
G9   every mark is keyboard reachable and announces state    a:pass  b:pass  c:pass
G10  density adds fields and never changes entries           a:pass  b:pass  c:pass
G11  reduced motion changes no rendered evidence             a:pass  b:pass  c:pass

132 checks · 0 failures
```

G3 is the authority rule in machine form. One channel per anchor mode, and a direction
states the mode by *where the mark cannot go*:

```
QUOTED_SPAN            in-document-span
PASSAGE_CONTEXT        in-document-region
RECORD_LEVEL_ABSENCE   out-of-document
```

---

## 5 · The three directions

Every direction answers all seven points differently. No two answer any four the same way —
the closest pair is A and C, which differ on all seven.

### A · Investigative Cinematic — `a/record.html`, `a/entry.html`

| | |
|---|---|
| **source position** | follows the masthead as a full-width stage, one column, no rail |
| **findings voice** | sequential — the mark opens in place, directly under the block it sits in |
| **anchor modes** | span: ember rule under the characters, numeral in the line's margin · region: the region keeps its light while the rest of the block steps down · absence: a full-bleed band after the source column has closed |
| **first viewport** | the masthead alone, at display scale |
| **density** | the register entry expands in place onto a labelled field rail |
| **mobile** | the same descent, narrower; the detail panel stays in place |
| **forwarded** | the forwarded line joins the masthead composition as its first line |

**Separability.** Take without taking the rest: the display-scale finding sentence as the
record's first line; the stepped-down ground as a region treatment; the full-bleed
out-of-document band; the in-place mark opening. Leave behind: the 74vh entry stage, the
one-column descent, the masthead composition.

### B · Editorial Instrument — `b/record.html`, `b/entry.html`

| | |
|---|---|
| **source position** | a left column running beside a findings rail, both live from the first pixel |
| **findings voice** | simultaneous — every in-document mark has a standing entry in the right rail, level with its block; opening one raises it, it never appears |
| **anchor modes** | span: tinted ground on the characters, numeral in the column gutter · region: a rule down the gutter for the region's whole height · absence: a block below both columns, where the rail has already ended |
| **first viewport** | a ruled header strip and then the instrument, already working |
| **density** | the rail entry grows field rows in place; the column does not move |
| **mobile** | the rail dissolves and each entry inlines under the block it belongs to |
| **forwarded** | a strip fixed to the top of the viewport, carried the whole way down |

**Separability.** Take: the standing rail entry level with its block; the gutter numeral;
the rail-dissolves-to-inline mobile rule; the sticky forwarded strip. Leave behind: the
two-column shell, the header strip, the tinted span ground.

### C · Forensic Manuscript — `c/record.html`, `c/entry.html`

| | |
|---|---|
| **source position** | an exhibit — an inset bordered plate with a pointing gutter, set mid-page, reached only after the record's own docket |
| **findings voice** | an apparatus below the plate. Nothing but a reference numeral ever touches the document; the reading happens off it |
| **anchor modes** | span: a fine dotted underline on the characters and a raised numeral · region in prose: a hairline outline drawn around the run · region in code: a bracket in the gutter spanning the region's lines · absence: a second plate with no gutter — a plate that cannot point |
| **first viewport** | a ruled docket table. No display type anywhere; the finding sentence is a row in the table like every other fact about the record |
| **density** | the register changes container: plain keeps the plate's measure and drops every rule, full breaks out to a wide ruled ledger |
| **mobile** | the plate keeps a narrower gutter; docket and ledger stack to lists |
| **forwarded** | one more ruled row stamped into the docket, formally identical to the rest, because for this direction it is one more fact of filing |

**Separability.** Take: the docket table as a record head; the gutter bracket for code
regions; the plate-with-no-gutter for record-level absence; the density-changes-container
rule. Leave behind: the inset plate, the absence of display type, the apparatus-below-the-plate
position.

### Where they genuinely differ

| | A | B | C |
|---|---|---|---|
| source position | after the head, full width | left column, from pixel one | inset plate, mid-page |
| findings voice | sequential, in place | simultaneous, standing rail | apparatus, off the document |
| span channel | rule under characters | tinted ground | dotted underline |
| region channel | surrounding ground steps down | gutter rule | hairline outline / gutter bracket |
| absence channel | full-bleed band | block below both columns | second plate, no gutter |
| first viewport | display-scale masthead | working instrument | ruled docket table |
| density | field rail in place | rows grow in place | container changes |
| mobile | same descent, narrower | rail dissolves to inline | stacks to lists |
| forwarded | first line of the masthead | fixed strip, carried down | one more docket row |

---

## 6 · Screens and the capture manifest

`screenshots/` — 66 PNGs. `screenshots/MANIFEST.json`.

```
renderer            Google Chrome for Testing 148.0.7778.96
executable          ~/Library/Caches/ms-playwright/chromium_headless_shell-1223/
                    chrome-headless-shell-mac-arm64/chrome-headless-shell
desktop viewport    1440 × 1000 CSS px
mobile viewport     390 × 844 CSS px
device scale factor 1
colour scheme       dark
full page           true
settle conditions   load · html[data-ready="true"] · document.fonts.ready · fixed timer
settle_ms           900
launch args         --allow-file-access-from-files --font-render-hinting=none
                    --force-color-profile=srgb
network             none — every asset is a local file
```

Each frame records order, name, url, viewport, viewport_px, device_scale_factor, full_page,
document_height_css_px, motion, settle_ms, settle_conditions, bytes, sha256, and its
direction / screen / subject / state.

**Parity is generated, not checked by eye.** `build/matrix.mjs` emits one list of 13 rows
for all three directions, so a row cannot exist for one direction and not another.
`build/capture.mjs` then asserts it anyway: every row × viewport must exist for all three
with identical viewport_px, motion, full_page and device_scale_factor.

```
66 frames · 22 parity rows · 0 mismatches
```

Coverage: reader entry × 3 states × 2 viewports · all four records complete × 2 viewports ·
one expanded finding × 2 viewports · Check Register at consumer and professional density ·
the record forwarded cold × 2 viewports · reduced motion for one record and one entry state.

---

## 7 · The founder comparison surface

`compare/index.html`

One selection drives all three panes. Controls are the axes the brief named: screen,
record or entry state, expanded finding, density, viewport, motion. Labels only — no
analysis, no ranking, no recommendation, no fourth thing on the page. Controls disable
what was never captured rather than hiding it, so the whole matrix is visible along with
where it stops. State round-trips through the URL.

**Two modes, because neither answers both questions.**

- **live** — the real page in the real viewport, so sticky positioning, `100vh` and every
  interaction behave exactly as they do standalone. Panes scroll independently.
- **frames** — the captured full-page images, scroll-synchronised, so the whole record can
  be walked down at the same place in all three.

**A decision the brief left unresolved.** The brief requires synchronised *selection*, and
that is implemented. Synchronised *scrolling* in live mode is not, and the reason is a
conflict: B's masthead is `position: sticky` and A and C use `min-height: 100vh`. Sizing an
iframe to full document height — the only way a `file://` parent can drive a child's scroll —
would break sticky and misrepresent `100vh`. I chose fidelity in live mode and added
frames mode where scroll sync is possible and costs nothing.

---

## 8 · The 34-point gate

Full working in `GATE.md`. Machine half in `build/gate.mjs` — 66 pages swept in the governed
renderer with every expandable finding opened first.

```
                              pass   partial   fail
A · Investigative Cinematic     33      1        0
B · Editorial Instrument        33      1        0
C · Forensic Manuscript         33      1        0
```

**The one shortfall, identical in all three: AP3 · every mark at equal weight.**

Every in-document mark is drawn at the same visual weight, deliberately, because P3 requires
a flat register and AP24 forbids marking selectively where it is dramatic. The density
control changes the *fields per entry*; it does not change the *number of marks drawn*. On
the nine-mark record there is no reader-controlled way to quiet the mark layer — which is
exactly the Simple Markup affordance Word added to fix this in Track Changes.

The mitigation each direction has is the finding sentence: the reader learns how many marks
there are and how they divide before entering the mark layer. That is not the affordance
AP3 asks for.

The fix is available and unbuilt, and it is compatible with P3 and AP24 because the *reader*
chooses to collapse rather than the record choosing which marks to show. It belongs in
`ANATOMY.md` and the kit, where all three would inherit it at once. **This is the largest
open decision in the lane.**

**Machine sweep results.** Across 66 pages per direction, the forbidden lexicon and glyph
set return four distinct findings each, all screened and kept:

- `"scored"` in "500 recorded captures across 4 models on 50 cases, 37 of them scored" —
  a sample-size statement of the kind P4 and AP17 require, not a score for the record on
  screen.
- `"withheld"` ×3 in "security deposit withheld" and mark 9's body — the landlord withholds
  the deposit. It is the case's subject matter and attributes nothing to a model.

Zero hits for verdict language, numeric compression, urgency, fake precision, borrowed
authority, leaderboard framing, chatbot framing, silent correction, alarm register, and
every verdict glyph.

**Palette containment: 0 off-palette colours in any direction** (45 / 49 / 35 distinct
rendered colours for A / B / C). Every colour that reaches the screen composites from the
token closure. This is the structural guarantee behind AP5 and AP4: a severity ramp or a
traffic light cannot be introduced without a colour outside the umber tokens.

---

## 9 · Measured contrast

`shared/contrast-report.json`. Measured in the governed renderer across four records × two
viewports at `density=professional&open=1`, worst value kept. WCAG 2.2 AA: 4.5:1 small
text, 3:1 large text, 3:1 non-text ink.

```
zone                                    A       B       C
Z1.1  record class label              5.88    5.88    5.88
Z1.2  record context                 12.34    9.08    9.08
Z1.3  metadata · address              6.96    6.96    6.96
Z1.4  finding sentence               18.07   18.07   18.07
Z1.5  scope boundary                 12.34    6.96   12.34
Z2.1  count line                     18.07   18.07   18.07
Z2.2  count rule                      6.96    6.96    6.96
Z2.3  orientation                     9.08    9.08    9.08
Z3.1  source · question               5.71    5.71    4.61
Z3.2  source · role label             5.71    5.71    4.61
Z3.3  source · capture shape          5.71    5.71    4.61
Z3.4  source · primary reading text   5.71    5.71    4.61
Z3.5  source · second artifact        5.71    5.71    4.61
Z3.6  source · expectation            5.71    5.71    4.61
Z4.2  findings · out-of-doc block     5.88    5.88    4.82
Z4.3  findings · out-of-doc rule     18.07   18.07   14.82
Z4.4  findings text                   4.68    4.61    4.82
Z5.1  register · heading             14.82   14.82   18.07
Z5.2  register · density control     10.12   10.12   12.34
Z5.3  register · entry                4.82    4.82    5.88
Z5.4  register · field                5.71    5.71    6.96
Z5.5  register · close                5.71    5.71    6.96
Z6.1  provenance · heading           18.07   18.07   14.82
Z6.2  provenance · row                6.96    6.96    5.71
Z7.1  foot · read again               6.96    6.96    6.96
Z7.2  foot · run your own             6.96    6.96    6.96
Z7.3  foot · version                  6.96    6.96    6.96

treatment                               A       B       C
focus ring                            4.82    3.90    3.90
QUOTED_SPAN · marked text            14.82    9.32   11.98
QUOTED_SPAN · mark ink                4.82    5.08    3.90 / 6.53
PASSAGE_CONTEXT · marked text         9.32    9.32   11.98
PASSAGE_CONTEXT · mark ink            4.13    3.67    3.90
RECORD_LEVEL_ABSENCE · numeral        5.88    6.53    4.82
RECORD_LEVEL_ABSENCE · entry text     6.01    4.61   10.12

59 distinct colour pairs · 0 below threshold
```

**Seven real failures were found and fixed**, all in the anchor treatments and the mark
apparatus: A's detail numerals (3.03), A's detail mode and label text (3.59), A's region
rule (2.31), B's note numerals (3.90 against a 4.5 threshold), B's open-span numeral (2.31)
and hairline (1.75), and C's prose-region outline (1.97).

**Two bugs in the measurement itself, worth naming** because both produced confident wrong
numbers:

- The first probe keyed on `[data-detail="materiality"]`, an attribute that exists nowhere
  in the codebase, and silently fell through to the first `<p>` it found — a mono label,
  not findings body text. C was missing two rows entirely and nobody would have noticed.
  Rewritten as a sweep over `data-zone`, which `shared/kit.js` stamps uniformly across all
  three directions, keeping the worst text leaf per zone.
- The focus ring was composited over the element's own fill, reporting B at 2.31. But
  `outline-offset` is positive, so the ring is drawn *outside* the border box on the
  parent's ground. B's real focus ring is 3.90 and passes.

---

## 10 · Every palette failure

The palette is locked and was pushed until it broke. Measured ink-on-ground ratios:

```
ink              bg-base  bg-surface  bg-elevated  bg-lift
ember               4.82        3.90         3.03      2.31
ember-soft          6.57        5.31         4.13      3.15
ember-bright        8.08        6.53         5.08      3.87
ink-muted           5.71        4.61         3.59      2.73
ink-secondary       7.44        6.01         4.68      3.56
ink-soft           10.12        8.18         6.36      4.84
line-strong         2.44        1.97         1.53      1.17
line-luminous       3.37        2.72         2.12      1.61
```

**Three zones where the palette fails, stated as limits rather than as a proposed
replacement:**

1. **The line family can divide but cannot mark.** No rung of `--line-faint` /
   `--line-soft` / `--line-strong` / `--line-luminous` reaches the 3:1 non-text threshold
   on any ground above `--bg-base`. The best case, `--line-luminous` on `--bg-base`, is
   3.37 and falls to 2.72 one rung up. A rule can separate two regions; it cannot carry a
   mark the reader has to find. This is what forced C's prose-region outline into ember: a
   rule the reader has to hunt for is not a mark.

2. **`--ember` clears 4.5:1 for text only on `--bg-deep` and `--bg-base`.** At 3.90 on
   `--bg-surface` and 3.03 on `--bg-elevated` it is large-text-and-non-text only. Every
   small ember numeral in this lane sits on `--ember-bright` for that reason.

3. **`--ink-muted` clears 4.5:1 only through `--bg-surface`**, at 4.61 — and the
   repository's own `:root` comment already scopes it to placeholder and disabled use.

**The rule adopted from this, and where it bit.** On `--bg-elevated` and above, neither
`--ink-muted` nor `--ember` is available for text. That is what stopped B's span ground
ladder at `--bg-elevated`: the next rung up is the first ground on which neither the ember
family nor the muted ink can carry the numeral, so a third step would have bought a little
more depth and lost the address.

Nothing here proposes a replacement palette. The umber system holds every zone in all
three directions; it runs out of room specifically in the mark apparatus on raised grounds.

---

## 11 · Reference-versus-grammar conflicts

Every one resolved for the grammar, as the authority rule requires.

1. **Track Changes semantics.** The visual convention is the most familiar marking grammar
   available and every direction was pulled toward it. All three refuse it: no insertion
   caret, no strikethrough, no suggested replacement, no "should have appeared here". A
   mark is an observation, never a requested edit.

2. **Record-level absence has no site in the document.** The reference corpus marks at the
   site; record-level absence has no site. Rather than inventing an insertion location,
   each direction gives it a channel that structurally cannot point — A's full-bleed band
   after the column closes, B's block below both columns where the rail has ended, C's
   second plate with no gutter. `G4` enforces it.

3. **Source text stays exact under responsive reflow.** Reflow changes line breaking; it
   changes no character. `G7` compares the rendered text to the fixture and passes at both
   viewports.

4. **The prototype's denial-shaped boundary copy.** `USER_SUPPLIED_RUN` reads "…not
   evidence by themselves." The brief's standing composition rule forbids that shape. The
   brief governed; the fixture states the scope positively.

5. **AP3 versus P3/AP24**, the one that does not resolve cleanly. AP3 wants
   reader-controlled mark density; P3 and AP24 want a flat register applied uniformly.
   Recorded as an open decision above rather than resolved by wording.

---

## 12 · Decisions the brief left unresolved

1. **Synchronised scrolling in the comparison surface's live mode** — the brief requires
   synchronised selection, not scrolling. Resolved as fidelity in live mode plus a frames
   mode where sync is free. §7.

2. **Reader-controlled mark density** — the AP3 gap. Left unbuilt and reported rather than
   guessed at, because it is an anatomy change all three would inherit. §8.

3. **Where per-mark attribution belongs by density** — `declared_by` renders at professional
   density only. At consumer density a mark shows what it points at, the record-level rule
   where one applies, and the governed quotation, so nothing is unsourced; but the sentence
   naming who declared each field is a professional-register field. A defensible reading of
   the brief's "two registers, one record", not a derived requirement.

4. **The entry fold** — "neither of the first two may obscure the other" does not say
   whether below-the-fold counts as obscuring. Read strictly: both routes must break the
   first screen. `build/entry-fold.mjs` measures it. A's entry stage was `min-height: 100vh`
   and put whichever route sat below it one pixel past the fold in both governed states; it
   now stops at 74vh. **18 entry screens, 0 with a governed route past the fold.** The
   screenshot alone did not catch this — the measurement did.

5. **A's entry composition versus a locked product decision.** `CLAUDE.md` locks "the paste
   box leads the workbench, with one flagship example as the quiet secondary." A's empty
   state inverts that: the recorded pair takes the stage at display scale and the paste
   field takes the descent below it. The brief says current Workbench composition is not
   authority and to anchor to nothing, so A takes the inversion deliberately — but it is a
   real departure from a locked decision and is flagged here rather than buried. B and C
   both keep the paste route at or above the recorded pair.

6. **Marks as `<span role="button">` rather than `<button>`** — a real `<button>` would
   make the source text inside it unselectable in this renderer, and the brief requires
   selectable source text. Keyboard operability is preserved and `G9` proves it.

---

## 13 · The risk direction

**A · Investigative Cinematic is the risk.**

**What it bets on.** That a plainly-worded, scoped sentence set at display scale on
near-black ground reads as a syllabus head rather than as a campaign — that a record can
raise its voice typographically without raising it rhetorically.

Every other decision in A follows from that one. The masthead alone in the first viewport,
the full-bleed band for record-level absence, the sequential mark opening down a single
column: all of them assume the reader will take display scale as emphasis-of-structure
rather than emphasis-of-claim.

**How it could be wrong.** If the display-scale finding sentence reads as a headline, A has
built AP1 — the verdict dek — out of typography rather than out of words. The lexicon sweep
cannot catch that, because the words are scoped and lint-clean. It is a failure only a human
reader can call, and it is the one failure mode B and C are structurally incapable of: B
sets the finding sentence inside a ruled header strip at working scale, and C sets it as a
row in a docket table with no display type on the page at all.

That asymmetry is the point. **A is the direction that could be wrong. B and C are
directions that could be dull.**

---

## 14 · What to look at first

```
compare/index.html                      the comparison surface — start here
  screen: record · montana              the governed packet, one record-level mark
  screen: record · deposit              nine marks, all three anchor modes
  screen: record · deposit · density    consumer against professional
  screen: reader entry · nothing to paste   the three directions' entry bets
  mode: frames                          walk all three down together

ANATOMY.md                              the shared anatomy
GATE.md                                 34 checks × 3 directions, in full
shared/copy-inventory.json              connective copy, separate from governed strings
shared/contrast-report.json             every measured ratio
screenshots/MANIFEST.json               66 frames, hashed, parity asserted
```

No repository write. No branch. No PR. The working tree is as I found it.
