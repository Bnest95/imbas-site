import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'public-interest-tracking-p3');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function clipShot(page, startSel, endSel, filename) {
  const box = await page.evaluate((start, end) => {
    const s = document.querySelector(start);
    const e = document.querySelector(end);
    if (!s || !e) return null;
    const r1 = s.getBoundingClientRect();
    const r2 = e.getBoundingClientRect();
    const top = r1.top + window.scrollY;
    const bottom = r2.bottom + window.scrollY;
    const left = Math.min(r1.left, r2.left);
    const right = Math.max(r1.right, r2.right);
    return {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: right - left,
      height: bottom - top,
    };
  }, startSel, endSel);
  if (!box) throw new Error(`Missing clip targets for ${filename}`);
  await page.screenshot({ path: path.join(outDir, filename), clip: box });
}

async function capture(filename, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/public-interest.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.pi-tracking', { timeout: 10000 });
  await wait(400);
  await clipShot(page, '.pi-tracking', '.pi-tracking', filename);

  const report = await page.evaluate(() => {
    const tracking = document.querySelector('.pi-tracking');
    const heading = tracking.querySelector('.pi-section__title')?.textContent.trim();
    const paras = [...tracking.querySelectorAll('.pi-record-note p')].map((p) => p.textContent.trim());
    const sections = [...document.querySelectorAll('.pi-section .pi-section__title')].map((h) =>
      h.textContent.trim()
    );
    return {
      heading,
      trackingParagraphs: paras,
      sectionHeadings: sections,
      hasOldHeading: sections.includes('Why tracking this matters'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await capture('public-interest-tracking-desktop-1440.png', 1440);
const mobile = await capture('public-interest-tracking-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
