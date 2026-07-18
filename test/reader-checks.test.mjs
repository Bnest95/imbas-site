// reader-checks — Check Register v1 object model (Reader v3 R3).
//
// Covers the lane's build gates against the FROZEN schema (docs/REVIEW-GRAPH-SCHEMA.md):
//   AT-1  gating (no Check without a resolving detector_event_id)
//   AT-2  quotability / both-ends silence (spans resolve exactly; unquotable → dropped)
//   AT-3  demonstration (finding_type matches detector_id; span-refs resolve; statement present)
//   AT-4  separation ("measurement findings" never returns local_integrity / profile)
//   AT-6  provenance rendering (every card carries family + detector_id + provisional)
//   AT-7  provisional invariant (register status provisional; no instrument-grade UI copy)
//   AT-9  ranking determinism (fixed inputs → identical top-3, input-order-independent)
//   AT-13 mode/family non-conflation (comparative event must not carry a verification
//         block; mechanical vs model-nominated vs profile verification never conflated)
//
// Synthetic fixtures only (content-blind on real capture substance): a pasted answer
// whose conclusion rests on an earlier proposition, both quotable verbatim.
//
// Run: node --test test/reader-checks.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CHECK_MODEL_VERSION,
  CHECK_UI,
  FINDING_TYPE_TO_DETECTOR,
  resolveSpan,
  resolveSpans,
  normalizeQuotes,
  assembleComparativeCheck,
  buildCheckRegister,
  buildCard,
  rankChecks,
  validateDetectorEvent,
  validateCheck,
  validateDemonstration,
  measurementFindings,
  comparativeChecks,
  localIntegrityChecks,
  profileChecks,
  mechanicallyVerifiedChecks,
  modelNominatedChecks,
  profileVerifiedChecks,
  eventById,
} from "../reader-checks.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

// ── Fixtures ──────────────────────────────────────────────────────────────────

// A synthetic pasted answer. The exemption CONCLUSION rests on an earlier DATE
// PROPOSITION; both strings occur verbatim so both ends resolve to exact spans.
const ANSWER =
  "The vendor's contract was signed in 2019. " +
  "Because it predates the policy change, the vendor is exempt from the new reporting rule. " +
  "You can proceed without filing the additional disclosure.";

const PROP = "The vendor's contract was signed in 2019";
const DEP = "the vendor is exempt from the new reporting rule";

function omissionFinding(overrides = {}) {
  return {
    type: "omission",
    anchor: "exemption claim",
    materiality: "The exemption is the load-bearing conclusion.",
    check: {
      supporting_proposition: PROP,
      dependent_output: DEP,
      dependency_statement: "The exemption rests on the 2019 signing date stated earlier in the answer.",
      verification_question:
        "What is the effective date of the reporting rule, and does a 2019 contract fall under it?",
      resolver: "authority",
      ...overrides,
    },
  };
}

function assemble(finding, text = ANSWER) {
  return assembleComparativeCheck({ artifactId: "original_answer", artifactText: text, finding, index: 0 });
}

// ── Span resolution (AT-2 mechanical heart) ─────────────────────────────────────

test("resolveSpan returns an exact, self-consistent span for a substring", () => {
  const span = resolveSpan(ANSWER, PROP, "original_answer");
  assert.ok(span);
  assert.equal(span.artifact_id, "original_answer");
  assert.equal(ANSWER.slice(span.start, span.end), PROP);
  assert.equal(span.quote, PROP);
});

test("resolveSpan returns null for text that does not occur (never fabricates offsets)", () => {
  assert.equal(resolveSpan(ANSWER, "a sentence that is not in the answer", "original_answer"), null);
});

test("resolveSpan strips a single layer of wrapping quotation marks", () => {
  const span = resolveSpan(ANSWER, `“${PROP}”`, "original_answer");
  assert.ok(span);
  assert.equal(ANSWER.slice(span.start, span.end), PROP);
});

test("resolveSpans is all-or-nothing: one unresolvable quote drops the whole set", () => {
  assert.ok(resolveSpans(ANSWER, [PROP, DEP], "original_answer"));
  assert.equal(resolveSpans(ANSWER, [PROP, "not present"], "original_answer"), null);
});

