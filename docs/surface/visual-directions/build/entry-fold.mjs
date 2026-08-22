/* The entry rule, measured.
 *
 *   node build/entry-fold.mjs
 *
 * "Neither of the first two may obscure the other." The two routes are the reader's
 * own answer (Z8.1, the paste field) and the recorded pair (Z8.3, the mechanism).
 * The rule is decidable: in both the empty and the answer state, at both viewports,
 * some part of each route has to fall inside the first screen.
 *
 * Reported, not asserted — a route whose top edge sits one pixel above the fold is
 * technically visible and practically hidden, so the offsets are printed too.
 */

import { resolve } from "node:path";
import { chromiumLaunch, VIEWPORTS, SETTLE_MS, LANE } from "./shoot.mjs";

const browser = await chromiumLaunch();
const rows = [];

for (const dir of ["a", "b", "c"]) {
  for (const state of ["empty", "answer", "shared"]) {
    for (const view of ["desktop", "mobile"]) {
      const ctx = await browser.newContext({ viewport: VIEWPORTS[view], deviceScaleFactor: 1, colorScheme: "dark" });
      const page = await ctx.newPage();
      await page.goto(`file://${resolve(LANE, dir, "entry.html")}?state=${state}`, { waitUntil: "load" });
      await page.waitForSelector('html[data-ready="true"]');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(SETTLE_MS);

      const r = await page.evaluate(() => {
        const box = (sel) => {
          const n = document.querySelector(sel);
          if (!n) return null;
          const b = n.getBoundingClientRect();
          return { top: Math.round(b.top), bottom: Math.round(b.bottom) };
        };
        return { paste: box('[data-zone="Z8.1"]'), mech: box('[data-zone="Z8.3"]'), fold: window.innerHeight };
      });

      const vis = (b) => (b ? b.top < r.fold && b.bottom > 0 : null);
      rows.push({ dir, state, view, fold: r.fold, paste: r.paste, mech: r.mech, paste_in_fold: vis(r.paste), mech_in_fold: vis(r.mech) });
      await ctx.close();
    }
  }
}
await browser.close();

let short = 0;
console.log("dir state    view      fold   Z8.1 paste        Z8.3 mechanism");
for (const r of rows) {
  const f = (b, ok) => (b ? `${String(b.top).padStart(5)}→${String(b.bottom).padStart(5)} ${ok ? "in " : "OUT"}` : "     absent      ");
  /* The shared state is a third route and the rule names only the first two, so a
   * missing box there is reported without being counted short. */
  if (r.state !== "shared" && (r.paste_in_fold === false || r.mech_in_fold === false)) short += 1;
  console.log(`${r.dir}   ${r.state.padEnd(8)} ${r.view.padEnd(8)} ${String(r.fold).padStart(4)}   ${f(r.paste, r.paste_in_fold)}  ${f(r.mech, r.mech_in_fold)}`);
}
console.log(`\n${rows.length} entry screens · ${short} with a route past the fold`);
