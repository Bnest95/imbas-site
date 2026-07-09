// Reader runtime observability — structured, privacy-preserving logs for /api/read.
// Event namespace: reader_runtime. Never log answer content, prompts, or secrets.

import { randomBytes } from "node:crypto";

export const ROUTE = "/api/read";
export const CAPTURE_TARGET = "airtable_reader_runs";

const WARN_TYPES = new Set([
  "validation_rejected",
  "security_rejected",
  "inference_failed",
  "parse_failed",
  "capture_failed",
  "fallback_returned",
]);

export function createRequestId() {
  return randomBytes(8).toString("hex");
}

export function createRuntimeContext(overrides = {}) {
  const now = Date.now();
  return {
    request_id: overrides.request_id || createRequestId(),
    route: overrides.route || ROUTE,
    started_at: now,
    marks: { start: now },
    fallback_reason: null,
    ...overrides,
  };
}

export function markPhase(ctx, name) {
  if (!ctx.marks) ctx.marks = {};
  ctx.marks[name] = Date.now();
}

export function elapsedMs(ctx, fromMark = "start", toMark) {
  const start = ctx.marks?.[fromMark] ?? ctx.started_at;
  const end = toMark ? ctx.marks?.[toMark] : Date.now();
  if (!start || !end) return undefined;
  return Math.max(0, end - start);
}

export function totalDurationMs(ctx) {
  return elapsedMs(ctx, "start");
}

export function logRuntimeEvent(type, fields = {}) {
  const payload = {
    event: "reader_runtime",
    type,
    ts: new Date().toISOString(),
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (WARN_TYPES.has(type)) {
    console.warn(line);
  } else {
    console.log(line);
  }
  return payload;
}
