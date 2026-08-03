// reader-review-record — the ReviewRecord export, its review-record.c14n.v1
// canonicalization, and the integrity digest (Reader v3 RR lane, site repo).
//
// Gates pinned here, tied to docs/REVIEW-GRAPH-SCHEMA.md v0.3.3:
//   - AT-14 in full: identical logical records → identical digests; same-instant
//     timestamps collapse (offset + fractional-zero + sub-ms truncation); a
//     changed instant changes the digest; any canonical-body mutation changes it;
//     changes confined to the excluded integrity block do not.
//   - review-record.c14n.v1 vectors: recursive lexicographic key ordering, array
//     order preserved, timestamp-only normalization, verbatim non-timestamp
//     strings (including a date-shaped string in a non-timestamp field and CRLF
//     inside Artifact.body), structural-whitespace-only, integrity exclusion.
//   - node/browser digest parity: node:crypto over the same canonical string
//     agrees byte-for-byte with the module's WebCrypto path.
//   - AT-5 vocab lint over every user-facing string THIS lane adds (METHOD_NOTE,
//     REVIEW_RECORD_UI, the generated support line) — pointer register only.
//   - The export support line against the record it describes: every clause names a
//     field the assembler wrote for THAT run, the capture block is named only when a
//     pair rides along and only as reported conditions, and a counted finding is
//     stated as unreviewed instead of carrying a verification status.
//   - Additivity: building a record perturbs neither its inputs nor an existing
//     reader-receipt content_hash minted from the same open run.
//   - No new server-side write path: no api/** file assembles or persists the
//     record, and the module itself pulls in no node builtin and no network/write.
//   - Record validation against the schema v0.3.3 shapes (positive + rejections),
//     including PairRun run provenance (initiator, targeted_prompt_hash, chip fields).
//
// Content-blind: synthetic answer + synthetic findings only. Run:
//   node --test test/reader-review-record.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  REVIEW_GRAPH_SCHEMA_VERSION,
  REVIEW_RECORD_C14N_VERSION,
  REVIEW_RECORD_VERSION,
  REVIEW_RECORD_HASH_ALGORITHM,
  METHOD_NOTE,
  REVIEW_RECORD_UI,
  describeReviewRecordContents,
  canonicalTimestamp,
  serializeCanonical,
  sha256Hex,
  digestReviewRecord,
  assembleReviewRecord,
  buildReviewRecord,
  reviewRecordFilename,
  validateReviewRecord,
} from "../reader-review-record.js";
import { buildCheckRegister } from "../reader-checks.js";
import {
  ARTIFACT_ORIGINAL,
  DISPOSITION,
  SHAPE_SINGLE_CANDIDATE,
  buildCanonicalResult,
  buildFinding,
  classifyRegisterOutcome,
} from "../reader-result.js";
import { lintUserFacingStrings } from "../reader-check-vocab.js";
import {
  buildSingleReceipt,
  canonicalizeForHash,
} from "../reader-receipt.js";
import {
  buildPairCapture,
  pairConditionsUnmatched,
  PAIR_SAME_MODEL,
  PAIR_EDITS,
  PAIR_CONDITIONS_UNVERIFIED,
  PAIR_INITIATOR,
  PAIRED_METHOD_VERSION,
} from "../reader-paired.js";

// ── Synthetic fixtures (content-blind) ───────────────────────────────────────────

// A pasted answer with two exactly-quotable spans (the both-ends rule) and, on
// purpose, a date-shaped string inside its prose so the verbatim rule is testable.
const ANSWER =
  "The report recommends approval as of 2026-07-17T08:00:00-04:00. " +
  "The recommendation rests on a projected figure of 4.2 million in the first year.";

const FINDING = {
  type: "omission",
  check: {
    supporting_proposition: "a projected figure of 4.2 million in the first year",
    dependent_output: "The report recommends approval",
    dependency_statement: "The recommendation rests on the projected figure.",
    verification_question: "What source gives the projected figure this recommendation depends on?",
    resolver: "authority",
    propagation: "recommendation_or_action",
  },
};

// A deflection finding over the same two exactly-quotable spans as FINDING. The only
// difference from FINDING is type: "deflection" — so it drives the renamed comparative
// family end-to-end (detector_id vg.deflection, finding_type deflection) for the pinned
// canonical vector below.
const DEFLECTION_FINDING = {
  type: "deflection",
  check: {
    supporting_proposition: "a projected figure of 4.2 million in the first year",
    dependent_output: "The report recommends approval",
    dependency_statement: "The recommendation rests on the projected figure.",
    verification_question: "What source gives the projected figure this recommendation depends on?",
    resolver: "authority",
    propagation: "recommendation_or_action",
  },
};

const INSPECTOR = { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: "reader.v3" };

// Assemble a Reader read-response `result` (register + receipt.open_run) the way
// api/read.js shapes it, over the synthetic answer/finding above.
function buildResult({
  answer = ANSWER,
  findings = [FINDING],
  runAt = "2026-07-17T11:59:00Z",
  requestId = "req_abc123",
  declaredModel = "GPT-5",
} = {}) {
  const register = buildCheckRegister({
    artifactId: "original_answer",
    artifactText: answer,
    findings,
    inspector: INSPECTOR,
  });
  return {
    register,
    result: {
      checks: register,
      receipt: {
        open_run: {
          answer,
          declared_model: declaredModel,
          provenance: {
            request_id: requestId,
            run_timestamp: runAt,
            reader_model_version: "claude-opus-4-8",
            inspector_prompt_version: "reader.v3",
          },
        },
      },
    },
  };
}

const CREATED = "2026-07-17T12:00:00Z";

// A deep clone whose object keys are emitted in REVERSE order at every level —
// used to prove canonicalization is insertion-order-independent (keys sorted).
function reverseKeys(v) {
  if (Array.isArray(v)) return v.map(reverseKeys);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).reverse()) out[k] = reverseKeys(v[k]);
    return out;
  }
  return v;
}

// ── The register fixture actually emits a check ──────────────────────────────────

test("fixture sanity: the synthetic finding yields exactly one comparative check", () => {
  const { register } = buildResult();
  assert.equal(register.checks.length, 1, "expected one emitted check from the fixture");
  assert.equal(register.detector_events.length, 1);
  assert.equal(register.checks[0].detector_event_id, register.detector_events[0].id);
});

// ── review-record.c14n.v1: canonical timestamp form (AT-14 pinned vectors) ────────

