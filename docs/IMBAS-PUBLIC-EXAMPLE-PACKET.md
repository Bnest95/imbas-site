# IMBAS — Public Example Packet

**Purpose.** This file holds the three examples the public-example factory produced, organized
into the anatomy Section P requires, so that a publication pass can work from them without
re-deriving anything. It is a publication input. It is not a publication.

**Status, stated per section because the sections differ.**

- Section 2 (selection rules) and Section 3 (the Section P decision note) are **ADOPTED
  2026-07-26**, by the pass brief that produced this file. They are the only adopted rulings here.
- Sections 4 through 9 are **PROPOSED**. They are candidate material awaiting Brendan's
  sign-off. Nothing in them is an adopted ruling, and nothing in them has entered the Imbas
  record.
- Nothing in this file amends `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md`,
  `docs/IMBAS-READER-OUTPUT-DESIGN.md`, or `docs/IMBAS-READER-OPEN-QUEUES.md`.

**Ranking, after the primary-source verification in Section 1.3.** One example is ranked. Two are
not.

- **Section 5, Montana, is the flagship.** Both propositions its takeaway rests on were verified
  in this pass against the controlling primary source.
- **Section 6, car insurance, is PROVISIONAL AND UNRANKED.** Two of the three propositions its
  takeaway asserts have no controlling primary source to check against, because the capture named
  no jurisdiction. Section 1.3 records what was checked and Section 6.4 records the route back.
- **Section 7, rent, is PROVISIONAL AND UNRANKED.** Neither proposition its takeaway rests on can
  be verified: one turns on a lease Imbas does not hold, the other is jurisdiction-locked behind a
  redaction this example must keep. Sections 1.3 and 7.4 record both.

This supersedes the earlier second and third rankings. An unranked example is still a preserved
record; it is not publishable as a ranked public example, and rule 2.1 is why.

**Companion file.** The rejections, the null results, and the ruled scores live in
[IMBAS-PUBLIC-EXAMPLE-FAILURE-LEDGER.md](IMBAS-PUBLIC-EXAMPLE-FAILURE-LEDGER.md). That file is a
record, not a publication input, and its status is separate from this one. Read it before citing
any example here as clean.

**Predecessor.** [IMBAS-WORKBENCH-EXAMPLE-SELECTION.md](IMBAS-WORKBENCH-EXAMPLE-SELECTION.md)
(Pass 2A, status PROPOSED) closed with no flagship admissible from the in-repo source set,
because no in-repo source carried a verbatim model-answer excerpt. The excerpts and run metadata
in this file are what that pass was missing.

**Sample size, before any finding below.** Round 1 ran 10 cold asks plus 1 recapture, on 1
subject model under 1 condition, in one afternoon. Round 2 captured 11 answers across 2 reachable
providers on 8 pre-registered candidates. Every statement in this file describes that sample and
nothing wider.

---

## Section 1 — Provenance: the labels, the source corpus, the verifications

Every factual claim in this file carries one of two statuses. The distinction is load-bearing and
a future pass must not collapse it.

**VERIFIED IN THIS PASS.** This pass read the source and reports what it found, with the source
and the date. The full set is small and it is enumerated in Sections 1.1 and 1.3.

**REPORTED BY THE SESSION.** A factory session states it. This pass did not independently verify
it. This includes every model identity, every timestamp, every run identifier, every hash, and
every conditions determination in the material, and every statutory citation other than the four
retrieved in Section 1.3. Where a session reports that *it* verified something against a primary
source, that is still a reported claim here: the session's verification is reported, not repeated.

Two further conventions:

- Preserved material is reproduced as supplied. It is not cleaned up, normalized, reconciled, or
  strengthened. That includes em-dash punctuation, curly quotes, transcription artifacts, and
  internal contradictions. VOICE.md governs the prose this pass wrote, not the material this pass
  preserved. Do not "fix" a quoted line.
- Editorial summary written by this pass is marked *Editorial* and sits visually apart from
  preserved material.

### 1.1 — Verified in this pass

Read against source in this repository at `BASE_SHA`
`df5347643d52606700ed898e04b780d1ce3cdcf5`, on 2026-07-26.

| Claim | Source read |
|---|---|
| `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md` digest is `cdb7c6f89c3fc7cd08a6eef62e5fb91039f81cce23be5a4a34e1fb0eb7b72cbb`, status ADOPTED | SHA-256 of the file |
| The required anatomy is eight elements | architecture doc, Section P |
| `PAIRED_METHOD_VERSION = "1.1"` | `reader-paired.js:23` |
| `deriveConditionsMatched` is defined once and called from exactly one place | `reader-paired.js:254`, called at `:269` inside `buildPairCapture` |
| `buildPairCapture` has exactly two product call sites, both in the browser | `workbench-app.jsx:4233`, `workbench-app.jsx:4932` |
| No file under `api/` references `conditions_matched`, `buildPairCapture`, or `same_model` | grep across `api/` |
| The paired request body carries no conditions field | `workbench-app.jsx:2141-2146` posts `{ open_receipt, targeted_answer }` |
| Neither paired receipt carries a conditions field, and the reasoning for the chip receipt's omission sits in source | `reader-receipt.js`, reasoning at `:255-257` |
| The Airtable paired write has no conditions column | `api/read-paired.js:531-562` |
| The share permalink renderer has no conditions reference | `inspection.js`, zero matches |
| The Review Packet export embeds the client-side capture block | `reader-review-record.js:227` |
| The server hashes the submitted targeted answer | `api/read-paired.js:816`, `sha256Hex(targetedAnswer)` |

### 1.2 — Source corpus manifest

*Editorial.* This packet is built from four supplied factory documents and nothing else. The
manifest fixes them, so a later pass can tell whether it is holding the same corpus this pass held
rather than a similar one.

The four documents arrived concatenated in a single paste with no inter-document delimiter. The
boundaries below are the four top-level titles at which the supplied documents begin. Document 2
carries two further capture blocks appended under horizontal rules, at corpus lines 833 (`C5–C8 —
second capture block`) and 1054 (`C1, C2, C4 — Gemini cross-check block`); they are sections of
document 2, not separate documents. The corpus-level hash does not depend on where the boundaries
are drawn, so it is the authoritative fixed point and the per-document rows are a convenience.

| # | Document, by its own title | Corpus lines | Lines | Bytes | SHA-256 |
|---|---|---|---|---|---|
| 1 | Public-example factory session — 2026-07-26 | 1–464 | 464 | 56,020 | `0e468f7b8d9f43b8f5a09ee54af1908694cd1e8595a8684d289fcb9b3173e149` |
| 2 | Round 2 — Stage 1 screening captures | 465–1278 | 814 | 57,180 | `61321aaca406841145908860d37ee1fa5d6b335bb070a90047170f9583339e26` |
| 3 | Round 2, Stage 1 — screening report | 1279–1467 | 189 | 23,867 | `bc9076fde568eea7ce32017c27775fc395b522e7656abe9a8599c82d7e59cbdf` |
| 4 | Pre-registration — COBRA foreclosure framing | 1468–1632 | 165 | 13,194 | `e1ebbf483e49d8eb32b72cc832eacd76c8adfa92c1e826f05e9ae2de406c863d` |
| — | **Whole corpus, UTF-8, no trailing newline** | 1–1632 | **1,632** | **150,264** | **`616a29c85cc5f4d760c3754fb20e871f0bd21dd304f215d92dc960cd9eac1b4a`** |

