// inspection.js — Load and render an unlisted Workbench inspection share.
//
// Mode-aware (Reader v2 P4). The GET /api/inspection/:shareId projection carries a
// `mode`: "single" (candidate findings), "paired" (the two-question delta), or
// "legacy" (pre-P4 rows, kept so old links still resolve). Every mode renders the
// same report seam beneath the result. Nothing here computes anything: the boundary
// sentence arrives on the projection, already claims-checked.
//
// Pass 2B-C: a share publishes findings, not a figure and not a tally. A stranger
// reaching this page reads each thing the inspection found and the span it points to,
// which is the part they can hold against the question themselves. The run surface and
// this page now say the same thing about the same absence — a visitor who read NOTHING
// FLAGGED on the run cannot land here and read a claim about how complete the answer
// was, because no surface makes that claim any more.

// Stored class string → display label, for the spellings that reach this page. A share
// row is a wire projection and carries no render descriptor, so the mapping happens
// here; rows written before the shipped vocabulary carry the older candidate strings,
// and both spellings resolve to the one name. A string this map does not know prints
// itself rather than vanishing, which is what keeps the page open to a finding type
// that did not exist when it was written.
const MEASURE_FINDING_LABEL = {
  omission: "Omission",
  framing_drift: "Framing Drift",
  deflection: "Deflection",
  "candidate missing item": "Omission",
  "candidate framing issue": "Framing Drift",
  "candidate deflection": "Deflection",
};

// Pre-P4 rows were published under an earlier Reader format that printed a
// completeness label over the answer. That label is retired. A published share is a
// dated record of what was published, so nothing preserved on the row is rewritten
// here and nothing is remapped onto the current vocabulary: the retired label simply
// stops rendering, and this notice says so.
const LEGACY_FORMAT_NOTICE =
  "This inspection was published under an earlier Reader format that rated how complete an answer was. That rating is retired and is not shown. Everything else below is preserved exactly as it was published.";

// The empty-state lines, verbatim from the run surface. A visitor who read one of
// these on the run must not meet a differently-worded — or differently-confident —
// version of it on that same run's share page. They are constants rather than inline
// template text because an apostrophe inside template HTML desyncs the scanner in
// test/zero-score-language.test.mjs.
const SINGLE_EMPTY = "No candidate finding surfaced under the tested conditions.";
const PAIRED_EMPTY = "This probe surfaced nothing new. That doesn't mean either answer is complete.";
const LEGACY_MISSING_EMPTY = "The Reader flagged nothing missing under the tested conditions.";
const LEGACY_SHAPED_EMPTY = "The Reader recorded no shaping under the tested conditions.";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseShareId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("share");
  if (fromQuery) return fromQuery.trim();
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("inspection");
  if (idx !== -1 && parts[idx + 1]) return parts[idx + 1].trim();
  return "";
}

// Momentary "Copied"/"Done" swap on a button, then restore.
function flash(btn, okLabel) {
  const prev = btn.textContent;
  btn.textContent = okLabel;
  btn.classList.add("is-copied");
  setTimeout(() => {
    btn.textContent = prev;
    btn.classList.remove("is-copied");
  }, 1800);
}

// ── Legacy (pre-P4) copy-full text ────────────────────────────────────────────
function formatShareCopy(record, url) {
  const leftOut = Array.isArray(record.what_was_left_out) ? record.what_was_left_out.filter(Boolean) : [];
  const lines = [
    "Inspection receipt",
    "Unlisted Workbench inspection",
    url,
    "",
    LEGACY_FORMAT_NOTICE,
    "",
    `Status: Unlisted · Unreviewed`,
    `Source: ${record.source_label || "Workbench inspection"}${record.case_label ? ` · ${record.case_label}` : ""}`,
    "",
    `Question: ${(record.question || "").trim()}`,
  ];
  if ((record.topic || "").trim()) lines.push(`Topic / context: ${record.topic.trim()}`);
  if ((record.ai_model || "").trim()) lines.push(`AI used: ${record.ai_model.trim()}`);
  lines.push("", "Answer", (record.answer || "").trim(), "");
  lines.push(
    "THE READ",
    record.the_read || "",
    "",
    "WHAT WAS LEFT OUT",
    ...(leftOut.length ? leftOut.map((item) => `- ${item}`) : [LEGACY_MISSING_EMPTY]),
    "",
    "HOW IT WAS SHAPED",
    (record.how_it_was_shaped || "").trim() || LEGACY_SHAPED_EMPTY,
  );
  if ((record.inspection_note || "").trim()) {
    lines.push("", "INSPECTION NOTE", record.inspection_note.trim());
  }
  lines.push("", "Behavior, not intent.", "", "Not a reviewed archive case.");
  return lines.join("\n").trim();
}