test("c14n: same instant collapses across offset / fractional-zero / Z forms", () => {
  const z = canonicalTimestamp("2026-07-17T12:00:00Z");
  const offset = canonicalTimestamp("2026-07-17T08:00:00-04:00");
  const frac = canonicalTimestamp("2026-07-17T12:00:00.000Z");
  assert.equal(z, "2026-07-17T12:00:00.000Z");
  assert.equal(offset, z);
  assert.equal(frac, z);
});

test("c14n: sub-millisecond precision is truncated (not rounded), cross-engine deterministic", () => {
  assert.equal(canonicalTimestamp("2026-07-17T12:00:00.1239999Z"), "2026-07-17T12:00:00.123Z");
  assert.equal(canonicalTimestamp("2026-07-17T12:00:00.999999Z"), "2026-07-17T12:00:00.999Z");
});

test("c14n: an empty timestamp passes through; a non-empty unparseable timestamp throws", () => {
  assert.equal(canonicalTimestamp(""), "");
  assert.throws(() => canonicalTimestamp("not-a-date"), /unparseable timestamp/);
});

// ── review-record.c14n.v1: serializer vectors ────────────────────────────────────

test("c14n: object keys are ordered recursively lexicographic; array order is preserved", () => {
  const out = serializeCanonical({
    b: 2,
    a: 1,
    nested: { z: [3, 1, 2], m: { y: 1, x: 2 } },
  });
  assert.equal(out, '{"a":1,"b":2,"nested":{"m":{"x":2,"y":1},"z":[3,1,2]}}');
});

test("c14n: only timestamp-keyed strings normalize; a date-shaped value elsewhere stays verbatim", () => {
  const out = serializeCanonical({
    created_at: "2026-07-17T08:00:00-04:00", // timestamp key → normalized to Z
    label: "2026-07-17T08:00:00-04:00", // ordinary string → verbatim
  });
  assert.equal(
    out,
    '{"created_at":"2026-07-17T12:00:00.000Z","label":"2026-07-17T08:00:00-04:00"}',
  );
});

test("c14n: string values hash verbatim — internal whitespace and CRLF preserved (span offsets depend on it)", () => {
  const out = serializeCanonical({ body: "line1\r\n  line2 \tkept", note: "  leading and trailing  " });
  // JSON escapes but does not normalize: \r\n and the padding survive exactly.
  assert.ok(out.includes("line1\\r\\n  line2 \\tkept"), out);
  assert.ok(out.includes('"  leading and trailing  "'), out);
});

test("c14n: structural whitespace only — no spaces/newlines between tokens", () => {
  const out = serializeCanonical({ a: 1, b: { c: 2 } });
  assert.ok(!/[\n\t]/.test(out), "no structural newlines/tabs");
  assert.ok(!/, /.test(out) && !/: /.test(out), "no insignificant spaces after separators");
});

test("c14n: the integrity block is excluded from the hashed body", () => {
  const withIntegrity = serializeCanonical({ a: 1, integrity: { digest: "X", algorithm: "sha256" } });
  const without = serializeCanonical({ a: 1 });
  assert.equal(withIntegrity, without);
  assert.equal(withIntegrity, '{"a":1}');
});

// ── AT-14: the integrity digest over whole records ───────────────────────────────

test("AT-14: identical logical records produce identical digests", async () => {
  const a = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const b = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  assert.equal(a.integrity.digest, b.integrity.digest);
  assert.match(a.integrity.digest, /^[0-9a-f]{64}$/);
});

test("AT-14: timestamps for the same instant produce identical digests (offset + fractional-zero)", async () => {
  const base = buildResult().result;
  const gZ = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: "2026-07-17T12:00:00Z" }));
  const gOff = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: "2026-07-17T08:00:00-04:00" }));
  const gFrac = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: "2026-07-17T12:00:00.000Z" }));
  assert.equal(gOff, gZ);
  assert.equal(gFrac, gZ);
});

test("AT-14: changing the represented instant changes the digest", async () => {
  const base = buildResult().result;
  const g0 = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: "2026-07-17T12:00:00Z" }));
  const g1 = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: "2026-07-17T12:00:01Z" }));
  assert.notEqual(g0, g1);
});

test("AT-14: any canonical-body mutation changes the digest (status, artifact body, span, provenance, version)", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const base = record.integrity.digest;

  const mutate = async (fn) => {
    const r = JSON.parse(JSON.stringify(record));
    fn(r);
    return digestReviewRecord(r);
  };

  assert.notEqual(await mutate((r) => (r.contents.checks[0].status = "resolved")), base, "status");
  assert.notEqual(await mutate((r) => (r.contents.artifacts[0].body += "!")), base, "artifact body");
  assert.notEqual(await mutate((r) => (r.contents.detector_events[0].evidence_spans[0].start += 1)), base, "span");
  assert.notEqual(await mutate((r) => (r.contents.inspector.model = "other-model")), base, "provenance");
  assert.notEqual(await mutate((r) => (r.contents.versions.record = "review-record.v9")), base, "version");
});

test("AT-14: changes confined to the excluded integrity block do not alter the recomputed digest", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const before = await digestReviewRecord(record);
  record.integrity.digest = "0".repeat(64);
  record.integrity.note = "presentation only";
  const after = await digestReviewRecord(record);
  assert.equal(after, before);
});

test("AT-14: presentation-only key reordering outside the canonical form does not change the digest", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const shuffled = reverseKeys(record);
  assert.equal(await digestReviewRecord(shuffled), await digestReviewRecord(record));
});

// ── node/browser digest parity ───────────────────────────────────────────────────

test("digest parity: node:crypto over the canonical string agrees with the module's WebCrypto digest", async () => {
  const record = assembleReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const canonical = serializeCanonical(record);
  const web = await sha256Hex(canonical);
  const node = createHash("sha256").update(canonical, "utf8").digest("hex");
  assert.equal(web, node);
  assert.equal(await digestReviewRecord(record), node);
});

