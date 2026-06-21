import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'field-notes-color-pass3h');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const EMBER_SOFT = 'rgb(240, 143, 88)';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const report = { console: [], checks: {} };

async function revealAll(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach((el) => el.classList.add('is-visible'));
  });
  await wait(300);
}

async function scrollTo(page, sel) {
  await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    const header = document.querySelector('.site-header');
    const headerH = header ? header.getBoundingClientRect().height : 64;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo(0, Math.max(0, y));
    }
  }, sel);
  await wait(400);
}

async function shot(page, file, selector) {
  const el = await page.$(selector);
  if (el) await el.screenshot({ path: path.join(outDir, file) });
}

function track(page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.console.push(msg.text());
  });
}

async function auditModule(page, selector) {
  return page.evaluate(({ sel, emberSoft }) => {
    const heading = document.querySelector(`${sel} .field-notes__heading`);
    const btn = document.querySelector(`${sel} form.subscribe--field-notes button`);
    const input = document.querySelector(`${sel} form.subscribe--field-notes input`);
    const msg = document.querySelector(`${sel} .subscribe__msg`);
    const hStyle = heading ? getComputedStyle(heading) : null;
    const bStyle = btn ? getComputedStyle(btn) : null;
    const bg = bStyle?.backgroundColor || '';
    const filledOrange = bg.includes('184') || bg.includes('180, 106') || bg.includes('180,106');
    return {
      headingColor: hStyle?.color ?? null,
      headingIsEmberSoft: hStyle?.color === emberSoft,
      buttonBg: bg,
      buttonFilledBlock: filledOrange,
      buttonBorder: bStyle?.borderColor ?? null,
      buttonColor: bStyle?.color ?? null,
      buttonBoxShadow: bStyle?.boxShadow ?? null,
      inputPlaceholder: input?.placeholder,
      msgVisible: msg?.classList.contains('is-visible') ?? false,
      action: document.querySelector(`${sel} form.subscribe--field-notes`)?.getAttribute('action'),
    };
  }, { sel: selector, emberSoft: EMBER_SOFT });
}

const mob = await browser.newPage();
track(mob);
await mob.setViewport({ width: 375, height: 812, isMobile: true });
await mob.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(mob);
await scrollTo(mob, '.close__signup');
report.checks.mobile = await auditModule(mob, '.close__signup');
await shot(mob, 'homepage-field-notes-mobile-375.png', '.close__signup');
await mob.close();

const home = await browser.newPage();
track(home);
await home.setViewport({ width: 1440, height: 900 });
await home.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(home);
await scrollTo(home, '.close__signup');
report.checks.homeDesktop = await auditModule(home, '.close__signup');
await shot(home, 'homepage-field-notes-desktop-1440.png', '.close__signup');
await home.close();

const readers = await browser.newPage();
track(readers);
await readers.setViewport({ width: 1440, height: 900 });
await readers.goto(`${base}/for-readers.html`, { waitUntil: 'networkidle0' });
report.checks.readers = await auditModule(readers, '.rd-field-notes.field-notes-signup');
await shot(readers, 'for-readers-field-notes-desktop-1440.png', '.rd-field-notes.field-notes-signup');
await readers.close();

const fn = await browser.newPage();
track(fn);
await fn.setViewport({ width: 1440, height: 900 });
await fn.goto(`${base}/field-notes/`, { waitUntil: 'networkidle0' });
report.checks.fieldNotesIndex = await auditModule(fn, '.fn-subscribe.field-notes-signup');
await shot(fn, 'field-notes-index-desktop-1440.png', '.fn-subscribe.field-notes-signup');
await fn.close();

const success = await browser.newPage();
track(success);
await success.setViewport({ width: 1440, height: 900 });
await success.setRequestInterception(true);
success.on('request', (req) => {
  if (req.url().includes('/api/field-notes-signup')) {
    req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    return;
  }
  req.continue();
});
await success.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(success);
await scrollTo(success, '.close__signup');
await success.type('form.subscribe--field-notes input[type="email"]', 'pass3h@example.com');
await success.click('form.subscribe--field-notes button[type="submit"]');
await wait(500);
report.checks.success = await success.evaluate(() => ({
  msg: document.getElementById('field-notes-msg')?.textContent?.trim(),
}));
await shot(success, 'homepage-field-notes-success-1440.png', '.close__signup');
await success.close();

const invalid = await browser.newPage();
track(invalid);
await invalid.setViewport({ width: 1440, height: 900 });
await invalid.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(invalid);
await scrollTo(invalid, '.close__signup');
await invalid.evaluate(() => {
  const form = document.querySelector('form.subscribe--field-notes');
  const input = form?.querySelector('input[type="email"]');
  if (input) input.value = 'bad';
  form?.requestSubmit();
});
await wait(300);
report.checks.invalid = await invalid.evaluate(() => ({
  msg: document.getElementById('field-notes-msg')?.textContent?.trim(),
}));
await shot(invalid, 'homepage-field-notes-invalid-1440.png', '.close__signup');
await invalid.close();

await browser.close();

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
