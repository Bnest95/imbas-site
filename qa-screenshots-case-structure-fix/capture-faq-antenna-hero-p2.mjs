import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'faq-antenna-hero-p2');
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

async function collectReport(page) {
  return page.evaluate(() => {
    const intro = document.querySelector('.faq-masthead .page__intro')?.textContent.trim();
    const questions = [...document.querySelectorAll('.faq-entry__question-text')].map((el) => el.textContent.trim());
    const bodyText = document.body.textContent;
    const triggers = document.querySelectorAll('.faq-entry__trigger');
    return {
      intro,
      introMatches:
        intro === 'Answers to common questions about how Imbas measures and records AI behavior.',
      questionCount: questions.length,
      questions,
      hasAntennaMetaphorQuestion: questions.some((q) => /antenna/i.test(q)),
      hasAntennaText: /antenna/i.test(bodyText),
      accordionCount: triggers.length,
      allClosed: [...triggers].every((t) => t.getAttribute('aria-expanded') === 'false'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
}

async function captureHero(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/faq.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.faq-masthead', { timeout: 10000 });
  await wait(400);
  const el = await page.$('.faq-masthead');
  await el.screenshot({ path: path.join(outDir, name) });
  const report = await collectReport(page);
  await page.close();
  return report;
}

async function captureRemovalArea(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/faq.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.faq-entry__trigger', { timeout: 10000 });
  await wait(400);
  await clipShot(page, '#faq-q-09', '#faq-q-11', name);
  const report = await collectReport(page);
  await page.close();
  return report;
}

const desktopHero = await captureHero('faq-hero-desktop-1440.png', 1440);
const mobileHero = await captureHero('faq-hero-mobile-375.png', 375);
const desktopRemoval = await captureRemovalArea('faq-removal-area-desktop-1440.png', 1440);
const mobileRemoval = await captureRemovalArea('faq-removal-area-mobile-375.png', 375);

const report = { desktopHero, mobileHero, desktopRemoval, mobileRemoval };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
