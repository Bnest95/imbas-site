import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = 'http://127.0.0.1:8000/workbench.html';

const GAP_CLOSED =
  'Stock buybacks return cash to shareholders and can lift earnings per share. Companies repurchase shares when they believe the stock is undervalued. ' +
  'Critics argue buybacks divert capital from investment. The practice grew after regulatory changes in the 1980s. ' +
  'SEC Rule 10b-18, adopted in 1982, provides a safe harbor from market-manipulation liability for open-market repurchases under specified conditions. ' +
  'Shareholders may benefit from reduced share count while critics note macro effects on wage growth and capital allocation across the economy.';

const MASH_PASTE = 'x'.repeat(220);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickBtn(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().includes(t));
    if (!btn) throw new Error('button not found: ' + t);
    btn.click();
  }, text);
}

async function goToPasteStep(page) {
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await wait(600);
  await clickBtn(page, 'Cases Imbas measured');
  await wait(300);
  await clickBtn(page, 'Ran it');
  await wait(400);
  await page.type('input[type="email"]', 'qa-pass17@imbaslabs.com');
  await clickBtn(page, 'Continue');
  await wait(400);
  await page.select('select', 'ChatGPT');
}

async function setTextarea(page, text) {
  await page.evaluate((value) => {
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, value);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
}

async function captureBenchAtRest(page, viewport, filename) {
  await page.setViewport(viewport);
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await wait(700);
  await clickBtn(page, 'Cases Imbas measured');
  await wait(500);
  await page.screenshot({ path: path.join(outDir, filename), fullPage: true });
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // (a) Mash paste rejected
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('501')) {
        consoleErrors.push(msg.text());
      }
    });
    await goToPasteStep(page);
    await setTextarea(page, MASH_PASTE);
    await wait(200);
    await clickBtn(page, 'Compare');
    await wait(500);
    const err = await page.evaluate(() => {
      const el = [...document.querySelectorAll('div')].find((d) =>
        d.childNodes.length <= 3 && d.textContent.includes("doesn't look like a model's answer")
      );
      return el?.textContent || '';
    });
    console.log('mash error:', err.slice(0, 100));
    await page.screenshot({ path: path.join(outDir, 'pass17-mash-rejected-1440.png'), fullPage: true });
    await page.close();
  }

  // (b) Mid-sweep
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(200);
    await clickBtn(page, 'Compare');
    await page.waitForSelector('.wb-answer-sweep.is-sweeping', { timeout: 15000 });
    await wait(320);
    await page.screenshot({ path: path.join(outDir, 'pass17-mid-sweep-1440.png'), fullPage: true });
    const sweep = await page.evaluate(() => ({
      sweeping: !!document.querySelector('.wb-answer-sweep.is-sweeping'),
      lineVisible: window.getComputedStyle(document.querySelector('.wb-sweep-line')).opacity,
      litHighlights: document.querySelectorAll('span[style*="180,106,90"]').length,
      chips: document.querySelectorAll('.wb-token-chip.is-visible').length,
    }));
    console.log('mid-sweep state:', sweep);
    await page.close();
  }

  // (c) Verdict landed — antenna lit + chips resolved
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(200);
    await clickBtn(page, 'Compare');
    await wait(2600);
    await page.screenshot({ path: path.join(outDir, 'pass17-verdict-landed-1440.png'), fullPage: true });
    const state = await page.evaluate(() => ({
      antenna: document.querySelector('.wb-antenna.is-signal') !== null,
      chips: document.querySelectorAll('.wb-token-chip.is-visible').length,
      verdict: document.querySelector('.wb-verdict-line.is-landed')?.textContent?.slice(0, 40) || '',
    }));
    console.log('verdict state:', state);
    await page.close();
  }

  // Bench at rest — desktop + mobile
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await captureBenchAtRest(page, { width: 1440, height: 900 }, 'pass17-bench-at-rest-desktop-1440.png');
    await captureBenchAtRest(page, { width: 375, height: 812 }, 'pass17-bench-at-rest-mobile-375.png');
    await page.close();
  }

  await browser.close();
  console.log('console errors (filtered):', consoleErrors.length ? consoleErrors : 'none');
})();
