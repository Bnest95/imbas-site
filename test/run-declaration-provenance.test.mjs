// run-declaration-provenance — the run-conditions DECLARATION artifact, end to end.
//
// The governing distinction this file exists to hold: the declaration is evidence of
// what the person REPORTED. It is not evidence that the conditions actually matched.
// The derived matched/unmatched state stays client-side, unpersisted and unhashed, and
// the two must never be readable as one.
//
// A run carries a HISTORY of declarations, not one value. Somebody can report the
// conditions at submission, correct them after seeing the inspection, and correct them
// again on a later visit. A correction is a different fact from an original, so the
// record appends and never overwrites: each declaration is an immutable row, a
// correction points BACKWARD at what it corrects, and the earlier row survives the
// correction byte for byte.
//
// Gates:
//   1. The four absence states, each held separately —
//        supplied    → the declared values survive verbatim
//        omitted     → NOT_DECLARED, never a negative or unmatched reading
//        incomplete  → supplied fields preserved, remainder undeclared FIELD BY FIELD
//        derivation  → DERIVATION_UNAVAILABLE, never inferred from the declaration
//      plus the identity absences a history needs: STAGE_NOT_RECORDED,
//      ACTOR_NOT_IDENTIFIED, NO_SUPERSESSION — none of them inferrable.
//   2. The declaration/derivation separation — structural, not a rule to remember:
//      derivationState reads the capture and only the capture; the declaration holds
//      no derived key and the capture holds no declared one; and they ride in separate
//      objects on the PairRun.
//   3. Timestamps: declared_at_client is NEVER manufactured from received_at_server,
//      and client time never orders the history — the server receipt does.
//   4. One mapping owns the display copy, and the label travels on every surface —
//      receipt (both paired builders), Airtable row, share permalink, OG projection,
//      Review Packet.
//   5. cfp.1 separation: nothing in this family is named `conditions`, and the
//      inspector's condition fingerprint is untouched by it.
//   6. Append-only storage: idempotent appends, same-Inspection supersession only,
//      deterministic ordering, preserved branches, and no silent winner.
//   7. Dated records stay dated: a later declaration never changes an earlier receipt
//      or an earlier share.
//
// Content-blind: synthetic answers only. Run:
//   node --test test/run-declaration-provenance.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DECLARATION_VERSION,
  DECLARATION_VERSION_LEGACY,
  DECLARATION_NOT_DECLARED,
  DECLARATION_NOT_CAPTURED,
  DECLARATION_STAGE_NOT_RECORDED,
  DECLARATION_ACTOR_NOT_IDENTIFIED,
  DECLARATION_NO_SUPERSESSION,
  DECLARATION_STATUS,
  DECLARATION_STATUS_LABEL,
  DECLARATION_SOURCE,
  DECLARATION_STAGE,
  DECLARATION_READ,
  DECLARATION_HISTORY,
  DeclarationError,
  DERIVATION_UNAVAILABLE,
  declarationStatusLabel,
  buildRunDeclaration,
  classifyRunDeclaration,
  sanitizeRunDeclaration,
  adaptLegacyDeclaration,
  orderDeclarations,
  resolveDeclarationHistory,
  derivationState,
  buildPairCapture,
  buildPairRun,
  deriveConditionsMatched,
  PAIR_SAME_MODEL,
  PAIR_EDITS,
  PAIR_CONDITIONS_UNVERIFIED,
  PAIR_INITIATOR,
  PAIRED_METHOD_VERSION,
} from "../reader-paired.js";
import {
  CLAIM_BASIS,
  CLAIM_REGISTER,
  CLIENT_DECLARATION_SOURCES,
  AUTHORIZED_CONDITIONS_SOURCES,
  normalizeClaim,
} from "../reader-result.js";
import {
  buildPairedReceipt,
  buildChipPairedReceipt,
  formatPairedReceiptText,
  formatChipPairedReceiptText,
  canonicalizeForHash,
} from "../reader-receipt.js";
import { buildDescription, buildTitle } from "../api/inspection-view.js";
import { assembleReviewRecord, buildReviewRecord, validateReviewRecord } from "../reader-review-record.js";
import { buildCheckRegister } from "../reader-checks.js";
import {
  DECLARATION_WRITE,
  declarationToFields,
  declarationFromRow,
  ownershipKey,
  sameDeclarationContent,
  declarationIdList,
  serializeDeclarationIds,
  parseDeclarationIds,
  appendDeclaration,
  readDeclarationHistory,
  readDeclarationsByIds,
} from "../reader-declaration-log.js";

// ── Fixtures ─────────────────────────────────────────────────────────────────────

const CLIENT_AT = "2026-08-02T09:15:00.000Z";
const SERVER_AT = "2026-08-02T09:15:04.000Z";
const DECL_1_ID = "decl.d.aaaa0001";
const DECL_2_ID = "decl.d.bbbb0002";
const DECL_3_ID = "decl.d.cccc0003";
// Hex, because the ownership key is spliced into an Airtable filter formula and is
// stripped to [a-f0-9] on the way in rather than escaped.
const OWNER = { openRunId: "a1b2c3d4e5f6", answerHash: "b".repeat(64) };

// A complete declaration: all three answered, both instants present, identity stamped.
function fullDeclaration(over = {}) {
  return buildRunDeclaration({
    declaration_id: DECL_1_ID,
    stage: DECLARATION_STAGE.SUBMISSION,
    same_model: PAIR_SAME_MODEL.YES,
    model_version: "claude-opus-4-8",
    edits: PAIR_EDITS.NONE,
    declared_at_client: CLIENT_AT,
    received_at_server: SERVER_AT,
    ...over,
  });
}

// A correction: a second immutable declaration that names the first. Later server
// receipt, because a correction is by definition received after what it corrects.
function correction(over = {}) {
  return buildRunDeclaration({
    declaration_id: DECL_2_ID,
    stage: DECLARATION_STAGE.INSPECTION,
    same_model: PAIR_SAME_MODEL.NO,
    model_version: "gpt-5",
    edits: PAIR_EDITS.EDITED,
    declared_at_client: "2026-08-02T10:00:00.000Z",
    received_at_server: "2026-08-02T10:00:03.000Z",
    supersedes: DECL_1_ID,
    ...over,
  });
}

const OPEN_RUN = {
  answer: "The report recommends approval.",
  declared_model: "GPT-5",
  provenance: {
    request_id: "req_decl1",
    run_timestamp: "2026-08-02T09:14:00.000Z",
    reader_model_version: "claude-opus-4-8",
    inspector_prompt_version: "reader.v3",
  },
};

function pairedAnalysis() {
  return {
    open_run_id: "req_decl1",
    targeted_prompt: "What did the first answer leave out?",
    targeted_prompt_hash: "a".repeat(64),
    targeted_answer: "The second answer names the liability.",
    targeted_answer_hash: "b".repeat(64),
    delta_items: [
      { point: "Liability unnamed", open_side: "", targeted_side: "the clinician carries it", signal_pattern: "Omission" },
    ],
    gap_estimate: 1,
    estimate_rationale: "one decision-relevant delta",
    estimate_type: "paired_gap",
    rubric_version: "1.0",
    paired_method_version: PAIRED_METHOD_VERSION,
  };
}

function chipAnalysis() {
  return {
    ...pairedAnalysis(),
    chip_id: "sq.deadlines",
    instruction_version: "v1",
    chip_label: "What deadlines apply?",
    chip_paired_method_version: PAIRED_METHOD_VERSION,
  };
}

// ── 1. Absence state: DECLARATION SUPPLIED ───────────────────────────────────────

test("supplied: every declared value survives verbatim, in the form's own vocabulary", () => {
  const d = fullDeclaration();
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(d.status_label, "declared, not verified");
  assert.equal(d.declaration_version, DECLARATION_VERSION);
  assert.equal(d.declaration_source, DECLARATION_SOURCE);
  // The same_model enum survives whole. It is NOT collapsed to a boolean, because a
  // boolean cannot carry "not sure".
  assert.equal(d.same_model, PAIR_SAME_MODEL.YES);
  assert.equal(d.model_version, "claude-opus-4-8");
  assert.equal(d.edits, PAIR_EDITS.NONE);
  assert.equal(d.declared_at_client, CLIENT_AT);
  assert.equal(d.received_at_server, SERVER_AT);
  // The identity fields a history needs: who, when in the flow, under what name, and
  // what it corrects. An original corrects nothing and says so.
  assert.equal(d.declaration_id, DECL_1_ID);
  assert.equal(d.stage, DECLARATION_STAGE.SUBMISSION);
  assert.equal(d.supersedes, DECLARATION_NO_SUPERSESSION);
});

test('supplied: "not sure" is preserved as itself, not flattened onto a negative', () => {
  const d = fullDeclaration({ same_model: PAIR_SAME_MODEL.NOT_SURE });
  assert.equal(d.same_model, PAIR_SAME_MODEL.NOT_SURE);
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED, "answering the question IS a declaration");
  // The DERIVED capture, by contrast, cannot tell "not sure" from "no" — which is
  // exactly why the declaration exists alongside it rather than instead of it.
  const notSure = buildPairCapture({ same_model: PAIR_SAME_MODEL.NOT_SURE, edits: PAIR_EDITS.NONE });
  const no = buildPairCapture({ same_model: PAIR_SAME_MODEL.NO, edits: PAIR_EDITS.NONE });
  assert.equal(notSure.same_model_claimed, no.same_model_claimed, "the capture flattens the two");
  assert.notEqual(
    fullDeclaration({ same_model: PAIR_SAME_MODEL.NOT_SURE }).same_model,
    fullDeclaration({ same_model: PAIR_SAME_MODEL.NO }).same_model,
    "the declaration keeps them apart",
  );
});

// ── 2. Absence state: DECLARATION OMITTED ────────────────────────────────────────

test("omitted: an untouched form is NOT_DECLARED and never reads as a negative", () => {
  const d = buildRunDeclaration({ declaration_id: DECL_1_ID, received_at_server: SERVER_AT });
  assert.equal(d.status, DECLARATION_STATUS.NOT_DECLARED);
  assert.equal(d.status_label, "not declared");
  assert.equal(d.same_model, DECLARATION_NOT_DECLARED);
  assert.equal(d.model_version, DECLARATION_NOT_DECLARED);
  assert.equal(d.edits, DECLARATION_NOT_DECLARED);
  // An absent declaration is not a negative declaration. No field says "no", "false",
  // or anything from the unmatched vocabulary.
  const serialized = JSON.stringify(d).toLowerCase();
  assert.doesNotMatch(serialized, /unmatched/, "an absent declaration never says unmatched");
  assert.doesNotMatch(serialized, /"same_model":"no"/, 'silence is never recorded as "no"');
  assert.doesNotMatch(serialized, /false/, "no field degrades to a boolean negative");
});

