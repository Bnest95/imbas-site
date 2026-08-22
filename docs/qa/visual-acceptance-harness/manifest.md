# Visual acceptance manifest

Generated, never hand-edited. `node scripts/qa/visual-acceptance.mjs --manifest` rewrites this file from the scenario registry and the bytes committed beside it, and `test/qa-manifest-freshness.test.mjs` regenerates it and fails the suite on one byte of difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping belongs in the harness that emits it.

Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no machine path. That is deliberate: a manifest carrying any of those goes stale on commits that never touched an image, and a document that rots on its own teaches its readers to stop trusting it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's `## environment` block records the conditions its own capture ran under, and `git log` on an image file records when those bytes last moved.

## Scope

**This manifest governs both committed baseline layers: the `.png` images and the `.snapshot.txt` files beside them.** Both are checksummed. There is one row per image, and it carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in `docs/qa/visual-acceptance-harness/` is governed here.

The inventory is complete by construction rather than by inspection. `scripts/qa/scenarios.mjs` registers 36 drivable scenarios and the board is kept at 2 viewports, `desktop` (1440x900 @ dsf 2) and `mobile` (375x812 @ dsf 3) — so 72 images and 72 snapshots are registered, and every one of them is listed below. Generation stops rather than emit a partial record: a registered baseline missing from disk fails, and a baseline on disk that the registry does not register fails too.

**What it does not attest.** This manifest is a statement about byte identity as the tree stands, and nothing else. It does not attest the capture session that produced any image — not when the shutter fired, not which working tree was checked out, not which commit the capture ran against. It records no browser environment beyond the version string each snapshot carries for its own image, and no machine, path or operating system. It attests no review, approval or acceptance event, and no baseline-acceptance provenance: that an image is listed here means its bytes are on disk and hash to the value shown, not that anyone signed off on them. It carries no historical capture SHA and no history of any kind. Those facts are real and are kept, elsewhere and deliberately — each snapshot's `## environment` block holds the conditions its own capture ran under, `git log` on an image file holds when those bytes last moved and which commit moved them, and `docs/qa/HARNESS-HISTORY.md` holds the removed historical record of this document's own pre-generated era. None of them is this file, and a reader needing any of them should not look here.

## Portability

**Image baselines are specific to the machine and browser build that produced them.** PNG bytes depend on the platform's font rasterizer and the Chromium encoder, so the same page on another machine, another OS, or another Chromium version encodes to different bytes even when it looks identical. Do not treat an image diff on a different machine, or in CI, as a regression signal — it will report changed for reasons that have nothing to do with the product. The **snapshot** baselines (`*.snapshot.txt`) carry no rasterized pixels and are portable; they are the layer to trust when the machine changes.

## Comparison policy

Every image on this board is compared byte-for-byte against its baseline. There is no exception: no scenario carries a bounded-comparison policy, so any difference of any size in any pixel fails the run.

## Pinned environment

Recorded so a future run can explain why a baseline is or is not comparable.

| pinned value | setting |
| --- | --- |
| capture_region | `viewport (state scrolled into it)` |
| color_scheme | `light` |
| font_strategy | `webfonts fetched once into .qa-cache/, served from disk, document.fonts.ready awaited` |
| image_diff | `enabled` |
| locale | `en-US` |
| reduced_motion | `reduce` |
| screenshot_format | `png` |
| timezone | `UTC` |
| viewport `desktop` | `1440x900 @ dsf 2, mobile=false` |
| viewport `mobile` | `375x812 @ dsf 3, mobile=true` |

## Photographed, under another name

These states are covered. They are listed on their own because no scenario is named after them, so a reviewer searching by name finds nothing and concludes there is a gap. Nothing in this section is a gap.

- **The paired surface with an ABSENT original-answer side** — photographed by `paired-unmatched`. Its second row renders only the Second answer excerpt, because the open side resolved to nothing and the surface leaves it out rather than standing a placeholder in its place. The scenario's `expected` states it, and `test/qa-board-coverage.test.mjs` holds the fixture to it.

## What the board does not photograph

A board that lists only what it covers reads as complete. These are the result states that exist in the product and have no image here, each with the reason. Anyone adding a scenario should check this list first — it is where the next one comes from.

