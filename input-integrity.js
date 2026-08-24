// input-integrity.js — markup assembly for the Input Integrity surface.
//
// ══ WHAT IS AND IS NOT DECIDED HERE ════════════════════════════════════════════
//
// Nothing. Every sentence comes from file-surface-copy.js or from the closed template
// registry in file-templates.js by way of the view; every grouping, locator, contrast
// and receipt field is decided in file-view.js under node:test. This file turns that
// object into elements and wires four events. If a question about what a person reads
// can be answered by reading this file, it is in the wrong place.
//
// ══ TEXT FROM THE FILE NEVER BECOMES MARKUP ════════════════════════════════════
//
// The one string on this surface that a document controls is the extracted span, and it
// reaches the DOM through textContent on an element created here — never innerHTML, never
// concatenated into a template. file-templates.js already refuses to interpolate
// document-supplied text into a sentence; this is the same rule at the DOM boundary.

import * as COPY from "./file-surface-copy.js";
import { unavailableView, buildReceipt } from "./file-view.js";

const SAMPLE_URL = "/vendor/sample/render-mode-3-demonstration.pdf";
const SAMPLE_NAME = "render-mode-3-demonstration.pdf";

const $ = (sel) => document.querySelector(sel);

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ---------------------------------------------------------------------------
// State. The intake stays put so a second file is one action away. Processing and result
// are mutually exclusive, so a previous file's result can never sit under the indicator
// for the one being read now.
// ---------------------------------------------------------------------------

const regions = {
  processing: null,
  result: null,
};

let worker = null;
let currentView = null;
const pendingRenders = new Map();

function show(name) {
  for (const [key, node] of Object.entries(regions)) {
    if (node) node.hidden = key !== name;
  }
}

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker("/file-intake-worker.js", { type: "module" });
  worker.onmessage = (event) => onWorkerMessage(event.data || {});
  worker.onerror = () => {
    currentView = unavailableView();
    renderResult(currentView);
  };
  return worker;
}

// ---------------------------------------------------------------------------
// Intake.
// ---------------------------------------------------------------------------

function isPdf(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function refuse(name) {
  const note = $("#intake-refusal");
  note.textContent = COPY.refusal(name);
  note.hidden = false;
}

function clearRefusal() {
  const note = $("#intake-refusal");
  note.textContent = "";
  note.hidden = true;
}

async function accept(file) {
  clearRefusal();
  if (!isPdf(file)) {
    refuse(file.name);
    return;
  }
  show("processing");
  const buffer = await file.arrayBuffer();
  ensureWorker().postMessage({ type: "inspect", fileName: file.name, buffer }, [buffer]);
}

async function inspectSample() {
  clearRefusal();
  show("processing");
  const response = await fetch(SAMPLE_URL);
  const buffer = await response.arrayBuffer();
  ensureWorker().postMessage({ type: "inspect", fileName: SAMPLE_NAME, buffer }, [buffer]);
}

// ---------------------------------------------------------------------------
// Worker messages.
// ---------------------------------------------------------------------------

function onWorkerMessage(message) {
  if (message.type === "result") {
    currentView = message.view;
    renderResult(message.view);
    return;
  }
  if (message.type === "page") {
    const slot = pendingRenders.get(message.page_index);
    if (slot) drawPage(slot, message);
    pendingRenders.delete(message.page_index);
    return;
  }
  if (message.type === "page_failed" || message.type === "crashed") {
    const index = message.page_index;
    const slot = pendingRenders.get(index);
    if (slot) {
      slot.replaceChildren(el("p", "ii-contrast__unavailable", COPY.renderUnavailable()));
    }
    pendingRenders.delete(index);
  }
}

// The marker sits on the rendered page at the coordinates the finding reports, put
// through the same viewport transform the page was drawn with. It is not an annotation
// of what is there — a render-mode-3 run paints nothing, so the marker frames the place
// the structure names and the panel beside it says what the structure carries.
function drawPage(slot, message) {
  const canvas = el("canvas", "ii-contrast__canvas");
  canvas.width = message.width;
  canvas.height = message.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(message.bitmap, 0, 0);

  const marker = slot.dataset.marker ? JSON.parse(slot.dataset.marker) : null;
  if (marker) {
    const t = message.viewport_transform;
    const at = (x, y) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]];
    const corners = marker.bbox
      ? [at(marker.bbox[0], marker.bbox[1]), at(marker.bbox[2], marker.bbox[3])]
      : [at(marker.x - 6, marker.y - 3), at(marker.x + 6, marker.y + 12)];
    const x0 = Math.min(corners[0][0], corners[1][0]);
    const y0 = Math.min(corners[0][1], corners[1][1]);
    const w = Math.abs(corners[1][0] - corners[0][0]);
    const h = Math.abs(corners[1][1] - corners[0][1]);
    ctx.strokeStyle = "#DE6F38";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0 - 3, y0 - 3, w + 6, h + 6);
  }
  slot.replaceChildren(canvas);
}

