// Guardrail: every capture records which renderer process drew it, and a renderer that
// crashes or is replaced mid-run leaves evidence behind.
// Run: node --test test/qa-renderer-identity.test.mjs
//
// The gap this closes: a board run drives one page through 62 navigations in one renderer
// process, and the page session survives that process being replaced — same target, same
// websocket, same CDP client, different renderer. Nothing in a captured PNG says which
// process drew it, so before this the harness could not tell a stable run from one that
// swapped renderers halfway through. A frame that differed afterwards was unattributable
// in both directions: nothing confirmed a replacement and nothing ruled one out. That is
// the state the 2026-08-10 curated-readout--mobile event was observed in.
//
// What is under test is the instrument, not the flicker. Recording a pid explains no
// difference and excuses none; a differing frame still fails the run. These tests prove
// the instrument reads, records, degrades honestly when it cannot read, and — the one
// that would otherwise break the board — that the pid never reaches a committed snapshot.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  RendererWatch,
  frameAttribution,
  persistRendererEvents,
  retainDifferingFrame,
  RENDERER_EVENTS_DIR,
  QUARANTINE_DIR,
} from "../scripts/qa/visual-acceptance.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const HARNESS = path.join(REPO_ROOT, "scripts/qa/visual-acceptance.mjs");

const bench = () => fs.mkdtempSync(path.join(os.tmpdir(), "imbas-rid-test-"));

// A CDP stand-in. The instrument is defined by the two calls it makes — a browser-domain
// pid query and a page-session crash subscription — so a fake that honours exactly those
// exercises it without launching a browser.
function fakeBrowser(readings) {
  const queue = [...readings];
  let last = readings.length ? readings[readings.length - 1] : [];
  return {
    calls: 0,
    closed: false,
    async send(method) {
      this.calls += 1;
      if (method !== "SystemInfo.getProcessInfo") throw new Error(`unexpected browser call ${method}`);
      const pids = queue.length ? queue.shift() : last;
      last = pids;
      if (pids instanceof Error) throw pids;
      return {
        processInfo: [
          { type: "browser", id: 1 },
          { type: "GPU", id: 2 },
          ...pids.map((id) => ({ type: "renderer", id })),
        ],
      };
    },
    close() {
      this.closed = true;
    },
  };
}

function fakePage() {
  return {
    handlers: new Map(),
    enabled: [],
    async send(method) {
      this.enabled.push(method);
      return {};
    },
    on(method, fn) {
      if (!this.handlers.has(method)) this.handlers.set(method, []);
      this.handlers.get(method).push(fn);
    },
    fire(method) {
      for (const fn of this.handlers.get(method) || []) fn({});
    },
  };
}

const attach = (readings) => {
  const page = fakePage();
  const browser = fakeBrowser(readings);
  return RendererWatch.attach({ page, connectBrowser: async () => browser }).then((watch) => ({
    watch,
    page,
    browser,
  }));
};

// ── The instrument reads ─────────────────────────────────────────────────────

test("attaching subscribes to the crash event and takes a first reading", async () => {
  const { watch, page } = await attach([[500]]);

  assert.equal(watch.armed, true, "the watch reported itself armed but took no usable reading");
  // Both halves matter. The pid query alone cannot see a crash, and the crash event alone
  // cannot see a replacement that happened without one.
  assert.ok(page.enabled.includes("Inspector.enable"), "Inspector was never enabled on the page session");
  assert.ok(page.handlers.has("Inspector.targetCrashed"), "no crash handler was registered");
  assert.deepEqual(watch.pidsSeen, [500]);
});

test("a watch that cannot read says so rather than reporting a stable renderer", async () => {
  // The failure mode this forbids: an instrument that returns nothing looks exactly like a
  // board that never lost a renderer. Silence and stability must not be the same value.
  const { watch } = await attach([new Error("SystemInfo is not available")]);

  assert.equal(watch.armed, false);
  assert.equal(watch.readFailures.length, 1);
  assert.match(watch.readFailures[0].why, /SystemInfo is not available/);
  assert.equal(watch.anomalous, true, "a failed reading is an anomaly, not a clean run");
});

