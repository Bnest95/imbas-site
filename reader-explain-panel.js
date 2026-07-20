// reader-explain-panel.js — the Inspection Meaning panel's copy table + the pure
// state→copy selection function (Reader v3 EXPLAIN lane, site repo).
//
// One reusable panel — "Why this inspection matters" — renders beside the workbench
// results and translates what the record ALREADY establishes into three short human
// sections: What happened / Why this matters / What you can do next, plus a closing
// archive-boundary block. The copy is DETERMINISTIC, selected from existing
// inspection state; the panel invents no fact.
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
export const EXPLAIN_PANEL_VERSION = "explain-panel.v2";

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

// ── The copy table (AT-5 linted; loose voice, pointer register throughout) ────────
// {N} in S2.what is the surfaced-item count; renderCount resolves both the number and
// the plural ("1 item" / "3 items"). Every other template is a fixed string.
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
      why:
        "That's a record of what was inspected, not a verdict on the answer. An inspection that surfaces nothing is not a clean bill of health.",
      next:
        "Run the same inspection on a fresh question, or copy the record of this inspection.",
    },
    [EXPLAIN_STATE_S2]: {
      what:
        "The inspection surfaced {N} item(s) worth checking before this answer gets used.",
      why:
        "The checks point to what the answer rests on or where its construction needs verification, with the relevant lines quoted. They point at what to verify; they don't settle the question.",
      next:
        "Open the checks, copy a verification question into your own AI, or export the review record.",
    },
    [EXPLAIN_STATE_S3]: {
      what:
        "The open and targeted answers were materially similar. This inspection did not surface a meaningful difference under the tested conditions.",
      why:
        "That's a comparison recorded under these conditions. It does not establish that nothing was left out.",
      next:
        "Try a different targeted question, run the pair with another model, or export the record.",
    },
    [EXPLAIN_STATE_S4]: {
      what: "The targeted answer contained material the open answer did not.",
      why:
        "The inspection records a difference in what was volunteered under the tested conditions. It does not determine why the difference occurred.",
      next: "Review the checks, run the pair again, or export the review record.",
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

// Assemble the render-ready copy for one base state. why is an ARRAY of paragraph
// lines: one for a base state, two when the S5 wrapper appends its condition line
// (the panel renders each line as its own paragraph). Nothing here mutates the table.
function buildCopy(stateId, { n, s5 } = {}) {
  const s = EXPLAIN_PANEL_UI.states[stateId];
  const why = s5 ? [s.why, EXPLAIN_PANEL_UI.s5_condition_line] : [s.why];
  return {
    heading: EXPLAIN_PANEL_UI.heading,
    section_labels: EXPLAIN_PANEL_UI.section_labels,
    what: renderCount(s.what, n),
    why,
    next: s.next,
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
// Deterministic: no time, no randomness, no I/O — identical state in, identical copy
// out. Never throws on missing fields; unknown shapes fall back to the safest state.
export function selectInspectionMeaning({ pairRuns, findings, conditionsMatched } = {}) {
  const paired = Array.isArray(pairRuns) && pairRuns.length > 0;
  const count = Array.isArray(findings)
    ? findings.length
    : Number.isFinite(findings)
      ? Math.max(0, Math.trunc(findings))
      : 0;
  const hasFindings = count > 0;

  if (!paired) {
    // Single mode — conditions_matched is not consulted (there is no pair).
    if (!hasFindings) return { state_id: EXPLAIN_STATE_S1, copy: buildCopy(EXPLAIN_STATE_S1) };
    return { state_id: EXPLAIN_STATE_S2, copy: buildCopy(EXPLAIN_STATE_S2, { n: count }) };
  }

  // Paired mode — S3 (no surfaced difference) or S4 (findings present), wrapped by S5
  // when the conditions did not come through as matched.
  const base = hasFindings ? EXPLAIN_STATE_S4 : EXPLAIN_STATE_S3;
  const s5 = pairConditionsUnmatched({ conditions_matched: conditionsMatched });
  if (!s5) return { state_id: base, copy: buildCopy(base, { n: count }) };
  const composed = base === EXPLAIN_STATE_S4 ? EXPLAIN_STATE_S5_S4 : EXPLAIN_STATE_S5_S3;
  return { state_id: composed, copy: buildCopy(base, { n: count, s5: true }) };
}
