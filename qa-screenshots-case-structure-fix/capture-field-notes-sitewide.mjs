import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'field-notes-subscribe');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const EMBER_SOFT = 'rgb(240, 143, 88)';
const BAD_COPY = [
  'Follow new records, measurement updates, and notes from the archive.',
  'Records show the result. Field Notes shows the investigation.',
  'FOLLOW NEW RECORDS AND PRODUCT RELEASES.',
  'Email signup is being wired.',
  'for correspondence, contact',
];
const GOOD_BODY = 'Get updates, new cases, and findings from Imbas.';

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

async function auditPage(page, url, label) {
  await page.goto(`${base}${url}`, { waitUntil: 'load', timeout: 15000 });
  await wait(400);
  await revealAll(page);
  return page.evaluate(({ badCopy, goodBody, emberSoft, label, url }) => {
    const text = document.body.innerText;
    const heading = document.querySelector('.field-notes__heading');
    const style = heading ? getComputedStyle(heading) : null;
    const form = document.querySelector('form.subscribe--field-notes');
    const btn = form?.querySelector('button[type="submit"]');
    const btnStyle = btn ? getComputedStyle(btn) : null;
    return {
      label,
      url,
      hasSubscribeForm: !!form,
      hasGoodBody: text.includes(goodBody),
      badCopyFound: badCopy.filter((s) => text.includes(s)),
      headingColor: style?.color ?? null,
      headingIsEmberSoft: style?.color === emberSoft,
      headingNotWhite: style ? !['rgb(252, 248, 236)', 'rgb(237, 232, 220)', 'rgb(255, 255, 255)'].includes(style.color) : null,
      buttonBg: btnStyle?.backgroundColor ?? null,
      buttonMinHeight: btnStyle?.minHeight ?? null,
    };
  }, { badCopy: BAD_COPY, goodBody: GOOD_BODY, emberSoft: EMBER_SOFT, label, url });
}

async function shotSection(page, url, selector, width, name, scrollSel) {
  await page.setViewport({
    width,
    height: width <= 480 ? 812 : 900,
    isMobile: width <= 480,
    deviceScaleFactor: 1,
  });
  await page.goto(`${base}${url}`, { waitUntil: 'load', timeout: 15000 });
  await wait(400);
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
  await revealAll(page);
  const el = await page.$(selector);
  if (el) await el.screenshot({ path: path.join(outDir, name) });
}

const page = await browser.newPage();

const pagesToAudit = [
  { url: '/index.html?v=field-notes-subscribe-ember', label: 'homepage' },
  { url: '/field-notes/?v=field-notes-subscribe-ember', label: 'field-notes-index' },
  { url: '/for-readers.html?v=field-notes-subscribe-ember', label: 'for-readers' },
  { url: '/contact.html', label: 'contact' },
  { url: '/archive.html', label: 'archive' },
  { url: '/institutions.html', label: 'institutions' },
  { url: '/public-interest.html', label: 'public-interest' },
  { url: '/volunteer-gap.html', label: 'volunteer-gap' },
  { url: '/how-it-works.html', label: 'how-it-works' },
  { url: '/methodology.html', label: 'methodology' },
  { url: '/faq.html', label: 'faq' },
  { url: '/privacy.html', label: 'privacy' },
  { url: '/terms.html', label: 'terms' },
  { url: '/accessibility.html', label: 'accessibility' },
];

const audits = [];
for (const p of pagesToAudit) {
  audits.push(await auditPage(page, p.url, p.label));
}

await shotSection(page, '/index.html?v=field-notes-subscribe-ember', '.close__signup', 1440, 'homepage-field-notes-subscribe-desktop-1440.png', '#fn-h2');
await shotSection(page, '/index.html?v=field-notes-subscribe-ember', '.close__signup', 375, 'homepage-field-notes-subscribe-mobile-375.png', '#fn-h2');
await shotSection(page, '/field-notes/?v=field-notes-subscribe-ember', '.fn-subscribe.field-notes-signup', 1440, 'field-notes-index-subscribe-desktop-1440.png', '#fn-subscribe-heading');
await shotSection(page, '/field-notes/?v=field-notes-subscribe-ember', '.fn-subscribe.field-notes-signup', 375, 'field-notes-index-subscribe-mobile-375.png', '#fn-subscribe-heading');
await shotSection(page, '/for-readers.html?v=field-notes-subscribe-ember', '.rd-field-notes.field-notes-signup', 1440, 'for-readers-field-notes-subscribe-desktop-1440.png', '.rd-field-notes.field-notes-signup');
await shotSection(page, '/for-readers.html?v=field-notes-subscribe-ember', '.rd-field-notes.field-notes-signup', 375, 'for-readers-field-notes-subscribe-mobile-375.png', '.rd-field-notes.field-notes-signup');

await page.setRequestInterception(true);
page.on('request', (req) => {
  if (req.url().includes('/briefing/members/api/send-magic-link') && req.method() === 'POST') {
    req.respond({ status: 201, contentType: 'application/json', body: JSON.stringify({ members: [] }) });
  } else {
    req.continue();
  }
});
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/index.html?v=field-notes-subscribe-ember`, { waitUntil: 'load' });
await revealAll(page);
await page.evaluate(async () => {
  const input = document.querySelector('#field-notes-form input[type="email"]');
  const btn = document.querySelector('#field-notes-form button[type="submit"]');
  if (input && btn) {
    input.value = 'reader@example.com';
    btn.click();
    await new Promise((r) => setTimeout(r, 900));
  }
});
const successEl = await page.$('.close__signup');
if (successEl) {
  await successEl.screenshot({ path: path.join(outDir, 'homepage-field-notes-subscribe-success-desktop-1440.png') });
}

const report = {
  auditedAt: new Date().toISOString(),
  emberSoftExpected: EMBER_SOFT,
  pagesChecked: audits.length,
  pagesWithSubscribe: audits.filter((a) => a.hasSubscribeForm).map((a) => a.label),
  pagesChanged: ['field-notes-index'],
  audits,
  subscribePagesPass: audits
    .filter((a) => a.hasSubscribeForm)
    .every((a) => a.hasGoodBody && a.badCopyFound.length === 0 && a.headingIsEmberSoft),
};
fs.writeFileSync(path.join(outDir, 'sitewide-verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