- **The chip lane's empty comparison** — `CHIP_UI.reveal.empty_delta` in `reader-paired.js` renders its own empty state in the chip reveal, separate from the Reader's. The chip lane is fenced at chip.1.0 and this pass was instructed not to touch its logic, so photographing it would have meant driving a lane it could not fix if the capture found something wrong.
- **A published share whose sources WERE captured** — The share board photographs `share-receipt`, where the sources section stands as NOT_CAPTURED and says so in words — which is the state every share is in today, because nothing in the capture path preserves source artifacts yet. The OBSERVED rendering of that section has no product path to reach it, so a scenario for it would photograph a fixture rather than the product. It arrives with the first capture path that preserves sources.
- **A route that returns an unparseable body** — The harness can now inject failures — `httpFailure` and `neverResolves` in `scripts/qa/scenarios.mjs` — and `read-error`, `read-capacity` and `read-in-flight` photograph the three states that matter. A malformed body is the one failure left unphotographed: the client maps it to `bad_json`, which renders the same banner as the `no_key` and `disabled` configuration states already covered in wording by `read-error`'s frame. Injecting it is one line whenever a reviewer wants the image.
- **The curated case result panel, after a visitor pastes** — The board photographs the curated console at its first screen (`curated-readout`), which is one step before this. The panel is where the retired score gauge and the retired CLOSED GAP / PARTIALLY SURFACED / GAP HELD badge both sat, so it is the frame a reviewer most wants. It is not photographed because `runDate` is built from `new Date()` at run time and reaches the share text inside the panel, which would make the baseline change every day and turn a real regression into noise nobody reads. Pinning the clock is a harness capability, and the removal is held meanwhile by `test/reader-no-allclear-vocabulary.test.mjs`, which asserts at source level that no badge builder, verdict label table or tone class survives, and that the one sentence standing there is read off the stored case rather than computed from the paste.
- **The correction chips after a person has corrected the reading** — Every board state captures the default reading. The two corrected states change a headline and add a call to action (`LOOP_STATE_STILL_MISSING`, `LOOP_STATE_NOT_CLEAR` in `workbench-app.jsx`). They are reachable by one more drive step and are the most obvious next scenarios to add.
- **The Check Register above its top-N line, and the chip lane's own front door** — `register-overflow`, `register-overflow-expanded` and `chip-arrival` are written and complete — real payloads through the real assemblers, drive steps, DOM assertions, a state and an expectation — and they pass the same shape check the board runs over its own members. They sit in `PENDING_SCENARIOS` in `scripts/qa/scenarios.mjs` rather than in `SCENARIOS`, because membership in `SCENARIOS` is what obliges a committed baseline and the surface-finish lane holds every baseline until the founder gives the go-ahead after its mid-lane checkpoint. This is not the fixture-only lane: fixture-only means a scenario has no drive steps and cannot be photographed at all, and these can be photographed the moment they are allowed to be. Promotion is one move — cut the entry into `SCENARIOS`, run `--update <name>` — and the board tests then hold it like any other state. Until then the states are held by execution coverage in `test/register-overflow-contract.test.mjs`.
- **The mobile-tall viewport** — Declared in VIEWPORTS and not part of the default board. It exists to re-test a reported blank-compositor claim at 375x812, not to double every baseline; running it by default would triple the image set to re-photograph the same states.

## Images

72 images, 72 snapshots, ordered by filename. Every checksum below is of the committed bytes as they stand in this tree.

### `chip-arrival--desktop.png`

| field | value |
| --- | --- |
| sha256 | `faf4ab759c12a627f9e3a2562ce11c8fd02ba13a0ab5263ed9b1d13e402541d5` |
| bytes | 479747 |
| snapshot | `chip-arrival--desktop.snapshot.txt` |
| snapshot sha256 | `1c79b44e84ffc3b9a080cb39781c447dd606c757972e6fbed02c8ff151a58d93` |
| snapshot bytes | 1996 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 290 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chip-arrival--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a51f3633fa2fbed6659b87f0ee3a293dba74430d4a23bf9ed7731e46b5a2d9bd` |
| bytes | 310654 |
| snapshot | `chip-arrival--mobile.snapshot.txt` |
| snapshot sha256 | `da71467d3ee9eca1b18ba40ef85c5981f959984f9ad09c81282f707506bb431c` |
| snapshot bytes | 1287 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 504 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chips-from-inspection--desktop.png`

| field | value |
| --- | --- |
| sha256 | `84f72a5b63587a62a3ea6f102143a1d3fdcc53acfb90aea1d319d1e1f1ec0c40` |
| bytes | 475042 |
| snapshot | `chips-from-inspection--desktop.snapshot.txt` |
| snapshot sha256 | `a7e1b5747c22b43777dbf24aa528f2bdeb4d12f9ef9961402fa4db9d4da75e27` |
| snapshot bytes | 29326 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 3953 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over — the question, never the answer body. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. The lane's own first answer box stands empty and no source paste box is restored beside it, and the inspection's own count and marks are still in the document above it. |

