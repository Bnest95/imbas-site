/* First-screen frames for B, which is the only thing the comprehension pass actually
 * claims about.
 *
 * capture.mjs already photographs every direction full-page under the governed
 * renderer, and it should keep doing that — a full-page frame is how you check that
 * nothing left the record. But a full-page frame cannot answer "what does a person
 * meet on arrival", and at 390 it is nine screens tall, so the one screen the ruling
 * is about is 11% of the image. These are the same four states the measurement
 * reports, cropped to exactly the fold, so the numbers in the table and the pixels in
 * the frame are the same event.
 *
 *   node build/glance.mjs            # writes screenshots/_glance-*.png
 */

import { resolve } from "node:path";
import { chromiumLaunch, LANE, RENDERER, SETTLE_MS } from "./shoot.mjs";

const STATES = [
  { name: "1440-opens", w: 1440, h: 1000, query: "" },
  { name: "1440-forwarded", w: 1440, h: 1000, query: "&forwarded=1" },
  { name: "390-opens", w: 390, h: 844, query: "" },
  { name: "390-forwarded", w: 390, h: 844, query: "&forwarded=1" },
];

const RECORD = process.argv[2] || "montana";

console.log(RENDERER);
const browser = await chromiumLaunch();

for (const s of STATES) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await ctx.newPage();
  await page.goto(`file://${resolve(LANE, "b", "record.html")}?record=${RECORD}${s.query}`, { waitUntil: "load" });
  await page.waitForSelector('html[data-ready="true"]', { timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(SETTLE_MS);

  /* fullPage:false is the whole point — this is the first screen, not the record. */
  const out = resolve(LANE, "screenshots", `_glance-b-${RECORD}-${s.name}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`  ${s.name.padEnd(16)} ${s.w}×${s.h}  →  ${out.split("/").pop()}`);
  await ctx.close();
}

await browser.close();
