// /api/inspection/[shareId].js — Retrieve (GET) an unlisted Workbench inspection
// record, or file a flag-only report against it (POST).
//
// GET  → the public projection of the share (mode-aware; never the raw answer for a
//        P4 row). Cache: private, no-store.
// POST {action:"report"} → sets ONLY Report Flag=reported for manual operator review
//        under the Imbas Publication Policy. Rate-limited per IP and per share. It
//        can never remove content, change visibility, or touch any other field, and
//        it triggers no automated takedown — a report is not a removal. Possession of
//        a share URL is NEVER authority to delete.

import { fetchShareById, reportShareById } from "../inspection-share.js";
import { deriveClientIp, checkReportLimits } from "../../reader-security.js";

const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,32}$/;

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method" });
  }

  const shareId = typeof req.query.shareId === "string" ? req.query.shareId.trim() : "";
  if (!shareId || !SHARE_ID_RE.test(shareId)) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_INSPECTION_SHARES_TABLE) {
    return res.status(503).json({ ok: false, error: "unconfigured" });
  }

  if (req.method === "GET") {
    try {
      const record = await fetchShareById(shareId);
      if (!record) return res.status(404).json({ ok: false, error: "not_found" });
      res.setHeader("Cache-Control", "private, no-store");
      return res.status(200).json({ ok: true, record });
    } catch {
      return res.status(502).json({ ok: false, error: "airtable" });
    }
  }

  // POST → flag-only report.
  const action = req.body && typeof req.body === "object" ? req.body.action : "";
  if (action !== "report") return res.status(400).json({ ok: false, error: "invalid" });

  const ip = deriveClientIp(req);
  const limit = await checkReportLimits(ip, shareId);
  if (!limit.allowed) return res.status(429).json({ ok: false, error: "rate" });

  const result = await reportShareById(shareId);
  if (!result.ok) {
    if (result.reason === "not_found") return res.status(404).json({ ok: false, error: "not_found" });
    if (result.reason === "unconfigured") return res.status(503).json({ ok: false, error: "unconfigured" });
    return res.status(502).json({ ok: false, error: "airtable" });
  }
  // Always report success without leaking whether the row was already flagged or has
  // been reviewed-and-kept — the reporter learns only that the report was received.
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ ok: true, reported: true });
}
