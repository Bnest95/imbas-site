// run-declaration-provenance — the run-conditions DECLARATION artifact, end to end.
//
// The governing distinction this file exists to hold: the declaration is evidence of
// what the person REPORTED. It is not evidence that the conditions actually matched.
// The derived matched/unmatched state stays client-side, unpersisted and unhashed, and
// the two must never be readable as one.
//
// Gates:
//   1. The four absence states, each held separately —
//        supplied    → the declared values survive verbatim
//        omitted     → NOT_DECLARED, never a negative or unmatched reading
//        incomplete  → supplied fields preserved, remainder undeclared FIELD BY FIELD
//        derivation  → DERIVATION_UNAVAILABLE, never inferred from the declaration
//   2. The declaration/derivation separation — structural, not a rule to remember:
//      derivationState reads the capture and only the capture; the declaration holds
//      no derived key and the capture holds no declared one; and they ride in separate
//      objects on the PairRun.
//   3. Timestamps: declared_at_client is NEVER manufactured from received_at_server.
//   4. One mapping owns the display copy, and the label travels on every surface —
//      receipt (both paired builders), Airtable row, share permalink, OG projection,
//      Review Packet.
//   5. cfp.1 separation: nothing in this family is named `conditions`, and the
//      inspector's condition fingerprint is untouched by it.
//
// Content-blind: synthetic answers only. Run:
//   node --test test/run-declaration-provenance.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DECLARATION_VERSION,
  DECLARATION_NOT_DECLARED,
  DECLARATION_NOT_CAPTURED,
  DECLARATION_STATUS,
  DECLARATION_STATUS_LABEL,
  DECLARATION_SOURCE,
  DERIVATION_UNAVAILABLE,
  declarationStatusLabel,
  buildRunDeclaration,
  sanitizeRunDeclaration,
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

// ── Fixtures ─────────────────────────────────────────────────────────────────────

const CLIENT_AT = "2026-08-02T09:15:00.000Z";
const SERVER_AT = "2026-08-02T09:15:04.000Z";

// A complete declaration: all three answered, both instants present.
function fullDeclaration(over = {}) {
  return buildRunDeclaration({
    same_model: PAIR_SAME_MODEL.YES,
    model_version: "claude-opus-4-8",
    edits: PAIR_EDITS.NONE,
    declared_at_client: CLIENT_AT,
    received_at_server: SERVER_AT,
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
  const d = buildRunDeclaration({ received_at_server: SERVER_AT });
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

test("omitted: a missing, malformed, or hostile input sanitizes to NOT_DECLARED, never to a declaration", () => {
  for (const raw of [undefined, null, "", 0, [], "DECLARED_NOT_VERIFIED", { status: "MATCHED" }]) {
    const d = sanitizeRunDeclaration(raw);
    assert.equal(d.status, DECLARATION_STATUS.NOT_DECLARED, `input ${JSON.stringify(raw)} must not declare`);
    assert.equal(d.status_label, "not declared");
    assert.equal(d.same_model, DECLARATION_NOT_DECLARED);
  }
});

// ── 3. Absence state: DECLARATION INCOMPLETE ─────────────────────────────────────

test("incomplete: supplied fields are preserved and the remainder is marked FIELD BY FIELD", () => {
  // Answered the model question, skipped the edits question and the version box.
  const d = buildRunDeclaration({
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
  const other = buildRunDeclaration({ edits: PAIR_EDITS.EDITED, received_at_server: SERVER_AT });
  assert.equal(other.edits, PAIR_EDITS.EDITED);
  assert.equal(other.same_model, DECLARATION_NOT_DECLARED);
  assert.equal(other.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
});

test("incomplete: an unrecognized value for a field is that field's absence, not the whole artifact's", () => {
  const d = buildRunDeclaration({
    same_model: "maybe-ish",
    edits: PAIR_EDITS.NONE,
    received_at_server: SERVER_AT,
  });
  assert.equal(d.same_model, DECLARATION_NOT_DECLARED, "an unrecognized answer is not recorded as an answer");
  assert.equal(d.edits, PAIR_EDITS.NONE, "the neighbouring field is untouched");
  assert.equal(d.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
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
    // No declaration supplied at all.
  });
  assert.equal(run.declaration.status, DECLARATION_STATUS.NOT_DECLARED);
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
    declaration: fullDeclaration(),
    initiator: PAIR_INITIATOR.INSPECTION_FOLLOWUP,
  });
  assert.equal(typeof run.capture, "object");
  assert.equal(typeof run.declaration, "object");
  assert.ok(!("declaration" in run.capture), "the declaration is not nested inside the derivation");
  assert.ok(!("capture" in run.declaration), "the derivation is not nested inside the declaration");
  assert.equal(run.declaration.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(run.capture.conditions_matched, true);
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
      ...reviewPair(fullDeclaration({ same_model: PAIR_SAME_MODEL.YES })),
      capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.NOT_SURE, edits: PAIR_EDITS.NONE }),
    },
  });
  const pr = record.contents.pair_runs[0];
  assert.equal(pr.declaration.same_model, PAIR_SAME_MODEL.YES, "what was reported");
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
  const d = buildRunDeclaration({ received_at_server: SERVER_AT });
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
    status: DECLARATION_STATUS.NOT_DECLARED,
    status_label: "conditions matched",
    same_model: "yes",
  });
  assert.equal(lying.status, DECLARATION_STATUS.NOT_DECLARED);
  assert.equal(lying.status_label, "not declared", "the stored wording is discarded, not trusted");
});

