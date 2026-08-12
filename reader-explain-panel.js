// reader-explain-panel.js — the Inspection Meaning panel's copy table + the pure
// state→copy selection function (Reader v3 EXPLAIN lane, site repo).
//
// One reusable panel — "Why this inspection matters" — renders beside the workbench
// results and translates what the record ALREADY establishes into three short human
// sections: What happened / Why this matters / What you can do next, plus a closing
// archive-boundary block. The copy is DETERMINISTIC, selected from existing
// inspection state; the panel invents no fact.
//
// What you can do next names only controls that rendered. Its clauses are gated on the
// caller's `available` flags (EXPLAIN_AFFORDANCE_KEYS), and the section drops entirely
// when nothing is reachable — the panel would rather say nothing than send someone to
// a panel that is not on the page.
//
// HARD LAW (mission): the panel summarizes only what the record shows. It never
// converts the construct's inference into a product-level fact, never grades, never
// exonerates, and never explains why the model behaved as it did. Absence of
// findings is a record of what was inspected, never a clean bill of health.
//
// RENDER-ONLY INVARIANT (the contents.boundary lesson, made law here): nothing this
// module produces enters the ReviewRecord, the canonical body, the digest, the
// receipt, or any export. It is presentation over existing state. This file assembles
// COPY ONLY — it imports nothing from reader-review-record.js / reader-receipt.js and
// touches no record. A test pins that selecting the panel perturbs no digest and no
// receipt hash (test/reader-explain-panel.test.mjs).
//
// Pure JS by contract, exactly like reader-check-vocab.js / reader-paired.js: no
// node: imports, no DOM — so a Node test exercises selectInspectionMeaning directly,
// and the browser bundle (workbench-app.jsx) imports the same function for the
// InspectionMeaningPanel component. Every string here enters the AT-5 vocabulary lint
// (test/check-vocab-lint.test.mjs) and passes it — pointer register only, never a
// world-claim verdict, never a reliance/defensibility claim.

// The S5 wrapper keys off the SAME one-function rule the side-by-side and the review
// record use (conditions_matched != true), so the panel's unmatched-conditions
// interpretation can never drift from the existing UNMATCHED CONDITIONS callout.
import { pairConditionsUnmatched } from "./reader-paired.js";

// Versioned so a copy result is traceable to the copy that produced it. Bump when the
// copy table or the selection rule changes (never edit a shipped state's meaning in
// place without a bump).
export const EXPLAIN_PANEL_VERSION = "explain-panel.v3";

// The five deterministic states, keyed off existing state:
//   mode       — paired iff the schema pair_runs array is populated (schema §1);
//   findings   — present iff the existing checks/findings array is non-empty;
//   conditions — capture.conditions_matched (paired only), via pairConditionsUnmatched.
// S1 single, no findings · S2 single, findings · S3 paired, no surfaced difference ·
// S4 paired, findings · S5 conditions unmatched/unverified — a WRAPPER over S3 or S4,
// never a replacement.
export const EXPLAIN_STATE_S1 = "S1";
export const EXPLAIN_STATE_S2 = "S2";
export const EXPLAIN_STATE_S3 = "S3";
export const EXPLAIN_STATE_S4 = "S4";
// The two S5 compositions, named exactly as the lane names them. S5 is always a
// wrapper; there is no standalone S5 state_id.
export const EXPLAIN_STATE_S5_S3 = "S5∘S3";
export const EXPLAIN_STATE_S5_S4 = "S5∘S4";

// ── Affordance keys (the What-you-can-do-next gate) ──────────────────────────────
// Every next-step clause names a control the person can actually reach, and each one
// is gated on the render state of the panel that carries that control. The caller
// passes `available` — one boolean per key, derived from the SAME expression that
// gates the panel's mount, so the sentence cannot name a panel that did not render.
//
// The defect this closes (PASS 2B COPY AND OUTPUT QUEUE item 1): S2's next line read
// "Open the checks, copy a verification question into your own AI, or export the
// review record." All three of those controls live inside the Check Register, which
// renders nothing when the both-ends-quotable filter drops every card — a state
// test/inspection-meaning-findings-source.test.mjs pins as reachable in production
// (two surfaced findings, zero cards). S4 carried the same fault permanently: a
// paired inspection produces a delta, never checks, so "Review the checks" pointed at
// a panel that renders in no paired run at all.
//
//   checks       — the Check Register rendered (its cards and their copy control)
//   reviewRecord — the Review Record export control rendered
//   receipt      — the receipt copy/download controls rendered
//   followUp     — the two-question test offer rendered
//   restart      — a run-it-again control rendered
export const EXPLAIN_AFFORDANCE_KEYS = Object.freeze([
  "checks",
  "reviewRecord",
  "receipt",
  "followUp",
  "restart",
]);

