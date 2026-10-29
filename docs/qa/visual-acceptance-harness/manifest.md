# Visual acceptance manifest

Generated, never hand-edited. `node scripts/qa/visual-acceptance.mjs --manifest` rewrites this file from the scenario registry and the bytes committed beside it, and `test/qa-manifest-freshness.test.mjs` regenerates it and fails the suite on one byte of difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping belongs in the harness that emits it.

Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no machine path. That is deliberate: a manifest carrying any of those goes stale on commits that never touched an image, and a document that rots on its own teaches its readers to stop trusting it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's `## environment` block records the conditions its own capture ran under, and `git log` on an image file records when those bytes last moved.

## Scope

**This manifest governs both committed baseline layers: the `.png` images and the `.snapshot.txt` files beside them.** Both are checksummed. There is one row per image, and it carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in `docs/qa/visual-acceptance-harness/` is governed here.

The inventory is complete by construction rather than by inspection. `scripts/qa/scenarios.mjs` registers 45 drivable scenarios and the board is kept at 2 viewports, `desktop` (1440x900 @ dsf 2) and `mobile` (375x812 @ dsf 3) — so 90 images and 90 snapshots are registered, and every one of them is listed below. Generation stops rather than emit a partial record: a registered baseline missing from disk fails, and a baseline on disk that the registry does not register fails too.

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
- **The homepage's first viewport** — The scenario is written and sits in `PENDING_SCENARIOS` in `scripts/qa/scenarios.mjs`, which carries the measurements in full. Short version: at the board's desktop viewport `Page.captureScreenshot` does not return — 60s, 180s and 420s budgets all expired with the renderer at 98.5-99.7% CPU and RSS flat near 145MB, so the frame is compute-bound in software raster rather than waiting on anything. The cost is `.film-grain`, a fixed full-viewport feTurbulence layer, composited over `.hero__monolith-text`, a gradient masked through `background-clip: text` at up to 18.7rem; hiding either one alone lets the same frame capture in 1.3-1.7s. Pixel count, CSS filters, the sticky header and the nav breakpoint at 1280px were each ruled out by their own control. The other three homepage frames photograph normally, including one further down the same page at the same geometry, so this is one frame's blocker and not the page's. Nothing here is a product defect this lane may repair: both elements are in `styles.css`, and buying the frame by hiding one of them at capture time would make the baseline stop being what a reader sees.

## Images

90 images, 90 snapshots, ordered by filename. Every checksum below is of the committed bytes as they stand in this tree.

### `advisory-boundaries--desktop.png`

| field | value |
| --- | --- |
| sha256 | `79cbfafbe8d796c6695264a52ffccc139a0aacb5e5fc88b5ae5ee7a4c2646f21` |
| bytes | 624846 |
| snapshot | `advisory-boundaries--desktop.snapshot.txt` |
| snapshot sha256 | `7a2f7fccc9327c81be1bb76d7196edcb4dde73ee77a64da6fdebd9f58a2443e3` |
| snapshot bytes | 2396 |
| viewport | 1440x900@2x (desktop) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-terms` at scroll offset 3737 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the terms line in the close — the wall between advisory work and Imbas's public measurement |
| expected behaviour | The close of the page and the one line of terms under it. The v4.4 rewrite folded the three practice commitments this frame used to hold into that line, so the frame follows it. The line still carries the boundary the rest of the tree depends on: client material stays confidential, and advisory clients do not influence Imbas's public methods, measurements, or findings, with the independence policy one link away. This boundary is the reason the commercial page can sit beside the measurement work at all, so it is photographed rather than left to prose. |

### `advisory-boundaries--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3c4b37fd165d7c45f117a30a494a4e8b56ceaac5724c23da08a421cf9b6780c0` |
| bytes | 553029 |
| snapshot | `advisory-boundaries--mobile.snapshot.txt` |
| snapshot sha256 | `b7f8e5b1e6922532cdc4beed863cc4cc2a6745889c575eac8d19be9d88903e65` |
| snapshot bytes | 1501 |
| viewport | 375x812@3x (mobile) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-terms` at scroll offset 5946 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the terms line in the close — the wall between advisory work and Imbas's public measurement |
| expected behaviour | The close of the page and the one line of terms under it. The v4.4 rewrite folded the three practice commitments this frame used to hold into that line, so the frame follows it. The line still carries the boundary the rest of the tree depends on: client material stays confidential, and advisory clients do not influence Imbas's public methods, measurements, or findings, with the independence policy one link away. This boundary is the reason the commercial page can sit beside the measurement work at all, so it is photographed rather than left to prose. |

### `advisory-masthead--desktop.png`

