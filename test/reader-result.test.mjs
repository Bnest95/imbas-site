// reader-result — the canonical Reader result (Pass 2B-A).
//
// The organising claim of this suite is that a prohibited combination cannot be
// CONSTRUCTED, not that it is unlikely to be constructed. So most assertions are
// assert.throws on the factory plus a frozen-object check proving the combination
// cannot be mutated into existence after the fact.
//
// Synthetic fixtures only. No metered model calls, no real capture substance.
//
// Run: node --test test/reader-result.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  RESULT_SCHEMA_VERSION,
  CANON_ERROR_PREFIX,
  FINDING_CLASSES,
  normalizeClass,
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  ANCHOR_STATUS,
  ANCHOR_ABSENT_REASONS,
  ANCHOR_REQUIREMENT,
  quotedAnchor,
  unresolvedAnchor,
  absentAnchor,
  COMPARISON_DIRECTION,
  CLAIM_REGISTER,
  CLAIM_BASIS,
  CONDITIONS_STATUS,
  AUTHORIZED_CONDITIONS_SOURCES,
  CLIENT_DECLARATION_SOURCES,
  normalizeClaim,
  READER_STATE,
  DISPOSITION,
  ORIGIN,
  REGISTER_STATUS,
  SUPPRESSION_REASONS,
  registerDisposition,
  classifyRegisterOutcome,
  registerFindingShape,
  getFindingShape,
  listFindingShapeIds,
  SHAPE_SINGLE_CANDIDATE,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  SHAPE_PAIRED_COMPARATIVE_CONTRAST,
  buildFinding,
  describeFinding,
  COUNT_DEFS,
  selectSubset,
  countOf,
  countLabel,
  classBreakdown,
  buildCanonicalResult,
} from "../reader-result.js";

// ── Fixtures ────────────────────────────────────────────────────────────────
const OPEN = "Termination is straightforward here. You may end employment at any time.";
const PROBE = "A written notice period applies once the probationary term ends.";
const ARTIFACTS = { [ARTIFACT_ORIGINAL]: OPEN, [ARTIFACT_TARGETED]: PROBE };

const OPEN_QUOTE = "You may end employment at any time";
const PROBE_QUOTE = "A written notice period applies";

function singleFinding(over = {}) {
  return buildFinding({
    index: 0,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "candidate missing item",
    statement: "The notice period never came up.",
    quotations: { [ARTIFACT_ORIGINAL]: OPEN_QUOTE },
    artifacts: ARTIFACTS,
    ...over,
  });
}

function pairedFinding(over = {}) {
  return buildFinding({
    index: 0,
    shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
    class_label: "Omission",
    statement: "The probe answer named a notice period.",
    quotations: { [ARTIFACT_TARGETED]: PROBE_QUOTE },
    artifacts: ARTIFACTS,
    comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
    ...over,
  });
}

function throwsCanon(fn, needle) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof RangeError, `expected RangeError, got ${err && err.name}`);
    assert.ok(
      err.message.startsWith(CANON_ERROR_PREFIX),
      `expected the canonical error prefix, got: ${err.message}`,
    );
    if (needle) assert.match(err.message, needle);
    return true;
  });
}

// ── One class vocabulary ────────────────────────────────────────────────────

test("all three legacy class vocabularies normalize to one canonical id", () => {
  assert.equal(normalizeClass("candidate missing item"), "omission");
  assert.equal(normalizeClass("Omission"), "omission");
  assert.equal(normalizeClass("omission"), "omission");
  assert.equal(normalizeClass("candidate framing issue"), "framing_drift");
  assert.equal(normalizeClass("Framing Drift"), "framing_drift");
  assert.equal(normalizeClass("candidate deflection"), "deflection");
  assert.equal(normalizeClass("Deflection"), "deflection");
});

test("an unknown class label is rejected rather than passed through", () => {
  assert.equal(normalizeClass("candidate vibe issue"), null);
  throwsCanon(() => singleFinding({ class_label: "candidate vibe issue" }), /class label/);
});

// ── Anchor contract (item 3) ────────────────────────────────────────────────

