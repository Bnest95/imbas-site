// No all-clear. No conduct. No live verdict on a curated case.
//
// Three prohibitions, one file, because they are three shapes of the same overclaim: a
// surface reporting what an inspection found and then saying one thing more than the
// inspection established.
//
//   ALL-CLEAR   — "The answer substantially served the question." An inspection pass
//                 produces flags. Whether an answer served a person is a judgment about
//                 that person's need, and nothing in the run has access to it. The
//                 badge that carried this said FULL, which is the same claim in one word.
//
//   CONDUCT     — "evasive." That is a statement about why a model wrote what it wrote,
//                 and the standing framing rule allows behavior and forbids intent.
//                 The observation itself is real and it ships, as Deflection: the answer
//                 went around the question rather than at it. What is removed is the
//                 attribution, not the finding.
//
//   LIVE VERDICT — CLOSED GAP / PARTIALLY SURFACED / GAP HELD. Three labels computed by
//                 token-matching a visitor's paste, outside the canonical selectors,
//                 and printed over an archived case as though the archive had ruled on
//                 it. A categorical rebuild of the score this pass removed, and — the
//                 reason it goes first — unreadable to anyone who has not read the
//                 method. The archived case now states its own finding, fixed and dated.
//
// Both halves of the assertion matter and neither is sufficient alone. Scanning the
// SOURCE proves the strings are not in the build. Scanning the committed BOARD
// BASELINES proves they were not on screen when a camera looked at the running product,
// which also catches a phrase assembled at runtime from fragments no source scan would
// see. A surface can regress in either place independently.
//
// Run: node --test test/reader-no-allclear-vocabulary.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { PAIRED_EMPTY_CLOSE, PAIRED_VALUE_CLOSE } from "../reader-paired.js";
import { CLAIM_STATE_UI } from "../reader-provenance.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = readFileSync(join(ROOT, "workbench-app.jsx"), "utf8");
const RECEIPT_SRC = readFileSync(join(ROOT, "reader-receipt-page.js"), "utf8");
const BOARD_DIR = join(ROOT, "docs", "qa", "visual-acceptance-harness");

// ── The prohibited vocabulary, listed rather than described ──────────────────
//
// Each entry is a label and a pattern. The label is what the reviewer reads when it
// fires; the pattern is what fires. Word boundaries throughout, so "fully" does not
// trip the FULL badge and "cleanup" does not trip "clean".
const PROHIBITED = [
  // All-clear: the answer graded as adequate, complete, or clean.
  ["all-clear: served the question", /\bsubstantially served\b/i],
  ["all-clear: the answer was complete", /\bthe answers? (?:is|was) (?:complete|sufficient|adequate|fine|thorough)\b/i],
  ["all-clear: nothing missing", /\bnothing (?:is|was) missing\b/i],
  ["all-clear: read clean", /\bread clean\b/i],
  ["all-clear: a clean answer", /\bclean (?:answer|bill|read)\b/i],
  ["all-clear: no issues", /\bno (?:issues|problems) (?:found|detected)\b/i],
  ["all-clear: the FULL badge", /"FULL"|>FULL</],

  // Conduct: intent, motive, or character attributed to a model or an answer.
  ["conduct: evasive", /\bevasive(?:ly|ness)?\b/i],
  ["conduct: dodged or avoided", /\bthe answer (?:dodged|avoided|ducked|sidestepped)\b/i],
  ["conduct: motive verbs about models", /\bthe model (?:wanted|tried|hid|refused|chose)\b/i],
  ["conduct: withheld", /\b(?:withheld|concealed) (?:the |this )?(?:information|answer)\b/i],

  // Live verdict on a curated case.
  ["live verdict: CLOSED GAP", /\bCLOSED GAP\b/],
  ["live verdict: PARTIALLY SURFACED", /\bPARTIALLY SURFACED\b/],
  ["live verdict: GAP HELD", /\bGAP HELD\b/],
];