### `chips-from-inspection--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1f3a8b41ed90475e6ce9c6ad7e6c0f5ed05fb3456b7fc4913962459695d2bd2a` |
| bytes | 435266 |
| snapshot | `chips-from-inspection--mobile.snapshot.txt` |
| snapshot sha256 | `ac8e1936a3bab04a2efebf4a4400c3df91ccd4efe07c2fb99c3b69e72bbbea8b` |
| snapshot bytes | 28462 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 5627 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over — the question, never the answer body. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. The lane's own first answer box stands empty and no source paste box is restored beside it, and the inspection's own count and marks are still in the document above it. |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f9746951a67b4aadeac57ed918c83345003d9924c8e355713dc7688c5cb513e6` |
| bytes | 790936 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `2f14e0469903cf407a8e0239317fdec40c6a14e6dcb98b0d736fa2e54984cd65` |
| snapshot bytes | 52840 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5092 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c6c2bda4e4b10843fe8c3943e800e6bd7cbcbe41c98fb330984965272723c466` |
| bytes | 919501 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `2b1af26ebf5a1c9b24959b8c4ce6a18f04fea052ad4b7826d9643875d8f17a5c` |
| snapshot bytes | 51811 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6894 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `23e8da6765ea5cc8ea285a1c959b32f9233bb8abb14f68136359a1a15ebeac01` |
| bytes | 758579 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `2853e532ff2e5f3551039435c49ef7eff3755bd0af77b7325a18e8f35322ba88` |
| snapshot bytes | 52812 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5102 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2830a11780ca0ef54a4ee53f48893197aff9ab5ad6d904fb43d7e92d1c9684c7` |
| bytes | 860218 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `0efdee3709d25035db6c0859f8c8c1e65a43b207bb061e01544facdedeecb8fa` |
| snapshot bytes | 51797 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6894 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `145d60215db0e8d197fe89c187e3d1326b29c69ee2d30536a711304334bd13e6` |
| bytes | 784991 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `ed1a7abdd53b47236f245d9f83fb38f7a90896c2aa9f4853eb4211bb83a18546` |
| snapshot bytes | 52807 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5092 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `41d5a374d0324b9af33a1e35d1318b2bd9f79facf5a343675af8759c95f1e725` |
| bytes | 854047 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `f48e6e5343be810671905fef64ef92a8419735f3bef8f9c2258b93ba86b6b868` |
| snapshot bytes | 51792 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6902 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1e18c5797c75002e8b0669035ee894a318337edca3a7b8986aa9cd7e6c7f1fef` |
| bytes | 765516 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `e23fd2a94620aa637a1f6d73e1616711b2ed59b219adbec9731b546ef10d1ed5` |
| snapshot bytes | 52804 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5102 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `fffd6854ae52bd18fa6ea005b3d9442fcc9da174f267941c9b6e3ad437c78dcc` |
| bytes | 901041 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `6893a83bba77f1ee6c8f3ed611c5bd1b4f04a37e521fbb5d8aa7f14ded78d048` |
| snapshot bytes | 51789 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6912 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `curated-readout--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a40ba739185d3571f5575402a9593da4c11d808692724784cd99f8aae45d097b` |
| bytes | 468511 |
| snapshot | `curated-readout--desktop.snapshot.txt` |
| snapshot sha256 | `2019115be83191405a6361bfbdb1512584491941d32aa97512be8eb4e9a5270d` |
| snapshot bytes | 2392 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `?reader=0` |
| framed on | `.wb-readout` at scroll offset 205 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The curated case console, first screen — provenance and run strip with no score |
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |

### `curated-readout--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9afe748b5a56fb424d06ef920cc6ac072c01d935e027ed81bc2a7fa1f7e5d314` |
| bytes | 319073 |
| snapshot | `curated-readout--mobile.snapshot.txt` |
| snapshot sha256 | `387d1515c63039dbcbfb7c3cf0f54817e13fec9d409dc5afcf6113a4296838e7` |
| snapshot bytes | 1375 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `?reader=0` |
| framed on | `.wb-readout` at scroll offset 567 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The curated case console, first screen — provenance and run strip with no score |
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |

### `deposit-fixture--desktop.png`

