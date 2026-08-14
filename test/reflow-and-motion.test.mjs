// What the Reader and the share page owe a narrow screen, a zoomed one, and a person
// who has asked their system to stop moving things.
// Run: node --test test/reflow-and-motion.test.mjs
//
// Why this file exists. All four guarantees below are already shipped and were already
// correct when this file was written. None of them had a test. They are the kind that
// break silently and invisibly to anyone developing at a desk: a hard pixel width that
// only bites at 320, a scroll offset that stops clearing a fixed header, an animation
// added to a stylesheet that loads after the reset that was supposed to stop it. The
// board photographs two viewports and cannot see any of it — reduced motion is a media
// query the board does not set, and 320 is narrower than the mobile frame.
//
// These are source-level assertions because that is where the guarantee lives. The
// suite has no browser, and a rule about which stylesheet defines a token is a fact
// about the files, not about a render.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const STYLES = read("styles.css");
const WORKBENCH = read("workbench.css");
const INSPECTION = read("inspection.css");
const READER_HTML = read("reader.html");
const INSPECTION_HTML = read("inspection.html");

// The two product surfaces, and the sheets each one actually loads.
const SURFACES = [
  { name: "reader.html", html: READER_HTML },
  { name: "inspection.html", html: INSPECTION_HTML },
];

// Every rule body in a stylesheet, paired with the selector that opens it. Crude on
// purpose: it does not parse CSS, it splits on braces, which is enough to ask which
// declarations sit under which selector and is not enough to be trusted with anything
// else. At-rule headers come back as their own "selector" and are skipped by callers.
function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) out.push({ selector: m[1].trim(), body: m[2] });
  return out;
}

// ── The tokens the offsets are spent in are defined somewhere both surfaces load ──

