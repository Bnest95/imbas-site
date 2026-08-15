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
| sha256 | `d244c87b9e2f9c9f4d98ae63ee47737180ac00dcc62311ae96801e81ccbdce6b` |
| bytes | 591763 |
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
| sha256 | `65e550e898c2e89e768102865fe5ddb083a9fc2bbc42f24b2fae8686c2107a00` |
| bytes | 316480 |
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
| sha256 | `6c5e7c5bdfab661609824181aef95cdec1a44b57c603d68ec369d2aa4f1bcd22` |
| bytes | 616075 |
| snapshot | `chips-from-inspection--desktop.snapshot.txt` |
| snapshot sha256 | `79fb9a5932832d50140d948935732a7f0b01de5943d653c61e69344ef3cb4dae` |
| snapshot bytes | 29326 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 3983 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over — the question, never the answer body. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. The lane's own first answer box stands empty and no source paste box is restored beside it, and the inspection's own count and marks are still in the document above it. |

### `chips-from-inspection--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ce0f4c8ac707a9b5320acc3cb3c26db03499074062554ac7fa1c2009f7158c32` |
| bytes | 664416 |
| snapshot | `chips-from-inspection--mobile.snapshot.txt` |
| snapshot sha256 | `e32419d1f13bd5315a5ebdbe87fa7f8d14e4646c64ab2a60b1f5ddf669c3505d` |
| snapshot bytes | 28462 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 5610 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over — the question, never the answer body. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. The lane's own first answer box stands empty and no source paste box is restored beside it, and the inspection's own count and marks are still in the document above it. |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `64d3525efb3e9d9800af156c83732e21f0e4d748a6b0ea6662de783f81b05ab4` |
| bytes | 1066441 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `83f7e99e2e4173a256c476492d2c3be78ea3b6528243335801a61671336652f8` |
| snapshot bytes | 52840 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5121 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `980c2ee67e7db6f68df65ff519edead50f78eb6e71a9f6e11999ef0b5ea23ddb` |
| bytes | 1047536 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `6ef53348d0195133b13980963943a0d34eacc4f03691ece9c50dce24aadeeb4a` |
| snapshot bytes | 51811 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6877 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `418c33103262e6affd95cd19056ff97bfe9f1c4b97b495a355a00c81dda5f516` |
| bytes | 1056786 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `ef1fca1b92c7d160723f24363c1adb64362ee647bcfc71f3c7fb4edb92453fc3` |
| snapshot bytes | 52812 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5132 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b3a9e6f459d636e30a8f418c2d82d59eb56c4a972d8f9b7d4ee7617c798dee22` |
| bytes | 984559 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `fc38e697ec799ed5c283053753c6df6cc76c9e0e6dce00e6d7e0d5bf49b350e5` |
| snapshot bytes | 51797 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6877 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7f1638779851729ad39f0777a34df3963dc363048d9e770107005e715fbb69b3` |
| bytes | 1059524 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `a52c321b55a50c5e525f7d7b3dc76db68e4f2525cb8fd449b815b49077533fd1` |
| snapshot bytes | 52807 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5121 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `085903b7c61c717f2494598d28e627e4e538ac941dd1d9fc81fe008bb62d74be` |
| bytes | 985263 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `a474c1c35a17cbb3aca412f4349b481526a9c747012e4318de93f8a1306c3081` |
| snapshot bytes | 51792 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6884 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `aef94d2783a32c4a2aa3728b3a94565c52f885c881fd34944ae7fb2d182a64fa` |
| bytes | 1064084 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `099f770f0696abe9cfa978185c98d294f974f17a214584e69a6aa344b1ac58ee` |
| snapshot bytes | 52804 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5132 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4dd6798f7083eee1d470281b5711fd7a4b9f3465b43177702264616171c26a7a` |
| bytes | 938931 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `29b775344a8dd5df258aa37f246cf6bbad7d87879a877866e94b9377fbabde50` |
| snapshot bytes | 51789 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6895 |
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
| sha256 | `1377d9847904edfe4ac08ed031264f8708afa05083a6340b2e05dc82551363f8` |
| bytes | 1400727 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `bd8d38a6201ce0c8fa16f7a00b98c16cc2cf5f50eac7de4f72c44f45d73d24c7` |
| snapshot bytes | 51679 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1394 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `deposit-fixture--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4c1f68eaafe50315d3aa3663f56865ee3d998e09855b898f2dd025f0603ca695` |
| bytes | 1352328 |
| snapshot | `deposit-fixture--mobile.snapshot.txt` |
| snapshot sha256 | `f473c000f9d897a6adbc406bb6d8c54e4539e78c9d95ba8bc33a04d3c3350489` |
| snapshot bytes | 50825 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1606 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `52ef8dd2332c26d8e024a9edab225d5d7ce12e3c9c3dfba3aa995ce032b7f878` |
| bytes | 764257 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `a45b95f8c8302e24c034142caaf485e4b7c2682adfbcb2ce625533a0826947bf` |
| snapshot bytes | 52531 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7084 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5c7f004b5ae3f96632b936e60eba9bbf27a73c05a74e2b29eba1416680384b6a` |
| bytes | 712946 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `bc972955d6fdfcee716419fbcf0769b17f3266ed127ec10b5bbc3b61202463a2` |
| snapshot bytes | 51891 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 10008 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f96516c379c3f42192eb148a44385779387553fb68662bb9b85f9ec3600ca249` |
| bytes | 623141 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `1beb60f6ba5adf3591fed9b56a9a3b98747c376f9399474fb2e2b2ac5c365a7f` |
| snapshot bytes | 29472 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3706 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `79711ebae346f46144821597578b139969829791463e235470414a060ee9387b` |
| bytes | 480278 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `84bfce7960a61f93c1edef22639177c61034465849a2c58cc32829f8b6944be1` |
| snapshot bytes | 28410 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4834 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `aede7622d2d02bc8aa56099822601bc1195e800ea529cc45062c9e56cb6d96f4` |
| bytes | 420757 |
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
| sha256 | `92008418626e58f5b445d3b780ed54f2c7ca8863dd1fdc7d9d94c708b9eac60c` |
| bytes | 737216 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `928c5d5fb741499ea3ed94a9ece22efa0e16c273ed2f942d931adfa694770e01` |
| snapshot bytes | 44866 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5877 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `37e257f49fd7f8e5c211b68ec02c2c33b27d8e313945a275ac54e21fbc72f0d0` |
| bytes | 660587 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `a7ad838b8cb3936090ebaa6815b0304faddc2b8e5c2a41b785631b7033f88467` |
| snapshot bytes | 43944 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 8076 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `cba17b0180889d25058983cf4d21b2ae6db35405dadf82b02517e2ff75a0c48e` |
| bytes | 1040937 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `c51bd68d3ac72c2a0934ac51f97dbda30dce6c6d8c38e8e22855107d20845ac5` |
| snapshot bytes | 41810 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 4977 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8a5b5743dcab9cb9f34aa240c728ea019d22124fd65a482b4439c0de503083f2` |
| bytes | 684555 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `04be94f170343d81295f6537dce36a3b5166923f8089fdc125447b3fe3503056` |
| snapshot bytes | 40902 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6603 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a36fe22799a171e69c4e2b80e9d89a7570c44c9ec699097414f60e2e68e5b7ca` |
| bytes | 783668 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `a55d0fe3250ee37c8b4d4b4f0d69fe1f2c547587c09ba7a2f5df424fa08b767b` |
| snapshot bytes | 41707 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5573 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6e90454df580269c60eaacd5486a790c5ccb74aaa79dcd33cfd3446f5bdbac79` |
| bytes | 548730 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `2691657257b3d0d2d5c6faf73551417d9ac0bf62d0d94787cf4e5c897d8185ee` |
| snapshot bytes | 40833 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7556 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7fa636b59684bc22b030805447f318d9b040ec648360e8122ef431d2a4a6b6d0` |
| bytes | 627120 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `719057b8c5d93bc0a5cc34cd7f7bcda951430ca17d00006f8b200a63efe1ce73` |
| snapshot bytes | 52585 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6065 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c8f418595caee59b70508f347b8eec31bcad20f06f4a5886ea0b1ce4ebae3729` |
| bytes | 475526 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `22598e94fd5013352fbcb93d6c582e65f2b1625be67cd065bd5b8e659f9655a6` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8569 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5ece4504dc939a629eeb4b8bfd10300342cbefc3daf2258469569682ceb78c5c` |
| bytes | 678088 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `bfe35b6e04a23d6b6a14bd9e7986787aefdf6fb3ec760ac4491a1a21da707536` |
| snapshot bytes | 52030 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5978 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ecd076e64b6b0993ee89a9f409dff134b5e0234ab31fd0befb558830d60b80c6` |
| bytes | 543000 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `3468c55bc01385824f6f5ecf9eb68e3d234329a6266f6d8119858c0e000a1c63` |
| snapshot bytes | 51162 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8447 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `2f8b6d5fafdd0ba69e998ff779fe675c366b993acd1849c131dfd54fad5509d0` |
| bytes | 611840 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `5befde5541116dcd047167d26591a2181f1cbd5a45e8e7c38b219d5dba763e05` |
| snapshot bytes | 52585 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6119 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7db40eeb562832e93561ec7464ca45a13f059048342c12f84f7169f48f82e3cb` |
| bytes | 477756 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `0c682f32f32b32b12e6aaf81f20bc64be284013c721dc13ddf3d159202893f5d` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8689 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `bf5f8ac01b58f3753f4c895edb955462ef03914ac3380681ff34c6a1c2149a31` |
| bytes | 795623 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `fd00a2c903553997ca57fb55782c4e2c50cc5443b7596427c01ba8dce2dace12` |
| snapshot bytes | 52749 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5432 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `cc4e52add2a4243f2e1f78172a4409b990d17f1cb7a49670d9c7bad1dbebcc56` |
| bytes | 646662 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `7f0a0957568a0a75f32bcd5810f573882cd2ddf1b06f40fd01a9da5eb32800a6` |
| snapshot bytes | 51726 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7612 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `77fb2f02895fb4d6d7b33b035f5449f3440358c71ad38e7d52dc6c321fe9e10f` |
| bytes | 776585 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `aedc13a28bb8751849803b377a2492f3f93bcc7b15de14ed34cc3e35f457ba5c` |
| snapshot bytes | 52701 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5453 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0ff7402dbe20f5ebb7679d62c01186c5b64bffc08496383fd5ae2e808ccc509b` |
| bytes | 689511 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `1495c42f8439c9d65ec914d5fc3861bdfb4cd50e06aee30410073c139853b682` |
| snapshot bytes | 51697 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7585 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8712380418092da1a086b95edad3f2e44f45390ef1d89021f4025efa099be348` |
| bytes | 662819 |
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
| sha256 | `8c6ac0270528cb2d20ada70ddabf3a500c49e33b46f83ec5030ceed7ac4f4970` |
| bytes | 493559 |
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
| sha256 | `03afd1d7e3f761442e4fa1029a36bdc517ed48b0adb209c7f3cd6e7d2bcdb8ef` |
| bytes | 451096 |
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
| sha256 | `19fa5c9e9e932a03595b7322cb447117bbc7cff21cbda0f495d1b196eb1f038a` |
| bytes | 436345 |
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
| sha256 | `4072c9180faf7102f6b3109a04c6d285694a7e746f059696559b1795246042be` |
| bytes | 423488 |
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
| sha256 | `e2df959d66b224604ac2334737696490c511387e7095f9bd068c0ac6b4f96d9b` |
| bytes | 397611 |
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
| sha256 | `f507a69f8dccc43a30fca71d3c299b3ded7d034f7359a31c8b2a3dfbd65a37a1` |
| bytes | 782424 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `f134cfc40bdeffadb6d4b39a974367dd56415eac3fdc764f085ec5455904eb87` |
| snapshot bytes | 73464 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 4661 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `fb3c7345b052e3d39630bf43f13e5bd46570431a0740e5e859793b74d8fdab7c` |
| bytes | 734939 |
| snapshot | `register-overflow--mobile.snapshot.txt` |
| snapshot sha256 | `82c9ac1b4ce5c3c8d961cc0c6da00ffb44a1402e3958ebc89fc050420d2225bd` |
| snapshot bytes | 72511 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6260 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow-expanded--desktop.png`

