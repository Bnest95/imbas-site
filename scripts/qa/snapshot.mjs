// scripts/qa/snapshot.mjs — structured text snapshots and regression diffing for
// the visual acceptance harness.
//
// WHY THIS EXISTS
// The harness could attest to an image but not compare it. Its own receipt recorded
// that captures were not byte-reproducible run to run, so a naive byte diff against
// a baseline reported every image as changed on every run and caught nothing.
//
// The defect class this is built to catch is a component rendering the WRONG STATE —
// which has actually happened in this repository twice (the Inspection Meaning panel
// counting the wrong findings source, the paired headline making a construct claim
// without checking conditions_matched). Both were text-and-state defects. A byte
// diff of a PNG reports "these images differ" and leaves a human to find out how;
// a snapshot diff names the line that moved.
//
// Everything in this file is pure and synchronous so it can be tested without a
// browser. The harness supplies the raw entries; this module normalizes, serializes,
// diffs, and parses.

// ── Canonical JSON ───────────────────────────────────────────────────────────
// Key order in a JS object follows insertion order, which is stable for a given
// build but changes the moment a product module reorders how it assembles a
// payload. Sorting keys means the payload baseline records the payload's CONTENT,
// not the order its builder happened to emit.
export function canonicalJSON(value) {
  const walk = (v) => {
    if (v === null || typeof v !== "object") return v;
    if (Array.isArray(v)) return v.map(walk);
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
    return out;
  };
  return JSON.stringify(walk(value), null, 2);
}

// ── Normalization ────────────────────────────────────────────────────────────
// Every rule replaces a volatile value with a TOKEN rather than deleting it, so the
// snapshot still records "a timestamp appears here" while dropping the value that
// would differ run to run. Deleting instead would let a field vanish entirely
// without the diff noticing.
//
// Ordered: longest/most specific pattern first, because a 64-char hash also matches
// the generic long-hex rule and would otherwise be tokenized as the weaker one.
export const NORMALIZERS = [
  // ISO 8601 timestamps: 2026-07-25T12:00:00.000Z
  { token: "<TIMESTAMP>", re: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})/g },
  // sha256 and friends — 64 hex chars
  { token: "<HASH64>", re: /\b[0-9a-f]{64}\b/gi },
  // uuid
  { token: "<UUID>", re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi },
  // run / request identifiers — 16+ hex chars (FROZEN_REQUEST_ID is 16 zeroes)
  { token: "<ID>", re: /\b[0-9a-f]{16,}\b/gi },
  // Calendar dates: 2026-07-25, 25 July 2026, July 25, 2026
  { token: "<DATE>", re: /\b\d{4}-\d{2}-\d{2}\b/g },
  {
    token: "<DATE>",
    re: /\b(?:\d{1,2}\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
  },
  // Clock times: 12:00, 12:00:00, 1:05 PM
  { token: "<TIME>", re: /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?\b/gi },
];

export function normalizeText(s) {
  let out = String(s ?? "");
  for (const { token, re } of NORMALIZERS) out = out.replace(re, token);
  // Canonicalize whitespace last: line endings, repeated spacing, edges. Doing this
  // after tokenizing means a timestamp split across a line break still matches.
  return out.replace(/\r\n?/g, "\n").replace(/\s+/g, " ").trim();
}

// Absolute local filesystem paths would bake one machine's home directory into a
// committed baseline. Repository-relative wins; anything still absolute is tokenized.
export function normalizeHref(href, origin) {
  if (!href) return "";
  let h = String(href);
  if (origin && h.startsWith(origin)) h = h.slice(origin.length) || "/";
  h = h.replace(/^file:\/\/\/.*$/, "<ABSPATH>");
  h = h.replace(/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/, "");
  return normalizeText(h);
}

