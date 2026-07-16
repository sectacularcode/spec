// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
export function buildLocationPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      if (variant === "B") {
        // Centered — address first, map below
        return "<section style='background:" + bone + ";padding:88px 40px;text-align:center;'><div style='max-width:640px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Location</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 24px;'>Visit us.</h1>" +
          "<p style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>123 Main Street, Suite 100</p>" +
          "<p style='font-size:16px;color:" + stone + ";margin:0 0 32px;'>City, State 00000</p>" +
          "<div style='display:flex;gap:32px;justify-content:center;flex-wrap:wrap;margin-bottom:48px;'>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Phone</div><div style='font-size:15px;color:" + text + ";'>(555) 000-0000</div></div>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Email</div><div style='font-size:15px;color:" + text + ";'>hello@brand.com</div></div>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Hours</div><div style='font-size:15px;color:" + text + ";'>Mon–Fri 9am–5pm</div></div>" +
          "</div>" +
        "</div></section>" +
        "<section style='background:#e0ddd7;padding:0;'><div style='aspect-ratio:21/9;max-height:360px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:14px;'>Map embed</div></section>";
      }
      // Variant A — map left, address right (current)
      return "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Location</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>Visit us.</h1>" +
        "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;max-width:1000px;'>" +
          "<div><div style='background:#e0ddd7;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:16px;'>Map embed</div></div>" +
          "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:16px;'>Address</h3><p style='font-size:16px;color:" + text + ";line-height:1.7;margin-bottom:24px;'>123 Main Street<br>Suite 100<br>City, State 00000</p><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:16px;'>Hours</h3><p style='font-size:16px;color:" + text + ";line-height:1.7;'>Monday – Friday: 9am – 5pm<br>Saturday – Sunday: Closed</p></div>" +
        "</div>" +
      "</section>";
}