| field | value |
| --- | --- |
| sha256 | `aeb4c91b6c75a56888f53204127602bbd405800eee1ced8c5b8d855be573eb61` |
| bytes | 888036 |
| snapshot | `advisory-masthead--desktop.snapshot.txt` |
| snapshot sha256 | `80e37083d31e8614a55c8a554e6ff60eb767cce52f5cf700c44caa1006106dbe` |
| snapshot bytes | 1514 |
| viewport | 1440x900@2x (desktop) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-hero` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the hero — the heading, the lede, and the two ways to act under it |
| expected behaviour | The proposition the page opens with since the v4.4 rewrite: the heading, the lede that says how the work starts, and the two actions under it, Email me and the link down to what the work covers. A later Advisory restructure changes this first, so it is framed on its own. |

### `advisory-masthead--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5ac9ad2537d5901b74bb74232ce6d4bae8371bf47337cb70ce7787d20e06df06` |
| bytes | 747449 |
| snapshot | `advisory-masthead--mobile.snapshot.txt` |
| snapshot sha256 | `7b1f7f2442a5de1a4184582394dc0a15cad276a683b4b82eff9a12b7e5a6259b` |
| snapshot bytes | 1131 |
| viewport | 375x812@3x (mobile) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-hero` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the hero — the heading, the lede, and the two ways to act under it |
| expected behaviour | The proposition the page opens with since the v4.4 rewrite: the heading, the lede that says how the work starts, and the two actions under it, Email me and the link down to what the work covers. A later Advisory restructure changes this first, so it is framed on its own. |

### `chip-arrival--desktop.png`

| field | value |
| --- | --- |
| sha256 | `72350fa319b100b6a76b5e72b619137b38ecd0a827755ff66ce42aa8f4de6003` |
| bytes | 470079 |
| snapshot | `chip-arrival--desktop.snapshot.txt` |
| snapshot sha256 | `00e9211cfc5fd1181d910979e9e0fad03cc27ed0c2a005875265e0fde6a52726` |
| snapshot bytes | 1921 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 290 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chip-arrival--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b59ac825785b4dda5efc60680d8c47cbdf05ba113ef9390005aabfdff85d1757` |
| bytes | 310632 |
| snapshot | `chip-arrival--mobile.snapshot.txt` |
| snapshot sha256 | `328bc7c2135f54a9332ac72934a7c195a1a2aef5d326f54f95ae766d77d6f5a4` |
| snapshot bytes | 1287 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 526 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chip-delta-held--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f866bf182fd1f0a2996bfeed7950ada37f17618ec24b4db17963cd84493b4443` |
| bytes | 533386 |
| snapshot | `chip-delta-held--desktop.snapshot.txt` |
| snapshot sha256 | `504e3a3dbfa907650182f60a0485af70284cf1a98047920109d1705f8d0379dd` |
| snapshot bytes | 53128 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-chip__held` at scroll offset 4085 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane at the delta, after a follow-up was compared, with the first answer still held |
| expected behaviour | The comparison is rendered and the answer the person started with is still on the page above it, in a disclosure that is closed by default and read-only. The head's claim that the pasted text is still here is now something a reader can check rather than take on trust. The lane's boundary block is carried at this end of the loop exactly as it reads at every other: the locked Reader sentence, with the user-attribution line beneath it. The professional cue does NOT render here — it stands at the proactive entry door and nowhere else. |

### `chip-delta-held--mobile.png`

| field | value |
| --- | --- |
| sha256 | `cad8cbfac5f6a17b56e183b0132c719660929b91976feb0fbe00e8de57394bc0` |
| bytes | 614590 |
| snapshot | `chip-delta-held--mobile.snapshot.txt` |
| snapshot sha256 | `aa0a49d6e357bb83a87bb73e356b62b61f248d0e80687dc173d088195e340bd0` |
| snapshot bytes | 52312 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-chip__held` at scroll offset 5852 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane at the delta, after a follow-up was compared, with the first answer still held |
| expected behaviour | The comparison is rendered and the answer the person started with is still on the page above it, in a disclosure that is closed by default and read-only. The head's claim that the pasted text is still here is now something a reader can check rather than take on trust. The lane's boundary block is carried at this end of the loop exactly as it reads at every other: the locked Reader sentence, with the user-attribution line beneath it. The professional cue does NOT render here — it stands at the proactive entry door and nowhere else. |

