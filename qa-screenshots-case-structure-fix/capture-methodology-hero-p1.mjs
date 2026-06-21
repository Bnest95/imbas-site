import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'methodology-hero-p1');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureHero(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/methodology.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.meth-masthead', { timeout: 10000 });
  await wait(400);
  const el = await page.$('.meth-masthead');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const masthead = document.querySelector('.meth-masthead');
    const intros = [...masthead.querySelectorAll('.page__intro')].map((p) => p.textContent.trim());
    const nextSection = document.querySelector('.meth-observability .meth-section__title')?.textContent?.trim();
    const text = masthead.textContent;
    return {
      eyebrow: masthead.querySelector('.section-label span')?.textContent?.trim(),
      heading: masthead.querySelector('h1')?.textContent?.trim(),
      paragraphs: intros,
      nextSectionHeading: nextSection,
      hasAcademicFiller: /observational behavioral science|measurement discipline/i.test(text),
      hasBehaviorPrinciple: intros.some((p) => /not to infer intent/i.test(p)),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await captureHero('methodology-hero-desktop-1440.png', 1440);
const mobile = await captureHero('methodology-hero-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
