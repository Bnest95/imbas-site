// Guardrail: the six paired claim-register states, checked on the INTEGRATION path
// rather than on normalizeClaim alone.
//
// test/reader-result.test.mjs already pins normalizeClaim's truth table directly. That is
// not enough. Pass 2B-A changed the paired canonical result, the claim register, basis
// normalization, the named counts, and the paired receipt — five links in one chain — and
// a correct normalizer wired to the wrong producer still ships a false claim. So every
// check below runs the REAL paired adapter (api/read-paired.js buildCanonicalPaired) or the
// REAL construction door and the REAL receipt serializer (reader-receipt.js
// buildPairedReceipt), and reads the value a surface would actually receive.
//
// The load-bearing asymmetry: MATCHED_CONDITIONS needs an enumerated authorized basis AND
// an affirmative MATCHED determination. Absent, unrecognized, unavailable, and
// client-declared bases all land on OBSERVED_DIFFERENCE. Nothing normalizes upward. No live
// surface supplies an authorized basis today — the paste-back capture is client-side and the
// endpoint never sees it — so check 3 is the production case and checks 1 and 6 exist to
// prove the semantic contract a later pass will implement is already enforced here.
//
// Check 5 is the honest one. See its test body: the named subset is correct, and
// PairedDeltaView does not yet read it.
// Run: node --test test/paired-claim-register-normalization.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
  buildCanonicalResult,
  buildFinding,
  countOf,
  selectSubset,
} from "../reader-result.js";
import { buildCanonicalPaired, parsePairedMeasurement } from "../api/read-paired.js";
import { buildPairedReceipt, canonicalizeForHash } from "../reader-receipt.js";

const OPEN_ANSWER = "A landlord must return a security deposit within 30 days of the tenant moving out.";
const PROBE_ANSWER =
  "The deadline depends on the state. It runs from 14 days in some states to 60 days in others. " +
  "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.";

// One difference in the exact shape api/read-paired.js receives from the model at
// paired_method_version 2.0: an interpretation the model authored, plus a verbatim
// snippet per side that the server looks up rather than trusts.
function difference({ interpretation, open = null, targeted, signal_pattern = "Omission" }) {
  return {
    signal_pattern,
    interpretation,
    snippets: [
      { artifact_role: ARTIFACT_TARGETED, status: "PRESENT", verbatim_snippet: targeted },
      open === null
        ? { artifact_role: ARTIFACT_ORIGINAL, status: "ABSENT" }
        : { artifact_role: ARTIFACT_ORIGINAL, status: "PRESENT", verbatim_snippet: open },
    ],
  };
}

// Through the REAL parser and the REAL adapter, in that order. Hand-building the
// parsed shape here would let the fixture drift from what the endpoint actually
// hands the door — the exact failure this file was written to catch.
function canonicalFrom(differences) {
  const pm = parsePairedMeasurement({ differences, gap_estimate: 2, estimate_rationale: "r" });
  assert.ok(pm, "the fixture must parse");
  return buildCanonicalPaired(pm, { open: OPEN_ANSWER, targeted: PROBE_ANSWER });
}

const QUOTABLE_DELTA = difference({
  interpretation: "The second answer names the deadline as state-set where the first gave one number.",
  open: OPEN_ANSWER,
  targeted: "The deadline depends on the state.",
});

const OMISSION_DELTA = difference({
  interpretation: "The second answer names a penalty; the first did not mention one.",
  targeted: "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.",
});

// Build a paired finding directly through the door, so a basis the live endpoint cannot
// supply can still be exercised against the real validator.
function pairedFindingWithBasis({ conditions_source, conditions_status, index = 0 }) {
  return buildFinding({
    index,
    shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
    class_label: "Omission",
    statement: "The probe answer named a penalty the open answer did not.",
    quotations: { [ARTIFACT_TARGETED]: "pay the tenant a penalty" },
    artifacts: { [ARTIFACT_ORIGINAL]: OPEN_ANSWER, [ARTIFACT_TARGETED]: PROBE_ANSWER },
    comparison_direction: COMPARISON_DIRECTION.PROBE_ONLY,
    conditions_source,
    conditions_status,
  });
}

function pairedResultWithBasis(args) {
  return buildCanonicalResult({
    surface: "paired",
    findings: [pairedFindingWithBasis(args)],
    inspection_method_version: "test-paired-method",
    provider: "anthropic",
    model: "test-model",
    model_snapshot_or_build: "",
  });
}

// Serialize through the real paired receipt and JSON round-trip it, so what a check reads
// is what a reloaded surface would read.
function throughReceipt(canonical) {
  const receipt = buildPairedReceipt({
    generatedAt: "2026-07-27T00:00:00.000Z",
    openRun: null,
    pairedAnalysis: { canonical, delta_items: [], gap_estimate: 1 },
  });
  return JSON.parse(JSON.stringify(receipt)).paired_analysis.canonical;
}

function soleFinding(canonical) {
  assert.equal(canonical.findings.length, 1);
  return canonical.findings[0];
}