### `chips-from-inspection--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8d3d64e9489ae505098b1c8a687c06a28361b6730c260a5d6295db77bcb97b08` |
| bytes | 506654 |
| snapshot | `chips-from-inspection--desktop.snapshot.txt` |
| snapshot sha256 | `6217cc2fc6f737bcea06de05da67cd9087a4f26cfbb47e9cb871e369829515cd` |
| snapshot bytes | 29484 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 4008 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over. The origin block names the question and never the answer body, because the answer body is held once below it: the lane's own first answer field carries the inspected answer, read-only, so the text a person is about to steer is the text that was measured. No second editable copy of it stands anywhere on the page, and the inspection's own count and marks are still in the document above it. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chips-from-inspection--mobile.png`

| field | value |
| --- | --- |
| sha256 | `81cc3896b06bf572eb30ea122a3c37275b6c7103972d8634108a3968ecd97495` |
| bytes | 496487 |
| snapshot | `chips-from-inspection--mobile.snapshot.txt` |
| snapshot sha256 | `7456ad7ff76d5143698a6aaa349db36d0d087daec96ff12dc3700b068329f160` |
| snapshot bytes | 28748 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 5725 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over. The origin block names the question and never the answer body, because the answer body is held once below it: the lane's own first answer field carries the inspected answer, read-only, so the text a person is about to steer is the text that was measured. No second editable copy of it stands anywhere on the page, and the inspection's own count and marks are still in the document above it. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ea17bbda7e032aaa0631abde908a6bd8d488da72934b872f196853a2dcd8357c` |
| bytes | 773816 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `5ecbb8482cc2ff6b607abcb9d62e3610301577390beebba52f5435fd28cb11dd` |
| snapshot bytes | 52712 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5146 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1c289a299b34e8b89b2e54c5b6fd66af58a4081a5ed6203b8a2e601fafb5ab0d` |
| bytes | 920090 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `42b404c7459b6648563f0076361143dc5660ce0428f0240804d16808c89baac4` |
| snapshot bytes | 51811 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6992 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `29ac148904bfe12e333f06f58f96511a2e22ea86321b312eb8d1a0b016a1d3ae` |
| bytes | 744480 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `37ab6301d5a7e562f428f7fb5a26467e7cc0768d4a8e0418caa14428c5809ecc` |
| snapshot bytes | 52684 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5156 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7d29c040dc3ecb259ad75ab2b09893609755f1dd483f3c67b81347157113a7b9` |
| bytes | 861642 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `c4285e202378b6755276b59d3928126a9522c8e9171028955b1b670f64239f92` |
| snapshot bytes | 51797 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6992 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `bdb1a142d1ec92cf10b092e5f5dc35f36cad17ea8af8c843d9d3e1875da094ff` |
| bytes | 768007 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `d901f1e7233f982cec74275e4cb1fbf90a6733f8563f13cc51bd4fbec763c9a5` |
| snapshot bytes | 52679 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5146 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `699c9ccda0f327696162fb714d2d2c6fc1a40821c1a1298e755374644e547f90` |
| bytes | 853488 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `afa5c9087b8a589e9cb39f22afa4a60d2afc3a53cd60eeee6720583f0eb6120a` |
| snapshot bytes | 51792 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 7000 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `87944531866817baaace69519d4f8eb09f79fa79fab1e0583bd252413dbc6dfe` |
| bytes | 750628 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `5acc199061f5039a4f7a1b8a7deac1493df967a366f7136e9a17f2cc4c53b37a` |
| snapshot bytes | 52676 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5156 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0f6c186f3163574c8d4b79b8ea6104d2aec6193577e17d20c30b624aa692777e` |
| bytes | 901729 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `2326ba781205c60da62d7ec0a9e7647e50eb02b2240b853d3c72de90ed485691` |
| snapshot bytes | 51789 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 7010 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `curated-readout--desktop.png`

| field | value |
| --- | --- |
| sha256 | `af1c3b0a8c7e349629ca3d18a318b8a567732289bbb60316a0db2ba646604241` |
| bytes | 454357 |
| snapshot | `curated-readout--desktop.snapshot.txt` |
| snapshot sha256 | `ca92f010c340fe5234b9ed1516857428bbb6097918b1e1ded8c6e06bec7dfa8b` |
| snapshot bytes | 2264 |
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
| sha256 | `9226e84604b859311f1e78ccc55a00fd3c85f8a886b5d5880f7fcd7e3e4ea894` |
| bytes | 766440 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `1e3c548190065b06362d6392f928405fbb634214901bbdbacb5bee7342912409` |
| snapshot bytes | 51791 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1394 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `deposit-fixture--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b839532664b799271fd297230139374b2ecc3dd64a7b51a73e5093518b0d488c` |
| bytes | 617560 |
| snapshot | `deposit-fixture--mobile.snapshot.txt` |
| snapshot sha256 | `2adb5b0c8c1d746031f73761065ee47ad97f7a6f28b1228fbfe5ea1dd553edf7` |
| snapshot bytes | 50985 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1628 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e4f746a04175c4c7f23f4ff9302f0e210a1ba9ea9f25eba73784c351efc962ec` |
| bytes | 736619 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `6dff17e569b5767fe5fde10b1d7a2d77c776956168887cebd911f9447a62bee2` |
| snapshot bytes | 52454 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7090 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9053267acee4c3afbd296bc462960e32cfda1524398b9f86e24503e610a75a01` |
| bytes | 691828 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `54ca070716a56ebbbc20a0f71e7520e0db08b672b1193a1aea25878decdf838a` |
| snapshot bytes | 51891 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 10084 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ec761a02ff105e23712c90c5f3cebd7478273d140c1f682ce784290854e67bf0` |
| bytes | 613389 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `9f92c4efdf13b769821d12416356f2380eef65ff360bcebbf62aaf1e06282416` |
| snapshot bytes | 29344 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3750 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c201badbd7edaa45b0906677d566b3b5a8ce04f95fa4d70f4ad9a8f5846d5352` |
| bytes | 478861 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `5461b281f5d46f8b54107d134707bc1de0dd2dbbec6ac18074c0642836097765` |
| snapshot bytes | 28410 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4969 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `42f06270d05fcdc3c8ded1200f47449b52e6c6d5ff12822faf4035f6f927056e` |
| bytes | 419878 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `cc8f9801fdd2e0040a6ca3fadf8752002727d2d9e5d52fa5f439a0cb66de2b2e` |
| snapshot bytes | 2243 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 141 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `first-load--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4aa1d0e9ab74fee02776dc8b04163696c0271f0199e7b7e8d0dd109b5a6691b4` |
| bytes | 362441 |
| snapshot | `first-load--mobile.snapshot.txt` |
| snapshot sha256 | `ce2a34ea82cadd0c99c7be582ecbc52221b9309730166ce61845d2d3e22b6672` |
| snapshot bytes | 1848 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 196 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. The intro says what the Reader does and does not promise a verdict: paste an AI answer, the Reader inspects what it might be missing. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `home-archive-preview--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a36c87cda4141eaed53b34bf25b2faa64f514a3785e1f5a96a06bd12329e6468` |
| bytes | 735171 |
| snapshot | `home-archive-preview--desktop.snapshot.txt` |
| snapshot sha256 | `8d34ddc9596d3f6897901a83fdc3188a1345cba12dfdd1d2726b8281a25b4733` |
| snapshot bytes | 1260 |
| viewport | 1440x900@2x (desktop) |
| url | `/research.html`, query `(none)` |
| framed on | `.hp-arc-intro` at scroll offset 5257 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The archive preview, on the research page since the v4.4 refresh — what the record claims about itself, above the featured case |
| expected behaviour | The strip where the archive describes its own extent and the rubric that says how a case is read. This is the surface the numbers custody correction governs, on whichever page carries it: it is where a count would go if one were put back, and it currently states extent without one. A third frame is justified here and nowhere else on this page because this is the only region whose content is an assertion about the record rather than an explanation of the product. |

### `home-archive-preview--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3412954040aefbaa87d1945dc7c7cba5841869b9ec8847be80a0354f1e2e25e1` |
| bytes | 710565 |
| snapshot | `home-archive-preview--mobile.snapshot.txt` |
| snapshot sha256 | `489e595be4f5991b8b84a9d173df82395a78339fd88b80dfe7516d041106729d` |
| snapshot bytes | 1120 |
| viewport | 375x812@3x (mobile) |
| url | `/research.html`, query `(none)` |
| framed on | `.hp-arc-intro` at scroll offset 4381 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The archive preview, on the research page since the v4.4 refresh — what the record claims about itself, above the featured case |
| expected behaviour | The strip where the archive describes its own extent and the rubric that says how a case is read. This is the surface the numbers custody correction governs, on whichever page carries it: it is where a count would go if one were put back, and it currently states extent without one. A third frame is justified here and nowhere else on this page because this is the only region whose content is an assertion about the record rather than an explanation of the product. |

### `home-experience--desktop.png`

| field | value |
| --- | --- |
| sha256 | `bb8f468da5118f1dcd9066a6d6c5cb65d101d99142999167186d664b8d949be4` |
| bytes | 610915 |
| snapshot | `home-experience--desktop.snapshot.txt` |
| snapshot sha256 | `2ddd97fff27fa9de91a50b3bfe882572338ec3f2917386ebd9d7d2c13e4db515` |
| snapshot bytes | 2036 |
| viewport | 1440x900@2x (desktop) |
| url | `/research.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 706 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The experience region, on the research page since the v4.4 refresh — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This was the surface a homepage rebuild was most likely to replace, and the v4.4 refresh moved it to /research.html unchanged, so it is framed on its own rather than folded into a picture of the whole page. |

