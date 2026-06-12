// /api/repository.js — Vercel serverless function (Node).
// Receives a Try Imbas candidate (schema "imbas.candidate.v0") and writes ONE row
// to the Airtable Repository table (captured pool). Never touches the Cases archive.
//
// Required Vercel env vars (Project → Settings → Environment Variables):
//   AIRTABLE_TOKEN       — Airtable personal access token, scope data.records:write on this base
//   AIRTABLE_BASE        — optional, defaults to appfxHraqlcpP1AAP
//   AIRTABLE_REPO_TABLE  — optional, defaults to tblyPn1kp4PHbxTWz

const BASE = process.env.AIRTABLE_BASE || "appfxHraqlcpP1AAP";
const TABLE = process.env.AIRTABLE_REPO_TABLE || "tblyPn1kp4PHbxTWz";
const MAX = 20000; // per-field character cap

// best-effort in-memory throttle (resets on cold start; swap for Vercel KV / Upstash for hard limits)
const hits = new Map();
function throttled(ip) {
  const now = Date.now(), win = 60000, max = 8;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
}
const clip = (v) => (typeof v === "string" && v.length > MAX ? v.slice(0, MAX) : v);
function userSelfScore(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 3) return null;
  return n;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method" });
  if (!process.env.AIRTABLE_TOKEN) return res.status(500).json({ ok: false, error: "unconfigured" });

  const c = req.body || {};
  if (c.hp) return res.status(200).json({ ok: true }); // honeypot: drop silently
  if (c.schema !== "imbas.candidate.v0") return res.status(400).json({ ok: false, error: "schema" });
  if (!c.mode || !c.model) return res.status(400).json({ ok: false, error: "missing" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "0";
  if (throttled(ip)) return res.status(429).json({ ok: false, error: "rate" });

  const id = "CAND-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const score = userSelfScore(c.user_self_score);
  const fields = {
    "Candidate ID": id,
    "Captured At": c.captured_at || new Date().toISOString(),
    "Mode": c.mode,
    "Source Case ID": c.case_id || "",
    "Model": c.model,
    "Open Prompt": clip(c.open_prompt || ""),
    "Open Answer": clip(c.open_answer || ""),
    "Gap Held": !!c.gap_held,
    "User-Named Omission": clip(c.user_named_omission || c.surfaced_after_direct || ""),
    "Targeted Prompt": clip(c.targeted_prompt || ""),
    "Targeted Answer": clip(c.targeted_answer || ""),
    "User Category": clip(c.user_category || ""),
    "Evidence Quote": clip(c.evidence || ""),
    "Submitter Email": c.email || "",
    "Triage Status": "new",
    "Triage Notes": c.mechanism ? "mechanism: " + c.mechanism : "",
  };
  if (score !== null) fields["User Self Score"] = score;
  Object.keys(fields).forEach((k) => {
    if (fields[k] === "" || fields[k] == null) delete fields[k];
  });

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!r.ok) { const t = await r.text(); return res.status(502).json({ ok: false, error: "airtable", detail: t.slice(0, 300) }); }
    const data = await r.json();
    return res.status(200).json({ ok: true, id: data.id });
  } catch {
    return res.status(502).json({ ok: false, error: "network" });
  }
}
