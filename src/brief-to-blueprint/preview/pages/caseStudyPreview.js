// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildCaseStudyPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var csp = patterns["case-study"] || "dark-hero-metrics";
      var metrics = [
        { label: "Challenge", body: "What the client was facing" },
        { label: "Solution", body: "How we approached it" },
        { label: "Result", body: "The measurable outcome" },
      ];
      if (csp === "editorial-light") {
        return "<section style='background:" + bone + ";padding:100px 40px 60px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Case Study</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Client Name: Project Title</h1>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.7;margin:0;'>Brief overview of the challenge and what was delivered.</p>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:16/9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:56px;'>Project hero image</div>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 56px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:32px;padding:40px 0;border-top:1px solid #E2DBCC;border-bottom:1px solid #E2DBCC;margin-bottom:48px;'>" +
            metrics.map(function(m) {
              return "<div><div style='font-size:11px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-weight:600;'>" + m.label + "</div><p style='font-size:15px;color:" + text + ";line-height:1.6;margin:0;'>" + m.body + "</p></div>";
            }).join("") +
          "</div>" +
          "<div style='font-size:17px;color:" + text + ";line-height:1.8;'>" +
            "<p style='margin-bottom:24px;'>The full editorial narrative goes here. Context, approach, execution, and results written for a reader who wants the story, not a slide deck.</p>" +
            "<blockquote style='border-left:3px solid " + brass + ";padding:16px 24px;margin:32px 0;font-size:20px;color:" + ink + ";font-style:italic;line-height:1.5;'>A pull quote that highlights a key moment or result from the project.</blockquote>" +
            "<p>Concluding section with results and what came next.</p>" +
          "</div>" +
        "</div></section>";
      } else if (csp === "numbers-first") {
        var stats = [["3x", "Revenue growth"], ["6mo", "Time to results"], ["98%", "Client retention"]];
        return "<section style='background:" + bone + ";padding:100px 40px 60px;'><div style='max-width:800px;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Case Study</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Client Name: Project Title</h1>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.7;margin:0;'>Brief overview of the challenge and the outcome.</p>" +
        "</div></section>" +
        "<section style='background:" + ink + ";padding:80px 40px;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;max-width:900px;margin:0 auto;text-align:center;'>" +
            stats.map(function(s) {
              return "<div><div style='font-size:clamp(48px,6vw,72px);font-weight:800;color:" + brass + ";line-height:1;margin-bottom:8px;'>" + s[0] + "</div><div style='font-size:14px;color:" + warmWhite + ";opacity:.7;text-transform:uppercase;letter-spacing:1px;'>" + s[1] + "</div></div>";
            }).join("") +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;max-width:900px;margin:0 auto;'>" +
          metrics.map(function(m) {
            return "<div><div style='font-size:13px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;'>" + m.label + "</div><p style='font-size:16px;color:" + text + ";line-height:1.6;'>" + m.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 80px;max-width:760px;margin:0 auto;'><div style='font-size:17px;color:" + text + ";line-height:1.8;'><p>The full narrative goes here — context, approach, execution, and the story behind the numbers.</p></div></section>";
      } else {
        // dark-hero-metrics (default)
        return "<section style='background:" + ink + ";padding:100px 40px;'>" +
          "<div style='max-width:800px;'>" +
            "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Case Study</div>" +
            "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;line-height:1.1;'>Client Name: Project Title</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;line-height:1.7;'>Brief overview of the challenge and the outcome.</p>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;max-width:900px;margin:0 auto 48px;text-align:center;'>" +
          metrics.map(function(m) {
            return "<div><div style='font-size:13px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;'>" + m.label + "</div><p style='font-size:16px;color:" + text + ";line-height:1.6;'>" + m.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 80px;max-width:760px;margin:0 auto;'><div style='font-size:17px;color:" + text + ";line-height:1.8;'><p>The full case study narrative goes here — context, approach, execution, and results with real numbers.</p></div></section>";
      }
}
