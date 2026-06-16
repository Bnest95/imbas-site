import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812 });
await page.goto('http://127.0.0.1:8780/index.html', { waitUntil: 'networkidle0' });
const section = await page.$('section.categories');
await section.screenshot({ path: path.join(__dirname, 'omission-icon-categories-375.png') });
await browser.close();
console.log('saved');
