// The Reader's narrative section titles used to carry three different colours, and two of
// the three were selected by position rather than by meaning. Position and meaning agreed
// on every state the board photographs, so the taxonomy looked deliberate — but a section
// inherits a tint from where it sits, and the sections are conditional, so the agreement
// was a coincidence of which ones happened to render.
//
// The accent registry authorizes accent for the evidence signal, a ruled keyword, a ruled
// gap figure, a status pill, and the primary action. A section heading is none of those.
// The titles take one ink now and the accent stays on the findings underneath them.
//
// These also hold the token collapse: the Reader block declared its own ember ramp beside
// the one styles.css owns, and nothing referenced it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKBENCH_CSS = fs.readFileSync(path.join(ROOT, "workbench.css"), "utf8");

// Every `selector { ...declarations... }` pair, flattened. Good enough to ask which
// selectors set a colour; it is not a CSS parser and does not need to be.
function rules(css) {
  const out = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (!selector || selector.startsWith("@")) continue;
    out.push({ selector, body: m[2] });
  }
  return out;
}

const RULES = rules(WORKBENCH_CSS);
const TITLE = ".wb-reader-result__section-title";

test("no Reader section title takes its colour from where the section sits", () => {
  const positional = RULES.filter(
    (r) => r.selector.includes(TITLE) && r.selector.includes(":nth-child") && /(^|[;\s])color:/.test(r.body),
  );
  assert.deepEqual(
    positional.map((r) => r.selector),
    [],
    "A section title is being coloured by position. The sections are conditional — a fallback " +
      "record renders the read and nothing else, so nth-child(2) lands on whichever section " +
      "happens to be second rather than on the one the colour was chosen for.",
  );
});

test("the three section accents are gone and the titles land on one ink", () => {
  // The literals, not the selectors: whichever rule reintroduces them, this catches it.
  const retired = [
    ["rgba(240, 200, 160, 0.88)", "the read"],
    ["rgba(224, 112, 80, 0.88)", "what may be missing"],
    ["rgba(160, 140, 200, 0.88)", "how it was shaped"],
    ["rgba(220, 175, 130, 0.85)", "the read, agent variant"],
  ];
  for (const [colour, which] of retired) {
    const carriers = RULES.filter((r) => r.selector.includes(TITLE) && r.body.includes(colour));
    assert.deepEqual(
      carriers.map((r) => r.selector),
      [],
      `A section title is ${colour} again — the accent that used to mark "${which}". ` +
        "Heading colour is not an authorized accent role.",
    );
  }

  const base = RULES.find((r) => r.selector === `.wb-reader-result.is-agent ${TITLE}`);
  assert.ok(base, `.wb-reader-result.is-agent ${TITLE} is gone. It is the ink every narrative title now takes.`);
  assert.match(
    base.body,
    /color:\s*rgba\(200,\s*185,\s*165,\s*0\.88\)/,
    "The ink the section titles fall back to has moved. Every narrative title renders it, so a " +
      "change here is a change to all four at once.",
  );
});

test("ember still marks the findings the titles stopped marking", () => {
  // The point of neutralizing the headings is that the accent goes to the evidence. If the
  // marker loses its ember too, the block has no signal colour left and the trade is a loss.
  const marker = RULES.find((r) => r.selector === ".wb-reader-result__list li::marker");
  assert.ok(marker, ".wb-reader-result__list li::marker is gone — the gap findings lost their signal colour.");
  assert.match(marker.body, /color:\s*rgba\(224,\s*112,\s*80/, "The gap findings' marker is no longer ember.");
});

test("every Reader token has a consumer, or a written reason it does not", () => {
  const declared = [...WORKBENCH_CSS.matchAll(/^\s*(--wb-reader-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]);
  assert.ok(declared.length, "The Reader token block is gone entirely.");

  // Kept deliberately: the value belongs to the alert/thin-result family, which is a
  // separate design system. Deleting it would be tidying inside someone else's registry.
  const EXEMPT = new Set(["--wb-reader-thin"]);

  for (const name of declared) {
    if (EXEMPT.has(name)) continue;
    const used = new RegExp(`var\\(\\s*${name}\\s*[,)]`).test(WORKBENCH_CSS);
    assert.ok(
      used,
      `${name} is declared and nothing reads it. Thirteen tokens like it were deleted because a ` +
        "second ember ramp beside the one styles.css owns is how the registries drift apart.",
    );
  }

  for (const name of EXEMPT) {
    assert.ok(declared.includes(name), `${name} was deleted. It was retained on purpose; removing it needs its own ruling.`);
  }
});

test("the alert and aurora families are untouched", () => {
  // Out of scope by ruling. Counted rather than described, because "I did not touch it" is
  // not something a diff proves once the file has moved underneath it.
  const count = (re) => (WORKBENCH_CSS.match(re) ?? []).length;
  assert.equal(count(/196,\s*74,\s*40/g), 11, "The alert/thin-result family changed count. It belongs to a separate design system.");
  assert.equal(count(/160,\s*50,\s*35/g), 3, "The aurora gradient family changed count. It belongs to a separate design system.");
});
