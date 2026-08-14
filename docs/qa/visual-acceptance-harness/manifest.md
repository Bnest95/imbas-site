# Visual acceptance manifest

Generated, never hand-edited. `node scripts/qa/visual-acceptance.mjs --manifest` rewrites this file from the scenario registry and the bytes committed beside it, and `test/qa-manifest-freshness.test.mjs` regenerates it and fails the suite on one byte of difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping belongs in the harness that emits it.

Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no machine path. That is deliberate: a manifest carrying any of those goes stale on commits that never touched an image, and a document that rots on its own teaches its readers to stop trusting it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's `## environment` block records the conditions its own capture ran under, and `git log` on an image file records when those bytes last moved.

## Scope

**This manifest governs both committed baseline layers: the `.png` images and the `.snapshot.txt` files beside them.** Both are checksummed. There is one row per image, and it carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in `docs/qa/visual-acceptance-harness/` is governed here.

The inventory is complete by construction rather than by inspection. `scripts/qa/scenarios.mjs` registers 35 drivable scenarios and the board is kept at 2 viewports, `desktop` (1440x900 @ dsf 2) and `mobile` (375x812 @ dsf 3) — so 70 images and 70 snapshots are registered, and every one of them is listed below. Generation stops rather than emit a partial record: a registered baseline missing from disk fails, and a baseline on disk that the registry does not register fails too.

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

70 images, 70 snapshots, ordered by filename. Every checksum below is of the committed bytes as they stand in this tree.

