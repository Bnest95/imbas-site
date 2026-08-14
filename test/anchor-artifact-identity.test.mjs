// Anchor artifact identity — the three trust boundaries a span crosses.
//
// The defect this file exists to keep closed (docs/audits/ANCHOR-INTEGRITY-AUDIT-2026-08-02.md):
// a span could NAME artifact A and RESOLVE against artifact B. Identity was carried
// as a caller-supplied string alongside a separately-supplied body, so the two could
// disagree and nothing downstream asked. Every layer trusted the layer above it.
//
// The three boundaries, all patched together because patching one leaves the others
// assuming upstream correctness:
//   1. CONSTRUCTION  reader-result.js quotedAnchor / buildAnchor / buildFinding
//   2. RESOLUTION    reader-checks.js resolveSpanAgainst / resolveSpan / validateCheck
//   3. EXPORT        reader-review-record.js validateReviewRecord
//
// A rejection asserted only as "rejected" cannot tell a real rejection from a
// rejection for an unrelated reason, and a rejection for the wrong reason is a
// false pass. Every negative test below asserts the CAUSE.
//
// ── Mutation set ──────────────────────────────────────────────────────────────
// Enforced executably by test/anchor-artifact-identity-mutations.test.mjs, which
// patches the source and requires the named test to fail. Each mutation restores
// one clause of the pre-patch behaviour:
//   M1  resolver ignores artifact_id          → resolveSpanAgainst skips the map lookup
//   M2  builder accepts a caller-supplied id  → quotedAnchor stamps span.artifact_id
//   M3  record validator skips artifact lookup→ validateRecordSpans returns ok blindly
//   M4  open/targeted bodies swapped          → buildCanonicalPaired binds by position
//   M5  duplicate artifact ids accepted       → normalizeArtifactMap overwrites silently
//
// Run: node --test test/anchor-artifact-identity.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  SPAN_REJECTION,
  normalizeArtifactMap,
  artifactForRole,
  assertDistinctArtifactBodies,
  resolveSpanAgainst,
  resolveSpan,
  buildCheckRegister,
  validateCheck,
} from "../reader-checks.js";
import {
  ARTIFACT_ORIGINAL,
  ARTIFACT_TARGETED,
  ANCHOR_STATUS,
  quotedAnchor,
  buildFinding,
} from "../reader-result.js";
import {
  buildReviewRecord,
  validateReviewRecord,
  REVIEW_GRAPH_SCHEMA_VERSION,
} from "../reader-review-record.js";
import { buildCanonicalPaired, parsePairedMeasurement } from "../api/read-paired.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");

// ── The adversarial pair (audit §6) ───────────────────────────────────────────
//
// Two DIFFERENT documents that share an opening. Both quotes below occur in both
// bodies at BYTE-IDENTICAL offsets. Matching text is therefore worthless as
// evidence of provenance, which is exactly the condition the committed corpus
// cannot produce and exactly the condition the patch must survive.

const SHARED_PREFIX =
  "A landlord must return a security deposit within 30 days. " +
  "If the landlord keeps any part of the deposit, they must send an itemized list.";
const ARTIFACT_A =
  SHARED_PREFIX + " Most tenants get the full amount back, so there is usually nothing to worry about.";
const ARTIFACT_B =
  SHARED_PREFIX + " The deadline varies by state and several states impose a penalty when it is missed.";

const PROP = "A landlord must return a security deposit within 30 days.";
const DEP = "If the landlord keeps any part of the deposit, they must send an itemized list.";

const TWO = { artifact_A: ARTIFACT_A, artifact_B: ARTIFACT_B };

test("fixture sanity: the two artifacts differ, yet carry both quotes at identical offsets", () => {
  assert.notEqual(ARTIFACT_A, ARTIFACT_B, "two documents, not one");
  for (const quote of [PROP, DEP]) {
    const at = ARTIFACT_A.indexOf(quote);
    assert.ok(at >= 0);
    assert.equal(ARTIFACT_B.indexOf(quote), at, "identical offsets is the whole point of the fixture");
    assert.equal(ARTIFACT_A.slice(at, at + quote.length), ARTIFACT_B.slice(at, at + quote.length));
  }
});

