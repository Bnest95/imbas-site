# Visual acceptance manifest

Generated, never hand-edited. `node scripts/qa/visual-acceptance.mjs --manifest` rewrites this file from the scenario registry and the bytes committed beside it, and `test/qa-manifest-freshness.test.mjs` regenerates it and fails the suite on one byte of difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping belongs in the harness that emits it.

Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no machine path. That is deliberate: a manifest carrying any of those goes stale on commits that never touched an image, and a document that rots on its own teaches its readers to stop trusting it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's `## environment` block records the conditions its own capture ran under, and `git log` on an image file records when those bytes last moved.

## Scope

**This manifest governs both committed baseline layers: the `.png` images and the `.snapshot.txt` files beside them.** Both are checksummed. There is one row per image, and it carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in `docs/qa/visual-acceptance-harness/` is governed here.

The inventory is complete by construction rather than by inspection. `scripts/qa/scenarios.mjs` registers 31 drivable scenarios and the board is kept at 2 viewports, `desktop` (1440x900 @ dsf 2) and `mobile` (375x812 @ dsf 3) — so 62 images and 62 snapshots are registered, and every one of them is listed below. Generation stops rather than emit a partial record: a registered baseline missing from disk fails, and a baseline on disk that the registry does not register fails too.

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
- **The mobile-tall viewport** — Declared in VIEWPORTS and not part of the default board. It exists to re-test a reported blank-compositor claim at 375x812, not to double every baseline; running it by default would triple the image set to re-photograph the same states.

## Images

