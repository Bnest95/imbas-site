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
| sha256 | `5e072bbc27201bb68e11bf3ae1a22a60acc14efae7c82104113671b84da7f9c3` |
| bytes | 744129 |
| snapshot | `advisory-boundaries--desktop.snapshot.txt` |
| snapshot sha256 | `b0423a7bdb06517401f2a21ebf2f4894cf211e2d953d9b939ad19957f5428044` |
| snapshot bytes | 2473 |
| viewport | 1440x900@2x (desktop) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-terms` at scroll offset 3814 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the terms line in the close — the wall between advisory work and Imbas's public measurement |
| expected behaviour | The close of the page and the one line of terms under it. The v4.4 rewrite folded the three practice commitments this frame used to hold into that line, so the frame follows it. The line still carries the boundary the rest of the tree depends on: client material stays confidential, and advisory clients do not influence Imbas's public methods, measurements, or findings, with the independence policy one link away. This boundary is the reason the commercial page can sit beside the measurement work at all, so it is photographed rather than left to prose. |

### `advisory-boundaries--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ae1b7cf6888f4895b30b58da78d085d2635132fccac023a3d9f53ab2f4c4cb2e` |
| bytes | 591880 |
| snapshot | `advisory-boundaries--mobile.snapshot.txt` |
| snapshot sha256 | `7315b46d86c10c4c4cb6eda6c60d09dbe4f69886c0cf122f4f3ee89574ea0f88` |
| snapshot bytes | 1586 |
| viewport | 375x812@3x (mobile) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-terms` at scroll offset 6290 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the terms line in the close — the wall between advisory work and Imbas's public measurement |
| expected behaviour | The close of the page and the one line of terms under it. The v4.4 rewrite folded the three practice commitments this frame used to hold into that line, so the frame follows it. The line still carries the boundary the rest of the tree depends on: client material stays confidential, and advisory clients do not influence Imbas's public methods, measurements, or findings, with the independence policy one link away. This boundary is the reason the commercial page can sit beside the measurement work at all, so it is photographed rather than left to prose. |

### `advisory-masthead--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5a6e2d616862267485f67f6403f990a808bb7123e7dbd4edb3a270595312e946` |
| bytes | 1011530 |
| snapshot | `advisory-masthead--desktop.snapshot.txt` |
| snapshot sha256 | `302a7f89ed1c427f6921555d0d6af9c1d66ab1ff3a1ed3959afbb074f55bdbf8` |
| snapshot bytes | 1615 |
| viewport | 1440x900@2x (desktop) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-hero` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the hero — the heading, the lede, and the two ways to act under it |
| expected behaviour | The proposition the page opens with since the v4.4 rewrite: the heading, the lede that says how the work starts, and the two actions under it, Email me and the link down to what the work covers. A later Advisory restructure changes this first, so it is framed on its own. |

### `advisory-masthead--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c85cccbf4c956ffa26ded2364e1c7598a0ffc7fe51df497f7b4da2a8d25a40be` |
| bytes | 788306 |
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
| sha256 | `996f38810ae4dbdd04b58f8d0bebd7775de83430026c75d82a7ccefc006d41e3` |
| bytes | 467355 |
| snapshot | `chip-arrival--desktop.snapshot.txt` |
| snapshot sha256 | `6391efbd8a14b924a2020a41d5dd8a43c4769815098f02c423dca672b66b9cf0` |
| snapshot bytes | 1945 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 345 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chip-arrival--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b66704fa4e6d4b7590e092ef4f8b649838ec2c0da691920168125695b51b1d23` |
| bytes | 310014 |
| snapshot | `chip-arrival--mobile.snapshot.txt` |
| snapshot sha256 | `eb9d9257619e0e12fbcbd5520ea98f6978d0963f0eee6caea0c43f7d955afed4` |
| snapshot bytes | 1287 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `?start=chips` |
| framed on | `#wb-chip-lane` at scroll offset 632 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane entered through ?start=chips, with no inspection under it |
| expected behaviour | The lane heads itself with its own value statement, so it never reads as part of an inspection. The first answer box is the only live input on the page. The follow-up chips render in one row with the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chip-delta-held--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c368e75bb51abaa6fdce30949d85f4caa3eb555ec4809ec70735bf03b52e487d` |
| bytes | 533598 |
| snapshot | `chip-delta-held--desktop.snapshot.txt` |
| snapshot sha256 | `0effc2044950303fb3006938f7d7c2af6451768e6ae9a62b5d2d6e83b4c59a65` |
| snapshot bytes | 53131 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-chip__held` at scroll offset 4139 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane at the delta, after a follow-up was compared, with the first answer still held |
| expected behaviour | The comparison is rendered and the answer the person started with is still on the page above it, in a disclosure that is closed by default and read-only. The head's claim that the pasted text is still here is now something a reader can check rather than take on trust. The lane's boundary block is carried at this end of the loop exactly as it reads at every other: the locked Reader sentence, with the user-attribution line beneath it. The professional cue does NOT render here — it stands at the proactive entry door and nowhere else. |

