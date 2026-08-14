// The typography tokens, and the two ways a font declaration can be quietly wrong.
// Run: node --test test/typography-tokens.test.mjs
//
// First way: name a token nothing declares. `font-family: var(--font-serif)` is not a
// dead line — an undeclared custom property does not drop its declaration from the
// cascade. The declaration wins, computes to `inherit`, and serves whatever the parent
// had while masking the rule that would otherwise have applied. Seventeen rules asked
// for a serif that way; seven spelt the stack again inline as a fallback and rendered
// from that, ten got Inter. So --font-serif is declared now, and the guard below is
// general: a --font-* token that is used is a --font-* token that is declared.
//
// Second way: write the rule and lose the cascade. .insp-error__title is on an <h1>,
// and `.page h1` at (0,1,1) outranks a lone class at (0,1,0), so every property both
// of them set had been going to the page-heading rule since the day it was written.
// The fix is the one .insp-record__eyebrow already demonstrates, and the test computes
// specificity rather than trusting a selector string to look higher than another.
//
// Not covered here: --ink-dim, which is undeclared on purpose and has its own file.
// It is a color token, so the --font-* rule below does not reach it and the two do not
// disagree. See test/css-undeclared-token.test.mjs.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const SHEETS = ["styles.css", "workbench.css", "inspection.css"].map((rel) => [rel, read(rel)]);
const ALL_CSS = SHEETS.map(([, css]) => css).join("\n");

// Comments describe the problem in the same words the code uses, so they are not
// evidence of anything and are dropped before counting.
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

// --font-sans is used 86 times and declared nowhere: the same defect as --font-serif,
// at five times the size, and no ruling covers what it should resolve to. Every one of
// the 86 is bare — no inline fallback anywhere — so all 86 currently compute to
// `inherit`. Recorded rather than fixed, and counted so it cannot grow while it waits.
const UNRESOLVED = { token: "--font-sans", uses: 86 };

function tokenUses(css) {
  return [...stripComments(css).matchAll(/var\((--font-[a-z-]+)/g)].map((m) => m[1]);
}

function declaredTokens(css) {
  return [...stripComments(css).matchAll(/^\s*(--font-[a-z-]+)\s*:/gm)].map((m) => m[1]);
}

test("every typography token that is used is declared", () => {
  const declared = new Set(SHEETS.flatMap(([, css]) => declaredTokens(css)));
  const used = new Set(SHEETS.flatMap(([, css]) => tokenUses(css)));
  const undeclared = [...used].filter((t) => !declared.has(t)).sort();
  assert.deepEqual(
    undeclared,
    [UNRESOLVED.token],
    "a font-family reading an undeclared token does not fall through — it wins and " +
      "resolves to inherit, serving the parent's face wherever that rule applies.",
  );
});

test("the one token still undeclared has not spread while it waits for a ruling", () => {
  const uses = tokenUses(ALL_CSS).filter((t) => t === UNRESOLVED.token);
  assert.equal(
    uses.length,
    UNRESOLVED.uses,
    `${UNRESOLVED.token} is used ${uses.length} times, recorded at ${UNRESOLVED.uses}. ` +
      `Every one of them computes to inherit. Resolve the token or update the record.`,
  );
  assert.equal(
    ALL_CSS.includes(`var(${UNRESOLVED.token},`),
    false,
    `${UNRESOLVED.token} gained an inline fallback. That hides one site and leaves the rest.`,
  );
});

test("--font-serif is declared, and declared as the reading serif", () => {
  const m = /^\s*--font-serif:\s*([^;]+);/m.exec(read("styles.css"));
  assert.ok(m, "styles.css must declare --font-serif beside the other three families");
  const first = m[1].split(",")[0].replace(/["']/g, "").trim();
  assert.equal(
    first,
    "Georgia",
    "the seven rules that spell `var(--font-serif, Georgia, serif)` inline render from " +
      "that fallback today. The token leads with the same face so declaring it moves none " +
      "of them; a different lead face would restyle seven shipped surfaces.",
  );
  assert.equal(
    /Fraunces/.test(m[1]),
    false,
    "Fraunces is the display face. The serif token exists to be the one that is not it.",
  );
});

test("both groups of serif consumers are still accounted for", () => {
  // A new consumer in either shape is fine; an unnoticed one is how the first defect
  // spread to seventeen rules.
  const css = stripComments(ALL_CSS);
  const withFallback = (css.match(/var\(--font-serif,\s*Georgia,\s*serif\)/g) ?? []).length;
  const bare = (css.match(/var\(--font-serif\)/g) ?? []).length;
  assert.equal(withFallback, 7, "the count of inline-fallback serif consumers moved");
  assert.equal(bare, 10, "the count of bare serif consumers moved");
});

// ── The error title, by computed specificity ────────────────────────────────

// a = ids, b = classes/attributes/pseudo-classes, c = elements/pseudo-elements.
function specificity(selector) {
  const s = selector.trim();
  return [
    (s.match(/#[\w-]+/g) ?? []).length,
    (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) ?? []).length,
    (s.match(/(?:^|[\s>+~])(?![.#[:])([a-zA-Z][\w-]*)|::[\w-]+/g) ?? []).length,
  ];
}

const beats = (a, b) => {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
};

const ERROR_TITLE = ".insp-error h1.insp-error__title";

test("the specificity calculator agrees with the case that produced the rule", () => {
  // Calibration. If these drift the assertions below mean nothing.
  assert.deepEqual(specificity(".page h1"), [0, 1, 1]);
  assert.deepEqual(specificity(".insp-error__title"), [0, 1, 0]);
  assert.deepEqual(specificity(ERROR_TITLE), [0, 2, 1]);
  assert.deepEqual(specificity("h1"), [0, 0, 1]);
  assert.deepEqual(specificity(".insp-record__mast h1.insp-record__eyebrow"), [0, 2, 1]);
  assert.equal(beats(specificity(".page h1"), specificity(".insp-error__title")), true);
});

test("the error title outranks both rules the tag brings with it", () => {
  const css = read("inspection.css");
  assert.ok(css.includes(`${ERROR_TITLE} {`), `inspection.css must style the error title at ${ERROR_TITLE}`);
  assert.equal(
    /^\.insp-error__title\s*\{/m.test(stripComments(css)),
    false,
    "the lone-class rule is back. At (0,1,0) it loses every property `.page h1` also sets.",
  );
  for (const loser of [".page h1", "h1"]) {
    assert.equal(
      beats(specificity(ERROR_TITLE), specificity(loser)),
      true,
      `${ERROR_TITLE} must outrank ${loser}`,
    );
  }
});

test("the error title restates every property the two losing rules would land on", () => {
  const body = new RegExp(`${ERROR_TITLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(
    read("inspection.css"),
  );
  assert.ok(body, "the error title rule is not readable");
  // font-family, font-size, letter-spacing, color and margin arrive from `.page h1`;
  // line-height and font-weight from the global `h1, h2, h3, h4` block. Winning the
  // cascade only helps for properties the rule actually sets.
  for (const prop of [
    "margin",
    "font-family",
    "font-size",
    "line-height",
    "font-weight",
    "letter-spacing",
    "color",
  ]) {
    assert.match(body[1], new RegExp(`^\\s*${prop}\\s*:`, "m"), `the error title must set ${prop} itself`);
  }
  assert.match(body[1], /font-family:\s*var\(--font-serif\)/, "the error title reads the serif token");
});
