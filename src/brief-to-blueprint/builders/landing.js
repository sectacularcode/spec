import { nid, mkContainer, mkHeading, mkText, mkButton, mkImageBg, mkSpacer, mkDivider, mkIconList, mkForm, mkTestimonialCarousel, mkAccordion, mkMapSection } from "./helpers.js";
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
  var accent   = colors.brass         || colors.accent || "#C2A35B";
  var bone     = colors.bone          || colors.background || "#F2F2F2";
  var warmWhite= colors["warm-white"] || "#FFFFFF";
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

  var brandName   = brief.brandName    || "";
  var heroEyebrowText = brief.heroEyebrow != null ? brief.heroEyebrow : brandName;
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

  function makeFeatureRows() {
    // Opt-in per brief — most landing pages should NOT get a bordered text
    // box. Only apply it when the brief explicitly asks for it.
    var featureBorder = !!brief.featureTextBorder;
    var features = [
      { heading: brief.feature1Heading || "What We Do Best",     body: brief.feature1Body || "[Describe the primary service or capability that sets you apart]", imgCaption: "[Photo placeholder]", imageLeft: false },
      { heading: brief.feature2Heading || "Built for Your Needs", body: brief.feature2Body || "[Explain how your approach is tailored to the specific customer]", imgCaption: "[Photo placeholder]", imageLeft: true  },
      { heading: brief.feature3Heading || "Results You Can Count On", body: brief.feature3Body || "[Speak to reliability, track record, or outcomes]", imgCaption: "[Photo placeholder]", imageLeft: false },
    ];
    return features.map(function(f, i) {
      var innerChildren = [
        mkHeading(f.heading, accent, "h2", { weight: 700, px: 34 }),
        mkSpacer(16),
        mkText(he(f.body), text),
        mkSpacer(24),
        mkButton(contactCta, accent, warmWhite),
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
      var imgCol  = mkImageBg(f.imgCaption, { width: 50 });
      var cols    = f.imageLeft ? [imgCol, textCol] : [textCol, imgCol];
      var row     = mkContainer(cols, i % 2 === 0 ? warmWhite : bone, { direction: "row", padY: "0", padX: "0", gap: "0", full: true });
      return row;
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
      mkHeading(brief.faqHeading || "Frequently Asked Questions", accent, "h2", { weight: 800, px: 32 }),
      mkSpacer(28),
      mkAccordion(faqItems),
    ], warmWhite, { padY: "80" });
  }

  // Optional map/location section — renders only when the brief supplies a
  // real address or map link (from a Manifest "map" block, or brief.mapAddress
  // / brief.mapUrl set directly). Sits after social proof and before the
  // closing CTA, matching the order Manifest's sample export uses. Returns
  // null when there's nothing to show — callers must .filter(Boolean).
  function makeMapSection() {
    if (!brief.mapAddress && !brief.mapUrl) return null;
    return mkMapSection(brief.mapAddress, brief.mapUrl, colors, { heading: brief.mapHeading || "Find Us" });
  }

  // ── VARIANT A — Awareness / Feature layout ────────────────────────────────
  if (variant !== "B" && variant !== "C") {
    var heroEyebrow = mkHeading(heroEyebrowText, warmWhite, "h6", { eyebrow: true, align: "center" });
    var heroH1El    = mkHeading(heroH1, warmWhite, "h1", { weight: 800, px: 58, align: "center" });
    var heroSubEl   = mkText("<p style='text-align:center'>" + he(heroSub) + "</p>", "rgba(255,255,255,0.85)");
    heroSubEl.settings.text_align = heroSubEl.settings.text_align_tablet = heroSubEl.settings.text_align_mobile = "center";

    var heroA = mkContainer(
      [heroEyebrow, mkSpacer(16), heroH1El, mkSpacer(20), heroSubEl, mkSpacer(32), makeDualBtnRow(phoneCta, contactCta)],
      dark, { padY: "100", center: true }
    );

    var checklistItems = brief.servicesList || ["Reduced overall cost", "Reduced downtime", "Proactive planning", "Expert team", "Fast response time", "Tailored reporting", "Direct billing", "Add more below..."];
    var half = Math.ceil(checklistItems.length / 2);
    var checklistSection = mkContainer([
      mkHeading(brief.servicesHeading || "What We Do", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(24), mkDivider(accent), mkSpacer(32),
      mkContainer([
        mkIconList(checklistItems.slice(0, half), accent, text, { width: 50 }),
        mkIconList(checklistItems.slice(half), accent, text, { width: 50 }),
      ], null, { direction: "row", gap: "48", padY: "0", isInner: true, full: true }),
    ], warmWhite, { padY: "80" });

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page", type: "page", page_settings: {},
      content: [heroA, makeTrustStrip(), ...makeFeatureRows(), checklistSection, makeMapSection(), makeClosingCta(), makeFaqSection()].filter(Boolean),
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
      mkSpacer(12),
      mkText("<p style='text-align:center'>" + he(brief.hookStatement || "[What sets you apart in one line]") + "</p>", "rgba(255,255,255,0.7)"),
      mkSpacer(32),
      mkButton(phoneCta, warmWhite, dark),
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
    var whyUsIntro = brief.whyUsIntro || "[Add 1–2 sentences on why this business is the right choice]";
    var whyUsBenefits = [
      brief.benefit1 || "[Key benefit one]",
      brief.benefit2 || "[Key benefit two]",
    ];
    var trustLeftCol = mkContainer([
      mkHeading("Why " + (brandName || "Us") + "?", ink, "h2", { weight: 700, px: 32 }),
      mkSpacer(14),
      mkText(he(whyUsIntro), text),
      mkSpacer(20),
      mkIconList(whyUsBenefits, accent, text, { fontSize: 15 }),
      mkSpacer(26),
      mkContainer(trustColsB, null, { isInner: true, direction: "row", padY: "0", padX: "0", gap: "24", full: true }),
    ], null, { isInner: true, padY: "80", padX: "48", grow: "1" });
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
    ], warmWhite, { padY: "60", center: true });

    return {
      version: "0.4", title: he(brandName || "Site") + " — Landing Page (Form)", type: "page", page_settings: {},
      content: [heroB, formSection, testimonialsSection, ...makeFeatureRows(), midCta, makeMapSection(), makeClosingCta(), makeFaqSection()].filter(Boolean),
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
    makeDualBtnRow(phoneCta, contactCta),
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
  var benefitsSection = mkContainer(benefitCols, warmWhite, { direction: "row", padY: "0", padX: "0", gap: "0" });

  // Trust bar — compact stat row
  var compactTrust = mkContainer([
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
  var singleCtaSection = mkContainer([
    mkHeading(closingLine, warmWhite, "h2", { weight: 700, px: 40, align: "center" }),
    mkSpacer(24),
    mkButton(phoneCta, warmWhite, dark),
    mkSpacer(16),
    mkText("<p style='text-align:center;font-size:14px'>" + he(brief.formReassurance || "No sales team. A real reply within one business day.") + "</p>", "rgba(255,255,255,0.7)"),
  ], dark, { padY: "100", center: true });

  return {
    version: "0.4", title: he(brandName || "Site") + " — Landing Page (Minimal)", type: "page", page_settings: {},
    content: [heroC, benefitsSection, compactTrust, singleTestimonial, makeMapSection(), singleCtaSection].filter(Boolean),
  };
}