### `chip-delta-held--mobile.png`

| field | value |
| --- | --- |
| sha256 | `63c89699875f1d0cb9ace231392183d0849bcccc98a9d8377f0678acb80b76dc` |
| bytes | 618280 |
| snapshot | `chip-delta-held--mobile.snapshot.txt` |
| snapshot sha256 | `62edc4ff1c94cc5df0a39ef323cc378e7dd78a038d4bf89f198941286bb0e9b9` |
| snapshot bytes | 52315 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-chip__held` at scroll offset 5955 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane at the delta, after a follow-up was compared, with the first answer still held |
| expected behaviour | The comparison is rendered and the answer the person started with is still on the page above it, in a disclosure that is closed by default and read-only. The head's claim that the pasted text is still here is now something a reader can check rather than take on trust. The lane's boundary block is carried at this end of the loop exactly as it reads at every other: the locked Reader sentence, with the user-attribution line beneath it. The professional cue does NOT render here — it stands at the proactive entry door and nowhere else. |

### `chips-from-inspection--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d07d68f96c0d8d28440a794345b771ebe853c6b455fb43aa14eee1b2a94504a5` |
| bytes | 506889 |
| snapshot | `chips-from-inspection--desktop.snapshot.txt` |
| snapshot sha256 | `d662b6a76ddedbb1885258155a08c97e61edde4cd2c11e012cdfb018a5a6ff5b` |
| snapshot bytes | 29487 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 4062 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over. The origin block names the question and never the answer body, because the answer body is held once below it: the lane's own first answer field carries the inspected answer, read-only, so the text a person is about to steer is the text that was measured. No second editable copy of it stands anywhere on the page, and the inspection's own count and marks are still in the document above it. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chips-from-inspection--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1759c660752e72ae9b09f7506390b3bd0befe84dee3a347737447d8e372a8a95` |
| bytes | 498043 |
| snapshot | `chips-from-inspection--mobile.snapshot.txt` |
| snapshot sha256 | `a45fb0cfdc576eb02e076b6e1cafe9c18628317f7e57f79d6396cd3cd0020913` |
| snapshot bytes | 28751 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 5828 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over. The origin block names the question and never the answer body, because the answer body is held once below it: the lane's own first answer field carries the inspected answer, read-only, so the text a person is about to steer is the text that was measured. No second editable copy of it stands anywhere on the page, and the inspection's own count and marks are still in the document above it. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1a6518d0095bf017f06baeed7745f002b8c63da22d9d52b8e78c53e8fcc9b710` |
| bytes | 753220 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `28c08558bc5e728985740b3e5290553bfc8ba5d6e84e0ac4c63401b90743552e` |
| snapshot bytes | 52712 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5064 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0767a4a900a1caed7781a44fccfe248e953b5eb7848dcbc8f350e3adcc0d277b` |
| bytes | 941496 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `e9d7ad9e845521ef603b241b6f673e77f710a32f4de3928110f5492ad4434e8c` |
| snapshot bytes | 51811 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6945 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7ac4c0a12d854cd36f5a3f730206554aba6b7ef7abe94904dee535437879b026` |
| bytes | 761682 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `2cf4c87ea901d046702b6e4b36b186dd791ee82008a083412b0b46a0bc4fbdeb` |
| snapshot bytes | 52684 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5074 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7d69833ef48fff06a4f9ad15361e91d538c89dcf8fa1504526fb67d0d3f36fa6` |
| bytes | 857146 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `24ed175ebf78f4913cf122a119dbefe4633a670f9775a22eb23753730c4bb4a4` |
| snapshot bytes | 51797 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6945 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `391b8a1a22e57a013ab67fccdc00317f0d9b89681cd4268483c0bf96dec9e4e7` |
| bytes | 747907 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `7bb7f9a25edcf2110cc8960ab0cc57b2c6df4eb7e623f2f857870c03d2b81f7c` |
| snapshot bytes | 52679 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5064 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4c0954ae737ef511ff9e4d8b55fe8ee562ada3988b4351f50d46f002c624afc1` |
| bytes | 868047 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `ee4cb7467f906f109aa30872503f7980f76ef11480e9b8c02a74348489cb4643` |
| snapshot bytes | 51792 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6952 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `b0918e8ac1a328d79d85db27817679f9336733fabf3673f7ccc07e30b5fd409a` |
| bytes | 768559 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `7fa13aa42676b71d15f156a8008023c3c5d016f1cccaaf232d475a6655673efe` |
| snapshot bytes | 52676 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5074 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8457192295605e2db3991361c8e3da087b059ed31e3771bbf9933f288f450e41` |
| bytes | 808422 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `2ab3e55a61545b7f71987436af794a0c898b3a50a614a9be400070de5a76465c` |
| snapshot bytes | 51789 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6963 |
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
| sha256 | `873387b1314e70fa9b66aa5fa888d829b79629b3338b1ff3d1e316b6ad6b4099` |
| bytes | 769332 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `e022b69805209536e9103bd96fcb189b4d4e2faa22ca2f229f5c3456fc841103` |
| snapshot bytes | 51791 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1311 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `deposit-fixture--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ffeef73a20109d51bc49b6620d47ddba192ba059da8d7c07f3d3f78eb1cd90ef` |
| bytes | 617904 |
| snapshot | `deposit-fixture--mobile.snapshot.txt` |
| snapshot sha256 | `f1e82d265b79c1195271bb438f58273680ef30d7949be8bbfdf1f4660e3add50` |
| snapshot bytes | 50985 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1581 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `export-paired--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f9ce6958381e4045351111a8105ea923c835d9bca67733848aec7e7a8a69716b` |
| bytes | 729483 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `523ff4527f172b26b74dafc91e136f2ec9bddbec837d565b5ab3b3a001f829ac` |
| snapshot bytes | 52363 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7018 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `92a9baf456521eb894d3f4c7b966bc83ff4c34d123e716596c451cd77c81478a` |
| bytes | 688510 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `83776a82738cbe284aabca67e701a34cd09f7c5b1115fb23ad0d8a0cc020d9a5` |
| snapshot bytes | 51891 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 10047 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e5d05217186dbf7ea6af1b9e296b61a53fc5e20d00ced54a92de6b570e415116` |
| bytes | 609647 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `bbd605e64e207f7ab12fef7a396a8b9cf207f2f5c5ebf0b29c5978f21c397f2e` |
| snapshot bytes | 29344 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3667 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a23583ebd9b24584b242296dc40716e0b565ddd0c5fb8a0bba09180e46d9af31` |
| bytes | 477620 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `e9cc9f4ec919e3382c0c526db78bc1c6d810612dc3a800cd7c997316f9d17f1e` |
| snapshot bytes | 28410 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4922 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `dc1d509aea2cb808e555590bced4fc79a00145419a4f0beafd2f50e362a147ee` |
| bytes | 415350 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `897f749e2a282e85ea465bd29cb3aa7970d765027afe9bf6f02343ce761945cf` |
| snapshot bytes | 2282 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 87 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. Three doors sit above it with Check an answer pressed, and beside it Steer the next answer and Real example, so both other ways in are one tap away and neither is the opening move. The field is labelled Your AI's answer. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

