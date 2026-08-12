// --ink-dim is consumed by workbench.css and declared by nothing. That reads like fourteen
// dead lines, and for eight of them it was. The other six draw the page: an undeclared
// custom property does not drop its declaration from the cascade, so the declaration wins,
// resolves to `inherit`, and masks whatever would otherwise have won on that element.
//
// Finding that out cost two full board runs and a scripted browser session. These hold the
// result so the next pass reading "undeclared token, delete it" pays for it once.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKBENCH_CSS = fs.readFileSync(path.join(ROOT, "workbench.css"), "utf8");
const STYLES_CSS = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");

// The six that stay, each with the declaration it masks and how that was read. A seventh
// entry here means someone added a consumer without measuring it; one fewer means someone
// deleted a consumer the board or the renderer said was drawing.
const LOAD_BEARING = [
  { selector: ".wb-return__dismiss", element: "button", masks: "UA color: buttontext", read: "renderer" },
  { selector: ".wb-funnel__note", element: "p", masks: "styles.css p { color: var(--ink-soft) }", read: "renderer" },
  { selector: ".wb-demo__context", element: "p", masks: "styles.css p { color: var(--ink-soft) }", read: "renderer" },
  { selector: ".wb-loop__panel-body--muted", element: "p", masks: ".wb-loop__panel-body", read: "board" },
  { selector: ".wb-demo__smallprint", element: "p", masks: "styles.css p { color: var(--ink-soft) }", read: "board" },
  { selector: ".wb-demo__close", element: "button", masks: "UA color: buttontext", read: "board" },
];

test("the token is still undeclared, which is the premise everything here rests on", () => {
  // If someone declares --ink-dim, every one of these declarations becomes valid and the
  // six below stop masking anything. That is a fix, not a regression — but it is a ruling,
  // and this is where it gets noticed rather than absorbed.
  for (const [name, css] of [["workbench.css", WORKBENCH_CSS], ["styles.css", STYLES_CSS]]) {
    assert.ok(
      !/^\s*--ink-dim\s*:/m.test(css),
      `${name} now declares --ink-dim. Six rules were retained only because it does not.`,
    );
  }
});

test("exactly the six measured consumers remain, and no unmeasured one joined them", () => {
  const uses = WORKBENCH_CSS.match(/color: var\(--ink-dim\);/g) ?? [];
  assert.equal(
    uses.length,
    LOAD_BEARING.length,
    `workbench.css consumes --ink-dim ${uses.length} times, and ${LOAD_BEARING.length} consumers were measured. ` +
      "A new one has to be read against the renderer before it ships, because the declaration masks whatever it lands on.",
  );

  for (const { selector, masks } of LOAD_BEARING) {
    const at = WORKBENCH_CSS.indexOf(`${selector} {`);
    assert.ok(at >= 0, `${selector} is gone from workbench.css`);
    const body = WORKBENCH_CSS.slice(at, WORKBENCH_CSS.indexOf("\n}", at));
    assert.ok(
      body.includes("color: var(--ink-dim);"),
      `${selector} lost its --ink-dim declaration. It was masking ${masks}; deleting it changes what renders.`,
    );
  }
});

test("the rule each one masks is still there to be masked", () => {
  // The retention argument is only true while the masked declaration exists. If the base
  // rule moves or loses its color, the survivor is masking nothing and becomes deletable —
  // but that has to be re-measured, not assumed, so it fails here first.
  assert.ok(
    /^p \{[^}]*color: var\(--ink-soft\)/m.test(STYLES_CSS),
    "styles.css no longer gives a bare p its color. Three retained consumers were masking that rule.",
  );
  assert.ok(
    /--ink-soft:\s*#D4CFC2/i.test(STYLES_CSS),
    "--ink-soft moved off #D4CFC2, which is the colour those three <p> elements take when unmasked.",
  );
  const base = WORKBENCH_CSS.indexOf(".wb-loop__panel-body {");
  assert.ok(base >= 0, ".wb-loop__panel-body is gone");
  assert.ok(
    WORKBENCH_CSS.slice(base, WORKBENCH_CSS.indexOf("\n}", base)).includes("color: rgba(228, 216, 200, 0.92)"),
    ".wb-loop__panel-body no longer sets a color, so --muted above it is masking nothing.",
  );
  // Source order is half of why --muted wins: same specificity, later wins.
  assert.ok(
    WORKBENCH_CSS.indexOf(".wb-loop__panel-body--muted {") > base,
    ".wb-loop__panel-body--muted moved above the rule it masks, so the mask no longer holds.",
  );
});

test("each retained consumer carries the reading that retained it", () => {
  // A bare `color: var(--ink-dim)` with no note is indistinguishable from the eight that
  // were deleted. The note is what stops the next reader from deleting it again.
  for (const { selector } of LOAD_BEARING) {
    const at = WORKBENCH_CSS.indexOf(`${selector} {`);
    const before = WORKBENCH_CSS.slice(0, at);
    const comment = before.lastIndexOf("*/");
    assert.ok(
      comment >= 0 && before.slice(comment).trim() === "*/",
      `${selector} has no comment immediately above it saying why it was kept.`,
    );
  }
});
