import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'methodology-controls-p3');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureControls(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/methodology.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.meth-controls', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.meth-controls')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.meth-controls');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const section = document.querySelector('.meth-controls');
    const heading = section?.querySelector('.meth-section__title')?.textContent?.trim();
    const firstP = section?.querySelector('.meth-doctrine-plate p')?.textContent?.trim();
    const text = section?.textContent ?? '';
    return {
      heading,
      firstSentence: firstP,
      hasCase013: text.includes('Case 013'),
      hasNullFindings: /null findings/i.test(text),
      hasOldHeading: /Controls and restraint/i.test(text),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await captureControls('methodology-controls-desktop-1440.png', 1440);
const mobile = await captureControls('methodology-controls-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
