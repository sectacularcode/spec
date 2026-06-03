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
  "workH2": "",
  "workItems": ["Film 1", "Film 2", "Film 3"],
  "pricingH2": "",
  "pricingSubhead": "",
  "pricingCta": "",
  "closingCta": "",
  "aboutH1": "",
  "aboutStory": "",
  "whyOneMaker": "",
  "founderValues": ["Value1", "Value2"],
  "processH1": "",
  "processSteps": [["01", "Step title", "Step body"]],
  "contactH1": "",
  "contactIntro": "",
  "contactCta": "",
  "contactReassurance": "",
  "pricingTiers": [["Tier name", "From $X", "Description"]],
  "colors": { "ink": "", "brass": "", "brass-deep": "", "bone": "", "asphalt": "", "stone": "", "warm-white": "", "text": "" },
  "fonts": ["Primary font", "Accent font"],
  "voiceRules": ["Rule 1", "Rule 2"],
  "headerNav": ["Link1", "Link2"],
  "headerCta": "",
  "footerTagline": "",
  "seoHome": {"title": "", "description": ""},
  "seoWork": {"title": "", "description": ""},
  "seoServices": {"title": "", "description": ""},
  "seoAbout": {"title": "", "description": ""},
  "seoProcess": {"title": "", "description": ""},
  "seoContact": {"title": "", "description": ""}
}

Rules:
- Use EXACT copy from the brief, word for word. Never paraphrase or improve.
- If a field appears in brackets like [last name], keep the brackets.
- For colors, use hex codes exactly as written.
- serviceCards: each entry is ["Short title", "One line description"].
- pricingTiers: each entry is ["Name", "Price range", "Description"].
- processSteps: each entry is ["01", "Step title", "Step body"].`;

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

  let messages;
  const anthropicHeaders = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };

  try {
    if (type === "pdf") {
      // Send PDF directly to Claude as a document block
      anthropicHeaders["anthropic-beta"] = "pdfs-2024-09-25";
      messages = [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: content } },
          { type: "text", text: EXTRACTION_PROMPT }
        ]
      }];

    } else if (type === "docx") {
      // Convert DOCX to text using mammoth, then send as text
      const buffer = Buffer.from(content, "base64");
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      if (!text.trim()) throw new Error("Could not extract text from DOCX file.");
      messages = [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${text}` }];

    } else {
      // Plain text
      messages = [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${content}` }];
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: anthropicHeaders,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: "You are a data extraction assistant. Extract structured information from brand briefs and return ONLY valid JSON with no other text, no markdown, no code fences.",
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(500).json({ error: `Anthropic API error: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\n?/gi, "").replace(/```\n?/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "Could not parse Claude response", raw: rawText.slice(0, 500) });

    return res.status(200).json(JSON.parse(jsonMatch[0]));

  } catch (err) {
    console.error("parse-brief error:", err);
    return res.status(500).json({ error: err.message });
  }
}
