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
  document.querySelector('#gap-h2')?.scrollIntoView({ block: 'start' });
});
await sleep(300);

const section = await page.$('.gap__inner');
if (!section) throw new Error('gap section not found');
await section.screenshot({ path: path.join(__dirname, 'volunteer-gap-section-375.png') });

const audit = await page.evaluate(() => {
  const inner = document.querySelector('.gap__inner');
  const texts = inner
    ? Array.from(inner.querySelectorAll('.gap__definition, .gap__support, .gap__link span:first-child')).map((el) =>
        el.textContent.trim(),
      )
    : [];
  return {
    paragraphs: texts,
    supportCount: inner?.querySelectorAll('.gap__support').length ?? 0,
  };
});

await browser.close();
console.log(JSON.stringify({ audit }, null, 2));
