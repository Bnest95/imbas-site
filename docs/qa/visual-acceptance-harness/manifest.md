# Visual acceptance manifest

Generated, never hand-edited. `node scripts/qa/visual-acceptance.mjs --manifest` rewrites this file from the scenario registry and the bytes committed beside it, and `test/qa-manifest-freshness.test.mjs` regenerates it and fails the suite on one byte of difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping belongs in the harness that emits it.

Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no machine path. That is deliberate: a manifest carrying any of those goes stale on commits that never touched an image, and a document that rots on its own teaches its readers to stop trusting it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's `## environment` block records the conditions its own capture ran under, and `git log` on an image file records when those bytes last moved.

## Scope

**This manifest governs both committed baseline layers: the `.png` images and the `.snapshot.txt` files beside them.** Both are checksummed. There is one row per image, and it carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in `docs/qa/visual-acceptance-harness/` is governed here.

The inventory is complete by construction rather than by inspection. `scripts/qa/scenarios.mjs` registers 44 drivable scenarios and the board is kept at 2 viewports, `desktop` (1440x900 @ dsf 2) and `mobile` (375x812 @ dsf 3) — so 88 images and 88 snapshots are registered, and every one of them is listed below. Generation stops rather than emit a partial record: a registered baseline missing from disk fails, and a baseline on disk that the registry does not register fails too.

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

88 images, 88 snapshots, ordered by filename. Every checksum below is of the committed bytes as they stand in this tree.

### `advisory-boundaries--desktop.png`

| field | value |
| --- | --- |
| sha256 | `ee78dac8e72bd08e9c8e82de508886dc2b17b1164169f2561860d995e57c5715` |
| bytes | 362377 |
| snapshot | `advisory-boundaries--desktop.snapshot.txt` |
| snapshot sha256 | `a2463e6c88a15b2f3fa7ac8114ea12ca510a681de6508bca7099304837bd12cb` |
| snapshot bytes | 2189 |
| viewport | 1440x900@2x (desktop) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-practice` at scroll offset 2116 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the practice terms — the three commitments, including the wall between advisory work and published measurement |
| expected behaviour | Three statements, and the third is the one that matters most to the rest of the tree: advisory clients do not influence Imbas's public methods, measurements, or findings, and a business under advice is not published into measurement work without separate consent. The other two say what is not promised and what stays confidential. This boundary is the reason the commercial page can sit beside the measurement work at all, so it is photographed rather than left to prose. |

### `advisory-boundaries--mobile.png`

| field | value |
| --- | --- |
| sha256 | `42f31275324ca5b9aafff6c4bc0703526113cf8a23b803f95562922f7e576db0` |
| bytes | 327310 |
| snapshot | `advisory-boundaries--mobile.snapshot.txt` |
| snapshot sha256 | `ad229aa812cde57445c34faa0ca23f14d0fde253aedfa93c868a55cc2404fd62` |
| snapshot bytes | 1997 |
| viewport | 375x812@3x (mobile) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-practice` at scroll offset 3392 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the practice terms — the three commitments, including the wall between advisory work and published measurement |
| expected behaviour | Three statements, and the third is the one that matters most to the rest of the tree: advisory clients do not influence Imbas's public methods, measurements, or findings, and a business under advice is not published into measurement work without separate consent. The other two say what is not promised and what stays confidential. This boundary is the reason the commercial page can sit beside the measurement work at all, so it is photographed rather than left to prose. |

### `advisory-masthead--desktop.png`

| field | value |
| --- | --- |
| sha256 | `fbfa3c38301c1f1f8644d2c04c35847ad8355b0e221eec4a27b8553b933bcdfa` |
| bytes | 442958 |
| snapshot | `advisory-masthead--desktop.snapshot.txt` |
| snapshot sha256 | `2db10052fe08201a91bd86d1d430723f0bc32e13c45991c418ef3c53043a75f7` |
| snapshot bytes | 2116 |
| viewport | 1440x900@2x (desktop) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-masthead` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the masthead — the heading, the lede, and the thesis under it |
| expected behaviour | The proposition the page opens with, in three parts: the heading, the sentence naming what the advisory work is for, and the thesis that says why both halves belong on one page. A later Advisory restructure changes this first, so it is framed on its own. |

### `advisory-masthead--mobile.png`

| field | value |
| --- | --- |
| sha256 | `b16287e5ece9f71655b42c7845fbe8a8f3f4ce743be75994a0580ef32b5f0bff` |
| bytes | 318905 |
| snapshot | `advisory-masthead--mobile.snapshot.txt` |
| snapshot sha256 | `cacae89949e7ecbe3ce4658a73516d8751090fcb4ff1d757ef73ae47d663520e` |
| snapshot bytes | 1504 |
| viewport | 375x812@3x (mobile) |
| url | `/advisory.html`, query `(none)` |
| framed on | `.adv-masthead` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Advisory, the masthead — the heading, the lede, and the thesis under it |
| expected behaviour | The proposition the page opens with, in three parts: the heading, the sentence naming what the advisory work is for, and the thesis that says why both halves belong on one page. A later Advisory restructure changes this first, so it is framed on its own. |

### `chip-arrival--desktop.png`

| field | value |
| --- | --- |
| sha256 | `71ebac05e9604d189d6b3055f4287ef94959bdb603c059666eccbdebf1a27a1c` |
| bytes | 466947 |
| snapshot | `chip-arrival--desktop.snapshot.txt` |
| snapshot sha256 | `0b0151bcbc4c95f3a6ddc8a527de80892d0ccf26491b20388992a7d5d6a2bef5` |
| snapshot bytes | 1867 |
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

### `chip-delta-held--desktop.png`

| field | value |
| --- | --- |
| sha256 | `65c07ee75fad327fd64f31d8dcb80b3c9e2fbd2b3f01b055d12a5d3674e9d84a` |
| bytes | 533736 |
| snapshot | `chip-delta-held--desktop.snapshot.txt` |
| snapshot sha256 | `5708600ba0f1f68cd3570ad35a245857723dc2ea668cbf3d16faf5003ea60892` |
| snapshot bytes | 53127 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-chip__held` at scroll offset 4085 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane at the delta, after a follow-up was compared, with the first answer still held |
| expected behaviour | The comparison is rendered and the answer the person started with is still on the page above it, in a disclosure that is closed by default and read-only. The head's claim that the pasted text is still here is now something a reader can check rather than take on trust. The lane's boundary block is carried at this end of the loop exactly as it reads at every other: the locked Reader sentence, with the user-attribution line beneath it. The professional cue does NOT render here — it stands at the proactive entry door and nowhere else. |

