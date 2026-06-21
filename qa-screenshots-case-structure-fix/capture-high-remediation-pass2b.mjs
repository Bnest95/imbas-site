import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const phase = process.argv[2] || 'after';
const outDir = path.join(__dirname, 'high-remediation-pass2b', phase);
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

function rect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    width: Math.round(r.width * 100) / 100,
    height: Math.round(r.height * 100) / 100,
  };
}

async function measurePage(width, label) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await wait(400);

  const skipBefore = await page.evaluate(() => {
    const link = document.querySelector('.skip-link');
    link.focus();
    const style = window.getComputedStyle(link);
    const r = link.getBoundingClientRect();
    return {
      rect: { width: r.width, height: r.height },
      minHeight: style.minHeight,
      padding: style.padding,
    };
  });

  const footer = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.site-footer__links a')];
    return links.map((a) => ({
      text: a.textContent.trim(),
      rect: {
        width: a.getBoundingClientRect().width,
        height: a.getBoundingClientRect().height,
      },
    }));
  });

  const heroSecondary = await page.evaluate(() => {
    const el = document.querySelector('.hero__secondary');
    const r = el?.getBoundingClientRect();
    return r ? { width: r.width, height: r.height } : null;
  });

  await page.evaluate(() => document.querySelector('.site-footer')?.scrollIntoView({ block: 'end' }));
  await wait(200);
  await page.screenshot({
    path: path.join(outDir, `footer-${label}.png`),
    clip: { x: 0, y: Math.max(0, 900 - 320), width, height: 320 },
  });

  await page.close();
  return { width, skip: skipBefore, footer, heroSecondary };
}

async function moreDropdownCheck() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await wait(400);

  await page.focus('#nav-more-toggle');
  await page.keyboard.press('Enter');
  await wait(150);
  const afterOpen = await page.evaluate(() => ({
    expanded: document.getElementById('nav-more-toggle')?.getAttribute('aria-expanded'),
    hidden: document.getElementById('nav-more-menu')?.hidden,
    active: document.activeElement?.textContent?.trim(),
  }));

  await page.keyboard.press('ArrowDown');
  await wait(100);
  const afterArrow = await page.evaluate(() => document.activeElement?.textContent?.trim());

  await page.keyboard.press('Escape');
  await wait(100);
  const afterEscape = await page.evaluate(() => ({
    expanded: document.getElementById('nav-more-toggle')?.getAttribute('aria-expanded'),
    hidden: document.getElementById('nav-more-menu')?.hidden,
    focus: document.activeElement?.id,
  }));

  await page.click('#nav-more-toggle');
  await wait(150);
  const afterReopen = await page.evaluate(() => ({
    expanded: document.getElementById('nav-more-toggle')?.getAttribute('aria-expanded'),
    hidden: document.getElementById('nav-more-menu')?.hidden,
  }));

  await page.mouse.click(20, 400);
  await wait(150);
  const afterOutside = await page.evaluate(() => ({
    expanded: document.getElementById('nav-more-toggle')?.getAttribute('aria-expanded'),
    hidden: document.getElementById('nav-more-menu')?.hidden,
  }));

  await page.setViewport({ width: 375, height: 900 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle0' });
  await wait(400);
  await page.click('.nav__menu-btn');
  await wait(200);
  await page.click('#nav-more-toggle');
  await wait(200);
  const mobileMore = await page.evaluate(() => ({
    expanded: document.getElementById('nav-more-toggle')?.getAttribute('aria-expanded'),
    hidden: document.getElementById('nav-more-menu')?.hidden,
    items: [...document.querySelectorAll('#nav-more-menu a')].map((a) => a.textContent.trim()),
  }));

  await page.close();
  return { afterOpen, afterArrow, afterEscape, afterReopen, afterOutside, mobileMore };
}

const measurements = {};
for (const w of [375, 390, 430, 1440]) {
  measurements[w] = await measurePage(w, `${w}`);
}

const more = await moreDropdownCheck();
const report = { measurements, moreDropdown: more };
fs.writeFileSync(path.join(outDir, `measurements-${phase}.json`), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
