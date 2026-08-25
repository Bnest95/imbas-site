# Visual acceptance manifest

Generated, never hand-edited. `node scripts/qa/visual-acceptance.mjs --manifest` rewrites this file from the scenario registry and the bytes committed beside it, and `test/qa-manifest-freshness.test.mjs` regenerates it and fails the suite on one byte of difference. Anything typed in here is deleted by the next regeneration, so a note worth keeping belongs in the harness that emits it.

Generation reads no browser, starts no server, captures no pixel and moves no baseline, and it records nothing measured at generation time — no timestamp, no HEAD, no working-tree state, no machine path. That is deliberate: a manifest carrying any of those goes stale on commits that never touched an image, and a document that rots on its own teaches its readers to stop trusting it. Capture-time provenance is not lost, it is filed where it stays true — each snapshot's `## environment` block records the conditions its own capture ran under, and `git log` on an image file records when those bytes last moved.

## Scope

**This manifest governs both committed baseline layers: the `.png` images and the `.snapshot.txt` files beside them.** Both are checksummed. There is one row per image, and it carries the sha256 and byte count of the image and of its paired snapshot. Nothing else in `docs/qa/visual-acceptance-harness/` is governed here.

The inventory is complete by construction rather than by inspection. `scripts/qa/scenarios.mjs` registers 43 drivable scenarios and the board is kept at 2 viewports, `desktop` (1440x900 @ dsf 2) and `mobile` (375x812 @ dsf 3) — so 86 images and 86 snapshots are registered, and every one of them is listed below. Generation stops rather than emit a partial record: a registered baseline missing from disk fails, and a baseline on disk that the registry does not register fails too.

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

86 images, 86 snapshots, ordered by filename. Every checksum below is of the committed bytes as they stand in this tree.

### `advisory-boundaries--desktop.png`

| field | value |
| --- | --- |
| sha256 | `5e4d08a9155e1bb477e5df3bebc54a1a75a7a2851f4100a7787db9077608bcd0` |
| bytes | 378959 |
| snapshot | `advisory-boundaries--desktop.snapshot.txt` |
| snapshot sha256 | `4f2b5d209f340c7d02a104ed63f6649b33f7f6363f6d430482a2a1d65d7f8776` |
| snapshot bytes | 2356 |
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
| sha256 | `d327e3cf324a7f605a78e7902a7c126c851c1ff4cdfbe1014a11c7cbc06853de` |
| bytes | 458826 |
| snapshot | `advisory-masthead--desktop.snapshot.txt` |
| snapshot sha256 | `84005ec32bb701cfa7d5d077a8b61cca44deba9de2ea0c54b42d2b3158a96e90` |
| snapshot bytes | 2283 |
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
| sha256 | `7e9b8cbcecde6106c0ed57cf1e8fd37426ec257711cbfe02c1806c4d38af5813` |
| bytes | 482581 |
| snapshot | `chip-arrival--desktop.snapshot.txt` |
| snapshot sha256 | `2a12ab4aa318f2574238137b19c298e39e4db0e6f8ad695727a58642925f191e` |
| snapshot bytes | 2034 |
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
| sha256 | `39d03e5d18e3628c07c115642699b4a4164e2a4de8c00059cd9fb661fe3b435d` |
| bytes | 524417 |
| snapshot | `chips-from-inspection--desktop.snapshot.txt` |
| snapshot sha256 | `3c7ea2c87ff0a28c15381bdbf823baa32773239e87b0512a8be4dacc422fa1de` |
| snapshot bytes | 29650 |
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
| sha256 | `ec64296d93b9cd589cfe25e79197a1a2f6959cee57fdaea260bfa79411ed1a8c` |
| bytes | 792720 |
| snapshot | `claim-authorized-match--desktop.snapshot.txt` |
| snapshot sha256 | `b3fbd6a8d5977646cfab56e3a137618417b7e3bde4bce32834758e490024ed54` |
| snapshot bytes | 52878 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5146 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose findings carry an authorized conditions record reading MATCHED |
| expected behaviour | The claim row reads 'Conditions matched' and says an authorized record of the capture conditions places the two answers at like for like. This is the only state in which the surface asserts a matched-condition basis, and it is unreachable from any live endpoint today. |