### `chip-arrival--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e19dfc486f6a5bbbffe4c1e01d61cea972a85570dd08c74db9478ab22a0b9f09` |
| bytes | 577686 |
| snapshot | `chip-arrival--desktop.snapshot.txt` |
| snapshot sha256 | `571d3080a698d39ac147d2a6068773f8581c03bb344b930fad201c841beb186a` |
| snapshot bytes | 1991 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 277 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chip-arrival--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b86131abb2aca0ffd29eddf34a095055a3e2f597ae310b4a4839523892860c3e` |
| bytes | 312395 |
| snapshot | `chip-arrival--mobile.snapshot.txt` |
| snapshot sha256 | `a34a300b885e992ab1e4f87d801d4732b0c40afe84749dafefb8211914da1cc8` |
| snapshot bytes | 1245 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 479 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `31fa69d013603f2fc8c5d0f30ffc8aa8f71698d8c6223f963c446ad10d778ee4` |
| bytes | 1065397 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `f1385a20ec548a06b66b2844624e2da5a52275a62264d106bbe55583f202ff64` |
| snapshot bytes | 52840 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 4993 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `206a62ed8db70660e14a9ab790a3278030e00357c0bfe9266f13c7ea480068cc` |
| bytes | 1044946 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `caacb5b2ffd62a55f4a7613a16c83c29a7175aab3d055418da2be9678fc8b468` |
| snapshot bytes | 51811 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6651 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6c1ad7c9c8860158e4c1f027558ca4ab9a41a964c0b35103245ccbdb80b3b38b` |
| bytes | 1052438 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `ad58de6ee9eae10c1265ce3c99ddc1c879a9f1a4b517ae30f4065265d6c02871` |
| snapshot bytes | 52812 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5004 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4149c592fe62c25fa6ff4d86609d45af1ae9f76515cb9b2f75ab4d69951b29e2` |
| bytes | 985928 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `99511640db5076d793fca7e20900831d6db31e66b46f33cc31a954fff33e6f51` |
| snapshot bytes | 51797 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6651 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `062a863a0391d6b2f84f4ffa296d86b1e5032a2056b65b21c68c0f82ef771273` |
| bytes | 1058389 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `c731452712fa9c8c540e5300bc16e308277b557c0b2a58f2b03aff4f81d48333` |
| snapshot bytes | 52807 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 4993 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3a0599fff34bba0a696055b252fa2896fe270a90244182fb943d5ae279ed2afe` |
| bytes | 986100 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `3be006a6fd31a2ae8fc3e9f971aaaa0040e0b3ee49308cce372d4a243c56c77b` |
| snapshot bytes | 51792 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6658 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `631e5a9a173fd45be0ebac0ff0b96500f41c47cc7b5e1567ba63c3b8e4b6bed5` |
| bytes | 1059702 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `1199221b9ab180f6ef4ba0695f0f8fb35103478254ef87020a9345eff9b9b8b4` |
| snapshot bytes | 52804 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5004 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `bcd00e25daf48633f13044124e05ff03bba51e0b3213ea5270b6f5bcc43538e7` |
| bytes | 937337 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `5dadeb1e965b63bd1442c0877ff52312a54c13f9aa789f465b9fb7eec9b88a1e` |
| snapshot bytes | 51789 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6668 |
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
| sha256 | `7630233511112fe0f8ad204016e06c78df0833871af1efdefd5f9b2465204480` |
| bytes | 1388368 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `b69d6a967096ce4179acad191422c21d8fe16055a29aa93fb6ce41474aa4e369` |
| snapshot bytes | 51653 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1326 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `deposit-fixture--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e3c312e808a8a2d26f26f9cb7bc7803b0efc30488630e95cf4cce742eb4d89b7` |
| bytes | 1347668 |
| snapshot | `deposit-fixture--mobile.snapshot.txt` |
| snapshot sha256 | `91ac0a409d852129ac2c3d36a5fbdf3151c5af46703a6c7d78bfc15e9310cdeb` |
| snapshot bytes | 50846 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1481 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a9646b1dc97e9b1008f49f32abe93f461bf213531274307603f2121979563fa1` |
| bytes | 763963 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `9efe3e1e22fbd5d0b3c9b5f7e4063c9fdfac761c75c43d01884859b333f57934` |
| snapshot bytes | 52531 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 6956 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4c175bb1abb07c64fff9e46cda3eb8f734878c6911e70e11a24f27a1a19296d9` |
| bytes | 714457 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `a4c6550659058deff5b0cd8c3c1f89479ba72b17fc2c531a524ad474e97360bd` |
| snapshot bytes | 51848 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 9781 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `18a0993dbbe7593ea2e476b95c38543961c40ea809d5d47d63746983b14e63f0` |
| bytes | 626077 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `a6f7a66d4893965413f6f21f029599519d39250888204cecad0463c688bdb0a1` |
| snapshot bytes | 29472 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3578 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d29d6499482d466265f236e8fcefc38050d64c4579ebcadb7506598663630fa2` |
| bytes | 482251 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `44db327761dc1807cb1aad540cfa7862ad82a18499da1f604fb9135bdfe8c9de` |
| snapshot bytes | 28410 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4608 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b08103c659daacf8f453f8eed9375035be86a12802e5618e0fdee3bc8205ed85` |
| bytes | 421395 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `72c60f2478d192b291d39c1d50135f68953ade384887f5ec51e9993de44638c3` |
| snapshot bytes | 2314 |
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
| sha256 | `b4916ef6dfe80d115c46975917bdc65b7395408b80659bb61be500e539390c7c` |
| bytes | 735952 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `ada71ab87db57735c9e22ac4c6ca898aa02d1dfee42aa07cf061073fa843841d` |
| snapshot bytes | 44866 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5749 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `bca981cdce316f89d643233351abce1886c3086e98bcda8de8a674fbd36c8137` |
| bytes | 659708 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `b2cff239fcb36b08bfb4528faeb3826dad28850e848f86a46b363792bcc4d6f3` |
| snapshot bytes | 43944 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 7850 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `974dd8e86cfcf4231008937e04aa1a84cd174cf7563d65cc1560e323af4e24c0` |
| bytes | 1043347 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `a3c2223e182fda4c9eb2b4dfe720c446405cf433d0ac7e9c8276584277d20957` |
| snapshot bytes | 41810 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 4849 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7a52ce3a51db5cf60409e98ede0ba126eb4beb758ca0f4d271b206d60d09b52d` |
| bytes | 683844 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `659c53f21655a0c3ce7979640760521b595d16e3fe8d6f3df431753dbb84f7fa` |
| snapshot bytes | 40902 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6376 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f5c69e3c66c8f17a8b35c12b41256fd098c75be8f8051e5f6e3a3573412e3f4c` |
| bytes | 784654 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `0d97b6ced86d4e0ecf642aa76e450a55cef821e39b1408672ee8209b737789fa` |
| snapshot bytes | 41707 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5445 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b31b4f2fbfa280a15022a8fe21119ed2f5891c85dbd4e76446b64187164d777c` |
| bytes | 554953 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `1b453b4add69bb0aee8ffc38ff20a7dea894f0f5e16f0faf7f82cf2d4759a3ee` |
| snapshot bytes | 40833 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7330 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3a5e3d8f336eabfff20c7953237d39efbffbb193db5e021064045d06030cd2a8` |
| bytes | 627235 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `19f27f3d2f0ba6e4b1f8e0718da183943651fb5c4e4b5321fbe0702e19c5b117` |
| snapshot bytes | 52585 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5937 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3193c8d94caeb4a9f24303fbcb144df9854e2e8e19e157447dcd6b467658dcf5` |
| bytes | 476561 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `fb23ecd7b4bccdcf1920e0207437d53f2adc7fbf78f5a20647369c9c56be03d8` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8342 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `81d51b40415111ee8ce55e1fd9a367c72826c23b6c9d896a4a33c82a65bd9118` |
| bytes | 677801 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `10b49fa9a2132c6b87a57c4d9674ff23a8b90c3af0688ebe35915a25653d1fd0` |
| snapshot bytes | 52030 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5850 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6c331ff897e714aeeb04d3b8c681cda1315e6d24bbb16bed89617de54c89f818` |
| bytes | 544532 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `9545a6748fbe3e83613027256af8aa4264217b2af3f757a03a0196e1d695bb31` |
| snapshot bytes | 51162 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8220 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9bdc13b28d1f4ed1d2fe10c257dbde6942521ca7490db054382d4d9f3a3cc9d9` |
| bytes | 612369 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `c7871c55d7bcfdc97362db916eeaaecb1e50b8001fb6d6c3ba2cd54a0a44886b` |
| snapshot bytes | 52585 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5991 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8c44fb690ff437d7dc52c704145c7bc44cf213f88bf9e01dc1439a06d588ce31` |
| bytes | 474821 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `4c05adade4b137653994c9b19e14296ec50c37a7ac27c02d17c65691865ffac1` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8462 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7bf6c0322af07d780db42f8dd64c42bd8a9eb47d5930f59bd6c5d97b0d74846e` |
| bytes | 795055 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `95054f8dc00dd1f59214193158dfd76cabe91c15620b8255a52f00aa79e0eec1` |
| snapshot bytes | 52749 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5304 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3860185f6012ccdfc60e9dd320005d82ec55385614c3f9228fc8363c32d7958c` |
| bytes | 643995 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `49f33be4fd024055a218484df5175a9a89744f40ba453d716183b2d9f0b3ffa5` |
| snapshot bytes | 51726 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7386 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a223cad04ef1a8af085b40327b8e3b2bd7d7e71f15c06209c3b23a1a3ccc0a96` |
| bytes | 776139 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `80996c00882e87b2bd728ede10e61d6510fed13a16d68412588f983ff50b1de4` |
| snapshot bytes | 52701 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5325 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `367be1abb76419e1c2ac10fb35248693e0ea8ac971f4dfefdb13897dd3571991` |
| bytes | 653593 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `fbb5b1bb93de0b7b5d398ba0cafcb215ab4eaa8005744086af870e5884fa725d` |
| snapshot bytes | 51697 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7359 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b338efdf31d4fe36bc580f613af73c0d02f79db9fcac5bad51103341887836f5` |
| bytes | 662622 |
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
| sha256 | `f236db3f0b630f8a449a7fa7ab08acf657606f7fc190268b3665b97684fa082b` |
| bytes | 493981 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `caca7d552640f415f5f807e029dfd7dd4e4b1a4d17b5bd009dfd1db45d895121` |
| snapshot bytes | 2958 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 1744 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `public-example-provenance--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1ad60c6bf44f57873d3b43ce68fa47b7d07663ce17b0514f4e522700b1c83cbb` |
| bytes | 437423 |
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
| sha256 | `db0e4b434a2b4474ed0a0d74f76f1cefe80dc80a5c55ebab04eba138d90ff29e` |
| bytes | 451802 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `8b72c476303151074fd869e30cf3941b6089d759606db5f277af4df00018ecc1` |
| snapshot bytes | 2611 |
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
| sha256 | `2360a23abeed43c9889f8bd236901ddcc0ffcbf386ace50f81756e1c7d8cfecd` |
| bytes | 424127 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `b3406d50869ea1fa069ac1050ed265997416ee5559e704e50e7c68cb69abc14c` |
| snapshot bytes | 2502 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1088 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f81f9ff9dede66481d1086a42f5662a17ce03869aeaf7f645f74fd1ef929ee55` |
| bytes | 397641 |
| snapshot | `read-error--mobile.snapshot.txt` |
| snapshot sha256 | `cacc463ba4c63167cca5aabe6942bdc48df0b840a58827993bca3f2b52ad8167` |
| snapshot bytes | 2175 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1144 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `2fa926f219368ee3b5f3ec6a0eeacafdf30e3473d8800e75bf1c919d6a9a110d` |
| bytes | 306518 |
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
| sha256 | `fc8b1e10179c08645c554e0e2222b41d336de2cfb2ccd21b8367ebf5f7d09a28` |
| bytes | 277090 |
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
| sha256 | `e32f5801581e4c934db6804f604bb8b1a7add9182223acb902e55018ec835390` |
| bytes | 783415 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `42b80da2a403acc686e7a4ad40cfbb269879f717256ec204393c91e7d4335562` |
| snapshot bytes | 73464 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 4533 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6d22c9d9e8add1a8c3d4f2905db55388570e3efeade8c8e39b8fec19900f46db` |
| bytes | 735214 |
| snapshot | `register-overflow--mobile.snapshot.txt` |
| snapshot sha256 | `b7a0110a49728f916aa381831f73600b26399903b2b761207ca1d6fe61fc6276` |
| snapshot bytes | 72511 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6034 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow-expanded--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9872d5a5c15f46310981f07125548c963cab24fbd4952de1b2d3e975b8092a0d` |
| bytes | 817367 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `2663ce1a4de8193143202fbb998d49f67417be90abd18f5bfc25f904c499400a` |
| snapshot bytes | 73497 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5044 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `44154da65d000dd2b69cc1244e30815dba2c2774a293b1091d7e1a184542a832` |
| bytes | 725043 |
| snapshot | `register-overflow-expanded--mobile.snapshot.txt` |
| snapshot sha256 | `5f71076388f02ef94b2657ca3eb6621f98f8b81da0dcd0822fc2a3338bda471d` |
| snapshot bytes | 72461 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6795 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `21e5e37921c8e2ada8fe295ba2f58488d5e0817bf44da47db8c61f0c5cdc9930` |
| bytes | 498669 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `6dbc4f7657f2f11a82bff7f825cff3933424f9e2d86b84f629c890f87cc8ea5e` |
| snapshot bytes | 30609 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1317 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `270f43909a05a79203b3729d5e909941a115d9602b9409c39af6d0eb19f6c22f` |
| bytes | 369921 |
| snapshot | `share-consent--mobile.snapshot.txt` |
| snapshot sha256 | `a5b47f0489d523d2615ebf0e9eef2fe0a2999f126c56b304586f3932f7c3e23c` |
| snapshot bytes | 30022 |
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
| sha256 | `2197f78843b0f4f944fc2ce011eefd5f8815982230aa97d4c5e58f5d94e0b017` |
| bytes | 339149 |
| snapshot | `share-receipt--desktop.snapshot.txt` |
| snapshot sha256 | `34f2dcc6dffda9db228044980480cb81a09994263c3400c04024e3cdb801733f` |
| snapshot bytes | 7024 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-receipt` at scroll offset 812 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The dated capture receipt on a published share — three sections and the closing block |
| expected behaviour | Three sections in fixed order: what the system said, what sources appeared, what Imbas could not observe. The sources section is stated as uncaptured in words rather than left blank, because a blank cannot tell a reader whether Imbas looked. The closing block is last and is the same block on every receipt: what this record does not establish — no cause, no intent, no completeness. |

