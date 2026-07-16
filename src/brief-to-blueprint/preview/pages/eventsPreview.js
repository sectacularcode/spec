import { he } from "../../utils/htmlEscape.js";

// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildEventsPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var ep = patterns.events || "date-list";
      var evts = [
        { date: "JAN 15", title: "Workshop: Brand Strategy Fundamentals", meta: "10:00 AM — 2:00 PM · Virtual" },
        { date: "FEB 22", title: "Networking Mixer", meta: "6:00 PM — 9:00 PM · Downtown Studio" },
        { date: "MAR 10", title: "Annual Conference", meta: "All Day · Convention Center" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Events</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>Upcoming events.</h1>" +
      "</section>";
      if (ep === "event-cards") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px;max-width:1160px;margin:0 auto;'>" +
              evts.map(function(e) {
                return "<div style='background:#ffffff;border:1px solid #E2DBCC;border-radius:6px;overflow:hidden;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
                  "<div style='padding:24px;'>" +
                    "<div style='font-size:12px;font-weight:800;color:" + brass + ";letter-spacing:1px;margin-bottom:10px;'>" + he(e.date) + "</div>" +
                    "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;line-height:1.3;'>" + he(e.title) + "</h3>" +
                    "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;'>" + he(e.meta) + "</p>" +
                    "<a style='display:inline-block;padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register</a>" +
                  "</div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</section>";
      } else if (ep === "featured-next") {
        var next = evts[0];
        return "<section style='background:" + ink + ";padding:96px 40px;'>" +
          "<div style='max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Next Event</div>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:2px;margin-bottom:16px;'>" + he(next.date) + "</div>" +
              "<h2 style='font-size:clamp(28px,4vw,44px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.15;'>" + he(next.title) + "</h2>" +
              "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;margin:0 0 32px;'>" + he(next.meta) + "</p>" +
              "<a style='display:inline-block;padding:14px 36px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register now</a>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          evts.slice(1).map(function(e) {
            return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + he(e.date) + "</div>" +
              "<div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + he(e.title) + "</div><div style='font-size:14px;color:" + stone + ";'>" + he(e.meta) + "</div></div>" +
              "<a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else {
        // date-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            evts.map(function(e) {
              return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'><div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + he(e.date) + "</div><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + he(e.title) + "</div><div style='font-size:14px;color:" + stone + ";'>" + he(e.meta) + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a></div>";
            }).join("") +
          "</div></section>";
      }
}
