// Unit tests for api/inspection/[shareId].js — the GET-projection / flag-only-report endpoint.
// Run: node --test test/inspection-report.test.mjs
//
// GET  → the mode-aware public projection (never the raw answer for a P4 row).
// POST {action:"report"} → rate-limited, flag-only, and its success response MASKS
//        whether the row was already flagged (a reporter learns only "received").
//
// The endpoint reads AIRTABLE_* at call time, but the inspection-share.js it imports
// freezes TABLE at load, so env is set before the dynamic import.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { _resetMemoryStateForTests, REPORT_IP_MAX } from "../reader-security.js";

const TEST_TABLE = "tblTESTSHARES0002";
process.env.AIRTABLE_BASE = "appTESTBASE0000000";
process.env.AIRTABLE_TOKEN = "test-token";
process.env.AIRTABLE_INSPECTION_SHARES_TABLE = TEST_TABLE;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const endpoint = (await import(new URL("../api/inspection/[shareId].js", import.meta.url).href)).default;

const VALID_ID = "abc123DEF456ghi789jk";

function mockRes() {
  return {
    statusCode: 0,
    body: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
  };
}

function makeAirtable({ record = null, recordOk = true, patchOk = true } = {}) {
  const calls = [];
  const impl = async (url, init = {}) => {
    const u = String(url);
    const method = (init.method || "GET").toUpperCase();
    calls.push({ url: u, method, body: init.body ? JSON.parse(init.body) : null });
    if (method === "GET" && u.includes(TEST_TABLE)) {
      if (!recordOk) return { ok: false, status: 500, text: async () => "err" };
      return { ok: true, json: async () => ({ records: record ? [record] : [] }) };
    }
    if (method === "PATCH" && u.includes(TEST_TABLE)) {
      if (!patchOk) return { ok: false, status: 500, text: async () => "err" };
      return { ok: true, json: async () => ({ id: "recP", fields: {} }) };
    }
    throw new Error(`unexpected fetch ${method} ${u}`);
  };
  return { impl, calls };
}

async function withFetch(mock, fn) {
  const original = global.fetch;
  global.fetch = mock.impl;
  try {
    return await fn();
  } finally {
    global.fetch = original;
  }
}

const get = (shareId = VALID_ID) => ({ method: "GET", query: { shareId }, headers: { "x-forwarded-for": "203.0.113.9" }, body: null });
const report = (shareId = VALID_ID, headers = {}) => ({ method: "POST", query: { shareId }, headers: { "x-forwarded-for": "203.0.113.9", ...headers }, body: { action: "report" } });

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── gates ─────────────────────────────────────────────────────────────────────
test("unsupported method → 405", async () => {
  const res = mockRes();
  await endpoint({ method: "DELETE", query: { shareId: VALID_ID }, headers: {}, body: null }, res);
  assert.equal(res.statusCode, 405);
});

test("malformed share id → 400 without touching the store", async () => {
  const mock = makeAirtable({});
  await withFetch(mock, async () => {
    const res = mockRes();
    await endpoint(get("too-short"), res);
    assert.equal(res.statusCode, 400);
  });
  assert.equal(mock.calls.length, 0, "an invalid id never hits Airtable");
});

test("sharing unconfigured → 503", async () => {
  const saved = process.env.AIRTABLE_TOKEN;
  delete process.env.AIRTABLE_TOKEN;
  try {
    const res = mockRes();
    await endpoint(get(), res);
    assert.equal(res.statusCode, 503);
  } finally {
    process.env.AIRTABLE_TOKEN = saved;
  }
});

// ── GET projection ──────────────────────────────────────────────────────────────
test("GET hit → 200, private no-store, mode-aware projection with no raw answer", async () => {
  const mock = makeAirtable({
    record: {
      id: "recS",
      fields: { "Share ID": VALID_ID, Mode: "single", Question: "Q", "Gap Estimate": 1, "Findings JSON": "[]" },
    },
  });
  let res;
  await withFetch(mock, async () => {
    res = mockRes();
    await endpoint(get(), res);
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["cache-control"], "private, no-store");
  assert.equal(res.body.ok, true);
  assert.equal(res.body.record.mode, "single");
  assert.ok(!("answer" in res.body.record), "a P4 GET never returns the raw answer");
});

test("GET miss → 404", async () => {
  const mock = makeAirtable({ record: null });
  await withFetch(mock, async () => {
    const res = mockRes();
    await endpoint(get(), res);
    assert.equal(res.statusCode, 404);
  });
});

test("GET store error → 502", async () => {
  const mock = makeAirtable({ recordOk: false });
  await withFetch(mock, async () => {
    const res = mockRes();
    await endpoint(get(), res);
    assert.equal(res.statusCode, 502);
  });
});

// ── POST report ─────────────────────────────────────────────────────────────────
test("POST with a non-report action → 400", async () => {
  const mock = makeAirtable({});
  await withFetch(mock, async () => {
    const res = mockRes();
    await endpoint({ method: "POST", query: { shareId: VALID_ID }, headers: {}, body: { action: "delete" } }, res);
    assert.equal(res.statusCode, 400);
  });
  assert.ok(!mock.calls.some((c) => c.method === "PATCH"), "no non-report action can write");
});

test("report success masks the row's prior state (fresh vs already-flagged look identical)", async () => {
  const fresh = makeAirtable({ record: { id: "r1", fields: { "Share ID": VALID_ID } } });
  const flagged = makeAirtable({ record: { id: "r2", fields: { "Share ID": VALID_ID, "Report Flag": "reported" } } });
  let a, b;
  await withFetch(fresh, async () => { a = mockRes(); await endpoint(report(), a); });
  _resetMemoryStateForTests();
  await withFetch(flagged, async () => { b = mockRes(); await endpoint(report(), b); });
  assert.equal(a.statusCode, 200);
  assert.deepEqual(a.body, { ok: true, reported: true });
  assert.deepEqual(b.body, a.body, "an already-reported row returns the same body — the reporter cannot tell");
  assert.ok(!flagged.calls.some((c) => c.method === "PATCH"), "the already-flagged row is not re-written");
});

test("report on an unknown share → 404", async () => {
  const mock = makeAirtable({ record: null });
  await withFetch(mock, async () => {
    const res = mockRes();
    await endpoint(report(), res);
    assert.equal(res.statusCode, 404);
  });
});

test("report is rate-limited per IP → 429 once the cap is exceeded", async () => {
  const mock = makeAirtable({ record: { id: "r", fields: { "Share ID": VALID_ID } } });
  await withFetch(mock, async () => {
    for (let i = 0; i < REPORT_IP_MAX; i++) {
      const res = mockRes();
      await endpoint(report(), res);
      assert.equal(res.statusCode, 200, `report ${i + 1} within the cap`);
    }
    const blocked = mockRes();
    await endpoint(report(), blocked);
    assert.equal(blocked.statusCode, 429, "the report past the cap is throttled");
    assert.equal(blocked.body.error, "rate");
  });
});