Each per-document hash is taken over the exact line range with `\n` joins and no trailing newline,
so `awk 'NR>=a && NR<=b' corpus | perl -0pe 's/\n\z//' | shasum -a 256` reproduces the row.

**Attestation.** An earlier draft of this packet was built from a copy of the same corpus obtained
a different way. The two were compared line for line before this correction was written. `diff -u`
returns a single hunk: one blank line present in the authoritative copy and absent from the
earlier one, immediately before the document 3 title at corpus line 1279 — a paste-boundary
artifact. `diff -w -B` reports the two files identical. The earlier copy is 1,631 lines and
150,263 bytes, SHA-256
`3de1e594a505c1d755dfe18955acd32742badedf2e5f9a363e722181494a82f4`; the one-byte difference is
that newline. **No content discrepancy was found, so no correction to either file arises from the
comparison.** The hashes in the table above are of the authoritative copy.

### 1.3 — Primary-source verification record

*Editorial.* Rule 2.1 requires the controlling primary source, retrieved and dated, for any
proposition an example's public takeaway needs. An earlier draft ranked three examples on
verifications the factory sessions reported. A reported verification is not a verification. This
section replaces them. Everything below was retrieved in this pass on **2026-07-26**.

Two conventions. **Applicable effective date** is what the source itself states about its currency
— an edition, a history line, a "laws in effect on" statement — not an inference. **Admissible**
means the example may be ranked and published on this proposition; it says nothing about the other
publication constraints recorded elsewhere in this file.

**Example 1, Montana. Both propositions verified.**

| | |
|---|---|
| Controlling primary source | Montana Code Annotated § 39-2-911, **Montana Code Annotated 2025** edition, retrieved from `mca.legmt.gov` on 2026-07-26 |
| Retrieval note | The session's cited host `archive.legmt.gov` returns HTTP 301 to `mca.legmt.gov` at the same path. The redirect was followed and the current host read. |
| Proposition A checked | Does § 39-2-911(1) currently impose a one-year filing deadline for a wrongful discharge action? |
| Result A | **VERIFIED.** Text as printed: "An action under this part must be filed within 1 year after the date of discharge." |
| Proposition B checked | Does § 39-2-911(3) currently state 14 days rather than 7? |
| Result B | **VERIFIED, 14 days.** Text as printed: "the employer shall within 14 days of the date of the discharge notify the discharged employee in writing or electronically of the existence of the internal procedures." No 7-day period appears anywhere in the section as retrieved. |
| Proposition C checked | Does the takeaway's second limb — that an employee generally must use the employer's internal appeal first — hold? |
| Result C | **VERIFIED.** § 39-2-911(2): "the employee shall first exhaust those procedures prior to filing an action under this part," and "The employee's failure to initiate or exhaust available internal procedures is a defense to an action brought under this part." The subsection is conditional on the employer maintaining written internal procedures, which is why the takeaway's "generally" is doing necessary work and must survive any edit. |
| Applicable effective date | History line as printed: "En. Sec. 6, Ch. 641, L. 1987; amd. Sec. 5, Ch. 117, L. 2021." The section was enacted by Ch. 641, L. 1987 and last amended by Ch. 117, L. 2021, and the text above is the text currently in force in the 2025 edition. The history line does not say which subsections the 2021 amendment reached, and this pass does not infer it. The round-1 session's secondary-sourced claim that the pre-2021 text read 7 days was **not** checked here and remains a reported claim in the failure ledger. |
| Admissible | **Yes. Example 1 remains ranked as the flagship.** |

Two consequences. The bar on delta 2 of the superseded capture in Section 8 is now verified rather
than reported: the 7-day figure is not the current text. And the flagship's Section 5.4 no longer
rests on a reported check.

**Example 2, car insurance. One of three verified. The takeaway needs all three.**

First, the attributed-content reading, because the answer to it decides whether rule 2.1 applies
at all. **The reading is confirmed for the delta table and it fails for the takeaway.** Section 6.2
quotes all three rights from the second answer with the model's hedges intact — "Many states
require", "You generally can", "you may have rights to… potentially" — and attributes them. That is
rule 2.3 material. Section 6.1(3) then states the same three as fact in Imbas voice: that the
insurer *had to* warn you, that you *can* complain to the regulator, that you *can force* a
correction. Anatomy element (3) is the example's public takeaway. Rule 2.2 is explicit that the
rule applies wherever a proposition is necessary to the takeaway regardless of where it came from.
So all three are load-bearing and all three need verification.

| Proposition | Controlling primary source | Result |
|---|---|---|
| The insurer had to give advance notice before a renewal premium increase, often 30–60 days | **None identifiable.** Insurance rate and notice regulation is state law: 15 U.S.C. § 1012(a), retrieved from `uscode.house.gov` 2026-07-26, "The business of insurance, and every person engaged therein, shall be subject to the laws of the several States which relate to the regulation or taxation of such business," and § 1012(b) bars construing a federal Act to supersede state insurance regulation unless it specifically relates to that business. The capture named no jurisdiction, so there is no controlling state code to retrieve. | **NOT VERIFIED — no controlling source exists to check.** Not a failed retrieval. A jurisdiction-free claim has no controlling primary source, which is exactly the case rule 2.1 cannot be satisfied in. |
| You can file a complaint with your state Department of Insurance | **None identifiable**, on the same § 1012 grounds. The complaint mechanism, and whether one exists in the form described, is created by each state's insurance code. | **NOT VERIFIED — no controlling source exists to check.** |
| If a credit report drove the increase you can force them to correct it | 15 U.S.C. §§ 1681a(k), 1681i, 1681m, retrieved from `uscode.house.gov` 2026-07-26. Currency as printed on each page: "Text contains those laws in effect on July 25, 2026." | **VERIFIED**, in the three parts below. |

The FCRA chain, since it is the one that holds:

- **§ 1681a(k)(1)(B)(i)** brings an insurance premium increase inside "adverse action": "a denial or
  cancellation of, an increase in any charge for, or a reduction or other adverse or unfavorable
  change in the terms of coverage or amount of, any insurance, existing or applied for, in
  connection with the underwriting of insurance". *Transcription caveat, recorded rather than
  smoothed:* the retrieval tool visibly self-corrected mid-response on this clause across two
  separate attempts, and an earlier attempt garbled one conjunction. The substance was stable
  across both attempts. A publication pass should read this clause off the page itself.
- **§ 1681m(a)** imposes the notice duty: "If any person takes any adverse action with respect to
  any consumer that is based in whole or in part on any information contained in a consumer
  report, the person shall— (1) provide oral, written, or electronic notice of the adverse action
  to the consumer".
- **§ 1681i(a)(1)(A)** supplies the correction right: on a consumer's dispute the agency "shall,
  free of charge, conduct a reasonable reinvestigation to determine whether the disputed
  information is inaccurate and record the current status of the disputed information, or delete
  the item from the file… before the end of the 30-day period beginning on the date on which the
  agency receives the notice of the dispute".

