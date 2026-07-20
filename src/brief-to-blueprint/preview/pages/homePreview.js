// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
import { he } from "../../utils/htmlEscape.js";

export function buildHomePreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var hp = patterns.hero;
      
      // ── HERO VARIANTS ──
      var heroHTML;
      if (hp === "split-right") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + he(brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "centered-bold" || hp === "full-image") {
        // home.js's hero if/else has no separate full-image branch at all
        // -- it falls into the exact same catch-all as centered-bold (see
        // home.js: "else { // centered-bold / full-image / default —
        // centered layout"). There is no actual full-bleed-image-
        // background treatment anywhere in the real export -- this
        // preview used to invent one (overlay, text-shadow, no eyebrow,
        // only one button), which doesn't exist in what actually
        // downloads. Collapsed to match reality: identical to
        // centered-bold, Fraunces/300 (not Inter/800), both buttons.
        heroHTML = "<section style='background:" + ink + ";padding:clamp(80px,12vw,140px) clamp(24px,8vw,80px);text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>" + he(brief.brandName || "Brand Name") + "</div>" +
            "<h1 style='font-family:Fraunces,serif;font-weight:300;font-size:clamp(36px,6vw,72px);color:" + warmWhite + ";margin:0 0 28px;line-height:1.05;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;margin:0 auto 40px;line-height:1.7;max-width:560px;'>" + he(brief.heroSubhead || "Your subheadline here.") + "</p>" +
            "<div style='display:flex;gap:12px;justify-content:center;flex-wrap:wrap;'>" +
              "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "See the work") + "</a>" +
              "<a style='padding:14px 40px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + he(brief.heroCta2 || "See pricing") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "minimal") {
        // home.js's minimal hero: ink background (not bone), Fraunces/300
        // (not Inter/800), and only ONE button -- no heroCta2 anywhere in
        // this real branch.
        heroHTML = "<section style='background:" + ink + ";padding:clamp(100px,15vw,200px) clamp(24px,8vw,80px);text-align:center;min-height:80vh;display:flex;align-items:center;justify-content:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<h1 style='font-family:Fraunces,serif;font-weight:300;font-size:clamp(40px,7vw,80px);color:" + warmWhite + ";margin:0 0 48px;line-height:1.05;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "See the work") + "</a>" +
          "</div>" +
        "</section>";
      } else { // split-left (default)
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + he(brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;max-width:480px;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<div style='display:flex;gap:12px;flex-wrap:wrap;'>" +
                "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
                "<a style='padding:14px 32px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + he(brief.heroCta2 || "Learn more") + "</a>" +
              "</div>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
          "</div>" +
        "</section>";
      }
      
      // ── SERVICES (cards) ──
      // home.js's real `cards` section only implements 2 of the 4 real
      // LAYOUT_PATTERNS.services ids -- numbered-features gets its own
      // treatment, everything else (including "alternating-rows" and
      // "icon-list") silently falls through to the same card-grid. This
      // preview used to show a genuinely different alternating image/text
      // row layout for "alternating-rows" -- a real, distinct treatment
      // the actual export has no code path for at all, so a brief that
      // happened to compute that pattern would preview one thing and
      // download another. Collapsed to match what home.js actually does.
      // Also: home.js's cards section has NO heading at all in either
      // branch -- no "What we do" eyebrow, no servicesHeading H2 -- it
      // goes straight into the grid/rows. Removed here to match; this
      // preview was showing a heading that has never been in any real
      // downloaded page.
      var sp = patterns.services;
      var svcCards = (brief.serviceCards || [["Service One","Description of what this service provides."],["Service Two","Description of what this service provides."],["Service Three","Description of what this service provides."]]);
      var servicesHTML;
      if (sp === "numbered-features") {
        servicesHTML = "<section style='background:" + bone + ";padding:96px clamp(24px,8vw,80px);'><div style='max-width:900px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(pair[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(pair[1]) + "</p></div>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else { // card-grid (default -- also what alternating-rows/icon-list fall back to today)
        servicesHTML = "<section style='background:" + bone + ";padding:96px clamp(24px,8vw,80px);'><div style='max-width:1100px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;'>" +
            svcCards.map(function(pair) {
              return "<div style='background:#ffffff;border-left:3px solid " + brass + ";padding:32px 28px;'><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + he(pair[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(pair[1]) + "</p></div>";
            }).join("") +
          "</div>" +
        "</div></section>";
      }

      // ── SPLIT (the differentiator) ──
      // Matches home.js's `split` section exactly: two-column eyebrow +
      // H2 left, body copy right, same fields (differenceEyebrow/H2/Body),
      // same defaults. Previously this preview had no split section at
      // all -- the real export has always had one, it just never showed
      // up here.
      var splitHTML = "<section style='background:" + bone + ";padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto;'>" +
        "<div>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + he(brief.differenceEyebrow || "Why one maker") + "</div>" +
          "<h2 style='font-weight:800;font-size:clamp(28px,4vw,48px);color:" + ink + ";margin:0;line-height:1.15;'>" + he(brief.differenceH2 || "One person. The whole film.") + "</h2>" +
        "</div>" +
        "<div><p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0;'>" + he(brief.differenceBody || "[The difference — explain what sets this apart. Pulled from brand brief.]") + "</p></div>" +
      "</div></section>";

      // ── WHO SECTION ──
      // Matches home.js's `whoSection` exactly: same two-column shape as
      // split above (whoEyebrow/H2/Body, same defaults) -- distinct
      // content, same real layout. Also previously missing from preview.
      var whoSectionHTML = "<section style='background:" + bone + ";padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto;'>" +
        "<div>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + he(brief.whoEyebrow || "Who it is for") + "</div>" +
          "<h2 style='font-weight:800;font-size:clamp(28px,4vw,48px);color:" + ink + ";margin:0;line-height:1.15;'>" + he(brief.whoH2 || "For the underfilmed.") + "</h2>" +
        "</div>" +
        "<div><p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0;'>" + he(brief.whoBody || "[Who this is for — pulled from brand brief. Describe the ideal client specifically.]") + "</p></div>" +
      "</div></section>";

      // ── WORK (recent work grid) ──
      // Matches home.js's `work` section exactly: heading + a row of
      // image-placeholder + bold-caption items (workH2/workItems, same
      // 3-item default). Previously missing from preview entirely.
      var workItemsList = (brief.workItems || ["Film 1","Film 2","Film 3"]);
      var workHTML = "<section style='background:" + bone + ";padding:96px clamp(24px,8vw,80px);'><div style='max-width:1100px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(28px,4vw,44px);color:" + ink + ";margin:0 0 48px;'>" + he(brief.workH2 || "Recent work.") + "</h2>" +
        "<div style='display:grid;grid-template-columns:repeat(" + workItemsList.length + ",1fr);gap:24px;'>" +
          workItemsList.map(function(w) {
            return "<div>" +
              "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:12px;'>" + he(w) + "</div>" +
              "<div style='font-size:15px;font-weight:700;color:" + ink + ";'>" + he(w) + "</div>" +
            "</div>";
          }).join("") +
        "</div>" +
      "</div></section>";

      // ── CTA (closing) ──
      // Matches home.js's real `closing` section exactly -- fallback text
      // ("The stories that move a company forward."), the button reading
      // brief.closingCta (was hardcoded literal text here before), and
      // the actual italic/light-weight/Fraunces typographic treatment
      // (was rendering as a bold sans heading before, plus a
      // brief.signatureLine paragraph that doesn't exist anywhere in
      // home.js). The split-cta/minimal-line variants this preview used
      // to offer are intentionally not restored here -- home.js has no
      // matching treatment for either today, so showing them in preview
      // would just reopen the same preview/export mismatch this pass is
      // fixing. They come back together with real home.js support in a
      // separate pass.
      var ctaHTML = "<section style='background:" + ink + ";padding:120px clamp(24px,8vw,80px);text-align:center;min-height:70vh;display:flex;align-items:center;justify-content:center;'><div>" +
        "<h1 style='font-family:Fraunces,serif;font-weight:300;font-style:italic;font-size:clamp(32px,6vw,64px);color:" + warmWhite + ";margin:0 0 48px;line-height:1.15;'>" + he(brief.tagline || "The stories that move a company forward.") + "</h1>" +
        "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.closingCta || "Start a project") + "</a>" +
      "</div></section>";

      // ── HOOK ──
      // home.js's hook is a single centered H2 only -- weight 700, Inter,
      // no body paragraph at all (brief.hookBody isn't a real field
      // anywhere in home.js). Fixed default text to match the real
      // fallback too.
      var hookHTML = "<section style='background:" + bone + ";padding:88px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-family:Inter,sans-serif;font-weight:700;font-size:clamp(24px,4vw,36px);color:" + ink + ";margin:0;line-height:1.15;'>" + he(brief.hookStatement || "Your honest hook statement.") + "</h2>" +
      "</div></section>";

      // ── PRICING TEASER ──
      // Background is bone in the real export, not white; all three real
      // fields (pricingH2/pricingSubhead/pricingCta) were never read here
      // before -- every real page showed literal hardcoded copy in
      // preview regardless of what the brief actually specified.
      var pricingHTML = "<section style='background:" + bone + ";padding:112px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,44px);color:" + ink + ";margin:0 0 24px;'>" + he(brief.pricingH2 || "Clear prices. No discovery-call maze.") + "</h2>" +
        "<p style='font-size:17px;color:" + stone + ";line-height:1.7;margin:0 0 40px;'>" + he(brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open.") + "</p>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.pricingCta || "See packages") + "</a>" +
      "</div></section>";

      // Real section order, matching home.js's content array exactly:
      // hero, hook, cards, split, whoSection, work, pricingTeaser, closing.
      return heroHTML + hookHTML + servicesHTML + splitHTML + whoSectionHTML + workHTML + pricingHTML + ctaHTML;
}
