// Durable creation limits for /api/inspection-share — per-IP minute window and the
// global per-day creation ceiling, memory and durable (Upstash) paths.
// Run: node --test test/inspection-share-limits.test.mjs

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  checkShareCreationLimits,
  recordShareCreation,
  shareCreateDayMax,
  SHARE_CREATE_IP_MAX,
  SHARE_CREATE_DAY_MAX_DEFAULT,
  _resetMemoryStateForTests,
  _seedShareCreateDayForTests,
} from "../api/reader-security.js";

const DAY_KEY = `share:create:d:${new Date().toISOString().slice(0, 10)}`;

// A store-backed Upstash REST stub: single commands POST to the base endpoint and
// return {result}; array-of-arrays POST to /pipeline and return [{result}, …].
function makeRedisStub(store = new Map()) {
  const run = (c) => {
    const [op, key] = c;
    if (op === "INCR") {
      const n = (store.get(key) || 0) + 1;
      store.set(key, n);
      return n;
    }
    if (op === "TTL") return store.has(key) ? 30 : -1;
    if (op === "EXPIRE") return 1;
    if (op === "GET") return store.has(key) ? store.get(key) : null;
    return null;
  };
  return async (url, init) => {
    const cmd = JSON.parse(init.body);
    if (Array.isArray(cmd[0])) {
      assert.ok(String(url).endsWith("/pipeline"), "pipeline must POST to /pipeline");
      return { ok: true, json: async () => cmd.map((c) => ({ result: run(c) })) };
    }
    return { ok: true, json: async () => ({ result: run(cmd) }) };
  };
}

const REDIS_ENV = {
  UPSTASH_REDIS_REST_URL: "https://redis.example",
  UPSTASH_REDIS_REST_TOKEN: "token",
};

beforeEach(() => {
  _resetMemoryStateForTests();
});

// ── ceiling resolution ──────────────────────────────────────────────────────
test("shareCreateDayMax defaults to 200 and honors a valid override", () => {
  assert.equal(shareCreateDayMax({}), SHARE_CREATE_DAY_MAX_DEFAULT);
  assert.equal(shareCreateDayMax({}), 200);
  assert.equal(shareCreateDayMax({ SHARE_CREATE_DAILY_MAX: "50" }), 50);
});

test("shareCreateDayMax rejects garbage / non-positive overrides", () => {
  assert.equal(shareCreateDayMax({ SHARE_CREATE_DAILY_MAX: "abc" }), 200);
  assert.equal(shareCreateDayMax({ SHARE_CREATE_DAILY_MAX: "0" }), 200);
  assert.equal(shareCreateDayMax({ SHARE_CREATE_DAILY_MAX: "-5" }), 200);
});

// ── per-IP minute limit (memory) ─────────────────────────────────────────────
test("memory per-IP limit allows up to the cap then blocks", async () => {
  const ip = "203.0.113.10";
  for (let i = 0; i < SHARE_CREATE_IP_MAX; i++) {
    const r = await checkShareCreationLimits(ip, { env: {} });
    assert.equal(r.allowed, true, `creation ${i + 1} should pass`);
  }
  const blocked = await checkShareCreationLimits(ip, { env: {} });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "ip_minute");
  assert.equal(blocked.durable, false);
});

test("memory per-IP limit is scoped per IP", async () => {
  const a = "203.0.113.11";
  const b = "203.0.113.12";
  for (let i = 0; i < SHARE_CREATE_IP_MAX; i++) await checkShareCreationLimits(a, { env: {} });
  const blockedA = await checkShareCreationLimits(a, { env: {} });
  assert.equal(blockedA.allowed, false);
  const okB = await checkShareCreationLimits(b, { env: {} });
  assert.equal(okB.allowed, true, "a second IP has its own budget");
});

// ── global per-day ceiling (memory) ──────────────────────────────────────────
test("memory global ceiling blocks once the day total reaches the cap", async () => {
  _seedShareCreateDayForTests(SHARE_CREATE_DAY_MAX_DEFAULT);
  const blocked = await checkShareCreationLimits("203.0.113.20", { env: {} });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "global_day");
  assert.equal(blocked.durable, false);
  assert.equal(blocked.dayMax, 200);
});