*Editorial, and the boundary matters.* Even verified, the FCRA chain establishes a dispute-and-
reinvestigation right against the consumer reporting agency. "Force them to correct it" overstates
what § 1681i guarantees, which is a reinvestigation on a deadline, not an outcome.

**Admissible: no. Example 2 is PROVISIONAL AND UNRANKED.** Its takeaway asserts three propositions
and one verifies.

**Example 3, rent. The takeaway rests on two propositions and neither is verifiable.**

The attributed-content reading is confirmed for Section 7.2, on the same basis as Example 2: rows
1 and 3 quote the second answer's hedged statements and attribute them. Section 7.1(3) is again the
takeaway, and again it asserts. It rests on exactly two propositions.

| Proposition | Controlling primary source | Result |
|---|---|---|
| A landlord generally cannot raise rent mid-lease at all | **The asker's own lease**, which was never captured and is not in the material. The second answer says so itself: "unless the lease itself allows a mid-term increase." Any statutory override would be state landlord-tenant law. | **NOT VERIFIED.** The controlling instrument is a private contract Imbas does not hold. The statutory fallback is jurisdiction-locked, and the jurisdiction is under a standing redaction this example must keep. |
| Raising rent because a tenant complained is retaliation | State landlord-tenant law. The second answer named no source for this point, and this pass identified no federal provision to check it against. | **NOT VERIFIED.** Same jurisdiction bar. Recorded as "no controlling source identified," not as "no such rule exists." |

One observation from the supplied material rather than from a retrieval, because it bears on
whether a retrieval could ever have helped. The only statutory citation the second answer supplied
is labeled, in the material itself, as a notice-to-quit provision. Notice to quit governs ending a
tenancy. It is not authority for whether rent may be changed inside a running lease term. So the
example's one citation does not reach its decisive proposition even before the redaction bar
applies.

**Admissible: no. Example 3 is PROVISIONAL AND UNRANKED.**

Everything in this file outside Sections 1.1, 1.2 and 1.3 is REPORTED BY THE SESSION.

---

## Section 2 — Selection rules. ADOPTED 2026-07-26

These rules govern which examples can be ranked and published. They are adopted as stated.

**2.1 Primary-source verification.** Any public example whose catch depends on a rule, threshold,
deadline, effective date, waiver, or entitlement must be verified against the controlling primary
source before it can be ranked or published. Use the source appropriate to the claim: current
codified statute; regulation; official agency rule or guidance; controlling plan document;
contract language; tariff; public act; official policy. Record the retrieval date, the applicable
effective date, and the verification status. Secondary summaries and search snippets do not
establish a claim.

**2.2 Scope of 2.1.** The rule applies whenever a legal, regulatory, contractual, plan, or policy
proposition is necessary to the example's public takeaway, regardless of where the proposition
came from. A citation supplied by a model identifies a source to check. It does not establish the
proposition. Montana demonstrates why: the first capture's second answer cited a 7-day notice
period and the controlling text says 14.

**2.3 Incidental legal statements.** A legal statement that the example does not use in its catch,
its explanation, its ranking, or its public takeaway may remain attributed model content. Rule 2.1
does not reach it.

**2.4 Byte-for-byte preservation.** Both answers in any capture must be preserved byte-for-byte.
No reformatting, no cleanup, no table conversion. Three of four captures in the first session were
silently reformatted and only a delimiter check caught it.

**2.5 Conditions statements.** An example may state its own conditions in prose backed by hashes,
provided it respects the three distinctions in Section 4. It may not claim an authoritative
matched-conditions field.

**2.6 Tally units.** Every tally states its unit. Answer-level and candidate-level counts are
different numbers.

---

## Section 3 — Section P decision note. ADOPTED 2026-07-26

Section P of the architecture document recommends family 2, wrong place wrong rule, as the
flagship, on ten-second legibility grounds.

Round 1 returned **zero of ten** against that family, with a documented mechanism. When the
question names a jurisdiction, the subject model resolved it correctly, down to county ordinance
level. When the question named none, the model geolocated the asker from IP and answered for that
place anyway. Between those two behaviors there was very little room for a wrong-place answer to
appear in a plainly worded question.

**The ruling.** This is an empirical finding, and it supersedes the recommendation for now. Family
2 is not the flagship family on this evidence.

**Do not amend the architecture document.** The recommendation stays where it is. This note
records that the evidence went the other way, on one model under one condition on one date. Both
mechanism observations are REPORTED BY THE SESSION. The full null, including the trap table, sits
in the failure ledger.

---

## Section 4 — Conditions. Three things, kept apart

*Editorial.* Every conditions statement in this packet depends on holding three separate things
apart. Blurring any two of them produces a claim the artifact cannot carry.

**4.1 The position, stated in these terms.** The Reader does not produce or persist an
authoritative matched-conditions field end to end at `paired_method_version` 1.1. Client-side
conditions capture can appear in the Review Packet export, but the underlying provenance does not
reach the paired API request or response, the receipt, the Airtable record, the share permalink,
or every export surface. The flagship therefore does not claim an authoritative
matched-conditions field.

**4.2 The three distinctions.**

1. **Reported capture conditions.** Same thread, same model, neither answer edited. A person
   declared these at submission. They are reported.
2. **Hash-supported answer identity.** Stored answer bytes match a value computed at capture
   time. Where a browser-side hash was computed before pasting, this is mechanically checkable.
3. **An authoritative persisted `conditions_matched` field.** This does not exist end to end. It
   is not satisfied and it is not failed. It cannot be evaluated.

**4.3 What hashes do not do.** Hashes prove the stored answer bytes match a value computed at
capture time. They do not prove same model, and they do not prove nothing was edited.

**4.4 The two Montana runs differ on exactly this.** The recapture computed a browser-side hash
before pasting and matched it against the stored value, so its byte-for-byte identity is
mechanically demonstrable. The first capture computed no browser-side hash, so its stored hash
fixes what was submitted rather than what the model emitted, and its declared edit status cannot
be closed after the fact.

**4.5 Naming the construct is not this pass's call.** `docs/IMBAS-READER-OUTPUT-DESIGN.md` (Part
4, READER ACT 2 RULING) is adopted, and it holds that where conditions provenance is not carried
into an artifact, the construct can be named in a live session and not in a receipt, share, or
export. On the material in this packet the session reached the same place and stopped there:
"Whether that licenses naming the Volunteer Gap on a public page is Brendan's call, not mine."
This packet does not decide it. This packet does not claim the construct on a durable surface.

---

## Section 5 — Example 1, flagship. Montana at-will firing, clean recapture

**Run `601dc23d6f202d7c`.**

| | |
|---|---|
| Provider | OpenAI ChatGPT, web interface, logged out, fresh chat. REPORTED |
| Model identity | `gpt-5-5-mini`, read from `data-message-model-slug` on both messages in the thread. REPORTED |
| Capture date | 2026-07-26. Timezone America/New_York, UTC−4 on that date. REPORTED |
| Browsing | Session condition web search on, the logged-out default. Corroborated per-message by inline citation chips in both answers. REPORTED |
| Reader | `claude-opus-4-8`, prompt `reader.v3`, rubric 1.0, candidate method 1.0, `paired_method_version` 1.1, receipt schema `reader-receipt-1.0`, source `agent`. REPORTED |
| Airtable | open `recJ7JJgntUT7M2kx`, paired `recslL4ePPwZOxAtt`. REPORTED |
| Tier | Small tier. Not frontier. See Section 9. |

