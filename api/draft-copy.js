export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { brief } = req.body || {};
  if (!brief) return res.status(400).json({ error: "No brief provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  // Fields that AI can draft — only if blank or placeholder
  const DRAFTABLE_FIELDS = [
    { key: "heroHeadline", label: "Hero headline", hint: "A short, punchy headline for the hero section. 5-10 words max." },
    { key: "heroSubhead", label: "Hero subheadline", hint: "A single sentence expanding on the headline. Plain, specific." },
    { key: "hookStatement", label: "Honest hook", hint: "One or two sentences that call out the problem and position this brand as the solution. No buzzwords." },
    { key: "differenceH2", label: "Difference headline", hint: "A short H2 headline that names the key differentiator. 4-8 words." },
    { key: "differenceBody", label: "Difference body copy", hint: "2-3 sentences explaining what makes this brand different. Specific, not generic." },
    { key: "whoH2", label: "Who it is for headline", hint: "A short H2 that names the target audience. 3-6 words." },
    { key: "whoBody", label: "Who it is for body", hint: "2-3 sentences describing the ideal client. Be specific about who they are and their problem." },
    { key: "aboutStory", label: "About story paragraph 1", hint: "The first paragraph of the founder/company story. When it started, what drove it." },
    { key: "aboutStory2", label: "About story paragraph 2", hint: "Second paragraph. What they noticed, why they built this." },
    { key: "whyOneMaker", label: "Why this approach body", hint: "2-3 sentences explaining the approach and why it works for clients." },
    { key: "calloutBody", label: "Process callout body", hint: "1-2 sentences about what to expect — timeline and delivery. Calm and specific." },
    { key: "contactIntro", label: "Contact intro", hint: "2-3 sentences inviting the visitor to get in touch. Warm but direct." },
    { key: "contactReassurance", label: "Contact reassurance line", hint: "One short sentence under the form. No sales team, real reply, specific promise." },
  ];

  // Find which fields are blank or placeholder
  const blankFields = DRAFTABLE_FIELDS.filter(f => {
    const val = brief[f.key];
    if (!val || val.trim() === "") return true;
    if (val.includes("[") && val.includes("]")) return false; // brackets = human must fill
    return false;
  });

  if (blankFields.length === 0) {
    return res.status(200).json({ drafts: {}, message: "No blank fields to draft" });
  }

  // Build brand voice context
  const voiceRules = (brief.voiceRules || []).join("\n- ");
  const brandContext = [
    brief.brandName ? `Brand: ${brief.brandName}` : "",
    brief.tagline ? `Tagline: ${brief.tagline}` : "",
    brief.hookStatement ? `Hook: ${brief.hookStatement}` : "",
    brief.whoBody ? `Audience: ${brief.whoBody}` : "",
    brief.aboutStory ? `Story: ${brief.aboutStory}` : "",
  ].filter(Boolean).join("\n");

  const fieldsPrompt = blankFields.map(f =>
    `"${f.key}": ${f.hint}`
  ).join("\n");

  const prompt = `You are writing copy for a website. Follow the brand voice rules exactly.

BRAND CONTEXT:
${brandContext}

VOICE RULES:
- ${voiceRules || "Plain words. Short sentences. Specific beats grand. No buzzwords."}

Draft copy for these blank fields. Return ONLY valid JSON with the field keys and drafted values.
Never add markdown, never explain, never use placeholder brackets.
Write as if you are the brand — in first person where appropriate.
Keep every field SHORT unless the hint says otherwise.

FIELDS TO DRAFT:
${fieldsPrompt}

Return format:
{
  "heroHeadline": "drafted copy here",
  "differenceBody": "drafted copy here"
}

Only include keys for fields listed above. Never invent fields.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        system: "You are a brand copywriter. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return res.status(500).json({ error: "API error", drafts: {} });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ drafts: {}, message: "Could not parse drafts" });

    const drafts = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ drafts, fieldsCount: Object.keys(drafts).length });

  } catch (err) {
    return res.status(500).json({ error: err.message, drafts: {} });
  }
}
