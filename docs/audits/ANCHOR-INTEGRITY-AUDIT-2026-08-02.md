# Anchor Integrity Audit — does a span resolve to the artifact it cites?

**Date:** 2026-08-02
**Base:** `master` @ `001ddc4d71d99afe96436ea08248a1498114ab95`
**Branch:** `sprint/anchor-integrity-audit` (report only)
**Scope:** Read-only. This pass changed no published record, no product code, and no test. The required adversarial test ran from `/tmp`, outside the repository, and is reproduced here rather than committed.

The Check Register is being elevated to a first-class work product — the deliverable a lawyer or compliance officer relies on. That claim rests on traceability: an anchor must provably resolve to the artifact it cites. This audit asks whether it does.

---

## 1. Verdict

**Both queued defects are real, and a third site exists that the queue does not record.** The third one is the most serious, because it sits on the exported, hashed work product rather than on an internal helper.

**The adversarial test fails at every layer that touches a span — 5 of 5.** A span assigned to Artifact A resolves against Artifact B at each one.

**No published record is wrong.** 32 committed records carry 680 span anchors. Every anchor resolves against the artifact it names. Zero collide, zero would be accepted against the wrong artifact in their own record.

So the classification is uniform and it matters for what happens next:

> **Every failure is the resolver under-validating. Not one stored anchor is malformed.**

That means a resolver patch fixes the whole finding, and no record repair is needed. It also means the clean record result is not evidence of safety — it is evidence that the pipeline has not yet been asked a question it would answer wrongly.

**Determination: this blocks the traceability claim, and therefore blocks calling the Check Register first-class.** Section 10 states the scope of that determination precisely.

---

## 2. Fetched-origin identity

| Field | Value |
|---|---|
| Origin remote | `https://github.com/Bnest95/imbas-site.git` |
| Base commit fetched | `001ddc4d71d99afe96436ea08248a1498114ab95` |
| Commit subject | `Merge pull request #63 from Bnest95/sprint/queue-reconciliation-post-c` |
| Commit author / date | `Bnest95` / `2026-08-02T12:28:15-04:00` |
| `HEAD` at audit time | `001ddc4d71d99afe96436ea08248a1498114ab95` |
| `origin/master` at audit time | `001ddc4d71d99afe96436ea08248a1498114ab95` |
| Working tree | clean (`git status --porcelain` → 0 lines) |
| Report branch | `sprint/anchor-integrity-audit`, cut from that commit |

`HEAD`, `origin/master`, and the base named in the brief are the same commit. Every line number in this report was re-derived against that tree.

Live data read for Section 6.3 came from Airtable base `appfxHraqlcpP1AAP`, tables `Reader Paired Analyses` (`tblP1ekWWWscz6pBG`) and `Reader Runs` (`tblqmHiOCQ5YSXBN3`), read-only. Nothing was written back.

---

## 3. The seven questions

| # | Question | Answer |
|---|---|---|
| 1 | Is `artifact_id` derived from the artifact containing the anchored text, or accepted from a caller parameter? | **Accepted from a caller parameter.** `reader-checks.js` takes the text and the id as two independent arguments. `reader-result.js` is stronger: it derives text by keyed lookup on the same role it stamps. |
| 2 | Does `spanResolves` verify `artifact_id`? | **No.** It never reads the field. It receives one artifact text and compares a slice. |
| 3 | Can identical text in multiple artifacts resolve against the wrong artifact? | **Yes, at every layer.** Demonstrated in Section 6. Identical text is not even required — see Q5. |
| 4 | Does any published anchor fail to resolve against its stated artifact? | **No.** 680 of 680 resolve. |
| 5 | Does any published anchor resolve only because artifact identity is ignored? | **No.** Zero of 680 also resolve against another artifact in their own record. |
| 6 | Are open-answer and targeted-answer spans unambiguously distinguished? | **No.** The role→text binding is established once, positionally, and no layer ever re-checks it. Section 7. |
| 7 | Smallest corrective patch and test set? | Section 8 and Section 9. |

