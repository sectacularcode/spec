import { he } from "../../utils/htmlEscape.js";

// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildTestimonialsPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp;
      var tp = patterns.testimonials || "card-grid";
      var quotes = [
        { q: "This changed everything for our business.", name: "Client Name", role: "Role, Company" },
        { q: "Professional, efficient, and genuinely cared about the outcome.", name: "Client Name", role: "Role, Company" },
        { q: "We saw results within the first month.", name: "Client Name", role: "Role, Company" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 48px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Testimonials</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>What our clients say.</h1>" +
      "</section>";
      if (tp === "single-feature") {
        return "<section style='background:" + ink + ";padding:120px 40px;text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:60px;color:" + brass + ";line-height:1;margin-bottom:24px;'>\u201c</div>" +
            "<p style='font-size:clamp(22px,3vw,32px);color:" + warmWhite + ";line-height:1.5;font-weight:300;margin:0 0 40px;'>" + he(quotes[0].q) + "</p>" +
            "<div style='width:40px;height:2px;background:" + brass + ";margin:0 auto 24px;'></div>" +
            "<div style='font-size:15px;font-weight:700;color:" + warmWhite + ";'>" + he(quotes[0].name) + "</div>" +
            "<div style='font-size:13px;color:" + stone + ";margin-top:6px;'>" + he(quotes[0].role) + "</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px 96px;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:900px;margin:0 auto;'>" +
            quotes.slice(1).map(function(qt) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'>" +
                "<p style='font-size:16px;color:" + ink + ";line-height:1.6;margin:0 0 20px;'>" + he(qt.q) + "</p>" +
                "<div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + he(qt.name) + "</div>" +
                "<div style='font-size:13px;color:" + stone + ";'>" + he(qt.role) + "</div>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>";
      } else if (tp === "alternating-quotes") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:960px;margin:0 auto;'>" +
            quotes.map(function(qt, i) {
              var isRight = i % 2 === 1;
              return "<div style='display:grid;grid-template-columns:72px 1fr;gap:24px;padding:40px 0;border-bottom:1px solid #E2DBCC;align-items:start;" + (isRight ? "direction:rtl;" : "") + "'>" +
                "<div style='background:#e0ddd7;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;" + (isRight ? "direction:ltr;" : "") + "'>Photo</div>" +
                "<div style='" + (isRight ? "direction:ltr;text-align:right;" : "") + "'>" +
                  "<p style='font-size:18px;color:" + ink + ";line-height:1.6;margin:0 0 16px;font-style:italic;'>\u201c" + he(qt.q) + "\u201d</p>" +
                  "<div style='font-size:14px;font-weight:700;color:" + ink + ";'>" + he(qt.name) + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";'>" + he(qt.role) + "</div>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // card-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            quotes.map(function(qt) {
              return "<div style='background:#fff;border-left:3px solid " + brass + ";padding:32px;'><p style='font-family:Inter,sans-serif;font-size:18px;color:" + ink + ";line-height:1.5;margin:0 0 20px;'>" + he(qt.q) + "</p><div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + he(qt.name) + "</div><div style='font-size:13px;color:" + stone + ";'>" + he(qt.role) + "</div></div>";
            }).join("") +
          "</div></section>";
      }
}
