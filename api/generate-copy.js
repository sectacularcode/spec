// POST /api/generate-copy — authenticated, locked-down proxy to Anthropic
// for Template Studio AI Draft.
//
// Security model:
// - Auth via verified Clerk JWT only.
// - The client cannot pick arbitrary models, token counts, or extra API
//   parameters. Only an allowlisted model, a capped max_tokens, a size-capped
//   system string, and size-capped messages are forwarded. Everything else in
//   the request body is dropped.
// - Per-user rate limit so a stolen session can't drain the API budget.

import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";

const ALLOWED_MODELS = new Set([
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
]);
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MAX_TOKENS_CAP = 2000;
const MAX_SYSTEM_CHARS = 20000;
const MAX_MESSAGES = 10;
const MAX_TOTAL_MESSAGE_CHARS = 150000;

function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null;
  let total = 0;
  const clean = [];
  for (const m of messages) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content !== "string") return null;
    total += m.content.length;
    if (total > MAX_TOTAL_MESSAGE_CHARS) return null;
    clean.push({ role: m.role, content: m.content });
  }
  return clean;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "generate-copy", 15))) return tooMany(res);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const body = req.body || {};

  const model = ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const maxTokens = Math.min(Math.max(parseInt(body.max_tokens, 10) || 1000, 1), MAX_TOKENS_CAP);
  const system = typeof body.system === "string" ? body.system.slice(0, MAX_SYSTEM_CHARS) : undefined;
  const messages = sanitizeMessages(body.messages);
  if (!messages) return res.status(400).json({ error: "Invalid messages" });

  const anthropicBody = { model, max_tokens: maxTokens, messages };
  if (system) anthropicBody.system = system;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: data?.error?.message || "Anthropic API error",
        status: response.status,
      });
    }

    // Strip HTML from AI-generated text before it enters editor fields and
    // eventually rendered previews.
    if (Array.isArray(data.content)) {
      data.content = data.content.map(block =>
        block && block.type === "text" && typeof block.text === "string"
          ? { ...block, text: block.text.replace(/[<>]/g, "") }
          : block
      );
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
