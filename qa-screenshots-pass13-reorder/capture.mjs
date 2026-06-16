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

await page.evaluate(() => document.querySelector('.compounding')?.scrollIntoView({ block: 'start' }));
await sleep(250);
const drift = await page.$('.compounding');
await drift.screenshot({ path: path.join(__dirname, 'drift-thesis-375.png') });

await page.evaluate(() => document.querySelector('.gap')?.scrollIntoView({ block: 'start' }));
await sleep(250);
const gap = await page.$('.gap__inner');
await gap.screenshot({ path: path.join(__dirname, 'volunteer-gap-after-drift-375.png') });

const audit = await page.evaluate(() => {
  const sections = Array.from(document.querySelectorAll('main > section')).map((el) => {
    const label =
      el.querySelector('h2')?.textContent?.trim().slice(0, 60) ||
      el.getAttribute('aria-label') ||
      el.className.split(' ').slice(0, 2).join(' ');
    return label;
  });
  return {
    sectionOrder: sections,
    hasDivergenceSvg: !!document.querySelector('.compounding .divergence__svg'),
    compoundingRevealed: document.querySelector('.compounding')?.classList.contains('is-revealed'),
    driftBeforeGap:
      sections.indexOf('A few degrees of drift can change the destination.') <
      sections.findIndex((s) => s.includes('Volunteer Gap') || s.startsWith('That difference')),
  };
});

await browser.close();
console.log(JSON.stringify({ audit }, null, 2));
