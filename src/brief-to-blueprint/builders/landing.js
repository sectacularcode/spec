import { nid, rPad, rFont, mkContainer, mkHeading, mkText, mkButton, mkImagePh, mkSpacer, mkDivider } from "./helpers.js";

// Landing page builder — purpose-built for single-page ad/campaign layouts.
// Two variants:
//   A — light background, dark hero (default)
//   B — full dark hero with prominent dual CTA
//
// Section order:
//   1. Hero — bold headline, subhead, dual CTA buttons (phone + contact form)
//   2. Trust strip — 3 proof points in a row
//   3. Feature rows — alternating image + text (3 service blocks)
//   4. Services checklist — bullet list of capabilities
//   5. Closing CTA — dark panel, repeat dual CTAs

export function buildLandingPage(colors, brief, inspoContext, variant) {
  var ink      = colors.ink        || colors.charcoal  || "#1A1A1A";
  var accent   = colors.brass      || colors.accent     || colors.green || "#1A5C2A";
  var accentDp = colors["brass-deep"] || colors["accent-deep"] || "#154A22";
  var bone     = colors.bone       || colors.background || colors.canvas || "#F2F2F2";
  var warmWhite= colors["warm-white"] || colors.white   || "#FFFFFF";
  var text     = colors.text       || "#1A1A1A";
  var stone    = colors.stone      || colors.muted      || "#666666";
  var dark     = colors.asphalt    || colors["dark-panel"] || accent;

  var isDark = (variant === "B");

  var brandName    = brief.brandName    || "";
  var heroH1       = brief.heroHeadline || brief.tagline || "[Landing page headline]";
  var heroSub      = brief.heroSubhead  || brief.hookStatement || "[Specific, direct subheadline]";
  var phoneCta     = brief.phoneCta     || brief.heroCta1 || "Call Us Now";
  var contactCta   = brief.contactCta   || brief.heroCta2 || "Contact Us";
  var closingLine  = brief.closingCta   || brief.tagline  || "Ready to get started?";
  var closingBody  = brief.closingBody  || "[One sentence that removes hesitation and drives action]";

  // ── 1. Hero ───────────────────────────────────────────────────────────────
  var heroBg = isDark ? dark : accent;
  var heroTextColor = warmWhite;

  var heroEyebrow = mkHeading(brandName, accent === heroBg ? warmWhite : accent, "h6", { eyebrow: true, align: "center" });
  var heroH1El = mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 58, align: "center" });
  var heroSubEl = mkText("<p style='text-align:center'>" + heroSub + "</p>", "rgba(255,255,255,0.85)");
  heroSubEl.settings.text_align = "center";
  heroSubEl.settings.text_align_tablet = "center";
  heroSubEl.settings.text_align_mobile = "center";

  var phoneBtnEl = mkButton(phoneCta, warmWhite, accent);
  var contactBtnEl = mkButton(contactCta, "transparent", warmWhite);
  contactBtnEl.settings.border_border = "solid";
  contactBtnEl.settings.border_width = { unit: "px", top: "2", right: "2", bottom: "2", left: "2", isLinked: true };
  contactBtnEl.settings.border_color = warmWhite;
  contactBtnEl.settings.background_color = "transparent";

  var heroBtnRow = mkContainer([phoneBtnEl, contactBtnEl], null, {
    isInner: true, direction: "row", buttonRow: true, gap: "16", padY: "0", padX: "0", center: true
  });

  var heroSection = mkContainer(
    [heroEyebrow, mkSpacer(16), heroH1El, mkSpacer(20), heroSubEl, mkSpacer(32), heroBtnRow],
    heroBg,
    { padY: "100", center: true }
  );

  // ── 2. Trust strip ────────────────────────────────────────────────────────
  var trustItems = [
    { stat: brief.trustStat1 || "50+",  label: brief.trustLabel1 || "Years in business" },
    { stat: brief.trustStat2 || "15",   label: brief.trustLabel2 || "Full-service bays" },
    { stat: brief.trustStat3 || "100%", label: brief.trustLabel3 || "Certified technicians" },
  ];

  var trustCols = trustItems.map(function(item) {
    return mkContainer([
      mkHeading(item.stat, accent, "h2", { weight: 800, px: 44, align: "center" }),
      mkSpacer(8),
      mkText("<p style='text-align:center'>" + item.label + "</p>", stone),
    ], warmWhite, { isInner: true, padY: "48", padX: "32", center: true, grow: "1" });
  });

  var trustStrip = mkContainer(trustCols, bone, { direction: "row", padY: "0", padX: "0", gap: "0" });

  // ── 3. Feature rows (alternating) ─────────────────────────────────────────
  var features = [
    {
      heading: brief.feature1Heading || "Advanced Body Repair Techniques",
      body:    brief.feature1Body    || "[Describe your body repair capabilities — frame straightening, panel replacement, precision work]",
      imgCaption: "[Photo: technician performing body repair]",
      imageLeft: false,
    },
    {
      heading: brief.feature2Heading || "Custom Paint Jobs for a Standout Fleet",
      body:    brief.feature2Body    || "[Describe your paint capabilities — PPG paints, color matching, full repaints, striping]",
      imgCaption: "[Photo: finished paint job or paint booth]",
      imageLeft: true,
    },
    {
      heading: brief.feature3Heading || "Fleet Maintenance You Can Trust",
      body:    brief.feature3Body    || "[Describe your maintenance and reliability — DOT inspections, quick turnaround, certified team]",
      imgCaption: "[Photo: fleet vehicles or shop floor]",
      imageLeft: false,
    },
  ];

  var featureRows = features.map(function(f, i) {
    var textCol = mkContainer([
      mkHeading(f.heading, accent, "h2", { weight: 700, px: 34 }),
      mkSpacer(16),
      mkText(f.body, text),
      mkSpacer(24),
      mkButton(contactCta, accent, warmWhite),
    ], null, { isInner: true, padY: "60", padX: "48", grow: "1" });

    var imgCol = mkContainer([
      mkImagePh(f.imgCaption),
    ], bone, { isInner: true, padY: "0", padX: "0", grow: "1" });

    var cols = f.imageLeft ? [imgCol, textCol] : [textCol, imgCol];
    var rowBg = i % 2 === 0 ? warmWhite : bone;

    return mkContainer(cols, rowBg, { direction: "row", padY: "0", padX: "0", gap: "0" });
  });

  // ── 4. Services checklist ─────────────────────────────────────────────────
  var checklistItems = brief.servicesList || [
    "2 Shifts — Quick Turn-Around",
    "Sikkens Premium Paint by AkzoNobel",
    "5 Complete Paint Booths",
    "Full Restorations",
    "Expert Sandblasting and Media Blasting",
    "Custom Painting, Striping and Design",
    "Structural Repairs",
    "Complete Rebuilding of Cabs, Hoods, Fenders, Etc.",
    "Complete All Over Paint Jobs and Spot Painting",
    "Custom Graphics Design and Installation",
  ];

  var checklistHtml = "<ul style='list-style:none;padding:0;margin:0;columns:2;column-gap:48px'>" +
    checklistItems.map(function(item) {
      return "<li style='padding:6px 0 6px 28px;position:relative;border-bottom:1px solid #e5e5e5;break-inside:avoid'>" +
        "<span style='position:absolute;left:0;color:" + accent + ";font-weight:700'>✓</span>" +
        item + "</li>";
    }).join("") + "</ul>";

  var checklistSection = mkContainer([
    mkHeading(brief.servicesHeading || "What We Do", text, "h2", { weight: 700, px: 36 }),
    mkSpacer(24),
    mkDivider(accent),
    mkSpacer(32),
    { id: nid(), elType: "widget", widgetType: "text-editor", settings: {
      editor: checklistHtml, text_color: text,
      typography_font_size: { unit: "px", size: 15 },
      typography_font_size_tablet: { unit: "px", size: 15 },
      typography_font_size_mobile: { unit: "px", size: 14 },
      typography_line_height: { unit: "em", size: 1.7 },
    }, elements: [] },
  ], warmWhite, { padY: "80" });

  // ── 5. Closing CTA ────────────────────────────────────────────────────────
  var closingPhoneBtn = mkButton(phoneCta, warmWhite, dark);
  var closingContactBtn = mkButton(contactCta, "transparent", warmWhite);
  closingContactBtn.settings.border_border = "solid";
  closingContactBtn.settings.border_width = { unit: "px", top: "2", right: "2", bottom: "2", left: "2", isLinked: true };
  closingContactBtn.settings.border_color = warmWhite;
  closingContactBtn.settings.background_color = "transparent";

  var closingBtnRow = mkContainer([closingPhoneBtn, closingContactBtn], null, {
    isInner: true, direction: "row", buttonRow: true, gap: "16", padY: "0", padX: "0", center: true
  });

  var closingCta = mkContainer([
    mkHeading(closingLine, warmWhite, "h2", { weight: 700, px: 40, align: "center" }),
    mkSpacer(12),
    mkText("<p style='text-align:center'>" + closingBody + "</p>", "rgba(255,255,255,0.8)"),
    mkSpacer(28),
    closingBtnRow,
  ], dark, { padY: "80", center: true });

  var sections = [heroSection, trustStrip].concat(featureRows).concat([checklistSection, closingCta]);

  return {
    version: "0.4",
    title: (brandName || "Site") + " — Landing Page",
    type: "page",
    page_settings: {},
    content: sections,
  };
}