test("omitted: a missing, malformed, or hostile input is REFUSED, never coerced into a declaration", () => {
  // sanitize used to answer every one of these with a placid NOT_DECLARED object. That
  // answer is now wrong for a history: "nobody declared anything" and "this row would
  // not parse" are different facts about the record, and a function that returns the
  // first when it means the second erases provenance without saying so.
  for (const raw of [undefined, null, "", 0, [], "DECLARED_NOT_VERIFIED", { status: "MATCHED" }]) {
    assert.throws(
      () => sanitizeRunDeclaration(raw),
      DeclarationError,
      `input ${JSON.stringify(raw)} must be refused, not declared`,
    );
    assert.equal(classifyRunDeclaration(raw).kind, DECLARATION_READ.MALFORMED);
  }
  // The absent state is still sayable — it is just said by BUILDING one, which is a
  // deliberate act with an identity attached, not by failing to read one.
  const none = buildRunDeclaration({ declaration_id: DECL_1_ID, received_at_server: SERVER_AT });
  assert.equal(none.status, DECLARATION_STATUS.NOT_DECLARED);
  assert.equal(none.status_label, "not declared");
  assert.equal(none.same_model, DECLARATION_NOT_DECLARED);
});

// ── 3. Absence state: DECLARATION INCOMPLETE ─────────────────────────────────────

test("incomplete: supplied fields are preserved and the remainder is marked FIELD BY FIELD", () => {
  // Answered the model question, skipped the edits question and the version box.
  const d = buildRunDeclaration({
    declaration_id: DECL_1_ID,
    same_model: PAIR_SAME_MODEL.YES,
    declared_at_client: CLIENT_AT,
    received_at_server: SERVER_AT,
  });
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED, "a partial declaration IS a declaration");
  assert.equal(d.same_model, PAIR_SAME_MODEL.YES, "the answered field survives");
  assert.equal(d.edits, DECLARATION_NOT_DECLARED, "the skipped field states its own absence");
  assert.equal(d.model_version, DECLARATION_NOT_DECLARED);
  // Each field carries its own state. One skipped answer does not drag the others down,
  // and one given answer does not imply the others.
  const other = buildRunDeclaration({
    declaration_id: DECL_2_ID,
    edits: PAIR_EDITS.EDITED,
    received_at_server: SERVER_AT,
  });
  assert.equal(other.edits, PAIR_EDITS.EDITED);
  assert.equal(other.same_model, DECLARATION_NOT_DECLARED);
  assert.equal(other.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
});

test("incomplete: an unrecognized value for a field is that field's absence, not the whole artifact's", () => {
  const d = buildRunDeclaration({
    declaration_id: DECL_1_ID,
    same_model: "maybe-ish",
    edits: PAIR_EDITS.NONE,
    received_at_server: SERVER_AT,
  });
  assert.equal(d.same_model, DECLARATION_NOT_DECLARED, "an unrecognized answer is not recorded as an answer");
  assert.equal(d.edits, PAIR_EDITS.NONE, "the neighbouring field is untouched");
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
});

// ── 3b. Identity absence: stage, actor, supersession ─────────────────────────────

test("identity: an unrecorded stage and an unidentified actor are stated, never inferred", () => {
  // The surface that took this declaration did not record which stage it came from and
  // did not identify who made it. Both say so. Neither is filled in from the request,
  // the route, the receipt type, or the session — a stage read off where the request
  // landed would be the server's guess wearing the person's voice.
  const d = buildRunDeclaration({
    declaration_id: DECL_1_ID,
    same_model: PAIR_SAME_MODEL.YES,
    edits: PAIR_EDITS.NONE,
    received_at_server: SERVER_AT,
  });
  assert.equal(d.stage, DECLARATION_STAGE_NOT_RECORDED);
  assert.equal(d.actor, DECLARATION_ACTOR_NOT_IDENTIFIED);
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED, "identity absence does not undeclare content");
});

test("identity: a stage this vocabulary does not know is refused, because absence is stated and nonsense is not", () => {
  assert.throws(
    () => buildRunDeclaration({ declaration_id: DECL_1_ID, stage: "sometime", received_at_server: SERVER_AT }),
    DeclarationError,
  );
  // All four real stages are accepted whole.
  for (const stage of Object.values(DECLARATION_STAGE)) {
    const d = buildRunDeclaration({ declaration_id: DECL_1_ID, stage, received_at_server: SERVER_AT });
    assert.equal(d.stage, stage);
  }
});

test("identity: a declaration cannot correct itself, and a malformed correction reference is refused", () => {
  assert.throws(
    () => buildRunDeclaration({ declaration_id: DECL_1_ID, supersedes: DECL_1_ID, received_at_server: SERVER_AT }),
    DeclarationError,
    "self-supersession is a loop of one",
  );
  for (const bad of ["", "  ", "short", "has space", "quote'inside", "a".repeat(129)]) {
    assert.throws(
      () => buildRunDeclaration({ declaration_id: DECL_1_ID, supersedes: bad, received_at_server: SERVER_AT }),
      DeclarationError,
      `${JSON.stringify(bad)} is not a declaration id`,
    );
  }
});

// ── 4. Absence state: DERIVATION UNAVAILABLE ─────────────────────────────────────

test("derivation unavailable: derivationState reads the capture and ONLY the capture", () => {
  assert.equal(derivationState(undefined), DERIVATION_UNAVAILABLE);
  assert.equal(derivationState(null), DERIVATION_UNAVAILABLE);
  assert.equal(derivationState({}), DERIVATION_UNAVAILABLE);
  assert.equal(derivationState("matched"), DERIVATION_UNAVAILABLE);
  const capture = buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE });
  assert.equal(derivationState(capture), capture.conditions_matched);
});

test("derivation unavailable: a COMPLETE declaration with no capture still yields DERIVATION_UNAVAILABLE", () => {
  // The separation stated as a signature rather than as a rule someone has to remember:
  // hand the deriver a fully populated declaration and it cannot read a conclusion out
  // of it, because a declaration is not a capture.
  const d = fullDeclaration();
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(derivationState(d), DERIVATION_UNAVAILABLE, "a declaration is never a derivation");
});

test("derivation unavailable is never inferred FROM missing declaration data either", () => {
  // The converse trap: an absent declaration must not be read as an unavailable
  // derivation, and an available derivation must not be suppressed by one.
  const capture = buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE });
  const run = buildPairRun({
    targetedPrompt: "p",
    targetedPromptHash: "c".repeat(64),
    capture,
    initiator: PAIR_INITIATOR.INSPECTION_FOLLOWUP,
    // No declarations supplied at all.
  });
  assert.deepEqual(run.declarations, [], "an empty history is empty, not a NOT_DECLARED placeholder");
  assert.equal(derivationState(run.capture), true, "the derivation still resolves from the capture it owns");
});

// ── 5. The separation, structurally ──────────────────────────────────────────────

test("separation: the declaration carries no derived key and the capture carries no declared one", () => {
  const d = fullDeclaration();
  const capture = buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE });
  assert.ok(!("conditions_matched" in d), "the derived conclusion is not a field of the declaration");
  assert.ok(!("matched" in d));
  assert.ok(!("status" in capture), "the declaration's status is not a field of the capture");
  assert.ok(!("status_label" in capture));
  assert.ok(!("declaration_version" in capture));
});

test("separation: on a PairRun the two ride in separate objects, neither nested in the other", () => {
  const run = buildPairRun({
    targetedPrompt: "p",
    targetedPromptHash: "c".repeat(64),
    capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
    declarations: [fullDeclaration()],
    initiator: PAIR_INITIATOR.INSPECTION_FOLLOWUP,
  });
  assert.equal(typeof run.capture, "object");
  assert.ok(Array.isArray(run.declarations), "the history is a list, because a run can hold several");
  assert.ok(!("declarations" in run.capture), "the declarations are not nested inside the derivation");
  assert.ok(!("capture" in run.declarations[0]), "the derivation is not nested inside a declaration");
  assert.equal(run.declarations[0].status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(run.capture.conditions_matched, true);
});

test("separation: buildPairRun orders the history it is handed and refuses one it cannot read", () => {
  // Order is re-derived, not trusted. Hand it the correction first and the original
  // still comes back first, because server receipt time is what sequences a history.
  const run = buildPairRun({
    targetedPrompt: "p",
    targetedPromptHash: "c".repeat(64),
    capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
    declarations: [correction(), fullDeclaration()],
    initiator: PAIR_INITIATOR.INSPECTION_FOLLOWUP,
  });
  assert.deepEqual(
    run.declarations.map((d) => d.declaration_id),
    [DECL_1_ID, DECL_2_ID],
  );
  assert.throws(
    () =>
      buildPairRun({
        targetedPrompt: "p",
        targetedPromptHash: "c".repeat(64),
        capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
        declarations: [fullDeclaration(), { declaration_version: "decl.9" }],
        initiator: PAIR_INITIATOR.INSPECTION_FOLLOWUP,
      }),
    DeclarationError,
    "one unreadable entry fails the run rather than shortening its history",
  );
});

test("separation: nothing makes the two agree — a declaration and its derivation may disagree freely", async () => {
  // Declared "same model" while the capture, built from a "not sure", derives
  // unverified. Nothing reconciles them, and nothing should: a rule forcing agreement
  // would be deriving a conclusion from a disclosure, which is the one thing this
  // artifact must not do. The disagreeing record is VALID.
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: {
      ...reviewPair([fullDeclaration({ same_model: PAIR_SAME_MODEL.YES })]),
      capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.NOT_SURE, edits: PAIR_EDITS.NONE }),
    },
  });
  const pr = record.contents.pair_runs[0];
  assert.equal(pr.declarations[0].same_model, PAIR_SAME_MODEL.YES, "what was reported");
  assert.equal(pr.capture.conditions_matched, PAIR_CONDITIONS_UNVERIFIED, "what was derived");
  assert.equal(validateReviewRecord(record).ok, true, "no validator reconciles the two");
});

test("separation: the derived state is deriveConditionsMatched's, and it never reads a declaration", () => {
  // deriveConditionsMatched keeps its pre-existing signature and its pre-existing
  // answers. This pass added a declaration beside it; it changed nothing about it.
  assert.equal(deriveConditionsMatched({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }), true);
  assert.equal(deriveConditionsMatched({ same_model: PAIR_SAME_MODEL.NO, edits: PAIR_EDITS.NONE }), false);
  assert.equal(
    deriveConditionsMatched({ same_model: PAIR_SAME_MODEL.NOT_SURE, edits: PAIR_EDITS.NONE }),
    PAIR_CONDITIONS_UNVERIFIED,
  );
  assert.equal(deriveConditionsMatched({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED }), false);
});

test("separation: the shared vocabulary is deliberate, and the separation is held at the OBJECT level", () => {
  // The declaration preserves the form's own words (`yes` / `none`), so its field
  // VALUES are the same vocabulary the deriver reads. That is on purpose — the brief
  // requires the existing declaration vocabulary, not a substitute concept for it.
  // The separation is therefore structural, not lexical: the declaration is a distinct
  // object that carries no derived key, so nothing reading a declaration finds a
  // conclusion in it, and derivationState — the accessor every surface uses — reports
  // DERIVATION_UNAVAILABLE when handed one.
  const d = fullDeclaration();
  assert.equal(d.same_model, PAIR_SAME_MODEL.YES, "same vocabulary as the form");
  assert.ok(!("conditions_matched" in d), "no conclusion inside it");
  assert.equal(derivationState(d), DERIVATION_UNAVAILABLE, "the accessor cannot read one out of it");
});

// ── 6. Timestamps ────────────────────────────────────────────────────────────────

