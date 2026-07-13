import { useState } from "react";
import { authHeaders } from "../../utils/api.js";
import { logTemplateQuery } from "../../utils/templateQueries.js";
import {
  verifyThemeReasonAgainstColors,
  detectMissingRequestedColors,
  prefixMissingColorsWarning,
  retryColorPalette,
  mergeCorrectedColors,
} from "../../utils/colorRequestCheck.js";

// GenerateFromKeywordsModal
// Opened from the "Generate from keywords" option in the Add Page dropdown.
// User types keywords (e.g. "Ninja Turtle comic book collector").
// AI searches for thematic info, picks colors, sections, and drafts dummy copy.
// Returns a fully structured page object dropped into the active project.
// Multiple versions can be generated and kept for A/B comparison.

export function GenerateFromKeywordsModal({ _brand, initialKeywords, onClose, onAddPage, _userId }) {
  const [keywords, setKeywords] = useState(initialKeywords || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);   // array of generated page configs
  const [selected, setSelected] = useState(null);

  async function generate() {
    if (!keywords.trim()) return;
    setLoading(true);
    setError("");

    const systemPrompt = `You are a creative web designer who generates themed webpage content from keywords.
Given keywords, you research the theme, extract authentic colors and aesthetic, pick appropriate sections, and write engaging dummy copy in that niche's voice.

Return ONLY valid JSON — no preamble, no markdown fences:
{
  "pageName": "Short descriptive page name (2-4 words)",
  "pageType": "The type of page (e.g. Collection, Review, About, Landing)",
  "theme": "1-sentence description of the aesthetic and vibe",
  "colors": {
    "primary": "#hex — main background or dominant color from the theme",
    "accent": "#hex — standout accent color from the theme",
    "text": "#hex — readable text color on the primary background",
    "card": "#hex — card/surface background color"
  },
  "headingFont": "One of: Manrope, Inter, Playfair Display, Oswald, Fraunces, Space Mono, Cormorant Garamond",
  "imageCategory": "One of: marketing, production, product, lifestyle, editorial, portrait, trades, automotive, default",
  "sections": ["array of 4-7 section types from: Hero, About, Service Cards, Portfolio Carousel, Stats, Testimonials, Blog, FAQ, Form, CTA, Marquee, Pricing, Leadership, Process, Team, Logo Carousel, Video"],
  "copy": {
    "heroEyebrow": "2-4 word eyebrow label",
    "heroHeading": "Main headline — 6-12 words, thematic, engaging",
    "heroSubhead": "1-2 sentences. What this page is about, in the theme's voice.",
    "aboutHeading": "5-8 word heading for the about/intro section",
    "aboutBody": "60-100 words of dummy body copy in the theme's authentic voice. Specific and immersive — feels like real content.",
    "cta": "2-4 word primary CTA button",
    "tagline": "4-7 word tagline capturing the theme's essence"
  },
  "seoSlug": "url-friendly-slug-for-page"
}

Rules:
- Colors must come from the actual theme described, never a generic default palette -- base every choice entirely on what the user typed, not on any example elsewhere in this prompt
- HARD REQUIREMENT, HIGHEST PRIORITY: if the input explicitly names specific colors or color families (e.g. "blues", "browns", "hues of pink", a hex code), every one of those families MUST actually appear in the returned colors. This overrides every other instruction here, including the anti-default-look rule below. Do not substitute a similar-but-different family and do not quietly drop a requested color because it doesn't fit your first instinct.
- STOP DEFAULTING TO THE SAME LOOK: custom-generated projects keep converging on black/near-black + warm gold-tan + cream with an editorial serif heading, regardless of how different the actual input is. "It's premium" or "it's boutique" is not a strong enough reason to reach for that combination -- most niches qualify in some sense, and defaulting to it every time defeats the point. Before finalizing, weigh at least 2 concretely different directions for THIS specific input: (a) saturated and energetic with a bold geometric sans instead of an editorial serif; (b) soft and pastel-toned rather than dark; (c) stark black-and-white minimalism instead of a warm neutral base; (d) a genuinely different accent hue family -- blue, green, pink, red -- not another warm gold/tan/amber/bronze/rose. Pick whichever direction actually fits best, including the default when it genuinely is the best fit -- the requirement is that real alternatives get weighed, not that the default is banned outright.
- Copy must sound authentically niche — a comic collector site sounds different from a fleet maintenance site
- Sections should make sense for the page type and theme
- If the theme is pop culture, entertainment, collector, hobby, or creative — lean into it fully
- Font choice should match the vibe (editorial serif for luxury/art, mono for tech/gaming, sans for modern)
- imageCategory: pick whichever of marketing|production|product|lifestyle|editorial|portrait|trades|automotive|default is the closest real visual match to the theme. "editorial" specifically means beauty/skincare/fashion photography, not a generic catch-all. Use "default" (generic office/workspace) when nothing genuinely fits rather than forcing a mismatch.`;

    const userPrompt = `Generate a themed webpage for these keywords: ${keywords.trim()}

Research what this theme looks, sounds, and feels like. Use authentic colors from this world, write copy that sounds like it belongs there, and pick sections that serve this type of page.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(clean);
      const rawInput = keywords.trim();

      // Same color-request check + one-shot correction retry as the
      // "describe your site" flow (colorRequestCheck.js) -- this tool had
      // only the prompt-level rule before, which was already proven live
      // not to be reliable enough on its own for the sibling entry point.
      // ai.colors uses { primary, accent, text, card }; the shared module
      // expects { background, accent, text, card } -- mapped at this
      // boundary rather than teaching the shared module about this file's
      // specific schema.
      let normalizedColors = parsed.colors ? {
        background: parsed.colors.primary,
        accent: parsed.colors.accent,
        text: parsed.colors.text,
        card: parsed.colors.card,
      } : null;
      let themeReason = parsed.theme || "";
      if (normalizedColors) {
        themeReason = verifyThemeReasonAgainstColors(normalizedColors, themeReason);
      }
      let colorRetryFired = false;
      let colorRetrySucceeded = false;
      const missingColors = (rawInput && normalizedColors)
        ? detectMissingRequestedColors(rawInput, normalizedColors)
        : [];
      if (missingColors.length > 0) {
        colorRetryFired = true;
        const corrected = await retryColorPalette(authHeaders, rawInput, normalizedColors, missingColors);
        if (corrected && corrected.colors) {
          normalizedColors = mergeCorrectedColors(normalizedColors, corrected.colors);
          themeReason = corrected.themeReason || themeReason;
          colorRetrySucceeded = detectMissingRequestedColors(rawInput, normalizedColors).length === 0;
        }
      }
      if (normalizedColors) {
        themeReason = prefixMissingColorsWarning(rawInput, normalizedColors, themeReason);
      }
      // Map back to this file's own { primary, accent, text, card } shape
      // before it flows into buildPageFromAI, which already expects that
      // schema and is left untouched.
      const finalParsed = {
        ...parsed,
        colors: normalizedColors ? {
          primary: normalizedColors.background,
          accent: normalizedColors.accent,
          text: normalizedColors.text,
          card: normalizedColors.card,
        } : (parsed.colors || {}),
        theme: themeReason,
      };

      // Build a Template Studio-compatible page object from the AI result
      const newPage = buildPageFromAI(finalParsed, rawInput);
      setResults(prev => [newPage, ...prev]);
      setSelected(0);
      // This tool never matches against WEBSITE_TEMPLATES -- every result
      // here is effectively isCustom by design, so logged as such with no
      // matched template. Fire-and-forget, never blocks the UI.
      logTemplateQuery("keywords_modal", rawInput, true, null, colorRetryFired, colorRetrySucceeded);
    } catch(e) {
      const msg = e.name === "AbortError"
        ? "Request timed out — try again."
        : `Couldn't generate: ${e.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const VALID_IMAGE_CATEGORIES = ["marketing", "production", "product", "lifestyle", "editorial", "portrait", "trades", "automotive", "default"];

  function buildPageFromAI(ai, keywords) {
    const id = "custom-" + Date.now();
    return {
      id,
      name: ai.pageName || keywords.split(" ").slice(0, 3).join(" "),
      pageType: ai.pageType || "Custom",
      sections: ai.sections || ["Hero", "About", "Service Cards", "CTA"],
      heroHeading: ai.copy?.heroHeading || "",
      heroSubhead: ai.copy?.heroSubhead || "",
      heroEyebrow: ai.copy?.heroEyebrow || "",
      aboutHeading: ai.copy?.aboutHeading || "",
      aboutBody: ai.copy?.aboutBody || "",
      // Store AI colors and font as overrides to apply when page is added
      _aiColors: ai.colors || {},
      _aiFont: ai.headingFont || "",
      // Validated against the real IMAGE_LIBRARY categories -- an
      // unrecognized or missing value falls through to "default" (generic
      // office/workspace) rather than an unvalidated string reaching
      // imgOrPlaceholder(), which would just silently fall back to ITS
      // OWN default ("editorial" = beauty/skincare/fashion) if it doesn't
      // recognize the category -- same failure mode this is meant to fix.
      _aiImageCategory: VALID_IMAGE_CATEGORIES.includes(ai.imageCategory) ? ai.imageCategory : "default",
      _aiTheme: ai.theme || "",
      _aiTagline: ai.copy?.tagline || "",
      _aiCta: ai.copy?.cta || "",
      _aiSlug: ai.seoSlug || id,
      _keywords: keywords,
    };
  }

  function applyAndAdd(pageConfig) {
    onAddPage(pageConfig);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "720px", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", fontFamily: "'Be Vietnam Pro', sans-serif" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Generate from keywords</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Type keywords and get a themed page with colors, sections, and dummy copy.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
        </div>

        {/* Input */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #dde0e6", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !loading) generate(); }}
              placeholder="e.g. Ninja Turtle comic book collector, vintage record shop, artisan coffee roaster"
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "14px", color: "#09090b", outline: "none", fontFamily: "inherit" }}
              autoFocus
            />
            <button
              onClick={generate}
              disabled={!keywords.trim() || loading}
              style={{ padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: (!keywords.trim() || loading) ? "#dde0e6" : "#b45309", color: "#fff", border: "none", borderRadius: "8px", cursor: (!keywords.trim() || loading) ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>
            Press Enter to generate · You can generate multiple versions and keep the one you like
          </div>
          {error && <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>{error}</div>}
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading && (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>Researching theme, pulling colors, drafting copy…</div>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: "80px", background: "#f4f4f5", borderRadius: "8px", marginBottom: "10px", animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          )}

          {results.length === 0 && !loading && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✦</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#6b7280", marginBottom: "6px" }}>No pages generated yet</div>
              <div style={{ fontSize: "13px" }}>Type keywords above and hit Generate. Try something specific.</div>
            </div>
          )}

          {results.map((page, i) => {
            const colors = page._aiColors || {};
            const isSelected = selected === i;
            return (
              <div
                key={page.id}
                onClick={() => setSelected(i)}
                style={{ border: isSelected ? "2px solid #b45309" : "1px solid #dde0e6", borderRadius: "10px", marginBottom: "14px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
              >
                {/* Color preview bar */}
                <div style={{ height: "8px", background: colors.primary ? `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} 50%, ${colors.accent || colors.primary} 50%)` : "#dde0e6" }} />

                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b", marginBottom: "2px" }}>{page.name}</div>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>{page._aiTheme}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      {colors.primary && <div title={colors.primary} style={{ width: "20px", height: "20px", borderRadius: "50%", background: colors.primary, border: "1px solid rgba(0,0,0,0.1)" }} />}
                      {colors.accent && <div title={colors.accent} style={{ width: "20px", height: "20px", borderRadius: "50%", background: colors.accent, border: "1px solid rgba(0,0,0,0.1)" }} />}
                      {colors.card && <div title={colors.card} style={{ width: "20px", height: "20px", borderRadius: "50%", background: colors.card, border: "1px solid rgba(0,0,0,0.1)" }} />}
                    </div>
                  </div>

                  {page.heroHeading && (
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#09090b", marginBottom: "6px", lineHeight: 1.3 }}>"{page.heroHeading}"</div>
                  )}
                  {page.aboutBody && (
                    <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.6, marginBottom: "12px" }}>{page.aboutBody.slice(0, 120)}…</div>
                  )}

                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
                    {(page.sections || []).map(s => (
                      <span key={s} style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(180,83,9,0.08)", color: "#b45309", borderRadius: "10px", fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>

                  {page._aiFont && (
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "10px" }}>Font: {page._aiFont}</div>
                  )}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={e => { e.stopPropagation(); applyAndAdd(page); }}
                      style={{ flex: 1, padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                      Add this page to project
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); generate(); }}
                      disabled={loading}
                      style={{ padding: "8px 14px", fontSize: "12px", fontWeight: 500, background: "#fff", color: "#6b7280", border: "1px solid #dde0e6", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}>
                      Generate another
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