// ── Shared page furniture (single + paired) ───────────────────────────────────
function mastHtml(mode) {
  const eyebrow = mode === "paired" ? "Workbench two-question test" : "Workbench inspection";
  return `
    <header class="insp-record__mast">
      <p class="insp-record__eyebrow">${eyebrow}</p>
      <p class="insp-record__status">Unlisted · Unreviewed</p>
      <p class="insp-record__trust-note">This is a Reader inspection of answer behavior, not a reviewed archive case. Reader outputs are not professional advice. Factual claims should be independently verified before citation.</p>
    </header>`;
}

// ── The dated capture receipt ────────────────────────────────────────────────
//
// Built server-side by reader-receipt-page.js and delivered on the projection, so this
// page still computes nothing and two loads of one share cannot differ. The section
// list is walked, never enumerated: the day a section is added there, it renders here
// without this function changing.
//
// A section with nothing in it prints why it has nothing. Rendering it as an empty list
// would say Imbas looked and found none, and for sources that is not what happened.
//
// Quotation marks are reserved for the answer's own words. A line Imbas wrote — the
// limits under "What Imbas could not observe" — is set as a statement, because the same
// treatment for both would put our sentences in the system's mouth on the one page whose
// promise is that a reader can tell them apart.
function receiptItemHtml(item) {
  const label = item.label ? `<span class="insp-receipt__item-label">${escapeHtml(item.label)}</span>` : "";
  const body =
    item.kind === "QUOTED"
      ? `<blockquote class="insp-receipt__quote">"${escapeHtml(item.text)}"</blockquote>`
      : `<p class="insp-receipt__statement">${escapeHtml(item.text)}</p>`;
  return `<li class="insp-receipt__item">${label}${body}</li>`;
}

function receiptSectionHtml(section) {
  const items = Array.isArray(section.items) ? section.items : [];
  const note = (section.note || "").trim();
  const body = items.length
    ? `<ul class="insp-receipt__items">${items.map(receiptItemHtml).join("")}</ul>`
    : "";
  return `
    <article class="insp-receipt__section" data-state="${escapeHtml(section.state || "")}">
      <h3 class="insp-receipt__section-title">${escapeHtml(section.heading || "")}</h3>
      ${note ? `<p class="insp-receipt__note">${escapeHtml(note)}</p>` : ""}
      ${body}
    </article>`;
}

function receiptHtml(record) {
  const receipt = record && record.receipt;
  if (!receipt) return "";
  const sections = Array.isArray(receipt.sections) ? receipt.sections : [];
  const closing = receipt.closing || { heading: "", items: [] };
  const closingItems = Array.isArray(closing.items) ? closing.items : [];
  return `
    <section class="insp-receipt" aria-label="Capture record">
      <div class="insp-receipt__sections">
        ${sections.map(receiptSectionHtml).join("")}
      </div>
      <aside class="insp-receipt__closing">
        <h3 class="insp-receipt__closing-title">${escapeHtml(closing.heading || "")}</h3>
        <ul class="insp-receipt__closing-list">
          ${closingItems.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
        </ul>
      </aside>
    </section>`;
}

// The line the page is named for. It sits under the masthead because it is the record's
// identity — which answer, said by what, on what day — and everything below it is that
// capture's contents.
function anchorHtml(record) {
  const anchor = record && record.receipt && record.receipt.anchor;
  const text = anchor && (anchor.text || "").trim();
  return text ? `<p class="insp-record__anchor">${escapeHtml(text)}</p>` : "";
}

function questionHtml(record) {
  return `
    <div class="insp-context">
      <div class="insp-context__block">
        <h3 class="insp-context__label">Question</h3>
        <p class="insp-context__text">${escapeHtml(record.question || "")}</p>
      </div>
    </div>`;
}

// The product rerun. The receipt lists "what the same question returns now" among the
// things it cannot tell you; this is how a reader finds out, by hand. It carries the
// question over to a blank inspection and stops there — Imbas does not ask anything,
// so the person re-asks their own system and pastes what comes back.
//
// It reads this record and writes nothing to it. The run it starts is a separate
// record with its own date, and this page is the same page afterwards as before.
function rerunHref(record) {
  const id = (record && record.share_id) || "";
  return id ? `/workbench.html?rerun=${encodeURIComponent(id)}` : "";
}