test("memory global ceiling allows just under the cap", async () => {
  _seedShareCreateDayForTests(SHARE_CREATE_DAY_MAX_DEFAULT - 1);
  const ok = await checkShareCreationLimits("203.0.113.21", { env: {} });
  assert.equal(ok.allowed, true);
  assert.equal(ok.dayTotal, 199);
});

test("memory global ceiling honors SHARE_CREATE_DAILY_MAX override", async () => {
  const env = { SHARE_CREATE_DAILY_MAX: "2" };
  _seedShareCreateDayForTests(2);
  const blocked = await checkShareCreationLimits("203.0.113.22", { env });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "global_day");
  assert.equal(blocked.dayMax, 2);
});

test("recordShareCreation advances the day counter toward the ceiling", async () => {
  const env = { SHARE_CREATE_DAILY_MAX: "2" };
  const first = await recordShareCreation({ env });
  assert.equal(first.total, 1);
  const second = await recordShareCreation({ env });
  assert.equal(second.total, 2);
  const blocked = await checkShareCreationLimits("203.0.113.23", { env });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.tier, "global_day");
});

// ── durable path (Upstash configured) ────────────────────────────────────────
test("durable per-IP limit uses redis and blocks past the cap", async () => {
  const originalFetch = global.fetch;
  global.fetch = makeRedisStub();
  try {
    const ip = "203.0.113.30";
    for (let i = 0; i < SHARE_CREATE_IP_MAX; i++) {
      const r = await checkShareCreationLimits(ip, { env: REDIS_ENV });
      assert.equal(r.allowed, true, `creation ${i + 1} should pass`);
      assert.equal(r.durable, true);
    }
    const blocked = await checkShareCreationLimits(ip, { env: REDIS_ENV });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.tier, "ip_minute");
    assert.equal(blocked.durable, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("durable global ceiling blocks when the day key is at the cap", async () => {
  const store = new Map([[DAY_KEY, SHARE_CREATE_DAY_MAX_DEFAULT]]);
  const originalFetch = global.fetch;
  global.fetch = makeRedisStub(store);
  try {
    const blocked = await checkShareCreationLimits("203.0.113.31", { env: REDIS_ENV });
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.tier, "global_day");
    assert.equal(blocked.durable, true);
    assert.equal(blocked.dayTotal, 200);
  } finally {
    global.fetch = originalFetch;
  }
});

test("durable recordShareCreation increments the day key durably", async () => {
  const store = new Map();
  const originalFetch = global.fetch;
  global.fetch = makeRedisStub(store);
  try {
    const r = await recordShareCreation({ env: REDIS_ENV });
    assert.equal(r.ok, true);
    assert.equal(r.durable, true);
    assert.equal(r.total, 1);
    assert.equal(store.get(DAY_KEY), 1);
  } finally {
    global.fetch = originalFetch;
  }
});

// ── fail closed on a configured-store error ──────────────────────────────────
test("configured store error fails closed on the per-IP window", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 503 });
  try {
    const r = await checkShareCreationLimits("203.0.113.40", { env: REDIS_ENV });
    assert.equal(r.allowed, false);
    assert.equal(r.tier, "ip_minute");
    assert.equal(r.storeError, true);
  } finally {
    global.fetch = originalFetch;
  }
});

test("configured store error fails closed on the global ceiling read", async () => {
  const originalFetch = global.fetch;
  // Per-IP pipeline (INCR/TTL) succeeds with TTL=30 (no EXPIRE), but the single-command
  // GET for the day ceiling fails — the mint must not reopen.
  global.fetch = async (url, init) => {
    const cmd = JSON.parse(init.body);
    if (Array.isArray(cmd[0])) {
      const results = cmd.map((c) => (c[0] === "INCR" ? 1 : c[0] === "TTL" ? 30 : 1));
      return { ok: true, json: async () => results.map((r) => ({ result: r })) };
    }
    return { ok: false, status: 500 };
  };
  try {
    const r = await checkShareCreationLimits("203.0.113.41", { env: REDIS_ENV });
    assert.equal(r.allowed, false);
    assert.equal(r.tier, "global_day");
    assert.equal(r.storeError, true);
  } finally {
    global.fetch = originalFetch;
  }
});