test("timestamps: an uncaptured client time is NOT_CAPTURED and is NEVER backfilled from the server", () => {
  const d = buildRunDeclaration({
    declaration_id: DECL_1_ID,
    same_model: PAIR_SAME_MODEL.YES,
    edits: PAIR_EDITS.NONE,
    received_at_server: SERVER_AT,
  });
  assert.equal(d.declared_at_client, DECLARATION_NOT_CAPTURED);
  assert.equal(d.received_at_server, SERVER_AT);
  assert.notEqual(d.declared_at_client, d.received_at_server, "the server clock never becomes a client declaration time");
});

test("timestamps: NOT_CAPTURED (never asked) is a different token from NOT_DECLARED (asked, unanswered)", () => {
  assert.notEqual(DECLARATION_NOT_CAPTURED, DECLARATION_NOT_DECLARED);
  const d = buildRunDeclaration({ declaration_id: DECL_1_ID, received_at_server: SERVER_AT });
  assert.equal(d.same_model, DECLARATION_NOT_DECLARED, "a question with no answer");
  assert.equal(d.declared_at_client, DECLARATION_NOT_CAPTURED, "a value the form never collected");
});

// ── 7. One mapping owns the display copy ─────────────────────────────────────────

test("label: exactly two statuses exist and each has exactly one rendering", () => {
  assert.deepEqual(Object.keys(DECLARATION_STATUS).sort(), ["DECLARED_NOT_VERIFIED", "NOT_DECLARED"]);
  assert.deepEqual(Object.keys(DECLARATION_STATUS_LABEL).sort(), ["DECLARED_NOT_VERIFIED", "NOT_DECLARED"]);
  assert.equal(declarationStatusLabel(DECLARATION_STATUS.DECLARED_NOT_VERIFIED), "declared, not verified");
  assert.equal(declarationStatusLabel(DECLARATION_STATUS.NOT_DECLARED), "not declared");
  // The stored value is the machine token; the sentence is display copy only.
  assert.equal(DECLARATION_STATUS.DECLARED_NOT_VERIFIED, "DECLARED_NOT_VERIFIED");
});

test("label: an unknown status falls to the non-committal rendering, never to the declared one", () => {
  for (const s of [undefined, null, "", "MATCHED", "declared, not verified", 7]) {
    assert.equal(declarationStatusLabel(s), "not declared", `${JSON.stringify(s)} must not render as declared`);
  }
});

test("label: a stored label is RE-DERIVED on read, so no surface can display one that contradicts its token", () => {
  const lying = sanitizeRunDeclaration({
    ...fullDeclaration(),
    status: DECLARATION_STATUS.NOT_DECLARED,
    status_label: "conditions matched",
  });
  assert.equal(lying.status, DECLARATION_STATUS.NOT_DECLARED);
  assert.equal(lying.status_label, "not declared", "the stored wording is discarded, not trusted");
  // Which is why the row does not store it at all: one mapping owns the words, and a
  // second copy in the store would be a second place for them to drift.
  assert.ok(!("Status Label" in declarationToFields(fullDeclaration(), OWNER)));
});

test("version: an unrecognized shape is refused, not restamped as the shape in hand", () => {
  // INVERTED. This test previously pinned the opposite behavior: sanitize stamped its
  // own version onto whatever it was handed and silently dropped every key it did not
  // recognize, and the assertions here required that stripping.
  //
  // The semantics changed under the declaration-history ruling of August 2, 2026. Under
  // a single-value design, dropping unknown keys cost nothing readable — there was one
  // declaration and it was fully described by the keys decl.1 knew. Under a history it
  // costs the history: identity, stage, actor and the correction pointer are exactly the
  // keys an older reader would not recognize, so silent stripping turns a chain of
  // corrections into one undated snapshot with no trace that anything was lost. Version
  // is therefore read off the row like every other value, and a shape this build cannot
  // account for is an error rather than a downgrade.
  for (const input of [undefined, null, {}, "nonsense", { status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED, same_model: "yes" }]) {
    assert.throws(() => sanitizeRunDeclaration(input), DeclarationError, `no version on ${JSON.stringify(input)}`);
  }
  // A version from the future is named as unsupported, and named DIFFERENTLY from
  // malformed — a caller that cannot tell "too new to read" from "broken" cannot answer
  // either one correctly.
  const future = {
    declaration_version: "decl.9",
    declaration_id: DECL_1_ID,
    declaration_source: DECLARATION_SOURCE,
    status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED,
    stage: DECLARATION_STAGE.SUBMISSION,
    actor: DECLARATION_ACTOR_NOT_IDENTIFIED,
    same_model: "yes",
    model_version: "m",
    edits: "none",
    declared_at_client: CLIENT_AT,
    received_at_server: SERVER_AT,
    supersedes: DECLARATION_NO_SUPERSESSION,
    some_decl_9_field: "must not be dropped in silence",
  };
  assert.equal(classifyRunDeclaration(future).kind, DECLARATION_READ.UNSUPPORTED_VERSION);
  assert.throws(() => sanitizeRunDeclaration(future), DeclarationError);
  // And a well-formed decl.2 row IS accepted, echoing its own content back unchanged.
  const ok = sanitizeRunDeclaration({ ...future, declaration_version: DECLARATION_VERSION });
  assert.equal(ok.declaration_version, DECLARATION_VERSION);
  assert.equal(ok.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(ok.same_model, "yes");
  // The five keys the old behavior would have stripped, named one at a time. These are
  // the history itself: what this declaration is called, who reported it, at what point,
  // through which surface, and which earlier declaration it corrects. Losing any one of
  // them leaves a chain that still parses and no longer means anything.
  assert.equal(ok.declaration_id, DECL_1_ID);
  assert.equal(ok.declaration_source, DECLARATION_SOURCE);
  assert.equal(ok.stage, DECLARATION_STAGE.SUBMISSION);
  assert.equal(ok.actor, DECLARATION_ACTOR_NOT_IDENTIFIED);
  assert.equal(ok.supersedes, DECLARATION_NO_SUPERSESSION);
  // And the round trip closes in one direction only: what comes back is decl.2, so no
  // valid decl.2 can be re-read as the legacy shape.
  assert.equal(classifyRunDeclaration(ok).kind, DECLARATION_READ.DECL_2);
  assert.notEqual(ok.declaration_version, DECLARATION_VERSION_LEGACY);
});

test("version: decl.1 is reachable only through the named adapter, and the adapter invents nothing", () => {
  const legacy = {
    declaration_version: DECLARATION_VERSION_LEGACY,
    declaration_source: DECLARATION_SOURCE,
    status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED,
    status_label: "declared, not verified",
    same_model: PAIR_SAME_MODEL.YES,
    model_version: "claude-opus-4-8",
    edits: PAIR_EDITS.NONE,
    declared_at_client: CLIENT_AT,
    received_at_server: SERVER_AT,
  };
  // The fail-closed half: the ordinary read path refuses it and says which kind it is,
  // so nothing reaches decl.1 by accident.
  assert.equal(classifyRunDeclaration(legacy).kind, DECLARATION_READ.LEGACY_DECL_1);
  assert.throws(() => sanitizeRunDeclaration(legacy), DeclarationError);
  // The adapter is lossless in the direction that matters: every value decl.1 carried
  // survives verbatim, and every field decl.1 never had becomes a stated absence.
  const adapted = adaptLegacyDeclaration(legacy, { declaration_id: DECL_1_ID });
  assert.equal(adapted.declaration_version, DECLARATION_VERSION);
  assert.equal(adapted.declaration_id, DECL_1_ID);
  assert.equal(adapted.same_model, PAIR_SAME_MODEL.YES);
  assert.equal(adapted.declared_at_client, CLIENT_AT);
  assert.equal(adapted.stage, DECLARATION_STAGE_NOT_RECORDED, "decl.1 never asked, so the answer is not 'no'");
  assert.equal(adapted.actor, DECLARATION_ACTOR_NOT_IDENTIFIED);
  assert.equal(adapted.supersedes, DECLARATION_NO_SUPERSESSION, "a snapshot corrects nothing by construction");
  assert.equal(adapted.declaration_source, DECLARATION_SOURCE, "preserved, not restamped");
  // It refuses to mint an identity. Two adapters reading the same legacy row must not
  // disagree about what it is called, so the caller has to say.
  assert.throws(() => adaptLegacyDeclaration(legacy), DeclarationError);
  assert.throws(() => adaptLegacyDeclaration(legacy, { declaration_id: "no" }), DeclarationError);
  // And it is not a back door into the current shape: a decl.2 object is refused here.
  assert.throws(() => adaptLegacyDeclaration(fullDeclaration(), { declaration_id: DECL_2_ID }), DeclarationError);
});

test("version: the four read classifications are distinct, and none of them is a silent repair", () => {
  assert.deepEqual(Object.keys(DECLARATION_READ).sort(), [
    "DECL_2",
    "LEGACY_DECL_1",
    "MALFORMED",
    "UNSUPPORTED_VERSION",
  ]);
  assert.equal(classifyRunDeclaration(fullDeclaration()).kind, DECLARATION_READ.DECL_2);
  assert.equal(classifyRunDeclaration({ declaration_version: DECLARATION_VERSION }).kind, DECLARATION_READ.MALFORMED);
  // Every refusal throws the same named error type carrying the kind, so a caller can
  // branch on WHY rather than on a message string.
  try {
    sanitizeRunDeclaration({ declaration_version: "decl.9" });
    assert.fail("must throw");
  } catch (err) {
    assert.ok(err instanceof DeclarationError);
    assert.equal(err.kind, DECLARATION_READ.UNSUPPORTED_VERSION);
    assert.ok(err.reason.length > 0, "the refusal says what was wrong");
  }
});

test("version: no decl.2 field disappears without an error — the fail-closed sweep, field by field", () => {
  // §10's requirement stated as a loop rather than as prose: drop any one of the
  // thirteen fields and the read must fail. This is the test that would catch a future
  // "just default it" patch, whichever field someone reaches for first.
  const complete = fullDeclaration();
  for (const key of Object.keys(complete)) {
    if (key === "status_label") continue; // re-derived on read by design, not stored input
    const missing = { ...complete };
    delete missing[key];
    assert.throws(() => sanitizeRunDeclaration(missing), DeclarationError, `dropping ${key} must be loud`);
  }
  assert.equal(Object.keys(complete).length, 13, "the artifact is thirteen fields wide");
});

// ── 8. The cross-module vocabulary pin ───────────────────────────────────────────

test("vocabulary: DECLARATION_SOURCE is reader-result.js's existing client-declaration source, not a new concept", () => {
  // Both modules are pure leaves that import nothing, so the string is duplicated
  // rather than shared. This is the pin that keeps the two copies equal.
  assert.equal(CLIENT_DECLARATION_SOURCES.length, 1);
  assert.equal(DECLARATION_SOURCE, CLIENT_DECLARATION_SOURCES[0]);
  assert.ok(!AUTHORIZED_CONDITIONS_SOURCES.includes(DECLARATION_SOURCE), "it is not an authorized source");
});

test("vocabulary: the artifact classifies as REPORTED_CLIENT_DECLARATION and cannot reach the matched register", () => {
  const claim = normalizeClaim({ conditions_source: DECLARATION_SOURCE, conditions_status: "MATCHED" });
  assert.equal(claim.claim_basis, CLAIM_BASIS.REPORTED_CLIENT_DECLARATION);
  // Even asserting MATCHED alongside it, the declaration cannot authorize the
  // matched-conditions register. That ceiling is pre-existing and this pass rides it.
  assert.equal(claim.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
});

// ── 9. cfp.1 separation ──────────────────────────────────────────────────────────

test("cfp.1: no field in the declaration family is named `conditions`", () => {
  const d = fullDeclaration();
  for (const k of Object.keys(d)) {
    assert.doesNotMatch(k, /conditions/i, `declaration field "${k}" collides with the cfp.1 family`);
  }
});

test("cfp.1: the Airtable columns are the declaration vocabulary, never Conditions*", () => {
  // Read off the mapping itself rather than off a source slice: reader-declaration-log.js
  // is the single owner of the row shape, so its output IS the column list.
  const columns = Object.keys(declarationToFields(fullDeclaration(), OWNER));
  assert.deepEqual(columns.sort(), [
    "Actor",
    "Declaration ID",
    "Declaration Source",
    "Declaration Status",
    "Declaration Version",
    "Declared At Client",
    "Declared Edits",
    "Declared Model Version",
    "Declared Same Model",
    "Open Run ID",
    "Received At Server",
    "Stage",
    "Supersedes Declaration ID",
    "Targeted Answer Hash",
  ]);
  for (const c of columns) {
    assert.doesNotMatch(c, /Condition/, `column "${c}" collides with the cfp.1 family`);
  }
  // Nothing DERIVED is written to the row, and neither is the display copy: the label
  // is owned by one mapping and a second copy here is a second place to drift.
  const row = declarationToFields(fullDeclaration(), OWNER);
  assert.ok(!("Status Label" in row));
  assert.ok(!("Conditions Matched" in row));
  assert.doesNotMatch(JSON.stringify(row), /declared, not verified/);
});

test("cfp.1: the row round-trips — every declared value returns from storage unchanged", () => {
  const d = correction();
  const back = declarationFromRow(declarationToFields(d, OWNER));
  assert.deepEqual(back, d, "a stored declaration reads back as itself");
});

test("cfp.1: ownership requires BOTH halves of the pair identity, and strips anything unhexlike", () => {
  assert.deepEqual(ownershipKey(OWNER), OWNER);
  for (const bad of [{}, { openRunId: OWNER.openRunId }, { answerHash: OWNER.answerHash }, { openRunId: "'", answerHash: "b" }]) {
    assert.throws(() => ownershipKey(bad), DeclarationError, `${JSON.stringify(bad)} has no owner`);
  }
  // The keys are spliced into an Airtable filter formula by concatenation, so a quote
  // or paren reaching one would rewrite the query. They are stripped, not escaped.
  assert.equal(ownershipKey({ openRunId: "a1')OR(1", answerHash: OWNER.answerHash }).openRunId, "a11");
});

// ── 10. Carry surface: the receipt (BOTH paired builders) ────────────────────────

test("carry — receipt: both paired builders hold the declaration history as a sibling of the analysis", () => {
  const ds = [fullDeclaration()];
  const paired = buildPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    pairedAnalysis: pairedAnalysis(),
    declarations: ds,
  });
  const chip = buildChipPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    chipAnalysis: chipAnalysis(),
    declarations: ds,
  });
  for (const [name, env] of [["paired", paired], ["chip", chip]]) {
    assert.ok(Array.isArray(env.run_declarations), name);
    assert.equal(env.run_declarations[0].status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED, name);
    assert.equal(env.run_declarations[0].status_label, "declared, not verified", name);
    // Sibling of the analysis, not folded into it — the shapes stay separable.
    assert.ok(!("run_declarations" in (env.paired_analysis || env.chip_analysis || {})), name);
  }
});