### `claim-authorized-match--mobile.png`

| field | value |
| --- | --- |
| sha256 | `9ca46cb0e3ff7fd763855873571472e3d45dae054c91f82cd73996496e558049` |
| bytes | 919850 |
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
| sha256 | `4879ed8a06d79397bdadd97efc11045aa29c1aa99c67c4836bba766eb5781fe4` |
| bytes | 761644 |
| snapshot | `claim-authorized-mismatch--desktop.snapshot.txt` |
| snapshot sha256 | `4f643b6b64d0db0b04e377b291fe26d3075a4bcad7296ed909ecee94a1434067` |
| snapshot bytes | 52850 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5156 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose authorized conditions record reads UNMATCHED, against a person who declared a match |
| expected behaviour | The claim row reads 'Conditions differ' and says an authorized record exists and does NOT place the two answers at like for like. The person declared same model and no edits, so no client-derived unmatched callout is drawn — the record and the declaration disagree, and only the claim row carries that. |

### `claim-authorized-mismatch--mobile.png`

| field | value |
| --- | --- |
| sha256 | `1d5ef7b83d96a874895a833299581fe6c533186074f6b5f98779b844624cc1e7` |
| bytes | 862238 |
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
| sha256 | `e83061be93bd25bddd2158b321cf7353c8433bd18bf411d722c4432aba477eee` |
| bytes | 786806 |
| snapshot | `claim-client-declaration--desktop.snapshot.txt` |
| snapshot sha256 | `d1d90123442b9376edbad8d4b09044bbb90b7ac739b7d4a152793ab68356e6ec` |
| snapshot bytes | 52845 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5146 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result whose conditions basis is the person's own declaration, carried through to the record |
| expected behaviour | The claim row reads 'Conditions as you reported them' and says the conditions are the ones you told us and not ones Imbas watched. The distinction from the state below is the one the register exists to hold: reported is not the same as unrecorded. |

### `claim-client-declaration--mobile.png`

| field | value |
| --- | --- |
| sha256 | `55b620507f4458c980b4c288fcd0ba4a05a5a8204f412b5ab6f5c4a2495de3ff` |
| bytes | 854175 |
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
| sha256 | `6b4076db79ae3fced886853f94f9311f60e0c486d9e9850bf5ef57f5e8050278` |
| bytes | 768121 |
| snapshot | `claim-unrecognized-source--desktop.snapshot.txt` |
| snapshot sha256 | `4f09ad566e2036d1a7c431a7e48fe71142b1812d7c7ad7a760ad1f5e35cdea45` |
| snapshot bytes | 52842 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-claim` at scroll offset 5156 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired result naming a conditions source this build does not recognize, with status MATCHED |
| expected behaviour | The claim row reads 'Conditions source not recognized' and says this build does not know the named source, so it treats it as nothing recorded. The stored status is MATCHED and the surface still refuses the matched-conditions claim, because the source is not in the authorized set. |

### `claim-unrecognized-source--mobile.png`

| field | value |
| --- | --- |
| sha256 | `ec0d6d11b85bf8771c160501e312000b1710db840aff57e5b498936d20622a94` |
| bytes | 902497 |
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
| sha256 | `16f706d9cd6864acf203bd6e27149c20feed8f316d77a7a3b6eb49692eb909c5` |
| bytes | 471843 |
| snapshot | `curated-readout--desktop.snapshot.txt` |
| snapshot sha256 | `a0acd05b86d510365f34175c9621838f8a708641d5bb120eb998749882f5c4e1` |
| snapshot bytes | 2430 |
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
| sha256 | `0fc9ce79d401a2f087971d6920973d387faaeecda99c42a860e02467b9ad73de` |
| bytes | 781474 |
| snapshot | `deposit-fixture--desktop.snapshot.txt` |
| snapshot sha256 | `6235d8133336c0cdc22ff7e76d16cfe62b6f985192ea7e7ae68240406ccdda03` |
| snapshot bytes | 51957 |
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
| sha256 | `ae3872cf5849e529014242e4186b9cc4a1ea100a0b6b17e001bd4789f93fc896` |
| bytes | 748302 |
| snapshot | `export-paired--desktop.snapshot.txt` |
| snapshot sha256 | `941e2134432616dcbeb4f924b59a818c0e84a96152f632219932deae91acee0d` |
| snapshot bytes | 52620 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--paired` at scroll offset 7090 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a paired run — the control and its support line |
| expected behaviour | Same control label. The line names both answers as pasted, the recorded findings, the capture conditions YOU REPORTED, and the run's provenance. It names no checks, because a paired inspection produces none, and it calls the conditions reported rather than matched. |