### `first-load--mobile.png`

| field | value |
| --- | --- |
| sha256 | `df21be31c181ac7da7f36a79a3fd13a38aca64e301043af403f8d73726413c73` |
| bytes | 390486 |
| snapshot | `first-load--mobile.snapshot.txt` |
| snapshot sha256 | `4105f2d1edee4144ae04d1ddddf938c4daa87b0e29cd4a8134d4f8548f0737bc` |
| snapshot bytes | 2014 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__fields` at scroll offset 116 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The workbench on arrival — the paste box, before anything is pasted |
| expected behaviour | The paste box leads. Three doors sit above it with Check an answer pressed, and beside it Steer the next answer and Real example, so both other ways in are one tap away and neither is the opening move. The field is labelled Your AI's answer. The status line reads 'Paste an answer to inspect it.' and the run button is present and disabled, so the sequence is legible before anyone commits to it. No result surface, no count, and no score of any kind. |

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
| sha256 | `91b76ce02bac00893fcef550322ab5eb17f7be394023928f1d7a441704945d30` |
| bytes | 634503 |
| snapshot | `home-experience--desktop.snapshot.txt` |
| snapshot sha256 | `7305a597dcff1753e24eeb7ce8ec86d9fdf7666da209fa21456d1015297af295` |
| snapshot bytes | 2036 |
| viewport | 1440x900@2x (desktop) |
| url | `/research.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 681 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The experience region, on the research page since the v4.4 refresh — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This was the surface a homepage rebuild was most likely to replace, and the v4.4 refresh moved it to /research.html unchanged, so it is framed on its own rather than folded into a picture of the whole page. |