62 images, 62 snapshots, ordered by filename. Every checksum below is of the committed bytes as they stand in this tree.

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b8c94130c0522adb37e85d8f635e5171b0e84f1e44b0b8e47792cd7e36d35c84` |
| bytes | 1066086 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `caa38a479c546739dc525ff2fe48c21e5dcc9b83b1d9f313000f3d3ef127ae64` |
| snapshot bytes | 52904 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5120 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7e0b709f27d6dda6737dd018418435f22fc63990a4423d4460dd6878200e1d0c` |
| bytes | 1047825 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `f83807823a70af6aeecdcfa6251718db6bee4c71477a8639c07a321502e2371c` |
| snapshot bytes | 51873 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6763 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `dc365e41bec950b95d69553f4f519f7507b6e7923bba0fdf1992bd11ddd493c7` |
| bytes | 1053638 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `5a1d3dd276a4403fc2e2012e946501e4e7cd12475c4c0320cd8fdee2c2238087` |
| snapshot bytes | 52876 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5130 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ef0fbc1bdfc27409928507492e939cf7586642f771e027abeaf69072163b8252` |
| bytes | 984045 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `b48257d586b974725bd726b376db6ee248b49ce4da9f427bc85a4217567e56d0` |
| snapshot bytes | 51859 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6763 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a80f70020940b0a6884f1fc9db20efc8bb4c89edac49709fc9ab2609817b8adf` |
| bytes | 1059196 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `61d3977ae08f0dcb76ff5bb92c242f470ccf5a685c1c7fe316cfaa9026b4c57b` |
| snapshot bytes | 52871 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5120 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1e4c42add2882f33d184493d0c1c7b063528c0d43b1eaa73d481dc2440585438` |
| bytes | 984968 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `3ba546b2b1258d0ebd7f8b89bb8dcd59cb979bd642399aa2c97f5eb8387b875e` |
| snapshot bytes | 51854 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6770 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a722f994f07eb65ddb39632065e8d222699cc202cbb02ecc803124ba38f46157` |
| bytes | 1060999 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `dab15cdb193f4f4262faeb6fd26563ebbfd00bb661d7969183ebf367667d622f` |
| snapshot bytes | 52868 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5130 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9d4fe58af9d405eef14a87bdd7845e262fa6fe5bb842ef4c81acc16e73b1a8ea` |
| bytes | 938338 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `8d718cd8bddaf8cca85b2f3a532d14e166dabfb53e934748cb55f664de67a362` |
| snapshot bytes | 51851 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6781 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `curated-readout--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1839d7a2f77cb7ef3465cae786bc26a4938347a5733f5eb82f524b6e8045cdbc` |
| bytes | 467710 |
| snapshot | `curated-readout--desktop.snapshot.txt` |
| snapshot sha256 | `a21841e8ae22e3b27f9198d34d35fb6fe74294fe3e2111ae1fc277dba54a61a5` |
| snapshot bytes | 2397 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `?reader=0` |
| framed on | `.wb-readout` at scroll offset 205 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The curated case console, first screen — provenance and run strip with no score |
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |

### `curated-readout--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3be27310118a65d213f5e14e00bb99306357c8ced18bb93915e02550e6b500a4` |
| bytes | 318055 |
| snapshot | `curated-readout--mobile.snapshot.txt` |
| snapshot sha256 | `b531c67fc9b6029d34f592656926d8bc9b919b947217c00e1d72dfb8d0ceefbb` |
| snapshot bytes | 1378 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `?reader=0` |
| framed on | `.wb-readout` at scroll offset 567 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The curated case console, first screen — provenance and run strip with no score |
| expected behaviour | The case provenance line carries the case id, its category and its observed date. The run strip names the category, the four models tested, and the observation date. This is the screen BEFORE a person pastes, so neither retired hero was ever in this frame: the scored gauge and the live verdict badge both sat on the result panel one step later, which the board does not photograph (see the manifest). No gauge and no scored figure of any kind appears here; the board's score scan is what holds that, and it cannot be written out longhand here without tripping itself. |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ed4fe6e4c5b9a56f3308add2a08c4925d146b4d24fd8dd9bd9fc5d7040ee8f7d` |
| bytes | 764082 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `48be6baa64b0a75eb2a7b7c54c8d4323122e7f8aecb363f8982c343aa085207e` |
| snapshot bytes | 52595 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7083 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6c63eff72f0d611eec32eb2192b76099ed88a8f03fd0a75473bfcff5cdbcb64b` |
| bytes | 713218 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `a0598c7bc62027ef15e2670dad8a1b27d792e74f1deda5c72d1dbefee02e7184` |
| snapshot bytes | 51952 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 9911 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d04efba9b576dd20110e3d6f438f0b5aaa7f08d56e7320a182b609f95180c22c` |
| bytes | 623048 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `6745506e3eb9dfbd1f8485c39630391a7648cff6e364d4490e45bf356351fb4b` |
| snapshot bytes | 29536 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3704 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `325b7b48c41dc70bd3247a26bd2a63e11b850ae86f082de12772bf4af41b1821` |
| bytes | 481338 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `41b8eb65927a446bda7c24fae271095674c366cde358c2aa455b39c993ae301e` |
| snapshot bytes | 28472 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4737 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8e8dc8e7dd4cec8306521a70fc4696b1253f279d820b1b4644993e307cbc721c` |
| bytes | 420222 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `971c99b8c2790b9cf453ff83725999fbad97c47684ec59aa6244083c519f848b` |
| snapshot bytes | 2344 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 141 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `first-load--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a59dccc6a13acad09266fe357c888270122f48494e750373d2b59bb41aea4251` |
| bytes | 359166 |
| snapshot | `first-load--mobile.snapshot.txt` |
| snapshot sha256 | `79ee158322ac4f166ff4b3c1648f6f1ab586587f5298c7186935495080396183` |
| snapshot bytes | 1834 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 159 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `78534713be09467a95798d9efd861d8d78c6b2d4b711979ff73f07f0394e0e94` |
| bytes | 696076 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `5ff12eb292c1d6ec8b72ecaebd1d550e2f69deddd09ddfb9b19f20bfef12a746` |
| snapshot bytes | 44860 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5876 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d04d223be423b3356926b1206bd294926dca4bb677046596a32dd35c149a77ad` |
| bytes | 645725 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `3994a888411a3f44086bde665869e4bafa39b6dcc1e40d74eb98c30e9623f30f` |
| snapshot bytes | 43936 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 7956 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0d6c5219bfbe062d2aed346ada05b0507827e2814d4cb5c679d993977e74644c` |
| bytes | 1037129 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `9f7472813733892d86092a0feb633535076740a5124170516abe2a30b92dd128` |
| snapshot bytes | 41874 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 4975 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5e5b21d29b19bd77cd72b9cc0b91c2df4954321818a6173fd30e44225c485492` |
| bytes | 685811 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `0bb24ef3420fa0e406091ba7ffe953d0e42686c12aa22d7473cd0716d084a726` |
| snapshot bytes | 40964 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6506 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ee11444079c222c069fd5e984df66729d6ea46a432968a7828b7d2b3965814fe` |
| bytes | 784356 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `0fa000908496db1168dc6c52c92e9fc6f88780caf98beb7cb1c5cd3b48125d4b` |
| snapshot bytes | 41771 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5572 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9985c06d553ecbd62604a48bf91bc79de62c5334dfd579be97a618694972e513` |
| bytes | 548748 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `cc9ae4f3aa050415277a35bf1d8f90eb6a73e95728efde0fbe52a78a11aa2a00` |
| snapshot bytes | 40895 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7460 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `95cad40b71e287fee7e79be75d3d84bde9985602da98f302cc65ed081b899f51` |
| bytes | 626782 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `0e3697ca9819beb5ab2b8a7f6b32c59212ccf58d858df9a5a919673db3b352a5` |
| snapshot bytes | 52649 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6064 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a22bd9197ddbcd898492e8847b51180bdb370bb774575aa081e36ae8d51d6fbb` |
| bytes | 475243 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `81001c655bb21a27a7cbc629005834c533538a7ebd584d6d0471e609532e31c6` |
| snapshot bytes | 51918 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8472 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a172a33830ffe88ecff9fa6e1a1ab17c8bc4a476b3298ec762b68a304c283c34` |
| bytes | 678862 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `476b7a42f5419f6966e87180914656adec9e2d28dc6e1717ef1ab50fa2ccf6e6` |
| snapshot bytes | 52094 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5977 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `861e89b6fd7db1b5f8945583cc3ca28b29292ee45d21ca51c9e56fdca085b673` |
| bytes | 542917 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `a983bd42771b11dd20075fefe1baffdf1c11751fb268962c7b74806ad38093f7` |
| snapshot bytes | 51224 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8350 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b95778787ff4f3fa13b08b601574ca529ae73b9f5232669743a0fa6c7509c6a6` |
| bytes | 614485 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `39dbb79ec0fde3706a457f294c96fd5c7f4296aa2bc376a3bb81f582e49d8e76` |
| snapshot bytes | 52649 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6117 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4f8d8d2e2dfcb67e8ad5ca62cd01a7a465be02d32969e5d83c5c5f54efeef5ae` |
| bytes | 477377 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `a2b76e30ab97a79711af2b2c9fcd692d7ac84970a53821b06053bac02bb3d760` |
| snapshot bytes | 51918 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8592 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `aaa0ce2cd864849c7100330af986f05fa89b1098c04e14a61c75b9d6cc6b3dd7` |
| bytes | 794740 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `d90ff71facb2f6ecbf19287341973bea020f3c32749eec35898ccd2913df6fc9` |
| snapshot bytes | 52813 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5431 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b9c40a0d8d5d8f1b306483d33ec4eecf87ee8103287514f959715bf598f33f36` |
| bytes | 642636 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `ab530a891b6caaf9abf7dda1f399abe0865d378992500d3d6731462480388066` |
| snapshot bytes | 51788 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7498 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3f29d81ed54277b571280001f81f6714afd7e8224098e4f97c82a0585b37bb70` |
| bytes | 775518 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `9c1f3fa0e7f01dc5a17b613e285f707e26da923820e6c06736119e749680aa0e` |
| snapshot bytes | 52765 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5451 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `390adf918d6e19feb3ea7b405ffe4c90a319d6782e0b03be59d71e3fbc33cb90` |
| bytes | 682437 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `25d6f0b3e8587c59e38e0334af2daca4db9ce5e4d7d3bd7a03eb8f1466589f19` |
| snapshot bytes | 51759 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7489 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `690f14f287a37c2c0a3ee2e7b448167f4ae18716790d0c4383860f00d0cd5f1e` |
| bytes | 663435 |
| snapshot | `public-example--desktop.snapshot.txt` |
| snapshot sha256 | `ef07a65a28057ed2b13157903efd22839ed541d13c03d74c0ca4ad8169f32d64` |
| snapshot bytes | 2711 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1252 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b69ce983f964a8cd4b750fb46e59d3ddd6628ca2e755040b3f23e5bdef38956d` |
| bytes | 512737 |
| snapshot | `public-example--mobile.snapshot.txt` |
| snapshot sha256 | `0ea9b963ead6e349a631d80eeb2a45be1489d632433f2d9ee84c2a173a076821` |
| snapshot bytes | 1479 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1811 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example-provenance--desktop.png`

