// Guardrail: the acceptance board must cover every state it claims to cover, and the
// one fixture that bypasses the endpoint adapter must not drift away from it.
// Run: node --test test/qa-board-coverage.test.mjs
//
// The board is the pass's evidence. Its weakest point is that a scenario can be
// deleted, renamed, or quietly re-pointed at a different payload, and the only thing
// that notices is whoever happens to read the manifest. These tests make the coverage
// claims themselves checkable: every claim state the interface can display has a
// scenario, both provenance renderings have one, and the resolution tally's four
// counters are asserted per scenario rather than summarized.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  SCENARIOS,
  CLAIM_BASIS_INPUTS,
  PAIRED_MODEL_OUTPUT,
  SYNTHETIC,
  assertScenarioIntegrity,
  claimBasisCanonical,
  resolvePayloads,
  scenarioPairedProvenance,
} from "../scripts/qa/scenarios.mjs";
import { CLAIM_STATE, CLAIM_STATE_UI, describeClaimState } from "../reader-provenance.js";
import { CONDITIONS_STATUS, selectSubset } from "../reader-result.js";
import { buildCanonicalPaired, parsePairedMeasurement } from "../api/read-paired.js";

const scenario = (name) => {
  const s = SCENARIOS[name];
  assert.ok(s, `the board has no scenario named ${name}`);
  return s;
};

const paired = (name) => {
  const p = resolvePayloads(scenario(name))["/api/read-paired"];
  assert.ok(p, `${name} stubs no paired route`);
  return p;
};

// ── Every fixture is self-consistent ─────────────────────────────────────────

test("every board scenario passes its own integrity checks", () => {
  for (const [name, s] of Object.entries(SCENARIOS)) {
    assert.deepEqual(assertScenarioIntegrity(s), [], `${name} failed integrity`);
  }
});

// ── Claim-state coverage (item 7A) ───────────────────────────────────────────
//
// The register has six display states. Four of them are unreachable through any
// endpoint in this build, which is exactly why they need photographing: without a
// board state, the first person to see one of those labels rendered would be a user
// whose run reached it. This test is what makes "all six are covered" a fact rather
// than a claim in a manifest.

test("every claim state the interface can display has a covering board scenario", () => {
  const covered = new Map();
  for (const [name, s] of Object.entries(SCENARIOS)) {
    if (!s.claimState) continue;
    if (!covered.has(s.claimState)) covered.set(s.claimState, []);
    covered.get(s.claimState).push(name);
  }
  // The live state is covered by the ordinary paired scenarios, which do not declare
  // a claimState because they are not about the claim row. It is read off the fixture
  // instead of asserted by name, so renaming a scenario cannot fake the coverage.
  for (const name of ["paired-matched", "paired-unmatched", "paired-rejected-snippet"]) {
    const id = describeClaimState(paired(name).result).state_id;
    if (!covered.has(id)) covered.set(id, []);
    covered.get(id).push(name);
  }

  const missing = Object.values(CLAIM_STATE).filter((id) => !covered.has(id));
  assert.deepEqual(
    missing,
    [],
    `claim states with no board scenario: ${missing.join(", ")}. Every state reader-provenance.js ` +
      `can display must be photographed before a user's run is the first thing that renders it.`,
  );
});

test("each declared claim state matches what the register returns, and carries its own label", () => {
  const labelByState = new Map();
  for (const [name, s] of Object.entries(SCENARIOS)) {
    if (!s.claimState) continue;
    const claim = describeClaimState(paired(name).result);
    assert.ok(claim, `${name} declares a claim state but its result is not paired`);
    assert.equal(claim.state_id, s.claimState, `${name} declares ${s.claimState} but renders ${claim.state_id}`);
    assert.equal(claim.label, CLAIM_STATE_UI[claim.state_id].label);
    // The label has to be in the DOM assertions, or the capture proves nothing about
    // the state it is filed under.
    assert.ok(
      (s.assertText || []).some((t) => claim.label.includes(t) || t.includes(claim.label)),
      `${name} does not assert its own claim label (${JSON.stringify(claim.label)}) in assertText`,
    );
    labelByState.set(claim.state_id, claim.label);
  }
  // Distinct labels per distinct state. Keyed by state, not by scenario: more than one
  // scenario may legitimately render the same state — provenance-complete borrows the
  // authorized-match fixture to get a pinned build — and that is reuse, not collision.
  // What must never happen is two STATES wearing one label, because then the label on
  // an image no longer identifies which state produced it.
  const labels = [...labelByState.values()];
  assert.equal(
    new Set(labels).size,
    labels.length,
    `two claim states share one visible label, so a capture cannot be read back to a state: ${labels.join(" | ")}`,
  );
});

