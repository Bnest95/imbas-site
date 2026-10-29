// The 16 ids that lived on the homepage before the v4.4 refresh and now live on
// /research.html. Old /#<id> links and bookmarks must still land: each id must be in the
// homepage's forwarding list, and each destination must exist on research.html.
// New ids added to research.html later do NOT need a homepage alias.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const HISTORICAL_IDS = [
  "archive", "archive-featured-title", "archive-h2", "cat-h2", "ephemeral-h2",
  "experience-answer", "experience-capture-confirm", "experience-capture-error",
  "experience-capture-form", "experience-email", "experience-label", "experience-topic",
  "gap-h2", "public-interest-h2", "record-compounds-h2", "value-h2",
];
const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const ids = (html) => new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));

test("homepage forwards each historical id, and each destination exists on research.html", () => {
  const home = read("index.html");
  const list = home.match(/var moved = (\[[^\]]*\]);/);
  assert.ok(list, "forwarding list present");
  const mapped = new Set(JSON.parse(list[1]));
  const research = ids(read("research.html"));
  const homeIds = ids(home);
  for (const id of HISTORICAL_IDS) {
    assert.ok(mapped.has(id), `homepage forwards #${id}`);
    assert.ok(research.has(id), `research.html has #${id}`);
    assert.ok(!homeIds.has(id), `#${id} no longer on the homepage (forwarding would never fire)`);
  }
});
