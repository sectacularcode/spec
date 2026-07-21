// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
export function buildPortfolioPreview(brief, variant, inspoContext, colors, _patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      if (variant === "B") {
        // Editorial: bone hero + single full-width image + case study narrative
        return "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:800px;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Portfolio</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Project Title</h1>" +
          "<p style='font-size:17px;color:" + text + ";margin:0;line-height:1.7;'>Client Name · Category · Year</p>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 40px;'><div style='background:#e0ddd7;aspect-ratio:16/7;max-width:1160px;margin:0 auto;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Project hero image</div></section>" +
        "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 2fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
          "<div>" +
            "<div style='margin-bottom:32px;'><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Client</div><p style='font-size:15px;color:" + text + ";'>Client Name</p></div>" +
            "<div style='margin-bottom:32px;'><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Category</div><p style='font-size:15px;color:" + text + ";'>Category</p></div>" +
            "<div><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Year</div><p style='font-size:15px;color:" + text + ";'>2026</p></div>" +
          "</div>" +
          "<div><p style='font-size:17px;color:" + text + ";line-height:1.8;'>Full project description, approach, and results go here. This editorial layout gives the narrative room to breathe alongside the images.</p></div>" +
        "</div></section>";
      }
      // Variant A — dark hero + image grid (current)
      return "<section style='background:" + ink + ";padding:100px 40px;'>" +
        "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Portfolio</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.1;'>Project Title</h1>" +
        "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;'>Client Name · Category · Year</p>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:64px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:16px;max-width:1160px;margin:0 auto;'>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:48px 40px 96px;'><div style='max-width:760px;margin:0 auto;font-size:17px;color:" + text + ";line-height:1.8;'><p>Project description and details go here.</p></div></section>";
}