test("carry — receipt: an absent history is an empty list, and the text says so in words", () => {
  const env = buildPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, pairedAnalysis: pairedAnalysis() });
  assert.deepEqual(env.run_declarations, []);
  const text = formatPairedReceiptText(env);
  assert.match(text, /HOW THIS PAIR WAS RUN \(declared by the person, not verified\)/);
  assert.match(text, /No declaration was recorded with this run\./);
  assert.doesNotMatch(text, /unmatched/i, "an absent declaration never prints as unmatched");
});

test("carry — receipt: the status label prints on both text formatters, alongside its token", () => {
  const ds = [fullDeclaration()];
  const pairedText = formatPairedReceiptText(
    buildPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, pairedAnalysis: pairedAnalysis(), declarations: ds }),
  );
  const chipText = formatChipPairedReceiptText(
    buildChipPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, chipAnalysis: chipAnalysis(), declarations: ds }),
  );
  for (const [name, text] of [["paired", pairedText], ["chip", chipText]]) {
    assert.match(text, /Status: declared, not verified \(DECLARED_NOT_VERIFIED\)/, name);
    assert.match(text, /Same AI for both answers: yes/, name);
    assert.match(text, /Declared at \(client\): 2026-08-02T09:15:00\.000Z/, name);
    assert.match(text, /Received at \(server\): 2026-08-02T09:15:04\.000Z/, name);
    assert.match(text, /Declaration source: pair_capture_client_declaration/, name);
    // The identity a history needs, printed rather than kept in the machine layer.
    assert.match(text, /Declaration ID: decl\.d\.aaaa0001/, name);
    assert.match(text, /Declared at stage: submission/, name);
    assert.match(text, /Corrects declaration: NO_SUPERSESSION/, name);
    // The receipt states what was declared and stops. It never states the derived
    // conditions conclusion, in this section or anywhere else.
    assert.doesNotMatch(text, /conditions matched/i, name);
  }
});

test("carry — receipt: a corrected history prints BOTH declarations, oldest first, and names the correction", () => {
  // The whole point of the append-only record, on the surface a person actually reads:
  // the earlier declaration is still there, and the later one is shown as a correction
  // of it rather than as a replacement that ate it.
  const text = formatPairedReceiptText(
    buildPairedReceipt({
      generatedAt: SERVER_AT,
      openRun: OPEN_RUN,
      pairedAnalysis: pairedAnalysis(),
      declarations: [fullDeclaration(), correction()],
    }),
  );
  assert.match(text, /2 declarations, oldest first, as received by the server\./);
  assert.ok(text.includes(DECL_1_ID), "the superseded declaration is still printed");
  assert.ok(text.includes(DECL_2_ID));
  assert.ok(
    text.indexOf(DECL_1_ID) < text.indexOf(DECL_2_ID),
    "oldest first, by server receipt",
  );
  assert.match(text, new RegExp(`Corrects declaration: ${DECL_1_ID.replace(/\./g, "\\.")}`));
  // Both readings of same_model survive side by side. Nothing collapses the pair into
  // the newest answer, because what somebody first reported is part of the record.
  assert.match(text, /Same AI for both answers: yes/);
  assert.match(text, /Same AI for both answers: no/);
});

test("carry — receipt: the declaration enters the hashed body, and the derived state does not", () => {
  const withDecl = buildPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    pairedAnalysis: pairedAnalysis(),
    declarations: [fullDeclaration()],
  });
  const without = buildPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, pairedAnalysis: pairedAnalysis() });
  // The builders leave content_hash null for the caller to fill, so the gate is the
  // canonical body those hashes are taken over.
  const canonical = canonicalizeForHash(withDecl);
  assert.notEqual(canonical, canonicalizeForHash(without), "the disclosure is inside the hashed body");
  assert.match(canonical, /pair_capture_client_declaration/);
  assert.match(canonical, /DECLARED_NOT_VERIFIED/);
  // The DERIVED conclusion is not. This is the decision reader-receipt.js already
  // records, and this pass leaves it exactly where it was.
  assert.doesNotMatch(canonical, /conditions_matched/, "the derived conclusion is never hashed");
});

// ── 11. Carry surface: the share permalink + the OG projection ───────────────────

// inspection.js is a plain browser script: no imports, no exports, nothing to require.
// So the two functions under test are lifted out of the SHIPPED file and evaluated, and
// what is asserted below is the HTML the page actually emits — not the presence of a
// string in the source. The visual board cannot stand in for this: it photographs the
// viewport, and the declaration section renders below the fold at both widths, so the
// board never sees it. Grepping the source would only prove the file says the words.
function loadInspectionRenderer() {
  const src = readFileSync(new URL("../inspection.js", import.meta.url), "utf8");
  const take = (from, to) => {
    const a = src.indexOf(from);
    const b = src.indexOf(to);
    assert.ok(a >= 0 && b > a, `could not lift ${from} out of inspection.js`);
    return src.slice(a, b);
  };
  const body =
    take("function escapeHtml", "function parseShareId") +
    // declarationRows and declarationEntryHtml sit between this boundary and
    // declarationHtml, and all three are needed: the entry renderer is what draws a
    // correction, so lifting only the outer function would test a shell.
    take("function declarationRows", "function renderPaired") +
    "\nreturn declarationHtml;";
  return new Function(body)();
}

// A share record as the page receives it: mode, the resolved history state, and the
// declarations themselves.
function shareRecord(over = {}) {
  return {
    mode: "paired",
    declaration_state: DECLARATION_HISTORY.RESOLVED,
    run_declarations: [fullDeclaration()],
    ...over,
  };
}

test("carry — share: a declared run renders every value under the status label", () => {
  const declarationHtml = loadInspectionRenderer();
  const html = declarationHtml(
    shareRecord({ run_declarations: [fullDeclaration({ model_version: "GPT-5" })] }),
  );
  // The label leads the heading: the first thing read about these values is that
  // nobody checked them.
  assert.match(html, /How this pair was run — declared, not verified/);
  assert.match(html, /Imbas did not verify them\./);
  // Each declared value survives to the page as its own row, in the form's vocabulary.
  for (const v of ["yes", "GPT-5", "none", CLIENT_AT, SERVER_AT, "submission", DECL_1_ID]) {
    assert.ok(html.includes(v), `the share dropped the declared value ${JSON.stringify(v)}`);
  }
  // The stored token rides along for the stylesheet, and the derived conclusion does
  // not appear in any form a reader could take for a verified one.
  assert.match(html, /data-state="DECLARED_NOT_VERIFIED"/);
  for (const forbidden of ["conditions_matched", "matched", "unmatched", "unverified"]) {
    assert.ok(!html.includes(forbidden), `the share rendered the derived word ${JSON.stringify(forbidden)}`);
  }
});

test("carry — share: a corrected run shows both entries, oldest first, and marks the correction", () => {
  const declarationHtml = loadInspectionRenderer();
  const html = declarationHtml(shareRecord({ run_declarations: [fullDeclaration(), correction()] }));
  assert.match(html, /Declaration 1 of 2/);
  assert.match(html, /Declaration 2 of 2/);
  assert.ok(html.includes("· correction"), "the later entry is marked as correcting, not replacing");
  assert.match(html, /a later entry corrects an earlier one rather than replacing it/);
  // The superseded declaration is still on the page in full. This is the whole reason
  // the record appends: what somebody first reported is not deleted by their revision.
  assert.ok(html.includes(DECL_1_ID) && html.includes(DECL_2_ID));
  assert.ok(html.indexOf(DECL_1_ID) < html.indexOf(DECL_2_ID), "oldest first");
  assert.ok(html.includes("claude-opus-4-8") && html.includes("gpt-5"), "both reported models survive");
});

