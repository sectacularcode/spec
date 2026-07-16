import { he } from "../../utils/htmlEscape.js";

// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildTeamPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var tp = patterns.team || "photo-grid";
      var members = [
        { role: "Founder & CEO", name: "[Name]" },
        { role: "Lead Designer", name: "[Name]" },
        { role: "Strategist", name: "[Name]" },
        { role: "Developer", name: "[Name]" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>The Team</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>The people behind the work.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>Every person here chose to be here.</p>" +
      "</section>";
      if (tp === "featured-founder") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:56px;padding-bottom:56px;border-bottom:1px solid #E2DBCC;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:3/4;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Founder photo</div>" +
              "<div>" +
                "<div style='font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brass + ";margin-bottom:12px;'>Founder</div>" +
                "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:800;color:" + ink + ";margin:0 0 8px;'>[Founder Name]</h2>" +
                "<p style='font-size:15px;color:" + stone + ";margin-bottom:20px;'>Founder & CEO</p>" +
                "<p style='font-size:16px;color:" + text + ";line-height:1.7;'>A short founder bio that establishes credibility and voice. Who they are, where they came from, and why they started this.</p>" +
              "</div>" +
            "</div>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;'>" +
              members.slice(1).map(function(m) {
                return "<div style='text-align:center;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:14px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div>" +
                  "<div style='font-size:15px;font-weight:700;color:" + ink + ";'>" + he(m.name) + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + he(m.role) + "</div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</div></section>";
      } else if (tp === "horizontal-list") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            members.map(function(m) {
              return "<div style='display:grid;grid-template-columns:100px 1fr;gap:28px;padding:32px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div style='background:#e0ddd7;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Photo</div>" +
                "<div>" +
                  "<div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + he(m.name) + "</div>" +
                  "<div style='font-size:13px;color:" + brass + ";font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;'>" + he(m.role) + "</div>" +
                  "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Short bio for this team member — background, focus, and what they bring.</p>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // photo-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            members.map(function(m) {
              return "<div style='text-align:center;'><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div><div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + he(m.name) + "</div><div style='font-size:14px;color:" + stone + ";margin-top:4px;'>" + he(m.role) + "</div></div>";
            }).join("") +
          "</div></section>";
      }
}