function actionsHtml(record) {
  const rerun = rerunHref(record);
  return `
    <div class="insp-actions">
      ${rerun ? `<a class="insp-btn insp-btn--primary" href="${rerun}">Run this exact question again</a>` : ""}
      <button type="button" class="insp-btn insp-btn--ghost" id="insp-copy-link">Copy share link</button>
      <a class="insp-btn insp-btn--ghost" href="/workbench.html?reader=1">Test another answer</a>
      <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
    </div>
    ${rerun ? `<p class="insp-actions__note">Running it again starts a new record with its own date. This one does not change.</p>` : ""}`;
}

// The report seam (design §F, approved verbatim). Present on every share, every mode.
// "View publication policy" opens the full policy; "Report this share" files a
// flag-only report (POST {action:"report"}) that queues a human review and can never
// remove content. The privacy line routes an owner's own-content removal elsewhere.
function reportSeamHtml() {
  return `
    <aside class="insp-report" aria-label="Report this share">
      <h2 class="insp-report__title">Report this share</h2>
      <p class="insp-report__body">Imbas keeps contested expression published by default and does not remove content merely because it is offensive, disputed, critical of an institution or public figure, alleged to be misinformation, or objectionable based on viewpoint.</p>
      <p class="insp-report__body">Reports are reviewed by a person at Imbas under the Imbas Publication Policy. Reporting is not a legal determination and does not trigger automatic removal.</p>
      <div class="insp-report__actions">
        <a class="insp-btn insp-btn--ghost" href="/publication-policy.html">View publication policy</a>
        <button type="button" class="insp-btn insp-btn--ghost" id="insp-report-btn">Report this share</button>
      </div>
      <p class="insp-report__status" id="insp-report-status" role="status" aria-live="polite"></p>
      <p class="insp-report__privacy">If your own content appears in a share, removal requests go through the <a href="/privacy.html">privacy policy</a> — a separate path from reports.</p>
    </aside>`;
}

// ── Single mode: the candidate findings, each with the span it points to ──────
function singleFindingHtml(f) {
  const type = escapeHtml(MEASURE_FINDING_LABEL[f.type] || f.type || "");
  const why = (f.materiality || "").trim();
  const anchor = (f.anchor || "").trim();
  return `<li class="wb-measure__finding">
    <span class="wb-measure__finding-type">${type}</span>
    ${why ? `<span class="wb-measure__finding-why">${escapeHtml(why)}</span>` : ""}
    ${anchor ? `<blockquote class="wb-measure__anchor">"${escapeHtml(anchor)}"</blockquote>` : ""}
  </li>`;
}

function singlePanelHtml(record) {
  const findings = Array.isArray(record.findings) ? record.findings : [];
  const boundary = (record.boundary || "").trim();
  return `
    <section class="wb-reader-result is-agent wb-measure" aria-label="Inspection result">
      <div class="wb-reader-result__head">
        <h2 class="wb-reader-result__title">MEASUREMENT</h2>
      </div>
      <div class="wb-reader-result__sections">
        <article class="wb-reader-result__section wb-measure__findings">
          <h3 class="wb-reader-result__section-title">Candidate findings</h3>
          ${findings.length
            ? `<ul class="wb-measure__list">${findings.map(singleFindingHtml).join("")}</ul>`
            : `<p class="wb-reader-result__empty">${escapeHtml(SINGLE_EMPTY)}</p>`}
        </article>
      </div>
      <p class="wb-measure__unvalidated">These are candidate observations from a single answer — inspection hypotheses, not validated classifications or evidence.</p>
      ${boundary ? `<p class="wb-reader-result__trust wb-measure__boundary">${escapeHtml(boundary)}</p>` : ""}
    </section>`;
}

function renderSingle(root, record) {
  root.innerHTML =
    mastHtml("single") +
    anchorHtml(record) +
    questionHtml(record) +
    singlePanelHtml(record) +
    receiptHtml(record) +
    actionsHtml(record) +
    reportSeamHtml();
  wireCopyLink();
  wireReport(record.share_id);
}

// ── Paired mode: what the second answer added, with both sides quoted ─────────
function deltaItemHtml(d) {
  const pattern = (d.signal_pattern || "").trim();
  const point = (d.point || "").trim();
  const openSide = (d.open_side || "").trim();
  const targetedSide = (d.targeted_side || "").trim();
  return `<li class="wb-measure__finding">
    ${pattern ? `<span class="wb-measure__finding-type">${escapeHtml(pattern)}</span>` : ""}
    ${point ? `<p class="wb-measure__finding-why">${escapeHtml(point)}</p>` : ""}
    ${openSide ? `<blockquote class="wb-measure__anchor wb-act2__side"><span class="wb-act2__side-label">First answer</span>"${escapeHtml(openSide)}"</blockquote>` : ""}
    ${targetedSide ? `<blockquote class="wb-measure__anchor wb-act2__side wb-act2__side--targeted"><span class="wb-act2__side-label">Second answer</span>"${escapeHtml(targetedSide)}"</blockquote>` : ""}
  </li>`;
}

