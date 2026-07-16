// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildDownloadsPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var ditems = [["Brand Guidelines Template","Start with a professional framework."],["Social Media Calendar","Plan your content month by month."],["Project Scope Template","Define deliverables before you start."],["Invoice Template","Clean, professional billing."]];
      var dheader = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Downloads</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Free downloads</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Grab what you need. No email required.</p>" +
      "</div></section>";
      if (variant === "B") {
        return dheader + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          ditems.map(function(d) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;text-align:center;'>" +
              "<div style='width:48px;height:48px;background:rgba(180,83,9,.1);border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:" + brassDp + ";'>PDF</div>" +
              "<h3 style='font-size:15px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + d[0] + "</h3>" +
              "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;line-height:1.5;'>" + d[1] + "</p>" +
              "<a style='padding:10px 20px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Download</a>" +
            "</div>";
          }).join("") + "</div></section>";
      }
      return dheader + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
        ditems.map(function(d) {
          return "<div style='display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + d[0] + "</div><div style='font-size:14px;color:" + stone + ";'>" + d[1] + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;white-space:nowrap;'>Download</a></div>";
        }).join("") +
      "</div></section>";
}