test("a browser endpoint that will not open leaves the watch unarmed and the run alive", async () => {
  const watch = await RendererWatch.attach({
    page: fakePage(),
    connectBrowser: async () => {
      throw new Error("browser endpoint refused");
    },
  });

  assert.equal(watch.armed, false);
  assert.match(watch.readFailures[0].why, /browser endpoint refused/);
  // Instrumentation that can take the board down is worse than instrumentation that is
  // absent, so attach resolves rather than throwing.
  assert.deepEqual(await watch.sample("x"), { read: false, pids: null, why: "no browser endpoint" });
});

test("no renderer at all is a real reading, because between a crash and the next navigation there is none", async () => {
  const { watch } = await attach([[500], []]);
  const empty = await watch.sample("after-crash");

  assert.equal(empty.read, true, "an empty renderer list is a successful reading, not a failure");
  assert.deepEqual(empty.pids, []);
  assert.deepEqual(watch.readFailures, []);
});

// ── The instrument records what changed ──────────────────────────────────────

test("the pid list is a timeline: a replacement shows as a second pid", async () => {
  const { watch } = await attach([[500], [500], [], [501]]);
  await watch.sample("c1");
  await watch.sample("c2");
  await watch.sample("c3");

  assert.deepEqual(watch.pidsSeen, [500, 501], "first-sight order is what makes the list a timeline");
  assert.equal(watch.summary().replacements, 1);
  assert.equal(watch.anomalous, true);
});

test("a crash is recorded against the capture that was in flight", async () => {
  const { watch, page } = await attach([[500]]);
  watch.mark("curated-readout--mobile");
  watch.finishedCapture();
  watch.finishedCapture();
  page.fire("Inspector.targetCrashed");

  assert.equal(watch.crashes.length, 1);
  // "The renderer crashed at some point" is not attribution. Which capture held the page
  // when it happened is the fact that makes a later differing frame investigable.
  assert.equal(watch.crashes[0].during_capture, "curated-readout--mobile");
  assert.equal(watch.crashes[0].captures_completed_before, 2);
  assert.match(watch.crashes[0].at, /^\d{4}-\d{2}-\d{2}T/);
});

test("one renderer, no crash, every reading taken is not an anomaly", async () => {
  const { watch } = await attach([[500], [500], [500]]);
  await watch.sample("c1");
  await watch.sample("c2");

  assert.equal(watch.anomalous, false);
  assert.deepEqual(watch.summary().crashes, []);
  assert.equal(watch.summary().replacements, 0);
});

// ── Per-frame attribution ────────────────────────────────────────────────────

test("a frame is attributed only when one renderer held it from start to finish", () => {
  const a = frameAttribution({ read: true, pids: [500] }, { read: true, pids: [500] });
  assert.equal(a.pid, 500);
  assert.match(a.attribution, /one renderer, unchanged/);
});

test("a frame drawn across a renderer replacement is refused a single pid", () => {
  // The whole reason both ends are sampled. One reading cannot tell a stable renderer from
  // one swapped halfway through, and naming a pid for a frame that spans a replacement
  // would be a confident wrong answer — worse than the gap it replaced.
  const a = frameAttribution({ read: true, pids: [500] }, { read: true, pids: [501] });
  assert.equal(a.pid, null, "a frame spanning two processes must not be attributed to one");
  assert.equal(a.pid_before_capture, 500);
  assert.equal(a.pid_at_capture, 501);
  assert.match(a.attribution, /THE RENDERER CHANGED DURING THIS CAPTURE/);
});

test("an unread pid is reported as unrecorded, never as unchanged", () => {
  const a = frameAttribution({ read: true, pids: [500] }, { read: false, pids: null, why: "call timed out" });
  assert.equal(a.pid, null);
  assert.equal(a.attribution, "not recorded");
  assert.match(a.why, /timed out/);
});

// ── The pid never reaches a committed baseline ───────────────────────────────

test("renderer identity stays out of the snapshot environment block", () => {
  // A process ID differs on every run by construction. In `env` it would be serialized
  // into all 62 committed .snapshot.txt files and then fail its own comparison on the very
  // next run, permanently. Structural, because the mistake is one line and the cost of
  // catching it after 62 baselines move is a great deal higher than the cost of this test.
  const src = fs.readFileSync(HARNESS, "utf8");
  const start = src.indexOf("  const env = {");
  // The object literal itself, not the prose around it. The comment that follows this
  // block exists to explain why the pid is absent, and it names the pid to do so — a test
  // that swept the surrounding region would fail on its own explanation.
  const end = src.indexOf("\n  };", start);
  assert.ok(start > 0 && end > start, "the environment block is not where this test expects it");
  const envBlock = src.slice(start, end);
  assert.ok(envBlock.includes("browser_version"), "sliced the wrong block — no browser_version in it");

  for (const forbidden of ["renderer", "pid", "rendererWatch", "frameAttribution"]) {
    assert.ok(!envBlock.includes(forbidden), `the snapshot environment block carries ${forbidden}`);
  }
});

