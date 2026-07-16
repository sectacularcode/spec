// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildResourcesPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var items = [["Getting Started Guide","A step-by-step walkthrough for new clients.","PDF"],["Brand Toolkit","Templates, guidelines, and assets for your brand.","ZIP"],["Project Brief Template","Fill this out before our first meeting.","DOCX"],["Case Study Collection","Real results from real projects.","PDF"]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Resources</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Guides, tools, and downloads</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Everything you need to get the most out of working with us.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Categorized list
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
            items.map(function(r) {
              return "<div style='display:grid;grid-template-columns:1fr auto;gap:24px;padding:20px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + r[0] + "</div><div style='font-size:14px;color:" + stone + ";'>" + r[1] + "</div></div>" +
                "<div style='display:flex;align-items:center;gap:12px;'><span style='font-size:11px;font-weight:700;color:" + brassDp + ";background:rgba(180,83,9,.1);padding:4px 8px;border-radius:3px;'>" + r[2] + "</span><a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;white-space:nowrap;'>Download →</a></div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      }
      // Variant A — card grid (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          items.map(function(r) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:28px;border-radius:4px;display:flex;gap:20px;align-items:flex-start;'>" +
              "<div style='width:48px;height:48px;background:" + bone + ";border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:" + brassDp + ";flex-shrink:0;'>" + r[2] + "</div>" +
              "<div><h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 6px;'>" + r[0] + "</h3><p style='font-size:14px;color:" + stone + ";line-height:1.5;margin:0 0 12px;'>" + r[1] + "</p><a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;'>Download →</a></div></div>";
          }).join("") +
        "</div></section>";
}
