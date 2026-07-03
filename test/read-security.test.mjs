// Security controls for /api/read — rate limits, spend ceiling, IP derivation.
// Run: node --test test/read-security.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  deriveClientIp,
  hashClientIp,
  checkReaderRateLimits,
  checkGlobalSpendCeiling,
  addGlobalSpend,
  estimateCostUsd,
  logSecurityEvent,
  RATE_BURST_MAX,
  RATE_MINUTE_MAX,
  RATE_DAY_MAX,
  _resetMemoryStateForTests,
  _seedMemoryRateCountForTests,
} from "../api/reader-security.js";

beforeEach(() => {
  _resetMemoryStateForTests();
});

test("deriveClientIp uses leftmost x-forwarded-for on Vercel", () => {
  const req = { headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" } };
  assert.equal(deriveClientIp(req), "203.0.113.9");
});

test("deriveClientIp ignores malformed forwarded values", () => {
  const req = { headers: { "x-forwarded-for": "not-an-ip, 10.0.0.1" } };
  assert.equal(deriveClientIp(req), "0");
});

test("deriveClientIp falls back to x-real-ip", () => {
  const req = { headers: { "x-real-ip": "198.51.100.4" } };
  assert.equal(deriveClientIp(req), "198.51.100.4");
});

test("hashClientIp is stable and does not echo the raw IP", () => {
  const h = hashClientIp("203.0.113.9");
  assert.equal(h, hashClientIp("203.0.113.9"));
  assert.ok(!h.includes("203"));
  assert.equal(h.length, 16);
});

test("memory rate limit allows normal traffic under burst and minute caps", async () => {
  const ip = "203.0.113.50";
  for (let i = 0; i < RATE_BURST_MAX; i++) {
    const r = await checkReaderRateLimits(ip, { env: {} });
    assert.equal(r.allowed, true, `request ${i + 1} should pass`);
  }
});

test("memory rate limit blocks burst abuse", async () => {
  const ip = "203.0.113.51";
  for (let i = 0; i < RATE_BURST_MAX; i++) {
    await checkReaderRateLimits(ip, { env: {} });
  }
  const blocked = await checkReaderRateLimits(ip, { env: {} });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "burst");
  assert.equal(blocked.durable, false);
});

test("memory rate limit blocks rapid scripted traffic at burst tier", async () => {
  const ip = "203.0.113.52";
  for (let i = 0; i < RATE_BURST_MAX; i++) {
    const r = await checkReaderRateLimits(ip, { env: {} });
    assert.equal(r.allowed, true);
  }
  const blocked = await checkReaderRateLimits(ip, { env: {} });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "burst");
});

test("memory rate limit blocks when minute cap is exhausted", async () => {
  const ip = "203.0.113.53";
  const ipHash = hashClientIp(ip);
  _seedMemoryRateCountForTests(ipHash, "m", RATE_MINUTE_MAX);
  const blocked = await checkReaderRateLimits(ip, { env: {} });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "minute");
});

test("memory spend ceiling blocks when monthly total exceeds cap", async () => {
  const month = new Date().toISOString().slice(0, 7);
  await addGlobalSpend(8.5, { env: {} });
  const blocked = await checkGlobalSpendCeiling(8, { env: {} });
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.month, month);
  assert.equal(blocked.durable, false);
});

test("memory spend ceiling allows under cap", async () => {
  await addGlobalSpend(1.25, { env: {} });
  const ok = await checkGlobalSpendCeiling(8, { env: {} });
  assert.equal(ok.blocked, false);
  assert.ok(ok.total < 8);
});

test("durable rate limit uses redis when configured", async () => {
  const store = new Map();
  const env = {
    UPSTASH_REDIS_REST_URL: "https://redis.example",
    UPSTASH_REDIS_REST_TOKEN: "token",
  };
  const calls = [];
  const deps = {
    env,
    signal: undefined,
    fetch: async (url, init) => {
      calls.push(JSON.parse(init.body));
      const cmd = JSON.parse(init.body);
      if (Array.isArray(cmd[0])) {
        const results = cmd.map((c) => {
          const key = c[1];
          if (c[0] === "INCR") {
            const next = (store.get(key) || 0) + 1;
            store.set(key, next);
            return next;
          }
          if (c[0] === "TTL") return store.has(key) ? 30 : -1;
          if (c[0] === "EXPIRE") return 1;
          return null;
        });
        return { ok: true, json: async () => ({ result: results }) };
      }
      return { ok: true, json: async () => ({ result: null }) };
    },
  };

  // Patch fetch on global for this test via deps - need to inject fetch into reader-security
  // reader-security uses global fetch - override temporarily
  const originalFetch = global.fetch;
  global.fetch = deps.fetch;
  try {
    const ip = "203.0.113.60";
    for (let i = 0; i < RATE_BURST_MAX; i++) {
      const r = await checkReaderRateLimits(ip, { env });
      assert.equal(r.allowed, true);
      assert.equal(r.durable, true);
    }
    const blocked = await checkReaderRateLimits(ip, { env });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.tier, "burst");
    assert.equal(blocked.durable, true);
    assert.ok(calls.length >= RATE_BURST_MAX + 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("durable rate limit honors Vercel Marketplace KV_REST_API_* names", async () => {
  // Vercel's Upstash integration injects KV_REST_API_URL/TOKEN, not UPSTASH_*.
  // The security module must treat those as a durable-store fallback.
  const env = {
    KV_REST_API_URL: "https://kv.example",
    KV_REST_API_TOKEN: "kv-token",
  };
  const store = new Map();
  const originalFetch = global.fetch;
  global.fetch = async (url, init) => {
    const cmd = JSON.parse(init.body);
    if (Array.isArray(cmd[0])) {
      const results = cmd.map((c) => {
        const key = c[1];
        if (c[0] === "INCR") {
          const next = (store.get(key) || 0) + 1;
          store.set(key, next);
          return next;
        }
        if (c[0] === "TTL") return store.has(key) ? 30 : -1;
        if (c[0] === "EXPIRE") return 1;
        return null;
      });
      return { ok: true, json: async () => ({ result: results }) };
    }
    return { ok: true, json: async () => ({ result: null }) };
  };
  try {
    const r = await checkReaderRateLimits("203.0.113.70", { env });
    assert.equal(r.allowed, true);
    assert.equal(r.durable, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("configured redis failure fails closed on rate limit", async () => {
  const env = {
    UPSTASH_REDIS_REST_URL: "https://redis.example",
    UPSTASH_REDIS_REST_TOKEN: "token",
  };
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 503 });
  try {
    const r = await checkReaderRateLimits("203.0.113.61", { env });
    assert.equal(r.allowed, false);
    assert.equal(r.storeError, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("estimateCostUsd uses token buckets only", () => {
  const cost = estimateCostUsd(
    { input_tokens: 1000, output_tokens: 1000, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    { in: 5, out: 25, cacheWrite: 6.25, cacheRead: 0.5 }
  );
  assert.ok(cost > 0);
  assert.ok(cost < 0.05);
});

test("logSecurityEvent does not include answer fields", () => {
  const lines = [];
  const original = console.warn;
  console.warn = (msg) => lines.push(String(msg));
  try {
    logSecurityEvent("rate_limited", { ip_hash: "abc123", tier: "minute" });
    const parsed = JSON.parse(lines[0]);
    assert.equal(parsed.event, "reader_security");
    assert.equal(parsed.type, "rate_limited");
    assert.ok(!("answer" in parsed));
    assert.ok(!("question" in parsed));
  } finally {
    console.warn = original;
  }
});
