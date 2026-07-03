// GET /api/reader-health — lightweight, non-sensitive Reader status for ops checks.

import { redisConfigured } from "./reader-security.js";

export function getReaderHealthStatus(env = process.env) {
  const readerEnabled = env.READER_ENABLED !== "0";
  const modelConfigured = Boolean(env.READER_API_KEY);
  const airtableConfigured = Boolean(env.AIRTABLE_TOKEN);
  const durableStore = redisConfigured(env);

  let mode = "ready";
  if (!readerEnabled) {
    mode = "disabled";
  } else if (!modelConfigured || !durableStore) {
    mode = "degraded";
  }

  return {
    service: "reader",
    mode,
    reader_enabled: readerEnabled,
    model_api_configured: modelConfigured,
    durable_rate_store: durableStore,
    durable_spend_store: durableStore,
    airtable_capture_configured: airtableConfigured,
    timestamp: new Date().toISOString(),
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ error: "method" });
  }
  res.setHeader("Cache-Control", "no-store");
  const status = getReaderHealthStatus();
  if (req.method === "HEAD") {
    return res.status(200).end();
  }
  return res.status(200).json(status);
}
