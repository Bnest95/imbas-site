import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'institutions-receive-p3');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const forbidden = [
  'coming soon',
  'continuous monitoring',
  'live alerts',
  'certified audit',
  'compliance certification',
  'automated governance',
  'roadmap',
];

async function captureClip(page, startSel, endSel, filename) {
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

async function captureSection(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/institutions.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.inst-near-term', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.inst-near-term')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.inst-near-term');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate((forbiddenWords) => {
    const section = document.querySelector('.inst-near-term');
    const text = section?.innerText ?? '';
    const available = [...section.querySelectorAll('.inst-roadmap__stage:first-child li')].map((li) =>
      li.textContent.trim()
    );
    const pilot = [...section.querySelectorAll('.inst-roadmap__stage:last-child li')].map((li) =>
      li.textContent.trim()
    );
    return {
      heading: section?.querySelector('.inst-section__title')?.textContent?.trim(),
      availableLabel: section?.querySelector('.inst-roadmap__stage:first-child .inst-roadmap__label')?.textContent?.trim(),
      pilotLabel: section?.querySelector('.inst-roadmap__stage:last-child .inst-roadmap__label')?.textContent?.trim(),
      available,
      pilot,
      forbiddenHits: forbiddenWords.filter((w) => text.toLowerCase().includes(w.toLowerCase())),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  }, forbidden);

  await page.close();
  return report;
}

async function captureCtaTransition(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/institutions.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.inst-near-term', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.inst-cta')?.scrollIntoView({ block: 'end' });
  });
  await wait(500);
  await captureClip(page, '.inst-near-term', '.inst-cta', name);
  await page.close();
}

const desktop = await captureSection('institutions-receive-desktop-1440.png', 1440);
const mobile = await captureSection('institutions-receive-mobile-375.png', 375);
await captureCtaTransition('institutions-receive-cta-desktop-1440.png', 1440);
await captureCtaTransition('institutions-receive-cta-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