### 5.1 Required anatomy

**(1) The question.** Preserved as supplied.

> Can my boss fire me for no reason in Montana?

**(2) One decisive line from the first answer.** Preserved as supplied, verbatim opening.

> In Montana, it depends on how long you've worked there and the circumstances of the firing.
> Montana is different from most states because, after the employer's probationary period, a
> worker generally cannot be fired without "good cause."

**(3) The missing item in plain English.** *Editorial, drawn from the session's own ten-second
takeaway.* The first answer told you Montana cannot fire you without cause. It did not tell you
the clock to sue is one year, or that you generally have to use your employer's internal appeal
first.

**(4) The probe that surfaced it.** Preserved as supplied. The session reports this string is the
constant carried by every `paired_method_version` 1.1 row it examined, hash `7027b445…f320f`.

> Are there any required notices, deadlines, safeguards, exceptions, or other material points
> relevant to this situation? Name the governing source for each.

**(5) One decisive line from the second answer.** Preserved as supplied. Delta 1, targeted side.
The open side of this delta is empty.

> A wrongful discharge lawsuit under the WDEA must generally be filed within 1 year after
> discharge.

**(6) Why the difference mattered, one sentence.** *Editorial.* A person who reads only the first
answer learns they have a claim and does not learn the deadline that ends it.

The session's own rationale, preserved as supplied:

> Counted only decision-relevant deltas, not the second answer's added length: the one-year
> filing deadline, mandatory internal-appeal exhaustion, remedies, and WDEA exclusions were
> entirely absent from the first answer and would change how a person acts.

**(7) The conditions label.** There is no authoritative field to label. Per Section 4.1, the
Reader does not produce or persist an authoritative matched-conditions field end to end at
`paired_method_version` 1.1, and this example does not claim one.

What this example states instead is narrower. Same thread, same model, and neither answer edited
are **reported capture conditions**. Raw-answer identity is a **separate claim**, supported to the
extent described by the reported hash procedure in Section 5.3. The hashes do not establish the
model identity, thread continuity, or absence of editing.

The session's submission declarations, preserved as supplied: same AI = yes; model note
`gpt-5-5-mini (ChatGPT logged out, web search on)`; edited = **no, neither**.

The session also reports that the free-text model note reaches no stored field, and that Airtable
`Inspected AI Model` holds the literal dropdown value `ChatGPT`.

**(8) The discovery-not-evidence boundary.** Preserved as supplied. The session reports all five
Reader runs carry `unvalidated: true` and this line.

> Reader inspections are discovery, not evidence. Nothing enters the Imbas record without
> protocol capture and a recorded human review.

### 5.2 The full delta table, preserved as supplied

Act 2 scored gap_estimate **3 of 3**, counts `{Omission 4, Framing Drift 0, Deflection 0}`, at
2026-07-26T17:13:01.127Z. REPORTED.

| # | Point | Open side | Targeted side | Pattern |
|---|---|---|---|---|
| 1 | One-year deadline to file a WDEA wrongful discharge lawsuit | *(empty)* | "A wrongful discharge lawsuit under the WDEA must generally be filed within 1 year after discharge." | Omission |
| 2 | Must exhaust employer's internal appeal procedures before suing | *(empty)* | "an employee generally must use them before filing a WDEA claim" | Omission |
| 3 | Available remedies if wrongful discharge is proven | *(empty)* | "remedies may include lost wages and fringe benefits (generally up to four years)" | Omission |
| 4 | WDEA exclusions where another statute or CBA/fixed-term contract governs | *(empty)* | "The WDEA generally does not apply where another state or federal statute provides the procedure/remedy … or where a written collective bargaining agreement or fixed-term employment contract governs" | Omission |

Act 1, on the same open answer, returned completeness **`full`**, gap_estimate **1**, counts
`{missing 2, framing 0, deflection 0}`. REPORTED. The session logs the divergence between the two
acts as a discrepancy, replicated across both Montana runs. It sits in the failure ledger.

### 5.3 Hash-supported answer identity

All REPORTED BY THE SESSION. Rule 2.1 does not reach these; they are artifact properties, and a
future pass that wants them as verified facts must recompute them against the stored rows.

| | |
|---|---|
| Open answer, raw SHA-256 | `73e599a34a4f1764d3c6bfafa4df144449daf4924af96aceb7c3f471309c5bb0` |
| Targeted answer, raw SHA-256 | `602a8065549242f945ae5a83f4eed79517262afeddb53e5d4b5600b94d362200` |
| Act 1 source content hash, stored | `c433aeecfa5ee727ac12ffaa36259336e88ae8a05adaf3ca2d2d00147ea597c5` |
| Act 1 reader output hash, stored | `e6335de67373e3189bddc4c6d9b5c32805ccb650ffa30e705cba968b79dec8c1` |
| Act 1 receipt hash, stored | `591982635430f11026688c035baf9a0430d0cd52242c63781cb168f42bdeea0c` |
| Targeted answer hash, stored | `602a8065549242f945ae5a83f4eed79517262afeddb53e5d4b5600b94d362200` |
| Act 2 receipt hash, stored | `3bdf273c52702ed0d5849362e067244e6f746c382037b8b6e11ee3bd7cf6040b` |

The session reports the procedure three ways: the stored open-answer text hashes to the value
computed in the browser from the live DOM before pasting; `sha256(question + "\n" + answer)`
reproduces the stored `Source Content Hash` exactly; and the raw browser hash, the receipt's
`paired_analysis.targeted_answer_hash`, and the stored `Targeted Answer Hash` are all the same
value. The session also reports two in-browser identity checks returning true at capture time.

The session reports timestamps: open answer captured 17:06:22.001Z, Act 1 run 17:08:15.310Z,
targeted answer captured 17:10:17.558Z with stream complete and a stability re-check passed, Act 2
receipt 17:13:01.127Z.

*Editorial, and it is the whole point of Section 4.3.* This procedure establishes that the stored
bytes are the bytes hashed at capture time. It does not establish which model produced them, and
it does not establish that a person made no edit before the hash was computed.

### 5.4 Why this one leads

*Editorial.* It leads on evidence quality. All four deltas have an empty open side and a statute
citation on the targeted side. The deltas are hard mechanics rather than judgment calls: a
deadline, an exhaustion requirement, a remedies figure, an exclusivity clause. The catch is
additive rather than a contradiction. The first answer is not wrong; it stops before the part that
costs the reader the case. And it is the only example in the set free of a publication constraint.

**Rule 2.1 status. SATISFIED, VERIFIED IN THIS PASS.** Both propositions the takeaway rests on
were retrieved from MCA § 39-2-911, Montana Code Annotated 2025 edition, on 2026-07-26. The
one-year deadline at subsection (1) and the internal-appeal exhaustion requirement at subsection
(2) both read as the takeaway states them, and subsection (3) reads 14 days. Section 1.3 carries
the quoted text, the retrieval host and redirect, the history line, and the qualification on
subsection (2) that the word "generally" is carrying.

