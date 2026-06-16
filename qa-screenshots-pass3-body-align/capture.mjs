import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8800/index.html', { waitUntil: 'networkidle0' });
await page.addStyleTag({ content: '[data-reveal-section] .reveal,.reveal{opacity:1!important;transform:none!important}' });
await page.evaluate(() => {
  document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  document.querySelector('#ephemeral-h2')?.scrollIntoView({ block: 'center' });
});
await sleep(300);
const clip = await page.evaluate(() => {
  const inner = document.querySelector('#ephemeral-h2')?.closest('.stakes__inner');
  const r = inner.getBoundingClientRect();
  return { x: r.x, y: Math.max(0, r.top - 12), width: r.width, height: r.height + 24 };
});
await page.screenshot({ path: path.join(__dirname, 'body-left-align-375.png'), clip });
await browser.close();
console.log('saved', clip);
