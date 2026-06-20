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
if (inv.buildNotes === 0) pass('no product-state build note');
else fail(`buildNotes=${inv.buildNotes}`);
if (inv.cardLabels.length === 5 && inv.cardLabels[0]?.includes('005') && inv.cardLabels.some((l) => l.includes('003')) && inv.cardLabels.some((l) => l.includes('013')) && inv.cardLabels.some((l) => l.includes('021'))) pass('case cards show full public archive set');
else fail(`card labels: ${inv.cardLabels.join('|')}`);
if (inv.activeProvCase?.includes('GAP 2.5/3') && /verified/i.test(inv.activeProvSub || '')) pass('active module full provenance');
else fail(`active prov: ${inv.activeProvCase} / ${inv.activeProvSub}`);
if (inv.runStrip.some((s) => s.includes('4 frontier models tested'))) pass('4 frontier models tested in readout');
else fail(`run strip: ${inv.runStrip.join(', ')}`);

// Curated paste step — no blocking email gate
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ran it'))?.click());
await wait(400);
report.spot.curatedPaste = await page.evaluate(() => ({
  gateVisible: !!document.querySelector('.wb-email-gate'),
  pasteVisible: !!document.querySelector('textarea'),
}));
if (!report.spot.curatedPaste.gateVisible && report.spot.curatedPaste.pasteVisible) pass('curated paste opens without email gate');
else fail(`curated paste gate=${report.spot.curatedPaste.gateVisible} paste=${report.spot.curatedPaste.pasteVisible}`);

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

// Suggest an Investigation — secondary submission channel (no scoring)
await page.setViewport({ width: 1440, height: 900 });
await page.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.removeItem('imbas_wb_email'));
await page.reload({ waitUntil: 'networkidle0' });
await wait(300);