test("normalizeQuotes accepts the tolerant shapes a model may emit", () => {
  assert.deepEqual(normalizeQuotes(PROP), [PROP]);
  assert.deepEqual(normalizeQuotes([PROP, "", "  "]), [PROP]);
  assert.deepEqual(normalizeQuotes({ text: PROP }), [PROP]);
  assert.deepEqual(normalizeQuotes({ quotes: [PROP, DEP] }), [PROP, DEP]);
  assert.deepEqual(normalizeQuotes(null), []);
});

// ── Assembly + both-ends silence (AT-2) ─────────────────────────────────────────

test("assembleComparativeCheck emits a finding_derived comparative check when both ends quote", () => {
  const built = assemble(omissionFinding());
  assert.ok(built);
  assert.equal(built.check.subclass, "finding_derived");
  assert.equal(built.detector_event.family, "comparative");
  assert.equal(built.detector_event.detector_id, "vg.omission");
  // Both quoted ends resolve to exact substrings of the answer.
  for (const s of built.check.proposition_at_issue.spans)
    assert.equal(ANSWER.slice(s.start, s.end), s.quote);
  for (const s of built.check.dependent_output.spans)
    assert.equal(ANSWER.slice(s.start, s.end), s.quote);
});

test("AT-2: an unquotable PROPOSITION yields silence, not a degraded check", () => {
  const built = assemble(omissionFinding({ supporting_proposition: "a proposition not in the answer" }));
  assert.equal(built, null);
});

test("AT-2: an unquotable DEPENDENT output yields silence, not a degraded check", () => {
  const built = assemble(omissionFinding({ dependent_output: "a conclusion not in the answer" }));
  assert.equal(built, null);
});

test("AT-2: finding_derived ALWAYS requires a dependent output (both-ends rule)", () => {
  const built = assemble(omissionFinding({ dependent_output: "" }));
  assert.equal(built, null);
});

test("a finding whose type is not a comparative family emits no check here (later lane)", () => {
  const built = assemble({ ...omissionFinding(), type: "li.contradiction" });
  assert.equal(built, null);
});

test("a finding with no check block is silent (nothing to quote)", () => {
  const built = assemble({ type: "omission", anchor: "x", materiality: "y" });
  assert.equal(built, null);
});

// ── Pointer-register world-claim gate (AT-5 runtime side / AT-7) ────────────────

test("a world-claim verdict in the DEPENDENCY STATEMENT drops the whole check", () => {
  const built = assemble(
    omissionFinding({ dependency_statement: "This shows the exemption claim is false." }),
  );
  assert.equal(built, null);
});

test("a world-claim verdict in the VERIFICATION QUESTION drops the whole check", () => {
  const built = assemble(
    omissionFinding({ verification_question: "Confirm whether the exemption is correct." }),
  );
  assert.equal(built, null);
});

test("a missing dependency statement or question drops the check (nothing to point with)", () => {
  assert.equal(assemble(omissionFinding({ dependency_statement: "" })), null);
  assert.equal(assemble(omissionFinding({ verification_question: "" })), null);
});

test("resolver out of enum defaults to direct_question rather than suppressing a quoted check", () => {
  const built = assemble(omissionFinding({ resolver: "not-a-resolver" }));
  assert.ok(built);
  assert.equal(built.check.verification_action.resolver, "direct_question");
});

// ── AT-1: gating on a resolving detector_event_id ───────────────────────────────

test("AT-1: a check with no detector_event_id fails validation", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const bad = { ...check, detector_event_id: "" };
  const r = validateCheck(bad, detector_event, ANSWER);
  assert.equal(r.ok, false);
  assert.match(r.reason, /detector_event_id required/);
});

test("AT-1: a detector_event_id that does not resolve to the event fails validation", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const other = { ...detector_event, id: "de_something_else" };
  const r = validateCheck(check, other, ANSWER);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not resolve/);
});

test("AT-1: a well-formed check + its event validate ok", () => {
  const { check, detector_event } = assemble(omissionFinding());
  assert.equal(validateDetectorEvent(detector_event).ok, true);
  assert.equal(validateCheck(check, detector_event, ANSWER).ok, true);
});