// ── Entry → line ─────────────────────────────────────────────────────────────
// One line per visible element that carries its own text or is interactive. The
// field order is fixed so a line is diffable as a string.
export function entryToLine(e, origin) {
  const parts = [];
  parts.push(e.role ? `${e.tag}[${e.role}]` : e.tag);

  const text = normalizeText(e.text);
  if (text) parts.push(JSON.stringify(text));

  if (e.href !== undefined && e.href !== null && e.href !== "") {
    parts.push(`href=${JSON.stringify(normalizeHref(e.href, origin))}`);
  }
  // Only emit a state flag when the property is meaningful for the element, so a
  // plain <div> does not carry disabled=false noise.
  for (const k of ["disabled", "readonly", "checked", "expanded", "selected"]) {
    if (e[k] !== undefined && e[k] !== null) parts.push(`${k}=${e[k]}`);
  }
  if (e.inputType) parts.push(`type=${e.inputType}`);
  if (e.valueLength !== undefined && e.valueLength !== null) parts.push(`value_len=${e.valueLength}`);
  return parts.join(" ");
}

export function normalizeEntries(entries, origin) {
  const lines = [];
  for (const e of entries || []) {
    const line = entryToLine(e, origin);
    // An element that normalized down to nothing but its tag carries no signal.
    if (!line || !/["=]/.test(line)) continue;
    lines.push(line);
  }
  return lines;
}

// ── Serialize / parse ────────────────────────────────────────────────────────
export const SNAPSHOT_FORMAT = "imbas-visual-snapshot/1";
const SECTION_ENV = "## environment";
const SECTION_PAYLOAD = "## payload";
const SECTION_RENDER = "## render";

export function serializeSnapshot({ env = {}, payload = {}, lines = [] }) {
  const out = [];
  out.push(`# ${SNAPSHOT_FORMAT}`);
  out.push("");
  out.push(SECTION_ENV);
  for (const k of Object.keys(env).sort()) out.push(`${k}: ${env[k]}`);
  out.push("");
  out.push(SECTION_PAYLOAD);
  out.push(canonicalJSONNormalized(payload));
  out.push("");
  out.push(SECTION_RENDER);
  for (const l of lines) out.push(l);
  // Trailing newline so the file is POSIX-clean and git shows no "\ No newline".
  return out.join("\n").replace(/\n+$/, "") + "\n";
}

// The payload is normalized line-by-line so a frozen timestamp inside it is
// tokenized the same way rendered text is.
function canonicalJSONNormalized(payload) {
  return canonicalJSON(payload)
    .split("\n")
    .map((l) => {
      let out = l;
      for (const { token, re } of NORMALIZERS) out = out.replace(re, token);
      return out.replace(/\s+$/, "");
    })
    .join("\n");
}

export function parseSnapshot(text) {
  const raw = String(text ?? "").replace(/\r\n?/g, "\n");
  const lines = raw.split("\n");
  if (!lines[0] || !lines[0].startsWith(`# ${SNAPSHOT_FORMAT}`)) {
    throw new Error(
      `Not an ${SNAPSHOT_FORMAT} file (first line was ${JSON.stringify(lines[0] || "")}). ` +
        `Refusing to diff against it — a malformed baseline would report every line as changed.`
    );
  }
  const sections = { env: [], payload: [], render: [] };
  let current = null;
  for (const line of lines.slice(1)) {
    const lower = line.trim().toLowerCase();
    if (lower === SECTION_ENV) { current = "env"; continue; }
    if (lower === SECTION_PAYLOAD) { current = "payload"; continue; }
    if (lower === SECTION_RENDER) { current = "render"; continue; }
    if (current) sections[current].push(line);
  }
  const trim = (arr) => {
    const copy = [...arr];
    while (copy.length && copy[0].trim() === "") copy.shift();
    while (copy.length && copy[copy.length - 1].trim() === "") copy.pop();
    return copy;
  };
  const env = {};
  for (const l of trim(sections.env)) {
    const i = l.indexOf(":");
    if (i > 0) env[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  return { env, payload: trim(sections.payload), render: trim(sections.render) };
}

// ── Diff ─────────────────────────────────────────────────────────────────────
// Longest common subsequence, then adjacent delete+insert runs are paired into
// "changed" so a reworded line reads as one change rather than two unrelated ones.
function lcsTable(a, b) {
  const n = a.length;
  const m = b.length;
  const table = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

export function diffLines(baseline, fresh) {
  const a = baseline || [];
  const b = fresh || [];
  const table = lcsTable(a, b);
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ op: "same", line: a[i] });
      i++; j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      ops.push({ op: "removed", line: a[i] });
      i++;
    } else {
      ops.push({ op: "added", line: b[j] });
      j++;
    }
  }
  while (i < a.length) ops.push({ op: "removed", line: a[i++] });
  while (j < b.length) ops.push({ op: "added", line: b[j++] });

  // Pair runs of removed-then-added into changed.
  const merged = [];
  for (let k = 0; k < ops.length; k++) {
    if (ops[k].op !== "removed") { merged.push(ops[k]); continue; }
    const removed = [];
    while (k < ops.length && ops[k].op === "removed") removed.push(ops[k++].line);
    const added = [];
    while (k < ops.length && ops[k].op === "added") added.push(ops[k++].line);
    k--;
    const paired = Math.min(removed.length, added.length);
    for (let p = 0; p < paired; p++) merged.push({ op: "changed", from: removed[p], to: added[p] });
    for (let p = paired; p < removed.length; p++) merged.push({ op: "removed", line: removed[p] });
    for (let p = paired; p < added.length; p++) merged.push({ op: "added", line: added[p] });
  }

  const added = merged.filter((o) => o.op === "added");
  const removed = merged.filter((o) => o.op === "removed");
  const changed = merged.filter((o) => o.op === "changed");
  return {
    ops: merged,
    added,
    removed,
    changed,
    identical: added.length === 0 && removed.length === 0 && changed.length === 0,
  };
}

export function diffSnapshots(baselineText, freshText) {
  const base = parseSnapshot(baselineText);
  const fresh = parseSnapshot(freshText);
  const payload = diffLines(base.payload, fresh.payload);
  const render = diffLines(base.render, fresh.render);
  return { payload, render, identical: payload.identical && render.identical };
}

export function formatDiff(label, d) {
  if (d.identical) return `  ${label}: no change`;
  const out = [`  ${label}:`];
  for (const o of d.ops) {
    if (o.op === "same") continue;
    if (o.op === "changed") {
      out.push(`    ~ ${o.from}`);
      out.push(`    → ${o.to}`);
    } else if (o.op === "added") out.push(`    + ${o.line}`);
    else out.push(`    - ${o.line}`);
  }
  return out.join("\n");
}

// ── Image comparability gate ─────────────────────────────────────────────────
// Byte-identical PNG output was PROVEN on this machine (three consecutive captures
// of the same scenario produced one checksum), so image diff ships enabled. It is
// gated anyway, because byte equality only means anything when both sides were
// produced under the same conditions.
//
// PNG bytes depend on the platform font rasterizer and the Chromium encoder. A
// baseline captured on another machine, another OS, or another Chromium build
// encodes differently even when the page looks identical — comparing across those
// reports "changed" for reasons that have nothing to do with the product, which is
// exactly the always-red diff this tooling exists to avoid. When the environments
// do not match, image comparison is SKIPPED rather than reported as a regression;
// the snapshot layer carries no pixels and stays authoritative.
export const IMAGE_ENV_KEYS = ["browser_version", "viewport", "device_scale_factor", "mobile_emulation"];

export function imageComparability(baselineEnv = {}, freshEnv = {}) {
  if (String(baselineEnv.image_diff || "").toLowerCase() === "disabled") {
    return { comparable: false, reason: "baseline recorded image_diff: disabled" };
  }
  for (const k of IMAGE_ENV_KEYS) {
    const a = baselineEnv[k];
    const b = freshEnv[k];
    if (a === undefined || b === undefined) {
      return { comparable: false, reason: `baseline does not record ${k}` };
    }
    if (a !== b) {
      return { comparable: false, reason: `${k} differs (baseline ${a}, this run ${b})` };
    }
  }
  return { comparable: true, reason: "" };
}

// ── Error-page rejection ─────────────────────────────────────────────────────
// A dead static server once made every capture byte-identical because each image
// was the browser's connection-error page — which passes a byte diff perfectly and
// is the most dangerous possible false green.
const ERROR_PAGE_MARKERS = [
  "err_connection_refused",
  "err_connection_reset",
  "err_empty_response",
  "err_name_not_resolved",
  "err_address_unreachable",
  "err_file_not_found",
  "this site can't be reached",
  "this site cannot be reached",
  "site cannot be reached",
  "no data received",
  "refused to connect",
];

export function detectErrorPage(lines) {
  const hay = (lines || []).join("\n").toLowerCase();
  for (const m of ERROR_PAGE_MARKERS) if (hay.includes(m)) return m;
  return null;
}

// ── Scenario validation ──────────────────────────────────────────────────────
// A drivable scenario with no DOM assertion would photograph whatever happened to
// be on screen and file it under that scenario's name — the exact failure the
// harness exists to prevent, so it is rejected before a browser is launched.
export function assertScenarioCapturable(name, scenario) {
  const problems = [];
  if (!scenario || typeof scenario !== "object") {
    return [`scenario "${name}" is not an object`];
  }
  if (!scenario.name) problems.push("scenario has no name");
  if (scenario.name && scenario.name !== name) {
    problems.push(`scenario key "${name}" disagrees with scenario.name "${scenario.name}"`);
  }
  // The routes rule exists so a scenario cannot photograph whatever happened to be on
  // screen and file it under a name it never reached. A canned surface reaches its
  // state without a server, so the rule has nothing to protect there — but only if the
  // scenario says so outright and still proves the state in the DOM. `canned` buys the
  // empty route table and nothing else: the drivable branch below still demands steps
  // and an assertion, and the harness's no-metered-call layers are untouched by it.
  if (!scenario.routes || !Object.keys(scenario.routes).length) {
    if (!scenario.canned) {
      problems.push("scenario declares no routes, so no state can be stubbed");
    } else if (!scenario.drivable) {
      problems.push("a canned scenario must be drivable — nothing else would put it on screen");
    }
  } else if (scenario.canned) {
    problems.push("scenario is marked canned but declares routes; one of the two is wrong");
  }
  if (scenario.drivable) {
    if (!Array.isArray(scenario.steps) || !scenario.steps.length) {
      problems.push("scenario is marked drivable but declares no drive steps");
    }
    const hasSelector = typeof scenario.assertSelector === "string" && scenario.assertSelector.length > 0;
    const hasText = Array.isArray(scenario.assertText) && scenario.assertText.length > 0;
    if (!hasSelector && !hasText) {
      problems.push(
        "scenario has no DOM assertion (assertSelector or assertText): the harness would capture " +
          "whatever was on screen and file it under this name"
      );
    }
  }
  // A page is checked before a query, and more strictly, because it decides which
  // document the harness photographs at all. The path is absolute and carries nothing
  // else: a query belongs in `query`, where it is recorded separately, and a fragment
  // never reaches the server — either one appearing here would mean two places decide
  // the URL and they are free to disagree.
  if (scenario.page !== undefined) {
    if (typeof scenario.page !== "string" || !scenario.page.length) {
      problems.push("scenario declares a page that is not a non-empty string");
    } else if (!scenario.page.startsWith("/")) {
      problems.push("scenario page is not an absolute path; the harness serves the repo root");
    } else if (/[?#\s]/.test(scenario.page)) {
      problems.push("scenario page carries a query, a fragment or whitespace; only the path belongs here");
    }
  }
  // A query string changes which page renders, so it is checked like a route and not
  // waved through as decoration. An object or array here would stringify to something
  // the browser accepts and nobody intended, and the baseline would record it.
  if (scenario.query !== undefined) {
    if (typeof scenario.query !== "string" || !scenario.query.length) {
      problems.push("scenario declares a query that is not a non-empty string");
    } else if (/[#\s]/.test(scenario.query)) {
      problems.push(
        "scenario query contains a fragment or whitespace: only a query string belongs here, " +
          "and the harness pins the path itself"
      );
    }
  }
  return problems;
}

// ── Image diff ───────────────────────────────────────────────────────────────
// Byte comparison only. No image library, so no perceptual tolerance: two captures
// are the same file or they are not.
export function diffImageBuffers(baselineBuf, freshBuf) {
  if (baselineBuf == null && freshBuf == null) return { status: "missing-both" };
  if (baselineBuf == null) return { status: "missing-baseline", freshBytes: freshBuf.length };
  if (freshBuf == null) return { status: "missing-fresh", baselineBytes: baselineBuf.length };
  const identical = baselineBuf.length === freshBuf.length && baselineBuf.equals(freshBuf);
  return {
    status: identical ? "identical" : "changed",
    baselineBytes: baselineBuf.length,
    freshBytes: freshBuf.length,
  };
}

// ── In-page extractor ────────────────────────────────────────────────────────
// Evaluated in the page. Returns raw entries for every element that is actually
// VISIBLE INSIDE THE CAPTURED RECTANGLE — visibility determined from rendered state
// (box, computed style, clipping), not mere DOM presence, so an element that exists
// but is scrolled out of the photographed region is not recorded as if it were seen.
//
// Each element contributes only its OWN text nodes. Taking descendant text would
// repeat the same sentence at every ancestor level and turn one real change into a
// dozen diff lines.
export const EXTRACTOR_SOURCE = `
(() => {
  const H = window.innerHeight;
  const W = window.innerWidth;
  const INTERACTIVE = new Set(["A","BUTTON","INPUT","TEXTAREA","SELECT","SUMMARY","DETAILS","LABEL","OPTION"]);
  const SKIP = new Set(["SCRIPT","STYLE","NOSCRIPT","TEMPLATE","HEAD","META","LINK","TITLE","BR"]);
  const out = [];

  const ownText = (el) => {
    let s = "";
    for (const n of el.childNodes) if (n.nodeType === 3) s += n.nodeValue;
    return s.replace(/\\s+/g, " ").trim();
  };

  const walk = (el) => {
    if (!el || el.nodeType !== 1) return;
    const tag = el.tagName;
    if (SKIP.has(tag)) return;
    if (el.id === "__qa_no_anim") return;

    const style = getComputedStyle(el);
    // display:none removes the subtree entirely; visibility:hidden and opacity:0
    // leave layout but paint nothing, so nothing in them is visible either.
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return;

    const r = el.getBoundingClientRect();
    const inRegion = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;

    if (inRegion) {
      const text = ownText(el);
      const interactive = INTERACTIVE.has(tag) || el.getAttribute("role");
      if (text || interactive) {
        const e = { tag: tag.toLowerCase(), text };
        const role = el.getAttribute("role");
        if (role) e.role = role;
        if (tag === "A") e.href = el.getAttribute("href") || "";
        if (tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
          e.disabled = !!el.disabled;
        }
        if (tag === "INPUT" || tag === "TEXTAREA") {
          e.readonly = !!el.readOnly;
          // The VALUE is user content and would make the snapshot depend on fixture
          // prose; its LENGTH still catches "field rendered empty when it should be
          // filled", which is the state defect worth catching.
          e.valueLength = (el.value || "").length;
          if (tag === "INPUT") e.inputType = el.type || "text";
          if (el.type === "checkbox" || el.type === "radio") e.checked = !!el.checked;
        }
        const expanded = el.getAttribute("aria-expanded");
        if (expanded !== null) e.expanded = expanded;
        const selected = el.getAttribute("aria-selected");
        if (selected !== null) e.selected = selected;
        if (tag === "DETAILS") e.expanded = String(!!el.open);
        out.push(e);
      }
    }

    // Descend even when this element is out of region: a clipped ancestor can still
    // contain an in-region child (sticky headers, overflow containers).
    for (const child of el.children) walk(child);
  };

  walk(document.body);
  return out;
})()
`;
