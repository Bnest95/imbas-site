import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'workbench-pass-b');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const GAP_HELD_ANSWER =
  'Stock buybacks return cash to shareholders and can lift earnings per share. Companies repurchase shares when they believe the stock is undervalued. ' +
  'Critics argue buybacks divert capital from investment. The practice grew after regulatory changes in the 1980s. ' +
  'Buybacks can signal management confidence and improve capital allocation when excess cash exists on the balance sheet.';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

async function loadResult(page, width, height, isMobile = false) {
  await page.setViewport({ width, height, isMobile, deviceScaleFactor: 1 });
  await page.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
  await wait(600);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ran it'))?.click());
  await wait(400);
  await page.select('select', 'ChatGPT');
  await page.evaluate((text) => {
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }, GAP_HELD_ANSWER);
  await wait(300);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Compare'))?.click());
  await page.waitForSelector('.wb-result-outcome.is-visible', { timeout: 15000 });
  await wait(900);
}

for (const [name, width, height, mobile] of [
  ['result-major-gap-desktop-1440.png', 1440, 900, false],
  ['result-major-gap-mobile-375.png', 375, 812, true],
]) {
  const page = await browser.newPage();
  await loadResult(page, width, height, mobile);
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  await page.close();
}

const verifyPage = await browser.newPage();
await loadResult(verifyPage, 1440, 900);

const report = await verifyPage.evaluate(() => {
  const score = document.querySelector('.wb-result-gap-hero__score');
  const gauge = document.querySelector('.wb-result-gap-gauge');
  const outcome = document.querySelector('.wb-result-outcome');
  const terms = document.querySelector('.wb-result-module--terms');
  const shareOpen = document.querySelector('.wb-collapsible--share .wb-share-panel__text');
  const recordOpen = document.querySelector('.wb-collapsible--record .wb-status-readout__record');
  const scoreRect = score?.getBoundingClientRect();
  const gaugeRect = gauge?.getBoundingClientRect();
  return {
    scoreText: score?.textContent?.trim(),
    scoreFontSize: score ? getComputedStyle(score).fontSize : null,
    scoreAboveGauge: scoreRect && gaugeRect ? scoreRect.top < gaugeRect.top : null,
    outcomeText: outcome?.textContent?.trim(),
    outcomeVisible: outcome?.classList.contains('is-visible'),
    termsBeforeAnswer: !!(terms && document.querySelector('.wb-result-module--answer') && terms.compareDocumentPosition(document.querySelector('.wb-result-module--answer')) & Node.DOCUMENT_POSITION_FOLLOWING),
    shareCollapsed: !shareOpen,
    recordCollapsed: !recordOpen,
    shareToggle: document.querySelector('.wb-collapsible--share .wb-collapsible__title')?.textContent?.trim(),
    recordToggle: document.querySelector('.wb-collapsible--record .wb-collapsible__title')?.textContent?.trim(),
  };
});

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
