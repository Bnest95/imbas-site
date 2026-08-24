// Does the Input Integrity path run, in the governed renderer, under the production CSP?
//
//   node scripts/qa/input-integrity-path.mjs
//   node scripts/qa/input-integrity-path.mjs --json
//
// READ-ONLY of the repository. It photographs nothing, reads no baseline, writes no
// artifact under version control, and accepts nothing. It writes exactly one thing: the
// browser's own download of the evidence receipt, into a temporary directory it removes.
// Exit 0 means every check held; exit 1 names which did not.
//
// ── What this covers that the Node tests do not ──────────────────────────────────────
// test/file-intake-*.test.mjs drive the parser and the detectors under node. test/
// file-surface.test.mjs drives the view model over the same fixtures. None of them can
// prove the seams between those modules and a person:
//
//   · that a same-origin MODULE WORKER starts at all under `default-src 'self'` with no
//     `worker-src` and no `blob:` anywhere in the policy;
//   · that pdf.js 6.2.108, which reaches for `window.location` on construction, falls
//     through to its dynamic-import path inside that worker rather than throwing;
//   · that OffscreenCanvas draws a page in a worker with no `document.fonts` to await;
//   · that an ImageBitmap survives the structured-clone transfer to the main thread;
//   · that a File chosen through the real <input type="file"> reaches the real change
//     listener and comes out the other side as rendered sentences;
//   · that the export anchor's blob: URL is not refused by that same policy;
//   · and that across all of it, nothing carrying file bytes goes to the network.
//
// Every one of those is a seam, and a seam is exactly what a module test cannot reach.
//
// ── Why the production CSP is served here and nowhere else ───────────────────────────
// The static server in visual-acceptance.mjs sends content-type and cache-control and
// nothing else, because the board measures pixels and a header moves none. This receipt
// measures whether the path RUNS, and the policy is the largest thing that could stop it.
// So the document response is fulfilled with the exact header vercel.json applies to
// every route but /reader.html, copied verbatim below and asserted against the file at
// startup — if vercel.json changes and this string does not, the run stops rather than
// reporting a receipt against a policy the site no longer ships.
//
// ── Why the assertions are structural ────────────────────────────────────────────────
// This reports what is in the tree: which elements exist, what their text is, which
// attributes they carry, what the network saw. It makes no claim that any of it was
// understood, noticed, or found useful by anybody. Those are questions for a person, and
// an instrument that answered them would be inventing its evidence.

