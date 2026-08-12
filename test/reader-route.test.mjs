// The Reader page moved from workbench.html to reader.html, and the old URLs are the
// most-linked thing this site has. A rename is easy; a rename that quietly drops the
// redirect, or keeps the cdnjs CSP keyed on a path that no longer exists, is a page
// that loads blank in production and nowhere else. These hold the parts of that move
// that a local run cannot otherwise reach — vercel.json is read by Vercel, never by a
// test, so nothing here is checked at all unless something checks it here.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveNavigation, resolveReadiness } from "../scripts/qa/visual-acceptance.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const VERCEL = JSON.parse(read("vercel.json"));

const READER_PAGE = "/reader.html";
const CDNJS = "https://cdnjs.cloudflare.com";

// Every page a visitor can land on. Baselines under docs/qa/ are photographs of an
// older tree and are governed by the board, not by this file.
const LIVE_PAGES = fs
  .readdirSync(ROOT, { recursive: true })
  .filter((p) => typeof p === "string" && p.endsWith(".html"))
  .filter((p) => !p.startsWith("docs") && !p.startsWith("node_modules") && !p.startsWith("."));

test("the page is at reader.html and the old filename is gone", () => {
  assert.ok(fs.existsSync(path.join(ROOT, "reader.html")), "reader.html is missing");
  assert.ok(
    !fs.existsSync(path.join(ROOT, "workbench.html")),
    "workbench.html is back. Two files claiming to be the Reader is how one of them goes stale.",
  );
});

test("no live page or script still points a visitor at the old URL", () => {
  const offenders = [];
  for (const page of LIVE_PAGES) {
    if (read(page).includes("workbench.html")) offenders.push(page);
  }
  for (const js of ["inspection.js", "product-example-registry.js", "site-header.js", "styles.css"]) {
    if (read(js).includes("workbench.html")) offenders.push(js);
  }
  assert.deepEqual(
    offenders,
    [],
    `these still name workbench.html: ${offenders.join(", ")}. The redirect would catch a visitor, ` +
      "but an internal link that needs a redirect is a link that is wrong.",
  );
});

test("both old URLs redirect, permanently, and land on the Reader", () => {
  const table = new Map(VERCEL.redirects.map((r) => [r.source, r]));
  for (const source of ["/workbench", "/workbench.html"]) {
    const rule = table.get(source);
    assert.ok(rule, `${source} has no redirect. Every inbound link and bookmark to it 404s.`);
    assert.equal(rule.permanent, true, `${source} redirects temporarily; the move is not temporary.`);
  }
  assert.ok(table.has("/reader"), "/reader does not resolve, so the advertised URL is a 404.");

  // Follow each chain to a fixed point. Two hops is the shape today; what matters is
  // that it ends, and that it ends here.
  for (const source of ["/workbench", "/workbench.html", "/reader"]) {
    const seen = [source];
    let at = table.get(source).destination;
    while (table.has(at)) {
      assert.ok(!seen.includes(at), `redirect loop: ${seen.join(" -> ")} -> ${at}`);
      seen.push(at);
      at = table.get(at).destination;
    }
    assert.equal(at, READER_PAGE, `${source} ends at ${at}, not the Reader page.`);
  }
});

test("nothing redirects reader.html, which is the only reason no loop is constructible", () => {
  // /reader -> /reader.html is a redirect, not a rewrite. Give /reader.html a redirect
  // of its own and the two point at each other. This is the guard on that.
  const sources = VERCEL.redirects.map((r) => r.source);
  assert.ok(
    !sources.includes(READER_PAGE),
    `${READER_PAGE} has a redirect source. It is a redirect DESTINATION; making it both closes a loop.`,
  );
});

test("the share route survives the move, and no redirect can get in front of it", () => {
  // Every published share link on the internet is /inspection/<id>, and it resolves
  // through a rewrite. Vercel runs redirects FIRST — before the filesystem, before any
  // rewrite — so a redirect whose source matched a share path would take the request
  // before the rewrite ever ran, and every share published to date would 301 somewhere
  // else. Nothing in this move touched that route; this is what keeps the next one from
  // touching it either.
  const share = VERCEL.rewrites.find((r) => r.source === "/inspection/:shareId");
  assert.ok(share, "the /inspection/:shareId rewrite is gone. Every published share link 404s.");
  assert.equal(share.destination, "/api/inspection-view?shareId=:shareId");

  // Compile each redirect source the way Vercel reads it — `:param` matches one segment —
  // and run real share paths at the whole table.
  const matches = (source, url) => {
    const pattern = source
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/:[A-Za-z0-9_]+\*/g, ".*")
      .replace(/:[A-Za-z0-9_]+/g, "[^/]+");
    return new RegExp(`^${pattern}/?$`).test(url);
  };
  for (const url of [
    "/inspection/Ab3xQ7zK9mNpR2sTuV4w",
    "/inspection/abc123",
    "/api/inspection-view",
    "/api/inspection-share",
  ]) {
    const caught = VERCEL.redirects.filter((r) => matches(r.source, url));
    assert.deepEqual(
      caught.map((r) => r.source),
      [],
      `${url} is caught by a redirect (${caught.map((r) => r.source).join(", ")}), which runs before the rewrite that serves it.`,
    );
  }
});

test("the cdnjs policy is keyed on the path the browser actually requests", () => {
  // Vercel matches headers against the incoming request path. /reader 301s before any
  // header lookup resolves it, so the block has to name /reader.html. Keying it on a
  // path that only exists after a rewrite is the failure this asserts against: React
  // blocked by the catch-all policy, and a page that mounts nothing.
  const relaxed = VERCEL.headers.filter((h) =>
    h.headers.some((k) => k.key === "Content-Security-Policy" && k.value.includes(CDNJS)),
  );
  assert.equal(relaxed.length, 1, "exactly one header block may carry the cdnjs allowance");
  assert.equal(
    relaxed[0].source,
    READER_PAGE,
    `the cdnjs CSP is keyed on ${relaxed[0].source}. React loads from cdnjs on ${READER_PAGE} and nowhere else.`,
  );

  const catchAll = VERCEL.headers.find((h) => h.source.startsWith("/((?!"));
  assert.ok(catchAll, "the catch-all header block is gone; every other page loses its CSP");
  assert.ok(
    catchAll.source.includes("reader\\.html"),
    `the catch-all excludes ${catchAll.source}, which no longer names the Reader page. ` +
      "Two CSP blocks would then match it and the stricter one blocks React.",
  );
  assert.ok(
    !catchAll.headers.some((k) => k.key === "Content-Security-Policy" && k.value.includes(CDNJS)),
    "the catch-all policy now allows cdnjs, which hands every page on the site a script source it does not need.",
  );
});

test("the sitemap advertises the Reader and not the page that no longer exists", () => {
  const sitemap = read("sitemap.xml");
  assert.ok(
    sitemap.includes("<loc>https://www.imbaslabs.com/reader.html</loc>"),
    "the Reader is not in the sitemap",
  );
  assert.ok(
    !sitemap.includes("workbench"),
    "the sitemap still lists a workbench URL, which asks crawlers to index a redirect.",
  );
});

test("the acceptance board photographs the Reader at its new path", () => {
  // The pinned default url is written into the environment block of every snapshot a
  // scenario does not override. If it and the page disagree, the board either fails to
  // load or files its frames under a lie.
  assert.equal(resolveNavigation({}).page, READER_PAGE);
  assert.equal(
    resolveReadiness(READER_PAGE).react,
    true,
    "the harness no longer knows the Reader is a React page, so it would photograph an empty shell without failing.",
  );
});