### `home-experience--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1eafaa5c91f6ad2c15c6b8b6cc435193810f022b15febc4202d6f588d2b5309a` |
| bytes | 554260 |
| snapshot | `home-experience--mobile.snapshot.txt` |
| snapshot sha256 | `56e4fa4badcb3bc4bcaf42392ba4293a9a939aef871fed3fcb056f87dfb099b3` |
| snapshot bytes | 1454 |
| viewport | 375x812@3x (mobile) |
| url | `/research.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 522 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The experience region, on the research page since the v4.4 refresh — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This was the surface a homepage rebuild was most likely to replace, and the v4.4 refresh moved it to /research.html unchanged, so it is framed on its own rather than folded into a picture of the whole page. |

### `home-tools--desktop.png`

| field | value |
| --- | --- |
| sha256 | `02e1c95aa3cf8b1f3bf7c9c0c681f35b340058c49aa8b122923cbcb108bb44c2` |
| bytes | 396895 |
| snapshot | `home-tools--desktop.snapshot.txt` |
| snapshot sha256 | `c5bb2cc1bb78ce4368c2d0a877e4537cbe088e492a78a82a83b109695de6d82e` |
| snapshot bytes | 1282 |
| viewport | 1440x900@2x (desktop) |
| url | `/index.html`, query `(none)` |
| framed on | `.tool-card--reader h3` at scroll offset 1132 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's Tools section — the Reader card, with both of the Reader's uses described |
| expected behaviour | The section the v4.4 refresh put directly under the hero. Framed on the Reader card's headline, so the frame holds the tool name, the headline, the one paragraph that carries both uses (see what surfaced; pick what should change and compare), the Open the Reader action and the real inspection example beside them. The steering capture sits below this frame on desktop and is held by its own markup, not photographed here. |

### `home-tools--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9c5788bdf0ee6ead3535c081895fc6edf6699d57bf66780c639d5db94655dafc` |
| bytes | 393283 |
| snapshot | `home-tools--mobile.snapshot.txt` |
| snapshot sha256 | `b77c46c512790d6b9d6c33ee3720f1fb13f02d388180732aa8d9b636fca6c944` |
| snapshot bytes | 922 |
| viewport | 375x812@3x (mobile) |
| url | `/index.html`, query `(none)` |
| framed on | `.tool-card--reader h3` at scroll offset 1203 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's Tools section — the Reader card, with both of the Reader's uses described |
| expected behaviour | The section the v4.4 refresh put directly under the hero. Framed on the Reader card's headline, so the frame holds the tool name, the headline, the one paragraph that carries both uses (see what surfaced; pick what should change and compare), the Open the Reader action and the real inspection example beside them. The steering capture sits below this frame on desktop and is held by its own markup, not photographed here. |

### `input-integrity-intake--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c93be0347b074ef1f335895f710197149fe789962e274472cf26dbf899b3a7da` |
| bytes | 219238 |
| snapshot | `input-integrity-intake--desktop.snapshot.txt` |
| snapshot sha256 | `6ec072531a830255bb396533943e475943695bc3410d33681bc9d0f5c90d0286` |
| snapshot bytes | 1761 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#intake` at scroll offset 475 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the intake state before any file has been chosen |
| expected behaviour | The page offers one way in — a file picker that takes PDFs — and beside it the two samples the surface can inspect without a file, both marked as constructed demonstrations rather than documents found in the wild. The boundary sits on the page before any result does: what the run establishes, and what it does not. No result region, no coverage line, no count. |

### `input-integrity-intake--mobile.png`

| field | value |
| --- | --- |
| sha256 | `525623eeb6f66c50a1a66c5a343471edf5921f5250f6782ce4bfac5d8bd0f590` |
| bytes | 191643 |
| snapshot | `input-integrity-intake--mobile.snapshot.txt` |
| snapshot sha256 | `34b378feebaddfa16a90f9b80a7fee5b13300ca63d9f4b825c36fb006eaf7ba5` |
| snapshot bytes | 1173 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#intake` at scroll offset 803 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the intake state before any file has been chosen |
| expected behaviour | The page offers one way in — a file picker that takes PDFs — and beside it the two samples the surface can inspect without a file, both marked as constructed demonstrations rather than documents found in the wild. The boundary sits on the page before any result does: what the run establishes, and what it does not. No result region, no coverage line, no count. |

### `input-integrity-sample--desktop.png`

