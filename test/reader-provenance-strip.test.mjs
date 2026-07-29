// Guardrail: reader-provenance.js — the provenance strip (Pass 2B-B item 7) and
// claim-state legibility (item 7A). Named -strip because test/reader-provenance.test.mjs
// already belongs to api/read.js's capture provenance and is a different subject.
//
// Two properties are worth a test here, and both are about honesty rather than format.
//
// 1. The strip never invents and never silently drops. Every field it can describe
//    renders, an unrecorded one says which fact is missing in its own words, and no
//    field is borrowed from a neighbour — the declared answer model in particular must
//    never fall back to the inspecting model, because the two are different subjects
//    and the record's whole position is that Imbas does not observe the first one.
//
// 2. The claim-state table is TOTAL over the canonical claim register. reader-result.js
//    decides what a paired finding may claim; if this module's table has a hole, the
//    surface reads a matched-conditions claim as an unrecognized one, or worse the
//    reverse. Test 9 walks every reachable (register, basis) pair through the real
//    construction door and asserts each lands on its own labelled state.
//
// The claim states are built with buildFinding + buildCanonicalResult rather than
// fixtures, because the point is that the DOOR produces them. buildCanonicalPaired
// hardcodes conditions_status UNAVAILABLE and supplies no source, so it can reach only
// one of the six states; test 8 pins that one as today's live answer.
//
// Run: node --test test/reader-provenance-strip.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  CLAIM_STATE,
  CLAIM_STATE_UI,
  PROVENANCE_FIELDS,
  PROVENANCE_STRIP_VERSION,
  PROVENANCE_UI,
  claimStateId,
  describeClaimState,
  describeProvenance,
} from "../reader-provenance.js";
import {
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  AUTHORIZED_CONDITIONS_SOURCES,
  CLAIM_BASIS,
  CLAIM_REGISTER,
  CLIENT_DECLARATION_SOURCES,
  COMPARISON_DIRECTION,
  CONDITIONS_STATUS,
  SHAPE_PAIRED_OBSERVED_DIFFERENCE,
  SHAPE_SINGLE_CANDIDATE,
  buildCanonicalResult,
  buildFinding,
  countOf,
} from "../reader-result.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";

const SRC = readFileSync(fileURLToPath(new URL("../reader-provenance.js", import.meta.url)), "utf8");

// The purity scan reads CODE. The module's own header says "no Date.now", and a scan
// that counted that sentence would fail the file for documenting the rule it keeps.
// Every comment in reader-provenance.js is a whole-line // comment, so dropping those
// lines is exact here — and if that ever stops being true the scan over-reports rather
// than under-reports, which is the direction a guard should fail in.
const CODE_ONLY = SRC.split("\n")
  .filter((line) => !line.trim().startsWith("//"))
  .join("\n");

const OPEN_ANSWER = "The first answer says one thing about the filing.";
const PROBE_ANSWER = "The second answer names the thirty day notice period.";

// A paired result with one finding whose claim triple comes from the supplied
// conditions inputs. The probe-side snippet resolves verbatim, so the finding also
// satisfies its surfacing contract and enters probe_surfaced_differences.
function pairedResult({ conditions_source = "", conditions_status, surfacing = true } = {}) {
  const snippet = surfacing ? "thirty day notice period" : "words the probe answer does not contain";
  const finding = buildFinding({
    index: 0,
    shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
    class_label: "Omission",
    statement: "The second answer named a deadline the first did not.",
    snippets: { [ARTIFACT_TARGETED]: { verbatim_snippet: snippet } },
    artifacts: { [ARTIFACT_ORIGINAL]: OPEN_ANSWER, [ARTIFACT_TARGETED]: PROBE_ANSWER },
    comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
    conditions_source,
    conditions_status,
  });
  return buildCanonicalResult({
    surface: "paired",
    findings: [finding],
    inspection_method_version: "2.0",
    provider: "anthropic",
    model: "a-model",
  });
}

function singleResult(extra = {}) {
  const finding = buildFinding({
    index: 0,
    shape: SHAPE_SINGLE_CANDIDATE,
    class_label: "Omission",
    statement: "The answer left out the filing deadline.",
    quotations: { [ARTIFACT_ORIGINAL]: "one thing about the filing" },
    artifacts: { [ARTIFACT_ORIGINAL]: OPEN_ANSWER },
  });
  return buildCanonicalResult({
    surface: "single",
    findings: [finding],
    inspection_method_version: "reader.v3",
    provider: "anthropic",
    model: "a-model",
    ...extra,
  });
}

const byId = (strip) => Object.fromEntries(strip.fields.map((f) => [f.id, f]));

// ── The module's contract ────────────────────────────────────────────────────