### `home-experience--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c192b5123b6220ec263e53e5fed692163a5be5b0aae354b71e3f4e2a42d15435` |
| bytes | 552613 |
| snapshot | `home-experience--mobile.snapshot.txt` |
| snapshot sha256 | `34576be947ba3bcc83cae327b12406a32c7f46b355a6e7502b23957fd0f774d4` |
| snapshot bytes | 1454 |
| viewport | 375x812@3x (mobile) |
| url | `/research.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 527 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The experience region, on the research page since the v4.4 refresh — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This was the surface a homepage rebuild was most likely to replace, and the v4.4 refresh moved it to /research.html unchanged, so it is framed on its own rather than folded into a picture of the whole page. |

### `home-tools--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d9feecde549b7a0fc852e2ec98c19aecf36b349fb7928254d411ddc566a2d7c8` |
| bytes | 563037 |
| snapshot | `home-tools--desktop.snapshot.txt` |
| snapshot sha256 | `252b380e8451e3911c64c55494c63778e6918cbb551ab9f408834f0783a6418f` |
| snapshot bytes | 1428 |
| viewport | 1440x900@2x (desktop) |
| url | `/index.html`, query `(none)` |
| framed on | `.tool-card--reader h3` at scroll offset 652 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's Tools section — the Reader card, with both of the Reader's uses described |
| expected behaviour | The section the v4.4 refresh put directly under the hero. Framed on the Reader card's headline, so the frame holds the tool name, the headline, the two paragraphs (check an answer; choose what the next answer should do differently), the Open the Reader action and the real inspection example beside them. The steering capture sits below this frame on desktop and is held by its own markup, not photographed here. |

### `home-tools--mobile.png`

| field | value |
| --- | --- |
| sha256 | `754fdf514c61a133436bf9223e9050068f2f9a970e7c2781cd2feccb15068c34` |
| bytes | 494197 |
| snapshot | `home-tools--mobile.snapshot.txt` |
| snapshot sha256 | `7de993902ef2c773052cbc171c8e2fd16081958a9c899a57cb8f76a660cf6f0b` |
| snapshot bytes | 946 |
| viewport | 375x812@3x (mobile) |
| url | `/index.html`, query `(none)` |
| framed on | `.tool-card--reader h3` at scroll offset 616 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's Tools section — the Reader card, with both of the Reader's uses described |
| expected behaviour | The section the v4.4 refresh put directly under the hero. Framed on the Reader card's headline, so the frame holds the tool name, the headline, the two paragraphs (check an answer; choose what the next answer should do differently), the Open the Reader action and the real inspection example beside them. The steering capture sits below this frame on desktop and is held by its own markup, not photographed here. |

### `input-integrity-intake--desktop.png`

| field | value |
| --- | --- |
| sha256 | `812d53ed11832ff26cd065a76dd9dfbdda6b0e3d228af5e8af456a53d0ad7b43` |
| bytes | 207268 |
| snapshot | `input-integrity-intake--desktop.snapshot.txt` |
| snapshot sha256 | `69958c3264420bb8f99e3debcbb8ed32ae167a27cd99749eab44f9fdd543a4e7` |
| snapshot bytes | 1521 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#intake` at scroll offset 355 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the intake state before any file has been chosen |
| expected behaviour | The page offers one way in — a file picker that takes PDFs — and beside it the sample the surface can inspect without a file, marked as a constructed demonstration rather than a document found in the wild. The boundary sits on the page before any result does: what the run establishes, and what it does not. No result region, no coverage line, no count. |

