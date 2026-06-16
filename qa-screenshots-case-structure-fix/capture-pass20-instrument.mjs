import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'qa-screenshots-pass20-instrument');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

async function shot(width, name, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width === 375 ? 812 : 900, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8791/workbench.html', { waitUntil: 'networkidle0' });
  await sleep(800);
  if (fn) await fn(page);
  const target = await page.$('.wb-shell') || await page.$('.wb-stage');
  await target.screenshot({ path: path.join(outDir, `${name}-${width}.png`) });
  await page.close();
}

await shot(375, 'workbench-instrument', null);
await shot(1440, 'workbench-instrument', null);
await shot(375, 'workbench-case-rail', async (page) => {
  await page.evaluate(() => document.querySelector('.wb-case-card.is-active')?.scrollIntoView({ block: 'center' }));
});

await browser.close();
console.log('saved to qa-screenshots-pass20-instrument/');
