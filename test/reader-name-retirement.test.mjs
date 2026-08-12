// The Reader was called the Workbench. The rename is the easy part; keeping it renamed
// is what this file is for.
//
// A name retirement fails quietly. Nothing breaks, no page 500s, no test goes red — a
// visitor just reads a word for a product that no longer goes by it, on one page out of
// thirty-three, or in one string compiled into a bundle nobody greps. And the surface it
// survives longest on is the one nobody edits: a share row written months ago, whose
// stored Source Label still says the old name and whose page prints whatever the row
// says. That row is a dated record and is never rewritten. So the name has to resolve at
// render time, and this file is where that resolution is held to.
//
// WHAT COUNTS AS A CONSUMER SURFACE. Three things: the HTML a visitor is served, the
// JavaScript those pages load, and the strings that JavaScript writes into the page. All
// three are checked here, and the second is enumerated FROM the pages rather than listed,
// so a page that starts loading a fourth script is covered the day it does.
//
// WHAT DOES NOT COUNT. Code comments, and the asset filenames workbench.css and
// workbench.bundle.js. Both are deliberate; see the tests that say so.
//
// Run: node --test test/reader-name-retirement.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// The retired name, assembled rather than written, so that a scan of this repo for the
// word does not have to except the file that retires it.
const RETIRED = "Work" + "bench";

// Every page a visitor can land on. docs/ and docs-archive/ hold dated records of an
// older tree and are not served.
const LIVE_PAGES = fs
  .readdirSync(ROOT, { recursive: true })
  .filter((p) => typeof p === "string" && p.endsWith(".html"))
  .filter((p) => !p.startsWith("docs") && !p.startsWith("node_modules") && !p.startsWith("."));

// The scripts the pages themselves load, taken from the pages. A hardcoded list would go
// stale the first time a page gained a script; this cannot. Split by whether the file is
// ours: one of these is served by the host and does not exist in the repo.
const LINKED_SCRIPTS = [
  ...new Set(
    LIVE_PAGES.flatMap((page) =>
      [...read(page).matchAll(/<script[^>]*\ssrc="\/([^"?]+\.js)/g)].map((m) => m[1]),
    ),
  ),
].sort();

const OURS = LINKED_SCRIPTS.filter((s) => fs.existsSync(path.join(ROOT, s)));
const VENDOR = LINKED_SCRIPTS.filter((s) => !fs.existsSync(path.join(ROOT, s)));

test("the pages a visitor is served do not name the retired product", () => {
  const offenders = LIVE_PAGES.filter((page) => read(page).includes(RETIRED));
  assert.deepEqual(
    offenders,
    [],
    `these pages still name the retired product: ${offenders.join(", ")}. ` +
      "A visitor reads the page, not the rename.",
  );
});

test("the two asset filenames keep the old spelling, on purpose", () => {
  // These are filenames, not product names, and they are load-bearing: inspection.html
  // and reader.html BOTH link the same stylesheet. Renaming the file to finish the rename
  // would 404 the stylesheet on the share page, which is a different page with a different
  // deploy risk and no reason to take it. This test exists so the next person to read the
  // test above does not treat these as an oversight.
  assert.ok(
    read("inspection.html").includes('href="/workbench.css'),
    "inspection.html no longer loads workbench.css — if the file was renamed, reader.html must move with it",
  );
  assert.ok(
    read("reader.html").includes('href="/workbench.css'),
    "reader.html no longer loads workbench.css",
  );
  assert.ok(
    read("reader.html").includes('src="/workbench.bundle.js"'),
    "reader.html no longer loads workbench.bundle.js",
  );
});

