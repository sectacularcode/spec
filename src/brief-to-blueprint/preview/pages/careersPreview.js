// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildCareersPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var cp = patterns.careers || "job-list";
      var jobs = [
        { title: "Senior Designer", meta: "Full-time · Remote" },
        { title: "Project Manager", meta: "Full-time · Hybrid" },
        { title: "Content Strategist", meta: "Contract · Remote" },
      ];
      var values = ["Ownership", "Craft", "Clarity", "Speed", "Honesty"];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Careers</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Work with us.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>We are always looking for talented people who care about the craft.</p>" +
      "</section>";
      var jobList = "<div style='max-width:800px;margin:0 auto;'>" +
        jobs.map(function(j) {
          return "<div style='display:flex;justify-content:space-between;align-items:center;padding:24px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + j.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + j.meta + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Apply</a></div>";
        }).join("") +
      "</div>";
      if (cp === "values-first") {
        return "<section style='background:" + ink + ";padding:80px 40px;'>" +
          "<div style='max-width:1060px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>Our values</div>" +
            "<div style='display:flex;gap:24px;flex-wrap:wrap;'>" +
              values.map(function(v) {
                return "<div style='padding:14px 24px;border:1px solid rgba(255,255,255,.15);color:" + warmWhite + ";font-size:14px;font-weight:600;border-radius:4px;'>" + v + "</div>";
              }).join("") +
            "</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'>" + jobList + "</section>";
      } else if (cp === "split-layout") {
        return header +
          "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<h2 style='font-size:24px;font-weight:800;color:" + ink + ";margin:0 0 16px;'>Why join us</h2>" +
              "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin-bottom:28px;'>We move fast, care about craft, and give people room to own their work. No bureaucracy. No bottlenecks.</p>" +
              "<div style='display:flex;flex-direction:column;gap:12px;'>" +
                values.map(function(v) {
                  return "<div style='display:flex;align-items:center;gap:12px;'><div style='width:6px;height:6px;background:" + brass + ";border-radius:50%;flex-shrink:0;'></div><span style='font-size:15px;font-weight:600;color:" + ink + ";'>" + v + "</span></div>";
                }).join("") +
              "</div>" +
            "</div>" +
            "<div>" +
              "<h2 style='font-size:24px;font-weight:800;color:" + ink + ";margin:0 0 24px;'>Open roles</h2>" +
              jobs.map(function(j) {
                return "<div style='display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + j.title + "</div><div style='font-size:13px;color:" + stone + ";'>" + j.meta + "</div></div><a style='padding:8px 20px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Apply</a></div>";
              }).join("") +
            "</div>" +
          "</div></section>";
      } else {
        // job-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'>" + jobList + "</section>";
      }
}
