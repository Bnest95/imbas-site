/* Proves the mechanism behind the two rows that moved: the recast is 28 characters
 * shorter, so at 390 the orientation line wraps to two rendered lines instead of three.
 * Measured in-page by swapping the text node back to the pre-recast string on a live
 * render and re-measuring — no file is touched. */
import { resolve } from "node:path";
import { chromiumLaunch, VIEWPORTS, SETTLE_MS, LANE } from "./shoot.mjs";

const OLD = "Each mark points at something in this answer, or at something that isn't in it. Imbas records what was there and what wasn't.";
const browser = await chromiumLaunch();
for (const [name, vp] of [["1440", VIEWPORTS.desktop], ["390", VIEWPORTS.mobile]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(`file://${resolve(LANE, "b/record.html")}?record=montana&forwarded=1`, { waitUntil: "load" });
  await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);
  const r = await page.evaluate((old) => {
    const el = document.querySelector('[data-zone="Z2.3"]');
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const now = { h: el.getBoundingClientRect().height, lines: el.getClientRects().length, text: el.textContent.trim() };
    const before = now.text;
    el.textContent = old;
    const then = { h: el.getBoundingClientRect().height, lines: el.getClientRects().length };
    el.textContent = before;
    return { lh, now, then };
  }, OLD);
  console.log(`${name}  line-height ${r.lh}  |  recast ${r.now.h}px  |  pre-recast ${r.then.h}px  |  delta ${(r.then.h - r.now.h).toFixed(2)}px  = ${((r.then.h - r.now.h) / r.lh).toFixed(2)} lines`);
  await ctx.close();
}
await browser.close();
