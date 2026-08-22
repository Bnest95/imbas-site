/* Why two of A's 390 rows moved the claim DOWN when the recast made a string shorter.
 *
 *   node build/a-recentre-probe.mjs
 *
 * A's masthead is `min-height: 100vh` (a/a.css `.a-mast`) and its body is a centered
 * flex column (`.a-mast-body { flex: 1; justify-content: center }`). While the content
 * is shorter than the viewport the masthead's height is pinned, so removing a line of
 * text does not shorten the masthead — it enlarges the free space inside it, and
 * centering splits that space in half above and below. Every element in the centered
 * body therefore moves DOWN by half a line. Nothing below the masthead moves at all,
 * because the masthead did not change height.
 *
 * Once the content exceeds 100vh the min-height stops binding, centering has no free
 * space to split, and the same edit behaves the ordinary way: everything below the
 * shortened line moves up by a full line.
 *
 * That is the whole of the +11px, and it predicts its own sign, its own magnitude and
 * which rows it applies to. This measures all three by swapping the text node back to
 * the pre-recast string on a live render. No file is edited to run it.
 */
import { resolve } from "node:path";
import { chromiumLaunch, VIEWPORTS, SETTLE_MS, LANE } from "./shoot.mjs";

const OLD = "Each mark points at something in this answer, or at something that isn't in it. Imbas records what was there and what wasn't.";

/* Inlined rather than passed as an argument: page.evaluate only binds arguments when it
 * is handed a function, and every other probe in this lane hands it an expression
 * string. Handing one an argument silently evaluates to the uncalled function. */
const PROBE = `(() => {
  const old = ${JSON.stringify(OLD)};
  const top = (e) => (e ? e.getBoundingClientRect().top + window.scrollY : null);
  const orient = document.querySelector('[data-zone="Z2.3"]');
  const claim = document.querySelector('[data-zone="Z1.4"]');
  const mast = document.querySelector(".a-mast");
  const src = document.querySelector("[data-source-body]");
  if (!orient || !claim || !mast) return { absent: !orient ? "Z2.3" : !claim ? "Z1.4" : ".a-mast" };
  const read = () => ({ claim: top(claim), mast_h: mast.getBoundingClientRect().height, source: top(src), orient_h: orient.getBoundingClientRect().height });
  const now = read();
  const keep = orient.textContent;
  orient.textContent = old;
  const then = read();
  orient.textContent = keep;
  return { now, then, vh: window.innerHeight, pinned_now: Math.abs(now.mast_h - window.innerHeight) < 1, pinned_then: Math.abs(then.mast_h - window.innerHeight) < 1 };
})()`;

const browser = await chromiumLaunch();
const out = [];
for (const [view, vp] of [["1440", VIEWPORTS.desktop], [" 390", VIEWPORTS.mobile]]) {
  for (const rec of ["deposit", "furnace"]) {
    for (const [arrival, q] of [["as it opens", ""], ["forwarded cold", "&forwarded=1"]]) {
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: "dark" });
      const page = await ctx.newPage();
      await page.goto(`file://${resolve(LANE, "a/record.html")}?record=${rec}${q}`, { waitUntil: "load" });
      await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(SETTLE_MS);
      const r = await page.evaluate(PROBE);
      out.push({ view, rec, arrival, ...r });
      await ctx.close();
    }
  }
}
await browser.close();

const f = (n) => (n === null ? "  —  " : n.toFixed(2).padStart(8));
console.log("view  record   arrival          masthead pinned?  claim pre→post      Δclaim   source pre→post     Δsource");
for (const r of out) {
  if (r.absent) { console.log(`${r.view}  ${r.rec.padEnd(8)} ${r.arrival.padEnd(15)} ${r.absent} does not render in this state`); continue; }
  const dc = r.now.claim - r.then.claim;
  const ds = r.now.source - r.then.source;
  console.log(
    `${r.view}  ${r.rec.padEnd(8)} ${r.arrival.padEnd(15)} ${(r.pinned_then ? "pinned" : "free").padEnd(7)}→${(r.pinned_now ? "pinned" : "free").padEnd(8)}` +
    `${f(r.then.claim)}→${f(r.now.claim)} ${(dc >= 0 ? "+" : "") + dc.toFixed(2).padStart(7)}  ${f(r.then.source)}→${f(r.now.source)} ${(ds >= 0 ? "+" : "") + ds.toFixed(2).padStart(7)}`
  );
}
