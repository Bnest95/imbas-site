// Unit tests for api/inspection-view.js — the per-share OG server-render.
// Runs with the built-in runner, no deps:  node --test test/
//
// Covers: hostile-input escaping in the injected <head>, body byte-identity,
// the 404 / 503 / invalid-id / hit branches, and the routing rewrite.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  escapeHtml,
  buildTitle,
  buildDescription,
  renderShareHtml,
  createHandler,
} from "../api/inspection-view.js";

const TEMPLATE = readFileSync(new URL("../inspection.html", import.meta.url), "utf8");
const bodyOf = (html) => html.slice(html.indexOf("</head>") + "</head>".length);

// A deliberately hostile record: <script>, double quotes, ampersands, a "$&"
// (which would corrupt a naive String.replace), and an answer that must never leak.
const HOSTILE = {
  share_id: "abc123DEF456ghi789jk",
  question: `<script>alert("xss")</script> Tom & Jerry's "best" $&`,
  completeness: "thin",
  what_was_left_out: ["one", "two"],
  how_it_was_shaped: 'framed & <b>bold</b> "cost"',
  answer: "SECRET_ANSWER_TEXT_SHOULD_NEVER_APPEAR",
};

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    send(b) { this.body = b; return this; },
    json(o) { this.body = o; return this; },
  };
}

test("escapeHtml escapes the five significant characters", () => {
  assert.equal(escapeHtml(`<a href="x" title='y'>& z</a>`),
    "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp; z&lt;/a&gt;");
});

test("renderShareHtml: hostile question is fully escaped in the head", () => {
  const html = renderShareHtml(TEMPLATE, HOSTILE, "https://www.imbaslabs.com");
  const head = html.slice(0, html.indexOf("</head>"));

  // The dangerous raw sequence never appears anywhere in the output.
  assert.ok(!html.includes("<script>alert"), "raw <script> must be escaped");
  // It appears in its escaped form instead.
  assert.ok(head.includes("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"),
    "escaped script tag present in head");
  // Ampersand escaped; the literal "$" survived (function replacer, not $-substitution).
  assert.ok(head.includes("$&amp;"), "ampersand escaped and $ preserved literally");
  assert.ok(head.includes("&#39;"), "single quote in Jerry's escaped");
});

test("renderShareHtml: OG/Twitter tags present and well-formed", () => {
  const html = renderShareHtml(TEMPLATE, HOSTILE, "https://www.imbaslabs.com");
  const head = html.slice(0, html.indexOf("</head>"));

  assert.match(head, /<meta property="og:title" content="THIN · /);
  assert.ok(head.includes(`<meta property="og:type" content="article">`));
  assert.ok(head.includes(`<meta name="twitter:card" content="summary_large_image">`));
  assert.ok(head.includes(`<meta property="og:url" content="https://www.imbaslabs.com/inspection/abc123DEF456ghi789jk">`));
  assert.ok(head.includes(`<meta property="og:image" content="https://www.imbaslabs.com/og-image.png">`));
  // og:description carries the verdict gloss + item count, never the answer text.
  assert.match(head, /<meta property="og:description" content="[^"]*2 items left out\./);
  assert.ok(!html.includes("SECRET_ANSWER_TEXT"), "answer text must never appear");
});

test("renderShareHtml: exactly one title/head, body byte-identical to template", () => {
  const html = renderShareHtml(TEMPLATE, HOSTILE, "https://www.imbaslabs.com");
  assert.equal((html.match(/<\/head>/g) || []).length, 1);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/<\/title>/g) || []).length, 1);
  assert.equal(bodyOf(html), bodyOf(TEMPLATE), "everything after </head> is unchanged");
});

test("buildTitle truncates the question to 80 chars with an ellipsis", () => {
  const long = "q ".repeat(100).trim();
  const title = buildTitle({ completeness: "full", question: long });
  const inner = title.slice(title.indexOf(`"`) + 1, title.lastIndexOf(`"`));
  assert.ok(inner.length <= 81, "truncated question <= 80 chars + ellipsis");
  assert.ok(inner.endsWith("…"));
  assert.ok(title.startsWith("FULL · "));
});

test("buildDescription: singular vs plural item count, no answer leakage", () => {
  const one = buildDescription({ completeness: "partial", what_was_left_out: ["x"], answer: "A" });
  assert.ok(one.includes("1 item left out."));
  const none = buildDescription({ completeness: "full", what_was_left_out: [] });
  assert.ok(none.includes("0 items left out."));
  assert.ok(!one.includes("A") || !one.includes("answer"), "no answer text in description");
});

test("handler: valid hit → 200, cache header, OG injected", async () => {
  const handler = createHandler({
    fetchShareById: async () => HOSTILE,
    isConfigured: () => true,
    siteOrigin: () => "https://www.imbaslabs.com",
  });
  const res = mockRes();
  await handler({ method: "GET", query: { shareId: HOSTILE.share_id }, headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers["cache-control"], "public, s-maxage=3600, stale-while-revalidate=86400");
  assert.ok(res.body.includes(`property="og:title"`));
});

test("handler: not found → 404, no OG, no-store", async () => {
  const handler = createHandler({
    fetchShareById: async () => null,
    isConfigured: () => true,
    siteOrigin: () => "https://x",
  });
  const res = mockRes();
  await handler({ method: "GET", query: { shareId: "abc123DEF456ghi789jk" }, headers: {} }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.headers["cache-control"], "private, no-store");
  assert.ok(!res.body.includes(`property="og:title"`), "no per-share OG on a miss");
});

test("handler: invalid id shape → 404 without touching Airtable", async () => {
  let called = false;
  const handler = createHandler({
    fetchShareById: async () => { called = true; return HOSTILE; },
    isConfigured: () => true,
    siteOrigin: () => "https://x",
  });
  const res = mockRes();
  await handler({ method: "GET", query: { shareId: "too-short" }, headers: {} }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(called, false, "invalid ids never hit the store");
});

test("handler: sharing unconfigured → 503 (flips to 404 once env is set)", async () => {
  const handler = createHandler({
    fetchShareById: async () => HOSTILE,
    isConfigured: () => false,
    siteOrigin: () => "https://x",
  });
  const res = mockRes();
  await handler({ method: "GET", query: { shareId: HOSTILE.share_id }, headers: {} }, res);
  assert.equal(res.statusCode, 503);
});

test("handler: non-GET → 405", async () => {
  const handler = createHandler({ isConfigured: () => true, siteOrigin: () => "https://x" });
  const res = mockRes();
  await handler({ method: "POST", query: {}, headers: {} }, res);
  assert.equal(res.statusCode, 405);
});

test("routing: vercel.json rewrites /inspection/:shareId to the new function", () => {
  const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const rw = (vercel.rewrites || []).find((r) => r.source === "/inspection/:shareId");
  assert.ok(rw, "rewrite for /inspection/:shareId exists");
  assert.equal(rw.destination, "/api/inspection-view?shareId=:shareId");
  const stale = (vercel.redirects || []).some((r) => r.source === "/inspection/:shareId");
  assert.equal(stale, false, "the old 302 redirect is gone");
});
