// /api/inspection-share.js — Create an unlisted shareable Workbench inspection record.
//
// Required Vercel env vars:
//   AIRTABLE_TOKEN                    — personal access token (data.records:read+write)
//   AIRTABLE_INSPECTION_SHARES_TABLE  — table ID for Inspection Shares (create in Airtable first)
//   AIRTABLE_BASE                     — optional, defaults to appfxHraqlcpP1AAP
//   SITE_ORIGIN                       — optional, e.g. https://www.imbaslabs.com (for share_url)
//
// Expected Airtable fields (create to match):
//   Share ID, Created At, Question, Topic, AI Model, Answer, Completeness,
//   The Read, What Was Left Out, How It Was Shaped, Inspection Note,
//   Source Label, Case Label, Visibility, Reviewed Status

import { randomBytes } from "node:crypto";
import {
  deriveClientIp,
  checkShareCreationLimits,
  recordShareCreation,
} from "./reader-security.js";

const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
const TABLE = process.env.AIRTABLE_INSPECTION_SHARES_TABLE || "";
const MAX_BODY = 256 * 1024;
const FIELD_MAX = 50000;
const QUESTION_MAX = 4000;
const TOPIC_MAX = 500;
const MODEL_MAX = 64;
const LABEL_MAX = 64;
const SHARE_ID_RE = /^[A-Za-z0-9_-]{20,32}$/;

const clip = (v, max = FIELD_MAX) => (typeof v === "string" && v.length > max ? v.slice(0, max) : v);
const str = (v) => (typeof v === "string" ? v : "");

function newShareId() {
  return randomBytes(18).toString("base64url");
}

function siteOrigin(req) {
  if (process.env.SITE_ORIGIN) return process.env.SITE_ORIGIN.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host || "";
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  if (host) return `${proto}://${host}`;
  return "https://www.imbaslabs.com";
}

function airtableFormulaEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export async function fetchShareById(shareId) {
  if (!process.env.AIRTABLE_TOKEN || !TABLE) return null;
  const formula = encodeURIComponent(`{Share ID}='${airtableFormulaEscape(shareId)}'`);
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}?filterByFormula=${formula}&maxRecords=1`, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
  });
  if (!r.ok) {
    const t = await r.text();
    console.error("[inspection-share] airtable lookup failed:", r.status, t.slice(0, 300));
    throw new Error("airtable");
  }
  const data = await r.json();
  const rec = data.records && data.records[0];
  if (!rec) return null;
  return recordToPublic(rec.fields || {}, shareId);
}

function recordToPublic(fields, shareId) {
  const leftOutRaw = fields["What Was Left Out"];
  const leftOut =
    typeof leftOutRaw === "string"
      ? leftOutRaw.split("\n").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(leftOutRaw)
        ? leftOutRaw.filter((x) => typeof x === "string" && x.trim())
        : [];
  return {
    share_id: shareId,
    created_at: fields["Created At"] || "",
    question: fields.Question || "",
    topic: fields.Topic || "",
    ai_model: fields["AI Model"] || "",
    answer: fields.Answer || "",
    completeness: fields.Completeness || "partial",
    the_read: fields["The Read"] || "",
    what_was_left_out: leftOut,
    how_it_was_shaped: fields["How It Was Shaped"] || "",
    inspection_note: fields["Inspection Note"] || "",
    source_label: fields["Source Label"] || "Workbench inspection",
    case_label: fields["Case Label"] || "",
    reviewed_status: fields["Reviewed Status"] || "Unreviewed",
    visibility: fields.Visibility || "unlisted",
    source: "Workbench inspection",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY) return res.status(413).json({ ok: false, error: "too_large" });

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY) {
      return res.status(413).json({ ok: false, error: "too_large" });
    }
  } catch {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  // TODO(durable fix): gate creation to genuine Reader output — require a signed
  // share token minted by api/read.js on a real Reader run and verify it here, so
  // arbitrary self-authored text can't mint an Imbas-styled share. The per-IP and
  // per-day limits below are the interim mitigation, not the boundary.
  const ip = deriveClientIp(req);
  const limit = await checkShareCreationLimits(ip);
  if (!limit.allowed) {
    return res.status(429).json({
      ok: false,
      error: limit.tier === "global_day" ? "daily_capacity" : "rate",
    });
  }

  if (!process.env.AIRTABLE_TOKEN || !TABLE) {
    return res.status(503).json({ ok: false, error: "unconfigured" });
  }

  const question = clip(str(body.question), QUESTION_MAX).trim();
  const answer = clip(str(body.answer), FIELD_MAX).trim();
  const theRead = clip(str(body.the_read), FIELD_MAX).trim();
  const completeness = str(body.completeness).toLowerCase();

  if (!question || question.length < 3) return res.status(400).json({ ok: false, error: "missing" });
  if (!answer || answer.length < 20) return res.status(400).json({ ok: false, error: "missing" });
  if (!theRead) return res.status(400).json({ ok: false, error: "missing" });
  if (!["full", "partial", "thin"].includes(completeness)) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  const leftOut = Array.isArray(body.what_was_left_out)
    ? body.what_was_left_out.filter((x) => typeof x === "string" && x.trim()).map((x) => clip(x.trim(), 2000))
    : [];
  const shareId = newShareId();
  if (!SHARE_ID_RE.test(shareId)) {
    return res.status(500).json({ ok: false, error: "id" });
  }

  const fields = {
    "Share ID": shareId,
    "Created At": new Date().toISOString(),
    Question: question,
    Topic: clip(str(body.topic), TOPIC_MAX).trim(),
    "AI Model": clip(str(body.ai_model), MODEL_MAX).trim(),
    Answer: answer,
    Completeness: completeness,
    "The Read": theRead,
    "What Was Left Out": leftOut.join("\n"),
    "How It Was Shaped": clip(str(body.how_it_was_shaped), FIELD_MAX).trim(),
    "Inspection Note": clip(str(body.inspection_note), 4000).trim(),
    "Source Label": clip(str(body.source_label) || "Workbench inspection", LABEL_MAX).trim(),
    "Case Label": clip(str(body.case_label), LABEL_MAX).trim(),
    Visibility: "unlisted",
    "Reviewed Status": "Unreviewed",
  };
  Object.keys(fields).forEach((k) => {
    if (fields[k] === "" || fields[k] == null) delete fields[k];
  });

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("[inspection-share] airtable write failed:", r.status, t.slice(0, 300));
      return res.status(502).json({ ok: false, error: "airtable" });
    }
    // Only a confirmed write advances the global per-day counter (best-effort).
    await recordShareCreation();
    const origin = siteOrigin(req);
    const shareUrl = `${origin}/inspection/${shareId}`;
    return res.status(200).json({ ok: true, share_id: shareId, share_url: shareUrl });
  } catch (e) {
    console.error("[inspection-share] network:", e && e.message);
    return res.status(502).json({ ok: false, error: "network" });
  }
}
