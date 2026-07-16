// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildFaqPreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var fp = patterns.faq || "accordion";
      var questions = [["How does pricing work?","Every price is a starting point that scales with scope."],["What is the typical timeline?","Most projects wrap in 2-4 weeks depending on complexity."],["Do you offer revisions?","Yes, a set number of revision rounds agreed up front."],["What do I need to get started?","A brief conversation about your business and goals."],["Can I see examples?","Absolutely. Check our work page for recent projects."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>FAQ</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Common questions</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;'>If you do not see your answer here, reach out directly.</p>" +
      "</div></section>";
      if (fp === "two-column") {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1160px;margin:0 auto;'>" +
          questions.map(function(q) {
            return "<div style='padding:24px 0;border-bottom:1px solid #E2DBCC;'><h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + q[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + q[1] + "</p></div>";
          }).join("") +
        "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          questions.map(function(q) {
            return "<div style='border-bottom:1px solid #E2DBCC;padding:24px 0;'><div style='display:flex;justify-content:space-between;align-items:center;'><h3 style='font-size:17px;font-weight:600;color:" + ink + ";margin:0;'>" + q[0] + "</h3><span style='font-size:20px;color:" + brass + ";'>+</span></div><p style='font-size:15px;color:" + stone + ";line-height:1.7;margin:12px 0 0;'>" + q[1] + "</p></div>";
          }).join("") +
        "</div></section>";
      }
}
