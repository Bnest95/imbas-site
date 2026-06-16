import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'qa-screenshots-pass21-cleanup');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

async function shot(width, name, fn) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: width === 375 ? 812 : 900, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8791/workbench.html', { waitUntil: 'networkidle0' });
  await sleep(900);
  if (fn) await fn(page);
  const target = await page.$('.wb-shell') || await page.$('.wb-stage');
  await target.screenshot({ path: path.join(outDir, `${name}-${width}.png`) });
  await page.close();
}

await shot(375, 'workbench-cleanup', null);
await shot(1440, 'workbench-cleanup', null);
await shot(375, 'readout-structure', async (page) => {
  await page.evaluate(() => document.querySelector('.wb-readout')?.scrollIntoView({ block: 'center' }));
});
await shot(1440, 'desktop-readout-rail', async (page) => {
  await page.evaluate(() => document.querySelector('.wb-readout-rail')?.scrollIntoView({ block: 'start' }));
});

await browser.close();
console.log('saved to qa-screenshots-pass21-cleanup/');
