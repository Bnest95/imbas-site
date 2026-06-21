import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'volunteer-gap-ephemeral-p2');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureSection(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/volunteer-gap.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.vg-ephemeral', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.vg-ephemeral')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.vg-ephemeral');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const section = document.querySelector('.vg-ephemeral');
    const label = section?.querySelector('.section-label span')?.textContent?.trim();
    const headline = section?.querySelector('.vg-section__title')?.textContent?.trim();
    const body = section?.querySelector('.vg-field-note p')?.textContent?.trim();
    return {
      label,
      headline,
      bodyUnchanged: body?.startsWith('An open question returns one answer'),
      hasEphemeral: /ephemeral/i.test(section?.textContent ?? ''),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const mobile = await captureSection('volunteer-gap-ephemeral-mobile-375.png', 375);
const desktop = await captureSection('volunteer-gap-ephemeral-desktop-1440.png', 1440);

const report = { mobile, desktop };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
