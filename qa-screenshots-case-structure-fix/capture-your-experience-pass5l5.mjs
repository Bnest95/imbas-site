import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'your-experience-pass5l5');
const base = process.env.BASE_URL || 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    protocolTimeout: 120000,
  });
}

async function inspectSubmit(width, height, filename) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const metrics = await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    const btn = document.querySelector('.experience-capture__submit');
    if (!btn) return { error: 'missing submit button' };
    btn.scrollIntoView({ block: 'center' });
    const rect = btn.getBoundingClientRect();
    const style = getComputedStyle(btn);
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      minHeight: style.minHeight,
      padding: style.padding,
      backgroundColor: style.backgroundColor,
      border: style.border,
      borderBottom: style.borderBottom,
      borderRadius: style.borderRadius,
      text: btn.textContent.replace(/\s+/g, ' ').trim(),
      meets44: rect.height >= 44 && rect.width >= 44,
      noFill: style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent',
      noBoxChrome: style.borderRadius === '0px' && !style.border.includes('solid') && style.borderBottomWidth === '1px',
    };
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
  await browser.close();
  return metrics;
}

(async () => {
  const mobile = await inspectSubmit(375, 812, 'submit-hit-area-mobile-375.png');
  const desktop = await inspectSubmit(1440, 900, 'submit-hit-area-desktop-1440.png');
  const report = {
    mobile,
    desktop,
    pass:
      mobile.meets44 &&
      desktop.meets44 &&
      mobile.noFill &&
      desktop.noFill &&
      mobile.noBoxChrome &&
      desktop.noBoxChrome,
  };
  fs.writeFileSync(path.join(outDir, 'hit-area-check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
})();
