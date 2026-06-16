import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto('http://127.0.0.1:8791/workbench.html', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => {
  [...document.querySelectorAll('.wb-mode-btn')].find((b) => b.textContent.includes('Bring your own'))?.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.evaluate(() => {
  document.querySelector('.wb-action-row .wb-btn--primary:disabled')?.scrollIntoView({ block: 'center' });
});
await new Promise((r) => setTimeout(r, 300));
const el = await page.$('.wb-console__measure-main');
await el.screenshot({ path: 'qa-screenshots-pass22-parity/btn-disabled-byo-continue-1440.png' });
await browser.close();
console.log('saved qa-screenshots-pass22-parity/btn-disabled-byo-continue-1440.png');
