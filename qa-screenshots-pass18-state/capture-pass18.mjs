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
  await page.type('input[type="email"]', 'qa-pass18@imbaslabs.com');
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

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // (a) Result in-plate, collapsed answer row
  {
    const page = await browser.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(300);
    await clickBtn(page, 'Compare');
    await wait(2800);
    const state = await page.evaluate(() => ({
      inPlate: !!document.querySelector('.wb-run-plate.is-result .wb-result-inner'),
      collapsed: !!document.querySelector('.wb-answer-row__toggle'),
      expanded: !!document.querySelector('.wb-answer-row__body.is-open'),
      belowConfirm: !!document.querySelector('.wb-confirm-block'),
      plateCount: document.querySelectorAll('.wb-run-plate').length,
    }));
    console.log('result in-plate:', state);
    await page.screenshot({ path: path.join(outDir, 'pass18-result-in-plate-1440.png'), fullPage: true });
    await page.close();
  }

  // (b) Answer row expanded with highlights
  {
    const page = await browser.newPage();
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(200);
    await clickBtn(page, 'Compare');
    await wait(2800);
    await page.click('.wb-answer-row__toggle');
    await wait(400);
    await page.screenshot({ path: path.join(outDir, 'pass18-answer-expanded-1440.png'), fullPage: true });
    await page.close();
  }

  // (c) Verdict full contrast — crop plate area
  {
    const page = await browser.newPage();
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(200);
    await clickBtn(page, 'Compare');
    await wait(2800);
    const plate = await page.$('.wb-run-plate.is-result');
    if (plate) {
      await plate.screenshot({ path: path.join(outDir, 'pass18-verdict-contrast-1440.png') });
    }
    await page.close();
  }

  // (d) Copied ✓ state
  {
    const page = await browser.newPage();
    await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
    await wait(600);
    await clickBtn(page, 'Cases Imbas measured');
    await wait(400);
    await clickBtn(page, 'Copy question');
    await wait(300);
    await page.screenshot({ path: path.join(outDir, 'pass18-copied-1440.png'), fullPage: false });
    await page.close();
  }

  // (e) Words received acknowledgment
  {
    const page = await browser.newPage();
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(500);
    await page.screenshot({ path: path.join(outDir, 'pass18-words-received-1440.png'), fullPage: true });
    const ack = await page.evaluate(() => document.querySelector('.wb-paste-ack')?.textContent || '');
    console.log('paste ack:', ack);
    await page.close();
  }

  await browser.close();
  console.log('console errors:', consoleErrors.length ? consoleErrors : 'none');
})();
