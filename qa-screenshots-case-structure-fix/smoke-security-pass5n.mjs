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

const apiRoutes = [
  'api/field-notes-signup.js',
  'api/repository.js',
  'api/experience.js',
  'api/read.js',
];

const clientFiles = [
  'index.html',
  'workbench.html',
  'workbench.bundle.js',
  'field-notes-subscribe.js',
  'workbench-app.jsx',
];

const secretPatterns = [
  { name: 'AIRTABLE_TOKEN literal', re: /AIRTABLE_TOKEN\s*=\s*['"][^'"]+['"]/ },
  { name: 'Bearer token literal', re: /Bearer\s+[a-zA-Z0-9._-]{20,}/ },
  { name: 'Anthropic key literal', re: /sk-ant-[a-zA-Z0-9_-]+/ },
];

const tokenScan = {};
for (const rel of clientFiles) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8');
  tokenScan[rel] = {
    hasAirtableToken: src.includes('AIRTABLE_TOKEN'),
    hasProcessEnv: src.includes('process.env'),
    hasBearer: /Bearer\s+\$\{/.test(src) || /Bearer\s+[a-zA-Z0-9._-]{20,}/.test(src),
    badPatterns: secretPatterns.map((p) => ({ pattern: p.name, found: p.re.test(src) })),
  };
}

const vercelJson = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cspBlocks = vercelJson.headers.map((h) => ({
  source: h.source,
  csp: h.headers.find((x) => x.key === 'Content-Security-Policy')?.value || '',
}));

const fieldNotes = (await import(path.join(root, 'api/field-notes-signup.js'))).default;
const repository = (await import(path.join(root, 'api/repository.js'))).default;
const experience = (await import(path.join(root, 'api/experience.js'))).default;
const read = (await import(path.join(root, 'api/read.js'))).default;

const methodChecks = {
  fieldNotesGet: await callHandler(fieldNotes, { method: 'GET', headers: {}, body: {} }),
  repositoryGet: await callHandler(repository, { method: 'GET', headers: {}, body: {} }),
  experienceGet: await callHandler(experience, { method: 'GET', headers: {}, body: {} }),
  readGet: await callHandler(read, { method: 'GET', headers: {}, body: {} }),
};

const hadToken = process.env.AIRTABLE_TOKEN;
delete process.env.AIRTABLE_TOKEN;

const fieldNotesTooLarge = await callHandler(fieldNotes, {
  method: 'POST',
  headers: { 'content-length': String(9 * 1024) },
  body: { email: 'a@b.co' },
});

process.env.AIRTABLE_TOKEN = 'test-token';
process.env.AIRTABLE_FIELD_NOTES_TABLE = 'tblTest';
let fieldNotesFetchCalls = 0;
const origFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fieldNotesFetchCalls += 1;
  return { ok: true, json: async () => ({ records: [] }) };
};
const fieldNotesHoneypot = await callHandler(fieldNotes, {
  method: 'POST',
  headers: {},
  body: { email: 'a@b.co', hp: 'bot' },
});
const honeypotFetchCalls = fieldNotesFetchCalls;
globalThis.fetch = origFetch;

const repositoryTooLarge = await callHandler(repository, {
  method: 'POST',
  headers: { 'content-length': String(257 * 1024) },
  body: { schema: 'imbas.candidate.v0', mode: 'curated', model: 'ChatGPT' },
});
const repositoryHoneypot = await callHandler(repository, {
  method: 'POST',
  headers: {},
  body: { schema: 'imbas.candidate.v0', mode: 'curated', model: 'ChatGPT', hp: 'bot' },
});

const readTooLarge = await callHandler(read, {
  method: 'POST',
  headers: { 'content-length': String(129 * 1024) },
  body: { case: {}, textcheck: {} },
});
const readRate = [];
for (let i = 0; i < 14; i += 1) {
  readRate.push(
    await callHandler(read, {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.10' },
      body: { case: {}, textcheck: { surfaced: false, found: [], missing: [] } },
    })
  );
}

if (hadToken !== undefined) process.env.AIRTABLE_TOKEN = hadToken;
else delete process.env.AIRTABLE_TOKEN;
delete process.env.AIRTABLE_FIELD_NOTES_TABLE;

const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const workbenchBundle = fs.readFileSync(path.join(root, 'workbench.bundle.js'), 'utf8');