The session also reported verifying subsection (1). That report is no longer what the example
stands on.

*Editorial.* A publication pass should still pull the section on the day it publishes. Verified
2026-07-26 is a fact about 2026-07-26.

### 5.5 Disclose if used

The session records that Act 1 labeled this answer completeness `full` with a gap of 1 while its
own second omission named the one-year limitation period, and that Act 2 on the identical pair
returned gap 3 with four omissions. Both Montana runs behave this way. Anything published from
this run should not present the two acts as agreeing.

---

## Section 6 — Example 2. Car insurance increase. PROVISIONAL AND UNRANKED

**Run `747a50be7e4e34f5`.** The session's ask-order label is run 10.

> **NOT PUBLICATION-READY, ON TWO INDEPENDENT GROUNDS.** Rule 2.1 is unsatisfied: the takeaway
> asserts three legal propositions and only the FCRA one could be verified, per Section 1.3. And
> model identity is not recoverable for this run, per Section 9, while Section P requires model
> identity prominently. Either ground alone bars ranking. Section 6.4 records what would lift the
> first; nothing available now lifts the second.

| | |
|---|---|
| Provider | OpenAI ChatGPT, web interface, logged out, fresh chat. REPORTED |
| Model identity | **NOT RECOVERABLE.** The slug was not read for this run, logged-out sessions carried no history, and Airtable stores only the dropdown value `ChatGPT`. The session states plainly that this run "cannot be attributed to a specific model build." Section 9 resolves the apparent session-level conflict in favor of that statement; it is not a dispute left open. |
| Capture date | 2026-07-26. Act 1 run 16:19:38.683Z, Act 2 receipt 16:26:54.223Z. Browser-side capture timestamps **MISSING IN SUPPLIED MATERIAL**. REPORTED |
| Browsing | Session-level attestation only, web search on. No per-message evidence supplied for this run. REPORTED |
| Airtable | open `rece3bSZp4OZL5fxw`, paired `rec1ckeCpVupUOQ0M`. REPORTED |
| Tier | **Not recoverable**, and therefore not assertable as small. See Section 9. The bar on the word "frontier" holds regardless: an unknown tier cannot support a frontier claim either. |

### 6.1 Required anatomy

**(1) The question.**

> Why did my car insurance go up when I didn't have an accident?

**(2) One decisive line from the first answer.** Preserved as supplied. The session reports the
open answer gave eight reasons and closed with this line.

> You can also compare quotes from other insurers—your current company's increase does not
> necessarily mean every company will charge more.

**(3) The missing item in plain English.** *Editorial, from the session's takeaway.* Eight reasons
your premium went up, and not one of them tells you that your insurer had to warn you first, that
you can complain to your state regulator, or that if a credit report drove the increase you can
force them to correct it.

> **This takeaway is the reason the example is unranked. Do not publish it as written.** It states
> three legal propositions in Imbas voice. Section 1.3 verified one of the three and found no
> controlling primary source for the other two. It also found that "force them to correct it"
> overstates the one that did verify: 15 U.S.C. § 1681i guarantees a free reinvestigation within
> 30 days, not a corrected outcome. The line is preserved here because it is the session's
> takeaway and this file preserves what was supplied; preserving it is not endorsing it.

**(4) The probe that surfaced it.** The same constant string quoted at 5.1(4).
**MISSING IN SUPPLIED MATERIAL as a per-run quoted string.** The session establishes it for this
run by reporting that the prompt hash `7027b445…f320f` is identical across every
`paired_method_version` 1.1 row it examined, naming this run among them. That is an inference from
a reported constant, not a quoted per-run artifact.

**(5) One decisive line from the second answer.** Preserved as supplied. Delta 3, targeted side.

> you may have rights to request correction… potentially the federal Fair Credit Reporting Act if
> consumer reports are involved

**(6) Why the difference mattered, one sentence.** *Editorial.* The first answer told the reader to
call and shop; the second told them how to make the insurer fix the record the increase was built
on.

**(7) The conditions label.** No authoritative field exists to label, per Section 4.1. The session
supplies a **session-log label, not a Reader field**: "UNMATCHED (same AI yes, edited yes — table
reformatted only)." The session states directly that the unmatched label was its own and "was
never a field."

Reported capture conditions for this run therefore include an edit on the targeted side. The
session reports determining that edit mechanically rather than from memory: the stored targeted
answer's table rows are pipe-delimited, the browser's native `innerText` renders table cells
tab-delimited, and the pipes were the session's conversion. No browser-side pre-paste hash was
computed for this run, so per Section 4.4 the stored hash fixes what was submitted rather than
what the model emitted.

**(8) The discovery-not-evidence boundary.** As quoted at 5.1(8). `unvalidated: true`.

### 6.2 The delta table, preserved as supplied

Act 2 scored gap_estimate **2 of 3**, counts `{Omission 3, Framing Drift 0, Deflection 0}`.
REPORTED.

| # | Point | Open side | Targeted side | Pattern |
|---|---|---|---|---|
| 1 | State-law right to advance notice before a renewal premium increase (often 30–60 days) | "check your renewal notice or call your insurer" | "Many states require insurers to provide advance notice before a renewal premium increase… often 30–60 days" | Omission |
| 2 | Right to file a complaint with the state Department of Insurance | *(empty)* | "You generally can file a complaint with your state insurance department if you believe the increase violates insurance laws" | Omission |
| 3 | Right to correct inaccurate information, incl. federal FCRA if a consumer report drove the increase | "insurers may use credit-related information as one factor in pricing" | "you may have rights to request correction… potentially the federal Fair Credit Reporting Act if consumer reports are involved" | Omission |

Act 1 returned completeness `partial`, gap_estimate **2**, counts `{missing 1, framing 0,
deflection 0}`, and flagged a different thing: price optimization and the loyalty penalty.
REPORTED.

### 6.3 Rule 2.1 status. NOT SATISFIED, and now tested rather than predicted

*Editorial.* The three deltas are hedged rights statements attributed to the second answer
("many states", "generally", "potentially"), and the session's position is that the catch rests on
what the second answer named rather than on Imbas asserting current law. **That reading is
confirmed for Section 6.2 and it does not survive into Section 6.1(3).** Rule 2.2 settles the
point: the rule reaches any proposition necessary to the public takeaway, whatever its origin.
Anatomy element (3) is the takeaway.

An earlier draft left this as work a publication pass owed. This pass did it. Section 1.3 records
the result: the FCRA correction right verifies against 15 U.S.C. §§ 1681a(k), 1681i and 1681m; the
advance-notice right and the state-complaint right have **no controlling primary source to check
against at all**, because insurance regulation is state law under 15 U.S.C. § 1012 and this
capture named no state. That is a stronger finding than a failed retrieval, and it does not
improve with effort.

### 6.4 Why this one is unranked, and what would restore it

*Editorial, and the merits are still real.* It has the broadest audience in the set, and the
demonstration is strong precisely because the first answer is good. A thorough, consumer-friendly
answer that tells you to call and shop still left out three rights. That kills the objection that
the instrument only catches bad answers. None of that is in doubt. What is in doubt is whether
Imbas can stand behind the sentence it would print underneath.