test("AT-2: validateCheck rejects a proposition span that no longer resolves", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const tampered = {
    ...check,
    proposition_at_issue: {
      ...check.proposition_at_issue,
      spans: [{ ...check.proposition_at_issue.spans[0], end: check.proposition_at_issue.spans[0].end + 5 }],
    },
  };
  const r = validateCheck(tampered, detector_event, ANSWER);
  assert.equal(r.ok, false);
  assert.match(r.reason, /proposition span does not resolve/);
});

// ── AT-3: demonstration ─────────────────────────────────────────────────────────

test("AT-3: finding_type must agree with detector_id", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const bad = {
    ...check,
    demonstration: { ...check.demonstration, finding_type: "framing_drift" },
  };
  const r = validateDemonstration(bad, detector_event);
  assert.equal(r.ok, false);
  assert.match(r.reason, /finding_type does not match detector_id/);
});

test("AT-3: a span ref out of range is invalid", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const bad = {
    ...check,
    demonstration: { ...check.demonstration, proposition_span_refs: [7] },
  };
  const r = validateDemonstration(bad, detector_event);
  assert.equal(r.ok, false);
  assert.match(r.reason, /proposition_span_ref out of range/);
});

test("AT-3: a missing dependency statement is invalid", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const bad = { ...check, demonstration: { ...check.demonstration, dependency_statement: "  " } };
  const r = validateDemonstration(bad, detector_event);
  assert.equal(r.ok, false);
  assert.match(r.reason, /dependency_statement required/);
});

test("AT-3: the emitted demonstration span-refs resolve to the check's own quoted spans", () => {
  const { check } = assemble(omissionFinding());
  const d = check.demonstration;
  for (const r of d.proposition_span_refs) assert.ok(check.proposition_at_issue.spans[r]);
  for (const r of d.dependent_output_span_refs) assert.ok(check.dependent_output.spans[r]);
});

// ── AT-13: comparative events carry no verification block ────────────────────────

test("AT-13: assembled comparative event carries NO verification block", () => {
  const { detector_event } = assemble(omissionFinding());
  assert.equal(detector_event.verification, undefined);
});

test("AT-13: attaching a verification block to a comparative event fails validation", () => {
  const { detector_event } = assemble(omissionFinding());
  const tampered = { ...detector_event, verification: { mode: "mechanical", status: "verified" } };
  const r = validateDetectorEvent(tampered);
  assert.equal(r.ok, false);
  assert.match(r.reason, /must not carry a verification block/);
});

// ── AT-13 design conformance: local-integrity / profile verification rules ───────
// These families are NOT built this lane, but the validators keep their
// verification modes from ever being conflated with comparative or each other.

test("AT-13: mechanical local-integrity requires mechanical/verified", () => {
  const base = {
    id: "li1",
    family: "local_integrity",
    detector_id: "li.arith",
    detector_version: "1",
    evidence_spans: [{ artifact_id: "a", start: 0, end: 1, quote: "x" }],
  };
  assert.equal(validateDetectorEvent({ ...base }).ok, false); // no verification block
  assert.equal(
    validateDetectorEvent({ ...base, verification: { mode: "mechanical", status: "verified" } }).ok,
    true,
  );
  assert.equal(
    validateDetectorEvent({ ...base, verification: { mode: "model_nominated", status: "nominated" } }).ok,
    false,
  );
});

test("AT-13: li.contradiction requires model_nominated/nominated, never mechanical", () => {
  const base = {
    id: "li2",
    family: "local_integrity",
    detector_id: "li.contradiction",
    detector_version: "1",
    evidence_spans: [{ artifact_id: "a", start: 0, end: 1, quote: "x" }],
  };
  assert.equal(
    validateDetectorEvent({ ...base, verification: { mode: "model_nominated", status: "nominated" } }).ok,
    true,
  );
  assert.equal(
    validateDetectorEvent({ ...base, verification: { mode: "mechanical", status: "verified" } }).ok,
    false,
  );
});

test("AT-13: profile verification requires mechanical/verified + verifier id/version", () => {
  const base = {
    id: "p1",
    family: "profile",
    detector_id: "prof.vendor.field",
    detector_version: "1",
    evidence_spans: [{ artifact_id: "a", start: 0, end: 1, quote: "x" }],
  };
  assert.equal(
    validateDetectorEvent({ ...base, verification: { mode: "mechanical", status: "verified" } }).ok,
    false, // missing verifier id/version
  );
  assert.equal(
    validateDetectorEvent({
      ...base,
      verification: { mode: "mechanical", status: "verified", verifier_id: "e", verifier_version: "1" },
    }).ok,
    true,
  );
});

