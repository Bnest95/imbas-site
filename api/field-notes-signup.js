// /api/field-notes-signup.js — Vercel serverless function (Node).
// Collects Field Notes email signups into Airtable.
//
// Required Vercel env vars:
//   AIRTABLE_TOKEN              — personal access token, scope data.records:read+write on this base
//   AIRTABLE_FIELD_NOTES_TABLE  — table ID for Field Notes signups (create in Airtable first)
//
// Optional:
//   AIRTABLE_BASE               — defaults to appfxHraqlcpP1AAP
//
// Expected Airtable fields (create to match):
//   Email        — email (primary)
//   Source Page  — single line text
//   Created At   — date/time or text
//   User Agent   — long text (optional)

const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY = 8 * 1024;
const EMAIL_MAX = 254;
const HP_MAX = 1000;
const SOURCE_MAX = 500;
const UA_MAX = 500;

const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const win = 60000;
  const max = 6;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

const clip = (v, max) => (typeof v === "string" && v.length > max ? v.slice(0, max) : v);
const normalizeEmail = (v) => (typeof v === "string" ? v.trim().toLowerCase() : "");

function escapeFormula(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY) {
    return res.status(413).json({ ok: false, error: "too_large" });
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: "invalid_email" });
  }

  try {
    if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY) {
      return res.status(413).json({ ok: false, error: "too_large" });
    }
  } catch {
    return res.status(400).json({ ok: false, error: "invalid_email" });
  }

  const hp = typeof body.hp === "string" ? body.hp : "";
  if (hp.length > HP_MAX) return res.status(400).json({ ok: false, error: "invalid_email" });
  if (hp.trim()) return res.status(200).json({ ok: true });

  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_FIELD_NOTES_TABLE) {
    return res.status(503).json({ ok: false, error: "unconfigured" });
  }

  const table = process.env.AIRTABLE_FIELD_NOTES_TABLE;
  const email = normalizeEmail(body.email);
  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid_email" });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "0";
  if (throttled(ip)) return res.status(429).json({ ok: false, error: "rate" });

  const source = clip(typeof body.source === "string" ? body.source.trim() : "", SOURCE_MAX);
  const ua = clip(typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : "", UA_MAX);

  const auth = { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` };

  try {
    const formula = encodeURIComponent(`{Email}='${escapeFormula(email)}'`);
    const lookup = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?filterByFormula=${formula}&maxRecords=1`, {
      headers: auth,
    });
    if (lookup.ok) {
      const existing = await lookup.json();
      if (existing.records && existing.records.length > 0) {
        return res.status(200).json({ ok: true, duplicate: true });
      }
    }

    const fields = {
      Email: email,
      "Source Page": source || "/",
      "Created At": new Date().toISOString(),
    };
    if (ua) fields["User Agent"] = ua;

    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${table}`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("[field-notes-signup] airtable write failed:", r.status, t.slice(0, 300));
      return res.status(502).json({ ok: false, error: "airtable" });
    }
    const data = await r.json();
    return res.status(200).json({ ok: true, id: data.id });
  } catch {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
