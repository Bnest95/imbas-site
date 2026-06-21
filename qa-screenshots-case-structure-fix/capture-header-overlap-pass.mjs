import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'header-overlap-pass');
const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'mobile-375', width: 375, height: 812, isMobile: true },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true },
];

const pages = [
  { slug: 'index.html', label: 'home', hero: '.hero__meta, .hero__meta--instrument, #hero-h1' },
  { slug: 'workbench.html', label: 'workbench', hero: '.wb-shell h1, .wb-shell .wb-scroll-anchor' },
  { slug: 'archive.html', label: 'archive', hero: '.arc-masthead .section-label, .arc-masthead h1' },
  { slug: 'case/005.html', label: 'case-005', hero: '.case-masthead .section-label, .case-masthead h1' },
  { slug: 'contact.html', label: 'contact', hero: '.ct-masthead .section-label, .ct-masthead h1' },
  { slug: 'public-interest.html', label: 'public-interest', hero: '.pi-masthead .section-label, .pi-masthead h1' },
  { slug: 'methodology.html', label: 'methodology', hero: '.meth-masthead .section-label, .meth-masthead h1' },
  { slug: 'volunteer-gap.html', label: 'volunteer-gap', hero: '.vg-masthead .section-label, .vg-hero h1, .vg-masthead h1' },
  { slug: 'for-readers.html', label: 'for-readers', hero: '.rd-masthead .section-label, .rd-masthead h1' },
  { slug: 'institutions.html', label: 'institutions', hero: '.inst-masthead .section-label, .inst-masthead h1' },
  { slug: 'how-it-works.html', label: 'how-it-works', hero: '.hiw-masthead .section-label, .hiw-masthead h1, main h1' },
  { slug: 'faq.html', label: 'faq', hero: '.faq-masthead .section-label, .faq-masthead h1, main h1' },
  { slug: 'field-notes/index.html', label: 'field-notes', hero: '.fn-masthead h1, .fn-masthead .section-label' },
];

fs.mkdirSync(path.join(outDir, 'after', 'anchors'), { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const report = { pages: {}, anchorTests: {}, summary: { pass: [], fail: [] } };

function checkOverlap(headerBottom, elTop, buffer = 2) {
  return elTop >= headerBottom - buffer;
}

for (const vp of viewports) {
  for (const pageDef of pages) {
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: !!vp.isMobile,
      deviceScaleFactor: 1,
    });

    const url = `${base}/${pageDef.slug}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (pageDef.slug === 'workbench.html') {
      await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
    }
    await wait(500);

    const metrics = await page.evaluate((heroSel) => {
      const header = document.querySelector('.site-header');
      const hr = header?.getBoundingClientRect();
      const headerOffset = getComputedStyle(document.documentElement).getPropertyValue('--header-offset').trim();
      const heroTopGap = getComputedStyle(document.documentElement).getPropertyValue('--hero-top-gap').trim();
      const selectors = heroSel.split(',').map((s) => s.trim());
      let heroEl = null;
      for (const sel of selectors) {
        heroEl = document.querySelector(sel);
        if (heroEl) break;
      }
      const er = heroEl?.getBoundingClientRect();
      return {
        headerBottom: hr?.bottom ?? null,
        headerHeight: hr?.height ?? null,
        headerOffset,
        heroTopGap,
        heroTop: er?.top ?? null,
        heroText: heroEl?.textContent?.trim().slice(0, 80) ?? null,
        heroSelector: heroEl ? selectors.find((s) => document.querySelector(s) === heroEl) : null,
        scrollPaddingTop: getComputedStyle(document.documentElement).scrollPaddingTop,
      };
    }, pageDef.hero);

    const key = `${pageDef.label}/${vp.name}`;
    const overlap = metrics.headerBottom != null && metrics.heroTop != null
      ? checkOverlap(metrics.headerBottom, metrics.heroTop)
      : false;

    report.pages[key] = { ...metrics, overlap, url };

    const shotDir = path.join(outDir, 'after', pageDef.label);
    fs.mkdirSync(shotDir, { recursive: true });
    await page.screenshot({
      path: path.join(shotDir, `${pageDef.label}-${vp.name}.png`),
      fullPage: false,
    });

    if (overlap) report.summary.pass.push(key);
    else report.summary.fail.push(key);

    await page.close();
  }
}

// Anchor scroll tests
for (const anchorCase of [
  { slug: 'index.html#archive', label: 'home-archive-anchor', target: '#archive' },
  { slug: 'methodology.html#omission', label: 'methodology-omission-anchor', target: '#omission' },
  { slug: 'workbench.html#main-content', label: 'workbench-skip-main', target: '#main-content' },
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const url = `${base}/${anchorCase.slug}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await wait(600);

  const anchorMetrics = await page.evaluate((target) => {
    const header = document.querySelector('.site-header');
    const hr = header?.getBoundingClientRect();
    const el = document.querySelector(target);
    const er = el?.getBoundingClientRect();
    return {
      headerBottom: hr?.bottom,
      targetTop: er?.top,
      targetText: el?.textContent?.trim().slice(0, 60),
      clear: er && hr ? er.top >= hr.bottom - 2 : false,
    };
  }, anchorCase.target);

  report.anchorTests[anchorCase.label] = anchorMetrics;
  if (anchorMetrics.clear) report.summary.pass.push(`anchor:${anchorCase.label}`);
  else report.summary.fail.push(`anchor:${anchorCase.label}`);

  await page.screenshot({
    path: path.join(outDir, 'after', 'anchors', `${anchorCase.label}-1440.png`),
    fullPage: false,
  });
  await page.close();
}

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  pass: report.summary.pass.length,
  fail: report.summary.fail.length,
  failures: report.summary.fail,
  headerOffsetSample: report.pages['home/desktop-1440']?.headerOffset,
}, null, 2));

await browser.close();