// ── A. IDENTICAL TEXT ─────────────────────────────────────────────────────────

test("A: a span naming artifact A resolves against A, and names the artifact it proved against", () => {
  const span = { artifact_id: "artifact_A", start: 0, end: PROP.length, quote: PROP };
  const r = resolveSpanAgainst(span, TWO);
  assert.equal(r.ok, true);
  assert.equal(r.artifact.id, "artifact_A", "the resolver reports WHICH artifact carried it");
  assert.equal(r.artifact.body, ARTIFACT_A);
});

test("A: the same span fails where its named artifact is absent, though B holds the text verbatim", () => {
  const span = { artifact_id: "artifact_A", start: 0, end: PROP.length, quote: PROP };
  // A world containing only B. B carries the quote at these exact offsets, so any
  // resolver that searched instead of looking up would accept. This one rejects.
  const onlyB = { artifact_B: ARTIFACT_B };
  const r = resolveSpanAgainst(span, onlyB);
  assert.equal(r.ok, false);
  assert.equal(r.reason, SPAN_REJECTION.UNKNOWN_ARTIFACT);
  assert.equal(ARTIFACT_B.slice(span.start, span.end), PROP, "and B really does hold it");
});

test("A: resolution is a lookup, never a scan — no artifact in the map is consulted but the named one", () => {
  // Rename A's entry. The body is unchanged and still present in the map; only the
  // identity the span asks for is gone. A scan would find the text; a lookup cannot.
  const renamed = { some_other_id: ARTIFACT_A, artifact_B: ARTIFACT_B };
  const r = resolveSpanAgainst({ artifact_id: "artifact_A", start: 0, end: PROP.length, quote: PROP }, renamed);
  assert.equal(r.ok, false);
  assert.equal(r.reason, SPAN_REJECTION.UNKNOWN_ARTIFACT);
});

test("A: role is checked against the named artifact when the caller states one", () => {
  const map = [
    { id: "a1", role: ARTIFACT_ORIGINAL, body: ARTIFACT_A },
    { id: "a2", role: ARTIFACT_TARGETED, body: ARTIFACT_B },
  ];
  const span = { artifact_id: "a1", start: 0, end: PROP.length, quote: PROP };
  assert.equal(resolveSpanAgainst(span, map, { requiredRole: ARTIFACT_ORIGINAL }).ok, true);
  const wrongRole = resolveSpanAgainst(span, map, { requiredRole: ARTIFACT_TARGETED });
  assert.equal(wrongRole.ok, false);
  assert.equal(wrongRole.reason, SPAN_REJECTION.ROLE_MISMATCH);
});

// ── B. WRONG-ID CONSTRUCTION ──────────────────────────────────────────────────

test("B: resolveSpan has no body parameter — id and text cannot be supplied separately", () => {
  // The pre-patch signature was resolveSpan(artifactText, quote, artifactId): a caller
  // located in one body and stamped any id it liked. The span now carries the id of
  // the artifact its own offsets came from, because there is only one source for both.
  const span = resolveSpan(TWO, "artifact_B", PROP);
  assert.equal(span.artifact_id, "artifact_B");
  assert.equal(ARTIFACT_B.slice(span.start, span.end), span.quote);
  assert.equal(resolveSpan(TWO, "artifact_A", PROP).artifact_id, "artifact_A");
});

test("B: quotedAnchor stamps the artifact it was handed, ignoring any id the caller put on the span", () => {
  const artifact = { id: ARTIFACT_ORIGINAL, role: ARTIFACT_ORIGINAL, body: ARTIFACT_A };
  const anchor = quotedAnchor({
    artifact,
    quote: PROP,
    // A caller asserting the targeted answer over open-answer offsets: the exact
    // wrong-id construction the audit demonstrated.
    span: { artifact_id: ARTIFACT_TARGETED, start: 0, end: PROP.length },
  });
  assert.equal(anchor.span.artifact_id, ARTIFACT_ORIGINAL, "the artifact object wins, not the string");
  assert.equal(anchor.role, ARTIFACT_ORIGINAL);
  assert.equal(anchor.status, ANCHOR_STATUS.QUOTED);
});