### `input-integrity-intake--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d0f7f2b22c77b0b710fa2ab24ef2c3827ab428ad75f0480b99c97645334dca33` |
| bytes | 178592 |
| snapshot | `input-integrity-intake--mobile.snapshot.txt` |
| snapshot sha256 | `38ab8399705acae1f2e7fabe41dae1bc33817fe252cc648829ba5508192a3c92` |
| snapshot bytes | 1094 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#intake` at scroll offset 584 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the intake state before any file has been chosen |
| expected behaviour | The page offers one way in — a file picker that takes PDFs — and beside it the sample the surface can inspect without a file, marked as a constructed demonstration rather than a document found in the wild. The boundary sits on the page before any result does: what the run establishes, and what it does not. No result region, no coverage line, no count. |

### `input-integrity-sample--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b0f32fe6c5b01c26ba067e5fbe24a60abf7644160d35eab7ee0c4540d76ec9d6` |
| bytes | 212875 |
| snapshot | `input-integrity-sample--desktop.snapshot.txt` |
| snapshot sha256 | `f814f7ac986c3052030fb8a10b65b70341f450beaee40e9830c38e40f79b1449` |
| snapshot bytes | 1974 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `.ii-contrast__canvas` at scroll offset 1500 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the constructed sample inspected — one finding, with the rendered page beside the structure it reports |
| expected behaviour | One item surfaced, under the heading for text the page's instructions do not paint. The finding states three things in the registry's order: what the content stream sets, what a system extracting text receives, and that the rendering instructions do not paint it. Beside it the page is drawn as the renderer draws it, with the marker framing the place the structure names — the two-reading contrast, which is the whole argument of the surface and the one thing only a picture can settle. The coverage line reads complete over one page. |

### `input-integrity-sample--mobile.png`

| field | value |
| --- | --- |
| sha256 | `be33efbb40ecdb0b75c14ce05b43a1c2a54f22d43e56ee223dba433f9d9ff328` |
| bytes | 228978 |
| snapshot | `input-integrity-sample--mobile.snapshot.txt` |
| snapshot sha256 | `b066d3d247a7ce61feb13772d7e6f397605859768c1975c198c53670c3b1683e` |
| snapshot bytes | 1311 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `.ii-contrast__canvas` at scroll offset 1954 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the constructed sample inspected — one finding, with the rendered page beside the structure it reports |
| expected behaviour | One item surfaced, under the heading for text the page's instructions do not paint. The finding states three things in the registry's order: what the content stream sets, what a system extracting text receives, and that the rendering instructions do not paint it. Beside it the page is drawn as the renderer draws it, with the marker framing the place the structure names — the two-reading contrast, which is the whole argument of the surface and the one thing only a picture can settle. The coverage line reads complete over one page. |

### `input-integrity-zero--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f3cb8fea41a96441c354540d578f0ebcf00004f08a08c00987832fda0410ca13` |
| bytes | 192872 |
| snapshot | `input-integrity-zero--desktop.snapshot.txt` |
| snapshot sha256 | `21e3f4e84df015620d9e0531996585899dbd8e3fa8c4c9ff898c954914278798` |
| snapshot bytes | 1904 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#result` at scroll offset 960 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, a file inspected with nothing to report — the zero-reportable state |
| expected behaviour | The run completed and surfaced nothing, and the page says so without implying the file is clean. The count reads zero, the statement names the checks that ran rather than the document, and the scope line states how many structural properties those checks describe and that other structure may exist which they do not. Coverage still reads complete over one page, because a run that found nothing and a run that could not read the file are different states and must not photograph the same. |

### `input-integrity-zero--mobile.png`