test("version: content is echoed, shape is stamped — every artifact states which shape it is", () => {
  // The version describes the OBJECT in hand, not the row it was read from. sanitize
  // returns decl.1 keys and decl.1 absence tokens whatever it was handed, so decl.1 is
  // what it says.
  for (const input of [undefined, null, {}, "nonsense", { status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED, same_model: "yes" }]) {
    const d = sanitizeRunDeclaration(input);
    assert.equal(d.declaration_version, DECLARATION_VERSION, `no version on ${JSON.stringify(input)}`);
    assert.notEqual(d.declaration_version, "", "a blank version is the empty cell the absence tokens exist to avoid");
  }
  // A future decl.2 row read by decl.1 code is NOT echoed as decl.2: this function
  // dropped whatever decl.2 added, so claiming that version would promise a reader
  // fields the return does not carry.
  const future = sanitizeRunDeclaration({
    declaration_version: "decl.2",
    status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED,
    same_model: "yes",
    some_decl_2_field: "dropped",
  });
  assert.equal(future.declaration_version, DECLARATION_VERSION, "the version describes the object, not its source row");
  assert.ok(!("some_decl_2_field" in future), "and the object really is only decl.1 wide");
  // The status, by contrast, IS read off the input: it is what the person said.
  assert.equal(future.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(future.same_model, "yes");
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

test("cfp.1: the Airtable columns are named Declared*/Declaration*, never Conditions*", () => {
  const src = readFileSync(new URL("../api/read-paired.js", import.meta.url), "utf8");
  const block = src.slice(src.indexOf("function declarationFields"), src.indexOf("function declarationFromRecord"));
  const columns = [...block.matchAll(/"([A-Z][A-Za-z ]+)":/g)].map((m) => m[1]);
  assert.equal(columns.length, 7, "seven declaration columns");
  for (const c of columns) {
    assert.match(c, /^(Declaration|Declared|Received) /, `column "${c}" is not in the declaration vocabulary`);
    assert.doesNotMatch(c, /Condition/, `column "${c}" collides with the cfp.1 family`);
  }
});

// ── 10. Carry surface: the receipt (BOTH paired builders) ────────────────────────

test("carry — receipt: both paired builders hold the declaration as a sibling of the analysis", () => {
  const d = fullDeclaration();
  const paired = buildPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    pairedAnalysis: pairedAnalysis(),
    declaration: d,
  });
  const chip = buildChipPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    chipAnalysis: chipAnalysis(),
    declaration: d,
  });
  for (const [name, env] of [["paired", paired], ["chip", chip]]) {
    assert.equal(env.run_declaration.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED, name);
    assert.equal(env.run_declaration.status_label, "declared, not verified", name);
    // Sibling of the analysis, not folded into it — the shapes stay separable.
    assert.ok(!("run_declaration" in (env.paired_analysis || env.chip_analysis || {})), name);
  }
});

