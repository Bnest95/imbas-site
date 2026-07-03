// imbas-metrics — classification/aggregation logic for the read-only metrics script.
// Pure functions and an injected-fetch pagination test only: no network, no Airtable,
// no token. Importing the module does not run main() (guarded on being the entry file),
// so these tests never touch a live base.
// Run: node --test test/imbas-metrics.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  parseArgs,
  describeHttpError,
  fetchAllRecords,
  selectName,
  isControlCase,
  hasSeverity,
  caseIdOf,
  sortCaseIds,
  classifyCases,
  triageDistribution,
  provenanceStats,
  pct,
  formatReport,
} from "../scripts/imbas-metrics.mjs";

test("parseArgs accepts help and empty argv, rejects unknown flags", () => {
  assert.deepEqual(parseArgs([]), { help: false });
  assert.deepEqual(parseArgs(["--help"]), { help: true });
  assert.deepEqual(parseArgs(["-h"]), { help: true });
  assert.throws(() => parseArgs(["--nope"]), /unknown argument/);
  assert.throws(() => parseArgs(["extra"]), /unknown argument/);
});

test("selectName handles string, object, and empty shapes", () => {
  assert.equal(selectName("new"), "new");
  assert.equal(selectName({ id: "sel1", name: "promoted" }), "promoted");
  assert.equal(selectName(null), "");
  assert.equal(selectName(undefined), "");
});

test("isControlCase matches the parenthetical control annotation only", () => {
  // Real markers observed in the archive.
  assert.equal(isControlCase("Climate Change Basics (CONTROL)"), true);
  assert.equal(isControlCase("Vaccines / General Efficacy (CONTROL)"), true);
  assert.equal(isControlCase("Theranos (control, predicted small gap)"), true);
  assert.equal(isControlCase("MMR / autism (control, cuts against heterodox audience)"), true);
  // Substantive titles must not be caught — including topical uses of the word "control".
  assert.equal(isControlCase("Ultra-Processed Foods"), false);
  assert.equal(isControlCase("Rent Control / Housing Supply"), false); // topical, not annotation
  assert.equal(isControlCase("Gun Control / Background Checks"), false);
  assert.equal(isControlCase("NSA Bulk Collection / Disclosure Coordination"), false);
  assert.equal(isControlCase("(controls, plural)"), false); // \b guards the plural
  assert.equal(isControlCase(""), false);
  assert.equal(isControlCase(undefined), false);
});

test("hasSeverity treats any present finite number (incl 0) as scored", () => {
  assert.equal(hasSeverity({ Severity: 1.5 }), true);
  assert.equal(hasSeverity({ Severity: 0 }), true);
  assert.equal(hasSeverity({}), false); // Airtable omits empty numbers
  assert.equal(hasSeverity({ Severity: "1.5" }), false); // stringly-typed is not scored
  assert.equal(hasSeverity(null), false);
});

test("caseIdOf trims strings and tolerates missing", () => {
  assert.equal(caseIdOf({ "Case ID": "023" }), "023");
  assert.equal(caseIdOf({ "Case ID": " 035 " }), "035");
  assert.equal(caseIdOf({}), "");
  assert.equal(caseIdOf(null), "");
});

test("sortCaseIds orders zero-padded ids numerically", () => {
  assert.deepEqual(sortCaseIds(["034", "023", "030", "024"]), ["023", "024", "030", "034"]);
  // non-numeric ids fall back to lexical without throwing
  assert.deepEqual(sortCaseIds(["b", "a", "010"]), ["010", "a", "b"]);
});

