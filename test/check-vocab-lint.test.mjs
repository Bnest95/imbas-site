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
  lintString,
  lintUserFacingStrings,
  hasWorldClaimVerdict,
} from "../reader-check-vocab.js";
import { CHECK_UI } from "../reader-checks.js";
import { PAIR_CAPTURE_UI } from "../reader-paired.js";
import { EXPLAIN_PANEL_UI } from "../reader-explain-panel.js";

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

// ── AT-5: the list catches each banned family ───────────────────────────────────

test("AT-5: world-claim verdict words are caught", () => {
  for (const word of ["true", "false", "correct", "incorrect", "wrong"]) {
    const hits = lintString(`The answer's claim is ${word}.`);
    assert.ok(
      hits.some((h) => h.id === "world-claim-verdict"),
      `expected "${word}" to trip world-claim-verdict`,
    );
  }
});

test("AT-5: reliance verdicts are caught", () => {
  assert.ok(lintString("This is safe to rely on.").some((h) => h.category === "reliance_verdict"));
  assert.ok(lintString("You cannot rely on this figure.").some((h) => h.category === "reliance_verdict"));
  assert.ok(lintString("You can rely on the exemption.").some((h) => h.category === "reliance_verdict"));
});

test("AT-5: defensibility / compliance / adequate-review claims are caught", () => {
  assert.ok(lintString("This makes the record defensible.").some((h) => h.id === "defensible"));
  assert.ok(lintString("A compliance-proof packet.").some((h) => h.id === "compliance-proof"));
  assert.ok(lintString("an adequate review of the record").some((h) => h.id === "adequate-review"));
  assert.ok(lintString("adequately reviewed").some((h) => h.id === "adequate-review"));
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

// ── The runtime gate keys only on world-claim verdicts ──────────────────────────

test("hasWorldClaimVerdict trips on verdict words but not on reliance/defensibility mentions", () => {
  assert.equal(hasWorldClaimVerdict("This shows the claim is false."), true);
  assert.equal(hasWorldClaimVerdict("Is the stated figure correct?"), true);
  // The runtime gate is world-claim-only: a bare reliance/defensibility mention is
  // handled by the CI lint over authored copy, not by the per-check runtime drop.
  assert.equal(hasWorldClaimVerdict("The exemption rests on the 2019 date."), false);
  assert.equal(hasWorldClaimVerdict("What source establishes the premise?"), false);
});