test("B: quotedAnchor refuses to mint an anchor the named artifact cannot reproduce", () => {
  const targeted = { id: ARTIFACT_TARGETED, role: ARTIFACT_TARGETED, body: "Something else entirely." };
  assert.throws(
    () => quotedAnchor({ artifact: targeted, quote: PROP, span: { start: 0, end: PROP.length } }),
    /must reproduce from the artifact it names/,
  );
});

test("B: an anchor whose quote lives in the other side's body is not minted as QUOTED", () => {
  // The snippet is verbatim in the TARGETED body only, but declared under the
  // original role. Nothing is stamped: the anchor comes back unresolved.
  const finding = buildFinding({
    index: 0,
    shape: "paired_observed_difference",
    class_label: "omission",
    statement: "The open answer stops before the exception.",
    snippets: {
      [ARTIFACT_ORIGINAL]: { verbatim_snippet: "The deadline varies by state", disambiguating_context: "" },
      [ARTIFACT_TARGETED]: { verbatim_snippet: "The deadline varies by state", disambiguating_context: "" },
    },
    artifacts: { [ARTIFACT_ORIGINAL]: ARTIFACT_A, [ARTIFACT_TARGETED]: ARTIFACT_B },
    comparison_direction: "PROBE_ONLY",
    conditions_status: "UNAVAILABLE",
  });
  const open = finding.anchors.find((a) => a.role === ARTIFACT_ORIGINAL);
  const targeted = finding.anchors.find((a) => a.role === ARTIFACT_TARGETED);
  assert.notEqual(open.status, ANCHOR_STATUS.QUOTED, "not in the open body — nothing to quote");
  assert.equal(open.span, null);
  assert.equal(targeted.status, ANCHOR_STATUS.QUOTED, "in the targeted body — quoted, and stamped targeted");
  assert.equal(targeted.span.artifact_id, ARTIFACT_TARGETED);
  assert.equal(ARTIFACT_B.slice(targeted.span.start, targeted.span.end), targeted.quote);
});

test("B: the Check Register stamps every span with the artifact the register was built over", () => {
  const reg = buildCheckRegister({
    artifacts: TWO,
    artifactId: "artifact_A",
    findings: [
      {
        type: "omission",
        check: {
          supporting_proposition: PROP,
          dependent_output: DEP,
          dependency_statement: "The second sentence carries the first.",
          verification_question: "What does the statute say about the deadline?",
          resolver: "authority",
          propagation: "final_conclusion",
        },
      },
    ],
  });
  assert.equal(reg.checks.length, 1);
  const spans = [
    ...reg.checks[0].proposition_at_issue.spans,
    ...reg.checks[0].dependent_output.spans,
    ...reg.detector_events[0].evidence_spans,
  ];
  assert.ok(spans.length >= 3);
  for (const s of spans) {
    assert.equal(s.artifact_id, "artifact_A");
    assert.equal(ARTIFACT_A.slice(s.start, s.end), s.quote);
  }
  // And the register's own validator agrees, against the map it was built from.
  assert.equal(validateCheck(reg.checks[0], reg.detector_events[0], TWO).ok, true);
});