test("1) an authorized MATCHED basis permits MATCHED_CONDITIONS, and it survives the receipt", () => {
  const canonical = pairedResultWithBasis({
    conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.MATCHED,
  });
  const built = soleFinding(canonical);
  assert.equal(built.claim_register, CLAIM_REGISTER.MATCHED_CONDITIONS);
  assert.equal(built.claim_basis, CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS);
  assert.equal(built.conditions_status, CONDITIONS_STATUS.MATCHED);

  // The serializer must carry the claim, not recompute or drop it. A matched claim that
  // does not survive the receipt is a claim no reviewer can audit later.
  const reloaded = soleFinding(throughReceipt(canonical));
  assert.equal(reloaded.claim_register, CLAIM_REGISTER.MATCHED_CONDITIONS);
  assert.equal(reloaded.claim_basis, CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS);
  assert.equal(reloaded.conditions_status, CONDITIONS_STATUS.MATCHED);
});

test("2) a REPORTED_CLIENT_DECLARATION saying MATCHED normalizes to OBSERVED_DIFFERENCE", () => {
  const built = soleFinding(
    pairedResultWithBasis({
      conditions_source: CLIENT_DECLARATION_SOURCES[0],
      conditions_status: CONDITIONS_STATUS.MATCHED,
    }),
  );
  assert.equal(built.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(built.claim_basis, CLAIM_BASIS.REPORTED_CLIENT_DECLARATION);
  // The declaration is preserved as provenance. Preserving it is not honouring it.
  assert.equal(built.conditions_status, CONDITIONS_STATUS.MATCHED);
  assert.notEqual(built.claim_basis, CLAIM_BASIS.AUTHORIZED_MATCHED_BASIS);
});

test("3) an absent basis normalizes downward — and that is what the live endpoint produces", () => {
  // Not a synthetic basis: this is the real adapter on real delta items. The paste-back
  // capture never reaches this endpoint, so every paired finding in production lands here.
  const canonical = canonicalFrom([QUOTABLE_DELTA, OMISSION_DELTA]);
  assert.equal(canonical.findings.length, 2);
  for (const f of canonical.findings) {
    assert.equal(f.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE, "the live paired path may never claim matched conditions");
    assert.equal(f.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
    assert.equal(f.conditions_status, CONDITIONS_STATUS.UNAVAILABLE);
  }
  // And no MATCHED_CONDITIONS string is anywhere in the serialized paired receipt.
  const wire = canonicalizeForHash(
    buildPairedReceipt({ generatedAt: "2026-07-27T00:00:00.000Z", openRun: null, pairedAnalysis: { canonical } }),
  );
  assert.equal(wire.includes(CLAIM_REGISTER.MATCHED_CONDITIONS), false);
});

test("4) an unrecognized basis normalizes downward and stays distinguishable from an absent one", () => {
  const built = soleFinding(
    pairedResultWithBasis({ conditions_source: "trust_me_bro", conditions_status: CONDITIONS_STATUS.MATCHED }),
  );
  assert.equal(built.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(built.claim_basis, CLAIM_BASIS.UNRECOGNIZED_BASIS);
  // The distinction matters downstream: an absent basis is a surface that never had one,
  // an unrecognized basis is a surface that supplied something this build does not accept.
  assert.notEqual(built.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
  assert.equal(soleFinding(throughReceipt(pairedResultWithBasis({ conditions_source: "trust_me_bro" }))).claim_basis, CLAIM_BASIS.UNRECOGNIZED_BASIS);
});

test("5) the paired tally the DATA layer offers is the named PROBE_ONLY subset, matched or unmatched", () => {
  const canonical = canonicalFrom([QUOTABLE_DELTA, OMISSION_DELTA]);
  // Both snippets resolve against the probe answer; the second's open side is legitimately
  // ABSENT, which is what an omission is. Both surface.
  assert.equal(countOf(canonical, "probe_surfaced_differences"), 2);
  assert.equal(countOf(canonical, "recorded_findings"), 2);
  for (const f of selectSubset(canonical, "probe_surfaced_differences")) {
    assert.equal(f.comparison_direction, COMPARISON_DIRECTION.PROBE_ONLY);
  }

  // The named count is a function of the anchor contract, NOT of the claim register, so the
  // same tally holds whether conditions were matched or unmatched. Proven by moving only
  // the basis and re-counting.
  const matched = buildCanonicalResult({
    surface: "paired",
    findings: [
      pairedFindingWithBasis({
        conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
        conditions_status: CONDITIONS_STATUS.MATCHED,
        index: 0,
      }),
    ],
    inspection_method_version: "v",
    provider: "anthropic",
    model: "m",
    model_snapshot_or_build: "",
  });
  const unmatched = buildCanonicalResult({
    surface: "paired",
    findings: [
      pairedFindingWithBasis({
        conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
        conditions_status: CONDITIONS_STATUS.UNMATCHED,
        index: 0,
      }),
    ],
    inspection_method_version: "v",
    provider: "anthropic",
    model: "m",
    model_snapshot_or_build: "",
  });
  assert.equal(soleFinding(matched).claim_register, CLAIM_REGISTER.MATCHED_CONDITIONS);
  assert.equal(soleFinding(unmatched).claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE);
  assert.equal(countOf(matched, "probe_surfaced_differences"), 1, "a matched claim does not add a difference");
  assert.equal(countOf(unmatched, "probe_surfaced_differences"), 1, "an unmatched claim does not remove one");
});

// ── The gap check 5 exposed, now closed ──────────────────────────────────────────
// Until Pass 2B-A2 the named subset above was correct and available, and PairedDeltaView
// did not read it: its visible tally came from the wire field signal_counts and its rows
// from delta_items. Those were pre-canonical, so they counted a delta item whose quotation
// did NOT occur in the probe answer. Test 5b demonstrated that divergence and instructed
// its own deletion once the view was repointed; it is gone, and 5a is now the guard on the
// other side — the view reads the named subset and nothing else.

test("5a) PairedDeltaView reads the named subset, not the pre-canonical wire fields", () => {
  const src = readFileSync(
    process.env.WORKBENCH_APP_JSX || fileURLToPath(new URL("../workbench-app.jsx", import.meta.url)),
    "utf8",
  );
  const start = src.indexOf("function PairedDeltaView(");
  assert.notEqual(start, -1, "workbench-app.jsx must define PairedDeltaView");
  const rest = src.slice(start);
  const next = rest.indexOf("\nfunction ", 1);
  const view = next === -1 ? rest : rest.slice(0, next);

  assert.match(view, /probe_surfaced_differences/, "the rows and the tally must come from the named subset");
  assert.equal(view.includes("paired.signal_counts"), false, "the wire tally must not drive a visible count");
  // paired.delta_items survives on exactly one line: the legacy binding, which renders a
  // pre-2.0 record's readings and none of its excerpts. Anywhere else is a regression.
  const wireLines = view.split("\n").filter((l) => l.includes("paired.delta_items"));
  assert.equal(wireLines.length, 1, `the wire item array may only be read on the legacy branch: ${wireLines.join(" | ")}`);
  assert.match(wireLines[0], /legacyItems = legacy && Array\.isArray\(paired\.delta_items\)/);
});

test("5b) a snippet that does not occur in the probe answer cannot become a row or a count", () => {
  const fabricated = difference({
    interpretation: "A difference whose supplied probe snippet is not in the probe answer.",
    targeted: "words the probe answer does not contain anywhere",
  });
  const canonical = canonicalFrom([QUOTABLE_DELTA, fabricated]);

  assert.equal(countOf(canonical, "probe_surfaced_differences"), 1, "the named subset excludes it");
  assert.equal(countOf(canonical, "recorded_findings"), 2, "and the record still keeps it");
  // The rejection is enumerated on the anchor, so the record says WHY, not just that.
  const rejected = canonical.findings[1].anchors.find((a) => a.role === ARTIFACT_TARGETED);
  assert.equal(rejected.status, "UNRESOLVED");
  assert.equal(rejected.rejection_reason, "UNLOCATABLE_SNIPPET");
  assert.equal(rejected.quote, "", "an unresolved anchor carries no text a renderer could quote");
});

test("6) a surface reloaded without the basis cannot reconstruct the matched claim", () => {
  const canonical = pairedResultWithBasis({
    conditions_source: AUTHORIZED_CONDITIONS_SOURCES[0],
    conditions_status: CONDITIONS_STATUS.MATCHED,
  });
  assert.equal(soleFinding(canonical).claim_register, CLAIM_REGISTER.MATCHED_CONDITIONS);

  // A surface that persisted the finding but dropped the basis — the realistic loss, since
  // conditions provenance has no authoritative persisted field yet. Rebuilding through the
  // door with only what survived must land on the lower register.
  const wire = JSON.parse(JSON.stringify(soleFinding(canonical)));
  assert.equal("conditions_source" in wire, false, "the canonical finding does not publish the raw source");

  const rebuilt = soleFinding(
    buildCanonicalResult({
      surface: "paired",
      findings: [
        buildFinding({
          index: 0,
          shape: SHAPE_PAIRED_OBSERVED_DIFFERENCE,
          class_label: wire.class_label,
          statement: wire.statement,
          quotations: { [ARTIFACT_TARGETED]: "pay the tenant a penalty" },
          artifacts: { [ARTIFACT_ORIGINAL]: OPEN_ANSWER, [ARTIFACT_TARGETED]: PROBE_ANSWER },
          comparison_direction: wire.comparison_direction,
          // Everything the reload still has. The basis is gone.
          conditions_status: wire.conditions_status,
        }),
      ],
      inspection_method_version: "v",
      provider: "anthropic",
      model: "m",
      model_snapshot_or_build: "",
    }),
  );
  assert.equal(rebuilt.claim_register, CLAIM_REGISTER.OBSERVED_DIFFERENCE, "a lost basis must not survive as a matched claim");
  assert.equal(rebuilt.claim_basis, CLAIM_BASIS.NO_AUTHORIZED_BASIS);
  // The status it did keep is not sufficient on its own. That is the whole point.
  assert.equal(rebuilt.conditions_status, CONDITIONS_STATUS.MATCHED);
});
