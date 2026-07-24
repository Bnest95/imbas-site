// Sprint 3 R2 — production-default pin + probe safety guardrails.
//
// This branch stages a NON-PERSISTING inspector A/B probe and PREPARES (does not
// activate) a model switch. These tests are the tripwire that keeps "prepared" from
// silently becoming "activated": they pin the live production model + inspection
// method version, and they assert the probe harness cannot persist or enumerate.
//
// If you are DELIBERATELY activating the candidate (see
// probe/r2-inspector/DECISION-PROPOSED.md), update the pinned strings here on purpose —
// exactly as commit a2ffeb9 updated test/reader-provenance.test.mjs for 4.7 -> 4.8.
//
// Run: node --test test/r2-inspector-default-pin.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { READER_PROMPT_VERSION } from "../api/read.js";
import {
  PRODUCTION_MODEL,
  CANDIDATE_MODEL,
  MODELS_UNDER_TEST,
} from "../probe/r2-inspector/model-config.mjs";

const PRODUCTION_MODEL_EXPECTED = "claude-opus-4-8";
const PROMPT_VERSION_EXPECTED = "reader.v2";

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

// ── Production model default is UNCHANGED on this branch ──────────────────────
// MODEL is a non-exported const in each handler; pin the exact source line so any
// change is deliberate and shows up in review.

test("api/read.js pins the production inspector model to claude-opus-4-8", () => {
  const src = read("../api/read.js");
  assert.ok(
    src.includes(`const MODEL = "${PRODUCTION_MODEL_EXPECTED}";`),
    "api/read.js MODEL must remain claude-opus-4-8 on this branch (prepare-only; not activated)"
  );
});

test("api/read-paired.js pins the production inspector model to claude-opus-4-8", () => {
  const src = read("../api/read-paired.js");
  assert.ok(
    src.includes(`const MODEL = "${PRODUCTION_MODEL_EXPECTED}";`),
    "api/read-paired.js MODEL must remain claude-opus-4-8 on this branch (prepare-only; not activated)"
  );
});

// ── Deployed inspection method version is UNCHANGED ───────────────────────────
// The probe does not touch SYSTEM_PROMPT bytes, so the prompt version must not move.

test("deployed inspection method version (READER_PROMPT_VERSION) is unchanged", () => {
  assert.equal(READER_PROMPT_VERSION, PROMPT_VERSION_EXPECTED);
});

// ── Probe config mirrors production and keeps the candidate INACTIVE ──────────

test("probe config mirrors the production model and stages a distinct candidate", () => {
  assert.equal(PRODUCTION_MODEL, PRODUCTION_MODEL_EXPECTED, "probe PRODUCTION_MODEL must mirror the live default");
  assert.notEqual(CANDIDATE_MODEL, PRODUCTION_MODEL, "candidate must be distinct from production (not silently activated)");
  assert.deepEqual(MODELS_UNDER_TEST, [PRODUCTION_MODEL, CANDIDATE_MODEL]);
});

// ── Non-persistence guarantee (R2 brief §4) ───────────────────────────────────
// The harness must never invoke the capture/write path, and its only Airtable use
// must be read-only.

test("probe harness imports only prompt/parse/cost/config — no persistence modules", () => {
  const src = read("../probe/r2-inspector/harness.mjs");
  // Guard the actual write path: no CALL to captureRun. (Comment prose explaining
  // what the harness must never do is expected and must not trip this.)
  assert.ok(!/\bcaptureRun\s*\(/.test(src), "harness must not call captureRun (the Airtable write path)");
  // Every imported module must be in the allowlist — this is what actually keeps the
  // funnel logger, share rail, and Repository rail out of the harness.
  const allowed = new Set([
    "node:fs",
    "node:crypto",
    "node:url",
    "node:path",
    "../../api/read.js",
    "../../reader-json.js",
    "../../reader-security.js",
    "./model-config.mjs",
  ]);
  const specifiers = [...src.matchAll(/^\s*import[^"']*["']([^"']+)["']/gm)].map((m) => m[1]);
  assert.ok(specifiers.length >= 5, "expected the harness import block");
  for (const spec of specifiers) {
    assert.ok(allowed.has(spec), `unexpected import in harness (possible persistence path): ${spec}`);
  }
  // From the live handler, pull ONLY the prompt — never the capture/handler exports.
  assert.ok(
    /import\s*\{\s*SYSTEM_PROMPT\s*\}\s*from\s*["']\.\.\/\.\.\/api\/read\.js["']/.test(src),
    "harness must import only SYSTEM_PROMPT from api/read.js"
  );
});

test("probe harness uses Airtable read-only (no write, no enumeration)", () => {
  const src = read("../probe/r2-inspector/harness.mjs");
  // Every line that touches Airtable must be a GET — never a POST/PATCH/PUT/DELETE.
  for (const line of src.split("\n")) {
    if (/airtable/i.test(line)) {
      assert.ok(
        !/\b(POST|PATCH|PUT|DELETE)\b/i.test(line),
        `Airtable access must be read-only; offending line: ${line.trim()}`
      );
    }
  }
  // No list/enumerate query surface — access is strictly by record ID.
  assert.ok(!/filterByFormula/.test(src), "harness must not filter/enumerate Reader Runs");
  assert.ok(!/maxRecords/.test(src), "harness must not page/enumerate Reader Runs");
  assert.ok(/encodeURIComponent\(recordId\)/.test(src), "harness must fetch by direct record ID");
});