### `export-paired--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a80fd07704e8ae6cb731a6c770996cf8d0e93e76dedb33aec883e4873e3a971d` |
| bytes | 691605 |
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
| sha256 | `3d858bde9b2e10632d048608b1316e6feca456eeb2f9b38376337a4ce114b755` |
| bytes | 628403 |
| snapshot | `export-single--desktop.snapshot.txt` |
| snapshot sha256 | `8cdcf788282951c258af111a1ee335300d2129dcb4a31e0070b68a3b2c81e4ba` |
| snapshot bytes | 29510 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks__export--single` at scroll offset 3750 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The Review Record export on a single-answer run — the control and its support line |
| expected behaviour | The control reads 'Export Review Record'. The line beside it names the answer as pasted, the recorded findings, the checks with the marks set, and the run's provenance, then states that every finding in it is unreviewed. It does not mention a paired capture, and it makes no verification claim. |

### `export-single--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a85f7fedb527f678709a1aaff0e59c444f5c74facf66da6a984c739fa5793f6b` |
| bytes | 477368 |
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
| sha256 | `10c3e151bd359cfe3aa82708898b458e0e4990153594bd40e6605d44ab57bb73` |
| bytes | 424760 |
| snapshot | `first-load--desktop.snapshot.txt` |
| snapshot sha256 | `02dfb7f9354197d62bb686051095d4fdc7893e0bea0cdf5bf8100842f885271f` |
| snapshot bytes | 2356 |
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
| sha256 | `e10338e7e5fc2d08571c675cc7ee9d36a743a7723ad3d123a3c691e2a5dd430f` |
| bytes | 752038 |
| snapshot | `home-archive-preview--desktop.snapshot.txt` |
| snapshot sha256 | `8bd83f74ebe2c4bd241e6d7a11cd9a616ee45aca5409ca878209028ac2873824` |
| snapshot bytes | 1423 |
| viewport | 1440x900@2x (desktop) |
| url | `/index.html`, query `(none)` |
| framed on | `.hp-arc-intro` at scroll offset 7695 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's archive preview — what the record claims about itself, above the featured case |
| expected behaviour | The strip where the archive describes its own extent and the rubric that says how a case is read. This is the homepage surface the numbers custody correction governs: it is where a count would go if one were put back, and it currently states extent without one. A third frame is justified here and nowhere else on this page because this is the only region whose content is an assertion about the record rather than an explanation of the product. |

### `home-archive-preview--mobile.png`

| field | value |
| --- | --- |
| sha256 | `12059fa5c8c25460a2459853eebc7bf05b00af301284f49e17fa06cd8524e6ff` |
| bytes | 787746 |
| snapshot | `home-archive-preview--mobile.snapshot.txt` |
| snapshot sha256 | `f0acbbf1f3b5e614a8f2b6dc1f6ee98d22dffd223d4050189969c726cb9809b6` |
| snapshot bytes | 1117 |
| viewport | 375x812@3x (mobile) |
| url | `/index.html`, query `(none)` |
| framed on | `.hp-arc-intro` at scroll offset 6889 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's archive preview — what the record claims about itself, above the featured case |
| expected behaviour | The strip where the archive describes its own extent and the rubric that says how a case is read. This is the homepage surface the numbers custody correction governs: it is where a count would go if one were put back, and it currently states extent without one. A third frame is justified here and nowhere else on this page because this is the only region whose content is an assertion about the record rather than an explanation of the product. |

### `home-experience--desktop.png`

| field | value |
| --- | --- |
| sha256 | `1219cd3338641147129847188c67cb9e191d32584e9bacdc56e93ddd90ece972` |
| bytes | 642644 |
| snapshot | `home-experience--desktop.snapshot.txt` |
| snapshot sha256 | `8e70cdb80c721c9529e9b0fe2247d384089c13606ccff72b7ff62baf141bfdee` |
| snapshot bytes | 2139 |
| viewport | 1440x900@2x (desktop) |
| url | `/index.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 1917 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's experience region — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This is the surface a later homepage rebuild is most likely to replace outright, so it is framed on its own rather than folded into a picture of the whole page. |

