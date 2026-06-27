import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'homepage-pass5p');
const base = process.env.BASE_URL || 'http://127.0.0.1:8792';
const widths = [390, 430, 1440];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const AREAS = [
  { slug: '01-hero-through-why', selector: '.stakes.stakes--context-lead', block: 'center' },
  { slug: '02-thesis-your-experience', selector: '.compounding', block: 'start' },
  { slug: '03-your-experience-form', selector: '.experience-intake', block: 'center' },
  { slug: '04-your-experience-ephemeral', selector: '#ephemeral-h2', block: 'center' },
  { slug: '05-categories-how-works', selector: '.categories', block: 'start' },
  { slug: '06-public-interest-roadmap', selector: '#public-interest-h2', block: 'center' },
  { slug: '07-roadmap-audiences', selector: '.roadmap', block: 'start' },
  { slug: '08-archive', selector: '#archive', block: 'center' },
  { slug: '09-field-notes', selector: '#field-notes-form', block: 'center' },
  { slug: '10-footer', selector: '.site-footer', block: 'end' },
];

fs.mkdirSync(outDir, { recursive: true });

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    protocolTimeout: 120000,
  });
}

async function primePage(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  });
}

async function captureArea(page, width, area) {
  const height = width >= 1200 ? 900 : 844;
  await page.setViewport({ width, height });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await primePage(page);
  if (area.slug === '09-field-notes') {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      document.getElementById('field-notes-form')?.scrollIntoView({ block: 'center' });
    });
  } else {
    await page.evaluate(
      (sel, block) => document.querySelector(sel)?.scrollIntoView({ block }),
      area.selector,
      area.block,
    );
  }
  await wait(450);
  const filename = `${area.slug}-${width}.png`;
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
  return filename;
}

async function checkFieldNotesOrder(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const order = await page.evaluate(() => {
    const form = document.getElementById('field-notes-form');
    if (!form) return { error: 'missing form' };
    const kids = [...form.children].filter((el) => !el.classList.contains('subscribe__hp'));
    return kids.map((el) => el.tagName.toLowerCase());
  });
  await page.close();
  return order;
}

async function checkTrustLine(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await primePage(page);
  const trust = await page.evaluate(() => {
    const el = document.querySelector('.experience-capture__trust');
    if (!el) return { error: 'missing trust line' };
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const submit = document.querySelector('.experience-capture__submit');
    const submitRect = submit?.getBoundingClientRect();
    return {
      text: el.textContent.trim(),
      fontSize: style.fontSize,
      color: style.color,
      belowSubmit: submitRect ? rect.top >= submitRect.bottom - 2 : null,
      visible: rect.height > 0 && rect.width > 0,
    };
  });
  await page.close();
  return trust;
}

(async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  const screenshots = [];
  for (const width of widths) {
    for (const area of AREAS) {
      const file = await captureArea(page, width, area);
      screenshots.push(file);
    }
  }
  const fieldNotesOrder = await checkFieldNotesOrder(browser);
  const trustLine = await checkTrustLine(browser);
  await browser.close();

  const report = {
    screenshots,
    fieldNotesOrder,
    trustLine,
    pass:
      fieldNotesOrder[0] === 'input' &&
      fieldNotesOrder[1] === 'button' &&
      trustLine.visible &&
      trustLine.belowSubmit &&
      /reviewed/.test(trustLine.text || ''),
  };
  fs.writeFileSync(path.join(outDir, 'pass5p-check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
})();
