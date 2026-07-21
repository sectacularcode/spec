// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js/homePreview.js etc got).
// Output is byte-identical to the pre-split inline version -- verified
// against the original before shipping. colors carries the 8 resolved
// palette values buildPreviewHTML.js computes (defaults already applied).
export function buildBlogPostPreview(brief, variant, inspoContext, colors, _patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      if (variant === "B") {
        // Wide editorial — no sidebar column, wider content, pull quote prominent
        return "<section style='background:" + bone + ";padding:80px 40px 40px;max-width:880px;margin:0 auto;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600;'>Category</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Article Title Goes Here</h1>" +
          "<p style='font-size:15px;color:" + stone + ";margin-bottom:40px;'>Published on [Date] · 5 min read</p>" +
        "</section>" +
        "<section style='background:#e0ddd7;padding:0;'><div style='aspect-ratio:21/9;max-height:480px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Featured image — full width</div></section>" +
        "<section style='background:" + bone + ";padding:56px 40px 96px;'><div style='max-width:880px;margin:0 auto;'>" +
          "<blockquote style='border-left:4px solid " + brass + ";padding:20px 28px;margin:0 0 40px;font-size:22px;color:" + ink + ";font-style:italic;line-height:1.5;background:#fff;border-radius:0 4px 4px 0;'>A key pull quote that sets the tone for the piece and gives readers a reason to keep reading.</blockquote>" +
          "<div style='font-size:17px;color:" + text + ";line-height:1.85;'>" +
            "<p style='margin-bottom:24px;'>Opening paragraph of the article. This is where you hook the reader and set up the premise of what they will learn.</p>" +
            "<h2 style='font-size:26px;font-weight:700;color:" + ink + ";margin:48px 0 16px;'>Section heading</h2>" +
            "<p style='margin-bottom:24px;'>Body copy continues here with supporting details, examples, and insights that develop the main argument.</p>" +
            "<p>Concluding thoughts that tie everything together and lead naturally to a call to action.</p>" +
          "</div>" +
        "</div></section>";
      }
      // Variant A — narrow centered with featured image (current)
      return "<section style='background:" + bone + ";padding:80px 40px;max-width:760px;margin:0 auto;'>" +
        "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;'>Category</div>" +
        "<h1 style='font-size:clamp(32px,5vw,48px);font-weight:800;color:" + ink + ";margin:0 0 16px;line-height:1.15;'>Article Title Goes Here</h1>" +
        "<p style='font-size:15px;color:" + stone + ";margin-bottom:32px;'>Published on [Date] · 5 min read</p>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/9;margin-bottom:40px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Featured image</div>" +
        "<div style='font-size:17px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:24px;'>Opening paragraph of the article. This is where you hook the reader and set up the premise.</p><h2 style='font-size:24px;font-weight:700;color:" + ink + ";margin:40px 0 16px;'>Section heading</h2><p style='margin-bottom:24px;'>Body copy continues here with supporting details, examples, and insights.</p><blockquote style='border-left:3px solid " + brass + ";padding:16px 24px;margin:32px 0;color:" + ink + ";font-size:18px;'>A pull quote that highlights a key insight from the article.</blockquote><p>Concluding thoughts that tie everything together and lead to a call to action.</p></div>" +
      "</section>";
}
