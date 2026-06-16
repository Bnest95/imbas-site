import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'networkidle0' });
await page.addStyleTag({
  content: '[data-reveal-section] .reveal,.reveal{opacity:1!important;transform:none!important}',
});
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  window.scrollTo(0, 0);
});
await sleep(300);

const hero = await page.$('.hero__stage');
if (!hero) throw new Error('hero stage not found');
await hero.screenshot({ path: path.join(__dirname, 'hero-subhead-cta-375.png') });

const audit = await page.evaluate(() => ({
  subhead: document.querySelector('#hero-h1 .hero__subhead-line')?.textContent?.trim(),
  cta: document.querySelector('.hero__capture button')?.textContent?.trim(),
  ctaAction: document.querySelector('.hero__capture')?.getAttribute('action'),
  secondary: document.querySelector('.hero__secondary span')?.textContent?.trim(),
  wordmark: document.querySelector('.hero__monolith-text')?.textContent?.trim(),
}));

await browser.close();
console.log(JSON.stringify({ audit }, null, 2));