// ── Pinned canonical vectors (schema v0.3.3) ─────────────────────────────────────
// Two frozen records — a single-mode omission and one carrying a deflection finding —
// over buildResult's fixed ids/timestamps + CREATED. Their canonical UTF-8 byte length
// and 64-hex integrity digest are pinned as INTENTIONAL LITERALS so the suite itself
// catches cross-version canonical drift from now on: a detector-id rename, a c14n rule
// change, or an accidental field reshuffle all move these values. A legitimate future
// schema version updates them DELIBERATELY, never casually. Both are single-mode (no
// pair_runs), so v0.3.1's PairRun additions leave their bytes unchanged; only the
// versions.schema string (…v0.3.0 → …v0.3.1) moves, so the byte length holds and the
// digest turns over deliberately. Each asserts versions.schema is v0.3.3 first.
//
// Turned over DELIBERATELY at record version v2, which adds contents.canonical_result.
// Both fixtures supply no canonical result, so the added key serializes as
// "canonical_result":null — exactly 24 bytes at every fixture (2575→2599, 2585→2609),
// and versions.record moves v1→v2 at equal length. Verified by rebuilding the v1
// body from the v2 canonical string: dropping the one key and restoring the version
// string reproduces both v1 digests byte-for-byte, so review-record.c14n.v1 itself is
// unchanged. The pin's job — catching drift nobody intended — is intact.
//
// Turned over DELIBERATELY at schema v0.3.2, which added PairRun.declaration — the
// run-conditions artifact the user reported. Both fixtures are single-mode and serialize
// pair_runs as [], so the added field reached neither of them: the byte lengths HELD at
// 2599 / 2609 and the versions.schema string (…v0.3.1 → …v0.3.2) was the only thing that
// moved, at equal length.
//
// Turned over DELIBERATELY again at schema v0.3.3, which replaces the singular
// PairRun.declaration with PairRun.declarations, an ordered array — a pair collects
// declarations at submission, at inspection, at review and on a later visit, and a
// correction is a separate fact rather than a better version of the first one. The two
// single-mode fixtures still serialize pair_runs as [], so again the shape change reaches
// neither: the byte lengths HOLD at 2599 / 2609 and the version string (…v0.3.2 →
// …v0.3.3) is the only thing that moves, at equal length. Proved rather than asserted by
// the turnover test below, which substitutes v0.3.2 back and must reproduce both v0.3.2
// digests byte-for-byte.
//
// The paired fixture is pinned separately, immediately below, because that is where the
// declarations array actually lands and where a silent reshape would otherwise pass.
const PINNED_V033 = {
  single_omission: {
    bytes: 2599,
    digest: "f3c7001664bfbadcf938826b936265da96ca5ca53e25935d3cbf7ab6fa43cd0d",
  },
  deflection_finding: {
    bytes: 2609,
    digest: "7971b03b410046d803963b838fe7f4390dec7a56565cfdfe1a44381741d625c0",
  },
};

const byteLen = (s) => new TextEncoder().encode(s).length;

test("pinned vector: a frozen single-mode omission record matches its pinned v0.3.3 digest and byte length", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  assert.equal(record.contents.versions.schema, "review-graph.v0.3.3", "the pin is anchored to schema v0.3.3");
  assert.equal(record.contents.detector_events[0].detector_id, "vg.omission");
  const canonical = serializeCanonical(record);
  assert.equal(byteLen(canonical), PINNED_V033.single_omission.bytes, "canonical byte length drifted from the pin");
  assert.equal(record.integrity.digest, PINNED_V033.single_omission.digest, "digest drifted from the pin");
});

test("pinned vector: a frozen deflection-finding record matches its pinned v0.3.3 digest and byte length", async () => {
  const record = await buildReviewRecord({ result: buildResult({ findings: [DEFLECTION_FINDING] }).result, createdAt: CREATED });
  assert.equal(record.contents.versions.schema, "review-graph.v0.3.3", "the pin is anchored to schema v0.3.3");
  // The renamed family renders end-to-end: vg.deflection detector, deflection finding_type.
  assert.equal(record.contents.detector_events[0].detector_id, "vg.deflection");
  assert.equal(record.contents.checks[0].demonstration.finding_type, "deflection");
  const canonical = serializeCanonical(record);
  assert.equal(byteLen(canonical), PINNED_V033.deflection_finding.bytes, "canonical byte length drifted from the pin");
  assert.equal(record.integrity.digest, PINNED_V033.deflection_finding.digest, "digest drifted from the pin");
});

// The paired vector, pinned for the first time at v0.3.3. Every single-mode pin above is
// blind to PairRun by construction, so before this the one shape the declaration work
// actually changes had no pin on it at all: a reshaped declarations array, a reordered
// key, or a declaration field silently dropped from the canonical body would all have
// gone through green. No prior digest exists to turn over from, so there is nothing to
// prove about a turnover here — the discipline this pin starts is the next one's problem.
const PINNED_V033_PAIRED = {
  bytes: 3411,
  digest: "50413c3eef02a012a725c99035b5c8a7bab474ec4eba038ac0a60892819c1958",
};

test("pinned vector: a frozen paired record matches its pinned v0.3.3 digest and byte length", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED, pair: buildPair() });
  assert.equal(record.contents.versions.schema, "review-graph.v0.3.3", "the pin is anchored to schema v0.3.3");
  assert.equal(record.contents.pair_runs.length, 1, "this vector exists to cover the paired shape");
  const canonical = serializeCanonical(record);
  // The declarations array is inside the hashed body, not alongside it. A packet whose
  // declaration history could change without moving the digest would be a packet whose
  // provenance nobody could check.
  assert.ok(canonical.includes('"declarations":'), "declarations ride inside the canonical body");
  assert.ok(!canonical.includes('"declaration":'), "the singular v0.3.2 key is gone, not shadowed");
  assert.equal(byteLen(canonical), PINNED_V033_PAIRED.bytes, "canonical byte length drifted from the pin");
  assert.equal(record.integrity.digest, PINNED_V033_PAIRED.digest, "digest drifted from the pin");
});

// The v0.3.2→v0.3.3 turnover above claims the two single-mode digests moved for one
// reason only: an equal-length version string. This re-derives that claim in the suite
// instead of trusting the comment — substituting the old version back into the canonical
// body must reproduce the v0.3.2 digests exactly. If a future change moves anything else,
// the reconstruction stops matching and this fails alongside the pins.
test("pin turnover v0.3.2→v0.3.3 is confined to the version string in both single-mode vectors", async () => {
  const V032 = {
    single_omission: "a2dbbf3d20da032419e18d94477863f25f53a07fb4c1eb4df9f5e971ae103a34",
    deflection_finding: "9b62757dd093311d4f7b06d139581028a67a7b7cf2985cd702a9bff6734d2cef",
  };
  for (const [name, findings] of [["single_omission", [FINDING]], ["deflection_finding", [DEFLECTION_FINDING]]]) {
    const record = await buildReviewRecord({ result: buildResult({ findings }).result, createdAt: CREATED });
    const canonical = serializeCanonical(record);
    assert.equal(canonical.split("review-graph.v0.3.3").length - 1, 1, `${name}: version string is not unique in the canonical body`);
    const rebuilt = canonical.replaceAll("review-graph.v0.3.3", "review-graph.v0.3.2");
    assert.equal(byteLen(rebuilt), byteLen(canonical), `${name}: the substitution changed the byte length`);
    assert.equal(createHash("sha256").update(rebuilt, "utf8").digest("hex"), V032[name], `${name}: more than the version string moved`);
  }
});

