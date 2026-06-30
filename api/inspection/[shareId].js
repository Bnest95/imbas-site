// /api/inspection/[shareId].js — Retrieve an unlisted Workbench inspection record.

import { fetchShareById } from "../inspection-share.js";

const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,32}$/;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "method" });

  const shareId = typeof req.query.shareId === "string" ? req.query.shareId.trim() : "";
  if (!shareId || !SHARE_ID_RE.test(shareId)) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_INSPECTION_SHARES_TABLE) {
    return res.status(503).json({ ok: false, error: "unconfigured" });
  }

  try {
    const record = await fetchShareById(shareId);
    if (!record) return res.status(404).json({ ok: false, error: "not_found" });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({ ok: true, record });
  } catch {
    return res.status(502).json({ ok: false, error: "airtable" });
  }
}
