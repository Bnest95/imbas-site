import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'institutions-value-bridge-p1b');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function clipShot(page, startSelector, endSelector, filename) {
  await page.goto(`${base}/institutions.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.inst-value-bridge', { timeout: 10000 });
  await wait(400);
  const box = await page.evaluate((startSel, endSel) => {
    const start = document.querySelector(startSel);
    const end = document.querySelector(endSel);
    if (!start || !end) return null;
    const r1 = start.getBoundingClientRect();
    const r2 = end.getBoundingClientRect();
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
  }, startSelector, endSelector);
  if (!box) throw new Error(`Missing elements for ${filename}`);
  await page.screenshot({ path: path.join(outDir, filename), clip: box });
}

async function measureGap(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.inst-masthead__briefing');
    const bridgeTitle = document.getElementById('inst-value-bridge-heading');
    if (!card || !bridgeTitle) return null;
    const cardRect = card.getBoundingClientRect();
    const titleRect = bridgeTitle.getBoundingClientRect();
    return Math.round(titleRect.top - cardRect.bottom);
  });
}

async function capture(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await clipShot(page, '.inst-masthead', '.inst-value-bridge', name);
  const gapPx = await measureGap(page);
  await page.close();
  return gapPx;
}

const desktopGap = await capture('institutions-top-hero-bridge-desktop-1440.png', 1440);
const mobileGap = await capture('institutions-top-hero-bridge-mobile-375.png', 375);

const report = {
  desktopGapPx: desktopGap,
  mobileGapPx: mobileGap,
  overflow: false,
};

const mobilePage = await browser.newPage();
await mobilePage.setViewport({ width: 375, height: 812, isMobile: true });
await mobilePage.goto(`${base}/institutions.html`, { waitUntil: 'load' });
report.overflow = await mobilePage.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
);
await mobilePage.close();

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