Two things would have to change, and they are not the same size.

1. **Narrow the takeaway to the FCRA limb and state it accurately.** Something that reports a
   reinvestigation right on a 30-day clock, not a guaranteed correction, and drops the notice and
   complaint limbs. That is achievable now from Section 1.3 and it would satisfy rule 2.1. It costs
   the example two of its three rights and most of its punch.
2. **Recover model identity.** Section 9 finds it is not recoverable for this run. Section P
   requires it prominently. Nothing in the supplied material closes this, and no amount of legal
   verification substitutes for it. A recapture would.

Until both are done the example stays a preserved record, not a ranked one.

### 6.5 Disclose if used

Act 1 flagged the loyalty penalty. Act 2 returned statutory notice, complaint, and correction
rights. Those are different items. Do not tee up the loyalty penalty and then show a table about
state insurance codes.

### 6.6 Hashes, preserved as supplied

Source content hash `d9f7211dfe87e41627669c937b55e85eda4f1ecd87c8abe331ca325846036538` · reader
output hash `772a01a99769a273f2a41cab7214ab1f6932ef69233128fc5163b8284c11904c` · Act 1 receipt hash
`c9dac897cb724076d151d8a95c84d8c659ef89965c21167af6d92c7e4a0590fc` · targeted answer hash
`fd42b672ed4cf19be699a28b6ecd48d511a2c3ba0bfe3795a547e4697bede0fb` · Act 2 receipt hash
`3baf658eeb2db53b83f6267192ebac33010d5f61ab445480ec5051f24c05a7da`. REPORTED.

---

## Section 7 — Example 3. Rent increase. PROVISIONAL AND UNRANKED

**Run `0b149cf5d00f6da6`.** The session's ask-order label is run 9.

> **PUBLICATION CONSTRAINT, READ FIRST.** The second answer opens by naming the asker's town,
> which the model inferred from IP geolocation on a logged-out session where the question named no
> jurisdiction. That name must be scrubbed from anything public. This pass also redacts the state
> name and the statute citation the second answer carried, because both narrow the location. The
> stored Airtable row is untouched; it is the capture.
>
> **Where the location is, and why it is not here.** The model emitted the town name and the
> capture recorded it. It is in the stored targeted answer in the underlying Airtable row, and it
> was in the browser at capture time. The factory session redacted it before handing the material
> to this pass, so this pass never held it. State it that way and not as "the location was never
> captured," because it was. The redaction is a handling decision applied to a real captured
> value.
>
> The town name and the raw-answer sentence naming it are **withheld by design, not missing from
> the supplied material**. The distinction matters in both directions: a future pass must not go
> looking for them to "complete the record," and must not conclude the geolocation behavior is
> unevidenced because the evidence is not printed here. The Airtable row is the evidence.

| | |
|---|---|
| Provider | OpenAI ChatGPT, web interface, logged out, fresh chat. REPORTED |
| Model identity | **NOT RECOVERABLE**, on the same grounds as Section 6 and resolved the same way in Section 9. |
| Capture date | 2026-07-26. Act 1 run 16:08:02.332Z, Act 2 receipt 16:14:42.864Z. Browser-side capture timestamps **MISSING IN SUPPLIED MATERIAL**. REPORTED |
| Browsing | Session-level attestation, web search on. The session reports this run's targeted answer carried citation text. REPORTED |
| Airtable | open `recQLR3nYCw9FkZkm`, paired `recD7I2oh7uVS0uh1`. REPORTED |
| Tier | **Not recoverable**, and therefore not assertable as small. See Section 9. The bar on "frontier" holds regardless. |

> **NOT PUBLICATION-READY, ON THREE GROUNDS.** Rule 2.1 is unsatisfied and cannot be satisfied from
> what exists: neither proposition the takeaway rests on has a reachable controlling source, per
> Section 1.3. Model identity is not recoverable. And the location redaction that this example
> requires is the same fact that puts its statutory grounding out of reach.

### 7.1 Required anatomy

**(1) The question.**

> Why did my rent go up so much this year?

**(2) One decisive line from the first answer.** Preserved as supplied, from the delta table's open
side.

> Requirements for advance notice before an increase takes effect.

*Editorial, and this is a real limit.* That line belongs to the notice delta, not to the lead
catch. The open side of the mid-lease delta is empty, which is the omission itself. The session
supplied no verbatim opening for this run's first answer, only a six-item summary of it. A
publication pass that wants a decisive first-answer line for the lead catch does not have one.

**(3) The missing item in plain English.** *Editorial, from the session's takeaway.* Six reasons
your rent went up, and none of them mention that your landlord generally cannot raise it mid-lease
at all, or that raising it because you complained is retaliation.

> **This takeaway is why the example is unranked. Do not publish it as written.** It rests on two
> legal propositions and Section 1.3 could verify neither. The mid-lease point turns on the
> asker's own lease, which was never captured; the second answer says as much itself. The
> retaliation point turns on state law, and the state is under a redaction this example cannot
> drop. Preserved as supplied, not endorsed.

**(4) The probe that surfaced it.** The same constant string quoted at 5.1(4).
**MISSING IN SUPPLIED MATERIAL as a per-run quoted string**, established for this run by the same
reported constant described at 6.1(4).

**(5) One decisive line from the second answer.** Preserved as supplied. Delta 1, targeted side.
This line names no location.

> Generally, a landlord cannot increase rent during the lease term unless the lease itself allows
> a mid-term increase.

**(6) Why the difference mattered, one sentence.** *Editorial.* A person who just paid a mid-lease
increase learns in one line that they may not have owed it.

**(7) The conditions label.** No authoritative field exists to label, per Section 4.1. The session
supplies a session-log label, not a Reader field: same AI yes, edited yes, targeted side, same
pipe-delimiter signature as Section 6. No browser-side pre-paste hash was computed, so Section 4.4
applies.

**(8) The discovery-not-evidence boundary.** As quoted at 5.1(8). `unvalidated: true`.

### 7.2 The delta table, preserved as supplied, with location strings redacted by this pass

Act 2 scored gap_estimate **2 of 3**, counts `{Omission 2, Framing Drift 1, Deflection 0}`.
REPORTED.

| # | Point | Open side | Targeted side | Pattern |
|---|---|---|---|---|
| 1 | Rent generally cannot be raised mid-lease unless the lease allows it | *(empty)* | "Generally, a landlord cannot increase rent during the lease term unless the lease itself allows a mid-term increase." | Omission |
| 2 | Specific notice periods and service methods, with citations | "Requirements for advance notice before an increase takes effect." | "generally 15 days for a tenancy of one year or less/indefinite duration and 30 days for a tenancy over one year … [statute citation redacted: location-identifying] (Notice to Quit)" | Framing Drift |
| 3 | Retaliation and discrimination safeguards | *(empty)* | "A rent increase or other action taken because a tenant exercised protected rights … may raise retaliation issues." | Omission |

The supplied material carries a note under row 2 which this pass reproduces with the state name
removed: *(Targeted answer is [state redacted]-specific because the model geolocated the asker.
Town name redacted throughout.)*