| field | value |
| --- | --- |
| sha256 | `817fa81815e0ce49daaf0c09f03fcd5bde094adda401ce76d099e6a42da6452b` |
| bytes | 779227 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `9ba6117535962c86b2138c4f363680b777e8b7e60a9161772c9a5fe40f237124` |
| snapshot bytes | 51919 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1394 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `deposit-fixture--mobile.png`

| field | value |
| --- | --- |
| sha256 | `61a3e6c1358d03b41f3ecd53c2ebb1f23df6199d0fef4894af86511037825b7e` |
| bytes | 617767 |
| snapshot | `deposit-fixture--mobile.snapshot.txt` |
| snapshot sha256 | `84505c877de4a6f8d49090376aaa529c2ab6b351f200cded8fbe470e00679d42` |
| snapshot bytes | 50985 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1606 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5f6fc773ac9e6b95797c755fdbf66c2613158d6ec633d3dd6e5dd9506042945a` |
| bytes | 746786 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `551361003cd16d2de0bdda0353ccb9d3335cb79bc870af5e4e950b531783afc4` |
| snapshot bytes | 52582 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7035 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d176bda806ead52637e9d780ccca18affdc50a5a300ce4fd40cc6c47c1a93338` |
| bytes | 691436 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `220c45714d98535f6a409ce0da6b8b596ff0062549016d9116c388a22242ac6d` |
| snapshot bytes | 51890 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 9986 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `344809a811533f8e1a5bd9ded01a78afc1fc28869cda77d7d69d2436964bf5ab` |
| bytes | 623721 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `8cfb493b74aa46e4df283b6ad8363aa0e3a9e30803bda7140a63e18e29a8af25` |
| snapshot bytes | 29472 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3695 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `77fb8d33e5618422dc28e213aed0654759ccffed086cfdea7036f138f02232e1` |
| bytes | 478797 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `18ac4a2acec73a171ece72d5636b1f61bd7406a15eec330d6935badcbd6e4659` |
| snapshot bytes | 28410 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4871 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3a2211e3da02a6d6c30dba5ae1d5b66513835d84e371409953ea246a1cee0fd7` |
| bytes | 420776 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `3018dc9de9e808b3d31e561cc9c3e4437efff4ef9880c442e66ce5d6a94186d6` |
| snapshot bytes | 2318 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 141 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `first-load--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b980a9540d03c40fab8868349942917c977aadd49d6080e7d92efd2a796ea5c4` |
| bytes | 362372 |
| snapshot | `first-load--mobile.snapshot.txt` |
| snapshot sha256 | `19b14860fb322be01754aaff9e54f313247e7c1a50e83474d02eef2002d5d187` |
| snapshot bytes | 1795 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 174 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e1b32eacabafb4878bfa95b2ddeb6addee8d02f287c94c3016a6412c7c835e9a` |
| bytes | 760174 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `6fb7065aa423ea7f94521bfdd2b35f905a476884eb192581905753408870fe06` |
| snapshot bytes | 44816 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5838 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `231ed7b5b028d8bb90365b11e3709f2fd4391fc768a5ec2c198d5791acfb83aa` |
| bytes | 680440 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `6cc9ac8908a64420d72014c6167c5467a9d8a861254fbeb557609e32c6b1f1ab` |
| snapshot bytes | 43944 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 8074 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `562cfb10cfb5884393023801fd380e2874b711d3294f6d32120ce924b055b78f` |
| bytes | 694527 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `8859b5aff1d4ade89c34425d2ade607b0113535453b64b23868bab9d638f1d1a` |
| snapshot bytes | 41810 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 4947 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6f903a208839b348475a2878f18c94ce63ebe585d28c313c2bd9256107209b4c` |
| bytes | 471719 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `75665d9f84f0687996c996860ba232e5c25ca29f0df29e9ddefa634bf628cac9` |
| snapshot bytes | 40902 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6620 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f8086c1e62a684d206ed9c51481083b4f874f390b2b93ea7d35aac63673cf646` |
| bytes | 715779 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `a40aeb1d64410b8e2718ae27a7fa2b799fc9f7266a2093cd1b087a4ac3a17b0b` |
| snapshot bytes | 41679 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5543 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `fa965e78bbf5dc65b0b67c6448a08fb5a2e150c28140af5dcdd1ea51af132fd3` |
| bytes | 501662 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `10b9e49378b23bcc9adf41c55f5d6a732c87c65bda95b51577f49f7d41a225c2` |
| snapshot bytes | 40833 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7574 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f786fdb569f31e23ac4153c257829203c831908e0860098844966ae4a0b689cd` |
| bytes | 637587 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `f0c9fb3ff53a5a9f924250622a22a7b93e0cc91cd4e8f618c52068f6124114b6` |
| snapshot bytes | 52585 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6035 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6531f79385871f1b5a4103328d28fd14ea7affb78885a6985a115c60809901c3` |
| bytes | 497463 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `b2a9b873d350f47bebc9cadf2da1a6e217ec18cb0e26947e24cfd490a9257cf7` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8586 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b3e8cc771a59a6cee10b31cd199be495e0a64879b929231870f8234023bf58ff` |
| bytes | 687189 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `b58e12daa5541915793294344a896065a724dee4ec55861e150e49f7fa176290` |
| snapshot bytes | 52030 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5949 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `03ca127b52f7ab60991f4f770e1584a6a6fe654931eebb09c0364182d00a30ed` |
| bytes | 536273 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `cd87be394921159ac071d2978dfc31529a86aebbbff4872ccd46479082aaba89` |
| snapshot bytes | 51162 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8464 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c302453c70138c9009283f067f204992164621313ce179cef24a6614e28d917c` |
| bytes | 630536 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `e386759d593f2b470f61f3420bf06377f7a34d812d142958b544d076d1def74d` |
| snapshot bytes | 52585 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6089 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a4f8c3b49e48d637a66500a936c3a7057ca7237a105693c2ab379393f3f1bf23` |
| bytes | 465413 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `15f533478be76f0bdbe1c5e995fd6281e58b7b9609f79e41a411317a21e15b1c` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8706 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7dd362a54b45f002e6ff836c62897a6d48b1e21af26fc1eca6362b8de5cb8d7f` |
| bytes | 771679 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `6d9806ef9dcd18216c70bbaa5cf8a7146f6ba6af4adb30e57a86e8e0a35440ae` |
| snapshot bytes | 52749 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5402 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `043d5c781d610b20a208934b47456d191679530776ade585f2c9c7192f00655d` |
| bytes | 651282 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `6e3130c0b8c09b8c1046d67a36e8242917f6ca7649be7f102ec2330b9c85bd03` |
| snapshot bytes | 51726 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7630 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `778eebb9c58104234ead094e38fb1e90505bfcc410acc14a73d86032a12b205e` |
| bytes | 728645 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `202c5d97e3c3aedba39c319a21d29bf2054f4a4bd2cbbf8d3864c80f3a7c98bd` |
| snapshot bytes | 52701 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5423 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `353b074f1aaa4e76b1217295f3b8c94f31285350c99344b147418866fb1c760b` |
| bytes | 694979 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `53db27d67de0723c495822fb27d4f57b42cf8f8fe27d39ae2ba79c6cdbb0c979` |
| snapshot bytes | 51697 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7603 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `394afb0906242dced14ac0c0001b106bb97b37756f97b52164ad812fe14ad870` |
| bytes | 663130 |
| snapshot | `public-example--desktop.snapshot.txt` |
| snapshot sha256 | `6e24ab36459dd28be30b439d18a201645dc17f5060484f04319e7d4aac7412e1` |
| snapshot bytes | 2706 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1252 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example--mobile.png`

| field | value |
| --- | --- |
| sha256 | `57891600175b7a208ee8fb490a81daf13b36b0ae4ba68d72cfc1d18e4eff6cc6` |
| bytes | 510784 |
| snapshot | `public-example--mobile.snapshot.txt` |
| snapshot sha256 | `e7734d458b741d983873aa1c9e09a05a7d72231c841c2494c08fbc43a56410d0` |
| snapshot bytes | 1476 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1826 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example-provenance--desktop.png`