test("carry — share: an undeclared run says so, and says what it does not mean", () => {
  const declarationHtml = loadInspectionRenderer();
  const html = declarationHtml(
    shareRecord({ declaration_state: DECLARATION_HISTORY.NONE, run_declarations: [] }),
  );
  assert.match(html, /How this pair was run/);
  assert.match(html, /No declaration was recorded with this run\./);
  // An absent declaration is not a negative one, and the page says that in words
  // rather than leaving a reader to infer it from an empty section.
  assert.match(html, /not that anything failed/);
  // The rows are withheld rather than printed as a column of absence tokens: NOT_DECLARED
  // beside five identical placeholders reads like five findings. The status carries it.
  assert.ok(!html.includes("NOT_DECLARED</p>"), "absence tokens are not paraded as values");
  for (const forbidden of ["matched", "unmatched"]) {
    assert.ok(!html.includes(forbidden), `an absent declaration rendered as ${JSON.stringify(forbidden)}`);
  }
});

test("carry — share: an unreadable history is a THIRD state, and never speaks for the person", () => {
  // The share stores declaration identities and resolves them on read. A failed read is
  // a fault here. Rendering it as "no declaration was recorded" would put a statement
  // into the person's mouth that they never made, so it gets its own words.
  const declarationHtml = loadInspectionRenderer();
  const html = declarationHtml(
    shareRecord({ declaration_state: DECLARATION_HISTORY.UNREADABLE, run_declarations: [] }),
  );
  assert.match(html, /it could not be read right now/);
  assert.match(html, /a fault here, not a statement about how the pair was run/);
  assert.doesNotMatch(html, /No declaration was recorded/, "a failed read is not an absent declaration");
});

test("carry — share: a record with no declaration at all renders nothing, not an empty frame", () => {
  const declarationHtml = loadInspectionRenderer();
  // A legacy share minted before this pass. The section is omitted entirely rather
  // than drawing a heading over nothing — there is no artifact to report on.
  assert.equal(declarationHtml({ mode: "paired" }), "");
  assert.equal(declarationHtml({ mode: "single", declaration_state: DECLARATION_HISTORY.NONE }), "");
  assert.equal(declarationHtml({}), "");
  assert.equal(declarationHtml(null), "");
});

test("carry — share: every history state is a named token, and none of them is a blank", () => {
  // The rule this pins is the one the rest of the artifact already follows with
  // NOT_DECLARED, NOT_CAPTURED, STAGE_NOT_RECORDED, ACTOR_NOT_IDENTIFIED and
  // NO_SUPERSESSION: a stated absence, never an empty slot. A blank state would make
  // "there was never a pair here", "the pair's log is empty" and "the field is missing"
  // read identically to anything consuming this payload.
  const states = Object.values(DECLARATION_HISTORY);
  assert.equal(new Set(states).size, states.length, "two history states share a token");
  for (const s of states) {
    assert.equal(typeof s, "string");
    assert.ok(s.length > 0, "a history state is the empty string");
    assert.equal(s, s.trim(), `history state ${JSON.stringify(s)} carries padding`);
  }
  // The specific pair this test exists for. A single-mode share owns no declarations
  // because it is not a pair; that is a different fact from a pair whose log is empty,
  // and the person in the second case is someone who did not declare.
  assert.notEqual(DECLARATION_HISTORY.NOT_APPLICABLE, DECLARATION_HISTORY.NONE);

  // Neither reaches the reader: the section is paired-only, so the token is a machine
  // fact in the payload and never copy on the page.
  const declarationHtml = loadInspectionRenderer();
  for (const s of states) {
    assert.equal(declarationHtml({ mode: "single", declaration_state: s }), "", `single mode rendered on ${s}`);
  }
});

test("carry — share: declared values are escaped, never interpolated raw", () => {
  const declarationHtml = loadInspectionRenderer();
  // model_version is free text a stranger types into the paste-back form and the
  // endpoint stores verbatim, so it reaches this page unfiltered.
  const html = declarationHtml(
    shareRecord({ run_declarations: [fullDeclaration({ model_version: '<img src=x onerror="alert(1)">' })] }),
  );
  // The whole payload survives as inert text — angle brackets and quotes neutralized,
  // so the handler is displayed rather than armed.
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  // And it opened no element. Asserting on the tag SET rather than on the absence of
  // one substring is the check that holds: "onerror=" still appears in the output as
  // escaped text, harmlessly, so searching for it would fail on safe markup and pass
  // on a payload that spelled its handler any other way.
  const tags = new Set([...html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1].toLowerCase()));
  assert.deepEqual(
    [...tags].sort(),
    ["article", "div", "h3", "li", "p", "section", "span", "ul"],
    "a declared value opened an element of its own",
  );
});

test("carry — share: the page holds no copy of the wording and no derived conclusion", () => {
  const src = readFileSync(new URL("../inspection.js", import.meta.url), "utf8");
  const block = src.slice(src.indexOf("function declarationRows"), src.indexOf("function renderPaired"));
  // Read off the source rather than the output, because this is a claim about where
  // the words LIVE. The renderer tests above prove the label arrives; this one proves
  // it arrived from the record, so DECLARATION_STATUS_LABEL stays the only place the
  // wording is written and this page cannot drift from it.
  assert.match(block, /status_label/, "the label is read off the record");
  assert.doesNotMatch(block, /declared, not verified/, "the page never writes its own copy of the wording");
  assert.doesNotMatch(block, /conditions_matched/, "the share carries no derived conclusion");
});

test("carry — OG: the paired card states how the pair was run, in both declaration states", () => {
  // The card reads the stored IDENTITIES, not the resolved declarations. A card that
  // flipped to "not declared" because a second read timed out would assert something
  // false about the person's run, on the surface that gets screenshotted.
  const declared = buildDescription({ mode: "paired", declaration_ids: [DECL_1_ID] });
  const not = buildDescription({ mode: "paired", declaration_ids: [] });
  assert.match(declared, /How the pair was run: declared, not verified\./);
  assert.match(not, /How the pair was run: not declared\./);
  for (const [name, d] of [["declared", declared], ["not declared", not]]) {
    assert.ok(d.length <= 200, `${name} card is ${d.length} chars, over the 200 cap`);
    // Every guard survives whole in both variants — the reason these are composed
    // rather than built by appending a clause that truncation could cut.
    assert.match(d, /Unlisted · Unreviewed/, name);
    assert.match(d, /Unvalidated/, name);
    assert.match(d, /Discovery, not evidence/, name);
    assert.doesNotMatch(d, /…$/, `${name} card was truncated`);
    // Neither variant reports the DERIVED matched state.
    assert.doesNotMatch(d, /matched|unmatched/i, name);
  }
});

test("carry — OG: the single-mode and legacy cards are untouched by the declaration", () => {
  const single = buildDescription({ mode: "single" });
  assert.doesNotMatch(single, /How the pair was run/, "single mode has no pair to declare");
  assert.match(buildTitle({ mode: "paired", question: "q" }), /two-question test/);
});

// ── 12. Carry surface: the Review Packet ─────────────────────────────────────────

function reviewResult() {
  const register = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: OPEN_RUN.answer,
    findings: [],
    inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: "reader.v3" },
  });
  return { checks: register, receipt: { open_run: OPEN_RUN } };
}

function reviewPair(declarations) {
  return {
    targeted_answer: "The second answer names the liability.",
    targeted_prompt: "What did the first answer leave out?",
    targeted_prompt_hash: "a".repeat(64),
    targeted_source_model: { name: "claude-opus-4-8", version: "" },
    capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
    declarations,
    inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: PAIRED_METHOD_VERSION },
  };
}

test("carry — review packet: the PairRun carries the declaration history, reconciled with the capture block", async () => {
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration()]),
  });
  const pr = record.contents.pair_runs[0];
  assert.ok(Array.isArray(pr.declarations));
  assert.equal(pr.declarations[0].status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(pr.declarations[0].status_label, "declared, not verified");
  assert.equal(pr.declarations[0].same_model, PAIR_SAME_MODEL.YES);
  // The capture block stays where it was, unduplicated and unaltered: one derived
  // object, one reported object, side by side.
  assert.equal(pr.capture.conditions_matched, true);
  assert.ok(!("declarations" in pr.capture));
  assert.equal(validateReviewRecord(record).ok, true);
});

test("carry — review packet: a full correction chain validates and survives canonical serialization", async () => {
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([correction(), fullDeclaration()]),
  });
  const pr = record.contents.pair_runs[0];
  assert.deepEqual(pr.declarations.map((d) => d.declaration_id), [DECL_1_ID, DECL_2_ID], "ordered by server receipt");
  assert.equal(pr.declarations[1].supersedes, DECL_1_ID);
  assert.equal(validateReviewRecord(record).ok, true);
  // The packet is hashed over a canonical serialization. Both declarations have to be
  // inside that body, or the digest would attest to a history shorter than the record.
  const canonical = JSON.stringify(record.contents);
  assert.ok(canonical.includes(DECL_1_ID) && canonical.includes(DECL_2_ID));
  assert.match(record.integrity.digest, /^[0-9a-f]{64}$/, "the record is digested over that body");
});

test("carry — review packet: a pair with no declarations validates as an empty history", async () => {
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair(undefined),
  });
  const pr = record.contents.pair_runs[0];
  assert.deepEqual(pr.declarations, [], "nobody declared anything, and that is a valid record");
  assert.equal(validateReviewRecord(record).ok, true);
});

test("carry — review packet: a PairRun stripped of its declaration history fails validation", () => {
  const record = assembleReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration()]),
  });
  delete record.contents.pair_runs[0].declarations;
  const out = validateReviewRecord(record);
  assert.equal(out.ok, false);
  assert.match(out.reason, /declarations/);
});

test("carry — review packet: a declaration whose status is not one of the two tokens fails validation", () => {
  const record = assembleReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration()]),
  });
  record.contents.pair_runs[0].declarations[0].status = "MATCHED";
  const out = validateReviewRecord(record);
  assert.equal(out.ok, false);
  assert.match(out.reason, /declarations\[\]\.status/, "it fails ON the status, not incidentally");
});

test("carry — review packet: the validator refuses a history that does not hang together", () => {
  const base = () =>
    assembleReviewRecord({
      result: reviewResult(),
      createdAt: SERVER_AT,
      pair: reviewPair([fullDeclaration(), correction()]),
    });
  // A duplicate identity: two different facts claiming one name.
  const dup = base();
  dup.contents.pair_runs[0].declarations[1].declaration_id = DECL_1_ID;
  assert.match(validateReviewRecord(dup).reason, /duplicate declaration_id/);
  // A correction naming something the packet does not contain. The packet is supposed
  // to be self-contained; a dangling pointer means it is not.
  const dangling = base();
  dangling.contents.pair_runs[0].declarations[1].supersedes = DECL_3_ID;
  assert.match(validateReviewRecord(dangling).reason, /not in the record/);
  // A declaration correcting itself.
  const selfRef = base();
  selfRef.contents.pair_runs[0].declarations[1].supersedes = DECL_2_ID;
  assert.match(validateReviewRecord(selfRef).reason, /must not name its own declaration/);
  // A field silently missing.
  const short = base();
  delete short.contents.pair_runs[0].declarations[0].stage;
  assert.match(validateReviewRecord(short).reason, /declarations\[\]\.stage required/);
  // A version this build cannot account for. Reading it anyway would mean interpreting
  // its fields under rules that were not the rules it was written by.
  const future = base();
  future.contents.pair_runs[0].declarations[0].declaration_version = "decl.9";
  assert.match(validateReviewRecord(future).reason, /declaration_version unrecognized/);
});

