import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'your-experience-trust-pass5p1');
const base = process.env.BASE_URL || 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

async function capture(width) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();
  const height = width >= 1200 ? 900 : 844;
  await page.setViewport({ width, height });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const metrics = await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    const trust = document.querySelector('.experience-capture__trust');
    const submit = document.querySelector('.experience-capture__submit');
    const intake = document.querySelector('.experience-intake');
    if (!trust) return { error: 'missing trust line' };
    trust.scrollIntoView({ block: 'center' });
    const ts = getComputedStyle(trust);
    const tr = trust.getBoundingClientRect();
    const sr = submit?.getBoundingClientRect();
    const ir = intake?.getBoundingClientRect();
    return {
      color: ts.color,
      opacity: ts.opacity,
      fontSize: ts.fontSize,
      text: trust.textContent.trim(),
      trustHeight: Math.round(tr.height),
      gapFromSubmit: sr ? Math.round(tr.top - sr.bottom) : null,
      trustInIntake: ir ? tr.bottom <= ir.bottom + 2 && tr.top >= ir.top : null,
      overflow: document.body.scrollWidth > innerWidth,
    };
  });
  await wait(450);
  const filename = `your-experience-trust-${width}.png`;
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
  await browser.close();
  return { filename, metrics };
}

(async () => {
  const widths = [1440, 390, 430];
  const report = { screenshots: [], checks: {} };
  for (const w of widths) {
    const { filename, metrics } = await capture(w);
    report.screenshots.push(filename);
    report.checks[w] = metrics;
  }
  report.pass =
    report.checks[1440]?.text?.includes('reviewed') &&
    report.checks[390]?.gapFromSubmit >= 8 &&
    !report.checks[390]?.overflow &&
    !report.checks[430]?.overflow &&
    !report.checks[1440]?.overflow;
  fs.writeFileSync(path.join(outDir, 'trust-check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
})();
