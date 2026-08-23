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

export const CHECK_VOCAB_VERSION = "check-vocab.v3";

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

// v3 widens `can-rely-verdict` to INTERVENING-SUBJECT forms. v2's pattern required the
// modal to sit directly against the verb — "can rely", "should rely" — so the commonest
// way anyone actually writes a reliance verdict walked straight through it: "Can I rely on
// this?", "Should I rely on this part?". The rule read as a ban on rating reliance and was
// in fact a ban on one word order.
//
// A NAMED SUBJECT LIST, not `\w+`. `(?:\s+\w+)?\s+rely` would also swallow "can safely
// rely" and "must therefore rely", which are the same verdict, but it would equally swallow
// any future adverb the rule was never ruled to cover, and the reach of the rule would stop
// being readable from the rule. The list is the whole of what intervenes; widening it is an
// edit here with a receipt, not an accident of a wildcard.
//
// LONGEST FORMS FIRST. Regex alternation is leftmost-first, so "a reader" has to precede
// any single word it starts with or the two-word form would never be reached.
//
// TWO FORMS ARE DELIBERATELY NOT ADDED, on the same boundary v2 drew around
// verdict-outcome. The governing ruling widened this rule to intervening SUBJECTS and
// enumerated two of them; that enumeration is the law it laid down, not a floor to build
// adjacent grammar on. Both open forms are recorded here so a later pass finds a decision
// rather than an oversight, and each enters as check-vocab.v4 with its own receipt.
//
//   NEGATION. "could not rely" walks through: `can(?:not)?` covers "cannot rely" and
//   nothing covers a negation following a different modal.
//   PASSIVE. "Can this be relied on?" walks through: the subject is the thing relied upon
//   rather than the person relying, so nothing in the list below stands where the list is
//   consulted, and the word on the page is `relied`, not `rely`.
export const RELIANCE_SUBJECT_FORMS = [
  "a reader",
  "the reader",
  "a user",
  "the user",
  "a person",
  "the person",
  "i",
  "we",
  "you",
  "they",
  "he",
  "she",
  "it",
  "one",
  "anyone",
  "someone",
  "everyone",
];

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
    // Same id, widened pattern, version bumped to v3 — append-only rule evolution keeps the
    // id stable so a lint result stays traceable across the change. The subject group is
    // OPTIONAL, so every v2 form ("can rely", "cannot rely", "can't rely") still matches
    // exactly as before; v3 only adds what v2 let through.
    pattern: new RegExp(
      `\\b(?:can(?:not)?|can['’]?t|could|should(?:n['’]?t)?|may|must)` +
        `(?:\\s+(?:${RELIANCE_SUBJECT_FORMS.join("|")}))?` +
        `\\s+rely\\b`,
      "i",
    ),
    reason:
      "reliance verdict (can/cannot/should rely, with or without an intervening subject) — hand over a check, do not rate reliance.",
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

// ── JURISDICTION ─────────────────────────────────────────────────────────────
// The rules above are written for surfaces that describe a change to a person WITHOUT
// speaking as the instrument. That is a property of the surface, not of the words, so
// the lane has a boundary and it is written down here rather than inferred at each
// call site.
//
// An INSPECTION surface is outside it. Input Integrity reports what a local parser
// recovered from a file's structure; "surfaced" is the accurate verb for what it did,
// and the construct-vocabulary rule is right to refuse that word on a chip and wrong
// to refuse it here. Running the lane over inspection copy produces hits that are
// evidence the lane was pointed at the wrong surface, never evidence the copy should
// borrow Reader's descriptive register. An inspection instrument must not avoid the
// accurate word to satisfy a rule written for a surface that is not an instrument.
//
// Consumers assert against this rather than carrying their own exception lists. A list
// of known exceptions decays into a list nobody can tell from a list of defects.
export const CHIP_VOCAB_SCOPE = Object.freeze({
  lane: CHIP_VOCAB_VERSION,
  governs: Object.freeze([
    "reader-chip-pair",
    "reader-chip-meaning-panel",
  ]),
  does_not_govern: Object.freeze([
    "input-integrity-surface",
  ]),
  reason:
    "The chip lane governs surfaces that describe a change without speaking as the instrument. " +
    "An inspection surface speaks as the instrument, so the construct-vocabulary and Imbas-action " +
    "rules do not apply to it.",
});

// True when the named surface is inside this lane's jurisdiction. Unknown surfaces are
// NOT governed: a lane that silently claimed every surface it had never heard of would
// be asserting jurisdiction it was never given.
export function chipVocabGoverns(surfaceId) {
  return CHIP_VOCAB_SCOPE.governs.includes(surfaceId);
}

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