On Q3, one clarification the code forces. Identical text is a sufficient condition for cross-artifact resolution, not a necessary one. `resolveSpan` searches with `indexOf`, so it resolves against whatever text it is handed and stamps whatever id it is handed. The two facts are independent. The quote does not have to appear in both artifacts for the wrong id to be recorded.

---

## 4. Affected code paths

### 4.1 `resolveSpan` — the id and the text arrive as separate arguments

`reader-checks.js:142`

```js
export function resolveSpan(artifactText, quote, artifactId) {
  const text = asString(artifactText);
  const raw = asString(quote);
  if (!text || !raw) return null;
  ...
  for (const cand of candidates) {
    const start = text.indexOf(cand);
    if (start !== -1) {
      const end = start + cand.length;
      return { artifact_id: artifactId, start, end, quote: text.slice(start, end) };
    }
  }
  return null;
}
```

`artifactText` and `artifactId` are unrelated parameters. Line 157 stamps the caller's id onto a span located in the caller's text, and the function has no way to tell whether the two describe the same document. `resolveSpans` (`:165`) forwards both.

`assembleComparativeCheck` (`:186`) inherits the shape and resolves both ends of a check against a single text:

```js
  const propSpans = resolveSpans(artifactText, propQuotes, artifactId);   // :199
  const depSpans = resolveSpans(artifactText, depQuotes, artifactId);     // :200
```

`buildCheckRegister` (`:339`) takes the same `{ artifactId, artifactText }` pair and passes it down.

### 4.2 `spanResolves` — the door, and it does not look at the id

`reader-checks.js:384`

```js
function spanResolves(span, artifactText) {
  if (!span || typeof span.start !== "number" || typeof span.end !== "number") return false;
  if (span.end <= span.start) return false;
  return asString(artifactText).slice(span.start, span.end) === span.quote;
}
```

`span.artifact_id` is present on the object and unread. The function is module-private; its public door is `validateCheck` (`:427`), which calls it for proposition spans and dependent-output spans against one `artifactText` argument and never compares `s.artifact_id` to anything.

### 4.3 `quotedAnchor` — no artifact text is a parameter

`reader-result.js:313`

```js
export function quotedAnchor({ role, quote, span }) {
  ...
  return deepFreeze({
    role,
    status: ANCHOR_STATUS.QUOTED,
    quote: q,
    span: { artifact_id: role, start: span.start, end: span.end },   // :324
    absent_reason: null,
  });
}
```

Line 324 copies `role` onto the span as `artifact_id`. The function receives no artifact text, so it cannot check that the quote reproduces from the artifact it is about to name. It is a stamping function by construction.

### 4.4 `buildFinding` — materially stronger, and still not sufficient

`reader-result.js:797`. This is the newer contract and it does not have the two-independent-parameters defect:

```js
  for (const role of ARTIFACT_ROLES) {
    const proposed = snippets[role];
    const anchor = buildAnchor({
      role,
      supplied: quotations[role],
      ...
      artifactText: artifacts[role],        // :832
      requirement: shape.anchors[role],
```

One key, `role`, selects both the text and the id. Within `buildFinding`, the two cannot desynchronize. That is a real structural difference from `reader-checks.js` and the report records it rather than flattening the two layers into one severity.

The binding is only as strong as the `artifacts` map handed in, and nothing validates that map. `buildCanonicalResult` (`reader-result.js:1108`) never receives artifact text at all; it checks shape and surface only.

### 4.5 `validateReviewRecord` — the third site, and the one that matters most

`reader-review-record.js:383`. This validates the exported, hashed Review Record — the artifact a reviewer actually receives.

The module states the invariant in its own header comment at `reader-review-record.js:15`:

> `other string value verbatim (span offsets into Artifact.body depend on the`

The module knows that span offsets index into `Artifact.body`. It never checks one. The string `span` appears exactly once in the entire file, in that comment. `evidence_spans` appears zero times.

