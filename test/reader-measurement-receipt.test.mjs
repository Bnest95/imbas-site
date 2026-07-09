// Reader v2 P1 — measurement layer + self-contained receipt.
// Two concerns, one file: (1) the pure receipt envelope/canonicalization module
// (reader-receipt.js) — deterministic hashing, content_hash-excludes-itself,
// boundary + unvalidated label carried inside the artifact; (2) the server path
// that parses the candidate measurement, clamps the estimate to 0-3, builds the
// receipt with an authoritative content_hash, and logs the new run/estimate
// fields. Older rows / fallbacks that lack a measurement must degrade to null
// without throwing — the "pre-existing row lacking the new fields" guarantee.
// Run: node --test test/reader-measurement-receipt.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { createReadHandler } from "../api/read.js";
import { _resetMemoryStateForTests } from "../api/reader-security.js";
import {
  RECEIPT_BOUNDARY,
  RECEIPT_SCHEMA_VERSION,
  RECEIPT_HASH_ALGORITHM,
  CANONICALIZATION_VERSION,
  gapEstimateLabel,
  canonicalizeForHash,
  buildSingleReceipt,
  formatReceiptText,
} from "../reader-receipt.js";

const sha256Hex = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const LONG_ANSWER =
  "This is a sufficiently long pasted model answer with more than enough words to clear the validation gate cleanly.";

// A representative measurement as a model would emit it (pre-parse shape).
function sampleMeasurement(over = {}) {
  return {
    findings: [
      { type: "candidate missing item", anchor: "smoother workflows", materiality: "no failure modes" },
      { type: "candidate framing issue", anchor: "reduce wait times", materiality: "benefit-forward" },
      { type: "candidate deflection", anchor: "", materiality: "sidesteps liability" },
    ],
    gap_estimate: 2,
    estimate_rationale: "material context missing, framing leans favorable",
    ...over,
  };
}

// A built envelope for pure-module tests (caller assigns content_hash last).
function buildSample(measurement) {
  const generatedAt = "2026-07-09T00:00:00.000Z";
  return buildSingleReceipt({
    generatedAt,
    question: "What are the risks?",
    topic: "triage",
    declaredModel: "GPT-5",
    answer: "AI triage can speed intake.\r\nIt reduces wait times.",
    inspection: {
      completeness: "partial",
      the_read: "vendor-summary read",
      what_was_left_out: ["failure modes", "accountability"],
      how_it_was_shaped: "benefit-forward",
      inspection_note: "",
    },
    measurement: measurement === undefined ? sampleParsed() : measurement,
    provenance: {
      reader_model_version: "claude-opus-4-8",
      inspector_prompt_version: "reader.v2",
      inspector_run_conditions: { thinking: "adaptive", max_tokens: 8192, temperature: "default" },
      source_content_hash: sha256Hex("src"),
      reader_output_hash: sha256Hex("out"),
      run_timestamp: generatedAt,
      request_id: "reqreceipt000001",
    },
  });
}

// Parsed measurement shape (what buildSingleReceipt expects: finding_counts etc.).
function sampleParsed(over = {}) {
  return {
    findings: [
      { type: "candidate missing item", anchor: "smoother workflows", materiality: "no failure modes" },
      { type: "candidate framing issue", anchor: "reduce wait times", materiality: "benefit-forward" },
    ],
    finding_counts: {
      "candidate missing item": 1,
      "candidate framing issue": 1,
      "candidate deflection": 0,
    },
    gap_estimate: 2,
    estimate_rationale: "material context missing",
    estimate_type: "candidate_gap",
    estimate_scale_version: "1.0",
    candidate_method_version: "1.0",
    unvalidated: true,
    ...over,
  };
}

// Deep clone with keys reinserted in reverse order at every object level — proves
// the canonical form does not depend on insertion order.
function reverseKeys(v) {
  if (Array.isArray(v)) return v.map(reverseKeys);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).reverse()) out[k] = reverseKeys(v[k]);
    return out;
  }
  return v;
}

// ── Pure module: constants + label ───────────────────────────────────────────

test("RECEIPT_BOUNDARY is the exact verbatim boundary sentence", () => {
  assert.equal(
    RECEIPT_BOUNDARY,
    "Reader inspections are discovery, not evidence. Nothing enters the Imbas record without protocol capture and a recorded human review.",
  );
});

test("gapEstimateLabel is always the unvalidated 0-3 label", () => {
  assert.equal(gapEstimateLabel(0), "Candidate gap estimate: 0 of 3 (unvalidated)");
  assert.equal(gapEstimateLabel(2), "Candidate gap estimate: 2 of 3 (unvalidated)");
  assert.equal(gapEstimateLabel(3), "Candidate gap estimate: 3 of 3 (unvalidated)");
});

// ── Pure module: envelope shape ──────────────────────────────────────────────

