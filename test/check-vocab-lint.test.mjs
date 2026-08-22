// check-vocab-lint — AT-5 v1 slice of the claims compiler (CI, site repo).
//
// Two jobs, both pinned here:
//   1. The authored, user-facing Check Register copy (CHECK_UI in reader-checks.js)
//      contains no banned construction — pointer register only. This is the CI
//      gate: a future copy edit that smuggles a verdict word fails `npm test`.
//   2. The versioned banned-constructions list actually catches each family it
//      claims to (world-claim verdicts, reliance verdicts, defensibility claims)
//      and does NOT trip on legitimate pointer-register phrasing.
//
// Run: node --test test/check-vocab-lint.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CHECK_VOCAB_VERSION,
  BANNED_CONSTRUCTIONS,
  VERDICT_OUTCOME_WORDS,
  RELIANCE_SUBJECT_FORMS,
  lintString,
  lintUserFacingStrings,
  hasWorldClaimVerdict,
  CHIP_VOCAB_VERSION,
  CHIP_BANNED_CONSTRUCTIONS,
  lintChipString,
  lintChipStrings,
  SPAN_VOCAB_VERSION,
  SPAN_BANNED_CONSTRUCTIONS,
  ANSWER_AUTHORSHIP_VERBS,
  lintSpanString,
  lintSpanStrings,
} from "../reader-check-vocab.js";
import { CHECK_UI } from "../reader-checks.js";
import { PAIR_CAPTURE_UI, CHIP_UI, CHIP_LOOP_STATE_COPY } from "../reader-paired.js";
import { EXPLAIN_PANEL_UI } from "../reader-explain-panel.js";
import { SECOND_QUESTION_BANK } from "../reader-second-question-bank.js";
import { RECEIPT_BOUNDARY } from "../reader-receipt.js";
import { READER_SPAN_BANK, PHASE0_EXCLUDED_IDS } from "../reader-span-bank.js";
import { SPAN_REGISTERED_UI, SPAN_UI } from "../reader-span-selection.js";

// ── The list is versioned and stable ────────────────────────────────────────────

