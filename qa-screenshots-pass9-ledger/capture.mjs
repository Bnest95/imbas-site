import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function capture(page, url, selector, filename) {
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.addStyleTag({
    content: '[data-reveal-section] .reveal,.reveal{opacity:1!important;transform:none!important}',
  });
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  });
  await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), selector);
  await sleep(300);
  const el = await page.$(selector);
  if (!el) throw new Error(`Missing ${selector} on ${url}`);
  await el.screenshot({ path: path.join(__dirname, filename) });
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });

await capture(
  page,
  'http://127.0.0.1:8000/index.html',
  '.hp-arc-ledger-wrap',
  'homepage-ledger-375.png',
);
await capture(
  page,
  'http://127.0.0.1:8000/archive.html',
  '.arc-ledger-wrap',
  'archive-ledger-375.png',
);

const audit = await page.evaluate(() => {
  const text = document.body.innerText;
  return {
    hasPublicRecord: /Public record/i.test(text),
    hasHeldRecord: /Held record/i.test(text),
    hasHeldInRecord: /held in record/i.test(text),
    hasCaseHeader: /Case/i.test(text),
  };
});

await browser.close();
console.log(JSON.stringify({ audit }, null, 2));
