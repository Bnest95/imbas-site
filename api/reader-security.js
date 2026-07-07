// Reader inference abuse controls — durable when Upstash Redis REST is configured.
//
// Env (optional but recommended for production):
//   UPSTASH_REDIS_REST_URL    — Upstash Redis REST endpoint
//   UPSTASH_REDIS_REST_TOKEN  — Upstash Redis REST token
//   KV_REST_API_URL / KV_REST_API_TOKEN — auto-detected fallback; the names the
//     Vercel Marketplace Upstash integration injects (UPSTASH_* takes priority).
//
// Without any of these, controls fall back to per-instance memory (documented as
// non-durable). READER_ENABLED remains the manual kill switch in read.js.

import { createHash } from "node:crypto";

export const RATE_BURST_MAX = 3;
export const RATE_BURST_WINDOW_SEC = 10;
export const RATE_MINUTE_MAX = 12;
export const RATE_MINUTE_WINDOW_SEC = 60;
export const RATE_DAY_MAX = 48;
export const RATE_DAY_WINDOW_SEC = 86400;

const MEMORY_WARNED = { rate: false, spend: false, shareCreate: false };

// ── Client IP (Vercel) ─────────────────────────────────────────────────────
// On Vercel serverless, the edge overwrites x-forwarded-for. The leftmost entry
// is the connecting client. We validate the token looks like an IP literal and
// ignore garbage. Off-platform, do not treat arbitrary forwarded chains as
// authoritative without a trusted proxy in front.
export function deriveClientIp(req) {
  const xff = req?.headers?.["x-forwarded-for"];
  if (typeof xff === "string" && xff.trim()) {
    const first = xff.split(",")[0].trim();
    if (isIpLiteral(first)) return first;
  }
  const realIp = req?.headers?.["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    const trimmed = realIp.trim();
    if (isIpLiteral(trimmed)) return trimmed;
  }
  return "0";
}

function isIpLiteral(value) {
  if (!value || value.length > 45) return false;
  return /^[\d.:a-fA-F]+$/.test(value);
}

export function hashClientIp(ip) {
  return createHash("sha256").update(String(ip || "0")).digest("hex").slice(0, 16);
}

// ── Structured security logs (no answer content, no secrets) ───────────────
export function logSecurityEvent(type, fields = {}) {
  const payload = {
    event: "reader_security",
    type,
    ts: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (type === "inference_failed" || type === "store_unavailable") {
    console.warn(line);
  } else if (type === "rate_limited" || type === "spend_ceiling" || type === "input_rejected") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

// ── Redis REST (no npm dependency) ─────────────────────────────────────────
// Credentials resolve from either the module's own UPSTASH_REDIS_REST_* names or
// the KV_REST_API_* names Vercel's Marketplace Upstash integration injects.
// UPSTASH_* wins when both are set, so an explicit override still works.
function redisBaseUrl(env = process.env) {
  return String(env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL || "").replace(/\/$/, "");
}
function redisToken(env = process.env) {
  return env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN || "";
}
export function redisConfigured(env = process.env) {
  return Boolean(redisBaseUrl(env) && redisToken(env));
}

async function redisFetch(command, env = process.env, signal) {
  const base = redisBaseUrl(env);
  const token = redisToken(env);
  if (!base || !token) return { ok: false, reason: "no_store" };
  const timeoutSignal = signal || AbortSignal.timeout(2000);
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      signal: timeoutSignal,
    });
    if (!res.ok) {
      return { ok: false, reason: "redis_http", status: res.status };
    }
    const data = await res.json();
    if (data && data.error) {
      return { ok: false, reason: "redis_error", detail: String(data.error).slice(0, 120) };
    }
    return { ok: true, result: data.result };
  } catch (e) {
    return {
      ok: false,
      reason: e && e.name === "AbortError" ? "redis_timeout" : "redis_unreachable",
    };
  }
}

