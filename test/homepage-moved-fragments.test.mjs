// Every id moved from the homepage to /research.html must be in the homepage's
// forwarding list, so old /#fragment links and bookmarks still land somewhere.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const ids = (html) => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

test("homepage forwards every id that now lives only on research.html", () => {
  const home = read("index.html");
  const list = home.match(/var moved = (\[[^\]]*\]);/);
  assert.ok(list, "forwarding list present");
  const mapped = new Set(JSON.parse(list[1]));
  const homeIds = ids(home);
  const missing = [...ids(read("research.html"))].filter((id) => !homeIds.has(id) && !mapped.has(id));
  assert.deepEqual(missing, []);
});
