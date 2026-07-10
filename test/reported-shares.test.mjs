// Tests for the P4 reported-share moderation queue as it flows through the daily brief:
//   collect-airtable.mjs  buildReportedShares / buildBundle  (Airtable-only, body-free)
//   founder-ops-brief.mjs summarizeReportedShares + render section + warning
// Run: node --test test/reported-shares.test.mjs
//
// The queue is surface-only: it shows a share a reader flagged so a person can decide
// under the Publication Policy. Reporting is never removal. These tests hold the
// filter (only Report Flag=reported), the body-free projection (no question / findings
// / receipt hash can ride along), oldest-first ordering, and the neutral, count-gated
// warning.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildReportedShares, buildBundle, SHARES_FETCH_FIELDS } from "../scripts/collect-airtable.mjs";
import { summarizeReportedShares, buildBrief, renderBrief } from "../scripts/founder-ops-brief.mjs";

const rec = (fields) => ({ id: "rec" + Math.random().toString(36).slice(2, 8), fields });

// ── buildReportedShares: filter + body-free projection + ordering ────────────────
test("buildReportedShares keeps only Report Flag=reported (tolerating select shapes)", () => {
  const rows = buildReportedShares([
    rec({ "Share ID": "a", "Report Flag": "reported", "Created At": "2026-07-08T00:00:00Z" }),
    rec({ "Share ID": "b", "Report Flag": { name: "reported" }, "Created At": "2026-07-08T01:00:00Z" }),
    rec({ "Share ID": "c", "Report Flag": "reviewed-kept", "Created At": "2026-07-08T02:00:00Z" }),
    rec({ "Share ID": "d", "Created At": "2026-07-08T03:00:00Z" }), // no flag
  ]);
  assert.deepEqual(rows.map((r) => r.fields["Share ID"]), ["a", "b"], "only reported rows survive");
});

test("buildReportedShares projects ONLY the 5 body-free pointer fields — never question/findings/hash", () => {
  const rows = buildReportedShares([
    rec({
      "Share ID": "x",
      Mode: "single",
      "Created At": "2026-07-08T00:00:00Z",
      "Report Flag": "reported",
      "Reviewed Status": "Unreviewed",
      // Fields that must NEVER reach the brief bundle, even if an over-broad fetch returned them:
      Question: "the reader's raw question",
      "Findings JSON": '[{"anchor":"verbatim"}]',
      "Receipt Hash": "deadbeef".repeat(8),
    }),
  ]);
  const keys = Object.keys(rows[0].fields);
  assert.ok(keys.every((k) => SHARES_FETCH_FIELDS.includes(k)), "no key outside the allowlist");
  for (const banned of ["Question", "Findings JSON", "Receipt Hash"]) {
    assert.ok(!(banned in rows[0].fields), `${banned} must not ride along`);
  }
});

test("buildReportedShares sorts oldest report first, Share ID as tiebreak", () => {
  const rows = buildReportedShares([
    rec({ "Share ID": "later", "Report Flag": "reported", "Created At": "2026-07-09T00:00:00Z" }),
    rec({ "Share ID": "z", "Report Flag": "reported", "Created At": "2026-07-08T00:00:00Z" }),
    rec({ "Share ID": "a", "Report Flag": "reported", "Created At": "2026-07-08T00:00:00Z" }),
  ]);
  assert.deepEqual(rows.map((r) => r.fields["Share ID"]), ["a", "z", "later"], "oldest first; a<z on the tie");
});

// ── buildBundle.shares: available vs labeled gap ─────────────────────────────────
test("buildBundle: a shares array → available:true with the reported queue", () => {
  const b = buildBundle(
    { shares: [rec({ "Share ID": "s", "Report Flag": "reported", "Created At": "2026-07-08T00:00:00Z" })] },
    { date: "2026-07-09" },
  );
  assert.equal(b.shares.available, true);
  assert.equal(b.shares.reported.length, 1);
});

test("buildBundle: shares omitted → available:false (a labeled gap, not a faked empty queue)", () => {
  const b = buildBundle({}, { date: "2026-07-09" });
  assert.deepEqual(b.shares, { available: false });
});

// ── summarizeReportedShares: pure summary ────────────────────────────────────────
test("summarizeReportedShares maps rows, defaults Mode to (unset), sorts oldest-first", () => {
  const s = summarizeReportedShares({
    available: true,
    reported: [
      { fields: { "Share ID": "newer", "Created At": "2026-07-09T00:00:00Z", Mode: "paired", "Reviewed Status": "Unreviewed" } },
      { fields: { "Share ID": "older", "Created At": "2026-07-08T00:00:00Z" } },
    ],
  });
  assert.equal(s.available, true);
  assert.equal(s.count, 2);
  assert.deepEqual(s.reported.map((r) => r.shareId), ["older", "newer"]);
  assert.equal(s.reported[0].mode, "(unset)", "a missing Mode reads as (unset), never blank");
  assert.equal(s.reported[1].mode, "paired");
});

test("summarizeReportedShares: absent or available:false → labeled gap", () => {
  assert.deepEqual(summarizeReportedShares(undefined), { available: false, count: 0, reported: [] });
  assert.deepEqual(summarizeReportedShares({ available: false }), { available: false, count: 0, reported: [] });
});

// ── end-to-end through the brief pipeline ────────────────────────────────────────
test("brief renders the REPORTED SHARES section + a count-gated warning when one is pending", () => {
  const bundle = buildBundle(
    {
      shares: [
        rec({ "Share ID": "SHARE_ONE_ID", Mode: "single", "Report Flag": "reported", "Reviewed Status": "Unreviewed", "Created At": "2026-07-08T12:00:00Z" }),
      ],
    },
    { date: "2026-07-09" },
  );
  const md = renderBrief(buildBrief(bundle));
  assert.ok(md.includes("## REPORTED SHARES"), "the section renders");
  assert.ok(md.includes("Reported, awaiting review (1)"), "the count line renders");
  assert.ok(md.includes("/inspection/SHARE_ONE_ID"), "each row links to the share for a human decision");
  assert.ok(md.includes("created 2026-07-08"), "created date is date-only");
  assert.ok(
    md.includes("reported for review under the Publication Policy"),
    "a neutral warning surfaces the pending queue",
  );
});

test("brief: no reported share → section renders, but no reported-share warning fires", () => {
  const bundle = buildBundle({ shares: [] }, { date: "2026-07-09" });
  const md = renderBrief(buildBrief(bundle));
  assert.ok(md.includes("## REPORTED SHARES"));
  assert.ok(md.includes("(none reported)"));
  assert.ok(!md.includes("reported for review under the Publication Policy"), "an empty queue raises no alarm");
});

test("brief: shares unavailable (agent bundle) → labeled gap, no false alarm", () => {
  const bundle = buildBundle({}, { date: "2026-07-09" }); // shares omitted → available:false
  const md = renderBrief(buildBrief(bundle));
  assert.ok(md.includes("Reported-share queue not included in this bundle"), "a missing read is a labeled gap");
  assert.ok(!md.includes("reported for review under the Publication Policy"), "no warning on an unavailable queue");
});