test("buildSingleReceipt produces the single-mode envelope shape", () => {
  const e = buildSample();
  assert.equal(e.receipt_type, "single");
  assert.equal(e.schema_version, RECEIPT_SCHEMA_VERSION);
  assert.equal(e.paired_analysis, null);
  assert.equal(e.boundary, RECEIPT_BOUNDARY);
  assert.equal(e.integrity.algorithm, RECEIPT_HASH_ALGORITHM);
  assert.equal(e.integrity.canonicalization_version, CANONICALIZATION_VERSION);
  assert.equal(e.integrity.content_hash, null); // caller assigns it, never pre-filled
  assert.equal(e.open_run.declared_model, "GPT-5");
  assert.equal(e.open_run.measurement.unvalidated, true);
  assert.equal(e.open_run.measurement.gap_estimate_label, gapEstimateLabel(2));
});

test("buildSingleReceipt leaves measurement null when none is supplied (old-row path)", () => {
  const e = buildSample(null);
  assert.equal(e.open_run.measurement, null);
  // and the artifact still carries the boundary + a valid integrity block
  assert.equal(e.boundary, RECEIPT_BOUNDARY);
  assert.equal(e.integrity.content_hash, null);
});

// ── Pure module: canonicalization + hashing ──────────────────────────────────

test("canonicalizeForHash is independent of object key insertion order", () => {
  const a = buildSample();
  const b = reverseKeys(a);
  assert.notEqual(Object.keys(a)[0], Object.keys(b)[0]); // orders really differ
  assert.equal(canonicalizeForHash(a), canonicalizeForHash(b));
  assert.equal(sha256Hex(canonicalizeForHash(a)), sha256Hex(canonicalizeForHash(b)));
});

test("content_hash is excluded from its own hash input", () => {
  const a = buildSample();
  const b = buildSample();
  a.integrity.content_hash = "already-set-to-something";
  b.integrity.content_hash = "a-completely-different-value";
  const ca = canonicalizeForHash(a);
  const cb = canonicalizeForHash(b);
  assert.ok(ca.includes('"content_hash":null'), "canonical form nulls content_hash");
  assert.equal(ca, cb); // stored hash value does not leak into the canonical input
  assert.equal(sha256Hex(ca), sha256Hex(cb));
});

test("a stored content_hash verifies by recomputation", () => {
  const e = buildSample();
  e.integrity.content_hash = sha256Hex(canonicalizeForHash(e));
  // A verifier recomputes over the received envelope (hash present) and must match.
  const recomputed = sha256Hex(canonicalizeForHash(e));
  assert.match(e.integrity.content_hash, /^[0-9a-f]{64}$/);
  assert.equal(recomputed, e.integrity.content_hash);
});

test("canonicalization normalizes CRLF and lone CR to LF", () => {
  const e = buildSample();
  const canon = canonicalizeForHash(e);
  assert.ok(!canon.includes("\\r"), "no carriage returns survive canonicalization");
  assert.ok(canon.includes("AI triage can speed intake.\\nIt reduces wait times."));
});

// ── Pure module: human-readable receipt ──────────────────────────────────────

test("formatReceiptText carries the boundary and the unvalidated label in-artifact", () => {
  const e = buildSample();
  e.integrity.content_hash = sha256Hex(canonicalizeForHash(e));
  const txt = formatReceiptText(e);
  assert.ok(txt.includes(RECEIPT_BOUNDARY));
  assert.ok(txt.includes(gapEstimateLabel(2)));
  assert.ok(txt.includes('anchor: "smoother workflows"'));
  assert.ok(txt.includes(e.integrity.content_hash));
});

test("formatReceiptText degrades gracefully when no measurement is present", () => {
  const e = buildSample(null);
  e.integrity.content_hash = sha256Hex(canonicalizeForHash(e));
  let txt;
  assert.doesNotThrow(() => {
    txt = formatReceiptText(e);
  });
  assert.ok(txt.includes("No measurement layer was produced for this run."));
  assert.ok(txt.includes(RECEIPT_BOUNDARY));
});

// ── Handler integration: measurement path ────────────────────────────────────