// ── AT-13: family-separated queries never conflate verification modes ────────────

test("AT-13: mechanically-verified, model-nominated, and profile checks never conflate", () => {
  // Hand-built mixed register (only comparative is built by the lane; this pins
  // that the query layer keeps families and modes apart — schema AT-4/AT-13).
  const register = {
    detector_events: [
      {
        id: "de_arith",
        family: "local_integrity",
        detector_id: "li.arith",
        verification: { mode: "mechanical", status: "verified" },
      },
      {
        id: "de_contra",
        family: "local_integrity",
        detector_id: "li.contradiction",
        verification: { mode: "model_nominated", status: "nominated" },
      },
      {
        id: "de_prof",
        family: "profile",
        detector_id: "prof.vendor.field",
        verification: { mode: "mechanical", status: "verified", verifier_id: "e", verifier_version: "1" },
      },
    ],
    checks: [
      { id: "c_arith", detector_event_id: "de_arith" },
      { id: "c_contra", detector_event_id: "de_contra" },
      { id: "c_prof", detector_event_id: "de_prof" },
    ],
  };
  assert.deepEqual(mechanicallyVerifiedChecks(register).map((c) => c.id), ["c_arith"]);
  assert.deepEqual(modelNominatedChecks(register).map((c) => c.id), ["c_contra"]);
  assert.deepEqual(profileVerifiedChecks(register).map((c) => c.id), ["c_prof"]);
  // A nominated contradiction never surfaces as mechanically verified.
  assert.ok(!mechanicallyVerifiedChecks(register).some((c) => c.id === "c_contra"));
  // Profile verification never surfaces as local-integrity verification.
  assert.ok(!mechanicallyVerifiedChecks(register).some((c) => c.id === "c_prof"));
});

// ── AT-6: provenance rendering ──────────────────────────────────────────────────

test("AT-6: a card carries family + detector_id + provisional, and survives isolation", () => {
  const { check, detector_event } = assemble(omissionFinding());
  const card = buildCard(check, detector_event);
  assert.equal(card.family, "comparative");
  assert.equal(card.detector_id, "vg.omission");
  assert.equal(card.provisional, true);
  assert.equal(card.provisional_label, CHECK_UI.provisional_label);
  assert.equal(card.finding_label, "Omission");
  // Isolation: destructuring only the card (no register, no event) preserves them.
  const alone = JSON.parse(JSON.stringify(card));
  assert.equal(alone.family, "comparative");
  assert.equal(alone.detector_id, "vg.omission");
  assert.equal(alone.provisional, true);
});

test("finding labels use the shipped Deflection name for active_foreclosure", () => {
  assert.equal(CHECK_UI.finding_labels.active_foreclosure, "Deflection");
  assert.equal(FINDING_TYPE_TO_DETECTOR.active_foreclosure.detector_id, "vg.active_foreclosure");
});

// ── AT-7: provisional invariant + AT-4 separation via the assembled register ────

test("AT-7: buildCheckRegister status is provisional and every card is provisional", () => {
  const reg = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: ANSWER,
    findings: [omissionFinding()],
    inspector: { model: "m", model_version: "m", prompt_version: "reader.v3" },
  });
  assert.equal(reg.status, "provisional");
  assert.equal(reg.version, CHECK_MODEL_VERSION);
  assert.ok(reg.cards.length >= 1);
  for (const card of reg.cards) assert.equal(card.provisional, true);
});

test("AT-7: the shipped register UI copy carries no instrument-grade / world-claim language", () => {
  const violations = lintUserFacingStrings(CHECK_UI);
  assert.deepEqual(violations, [], JSON.stringify(violations, null, 2));
});

test("AT-4: measurement findings query returns only comparative checks", () => {
  const reg = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: ANSWER,
    findings: [omissionFinding()],
  });
  assert.equal(comparativeChecks(reg).length, 1);
  assert.equal(measurementFindings(reg).length, 1);
  assert.equal(localIntegrityChecks(reg).length, 0);
  assert.equal(profileChecks(reg).length, 0);
});

