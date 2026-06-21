import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'field-notes-layout-pass3g');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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

// Mobile homepage module
const mob = await browser.newPage();
track(mob);
await mob.setViewport({ width: 375, height: 812, isMobile: true });
await mob.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(mob);
await scrollTo(mob, '.close__signup');
report.checks.mobileLayout = await mob.evaluate(() => {
  const form = document.querySelector('form.subscribe--field-notes');
  const btn = form?.querySelector('button[type="submit"]');
  const input = form?.querySelector('input[type="email"]');
  const msg = document.getElementById('field-notes-msg');
  const children = form ? [...form.children].map((n) => n.tagName) : [];
  const btnRect = btn?.getBoundingClientRect();
  const inputRect = input?.getBoundingClientRect();
  return {
    action: form?.getAttribute('action'),
    btnText: btn?.textContent?.replace(/\s+/g, ' ').trim(),
    placeholder: input?.placeholder,
    childrenOrder: children,
    buttonAboveInput: btnRect && inputRect ? btnRect.top < inputRect.top : null,
    msgVisible: msg?.classList.contains('is-visible'),
    msgText: msg?.textContent,
    pausedCopy: document.body.textContent.includes('temporarily unavailable'),
    ghostEndpoint: document.body.innerHTML.includes('send-magic-link'),
  };
});
await shot(mob, 'homepage-field-notes-mobile-375.png', '.close__signup');
await mob.close();

// Desktop homepage
const home = await browser.newPage();
track(home);
await home.setViewport({ width: 1440, height: 900 });
await home.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(home);
await scrollTo(home, '.close__signup');
await shot(home, 'homepage-field-notes-desktop-1440.png', '.close__signup');
await home.close();

// For Readers desktop
const readers = await browser.newPage();
track(readers);
await readers.setViewport({ width: 1440, height: 900 });
await readers.goto(`${base}/for-readers.html`, { waitUntil: 'networkidle0' });
await shot(readers, 'for-readers-field-notes-desktop-1440.png', '.rd-field-notes.field-notes-signup');
await readers.close();

// Field Notes index desktop
const fn = await browser.newPage();
track(fn);
await fn.setViewport({ width: 1440, height: 900 });
await fn.goto(`${base}/field-notes/`, { waitUntil: 'networkidle0' });
await shot(fn, 'field-notes-index-desktop-1440.png', '.fn-subscribe.field-notes-signup');
await fn.close();

// Success state
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
await success.type('form.subscribe--field-notes input[type="email"]', 'pass3g@example.com');
await success.click('form.subscribe--field-notes button[type="submit"]');
await wait(500);
report.checks.success = await success.evaluate(() => ({
  msg: document.getElementById('field-notes-msg')?.textContent?.trim(),
  visible: document.getElementById('field-notes-msg')?.classList.contains('is-visible'),
}));
await shot(success, 'homepage-field-notes-success-1440.png', '.close__signup');
await success.close();

// Invalid email
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
  visible: document.getElementById('field-notes-msg')?.classList.contains('is-visible'),
}));
await shot(invalid, 'homepage-field-notes-invalid-1440.png', '.close__signup');
await invalid.close();

await browser.close();

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