import {
  CDP,
  VIEWPORTS,
  evaluate,
  launchBrowser,
  resolveBrowser,
  startStaticServer,
  waitUntil,
} from "./visual-acceptance.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const AS_JSON = process.argv.includes("--json");
const log = (s = "") => process.stdout.write(`${s}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ROUTE = "/input-integrity.html";
const VIEWPORT_NAME = "desktop";

// The catch-all policy from vercel.json, verbatim. Asserted against the file below.
const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' " +
  "https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; " +
  "connect-src 'self' https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; " +
  "form-action 'self'";

// ── What a person is expected to read ────────────────────────────────────────────────
// Written out here rather than imported from file-surface-copy.js. A receipt that read
// the registry would prove the product agrees with itself and would go on passing through
// a copy change nobody approved. These four are the lane's load-bearing sentences: the
// boundary, the custody claim, the epistemic line, and the refusal.
const BOUNDARY_STATEMENT = "This reads the file's own structure and reports what it instructs.";
const BOUNDARY_DENIALS =
  "It does not scan for viruses, audit security, or make any claim about the file's safety. " +
  "It reaches no verdict on the document or its author.";
const CUSTODY = "Your browser reads the file. The file does not leave this machine.";
const ESTABLISHES_BODY =
  "This run establishes what the local parser recovered from the file's structure, and what the local " +
  "renderer draws. It does not establish what any AI system, pipeline, or person received from this file.";
const REFUSAL_FOR_TXT = "PDF only. not-a-pdf.txt was not read.";

// Strings that would put this surface outside what it measures. Asserted absent from the
// whole rendered document, in every state the run visits.
const FORBIDDEN_SUBSTRINGS = [
  "what the AI saw",
  "what the machine received",
  "what the model saw",
  "the AI saw",
  "hidden from you",
  "malicious",
  "safe",
  "virus-free",
  "clean",
];

// ── The files this run puts in front of the surface ──────────────────────────────────
// f01 is the vendored sample's own bytes (identical sha256), chosen for the same reason
// the sample was: one governed phenomenon, one page, and a rendered-versus-structure
// contrast a person can read in a glance. large_synthetic exercises a many-item result.
const PDF_FIXTURE = path.join(REPO_ROOT, "test/fixtures/file-intake/f01_rendermode3.pdf");
const MULTI_FIXTURE = path.join(REPO_ROOT, "test/fixtures/file-intake/f09_metadata_text.pdf");

// Every endpoint this route is allowed to touch, as method plus path. Pinned so that a
// request added later has to be read by a person rather than inherited: the custody
// search below can only find leaks of a file it already knows about, and this catches
// the request it does not. The typeface stylesheet is the single off-origin entry, it is
// denied by the harness, and it carries no content either way.
const EXPECTED_REQUEST_INVENTORY = [
  "GET /brand-mark-header.png",
  "GET /file-detectors.js",
  "GET /file-graphics-walker.js",
  "GET /file-intake-pdfjs.js",
  "GET /file-intake-worker.js",
  "GET /file-result.js",
  "GET /file-surface-copy.js",
  "GET /file-templates.js",
  "GET /file-view.js",
  "GET /input-integrity.css",
  "GET /input-integrity.html",
  "GET /input-integrity.js",
  "GET /site-header.js",
  "GET /styles.css",
  // pdf.js in fake-worker mode: the module worker imports the library, which then pulls
  // its own worker bundle in-process. Both are same-origin static files.
  "GET /vendor/pdfjs/pdf.min.mjs",
  "GET /vendor/pdfjs/pdf.worker.min.mjs",
  // The one off-origin request on the route, and it is denied. Listed rather than hidden:
  // claiming the page never reaches off-origin would be false.
  "GET https://fonts.googleapis.com/css2",
];

// ── In-page reader ───────────────────────────────────────────────────────────────────
// Installed at document start. It reads the rendered tree and reports structure. It calls
// nothing in the product: every state change in this run comes from a real file landing
// in a real <input>, or a real click.
//
// The region timeline is the only way to establish the processing state honestly. It is
// transient by design — the worker answers a 650-byte file in a few frames — so a poll
// that looked for it would usually miss it and would then have to report either a lie or
// a flake. A MutationObserver armed before the document runs records every transition of
// the two region's `hidden` attributes, so the run reports the sequence that actually
// happened rather than the one it managed to catch.
//
// ── WHY EVERY TRANSITION CARRIES A MEASUREMENT ───────────────────────────────────────
// `hidden` is an intent, and an author `display` outranks the user agent rule that carries
// it out. A region can therefore hold the attribute correctly and stay on screen, which is
// what .ii-processing did: hidden in all three states and painted at 824x29 in all three,
// asserting a read in progress before any file was chosen and above a finished result. No
// assertion about the attribute could see that, so every entry records what the renderer
// computed and what it painted, taken at the transition rather than polled for.
const READER_SCRIPT = `
(() => {
  const timeline = [];
  window.__iiTimeline = timeline;

  const rendered = (node) => {
    const cs = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    return {
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      width: Math.round(r.width),
      height: Math.round(r.height),
      painted: cs.display !== "none" && cs.visibility !== "hidden"
        && Number(cs.opacity) > 0 && r.width > 0 && r.height > 0,
    };
  };
  window.__iiRendered = rendered;

  const note = (id, node) => {
    const hidden = node.hidden;
    const last = timeline[timeline.length - 1];
    if (last && last.id === id && last.hidden === hidden) return;
    timeline.push({ id, hidden, ...rendered(node), t: Math.round(performance.now()) });
  };

  const arm = () => {
    for (const id of ["processing", "result"]) {
      const node = document.getElementById(id);
      if (!node) continue;
      note(id, node);
      new MutationObserver(() => note(id, node)).observe(node, {
        attributes: true, attributeFilter: ["hidden"],
      });
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm);
  else arm();

  const text = (el) => (el ? el.textContent : null);
  const all = (sel, root) => [...(root || document).querySelectorAll(sel)];

  window.__ii = {
    timeline: () => timeline.slice(),

    // One region, measured now rather than at a transition.
    rendered(id) {
      const node = document.getElementById(id);
      return node ? { hidden: node.hidden, ...rendered(node) } : null;
    },

    // Every region this surface hides, and which of them the renderer painted anyway.
    // The answer must always be the empty list, in every state the run visits.
    paintedWhileHidden() {
      return ["processing", "result", "intake-refusal"]
        .map((id) => document.getElementById(id))
        .filter((node) => node && node.hidden && rendered(node).painted)
        .map((node) => node.id);
    },

    // Before anything is chosen.
    initial() {
      return {
        route: location.pathname,
        processing_hidden: document.getElementById("processing").hidden,
        result_hidden: document.getElementById("result").hidden,
        result_children: document.getElementById("result").childElementCount,
        dropzone: !!document.getElementById("dropzone"),
        file_input_accept: document.getElementById("file-input").getAttribute("accept"),
        choose_label: text(document.querySelector("#choose")),
        prompt: text(document.querySelector(".ii-drop__prompt")),
        limit: text(document.querySelector(".ii-drop__limit")),
        custody: text(document.querySelector(".ii-intake__custody")),
        boundary: all(".ii-boundary p").map(text),
        sample_action: text(document.querySelector("#sample")),
        sample_note: text(document.querySelector(".ii-sample__note")),
        refusal_hidden: document.getElementById("intake-refusal").hidden,
        controller_installed: !!window.__inputIntegrity,
      };
    },

    refusal() {
      const el = document.getElementById("intake-refusal");
      return { hidden: el.hidden, text: text(el), role: el.getAttribute("role") };
    },

    resultPresent() {
      return !document.getElementById("result").hidden
        && !!document.querySelector(".ii-result__header");
    },

    // Everything the result is showing, read off the tree.
    result() {
      const root = document.getElementById("result");
      const items = all(".ii-item").map((a) => {
        const disclosures = all("details.ii-disclosure", a);
        return {
          anchor: a.id,
          lead: text(a.querySelector(".ii-item__lead")),
          statements: all(".ii-item__statements li", a).map(text),
          locator: text(a.querySelector(".ii-item__locator")),
          locator_parts: all(".ii-item__locator-part", a).map(text),
          has_contrast: !!a.querySelector(".ii-contrast"),
          contrast_labels: all(".ii-contrast__label", a).map(text),
          contrast_note: text(a.querySelector(".ii-contrast__note")),
          contrast_span: text(a.querySelector(".ii-contrast__span")),
          contrast_canvas: (() => {
            const c = a.querySelector(".ii-contrast__canvas");
            return c ? { width: c.width, height: c.height } : null;
          })(),
          evidence_open: disclosures.length ? disclosures[0].open : null,
          evidence_terms: all("details.ii-disclosure .ii-def__term", a).map(text),
          evidence_class: (() => {
            const terms = all("details.ii-disclosure .ii-def", a);
            for (const row of terms) {
              if (text(row.querySelector(".ii-def__term")) === "Phenomenon class") {
                return text(row.querySelector(".ii-def__value"));
              }
            }
            return null;
          })(),
          back_href: a.querySelector(".ii-item__back")?.getAttribute("href") ?? null,
        };
      });

      return {
        file_name: text(root.querySelector(".ii-result__file")),
        file_size: text(root.querySelector(".ii-result__size")),
        coverage_label: text(root.querySelector(".ii-coverage__label")),
        coverage_statement: text(root.querySelector(".ii-coverage__statement")),
        coverage_pages: all(".ii-coverage__page", root).map(text),
        establishes_label: text(root.querySelector(".ii-establishes__label")),
        establishes_body: text(root.querySelector(".ii-establishes__body")),
        summary_heading: text(root.querySelector(".ii-summary__heading")),
        summary_count: text(root.querySelector(".ii-summary__count")),
        summary_links: all(".ii-summary__link", root).map((a) => ({
          text: text(a), href: a.getAttribute("href"),
        })),
        summary_where: all(".ii-summary__where", root).map(text),
        zero_statement: text(root.querySelector(".ii-zero__statement")),
        zero_scope: text(root.querySelector(".ii-zero__scope")),
        groups: all(".ii-group", root).map((g) => ({
          heading: text(g.querySelector(".ii-group__heading")),
          note: text(g.querySelector(".ii-group__note")),
          item_count: g.querySelectorAll(".ii-item").length,
        })),
        items,
        provenance: (() => {
          const d = root.querySelector(".ii-disclosure--provenance");
          if (!d) return null;
          return {
            open: d.open,
            summary: text(d.querySelector(".ii-disclosure__summary")),
            statement: text(d.querySelector(".ii-provenance__statement")),
            rows: all(".ii-def", d).map((r) => [
              text(r.querySelector(".ii-def__term")), text(r.querySelector(".ii-def__value")),
            ]),
            custody: text(d.querySelector(".ii-provenance__custody")),
          };
        })(),
        export_action: text(root.querySelector(".ii-export__action")),
        export_note: text(root.querySelector(".ii-export__note")),
      };
    },

    documentText() { return document.body.innerText; },

    click(selector, index) {
      const nodes = all(selector);
      const node = index === undefined ? nodes[0] : nodes[index];
      if (!node) return { ok: false, why: "no node for " + selector };
      node.click();
      return { ok: true, text: text(node) };
    },

    hash() { return location.hash; },

    // Which element the fragment currently addresses, and whether it is an item.
    fragmentTarget() {
      const id = location.hash.slice(1);
      if (!id) return null;
      const el = document.getElementById(id);
      if (!el) return { id, exists: false };
      return { id, exists: true, tag: el.tagName.toLowerCase(), classes: [...el.classList] };
    },

    openDisclosure(selector, index) {
      const nodes = all(selector);
      const node = index === undefined ? nodes[0] : nodes[index];
      if (!node) return { ok: false, why: "no disclosure for " + selector };
      node.querySelector("summary").click();
      return { ok: true, open: node.open };
    },

    // The view the controller is holding, so the receipt can name the phenomenon classes
    // the parser reported alongside the sentences the surface rendered.
    view() {
      const v = window.__inputIntegrity && window.__inputIntegrity.view;
      if (!v) return null;
      return {
        state: v.state,
        file_name: v.file_name ?? null,
        byte_size: v.byte_size ?? null,
        classes: (v.items || []).map((i) => i.class_label),
        anchors: (v.items || []).map((i) => i.anchor),
        coverage: v.coverage ?? null,
        identity: v.identity ?? null,
      };
    },
  };
})();
`;

// ── Checks ───────────────────────────────────────────────────────────────────────────
const checks = [];
function check(phase, claim, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ phase, claim, ok, actual, expected });
  return ok;
}

// ── The custody witnesses ────────────────────────────────────────────────────────────
//
// "The file never leaves the machine" is the whole promise of this surface, so it is
// proved by looking for the file rather than by trusting that nothing was sent.
//
// A witness is a string that CANNOT appear in an outbound request unless content left.
// Four kinds, because there are four honest ways bytes could ride out:
//
//   raw        — windows of the file's own bytes, for a request that carries them plainly.
//   encoded    — base64 (all three alignments), base64url, and hex of the whole file, so
//                a re-encoding is caught at whatever offset it starts.
//   extracted  — the sentinel strings the parser actually recovers from these fixtures,
//                read from ground_truth.json rather than restated here. This is the layer
//                that matters most: a leak of the EXTRACTED text is still a leak, and it
//                would not contain a single byte of the original file.
//   derived    — the sha256. The receipt is allowed to state it; the network is not. A
//                hash is derived content, and "we only sent a fingerprint" is exactly the
//                claim this check exists to refuse.
//
// Degenerate windows are dropped. A run of identical bytes could collide with padding
// somewhere and would turn a custody failure into a coin flip.
function buildWitnesses(fixturePaths) {
  const groundTruth = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "test/fixtures/file-intake/ground_truth.json"), "utf8"),
  );
  const witnesses = [];
  const add = (kind, fixture, value) => {
    if (value && value.length >= 16) witnesses.push({ kind, fixture, value });
  };

  for (const p of fixturePaths) {
    const name = path.basename(p);
    const bytes = fs.readFileSync(p);
    const latin1 = bytes.toString("latin1");

    // raw: eight evenly spaced 24-byte windows.
    const WINDOW = 24;
    for (let i = 0; i < 8; i += 1) {
      const at = Math.floor((bytes.length - WINDOW) * (i / 8));
      const slice = latin1.slice(at, at + WINDOW);
      if (new Set(slice).size >= 8) add("raw", name, slice);
    }

    // encoded: a 40-char core of each encoding, taken from the middle so a header or a
    // trailer common to every PDF cannot be what matches.
    const core = (s) => s.slice(Math.floor(s.length / 2), Math.floor(s.length / 2) + 40);
    for (let phase = 0; phase < 3; phase += 1) {
      add("encoded", name, core(bytes.subarray(phase).toString("base64")));
    }
    add("encoded", name, core(bytes.toString("base64url")));
    add("encoded", name, core(bytes.toString("hex")));

    // derived: the fingerprint the receipt is allowed to show and the wire is not.
    add("derived", name, crypto.createHash("sha256").update(bytes).digest("hex"));

    // extracted: what the parser recovers, per the fixture corpus's own record.
    const key = name.replace(/\.pdf$/, "");
    const truth = groundTruth[key];
    if (truth) {
      const strings = [];
      for (const t of truth.texts || []) if (t.str) strings.push(t.str);
      for (const v of Object.values(truth.info || {})) if (typeof v === "string") strings.push(v);
      for (const v of truth.xmp_contains || []) strings.push(v);
      for (const a of truth.attachments || []) if (a.content) strings.push(a.content);
      // Sentinels are short by design, so they are added without the length floor the
      // other kinds use. They are unique tokens; a coincidental match is not a thing.
      for (const s of strings) witnesses.push({ kind: "extracted", fixture: name, value: s });
    }
  }
  return witnesses;
}

// Everything about one request that a witness could hide in, flattened. Percent-decoded
// as well as raw, because a query string is the most natural place to smuggle bytes and
// it would be encoded on the way in.
function wireText(r) {
  const parts = [
    r.method || "",
    r.url || "",
    r.url_fragment || "",
    ...Object.entries(r.headers || {}).flatMap(([k, v]) => [k, String(v)]),
    r.body || "",
  ];
  const joined = parts.join("\n");
  let decoded = "";
  try {
    decoded = decodeURIComponent(joined.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"));
  } catch {
    decoded = "";
  }
  return `${joined}\n${decoded}`;
}

// ── Interception ─────────────────────────────────────────────────────────────────────
// Deny-by-default, like the board's. Two differences, both deliberate:
//   · the document response is fulfilled with the production headers, so the policy the
//     site ships is the policy the path runs under here;
//   · every paused request is recorded WHOLE — method, full URL including query and
//     fragment, every header, and the body — because the no-transmission claim is about
//     content and content can ride in any of those, not only in a body.
async function installPolicyInterception(cdp, { origin, requests, blocked }) {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Log.enable");
  await cdp.send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });

  cdp.on("Fetch.requestPaused", async (params) => {
    const { requestId, request } = params;
    const body = request.postData ? request.postData.length : 0;
    requests.push({
      url: request.url,
      // CDP reports a fragment separately when one is present; it is part of the URL a
      // leak could use, so it is kept rather than dropped.
      url_fragment: request.urlFragment || "",
      method: request.method,
      headers: request.headers || {},
      body: request.postData || "",
      body_bytes: body,
    });

    try {
      if (request.url === `${origin}${ROUTE}`) {
        const html = fs.readFileSync(path.join(REPO_ROOT, ROUTE.slice(1)));
        await cdp.send("Fetch.fulfillRequest", {
          requestId,
          responseCode: 200,
          responseHeaders: [
            { name: "content-type", value: "text/html; charset=utf-8" },
            { name: "content-security-policy", value: PRODUCTION_CSP },
            { name: "x-content-type-options", value: "nosniff" },
            { name: "cache-control", value: "no-store" },
          ],
          body: html.toString("base64"),
        });
        return;
      }
      if (request.url.startsWith(origin)) {
        await cdp.send("Fetch.continueRequest", { requestId });
        return;
      }
      blocked.push(request.url);
      await cdp.send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" });
    } catch (e) {
      try {
        await cdp.send("Fetch.failRequest", { requestId, errorReason: "Failed" });
      } catch {
        /* request already gone */
      }
      log(`    interception error for ${request.url}: ${e.message}`);
    }
  });
}

// Put a real file into the real <input type="file">, the way the file picker does.
async function chooseFile(cdp, absPath) {
  const { result } = await cdp.send("Runtime.evaluate", {
    expression: `document.getElementById("file-input")`,
  });
  await cdp.send("DOM.setFileInputFiles", { files: [absPath], objectId: result.objectId });
  await cdp.send("Runtime.releaseObject", { objectId: result.objectId }).catch(() => {});
}

// Wait for the browser to finish writing a download into `dir`, and return its bytes.
async function awaitDownload(dir, timeout = 15000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const names = fs.readdirSync(dir).filter((n) => !n.endsWith(".crdownload"));
    if (names.length > 0) {
      const file = path.join(dir, names[0]);
      const bytes = fs.readFileSync(file);
      if (bytes.length > 0) return { name: names[0], bytes };
    }
    await sleep(100);
  }
  return null;
}

// ── One pass over one file ───────────────────────────────────────────────────────────
async function inspectFile(cdp, { phase, fixture, expectContrast }) {
  // Where this pass starts in the observer's record, so the transitions reported below
  // are the ones this file caused rather than everything the page has ever done.
  const mark = await evaluate(cdp, "__ii.timeline().length");
  const before = await evaluate(cdp, "document.getElementById('processing').hidden");

  await chooseFile(cdp, fixture);
  await waitUntil(cdp, "__ii.resultPresent()", { label: `${phase}: a result rendered`, timeout: 30000 });

  // The page draw is a second round trip to the worker: the result renders first and the
  // ImageBitmap arrives after. Waiting on the slots rather than on the canvases means a
  // page the renderer refused settles this wait too, through its own honest note.
  if (expectContrast) {
    await waitUntil(
      cdp,
      "[...document.querySelectorAll('.ii-contrast__slot')].every((s) => s.childElementCount > 0)",
      { label: `${phase}: every contrast slot settled`, timeout: 30000 },
    );
  }

  const timeline = (await evaluate(cdp, "__ii.timeline()")).slice(mark);
  const result = await evaluate(cdp, "__ii.result()");
  const view = await evaluate(cdp, "__ii.view()");

  // The processing state must have been shown, and must be gone by the time the result
  // stands. Read off the observer's record, not off a poll: a 650-byte file is answered
  // in a few frames and a poll would usually miss the state entirely.
  const processing = timeline.filter((t) => t.id === "processing").map((t) => t.hidden);
  check(phase, "no processing state stood before this file was chosen", before, true);
  check(phase, "the local-processing state was shown, then withdrawn", processing, [false, true]);

  // The same two transitions, read as pixels rather than as an attribute. This is the
  // half that can catch a stylesheet outranking `hidden`: the sequence above holds
  // whether or not the region ever left the screen.
  check(phase, "it was painted while it stood, and unpainted once withdrawn",
    timeline.filter((t) => t.id === "processing").map((t) => t.painted), [true, false]);
  check(phase, "no region the surface hides is painted beside the result",
    await evaluate(cdp, "__ii.paintedWhileHidden()"), []);

  const name = path.basename(fixture);
  check(phase, "the file's own name heads the result", result.file_name, name);
  check(phase, "the controller holds a read state for that file", [view.state, view.file_name], ["read", name]);
  check(phase, "the byte count in the header is the file's own", result.file_size,
    `${fs.statSync(fixture).size} bytes`);
  check(phase, "the epistemic line stands on the result", result.establishes_body, ESTABLISHES_BODY);

  // Every item the view holds reached the tree, with its anchor intact.
  check(phase, "every phenomenon the parser reported has a rendered item",
    result.items.map((i) => i.anchor), view.anchors);
  check(phase, "every item leads with a sentence, not a class label",
    result.items.every((i) => typeof i.lead === "string" && i.lead.length > 0 && !view.classes.includes(i.lead)),
    true);
  check(phase, "every item states where it is", result.items.every((i) => i.locator_parts.length > 0), true);
  check(phase, "every item carries a link back to the summary",
    result.items.every((i) => i.back_href === "#result-summary"), true);
  check(phase, "the summary lists exactly the items rendered",
    result.summary_links.map((l) => l.href.slice(1)), view.anchors);

  check(phase, "a two-reading contrast is present exactly where the substrate supports one",
    result.items.some((i) => i.has_contrast), expectContrast);

  if (expectContrast) {
    const withContrast = result.items.filter((i) => i.has_contrast);
    check(phase, "the drawn half is labelled as a rendering, not as what anyone saw",
      [...new Set(withContrast.map((i) => i.contrast_labels[0]))], ["Rendered page"]);
    check(phase, "the structural half names the file's structure",
      [...new Set(withContrast.map((i) => i.contrast_labels[1]))], ["In the file's structure"]);
    check(phase, "the drawn half names the renderer that drew it",
      withContrast.every((i) => /^Drawn here by pdfjs-dist 6\.2\.108\.$/.test(i.contrast_note)), true);
    check(phase, "a page was actually drawn into the contrast, in a worker, on an OffscreenCanvas",
      withContrast.every((i) => i.contrast_canvas && i.contrast_canvas.width > 0 && i.contrast_canvas.height > 0),
      true);
  }

  return { timeline, result, view };
}

// ── Run ──────────────────────────────────────────────────────────────────────────────
async function main() {
  // The policy this run serves must be the policy the site ships.
  const vercel = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "vercel.json"), "utf8"));
  const catchAll = vercel.headers.find((h) => h.source !== "/reader.html");
  const shipped = catchAll?.headers.find((h) => h.key === "Content-Security-Policy")?.value;
  if (shipped !== PRODUCTION_CSP) {
    throw new Error(
      "vercel.json's catch-all Content-Security-Policy is not the string this receipt serves.\n" +
        `  vercel.json: ${shipped}\n  this file:   ${PRODUCTION_CSP}`,
    );
  }

  const renderer = resolveBrowser();
  const vp = VIEWPORTS[VIEWPORT_NAME];
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), "ii-receipt-"));

  const { server, port } = await startStaticServer(REPO_ROOT);
  const origin = `http://127.0.0.1:${port}`;

  // Layer two of the no-transmission claim, and the one that reaches the worker. Fetch
  // interception is installed on the page session; a dedicated worker's requests may not
  // pause there. Every request that reaches the local origin reaches THIS handler,
  // whoever issued it, so the method and body of worker traffic are recorded here.
  // The body is drained rather than assumed from content-length: a chunked upload sets
  // no content-length at all, so trusting the header would let the one shape that most
  // looks like an upload report zero bytes. Listening does not consume the stream the
  // static server later reads, because 'data' here only fires if something else resumes
  // it; the static handler serves GETs and never reads a request body, so in practice
  // this records the bytes that a POST would have carried.
  const served = [];
  server.on("request", (req) => {
    const record = {
      method: req.method,
      url: req.url,
      headers: { ...req.headers },
      body: "",
      body_bytes: Number(req.headers["content-length"] || 0),
    };
    req.on("data", (chunk) => {
      record.body += chunk.toString("latin1");
      record.body_bytes = record.body.length;
    });
    served.push(record);
  });

  const { proc, port: cdpPort } = await launchBrowser(renderer.binary);
  const versionInfo = await (await fetch(`http://127.0.0.1:${cdpPort}/json/version`)).json();
  const version = versionInfo.Browser || "unknown";
  if (version !== `HeadlessChrome/${renderer.browserVersion}`) {
    proc.kill("SIGKILL");
    server.close();
    throw new Error(`Renderer identifies as "${version}", not the governed HeadlessChrome/${renderer.browserVersion}.`);
  }

  const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
  const cdp = await CDP.connect(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  const browserCdp = await CDP.connect(versionInfo.webSocketDebuggerUrl);

  const requests = [];
  const blocked = [];
  const consoleErrors = [];
  const results = {};

  try {
    await installPolicyInterception(cdp, { origin, requests, blocked });
    await cdp.send("DOM.enable");

    // A CSP refusal arrives as a Log entry, not as a console API call. Both are kept:
    // a security violation and a thrown exception are the two ways this path can fail
    // silently, and either would otherwise show up only as a timeout.
    cdp.on("Log.entryAdded", ({ entry }) => {
      if (entry.level === "error") consoleErrors.push({ source: entry.source, text: entry.text, url: entry.url });
    });
    cdp.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
      consoleErrors.push({
        source: "exception",
        text: exceptionDetails.exception?.description || exceptionDetails.text,
        url: exceptionDetails.url,
      });
    });

    await browserCdp.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadDir,
      eventsEnabled: true,
    });

    await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: READER_SCRIPT });
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: vp.width, height: vp.height, deviceScaleFactor: vp.dsf, mobile: vp.mobile,
    });

    // ── Phase 1: the surface before a file ───────────────────────────────────────────
    await cdp.send("Page.navigate", { url: `${origin}${ROUTE}` });
    await waitUntil(cdp, "document.readyState === 'complete'", { label: "document ready" });
    await waitUntil(cdp, "!!window.__inputIntegrity", { label: "the controller initialised" });

    const initial = await evaluate(cdp, "__ii.initial()");
    results.initial = initial;

    check("initial", "the surface is its own route", initial.route, ROUTE);
    check("initial", "no result stands before a file is chosen",
      [initial.result_hidden, initial.result_children], [true, 0]);
    check("initial", "no processing indicator stands either", initial.processing_hidden, true);

    // Not "carries the attribute" — is not on screen. A reader arriving at this route must
    // not be told a file is being read before they have chosen one.
    const idleProcessing = await evaluate(cdp, "__ii.rendered('processing')");
    results.initial_processing = idleProcessing;
    check("initial", "and the processing indicator is not painted, not merely marked hidden",
      [idleProcessing.painted, idleProcessing.display, idleProcessing.width, idleProcessing.height],
      [false, "none", 0, 0]);
    check("initial", "no region the surface hides is painted anyway",
      await evaluate(cdp, "__ii.paintedWhileHidden()"), []);

    check("initial", "the drop target is present", initial.dropzone, true);
    check("initial", "the picker accepts PDF and nothing else", initial.file_input_accept, "application/pdf,.pdf");
    check("initial", "the PDF-only limit is stated before anything is tried", initial.limit, "PDF only.");
    check("initial", "the custody claim is on the intake", initial.custody, CUSTODY);
    check("initial", "the boundary states what the surface does, then what it does not",
      initial.boundary, [BOUNDARY_STATEMENT, BOUNDARY_DENIALS]);
    check("initial", "the sample is labelled as constructed",
      initial.sample_note, "A constructed demonstration file, not a document found in the wild.");
    check("initial", "no refusal stands unprompted", initial.refusal_hidden, true);

    // ── Phase 2: a file that is not a PDF ────────────────────────────────────────────
    const notPdf = path.join(downloadDir, "not-a-pdf.txt");
    fs.writeFileSync(notPdf, "This is not a PDF. It is a sentence.\n");
    await chooseFile(cdp, notPdf);
    await waitUntil(cdp, "__ii.refusal().hidden === false", { label: "the refusal rendered" });
    const refusal = await evaluate(cdp, "__ii.refusal()");
    fs.unlinkSync(notPdf);
    results.refusal = refusal;

    check("refusal", "the refusal names the limit and the file, in one sentence", refusal.text, REFUSAL_FOR_TXT);
    check("refusal", "the refusal is announced, not merely drawn", refusal.role, "status");
    check("refusal", "no result was rendered for a file that was not read",
      await evaluate(cdp, "document.getElementById('result').hidden"), true);
    check("refusal", "no processing state was entered for it",
      (await evaluate(cdp, "__ii.timeline()")).filter((t) => t.id === "processing" && t.hidden === false).length, 0);
    check("refusal", "the parser was never handed the file", await evaluate(cdp, "__ii.view()"), null);
    check("refusal", "and nothing the surface hides is painted beside the refusal",
      await evaluate(cdp, "__ii.paintedWhileHidden()"), []);

    // ── Phase 3: the sample's own bytes, through the picker ──────────────────────────
    const single = await inspectFile(cdp, { phase: "single", fixture: PDF_FIXTURE, expectContrast: true });
    results.single = single;

    check("single", "one page, read whole", single.result.coverage_label, "Complete");
    check("single", "the coverage statement counts the pages it read",
      single.result.coverage_statement, "This run inspected 1 page, and every page was read.");
    check("single", "no page-level failure is claimed", single.result.coverage_pages, []);
    check("single", "the summary counts what surfaced", single.result.summary_count,
      `${single.view.classes.length} item${single.view.classes.length === 1 ? "" : "s"} surfaced.`);

    // ── Phase 4: summary → item → back ───────────────────────────────────────────────
    const firstAnchor = single.view.anchors[0];
    await evaluate(cdp, "__ii.click('.ii-summary__link', 0)");
    await waitUntil(cdp, `__ii.hash() === "#${firstAnchor}"`, { label: "the summary link addressed the item" });
    const atItem = await evaluate(cdp, "__ii.fragmentTarget()");
    await evaluate(cdp, "__ii.click('.ii-item__back', 0)");
    await waitUntil(cdp, `__ii.hash() === "#result-summary"`, { label: "the item's back link addressed the summary" });
    const atSummary = await evaluate(cdp, "__ii.fragmentTarget()");
    results.navigation = { atItem, atSummary };

    check("navigation", "the summary link lands on the item it names",
      [atItem.id, atItem.exists, atItem.classes.includes("ii-item")], [firstAnchor, true, true]);
    check("navigation", "the item's back link lands on the summary",
      [atSummary.id, atSummary.exists, atSummary.classes.includes("ii-summary")], ["result-summary", true, true]);

    // ── Phase 5: the two disclosures ─────────────────────────────────────────────────
    const evidenceOpened = await evaluate(cdp, "__ii.openDisclosure('.ii-item details.ii-disclosure', 0)");
    const provenanceOpened = await evaluate(cdp, "__ii.openDisclosure('.ii-disclosure--provenance')");
    const opened = await evaluate(cdp, "__ii.result()");
    results.disclosures = { evidence: opened.items[0], provenance: opened.provenance };

    check("evidence", "the evidence disclosure opens", evidenceOpened.open, true);
    check("evidence", "it holds the machine's record, class label included",
      opened.items[0].evidence_terms.includes("Phenomenon class"), true);
    check("evidence", "the phenomenon class is evidence, and is not the item's title",
      opened.items[0].evidence_class !== opened.items[0].lead, true);
    check("evidence", "the class the surface shows is the class the parser reported",
      opened.items[0].evidence_class, single.view.classes[0]);
    check("evidence", "the extracted span and the checks that ran are both stated",
      ["Extracted text", "Checks that ran"].every((t) => opened.items[0].evidence_terms.includes(t)), true);

    check("provenance", "the provenance disclosure opens", provenanceOpened.open, true);
    check("provenance", "it names the parser, the version, and the digest, in one sentence",
      opened.provenance.statement,
      `This result came from pdfjs-dist 6.2.108 over the file with sha256 ${single.view.identity.sha256}.`);
    check("provenance", "the digest it shows is the digest of the file on disk",
      single.view.identity.sha256,
      (await import("node:crypto")).createHash("sha256").update(fs.readFileSync(PDF_FIXTURE)).digest("hex"));
    check("provenance", "it carries the four provenance rows", opened.provenance.rows.map((r) => r[0]),
      ["File digest, SHA-256", "Parser", "Predicate versions", "Pages inspected"]);
    check("provenance", "the custody claim is restated where the provenance is", opened.provenance.custody,
      "This file stayed on your machine.");

    // ── Phase 6: the durable local artifact ──────────────────────────────────────────
    // Driven by a real click on the shipped control, so the blob: URL and the download
    // attribute are exercised under the production policy rather than around it.
    const exportHit = await evaluate(cdp, "__ii.click('.ii-export__action')");
    if (!exportHit.ok) throw new Error(`the export control did not click: ${exportHit.why}`);
    const download = await awaitDownload(downloadDir);
    if (!download) {
      check("export", "the export control produced a file on disk", false, true);
    } else {
      const receipt = JSON.parse(download.bytes.toString("utf8"));
      results.export = { name: download.name, bytes: download.bytes.length, receipt };

      check("export", "the export names the file it describes", download.name,
        "f01_rendermode3-input-integrity.json");
      check("export", "the receipt is a governed record", receipt.receipt_schema_version, "file-receipt.v1");
      check("export", "it carries the same digest the surface showed", receipt.file.sha256,
        single.view.identity.sha256);
      check("export", "it carries the parser identity",
        [receipt.file.parser_name, receipt.file.parser_version], ["pdfjs-dist", "6.2.108"]);
      check("export", "it carries every phenomenon the surface rendered",
        receipt.surfaced.map((f) => f.phenomenon_class), single.view.classes);
      check("export", "each surfaced record keeps the anchor the surface used",
        receipt.surfaced.map((f) => f.anchor), single.view.anchors);
      check("export", "it carries the coverage state", receipt.coverage.state, "complete");
      check("export", "it states what the run could not establish",
        receipt.limitations.includes(ESTABLISHES_BODY), true);

      // The one claim this whole lane rests on, asserted against the artifact that leaves
      // the surface: the source PDF is not in it, in any encoding.
      const source = fs.readFileSync(PDF_FIXTURE);
      const asText = download.bytes.toString("utf8");
      check("export", "the receipt is not the size of a file that contains a PDF",
        download.bytes.length < source.length * 4, true);
      check("export", "no PDF header appears anywhere in the receipt", asText.includes("%PDF-"), false);
      check("export", "the source bytes are not base64-encoded into it",
        asText.includes(source.toString("base64").slice(0, 48)), false);
      check("export", "the source bytes are not hex-encoded into it",
        asText.includes(source.toString("hex").slice(0, 48)), false);
      check("export", "no PDF object or stream keyword reaches it",
        ["endobj", "endstream", "xref", "trailer"].some((k) => asText.includes(k)), false);
    }

    // ── Phase 7: a second file, with no contrast to draw ─────────────────────────────
    // A metadata result carries no page-level locator, so the substrate supports no
    // side-by-side pair for it. The surface must render the evidence it has rather than
    // manufacture a second panel.
    const multi = await inspectFile(cdp, { phase: "multi", fixture: MULTI_FIXTURE, expectContrast: false });
    results.multi = multi;

    check("multi", "a second file replaces the first result rather than joining it",
      multi.result.file_name, "f09_metadata_text.pdf");
    check("multi", "several phenomena surfaced from one file", multi.view.classes.length > 1, true);
    check("multi", "they are grouped by a distinction the schema already carries",
      multi.result.groups.every((g) => typeof g.heading === "string" && typeof g.note === "string"), true);
    check("multi", "no ranking, score, or severity is rendered",
      /severity|risk|score|danger|threat|suspicious/i.test(await evaluate(cdp, "__ii.documentText()")), false);

    // ── Phase 8: the whole document, in every state it reached ───────────────────────
    const bodyText = await evaluate(cdp, "__ii.documentText()");
    results.forbidden = FORBIDDEN_SUBSTRINGS.filter((s) =>
      new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(bodyText));
    check("wording", "no sentence claims what an AI, a machine, or a person received",
      results.forbidden, []);
  } finally {
    cdp.close?.();
    browserCdp.close?.();
    proc.kill("SIGKILL");
    server.close();
  }

  // ── The no-transmission receipt ────────────────────────────────────────────────────
  //
  // Two capture layers, because neither sees everything: Fetch interception sees what the
  // page issues, and the origin server sees what reaches it from anywhere INCLUDING the
  // worker, whose requests may not pause on the page session.
  //
  // The shape checks come first — all GET, no body — but they are the weak half. They
  // prove nobody uploaded on purpose. They do not prove the file stayed put, because a
  // GET carries a URL and a URL carries whatever you put in it. So the custody claim is
  // made positively below: every request is searched for the file itself.
  const allRequests = [...requests, ...served];
  const withBody = allRequests.filter((r) => r.body_bytes > 0);
  const nonGet = allRequests.filter((r) => r.method !== "GET");
  const offOriginHosts = [...new Set(blocked.map((u) => new URL(u).hostname))].sort();
  check("network", "every request the page issued was a GET", nonGet, []);
  check("network", "no request carried a body", withBody, []);
  check("network", "the server was never asked for anything outside this repository",
    served.every((r) => r.url.startsWith("/")), true);

  // ── Custody: the file's bytes are not in any request the page made ─────────────────
  //
  // The assertion Ruling 10 actually requires. Every request captured across the full
  // sample path — both fixtures, from first paint through export — is searched for the
  // file's raw bytes, three alignments of its base64, its base64url, its hex, its
  // sha256, and every string the parser extracts from it. A hit on any of those is a
  // custody failure and there is no shape of request that could pass this by accident.
  const witnesses = buildWitnesses([PDF_FIXTURE, MULTI_FIXTURE]);
  const wire = allRequests.map((r) => ({ r, text: wireText(r) }));
  const leaks = [];
  for (const { r, text } of wire) {
    for (const w of witnesses) {
      if (text.includes(w.value)) {
        leaks.push({
          kind: w.kind,
          fixture: w.fixture,
          method: r.method,
          url: (r.url || "").slice(0, 200),
          witness: w.value.slice(0, 60),
        });
      }
    }
  }

  // The search must be live. Witnesses that match nothing anywhere would make the check
  // above pass whether or not it was capable of failing, so the same witness set is run
  // against the file's own bytes first. A witness that cannot find the file it was built
  // from cannot find it on the wire either.
  const selfTest = witnesses.filter((w) => {
    const bytes = fs.readFileSync(
      w.fixture === path.basename(PDF_FIXTURE) ? PDF_FIXTURE : MULTI_FIXTURE,
    );
    if (w.kind === "raw") return bytes.toString("latin1").includes(w.value);
    if (w.kind === "encoded") {
      return [bytes.toString("base64"), bytes.subarray(1).toString("base64"),
        bytes.subarray(2).toString("base64"), bytes.toString("base64url"),
        bytes.toString("hex")].some((e) => e.includes(w.value));
    }
    if (w.kind === "derived") {
      return crypto.createHash("sha256").update(bytes).digest("hex") === w.value;
    }
    return true; // extracted sentinels come from the corpus record, not from the bytes
  });
  check("custody", "the witness set can find the file it was built from",
    selfTest.length, witnesses.length);
  check("custody", "the witness set covers bytes, every encoding, the hash, and the extracted text",
    [...new Set(witnesses.map((w) => w.kind))].sort(),
    ["derived", "encoded", "extracted", "raw"]);

  // A negative control, because a search that returns nothing looks identical whether it
  // is working or broken. Four requests that DO leak, one per witness kind, each hiding
  // the content somewhere a real leak would put it: a query string, a percent-encoded
  // query string, a custom header, and a POST body. The detector must catch all four.
  // If this ever reports fewer, the green result above means nothing.
  const bait = (() => {
    const raw = witnesses.find((w) => w.kind === "raw");
    const enc = witnesses.find((w) => w.kind === "encoded");
    const der = witnesses.find((w) => w.kind === "derived");
    const ext = witnesses.find((w) => w.kind === "extracted");
    return [
      { method: "GET", url: `http://example.test/collect?d=${enc.value}`, headers: {}, body: "" },
      { method: "GET", url: `http://example.test/c?d=${encodeURIComponent(raw.value)}`, headers: {}, body: "" },
      { method: "GET", url: "http://example.test/c", headers: { "x-file-hash": der.value }, body: "" },
      { method: "POST", url: "http://example.test/c", headers: {}, body: `text=${ext.value}` },
    ];
  })();
  const baitCaught = bait.filter((b) => {
    const text = wireText(b);
    return witnesses.some((w) => text.includes(w.value));
  });
  check("custody", "the custody search catches a planted leak in a query, an encoded query, a header, and a body",
    baitCaught.length, bait.length);

  check("custody",
    "NO REQUEST CARRIES THE FILE: not its bytes, not any encoding of them, not its hash, not its extracted text",
    leaks, []);

  // The inventory is closed, not merely clean. Searching for known witnesses catches a
  // leak of THIS file; pinning the set of URLs catches the next request somebody adds,
  // whatever it carries. A route that starts talking to something new fails here and has
  // to be read by a person before the receipt goes green again.
  // Same-origin entries collapse to a bare path, because the two capture layers see the
  // same request differently — the interceptor with an absolute URL, the server with a
  // path — and one request should appear once. Off-origin keeps its host, which is the
  // only part of an entry here that a reader needs to stop and think about.
  const inventory = [...new Set(allRequests.map((r) => {
    const u = r.url.startsWith("http") ? new URL(r.url) : new URL(r.url, "http://127.0.0.1");
    const local = u.hostname === "127.0.0.1";
    return `${r.method} ${local ? "" : u.origin}${u.pathname}`;
  }))].sort();
  results.request_inventory = inventory;
  results.request_count = allRequests.length;
  results.witness_count = witnesses.length;
  check("custody", "the page talks to exactly the endpoints this receipt has read",
    inventory, EXPECTED_REQUEST_INVENTORY);
  // The typeface stylesheet is the one thing this page reaches off-origin for, and the
  // harness denies it. Naming the hosts rather than asserting an empty list is the honest
  // form: an empty list would be a claim the page never tries, which is false.
  check("network", "the only off-origin host reached for is the typeface service",
    offOriginHosts, ["fonts.googleapis.com"]);
  check("network", "every off-origin request was denied before it left this machine",
    blocked.length, requests.filter((r) => !r.url.startsWith(`http://127.0.0.1`)).length);

  // A page that failed under the policy would show it here, and only here.
  const policyErrors = consoleErrors.filter((e) => e.source === "security" || /Content Security Policy/i.test(e.text));
  check("policy", "the production Content-Security-Policy refused nothing on this path", policyErrors, []);
  check("policy", "nothing on the path threw", consoleErrors.filter((e) => e.source === "exception"), []);

  fs.rmSync(downloadDir, { recursive: true, force: true });

  const failed = checks.filter((c) => !c.ok);

  if (AS_JSON) {
    log(JSON.stringify({
      renderer: `HeadlessChrome/${renderer.browserVersion}`,
      route: ROUTE,
      viewport: VIEWPORT_NAME,
      csp: PRODUCTION_CSP,
      checks,
      results,
      network: { intercepted: requests, served, blocked },
      console_errors: consoleErrors,
    }, null, 2));
    if (failed.length) process.exitCode = 1;
    return;
  }

  log(`── Input Integrity, the product path, end to end ──`);
  log(`  renderer:  HeadlessChrome/${renderer.browserVersion}`);
  log(`  route:     ${ROUTE} at ${VIEWPORT_NAME}`);
  log(`  policy:    served with the production CSP (${PRODUCTION_CSP.length} chars, verified against vercel.json)`);
  log("");

  let phase = null;
  for (const c of checks) {
    if (c.phase !== phase) {
      phase = c.phase;
      log(`  ── ${phase} ──`);
    }
    log(`  ${c.ok ? "ok  " : "FAIL"} ${c.claim}`);
    if (!c.ok) {
      log(`         expected: ${JSON.stringify(c.expected)}`);
      log(`         actual:   ${JSON.stringify(c.actual)}`);
    }
  }

  log("");
  log("── what a person had in front of them ──");
  log(`  initial:    result hidden, ${results.initial.result_children} children, picker accepts ${results.initial.file_input_accept}`);
  log(`  refusal:    ${JSON.stringify(results.refusal.text)}`);
  log(`  identity:   ${results.single.result.file_name} · ${results.single.result.file_size}`);
  log(`  coverage:   ${results.single.result.coverage_label} — ${results.single.result.coverage_statement}`);
  log(`  summary:    ${JSON.stringify(results.single.result.summary_count)}`);
  log(`  classes:    ${results.single.view.classes.join(", ")}`);
  for (const item of results.single.result.items) {
    log(`  item ${item.anchor}:`);
    log(`      lead:     ${JSON.stringify(item.lead)}`);
    for (const s of item.statements) log(`      then:     ${JSON.stringify(s)}`);
    log(`      where:    ${JSON.stringify(item.locator_parts.join(" · "))}`);
    if (item.has_contrast) {
      log(`      contrast: ${item.contrast_labels.join("  |  ")}`);
      log(
        `                ${item.contrast_canvas ? `drawn ${item.contrast_canvas.width}×${item.contrast_canvas.height}` : "not drawn"}, ${JSON.stringify(item.contrast_note)}`,
      );
      log(`                span  ${JSON.stringify(item.contrast_span)}`);
    }
  }
  log(`  timeline:   ${results.single.timeline.map((t) => `${t.id}:${t.hidden ? "hidden" : "shown"}/${t.painted ? `painted ${t.width}x${t.height}` : "unpainted"}@${t.t}ms`).join(" → ")}`);
  log(`  idle state: #processing computed ${results.initial_processing.display}, ${results.initial_processing.width}x${results.initial_processing.height}, painted ${results.initial_processing.painted}`);
  log(`  export:     ${results.export ? `${results.export.name}, ${results.export.bytes} bytes` : "NOT PRODUCED"}`);
  log(`  second file: ${results.multi.result.file_name} — ${results.multi.view.classes.length} classes across ${results.multi.result.groups.length} group(s), no contrast panel`);

  log("");
  log("── the network, both layers ──");
  log(`  intercepted at the page:  ${requests.length} request(s), ${requests.filter((r) => r.method !== "GET").length} non-GET, ${requests.filter((r) => r.body_bytes > 0).length} with a body`);
  log(`  reaching the server:      ${served.length} request(s), ${served.filter((r) => r.method !== "GET").length} non-GET, ${served.filter((r) => r.body_bytes > 0).length} with a body`);
  log(`  off-origin, denied:       ${blocked.length}`);
  const paths = [...new Set(served.map((r) => r.url))].sort();
  log(`  the ${paths.length} path(s) the browser and its worker asked for:`);
  for (const p of paths) log(`      GET ${p}`);

  if (consoleErrors.length) {
    log("");
    log(`── ${consoleErrors.length} console error(s) ──`);
    for (const e of consoleErrors) log(`  [${e.source}] ${e.text}`);
  }

  log("");
  log(
    failed.length === 0
      ? `All ${checks.length} checks held. A PDF chosen through the picker is read by a same-origin module worker under the production policy, and comes back as sentences, locators, a drawn page beside the structure behind it, and a downloadable record that contains no part of the file.`
      : `${failed.length} of ${checks.length} checks failed: ${failed.map((f) => `[${f.phase}] ${f.claim}`).join("; ")}`,
  );
  if (failed.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