test("buildCheckRegister drops silent findings and dedups identical spans", () => {
  const reg = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: ANSWER,
    findings: [
      omissionFinding(),
      omissionFinding(), // identical span-derived id → deduped
      omissionFinding({ supporting_proposition: "not in the answer" }), // silent
    ],
  });
  assert.equal(reg.checks.length, 1);
});

// ── AT-9: ranking determinism ───────────────────────────────────────────────────

// A multi-finding synthetic answer with three distinct, quotable dependencies at
// increasing offsets. In the lane every check is demonstrability=comparative and
// (production) propagation=isolated_detail with conflict_count 0, so the register
// orders by earliest span offset — earlier in the answer ranks first.
const MULTI =
  "Premise A holds. Therefore outcome A is settled. " + // offsets ~0
  "Premise B holds. Therefore outcome B is settled. " + // later
  "Premise C holds. Therefore outcome C is settled."; // latest

function multiFinding(letter) {
  return {
    type: "omission",
    anchor: `outcome ${letter}`,
    materiality: "load-bearing",
    check: {
      supporting_proposition: `Premise ${letter} holds`,
      dependent_output: `outcome ${letter} is settled`,
      dependency_statement: `Outcome ${letter} rests on premise ${letter} stated in the answer.`,
      verification_question: `What independent source establishes premise ${letter}?`,
      resolver: "direct_question",
    },
  };
}

test("AT-9: fixed inputs → identical top-3, independent of input order", () => {
  const findings = [multiFinding("A"), multiFinding("B"), multiFinding("C")];
  const build = (order) =>
    buildCheckRegister({ artifactId: "original_answer", artifactText: MULTI, findings: order });

  const forward = build(findings);
  const shuffled = build([findings[2], findings[0], findings[1]]);
  const reversed = build([...findings].reverse());

  const ids = (reg) => reg.top.map((c) => c.id);
  assert.equal(forward.top.length, 3);
  // Earliest-offset-first: A before B before C.
  assert.deepEqual(ids(forward), ids(shuffled));
  assert.deepEqual(ids(forward), ids(reversed));
  // And the ranked order matches the answer order (A, B, C by offset).
  assert.deepEqual(
    forward.cards.map((c) => c.proposition.spans[0].start),
    [...forward.cards.map((c) => c.proposition.spans[0].start)].sort((a, b) => a - b),
  );
});

test("AT-9: rankChecks is a pure total order over the full ranking key", () => {
  // Direct unit test of the comparator across demonstrability / propagation /
  // conflict count / earliest span offset, independent of assembly.
  const ev = (id, start) => ({ id, evidence_spans: [{ start }] });
  const chk = (id, demonstrability, propagation, count, evId) => ({
    id,
    detector_event_id: evId,
    ranking: { demonstrability, propagation, independent_conflict_count: count },
  });
  const events = [ev("e1", 100), ev("e2", 10), ev("e3", 50), ev("e4", 50)];
  const checks = [
    chk("c1", "comparative", "isolated_detail", 0, "e1"),
    chk("c2", "mechanical_verified", "final_conclusion", 0, "e2"),
    chk("c3", "comparative", "final_conclusion", 2, "e3"),
    chk("c4", "comparative", "final_conclusion", 2, "e4"),
  ];
  const ranked = rankChecks(checks, events).map((c) => c.id);
  // c2 first (mechanical_verified beats comparative). Among comparative:
  // final_conclusion (c3,c4) before isolated_detail (c1); c3 vs c4 tie on
  // count → earliest offset (both 50) → id asc → c3 then c4.
  assert.deepEqual(ranked, ["c2", "c3", "c4", "c1"]);
  // Determinism: shuffling the input yields the identical order.
  const ranked2 = rankChecks([checks[3], checks[0], checks[2], checks[1]], events).map((c) => c.id);
  assert.deepEqual(ranked, ranked2);
});

// ── Round-trip: assembled objects pass their own validators ─────────────────────

test("every assembled register object passes validateDetectorEvent + validateCheck", () => {
  const reg = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: MULTI,
    findings: [multiFinding("A"), multiFinding("B"), multiFinding("C")],
  });
  for (const check of reg.checks) {
    const ev = eventById(reg.detector_events, check.detector_event_id);
    assert.equal(validateDetectorEvent(ev).ok, true);
    assert.equal(validateCheck(check, ev, MULTI).ok, true);
  }
});