### `chip-delta-held--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4fd28bb42987f573a616f864120dc1ca5b97003fd4fa8e7a5e6d0b5d6e4c6349` |
| bytes | 615066 |
| snapshot | `chip-delta-held--mobile.snapshot.txt` |
| snapshot sha256 | `f5856b6ae53b2ddf6afc1ffd473a38326c2d2c122a7d64da0af80d4d4e7ce992` |
| snapshot bytes | 52312 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-chip__held` at scroll offset 5830 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane at the delta, after a follow-up was compared, with the first answer still held |
| expected behaviour | The comparison is rendered and the answer the person started with is still on the page above it, in a disclosure that is closed by default and read-only. The head's claim that the pasted text is still here is now something a reader can check rather than take on trust. The lane's boundary block is carried at this end of the loop exactly as it reads at every other: the locked Reader sentence, with the user-attribution line beneath it. The professional cue does NOT render here — it stands at the proactive entry door and nowhere else. |

### `chips-from-inspection--desktop.png`

| field | value |
| --- | --- |
| sha256 | `30a5cfa9e5cc43fc47fe7fdc014c1728828b4f5c2d45f8a53981ced801532557` |
| bytes | 506820 |
| snapshot | `chips-from-inspection--desktop.snapshot.txt` |
| snapshot sha256 | `1d6a4776d0ce2326a4ee8b38badf3028d0e262923e466bb97bc777e6675df1bf` |
| snapshot bytes | 29483 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 4008 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over. The origin block names the question and never the answer body, because the answer body is held once below it: the lane's own first answer field carries the inspected answer, read-only, so the text a person is about to steer is the text that was measured. No second editable copy of it stands anywhere on the page, and the inspection's own count and marks are still in the document above it. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. |

### `chips-from-inspection--mobile.png`

| field | value |
| --- | --- |
| sha256 | `26969049fb319c40982c3384c64bbf9ac74fd09a1961eb99dd8519ec781b1a49` |
| bytes | 497411 |
| snapshot | `chips-from-inspection--mobile.snapshot.txt` |
| snapshot sha256 | `8590ef8c31e862f45b165311f330dc95657a857514ab59941ad66b5cf3617e6c` |
| snapshot bytes | 28748 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `#wb-chip-lane .wb-reader-result__head` at scroll offset 5703 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The chip lane opened from a findings-bearing inspection by pressing the door on the result |
| expected behaviour | The lane heads itself, offers the way back to the inspection by name, and states what it was opened over. The origin block names the question and never the answer body, because the answer body is held once below it: the lane's own first answer field carries the inspected answer, read-only, so the text a person is about to steer is the text that was measured. No second editable copy of it stands anywhere on the page, and the inspection's own count and marks are still in the document above it. The follow-up chips render under the sentence that says the person is choosing them and Imbas has determined nothing. |

### `claim-authorized-match--desktop.png`

| field | value |
| --- | --- |
| sha256 | `56e70e1b8d109cdbe1309cbeb9c9732adfa3c1bdaebbd6700a496a0bbb3b78d0` |
| bytes | 774306 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `47fccf93c53f7a10e9d6f7d34321789ca5a75699cdb3d74d31d1520de0d0d999` |
| snapshot bytes | 52711 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5146 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f7e04247013ee9ed617b2437df508f87b097114fe34affeebcc8f62df293cc74` |
| bytes | 919587 |
| snapshot | `claim-authorized-match--mobile.snapshot.txt` |
| snapshot sha256 | `333df8c2a9d28cc2a2f7eb119a64de148aa260c8662ea7b22a27aaa7079a1e5c` |
| snapshot bytes | 51811 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6970 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-mismatch--desktop.png`

