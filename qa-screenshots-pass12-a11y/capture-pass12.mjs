import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8000/workbench.html', { waitUntil: 'networkidle0' });
  await wait(600);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ran it'));
    if (btn) btn.click();
  });
  await wait(500);
  await page.type('input[type="email"]', 'qa-pass12@imbaslabs.com');
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Continue'));
    if (btn) btn.click();
  });
  await wait(500);
  await page.screenshot({ path: path.join(__dirname, 'pass12-mobile-390-paste-flow.png'), fullPage: true });
  const audit = await page.evaluate(() => ({
    togglePressed: document.querySelector('button[aria-pressed="true"]')?.textContent.trim(),
    inputFont: getComputedStyle(document.querySelector('textarea')).fontSize,
    btnMinHeight: getComputedStyle(document.querySelector('button.wb-focus')).minHeight,
    emailLabel: !!document.querySelector('label')?.textContent.includes('Your email') || [...document.querySelectorAll('label')].some((l) => l.textContent.includes('Your email')),
    caseCards: document.querySelectorAll('.wb-case-card').length,
  }));
  console.log(JSON.stringify(audit, null, 2));
  await browser.close();
})();