| field | value |
| --- | --- |
| sha256 | `2eff3f33241779da5c5f306234386208d62e1c06bde45eae7394ff4acbb801ca` |
| bytes | 493627 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `4f1d5fbdc7e4928b6fc516a0ab2611fad90cae0fe31fce5d71ce8e2618fbd103` |
| snapshot bytes | 2962 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 1744 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `public-example-provenance--mobile.png`

| field | value |
| --- | --- |
| sha256 | `829a5c722404c8165aee67555616560333ce03022b1de91b101402e50fd88aac` |
| bytes | 438309 |
| snapshot | `public-example-provenance--mobile.snapshot.txt` |
| snapshot sha256 | `a64405a97249dbd8c31b725211f2fd08d74d21bb5dd2d7d609db7fb68ca600f1` |
| snapshot bytes | 1956 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 2660 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `read-capacity--desktop.png`

| field | value |
| --- | --- |
| sha256 | `58dfdb15348693e1b97f6c782c9b514ef92c087dde2bd1d0bcd6a02fdfa89cf8` |
| bytes | 425260 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `ff8cff3319bd226d1e8ed6f7993f7b40dcaef4ce95e3754330d11e8236a2750e` |
| snapshot bytes | 2615 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1097 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-capacity--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e5473744d8a4ae9806bffeafeb847a5cecb0920b4db27ff50646b76f62313e0e` |
| bytes | 409347 |
| snapshot | `read-capacity--mobile.snapshot.txt` |
| snapshot sha256 | `8f37de76b7a3845aa8be5b62297cc665a72fe9e41e0ebdacc6838083bcb9bdee` |
| snapshot bytes | 2196 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1174 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-error--desktop.png`

