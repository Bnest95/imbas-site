import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'qa-screenshots-pass22-parity');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const LONG_ANSWER =
  'Stock buybacks have become a major feature of corporate finance in recent decades. Companies repurchase shares to return capital to investors, which can boost earnings per share metrics. Critics argue buybacks divert funds from research and wages while proponents cite flexibility for capital allocation. The practice interacts with tax policy, executive compensation structures, and market liquidity conditions in ways that economists continue to debate across different regulatory environments and political cycles worldwide today.';

const TARGETED_ANSWER =
  'SEC Rule 10b-18 provides a safe harbor for companies conducting stock repurchases without facing market manipulation charges. The rule sets conditions on timing, volume, and pricing of buybacks. Understanding this regulatory framework is essential when evaluating how buyback programs operate within legal boundaries and how policy changes could affect corporate behavior in capital markets over time for shareholders.';

async function shot(page, width, name) {
  await page.setViewport({ width, height: width === 375 ? 812 : 900, deviceScaleFactor: 2 });
  const target = (await page.$('.wb-shell')) || (await page.$('.wb-stage'));
  await target.screenshot({ path: path.join(outDir, `${name}-${width}.png`) });
}

async function gotoWorkbench(page) {
  await page.goto('http://127.0.0.1:8791/workbench.html?v=parity', { waitUntil: 'networkidle0' });
  await sleep(800);
}

async function clickBtn(page, text) {
  await page.evaluate((t) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim().includes(t));
    btn?.click();
  }, text);
  await sleep(400);
}

async function switchMode(page, mode) {
  const label = mode === 'byo' ? 'Bring your own' : 'Cases Imbas measured';
  await page.evaluate((lbl) => {
    [...document.querySelectorAll('.wb-mode-btn')].find((b) => b.textContent.includes(lbl))?.click();
  }, label);
  await sleep(500);
}

async function fillEmail(page) {
  await page.type('input[type="email"]', 'test@example.com', { delay: 8 });
  await clickBtn(page, 'Continue →');
  await sleep(500);
}