| field | value |
| --- | --- |
| sha256 | `c66c4f9b0dc8112d7db537f388e6568b454c696857119a5e35a7efcefe7c6fc6` |
| bytes | 744994 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `2678752beffd47ff2cd51a752eb80bfc0df27b6b61d4806e6d5e3f7512174db0` |
| snapshot bytes | 52683 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5156 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `47ae9929cdd4357efadac3c28de04c0b2bbec8831837d6c15ec3439fd80d312d` |
| bytes | 861456 |
| snapshot | `claim-authorized-mismatch--mobile.snapshot.txt` |
| snapshot sha256 | `0e1ae377f31db7d183324ee3394b7b00a6166361414e897d572cc95418849e2a` |
| snapshot bytes | 51797 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6970 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-client-declaration--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8d4069aee9d47d4ee7a35b6371d4dcd6af47dec35ee1cdb141838134a28e97b8` |
| bytes | 768558 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `a76f54aafe01ca1bedd797ec1e74843f1131d1db7134cc0654a9aadd8f8b49aa` |
| snapshot bytes | 52678 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5146 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9007ff70868b791635a6506dea4661ed7292fd68624ddfaa32261595bf0332ad` |
| bytes | 853860 |
| snapshot | `claim-client-declaration--mobile.snapshot.txt` |
| snapshot sha256 | `22782299d9cc89b986a0536cfa2f086f5cb2e893d13b6a9c5a3cad02f04c61d7` |
| snapshot bytes | 51792 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6977 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-unrecognized-source--desktop.png`

| field | value |
| --- | --- |
| sha256 | `e0a774f8754e1f3232f07bab2842ff6af3f5ff0eb5db7b20c76065331d8f8c65` |
| bytes | 751095 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `f5738ad9dd0db6809478b28a584cfdb9cef43d1a42278e33e4be96c3329bb2b1` |
| snapshot bytes | 52675 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5156 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ce0f1de3dae913a6654e44bec057aa97ac214e8dda7edc4c876e63b12c32bf96` |
| bytes | 901858 |
| snapshot | `claim-unrecognized-source--mobile.snapshot.txt` |
| snapshot sha256 | `9572c77d38651a0a4b652f3f3dfeee9ef7074a8c4c84ba5ff8c8086d8bf0eed7` |
| snapshot bytes | 51789 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 6988 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `curated-readout--desktop.png`

| field | value |
| --- | --- |
| sha256 | `349c8b89b07f2ff8ff13dc0d267231cc51aaa02a841cba4806dfa1a0fd10ce0d` |
| bytes | 454989 |
| snapshot | `curated-readout--desktop.snapshot.txt` |
| snapshot sha256 | `3524771c86fcb7406c48626881e0603a8a299e3238562e8484732040e25f4435` |
| snapshot bytes | 2263 |
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
| sha256 | `3fd50ac4d3372f6f9ec9feb6dbaa022bbc436edcd81fca1a3871f174c2cdfa09` |
| bytes | 766882 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `1f81bf704e076ca056ef19e442aad027ab97a8bc35e9d78aa6119b158baf2a3a` |
| snapshot bytes | 51790 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__source mark.wb-source__mark` at scroll offset 1394 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the dense acceptance record — nine marks, six positioned in the answer and three recorded against it |
| expected behaviour | The answer renders with six marks positioned in it, numbered in the document's order rather than the record's, so they count 1 to 6 down the answer. This record lists its third and fourth marks in the reverse of the order they appear in and the body no longer inherits that, which is what the fixture is here to catch. Two of the six cover whole paragraphs. Below it the list carries nine rows in the record's own order, so the numerals beside them do not ascend; the last three state record-level absence with no quotation and no position, and hold the last three numbers because nothing places them in the answer. The count reads '9 candidate items surfaced'. |

### `deposit-fixture--mobile.png`

| field | value |
| --- | --- |
| sha256 | `693fb3dadfb77c1344ef422222ae88d6771ce778f511f741a108a3fc5d014cde` |
| bytes | 618227 |
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
| sha256 | `1384bca6fc3f28ea8433de203124dff7c43373cc542c7f92a22c06d77a3bb72a` |
| bytes | 737167 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `41f5f1d5c67fe048e99d99d75c3b4c3ef4b79e829f10b60cc9e40b776fb2f720` |
| snapshot bytes | 52453 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7090 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e628a72730faa0bd0ceb4be1c1a13e35e861e3745a6536658ffd40f2a148c0f5` |
| bytes | 691737 |
| snapshot | `export-paired--mobile.snapshot.txt` |
| snapshot sha256 | `a932543110ad8987081f5b1925c3b159b6127162e7bfdb9b7a051d718d645c7e` |
| snapshot bytes | 51891 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 10062 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-single--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a3dc28a88d1117c2788ea2e5af74fbc95ea8714cfa964ba77111518e5a4da239` |
| bytes | 613612 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `584e6f3ccf59132b0a56157be4355c1bbb69885c35074db4ba067375faa34137` |
| snapshot bytes | 29343 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3750 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c446cbb65169c17d883d3206a2c062f06c03473f4d8b1b1b8a36f4bb67b51fef` |
| bytes | 477942 |
| snapshot | `export-single--mobile.snapshot.txt` |
| snapshot sha256 | `698140440d3169c55d8880c4ba8735172a90c955e5dacb8dc0dd5b7c0a63d4d4` |
| snapshot bytes | 28410 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 4947 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `first-load--desktop.png`

