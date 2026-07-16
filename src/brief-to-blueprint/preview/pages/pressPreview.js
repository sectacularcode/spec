// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildPressPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var articles = [["How This Startup is Changing the Game","Forbes · January 2026"],["10 Companies to Watch in 2026","Inc. · March 2026"],["The Future of Digital Services","TechCrunch · May 2026"]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Press</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>In the media</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Coverage, features, and media mentions.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Featured hero article + grid
        return "<section style='background:" + ink + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;'>Featured Coverage</div>" +
          "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.2;'>" + articles[0][0] + "</h2>" +
          "<p style='font-size:15px;color:" + stone + ";margin:0 0 24px;'>" + articles[0][1] + "</p>" +
          "<a style='font-size:14px;color:" + brass + ";font-weight:600;text-decoration:none;'>Read the story →</a></div>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Press image</div>" +
        "</div></section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:1160px;margin:0 auto;'>" +
          articles.slice(1).map(function(a) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:28px;border-radius:4px;'>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + a[0] + "</h3>" +
              "<div style='font-size:13px;color:" + stone + ";margin-bottom:16px;'>" + a[1] + "</div>" +
              "<a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;'>Read →</a></div>";
          }).join("") +
        "</div></section>";
      }
      // Variant A — logo bar + article list (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 48px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;padding:40px 0;border-bottom:1px solid #E2DBCC;'>" +
            ["Forbes", "Inc.", "TechCrunch", "Fast Company", "Bloomberg"].map(function(pub) {
              return "<div style='text-align:center;padding:20px;background:#fff;border:1px solid #E2DBCC;border-radius:4px;'><div style='font-size:18px;font-weight:700;color:" + stone + ";'>" + pub + "</div></div>";
            }).join("") +
          "</div>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          articles.map(function(a) {
            return "<div style='display:grid;grid-template-columns:1fr auto;gap:24px;padding:24px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 4px;'>" + a[0] + "</h3><div style='font-size:14px;color:" + stone + ";'>" + a[1] + "</div></div>" +
              "<a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;white-space:nowrap;'>Read →</a></div>";
          }).join("") +
        "</div></section>";
}