// ── The one deliberate bypass of the endpoint adapter ────────────────────────
//
// claimBasisCanonical exists because buildCanonicalPaired stamps every finding
// UNAVAILABLE with no conditions source, so four display states cannot be reached
// through it. The bypass is safe only while it stays a bypass of the CLAIM TRIPLE and
// nothing else. An adapter change the builder does not follow has to fail here, in
// CI, rather than quietly blessing a fixture the endpoint could no longer produce.

const CLAIM_TRIPLE = ["claim_register", "claim_basis", "conditions_status"];

test("the claim-basis builder and the endpoint adapter differ only in the claim triple", () => {
  // One input, two builders. Isolating the input is what makes the comparison mean
  // something: any difference in the output is a difference between the builders.
  const pm = parsePairedMeasurement(PAIRED_MODEL_OUTPUT);
  const fromAdapter = buildCanonicalPaired(pm, SYNTHETIC.SYNTHETIC_ANSWER, SYNTHETIC.SYNTHETIC_SECOND_ANSWER);
  const fromBuilder = claimBasisCanonical({
    conditions_source: "server_observed_pair_conditions",
    conditions_status: CONDITIONS_STATUS.MATCHED,
  });

  assert.deepEqual(Object.keys(fromBuilder), Object.keys(fromAdapter));
  for (const key of Object.keys(fromAdapter)) {
    if (key === "findings") continue;
    assert.deepEqual(fromBuilder[key], fromAdapter[key], `the bypass builder diverged from the adapter at ${key}`);
  }

  assert.equal(fromBuilder.findings.length, fromAdapter.findings.length);
  for (const [i, mine] of fromBuilder.findings.entries()) {
    const theirs = fromAdapter.findings[i];
    assert.deepEqual(Object.keys(mine), Object.keys(theirs));
    for (const key of Object.keys(theirs)) {
      if (CLAIM_TRIPLE.includes(key)) continue;
      assert.deepEqual(mine[key], theirs[key], `finding ${i} diverged from the adapter at ${key}`);
    }
    // And the triple really is different, or the bypass is pointless.
    assert.notDeepEqual(
      CLAIM_TRIPLE.map((k) => mine[k]),
      CLAIM_TRIPLE.map((k) => theirs[k]),
    );
  }
});

test("the adapter still supplies no conditions basis, which is why the bypass exists", () => {
  // The day this fails is the day the authoritative conditions field lands and the
  // bypass can be deleted. The assertion message says so, because the alternative is
  // someone finding four unexplained fixtures years later.
  for (const f of selectSubset(paired("paired-matched").result, "recorded_findings")) {
    assert.equal(
      f.conditions_status,
      CONDITIONS_STATUS.UNAVAILABLE,
      "the paired endpoint now records a conditions status. If an authorized conditions source has " +
        "landed, claimBasisCanonical's bypass and this test should be retired together.",
    );
  }
});

test("every claim-basis input produces a distinct display state", () => {
  const states = Object.keys(CLAIM_BASIS_INPUTS).map(
    (key) => describeClaimState(claimBasisCanonical(CLAIM_BASIS_INPUTS[key])).state_id,
  );
  assert.equal(new Set(states).size, states.length, `claim-basis inputs collide: ${states.join(", ")}`);
});

// ── Provenance strip, complete and partial (item 7) ──────────────────────────

test("the board photographs a complete provenance strip and a partial one", () => {
  const complete = scenarioPairedProvenance(scenario("provenance-complete"));
  assert.equal(complete.complete, true);
  assert.equal(complete.unknown_count, 0);
  assert.equal(complete.fields.length, 7, "the paired strip has seven rows");
  for (const f of complete.fields) assert.ok(f.known, `${f.id} is unknown on the complete strip`);

  const partial = scenarioPairedProvenance(scenario("provenance-partial"));
  assert.equal(partial.complete, false);
  assert.equal(partial.fields.length, 7, "a partial strip drops no row; absence is stated in words");
  assert.deepEqual(
    partial.fields.filter((f) => !f.known).map((f) => f.id),
    ["answer_model", "model_build"],
  );
  // Absence is stated, and stated in words chosen for the field.
  assert.equal(partial.fields.find((f) => f.id === "answer_model").value, "none given");
  assert.equal(partial.fields.find((f) => f.id === "model_build").value, "not pinned");
});

test("both provenance scenarios frame the paired strip, not the single read's", () => {
  // A paired screen carries two strips. A bare ".wb-prov" resolves to the first in the
  // document — the single read's — which lacks the paired method row and looks right.
  for (const name of ["provenance-complete", "provenance-partial"]) {
    const s = scenario(name);
    assert.ok(
      s.focus.startsWith(".wb-loop__reveal "),
      `${name} must frame the paired strip explicitly; ".wb-prov" alone gets the single read's`,
    );
    assert.ok(s.assertSelector.startsWith(".wb-loop__reveal "));
  }
});

