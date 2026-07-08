# IMBAS-CANON.md
**Canonical cross-model context. v1.2, verified 2026-07-07 (adds: locked phrases section). Where any other document, Notion page, or model memory conflicts with this file, this file wins — except repository law (CLAUDE.md, PLAYBOOK.md, /docs constitutions), which wins over this file inside its repo.**

## What Imbas is

Imbas is real-time AI accountability infrastructure: multi-surface (consumer plugin, institutional audit, research reference, regulatory citation) powered by one human-validated archive that doubles as AI training corpus. Not a research project, not a static archive, not a single-use tool. The Reader is the live product surface at imbaslabs.com. The Volunteer Gap is the first named behavior it measures: the distance between what a model volunteers on an open prompt and what it surfaces when asked directly, scored 0–3, human-validated. The moat is the archive plus time: every completed recollection cycle raises the cost of recreating the record from scratch, because historical deployed-model behavior cannot be captured retroactively. The institutional product is the registered measurement cohort plus re-measurement contract; the Reader demonstrates the mechanic and drives distribution; the public archive establishes independence and credibility; the instrument provides methodological defensibility.

## The tier rule (binding on every model)

Never state a bare case count. State the tier:

- **v1 study (May 2026):** 13 cases × 4 frontier models (GPT, Claude, Gemini, Grok), human-scored 0–3, methodology public.
- **Public archive claim (locked ledger 2026-07-01):** 50 cases recorded · 500+ captures · 4 frontier models compared · 5 published as full public case records · 45 held.
- **Evidence custody (July 2026):** the original 13-case corpus = 169 captures under content-addressed custody in a versioned instrument repository with a constitutional human-only admission gate; rejected captures retained as method documentation.
- Operational Airtable counts are internal and never quoted publicly.

## Voice and framing law

- Behavior, not intent. Models surface or don't surface things; never assert what they wanted.
- Measurement, not expose or reveal. Specific named mechanism, never "the truth."
- "Across N models on N cases" before any finding.
- Never "AI is biased." Use "these models surface X with frequency Y under condition Z."
- "Prompting is the probe, not the finding" is permanent Imbas language.
- Essay-voice-only terms (never instrument or hero copy): carrying water, shilling, planned/manufactured obsolescence, anti-fluff value prop.
- "Your AI" on reader-facing surfaces only; "frontier AI systems" in instrument and methodology voice.

## Doctrine admission rule

No new doctrine or law document unless it resolves a repeated operational failure or governs a genuinely irreversible claim or evidence decision. The internal machine is sufficient; the bottleneck at day 57 is external collision (funders, pilots, researchers, journalists, readers), not architecture.

## Retired language and superseded decisions

