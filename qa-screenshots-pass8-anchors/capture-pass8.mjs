import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = 'http://127.0.0.1:8000/workbench.html';

const OBSERVED_005 =
  'On an open question about stock buybacks, three of the four frontier models tested — ChatGPT, Claude, and Gemini — left out SEC Rule 10b-18, the 1982 rule that gave buybacks a safe harbor from market-manipulation liability. Only Grok mentioned it.';

const GAP_CLOSED =
  'Stock buybacks return cash to shareholders and can lift earnings per share. Companies repurchase shares when they believe the stock is undervalued. ' +
  'Critics argue buybacks divert capital from investment. The practice grew after regulatory changes in the 1980s. ' +
  'SEC Rule 10b-18, adopted in 1982, provides a safe harbor from market-manipulation liability for open-market repurchases under specified conditions.';

const SHORT_50 = 'Buybacks return cash to shareholders and lift EPS.';

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
  await page.type('input[type="email"]', 'qa-pass8@imbaslabs.com');
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

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  // Test 3: 50-char paste rejected
  {
    const page = await browser.newPage();
    await goToPasteStep(page);
    await setTextarea(page, SHORT_50);
    await wait(300);
    await page.screenshot({ path: path.join(outDir, 'pass8-test3-short-paste-1440.png'), fullPage: true });
    const disabled = await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Compare'))?.disabled);
    console.log('test3 disabled btn:', disabled);
    await page.close();
  }

  // Test 2: page text rejected
  {
    const page = await browser.newPage();
    await goToPasteStep(page);
    await setTextarea(page, OBSERVED_005);
    await wait(200);
    await clickBtn(page, 'Compare');
    await wait(400);
    await page.screenshot({ path: path.join(outDir, 'pass8-test2-page-text-rejected-1440.png'), fullPage: true });
    const err = await page.evaluate(() => [...document.querySelectorAll('div')].find((d) => d.textContent.includes("Paste the model's actual answer"))?.textContent || '');
    console.log('test2 error:', err);
    await page.close();
  }

  // Test 1: Rule 10b-18 gap closed
  {
    const page = await browser.newPage();
    await goToPasteStep(page);
    await setTextarea(page, GAP_CLOSED);
    await wait(200);
    await clickBtn(page, 'Compare');
    await wait(800);
    await page.screenshot({ path: path.join(outDir, 'pass8-test1-gap-closed-1440.png'), fullPage: true });
    const verdict = await page.evaluate(() => [...document.querySelectorAll('div')].find((d) => d.textContent.includes('gap may be narrowing'))?.textContent || '');
    const highlights = await page.evaluate(() => document.querySelectorAll('span[style*="180,106,90"]').length);
    console.log('test1 verdict found:', verdict.length > 0);
    console.log('test1 highlights:', highlights);
    await page.close();
  }

  await browser.close();
})();