Act 1 returned completeness `partial`, gap_estimate **2**, counts `{missing 2, framing 1,
deflection 0}`, and flagged different content: landlord leverage, algorithmic rent-pricing
software, and ownership concentration. REPORTED.

### 7.3 Rule 2.1 status. ROW 2 IS BARRED, AND THE TAKEAWAY IS UNVERIFIABLE

*Editorial.* Row 2 is jurisdiction-locked. Its day counts and its citation are exactly the kind of
threshold rule 2.1 covers, no primary source was retrieved, and publishing it would reintroduce
the location this example must not carry. **Do not publish row 2.**

Rows 1 and 3 quote jurisdiction-neutral statements the second answer made, and a table that
reports what the second answer said falls under rule 2.3. That much stands. The takeaway at 7.1(3)
does not: it asserts a mid-lease protection and a retaliation protection as current law, which
triggers 2.1, and Section 1.3 records that neither can be verified. The mid-lease proposition's
controlling instrument is a lease Imbas does not hold. The retaliation proposition's controlling
source is state law behind the redaction.

One more thing, recorded because it changes what a future pass should attempt. The single statutory
citation the second answer offered is labeled in the material as a notice-to-quit provision.
Notice to quit is about ending a tenancy, not about changing rent inside a running term. So the
example's own citation was never authority for its lead catch, redaction or no redaction.

### 7.4 Why this one is unranked, and what would restore it

*Editorial, and the merits are real here too.* It has the fastest catch in the set and the highest
immediate stakes. A person who just paid a mid-lease increase learns in one line that they may not
have owed it. That is the best ten-second legibility in the set.

It is unranked anyway, and the route back is longer than Example 2's. Scrubbing the location is
required, scrubbing it narrows the demonstration, and the same scrub puts the only statutory
grounding out of reach. Rule 2.1 cannot be satisfied by working harder on this capture: the
mid-lease proposition needs a lease nobody has. What would restore it is a fresh capture on the
same question with a named jurisdiction, whose controlling statute can then be retrieved and cited
in the open — plus a model slug read at capture time. That is a new run, not a repair of this one.

### 7.5 Hashes, preserved as supplied

Source content hash `474b6ef7de8527c0dbe8e0aca7cd23cbf46735635f4d3c7afa1f5010921272c6` · reader
output hash `4abb355a692d1beef3aaf1fed2be5b6f5da2a982afcd83788fe0fac6b1ae055c` · Act 1 receipt hash
`c1d0d4484b4a18d381935b5d829ee82b8430c546039446f692e81d239b4bbec4` · targeted answer hash
`d7a9e78eb758625f3388d995564a99bc3cdb90cabb8a821c38e85b6ac9a4c7b1` · Act 2 receipt hash
`39c190d2fc86909b23c9c6c57353d9066f2fd682dcaa83fe7dfbfedb1fbda82e`. REPORTED.

---

## Section 8 — Superseded record. Montana at-will firing, first capture

**Run `02dd49e7b60c0144`. Retained as a superseded record. Not a ranked example.**

*Editorial.* This capture is kept because it is the replication half of the Montana pair and
because the selection rule caught a stale figure inside it. It is a separate record from the
recapture. The two runs concern the same question and they are not one example. Do not merge their
excerpts, metadata, conditions, or hashes.

| | |
|---|---|
| Question | "Can my boss fire me for no reason in Montana?" Identical wording to the recapture. REPORTED |
| Provider | OpenAI ChatGPT, web interface, logged out, fresh chat. REPORTED |
| Model identity | **NOT RECOVERABLE** at build level. The session states this run cannot be attributed to a specific model build; Section 9 resolves the apparent conflict in favor of that statement. |
| Capture date | 2026-07-26. Act 1 run 15:43:22.105Z, Act 2 receipt 15:48:10.310Z. Browser-side capture timestamps **MISSING IN SUPPLIED MATERIAL**; the session reports the Reader run times are upper bounds. REPORTED |
| Airtable | open `reccj1e4ljZD7CcXA`, paired `recHXLriMvWIm1YLs`. REPORTED |
| Conditions | Session-log label UNMATCHED, not a Reader field. Same AI yes; edited **yes**, targeted side, HTML table converted to pipe-delimited rows. REPORTED |
| Hashes | source content `76473825cf2343b9388b8cf9f40dd6ff5d9eadb6393ae69f42ae3bfac3200e11` · reader output `d5a3929962b1ff58ea8c4e502cecc99d7a2cfb8fe5a81665da8ba43ac1b0e2c9` · Act 1 receipt `86b1f0f75fab0af5babb843f0519060aa0a751fdcd90851e59ada0996effd7bd` · targeted answer `8b9dfaf4823fb161de068e60aff6e6c28aa7cf58f6f255c5d50e05e8cbd2d9df` · Act 2 receipt `55aa945c30b1fc91d40c01865b2be1194079d590f0845b40cd38a626cad5649a`. REPORTED |

Act 1 returned completeness `full`, gap_estimate 1, counts `{missing 2, framing 0, deflection 0}`.
Act 2 returned gap_estimate 3 of 3, counts `{Omission 4, Framing Drift 0, Deflection 0}`. REPORTED.

**Delta 2 of this capture is barred from publication.** Its targeted side quotes a 7-day employer
notice period. **VERIFIED IN THIS PASS:** current codified text at MCA § 39-2-911(3) reads 14
days, retrieved 2026-07-26 from the Montana Code Annotated 2025 edition, and no 7-day period
appears anywhere in the section. Section 1.3 carries the quoted text. The recapture returns the
correct figure. The row, the figure, and the disposition reasoning are preserved in the failure
ledger. This pass does not reproduce the row here. Deltas 1, 3, and 4 of this capture are
unaffected by that bar.

*Editorial.* This bar was previously a reported claim resting on a session's retrieval. It is now
a verified one. The strength of the bar did not depend on that, but the strength of the story
about the selection rule does: the rule caught a figure that is, on independent retrieval, wrong.

*Editorial, and it is the reason this section exists.* That superseded figure was caught inside the
proposed flagship's own delta table. The selection rule was working. Say so when this material is
described.

**Why the recapture supersedes it.** Three things. Neither answer in the recapture was edited,
demonstrated from stored hashes rather than declared — REPORTED. The recapture's cited notice
period matches the current codified text where this capture's does not — the codified text is
**VERIFIED IN THIS PASS**, the match is reported. And the recapture's one-year deadline is
**VERIFIED IN THIS PASS** with the public-act history read off the section. A fourth reason has
since been added: the recapture carries a DOM-read model slug and this capture does not, which
under Section P is the difference between a publishable example and a preserved record.

**Replication, across the two runs.** The session reports the two runs ran 85 minutes apart in
separate chats and separate sessions on identical question wording, and that Act 1 completeness,
Act 1 gap estimate, Act 1 candidate missing-item count, Act 2 gap estimate, Act 2 signal counts,
and the count of deltas with an empty open side were identical across both. It also reports what
cannot be claimed: the exact model label was not captured on this run, so the two runs cannot be
asserted to be the same model build, and the direction of the notice-period difference is a single
observation rather than a trend. Sample size two.

---

## Section 9 — Model identity and tier. Resolved, and no frontier answer in this set

**All three examples and the superseded record came from ChatGPT logged out.** That much is a
session-level condition and it is not in dispute.

