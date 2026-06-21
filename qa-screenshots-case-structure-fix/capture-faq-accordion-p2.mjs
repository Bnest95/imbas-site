import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'faq-accordion-p2');
const base = 'http://127.0.0.1:8792';

const EXPECTED_QUESTIONS = [
  'What is the Volunteer Gap?',
  'Is Imbas a fact-checking site?',
  'Is the Volunteer Gap a claim about intent?',
  'Is this the same as AI bias?',
  'Why compare open prompts and direct prompts?',
  'What does 0–3 mean?',
  'Who is Imbas for?',
  'Is the methodology final?',
  'How many cases are in the archive?',
  'What is the antenna metaphor?',
  'Why does Imbas refuse to say “this AI is biased”?',
  'Is there an inter-rater reliability number for the v1 scoring?',
  'What does Imbas mean by “behavioral observability”?',
  'Why does Imbas use multiple models?',
  'Why do documented prompt conditions matter?',
  'Can Imbas be wrong?',
  'What happens next?',
];

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

async function collectReport(page) {
  return page.evaluate((expected) => {
    const triggers = [...document.querySelectorAll('.faq-entry__trigger')];
    const questions = triggers.map((t) => t.querySelector('.faq-entry__question-text')?.textContent.trim());
    const answers = [...document.querySelectorAll('.faq-entry__answer')].map((dd) => dd.textContent.trim());
    const openCount = triggers.filter((t) => t.getAttribute('aria-expanded') === 'true').length;
    const hiddenCount = [...document.querySelectorAll('.faq-entry__answer')].filter((dd) => dd.hidden).length;
    const icons = triggers.map((t) => t.querySelector('.faq-entry__icon')?.textContent.trim());
    const ariaPairs = triggers.every((t) => {
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      return panel && panel.getAttribute('aria-labelledby') === t.id;
    });
    return {
      questionCount: questions.length,
      answerCount: answers.length,
      questions,
      orderMatches: JSON.stringify(questions) === JSON.stringify(expected),
      openCount,
      hiddenCount,
      allClosedByDefault: openCount === 0 && hiddenCount === questions.length,
      iconsAllPlusWhenClosed: icons.every((i) => i === '+'),
      ariaPairs,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  }, EXPECTED_QUESTIONS);
}

async function captureSet(width, label) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/faq.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.faq-entry__trigger', { timeout: 10000 });
  await wait(400);

  await clipShot(page, '.faq-masthead', '.faq-group:last-of-type', `${label}-closed-${width}.png`);
  const closedReport = await collectReport(page);

  await page.click('#faq-q-01');
  await wait(300);
  await clipShot(page, '.faq-masthead', '.faq-group:last-of-type', `${label}-open-${width}.png`);
  const openReport = await collectReport(page);

  const firstIcon = await page.$eval('#faq-q-01 .faq-entry__icon', (el) => el.textContent.trim());
  const firstExpanded = await page.$eval('#faq-q-01', (el) => el.getAttribute('aria-expanded'));

  await page.focus('#faq-q-02');
  await page.keyboard.press('Enter');
  await wait(200);
  const keyboardExpanded = await page.$eval('#faq-q-02', (el) => el.getAttribute('aria-expanded'));
  const keyboardIcon = await page.$eval('#faq-q-02 .faq-entry__icon', (el) => el.textContent.trim());

  await page.close();

  return {
    closed: closedReport,
    open: openReport,
    firstOpenIcon: firstIcon,
    firstOpenExpanded: firstExpanded,
    keyboardToggleWorks: keyboardExpanded === 'true' && keyboardIcon === '−',
  };
}

const desktop = await captureSet(1440, 'faq-accordion');
const mobile = await captureSet(375, 'faq-accordion');

const report = { desktop, mobile };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