test("B: validateCheck rejects a check re-pointed at an artifact that cannot carry its spans", () => {
  const reg = buildCheckRegister({
    artifacts: TWO,
    artifactId: "artifact_A",
    findings: [
      {
        type: "omission",
        check: {
          supporting_proposition: PROP,
          dependent_output: DEP,
          dependency_statement: "The second sentence carries the first.",
          verification_question: "What does the statute say about the deadline?",
          resolver: "authority",
        },
      },
    ],
  });
  const check = JSON.parse(JSON.stringify(reg.checks[0]));
  const event = JSON.parse(JSON.stringify(reg.detector_events[0]));
  for (const s of check.proposition_at_issue.spans) s.artifact_id = "artifact_B";
  for (const s of check.dependent_output.spans) s.artifact_id = "artifact_B";
  for (const s of event.evidence_spans) s.artifact_id = "artifact_B";

  const shortB = { artifact_A: ARTIFACT_A, artifact_B: "Something else entirely." };
  const r = validateCheck(check, event, shortB);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not resolve against its artifact/);
  assert.match(r.reason, /OFFSETS_OUT_OF_RANGE|QUOTE_MISMATCH/);
});

// ── The Review Record fixture (boundary 3) ────────────────────────────────────
//
// A real, hashed record built the way api/read.js and the exporter build one, then
// mutated per test. Span validation runs BEFORE the integrity block, so a mutated
// record is rejected for the span it carries, not for its now-stale digest.

const RECORD_ANSWER =
  "The board approved the merger on 4 March. The filing is therefore due within thirty days.";
const RECORD_PROP = "The board approved the merger on 4 March.";
const RECORD_DEP = "The filing is therefore due within thirty days.";

async function validRecord() {
  const register = buildCheckRegister({
    artifacts: { [ARTIFACT_ORIGINAL]: RECORD_ANSWER },
    artifactId: ARTIFACT_ORIGINAL,
    findings: [
      {
        type: "omission",
        check: {
          supporting_proposition: RECORD_PROP,
          dependent_output: RECORD_DEP,
          dependency_statement: "The deadline is stated as following from the approval date.",
          verification_question: "Which rule sets the filing deadline?",
          resolver: "authority",
        },
      },
    ],
    inspector: { model: "m", model_version: "m", prompt_version: "reader.v3" },
  });
  assert.equal(register.checks.length, 1, "record fixture must emit a check to have spans to test");
  return buildReviewRecord({
    result: {
      checks: register,
      receipt: {
        open_run: {
          answer: RECORD_ANSWER,
          declared_model: "GPT-5",
          provenance: {
            request_id: "req_anchor_identity",
            run_timestamp: "2026-08-02T11:59:00Z",
            reader_model_version: "m",
            inspector_prompt_version: "reader.v3",
          },
        },
      },
    },
    createdAt: "2026-08-02T12:00:00Z",
  });
}

const clone = (v) => JSON.parse(JSON.stringify(v));

test("record fixture is valid before mutation", async () => {
  const r = await validRecord();
  assert.deepEqual(validateReviewRecord(r), { ok: true });
});

// ── C. REVIEW RECORD WRONG ARTIFACT ───────────────────────────────────────────

test("C: a span naming targeted_answer whose text belongs only to original_answer is rejected", async () => {
  const rec = clone(await validRecord());
  rec.contents.artifacts.push({
    id: ARTIFACT_TARGETED,
    role: ARTIFACT_TARGETED,
    body: "A wholly different second answer that shares no sentence with the first.",
    verified: false,
    supplied_at: "2026-08-02T11:59:00Z",
  });
  for (const s of rec.contents.detector_events[0].evidence_spans) s.artifact_id = ARTIFACT_TARGETED;

  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not resolve against artifact targeted_answer/);
  assert.match(r.reason, /OFFSETS_OUT_OF_RANGE|QUOTE_MISMATCH/);
});

test("C: the record validator does not take construction on trust — it re-proves every check span", async () => {
  const rec = clone(await validRecord());
  rec.contents.artifacts.push({
    id: ARTIFACT_TARGETED,
    role: ARTIFACT_TARGETED,
    body: RECORD_ANSWER + " An extra sentence so the offsets stay in range.",
    verified: false,
    supplied_at: "2026-08-02T11:59:00Z",
  });
  // Offsets are IN RANGE for the targeted body and the quote is even present in it,
  // just not at these offsets. Only an exact slice comparison catches this.
  for (const s of rec.contents.checks[0].proposition_at_issue.spans) {
    s.artifact_id = ARTIFACT_TARGETED;
    s.start += 4;
    s.end += 4;
  }
  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /proposition_at_issue span does not resolve against artifact targeted_answer/);
  assert.match(r.reason, /QUOTE_MISMATCH/);
});

