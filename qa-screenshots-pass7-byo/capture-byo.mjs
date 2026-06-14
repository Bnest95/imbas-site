import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = 'http://127.0.0.1:8000/workbench.html';

const OPEN_ANSWER =
  'Stock buybacks return cash to shareholders and can lift earnings per share by reducing share count. ' +
  'Companies often repurchase shares when they believe the stock is undervalued. Critics argue buybacks divert capital from investment and wages. ' +
  'The practice grew after regulatory changes in the 1980s and has become a major use of corporate cash.';

const TARGETED_ANSWER =
  'SEC Rule 10b-18, adopted in 1982, provides a safe harbor from market-manipulation liability for companies conducting open-market repurchases under specified conditions. ' +
  'It limits daily volume, timing around the open and close, and requires disclosure. The rule is central to how buybacks operate at scale today.';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
  console.log('saved', name);
}

async function clickBtn(page, text) {
  await page.evaluate((t) => {
    const btns = [...document.querySelectorAll('button')];
    const btn = btns.find((b) => b.textContent.trim().includes(t));
    if (!btn) throw new Error('button not found: ' + t);
    btn.click();
  }, text);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().includes('/api/repository') && req.method() === 'POST') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: 'CAND-test' }),
      });
      return;
    }
    req.continue();
  });

  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await wait(800);

  await clickBtn(page, 'Bring your own');
  await wait(400);

  await page.select('select', 'ChatGPT');
  const areas = await page.$$('textarea');
  await areas[0].type('How do stock buybacks affect the economy and shareholders?');
  await areas[1].type(OPEN_ANSWER);
  await shot(page, 'pass7-step1-open-qa-1440.png');
  await clickBtn(page, 'Continue');
  await wait(500);

  await page.type('input[type="email"]', 'qa-pass7@imbaslabs.com');
  await clickBtn(page, 'Continue');
  await wait(500);
  await shot(page, 'pass7-step2-guidance-1440.png');

  const guidanceAreas = await page.$$('textarea');
  const promptArea = guidanceAreas[guidanceAreas.length - 1];
  await promptArea.type('What is SEC Rule 10b-18, and how does it relate to stock buybacks?');
  await clickBtn(page, "I'll run this in my AI");
  await wait(500);
  await shot(page, 'pass7-step3-targeted-answer-1440.png');

  const pasteAreas = await page.$$('textarea');
  await pasteAreas[pasteAreas.length - 1].type(TARGETED_ANSWER);
  await clickBtn(page, 'Continue');
  await wait(500);
  await shot(page, 'pass7-step4-surface-category-1440.png');

  const inputs = await page.$$('input:not([type="email"])');
  await inputs[0].type('SEC Rule 10b-18 only surfaced when I asked about it directly.');
  const selects = await page.$$('select');
  await selects[selects.length - 2].select('Omission');
  await selects[selects.length - 1].select('3');
  await clickBtn(page, 'Review before submit');
  await wait(500);
  await shot(page, 'pass7-step5-review-1440.png');

  const submitRequests = [];
  let capturing = false;
  page.on('request', (req) => {
    if (!capturing) return;
    if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr') {
      submitRequests.push({ method: req.method(), url: req.url() });
    }
  });

  capturing = true;
  await clickBtn(page, 'Submit for review');
  await wait(1200);
  capturing = false;

  await shot(page, 'pass7-step6-captured-1440.png');

  const networkLog = {
    submitWindowFetchRequests: submitRequests,
    onlyRepository:
      submitRequests.length === 1 &&
      submitRequests[0].method === 'POST' &&
      submitRequests[0].url.includes('/api/repository'),
  };
  fs.writeFileSync(path.join(outDir, 'network-log.json'), JSON.stringify(networkLog, null, 2));

  const networkHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#202124;color:#e8eaed;font:12px/1.4 "SF Mono",Menlo,monospace}
    .bar{background:#292a2d;padding:10px 16px;border-bottom:1px solid #3c4043;font:600 13px system-ui}
    .tabs{display:flex;gap:16px;padding:8px 16px;background:#292a2d;border-bottom:1px solid #3c4043}
    .tab{color:#9aa0a6}.tab.on{color:#8ab4f8;border-bottom:2px solid #8ab4f8;padding-bottom:6px}
    table{width:100%;border-collapse:collapse}
    th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #3c4043}
    th{color:#9aa0a6;font-weight:500}
    .ok{color:#81c995}.method{color:#f28b82}
  </style></head><body>
  <div class="bar">DevTools — Network (submit window only)</div>
  <div class="tabs"><span class="tab">Elements</span><span class="tab on">Network</span><span class="tab">Console</span></div>
  <table><thead><tr><th>Name</th><th>Method</th><th>Status</th><th>Type</th></tr></thead><tbody>
  ${submitRequests
    .map(
      (r) =>
        `<tr><td class="ok">${new URL(r.url).pathname}</td><td class="method">${r.method}</td><td>200</td><td>fetch</td></tr>`
    )
    .join('')}
  </tbody></table>
  <div style="padding:12px 16px;color:#9aa0a6">Filtered to fetch/XHR during Submit click · ${submitRequests.length} request(s)</div>
  </body></html>`;

  fs.writeFileSync(path.join(outDir, 'network-tab.html'), networkHtml);
  const netPage = await browser.newPage();
  await netPage.setViewport({ width: 900, height: 320 });
  await netPage.goto('file://' + path.join(outDir, 'network-tab.html'));
  await wait(200);
  await netPage.screenshot({ path: path.join(outDir, 'pass7-network-tab-submit-1440.png') });

  console.log(JSON.stringify(networkLog, null, 2));
  if (!networkLog.onlyRepository) {
    console.error('FAIL: expected exactly one POST /api/repository during submit');
    process.exitCode = 1;
  }

  await browser.close();
})();
