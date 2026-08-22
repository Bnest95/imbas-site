/* The capture matrix.
 *
 * One list, generated for all three directions from the same rows, so parity is a
 * property of the generator rather than a thing to check by eye afterwards. Every
 * row is captured for every direction at both viewports it declares.
 *
 * Filenames carry direction, screen, record-or-state, viewport, state and motion,
 * separated by double underscores so each part is recoverable by splitting.
 */

export const DIRECTIONS = ["a", "b", "c"];

/* screen: entry | record       subject: entry state or record id
 * state:  the variation within the screen (default, open-N, density-X, forwarded)
 * views:  which viewports this row is captured at
 * motion: ordinary | reduced */
export const ROWS = [
  { screen: "entry", subject: "empty", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },
  { screen: "entry", subject: "answer", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },
  { screen: "entry", subject: "shared", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },

  { screen: "record", subject: "montana", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },
  { screen: "record", subject: "furnace", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },
  { screen: "record", subject: "website", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },
  { screen: "record", subject: "deposit", state: "default", views: ["desktop", "mobile"], motion: "ordinary" },

  { screen: "record", subject: "furnace", state: "open-2", views: ["desktop", "mobile"], motion: "ordinary" },

  { screen: "record", subject: "deposit", state: "density-consumer", views: ["desktop"], motion: "ordinary" },
  { screen: "record", subject: "deposit", state: "density-professional", views: ["desktop"], motion: "ordinary" },

  { screen: "record", subject: "montana", state: "forwarded", views: ["desktop", "mobile"], motion: "ordinary" },

  /* The stress pair. Deposit is the heaviest record the anatomy carries — nine marks
   * across all three channels — and forwarded-cold is the state where nobody is
   * present to explain it. Montana forwarded proves the mechanism at one mark; this
   * proves it at nine, which is where a canonical-full record either holds its shape
   * or turns into a wall. The professional register rides along with it, because a
   * forwarded record opens at full annotation by construction. */
  { screen: "record", subject: "deposit", state: "forwarded", views: ["desktop", "mobile"], motion: "ordinary" },

  { screen: "record", subject: "furnace", state: "open-2", views: ["desktop"], motion: "reduced" },
  { screen: "entry", subject: "shared", state: "default", views: ["desktop"], motion: "reduced" },
];

function query(row) {
  if (row.screen === "entry") return "state=" + row.subject;
  var q = "record=" + row.subject;
  if (row.state.indexOf("open-") === 0) q += "&open=" + row.state.slice(5);
  if (row.state.indexOf("density-") === 0) q += "&density=" + row.state.slice(8);
  if (row.state === "forwarded") q += "&forwarded=1";
  if (row.motion === "reduced") q += "&motion=reduced";
  return q;
}

export function specs() {
  const out = [];
  for (const row of ROWS) {
    for (const view of row.views) {
      for (const dir of DIRECTIONS) {
        out.push({
          name: [dir, row.screen, row.subject, view, row.state, row.motion].join("__"),
          file: `${dir}/${row.screen}.html`,
          query: query(row),
          viewport: view,
          motion: row.motion === "reduced" ? "reduced" : "normal",
          full: true,
          meta: { direction: dir, screen: row.screen, subject: row.subject, state: row.state },
        });
      }
    }
  }
  return out;
}