test("C: an unknown artifact_id is rejected rather than ignored", async () => {
  const rec = clone(await validRecord());
  for (const s of rec.contents.detector_events[0].evidence_spans) s.artifact_id = "no_such_artifact";
  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /UNKNOWN_ARTIFACT/);
});

// ── D. NAMED ARTIFACT TOO SHORT ───────────────────────────────────────────────

test("D: a span whose named artifact is too short fails even though another artifact could carry it", async () => {
  const rec = clone(await validRecord());
  rec.contents.artifacts.push({
    id: ARTIFACT_TARGETED,
    role: ARTIFACT_TARGETED,
    body: "Too short.",
    verified: false,
    supplied_at: "2026-08-02T11:59:00Z",
  });
  const span = rec.contents.detector_events[0].evidence_spans[0];
  const original = rec.contents.artifacts.find((a) => a.id === ARTIFACT_ORIGINAL);
  assert.equal(original.body.slice(span.start, span.end), span.quote, "the other artifact CAN carry it");
  span.artifact_id = ARTIFACT_TARGETED;

  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /OFFSETS_OUT_OF_RANGE/);
  assert.ok(!/artifact original_answer/.test(r.reason), "and it is not quietly re-attributed");
});

// ── E. DUPLICATE ARTIFACT IDS ─────────────────────────────────────────────────

test("E: a duplicate artifact id makes the map ambiguous and the record is rejected", async () => {
  const rec = clone(await validRecord());
  rec.contents.artifacts.push({
    id: ARTIFACT_ORIGINAL,
    role: ARTIFACT_ORIGINAL,
    body: "A second document claiming the same identity.",
    verified: false,
    supplied_at: "2026-08-02T11:59:00Z",
  });
  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /duplicate artifact id/);
});

test("E: duplicate ids are refused at the map primitive, so no consumer has to guess which one won", () => {
  assert.throws(
    () =>
      normalizeArtifactMap([
        { id: "a", role: ARTIFACT_ORIGINAL, body: "one" },
        { id: "a", role: ARTIFACT_TARGETED, body: "two" },
      ]),
    /duplicate artifact id/,
  );
  // Two artifacts claiming one ROLE is the same ambiguity from the other side.
  assert.throws(
    () =>
      artifactForRole(
        [
          { id: "a", role: ARTIFACT_ORIGINAL, body: "one" },
          { id: "b", role: ARTIFACT_ORIGINAL, body: "two" },
        ],
        ARTIFACT_ORIGINAL,
      ),
    /carried by more than one artifact/,
  );
});

// ── F. OPEN/TARGETED SWAP ─────────────────────────────────────────────────────

const PAIRED_OPEN =
  "A landlord must return a security deposit within 30 days of the tenant moving out. " +
  "Most tenants get the full amount back without any trouble.";
const PAIRED_TARGETED =
  "The deadline depends on the state and runs from 14 days to 60 days. " +
  "Several states also require the landlord to pay the tenant a penalty when the deadline is missed.";

function pairedMeasurement() {
  const pm = parsePairedMeasurement({
    differences: [
      {
        signal_pattern: "Omission",
        interpretation: "The open answer gives one national figure; the targeted answer names state variation.",
        snippets: [
          {
            artifact_role: ARTIFACT_TARGETED,
            status: "PRESENT",
            verbatim_snippet: "The deadline depends on the state",
          },
          {
            artifact_role: ARTIFACT_ORIGINAL,
            status: "PRESENT",
            verbatim_snippet: "A landlord must return a security deposit within 30 days",
          },
        ],
      },
    ],
    gap_estimate: 1,
    estimate_rationale: "r",
  });
  assert.ok(pm, "the paired fixture must parse");
  return pm;
}

