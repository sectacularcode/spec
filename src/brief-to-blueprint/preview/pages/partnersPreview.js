// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildPartnersPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var partnerList = ["Partner One","Partner Two","Partner Three","Partner Four","Partner Five","Partner Six"];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Partners</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Companies we work with</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Strategic partnerships that strengthen what we deliver.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Description list
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
            partnerList.map(function(p) {
              return "<div style='display:grid;grid-template-columns:80px 1fr;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div style='background:#e0ddd7;width:64px;height:64px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:10px;'>Logo</div>" +
                "<div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + p + "</div><p style='font-size:14px;color:" + stone + ";margin:0;line-height:1.5;'>A brief description of what this partner does and how the relationship benefits clients.</p></div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      }
      // Variant A — logo grid (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 48px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          partnerList.map(function(p) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:40px 24px;text-align:center;border-radius:4px;'>" +
              "<div style='background:#e0ddd7;width:80px;height:80px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Logo</div>" +
              "<div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + p + "</div></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:#ffffff;padding:80px 40px;text-align:center;'><div style='max-width:600px;margin:0 auto;'>" +
          "<h2 style='font-weight:800;font-size:28px;color:" + ink + ";margin:0 0 16px;'>Become a partner</h2>" +
          "<p style='font-size:16px;color:" + text + ";margin:0 0 32px;line-height:1.7;'>Interested in working together? We would love to hear from you.</p>" +
          "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Get in touch</a>" +
        "</div></section>";
}
