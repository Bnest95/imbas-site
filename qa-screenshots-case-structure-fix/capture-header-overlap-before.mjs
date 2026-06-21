import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'header-overlap-pass/before');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const pages = [
  ['workbench.html', 'workbench-before-1440.png'],
  ['archive.html', 'archive-before-1440.png'],
  ['index.html', 'home-before-1440.png'],
  ['case/005.html', 'case-005-before-1440.png'],
  ['contact.html', 'contact-before-375.png', 375, 812],
];

for (const [slug, name, w = 1440, h = 900] of pages) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w <= 480 });
  await page.goto(`${base}/${slug}`, { waitUntil: 'domcontentloaded' });
  if (slug.includes('workbench')) {
    await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  await wait(500);
  await page.screenshot({ path: path.join(outDir, name) });
  await page.close();
}

await browser.close();
