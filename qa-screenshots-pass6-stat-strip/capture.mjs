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
  document.querySelector('.proof-strip--landing')?.scrollIntoView({ block: 'center' });
});
await sleep(300);

const strip = await page.$('.proof-strip--landing');
if (!strip) throw new Error('proof strip not found');

const audit = await page.evaluate(() => {
  const strip = document.querySelector('.proof-strip--landing .proof-strip__metrics');
  if (!strip) return { error: 'strip not found' };

  const lines = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(strip, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent;
    if (!text.trim()) continue;
    range.selectNodeContents(node);
    const rects = range.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      const slice = text.slice(0, 80);
      lines.push({ top: Math.round(r.top), text: slice.trim(), endsWithDot: /·\s*$/.test(slice) });
    }
  }

  const stranded = lines.filter((l) => /^·/.test(l.text) || /·$/.test(l.text));
  return { lineCount: lines.length, stranded, lines };
});

await strip.screenshot({
  path: path.join(__dirname, 'stat-strip-wrap-375.png'),
});

await browser.close();
console.log(JSON.stringify({ audit }, null, 2));