test("no committed baseline snapshot carries a renderer pid", () => {
  // The artifacts themselves, not just the code that writes them.
  const board = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");
  const snaps = fs.readdirSync(board).filter((f) => f.endsWith(".snapshot.txt"));
  assert.ok(snaps.length >= 62, `expected the full board, found ${snaps.length} snapshots`);
  for (const f of snaps) {
    const body = fs.readFileSync(path.join(board, f), "utf8");
    assert.ok(!/renderer_pid|renderer_process|\bpid\b/i.test(body), `${f} records a renderer pid`);
  }
});

// ── Retention ────────────────────────────────────────────────────────────────

test("a clean run writes no renderer-event file", () => {
  const root = bench();
  const watch = new RendererWatch();
  watch.armed = true;
  watch.pidsSeen = [500];

  assert.equal(persistRendererEvents(watch, { quarantineRoot: root, runId: "r1" }), null);
  // Not merely "an empty file": inventing a record for every uneventful run would bury the
  // runs that have one.
  assert.equal(fs.existsSync(path.join(root, "renderer-events")), false);
});

test("a crash is persisted even when every frame matched its baseline", () => {
  // The case that decides the design. A crash that costs the board its renderer and
  // changes no pixel is exactly the event that makes a LATER difference unattributable, so
  // it cannot be filed under a differing frame — on this run there is not one.
  const root = bench();
  const watch = new RendererWatch();
  watch.armed = true;
  // One pid and nothing else out of the ordinary, so the crash is the only thing that can
  // trigger the write. Setting a replacement here too would let this pass on a build that
  // ignored crashes entirely.
  watch.pidsSeen = [500];
  watch.crashes = [{ at: "2026-08-11T00:00:00.000Z", during_capture: "curated-readout--mobile", captures_completed_before: 39 }];

  const written = persistRendererEvents(watch, { quarantineRoot: root, runId: "r2" });
  assert.ok(written, "a crash was observed and nothing was written");

  const rec = JSON.parse(fs.readFileSync(written, "utf8"));
  assert.equal(rec.renderer.crashes[0].during_capture, "curated-readout--mobile");
  assert.equal(rec.renderer.crashes[0].captures_completed_before, 39);
  assert.deepEqual(rec.renderer.pids_seen, [500]);
  assert.equal(rec.renderer.replacements, 0);
  assert.equal(rec.run.id, "r2");
});

test("a replacement with no crash event is persisted too", () => {
  // A renderer can be replaced without crashing. Recording only crashes would leave that
  // path as invisible as the whole gap was.
  const root = bench();
  const watch = new RendererWatch();
  watch.armed = true;
  watch.pidsSeen = [500, 501];

  const written = persistRendererEvents(watch, { quarantineRoot: root, runId: "r3" });
  assert.ok(written, "the renderer changed and nothing was written");
  assert.deepEqual(JSON.parse(fs.readFileSync(written, "utf8")).renderer.crashes, []);
});

test("a failed pid reading is persisted, because an unread pid is not a stable pid", () => {
  const root = bench();
  const watch = new RendererWatch();
  watch.readFailures = [{ at: "2026-08-11T00:00:00.000Z", during_capture: "share-consent--desktop", why: "timed out" }];

  const written = persistRendererEvents(watch, { quarantineRoot: root, runId: "r4" });
  assert.ok(written, "the instrument failed to read and nothing was written");
  assert.equal(JSON.parse(fs.readFileSync(written, "utf8")).renderer.read_failures[0].why, "timed out");
});

