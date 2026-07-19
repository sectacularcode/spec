// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
import { he } from "../../utils/htmlEscape.js";

export function buildContactPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var cp2 = patterns.contact || "split-form";
      if (cp2 === "centered-minimal") {
        return "<section style='background:" + bone + ";padding:100px 40px;text-align:center;'><div style='max-width:560px;margin:0 auto;'>" +
          "<h1 style='font-weight:800;font-size:clamp(32px,5vw,48px);color:" + ink + ";margin:0 0 16px;'>" + he(brief.contactH1 || "Get in touch") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";margin:0 0 40px;line-height:1.7;'>" + he(brief.contactSubhead || "We will get back to you within one business day.") + "</p>" +
          "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:8px;text-align:left;'>" +
            ["Name", "Email", "Message"].map(function(f) {
              return "<div style='margin-bottom:16px;'><div style='font-size:13px;font-weight:600;color:" + ink + ";margin-bottom:6px;'>" + f + "</div><div style='background:#f9f9f9;border:1px solid #E2DBCC;padding:12px;border-radius:4px;color:" + stone + ";font-size:14px;'>Enter " + f.toLowerCase() + "</div></div>";
            }).join("") +
            "<a style='display:block;padding:14px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;text-align:center;'>" + he(brief.contactButton || "Send it over") + "</a>" +
          "</div></div></section>";
      } else {
        return "<section style='background:" + bone + ";padding:88px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:1160px;margin:0 auto;'>" +
          "<div>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Contact</div>" +
            "<h1 style='font-weight:800;font-size:clamp(32px,4vw,48px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + he(brief.contactH1 || "Tell us about your project.") + "</h1>" +
            "<p style='font-size:17px;color:" + text + ";margin:0 0 32px;line-height:1.7;'>" + he(brief.contactSubhead || "A real reply, usually within one business day.") + "</p>" +
            "<p style='font-size:15px;color:" + stone + ";'>" + he(brief.contactReassurance || "No sales team. No automated funnel. Just one maker who will read it and write back.") + "</p>" +
          "</div>" +
          "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:8px;'>" +
            ["Name", "Email", "Company", "What do you need?", "Message"].map(function(f) {
              return "<div style='margin-bottom:16px;'><div style='font-size:13px;font-weight:600;color:" + ink + ";margin-bottom:6px;'>" + f + "</div><div style='background:#f9f9f9;border:1px solid #E2DBCC;padding:12px;border-radius:4px;color:" + stone + ";font-size:14px;'></div></div>";
            }).join("") +
            "<a style='display:block;padding:14px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;text-align:center;'>" + he(brief.contactButton || "Send it over") + "</a>" +
          "</div>" +
        "</div></section>";
      }
}
