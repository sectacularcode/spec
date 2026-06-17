import mammoth from "mammoth";

const EXTRACTION_PROMPT = `Extract every field from this brand brief and return ONLY a single valid JSON object.
No markdown, no code fences, no explanation — just the raw JSON.

Return this exact structure (use empty string "" for any field not found):

{
  "brandName": "",
  "tagline": "",
  "signatureLine": "",
  "heroHeadline": "",
  "heroSubhead": "",
  "heroCta1": "",
  "heroCta2": "",
  "hookStatement": "",
  "serviceCards": [["Title", "Body copy"]],
  "differenceEyebrow": "",
  "differenceH2": "",
  "differenceBody": "",
  "whoEyebrow": "",
  "whoH2": "",
  "whoBody": "",
  "workEyebrow": "",
  "workH1": "",
  "workH2": "",
  "workIntro": "",
  "workItems": ["Item 1", "Item 2"],
  "pricingH2": "",
  "pricingSubhead": "",
  "pricingCta": "",
  "closingCta": "",
  "aboutEyebrow": "",
  "aboutH1": "",
  "aboutStory": "",
  "aboutStory2": "",
  "whyEyebrow": "",
  "whyH2": "",
  "whyOneMaker": "",
  "valuesEyebrow": "",
  "founderValues": ["Value1", "Value2"],
  "milestones": [["Milestone title", "Milestone description"]],
  "processEyebrow": "",
  "processH1": "",
  "processIntro": "",
  "processSteps": [["01", "Step title", "Step body"]],
  "calloutEyebrow": "",
  "calloutBody": "",
  "contactEyebrow": "",
  "contactH1": "",
  "contactIntro": "",
  "contactCta": "",
  "contactReassurance": "",
  "pricingTiers": [["Tier name", "Tier subtitle", "Description", "From $X"]],
  "colors": { "ink": "", "brass": "", "brass-deep": "", "bone": "", "asphalt": "", "stone": "", "warm-white": "", "text": "" },
  "fonts": ["Primary font", "Accent font"],
  "voiceRules": ["Rule 1", "Rule 2"],
  "headerNav": ["Link1", "Link2"],
  "headerCta": "",
  "footerTagline": ""
}

Rules:
- Use EXACT copy from the brief word for word. Never paraphrase.
- Keep anything in [brackets] exactly as written — these are human placeholders, never fill them in.
- For colors use hex codes exactly as written.
- For workItems: extract real project/film/work titles if listed, otherwise leave as empty array [].
- For milestones: extract any founder journey, company history, or timeline events from the About section.
- For pricingTiers: the subtitle is the short descriptor line like "CASH FLOW & TRUST" or "MARGIN & CRAFT".
- For differenceH2, whoH2, workH1, aboutH1: extract the actual headline copy, not the eyebrow label.
- If a field is genuinely absent from the brief, use empty string "" — never invent copy.`;

// Try models in order until one works
const MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-haiku-20240307",
];

async function callClaude(apiKey, messages, extraHeaders = {}) {
  for (const model of MODELS) {
    const headers = {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      ...extraHeaders,
    };
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        system: "You are a data extraction assistant. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
        messages,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return { ok: true, data, model };
    }
    const errBody = await response.text();
    console.log(`Model ${model} failed: ${response.status} — ${errBody.slice(0, 200)}`);
    if (response.status !== 404 && response.status !== 400) {
      return { ok: false, status: response.status, error: errBody };
    }
  }
  return { ok: false, status: 404, error: "No available model found" };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { content, type, fileName } = req.body || {};
  if (!content) return res.status(400).json({ error: "No content provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables." });

  try {
    let messages;
    let extraHeaders = {};

    if (type === "pdf") {
      extraHeaders["anthropic-beta"] = "pdfs-2024-09-25";
      messages = [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: content } },
          { type: "text", text: EXTRACTION_PROMPT }
        ]
      }];
    } else if (type === "docx") {
      const buffer = Buffer.from(content, "base64");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      if (!text.trim()) throw new Error("Could not extract text from DOCX file.");
      messages = [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${text}` }];
    } else {
      messages = [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${content}` }];
    }

    const result = await callClaude(apiKey, messages, extraHeaders);

    if (!result.ok) {
      return res.status(500).json({
        error: `API error (${result.status}): ${result.error?.slice(0, 300)}`,
      });
    }

    const rawText = result.data.content?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "Could not parse Claude response", raw: rawText.slice(0, 500) });

    return res.status(200).json({ ...JSON.parse(jsonMatch[0]), _model: result.model });

  } catch (err) {
    console.error("parse-brief error:", err);
    return res.status(500).json({ error: err.message });
  }
}
