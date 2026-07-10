// inspection.js — Load and render an unlisted Workbench inspection share.
//
// Mode-aware (Reader v2 P4). The GET /api/inspection/:shareId projection carries a
// `mode`: "single" (candidate findings + candidate gap estimate), "paired" (the
// two-question delta + machine gap estimate), or "legacy" (pre-P4 rows: the original
// full-answer render, kept so old links still resolve). Every mode renders the same
// report seam beneath the result. Nothing here computes an estimate or a boundary:
// the label and boundary sentence arrive on the projection, already claims-checked.

const COMPLETENESS_LABEL = { full: "FULL", partial: "PARTIAL", thin: "THIN" };
const COMPLETENESS_GLOSS = {
  full: "The answer substantially served the question.",
  partial: "Some material context was missing or shaped.",
  thin: "The answer was evasive or substantially incomplete.",
};
// Candidate finding type → display label. Mirrors MEASURE_FINDING_LABEL in the
// Workbench so a share reads as the same instrument that produced it.
const MEASURE_FINDING_LABEL = {
  "candidate missing item": "Candidate missing item",
  "candidate framing issue": "Candidate framing issue",
  "candidate deflection": "Candidate deflection",
};

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
  const comp = (record.completeness || "partial").toUpperCase();
  const gloss = COMPLETENESS_GLOSS[record.completeness] || COMPLETENESS_GLOSS.partial;
  const leftOut = Array.isArray(record.what_was_left_out) ? record.what_was_left_out.filter(Boolean) : [];
  const lines = [
    "Inspection receipt",
    "Unlisted Workbench inspection",
    url,
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
    `Completeness: ${comp}`,
    gloss,
    "",
    "THE READ",
    record.the_read || "",
    "",
    "WHAT WAS LEFT OUT",
    ...(leftOut.length ? leftOut.map((item) => `- ${item}`) : ["- (none identified)"]),
    "",
    "HOW IT WAS SHAPED",
    (record.how_it_was_shaped || "").trim() || "(none detected)",
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

function questionHtml(record) {
  return `
    <div class="insp-context">
      <div class="insp-context__block">
        <h3 class="insp-context__label">Question</h3>
        <p class="insp-context__text">${escapeHtml(record.question || "")}</p>
      </div>
    </div>`;
}

function actionsHtml() {
  return `
    <div class="insp-actions">
      <button type="button" class="insp-btn insp-btn--ghost" id="insp-copy-link">Copy share link</button>
      <a class="insp-btn insp-btn--primary" href="/workbench.html?reader=1">Test another answer</a>
      <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
    </div>`;
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

// ── Single mode: candidate findings + candidate gap estimate ──────────────────
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
  const counts = { "candidate missing item": 0, "candidate framing issue": 0, "candidate deflection": 0 };
  findings.forEach((f) => {
    if (counts[f.type] != null) counts[f.type] += 1;
  });
  const label = (record.gap_estimate_label || "").trim();
  const boundary = (record.boundary || "").trim();
  return `
    <section class="wb-reader-result is-agent wb-measure" aria-label="Inspection result">
      <div class="wb-reader-result__head">
        <h2 class="wb-reader-result__title">MEASUREMENT</h2>
      </div>
      ${label ? `<div class="wb-measure__estimate"><div class="wb-measure__estimate-value">${escapeHtml(label)}</div></div>` : ""}
      <div class="wb-reader-result__sections">
        <article class="wb-reader-result__section wb-measure__findings">
          <h3 class="wb-reader-result__section-title">Candidate findings</h3>
          <p class="wb-measure__counts">Missing item: ${counts["candidate missing item"]} · Framing issue: ${counts["candidate framing issue"]} · Deflection: ${counts["candidate deflection"]}</p>
          ${findings.length
            ? `<ul class="wb-measure__list">${findings.map(singleFindingHtml).join("")}</ul>`
            : `<p class="wb-reader-result__empty">No candidate findings — the answer read clean.</p>`}
        </article>
      </div>
      <p class="wb-measure__unvalidated">These are candidate observations from a single answer — inspection hypotheses, not validated classifications or evidence.</p>
      ${boundary ? `<p class="wb-reader-result__trust wb-measure__boundary">${escapeHtml(boundary)}</p>` : ""}
    </section>`;
}

function renderSingle(root, record) {
  root.innerHTML = mastHtml("single") + questionHtml(record) + singlePanelHtml(record) + actionsHtml() + reportSeamHtml();
  wireCopyLink();
  wireReport(record.share_id);
}

// ── Paired mode: the two-question delta + machine gap estimate ────────────────
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
  const counts = { Omission: 0, "Framing Drift": 0, Deflection: 0 };
  items.forEach((d) => {
    if (counts[d.signal_pattern] != null) counts[d.signal_pattern] += 1;
  });
  const label = (record.gap_estimate_label || "").trim();
  const boundary = (record.boundary || "").trim();
  return `
    <section class="wb-reader-result is-agent wb-measure" aria-label="Two-question test result">
      <div class="wb-reader-result__head">
        <h2 class="wb-reader-result__title">TWO-QUESTION TEST</h2>
      </div>
      ${label ? `<div class="wb-measure__estimate"><div class="wb-measure__estimate-value">${escapeHtml(label)}</div></div>` : ""}
      <div class="wb-reader-result__sections">
        <article class="wb-reader-result__section">
          <h3 class="wb-reader-result__section-title">The delta</h3>
          <p class="wb-measure__counts">Omission: ${counts.Omission} · Framing Drift: ${counts["Framing Drift"]} · Deflection: ${counts.Deflection}</p>
          ${items.length
            ? `<ol class="wb-measure__list">${items.map(deltaItemHtml).join("")}</ol>`
            : `<p class="wb-reader-result__empty">No material gap. The direct question surfaced nothing decision-relevant the first answer left out.</p>`}
        </article>
      </div>
      <p class="wb-measure__unvalidated">This is a machine estimate over one answer pair. Not a human-scored result, not evidence.</p>
      ${boundary ? `<p class="wb-reader-result__trust wb-measure__boundary">${escapeHtml(boundary)}</p>` : ""}
    </section>`;
}

