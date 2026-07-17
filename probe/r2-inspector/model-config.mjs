// probe/r2-inspector/model-config.mjs
// Sprint 3 R2 — PROBE-ONLY model configuration.
//
// This file is the "explicit server-side configuration value / probe-only path"
// required by the R2 brief. The candidate model identifier lives HERE and is used
// ONLY by the probe harness. It is deliberately NOT wired into the live Reader
// (api/read.js / api/read-paired.js), whose `const MODEL = "claude-opus-4-8"`
// stays the production default and the deployed behavior on this branch.
// Activating the candidate is a SEPARATE founder decision AFTER a probe table
// exists — see DECISION-PROPOSED.md (labeled PROPOSED / NOT ACTIVATED).

// Current production inspector model. Mirrors api/read.js + api/read-paired.js.
// If those change, this must change with them (guarded by
// test/r2-inspector-default-pin.test.mjs).
export const PRODUCTION_MODEL = "claude-opus-4-8";

// Candidate under evaluation.
//   Identifier is DOCUMENTATION-SOURCED (official Anthropic "Models overview":
//   Claude Fable 5, "Anthropic's most capable widely released model," GA on the
//   Claude API since 2026-06-09, Messages API, 1M context, adaptive thinking
//   always-on). It has NOT been API-verified on this branch — no READER_API_KEY is
//   present (see REPORT.md "Blocker"). The harness runs the REQUIRED successful API
//   capability check at run time and records the served-model provenance; until
//   that passes, this identifier is unverified and must not be treated as adopted.
export const CANDIDATE_MODEL = "claude-fable-5";

// Per-model USD/MTok rate tables, matching estimateCostUsd()'s
// { in, out, cacheWrite, cacheRead } shape (reader-security.js).
//   - claude-opus-4-8: repo-canonical rates (USD_PER_MTOK in api/read.js).
//   - claude-fable-5 : list price $10 in / $50 out (docs) — 2x Opus 4.8. Cache
//     multipliers are the standard Anthropic 5-minute ratios (write = 1.25x input,
//     read = 0.10x input) and are marked derived; confirm against the pricing page
//     before any activation.
export const MODEL_RATES = {
  "claude-opus-4-8": { in: 5, out: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-fable-5": { in: 10, out: 50, cacheWrite: 12.5, cacheRead: 1.0, derivedCacheRates: true },
};

// Inspector sampling conditions — IDENTICAL across both models. Mirrors
// api/read.js exactly: thinking adaptive, max_tokens 8192, temperature unset
// (default). Both models support adaptive thinking per the Models overview.
export const INSPECTOR_CONDITIONS = Object.freeze({
  max_tokens: 8192,
  thinking: { type: "adaptive" },
  temperature: "default (unset)",
  anthropic_version: "2023-06-01",
  endpoint: "https://api.anthropic.com/v1/messages",
});

export const MODELS_UNDER_TEST = [PRODUCTION_MODEL, CANDIDATE_MODEL];