test("an anchor cannot carry both a quotation and absence: there is no such factory", () => {
  const openArtifact = { id: ARTIFACT_ORIGINAL, role: ARTIFACT_ORIGINAL, body: OPEN };
  throwsCanon(() => quotedAnchor({ artifact: openArtifact, quote: "", span: { start: 0, end: 1 } }));
  throwsCanon(() => quotedAnchor({ artifact: openArtifact, quote: "x", span: null }));
  throwsCanon(() => unresolvedAnchor({ role: ARTIFACT_ORIGINAL, supplied: "" }));
  const absent = absentAnchor({
    role: ARTIFACT_ORIGINAL,
    reason: ANCHOR_ABSENT_REASONS.SOURCE_SUPPLIED_NO_QUOTATION,
  });
  assert.equal(absent.quote, "");
  assert.equal(absent.span, null);
  // And it cannot be mutated into a quotation-bearing absent anchor afterward.
  assert.ok(Object.isFrozen(absent));
  assert.throws(() => {
    absent.quote = "invented";
  }, TypeError);
});

test("an absent anchor requires an enumerated reason", () => {
  throwsCanon(() => absentAnchor({ role: ARTIFACT_ORIGINAL, reason: "because" }), /absent_reason/);
  throwsCanon(() => absentAnchor({ role: "some_other_answer", reason: ANCHOR_ABSENT_REASONS.SOURCE_SUPPLIED_NO_QUOTATION }), /anchor role/);
});

test("single-answer shape: a verbatim quotation resolves to a QUOTED anchor with a span", () => {
  const f = singleFinding();
  const a = f.anchors.find((x) => x.role === ARTIFACT_ORIGINAL);
  assert.equal(a.status, ANCHOR_STATUS.QUOTED);
  assert.equal(a.quote, OPEN_QUOTE);
  assert.equal(OPEN.slice(a.span.start, a.span.end), OPEN_QUOTE);
  assert.equal(a.span.artifact_id, ARTIFACT_ORIGINAL);
});

test("a supplied quotation that is not verbatim is recorded UNRESOLVED, not dropped and not repaired", () => {
  const f = singleFinding({ quotations: { [ARTIFACT_ORIGINAL]: "you can fire anyone whenever" } });
  const a = f.anchors.find((x) => x.role === ARTIFACT_ORIGINAL);
  assert.equal(a.status, ANCHOR_STATUS.UNRESOLVED);
  assert.equal(a.quote, "");
  assert.equal(a.supplied_text, "you can fire anyone whenever");
  // The finding survives; it simply does not enter a surfaced quantity.
  const result = buildCanonicalResult({ surface: "single", findings: [f] });
  assert.equal(countOf(result, "recorded_findings"), 1);
  assert.equal(countOf(result, "surfaced_candidate_items"), 0);
});

test("an omission carries an explicit ABSENT open side with no invented substitute", () => {
  const f = pairedFinding();
  const open = f.anchors.find((x) => x.role === ARTIFACT_ORIGINAL);
  const probe = f.anchors.find((x) => x.role === ARTIFACT_TARGETED);
  assert.equal(open.status, ANCHOR_STATUS.ABSENT);
  assert.equal(open.quote, "");
  assert.equal(open.absent_reason, ANCHOR_ABSENT_REASONS.SOURCE_SUPPLIED_NO_QUOTATION);
  assert.equal(probe.status, ANCHOR_STATUS.QUOTED);
  assert.equal(probe.quote, PROBE_QUOTE);
  // This is the shape the both-ends rule silently discarded. It is a first-class
  // finding here and it counts.
  const result = buildCanonicalResult({ surface: "paired", findings: [f] });
  assert.equal(countOf(result, "probe_surfaced_differences"), 1);
});

test("a comparative contrast cannot be constructed from one side", () => {
  throwsCanon(
    () =>
      buildFinding({
        index: 0,
        shape: SHAPE_PAIRED_COMPARATIVE_CONTRAST,
        class_label: "framing_drift",
        statement: "The two answers frame the same point differently.",
        quotations: { [ARTIFACT_TARGETED]: PROBE_QUOTE },
        artifacts: ARTIFACTS,
        comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
      }),
    /requires a original_answer quotation/,
  );
  // With both sides it builds, and both anchors are QUOTED.
  const f = buildFinding({
    index: 0,
    shape: SHAPE_PAIRED_COMPARATIVE_CONTRAST,
    class_label: "framing_drift",
    statement: "The two answers frame the same point differently.",
    quotations: { [ARTIFACT_TARGETED]: PROBE_QUOTE, [ARTIFACT_ORIGINAL]: OPEN_QUOTE },
    artifacts: ARTIFACTS,
    comparison_direction: COMPARISON_DIRECTION.BOTH_DIFFERENT,
  });
  assert.deepEqual(
    f.anchors.map((a) => a.status),
    [ANCHOR_STATUS.QUOTED, ANCHOR_STATUS.QUOTED],
  );
});

