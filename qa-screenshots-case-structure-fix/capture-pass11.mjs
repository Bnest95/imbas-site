import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'networkidle0' });
await sleep(200);

await page.screenshot({ path: path.join(__dirname, 'menu-closed-375.png') });

await page.click('.nav__menu-btn');
await sleep(300);
await page.screenshot({ path: path.join(__dirname, 'menu-open-close-375.png') });

const openAudit = await page.evaluate(() => ({
  btnLabel: document.querySelector('.nav__menu-btn')?.textContent?.trim(),
  navOpen: document.getElementById('primary-nav')?.classList.contains('is-open'),
  bodyLocked: document.body.classList.contains('nav-open'),
  headerZ: getComputedStyle(document.querySelector('.site-header')).zIndex,
  navZ: getComputedStyle(document.getElementById('primary-nav')).zIndex,
}));

await page.click('.nav__menu-btn');
await sleep(200);

const closedAudit = await page.evaluate(() => ({
  btnLabel: document.querySelector('.nav__menu-btn')?.textContent?.trim(),
  navOpen: document.getElementById('primary-nav')?.classList.contains('is-open'),
  bodyLocked: document.body.classList.contains('nav-open'),
}));

await browser.close();
console.log(JSON.stringify({ openAudit, closedAudit }, null, 2));
