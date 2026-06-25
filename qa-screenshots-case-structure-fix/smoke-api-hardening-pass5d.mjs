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

const apiFiles = ['api/field-notes-signup.js', 'api/repository.js'].map((f) => path.join(root, f));
const apiSources = Object.fromEntries(apiFiles.map((f) => [path.basename(f), fs.readFileSync(f, 'utf8')]));

const badPatterns = [
  { name: 'detail in json response', re: /json\(\{[^}]*detail:/ },
  { name: 'slice(0, 300) in client response', re: /json\(\{[^}]*slice\(0,\s*300\)/ },
];

const staticScan = {};
for (const [file, src] of Object.entries(apiSources)) {
  staticScan[file] = badPatterns.map((p) => ({ pattern: p.name, found: p.re.test(src) }));
}

const fieldNotesHandler = (await import(path.join(root, 'api/field-notes-signup.js'))).default;
const repositoryHandler = (await import(path.join(root, 'api/repository.js'))).default;

const hadToken = process.env.AIRTABLE_TOKEN;
const hadTable = process.env.AIRTABLE_FIELD_NOTES_TABLE;
delete process.env.AIRTABLE_TOKEN;
delete process.env.AIRTABLE_FIELD_NOTES_TABLE;

const fieldNotesTests = {
  honeypot: await callHandler(fieldNotesHandler, {
    method: 'POST',
    headers: {},
    body: { email: 'bot@example.com', hp: 'filled' },
  }),
  unconfigured: await callHandler(fieldNotesHandler, {
    method: 'POST',
    headers: {},
    body: { email: 'valid@example.com' },
  }),
};

process.env.AIRTABLE_TOKEN = 'test-token';
process.env.AIRTABLE_FIELD_NOTES_TABLE = 'tblTest';
fieldNotesTests.invalidEmail = await callHandler(fieldNotesHandler, {
  method: 'POST',
  headers: {},
  body: { email: 'not-an-email' },
});

if (hadToken !== undefined) process.env.AIRTABLE_TOKEN = hadToken;
else delete process.env.AIRTABLE_TOKEN;
if (hadTable !== undefined) process.env.AIRTABLE_FIELD_NOTES_TABLE = hadTable;
else delete process.env.AIRTABLE_FIELD_NOTES_TABLE;

const hadRepoToken = process.env.AIRTABLE_TOKEN;
delete process.env.AIRTABLE_TOKEN;
const repositoryUnconfigured = await callHandler(repositoryHandler, {
  method: 'POST',
  headers: {},
  body: { schema: 'imbas.candidate.v0', mode: 'curated', model: 'ChatGPT' },
});
if (hadRepoToken !== undefined) process.env.AIRTABLE_TOKEN = hadRepoToken;
else delete process.env.AIRTABLE_TOKEN;

const subscribeJsSrc = fs.readFileSync(path.join(root, 'field-notes-subscribe.js'), 'utf8');
const formFiles = ['index.html', 'for-readers.html', 'field-notes/index.html'];
const forms = formFiles.map((f) => {
  const html = fs.readFileSync(path.join(root, f), 'utf8');
  return {
    file: f,
    hasHpInput: /name="hp"/.test(html),
    hasSubscribeClass: /subscribe--field-notes/.test(html),
  };
});

const report = {
  staticScan,
  fieldNotesTests,
  repositoryUnconfigured,
  subscribeJs: {
    sendsHp: /hp:\s*hpInput/.test(subscribeJsSrc),
  },
  forms,
  pass:
    Object.values(staticScan).every((checks) => checks.every((c) => !c.found)) &&
    fieldNotesTests.invalidEmail.status === 400 &&
    fieldNotesTests.invalidEmail.body?.error === 'invalid_email' &&
    fieldNotesTests.honeypot.status === 200 &&
    fieldNotesTests.honeypot.body?.ok === true &&
    !('detail' in (fieldNotesTests.honeypot.body || {})) &&
    fieldNotesTests.unconfigured.status === 503 &&
    fieldNotesTests.unconfigured.body?.error === 'unconfigured' &&
    !('detail' in (fieldNotesTests.unconfigured.body || {})) &&
    !('detail' in (repositoryUnconfigured.body || {})) &&
    /hp:\s*hpInput/.test(subscribeJsSrc) &&
    forms.every((f) => f.hasHpInput),
};

const outDir = path.join(__dirname, 'api-hardening-pass5d');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'verification.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