| field | value |
| --- | --- |
| sha256 | `a73f92f6fee08d23237520b9aa118f6dbc19b767fa43b6c54dc5f26e26266b66` |
| bytes | 407521 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `ad7eb38b75ed3a89ab29402bfa39121be0c1e229057a4bd341e112686e33cbad` |
| snapshot bytes | 2189 |
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

### `home-archive-preview--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9d01a8e85fc323616295225268b7eb7444f45a35b63fb9254bc48076d7d19922` |
| bytes | 546723 |
| snapshot | `home-archive-preview--desktop.snapshot.txt` |
| snapshot sha256 | `f3756c3f4c7e42c99f9bda672345d1f23276b8e72db682a023812a79b222d3a0` |
| snapshot bytes | 1256 |
| viewport | 1440x900@2x (desktop) |
| url | `/index.html`, query `(none)` |
| framed on | `.hp-arc-intro` at scroll offset 6838 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's archive preview — what the record claims about itself, above the featured case |
| expected behaviour | The strip where the archive describes its own extent and the rubric that says how a case is read. This is the homepage surface the numbers custody correction governs: it is where a count would go if one were put back, and it currently states extent without one. A third frame is justified here and nowhere else on this page because this is the only region whose content is an assertion about the record rather than an explanation of the product. |

### `home-archive-preview--mobile.png`

| field | value |
| --- | --- |
| sha256 | `e7e2fd184214c010a0a8cb1b1eecf0c79c2efe3ea989b1eb57b62d4a3822a74d` |
| bytes | 787280 |
| snapshot | `home-archive-preview--mobile.snapshot.txt` |
| snapshot sha256 | `9db31351958548745a95e9bc7cea0438217a8706a195d3c08a0801e18a5b03dc` |
| snapshot bytes | 1117 |
| viewport | 375x812@3x (mobile) |
| url | `/index.html`, query `(none)` |
| framed on | `.hp-arc-intro` at scroll offset 5655 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's archive preview — what the record claims about itself, above the featured case |
| expected behaviour | The strip where the archive describes its own extent and the rubric that says how a case is read. This is the homepage surface the numbers custody correction governs: it is where a count would go if one were put back, and it currently states extent without one. A third frame is justified here and nowhere else on this page because this is the only region whose content is an assertion about the record rather than an explanation of the product. |

### `home-experience--desktop.png`

| field | value |
| --- | --- |
| sha256 | `3758421959ee530bbd962c292119336140dd3361fba1d88e2627adb8d65716d8` |
| bytes | 636670 |
| snapshot | `home-experience--desktop.snapshot.txt` |
| snapshot sha256 | `87810d3f1b83598647ad1483dc463543d6580d8e7dee50ddedcaebb28637d9fa` |
| snapshot bytes | 2033 |
| viewport | 1440x900@2x (desktop) |
| url | `/index.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 2286 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's experience region — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This is the surface a later homepage rebuild is most likely to replace outright, so it is framed on its own rather than folded into a picture of the whole page. |

### `home-experience--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c7916f0b2c08e8683abcd3de10dd071e1be285213ed3c8c1204bfae5c44dfa7d` |
| bytes | 535554 |
| snapshot | `home-experience--mobile.snapshot.txt` |
| snapshot sha256 | `2c58e9e4ffd6805c4a58e3f1d3e92bd1a6646c6be824b62565131d14b9e42aea` |
| snapshot bytes | 1428 |
| viewport | 375x812@3x (mobile) |
| url | `/index.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 1801 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's experience region — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This is the surface a later homepage rebuild is most likely to replace outright, so it is framed on its own rather than folded into a picture of the whole page. |

### `input-integrity-intake--desktop.png`

| field | value |
| --- | --- |
| sha256 | `9e3d95c8a5d814045417268a3ee66accfe44456ea4997927fe407c403086cbab` |
| bytes | 202736 |
| snapshot | `input-integrity-intake--desktop.snapshot.txt` |
| snapshot sha256 | `af084b5c99c26ec5e1495d532b3f66f84565aa394c4323516964fd6a4ed35f30` |
| snapshot bytes | 1515 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#intake` at scroll offset 258 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the intake state before any file has been chosen |
| expected behaviour | The page offers one way in — a file picker that takes PDFs — and beside it the sample the surface can inspect without a file, marked as a constructed demonstration rather than a document found in the wild. The boundary sits on the page before any result does: what the run establishes, and what it does not. No result region, no coverage line, no count. |

### `input-integrity-intake--mobile.png`

| field | value |
| --- | --- |
| sha256 | `f53ba3e675a1ac370e603abcd180a33fd5bbb6302e061c8eca910812220145d3` |
| bytes | 179676 |
| snapshot | `input-integrity-intake--mobile.snapshot.txt` |
| snapshot sha256 | `523906ffff56630328f11a003b8478d658d8c19e75396903fda554eeca5f621c` |
| snapshot bytes | 1094 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#intake` at scroll offset 438 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the intake state before any file has been chosen |
| expected behaviour | The page offers one way in — a file picker that takes PDFs — and beside it the sample the surface can inspect without a file, marked as a constructed demonstration rather than a document found in the wild. The boundary sits on the page before any result does: what the run establishes, and what it does not. No result region, no coverage line, no count. |