| field | value |
| --- | --- |
| sha256 | `12d4cd5e42680392e861a6624fce5ba01614b5204e5cbc7c8946482e6abc737a` |
| bytes | 229719 |
| snapshot | `input-integrity-zero--mobile.snapshot.txt` |
| snapshot sha256 | `329829beb5dcc8529f350e66f49995f1bcf7dc9a5e47a2f8f5e3ecbcbd5c5181` |
| snapshot bytes | 1342 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#result` at scroll offset 1295 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, a file inspected with nothing to report — the zero-reportable state |
| expected behaviour | The run completed and surfaced nothing, and the page says so without implying the file is clean. The count reads zero, the statement names the checks that ran rather than the document, and the scope line states how many structural properties those checks describe and that other structure may exist which they do not. Coverage still reads complete over one page, because a run that found nothing and a run that could not read the file are different states and must not photograph the same. |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `cbb842d16a2f9866919f11360e4b3524f327d41f233eb77e7030da6fe5d6e45c` |
| bytes | 748139 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `dc3738a1c575d3bc86907e6933871a2657360d73adef9559116ccde3cfb9f916` |
| snapshot bytes | 44688 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5892 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `36979615f7876edba2578624fcffdd81de3e11c47e2d81a8ae36c20c2517c859` |
| bytes | 680045 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `d2e1433c044fc9e866666b28287419a85c35adff43df1692a06eb4e1c4cf77f2` |
| snapshot bytes | 43944 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 8172 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6a41e109140588f457cb9bc35d05b759386715846fbf43051a69acb4229c2f3a` |
| bytes | 681098 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `7668558c63db0a4d3f856f29b522ad8d86c85703676fb9599765ff9a2a18ea94` |
| snapshot bytes | 41682 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 5001 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `5d529c00c8c8efabeb8c4dcf3fd8d7eb88eae8b51d26860da4fd035642e66b75` |
| bytes | 472719 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `6ef28f692ba027ba9113400344f87e376ee3ca182c0670751a008403ac34ca1d` |
| snapshot bytes | 40902 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6718 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ce6e49f1349c8d11945db4f4f71c0d88c70988c0114f20bc49269ab437c6f783` |
| bytes | 699536 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `3c9cbbd900a1423f67df77ae7a9cb9f7a0ff791e3772ac3456d67fc846b493fc` |
| snapshot bytes | 41551 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5598 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3b49ab50d8839b0c50ce2f8f4b31206e27efbc2f4415eb88e610a3d5bbc9601a` |
| bytes | 501661 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `fd05bc484fed1f04769a887c563330d252772f62b3e75f7e5d4a70139cb1a4fa` |
| snapshot bytes | 40833 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7671 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `429f16cc16fe55607d68ba1cb748456786f6fc33cbf11b54261e2a5d1ee349b0` |
| bytes | 624134 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `2b4cfc5a10897bde26929f1b3d8f513b837044bc19bfb8cdc08baa8110a6c59c` |
| snapshot bytes | 52457 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6090 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b1c272bc96a57ed033cd0c124cd6fdbc699f3a6c030c663e923a84098e3ccf7c` |
| bytes | 497511 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `9de967d79506efa46ec49e90914a5b14fa1ddd8b5fb09eabb8e0510137948dae` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8684 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6e141cdedd47dcb6256c3aa4ef7f6e3ac07c2057867cd3ff2debb8fef13cb8c8` |
| bytes | 673722 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `94e940680f6cc0c05b2f268ac2db88ffe85e2434255b87d7823822febec2c436` |
| snapshot bytes | 51902 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6003 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `288e184274d32ac777e1c2688a6aa1a0abd63191f72083ca5b48a52b7d075e76` |
| bytes | 536006 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `49273d92f0937408c2dc53e4b4e8e416d6de5104437d5286c692f9a52c2a16e1` |
| snapshot bytes | 51162 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8562 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `72e13c1fbc2e1c90ec7c06146bdba6d0dc1b6aa276b95c3752eaa951d80da2f3` |
| bytes | 618335 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `5f3fe58598cd15b4e4aa89c201dab76cda9bafd75175244de1afc28cb13905c1` |
| snapshot bytes | 52457 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6144 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0a8589ed79a62cf8f56b7897e4fed6fe8c7f6999f669a19da0606f627821a69a` |
| bytes | 465937 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `bc1ea137a36ffac626186de9b7637722049bd967c8ba2323f4dc573f21d80eca` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8804 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `10c4be799b821e903350bb36353064c3f0245822cb8f477b55059e1ab3bbf04c` |
| bytes | 753627 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `7aad0337ba84b26a7b8a4480b536eae8ce00ab79d7a9f76e12b7b7b67ecba74a` |
| snapshot bytes | 52621 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5457 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e611f5ce2e41afbdafc2702c15bbd43936bf3e62d0621d46974d259b1bef32f2` |
| bytes | 653489 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `fdda3a012557e9c48445d641799b7705f723cbfadfa26d83080344c6399133bc` |
| snapshot bytes | 51726 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7727 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `2a331ff693451762bbb70fcca79c5c24dcc598202fc662a25c314328ffbce636` |
| bytes | 712566 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `2a3492d5b88e849f9331eb5e5f206837b71bc86ec03a15d38a414b0a0e70e3a9` |
| snapshot bytes | 52573 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5478 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a68515d41f5bc436dd62ba51185d1ece0d69dcf9423b6038767aa5b63576b44c` |
| bytes | 695252 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `4a8295377301cce232e1c2211a09a280c2f94851c6fcab161fecfe36c6dbd770` |
| snapshot bytes | 51697 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7701 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c10a14d5a5d9a6103f790e812a1554615ee48edc046e3c38719cecf0c1f418fe` |
| bytes | 649909 |
| snapshot | `public-example--desktop.snapshot.txt` |
| snapshot sha256 | `a23a163e7a9bdd1ac1a55881ffec0a326f2806c131429341cb8fd1f18d30bfe9` |
| snapshot bytes | 2578 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1252 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1165fdb49b0c97aefb18d38a9e90653be731db4a7f58bc8a854bcb618e370b4c` |
| bytes | 512038 |
| snapshot | `public-example--mobile.snapshot.txt` |
| snapshot sha256 | `736ea387a8ac955df3ee5d31adeb6eda102b354084072ff5a55ec5522e6fef15` |
| snapshot bytes | 1476 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1848 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example-provenance--desktop.png`

| field | value |
| --- | --- |
| sha256 | `56276abf6ed1b3099d31a8e121728c195ed6a92853415ac668ce7ef6b2bff011` |
| bytes | 480455 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `8649b124170dbe706b65883bca7800b67f43777dce59a4f215d53c4f5245ecaf` |
| snapshot bytes | 2834 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 1744 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `public-example-provenance--mobile.png`

| field | value |
| --- | --- |
| sha256 | `bc6c8c15b6538ee944e5d984743f8694b7d7e354dc487fbb9f23edccc93e7d2b` |
| bytes | 437842 |
| snapshot | `public-example-provenance--mobile.snapshot.txt` |
| snapshot sha256 | `6bda3faf3658ef0d11182b4409f3f1607e739717873ed84b19f3379099559a23` |
| snapshot bytes | 1956 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 2682 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `read-capacity--desktop.png`

| field | value |
| --- | --- |
| sha256 | `899f1eac5d29f25af3ad755d4dfef6d1967eb312358769b4a375707e9c57dca4` |
| bytes | 426875 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `1c446cdd361f62c24af82a224a0a7b4b24a3c44d5e2ddc661db3d0c6d4297cd9` |
| snapshot bytes | 2559 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1097 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-capacity--mobile.png`

