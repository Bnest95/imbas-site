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
  document.querySelectorAll('[data-reveal-section]').forEach((el) => el.classList.add('is-revealed'));
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
});

// Try button at rest
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(200);
const tryBtn = await page.$('.hero__capture button');
await tryBtn.screenshot({ path: path.join(__dirname, 'ember-try-button-375.png') });

// Try button hover
await tryBtn.hover();
await sleep(250);
await tryBtn.screenshot({ path: path.join(__dirname, 'ember-try-button-hover-375.png') });

// "anchored." emphasis word
await page.evaluate(() => {
  document.querySelector('#public-interest-h2')?.scrollIntoView({ block: 'center' });
});
await sleep(200);
const anchored = await page.$('#public-interest-h2 .ember');
await anchored.screenshot({ path: path.join(__dirname, 'ember-anchored-375.png') });

const colors = await page.evaluate(() => {
  const btn = document.querySelector('.hero__capture button');
  const btnStyle = getComputedStyle(btn);
  const emberWord = document.querySelector('#compound-h2 .ember');
  const anchoredWord = document.querySelector('#public-interest-h2 .ember');
  return {
    tryButton: {
      background: btnStyle.backgroundColor,
      border: btnStyle.borderColor,
    },
    drift: getComputedStyle(emberWord).color,
    anchored: getComputedStyle(anchoredWord).color,
  };
});

await browser.close();
console.log(JSON.stringify({ colors }, null, 2));