let ipCounter = 30;
function agentFetch(rawMeasurement, onAirtableBody) {
  return async (url, opts) => {
    if (String(url).includes("anthropic")) {
      const inner = {
        completeness: "partial",
        the_read: "A real read of the answer.",
        what_was_left_out: ["something material"],
        how_it_was_shaped: "",
        inspection_note: "note",
      };
      if (rawMeasurement !== undefined) inner.measurement = rawMeasurement;
      return {
        ok: true,
        json: async () => ({
          content: [{ type: "text", text: JSON.stringify(inner) }],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };
    }
    if (onAirtableBody) onAirtableBody(opts && opts.body ? JSON.parse(opts.body) : null);
    return { ok: true, status: 200, text: async () => "" };
  };
}

function mockRes() {
  const out = { statusCode: null, body: null };
  return {
    status(code) {
      out.statusCode = code;
      return this;
    },
    json(payload) {
      out.body = payload;
      return this;
    },
    setHeader() {
      return this;
    },
    end() {
      return this;
    },
    out,
  };
}

async function runHandler(rawMeasurement) {
  let airtableBody = null;
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1", AIRTABLE_TOKEN: "test-token" },
    fetch: agentFetch(rawMeasurement, (b) => {
      airtableBody = b;
    }),
  });
  const ip = `203.0.113.${ipCounter++}`;
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: {
      open_question: "What are the risks of relying on AI for triage?",
      answer: LONG_ANSWER,
      case: { topic: "triage" },
      inspected_model: "ChatGPT",
      textcheck: { surfaced: false, found: [], missing: [] },
    },
  };
  const res = mockRes();
  await handler(req, res);
  return { body: res.out.body, status: res.out.statusCode, fields: airtableBody ? airtableBody.fields : null };
}

beforeEach(() => {
  _resetMemoryStateForTests();
});

test("handler assembles the measurement panel data from a valid model measurement", async () => {
  const { status, body, fields } = await runHandler(sampleMeasurement());
  assert.equal(status, 200);
  assert.equal(body.source, "agent");
  const m = body.measurement;
  assert.ok(m, "measurement present");
  assert.equal(m.gap_estimate, 2);
  assert.equal(m.estimate_type, "candidate_gap");
  assert.equal(m.unvalidated, true);
  assert.equal(m.findings.length, 3);
  assert.deepEqual(m.finding_counts, {
    "candidate missing item": 1,
    "candidate framing issue": 1,
    "candidate deflection": 1,
  });
  // capture writes the run-level + estimate-level fields
  assert.equal(fields["Run Mode"], "single");
  assert.equal(fields["Calibration Eligible"], false);
  assert.equal(fields["Candidate Retention Consent"], false);
  assert.equal(fields["Estimate Type"], "candidate_gap");
  assert.equal(fields["Gap Estimate"], 2);
  assert.equal(
    fields["Finding Types"],
    "candidate missing item: 1\ncandidate framing issue: 1\ncandidate deflection: 1",
  );
});

test("handler attaches a receipt whose content_hash verifies by recomputation", async () => {
  const { body, fields } = await runHandler(sampleMeasurement());
  const receipt = body.receipt;
  assert.ok(receipt, "receipt present on payload");
  assert.equal(receipt.boundary, RECEIPT_BOUNDARY);
  assert.match(receipt.integrity.content_hash, /^[0-9a-f]{64}$/);
  const recomputed = sha256Hex(canonicalizeForHash(receipt));
  assert.equal(recomputed, receipt.integrity.content_hash);
  // the identical hash is recorded on the run row
  assert.equal(fields["Receipt Hash"], receipt.integrity.content_hash);
  assert.equal(fields["Schema Version"], RECEIPT_SCHEMA_VERSION);
});

test("gap estimate is clamped into 0-3 (round then clamp)", async () => {
  assert.equal((await runHandler(sampleMeasurement({ gap_estimate: 9 }))).body.measurement.gap_estimate, 3);
  assert.equal((await runHandler(sampleMeasurement({ gap_estimate: -4 }))).body.measurement.gap_estimate, 0);
  assert.equal((await runHandler(sampleMeasurement({ gap_estimate: 1.6 }))).body.measurement.gap_estimate, 2);
});

test("findings of unknown type are dropped from the measurement", async () => {
  const m = sampleMeasurement({
    findings: [
      { type: "candidate missing item", anchor: "a", materiality: "m" },
      { type: "totally made up type", anchor: "b", materiality: "m" },
    ],
  });
  const { body } = await runHandler(m);
  assert.equal(body.measurement.findings.length, 1);
  assert.equal(body.measurement.findings[0].type, "candidate missing item");
  assert.equal(body.measurement.finding_counts["candidate missing item"], 1);
});

test("a non-finite gap estimate nulls the whole measurement, receipt still built", async () => {
  const { body, fields } = await runHandler(sampleMeasurement({ gap_estimate: "not a number" }));
  assert.equal(body.measurement, null); // panel-absent path
  assert.ok(body.receipt, "receipt is still attached for the agent run");
  // estimate-level fields are absent (graceful); run-level + receipt fields remain
  assert.equal(fields["Gap Estimate"], undefined);
  assert.equal(fields["Estimate Type"], undefined);
  assert.equal(fields["Run Mode"], "single");
  assert.match(fields["Receipt Hash"], /^[0-9a-f]{64}$/);
});

test("a run with no measurement at all degrades to null without new estimate fields", async () => {
  const { body, fields } = await runHandler(undefined); // model omitted measurement entirely
  assert.equal(body.measurement, null);
  assert.ok(body.receipt);
  assert.equal(body.receipt.open_run.measurement, null);
  assert.equal(fields["Gap Estimate"], undefined);
  assert.equal(fields["Finding Types"], undefined);
});
