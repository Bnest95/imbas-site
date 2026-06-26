import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function mockRes() {
  let statusCode = 200;
  let body = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      body = data;
      return this;
    },
    get result() {
      return { status: statusCode, body };
    },
  };
}

async function callHandler(handler, req) {
  const res = mockRes();
  await handler(req, res);
  return res.result;
}

const validPayload = {
  topic: 'Test topic',
  aiAnswer: 'Test AI answer body',
  email: 'user@example.com',
  hp: '',
};

const experienceSrc = fs.readFileSync(path.join(root, 'api/experience.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');

const badPatterns = [
  { name: 'detail in json response', re: /json\(\{[^}]*detail:/ },
  { name: 'airtable body in client response', re: /json\(\{[^}]*tblmGIHhQNcvFVgoF/ },
];

const staticScan = {
  experienceApi: badPatterns.map((p) => ({ pattern: p.name, found: p.re.test(experienceSrc) })),
  noTokenInClient:
    !index.includes('AIRTABLE_TOKEN') &&
    !index.includes('Bearer ') &&
    !/api\.airtable\.com/.test(index),
  postsToExperience:
    index.includes("fetch('/api/experience'") &&
    index.includes('aiAnswer: aiAnswer'),
  honeypotInForm: /experience-capture[\s\S]*name="hp"/.test(index),
  maxlengths:
    index.includes('maxlength="500"') &&
    index.includes('maxlength="12000"') &&
    index.includes('maxlength="254"'),
  successCopy: index.includes('Got it. We&rsquo;ll be in touch when we have something.'),
  errorCopy: index.includes('Something didn&rsquo;t go through. Try again in a moment.'),
  noAnalyticsPayload:
    !/window\.va\([\s\S]*experience-capture/.test(index) &&
    !/va\.track[\s\S]*topic/.test(index),
  privacySentence: privacy.includes('These submissions are not published automatically.'),
  tokenServerOnly: experienceSrc.includes('process.env.AIRTABLE_TOKEN'),
};

const experienceHandler = (await import(path.join(root, 'api/experience.js'))).default;

const hadToken = process.env.AIRTABLE_TOKEN;
delete process.env.AIRTABLE_TOKEN;

const handlerTests = {
  get405: await callHandler(experienceHandler, { method: 'GET', headers: {}, body: {} }),
  missingTopic: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { aiAnswer: 'x', email: 'a@b.co' },
  }),
  missingAiAnswer: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { topic: 'x', email: 'a@b.co' },
  }),
  invalidEmail: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { ...validPayload, email: 'not-email' },
  }),
  topicTooLong: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { ...validPayload, topic: 'x'.repeat(501) },
  }),
  aiAnswerTooLong: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { ...validPayload, aiAnswer: 'x'.repeat(12001) },
  }),
  bodyTooLargeHeader: await callHandler(experienceHandler, {
    method: 'POST',
    headers: { 'content-length': String(64 * 1024 + 1) },
    body: validPayload,
  }),
  bodyTooLargeJson: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { ...validPayload, _pad: 'x'.repeat(70000) },
  }),
  hpTooLong: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: { ...validPayload, hp: 'x'.repeat(1001) },
  }),
  unconfigured: await callHandler(experienceHandler, {
    method: 'POST',
    headers: {},
    body: validPayload,
  }),
};

let fetchCalls = 0;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetchCalls += 1;
  return { ok: true, json: async () => ({ id: 'recTest' }) };
};

handlerTests.honeypot = await callHandler(experienceHandler, {
  method: 'POST',
  headers: {},
  body: { ...validPayload, hp: 'bot' },
});
const honeypotFetchCalls = fetchCalls;
fetchCalls = 0;

process.env.AIRTABLE_TOKEN = 'test-token';
for (let i = 0; i < 6; i += 1) {
  await callHandler(experienceHandler, {
    method: 'POST',
    headers: { 'x-forwarded-for': '203.0.113.50' },
    body: validPayload,
  });
}
handlerTests.rateLimited = await callHandler(experienceHandler, {
  method: 'POST',
  headers: { 'x-forwarded-for': '203.0.113.50' },
  body: validPayload,
});

globalThis.fetch = async () => ({
  ok: false,
  status: 422,
  text: async () => 'UNKNOWN_FIELD_NAME secret-field-detail',
});
handlerTests.airtableFailure = await callHandler(experienceHandler, {
  method: 'POST',
  headers: { 'x-forwarded-for': '203.0.113.99' },
  body: validPayload,
});
globalThis.fetch = origFetch;

if (hadToken !== undefined) process.env.AIRTABLE_TOKEN = hadToken;
else delete process.env.AIRTABLE_TOKEN;

const report = {
  staticScan,
  handlerTests,
  honeypotFetchCalls,
  pass:
    staticScan.experienceApi.every((c) => !c.found) &&
    staticScan.noTokenInClient &&
    staticScan.postsToExperience &&
    staticScan.honeypotInForm &&
    staticScan.maxlengths &&
    staticScan.successCopy &&
    staticScan.errorCopy &&
    staticScan.noAnalyticsPayload &&
    staticScan.privacySentence &&
    staticScan.tokenServerOnly &&
    handlerTests.get405.status === 405 &&
    handlerTests.missingTopic.status === 400 &&
    handlerTests.missingTopic.body?.error === 'invalid' &&
    handlerTests.missingAiAnswer.status === 400 &&
    handlerTests.invalidEmail.status === 400 &&
    handlerTests.topicTooLong.status === 400 &&
    handlerTests.aiAnswerTooLong.status === 400 &&
    handlerTests.bodyTooLargeHeader.status === 413 &&
    handlerTests.bodyTooLargeHeader.body?.error === 'too_large' &&
    handlerTests.bodyTooLargeJson.status === 413 &&
    handlerTests.hpTooLong.status === 400 &&
    handlerTests.honeypot.status === 200 &&
    handlerTests.honeypot.body?.ok === true &&
    honeypotFetchCalls === 0 &&
    handlerTests.unconfigured.status === 503 &&
    handlerTests.unconfigured.body?.error === 'unconfigured' &&
    handlerTests.rateLimited.status === 429 &&
    handlerTests.rateLimited.body?.error === 'rate' &&
    handlerTests.airtableFailure.status === 502 &&
    handlerTests.airtableFailure.body?.error === 'airtable' &&
    !JSON.stringify(handlerTests.airtableFailure.body).includes('secret-field-detail'),
};

const outDir = path.join(__dirname, 'experience-api-pass5m');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
