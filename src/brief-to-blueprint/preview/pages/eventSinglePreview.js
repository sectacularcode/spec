// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildEventSinglePreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      if (variant === "B") {
        // Light centered layout
        return "<section style='background:" + bone + ";padding:88px 40px;text-align:center;'><div style='max-width:640px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Event</div>" +
          "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Event Title Goes Here</h1>" +
          "<div style='display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;'>" +
            "<span style='font-size:15px;color:" + stone + ";'>March 15, 2026</span>" +
            "<span style='font-size:15px;color:" + stone + ";'>6:00 PM — 9:00 PM</span>" +
            "<span style='font-size:15px;color:" + stone + ";'>Downtown Convention Center</span>" +
          "</div>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;margin-bottom:48px;'>Register Now</a>" +
        "</div></section>" +
        "<section style='background:#ffffff;padding:64px 40px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<h2 style='font-weight:700;font-size:24px;color:" + ink + ";margin:0 0 16px;'>About This Event</h2>" +
          "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0 0 32px;'>Event description with details about what attendees can expect, who should attend, and what they will learn or experience.</p>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;'>" +
            "<div><h3 style='font-weight:700;font-size:15px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;'>Schedule</h3><p style='font-size:15px;color:" + stone + ";line-height:1.8;'>6:00 PM — Doors open<br>6:30 PM — Opening remarks<br>7:00 PM — Main session<br>8:30 PM — Networking</p></div>" +
            "<div><h3 style='font-weight:700;font-size:15px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;'>Location</h3><div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Map embed</div></div>" +
          "</div>" +
        "</div></section>";
      }
      // Variant A — dark hero (current)
      return "<section style='background:" + ink + ";padding:88px 40px;'><div style='max-width:900px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Event</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + warmWhite + ";margin:0 0 16px;line-height:1.1;'>Event Title Goes Here</h1>" +
        "<div style='display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;'>" +
          "<span style='font-size:15px;color:" + stone + ";'>March 15, 2026</span>" +
          "<span style='font-size:15px;color:" + stone + ";'>6:00 PM — 9:00 PM</span>" +
          "<span style='font-size:15px;color:" + stone + ";'>Downtown Convention Center</span>" +
        "</div>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Register Now</a>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:900px;margin:0 auto;'>" +
        "<div><div style='background:#e0ddd7;aspect-ratio:16/10;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Event image</div></div>" +
        "<div><h2 style='font-weight:700;font-size:24px;color:" + ink + ";margin:0 0 16px;'>About This Event</h2><p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0 0 24px;'>Event description with details about what attendees can expect.</p><h3 style='font-weight:700;font-size:16px;color:" + ink + ";margin:0 0 12px;'>Schedule</h3><p style='font-size:15px;color:" + stone + ";line-height:1.8;margin:0;'>6:00 PM — Doors open<br>6:30 PM — Opening remarks<br>7:00 PM — Main session<br>9:00 PM — Close</p></div>" +
      "</div></section>";
}