| field | value |
| --- | --- |
| sha256 | `93b6d762798442e079de154a23a66f9ed80f336b3f9dbc3f62d0bc5dec4cb8fb` |
| bytes | 194285 |
| snapshot | `input-integrity-sample--desktop.snapshot.txt` |
| snapshot sha256 | `d5ea33e3ac1049f13f360e1c2fe8a4c1b0a4eb3dc8d16905b6009ccbbc2034a0` |
| snapshot bytes | 1909 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `.ii-contrast__canvas` at scroll offset 1650 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the constructed sample inspected — one finding, with the rendered page beside the structure it reports |
| expected behaviour | One piece of page text surfaced, and the summary says how it was set. The finding leads with its plain label and the text it carries, then states three things in the registry's order: what the content stream sets, what a system extracting text receives, and that the rendering instructions do not paint it. Beside it the page is drawn as the renderer draws it, with the marker framing the place the structure names — the two-reading contrast, which is the whole argument of the surface and the one thing only a picture can settle. The coverage line reads complete over one page. |

### `input-integrity-sample--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ad2d85d46c152475ebee51bb7dbce0f234bbffbce9edc4d72dee66beb715e099` |
| bytes | 232866 |
| snapshot | `input-integrity-sample--mobile.snapshot.txt` |
| snapshot sha256 | `f062d989d7950cb05e5d51a76788fe1718c726a0178d10381b247b5e54720791` |
| snapshot bytes | 1275 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `.ii-contrast__canvas` at scroll offset 2227 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the constructed sample inspected — one finding, with the rendered page beside the structure it reports |
| expected behaviour | One piece of page text surfaced, and the summary says how it was set. The finding leads with its plain label and the text it carries, then states three things in the registry's order: what the content stream sets, what a system extracting text receives, and that the rendering instructions do not paint it. Beside it the page is drawn as the renderer draws it, with the marker framing the place the structure names — the two-reading contrast, which is the whole argument of the surface and the one thing only a picture can settle. The coverage line reads complete over one page. |

### `input-integrity-zero--desktop.png`

| field | value |
| --- | --- |
| sha256 | `04665f16d89fcdabdfa56bdfe05aae56528b23a791b264126484fd70a24ae387` |
| bytes | 188055 |
| snapshot | `input-integrity-zero--desktop.snapshot.txt` |
| snapshot sha256 | `d2c0dfa14f13f952c78daaa545415bfcaffdfeca448caa9e4156572abbaf8157` |
| snapshot bytes | 2008 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#result` at scroll offset 1058 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, a file inspected with nothing to report — the zero-reportable state |
| expected behaviour | The run completed and surfaced nothing, and the page says so without implying the file is clean. The statement says the checks surfaced no text on the pages, which names the checks rather than the document, and the scope line states how many structural properties those checks describe and that other structure may exist which they do not. Coverage still reads complete over one page, because a run that found nothing and a run that could not read the file are different states and must not photograph the same. |

