/* Does the 390 density default move anything the acceptance table records?
 *
 *   node build/density-probe.mjs
 *
 * The founder ruled overview-first at 390 and told me to check the mechanism's actual
 * state rather than guess it. Two things need proving, and only one of them is a
 * lookup.
 *
 * The lookup: kit.js boots every page at density "consumer" from one DEFAULTS object,
 * with no viewport condition anywhere. Consumer is the overview state — fields(), the
 * kit's single field-list authority, adds rows for "professional" and removes none for
 * "consumer". So the current default at 390 already is overview-first, and at 1440 too.
 *
 * The thing worth measuring: whether the ruling could have moved a number even in
 * principle. Density adds fields inside register entries at Z5.4, which sit below the
 * source column and below the first mark — so it should be unable to touch the finding,
 * the answer, the first mark or claim-to-proof, and should show up only in page height.
 * "Should" is an argument. This renders both densities at both viewports and diffs the
 * measured columns, so the acceptance floor freezes on a table that is known to be
 * density-independent rather than assumed to be.
 *
 * The forwarded arrival is not parameterised here because it cannot be: canonical()
 * discards the runner's density on a forwarded record and opens at full annotation, per
 * S1. That is the guarantee, not a default, so the only state where the ruling has any
 * purchase is "as it opens".
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromiumLaunch, VIEWPORTS, SETTLE_MS, LANE, RENDERER } from "./shoot.mjs";

const RECORDS = ["montana", "deposit"];
const VIEWS = [["1440", VIEWPORTS.desktop], ["390", VIEWPORTS.mobile]];
const DENSITIES = ["consumer", "professional"];

const MEASURE = `(() => {
  const vis = (e) => e.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true });
  const top = (e) => (e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null);
  const finding = document.querySelector('[data-zone="Z1.4"]');
  const source = document.querySelector("[data-source-body]");
  const firstMark = document.querySelector("[data-mark]");
  let blocks = 0;
  const stop = source;
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = walk.nextNode())) {
    if (stop && (n === stop || stop.contains(n))) break;
    if (!vis(n)) continue;
    if (n.children.length) continue;
    if (!n.textContent.trim()) continue;
    blocks++;
  }
  return {
    finding: top(finding),
    answer: top(source),
    mark: top(firstMark),
    density: document.documentElement.getAttribute("data-density"),
    /* Visible, not present. Every field renders into the DOM at both densities and the
     * professional-only rows are hidden in CSS, so counting nodes returns the same
     * number twice and reads as "density does nothing" — the opposite of the truth. */
    fields: Array.from(document.querySelectorAll("[data-field]")).filter(vis).length,
    page: document.documentElement.scrollHeight,
  };
})()`;

const browser = await chromiumLaunch();
const rows = [];

for (const [view, vp] of VIEWS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await ctx.newPage();
  for (const rec of RECORDS) {
    for (const density of DENSITIES) {
      await page.goto(`file://${resolve(LANE, "b/record.html")}?record=${rec}&density=${density}`, { waitUntil: "load" });
      await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(SETTLE_MS);
      const m = await page.evaluate(MEASURE);
      rows.push({ record: rec, view, requested: density, ...m, in_fold: m.answer < vp.height });
    }
  }
  await ctx.close();
}
await browser.close();

/* Every column the acceptance table records, compared across the two densities. */
const COLS = ["finding", "answer", "mark", "in_fold"];
const diffs = [];
for (const rec of RECORDS) {
  for (const [view] of VIEWS) {
    const c = rows.find((r) => r.record === rec && r.view === view && r.requested === "consumer");
    const p = rows.find((r) => r.record === rec && r.view === view && r.requested === "professional");
    for (const col of COLS) if (c[col] !== p[col]) diffs.push({ record: rec, view, column: col, consumer: c[col], professional: p[col] });
  }
}

writeFileSync(resolve(LANE, "shared/density-probe.json"), JSON.stringify({
  question: "Does the overview-first / full-first choice at 390 move any measured column?",
  renderer: RENDERER,
  boot_default: "consumer, from one DEFAULTS object in shared/kit.js, with no viewport condition",
  overview_is: "consumer — fields() adds rows for professional and removes none for consumer",
  forwarded: "not parameterised — canonical() forces professional on a forwarded record, per S1",
  measured_columns_that_differ: diffs,
  rows,
}, null, 2) + "\n");

const pad = (s, n) => String(s).padEnd(n);
console.log(pad("record", 9) + pad("view", 6) + pad("density", 14) + pad("fields", 8) + pad("finding", 9) + pad("answer", 8) + pad("mark", 7) + pad("in fold", 9) + "page");
for (const r of rows) {
  console.log(pad(r.record, 9) + pad(r.view, 6) + pad(r.density, 14) + pad(r.fields, 8) + pad(r.finding, 9) + pad(r.answer, 8) + pad(r.mark, 7) + pad(r.in_fold ? "yes" : "no", 9) + r.page);
}
console.log(`\nmeasured columns that differ across density: ${diffs.length}`);
for (const d of diffs) console.log(`  ! ${d.record} ${d.view} ${d.column}: ${d.consumer} vs ${d.professional}`);
process.exit(diffs.length === 0 ? 0 : 1);
