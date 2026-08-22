# Surface research custody

This directory holds the Surface Finish research record. It is an index and a custody
boundary. It creates no doctrine, rules on nothing, and adds no threshold.

Every file here arrived by byte-identical copy from a source outside the repository.
Each entry below describes an artifact using only that artifact's own title, front
matter, or declared metadata.

## How to read this directory

The artifacts do not carry equal authority. Four classes sit here, and a reader should
not mistake one for another.

**Normative.** One document governs: the reconciliation candidate in
`IMBAS-SURFACE-FINISH-COGNITIVE-DOCTRINE-FINAL-RECONCILIATION-CANDIDATE.md`.

**Measurement reports.** Files under `visual-directions/shared/` and
`visual-directions/.pre-strata/shared/` record what an instrument measured on a given
build at a given date. A report states an observation. It does not rule.

**Generated evidence and fixtures.** Several files declare their own generator in a
header comment and instruct the reader not to edit them. They are build output.

**Historical references.** `visual-directions/.pre-strata/` and everything under
`strata/` record earlier states. The reconciliation candidate supersedes the strata.

A scratch report does not become governing doctrine because custody moved it here.

## The canonical doctrine

`IMBAS-SURFACE-FINISH-COGNITIVE-DOCTRINE-FINAL-RECONCILIATION-CANDIDATE.md`

- Date: 2026-08-13
- Status, verbatim from its header: `Freeze candidate after GPT ↔ Claude adversarial adjudication.`
- Scope, verbatim from its header: `Public Surface Finish. No implementation in this document.`
- sha256: `2fea8df6ca421b471e9356109624b37da9f0e5c7560ef9005b88426a07071738`
- 20,980 bytes

The document carries 22 binding rules, a six-task Gate 2 set, 390px hard checks, an
11-item live intake list, 13 remaining founder judgments, and 7 implementation risks.

### Freeze conditions

Section 8 states that the doctrine may be frozen for Surface Finish when:

- current-master reproduction confirms or clears the 11 intake items;
- the implementation brief maps each reproduced defect to a rule and exact seam;
- no new numeric threshold is introduced without an explicit founder/product ruling;
- Actionability has merged so Surface Finish sees the actual final action substrate.

The doctrine is a freeze candidate, not a frozen document. Section 8 governs that
transition.

### Freeze record — 2026-08-21

Doctrine frozen for Surface Finish on the firing of the Surface Finish build 1 brief. Section 8's bullets are met as follows:

- Current-master reproduction completed against master `cae974fa34ea1ae05549fe300684d876c604e6a2`, eleven items dispositioned.
- The Surface Finish build 1 brief is the implementation brief, mapping each reproduced defect to its rule and its seam.
- No new numeric threshold is introduced.
- Actionability is satisfied per founder ruling: the span-directed composition build, merged as PR #116, constitutes the action substrate.

## visual-directions/

Ninety-four text and source artifacts from the visual-direction lane, copied with their
relative structure preserved. The lane ran three directions on one shared record
anatomy. Its own return document names `compare/index.html` as the entry point.

Per-directory counts appear in the table at the end of this section.

### Lane documents (`visual-directions/`)

| File | What the artifact says it is |
| --- | --- |
| `ANATOMY.md` | "Review Record — shared anatomy specification". Version `record-anatomy.v2`. Names every zone and what that zone carries. |
| `ANATOMY.v1.md` | "Review Record — shared anatomy specification". Version `record-anatomy.v1`. The earlier anatomy, three directions. |
| `COMPREHENSION-RETURN.md` | "COMPREHENSION RETURN — B, the production chassis". States it is the acceptance floor for the production composition build. 615 lines. |
| `GATE.md` | "The acceptance gate — 34 checks per direction". Ten research principles and twenty-four anti-patterns run against every direction. |
| `ITERATION-RETURN.md` | "Iteration return — S1–S14". Scratch lane return. Records no branch, no commit, no PR. |
| `REGISTER-RETURN.md` | "Return — the applied-checks zone, instrument presence, and placement". One anatomy change, propagated once. |
| `RETURN.md` | "Imbas visual direction lane — return". Three directions on one record anatomy. Names `compare/index.html` as the start point. |
| `HASHES.json` | Hash manifest. Declares `anatomy_version: record-anatomy.v2`, a `frozen` map of per-file sha256, and `tokens_extracted_from` pointing at the repository `styles.css`. |

