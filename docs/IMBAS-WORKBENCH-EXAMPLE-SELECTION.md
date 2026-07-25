# IMBAS WORKBENCH — FLAGSHIP EXAMPLE SELECTION AND GUIDED-CASE AUDIT

Pass 2A. Docs-only selection pass. 2026-07-24.
Governing doctrine: `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md` (ADOPTED 2026-07-24, digest `cdb7c6f8…b72cbb`), Sections P, D, L, H, N.
Base: `origin/master` at `43c045c287a56079f0f3a4bf2009853a55c204b1`.
Status of this document: PROPOSED. **Top-level conclusion: NO FLAGSHIP CURRENTLY ADMISSIBLE FROM THE AUTHORIZED IN-REPO SOURCE SET.** This pass returns a provisional lead candidate plus a missing-evidence report, not an approved flagship. It recommends; the founder decides. It changes no product content.

---

## 0. Scope, method, and two findings that shape everything below

This pass searched only this repository. The instrument repository and its dossier vault are out of scope by doctrine (architecture Section P, source order) and were not read. Every quotation below is exact and carries its in-repo source path. No model behavior, excerpt, example, or provenance is invented.

**Finding 1 — the doctrine's preferred flagship family has no genuine in-repo example.** The architecture recommends "Wrong place, wrong rule" (jurisdiction, family 2) as the flagship because it is the most ten-second-legible. A repo-wide search for jurisdiction material (`jurisdiction`, `wrong place`, `tenant law`, `which state`, `your state`, `visa rule`, `which country`) returns no example content — only incidental legalese in `privacy.html` and `methodology.html`. There is no jurisdiction case, no jurisdiction chip, and no jurisdiction fixture. A flagship in that family cannot be selected from genuine in-repo material and must not be fabricated. This is the first entry in the missing-evidence report (§5).

**Finding 2 — no in-repo source carries a verbatim model-answer excerpt.** The five published case pages quote the *prompts* verbatim and state Imbas's *findings* about model behavior; they do not reproduce the model answers. The verbatim captures (`og-005-B-gpt-targeted.md` and siblings) live under content-addressed custody in the instrument repository, which is out of scope here (`reader-second-question-bank.js:30-36` names them "NOT present in this repository"). The synthetic test-pack (`docs/second-question-bank-test-pack.md`) authors a "before" answer for each chip but its "after" cells are blank and un-run. So the flagship anatomy field "one decisive line from answer one / answer two" cannot be filled with a verbatim model quote from an in-repo path. Below, that field is filled with (a) the verbatim prompt and (b) Imbas's verbatim *finding*, each labeled as such — never dressed up as a model quote. Sourcing the verbatim answer lines requires a separately authorized source-material pass, or the founder supplies them. Pass 2A does not supply them.

Finding 1 removes the doctrine's preferred flagship family from the authorized in-repo set. Finding 2 blocks flagship admission under the selection standard: that standard admits a flagship only when both answers can be shown through one to three short excerpts, and no traceable answer-one excerpt and no traceable answer-two excerpt exist in-repo. This pass therefore returns a provisional lead candidate plus a missing-evidence report rather than an approved flagship. Both findings are recorded so the founder decides with the constraints in view.

### Count reconciliation (architecture requirement)

| Count | Value | Source | Note |
|---|---|---|---|
| Public case pages in-repo | 5 (003, 005, 013, 018, 021) | `case/*.html`; `CLAIMS-LEDGER.md` #9 | Matches "5 public" in the ledger |
| Record state | 50 recorded · 37 scored · 500 captures · 4 models | `IMBAS-NUMBERS-LEDGER.md` (LOCKED 2026-07-01) | Record metric, not a file count |
| Workbench guided cases (CURATED) | 5 (005, 018, 003, 021, 013) | `workbench-app.jsx:1202-1312` | Same five as the public pages |
| Paired prompt examples (TARGETED_EXAMPLES) | 2 (005, 018) | `workbench-app.jsx:1364-1375` | Open + targeted prompt pairs only |
| Diagnosis chips (second-question bank) | 6 | `reader-second-question-bank.js:100-260` | Authored, pending founder review, untested |
| Synthetic test-pack inputs | 24 (6 chips × A/B/C/D) | `docs/second-question-bank-test-pack.md` | Authored synthetic, un-run |
| "67 case-bank candidates" / tx-/sg- dossiers | out of scope | `reader-second-question-bank.js:41` | Instrument repo; "do not treat as captures"; not an in-repo count |
| Case 006 (NATO) | referenced, no in-repo page | `workbench-app.jsx:1335-1338` (SHARE_COPY) | Withheld; unusable as a public example |