// One sentence holds at most three clauses. The per-state lists below are ordered by
// what is worth doing first, and the selector takes the first three that rendered.
const NEXT_MAX_CLAUSES = 3;

// ── The copy table (AT-5 linted; loose voice, pointer register throughout) ────────
// {N} in S2.what is the surfaced-item count; renderCount resolves both the number and
// the plural ("1 item" / "3 items"). Every other template is a fixed string.
//
// next_options replaces the fixed `next` string each state carried through v2. Each
// entry is { requires, clause }: `requires` is one EXPLAIN_AFFORDANCE_KEYS key and
// `clause` is a bare imperative phrase, uncapitalized and unpunctuated, that the
// selector joins into the finished sentence.
export const EXPLAIN_PANEL_UI = {
  heading: "Why this inspection matters",
  section_labels: {
    what: "What happened",
    why: "Why this matters",
    next: "What you can do next",
  },
  states: {
    [EXPLAIN_STATE_S1]: {
      what:
        "The Reader inspected this answer and didn't surface anything that met its bar for a check under the tested conditions.",
      // Cured on the standing rule against denial-by-naming. This line used to read
      // "not a verdict on the answer" and close on "not a clean bill of health" — two
      // denials, the second of which supplies the exact reading it exists to prevent
      // and is the phrase a person carries away. Both propositions survive: what the
      // panel holds is the extent of one inspection, and a null result is a fact about
      // that inspection rather than about the answer. Stated as extent and as what a
      // further run can still do, which is the same information pointing forward.
      why:
        "That's a record of what was inspected under these conditions, and the extent of that inspection is the whole of what it establishes. A different question, a different model, or a closer reading can still surface what this one did not.",
      // A null single read is exactly where the second answer earns its keep, so the
      // two-question test leads. The Check Register cannot render here — S1 means no
      // finding surfaced, and a card is derived from a finding — so it is not listed.
      next_options: [
        { requires: "followUp", clause: "run the two-question test below" },
        { requires: "receipt", clause: "copy the record of this inspection" },
        { requires: "restart", clause: "edit the answer and run it again" },
      ],
    },
    [EXPLAIN_STATE_S2]: {
      what:
        "The inspection surfaced {N} item(s) worth checking before this answer gets used.",
      why:
        "The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",
      // Four options, three slots: when the Check Register drops out, the two clauses
      // that depend on it fall away and the follow-up and the receipt take their place,
      // so the line stays true and never empties.
      next_options: [
        { requires: "checks", clause: "copy a question worth asking into your own AI" },
        { requires: "reviewRecord", clause: "export the review record" },
        { requires: "followUp", clause: "run the two-question test below" },
        { requires: "receipt", clause: "copy the record of this inspection" },
      ],
    },
    [EXPLAIN_STATE_S3]: {
      what:
        "The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",
      // Cured on the standing rule against denial-by-naming. The scope proposition here
      // was always legitimate — a similarity result establishes nothing about what
      // either answer omitted — but it was stated by naming what the comparison does
      // not establish, which puts the completeness question in the reader's head in the
      // Reader's own voice. The proposition is preserved by bounding the comparison to
      // what it did measure and naming the other question as a separate one.
      why:
        "That's a comparison recorded under these conditions, and how the two answers compared is the whole of what it establishes. What either one left out is a separate question.",
      next_options: [
        { requires: "restart", clause: "test another answer with a different question or another model" },
        { requires: "reviewRecord", clause: "export the review record" },
        { requires: "receipt", clause: "copy the record of this inspection" },
      ],
    },
    [EXPLAIN_STATE_S4]: {
      what: "The targeted answer contained material the open answer did not.",
      why:
        "The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",
      next_options: [
        { requires: "reviewRecord", clause: "export the review record" },
        { requires: "receipt", clause: "copy the record of this inspection" },
        { requires: "restart", clause: "test another answer with a different question or another model" },
      ],
    },
  },
  // S5 adds exactly this one line to the Why section (it never replaces the base copy).
  s5_condition_line:
    "The compared answers were produced under unmatched or unverified conditions, so differences may reflect changed conditions rather than response behavior alone.",
  // Mandatory closing element on all five states. This is the canonical Reader boundary
  // line (RECEIPT_BOUNDARY in reader-receipt.js) carried here VERBATIM — the same one
  // sentence that rides the receipt, whitepaper §7, and construct paper §5. It is held
  // byte-for-byte rather than imported: the render-only invariant keeps this file free of
  // reader-receipt.js, exactly as every other surface carries the line by copy, not import.
  // how-it-works.html explains protocol capture, human review, and the reviewed archive —
  // the admission pipeline — so it is the method link's destination (an existing page).
  archive_boundary:
    "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",
  method_link: {
    label: "How admission works",
    href: "/how-it-works.html",
  },
};

