// /api/experience.js — Vercel serverless function (Node).
// Receives homepage Your Experience submissions into Airtable Experience Captures.
//
// Required Vercel env vars:
//   AIRTABLE_TOKEN — personal access token, scope data.records:write on this base
//
// Airtable table: Experience Captures (tblmGIHhQNcvFVgoF)

const BASE = "appfxHraqlcpP1AAP";
const TABLE = "tblmGIHhQNcvFVgoF";
const MAX_BODY = 64 * 1024;
const TOPIC_MAX = 500;
const ANSWER_MAX = 12000;
const EMAIL_MAX = 254;
const HP_MAX = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hits = new Map();
function throttled(ip) {
  const now = Date.now();
  const win = 600000;
  const max = 5;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });

  const contentLength = Number(req.headers["content-length"] || 0);
  if (contentLength > MAX_BODY) {
    return res.status(413).json({ ok: false, error: "too_large" });
  }

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

  const hp = typeof body.hp === "string" ? body.hp : "";
  if (hp.length > HP_MAX) return res.status(400).json({ ok: false, error: "invalid" });
  if (hp.trim()) return res.status(200).json({ ok: true });

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const aiAnswer = typeof body.aiAnswer === "string" ? body.aiAnswer.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";

  if (!topic || topic.length > TOPIC_MAX) return res.status(400).json({ ok: false, error: "invalid" });
  if (!aiAnswer || aiAnswer.length > ANSWER_MAX) return res.status(400).json({ ok: false, error: "invalid" });
  if (!email || email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "0";
  if (throttled(ip)) return res.status(429).json({ ok: false, error: "rate" });

  if (!process.env.AIRTABLE_TOKEN) {
    return res.status(503).json({ ok: false, error: "unconfigured" });
  }

  const fields = {
    Topic: topic,
    "AI Answer": aiAnswer,
    Email: email,
    "Source Page": "homepage / your-experience",
    Status: "new",
  };

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
      console.error("[experience] airtable write failed:", r.status, t.slice(0, 300));
      return res.status(502).json({ ok: false, error: "airtable" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[experience] network error:", err && err.message ? err.message : "unknown");
    return res.status(502).json({ ok: false, error: "network" });
  }
}