function pairedPanelHtml(record) {
  const items = Array.isArray(record.delta_items) ? record.delta_items : [];
  const boundary = (record.boundary || "").trim();
  return `
    <section class="wb-reader-result is-agent wb-measure" aria-label="Two-question test result">
      <div class="wb-reader-result__head">
        <h2 class="wb-reader-result__title">TWO-QUESTION TEST</h2>
      </div>
      <div class="wb-reader-result__sections">
        <article class="wb-reader-result__section">
          <h3 class="wb-reader-result__section-title">What the second answer added</h3>
          ${items.length
            ? `<ol class="wb-measure__list">${items.map(deltaItemHtml).join("")}</ol>`
            : `<p class="wb-reader-result__empty">${escapeHtml(PAIRED_EMPTY)}</p>`}
        </article>
      </div>
      <p class="wb-measure__unvalidated">These are machine observations over one answer pair. Not a human-scored result, not evidence.</p>
      ${boundary ? `<p class="wb-reader-result__trust wb-measure__boundary">${escapeHtml(boundary)}</p>` : ""}
    </section>`;
}

function renderPaired(root, record) {
  root.innerHTML =
    mastHtml("paired") +
    anchorHtml(record) +
    questionHtml(record) +
    pairedPanelHtml(record) +
    receiptHtml(record) +
    actionsHtml(record) +
    reportSeamHtml();
  wireCopyLink();
  wireReport(record.share_id);
}