### `home-experience--mobile.png`

| field | value |
| --- | --- |
| sha256 | `7c70f0446db1efff9b647327f82ae783731dbe35d0665a4d72b0799bf95fb3e6` |
| bytes | 544913 |
| snapshot | `home-experience--mobile.snapshot.txt` |
| snapshot sha256 | `e5e92b50b110328bcd132812b57bbc8c9b5253ce2d0604e702cdf3a05b2785ad` |
| snapshot bytes | 1392 |
| viewport | 375x812@3x (mobile) |
| url | `/index.html`, query `(none)` |
| framed on | `.your-experience__layout` at scroll offset 1568 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The homepage's experience region — the loop described in prose beside the two ways into it |
| expected behaviour | The region that tells a reader what using Imbas is: bring an answer, get a Second Question back, ask it, and put the two side by side. Beside the prose sits the entrance — Open the Reader, under the line offering a run now. THE TWO FRAMES DIFFER HERE AND THAT IS THE POINT OF HAVING BOTH: the desktop frame also carries the suggestion form, and the mobile frame carries none of it, because `.experience-intake__secondary` is display:none under 700px and the `.experience-intake__mobile-suggest` block its stylesheet hands off to exists in no markup on this site. So the assertions below name only what both frames must show, and the desktop-only half is held by the desktop image. This is the surface a later homepage rebuild is most likely to replace outright, so it is framed on its own rather than folded into a picture of the whole page. |

### `input-integrity-intake--desktop.png`

