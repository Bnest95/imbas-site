import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'your-experience-pass5l4');
const base = process.env.BASE_URL || 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
    protocolTimeout: 120000,
  });
}

async function captureContactField(width, height, filename) {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const metrics = await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
    const email = document.getElementById('experience-email');
    if (email) email.scrollIntoView({ block: 'center' });
    const field = document.getElementById('experience-email');
    if (!field) return { error: 'missing email field' };
    const style = getComputedStyle(field);
    const placeholderStyle = getComputedStyle(field, '::placeholder');
    return {
      placeholder: field.getAttribute('placeholder'),
      clientWidth: field.clientWidth,
      scrollWidth: field.scrollWidth,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      fontSize: style.fontSize,
      placeholderFontSize: placeholderStyle.fontSize,
      fits: field.scrollWidth <= field.clientWidth,
    };
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, filename), fullPage: false });
  await browser.close();
  return metrics;
}

(async () => {
  const mobile = await captureContactField(375, 812, 'contact-field-mobile-375.png');
  const desktop = await captureContactField(1440, 900, 'contact-field-desktop-1440.png');
  const report = { mobile, desktop, pass: mobile.fits === true };
  fs.writeFileSync(path.join(outDir, 'placeholder-check.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
})();