test("a shape that forbids a side cannot acquire one", () => {
  const f = singleFinding({ quotations: { [ARTIFACT_ORIGINAL]: OPEN_QUOTE, [ARTIFACT_TARGETED]: PROBE_QUOTE } });
  assert.equal(getFindingShape(SHAPE_SINGLE_CANDIDATE).anchors[ARTIFACT_TARGETED], ANCHOR_REQUIREMENT.FORBIDDEN);
  assert.equal(f.anchors.length, 1);
  assert.equal(f.anchors[0].role, ARTIFACT_ORIGINAL);
});

// ── Claim register (item 6, correction #3) ──────────────────────────────────

test("an absent basis normalizes down to OBSERVED_DIFFERENCE", () => {
  const c = normalizeClaim({});
  assert.equal(c.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(c.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
  assert.equal(c.conditions_status, CONDITIONS_STATUS.UNAVAILABLE);
});

test("an unrecognized basis normalizes down and is distinguishable from an absent one", () => {
  const c = normalizeClaim({ conditions_source: "someone_said_so", conditions_status: CONDITIONS_STATUS.MATCHED });
  assert.equal(c.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(c.claim_basis, CLAIM_BASIS.UNRECOGNIZED_BASIS);
  assert.notEqual(c.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
});

test("a reported client declaration is never silently upgraded, even when it says MATCHED", () => {
  const c = normalizeClaim({
    conditions_source: CLIENT_DECLARATION_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.MATCHED,
  });
  assert.equal(c.claim_basis, CLAIM_BASIS.REPORTED_CLIENT_DECLARATION);
  assert.equal(c.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  // Provenance is preserved; the claim is not strengthened.
  assert.equal(c.conditions_status, CONDITIONS_STATUS.MATCHED);
});

test("only an enumerated authorized basis plus MATCHED permits MATCHED_CONDITIONS", () => {
  const source = AUTHORIZED_CONDITIONS_SOURCES[0];
  const ok = normalizeClaim({ conditions_source: source, conditions_status: CONDITIONS_STATUS.MATCHED });
  assert.equal(ok.claim_basis, CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS);
  assert.equal(ok.claim_register, CLAIM_REGISTER.MATCHED_CONDITIONS);
});

test("UNVERIFIED, UNAVAILABLE, and UNMATCHED cannot carry MATCHED_CONDITIONS even on an authorized basis", () => {
  const source = AUTHORIZED_CONDITIONS_SOURCES[0];
  for (const status of [CONDITIONS_STATUS.UNVERIFIED, CONDITIONS_STATUS.UNAVAILABLE, CONDITIONS_STATUS.UNMATCHED]) {
    const c = normalizeClaim({ conditions_source: source, conditions_status: status });
    assert.equal(c.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE, `${status} must not reach the matched register`);
    assert.equal(c.claim_basis, CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS);
  }
});

test("an unrecognized conditions_status degrades to UNAVAILABLE rather than being trusted", () => {
  const c = normalizeClaim({ conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0], conditions_status: "probably_fine" });
  assert.equal(c.conditions_status, CONDITIONS_STATUS.UNAVAILABLE);
  assert.equal(c.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
});

test("a serialized surface that omits the claim basis cannot reconstruct a matched claim", () => {
  const f = pairedFinding({
    conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.MATCHED,
  });
  assert.equal(f.claim_register, CLAIM_REGISTER.MATCHED_CONDITIONS);
  // Round-trip through a surface that carried the status but dropped the source.
  const wire = JSON.parse(JSON.stringify({ conditions_status: f.conditions_status }));
  const rebuilt = normalizeClaim(wire);
  assert.equal(rebuilt.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(rebuilt.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
});

test("a single-answer finding carries no claim register at all", () => {
  const f = singleFinding();
  assert.equal(f.claim_register, null);
  assert.equal(f.claim_basis, null);
  assert.equal(f.conditions_status, null);
});

// ── Comparison direction (correction #1: schema accommodation only) ─────────

test("the direction enum carries all three values so a later pass needs no migration", () => {
  assert.deepEqual(Object.keys(COMPARISON_DIRECTION).sort(), ["BOTH_DIFFERENT", "OPEN_ONLY", "PROBE_ONLY"]);
});

test("a directional shape requires an enumerated direction and a non-directional one refuses any", () => {
  throwsCanon(() => pairedFinding({ comparison_direction: null }), /comparison_direction/);
  throwsCanon(() => pairedFinding({ comparison_direction: "SIDEWAYS" }), /comparison_direction/);
  throwsCanon(() => singleFinding({ comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY }), /cannot carry a comparison_direction/);
});

test("OPEN_ONLY is representable but never enters the probe-surfaced quantity", () => {
  const openOnly = pairedFinding({
    index: 1,
    comparison_direction: COMPARISON_DIRECTION.OPEN_ONLY,
    quotations: { [ARTIFACT_ORIGINAL]: OPEN_QUOTE },
  });
  assert.equal(openOnly.comparison_direction, COMPARISON_DIRECTION.OPEN_ONLY);
  const result = buildCanonicalResult({ surface: "paired", findings: [pairedFinding(), openOnly] });
  assert.equal(countOf(result, "recorded_findings"), 2);
  assert.equal(countOf(result, "probe_surfaced_differences"), 1);
});

// ── Two-axis claim state (item 7) ───────────────────────────────────────────

test("the live Reader may create only an UNREVIEWED disposition", () => {
  for (const d of [DISPOSITION.VERIFIED, DISPOSITION.REJECTED, DISPOSITION.UNRESOLVED]) {
    throwsCanon(() => singleFinding({ disposition: d }), /only create UNREVIEWED/);
  }
  assert.equal(singleFinding().disposition, DISPOSITION.UNREVIEWED);
});

test("the live Reader cannot hand-assert a reader state; it is derived from the anchors", () => {
  throwsCanon(() => singleFinding({ reader_state: READER_STATE.OBSERVED }), /derived, not supplied/);
  // Single surface → CANDIDATE. Paired with a verbatim probe anchor → OBSERVED.
  assert.equal(singleFinding().reader_state, READER_STATE.CANDIDATE);
  assert.equal(pairedFinding().reader_state, READER_STATE.OBSERVED);
  // Paired without a resolvable probe anchor stays a CANDIDATE.
  const unanchored = pairedFinding({ quotations: { [ARTIFACT_TARGETED]: "words the probe never used" } });
  assert.equal(unanchored.reader_state, READER_STATE.CANDIDATE);
});

test("an archive record may carry a reviewed disposition; the two axes stay independent", () => {
  const f = singleFinding({
    origin: ORIGIN.ARCHIVE,
    disposition: DISPOSITION.VERIFIED,
    reader_state: READER_STATE.CANDIDATE,
  });
  assert.equal(f.disposition, DISPOSITION.VERIFIED);
  assert.equal(f.reader_state, READER_STATE.CANDIDATE);
});

test("origin and disposition vocabularies are closed", () => {
  throwsCanon(() => singleFinding({ origin: "wherever" }), /origin not enumerated/);
  throwsCanon(() => singleFinding({ origin: ORIGIN.ARCHIVE, disposition: "MAYBE" }), /disposition not enumerated/);
});

// ── Check Register disposition (item 10) ────────────────────────────────────

test("EMITTED requires a card id and refuses suppression reasons", () => {
  throwsCanon(() => registerDisposition({ status: REGISTER_STATUS.EMITTED }), /requires a card_id/);
  throwsCanon(
    () =>
      registerDisposition({
        status: REGISTER_STATUS.EMITTED,
        card_id: "c1",
        suppression_reasons: [SUPPRESSION_REASONS.NO_CHECK_BLOCK],
      }),
    /cannot carry suppression reasons/,
  );
  const ok = registerDisposition({ status: REGISTER_STATUS.EMITTED, card_id: "c1" });
  assert.equal(ok.card_id, "c1");
  assert.deepEqual(ok.suppression_reasons, []);
});

test("SUPPRESSED requires at least one enumerated reason and refuses a card id", () => {
  throwsCanon(() => registerDisposition({ status: REGISTER_STATUS.SUPPRESSED }), /at least one enumerated/);
  throwsCanon(
    () => registerDisposition({ status: REGISTER_STATUS.SUPPRESSED, suppression_reasons: ["it was weak"] }),
    /suppression reason not enumerated/,
  );
  throwsCanon(
    () =>
      registerDisposition({
        status: REGISTER_STATUS.SUPPRESSED,
        card_id: "c1",
        suppression_reasons: [SUPPRESSION_REASONS.OPEN_SIDE_ANCHOR_ABSENT],
      }),
    /cannot carry a card_id/,
  );
});

test("the suppression vocabulary names mechanisms, never a generic threshold", () => {
  const values = Object.values(SUPPRESSION_REASONS);
  assert.ok(values.includes("PROBE_SIDE_ANCHOR_UNSUPPORTED"));
  assert.ok(values.includes("OPEN_SIDE_ANCHOR_ABSENT"));
  assert.ok(values.includes("ANCHOR_NOT_VERBATIM"));
  assert.ok(values.includes("NO_CHECK_BLOCK"));
  // Whether the register failed because a finding was weak or because it could not
  // consume a valid anchor shape are opposite conclusions. A generic label would
  // lose that distinction permanently, so none exists.
  for (const v of values) {
    assert.doesNotMatch(v, /THRESHOLD|BELOW|GENERIC|OTHER|UNKNOWN/);
  }
});

test("the payload carries enumerated reason codes and no free-form diagnostic prose", () => {
  const allowed = new Set(Object.values(SUPPRESSION_REASONS));
  const result = buildCanonicalResult({ surface: "single", findings: [singleFinding()] });
  for (const f of result.findings) {
    for (const r of f.check_register.suppression_reasons) {
      assert.ok(allowed.has(r), `unenumerated reason in payload: ${r}`);
      assert.doesNotMatch(r, /\s/, "a reason code never contains whitespace");
    }
  }
});

test("a paired finding's suppression names the mechanism, not a generic ineligibility", () => {
  assert.equal(singleFinding().check_register.status, REGISTER_STATUS.ELIGIBLE);
  const paired = pairedFinding();
  assert.equal(paired.check_register.status, REGISTER_STATUS.SUPPRESSED);
  // Both causes, separably: the register cannot consume a probe-side anchor at
  // all, and this particular finding's open side has nothing to resolve. A later
  // pass has to be able to tell those apart.
  assert.deepEqual(paired.check_register.suppression_reasons, [
    SUPPRESSION_REASONS.PROBE_SIDE_ANCHOR_UNSUPPORTED,
    SUPPRESSION_REASONS.OPEN_SIDE_ANCHOR_ABSENT,
  ]);
  // The same shape with a quotable open side drops the second reason and keeps the first.
  const bothSides = pairedFinding({
    quotations: { [ARTIFACT_TARGETED]: PROBE_QUOTE, [ARTIFACT_ORIGINAL]: OPEN_QUOTE },
  });
  assert.deepEqual(bothSides.check_register.suppression_reasons, [
    SUPPRESSION_REASONS.PROBE_SIDE_ANCHOR_UNSUPPORTED,
  ]);
});

test("classifyRegisterOutcome separates a weak anchor from the register's own silence", () => {
  const answer = "The board met on Tuesday. Turnout was not recorded.";
  const check = {
    supporting_proposition: "The board met on Tuesday.",
    dependent_output: "Turnout was not recorded.",
    dependency_statement: "The turnout claim rests on the meeting having happened.",
    verification_question: "Was turnout recorded?",
    resolver: "direct_question",
  };
  const card = {
    id: "chk_omission_0_26",
    dependency_statement: check.dependency_statement,
    proposition: { text: check.supporting_proposition },
    dependent_output: { text: check.dependent_output },
  };

  const emitted = classifyRegisterOutcome({ check, artifacts: { [ARTIFACT_ORIGINAL]: answer }, cards: [card] });
  assert.equal(emitted.status, REGISTER_STATUS.EMITTED);
  assert.equal(emitted.card_id, "chk_omission_0_26");

  const noBlock = classifyRegisterOutcome({ check: null, artifacts: { [ARTIFACT_ORIGINAL]: answer }, cards: [] });
  assert.deepEqual(noBlock.suppression_reasons, [SUPPRESSION_REASONS.NO_CHECK_BLOCK]);

  const notVerbatim = classifyRegisterOutcome({
    check: { ...check, dependent_output: "Turnout was never counted." },
    artifacts: { [ARTIFACT_ORIGINAL]: answer },
    cards: [],
  });
  assert.deepEqual(notVerbatim.suppression_reasons, [SUPPRESSION_REASONS.ANCHOR_NOT_VERBATIM]);

  // Both ends resolve verbatim and the register still emitted nothing: its
  // assembler dropped the block under a rule it does not report. Recorded as the
  // register's silence — never as a weak anchor, which is the opposite conclusion.
  const silent = classifyRegisterOutcome({ check, artifacts: { [ARTIFACT_ORIGINAL]: answer }, cards: [] });
  assert.deepEqual(silent.suppression_reasons, [
    SUPPRESSION_REASONS.REGISTER_DROPPED_WITHOUT_REPORTING_CAUSE,
  ]);
});

test("a suppressed finding stays in the canonical collection and still counts as recorded", () => {
  const suppressed = singleFinding({
    check_register: registerDisposition({
      status: REGISTER_STATUS.SUPPRESSED,
      suppression_reasons: [SUPPRESSION_REASONS.OPEN_SIDE_ANCHOR_ABSENT, SUPPRESSION_REASONS.NO_CHECK_BLOCK],
    }),
  });
  const result = buildCanonicalResult({ surface: "single", findings: [suppressed] });
  assert.equal(countOf(result, "recorded_findings"), 1);
  assert.equal(countOf(result, "surfaced_candidate_items"), 1);
  assert.equal(result.findings[0].check_register.status, REGISTER_STATUS.SUPPRESSED);
  assert.equal(result.findings[0].check_register.suppression_reasons.length, 2);
});

test("a check_register that did not come from registerDisposition is refused", () => {
  throwsCanon(() => singleFinding({ check_register: { status: "FINE" } }), /must be built by registerDisposition/);
});

// ── Counting rule (item 4) ──────────────────────────────────────────────────

test("every count names a unit and an eligibility predicate", () => {
  for (const def of Object.values(COUNT_DEFS)) {
    assert.ok(def.unit_one && def.unit_many, `${def.id} must name its unit`);
    assert.ok(def.predicate_id, `${def.id} must name its predicate`);
    assert.ok(def.predicate_note.length > 20, `${def.id} must describe its predicate`);
  }
});

test("the payload's counts equal their own per-finding arithmetic", () => {
  const result = buildCanonicalResult({
    surface: "single",
    findings: [singleFinding(), singleFinding({ index: 1, quotations: { [ARTIFACT_ORIGINAL]: "nowhere in the text" } })],
  });
  for (const [id, entry] of Object.entries(result.counts)) {
    assert.equal(entry.value, selectSubset(result, id).length, `${id} disagrees with its own subset`);
  }
  assert.equal(result.counts.recorded_findings.value, 2);
  assert.equal(result.counts.surfaced_candidate_items.value, 1);
});

test("count labels are pluralized in one place", () => {
  const one = buildCanonicalResult({ surface: "single", findings: [singleFinding()] });
  assert.equal(countLabel(one, "surfaced_candidate_items"), "1 candidate item");
  const two = buildCanonicalResult({ surface: "single", findings: [singleFinding(), singleFinding({ index: 1 })] });
  assert.equal(countLabel(two, "surfaced_candidate_items"), "2 candidate items");
  const none = buildCanonicalResult({ surface: "single", findings: [] });
  assert.equal(countLabel(none, "surfaced_candidate_items"), "0 candidate items");
});

test("an undefined quantity cannot be selected or counted", () => {
  const result = buildCanonicalResult({ surface: "single", findings: [] });
  throwsCanon(() => countOf(result, "gap_score"), /count not defined/);
  throwsCanon(() => selectSubset(result, "completeness"), /count not defined/);
});

test("the class breakdown is keyed by the one class vocabulary", () => {
  const result = buildCanonicalResult({
    surface: "single",
    findings: [singleFinding(), singleFinding({ index: 1, class_label: "candidate deflection" })],
  });
  assert.deepEqual(classBreakdown(result, "recorded_findings"), { omission: 1, framing_drift: 0, deflection: 1 });
  assert.deepEqual(Object.keys(classBreakdown(result, "recorded_findings")), Object.keys(FINDING_CLASSES));
});

// ── Single mode stops scoring (item 5) ──────────────────────────────────────

test("the canonical single-answer result has no representation for a score or a completeness label", () => {
  const result = buildCanonicalResult({ surface: "single", findings: [singleFinding()] });
  const keys = Object.keys(result);
  for (const forbidden of ["gap_estimate", "gap_estimate_label", "completeness", "estimate_type", "estimate_scale_version"]) {
    assert.ok(!keys.includes(forbidden), `the canonical block must not carry ${forbidden}`);
  }
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /of 3/);
  assert.doesNotMatch(serialized, /"completeness"/);
});

// ── parseMeasurement is evidence, not a precondition (correction #2 item 1) ──

test("a malformed legacy estimate does not erase otherwise valid findings", () => {
  for (const bad of [undefined, null, "", "n/a", NaN, Infinity, {}, [], "3 of 3"]) {
    const result = buildCanonicalResult({
      surface: "single",
      findings: [singleFinding()],
      legacy: { gap_estimate: bad },
    });
    assert.equal(result.counts.recorded_findings.value, 1, `a ${String(bad)} legacy estimate erased the findings`);
    assert.equal(result.counts.surfaced_candidate_items.value, 1);
  }
});

test("a canonical result is valid with no legacy block at all", () => {
  const result = buildCanonicalResult({ surface: "single", findings: [singleFinding()] });
  assert.equal(result.legacy, null);
  assert.equal(result.counts.surfaced_candidate_items.value, 1);
});

test("a legacy human-scored figure is preserved exactly and no current claim derives from it", () => {
  const legacy = { human_scored_gap: 2, scale: "0-3", scored_by: "protocol_review", scored_on: "2026-06-02" };
  const result = buildCanonicalResult({ surface: "single", findings: [singleFinding()], legacy });
  assert.equal(result.legacy.human_scored_gap, 2);
  assert.equal(result.legacy.scale, "0-3");
  assert.equal(result.legacy.scored_by, "protocol_review");
  assert.match(result.legacy.note, /No current claim derives/);
  // The figure is not reachable through any named count.
  for (const id of Object.keys(COUNT_DEFS)) {
    assert.notEqual(countOf(result, id), 2, `${id} must not be derived from a legacy figure`);
  }
});

// ── Schema and version fields (item 9) ──────────────────────────────────────

test("every result carries the schema, method, provider, model, and build fields", () => {
  const result = buildCanonicalResult({
    surface: "single",
    findings: [],
    inspection_method_version: "reader.v3",
    provider: "anthropic",
    model: "claude-opus-4-8",
    model_snapshot_or_build: "claude-opus-4-8-20260501",
  });
  assert.equal(result.result_schema_version, RESULT_SCHEMA_VERSION);
  assert.equal(result.inspection_method_version, "reader.v3");
  assert.equal(result.provider, "anthropic");
  assert.equal(result.model, "claude-opus-4-8");
  assert.equal(result.model_snapshot_or_build, "claude-opus-4-8-20260501");
});

test("nothing in the canonical result describes the probe as neutral or content-independent", () => {
  const result = buildCanonicalResult({
    surface: "paired",
    findings: [pairedFinding()],
    inspection_method_version: "1.1",
  });
  const serialized = JSON.stringify(result);
  for (const banned of [/neutral/i, /domain[- ]general/i, /content[- ]independent/i, /content[- ]neutral/i]) {
    assert.doesNotMatch(serialized, banned);
  }
  // The version field is what carries the fact that the probe text belongs to a
  // recorded method version rather than to the Reader in general.
  assert.equal(result.inspection_method_version, "1.1");
});

test("the verification-task slot exists and stays empty in this pass", () => {
  const result = buildCanonicalResult({ surface: "single", findings: [singleFinding()] });
  assert.deepEqual(result.verification_tasks, []);
});

// ── Result-level invariants ─────────────────────────────────────────────────

test("a finding cannot ride on a result for the other surface", () => {
  throwsCanon(() => buildCanonicalResult({ surface: "paired", findings: [singleFinding()] }), /cannot ride on/);
  throwsCanon(() => buildCanonicalResult({ surface: "single", findings: [pairedFinding()] }), /cannot ride on/);
});

test("a hand-rolled object cannot pass as a finding", () => {
  throwsCanon(
    () =>
      buildCanonicalResult({
        surface: "single",
        findings: [{ shape: "single_candidate_item_but_forged", class_label: "omission", statement: "x", anchors: [] }],
      }),
    /must be built by buildFinding/,
  );
});

test("a constructed result is frozen through to its anchors", () => {
  const result = buildCanonicalResult({ surface: "single", findings: [singleFinding()] });
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.findings));
  assert.ok(Object.isFrozen(result.findings[0]));
  assert.ok(Object.isFrozen(result.findings[0].anchors[0]));
  assert.ok(Object.isFrozen(result.counts.recorded_findings));
  assert.throws(() => {
    result.counts.recorded_findings.value = 99;
  }, TypeError);
});

test("a statement is required; an unregistered shape is refused", () => {
  throwsCanon(() => singleFinding({ statement: "   " }), /non-empty statement/);
  throwsCanon(() => singleFinding({ shape: "invented_shape" }), /shape not registered/);
  throwsCanon(() => buildCanonicalResult({ surface: "sideways", findings: [] }), /surface must be/);
});

// ── Generic rendering by registration (item 8) ──────────────────────────────

test("a fixture-only synthetic shape renders and counts with no change to any renderer", () => {
  const SYNTHETIC = "fixture_synthetic_paired_signal";
  assert.equal(getFindingShape(SYNTHETIC), null);
  registerFindingShape({
    id: SYNTHETIC,
    surface: "paired",
    label: "Synthetic fixture signal",
    anchors: {
      [ARTIFACT_TARGETED]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED,
      [ARTIFACT_ORIGINAL]: ANCHOR_REQUIREMENT.ABSENT_ALLOWED,
    },
    quoted_to_surface: [ARTIFACT_TARGETED],
    directional: true,
  });
  assert.ok(listFindingShapeIds().includes(SYNTHETIC));
  // A shape that declares no register relationship gets the conservative default.
  assert.equal(
    getFindingShape(SYNTHETIC).register_default.suppression_reasons[0],
    SUPPRESSION_REASONS.SHAPE_NOT_REGISTER_ELIGIBLE,
  );

  const f = buildFinding({
    index: 0,
    shape: SYNTHETIC,
    class_label: "deflection",
    statement: "A signal type the renderer has never seen.",
    quotations: { [ARTIFACT_TARGETED]: PROBE_QUOTE },
    artifacts: ARTIFACTS,
    comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
  });

  // The render descriptor is complete without a single shape-specific branch.
  const d = describeFinding(f);
  assert.equal(d.shape, SYNTHETIC);
  assert.equal(d.shape_label, "Synthetic fixture signal");
  assert.equal(d.class_display, "Deflection");
  assert.equal(d.surface, "paired");
  assert.equal(d.directional, true);
  assert.equal(d.anchors.length, 2);
  assert.equal(d.anchors.find((a) => a.role === ARTIFACT_TARGETED).status, ANCHOR_STATUS.QUOTED);

  // And it flows through the named counts on the same terms as a shipped shape. The
  // surfaced subset is decided by the contract the shape registered for itself, so a new
  // shape joins the display subset without editing a count definition or a renderer.
  const result = buildCanonicalResult({ surface: "paired", findings: [f] });
  assert.equal(countOf(result, "recorded_findings"), 1);
  assert.equal(countOf(result, "surfaced_findings"), 1);
  assert.equal(countOf(result, "probe_surfaced_differences"), 1);
});

test("describeFinding refuses an unregistered shape rather than rendering a blank", () => {
  throwsCanon(() => describeFinding({ shape: "never_registered", anchors: [] }), /unregistered shape/);
});

test("a shape id cannot be registered twice", () => {
  throwsCanon(() => registerFindingShape({ id: SHAPE_SINGLE_CANDIDATE, surface: "single" }), /already registered/);
  throwsCanon(() => registerFindingShape({ id: "", surface: "single" }), /requires an id/);
  throwsCanon(() => registerFindingShape({ id: "bad_surface_shape", surface: "sideways" }), /surface must be/);
  throwsCanon(
    () => registerFindingShape({ id: "bad_anchor_shape", surface: "single", anchors: { [ARTIFACT_ORIGINAL]: "MAYBE" } }),
    /anchor requirement not enumerated/,
  );
});
