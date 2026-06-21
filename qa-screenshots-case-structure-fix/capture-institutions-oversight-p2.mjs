import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'institutions-oversight-p2');
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
  await page.goto(`${base}/institutions.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.inst-oversight', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.inst-oversight')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.inst-oversight');
  await el.screenshot({ path: path.join(outDir, name) });
  const report = await page.evaluate(() => {
    const section = document.querySelector('.inst-oversight');
    const pull = section?.querySelector('.inst-record-note__pull');
    const body = section?.querySelector('.inst-record-note p:not(.inst-record-note__pull)');
    const text = section?.innerText ?? '';
    return {
      heading: section?.querySelector('.inst-section__title')?.textContent?.trim(),
      bodyParagraph: body?.textContent?.trim(),
      pullLine: pull?.textContent?.trim(),
      pullWordCount: pull?.textContent?.trim().split(/\s+/).length ?? 0,
      hasVolunteerGap: /volunteer gap/i.test(text),
      hasImbas: /\bimbas\b/i.test(pull?.textContent ?? ''),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  await page.close();
  return report;
}

const desktop = await captureSection('institutions-oversight-desktop-1440.png', 1440);
const mobile = await captureSection('institutions-oversight-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
