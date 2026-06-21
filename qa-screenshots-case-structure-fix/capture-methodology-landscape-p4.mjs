import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'methodology-landscape-p4');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureLandscape(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/methodology.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.meth-landscape', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.meth-landscape')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.meth-landscape');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const section = document.querySelector('.meth-landscape');
    const labels = [...section.querySelectorAll('.meth-landscape-item__label')].map((h) =>
      h.textContent.trim()
    );
    const text = section.textContent;
    const thirdParty = [
      'Stanford HELM',
      'METR',
      'Arize',
      'Lakera',
      'AlgorithmWatch',
    ];
    return {
      heading: section?.querySelector('.meth-section__title')?.textContent?.trim(),
      categoryCount: labels.length,
      categories: labels,
      intro: section?.querySelector('p')?.textContent?.trim(),
      closingPresent: text.includes('inspectable case records'),
      finalSentence: text.includes('missing layer beside them'),
      thirdPartyMentions: thirdParty.filter((n) => text.includes(n)),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await captureLandscape('methodology-landscape-desktop-1440.png', 1440);
const mobile = await captureLandscape('methodology-landscape-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