test("1) pure by contract: no node: import, no DOM, no clock, no randomness", () => {
  for (const [label, pattern] of [
    ["a node: import", /from\s+["']node:/],
    ["a DOM reference", /\b(?:document|window|localStorage)\b/],
    ["a clock read", /Date\.now|new Date\(/],
    ["randomness", /Math\.random/],
  ]) {
    assert.ok(!pattern.test(CODE_ONLY), `reader-provenance.js must not contain ${label}`);
  }
  assert.ok(/\/\/ .*no Date\.now/.test(SRC), "and the header must keep stating the contract it holds");
});

test("2) AT-5: every authored string passes the vocabulary lint", () => {
  assert.deepEqual(lintUserFacingStrings(PROVENANCE_UI), []);
  assert.deepEqual(lintUserFacingStrings(PROVENANCE_FIELDS), []);
  assert.deepEqual(lintUserFacingStrings(CLAIM_STATE_UI), []);
});

// ── The provenance strip ─────────────────────────────────────────────────────

test("3) a complete single-answer strip: every field known, no paired row", () => {
  const strip = describeProvenance({
    canonical: singleResult({ model_snapshot_or_build: "build-2026-07-01" }),
    declaredModel: "the model I used",
    capturedAt: "2026-07-29T10:00:00.000Z",
  });
  assert.equal(strip.version, PROVENANCE_STRIP_VERSION);
  assert.equal(strip.surface, "single");
  assert.equal(strip.complete, true);
  assert.equal(strip.unknown_count, 0);
  assert.ok(strip.fields.every((f) => f.known));
  assert.deepEqual(
    strip.fields.map((f) => f.id),
    ["answer_model", "provider", "inspection_model", "model_build", "inspection_method_version", "captured_at"],
    "a single-answer run has no paired method, so that row is absent rather than unknown",
  );
});

test("4) the live shape is partial, and every missing fact says which one it is", () => {
  // What api/read.js actually supplies: no model build (the call requests a family
  // alias and never captures the resolved id) and, on a run where nobody typed one,
  // no declared model.
  const strip = describeProvenance({ canonical: singleResult(), capturedAt: "2026-07-29T10:00:00.000Z" });
  const f = byId(strip);
  assert.equal(strip.complete, false);
  assert.equal(strip.unknown_count, 2);
  assert.equal(f.model_build.known, false);
  assert.equal(f.model_build.value, "not pinned", "an unpinned build is a different fact from an unrecorded one");
  assert.equal(f.answer_model.known, false);
  assert.equal(f.answer_model.value, "none given");
  // And the rows are still there. A dropped row reads as "does not apply".
  assert.ok(strip.fields.some((x) => x.id === "model_build"));
  assert.ok(strip.fields.some((x) => x.id === "answer_model"));
});

test("5) nothing is borrowed: the declared answer model never falls back to the inspecting model", () => {
  const strip = describeProvenance({ canonical: singleResult(), declaredModel: "   " });
  const f = byId(strip);
  assert.equal(f.inspection_model.value, "a-model");
  assert.equal(f.answer_model.value, "none given", "Imbas does not observe which model wrote the answer it read");
  assert.notEqual(f.answer_model.value, f.inspection_model.value);
});

test("6) the paired strip adds the paired method version and takes it only from the caller", () => {
  const canonical = pairedResult({ conditions_status: CONDITIONS_STATUS.UNAVAILABLE });
  const supplied = describeProvenance({ canonical, pairedMethodVersion: "chip.1.0" });
  assert.equal(byId(supplied).paired_method_version.value, "chip.1.0");
  // Unsupplied, it does NOT copy inspection_method_version, which happens to be 2.0
  // on this result. A borrowed value would read as a recorded one.
  const absent = describeProvenance({ canonical });
  assert.equal(byId(absent).paired_method_version.known, false);
  assert.equal(byId(absent).paired_method_version.value, "not recorded");
  assert.equal(byId(absent).inspection_method_version.value, "2.0");
});

test("7) no canonical block → no surface, so the renderer can drop the strip entirely", () => {
  for (const input of [undefined, {}, { canonical: null }, { canonical: "nope" }, { canonical: { surface: "x" } }]) {
    assert.equal(describeProvenance(input).surface, null);
  }
});

// ── Claim-state legibility ───────────────────────────────────────────────────

test("8) today's live paired run: no authorized source, so the surface says the conditions are not recorded", () => {
  // api/read-paired.js supplies conditions_status UNAVAILABLE and no conditions_source.
  const claim = describeClaimState(pairedResult({ conditions_status: CONDITIONS_STATUS.UNAVAILABLE }));
  assert.equal(claim.state_id, CLAIM_STATE.OBSERVED_DIFFERENCE_NO_BASIS);
  assert.equal(claim.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(claim.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
  assert.equal(claim.label, "Observed difference · conditions not recorded");
  assert.ok(!/matched/i.test(claim.label), "no live run may show a matched-conditions label");
});

test("9) the table is total over the claim register: every reachable pair has its own state", () => {
  const cases = [
    {
      name: "authorized source + matched",
      input: { conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0], conditions_status: CONDITIONS_STATUS.MATCHED },
      register: CLAIM_REGISTER.MATCHED_CONDITIONS,
      basis: CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS,
      state: CLAIM_STATE.MATCHED_CONDITIONS,
    },
    {
      name: "authorized source + unmatched",
      input: { conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0], conditions_status: CONDITIONS_STATUS.UNMATCHED },
      register: CLAIM_REGISTER.OBSERVED_DIFFERENCE,
      basis: CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS,
      state: CLAIM_STATE.OBSERVED_DIFFERENCE_UNMATCHED,
    },
    {
      name: "client declaration",
      input: { conditions_source: CLIENT_DECLARATION_SOURCES[0], conditions_status: CONDITIONS_STATUS.MATCHED },
      register: CLAIM_REGISTER.OBSERVED_DIFFERENCE,
      basis: CLAIM_BASIS.REPORTED_CLIENT_DECLARATION,
      state: CLAIM_STATE.OBSERVED_DIFFERENCE_REPORTED,
    },
    {
      name: "no source at all",
      input: { conditions_source: "", conditions_status: CONDITIONS_STATUS.UNAVAILABLE },
      register: CLAIM_REGISTER.OBSERVED_DIFFERENCE,
      basis: CLAIM_BASIS.NO_AUTHORIZED_BASIS,
      state: CLAIM_STATE.OBSERVED_DIFFERENCE_NO_BASIS,
    },
    {
      name: "a source this build does not know",
      input: { conditions_source: "some_future_oracle", conditions_status: CONDITIONS_STATUS.MATCHED },
      register: CLAIM_REGISTER.OBSERVED_DIFFERENCE,
      basis: CLAIM_BASIS.UNRECOGNIZED_BASIS,
      state: CLAIM_STATE.OBSERVED_DIFFERENCE_UNRECOGNIZED,
    },
  ];
  const seen = new Set();
  for (const c of cases) {
    const claim = describeClaimState(pairedResult(c.input));
    assert.equal(claim.claim_register, c.register, `${c.name}: register`);
    assert.equal(claim.claim_basis, c.basis, `${c.name}: basis`);
    assert.equal(claim.state_id, c.state, `${c.name}: display state`);
    assert.ok(claim.label && claim.support, `${c.name}: must carry a label and a support line`);
    assert.ok(!seen.has(claim.label), `${c.name}: label must be distinct from every other state's`);
    seen.add(claim.label);
  }
  // The four bases plus the matched register account for five of the six states; the
  // sixth is the no-finding case in test 11. Nothing else is reachable.
  assert.equal(seen.size + 1, Object.keys(CLAIM_STATE).length);
});

test("10) only the matched state may say matched, and no state is orphaned", () => {
  for (const [stateId, ui] of Object.entries(CLAIM_STATE_UI)) {
    if (stateId === CLAIM_STATE.MATCHED_CONDITIONS) {
      assert.match(ui.label, /^Matched conditions$/);
      continue;
    }
    assert.ok(
      !/\bmatched conditions\b/i.test(ui.label) && !/\bmatched conditions\b/i.test(ui.support),
      `${stateId} must not read as a matched-conditions determination`,
    );
  }
  assert.equal(
    claimStateId({ claim_register: CLAIM_REGISTER.MATCHED_CONDITIONS }),
    CLAIM_STATE.MATCHED_CONDITIONS,
  );
  // Every CLAIM_STATE has copy and every copy entry is a CLAIM_STATE. An orphan on
  // either side is a state that renders undefined or a label nothing can reach.
  assert.deepEqual(Object.keys(CLAIM_STATE_UI).sort(), Object.values(CLAIM_STATE).sort());
});

test("11) a paired run with no recorded finding has no basis to report", () => {
  const empty = buildCanonicalResult({ surface: "paired", findings: [], inspection_method_version: "2.0" });
  const claim = describeClaimState(empty);
  assert.equal(claim.state_id, CLAIM_STATE.NO_CLAIM);
  assert.equal(claim.label, "Basis unavailable");
  assert.equal(claim.claim_basis, null, "there is nothing to read a basis from, so none is reported");
});

test("12) the basis is read from recorded_findings, so the surfacing contract cannot move it", () => {
  // This finding's probe-side snippet does not occur in the probe answer, so it is
  // recorded and does not surface. The conditions basis is a property of how the pair
  // was captured, so it must still be legible.
  const canonical = pairedResult({
    conditions_source: CLIENT_DECLARATION_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.MATCHED,
    surfacing: false,
  });
  assert.equal(countOf(canonical, "probe_surfaced_differences"), 0, "nothing surfaced");
  assert.equal(countOf(canonical, "recorded_findings"), 1, "but the finding is recorded");
  assert.equal(describeClaimState(canonical).state_id, CLAIM_STATE.OBSERVED_DIFFERENCE_REPORTED);
});

test("13) a single-answer result reports no claim state at all", () => {
  assert.equal(describeClaimState(singleResult()), null, "the claim register is a paired construction");
  for (const input of [null, undefined, {}, { surface: "single" }]) {
    assert.equal(describeClaimState(input), null);
  }
});
