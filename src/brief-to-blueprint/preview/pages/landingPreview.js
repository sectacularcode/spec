import { he } from "../../utils/htmlEscape.js";
import { parseInspoPatterns } from "../../utils/patterns.js";
import { bestTextColor } from "../../../utils/contrast.js";

// Extracted from buildPreviewHTML.js's single-file "sections" object (July
// 2026) -- landing was the largest section by far (~650 lines, five
// variants worth of branching in one block) and the exact code the July 10
// session flagged for a recurring bug: code that looks like it belongs to
// one variant based on position but actually belongs to another, because
// everything lived inside one 2000-line function. Splitting page types
// into their own files doesn't change any output -- verified byte-for-byte
// against the pre-split version before this went live -- it just means
// editing landing's logic no longer requires navigating past, or
// brace-counting through, every other page type's code first.
//
// Mirrors landing.js's selectFeatureRowStyle() exactly -- same density
// thresholds, same inspo-signal override, same relevant pattern IDs. This
// duplication is deliberate, carried over from buildPreviewHTML.js: keeping
// the logic inline here (rather than importing a shared helper from
// landing.js) avoids a preview-only file depending on an export-only one.
// If the thresholds or pattern mapping ever change, update both.
function selectFeatureRowStyle(inspoContext, featureCount) {
  var densityDefault = featureCount <= 4 ? "split-image" : featureCount <= 8 ? "stacked-text" : "compact-list";

  var boosts = parseInspoPatterns(inspoContext);
  var relevant = { "alternating-rows": "split-image", "icon-list": "compact-list", "numbered-features": "compact-list", "card-grid": "stacked-text" };
  var bestId = null, bestScore = 0;
  Object.keys(relevant).forEach(function (id) {
    if (boosts[id] && boosts[id] > bestScore) { bestScore = boosts[id]; bestId = id; }
  });

  return bestId ? relevant[bestId] : densityDefault;
}