test("carry — receipt: an absent declaration is null on the envelope, and the text says so in words", () => {
  const env = buildPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, pairedAnalysis: pairedAnalysis() });
  assert.equal(env.run_declaration, null);
  const text = formatPairedReceiptText(env);
  assert.match(text, /HOW THIS PAIR WAS RUN \(declared by the person, not verified\)/);
  assert.match(text, /No declaration was recorded with this run\./);
  assert.doesNotMatch(text, /unmatched/i, "an absent declaration never prints as unmatched");
});

test("carry — receipt: the status label prints on both text formatters, alongside its token", () => {
  const d = fullDeclaration();
  const pairedText = formatPairedReceiptText(
    buildPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, pairedAnalysis: pairedAnalysis(), declaration: d }),
  );
  const chipText = formatChipPairedReceiptText(
    buildChipPairedReceipt({ generatedAt: SERVER_AT, openRun: OPEN_RUN, chipAnalysis: chipAnalysis(), declaration: d }),
  );
  for (const [name, text] of [["paired", pairedText], ["chip", chipText]]) {
    assert.match(text, /Status: declared, not verified \(DECLARED_NOT_VERIFIED\)/, name);
    assert.match(text, /Same AI for both answers: yes/, name);
    assert.match(text, /Declared at \(client\): 2026-08-02T09:15:00\.000Z/, name);
    assert.match(text, /Received at \(server\): 2026-08-02T09:15:04\.000Z/, name);
    assert.match(text, /Declaration source: pair_capture_client_declaration/, name);
    // The receipt states what was declared and stops. It never states the derived
    // conditions conclusion, in this section or anywhere else.
    assert.doesNotMatch(text, /conditions matched/i, name);
  }
});