| field | value |
| --- | --- |
| sha256 | `43ed7aedac296f774128eb548285b6a9dbfee193fa10b03263390e8bfbdb0bae` |
| bytes | 397846 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `5f7b4de8f306a0e1292be998dab40591817e1dfca471ff6115f99064199c2a5e` |
| snapshot bytes | 2506 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1088 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `04fa33d500dbbb0b36620046243c780a91deddb0363a48de074b5a83d845260c` |
| bytes | 370847 |
| snapshot | `read-error--mobile.snapshot.txt` |
| snapshot sha256 | `28f9764dda09a987638f47781eb2343108b21bd0ff8b4cbee8de9762a7ec3326` |
| snapshot bytes | 2179 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1144 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b1c6195e0bca5216aa13efc4596016c9358cd08e439a214a727b9be0a880a3b7` |
| bytes | 308404 |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| snapshot sha256 | `ec575cdaefc93abee717af6d1c3963dc2d05d53d47845db5e71da0a875641459` |
| snapshot bytes | 2553 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 762 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `read-in-flight--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5b3da32fa4c06029e895c47da828397443ad9e934b0ffaf9e152b4b208442215` |
| bytes | 279137 |
| snapshot | `read-in-flight--mobile.snapshot.txt` |
| snapshot sha256 | `addb0f4cfde1610a2f8708326de23a1dcefff340332f4a9a533d2adc4eaadfe3` |
| snapshot bytes | 2017 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 805 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `register-overflow--desktop.png`

| field | value |
| --- | --- |
| sha256 | `18761434fbf59aa2fb010ba8f2fbdb185bc3c7e5873da6683ae2b3c6d7dabcbc` |
| bytes | 782617 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `65d8ef94af218820a100ca3582929ff941792ac0091bc674438f9e6248857d07` |
| snapshot bytes | 73464 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 4797 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `bed8dfbbaefc2b864f358535839fcaa17c0d2dea7d41f2264b152078c967cc26` |
| bytes | 736706 |
| snapshot | `register-overflow--mobile.snapshot.txt` |
| snapshot sha256 | `9e56d0c53ccfa6dab0172d932a93cc105b1adf7d4292fa0939bf20894fed1dcd` |
| snapshot bytes | 72511 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6444 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow-expanded--desktop.png`

| field | value |
| --- | --- |
| sha256 | `48b9b1d2e8e6e6b2baf0b6562faeb0a8a0236edc42cfb991837ab147d6204bb3` |
| bytes | 817569 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `1b0b9f08d7f1c1a79b5d7e58d998d92556c248b1efd2d22fd48e9a1c10f20052` |
| snapshot bytes | 73497 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5309 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6524cc9117a8580cced1a27aea639c5245dd9f3d9f2c42a5118e14e3711513da` |
| bytes | 728633 |
| snapshot | `register-overflow-expanded--mobile.snapshot.txt` |
| snapshot sha256 | `5cebe0fe62633c1cbdbb7cd96b778f388f9a2dd9543c4b358e3f6699198a7ca8` |
| snapshot bytes | 72461 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 7205 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8a65668910a79068112599c1d2d7586f3ad23b65af2b779c523d42ede11c694f` |
| bytes | 463159 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `59dc828f08c152b33526cfb1ef5ffca306825b68d35d20147259217822c2a881` |
| snapshot bytes | 30783 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1317 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `474a5ffb0925131d78801e5a731a1321f8442a016e060c2251a83a11b4c752ee` |
| bytes | 348151 |
| snapshot | `share-consent--mobile.snapshot.txt` |
| snapshot sha256 | `50161406b3b13db0ed8c833fedca5476b212c7b8ce3c0c9c85bd51433c43f684` |
| snapshot bytes | 29953 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1316 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `40189e6583af487fed814d8854c82ffa4a3f253a23d9bf92605d148180ac589c` |
| bytes | 335562 |
| snapshot | `share-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `75c27898fc6d737bfed438b0d4f12b536a80ed488f4e3346a1a2f01896f99306` |
| snapshot bytes | 6581 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-reader-result__archival-notice` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share published under the earlier format, with the retired rating withheld |
| expected behaviour | An archival notice stands where the completeness badge used to, saying in words that the earlier format rated how complete an answer was, that the rating is retired and not shown, and that everything else is preserved as published. No rating word appears anywhere on the page. This is the one mode that still renders the stored full answer, because that is what those records were published with. |

