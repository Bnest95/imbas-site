import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'institutions-value-bridge-p1');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function gotoInstitutions(page) {
  await page.goto(`${base}/institutions.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.inst-value-bridge', { timeout: 10000 });
  await wait(400);
}

async function clipShot(page, startSelector, endSelector, filename) {
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
  await page.screenshot({
    path: path.join(outDir, filename),
    clip: box,
  });
}

async function captureTop(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await gotoInstitutions(page);
  await clipShot(page, '.inst-masthead', '.inst-value-bridge', name);
  await page.close();
}

async function captureTransition(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await gotoInstitutions(page);
  await clipShot(page, '.inst-value-bridge', '.inst-deliverables .inst-output-ledger__row:first-child', name);
  await page.close();
}

await captureTop('institutions-top-hero-bridge-desktop-1440.png', 1440);
await captureTop('institutions-top-hero-bridge-mobile-375.png', 375);
await captureTransition('institutions-bridge-deliverables-desktop-1440.png', 1440);
await captureTransition('institutions-bridge-deliverables-mobile-375.png', 375);

const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, isMobile: true });
await gotoInstitutions(page);

const report = await page.evaluate(() => {
  const bridge = document.querySelector('.inst-value-bridge');
  const deliverables = document.querySelector('.inst-deliverables');
  const restraint = document.querySelector('.inst-restraint');
  const posture = document.querySelector('.inst-posture');
  const bullets = [...document.querySelectorAll('.inst-value-bridge__item')].map((li) => li.textContent.trim());
  const listStyle = getComputedStyle(document.querySelector('.inst-value-bridge__list'));
  const forbidden = [
    'Volunteer Gap',
    'coming soon',
    'being wired',
    'agent',
    'copilot',
  ];
  const pageText = document.querySelector('main')?.innerText ?? '';
  return {
    heading: document.getElementById('inst-value-bridge-heading')?.textContent?.trim(),
    bullets,
    bulletCount: bullets.length,
    bridgeBeforeDeliverables:
      bridge && deliverables
        ? bridge.compareDocumentPosition(deliverables) === Node.DOCUMENT_POSITION_FOLLOWING
        : false,
    deliverablesTitle: deliverables?.querySelector('.inst-section__title')?.textContent?.trim(),
    restraintTitle: restraint?.querySelector('.inst-section__title')?.textContent?.trim(),
    postureTitle: posture?.querySelector('.inst-section__title')?.textContent?.trim(),
    listColumns: listStyle.gridTemplateColumns,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    forbiddenHits: forbidden.filter((w) => pageText.toLowerCase().includes(w.toLowerCase())),
    mastheadUnchanged: document.querySelector('.inst-masthead__thesis')?.textContent?.includes('When AI omits context'),
  };
});

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
