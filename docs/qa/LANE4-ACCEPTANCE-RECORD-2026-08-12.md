# Lane 4 acceptance record — composition build

**Tree.** `7d2d5c2` on `claude/lane4-composition-build`, branched from `4f7b239`.
**Written.** 2026-08-12, after the founder gate on PR #92.
**Status.** Documentary. This file records measurements and rulings. It authorizes nothing,
relaxes nothing, and introduces no tolerance.

Git stamps this branch's commits in local time and reads 2026-08-12. The harness stamps its
own evidence in UTC and reads 2026-08-13. Both appear below, each in the form the tool that
wrote it used.

## What governs

Where a pushed commit message on this branch states a claim in a broader form than the form
recorded here, **the form recorded here governs.** This lane rewrites no pushed commit
message, so both forms stay readable and the narrower one rules. Two places apply, and both
are in the pushed message at `7d2d5c2`: §2.4 for the renderer-identity claim, §2.6 for the
count of frames that moved.

---

## 1. The eight-state comprehension floor

`scripts/qa/comprehension.mjs` measures production against the frozen after column of
`COMPREHENSION-RETURN.md` §2 in the read-only scratch reference. It photographs nothing, it
writes no baseline, and it compares no bytes. It reports seven numbers per state and sets
them beside the floor.

### 1.1 The table, as the instrument printed it

```
state                              blocks            finding px         answer px            mark px         in screen            c→p px             screens
montana 1440 as it opens     3 / 3  meets   100 / 22  *stand-in  224 / 386  meets   235 / 852  meets  yes / yes  meets  123 / 364  meets  0.12 / 0.36  meets
montana 390 as it opens      3 / 3  meets    76 / 23  *stand-in  206 / 402  meets  217 / 1007  meets  yes / yes  meets  129 / 379  meets  0.15 / 0.45  meets
deposit 1440 as it opens     3 / 3  meets   100 / 22  *stand-in  236 / 426  meets   365 / 541  meets  yes / yes  meets  135 / 404  meets   0.14 / 0.4  meets
deposit 390 as it opens      3 / 3  meets    76 / 23  *stand-in  218 / 430  meets   450 / 858  meets  yes / yes  meets  141 / 407  meets  0.17 / 0.48  meets
montana 1440 forwarded cold  5 / 7  meets   103 / 97  *stand-in   — / 493  no ref    — / 959  no ref   — / yes  no ref   — / 397  no ref     — / 0.4  no ref
montana 390 forwarded cold   5 / 7  meets  103 / 180  *stand-in   — / 612  no ref   — / 1217  no ref   — / yes  no ref   — / 433  no ref    — / 0.51  no ref
deposit 1440 forwarded cold  6 / 7  meets   178 / 97  *stand-in  394 / 533  meets    — / 648  no ref  yes / yes  meets  215 / 437  meets  0.22 / 0.44  meets
deposit 390 forwarded cold   6 / 7  meets  194 / 204  *stand-in  485 / 664  meets   — / 1093  no ref  yes / yes  meets  292 / 460  meets  0.35 / 0.55  meets
```

### 1.2 Working figures

```
state                               scenario  origin  scrollY  pinned  above  region h
montana 1440 as it opens     single-findings    1404     1320      77     32      4033
montana 390 as it opens      single-findings    1404     1318      79     25      5345
deposit 1440 as it opens     deposit-fixture    1404     1320      77     32      4915
deposit 390 as it opens      deposit-fixture    1404     1318      79     25      6983
montana 1440 forwarded cold     share-single     107        0      77     10      1981
montana 390 forwarded cold      share-single     104        0      79      3      2527
deposit 1440 forwarded cold     share-legacy     107        0      77     10      1447
deposit 390 forwarded cold      share-legacy     104        0      79      3      1817
```

### 1.3 The verdict, and what it covers

The four gated columns are `blocks`, `answer in first screen`, `claim→proof px`, and
`screens`. **Every cell with a production referent meets or beats its frozen floor cell**,
on all eight states, with no cell exempted and no state dropped.

`claim→proof px` carries the argument on its own terms: it is a difference between two
offsets, so the origin mapping cancels out of it entirely and it compares to the floor with
no mapping argument at all. On the four runner arrivals it runs roughly three times better
than the floor.

`blocks_before` reads 3 on all four runner states, which is the composition's own claim
measured back: three blocks, and then evidence.

