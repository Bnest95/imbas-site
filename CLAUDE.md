# CLAUDE.md — Imbas Agent Kernel
Operating contract for any AI session touching Imbas. Short by design — context lives in the linked docs. Read STATE.md before anything else.

## Reading order (before any work)
1. **STATE.md** (repo root) — one screen of current truth: what's live, locked numbers, positioning, campaign state. Rewritten in place, never annotated.
2. **The task's ground-truth source.** Grants: Grant Tracker (Airtable `tbllp4STmYOafMWy3`) + `grant-engine/campaign-status.md`, before any web search. Numbers: IMBAS-NUMBERS-LEDGER.md / Notion Numbers Ledger. Positioning: the latest as-submitted application + `grant-engine/ANSWER-BANK.md`.
3. Everything else is reference, and reference goes stale.

## Staleness protocol (the standing failure this section exists to stop)
- Notion pages get updated by prepending UPDATE banners at the header while the body stays stale. **Header banners govern over body text.** Bodies are historical strata — never anchor to them because they are bulky. Weight recency, not volume.
- Local drafts in `grant-engine/applications/` can differ from what was actually submitted. Files named `*-SUBMITTED-*` are the as-submitted snapshots and are positioning ground truth.
- Numbers: the 2026-07-01 standing (50 cases · 37 scored · 500 captures · 4 models) is preserved as a historical governed assertion and is NOT authoritative for current public copy. Its archive-tier figures (50 recorded, 500 captures, 45 held) failed custody reconciliation on 2026-08-23 because their provenance is circular; read the custody-correction banner in IMBAS-NUMBERS-LEDGER.md before quoting any of them. Keep them off living surfaces and put nothing in their place. 5 cases have public pages, and that is the only archive count this tree establishes. The Reader captures runs automatically, with review and publication as separate manual steps. Never revert to the retired 22-scored/331-capture snapshot.
- Retired — never cite in current work: the Hacker News reference · Case 018 PDUFA as lead evidence · v1 1.65-vs-1.17 stats as lead evidence · "case archive" centering · plugin-as-spine · keyword/paste-box detection framing · "Ledger still unlocked / VERIFY every count."
- Precedence when sources disagree: newest as-submitted application > STATE.md > docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md (Workbench product architecture only) > Notion header banners > page bodies > local drafts. Flag the conflict; never silently pick a side.

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
Static site, no build step · two-tier data model (workbench → Repository pool → human-promoted Cases) · email gate only at run-your-own · the paste box leads the workbench, with one flagship example as the quiet secondary (adopted 2026-07-24, docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md Section E, superseding the earlier curated-cases-lead decision) · no called-shot/prediction framing · umber system (bg #2A211E, text #F2E8DC, accent per the styles.css :root --ember token; clay-rose #B46A5A and #A85A4F retired per IMBAS-CANON.md) · signal categories: Omission, Framing Drift, Deflection (formerly Active Foreclosure in v1 docs).
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

## Working tree guard (three incidents wrote this section)
**Startup.** Before you read or edit anything, print `git status --short` and `git rev-parse HEAD`, then run `git diff --quiet` and `git diff --cached --quiet`. If a tracked file changed and the brief did not authorize it, STOP, prove the contents, and report them. Never reset, restore, or discard tracked state you cannot explain. Unexplained state is evidence, not noise.
**Before every destructive step.** Run that same check again immediately before any reset, checkout, merge, rebase, clean, restore, or baseline update. Passing it at startup does not hand you the working tree for the rest of the session.
**No backgrounded state mutation.** Never background `git`, `chmod`, a restore, a baseline update, or any other tree-mutating command and then carry on as though it finished. Capture its completion and its output before you take the next step. When you apply a protective permissions change, log it in-session at the moment you apply it, then revert it or report it before the session ends.
**Attribution discipline.** Report state and evidence. Never attribute unexplained state to an external actor. Attribution needs command-log proof.
**Transcript humility.** Your transcript is not a complete record of your own actions, and auto-compaction is why: it rewrites your context, not the log. Command-level logs govern any dispute about what a session executed — `~/.claude/projects/<encoded-worktree>/<session>.jsonl` records every tool call, append-only. Read it before you claim anything about your own history. Identical author and committer fields prove nothing, because git synthesizes `Brendan <brendan@Brendans-MacBook-Air.local>` from the username and hostname whenever no identity is configured.
**The two proven mechanisms, so you recognize them.**
- A same-second race between `git fetch` moving `origin/master` and worktree provisioning reading it left an index and working tree at the pre-merge tree under a newer HEAD, so an entire merge sat staged as a revert. Prove the index against HEAD before you work: `git write-tree` against `git rev-parse HEAD^{tree}`.
- One session executed its own two commits, its own `chmod -R a-w` over the baseline directory, and its own backgrounded `git restore` while foreground acceptances wrote into that same directory. Compaction cost it those actions, and it reported every one of them as a concurrent external writer. Your own concurrency is the first suspect, not the last.
**Nested worktrees are a standing hazard, and they caused none of the above.** Five session worktrees sit inside `.claude/worktrees/`, git-ignored through `.git/info/exclude` and invisible to `git status` at the main root: 1,840 files and 250MB that any recursive operation rooted at the main checkout reaches, against 372 tracked files in the main worktree. Put session worktrees outside the main worktree's tree where you can, as sibling paths. Where nesting stands, session briefs prohibit recursive operations rooted above a nested worktree.
**Visual variance.** A deterministic render change with a source-identified mechanism and repeatable byte-identical output may enter the per-scenario acceptance protocol, which records the observed frame's hash and proves the committed baseline equals it. A nondeterministic, intermittent, or unexplained render difference is a STOP. Baseline acceptance records exact rendered bytes; it never authorizes a tolerance. Any tolerance, ceiling, bounds, or exception change needs its own governing ruling.
**Renderer identity.** A board run reuses one renderer process across all 62 captures, so a renderer replaced mid-run is invisible unless the harness writes down which process took each frame. Captures made before 2026-08-11 carry no renderer-process identity, and the harness registered no `Inspector.targetCrashed` handler, so nothing in the evidence those runs keep can confirm or rule out a mid-board renderer replacement. The 2026-08-10 `curated-readout--mobile` flicker is unattributable for exactly that reason. When a frame differs and the mechanism turns on renderer lifecycle, name which of two things you are reporting: a mechanism demonstrated in a controlled sequence, or the event that prompted the investigation. They are separate claims and one can stand while the other stays open.
**Environment.** A fresh worktree needs `npm ci` before `npm test`. A missing module in a fresh worktree is an environment failure, not a product failure. Say which one you are reporting.
**Board scope.** The acceptance board photographs the viewport. Below-fold surfaces need execution coverage, not board coverage.

## Data layer (handle like evidence, because it is)
Airtable base `appfxHraqlcpP1AAP` · Cases `tblf7c2RYUolaTVXJ` · Repository `tblyPn1kp4PHbxTWz` · Reader Runs `tblqmHiOCQ5YSXBN3` · Grant Tracker `tbllp4STmYOafMWy3`.
Captures live in TWO fields: main `fldOBDEVMhY1Yvfsy` + overflow `fldds9h5MvtJZeGhu` — **always append overflow before parsing.**
Read captures directly; pattern-matching is never a substitute for reading.
Every quoted claim must trace to a verbatim capture string. Every aggregate must equal its per-run arithmetic and the score field.
Anything failing a check: hold and log in the Discrepancy Log. Never silently fix, never soften — unsupported claims get deleted.

## Lessons (memory)
Store one lesson per file in `/lessons`, one-line summary at top. Record corrections and confirmed approaches only. Don't save what the repo, Notion, or chat history already records.

## Reference docs
STATE.md · VOICE.md · IMBAS-NUMBERS-LEDGER.md · CLAIMS-LEDGER.md · DOCS-LEDGER.md · grant-engine/ (ANSWER-BANK.md · BUDGET-TIERS.md · OBJECTION-CANON.md · campaign-status.md · applications/) · Notion: Numbers Ledger · GRANT-CORE · Reader Agent Spec v3.
AUDIT-2026-07-01.md was listed here as a governing source and is unavailable in this repository. It has never been tracked on any ref. Do not cite it, do not look for it here, and do not name any other artifact as that audit. DOCS-LEDGER.md "MISSING" carries the evidence.
