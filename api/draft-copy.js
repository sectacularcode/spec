import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { deepStripHTML } from "./_lib/sanitize.js";
import { callAnthropic, extractJSON } from "./_lib/anthropic.js";

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

  const DRAFTABLE_FIELDS = [
    { key: "heroHeadline", label: "Hero headline", hint: "A short, punchy headline for the hero section. 5-10 words max. Should include or allude to a primary keyword if possible." },
    { key: "heroSubhead", label: "Hero subheadline", hint: "A single sentence expanding on the headline. Plain, specific, speaks directly to the target audience." },
    { key: "hookStatement", label: "Honest hook", hint: "One or two sentences that call out the problem and position this brand as the solution. No buzzwords." },
    { key: "differenceH2", label: "Difference headline", hint: "A short H2 that names the key differentiator. 4-8 words. Should reflect the competitive differentiator." },
    { key: "differenceBody", label: "Difference body copy", hint: "2-3 sentences explaining what makes this brand different. Specific, not generic. Reference the competitive differentiator." },
    { key: "whoH2", label: "Who it is for headline", hint: "A short H2 that names the target audience. 3-6 words." },
    { key: "whoBody", label: "Who it is for body", hint: "2-3 sentences describing the ideal client using the target audience definition. Be specific." },
    { key: "aboutStory", label: "About story", hint: "The founder or company story. When it started, what drove it, who it serves." },
    { key: "whyOneMaker", label: "Why this approach", hint: "2-3 sentences on the approach and why it works for clients. Reference the competitive differentiator." },
    { key: "processIntro", label: "Process intro", hint: "One sentence about what to expect — calm, specific, no jargon." },
    { key: "contactIntro", label: "Contact intro", hint: "2-3 sentences inviting the visitor to get in touch. Warm but direct. Reference the key CTA." },
    { key: "contactReassurance", label: "Contact reassurance", hint: "One short sentence under the form. Specific promise, no sales team language." },
  ];

  const blankFields = DRAFTABLE_FIELDS.filter(f => {
    const val = brief[f.key];
    if (!val || val.trim() === "") return true;
    if (val.includes("[") && val.includes("]")) return false;
    return false;
  });

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

    const parsed = extractJSON(data);
    if (!parsed) return res.status(200).json({ drafts: {}, message: "Could not parse drafts" });

    const drafts = deepStripHTML(parsed);
    return res.status(200).json({ drafts, fieldsCount: Object.keys(drafts).length });

  } catch (err) {
    return res.status(500).json({ error: err.message, drafts: {} });
  }
}