test("F: with the correct binding, both sides quote and each anchor names its own document", () => {
  const canonical = buildCanonicalPaired(pairedMeasurement(), {
    open: PAIRED_OPEN,
    targeted: PAIRED_TARGETED,
  });
  const anchors = canonical.findings[0].anchors;
  const byRole = Object.fromEntries(anchors.map((a) => [a.role, a]));
  for (const [role, body] of [
    [ARTIFACT_ORIGINAL, PAIRED_OPEN],
    [ARTIFACT_TARGETED, PAIRED_TARGETED],
  ]) {
    const anchor = byRole[role];
    assert.equal(anchor.status, ANCHOR_STATUS.QUOTED, `${role} should quote`);
    assert.equal(anchor.span.artifact_id, role);
    assert.equal(body.slice(anchor.span.start, anchor.span.end), anchor.quote);
  }
});

test("F: swapping the two bodies while keeping anchor identities produces no quoted anchor", () => {
  // The snippets are unchanged and each is still verbatim in SOME document. Only the
  // role-to-body binding moved. Pre-patch this was a positional argument pair and the
  // swap was invisible: both anchors would still have been stamped QUOTED, and the
  // record would have hashed and exported as a valid work product.
  const swapped = buildCanonicalPaired(pairedMeasurement(), {
    open: PAIRED_TARGETED,
    targeted: PAIRED_OPEN,
  });
  for (const anchor of swapped.findings[0].anchors) {
    assert.notEqual(anchor.status, ANCHOR_STATUS.QUOTED, `${anchor.role} must not quote across the swap`);
    assert.equal(anchor.span, null);
  }
});

test("F: a Review Record whose artifact bodies were swapped after the fact is rejected", async () => {
  const rec = clone(await validRecord());
  rec.contents.artifacts.push({
    id: ARTIFACT_TARGETED,
    role: ARTIFACT_TARGETED,
    body: "A second answer of comparable length that shares no sentence with the first one.",
    verified: false,
    supplied_at: "2026-08-02T11:59:00Z",
  });
  const a = rec.contents.artifacts.find((x) => x.id === ARTIFACT_ORIGINAL);
  const b = rec.contents.artifacts.find((x) => x.id === ARTIFACT_TARGETED);
  [a.body, b.body] = [b.body, a.body];

  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not resolve against artifact original_answer/);
});

test("F: two roles carrying one byte-identical body is refused at construction — that is one document", () => {
  assert.throws(
    () =>
      buildFinding({
        index: 0,
        shape: "paired_observed_difference",
        class_label: "omission",
        statement: "The open answer stops before the exception.",
        snippets: {
          [ARTIFACT_ORIGINAL]: { verbatim_snippet: DEP, disambiguating_context: "" },
          [ARTIFACT_TARGETED]: { verbatim_snippet: PROP, disambiguating_context: "" },
        },
        artifacts: { [ARTIFACT_ORIGINAL]: ARTIFACT_A, [ARTIFACT_TARGETED]: ARTIFACT_A },
        comparison_direction: "PROBE_ONLY",
        conditions_status: "UNAVAILABLE",
      }),
    /byte-identical bodies/,
  );
  // Two ABSENT sides are not a claim about provenance, so empty bodies stay exempt.
  assert.doesNotThrow(() => assertDistinctArtifactBodies({ [ARTIFACT_ORIGINAL]: "", [ARTIFACT_TARGETED]: "" }));
});

// ── G. THE AUDIT'S ADVERSARIAL FIXTURE, ALL LAYERS ────────────────────────────
//
// Before the patch this fixture was accepted by 5 of 5 layers. The point of
// reproducing it whole is that the layers were independently broken: fixing the
// resolver alone left construction and export still accepting it.

