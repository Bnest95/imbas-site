import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'public-interest-support-p6');
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
  await page.waitForSelector('.pi-support', { timeout: 10000 });
  await wait(400);
  if (mode === 'support') {
    await clipShot(page, '.pi-support', '.pi-support', filename);
  } else {
    await clipShot(page, '.pi-support', '.pi-cta', filename);
  }

  const report = await page.evaluate(() => {
    const support = document.querySelector('.pi-support');
    const heading = support.querySelector('.pi-section__title')?.textContent.trim();
    const rows = [...support.querySelectorAll('.pi-output-ledger__row')].map((row) => ({
      label: row.querySelector('.pi-output-ledger__label')?.textContent.trim(),
      desc: row.querySelector('.pi-output-ledger__desc')?.textContent.trim(),
    }));
    const ledgerText = support.textContent;
    const doctrine = document.querySelector('.pi-doctrine .pi-record-note p')?.textContent.trim();
    return {
      heading,
      rowCount: rows.length,
      rows,
      hasFieldNotes: /field notes/i.test(ledgerText),
      hasLiveSignal: /live signal/i.test(ledgerText),
      hasGenericOutputLabel: rows.some((r) => r.label === 'Output'),
      doctrineUnchanged:
        doctrine === 'Imbas records behavior. It does not determine truth, intent, or motive.',
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktopSupport = await capture('public-interest-support-desktop-1440.png', 1440, 'support');
const desktopTransition = await capture('public-interest-support-cta-desktop-1440.png', 1440, 'transition');
const mobileSupport = await capture('public-interest-support-mobile-375.png', 375, 'support');
const mobileTransition = await capture('public-interest-support-cta-mobile-375.png', 375, 'transition');

const report = { desktopSupport, desktopTransition, mobileSupport, mobileTransition };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