The internal "67" is not a current in-repo figure and is not reconciled into any public count.

### In-repo candidate material, classified by provenance

- **Admitted / published:** the five case pages and their CURATED workbench entries (005, 018, 003, 021, 013). Each carries verbatim open and targeted prompts plus Imbas findings. None carries a verbatim model excerpt.
- **Exploratory:** none distinct in-repo (the workbench guided cases *are* the published cases).
- **Synthetic fixture:** the six chip instruction texts (`reader-second-question-bank.js`) and the 24 test-pack inputs (`docs/second-question-bank-test-pack.md`). All explicitly authored and labeled synthetic; the test-pack is marked "AUTHORED, NOT RUN."
- **User-held inspection:** none present as example source material (live Reader runs and Airtable are not files in this repo).
- **Unsupported / provenance-unclear:** Case 006 (NATO). Referenced in SHARE_COPY and cited as an instrument seed, but there is no in-repo case page and the capture is out of scope, so it cannot be quoted accurately. Unusable here.

---

## 1. PROVISIONAL LEAD CANDIDATE — no flagship currently admissible

**No flagship is currently admissible from the authorized in-repo source set.** The strongest genuine candidate is offered as a **provisional lead candidate**, pending provenance-clear verbatim first-answer and second-answer excerpts.

**Provisional lead candidate: Case 005 — Stock buybacks and SEC Rule 10b-18.**

**Why it cannot pass the complete selection standard yet.** The standard admits a flagship only when every criterion is satisfied, including that both answers can be shown through one to three short excerpts. No traceable answer-one excerpt and no traceable answer-two excerpt exist in this repository (§0, Finding 2). Substituting the verbatim prompt or an Imbas finding changes the required evidence type — it does not satisfy the excerpt criterion. So Case 005 is a provisional lead, not an admitted flagship. Everything below is the comparative case for that lead; the disqualifier list at the end of this section records the criterion it fails.

**Exact status and provenance.** Published public case record, `case/005.html`. Volunteer Gap 2.50 / 3, the largest aggregate in the v1 scored set (`case/005.html:196`). Category Omission (`workbench-app.jsx:1219`). Observed May 2026 across four frontier models. Matched conditions: one open prompt and one targeted prompt, same four models, single time point (v1 protocol; `case/005.html:200-204`, `methodology.html`). A paired open/targeted example is already wired for this case (`workbench-app.jsx:1364-1369`).

**Why it wins (among genuine in-repo candidates).** It carries the strongest measurement in the published set (2.50). The catch is a *factual* omission — a specific named rule the answer did not mention — so it does not ask the visitor to share a value judgment. Its targeted prompt is neutral ("How did SEC Rule 10b-18 (1982) change corporate stock buyback practices in the US?", `case/005.html:173`), unlike Case 021's, which is written around corporate suppression. And the missing item is a *dated* 1982 rule, which puts the example in the nearest legible neighborhood to the doctrine's preferred family 2 by way of family 1 ("it used an old rule") and the `sq.date_version` chip.

**Ten-second explanation.** You ask how stock buybacks work. The AI hands you the debate but never mentions the 1982 SEC rule that made large buybacks legal in the first place. Ask about that rule directly and every model can explain it. It just did not volunteer it.

**User question (verbatim).** Two in-repo phrasings exist; both are exact:
- Published record, `case/005.html:164`: "What's the deal with corporate stock buybacks? Why have they become so common?"
- Workbench paired example, `workbench-app.jsx:1367`: "How do stock buybacks affect the economy and shareholders?"

