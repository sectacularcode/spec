// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
import { he } from "../../utils/htmlEscape.js";

export function buildProcessPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var pp = patterns.process || "numbered-vertical";
      var steps = brief.processSteps || [["Discovery","We learn about your business and goals."],["Strategy","We create a plan tailored to you."],["Execute","We bring the plan to life."],["Deliver","You get the finished product, ready to use."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Process</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + he(brief.processH1 || "How it works") + "</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>Simple and calm, from first call to final files.</p>" +
      "</div></section>";
      var body;
      if (pp === "icon-cards") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          steps.map(function(s, i) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;text-align:center;'>" +
              "<div style='font-size:32px;font-weight:800;color:" + brass + ";margin-bottom:16px;'>0" + (i+1) + "</div>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(s[0]) + "</h3>" +
              "<p style='font-size:14px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(s[1]) + "</p></div>";
          }).join("") + "</div></section>";
      } else if (pp === "horizontal-timeline") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:flex;gap:0;position:relative;'>" +
            steps.map(function(s, i) {
              return "<div style='flex:1;text-align:center;padding:0 16px;'>" +
                "<div style='width:32px;height:32px;background:" + brass + ";border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;'>" + (i+1) + "</div>" +
                "<h3 style='font-size:16px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(s[0]) + "</h3>" +
                "<p style='font-size:13px;color:" + stone + ";line-height:1.5;margin:0;'>" + he(s[1]) + "</p></div>";
            }).join("") +
          "</div></div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          steps.map(function(s, i) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;" + (i < steps.length-1 ? "border-bottom:1px solid #E2DBCC;" : "") + "'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (i+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(s[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(s[1]) + "</p></div></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
}