function renderPaired(root, record) {
  root.innerHTML = mastHtml("paired") + questionHtml(record) + pairedPanelHtml(record) + actionsHtml() + reportSeamHtml();
  wireCopyLink();
  wireReport(record.share_id);
}

// ── Legacy (pre-P4) full-answer render ────────────────────────────────────────
function renderLegacy(root, record) {
  const comp = record.completeness || "partial";
  const gloss = COMPLETENESS_GLOSS[comp] || COMPLETENESS_GLOSS.partial;
  const leftOut = Array.isArray(record.what_was_left_out) ? record.what_was_left_out.filter(Boolean) : [];
  const shaped = (record.how_it_was_shaped || "").trim();
  const inspectionNote = (record.inspection_note || "").trim();
  const paragraphs = (record.the_read || "").split(/\n\n+/).filter(Boolean);
  const provenance = [record.source_label, record.case_label].filter(Boolean).join(" · ");

  root.innerHTML = `
    <header class="insp-record__mast">
      <p class="insp-record__eyebrow">Workbench inspection</p>
      <p class="insp-record__status">Unlisted · Unreviewed</p>
      <p class="insp-record__trust-note">This is a Reader inspection of answer behavior, not a reviewed archive case. Reader outputs are not professional advice. Factual claims should be independently verified before citation.</p>
    </header>

    <section class="wb-reader-result is-agent is-${escapeHtml(comp)}" aria-label="Inspection result">
      <div class="wb-reader-result__head">
        <div class="wb-reader-result__status is-${escapeHtml(comp)}">
          <div class="wb-reader-result__badge is-${escapeHtml(comp)}">${COMPLETENESS_LABEL[comp] || "PARTIAL"}</div>
          <p class="wb-reader-result__badge-gloss">${escapeHtml(gloss)}</p>
        </div>
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
            : `<p class="wb-reader-result__empty">No major substantive omissions identified.</p>`}
        </article>
        <article class="wb-reader-result__section wb-reader-result__section--shaped">
          <h3 class="wb-reader-result__section-title">How it was shaped</h3>
          <p class="wb-reader-result__shaped">${escapeHtml(shaped || "No meaningful shaping detected.")}</p>
        </article>
        ${inspectionNote ? `
        <article class="wb-reader-result__section wb-reader-result__section--inspection">
          <h3 class="wb-reader-result__section-title">Inspection note</h3>
          <p class="wb-reader-result__inspection-note">${escapeHtml(inspectionNote)}</p>
        </article>` : ""}
        <p class="wb-reader-result__trust">Behavior, not intent.</p>
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