test("the only script this repo cannot read is the one the host injects", () => {
  // The check below reads each script off disk, so a linked script with no file behind it
  // would be skipped in silence. Exactly one is legitimately in that position — Vercel's
  // analytics, served by the platform. Anything else linked-but-absent is either a 404 on
  // a live page or a file this suite is failing to reach, and both want a person.
  assert.deepEqual(
    VENDOR,
    ["_vercel/insights/script.js"],
    "a page links a script that is not in this repo. Either it 404s in production, or it is " +
      "vendor code that needs its own line here saying so.",
  );
  assert.ok(OURS.length > 0, "no linked script resolved to a file, so the scan below checks nothing");
});

test("no script a page loads carries the retired name into the browser", () => {
  // workbench.bundle.js is compiled: esbuild strips comments, so any occurrence in it is
  // a live string, and the threshold is zero. inspection.js is the one exception, and it
  // is a narrow one — it must RECOGNIZE the old name to resolve it, which is the next
  // test. Everything else: zero, no exceptions, including scripts added later.
  for (const script of OURS) {
    if (script === "inspection.js") continue;
    const hits = read(script).split(RETIRED).length - 1;
    assert.equal(
      hits,
      0,
      `${script} carries the retired name ${hits} time(s). It is served to every visitor who loads a page that links it.`,
    );
  }
});

