# IMBAS WORKBENCH ARCHITECTURE v3.1
2026-07-24. Ruling on the Workbench synthesis (three-audit input), four second-order findings integrated, external review corrections folded across v2–v3. Section order: A–L and N doctrine, P public examples, Q execution locks. Canonical path: `docs/IMBAS-WORKBENCH-ARCHITECTURE-v3.1.md`. Governs Workbench product architecture only; CLAUDE.md remains LAW.

**Status: ADOPTED by the founder on 2026-07-24. Governing until amended by a dated founder ruling following implementation evidence or human testing.** The five sessions inform amendments; they do not silently rewrite this document.

**Open operational decisions (recorded, not blockers to adoption):**
- Spend ceiling: OPEN — must be fixed before the Phase 0 capacity-state PR merges.
- Telemetry privacy line: OPEN — must be approved before event transmission ships.
- Capacity-degradation copy: approved as written in Section D.

---

## A. FINAL STRATEGIC VERDICT

**ADOPT WITH AMENDMENTS.** One sentence: **a single Payoff-First Spine — paste an AI answer, get the Reader read as the first payoff, reveal the comparison loop after it (inspection-generated question primary, user chips secondary with a permanent direct door) — plus a distinct, demand-gated Inspection Workspace mode, a designed capacity-degradation state, share permalinks adopted as gated roadmap doctrine, and a public example program that sells through demonstration.**

Confidence: **8/10.** The structure rests on genuine three-lane convergence and one workflow fact — under the current external-AI workflow, the comparison requires a leave-and-return step, so it cannot be Stage 1 (a future integration could change that physics; today it holds). The two points shaved: whether the read alone lands as a payoff with real users, and how much weight the chip path deserves — session-testable hypotheses, not knowable now.

## B. WHAT THE SYNTHESIS GOT RIGHT

Four decisions hold under pressure. **Two depths, not two products** — resolving the dual-flow problem as sequenced stages of one journey dissolves both the comprehension failure and the follow-up split without sacrificing either instrument. **The dead-span discovery** — the professional cue links nowhere, converting the wedge question from "placement" to "creation," which makes scaffold-now/build-on-demand the only defensible ruling. **Boundaries as load-bearing walls** — every shortening move is sequencing or collapsing, never removal of truth language; the 7/7 checks survive the redesign by construction. **Payoff-first as workflow physics, not taste** — the read is the only payoff that doesn't require the user to leave, so making it Stage 1 follows from the shape of the machine as it exists.

## C. WHAT IT GOT WRONG, OVERWEIGHTED, OR UNDERWEIGHTED

**True errors (corrected in this ruling):**
1. **It optimized for the audited visitor, not the arriving one.** The audits start at the paste box; the company's growth loop starts at a shared artifact. Arrival-context (deep links into the right stage of the spine) was parked in Phase 4 when it is the top of the actual funnel.
2. **The cost structure was misread twice — including by this ruling's own v1.** Payoff-first puts a metered path at the front door; but the chip lane's *comparison* is also metered (`/api/read-paired` makes a model call — Lane A receipt, no timeout at :862). Only **instruction generation is free** (frozen bank, client-side). The three-tier cost reality: free instruction → user runs it externally at their own account's cost → **metered automated comparison**. Every capacity-state and "free fallback" claim in v1 that implied a fully free chip loop was wrong and is corrected below.
3. **It adopted the north-star uncritically.** Cross-user loop completion measures the mechanism; the company milestone is the first unprompted professional request. Conflating them lets a healthy funnel mask a failing professions thesis.
4. **It demoted the viral object on audit logic alone.** The receipt that travels comes from a chip, not an inspection. Chips-secondary is right as a default; chips-buried is wrong as a strategy.
5. **Latency is assumed, not measured.** "Payoff-first" is a claim about sequencing that must not smuggle in unmeasured speed claims; the only latency observation on record is ~30s on a paired call. Speed language ("fast," "in seconds") is removed from this doctrine and from external copy until Phase 0 produces the numbers; it may return if the p50 supports it.
6. **The default "ready example" was treated generically.** Chevron/Loper Bright and methodology-shaped cases are the wrong first demonstration for a stranger; the public example program (Section P) governs what a visitor sees first.

