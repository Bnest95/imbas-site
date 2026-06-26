import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'your-experience-pass5l');
const base = process.env.BASE_URL || 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    protocolTimeout: 120000,
  });
}

async function captureViewport(width, height, filename, scrollMode = 'experience') {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate((mode) => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    if (mode === 'experience') {
      const section = document.querySelector('.your-experience');
      if (section) section.scrollIntoView({ block: 'center' });
    } else {
      const compounding = document.querySelector('.compounding');
      if (compounding) compounding.scrollIntoView({ block: 'start' });
    }
  }, scrollMode);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
  const order =
    scrollMode === 'order'
      ? await page.evaluate(() => {
          const sections = Array.from(document.querySelectorAll('main > section'));
          const idx = sections.findIndex((s) => s.classList.contains('your-experience'));
          const prev = sections[idx - 1];
          const next = sections[idx + 1];
          return {
            prevIsCompounding: !!(prev && prev.classList.contains('compounding')),
            nextIsEphemeral: !!(next && next.querySelector('#ephemeral-h2')),
          };
        })
      : null;
  await browser.close();
  return order;
}

(async () => {
  await captureViewport(1440, 900, 'your-experience-desktop-1440.png', 'experience');
  await captureViewport(375, 812, 'your-experience-mobile-375.png', 'experience');
  const order = await captureViewport(
    1440,
    1200,
    'section-order-thesis-experience-ephemeral-1440.png',
    'order'
  );
  fs.writeFileSync(path.join(outDir, 'order-check.json'), JSON.stringify(order, null, 2));
  console.log(JSON.stringify(order, null, 2));
})();
