import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'public-interest-doctrine-p5');
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

async function capture(filename, width, mode) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/public-interest.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.pi-doctrine', { timeout: 10000 });
  await wait(400);
  if (mode === 'doctrine') {
    await clipShot(page, '.pi-doctrine', '.pi-doctrine', filename);
  } else {
    await clipShot(page, '.pi-doctrine', '.pi-support', filename);
  }

  const report = await page.evaluate(() => {
    const doctrine = document.querySelector('.pi-doctrine');
    const heading = doctrine.querySelector('.pi-section__title')?.textContent.trim();
    const body = doctrine.querySelector('.pi-record-note p')?.textContent.trim();
    const hasDoctrinePlate = !!doctrine.querySelector('.pi-doctrine-plate');
    const hasVolunteerGapLink = !!doctrine.querySelector('a[href="/volunteer-gap.html"]');
    const paragraphCount = doctrine.querySelectorAll('p').length;

    const howMeasured = document.querySelector('.pi-how-measured');
    const steps = [...howMeasured.querySelectorAll('.pi-measure-steps li')].map((li) => li.textContent.trim());

    const support = document.querySelector('.pi-support .pi-section__title')?.textContent.trim();

    return {
      heading,
      body,
      paragraphCount,
      hasDoctrinePlate,
      hasVolunteerGapLink,
      howMeasuredSteps: steps.length === 5 ? steps : null,
      supportHeading: support,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktopDoctrine = await capture('public-interest-doctrine-desktop-1440.png', 1440, 'doctrine');
const desktopTransition = await capture('public-interest-doctrine-support-desktop-1440.png', 1440, 'transition');
const mobileDoctrine = await capture('public-interest-doctrine-mobile-375.png', 375, 'doctrine');
const mobileTransition = await capture('public-interest-doctrine-support-mobile-375.png', 375, 'transition');

const report = { desktopDoctrine, desktopTransition, mobileDoctrine, mobileTransition };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