const report = {
  apiInventory: [
    { route: '/api/field-notes-signup', methods: 'POST', rate: '6/min/IP', bodyMax: '8KB' },
    { route: '/api/repository', methods: 'POST', rate: '8/min/IP', bodyMax: '256KB' },
    { route: '/api/experience', methods: 'POST', rate: '5/10min/IP', bodyMax: '64KB' },
    { route: '/api/read', methods: 'POST', rate: '12/min/IP', bodyMax: '128KB' },
  ],
  honeypots: {
    fieldNotesForms: ['index.html', 'for-readers.html', 'field-notes/index.html'].every((f) =>
      /name="hp"/.test(fs.readFileSync(path.join(root, f), 'utf8'))
    ),
    experienceForm: /experience-capture[\s\S]*name="hp"/.test(index),
    workbenchHtml: fs.readFileSync(path.join(root, 'workbench.html'), 'utf8').includes('id="wb-hp"'),
    workbenchBundleSendsHp: /hp:.{0,40}wb-hp|getElementById\("wb-hp"\)/.test(workbenchBundle),
  },
  tokenScan,
  csp: {
    blocks: cspBlocks.map((b) => ({
      source: b.source,
      hasWildcard: /\s\*\s|; \*|'\*'/.test(b.csp),
      hasUnsafeEval: b.csp.includes('unsafe-eval'),
      hasGoogleAnalytics: /google-analytics|googletagmanager/.test(b.csp),
      allowsVercelAnalytics: b.csp.includes('vitals.vercel-insights.com'),
      allowsAirtableInBrowser: b.csp.includes('airtable.com'),
    })),
    noCorsHeaders: !JSON.stringify(vercelJson).toLowerCase().includes('access-control'),
  },
  analytics: {
    noCustomVaEvents: !/va\([^)]*(topic|email|answer|prompt)/i.test(index + workbenchBundle),
    noFormValuesInQuery: !/fetch\([^)]*\?[^)]*(email|topic|aiAnswer)/.test(index),
    vercelSnippet: index.includes('/_vercel/insights/script.js'),
  },
  dependencies: {
    deps: pkg.dependencies || null,
    devDeps: Object.keys(pkg.devDependencies || {}),
    hasVercelAnalyticsPackage: !!(pkg.dependencies && pkg.dependencies['@vercel/analytics']),
  },
  methodChecks,
  bodyLimits: {
    fieldNotesTooLarge: fieldNotesTooLarge.status,
    repositoryTooLarge: repositoryTooLarge.status,
    readTooLarge: readTooLarge.status,
  },
  honeypotBehavior: {
    fieldNotesStatus: fieldNotesHoneypot.status,
    fieldNotesFetchCalls: honeypotFetchCalls,
    repositoryHoneypotStatus: repositoryHoneypot.status,
  },
  readRateLimited: readRate.some((r) => r.status === 429),
  staticExposure: {
    envFilesInRepo: ['.env', '.env.local', '.env.production'].filter((f) =>
      fs.existsSync(path.join(root, f))
    ),
    grantEnginePresent: fs.existsSync(path.join(root, 'grant-engine')),
  },
};

report.pass =
  Object.values(tokenScan).every(
    (r) => !r.hasAirtableToken && !r.hasProcessEnv && !r.badPatterns.some((p) => p.found)
  ) &&
  Object.values(methodChecks).every((r) => r.status === 405) &&
  report.bodyLimits.fieldNotesTooLarge === 413 &&
  report.bodyLimits.repositoryTooLarge === 413 &&
  report.bodyLimits.readTooLarge === 413 &&
  report.honeypotBehavior.fieldNotesStatus === 200 &&
  report.honeypotBehavior.fieldNotesFetchCalls === 0 &&
  report.honeypotBehavior.repositoryHoneypotStatus === 200 &&
  report.readRateLimited &&
  Object.values(report.honeypots).every(Boolean) &&
  report.csp.blocks.every((b) => !b.hasWildcard && !b.hasUnsafeEval && !b.hasGoogleAnalytics) &&
  report.csp.noCorsHeaders &&
  report.analytics.noCustomVaEvents &&
  report.analytics.vercelSnippet &&
  report.staticExposure.envFilesInRepo.length === 0;

const outDir = path.join(__dirname, 'security-pass5n');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