async function selectFirstModel(page) {
  await page.select('select.wb-input', 'ChatGPT');
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

// --- Desktop matrix ---
{
  const page = await browser.newPage();

  // 1 measured initial
  await gotoWorkbench(page);
  await shot(page, 1440, '01-measured-initial');

  // 2 selected detail (same as initial step 0)
  await page.evaluate(() => document.querySelector('.wb-readout')?.scrollIntoView({ block: 'start' }));
  await sleep(300);
  await shot(page, 1440, '02-measured-detail');

  // 4 email gate
  await clickBtn(page, 'Ran it — paste the answer →');
  await sleep(400);
  await shot(page, 1440, '04-measured-email-gate');

  // 3 paste-answer state
  await fillEmail(page);
  await selectFirstModel(page);
  await page.type('textarea.wb-input', LONG_ANSWER.slice(0, 220), { delay: 2 });
  await sleep(400);
  await shot(page, 1440, '03-measured-paste-answer');

  // 5 result
  await page.evaluate((text) => {
    const ta = document.querySelector('textarea.wb-input');
    if (ta) {
      ta.value = text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, LONG_ANSWER);
  await sleep(300);
  await clickBtn(page, 'Compare with what Imbas observed');
  await sleep(2200);
  await shot(page, 1440, '05-measured-result');

  // 6 share/copy
  await page.evaluate(() => document.querySelector('.wb-share-panel')?.scrollIntoView({ block: 'center' }));
  await sleep(600);
  await shot(page, 1440, '06-measured-share');

  // 7 BYO empty
  await gotoWorkbench(page);
  await switchMode(page, 'byo');
  await shot(page, 1440, '07-byo-empty');

  // 8 BYO filled Continue enabled
  await selectFirstModel(page);
  await page.type('textarea.wb-input', 'How do stock buybacks affect the economy?', { delay: 5 });
  const textareas = await page.$$('textarea.wb-input');
  if (textareas[1]) {
    await textareas[1].type(LONG_ANSWER, { delay: 1 });
  }
  await sleep(400);
  await shot(page, 1440, '08-byo-filled-continue');

  // 9 BYO email gate
  await clickBtn(page, 'Continue →');
  await sleep(400);
  await shot(page, 1440, '09-byo-email-gate');

  // 10 BYO result + 11 share (copy record only — no ShareResult in BYO)
  await fillEmail(page);
  await page.type('textarea.wb-input', 'What is SEC Rule 10b-18 and how does it relate to stock buyback safe harbor provisions?', { delay: 3 });
  await clickBtn(page, "Wrote it — I'll run this in my AI");
  await sleep(500);
  await page.type('textarea.wb-input', TARGETED_ANSWER, { delay: 1 });
  await clickBtn(page, 'Continue →');
  await sleep(500);
  await page.type('input.wb-input', 'SEC Rule 10b-18 safe harbor for buybacks');
  await page.select('select.wb-input', 'Omission');
  await clickBtn(page, 'Review before submit');
  await sleep(500);
  await clickBtn(page, 'Submit for review');
  await sleep(1200);
  await shot(page, 1440, '10-byo-result');
  await page.evaluate(() => document.querySelector('.wb-action-row--record')?.scrollIntoView({ block: 'center' }));
  await sleep(400);
  await shot(page, 1440, '11-byo-copy-record');

  await page.close();
}

// --- Mobile matrix ---
{
  const page = await browser.newPage();

  // 12 measured detail
  await gotoWorkbench(page);
  await shot(page, 375, '12-measured-detail');

  // 13 measured result/share
  await clickBtn(page, 'Ran it — paste the answer →');
  await fillEmail(page);
  await selectFirstModel(page);
  await page.evaluate((text) => {
    const ta = document.querySelector('textarea.wb-input');
    if (ta) {
      ta.value = text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, LONG_ANSWER);
  await sleep(300);
  await clickBtn(page, 'Compare with what Imbas observed');
  await sleep(2200);
  await page.evaluate(() => document.querySelector('.wb-share-panel')?.scrollIntoView({ block: 'center' }));
  await sleep(400);
  await shot(page, 375, '13-measured-result-share');

  // 14 BYO empty
  await gotoWorkbench(page);
  await switchMode(page, 'byo');
  await shot(page, 375, '14-byo-empty');

  // 15 BYO email gate
  await selectFirstModel(page);
  const tas = await page.$$('textarea.wb-input');
  if (tas[0]) await tas[0].type('How do stock buybacks affect the economy?', { delay: 4 });
  if (tas[1]) await tas[1].type(LONG_ANSWER, { delay: 1 });
  await clickBtn(page, 'Continue →');
  await sleep(400);
  await shot(page, 375, '15-byo-email-gate');

  // 16 BYO result/share
  await fillEmail(page);
  await page.type('textarea.wb-input', 'What is SEC Rule 10b-18 and how does it relate to stock buyback safe harbor provisions?', { delay: 3 });
  await clickBtn(page, "Wrote it — I'll run this in my AI");
  await sleep(400);
  await page.type('textarea.wb-input', TARGETED_ANSWER, { delay: 1 });
  await clickBtn(page, 'Continue →');
  await sleep(400);
  await page.type('input.wb-input', 'SEC Rule 10b-18 safe harbor for buybacks');
  await page.select('select.wb-input', 'Omission');
  await clickBtn(page, 'Review before submit');
  await sleep(400);
  await clickBtn(page, 'Submit for review');
  await sleep(1200);
  await page.evaluate(() => document.querySelector('.wb-action-row--record')?.scrollIntoView({ block: 'center' }));
  await sleep(400);
  await shot(page, 375, '16-byo-result-share');

  await page.close();
}

await browser.close();
console.log('saved to qa-screenshots-pass22-parity/');
