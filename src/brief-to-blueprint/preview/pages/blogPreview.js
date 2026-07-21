// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildBlogPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp;
      var bp = patterns.blog || "grid-3col";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Journal</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 48px;line-height:1.1;'>Latest thoughts</h1>" +
      "</div></section>";
      var articles = ["Strategy & Growth", "Behind the Scenes", "Industry Insights", "Case Study", "Tips & Guides", "News"];
      if (bp === "featured-plus-grid") {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:16/10;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Featured image</div>" +
            "<div style='display:flex;flex-direction:column;justify-content:center;'><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;'>Featured</div>" +
            "<h2 style='font-size:28px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>Featured Article Title</h2>" +
            "<p style='font-size:16px;color:" + stone + ";line-height:1.6;margin:0;'>A longer excerpt that gives readers a reason to dive into this featured piece.</p></div>" +
          "</div>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            articles.slice(0,3).map(function(cat) {
              return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;margin-bottom:12px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" +
                "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>" + cat + "</div>" +
                "<h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>Article Title</h3>" +
                "<p style='font-size:14px;color:" + stone + ";line-height:1.5;margin:0;'>Short excerpt text.</p></div>";
            }).join("") +
          "</div></div></section>";
      } else if (bp === "list-view") {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          articles.slice(0,5).map(function(cat) {
            return "<div style='display:grid;grid-template-columns:120px 1fr;gap:20px;padding:24px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Thumb</div>" +
              "<div><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>" + cat + "</div>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 4px;'>Article Title Goes Here</h3>" +
              "<p style='font-size:13px;color:" + stone + ";margin:0;'>5 min read</p></div></div>";
          }).join("") +
        "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
          articles.slice(0,3).map(function(cat) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" +
              "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>" + cat + "</div>" +
              "<h3 style='font-size:20px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>Article Title Goes Here</h3>" +
              "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Short excerpt giving readers a reason to click through.</p>" +
              "<div style='font-size:13px;color:" + stone + ";margin-top:12px;'>5 min read</div></div>";
          }).join("") +
        "</div></section>";
      }
}
