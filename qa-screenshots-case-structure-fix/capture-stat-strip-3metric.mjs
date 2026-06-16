import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'qa-screenshots-stat-strip-3metric');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function forceReveal(page) {
  await page.addStyleTag({
    content: '[data-reveal-section] .reveal,.reveal{opacity:1!important;transform:none!important}',
  });
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  });
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

async function shot(pageUrl, selector, name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width === 375 ? 812 : 900, deviceScaleFactor: 2 });
  await page.goto(pageUrl, { waitUntil: 'networkidle0' });
  await forceReveal(page);
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), selector);
  await sleep(300);
  const target = await page.$(selector);
  await target.screenshot({ path: path.join(outDir, `${name}-${width}.png`) });
  await page.close();
}

for (const width of [375, 1440]) {
  await shot('http://127.0.0.1:8791/index.html', '.proof-strip--landing', 'homepage-proof-strip', width);
  await shot('http://127.0.0.1:8791/index.html', '.hp-arc-stat-strip', 'homepage-archive-metrics', width);
  await shot('http://127.0.0.1:8791/archive.html', '.arc-stat-strip', 'archive-stat-strip', width);
}

await browser.close();
console.log('saved screenshots to qa-screenshots-stat-strip-3metric/');