The record carries everything needed to perform the check. `validateReviewRecord` validates that artifacts have `id`/`role`/`body`/`verified` (`:410`–`:415`), builds an id set and resolves pair-run references against it (`:426`–`:435`), and resolves each check to its detector event (`:480`). It stops there. It never opens `evidence_spans`, never looks up `span.artifact_id` in `c.artifacts`, and never re-derives a quote from a body it is holding.

### 4.6 The schema says the thing the code does not do

`docs/REVIEW-GRAPH-SCHEMA.md:100`

```
- evidence_spans[]: {artifact_id, start, end, quote}   // verbatim, offsets must resolve
```

`docs/REVIEW-GRAPH-SCHEMA.md:129`

```
- proposition_at_issue: {text, spans[]}   // must quote the artifact
```

The contract puts `artifact_id` inside the span and says the span must quote *the artifact*. The acceptance test that polices it, AT-2 (`:281`), is worded without the binding:

> `AT-2  Quotability: proposition spans always resolve to exact substrings.`

"Exact substrings" of what, AT-2 does not say. The implementation satisfies AT-2 as written and misses what lines 100 and 129 intend. No acceptance test binds an id to a text, which is why this passed every gate.

### 4.7 Call sites

`api/read.js:570` hardcodes `artifactId: "original_answer"` for the single surface, where one artifact exists and the id cannot be wrong.

`api/read-paired.js:433` builds the paired map:

```js
  const artifacts = { [ARTIFACT_ORIGINAL]: openAnswer || "", [ARTIFACT_TARGETED]: targetedAnswer || "" };
```

Both call sites (`api/read-paired.js:852` and `:1282`) pass the arguments in the correct order today. Section 7 covers why that is worth naming anyway.

---

## 5. Every published record, tested

### 5.1 What is actually published

The brief states that published archive cases already carry anchors. **That is not the case, and the correction changes the classification, so it is stated plainly here.**

Checked and carrying no span anchors: `case/003.html`, `case/005.html`, `case/013.html`, `case/018.html`, `case/021.html`, `archive.html`. These are hand-authored prose, prompts and scores.

Airtable carries no span anchors either. `Inspection Shares.Findings JSON` stores `{type, materiality, anchor}` for single mode and `{point, signal_pattern, open_side, targeted_side}` for paired — quotation strings with role labels, and no offsets and no `artifact_id`. `api/inspection-share.js` confirms only clipped strings persist. `Reader Runs` stores no spans. `Reader Paired Analyses.Delta Items` is derived JSON without spans.

Span anchors with `artifact_id` exist in exactly three places: runtime API responses, the in-browser Review Packet export, and the 32 committed QA snapshots under `docs/qa/visual-acceptance-harness/`. The first two are ephemeral. The third is the entire committed corpus, and it is what this section tests.

The consequence: **no historically malformed record exists to repair.**

### 5.2 Method

For every span found in a committed record, three independent questions:

- **R1 — stated-artifact resolution.** Does the artifact the span *names*, sliced at `[start, end)`, equal the quote? This is the claim the record makes and the claim nothing currently checks.
- **R2 — cross-artifact collision.** Does another artifact in the same record, at the same offsets, also equal the quote?
- **R3 — identity-blind acceptance.** Would the shipped `spanResolves` accept this span against the wrong artifact of its own record?

Two anchor shapes ship, and the audit collects both:

- **Shape A**, Check Register: `{artifact_id, start, end, quote}`.
- **Shape B**, canonical anchor: `{role, status, quote, span: {artifact_id, start, end}}` — the quote lives on the parent, not on the span.

A first pass of this audit collected only Shape A and reported 384 spans, all `original_answer`. That was wrong. It silently skipped every Shape B anchor and would have declared the entire paired surface untested while reporting a clean result. Correcting the collector took the count to 680 and surfaced the `targeted_answer` role. The near-miss is recorded because an anchor auditor that knows one shape produces a confident, false all-clear.

### 5.3 Result — 32 records, 680 anchors