### `input-integrity-sample--desktop.png`

| field | value |
| --- | --- |
| sha256 | `38893bb49a6f5a8c89322b611e1e93890babd8ec97120b22fe1da8a00f2d023e` |
| bytes | 214557 |
| snapshot | `input-integrity-sample--desktop.snapshot.txt` |
| snapshot sha256 | `3a4e0e7c4349465a023fded90b1728098074cf5262b25854aaca10cf87b1ac8b` |
| snapshot bytes | 1973 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `.ii-contrast__canvas` at scroll offset 1403 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the constructed sample inspected — one finding, with the rendered page beside the structure it reports |
| expected behaviour | One item surfaced, under the heading for text the page's instructions do not paint. The finding states three things in the registry's order: what the content stream sets, what a system extracting text receives, and that the rendering instructions do not paint it. Beside it the page is drawn as the renderer draws it, with the marker framing the place the structure names — the two-reading contrast, which is the whole argument of the surface and the one thing only a picture can settle. The coverage line reads complete over one page. |

### `input-integrity-sample--mobile.png`

| field | value |
| --- | --- |
| sha256 | `15afd0544baccf3bd56c480433cdd20261a5f2edc9ea2d62bb81a7af7e9d5adc` |
| bytes | 228065 |
| snapshot | `input-integrity-sample--mobile.snapshot.txt` |
| snapshot sha256 | `92153bef6835c154778831091f59ef185c4b7eabe6e95f749407a6bf4db96a76` |
| snapshot bytes | 1311 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `.ii-contrast__canvas` at scroll offset 1808 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, the constructed sample inspected — one finding, with the rendered page beside the structure it reports |
| expected behaviour | One item surfaced, under the heading for text the page's instructions do not paint. The finding states three things in the registry's order: what the content stream sets, what a system extracting text receives, and that the rendering instructions do not paint it. Beside it the page is drawn as the renderer draws it, with the marker framing the place the structure names — the two-reading contrast, which is the whole argument of the surface and the one thing only a picture can settle. The coverage line reads complete over one page. |

### `input-integrity-zero--desktop.png`

| field | value |
| --- | --- |
| sha256 | `34ee068cb559d7db84230e7a8f1134cd5d60e78db53bc8cbb09edc9797212264` |
| bytes | 193862 |
| snapshot | `input-integrity-zero--desktop.snapshot.txt` |
| snapshot sha256 | `1904978a5de0b84cf187022bbc56945fa2cbe6d73fe8d9edf4f194e287212bf8` |
| snapshot bytes | 1903 |
| viewport | 1440x900@2x (desktop) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#result` at scroll offset 863 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, a file inspected with nothing to report — the zero-reportable state |
| expected behaviour | The run completed and surfaced nothing, and the page says so without implying the file is clean. The count reads zero, the statement names the checks that ran rather than the document, and the scope line states how many structural properties those checks describe and that other structure may exist which they do not. Coverage still reads complete over one page, because a run that found nothing and a run that could not read the file are different states and must not photograph the same. |

### `input-integrity-zero--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2ad9f85a785afc0005180bb5b7fd2a27f4907ad151aa15b39ad87a7af2751b6e` |
| bytes | 229810 |
| snapshot | `input-integrity-zero--mobile.snapshot.txt` |
| snapshot sha256 | `bcc717b746fc90357589c99ea95b4d52a3a9601922f913cf324af94dd6043297` |
| snapshot bytes | 1342 |
| viewport | 375x812@3x (mobile) |
| url | `/input-integrity.html`, query `(none)` |
| framed on | `#result` at scroll offset 1149 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Input Integrity, a file inspected with nothing to report — the zero-reportable state |
| expected behaviour | The run completed and surfaced nothing, and the page says so without implying the file is clean. The count reads zero, the statement names the checks that ran rather than the document, and the scope line states how many structural properties those checks describe and that other structure may exist which they do not. Coverage still reads complete over one page, because a run that found nothing and a run that could not read the file are different states and must not photograph the same. |

### `paired-empty--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d2910938fe44363ecdf30800bf97269ce57f0cd6678ddcac10ae265c83d7cb14` |
| bytes | 748590 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `c70ae5f2f53c6cdca12ee87c9ba9f47e705f9f1f73bab3406e39f2e8546dc86e` |
| snapshot bytes | 44687 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5892 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `3995f75e4a41f62c2e4cd1f48effbd7cc1e03ccd031ca7646ab240a857c46f4d` |
| bytes | 678057 |
| snapshot | `paired-empty--mobile.snapshot.txt` |
| snapshot sha256 | `b577fc0005cd26fb55c5eccd2369831cc754b1b247a75a624b5236888d2bf973` |
| snapshot bytes | 43944 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 8149 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-legacy--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7e57fcac5e3340a9f2291545d9b0e437ab12452013dc6f908bd96137395d110d` |
| bytes | 681519 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `62551b8a98b939bf15b6e759ed7b2cd72ddb95edd06242ec42029ceacc4921b9` |
| snapshot bytes | 41681 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 5001 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `900283f45597fb10ae2dcd1b90df3fc1a5145fd0e3a370d7655306808b9f9ccb` |
| bytes | 472957 |
| snapshot | `paired-legacy--mobile.snapshot.txt` |
| snapshot sha256 | `b70742182aeee3501ab5c40c7401c107097c120672baf2f06dd2a6fedaf490a1` |
| snapshot bytes | 40902 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 6696 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy-rows--desktop.png`