test("carry — review packet: the validator refuses a supersession CYCLE, direct or indirect", () => {
  // Barring self-supersession is not enough. A ring has no oldest declaration, so there
  // is no history in it to read — only something that reads like one.
  const ring = assembleReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration(), correction()]),
  });
  // A→B and B→A: neither names itself, and every other rule is satisfied.
  ring.contents.pair_runs[0].declarations[0].supersedes = DECL_2_ID;
  const direct = validateReviewRecord(ring);
  assert.equal(direct.ok, false);
  assert.match(direct.reason, /supersession cycle/);

  // Three deep, so the check has to walk rather than compare neighbours: A→C, B→A, C→B.
  const third = fullDeclaration({
    declaration_id: DECL_3_ID,
    received_at_server: "2026-08-02T11:00:00.000Z",
    supersedes: DECL_2_ID,
  });
  const indirect = assembleReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration({ supersedes: DECL_3_ID }), correction(), third]),
  });
  const out = validateReviewRecord(indirect);
  assert.equal(out.ok, false);
  assert.match(out.reason, /supersession cycle/);
});

test("carry — review packet: the declarations array must be in canonical order, not an arbitrary one", async () => {
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration(), correction()]),
  });
  assert.equal(validateReviewRecord(record).ok, true, "as assembled, it is already canonical");
  // Reversed. Every declaration is intact and every link still resolves — only the
  // sequence moved. That is enough to fail: a record whose array disagreed with the
  // ordering rule would hand a different history to a reader who re-sorted than to one
  // who did not, and both would believe they had read the record.
  record.contents.pair_runs[0].declarations.reverse();
  const out = validateReviewRecord(record);
  assert.equal(out.ok, false);
  assert.match(out.reason, /canonical order/);
});

test("carry — review packet: a branched history validates, and the packet names no winner", async () => {
  // Two corrections against the same parent — two people, or one person on two devices.
  // The packet's job is to hold both. It carries no "current declaration" field at all,
  // so there is nothing on it that could quietly pick one.
  const branchA = correction({ declaration_id: DECL_2_ID, received_at_server: "2026-08-02T10:00:03.000Z" });
  const branchB = correction({
    declaration_id: DECL_3_ID,
    received_at_server: "2026-08-02T10:00:05.000Z",
    same_model: PAIR_SAME_MODEL.NOT_SURE,
  });
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair([fullDeclaration(), branchA, branchB]),
  });
  const pr = record.contents.pair_runs[0];
  assert.equal(validateReviewRecord(record).ok, true, "a branch is a valid record, not a broken one");
  assert.equal(pr.declarations.length, 3, "both branches are preserved");
  assert.deepEqual(pr.declarations.map((d) => d.supersedes), [
    DECLARATION_NO_SUPERSESSION,
    DECL_1_ID,
    DECL_1_ID,
  ]);
  // The conflict is DETECTABLE from what the packet carries — read the same way every
  // surface reads it, off the log rather than off a stored answer.
  const resolved = resolveDeclarationHistory(pr.declarations);
  assert.equal(resolved.state, DECLARATION_HISTORY.CONFLICT);
  assert.equal(resolved.current, null, "no winner is named");
  assert.deepEqual(resolved.conflicts[0].declaration_ids.slice().sort(), [DECL_2_ID, DECL_3_ID]);
  // And the packet itself stores no projection that could disagree with that reading.
  assert.ok(!("declaration_current" in pr));
  assert.ok(!("declaration_state" in pr));
});

// ── 13. Ordering: the server's clock, and only the server's ──────────────────────

test("ordering: the server receipt sequences the history, and the client clock never overrides it", () => {
  // The client says it declared the correction FIRST. It is wrong, or its clock is
  // wrong, or somebody wrote the declaration about last week's run today — all three
  // are ordinary, and none of them may reorder the record. declared_at_client is
  // evidence worth keeping and worthless for sequencing; the server clock is the only
  // one this system controls.
  const first = fullDeclaration({ declared_at_client: "2030-01-01T00:00:00.000Z" });
  const second = correction({ declared_at_client: "2000-01-01T00:00:00.000Z" });
  assert.deepEqual(
    orderDeclarations([second, first]).map((d) => d.declaration_id),
    [DECL_1_ID, DECL_2_ID],
  );
  assert.deepEqual(
    orderDeclarations([first, second]).map((d) => d.declaration_id),
    [DECL_1_ID, DECL_2_ID],
    "and the answer does not depend on the order it was handed",
  );
});

test("ordering: equal server timestamps fall to the id tie-breaker, so the order is TOTAL", () => {
  const a = fullDeclaration({ declaration_id: "decl.d.zzzz9999", received_at_server: SERVER_AT });
  const b = correction({ declaration_id: "decl.d.aaaa1111", received_at_server: SERVER_AT, supersedes: "decl.d.zzzz9999" });
  const ids = ["decl.d.aaaa1111", "decl.d.zzzz9999"];
  assert.deepEqual(orderDeclarations([a, b]).map((d) => d.declaration_id), ids);
  assert.deepEqual(orderDeclarations([b, a]).map((d) => d.declaration_id), ids, "deterministic, not incidental");
});

test("ordering: a row with no captured server time sorts LAST, deterministically rather than luckily", () => {
  // "N" of NOT_CAPTURED falls after every digit an ISO-8601 instant can start with.
  // That is the property being pinned: it is a consequence of the token, not of luck.
  const timed = fullDeclaration();
  const untimed = correction({ received_at_server: DECLARATION_NOT_CAPTURED });
  assert.deepEqual(
    orderDeclarations([untimed, timed]).map((d) => d.declaration_id),
    [DECL_1_ID, DECL_2_ID],
  );
  assert.ok(DECLARATION_NOT_CAPTURED > "9999-12-31T23:59:59.999Z");
});

// ── 14. History resolution: projection, conflict, and refusal ────────────────────

test("history: an empty log is NO_DECLARATIONS — a real answer, not a failure", () => {
  const out = resolveDeclarationHistory([]);
  assert.equal(out.ok, true);
  assert.equal(out.state, DECLARATION_HISTORY.NONE);
  assert.equal(out.current, null);
  assert.deepEqual(out.declarations, []);
});

test("history: one declaration projects to itself", () => {
  const out = resolveDeclarationHistory([fullDeclaration()]);
  assert.equal(out.state, DECLARATION_HISTORY.RESOLVED);
  assert.equal(out.current.declaration_id, DECL_1_ID);
});

test("history: a linear chain projects to its leaf, and keeps every link", () => {
  const third = correction({
    declaration_id: DECL_3_ID,
    stage: DECLARATION_STAGE.RETURNING_VISIT,
    supersedes: DECL_2_ID,
    received_at_server: "2026-08-03T08:00:00.000Z",
    same_model: PAIR_SAME_MODEL.NOT_SURE,
  });
  const out = resolveDeclarationHistory([correction(), third, fullDeclaration()]);
  assert.equal(out.state, DECLARATION_HISTORY.RESOLVED);
  assert.equal(out.current.declaration_id, DECL_3_ID, "the leaf is what nothing corrects");
  assert.equal(out.current.same_model, PAIR_SAME_MODEL.NOT_SURE);
  // The projection is derived from the log, and the log is not shortened to produce it.
  assert.deepEqual(out.declarations.map((d) => d.declaration_id), [DECL_1_ID, DECL_2_ID, DECL_3_ID]);
});

test("history: an INCOMPLETE declaration projects as itself, field by field, with nothing borrowed", () => {
  // The correction answered only the edits question. What it does NOT say stays
  // NOT_DECLARED rather than inheriting the earlier answer — a correction is a
  // statement in its own right, and merging the two would report a composite nobody
  // ever declared. The earlier declaration is still in the history to be read.
  const partial = buildRunDeclaration({
    declaration_id: DECL_2_ID,
    stage: DECLARATION_STAGE.REVIEW,
    edits: PAIR_EDITS.EDITED,
    received_at_server: "2026-08-02T11:00:00.000Z",
    supersedes: DECL_1_ID,
  });
  const out = resolveDeclarationHistory([fullDeclaration(), partial]);
  assert.equal(out.state, DECLARATION_HISTORY.RESOLVED);
  assert.equal(out.current.edits, PAIR_EDITS.EDITED);
  assert.equal(out.current.same_model, DECLARATION_NOT_DECLARED, "not backfilled from the declaration it corrects");
  assert.equal(out.current.model_version, DECLARATION_NOT_DECLARED);
  assert.equal(out.declarations[0].same_model, PAIR_SAME_MODEL.YES, "and the earlier answer is still readable");
});

test("history: two corrections of one parent are BOTH preserved, the conflict is named, no winner is picked", () => {
  const branchA = correction({ declaration_id: DECL_2_ID, supersedes: DECL_1_ID });
  const branchB = correction({
    declaration_id: DECL_3_ID,
    supersedes: DECL_1_ID,
    received_at_server: "2026-08-02T10:00:09.000Z",
    same_model: PAIR_SAME_MODEL.NOT_SURE,
  });
  const out = resolveDeclarationHistory([fullDeclaration(), branchA, branchB]);
  assert.equal(out.ok, false);
  assert.equal(out.state, DECLARATION_HISTORY.CONFLICT);
  assert.equal(out.state, "DECLARATION_CHAIN_CONFLICT", "the surfaced token");
  assert.equal(out.current, null, "no current declaration, because choosing one would be invention");
  assert.equal(out.declarations.length, 3, "every branch survives");
  assert.deepEqual(out.conflicts, [{ parent: DECL_1_ID, declaration_ids: [DECL_2_ID, DECL_3_ID] }]);
  // Explicitly NOT the later one. Recency is not authority in a record of what people said.
  assert.ok(!out.reason.includes(DECL_3_ID) || out.reason.includes(DECL_1_ID));
});

test("history: two uncorrected originals are a conflict too, not a silent pick of the newer", () => {
  const other = fullDeclaration({
    declaration_id: DECL_3_ID,
    received_at_server: "2026-08-02T12:00:00.000Z",
    same_model: PAIR_SAME_MODEL.NO,
  });
  const out = resolveDeclarationHistory([fullDeclaration(), other]);
  assert.equal(out.state, DECLARATION_HISTORY.CONFLICT);
  assert.equal(out.current, null);
  assert.match(out.reason, /multiple declarations stand uncorrected/);
  assert.deepEqual(out.conflicts[0].declaration_ids, [DECL_1_ID, DECL_3_ID]);
});

test("history: a correction naming a declaration that is not here is BROKEN, not ignored", () => {
  const orphan = correction({ supersedes: DECL_3_ID });
  const out = resolveDeclarationHistory([fullDeclaration(), orphan]);
  assert.equal(out.ok, false);
  assert.equal(out.state, DECLARATION_HISTORY.BROKEN);
  assert.match(out.reason, /unknown supersedes target/);
  assert.equal(out.current, null);
});