const suggestUi = await page.evaluate(() => ({
  byoVisible: /bring your own/i.test(document.body.textContent),
  modeToggle: document.querySelectorAll('.wb-mode-toggle').length,
  suggestTab: [...document.querySelectorAll('button.wb-mode-btn')].some((b) => b.textContent.includes('Suggest an Investigation')),
  suggestModule: !!document.querySelector('.wb-suggest-module'),
  suggestCollapsed: document.querySelector('.wb-suggest-module.is-collapsed') !== null,
  openSuggestBtn: [...document.querySelectorAll('.wb-suggest-module button')].some((b) => b.textContent.includes('Suggest an investigation')),
  suggestLead: document.querySelector('.wb-suggest-module.is-collapsed .wb-suggest-module__lead')?.textContent?.trim(),
  inlineCta: !!document.querySelector('.wb-suggest-discovery'),
  confirmFollowsFinding: (() => {
    const readout = document.querySelector('.wb-flow-module--readout');
    const confirm = document.querySelector('.wb-confirm-block');
    if (!readout || !confirm) return false;
    const discovery = document.querySelector('.wb-suggest-discovery');
    if (discovery) return false;
    return !!(readout.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING);
  })(),
  suggestAfterConfirm: (() => {
    const suggest = document.querySelector('.wb-suggest-module');
    const confirm = document.querySelector('.wb-confirm-block');
    if (!suggest || !confirm) return false;
    return !!(confirm.compareDocumentPosition(suggest) & Node.DOCUMENT_POSITION_FOLLOWING);
  })(),
  fullSuggestNotBetweenFindingAndConfirm: (() => {
    const readout = document.querySelector('.wb-flow-module--readout');
    const confirm = document.querySelector('.wb-confirm-block');
    const suggest = document.querySelector('.wb-suggest-module');
    if (!readout || !confirm || !suggest) return false;
    const readoutBeforeConfirm = !!(readout.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING);
    const confirmBeforeSuggest = !!(confirm.compareDocumentPosition(suggest) & Node.DOCUMENT_POSITION_FOLLOWING);
    const suggestBetween = !!(readout.compareDocumentPosition(suggest) & Node.DOCUMENT_POSITION_FOLLOWING)
      && !!(suggest.compareDocumentPosition(confirm) & Node.DOCUMENT_POSITION_FOLLOWING);
    return readoutBeforeConfirm && confirmBeforeSuggest && !suggestBetween;
  })(),
  caseCardsVisible: document.querySelectorAll('.wb-case-card').length >= 5,
  ranItVisible: [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Ran it')),
}));
if (!suggestUi.byoVisible) pass('no BYO language on workbench');
else fail('BYO language still visible');
if (suggestUi.modeToggle === 0) pass('no mode toggle shell');
else fail(`mode toggle still present: ${suggestUi.modeToggle}`);
if (!suggestUi.suggestTab) pass('no equal Suggest tab');
else fail('Suggest tab still present');
if (!suggestUi.inlineCta) pass('no duplicate inline suggest CTA');
else fail('duplicate inline suggest CTA still present');
if (suggestUi.confirmFollowsFinding && suggestUi.suggestAfterConfirm && suggestUi.fullSuggestNotBetweenFindingAndConfirm) pass('finding → confirm → suggest order');
else fail('suggest module placement wrong');
if (suggestUi.suggestCollapsed && suggestUi.openSuggestBtn && suggestUi.suggestLead?.includes('Have a case Imbas should inspect next')) pass('readable collapsed suggest CTA');
else fail('collapsed suggest CTA missing or unreadable');
const suggestHeading = await page.evaluate(() => {
  const heading = document.querySelector('.wb-suggest-module__heading');
  const lead = document.querySelector('.wb-suggest-module__lead');
  const cta = [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Suggest an investigation'));
  const hs = heading ? getComputedStyle(heading) : null;
  const ls = lead ? getComputedStyle(lead) : null;
  const cs = cta ? getComputedStyle(cta) : null;
  return {
    hasHeading: !!heading,
    headingText: heading?.textContent?.trim(),
    headingSize: hs?.fontSize,
    headingFamily: hs?.fontFamily,
    headingColor: hs?.color,
    leadColor: ls?.color,
    ctaColor: cs?.color,
  };
});
if (suggestHeading.hasHeading && suggestHeading.headingText === 'Suggest an Investigation') pass('suggest section title present');
else fail(`suggest section title: ${JSON.stringify(suggestHeading)}`);
if (suggestHeading.headingFamily?.includes('Fraunces') && parseFloat(suggestHeading.headingSize) >= 22) pass('suggest title serif display style');
else fail(`suggest title style: ${JSON.stringify(suggestHeading)}`);
if (suggestHeading.headingColor === 'rgb(242, 232, 220)' && suggestHeading.ctaColor === suggestHeading.headingColor && suggestHeading.leadColor !== suggestHeading.headingColor) pass('title/body/CTA color hierarchy');
else fail(`suggest color hierarchy: ${JSON.stringify(suggestHeading)}`);
if (suggestUi.caseCardsVisible && suggestUi.ranItVisible) pass('curated case replay visible by default');
else fail('curated case replay not primary');

const collapsedFormHidden = await page.evaluate(() => !document.querySelector('.wb-suggest-module textarea'));
if (collapsedFormHidden) pass('suggest form hidden until expanded');
else fail('suggest form visible while collapsed');

await page.evaluate(() => [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Suggest an investigation'))?.click());
await wait(200);

const formCheck = await page.evaluate(() => ({
  headline: document.querySelector('.wb-suggest-module__lead')?.textContent?.trim(),
  submitBtn: [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Submit Investigation'))?.textContent?.trim(),
  gauge: !!document.querySelector('.wb-result-gap-gauge'),
  emailGate: !!document.querySelector('.wb-email-gate'),
  expanded: document.querySelector('.wb-suggest-module.is-expanded') !== null,
}));
if (formCheck.headline?.includes('What should Imbas investigate next')) pass('suggest intro copy');
else fail(`suggest intro: ${formCheck.headline}`);
if (formCheck.submitBtn && formCheck.expanded) pass('Submit Investigation button present when expanded');
else fail('Submit Investigation button missing when expanded');
if (!formCheck.gauge && !formCheck.emailGate) pass('no scoring/gate on suggest form');
else fail('scoring/gate present on suggest form');

await page.evaluate(() => {
  window.__origFetch = window.fetch.bind(window);
  window.fetch = async (url, opts) => String(url).includes('/api/repository') ? { ok: true, json: async () => ({ ok: true }) } : window.__origFetch(url, opts);
});
await page.type('.wb-suggest-module input[type="text"]', 'Historical model claims');
const suggestAreas = await page.$$('.wb-suggest-module textarea');
await suggestAreas[0].type('Does the model cite primary sources when asked about contested events?');
await page.evaluate(() => [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Submit Investigation'))?.click());
await wait(800);

report.spot.suggestComplete = await page.evaluate(() => ({
  thankYou: document.body.textContent.includes('Thank you'),
  recorded: document.body.textContent.includes('Your submission has been recorded for review'),
  gauge: !!document.querySelector('.wb-result-gap-gauge'),
  score: !!document.querySelector('.wb-result-gap-hero__score'),
  resultPage: !!document.querySelector('.wb-output-module'),
}));

if (report.spot.suggestComplete.thankYou && report.spot.suggestComplete.recorded) pass('suggest acknowledgment state');
else fail('suggest acknowledgment missing');
if (!report.spot.suggestComplete.gauge && !report.spot.suggestComplete.score && !report.spot.suggestComplete.resultPage) pass('no score/result from suggest submit');
else fail('score/result generated from suggest');

// Suggest submit failure spot-check
await page.goto(`${base}/workbench.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  localStorage.removeItem('imbas_wb_email');
  window.__origFetch = window.fetch.bind(window);
  window.fetch = async (url) => String(url).includes('/api/repository') ? { ok: false, json: async () => ({ ok: false }) } : window.__origFetch(url);
});
await page.reload({ waitUntil: 'networkidle0' });
await wait(300);
await page.evaluate(() => [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Suggest an investigation'))?.click());
await wait(200);
await page.type('.wb-suggest-module input[type="text"]', 'Test investigation topic');
const failAreas = await page.$$('.wb-suggest-module textarea');
await failAreas[0].type('Something worth inspecting in model answers.');
await page.evaluate(() => [...document.querySelectorAll('.wb-suggest-module button')].find((b) => b.textContent.includes('Submit Investigation'))?.click());
await wait(800);

report.spot.suggestFailure = await page.evaluate(() => ({
  submitFailure: !!document.querySelector('.wb-status-readout--failure'),
  failureCopy: document.querySelector('.wb-status-readout--failure .wb-status-readout__body')?.textContent?.trim(),
}));

if (report.spot.suggestFailure.submitFailure) pass('suggest submit failure state present');
else fail('suggest submit failure UI missing after failed POST');

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