test("classifyCases separates scored, substantive-unscored, and control-unscored", () => {
  const records = [
    { id: "r1", fields: { "Case ID": "001", Name: "Sertraline / PSSD", Severity: 1.5 } },
    // control that IS scored -> counts as scored, not surfaced as a control gap
    { id: "r2", fields: { "Case ID": "011", Name: "Theranos (control, predicted small gap)", Severity: 1.25 } },
    // severity 0 -> scored
    { id: "r3", fields: { "Case ID": "099", Name: "Zero Sev", Severity: 0 } },
    // substantive, unscored
    { id: "r4", fields: { "Case ID": "023", Name: "Ultra-Processed Foods" } },
    { id: "r5", fields: { "Case ID": "030", Name: "Sunscreen / Chemical UV Filters" } },
    // control, unscored
    { id: "r6", fields: { "Case ID": "035", Name: "Climate Change Basics (CONTROL)" } },
    { id: "r7", fields: { "Case ID": "037", Name: "AI Hallucinations / Self-Knowledge (CONTROL)" } },
    // topical "control" but unscored -> substantive gap, not a control
    { id: "r8", fields: { "Case ID": "100", Name: "Rent Control / Housing" } },
    // missing case id -> placeholder, still a substantive gap
    { id: "recABC", fields: { Name: "Mystery" } },
  ];
  const c = classifyCases(records);
  assert.equal(c.total, 9);
  assert.equal(c.scored, 3);
  assert.equal(c.unscored, 6);
  assert.deepEqual(c.unscoredSubstantive, ["023", "030", "100", "(no case id: recABC)"]);
  assert.deepEqual(c.unscoredControls, ["035", "037"]);
});

test("classifyCases reproduces the live 37-case shape", () => {
  // Minimal reconstruction pinning the counts the script must report against live data:
  // 22 scored, 12 substantive-unscored (023-034), 3 control-unscored (035-037).
  const records = [];
  const scoredIds = ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010",
    "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022"];
  for (const id of scoredIds) {
    const name = ["011", "012", "013"].includes(id) ? `Case ${id} (control, small gap)` : `Case ${id}`;
    records.push({ id: `rec${id}`, fields: { "Case ID": id, Name: name, Severity: 1.5 } });
  }
  for (let n = 23; n <= 34; n++) {
    const id = String(n).padStart(3, "0");
    records.push({ id: `rec${id}`, fields: { "Case ID": id, Name: `Case ${id}` } });
  }
  for (const id of ["035", "036", "037"]) {
    records.push({ id: `rec${id}`, fields: { "Case ID": id, Name: `Case ${id} (CONTROL)` } });
  }
  const c = classifyCases(records);
  assert.equal(c.total, 37);
  assert.equal(c.scored, 22);
  assert.deepEqual(c.unscoredSubstantive, [
    "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034",
  ]);
  assert.deepEqual(c.unscoredControls, ["035", "036", "037"]);
});

test("triageDistribution counts each status, tolerating string and object cells", () => {
  const records = [
    { id: "a", fields: { "Triage Status": "new" } },
    { id: "b", fields: { "Triage Status": { id: "sel1", name: "new" } } },
    { id: "c", fields: { "Triage Status": "promoted" } },
    { id: "d", fields: {} }, // unset
  ];
  const { total, counts } = triageDistribution(records);
  assert.equal(total, 4);
  assert.equal(counts.get("new"), 2);
  assert.equal(counts.get("promoted"), 1);
  assert.equal(counts.get("(unset)"), 1);
});

test("provenanceStats counts only rows with BOTH version and hash, and never leaks the hash", () => {
  const records = [
    { id: "r1", fields: {} },
    { id: "r2", fields: { "Reader Prompt Version": "reader.v1" } }, // version only
    { id: "r3", fields: { "Source Content Hash": "deadbeefcafe" } }, // hash only
    { id: "r4", fields: { "Reader Prompt Version": "reader.v1", "Source Content Hash": "deadbeefcafe" } },
    { id: "r5", fields: { "Reader Prompt Version": "reader.v2", "Source Content Hash": "0011aabb" } },
  ];
  const p = provenanceStats(records);
  assert.equal(p.total, 5);
  assert.equal(p.populated, 2);
  assert.equal(p.rate, 2 / 5);
  assert.equal(p.versions.get("reader.v1"), 1);
  assert.equal(p.versions.get("reader.v2"), 1);
  // The returned stats must not carry any hash value.
  const serialized = JSON.stringify({ ...p, versions: [...p.versions.entries()] });
  assert.ok(!serialized.includes("deadbeefcafe"), "provenance stats must not expose hash values");
  assert.ok(!serialized.includes("0011aabb"), "provenance stats must not expose hash values");
});

