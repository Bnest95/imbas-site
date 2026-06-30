// inspection.js — Load and render an unlisted Workbench inspection record.

const COMPLETENESS_LABEL = { full: "FULL", partial: "PARTIAL", thin: "THIN" };
const COMPLETENESS_GLOSS = {
  full: "The answer substantially served the question.",
  partial: "Some material context was missing or shaped.",
  thin: "The answer was evasive or substantially incomplete.",
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function formatShareCopy(record, url) {
  const comp = (record.completeness || "partial").toUpperCase();
  const gloss = COMPLETENESS_GLOSS[record.completeness] || COMPLETENESS_GLOSS.partial;
  const leftOut = Array.isArray(record.what_was_left_out) ? record.what_was_left_out.filter(Boolean) : [];
  const lines = [
    "Inspection record",
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

function renderError(root, message) {
  root.innerHTML = `
    <div class="insp-error" role="status">
      <h1 class="insp-error__title">Inspection record not found.</h1>
      <p class="insp-error__body">This link may be incorrect, expired, or no longer available.</p>
      <p class="insp-error__hint">${escapeHtml(message || "")}</p>
      <div class="insp-actions">
        <a class="insp-btn insp-btn--primary" href="/workbench.html?reader=1">Test another answer</a>
        <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
      </div>
    </div>`;
}

function renderRecord(root, record) {
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
      <p class="insp-record__trust-note">This is a Reader inspection of answer behavior, not a reviewed archive case. Factual claims should be independently verified before citation.</p>
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
      <button type="button" class="insp-btn insp-btn--ghost" id="insp-copy-full">Copy full record</button>
      <button type="button" class="insp-btn insp-btn--ghost" id="insp-copy-link">Copy share link</button>
      <a class="insp-btn insp-btn--primary" href="/workbench.html?reader=1">Test another answer</a>
      <a class="insp-btn insp-btn--ghost" href="/archive.html">Explore reviewed archive</a>
    </div>`;

  const url = window.location.href.split("?")[0];
  const copyFull = document.getElementById("insp-copy-full");
  const copyLink = document.getElementById("insp-copy-link");
  const flash = (btn, okLabel) => {
    const prev = btn.textContent;
    btn.textContent = okLabel;
    btn.classList.add("is-copied");
    setTimeout(() => {
      btn.textContent = prev;
      btn.classList.remove("is-copied");
    }, 1800);
  };
  copyFull?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(formatShareCopy(record, url));
      flash(copyFull, "Copied");
    } catch {
      copyFull.textContent = "Could not copy";
    }
  });
  copyLink?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash(copyLink, "Copied");
    } catch {
      copyLink.textContent = "Could not copy";
    }
  });
}

async function main() {
  const root = document.getElementById("insp-record-root");
  const shareId = parseShareId();
  if (!shareId) {
    renderError(root, "");
    return;
  }
  root.innerHTML = `<p class="insp-loading" role="status">Loading inspection record…</p>`;
  try {
    const res = await fetch(`/api/inspection/${encodeURIComponent(shareId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.record) {
      renderError(root, data.error === "unconfigured" ? "Sharing is not configured on this deployment." : "");
      return;
    }
    renderRecord(root, data.record);
  } catch {
    renderError(root, "Network error while loading this record.");
  }
}

main();