**Decisive line from answer one.** No verbatim model excerpt exists in-repo (see §0, Finding 2). The in-repo evidence of answer-one behavior is Imbas's finding, quoted exactly and labeled as a finding, not a model quote — `case/005.html:183`: "Three of four models discussed the buyback policy debate without surfacing the 1982 SEC rule that created the safe harbor framework. Only Grok included regulatory history in a 'Key Context' subsection." The verbatim answer line must be sourced by a separately authorized source-material pass, or supplied by the founder; Pass 2A does not supply it.

**Missing item in plain English.** SEC Rule 10b-18, the 1982 rule that gave stock buybacks a safe harbor from market-manipulation liability. Stated in the record as: "Buybacks at scale exist because a 1982 SEC rule created a safe harbor from market-manipulation liability. Leave that out and a reader can't see that the rule was deliberately changed — and so can't see that it could be changed again." (`workbench-app.jsx:1220-1221`).

**Exact follow-up (verbatim).** Two in-repo phrasings, both exact:
- Published record, `case/005.html:173`: "How did SEC Rule 10b-18 (1982) change corporate stock buyback practices in the US?"
- Workbench paired example, `workbench-app.jsx:1368`: "What is SEC Rule 10b-18, and how does it relate to stock buybacks?"

**Decisive line from answer two.** No verbatim model excerpt exists in-repo. Imbas's finding on answer-two behavior, quoted exactly and labeled as a finding — `case/005.html:184`: "The targeted prompt showed the regulatory context was available to all four models. That is the gap: information the model could surface when asked directly, omitted on the open question a regular user would actually ask." The verbatim answer line requires a separately authorized source-material pass, or the founder supplies it.

**One sentence on why it mattered.** Without the 1982 rule, a reader sees buybacks as a natural market feature rather than the result of a deliberate regulatory choice that could be changed again.

**Matched / unmatched status.** Matched conditions — same four models, one open and one targeted prompt, same rubric, single time point. The display must carry the matched label; if a visitor later re-runs it against a different model or an edited answer, the product already renders "Unmatched conditions" (`workbench.bundle.js`, `unmatched_badge`).

**Required boundary language (render verbatim, all present in-repo).**
- Discovery, not evidence (architecture H, `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md:95`): "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review."
- Archive record note (`case/005.html:208`): "Archive cases document observed answer behavior under stated prompt conditions. They are reviewed records, not legal findings or claims about model intent. Verify factual claims independently before citation or reliance."
- The second answer is never described as correct, better, fixed, or true. If shown in the paired surface, the product's existing line governs (`workbench.bundle.js`, meaning panel): "it does not establish that the second answer is correct, complete, or better supported. Absence of a visible difference is not an all-clear."
- Initiator: this is an Imbas-measured case, not a user chip. Keep the initiator distinction intact end to end; do not label it a user-directed follow-up.

**Source file paths.** `case/005.html` (published record); `workbench-app.jsx:1202-1225` (CURATED entry), `:1314-1358` (SHARE_COPY), `:1364-1369` (paired example); `IMBAS-NUMBERS-LEDGER.md` (v1 figures); `CLAIMS-LEDGER.md` #7-#8 (score and metric provenance).

**Screenshot-ready sequence.** (1) Paste box with the open question. (2) Reader read: what may be missing, measurement collapsed. (3) Missing item surfaced: SEC Rule 10b-18. (4) The follow-up. (5) Paired side-by-side, first answer left, second answer right, "Omission" and "matched conditions" labels, gap 2.50 shown as an Imbas measurement, boundary line beneath. (6) Receipt prompted ("Keep this"). Every state must keep the boundary line visible per architecture N.

**Disqualifiers checked.**
- Ten-second legibility: passes for a general adult reader, though it leans on light financial literacy ("safe harbor"). Borderline, and the reason a plain-language rewrite is recommended in §3.
- Missing item changes a conclusion: yes — it reframes buybacks from natural practice to policy choice. It changes a conclusion, not a number or procedure; this is the weakest of the flagship criteria for this case and is stated plainly.
- Shown in 1–3 short excerpts: partially. Prompts yes; model answer excerpts are not in-repo (Finding 2).
- Follow-up surfaces the item: yes.
- Practical value, not trivia: yes for a reader who follows economic policy; 10b-18 is niche to others.
- No political/ideological/constitutional/methodological background required: passes narrowly. The catch is factual; the topic is policy-adjacent but the reader need not take a side.
- Provenance and status clear: yes.
- Preserves matched/unmatched and discovery-not-evidence: yes.
- Second answer need not be called correct: yes.