- Cream/editorial-paper aesthetic: superseded by the warm-dark system in styles.css (`:root` tokens are authoritative; any doc quoting other hex values is stale).
- Clay-rose accents (#B46A5A, #A85A4F): retired.
- "Records new public cases daily" and variants: banned (CLAIMS-LEDGER #10). Correct: "The Reader captures runs automatically; review and publication are separate manual steps."
- "30–80% better answers": dropped, unsupported.
- Called-shot/preemptive-prediction Workbench framing: cut.
- LLM judging: excluded from v1 methodology.
- Ghost publication now lives at /field-notes/ (the /briefing path 301-redirects).

## Red lines

1. No automated outreach, replies, posting, or PR under the Imbas name, ever, until an explicit founder decision reverses this. An AI accountability company caught running automated outreach is a company-ending story.
2. Never characterize a measured party's motives or an individual model's intent.
3. Nothing enters the validated evidence tier without a recorded human review event. No machine dispositions in any form.
4. Grant claims use the tier rule and only locked language; every submission gets an as-submitted snapshot.
5. Frozen artifacts are never renamed or rewritten; supersession is by header note or append.
6. Institutional evidence boundary: Imbas produces measurement evidence. Evidence does not self-certify into a control, governance decision, risk acceptance, policy record, or compliance determination; those remain recorded institutional acts.

## Infrastructure map (verified 2026-07-06)

- **Site repo** (`Projects/Imbas`): static site + serverless Reader on Vercel; law in CLAUDE.md, claims in CLAIMS-LEDGER.md; .vercelignore walls *.md, *.jsx, QA, tests, scripts/ from deploy. STATE.md and grant-engine/ are untracked by standing decision ("engines ship, data doesn't").
- **Instrument repo** (`Projects/imbas-instrument`): the evidence instrument. Constitution in /docs (two tiers, five disposition codes, §8 cross-model review, §9 telemetry boundary), decisions log D-001+, watch register, review.py privileged gate, 169 captures in quarantine, registry of frozen prompts. Law: CLAUDE.md, PLAYBOOK.md, .cursorrules, AGENTS.md, GEMINI.md.
- **Airtable** base `appfxHraqlcpP1AAP`: Cases, Repository, Grant Tracker (133 rows), Experience Captures, Reader Runs, Inspection Shares.
- **Ops:** daily founder-ops brief (grant momentum, needs-attention, deadlines: deterministic ISO-only parsing; Deadline cells lead with `DL YYYY-MM-DD`); grant-reconcile with body-free Gmail evidence; token in instrument repo `.env`.
- **Publication:** Ghost at imbaslabs.com/field-notes; Substack "This Might Be True" is personal, separate voice.

## Named entities

- Fable = Claude Fable 5 (this model family). The external adversarial reviewer role is model-named per review; GPT has served in it. Older notes mapping "Fable" to GPT are stale.
- Christine: prospective institutional design partner (regulated bank VP). Her 14-category gap-detection taxonomy independently converging with Imbas's behavioral categories is early market evidence of problem-structure fit, not generic BD; formalizing a scoped paid pilot is on the critical path. The pilot packet is blocked on retrieving her full taxonomy (4 of 14 categories currently on file).


## Locked phrases (verbatim canon)

These are locked. Use them verbatim in Brendan's voice across all surfaces. The content engine, every model, and every session inherit these. The "thinks" phrasing is intentional emotional register (quotes signal the loose sense) and is locked as written.

### Primary voice (the homepage spine)

- **The one-line action:** "Paste an answer. See what surfaced, what was missing, and how it was shaped."
- **The positioning line:** "THE INSPECTION LAYER FOR AI"

**Why Imbas exists:**
- "Every answer shapes what you think, notice, and believe."
- "One answer is marginal. Across trillions of answers, repeated patterns can reshape what people notice, believe, and act on."
- "We study how AI “thinks.” Imbas is the inspection layer for AI, built to capture model answers, examine what they surface, omit, and reframe, and track the patterns that persist or change over time."

**Drift:**
- "A few degrees of drift can change the destination."
- "Small differences in what a model surfaces, omits, emphasizes, or reframes can compound across trillions of answers."
- "Imbas measures the direction and degree of that drift."

**Your experience:**
- "The AI output: not wrong, exactly. But off. Maybe it was managing you instead of answering you."
- "Something important is missing, or weirdly one-sided. It’s hedging like a lawyer instead of being a genuine thought partner."
- "Bring the question and answer to the Reader. Imbas will inspect what surfaced, what was omitted, and how the answer was shaped."

**Ephemeral by default:**
- "The answer appears. You read it. It’s gone."
- "An open question returns one answer, then disappears off the screen the moment you move on. What the model surfaced — and what it left out — leaves no trace. Imbas records it."
- "What the model knows. What it surfaces. What it leaves out. That difference is the Volunteer Gap."
- "The Volunteer Gap is the difference between what a model surfaces on its own and what becomes visible when its answer is inspected more closely. It helps us examine what users see, what was left out, and how the answer may have been shaped."
- "We study how AI “thinks.” Volunteer Gap is the first behavior we measure. As AI systems become more capable, we need to learn how they behave, what patterns persist, and how those behaviors change over time."

**Public interest:**
- "A public record keeps decisions anchored."
- "What gets measured gets better. A public record of what AI surfaces — and what it omits — keeps the decisions built on it anchored to what’s true, instead of drifting with the model."

**For Institutions:**
- "Not another model to trust. A way to check the ones you already use."
- "When AI systems omit important context, shift framing, or drift over time, those patterns can quietly shape decisions."
- "Imbas creates documented, cross-vendor records institutions can monitor, review, and compare as models evolve."

**For Readers:**
- "Not another answer. A way to inspect the one you already got."
- "AI answers feel complete because you only see what surfaced. Imbas shows what appeared, what didn’t, and where the signal narrowed — start in the Workbench, or explore how cases were recorded."

**Compounding record (the moat, in voice):**
- "Why This Compounds"
- "Imbas does not only preserve AI answers. It builds the record that can make the inspection layer smarter."
- "Each Reader run, scored case, null result, reviewer disagreement, rejected case, and raw capture teaches the system something: what real omissions look like, where the Reader overreaches, which patterns repeat across models, and which findings do not survive review."
- "Over time, that validated record can become the training substrate for a specialized inspection agent: not another model to trust, but a system trained to notice what AI answers surface, miss, and reframe."
- The five-stage progression: 1. READER RUNS → 2. SCORED CASES → 3. NULLS + DISAGREEMENTS → 4. VALIDATED RECORD → 5. TRAINED INSPECTION AGENT

**The three explainer links (canonical framing):**
- "On methodology hygiene and prompt design"
- "The Volunteer Gap, explained"
- "Why we measure behavior, not intent"

**The etymology (locked):**
- "Imbas. From the old Irish: illumination, sudden knowing, knowledge brought to speech."

### Supporting taglines (short-form, deck/social/headers)

- "Inspect what AI surfaces — and what it leaves out."
- "Imbas turns invisible AI behavior into a measurable record."
- "No one is capturing this. Imbas does."
- "50 cases recorded · 500+ captures · 4 frontier models compared" (proof strip; tier rule still applies elsewhere)
- "Observing frontier AI behavior"
- "Comparable, citable, and measurable over time."
- "Because AI shapes human judgment."
- The three signal patterns: Omission / Framing Drift / Deflection
- The five method steps: Ask / Inspect / Compare / Measure / Record
- The gap scale: "0 means no meaningful gap. 3 means major information was left out of the open answer."
- The material-gap qualifier: "The gap counts only when the omitted item is material to the open question, not when a narrower prompt simply yields a narrower answer."

### Note on "thinks"

"We study how AI “thinks.”" is locked intentionally. The quotes carry the loose, human sense; the phrase does emotional/stakes work that a sterile "how AI behaves" cannot, and creating human connection is the point of that line. Founder decision (2026-07-07): locked as written, no carve-out needed. The framing law ("behavior not intent") continues to govern measurement claims, findings, and institutional/grant copy — but the homepage stakes register is not a measurement claim and is exempt.


## Notion supersession banner

Live as of 2026-07-06 on the canonical site spec, the Grant Engine spec, and the Reader agent spec:

> **Historical document.** Canonical current state lives in IMBAS-CANON.md (verified 2026-07-06). Where this page conflicts with canon, canon wins. Where canon conflicts with repository law, repository law wins.

## Precedence order, complete

Live source (repo tree, live tables, deployed site) > repository law > this canon > project knowledge files > Notion > any model's memory or prior claims.