| field | value |
| --- | --- |
| sha256 | `4f2b8b720e15ca30ac8f9dacd1c1db0e545377b95d9df003387591c7c1abf0c6` |
| bytes | 699350 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `a905acd5475a1446331792fe39b5d246c1be9267caac68536cbf304f1a8afb3a` |
| snapshot bytes | 41550 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5598 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `06e363d490be1fb6fda1112eb40f1db0245599f69aefe765ab61a0fdea86693b` |
| bytes | 501484 |
| snapshot | `paired-legacy-rows--mobile.snapshot.txt` |
| snapshot sha256 | `58af21c0fed87681e0dc714d1c32a1458ca826e613c1d020c5e9182ef03a4f3d` |
| snapshot bytes | 40833 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 7649 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-matched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `20cbb9e5786d7e3201aa7259a7c6e8c4e1ec7fa205bd4a9de8dac0ddd6ee7be9` |
| bytes | 624409 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `937d03716158598b41430202ead9534573a9bb2ab5916cdc73585974fb2baf43` |
| snapshot bytes | 52456 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6090 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a29ff093b32037315d0d2ec0966c7df25d0dc99fcde4ba2e89c26e575c12740c` |
| bytes | 495645 |
| snapshot | `paired-matched--mobile.snapshot.txt` |
| snapshot sha256 | `e3670d65dac19c8b7df5a272b8e7d4b6c9c9e0ea1169e34f60fcd4462fa0aab3` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8661 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-rejected-snippet--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f27648ebbadef975150468e7aed9d8b92860bae722525322b7b6e71eccc0a0fd` |
| bytes | 673977 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `17220493f03f2e43c6a9c25ec3fafa4fe053519107e11891b19952054d57122f` |
| snapshot bytes | 51901 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6003 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `8c6f3991c22ff7f7e26a66586caf603458957877e66069bf666b2cd1fb449128` |
| bytes | 536881 |
| snapshot | `paired-rejected-snippet--mobile.snapshot.txt` |
| snapshot sha256 | `0e7d0688707dc5fded39b87240d034fab7de4dc4f90c49c749eefbd475e7e331` |
| snapshot bytes | 51162 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8540 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-unmatched--desktop.png`

| field | value |
| --- | --- |
| sha256 | `624ab273ef9fa8a2dc7c2e2a255a84f74fe715bed06b23e472143df42d10a2be` |
| bytes | 618606 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `4691298f4d438a8d2a6b4168c1856148dacaaacb7505af61de98f2e4b49fbe06` |
| snapshot bytes | 52456 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6144 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `76f35ce9c39ce62cf9a3896d9c120fbcb17978aa2599b8e731367571bf6fdfa2` |
| bytes | 466286 |
| snapshot | `paired-unmatched--mobile.snapshot.txt` |
| snapshot sha256 | `061bc66457dc1d91bd2cf7f4908312ba19c206a733eaba21495ca55a6feb86aa` |
| snapshot bytes | 51856 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 8782 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `provenance-complete--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d6a9a83ba23b65171ec661d256c71a41d63493eac1a8934d25307a370a534452` |
| bytes | 753301 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `a5d511753dd0f68c1b8c915d6c06a308af12bc7e0c4193b72e0fcc47f24ace16` |
| snapshot bytes | 52620 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5457 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `aee69f482e0d9275b2d41e4b36f0e7ca4173bf9e03ac654404f6b084baf3697f` |
| bytes | 653463 |
| snapshot | `provenance-complete--mobile.snapshot.txt` |
| snapshot sha256 | `d5e2d8708f859250ba03573018a6e0f9bdb6b3e217390b0bf30c6b8b9c16334e` |
| snapshot bytes | 51726 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7705 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-partial--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f5ec0c8448c7afe8179d3451264ed604881af29b287bdc26545b77db6ef07912` |
| bytes | 712204 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `065ee627715bbc4f200d69946c513d0f8622fa4b759321b1caa740723db0a744` |
| snapshot bytes | 52572 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5478 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7c6c1c72099a496dbaf2490b4eca2eef3a475a30903bd5693daf84d4dee16a0b` |
| bytes | 695708 |
| snapshot | `provenance-partial--mobile.snapshot.txt` |
| snapshot sha256 | `20b02bf23f56445efe18b812a11089c01363a2e5deca46563bf817c5a9f96aa7` |
| snapshot bytes | 51697 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 7678 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `public-example--desktop.png`

| field | value |
| --- | --- |
| sha256 | `f478cdc7234474f4926721c34d10c9c2fdf5636db8ddffac7cc1f836feb48791` |
| bytes | 649893 |
| snapshot | `public-example--desktop.snapshot.txt` |
| snapshot sha256 | `f981ff671f8ad2521090d0d16fb9d8e9b97741cdff8114eed03ec90b85e7c80c` |
| snapshot bytes | 2577 |
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
| sha256 | `9c26a2182973b0ab341c76f73f17ece004343b416f7dc8a275faf5f55fd2c3c3` |
| bytes | 480508 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `c7aebdf5e14ebb687bfe29602e388f8aa21e94281079501349a0f3ecb497532d` |
| snapshot bytes | 2833 |
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
| sha256 | `c4be9a68d875a2e0a41468dee6ccaca9368190801b81a11de1752be7da9977c5` |
| bytes | 427278 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `3e17a7edf5661cb7e695ce24d8124a849a9ad5e9d9e80d4db557b4e417eced85` |
| snapshot bytes | 2558 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1097 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route is at capacity — the fallback surface, capacity family |
| expected behaviour | The banner is the single capacity sentence, verbatim and identical to the server's: the Reader is at capacity today, a follow-up can still be generated and run in the person's own AI, and automated comparison may stay unavailable until capacity resets. It withholds the automated lane without withholding the instruction. The distinction from `read-error` is the whole reason both are on the board — one says the service failed, this one says the service is rationed and tells you what you can still do. |

### `read-capacity--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a8bcce8f1c91b29b7b72123d257ab6c39523a5c7c32ebfb62e0a6f95d7b4d2e2` |
| bytes | 420656 |
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
| sha256 | `e0106d73c6cc3cba97f74f507339051094cf124688fcf2cb22e357f40b598e32` |
| bytes | 401244 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `d0480aa69961c79da9ff55465fceb7700166d95c32a84c6f4ea30e9fbfc930c2` |
| snapshot bytes | 2555 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1088 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-error--mobile.png`