test("the record authorizes nothing", () => {
  const root = bench();
  const watch = new RendererWatch();
  watch.crashes = [{ at: "2026-08-11T00:00:00.000Z", during_capture: "x", captures_completed_before: 0 }];
  const rec = JSON.parse(fs.readFileSync(persistRendererEvents(watch, { quarantineRoot: root, runId: "r5" }), "utf8"));

  // Recording a pid explains no difference and excuses none. The file says so in its own
  // text, so a reader who finds it cannot mistake it for a tolerance.
  assert.match(rec.custody, /a differing frame still fails the run/);
  assert.match(rec.what, /Written only when/);
});

// ── The sidecar ──────────────────────────────────────────────────────────────

test("the retention sidecar names the renderer that drew the differing frame", () => {
  const root = bench();
  const kept = retainDifferingFrame({
    scenarioId: "curated-readout--mobile",
    candidateBuf: Buffer.from("candidate bytes"),
    baselineBuf: Buffer.from("baseline bytes"),
    baselinePath: path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness/curated-readout--mobile.png"),
    quarantineRoot: root,
    runId: "r6",
    renderer: frameAttribution({ read: true, pids: [500] }, { read: true, pids: [500] }),
    rendererRun: { recorded: true, pids_seen: [500], replacements: 0, crashes: [], read_failures: [] },
  });

  const car = JSON.parse(fs.readFileSync(kept.sidecarPath, "utf8"));
  assert.equal(car.renderer.frame.pid, 500);
  // The run-level view is what separates "this frame differs" from "this frame differs and
  // a different process drew it than drew the baseline".
  assert.deepEqual(car.renderer.run.pids_seen, [500]);
  assert.equal(car.renderer.run.replacements, 0);
});

test("a sidecar written without renderer identity says so instead of implying one", () => {
  const root = bench();
  const kept = retainDifferingFrame({
    scenarioId: "curated-readout--mobile",
    candidateBuf: Buffer.from("candidate bytes"),
    baselineBuf: Buffer.from("baseline bytes"),
    baselinePath: path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness/curated-readout--mobile.png"),
    quarantineRoot: root,
    runId: "r7",
  });

  const car = JSON.parse(fs.readFileSync(kept.sidecarPath, "utf8"));
  assert.equal(car.renderer.frame.attribution, "not recorded");
  assert.equal(car.renderer.run.recorded, false);
});

// ── Custody ──────────────────────────────────────────────────────────────────

test("renderer events are git-ignored, so evidence never becomes a commit", () => {
  const probe = path.join(RENDERER_EVENTS_DIR, "2026-08-11T00-00-00-000Z-abcd1234.json");
  const r = spawnSync("git", ["check-ignore", "-q", "--no-index", probe], { cwd: REPO_ROOT });
  assert.equal(r.status, 0, `${path.relative(REPO_ROOT, probe)} is not covered by .gitignore`);
});

test("renderer events sit in quarantine, outside the committed board", () => {
  const board = path.join(REPO_ROOT, "docs/qa/visual-acceptance-harness");
  assert.equal(RENDERER_EVENTS_DIR.startsWith(board), false);
  assert.equal(RENDERER_EVENTS_DIR.startsWith(QUARANTINE_DIR), true);
  assert.equal(path.relative(REPO_ROOT, RENDERER_EVENTS_DIR), ".qa-quarantine/renderer-events");
});

// ── No fix rode in behind the instrument ─────────────────────────────────────

test("the harness gained no prewarm, retry, tolerance or renderer-conditional behaviour", () => {
  // This lane instruments and nothing else. A recorded pid must never become an input to
  // whether a frame passes — that would convert an instrument into the tolerance the
  // byte-exact comparison law forbids.
  const src = fs.readFileSync(HARNESS, "utf8");
  for (const forbidden of ["prewarm", "preWarm", "warmup", "warmUp", "retryCapture", "recapture"]) {
    assert.ok(!src.includes(forbidden), `the harness gained ${forbidden}`);
  }

  // Structural, against the comparator specifically: the verdict is byte identity, and no
  // renderer reading may be read anywhere near it.
  const start = src.indexOf("export function runDiff(");
  const end = src.indexOf("\nexport function renderComparisonPolicySection(");
  assert.ok(start > 0 && end > start, "runDiff is not where this test expects it");
  const body = src.slice(start, end);
  for (const conditional of ["if (r.renderer.pid", "renderer.pid ===", "pidsSeen.length >", "crashes.length >"]) {
    assert.ok(!body.includes(conditional), `the comparator branches on renderer state via ${conditional}`);
  }
});
