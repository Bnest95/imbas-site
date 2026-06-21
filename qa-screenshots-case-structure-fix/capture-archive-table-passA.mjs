import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'archive-table-passA');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:8792/archive.html', { waitUntil: 'load' });
await page.waitForSelector('.arc-ledger');
await new Promise((r) => setTimeout(r, 400));

const box = await page.evaluate(() => {
  const s = document.querySelector('.arc-ledger-wrap');
  const r = s.getBoundingClientRect();
  return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height };
});

await page.screenshot({
  path: path.join(outDir, 'archive-table-desktop-after-1440.png'),
  clip: box,
});

await browser.close();
console.log('Captured archive-table-passA');