| field | value |
| --- | --- |
| sha256 | `251e75e364c79a88561be65e899e4f953c7b31517d66840a3afe7543e02838fd` |
| bytes | 384106 |
| snapshot | `read-error--mobile.snapshot.txt` |
| snapshot sha256 | `310eb8b2b2be3100b148248392b47d46630e19da865f40b4dee38f3b3f8b4916` |
| snapshot bytes | 2140 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result` at scroll offset 1144 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The read route refused the request — the fallback surface, generic family |
| expected behaviour | The result surface renders the fallback banner: the Reader is unavailable and a fallback check is what is showing. The read body says the full Reader is unavailable, that the question and answer are preserved, and that this is not a full inspection. No badge, no signal name, no count and no score: nothing inspected the answer, so nothing about the answer is claimed. The copyable card takes the same position — 'This inspection did not run.' rather than a flag lookup over completeness 'thin', which is what the client sets for styling and which used to reach the card as a signal name. |

### `read-in-flight--desktop.png`

| field | value |
| --- | --- |
| sha256 | `d6d262f20995fe37f352c41ff819e6d03831c89f88e03dafdf224550771baac8` |
| bytes | 295115 |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| snapshot sha256 | `b3b2eb08af82a813c8306e0a8175621063332f7af807418679c7b5ae0bba1559` |
| snapshot bytes | 2424 |
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
| sha256 | `f832e108f5bb2ee87d2f7b9d51771553a8c5ac2e70da7f223c806b521e5c39a8` |
| bytes | 767047 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `a2b2266c197333c2dc9c7ea9ffeeae42107b5759f5332e2464819a4e9a45bb98` |
| snapshot bytes | 73335 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5049 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `47ad7992e7ef3cea9fec28a1caaaf4e74ddf5319a2b0d34b7100a9fb61e90549` |
| bytes | 716899 |
| snapshot | `register-overflow--mobile.snapshot.txt` |
| snapshot sha256 | `02daef02f76067a6d1dcc2b7d1f83797e60ab9b76540d5aca8c7e91e0b26cdbd` |
| snapshot bytes | 72511 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 6760 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow-expanded--desktop.png`

| field | value |
| --- | --- |
| sha256 | `2b487321e93564a78fdef8301f8447a6b9cb57fa4671d0f979c3d9abaad49289` |
| bytes | 801383 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `a0f6fb7551973e7c71e646e1664d9710a8e5ed6c084c708d2fdd7a568a129fdf` |
| snapshot bytes | 73368 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5561 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `0c4f30f538b43c46d8fd727a1fe2d9cb67e6ec678ba979ca24e8af66c26fe6c4` |
| bytes | 728758 |
| snapshot | `register-overflow-expanded--mobile.snapshot.txt` |
| snapshot sha256 | `e6628c457d21df1201fc70a911041f238e2660c4477274d42334537a0275833a` |
| snapshot bytes | 72461 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 7521 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `share-consent--desktop.png`

| field | value |
| --- | --- |
| sha256 | `27d719d5e92827ec5e18a70690d3c818d5722e199e1cdb9ddaae94ad5d828c96` |
| bytes | 441492 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `bf000da3454c0fa3f202ba6be62d70b00bd20aaa9a1f1b98d28e6afb329c38e3` |
| snapshot bytes | 30615 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1317 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `4e3c5241e0df0921fbb2a9033aa0a3a196249f39abefec2b9645af089d45d1b7` |
| bytes | 348877 |
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
| sha256 | `0f497c13ae779fa9c884afc9947595aeeece8edf2fc67b0e68ce1338cb492046` |
| bytes | 324042 |
| snapshot | `share-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `5ebdb5548ad1e40742c33ce3030aa03fda8f0597c91ccc6d7a784f0a7eac9908` |
| snapshot bytes | 6452 |
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
| sha256 | `c517c61e8a44ff74eda24534a3dc3cff833b13957d3eb6c8a24c55cf1a94c7fb` |
| bytes | 421939 |
| snapshot | `share-not-found--desktop.snapshot.txt` |
| snapshot sha256 | `bfeef2dc2f54cdc5c0ff6737d4e450411af5754f22dbaed950b049494e2bfd14` |
| snapshot bytes | 2202 |
| viewport | 1440x900@2x (desktop) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-not-found--mobile.png`