| field | value |
| --- | --- |
| sha256 | `fd31796ab85dbaf4c20f113c99b134776899b56d53156fc349ca8e3b60e64945` |
| bytes | 493080 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `64ecd19ccd08afd31fb79037a531b48e8cba050a9e9e3aa8ccb40de84e5a43a5` |
| snapshot bytes | 2951 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 1744 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `public-example-provenance--mobile.png`

| field | value |
| --- | --- |
| sha256 | `71115124c93a500e1c9de5d7d37a62875dfd0a44fc983bdb9070ae76f25c0296` |
| bytes | 437579 |
| snapshot | `public-example-provenance--mobile.snapshot.txt` |
| snapshot sha256 | `89950afe6ed8ff2179d749f4bc0fb0e20daed31e4d973c184f1315ea0ec5b3fe` |
| snapshot bytes | 1947 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 2645 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `read-capacity--desktop.png`

| field | value |
| --- | --- |
| sha256 | `05ff30353b4419f733f6cd97600d22bf712cae49f77687f3a6aebf090b2db68d` |
| bytes | 463338 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `b61ec48dad7dbc157c7b23e8baf586689e86fb472b408a5428cdcc27bc72eebd` |
| snapshot bytes | 2616 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1086 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-capacity--mobile.png`

| field | value |
| --- | --- |
| sha256 | `78e06276fc424f133c9d4a79c6f348023009b4607137307b3405871f393a4134` |
| bytes | 441082 |
| snapshot | `read-capacity--mobile.snapshot.txt` |
| snapshot sha256 | `337d88597047ea958964fa5efe01bd01699acdc5301a423960308d2ad5cc2cf3` |
| snapshot bytes | 2199 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1147 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-error--desktop.png`

