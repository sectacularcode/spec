import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { deepStripHTML } from "./_lib/sanitize.js";
import { callAnthropic, extractJSON } from "./_lib/anthropic.js";
import { logUsage } from "./_lib/usage.js";
import { DRAFTABLE_FIELDS, isFieldBlank } from "../src/utils/draftableFields.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "draft-copy", 15))) return tooMany(res);


  const { brief, positioning } = req.body || {};
  if (!brief || typeof brief !== "object") return res.status(400).json({ error: "No brief provided" });
  // Cap total brief payload so an authed-but-abusive client can't run up
  // input-token costs with an oversized brief.
  if (JSON.stringify(brief).length > 100000) {
    return res.status(413).json({ error: "Brief too large" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  const blankFields = DRAFTABLE_FIELDS.filter(f => isFieldBlank(brief, f.key));

  if (blankFields.length === 0) {
    return res.status(200).json({ drafts: {}, message: "No blank fields to draft" });
  }

  const voiceRules = (brief.voiceRules || []).join("\n- ");

  // Build positioning context if available
  const pos = positioning || {};
  const positioningContext = [
    pos.valueProposition ? "Value proposition: " + pos.valueProposition : "",
    pos.targetAudience ? "Target audience: " + pos.targetAudience : "",
    pos.competitiveDifferentiator ? "Key differentiator: " + pos.competitiveDifferentiator : "",
    pos.keyMessages && pos.keyMessages.length > 0 ? "Key messages:\n- " + pos.keyMessages.join("\n- ") : "",
    pos.primaryKeywords && pos.primaryKeywords.length > 0 ? "Primary keywords to weave in naturally: " + pos.primaryKeywords.join(", ") : "",
    pos.secondaryKeywords && pos.secondaryKeywords.length > 0 ? "Secondary keywords: " + pos.secondaryKeywords.join(", ") : "",
  ].filter(Boolean).join("\n");

  const brandContext = [
    brief.brandName ? "Brand: " + brief.brandName : "",
    brief.tagline ? "Tagline: " + brief.tagline : "",
    brief.hookStatement ? "Hook: " + brief.hookStatement : "",
    brief.whoBody ? "Audience: " + brief.whoBody : "",
    brief.aboutStory ? "Story: " + brief.aboutStory : "",
  ].filter(Boolean).join("\n");

  const fieldsPrompt = blankFields.map(f => '"' + f.key + '": ' + f.hint).join("\n");

  const prompt = `You are writing website copy for a brand. Follow the voice rules and positioning exactly.

BRAND CONTEXT:
${brandContext}

${positioningContext ? "POSITIONING & STRATEGY:\n" + positioningContext : ""}

VOICE RULES:
- ${voiceRules || "Plain words. Short sentences. Specific beats grand. No buzzwords."}

INSTRUCTIONS:
- Write copy that reflects the positioning and key messages above
- Weave in primary keywords naturally — never force them
- Stay in brand voice at all times
- Never use generic filler — every sentence must be specific to this brand
- Return ONLY valid JSON, no markdown, no explanation

FIELDS TO DRAFT:
${fieldsPrompt}

Return format:
{
  "fieldKey": "drafted copy here"
}

Only include keys for the fields listed above.`;

  try {
    const { ok, data } = await callAnthropic(apiKey, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: "You are a brand strategist and copywriter. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
      messages: [{ role: "user", content: prompt }],
    });

    if (!ok) return res.status(500).json({ error: "API error", drafts: {} });

    await logUsage({
      userId,
      clientName: brief.brandName || null,
      route: "draft-copy",
      model: "claude-haiku-4-5-20251001",
      inputTokens: data?.usage?.input_tokens,
      outputTokens: data?.usage?.output_tokens,
    });

    const parsed = extractJSON(data);
    if (!parsed) return res.status(200).json({ drafts: {}, message: "Could not parse drafts" });

    const drafts = deepStripHTML(parsed);
    return res.status(200).json({ drafts, fieldsCount: Object.keys(drafts).length });

  } catch (err) {
    return res.status(500).json({ error: err.message, drafts: {} });
  }
}
