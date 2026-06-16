import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'qa-screenshots-bridge-single-card');
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

for (const [name, width, height] of [
  ['bridge-plates-375', 375, 812],
  ['bridge-plates-1440', 1440, 900],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'networkidle0' });
  await forceReveal(page);
  await page.evaluate(() => document.querySelector('.bridge')?.scrollIntoView({ block: 'center' }));
  await sleep(300);
  const target = await page.$('.bridge__frame');
  await target.screenshot({ path: path.join(outDir, `${name}.png`) });
  await page.close();
}

await browser.close();
console.log('saved bridge-plates-375.png and bridge-plates-1440.png');