| field | value |
| --- | --- |
| sha256 | `7b3f4a35349d0be79a28bd6a69a80584c0506a65e828851ff0f4d6b4ac21e71d` |
| bytes | 217431 |
| snapshot | `input-integrity-intake--desktop.snapshot.txt` |
| snapshot sha256 | `8fb056a239d61a34eb2bfc15a678f4f06fa448d815ddc5fbed9ed79730415dad` |
| snapshot bytes | 1682 |
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
| sha256 | `ae52960b5f0dcab882ec407b0e34cfd12746312b6967ed812acb914a21e30004` |
| bytes | 231265 |
| snapshot | `input-integrity-sample--desktop.snapshot.txt` |
| snapshot sha256 | `266eb65db7428d74679267ce19176a196fc528e8672288d53ae9d8f3ad4e657c` |
| snapshot bytes | 2140 |
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
| sha256 | `1958b4a5303069ae522329318555b7b1e168355d364db309330118fa003103c6` |
| bytes | 211526 |
| snapshot | `input-integrity-zero--desktop.snapshot.txt` |
| snapshot sha256 | `9a9a130e34e89571917e42390d4d249212e64e388b594939dd91a6a16e707213` |
| snapshot bytes | 2070 |
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
| sha256 | `248fbc859d4311f48080aa647c4c0c660c883c9cf21df696ebde1c9f61d019a4` |
| bytes | 764514 |
| snapshot | `paired-empty--desktop.snapshot.txt` |
| snapshot sha256 | `ad2eef7340d0c9017f6dee834dca7b27d613591c3e344ccdd078956a7dc526e0` |
| snapshot bytes | 44854 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta` at scroll offset 5892 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 that surfaced nothing — the empty state, NO_CLAIM, and no value close |
| expected behaviour | The count reads '0 differences surfaced'. Under 'What the second answer added' one line renders: this probe surfaced nothing new, and that does not mean either answer is complete. The absence is reported about the probe, not about the two answers. No value close appears anywhere on the page. |

### `paired-empty--mobile.png`

| field | value |
| --- | --- |
| sha256 | `a9b8235352eb361be3d17f2622db6334ced928d038822cc5426f62a0ecc0ca9b` |
| bytes | 678374 |
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
| sha256 | `bd9c88237661e2f6b9509a80466daa1fb97533cc863dbbe56a01e30b4a5dc70f` |
| bytes | 697153 |
| snapshot | `paired-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `8dab50f7f5819af2ac658de4905d7d6484cb1efe9862d2439ff46d27f8e52dea` |
| snapshot bytes | 41848 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__notice--legacy` at scroll offset 5001 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the version notice and the suppressed panels |
| expected behaviour | A version-labelled notice names method 1.1 and says the excerpts are withheld. The headline follows it directly, with NO side-by-side answer panels between them — the surface that would normally carry the two quoted spans is simply absent. |

### `paired-legacy--mobile.png`

| field | value |
| --- | --- |
| sha256 | `cdf3ef2c62f2794b69fc0be8ea4e2080c3fd8c358fb77ff929871658b4cc14e5` |
| bytes | 471511 |
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
| sha256 | `995a334002e6bb403060e9a65442bdc69989191ebcc88e4bdf61a10552f6894f` |
| bytes | 719044 |
| snapshot | `paired-legacy-rows--desktop.snapshot.txt` |
| snapshot sha256 | `7e2d3ca4ace4d254bc219142daa80ce9a6e9974d84abed1d225195e1da9664d4` |
| snapshot bytes | 41717 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 5598 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired record at method 1.1 — the readings, rendered without excerpts |
| expected behaviour | Both readings render, each labelled as the Reader's reading. NO quotation marks and no blockquotes appear beside them, and neither the gap x-ray nor the signal-count line is drawn. The card and share actions are not offered. |

### `paired-legacy-rows--mobile.png`

| field | value |
| --- | --- |
| sha256 | `91bc9dfc248002ec0b7d391a866c3663daa80a1ee1e1c27a4899ada5157608f1` |
| bytes | 501353 |
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
| sha256 | `dd14f453000531a854e5b80780d33ea29a1b2918dfd196d1e3f866c9e03b40a5` |
| bytes | 640886 |
| snapshot | `paired-matched--desktop.snapshot.txt` |
| snapshot sha256 | `000f1a0edad72c879a68c88c2fb0be7e69e805ea3e9cb48a36a93b1bebc464c3` |
| snapshot bytes | 52623 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6090 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0, both sides server-resolved, conditions derived as MATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 1 quotes BOTH answers; both excerpts are spans the door resolved against the stored answers. Each row carries the Reader's reading in a labelled, unquoted register. The count above the section reads '2 differences surfaced' — a number a person checks by counting the rows, and the tally that used to break it down by class is gone. No unmatched-conditions warning: conditions_matched === true, derived client-side from same model + no edits. |

### `paired-matched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `aa58a13ca950588441c4f5d434d19e195947bba45742736a302bf6ed55b3e9f4` |
| bytes | 495590 |
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
| sha256 | `419b785a9c4f9d8522de689376b9650f24465e3f7ded086c3cf00a8b8f4d7c3f` |
| bytes | 691477 |
| snapshot | `paired-rejected-snippet--desktop.snapshot.txt` |
| snapshot sha256 | `67ac00225ab0fa88ff68d638428c59379d4b50ba50c94ac22cb7492ab4fbede2` |
| snapshot bytes | 52068 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6003 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 where one proposed snippet did not resolve — recorded, not surfaced |
| expected behaviour | The 'What the second answer added' section lists ONE row, from two proposed differences. The rejected one ('a tenant who waits too long forfeits the penalty entirely') appears NOWHERE on screen — not as a row, not as a quotation, not as a count. The count reads '1 difference surfaced' against paired-matched's '2 differences surfaced'. |

### `paired-rejected-snippet--mobile.png`

