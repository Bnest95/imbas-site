// The guided-case seed must not reach an own-mode run.
//
// The production bug: a person pasted their own AI answer, read their own result, and
// at the bottom of it found "How does the FDA ensure drug safety?" — a curated case
// question — offered as their next move. Three routes carried it there, and closing one
// or two of them looks fixed while the leak still runs:
//
//   1. SecondRunLoop's `suggestion` lookup, which read CURATED in both modes.
//   2. Its `sel?.openPrompt` fallback. `sel` is seeded CURATED[0] for every visitor
//      regardless of mode, so gating only route 1 left the fallback intact.
//   3. startAnother's own-mode branch, which wrote a suggestion's openPrompt into the
//      question field.
//
// Closing them all empties `question` in own mode, and an unguarded `if (!question)
// return null` would then delete the loop-close section entirely — removing the only
// restart affordance at the exact point Section N's north-star metric is measured. So
// this file tests both halves: no curated value reaches own mode, AND own mode still
// renders a restart.
//
// The three derivation lines are EXECUTED here, not pattern-matched, so a rewrite that
// reintroduces the leak in different syntax still fails. Point WORKBENCH_APP_JSX at a
// pre-fix snapshot (`git show master:workbench-app.jsx > /tmp/x.jsx`) to watch it fail.
// Run: node --test test/workbench-own-mode-loop.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC_PATH =
  process.env.WORKBENCH_APP_JSX ||
  fileURLToPath(new URL("../workbench-app.jsx", import.meta.url));
const SRC = readFileSync(SRC_PATH, "utf8");

const BODY_START = SRC.indexOf("function SecondRunLoop(");
assert.notEqual(BODY_START, -1, "SecondRunLoop must exist — it is the loop-close section");
const BODY = SRC.slice(BODY_START, SRC.indexOf("\n}\n", BODY_START));

// The derivation, lifted verbatim: every statement that assigns suggestion or question.
// Whatever shape they take, they run against the fakes below. `guided` is supplied when
// the source does not derive it — the pre-fix version had no such binding, and the
// point of running against that snapshot is to see the LEAK assertions fail, not to
// abort on a missing local.
function extractDerivation(body) {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^const (guided|suggestion|question) =/.test(l));
  const names = lines.map((l) => /^const (\w+)/.exec(l)[1]);
  for (const required of ["suggestion", "question"]) {
    assert.ok(names.includes(required), `SecondRunLoop must derive ${required}; got: ${names}`);
  }
  const prelude = names.includes("guided") ? "" : 'const guided = mode === "guided";\n';
  return prelude + lines.join("\n");
}

// A curated pool with a distinctive marker, plus the CURATED[0] seed every visitor
// carries. If either appears in own mode, the leak is open.
const FDA = "How does the FDA ensure drug safety?";
const CURATED = [
  { id: "c1", ready: true, openPrompt: FDA },
  { id: "c2", ready: true, openPrompt: "A second curated question" },
];

// eslint-disable-next-line no-new-func -- running the real derivation is the whole point.
const derive = new Function(
  "mode",
  "sel",
  "CURATED",
  `${extractDerivation(BODY)}\nreturn { guided, suggestion, question };`,
);

// ── Own mode reads no curated entry on any path ────────────────────────────────

test("own mode derives no suggestion and no question, even seeded with CURATED[0]", () => {
  const d = derive("own", CURATED[0], CURATED);
  assert.equal(d.guided, false);
  assert.equal(d.suggestion, null, "route 1: the CURATED lookup must not run in own mode");
  assert.equal(d.question, "", "route 2: the sel?.openPrompt fallback must not run either");
});

test("no curated string reaches own mode through any derived value", () => {
  for (const seed of [CURATED[0], CURATED[1], null, undefined]) {
    const d = derive("own", seed, CURATED);
    const reachable = JSON.stringify(d);
    for (const c of CURATED) {
      assert.ok(
        !reachable.includes(c.openPrompt),
        `seed ${seed?.id}: curated question reached own mode via ${reachable}`,
      );
    }
    assert.ok(!reachable.includes(FDA));
  }
});

test("guided mode still gets a suggested next case and a question to copy", () => {
  // The fix must not cost guided mode its loop: it suggests the next ready case that is
  // not the one just run.
  const d = derive("guided", CURATED[0], CURATED);
  assert.equal(d.guided, true);
  assert.equal(d.suggestion.id, "c2");
  assert.equal(d.question, "A second curated question");
});

test("guided mode falls back to the current case when no other is ready", () => {
  const only = [{ id: "c1", ready: true, openPrompt: FDA }];
  const d = derive("guided", only[0], only);
  assert.equal(d.suggestion, null);
  assert.equal(d.question, FDA, "the fallback is guided-only and stays intact");
});

// ── Dropping the question must not drop the restart ────────────────────────────

test("the empty-question guard is scoped to guided, so own mode never returns null", () => {
  // `if (!question) return null` would be correct-looking and would delete the restart
  // action from every own-mode result.
  assert.ok(
    /if \(guided && !question\) return null;/.test(BODY),
    "the null return must be reachable only in guided mode",
  );
  assert.ok(
    !/^\s*if \(!question\) return null;/m.test(BODY),
    "an unguarded empty-question return strands every own-mode reader",
  );
});

test("own mode keeps a restart control and its own lead line", () => {
  // What own mode actually renders at loop close: the heading, one plain sentence, and
  // one button. No question card, no copy button, nothing curated.
  //
  // The button was primary until Surface Finish item 5 (R7). It closed the page 281px
  // under Act2's "Ask your AI", so one viewport held two equally weighted primaries and
  // named no next step between them. Act2's control acts on the prompt directly above it
  // and keeps the weight; this one is the subordinate of the pair. What this test holds
  // is unchanged — the control exists and sits outside the guided branch — with its
  // weight now pinned too, so a later pass cannot quietly promote it back.
  assert.ok(
    /<Btn kind="ghost" small onClick=\{\(\) => onAnother\(suggestion\)\}>Test another question<\/Btn>/.test(
      BODY.replace(/\s+/g, " "),
    ),
    "the restart button sits outside the guided branch, subordinate, and must stay there",
  );
  assert.ok(
    /Run the same check on another answer\./.test(BODY),
    "own mode gets its own lead, not the guided copy-and-paste instructions",
  );
  // The question card and the copy button are both inside `guided ?` branches.
  for (const token of ["<PromptCard text={question} />", "Copy question"]) {
    const at = BODY.indexOf(token);
    assert.notEqual(at, -1, `${token} must still exist for guided mode`);
    assert.ok(
      /guided \? \(/.test(BODY.slice(Math.max(0, at - 600), at)),
      `${token} must render only inside a guided branch`,
    );
  }
});

test("the restart handler writes no curated question into own mode", () => {
  // Route 3. Own mode receives suggestion === null today, so the branch was dead — and a
  // dead branch that reopens the leak is worse than no branch.
  const at = SRC.indexOf("const startAnother = (suggestion) => {");
  assert.notEqual(at, -1);
  const handler = SRC.slice(at, SRC.indexOf("\n  };", at));
  assert.ok(
    !/setQuestion\(suggestion\.openPrompt\)/.test(handler),
    "own mode must not take its question from a curated suggestion",
  );
  assert.ok(
    /if \(mode === "guided" && suggestion\) setSel\(suggestion\);/.test(handler),
    "only guided mode consumes the suggestion",
  );
});
