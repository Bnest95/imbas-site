// What produced this result, and on what basis it claims what it claims.
//
// Two questions a person should be able to answer from the result surface itself,
// without opening the receipt:
//   1. What ran this?              → the provenance strip (describeProvenance)
//   2. What kind of claim is this? → claim-state legibility (describeClaimState)
//
// Both are derived from the canonical result and nothing else. This module never
// normalizes a claim, never writes a field, and never infers one that was not
// recorded — model identity, provider, retrieval state, thread continuity and
// timestamps are read where the record holds them and named as absent otherwise.
//
// Absence is stated, not dropped. A row that disappears reads as "does not apply",
// while the truth is usually "was not recorded", and those are different facts about
// the run. So every field in the strip renders, and an unrecorded one says so in
// words. The one field that genuinely does not apply — the paired method version on a
// single-answer run — is the only one this module omits.
//
// Pure by contract, like reader-receipt.js and reader-check-vocab.js: no node:
// imports, no DOM, no Date.now, no randomness. Every string here is authored copy and
// is covered by the AT-5 vocabulary lint.

import { CLAIM_BASIS, CLAIM_REGISTER, selectSubset } from "./reader-result.js";

export const PROVENANCE_STRIP_VERSION = "provenance-strip.v1";

// ── The provenance strip ─────────────────────────────────────────────────────
//
// Ordered. The first row is the model whose answer was inspected; every row under it
// describes the instrument that inspected it. Those are different subjects and the
// labels have to keep them apart, because the only thing the record knows about the
// first one is what a person typed.
//
// `unknown` is the words that stand in when the field is empty. They are field
// specific on purpose: "not pinned" says something true about a model build that
// "not recorded" would blur, since the call requests a family alias and never
// captures the resolved id.
export const PROVENANCE_FIELDS = Object.freeze([
  Object.freeze({ id: "answer_model", label: "Answer model (as declared)", unknown: "none given" }),
  Object.freeze({ id: "provider", label: "Inspection provider", unknown: "not recorded" }),
  Object.freeze({ id: "inspection_model", label: "Inspection model", unknown: "not recorded" }),
  Object.freeze({ id: "model_build", label: "Inspection model build", unknown: "not pinned" }),
  Object.freeze({ id: "inspection_method_version", label: "Inspection method", unknown: "not recorded" }),
  Object.freeze({
    id: "paired_method_version",
    label: "Paired method",
    unknown: "not recorded",
    paired_only: true,
  }),
  Object.freeze({ id: "captured_at", label: "Captured", unknown: "not recorded" }),
]);

export const PROVENANCE_UI = Object.freeze({
  heading: "What produced this",
  // The standing prohibition in one line: Imbas does not observe which model wrote
  // the answer it read, so the strip says whose word the top row is on.
  declared_note: "The answer model is the one you declared. Imbas records it, and does not observe it.",
});

const trimmed = (v) => (typeof v === "string" ? v.trim() : "");

// The strip for one canonical result. `declaredModel`, `capturedAt` and
// `pairedMethodVersion` come from the caller because they live beside the canonical
// block rather than inside it — the declared model on the receipt's open run, the
// timestamp on the receipt, the paired method version on the paired payload. Nothing
// is defaulted from a neighbouring field: an unsupplied value is unknown, not
// borrowed.
export function describeProvenance({ canonical, declaredModel, capturedAt, pairedMethodVersion } = {}) {
  const c = canonical && typeof canonical === "object" ? canonical : null;
  const surface = c && (c.surface === "single" || c.surface === "paired") ? c.surface : null;
  const values = {
    answer_model: declaredModel,
    provider: c && c.provider,
    inspection_model: c && c.model,
    model_build: c && c.model_snapshot_or_build,
    inspection_method_version: c && c.inspection_method_version,
    paired_method_version: pairedMethodVersion,
    captured_at: capturedAt,
  };
  const fields = [];
  for (const def of PROVENANCE_FIELDS) {
    if (def.paired_only && surface !== "paired") continue;
    const raw = trimmed(values[def.id]);
    fields.push(
      Object.freeze({ id: def.id, label: def.label, value: raw || def.unknown, known: raw !== "" }),
    );
  }
  return Object.freeze({
    version: PROVENANCE_STRIP_VERSION,
    surface,
    fields: Object.freeze(fields),
    complete: fields.every((f) => f.known),
    unknown_count: fields.filter((f) => !f.known).length,
  });
}