### `share-receipt--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0c26ae57fe28c8b885dff7f13d307ef853632bb57b1ffa6375e1403ebf28629c` |
| bytes | 352749 |
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
| sha256 | `f0bfe39f3fec602ba667275138f2f39cbf211cf873dd8dfa0a35940290d6a227` |
| bytes | 314912 |
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
| sha256 | `7c8bf777008de1cfbc9115153bd4a2ecee6916d61fed7c4c13342309fa56c39a` |
| bytes | 277826 |
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
| sha256 | `cca13a3ff11811ea419e4ec6bf24a5e4dcf75c2343aaaa86fd9a8d21777a3f2a` |
| bytes | 795325 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `9c929ca433254690288c479c17b9c5fd6b6310dd4f4e27805bc525f1119095df` |
| snapshot bytes | 12925 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1388 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4aa3c8f784a5fdcae9973b9ffd2e907bd700ccdf725400640a9771375775ed76` |
| bytes | 592870 |
| snapshot | `single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `db52c211e8e42405ef6c03d8343a5aab17cd70d586435ccf095c991d4e0f0556` |
| snapshot bytes | 12145 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1568 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `66583a498fb610773a30ae11d2e5e5bc393ed3aa5ce1c2c3cefb88f0cc493e35` |
| bytes | 642953 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `7c0d22ab528dec2f22d9570dff328e776765e8e6400f9590c1bc8f6182059e6d` |
| snapshot bytes | 12289 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2029 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a8d67fd9da06b435868f3f14f6eada004495a6c46d21699cfe6fcead90951df5` |
| bytes | 552378 |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| snapshot sha256 | `d878f3d5bf29915398f8c9589275d4ddc8b784f0398300aee9a98f8db388314c` |
| snapshot bytes | 11667 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2367 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9365b07bc8d15773c98ea8270385b09fae4712ddde1359d613e3ea5c36f17658` |
| bytes | 781462 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `180d27ec6a20a196c1ff02a6a94e86b52839cb20108921fa1452a729eaf9f37e` |
| snapshot bytes | 29989 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1414 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e763edbdb55d72e73d03db6e1691852558bf6aeedae59b589f44756a8823e36c` |
| bytes | 592765 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `dde78fa0dea0c0f1edae05902d0a7de8cc45116fd1e42a612faed95570434f59` |
| snapshot bytes | 29351 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1634 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
