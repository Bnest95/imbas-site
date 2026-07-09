// Reader capture provenance — stable identity, model/prompt provenance,
// topic/anchor + inspected-model pass-through, deterministic content/output
// hashes, and capture fail-safe when the schema rejects new fields.
// These are additive-only guarantees: no product UX, prompt, model, scoring,
// or output-contract behavior is asserted or changed here.
// Run: node --test test/reader-provenance.test.mjs

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { captureRun, createReadHandler } from "../api/read.js";
import { createRuntimeContext } from "../api/reader-runtime.js";
import { _resetMemoryStateForTests } from "../api/reader-security.js";

const MODEL = "claude-opus-4-8";
const PROMPT_VERSION = "reader.v2";
const LONG_ANSWER =
  "This is a sufficiently long pasted model answer with more than enough words to clear the validation gate cleanly.";

// ── helpers ──────────────────────────────────────────────────────────────────

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
  return logLines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function ctxWith(id) {
  return createRuntimeContext({ request_id: id });
}

function baseInput(over = {}) {
  return {
    openQuestion: "What is X?",
    answer: LONG_ANSWER,
    topic: "",
    anchor: "",
    inspectedModel: "",
    textcheck: { surfaced: false, found: [], missing: [] },
    ...over,
  };
}

function basePayload(over = {}) {
  return {
    completeness: "partial",
    the_read: "A short read.",
    what_was_left_out: [],
    how_it_was_shaped: "",
    inspection_note: "note",
    source: "agent",
    ...over,
  };
}

// Captures the Airtable POST body so the written fields can be inspected.
function captureFetch(responder) {
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, body: opts && opts.body ? JSON.parse(opts.body) : null });
    return responder ? responder() : { ok: true, status: 200, text: async () => "" };
  };
  return { fetchImpl, calls };
}

function expectedSourceHash(openQuestion, answer) {
  return createHash("sha256").update(`${openQuestion}\n${answer}`, "utf8").digest("hex");
}

