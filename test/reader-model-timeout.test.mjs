// Phase 0 §A — bounded model-call timeouts.
// Every Workbench model call (single Reader + paired second read) is wrapped in an
// AbortController that fires after MODEL_CALL_TIMEOUT_MS. A stalled provider must
// resolve into the coherent degradation path, never hang the invocation:
//   - single read  → fail-open 200 with the timeout fallback (source "fallback"),
//     and the timeout reason is DISTINGUISHED from a plain network error;
//   - paired read  → failure isolation (502 analysis_failed, retryable), Act 1 intact.
// Both prove an abort signal is actually attached to the outgoing fetch.
// Run: node --test test/reader-model-timeout.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { createReadHandler } from "../api/read.js";
import { createReadPairedHandler } from "../api/read-paired.js";
import { buildSingleReceipt, canonicalizeForHash } from "../reader-receipt.js";
import { _resetMemoryStateForTests } from "../reader-security.js";

const sha256Hex = (s) => createHash("sha256").update(String(s), "utf8").digest("hex");
const LONG_ANSWER =
  "This is a sufficiently long pasted model answer with more than enough words to clear the validation gate cleanly.";

function abortError() {
  const err = new Error("The operation was aborted");
  err.name = "AbortError";
  return err;
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

// A model fetch that throws `err` when the anthropic call is made, recording whether
// an abort signal rode along. Airtable calls (capture / idempotency) succeed so the
// only failure under test is the model call itself.
function throwingModelFetch(err, sawSignal) {
  return async (url, opts = {}) => {
    const u = String(url);
    if (u.includes("anthropic")) {
      if (opts && opts.signal) sawSignal.value = true;
      throw err;
    }
    const method = (opts && opts.method) || "GET";
    if (method === "GET") return { ok: true, json: async () => ({ records: [] }) };
    return { ok: true, status: 200, json: async () => ({ id: "rec1" }), text: async () => "" };
  };
}

let ip = 210;

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── Single read ───────────────────────────────────────────────────────────────

async function runSingle(err, sawSignal) {
  const handler = createReadHandler({
    env: { READER_API_KEY: "k", READER_ENABLED: "1", AIRTABLE_TOKEN: "t", READER_SPEND_CEILING_USD: "8" },
    fetch: throwingModelFetch(err, sawSignal),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": `203.0.113.${ip++}` },
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
  return res.out;
}

test("single: a model-call abort routes to the timeout fallback, fail-open 200", async () => {
  const sawSignal = { value: false };
  const out = await runSingle(abortError(), sawSignal);
  assert.equal(out.statusCode, 200, "read stays fail-open on a timeout");
  assert.equal(out.body.source, "fallback");
  assert.ok(out.body.the_read.includes("(timeout)"), "fallback names the timeout reason");
  assert.ok(sawSignal.value, "an abort signal was attached to the model call");
});

test("single: a plain network error is DISTINGUISHED from a timeout", async () => {
  const sawSignal = { value: false };
  const out = await runSingle(new Error("socket hang up"), sawSignal);
  assert.equal(out.statusCode, 200);
  assert.equal(out.body.source, "fallback");
  assert.ok(out.body.the_read.includes("(network)"), "network failure keeps the network reason");
  assert.ok(!out.body.the_read.includes("(timeout)"), "a network error is never mislabeled a timeout");
});

// ── Condition 3: an unset spend ceiling fails closed (no production default) ─────
// With READER_SPEND_CEILING_USD unset the metered model call must not run: the read
// fails closed into the same honest instruction-only capacity fallback as an exceeded
// ceiling (source "fallback", reason "ceiling"), and no paid provider call is attempted.
test("single: an unset spend ceiling fails closed into the capacity fallback, no model call", async () => {
  const modelCalled = { value: false };
  const handler = createReadHandler({
    env: { READER_API_KEY: "k", READER_ENABLED: "1", AIRTABLE_TOKEN: "t" }, // no READER_SPEND_CEILING_USD
    fetch: async (url, opts = {}) => {
      if (String(url).includes("anthropic")) {
        modelCalled.value = true;
        return { ok: true, json: async () => ({ content: [{ type: "text", text: "{}" }] }) };
      }
      const method = (opts && opts.method) || "GET";
      if (method === "GET") return { ok: true, json: async () => ({ records: [] }) };
      return { ok: true, status: 200, json: async () => ({ id: "rec1" }), text: async () => "" };
    },
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": `203.0.113.${ip++}` },
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
  assert.equal(res.out.statusCode, 200, "unset ceiling stays fail-open 200 with a fallback body");
  assert.equal(res.out.body.source, "fallback");
  assert.ok(res.out.body.the_read.includes("(ceiling)"), "the fallback names the ceiling reason");
  assert.equal(modelCalled.value, false, "no paid model call is attempted when the ceiling is unset");
});

// ── Paired read ───────────────────────────────────────────────────────────────

function buildOpenReceipt(requestId) {
  const receipt = buildSingleReceipt({
    generatedAt: "2026-07-09T00:00:00.000Z",
    question: "What are the risks of relying on AI for triage?",
    topic: "triage",
    declaredModel: "GPT-5",
    answer: "AI triage can speed intake. It reduces wait times.",
    inspection: {
      completeness: "partial",
      the_read: "vendor-summary read",
      what_was_left_out: ["failure modes"],
      how_it_was_shaped: "benefit-forward",
      inspection_note: "",
    },
    measurement: {
      findings: [
        { type: "candidate missing item", anchor: "smoother workflows", materiality: "failure modes never named" },
      ],
      finding_counts: { "candidate missing item": 1, "candidate framing issue": 0, "candidate deflection": 0 },
      gap_estimate: 2,
      estimate_rationale: "material context missing",
      estimate_type: "candidate_gap",
      estimate_scale_version: "1.0",
      candidate_method_version: "1.0",
      unvalidated: true,
    },
    provenance: {
      reader_model_version: "claude-opus-4-8",
      inspector_prompt_version: "reader.v3",
      inspector_run_conditions: { thinking: "adaptive", max_tokens: 8192, temperature: "default" },
      source_content_hash: sha256Hex("src"),
      reader_output_hash: sha256Hex("out"),
      run_timestamp: "2026-07-09T00:00:00.000Z",
      request_id: requestId,
    },
  });
  receipt.integrity.content_hash = sha256Hex(canonicalizeForHash(receipt));
  return receipt;
}

test("paired: a model-call abort isolates the failure (502 analysis_failed, retryable)", async () => {
  const sawSignal = { value: false };
  const handler = createReadPairedHandler({
    env: { READER_API_KEY: "k", READER_ENABLED: "1", AIRTABLE_TOKEN: "t", READER_SPEND_CEILING_USD: "8" },
    fetch: throwingModelFetch(abortError(), sawSignal),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": `198.51.100.${ip++}` },
    body: {
      open_receipt: buildOpenReceipt(sha256Hex("openrun:timeout").slice(0, 16)),
      targeted_answer:
        "Here is the second answer. It names the failure modes the first one left out: acute cases can be misrouted.",
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode, 502, "the second read fails closed, isolated from Act 1");
  assert.equal(res.out.body.error, "analysis_failed");
  assert.equal(res.out.body.retryable, true);
  assert.ok(sawSignal.value, "an abort signal was attached to the second model call");
});

// ── Condition 3 (paired): an unset spend ceiling fails closed before the paid call ──
// A pair has no honest fallback (it requires the model), so an unset ceiling returns the
// retryable capacity response — Act 1 stays intact client-side — and never spends.
test("paired: an unset spend ceiling fails closed to a retryable capacity response, no model call", async () => {
  const modelCalled = { value: false };
  const handler = createReadPairedHandler({
    env: { READER_API_KEY: "k", READER_ENABLED: "1", AIRTABLE_TOKEN: "t" }, // no READER_SPEND_CEILING_USD
    fetch: async (url, opts = {}) => {
      if (String(url).includes("anthropic")) {
        modelCalled.value = true;
        return { ok: true, json: async () => ({ content: [{ type: "text", text: "{}" }] }) };
      }
      const method = (opts && opts.method) || "GET";
      if (method === "GET") return { ok: true, json: async () => ({ records: [] }) };
      return { ok: true, status: 200, json: async () => ({ id: "rec1" }), text: async () => "" };
    },
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": `198.51.100.${ip++}` },
    body: {
      open_receipt: buildOpenReceipt(sha256Hex("openrun:ceiling").slice(0, 16)),
      targeted_answer:
        "Here is the second answer. It names the failure modes the first one left out: acute cases can be misrouted.",
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode, 429, "the paired read fails closed when no ceiling is configured");
  assert.equal(res.out.body.error, "capacity");
  assert.equal(modelCalled.value, false, "no paid model call is attempted when the ceiling is unset");
});