function requestPage(slot, pageIndex, width) {
  pendingRenders.set(pageIndex, slot);
  ensureWorker().postMessage({ type: "render", pageIndex, targetWidth: width });
}

// ---------------------------------------------------------------------------
// Result rendering.
// ---------------------------------------------------------------------------

function definitionRow(term, value) {
  const row = el("div", "ii-def");
  row.append(el("dt", "ii-def__term", term), el("dd", "ii-def__value", value));
  return row;
}

function locatorLine(locator) {
  const parts = [];
  if (Object.prototype.hasOwnProperty.call(locator, "page_number")) parts.push(COPY.locator(locator.page_number));
  if (Object.prototype.hasOwnProperty.call(locator, "position")) {
    parts.push(COPY.locatorPoint(locator.position.x, locator.position.y));
  }
  if (Object.prototype.hasOwnProperty.call(locator, "container_kind")) parts.push(locator.container_kind);
  if (Object.prototype.hasOwnProperty.call(locator, "annotation_subtype")) parts.push(locator.annotation_subtype);
  if (Object.prototype.hasOwnProperty.call(locator, "metadata_key")) parts.push(locator.metadata_key);
  if (Object.prototype.hasOwnProperty.call(locator, "ocg_name")) parts.push(locator.ocg_name);
  return parts;
}

function renderLocator(locator) {
  const wrap = el("p", "ii-item__locator");
  wrap.append(el("span", "ii-item__locator-label", COPY.RESULT.locator_label));
  for (const part of locatorLine(locator)) wrap.append(el("span", "ii-item__locator-part", part));
  return wrap;
}

function renderContrast(item, identity) {
  const grid = el("div", "ii-contrast");

  const rendered = el("div", "ii-contrast__side");
  rendered.append(el("h4", "ii-contrast__label", COPY.RESULT.rendered_side_label));
  const slot = el("div", "ii-contrast__slot");
  if (item.contrast.position) {
    slot.dataset.marker = JSON.stringify({ x: item.contrast.position.x, y: item.contrast.position.y });
  }
  if (item.contrast.text_bbox) {
    slot.dataset.marker = JSON.stringify({ bbox: item.contrast.text_bbox });
  }
  rendered.append(slot);
  rendered.append(
    el("p", "ii-contrast__note", COPY.renderedSideNote(identity.parser_name, identity.parser_version)),
  );

  const structure = el("div", "ii-contrast__side");
  structure.append(el("h4", "ii-contrast__label", COPY.RESULT.structure_side_label));
  structure.append(el("p", "ii-contrast__span", item.extraction.text));
  const lines = el("ul", "ii-contrast__statements");
  for (const statement of item.statements) lines.append(el("li", null, statement.string));
  structure.append(lines);

  grid.append(rendered, structure);
  requestPage(slot, item.contrast.page_index, 360);
  return grid;
}

function renderEvidence(item) {
  const details = el("details", "ii-disclosure");
  details.append(el("summary", "ii-disclosure__summary", COPY.RESULT.evidence_label));
  const list = el("dl", "ii-def-list");
  list.append(definitionRow(COPY.RESULT.evidence_class, item.class_label));
  list.append(definitionRow(COPY.RESULT.evidence_span, item.extraction.text));
  list.append(definitionRow(COPY.RESULT.evidence_checks, item.checks_run.join(", ")));
  const thresholds = Object.entries(item.thresholds_applied);
  if (thresholds.length > 0) {
    list.append(definitionRow(COPY.RESULT.evidence_thresholds, thresholds.map(([k, v]) => `${k} ${v}`).join(", ")));
  }
  list.append(
    definitionRow(
      COPY.RESULT.evidence_state,
      Object.entries(item.graphics_state)
        .map(([k, v]) => `${k} ${Array.isArray(v) ? v.join(" ") : v}`)
        .join(", "),
    ),
  );
  details.append(list);
  return details;
}

function renderItem(item, identity) {
  const article = el("article", "ii-item");
  article.id = item.anchor;

  // The human sentence leads. The class label is evidence about which check ran, and it
  // sits inside the evidence disclosure with the rest of the machine's record.
  const lead = el("h3", "ii-item__lead", item.statements[0].string);
  article.append(lead);

  const rest = el("ul", "ii-item__statements");
  for (const statement of item.statements.slice(1)) rest.append(el("li", null, statement.string));
  if (rest.childElementCount > 0) article.append(rest);

  article.append(renderLocator(item.locator));
  if (item.contrast) article.append(renderContrast(item, identity));
  article.append(renderEvidence(item));

  const back = el("a", "ii-item__back", COPY.RESULT.back_to_summary);
  back.href = "#result-summary";
  article.append(back);
  return article;
}

