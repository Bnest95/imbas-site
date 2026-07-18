// reader-review-record — the ReviewRecord export, its review-record.c14n.v1
// canonicalization, and the integrity digest (Reader v3 RR lane, site repo).
//
// Gates pinned here, tied to docs/REVIEW-GRAPH-SCHEMA.md v0.2.3:
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
//     REVIEW_RECORD_UI) — pointer register only.
//   - Additivity: building a record perturbs neither its inputs nor an existing
//     reader-receipt content_hash minted from the same open run.
//   - No new server-side write path: no api/** file assembles or persists the
//     record, and the module itself pulls in no node builtin and no network/write.
//   - Record validation against the schema v0.2.3 shapes (positive + rejections).
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

test("assembly: a built record validates against the schema v0.2.3 shapes", async () => {
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