| field | value |
| --- | --- |
| sha256 | `11fd9686f5b208058710c330f38e6eb1cbdf039b074930d432298a1c0a3ca41d` |
| bytes | 436025 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `427ea8cc04387b778aeeb0d752ae532c71fc836bf4cf546b64372ac183ab2ff6` |
| snapshot bytes | 2507 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1076 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1e2267700ae70c21621fa8e0b1e2632d13366c96e7630a0cf3cb07eb7b5f9cdb` |
| bytes | 420509 |
| snapshot | `read-error--mobile.snapshot.txt` |
| snapshot sha256 | `2f533097cf8abeeff8e6086e5681077fa432dfc272b59e374971166a327a3a91` |
| snapshot bytes | 2178 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1118 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a49ed002d2a3b4eb0e2ad2968becd2e149c6942087e189dcbb82ad2ed5e9bb7b` |
| bytes | 307785 |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| snapshot sha256 | `b2f327b92ce10ef37bc569112b1f8491a11235cbd2b4fa4857291e7562943526` |
| snapshot bytes | 2558 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 762 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `read-in-flight--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b475359d0d5a7a6a17ed87544f2b9aca46e2f5508448fb655a95ff42687007cc` |
| bytes | 278780 |
| snapshot | `read-in-flight--mobile.snapshot.txt` |
| snapshot sha256 | `7c6912e4189011619a8c05bd827b4dab8a04e347c578ebecdf006b883ba5b5b0` |
| snapshot bytes | 2020 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 790 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0d2791a0b4f210e571fb63b512ade80597b9324957d24a18e39193ebd2165960` |
| bytes | 488646 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `6f107bcadd270925b6e8d63eaab95ae4de15f13ca8971b515597f2bbc188580d` |
| snapshot bytes | 30182 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1265 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `418e6a532192e410cf2c733e1e6ba82f819dcfdf1d5ab6d25f765b01418f5da3` |
| bytes | 379564 |
| snapshot | `share-consent--mobile.snapshot.txt` |
| snapshot sha256 | `3507e272d852ef526ee4b74252101375e5a2d504b0c21becaacfe54b7f0d241f` |
| snapshot bytes | 29617 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1248 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6fba282b57407b7c13711d5295f92631420bb4b73a3eeb172a590da8e73cdc6b` |
| bytes | 338028 |
| snapshot | `share-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `fe5a621c2dc8e55d4a30054847e8877809fc3b688d455145bf27e908c0bbb57f` |
| snapshot bytes | 6594 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-reader-result__archival-notice` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share published under the earlier format, with the retired rating withheld |
| expected behaviour | An archival notice stands where the completeness badge used to, saying in words that the earlier format rated how complete an answer was, that the rating is retired and not shown, and that everything else is preserved as published. No rating word appears anywhere on the page. This is the one mode that still renders the stored full answer, because that is what those records were published with. |

