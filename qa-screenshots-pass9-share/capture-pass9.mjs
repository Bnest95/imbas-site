import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = 'http://127.0.0.1:8000/workbench.html';

const GAP_HELD =
  'Stock buybacks return cash to shareholders and can lift earnings per share by reducing share count. ' +
  'Companies often repurchase shares when they believe the stock is undervalued. Critics argue buybacks divert capital from investment and wages. ' +
  'The practice grew after regulatory changes in the 1980s and has become a major use of corporate cash reserves.';

const GAP_CLOSED =
  'Stock buybacks return cash to shareholders and can lift earnings per share. Companies repurchase shares when they believe the stock is undervalued. ' +
  'Critics argue buybacks divert capital from investment. The practice grew after regulatory changes in the 1980s. ' +
  'SEC Rule 10b-18, adopted in 1982, provides a safe harbor from market-manipulation liability for open-market repurchases under specified conditions.';

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
  await page.type('input[type="email"]', 'qa-pass9@imbaslabs.com');
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

async function runCase(page, paste, shotName, receiptName) {
  await goToPasteStep(page);
  await setTextarea(page, paste);
  await wait(200);
  await clickBtn(page, 'Compare');
  await wait(800);
  await page.screenshot({ path: path.join(outDir, shotName), fullPage: true });
  const receipt = await page.evaluate(() => {
    const pre = document.querySelector('pre');
    return pre ? pre.textContent : '';
  });
  fs.writeFileSync(path.join(outDir, receiptName), receipt);
  console.log('---', receiptName, '---');
  console.log(receipt);
  return receipt;
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page1 = await browser.newPage();
  await runCase(page1, GAP_HELD, 'pass9-gap-held-1440.png', 'receipt-gap-held.txt');
  await page1.close();

  const page2 = await browser.newPage();
  await runCase(page2, GAP_CLOSED, 'pass9-key-found-1440.png', 'receipt-key-found.txt');
  await page2.close();

  await browser.close();
})();
