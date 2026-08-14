// The mobile menu button, on the two pages that now get it from site-header.js.
// Run: node --test test/mobile-nav-contract.test.mjs
//
// #primary-nav.is-open is position:fixed, inset:0, 100dvh — a full-screen panel. Every
// page opened it by toggling one class and one aria attribute, but only four of them
// also locked body scroll, swapped the button label, and closed the panel when a link
// was followed. On the Reader and on a shared inspection that gap is felt: the document
// keeps scrolling behind the panel, the button still says "Menu" while the panel it
// would close is covering the screen, and following a link leaves the panel open over
// the page you asked for.
//
// So those two pages deleted their inline block and marked the button instead, and
// site-header.js — which all 26 pages already load — supplies the whole contract. The
// marker is load-bearing rather than decorative: site-header.js is deferred, so an
// unconditional listener there would register second and toggle is-open straight back
// closed on the 24 pages that still bind their own. Half these tests exist to hold that
// line, because the failure is silent — the menu button simply stops working.
//
// The behavior below runs the real source lifted out of site-header.js. It is an IIFE
// with no exports, so the two functions are sliced out by name and given a DOM stub
// carrying only the surface they touch. The stub is small on purpose; anything it has
// to grow to support is a sign the functions reached further than they should.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

const HEADER_SRC = read("site-header.js");
const SHARED_PAGES = ["reader.html", "inspection.html"];

// Every page a visitor can land on, same enumeration reader-route.test.mjs uses.
const LIVE_PAGES = fs
  .readdirSync(ROOT, { recursive: true })
  .filter((p) => typeof p === "string" && p.endsWith(".html"))
  .filter((p) => !p.startsWith("docs") && !p.startsWith("node_modules") && !p.startsWith("."));

// ── Lifting the real source ──────────────────────────────────────────────────
// One function at a time, from its declaration to the next one at the same depth.
function lift(src, name) {
  const start = src.indexOf(`\n  function ${name}(`);
  assert.notEqual(start, -1, `site-header.js no longer declares ${name}`);
  const rest = src.indexOf("\n  function ", start + 1);
  return src.slice(start, rest === -1 ? src.length : rest);
}

function element(tag, attrs = {}) {
  const classes = new Set();
  const listeners = new Map();
  const el = {
    tag,
    attrs: { ...attrs },
    textContent: "",
    focusCount: 0,
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
    },
    setAttribute: (k, v) => {
      el.attrs[k] = String(v);
    },
    getAttribute: (k) => (k in el.attrs ? el.attrs[k] : null),
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    fire: (type, event = {}) => {
      (listeners.get(type) || []).forEach((fn) => fn(event));
    },
    bound: (type) => (listeners.get(type) || []).length,
    focus: () => {
      el.focusCount += 1;
    },
    querySelectorAll: () => [],
  };
  return el;
}

// A page: one menu button, one nav holding two links, one body. `marked` is whether the
// page opted in, which is the only thing that decides if any of this binds at all.
function page({ marked = true } = {}) {
  const btn = element("button", { "aria-expanded": "false" });
  if (marked) btn.attrs["data-shared-nav"] = "";
  btn.textContent = "Menu";

  const links = [element("a"), element("a")];
  const nav = element("nav");
  nav.querySelectorAll = (sel) => (sel === "a" ? links.slice() : []);

  const body = element("body");
  const docListeners = new Map();
  const document = {
    body,
    querySelector: (sel) => {
      if (sel === ".nav__menu-btn[data-shared-nav]") return marked ? btn : null;
      if (sel === ".nav__menu-btn") return btn;
      return null;
    },
    getElementById: (id) => (id === "primary-nav" ? nav : null),
    addEventListener: (type, fn) => {
      if (!docListeners.has(type)) docListeners.set(type, []);
      docListeners.get(type).push(fn);
    },
    fire: (type, event = {}) => {
      (docListeners.get(type) || []).forEach((fn) => fn(event));
    },
  };

  const initMobileNav = new Function(
    "document",
    `${lift(HEADER_SRC, "closeMobileNav")}\n${lift(HEADER_SRC, "initMobileNav")}\nreturn initMobileNav;`,
  )(document);
  initMobileNav();

  return {
    document,
    btn,
    nav,
    links,
    body,
    open: () => btn.fire("click"),
    escape: () => document.fire("keydown", { key: "Escape" }),
    // Every property of the contract, read at once, so a test states the whole state
    // rather than the one bit it happens to care about.
    state: () => ({
      panel: nav.classList.contains("is-open"),
      expanded: btn.getAttribute("aria-expanded"),
      label: btn.textContent,
      scrollLocked: body.classList.contains("nav-open"),
    }),
  };
}