| field | value |
| --- | --- |
| sha256 | `edd6dfce38f486994e53de8fc2e75c8e428e348dc939a1d08d9b2ee21608838d` |
| bytes | 536479 |
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
| sha256 | `1200eecc09b3789685afec7ddbc971fbd74d2d17eca8817d6245d9f1abecf27e` |
| bytes | 634243 |
| snapshot | `paired-unmatched--desktop.snapshot.txt` |
| snapshot sha256 | `f78aabb52d159c632bf7d3e9d545fdd90b0b0f08131117b7afd953fec75a815e` |
| snapshot bytes | 52623 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-act2__delta .wb-measure__list` at scroll offset 6144 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Paired comparison at method 2.0 with an ABSENT open side, conditions derived as UNMATCHED |
| expected behaviour | The 'What the second answer added' section lists 2 rows. Row 2 shows ONLY the Second answer excerpt — its open side is ABSENT, so no First answer blockquote is rendered and no placeholder stands in for one. The unmatched-conditions warning is present: conditions_matched === false, derived client-side from a disclosed edit. |

### `paired-unmatched--mobile.png`

| field | value |
| --- | --- |
| sha256 | `20426e070686f98fd0759e8e469350f71b137640319f005266fe3d3df0a58802` |
| bytes | 466351 |
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
| sha256 | `dddfe14a20d2e0f0dbddf0860ffaad24985a8228fcb8469e8f583b2b855a4968` |
| bytes | 769736 |
| snapshot | `provenance-complete--desktop.snapshot.txt` |
| snapshot sha256 | `7abfa9974d5aa747007461710a1a318c87eb7861a1106c43af04f5e3ae6f526b` |
| snapshot bytes | 52787 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5457 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip with every field recorded — seven rows, none unknown |
| expected behaviour | Seven labelled rows, every one carrying a recorded value: declared answer model, inspection provider, inspection model, pinned inspection build, inspection method, paired method, and capture time. The strip reports data-complete=yes. The note under it still says the answer model is declared and not observed. |

### `provenance-complete--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2d8106ff09db5ae3fec07572c57eab0426b29eff3ff3268015a7de4f3632fe22` |
| bytes | 652432 |
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
| sha256 | `16bbcf8b836b1a8b308cc7f1e9966363484796046b455cdabcd0ce6fde59cfd2` |
| bytes | 729871 |
| snapshot | `provenance-partial--desktop.snapshot.txt` |
| snapshot sha256 | `665b223ff0aabc543226f953ec137d1228fbc7c08ee4100dcc932c1ba10c373d` |
| snapshot bytes | 52739 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-loop__reveal .wb-prov` at scroll offset 5478 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The provenance strip on a live-shaped run — two fields unrecorded, both stated |
| expected behaviour | Seven rows again, with 'none given' against the declared answer model and 'not pinned' against the inspection build. The strip reports data-complete=no. No row is hidden and no value is borrowed from a neighbouring field. |

### `provenance-partial--mobile.png`