test("inspection.js names the retired product only where it has to recognize it", () => {
  // Two allowances, both narrow: a comment, or a key of the lookup that retires the name.
  // A key is the stored spelling being matched, never the spelling being printed. Any
  // third place is a string on its way to the page.
  const keys = Object.keys(loadLabelResolver().SOURCE_LABEL);
  const stray = read("inspection.js")
    .split("\n")
    .map((line, i) => [i + 1, line])
    .filter(([, line]) => line.includes(RETIRED))
    .filter(([, line]) => !/^\s*\/\//.test(line))
    .filter(([, line]) => !keys.some((k) => line.includes(`"${k}":`)));
  assert.deepEqual(
    stray.map(([n, line]) => `${n}: ${line.trim()}`),
    [],
    "inspection.js holds the retired name somewhere that is neither a comment nor a lookup key, " +
      "which means it can reach the page.",
  );
});

// ── The share page, executed ─────────────────────────────────────────────────
//
// inspection.js is a plain browser script — no imports, no exports, and it calls main()
// at the bottom — so the functions under test are lifted out of the SHIPPED file and
// evaluated, following test/share-record-composition.test.mjs. The boundaries are symbol
// names, not line numbers. What is asserted is the HTML the page emits and the text the
// copy button puts on the clipboard, because a source scan would prove only that the file
// contains the right words, which is also true of a string nothing renders.

function loadLegacyRenderer() {
  const src = read("inspection.js");
  const end = src.indexOf("function wireCopyLink()");
  assert.ok(end > 0, "could not find the end boundary in inspection.js");
  const body =
    src.slice(0, end) +
    "\nfunction wireCopyLink() {}\nfunction wireReport() {}\n" +
    "return { renderLegacy, formatShareCopy, sourceLabel, SOURCE_LABEL, mastHtml };";
  const doc = { getElementById: () => null };
  const win = { location: { href: "https://www.imbaslabs.com/inspection/Ab3xQ7zK9mNpR2sTuV4w" } };
  return new Function("document", "window", "navigator", body)(doc, win, {});
}

function loadLabelResolver() {
  return loadLegacyRenderer();
}

// A pre-P4 share row as recordToPublic hands it to the page, with the Source Label the
// old writer stored. Nothing about this row is hypothetical: rows in this shape are
// published and reachable today.
function legacyRecord(over = {}) {
  return {
    share_id: "Ab3xQ7zK9mNpR2sTuV4w",
    mode: "legacy",
    source_label: `${RETIRED} inspection`,
    case_label: "",
    question: "What are my rights if my landlord keeps my security deposit?",
    answer: "A landlord must return a security deposit within 30 days of the tenant moving out.",
    the_read: "The answer states one deadline for a rule that varies by state.",
    what_was_left_out: ["The deadline is set by state law and varies."],
    how_it_was_shaped: "The closing line lowers the stakes of the question that was asked.",
    boundary: "This record covers one answer from one system on one day.",
    ...over,
  };
}

function renderedLegacy(rec) {
  const R = loadLegacyRenderer();
  const root = { innerHTML: "" };
  R.renderLegacy(root, rec);
  return root.innerHTML;
}

test("a share published under the old name renders under the current one", () => {
  const html = renderedLegacy(legacyRecord());
  assert.ok(
    !html.includes(RETIRED),
    "the rendered share page prints the retired name. The row keeps what it stored; the page prints the product's name.",
  );
  assert.ok(
    html.includes("Reader inspection"),
    "the provenance line lost the source label entirely. Resolving a name is not the same as dropping it.",
  );
});

test("the paired spelling resolves too, and so does the receipt the visitor copies", () => {
  const paired = legacyRecord({ source_label: `${RETIRED} two-question test` });
  const html = renderedLegacy(paired);
  assert.ok(!html.includes(RETIRED), "the paired legacy label reaches the page unresolved");
  assert.ok(html.includes("Reader two-question test"), "the paired label did not resolve to its current name");

  // The copy button is a second consumer surface with its own composition. A record that
  // reads correctly on screen and wrong on the clipboard is still wrong.
  const R = loadLegacyRenderer();
  const copied = R.formatShareCopy(legacyRecord(), "https://www.imbaslabs.com/inspection/Ab3xQ7zK9mNpR2sTuV4w");
  assert.ok(!copied.includes(RETIRED), "the copied receipt carries the retired name");
  assert.ok(copied.includes("Source: Reader inspection"), "the copied receipt lost its source line");
});

test("a label the map has never seen prints itself rather than vanishing", () => {
  // The same property MEASURE_FINDING_LABEL has, and for the same reason: this page has to
  // stay open to a label that did not exist when it was written. A map that returned "" for
  // an unknown key would silently erase provenance on a future row.
  const { sourceLabel } = loadLegacyRenderer();
  assert.equal(sourceLabel("Reader inspection"), "Reader inspection");
  assert.equal(sourceLabel("Some label written in 2027"), "Some label written in 2027");
  assert.equal(sourceLabel(""), "Reader inspection", "an empty label falls back to the current name");
  assert.equal(sourceLabel(undefined), "Reader inspection");
});

test("no board scenario expects the retired name on screen", () => {
  // Found by the board rather than by this file, which is why it is now in this file.
  // share-single asserted the text "<retired> inspection" because that was the page's
  // eyebrow; the rename moved the eyebrow and left the assertion behind, and the board
  // failed at capture time — correctly, and one commit later than it needed to.
  //
  // A scenario's assertText and waitForText are claims about what a visitor reads. They
  // are the only strings in the harness that are, so they are the only ones checked here:
  // a comment in the harness naming the old product is a comment, and this does not reach
  // for it.
  const scenarios = read("scripts/qa/scenarios.mjs");
  const claims = [
    ...scenarios.matchAll(/(?:assertText|waitForText|assertScenarioText)\s*:\s*(\[[\s\S]*?\]|"(?:[^"\\]|\\.)*")/g),
  ].map((m) => m[1]);
  assert.ok(claims.length > 0, "no rendered-text expectations were found, so this test checks nothing");
  const offenders = claims.filter((c) => c.includes(RETIRED));
  assert.deepEqual(
    offenders,
    [],
    `a board scenario expects the retired name in rendered text: ${offenders.join(" | ")}. ` +
      "Either the page still prints it, or the scenario is asserting against a page that no longer exists.",
  );
});

test("nothing written from today forward stores the retired name", () => {
  // The resolution above is for rows that already exist. New rows must not need it.
  const writer = read("api/inspection-share.js");
  assert.ok(!writer.includes(`"${RETIRED}`), "the share writer still stores the retired name on new rows");
  assert.ok(
    writer.includes(`mode === "paired" ? "Reader two-question test" : "Reader inspection"`),
    "the share writer no longer names the source at all, or names it differently",
  );
});