test("G: the audit's headline Review Record fixture is rejected", () => {
  const rec = {
    id: "rr_adversarial",
    inspection_ids: ["adversarial"],
    created_at: "2026-08-02T00:00:00.000Z",
    contents: {
      artifacts: [
        {
          id: ARTIFACT_ORIGINAL,
          role: ARTIFACT_ORIGINAL,
          body: ARTIFACT_A,
          verified: false,
          supplied_at: "2026-08-02T00:00:00.000Z",
        },
        {
          id: ARTIFACT_TARGETED,
          role: ARTIFACT_TARGETED,
          body: "Something else entirely.",
          verified: false,
          supplied_at: "2026-08-02T00:00:00.000Z",
        },
      ],
      pair_runs: [],
      detector_events: [
        {
          id: "de_omission_0_57",
          family: "comparative",
          detector_id: "vg.omission",
          detector_version: "1.0",
          evidence_spans: [
            { artifact_id: ARTIFACT_TARGETED, start: 0, end: PROP.length, quote: PROP },
          ],
        },
      ],
      checks: [
        {
          id: "chk_omission_0_57",
          detector_event_id: "de_omission_0_57",
          subclass: "finding_derived",
          proposition_at_issue: {
            text: PROP,
            spans: [{ artifact_id: ARTIFACT_TARGETED, start: 0, end: PROP.length, quote: PROP }],
          },
          dependent_output: {
            text: DEP,
            spans: [
              {
                artifact_id: ARTIFACT_TARGETED,
                start: SHARED_PREFIX.length - DEP.length,
                end: SHARED_PREFIX.length,
                quote: DEP,
              },
            ],
          },
          demonstration: {
            finding_type: "omission",
            proposition_span_refs: [0],
            dependent_output_span_refs: [0],
            dependency_statement: "x",
          },
          verification_action: { question: "q", resolver: "authority" },
          ranking: {
            demonstrability: "comparative",
            propagation: "final_conclusion",
            independent_conflict_count: 0,
          },
          status: "open",
        },
      ],
      canonical_result: null,
      resolution_evidence: [],
      inspector: { model: "m", model_version: "m", prompt_version: "p" },
      versions: {
        // Bound to the constant, not to a literal. This fixture must be rejected for
        // its ANCHOR defect; pinning a schema string means a later version bump makes
        // it fail the version check first and the anchor assertion below stops being
        // exercised — a rejection for the wrong reason, which this file calls a false
        // pass. The other three are unchanged by that bump and stay literal.
        schema: REVIEW_GRAPH_SCHEMA_VERSION,
        canonicalization: "review-record.c14n.v1",
        record: "review-record.v2",
        check_model: "check-register.v1",
      },
      timestamps: {
        created_at: "2026-08-02T00:00:00.000Z",
        inspection_run_at: "2026-08-02T00:00:00.000Z",
      },
      method_note: "note",
    },
    integrity: { algorithm: "sha256", canonicalization: "review-record.c14n.v1", digest: "a".repeat(64) },
  };
  // The quote IS verbatim in the record's other artifact at these exact offsets.
  assert.equal(ARTIFACT_A.slice(0, PROP.length), PROP);

  const r = validateReviewRecord(rec);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not resolve against artifact targeted_answer/);
  assert.match(r.reason, /OFFSETS_OUT_OF_RANGE|QUOTE_MISMATCH/);
});

// ── H. THE COMMITTED CORPUS ───────────────────────────────────────────────────
//
// NON-REGRESSION EVIDENCE, NOT CORRECTNESS EVIDENCE. The audit established that all
// 26 paired snapshots are one hand-authored pair rendered 26 ways, whose two sides
// share no sentence of 25 characters or more. That corpus is structurally incapable
// of exhibiting the defect this file repairs: a clean sweep here proves the patch
// broke nothing and proves nothing about whether it works. Correctness rests on
// A through G above and on the mutation set.
//
// The collector reads BOTH anchor shapes. A first pass of the audit read only
// Shape A, reported 384 spans, silently skipped the entire paired surface, and
// would have declared a confident false all-clear.

const SNAPSHOT_DIR = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");

function payloadOf(file) {
  const text = fs.readFileSync(file, "utf8");
  const start = text.indexOf("\n## payload\n");
  const end = text.indexOf("\n## render\n");
  if (start < 0 || end < 0) return null;
  return JSON.parse(text.slice(start + "\n## payload\n".length, end));
}

