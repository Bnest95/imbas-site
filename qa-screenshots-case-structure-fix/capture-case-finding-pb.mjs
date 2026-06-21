import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'case-finding-pb');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const [slug, width, name] of [
  ['005', 1440, 'desktop-1440'],
  ['005', 375, 'mobile-375'],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(`http://127.0.0.1:8792/case/${slug}.html`, { waitUntil: 'load' });
  await page.waitForSelector('.case-finding');
  await page.evaluate(() =>
    document.querySelector('.case-finding').scrollIntoView({ block: 'center' }),
  );
  await new Promise((r) => setTimeout(r, 400));

  const box = await page.evaluate(() => {
    const el = document.querySelector('.case-finding');
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, r.left - 12),
      y: r.top + scrollY - 12,
      width: r.width + 24,
      height: r.height + 24,
    };
  });

  await page.screenshot({
    path: path.join(outDir, `case-${slug}-finding-${name}.png`),
    clip: box,
  });
  await page.close();
}

await browser.close();
console.log('Captured case-finding-pb');
