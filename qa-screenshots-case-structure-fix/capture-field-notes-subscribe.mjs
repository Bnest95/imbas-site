import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'field-notes-subscribe');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function revealAll(page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal-section]').forEach((s) => s.classList.add('is-revealed'));
    document.querySelectorAll('.reveal, .reveal-l, .reveal-r').forEach((el) => el.classList.add('is-visible'));
  });
  await wait(300);
}

async function scrollToSignup(page) {
  const width = page.viewport()?.width ?? 1440;
  await page.evaluate((mobile) => {
    const el = document.querySelector('.close__signup');
    const header = document.querySelector('.site-header');
    const headerH = header ? header.getBoundingClientRect().height : 64;
    const pad = mobile ? headerH + 20 : headerH + 12;
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - pad;
      window.scrollTo(0, Math.max(0, y));
    }
  }, width <= 480);
  await wait(400);
}

async function shotSignup(page, width, name) {
  await page.setViewport({
    width,
    height: width <= 480 ? 812 : 900,
    isMobile: width <= 480,
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}/index.html?v=field-notes-subscribe-ember`, { waitUntil: 'load', timeout: 15000 });
  await wait(400);
  await scrollToSignup(page);
  await revealAll(page);
  const el = await page.$('.close__signup');
  if (el) await el.screenshot({ path: path.join(outDir, name) });
}

async function copyChecks(page) {
  return page.evaluate(() => {
    const h2 = document.querySelector('#fn-h2.field-notes__heading');
    const h2Style = h2 ? getComputedStyle(h2) : null;
    const quote = document.querySelector('.origin__inscription');
    const quoteStyle = quote ? getComputedStyle(quote) : null;
    const signup = document.querySelector('.close__signup');
    const text = signup?.innerText ?? '';
    const whiteColors = new Set([
      'rgb(252, 248, 236)',
      'rgb(237, 232, 220)',
      'rgb(255, 255, 255)',
    ]);
    const color = h2Style?.color ?? '';
    const emberSoft = 'rgb(240, 143, 88)';
    return {
      hasHeadingClass: !!h2,
      hasEyebrow: text.includes('FOLLOW NEW RECORDS AND PRODUCT RELEASES'),
      hasNewBody: text.includes('Get updates, new cases, and findings from Imbas.'),
      hasOldBody: text.includes('Follow new records, measurement updates'),
      headingColor: color,
      headingIsEmberSoft: color === emberSoft,
      headingToken: 'var(--ember-soft)',
      headingNotWhite: !whiteColors.has(color),
      headingDiffersFromQuote: h2Style && quoteStyle ? h2Style.color !== quoteStyle.color : false,
      bodyLineCount: (text.match(/Get updates, new cases/g) || []).length,
    };
  });
}

async function mobileButtonChecks(page) {
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto(`${base}/index.html?v=field-notes-subscribe-ember`, { waitUntil: 'load' });
  await revealAll(page);
  await scrollToSignup(page);
  return page.evaluate(() => {
    const btn = document.querySelector('#field-notes-form button[type="submit"]');
    const style = btn ? getComputedStyle(btn) : null;
    return {
      minHeight: style?.minHeight,
      bg: style?.backgroundColor,
    };
  });
}

async function layoutChecks(page, width) {
  return page.evaluate((w) => {
    const form = document.getElementById('field-notes-form');
    const input = form?.querySelector('input[type="email"]');
    const btn = form?.querySelector('button[type="submit"]');
    const read = document.querySelector('.field-notes__recent');
    const btnStyle = btn ? getComputedStyle(btn) : null;
    const formStyle = form ? getComputedStyle(form) : null;
    const inputRect = input?.getBoundingClientRect();
    const btnRect = btn?.getBoundingClientRect();
    const readRect = read?.getBoundingClientRect();
    const mobile = w <= 480;
    const stacked = mobile
      ? btnRect && inputRect && btnRect.top >= inputRect.bottom - 2
      : btnRect && inputRect && Math.abs(btnRect.top - inputRect.top) < 8;
    return {
      width: w,
      formDirection: formStyle?.flexDirection,
      btnBg: btnStyle?.backgroundColor,
      btnMinHeight: btnStyle?.minHeight,
      stacked,
      readBelowForm: readRect && btnRect ? readRect.top >= btnRect.bottom - 2 : false,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  }, width);
}

async function submitSuccess(page, width) {
  await page.setViewport({
    width,
    height: width <= 480 ? 812 : 900,
    isMobile: width <= 480,
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}/index.html?v=field-notes-subscribe-ember`, { waitUntil: 'load', timeout: 15000 });
  await wait(400);
  await revealAll(page);
  await scrollToSignup(page);
  await page.evaluate(async () => {
    const form = document.getElementById('field-notes-form');
    const input = form?.querySelector('input[type="email"]');
    const btn = form?.querySelector('button[type="submit"]');
    if (input && btn) {
      input.value = 'reader@example.com';
      btn.click();
      await new Promise((r) => setTimeout(r, 900));
    }
  });
  await scrollToSignup(page);
  await wait(200);
  const el = await page.$('.close__signup');
  if (el) return el.screenshot({ path: path.join(outDir, width <= 480
    ? 'homepage-field-notes-subscribe-success-mobile-375.png'
    : 'homepage-field-notes-subscribe-success-desktop-1440.png') });
}

const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (req.url().includes('/briefing/members/api/send-magic-link') && req.method() === 'POST') {
    req.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ members: [] }) });
  } else {
    req.continue();
  }
});

await shotSignup(page, 1440, 'homepage-field-notes-subscribe-desktop-1440.png');
const desktopLayout = await layoutChecks(page, 1440);

await shotSignup(page, 375, 'homepage-field-notes-subscribe-mobile-375.png');
const mobileLayout = await layoutChecks(page, 375);

await submitSuccess(page, 1440);
await submitSuccess(page, 375);

const functionalPage = await browser.newPage();
await functionalPage.setRequestInterception(true);
functionalPage.on('request', (req) => {
  if (req.url().includes('/briefing/members/api/send-magic-link') && req.method() === 'POST') {
    req.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ members: [] }) });
  } else {
    req.continue();
  }
});
await functionalPage.goto(`${base}/index.html?v=field-notes-subscribe-ember`, { waitUntil: 'load' });
await wait(400);
await revealAll(functionalPage);
await functionalPage.evaluate(async () => {
  const btn = document.querySelector('#field-notes-form button[type="submit"]');
  const input = document.querySelector('#field-notes-form input[type="email"]');
  if (input && btn) {
    input.value = 'reader@example.com';
    btn.click();
    await new Promise((r) => setTimeout(r, 900));
  }
});
const functional = await functionalPage.evaluate(() => {
  const body = document.body.innerText.toLowerCase();
  const msg = document.getElementById('field-notes-msg');
  return {
    subscribed: body.includes("you're subscribed to field notes"),
    noWired: !body.includes('being wired'),
    noComingSoon: !body.includes('coming soon'),
    noContactFallback: !body.includes('for correspondence, contact'),
    msgVisible: msg?.classList.contains('is-visible'),
  };
});

const copy = await copyChecks(page);
const mobileButton = await mobileButtonChecks(page);

const report = { desktopLayout, mobileLayout, copy, mobileButton, functional };
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
