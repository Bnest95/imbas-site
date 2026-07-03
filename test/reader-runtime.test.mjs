// Reader runtime observability — request IDs, structured logs, health, failure paths.
// Run: node --test test/reader-runtime.test.mjs

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  createRequestId,
  createRuntimeContext,
  logRuntimeEvent,
  ROUTE,
} from "../api/reader-runtime.js";
import { getReaderHealthStatus } from "../api/reader-health.js";
import { captureRun, createReadHandler } from "../api/read.js";
import { _resetMemoryStateForTests } from "../api/reader-security.js";

const SECRET_ANSWER =
  "SECRET_ANSWER_CONTENT_DO_NOT_LOG_THIS_VERY_LONG_PASTED_MODEL_ANSWER_FOR_TESTING";
const SECRET_QUESTION = "Is this secret question content logged anywhere?";

let logLines = [];
let origLog;
let origWarn;

function installLogCapture() {
  logLines = [];
  origLog = console.log;
  origWarn = console.warn;
  console.log = (line) => logLines.push(String(line));
  console.warn = (line) => logLines.push(String(line));
}

function restoreLogs() {
  console.log = origLog;
  console.warn = origWarn;
}

function parsedLogs() {
  return logLines.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
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

beforeEach(() => {
  _resetMemoryStateForTests();
  installLogCapture();
});

afterEach(() => {
  restoreLogs();
});

test("createRequestId is 16 hex chars with no PII", () => {
  const id = createRequestId();
  assert.match(id, /^[0-9a-f]{16}$/);
  assert.notEqual(id, createRequestId());
});

test("logRuntimeEvent emits reader_runtime namespace", () => {
  const ctx = createRuntimeContext({ request_id: "abc123def4567890" });
  logRuntimeEvent("request_received", { request_id: ctx.request_id, route: ROUTE });
  const events = parsedLogs();
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "reader_runtime");
  assert.equal(events[0].type, "request_received");
  assert.equal(events[0].request_id, "abc123def4567890");
});

test("validation rejection logs do not include answer content", async () => {
  const handler = createReadHandler({ env: {} });
  const req = {
    method: "POST",
    headers: {},
    body: {
      open_question: SECRET_QUESTION,
      answer: "too short",
      case: {},
      textcheck: {},
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode, 400);
  assert.equal(res.out.body.error, "empty");
  assert.ok(res.out.body.request_id);
  const blob = logLines.join("\n");
  assert.ok(!blob.includes(SECRET_QUESTION));
  assert.ok(!blob.includes("too short"));
  const rejected = parsedLogs().find((e) => e.type === "validation_rejected");
  assert.ok(rejected);
  assert.equal(rejected.reason, "empty");
  assert.equal(rejected.request_id, res.out.body.request_id);
});

test("inference failure logs structured event and returns safe fallback response", async () => {
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1" },
    fetch: async () => ({ ok: false, status: 503, json: async () => ({}), text: async () => "" }),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.77" },
    body: {
      open_question: "What is the safety of nonstick cookware?",
      answer: `${SECRET_ANSWER} with enough words to pass validation gate easily here.`,
      case: { topic: "cookware" },
      textcheck: { surfaced: false, found: [], missing: ["PFAS"] },
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode, 200);
  assert.equal(res.out.body.source, "fallback");
  const blob = logLines.join("\n");
  assert.ok(!blob.includes(SECRET_ANSWER));
  const failed = parsedLogs().find((e) => e.type === "inference_failed");
  assert.ok(failed);
  assert.equal(failed.upstream_status, 503);
  const fallback = parsedLogs().find((e) => e.type === "fallback_returned");
  assert.ok(fallback);
  assert.equal(fallback.reason, "api_error");
  const requestIds = new Set(parsedLogs().map((e) => e.request_id).filter(Boolean));
  assert.equal(requestIds.size, 1);
});

test("parse failure logs parse_failed without model text content", async () => {
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1" },
    fetch: async () => ({
      ok: true,
      json: async () => ({
        content: [{ type: "text", text: `not json but contains ${SECRET_ANSWER}` }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    }),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.78" },
    body: {
      open_question: "What is the safety of nonstick cookware?",
      answer: `${SECRET_ANSWER} with enough words to pass validation gate easily here.`,
      case: {},
      textcheck: { surfaced: false, found: [], missing: [] },
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.body.source, "fallback");
  const blob = logLines.join("\n");
  assert.ok(!blob.includes(SECRET_ANSWER));
  const parseFailed = parsedLogs().find((e) => e.type === "parse_failed");
  assert.ok(parseFailed);
  assert.equal(parseFailed.parse_error_class, "json_extract_failed");
  assert.ok(typeof parseFailed.model_text_len === "number");
});

test("capture failure logs capture_failed and still returns reader output", async () => {
  const ctx = createRuntimeContext({ request_id: "capturetest00001" });
  const input = {
    openQuestion: SECRET_QUESTION,
    answer: SECRET_ANSWER,
    textcheck: { surfaced: false, found: [], missing: [] },
  };
  const payload = {
    completeness: "partial",
    the_read: "A test read that must not appear in logs.",
    what_was_left_out: ["item"],
    how_it_was_shaped: "",
    inspection_note: "note",
    source: "agent",
  };
  const result = await captureRun(input, payload, ctx, {
    env: { AIRTABLE_TOKEN: "test-token" },
    fetch: async () => ({ ok: false, status: 422, text: async () => "airtable error body" }),
  });
  assert.equal(result.ok, false);
  const blob = logLines.join("\n");
  assert.ok(!blob.includes(SECRET_ANSWER));
  assert.ok(!blob.includes(SECRET_QUESTION));
  assert.ok(!blob.includes("A test read"));
  assert.ok(!blob.includes("airtable error body"));
  const failed = parsedLogs().find((e) => e.type === "capture_failed");
  assert.ok(failed);
  assert.equal(failed.failure_class, "airtable_http");
  assert.equal(failed.user_response_returned, true);
  assert.equal(failed.request_id, "capturetest00001");
});

test("getReaderHealthStatus reports mode without secrets", () => {
  const status = getReaderHealthStatus({
    READER_ENABLED: "1",
    READER_API_KEY: "secret-key-value",
    AIRTABLE_TOKEN: "secret-airtable",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "secret-redis",
  });
  assert.equal(status.service, "reader");
  assert.equal(status.mode, "ready");
  assert.equal(status.model_api_configured, true);
  assert.equal(status.durable_rate_store, true);
  assert.equal(status.airtable_capture_configured, true);
  const serialized = JSON.stringify(status);
  assert.ok(!serialized.includes("secret-key"));
  assert.ok(!serialized.includes("secret-airtable"));
  assert.ok(!serialized.includes("secret-redis"));
  assert.ok(!serialized.includes("upstash.io"));
});

test("getReaderHealthStatus mode disabled when kill switch on", () => {
  const status = getReaderHealthStatus({ READER_ENABLED: "0", READER_API_KEY: "x" });
  assert.equal(status.mode, "disabled");
  assert.equal(status.reader_enabled, false);
});

test("getReaderHealthStatus mode degraded without durable store", () => {
  const status = getReaderHealthStatus({ READER_ENABLED: "1", READER_API_KEY: "x" });
  assert.equal(status.mode, "degraded");
  assert.equal(status.durable_rate_store, false);
});
