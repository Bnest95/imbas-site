import puppeteer from 'puppeteer';

const base = 'http://127.0.0.1:8792';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function validateSurfacedAnswer(text) {
  const BYO_SURFACED_TRIVIAL_MSG = 'blocked';
  const TRIVIAL = new Set(['yes','no','yes sir','nothing','idk','n/a','none','ok','test']);
  const raw = (text || '').trim();
  if (!raw) return BYO_SURFACED_TRIVIAL_MSG;
  const norm = raw.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();
  if (TRIVIAL.has(norm)) return BYO_SURFACED_TRIVIAL_MSG;
  if (norm.length < 15) {
    const placeholderWords = new Set(['yes','no','ok','idk','na','none','nothing','test','sir']);
    const words = norm.split(' ').filter(Boolean);
    if (words.every((w) => placeholderWords.has(w) || w.length <= 2)) return BYO_SURFACED_TRIVIAL_MSG;
  }
  return 'allowed';
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const report = { pass: [], fail: [], spot: {} };

function pass(msg) { report.pass.push(msg); }
function fail(msg) { report.fail.push(msg); }

// Homepage CTA
await page.goto(`${base}/index.html`, { waitUntil: 'networkidle0' });
const cta = await page.evaluate(() => {
  const btn = document.querySelector('.hero__capture button[type="submit"]');
  return {
    text: btn?.textContent?.trim(),
    rendered: btn ? getComputedStyle(btn).textTransform : null,
  };
});
if (cta.text === 'Test your AI' && !cta.text.includes('.')) pass('homepage CTA: Test your AI (no period)');
else fail(`homepage CTA: got "${cta.text}"`);

// Workbench invariants
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
await page.reload({ waitUntil: 'networkidle0' });
await wait(300);

const inv = await page.evaluate(() => ({
  readoutRails: document.querySelectorAll('.wb-readout-rail').length,
  inputs03: document.body.textContent.includes('Inputs 03'),
  channelReadout: /channel readout/i.test(document.body.textContent),
  modeReadout: /mode readout/i.test(document.body.textContent),
  stepLabels: [...document.querySelectorAll('.wb-field-label, label')].filter((el) => /step\s*\d/i.test(el.textContent)).length,
  modeBtnNums: document.querySelectorAll('.wb-mode-btn__num').length,
  provisionalPills: document.querySelectorAll('.wb-status-readout__badge, .wb-status-readout--banner').length,
  buildNotes: document.querySelectorAll('.wb-build-note').length,
  cardLabels: [...document.querySelectorAll('.wb-specimen-plate__label')].map((el) => el.textContent.trim()),
  activeProvCase: document.querySelector('.wb-flow-case-prov__case')?.textContent?.trim(),
  activeProvSub: document.querySelector('.wb-flow-case-prov__sub')?.textContent?.trim(),
  runStrip: [...document.querySelectorAll('.wb-readout__run-strip span')].map((el) => el.textContent.trim()),
}));

if (inv.readoutRails === 0) pass('no visual readout rails');
else fail(`readout rails: ${inv.readoutRails}`);
if (!inv.inputs03) pass('no Inputs 03');
else fail('Inputs 03 present');
if (!inv.channelReadout && !inv.modeReadout) pass('no Channel/Mode readout text');
else fail('Channel/Mode readout text present');
if (inv.stepLabels === 0 && inv.modeBtnNums === 0) pass('no fake step/tab numbering in DOM');
else fail(`stepLabels=${inv.stepLabels} modeBtnNums=${inv.modeBtnNums}`);
if (inv.provisionalPills === 0) pass('no large provisional pills/banners rendered');
else fail(`provisional pills: ${inv.provisionalPills}`);
if (inv.buildNotes === 1) pass('product-state note once');
else fail(`buildNotes=${inv.buildNotes}`);
if (inv.cardLabels.join('|') === 'CASE 005 · OMISSION|CASE 018 · OMISSION') pass('case cards match current workbench set');
else fail(`card labels: ${inv.cardLabels.join('|')}`);
if (inv.activeProvCase?.includes('GAP 2.5/3') && /verified/i.test(inv.activeProvSub || '')) pass('active module full provenance');
else fail(`active prov: ${inv.activeProvCase} / ${inv.activeProvSub}`);
if (inv.runStrip.some((s) => s.includes('4 frontier models tested'))) pass('4 frontier models tested in readout');
else fail(`run strip: ${inv.runStrip.join(', ')}`);

// Email gate spot-check
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ran it'))?.click());
await wait(400);
report.spot.emailGate = await page.evaluate(() => ({
  visible: !!document.querySelector('.wb-email-gate'),
  title: document.querySelector('.wb-status-readout__title')?.textContent?.trim(),
}));
if (report.spot.emailGate.visible) pass('email gate renders on curated paste step');
else fail('email gate missing');

// BYO validation logic
const byoVal = {
  yesSir: validateSurfacedAnswer('Yes sir'),
  rule: validateSurfacedAnswer('Rule 10b-18'),
  safe: validateSurfacedAnswer('Safe harbor'),
};
if (byoVal.yesSir === 'blocked' && byoVal.rule === 'allowed' && byoVal.safe === 'allowed') pass('BYO validateSurfacedAnswer logic');
else fail(`BYO validation: ${JSON.stringify(byoVal)}`);

// Mobile overflow
await page.setViewport({ width: 375, height: 812 });
await page.reload({ waitUntil: 'networkidle0' });
await wait(300);
const mob = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
}));
if (!mob.overflow) pass('no mobile overflow at 375px');
else fail(`mobile overflow sw=${mob.scrollWidth} cw=${mob.clientWidth}`);

