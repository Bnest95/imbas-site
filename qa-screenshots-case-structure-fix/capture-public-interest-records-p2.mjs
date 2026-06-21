import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'public-interest-records-p2');
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

async function capture(name, width, mode) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/public-interest.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.pi-records', { timeout: 10000 });
  await wait(400);
  if (mode === 'hero-records') {
    await clipShot(page, '.pi-masthead', '.pi-records', name);
  } else {
    await clipShot(page, '.pi-records', '.pi-tracking', name);
  }

  const report = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('.pi-section .pi-section__title')].map((h) =>
      h.textContent.trim()
    );
    const records = document.querySelector('.pi-records');
    const paras = [...records.querySelectorAll('.pi-record-note p')].map((p) => p.textContent.trim());
    return {
      sectionHeadings: sections,
      recordsParagraphs: paras,
      hasMeasurementSection: !!document.querySelector('.pi-measurement'),
      hasPublicInterestMeasurement: sections.includes('Public-interest measurement'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktopHero = await capture('public-interest-hero-records-desktop-1440.png', 1440, 'hero-records');
const desktopTransition = await capture('public-interest-records-tracking-desktop-1440.png', 1440, 'transition');
const mobileHero = await capture('public-interest-hero-records-mobile-375.png', 375, 'hero-records');
const mobileTransition = await capture('public-interest-records-tracking-mobile-375.png', 375, 'transition');

const report = { desktopHero, desktopTransition, mobileHero, mobileTransition };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