| field | value |
| --- | --- |
| sha256 | `91f0cc84f5642e2693c0e112c4fbfff37f26b15baa4036cf3cc3e43540899280` |
| bytes | 694691 |
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
| sha256 | `d29e43a44e7eaecf4c0cd6a292dcb2bc16b6c18b89bfb4084336bb4916e5f797` |
| bytes | 666193 |
| snapshot | `public-example--desktop.snapshot.txt` |
| snapshot sha256 | `cca0fa5065ce2e00edb86a4fe9cff265608915b2785d20ecd20a4d5db8106920` |
| snapshot bytes | 2744 |
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
| sha256 | `7d9d444b61b2785bc1cacd6c414df1b2d427d2d6a9092502c237a9740a95c413` |
| bytes | 496811 |
| snapshot | `public-example-provenance--desktop.snapshot.txt` |
| snapshot sha256 | `80dd8b2658f2c405401738d4c3f74b65eeb3fbcf90f27f188ecb024169ae0db6` |
| snapshot bytes | 3000 |
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
| sha256 | `1a757deeffbc6099e4d516bc787fc8c38dfa72a6c0da5ea75f43504b94e346dd` |
| bytes | 427749 |
| snapshot | `read-capacity--desktop.snapshot.txt` |
| snapshot sha256 | `151ea21888545cfd5f959a8c642b086b0047d00a6e9126c24c81cfdb45afe144` |
| snapshot bytes | 2653 |
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
| sha256 | `0387b19f7706cb9f503055095bedfc2967bb26037d2d28290b256bfa53a23789` |
| bytes | 400477 |
| snapshot | `read-error--desktop.snapshot.txt` |
| snapshot sha256 | `aaa0b85604cc6699b9ae2992f7fe5cad7ba78ad140e334b614e6a7e4c3574e68` |
| snapshot bytes | 2544 |
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
| sha256 | `d1ec5e5afe192fa2ef6712aaa558cc29a87f4596289c1d2490cb84cd9b7a86c0` |
| bytes | 312133 |
| snapshot | `read-in-flight--desktop.snapshot.txt` |
| snapshot sha256 | `387305895b7033925494123db79b1fc77d71497220ae3fda712faf867d4bdb57` |
| snapshot bytes | 2591 |
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
| sha256 | `9a21a12cfd34b89fef60843fbd8ccc0d572b7e05598fbb655a8a37f6e4d1c0a6` |
| bytes | 784898 |
| snapshot | `register-overflow--desktop.snapshot.txt` |
| snapshot sha256 | `f44bd782b644934c6f5e12c8edaf7d45cadc7af6f050431587d067986f638598` |
| snapshot bytes | 73502 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5049 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, a Check Register carrying more cards than it shows — disclosure closed |
| expected behaviour | Three cards render under the eyebrow that qualifies them, and one control below them names the full count of five. The control reports itself closed. The other two cards exist in the register and are not on screen, which is the state the eyebrow describes. |

### `register-overflow--mobile.png`

| field | value |
| --- | --- |
| sha256 | `755d5770269ca64c2a78f38867293dcf4a2e13663f763deb21958320e26f1e45` |
| bytes | 716704 |
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
| sha256 | `b8d609317d8aa051ac33f0aa321e6787b7f09a72ef73db3aa28af39992acbe87` |
| bytes | 819620 |
| snapshot | `register-overflow-expanded--desktop.snapshot.txt` |
| snapshot sha256 | `88d7523e7ff7835fe8f8414a6c7471118d655cd5d68f701e2d8ab628e34f7973` |
| snapshot bytes | 73535 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-checks` at scroll offset 5561 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, the same Check Register with its disclosure open |
| expected behaviour | All five cards render. The eyebrow that qualified the first three is gone, because nothing is being qualified. The control reports itself open and offers the way back. |

### `register-overflow-expanded--mobile.png`

| field | value |
| --- | --- |
| sha256 | `2472dcaadecb66225c27d26e76983ba5f21a2d499b375e6c2aebebdae6d136d3` |
| bytes | 729312 |
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
| sha256 | `ade2b3cc2ab3250af3988ef87a7fad9a7940b778e5cedfdcb82f194a88ba0d47` |
| bytes | 458649 |
| snapshot | `share-consent--desktop.snapshot.txt` |
| snapshot sha256 | `8f861997f5836ad2425ff08bb9a023760b1d0a8f1eddb03895323efac7e40fd8` |
| snapshot bytes | 30782 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-share-consent__panel` at scroll offset 1317 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | The pre-publish consent dialog, single mode |
| expected behaviour | The dialog names what the page will show, item by item: the question, the capture date and the declared system, each candidate gap with its excerpt, and the boundary line. It states in its own sentence that the full answer is not published. Nothing has been created at this point — the create button is still unpressed, and both Cancel and the backdrop dismiss without publishing. |

### `share-consent--mobile.png`