**Unresolved hypotheses (session-gated, not errors):** the H1 verb; whether the read alone satisfies; inspect-first vs steer-first user intent.

**Product-truth correction, adopted and binding:** user re-runs of dated receipts do **not** automatically enter any drift corpus or become evidence. They create **user-held records** (or candidate material if separately submitted) — nothing crosses into governed territory without consent, import, review, and admission. All longitudinal copy is written to this rule.

## D. REQUIRED ARCHITECTURE AMENDMENTS

**Phase 0 (add to the queued fix PRs):**
- Latency + unit economics: a sanitized numeric `ms` duration field on `run_completed`, `loop_completed`, and `chip_pair_completed`, inside the existing allowlist discipline; plus server-side per-run operational logging (model, latency, token usage, estimated cost, outcome, fallback state — never user content) sufficient to compute cost per Reader result, cost per completed comparison, cost per completed loop, and timeout/ceiling/fallback frequencies (see Q1).
- Capacity-degradation state, honestly worded: when the Reader is at ceiling, timed out, or down — "**The Reader is at capacity today. You can still generate and run a follow-up in your own AI. Automated comparison may remain unavailable until capacity resets.**" Instruction generation stays available (it is free); the metered comparison waits. Never a dead end, never a false "free" promise.
- Founder sets the spend-ceiling number deliberately (see J) before the capacity-state PR merges; a ceiling trip emits a visible operational event.
- Telemetry privacy line remains a blocking checklist item on the transmit PR.
- Longitudinal comparability verification: confirm every exported receipt permanently carries question, prompts/instructions, model/provider identity, date, instruction version, matched/unmatched status, initiator, and run conditions; if no stable condition fingerprint exists, add one as a small versioned change (see Q4).

**Default journey (Phase 2 — moved up from Phase 4):**
- Arrival-context deep links: a shared artifact, case page, or field note lands the visitor at the relevant stage — chip preselected, or comparison context loaded — so the growth loop and the architecture are the same object.
- Permanent chip direct door (`?start=chips` or equivalent): the follow-up path is never more than one tap deep, and its instruction stage is the capacity-degradation surface.
- Longitudinal receipt line added to the copy table (corrected framing): "This comparison was captured on [date] under the conditions shown. Models change — re-running it later shows what moved. Re-runs are your records; nothing enters the Imbas archive without review."
- **One flagship public example ships with the redesigned default journey** — the "see it work on a ready example" secondary must land on a Section-P-grade demonstration, not a methodology case.
- A quiet post-payoff professional CTA with a content-minimal event, wired to the professional-pull definition (Q3).

**Professional surface (Phase 3):** unchanged — scaffold the entry now, build Workspace v1 after Phase 2 + sessions, or immediately on first genuine professional pull.

**Growth layer (adopted as roadmap doctrine now; build gated):** extend the shipped possession-proof share system to paired comparisons — opt-in permalinks with a crop-safe rendered artifact carrying boundary and conditions in the pixels. **Build gate:** after the redesigned loop passes the five sessions AND at least ten genuine completed comparisons exist — or earlier the moment an external user asks to share. Distribution infrastructure waits for evidence the artifact is worth distributing.
**Share privacy requirements (design law, binding on the eventual build):** explicit opt-in; unguessable tokenized URLs; no raw user content in URL parameters; noindex by default; revocation/deletion; a stated persistence and expiry policy; preview before publishing; a conspicuous personal/confidential-content warning; boundary and conditions rendered inside the artifact itself.

**Guided/demo surface (Phase 4):** the practical example set (Section P slate) plus the guided-case audit — review every current Guided Case; keep only those demonstrating immediate practical value; replace methodology-heavy cases with plain-language, high-legibility examples; the displaced cases live on in the archive, methodology pages, and deeper institutional materials.

