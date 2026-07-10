import mammoth from "mammoth";
import { requireAuth } from "./_lib/auth.js";
import { rateLimit, tooMany } from "./_lib/ratelimit.js";
import { deepStripHTML } from "./_lib/sanitize.js";
import { callAnthropic, extractJSON } from "./_lib/anthropic.js";

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
  "closingBody": "",
  "phoneCta": "",
  "trustStat1": "", "trustLabel1": "",
  "trustStat2": "", "trustLabel2": "",
  "trustStat3": "", "trustLabel3": "",
  "feature1Heading": "", "feature1Body": "",
  "feature2Heading": "", "feature2Body": "",
  "feature3Heading": "", "feature3Body": "",
  "servicesHeading": "",
  "servicesList": ["Item 1", "Item 2"],
  "faqHeading": "",
  "faqItems": [{ "question": "", "answer": "" }],
  "whyUsIntro": "",
  "benefit1": "", "benefit2": "", "benefit3": "",
  "formHeading": "", "formSubhead": "",
  "formFields": ["Field 1", "Field 2"],
  "formCta": "", "formReassurance": "",
  "testimonial1Quote": "", "testimonial1Name": "", "testimonial1Title": "",
  "testimonial2Quote": "", "testimonial2Name": "", "testimonial2Title": "",
  "testimonial3Quote": "", "testimonial3Name": "", "testimonial3Title": "",
  "mapAddress": "", "mapUrl": "",
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
  "servicesEyebrow": "",
  "servicesH1": "",
  "pricingTiers": [["Tier name", "Tier subtitle", "Description", "From $X"]],
  "pricingMenuHeading": "",
  "pricingMenu": [{ "category": "", "items": [{ "name": "", "price": "", "desc": "", "includes": "" }] }],
  "pricingNote": "",
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
- If a field is genuinely absent from the brief, use empty string "" — never invent copy.
- For servicesEyebrow/servicesH1: these are the standalone Services & Pricing page's own header, distinct from pricingH2/pricingSubhead (which are the short pricing teaser on the Home page). Extract them separately even if the brief only has one pricing section — use that same section's heading for both if there's no separate Services page section.
- For pricingMenu: this is a separate, optional itemized add-on/full-menu list distinct from pricingTiers (the top-line 3-tier comparison). Only extract it if the brief has a genuine itemized list of individual services or add-ons beyond the main tiers, grouped or not. If the brief only has the 3 main tiers and nothing more granular, leave pricingMenu as an empty array [] — do not invent categories or items, and do not duplicate the 3 tiers into pricingMenu.
- The trustStat/trustLabel, feature, testimonial, benefit, form, and map fields only apply if this brief is for a standalone landing/ad page. If the brief is for a general multi-page site with no landing-page section, leave all of these as empty string "" or empty array [] — do not repurpose Home-page content to fill them.
- For faqItems: extract each question/answer pair exactly as written. Never invent a question or answer that isn't in the brief.
- For testimonials: only extract a quote, name, and title if a real testimonial is present in the brief. If a testimonial slot is explicitly blank or marked for AI drafting, leave that testimonial's three fields as empty string "" rather than inventing a quote.
- For mapUrl: only use a URL that is explicitly written in the brief. Never construct or guess a Google Maps link from an address.`;

// Try models in order until one works. Every ID here is already used
// successfully elsewhere in this app (generate-copy.js, describeMySite,
// GenerateFromKeywordsModal) — no unverified/guessed model IDs, so a brief
// parse doesn't waste a round-trip on a model that never resolves.
// Step-down fallback: primary model first, then one tier down on cost/
// capability. Both IDs verified current as of July 2026 — claude-sonnet-4-6
// ($3/$15 per MTok) and claude-haiku-4-5-20251001 ($1/$5 per MTok, already
// proven working elsewhere in this app — see api/draft-copy.js). The old
// 4-model chain included 3 models retired by Anthropic between Oct 2025 and
// Apr 2026, so it silently had zero real fallback coverage.
const MODELS = [
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
];

async function callClaude(apiKey, messages, extraHeaders = {}) {
  for (const model of MODELS) {
    const { ok, status, data } = await callAnthropic(apiKey, {
      model,
      // Raised from 4000 — the extraction schema now covers 90+ fields
      // (landing page, services menu, testimonials, FAQ, etc.), and a
      // content-rich multi-page brief can legitimately produce a response
      // large enough to hit the old ceiling, truncating mid-JSON and
      // failing to parse. Stays under ~16k, the point where responses need
      // streaming to avoid request timeouts — this endpoint isn't streamed.
      max_tokens: 8000,
      system: "You are a data extraction assistant. Return ONLY valid JSON with no markdown, no code fences, no explanation.",
      messages,
    }, extraHeaders);
    if (ok) return { ok: true, data, model };
    console.log(`Model ${model} failed: ${status} — ${JSON.stringify(data).slice(0, 200)}`);
    if (status !== 404 && status !== 400) {
      return { ok: false, status, error: JSON.stringify(data) };
    }
  }
  return { ok: false, status: 404, error: "No available model found" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const userId = await requireAuth(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  if (!(await rateLimit(userId, "parse-brief", 10))) return tooMany(res);


  const { content, type } = req.body || {};
  if (!content || typeof content !== "string") return res.status(400).json({ error: "No content provided" });
  // ~4MB cap on uploaded brief content (base64 or text). Vercel enforces a
  // body limit too; this returns a clean error instead of a platform 413.
  if (content.length > 4 * 1024 * 1024) {
    return res.status(413).json({ error: "File too large. Briefs must be under 3MB." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel environment variables." });

  try {
    let messages;
    let extraHeaders = {};
    let sourceText = null; // raw text, when we have local access to it (docx/text but not pdf)

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
      const text = result.value.slice(0, 150000);
      if (!text.trim()) throw new Error("Could not extract text from DOCX file.");
      sourceText = text;
      messages = [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${text}` }];
    } else {
      sourceText = content.slice(0, 150000);
      messages = [{ role: "user", content: `${EXTRACTION_PROMPT}\n\nBRIEF CONTENT:\n\n${sourceText}` }];
    }

    const result = await callClaude(apiKey, messages, extraHeaders);

    if (!result.ok) {
      return res.status(500).json({
        error: `API error (${result.status}): ${result.error?.slice(0, 300)}`,
      });
    }

    const parsed = extractJSON(result.data);
    if (!parsed) {
      const rawText = result.data.content?.[0]?.text || "";
      return res.status(500).json({ error: "Could not parse Claude response", raw: rawText.slice(0, 500) });
    }

    if (parsed.colors && typeof parsed.colors === "object") {
      // Hard guarantee for docx/text sources (where we have the raw source
      // text locally, not just what the model chose to report): if the
      // source contains no hex-color pattern at all, there is no real
      // palette to extract — force colors empty regardless of what the
      // model returned. This doesn't depend on trusting the model's
      // judgment or guessing at hallucination patterns; it's a direct
      // check against the actual source.
      const sourceHasHex = sourceText ? /#[0-9a-fA-F]{3,8}\b/.test(sourceText) : true; // unknown for PDFs, skip this guarantee
      if (sourceText && !sourceHasHex) {
        parsed.colors = { ink: "", brass: "", "brass-deep": "", bone: "", asphalt: "", stone: "", "warm-white": "", text: "" };
      } else {
        // Fallback heuristic for PDFs (no local text to check) or as a
        // second layer here: a real extracted palette has real variety
        // across its 8 slots. If everything collapses into 1-2 repeated
        // hex values, that's the model inventing/duplicating, not a
        // genuine find.
        const vals = Object.values(parsed.colors).filter(Boolean);
        const distinct = new Set(vals.map(v => String(v).toLowerCase()));
        if (vals.length >= 4 && distinct.size <= 2) {
          parsed.colors = { ink: "", brass: "", "brass-deep": "", bone: "", asphalt: "", stone: "", "warm-white": "", text: "" };
        }
      }
    }

    return res.status(200).json(deepStripHTML({ ...parsed, _model: result.model }));

  } catch (err) {
    console.error("parse-brief error:", err);
    return res.status(500).json({ error: err.message });
  }
}
