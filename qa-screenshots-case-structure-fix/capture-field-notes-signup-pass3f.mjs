import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'field-notes-signup-pass3f');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const report = { console: [], requests: [], checks: {} };

async function revealAll(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach((el) => el.classList.add('is-visible'));
  });
  await wait(300);
}

async function shot(page, file, selector, scrollSel) {
  if (scrollSel) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      const header = document.querySelector('.site-header');
      const headerH = header ? header.getBoundingClientRect().height : 64;
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - headerH - 16;
        window.scrollTo(0, Math.max(0, y));
      }
    }, scrollSel);
    await wait(400);
  }
  const el = await page.$(selector);
  if (el) await el.screenshot({ path: path.join(outDir, file) });
  else await page.screenshot({ path: path.join(outDir, file), fullPage: true });
}

function trackPage(page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') report.console.push(msg.text());
  });
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('send-magic-link') || url.includes('field-notes-signup')) {
      report.requests.push({ url, method: req.method() });
    }
  });
}

// Homepage signup
const home = await browser.newPage();
trackPage(home);
await home.setViewport({ width: 1440, height: 900 });
await home.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(home);
report.checks.homeForm = await home.evaluate(() => ({
  action: document.querySelector('form.subscribe--field-notes')?.getAttribute('action'),
  btnDisabled: document.querySelector('form.subscribe--field-notes button')?.disabled,
  pausedCopy: document.body.textContent.includes('temporarily unavailable'),
  inputDisabled: document.querySelector('form.subscribe--field-notes input')?.disabled,
}));
await shot(home, 'homepage-field-notes-signup-1440.png', '.close__signup', '#fn-h2');
await home.close();

// For Readers signup
const readers = await browser.newPage();
trackPage(readers);
await readers.setViewport({ width: 1440, height: 900 });
await readers.goto(`${base}/for-readers.html`, { waitUntil: 'networkidle0' });
await shot(readers, 'for-readers-field-notes-signup-1440.png', '.rd-field-notes.field-notes-signup');
await readers.close();

// Field Notes index signup
const fn = await browser.newPage();
trackPage(fn);
await fn.setViewport({ width: 1440, height: 900 });
await fn.goto(`${base}/field-notes/`, { waitUntil: 'networkidle0' });
await shot(fn, 'field-notes-index-signup-1440.png', '.fn-subscribe.field-notes-signup', '#fn-subscribe-heading');
await fn.close();

// Invalid email state
const invalid = await browser.newPage();
trackPage(invalid);
await invalid.setViewport({ width: 1440, height: 900 });
await invalid.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(invalid);
await invalid.evaluate(() => {
  const form = document.querySelector('form.subscribe--field-notes');
  const input = form?.querySelector('input[type="email"]');
  if (input) input.value = 'not-an-email';
  form?.requestSubmit();
});
await wait(300);
report.checks.invalid = await invalid.evaluate(() => ({
  msg: document.getElementById('field-notes-msg')?.textContent?.trim(),
  uppercase: document.getElementById('field-notes-msg')?.textContent === document.getElementById('field-notes-msg')?.textContent?.toUpperCase(),
}));
await shot(invalid, 'homepage-field-notes-invalid-1440.png', '.close__signup', '#fn-h2');
await invalid.close();

// Success state (mock API)
const success = await browser.newPage();
trackPage(success);
await success.setViewport({ width: 1440, height: 900 });
await success.setRequestInterception(true);
success.on('request', (req) => {
  const url = req.url();
  if (url.includes('/api/field-notes-signup')) {
    report.requests.push({ url, method: req.method(), mocked: true });
    req.respond({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
    return;
  }
  req.continue();
});
await success.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(success);
await success.type('form.subscribe--field-notes input[type="email"]', 'pass3f@example.com');
await success.click('form.subscribe--field-notes button[type="submit"]');
await wait(500);
report.checks.success = await success.evaluate(() => ({
  msg: document.getElementById('field-notes-msg')?.textContent?.trim(),
  subscribed: document.querySelector('form.subscribe--field-notes')?.classList.contains('is-subscribed'),
}));
await shot(success, 'homepage-field-notes-success-1440.png', '.close__signup', '#fn-h2');
await success.close();

// Live submit attempt (static server — expect 501/404, no Ghost)
const live = await browser.newPage();
const liveReqs = [];
live.on('request', (req) => {
  const url = req.url();
  if (url.includes('field-notes-signup') || url.includes('send-magic-link')) {
    liveReqs.push({ url, method: req.method() });
  }
});
await live.setViewport({ width: 1440, height: 900 });
await live.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
await revealAll(live);
await live.type('form.subscribe--field-notes input[type="email"]', 'live-check@example.com');
await live.click('form.subscribe--field-notes button[type="submit"]');
await wait(500);
report.checks.liveSubmit = {
  requests: liveReqs,
  noGhost: !liveReqs.some((r) => r.url.includes('send-magic-link')),
  hitsApi: liveReqs.some((r) => r.url.includes('/api/field-notes-signup')),
};
await live.close();

await browser.close();

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