### `input-integrity-zero--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8e85dc1cc5ac3ec09d694caea524d9e1a3aa2989b5fbcde85ca42025adadc609` |
| bytes | 226913 |
| snapshot | `input-integrity-zero--mobile.snapshot.txt` |
| snapshot sha256 | `eb7b7471b749ff45b47864b725a4a985a2d1f00bb77590fff5b5750f63480036` |
| snapshot bytes | 1418 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#result` at scroll offset 1518 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, a file inspected with nothing to report — the zero-reportable state |
| expected behaviour | The run completed and surfaced nothing, and the page says so without implying the file is clean. The statement says the checks surfaced no text on the pages, which names the checks rather than the document, and the scope line states how many structural properties those checks describe and that other structure may exist which they do not. Coverage still reads complete over one page, because a run that found nothing and a run that could not read the file are different states and must not photograph the same. |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3ae322e235870d9810f30b91013fc4e8e34414b250feb1cb1d787e1254050d35` |
| bytes | 747737 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `4789fefeefc53bf3bc26721ae6ae9a1cbb082e2e01c444404c57b5371a6a55d7` |
| snapshot bytes | 44688 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5810 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8991a957503d6d87ceea314cbdb3c4e99efcec87f4d3ad10f0dc4fc336b690c3` |
| bytes | 677176 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `0b9e6d00bca2c585d3a9eb52fed3edf6b9699203135d8831e242008f27b1f513` |
| snapshot bytes | 43944 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 8124 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `76e15e8fd97cf364fd8070b2cb2427b3fd7c965a1c35d99e444aa04eb4d3018b` |
| bytes | 680851 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `0893a5738b17438f869dfb425327897c8681a988e1ce0fe68cfedcdf3682b58c` |
| snapshot bytes | 41682 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 4919 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `d2b14156e29a3c890992ca9d8daf68b66eb212d02db7ffbd9cfa8900aa55d308` |
| bytes | 472190 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `275f96f4d3753f1f291ce27c5284f91e6bd4f10623f8fdf7bd7c036410f3f736` |
| snapshot bytes | 40902 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6671 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9a7fdc086305034d9dd22bff01e7a26e4fee97dfd5cd4779767ece82b792bbf7` |
| bytes | 699201 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `aa18dce0f07f24baf5ecbfff252aa19574aafa76ed9592cf7f4031b45b02dd91` |
| snapshot bytes | 41551 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5516 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b0d0630455a6a5c292c93563e5edecf34d47041f6fae3f05cef5f0dc61380327` |
| bytes | 501377 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `ae0919438765a294f125360d5bd347d2ccccd9fbbc3f69df97dd3976e75cab95` |
| snapshot bytes | 40833 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7624 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5b077684a0195c46fc15d2aeceb4b08e81a702250de571507abec32846f683a2` |
| bytes | 623813 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `b417229e27a77099a6d5da203cf21ef8716dbc02b4ab8404772433659ae29677` |
| snapshot bytes | 52457 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6007 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4a40227b64bffae5aab2fc10cafb8f434f0e28347ab36d2f8624974aafdefed9` |
| bytes | 466205 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `61e66b2b4e5fd4dd4c82f747ab77f08bfa8bea8c131651f0f8fc58fa680c2148` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8636 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8ee40c10dae7ff1591fc01a919fb0908f04811310ec8cc579e2a1734c66a3bb3` |
| bytes | 662257 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `a9308aaea1e8f8addcf3aa8bed882a434b3587b745cb886ffb6fe3d0fe829388` |
| snapshot bytes | 51902 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5921 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `83fccf09624e27cafcb83b5b0df602bbed31f1b06722b4efde2a882ec157d6a7` |
| bytes | 538151 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `975bd83acf9c072a8838d26b9d3e947899b5fc4dfe8cb5b798ee7130d467e31f` |
| snapshot bytes | 51162 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8515 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a9773fa59aa6e6004cbaaafea26d8167d3dec08311131bbac00a49b4f7bb878b` |
| bytes | 599783 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `b09988037eb526e04ce1f7760fa24344e35ab1782b5e13a8269cb24c73176a18` |
| snapshot bytes | 52457 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6061 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a8cac012e9182588072bb55bc7d104807155184e2f3cb0ce65cc2b803abd3124` |
| bytes | 494430 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `de1f1a3290508d9c766ab689e0c7cf4af07ec0e2d6f1e53b9460b2469a7a52c4` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8757 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e5fe41c747cca2f4c97dc084dece57588b7bddb386c2c71cbc0ec30575220e86` |
| bytes | 737949 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `3ee3b7ad96a9130bd2c1e15f2d8b1425d72f3f86289bec24d495c8ad6f426e4b` |
| snapshot bytes | 52621 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5375 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ae6601c9216356d29add9a2d91c28868ce0e8ad4ce9d72ada0e08252d87a5bd5` |
| bytes | 668045 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `6a3da22d3f0f31e4dbb7e5a7b4a790b048884eca603dea8312e1127dd52511f2` |
| snapshot bytes | 51726 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7680 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f6a41da34c785db34205a1626be9c65c171f466434cc236bee2ec61f9084b70a` |
| bytes | 733240 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `d46c1232ea8713c0ae3ee374826e757f9dc55da67574d86835b59fbeaad26bb3` |
| snapshot bytes | 52573 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5395 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b69d9515d6afaa24b87e0a4ad53ccbf8d133d62a0810ed6f153eaee087e8f029` |
| bytes | 683275 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `99850e845ad444636837e15b019da28e7207d5de46a02d4c482a7a37608608d6` |
| snapshot bytes | 51697 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7653 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9ee10dfb21a3a3a51119ed93e65f6b8b4f8264310b61b6a47658ba5a1b1999d0` |
| bytes | 643099 |
| snapshot | `public-example--desktop.snapshot.txt` |
| snapshot sha256 | `d2616032cbd86e99036878f28fc690f31a7fd115eecbf9ae82d2151c91bc7ee5` |
| snapshot bytes | 2577 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 688 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example--mobile.png`

| field | value |
| --- | --- |
| sha256 | `da0f448c9d67586315822f221fb14ffa1c6202739dff91cd59ddde4da44a4cb3` |
| bytes | 500424 |
| snapshot | `public-example--mobile.snapshot.txt` |
| snapshot sha256 | `e5fb6640c1df5bc8a504a6c506d9d750988c191867fff4a14985d0aecf71ff15` |
| snapshot bytes | 1476 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo` at scroll offset 1299 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door, opened from the paste box — the loop |
| expected behaviour | The Montana example runs the loop end to end. The open side reads 'Didn't come up.' because delta 1's open side is empty. The count line names four Omission items and says one is shown, so a single quoted line cannot read as the whole difference. No score and no construct name. |

