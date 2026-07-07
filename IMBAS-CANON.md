# IMBAS-CANON.md
**Canonical cross-model context. v1.1, verified 2026-07-06 (adds: institutional product definition, institutional evidence boundary). Where any other document, Notion page, or model memory conflicts with this file, this file wins — except repository law (CLAUDE.md, PLAYBOOK.md, /docs constitutions), which wins over this file inside its repo.**

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

## Notion supersession banner

Live as of 2026-07-06 on the canonical site spec, the Grant Engine spec, and the Reader agent spec:

> **Historical document.** Canonical current state lives in IMBAS-CANON.md (verified 2026-07-06). Where this page conflicts with canon, canon wins. Where canon conflicts with repository law, repository law wins.

## Precedence order, complete

Live source (repo tree, live tables, deployed site) > repository law > this canon > project knowledge files > Notion > any model's memory or prior claims.