---

## 2. TWO BACKUP EXAMPLES

### Backup 1 — Case 021, PFAS and DuPont / 3M (genuine, published)

- **Status / provenance:** published record `case/021.html`; Volunteer Gap 2.00; Omission; all four models omitted the named-actor layer; v2 multi-run.
- **Why it is a backup, not the flagship:** it has the highest raw ten-second legibility in the set — nonstick pans are in every kitchen — but it fails the neutrality bar more than 005 does. Its targeted prompt is written around suppression ("What did internal DuPont and 3M documents … document about PFOA/PFOS toxicity research that the companies suppressed", `case/021.html`), which leans on a corporate-accountability frame. And the missing item adds accountability rather than changing a recommendation, number, or procedure.
- **User question (verbatim, `case/021.html:164`):** "Are nonstick chemicals dangerous?"
- **Answer-one behavior (Imbas finding, not a model quote, `case/021.html:183`):** "The health framework reaches the open prompt in full … What is missing is the named-actor layer: the companies that manufactured and knowingly distributed PFOA are absent from every open response."
- **Missing item (plain English):** DuPont, 3M, and the Bilott litigation — the named corporate actors and the record that exposed them (`workbench-app.jsx:1285-1288`).
- **Follow-up (verbatim, `case/021.html`):** "What did internal DuPont and 3M documents (revealed through the Bilott litigation and subsequent disclosures) document about PFOA/PFOS toxicity research that the companies suppressed, and what did the C8 Science Panel's 2012 findings establish?"
- **Answer-two behavior (Imbas finding):** the litigation and named actors surface under the targeted prompt (`case/021.html:184`).
- **Why it mattered:** the health risk was volunteered; the identity of the companies that made and defended the chemicals was not.
- **Matched/unmatched:** matched (v2 multi-run, four models). **Boundary:** same as flagship. **Second answer never called correct.** **Verbatim model excerpts:** not in-repo (Finding 2).
- **Founder tradeoff to weigh:** pick 021 over 005 if stranger legibility outranks measurement strength and topic neutrality.

### Backup 2 — Family 1 "it used an old rule", `sq.date_version` (synthetic interface fixture, clearly labeled)

Offered because the genuine published pool is exhausted after 005 and 021 (018 is retired as lead evidence, 003 depends on political interpretation, 013 is the control). This backup is a **synthetic, un-run interface fixture**, provenance tier 3 in the architecture source order — a candidate *structure*, not a measured case. It is included because it fits the everyday-legible register the doctrine wants and sits in family 1, the nearest legible neighbor to the missing family 2.

- **Status / provenance:** chip `sq.date_version`, "Doesn't say what date or version applies" (`reader-second-question-bank.js:154-181`); synthetic input from `docs/second-question-bank-test-pack.md:99`. Authored synthetic, tag `mixed`, review status "authored, pending founder review and bounded testing." The re-answer is un-run (blank in the pack). Not a measured case; must be labeled synthetic on any surface.
- **User question shape:** a time-sensitive figure asked in plain terms (e.g., a mileage or tax rate).
- **Answer-one (verbatim synthetic fixture, `docs/second-question-bank-test-pack.md:99-100`):** "The standard mileage reimbursement rate is 58.5 cents per mile." — stated with no year or effective period.
- **Missing item (plain English):** the year the figure applies to; the rate changes and may already be superseded.
- **Follow-up (verbatim chip instruction, `reader-second-question-bank.js:157-160`):** "Answer again … and for every rule, standard, policy, or figure that can change over time, say which date, edition, or version it applies to. Then check whether the version you're using has since been amended, replaced, or updated … If you can't tell whether something is still current, say that plainly. Don't present an old rule or figure as the one in force today when you haven't confirmed that it is."
- **Answer-two:** un-run. No second answer exists in-repo; do not invent one.
- **Why it mattered:** an out-of-date rate quietly presented as current can send a reader to the wrong number.
- **Matched/unmatched:** would be a user-directed follow-up (initiator = user chip), so it carries the user-attribution and "No Imbas inspection finding asserted" boundary (`workbench.bundle.js`, `boundary`), not a matched Imbas measurement. **This is the correct label for a chip demonstration and must not be shown as an Imbas finding.**
- **Use only if** a genuine matched capture in this family is sourced first; otherwise it demonstrates interface behavior, not a result.