### `share-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `548fb00922899b3fb90f9810d09b9ba6906e0a4f2ae174460e852362a0425bd2` |
| bytes | 322092 |
| snapshot | `share-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `92bde887411054b5ae9223db349d8440148bf9c2856ff7e52c466c2c766dc95f` |
| snapshot bytes | 6162 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-reader-result__archival-notice` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share published under the earlier format, with the retired rating withheld |
| expected behaviour | An archival notice stands where the completeness badge used to, saying in words that the earlier format rated how complete an answer was, that the rating is retired and not shown, and that everything else is preserved as published. No rating word appears anywhere on the page. This is the one mode that still renders the stored full answer, because that is what those records were published with. |

### `share-not-found--desktop.png`

| field | value |
| --- | --- |
| sha256 | `4604e3ae11170b93749bd68f8e23d311bc66be68883bf33fb7ef6d986508ff88` |
| bytes | 1135454 |
| snapshot | `share-not-found--desktop.snapshot.txt` |
| snapshot sha256 | `4d649cffa8800d14cd5aa40fdc2482634299234b7e26b6f2e9a45c9e71bdaef6` |
| snapshot bytes | 1283 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-not-found--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b1a71bda14537e92216056d4064a6638e94d89e4b4fac385196776cd30090f58` |
| bytes | 921041 |
| snapshot | `share-not-found--mobile.snapshot.txt` |
| snapshot sha256 | `7536b9bdcaf4b34a6202cd4e1498add465b081184b220cf9c1513b6604aa0187` |
| snapshot bytes | 976 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-paired-no-model--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ec62acaf7cdc1fefda4a6fb4c015e60ced96fb256590491740a740c167d5490b` |
| bytes | 330939 |
| snapshot | `share-paired-no-model--desktop.snapshot.txt` |
| snapshot sha256 | `ed8fc8ec3aeeefdf690f48ffa33856f808d86ad7dfed298a219d6b390d4a6a0d` |
| snapshot bytes | 6500 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published two-question share whose answering system was never recorded |
| expected behaviour | The anchor reads as a whole sentence with the system stated as unrecorded, not as a fragment with an empty slot where a model name would go. Imbas does not fill it in and does not infer it. Below, the delta rows quote both sides. |

### `share-paired-no-model--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d1554d85fbcde0bd3b744060c6bbe16c27876317e993ad4c0e7f9289e0e7b399` |
| bytes | 316262 |
| snapshot | `share-paired-no-model--mobile.snapshot.txt` |
| snapshot sha256 | `d6afb2ca7334238bb9c0293cbafb29d1db8d652dbc0283c433e5506a6c070698` |
| snapshot bytes | 5957 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published two-question share whose answering system was never recorded |
| expected behaviour | The anchor reads as a whole sentence with the system stated as unrecorded, not as a fragment with an empty slot where a model name would go. Imbas does not fill it in and does not infer it. Below, the delta rows quote both sides. |

### `share-receipt--desktop.png`

| field | value |
| --- | --- |
| sha256 | `aa72903988efe9b36182c2d6083f446ff5c03e85605add4b84caca410cbe1e8f` |
| bytes | 339732 |
| snapshot | `share-receipt--desktop.snapshot.txt` |
| snapshot sha256 | `66943930fa76f47d3485314cf16bfbbfa19e8fafa785bc20701f8d58e5681a13` |
| snapshot bytes | 7035 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-receipt` at scroll offset 845 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The dated capture receipt on a published share — three sections and the closing block |
| expected behaviour | Three sections in fixed order: what the system said, what sources appeared, what Imbas could not observe. The sources section is stated as uncaptured in words rather than left blank, because a blank cannot tell a reader whether Imbas looked. The closing block is last and is the same block on every receipt: what this record does not establish — no cause, no intent, no completeness. |

### `share-receipt--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6e050b009b11f70807e96d0a3bc39e83e00ca3845d812de2e6f0daab0d61bbc7` |
| bytes | 353445 |
| snapshot | `share-receipt--mobile.snapshot.txt` |
| snapshot sha256 | `04874ef405fa7c931dd5077414eabbb97e8d0d9f177935be1860e37897a7e24c` |
| snapshot bytes | 6416 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-receipt` at scroll offset 1202 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The dated capture receipt on a published share — three sections and the closing block |
| expected behaviour | Three sections in fixed order: what the system said, what sources appeared, what Imbas could not observe. The sources section is stated as uncaptured in words rather than left blank, because a blank cannot tell a reader whether Imbas looked. The closing block is last and is the same block on every receipt: what this record does not establish — no cause, no intent, no completeness. |

