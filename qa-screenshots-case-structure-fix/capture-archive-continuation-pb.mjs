import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'archive-continuation-pb');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

for (const [name, width, height] of [
  ['desktop-after-1440', 1440, 900],
  ['mobile-after-375', 375, 812],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto('http://127.0.0.1:8792/archive.html', { waitUntil: 'load' });
  await page.waitForSelector('.arc-ledger');
  await page.evaluate(() =>
    document.querySelector('.arc-record--continuation')?.scrollIntoView({ block: 'center' }),
  );
  await new Promise((r) => setTimeout(r, 400));

  const box = await page.evaluate(() => {
    const ledger = document.querySelector('.arc-ledger');
    const r = ledger.getBoundingClientRect();
    return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height };
  });

  await page.screenshot({
    path: path.join(outDir, `archive-continuation-${name}.png`),
    clip: box,
  });
  await page.close();
}

await browser.close();
console.log('Captured archive-continuation-pb');