### `public-example-provenance--desktop.png`

| field | value |
| --- | --- |
| sha256 | `282b12b8678893a6076bcca14b622d63311492f6815584bdd68c746d628c0fee` |
| bytes | 632962 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `80095b68114ec5db15fcc59505e67db615fde1bb84c445941b4a21b81307e467` |
| snapshot bytes | 2787 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 1181 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `public-example-provenance--mobile.png`

| field | value |
| --- | --- |
| sha256 | `61d11c8c6d9521a10326ecca2b2f2fdedc548674c2ab36b9e98f3310c8ef4788` |
| bytes | 504003 |
| snapshot | `public-example-provenance--mobile.snapshot.txt` |
| snapshot sha256 | `272617caf528b3a3903c2e93b7ee141c6e6cfde9d7096d0c5761565c006739e0` |
| snapshot bytes | 1956 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-demo__prov` at scroll offset 2133 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The public example door — the four provenance facts, kept apart |
| expected behaviour | Four labelled rows state four separate facts: what the person declared, what the page displayed plus the tier, what the hashes fix and what they do not, and the matched-conditions field that does not exist end to end. The statute line under them carries its retrieval date rather than a present tense. |

### `read-capacity--desktop.png`

| field | value |
| --- | --- |
| sha256 | `42797dc413bc494b67d9ab20cdd97a5db6f687d9f7421b22521528052e2e19eb` |
| bytes | 423113 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `313b2fbefaa95e66cc267c14c0b3171a3df91644f2933c93654808644ee2fb91` |
| snapshot bytes | 2599 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1015 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-capacity--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ec154f47bc49ec6c1c327860b17bb89c8d70bca204647c1b5caa388acad1fa97` |
| bytes | 427289 |
| snapshot | `read-capacity--mobile.snapshot.txt` |
| snapshot sha256 | `fadec43038c579bc07cf95a73541e0e9bf4ac68c0937c69727917be6af0ec349` |
| snapshot bytes | 2224 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1148 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-error--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e6664532541cd5c4c322f300bf34fbea8819039614f53bcb56613a859cccb97d` |
| bytes | 400161 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `a23f6abfcc9dc0f1fdfff458a7a47ba236445cf1d7c06eb09a24ebd5eb2ae3b5` |
| snapshot bytes | 2596 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1005 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e3f4fb409eee4a6f0db7ee37bf60039ab46a0b552cb05b5d688fd68b035b51c9` |
| bytes | 390513 |
| snapshot | `read-error--mobile.snapshot.txt` |
| snapshot sha256 | `9c16bfe6eb9e0150be38647aca320053bdc15ae870a67cb3186cbc362ea1e087` |
| snapshot bytes | 2141 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1119 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `20c8d02fec98ffb6ba9766a152e8001c0b71d976592d46879f6931adf8ed39f5` |
| bytes | 296564 |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| snapshot sha256 | `4285506c6da9e0d14d143917963213fd31283474be4c747fa333c08aa44c2875` |
| snapshot bytes | 2402 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 718 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `read-in-flight--mobile.png`