test("the vocab list is versioned", () => {
  assert.match(CHECK_VOCAB_VERSION, /^check-vocab\.v\d+$/);
  assert.ok(BANNED_CONSTRUCTIONS.length > 0);
  // Rule ids are unique (a shipped id is never reused for a different rule).
  const ids = BANNED_CONSTRUCTIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ── AT-5: the shipped user-facing copy passes the lint ──────────────────────────

test("AT-5: CHECK_UI (all shipped register/card copy) contains no banned construction", () => {
  const violations = lintUserFacingStrings(CHECK_UI);
  assert.deepEqual(violations, [], `banned constructions in CHECK_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("AT-5: PAIR_CAPTURE_UI (run-the-pair paste-back copy + unmatched warning) contains no banned construction", () => {
  const violations = lintUserFacingStrings(PAIR_CAPTURE_UI);
  assert.deepEqual(violations, [], `banned constructions in PAIR_CAPTURE_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("AT-5: EXPLAIN_PANEL_UI (Inspection Meaning panel copy table, all five states) contains no banned construction", () => {
  const violations = lintUserFacingStrings(EXPLAIN_PANEL_UI);
  assert.deepEqual(violations, [], `banned constructions in EXPLAIN_PANEL_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("AT-5: SECOND_QUESTION_BANK user-facing copy (six labels + six instruction texts) contains no banned construction", () => {
  // The chip a person taps and the instruction it sends are both displayed strings, so
  // they enter the same pointer-register lint as every other user-facing surface. Derived
  // from the bank rather than a second exported copy — the module ships exactly three
  // exports, so the user-facing strings are read off the entries here.
  const userFacing = SECOND_QUESTION_BANK.flatMap((e) => [e.approved_ui_label, e.instruction_text]);
  const violations = lintUserFacingStrings(userFacing);
  assert.deepEqual(
    violations,
    [],
    `banned constructions in SECOND_QUESTION_BANK copy:\n${JSON.stringify(violations, null, 2)}`,
  );
});

// ── AT-5: one paired fixture per banned form ────────────────────────────────────
// Every banned form gets two strings: one that must trip its own rule, and one near-miss
// in the register the Reader is allowed to speak, which must trip nothing at all. A rule
// proved only by its positive can be too broad and still look green; a rule proved only by
// its negative can be absent entirely and still look green. The pair is what closes both.
//
// The near-misses are the pointer register the copy actually uses, not invented phrases,
// so a rule that starts eating real copy is caught here rather than in review.

const PAIRED_FIXTURES = [
  // world-claim verdicts: ruling on whether a claim is so.
  ["world-claim-verdict", "true", "The stated exemption is true.", "the exemption this conclusion rests on"],
  ["world-claim-verdict", "false", "That figure is false.", "no source is given for that figure"],
  ["world-claim-verdict", "correct", "The date given is correct.", "the date is worth checking against the register"],
  ["world-claim-verdict", "incorrect", "The citation is incorrect.", "check the citation against the statute"],
  ["world-claim-verdict", "wrong", "The model got the year wrong.", "the year the conclusion depends on"],

  // reliance verdicts: rating whether the reader may lean on it.
  ["safe-to-rely", "safe to rely", "This is safe to rely on.", "this is what the conclusion rests on"],
  ["safe-to-rely", "unsafe to rely", "It is unsafe to rely on the summary.", "the summary names no source"],
  ["can-rely-verdict", "can rely", "You can rely on the exemption.", "the exemption is the claim to check"],
  ["can-rely-verdict", "cannot rely", "You cannot rely on this figure.", "no source is given for this figure"],
  ["can-rely-verdict", "can't rely", "You can't rely on the date.", "the date is worth checking"],
  ["can-rely-verdict", "could rely", "A reader could rely on that line.", "a reader can check that line"],
  ["can-rely-verdict", "should rely", "You should rely on the statute.", "the statute is the source to check against"],
  ["can-rely-verdict", "shouldn't rely", "You shouldn't rely on the summary.", "the summary omits the filing window"],
  ["can-rely-verdict", "may rely", "A reader may rely on this.", "a reader can check this against the source"],
  ["can-rely-verdict", "must rely", "You must rely on the register.", "the register is where to check"],

  // v3 (R14) — INTERVENING-SUBJECT forms. v2's pattern required the modal to sit hard
  // against the verb, so the commonest way anyone writes a reliance verdict walked
  // through it: the rule read as a ban on rating reliance and was a ban on one word
  // order. The first two are the forms the governing ruling named.
  ["can-rely-verdict", "can I rely", "Can I rely on this?", "what this conclusion rests on"],
  ["can-rely-verdict", "should I rely", "Should I rely on this part?", "this part is worth checking against the source"],
  ["can-rely-verdict", "should the reader rely", "Should the reader rely on that line?", "that line is where the conclusion rests"],
  ["can-rely-verdict", "may anyone rely", "May anyone rely on this figure?", "no source is named for this figure"],
  ["can-rely-verdict", "can we rely", "Can we rely on the summary?", "the summary is the thing to check"],
  ["reliance-is-verdict", "reliance … verdict", "Reliance verdict: open.", "what reliance would rest on is unstated"],
  ["reliance-is-verdict", "reliance … justified", "Reliance here is justified.", "reliance here would rest on one date"],
  ["reliance-is-verdict", "reliance … warranted", "Reliance on the figure is warranted.", "reliance on the figure rests on a source not named"],
  ["reliance-is-verdict", "reliance … established", "Reliance is established by the record.", "reliance rests on a record you can read"],
  ["reliance-is-verdict", "reliance … proven", "Reliance is proven.", "reliance rests on the earlier claim"],
  ["reliance-is-verdict", "reliance … confirmed", "Reliance is confirmed.", "reliance rests on what the source says"],

  // defensibility: certifying the record rather than describing it.
  ["defensible", "defensible", "This makes the record defensible.", "this is a record of what was examined"],
  ["defensible", "defensibility", "a defensibility claim about the record", "a record of what this examined"],
  ["compliance-proof", "compliance-proof", "A compliance-proof packet.", "a record for your own file"],
  ["compliance-proof", "compliance proof", "compliance proof for the auditor", "a record you can hand to a colleague"],
  ["adequate-review", "adequate review", "an adequate review of the record", "a record of what this review examined"],
  ["adequate-review", "adequately reviewed", "The record was adequately reviewed.", "the record says what was reviewed"],
  ["adequate-review", "adequate-review", "an adequate-review claim", "a claim about what was examined"],
  ["adequate-review", "adequate reviews", "two adequate reviews of the file", "two questions worth asking about the file"],

  // v2 — outcome verdicts: ruling on whether the answer came out well.
  ["verdict-outcome", "fail", "The answer will fail on the exemption date.", "the exemption date the conclusion rests on"],
  ["verdict-outcome", "fails", "The answer fails the second check.", "the second question worth asking"],
  ["verdict-outcome", "failed", "The first answer failed.", "the first answer did not name a source"],
  ["verdict-outcome", "pass", "The answer gets a pass here.", "nothing here is marked either way"],
  ["verdict-outcome", "passes", "The answer passes on completeness.", "completeness is not what this measures"],
  ["verdict-outcome", "passed", "The answer passed the check.", "the check records the marks you set"],
];

// ── AT-5 v2: the excluded verdict forms, asserted rather than assumed ────────────
// verdict-outcome bans six forms. A draft widened it to nine — failing, failure,
// passing — and was reverted: the ruling's enumeration was the whole of the verdict
// law, not a floor for adjacent morphology, and "failure" is ordinary technical
// vocabulary ("failure mode", "the named failure modes") that governed copy will
// legitimately need.
//
// These three were the widened draft's positive fixtures. Converted rather than
// deleted, they now assert the boundary from the other side: real prose carrying an
// excluded form, which must trip nothing at all. Deleting them would have left the
// boundary as an absence — nothing in the suite would notice the rule silently
// re-widening. Each is a form of the word in a use that is plainly not a verdict on
// how an answer came out.
const EXCLUDED_VERDICT_FORMS = [
  ["failing", "Failing to name a source is one of the behaviours this record measures."],
  ["failure", "The paper names the failure modes it observed across the four models."],
  ["passing", "The answer mentions the exemption in passing and moves on."],
];

test("AT-5: every banned form has a paired fixture, so no rule ships unproven", () => {
  // The clause this enforces: a rule counts toward green only once its class is paired.
  // A rule added without fixtures fails here rather than passing on an empty promise.
  const covered = new Set(PAIRED_FIXTURES.map(([id]) => id));
  for (const rule of BANNED_CONSTRUCTIONS) {
    assert.ok(covered.has(rule.id), `banned rule "${rule.id}" has no paired fixture`);
  }
  // And no fixture names a rule that does not exist.
  const known = new Set(BANNED_CONSTRUCTIONS.map((r) => r.id));
  for (const id of covered) assert.ok(known.has(id), `fixture names unknown rule "${id}"`);
});

test("AT-5: each banned form is caught by its own rule", () => {
  for (const [ruleId, form, positive] of PAIRED_FIXTURES) {
    const hits = lintString(positive);
    assert.ok(
      hits.some((h) => h.id === ruleId),
      `"${form}" did not trip ${ruleId}: ${JSON.stringify(positive)} → ${JSON.stringify(hits.map((h) => h.id))}`,
    );
  }
});

test("AT-5: each banned form's near-miss control trips nothing", () => {
  for (const [ruleId, form, , control] of PAIRED_FIXTURES) {
    assert.deepEqual(
      lintString(control),
      [],
      `the control for ${ruleId}/"${form}" tripped a rule — the lint is eating legitimate copy: ${JSON.stringify(control)}`,
    );
  }
});

// Two tests, not one, so a mutation is attributable. The word list and the excluded
// forms in use are separate claims: a rule can carry the right array and the wrong
// reach. Folded together, a widening mutation would die on the array shape and never
// reach the prose, and the fixture would be proved by nothing.

test("AT-5 v2: verdict-outcome's word list is exactly the six ruled forms", () => {
  // A widened list fails here and has to come back through check-vocab.v3 with its own
  // receipt, which is what append-only rule evolution means in practice.
  assert.deepEqual(VERDICT_OUTCOME_WORDS, ["fail", "fails", "failed", "pass", "passes", "passed"]);
});

test("AT-5 v2: the excluded verdict forms trip nothing in real prose", () => {
  // The forms are excluded in use, not just absent from an array. Each of these
  // sentences would trip a nine-form rule; under the six it must trip nothing.
  for (const [form, control] of EXCLUDED_VERDICT_FORMS) {
    assert.deepEqual(
      lintString(control),
      [],
      `"${form}" tripped a rule — verdict-outcome has re-widened past the six ruled forms: ${JSON.stringify(control)}`,
    );
  }
});

// ── AT-5 v3 (R14): the reliance rule's intervening subjects, and where it stops ───
// Same two-test split as verdict-outcome, and for the same reason: the subject list
// and the reach it buys are separate claims, and a mutation that survives one must
// still die on the other.

test("AT-5 v3: can-rely-verdict's intervening-subject list is a named enumeration, not a wildcard", () => {
  // A `(?:\s+\w+)?` would have caught more forms and made the rule's reach unreadable
  // from the rule. This asserts the list is finite, literal, and longest-first — the
  // last part matters because regex alternation is leftmost-first, so a two-word form
  // placed after a single word it starts with would never be reached.
  assert.ok(RELIANCE_SUBJECT_FORMS.length > 0);
  for (const f of RELIANCE_SUBJECT_FORMS) assert.match(f, /^[a-z]+(?: [a-z]+)?$/);
  const multiWord = RELIANCE_SUBJECT_FORMS.filter((f) => f.includes(" "));
  const lastMulti = RELIANCE_SUBJECT_FORMS.lastIndexOf(multiWord[multiWord.length - 1]);
  const firstSingle = RELIANCE_SUBJECT_FORMS.findIndex((f) => !f.includes(" "));
  assert.ok(lastMulti < firstSingle, "multi-word subject forms must precede single words in the alternation");

  // Every v2 form still trips, because the subject group is optional. v3 only adds.
  for (const s of ["You can rely on it.", "You cannot rely on it.", "You can’t rely on it.", "You must rely on it."]) {
    assert.ok(lintString(s).some((h) => h.id === "can-rely-verdict"), `v2 form regressed: ${JSON.stringify(s)}`);
  }
});

test("AT-5 v3: the reliance rule's documented reach stops where it stops, recorded not endorsed", () => {
  // Two forms ARE reliance verdicts and this rule still does not catch either.
  //
  //   NEGATION. "could not rely" — `can(?:not)?` covers "cannot rely" and nothing covers
  //   a negation after a different modal.
  //   PASSIVE. "Can this be relied on?" — the subject is the thing relied upon rather
  //   than the person relying, and the word on the page is `relied`, not `rely`.
  //
  // The governing ruling widened this rule to intervening SUBJECTS and named two forms;
  // that enumeration is the law it laid down, not a floor for adjacent grammar.
  //
  // Asserted from the other side, like the percentage rule's edges: if one of these
  // starts tripping, the rule has widened past its ruling and the record needs a
  // receipt. Reported, not fixed — a rule change carries its own version bump.
  for (const s of [
    "A reader could not rely on that line.",
    "You should never rely on the summary.",
    "Can this be relied on?",
    "Should that figure be relied upon?",
  ]) {
    assert.deepEqual(
      lintString(s).filter((h) => h.id === "can-rely-verdict"),
      [],
      `${JSON.stringify(s)} now trips can-rely-verdict; its documented reach has changed and needs a receipt`,
    );
  }

  // And the widening did not start eating ordinary copy that merely carries a modal.
  for (const s of [SPAN_UI.copy_failed, "Can I check this against the source?", "You should ask what it rests on."]) {
    assert.deepEqual(lintString(s), [], `the widened rule is eating legitimate copy: ${JSON.stringify(s)}`);
  }
});

// ── AT-5: pointer register is NOT tripped (no false positives) ───────────────────

test("AT-5: legitimate pointer-register phrasing passes clean", () => {
  const pointerCopy = [
    "worth verifying against the source",
    "this conclusion rests on the earlier claim",
    "check against an authority",
    "a question worth asking",
    "re-run the calculation",
    "how they connect",
    CHECK_UI.register_note,
    CHECK_UI.provisional_label,
  ];
  for (const s of pointerCopy) {
    assert.deepEqual(lintString(s), [], `pointer-register copy tripped a rule: "${s}"`);
  }
});

// ── The v2 rule stays out of the runtime ────────────────────────────────────────

test("AT-5 v2: verdict-outcome is a CI rule and never a runtime drop", () => {
  // By ruling. This gate drops model-generated card copy, and pass/fail are ordinary
  // English about the world: a check may legitimately rest on "the bill passed the Senate".
  // Dropping that card would be the Reader omitting a real finding on a false positive.
  assert.ok(lintString("The bill passed the Senate in 2019.").some((h) => h.id === "verdict-outcome"));
  assert.equal(hasWorldClaimVerdict("The bill passed the Senate in 2019."), false);
  assert.equal(hasWorldClaimVerdict("The trial failed its primary endpoint."), false);
  // The world-claim gate is unchanged by v2.
  assert.equal(hasWorldClaimVerdict("This shows the claim is false."), true);

  // Keyed on rule id, and the rule carries its own category so a later change that keyed
  // on category instead cannot drag it into the runtime by accident.
  const rule = BANNED_CONSTRUCTIONS.find((r) => r.id === "verdict-outcome");
  assert.equal(rule.category, "outcome_verdict");
  assert.equal(
    BANNED_CONSTRUCTIONS.filter((r) => r.category === "outcome_verdict").length,
    1,
    "another rule joined outcome_verdict; the runtime-gate isolation argument needs re-checking",
  );
});

// ── The runtime gate keys only on world-claim verdicts ──────────────────────────

test("hasWorldClaimVerdict trips on verdict words but not on reliance/defensibility mentions", () => {
  assert.equal(hasWorldClaimVerdict("This shows the claim is false."), true);
  assert.equal(hasWorldClaimVerdict("Is the stated figure correct?"), true);
  // The runtime gate is world-claim-only: a bare reliance/defensibility mention is
  // handled by the CI lint over authored copy, not by the per-check runtime drop.
  assert.equal(hasWorldClaimVerdict("The exemption rests on the 2019 date."), false);
  assert.equal(hasWorldClaimVerdict("What source establishes the premise?"), false);
});

// ── Chip lane vocabulary (user-directed follow-up copy) ──────────────────────────
// A SEPARATE register from the Check copy above, with its own list and linter. A chip
// pair reports what visibly changed under an instruction the person chose; its copy
// legitimately says "correct" / "complete" / "better" (in the standing disclaimer) and
// "verified" (in the not-verified caption) — words the world-claim list bans — so the
// chip surfaces are linted through lintChipStrings, NEVER lintUserFacingStrings. In
// return the chip list bans what this descriptive lane must never borrow: Imbas-action /
// improvement claims, the instrument's construct vocabulary, and quantified improvement.

test("the chip vocab list is versioned with unique rule ids", () => {
  assert.match(CHIP_VOCAB_VERSION, /^chip-vocab\.v\d+$/);
  assert.ok(CHIP_BANNED_CONSTRUCTIONS.length > 0);
  const ids = CHIP_BANNED_CONSTRUCTIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("chip lint: CHIP_UI (every authored chip string) contains no banned construction", () => {
  const violations = lintChipStrings(CHIP_UI);
  assert.deepEqual(violations, [], `banned chip constructions in CHIP_UI:\n${JSON.stringify(violations, null, 2)}`);
});

test("chip lint: CHIP_LOOP_STATE_COPY (the three loop-state headlines/notes/chips) contains no banned construction", () => {
  const violations = lintChipStrings(CHIP_LOOP_STATE_COPY);
  assert.deepEqual(
    violations,
    [],
    `banned chip constructions in CHIP_LOOP_STATE_COPY:\n${JSON.stringify(violations, null, 2)}`,
  );
});

// ── Chip register: every accepted form, paired, and the enumeration itself proved ──
// The chip rules previously had three loose family tests that walked a hand-typed word
// list. That list was a shorter list than the patterns: it named volunteer / volunteered
// but not volunteers, surface / surfaced but not surfaces or surfacing. Three accepted
// forms were therefore banned in production and proved by nothing — the same defect
// shape as the verdict rule whose list said "fail" while its pattern caught "fails".
//
// The cure is the AT-5 pairing above, applied to the chip register: the accepted forms
// are DERIVED from the shipped patterns rather than retyped, then each gets a positive
// and a near-miss control. Deriving is the part that makes it stay true — a pattern that
// grows a form fails the enumeration test until the form is paired.
//
// Proof only. No chip pattern, rule, runtime semantic, or shipped string changes here.

// Expand a word-list pattern into the exact set of literal forms it accepts. It models
// only the constructs the shipped chip word-list rules actually use — a `\b(?:…)\b`
// shell, `|` alternation, an optional `(?:x|y)?` group, an optional `[xy]?` class — and
// THROWS on anything else. Throwing is the point: a best-effort expander that skipped
// what it did not understand would under-report silently, which is the failure this
// whole section exists to close.
function expandWordListPattern(source) {
  const shell = /^\\b\(\?:(.+)\)\\b$/.exec(source);
  if (!shell) throw new Error(`not a \\b(?:…)\\b word-list pattern: ${source}`);

  const splitTopLevel = (s) => {
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let i = 0; i < s.length; i += 1) {
      const c = s[i];
      if (c === "(" || c === "[") depth += 1;
      else if (c === ")" || c === "]") depth -= 1;
      else if (c === "|" && depth === 0) {
        parts.push(s.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(s.slice(start));
    return parts;
  };

  const expandAlternative = (alt) => {
    let out = [""];
    let i = 0;
    while (i < alt.length) {
      const ch = alt[i];
      if (/[a-z]/.test(ch)) {
        out = out.map((s) => s + ch);
        i += 1;
      } else if (alt.startsWith("(?:", i)) {
        let depth = 0;
        let close = -1;
        for (let j = i; j < alt.length; j += 1) {
          if (alt[j] === "(") depth += 1;
          else if (alt[j] === ")") {
            depth -= 1;
            if (depth === 0) {
              close = j;
              break;
            }
          }
        }
        if (close < 0 || alt[close + 1] !== "?") {
          throw new Error(`expander models only optional (?:…)? groups, at ${i} in ${alt}`);
        }
        const opts = ["", ...splitTopLevel(alt.slice(i + 3, close))];
        for (const o of opts) if (o && !/^[a-z]+$/.test(o)) throw new Error(`non-literal group option "${o}" in ${alt}`);
        out = out.flatMap((s) => opts.map((o) => s + o));
        i = close + 2;
      } else if (ch === "[") {
        const close = alt.indexOf("]", i);
        if (close < 0 || alt[close + 1] !== "?") {
          throw new Error(`expander models only optional […]? classes, at ${i} in ${alt}`);
        }
        const chars = alt.slice(i + 1, close);
        if (!/^[a-z]+$/.test(chars)) throw new Error(`non-literal class "${chars}" in ${alt}`);
        out = out.flatMap((s) => ["", ...chars].map((c) => s + c));
        i = close + 2;
      } else {
        throw new Error(`expander does not model ${JSON.stringify(ch)} in ${JSON.stringify(alt)}`);
      }
    }
    return out;
  };

  return [...new Set(splitTopLevel(shell[1]).flatMap(expandAlternative))].sort();
}

// What the shipped patterns accept, written out. The test below proves this equals what
// the expander reads off the patterns, so the two can never drift apart in silence.
const CHIP_ACCEPTED_FORMS = {
  "chip-imbas-action": [
    "detected", "fixed", "found", "identified", "improved", "improvement", "proven", "repaired", "validated",
  ],
  "chip-construct-vocab": [
    "deflection", "framing", "gap", "omission", "surface", "surfaced", "surfaces", "surfacing",
    "volunteer", "volunteered", "volunteers",
  ],
};

// chip-percentage-claim is a SHAPE rule, not a word list — it matches a number-and-percent
// construction, so no finite word enumeration describes it. Its accepted shapes are
// enumerated separately below.
const CHIP_SHAPE_RULE_ID = "chip-percentage-claim";

test("chip lint: the enumerated accepted forms are exactly what the shipped patterns accept", () => {
  // Derived, not retyped. This is the assertion that keeps the pairing honest: add a form
  // to a shipped pattern and this fails until the form is enumerated and paired.
  for (const rule of CHIP_BANNED_CONSTRUCTIONS) {
    if (rule.id === CHIP_SHAPE_RULE_ID) continue;
    assert.deepEqual(
      expandWordListPattern(rule.pattern.source),
      CHIP_ACCEPTED_FORMS[rule.id],
      `${rule.id}: the pattern accepts a different set of forms than the enumeration names`,
    );
  }
  // Every word-list rule is enumerated, and the shape rule is genuinely not a word list —
  // proved by the expander refusing it, not by a comment claiming it.
  const wordListIds = CHIP_BANNED_CONSTRUCTIONS.filter((r) => r.id !== CHIP_SHAPE_RULE_ID).map((r) => r.id);
  assert.deepEqual(Object.keys(CHIP_ACCEPTED_FORMS).sort(), [...wordListIds].sort());
  const shapeRule = CHIP_BANNED_CONSTRUCTIONS.find((r) => r.id === CHIP_SHAPE_RULE_ID);
  assert.throws(() => expandWordListPattern(shapeRule.pattern.source));
});

// One pair per accepted form: [ruleId, form, positive, near-miss control].
//
// The controls are the descriptive register the chip lane is FOR — what visibly changed
// between two answers under an instruction the person chose — saying the thing the banned
// form would have said, legitimately. That is the near-miss that matters here: not a
// lexical neighbour, but the sentence a writer reaches for instead, which must survive.
const CHIP_PAIRED_FIXTURES = [
  // Imbas-action / improvement claims.
  ["chip-imbas-action", "found", "Imbas found the missing date.", "The second answer names the exemption date."],
  ["chip-imbas-action", "detected", "Imbas detected a difference.", "The second answer names a filing window the first does not."],
  ["chip-imbas-action", "identified", "Imbas identified the statute.", "The second answer names the statute by number."],
  ["chip-imbas-action", "fixed", "The follow-up fixed the answer.", "The second answer states the date the first left out."],
  ["chip-imbas-action", "repaired", "This repaired the first answer.", "The second answer restates the same claim with a date attached."],
  ["chip-imbas-action", "improved", "The second answer improved on the first.", "The second answer is longer and names two more studies."],
  ["chip-imbas-action", "improvement", "a clear improvement over the first answer", "a difference you can read for yourself"],
  ["chip-imbas-action", "validated", "Imbas validated the second answer.", "You can read both answers side by side and judge for yourself."],
  ["chip-imbas-action", "proven", "This is proven by the pair.", "This shows what changed under the instruction you chose, nothing more."],

  // Borrowed instrument construct vocabulary.
  ["chip-construct-vocab", "gap", "This shows a gap in the answer.", "This shows something the first answer did not say."],
  ["chip-construct-vocab", "volunteer", "The model did not volunteer it.", "The second answer includes it without the instruction naming it."],
  ["chip-construct-vocab", "volunteered", "The second answer volunteered the date.", "The second answer included the date without being asked for it."],
  ["chip-construct-vocab", "volunteers", "The model volunteers the caveat.", "The second answer carries a caveat the first does not."],
  ["chip-construct-vocab", "surface", "This will surface the omitted study.", "The second answer states the study by name."],
  ["chip-construct-vocab", "surfaced", "The instruction surfaced two studies.", "The second answer states two studies the first leaves out."],
  ["chip-construct-vocab", "surfaces", "The second answer surfaces the caveat.", "The second answer states the caveat in its opening line."],
  ["chip-construct-vocab", "surfacing", "surfacing what the first answer left out", "stating what the first answer leaves out"],
  ["chip-construct-vocab", "omission", "an omission in the first answer", "something the first answer does not say"],
  ["chip-construct-vocab", "deflection", "a deflection in the first answer", "the first answer answers a different question"],
  ["chip-construct-vocab", "framing", "a framing difference between the two", "the two answers put the same claim in different words"],
];

test("chip lint: every accepted form has a paired fixture, so no chip form ships unproven", () => {
  const paired = new Set(CHIP_PAIRED_FIXTURES.map(([id, form]) => `${id}/${form}`));
  for (const [ruleId, forms] of Object.entries(CHIP_ACCEPTED_FORMS)) {
    for (const form of forms) {
      assert.ok(paired.has(`${ruleId}/${form}`), `chip form ${ruleId}/"${form}" is banned but has no paired fixture`);
    }
  }
  // And no fixture names a form the pattern does not actually accept.
  for (const [ruleId, form] of CHIP_PAIRED_FIXTURES) {
    assert.ok(CHIP_ACCEPTED_FORMS[ruleId]?.includes(form), `fixture names unaccepted form ${ruleId}/"${form}"`);
  }
});

test("chip lint: each accepted form is caught by its own rule", () => {
  for (const [ruleId, form, positive] of CHIP_PAIRED_FIXTURES) {
    const hits = lintChipString(positive);
    assert.ok(
      hits.some((h) => h.id === ruleId),
      `"${form}" did not trip ${ruleId}: ${JSON.stringify(positive)} → ${JSON.stringify(hits.map((h) => h.id))}`,
    );
  }
});

test("chip lint: each accepted form's near-miss control trips nothing", () => {
  for (const [ruleId, form, , control] of CHIP_PAIRED_FIXTURES) {
    assert.deepEqual(
      lintChipString(control),
      [],
      `the control for ${ruleId}/"${form}" tripped a chip rule — the lint is eating the descriptive register it exists to protect: ${JSON.stringify(control)}`,
    );
  }
});

test("chip lint: the percentage rule's accepted shapes, and the edges it stops at", () => {
  // Four accepted shapes: integer or decimal, with or without a single space before the
  // sign. Enumerated as shapes because the rule is a construction, not a vocabulary.
  for (const s of ["40% more complete", "40 % more complete", "a 12.5% change", "a 12.5 % change"]) {
    assert.ok(lintChipString(s).some((h) => h.id === CHIP_SHAPE_RULE_ID), `expected "${s}" to trip the percentage rule`);
  }
  // And where it stops. These are recorded as the rule's actual reach, not endorsed: each
  // is a quantified claim the pattern does not catch. Reported, not fixed — changing the
  // pattern is a rule change, and rule changes carry their own version bump and receipt.
  for (const s of ["a 40  % change", "a 40 percent change", "%40 more complete"]) {
    assert.deepEqual(
      lintChipString(s).filter((h) => h.id === CHIP_SHAPE_RULE_ID),
      [],
      `"${s}" now trips the percentage rule; its documented reach has changed and the report needs updating`,
    );
  }
});

test("chip lint leaves the chip lane's legitimate register untouched", () => {
  // The words the chip lane is allowed to use — the world-claim list is not the authority
  // here. "correct" / "complete" / "better" ride in the standing disclaimer; "verified"
  // rides in the not-verified caption. None of these may trip a CHIP rule.
  const chipCopy = [
    CHIP_UI.meaning_panel_line,
    CHIP_UI.side_by_side.second_answer_caption,
    "the second answer is correct, complete, or better supported",
    "Not verified by Imbas.",
  ];
  for (const s of chipCopy) {
    assert.deepEqual(lintChipString(s), [], `chip-register copy tripped a chip rule: "${s}"`);
  }
});

test("the locked Reader boundary sentence is registered on the chip surface (clears BOTH lists)", () => {
  // Correction: ChipDeltaView now carries RECEIPT_BOUNDARY verbatim beside the chip
  // attribution line, so a string authored for the inspection lane newly renders on a
  // chip surface. Any string on a chip surface must pass the chip lint — it borrows
  // none of the chip lane's banned constructions (no Imbas-action / improvement claim,
  // no borrowed construct vocabulary, no percentage). It also clears the world-claim
  // list, exactly as on every inspection surface, so the one sentence renders
  // identically on both lanes with zero drift.
  assert.deepEqual(lintChipString(RECEIPT_BOUNDARY), []);
  assert.deepEqual(lintString(RECEIPT_BOUNDARY), []);
});

test("the two registers are genuinely separate: the chip meaning line clears the chip list but trips the world-claim list", () => {
  // The whole reason two lists exist. The mandated chip disclaimer contains "correct" (a
  // world-claim verdict word), so it clears lintChipString but WOULD fail the world-claim
  // lint — proving the chip surfaces must never be routed through lintUserFacingStrings.
  assert.deepEqual(lintChipString(CHIP_UI.meaning_panel_line), []);
  assert.ok(lintUserFacingStrings([CHIP_UI.meaning_panel_line]).some((v) => v.id === "world-claim-verdict"));
});

// ── Span-directed prompt composition: registration under BOTH governing lanes ─────
// Every string this slice ships is registered here. Registration is not optional and
// unregistered is not "passing" — it is unexamined. The span lane's UI copy and its
// composed requests are governed by BOTH lists above, world-claim and chip, because
// the surface renders inside the inspection panel and speaks about a person's own
// selection: neither register's discipline is waived by the other applying.

// Every user-facing string in the slice, with the path that names it, so a failure
// says which string rather than which index. Kept as a table rather than derived from
// one export so the affordance labels, the attribution line and the narrowing line are
// each visibly present in the registration — the four the ruling enumerated.
const SPAN_REGISTERED_STRINGS = {
  problem_affordance: SPAN_UI.problem_affordance,
  desired_affordance: SPAN_UI.desired_affordance,
  attribution: SPAN_UI.attribution,
  narrowing_template: SPAN_UI.narrowing_template,
  copied_affordance: SPAN_UI.copied_affordance,
  copy_failed: SPAN_UI.copy_failed,
  bank_instruction_texts: READER_SPAN_BANK.map((e) => e.instruction_text),
};

test("span lane: the four enumerated strings are the founder's phrasing and carry no banned word", () => {
  // The two labels are the founder's own phrasing family, pre-cleared. Asserted
  // literally so a later "smoothing" edit into button-ese fails here rather than
  // shipping — his words govern copy.
  assert.equal(SPAN_UI.problem_affordance, "Click the problem");
  assert.equal(SPAN_UI.desired_affordance, "Click what you want");

  // "wrong" never appears in span UI copy. It is a world-claim verdict word, and the
  // natural label for the first mode ("Click the part that is wrong") is exactly the
  // string it would have been. This asserts the absence rather than trusting it.
  for (const s of SPAN_REGISTERED_UI) assert.doesNotMatch(s, /\bwrong\b/i);

  // The attribution is ONE line: what the person did, then the boundary. Two sentences
  // and no more — a block or a panel here would make the disclaimer louder than the
  // two words a person came to click.
  assert.equal(SPAN_UI.attribution, "You selected this passage. Imbas did not mark it.");
  assert.equal(SPAN_UI.attribution.split(". ").length, 2);

  // The narrowing state is ONE template with the live count set into it, never a
  // parallel sentence per count, so the number a person reads and the number the code
  // resolved cannot drift apart.
  assert.match(SPAN_UI.narrowing_template, /\{n\}/);
});

test("span lane: every shipped string clears the world-claim list", () => {
  const violations = lintUserFacingStrings(SPAN_REGISTERED_STRINGS);
  assert.deepEqual(
    violations,
    [],
    `banned constructions in span-lane copy:\n${JSON.stringify(violations, null, 2)}`,
  );
});

test("span lane: every shipped string clears the chip list", () => {
  const violations = lintChipStrings(SPAN_REGISTERED_STRINGS);
  assert.deepEqual(
    violations,
    [],
    `banned chip constructions in span-lane copy:\n${JSON.stringify(violations, null, 2)}`,
  );
});

test("span lane: the rendered narrowing line is linted, not just its template", () => {
  // A template that lints clean and renders dirty is a template that was never linted.
  // SPAN_REGISTERED_UI carries the template WITH a live value set in for this reason.
  const rendered = SPAN_REGISTERED_UI.filter((s) => /touches \d+ findings/.test(s));
  assert.ok(rendered.length >= 2, "the registered UI must carry rendered narrowing lines, not only the template");
  for (const s of rendered) {
    assert.deepEqual(lintString(s), []);
    assert.deepEqual(lintChipString(s), []);
  }
});

test("span lane: approved_ui_label is null on every entry, and absence is recorded not treated as clean", () => {
  // The Phase 0 return supplied no per-entry UI label and no founder ruling approved
  // one. A label invented here would be an unapproved string wearing the word
  // "approved". The walkers skip nulls, so this test is what stops absence from
  // reading as a pass: if a label ever lands, it must land with a ruling and it will
  // be linted by the two tests above the moment it is a string.
  for (const e of READER_SPAN_BANK) {
    assert.equal(e.approved_ui_label, null, `${e.id} grew a UI label with no approving ruling`);
  }
});

test("span lane: the excluded Phase 0 ids are recorded and their texts are absent", () => {
  // The founder ruling kept three candidates out. Their ids are recorded so a later
  // pass cannot re-derive them by accident and think it found something new; their
  // texts are deliberately not in the module, so it cannot become a back door to the
  // strings the ruling excluded.
  assert.deepEqual([...PHASE0_EXCLUDED_IDS].sort(), ["D5", "P7", "P8"]);
  const shipped = new Set(READER_SPAN_BANK.map((e) => e.id));
  for (const id of PHASE0_EXCLUDED_IDS) assert.ok(!shipped.has(id), `excluded candidate ${id} is in the bank`);
  assert.equal(READER_SPAN_BANK.length, 11);
});

// ── The span boundary rule family (composed requests only) ───────────────────────
//
//   GOVERNED SPAN PROMPTS MAY NOT CLAIM AUTHORSHIP OF THE REPLACEMENT ANSWER.
//
// The founder boundary is binding and verbatim: "Imbas stays on the question side of
// the line, never produces the improved answer." It governs AUTHORSHIP, not whether a
// composed message asks for one — the person's own AI does the producing, so an
// imperative request is inside the line. What the line forbids is a composed request
// written as though Imbas were doing the work.
//
// A THIRD LIST, and scope is the reason it cannot be folded into either other one.
// It is narrower than both: it governs registered composed-request text only, never
// explanatory prose or UI copy. Two tests below prove that boundary from both sides.

test("span boundary: the rule family is versioned with unique rule ids", () => {
  assert.match(SPAN_VOCAB_VERSION, /^span-vocab\.v\d+$/);
  assert.ok(SPAN_BANNED_CONSTRUCTIONS.length > 0);
  const ids = SPAN_BANNED_CONSTRUCTIONS.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  // One family, one category — this is a boundary family, not a grab bag.
  for (const r of SPAN_BANNED_CONSTRUCTIONS) assert.equal(r.category, "answer_authorship");
});

test("span boundary: the enumerated verbs are exactly what the shipped pattern accepts", () => {
  // Derived from the pattern, not retyped — the same discipline the chip lane uses.
  // Add a verb to the shipped pattern and this fails until the verb is enumerated and
  // paired below.
  const rule = SPAN_BANNED_CONSTRUCTIONS.find((r) => r.id === "span-answer-authorship-verb");
  assert.deepEqual(expandWordListPattern(rule.pattern.source), [...ANSWER_AUTHORSHIP_VERBS].sort());
});

// [ruleId, form, positive that must fail, near-miss control that must pass].
// The controls are the register the span lane is FOR: a request that asks the person's
// own AI to do the work, which must survive.
const SPAN_PAIRED_FIXTURES = [
  // The paired failing fixture the ruling named, first.
  ["span-answer-authorship-verb", "rewrite", "Rewrite this passage.", "Redo this part properly."],
  ["span-answer-authorship-verb", "rewrites", "Imbas rewrites the passage for you.", "Your AI does the work; Imbas hands over the request."],
  ["span-answer-authorship-verb", "rewriting", "Rewriting this passage now.", "Changing only this part now."],
  ["span-answer-authorship-verb", "rewritten", "Here is the rewritten passage.", "Here is the request to send."],
  ["span-answer-authorship-verb", "rewrote", "We rewrote the passage.", "We composed the request."],
  ["span-answer-authorship-verb", "revise", "Revise this section.", "Change only this part, and show me just that part changed."],
  ["span-answer-authorship-verb", "revises", "Imbas revises the section.", "Imbas composes the message you send."],
  ["span-answer-authorship-verb", "revising", "Revising the section for you.", "Composing the message for you to send."],
  ["span-answer-authorship-verb", "revised", "Here is the revised section.", "Here is the finished output, not a description of it."],
  ["span-answer-authorship-verb", "revision", "a revision of this passage", "a request about this passage"],
  ["span-answer-authorship-verb", "revisions", "two revisions of this passage", "two questions about this passage"],
  ["span-answer-authorship-verb", "fix", "Fix this part.", "Say plainly what you cannot do and why."],
  ["span-answer-authorship-verb", "fixes", "Imbas fixes this part.", "Imbas hands you the request for this part."],
  ["span-answer-authorship-verb", "fixing", "Fixing this part now.", "Showing you what this part rests on."],
  ["span-answer-authorship-verb", "fixed", "Here is the fixed part.", "Here is the exact change: the file, the lines, and the result."],
  ["span-answer-authorship-verb", "improve", "Improve this paragraph.", "Take this part and go deeper."],
  ["span-answer-authorship-verb", "improves", "This improves the paragraph.", "This asks for the full detail and the conditions that apply."],
  ["span-answer-authorship-verb", "improving", "Improving the paragraph for you.", "Going deeper on the part you selected."],
  ["span-answer-authorship-verb", "improved", "Here is the improved paragraph.", "Here is the request you can send."],
  ["span-answer-authorship-verb", "improvement", "an improvement on this paragraph", "a request about this paragraph"],
  ["span-answer-authorship-verb", "improvements", "two improvements to this paragraph", "two requests about this paragraph"],

  // The replacement-delivery constructions. PHRASE forms, because bare "complete" and
  // bare "correct" are ordinary words two ratified bank entries already use.
  ["span-produce-replacement", "produce the corrected", "Produce the corrected version.", "Name the source and the date for it."],
  ["span-produce-replacement", "write the complete", "Write the complete answer.", "If you cannot complete it, say which part and why."],
  ["span-produce-replacement", "generate the final", "Generate the final text.", "Give me this as the finished output, not as a description of it."],
  ["span-produce-replacement", "deliver the full", "Deliver the full answer.", "Give the full detail, the steps, and the conditions that apply."],
];

test("span boundary: every rule has a paired fixture, so no boundary rule ships unproven", () => {
  const covered = new Set(SPAN_PAIRED_FIXTURES.map(([id]) => id));
  for (const rule of SPAN_BANNED_CONSTRUCTIONS) {
    assert.ok(covered.has(rule.id), `span rule "${rule.id}" has no paired fixture`);
  }
  const known = new Set(SPAN_BANNED_CONSTRUCTIONS.map((r) => r.id));
  for (const id of covered) assert.ok(known.has(id), `fixture names unknown span rule "${id}"`);
  // Every enumerated verb is paired, so no banned form is proved by nothing. This is
  // the morphology control: banning "rewrite" while leaving "rewriting" unpaired is
  // the exact defect shape the chip lane's derived enumeration was built to close.
  const pairedForms = new Set(SPAN_PAIRED_FIXTURES.map(([, form]) => form));
  for (const verb of ANSWER_AUTHORSHIP_VERBS) {
    assert.ok(pairedForms.has(verb), `banned verb "${verb}" has no paired fixture`);
  }
});

test("span boundary: the rule catches its own fixture — 'Rewrite this passage.' fails in registered scope", () => {
  // The named fixture, asserted on its own rather than only inside the loop, because a
  // rule that passes vacuously is the failure mode this whole family guards against.
  const hits = lintSpanString("Rewrite this passage.");
  assert.ok(hits.some((h) => h.id === "span-answer-authorship-verb"), "the boundary rule did not catch its own fixture");
  assert.equal(hits[0].category, "answer_authorship");

  // And through the table walker, which is how a bank is actually linted.
  const violations = lintSpanStrings({ bank_instruction_texts: ["Rewrite this passage."] });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].path, "bank_instruction_texts[0]");
});

test("span boundary: each banned form is caught by its own rule", () => {
  for (const [ruleId, form, positive] of SPAN_PAIRED_FIXTURES) {
    const hits = lintSpanString(positive);
    assert.ok(
      hits.some((h) => h.id === ruleId),
      `"${form}" did not trip ${ruleId}: ${JSON.stringify(positive)} → ${JSON.stringify(hits.map((h) => h.id))}`,
    );
  }
});

test("span boundary: each banned form's near-miss control trips nothing", () => {
  for (const [ruleId, form, , control] of SPAN_PAIRED_FIXTURES) {
    assert.deepEqual(
      lintSpanString(control),
      [],
      `the control for ${ruleId}/"${form}" tripped a span rule — the boundary is eating the request register it exists to protect: ${JSON.stringify(control)}`,
    );
  }
});

test("span boundary: every bank instruction_text clears it", () => {
  const violations = lintSpanStrings(READER_SPAN_BANK.map((e) => e.instruction_text));
  assert.deepEqual(
    violations,
    [],
    `a span bank entry claims authorship of the replacement answer:\n${JSON.stringify(violations, null, 2)}`,
  );
});

test("span boundary: 'redo' is permitted by ruling, not by oversight", () => {
  // D3 is founder-ratified and opens "Redo this part properly". "redo" asks for
  // substantially what "rewrite" asks for, and the ruling enumerated the banned verbs
  // and included D3 in the same act — so the list stops where the ruling stopped. A
  // later pass that wants "redo" banned is overruling an entry the founder included,
  // not tidying a gap, and this test is what makes it say so out loud.
  assert.ok(!ANSWER_AUTHORSHIP_VERBS.includes("redo"));
  const d3 = READER_SPAN_BANK.find((e) => e.id === "D3");
  assert.match(d3.instruction_text, /^Redo /);
  assert.deepEqual(lintSpanString(d3.instruction_text), []);
});

// ── SCOPE: the boundary rule governs composed requests and nothing else ───────────

test("span boundary: SCOPE CONTROL — the same verb in non-registered explanatory copy does not fail", () => {
  // The rule is scoped to registered composed-request text. Explanatory prose, module
  // docs and code comments are NOT governed by it. The scope is enforced by WHAT IS
  // PASSED to lintSpanStrings, so the control has to prove two things: that this copy
  // would fail if it were routed there, and that nothing routes it.
  const explanatory = [
    "A governed span prompt may not claim authorship of the replacement answer, so it never says rewrite.",
    "The banned verbs are rewrite, revise, fix and improve, with their morphological forms.",
    "An improvement claim here would put Imbas on the far side of the line it stays behind.",
  ];
  for (const s of explanatory) {
    // Non-vacuity. Without this the control could be a sentence that happens to be
    // clean, which proves nothing about scope at all.
    assert.ok(
      lintSpanString(s).length > 0,
      `scope control is vacuous — nothing to be scoped out of: ${JSON.stringify(s)}`,
    );
    // And it is in no registered composed-request table, so the walkers never see it.
    for (const entry of READER_SPAN_BANK) assert.notEqual(entry.instruction_text, s);
  }

  // The lanes that DO govern shipped copy still govern it, and a banned span verb is
  // not banned by them. Asserted on the two sentences that are ordinary prose in both
  // other registers — the third is deliberately excluded because "improvement" IS a
  // chip-lane banned construction, which is the whole reason three separate lists
  // exist rather than one union.
  for (const s of explanatory.slice(0, 2)) {
    assert.deepEqual(lintString(s), [], `explanatory copy tripped the world-claim list: ${JSON.stringify(s)}`);
    assert.deepEqual(lintChipString(s), [], `explanatory copy tripped the chip list: ${JSON.stringify(s)}`);
  }
  assert.ok(lintChipString(explanatory[2]).some((h) => h.id === "chip-imbas-action"));

  // The span lane's own UI copy is explanatory, not a composed request, and is never
  // routed through lintSpanStrings. Asserted so a later pass cannot "tidy" the three
  // walkers into one.
  assert.deepEqual(lintSpanStrings(SPAN_REGISTERED_UI), []);
});

test("span boundary: SCOPE CONTROL — a shipped sibling bank would fail this rule, and is not governed by it", () => {
  // The live proof that the scope boundary is load-bearing rather than tidy.
  // SECOND_QUESTION_BANK composes a second question under a different ruling and its
  // instruction texts legitimately contain "revise the draft". Folding this rule into
  // BANNED_CONSTRUCTIONS would have failed that shipped bank on the day it landed.
  const secondQuestionTexts = SECOND_QUESTION_BANK.map((e) => e.instruction_text);
  assert.ok(
    lintSpanStrings(secondQuestionTexts).length > 0,
    "SECOND_QUESTION_BANK no longer trips the span boundary; the scope argument needs re-checking against its current copy",
  );
  // It passes the lane that DOES govern it, unchanged by anything in this slice.
  assert.deepEqual(lintUserFacingStrings(secondQuestionTexts), []);
});