| Result | Spans | R1 fail | R2 collide | Roles named | Record |
|---|---|---|---|---|---|
| PASS | 24 | 0 | 0 | original+targeted | `claim-authorized-match--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-authorized-match--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-authorized-mismatch--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-authorized-mismatch--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-client-declaration--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-client-declaration--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-unrecognized-source--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `claim-unrecognized-source--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `export-paired--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `export-paired--mobile` |
| PASS | 16 | 0 | 0 | original | `export-single--desktop` |
| PASS | 16 | 0 | 0 | original | `export-single--mobile` |
| PASS | 18 | 0 | 0 | original | `paired-empty--desktop` |
| PASS | 18 | 0 | 0 | original | `paired-empty--mobile` |
| PASS | 18 | 0 | 0 | original | `paired-legacy--desktop` |
| PASS | 18 | 0 | 0 | original | `paired-legacy--mobile` |
| PASS | 18 | 0 | 0 | original | `paired-legacy-rows--desktop` |
| PASS | 18 | 0 | 0 | original | `paired-legacy-rows--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `paired-matched--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `paired-matched--mobile` |
| PASS | 22 | 0 | 0 | original+targeted | `paired-rejected-snippet--desktop` |
| PASS | 22 | 0 | 0 | original+targeted | `paired-rejected-snippet--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `paired-unmatched--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `paired-unmatched--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `provenance-complete--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `provenance-complete--mobile` |
| PASS | 24 | 0 | 0 | original+targeted | `provenance-partial--desktop` |
| PASS | 24 | 0 | 0 | original+targeted | `provenance-partial--mobile` |
| PASS | 16 | 0 | 0 | original | `share-consent--desktop` |
| PASS | 16 | 0 | 0 | original | `share-consent--mobile` |
| PASS | 16 | 0 | 0 | original | `single-findings--desktop` |
| PASS | 16 | 0 | 0 | original | `single-findings--mobile` |

**Totals: 32 records · 680 anchors · R1 fail 0 · R2 collide 0 · R3 blind 0.**

### 5.4 Why the clean result proves less than it appears to

All 26 paired records carry **one** answer pair. Hashing the two bodies per record returns a single distinct `(open, targeted)` combination across all 26 files. The corpus is one hand-authored pair rendered 26 ways.

That pair's two sides share **zero** sentences of 25 characters or more. R2 = 0 is a property of a fixture built from deliberately disjoint text. It is not a measurement of the system, and it is not evidence that artifact identity is doing no work.

---

## 6. The required adversarial test

### 6.1 Construction

Two artifacts with a byte-identical prefix, so the anchor text sits at identical offsets in both. They diverge only after the anchored region, which is what a paired capture looks like when a model repeats itself across the two answers.

```js
const SHARED_PREFIX =
  "A landlord must return a security deposit within 30 days. If the landlord keeps any part of the deposit, they must send an itemized list.";

const ARTIFACT_A = SHARED_PREFIX + " Most tenants get the full amount back, so there is usually nothing to worry about.";
const ARTIFACT_B = SHARED_PREFIX + " The deadline varies by state and several states impose a penalty when it is missed.";

const PROP = "A landlord must return a security deposit within 30 days.";