test("provenanceStats handles an empty table without dividing by zero", () => {
  const p = provenanceStats([]);
  assert.equal(p.total, 0);
  assert.equal(p.populated, 0);
  assert.equal(p.rate, 0);
});

test("pct formats a one-decimal percentage and guards zero denominator", () => {
  assert.equal(pct(22, 37), "59.5%");
  assert.equal(pct(1, 6), "16.7%");
  assert.equal(pct(0, 0), "n/a");
});

test("describeHttpError maps common statuses to hints without leaking content", () => {
  assert.match(describeHttpError(401, ""), /401.*unauthorized/i);
  assert.match(describeHttpError(403, ""), /403.*forbidden/i);
  assert.match(describeHttpError(404, ""), /404.*not found/i);
  assert.match(describeHttpError(422, ""), /422.*unprocessable/i);
  assert.match(describeHttpError(500, "boom"), /500.*unexpected/i);
});

test("fetchAllRecords follows offset pagination and issues GET-only reads", async () => {
  const calls = [];
  const pages = [
    { records: [{ id: "a" }, { id: "b" }], offset: "next1" },
    { records: [{ id: "c" }] }, // no offset -> last page
  ];
  let i = 0;
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    const page = pages[i++];
    return { ok: true, json: async () => page };
  };
  const records = await fetchAllRecords({
    token: "tok", table: "tblX", fields: ["Case ID", "Severity"], fetchImpl: fakeFetch,
  });
  assert.deepEqual(records.map((r) => r.id), ["a", "b", "c"]);
  assert.equal(calls.length, 2);
  // Read-only: no request ever sets a method or body (default GET).
  for (const { init } of calls) {
    assert.ok(!("method" in init), "fetchAllRecords must not set an HTTP method (GET only)");
    assert.ok(!("body" in init), "fetchAllRecords must not send a body");
    assert.ok(init.headers.Authorization.startsWith("Bearer "), "auth header expected");
  }
  // Requested only the named fields and paged with the offset from page 1.
  assert.match(calls[0].url, /fields%5B%5D=Case\+ID/);
  assert.match(calls[0].url, /pageSize=100/);
  assert.ok(!calls[0].url.includes("offset="), "first page carries no offset");
  assert.match(calls[1].url, /offset=next1/);
});

test("fetchAllRecords raises a clear error on a non-2xx response", async () => {
  const fakeFetch = async () => ({ ok: false, status: 403, text: async () => '{"error":"NOT_AUTHORIZED"}' });
  await assert.rejects(
    () => fetchAllRecords({ token: "tok", table: "tblX", fields: ["Case ID"], fetchImpl: fakeFetch }),
    /403.*forbidden/i,
  );
});

test("formatReport renders the six metrics and lists control ids separately", () => {
  const out = formatReport({
    cases: {
      total: 37, scored: 22, unscored: 15,
      unscoredSubstantive: ["023", "024"], unscoredControls: ["035", "036", "037"],
    },
    triage: { total: 8, counts: new Map([["new", 8]]) },
    prov: { total: 6, populated: 1, rate: 1 / 6, versions: new Map([["reader.v1", 1]]) },
  });
  assert.match(out, /severity coverage: 22 \/ 37 \(59\.5%\)/);
  assert.match(out, /substantive \(need a score\): 2/);
  assert.match(out, /023, 024/);
  assert.match(out, /controls \(intentionally unscored\): 3/);
  assert.match(out, /035, 036, 037/);
  assert.match(out, /provenance-populated: 1 \/ 6 \(16\.7%\)/);
  assert.match(out, /reader\.v1×1/);
});