| field | value |
| --- | --- |
| sha256 | `86fb19bf0e06c3452d3c974b405420a251711df32dd7b13109fe7c75961f2640` |
| bytes | 817316 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `424e7b626d1460dff77d46845b903c6aae5606e0e5dd00ac8c900b45bfc6d5c0` |
| snapshot bytes | 73497 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5172 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2349baad113ab59e51b4872139db31de8dd4d7e756ae6569b22463468ca7fb98` |
| bytes | 723584 |
| snapshot | `register-overflow-expanded--mobile.snapshot.txt` |
| snapshot sha256 | `33a4c1388564fa7ffce04936e658c63962dc3aabcfd6316fcbd03a8a7f86e586` |
| snapshot bytes | 72461 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 7022 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f60e4b75037b476ed0bd0225645daaf0d3b7430c921df3571f9af75bc5143d0d` |
| bytes | 476256 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `77f2043fcc321f329804540f538d756c578164ff5fbe5d2cf2680d0781c98e60` |
| snapshot bytes | 30661 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1317 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5a15f716b03ab0a818e248132b495bb95c54f4b87a7d62abdcd6b44e69460926` |
| bytes | 366723 |
| snapshot | `share-consent--mobile.snapshot.txt` |
| snapshot sha256 | `3172233dc832b5faed2dd8d6a6fa4e818bb1119e198c5649eb3942f37e61ba72` |
| snapshot bytes | 29873 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1316 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3f19c95d050d2904ed3de1e697c7ef5eaef932b51de207343751928e8b53d313` |
| bytes | 335537 |
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
| sha256 | `a3dfb3d7494ea93886b70494bf9351c5b94b3888136b941f36fa51134261d917` |
| bytes | 319778 |
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
| sha256 | `ce9746e399bb2fa496dbdeb681fdb125745a703e8d28e56f53bd650de2c33eda` |
| bytes | 330093 |
| snapshot | `share-paired-no-model--desktop.snapshot.txt` |
| snapshot sha256 | `07a4c68a024e27e2988478fcf494b9c23f416623ae35dd8fde9de7dc72fa3412` |
| snapshot bytes | 6493 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published two-question share whose answering system was never recorded |
| expected behaviour | The anchor reads as a whole sentence with the system stated as unrecorded, not as a fragment with an empty slot where a model name would go. Imbas does not fill it in and does not infer it. Below, the delta rows quote both sides. |

