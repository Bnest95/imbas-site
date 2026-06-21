import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'methodology-pass2-p1');
const base = 'http://127.0.0.1:8792';

fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  protocolTimeout: 180000,
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureHero(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/methodology.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.meth-masthead__title', { timeout: 10000 });
  await wait(400);
  const el = await page.$('.meth-masthead');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const h1 = document.querySelector('.meth-masthead__title');
    const style = h1 ? getComputedStyle(h1) : null;
    const whiteColors = new Set(['rgb(252, 248, 236)', 'rgb(237, 232, 220)', 'rgb(255, 255, 255)']);
    const emberSoft = 'rgb(240, 143, 88)';
    return {
      headingColor: style?.color,
      headingIsEmberSoft: style?.color === emberSoft,
      headingToken: 'var(--ember-soft)',
      headingNotWhite: !whiteColors.has(style?.color ?? ''),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

async function captureGapSection(name, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, isMobile: width <= 480, deviceScaleFactor: 1 });
  await page.goto(`${base}/methodology.html`, { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('.meth-gap', { timeout: 10000 });
  await page.evaluate(() => {
    document.querySelector('.meth-gap')?.scrollIntoView({ block: 'center' });
  });
  await wait(500);
  const el = await page.$('.meth-gap');
  await el.screenshot({ path: path.join(outDir, name) });

  const report = await page.evaluate(() => {
    const section = document.querySelector('.meth-gap');
    const steps = [...section.querySelectorAll('.meth-method-steps li')].map((li) => li.textContent.trim());
    const text = section.textContent;
    return {
      stepCount: steps.length,
      steps,
      hasDefinitionParagraph: /difference between what a model surfaces on an open-ended prompt/i.test(text),
      hasProcedure: steps[0]?.includes('Capture an open-ended answer'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  await page.close();
  return report;
}

const desktopHero = await captureHero('methodology-hero-desktop-1440.png', 1440);
const mobileHero = await captureHero('methodology-hero-mobile-375.png', 375);
const desktopGap = await captureGapSection('methodology-gap-method-desktop-1440.png', 1440);
const mobileGap = await captureGapSection('methodology-gap-method-mobile-375.png', 375);

const report = {
  heading: { desktop: desktopHero, mobile: mobileHero },
  gapMethod: { desktop: desktopGap, mobile: mobileGap },
};

fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