// The current-run copy constants, gathered where they live. A prohibition checked only
// against a file scan would pass if a constant moved into a module the scan does not
// read, so the constants are also checked as values.
function currentRunConstants() {
  const out = [];
  const push = (where, value) => {
    if (typeof value === "string" && value.trim()) out.push({ where, value });
  };
  push("PAIRED_EMPTY_CLOSE", PAIRED_EMPTY_CLOSE);
  push("PAIRED_VALUE_CLOSE", PAIRED_VALUE_CLOSE);
  for (const [state, ui] of Object.entries(CLAIM_STATE_UI)) {
    push(`CLAIM_STATE_UI.${state}.label`, ui.label);
    push(`CLAIM_STATE_UI.${state}.support`, ui.support);
  }
  // The completeness badge and its gloss live in the JSX and cannot be imported, so
  // they are lifted out of the source by name and evaluated. Extracting rather than
  // re-typing is what keeps this checking the shipped strings.
  for (const name of ["READER_COMPLETENESS_LABEL", "READER_COMPLETENESS_GLOSS"]) {
    const m = SRC.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`));
    assert.ok(m, `${name} was not found in workbench-app.jsx — the extractor is stale`);
    // eslint-disable-next-line no-new-func
    const obj = new Function(`return ${m[1]};`)();
    for (const [k, v] of Object.entries(obj)) push(`${name}.${k}`, v);
  }
  return out;
}

function boardRenderSections() {
  return readdirSync(BOARD_DIR)
    .filter((f) => f.endsWith(".snapshot.txt"))
    .sort()
    .map((f) => {
      const text = readFileSync(join(BOARD_DIR, f), "utf8");
      const i = text.indexOf("\n## render\n");
      return { file: f, render: i < 0 ? "" : text.slice(i) };
    });
}

function hits(text) {
  const found = [];
  for (const [label, re] of PROHIBITED) {
    const m = String(text).match(re);
    if (m) found.push(`${label} → ${JSON.stringify(m[0])}`);
  }
  return found;
}

// Remove comments, keep code and copy.
//
// Line-oriented on purpose. A character-level walk has to decide whether a quote opens
// a string, and JSX prose is full of apostrophes — "didn't" would open a string that
// swallows everything to the next apostrophe, and the scan would then be reading a
// file it had silently deleted half of. Lines are unambiguous.
//
// The rule: a line is dropped if its first non-space characters are `//`, `{/*`, `/*`
// or `*`, or if it falls inside an open block comment. A trailing comment on a code
// line is NOT stripped, which is deliberate — if a removed phrase has to be named, it
// goes on its own line where a reader will find it.
function stripComments(src) {
  const kept = [];
  let inBlock = false;
  for (const line of src.split("\n")) {
    const t = line.trim();
    if (inBlock) {
      if (t.includes("*/")) inBlock = false;
      continue;
    }
    if (t.startsWith("//")) continue;
    if (t.startsWith("{/*") || t.startsWith("/*") || t.startsWith("*")) {
      if (!t.includes("*/")) inBlock = true;
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

test("0) the comment stripper removes comments and keeps copy (guarding the guard)", () => {
  // Both directions. A stripper that removes everything would make test 3 pass forever;
  // one that removes nothing would make it fail forever on this file's own history.
  assert.equal(stripComments("// GAP HELD\nconst a = 1;"), "const a = 1;");
  assert.equal(stripComments("  {/* GAP HELD\n      more */}\nconst a = 1;"), "const a = 1;");
  assert.equal(stripComments("/* GAP HELD */\nconst a = 1;"), "const a = 1;");
  assert.equal(stripComments('const s = "a // b";'), 'const s = "a // b";');
  // The apostrophe case that sank the character-level version.
  assert.equal(stripComments("<p>It didn't surface. GAP HELD</p>"), "<p>It didn't surface. GAP HELD</p>");

  // On the real file: the documented removals go, the shipped copy stays.
  const stripped = stripComments(SRC);
  assert.ok(SRC.includes("CLOSED GAP"), "the fixture assumption failed — the comments no longer name it");
  assert.ok(!stripped.includes("CLOSED GAP"), "the stripper left a comment behind");
  assert.ok(stripped.includes("NOTHING FLAGGED"), "the stripper ate the badge labels");
  assert.ok(stripped.includes("This inspection surfaced no omission candidates."), "the stripper ate the gloss");
  assert.ok(stripped.includes("What the second answer added"), "the stripper ate a shipped heading");
  assert.ok(stripped.length > SRC.length * 0.5, "the stripper removed more than half the file");
});

test("1) the scanner fires on the exact strings this pass removed (guarding the guard)", () => {
  // Without this, a typo in any pattern turns the whole file into a test that passes
  // because it checks nothing. Each line below is retired copy, verbatim.
  const RETIRED_SAMPLES = [
    "The answer substantially served the question.",
    "The answer was evasive or substantially incomplete.",
    "CLOSED GAP",
    "PARTIALLY SURFACED",
    "GAP HELD",
    "It read clean.",
  ];
  for (const sample of RETIRED_SAMPLES) {
    assert.ok(hits(sample).length > 0, `the scanner does not catch retired copy: ${JSON.stringify(sample)}`);
  }
  // And it does not fire on the copy that replaced them, or this file blocks its own fix.
  for (const { where, value } of currentRunConstants()) {
    assert.deepEqual(hits(value), [], `${where} trips the scanner: ${value}`);
  }
});

test("2) no current-run copy constant carries all-clear or conduct vocabulary", () => {
  const constants = currentRunConstants();
  assert.ok(constants.length >= 14, `only ${constants.length} constants gathered — the extractor lost a source`);
  const offenders = [];
  for (const { where, value } of constants) {
    for (const h of hits(value)) offenders.push(`${where}: ${h}`);
  }
  assert.deepEqual(offenders, []);
});

test("3) the component source carries none of the prohibited strings", () => {
  // Comments are stripped first, and the reason is not convenience. Every removal in
  // this pass is documented at the site of the removal, quoting the copy that was
  // removed so the next reader knows what not to put back. Scanning those comments
  // would make the file unable to explain its own history — and a comment has never
  // rendered. What is left after the strip is code and copy, which is what can reach a
  // person. Test 4 covers the strings this cannot see, by reading what a camera caught.
  const offenders = hits(stripComments(SRC));
  assert.deepEqual(
    offenders,
    [],
    "A prohibited string is back in workbench-app.jsx. The observation may be real — " +
      "ship it as a flag in the ruled vocabulary (Omission, Framing Drift, Deflection), " +
      "not as a grade on the answer or a verdict on the visitor's paste.",
  );
});

// The receipt is scanned at source rather than left to test 4, because the camera cannot
// reach all of its copy. Its sections choose a branch per record, and one branch — a
// preserved source artifact — has no product path that produces it, so no board scenario
// can photograph the sentence it would print. Copy that ships in a branch nothing
// photographs is exactly the copy a screen-only scan misses.
test("3b) the receipt source carries none of the prohibited strings", () => {
  const offenders = hits(stripComments(RECEIPT_SRC));
  assert.deepEqual(
    offenders,
    [],
    "A prohibited string reached reader-receipt-page.js. The receipt states what the " +
      "record does not establish; it never grades the answer it preserves.",
  );
});

test("4) no committed board baseline photographed a prohibited string on screen", () => {
  const baselines = boardRenderSections();
  assert.ok(baselines.length > 0, "the board is empty, so this scan proves nothing");
  const offenders = [];
  for (const { file, render } of baselines) {
    assert.ok(render.length, `${file} has no render section`);
    for (const h of hits(render)) offenders.push(`${file} — ${h}`);
  }
  assert.deepEqual(
    offenders,
    [],
    "A committed baseline photographed prohibited copy on screen. Do not re-accept the " +
      "baseline to make this green: fix the render, then capture.",
  );
});

test("5) the curated surface computes no verdict label from the visitor's paste", () => {
  // The badge is gone; the record key it was derived from is not, because `verdict`
  // rides the repository candidate and removing it would change what is recorded.
  // This is the line between the two: the key may exist, and nothing may turn it into
  // a visible label.
  // Stripped, for the same reason test 3 is: the removals are documented by name at the
  // site of the removal, and a comment saying "the dead verdictLine table went with the
  // badge" is the record of the fix, not the fix coming back.
  const CODE = stripComments(SRC);
  assert.ok(/verdict = "gap_held"/.test(CODE), "the record key must still be computed — removing it changes the record");
  assert.ok(!/outcomeBadge/.test(CODE), "the badge builder must not come back");
  assert.ok(!/verdictLine/.test(CODE), "the verdict label table must not come back");
  assert.ok(!/wb-result-outcome/.test(CODE), "the badge element and its tone classes must not come back");

  // What stands in its place is a lookup on the stored case, not a calculation on the
  // paste. The archive fact is `c.reveal` — written once per case, human-reviewed, and
  // unchanged by anything a visitor types.
  const m = CODE.match(/function archiveFact\(c\) \{[\s\S]*?\n\}/);
  assert.ok(m, "archiveFact was not found");
  assert.ok(/c\.reveal/.test(m[0]), "the archive fact must be read off the stored case");
  assert.ok(/human-reviewed/.test(m[0]), "the tier line must name the review tier");
  assert.ok(
    !/anchors|tokens|answer|paste/i.test(m[0]),
    "the archive fact must not read the visitor's paste in any form",
  );
});
