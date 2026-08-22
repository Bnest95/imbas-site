/* Runs the capture matrix and writes the manifest.
 *
 *   node build/capture.mjs
 *
 * The manifest carries the renderer identity, capture order, settle conditions,
 * dimensions, byte lengths and SHA-256 for every frame, plus a parity proof: for
 * every row of the matrix, the three directions must each have produced a frame at
 * the same viewport, state and motion. Parity is asserted here, not eyeballed.
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { shoot, LANE } from "./shoot.mjs";
import { specs, ROWS, DIRECTIONS } from "./matrix.mjs";

const list = specs();
const out = resolve(LANE, "screenshots");
const r = await shoot(list, out);

const byName = new Map(r.entries.map((e) => [e.name, e]));
for (const s of list) Object.assign(byName.get(s.name), s.meta);

/* Parity: every row × view must exist for every direction, and the frames must
 * agree on viewport, motion and full-page — the only permitted difference between
 * three frames of the same row is what the pixels look like. */
const parity = [];
let mismatches = 0;
for (const row of ROWS) {
  for (const view of row.views) {
    const group = DIRECTIONS.map((d) =>
      byName.get([d, row.screen, row.subject, view, row.state, row.motion].join("__")),
    );
    const missing = DIRECTIONS.filter((_, i) => !group[i]);
    const shapes = new Set(group.filter(Boolean).map((e) => `${e.viewport_px}|${e.motion}|${e.full_page}|${e.device_scale_factor}`));
    const ok = missing.length === 0 && shapes.size === 1;
    if (!ok) mismatches++;
    parity.push({
      row: `${row.screen}/${row.subject}/${row.state}/${view}/${row.motion}`,
      frames: group.filter(Boolean).map((e) => e.name),
      missing_directions: missing,
      capture_shape: [...shapes],
      parity: ok ? "pass" : "fail",
    });
  }
}

const manifest = {
  capture_spec: {
    renderer: r.renderer,
    renderer_executable: r.executable,
    chromium_revision: r.chromium_revision,
    desktop_viewport_css_px: "1440x1000",
    mobile_viewport_css_px: "390x844",
    device_scale_factor: 1,
    color_scheme: "dark",
    settle_conditions: ["load", 'html[data-ready="true"]', "document.fonts.ready", "fixed timer"],
    settle_ms: 900,
    launch_args: ["--allow-file-access-from-files", "--font-render-hinting=none", "--force-color-profile=srgb"],
    full_page: true,
    network: "none — every asset is a local file",
  },
  parity: { rows: parity.length, mismatches, detail: parity },
  frames: r.entries,
};

writeFileSync(resolve(out, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(r.renderer);
console.log(`${r.entries.length} frames · ${parity.length} parity rows · ${mismatches} mismatches`);