assert.equal(ARTIFACT_A.indexOf(PROP), ARTIFACT_B.indexOf(PROP));   // identical offsets
assert.notEqual(ARTIFACT_A, ARTIFACT_B);                            // different documents
```

The test exercises every layer that touches a span, against the shipped implementation at `001ddc4d`. Nothing was patched and nothing was committed.

### 6.2 Result — fails at 5 of 5 layers

| Layer | Expected | Observed |
|---|---|---|
| **L1** `resolveSpan` | refuses to stamp an id that does not name the text it resolved against | returns `{artifact_id:"artifact_A", start:0, end:57, quote:"A landlord must return a security deposit within 30 days."}` — resolved against B, stamped A |
| **L2** `validateCheck` | rejects the span evaluated against the wrong artifact | `{ok:true}` against A **and** `{ok:true}` against B |
| **L3** `buildCheckRegister` | emits no card when the id does not name the text | emits **1 card**; every span stamped `artifact_A`; the quote was located in B |
| **L4** anchor contract | cannot mint two differently-named anchors from one document | minted **QUOTED anchors for both** `original_answer` and `targeted_answer` from one document |
| **L5** `validateReviewRecord` | rejects a span that does not occur in the artifact it names | **`{ok:true}`** |

**L5 is the headline.** The fixture record names `targeted_answer` with quote `PROP` at `[0, 57)`, and the record's own `targeted_answer` body is `"Something else entirely."` — 24 characters. The span cannot possibly resolve. The record carries both artifact bodies, so the check is available. `validateReviewRecord` returns `ok: true`.

L3 is the second headline in a different way: `buildCheckRegister({artifactId: "artifact_A", artifactText: ARTIFACT_B, ...})` produced a finished, emittable Check Register card whose every span asserts an origin the text does not have. The both-ends-quotable rule held. Both ends quoted. They quoted the wrong document.

### 6.3 One correction to the test's own result

The first run of L5 reported PASS. It rejected on `versions.schema must be review-graph.v0.3.1`, an unrelated field in the fixture, and never reached the span question. A rejection for the wrong reason is a false pass. The fixture was corrected and the layer now classifies the rejection reason rather than reading `ok` alone. The corrected result is the one above.

### 6.4 On L4, precisely

L4 fails the test as written, and the rule the test encodes is not one the anchor layer can enforce alone.

Two roles may legitimately quote the same sentence when both answers genuinely contain it. What L4 demonstrates is narrower and still serious: `buildFinding` accepted a role→text map in which **both roles named the same document**, and minted anchors attributing two quotes to two different artifacts. The record then asserts that `PROP` came from the targeted answer and `DEP` came from the open answer. One document produced both.

The enforceable version of this rule lives where the map is built, not where the anchor is minted. A pair whose two answers are byte-identical is not a pair. Section 8 puts the check there. This distinction is recorded because the corrective action differs, and a patch aimed at the wrong layer would look like a fix without being one.

---

## 7. Question 6 — open and targeted spans

**They are not unambiguously distinguished.** Two separate mechanisms are involved and they have different severities.

### 7.1 The brief's hypothesis, measured

The brief flags this as the highest-risk case on the grounds that paired captures routinely repeat language and text matching without artifact identity cannot tell the two apart. **The data does not support the premise, at anchor length.**

Six real paired captures, read from `Reader Paired Analyses` joined to `Reader Runs` on request id, measured for verbatim phrase overlap between the open and targeted answers:

| Phrase length | Open-answer phrases also present verbatim in the targeted answer |
|---|---|
| 5 words | 14 of 797 (1.8%) |
| 8 words | 1 of 781 (0.1%) |
| 12 words | 0 of 757 (0.0%) |

A model-proposed snippet is a clause or a sentence, well above 12 words. At that length the measured collision rate across these six pairs is zero. The single 8-word collision was `"may be wrongful if it was not for"`, in the Montana wrongful-discharge pair.

Two caveats keep this from being reassuring. The sample is six pairs in one domain cluster (legal and tax), and the low overlap is a property of the current targeted prompt, which asks for material the open answer did not give. A probe that asked the model to restate its answer would produce a far higher number, and the anchor layer would not behave differently.

### 7.2 The mechanism that actually matters

Accidental collision is not the dominant risk. Misbinding is, and it is worse in kind.

The role→text binding is established exactly once, positionally, at `api/read-paired.js:433`:

```js
  const artifacts = { [ARTIFACT_ORIGINAL]: openAnswer || "", [ARTIFACT_TARGETED]: targetedAnswer || "" };