| field | value |
| --- | --- |
| sha256 | `72e15d90b5f916627e7a80f5008a100135e0313ba8e252d8ea4282fa073c4bcf` |
| bytes | 348761 |
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
| sha256 | `819b47b1cb19c638570ce1097962b9c9d10cdf41b392ea2937f9cd4ba3e14f0c` |
| bytes | 339500 |
| snapshot | `share-legacy--desktop.snapshot.txt` |
| snapshot sha256 | `0de20e14824c741db18d31b3811566d0e75f2f4749f7160ea8e3abd7faab5388` |
| snapshot bytes | 6619 |
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
| sha256 | `4581922b6718d1ef1f3896513233d2eaac8c758fada92f24a7608799f6395353` |
| bytes | 440602 |
| snapshot | `share-not-found--desktop.snapshot.txt` |
| snapshot sha256 | `e6e9e1672dd1233494ae7d4b080d8ae6f9426c214930214d5348e189076a435b` |
| snapshot bytes | 2277 |
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
| sha256 | `55b4da617be3ddc7caae466f2ff7f02566dbea3d0d12cf92b6e09084783f30b8` |
| bytes | 338384 |
| snapshot | `share-paired-no-model--desktop.snapshot.txt` |
| snapshot sha256 | `265960e92cb476a0dc6530e0e297b28a4e59dc05470715d0300d17a3798761aa` |
| snapshot bytes | 6557 |
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
| sha256 | `f5eaf8f2d7203f00a0f1834d7ab21fbbf1d88150d11d20dc12941115f8618b5e` |
| bytes | 350958 |
| snapshot | `share-receipt--desktop.snapshot.txt` |
| snapshot sha256 | `364475b8df1c7b717691531024f09672f62749b27f488e522f9a92171f88a6d3` |
| snapshot bytes | 7127 |
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
| sha256 | `9e8e26c66dc050787a710b49cca05b172e80ee4d2f842f1d120a379dc55085fa` |
| bytes | 315684 |
| snapshot | `share-single--desktop.snapshot.txt` |
| snapshot sha256 | `e90564c1360255b5e547fe5c979d03de5427516867595d3b760c50ef4513a168` |
| snapshot bytes | 6722 |
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
| sha256 | `15997837230cb557bfd880272ff269dba8906733007399e75db0d8e4a32bfe38` |
| bytes | 320984 |
| snapshot | `share-single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `11cf3b9220a063d8fa9bddb63bde2937096bd7d2a70107c28139b85818744aa9` |
| snapshot bytes | 6006 |
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
| sha256 | `f34a7b5ee6c84403c1b921fe214f5e019210b05a36c79eeb80962a741be7f470` |
| bytes | 588696 |
| snapshot | `single-empty--desktop.snapshot.txt` |
| snapshot sha256 | `83095f09f4916cf9c6460da3c2b6f51f46aa587de50baf3c26d6693edae66009` |
| snapshot bytes | 12957 |
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
| sha256 | `8074c5c578f646103c0dccff3455fa1a085fba20973c06955289492c44f3932f` |
| bytes | 491018 |
| snapshot | `single-empty-read--desktop.snapshot.txt` |
| snapshot sha256 | `f3d68246cfbed39ca6d758505a3b022e45771b53359b212e876fa0199734dd82` |
| snapshot bytes | 12556 |
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
| sha256 | `33f7ea99210742f2aa81979e35a2238448b7737077a7a4ca31637eaaecafce71` |
| bytes | 650236 |
| snapshot | `single-findings--desktop.snapshot.txt` |
| snapshot sha256 | `2e378277b67286ed1213239a390916c44c9f04d074d238a3303ddef3edfe19b6` |
| snapshot bytes | 30255 |
| viewport | 1440x900@2x (desktop) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1587 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |

### `single-findings--mobile.png`

| field | value |
| --- | --- |
| sha256 | `12a5efc0b30642ecb3b0604746f2335375d333d3e957f2341a95576cb21b443a` |
| bytes | 499861 |
| snapshot | `single-findings--mobile.snapshot.txt` |
| snapshot sha256 | `c9fdb56ced6eae5a2901ab5ba93547377c2ae8da184f43f3fe50cb629cea8f80` |
| snapshot bytes | 29395 |
| viewport | 375x812@3x (mobile) |
| url | `/reader.html`, query `(none)` |
| framed on | `.wb-measure__list li.wb-measure__finding` at scroll offset 1916 |
| browser | `HeadlessChrome/148.0.7778.96` |
| state captured | Single mode, Reader result with measurement findings |
| expected behaviour | The findings list renders non-empty under the count: two rows, each with its own signal name and its verbatim anchor, no tally above them, and no panel title or sub-title standing between the count and the first row. |
