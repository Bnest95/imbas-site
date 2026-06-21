import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'faq-what-next-p3');
const base = 'http://127.0.0.1:8792';

const EXPECTED_ANSWER =
  'The archive expands. More cases are recorded, scored, and published. The methodology is updated as new evidence and validation work become available.';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function clipShot(page, startSel, endSel, filename) {
  const box = await page.evaluate((start, end) => {
    const s = document.querySelector(start);
    const e = document.querySelector(end);
    if (!s || !e) return null;
    const r1 = s.getBoundingClientRect();
    const r2 = e.getBoundingClientRect();
    const top = r1.top + window.scrollY;
    const bottom = r2.bottom + window.scrollY;
    const left = Math.min(r1.left, r2.left);
    const right = Math.max(r1.right, r2.right);
    return {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: right - left,
      height: bottom - top,
    };
  }, startSel, endSel);
  if (!box) throw new Error(`Missing clip targets for ${filename}`);
  await page.screenshot({ path: path.join(outDir, filename), clip: box });
}

async function capture(filename, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/faq.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('#faq-q-16', { timeout: 10000 });
  await page.click('#faq-q-16');
  await wait(300);
  await clipShot(page, '#faq-q-15', '#faq-a-16', filename);

  const report = await page.evaluate((expectedAnswer) => {
    const trigger = document.querySelector('#faq-q-16');
    const answer = document.querySelector('#faq-a-16');
    const bodyText = document.body.textContent;
    return {
      question: trigger?.querySelector('.faq-entry__question-text')?.textContent.trim(),
      answer: answer?.textContent.trim(),
      answerMatches: answer?.textContent.trim() === expectedAnswer,
      expanded: trigger?.getAttribute('aria-expanded') === 'true',
      icon: trigger?.querySelector('.faq-entry__icon')?.textContent.trim(),
      hasLiveSignal: /live signal tool/i.test(bodyText),
      hasRoadmapLanguage: /becomes a live|coming soon|product launch/i.test(bodyText),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  }, EXPECTED_ANSWER);

  await page.close();
  return report;
}

const desktop = await capture('faq-what-next-desktop-1440.png', 1440);
const mobile = await capture('faq-what-next-mobile-375.png', 375);

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
