// reader-candidate-intake.js — CandidateSubmission dark-intake guard
// (schema §CandidateSubmission; AT-8).
//
// The CandidateSubmission object is schema-only in v1: runtime DARK. There is no
// write path that admits a candidate into custody. This module IS the pinned dark
// default — the one entry point that would ever admit a candidate throws on every
// call, because no activation decision exists to open it.
//
// The schema is explicit: "no write path activates until a separate, dated founder
// decision expressly authorizes governed candidate intake and names the permitted
// source surface, required consent, custody destination, provenance fields, human
// review boundary, and retention/deletion rule; absent activation_decision_id the
// write path throws." D-033 (downstream corpus eligibility) and D-034 (financial
// independence) are recorded but do NOT authorize intake and are not this gate.
//
// Pure JS by contract: no node: imports, no DOM — a Node test exercises it
// directly. It has no caller in the product; its only consumer is the AT-8
// guardrail test, which pins that intake stays dark.

// The constant admission status while intake is dark.
export const ADMISSION_STATUS_DARK = "none";
export const CANDIDATE_INTAKE_DARK = true;

// The six things a dated founder intake-activation decision MUST name before any
// write path opens (schema §CandidateSubmission). A decision missing any of these
// does not activate intake.
export const REQUIRED_ACTIVATION_FIELDS = Object.freeze([
  "permitted_source_surface",
  "required_consent",
  "custody_destination",
  "provenance_fields",
  "human_review_boundary",
  "retention_deletion_rule",
]);

// Decisions that explicitly do NOT authorize candidate intake. Referencing one of
// these must not open the write path (schema §CandidateSubmission: "D-033 and D-034
// do NOT authorize intake and are not this gate").
export const NON_ACTIVATING_DECISIONS = new Set(["D-033", "D-034"]);

// Registry of dated founder intake-activation decisions. EMPTY in v1 — no such
// decision exists, and this schema does not invent one. A real decision, when made,
// is registered here as:
//   { id, dated: "YYYY-MM-DD", permitted_source_surface, required_consent,
//     custody_destination, provenance_fields, human_review_boundary,
//     retention_deletion_rule }
// Frozen so the dark default cannot be mutated at runtime.
export const ACTIVATION_DECISIONS = Object.freeze({});

export class CandidateIntakeError extends Error {
  constructor(message) {
    super(message);
    this.name = "CandidateIntakeError";
  }
}

// Is the referenced decision a valid, dated intake-activation decision that names
// all six governance fields? False for a missing id, a non-activating decision
// (D-033/D-034), an unregistered id, or a decision missing any required field.
export function isActivationDecisionValid(id) {
  if (!id || typeof id !== "string") return false;
  if (NON_ACTIVATING_DECISIONS.has(id)) return false;
  const decision = ACTIVATION_DECISIONS[id];
  if (!decision || typeof decision !== "object") return false;
  if (!decision.dated) return false;
  for (const field of REQUIRED_ACTIVATION_FIELDS) {
    if (!decision[field]) return false;
  }
  return true;
}

// The only write path CandidateSubmission would ever have. It THROWS in v1 — no
// activation decision exists, so no candidate is ever admitted. This is the
// guardrail AT-8 pins: absent (or invalid) activation_decision_id → throws.
export function writeCandidateSubmission(submission, options = {}) {
  const activationDecisionId = options.activation_decision_id ?? options.activationDecisionId ?? null;

  if (!activationDecisionId) {
    throw new CandidateIntakeError(
      "CandidateSubmission intake is dark: no activation_decision_id supplied. A dated founder " +
        "intake-activation decision is required before any candidate is admitted.",
    );
  }
  if (NON_ACTIVATING_DECISIONS.has(activationDecisionId)) {
    throw new CandidateIntakeError(
      `Decision ${activationDecisionId} does not authorize candidate intake — D-033/D-034 are ` +
        "recorded but are not the intake-activation gate.",
    );
  }
  if (!isActivationDecisionValid(activationDecisionId)) {
    throw new CandidateIntakeError(
      `No registered intake-activation decision "${activationDecisionId}". Intake stays dark until a ` +
        "dated founder decision naming all six governance fields is recorded.",
    );
  }
  // Unreachable in v1 (registry is empty). Present so that registering a decision
  // without also building the governed custody path fails loudly instead of
  // silently no-op'ing a real submission.
  throw new CandidateIntakeError(
    "CandidateSubmission custody write path is not implemented in v1; activation may be recorded " +
      "but no governed custody destination exists yet.",
  );
}

// The dark default as a readable value — lets a caller observe the state without
// triggering the throw. admission_status is always the dark constant "none".
export function candidateIntakeStatus() {
  return {
    dark: CANDIDATE_INTAKE_DARK,
    admission_status: ADMISSION_STATUS_DARK,
    activation_decisions: Object.keys(ACTIVATION_DECISIONS),
  };
}