### `share-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0cfc4c39dd4b6e9221428fc6b12d79d05cba8d1d9e6252b3f77171b4553ab671` |
| bytes | 330130 |
| snapshot | `share-single--desktop.snapshot.txt` |
| snapshot sha256 | `0bf55bb3bc289494150856ea409ca4fc3951ac58e3c4fea3f57d074e012159d8` |
| snapshot bytes | 6495 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published single-mode share, at the top of the record |
| expected behaviour | The anchor line names the capture date and the declared system and then says the record does not change. Below it the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows. |

### `share-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `003e37b7b7e7367ffbbac9fe8af4f98d82aa40efc900d88c9f45f6e88509ca87` |
| bytes | 307823 |
| snapshot | `share-single--mobile.snapshot.txt` |
| snapshot sha256 | `2972162ea448f2127bc6bb6d8099f4e76994b6547695e799826aef35d1db6ea9` |
| snapshot bytes | 5922 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-record__anchor` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published single-mode share, at the top of the record |
| expected behaviour | The anchor line names the capture date and the declared system and then says the record does not change. Below it the question, then the findings, each with its own signal name and the short excerpt it points to. No score, no rating and no tally appears anywhere — the retired figure is gone from the page, not merely from new rows. |

### `share-single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6b656ef4ec07fac9b40d754db45838c3606a78cf754c1dec52a7d78de8c79b7e` |
| bytes | 299121 |
| snapshot | `share-single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `e0ac76e7fe9123d1bd2d5f83bc4320032d80ab754e9ac4e2c24ba69c21176f81` |
| snapshot bytes | 5808 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-measure__findings` at scroll offset 24 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published share where nothing surfaced |
| expected behaviour | The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty. |

### `share-single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b37f6973ebfebe53bda8452abccc7746b52b64bd6863c182083aaa20142628ed` |
| bytes | 302965 |
| snapshot | `share-single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `4c58bbc461d52d9642ae3c196627715c4b4faa649e1d68479c4ba2c5dde60c5f` |
| snapshot bytes | 5108 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.wb-measure__findings` at scroll offset 142 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A published share where nothing surfaced |
| expected behaviour | The findings panel carries the same empty sentence the run surface used, word for word, so a visitor who read it on the run does not meet a differently-confident version of it here. In the receipt, the section that would hold preserved excerpts states that none were preserved instead of standing empty. |

### `single-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `411c643c6a2b0aa990407f2fa240debbd5d56a1806895fa18cd5e0551048d668` |
| bytes | 591751 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `9362df7c9edd40fd3ed109898ea26bef6ba2fc9ca780e3c543dcd68a0da0b55e` |
| snapshot bytes | 12242 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 2431 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the MEASUREMENT panel's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ddedc90238e52bbe27b576c793e90744c4e88330f623e0d87091897f3cf4187f` |
| bytes | 491023 |
| snapshot | `single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `fed9927266dcf08bcca318e13e00b3d77c5e5240c9917d04c88ae8e55a8fb3cc` |
| snapshot bytes | 11707 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 2724 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the MEASUREMENT panel's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `47fd100149a5ed6760e9a81f1999af1bbe076bad78d52e5f123f842158e9b6b1` |
| bytes | 643015 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `8b454c6c36459a161e2b68c53f7f5581d4dd2a3a5d90c849aa468af67f9a3156` |
| snapshot bytes | 12268 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1547 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a6e7474716d93a5976a34f20d353c7ffaf9f257ddb690a39f497a9ece2dacfff` |
| bytes | 550951 |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| snapshot sha256 | `6d1cedfc01ae9b2d899adf098e70926e514d6bcb751384f8d141a6867634301a` |
| snapshot bytes | 11699 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1633 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7088d299b5f1571db9cb3f954cf7d9b772374af3a48e979a99d9508f593cf914` |
| bytes | 677917 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `1dc2e9cbb5bc85be24a86600d00e217bd55e5f0ef4bb7874afb5a264717da88a` |
| snapshot bytes | 29265 |
| viewport | 1440x900@2x (desktop) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 2614 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: two finding rows, each with its own signal name and its verbatim anchor, and no tally above them. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d2ab03c953021a5a1a20ba5b2f3fa99376dae65e4b90a9b0b6fa63cdc32dab7b` |
| bytes | 509607 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `56a6c21728fbcdadf92d96f610ff9682ee12656a14f970c258ad4403cf1a10d3` |
| snapshot bytes | 28792 |
| viewport | 375x812@3x (mobile) |
| url | `/workbench.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 3001 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | MEASUREMENT panel renders with the Candidate findings list non-empty: two finding rows, each with its own signal name and its verbatim anchor, and no tally above them. |