**Reproducibility.** Three consecutive probe runs printed identical numbers — two during the
build, and one at the founder gate on 2026-08-13T02:52Z against the same tree. The
instrument exits 0.

### 1.4 `finding px` — a ruled non-comparable cell

**FOUNDER RULING.** Keep the production composition. Do not add a prose claim headline to
reproduce direction B's referent; that would bring the implementation to the floor rather
than measure it. Record this cell as non-comparable.

**Why the cell is non-comparable, stated once.** The floor's `finding px` column measures the
offset of direction B's **Z1.4** — `el("h1", {zone: "Z1.4", text: rec.finding_sentence})`, a
*prose claim headline* reading, for the deposit record, "Nine marks sit on this answer. Five
point at wording it carries, and four at terms it does not." B placed that headline **above**
its arithmetic count line, Z2.1, "9 marks on this record".

Production inverts the order and carries no prose claim headline at all.
`.wb-result-hero__estimate` holds the arithmetic ("9 candidate items surfaced" — B's Z2.1),
and `.wb-result-hero__summary` holds a sentence saying what the count counts. Neither element
is Z1.4. The frozen instrument therefore measures a thing production deliberately does not
contain, and **the arithmetic count is not a semantic substitute for it.**

**The measurements stay, as the demonstration of non-equivalence.** They are measured and
printed, and they are unscored. They are not a pass, not a miss, and not a defect deferred.

| state | element measured | observed px | floor cell |
|---|---|---|---|
| montana 1440 as it opens | `.wb-result-hero__summary` | 100 | 22 |
| montana 390 as it opens | `.wb-result-hero__summary` | 76 | 23 |
| deposit 1440 as it opens | `.wb-result-hero__summary` | 100 | 22 |
| deposit 390 as it opens | `.wb-result-hero__summary` | 76 | 23 |
| montana 1440 forwarded cold | `.insp-glance__orientation` | 103 | 97 |
| montana 390 forwarded cold | `.insp-glance__orientation` | 103 | 180 |
| deposit 1440 forwarded cold | `.wb-reader-result__archival-notice` | 178 | 97 |
| deposit 390 forwarded cold | `.wb-reader-result__archival-notice` | 194 | 204 |

**The remap analysis stays too, because it is what proves the cell cannot be rescued by
re-pointing it.** Remapping Z1.4 onto production's count line does not close the gap: the
count line's own first character sits at 46 at 1440 and 35 at 390, against floor cells of 22
and 23. The mechanism is the result section's own top padding, measured exactly — at 1440 the
count block is top 46, height 44, margin-bottom 8, which puts the summary's first character
at 100; at 390 it is 35 + 32 + 8, which puts it at 76.

So the column has no like-for-like element at either end. Scoring it would report a mapping
difference as a regression, and remapping it would report a different element as though it
were the floor's.

### 1.5 The empty `first mark px` cells — the same ruled treatment

Four cells carry no production referent for `first mark px`: all four forwarded states. They
receive the same treatment as §1.4 — measured where measurable, recorded, unscored — and this
section records them **against the actual cause in those acceptance states.**

**The cause.** The forwarded record presented to that production rendering path has no
renderable source body in which positioned marks can exist. That resolves two ways, and both
are here because the two forwarded compositions differ:

- **`share-single` (P4), the montana forwarded states.** `p4RecordToPublic`
  (`api/inspection-share.js`) carries no answer onto the published record, so the rendering
  path receives no source body at all. A positioned mark has nothing to be positioned in.
- **`share-legacy` (pre-P4), the deposit forwarded states.** `legacyRecordToPublic` carries
  `answer: fields.Answer || ""` under G3, and `inspection.js` renders it at
  `.insp-context__text--answer` — which is why the `answer px` column on those two states has
  a referent and meets its floor. That body is escaped plain text in a single paragraph. It
  carries no span structure, so it is not a body in which a positioned mark can exist either.

Across the whole of `inspection.js`, `[data-mark]` occurs zero times. The two producers of
`[data-mark]` in this repository are `workbench-app.jsx` and its built `workbench.bundle.js`
— the Reader path, not the share path.

**What this does not say.** It does not say that all share rows omit answers, and it does not
say that a share can never carry source text. `legacyRecordToPublic` carries an answer under
G3, this lane established that, and the `answer px` column on the two `share-legacy` states
is that fact measured. Read §1.5 as a statement about the forwarded records in these four
acceptance states and about the composition that renders them, not as a general claim about
shares.

**Why registering a dense-record share scenario would not have filled these cells.** The
emptiness follows from the composition and the projection, not from the density of the record
handed to them. A denser record routed through the same path still meets a renderer that
emits no `[data-mark]`.

### 1.6 What these rulings do not touch

They touch `finding px` and the four empty `first mark px` cells, and nothing else. No other
floor cell is weakened, reworded, exempted, or re-pointed. The four gated columns keep their
full force on every state, and all four pass everywhere a production referent exists.

---

## 2. The board

### 2.1 What the acceptance proved before it wrote anything

Three full boards went to scratch directories first, with nothing committed and no baseline
touched. A byte-exact comparator then read all 128 files across the three runs and against
the committed baselines: hashes of file bytes, no tolerance anywhere.

Every diff line was read and traced to a commit on this branch — the route, the nav, cures
C/D/E, the READ stratum, the seam. Nothing came back unexplained.

Only then did acceptance run: **32 scenarios, one at a time, 32 per-scenario grants, no bulk
accept.** `--update-all`, `-u` and `--accept-all` remain hard errors in the CLI.

### 2.2 The accounting, at its actual population

```
files compared                                 : 128
byte-identical across all three full boards    : 127
of those, committed bytes == observed bytes    : 127
committed != observed                          :   0
NOT byte-identical across the three boards     :   1   curated-readout--mobile.png
```

**127 of 128, not 128 of 128.** The one exception is `curated-readout--mobile.png`, and §2.3
carries its full observed byte-state history. The board's own clean diff after acceptance
read 64 snapshots and 64 images byte-identical on a single run that wrote nothing to
quarantine, and a single clean diff is a single observation — it does not convert 127 into
128.

No capture was re-run in pursuit of a better number. Selection toward a desired statistic
would damage the evidence, so the population above is the population that was observed.

### 2.3 `curated-readout--mobile` — the full observed byte-state history

Two byte-states exist. `3be27310118a65d213f5e14e00bb99306357c8ced18bb93915e02550e6b500a4` at
318,055 bytes is the committed baseline. `9dd34c005f276ef9f93131dabc1b20de8f008e2f0fcda2a8b338c9d2d1fabcb8`
at 318,422 bytes is the alternate, already quarantined. Both are 1125 × 2436.

| observation | frame | evidence |
|---|---|---|
| full board before the harness extraction, recorded in `154f625` | alternate `9dd34c00…` | quarantined; sidecar `…2026-08-12T23-23-28-500Z-5cf469fc.json`; frame preserved at `/tmp/flicker-evidence/curated-readout--mobile.RUN-A-pre.png` |
| full board after the harness extraction, recorded in `154f625` | committed `3be27310…` | `/tmp/flicker-evidence/curated-readout--mobile.RUN-B-post.png` |
| acceptance board, run 1 of 3 | committed `3be27310…` | renderer pid 93328 — one renderer across all 64 captures, 0 replacements, 0 crashes |
| acceptance board, run 2 of 3 | alternate `9dd34c00…` | renderer pid 93436 — one renderer across all 64 captures, 0 replacements, 0 crashes; quarantined, sidecar `…2026-08-13T02-45-11-446Z-5962bef2.json` |
| acceptance board, run 3 of 3 | committed `3be27310…` | renderer pid 93471 — one renderer across all 64 captures, 0 replacements, 0 crashes |
| the acceptance invocation, `--update curated-readout` | committed `3be27310…` | the byte on disk at `7d2d5c2` |
| ten controlled isolated runs | committed `3be27310…`, ten times | six mobile-only at 2026-08-13T01:07Z, four desktop-and-mobile at 2026-08-13T01:08Z; desktop read `8132e54a…` on all four |

The DOM snapshot did not move. `curated-readout--mobile.snapshot.txt` hashed
`387d1515c63039db…` on all three board runs. The two byte-states are one layout rastered two
ways, and the scroll offset read 567 in all three.

The difference sits inside `x[0..1124] y[1..314]` of the 1125 × 2436 frame — the sticky-header
band, stopping dead at device row 315. It counts 74,615 differing pixels of 2,740,500, with
62,089 of them at channel delta 1 and the count tapering to 6 pixels at delta 15.

**Disposition.** The baseline is retained unchanged under the standing nondeterminism and
quarantine doctrine. This lane introduced no tolerance, no threshold, no ceiling, no retry,
no averaging and no run-until-green — here or anywhere. The frame remains a standing STOP for
founder ruling. Nothing in this record settles it.

### 2.4 What the renderer-identity evidence supports — the governing form

**The supported claim, in full: renderer-process replacement is falsified for this
instrumented recurrence only.** All three acceptance boards held one renderer pid across all
64 captures with zero replacements and zero crashes, and the run-2 sidecar records that
identity beside the differing frame. That closes, for these runs, the conditional the harness
has been carrying: the demonstrated cold-render mechanism cannot reach a mid-board event
unless something replaced the renderer mid-run. In these three runs, nothing did.

**The 2026-08-10 event remains unattributed.** Its renderer identity was never retained,
because captures made before 2026-08-11 carry no renderer-process identity and the harness
registered no `Inspector.targetCrashed` handler then. Nothing in the evidence that run kept
can confirm or rule out a mid-board renderer replacement. This lane's runs say nothing about
it.

Write both halves out whenever this is described. Never compress them to "the flicker was
diagnosed" or to "renderer replacement is ruled out." They are two claims — one falsified in
an instrumented sequence, one still open — and one can stand while the other stays open.
`scripts/qa/raster-policy.mjs` carries that instruction as standing law, and this record
obeys it.

**`backdrop-filter` and compositor raster timing are recorded here as a mechanism class
consistent with the observed spatial pattern, and never as a demonstrated cause.** The
pattern is low-amplitude and wide-area inside one banded region, which is the shape a
blur-and-composite resolution makes rather than the shape a layout shift makes.
`.site-header` carries `backdrop-filter: blur(16px) saturate(120%)`. That is the class. No
run in this lane demonstrated it as the cause of any observed difference, and this record
claims no such demonstration.

**This section governs.** The pushed commit message at `7d2d5c2` states the same evidence in
a broader form — "which rules OUT renderer replacement as the mechanism". The narrowed form
above is the governing one. That commit message stays as written, because this lane rewrites
no pushed history.

### 2.5 Quarantine

`.qa-quarantine/` was hashed file-by-file before any rendering began, at
2026-08-13T01:26:46Z: **1,507 files across 61 scenario directories.**

It was hashed again after three capture runs and 32 acceptances (02:14:36Z), and again after
the clean board diff (02:23:46Z). **Both later hashes were byte-for-byte identical to the
first.** Captures write to `--out`; a clean diff writes nothing. The evidence already on disk
was preserved through the whole acceptance.

One file arrived later, during the founder gate: a second retention sidecar for the
already-quarantined alternate byte-state, `…2026-08-13T02-45-11-446Z-5962bef2.json`. One file
is all that is new. It added no directory and it destroyed nothing. The earlier sidecar for
the same frame, `…2026-08-12T23-23-28-500Z-5cf469fc.json`, still stands beside it at its
original mtime, because sidecars are keyed to the observation rather than to the frame and
the record says so in its own text. The file count reads 1,508 and the scenario-directory
count still reads 61.

**Stated precisely, because "nothing was touched" would be wrong.** `retainDifferingFrame`
writes the frame unconditionally — `writeAtomic(framePath, candidateBuf)` — at a path keyed
by the frame's own sha256. So the retained PNG *was* rewritten at 02:46:52Z and its mtime
moved. Its bytes could not move, because the path is the hash of the bytes written to it.
Every quarantine comparison in this record hashes content, so a moved mtime is invisible to
them and they remain exactly true as stated.

**That sidecar's writer is not identified, and this record says so rather than assign one.**
What the evidence establishes:

- Its `run_id` timestamp, 2026-08-13T02:45:11.446Z, is the moment
  `scripts/qa/visual-acceptance.mjs` was imported by some process, because `RUN_ID` is a
  module constant evaluated at import. Its `observed_at` is 02:46:52.498Z.
- Both times fall inside the window of a `npm test` this session started at 02:45:06.507Z and
  which returned by 02:47:00Z. No background task of this session ran in that window, and no
  other session log under `~/.claude/projects` was active. The first suspect is this
  session's own process tree, and nothing points away from it.
- The sidecar records a real comparison: 74,615 differing pixels at max channel delta 15,
  318,422 candidate bytes against 318,055 baseline bytes, `head_commit` `7d2d5c2`, and
  `renderer.run.recorded: true` with one pid, zero replacements, zero crashes.
- A second `npm test` at 02:56:56Z, on the same tree, wrote nothing to quarantine at all —
  the directory hashed byte-for-byte identical before and after. Every later full suite run,
  including the ones with this document present, added no file either: the count held at
  1,508 and the newest mtime anywhere in the tree stayed 02:46:52Z. Every suite run at the
  gate passed identically at 1382/0/13. So whatever wrote it does not write on every run.
- No test in this repository photographs a board scenario: `runSteps`,
  `installInterception`, `captureFrame`, `screenshotBeyondViewport` and
  `Page.captureScreenshot` occur zero times across `test/*.test.mjs`. Every test call site of
  `runDiff` and `retainDifferingFrame` passes its own temporary `quarantineRoot`.

Those last two points do not sit comfortably together, and this record leaves the tension
visible instead of resolving it with a guess. Nothing was deleted, no capture was re-run to
tidy it, and the observation stands as written.

### 2.6 What changed against master — the governing form

This is a different axis from §2.2. §2.2 counts agreement *across the three board runs*. This
counts the committed baselines *against master*, and the two questions have different answers.

```
tracked files under docs/qa/visual-acceptance-harness/ : 129   (64 png + 64 snapshot + manifest.md)
changed against 4f7b239                                : 127
frames (png) changed                                   :  62  of 64
snapshots changed                                      :  64  of 64
manifest.md changed                                    :   1
frames carrying master's exact bytes                   :   2
```

**Two frames did not move.** Both are named, and neither is an anomaly:

- **`curated-readout--mobile.png`**, blob `d889f874`, sha256 `3be27310…`. Its baseline is
  retained unchanged, as §2.3 records. The acceptance wrote the bytes master already had.
- **`share-not-found--mobile.png`**, blob `b4dd2998`, sha256 `b1a71bda…`. Its DOM snapshot
  *did* change (`7543ede5` → `4148e599`) — the nav label moved `"Workbench" → "The Reader"`
  and two hrefs moved `/workbench.html → /reader.html`. Neither is visible inside the
  photographed mobile viewport: the nav is collapsed there, and an href is not rendered text.
  The desktop frame for the same scenario did move. A snapshot that changes while its frame
  does not is the board working as specified — it photographs the viewport.

**This section governs.** The pushed commit message at `7d2d5c2` opens "Every frame on the
board moved." Sixty-two of sixty-four moved. That message stays as written, because this lane
rewrites no pushed history, and the count above is the governing one.

---

## 3. The suite

**1395 tests: 1382 pass, 0 fail, 13 skipped**, on the tree at `7d2d5c2`. The founder gate ran
the suite again at 2026-08-13T02:56:56Z and got the same three numbers.

All 13 skips live in `test/d1-registry-custody.test.mjs` and gate on `IMBAS_WAVE0_ROOT` —
the governed record they need lives outside this repository, so they declare themselves
unreachable rather than assert against a record they cannot read. That file is **byte-identical
to master**: `git diff 4f7b239..HEAD -- test/d1-registry-custody.test.mjs` is empty.

**This lane added no skip.** The 13 are the same population master already had.

---

## 4. Held — corrections that would touch code, not documents

The founder gate ruled these corrections documentary and barred this pass from touching code,
tests, baselines, snapshots, or pushed history. Two candidate edits fall on the wrong side of
that line, so this pass reports them instead of making them.

1. **`scripts/qa/raster-policy.mjs` carries the standing recurrence record**, and its open
   conditional is exactly what §2.4 closes for the instrumented runs. Writing that closure
   into the file would edit code. The record stands here instead, and the file is unchanged.
2. **`scripts/qa/comprehension.mjs` states the empty-mark-cell cause in its own narrower
   words** — "the forwarded composition renders no positioned mark at any mark load, so first
   mark px is null by composition rather than by record." That sentence is true and it is
   less precise about cause than §1.5. Correcting it would edit code, so the probe's string
   is unchanged and §1.5 governs.

Neither is a defect in what the code does. Both are questions about where the fuller
statement should live, and both wait on a founder ruling.