**Later roadmap (recorded, not built):** chip-class content/SEO pages (each chip is a named failure class with real search demand); "tell me when this model updates" email hook; a consented import path by which a user may nominate a re-run as candidate material.

## E. DEFAULT PRODUCT RULING

- **Inspection-first: YES.** The read is the default spine.
- **Reader read = first payoff: YES**, measurement detail collapsed, receipt prompted immediately after.
- **Act2 primary, chips secondary: YES** — with the permanent direct door and arrival deep links so the chip path is a first-class citizen reachable in one tap, just not the default's opening move.
- **Reader slow / down / at ceiling:** the capacity-degradation state (D) — instruction generation continues, external running continues, automated comparison honestly deferred. After Phase 0, timeouts resolve to this state instead of a hang. If measured p50 read latency turns out ugly, the first response is tuning (output ceiling, prompt), not architecture reversal.
- **Exact first-load hierarchy:** H1 ("Check your AI answer") → one subcopy line → the paste box → one quiet secondary ("see it work on a ready example →", landing on the Section P flagship) → collapsed "How it works ›" → trust note. Nothing else above the fold.

## F. PROFESSIONAL SURFACE RULING

- **Exists: YES** — currently a promise with no destination; fixed, on a gate.
- **Form:** a mode in the same route (`?mode=workspace`), matching the repo's existing flag pattern. A separate route only if usage later demands it.
- **V1 purpose, one sentence:** repeated, recorded inspection and comparison work with full provenance, for people who inspect regularly.
- **Belongs in v1:** run persistence surfaced as history; prior comparisons kept in view while starting the next; provenance and record export first-class; candidate submission; the real professional entry with the "your name still goes on it" register.
- **Excluded from v1:** teams/seats, saved projects, API access, institutional dashboards, drift-monitoring tooling, billing, and any affordance implying validated output.
- **Record labeling rule:** whenever Workspace outputs are called records, they are explicitly labeled **user-held inspection records** and distinguished from the Imbas evidentiary record. Status labeling, not lexical proximity, carries the boundary.

## G. NAMING VERDICT

**"Inspection Workspace" — 8/10. Adopted as the final working name.** It promises a place, not a verdict; it's on-instrument; it carries zero certification implication. Three strongest alternatives, for the record: **"Advanced Inspection"** (accurate, but reads as more-of-the-same-harder), **"Inspection Desk"** (nice register, weaker on repeated-work connotation), **"Working Records"** (honest about the artifact, but leads with "records" before the status-labeling rule can do its work). The record labeling rule in F governs all Workspace copy.

## H. PUBLIC PRODUCT VS GOVERNED INSTRUMENT — THE SEVEN LAYERS

Operational boundaries, each crossing a named act, never automatic:

1. **Public Reader (inspection)** — metered, provisional, discovery-tier. Output: a read plus a user-keepable receipt.
2. **User-directed follow-up (chips)** — free at the instruction stage, user-attributed; the automated comparison is metered. Imbas supplies the instruction; the user supplies the diagnosis; the record says so.
3. **Shareable comparison artifacts** — opt-in permalinks of layer-1/2 outputs, possession-proof gated, boundary rendered in-pixel, privacy requirements per D. Still user-held, still provisional; sharing changes audience, not status.
4. **Inspection Workspace** — repeated layer-1/2 work with provenance and history. Everything in it is a **user-held inspection record**, labeled as such. Entry copy states: nothing here is admitted evidence.
5. **Public archive cases** — governed, reviewed, published by Imbas. The only layer that speaks with the archive's voice. Public examples (Section P) draw from here or are clearly labeled otherwise.
6. **Candidate material** — anything nominated toward the instrument: user submissions, factory leads, consented re-run imports. Quarantine-tier until reviewed; never described as captured or admitted.
7. **Admitted evidentiary records** — instrument custody only, entered through protocol capture and a recorded human review. No product surface writes here.

The locked sentence — "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review." — is the border guard between layers 1–4 and 5–7, rendered on every product surface and every export.