| field | value |
| --- | --- |
| sha256 | `207ce849ce3bd0f1e848061e22f2e03edbe7a0b3f5281cb2f61ea70cb7829bf1` |
| bytes | 278267 |
| snapshot | `read-in-flight--mobile.snapshot.txt` |
| snapshot sha256 | `17898d0a8e0bcae32a18e87526fb5b8c563dae78228f3d9da4f8f267c4dd783d` |
| snapshot bytes | 2097 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-v2__action-row` at scroll offset 818 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Mid-inspection — the request is open and the status line has reached its last words |
| expected behaviour | The run button reads 'Inspecting…' and is disabled. The status line has clamped on its terminal narration, which reports the instrument and the wait — still reading, long answers take longer — and claims nothing about what was found. The line it replaced said 'Found something to check…', which announced a finding before any response existed and is the line a slow request left on screen longest. No result panel and no count is rendered, because none has been returned. |

### `register-overflow--desktop.png`

| field | value |
| --- | --- |
| sha256 | `63366d2d9ba56a29fd4b1af178766545f42bdae3a3b1c5a3e3aad033aa17ffab` |
| bytes | 765253 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `57f3b832f347277a7ffc475558317dbd2f8c93acb94569bc2d8c40bb9a8e0a47` |
| snapshot bytes | 73336 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 4988 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2a3584de20bae650d91de111701e149fb861aa3aad57bb1d328dbc4a307a6f64` |
| bytes | 716755 |
| snapshot | `register-overflow--mobile.snapshot.txt` |
| snapshot sha256 | `efae611f6408c25c2732f336884c6abb3bf724752b8bf439b49a012afabdf137` |
| snapshot bytes | 72511 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6734 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow-expanded--desktop.png`

| field | value |
| --- | --- |
| sha256 | `6ea99726d026b9f5e95c94f187bd8e52f1a8d5b7b96da7afe5db78f5eb7ce2d1` |
| bytes | 802987 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `9a92281530078b93af9fc2d5003f3d7e2fbbcbb8906e556c9a5b01e81feebf25` |
| snapshot bytes | 73369 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5499 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `682a80005057b386e7d78cd08e46d00996c072ce4a10f59e00d72fb5eb2f6ce2` |
| bytes | 727990 |
| snapshot | `register-overflow-expanded--mobile.snapshot.txt` |
| snapshot sha256 | `5540cc3e25f1fc447f977a341b839616d81e67c60b662555ac7ee4e156c4303d` |
| snapshot bytes | 72461 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 7496 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `0a036f6077afdc12f62a9c931d4b4b0d3fc75e34e17e8a85dd8732ae073d984c` |
| bytes | 440903 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `7a253641fac55e02c02fa52f693e5a80cebfabe0c414c8f6d728ce86f699368b` |
| snapshot bytes | 31034 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1235 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `28f58afb6c72cf3daf2243178a37625ac0b31fd98ccc0979d96ef000771b0a7b` |
| bytes | 348897 |
| snapshot | `share-consent--mobile.snapshot.txt` |
| snapshot sha256 | `a73bb4ebf75c3830623581df024d90989cb7b9dec4f73fdc6a76fbf19da35710` |
| snapshot bytes | 29953 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1291 |
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
| sha256 | `580933b9fb24641419d3a147c4302dbb5c51f7c80affb03d8156a2d976ed59b4` |
| bytes | 226853 |
| snapshot | `share-not-found--desktop.snapshot.txt` |
| snapshot sha256 | `e5d4087443c319d10d60e8105968b55eaf0bace7ee30084bbf1f5a94f9d1b4dd` |
| snapshot bytes | 2279 |
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
| sha256 | `d36645e244ea2940cd560adfe53ed2c385782526d623ecea0c399623faf616ab` |
| bytes | 572111 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `3b0668cc30d8b0618f7fc4556e546236b2a44b4ee4d99b76369d02df4a211c23` |
| snapshot bytes | 12791 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1373 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `6312312dfc4eb64a03822c595694df975fee43a2d9232a1671182ac9603b7369` |
| bytes | 481414 |
| snapshot | `single-empty--mobile.snapshot.txt` |
| snapshot sha256 | `9c5e3660fabf5d42482049e1013ae316623d90a0730946cec9bc1ae7f3042a0a` |
| snapshot bytes | 12159 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1635 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty-read--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a3851c2e64ecfa726904ce630154611cc12459f21f56f697990be8f7f99dc1a8` |
| bytes | 474659 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `5b38d1936abfb71cc14ddf1be7f2f0afcb5633c8a05b44c83ada386f7da6fc69` |
| snapshot bytes | 12390 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 1940 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3dca6414d81c36b6114ac5bffba22865995b0284d71a9582aa47a363fd947dc8` |
| bytes | 395201 |
| snapshot | `single-empty-read--mobile.snapshot.txt` |
| snapshot sha256 | `eb859e2e0cafc42b5e2ca12b7a23d4c958e455e6842a6ef7dd09d555d973005f` |
| snapshot bytes | 11787 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2310 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-findings--desktop.png`

| field | value |
| --- | --- |
| sha256 | `59dbe7bdaca5bd0ab48ac9a639c66f6544fbe34f809836d08ffc120ec34d3223` |
| bytes | 629888 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `b8c723dd89c42d44d9d9d9e2f6a2cba7d817d14350572e2e29a5512f2892da7f` |
| snapshot bytes | 30089 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1505 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `462017a6aa12b2144253483c1b7b2e1033507a6608db7a07ceeb8e8febfb5b7d` |
| bytes | 501039 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `0244956b4143a13eaa1ea134a3fdbe9af973a2c5397db45c6614d7523f0886f3` |
| snapshot bytes | 29395 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1891 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
