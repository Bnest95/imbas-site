import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:8000/workbench.html';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const OPEN_ANSWER =
  'Stock buybacks return cash to shareholders and can lift earnings per share by reducing share count. ' +
  'Companies often repurchase shares when they believe the stock is undervalued. Critics argue buybacks divert capital from investment and wages. ' +
  'The practice grew after regulatory changes in the 1980s and has become a major use of corporate cash reserves.';

async function clickBtn(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().includes(t));
    if (!btn) throw new Error('button not found: ' + t);
    btn.click();
  }, text);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, defaultViewport: { width: 1440, height: 900 }, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(base, { waitUntil: 'networkidle0' });
  await wait(600);
  await clickBtn(page, 'Cases Imbas measured');
  await wait(300);
  await clickBtn(page, 'Ran it');
  await wait(500);
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'qa-pass11@imbaslabs.com');
  await clickBtn(page, 'Continue');
  await wait(500);
  await page.select('select', 'ChatGPT');
  await page.evaluate((text) => {
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }, OPEN_ANSWER);
  await wait(200);
  await clickBtn(page, 'Compare');
  await wait(1000);
  const msg = await page.evaluate(() => document.body.innerText.includes("Couldn't send"));
  console.log('failure visible:', msg);
  await page.screenshot({ path: path.join(__dirname, 'pass11-submit-failure-1440.png'), fullPage: true });
  await browser.close();
})();
