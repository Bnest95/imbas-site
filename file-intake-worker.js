// file-intake-worker.js — the module worker that runs the inspection off the main thread.
//
// ══ WHY A WORKER AT ALL, AND WHY THIS SHAPE ════════════════════════════════════
//
// Walking an operator list is arithmetic over every operator on every page. On a large
// file that is long enough to freeze a page, and a frozen page is a surface that looks
// broken while it is working correctly. So the walk runs here.
//
// pdf.js normally spawns its own worker from the main thread. Started from inside a
// worker it cannot: PDFWorker#initialize reads `window.location`, `window` is not
// defined here, the ReferenceError is caught, and pdf.js falls through to its fake-worker
// path — `await import(GlobalWorkerOptions.workerSrc)` — which runs the same worker code
// in THIS thread. One thread, one parse, no nested worker, no blob URL, and nothing that
// needs a CSP relaxation: every import below is same-origin, which `default-src 'self'`
// already allows.
//
// ══ TWO DOCUMENT HANDLES, ON PURPOSE ═══════════════════════════════════════════
//
// `readPdf` opens a document, walks it, and destroys it. Rendering a page needs a live
// handle, so the renderer opens its own over the same bytes. That is not duplication to
// be tidied away: the evidence path and the render path are the two things this surface
// reports, they are separately configured, and keeping them apart means no render option
// can reach the record. file-intake-pdfjs.js is the evidence module and nothing in the
// render path imports through it.
//
// ══ WHAT THE RENDER CONFIGURATION MEANS ════════════════════════════════════════
//
// disableFontFace is true because a worker has no `document.fonts` to register a face
// with. pdf.js then draws glyph outlines from the font program directly instead of
// asking the browser's font engine to do it. For an embedded font the outlines are the
// same either way; for a non-embedded one, both paths resolve through the same vendored
// standard font data. The mechanism differs, the source of the shapes does not.
//
// ══ PROGRESS IS STAGES, NOT A PERCENTAGE ═══════════════════════════════════════
//
// The bytes are already in memory, so pdf.js's byte-progress callback would report 100%
// the instant it fired, and the walk itself reports nothing until it finishes. Rather
// than run a bar off a timer — which measures the clock and calls it the file — this
// posts the stage it actually entered and lets the surface show an indeterminate state.

import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";
import { readPdf } from "./file-intake-pdfjs.js";
import { detectFileFindings } from "./file-detectors.js";
import { buildView, failedView } from "./file-view.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdfjs/pdf.worker.min.mjs", import.meta.url).href;

const STANDARD_FONT_DATA_URL = new URL("./vendor/pdfjs/standard_fonts/", import.meta.url).href;

// Held between messages so a page can be drawn after the walk without re-reading the
// file. Cleared on reset, which is also what drops the bytes.
let renderState = null;

function post(message, transfer) {
  self.postMessage(message, transfer || []);
}

async function closeRenderState() {
  if (!renderState) return;
  const task = renderState.task;
  renderState = null;
  try {
    await task.destroy();
  } catch {
    // A handle that will not close is not evidence about the file.
  }
}

async function inspect({ fileName, buffer }) {
  const bytes = new Uint8Array(buffer);
  await closeRenderState();

  let record;
  try {
    post({ type: "stage", stage: "reading" });
    record = await readPdf({ pdfjsLib, data: bytes, standardFontDataUrl: STANDARD_FONT_DATA_URL });
  } catch (err) {
    post({ type: "result", view: failedView(fileName, String(err?.message || err)) });
    return;
  }

  post({ type: "stage", stage: "measuring" });
  const detection = detectFileFindings({ record });
  const view = buildView({ fileName, byteSize: bytes.length, detection, record });

  // The render handle opens only for a file that has something to stand beside. A
  // result with no contrast never draws a page and never pays for one.
  if (view.items.some((item) => item.contrast)) {
    const task = pdfjsLib.getDocument({
      data: new Uint8Array(bytes),
      standardFontDataUrl: STANDARD_FONT_DATA_URL,
      useSystemFonts: false,
      isEvalSupported: false,
      disableFontFace: true,
    });
    renderState = { task, doc: await task.promise };
  }

  post({ type: "result", view });
}

async function renderPage({ pageIndex, targetWidth }) {
  if (!renderState) {
    post({ type: "page_failed", page_index: pageIndex, reason: "no open document" });
    return;
  }
  try {
    const page = await renderState.doc.getPage(pageIndex + 1);
    const unit = page.getViewport({ scale: 1 });
    const scale = targetWidth / unit.width;
    const viewport = page.getViewport({ scale });
    const canvas = new OffscreenCanvas(Math.max(1, Math.round(viewport.width)), Math.max(1, Math.round(viewport.height)));
    const ctx = canvas.getContext("2d", { alpha: false });

    // The page is drawn onto white. A PDF page has no background of its own, and a
    // transparent canvas composited over the surface would show this page's own colors
    // blended with the site's — which is not what the renderer draws.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    const bitmap = canvas.transferToImageBitmap();
    post(
      {
        type: "page",
        page_index: pageIndex,
        bitmap,
        width: canvas.width,
        height: canvas.height,
        // The transform the marker geometry has to agree with, handed over rather than
        // reconstructed on the other side: same viewport, same numbers, one owner.
        viewport_transform: [...viewport.transform],
      },
      [bitmap],
    );
  } catch (err) {
    post({ type: "page_failed", page_index: pageIndex, reason: String(err?.message || err) });
  }
}

self.onmessage = async (event) => {
  const message = event.data || {};
  try {
    if (message.type === "inspect") await inspect(message);
    else if (message.type === "render") await renderPage(message);
    else if (message.type === "reset") await closeRenderState();
  } catch (err) {
    post({ type: "crashed", reason: String(err?.message || err) });
  }
};