### `share-paired-no-model--mobile.png`

| field | value |
| --- | --- |
| sha256 | `260b217aa85fadb12558353f570bc872d7af388dcecd7322835a7649e9a5e6e7` |
| bytes | 314569 |
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
| sha256 | `36916a8dd294aa2dd149c8f8d1ac0258a54193816781a9d9352784f03f71b808` |
| bytes | 312078 |
| snapshot | `share-single--desktop.snapshot.txt` |
| snapshot sha256 | `ad861030011b635d502bae918e5bf51fda4bbcfda42a171318c10ddaed1a994c` |
| snapshot bytes | 6686 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-glance__count` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published single-mode share, at the top of the record |
| expected behaviour | The record opens on its identity and its count: how many marks are on it, then what a mark is. Below that the disclosure holding the record's address and its scope boundary, then the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows. |

### `share-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `072c793236ad9ffdf69fbdb427f3867a9e6e77f48e9614235803a8ecd3f65b4f` |
| bytes | 295800 |
| snapshot | `share-single--mobile.snapshot.txt` |
| snapshot sha256 | `1eb479508d657f5cb21bed476283096e0c0543e39cd188050bc95881e3088877` |
| snapshot bytes | 6214 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-glance__count` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published single-mode share, at the top of the record |
| expected behaviour | The record opens on its identity and its count: how many marks are on it, then what a mark is. Below that the disclosure holding the record's address and its scope boundary, then the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows. |

### `share-single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `21f2aa8e8bc3d6f999febcbf85041612607dfc88edf4b6cc31ceab0f0ce17939` |
| bytes | 317512 |
| snapshot | `share-single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `4131fa1301d2c24d35fe337a6ef164ad03b88d21656eb79508e4047471bc388d` |
| snapshot bytes | 5970 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-measure__findings` at scroll offset 4 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published share where nothing surfaced |
| expected behaviour | The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty. |