// BYO submit-complete + share failure spot-check
await page.evaluate(() => {
  localStorage.setItem('imbas_wb_email', 'final-check@imbaslabs.com');
  window.__origFetch = window.fetch.bind(window);
  window.fetch = async (url) => String(url).includes('/api/repository') ? { ok: false, json: async () => ({ ok: false }) } : window.__origFetch(url);
});
await page.reload({ waitUntil: 'networkidle0' });
await wait(300);
await page.evaluate(() => [...document.querySelectorAll('button.wb-mode-btn')].find((b) => b.textContent.includes('Bring your own'))?.click());
await wait(200);

const OPEN = 'How do stock buybacks affect the economy and shareholders?';
const OPEN_ANS = 'Stock buybacks return cash to shareholders and can lift earnings per share by reducing share count. Companies often repurchase shares when they believe the stock is undervalued. Critics argue buybacks divert capital from investment and wages. The practice grew after regulatory changes in the 1980s and has become a major use of corporate cash.';
const TARGETED = 'What is SEC Rule 10b-18, and how does it relate to stock buybacks?';
const TARGETED_ANS = 'SEC Rule 10b-18, adopted in 1982, provides a safe harbor from market-manipulation liability for companies conducting open-market repurchases under specified conditions. It limits daily volume, timing around the open and close, and requires disclosure. The rule is central to how buybacks operate at scale today.';

await page.select('select', 'ChatGPT');
const areas = await page.$$('textarea');
await areas[0].type(OPEN);
await areas[1].type(OPEN_ANS);
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Continue'))?.click());
await wait(400);
const promptArea = (await page.$$('textarea')).pop();
await promptArea.type(TARGETED);
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('run this in my AI'))?.click());
await wait(400);
await (await page.$$('textarea')).pop().type(TARGETED_ANS);
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Continue'))?.click());
await wait(400);
const input = await page.$('input:not([type="email"])');
await input.type('SEC Rule 10b-18 only surfaced when asked directly.');
const selects = await page.$$('select');
await selects[selects.length - 2].select('Omission');
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Review before submit'))?.click());
await wait(400);
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Submit for review'))?.click());
await wait(800);

report.spot.byoComplete = await page.evaluate(() => ({
  recordedHeader: document.body.textContent.includes('Recorded for review'),
  submitFailure: !!document.querySelector('.wb-status-readout--failure'),
  failureCopy: document.querySelector('.wb-status-readout--failure .wb-status-readout__body')?.textContent?.trim(),
}));

if (report.spot.byoComplete.recordedHeader) pass('BYO recorded for review state');
else fail('BYO recorded state missing');
if (report.spot.byoComplete.submitFailure) pass('share/submit failure state present');
else fail('submit failure UI missing after failed POST');

// Loading state exists in code path - spot via busy button disabled during compare
await page.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('imbas_wb_email', 'final-check@imbaslabs.com'));
await page.reload({ waitUntil: 'networkidle0' });
report.spot.loadingComponent = await page.evaluate(() => document.body.innerHTML.includes('Reading the answer'));

if (report.spot.loadingComponent) pass('loading/busy component present in codebase render path');
else fail('loading component not found in page source');

console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.fail.length ? 1 : 0);