// ── Claim-state legibility ───────────────────────────────────────────────────
//
// reader-result.js decides what a paired finding may claim; this decides what a
// person reads about that decision. The register has three things worth telling
// apart, and today's surface tells apart none of them:
//
//   a matched-condition basis  — an authorized record places the pair at like for like
//   an observed-difference basis — the difference stands, the conditions do not carry it
//   an unavailable basis       — there is nothing to read a basis from
//
// The observed-difference row splits four ways by claim_basis, because "you told us
// the conditions" and "nobody recorded the conditions" are different states and a
// single label for both would flatten the one distinction the register exists to
// hold. MATCHED_CONDITIONS is reachable only from AUTHORIZED_MATCHED_BASIS plus a
// MATCHED status, and no live surface supplies an authorized source, so today every
// live paired run lands on OBSERVED_DIFFERENCE_NO_BASIS. The other states are
// reachable by construction and carry copy so the surface is ready when the
// authoritative conditions field lands, not rewritten for it.
export const CLAIM_STATE = Object.freeze({
  MATCHED_CONDITIONS: "MATCHED_CONDITIONS",
  OBSERVED_DIFFERENCE_UNMATCHED: "OBSERVED_DIFFERENCE_UNMATCHED",
  OBSERVED_DIFFERENCE_REPORTED: "OBSERVED_DIFFERENCE_REPORTED",
  OBSERVED_DIFFERENCE_NO_BASIS: "OBSERVED_DIFFERENCE_NO_BASIS",
  OBSERVED_DIFFERENCE_UNRECOGNIZED: "OBSERVED_DIFFERENCE_UNRECOGNIZED",
  NO_CLAIM: "NO_CLAIM",
});

export const CLAIM_STATE_UI = Object.freeze({
  [CLAIM_STATE.MATCHED_CONDITIONS]: Object.freeze({
    label: "Matched conditions",
    support: "An authorized record of the capture conditions places these two answers at like for like.",
  }),
  [CLAIM_STATE.OBSERVED_DIFFERENCE_UNMATCHED]: Object.freeze({
    label: "Observed difference · conditions not matched",
    support: "An authorized record of the capture conditions exists and does not place these two answers at like for like.",
  }),
  [CLAIM_STATE.OBSERVED_DIFFERENCE_REPORTED]: Object.freeze({
    label: "Observed difference · conditions as reported",
    support: "The capture conditions here are the ones you reported. Imbas did not observe them.",
  }),
  [CLAIM_STATE.OBSERVED_DIFFERENCE_NO_BASIS]: Object.freeze({
    label: "Observed difference · conditions not recorded",
    support: "Imbas holds no observed record of the capture conditions, so this difference stands on the two answers alone.",
  }),
  [CLAIM_STATE.OBSERVED_DIFFERENCE_UNRECOGNIZED]: Object.freeze({
    label: "Observed difference · conditions basis unrecognized",
    support: "This run names a conditions source this build does not recognize, so Imbas reads it as no basis at all.",
  }),
  [CLAIM_STATE.NO_CLAIM]: Object.freeze({
    label: "Basis unavailable",
    support: "This pair carries no recorded finding, so there is no conditions basis to read.",
  }),
});

const OBSERVED_BY_BASIS = Object.freeze({
  [CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS]: CLAIM_STATE.OBSERVED_DIFFERENCE_UNMATCHED,
  [CLAIM_BASIS.REPORTED_CLIENT_DECLARATION]: CLAIM_STATE.OBSERVED_DIFFERENCE_REPORTED,
  [CLAIM_BASIS.NO_AUTHORIZED_BASIS]: CLAIM_STATE.OBSERVED_DIFFERENCE_NO_BASIS,
  [CLAIM_BASIS.UNRECOGNIZED_BASIS]: CLAIM_STATE.OBSERVED_DIFFERENCE_UNRECOGNIZED,
});

// One claim triple → one display state. Total over the register: an unregistered
// basis reads as no basis, which is the conservative direction and the same
// direction normalizeClaim already takes.
export function claimStateId({ claim_register, claim_basis } = {}) {
  if (claim_register === CLAIM_REGISTER.MATCHED_CONDITIONS) return CLAIM_STATE.MATCHED_CONDITIONS;
  if (claim_register === CLAIM_REGISTER.OBSERVED_DIFFERENCE) {
    return OBSERVED_BY_BASIS[claim_basis] || CLAIM_STATE.OBSERVED_DIFFERENCE_NO_BASIS;
  }
  return CLAIM_STATE.NO_CLAIM;
}

// The claim state of a whole result, read off recorded_findings rather than a
// surfaced subset: the basis is a property of how the pair was captured, so which
// findings survived the surfacing contract cannot move it. The one live paired
// producer stamps every finding on a run from the same conditions input, so the run
// has one claim state; this reads the first finding that carries one.
//
// Returns null for a single-answer result. The claim register is a paired
// construction — buildFinding leaves the triple null off the paired surface — so a
// single-answer run has no basis to report, and printing "Basis unavailable" under
// every single answer would invent a question the surface never asked.
export function describeClaimState(canonical) {
  const c = canonical && typeof canonical === "object" ? canonical : null;
  if (!c || c.surface !== "paired") return null;
  const bearer = selectSubset(c, "recorded_findings").find((f) => f && f.claim_register) || null;
  const stateId = bearer ? claimStateId(bearer) : CLAIM_STATE.NO_CLAIM;
  const ui = CLAIM_STATE_UI[stateId];
  return Object.freeze({
    state_id: stateId,
    label: ui.label,
    support: ui.support,
    claim_register: bearer ? bearer.claim_register : null,
    claim_basis: bearer ? bearer.claim_basis : null,
    conditions_status: bearer ? bearer.conditions_status : null,
  });
}