// Builds the landing/other page preview HTML. colors carries the same 8
// resolved values buildPreviewHTML.js already computes (with defaults
// applied) -- passed through as one object rather than 8 separate
// parameters, matching the shape already used elsewhere in this split.
export function buildLandingPreview(brief, variant, inspoContext, colors) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite,
      stone = colors.stone, brassDp = colors.brassDp, asphalt = colors.asphalt, text = colors.text;
  // All three lead-form buttons in this file sit on light (bone/white)
  // backgrounds -- same "light context" as landing.js's Elementor-JSON
  // output. A real defined button applies here too; the fallback used to
  // hardcode white text on the raw accent color with no contrast check
  // at all (the same class of bug already found and fixed on the Style
  // Guide brand sheet), so that becomes computed-safe instead.
  var definedBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "primary"; }) || (brief.buttons && brief.buttons[0]);
  var secondaryBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "secondary"; });
  var lightCtxBtnBg = (definedBtn && definedBtn.background) || brass;
  var lightCtxBtnText = (definedBtn && definedBtn.textColor) || bestTextColor(lightCtxBtnBg, text);

  return (function() {
      // Derive an Unsplash image keyword from the brief to get contextual imagery
      // Curated Unsplash photo IDs per industry — clean, logo-free, relevant
      // Each industry gets 4 specific photos: hero, feature1, feature2, feature3
      // IDs chosen to be generic enough to work across brands in that category
      var rawText = ([brief.valueProposition, brief.targetAudience, brief.heroHeadline, brief.hookStatement, brief.servicesHeading, brief.tagline, brief.brandName].filter(Boolean).join(" ") || "business").toLowerCase();
      // Industry-specific SVG image placeholders — inline, no HTTP requests, always renders
      // Each returns an SVG data URI with a relevant icon + label for the industry
      var industryMeta = { label: "Commercial Business", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", color: "#6b7280" };
      if (/fleet|truck|semi|trailer|freight|transport|logistics/.test(rawText))
        industryMeta = { label: "Fleet & Trucking", icon: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", color: "#374151" };
      else if (/paint|body.?shop|collision|auto.?repair|vehicle.?repair/.test(rawText))
        industryMeta = { label: "Auto Body & Paint", icon: "M7 8h10l2 4H5L7 8zM3 12h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4zM7 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM15 16a1 1 0 1 0 0 2 1 1 0 0 0 0-2z", color: "#374151" };
      else if (/restaurant|food|cafe|kitchen|dining/.test(rawText))
        industryMeta = { label: "Restaurant & Food", icon: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3", color: "#374151" };
      else if (/medical|health|clinic|dental|physician/.test(rawText))
        industryMeta = { label: "Healthcare", icon: "M22 12h-4l-3 9L9 3l-3 9H2", color: "#374151" };
      else if (/construction|contractor|building|renovation/.test(rawText))
        industryMeta = { label: "Construction", icon: "M2 20h20M4 20V10l8-6 8 6v10M10 20v-6h4v6", color: "#374151" };
      else if (/real.?estate|property|homes|realty/.test(rawText))
        industryMeta = { label: "Real Estate", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10", color: "#374151" };
      else if (/law|attorney|legal|firm/.test(rawText))
        industryMeta = { label: "Legal Services", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", color: "#374151" };
      else if (/tech|software|saas|app|digital/.test(rawText))
        industryMeta = { label: "Technology", icon: "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18", color: "#374151" };
      else if (/fitness|gym|wellness|training/.test(rawText))
        industryMeta = { label: "Fitness & Wellness", icon: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v5a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z", color: "#374151" };
      else if (/salon|beauty|spa|hair/.test(rawText))
        industryMeta = { label: "Salon & Beauty", icon: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", color: "#374151" };
      else if (/landscape|lawn|garden/.test(rawText))
        industryMeta = { label: "Landscaping", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10", color: "#374151" };
      else if (/plumb|electric|hvac|mechanical|trade/.test(rawText))
        industryMeta = { label: "Trades & Service", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z", color: "#374151" };
      else if (/hotel|hospitality|resort/.test(rawText))
        industryMeta = { label: "Hospitality", icon: "M3 22V12l9-9 9 9v10M12 22v-7", color: "#374151" };

      // Build SVG placeholder as a data URI — consistent dimensions, industry label
      function makeSvgPh(w, h, label, sublabel, bg) {
        bg = bg || "#e8eaed";
        // Use btoa (base64) so no quote characters appear in the data URI — prevents attribute termination
        var svgLines = [
          "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + w + "\" height=\"" + h + "\">",
          "<rect width=\"" + w + "\" height=\"" + h + "\" fill=\"" + bg + "\"/>",
          "<text x=\"" + (w/2) + "\" y=\"" + (h/2 - 18) + "\" font-family=\"Inter,system-ui,sans-serif\" font-size=\"12\" font-weight=\"400\" fill=\"#c4c9d4\" text-anchor=\"middle\">" + label.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</text>",
          "<text x=\"" + (w/2) + "\" y=\"" + (h/2 + 6) + "\" font-family=\"Inter,system-ui,sans-serif\" font-size=\"12\" fill=\"#b0b8c4\" text-anchor=\"middle\">" + (sublabel||"Add photo here").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</text>",
          "<rect x=\"" + (w/2-28) + "\" y=\"" + (h/2+18) + "\" width=\"56\" height=\"2\" rx=\"1\" fill=\"#d1d5db\"/>",
          "</svg>"
        ].join("");
        // btoa needs ASCII — strip non-ASCII chars
        var safe = svgLines.replace(/[^\x00-\x7F]/g, "");
        return "data:image/svg+xml;base64," + btoa(safe);
      }
      var phBg = (brass && brass !== "undefined") ? brass + "18" : "#e8f4ea";
      var img1    = makeSvgPh(800, 600, industryMeta.label, brief.feature1Heading || "Feature image", phBg);
      var img2    = makeSvgPh(800, 600, industryMeta.label, brief.feature2Heading || "Feature image", phBg);
      var img3    = makeSvgPh(800, 600, industryMeta.label, brief.feature3Heading || "Feature image", phBg);
      var heroImg = makeSvgPh(1400, 700, industryMeta.label, "Hero background — replace with your photo", phBg);

      var h1    = brief.heroHeadline  || "Your offer, clearly stated.";
      var sub   = brief.heroSubhead   || "One clear value proposition. One clear action.";
      var hook  = brief.hookStatement || "";
      var cta1  = brief.phoneCta      || brief.heroCta1 || "Call Us Now";
      var cta2  = brief.contactCta    || brief.heroCta2 || "Contact Us";
      // Mirrors landing.js's hasRealSecondaryHeroBtn/heroButtonRow exactly
      // -- see that file for the real Atlanta-export case this fixes.
      var hasRealSecondaryHeroBtn = !!(brief.contactCta || brief.heroCta2);
      function heroButtonRowHtml(extraStyle) {
        var style = extraStyle || "";
        if (hasRealSecondaryHeroBtn) {
          return "<a class='cta-btn' style='" + btnStyle + style + "'>" + cta1 + "</a>" +
                 "<a class='cta-btn' style='" + btnOutline + style + "'>" + cta2 + "</a>";
        }
        return "<a class='cta-btn' style='" + btnStyle + style + "'>" + cta1 + "</a>";
      }
      var close = brief.closingCta    || brief.tagline  || "Ready to get started?";
      // Previously always raw-concatenated with no he() escaping and no
      // closingBodyIsHtml check at all -- a real gap now that Manifest's
      // link-and-button-roles change can weave a real <a> link into a
      // closing-CTA paragraph (flattenTextSectionBodyHtml covers
      // brief.closingBody too, not just feature bodies). Bold-only, no
      // color override, matching landing.js's makeClosingCta -- this
      // section sits on the accent color itself, so an accent-colored
      // link would disappear against its own background.
      var closeBody = brief.closingBodyIsHtml
        ? styleInlineLinks(brief.closingBody || "Reach out today and we'll get back to you within one business day.", null)
        : he(brief.closingBody || "Reach out today and we'll get back to you within one business day.");
      var f1h   = brief.feature1Heading || "What We Do Best";
      var f1b   = brief.feature1Body    || "Detail the primary service or capability that sets you apart.";
      var f2h   = brief.feature2Heading || "Built for Your Needs";
      var f2b   = brief.feature2Body    || "Explain how your approach is tailored to the specific customer.";
      var f3h   = brief.feature3Heading || "Results You Can Count On";
      var f3b   = brief.feature3Body    || "Speak to reliability, track record, or outcomes.";

      // Mirrors landing.js's makeFeatureRows(): brief.features (a variable-
      // length array) takes priority when present — this is what makes the
      // preview actually match the real export for a source with more than
      // 3 content sections (e.g. a Manifest import), instead of the
      // preview silently falling back to its own hardcoded 3-item defaults
      // while the real export correctly has all of them. Falls back to the
      // original f1h/f1b/f2h/f2b/f3h/f3b fields when brief.features isn't
      // set, so every existing brief keeps previewing exactly as before.
      var featureRowsData = (Array.isArray(brief.features) && brief.features.length > 0)
        ? brief.features.map(function (f) {
            // 4th slot carries buttonPlacement -- needed below (the
            // uniform split-image block) to respect an explicit "none"
            // suppression the same way landing.js's featureButton() now
            // does. undefined for the legacy 3-field fallback, which
            // never sets this, so that path's behavior is unchanged.
            return [he(f.heading || ""), featureBodyHtml(f), makeSvgPh(800, 600, industryMeta.label, f.heading || "Feature image", phBg), f.buttonPlacement];
          })
        : [[f1h, f1b, img1], [f2h, f2b, img2], [f3h, f3b, img3]];
      var featureRowsDataB = (Array.isArray(brief.features) && brief.features.length > 0)
        ? brief.features.map(function (f, i) {
            // 5th slot carries buttonPlacement (4th is already imageLeft) --
            // same reasoning as featureRowsData above.
            return [he(f.heading || ""), featureBodyHtml(f), makeSvgPh(800, 600, industryMeta.label, f.heading || "Feature image", phBg), i % 2 === 1, f.buttonPlacement];
          })
        : [[f1h, f1b, img1, false], [f2h, f2b, img2, true], [f3h, f3b, img3, false]];
      var featureRowStyle = selectFeatureRowStyle(inspoContext, featureRowsData.length);

      // Mirrors landing.js's renderFeatureLayout() — same per-section
      // override mechanism, rendered as HTML strings instead of Elementor
      // JSON. When brief.featureLayout is set, this takes over entirely
      // for the feature-row area; the uniform style above is unused.
      // Matches helpers.js's sanitizeUrl() exactly -- this file builds raw
      // HTML strings directly rather than going through mkButton/mkText's
      // built-in escaping, so every insertion point needs its own
      // explicit safety check. Blocks javascript:/data: and other unsafe
      // schemes; only allows http(s), a bare #, or a same-origin-relative
      // path.
      var SAFE_URL_PATTERN_PREVIEW = /^(https?:|#|\/(?!\/))/i;
      function safeUrl(url) {
        if (!url || typeof url !== "string") return "";
        var trimmed = url.trim();
        return SAFE_URL_PATTERN_PREVIEW.test(trimmed) ? trimmed : "";
      }

      function renderCuratedFeatureLayoutHTML(layout) {
        var rawFeatures = Array.isArray(brief.features) && brief.features.length > 0
          ? brief.features
          : [
              { heading: brief.feature1Heading || "", body: brief.feature1Body || "" },
              { heading: brief.feature2Heading || "", body: brief.feature2Body || "" },
              { heading: brief.feature3Heading || "", body: brief.feature3Body || "" },
            ];
        var htmlParts = [];
        layout.forEach(function (entry, rowIdx) {
          if (entry.style === "midcta") {
            // A secondary CTA woven mid-list -- needs no feature content
            // of its own, just the brief's existing phone/contact CTA
            // fields (already escaped -- top-level brief fields go
            // through the global he() pass at the top of this function).
            htmlParts.push(
              "<section style='background:#ffffff;padding:48px clamp(24px,6vw,64px);text-align:center;'>" +
                "<h2 style='font-size:clamp(22px,3vw,32px);font-weight:800;color:" + brass + ";margin:0 0 8px;'>" + cta1 + "</h2>" +
                "<p style='font-size:14px;color:" + stone + ";margin:0;'>" + (brief.midCtaText || ("Questions before you reach out? " + cta2 + " and we'll get back to you within one business day.")) + "</p>" +
              "</section>"
            );
            return;
          }
          var items = (entry.indices || []).map(function (i) { return rawFeatures[i]; }).filter(Boolean);
          if (!items.length) return;
          var bg = rowIdx % 2 === 0 ? "#ffffff" : bone;
          var f = items[0];

          if (entry.style === "grouped-header") {
            var colWidth = Math.floor(100 / items.length);
            htmlParts.push(
              "<section style='background:#ffffff;padding:56px clamp(24px,6vw,64px);'>" +
                "<div style='font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + he(entry.header || "") + "</div>" +
                "<div style='display:grid;grid-template-columns:repeat(" + items.length + ",1fr);gap:32px;'>" +
                  items.map(function (it) {
                    return "<div><h4 style='font-size:16px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(it.heading || "") + "</h4><p style='font-size:14px;color:" + text + ";line-height:1.6;margin:0;'>" + he(it.body || "") + "</p></div>";
                  }).join("") +
                "</div>" +
              "</section>"
            );
            return;
          }

          if (entry.style === "centered-cta") {
            htmlParts.push(
              "<section style='background:" + bg + ";padding:56px clamp(24px,6vw,64px);text-align:center;'>" +
                "<h3 style='font-size:clamp(18px,2.2vw,24px);font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + he(f.heading || "") + "</h3>" +
                "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0 auto 20px;max-width:640px;'>" + featureBodyHtml(f) + "</p>" +
                featureButtonHtml(f) +
              "</section>"
            );
            return;
          }

          if (entry.style === "embedded-form") {
            var ffHeading = f.heading || brief.formHeading || "Get a Quote";
            var ffSubhead = f.body || brief.formSubhead || "";
            var ffFields  = (Array.isArray(brief.formFields) && brief.formFields.length) ? brief.formFields : ["Name", "Phone", "Message"];
            var ffCta     = brief.formCta || "Request a Quote";
            htmlParts.push(
              "<section style='background:" + bone + ";padding:56px clamp(24px,6vw,64px);'>" +
                "<div style='max-width:560px;'>" +
                "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(ffHeading) + "</h3>" +
                (ffSubhead ? "<p style='font-size:14px;color:" + stone + ";margin:0 0 20px;'>" + he(ffSubhead) + "</p>" : "") +
                ffFields.map(function (lbl) {
                  var safeLbl = he(String(lbl));
                  return "<div style='margin-bottom:12px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + safeLbl + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#ffffff;font-size:14px;color:#bbb;box-sizing:border-box;'>" + safeLbl + "...</div></div>";
                }).join("") +
                "<button style='padding:12px 28px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:6px;'>" + he(ffCta) + "</button>" +
                "</div>" +
              "</section>"
            );
            return;
          }

          if (entry.style === "map-beside") {
            // A real, working Google Maps embed (Google's no-API-key iframe
            // format) when a real address exists — confirmed real address
            // for this page came from the actual edited Elementor export,
            // since Manifest's source data never included one. Falls back
            // to a labeled placeholder when there's nothing real to embed;
            // never invents an address. encodeURIComponent already makes
            // this safe for the query-string context.
            var mapEmbed = brief.mapAddress
              ? "<iframe src=\"https://maps.google.com/maps?q=" + encodeURIComponent(brief.mapAddress) + "&output=embed\" style='border:0;width:100%;height:100%;min-height:320px;display:block;' loading='lazy'></iframe>"
              : "<div class='landing-img' style='min-height:320px;height:100%;overflow:hidden;background:" + bone + ";display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:12px;'>Map placeholder</div>";
            htmlParts.push(
              "<section style='background:" + bg + ";display:grid;grid-template-columns:1fr 1fr;'>" +
                "<div style='padding:56px 48px;display:flex;flex-direction:column;justify-content:center;'>" +
                  "<h2 style='font-size:clamp(20px,2.5vw,28px);font-weight:700;color:" + brass + ";margin:0 0 14px;'>" + he(f.heading || "") + "</h2>" +
                  "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0;'>" + featureBodyHtml(f) + "</p>" +
                "</div>" +
                "<div style='min-height:320px;height:100%;overflow:hidden;'>" + mapEmbed + "</div>" +
              "</section>"
            );
            return;
          }

          if (entry.style === "split-right" || entry.style === "split-left" || entry.style === "split-cta-right" || entry.style === "split-cta-left") {
            var imgLeft = entry.style === "split-left" || entry.style === "split-cta-left";
            var withBtn = (entry.style === "split-cta-right" || entry.style === "split-cta-left" || !!f.buttonLabel) && f.buttonPlacement !== "none";
            var img = makeSvgPh(800, 600, industryMeta.label, f.heading || "Feature image", phBg);
            var textBlock = "<div style='padding:56px 48px;display:flex;flex-direction:column;justify-content:center;'>" +
              "<h2 style='font-size:clamp(20px,2.5vw,28px);font-weight:700;color:" + brass + ";margin:0 0 14px;'>" + he(f.heading || "") + "</h2>" +
              "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0" + (withBtn ? " 0 20px" : "") + ";'>" + featureBodyHtml(f) + "</p>" +
              (withBtn ? featureButtonHtml(f) : "") +
            "</div>";
            var imgBlock = "<div class='landing-img' style='min-height:320px;height:100%;overflow:hidden;'><img src=\"" + img + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:320px;'/></div>";
            htmlParts.push(
              "<section style='background:" + bg + ";display:grid;grid-template-columns:1fr 1fr;'>" +
                (imgLeft ? imgBlock + textBlock : textBlock + imgBlock) +
              "</section>"
            );
            return;
          }

          if (entry.style === "checklist") {
            var checklistSourceText = f.bodyIsHtml ? (f.body || "").replace(/<[^>]+>/g, "") : (f.body || "");
            var clauses = checklistSourceText.split(/\.\s+/).map(function (s) { return s.trim().replace(/\.$/, ""); }).filter(function (s) { return s.length > 0; });
            if (clauses.length === 0) clauses = [checklistSourceText];
            htmlParts.push(
              "<section style='background:" + bg + ";padding:44px clamp(24px,6vw,64px);'>" +
                "<h3 style='font-size:clamp(17px,2vw,22px);font-weight:700;color:" + ink + ";margin:0 0 16px;'>" + he(f.heading || "") + "</h3>" +
                "<div style='display:flex;flex-direction:column;gap:10px;'>" +
                  clauses.map(function (c) {
                    return "<div style='display:flex;align-items:flex-start;gap:10px;'><span style='font-size:19px;color:" + brass + ";font-weight:700;flex-shrink:0;margin-top:2px;'>&#10003;</span><span style='font-size:19px;color:" + text + ";line-height:1.5;'>" + he(c) + "</span></div>";
                  }).join("") +
                "</div>" +
                ((f.buttonLabel && f.buttonPlacement !== "none") ? "<div style='margin-top:20px;'>" + featureButtonHtml(f) + "</div>" : "") +
              "</section>"
            );
            return;
          }

          if (entry.style === "video") {
            // Mirrors landing.js's renderVideoRow -- unverified against a
            // real Elementor render, unlike the other widgets here.
            // safeUrl() blocks javascript:/data: and other unsafe schemes
            // before this ever reaches the iframe src -- videoUrl is
            // brief-supplied content, not something Spec generated, so it
            // gets the same treatment as any other untrusted URL.
            var safeVideoUrl = safeUrl(brief.videoUrl);
            if (!safeVideoUrl) { htmlParts.push(""); return; }
            var ytMatch = safeVideoUrl.match(/(?:youtu\.be\/|v=)([\w-]{6,})/);
            var embedSrc = ytMatch ? "https://www.youtube.com/embed/" + ytMatch[1] : safeVideoUrl;
            htmlParts.push(
              "<section style='background:" + bg + ";display:grid;grid-template-columns:1fr 1fr;'>" +
                "<div style='padding:44px 48px;display:flex;flex-direction:column;justify-content:center;'>" +
                  "<h3 style='font-size:clamp(17px,2vw,22px);font-weight:700;color:" + ink + ";margin:0 0 10px;'>" + he(f.heading || "") + "</h3>" +
                  "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0" + ((f.buttonLabel && f.buttonPlacement !== "none") ? " 0 16px" : "") + ";'>" + featureBodyHtml(f) + "</p>" +
                  ((f.buttonLabel && f.buttonPlacement !== "none") ? featureButtonHtml(f) : "") +
                "</div>" +
                "<div style='min-height:280px;height:100%;overflow:hidden;'><iframe src=\"" + he(embedSrc) + "\" style='border:0;width:100%;height:100%;min-height:280px;display:block;' loading='lazy' allowfullscreen></iframe></div>" +
              "</section>"
            );
            return;
          }

          // "plain" fallback -- no accent line, matches landing.js
          htmlParts.push(
            "<section style='background:" + bg + ";padding:44px clamp(24px,6vw,64px);'>" +
              "<h3 style='font-size:clamp(17px,2vw,22px);font-weight:700;color:" + ink + ";margin:0 0 10px;'>" + he(f.heading || "") + "</h3>" +
              "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0;'>" + featureBodyHtml(f) + "</p>" +
              ((f.buttonLabel && f.buttonPlacement !== "none") ? "<div style='margin-top:20px;'>" + featureButtonHtml(f) + "</div>" : "") +
            "</section>"
          );
        });
        return htmlParts.join("");
      }
      var s1    = brief.trustStat1 || "10+";  var l1 = brief.trustLabel1 || "Years in business";
      var s2    = brief.trustStat2 || "500+"; var l2 = brief.trustLabel2 || "Projects completed";
      var s3    = brief.trustStat3 || "98%";  var l3 = brief.trustLabel3 || "Client satisfaction";
      // Same guard as landing.js's buildLandingPage: if asphalt was left as
      // (or defaulted to) the brand accent color, treat it as unset and
      // fall back to a neutral charcoal so dark panels read as neutral,
      // not brand-saturated. Keeps this preview's hero/testimonial panel
      // color consistent with what the real Elementor export produces.
      var dark = asphalt;
      var brassDpCheck = (brassDp || "").toLowerCase();
      if (!dark || dark.toLowerCase() === (brass||"").toLowerCase() || dark.toLowerCase() === brassDpCheck) {
        dark = "#1F2328";
      }
      var whyUsIntro = brief.whyUsIntro || "Add 1–2 sentences on why this business is the right choice.";
      var wb1 = brief.benefit1 || "Key benefit one";
      var wb2 = brief.benefit2 || "Key benefit two";
      var faqItemsReal = Array.isArray(brief.faqItems)
        ? brief.faqItems.filter(function(f) { return f && String(f.question || "").trim() && String(f.answer || "").trim(); })
        : [];
      // Plain, dependency-free open/close: a checkbox-driven CSS accordion
      // (no JS needed for the preview) so the interaction is visible without
      // wiring up click handlers just for this static HTML preview.
      var faqHTML = (brief.skipFaqSection || !faqItemsReal.length) ? "" : (
        "<section style='background:#ffffff;padding:80px clamp(24px,6vw,80px);'>" +
          "<div style='max-width:1140px;margin:0 auto;'>" +
            "<h2 style='font-size:clamp(24px,3vw,32px);font-weight:800;color:" + brass + ";margin:0 0 28px;'>" + (brief.faqHeading || "Frequently Asked Questions") + "</h2>" +
            faqItemsReal.map(function(f, i) {
              var cbId = "faq-cb-" + i;
              return "<div class='faq-item' style='border:1px solid #dde0e6;border-top:none;'>" +
                "<input type='checkbox' id='" + cbId + "' class='faq-toggle' style='display:none;'" + (i === 0 ? " checked" : "") + "/>" +
                "<label for='" + cbId + "' style='display:flex;align-items:center;gap:10px;padding:18px 20px;cursor:pointer;font-weight:700;font-size:15px;color:#1a1a1a;'>" +
                  "<span class='faq-icon' style='font-size:16px;color:" + brass + ";width:14px;'></span>" + he(f.question) +
                "</label>" +
                "<div class='faq-answer' style='display:none;padding:0 20px 20px 44px;font-size:14px;color:" + stone + ";line-height:1.6;'>" + (f.answerIsHtml ? styleInlineLinks(f.answer, brass) : he(f.answer)) + "</div>" +
              "</div>";
            }).join("") +
            "<style>.faq-icon::before{content:'+';}.faq-toggle:checked ~ label .faq-icon::before{content:'\u2212';}.faq-toggle:checked ~ label{color:" + brass + " !important;}.faq-toggle:checked + label + .faq-answer{display:block !important;}.faq-item:first-child{border-top:1px solid #dde0e6;}</style>" +
          "</div>" +
        "</section>"
      );
      var svcs  = Array.isArray(brief.servicesList) ? brief.servicesList : ["Reduced overall cost", "Reduced downtime", "Proactive planning", "Expert team", "Fast response time", "Tailored reporting", "Direct billing", "Add more below..."];
      var b1    = brief.benefit1 || "Faster results with less hassle";
      var b2    = brief.benefit2 || "One team handles everything end to end";
      var b3    = brief.benefit3 || "Decades of proven experience";
      var tq1   = brief.testimonial1Quote || "";
      var tn1   = brief.testimonial1Name  || "";
      var tt1   = brief.testimonial1Title || "";
      var formH = brief.formHeading    || "Request a Quote";
      var formS = brief.formSubhead    || "We'll get back to you within one business day.";
      var formC = brief.formCta        || "Send It Over";
      var formR = brief.formReassurance|| "No sales team. A real reply.";

      // Every call site below immediately string-replaced this template's
      // background away from brass to #ffffff and its text color to
      // whatever the surrounding section needed -- meaning brass was
      // never actually rendered here, and the text color (dark or brass,
      // inconsistently across variants) was never contrast-checked
      // against the white it always ended up on. Building it correctly
      // once, with real button data honored when defined, replaces every
      // one of those fragile .replace() chains below with a plain
      // reference to this same, already-correct string.
      var darkCtxBtnBg = (definedBtn && definedBtn.background) || "#ffffff";
      var darkCtxBtnText = (definedBtn && definedBtn.textColor) || bestTextColor(darkCtxBtnBg, dark);
      var btnStyle = "display:inline-block;padding:14px 32px;background:" + darkCtxBtnBg + ";color:" + darkCtxBtnText + ";font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:3px;";
      var btnOutline = "display:inline-block;padding:13px 28px;background:transparent;color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border:2px solid rgba(255,255,255,0.6);border-radius:3px;";
      // Secondary style previously had zero effect here regardless of what
      // was saved in Style Guide -- this always hardcoded brass directly.
      // A saved Secondary color now wins outright; brass stays the
      // fallback for briefs with none saved, unchanged from before.
      var secondaryColor = (secondaryBtn && secondaryBtn.background) || brass;
      var btnDark = "display:inline-block;padding:10px 24px;background:transparent;color:" + ink + ";font-weight:600;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border:2px solid " + secondaryColor + ";border-radius:3px;align-self:flex-start;width:fit-content;";
      // Filled/primary counterpart to btnDark (which is actually an
      // outline style, despite the name) -- feature-row buttons previously
      // had only one visual treatment regardless of Manifest's real
      // placement ("primary"/"secondary", link-and-button-roles change).
      // Mirrors landing.js's featureButton(): primary = filled Style A,
      // secondary = outline Style B (btnDark).
      var btnFilledLight = "display:inline-block;padding:11px 26px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:3px;align-self:flex-start;width:fit-content;";
      // f.body from a Manifest text_section is pre-escaped HTML when
      // f.bodyIsHtml is set (manifestImport.js's flattenTextSectionBodyHtml,
      // preserving contextual <a> link runs woven into the copy) --
      // running it through he() again would escape those real anchor tags
      // into visible text instead of rendering as links.
      // Colors and bolds those same <a> tags with the brand's real accent
      // color -- mirrors landing.js's styleInlineLinks() exactly (see that
      // file for the contrast reasoning on when color is omitted). This
      // row-style family sits on light backgrounds, so accent is always
      // safely readable here.
      function styleInlineLinks(html, color) {
        if (!html) return html;
        var style = color ? "color:" + color + ";font-weight:700" : "font-weight:700";
        return html.replace(/<a href="/g, '<a style="' + style + '" href="');
      }
      function featureBodyHtml(f) {
        return f.bodyIsHtml ? styleInlineLinks(f.body || "", brass) : he(f.body || "");
      }
      // Real per-feature button label + style, styled by Manifest's
      // explicit placement instead of every feature-row button rendering
      // identically. No href here -- this preview's row buttons are
      // already decorative (no anchor destinations anywhere in this file).
      function featureButtonHtml(f, fallbackLabel) {
        // Mirrors landing.js's featureButton() suppression -- see that
        // file's comment for the real MESO case this fixes. Preview
        // builds raw HTML strings rather than an Elementor element array,
        // so "" is the equivalent of a null return there: safe to
        // concatenate, renders nothing.
        if (f.buttonPlacement === "none") return "";
        var label = he(f.buttonLabel || fallbackLabel || cta2);
        var style = f.buttonPlacement === "secondary" ? btnDark : btnFilledLight;
        return "<a class='row-btn' style='" + style + "'>" + label + "</a>";
      }

      // Standalone map section — mirrors the real export's mkMapSection
      // (helpers.js): heading, an address/phone/hours info strip when
      // phone/hours are known (falls back to a plain address line
      // otherwise), a real Google Maps embed, and Call/Get Directions
      // buttons. Confirmed real gap, July 2026: this section existed in
      // every variant's real downloadable export but had no preview
      // equivalent at all -- what showed in-app never matched what
      // downloaded. Empty string when there's no real address, matching
      // makeMapSection()'s own early-exit.
      var mapHeadingText = brief.mapHeading || (brief.mapMode === "service_area" ? "Areas We Serve" : "Find Us");
      var mapEmbedHTML = brief.mapAddress
        ? "<iframe src=\"https://maps.google.com/maps?q=" + encodeURIComponent(brief.mapAddress) + "&output=embed\" style='border:0;width:100%;height:100%;min-height:320px;display:block;' loading='lazy'></iframe>"
        : "";
      var mapInfoStripHTML = (brief.mapPhone || brief.mapHours)
        ? "<div style='display:flex;gap:32px;flex-wrap:wrap;margin-bottom:24px;'>" +
            "<div><div style='font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:" + stone + ";margin-bottom:6px;'>Address</div><div style='font-size:14px;color:" + ink + ";'>" + he(brief.mapAddress || "") + "</div></div>" +
            (brief.mapPhone ? "<div><div style='font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:" + stone + ";margin-bottom:6px;'>Phone</div><div style='font-size:14px;color:" + ink + ";font-weight:600;'>" + he(brief.mapPhone) + "</div></div>" : "") +
            (brief.mapHours ? "<div><div style='font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:" + stone + ";margin-bottom:6px;'>Hours</div><div style='font-size:14px;color:" + ink + ";'>" + he(brief.mapHours) + "</div></div>" : "") +
          "</div>"
        : "<p style='font-size:15px;color:" + ink + ";margin:0 0 20px;'>" + he(brief.mapAddress || "") + "</p>";
      var mapCallBtnStyle = "display:inline-block;padding:12px 24px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;";
      var mapDirectionsBtnStyle = "display:inline-block;padding:11px 24px;background:transparent;color:" + ink + ";font-weight:700;font-size:12px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:2px solid " + ink + ";border-radius:4px;";
      var mapButtonsHTML = "<div style='display:flex;gap:12px;flex-wrap:wrap;'>" +
          (brief.mapPhone ? "<a class='cta-btn' style='" + mapCallBtnStyle + "'>Call " + he(brief.mapPhone) + "</a>" : "") +
          (brief.mapUrl ? "<a class='cta-btn' style='" + mapDirectionsBtnStyle + "'>" + he(brief.mapButtonLabel || (brief.mapMode === "service_area" ? "Check Your Area" : "Get Directions")) + "</a>" : "") +
        "</div>";
      var mapSectionHTML = brief.mapAddress ? (
        "<section style='background:" + bone + ";padding:60px clamp(24px,6vw,80px);'>" +
          "<h2 style='font-size:clamp(22px,3vw,32px);font-weight:700;color:" + ink + ";margin:0 0 24px;'>" + he(mapHeadingText) + "</h2>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;' class='map-section-grid'>" +
            "<div>" + mapInfoStripHTML + mapButtonsHTML + "</div>" +
            "<div style='min-height:320px;border-radius:8px;overflow:hidden;'>" + mapEmbedHTML + "</div>" +
          "</div>" +
        "</section>"
      ) : "";

      // Generic reusable form section HTML -- mirrors landing.js's
      // makeFormSection() output, used only in ordered mode (below) where
      // there's no per-variant "formAlreadyPlaced" curated-layout check to
      // thread through; ordered mode already knows exactly where the form
      // belongs from contentOrder itself.
      function genericFormHTML(anchorId) {
        var hasForm = brief.formHeading || (Array.isArray(brief.formFields) && brief.formFields.length);
        if (!hasForm) return "";
        var ffHeading = brief.formHeading || "Get a Quote";
        var ffSubhead = brief.formSubhead || "";
        var ffFields  = (Array.isArray(brief.formFields) && brief.formFields.length) ? brief.formFields : ["Name", "Phone", "Message"];
        var ffCta     = brief.formCta || "Request a Quote";
        return "<section" + (anchorId ? " id='" + anchorId + "'" : "") + " style='background:" + bone + ";padding:56px clamp(24px,6vw,64px);'>" +
            "<div style='max-width:560px;'>" +
            "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(ffHeading) + "</h3>" +
            (ffSubhead ? "<p style='font-size:14px;color:" + stone + ";margin:0 0 20px;'>" + he(ffSubhead) + "</p>" : "") +
            ffFields.map(function (lbl) {
              var safeLbl = he(String(lbl));
              return "<div style='margin-bottom:12px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + safeLbl + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#ffffff;font-size:14px;color:#bbb;box-sizing:border-box;'>" + safeLbl + "...</div></div>";
            }).join("") +
            "<button style='padding:12px 28px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:6px;'>" + he(ffCta) + "</button>" +
            "</div>" +
          "</section>";
      }

      // Gated closing-CTA HTML -- mirrors landing.js's makeClosingCta()
      // suppression exactly: previously every variant rendered this
      // unconditionally with fabricated fallback text ("Ready to get
      // started?") whenever Manifest sent no real closing content at all.
      // Real case: MESO's Atlanta DOT page has no section that resolves
      // to real closingCta/closingBody -- the whole section, including a
      // second button duplicating the hero's own primary CTA pointed at
      // an empty URL, was 100% invented. brief.closingCta/closingBody are
      // only ever set from real source data, never from the fallback
      // default itself (close/closeBody, defined earlier), so checking
      // them directly is the correct "is this real" test. bg defaults to
      // brass to match variant A/E/F's own treatment; pass "dark" for
      // variant B's own darker closing section.
      function closingCtaHTML(bg) {
        // closingCtaButtonLabel added -- confirmed real case, Kansas
        // City's export: a cta section can carry ONLY a real button (no
        // heading/body at all), which still means real content exists.
        // Mirrors landing.js's makeClosingCta() exactly.
        if (!brief.closingCta && !brief.closingBody && !brief.closingCtaButtonLabel) return "";
        var sectionBg = bg || brass;
        // A cta section's own button is real, page-specific copy,
        // distinct from the hero's -- prefer it as a single filled
        // button over always duplicating the hero's cta1/cta2 pair.
        var buttonsHtml = brief.closingCtaButtonLabel
          ? "<a class='cta-btn' style='display:inline-block;padding:14px 32px;background:#ffffff;color:" + sectionBg + ";font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:3px;'>" + he(brief.closingCtaButtonLabel) + "</a>"
          : "<a class='cta-btn' style='" + btnStyle + "'>" + cta1 + "</a><a class='cta-btn' style='" + btnOutline + "'>" + cta2 + "</a>";
        return "<section class='va-cta' style='background:" + sectionBg + ";padding:80px 40px;text-align:center;'>" +
          "<h2 style='font-size:clamp(26px,4vw,42px);font-weight:700;color:#ffffff;margin:0 0 12px;'>" + close + "</h2>" +
          "<p style='font-size:16px;color:rgba(255,255,255,0.8);margin:0 0 32px;max-width:540px;margin-left:auto;margin-right:auto;'>" + closeBody + "</p>" +
          "<div style='display:flex;gap:16px;justify-content:center;flex-wrap:wrap;'>" + buttonsHtml + "</div>" +
        "</section>";
      }

      // Renders every Manifest-sourced content block (features, FAQ, form,
      // map, closing CTA) in the exact sequence Manifest's export used --
      // mirrors landing.js's renderOrderedContent() exactly, same
      // reasoning documented there. Reuses renderCuratedFeatureLayoutHTML
      // (already handles a single-feature synthetic layout entry, same
      // way landing.js reuses renderFeatureLayout) so feature blocks get
      // whatever curated style the Section Styles panel assigned, falling
      // back to the SAME per-row auto-cycle the panel itself displays when
      // nothing was curated yet (defaultOrderedRowStyle -- mirrors
      // index.jsx's own defaultRowStyle exactly; see landing.js's version
      // of this fix for the real case it closes: panel showing "Split
      // image, right" selected while the page rendered plain). Returns ""
      // when brief.contentOrder doesn't exist -- every variant below falls
      // back to its original fixed-order assembly, unchanged, for
      // legacy/manual briefs and any Manifest import parsed before this
      // fix.
      function defaultOrderedRowStyle(i, hasVideo) {
        var cycle = hasVideo
          ? ["split-right", "centered-cta", "video", "split-left", "split-cta-right", "plain"]
          : ["split-right", "centered-cta", "split-left", "split-cta-right", "plain"];
        return cycle[i % cycle.length];
      }
      // Mirrors landing.js's safeStyleFor/safeOrderedRowStyle exactly --
      // see that file for the real case this fixes (a button-forcing
      // style, curated OR auto-assigned, landing on a feature with no
      // real button, which fabricates a "Contact Us" pointing nowhere --
      // including a style that was auto-assigned before this safety
      // check existed and got frozen into brief.featureLayout by a since-
      // unrelated panel edit, which is why this needs to run on curated
      // styles too, not just the auto-cycle fallback).
      function safeStyleFor(style, f) {
        var hasRealButton = !!(f && f.buttonUrl && f.buttonPlacement !== "none");
        if (hasRealButton) return style;
        if (style === "centered-cta") return "plain";
        if (style === "split-cta-right") return "split-right";
        if (style === "split-cta-left") return "split-left";
        return style;
      }
      function safeOrderedRowStyle(i, hasVideo) {
        var f = Array.isArray(brief.features) ? brief.features[i] : null;
        return safeStyleFor(defaultOrderedRowStyle(i, hasVideo), f);
      }
      // For the legacy curated-layout path (featureLayout set but no
      // contentOrder) -- same substitution, applied per entry, using the
      // first index's feature for a grouped row (matches how a grouped
      // row's button already attaches to its first index everywhere
      // else in this file).
      function safeFeatureLayout(layout) {
        return layout.map(function (e) {
          var firstIdx = e.indices && e.indices[0];
          var f = Array.isArray(brief.features) ? brief.features[firstIdx] : null;
          return { style: safeStyleFor(e.style, f), indices: e.indices, header: e.header };
        });
      }
      function renderOrderedContentHTML(opts) {
        opts = opts || {};
        if (!Array.isArray(brief.contentOrder) || !brief.contentOrder.length) return "";
        return brief.contentOrder.map(function (block) {
          if (block.type === "feature") {
            var curated = Array.isArray(brief.featureLayout)
              ? brief.featureLayout.filter(function (e) { return e.indices && e.indices.length === 1 && e.indices[0] === block.index; })[0]
              : null;
            var f = Array.isArray(brief.features) ? brief.features[block.index] : null;
            var style = safeStyleFor(curated ? curated.style : defaultOrderedRowStyle(block.index, !!brief.videoUrl), f);
            return renderCuratedFeatureLayoutHTML([{ style: style, indices: [block.index] }]);
          } else if (block.type === "faq") {
            return faqHTML;
          } else if (block.type === "form") {
            // Variant B always leads with its own two-column form+trust
            // section, and Variant F folds the form into its hero-area
            // layout separately -- opts.skipForm avoids a redundant
            // second form further down the page in ordered mode.
            if (opts.skipForm) return "";
            return genericFormHTML(opts.formAnchorId);
          } else if (block.type === "map") {
            // Variant F's hero already includes the map.
            if (opts.skipMap) return "";
            return mapSectionHTML;
          } else if (block.type === "cta") {
            return closingCtaHTML(opts.closingBg);
          }
          return "";
        }).join("");
      }

      // ── VARIANT B — Lead Form ──────────────────────────────────────────────
      if (variant === "B") {
        var formFieldsB = Array.isArray(brief.formFields) ? brief.formFields : ["Name", "Company", "Phone", "What do you need?", "Message"];
        return "<section style='background:" + dark + ";padding:clamp(48px,8vh,80px) clamp(24px,6vw,80px);position:relative;'>" +
            "<div class='var-b-hero' style='max-width:1100px;margin:0 auto;text-align:center;'>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:16px;'>" + (brief.heroEyebrow != null ? brief.heroEyebrow : (brief.brandName||"Brand")) + "</div>" +
              "<h1 style='font-weight:800;font-size:clamp(32px,5vw,56px);color:#ffffff;margin:0 0 18px;line-height:1.08;'>" + h1 + "</h1>" +
              (hook ? "<p style='font-size:18px;color:rgba(255,255,255,0.85);margin:0 0 12px;line-height:1.6;font-style:italic;'>" + hook + "</p>" : "") +
              "<p style='font-size:clamp(14px,3.5vw,16px);color:rgba(255,255,255,0.8);margin:0 0 24px;line-height:1.55;max-width:580px;margin-left:auto;margin-right:auto;'>" + sub + "</p>" +
              "<a style='" + btnStyle + "'>" + cta1 + "</a>" +
            "</div>" +
          "</section>" +
          "<section style='background:" + bone + ";padding:80px clamp(24px,6vw,80px);'>" +
            "<div class='var-b-body' style='max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start;'>" +
              "<div>" +
                "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:700;color:" + ink + ";margin:0 0 14px;'>Why " + (brief.brandName||"Us") + "?</h2>" +
                "<p style='font-size:15px;color:" + text + ";line-height:1.65;margin:0 0 20px;'>" + whyUsIntro + "</p>" +
                "<div style='display:flex;flex-direction:column;gap:10px;margin-bottom:26px;'>" +
                  [wb1, wb2].map(function(b) {
                    return "<div style='display:flex;align-items:center;gap:10px;'><span style='color:" + brass + ";font-weight:700;flex-shrink:0;'>&#10003;</span><span style='font-size:14px;color:" + text + ";'>" + b + "</span></div>";
                  }).join("") +
                "</div>" +
                (brief.skipTrustStats ? "" :
                "<div style='display:flex;flex-direction:row;gap:24px;'>" +
                  [{ s: s1, l: l1 }, { s: s2, l: l2 }, { s: s3, l: l3 }].map(function(t) {
                    return "<div><div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;margin-bottom:4px;'>" + t.s + "</div><div style='font-size:13px;color:" + stone + ";font-weight:500;'>" + t.l + "</div></div>";
                  }).join("") +
                "</div>") +
              "</div>" +
              "<div style='background:#ffffff;border:1px solid #dde0e6;border-radius:8px;padding:40px;'>" +
                "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + formH + "</h3>" +
                "<p style='font-size:14px;color:" + stone + ";margin:0 0 24px;'>" + formS + "</p>" +
                formFieldsB.map(function(f) {
                  return "<div style='margin-bottom:14px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + f + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#f9f9f9;font-size:14px;color:#bbb;box-sizing:border-box;'>" + f + "...</div></div>";
                }).join("") +
                "<button style='width:100%;padding:14px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:8px;'>" + formC + "</button>" +
                "<p style='font-size:12px;color:" + stone + ";text-align:center;margin:10px 0 0;'>" + formR + "</p>" +
              "</div>" +
            "</div>" +
          "</section>" +
          ((String(brief.testimonial1Name || "").trim() && !brief.skipTestimonials) ? (
          "<section style='background:" + dark + ";padding:70px clamp(24px,6vw,80px);text-align:center;'>" +
            "<h2 style='font-size:clamp(24px,3vw,32px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;'>" + (brief.testimonialHeading || "What Our Customers Are Saying:") + "</h2>" +
            "<div style='max-width:640px;margin:0 auto;'>" +
              "<p style='font-size:21px;font-style:italic;color:#ffffff;line-height:1.5;margin:0 0 18px;'>&#8220;" + tq1 + "&#8221;</p>" +
              "<div style='width:28px;height:2px;background:" + brass + ";margin:0 auto 14px;'></div>" +
              "<p style='font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 22px;'>" + tn1 + (tt1 ? " &middot; " + tt1 : "") + "</p>" +
              "<div style='display:flex;justify-content:center;gap:6px;'>" +
                "<div style='width:6px;height:6px;border-radius:50%;background:" + brass + ";'></div>" +
                "<div style='width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);'></div>" +
                "<div style='width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);'></div>" +
              "</div>" +
            "</div>" +
          "</section>"
          ) : "") +
          (brief.contentOrder ? renderOrderedContentHTML({ skipForm: true, closingBg: dark }) :
          (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0 ? renderCuratedFeatureLayoutHTML(safeFeatureLayout(brief.featureLayout)) :
          (variant === "D" || variant === "B") ? renderCuratedFeatureLayoutHTML((Array.isArray(brief.features) ? brief.features : []).map(function (_, i) {
            // Mirrors landing.js's Variant D/B dispatch -- Variant B's
            // feature rows were falling straight through to the plain
            // uniform stacked-text/compact-list style with no variety at
            // all (no featureLayout check, no variant check -- this
            // occurrence had neither). Confirmed via brace-boundary
            // tracing that this specific code only runs inside the real
            // Variant B block, so variant is guaranteed "B" here whenever
            // this branch is reached from a B page; included the "D"
            // check too for consistency with the same pattern elsewhere.
            var hasVideo = !!brief.videoUrl;
            var cyclePattern = hasVideo
              ? ["split-right", "centered-cta", "video", "split-left", "split-cta-right", "plain"]
              : ["split-right", "centered-cta", "split-left", "split-cta-right", "plain"];
            return { style: cyclePattern[i % cyclePattern.length], indices: [i] };
          })) :
          featureRowsData.map(function(f,i) {
            if (featureRowStyle === "stacked-text") {
              return "<section style='background:" + (i%2===0?"#ffffff":bone) + ";padding:56px clamp(24px,6vw,64px);'>" +
                "<div style='width:28px;height:2px;background:" + brass + ";margin-bottom:16px;'></div>" +
                "<h3 style='font-size:clamp(18px,2.2vw,24px);font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + f[0] + "</h3>" +
                "<p style='font-size:15px;color:" + text + ";line-height:1.7;margin:0;max-width:760px;'>" + f[1] + "</p>" +
              "</section>";
            }
            if (featureRowStyle === "compact-list") {
              return "<div style='display:flex;gap:20px;align-items:flex-start;padding:22px clamp(24px,6vw,64px);border-bottom:1px solid #f0f0f0;background:#ffffff;'>" +
                "<div style='width:36px;height:36px;border-radius:50%;background:" + brass + ";display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ffffff;font-weight:700;font-size:14px;'>" + (i+1) + "</div>" +
                "<div><h4 style='font-size:16px;font-weight:700;color:" + ink + ";margin:0 0 6px;'>" + f[0] + "</h4><p style='font-size:14px;color:" + text + ";line-height:1.6;margin:0;'>" + f[1] + "</p></div>" +
              "</div>";
            }
            var imgLeft = i%2!==0;
            var cols = imgLeft
              ? "<div class='landing-img' style='min-height:400px;height:100%;overflow:hidden;'><img src=\"" + f[2] + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:400px;'/></div><div style='padding:72px 64px;display:flex;flex-direction:column;justify-content:center;'>"
              : "<div style='padding:72px 64px;display:flex;flex-direction:column;justify-content:center;'>";
            var textContent = "<h2 style='font-size:clamp(22px,3vw,34px);font-weight:700;color:" + brass + ";margin:0 0 16px;'>" + f[0] + "</h2><p style='font-size:16px;color:" + text + ";line-height:1.75;margin:0 0 28px;'>" + f[1] + "</p>" + (f[3] === "none" ? "" : "<a class='row-btn' style='" + btnDark + "'>" + cta2 + "</a>") + "</div>";
            var imgRight = !imgLeft ? "<div class='landing-img' style='min-height:400px;height:100%;overflow:hidden;'><img src=\"" + f[2] + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:400px;'/></div>" : "";
            return "<section style='display:grid;grid-template-columns:1fr 1fr;background:" + (i%2===0?"#ffffff":bone) + ";'>" + cols + textContent + imgRight + "</section>";
          }).join(""))) +
          (brief.contentOrder ? "" : mapSectionHTML) +
          (brief.contentOrder ? "" : closingCtaHTML(dark)) +
          (Array.isArray(brief.postClosingLayout) && brief.postClosingLayout.length > 0 ? renderCuratedFeatureLayoutHTML(brief.postClosingLayout) : "") +
          (brief.contentOrder ? "" : faqHTML);
      }

      // ── VARIANT C — Minimal Retargeting ────────────────────────────────────
      if (variant === "C") {
        return "<section style='background:" + brass + ";padding:clamp(80px,12vh,140px) clamp(24px,6vw,80px);text-align:center;min-height:50vh;display:flex;align-items:center;'>" +
            "<div style='max-width:760px;margin:0 auto;width:100%;'>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:20px;'>" + (brief.heroEyebrow != null ? brief.heroEyebrow : (brief.brandName||"Brand")) + "</div>" +
              "<h1 style='font-weight:800;font-size:clamp(36px,6vw,72px);color:#ffffff;margin:0 0 20px;line-height:1.05;'>" + h1 + "</h1>" +
              "<p style='font-size:clamp(14px,1.5vw,18px);color:rgba(255,255,255,0.85);margin:0 0 32px;line-height:1.55;max-width:520px;margin-left:auto;margin-right:auto;'>" + sub + "</p>" +
              "<div style='display:flex;gap:16px;justify-content:center;flex-wrap:wrap;'>" +
                heroButtonRowHtml() +
              "</div>" +
            "</div>" +
          "</section>" +
          "<section style='background:#ffffff;padding:72px clamp(24px,6vw,80px);border-bottom:1px solid rgba(0,0,0,0.06);'>" +
            "<div style='max-width:860px;margin:0 auto;'>" +
              [[b1,"✓"],[b2,"✓"],[b3,"✓"]].map(function(b,_i) {
                return "<div class='grid-cell benefit-row' style='padding:28px 0;display:flex;align-items:center;gap:24px;text-align:left;border-bottom:1px solid rgba(0,0,0,0.06);'><span class='benefit-check' style='font-size:32px;color:" + brass + ";font-weight:800;flex-shrink:0;line-height:1;'>✓</span><p class='benefit-text' style='font-size:clamp(14px,1.8vw,22px);font-weight:600;color:" + ink + ";line-height:1.25;margin:0;'>" + b[0] + "</p></div>";
              }).join("") +
            "</div>" +
          "</section>" +
          ((String(brief.testimonial1Name || "").trim() && !brief.skipTestimonials) ? (
          "<section style='background:" + bone + ";padding:0;display:grid;grid-template-columns:1fr 1fr;'>" +
            "<div class='landing-img' style='min-height:420px;height:100%;overflow:hidden;'><img src=\"" + img1 + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:420px;'/></div>" +
            "<div style='padding:64px 56px;display:flex;flex-direction:column;justify-content:center;'>" +
              "<p style='font-size:20px;font-style:italic;color:" + ink + ";line-height:1.65;margin:0 0 24px;'>&#8220;" + tq1 + "&#8221;</p>" +
              "<div style='width:36px;height:2px;background:" + brass + ";margin-bottom:14px;'></div>" +
              "<div style='font-size:15px;font-weight:600;color:" + ink + ";'>" + tn1 + "</div>" +
              "<div style='font-size:13px;color:" + stone + ";'>" + tt1 + "</div>" +
            "</div>" +
          "</section>"
          ) : "") +
          mapSectionHTML +
          "<section style='background:" + brass + ";padding:100px 40px;text-align:center;'>" +
            "<h2 style='font-size:clamp(26px,4vw,44px);font-weight:800;color:#ffffff;margin:0 0 12px;'>" + close + "</h2>" +
            "<p style='font-size:16px;color:rgba(255,255,255,0.8);margin:0 0 36px;max-width:480px;margin-left:auto;margin-right:auto;'>" + closeBody + "</p>" +
            "<a class='cta-btn' style='" + btnStyle + "display:block;max-width:280px;margin:0 auto;text-align:center;'>" + cta1 + "</a>" +
            "<p style='font-size:13px;color:rgba(255,255,255,0.6);margin:16px 0 0;'>" + formR + "</p>" +
          "</section>";
      }

      // ── VARIANT E — Narrative / Trust-First ─────────────────────────────────
      // Mirrors landing.js's Variant E: same hero/trust-strip look as
      // Awareness, but social proof moved up right after the trust strip
      // instead of only appearing at the bottom, and a secondary CTA
      // woven in every third feature row via the "midcta" style above
      // instead of saved for a single push at the end.
      if (variant === "E") {
        return "<section class='va-hero' style='position:relative;min-height:70vh;display:flex;align-items:center;padding:clamp(48px,8vh,80px) clamp(24px,6vw,80px);overflow:hidden;'>" +
            "<img src=\"" + heroImg + "\" alt='hero' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;'/>" +
            "<div style='position:absolute;inset:0;background:" + brass + ";opacity:0.85;z-index:1;'></div>" +
            "<div class='var-a-wrap' style='position:relative;z-index:2;width:100%;max-width:1100px;margin:0 auto;padding:0 clamp(16px,4vw,60px);'>" +
            "<div style='max-width:660px;'>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:20px;'>" + (brief.heroEyebrow != null ? brief.heroEyebrow : (brief.brandName||"Brand")) + "</div>" +
              "<h1 style='font-weight:800;font-size:clamp(32px,5.5vw,62px);color:#ffffff;margin:0 0 20px;line-height:1.08;'>" + h1 + "</h1>" +
              (hook ? "<p style='font-size:18px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.6;font-style:italic;'>" + hook + "</p>" : "") +
              "<p style='font-size:clamp(13px,3.5vw,16px);color:rgba(255,255,255,0.82);margin:0 0 28px;line-height:1.55;max-width:560px;'>" + sub + "</p>" +
              "<div style='display:flex;gap:16px;flex-wrap:wrap;align-items:center;'>" +
                heroButtonRowHtml("display:inline-block;") +
              "</div>" +
            "</div></div>" +
          "</section>" +
          (brief.skipTrustStats ? "" :
          "<section class='va-trust' style='background:#ffffff;padding:0;border-bottom:1px solid #f0f0f0;'>" +
            "<div style='display:grid;grid-template-columns:repeat(3,1fr);'>" +
              [{ s:s1,l:l1 },{ s:s2,l:l2 },{ s:s3,l:l3 }].map(function(t,i) {
                return "<div class='grid-cell' style='padding:40px 32px;text-align:center;" + (i<2?"border-right:1px solid #f0f0f0;":"") + "'><div style='font-size:42px;font-weight:800;color:" + brass + ";line-height:1;margin-bottom:6px;'>" + t.s + "</div><div style='font-size:14px;color:" + stone + ";font-weight:500;letter-spacing:0.02em;'>" + t.l + "</div></div>";
              }).join("") +
            "</div>" +
          "</section>") +
          // Social proof moved up here, right after the trust strip --
          // the actual structural difference from Awareness, not just a
          // different color cycle.
          ((String(brief.testimonial1Name || "").trim() && !brief.skipTestimonials) ? (
          "<section style='background:" + dark + ";padding:70px clamp(24px,6vw,80px);text-align:center;'>" +
            "<h2 style='font-size:clamp(24px,3vw,32px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;'>" + (brief.testimonialHeading || "What Our Customers Are Saying:") + "</h2>" +
            "<div style='max-width:640px;margin:0 auto;'>" +
              "<p style='font-size:21px;font-style:italic;color:#ffffff;line-height:1.5;margin:0 0 18px;'>&#8220;" + tq1 + "&#8221;</p>" +
              "<div style='width:28px;height:2px;background:" + brass + ";margin:0 auto 14px;'></div>" +
              "<p style='font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 22px;'>" + tn1 + (tt1 ? " &middot; " + tt1 : "") + "</p>" +
            "</div>" +
          "</section>"
          ) : "") +
          (brief.contentOrder ? renderOrderedContentHTML() :
          (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0 ? renderCuratedFeatureLayoutHTML(safeFeatureLayout(brief.featureLayout)) :
          (function () {
            // The one variant missing this check entirely -- B/D/F all
            // correctly prioritize brief.featureLayout before falling
            // back to this auto-cycle; E always rebuilt the auto-cycle
            // from scratch regardless of what the Section Styles picker
            // had saved. Confirmed via a live-session test (Variant E is
            // "Narrative", the actual default-active layout) and a direct
            // render diff showing identical output regardless of
            // featureLayout content before this fix.
            var featuresArr = Array.isArray(brief.features) ? brief.features : [];
            var dynamicLayout = [];
            featuresArr.forEach(function (_, i) {
              var hasVideo = !!brief.videoUrl;
              var cyclePattern = hasVideo
                ? ["split-right", "centered-cta", "video", "split-left", "split-cta-right", "plain"]
                : ["split-right", "centered-cta", "split-left", "split-cta-right", "plain"];
              dynamicLayout.push({ style: cyclePattern[i % cyclePattern.length], indices: [i] });
              if ((i + 1) % 3 === 0 && i < featuresArr.length - 1) dynamicLayout.push({ style: "midcta", indices: [] });
            });
            return renderCuratedFeatureLayoutHTML(dynamicLayout);
          })())) +
          (brief.skipServicesChecklist ? "" :
          "<section style='background:" + bone + ";padding:80px clamp(24px,6vw,80px);border-top:1px solid rgba(0,0,0,0.08);'>" +
            "<h2 style='font-size:clamp(22px,3vw,32px);font-weight:700;color:" + ink + ";margin:0 0 32px;'>" + (brief.servicesHeading||"What We Do") + "</h2>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:900px;'>" +
              svcs.map(function(s) {
                return "<div style='padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:19px;color:" + text + ";display:flex;align-items:center;gap:10px;'><span style='font-size:19px;color:" + brass + ";font-weight:700;'>✓</span>" + s + "</div>";
              }).join("") +
            "</div>" +
          "</section>") +
          (brief.contentOrder ? "" : mapSectionHTML) +
          (brief.contentOrder ? "" : closingCtaHTML()) +
          (brief.contentOrder ? "" : faqHTML);
      }

      // ── VARIANT F — Location: headline + address/hours/map combined into
      // one light section instead of a separate dark hero. Mirrors
      // landing.js's Variant F exactly -- same trust strip, conditional
      // testimonial, feature-row cycling, conditional checklist, form, and
      // closing as Variant D, just with this section swapped in for the
      // hero and no standalone map section further down (it's already up
      // top). New variant, added alongside the existing ones.
      if (variant === "F") {
        var heroFAddressParts = brief.mapAddress ? brief.mapAddress.split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
        var heroFAddressLines = heroFAddressParts.length > 1 ? [heroFAddressParts[0], heroFAddressParts.slice(1).join(", ")] : heroFAddressParts;
        var heroFAddressHtml = heroFAddressLines.map(function (l) { return he(l); }).join("<br>");
        if (brief.mapPhone) heroFAddressHtml += (heroFAddressHtml ? "<br>" : "") + "Telephone: " + he(brief.mapPhone);
        var heroFAddress = heroFAddressHtml ? "<p style='font-size:15px;color:" + ink + ";line-height:1.6;margin:0 0 10px;'>" + heroFAddressHtml + "</p>" : "";
        var heroFHours = brief.mapHours ? "<p style='font-size:14px;color:" + ink + ";line-height:1.6;margin:0 0 20px;'>" + he(brief.mapHours) + "</p>" : "";
        var heroFHasForm = !!(brief.formHeading || (Array.isArray(brief.formFields) && brief.formFields.length));
        // Call/Email/Contact Us -- matches the real reference (LubeZone)
        // exactly, confirmed against its live page source. No separate
        // Get Directions button: the embedded map itself carries that.
        // Always rendered, same as the real export -- real data fills
        // them in, a "#" placeholder otherwise so the layout is visible
        // before that data exists.
        var heroFCallBtn = "<a class='cta-btn' style='" + mapCallBtnStyle + "'>" + he(brief.mapPhone || cta1) + "</a>";
        var heroFEmailBtn = "<a class='cta-btn' href='" + (brief.mapEmail ? "mailto:" + he(brief.mapEmail) : "#") + "' style='" + mapDirectionsBtnStyle + "'>Email Us</a>";
        var heroFContactBtn = "<a class='cta-btn' href='" + (heroFHasForm ? "#contact-form" : "#") + "' style='" + mapDirectionsBtnStyle + "'>Contact Us</a>";
        return "<section style='background:" + bone + ";padding:0;'>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;align-items:stretch;' class='hero-f-grid'>" +
              "<div style='padding:clamp(40px,6vw,72px) clamp(24px,5vw,56px);display:flex;flex-direction:column;justify-content:center;'>" +
                "<h1 style='font-weight:800;font-size:clamp(28px,4vw,42px);color:" + ink + ";margin:0 0 20px;line-height:1.15;'>" + h1 + "</h1>" +
                heroFAddress + heroFHours +
                "<div style='display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;'>" + heroFCallBtn + heroFEmailBtn + heroFContactBtn + "</div>" +
              "</div>" +
              "<div style='min-height:340px;'>" + mapEmbedHTML + "</div>" +
            "</div>" +
          "</section>" +
          ((String(brief.testimonial1Name || "").trim() && !brief.skipTestimonials) ? (
            "<section style='background:" + dark + ";padding:70px clamp(24px,6vw,80px);text-align:center;'>" +
              "<h2 style='font-size:clamp(24px,3vw,32px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;'>" + (brief.testimonialHeading || "What Our Customers Are Saying:") + "</h2>" +
              "<div style='max-width:640px;margin:0 auto;'>" +
                "<p style='font-size:21px;font-style:italic;color:#ffffff;line-height:1.5;margin:0 0 18px;'>&#8220;" + tq1 + "&#8221;</p>" +
                "<div style='width:28px;height:2px;background:" + brass + ";margin:0 auto 14px;'></div>" +
                "<p style='font-size:14px;color:rgba(255,255,255,0.7);margin:0;'>" + tn1 + (tt1 ? " &middot; " + tt1 : "") + "</p>" +
              "</div>" +
            "</section>"
          ) : "") +
          (brief.contentOrder ? renderOrderedContentHTML({ skipMap: true, formAnchorId: "contact-form" }) :
          (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0 ? renderCuratedFeatureLayoutHTML(safeFeatureLayout(brief.featureLayout)) :
          renderCuratedFeatureLayoutHTML((Array.isArray(brief.features) ? brief.features : []).map(function (_, i) {
            var hasVideo = !!brief.videoUrl;
            var cyclePattern = hasVideo
              ? ["split-right", "centered-cta", "video", "split-left", "split-cta-right", "plain"]
              : ["split-right", "centered-cta", "split-left", "split-cta-right", "plain"];
            return { style: cyclePattern[i % cyclePattern.length], indices: [i] };
          })))) +
          (brief.skipServicesChecklist ? "" :
          "<section style='background:" + bone + ";padding:80px clamp(24px,6vw,80px);border-top:1px solid rgba(0,0,0,0.08);'>" +
            "<h2 style='font-size:clamp(22px,3vw,32px);font-weight:700;color:" + ink + ";margin:0 0 32px;'>" + (brief.servicesHeading||"What We Do") + "</h2>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:900px;'>" +
              svcs.map(function(s) {
                return "<div style='padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:19px;color:" + text + ";display:flex;align-items:center;gap:10px;'><span style='font-size:19px;color:" + brass + ";font-weight:700;'>✓</span>" + s + "</div>";
              }).join("") +
            "</div>" +
          "</section>") +
          (brief.contentOrder ? "" : (function () {
            var hasForm = brief.formHeading || (Array.isArray(brief.formFields) && brief.formFields.length);
            if (!hasForm) return "";
            var formAlreadyPlaced =
              (Array.isArray(brief.featureLayout) && brief.featureLayout.some(function (e) { return e.style === "embedded-form"; })) ||
              (Array.isArray(brief.postClosingLayout) && brief.postClosingLayout.some(function (e) { return e.style === "embedded-form"; }));
            if (formAlreadyPlaced) return "";
            var ffHeading = brief.formHeading || "Get a Quote";
            var ffSubhead = brief.formSubhead || "";
            var ffFields  = (Array.isArray(brief.formFields) && brief.formFields.length) ? brief.formFields : ["Name", "Phone", "Message"];
            var ffCta     = brief.formCta || "Request a Quote";
            return "<section id='contact-form' style='background:" + bone + ";padding:56px clamp(24px,6vw,64px);'>" +
                "<div style='max-width:560px;'>" +
                "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + ffHeading + "</h3>" +
                (ffSubhead ? "<p style='font-size:14px;color:" + stone + ";margin:0 0 20px;'>" + ffSubhead + "</p>" : "") +
                ffFields.map(function (lbl) {
                  return "<div style='margin-bottom:12px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + lbl + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#ffffff;font-size:14px;color:#bbb;box-sizing:border-box;'>" + lbl + "...</div></div>";
                }).join("") +
                "<button style='padding:12px 28px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:6px;'>" + ffCta + "</button>" +
                "</div>" +
              "</section>";
          })()) +
          (brief.contentOrder ? "" : closingCtaHTML()) +
          (Array.isArray(brief.postClosingLayout) && brief.postClosingLayout.length > 0 ? renderCuratedFeatureLayoutHTML(brief.postClosingLayout) : "") +
          (brief.contentOrder ? "" : faqHTML);
      }

      // ── VARIANT A — Awareness / Feature (default) ──────────────────────────
      return "<section class='va-hero' style='position:relative;min-height:70vh;display:flex;align-items:center;padding:clamp(48px,8vh,80px) clamp(24px,6vw,80px);overflow:hidden;'>" +
          "<img src=\"" + heroImg + "\" alt='hero' style='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;'/>" +
          "<div style='position:absolute;inset:0;background:" + brass + ";opacity:0.85;z-index:1;'></div>" +
          "<div class='var-a-wrap' style='position:relative;z-index:2;width:100%;max-width:1100px;margin:0 auto;padding:0 clamp(16px,4vw,60px);'>" +
          "<div style='max-width:660px;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:20px;'>" + (brief.heroEyebrow != null ? brief.heroEyebrow : (brief.brandName||"Brand")) + "</div>" +
            "<h1 style='font-weight:800;font-size:clamp(32px,5.5vw,62px);color:#ffffff;margin:0 0 20px;line-height:1.08;'>" + h1 + "</h1>" +
            (hook ? "<p style='font-size:18px;color:rgba(255,255,255,0.9);margin:0 0 12px;line-height:1.6;font-style:italic;'>" + hook + "</p>" : "") +
            "<p style='font-size:clamp(13px,3.5vw,16px);color:rgba(255,255,255,0.82);margin:0 0 28px;line-height:1.55;max-width:560px;'>" + sub + "</p>" +
            "<div style='display:flex;gap:16px;flex-wrap:wrap;align-items:center;'>" +
              heroButtonRowHtml("display:inline-block;") +
            "</div>" +
          "</div></div>" +
        "</section>" +
        (brief.skipTrustStats ? "" :
        "<section class='va-trust' style='background:#ffffff;padding:0;border-bottom:1px solid #f0f0f0;'>" +
          "<div style='display:grid;grid-template-columns:repeat(3,1fr);'>" +
            [{ s:s1,l:l1 },{ s:s2,l:l2 },{ s:s3,l:l3 }].map(function(t,i) {
              return "<div class='grid-cell' style='padding:40px 32px;text-align:center;" + (i<2?"border-right:1px solid #f0f0f0;":"") + "'><div style='font-size:42px;font-weight:800;color:" + brass + ";line-height:1;margin-bottom:6px;'>" + t.s + "</div><div style='font-size:14px;color:" + stone + ";font-weight:500;letter-spacing:0.02em;'>" + t.l + "</div></div>";
            }).join("") +
          "</div>" +
        "</section>") +
        ((String(brief.testimonial1Name || "").trim() && !brief.skipTestimonials) ? (
          "<section style='background:" + dark + ";padding:70px clamp(24px,6vw,80px);text-align:center;'>" +
            "<h2 style='font-size:clamp(24px,3vw,32px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;'>" + (brief.testimonialHeading || "What Our Customers Are Saying:") + "</h2>" +
            "<div style='max-width:640px;margin:0 auto;'>" +
              "<p style='font-size:21px;font-style:italic;color:#ffffff;line-height:1.5;margin:0 0 18px;'>&#8220;" + tq1 + "&#8221;</p>" +
              "<div style='width:28px;height:2px;background:" + brass + ";margin:0 auto 14px;'></div>" +
              "<p style='font-size:14px;color:rgba(255,255,255,0.7);margin:0;'>" + tn1 + (tt1 ? " &middot; " + tt1 : "") + "</p>" +
            "</div>" +
          "</section>"
        ) : "") +
        (brief.contentOrder ? renderOrderedContentHTML() :
        (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0 ? renderCuratedFeatureLayoutHTML(safeFeatureLayout(brief.featureLayout)) :
        variant === "D" ? renderCuratedFeatureLayoutHTML((Array.isArray(brief.features) ? brief.features : []).map(function (_, i) {
          // Mirrors landing.js's Variant D dispatch -- the same proven,
          // brand-agnostic visual-variety cycle, built dynamically here
          // since the preview has no equivalent of landing.js's
          // renderFeatureLayout dispatch table to reuse directly.
          var hasVideo = !!brief.videoUrl;
          var cyclePattern = hasVideo
            ? ["split-right", "centered-cta", "video", "split-left", "split-cta-right", "plain"]
            : ["split-right", "centered-cta", "split-left", "split-cta-right", "plain"];
          return { style: cyclePattern[i % cyclePattern.length], indices: [i] };
        })) :
        featureRowsDataB.map(function(f,i) {
          if (featureRowStyle === "stacked-text") {
            return "<section style='background:" + (i%2===0?"#ffffff":bone) + ";padding:52px clamp(24px,6vw,64px);'>" +
              "<div style='width:28px;height:2px;background:" + brass + ";margin-bottom:14px;'></div>" +
              "<h3 style='font-size:clamp(17px,2vw,22px);font-weight:700;color:" + ink + ";margin:0 0 10px;'>" + f[0] + "</h3>" +
              "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0;max-width:760px;'>" + f[1] + "</p>" +
            "</section>";
          }
          if (featureRowStyle === "compact-list") {
            return "<div style='display:flex;gap:18px;align-items:flex-start;padding:20px clamp(24px,6vw,64px);border-bottom:1px solid #f0f0f0;background:#ffffff;'>" +
              "<div style='width:32px;height:32px;border-radius:50%;background:" + brass + ";display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#ffffff;font-weight:700;font-size:13px;'>" + (i+1) + "</div>" +
              "<div><h4 style='font-size:15px;font-weight:700;color:" + ink + ";margin:0 0 5px;'>" + f[0] + "</h4><p style='font-size:13px;color:" + text + ";line-height:1.6;margin:0;'>" + f[1] + "</p></div>" +
            "</div>";
          }
          var textDiv = "<div class='feature-text' style='padding:72px 64px;display:flex;flex-direction:column;justify-content:center;'><h2 style='font-size:clamp(20px,2.5vw,32px);font-weight:700;color:" + brass + ";margin:0 0 14px;'>" + f[0] + "</h2><p style='font-size:16px;color:" + text + ";line-height:1.75;margin:0 0 28px;'>" + f[1] + "</p>" + (f[4] === "none" ? "" : "<a class='row-btn' style='" + btnDark + "'>" + cta2 + "</a>") + "</div>";
          var imgDiv  = "<div class='landing-img' style='min-height:400px;height:100%;overflow:hidden;'><img src=\"" + f[2] + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:400px;'/></div>";
          return "<section style='display:grid;grid-template-columns:1fr 1fr;background:" + (i%2===0?"#ffffff":bone) + ";'>" + (f[3] ? imgDiv+textDiv : textDiv+imgDiv) + "</section>";
        }).join(""))) +
        (brief.skipServicesChecklist ? "" :
        "<section style='background:" + bone + ";padding:80px clamp(24px,6vw,80px);border-top:1px solid rgba(0,0,0,0.08);'>" +
          "<h2 style='font-size:clamp(22px,3vw,32px);font-weight:700;color:" + ink + ";margin:0 0 32px;'>" + (brief.servicesHeading||"What We Do") + "</h2>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:900px;'>" +
            svcs.map(function(s) {
              return "<div style='padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:19px;color:" + text + ";display:flex;align-items:center;gap:10px;'><span style='font-size:19px;color:" + brass + ";font-weight:700;'>✓</span>" + s + "</div>";
            }).join("") +
          "</div>" +
        "</section>") +
        (brief.contentOrder ? "" : (function () {
          // Mirrors landing.js's makeFormSection() -- renders form content
          // (from a Manifest "form" section, or brief.formHeading/formFields
          // set directly) when no curated layout is already placing it
          // inline. Without this, form content on a page with no
          // page-specific curated layout would be captured but never shown
          // -- the common case going forward, since most pages won't have
          // one.
          var hasForm = brief.formHeading || (Array.isArray(brief.formFields) && brief.formFields.length);
          if (!hasForm) return "";
          var formAlreadyPlaced =
            (Array.isArray(brief.featureLayout) && brief.featureLayout.some(function (e) { return e.style === "embedded-form"; })) ||
            (Array.isArray(brief.postClosingLayout) && brief.postClosingLayout.some(function (e) { return e.style === "embedded-form"; }));
          if (formAlreadyPlaced) return "";
          var ffHeading = brief.formHeading || "Get a Quote";
          var ffSubhead = brief.formSubhead || "";
          var ffFields  = (Array.isArray(brief.formFields) && brief.formFields.length) ? brief.formFields : ["Name", "Phone", "Message"];
          var ffCta     = brief.formCta || "Request a Quote";
          return "<section style='background:" + bone + ";padding:56px clamp(24px,6vw,64px);'>" +
              "<div style='max-width:560px;'>" +
              "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + ffHeading + "</h3>" +
              (ffSubhead ? "<p style='font-size:14px;color:" + stone + ";margin:0 0 20px;'>" + ffSubhead + "</p>" : "") +
              ffFields.map(function (lbl) {
                return "<div style='margin-bottom:12px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + lbl + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#ffffff;font-size:14px;color:#bbb;box-sizing:border-box;'>" + lbl + "...</div></div>";
              }).join("") +
              "<button style='padding:12px 28px;background:" + lightCtxBtnBg + ";color:" + lightCtxBtnText + ";font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:6px;'>" + ffCta + "</button>" +
              "</div>" +
            "</section>";
        })()) +
        (brief.contentOrder ? "" : mapSectionHTML) +
        (brief.contentOrder ? "" : closingCtaHTML()) +
        (Array.isArray(brief.postClosingLayout) && brief.postClosingLayout.length > 0 ? renderCuratedFeatureLayoutHTML(brief.postClosingLayout) : "") +
        (brief.contentOrder ? "" : faqHTML);
  })();
}
