// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
import { he } from "../../utils/htmlEscape.js";

export function buildServicesPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var sp = patterns.services;
      var svcCards = brief.serviceCards || [["Service One","Description goes here."],["Service Two","Description goes here."],["Service Three","Description goes here."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'>" +
        "<div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Services</div>" +
          "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + he(brief.servicesH1 || "What we offer") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>" + he(brief.servicesSubhead || "Our full range of services.") + "</p>" +
        "</div></section>";
      var body = "";
      if (sp === "alternating-rows") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            var imgFirst = idx % 2 === 0;
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:48px;'>" +
              (imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" : "") +
              "<div><h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + he(pair[0]) + "</h3><p style='font-size:16px;color:" + stone + ";line-height:1.7;margin:0;'>" + he(pair[1]) + "</p></div>" +
              (!imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" : "") +
            "</div>";
          }).join("") + "</div></section>";
      } else if (sp === "numbered-features") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(pair[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(pair[1]) + "</p></div></div>";
          }).join("") + "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          svcCards.map(function(pair) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'><div style='width:40px;height:3px;background:" + brass + ";margin-bottom:20px;'></div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + he(pair[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(pair[1]) + "</p></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
}