## I. GROWTH AND RETENTION MODEL

- **Now (with Phase 2):** arrival deep links; the chip direct door; the dated-receipt longitudinal line (retention hook: come back when the model changes — honest, on-thesis, zero engagement mechanics); the flagship public example as the first-load secondary.
- **Adopted now, built on the gate (D):** paired-comparison permalinks on the possession-proof rail with the crop-safe artifact and the privacy requirements. This is the mechanism that turns completed loops into inbound doors — built when ten genuine comparisons exist or a user asks, whichever first.
- **Later:** the Section P example set as the site's standing demonstration layer; chip-class content pages targeting the search demand each named failure class already has ("AI answer doesn't cite sources"); model-update notification hook; consented candidate-import path for re-runs.
- **Never:** streaks, badges, engagement loops, AI-suggested chips (self-attestation's foot in the door), or any share surface that strips the boundary from the artifact.

## J. ECONOMICS AND OPERABILITY

The cost reality, three tiers: **instruction generation is free** (frozen bank, no inference); **the user's external run** costs Imbas nothing; **every automated step is metered** — the read and the comparison, on both doors. There is no fully free loop; there is a free *start* and a metered *finish*. Before any wider-traffic moment, three founder items: **(1) set the ceiling deliberately** — the existing development default is not a launch posture; the right number comes from Q1's unit economics, so the interim number is a conscious placeholder with an alert; **(2) approve the capacity-degradation copy** (D); **(3) approve the telemetry privacy line**. Launch-day failure states, enumerated: ceiling trip → instruction-only mode; model-API outage or hang → same state via the Phase 0 timeout; Airtable capture failure → fail-open with the capture-uncertain notice (already shipped). After Phase 0 lands, the operating dashboard question set is Q1's: median and p95 latency for read and comparison, cost per result, cost per completed loop, completion rate, and trip frequencies — those numbers decide the real ceiling, the model configuration's viability, and whether a faster or cheaper inspector ever earns a test. One Phase 0 documentation item: state the three-tier cost split explicitly in DEPLOY/ops notes so no future session repeats the "free loop" error.

## K. FOUNDER RULINGS — THE SMALLEST SET

1. **Adoption status: COMPLETE.** This ruling was adopted by the founder on 2026-07-24. Human sessions and implementation evidence may trigger dated amendments; they do not reopen adoption automatically.
2. **Spend ceiling posture.** Recommended: set a conscious interim number now; revisit with Q1 data. Alternative: leave the existing development default unchanged. Delay cost: the first traffic spike takes the product dark mid-moment. Sessions first: no.
3. **Telemetry privacy line.** Recommended: approve one honest sentence with the Phase 0 PR. Alternative: stay browser-local. Delay cost: the north-star, latency, and unit economics stay unmeasurable. Sessions first: no.
4. **Growth-layer adoption (permalinks doctrine + gate, chip door, arrival links, Section P program).** Recommended: adopt as roadmap now; build on the gates. Alternative: defer entirely. Delay cost: the loop completes but nothing compounds. Sessions first: no for the ruling; the gates already respect them.
5. **Workspace v1 timing.** Already ruled: gated on Phase 2 + sessions, or first professional pull — whichever comes first. Nothing to decide today.

## L. HUMAN-TEST GATES

The five sessions test exactly these; each has a force-change pattern:
- **5-second comprehension** — support: ≥4/5 say "check/inspect my AI answer" unprompted; force-change: ≤2/5, which reopens the H1 and hero copy, not the spine.
- **Read-as-payoff** — support: ≥3/5 restate a real omission in their own words; force-change: shrugs, which promotes the comparison earlier and shrinks Stage 1.
- **Leave-and-return** — support: ≥3/5 complete a comparison; force-change: ≤1/5 return, which triggers the assisted-return investment ahead of schedule.
- **Refresh pain** — build persistence regardless; sessions only calibrate how loudly the receipt is prompted.
- **Chip attribution** — support: ≥4/5 understand the chips are their choice, not Imbas findings; force-change: confusion, which is a copy emergency, not an architecture change.
- **Inspect vs steer intent** — observational: if most users reach for steering, the chip door gets promoted in the default hierarchy at Phase 5.
- **Share desire** — observational: any unprompted "can I send this to someone" counts toward the permalink build gate.
- **Flagship example legibility** — support: participants shown the ready example explain the catch inside ten seconds; force-change: a replacement example from the P slate.

## N. FINAL ADOPTED ARCHITECTURE — ONE PAGE

**Promise:** paste an AI answer and see what it may have left out — then run one follow-up and compare, side by side, what changed.
**Default route:** /reader (served from /reader.html) — one route, one spine.
**First action:** one paste box under "Check your AI answer"; one quiet secondary ("see it work on a ready example" → the Section P flagship).
**First payoff:** the Reader read — what may be missing, how it was shaped — measurement collapsed, receipt prompted ("Keep this").
**Deep payoff:** the revealed comparison loop — inspection-generated question primary, user chips secondary with a permanent one-tap door — verbatim first/second quotes, matched/unmatched label, locked boundary, receipt as the primary next action.
**Capacity-degradation state:** Reader at ceiling/slow/down → honest copy; instruction generation and external running continue; automated comparison deferred until capacity resets. The product never dead-ends and never falsely promises "free."
**Professional surface:** Inspection Workspace — same route, distinct mode, quiet entry after first payoff plus deep link; v1 gated on sessions or first professional pull; outputs labeled user-held inspection records, stated at entry.
**Share mechanism:** adopted doctrine — opt-in paired-comparison permalinks on the possession-proof rail, crop-safe artifact, full privacy requirement set; built on the demand gate (five sessions + ten genuine comparisons, or first external request).
**Receipt/retention:** dated receipts with the longitudinal line — models change, re-run later to see what moved; re-runs are user-held records unless separately consented, imported, reviewed, admitted.
**Public examples:** the Section P program — one flagship in Phase 2, the practical slate in Phase 4, the ten-second standard as the homepage gate.
**Product-truth boundaries (non-negotiable):** user attribution on chips; matched/unmatched labeling; discovery-not-evidence verbatim everywhere; the second answer never "better/correct/fixed"; initiator distinction end-to-end; the seven-layer model in H; the record labeling rule in F.
**North-star:** cross-user loop completion — a product metric; the company milestone remains the first unprompted professional request, operationalized per Q3.
**Implementation order:** Phase 0 fixes → skeleton → default journey (incl. arrival links, chip door, flagship example, pro-cue event) → Inspection Workspace → guided/demo surface + example set → growth lane on its gate → session-driven refinement.
**Do-not-build:** accounts; AI-suggested chips; engagement mechanics; teams/API/dashboards; permalinks before their gate; a broad new strategy pass; additional naming exploration; new chip classes; any second warm hue; any boundary softening; any share surface that drops the boundary.

## P. PUBLIC EXAMPLE PROGRAM

**Purpose:** make Imbas understandable through concrete before-and-after demonstrations of omissions, unsupported claims, outdated information, hidden assumptions, and avoided questions. Public examples are product demonstrations, not methodology lectures — sales through demonstration. The Volunteer Gap, matched conditions, provenance classes, and governance remain *behind* the example to make it credible; they are never the opening experience. The visitor should think: "that answer really did miss something important."

**The standard, brutal by design:** no example earns homepage space unless a normal person understands the catch in roughly ten seconds and can explain why Imbas was useful. The flagship example is evaluated like hero copy, not like a research case.

**Initial slate:**
- One flagship ready example ships with the redesigned default journey (Phase 2).
- Three to five additional practical examples form the website set (Phase 4).
- One professional workflow example demonstrates how a check becomes a user-held inspection record.
- One silence example demonstrates that Imbas does not invent problems when its named checks find nothing.

**The six public example families** (plain-language versions of the locked practical patterns):
1. **It used an old rule** — a rule, threshold, deadline, or standard that has since changed.
2. **It answered for the wrong place** — a specific jurisdiction asked; a generic or wrong-jurisdiction rule given.
3. **It skipped the exception that changes the answer** — a yes/no that omits a prerequisite, exception, threshold, or condition that materially changes the result.
4. **It made a claim without showing where it came from** — the follow-up produces a source, identifies that none was available, or narrows the claim.
5. **It gave a number without showing the math** — the follow-up makes assumptions, inputs, and arithmetic visible.
6. **It answered an easier question than the one asked** — the follow-up forces the dodge into view.

**Recommended website slate:** Flagship = **"Wrong place, wrong rule"** (family 2) — immediately understandable, visually obvious, common across law, tax, building, employment, benefits, and travel, and it makes the side-by-side payoff feel powerful without explaining the construct. Supporting cards: the rule changed; the missing exception; where did that number come from; show me the source; answer the question I asked.
**Ranking adjudication, explicit:** this public slate ranking (jurisdiction first, for ten-second legibility) is a *different ranking* than the candidate-family research ranking (supersession first, for evidential strength). Both stand at their own layers; neither overwrites the other.

**Required anatomy of every public example:** the user's question; one decisive line from the first answer; the missing item in plain English; the follow-up that surfaced it; one decisive line from the second answer; a one-sentence explanation of why the difference mattered; the matched/unmatched condition label; the discovery-not-evidence boundary. The whole difference fits in one to three short quoted excerpts; no paragraph of background before the catch lands.

**Selection requirements:** a normal visitor understands the issue in ~10 seconds; the missing item visibly affects the recommendation, number, procedure, or conclusion; the change shows in short verbatim quotes; practical value, not trivia; the targeted answer clearly surfaces the item; no dependence on political or ideological interpretation; the page never becomes a model ranking or a claim that the second answer is correct.

**Source order:** (1) strong real examples already present in the published-case corpus or other provenance-clear material already contained in this repository; the instrument repository and its dossier vault are out of scope for Pass 2A; (2) genuine matched captures already available through the permitted in-repo candidate sources; (3) clearly marked synthetic fixtures only where needed to demonstrate interface behavior. Never fabricate a clean before-and-after because it would look good — the factory doctrine governs: engineer the search, never the evidence; ~25 leads → test 10 → retain the 3–5 genuine successes; keep the rejects.

**Guided-case audit (Phase 2/4 implementation requirement):** review every current Guided Case; keep only those demonstrating immediate practical value; move out anything requiring legal history, constitutional/governance framing, a paragraph of setup, or chosen mainly for methodological elegance — those live on in the archive, methodology pages, and deeper institutional materials.

**Audience notes:** for professionals, examples show workflow value (catch a stale rule before advice goes out; catch the wrong jurisdiction before a memo; turn an unsupported claim into a bounded verification task; record exactly what was checked and resolved). For external stakeholders, one example must show three beats: the problem is real (confident answers omit decision-relevant information); the product is legible (Imbas surfaces the miss and generates the next action); the wedge expands (the same mechanism becomes repeated inspection, receipts, records, and an independent longitudinal archive).

**Immediate Pass 2A action, tightly scoped:** one repository/candidate pass to identify the strongest real examples for the six families — the Cowork factory outputs (lead and fixture stages) are the natural input. The goal is not more doctrine; it is five examples that sell Imbas instantly.

## Q. EXECUTION LOCKS

Acceptance safeguards, not strategy. Each binds the implementation briefs.

**Q1 — Unit economics per run (Phase 0).** Server-side operational logging per run: model, latency, token usage, estimated cost, outcome, fallback state — never user content. Standing metrics: median and p95 latency for read and comparison; average cost per Reader result; average cost per completed comparison; completion rate; cost per completed loop; frequency of timeouts, ceiling trips, and fallbacks. These numbers set the real spend ceiling and decide whether the current model configuration is viable.

**Q2 — Visual-state acceptance board (Phases 1–2, binding on briefs).** Before implementation, the required state list is defined and each state ships with a screenshot before merge, desktop and mobile: empty, pasted, loading, Reader result, follow-up, comparison, capacity degradation, restored session, Workspace. Visual acceptance additionally requires: one paste box above the fold; no competing second hero; visibly stronger result hierarchy; true side-by-side comparison on desktop; clean stacking on mobile; clear loading and capacity states; chip label text meets WCAG AA contrast — at least 4.5:1 for normal text and 3:1 only for large text; visible component boundaries and interactive states meet at least 3:1; receipt promoted at the payoff; no removal or visual burial of boundary language. The architecture must produce a visible upgrade, not rearranged code.

**Q3 — Professional pull, operationalized.** Qualifies: an unprompted request, from a person acting in a professional capacity, for Imbas capability in their work — not a compliment, not a prompted answer. Log: source, profession, use case, requested capability, and whether they return. Mechanism: the quiet post-payoff professional CTA plus one content-minimal event; no form above the fold. The milestone flips the Workspace gate.

**Q4 — Longitudinal comparability fields (Phase 0 verification).** Every receipt permanently carries: question, prompts/instructions, model/provider identity, date, instruction version, matched/unmatched status, initiator, and run conditions. If no stable condition fingerprint exists, add one as a small versioned change so dated re-runs are comparable by construction.

**Q5 — One claims-and-metrics ledger.** Extend the repo's existing CLAIMS-LEDGER/NUMBERS-LEDGER discipline to every external number used in external applications, communications, and public materials: claim, exact wording, source, verified date, qualifier, public-safe flag. The tier-labeled set (50 recorded / 37 scored / 500 captures / 4 models / 5 public pages / ~10 testers) is locked in IMBAS-NUMBERS-LEDGER.md; every other document quotes it with that attribution rather than restating it independently, so it cannot drift across applications.

**Q6 — Controlled rollout and adoption measurement (immediately after Phase 2).** Current state: roughly 10 informal testers and real live use. Broader outreach is intentionally sequenced after the redesign so the first impression is spent on a useful product rather than an unfinished workflow. Once Phase 2 ships, run a concentrated external cohort across ordinary users and relevant professionals. Record only the minimum needed to answer: who tried it, what job they brought, whether they reached the Reader payoff, whether they completed the pair, what concrete value they saw, whether they returned, whether they wanted to share, and whether they asked to use Imbas in professional work. Replace rollout intentions in external application and fundraising materials with actual cohort numbers as soon as they exist. Never describe the company as having “zero users” or “no adoption”; distinguish controlled early adoption from scaled adoption and durable retention.

---
*Changelog. v3.1-repo, 2026-07-24: Sections M and O, which carried founder-private positioning material, removed from the repository copy and retained only in the founder's private source; the historical development spend figure removed from J and K2, leaving the ceiling rule without the amount; K1 restated as adoption complete; the pre-submission sequencing sentence removed from N to match the founder's execution decision; title and section-order line updated accordingly; capture count corrected to the ledger-locked 500 with IMBAS-NUMBERS-LEDGER.md attribution. v3.1, 2026-07-24: controlled-rollout posture added to M; Q6 added to preserve the distinction between real early adoption and unproven scaled adoption, and to bind immediate post-Phase-2 cohort measurement. v3, 2026-07-24: speed claims removed doctrine-wide pending Phase 0 measurement ("fast"/"in seconds"/"thirty seconds" to sequencing-only language); moat sentence corrected to preserve the governed-archive vs user-held-record distinction; 18-delta receipt qualified as an early live chip test; Section P (public example program) added: six families, flagship "wrong place wrong rule," ten-second standard, guided-case audit, explicit public-vs-research ranking adjudication; Section Q (five execution locks) added: unit economics, visual-state acceptance board, professional-pull definition, longitudinal comparability fields, claims ledger extension; open operational decisions recorded in the header; do-not-build list extended per external review. v2: capacity-state and cost-tier corrections; audit claim qualified; permalink gate + privacy law; record labeling rule; instrument/Reader split; hash-digest phrasing; doctrine status field. v1 superseded.*
