import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'workbench-pass-b2');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

for (const [name, width, height] of [
  ['suggest-b2-desktop-1440.png', 1440, 900],
  ['suggest-b2-mobile-375.png', 375, 812],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await wait(500);
  await page.evaluate(() => document.querySelector('.wb-suggest-module')?.scrollIntoView({ block: 'center' }));
  await wait(200);
  const clip = await page.evaluate(() => {
    const el = document.querySelector('.wb-suggest-module');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x - 8, y: r.y - 8, width: r.width + 16, height: r.height + 16 };
  });
  if (clip) await page.screenshot({ path: path.join(outDir, name), clip });
  await page.close();
}

const verifyPage = await browser.newPage();
await verifyPage.setViewport({ width: 1440, height: 900 });
await verifyPage.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded' });
await verifyPage.evaluate(() => localStorage.removeItem('imbas_wb_email'));
await verifyPage.reload({ waitUntil: 'domcontentloaded' });
await wait(500);

const report = await verifyPage.evaluate(() => {
  const cta = [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Suggest an investigation'));
  return {
    eyebrow: document.querySelector('.wb-suggest-module__eyebrow')?.textContent?.trim(),
    lead: document.querySelector('.wb-suggest-module__lead')?.textContent?.trim(),
    support: document.querySelector('.wb-suggest-module__support')?.textContent?.trim(),
    ctaPrimary: cta?.classList.contains('wb-btn--primary'),
    ctaText: cta?.textContent?.trim(),
  };
});

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
