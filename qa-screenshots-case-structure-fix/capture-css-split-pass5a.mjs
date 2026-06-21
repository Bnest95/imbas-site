import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'css-split-pass5a');
const base = 'http://127.0.0.1:8792';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(outDir, { recursive: true });

async function withBrowser(fn) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  try {
    return await fn(browser);
  } finally {
    await browser.close();
  }
}

async function shot(name, url, width, fullPage = false) {
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));
    await page.setViewport({ width, height: width === 375 ? 812 : 900, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(1500);
    const audit = await page.evaluate(() => {
      const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href') || '');
      return {
        url: location.pathname,
        stylesheets: sheets,
        hasWorkbenchCss: sheets.some((h) => h.includes('workbench.css')),
        hasStylesCss: sheets.some((h) => h.includes('styles.css')),
      };
    });
    await page.screenshot({ path: path.join(outDir, `${name}-${width}.png`), fullPage });
    return { ...audit, pageErrors: errors };
  });
}

async function workbenchMetrics() {
  return withBrowser(async (browser) => {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${base}/workbench.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(2000);
    const metrics = await page.evaluate(() => {
      const root = document.querySelector('#workbench-root');
      const shell = document.querySelector('.wb-shell');
      const stage = document.querySelector('.wb-stage');
      const caseCard = document.querySelector('.wb-case-card');
      if (!stage) return { ok: false, reason: 'missing .wb-stage' };
      const stageStyle = getComputedStyle(stage);
      const cardStyle = caseCard ? getComputedStyle(caseCard) : null;
      return {
        ok: true,
        hasShell: !!shell,
        caseCardCount: document.querySelectorAll('.wb-case-card').length,
        stageBackground: stageStyle.backgroundColor,
        caseCardBorder: cardStyle?.borderColor || null,
        rootChildren: root?.childElementCount || 0,
      };
    });
    return { ...metrics, pageErrors: errors };
  });
}

const report = {
  audits: [],
  sizes: {
    'styles.css': fs.statSync(path.join(__dirname, '..', 'styles.css')).size,
    'workbench.css': fs.statSync(path.join(__dirname, '..', 'workbench.css')).size,
  },
  before: {
    'styles.css': 281593,
    homepageCssLoaded: 281593,
    workbenchCssLoaded: 281593,
  },
};

report.audits.push(await shot('homepage', `${base}/index.html`, 1440));
report.audits.push(await shot('homepage', `${base}/index.html`, 375, true));
report.audits.push(await shot('workbench', `${base}/workbench.html`, 1440));
report.audits.push(await shot('workbench', `${base}/workbench.html`, 375, true));
report.audits.push(await shot('case-005', `${base}/case/005.html`, 1440));

report.workbenchMetrics = await workbenchMetrics();

report.after = {
  homepageCssLoaded: report.sizes['styles.css'],
  workbenchCssLoaded: report.sizes['styles.css'] + report.sizes['workbench.css'],
};

report.pass = {
  homepageNoWorkbenchCss: report.audits.filter((a) => a.url.includes('index')).every((a) => !a.hasWorkbenchCss),
  workbenchHasWorkbenchCss: report.audits.filter((a) => a.url.includes('workbench')).every((a) => a.hasWorkbenchCss),
  workbenchVisual: report.workbenchMetrics.ok,
  noPageErrors: report.audits.every((a) => !a.pageErrors?.length) && !report.workbenchMetrics.pageErrors?.length,
};

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