// ── Span-request boundary (composed requests only) ────────────────────────────
// THE DOCTRINE SENTENCE, and the whole of what this family enforces:
//
//   GOVERNED SPAN PROMPTS MAY NOT CLAIM AUTHORSHIP OF THE REPLACEMENT ANSWER.
//
// The founder boundary is binding and verbatim: "Imbas stays on the question side of
// the line, never produces the improved answer." That governs AUTHORSHIP, not whether
// a composed message asks for one. A person selects a passage, picks a mode, and
// Imbas hands them a message to send to their OWN AI; that AI does the producing.
// Composed requests are therefore inside the line even where they are imperative.
//
// What the line forbids is a composed request written as though Imbas were doing the
// work — the answer-production imperatives. "Rewrite this passage." is one edit away
// from Imbas offering the rewrite, and this family is what makes that edit fail CI
// instead of ship.
//
// A THIRD LIST, WITH ITS OWN LINTER, AND SCOPE IS THE REASON. Three registers, three
// lists (§Check demonstration; the chip lane above; this). Two scope facts make
// sharing impossible rather than merely untidy:
//
//   - NARROWER THAN THE OTHER TWO. It applies ONLY to registered composed-request
//     text: reader-span-bank.js `instruction_text`, and anything that enters a
//     composed message. It does NOT apply to explanatory prose, code comments, module
//     docs, or UI copy outside the registered tables. This very comment says
//     "Rewrite this passage." and must not fail; the test holds a scope control that
//     proves the same verb in non-registered copy passes.
//   - IT WOULD FAIL A SHIPPED BANK. reader-second-question-bank.js instruction texts
//     legitimately contain "revise the draft" — that bank composes a second question
//     under a different ruling and is not governed here. Folding this rule into
//     BANNED_CONSTRUCTIONS would fail that bank on the day it landed.
//
// The span lane's UI copy is governed by the OTHER TWO lanes, both of them, and is
// registered there. Unregistered is not "passing"; it is unexamined.
export const SPAN_VOCAB_VERSION = "span-vocab.v1";

// The banned verbs, enumerated with their morphology rather than stemmed. A named
// list, like VERDICT_OUTCOME_WORDS: the exact reach of the rule is readable at a
// glance and narrowable in one edit, and no form is caught by accident of a suffix
// pattern nobody wrote down.
//
// WHAT IS NOT HERE IS A RULING, NOT AN OVERSIGHT. "redo" asks for substantially what
// "rewrite" asks for, and the founder-ratified bank entry D3 uses it verbatim
// ("Redo this part properly..."). The governing ruling enumerated the banned verbs
// and included D3 in the same act, so the list stops where the ruling stopped. A
// later pass that wants "redo" here is overruling an entry the founder included, not
// tidying a gap — and it enters span-vocab.v2 with its own receipt.
export const ANSWER_AUTHORSHIP_VERBS = [
  "rewrite",
  "rewrites",
  "rewriting",
  "rewritten",
  "rewrote",
  "revise",
  "revises",
  "revising",
  "revised",
  "revision",
  "revisions",
  "fix",
  "fixes",
  "fixing",
  "fixed",
  "improve",
  "improves",
  "improving",
  "improved",
  "improvement",
  "improvements",
];

export const SPAN_BANNED_CONSTRUCTIONS = [
  {
    id: "span-answer-authorship-verb",
    category: "answer_authorship",
    pattern: new RegExp(`\\b(?:${ANSWER_AUTHORSHIP_VERBS.join("|")})\\b`, "i"),
    reason:
      "answer-production imperative (rewrite / revise / fix / improve and their forms) — a governed span prompt may not claim authorship of the replacement answer; ask the person's own AI for the work instead.",
  },
  {
    id: "span-produce-replacement",
    category: "answer_authorship",
    // PHRASE forms, and the phrase is load-bearing. Bare "complete" and bare "correct"
    // are ordinary words two ratified entries already use — D2 ends "If you cannot
    // complete it, say which part and why", D3 opens "Redo this part properly:
    // complete, ...". Banning the bare words would fail the bank the ruling seeded.
    // What crosses the line is the construction that hands over a finished replacement:
    // produce THE corrected, write THE complete.
    pattern: /\b(?:produc(?:e|es|ing|ed)|writ(?:e|es|ing|ten)|generat(?:e|es|ing|ed)|deliver(?:s|ing|ed)?)\s+the\s+(?:correct|complete|final|full|fixed|improved|revised)/i,
    reason:
      "replacement-delivery construction (produce the corrected / write the complete) — a governed span prompt hands over a request, never the finished answer.",
  },
];

// Lint one composed-request string. Same shape as lintString and lintChipString.
export function lintSpanString(str) {
  const s = typeof str === "string" ? str : "";
  const hits = [];
  for (const rule of SPAN_BANNED_CONSTRUCTIONS) {
    const m = s.match(rule.pattern);
    if (m) hits.push({ id: rule.id, category: rule.category, reason: rule.reason, match: m[0] });
  }
  return hits;
}

// Lint a set of registered composed-request strings (array, or nested object/array of
// strings), mirroring the other two walkers. Only registered composed-request text is
// ever passed here; see the scope note above.
export function lintSpanStrings(input) {
  const violations = [];
  const walk = (node, path) => {
    if (typeof node === "string") {
      for (const hit of lintSpanString(node)) violations.push({ path, string: node, ...hit });
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