```

from the signature at `:431`:

```js
export function buildCanonicalPaired(pm, openAnswer, targetedAnswer) {
```

Two adjacent parameters of the same type, distinguished only by position. Both current call sites pass them correctly. If a future edit swaps them, every anchor in the record is confidently mislabeled at once, and no layer downstream can detect it: `buildFinding` keys off the map it is given, `quotedAnchor` copies the role, `spanResolves` never reads the id, and `validateReviewRecord` never opens a span. The Review Record would hash cleanly and export as a valid work product.

That is the difference in kind. A collision is probabilistic and affects one anchor. A swap is systematic, affects every anchor in the record, and produces a document that passes every check the system has.

The replay path at `:852` reconstructs a canonical result from stored Airtable fields, which is where this binding is most exposed to future drift.

---

## 8. Proposed patch — described, not applied

Nothing below was written to any source file. This pass changed no product code.

### 8.1 Make the defect unrepresentable, rather than detected

The pattern that fixes this already exists in the codebase. `buildFinding` selects text and id with a single key. `resolveSpan` takes them as two arguments. Generalizing the first pattern is the smallest change that removes the class of error instead of catching instances of it.

**P1 — `reader-checks.js`, keyed resolution.** Change `resolveSpan(artifactText, quote, artifactId)` to take an artifacts map and a role: `resolveSpan(artifacts, role, quote)`, resolving against `artifacts[role]` and stamping `role`. The id and the text then come from one lookup and cannot disagree. Propagate through `resolveSpans`, `assembleComparativeCheck`, and `buildCheckRegister`, replacing the `{artifactId, artifactText}` parameter pair with `{artifacts}`.

**P2 — `reader-checks.js`, the door reads the id.** Change `spanResolves(span, artifactText)` to `spanResolves(span, artifacts)`: look up `artifacts[span.artifact_id]`, return `false` when the record carries no such artifact, and otherwise compare the slice. Change `validateCheck(check, event, artifactText)` to take `artifacts`. This is the queued item 2 and it is four lines.

**P3 — `reader-result.js`, the anchor proves itself.** Give `quotedAnchor` an `artifactText` parameter and refuse to mint unless `artifactText.slice(span.start, span.end) === quote`. `buildAnchor` already holds both the role and the text at `:415`, so it passes what it has. A QUOTED anchor then carries a checked claim rather than a copied label.

**P4 — `reader-review-record.js`, validate the exported product.** Add a span pass to `validateReviewRecord`: for every span in `detector_events[].evidence_spans`, `checks[].proposition_at_issue.spans`, and `checks[].dependent_output.spans`, look up `span.artifact_id` in `c.artifacts` and require `body.slice(start, end) === quote`. Reject a span naming an artifact the record does not carry. This is the largest correctness gain per line in the patch, because it is the only one that governs the document a reviewer holds.

**P5 — `api/read-paired.js`, name the binding.** Change `buildCanonicalPaired(pm, openAnswer, targetedAnswer)` to take one object, `{ open, targeted }`, so a transposition becomes a named-key error rather than a silent positional one. Reject a paired map whose two bodies are byte-identical, which is the enforceable form of the L4 rule from Section 6.4.

### 8.2 The schema and its acceptance test

AT-2 is worded so that the current implementation passes it. Section 4.6 quotes it. The patch needs a companion acceptance test that states the binding — spans resolve to exact substrings **of the artifact named by their `artifact_id`** — because otherwise the next implementation is free to drift back. Whether that lands as a reworded AT-2 or a new AT is a schema-governance decision, not this pass's call.

### 8.3 What this patch does not fix, stated plainly

**The patch closes internal desynchronization. It cannot close input mislabeling.**

If the person's open answer is in fact their targeted answer, every check in P1–P5 passes and the record is confidently wrong. No code can know which of two pasted documents came first. The claim the patched system can support is narrow and worth stating in exactly these terms: *every anchor reproduces verbatim from the artifact this record labels as its source.* It cannot support *the artifact labels are correct.*

Overstating the repaired guarantee would reintroduce, at the level of the claim, precisely the defect this audit found in the code.

---

## 9. Regression tests required

1. **The adversarial test, committed.** All five layers from Section 6, as a permanent test. It is the direct expression of the defect and it currently fails 5 of 5.
2. **Identical text, identical offsets.** Two artifacts sharing a prefix: the span resolves for the artifact it names and refuses for the other. This is the specific case Q3 asks about.
3. **Unknown artifact.** `validateReviewRecord` rejects a span whose `artifact_id` names no artifact the record carries.
4. **Non-reproducing quote.** `validateReviewRecord` rejects a span whose quote is not at those offsets in the artifact it names. This is the L5 fixture.
5. **Anchor self-proof.** `quotedAnchor` refuses a `(quote, span)` pair that does not reproduce from the supplied artifact text.
6. **Duplicate-artifact map.** `buildCanonicalPaired` rejects a pair whose two bodies are byte-identical.
7. **Rejection reason, not just rejection.** Each negative test asserts *why* validation failed, not only that it failed. Section 6.3 is the reason: a fixture that trips an unrelated gate reports a false pass.
8. **Regression floor over the committed corpus.** All 32 snapshot records keep R1 = 0 across all 680 anchors, under both anchor shapes. The dual-shape collector from Section 5.2 is a required part of this test, not an implementation detail.

---

## 10. Determination

**This defect blocks making the Check Register a first-class work product.** The claim under audit is traceability, and traceability is exactly the property that is unenforced.

Stated precisely, so the determination is not read wider or narrower than the evidence supports:

- **Blocked:** any claim that an anchor provably resolves to the artifact it cites. Today the anchor asserts an origin. Nothing verifies it. Every layer, including the validator on the exported hashed record, accepts a span that names the wrong artifact. For a document a compliance reviewer relies on, an unverified origin claim is the whole ballgame.
- **Not blocked:** the correctness of what already shipped. 680 of 680 published anchors resolve against the artifact they name. Nothing needs to be withdrawn, corrected, or re-exported.
- **Not blocked:** the both-ends-quotable rule, the ambiguity handling in `resolvePairedSnippet`, or the surfacing contract. Those hold. The gap is specific.

The remedy is a resolver patch. No record repair is needed, because no stored anchor is malformed. That is the cheapest possible version of this finding, and it is only cheap while the published corpus stays clean — which is a fact about today, not a property of the system.

---

## 11. Corrections to the brief

Both corrections change what the pass should do, so they are recorded rather than absorbed.

**"Published archive cases already carry anchors, so this is not only a forward-looking risk."** The archive case pages, `archive.html`, and every Airtable table carry no span anchors. The only committed anchors are the 32 QA snapshots, and all 680 pass. The risk **is** forward-looking, which is what makes the classification uniform: resolver under-validating, zero records malformed, no repair path needed. Had published cases carried anchors, this pass would have owed a record-repair plan.

**"Paired captures routinely repeat language, and text matching without artifact identity is not sufficient to tell them apart."** Measured across six real pairs, verbatim overlap at anchor length is 0.0% at 12 words and 0.1% at 8 words. The conclusion the brief draws is right and the stated mechanism is not the dominant one. The dominant mechanism is positional misbinding at `api/read-paired.js:431`, which is systematic rather than probabilistic and which no layer can detect. P5 addresses that; a patch aimed only at collision would not.

---

## Appendix — reproducing this audit

Four scripts ran from `/tmp/imbas-anchor-audit/`, deliberately outside the repository so that nothing entered the tree:

| Script | Purpose |
|---|---|
| `inventory.mjs` | repo-wide walk for `artifact_id`; located the committed corpus |
| `test-published-records.mjs` | per-record R1/R2/R3 over all 680 anchors, both shapes |
| `adversarial-cross-artifact.mjs` | the required L1–L5 adversarial test |
| `real-pairs.mjs` | phrase-overlap measurement over six real paired captures |

`test-published-records.mjs` reproduces `spanResolves` verbatim rather than importing it, because the function is module-private. The audit therefore tests the shipped rule rather than an approximation of it.