test("schema v0.3.3: newly assembled single-mode and paired-mode records both emit versions.schema 0.3.3", () => {
  assert.equal(REVIEW_GRAPH_SCHEMA_VERSION, "review-graph.v0.3.3");
  const base = buildResult().result;
  const single = assembleReviewRecord({ result: base, createdAt: CREATED });
  const paired = assembleReviewRecord({ result: base, createdAt: CREATED, pair: buildPair() });
  assert.equal(single.contents.versions.schema, "review-graph.v0.3.3");
  assert.equal(paired.contents.versions.schema, "review-graph.v0.3.3");
  // The paired-mode marker is the populated pair_runs array (schema §1 v0.3.0 note);
  // single mode serializes pair_runs as [].
  assert.deepEqual(single.contents.pair_runs, []);
  assert.equal(paired.contents.pair_runs.length, 1);
});

// ── AT-5 vocab lint over the strings THIS lane adds ──────────────────────────────

test("AT-5: METHOD_NOTE contains no banned construction (pointer register only)", () => {
  assert.deepEqual(lintUserFacingStrings(METHOD_NOTE), []);
});

test("AT-5: REVIEW_RECORD_UI contains no banned construction", () => {
  assert.deepEqual(lintUserFacingStrings(REVIEW_RECORD_UI), []);
});

test("the method note states unkeyed SHA-256 fixity and never claims a signature", () => {
  assert.match(METHOD_NOTE, /unkeyed SHA-256/);
  assert.match(METHOD_NOTE, /fixity check/);
  assert.doesNotMatch(METHOD_NOTE, /\bis a signature\b/i);
  assert.doesNotMatch(METHOD_NOTE, /\bdigital signature\b/i);
});

// ── Record assembly + schema-shape validation ────────────────────────────────────

test("assembly: a built record validates against the schema v0.3.3 shapes", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const v = validateReviewRecord(record);
  assert.ok(v.ok, v.reason);
  assert.equal(record.contents.versions.schema, REVIEW_GRAPH_SCHEMA_VERSION);
  assert.equal(record.contents.versions.canonicalization, REVIEW_RECORD_C14N_VERSION);
  assert.equal(record.contents.versions.record, REVIEW_RECORD_VERSION);
  assert.equal(record.integrity.algorithm, REVIEW_RECORD_HASH_ALGORITHM);
});

test("assembly: pair_runs and resolution_evidence are present-but-empty arrays (later lanes slot in)", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  assert.deepEqual(record.contents.pair_runs, []);
  assert.deepEqual(record.contents.resolution_evidence, []);
});

test("assembly: the artifact is the pasted answer, verbatim, unverified, role original_answer", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  const a = record.contents.artifacts[0];
  assert.equal(a.role, "original_answer");
  assert.equal(a.body, ANSWER); // byte-identical to what was pasted
  assert.equal(a.verified, false);
});

test("assembly: inspector provenance rides through (model + prompt_version)", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  assert.equal(record.contents.inspector.model, "claude-opus-4-8");
  assert.equal(record.contents.inspector.prompt_version, "reader.v3");
});

test("assembly: client-held check status overrides the register status; a missing/invalid override falls back", async () => {
  const { register, result } = buildResult();
  const id = register.checks[0].id;
  const resolved = await buildReviewRecord({ result, checkStates: { [id]: "resolved" }, createdAt: CREATED });
  assert.equal(resolved.contents.checks[0].status, "resolved");

  const bogus = await buildReviewRecord({ result, checkStates: { [id]: "not-a-status" }, createdAt: CREATED });
  assert.equal(bogus.contents.checks[0].status, "open", "invalid override falls back to the register status");

  const none = await buildReviewRecord({ result, createdAt: CREATED });
  assert.equal(none.contents.checks[0].status, "open");
});

test("assembly: a different client status yields a different digest (status is inside the canonical body)", async () => {
  const { register, result } = buildResult();
  const id = register.checks[0].id;
  const open = await buildReviewRecord({ result, createdAt: CREATED });
  const dismissed = await buildReviewRecord({ result, checkStates: { [id]: "dismissed" }, createdAt: CREATED });
  assert.notEqual(open.integrity.digest, dismissed.integrity.digest);
});

test("assembly: createdAt is required", () => {
  assert.throws(() => assembleReviewRecord({ result: buildResult().result }), /createdAt/);
});

test("filename: imbas-review-record-<UTC date>-<first 8 of digest>.json", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: "2026-07-17T08:00:00-04:00" });
  const name = reviewRecordFilename(record);
  // The offset createdAt is a UTC afternoon instant → 2026-07-17 in UTC.
  assert.equal(name, `imbas-review-record-2026-07-17-${record.integrity.digest.slice(0, 8)}.json`);
  assert.match(name, /^imbas-review-record-\d{4}-\d{2}-\d{2}-[0-9a-f]{8}\.json$/);
});

test("validation: rejects a record missing its resolving detector_event (AT-1)", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  record.contents.detector_events = []; // orphan the check
  const v = validateReviewRecord(record);
  assert.equal(v.ok, false);
  assert.match(v.reason, /AT-1/);
});

test("validation: rejects a bad check status, a verified artifact, and a malformed digest", async () => {
  const base = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });

  const badStatus = JSON.parse(JSON.stringify(base));
  badStatus.contents.checks[0].status = "approved";
  assert.equal(validateReviewRecord(badStatus).ok, false);

  const verified = JSON.parse(JSON.stringify(base));
  verified.contents.artifacts[0].verified = true;
  assert.match(validateReviewRecord(verified).reason, /verified must be false/);

  const badDigest = JSON.parse(JSON.stringify(base));
  badDigest.integrity.digest = "XYZ";
  assert.match(validateReviewRecord(badDigest).reason, /digest must be/);
});

test("validation: rejects a wrong schema version", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  record.contents.versions.schema = "review-graph.v0.2.2";
  assert.match(validateReviewRecord(record).reason, /versions\.schema must be/);
});

// ── Additivity: no existing receipt hash is perturbed ────────────────────────────

