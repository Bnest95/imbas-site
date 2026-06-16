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
  const section = document.querySelector('#ephemeral-h2')?.closest('[data-reveal-section]');
  section?.classList.add('is-revealed');
  section?.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  document.querySelector('#ephemeral-h2')?.scrollIntoView({ block: 'center' });
});

// 1.5s delay + 2.6s animation + small buffer
await sleep(4300);

const resting = await page.evaluate(() => {
  const fade = document.querySelector('.ephemeral-fade');
  const style = fade ? getComputedStyle(fade) : null;
  return {
    opacity: style?.opacity ?? null,
    text: fade?.textContent?.trim() ?? null,
  };
});

const heading = await page.$('#ephemeral-h2');
if (!heading) throw new Error('ephemeral heading not found');

await heading.screenshot({
  path: path.join(__dirname, 'ephemeral-gone-rest-375.png'),
});

await browser.close();
console.log(JSON.stringify({ resting }, null, 2));