### Directions (`visual-directions/a/`, `b/`, `c/`)

Five files each. Every direction carries the same file shape: a record page, an entry
page, a stylesheet, a composition script, and an entry script.

| File | What the artifact says it is |
| --- | --- |
| `a/record.html` | Title: "Direction A — Review Record". |
| `a/entry.html` | Title: "Direction A — Reader Entry". |
| `a/a.css` | "Direction A — Investigative Cinematic. Scale and pacing, not animation." |
| `a/a.js` | "Direction A — Investigative Cinematic. Composition only." Every string arrives from the fixture through the kit. |
| `a/entry.js` | "Direction A · reader entry (Z8)". Describes A's grammar as a descent. |
| `b/record.html` | Title: "Direction B — Review Record". |
| `b/entry.html` | Title: "Direction B — Reader Entry". |
| `b/b.css` | "Direction B — Editorial Instrument. Two columns working at once." |
| `b/b.js` | "Direction B — Editorial Instrument. Composition only." |
| `b/entry.js` | "Direction B · reader entry (Z8)". Describes B's grammar as two columns working at once. |
| `c/record.html` | Title: "Direction C — Review Record". |
| `c/entry.html` | Title: "Direction C — Reader Entry". |
| `c/c.css` | "Direction C — Forensic Manuscript. The record is a filed document." |
| `c/c.js` | "Direction C — Forensic Manuscript. Composition only." |
| `c/entry.js` | "Direction C · reader entry (Z8)". Describes C's grammar as a ruled form. |

### Build and instrument scripts (`visual-directions/build/`)

Seventeen scripts. Each header states the command that runs it.

| File | What the artifact says it is |
| --- | --- |
| `generate.mjs` | "Build step for the visual-direction lane." Declares itself scratch only, reading the repository and writing only inside the scratch directory. |
| `harness.mjs` | "Shared acceptance harness." Reads the rendered DOM in the governed renderer and compares it to the frozen fixture and the repository's own lint. |
| `gate.mjs` | "The mechanical half of the 34-point acceptance gate." |
| `contrast.mjs` | "Measures rendered contrast, in the renderer, on the real pages." |
| `comprehension.mjs` | "B's comprehension measurement: the six numbers the founder asked for, taken the same way before and after so the pair can be compared." |
| `ac-parity.mjs` | "A and C did not move, except where a founder ruling moved them. This proves it." Carries a `--rebaseline` mode its own header says needs a ruling. |
| `capture.mjs` | "Runs the capture matrix and writes the manifest." |
| `matrix.mjs` | "The capture matrix." Generates one list for all three directions from the same rows. |
| `shoot.mjs` | "Capture tool. Project-governed renderer, resolved from the repository's own playwright-core install and its pinned chromium revision." |
| `compare.mjs` | "Generates compare/frames.data.js from the capture manifest." |
| `stress.mjs` | "The stress pass: eighteen frames as they open, and the pause measured on the same loads that produced them." |
| `glance.mjs` | "First-screen frames for B, which is the only thing the comprehension pass actually claims about." |
| `copy-inventory.mjs` | "The connective-copy inventory, and its lint result." |
| `entry-fold.mjs` | "The entry rule, measured." |
| `density-probe.mjs` | "Does the 390 density default move anything the acceptance table records?" |
| `a-recentre-probe.mjs` | "Why two of A's 390 rows moved the claim DOWN when the recast made a string shorter." |
| `wrap-probe.mjs` | "Proves the mechanism behind the two rows that moved." Measures in-page by swapping a text node on a live render, touching no file. |

### Review surfaces (`visual-directions/compare/`)

Eight files. The lane's own return names this directory as the review entry point.

| File | What the artifact says it is |
| --- | --- |
| `index.html` | Title: "Imbas · three directions on one record anatomy". |
| `compare.js` | "The founder comparison surface." One selection drives all three panes. |
| `compare.css` | "Review tooling. Deliberately plain, so nothing here reads as a fourth direction." |
| `frames.data.js` | "Generated by build/compare.mjs. Labels and file paths only." |
| `stress.html` | Title: "Imbas · stress captures · S10 and S6". |
| `stress.js` | "The stress board." Six states, three directions each, grouped by state. |
| `stress.css` | "Review chrome for the stress board. Deliberately plain: the frames are the subject." |
| `stress.data.js` | Generated data. Defines the `IMBAS_STRESS` global and declares 18 frames. |