const SHUT = { panel: false, expanded: "false", label: "Menu", scrollLocked: false };
const OPEN = { panel: true, expanded: "true", label: "Close", scrollLocked: true };

// ── The contract, driven ─────────────────────────────────────────────────────

test("the button opens the panel, locks scroll, and says what it will do next", () => {
  const p = page();
  assert.deepEqual(p.state(), SHUT);
  p.open();
  assert.deepEqual(p.state(), OPEN);
});

test("the same button closes it, and everything it changed goes back", () => {
  const p = page();
  p.open();
  p.open();
  assert.deepEqual(p.state(), SHUT);
});

test("scroll never stays locked under a closed panel, across repeated use", () => {
  const p = page();
  for (let i = 0; i < 4; i++) {
    p.open();
    assert.equal(p.state().scrollLocked, true, "open should lock the document");
    p.open();
    assert.equal(p.state().scrollLocked, false, "close should release it");
  }
});

test("Escape closes the panel and hands focus back to the button that opened it", () => {
  const p = page();
  p.open();
  p.escape();
  assert.deepEqual(p.state(), SHUT);
  assert.equal(p.btn.focusCount, 1);
});

test("Escape with the panel already closed moves nothing, including focus", () => {
  // The panel is closed most of the time. A handler that fired anyway would pull focus
  // out of whatever the reader was doing every time they dismissed something else.
  const p = page();
  p.escape();
  assert.deepEqual(p.state(), SHUT);
  assert.equal(p.btn.focusCount, 0);
});

test("following a link closes the panel it was covered by", () => {
  const p = page();
  p.open();
  p.links[0].fire("click");
  assert.deepEqual(p.state(), SHUT);
});

test("every link the page shipped closes it, not just the first", () => {
  for (const i of [0, 1]) {
    const p = page();
    p.open();
    p.links[i].fire("click");
    assert.equal(p.state().panel, false, `link ${i} left the panel open`);
  }
});

test("a link clicked while the panel is shut leaves the document scrollable", () => {
  // Desktop: the panel is never open, and the same listener still runs on every link.
  const p = page();
  p.links[0].fire("click");
  assert.deepEqual(p.state(), SHUT);
});

// ── The opt-in, which is what keeps the other 24 pages working ───────────────

test("an unmarked button binds nothing at all", () => {
  const p = page({ marked: false });
  assert.equal(p.btn.bound("click"), 0, "site-header.js bound a page that owns its own toggle");
  p.open();
  assert.deepEqual(p.state(), SHUT);
});

test("no marked page also ships an inline handler for the same button", () => {
  // Two click listeners on one button is not a duplicate: the inline one registers
  // first and toggles is-open on, the shared one runs second and toggles it back off,
  // and the menu silently stops opening.
  const offenders = LIVE_PAGES.filter((rel) => {
    const html = read(rel);
    return html.includes("data-shared-nav") && html.includes("querySelector('.nav__menu-btn')");
  });
  assert.deepEqual(offenders, [], "these pages would bind the menu button twice");
});

test("every page still gets its menu button from exactly one place", () => {
  const unbound = LIVE_PAGES.filter((rel) => {
    const html = read(rel);
    if (!html.includes("nav__menu-btn")) return false;
    return !html.includes("data-shared-nav") && !html.includes("querySelector('.nav__menu-btn')");
  });
  assert.deepEqual(unbound, [], "these pages render a menu button nothing binds");
});

test("the Reader and a shared inspection both take the shared contract", () => {
  for (const rel of SHARED_PAGES) {
    const html = read(rel);
    assert.match(
      html,
      /<button class="nav__menu-btn" data-shared-nav /,
      `${rel} no longer opts in to the shared mobile nav`,
    );
    assert.ok(html.includes('src="/site-header.js"'), `${rel} does not load site-header.js`);
  }
});

test("the shared init runs before the nav is added to, so links bind once", () => {
  // ensureNavMore and ensureMobileFieldNotesNav inject links and bind closeMobileNav to
  // them themselves. Running after either would bind those links a second time.
  const order = ["initMobileNav()", "ensureNavMore()", "ensureMobileFieldNotesNav()"].map((call) =>
    HEADER_SRC.indexOf(`\n    ${call};`),
  );
  assert.ok(order.every((i) => i !== -1), "init() no longer calls all three in sequence");
  assert.deepEqual([...order].sort((a, b) => a - b), order, "initMobileNav must be called first");
});
