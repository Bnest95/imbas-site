import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.AUDIT_BASE || 'https://www.imbaslabs.com';

const DEVICES = [
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', width: 393, height: 852 },
  { id: 'iphone-13', name: 'iPhone 13', width: 390, height: 844 },
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667 },
  { id: 'pixel-8', name: 'Pixel 8', width: 412, height: 915 },
  { id: 'galaxy-s24', name: 'Galaxy S24', width: 360, height: 780 },
];

const PAGES = [
  { slug: '', label: 'homepage', path: '/' },
  { slug: 'workbench.html', label: 'workbench', path: '/workbench.html' },
  { slug: 'case/005.html', label: 'case-005', path: '/case/005.html' },
  { slug: 'archive.html', label: 'archive', path: '/archive.html' },
];

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function isInteractive(el) {
  const tag = el.tagName;
  if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  if (el.getAttribute('role') === 'button') return true;
  if (el.tabIndex >= 0) return true;
  return false;
}

async function auditPage(page, device, pageInfo) {
  const url = `${BASE}${pageInfo.path}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await wait(800);

  const metrics = await page.evaluate(({ vw, vh }) => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientW = doc.clientWidth;
    const scrollH = Math.max(doc.scrollHeight, body.scrollHeight);
    const horizontalOverflow = scrollW > clientW + 1;

    const overflowEls = [];
    document.querySelectorAll('*').forEach((el) => {
      if (!el.getBoundingClientRect) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right > vw + 2 || r.left < -2) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        overflowEls.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === 'string') ? el.className.split(/\s+/).slice(0, 4).join('.') : '',
          id: el.id || '',
          right: Math.round(r.right),
          left: Math.round(r.left),
          w: Math.round(r.width),
        });
      }
    });

    const smallText = [];
    const textEls = document.querySelectorAll('p, li, span, a, button, label, td, th, h1, h2, h3, h4, small, .section-label, .hero__meta, .proof-strip, .site-footer__meta');
    textEls.forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      const fs = parseFloat(cs.fontSize);
      const text = (el.textContent || '').trim();
      if (!text || text.length < 2) return;
      if (fs < 12) {
        smallText.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === 'string') ? el.className.split(/\s+/).slice(0, 4).join('.') : '',
          fs: Math.round(fs * 10) / 10,
          sample: text.slice(0, 48),
        });
      }
    });

    const smallTargets = [];
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .nav__menu-btn');
    interactives.forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      const minDim = Math.min(r.width, r.height);
      if (minDim < 44) {
        smallTargets.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && typeof el.className === 'string') ? el.className.split(/\s+/).slice(0, 4).join('.') : '',
          id: el.id || '',
          w: Math.round(r.width),
          h: Math.round(r.height),
          min: Math.round(minDim),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        });
      }
    });

    const hero = document.querySelector('.hero');
    const heroInfo = hero ? {
      h: Math.round(hero.getBoundingClientRect().height),
      monolithFs: hero.querySelector('.hero__monolith-text') ? getComputedStyle(hero.querySelector('.hero__monolith-text')).fontSize : null,
      captureVisible: !!hero.querySelector('.hero__capture-block') && hero.querySelector('.hero__capture-block').getBoundingClientRect().bottom <= vh,
      secondaryVisible: !!hero.querySelector('.hero__secondary') && hero.querySelector('.hero__secondary').getBoundingClientRect().bottom <= vh,
    } : null;

    const footer = document.querySelector('.site-footer');
    const footerInfo = footer ? {
      top: Math.round(footer.getBoundingClientRect().top + window.scrollY),
      linkCount: footer.querySelectorAll('a').length,
      linksSmall: [...footer.querySelectorAll('a')].filter((a) => {
        const r = a.getBoundingClientRect();
        return Math.min(r.width, r.height) < 44;
      }).length,
      metaFs: footer.querySelector('.site-footer__meta span') ? getComputedStyle(footer.querySelector('.site-footer__meta span')).fontSize : null,
    } : null;

    const archiveSection = document.querySelector('.archive, .page--archive');
    const archiveInfo = archiveSection ? {
      scrollW: Math.round(archiveSection.scrollWidth),
      clientW: Math.round(archiveSection.clientWidth),
      overflowX: archiveSection.scrollWidth > archiveSection.clientWidth + 1,
      table: !!document.querySelector('.archive__ledger, table, .hp-arc-ledger'),
    } : null;

    const workbench = document.querySelector('#root, .wb-shell, .workbench');
    const wbInfo = workbench ? {
      hasRoot: !!document.querySelector('#root'),
      stageH: document.querySelector('.wb-stage') ? Math.round(document.querySelector('.wb-stage').getBoundingClientRect().height) : null,
    } : null;

    return {
      horizontalOverflow,
      scrollW,
      clientW,
      scrollH,
      viewportScreens: Math.round((scrollH / vh) * 10) / 10,
      overflowEls: overflowEls.slice(0, 12),
      smallText: [...new Map(smallText.map((x) => [x.cls + x.sample, x])).values()].slice(0, 15),
      smallTargets: [...new Map(smallTargets.map((x) => [x.cls + x.text + x.id, x])).values()].slice(0, 20),
      heroInfo,
      footerInfo,
      archiveInfo,
      wbInfo,
      title: document.title,
    };
  }, { vw: device.width, vh: device.height });

  const shotName = `${device.id}-${pageInfo.label}.png`;
  await page.screenshot({ path: path.join(__dirname, shotName), fullPage: true });

  // Hero + footer viewport shots
  if (pageInfo.label === 'homepage') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(200);
    await page.screenshot({ path: path.join(__dirname, `${device.id}-homepage-hero.png`) });
    await page.evaluate(() => {
      const f = document.querySelector('.site-footer');
      if (f) f.scrollIntoView({ block: 'start' });
    });
    await wait(300);
    await page.screenshot({ path: path.join(__dirname, `${device.id}-homepage-footer.png`) });
  }

  return { device: device.id, page: pageInfo.label, url, ...metrics };
}

(async () => {
  fs.mkdirSync(__dirname, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  const errors = [];

  for (const device of DEVICES) {
    const page = await browser.newPage();
    page.on('pageerror', (e) => errors.push({ device: device.id, err: String(e) }));
    await page.setViewport({ width: device.width, height: device.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    for (const pageInfo of PAGES) {
      try {
        const r = await auditPage(page, device, pageInfo);
        results.push(r);
        console.log(JSON.stringify({
          d: device.id,
          p: pageInfo.label,
          ox: r.horizontalOverflow,
          screens: r.viewportScreens,
          smallT: r.smallTargets.length,
          smallTxt: r.smallText.length,
        }));
      } catch (e) {
        errors.push({ device: device.id, page: pageInfo.label, err: String(e) });
        console.error('FAIL', device.id, pageInfo.label, e.message);
      }
    }
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'audit-results.json'), JSON.stringify({ base: BASE, results, errors }, null, 2));
  console.log('Wrote audit-results.json, screenshots in', __dirname);
})();
