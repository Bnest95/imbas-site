import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8805/index.html', { waitUntil: 'networkidle0' });
await page.addStyleTag({ content: '[data-reveal-section] .reveal{opacity:1!important;transform:none!important}' });
await page.evaluate(() => {
  document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
});
const inner = await page.$('#ephemeral-h2');
const copy = await page.$('#ephemeral-h2 + .stakes__copy');
await inner.screenshot({ path: path.join(__dirname, '_h2.png') });
await copy.screenshot({ path: path.join(__dirname, '_copy.png') });
await browser.close();