// ── The resolution tally: four counters, asserted separately ─────────────────
//
// The point of naming four counters is that they answer four different questions. A
// summed assertion would pass while a proposal silently moved from resolved to
// rejected, which is the one movement anybody cares about.

const TALLY_KEYS = [
  "snippets_proposed",
  "snippets_resolved_unique",
  "snippets_rejected_unlocatable",
  "snippets_rejected_ambiguous",
];

const EXPECTED_TALLY = {
  "paired-matched": { snippets_proposed: 3, snippets_resolved_unique: 3, snippets_rejected_unlocatable: 0, snippets_rejected_ambiguous: 0 },
  "paired-unmatched": { snippets_proposed: 3, snippets_resolved_unique: 3, snippets_rejected_unlocatable: 0, snippets_rejected_ambiguous: 0 },
  "paired-rejected-snippet": { snippets_proposed: 3, snippets_resolved_unique: 2, snippets_rejected_unlocatable: 1, snippets_rejected_ambiguous: 0 },
  "paired-empty": { snippets_proposed: 0, snippets_resolved_unique: 0, snippets_rejected_unlocatable: 0, snippets_rejected_ambiguous: 0 },
};

test("each paired scenario's four resolution counters are asserted one by one", () => {
  for (const [name, want] of Object.entries(EXPECTED_TALLY)) {
    const got = paired(name).result.snippet_resolution;
    for (const key of TALLY_KEYS) {
      assert.equal(got[key], want[key], `${name}: ${key} is ${got[key]}, expected ${want[key]}`);
    }
    // The tally is an account of every proposal, so it has to balance.
    assert.equal(
      want.snippets_resolved_unique + want.snippets_rejected_unlocatable + want.snippets_rejected_ambiguous,
      want.snippets_proposed,
      `${name}: the counters do not account for every proposal`,
    );
  }
});

test("a rejected candidate is instrumentation, never a result row", () => {
  const p = paired("paired-rejected-snippet");
  const tally = p.result.snippet_resolution;
  assert.ok(tally.snippets_rejected_unlocatable > 0, "this scenario exists to carry a rejection");

  // The rejected text is in no wire row, no count, and no rendered side. It exists in
  // the tally as a number and nowhere else — which is the whole contract: the run is
  // accountable for what it proposed without ever showing an unresolved quotation.
  const REJECTED = "a tenant who waits too long forfeits the penalty entirely";
  assert.ok(!JSON.stringify(p.delta_items).includes(REJECTED), "the rejected snippet reached a delta item");
  assert.ok(!JSON.stringify(p.signal_counts).includes(REJECTED));

  const surfaced = p.result.counts.probe_surfaced_differences.value;
  const recorded = p.result.counts.recorded_findings.value;
  assert.equal(p.delta_items.length, surfaced, "the visible rows and the visible count are one collection");
  assert.ok(recorded > surfaced, "the rejection has to be recorded even though it is not surfaced");
  assert.equal(
    Object.values(p.signal_counts).reduce((a, b) => a + b, 0),
    surfaced,
    "the signal tally counts surfaced rows, not recorded findings",
  );

  // Held against the scenario that resolved everything: same flow, same answers, one
  // row fewer and one count lower. That difference IS what the two images show.
  const clean = paired("paired-matched");
  assert.equal(clean.result.counts.recorded_findings.value, recorded);
  assert.equal(clean.delta_items.length, surfaced + 1);
});

// ── Empty states ─────────────────────────────────────────────────────────────

test("every empty-state scenario declares which surface goes empty, and means it", () => {
  const single = ["single-empty", "single-empty-read"];
  const pairedEmpty = ["paired-empty"];
  for (const name of single) {
    assert.equal(scenario(name).empty, "single");
    const read = resolvePayloads(scenario(name))["/api/read"];
    assert.equal(read.measurement.findings.length, 0);
    assert.equal(read.result.counts.recorded_findings.value, 0);
    assert.deepEqual(read.what_was_left_out, []);
    assert.equal(read.how_it_was_shaped, "");
  }
  for (const name of pairedEmpty) {
    assert.equal(scenario(name).empty, "paired");
    const p = paired(name);
    assert.equal(p.result.counts.probe_surfaced_differences.value, 0);
    assert.equal(p.delta_items.length, 0);
    assert.equal(describeClaimState(p.result).state_id, CLAIM_STATE.NO_CLAIM);
  }
});

test("the empty single read does not contradict itself", () => {
  // A "partial" badge glosses as "Some material context was missing or shaped", which
  // would print above three panels reporting nothing missing. The fixture has to agree
  // with itself or the capture photographs the fixture, not the product.
  const read = resolvePayloads(scenario("single-empty"))["/api/read"];
  assert.equal(read.completeness, "full");
});
