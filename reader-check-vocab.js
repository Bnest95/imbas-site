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

export const CHECK_VOCAB_VERSION = "check-vocab.v2";

// v2 adds `verdict-outcome`. The five original verdict words rule on whether a
// claim is so; these rule on whether the answer came out well, which is the same
// instrument-grade judgement wearing school-report clothes. "The answer failed on
// the exemption date" is a verdict however carefully the sentence around it is
// worded, and the Reader is not entitled to make it.
//
// The word list is a named constant rather than an inline pattern so the exact
// reach of the rule is auditable at a glance and narrowable in one edit.
//
// SIX forms, by ruling, and the boundary is deliberate. A draft of this rule
// widened to nine by adding failing / failure / passing, reasoning that banning
// "failed" while permitting "failing" rebuilds one tense over the same gap that
// let "fails" ship. That reasoning was overruled on two grounds, recorded here so
// the width is not re-argued from the same premise. First, the ruling's
// enumeration was the whole of the verdict law it laid down, not a floor to build
// adjacent morphology on. Second, the width is not free: "failure" is ordinary
// technical vocabulary — "failure mode", "the named failure modes" — that governed
// copy will legitimately need, so a nine-form rule books a false-positive tax due
// later. Zero hits today measures the tax not yet come due, not its absence.
//
// If a widened form ever ships as an answer verdict, it enters check-vocab.v3 with
// its own receipt. Append-only rule evolution; the list does not pre-empt.
// test/check-vocab-lint.test.mjs holds a near-miss control per excluded form, so
// this boundary is asserted rather than merely stated.
export const VERDICT_OUTCOME_WORDS = ["fail", "fails", "failed", "pass", "passes", "passed"];

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
  {
    id: "verdict-outcome",
    // Its own category, not world_claim_verdict. The runtime gate keys on rule id
    // today, but a later change that keyed on category instead would silently drag
    // this rule into the runtime and start dropping cards. A separate category means
    // that change cannot happen by accident.
    category: "outcome_verdict",
    pattern: new RegExp(`\\b(?:${VERDICT_OUTCOME_WORDS.join("|")})\\b`, "i"),
    reason:
      "pass/fail verdict word — the Reader marks nothing as having passed or failed; it says what a " +
      "conclusion rests on and hands over a question worth asking.",
  },
];

// The rule ids that assert a world-claim verdict on the substance of an answer.
// hasWorldClaimVerdict keys on this subset so the runtime gate drops a check
// whose model-written copy rules the world true/false, without also dropping
// copy that merely mentions reliance in a non-verdict way.
//
// `verdict-outcome` is deliberately NOT here, by ruling. This gate drops
// model-generated card copy, and pass/fail are ordinary English about the world in
// a way true/incorrect are not: "the bill passed the Senate in 2019" and "the trial
// failed its primary endpoint" are facts a check may legitimately rest on. Dropping
// those cards would be the Reader omitting a real finding on a false positive —
// the behaviour class the instrument exists to measure, committed by the
// instrument. Authored copy takes the strict rule because a human can rephrase;
// model-written copy about the world does not.
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

// ── Chip lane vocabulary (user-directed follow-up copy) ───────────────────────
// The user-chip surfaces speak a DESCRIPTIVE register: a chip pair reports what
// visibly changed between two answers under an instruction the person chose. It is
// NOT the Reader's own inspection, so its copy must never (a) claim an Imbas action
// on the answer — found / detected / identified / fixed / repaired / improved /
// validated / proven — (b) borrow the instrument's construct vocabulary — gap /
// volunteer / surface / omission / deflection / framing — nor (c) assert a
// quantified (percentage) improvement.
//
// This is a SEPARATE list from BANNED_CONSTRUCTIONS above, applied through its own
// linter — NEVER through lintUserFacingStrings. The mandated chip meaning-panel
// line legitimately contains "correct" (in the disclaimer "does not establish that
// the second answer is correct, complete, or better supported"), which the
// world-claim rule bans; and the world-claim list intentionally does not know the
// construct words the chip lane must exclude. Two registers, two lists.
export const CHIP_VOCAB_VERSION = "chip-vocab.v1";

export const CHIP_BANNED_CONSTRUCTIONS = [
  {
    id: "chip-imbas-action",
    category: "imbas_action_claim",
    pattern: /\b(?:found|detected|identified|fixed|repaired|improved|improvement|validated|proven)\b/i,
    reason:
      "Imbas-action / improvement claim — a chip pair reports what visibly changed under the person's chosen instruction; it never says Imbas found, fixed, improved, validated, or proved anything.",
  },
  {
    id: "chip-construct-vocab",
    category: "construct_vocab",
    pattern: /\b(?:gap|volunteer(?:ed|s)?|surface[ds]?|surfacing|omission|deflection|framing)\b/i,
    reason:
      "instrument construct vocabulary (gap / volunteer / surface / omission / deflection / framing) — the user-chip lane is descriptive and must not borrow inspection constructs.",
  },
  {
    id: "chip-percentage-claim",
    category: "quantified_improvement",
    pattern: /\b\d+(?:\.\d+)?\s?%/,
    reason:
      "quantified (percentage) claim — the chip lane describes a visible difference, never a measured percentage improvement.",
  },
];

// Lint one string against the chip list. Same shape as lintString.
export function lintChipString(str) {
  const s = typeof str === "string" ? str : "";
  const hits = [];
  for (const rule of CHIP_BANNED_CONSTRUCTIONS) {
    const m = s.match(rule.pattern);
    if (m) hits.push({ id: rule.id, category: rule.category, reason: rule.reason, match: m[0] });
  }
  return hits;
}

// Lint a set of chip user-facing strings (array, or nested object/array of
// strings), mirroring lintUserFacingStrings but against the chip list.
export function lintChipStrings(input) {
  const violations = [];
  const walk = (node, path) => {
    if (typeof node === "string") {
      for (const hit of lintChipString(node)) violations.push({ path, string: node, ...hit });
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