// Every string body in the record that an anchor could name, keyed by role. The
// snapshots carry bodies at receipt.open_run.answer and receipt.targeted_answer.
function artifactsOf(payload) {
  const bodies = {};
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (node.open_run && typeof node.open_run.answer === "string") {
      bodies[ARTIFACT_ORIGINAL] = node.open_run.answer;
    }
    if (typeof node.targeted_answer === "string") bodies[ARTIFACT_TARGETED] = node.targeted_answer;
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(payload);
  return bodies;
}

// Shape A — Check Register span: the quote rides on the span.
// Shape B — canonical anchor: {role, status, quote, span}; the quote rides on the parent.
function anchorsOf(payload) {
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (typeof node.artifact_id === "string" && Number.isInteger(node.start) && typeof node.quote === "string") {
      found.push({ shape: "A", span: node, quote: node.quote, role: null });
    }
    if (typeof node.role === "string" && typeof node.quote === "string" && node.span && node.span.artifact_id) {
      found.push({ shape: "B", span: node.span, quote: node.quote, role: node.role });
    }
    for (const k of Object.keys(node)) walk(node[k]);
  };
  walk(payload);
  return found;
}

test("H: NON-REGRESSION — every committed anchor still resolves against the artifact it names", () => {
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((f) => f.endsWith(".snapshot.txt"))
    .sort();
  assert.ok(files.length > 0, "the committed corpus must be present");

  let records = 0;
  let anchors = 0;
  let shapeB = 0;
  const roles = new Set();
  const failures = [];

  for (const file of files) {
    const payload = payloadOf(path.join(SNAPSHOT_DIR, file));
    if (!payload) continue;
    const found = anchorsOf(payload);
    if (found.length === 0) continue;
    records += 1;

    const bodies = artifactsOf(payload);
    const map = normalizeArtifactMap(bodies);

    for (const a of found) {
      anchors += 1;
      if (a.shape === "B") shapeB += 1;
      roles.add(a.span.artifact_id);
      const r = resolveSpanAgainst(a.span, map, {
        requiredRole: a.role,
        quote: a.quote,
      });
      if (!r.ok) failures.push(`${file}: ${a.shape} ${a.span.artifact_id}[${a.span.start},${a.span.end}) ${r.reason}`);
    }
  }

  assert.deepEqual(failures, [], failures.slice(0, 10).join("\n"));
  // These two counts moved 32→34 and 680→704 when the dense acceptance record was
  // registered as a board scenario. Two more snapshots carry anchors, 12 spans each:
  // six under result.findings[].anchors[] and the same six under
  // receipt.open_run.canonical.findings[].anchors[], which is the receipt's own copy of
  // what was read rather than a second set of marks. Six and not nine because the
  // fixture's other three findings are record-level absences, and an absence carries no
  // span to resolve — that is the whole point of them. Every one of the 24 resolved on
  // the first run against the artifact it names, so what moved here is the size of the
  // corpus and not its health.
  //
  // They moved again, 34→38 and 704→952, when register-overflow, its expanded twin and
  // chip-arrival were promoted off the pending registry onto the board. Four of those
  // six new snapshots carry anchors, 62 apiece: the two overflow scenarios share one
  // assembled payload and photograph it collapsed and expanded, at two viewports. The
  // third scenario contributes nothing to either count, and that is the correct result
  // rather than a gap — chip-arrival routes through ?start=chips with no /api/read call
  // at all, so its payload holds no findings and therefore no spans. The health
  // assertion above this one is the one that guards the boundary, and all 952 resolved
  // against the artifact each of them names on the first run.
  assert.equal(records, 38, "the audit counted 38 records carrying anchors");
  assert.equal(anchors, 952, "the audit counted 952 anchors");
  assert.ok(shapeB > 0, "a collector that finds no Shape B anchor is skipping the paired surface");
  assert.deepEqual([...roles].sort(), [ARTIFACT_ORIGINAL, ARTIFACT_TARGETED]);
});