### `share-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b65d65b6c95366b67289d4f6b51b8eb30a82262aefd0208e046f4a56a59b1259` |
| bytes | 319828 |
| snapshot | `share-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `cbb9d1ca9f14e9a01884293e9b616ee42b27c4623a590b383b83bbefd5def93d` |
| snapshot bytes | 6151 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-reader-result__archival-notice` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share published under the earlier format, with the retired rating withheld |
| expected behaviour | An archival notice stands where the completeness badge used to, saying in words that the earlier format rated how complete an answer was, that the rating is retired and not shown, and that everything else is preserved as published. No rating word appears anywhere on the page. This is the one mode that still renders the stored full answer, because that is what those records were published with. |

### `share-not-found--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3d0f9600263aab61d6644aeabadfc84c67d1875db10e99246b219c290df9130e` |
| bytes | 435918 |
| snapshot | `share-not-found--desktop.snapshot.txt` |
| snapshot sha256 | `09c503f3e81e4fce22ae44178138f840e3010f8e4541f1c28480c3b4b94bac60` |
| snapshot bytes | 2239 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-not-found--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0774c4d7a878c6850adfbc662a9e7bc66e5e7a2033cfe7bf0275ac8c3b93e6db` |
| bytes | 190568 |
| snapshot | `share-not-found--mobile.snapshot.txt` |
| snapshot sha256 | `e106f9d962d4a8027f382235f07cf0bd06d191a5643e30d63c091542093bae46` |
| snapshot bytes | 1536 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-paired-no-model--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c5d526e6c37388ac5da51d3632eceabee11a575f80a7c158b124245a3526a2d4` |
| bytes | 334566 |
| snapshot | `share-paired-no-model--desktop.snapshot.txt` |
| snapshot sha256 | `215da789605c5bce15d9ddedaf96b8847c314392d5534b392f428ab64618fa5c` |
| snapshot bytes | 6519 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published two-question share whose answering system was never recorded |
| expected behaviour | The anchor reads as a whole sentence with the system stated as unrecorded, not as a fragment with an empty slot where a model name would go. Imbas does not fill it in and does not infer it. Below, the delta rows quote both sides. |

### `share-paired-no-model--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f2dbe569ba02e52e571bf279898cfa720feb79c627d220aaf518166dbf86c997` |
| bytes | 314607 |
| snapshot | `share-paired-no-model--mobile.snapshot.txt` |
| snapshot sha256 | `44d1f357f59f661500b9054b1115965ab245a4f7963137d9a441c045b43e446f` |
| snapshot bytes | 5952 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published two-question share whose answering system was never recorded |
| expected behaviour | The anchor reads as a whole sentence with the system stated as unrecorded, not as a fragment with an empty slot where a model name would go. Imbas does not fill it in and does not infer it. Below, the delta rows quote both sides. |

### `share-receipt--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c4caec0af6a6b05b87b0e403dda75d5aafa5c408bb56d736d8e4d2b435e13732` |
| bytes | 347206 |
| snapshot | `share-receipt--desktop.snapshot.txt` |
| snapshot sha256 | `57896e57d74cbd9a4612a2fef63b5bbb6e3e0da8276999344528b97b2d74c21d` |
| snapshot bytes | 7089 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-receipt` at scroll offset 812 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The dated capture receipt on a published share — three sections and the closing block |
| expected behaviour | Three sections in fixed order: what the system said, what sources appeared, what Imbas could not observe. The sources section is stated as uncaptured in words rather than left blank, because a blank cannot tell a reader whether Imbas looked. The closing block is last and is the same block on every receipt: what this record does not establish — no cause, no intent, no completeness. |

### `share-receipt--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f18d7f44146862a7dcc9af3f98420c967c64e308d00df86c3a27dfb315554c5f` |
| bytes | 355626 |
| snapshot | `share-receipt--mobile.snapshot.txt` |
| snapshot sha256 | `7508d6c1bfd894bb32ebf3a1a613131c270658a95198f8e768f14776cf9ca328` |
| snapshot bytes | 6413 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-receipt` at scroll offset 1120 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The dated capture receipt on a published share — three sections and the closing block |
| expected behaviour | Three sections in fixed order: what the system said, what sources appeared, what Imbas could not observe. The sources section is stated as uncaptured in words rather than left blank, because a blank cannot tell a reader whether Imbas looked. The closing block is last and is the same block on every receipt: what this record does not establish — no cause, no intent, no completeness. |

