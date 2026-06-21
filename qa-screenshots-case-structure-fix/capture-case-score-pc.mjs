import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'case-score-pc');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const [width, name] of [
  [1440, 'desktop-1440'],
  [375, 'mobile-375'],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto('http://127.0.0.1:8792/case/005.html', { waitUntil: 'load' });
  await page.waitForSelector('.case-score');
  await page.evaluate(() =>
    document.querySelector('.case-finding').scrollIntoView({ block: 'start' }),
  );
  await new Promise((r) => setTimeout(r, 400));

  const box = await page.evaluate(() => {
    const top = document.querySelector('.case-finding').getBoundingClientRect();
    const bottom = document.querySelector('.case-score__field').getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(top.left, bottom.left) - 12),
      y: top.top + scrollY - 12,
      width: Math.max(top.width, bottom.width) + 24,
      height: bottom.bottom - top.top + 24,
    };
  });

  await page.screenshot({
    path: path.join(outDir, `case-005-finding-score-${name}.png`),
    clip: box,
  });
  await page.close();
}

await browser.close();
console.log('Captured case-score-pc');
