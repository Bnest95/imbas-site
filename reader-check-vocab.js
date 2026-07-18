// reader-check-vocab.js — versioned banned-constructions lint for the Check
// Register (Reader v3 R3, AT-5 v1 slice of the claims compiler).
//
// The Check Register speaks a strict POINTER register: it says a conclusion
// "rests on" a claim and hands over a question "worth asking" / to "check
// against" a source. It never rules a world-claim true or false, never rates
// reliance safe or unsafe, never calls a record defensible or a review
// adequate. Those are instrument-grade verdicts the Reader is not entitled to
// make (schema §Check demonstration; AT-5; AT-7 provisional invariant).
//
// This module is the v1, string-level slice of that discipline: a versioned
// list of banned constructions and a linter. Two callers:
//   - CI (test/check-vocab-lint.test.mjs) lints the feature's authored,
//     user-facing strings (CHECK_UI in reader-checks.js) and fails on any hit;
//   - the emitter (reader-checks.js) gates MODEL-GENERATED card copy at runtime
//     via hasWorldClaimVerdict — a dependency statement or verification
//     question that asserts a world-claim verdict drops the whole check
//     (silence, not degradation), keeping card copy in pointer register.
//
// Pure JS by contract, like reader-receipt.js / reader-telemetry.js: no node:
// imports, no DOM — so a Node test exercises it directly. It is a coarse
// string matcher by design; a full world-claim parser is a later compiler
// slice. Bump CHECK_VOCAB_VERSION (never edit a shipped rule id) when the list
// changes so a lint result is traceable to the rules that produced it.

export const CHECK_VOCAB_VERSION = "check-vocab.v1";

// Each rule: { id (stable, versioned), category, pattern, reason }. Word-boundary
// anchored so pointer-register copy ("worth verifying", "rests on", "check
// against", "calculation") is never tripped, while the banned verdict forms are.
export const BANNED_CONSTRUCTIONS = [
  {
    id: "world-claim-verdict",
    category: "world_claim_verdict",
    pattern: /\b(?:true|false|correct|incorrect|wrong)\b/i,
    reason:
      "world-claim verdict word (true/false/correct/incorrect/wrong) — the Reader does not rule on the world; use pointer register (worth verifying / rests on / check against).",
  },
  {
    id: "safe-to-rely",
    category: "reliance_verdict",
    pattern: /\b(?:un)?safe\s+to\s+rely\b/i,
    reason: "safe/unsafe-to-rely verdict — the Reader does not rate reliance.",
  },
  {
    id: "can-rely-verdict",
    category: "reliance_verdict",
    pattern: /\b(?:can(?:not)?|can['’]?t|could|should(?:n['’]?t)?|may|must)\s+rely\b/i,
    reason: "reliance verdict (can/cannot/should rely) — hand over a check, do not rate reliance.",
  },
  {
    id: "reliance-is-verdict",
    category: "reliance_verdict",
    pattern: /\breliance\b(?:\W+\w+){0,4}?\W+\b(?:verdict|justified|warranted|established|proven|confirmed)\b/i,
    reason: "reliance-verdict construction — the Reader opens a door, it does not close one.",
  },
  {
    id: "defensible",
    category: "defensibility",
    pattern: /\bdefensib(?:le|ility)\b/i,
    reason: "defensibility claim — a record of what was examined, never a defensibility claim.",
  },
  {
    id: "compliance-proof",
    category: "defensibility",
    pattern: /\bcompliance[-\s]?proof\b/i,
    reason: "compliance-proof claim — the Reader makes no compliance claim.",
  },
  {
    id: "adequate-review",
    category: "defensibility",
    pattern: /\badequate(?:ly)?[-\s]?review(?:ed|s)?\b/i,
    reason: "adequate-review claim — the Reader does not certify a review adequate.",
  },
];

// The rule ids that assert a world-claim verdict on the substance of an answer.
// hasWorldClaimVerdict keys on this subset so the runtime gate drops a check
// whose model-written copy rules the world true/false, without also dropping
// copy that merely mentions reliance in a non-verdict way.
const WORLD_CLAIM_RULE_IDS = new Set(["world-claim-verdict"]);

// Lint one string: return every banned construction it contains.
export function lintString(str) {
  const s = typeof str === "string" ? str : "";
  const hits = [];
  for (const rule of BANNED_CONSTRUCTIONS) {
    const m = s.match(rule.pattern);
    if (m) hits.push({ id: rule.id, category: rule.category, reason: rule.reason, match: m[0] });
  }
  return hits;
}

// Lint a set of authored user-facing strings. Accepts an array of strings, or an
// object whose values are strings/nested arrays/objects of strings (so a UI-copy
// map lints wholesale). Returns a flat violations list with a path for diagnostics.
export function lintUserFacingStrings(input) {
  const violations = [];
  const walk = (node, path) => {
    if (typeof node === "string") {
      for (const hit of lintString(node)) violations.push({ path, string: node, ...hit });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const k of Object.keys(node)) walk(node[k], path ? `${path}.${k}` : k);
    }
  };
  walk(input, "");
  return violations;
}

// Runtime gate for model-generated card copy: does the string assert a
// world-claim verdict (true/false/correct/incorrect/wrong)? Used by
// reader-checks.js to drop a check whose dependency statement or verification
// question would put a verdict on a card. Silence, not degradation.
export function hasWorldClaimVerdict(str) {
  const s = typeof str === "string" ? str : "";
  for (const rule of BANNED_CONSTRUCTIONS) {
    if (WORLD_CLAIM_RULE_IDS.has(rule.id) && rule.pattern.test(s)) return true;
  }
  return false;
}