### `share-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1c3145ab163e974d7dfc79f725033826ef7660d5be4c90154d5c2b41817cd8e2` |
| bytes | 312057 |
| snapshot | `share-single--desktop.snapshot.txt` |
| snapshot sha256 | `aa9b371277b68fa2df9617b0499c0feaa0ce29cd6185928a9da51cb7abfcb55c` |
| snapshot bytes | 6684 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-glance__count` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published single-mode share, at the top of the record |
| expected behaviour | The record opens on its identity and its count: how many marks are on it, then what a mark is. Below that the disclosure holding the record's address and its scope boundary, then the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows. |

### `share-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c3287bc01e11f14cf42dd49fdc9c445e099f8fce0977a45925b4e9f1083cf259` |
| bytes | 296400 |
| snapshot | `share-single--mobile.snapshot.txt` |
| snapshot sha256 | `187ad6d7db87d9ba9a2d6443e60a8ff7f5876078e606c8e511e8736ec0cc546d` |
| snapshot bytes | 6212 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-glance__count` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published single-mode share, at the top of the record |
| expected behaviour | The record opens on its identity and its count: how many marks are on it, then what a mark is. Below that the disclosure holding the record's address and its scope boundary, then the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows. |

### `share-single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `fa785e39711bd0c63c9804e58503a44a8cbbe7ea21489a9f502d283e78b2fedc` |
| bytes | 317473 |
| snapshot | `share-single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `aba52175fb7f4806208be1374fe63c9aa5af4c6e40ce31e68cbef8bb63d87387` |
| snapshot bytes | 5968 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-measure__findings` at scroll offset 4 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published share where nothing surfaced |
| expected behaviour | The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty. |

### `share-single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `da9b7f082b09c52401da6d278dba027883c4b3f27f3c2708369ee37b361ec907` |
| bytes | 280560 |
| snapshot | `share-single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `0ff7d3c01aca98d74eb9f9d62b8378f24af3242e30659232cf96ae41f52e7228` |
| snapshot bytes | 5322 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-measure__findings` at scroll offset 72 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published share where nothing surfaced |
| expected behaviour | The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty. |

### `single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1669388febef9e8867f183628da4cae143cfbb0517af0aa30caa3f9d03e1b88e` |
| bytes | 585096 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `c25816caa6360a5aa40b8d8b1508717386831824f97d5d83f91521138ee776f9` |
| snapshot bytes | 12919 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1456 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6f74853b824004d1a22fca48513eec14e66f9a1d347fa7ea55b352cf5994943f` |
| bytes | 482181 |
| snapshot | `single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `d59299d77488b14047261cc0c42494887d0af3c3df2d6e840770428f0f2bd62a` |
| snapshot bytes | 12159 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1660 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e7b709995a7307371d2c24fdebe851284b749ac4bd2df10cdc2b6922329aae6c` |
| bytes | 487904 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `d89e3b944cc491a50359e7eeed48e0c21ff9d22a7aeb8eaba4850c3789e66c21` |
| snapshot bytes | 12518 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2022 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b584a567dc788c53b25a7b5be3690977577ce61ab7eb2ec2478e5e4f72e2eeea` |
| bytes | 397062 |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| snapshot sha256 | `983be73edb5677dc0152ac6acb7d8d6ec74f687559dc5dc78f7c6a8a25f0256e` |
| snapshot bytes | 11787 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2335 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5c83e6025b6bb1dbade155a278db1ee29f2aea5d1ff4d440b22580561fdac9e6` |
| bytes | 627148 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `4bb4a26362134b3b448c9869cc69896c3ca110318c79240449890ef6849c3ce0` |
| snapshot bytes | 30140 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1560 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3f58ff4c24abe495e65cda684967d956e3363739062a129dd2d29f5f4ba090c6` |
| bytes | 523763 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `bc26cd68f7b1367740fb29e42ff2d7ce1dbaddf69d4f3e87cdfd57f2181c2fb4` |
| snapshot bytes | 29293 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1879 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
