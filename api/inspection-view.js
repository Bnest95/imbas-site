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
const OG_IMAGE_PATH = "/og-image.png";
// P4 mode descriptions — fixed, claims-safe copy. No figure, no answer text, single
// mode never says "left out". The static OG image carries no numbers by design
// (design §7), and after 2B-C neither does the record behind it.
const OG_SINGLE_DESC =
  "Unlisted · Unreviewed. An Imbas Reader inspection of one AI answer — candidate gaps flagged, unvalidated. Discovery, not evidence.";
// The paired card states how the pair was run, because an unfurl is where a shared
// result is read fastest and most carelessly. Whether the person reported the run
// conditions — and that Imbas did not check what they reported — belongs in the same
// breath as the result, not one click away.
//
// Two variants rather than one string plus an appended clause: the description is
// capped at 200 characters and truncation would cut a guard sentence mid-word. Each
// variant is composed to fit whole. "Unlisted · Unreviewed", "Unvalidated" and
// "Discovery, not evidence" survive in both.
//
// Neither variant reports the DERIVED matched state. The card says what was declared,
// or that nothing was, and stops.
const OG_PAIRED_DESC_DECLARED =
  "Unlisted · Unreviewed. An Imbas Reader two-question test — what a second AI answer surfaced that the first did not. How the pair was run: declared, not verified. Unvalidated. Discovery, not evidence.";
// Nothing reported is not a failed run and not a negative report. The wording says only
// that the record holds no declaration.
const OG_PAIRED_DESC_NOT_DECLARED =
  "Unlisted · Unreviewed. An Imbas Reader two-question test — what a second AI answer surfaced that the first did not. How the pair was run: not declared. Unvalidated. Discovery, not evidence.";
// Pre-P4 rows were published under a format that rated how complete an answer was.
// That rating is retired, so the unfurl no longer leads with it and no longer glosses
// it. The row itself is untouched: a published share is a dated record of what was
// published, and remapping its retired label onto today's vocabulary would rewrite
// what it said rather than stop repeating it.
const LEGACY_DESC =
  "Unlisted · Unreviewed. An Imbas Reader inspection published under an earlier format.";

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

// Mode-aware title. The slot the retired completeness word used to lead now names the
// instrument instead: every row reads "Imbas Reader · Unlisted · Unreviewed
// {inspection|two-question test}", so the card can never read as an Imbas verdict on
// self-authored text. The "Unlisted · Unreviewed" marker is load-bearing and stays
// contiguous. Only the question (≤80) is user text. Pre-P4 (legacy) rows lead the same
// way and say which format they were published under. Assembled raw, then escaped whole
// so truncation never splits an entity and the decorative quotes get escaped for the
// content="…" attr.
export function buildTitle(record) {
  const question = truncate(str(record.question), 80);
  const mode = str(record.mode);
  if (mode === "single") return `Imbas Reader · Unlisted · Unreviewed inspection · "${question}"`;
  if (mode === "paired")
    return `Imbas Reader · Unlisted · Unreviewed two-question test · "${question}"`;
  return `Imbas Reader · Unlisted · Unreviewed inspection (earlier format) · "${question}"`;
}

// Mode-aware description. Fixed claims-safe copy for every mode (never a figure,
// never answer text, single mode never says "left out"). Legacy rows carry the
// preserved item count and shaping note, which are the record, and no rating, which
// was the retired reading of it. The "Unlisted · Unreviewed" marker leads so it always
// survives the 200-char truncation (which only ever cuts the tail).
export function buildDescription(record) {
  const mode = str(record.mode);
  if (mode === "single") return truncate(OG_SINGLE_DESC, 200);
  if (mode === "paired") {
    const d = record.run_declaration;
    const declared = !!d && d.status === "DECLARED_NOT_VERIFIED";
    return truncate(declared ? OG_PAIRED_DESC_DECLARED : OG_PAIRED_DESC_NOT_DECLARED, 200);
  }
  const leftOut = Array.isArray(record.what_was_left_out)
    ? record.what_was_left_out.filter(Boolean)
    : [];
  const n = leftOut.length;
  const missing = `${n} ${n === 1 ? "item" : "items"} left out.`;
  const shapedRaw = str(record.how_it_was_shaped).replace(/\s+/g, " ").trim();
  const shaped = shapedRaw
    ? `Shaping: ${shapedRaw}`
    : "The Reader recorded no shaping under the tested conditions.";
  return truncate(`${LEGACY_DESC} ${missing} ${shaped}`, 200);
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
