// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
export function buildPricingPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, asphalt = colors.asphalt, text = colors.text;
      var pp2 = patterns.pricing || "three-tier";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;text-align:center;'><div style='max-width:800px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Pricing</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Simple, transparent pricing</h1>" +
        "<p style='font-size:17px;color:" + text + ";margin:0;'>No hidden fees. Pick what works.</p>" +
      "</div></section>";
      var tiers = [["Starter","$500","For small projects"],["Professional","$1,500","For growing businesses"],["Enterprise","Custom","For large-scale needs"]];
      if (pp2 === "two-tier") {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;'>" +
          tiers.slice(0,2).map(function(t, i) {
            var featured = i === 1;
            return "<div style='background:" + (featured ? asphalt : "#fff") + ";border:1px solid #E2DBCC;padding:48px 32px;text-align:center;border-radius:4px;'>" +
              "<div style='font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + (featured ? brass : brassDp) + ";margin-bottom:16px;'>" + t[0] + "</div>" +
              "<div style='font-size:clamp(36px,5vw,52px);font-weight:800;color:" + (featured ? warmWhite : ink) + ";margin-bottom:8px;'>" + t[1] + "</div>" +
              "<p style='font-size:15px;color:" + stone + ";margin-bottom:32px;'>" + t[2] + "</p>" +
              "<a style='display:inline-block;padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Get started</a></div>";
          }).join("") + "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1000px;margin:0 auto;'>" +
          tiers.map(function(t, i) {
            var featured = i === 1;
            return "<div style='background:" + (featured ? asphalt : "#fff") + ";border:1px solid #E2DBCC;padding:40px 32px;text-align:center;border-radius:4px;'>" +
              "<div style='font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + (featured ? brass : brassDp) + ";margin-bottom:16px;'>" + t[0] + "</div>" +
              "<div style='font-size:clamp(32px,4vw,48px);font-weight:800;color:" + (featured ? warmWhite : ink) + ";margin-bottom:8px;'>" + t[1] + "</div>" +
              "<p style='font-size:14px;color:" + stone + ";margin-bottom:32px;'>" + t[2] + "</p>" +
              "<a style='display:inline-block;padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Get started</a></div>";
          }).join("") + "</div></section>";
      }
}
