import { nid, mkContainer, mkHeading, mkText, mkButton, mkImagePh, mkSpacer, mkDivider } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";

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
  var ink      = colors.ink           || "#1A1A1A";
  var accent   = colors.brass         || colors.accent || "#1A5C2A";
  var bone     = colors.bone          || colors.background || "#F2F2F2";
  var warmWhite= colors["warm-white"] || "#FFFFFF";
  var text     = colors.text          || "#1A1A1A";
  var stone    = colors.stone         || colors.muted || "#666666";
  var dark     = colors.asphalt       || colors["dark-panel"] || accent;

  var brandName   = brief.brandName    || "";
  var heroH1      = brief.heroHeadline || brief.tagline || "[Landing page headline]";
  var heroSub     = brief.heroSubhead  || brief.hookStatement || "[Specific, direct subheadline]";
  var phoneCta    = brief.phoneCta     || brief.heroCta1 || "Call Us Now";
  var contactCta  = brief.contactCta   || brief.heroCta2 || "Contact Us";
  var closingLine = brief.closingCta   || brief.tagline  || "Ready to get started?";
  var closingBody = brief.closingBody  || "[One sentence that removes hesitation and drives action]";

  // ── Shared helpers ────────────────────────────────────────────────────────
  function makeOutlineBtn(label) {
    var btn = mkButton(label, "transparent", warmWhite);
    btn.settings.border_border = "solid";
    btn.settings.border_width  = { unit: "px", top: "2", right: "2", bottom: "2", left: "2", isLinked: true };
    btn.settings.border_color  = warmWhite;
    btn.settings.background_color = "transparent";
    return btn;
  }

  function makeDualBtnRow(primaryLabel, secondaryLabel) {
    return mkContainer([mkButton(primaryLabel, warmWhite, dark), makeOutlineBtn(secondaryLabel)], null, {
      isInner: true, direction: "row", buttonRow: true, gap: "16", padY: "0", padX: "0", center: true
    });
  }

  function makeTrustStrip(bgColor) {
    var items = [
      { stat: brief.trustStat1 || "50+",  label: brief.trustLabel1 || "Years in business" },
      { stat: brief.trustStat2 || "15",   label: brief.trustLabel2 || "Full-service bays" },
      { stat: brief.trustStat3 || "5",    label: brief.trustLabel3 || "Paint booths" },
    ];
    var cols = items.map(function(item) {
      return mkContainer([
        mkHeading(item.stat, accent, "h2", { weight: 800, px: 44, align: "center" }),
        mkSpacer(8),
        mkText("<p style='text-align:center'>" + he(item.label) + "</p>", stone),
      ], warmWhite, { isInner: true, padY: "48", padX: "32", center: true, grow: "1" });
    });
    return mkContainer(cols, bgColor || bone, { direction: "row", padY: "0", padX: "0", gap: "0" });
  }

  function makeFeatureRows() {
    // Opt-in per brief — most landing pages should NOT get a bordered text
    // box. Only apply it when the brief explicitly asks for it.
    var featureBorder = !!brief.featureTextBorder;
    var features = [
      { heading: brief.feature1Heading || "Advanced Body Repair Techniques",       body: brief.feature1Body || "[Describe your body repair capabilities]",   imgCaption: "[Photo: technician at work]",      imageLeft: false },
      { heading: brief.feature2Heading || "Custom Paint Jobs for a Standout Fleet", body: brief.feature2Body || "[Describe your paint capabilities]",         imgCaption: "[Photo: finished paint or booth]", imageLeft: true  },
      { heading: brief.feature3Heading || "Fleet Maintenance You Can Trust",        body: brief.feature3Body || "[Describe your maintenance and reliability]", imgCaption: "[Photo: fleet or shop floor]",     imageLeft: false },
    ];
    return features.map(function(f, i) {
      var innerChildren = [
        mkHeading(f.heading, accent, "h2", { weight: 700, px: 34 }),
        mkSpacer(16),
        mkText(he(f.body), text),
        mkSpacer(24),
        mkButton(contactCta, accent, warmWhite),
      ];
      var textCol;
      if (featureBorder) {
        // Bordered box floats inside the column — its own padding/border,
        // with the column's own padding acting as the margin around it.
        var boxed = mkContainer(innerChildren, null, { isInner: true, padY: "40", padX: "40", full: true });
        boxed.settings.border_border = "solid";
        boxed.settings.border_width = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
        boxed.settings.border_color = accent;
        textCol = mkContainer([boxed], null, { isInner: true, padY: "60", padX: "48", grow: "1", full: true });
      } else {
        textCol = mkContainer(innerChildren, null, { isInner: true, padY: "60", padX: "48", grow: "1", full: true });
      }
      // Row is stretched to match the image column's height (flex_align_items:
      // stretch on the parent row) — center this column's content vertically
      // so it fills that height instead of leaving empty space below it.
      textCol.settings.justify_content = "center";
      var imgCol = mkContainer([mkImagePh(f.imgCaption)], bone, { isInner: true, padY: "0", padX: "0", grow: "1", full: true });
      var cols   = f.imageLeft ? [imgCol, textCol] : [textCol, imgCol];
      return mkContainer(cols, i % 2 === 0 ? warmWhite : bone, { direction: "row", padY: "0", padX: "0", gap: "0", full: true });
    });
  }

  function makeClosingCta() {
    return mkContainer([
      mkHeading(closingLine, warmWhite, "h2", { weight: 700, px: 40, align: "center" }),
      mkSpacer(12),
      mkText("<p style='text-align:center'>" + he(closingBody) + "</p>", "rgba(255,255,255,0.8)"),
      mkSpacer(28),
      makeDualBtnRow(phoneCta, contactCta),
    ], dark, { padY: "80", center: true });
  }

  // ── VARIANT A — Awareness / Feature layout ────────────────────────────────
  if (variant !== "B" && variant !== "C") {
    var heroEyebrow = mkHeading(brandName, warmWhite, "h6", { eyebrow: true, align: "center" });
    var heroH1El    = mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 58, align: "center" });
    var heroSubEl   = mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)");
    heroSubEl.settings.text_align = heroSubEl.settings.text_align_tablet = heroSubEl.settings.text_align_mobile = "center";

    var heroA = mkContainer(
      [heroEyebrow, mkSpacer(16), heroH1El, mkSpacer(20), heroSubEl, mkSpacer(32), makeDualBtnRow(phoneCta, contactCta)],
      accent, { padY: "100", center: true }
    );

    var checklistItems = brief.servicesList || ["2 Shifts — Quick Turn-Around","5 Complete Paint Booths","Full Restorations","Custom Painting, Striping and Design","Structural Repairs","Frame Rail Replacements","Body Swaps","Direct Insurance Billing"];
    var checklistHtml  = "<ul style='list-style:none;padding:0;margin:0;columns:2;column-gap:48px'>" +
      checklistItems.map(function(item) {
        return "<li style='padding:6px 0 6px 28px;position:relative;border-bottom:1px solid #e5e5e5;break-inside:avoid'><span style='position:absolute;left:0;color:" + accent + ";font-weight:700'>✓</span>" + he(item) + "</li>";
      }).join("") + "</ul>";
    var checklistSection = mkContainer([
      mkHeading(brief.servicesHeading || "What We Do", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(24), mkDivider(accent), mkSpacer(32),
      { id: nid(), elType: "widget", widgetType: "text-editor", settings: { editor: checklistHtml, text_color: text, typography_font_size: { unit: "px", size: 15 }, typography_font_size_tablet: { unit: "px", size: 15 }, typography_font_size_mobile: { unit: "px", size: 14 }, typography_line_height: { unit: "em", size: 1.7 } }, elements: [] },
    ], warmWhite, { padY: "80" });

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page", type: "page", page_settings: {},
      content: [heroA, makeTrustStrip(), ...makeFeatureRows(), checklistSection, makeClosingCta()],
    };
  }

  // ── VARIANT B — Lead Capture layout ───────────────────────────────────────
  if (variant === "B") {
    // Hero with inline form block instead of dual buttons
    var heroB = mkContainer([
      mkHeading(brandName, warmWhite, "h6", { eyebrow: true, align: "center" }),
      mkSpacer(16),
      mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 52, align: "center" }),
      mkSpacer(16),
      mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)"),
      mkSpacer(12),
      mkText("<p style='text-align:center'>" + he(brief.hookStatement || "[What sets you apart in one line]") + "</p>", "rgba(255,255,255,0.7)"),
      mkSpacer(32),
      mkButton(phoneCta, warmWhite, dark),
    ], accent, { padY: "80", center: true });

    // Lead form section
    var formHeading   = brief.formHeading    || "Request a Quote";
    var formSubhead   = brief.formSubhead    || "We'll get back to you within one business day.";
    var formFields    = (brief.formFields && Array.isArray(brief.formFields) ? brief.formFields : ["Name", "Company", "Phone", "What do you need?", "Message"]);
    var formCta       = brief.formCta        || "Send It Over";
    var formReassure  = brief.formReassurance|| "No sales team. A real reply.";

    var formFieldsHtml = "<div style='display:flex;flex-direction:column;gap:12px;margin-bottom:20px'>" +
      formFields.map(function(f) {
        return "<div style='display:flex;flex-direction:column;gap:4px'><label style='font-size:13px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em'>" + he(f) + "</label><input type='text' placeholder='' style='padding:12px 14px;border:1px solid #dde0e6;border-radius:4px;font-size:15px;width:100%;box-sizing:border-box'/></div>";
      }).join("") + "</div>";
    var formHtml = "<div style='background:" + warmWhite + ";border:1px solid #dde0e6;border-radius:8px;padding:40px'>" +
      "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px'>" + he(formHeading) + "</h3>" +
      "<p style='font-size:15px;color:" + stone + ";margin:0 0 24px;line-height:1.6'>" + he(formSubhead) + "</p>" +
      formFieldsHtml +
      "<button style='width:100%;padding:16px;background:" + accent + ";color:" + warmWhite + ";font-weight:700;font-size:15px;border:none;border-radius:4px;cursor:pointer;text-transform:uppercase;letter-spacing:0.08em'>" + he(formCta) + "</button>" +
      "<p style='font-size:13px;color:" + stone + ";margin:12px 0 0;text-align:center'>" + he(formReassure) + "</p>" +
      "</div>";

    var formWidget = { id: nid(), elType: "widget", widgetType: "text-editor", settings: { editor: formHtml }, elements: [] };

    // Split: trust stats left, form right
    var trustColsB = [
      { stat: brief.trustStat1 || "50+", label: brief.trustLabel1 || "Years in business" },
      { stat: brief.trustStat2 || "15",  label: brief.trustLabel2 || "Full-service bays" },
      { stat: brief.trustStat3 || "5",   label: brief.trustLabel3 || "Paint booths" },
    ].map(function(item) {
      return mkContainer([
        mkHeading(item.stat, accent, "h2", { weight: 800, px: 48 }),
        mkSpacer(8),
        mkText(he(item.label), stone),
        mkSpacer(16),
        mkDivider(accent),
      ], null, { isInner: true, padY: "24", padX: "0", grow: "1" });
    });

    var trustLeftCol = mkContainer(
      [mkHeading("Why " + (brandName || "us") + "?", ink, "h2", { weight: 700, px: 32 }), mkSpacer(32)].concat(trustColsB),
      null, { isInner: true, padY: "80", padX: "48", grow: "1" }
    );
    var formRightCol = mkContainer([formWidget], null, { isInner: true, padY: "80", padX: "48", grow: "1" });
    var formSection  = mkContainer([trustLeftCol, formRightCol], bone, { direction: "row", padY: "0", padX: "0", gap: "0" });

    // Testimonials
    var testimonials = [
      { quote: brief.testimonial1Quote || "[Client testimonial — specific result or outcome]", name: brief.testimonial1Name || "Client Name", title: brief.testimonial1Title || "Title, Company" },
      { quote: brief.testimonial2Quote || "[Second testimonial — different benefit angle]",    name: brief.testimonial2Name || "Client Name", title: brief.testimonial2Title || "Title, Company" },
      { quote: brief.testimonial3Quote || "[Third testimonial — reliability or speed]",        name: brief.testimonial3Name || "Client Name", title: brief.testimonial3Title || "Title, Company" },
    ];
    var testimonialCols = testimonials.map(function(t) {
      return mkContainer([
        mkText("<p style='font-size:17px;font-style:italic;line-height:1.7;margin:0 0 20px'>\"" + he(t.quote) + "\"</p>", ink),
        mkDivider(accent),
        mkSpacer(12),
        mkText("<strong>" + he(t.name) + "</strong><br>" + he(t.title), stone),
      ], warmWhite, { isInner: true, padY: "40", padX: "32", grow: "1" });
    });
    var testimonialsSection = mkContainer([
      mkHeading("What our clients say", ink, "h2", { weight: 700, px: 32, align: "center" }),
      mkSpacer(40),
      mkContainer(testimonialCols, null, { isInner: true, direction: "row", padY: "0", padX: "0", gap: "24" }),
    ], bone, { padY: "80", center: true });

    // Mid-page CTA after feature rows
    var midCta = mkContainer([
      mkHeading(phoneCta, accent, "h2", { weight: 800, px: 36, align: "center" }),
      mkSpacer(8),
      mkText("<p style='text-align:center'>Or <a href='/contact' style='color:" + accent + ";font-weight:600'>send us a message</a> and we'll get back to you within one business day.</p>", stone),
    ], warmWhite, { padY: "60", center: true });

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page (Form)", type: "page", page_settings: {},
      content: [heroB, formSection, testimonialsSection, ...makeFeatureRows(), midCta, makeClosingCta()],
    };
  }

  // ── VARIANT C — Minimal Retargeting layout ────────────────────────────────
  // Tight hero → 3 outcome bullets → single testimonial → single CTA
  // No nav distractions, no checklist, no feature rows. Just the essentials.
  var heroC = mkContainer([
    mkHeading(brandName, warmWhite, "h6", { eyebrow: true, align: "center" }),
    mkSpacer(12),
    mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 52, align: "center" }),
    mkSpacer(16),
    mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)"),
    mkSpacer(32),
    makeDualBtnRow(phoneCta, contactCta),
  ], accent, { padY: "80", center: true });

  // 3 outcome-focused benefit bullets
  var benefits = [
    brief.benefit1 || "Your fleet back on the road faster",
    brief.benefit2 || "One shop handles everything — no vendor juggling",
    brief.benefit3 || "50 years of fleet experience behind every repair",
  ];
  var benefitCols = benefits.map(function(b) {
    return mkContainer([
      mkHeading("✓", accent, "h2", { weight: 800, px: 40, align: "center" }),
      mkSpacer(12),
      mkText("<p style='text-align:center;font-size:18px;font-weight:600;line-height:1.4'>" + he(b) + "</p>", ink),
    ], warmWhite, { isInner: true, padY: "48", padX: "32", center: true, grow: "1" });
  });
  var benefitsSection = mkContainer(benefitCols, warmWhite, { direction: "row", padY: "0", padX: "0", gap: "0" });

  // Trust bar — compact stat row
  var compactTrust = mkContainer([
    mkContainer([
      mkHeading((brief.trustStat1 || "50+") + "  " + (brief.trustLabel1 || "Years"), accent, "h6", { eyebrow: false, align: "center", weight: 700, px: 15 }),
    ], null, { isInner: true, padY: "0", padX: "24", grow: "1", center: true }),
    mkContainer([
      mkHeading((brief.trustStat2 || "15") + "  " + (brief.trustLabel2 || "Bays"), accent, "h6", { eyebrow: false, align: "center", weight: 700, px: 15 }),
    ], null, { isInner: true, padY: "0", padX: "24", grow: "1", center: true }),
    mkContainer([
      mkHeading((brief.trustStat3 || "5") + "  " + (brief.trustLabel3 || "Paint Booths"), accent, "h6", { eyebrow: false, align: "center", weight: 700, px: 15 }),
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
  var singleCtaSection = mkContainer([
    mkHeading(closingLine, warmWhite, "h2", { weight: 700, px: 40, align: "center" }),
    mkSpacer(24),
    mkButton(phoneCta, warmWhite, dark),
    mkSpacer(16),
    mkText("<p style='text-align:center;font-size:14px'>" + he(brief.formReassurance || "No sales team. A real reply within one business day.") + "</p>", "rgba(255,255,255,0.7)"),
  ], dark, { padY: "100", center: true });

  return {
    version: "0.4", title: he(brandName || "Site") + " — Landing Page (Minimal)", type: "page", page_settings: {},
    content: [heroC, benefitsSection, compactTrust, singleTestimonial, singleCtaSection],
  };
}