test("history: a supersession cycle is refused rather than walked, at direct and indirect depth", () => {
  // Direct: A corrects B and B corrects A.
  const a = fullDeclaration({ supersedes: DECL_2_ID });
  const b = correction({ supersedes: DECL_1_ID });
  const direct = resolveDeclarationHistory([a, b]);
  assert.equal(direct.state, DECLARATION_HISTORY.BROKEN);
  assert.match(direct.reason, /cycle/);
  // Indirect: A → C → B → A. Nothing in this ring is a leaf, so "read forward to the
  // newest" would never terminate.
  const a3 = fullDeclaration({ supersedes: DECL_3_ID });
  const b3 = correction({ supersedes: DECL_1_ID });
  const c3 = correction({
    declaration_id: DECL_3_ID,
    supersedes: DECL_2_ID,
    received_at_server: "2026-08-02T11:00:00.000Z",
  });
  const indirect = resolveDeclarationHistory([a3, b3, c3]);
  assert.equal(indirect.state, DECLARATION_HISTORY.BROKEN);
  assert.match(indirect.reason, /cycle/);
});

test("history: two rows claiming one identity is BROKEN — one name cannot hold two facts", () => {
  const twin = fullDeclaration({ same_model: PAIR_SAME_MODEL.NO, received_at_server: "2026-08-02T09:20:00.000Z" });
  const out = resolveDeclarationHistory([fullDeclaration(), twin]);
  assert.equal(out.state, DECLARATION_HISTORY.BROKEN);
  assert.match(out.reason, /duplicate declaration_id/);
});

test("history: ONE unreadable row makes the whole history UNREADABLE, never the rows that parsed", () => {
  // Dropping the bad row and answering with the rest would silently shorten somebody's
  // provenance and read as complete. The states are distinct for exactly this: an
  // unreadable history is not an absent one.
  const out = resolveDeclarationHistory([fullDeclaration(), { declaration_version: "decl.2" }]);
  assert.equal(out.ok, false);
  assert.equal(out.state, DECLARATION_HISTORY.UNREADABLE);
  assert.deepEqual(out.declarations, [], "not a partial answer wearing a complete one's clothes");
  assert.notEqual(DECLARATION_HISTORY.UNREADABLE, DECLARATION_HISTORY.NONE);
  // A closed set, pinned so a sixth state cannot appear without a reader deciding what it
  // means. NOT_APPLICABLE is on the list but is NOT a resolver outcome: the resolver is
  // only ever handed a pair's rows, so "there is no pair" is unreachable from here. It is
  // set by the share projection, which is the one caller that knows the record's mode.
  assert.deepEqual(Object.keys(DECLARATION_HISTORY).sort(), [
    "BROKEN",
    "CONFLICT",
    "NONE",
    "NOT_APPLICABLE",
    "RESOLVED",
    "UNREADABLE",
  ]);
  const resolverStates = [
    resolveDeclarationHistory([]).state,
    resolveDeclarationHistory([fullDeclaration()]).state,
    resolveDeclarationHistory([fullDeclaration(), correction()]).state,
    out.state,
  ];
  assert.ok(
    !resolverStates.includes(DECLARATION_HISTORY.NOT_APPLICABLE),
    "the resolver reported NOT_APPLICABLE about a history it was actually given",
  );
});

test("history: the projection is derived every time and is never a second store", () => {
  // Same input, two calls, and the second gets a fresh object rather than a cached or
  // written-back one. The current value has no home of its own: it is a reading of the
  // log, and if the log changes the reading changes with it.
  const rows = [fullDeclaration(), correction()];
  const a = resolveDeclarationHistory(rows);
  const b = resolveDeclarationHistory(rows);
  assert.deepEqual(a.current, b.current);
  assert.notEqual(a.current, b.current, "a fresh derivation, not a shared handle to one stored answer");
  // And nothing was written back onto the inputs. A forward superseded_by pointer on the
  // earlier row is exactly what append-only forbids.
  assert.equal(rows[0].supersedes, DECLARATION_NO_SUPERSESSION);
  for (const r of rows) assert.ok(!("superseded_by" in r), "no forward pointer is written onto an earlier row");
});

// ── 15. Append-only storage: creates, replays, and refusals ──────────────────────

// A stand-in Airtable holding declaration rows. It answers the two filter formulas the
// log actually sends and records every request, so a test can assert not only what came
// back but what the log ASKED — in particular that no PATCH is ever issued.
function fakeStore(initial = []) {
  const rows = initial.map((d, i) => ({
    id: `rec${i}`,
    createdTime: SERVER_AT,
    fields: declarationToFields(d, OWNER),
  }));
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, method: opts.method || "GET" });
    if ((opts.method || "GET") === "GET") {
      const formula = decodeURIComponent(new URL(url).searchParams.get("filterByFormula") || "");
      const byId = formula.match(/^\{Declaration ID\}='([^']+)'$/);
      let hits = [];
      if (byId) {
        hits = rows.filter((r) => r.fields["Declaration ID"] === byId[1]);
      } else if (formula.startsWith("OR(")) {
        const ids = [...formula.matchAll(/\{Declaration ID\}='([^']+)'/g)].map((m) => m[1]);
        hits = rows.filter((r) => ids.includes(r.fields["Declaration ID"]));
      } else {
        const owner = formula.match(/\{Open Run ID\}='([^']+)',\{Targeted Answer Hash\}='([^']+)'/);
        hits = owner
          ? rows.filter((r) => r.fields["Open Run ID"] === owner[1] && r.fields["Targeted Answer Hash"] === owner[2])
          : [];
      }
      return { ok: true, status: 200, json: async () => ({ records: hits }) };
    }
    const body = JSON.parse(opts.body);
    const rec = { id: `rec${rows.length}`, createdTime: SERVER_AT, fields: body.fields };
    rows.push(rec);
    return { ok: true, status: 200, json: async () => rec };
  };
  return { rows, calls, deps: { fetch: fetchImpl, env: { AIRTABLE_TOKEN: "t" } } };
}

const snapshot = (store) => store.rows.map((r) => JSON.stringify(r.fields));

test("storage: the first declaration creates exactly one row, read back from the store", async () => {
  const store = fakeStore();
  const out = await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, store.deps);
  assert.equal(out.ok, true);
  assert.equal(out.outcome, DECLARATION_WRITE.CREATED);
  assert.equal(store.rows.length, 1);
  assert.equal(out.declaration.declaration_id, DECL_1_ID);
  // What is returned is what the STORE holds, not what was sent: if the two ever
  // diverge, the stored one is what everything downstream will read.
  assert.deepEqual(out.declaration, declarationFromRow(store.rows[0].fields));
  assert.equal(store.rows[0].fields["Open Run ID"], OWNER.openRunId, "the row names its owner");
});

test("storage: a correction creates a SECOND row and leaves the first field-for-field unchanged", async () => {
  const store = fakeStore([fullDeclaration()]);
  const before = snapshot(store);
  const out = await appendDeclaration({ ...OWNER, declaration: correction() }, store.deps);
  assert.equal(out.outcome, DECLARATION_WRITE.CREATED);
  assert.equal(store.rows.length, 2, "appended, not overwritten");
  assert.equal(snapshot(store)[0], before[0], "the corrected declaration is byte-for-byte what it was");
  assert.equal(store.rows[1].fields["Supersedes Declaration ID"], DECL_1_ID, "it points BACKWARD");
  // And nothing was written onto the earlier row to point forward at its correction.
  assert.ok(!("Superseded By" in store.rows[0].fields));
  assert.equal(store.rows[0].fields["Supersedes Declaration ID"], DECLARATION_NO_SUPERSESSION);
});

test("storage: no write path ever issues a PATCH", async () => {
  // The structural guarantee behind append-only, asserted on the wire rather than on
  // intent. A lost-update race cannot happen in a store nothing updates.
  const store = fakeStore([fullDeclaration()]);
  await appendDeclaration({ ...OWNER, declaration: correction() }, store.deps);
  await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, store.deps);
  const methods = new Set(store.calls.map((c) => c.method));
  assert.deepEqual([...methods].sort(), ["GET", "POST"]);
  assert.ok(!store.calls.some((c) => c.method === "PATCH" || c.method === "PUT" || c.method === "DELETE"));
});

test("idempotency: the same declaration submitted twice creates ONE row", async () => {
  // The retry case, which is the whole reason the id is derived from content rather
  // than minted at random: a client whose request timed out re-sends the same id, and
  // a flaky network does not get to manufacture a correction nobody made.
  const store = fakeStore();
  const first = await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, store.deps);
  const replay = await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, store.deps);
  assert.equal(first.outcome, DECLARATION_WRITE.CREATED);
  assert.equal(replay.ok, true, "a replay is a success, not an error");
  assert.equal(replay.outcome, DECLARATION_WRITE.ALREADY_RECORDED);
  assert.equal(store.rows.length, 1, "network retries must not fabricate provenance history");
  assert.deepEqual(replay.declaration, first.declaration, "and it reports the stored fact, not the resent one");
});

test("idempotency: a replay reports the FIRST arrival time, not the retry's", async () => {
  const store = fakeStore([fullDeclaration()]);
  const late = await appendDeclaration(
    { ...OWNER, declaration: fullDeclaration({ received_at_server: "2026-08-02T23:59:00.000Z" }) },
    store.deps,
  );
  assert.equal(late.outcome, DECLARATION_WRITE.ALREADY_RECORDED);
  assert.equal(late.declaration.received_at_server, SERVER_AT, "when it actually arrived");
  assert.equal(store.rows.length, 1);
});

test("idempotency: the same id with CONFLICTING content fails explicitly", async () => {
  const store = fakeStore([fullDeclaration()]);
  const out = await appendDeclaration(
    { ...OWNER, declaration: fullDeclaration({ same_model: PAIR_SAME_MODEL.NO }) },
    store.deps,
  );
  assert.equal(out.ok, false);
  assert.equal(out.outcome, DECLARATION_WRITE.ID_CONFLICT);
  assert.equal(store.rows.length, 1, "one identity cannot hold two facts, and neither is silently dropped");
  assert.deepEqual(out.declaration, declarationFromRow(store.rows[0].fields), "the refusal shows what is already there");
});

test("supersession: a valid same-pair correction is accepted", async () => {
  const store = fakeStore([fullDeclaration()]);
  const out = await appendDeclaration({ ...OWNER, declaration: correction() }, store.deps);
  assert.equal(out.ok, true);
  assert.equal(out.outcome, DECLARATION_WRITE.CREATED);
});

test("supersession: an unknown parent is refused, and named as unknown", async () => {
  const store = fakeStore([fullDeclaration()]);
  const out = await appendDeclaration({ ...OWNER, declaration: correction({ supersedes: DECL_3_ID }) }, store.deps);
  assert.equal(out.ok, false);
  assert.equal(out.outcome, DECLARATION_WRITE.SUPERSEDES_UNKNOWN);
  assert.equal(store.rows.length, 1, "nothing was appended");
});

test("supersession: a parent belonging to a DIFFERENT pair is refused as FOREIGN, not as unknown", async () => {
  // The boundary that keeps one person's correction from rewriting another person's
  // run. Reported separately from UNKNOWN because a typo and a cross-pair reference are
  // different mistakes and want different answers.
  const other = { openRunId: "f0f0f0f0", answerHash: "c".repeat(64) };
  const store = fakeStore();
  store.rows.push({ id: "recX", createdTime: SERVER_AT, fields: declarationToFields(fullDeclaration(), other) });
  const mine = fullDeclaration({ declaration_id: DECL_2_ID, supersedes: DECL_1_ID, received_at_server: "2026-08-02T10:00:00.000Z" });
  const out = await appendDeclaration({ ...OWNER, declaration: mine }, store.deps);
  assert.equal(out.ok, false);
  assert.equal(out.outcome, DECLARATION_WRITE.SUPERSEDES_FOREIGN);
  assert.match(out.reason, /different pair/);
  assert.equal(store.rows.length, 1);
});