test("additivity: building a record does not mutate its inputs", async () => {
  const { result } = buildResult();
  const before = JSON.stringify(result);
  await buildReviewRecord({ result, checkStates: { x: "resolved" }, createdAt: CREATED });
  assert.equal(JSON.stringify(result), before, "the source inspection result was left untouched");
});

test("additivity: a reader-receipt content_hash minted from the same open run is unchanged after building the record", async () => {
  const { result } = buildResult();
  const openRun = result.receipt.open_run;

  // Mint a reader-receipt content_hash the way api/read.js does, over the shared open run.
  const envelope = buildSingleReceipt({
    generatedAt: CREATED,
    question: "Q",
    topic: "T",
    declaredModel: openRun.declared_model,
    answer: openRun.answer,
    provenance: openRun.provenance,
  });
  const receiptHashBefore = createHash("sha256").update(JSON.stringify(canonicalizeForHash(envelope)), "utf8").digest("hex");

  const record = await buildReviewRecord({ result, createdAt: CREATED });

  const receiptHashAfter = createHash("sha256").update(JSON.stringify(canonicalizeForHash(envelope)), "utf8").digest("hex");
  assert.equal(receiptHashAfter, receiptHashBefore, "the receipt content_hash must not shift when a record is built");
  // The record digest is its own artifact under a distinct canonicalization contract.
  assert.notEqual(record.integrity.digest, receiptHashBefore);
});

// ── Run-the-pair v1: a populated pair_runs record ────────────────────────────────
// A paired inspection exports with the SECOND answer as a targeted_answer Artifact,
// one schema PairRun linking the two answers, and the conservative capture block
// (AT-12). Single-mode stays byte-identical (additivity). Content-blind: the second
// answer is synthetic, with a CRLF and a date-shaped string so the verbatim rule is
// exercised on the targeted artifact exactly as on the original.
const TARGETED_ANSWER =
  "Asked directly, it adds: a filing deadline of 2026-08-01 applies,\r\n" +
  "and the projected 4.2 million figure traces to the Q2 forecast memo.";

// The fixed non-leading probe the Reader constructs (paired_method_version 1.1); a
// literal here so the test pins the recorded prompt without importing Act-2 internals.
const TARGETED_PROMPT =
  "Are there any required notices, deadlines, safeguards, exceptions, or other material points relevant to this situation? Name the governing source for each.";

// The 64-hex sha256 the paired receipt carries over the verbatim probe (schema
// v0.3.1). The exporter threads it onto the PairRun; it is never recomputed there.
const TARGETED_PROMPT_HASH = createHash("sha256").update(TARGETED_PROMPT, "utf8").digest("hex");

// A `pair` input shaped the way the Workbench paste-back step will hand it to the
// exporter: the second answer verbatim, the capture derived from the three loose-voice
// inputs, and the paired inspector provenance (production model + paired_method_version).
// same_model / edits / model_version drive the conservative conditions_matched flag.
function buildPair({
  same_model = PAIR_SAME_MODEL.YES,
  edits = PAIR_EDITS.NONE,
  model_version,
  targetedAnswer = TARGETED_ANSWER,
} = {}) {
  return {
    targeted_answer: targetedAnswer,
    targeted_prompt: TARGETED_PROMPT,
    targeted_prompt_hash: TARGETED_PROMPT_HASH,
    targeted_source_model: {
      name: same_model === PAIR_SAME_MODEL.YES ? "claude-opus-4-8" : "",
      version: model_version || "",
    },
    capture: buildPairCapture({ same_model, edits, model_version }),
    inspector: { model: "claude-opus-4-8", model_version: "claude-opus-4-8", prompt_version: PAIRED_METHOD_VERSION },
  };
}

test("paired assembly: both answers are stored as artifacts — targeted_answer verbatim, unverified", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED, pair: buildPair() });
  assert.deepEqual(record.contents.artifacts.map((a) => a.role), ["original_answer", "targeted_answer"]);
  const targeted = record.contents.artifacts.find((a) => a.role === "targeted_answer");
  assert.equal(targeted.id, "targeted_answer");
  assert.equal(targeted.body, TARGETED_ANSWER, "second answer stored byte-for-byte as pasted (CRLF preserved)");
  assert.equal(targeted.verified, false);
  assert.equal(targeted.source_model_user_reported.name, "claude-opus-4-8");
});

test("paired assembly: one PairRun links the two artifacts and carries the capture block", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED, pair: buildPair() });
  assert.equal(record.contents.pair_runs.length, 1);
  const pr = record.contents.pair_runs[0];
  assert.equal(pr.original_artifact_id, "original_answer");
  assert.equal(pr.targeted_artifact_id, "targeted_answer");
  assert.equal(pr.targeted_prompt, TARGETED_PROMPT);
  assert.equal(pr.capture.same_model_claimed, true);
  assert.equal(pr.capture.user_edits_disclosed, false);
  assert.equal(pr.capture.conditions_matched, true);
  // v0.3.1 run provenance: the shipped path stamps inspection_followup and carries the
  // receipt's probe hash; the chip-only fields stay OMITTED on an inspection follow-up.
  assert.equal(pr.initiator, PAIR_INITIATOR.INSPECTION_FOLLOWUP);
  assert.equal(pr.initiator, "inspection_followup");
  assert.equal(pr.targeted_prompt_hash, TARGETED_PROMPT_HASH);
  assert.match(pr.targeted_prompt_hash, /^[0-9a-f]{64}$/);
  assert.ok(!("chip_id" in pr), "chip_id is omitted (never null) unless a user chip initiated the pair");
  assert.ok(!("instruction_version" in pr), "instruction_version is omitted unless a user chip initiated the pair");
  assert.ok(validateReviewRecord(record).ok, validateReviewRecord(record).reason);
});

test("paired assembly: the paired inspector provenance overrides the single-mode triple", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED, pair: buildPair() });
  assert.equal(record.contents.inspector.model, "claude-opus-4-8");
  assert.equal(record.contents.inspector.prompt_version, PAIRED_METHOD_VERSION);
});

test("paired assembly: an optional reported model/version rides into the capture, capped, when supplied", async () => {
  const record = await buildReviewRecord({
    result: buildResult().result,
    createdAt: CREATED,
    pair: buildPair({ model_version: "  GPT-5 (2026-06)  " }),
  });
  assert.equal(record.contents.pair_runs[0].capture.model_version_user_reported, "GPT-5 (2026-06)");
});

