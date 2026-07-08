# CLAUDE.md — Imbas Agent Kernel
Operating contract for any AI session touching Imbas. Short by design — context lives in the linked docs. Read STATE.md before anything else.

## Reading order (before any work)
1. **STATE.md** (repo root) — one screen of current truth: what's live, locked numbers, positioning, campaign state. Rewritten in place, never annotated.
2. **The task's ground-truth source.** Grants: Grant Tracker (Airtable `tbllp4STmYOafMWy3`) + `grant-engine/campaign-status.md`, before any web search. Numbers: IMBAS-NUMBERS-LEDGER.md / Notion Numbers Ledger. Positioning: the latest as-submitted application + `grant-engine/ANSWER-BANK.md`.
3. Everything else is reference, and reference goes stale.

## Staleness protocol (the standing failure this section exists to stop)
- Notion pages get updated by prepending UPDATE banners at the header while the body stays stale. **Header banners govern over body text.** Bodies are historical strata — never anchor to them because they are bulky. Weight recency, not volume.
- Local drafts in `grant-engine/applications/` can differ from what was actually submitted. Files named `*-SUBMITTED-*` are the as-submitted snapshots and are positioning ground truth.
- Numbers are LOCKED to the Numbers Ledger: 50 cases · 37 scored · 500 captures · 4 models (2026-07-01); the Reader captures runs automatically, with review and publication as separate manual steps. Never revert to the retired 22-scored/331-capture snapshot.
- Retired — never cite in current work: the Hacker News reference · Case 018 PDUFA as lead evidence · v1 1.65-vs-1.17 stats as lead evidence · "case archive" centering · plugin-as-spine · keyword/paste-box detection framing · "Ledger still unlocked / VERIFY every count."
- Precedence when sources disagree: newest as-submitted application > STATE.md > Notion header banners > page bodies > local drafts. Flag the conflict; never silently pick a side.

## What Imbas is
Imbas is the inspection layer for AI answers: an independent instrument that measures what frontier systems surface, what they leave out, how they frame it, and how that drifts over time. The live Reader (imbaslabs.com) lets anyone point at their own AI answer and see what it left out, and records every public run into the pipeline; behind it sits a human-scored archive that turns those observations into an independent record no single lab owns. The record compounds toward a specialized inspection agent, later a real-time copilot — upside, not the pitch. Newest register (Longview, 2026-07): independent situation monitoring of the AI-mediated information environment. Core thesis: AI answers are becoming the interface between people and reality, and Imbas gives people intellectual sovereignty over that interface. Canonical frame (2026-07-03): the longitudinal inspection and measurement of observable AI behavior — plain register: we study how AI "thinks." The Volunteer Gap is the first behavior measured — the wedge, not the company boundary; never define Imbas as merely an omission detector, bias checker, prompt-comparison tool, fact-checker, transparency dashboard, or "the Volunteer Gap company." Founder: Brendan Nestor, solo — cross-disciplinary founder building AI measurement and inspection infrastructure; never "non-technical founder" ("first non-technical hire" is a historical Velvet fact only); built Imbas from zero in ~53 days alongside unrelated paid work. Human-first organization: nothing ships sounding like AI.

## Non-negotiable framing (all public surfaces)
- Behavior, not intent. No motive verbs about models — models surface or don't surface; they don't "want," "try," or "hide."
- Measurement, not expose/reveal/unmask.
- Sample size before findings: "across N models on N cases."
- Never "AI is biased." State frequency under condition.
- Signal, not verdict. Imbas opens the door; the reader decides.

## Voice
Read VOICE.md before touching any copy. Change only the broken thing. His words over yours. Every sentence has a subject. Banned: agentless passive, hedge-stacking, delve/landscape/tapestry/robust/seamless/journey, em-dash flooding, "it's important to note," over-chopped fragments.

## Locked decisions (do not relitigate)
Static site, no build step · two-tier data model (workbench → Repository pool → human-promoted Cases) · email gate only at run-your-own · curated cases lead the workbench · no called-shot/prediction framing · umber system (bg #2A211E, text #F2E8DC, accent #B46A5A) · signal categories: Omission, Framing Drift, Deflection (formerly Active Foreclosure in v1 docs).
Document pages (papers, whitepaper, future reports) use the document masthead pattern per whitepaper.html: mono eyebrow, Fraunces H1, serif lede, dot-separated meta, italic register notes; plain-terms asides use the ember-bordered callout.

## Grant work rules
- `grant-engine/ANSWER-BANK.md` is the canonical answer set; start there and tailor to the funder's register. `BUDGET-TIERS.md` governs budgets. `OBJECTION-CANON.md` governs objections. GRANT-CORE (Notion) is the master narrative, rebuilt 2026-07-02 from the as-submitted applications.
- Brendan submits every application himself. Harvest-greedy, draft-tight. Red-team gate ≥8/10 before a draft is submit-ready.
- Snapshot every as-submitted application into `grant-engine/applications/` as `name-SUBMITTED-YYYY-MM-DD.md`.
- The inbox watch surfaces funder replies and never sends anything.

## Work protocol
- Open every session: Goal (what + who it's for + what it enables) → Request (one sentence) → Output format → Constraints.
- One spec item per pass. Show the result and the evidence, then stop for review.
- Pause only for: destructive actions, real scope changes, or something only Brendan can provide. Otherwise keep going and report when done.
- Visual work: screenshot before commit.
- Never report done without running the relevant check.

## Data layer (handle like evidence, because it is)
Airtable base `appfxHraqlcpP1AAP` · Cases `tblf7c2RYUolaTVXJ` · Repository `tblyPn1kp4PHbxTWz` · Reader Runs `tblqmHiOCQ5YSXBN3` · Grant Tracker `tbllp4STmYOafMWy3`.
Captures live in TWO fields: main `fldOBDEVMhY1Yvfsy` + overflow `fldds9h5MvtJZeGhu` — **always append overflow before parsing.**
Read captures directly; pattern-matching is never a substitute for reading.
Every quoted claim must trace to a verbatim capture string. Every aggregate must equal its per-run arithmetic and the score field.
Anything failing a check: hold and log in the Discrepancy Log. Never silently fix, never soften — unsupported claims get deleted.

## Lessons (memory)
Store one lesson per file in `/lessons`, one-line summary at top. Record corrections and confirmed approaches only. Don't save what the repo, Notion, or chat history already records.

## Reference docs
STATE.md · VOICE.md · IMBAS-NUMBERS-LEDGER.md · AUDIT-2026-07-01.md · grant-engine/ (ANSWER-BANK.md · BUDGET-TIERS.md · OBJECTION-CANON.md · campaign-status.md · applications/) · Notion: Numbers Ledger · GRANT-CORE · Reader Agent Spec v3.