### Shared fixtures and measurement reports (`visual-directions/shared/`)

Seventeen files. The reports state what an instrument measured. They do not rule.

| File | What the artifact says it is |
| --- | --- |
| `fixture.mjs` | "Shared record fixture for the Imbas visual-direction lane." Declares itself scratch only, writing nothing to the repository. |
| `fixture.data.js` | "GENERATED by build/generate.mjs. Do not edit." |
| `kit.js` | "Shared kit for the visual-direction lane." Owns text integrity and the `data-*` contract the harness reads. Owns no layout, scale, colour, or interaction shape. |
| `tokens.css` | "GENERATED by build/generate.mjs" — the `:root` block extracted verbatim from the repository stylesheet. |
| `ac-parity-report.json` | Question: "Does anything reaching an A or C reader differ from the ruled archive, and what did this pass change?" Carries `acceptance_against_archive` and `history_against_pre_strata`. |
| `ac-archive.json` | "Rendered A/C reference bytes. A/C byte-identity is measured against this file." Records `re_baselined: 2026-08-10` and the founder ruling behind it. |
| `contrast-report.json` | Method: `getComputedStyle` in the governed renderer, on the real pages, background composited from the first opaque ancestor. |
| `grammar-report.json` | Harness assertion results. Declares harness version, renderer, check vocabulary version, packet version, anatomy, stamps, runs, and failures. |
| `gate-machine-report.json` | Machine gate sweep. Declares renderer, pages swept, lexicon, glyph set, and palette closure. |
| `comprehension-before.json` | Eight rows of per-direction comprehension measurements taken before the pass. |
| `comprehension-after.json` | Eight rows of the same measurements taken after the pass. |
| `stress-report.json` | Method: governed renderer, viewport-clipped frames. States that distances are document offsets, so they are what a reader scrolls. |
| `density-probe.json` | Question: "Does the overview-first / full-first choice at 390 move any measured column?" |
| `copy-inventory.json` | Copy inventory across lint, positive-framing sweep, connective copy, governed source strings, and authored record content. |
| `connective-copy.json` | Note: connective UI copy for the record anatomy, written once and consumed by all three directions. |
| `governed-string-inventory.json` | Note: strings imported live from the repository packet, each proved byte-identical at build time, none retyped in the lane. |
| `lint-report.json` | Lint result. Declares the lint module, its version, its sha256, and the strings linted. |

### Capture manifest (`visual-directions/screenshots/`)

| File | What the artifact says it is |
| --- | --- |
| `MANIFEST.json` | Capture manifest. Declares the renderer as Google Chrome for Testing 148.0.7778.96 at chromium revision 1223, the desktop and mobile viewports, a 24-row parity check with 0 mismatches, and 72 frames. |

The PNG frames this manifest describes stayed out of custody. See "Artifacts held from
custody" below.

### `.pre-strata/` — historical measurement reference

Twenty-eight files under `visual-directions/.pre-strata/`, mirroring the direction and
shared layout at an earlier state.

**This directory is a historical measurement reference. It is not current design
guidance.** It exists because `shared/ac-parity-report.json` measures
`history_against_pre_strata` against it. That measurement reports 16 rows identical but
for an added anatomy-version stamp and a ruled recast, and 0 materially different. Delete
`.pre-strata/` and that measurement loses its comparand.

Read `.pre-strata/` only as the thing a measurement compared against. Do not read it as a
direction anyone should build.

### Per-directory counts, from disk

| Directory | Files on disk | Copied |
| --- | --- | --- |
| `visual-directions/` (root) | 8 | 8 |
| `visual-directions/a/` | 5 | 5 |
| `visual-directions/b/` | 5 | 5 |
| `visual-directions/c/` | 5 | 5 |
| `visual-directions/build/` | 17 | 17 |
| `visual-directions/compare/` | 8 | 8 |
| `visual-directions/shared/` | 17 | 17 |
| `visual-directions/screenshots/` | 79 | 1 |
| `visual-directions/screenshots/stress/` | 18 | 0 |
| `visual-directions/.pre-strata/a/` | 5 | 5 |
| `visual-directions/.pre-strata/b/` | 5 | 5 |
| `visual-directions/.pre-strata/c/` | 5 | 5 |
| `visual-directions/.pre-strata/shared/` | 13 | 13 |
| **Total** | **190** | **94** |