### `share-single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3c03795e8e8a80d06bf2c0639868684f361e32fb390963d24895e7f437e86bdf` |
| bytes | 279375 |
| snapshot | `share-single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `a877212e924c398d0557a3dcde1631624ebecef630989caf1c4065ff702ac9b0` |
| snapshot bytes | 5324 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-measure__findings` at scroll offset 72 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published share where nothing surfaced |
| expected behaviour | The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty. |

### `single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0c1dfce0e5b2be424477330ebc93ae756752f0542d1ffe6f768944b85df05535` |
| bytes | 796291 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `5082f9ea97f70fdb6ad646aa7b48356535dfa096a0daa1e0f3ee13700a0491c8` |
| snapshot bytes | 12809 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1456 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7610d43861e9751149d3bf225662f7f2371025384e9efde4a6b765f152e7f442` |
| bytes | 594292 |
| snapshot | `single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `c2830ecab07ae3059bd03e48deffa022010211a0f2bd0bf0a4a6b155fb4a6dc0` |
| snapshot bytes | 12145 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1660 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `104866102453770adc80764326e003c2547c60c36e219524f37a36c94db2219f` |
| bytes | 642003 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `47b73c7db393917757a679df1350be4a44dc74cfb8351347b3a83dab587e18ac` |
| snapshot bytes | 12289 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2097 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f03b3ef1975b787de4b1ec8f5b00c92ac4d544b1513e0f815eeb4ba15ed31136` |
| bytes | 554174 |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| snapshot sha256 | `5114242f1e1c8a1b014e65975f4d6a534402517bf90c7d8faf7a2be3c790dd48` |
| snapshot bytes | 11667 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2459 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `11a4db9b8371da42505061a94f3329ba1d463828f9adedafdb88b538f5c79f0d` |
| bytes | 749627 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `edf04e6783579d0d5eb204836114bce78fcb1da062d4a864f6b237fc197335fd` |
| snapshot bytes | 30070 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1542 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c3395480be7e18a63020a22c868ce0234303d6e5d6ed755f9af92a4406005ce4` |
| bytes | 592044 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `56e2133622a1579186e062437ad17e6947bf20135527c177b7a32b206932f14d` |
| snapshot bytes | 29351 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1860 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
