import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'faq-hero-p1');
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
  await page.goto(`${base}/faq.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.faq-masthead', { timeout: 10000 });
  await wait(400);
  const el = await page.$('.faq-masthead');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const masthead = document.querySelector('.faq-masthead');
    const intro = masthead.querySelector('.page__intro')?.textContent.trim();
    const questions = [...document.querySelectorAll('.faq-entry dt')].map((dt) => dt.textContent.trim());
    const firstAnswer = document.querySelector('.faq-entry dd')?.textContent.trim().slice(0, 80);
    return {
      heading: masthead.querySelector('h1')?.textContent.trim(),
      intro,
      introMatches:
        intro === 'Questions about the Volunteer Gap, the archive, scoring, and methodology.',
      faqCount: questions.length,
      firstQuestion: questions[0],
      firstAnswerStart: firstAnswer,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktop = await captureHero('faq-hero-desktop-1440.png', 1440);
const mobile = await captureHero('faq-hero-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