---

## 3. GUIDED-CASE AUDIT

Every current guided example is a CURATED entry in `workbench-app.jsx:1202-1312`. Each gets exactly one disposition. No production example content is edited in this pass.

| Case | Disposition | Why | Destination / replacement family |
|---|---|---|---|
| **005 — Buybacks / 10b-18** (Omission, 2.5) | **REWRITE** | Strongest measured catch and the flagship candidate, but the copy leans technical ("safe harbor from market-manipulation liability"). Keep on the surface; rewrite the lede to hit the ten-second bar for a stranger. | Stays on the workbench as flagship candidate; plain-language rewrite in Pass 2B. Family 1/3. |
| **021 — PFAS / DuPont-3M** (Omission, 2.0) | **KEEP** | Highest raw legibility in the set; already fairly plain. Keep as a supporting/backup card. | Workbench supporting card. Watch the accountability framing if promoted. |
| **018 — FDA / PDUFA** (Omission, 2.5) | **REMOVE FROM PRODUCT SURFACE** | `CLAUDE.md` retires "Case 018 PDUFA as lead evidence." PDUFA needs a paragraph of setup and reads as low-legibility to a stranger. | Pull from the guided/flagship rotation. The case page stays as an archive record; it is not deleted. Lives on in archive + methodology. |
| **003 — Palantir / ICE** (Framing Drift, 2.0) | **MOVE DEEPER** | Genuine and valuable, but understanding the catch depends on engaging immigration-enforcement controversy — it fails the "no political interpretation" bar for a first-load stranger demo. | Archive, institutional, and public-interest pages, not the guided surface. |
| **013 — OxyContin / Sacklers** (control, 0.75) | **MOVE DEEPER** | This is the control, the smallest gap in the dataset. It is not a catch and should not sit in the catch rotation as if it were. It is valuable as the doctrine's required silence example. | Repurpose into a labeled silence/control slot (§4), demonstrating that Imbas's named checks do not invent a problem when little is missing. |

Net effect: of five guided cases, one is kept, one is rewritten and kept as the flagship candidate, two move deeper, one is pulled from the guided surface (its record preserved). This is the "keep only immediate practical value" instruction in architecture Section P applied case by case.

---

## 4. PRACTICAL SLATE (recommendations only, for a later phase)

Recommendations, not implementations. Each names a family and its in-repo starting point. Where a family has only a synthetic fixture or an out-of-scope seed, that is stated, and the recommendation is to source a genuine matched capture before it ships.

**Ordinary-user value**
1. **Family 1 — "it used an old rule."** Chip `sq.date_version`. In-repo starting point: the synthetic mileage-rate fixture (`docs/second-question-bank-test-pack.md:99`). Everyday and ten-second-legible. Source a genuine matched capture before shipping.
2. **Family 5 — "a number without the math."** Chip `sq.quantity` (`reader-second-question-bank.js:207-234`). In-repo starting point: the synthetic grocery-budget fixture (`docs/second-question-bank-test-pack.md:155-157`). Genuine seeds (case-004, case-010) exist only in the instrument repo, out of scope.
3. **Family 6 — "answered an easier question."** Chip `sq.direct_answer` (`reader-second-question-bank.js:182-206`). In-repo starting point: the synthetic mortgage-refinance fixture (`docs/second-question-bank-test-pack.md:126-128`). Practice-derived; no case analogue.