async function redisPipeline(commands, env = process.env, signal) {
  const base = redisBaseUrl(env);
  const token = redisToken(env);
  if (!base || !token) return { ok: false, reason: "no_store" };
  const timeoutSignal = signal || AbortSignal.timeout(2000);
  try {
    // Upstash REST serves pipelines at /pipeline; the base endpoint only accepts
    // a single command, so posting an array-of-arrays there returns HTTP 400.
    const res = await fetch(`${base}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      signal: timeoutSignal,
    });
    if (!res.ok) {
      return { ok: false, reason: "redis_http", status: res.status };
    }
    const data = await res.json();
    // Upstash's /pipeline returns a top-level ARRAY — one {result}|{error}
    // object per command — not the single {result} envelope the base endpoint
    // uses. Flatten to a positional value array so callers can read result[i].
    if (!Array.isArray(data)) {
      if (data && data.error) {
        return { ok: false, reason: "redis_error", detail: String(data.error).slice(0, 120) };
      }
      return { ok: false, reason: "redis_bad_shape" };
    }
    const errored = data.find((entry) => entry && entry.error);
    if (errored) {
      return { ok: false, reason: "redis_error", detail: String(errored.error).slice(0, 120) };
    }
    return { ok: true, result: data.map((entry) => (entry ? entry.result : undefined)) };
  } catch (e) {
    return {
      ok: false,
      reason: e && e.name === "AbortError" ? "redis_timeout" : "redis_unreachable",
    };
  }
}

// Fixed window: INCR key; set EXPIRE on first hit.
async function incrWindow(key, windowSec, env, signal) {
  const pipe = await redisPipeline(
    [
      ["INCR", key],
      ["TTL", key],
    ],
    env,
    signal
  );
  if (!pipe.ok) return pipe;
  const count = Number(pipe.result?.[0]);
  const ttl = Number(pipe.result?.[1]);
  if (!Number.isFinite(count)) {
    return { ok: false, reason: "redis_bad_count" };
  }
  if (ttl === -1) {
    const exp = await redisFetch(["EXPIRE", key, String(windowSec)], env, signal);
    if (!exp.ok) return exp;
  }
  return { ok: true, count };
}

// ── In-memory fallback (per instance — not durable) ────────────────────────
const memoryHits = new Map();

function memoryIncrWindow(key, windowSec, max) {
  const now = Date.now();
  const winMs = windowSec * 1000;
  const arr = (memoryHits.get(key) || []).filter((t) => now - t < winMs);
  arr.push(now);
  memoryHits.set(key, arr);
  return { count: arr.length, blocked: arr.length > max };
}

const memorySpend = { month: "", usd: 0 };

function memorySpendState(monthKey) {
  if (memorySpend.month !== monthKey) {
    memorySpend.month = monthKey;
    memorySpend.usd = 0;
  }
  return memorySpend.usd;
}

function memoryAddSpend(monthKey, usd) {
  if (memorySpend.month !== monthKey) {
    memorySpend.month = monthKey;
    memorySpend.usd = 0;
  }
  memorySpend.usd += usd;
  return memorySpend.usd;
}

// ── Rate limits ────────────────────────────────────────────────────────────
export async function checkReaderRateLimits(ip, deps = {}) {
  const env = deps.env || process.env;
  const signal = deps.signal;
  const ipHash = hashClientIp(ip);
  const durable = redisConfigured(env);

  const tiers = [
    { tier: "burst", suffix: "b", max: RATE_BURST_MAX, windowSec: RATE_BURST_WINDOW_SEC },
    { tier: "minute", suffix: "m", max: RATE_MINUTE_MAX, windowSec: RATE_MINUTE_WINDOW_SEC },
    { tier: "day", suffix: "d", max: RATE_DAY_MAX, windowSec: RATE_DAY_WINDOW_SEC },
  ];

  if (durable) {
    for (const { tier, suffix, max, windowSec } of tiers) {
      const key = `reader:rl:${suffix}:${ipHash}`;
      const r = await incrWindow(key, windowSec, env, signal);
      if (!r.ok) {
        logSecurityEvent("store_unavailable", {
          control: "rate_limit",
          tier,
          ip_hash: ipHash,
          reason: r.reason,
          action: "fail_closed",
        });
        return { allowed: false, tier, durable: false, ipHash, storeError: true };
      }
      if (r.count > max) {
        return { allowed: false, tier, durable: true, ipHash, count: r.count };
      }
    }
    return { allowed: true, durable: true, ipHash };
  }

  if (!MEMORY_WARNED.rate) {
    MEMORY_WARNED.rate = true;
    logSecurityEvent("store_unavailable", {
      control: "rate_limit",
      reason: "no_store",
      action: "memory_fallback",
    });
  }

  for (const { tier, suffix, max, windowSec } of tiers) {
    const key = `reader:rl:${suffix}:${ipHash}`;
    const r = memoryIncrWindow(key, windowSec, max);
    if (r.blocked) {
      return { allowed: false, tier, durable: false, ipHash, count: r.count };
    }
  }
  return { allowed: true, durable: false, ipHash };
}

// ── Global spend ceiling ───────────────────────────────────────────────────
export function spendMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export async function getGlobalSpendTotal(deps = {}) {
  const env = deps.env || process.env;
  const signal = deps.signal;
  const month = spendMonthKey();
  const key = `reader:spend:${month}`;

  if (redisConfigured(env)) {
    const r = await redisFetch(["GET", key], env, signal);
    if (!r.ok) {
      return { ok: false, month, total: memorySpendState(month), durable: false, reason: r.reason };
    }
    const total = Number(r.result || 0);
    return { ok: true, month, total: Number.isFinite(total) ? total : 0, durable: true };
  }

  return { ok: true, month, total: memorySpendState(month), durable: false };
}

export async function checkGlobalSpendCeiling(ceilingUsd, deps = {}) {
  const state = await getGlobalSpendTotal(deps);
  const total = state.total || 0;
  if (state.ok && total >= ceilingUsd) {
    return {
      blocked: true,
      month: state.month,
      total,
      durable: state.durable,
      storeError: !state.ok,
    };
  }
  if (!state.ok) {
    if (!MEMORY_WARNED.spend) {
      MEMORY_WARNED.spend = true;
      logSecurityEvent("store_unavailable", {
        control: "spend_ceiling",
        reason: state.reason,
        action: "memory_fallback",
      });
    }
    const memTotal = memorySpendState(state.month);
    if (memTotal >= ceilingUsd) {
      return { blocked: true, month: state.month, total: memTotal, durable: false };
    }
    return { blocked: false, month: state.month, total: memTotal, durable: false };
  }
  return { blocked: false, month: state.month, total, durable: state.durable };
}

export async function addGlobalSpend(usd, deps = {}) {
  const env = deps.env || process.env;
  const signal = deps.signal;
  const month = spendMonthKey();
  const amount = Number(usd);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: true, month, total: 0, durable: false };

  if (redisConfigured(env)) {
    const key = `reader:spend:${month}`;
    const pipe = await redisPipeline(
      [
        ["INCRBYFLOAT", key, String(amount)],
        ["EXPIRE", key, String(35 * 86400)],
      ],
      env,
      signal
    );
    if (!pipe.ok) {
      const memTotal = memoryAddSpend(month, amount);
      logSecurityEvent("store_unavailable", {
        control: "spend_record",
        reason: pipe.reason,
        action: "memory_fallback",
      });
      return { ok: false, month, total: memTotal, durable: false };
    }
    const total = Number(pipe.result?.[0]);
    return { ok: true, month, total: Number.isFinite(total) ? total : amount, durable: true };
  }

  const memTotal = memoryAddSpend(month, amount);
  return { ok: true, month, total: memTotal, durable: false };
}

export function estimateCostUsd(usage, rates) {
  if (!usage) return 0;
  return (
    (usage.input_tokens || 0) * rates.in +
    (usage.output_tokens || 0) * rates.out +
    (usage.cache_creation_input_tokens || 0) * rates.cacheWrite +
    (usage.cache_read_input_tokens || 0) * rates.cacheRead
  ) / 1e6;
}

// ── Share creation limits ──────────────────────────────────────────────────
// Same durable KV machinery as the Reader rate limits: per-IP minute window plus
// a global per-day creation ceiling. Durable when Upstash is configured; a
// configured-store error fails closed (blocks) so an outage can't reopen the mint.
export const SHARE_CREATE_IP_MAX = 10;
export const SHARE_CREATE_IP_WINDOW_SEC = 60;
export const SHARE_CREATE_DAY_MAX_DEFAULT = 200;
const SHARE_CREATE_DAY_TTL_SEC = 2 * 86400;

export function shareCreateDayMax(env = process.env) {
  const raw = Number(env.SHARE_CREATE_DAILY_MAX);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : SHARE_CREATE_DAY_MAX_DEFAULT;
}

function shareCreateDayKey(date = new Date()) {
  return `share:create:d:${date.toISOString().slice(0, 10)}`;
}

// In-memory day counter fallback (per instance — not durable).
const memoryShareDay = { day: "", count: 0 };
function memoryShareDayGet(dayKey) {
  if (memoryShareDay.day !== dayKey) {
    memoryShareDay.day = dayKey;
    memoryShareDay.count = 0;
  }
  return memoryShareDay.count;
}
function memoryShareDayIncr(dayKey) {
  if (memoryShareDay.day !== dayKey) {
    memoryShareDay.day = dayKey;
    memoryShareDay.count = 0;
  }
  memoryShareDay.count += 1;
  return memoryShareDay.count;
}

// Pre-creation gate. The per-IP counter counts attempts (so an abuser can only lock
// themselves out); the global ceiling is read read-only here and advanced only by
// recordShareCreation on a confirmed write, so rejected requests can't burn the day's
// global budget or let anyone globally DoS the mint.
export async function checkShareCreationLimits(ip, deps = {}) {
  const env = deps.env || process.env;
  const signal = deps.signal;
  const ipHash = hashClientIp(ip);
  const durable = redisConfigured(env);
  const dayMax = shareCreateDayMax(env);
  const dayKey = shareCreateDayKey();

  if (durable) {
    const r = await incrWindow(`share:rl:m:${ipHash}`, SHARE_CREATE_IP_WINDOW_SEC, env, signal);
    if (!r.ok) {
      logSecurityEvent("store_unavailable", {
        control: "share_create_rate",
        tier: "ip_minute",
        ip_hash: ipHash,
        reason: r.reason,
        action: "fail_closed",
      });
      return { allowed: false, tier: "ip_minute", durable: false, ipHash, storeError: true };
    }
    if (r.count > SHARE_CREATE_IP_MAX) {
      return { allowed: false, tier: "ip_minute", durable: true, ipHash, count: r.count };
    }
    const g = await redisFetch(["GET", dayKey], env, signal);
    if (!g.ok) {
      logSecurityEvent("store_unavailable", {
        control: "share_create_ceiling",
        reason: g.reason,
        action: "fail_closed",
      });
      return { allowed: false, tier: "global_day", durable: false, storeError: true };
    }
    const dayTotal = Number(g.result || 0);
    if (Number.isFinite(dayTotal) && dayTotal >= dayMax) {
      return { allowed: false, tier: "global_day", durable: true, dayTotal, dayMax };
    }
    return { allowed: true, durable: true, ipHash, dayTotal: Number.isFinite(dayTotal) ? dayTotal : 0, dayMax };
  }

  if (!MEMORY_WARNED.shareCreate) {
    MEMORY_WARNED.shareCreate = true;
    logSecurityEvent("store_unavailable", {
      control: "share_create_rate",
      reason: "no_store",
      action: "memory_fallback",
    });
  }
  const memIp = memoryIncrWindow(`share:rl:m:${ipHash}`, SHARE_CREATE_IP_WINDOW_SEC, SHARE_CREATE_IP_MAX);
  if (memIp.blocked) {
    return { allowed: false, tier: "ip_minute", durable: false, ipHash, count: memIp.count };
  }
  const memDay = memoryShareDayGet(dayKey);
  if (memDay >= dayMax) {
    return { allowed: false, tier: "global_day", durable: false, dayTotal: memDay, dayMax };
  }
  return { allowed: true, durable: false, ipHash, dayTotal: memDay, dayMax };
}

// Advance the global per-day counter after a confirmed creation. Best-effort: the
// share already exists, so a store error is logged, mirrored to memory, and never
// fails the request.
export async function recordShareCreation(deps = {}) {
  const env = deps.env || process.env;
  const signal = deps.signal;
  const dayKey = shareCreateDayKey();

  if (redisConfigured(env)) {
    const pipe = await redisPipeline(
      [
        ["INCR", dayKey],
        ["EXPIRE", dayKey, String(SHARE_CREATE_DAY_TTL_SEC)],
      ],
      env,
      signal
    );
    if (!pipe.ok) {
      const memTotal = memoryShareDayIncr(dayKey);
      logSecurityEvent("store_unavailable", {
        control: "share_create_record",
        reason: pipe.reason,
        action: "memory_fallback",
      });
      return { ok: false, total: memTotal, durable: false };
    }
    const total = Number(pipe.result?.[0]);
    return { ok: true, total: Number.isFinite(total) ? total : 0, durable: true };
  }

  const memTotal = memoryShareDayIncr(dayKey);
  return { ok: true, total: memTotal, durable: false };
}

// Test-only seed for memory window counters (does not bypass production paths).
export function _seedMemoryRateCountForTests(ipHash, suffix, count) {
  const key = `reader:rl:${suffix}:${ipHash}`;
  const now = Date.now();
  memoryHits.set(
    key,
    Array.from({ length: count }, (_, i) => now - i * 1000)
  );
}

// Test-only seed for the in-memory share-creation day counter.
export function _seedShareCreateDayForTests(count) {
  const dayKey = shareCreateDayKey();
  memoryShareDay.day = dayKey;
  memoryShareDay.count = count;
}

// Test-only reset for in-memory fallback state.
export function _resetMemoryStateForTests() {
  memoryHits.clear();
  memorySpend.month = "";
  memorySpend.usd = 0;
  memoryShareDay.day = "";
  memoryShareDay.count = 0;
  MEMORY_WARNED.rate = false;
  MEMORY_WARNED.spend = false;
  MEMORY_WARNED.shareCreate = false;
}
