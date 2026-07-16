// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
export function buildWorkPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var wp = patterns.portfolio || "masonry-grid";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Work</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Selected projects</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>A look at what we have built.</p>" +
      "</div></section>";
      var body = "";
      if (wp === "case-study-cards") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          [1,2,3,4].map(function(n) {
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-bottom:40px;background:#fff;border:1px solid #E2DBCC;border-radius:4px;overflow:hidden;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
              "<div style='padding:32px;'><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>Category</div>" +
              "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>Project Title " + n + "</h3>" +
              "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Brief description of this project and the results achieved.</p></div></div>";
          }).join("") + "</div></section>";
      } else if (wp === "full-width-stacked") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          [1,2,3].map(function(n) {
            return "<div style='margin-bottom:48px;'><div style='background:#e0ddd7;aspect-ratio:21/9;display:flex;align-items:center;justify-content:center;color:" + stone + ";margin-bottom:20px;border-radius:4px;'>Project " + n + " — full width image</div>" +
              "<div style='display:flex;justify-content:space-between;align-items:baseline;'>" +
              "<h3 style='font-size:20px;font-weight:700;color:" + ink + ";margin:0;'>Project Title " + n + "</h3>" +
              "<span style='font-size:13px;color:" + stone + ";'>Category · Year</span></div></div>";
          }).join("") + "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
          [1,2,3,4,5,6].map(function(n) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:" + (n % 2 === 0 ? "4/3" : "3/4") + ";display:flex;align-items:center;justify-content:center;color:" + stone + ";border-radius:4px;margin-bottom:12px;'>Project " + n + "</div>" +
              "<div style='font-size:15px;font-weight:600;color:" + ink + ";'>Project Title " + n + "</div>" +
              "<div style='font-size:13px;color:" + stone + ";'>Category</div></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
}