## strata/ — historical, superseded

The reconciliation candidate supersedes everything in this directory. A reader who wants
current Surface Finish doctrine should read the reconciliation candidate, not these.

### `UX-COGNITIVE-DOCTRINE-2026-08.md`

- The Claude adjudication's own header describes this file as the "Cowork 26-rule
  live-grounded package, read in full from repo".
- sha256: `d57c7ce97eb95618312cb83e0a3ad1a851b28b9f8553a2d087175bd7cd638160`
- 127,389 bytes
- Status: historical, superseded by the reconciliation candidate.

## Artifacts held from custody

### The Claude adversarial adjudication, verified and held

`IMBAS-SURFACE-FINISH-COGNITIVE-DOCTRINE-ADJUDICATION-CLAUDE-2026-08-13.md`

- Title, from its own header: "IMBAS — SURFACE FINISH COGNITIVE DOCTRINE — ADVERSARIAL ADJUDICATION (CLAUDE)"
- Date: 2026-08-13
- 34,683 bytes
- sha256: `d703665cda62d45bd3be579628113fd1a79d24ba8e5223d23d2017bbe2c3a670`

This document is hash-verified and intentionally not copied into the repository. It is an
internal adversarial adjudication, and its publication needs an explicit founder ruling.
Custody records its identity here so the audit trail stays complete while the document
itself stays out of public custody.

### Screenshot frames

The lane holds 96 PNG frames that stayed out of this commit. They are the only binaries
in the lane and the only files at or above 1 MB. This commit copied no binary. Those
frames wait on a founder ruling at PR review, and the PR return enumerates every one with
its relative path and byte size.

## Custody notes

Two mechanical facts about this directory will confuse a maintainer who meets them cold.

**`visual-directions/build/` is tracked against a repository ignore rule.** The root
`.gitignore` carries an unanchored `build/` pattern, so git ignores any directory named
`build` at any depth, including this one. The custody commit staged those 17 scripts with
`git add -f`. They are tracked now, so ordinary status and diff work on them. A maintainer
who deletes and re-copies the directory must force-add it again, or git will drop all 17
files without reporting anything. Changing that ignore pattern is a founder call and this
commit did not touch it.

**`visual-directions/build/harness.mjs` is a text file that git diffs as binary.** The
script uses two raw control bytes, `0x00` and `0x01`, as delimiters inside JavaScript
string literals rather than escaping them. Git's diff heuristic reads the `0x00` and
classifies the file as binary, and `file(1)` reports it as `application/octet-stream`. The
bytes are intact: the stored blob is 38,809 bytes and its sha256 equals the source. The
file is not corrupt.

## Audit-trail absences

Two GPT-side artifacts in this document's lineage are not on disk. Searches under
`~/Documents` returned no match for either.

### `IMBAS-SURFACE-FINISH-COGNITIVE-DOCTRINE-GPT-ADJUDICATION.md` — absent

The Claude adjudication's `Input:` line names this file and characterizes it as the
"20-rule synthesis". The file itself is not on disk.

### The upstream GPT 28-rule package — absent

The Claude adjudication states, in its own `Evidence limit:` line: "the GPT 28-rule
package is not in the repo. GPT-originated items are adjudicated from the synthesis's own
characterization of them."

That package was already unavailable when the adjudication was written. Its absence is
therefore an original condition of the adjudication, not a loss that happened afterward.

### The gap, stated narrowly

The chain runs GPT 28-rule package → GPT 20-rule synthesis → Claude adversarial
adjudication → reconciliation candidate. Custody holds the last link. The reconciliation
candidate's `Status:` line names the "GPT ↔ Claude adversarial adjudication" and its
section 0 names the "20-rule synthesis", but neither GPT-side document survives on disk.

Nobody should reconstruct either missing artifact from the downstream summaries that
describe them. A downstream characterization of a document is not that document.
