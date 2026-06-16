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
  document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
});

async function shot(selector, filename) {
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), selector);
  await sleep(250);
  const el = await page.$(selector);
  if (!el) throw new Error(`Missing ${selector}`);
  await el.screenshot({ path: path.join(__dirname, filename) });
}

await shot('.exists-bridge', 'why-imbas-exists-375.png');
await shot('.bridge__frame', 'measurable-record-375.png');

const audit = await page.evaluate(() => ({
  why: {
    thesis: document.querySelector('.exists-bridge__thesis')?.textContent?.trim(),
    problem: document.querySelector('.exists-bridge__problem')?.textContent?.trim(),
    payoff: document.querySelector('.exists-bridge__payoff')?.textContent?.trim(),
  },
  bridgePlates: document.querySelectorAll('.bridge__plate').length,
  bridgeStatement: document.getElementById('bridge-statement')?.textContent?.trim(),
}));

await browser.close();
console.log(JSON.stringify({ audit }, null, 2));