// Resolve the {N} count token in S2.what: "{N} item(s)" → "1 item" / "3 items".
// Non-finite/negative counts clamp to 0; templates without the token pass through
// unchanged (so every other state's copy is returned verbatim).
function renderCount(template, n) {
  const k = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
  const phrase = `${k} item${k === 1 ? "" : "s"}`;
  return String(template).replace("{N} item(s)", phrase).replace("{N}", String(k));
}

// Join the surviving clauses into one sentence: "A." / "A or B." / "A, B, or C."
// Capitalizes the first clause and closes with a period; the clauses themselves are
// stored bare so the table never has to spell out every combination.
function joinClauses(clauses) {
  if (clauses.length === 0) return null;
  const body =
    clauses.length === 1
      ? clauses[0]
      : clauses.length === 2
        ? `${clauses[0]} or ${clauses[1]}`
        : `${clauses.slice(0, -1).join(", ")}, or ${clauses[clauses.length - 1]}`;
  return `${body.charAt(0).toUpperCase()}${body.slice(1)}.`;
}

// Build the What-you-can-do-next sentence from the state's ordered options, keeping
// only the clauses whose affordance rendered, capped at NEXT_MAX_CLAUSES. Returns
// null when nothing rendered — the panel then omits the section rather than naming a
// step that leads nowhere. `available` defaults to nothing available, so a caller that
// forgets to declare its affordances loses the section instead of inventing one.
function buildNext(stateId, available) {
  const flags = available && typeof available === "object" ? available : {};
  const clauses = [];
  for (const opt of EXPLAIN_PANEL_UI.states[stateId].next_options) {
    if (clauses.length >= NEXT_MAX_CLAUSES) break;
    if (flags[opt.requires] === true) clauses.push(opt.clause);
  }
  return joinClauses(clauses);
}

// Assemble the render-ready copy for one base state. why is an ARRAY of paragraph
// lines: one for a base state, two when the S5 wrapper appends its condition line
// (the panel renders each line as its own paragraph). next is a sentence or null.
// Nothing here mutates the table.
function buildCopy(stateId, { n, s5, available } = {}) {
  const s = EXPLAIN_PANEL_UI.states[stateId];
  const why = s5 ? [s.why, EXPLAIN_PANEL_UI.s5_condition_line] : [s.why];
  return {
    heading: EXPLAIN_PANEL_UI.heading,
    section_labels: EXPLAIN_PANEL_UI.section_labels,
    what: renderCount(s.what, n),
    why,
    next: buildNext(stateId, available),
    archive_boundary: EXPLAIN_PANEL_UI.archive_boundary,
    method_link: EXPLAIN_PANEL_UI.method_link,
  };
}

// The one pure selection function: existing inspection state → { state_id, copy }.
//   pairRuns         — the schema pair_runs array; paired iff non-empty (schema §1's
//                      designated mode marker). Absent/empty → single mode.
//   findings         — the existing checks (single) or delta_items (paired) array;
//                      findings present iff non-empty. A finite number is accepted as
//                      the count directly. N (S2) is this length.
//   conditionsMatched — capture.conditions_matched (true | false | "unverified");
//                      consulted ONLY in paired mode. The S5 wrapper applies iff
//                      pairConditionsUnmatched keys it (conditions_matched != true),
//                      so it fires exactly when the existing callout fires.
//   available        — one boolean per EXPLAIN_AFFORDANCE_KEYS key, each derived from
//                      the same expression that gates the panel carrying that control.
//                      Only strict true counts. Omitted → no next section at all.
// Deterministic: no time, no randomness, no I/O — identical state in, identical copy
// out. Never throws on missing fields; unknown shapes fall back to the safest state.
export function selectInspectionMeaning({ pairRuns, findings, conditionsMatched, available } = {}) {
  const paired = Array.isArray(pairRuns) && pairRuns.length > 0;
  const count = Array.isArray(findings)
    ? findings.length
    : Number.isFinite(findings)
      ? Math.max(0, Math.trunc(findings))
      : 0;
  const hasFindings = count > 0;

  if (!paired) {
    // Single mode — conditions_matched is not consulted (there is no pair).
    const single = hasFindings ? EXPLAIN_STATE_S2 : EXPLAIN_STATE_S1;
    return { state_id: single, copy: buildCopy(single, { n: count, available }) };
  }

  // Paired mode — S3 (no surfaced difference) or S4 (findings present), wrapped by S5
  // when the conditions did not come through as matched.
  const base = hasFindings ? EXPLAIN_STATE_S4 : EXPLAIN_STATE_S3;
  const s5 = pairConditionsUnmatched({ conditions_matched: conditionsMatched });
  if (!s5) return { state_id: base, copy: buildCopy(base, { n: count, available }) };
  const composed = base === EXPLAIN_STATE_S4 ? EXPLAIN_STATE_S5_S4 : EXPLAIN_STATE_S5_S3;
  return { state_id: composed, copy: buildCopy(base, { n: count, s5: true, available }) };
}
