# CLAUDE.md — Imbas Agent Kernel
Drop this at the repo root. Cursor: reference it from .cursorrules. Cowork: paste at session start. Short by design — context lives in the linked docs; this is the operating contract for any AI session touching Imbas.

## What Imbas is
Imbas builds independent measurement instruments for AI behavior — what frontier systems surface, what they leave out, how they frame it, and how that drifts over time. The Volunteer Gap is the first instrument, not the company. Founder: Brendan Nestor, solo. Human-first organization: nothing ships sounding like AI.

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

## Work protocol
- Open every session: Goal (what + who it's for + what it enables) → Request (one sentence) → Output format → Constraints.
- One spec item per pass. Show the result and the evidence, then stop for review.
- Pause only for: destructive actions, real scope changes, or something only Brendan can provide. Otherwise keep going and report when done.
- Visual work: screenshot before commit.
- Never report done without running the relevant check.

## Data layer (handle like evidence, because it is)
Airtable base `appfxHraqlcpP1AAP` · Cases `tblf7c2RYUolaTVXJ` · Repository `tblyPn1kp4PHbxTWz`.
Captures live in TWO fields: main `fldOBDEVMhY1Yvfsy` + overflow `fldds9h5MvtJZeGhu` — **always append overflow before parsing.**
Read captures directly; pattern-matching is never a substitute for reading.
Every quoted claim must trace to a verbatim capture string. Every aggregate must equal its per-run arithmetic and the score field.
Anything failing a check: hold and log in the Discrepancy Log. Never silently fix, never soften — unsupported claims get deleted.

## Lessons (memory)
Store one lesson per file in `/lessons`, one-line summary at top. Record corrections and confirmed approaches only. Don't save what the repo, Notion, or chat history already records.

## Reference docs
VOICE.md · FOUNDER.md · GRANT-CORE.md · OVERSIGHT-PROTOCOL.md · COWORK-FIXES.md · WORKBENCH-V0.1-SPEC.md · FABLE-SPRINT.md