function renderSummary(view) {
  const section = el("section", "ii-summary");
  section.id = "result-summary";
  section.append(el("h2", "ii-summary__heading", COPY.RESULT.summary_label));
  section.append(el("p", "ii-summary__count", view.surfaced_count_copy));

  if (view.zero_reportable) {
    const zero = el("div", "ii-zero");
    zero.append(el("p", "ii-zero__statement", view.zero_reportable.statement));
    zero.append(el("p", "ii-zero__scope", view.zero_reportable.scope));
    section.append(zero);
    return section;
  }

  const list = el("ol", "ii-summary__list");
  for (const group of view.groups) {
    for (const item of group.items) {
      const row = el("li", "ii-summary__row");
      const link = el("a", "ii-summary__link", item.statements[0].string);
      link.href = `#${item.anchor}`;
      row.append(link);
      const where = locatorLine(item.locator);
      if (where.length > 0) row.append(el("span", "ii-summary__where", where.join(" · ")));
      list.append(row);
    }
  }
  section.append(list);
  return section;
}

function renderCoverage(view) {
  const block = el("div", "ii-coverage");
  block.append(el("span", "ii-coverage__label", view.coverage_copy.label));
  block.append(el("p", "ii-coverage__statement", view.coverage_copy.statement));
  for (const line of view.coverage_copy.pages) block.append(el("p", "ii-coverage__page", line));
  return block;
}

function renderProvenance(view) {
  const details = el("details", "ii-disclosure ii-disclosure--provenance");
  details.append(el("summary", "ii-disclosure__summary", COPY.RESULT.provenance_label));
  details.append(el("p", "ii-provenance__statement", view.provenance_statement));
  const list = el("dl", "ii-def-list");
  list.append(definitionRow(COPY.RESULT.provenance_hash, view.identity.sha256));
  list.append(
    definitionRow(COPY.RESULT.provenance_parser, `${view.identity.parser_name} ${view.identity.parser_version}`),
  );
  list.append(
    definitionRow(
      COPY.RESULT.provenance_predicates,
      Object.entries(view.identity.predicate_versions)
        .map(([name, version]) => `${name} ${version}`)
        .join(", "),
    ),
  );
  list.append(definitionRow(COPY.RESULT.provenance_pages, view.coverage.pages_inspected_numbers.join(", ")));
  details.append(list);
  details.append(el("p", "ii-provenance__custody", COPY.RESULT.provenance_custody));
  return details;
}

function renderExport(view) {
  const wrap = el("div", "ii-export");
  const button = el("button", "btn btn--ghost ii-export__action", COPY.RESULT.export_action);
  button.type = "button";
  button.addEventListener("click", () => downloadReceipt(view));
  wrap.append(button, el("p", "ii-export__note", COPY.RESULT.export_note));
  return wrap;
}

function renderResult(view) {
  const root = regions.result;
  root.replaceChildren();

  const header = el("header", "ii-result__header");
  if (view.file_name) header.append(el("h2", "ii-result__file", view.file_name));

  if (view.state !== "read") {
    header.append(el("span", "ii-coverage__label", view.label));
    root.append(header);
    root.append(el("p", "ii-coverage__statement", view.statement));
    root.append(renderEstablishes(view.establishes));
    show("result");
    return;
  }

  header.append(el("p", "ii-result__size", COPY.byteSize(view.byte_size)));
  header.append(renderCoverage(view));
  root.append(header);
  root.append(renderEstablishes(view.establishes));
  root.append(renderSummary(view));

  for (const group of view.groups) {
    const section = el("section", "ii-group");
    section.append(el("h2", "ii-group__heading", group.heading));
    section.append(el("p", "ii-group__note", group.note));
    for (const item of group.items) section.append(renderItem(item, view.identity));
    root.append(section);
  }

  root.append(renderProvenance(view));
  root.append(renderExport(view));
  show("result");
}

function renderEstablishes(establishes) {
  const block = el("div", "ii-establishes");
  block.append(el("h3", "ii-establishes__label", establishes.label));
  block.append(el("p", "ii-establishes__body", establishes.body));
  return block;
}

// ---------------------------------------------------------------------------
// The durable receipt. Built in the page rather than the worker because the timestamp is
// the caller's to supply and the view already carries everything else.
// ---------------------------------------------------------------------------

function downloadReceipt(view) {
  const receipt = buildReceipt({ view, generatedAt: new Date().toISOString() });
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = el("a");
  link.href = url;
  link.download = `${view.file_name.replace(/\.pdf$/i, "")}-input-integrity.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Wiring.
// ---------------------------------------------------------------------------

function init() {
  regions.processing = $("#processing");
  regions.result = $("#result");
  show("none");

  const drop = $("#dropzone");
  const input = $("#file-input");

  $("#choose").addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    if (input.files && input.files[0]) accept(input.files[0]);
    input.value = "";
  });
  $("#sample").addEventListener("click", () => inspectSample());

  for (const type of ["dragenter", "dragover"]) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      drop.classList.add("is-over");
    });
  }
  for (const type of ["dragleave", "drop"]) {
    drop.addEventListener(type, (event) => {
      event.preventDefault();
      drop.classList.remove("is-over");
    });
  }
  drop.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) accept(file);
  });

  // The surface exposes its own state so the product-path receipt can read structural
  // facts out of a live page instead of inferring them from pixels.
  window.__inputIntegrity = {
    accept,
    inspectSample,
    get view() {
      return currentView;
    },
  };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
