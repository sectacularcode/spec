import { nid, mkContainer, mkHeading, mkText, mkButton, mkImageBg, mkSpacer, mkDivider, mkIconList, mkForm, mkTestimonialCarousel, mkAccordion, mkMapSection, mkGoogleMapsWidget, sanitizeUrl } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
import { parseInspoPatterns } from "../utils/patterns.js";
import { bestTextColor } from "../../utils/contrast.js";

// Picks which visual style to render feature rows in. Real inspiration-URL
// signal (from the screenshot-based vision classification — see
// crawl-inspo.js) overrides this when it exists; otherwise falls back to a
// content-density default. Density is the baseline, not an afterthought:
// forcing 10+ real content sections through the same big image-split box
// is a worse layout than a denser style, regardless of what any reference
// site says — split-image only makes sense for a handful of rows with
// real photography behind them.
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

// Scores each landing variant against real content signals already in the
// brief -- no AI call, just field-presence checks, so this stays free and
// instant like generation itself. A field only counts as "real" if the
// person filled it in; blank fields are what Spec would draft, not signal.
// Ties fall back to "A" (scores.A starts with a floor no other variant can
// tie against at zero). Among B/C/D/E, first to strictly exceed the
// current best wins, so the check order (B, C, D, E) is the tie-break.
export function scoreLandingVariants(brief) {
  function real(v) { return typeof v === "string" && v.trim().length > 0; }

  var testimonialCount = [1, 2, 3].filter(function (n) {
    return real(brief["testimonial" + n + "Quote"]) && real(brief["testimonial" + n + "Name"]);
  }).length;

  var featureBodies = [1, 2, 3].map(function (n) { return brief["feature" + n + "Body"]; });
  var featureCount = featureBodies.filter(real).length;
  var avgFeatureLen = featureCount > 0
    ? featureBodies.filter(real).reduce(function (sum, b) { return sum + b.length; }, 0) / featureCount
    : 0;

  var faqCount = Array.isArray(brief.faqItems)
    ? brief.faqItems.filter(function (item) { return item && real(item.question) && real(item.answer); }).length
    : 0;

  var hasForm = real(brief.formHeading) || (Array.isArray(brief.formFields) && brief.formFields.length > 0);
  var hasVideo = real(brief.videoUrl);
  var benefitCount = [1, 2, 3].filter(function (n) { return real(brief["benefit" + n]); }).length;

  var scores = { A: 1, B: 0, C: 0, D: 0, E: 0 };

  // B -- Lead Form: declared form intent, backed by real social proof
  if (hasForm) scores.B += 6;
  scores.B += testimonialCount * 3;

  // C -- Retargeting: feature copy deliberately sparse AND benefits written
  // instead -- both signals together, not just blank features on their own
  // (a brief that's simply empty everywhere should fall to A, not C).
  if (featureCount === 0 && benefitCount > 0) scores.C += 4;
  scores.C += benefitCount * 3;

  // D -- Varied: enough distinct real content to justify cycling treatments
  if (featureCount === 3) scores.D += 6;
  scores.D += faqCount * 2;
  if (hasVideo) scores.D += 4;

  // E -- Narrative: strong social proof plus long-form feature copy
  scores.E += testimonialCount * 3;
  if (avgFeatureLen > 220) scores.E += 5;

  var best = "A", bestScore = scores.A;
  ["B", "C", "D", "E"].forEach(function (v) {
    if (scores[v] > bestScore) { best = v; bestScore = scores[v]; }
  });
  return best;
}

// Landing page builder — three distinct conversion-focused layouts.
//
// Variant A — Awareness/Feature layout (default)
//   Hero with dual CTA → trust strip → alternating feature rows → checklist → closing CTA
//   Best for: brand awareness ads, service pages
//
// Variant B — Lead Capture layout
//   Hero with inline form → social proof/testimonials → feature rows → mid-page CTA → closing CTA
//   Best for: direct response ads, quote requests, high-intent traffic
//
// Variant C — Minimal Retargeting layout
//   Tight hero → 3 outcome bullets → single testimonial → one CTA
//   Best for: retargeting, people who already know the brand, stripped-down conversion push