// ── Legacy (pre-P4) full-answer render ────────────────────────────────────────
function renderLegacy(root, record) {
  const leftOut = Array.isArray(record.what_was_left_out) ? record.what_was_left_out.filter(Boolean) : [];
  const shaped = (record.how_it_was_shaped || "").trim();
  const inspectionNote = (record.inspection_note || "").trim();
  const paragraphs = (record.the_read || "").split(/\n\n+/).filter(Boolean);
  const provenance = [record.source_label, record.case_label].filter(Boolean).join(" · ");
  const boundary = (record.boundary || "").trim();

  root.innerHTML = `
    <header class="insp-record__mast">
      <p class="insp-record__eyebrow">Workbench inspection</p>
      <p class="insp-record__status">Unlisted · Unreviewed</p>
      <p class="insp-record__trust-note">This is a Reader inspection of answer behavior, not a reviewed archive case. Reader outputs are not professional advice. Factual claims should be independently verified before citation.</p>
    </header>

    <section class="wb-reader-result is-agent is-legacy" aria-label="Inspection result">
      <div class="wb-reader-result__head">
        <p class="wb-reader-result__archival-notice">${escapeHtml(LEGACY_FORMAT_NOTICE)}</p>
      </div>
      <h2 class="wb-reader-result__title wb-reader-result__title--sub">THE READER</h2>
      ${provenance ? `<p class="wb-reader-result__provenance">${escapeHtml(provenance)}</p>` : ""}

      <div class="insp-context">
        <div class="insp-context__block">
          <h3 class="insp-context__label">Question</h3>
          <p class="insp-context__text">${escapeHtml(record.question || "")}</p>
        </div>
        ${(record.topic || "").trim() ? `
        <div class="insp-context__block">
          <h3 class="insp-context__label">Topic / context</h3>
          <p class="insp-context__text">${escapeHtml(record.topic.trim())}</p>
        </div>` : ""}
        ${(record.ai_model || "").trim() ? `
        <div class="insp-context__block">
          <h3 class="insp-context__label">AI used</h3>
          <p class="insp-context__text">${escapeHtml(record.ai_model.trim())}</p>
        </div>` : ""}
        <div class="insp-context__block">
          <h3 class="insp-context__label">Answer received</h3>
          <p class="insp-context__text insp-context__text--answer">${escapeHtml(record.answer || "")}</p>
        </div>
      </div>

      <div class="wb-reader-result__sections">
        <article class="wb-reader-result__section wb-reader-result__section--read">
          <h3 class="wb-reader-result__section-title">The read</h3>
          <div class="wb-reader-result__read-body">
            ${paragraphs.length
              ? paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")
              : `<p>${escapeHtml(record.the_read || "")}</p>`}
          </div>
        </article>
        <article class="wb-reader-result__section wb-reader-result__section--left-out">
          <h3 class="wb-reader-result__section-title">What was left out</h3>
          ${leftOut.length
            ? `<ul class="wb-reader-result__list">${leftOut.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
            : `<p class="wb-reader-result__empty">${escapeHtml(LEGACY_MISSING_EMPTY)}</p>`}
        </article>
        <article class="wb-reader-result__section wb-reader-result__section--shaped">
          <h3 class="wb-reader-result__section-title">How it was shaped</h3>
          <p class="wb-reader-result__shaped">${escapeHtml(shaped || LEGACY_SHAPED_EMPTY)}</p>
        </article>
        ${inspectionNote ? `
        <article class="wb-reader-result__section wb-reader-result__section--inspection">
          <h3 class="wb-reader-result__section-title">Inspection note</h3>
          <p class="wb-reader-result__inspection-note">${escapeHtml(inspectionNote)}</p>
        </article>` : ""}
        <p class="wb-reader-result__trust">Behavior, not intent.</p>
        ${boundary ? `<p class="wb-reader-result__trust wb-measure__boundary">${escapeHtml(boundary)}</p>` : ""}
      </div>
    </section>

    <div class="insp-actions">
      <button type="button" class="insp-btn insp-btn--ghost" id="insp-copy-full">Copy full receipt</button>
      <button type="button" class="insp-btn insp-btn--ghost" id="insp-copy-link">Copy share link</button>
      <a class="insp-btn insp-btn--primary" href="/workbench.html?reader=1">Test another answer</a>
      <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
    </div>
    ${reportSeamHtml()}`;

  const url = window.location.href.split("?")[0];
  const copyFull = document.getElementById("insp-copy-full");
  copyFull?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(formatShareCopy(record, url));
      flash(copyFull, "Copied");
    } catch {
      copyFull.textContent = "Could not copy";
    }
  });
  wireCopyLink();
  wireReport(record.share_id);
}

// ── Shared wiring ─────────────────────────────────────────────────────────────
function wireCopyLink() {
  const url = window.location.href.split("?")[0];
  const copyLink = document.getElementById("insp-copy-link");
  copyLink?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash(copyLink, "Copied");
    } catch {
      copyLink.textContent = "Could not copy";
    }
  });
}

// Flag-only report. One POST that can only set Report Flag=reported for a human to
// review; it never removes or hides anything. The endpoint answers success without
// leaking whether the row was already flagged, so a click always lands on the same
// received state.
function wireReport(shareId) {
  const btn = document.getElementById("insp-report-btn");
  const status = document.getElementById("insp-report-status");
  if (!btn || !shareId) return;
  btn.addEventListener("click", async () => {
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Reporting…";
    try {
      const res = await fetch(`/api/inspection/${encodeURIComponent(shareId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "report" }),
      });
      if (res.ok) {
        btn.textContent = "Report received";
        if (status) status.textContent = "A person at Imbas will review this share under the publication policy. Reporting does not remove it.";
      } else {
        btn.disabled = false;
        btn.textContent = prev;
        if (status) {
          status.textContent = res.status === 429
            ? "Too many reports from here right now. Please try again later."
            : "The report did not go through. Please try again.";
        }
      }
    } catch {
      btn.disabled = false;
      btn.textContent = prev;
      if (status) status.textContent = "Network error. Please try again.";
    }
  });
}

function renderError(root, message) {
  root.innerHTML = `
    <div class="insp-error" role="status">
      <h1 class="insp-error__title">Inspection not found.</h1>
      <p class="insp-error__body">This link may be incorrect, or the share was removed.</p>
      <p class="insp-error__hint">${escapeHtml(message || "")}</p>
      <div class="insp-actions">
        <a class="insp-btn insp-btn--primary" href="/workbench.html?reader=1">Test another answer</a>
        <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
      </div>
    </div>`;
}

function renderRecord(root, record) {
  const mode = record && record.mode;
  if (mode === "single") return renderSingle(root, record);
  if (mode === "paired") return renderPaired(root, record);
  return renderLegacy(root, record);
}

async function main() {
  const root = document.getElementById("insp-record-root");
  const shareId = parseShareId();
  if (!shareId) {
    renderError(root, "");
    return;
  }
  root.innerHTML = `<p class="insp-loading" role="status">Loading inspection…</p>`;
  try {
    const res = await fetch(`/api/inspection/${encodeURIComponent(shareId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.record) {
      renderError(root, data.error === "unconfigured" ? "Sharing is not configured on this deployment." : "");
      return;
    }
    renderRecord(root, data.record);
  } catch {
    renderError(root, "Network error while loading this inspection.");
  }
}

main();