test("carry — receipt: the declaration enters the hashed body, and the derived state does not", () => {
  const withDecl = buildPairedReceipt({
    generatedAt: SERVER_AT,
    openRun: OPEN_RUN,
    pairedAnalysis: pairedAnalysis(),
    declaration: fullDeclaration(),
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
    take("function declarationHtml", "function renderPaired") +
    "\nreturn declarationHtml;";
  return new Function(body)();
}

test("carry — share: a declared run renders every value under the status label", () => {
  const declarationHtml = loadInspectionRenderer();
  const html = declarationHtml({
    run_declaration: {
      status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED,
      status_label: "declared, not verified",
      same_model: "yes",
      model_version: "GPT-5",
      edits: "none",
      declared_at_client: "2026-07-17T11:58:00Z",
      received_at_server: "2026-07-17T11:59:00Z",
    },
  });
  // The label leads the heading: the first thing read about these values is that
  // nobody checked them.
  assert.match(html, /How this pair was run — declared, not verified/);
  assert.match(html, /Imbas did not verify them\./);
  // Each declared value survives to the page as its own row, in the form's vocabulary.
  for (const v of ["yes", "GPT-5", "none", "2026-07-17T11:58:00Z", "2026-07-17T11:59:00Z"]) {
    assert.ok(html.includes(v), `the share dropped the declared value ${JSON.stringify(v)}`);
  }
  // The stored token rides along for the stylesheet, and the derived conclusion does
  // not appear in any form a reader could take for a verified one.
  assert.match(html, /data-state="DECLARED_NOT_VERIFIED"/);
  for (const forbidden of ["conditions_matched", "matched", "unmatched", "unverified"]) {
    assert.ok(!html.includes(forbidden), `the share rendered the derived word ${JSON.stringify(forbidden)}`);
  }
});

test("carry — share: an undeclared run says so, and says what it does not mean", () => {
  const declarationHtml = loadInspectionRenderer();
  const html = declarationHtml({
    run_declaration: {
      status: DECLARATION_STATUS.NOT_DECLARED,
      status_label: "not declared",
      same_model: DECLARATION_NOT_DECLARED,
      model_version: DECLARATION_NOT_DECLARED,
      edits: DECLARATION_NOT_DECLARED,
      declared_at_client: "NOT_CAPTURED",
      received_at_server: "2026-07-17T11:59:00Z",
    },
  });
  assert.match(html, /How this pair was run — not declared/);
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

test("carry — share: a record with no declaration at all renders nothing, not an empty frame", () => {
  const declarationHtml = loadInspectionRenderer();
  // A legacy share minted before this pass. The section is omitted entirely rather
  // than drawing a heading over nothing — there is no artifact to report on.
  assert.equal(declarationHtml({}), "");
  assert.equal(declarationHtml(null), "");
});

test("carry — share: declared values are escaped, never interpolated raw", () => {
  const declarationHtml = loadInspectionRenderer();
  // model_version is free text a stranger types into the paste-back form and the
  // endpoint stores verbatim, so it reaches this page unfiltered.
  const html = declarationHtml({
    run_declaration: {
      status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED,
      status_label: "declared, not verified",
      same_model: "yes",
      model_version: '<img src=x onerror="alert(1)">',
      edits: "none",
      declared_at_client: "NOT_CAPTURED",
      received_at_server: "2026-07-17T11:59:00Z",
    },
  });
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
  const block = src.slice(src.indexOf("function declarationHtml"), src.indexOf("function renderPaired"));
  // Read off the source rather than the output, because this is a claim about where
  // the words LIVE. The renderer tests above prove the label arrives; this one proves
  // it arrived from the record, so DECLARATION_STATUS_LABEL stays the only place the
  // wording is written and this page cannot drift from it.
  assert.match(block, /d\.status_label/, "the label is read off the record");
  assert.doesNotMatch(block, /declared, not verified/, "the page never writes its own copy of the wording");
  assert.doesNotMatch(block, /conditions_matched/, "the share carries no derived conclusion");
});

test("carry — OG: the paired card states how the pair was run, in both declaration states", () => {
  const declared = buildDescription({ mode: "paired", run_declaration: { status: DECLARATION_STATUS.DECLARED_NOT_VERIFIED } });
  const not = buildDescription({ mode: "paired", run_declaration: null });
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

function reviewPair(declaration) {
  return {
    targeted_answer: "The second answer names the liability.",
    targeted_prompt: "What did the first answer leave out?",
    targeted_prompt_hash: "a".repeat(64),
    targeted_source_model: { name: "claude-opus-4-8", version: "" },
    capture: buildPairCapture({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
    declaration,
    inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: PAIRED_METHOD_VERSION },
  };
}

test("carry — review packet: the PairRun carries the declaration and its label, reconciled with the capture block", async () => {
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair(fullDeclaration()),
  });
  const pr = record.contents.pair_runs[0];
  assert.equal(pr.declaration.status, DECLARATION_STATUS.DECLARED_NOT_VERIFIED);
  assert.equal(pr.declaration.status_label, "declared, not verified");
  assert.equal(pr.declaration.same_model, PAIR_SAME_MODEL.YES);
  // The capture block stays where it was, unduplicated and unaltered: one derived
  // object, one reported object, side by side.
  assert.equal(pr.capture.conditions_matched, true);
  assert.ok(!("declaration" in pr.capture));
  assert.equal(validateReviewRecord(record).ok, true);
});

test("carry — review packet: a pair with no declaration validates and records NOT_DECLARED", async () => {
  const record = await buildReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair(undefined),
  });
  const pr = record.contents.pair_runs[0];
  assert.equal(pr.declaration.status, DECLARATION_STATUS.NOT_DECLARED);
  assert.equal(pr.declaration.status_label, "not declared");
  assert.equal(validateReviewRecord(record).ok, true, "an absent declaration is a valid record, not an invalid one");
});

test("carry — review packet: a PairRun stripped of its declaration fails validation", () => {
  const record = assembleReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair(fullDeclaration()),
  });
  delete record.contents.pair_runs[0].declaration;
  const out = validateReviewRecord(record);
  assert.equal(out.ok, false);
  assert.match(out.reason, /declaration/);
});

test("carry — review packet: a declaration whose status is not one of the two tokens fails validation", () => {
  const record = assembleReviewRecord({
    result: reviewResult(),
    createdAt: SERVER_AT,
    pair: reviewPair(fullDeclaration()),
  });
  record.contents.pair_runs[0].declaration.status = "MATCHED";
  const out = validateReviewRecord(record);
  assert.equal(out.ok, false);
  assert.match(out.reason, /declaration\.status/, "it fails ON the status, not incidentally");
});