function expectedOutputHash(p) {
  const canonical = JSON.stringify({
    completeness: p.completeness || "",
    the_read: p.the_read || "",
    what_was_left_out: Array.isArray(p.what_was_left_out) ? p.what_was_left_out : [],
    how_it_was_shaped: p.how_it_was_shaped || "",
    inspection_note: p.inspection_note || "",
    source: p.source || "",
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

async function runCapture(input, payload, id, responder) {
  const { fetchImpl, calls } = captureFetch(responder);
  const result = await captureRun(input, payload, ctxWith(id), {
    env: { AIRTABLE_TOKEN: "test-token" },
    fetch: fetchImpl,
  });
  return { result, fields: calls[0] ? calls[0].body.fields : null, calls };
}

// Anthropic mock that returns a valid agent read; distinct from the Airtable URL.
function agentFetch(airtableResponder, onAirtableBody) {
  return async (url, opts) => {
    if (String(url).includes("anthropic")) {
      return {
        ok: true,
        json: async () => ({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                completeness: "partial",
                the_read: "A real read of the answer.",
                what_was_left_out: ["something material"],
                how_it_was_shaped: "",
                inspection_note: "note",
              }),
            },
          ],
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      };
    }
    if (onAirtableBody) onAirtableBody(opts && opts.body ? JSON.parse(opts.body) : null);
    return airtableResponder
      ? airtableResponder()
      : { ok: true, status: 200, text: async () => "" };
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

beforeEach(() => {
  _resetMemoryStateForTests();
  installLogCapture();
});

afterEach(() => {
  restoreLogs();
});

// ── A/B/C: request identity + model + prompt version ─────────────────────────

test("captureRun persists request id, reader model, and prompt version", async () => {
  const { result, fields } = await runCapture(baseInput(), basePayload(), "req0123456789abcd");
  assert.equal(result.ok, true);
  assert.equal(fields["Request ID"], "req0123456789abcd");
  assert.equal(fields["Reader Model"], MODEL);
  assert.equal(fields["Reader Prompt Version"], PROMPT_VERSION);
});

// ── D: topic / anchor pass-through ───────────────────────────────────────────

test("captureRun persists topic and anchor from input", async () => {
  const input = baseInput({ topic: "the safety of nonstick cookware", anchor: "PFAS" });
  const { fields } = await runCapture(input, basePayload(), "aaaaaaaaaaaaaaaa");
  assert.equal(fields.Topic, "the safety of nonstick cookware");
  assert.equal(fields.Anchor, "PFAS");
});

test("captureRun stores empty topic and anchor when the input has none", async () => {
  const { fields } = await runCapture(baseInput(), basePayload(), "bbbbbbbbbbbbbbbb");
  assert.equal(fields.Topic, "");
  assert.equal(fields.Anchor, "");
});

// ── E: inspected AI model pass-through ───────────────────────────────────────

test("captureRun persists inspected AI model when the Workbench provides it", async () => {
  const input = baseInput({ inspectedModel: "ChatGPT" });
  const { fields } = await runCapture(input, basePayload(), "cccccccccccccccc");
  assert.equal(fields["Inspected AI Model"], "ChatGPT");
});

test("captureRun leaves inspected AI model empty when unknown", async () => {
  const { fields } = await runCapture(baseInput(), basePayload(), "dddddddddddddddd");
  assert.equal(fields["Inspected AI Model"], "");
});

// ── F: source content hash ───────────────────────────────────────────────────

test("source content hash is deterministic and equals sha256(question\\nanswer)", async () => {
  const input = baseInput({ openQuestion: "What is X?", answer: LONG_ANSWER });
  const expected = expectedSourceHash("What is X?", LONG_ANSWER);
  const a = await runCapture(input, basePayload(), "1111111111111111");
  const b = await runCapture(input, basePayload(), "2222222222222222");
  assert.match(a.fields["Source Content Hash"], /^[0-9a-f]{64}$/);
  assert.equal(a.fields["Source Content Hash"], expected);
  assert.equal(b.fields["Source Content Hash"], expected);
});

test("source content hash changes when the answer changes", async () => {
  const a = await runCapture(baseInput({ answer: `${LONG_ANSWER} one` }), basePayload(), "3333333333333333");
  const b = await runCapture(baseInput({ answer: `${LONG_ANSWER} two` }), basePayload(), "4444444444444444");
  assert.notEqual(a.fields["Source Content Hash"], b.fields["Source Content Hash"]);
});

// ── G: reader output hash ────────────────────────────────────────────────────

test("reader output hash is deterministic and independent of object key order", async () => {
  const canonicalOrder = basePayload({
    completeness: "partial",
    the_read: "r",
    what_was_left_out: ["a"],
    how_it_was_shaped: "s",
    inspection_note: "n",
    source: "agent",
  });
  // Same values, different insertion order — must hash identically.
  const shuffled = {
    source: "agent",
    inspection_note: "n",
    how_it_was_shaped: "s",
    what_was_left_out: ["a"],
    the_read: "r",
    completeness: "partial",
  };
  const expected = expectedOutputHash(canonicalOrder);
  const a = await runCapture(baseInput(), canonicalOrder, "5555555555555555");
  const b = await runCapture(baseInput(), shuffled, "6666666666666666");
  assert.match(a.fields["Reader Output Hash"], /^[0-9a-f]{64}$/);
  assert.equal(a.fields["Reader Output Hash"], expected);
  assert.equal(b.fields["Reader Output Hash"], expected);
});

test("reader output hash changes when the read changes", async () => {
  const a = await runCapture(baseInput(), basePayload({ the_read: "read one" }), "7777777777777777");
  const b = await runCapture(baseInput(), basePayload({ the_read: "read two" }), "8888888888888888");
  assert.notEqual(a.fields["Reader Output Hash"], b.fields["Reader Output Hash"]);
});

// ── H: capture fail-safe when the schema rejects new fields ───────────────────

test("captureRun is fail-safe when Airtable rejects unknown fields (422)", async () => {
  const { result } = await runCapture(baseInput(), basePayload(), "9999999999999999", () => ({
    ok: false,
    status: 422,
    text: async () => "UNKNOWN_FIELD_NAME: Reader Output Hash",
  }));
  assert.equal(result.ok, false);
  assert.equal(result.failure_class, "airtable_http");
  const failed = parsedLogs().find((e) => e.type === "capture_failed");
  assert.ok(failed);
  assert.equal(failed.upstream_status, 422);
  assert.equal(failed.user_response_returned, true);
  // provenance presence markers ride the failure log too
  assert.equal(failed.request_id_present, true);
  assert.equal(failed.source_content_hash_present, true);
  assert.equal(failed.reader_output_hash_present, true);
});

test("handler still returns the inspection when capture rejects unknown fields", async () => {
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1", AIRTABLE_TOKEN: "test-token" },
    fetch: agentFetch(() => ({ ok: false, status: 422, text: async () => "UNKNOWN_FIELD_NAME" })),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.10" },
    body: {
      open_question: "What is the safety of nonstick cookware?",
      answer: LONG_ANSWER,
      case: { topic: "cookware" },
      textcheck: { surfaced: false, found: [], missing: [] },
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode, 200);
  assert.equal(res.out.body.source, "agent");
  const failed = parsedLogs().find((e) => e.type === "capture_failed");
  assert.ok(failed);
  assert.equal(failed.upstream_status, 422);
});

// ── J: logs never carry answer content or hash values ────────────────────────

test("capture logs never include answer content or raw hash values", async () => {
  const SECRET = "SECRET_ANSWER_CONTENT_THAT_MUST_NEVER_APPEAR_IN_LOGS_1234567890";
  const input = baseInput({ openQuestion: "Sensitive?", answer: SECRET });
  const payload = basePayload({ the_read: "read that must not leak" });
  const srcHash = expectedSourceHash("Sensitive?", SECRET);
  const outHash = expectedOutputHash(payload);
  await runCapture(input, payload, "aaaabbbbccccdddd");
  const blob = logLines.join("\n");
  assert.ok(!blob.includes(SECRET));
  assert.ok(!blob.includes("read that must not leak"));
  assert.ok(!blob.includes(srcHash));
  assert.ok(!blob.includes(outHash));
  const ok = parsedLogs().find((e) => e.type === "capture_succeeded");
  assert.ok(ok);
  assert.equal(ok.request_id_present, true);
  assert.equal(ok.reader_model_present, true);
  assert.equal(ok.prompt_version_present, true);
  assert.equal(ok.source_content_hash_present, true);
  assert.equal(ok.reader_output_hash_present, true);
});

// ── Fallback rows still carry provenance, labelled honestly ──────────────────

test("fallback captures still carry provenance and stay labelled fallback", async () => {
  const input = baseInput({ topic: "t", inspectedModel: "Gemini" });
  const payload = basePayload({ completeness: "thin", the_read: "honest fallback", source: "fallback" });
  const { fields } = await runCapture(input, payload, "ffffffffffffffff");
  assert.equal(fields.Source, "fallback");
  assert.equal(fields["Reader Model"], MODEL);
  assert.equal(fields["Reader Prompt Version"], PROMPT_VERSION);
  assert.equal(fields["Inspected AI Model"], "Gemini");
  assert.match(fields["Source Content Hash"], /^[0-9a-f]{64}$/);
  assert.match(fields["Reader Output Hash"], /^[0-9a-f]{64}$/);
});

// ── End-to-end: request body → captured provenance (agent path unchanged) ────

test("handler threads request id, topic, anchor, and inspected model into the capture", async () => {
  let airtableBody = null;
  const handler = createReadHandler({
    env: { READER_API_KEY: "test-key", READER_ENABLED: "1", AIRTABLE_TOKEN: "test-token" },
    fetch: agentFetch(null, (b) => {
      airtableBody = b;
    }),
  });
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "203.0.113.11" },
    body: {
      open_question: "What is the safety of nonstick cookware?",
      answer: LONG_ANSWER,
      case: { topic: "cookware", anchor: "PFAS" },
      inspected_model: "Claude",
      textcheck: { surfaced: false, found: [], missing: [] },
    },
  };
  const res = mockRes();
  await handler(req, res);
  assert.equal(res.out.statusCode, 200);
  assert.equal(res.out.body.source, "agent");
  assert.ok(airtableBody);
  const f = airtableBody.fields;
  assert.equal(f.Topic, "cookware");
  assert.equal(f.Anchor, "PFAS");
  assert.equal(f["Inspected AI Model"], "Claude");
  assert.equal(f["Reader Model"], MODEL);
  assert.equal(f["Reader Prompt Version"], PROMPT_VERSION);
  assert.match(f["Request ID"], /^[0-9a-f]{16}$/);
  assert.match(f["Source Content Hash"], /^[0-9a-f]{64}$/);
  assert.match(f["Reader Output Hash"], /^[0-9a-f]{64}$/);
  // the source hash equals sha256 over the exact question + answer that were read
  assert.equal(
    f["Source Content Hash"],
    expectedSourceHash("What is the safety of nonstick cookware?", LONG_ANSWER)
  );
});
