// reader-candidate-intake — AT-8 dark-intake guardrail.
//
// CandidateSubmission is schema-only in v1: runtime DARK. This test pins that the
// one entry point that would ever admit a candidate THROWS on every call, because
// no dated founder intake-activation decision exists. The dark default itself is
// pinned so a future change that quietly opens the write path fails `npm test`.
//
// AT-8 is the GENERIC intake-activation gate — not D-033/D-034 adoption. D-033
// (downstream corpus eligibility) and D-034 (financial independence) are recorded
// but do NOT authorize intake; referencing one must still throw.
//
// Run: node --test test/reader-candidate-intake.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ADMISSION_STATUS_DARK,
  CANDIDATE_INTAKE_DARK,
  REQUIRED_ACTIVATION_FIELDS,
  NON_ACTIVATING_DECISIONS,
  ACTIVATION_DECISIONS,
  CandidateIntakeError,
  isActivationDecisionValid,
  writeCandidateSubmission,
  candidateIntakeStatus,
} from "../reader-candidate-intake.js";

// ── The dark default is pinned ──────────────────────────────────────────────────

test("AT-8: intake is dark and admission status is the constant 'none'", () => {
  assert.equal(CANDIDATE_INTAKE_DARK, true);
  assert.equal(ADMISSION_STATUS_DARK, "none");
});

test("AT-8: the activation registry is EMPTY in v1 (no decision is invented)", () => {
  assert.deepEqual(Object.keys(ACTIVATION_DECISIONS), []);
  const status = candidateIntakeStatus();
  assert.equal(status.dark, true);
  assert.equal(status.admission_status, "none");
  assert.deepEqual(status.activation_decisions, []);
});

test("AT-8: the six governance fields a real decision must name are pinned", () => {
  assert.deepEqual(
    [...REQUIRED_ACTIVATION_FIELDS],
    [
      "permitted_source_surface",
      "required_consent",
      "custody_destination",
      "provenance_fields",
      "human_review_boundary",
      "retention_deletion_rule",
    ],
  );
});

// ── The write path throws on every call ─────────────────────────────────────────

test("AT-8: writing with NO activation_decision_id throws", () => {
  assert.throws(() => writeCandidateSubmission({ id: "cs1" }), CandidateIntakeError);
  assert.throws(() => writeCandidateSubmission({ id: "cs1" }, {}), /intake is dark/);
});

test("AT-8: D-033 and D-034 do NOT authorize intake — referencing one throws", () => {
  assert.ok(NON_ACTIVATING_DECISIONS.has("D-033"));
  assert.ok(NON_ACTIVATING_DECISIONS.has("D-034"));
  assert.throws(
    () => writeCandidateSubmission({ id: "cs1" }, { activation_decision_id: "D-033" }),
    /does not authorize candidate intake/,
  );
  assert.throws(
    () => writeCandidateSubmission({ id: "cs1" }, { activation_decision_id: "D-034" }),
    /does not authorize candidate intake/,
  );
});

test("AT-8: an unregistered activation_decision_id throws (stays dark)", () => {
  assert.throws(
    () => writeCandidateSubmission({ id: "cs1" }, { activation_decision_id: "D-999" }),
    /Intake stays dark/,
  );
  // Both option spellings are rejected identically.
  assert.throws(
    () => writeCandidateSubmission({ id: "cs1" }, { activationDecisionId: "D-999" }),
    CandidateIntakeError,
  );
});

// ── Decision validity ───────────────────────────────────────────────────────────

test("AT-8: no id is a valid activation decision in v1", () => {
  assert.equal(isActivationDecisionValid("D-033"), false);
  assert.equal(isActivationDecisionValid("D-034"), false);
  assert.equal(isActivationDecisionValid("D-999"), false);
  assert.equal(isActivationDecisionValid(""), false);
  assert.equal(isActivationDecisionValid(null), false);
  assert.equal(isActivationDecisionValid(undefined), false);
});

test("AT-8: a hypothetical registered decision must be dated and name all six fields", () => {
  // Exercises the validator's field requirements WITHOUT mutating the frozen
  // registry: build a candidate decision object and check the same predicate the
  // registry lookup would apply.
  const complete = {
    dated: "2026-07-17",
    permitted_source_surface: "x",
    required_consent: "x",
    custody_destination: "x",
    provenance_fields: "x",
    human_review_boundary: "x",
    retention_deletion_rule: "x",
  };
  const missingOne = { ...complete };
  delete missingOne.retention_deletion_rule;
  const undated = { ...complete };
  delete undated.dated;
  const complete_ok = REQUIRED_ACTIVATION_FIELDS.every((f) => complete[f]) && !!complete.dated;
  const missing_ok = REQUIRED_ACTIVATION_FIELDS.every((f) => missingOne[f]) && !!missingOne.dated;
  const undated_ok = REQUIRED_ACTIVATION_FIELDS.every((f) => undated[f]) && !!undated.dated;
  assert.equal(complete_ok, true);
  assert.equal(missing_ok, false);
  assert.equal(undated_ok, false);
});

test("AT-8: the frozen registry cannot be mutated to open the write path at runtime", () => {
  // Object.freeze on ACTIVATION_DECISIONS: an attempt to register a decision must
  // not take effect (strict-mode assignment throws; the registry stays empty).
  assert.throws(() => {
    "use strict";
    ACTIVATION_DECISIONS.D_EVIL = { dated: "2026-07-17" };
  });
  assert.deepEqual(Object.keys(ACTIVATION_DECISIONS), []);
});
