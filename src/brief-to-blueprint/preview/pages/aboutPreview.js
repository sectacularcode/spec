// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
import { he } from "../../utils/htmlEscape.js";

export function buildAboutPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var ap = patterns.about;
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + he(brief.aboutHeading || "Our story") + "</h1>" +
      "</div></section>";
      var body;
      if (ap === "centered-narrative") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.8;margin:0 0 32px;'>" + he(brief.aboutBody || "Your company story goes here.") + "</p>" +
          "<div style='display:flex;gap:32px;flex-wrap:wrap;margin-top:40px;'>" +
            ["Direct", "Useful", "Opinionated", "Human"].map(function(v) {
              return "<div style='font-size:15px;font-weight:700;color:" + brass + ";'>" + v + "</div>";
            }).join("") +
          "</div></div></section>";
      } else if (ap === "team-grid") {
        body = "<section style='background:" + bone + ";padding:40px 40px 48px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0 0 48px;'>" + he(brief.aboutBody || "Your company story.") + "</p></div></section>" +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:1160px;margin:0 auto;text-align:center;'>" +
            ["Founder", "Lead Designer", "Strategist", "Developer"].map(function(role) {
              return "<div><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Photo</div><div style='font-weight:700;color:" + ink + ";'>[Name]</div><div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + role + "</div></div>";
            }).join("") +
          "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>About image</div>" +
          "<div><p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0;'>" + he(brief.aboutBody || "Your company story.") + "</p></div>" +
        "</div></section>";
      }
      return header + body;
}