| field | value |
| --- | --- |
| sha256 | `35d2e26454c69b84ada6d0541f913beda427980b1239b365ceaae31269d18352` |
| bytes | 185662 |
| snapshot | `share-not-found--mobile.snapshot.txt` |
| snapshot sha256 | `56b0b8c5020949e3ab37c6f77efd5bad643c898bf6707ccca4013b234331b81d` |
| snapshot bytes | 1501 |
| viewport | 375x812@3x (mobile) |
| url | `/inspection.html`, query `?share=Ab3xQ7zK9mNpR2sTuV4w` |
| framed on | `.insp-error` at scroll offset 0 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | A share link that resolves to nothing — the degraded share surface |
| expected behaviour | One plain heading, one sentence allowing both readings — wrong link, or removed share — and two ways onward. The page claims nothing about which of the two happened, because it does not know. |

### `share-paired-no-model--desktop.png`

| field | value |
| --- | --- |
| sha256 | `8ee2abb54c9148604abb7b66023059e4f4e88cf25dbcd6b49f3dfca67a09495b` |
| bytes | 322917 |
| snapshot | `share-paired-no-model--desktop.snapshot.txt` |
| snapshot sha256 | `e1fcfa9c4f371818386801e07ebc627a88f090f0d7205a8b72904d25f4a6c180` |
| snapshot bytes | 6390 |
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
| sha256 | `1673f76bdd704c370445ecb9c2e4f94af4783513ee60d9c3f3c2caef4f881d07` |
| bytes | 333861 |
| snapshot | `share-receipt--desktop.snapshot.txt` |
| snapshot sha256 | `0fbd1dde3e8cd56321da46392cce74ad4192eae906336a458ba0a910b4cd2c4c` |
| snapshot bytes | 6960 |
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
| sha256 | `0a7fdc29886cdd09945840bb8897dde57dcbaf7e1bd62172af3526d8911239f6` |
| bytes | 300013 |
| snapshot | `share-single--desktop.snapshot.txt` |
| snapshot sha256 | `83600350b3203218fb1bc89295d8f328db62384f7b3483a6379284fe9aeff9b6` |
| snapshot bytes | 6555 |
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
| sha256 | `bb2b6f9859d62e22110c2ccee4d6c596d8fb4a1aaa17f604025eeea0210999ff` |
| bytes | 304314 |
| snapshot | `share-single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `91a5e8215eb773702282b306ad64a55a2cdbbddc42a35654a3603e0408044efa` |
| snapshot bytes | 5839 |
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
| sha256 | `90fdded2d9cd398055b2fbcfa2d49f7811d224ccbc964a01f05196beb8289b3d` |
| bytes | 572627 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `f2d52f985b964a2b20e1f625fa7d65f4e4c1a8d0438885a32a07c1e43ea09d6e` |
| snapshot bytes | 12790 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__findings` at scroll offset 1456 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with no candidate finding — the findings list's empty state |
| expected behaviour | The finding list is replaced by one line naming the condition: 'No candidate finding surfaced under the tested conditions.' No score, no 'clean' verdict, no claim about the answer, and no zeroed tally standing in for the rows that are not there. |

### `single-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `48d5b318384f601c75ec167f6824458021a338cdbc0fd88feb4ca676ea3ee53d` |
| bytes | 480862 |
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
| sha256 | `78e08303e88dccf73b478f8a7ba12586eb42347e11b3352525f801df5ed2ca63` |
| bytes | 475775 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `b30db5b71a5360be1b8014e0eb4af3bebd61acd45d3826639b84621ed957cd65` |
| snapshot bytes | 12389 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-reader-result__section--left-out` at scroll offset 2022 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a read with nothing left out and no shaping — the read panel's two empty states |
| expected behaviour | 'What may be missing' and 'How it was shaped' each render one line naming the run rather than grading the answer: the Reader flagged nothing missing, and recorded no shaping, under the tested conditions. Neither line says the answer was complete or clean. |

### `single-empty-read--mobile.png`

| field | value |
| --- | --- |
| sha256 | `c741087e3879bd752126df9993d1fdb0af3afaab8d4dfe659b71cbe2ab33ce7b` |
| bytes | 395899 |
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
| sha256 | `b84dc0711fe6b7bee164aea55b8943d8dcfc4fc3a748e0f398090f69e1d4cc48` |
| bytes | 632187 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `86f21a39ab27c94ccd1abc606efc3c1316004aa6068179ed03849236286718b1` |
| snapshot bytes | 30088 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1587 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `bcc177217c37ad31f34b3a8caab23588056302f8df8f8c5360a220002c1a8a05` |
| bytes | 500113 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `c9fdb56ced6eae5a2901ab5ba93547377c2ae8da184f43f3fe50cb629cea8f80` |
| snapshot bytes | 29395 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1916 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