export function buildLandingPage(colors, brief, inspoContext, variant) {
  // Preview paints photo drop-zones with the accent at ~9% alpha
  // (brass + "18"); mirror that here, with the preview's own guard, so
  // placeholder boxes import in the same tint they were approved in.
  // (Assigned after `accent` is resolved below.)
  var ink      = colors.ink           || "#1A1A1A";
  var accent   = colors.brass         || colors.accent || "#52525B";
  var bone     = colors.bone          || colors.background || "#F2F2F2";
  var warmWhite= colors["warm-white"] || "#FFFFFF";
  // lightSectionBg is ALWAYS literal white -- the preview's alternating
  // feature-row background. The "warm-white" brand token is really the
  // "Text on dark" slot in Style Guide (see brands/index.jsx and
  // style-guide/index.jsx label mappings); using it as a section background
  // meant a brand with a saturated color in that slot (e.g. Push & Pull's
  // green) painted every alternating landing section that color. The
  // preview never had this bug because it hardcodes "#ffffff" for these
  // sections; the export was using warmWhite. Text/heading uses of
  // warmWhite (on dark sections) stay -- that's what the slot is for.
  var lightSectionBg = "#FFFFFF";

  // Text/heading/outline-button color for use on DARK section backgrounds.
  // Cannot be `warmWhite` directly: warm-white is the "Text on dark" slot
  // in Style Guide labeling, but some brands set it to a saturated color
  // (Push & Pull: green) meant for a specific dark-panel design that
  // doesn't apply on the brand-accent closing CTA either. When warmWhite
  // matches the section bg (green heading on green section) it silently
  // renders invisible. bestTextColor picks the first candidate that
  // clears WCAG contrast against the actual section background --
  // warmWhite first (so a brand that DID set a genuine off-white gets
  // it), else literal #FFFFFF (always readable on any dark-enough bg).
  // Applied to closing CTA heading, closing CTA outline button text +
  // border, and any other dark-context heading/body use downstream.
  function lightTextOn(bg) {
    var candidates = [warmWhite, "#FFFFFF"];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c && bestTextColor(bg, c) === c) return c;
    }
    // Explicit fallback: bestTextColor returned the dark fallback,
    // meaning neither light candidate was readable enough. Force white.
    return "#FFFFFF";
  }
  var text     = colors.text          || "#1A1A1A";
  var stone    = colors.stone         || colors.muted || "#666666";
  var dark     = colors.asphalt       || colors["dark-panel"] || "";
  // Guard: some briefs set "asphalt" to the same value as the brand accent
  // (or its hover/deep variant) as a placeholder rather than a deliberate
  // neutral dark tone — that produces brand-green (or whatever-color) dark
  // panels instead of a neutral one. Treat that as "not provided" and fall
  // back to a generic neutral charcoal so landing pages read as neutral by
  // default, not brand-saturated.
  var brassDeepCheck = (colors["brass-deep"] || "").toLowerCase();
  if (!dark || dark.toLowerCase() === accent.toLowerCase() || dark.toLowerCase() === brassDeepCheck) {
    dark = "#1F2328";
  }
  var accentTint = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent + "18" : "#e8f4ea";

  var brandName   = brief.brandName    || "";
  var heroEyebrowText = brief.heroEyebrow != null ? brief.heroEyebrow : brandName;
  var heroH1      = brief.heroHeadline || brief.tagline || "[Landing page headline]";
  var heroSub     = brief.heroSubhead  || brief.hookStatement || "[Specific, direct subheadline]";
  var phoneCta    = brief.phoneCta     || brief.heroCta1 || "Call Us Now";
  var contactCta  = brief.contactCta   || brief.heroCta2 || "Contact Us";
  var closingLine = brief.closingCta   || brief.tagline  || "Ready to get started?";
  // Same fallback sentence the preview uses (landingPreview.js) — the two
  // used to differ, so an approved preview showed real copy while the
  // imported page showed a bracketed placeholder.
  var closingBody = brief.closingBody  || "Reach out today and we'll get back to you within one business day.";

  // Landing pages have two real button contexts: dark hero/closing
  // sections (which have always inverted -- a light button pops against
  // a dark backdrop) and light feature-row sections (which have always
  // used the brand accent directly). A real defined button from the
  // Style Guide's Buttons section applies to both, since it's the
  // person's explicit choice either way; each context keeps its own
  // historical fallback color when no button has been defined yet --
  // only the previously-hardcoded text color becomes computed-safe.
  var definedBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "primary"; }) || (brief.buttons && brief.buttons[0]);
  var secondaryBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "secondary"; });
  var darkCtxBtnBg = (definedBtn && definedBtn.background) || warmWhite;
  var darkCtxBtnText = (definedBtn && definedBtn.textColor) || bestTextColor(darkCtxBtnBg, dark);
  var lightCtxBtnBg = (definedBtn && definedBtn.background) || accent;
  var lightCtxBtnText = (definedBtn && definedBtn.textColor) || bestTextColor(lightCtxBtnBg, text);

  // ── Shared helpers ────────────────────────────────────────────────────────
  function makeOutlineBtn(label, url, color) {
    // color param lets callers pass a computed section-bg-safe color
    // (e.g. from lightTextOn) instead of always using warmWhite, which
    // can silently match the section bg under certain brand palettes.
    var c = color || warmWhite;
    var btn = mkButton(label, "transparent", c, url);
    btn.settings.border_border = "solid";
    btn.settings.border_width  = { unit: "px", top: "2", right: "2", bottom: "2", left: "2", isLinked: true };
    btn.settings.border_color  = c;
    btn.settings.background_color = "transparent";
    return btn;
  }

  function makeDualBtnRow(primaryLabel, secondaryLabel, primaryUrl, secondaryUrl, sectionBg) {
    // Outline button color follows the section bg it's sitting on when no
    // Secondary style has been saved -- when one has, it wins outright,
    // same as definedBtn already does for the primary/filled button.
    // Style Guide's Buttons section previously had zero effect on this
    // button at all, regardless of what was saved, because nothing here
    // ever read brief.buttons for it -- a real gap, not just a labeling
    // issue. Section-bg collision guard below only applies to the
    // fallback path; a person's explicit Secondary choice is trusted
    // as-is, not second-guessed against the section it happens to sit on.
    var outlineColor = (secondaryBtn && secondaryBtn.background) || (sectionBg ? lightTextOn(sectionBg) : warmWhite);
    var primaryBg = darkCtxBtnBg;
    var primaryText = darkCtxBtnText;
    if (sectionBg && String(primaryBg).toLowerCase() === String(sectionBg).toLowerCase()) {
      primaryBg = outlineColor; // usually #FFFFFF
      primaryText = bestTextColor(primaryBg, ink);
    }
    return mkContainer([mkButton(primaryLabel, primaryBg, primaryText, primaryUrl), makeOutlineBtn(secondaryLabel, secondaryUrl, outlineColor)], null, {
      isInner: true, direction: "row", buttonRow: true, gap: "16", padY: "0", padX: "0", center: true
    });
  }

  function makeTrustStrip(bgColor) {
    if (brief.skipTrustStats) return null;
    var items = [
      { stat: brief.trustStat1 || "10+",  label: brief.trustLabel1 || "Years in business" },
      { stat: brief.trustStat2 || "500+", label: brief.trustLabel2 || "Projects completed" },
      { stat: brief.trustStat3 || "98%",  label: brief.trustLabel3 || "Client satisfaction" },
    ];
    var cols = items.map(function(item) {
      return mkContainer([
        mkHeading(item.stat, accent, "h2", { weight: 800, px: 44, align: "center" }),
        mkSpacer(8),
        mkText("<p style='text-align:center'>" + he(item.label) + "</p>", stone),
      ], null, { isInner: true, padY: "48", padX: "32", center: true, grow: "1" });
    });
    return mkContainer(cols, bgColor || bone, { direction: "row", padY: "0", padX: "0", gap: "0" });
  }

  // Shared by makeFeatureRows() and makePostClosingRows() — brief.features
  // (an array) takes priority when present, letting a source with more
  // than 3 real content sections (e.g. a real Manifest export) place all
  // of them. Falls back to the original 3 hardcoded feature1/2/3 fields
  // when brief.features isn't set, so every existing brief keeps working
  // exactly as before.
  function buildFeaturesArray() {
    return Array.isArray(brief.features) && brief.features.length > 0
      ? brief.features.map(function(f, i) {
          return {
            heading: f.heading || "",
            body: f.body || "",
            imgCaption: f.imgCaption || "[Photo placeholder]",
            imageLeft: i % 2 === 1,
          };
        })
      : [
          { heading: brief.feature1Heading || "What We Do Best",     body: brief.feature1Body || "Detail the primary service or capability that sets you apart.", imgCaption: "[Photo placeholder]", imageLeft: false },
          { heading: brief.feature2Heading || "Built for Your Needs", body: brief.feature2Body || "Explain how your approach is tailored to the specific customer.", imgCaption: "[Photo placeholder]", imageLeft: true  },
          { heading: brief.feature3Heading || "Results You Can Count On", body: brief.feature3Body || "Speak to reliability, track record, or outcomes.", imgCaption: "[Photo placeholder]", imageLeft: false },
        ];
  }

  function makeFeatureRows() {
    // Opt-in per brief — most landing pages should NOT get a bordered text
    // box. Only apply it when the brief explicitly asks for it.
    var featureBorder = !!brief.featureTextBorder;
    var features = buildFeaturesArray();

    // Per-section layout override — the real mechanism for hand-curating a
    // page's structure section by section instead of one uniform style for
    // the whole page. Not exposed in the UI yet; brief.featureLayout is set
    // directly for now (see manifestImport.js's brand-id-keyed override,
    // its first real usage) until a proper per-section style picker exists
    // there. When present, this takes over entirely — the uniform
    // density/inspo style selection below is skipped.
    if (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0) {
      return renderFeatureLayout(brief.featureLayout, features);
    }

    // Variant D — a real, reusable template distinct from the uniform
    // A/B/C styles: a fixed, proven visual rhythm (split-right, a centered
    // call-out, split-left, split + button, plain, repeating) applied by
    // position to whatever features exist. Deliberately brand-agnostic —
    // no content, no colors, no brand-specific data of any kind here.
    // What made this pattern real originally was one brand's hand-curated
    // layout (see manifestImport.js) validated against a live page; this
    // is that same visual variety generalized into something any future
    // brief can select, not tied to where the idea first came from.
    // Grouped-header and map-beside are deliberately left out of this
    // generic cycle — both need real judgment about which content is
    // related or which is genuinely about a location, which a positional
    // pattern can't know. Real map/form content is still picked up
    // automatically by makeMapSection()/makeFormSection() regardless.
    //
    // Variant B (Lead Form) gets the same cycle -- its feature rows were
    // falling back to the plain uniform stacked-text style same as
    // everything else, producing the same long monotonous list Variant D
    // was built to fix in the first place. Safe to share: Variant B's own
    // lead-capture form lives in its hero area, separate from this cycle,
    // and "embedded-form" was never one of the cycle's styles to begin
    // with, so there's no duplicate-form risk.
    if (variant === "D" || variant === "B" || variant === "E" || variant === "F") {
      var hasVideo = !!brief.videoUrl;
      var cyclePattern = hasVideo
        ? ["split-right", "centered-cta", "checklist", "video", "split-left", "split-cta-right", "plain"]
        : ["split-right", "centered-cta", "checklist", "split-left", "split-cta-right", "plain"];
      return features.map(function (f, i) {
        var cycleStyle = cyclePattern[i % cyclePattern.length];
        if (cycleStyle === "centered-cta") return renderCenteredCta(f, i);
        if (cycleStyle === "checklist") return renderChecklistRow(f, i);
        if (cycleStyle === "video") return renderVideoRow(f, i);
        if (cycleStyle === "plain") return renderPlainRow(f, i);
        var imageLeft = cycleStyle === "split-left";
        var withButton = cycleStyle === "split-cta-right";
        return renderSplitImage(f, imageLeft, i, withButton);
      });
    }

    var style = selectFeatureRowStyle(inspoContext, features.length);

    if (style === "stacked-text") {
      return features.map(function(f, i) {
        // A native Elementor divider widget, not a hand-sized container —
        // "height" (as opposed to min_height) has zero precedent anywhere
        // else in this codebase's containers, and mkDivider is the real,
        // already-proven way to render a thin accent line.
        var children = [
          mkDivider(accent),
          mkSpacer(14),
          mkHeading(f.heading, ink, "h3", { weight: 700, px: 24 }),
          mkSpacer(10),
          mkText(he(f.body), text),
        ];
        return mkContainer(children, i % 2 === 0 ? lightSectionBg : bone, { padY: "56", padX: "48", full: true });
      });
    }

    if (style === "compact-list") {
      return features.map(function(f, i) {
        // A plain bold number, not a circular fixed-size badge — the
        // circle relied on width/height/border_radius on a container with
        // zero precedent anywhere else in this codebase (every real
        // container width uses percentage units, every real height uses
        // min_height). A number heading uses only primitives already
        // proven throughout the rest of this file.
        var numberCol = mkContainer([
          mkHeading(String(i + 1) + ".", accent, "h4", { weight: 700, px: 22 }),
        ], null, { isInner: true, padY: "0", padX: "0" });

        var textCol = mkContainer([
          mkHeading(f.heading, ink, "h4", { weight: 700, px: 18 }),
          mkSpacer(6),
          mkText(he(f.body), text),
        ], null, { isInner: true, padY: "0", padX: "0", grow: "1" });

        var row = mkContainer([numberCol, textCol], null, { direction: "row", padY: "28", padX: "32", gap: "20", full: true });
        row.settings.flex_align_items = "flex-start";
        row.settings.border_border = "solid";
        row.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "1", left: "0", isLinked: false };
        row.settings.border_color = "#DDE0E6";
        return row;
      });
    }

    // "split-image" — the original default style
    return features.map(function(f, i) {
      var innerChildren = [
        mkHeading(f.heading, accent, "h2", { weight: 700, px: 34 }),
        mkSpacer(16),
        mkText(he(f.body), text),
        mkSpacer(24),
        mkButton(contactCta, lightCtxBtnBg, lightCtxBtnText, brief.heroSecondaryUrl),
      ];
      // Always-on: content lives inside an inner box with min_height 508px,
      // matching CS Repair's confirmed production template. This is what
      // makes rows come out uniform height regardless of how much or how
      // little text lands in any individual row — the min_height on this
      // inner box forces the whole text column to at least 508px, so the
      // image column stretches to match, so every row comes out consistent.
      // The visible border is still opt-in via brief.featureTextBorder.
      var innerBox = mkContainer(innerChildren, null, { isInner: true, padY: "30", padX: "30", full: true });
      innerBox.settings.min_height = { unit: "px", size: 508 };
      innerBox.settings.min_height_tablet = { unit: "custom", size: "auto" };
      innerBox.settings.flex_justify_content = "center";
      innerBox.settings.flex_align_items = "flex-start";
      if (featureBorder) {
        innerBox.settings.border_border = "solid";
        innerBox.settings.border_width = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
        innerBox.settings.border_color = accent;
      }
      var textCol = mkContainer([innerBox], null, { isInner: true, padY: "30", padX: "30", width: 50, full: true });
      var imgCol  = mkImageBg(f.imgCaption, { width: 50, bg: accentTint });
      var cols    = f.imageLeft ? [imgCol, textCol] : [textCol, imgCol];
      var row     = mkContainer(cols, i % 2 === 0 ? lightSectionBg : bone, { direction: "row", padY: "0", padX: "0", gap: "0", full: true });
      return row;
    });
  }

  // A second curated layout slot, rendered AFTER the closing CTA and
  // before the FAQ — for content that genuinely belongs there rather than
  // with the main feature rows (confirmed real case: AFS's pricing/form
  // section ended up positioned after the closing CTA, not before it, in
  // the actual reviewed-and-approved page). Empty/absent by default; only
  // renders when brief.postClosingLayout is explicitly set.
  function makePostClosingRows() {
    if (!Array.isArray(brief.postClosingLayout) || brief.postClosingLayout.length === 0) return [];
    return renderFeatureLayout(brief.postClosingLayout, buildFeaturesArray());
  }

  // Renders a curated, per-section layout (brief.featureLayout) instead of
  // one uniform style for every row. Each entry names which feature
  // index(es) it covers and which style to use — "grouped-header" is the
  // one case that consumes more than one index per entry (several features
  // sharing one heading), everything else is a single feature per entry.
  function renderFeatureLayout(layout, features) {
    var rendered = [];
    layout.forEach(function (entry, rowIdx) {
      // midcta needs no feature content of its own -- checked before the
      // items/indices guard below, matching buildPreviewHTML.js's
      // renderCuratedFeatureLayoutHTML ordering exactly.
      if (entry.style === "midcta") {
        rendered.push(renderMidCta(rowIdx));
        return;
      }

      var items = (entry.indices || []).map(function (i) { return features[i]; }).filter(Boolean);
      if (!items.length) return;

      if (entry.style === "grouped-header") {
        rendered.push(renderGroupedHeader(entry.header || "", items));
      } else if (entry.style === "centered-cta") {
        rendered.push(renderCenteredCta(items[0], rowIdx));
      } else if (entry.style === "embedded-form") {
        rendered.push(renderEmbeddedForm(items[0]));
      } else if (entry.style === "map-beside") {
        rendered.push(renderMapBeside(items[0], rowIdx));
      } else if (entry.style === "split-right" || entry.style === "split-left") {
        rendered.push(renderSplitImage(items[0], entry.style === "split-left", rowIdx, false));
      } else if (entry.style === "split-cta-right" || entry.style === "split-cta-left") {
        rendered.push(renderSplitImage(items[0], entry.style === "split-cta-left", rowIdx, true));
      } else if (entry.style === "checklist") {
        rendered.push(renderChecklistRow(items[0], rowIdx));
      } else if (entry.style === "video") {
        rendered.push(renderVideoRow(items[0], rowIdx));
      } else {
        rendered.push(renderPlainRow(items[0], rowIdx));
      }
    });
    return rendered;
  }

  // Image-split row, explicit side (not alternating by index) and an
  // optional CTA button in the text column — used for split-right/
  // split-left/split-cta-right/split-cta-left in a curated featureLayout.
  function renderSplitImage(f, imageLeft, rowIdx, withButton) {
    var innerChildren = [
      mkHeading(f.heading, accent, "h2", { weight: 700, px: 30 }),
      mkSpacer(14),
      mkText(he(f.body), text),
    ];
    if (withButton) {
      innerChildren.push(mkSpacer(20));
      innerChildren.push(mkButton(contactCta, lightCtxBtnBg, lightCtxBtnText, brief.heroSecondaryUrl));
    }
    var innerBox = mkContainer(innerChildren, null, { isInner: true, padY: "30", padX: "30", full: true });
    innerBox.settings.min_height = { unit: "px", size: 420 };
    innerBox.settings.min_height_tablet = { unit: "custom", size: "auto" };
    innerBox.settings.flex_justify_content = "center";
    innerBox.settings.flex_align_items = "flex-start";
    var textCol = mkContainer([innerBox], null, { isInner: true, padY: "30", padX: "30", width: 50, full: true });
    var imgCol  = mkImageBg(f.imgCaption, { width: 50, bg: accentTint });
    var cols    = imageLeft ? [imgCol, textCol] : [textCol, imgCol];
    return mkContainer(cols, rowIdx % 2 === 0 ? lightSectionBg : bone, { direction: "row", padY: "0", padX: "0", gap: "0", full: true });
  }

  // Single centered block with a real contact button — for content that's
  // making a point rather than describing a service, where a photo or a
  // service-list treatment doesn't fit as naturally.
  function renderCenteredCta(f, rowIdx) {
    var body = mkText("<p style='text-align:center'>" + he(f.body) + "</p>", text);
    return mkContainer([
      mkHeading(f.heading, ink, "h3", { weight: 700, px: 32, align: "center" }),
      body,
      mkButton(contactCta, lightCtxBtnBg, lightCtxBtnText, brief.heroSecondaryUrl),
    ], rowIdx % 2 === 0 ? lightSectionBg : bone, { padY: "72", center: true });
  }

  // A secondary CTA woven mid-list -- needs no feature content of its own,
  // just the brief's existing phone/contact CTA fields. Extracted from
  // Variant E's inline makeMidCtaE() (see below) so a curated featureLayout
  // can also place one via renderFeatureLayout, matching what
  // buildPreviewHTML.js's "midcta" style already renders in preview.
  // rowIdx isn't used for alternating background here (always warm white,
  // matching Variant E's original), but is accepted for signature
  // consistency with the other render* functions.
  function renderMidCta(rowIdx) {
    return mkContainer([
      mkHeading(phoneCta, accent, "h2", { weight: 800, px: 32, align: "center" }),
      mkSpacer(8),
      mkText("<p style='text-align:center'>" + he(brief.midCtaText || "Questions before you reach out? " + contactCta + " and we'll get back to you within one business day.") + "</p>", stone),
    ], lightSectionBg, { padY: "60", center: true });
  }

  // Several features sharing one heading (e.g. two related services under
  // "Our Services") — a real shared-header grouping, not a coincidence of
  // adjacent rows.
  function renderGroupedHeader(header, items) {
    var colWidth = Math.floor(100 / items.length);
    var cols = items.map(function (item) {
      return mkContainer([
        mkHeading(item.heading, ink, "h4", { weight: 700, px: 18 }),
        mkText(he(item.body), text),
      ], null, { isInner: true, padY: "0", padX: "0", width: colWidth, grow: "1" });
    });
    return mkContainer([
      mkHeading(header, accent, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkContainer(cols, null, { direction: "row", gap: "32", padY: "0", padX: "0", isInner: true, full: true }),
    ], lightSectionBg, { padY: "80", padX: "48" });
  }

  // Real Elementor Pro form widget embedded mid-page (same mkForm() used
  // for Variant B's lead-capture form) — for content that's naturally
  // asking the visitor to reach out (pricing, quotes), not just describing
  // a service.
  function renderEmbeddedForm(f) {
    var fHeading  = f.heading || brief.formHeading || "Get a Quote";
    var fSubhead  = f.body || brief.formSubhead || "";
    var fFields   = (Array.isArray(brief.formFields) && brief.formFields.length) ? brief.formFields : ["Name", "Phone", "Message"];
    var fCtaLabel = brief.formCta || "Request a Quote";
    var formWidget = mkForm(fFields, fCtaLabel, { formName: (brandName || "Site") + " Quote Request" });
    return mkContainer([
      mkHeading(fHeading, ink, "h3", { weight: 700, px: 26 }),
      mkSpacer(10),
      fSubhead ? mkText(he(fSubhead), stone) : null,
      mkSpacer(20),
      formWidget,
    ].filter(Boolean), bone, { padY: "80", padX: "48" });
  }

  // Text beside a real, native Elementor Google Maps widget when a real
  // address exists (brief.mapAddress) — confirmed working structure from a
  // real exported page. Falls back to a labeled placeholder when there's
  // no real address to build a working map from — never invents one.
  function renderMapBeside(f, rowIdx) {
    var innerChildren = [
      mkHeading(f.heading, accent, "h2", { weight: 700, px: 30 }),
      mkSpacer(14),
      mkText(he(f.body), text),
    ];
    var innerBox = mkContainer(innerChildren, null, { isInner: true, padY: "30", padX: "30", full: true });
    innerBox.settings.flex_justify_content = "center";
    innerBox.settings.flex_align_items = "flex-start";
    var textCol = mkContainer([innerBox], null, { isInner: true, padY: "30", padX: "30", width: 50, full: true });
    // A pinned map implies "come to this exact spot" -- wrong for a
    // service-area business with no single storefront (mode, 1.2.0). Same
    // rule mkMapSection applies to the auto map section below; falls back
    // to the existing "no real address" placeholder image, unchanged.
    var mapWidget = brief.mapMode === "service_area" ? null : mkGoogleMapsWidget(brief.mapAddress, { isInner: false });
    var mapCol = mapWidget
      ? mkContainer([mapWidget], null, { isInner: true, padY: "0", padX: "0", width: 50, full: true })
      : mkImageBg("[Map placeholder]", { width: 50, bg: bone }); // preview's map placeholder is bone
    return mkContainer([textCol, mapCol], rowIdx % 2 === 0 ? lightSectionBg : bone, { direction: "row", padY: "0", padX: "0", gap: "0", full: true });
  }

  // A single clean text block, no image, no divider — for content the
  // uniform styles would otherwise handle fine, kept as-is inside a
  // curated layout.
  function renderPlainRow(f, rowIdx) {
    return mkContainer([
      mkHeading(f.heading, ink, "h3", { weight: 700, px: 30 }),
      mkSpacer(10),
      mkText(he(f.body), text),
    ], rowIdx % 2 === 0 ? lightSectionBg : bone, { padY: "56", padX: "48" });
  }

  // A heading with a short checkmark list beneath it — real native
  // Elementor icon-list widget (mkIconList, already proven and in
  // production use elsewhere in this file), not a hand-built container.
  // The list items come from splitting this feature's own body text into
  // clauses, since a curated layout has no separate "list items" field to
  // draw from — this is a real limitation for very short or single-clause
  // bodies, which will show as a one-item list.
  function renderChecklistRow(f, rowIdx) {
    var clauses = (f.body || "").split(/\.\s+/).map(function (s) { return s.trim().replace(/\.$/, ""); }).filter(function (s) { return s.length > 0; });
    if (clauses.length === 0) clauses = [f.body || ""];
    return mkContainer([
      mkHeading(f.heading, ink, "h3", { weight: 700, px: 30 }),
      mkSpacer(16),
      mkIconList(clauses, accent, text, { fontSize: 19, iconSize: 19 }),
    ], rowIdx % 2 === 0 ? lightSectionBg : bone, { padY: "56", padX: "48" });
  }

  // A real native Elementor Video widget — UNVERIFIED against an actual
  // Elementor render, unlike every other widget helper in this file. The
  // settings shape (video_type / youtube_url) is Elementor's own
  // long-documented, widely-corroborated control naming, but "widely
  // documented" is a different confidence level than "confirmed against a
  // real export," which is the bar every other widget here was held to
  // (see mkGoogleMapsWidget). Test this specifically before relying on it.
  // Only renders when a real video URL exists — never a placeholder embed.
  function renderVideoRow(f, rowIdx) {
    var safeVideoUrl = sanitizeUrl(brief.videoUrl);
    // sanitizeUrl() returns "#" for anything unsafe (or absent) -- a
    // meaningless value for a video widget, so treat it the same as "no
    // video" rather than embedding a broken/dangerous URL.
    if (!brief.videoUrl || safeVideoUrl === "#") return renderPlainRow(f, rowIdx);
    var videoWidget = {
      id: nid(), elType: "widget", widgetType: "video",
      settings: { video_type: "youtube", youtube_url: safeVideoUrl },
      elements: [],
    };
    var textCol = mkContainer([
      mkHeading(f.heading, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(10),
      mkText(he(f.body), text),
    ], null, { isInner: true, padY: "30", padX: "30", width: 50, full: true });
    var videoCol = mkContainer([videoWidget], null, { isInner: true, padY: "0", padX: "0", width: 50, full: true });
    return mkContainer([textCol, videoCol], rowIdx % 2 === 0 ? lightSectionBg : bone, { direction: "row", padY: "0", padX: "0", gap: "0", full: true });
  }

  function makeClosingCta(bg) {
    // Background follows the variant's own preview: brass/accent for
    // A/D/E/F (the preview's va-cta section), dark only for B. The export
    // used to hardcode dark for every variant, so the approved green
    // closing section imported as a near-black one.
    var sectionBg = bg || accent;
    var textOnBg = lightTextOn(sectionBg);
    return mkContainer([
      mkHeading(closingLine, textOnBg, "h2", { weight: 700, px: 40, align: "center" }),
      mkText("<p style='text-align:center'>" + he(closingBody) + "</p>", textOnBg === "#FFFFFF" ? "rgba(255,255,255,0.8)" : textOnBg),
      makeDualBtnRow(phoneCta, contactCta, brief.heroPrimaryUrl, brief.heroSecondaryUrl, sectionBg),
    ], sectionBg, { padY: "80", center: true });
  }

  // Optional FAQ section — accordion widget, staged with generic placeholder
  // Q&As until real content lands in the brief (brief.faqItems: array of
  // {question, answer}). Sits at the very bottom of the page, after the
  // closing CTA.
  function makeFaqSection() {
    var faqItems = Array.isArray(brief.faqItems) && brief.faqItems.length ? brief.faqItems : [
      { question: "[FAQ question one]",   answer: "[Answer, in brand voice]" },
      { question: "[FAQ question two]",   answer: "[Answer, in brand voice]" },
      { question: "[FAQ question three]", answer: "[Answer, in brand voice]" },
      { question: "[FAQ question four]",  answer: "[Answer, in brand voice]" },
      { question: "[FAQ question five]",  answer: "[Answer, in brand voice]" },
    ];
    return mkContainer([
      mkHeading(brief.faqHeading || "Frequently Asked Questions", accent, "h2", { weight: 800, px: 36 }),
      mkSpacer(28),
      mkAccordion(faqItems, { titleColor: ink, activeColor: accent, iconColor: accent, contentColor: stone, borderColor: "#DDE0E6" }),
    ], lightSectionBg, { padY: "80" });
  }

  // Optional map/location section — renders only when the brief supplies a
  // real address or map link (from a Manifest "map" block, or brief.mapAddress
  // / brief.mapUrl set directly). Sits after social proof and before the
  // closing CTA, matching the order Manifest's sample export uses. Returns
  // null when there's nothing to show — callers must .filter(Boolean).
  function makeMapSection() {
    if (!brief.mapAddress && !brief.mapUrl) return null;
    // If a curated featureLayout already places a real map inline (see
    // renderMapBeside), the standalone section would just duplicate it —
    // skip.
    var mapAlreadyPlaced = Array.isArray(brief.featureLayout) && brief.featureLayout.some(function (e) { return e.style === "map-beside"; });
    if (mapAlreadyPlaced) return null;
    // Previously this branch reimplemented a simplified version of
    // mkMapSection by hand (heading + bare embed) whenever a structured
    // address existed, which meant the "Get Directions" button never
    // rendered at all in that case -- only the no-address fallback path
    // below ever got one. Delegating to mkMapSection for both cases fixes
    // that and adds mode/heading/button-label support (all from real
    // Manifest copy when present) in one place instead of two.
    return mkMapSection(brief.mapAddress, brief.mapUrl, colors, {
      heading: brief.mapHeading,
      buttonLabel: brief.mapButtonLabel,
      mode: brief.mapMode,
      phone: brief.mapPhone,
      hours: brief.mapHours,
      buttonColors: { background: lightCtxBtnBg, textColor: lightCtxBtnText },
    });
  }

  // Optional lead-capture form section — renders only when the brief
  // carries real form content (from a Manifest "form" section, or
  // brief.formHeading/formFields set directly) AND no curated layout is
  // already placing it inline (see renderEmbeddedForm) — this is the
  // general-case fallback for any page that doesn't have a page-specific
  // curated layout, which is the common case: most pages won't have one.
  // Without this, form content from a real "type: form" section would be
  // captured by the importer but never actually rendered anywhere on a
  // page using the uniform/default styles. Sits after the feature rows,
  // before the map/closing sections.
  function makeFormSection() {
    if (!brief.formHeading && !(Array.isArray(brief.formFields) && brief.formFields.length)) return null;
    var formAlreadyPlaced =
      (Array.isArray(brief.featureLayout) && brief.featureLayout.some(function (e) { return e.style === "embedded-form"; })) ||
      (Array.isArray(brief.postClosingLayout) && brief.postClosingLayout.some(function (e) { return e.style === "embedded-form"; }));
    if (formAlreadyPlaced) return null;

    var fHeading = brief.formHeading || "Get a Quote";
    var fSubhead = brief.formSubhead || "";
    var fFields  = (Array.isArray(brief.formFields) && brief.formFields.length) ? brief.formFields : ["Name", "Phone", "Message"];
    var fCtaLabel = brief.formCta || "Request a Quote";
    var formWidget = mkForm(fFields, fCtaLabel, { formName: (brandName || "Site") + " Quote Request" });
    return mkContainer([
      mkHeading(fHeading, ink, "h3", { weight: 700, px: 34 }),
      mkSpacer(10),
      fSubhead ? mkText(he(fSubhead), stone) : null,
      mkSpacer(20),
      formWidget,
    ].filter(Boolean), bone, { padY: "80", padX: "48" });
  }

  // ── VARIANT E — Narrative / Trust-First layout ────────────────────────────
  // A genuinely different structure from Awareness, not just a different
  // cycle of styles -- informed by real research on awareness-stage pages:
  // social proof moved up near the top instead of buried at the bottom,
  // a secondary CTA woven in every few sections instead of just once at
  // the very end, and the same proven variety cycle for feature rows
  // (reused from Variant D/B, not reinvented). Every piece here is a
  // reuse of an already-built, already-tested block -- the hero, the
  // trust strip, the testimonial carousel (Variant B's exact pattern),
  // the mid-page CTA (Variant B's exact pattern) -- just arranged
  // differently and repeated where Variant B only uses it once.
  if (variant === "E") {
    var heroEyebrowE = mkHeading(heroEyebrowText, warmWhite, "h6", { eyebrow: true, align: "center" });
    var heroH1ElE    = mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 58, align: "center" });
    var heroSubElE   = mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)");
    heroSubElE.settings.text_align = heroSubElE.settings.text_align_tablet = heroSubElE.settings.text_align_mobile = "center";
    var heroE = mkContainer(
      [heroEyebrowE, mkSpacer(16), heroH1ElE, mkSpacer(20), heroSubElE, mkSpacer(32), makeDualBtnRow(phoneCta, contactCta, brief.heroPrimaryUrl, brief.heroSecondaryUrl)],
      dark, { padY: "100", center: true }
    );

    // Social proof moved up, right after the trust strip -- real research
    // on awareness-stage pages consistently flags trust cues appearing
    // only near the bottom as a missed opportunity; cold traffic decides
    // whether to keep reading well before they'd ever scroll that far.
    var testimonialsE = [
      { quote: brief.testimonial1Quote || "[Client testimonial — specific result or outcome]", name: brief.testimonial1Name || "Client Name", title: brief.testimonial1Title || "Title, Company" },
      { quote: brief.testimonial2Quote || "[Second testimonial — different benefit angle]",    name: brief.testimonial2Name || "Client Name", title: brief.testimonial2Title || "Title, Company" },
      { quote: brief.testimonial3Quote || "[Third testimonial — reliability or speed]",        name: brief.testimonial3Name || "Client Name", title: brief.testimonial3Title || "Title, Company" },
    ];
    var testimonialsSectionE = mkContainer([
      mkHeading(brief.testimonialHeading || "What Our Customers Are Saying:", warmWhite, "h2", { weight: 800, px: 32, align: "center" }),
      mkTestimonialCarousel(testimonialsE, { textColor: warmWhite, nameColor: warmWhite, jobColor: "rgba(255,255,255,0.7)" }),
    ], dark, { padY: "80", center: true });

    // A fresh element each call -- not a single reused block -- since
    // this gets interleaved more than once and every Elementor element
    // needs its own unique id. Delegates to the shared renderMidCta (see
    // above) rather than duplicating the same markup a second time.
    function makeMidCtaE() {
      return renderMidCta();
    }

    // Same variety cycle as Variant D/B, with a secondary CTA woven in
    // every third row rather than saved for a single push at the very
    // end -- real research on feature-heavy pages consistently
    // recommends this instead of making cold traffic scroll to the
    // bottom before they get another chance to act.
    var featureRowsE = makeFeatureRows();
    var interleavedE = [];
    featureRowsE.forEach(function (row, i) {
      interleavedE.push(row);
      if ((i + 1) % 3 === 0 && i < featureRowsE.length - 1) interleavedE.push(makeMidCtaE());
    });

    var checklistItemsE = brief.servicesList || ["Reduced overall cost", "Reduced downtime", "Proactive planning", "Expert team", "Fast response time", "Tailored reporting", "Direct billing", "Add more below..."];
    var halfE = Math.ceil(checklistItemsE.length / 2);
    var checklistSectionE = brief.skipServicesChecklist ? null : mkContainer([
      mkHeading(brief.servicesHeading || "What We Do", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(24), mkDivider(accent), mkSpacer(32),
      mkContainer([
        mkContainer([mkIconList(checklistItemsE.slice(0, halfE), accent, text, { fontSize: 19, iconSize: 19 })], null, { isInner: true, width: 50, padY: "0", padX: "0" }),
        mkContainer([mkIconList(checklistItemsE.slice(halfE), accent, text, { fontSize: 19, iconSize: 19 })], null, { isInner: true, width: 50, padY: "0", padX: "0" }),
      ], null, { direction: "row", gap: "48", padY: "0", isInner: true, full: true }),
    ], lightSectionBg, { padY: "80" });

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page (Narrative)", type: "page", page_settings: {},
      content: [heroE, makeTrustStrip(), testimonialsSectionE, ...interleavedE, checklistSectionE, makeFormSection(), makeMapSection(), makeClosingCta(), ...makePostClosingRows(), makeFaqSection()].filter(Boolean),
    };
  }

  // ── VARIANT F — Location: headline + address/hours/map combined into one
  // light section instead of a separate dark hero, map beside the info
  // instead of further down the page. Confirmed real reference (LubeZone's
  // own location pages), July 2026 -- built for pages with a real business
  // address where the location info IS the hero, not a separate section.
  // Everything below the top section reuses the exact same proven sections
  // as Variant D (feature-row cycling, conditional testimonial carousel,
  // conditional services checklist) -- only the top section and the
  // now-redundant standalone map section differ.
  if (variant === "F") {
    // Variant F hero -- rebuilt to match the approved Bethlehem live page
    // (July 2026): address + hours as a real supporting paragraph under
    // the H1 rather than tiny stacked lines, buttons in a wrapping row
    // with a visible gap, map column with proper padding so it doesn't
    // touch the section edge and reads balanced next to the text column.
    // Section outer gets its own padding so the map isn't edge-to-edge.
    var heroFH1 = mkHeading(heroH1, ink, "h1", { weight: 800, px: 40 });

    // Address as one flowing sentence in a paragraph -- matches Bethlehem
    // exactly ("Our shop is at 850 13th Ave, Bethlehem, PA 18018, and our
    // mobile trucks reach ..."). If a brief provides an explicit
    // heroSubhead/hookStatement, we use that. Otherwise auto-compose from
    // mapAddress + mapPhone into a natural sentence.
    var heroFParagraphHtml = "";
    if (brief.heroSubhead || brief.hookStatement) {
      heroFParagraphHtml = "<p>" + he(brief.heroSubhead || brief.hookStatement) + "</p>";
    } else if (brief.mapAddress) {
      var addrLine = "Our shop is at " + he(brief.mapAddress);
      if (brief.mapPhone) {
        addrLine += ". Call " + he(brief.mapPhone) + " to dispatch or schedule.";
      } else {
        addrLine += ".";
      }
      heroFParagraphHtml = "<p>" + addrLine + "</p>";
    }
    var heroFParagraph = heroFParagraphHtml ? mkText(heroFParagraphHtml, ink) : null;

    // Hours as its own line with a bold label prefix -- matches Bethlehem
    // exactly ("**Hours:** Monday through Friday..."). Only rendered when
    // real hours data is present.
    var heroFHoursHtml = brief.mapHours ? "<p><strong>Hours:</strong> " + he(brief.mapHours) + "</p>" : "";
    var heroFHoursText = heroFHoursHtml ? mkText(heroFHoursHtml, ink) : null;

    // Contact Us needs a real on-page form to jump to -- checked here,
    // independent of calling makeFormSection() itself, using the exact
    // same condition it uses internally, so the button only appears when
    // there's actually somewhere for it to go.
    var heroFHasForm = !!(brief.formHeading || (Array.isArray(brief.formFields) && brief.formFields.length));

    // Buttons -- primary call, outline email, outline contact. Same set
    // as the real reference; always rendered so the layout is visible
    // before real data lands (phone/email/form). Outline buttons use the
    // brand accent (ink) for text/border so they read as green on the
    // light bone hero, matching the Bethlehem-approved styling. The
    // primary Call button uses the accent bg + white text.
    var heroFButtons = [];
    var heroFCallLabel = brief.mapPhone ? ("Call now: " + brief.mapPhone) : phoneCta;
    heroFButtons.push(mkButton(
      heroFCallLabel,
      lightCtxBtnBg, lightCtxBtnText,
      brief.mapPhone ? sanitizeUrl("tel:" + String(brief.mapPhone).replace(/\D/g, "")) : (brief.heroPrimaryUrl || "#")
    ));
    var heroFEmailBtn = mkButton("Email Us", "transparent", ink);
    heroFEmailBtn.settings.border_border = "solid";
    heroFEmailBtn.settings.border_width = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
    heroFEmailBtn.settings.border_color = ink;
    heroFEmailBtn.settings.link = { url: brief.mapEmail ? sanitizeUrl("mailto:" + brief.mapEmail) : "#" };
    heroFButtons.push(heroFEmailBtn);
    var heroFContactBtn = mkButton("Contact Us", "transparent", ink);
    heroFContactBtn.settings.border_border = "solid";
    heroFContactBtn.settings.border_width = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
    heroFContactBtn.settings.border_color = ink;
    heroFContactBtn.settings.link = { url: heroFHasForm ? "#contact-form" : "#" };
    heroFButtons.push(heroFContactBtn);
    // gap 16px + flex-wrap so the three buttons stay separated on a single
    // row at desktop and wrap cleanly at narrower widths.
    var heroFButtonRow = mkContainer(heroFButtons, null, { isInner: true, direction: "row", buttonRow: true, gap: "16", padY: "0", padX: "0" });
    heroFButtonRow.settings.flex_wrap = "wrap";
    heroFButtonRow.settings.flex_align_items = "center";

    // Left column stack: H1 -> paragraph -> hours -> buttons. Spacer sizes
    // set to Bethlehem's approved rhythm (24 between H1 and paragraph, 12
    // between paragraph and hours, 32 before the button row). Container
    // gap is 0 so ONLY the spacers control the rhythm -- previously the
    // default 20px container gap was stacking on top of every spacer.
    var heroFLeftChildren = [heroFH1];
    if (heroFParagraph) { heroFLeftChildren.push(mkSpacer(24)); heroFLeftChildren.push(heroFParagraph); }
    if (heroFHoursText) { heroFLeftChildren.push(mkSpacer(12)); heroFLeftChildren.push(heroFHoursText); }
    if (heroFButtonRow)  { heroFLeftChildren.push(mkSpacer(heroFHoursText || heroFParagraph ? 32 : 24)); heroFLeftChildren.push(heroFButtonRow); }

    var heroFLeftCol = mkContainer(heroFLeftChildren, null, { isInner: true, width: 50, padY: "72", padX: "56", gap: "0" });
    heroFLeftCol.settings.flex_justify_content = "center";

    // Map column: real padding on all sides so the map floats within the
    // section instead of touching the edges. min_height bumped to 460px
    // (from 340) so it reads balanced next to the taller text column,
    // and a small border-radius matches the Bethlehem-approved look.
    var heroFMapWidget = mkGoogleMapsWidget(brief.mapAddress, { height: 460 }) || mkImageBg("Map", { width: 100, bg: bone });
    var heroFRightCol = mkContainer([heroFMapWidget], null, { isInner: true, width: 50, padY: "72", padX: "56" });
    heroFRightCol.settings.flex_justify_content = "center";

    // Section outer gets bone bg + no vertical pad (columns own their own
    // padding). Widened to 1357px (from mkContainer's 1160 default) to
    // match the approved wider look -- confirmed against a real edited
    // export (Freeway Fleet Services, July 2026). Scoped to Variant F only
    // via maxWidth so Home/About/Contact/etc. keep the standard 1160.
    var heroF = mkContainer([heroFLeftCol, heroFRightCol], bone, { direction: "row", padY: "0", padX: "0", gap: "0", maxWidth: 1357 });

    // Testimonials -- same conditional carousel as Variant A/D: only when
    // real testimonial content exists, never fabricated placeholder quotes.
    // Heading added above the carousel (confirmed against a real edited
    // export, July 2026) -- every variant using mkTestimonialCarousel was
    // missing a section title; scoped to F only since that's what was
    // actually reviewed.
    var testimonialsSectionF = brief.testimonial1Name ? mkContainer([
      mkHeading(brief.testimonialHeading || "What Our Customers Are Saying:", warmWhite, "h2", { weight: 800, px: 32, align: "center" }),
      mkTestimonialCarousel([
        { quote: brief.testimonial1Quote || "", name: brief.testimonial1Name || "", title: brief.testimonial1Title || "" },
        { quote: brief.testimonial2Quote || "", name: brief.testimonial2Name || "", title: brief.testimonial2Title || "" },
        { quote: brief.testimonial3Quote || "", name: brief.testimonial3Name || "", title: brief.testimonial3Title || "" },
      ].filter(function (t) { return t.quote || t.name; }), { textColor: warmWhite, nameColor: warmWhite, jobColor: "rgba(255,255,255,0.7)" }),
    ], dark, { padY: "80", center: true }) : null;

    // Services checklist -- same pattern as Variant A/D, including the
    // skipServicesChecklist auto-hide for Manifest imports.
    var checklistItemsF = brief.servicesList || ["Reduced overall cost", "Reduced downtime", "Proactive planning", "Expert team", "Fast response time", "Tailored reporting", "Direct billing", "Add more below..."];
    var halfF = Math.ceil(checklistItemsF.length / 2);
    var checklistSectionF = brief.skipServicesChecklist ? null : mkContainer([
      mkHeading(brief.servicesHeading || "What We Do", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(24), mkDivider(accent), mkSpacer(32),
      mkContainer([
        mkContainer([mkIconList(checklistItemsF.slice(0, halfF), accent, text, { fontSize: 19, iconSize: 19 })], null, { isInner: true, width: 50, padY: "0", padX: "0" }),
        mkContainer([mkIconList(checklistItemsF.slice(halfF), accent, text, { fontSize: 19, iconSize: 19 })], null, { isInner: true, width: 50, padY: "0", padX: "0" }),
      ], null, { direction: "row", gap: "48", padY: "0", isInner: true, full: true }),
    ], lightSectionBg, { padY: "80" });

    // Give the form section a real anchor ID so "Contact Us" above
    // actually has somewhere to jump to -- matches the reference's own
    // #contact-form pattern exactly.
    var formSectionF = makeFormSection();
    if (formSectionF) formSectionF.settings._element_id = "contact-form";

    return {
      version: "0.4", title: he(brandName || "Site") + (brief.mapCity ? " — " + he(brief.mapCity) : "") + " — Landing Page (Location)", type: "page", page_settings: {},
      // No makeMapSection() here -- the map is already part of heroF, a
      // second one further down would just duplicate it.
      content: [heroF, testimonialsSectionF, ...makeFeatureRows(), checklistSectionF, formSectionF, makeClosingCta(), ...makePostClosingRows(), makeFaqSection()].filter(Boolean),
    };
  }

  // ── VARIANT A — Awareness / Feature layout ────────────────────────────────
  if (variant !== "B" && variant !== "C" && variant !== "E") {
    var heroEyebrow = mkHeading(heroEyebrowText, warmWhite, "h6", { eyebrow: true, align: "center" });
    var heroH1El    = mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 58, align: "center" });
    var heroSubEl   = mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)");
    heroSubEl.settings.text_align = heroSubEl.settings.text_align_tablet = heroSubEl.settings.text_align_mobile = "center";

    var heroA = mkContainer(
      [heroEyebrow, mkSpacer(16), heroH1El, mkSpacer(20), heroSubEl, mkSpacer(32), makeDualBtnRow(phoneCta, contactCta, brief.heroPrimaryUrl, brief.heroSecondaryUrl)],
      dark, { padY: "100", center: true }
    );

    var checklistItems = brief.servicesList || ["Reduced overall cost", "Reduced downtime", "Proactive planning", "Expert team", "Fast response time", "Tailored reporting", "Direct billing", "Add more below..."];
    var half = Math.ceil(checklistItems.length / 2);
    // Skippable per brief — set when the checklist would only show generic
    // placeholder items with no real content behind them (e.g. no
    // brief.servicesList and the brief's source format has no equivalent
    // concept, like a Manifest import), rather than shipping fabricated
    // "Service one, Service two" text on a real page.
    var checklistSection = brief.skipServicesChecklist ? null : mkContainer([
      mkHeading(brief.servicesHeading || "What We Do", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(24), mkDivider(accent), mkSpacer(32),
      mkContainer([
        mkContainer([mkIconList(checklistItems.slice(0, half), accent, text, { fontSize: 19, iconSize: 19 })], null, { isInner: true, width: 50, padY: "0", padX: "0" }),
        mkContainer([mkIconList(checklistItems.slice(half), accent, text, { fontSize: 19, iconSize: 19 })], null, { isInner: true, width: 50, padY: "0", padX: "0" }),
      ], null, { direction: "row", gap: "48", padY: "0", isInner: true, full: true }),
    ], lightSectionBg, { padY: "80" });

    // Testimonials — same Testimonial Carousel widget variant B/E already
    // use. Confirmed real gap, July 2026: A (and D, which reuses this same
    // block) had no testimonial section anywhere in its content array.
    // Before testimonials were correctly tagged, this went unnoticed
    // because testimonial content still showed up (badly) via the
    // feature-row cycle; once tagged properly and separated out of
    // brief.features, it had nowhere left to render at all. Conditional on
    // real testimonial content existing -- matches the checklist fix's
    // same principle: no real content there should mean the section
    // doesn't render, not that it renders with invented placeholder quotes.
    var testimonialsSectionA = brief.testimonial1Name ? mkContainer([
      mkHeading(brief.testimonialHeading || "What Our Customers Are Saying:", warmWhite, "h2", { weight: 800, px: 32, align: "center" }),
      mkTestimonialCarousel([
        { quote: brief.testimonial1Quote || "", name: brief.testimonial1Name || "", title: brief.testimonial1Title || "" },
        { quote: brief.testimonial2Quote || "", name: brief.testimonial2Name || "", title: brief.testimonial2Title || "" },
        { quote: brief.testimonial3Quote || "", name: brief.testimonial3Name || "", title: brief.testimonial3Title || "" },
      ].filter(function (t) { return t.quote || t.name; }), { textColor: warmWhite, nameColor: warmWhite, jobColor: "rgba(255,255,255,0.7)" }),
    ], dark, { padY: "80", center: true }) : null;

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page", type: "page", page_settings: {},
      content: [heroA, makeTrustStrip(), testimonialsSectionA, ...makeFeatureRows(), checklistSection, makeFormSection(), makeMapSection(), makeClosingCta(), ...makePostClosingRows(), makeFaqSection()].filter(Boolean),
    };
  }

  // ── VARIANT B — Lead Capture layout ───────────────────────────────────────
  if (variant === "B") {
    // Hero with inline form block instead of dual buttons
    var heroB = mkContainer([
      mkHeading(heroEyebrowText, warmWhite, "h6", { eyebrow: true, align: "center" }),
      mkSpacer(16),
      mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 52, align: "center" }),
      mkSpacer(16),
      mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)"),
      // Hook line only when the brief actually has one — the preview renders
      // nothing here otherwise, so the export shouldn't ship a bracketed
      // placeholder line the preview never showed.
      ...(brief.hookStatement ? [mkSpacer(12), mkText("<p style='text-align:center'>" + he(brief.hookStatement) + "</p>", "rgba(255,255,255,0.7)")] : []),
      mkSpacer(32),
      mkButton(phoneCta, darkCtxBtnBg, darkCtxBtnText, brief.heroPrimaryUrl),
    ], dark, { padY: "80", center: true });

    // Lead form section
    var formHeading   = brief.formHeading    || "Request a Quote";
    var formSubhead   = brief.formSubhead    || "We'll get back to you within one business day.";
    var formFields    = (brief.formFields && Array.isArray(brief.formFields) ? brief.formFields : ["Name", "Company", "Phone", "What do you need?", "Message"]);
    var formCta       = brief.formCta        || "Send It Over";
    var formReassure  = brief.formReassurance|| "No sales team. A real reply.";

    // Form widget — real Elementor Form, not a raw HTML mockup. Field types
    // (email/tel/textarea) are inferred from the label text in mkForm.
    var formWidget = mkForm(formFields, formCta, { formName: (brandName || "Site") + " Quote Request" });
    var formCard = mkContainer([
      mkHeading(formHeading, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(4),
      mkText(he(formSubhead), stone),
      mkSpacer(20),
      formWidget,
      mkSpacer(12),
      mkText("<p style='text-align:center'>" + he(formReassure) + "</p>", stone),
    ], warmWhite, { isInner: true, padY: "40", padX: "40" });
    formCard.settings.border_border  = "solid";
    formCard.settings.border_width   = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
    formCard.settings.border_color   = "#DDE0E6";
    formCard.settings.border_radius  = { unit: "px", top: "6", right: "6", bottom: "6", left: "6", isLinked: true };

    // Trust stats — compact row, no per-stat divider (kept intentionally
    // light so it sits inline under the intro/benefits instead of reading
    // as its own separate block).
    var trustColsB = [
      { stat: brief.trustStat1 || "10+",  label: brief.trustLabel1 || "Years in business" },
      { stat: brief.trustStat2 || "500+", label: brief.trustLabel2 || "Projects completed" },
      { stat: brief.trustStat3 || "98%",  label: brief.trustLabel3 || "Client satisfaction" },
    ].map(function(item) {
      return mkContainer([
        mkHeading(item.stat, accent, "h2", { weight: 800, px: 42 }),
        mkSpacer(4),
        mkText(he(item.label), stone),
      ], null, { isInner: true, padY: "0", padX: "0", grow: "1" });
    });

    // Why-Us column: intro paragraph + two folded-in benefit lines (icon
    // list, no separate boxed section) + the stat row. Benefits reuse the
    // same brief.benefit1/benefit2 fields Variant C already uses, rather
    // than introducing a new brief field just for this variant.
    var whyUsIntro = brief.whyUsIntro || "Add 1–2 sentences on why this business is the right choice.";
    var whyUsBenefits = [
      brief.benefit1 || "[Key benefit one]",
      brief.benefit2 || "[Key benefit two]",
    ];
    var trustLeftColChildren = [
      mkHeading("Why " + (brandName || "Us") + "?", ink, "h2", { weight: 700, px: 32 }),
      mkSpacer(14),
      mkText(he(whyUsIntro), text),
      mkSpacer(20),
      mkIconList(whyUsBenefits, accent, text, { fontSize: 19, iconSize: 19 }),
    ];
    if (!brief.skipTrustStats) {
      trustLeftColChildren.push(mkSpacer(26), mkContainer(trustColsB, null, { isInner: true, direction: "row", padY: "0", padX: "0", gap: "24", full: true }));
    }
    var trustLeftCol = mkContainer(trustLeftColChildren, null, { isInner: true, padY: "80", padX: "48", grow: "1" });
    var formRightCol = mkContainer([formCard], null, { isInner: true, padY: "80", padX: "48", grow: "1" });
    var formSection  = mkContainer([trustLeftCol, formRightCol], bone, { direction: "row", padY: "0", padX: "0", gap: "0" });

    // Testimonials — Testimonial Carousel widget (single rotating quote)
    // instead of three stacked white cards, sitting on a dark panel.
    var testimonials = [
      { quote: brief.testimonial1Quote || "[Client testimonial — specific result or outcome]", name: brief.testimonial1Name || "Client Name", title: brief.testimonial1Title || "Title, Company" },
      { quote: brief.testimonial2Quote || "[Second testimonial — different benefit angle]",    name: brief.testimonial2Name || "Client Name", title: brief.testimonial2Title || "Title, Company" },
      { quote: brief.testimonial3Quote || "[Third testimonial — reliability or speed]",        name: brief.testimonial3Name || "Client Name", title: brief.testimonial3Title || "Title, Company" },
    ];
    var testimonialsSection = mkContainer([
      mkHeading(brief.testimonialHeading || "What Our Customers Are Saying:", warmWhite, "h2", { weight: 800, px: 32, align: "center" }),
      mkTestimonialCarousel(testimonials, { textColor: warmWhite, nameColor: warmWhite, jobColor: "rgba(255,255,255,0.7)" }),
    ], dark, { padY: "80", center: true });

    // Mid-page CTA after feature rows
    var midCtaText = brief.midCtaText || "Or {link} and we'll get back to you within one business day.";
    var midCtaLinkText = brief.midCtaLinkText || "send us a message";
    var midCtaHtml = he(midCtaText).replace("{link}", "<a href='/contact' style='color:" + accent + ";font-weight:600'>" + he(midCtaLinkText) + "</a>");
    var midCta = mkContainer([
      mkHeading(phoneCta, accent, "h2", { weight: 800, px: 36, align: "center" }),
      mkSpacer(8),
      mkText("<p style='text-align:center'>" + midCtaHtml + "</p>", stone),
    ], lightSectionBg, { padY: "60", center: true });

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page (Form)", type: "page", page_settings: {},
      content: [heroB, formSection, testimonialsSection, ...makeFeatureRows(), midCta, makeMapSection(), makeClosingCta(dark), ...makePostClosingRows(), makeFaqSection()].filter(Boolean),
    };
  }

  // ── VARIANT C — Minimal Retargeting layout ────────────────────────────────
  // Tight hero → 3 outcome bullets → single testimonial → single CTA
  // No nav distractions, no checklist, no feature rows. Just the essentials.
  var heroC = mkContainer([
    mkHeading(heroEyebrowText, warmWhite, "h6", { eyebrow: true, align: "center" }),
    mkSpacer(12),
    mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 52, align: "center" }),
    mkSpacer(16),
    mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)"),
    mkSpacer(32),
    makeDualBtnRow(phoneCta, contactCta, brief.heroPrimaryUrl, brief.heroSecondaryUrl),
  ], dark, { padY: "80", center: true });

  // 3 outcome-focused benefit bullets
  var benefits = [
    brief.benefit1 || "Faster results with less hassle",
    brief.benefit2 || "One team handles everything end to end",
    brief.benefit3 || "Decades of proven experience",
  ];
  var benefitCols = benefits.map(function(b) {
    return mkContainer([
      mkHeading("✓", accent, "h2", { weight: 800, px: 40, align: "center" }),
      mkSpacer(12),
      mkText("<p style='text-align:center;font-size:18px;font-weight:600;line-height:1.4'>" + he(b) + "</p>", ink),
    ], warmWhite, { isInner: true, padY: "48", padX: "32", center: true, grow: "1" });
  });
  var benefitsSection = mkContainer(benefitCols, lightSectionBg, { direction: "row", padY: "0", padX: "0", gap: "0" });

  // Trust bar — compact stat row
  var compactTrust = brief.skipTrustStats ? null : mkContainer([
    mkContainer([
      mkHeading((brief.trustStat1 || "10+") + "  " + (brief.trustLabel1 || "Years"), accent, "h6", { eyebrow: false, align: "center", weight: 700, px: 15 }),
    ], null, { isInner: true, padY: "0", padX: "24", grow: "1", center: true }),
    mkContainer([
      mkHeading((brief.trustStat2 || "500+") + "  " + (brief.trustLabel2 || "Projects"), accent, "h6", { eyebrow: false, align: "center", weight: 700, px: 15 }),
    ], null, { isInner: true, padY: "0", padX: "24", grow: "1", center: true }),
    mkContainer([
      mkHeading((brief.trustStat3 || "98%") + "  " + (brief.trustLabel3 || "Satisfaction"), accent, "h6", { eyebrow: false, align: "center", weight: 700, px: 15 }),
    ], null, { isInner: true, padY: "0", padX: "24", grow: "1", center: true }),
  ], bone, { direction: "row", padY: "20", padX: "40", gap: "0" });

  // Single testimonial
  var tQuote = brief.testimonial1Quote || "[Your strongest client quote goes here — one specific result]";
  var tName  = brief.testimonial1Name  || "Client Name";
  var tTitle = brief.testimonial1Title || "Title, Company";
  var singleTestimonial = mkContainer([
    mkText("<p style='font-size:22px;font-style:italic;line-height:1.6;text-align:center;margin:0 0 24px'>\"" + he(tQuote) + "\"</p>", ink),
    mkText("<p style='text-align:center;font-weight:600'>" + he(tName) + " · " + he(tTitle) + "</p>", stone),
  ], bone, { padY: "80", center: true });

  // Single strong CTA
  var singleCtaBg = accent;
  var singleCtaText = lightTextOn(singleCtaBg);
  var singleCtaSection = mkContainer([
    mkHeading(closingLine, singleCtaText, "h2", { weight: 700, px: 40, align: "center" }),
    mkSpacer(24),
    mkButton(phoneCta, darkCtxBtnBg, darkCtxBtnText, brief.heroPrimaryUrl),
    mkSpacer(16),
    mkText("<p style='text-align:center;font-size:14px'>" + he(brief.formReassurance || "No sales team. A real reply within one business day.") + "</p>", singleCtaText === "#FFFFFF" ? "rgba(255,255,255,0.7)" : singleCtaText),
  ], singleCtaBg, { padY: "100", center: true }); // brass closing, matching Variant C's preview

  return {
    version: "0.4", title: he(brandName || "Site") + " — Landing Page (Minimal)", type: "page", page_settings: {},
    content: [heroC, benefitsSection, compactTrust, singleTestimonial, makeMapSection(), singleCtaSection].filter(Boolean),
  };
}
