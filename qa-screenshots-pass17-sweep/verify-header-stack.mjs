import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = 'http://127.0.0.1:8000';

async function check(page, slug, outName) {
  await page.goto(`${base}/${slug}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.setViewport({ width: 375, height: 812 });
  await new Promise((r) => setTimeout(r, 400));
  await page.click('.nav__menu-btn');
  await new Promise((r) => setTimeout(r, 350));

  const stack = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const main = document.querySelector('main');
    const nav = document.querySelector('.nav.is-open');
    const hZ = header ? getComputedStyle(header).zIndex : null;
    const mZ = main ? getComputedStyle(main).zIndex : null;
    const hPos = header ? getComputedStyle(header).position : null;
    const navRect = nav ? nav.getBoundingClientRect() : null;
    const mainTop = main ? main.getBoundingClientRect().top : null;
    const link = nav ? nav.querySelector('a') : null;
    let linkHit = false;
    if (link) {
      const r = link.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      linkHit = link.contains(el) || el === link;
    }
    return { hZ, mZ, hPos, navOpen: !!nav, linkHit, navTop: navRect?.top, mainTop };
  });

  await page.screenshot({ path: path.join(__dirname, outName), fullPage: false });
  return stack;
}

(async () => {
  fs.mkdirSync(__dirname, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const hiw = await check(page, 'how-it-works.html', 'pass1-hiw-menu-open-375.png');
  console.log('how-it-works:', hiw);
  const home = await check(page, '', 'pass1-home-menu-open-375.png');
  console.log('home:', home);
  console.log('console errors:', errors.length ? errors : 'none');

  await browser.close();
})();