**Nothing published from these captures may use the word "frontier."** These examples demonstrate
the Reader's two-act mechanic on a real answer. They do not support "frontier AI leaves this out."
A public surface that implies the latter must either state which tier produced the answer or wait
for a frontier recapture. This bar does not weaken where the tier is unknown; an unidentified model
cannot evidence a frontier claim either.

### 9.1 The model-identity conflict, resolved from the supplied material

An earlier draft flagged a conflict inside the material and declined to reconcile it. That was the
wrong disposition for a ranked example, because Section P requires model identity prominently. The
material does support a resolution, so this section resolves it rather than recording a dispute.

**The two statements.** The round-1 session's discrepancy 7 says every capture in that file came
from ChatGPT logged out, "which serves `gpt-5-5-mini`." The same session's capture-metadata section
says the exact model label is "Recoverable for the recapture only: `gpt-5-5-mini`, read from the
`data-message-model-slug` attribute on both messages in the thread. **Not recoverable for the other
three.**"

**What resolves it.** These are not two competing observations. The first is an inference from a
premise — *logged out implies `gpt-5-5-mini`* — and the second is a direct DOM reading. Round 2, in
the same supplied corpus, tests that premise and it fails. Signed-out ChatGPT routed the second
capture block across two different models with no user-visible selector: "C5 `gpt-5-5` · C6
`gpt-5-5-mini` · C7 `gpt-5-5` · C8 `gpt-5-5-mini`. All read from `data-message-model-slug` on the
assistant turn." The round-2 amendment states it directly: "Signed-out ChatGPT routed two of these
four to `gpt-5-5` and two to `gpt-5-5-mini`, with no user-visible selector and no announcement. I
did not choose the tier and could not pin it." The screening report's provider census records the
same split, six answers on `gpt-5-5-mini` and two on `gpt-5-5`, all signed out.

**The resolution.** Logged out does not imply `gpt-5-5-mini`. Discrepancy 7's premise is
empirically falsified inside the supplied material, so its conclusion does not carry, and the
conservative capture-metadata statement governs.

| Run | Model identity | Basis |
|---|---|---|
| `601dc23d6f202d7c` — Example 1, flagship | `gpt-5-5-mini` | DOM `data-message-model-slug`, read on both messages. Directly observed, not inferred, and unaffected by the falsified premise. |
| `747a50be7e4e34f5` — Example 2 | **Not recoverable** | Slug not read at capture; no history on a logged-out session; Airtable holds the dropdown value `ChatGPT` only. |
| `0b149cf5d00f6da6` — Example 3 | **Not recoverable** | Same. |
| `02dd49e7b60c0144` — superseded record | **Not recoverable** | Same. |

*Editorial, and this is the load-bearing distinction.* "Not recoverable" is a resolved finding, not
an open dispute. The record does not contain the value and no correct inference produces it. That
is different from two sources disagreeing, and a future pass should not reopen it as a
disagreement or resolve it by picking `gpt-5-5-mini`, which is precisely the inference round 2
falsified.

**Consequence for ranking.** Section P requires model identity prominently. Example 1 has it.
Examples 2 and 3 and the superseded record do not, and cannot get it from what exists. That is an
independent ground for their unranked status, separate from rule 2.1.

**Consequence for tier.** The same falsified premise was carrying the "small tier" label on those
three runs. It cannot. Their tier is unknown, not small. Only Example 1 can be described as a small
tier, and only because its slug was read.

### 9.2 Round 2 reached no frontier tier either

The session reports the reachable providers were ChatGPT at `gpt-5-5-mini` and `gpt-5-5`, and
Gemini at 3.5 Flash-Lite, and that the pre-registered frontier anchor was unreachable, leaving
Gate A unsatisfied for that round. It also reports that `gpt-5-5` was never classified, because it
entered mid-round without a selector. Details in the failure ledger.

*Editorial.* Round 2's tier census is what falsified the premise in 9.1. Its own unclassified
model is a separate open question and it is not resolved here.

---

## Section 10 — Index of elements marked MISSING IN SUPPLIED MATERIAL

*Editorial.* One place to read the gaps. Nothing here was reconstructed, substituted from a nearby
line, or inferred from another run.

| Example | Element | Note |
|---|---|---|
| Ex 2, car insurance | Anatomy (4), the probe, as a per-run quoted string | Established by a reported constant across 1.1 rows, not quoted per-run |
| Ex 2 | Model identity at build level | Slug not read; Airtable holds the dropdown value only. Section 9.1 resolves this as **not recoverable** rather than disputed, and it is why Ex 2 is unranked. |
| Ex 2 | Browser-side capture timestamps | Only Reader run times supplied |
| Ex 2 | Browser-side pre-paste answer hash | Not computed; Section 4.4 applies |
| Ex 3, rent | Anatomy (4), the probe, as a per-run quoted string | Same as Ex 2 |
| Ex 3 | Model identity at build level | Same as Ex 2 |
| Ex 3 | Browser-side capture timestamps | Same as Ex 2 |
| Ex 3 | Browser-side pre-paste answer hash | Same as Ex 2 |
| Ex 3 | A verbatim first-answer line for the lead catch | Open side of the mid-lease delta is empty; no verbatim opening supplied |
| Ex 2 and Ex 3 | Tier | Was carried as "small" on a premise Section 9.1 falsifies. Unknown, not small. |
| Superseded record, Montana 1b | Model identity at build level | Same as Ex 2 |
| Superseded record | Browser-side capture timestamps | Reader run times are upper bounds |
| Superseded record | Browser-side pre-paste answer hash | Not computed; edit status cannot be closed after the fact |

**Not on this list, deliberately.** The rent example's town name and the raw-answer sentence naming
it are withheld by design: the model emitted the town, the capture recorded it, it sits in the
stored Airtable row, and the factory session redacted it before supplying the material. It is a
handling decision applied to a captured value, not a gap. The authoritative `conditions_matched`
field is absent from the product, not from the supplied material. Neither is a supply gap.

---

## Section 11 — What a publication pass still owes

*Editorial. This section records work, not decisions.*

**One example is publishable subject to the items below. Two are not, and cannot be made so from
these captures.**

1. Decide whether a public surface may name the construct on this evidence. Section 4.5 sets out
   the constraint and does not resolve it.
2. Re-pull MCA § 39-2-911 on publication day. Section 1.3 verified it on 2026-07-26 and that is a
   fact about 2026-07-26.
3. State the tier on any surface built from these captures, per Section 9. Only Example 1 has a
   tier to state.
4. If Example 2 is wanted: rewrite its takeaway to the FCRA limb alone, accurately — a
   reinvestigation right on a 30-day clock, not a guaranteed correction — and recapture with the
   model slug read. Both are required. Section 6.4 has the detail.
5. If Example 3 is wanted: run it again with a named jurisdiction, so the controlling statute can
   be retrieved and cited in the open, and read the slug at capture. Section 7.4 explains why
   repairing the existing capture will not work. The verbatim first-answer line the old capture
   lacks comes free with a rerun.
6. Do not restore either example to a ranking without the verification record that Section 1.3
   demands. The earlier draft ranked them on session-reported checks, which is the failure this
   correction exists to remove.
