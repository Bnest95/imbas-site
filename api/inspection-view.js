// api/inspection-view.js — Server-render the unlisted inspection page with per-share
// Open Graph tags so shared links unfurl in social/chat previews. The page stays
// noindex,nofollow and unlisted: OG unfurling and search indexing are orthogonal.
//
// Everything after </head> is served byte-identical to inspection.html, so the
// client renderer (inspection.js) is untouched — only the <head> gains a per-share
// <title> plus OG/Twitter meta. Question and record text are HOSTILE user input:
// every injected value is HTML-escaped, and replacements use function replacers so
// a "$" in the question can't trigger String.replace's special patterns.
//
// Serves /inspection/:shareId via a rewrite in vercel.json. Dependency-free.
//
// Required env (same as the share endpoints):
//   AIRTABLE_TOKEN                    — read scope on the base
//   AIRTABLE_INSPECTION_SHARES_TABLE  — tbl ID for Inspection Shares
//   AIRTABLE_BASE                     — optional, defaults appfxHraqlcpP1AAP
//   SITE_ORIGIN                       — optional, e.g. https://www.imbaslabs.com

import { readFileSync } from "node:fs";
import { fetchShareById } from "./inspection-share.js";

const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,32}$/;
const COMPLETENESS_LABEL = { full: "FULL", partial: "PARTIAL", thin: "THIN" };
const COMPLETENESS_GLOSS = {
  full: "The answer substantially served the question.",
  partial: "Some material context was missing or shaped.",
  thin: "The answer was evasive or substantially incomplete.",
};
const OG_IMAGE_PATH = "/og-image.png";

// Read the static shell once at module load. @vercel/nft traces a readFileSync on a
// URL relative to import.meta.url and bundles inspection.html alongside the function.
const TEMPLATE = readFileSync(new URL("../inspection.html", import.meta.url), "utf8");

const str = (v) => (typeof v === "string" ? v : "");

// Escapes the five characters that matter across both HTML element content
// (<title>…</title>) and double-quoted attribute values (content="…"): & < > " '.
// Stricter than inspection.js (which omits '); safe in every injection site here.
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s, max) {
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

// {VERDICT} · "{question ≤80 chars}" · Imbas Reader — assembled raw, then escaped whole
// (so truncation never splits an entity and the decorative quotes get escaped for the
// content="…" attribute).
export function buildTitle(record) {
  const comp = str(record.completeness).toLowerCase();
  const verdict = COMPLETENESS_LABEL[comp] || "PARTIAL";
  const question = truncate(str(record.question), 80);
  return `${verdict} · "${question}" · Imbas Reader`;
}

// One line: what surfaced (completeness gloss) · what was missing (N items) · how it
// was shaped. NEVER includes answer text. Bounded, whitespace-collapsed, then escaped.
export function buildDescription(record) {
  const comp = str(record.completeness).toLowerCase();
  const gloss = COMPLETENESS_GLOSS[comp] || COMPLETENESS_GLOSS.partial;
  const leftOut = Array.isArray(record.what_was_left_out)
    ? record.what_was_left_out.filter(Boolean)
    : [];
  const n = leftOut.length;
  const missing = `${n} ${n === 1 ? "item" : "items"} left out.`;
  const shapedRaw = str(record.how_it_was_shaped).replace(/\s+/g, " ").trim();
  const shaped = shapedRaw ? `Shaping: ${shapedRaw}` : "No meaningful shaping detected.";
  return truncate(`${gloss} ${missing} ${shaped}`, 200);
}

// Inject the per-share <title> + OG/Twitter meta into the template head. The body
// (everything after </head>) is returned byte-identical. Function replacers keep a
// literal "$" in user input from triggering String.replace substitution patterns.
export function renderShareHtml(template, record, origin) {
  const safeTitle = escapeHtml(buildTitle(record));
  const safeDesc = escapeHtml(buildDescription(record));
  const base = String(origin || "").replace(/\/$/, "");
  const shareId = str(record.share_id);
  const pageUrl = escapeHtml(`${base}/inspection/${shareId}`);
  const imageUrl = escapeHtml(`${base}${OG_IMAGE_PATH}`);

  const meta = [
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDesc}">`,
    `<meta property="og:url" content="${pageUrl}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:image" content="${imageUrl}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].join("\n  ");

  return template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${safeTitle}</title>`)
    .replace("</head>", () => `  ${meta}\n</head>`);
}

function siteOrigin(req) {
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  if (host) return `${proto}://${host}`;
  return "https://www.imbaslabs.com";
}

function sendTemplate(res, template, status) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(status).send(template);
}

// Factory so the unit test can inject a stub fetchShareById / template / env check and
// exercise every branch without a network call. The default export wires the real deps.
export function createHandler(deps = {}) {
  const fetchShare = deps.fetchShareById || fetchShareById;
  const template = deps.template || TEMPLATE;
  const originOf = deps.siteOrigin || siteOrigin;
  const isConfigured =
    deps.isConfigured ||
    (() => !!(process.env.AIRTABLE_TOKEN && process.env.AIRTABLE_INSPECTION_SHARES_TABLE));

  return async function handler(req, res) {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(405).send("Method Not Allowed");
    }

    const shareId = str(req.query && req.query.shareId).trim();

    // Invalid id → current not-found behavior: the shell still renders and inspection.js
    // shows its "record not found" state; scrapers get a 404 (no unfurl).
    if (!SHARE_ID_RE.test(shareId)) {
      return sendTemplate(res, template, 404);
    }

    // Sharing not configured on this deployment → 503. Flips to 404 once
    // AIRTABLE_INSPECTION_SHARES_TABLE (and AIRTABLE_TOKEN) are set in prod.
    if (!isConfigured()) {
      return sendTemplate(res, template, 503);
    }

    try {
      const record = await fetchShare(shareId);
      if (!record) return sendTemplate(res, template, 404);
      const html = renderShareHtml(template, record, originOf(req));
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
      return res.status(200).send(html);
    } catch (e) {
      console.error("[inspection-view]", e && e.message ? e.message : "error");
      return sendTemplate(res, template, 502);
    }
  };
}

export default createHandler();