| field | value |
| --- | --- |
| sha256 | `47492ff9455914db6f34b2acede6e98a090d914d0b481f51ee3aa565cf1afea7` |
| bytes | 417908 |
| snapshot | `read-capacity--mobile.snapshot.txt` |
| snapshot sha256 | `80c364ac79d8698bf686246e4373f7d3bb9bbfe47b1d737acc9564292d374a63` |
| snapshot bytes | 2196 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1196 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-error--desktop.png`

| field | value |
| --- | --- |
| sha256 | `463040cf965e8b2a5065e7c3c816e96c2ca7d63e50611bf3de827a1056f982a4` |
| bytes | 400711 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `3dd2386e9b5c41535e5ece4228ece52ae9c12612843e410f8b0a21e6308abc36` |
| snapshot bytes | 2556 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1088 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `416ec47b5ab66ae7cda138db07a0d740ef99816eaec280d75836ed327a2bbe2b` |
| bytes | 381928 |
| snapshot | `read-error--mobile.snapshot.txt` |
| snapshot sha256 | `99bc95911cf5f433c2fe8b5c8d931dc7c1aebd9bd84f9623885b30f50086e0df` |
| snapshot bytes | 2140 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1166 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `409fd44d796766c2d00fefbcdf167708208266355e35790c14cc716beebc6bc4` |
| bytes | 294722 |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| snapshot sha256 | `d76e173e4260432b70bbb129d89fdc8fd696af0d4db881707ccccb6edf10ceb3` |
| snapshot bytes | 2425 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 762 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `read-in-flight--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1933c3491694809a83590fd6c86a8b4acb7de3d8200b8f2eb8b8e4fb908e4935` |
| bytes | 278895 |
| snapshot | `read-in-flight--mobile.snapshot.txt` |
| snapshot sha256 | `7538eda20ff45a2c8b3e6606ad74075f8dbfb298cfed9b58ee985161d6a8be1d` |
| snapshot bytes | 2017 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 827 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `register-overflow--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5f0f1734bb3f4df9e347ebf6680ea99e73040399a731f4aae8561f81b2afb424` |
| bytes | 766775 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `20719877849c93892f827b932832a891a915dad1f6b6a0815a8415a33397ec1a` |
| snapshot bytes | 73336 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5049 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a25f2e903aa8c3b32c2c5e91e25ffb59a4326811039cb9dff43bfd7af0f96454` |
| bytes | 735551 |
| snapshot | `register-overflow--mobile.snapshot.txt` |
| snapshot sha256 | `c84366020d0d28ee63b0780da56363e0408fc0dc855e785b5548876bbbb0bfcc` |
| snapshot bytes | 72511 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6782 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow-expanded--desktop.png`

| field | value |
| --- | --- |
| sha256 | `638254af60453161b93273fe70c7531dedd0a31f6078cffe00eba1987c8950f8` |
| bytes | 800995 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `ca8c08746d19411089b09c3a8d45b007772f1dff9b25b525d87727b43a2364a4` |
| snapshot bytes | 73369 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5561 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `209efa35566dca3f8ffa548125ddd034b67e9cd38ed386b8498bfc2a4eb62bc8` |
| bytes | 730002 |
| snapshot | `register-overflow-expanded--mobile.snapshot.txt` |
| snapshot sha256 | `ac1b0eed73fd7d606c2db16e83da92288e4ab5236c29616e2bbaa91b1863ac65` |
| snapshot bytes | 72461 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 7543 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1c4fad08f84b09eb464dea393f4fa733f2298a7e3230ef71e2173cc2fc4f33a7` |
| bytes | 440852 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `ffcbbb932aef91f540d706300666e5e21283ef1a1737098335881653e54916fd` |
| snapshot bytes | 30616 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1317 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `873337da513bd6dfc31bb53080a6eb7999db5d190aac20966e2e7b18e686fc3a` |
| bytes | 348895 |
| snapshot | `share-consent--mobile.snapshot.txt` |
| snapshot sha256 | `f1a958e23d211172cb8e546c949b1fa3bb87ce4c7f79a2d8edb81e5e646c0ead` |
| snapshot bytes | 29953 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1338 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f4b949bfa248e94241489e452e128a7724d201509226cdfeff8ef10159061f62` |
| bytes | 323830 |
| snapshot | `share-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `67e81d65637b5dcdd336ecd3f424d01480e1ff5e30714374ba00b12230fd35c0` |
| snapshot bytes | 6453 |
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
| sha256 | `93ac6780c80afb8808cb0ff775030d5c0d3dba0ae83089166b0d29c3d9b6def1` |
| bytes | 227165 |
| snapshot | `share-not-found--desktop.snapshot.txt` |
| snapshot sha256 | `8cbe04adda4505a4fd184296a25d58b501530923bfd901b4fe53077cea43287b` |
| snapshot bytes | 2287 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-not-found--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8160b6a00dad94af71127f2fbb52a07ae0622e422e819cc25912e3a2f8a6afb1` |
| bytes | 187321 |
| snapshot | `share-not-found--mobile.snapshot.txt` |
| snapshot sha256 | `3c24d9c1c6f1fd9d031cc366cef9f61d949ce23d669d328f4665b27acacbc5e6` |
| snapshot bytes | 1538 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-paired-no-model--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b225edb1cd9d231f9a92285385cc1a143cfa4c025fd134fde82e31cdf73a122d` |
| bytes | 322706 |
| snapshot | `share-paired-no-model--desktop.snapshot.txt` |
| snapshot sha256 | `9fa4d94c52eadd30578d4e2b45673b56d1d8d4b60d09e9eb7496455e37372799` |
| snapshot bytes | 6391 |
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
| sha256 | `6427afaa6fb0e1a6009cdfdef5e56e2f4b56569a91dc436c64420ba5b962866d` |
| bytes | 333991 |
| snapshot | `share-receipt--desktop.snapshot.txt` |
| snapshot sha256 | `04ae13f71f24132b9a9f88286514951a07f42401ca4a773e0e841511eaa46f66` |
| snapshot bytes | 6961 |
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
| sha256 | `43bce374fa715945de63d451b21956359f92ee69767e3b9c384008870773f31f` |
| bytes | 299744 |
| snapshot | `share-single--desktop.snapshot.txt` |
| snapshot sha256 | `bffd50963acfdf512796548931e3c58d9c3204d559291bca6b45197a50b5babe` |
| snapshot bytes | 6556 |
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
| sha256 | `a35d510c7b8a3eb5e5db0dd6ecabdecd510cd47868c540b93f235ea9700facd9` |
| bytes | 304156 |
| snapshot | `share-single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `2e33c54200e30926db84fb4d6e5190f1584ac8676825ae9e2759870cd4a21089` |
| snapshot bytes | 5840 |
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
| sha256 | `5b7732d17f42d8ae9b4a4a9062422b61305e6b9c06da48270288673bd91808ca` |
| bytes | 572579 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `0fe1b5570ce517d7fb03f6c901b197872a3df2d82cad582b9dd65051795dd3dd` |
| snapshot bytes | 12791 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1456 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `fca6bd20647615dc4e319b8c50f09d6a1e6d16e6b01cc5d2b85719d11628afff` |
| bytes | 481015 |
| snapshot | `single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `4f44ada84c6801cbe21286072d58a05641c8b9720710d81ac8bc3fbb4a823e11` |
| snapshot bytes | 12159 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1682 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `272ef4a2d83fa7cb8891031e8f024a72687f59851159c66bf5acc29096b270e7` |
| bytes | 475606 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `e87710cea01616752a7c07ac1fdd58097ca7ebf212add5eb6882a668a281e06f` |
| snapshot bytes | 12390 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2022 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f1e6e679559dca4a78dc0917e0fa62a116ac4870796c565c64b31f6df53de195` |
| bytes | 395702 |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| snapshot sha256 | `c03882c2012a7ddf3de64b40e1df135db6f56885761cd56796ac0d06d016688b` |
| snapshot bytes | 11787 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2357 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e4b4dbc5ac954f4bf483e12a86f150548e78af95d1451ef50da0832f49c79c69` |
| bytes | 631948 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `0ec92b69b0c8b956df52e4dbf781f3376b6e68c38102949e29f9dcb9042cfd31` |
| snapshot bytes | 30089 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1587 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3f85ed2786dd3b4b732e6dcfd8ed3a3d2790eb65601405cb5fc32af13266661c` |
| bytes | 501680 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `2b6ba034f3f4ac14f0675da6f8cc5f3678b6c7592a00bc5c0639bd9ac2c52e83` |
| snapshot bytes | 29395 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1938 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