test("both surfaces load the sheet that defines the offsets the other sheets spend", () => {
  // workbench.css computes every scroll offset from --header-offset and
  // --scroll-anchor-gap, and defines neither. styles.css defines both. A surface that
  // dropped styles.css would still render — and every scroll-margin-top on it would
  // resolve to nothing, which is the failure this catches, because it looks like
  // nothing until something is scrolled to.
  assert.match(STYLES, /--header-offset:\s*[^;]+;/, "styles.css must define --header-offset");
  assert.match(STYLES, /--scroll-anchor-gap:\s*[^;]+;/, "styles.css must define --scroll-anchor-gap");
  for (const token of ["--header-offset", "--scroll-anchor-gap"]) {
    assert.ok(
      !new RegExp(`${token}:`).test(WORKBENCH),
      `workbench.css defines ${token} as well as spending it, so the two definitions can disagree`,
    );
  }
  for (const { name, html } of SURFACES) {
    assert.match(html, /<link rel="stylesheet" href="\/styles\.css/, `${name} must load styles.css`);
    assert.match(html, /<link rel="stylesheet" href="\/workbench\.css/, `${name} must load workbench.css`);
  }
});

test("what gets scrolled to clears the fixed header, and says so in the token", () => {
  // WCAG 2.4.11. The site header is fixed, so an element scrolled to the top of the
  // viewport lands underneath it unless something reserves the height. Two mechanisms
  // do that here, and both are computed from the header's own token rather than from a
  // number copied out of it — which is the point, because the header's height is free
  // to change.
  assert.match(
    STYLES,
    /scroll-padding-top:\s*calc\(var\(--header-offset\)/,
    "the scroll container must reserve the header's own height",
  );

  const offsets = [...WORKBENCH.matchAll(/scroll-margin-top:\s*([^;]+);/g)].map((m) => m[1]);
  assert.ok(offsets.length, "workbench.css must place its own scroll anchors");
  for (const value of offsets) {
    assert.match(
      value,
      /var\(--header-offset\)/,
      `a scroll anchor is offset by ${JSON.stringify(value)}, which does not follow the header`,
    );
  }
});

// ── Reduced motion ───────────────────────────────────────────────────────────

test("asking for less motion stops animation everywhere, including in later sheets", () => {
  // The global reset lives in styles.css, and both surfaces load workbench.css AFTER
  // it. A later sheet's animation would win on order alone, so the reset carries
  // !important on each of the three properties that actually move something. Removing
  // that word is the mutation this catches: the block would still be there, still read
  // correctly, and stop working on every animation the Reader owns.
  const block = STYLES.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/);
  assert.ok(block, "styles.css must answer prefers-reduced-motion");
  const reset = block[0].match(/\*,\s*\*::before,\s*\*::after\s*\{([^}]*)\}/);
  assert.ok(reset, "the answer must reach every element, not a list of the ones remembered");
  for (const prop of ["animation-duration", "animation-iteration-count", "transition-duration"]) {
    assert.match(
      reset[1],
      new RegExp(`${prop}:[^;]*!important`),
      `${prop} must be neutralized with !important, or a stylesheet loaded later simply wins`,
    );
  }

  for (const { name, html } of SURFACES) {
    const styles = html.indexOf("/styles.css");
    const workbench = html.indexOf("/workbench.css");
    assert.ok(styles > -1 && workbench > styles, `${name} must load styles.css before workbench.css`);
  }
});

test("the Reader's own moving parts are named in its own reduce block", () => {
  // The global reset handles duration. It does not handle an element that is drawn
  // mid-animation and depends on the animation to arrive at its resting state, which is
  // what the sigil and the diagnostic are. workbench.css answers for those separately.
  const blocks = [...WORKBENCH.matchAll(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/g)];
  assert.ok(blocks.length, "workbench.css must answer prefers-reduced-motion for the parts it animates");
  const answered = blocks.map((b) => b[0]).join("\n");
  for (const part of ["wb-reader-sigil", "wb-reader-diagnostic", "wb-reader-chamber"]) {
    assert.ok(answered.includes(part), `${part} animates and is not named in any reduce block`);
  }
});

// ── Reflow: 320 wide, and 400% zoom, which is the same requirement ───────────

test("no rule pins a width the 320px viewport cannot hold", () => {
  // WCAG 1.4.10, and with it 1.4.4 at 400% — a 1280px viewport zoomed to 400% is 320px
  // of layout, so one floor answers both and there is no second number to keep.
  //
  // Media query conditions are excluded deliberately: `@media (min-width: 900px)` is a
  // question about the viewport, not a width imposed on a box, and the two read
  // identically to a regular expression.
  const FLOOR = 320;
  const offenders = [];
  for (const [file, css] of [["workbench.css", WORKBENCH], ["inspection.css", INSPECTION]]) {
    for (const line of css.split("\n")) {
      if (line.includes("@media") || line.includes("@container")) continue;
      // The lookbehind keeps `max-width` out of it. A max-width is a ceiling on a wide
      // screen and says nothing about a narrow one; a width or a min-width is a floor,
      // and a floor above 320 is what pushes the page sideways.
      for (const m of line.matchAll(/(?<![-\w])(min-width|width):\s*(\d+(?:\.\d+)?)px/g)) {
        if (Number(m[2]) > FLOOR) offenders.push(`${file}: ${line.trim()}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `these rules are wider than a ${FLOOR}px viewport:\n${offenders.join("\n")}`);
});

// ── Text spacing ─────────────────────────────────────────────────────────────

test("line height is left relative, so a person's own text spacing composes with it", () => {
  // WCAG 1.4.12. A reader who sets line-height to 1.5 in their own stylesheet gets
  // nothing if the page has already declared it in pixels — the number does not scale
  // with the text, and the two do not compose, they contradict.
  const offenders = [];
  for (const [file, css] of [["styles.css", STYLES], ["workbench.css", WORKBENCH], ["inspection.css", INSPECTION]]) {
    for (const m of css.matchAll(/line-height:\s*([^;]+);/g)) {
      if (/\d\s*px/.test(m[1])) offenders.push(`${file}: line-height: ${m[1].trim()}`);
    }
  }
  assert.deepEqual(offenders, [], `line height fixed in pixels:\n${offenders.join("\n")}`);
});

test("prose is allowed to wrap; only pills, meta lines and hidden text are held on one line", () => {
  // The other half of 1.4.12: spacing that a person widens has to have somewhere to go.
  // nowrap on a chip is a decision about a short label. nowrap on a sentence is a
  // horizontal scrollbar waiting for a wider word.
  const PROSE = /__(answer|prose|copy|body|text|lede|note|question|sentence|paragraph)\b/;
  const offenders = [];
  for (const [file, css] of [["workbench.css", WORKBENCH], ["inspection.css", INSPECTION]]) {
    for (const { selector, body } of rules(css)) {
      if (!/white-space:\s*nowrap/.test(body)) continue;
      if (PROSE.test(selector)) offenders.push(`${file}: ${selector}`);
    }
  }
  assert.deepEqual(offenders, [], `these hold prose on one line:\n${offenders.join("\n")}`);
});
