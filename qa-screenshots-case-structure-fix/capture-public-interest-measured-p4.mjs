import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'public-interest-measured-p4');
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
  await page.waitForSelector('.pi-how-measured', { timeout: 10000 });
  await wait(400);
  await clipShot(page, '.pi-how-measured', '.pi-how-measured', filename);

  const report = await page.evaluate(() => {
    const section = document.querySelector('.pi-how-measured');
    const heading = section.querySelector('.pi-section__title')?.textContent.trim();
    const steps = [...section.querySelectorAll('.pi-measure-steps li')].map((li) => li.textContent.trim());
    const closing = section.querySelector('.pi-measure-steps__closing')?.textContent.trim();
    const records = document.querySelector('.pi-records');
    const recordsParas = [...records.querySelectorAll('.pi-record-note p')].map((p) => p.textContent.trim());
    const tracking = document.querySelector('.pi-tracking');
    const trackingParas = [...tracking.querySelectorAll('.pi-record-note p')].map((p) => p.textContent.trim());
    const doctrine = document.querySelector('.pi-doctrine-plate p:first-child')?.textContent.trim();
    return {
      heading,
      steps,
      closing,
      recordsUnchanged: recordsParas.length === 2,
      trackingUnchanged: trackingParas.length === 4,
      doctrineUnchanged: doctrine === 'Imbas does not declare intent. It does not decide truth for the reader. It does not render moral judgment. It records behavior.',
      hasOldParagraph: !!section.querySelector('.pi-record-note > p:not(.pi-measure-steps__closing)'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await capture('public-interest-measured-desktop-1440.png', 1440);
const mobile = await capture('public-interest-measured-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