test("AT-12: an edited-but-disclosed pair records conditions_matched=false (never true) and still validates", async () => {
  const record = await buildReviewRecord({
    result: buildResult().result,
    createdAt: CREATED,
    pair: buildPair({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED }),
  });
  const cap = record.contents.pair_runs[0].capture;
  assert.equal(cap.user_edits_disclosed, true);
  assert.equal(cap.conditions_matched, false, "a disclosed edit can never read as matched, even same-model");
  assert.equal(pairConditionsUnmatched(cap), true, "the unmatched-conditions warning fires on this exported record");
  assert.ok(validateReviewRecord(record).ok, "disclosure never gates — the record still validates");
});

test("AT-12: a 'not sure' pair records conditions_matched='unverified', warns, and validates", async () => {
  const record = await buildReviewRecord({
    result: buildResult().result,
    createdAt: CREATED,
    pair: buildPair({ same_model: PAIR_SAME_MODEL.NOT_SURE, edits: PAIR_EDITS.NONE }),
  });
  const cap = record.contents.pair_runs[0].capture;
  assert.equal(cap.conditions_matched, PAIR_CONDITIONS_UNVERIFIED);
  assert.equal(pairConditionsUnmatched(cap), true);
  assert.ok(validateReviewRecord(record).ok);
});

test("AT-14: a populated pair_runs record is digest-deterministic and collapses a same-instant timestamp", async () => {
  const base = buildResult().result;
  const a = await buildReviewRecord({ result: base, createdAt: "2026-07-17T12:00:00Z", pair: buildPair() });
  const b = await buildReviewRecord({ result: base, createdAt: "2026-07-17T12:00:00Z", pair: buildPair() });
  assert.equal(a.integrity.digest, b.integrity.digest, "identical paired inputs → identical digest");
  const offset = await digestReviewRecord(
    assembleReviewRecord({ result: base, createdAt: "2026-07-17T08:00:00-04:00", pair: buildPair() }),
  );
  assert.equal(offset, a.integrity.digest, "an offset form of the same instant collapses to the same digest");
});

test("AT-14: the capture disclosure and the second answer sit inside the hashed body", async () => {
  const base = buildResult().result;
  const matched = await buildReviewRecord({
    result: base,
    createdAt: CREATED,
    pair: buildPair({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.NONE }),
  });
  const edited = await buildReviewRecord({
    result: base,
    createdAt: CREATED,
    pair: buildPair({ same_model: PAIR_SAME_MODEL.YES, edits: PAIR_EDITS.EDITED }),
  });
  assert.notEqual(matched.integrity.digest, edited.integrity.digest, "a different conditions_matched changes the digest");

  const otherAnswer = await buildReviewRecord({
    result: base,
    createdAt: CREATED,
    pair: buildPair({ targetedAnswer: TARGETED_ANSWER + " One more line." }),
  });
  assert.notEqual(matched.integrity.digest, otherAnswer.integrity.digest, "different second-answer bytes change the digest");
});

test("additivity: a single-mode record is byte-identical whether pair is omitted, null, or undefined", async () => {
  const base = buildResult().result;
  const omitted = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: CREATED }));
  const nulled = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: CREATED, pair: null }));
  const undef = await digestReviewRecord(assembleReviewRecord({ result: base, createdAt: CREATED, pair: undefined }));
  assert.equal(nulled, omitted, "pair:null serializes exactly like single mode");
  assert.equal(undef, omitted, "pair:undefined serializes exactly like single mode");

  const single = assembleReviewRecord({ result: base, createdAt: CREATED, pair: null });
  assert.deepEqual(single.contents.pair_runs, [], "no PairRun is added in single mode");
  assert.equal(single.contents.artifacts.length, 1, "single mode holds only the original artifact");

  const paired = await buildReviewRecord({ result: base, createdAt: CREATED, pair: buildPair() });
  assert.notEqual(paired.integrity.digest, omitted, "the paired record is its own distinct artifact");
});

test("scope-5: a paired inspection with no checks assembles a valid pair_runs record (checks ship separately)", async () => {
  // buildPairedPayload carries no `checks`; a paired export must still be well-formed
  // with an empty checks/detector_events set and exactly one PairRun.
  const noChecks = buildResult({ findings: [] }).result;
  const record = await buildReviewRecord({ result: noChecks, createdAt: CREATED, pair: buildPair() });
  assert.deepEqual(record.contents.checks, []);
  assert.deepEqual(record.contents.detector_events, []);
  assert.equal(record.contents.pair_runs.length, 1);
  assert.ok(validateReviewRecord(record).ok, "a checkless paired record is valid");
});

// ── The export consequence (record version v2) ──────────────────────────────────
// Before v2 the packet exported only what the Check Register emitted, so an
// omission-shaped run — the register's most common silence — exported a record
// thinner than the result the person had just read on screen. The canonical
// collection now survives independently of register eligibility.

test("v2: the packet carries every finding even when the register emits no check at all", async () => {
  // A finding with no check block: the register emits nothing, exactly as before.
  const canonical = buildCanonicalResult({
    surface: "single",
    findings: [
      buildFinding({
        index: 0,
        shape: SHAPE_SINGLE_CANDIDATE,
        class_label: "omission",
        statement: "No source is given for the projected figure.",
        quotations: { [ARTIFACT_ORIGINAL]: "a projected figure of 4.2 million" },
        artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
        check_register: classifyRegisterOutcome({ check: null, artifactText: ANSWER, cards: [] }),
      }),
    ],
  });
  const base = buildResult({ findings: [] }).result;
  const record = await buildReviewRecord({
    result: { ...base, result: canonical },
    createdAt: CREATED,
  });

  assert.deepEqual(record.contents.checks, [], "the register still emits nothing — unchanged");
  const carried = record.contents.canonical_result;
  assert.equal(carried.findings.length, 1, "the finding survives in the durable record");
  assert.equal(carried.counts.recorded_findings.value, 1);
  assert.equal(carried.findings[0].check_register.status, "SUPPRESSED");
  assert.deepEqual(carried.findings[0].check_register.suppression_reasons, ["NO_CHECK_BLOCK"]);
  assert.ok(validateReviewRecord(record).ok, "a findings-only record is valid");

  // It sits inside the hashed body, so the export cannot disagree with its digest.
  assert.match(serializeCanonical(record), /No source is given for the projected figure\./);
});

test("v2: a record built from a run that carries no canonical result stays valid", async () => {
  const record = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED });
  assert.equal(record.contents.canonical_result, null);
  assert.ok(validateReviewRecord(record).ok, "the key is additive, not required");
});