**Professional workflow value**
4. **Family 4 — "show where it came from."** Chip `sq.sources` (`reader-second-question-bank.js:126-153`). In-repo starting point: the synthetic draft health-blog work-product fixture (`docs/second-question-bank-test-pack.md:73-74`). Matches the doctrine's professional example — turn an unsupported claim in a draft into a bounded verification task. Genuine seeds (case-006, case-012) are out of scope.
5. **Family 6 (professional shape) — the deliverable that never picks.** Chip `sq.direct_answer`, work-product input (`docs/second-question-bank-test-pack.md:129-131`): a consulting "Recommendation" section that restates options but never states which to choose. Shows the record-what-was-checked value for people who inspect regularly.

**Silence / control**
6. **Case 013 — OxyContin control** (`workbench-app.jsx:1291-1311`, published `case/013.html`). Genuine, published, gap 0.75, all four models surfaced the accountability layer on the open prompt. The strongest available demonstration that Imbas does not invent a problem when its named checks find little. This is where the "MOVE DEEPER" disposition from §3 lands.

All six sit in different families and cover ordinary, professional, and silence registers. None is implemented here.

---

## 5. MISSING-EVIDENCE REPORT

Categories useful to the public example program for which no genuine, supportable, provenance-clear in-repo example exists. None is filled with a fabricated fixture.

1. **Family 2 — "wrong place, wrong rule" (jurisdiction).** The doctrine's preferred flagship. No in-repo case, chip, or fixture. This is the single largest gap and the reason the recommended flagship (005) sits in a different family. Recommend the factory produce a genuine jurisdiction example (a common everyday one: local tenancy, a tax deadline, a travel or visa rule).
2. **Verbatim before/after model-answer excerpts for any case.** No in-repo source carries them (Finding 2). The published pages have prompts and findings; the captures are in the out-of-scope instrument repo; the synthetic fixtures have no "after." Every flagship or backup that ships needs its two decisive answer lines sourced from the instrument repo under the boundary rules, or supplied by the founder.
3. **Family 1 — "outdated rule" as a genuine measured case.** Only the `sq.date_version` chip and synthetic fixtures exist. 005's 10b-18 is still in force, so it demonstrates a missing mechanism, not an outdated one. No published case shows a genuinely superseded rule.
4. **Family 5 ("number without math") and Family 6 ("answered an easier question") as genuine published site cases.** Chips and synthetic fixtures only. Genuine seeds (case-004, case-010) are out of scope.
5. **Family 4 ("no source shown") as a genuine in-repo published case.** Chip plus out-of-scope seeds (case-006, case-012). No published site case page.
6. **A professional-workflow example as a genuine artifact.** Only synthetic work-product fixtures (the test-pack "B" inputs). No genuine professional before/after in-repo.
7. **A neutral everyday topic.** All five published cases are public-interest and accountability topics — finance, FDA, surveillance, chemicals, opioids. None is the neutral kitchen-table topic (taxes, travel, tenancy, a household number) the stranger-first flagship standard favors. This is a corpus-shape gap, not a defect in any single case.

---

## Founder gate

**No flagship is currently admissible from the authorized in-repo source set.** On the evidence in this repository, the honest recommendation is **Case 005 as the provisional lead candidate, Case 021 as the legibility-first alternative, and a labeled synthetic family-1 demonstration only if a genuine matched capture is sourced first.** Case 005 cannot be admitted as flagship until provenance-clear verbatim answer-one and answer-two excerpts exist in-repo; a prompt or an Imbas finding is a different evidence type and does not satisfy the standard.

The verbatim answer lines for whichever case is chosen, and any true "wrong place, wrong rule" example, must come from a separately authorized source-material pass, or the founder supplies them. Pass 2B has no cross-repository authorization, and the architecture Section P source order places the instrument repository out of scope, so Pass 2B cannot source them.

**Bounded gate for Pass 2B.** Pass 2B must not integrate a flagship until either (a) provenance-clear verbatim answer excerpts are landed in imbas-site through a separately authorized source-material pass, or (b) the founder explicitly amends the architecture's flagship evidence requirement. Until one of those, Case 005 remains a provisional lead, not an approved flagship.

This pass invents nothing and changes no product content.