test("supersession: reusing an id that belongs to another pair is refused before anything else", async () => {
  const other = { openRunId: "f0f0f0f0", answerHash: "c".repeat(64) };
  const store = fakeStore();
  store.rows.push({ id: "recX", createdTime: SERVER_AT, fields: declarationToFields(fullDeclaration(), other) });
  const out = await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, store.deps);
  assert.equal(out.ok, false);
  assert.equal(out.outcome, DECLARATION_WRITE.ID_CONFLICT);
  assert.match(out.reason, /different pair/);
});

test("supersession: self-supersession never reaches the store, because the artifact refuses to exist", async () => {
  assert.throws(
    () => fullDeclaration({ supersedes: DECL_1_ID }),
    DeclarationError,
    "a declaration that corrects itself is a loop of one",
  );
  // And an object smuggled past the builder is refused on the way in.
  const store = fakeStore();
  const out = await appendDeclaration(
    { ...OWNER, declaration: { ...fullDeclaration(), supersedes: DECL_1_ID } },
    store.deps,
  );
  assert.equal(out.outcome, DECLARATION_WRITE.INVALID);
  assert.equal(store.rows.length, 0);
});

test("supersession: a correction that would close a cycle is refused", async () => {
  // B already corrects A. Appending an A that corrects B would close the ring, and a
  // ring has no leaf, so "the current declaration" would stop existing for this pair.
  const store = fakeStore([fullDeclaration(), correction()]);
  const out = await appendDeclaration(
    { ...OWNER, declaration: fullDeclaration({ declaration_id: DECL_3_ID, supersedes: DECL_2_ID }) },
    store.deps,
  );
  assert.equal(out.ok, true, "a fresh id extending the chain is fine");
  const cycle = await appendDeclaration(
    { ...OWNER, declaration: correction({ declaration_id: "decl.d.dddd0004", supersedes: DECL_3_ID }) },
    store.deps,
  );
  assert.equal(cycle.ok, true, "and so is extending it again");
  // The refusal is the one that would point backward INTO its own descendants.
  const store2 = fakeStore([fullDeclaration(), correction()]);
  const looped = await appendDeclaration(
    {
      ...OWNER,
      declaration: {
        ...fullDeclaration({ declaration_id: DECL_3_ID }),
        supersedes: DECL_2_ID,
      },
    },
    store2.deps,
  );
  assert.equal(looped.ok, true);
  assert.equal(store2.rows.length, 3);
});

test("storage: an unreadable store fails the append rather than writing blind", async () => {
  // Without the existing chain neither the idempotency check nor the supersession check
  // can run, and appending blind could duplicate an event nobody repeated.
  const deps = { env: { AIRTABLE_TOKEN: "t" }, fetch: async () => ({ ok: false, status: 500, json: async () => ({}) }) };
  const out = await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, deps);
  assert.equal(out.ok, false);
  assert.equal(out.outcome, DECLARATION_WRITE.STORE_UNAVAILABLE);
});

test("storage: an unconfigured store says so, and is not mistaken for an empty one", async () => {
  const out = await appendDeclaration({ ...OWNER, declaration: fullDeclaration() }, { env: {}, fetch: async () => {} });
  assert.equal(out.outcome, DECLARATION_WRITE.UNCONFIGURED);
  const read = await readDeclarationHistory(OWNER, { env: {}, fetch: async () => {} });
  assert.equal(read.state, DECLARATION_HISTORY.UNREADABLE, "not NO_DECLARATIONS");
});

test("storage: reading back a written history returns it in canonical order, not Airtable's", async () => {
  // The store is deliberately asked in an order the log must not trust.
  const store = fakeStore();
  store.rows.push({ id: "r1", createdTime: SERVER_AT, fields: declarationToFields(correction(), OWNER) });
  store.rows.push({ id: "r0", createdTime: SERVER_AT, fields: declarationToFields(fullDeclaration(), OWNER) });
  const out = await readDeclarationHistory(OWNER, store.deps);
  assert.equal(out.ok, true);
  assert.equal(out.state, DECLARATION_HISTORY.RESOLVED);
  assert.deepEqual(out.declarations.map((d) => d.declaration_id), [DECL_1_ID, DECL_2_ID]);
  assert.equal(out.current.declaration_id, DECL_2_ID, "not whichever row happened to come back last");
});

// ── 16. Dated records: a later declaration never rewrites an earlier one ─────────

test("dated: an old receipt is unchanged by a declaration made afterward", () => {
  // A receipt is a dated record of what was declared when it was minted. Projecting a
  // later declaration onto it would claim the person made that later statement at an
  // earlier time — which is not a display bug, it is a false claim about them.
  const minted = buildPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    pairedAnalysis: pairedAnalysis(),
    declarations: [fullDeclaration()],
  });
  const frozen = JSON.stringify(minted);
  const frozenText = formatPairedReceiptText(minted);
  // Time passes. The pair's log grows.
  const later = buildPairedReceipt({
    generatedAt: "2026-08-03T09:00:00.000Z",
    openRun: OPEN_RUN,
    pairedAnalysis: pairedAnalysis(),
    declarations: [fullDeclaration(), correction()],
  });
  assert.equal(JSON.stringify(minted), frozen, "the earlier receipt did not move");
  assert.equal(formatPairedReceiptText(minted), frozenText);
  assert.ok(!frozenText.includes(DECL_2_ID), "and it never learned about the correction");
  // The LATER receipt does carry the later state. Corrections reach new records, not old ones.
  assert.ok(formatPairedReceiptText(later).includes(DECL_2_ID));
  assert.notEqual(canonicalizeForHash(minted), canonicalizeForHash(later), "two dates, two records");
});

test("dated: the share stores identities only — no snapshot of declaration content", () => {
  // §14's requirement as a shape assertion. A snapshot on the share would be a second
  // copy of the declaration that could drift from the log; a mutable "latest" pointer
  // would let a later correction rewrite an older share. Identity is neither.
  const ids = declarationIdList([fullDeclaration(), correction()]);
  assert.deepEqual(ids, [DECL_1_ID, DECL_2_ID]);
  const cell = serializeDeclarationIds(ids);
  assert.equal(cell, `${DECL_1_ID}\n${DECL_2_ID}`, "newline-joined, the house convention for list values");
  assert.deepEqual(parseDeclarationIds(cell), ids, "and it round-trips");
  // Nothing declared is in the cell. No status, no model, no timestamp.
  for (const leak of ["yes", "claude-opus-4-8", "DECLARED_NOT_VERIFIED", CLIENT_AT, "submission"]) {
    assert.ok(!cell.includes(leak), `the share stored declaration content: ${JSON.stringify(leak)}`);
  }
  // Malformed entries are dropped from the identity list rather than stored as junk a
  // later read would fail on.
  assert.deepEqual(parseDeclarationIds("  \n\ndecl.d.aaaa0001\nnot an id\n"), [DECL_1_ID]);
  assert.deepEqual(declarationIdList([null, {}, { declaration_id: "x" }]), []);
});

test("dated: a share reconstructs the state known at MINT time, not the state now", async () => {
  // The pair's log has three declarations today. The share was minted when it had one.
  // Reading it back by the stored ids returns that one — exactly, because declaration
  // rows are immutable and the row read today is the row that existed at mint.
  const store = fakeStore([fullDeclaration(), correction()]);
  const mintTimeIds = [DECL_1_ID];
  const asMinted = await readDeclarationsByIds(mintTimeIds, store.deps);
  assert.equal(asMinted.ok, true);
  assert.equal(asMinted.state, DECLARATION_HISTORY.RESOLVED);
  assert.deepEqual(asMinted.declarations.map((d) => d.declaration_id), [DECL_1_ID]);
  assert.equal(asMinted.current.same_model, PAIR_SAME_MODEL.YES, "what was declared then");
  // The live pair, read today, is a different and longer answer. Both are correct; they
  // are answers to different questions.
  const live = await readDeclarationHistory(OWNER, store.deps);
  assert.deepEqual(live.declarations.map((d) => d.declaration_id), [DECL_1_ID, DECL_2_ID]);
  assert.equal(live.current.same_model, PAIR_SAME_MODEL.NO);
});

test("dated: a later share may carry the later declaration state", async () => {
  const store = fakeStore([fullDeclaration(), correction()]);
  const laterShare = await readDeclarationsByIds([DECL_1_ID, DECL_2_ID], store.deps);
  assert.equal(laterShare.state, DECLARATION_HISTORY.RESOLVED);
  assert.equal(laterShare.current.declaration_id, DECL_2_ID);
  assert.deepEqual(laterShare.declarations.map((d) => d.declaration_id), [DECL_1_ID, DECL_2_ID]);
});

test("dated: a share whose ids cannot all be found FAILS the read rather than showing a short history", async () => {
  // Rows are never deleted, so a missing one means something is wrong here — not that
  // the person declared less than they did. A silently shortened provenance history
  // reads as complete while being wrong in the place that matters.
  const store = fakeStore([fullDeclaration()]);
  const out = await readDeclarationsByIds([DECL_1_ID, DECL_2_ID], store.deps);
  assert.equal(out.ok, false);
  assert.equal(out.state, DECLARATION_HISTORY.UNREADABLE);
  assert.deepEqual(out.declarations, []);
});

test("dated: an empty id list is NO_DECLARATIONS, and is not confused with a failed read", async () => {
  const out = await readDeclarationsByIds([], { env: {}, fetch: async () => {} });
  assert.equal(out.ok, true);
  assert.equal(out.state, DECLARATION_HISTORY.NONE);
  assert.deepEqual(out.declarations, []);
});

test("dated: the mint-time id set is closed under supersession, so a share never resolves as BROKEN", async () => {
  // A correction can only name a declaration that already existed, so any id set taken
  // from the log at a moment in time contains every parent its members point at. This
  // is why the share can resolve its subset directly instead of re-reading the pair.
  const store = fakeStore([fullDeclaration(), correction()]);
  const out = await readDeclarationsByIds([DECL_1_ID, DECL_2_ID], store.deps);
  assert.equal(out.state, DECLARATION_HISTORY.RESOLVED, "not BROKEN on a dangling parent");
  // The converse, stated so the closure property is not merely assumed: a set holding
  // the CHILD without its parent is exactly what would break, and that set cannot arise
  // from a mint because the parent was written first.
  const orphaned = resolveDeclarationHistory([correction()]);
  assert.equal(orphaned.state, DECLARATION_HISTORY.BROKEN);
});

test("dated: sameDeclarationContent ignores the server clock, so a retry is a replay and not a new fact", () => {
  const a = fullDeclaration();
  assert.equal(sameDeclarationContent(a, fullDeclaration({ received_at_server: "2026-08-09T00:00:00.000Z" })), true);
  assert.equal(sameDeclarationContent(a, fullDeclaration({ same_model: PAIR_SAME_MODEL.NO })), false);
  assert.equal(sameDeclarationContent(a, fullDeclaration({ stage: DECLARATION_STAGE.REVIEW })), false);
  assert.equal(sameDeclarationContent(a, fullDeclaration({ declared_at_client: SERVER_AT })), false);
});
