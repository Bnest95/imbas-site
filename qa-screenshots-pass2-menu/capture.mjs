import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8798/index.html', { waitUntil: 'networkidle0' });
await page.click('.nav__menu-btn');
await sleep(300);
await page.screenshot({ path: path.join(__dirname, 'menu-open-375.png') });
await browser.close();
console.log('saved');