// ── The export support line ──────────────────────────────────────────────────────
// describeReviewRecordContents writes the one sentence under the Export Review Record
// control. Fixed copy could not do this job: it would advertise a paired capture on a
// single-answer record and checks on a record that emitted none. So the line is
// generated, and every test below checks it against the record it describes rather
// than against a copy fixture — the two move together or the suite fails.

// A canonical single-surface result carrying `n` findings, built through the real
// door so counts and units come from reader-result.js rather than from this file.
function canonicalWithFindings(n) {
  const findings = [];
  for (let i = 0; i < n; i++) {
    findings.push(
      buildFinding({
        index: i,
        shape: SHAPE_SINGLE_CANDIDATE,
        class_label: "omission",
        statement: `No source is given for the projected figure (${i}).`,
        quotations: { [ARTIFACT_ORIGINAL]: "a projected figure of 4.2 million" },
        artifacts: { [ARTIFACT_ORIGINAL]: ANSWER },
        check_register: classifyRegisterOutcome({ check: null, artifactText: ANSWER, cards: [] }),
      }),
    );
  }
  return buildCanonicalResult({ surface: "single", findings });
}

test("support line: a single-answer record names one answer, never a capture block", async () => {
  const base = buildResult().result;
  const result = { ...base, result: canonicalWithFindings(1) };
  const line = describeReviewRecordContents({ result });
  const record = await buildReviewRecord({ result, createdAt: CREATED });

  assert.equal(record.contents.pair_runs.length, 0, "no pair rode along");
  assert.equal(record.contents.artifacts.length, 1);
  assert.match(line, /the answer as pasted/);
  assert.doesNotMatch(line, /both answers/, "one artifact, so the line must not claim two");
  assert.doesNotMatch(line, /capture conditions/i, "an empty pair_runs array holds no capture block to name");
});

test("support line: a paired record names both answers and the capture block, as reported", async () => {
  const base = buildResult().result;
  const result = { ...base, result: canonicalWithFindings(1) };
  const pair = buildPair();
  const line = describeReviewRecordContents({ result, pair });
  const record = await buildReviewRecord({ result, createdAt: CREATED, pair });

  assert.equal(record.contents.pair_runs.length, 1);
  assert.equal(record.contents.artifacts.length, 2);
  assert.match(line, /both answers as pasted/);
  assert.match(line, /the capture conditions you reported/);

  // The capture block is the person's own three answers (reader-paired.js
  // buildPairCapture, driven by PAIR_CAPTURE_UI). "you reported" is the whole claim.
  // The record holds no authoritative matched-conditions determination, so the line
  // must not read as one — even on this fixture, where the person's own declaration
  // did produce conditions_matched: true.
  assert.equal(record.contents.pair_runs[0].capture.conditions_matched, true);
  assert.doesNotMatch(line, /matched/i, "a client declaration is not a matched-conditions determination");
  assert.doesNotMatch(line, /verified|confirmed|observed/i);
});

test("support line: the checks clause appears exactly when the record carries checks, with its count", async () => {
  const withChecks = { ...buildResult().result, result: canonicalWithFindings(1) };
  const withNone = { ...buildResult({ findings: [] }).result, result: canonicalWithFindings(1) };

  const recWith = await buildReviewRecord({ result: withChecks, createdAt: CREATED });
  const recNone = await buildReviewRecord({ result: withNone, createdAt: CREATED });
  assert.equal(recWith.contents.checks.length, 1);
  assert.equal(recNone.contents.checks.length, 0);

  assert.match(describeReviewRecordContents({ result: withChecks }), /1 check with the marks you set/);
  assert.doesNotMatch(describeReviewRecordContents({ result: withNone }), /check/, "no checks written, none named");
});

test("support line: the findings clause equals the record's own recorded_findings count and unit", async () => {
  for (const n of [0, 1, 3]) {
    const result = { ...buildResult({ findings: [] }).result, result: canonicalWithFindings(n) };
    const record = await buildReviewRecord({ result, createdAt: CREATED });
    const recorded = record.contents.canonical_result.counts.recorded_findings;
    const line = describeReviewRecordContents({ result });

    assert.equal(recorded.value, n, `fixture built ${n}`);
    if (n === 0) {
      assert.doesNotMatch(line, /recorded finding/, "nothing recorded, nothing claimed");
    } else {
      const unit = n === 1 ? recorded.unit_one : recorded.unit_many;
      assert.match(line, new RegExp(`${n} recorded ${unit}\\b`), `n=${n}`);
    }
  }
});

test("support line: a counted finding is stated as unreviewed, never as a verification status", async () => {
  const result = { ...buildResult().result, result: canonicalWithFindings(2) };
  const record = await buildReviewRecord({ result, createdAt: CREATED });
  const line = describeReviewRecordContents({ result });

  // What the file actually holds: every live finding is UNREVIEWED. No api path sets
  // a disposition, so a record exported from the Reader carries this and nothing else.
  assert.ok(
    record.contents.canonical_result.findings.every((f) => f.disposition === DISPOSITION.UNREVIEWED),
    "the fixture matches the live shape — nothing in a Reader export is reviewed",
  );
  assert.match(line, /Every finding in it is unreviewed\./);
  assert.doesNotMatch(line, /verification status|review status|verified/i);
});

