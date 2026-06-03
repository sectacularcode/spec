// api/parse-brief.js
// Vercel serverless function — receives a brand brief (PDF or text),
// sends it to Claude, and returns structured JSON the generator can read.

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
  "serviceCards": [["Title", "Body copy"], ["Title", "Body copy"]],
  "differenceEyebrow": "",
  "differenceH2": "",
  "differenceBody": "",
  "whoEyebrow": "",
  "whoH2": "",
  "whoBody": "",
  "workH2": "",
  "workItems": ["Film 1", "Film 2", "Film 3"],
  "pricingH2": "",
  "pricingSubhead": "",
  "pricingCta": "",
  "closingCta": "",
  "aboutH1": "",
  "aboutStory": "",
  "whyOneMaker": "",
  "founderValues": ["Value1", "Value2", "Value3"],
  "processH1": "",
  "processSteps": [["01", "Step title", "Step body"]],
  "contactH1": "",
  "contactIntro": "",
  "contactCta": "",
  "contactReassurance": "",
  "pricingTiers": [["Tier name", "From $X", "Description"]],
  "colors": {
    "ink": "",
    "brass": "",
    "brass-deep": "",
    "bone": "",
    "asphalt": "",
    "stone": "",
    "warm-white": "",
    "text": ""
  },
  "fonts": ["Primary font", "Accent font"],
  "voiceRules": ["Rule 1", "Rule 2"],
  "headerNav": ["Link1", "Link2"],
  "headerCta": "",
  "footerTagline": "",
  "footerSignatureLine": "",
  "seoHome": {"title": "", "description": ""},
  "seoWork": {"title": "", "description": ""},
  "seoServices": {"title": "", "description": ""},
  "seoAbout": {"title": "", "description": ""},
  "seoProcess": {"title": "", "description": ""},
  "seoContact": {"title": "", "description": ""}
}

Rules:
- Use the EXACT copy from the brief, word for word. Never paraphrase or improve.
- If a field appears in brackets like [last name], keep the brackets.
- For colors, use hex codes exactly as written (#XXXXXX format).
- For serviceCards, each entry is ["Short title", "One line description"].
- For pricingTiers, each entry is ["Tier name", "Price range", "Description"].
- For processSteps, each entry is ["01", "Step title", "Step body"].`;

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { content, type, fileName } = req.body || {};
  if (!content) return res.status(400).json({ error: "No content provided" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables." });

  // Build the message — PDF gets sent as a document block, text goes inline
  let messages;
  const headers = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  if (type === "pdf") {
    headers["anthropic-beta"] = "pdfs-2024-09-25";
    messages = [{
      role: "user",
      content: [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: content }
        },
        { type: "text", text: EXTRACTION_PROMPT }
      ]
    }];
  } else {
    messages = [{
      role: "user",
      content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${content}`
    }];
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: "You are a data extraction assistant. Extract structured information from brand briefs and return ONLY valid JSON with no other text, no markdown, no code fences.",
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(500).json({ error: `Anthropic API error: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();

    // Extract the JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", rawText);
      return res.status(500).json({ error: "Claude did not return valid JSON", raw: rawText.slice(0, 500) });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("parse-brief error:", err);
    return res.status(500).json({ error: err.message });
  }
};
