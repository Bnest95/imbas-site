// Upsert semantics the PDF path relies on. Passes against native methods or the polyfill.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import "../map-upsert-polyfill.js";

test("Map.getOrInsertComputed: inserts once, returns existing after", () => {
  const m = new Map(); let calls = 0;
  assert.equal(m.getOrInsertComputed("a", () => { calls++; return 1; }), 1);
  assert.equal(m.getOrInsertComputed("a", () => { calls++; return 2; }), 1);
  assert.equal(calls, 1);
});
test("Map.getOrInsertComputed: non-callable throws even when the key exists", () => {
  const m = new Map([["a", 1]]);
  assert.throws(() => m.getOrInsertComputed("a", 5), TypeError);
});
test("Map.getOrInsertComputed: callback receives the canonical key; -0 stored as +0", () => {
  const m = new Map(); let seen;
  m.getOrInsertComputed(-0, (k) => { seen = k; return "z"; });
  assert.ok(Object.is(seen, 0));
  assert.ok(Object.is([...m.keys()][0], 0));
});
test("Map.getOrInsert: inserts only when absent", () => {
  const m = new Map();
  assert.equal(m.getOrInsert("k", 1), 1);
  assert.equal(m.getOrInsert("k", 2), 1);
});
test("WeakMap: object keys work; primitive keys throw before the callback runs", () => {
  const w = new WeakMap(); const o = {}; let ran = false;
  assert.equal(w.getOrInsertComputed(o, () => 7), 7);
  assert.equal(w.getOrInsert(o, 8), 7);
  assert.throws(() => w.getOrInsertComputed("x", () => { ran = true; }), TypeError);
  assert.equal(ran, false);
  assert.throws(() => w.getOrInsert(1, 1), TypeError);
});
test("wrong receiver throws TypeError", () => {
  assert.throws(() => Map.prototype.getOrInsertComputed.call({}, "a", () => 1), TypeError);
});
test("worker imports the polyfill before pdf.js", () => {
  const src = readFileSync(new URL("../file-intake-worker.js", import.meta.url), "utf8");
  const p = src.indexOf('import "./map-upsert-polyfill.js"');
  const q = src.indexOf('from "./vendor/pdfjs/pdf.min.mjs"');
  assert.ok(p !== -1 && q !== -1 && p < q);
});

// The tests above may run against native methods on newer runtimes. These run the file
// in an isolated context where the natives are removed, so the fallback itself is tested.
import vm from "node:vm";
const POLYFILL_SRC = readFileSync(new URL("../map-upsert-polyfill.js", import.meta.url), "utf8");
function fallbackContext(prep = "") {
  const ctx = vm.createContext({});
  vm.runInContext(`
    for (const C of [Map, WeakMap]) { delete C.prototype.getOrInsertComputed; delete C.prototype.getOrInsert; }
    ${prep}`, ctx);
  vm.runInContext(POLYFILL_SRC, ctx);
  return ctx;
}

test("fallback: installed when natives are absent, and spec behaviour holds", () => {
  const out = vm.runInContext(`(() => {
    const r = {};
    r.installed = typeof Map.prototype.getOrInsertComputed === "function" && typeof WeakMap.prototype.getOrInsert === "function";
    const m = new Map([["a", 1]]); let calls = 0;
    r.existing = m.getOrInsertComputed("a", () => { calls++; return 2; });
    r.inserted = m.getOrInsertComputed("b", () => { calls++; return 3; });
    r.calls = calls;
    try { m.getOrInsertComputed("a", 5); r.nonCallable = "no throw"; } catch (e) { r.nonCallable = e instanceof TypeError; }
    let seen; new Map().getOrInsertComputed(-0, (k) => { seen = k; return 0; }); r.negZero = Object.is(seen, 0);
    const w = new WeakMap(); let ran = false;
    try { w.getOrInsertComputed("x", () => { ran = true; }); r.weakPrim = "no throw"; } catch (e) { r.weakPrim = e instanceof TypeError; }
    r.weakRan = ran;
    try { Map.prototype.getOrInsertComputed.call({}, "a", () => 1); r.receiver = "no throw"; } catch (e) { r.receiver = e instanceof TypeError; }
    r.enumerable = Object.keys(Map.prototype).includes("getOrInsertComputed");
    return JSON.stringify(r);
  })()`, fallbackContext());
  assert.deepEqual(JSON.parse(out), { installed: true, existing: 1, inserted: 3, calls: 1, nonCallable: true,
    negZero: true, weakPrim: true, weakRan: false, receiver: true, enumerable: false });
});

test("fallback: an existing native method is left untouched", () => {
  const ctx = fallbackContext(`
    globalThis.nativeLike = function getOrInsertComputed() { return "native"; };
    Object.defineProperty(Map.prototype, "getOrInsertComputed", { value: nativeLike, writable: true, configurable: true });`);
  const same = vm.runInContext(`Map.prototype.getOrInsertComputed === nativeLike && new Map().getOrInsertComputed(1, () => 2) === "native"`, ctx);
  assert.equal(same, true);
});