test("support line: an empty run still says what the file holds", () => {
  const line = describeReviewRecordContents({ result: buildResult({ findings: [] }).result });
  assert.match(line, /^A JSON file holding the answer as pasted and the run's provenance\.$/);
});

test("support line: every clause names a field the assembler wrote for that run", async () => {
  // The clause set and the contents object, checked against each other. A clause with
  // no field behind it is the failure this exists to catch.
  const clauseFields = [
    { clause: "the answer as pasted", present: (c) => c.artifacts.some((a) => a.role === "original_answer") },
    { clause: "both answers as pasted", present: (c) => c.artifacts.some((a) => a.role === "targeted_answer") },
    { clause: "recorded finding", present: (c) => !!(c.canonical_result && c.canonical_result.findings.length) },
    { clause: "with the marks you set", present: (c) => c.checks.length > 0 },
    { clause: "the capture conditions you reported", present: (c) => c.pair_runs.length > 0 },
    { clause: "the run's provenance", present: (c) => !!c.inspector && !!c.timestamps },
  ];

  const shapes = [
    { label: "single, no findings, no checks", result: buildResult({ findings: [] }).result, pair: null },
    { label: "single, findings + checks", result: { ...buildResult().result, result: canonicalWithFindings(1) }, pair: null },
    { label: "paired, findings + checks", result: { ...buildResult().result, result: canonicalWithFindings(2) }, pair: buildPair() },
    { label: "paired, no findings, no checks", result: buildResult({ findings: [] }).result, pair: buildPair() },
  ];

  for (const shape of shapes) {
    const line = describeReviewRecordContents({ result: shape.result, pair: shape.pair });
    const record = await buildReviewRecord({ result: shape.result, createdAt: CREATED, pair: shape.pair });
    for (const { clause, present } of clauseFields) {
      if (line.includes(clause)) {
        assert.ok(present(record.contents), `${shape.label}: the line claims "${clause}" and the record has no such field`);
      }
    }
    assert.match(line, /the run's provenance/, `${shape.label}: provenance rides on every record`);
    assert.deepEqual(lintUserFacingStrings(line), [], `${shape.label}: AT-5`);
  }
});

test("validation: rejects paired records that break the schema PairRun shape", async () => {
  const good = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED, pair: buildPair() });

  // A PairRun pointing at an artifact id that isn't stored.
  const dangling = JSON.parse(JSON.stringify(good));
  dangling.contents.pair_runs[0].targeted_artifact_id = "ghost_artifact";
  assert.match(validateReviewRecord(dangling).reason, /targeted_artifact_id must resolve/);

  // A populated pair_runs with the targeted_answer artifact removed (AT-12). Re-point
  // the id at the surviving artifact so we hit the AT-12 rule, not the id-resolve rule.
  const noTargeted = JSON.parse(JSON.stringify(good));
  noTargeted.contents.artifacts = noTargeted.contents.artifacts.filter((a) => a.role !== "targeted_answer");
  noTargeted.contents.pair_runs[0].targeted_artifact_id = "original_answer";
  assert.match(validateReviewRecord(noTargeted).reason, /targeted_answer artifact \(AT-12\)/);

  // conditions_matched outside { true, false, "unverified" }.
  const badCond = JSON.parse(JSON.stringify(good));
  badCond.contents.pair_runs[0].capture.conditions_matched = "maybe";
  assert.match(validateReviewRecord(badCond).reason, /conditions_matched must be/);

  // A non-boolean disclosure flag.
  const badDisclosure = JSON.parse(JSON.stringify(good));
  badDisclosure.contents.pair_runs[0].capture.user_edits_disclosed = "no";
  assert.match(validateReviewRecord(badDisclosure).reason, /user_edits_disclosed must be boolean/);
});

test("validation (v0.3.1): enforces PairRun run provenance — initiator, hash, and the user_chip-only fields", async () => {
  const good = await buildReviewRecord({ result: buildResult().result, createdAt: CREATED, pair: buildPair() });
  assert.ok(validateReviewRecord(good).ok, "the inspection-follow-up baseline validates");

  // An initiator outside the enum.
  const badInitiator = JSON.parse(JSON.stringify(good));
  badInitiator.contents.pair_runs[0].initiator = "magic";
  assert.match(validateReviewRecord(badInitiator).reason, /initiator must be/);

  // A targeted_prompt_hash that isn't 64-hex lowercase.
  const badHash = JSON.parse(JSON.stringify(good));
  badHash.contents.pair_runs[0].targeted_prompt_hash = "NOTAHASH";
  assert.match(validateReviewRecord(badHash).reason, /targeted_prompt_hash must be a 64-char/);

  // A missing hash is equally rejected (the record must be self-contained).
  const noHash = JSON.parse(JSON.stringify(good));
  delete noHash.contents.pair_runs[0].targeted_prompt_hash;
  assert.match(validateReviewRecord(noHash).reason, /targeted_prompt_hash must be a 64-char/);

  // chip_id / instruction_version present on an inspection_followup run — the
  // "absent otherwise" rule: chip fields exist ONLY for a user_chip run.
  const strayChipId = JSON.parse(JSON.stringify(good));
  strayChipId.contents.pair_runs[0].chip_id = "sq.deadlines";
  assert.match(validateReviewRecord(strayChipId).reason, /chip_id must be absent unless initiator is user_chip/);

  const strayVersion = JSON.parse(JSON.stringify(good));
  strayVersion.contents.pair_runs[0].instruction_version = "v1";
  assert.match(
    validateReviewRecord(strayVersion).reason,
    /instruction_version must be absent unless initiator is user_chip/,
  );

  // A well-formed user_chip PairRun (schema-complete here; the endpoint lands in a
  // later lane) carries both chip fields and validates.
  const userChip = JSON.parse(JSON.stringify(good));
  userChip.contents.pair_runs[0].initiator = "user_chip";
  userChip.contents.pair_runs[0].chip_id = "sq.deadlines";
  userChip.contents.pair_runs[0].instruction_version = "v1";
  assert.ok(validateReviewRecord(userChip).ok, validateReviewRecord(userChip).reason);

  // …and a user_chip run missing either required field is rejected.
  const chipNoId = JSON.parse(JSON.stringify(userChip));
  delete chipNoId.contents.pair_runs[0].chip_id;
  assert.match(validateReviewRecord(chipNoId).reason, /chip_id required when initiator is user_chip/);

  const chipNoVersion = JSON.parse(JSON.stringify(userChip));
  delete chipNoVersion.contents.pair_runs[0].instruction_version;
  assert.match(
    validateReviewRecord(chipNoVersion).reason,
    /instruction_version required when initiator is user_chip/,
  );
});

// ── No new server-side write path in api/** ──────────────────────────────────────

test("no server write path: no api/** file imports or assembles the review record", () => {
  const apiDir = fileURLToPath(new URL("../api/", import.meta.url));
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const p = `${dir}/${entry}`;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(mjs|js)$/.test(entry) && readFileSync(p, "utf8").includes("reader-review-record")) {
        offenders.push(p);
      }
    }
  };
  walk(apiDir);
  assert.deepEqual(offenders, [], `review record must stay client-only; referenced in: ${offenders.join(", ")}`);
});

test("no server write path: the module pulls in no node builtin and no network/write primitive", () => {
  const src = readFileSync(fileURLToPath(new URL("../reader-review-record.js", import.meta.url)), "utf8");
  assert.doesNotMatch(src, /from\s+["']node:/, "must not import a node builtin (browser-pure)");
  assert.doesNotMatch(src, /require\(/, "must not require()");
  assert.doesNotMatch(src, /\bfetch\s*\(|XMLHttpRequest|localStorage|airtable/i, "must not read/write any store or network");
});
