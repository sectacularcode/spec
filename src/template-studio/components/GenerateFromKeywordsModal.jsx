import { useState } from "react";
import { authHeaders } from "../../utils/api.js";

// GenerateFromKeywordsModal
// Opened from the "Generate from keywords" option in the Add Page dropdown.
// User types keywords (e.g. "Ninja Turtle comic book collector").
// AI searches for thematic info, picks colors, sections, and drafts dummy copy.
// Returns a fully structured page object dropped into the active project.
// Multiple versions can be generated and kept for A/B comparison.

export function GenerateFromKeywordsModal({ brand, initialKeywords, onClose, onAddPage, userId }) {
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
- Colors must come from the actual theme (e.g. Ninja Turtles = green/purple/orange, not generic blue)
- Copy must sound authentically niche — a comic collector site sounds different from a fleet maintenance site
- Sections should make sense for the page type and theme
- If the theme is pop culture, entertainment, collector, hobby, or creative — lean into it fully
- Font choice should match the vibe (editorial serif for luxury/art, mono for tech/gaming, sans for modern)`;

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

      // Build a Template Studio-compatible page object from the AI result
      const newPage = buildPageFromAI(parsed, keywords.trim());
      setResults(prev => [newPage, ...prev]);
      setSelected(0);
    } catch(e) {
      const msg = e.name === "AbortError"
        ? "Request timed out — try again."
        : `Couldn't generate: ${e.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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
