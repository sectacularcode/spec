import { useState, useRef, useEffect } from "react";

// ─── Template Library ─────────────────────────────────────────────────────────
const TEMPLATE_LIBRARY = [
  {
    id: "mile-marker-2026",
    client: "Mile Marker Films",
    industry: "Video Production",
    style: "Dark Premium · Editorial",
    tags: ["dark-premium", "warm-editorial", "confident", "direct"],
    industryFit: ["video-production","creative-agency","consulting","private-equity","luxury-services","hospitality","industrial","founder-led","photography","architecture"],
    pages: ["home","work","services","about","process","contact"],
    date: "2026-06-02",
    description: "Full-bleed dark hero, editorial splits, brass accent system, Fraunces display type. Built for a one-person filmmaker targeting industrial and founder-led companies.",
    source: "built-in",
  }
];

// ─── Library helpers ───────────────────────────────────────────────────────────

function inferTags(brief, pages, layoutVariants) {
  var colors = brief.colors || {};
  var ink = (colors.ink || "#000000").toLowerCase();
  var bone = (colors.bone || colors["warm-white"] || "#ffffff").toLowerCase();
  var brass = (colors.brass || colors.accent || "").toLowerCase();

  // Visual style tags — inferred from color palette
  var visualTags = [];
  var isDark = ink === "#1c1a17" || ink === "#000000" || ink === "#09090b" || ink === "#111111";
  var isWarm = bone.indexOf("e") !== -1 || bone.indexOf("f3f1") !== -1 || bone.indexOf("ede") !== -1;
  var hasBrass = brass.indexOf("c2a") !== -1 || brass.indexOf("9c7") !== -1 || brass.indexOf("c49") !== -1;
  var hasGold = brass.indexOf("c49") !== -1 || brass.indexOf("d4a") !== -1;

  if (isDark) visualTags.push("dark-hero");
  if (isWarm) visualTags.push("warm-palette");
  if (hasBrass || hasGold) visualTags.push("brass-accent");

  // Layout style from variant choices
  var usedB = Object.values(layoutVariants || {}).some(function(v) { return v === "B"; });
  if (usedB) visualTags.push("editorial");
  if (!usedB) visualTags.push("structured");

  // Tone tags from voice rules
  var toneTags = [];
  var rules = (brief.voiceRules || []).join(" ").toLowerCase();
  if (rules.indexOf("confident") !== -1 || rules.indexOf("quiet") !== -1) toneTags.push("confident");
  if (rules.indexOf("plain") !== -1 || rules.indexOf("no buzzword") !== -1) toneTags.push("direct");
  if (rules.indexOf("warm") !== -1) toneTags.push("warm");
  if (rules.indexOf("premium") !== -1 || rules.indexOf("luxury") !== -1) toneTags.push("premium");
  if (rules.indexOf("minimal") !== -1 || rules.indexOf("simple") !== -1) toneTags.push("minimal");
  if (rules.indexOf("bold") !== -1 || rules.indexOf("strong") !== -1) toneTags.push("bold");

  // Industry fit — infer from brand name + brief context
  var context = [brief.brandName, brief.tagline, brief.whoBody, brief.hookStatement].join(" ").toLowerCase();
  var industryFit = [];
  if (context.match(/film|video|studio|production|shoot|edit/)) industryFit.push("video-production", "creative-agency", "photography");
  if (context.match(/industrial|manufacturing|plant|equipment|engineering/)) industryFit.push("industrial", "b2b-services");
  if (context.match(/founder|startup|venture|equity|investor|portfolio|pe\b/)) industryFit.push("founder-led", "private-equity", "consulting");
  if (context.match(/beauty|wellness|health|spa|skincare|lifestyle/)) industryFit.push("beauty", "wellness", "lifestyle");
  if (context.match(/agency|creative|design|brand|marketing/)) industryFit.push("creative-agency", "branding", "marketing");
  if (context.match(/law|legal|attorney|firm/)) industryFit.push("legal", "professional-services");
  if (context.match(/architect|interior|real estate|property/)) industryFit.push("architecture", "real-estate");
  if (context.match(/restaurant|food|hospitality|hotel/)) industryFit.push("hospitality", "food-beverage");
  if (context.match(/tech|software|saas|app|digital/)) industryFit.push("technology", "saas");
  if (industryFit.length === 0) industryFit.push("professional-services", "consulting");

  // Visual style summary label
  var styleLabel = [
    isDark ? "Dark" : "Light",
    isWarm ? "Warm" : "Cool",
    hasBrass ? "Brass Accent" : "",
    usedB ? "Editorial" : "Structured",
  ].filter(Boolean).join(" · ");

  return { visualTags: visualTags, toneTags: toneTags, industryFit: [...new Set(industryFit)], styleLabel: styleLabel };
}

async function saveToLibrary(brief, pages, layoutVariants, selectedVariants) {
  if (!window.storage) return;
  try {
    // Load existing saved builds
    var existing = [];
    try {
      var stored = await window.storage.get("spec-template-library");
      if (stored && stored.value) existing = JSON.parse(stored.value);
    } catch(e) {}

    var tags = inferTags(brief, pages, selectedVariants || layoutVariants);
    var id = "build-" + Date.now();
    var entry = {
      id: id,
      client: brief.brandName || "Unnamed Client",
      date: new Date().toISOString().slice(0, 10),
      source: "blueprint",
      style: tags.styleLabel,
      tags: tags.visualTags.concat(tags.toneTags),
      visualTags: tags.visualTags,
      toneTags: tags.toneTags,
      industryFit: tags.industryFit,
      industryUsed: brief.brandName || "",
      description: [brief.tagline, brief.hookStatement].filter(Boolean).join(" — ") || "Custom build",
      colors: brief.colors || {},
      fonts: brief.fonts || [],
      voiceRules: brief.voiceRules || [],
      selectedVariants: selectedVariants || {},
      pages: pages.map(function(p) {
        return {
          id: p.id,
          label: p.label,
          variant: (selectedVariants || {})[p.id] || "A",
          data: (selectedVariants || {})[p.id] === "B" && p.variantB ? p.variantB : p.variantA || p.data,
        };
      }),
    };

    // Deduplicate by client + date — replace if same client was saved today
    var deduped = existing.filter(function(e) {
      return !(e.client === entry.client && e.date === entry.date && e.source === "blueprint");
    });
    deduped.unshift(entry); // newest first
    if (deduped.length > 50) deduped = deduped.slice(0, 50); // cap at 50 entries

    await window.storage.set("spec-template-library", JSON.stringify(deduped));
  } catch(e) {
    console.warn("saveToLibrary failed:", e);
  }
}

const ALL_PAGES = [
  { id: "home",     label: "Home",               slug: "/" },
  { id: "work",     label: "Work / Portfolio",    slug: "/work" },
  { id: "services", label: "Services & Pricing",  slug: "/services" },
  { id: "about",    label: "About",               slug: "/about" },
  { id: "process",  label: "Process",             slug: "/process" },
  { id: "contact",  label: "Contact",             slug: "/contact" },
];

// ─── Elementor helpers ────────────────────────────────────────────────────────
function nid() { return Math.random().toString(16).slice(2, 9); }

function rPad(padY, padX) {
  padX = padX || "40";
  var y = parseInt(padY); var x = parseInt(padX);
  var yt = Math.round(y * 0.7); var ym = Math.round(y * 0.55);
  return {
    padding:        { unit:"px", top:String(y),  right:String(x),  bottom:String(y),  left:String(x),  isLinked:false },
    padding_tablet: { unit:"px", top:String(yt), right:"24",       bottom:String(yt), left:"24",        isLinked:false },
    padding_mobile: { unit:"px", top:String(ym), right:"20",       bottom:String(ym), left:"20",        isLinked:false },
  };
}

function rFont(px) {
  if (!px) return {};
  var t = Math.max(16, Math.round(px * 0.68));
  var m = Math.max(16, Math.round(px * 0.50));
  return {
    typography_font_size:        { unit:"px", size: px },
    typography_font_size_tablet: { unit:"px", size: t  },
    typography_font_size_mobile: { unit:"px", size: m  },
  };
}

function mkContainer(children, bg, opts) {
  opts = opts || {};
  var direction = opts.direction || "column";
  var s = {
    content_width: "boxed",
    flex_direction: direction,
    flex_gap: { unit:"px", size: opts.gap||"20", column: opts.gap||"20", row: opts.gap||"20" },
  };
  var padSettings = rPad(opts.padY || "80", opts.padX || "40");
  Object.assign(s, padSettings);
  if (bg) { s.background_background = "classic"; s.background_color = bg; }
  if (opts.minH) {
    s.min_height = { unit:"vh", size: opts.minH };
    s.min_height_tablet = { unit:"vh", size: Math.round(opts.minH * 0.8) };
    s.min_height_mobile = { unit:"px", size: 520 };
    s.justify_content = "center";
  }
  if (opts.center) { s.align_items = "center"; s.text_align = "center"; }
  if (opts.grow) s._flex_grow = opts.grow;
  if (direction === "row" && !opts.keepRow) {
    s.flex_direction_tablet = "column";
    s.flex_direction_mobile = "column";
  }
  if (direction === "row" && opts.buttonRow) {
    s.flex_direction_tablet = "row";
    s.flex_direction_mobile = "column";
    s.align_items_mobile = "center";
  }
  return { id: nid(), elType: "container", isInner: !!opts.isInner, settings: s, elements: children };
}

function mkHeading(text, color, size, opts) {
  opts = opts || {};
  var s = { title: text, header_size: size, title_color: color, align: opts.align || "left" };
  s.align_tablet = opts.align || "left";
  s.align_mobile = opts.align === "center" ? "center" : "left";
  if (opts.eyebrow) {
    s.typography_typography = "custom";
    s.typography_font_family = "Inter";
    s.typography_font_weight = "600";
    s.typography_text_transform = "uppercase";
    s.typography_letter_spacing = { unit:"px", size: 2.5 };
    s.typography_font_size = { unit:"px", size: 12 };
  } else {
    if (opts.font || opts.weight || opts.px || opts.italic) {
      s.typography_typography = "custom";
      if (opts.font)   s.typography_font_family = opts.font;
      if (opts.weight) s.typography_font_weight = String(opts.weight);
      if (opts.italic) s.typography_font_style = "italic";
      Object.assign(s, rFont(opts.px));
    }
  }
  return { id: nid(), elType: "widget", widgetType: "heading", settings: s, elements: [] };
}

function mkText(html, color, align) {
  align = align || "left";
  var s = { editor: "<p>" + html + "</p>", text_color: color };
  if (align === "center") { s.text_align = "center"; s.text_align_tablet = "center"; s.text_align_mobile = "center"; }
  return { id: nid(), elType: "widget", widgetType: "text-editor", settings: s, elements: [] };
}

function mkButton(label, bgColor, textColor) {
  return { id: nid(), elType: "widget", widgetType: "button",
    settings: {
      text: label, link: { url: "#" },
      background_color: bgColor, button_text_color: textColor,
      border_radius: { unit:"px", top:"2", right:"2", bottom:"2", left:"2", isLinked:true },
      typography_typography: "custom", typography_font_family: "Inter",
      typography_font_weight: "600", typography_text_transform: "uppercase",
      typography_letter_spacing: { unit:"px", size: 1.5 },
      padding:        { unit:"px", top:"16", right:"32", bottom:"16", left:"32", isLinked:false },
      padding_mobile: { unit:"px", top:"14", right:"24", bottom:"14", left:"24", isLinked:false },
    }, elements: [] };
}

function mkImagePh(caption) {
  return { id: nid(), elType: "widget", widgetType: "image",
    settings: { image: { url:"", id:"" }, caption_source:"custom", caption: caption||"" },
    elements: [] };
}

function mkSpacer(px) {
  return { id: nid(), elType: "widget", widgetType: "spacer",
    settings: {
      space:        { unit:"px", size: px },
      space_tablet: { unit:"px", size: Math.round(px * 0.7) },
      space_mobile: { unit:"px", size: Math.round(px * 0.5) },
    }, elements: [] };
}

function mkDivider(color) {
  return { id: nid(), elType: "widget", widgetType: "divider",
    settings: { color: color || "#E2DBCC", weight: { unit:"px", size: 1 } },
    elements: [] };
}

// ─── Page builders ────────────────────────────────────────────────────────────

// ─── Inspo variant matcher ────────────────────────────────────────────────────
// Returns true if any keyword appears in the inspo hint string.
// Used by page builders to pick which layout variant to recommend.
function inspoMatchesVariant(hint, keywords) {
  if (!hint) return false;
  var lower = hint.toLowerCase();
  return keywords.some(function(k) { return lower.indexOf(k) !== -1; });
}

function buildHomePage(C, brief, inspoHint) {
  // inspoHint: structural notes from crawled reference sites for this page type
  var hasInspo = !!inspoHint;
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      asphalt = C.asphalt, brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;

  var hero = mkContainer([
    mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true, align: "center" }),
    mkSpacer(24),
    mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1",
      { font: "Fraunces", weight: 300, px: 72, align: "center" }),
    mkSpacer(28),
    mkText(brief.heroSubhead || "Your subheadline here.", warmWhite, "center"),
    mkSpacer(40),
    mkContainer([
      mkButton(brief.heroCta1 || "See the work", brass, ink),
      mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
    ], null, { direction: "row", gap: "16", padY: "0", center: true, isInner: true, buttonRow: true }),
  ], ink, { padY: "120", minH: 90, center: true });

  var hook = mkContainer([
    mkHeading(brief.hookStatement || "Your honest hook statement.", ink, "h2",
      { font: "Inter", weight: 700, px: 36, align: "center" }),
  ], bone, { padY: "100", center: true });

  var cards = (function() {
    var cds = (brief.serviceCards || [
      ["Proof", "Testimonials and case studies that help your team close."],
      ["People", "Recruiting, origin stories, the human core of the company."],
      ["Brand", "Founder stories, vision, the company's own voice."],
      ["Exit", "The story a business shows when it is ready to be bought."],
    ]).map(function(pair) {
      var title = pair[0]; var body = pair[1];
      var c = mkContainer([
        mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
        mkSpacer(8),
        mkText(body, stone),
      ], "#ffffff", { padY: "32", isInner: true });
      c.settings.border_border = "solid";
      c.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "0", left: "3", isLinked: false };
      c.settings.border_color = brass;
      c.settings.padding = { unit: "px", top: "32", right: "28", bottom: "32", left: "28", isLinked: false };
      c.settings._flex_grow = 1;
      return c;
    });
    var row = mkContainer(cds, null, { direction: "row", gap: "20", padY: "0", isInner: true });
    row.settings.flex_wrap = "wrap";
    return mkContainer([row], bone, { padY: "80" });
  })();

  var split = (function() {
    var left = mkContainer([
      mkHeading(brief.differenceEyebrow || "Why one maker", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.differenceH2 || "One person. The whole film.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var right = mkContainer([
      mkText(brief.differenceBody || "[The difference — explain what sets this apart. Pulled from brand brief.]", text),
    ], null, { padY: "0", grow: 1, isInner: true });
    var row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true });
    return mkContainer([row], bone, { padY: "96" });
  })();

  var whoSection = (function() {
    var left = mkContainer([
      mkHeading(brief.whoEyebrow || "Who it is for", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.whoH2 || "For the underfilmed.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var right = mkContainer([
      mkText(brief.whoBody || "[Who this is for — pulled from brand brief. Describe the ideal client specifically.]", text),
    ], null, { padY: "0", grow: 1, isInner: true });
    var row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true });
    return mkContainer([row], bone, { padY: "96" });
  })();

  var work = mkContainer([
    mkHeading(brief.workH2 || "Recent work.", ink, "h2", { px: 44, weight: 800 }),
    mkSpacer(48),
    mkContainer(
      (brief.workItems || ["Film 1","Film 2","Film 3"]).map(function(w) {
        return mkContainer([mkImagePh(w), mkSpacer(12), mkText("<strong>" + w + "</strong>", stone)],
          null, { padY: "0", grow: 1, isInner: true });
      }), null, { direction: "row", gap: "24", padY: "0", isInner: true }
    ),
  ], bone, { padY: "80" });

  var pricingTeaser = mkContainer([
    mkHeading(brief.pricingH2 || "Clear prices. No discovery-call maze.", ink, "h2",
      { px: 44, weight: 800, align: "center" }),
    mkSpacer(24),
    mkText(brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open.", stone, "center"),
    mkSpacer(40),
    mkContainer([mkButton(brief.pricingCta || "See packages", brass, ink)],
      null, { padY: "0", center: true, isInner: true }),
  ], bone, { padY: "112", center: true });

  var closing = mkContainer([
    mkHeading(brief.tagline || "The stories that move a company forward.", warmWhite, "h1",
      { font: "Fraunces", weight: 300, px: 64, italic: true, align: "center" }),
    mkSpacer(48),
    mkContainer([mkButton(brief.closingCta || "Start a project", brass, ink)],
      null, { padY: "0", center: true, isInner: true }),
  ], ink, { padY: "120", minH: 70, center: true });

  return { version: "0.4", title: "Home", type: "page", page_settings: {},
    content: [hero, hook, cards, split, whoSection, work, pricingTeaser, closing] };
}

function buildWorkPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt, text = C.text;

  var header = mkContainer([
    mkHeading(brief.workEyebrow || "Work", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.workH1 || "Selected work.", ink, "h1", { weight: 800, px: 64 }),
    mkSpacer(16),
    mkText(brief.workIntro || "A look at the stories so far. Customer and team films, brand work, and the films that help a company show what it has become.", text),
  ], bone, { padY: "88" });

  var closing = mkContainer([mkButton("Start a project", brass, ink)], bone, { padY: "80", center: true });

  // ── Variant A: Standard grid with filter row ──────────────────────────────
  var filterCategories = brief.workCategories || ["All", "Stories & testimonials", "People & culture", "Brand & leadership", "Exit"];
  var filterRow = mkContainer([
    mkContainer(
      filterCategories.map(function(label, i) {
        var btn = mkButton(label, i === 0 ? brass : "transparent", i === 0 ? ink : brassDp);
        btn.settings.border_border = "solid";
        btn.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
        btn.settings.border_color = i === 0 ? brass : brassDp;
        btn.settings.padding = { unit:"px", top:"10", right:"20", bottom:"10", left:"20", isLinked:false };
        return btn;
      }), null, { direction: "row", gap: "10", padY: "0", isInner: true }
    ),
  ], bone, { padY: "24", padX: "40" });

  var gridTiles = (brief.workItems || []).map(function(title) {
    var tile = mkContainer([
      mkImagePh(title),
      mkSpacer(16),
      mkHeading(title, ink, "h4", { weight: 700 }),
      mkSpacer(4),
      mkText("[Project type — fill in]", stone),
      mkSpacer(4),
      mkText("[One line of context about this project]", stone),
    ], "#ffffff", { padY: "0", isInner: true });
    tile.settings.border_border = "solid";
    tile.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
    tile.settings.border_color = "#E2DBCC";
    tile.settings._flex_grow = 1;
    return tile;
  });

  // If no work items in brief, show flagged placeholder tiles
  if (gridTiles.length === 0) {
    for (var wi = 0; wi < 6; wi++) {
      var pt = mkContainer([
        mkImagePh("[Upload project image " + (wi+1) + "]"),
        mkSpacer(16),
        mkHeading("[Project title " + (wi+1) + "]", ink, "h4", { weight: 700 }),
        mkSpacer(4),
        mkText("[Project type]", stone),
      ], "#ffffff", { padY: "0", isInner: true });
      pt.settings.border_border = "solid";
      pt.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
      pt.settings.border_color = "#E2DBCC";
      pt.settings._flex_grow = 1;
      gridTiles.push(pt);
    }
  }
  var grid = mkContainer(gridTiles, null, { direction: "row", gap: "24", padY: "0", isInner: true });
  grid.settings.flex_wrap = "wrap";
  var gridSection = mkContainer([grid], bone, { padY: "64" });

  var variantA = { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [header, filterRow, gridSection, closing] };

  // ── Variant B: Editorial — featured hero tile + supporting grid ───────────
  var items = brief.workItems || [];
  var featured = items[0] || "[Featured project title]";
  var featuredTile = mkContainer([
    mkContainer([
      mkImagePh(featured),
    ], null, { padY: "0", grow: 1, isInner: true }),
    mkContainer([
      mkHeading("Featured", brass, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(featured, ink, "h2", { weight: 800, px: 44 }),
      mkSpacer(12),
      mkText("[Add a one paragraph description of this project when publishing.]", text),
      mkSpacer(24),
      mkButton("View project", brass, ink),
    ], null, { padY: "48", grow: 1, isInner: true }),
  ], "#ffffff", { direction: "row", gap: "0", padY: "0" });
  featuredTile.settings.border_border = "solid";
  featuredTile.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  featuredTile.settings.border_color = "#E2DBCC";

  var supportingItems = items.length > 1 ? items.slice(1) : ["[Project 2]", "[Project 3]", "[Project 4]", "[Project 5]"];
  var supportingTiles = supportingItems.map(function(title) {
    var t = mkContainer([
      mkImagePh(title),
      mkSpacer(12),
      mkHeading(title, ink, "h4", { weight: 700 }),
      mkSpacer(4),
      mkText("[Project type]", stone),
    ], "#ffffff", { padY: "24", isInner: true });
    t.settings.border_border = "solid";
    t.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
    t.settings.border_color = "#E2DBCC";
    t.settings._flex_grow = 1;
    return t;
  });
  var supportingRow = mkContainer(supportingTiles, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  supportingRow.settings.flex_wrap = "wrap";

  var editorialSection = mkContainer([featuredTile, mkSpacer(20), supportingRow], bone, { padY: "64" });

  var variantB = { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [header, editorialSection, closing] };

  // Recommend B if inspo hints suggest editorial/featured/case-study style
  var recommended = inspoMatchesVariant(inspoHint, ["editorial", "featured", "case study", "full bleed", "hero image", "spotlight"])
    ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

function buildServicesPage(C, brief, inspoHint) {
  var hasInspo = !!inspoHint;
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt || "#2B2823", text = C.text;

  var header = mkContainer([
    mkHeading("Services & pricing", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading("Every way to put your company on film.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(20),
    mkText("Real prices, in the open. Pick a package, or build a plan. No 30 minute call required to learn what something costs.", text),
  ], bone, { padY: "88" });

  // Three tiers on dark background
  var tiers = (brief.pricingTiers || [
    ["01  Front Door", "CASH FLOW & TRUST", "Productized story and testimonial packages with set scope and open pricing. The simple way to start working together.", "From 2.5K per film"],
    ["02  Premium", "MARGIN & CRAFT", "Brand films, founder stories, and exit work. Built around your story and priced to the project. The films that move the needle.", "From 12K per film"],
    ["03  The Partner Plan", "RECURRING", "An embedded video partner across your portfolio or for one company. Predictable monthly output, no constant re-quoting.", "From 4K per month"],
  ]).map(function(tier) {
    var name = tier[0]; var sub = tier[1]; var desc = tier[2]; var price = tier[3];
    var card = mkContainer([
      mkHeading(name, warmWhite, "h3", { weight: 700, px: 28 }),
      mkSpacer(6),
      mkHeading(sub || "", stone, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkDivider("#4a4640"),
      mkSpacer(20),
      mkText(desc || "", warmWhite),
      mkSpacer(24),
      mkHeading(price || "", brass, "h3", { weight: 700, px: 32 }),
    ], asphalt, { padY: "48", padX: "36", isInner: true });
    card.settings._flex_grow = 1;
    return card;
  });

  var tiersRow = mkContainer(tiers, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  tiersRow.settings.flex_wrap = "wrap";

  // Always included block
  var alwaysIncluded = mkContainer([
    mkHeading("Always included, in every package", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("A set number of revision rounds, agreed up front, so feedback never runs open-ended. Professional lighting and audio, color grading, and a licensed music track. Delivery in web and social formats, plus short cutdowns from the same footage.", text),
  ], "#ffffff", { padY: "32", padX: "36", isInner: true });
  alwaysIncluded.settings.border_border = "solid";
  alwaysIncluded.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  alwaysIncluded.settings.border_color = "#E2DBCC";

  var tiersSection = mkContainer([tiersRow, mkSpacer(24), alwaysIncluded], ink, { padY: "80" });

  // Full menu — grouped by category
  var menuCategories = [
    {
      label: "Proof & Trust",
      items: [
        ["Customer Story", "2.5K to 4.5K", "A customer tells their before and after, in their own words.", "Half-day shoot at one location, 1 to 2 minute edit, 2 social cutdowns, 2 revision rounds."],
        ["Case Study Film", "4K to 8K", "Problem, solution, and the measurable result.", "One or two locations, on-screen data and graphics, 2 to 3 minute edit, 3 cutdowns."],
        ["Partner Testimonial", "2.5K to 4.5K", "A vendor or partner vouches for you on camera.", "Half-day shoot, 1 to 2 minute edit, 2 cutdowns."],
        ["Sales Reel", "5K to 10K", "A short capabilities film the team can send to help close.", "Multi-location shoot, b-roll, 2 to 3 minute edit."],
      ]
    },
    {
      label: "People & Culture",
      items: [
        ["Technician Origin Story", "3K to 6K", "Where one of your people came from, and why they stay. The signature piece.", "Half to full-day shoot, 2 to 3 minute edit, photo stills."],
        ["Day in the Life", "2.5K to 4.5K", "A teammate's real workday, told simply.", "Half-day shoot, 1 to 2 minute edit, 2 cutdowns."],
        ["Why Work Here", "4K to 8K", "The recruiting film that fills your pipeline.", "Full-day shoot, several voices, 2 minute edit plus 30 and 60 second cuts."],
        ["Culture & Values Film", "6K to 12K", "What the company stands for, on screen.", "Multi-location shoot, 2 to 4 minute edit, cutdowns."],
      ]
    },
    {
      label: "Leadership & Vision",
      items: [
        ["Founder Story", "6K to 15K", "The origin of the company, told with weight.", "Interview and b-roll, archival photo integration, 3 to 5 minute edit."],
        ["Leadership Address", "3K to 6K", "A clear message from the top, to the team or the market.", "Studio or on-site shoot, teleprompter, 1 to 3 minute edit."],
        ["Vision Film", "6K to 12K", "Where the company is headed next.", "Shoot, motion graphics, 2 to 3 minute edit."],
        ["All-Hands Video", "2.5K to 5K", "Internal comms people actually watch.", "Shoot, 1 to 3 minute edit."],
      ]
    },
    {
      label: "Exit & Value Creation",
      items: [
        ["About-Us Brand Film", "12K to 30K", "The company's story, beautifully told, for the website.", "Multi-day or multi-location shoot, original music, 2 to 4 minute edit, cutdowns."],
        ["Exit-Ready Company Film", "25K to 75K+", "The narrative buyers see in the room. Built for the data room and the management presentation.", "Discovery, scripting, multi-location shoot, leadership and customer voices, 3 to 6 minute edit, plus short cuts."],
        ["Milestone Film", "10K to 20K", "Mark a major moment during the hold period.", "Shoot, 2 to 4 minute edit."],
        ["Portfolio Showcase", "Custom", "One film template across many portfolio companies, made for the firm.", "A repeatable format and a per-company rate. Scoped with the firm."],
      ]
    },
  ];

  var menuSections = menuCategories.map(function(cat) {
    var rows = cat.items.map(function(item) {
      var name = item[0]; var price = item[1]; var desc = item[2]; var incl = item[3];
      var namePrice = mkContainer([
        mkHeading(name, ink, "h4", { weight: 700, px: 18 }),
        mkHeading(price, brassDp, "h5", { weight: 600 }),
      ], null, { direction: "row", gap: "20", padY: "0", isInner: true });
      var row = mkContainer([
        namePrice,
        mkSpacer(8),
        mkText(desc, text),
        mkSpacer(4),
        mkText("<em>Includes: " + incl + "</em>", stone),
        mkSpacer(20),
        mkDivider(),
      ], null, { padY: "0", isInner: true });
      return row;
    });

    return mkContainer([
      mkHeading(cat.label, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(8),
      mkDivider(brass),
      mkSpacer(24),
    ].concat(rows), null, { padY: "0", isInner: true });
  });

  var menuRow = mkContainer(menuSections, null, { direction: "row", gap: "48", padY: "0", isInner: true });
  menuRow.settings.flex_wrap = "wrap";
  var menuSection = mkContainer([
    mkHeading("The full menu", ink, "h2", { weight: 800, px: 44 }),
    mkSpacer(48),
    menuRow,
  ], bone, { padY: "80" });

  // How pricing works
  var pricingNote = mkContainer([
    mkHeading("How pricing works", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("Every price is a starting point. It scales with scope: more locations, more people, longer films, and more revision rounds. Most films come in good, better, and best versions, so a client can choose by budget without a negotiation. Rates rise with experience and reputation. Fair to start, and they climb as the work proves itself.", text),
  ], "#ffffff", { padY: "48", padX: "40" });
  pricingNote.settings.border_border = "solid";
  pricingNote.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"3", isLinked:false };
  pricingNote.settings.border_color = brass;

  var pricingNoteSection = mkContainer([pricingNote], bone, { padY: "48" });

  var closing = mkContainer([
    mkText("Not sure where to start? Tell me about the company.", stone, "center"),
    mkSpacer(24),
    mkButton("Start a project", brass, ink),
  ], bone, { padY: "80", center: true });

  return { version: "0.4", title: "Services & Pricing", type: "page", page_settings: {},
    content: [header, tiersSection, menuSection, pricingNoteSection, closing] };
}

function buildAboutPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt, text = C.text;

  var header = mkContainer([
    mkHeading(brief.aboutEyebrow || "About", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.aboutH1 || "One person. Every frame.", ink, "h1", { weight: 800, px: 64 }),
  ], bone, { padY: "88" });

  var closing = mkContainer([mkButton("Start a project", brass, ink)], bone, { padY: "80", center: true });

  // ── Variant A: Story + portrait split ─────────────────────────────────────
  var storyLeft = mkContainer([
    mkText(brief.aboutStory || "[Founder story — pulled from brief. Fill in if missing.]", text),
    mkSpacer(24),
    mkText(brief.aboutStory2 || "[Second paragraph — additional context about the founder's background and what led to this work.]", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var storyRight = mkContainer([
    mkImagePh("Founder portrait — on location, not in a studio."),
  ], null, { padY: "0", grow: 1, isInner: true });

  var storyRow = mkContainer([storyLeft, storyRight], null, { direction: "row", gap: "64", padY: "0", isInner: true });
  var storySection = mkContainer([storyRow], bone, { padY: "80" });

  var whySection = mkContainer([
    mkHeading(brief.whyEyebrow || "Why this approach", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.whyH2 || "One mind on the whole project.", ink, "h2", { weight: 800, px: 44 }),
    mkSpacer(24),
    mkText(brief.whyOneMaker || "[Why this approach — pulled from brief. Explain what makes the method different and why it matters to clients.]", text),
  ], "#ffffff", { padY: "80" });

  var values = (brief.founderValues || ["Grounded", "Forward", "Exact", "Singular", "Human"]).map(function(v) {
    var card = mkContainer([
      mkSpacer(8),
      mkHeading(v, ink, "h3", { weight: 700, px: 22 }),
    ], null, { padY: "32", isInner: true });
    card.settings.border_border = "solid";
    card.settings.border_width = { unit:"px", top:"0", right:"0", bottom:"0", left:"3", isLinked:false };
    card.settings.border_color = brass;
    card.settings.padding = { unit:"px", top:"16", right:"20", bottom:"16", left:"20", isLinked:false };
    card.settings._flex_grow = 1;
    return card;
  });
  var valuesRow = mkContainer(values, null, { direction: "row", gap: "16", padY: "0", isInner: true });
  valuesRow.settings.flex_wrap = "wrap";
  var valuesSection = mkContainer([
    mkHeading(brief.valuesEyebrow || "What we stand for", brassDp, "h6", { eyebrow: true }),
    mkSpacer(32),
    valuesRow,
  ], bone, { padY: "72" });

  var variantA = { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [header, storySection, whySection, valuesSection, closing] };

  // ── Variant B: Vertical milestone timeline ─────────────────────────────────
  var milestones = (brief.milestones || [
    ["The beginning", "How it started and what drove the decision to build this."],
    ["Finding the niche", "The moment the right clients and right work became clear."],
    ["The work that mattered", "The projects that defined the approach and proved the model."],
    ["Where it stands now", "What the studio is today and where it is headed."],
  ]);

  var timelineItems = milestones.map(function(m, i) {
    var isEven = i % 2 === 0;
    var dot = mkContainer([], brass, { padY: "0", isInner: true });
    dot.settings.width = { unit:"px", size: 12 };
    dot.settings.height = { unit:"px", size: 12 };
    dot.settings.border_radius = { unit:"%", top:"50", right:"50", bottom:"50", left:"50", isLinked:true };

    return mkContainer([
      mkContainer([dot], null, { padY: "0", isInner: true }),
      mkSpacer(20),
      mkHeading(m[0], ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(8),
      mkText(m[1], text),
    ], isEven ? bone : "#ffffff", { padY: "48", padX: "40", isInner: false });
  });

  var timeline = mkContainer(timelineItems, null, { gap: "0", padY: "0" });

  var portraitSection = mkContainer([
    mkContainer([
      mkImagePh("Founder portrait — on location."),
    ], null, { padY: "0", grow: 1, isInner: true }),
    mkContainer([
      mkHeading(brief.whyEyebrow || "Why this approach", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkText(brief.whyOneMaker || "[Why this approach — pulled from brief.]", text),
      mkSpacer(32),
      mkButton("Start a project", brass, ink),
    ], null, { padY: "0", grow: 1, isInner: true }),
  ], bone, { direction: "row", gap: "64", padY: "80" });

  var variantB = { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [header, timeline, portraitSection, valuesSection, closing] };

  var recommended = inspoMatchesVariant(inspoHint, ["timeline", "journey", "history", "milestones", "story arc", "chapters"])
    ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

function buildProcessPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;

  var header = mkContainer([
    mkHeading(brief.processEyebrow || "Process", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.processH1 || "How it gets made.", ink, "h1", { weight: 800, px: 64 }),
    mkSpacer(16),
    mkText(brief.processIntro || "Simple and calm, from first call to final files. No maze, no surprises.", text),
  ], bone, { padY: "88" });

  var defaultSteps = [
    ["01", "The intro", "A short call to understand the company and the goal. No charge, no maze."],
    ["02", "The plan", "A clear scope and a fixed quote up front. You know the price before anything starts."],
    ["03", "The work", "One focused engagement, lean and calm. No chaos, no surprises on your end."],
    ["04", "The review", "A first draft, then a set number of revision rounds. No open-ended feedback loops."],
    ["05", "Delivery", "Final files in every format you need, ready to use immediately."],
  ];
  var steps = brief.processSteps || defaultSteps;

  var callout = mkContainer([
    mkHeading(brief.calloutEyebrow || "What to expect", brass, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText(brief.calloutBody || "[What to expect — timeline and delivery details. Fill in from client brief.]", warmWhite),
  ], ink, { padY: "80" });

  var closing = mkContainer([mkButton("Start a project", brass, ink)], bone, { padY: "80", center: true });

  // ── Variant A: Two-column numbered grid ───────────────────────────────────
  var gridSteps = steps.map(function(step, i) {
    var num = step[0]; var title = step[1]; var body = step[2];
    return mkContainer([
      mkHeading(num, brass, "h1", { font: "Fraunces", weight: 300, px: 80 }),
      mkSpacer(24),
      mkDivider(brass),
      mkSpacer(24),
      mkHeading(title, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(12),
      mkText(body, text),
    ], i % 2 === 0 ? bone : "#ffffff", { padY: "56", padX: "40" });
  });

  var stepsRow1 = mkContainer(gridSteps.slice(0, 2), null, { direction: "row", gap: "0", padY: "0", isInner: true });
  var stepsRow2 = mkContainer(gridSteps.slice(2, 4), null, { direction: "row", gap: "0", padY: "0", isInner: true });
  var stepsRow3 = gridSteps.length > 4
    ? mkContainer([gridSteps[4]], null, { direction: "row", gap: "0", padY: "0", isInner: true })
    : null;
  var gridContent = stepsRow3
    ? mkContainer([stepsRow1, stepsRow2, stepsRow3], bone, { padY: "0", padX: "0", gap: "0" })
    : mkContainer([stepsRow1, stepsRow2], bone, { padY: "0", padX: "0", gap: "0" });

  var variantA = { version: "0.4", title: "Process", type: "page", page_settings: {},
    content: [header, gridContent, callout, closing] };

  // ── Variant B: Horizontal flowing timeline ────────────────────────────────
  var timelineSteps = steps.map(function(step) {
    var num = step[0]; var title = step[1]; var body = step[2];
    var card = mkContainer([
      mkHeading(num, brass, "h2", { font: "Fraunces", weight: 300, px: 56 }),
      mkSpacer(16),
      mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
      mkSpacer(8),
      mkText(body, text),
    ], "#ffffff", { padY: "40", padX: "32", isInner: true });
    card.settings.border_border = "solid";
    card.settings.border_width = { unit:"px", top:"3", right:"0", bottom:"0", left:"0", isLinked:false };
    card.settings.border_color = brass;
    card.settings._flex_grow = 1;
    return card;
  });
  var timelineRow = mkContainer(timelineSteps, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  timelineRow.settings.flex_wrap = "wrap";
  var timelineSection = mkContainer([timelineRow], bone, { padY: "80" });

  var variantB = { version: "0.4", title: "Process", type: "page", page_settings: {},
    content: [header, timelineSection, callout, closing] };

  var recommended = inspoMatchesVariant(inspoHint, ["timeline", "horizontal", "flowing", "steps across", "linear", "connector"])
    ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

function buildContactPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;

  var formPlaceholder = mkContainer([
    mkText("Form fields: Name · Company · Email · What do you need? · Budget range (optional) · Message", stone),
    mkSpacer(8),
    mkText("<em>Connect a forms plugin (Fluent Forms or WPForms) and replace this with the live shortcode.</em>", stone),
  ], "#ffffff", { padY: "32", padX: "36" });
  formPlaceholder.settings.border_border = "solid";
  formPlaceholder.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  formPlaceholder.settings.border_color = "#E2DBCC";

  var closingDark = mkContainer([
    mkHeading(brief.tagline || "Ready to get started?", warmWhite, "h2",
      { font: "Fraunces", weight: 300, px: 52, italic: true, align: "center" }),
    mkSpacer(40),
    mkHeading(brief.signatureLine || "", stone, "h4", { align: "center" }),
  ], ink, { padY: "96", center: true });

  // ── Variant A: Stacked — header, form, reassurance, info split ────────────
  var headerA = mkContainer([
    mkHeading(brief.contactEyebrow || "Contact", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.contactH1 || "Tell us about your project.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(16),
    mkText(brief.contactIntro || "A quick note about what you need. You will get a real reply from a real person, usually within one business day.", text),
  ], bone, { padY: "88" });

  var formSectionA = mkContainer([
    formPlaceholder,
    mkSpacer(32),
    mkContainer([mkButton(brief.contactCta || "Send it over", brass, ink)], null, { padY: "0", isInner: true }),
    mkSpacer(24),
    mkText(brief.contactReassurance || "No sales team. No automated funnel. A real reply from a real person.", stone),
  ], bone, { padY: "64" });

  var infoLeft = mkContainer([
    mkHeading("What happens next", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("You send a note. Within one business day, you hear back from the person who actually does the work. No account manager, no intro call just to learn what you need.", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var infoRight = mkContainer([
    mkHeading("Not sure what you need?", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("Tell us what the company does and what you are trying to show. That is enough to start. The right approach will become clear in the first conversation.", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var infoRow = mkContainer([infoLeft, infoRight], null, { direction: "row", gap: "64", padY: "0", isInner: true });
  var infoSection = mkContainer([infoRow], bone, { padY: "72" });

  var variantA = { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [headerA, formSectionA, infoSection, closingDark] };

  // ── Variant B: Split — big statement left, lean form right ────────────────
  var statementLeft = mkContainer([
    mkHeading(brief.contactEyebrow || "Contact", brassDp, "h6", { eyebrow: true }),
    mkSpacer(24),
    mkHeading(brief.contactH1 || "Tell us about your project.", ink, "h2", { font: "Fraunces", weight: 300, px: 56 }),
    mkSpacer(32),
    mkText(brief.contactIntro || "A quick note about what you need. You will get a real reply from a real person, usually within one business day.", text),
    mkSpacer(32),
    mkText(brief.contactReassurance || "No sales team. No automated funnel. A real reply from a real person.", stone),
  ], null, { padY: "0", grow: 1, isInner: true });

  var formRight = mkContainer([
    formPlaceholder,
    mkSpacer(24),
    mkButton(brief.contactCta || "Send it over", brass, ink),
  ], null, { padY: "0", grow: 1, isInner: true });

  var splitRow = mkContainer([statementLeft, formRight], null, { direction: "row", gap: "80", padY: "0", isInner: true });
  var splitSection = mkContainer([splitRow], bone, { padY: "96" });

  var variantB = { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [splitSection, closingDark] };

  var recommended = inspoMatchesVariant(inspoHint, ["split", "two column", "side by side", "statement", "minimal", "direct", "lean"])
    ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

// ─── Inspo pattern merger ─────────────────────────────────────────────────────
// Distills all crawl results into a per-page-type hint object.
// Each key is a page type; value is a merged string of structural notes from
// every URL that had that page type. Gets passed into page builders so they
// can make layout decisions informed by real reference sites.
function buildInspoContext(crawlResults, storedPatterns) {
  // Single shared pool — all patterns from all pages merged together.
  // Nothing is routed by page type. Every builder draws from the full pool.
  var allNotes = [];

  // Stored patterns from previous sessions
  if (storedPatterns) {
    Object.keys(storedPatterns).forEach(function(key) {
      if (storedPatterns[key]) allNotes.push(storedPatterns[key]);
    });
  }

  // Current session crawl results — all pages, all sites
  Object.keys(crawlResults).forEach(function(url) {
    var result = crawlResults[url];
    if (!result || result.error || !result.patterns) return;
    if (result.patterns.siteNotes) allNotes.push(result.patterns.siteNotes);
    var pages = result.patterns.pages || {};
    Object.keys(pages).forEach(function(pageType) {
      if (pages[pageType]) allNotes.push("[" + pageType + "] " + pages[pageType]);
    });
  });

  return allNotes.join(" | ");
}

function generatePages(brief, selectedPages, inspoContext, aiRecs) {
  var colors = brief.colors || {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  // aiRecs: { work: {variant:"B", reason:"..."}, about: {variant:"A",...}, ... }
  var recs = aiRecs || {};

  return selectedPages.map(function(pid) {
    var label = (ALL_PAGES.find(function(p) { return p.id === pid; }) || {}).label || pid;
    var result = null;

    if (pid === "home") {
      var data = buildHomePage(colors, brief, inspoContext);
      return { id: pid, label: label, data: data, variantA: data, variantB: null, recommended: "A", hasVariants: false };
    }
    if (pid === "services") {
      var data = buildServicesPage(colors, brief, inspoContext);
      return { id: pid, label: label, data: data, variantA: data, variantB: null, recommended: "A", hasVariants: false };
    }
    if (pid === "work")    result = buildWorkPage(colors, brief, inspoContext);
    if (pid === "about")   result = buildAboutPage(colors, brief, inspoContext);
    if (pid === "process") result = buildProcessPage(colors, brief, inspoContext);
    if (pid === "contact") result = buildContactPage(colors, brief, inspoContext);
    if (!result) return null;

    // Use AI recommendation if available, otherwise fall back to keyword match
    var recommended = (recs[pid] && recs[pid].variant) ? recs[pid].variant : result.recommended;
    var reason = (recs[pid] && recs[pid].reason) ? recs[pid].reason : null;

    return {
      id: pid,
      label: label,
      data: recommended === "B" ? result.variantB : result.variantA,
      variantA: result.variantA,
      variantB: result.variantB,
      recommended: recommended,
      reason: reason,
      hasVariants: true,
    };
  }).filter(function(p) { return p !== null; });
}

// ─── HTML Preview ─────────────────────────────────────────────────────────────
function buildPreviewHTML(brief, activePage, variant) {
  variant = variant || "A";
  var C = brief.colors || {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt || "#2B2823",
      text = C.text || "#2A2722";
  var fontUrl = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Inter:wght@400;600;700;800&display=swap";

  var sections = {
    home:
      "<section style='background:" + ink + ";min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>" + (brief.brandName || "Brand Name") + "</div>" +
        "<h1 style='font-family:Fraunces,serif;font-weight:300;font-size:clamp(48px,7vw,80px);line-height:1.06;color:" + warmWhite + ";max-width:900px;margin:0 0 28px;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
        "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;max-width:560px;margin:0 0 40px;'>" + (brief.heroSubhead || "Your subheadline here.") + "</p>" +
        "<div style='display:flex;gap:16px;flex-wrap:wrap;justify-content:center;'>" +
          "<a style='padding:14px 32px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>" + (brief.heroCta1 || "See the work") + "</a>" +
          "<a style='padding:14px 32px;border:1px solid " + brass + ";color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>" + (brief.heroCta2 || "See pricing") + "</a>" +
        "</div>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:100px 40px;text-align:center;'>" +
        "<h2 style='font-size:clamp(24px,3.5vw,40px);font-weight:700;color:" + ink + ";max-width:800px;margin:0 auto;'>" + (brief.hookStatement || "Your honest hook statement.") + "</h2>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
        (brief.serviceCards || [["Proof","Testimonials and case studies."],["People","Recruiting and culture films."],["Brand","Founder stories, vision."],["Exit","The story before the sale."]]).map(function(pair) {
          return "<div style='background:#fff;border-left:3px solid " + brass + ";padding:28px;'><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:8px;'>" + pair[0] + "</div><div style='font-size:14px;color:" + stone + ";line-height:1.6;'>" + pair[1] + "</div></div>";
        }).join("") +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:96px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:80px;max-width:1160px;margin:0 auto;align-items:center;'>" +
        "<div><div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.differenceEyebrow || "Why one maker") + "</div>" +
        "<h2 style='font-size:clamp(32px,4vw,52px);font-weight:800;color:" + ink + ";line-height:1.1;margin:0;'>" + (brief.differenceH2 || "One person. The whole film.") + "</h2></div>" +
        "<div style='font-size:17px;color:" + text + ";line-height:1.65;'>" + (brief.differenceBody || "Supporting body copy goes here.") + "</div>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:80px 40px;'>" +
        "<h2 style='font-size:clamp(28px,3.5vw,44px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>" + (brief.workH2 || "Recent work.") + "</h2>" +
        "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1160px;'>" +
          (brief.workItems || ["Film 1","Film 2","Film 3"]).map(function(w) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>" + w + "</div><div style='font-size:14px;color:" + stone + ";margin-top:12px;font-weight:600;'>" + w + "</div></div>";
          }).join("") +
        "</div>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:112px 40px;text-align:center;'>" +
        "<h2 style='font-size:clamp(28px,3.5vw,48px);font-weight:800;color:" + ink + ";max-width:640px;margin:0 auto 24px;'>" + (brief.pricingH2 || "Clear prices. No discovery-call maze.") + "</h2>" +
        "<p style='color:" + stone + ";max-width:480px;margin:0 auto 40px;'>" + (brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open.") + "</p>" +
        "<a style='padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>" + (brief.pricingCta || "See packages") + "</a>" +
      "</section>" +
      "<section style='background:" + ink + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 40px;text-align:center;'>" +
        "<h2 style='font-family:Fraunces,serif;font-weight:300;font-style:italic;font-size:clamp(36px,5vw,68px);color:" + warmWhite + ";max-width:800px;margin:0 0 48px;line-height:1.1;'>" + (brief.tagline || "The stories that move a company forward.") + "</h2>" +
        "<a style='padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>" + (brief.closingCta || "Start a project") + "</a>" +
      "</section>",


    work: (function() {
      var items = brief.workItems || ["Project 1","Project 2","Project 3","Project 4","Project 5","Project 6"];
      var workHeader = "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.workEyebrow||"Work") + "</div>" +
        "<h1 style='font-size:clamp(40px,6vw,64px);font-weight:800;color:" + ink + ";margin:0 0 20px;'>" + (brief.workH1||"Selected work.") + "</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:640px;'>" + (brief.workIntro||"A look at the work so far.") + "</p>" +
        "</section>";
      var workClose = "<section style='background:" + bone + ";padding:80px 40px;text-align:center;'><a style='padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>Start a project</a></section>";

      if (variant === "B") {
        // Editorial: featured hero + supporting grid
        var featured = items[0] || "Featured Project";
        var rest = items.slice(1);
        return workHeader +
          "<section style='background:" + bone + ";padding:64px 40px;'>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:1160px;margin:0 auto 32px;border:1px solid #E2DBCC;'>" +
              "<div style='background:#e0ddd7;min-height:360px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>" + featured + " — hero image</div>" +
              "<div style='padding:56px 48px;background:#fff;'>" +
                "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Featured</div>" +
                "<h2 style='font-size:clamp(28px,3.5vw,40px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>" + featured + "</h2>" +
                "<p style='font-size:16px;color:" + text + ";line-height:1.65;margin-bottom:32px;'>The standout piece. Add the description when publishing.</p>" +
                "<a style='padding:14px 32px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>View project</a>" +
              "</div>" +
            "</div>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
              rest.map(function(title) {
                return "<div style='background:#fff;border:1px solid #E2DBCC;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>" + title + "</div>" +
                  "<div style='padding:20px;'><div style='font-size:15px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + title + "</div><div style='font-size:12px;color:" + stone + ";'>Project context.</div></div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</section>" +
          workClose;
      }
      // Variant A: filter row + standard grid
      return workHeader +
        "<section style='background:" + bone + ";padding:16px 40px;border-top:1px solid #E2DBCC;border-bottom:1px solid #E2DBCC;'>" +
          "<div style='display:flex;gap:10px;flex-wrap:wrap;'>" +
            ["All","Stories & testimonials","People & culture","Brand & leadership","Exit"].map(function(label, i) {
              return "<a style='padding:10px 20px;font-size:13px;font-weight:600;text-decoration:none;border-radius:2px;letter-spacing:.05em;text-transform:uppercase;background:" + (i===0?brass:"transparent") + ";color:" + (i===0?ink:brassDp) + ";border:1px solid " + (i===0?brass:brassDp) + ";'>" + label + "</a>";
            }).join("") +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:64px 40px;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
            items.map(function(title) {
              return "<div style='background:#fff;border:1px solid #E2DBCC;'>" +
                "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>" + title + "</div>" +
                "<div style='padding:20px;'><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + title + "</div><div style='font-size:12px;color:" + stone + ";'>Project context.</div></div>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>" +
        workClose;
    })(),

    services:
      "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Services & pricing</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Every way to put your company on film.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:640px;'>Real prices, in the open. Pick a package, or build a plan. No 30 minute call required to learn what something costs.</p>" +
      "</section>" +
      "<section style='background:" + ink + ";padding:80px 40px;'>" +
        "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
          (brief.pricingTiers || [
            ["01  Front Door","CASH FLOW & TRUST","Productized story and testimonial packages with set scope and open pricing.","From 2.5K per film"],
            ["02  Premium","MARGIN & CRAFT","Brand films, founder stories, and exit work. Built around your story.","From 12K per film"],
            ["03  The Partner Plan","RECURRING","An embedded video partner across your portfolio or for one company.","From 4K per month"],
          ]).map(function(tier) {
            return "<div style='background:" + asphalt + ";padding:48px 36px;border:1px solid #3a3632;'>" +
              "<div style='font-size:22px;font-weight:700;color:" + warmWhite + ";margin-bottom:6px;'>" + tier[0] + "</div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + stone + ";margin-bottom:20px;'>" + tier[1] + "</div>" +
              "<div style='width:34px;height:3px;background:" + brass + ";margin-bottom:20px;'></div>" +
              "<p style='font-size:15px;color:" + warmWhite + ";line-height:1.6;margin-bottom:24px;'>" + tier[2] + "</p>" +
              "<div style='font-size:26px;font-weight:700;color:" + brass + ";'>" + tier[3] + "</div>" +
            "</div>";
          }).join("") +
        "</div>" +
        "<div style='max-width:1160px;margin:24px auto 0;padding:32px 36px;border:1px solid #3a3632;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:12px;'>Always included, in every package</div>" +
          "<p style='font-size:15px;color:" + warmWhite + ";line-height:1.6;'>A set number of revision rounds, agreed up front. Professional lighting and audio, color grading, and a licensed music track. Delivery in web and social formats, plus short cutdowns from the same footage.</p>" +
        "</div>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:80px 40px;'>" +
        "<h2 style='font-size:clamp(28px,3.5vw,44px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>The full menu</h2>" +
        "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:48px;max-width:1160px;'>" +
          [["Proof & Trust",[["Customer Story","2.5K–4.5K"],["Case Study Film","4K–8K"],["Partner Testimonial","2.5K–4.5K"],["Sales Reel","5K–10K"]]],
           ["People & Culture",[["Technician Origin Story","3K–6K"],["Day in the Life","2.5K–4.5K"],["Why Work Here","4K–8K"],["Culture & Values Film","6K–12K"]]],
           ["Leadership & Vision",[["Founder Story","6K–15K"],["Leadership Address","3K–6K"],["Vision Film","6K–12K"],["All-Hands Video","2.5K–5K"]]],
           ["Exit & Value Creation",[["About-Us Brand Film","12K–30K"],["Exit-Ready Company Film","25K–75K+"],["Milestone Film","10K–20K"],["Portfolio Showcase","Custom"]]]
          ].map(function(cat) {
            return "<div><div style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:8px;'>" + cat[0] + "</div>" +
              "<div style='height:2px;background:" + brass + ";margin-bottom:20px;'></div>" +
              cat[1].map(function(item) {
                return "<div style='display:flex;justify-content:space-between;align-items:baseline;padding:12px 0;border-bottom:1px solid #E2DBCC;'>" +
                  "<span style='font-size:14px;color:" + ink + ";font-weight:600;'>" + item[0] + "</span>" +
                  "<span style='font-size:13px;color:" + brassDp + ";font-weight:600;'>" + item[1] + "</span>" +
                "</div>";
              }).join("") +
            "</div>";
          }).join("") +
        "</div>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:64px 40px;text-align:center;'>" +
        "<p style='color:" + stone + ";margin-bottom:24px;'>Not sure where to start? Tell me about the company.</p>" +
        "<a style='padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>Start a project</a>" +
      "</section>",

    about: (function() {
      var vals = (brief.founderValues || ["Grounded","Forward","Exact","Singular","Human"]);
      var valuesHtml = "<section style='background:" + bone + ";padding:72px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:32px;'>" + (brief.valuesEyebrow||"What we stand for") + "</div>" +
        "<div style='display:flex;gap:0;max-width:1160px;flex-wrap:wrap;'>" +
          vals.map(function(v) {
            return "<div style='flex:1;min-width:160px;padding:24px 28px;border-left:3px solid " + brass + ";margin:0 12px 12px 0;'>" +
              "<div style='font-size:20px;font-weight:700;color:" + ink + ";'>" + v + "</div>" +
            "</div>";
          }).join("") +
        "</div></section>";
      var aboutClose = "<section style='background:" + bone + ";padding:80px 40px;text-align:center;'><a style='padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>Start a project</a></section>";
      var aboutHeader = "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.aboutEyebrow||"About") + "</div>" +
        "<h1 style='font-size:clamp(40px,6vw,64px);font-weight:800;color:" + ink + ";margin:0;'>" + (brief.aboutH1||"One person. Every frame.") + "</h1>" +
        "</section>";

      if (variant === "B") {
        // Timeline variant
        var milestones = brief.milestones || [
          ["The beginning","How it started and what drove the decision to build this."],
          ["Finding the niche","The moment the right clients and right work became clear."],
          ["The work that mattered","The projects that defined the approach and proved the model."],
          ["Where it stands now","What the studio is today and where it is headed."],
        ];
        return aboutHeader +
          "<section style='background:" + bone + ";padding:0;'>" +
            milestones.map(function(m, i) {
              return "<div style='padding:56px 40px;background:" + (i%2===0?bone:"#fff") + ";border-bottom:1px solid #E2DBCC;display:flex;gap:32px;align-items:flex-start;max-width:1160px;margin:0 auto;'>" +
                "<div style='width:12px;height:12px;border-radius:50%;background:" + brass + ";flex-shrink:0;margin-top:8px;'></div>" +
                "<div><div style='font-size:20px;font-weight:700;color:" + ink + ";margin-bottom:10px;'>" + m[0] + "</div>" +
                "<p style='font-size:16px;color:" + text + ";line-height:1.65;'>" + m[1] + "</p></div>" +
              "</div>";
            }).join("") +
          "</section>" +
          "<section style='background:#fff;padding:80px 40px;'>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;max-width:1160px;margin:0 auto;align-items:center;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Founder portrait</div>" +
              "<div><div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.whyEyebrow||"The approach") + "</div>" +
              "<p style='font-size:17px;color:" + text + ";line-height:1.65;'>" + (brief.whyOneMaker||"[Why this approach — fill in from brief]") + "</p></div>" +
            "</div>" +
          "</section>" +
          valuesHtml + aboutClose;
      }

      // Variant A: story/portrait split
      return aboutHeader +
        "<section style='background:" + bone + ";padding:80px 40px;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;max-width:1160px;margin:0 auto;align-items:start;'>" +
            "<div><p style='font-size:17px;color:" + text + ";line-height:1.65;margin-bottom:24px;'>" + (brief.aboutStory||"The founder story goes here.") + "</p></div>" +
            "<div style='background:#e0ddd7;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Portrait — on location</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:#fff;padding:80px 40px;'>" +
          "<div style='max-width:720px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.whyEyebrow||"The approach") + "</div>" +
            "<h2 style='font-size:clamp(28px,3.5vw,44px);font-weight:800;color:" + ink + ";margin:0 0 24px;'>" + (brief.whyH2||"One mind on the whole project.") + "</h2>" +
            "<p style='font-size:17px;color:" + text + ";line-height:1.65;'>" + (brief.whyOneMaker||"[Why this approach — fill in from brief]") + "</p>" +
          "</div>" +
        "</section>" +
        valuesHtml + aboutClose;
    })(),

    process: (function() {
      var steps = brief.processSteps || [
        ["01","The intro","A short call to understand the company and the goal. No charge, no maze."],
        ["02","The plan","A clear scope and a fixed quote up front. You know the price before anything starts."],
        ["03","The work","One focused engagement, lean and calm."],
        ["04","The review","A first draft, then a set number of revision rounds."],
        ["05","Delivery","Final files in every format you need, ready to use immediately."],
      ];
      var processHeader = "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.processEyebrow||"Process") + "</div>" +
        "<h1 style='font-size:clamp(40px,6vw,64px);font-weight:800;color:" + ink + ";margin:0 0 20px;'>" + (brief.processH1||"How it gets made.") + "</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;'>" + (brief.processIntro||"Simple and calm, from first call to final files. No maze, no surprises.") + "</p>" +
        "</section>";
      var processCallout = "<section style='background:" + ink + ";padding:80px 40px;'>" +
        "<div style='max-width:720px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>" + (brief.calloutEyebrow||"What to expect") + "</div>" +
          "<p style='font-size:18px;color:" + warmWhite + ";line-height:1.65;'>" + (brief.calloutBody||"Most projects take four to six weeks from the intro call to final delivery. You will always know where the project stands.") + "</p>" +
        "</div></section>";
      var processClose = "<section style='background:" + bone + ";padding:80px 40px;text-align:center;'><a style='padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>Start a project</a></section>";

      if (variant === "B") {
        // Horizontal timeline cards
        return processHeader +
          "<section style='background:" + bone + ";padding:80px 40px;'>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
              steps.map(function(step) {
                return "<div style='background:#fff;padding:40px 32px;border-top:3px solid " + brass + ";'>" +
                  "<div style='font-family:Fraunces,serif;font-size:52px;font-weight:300;color:" + brass + ";line-height:1;margin-bottom:20px;'>" + step[0] + "</div>" +
                  "<div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:10px;'>" + step[1] + "</div>" +
                  "<p style='font-size:14px;color:" + text + ";line-height:1.65;'>" + step[2] + "</p>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</section>" +
          processCallout + processClose;
      }

      // Variant A: two-column grid
      return processHeader +
        "<section style='background:" + bone + ";padding:0;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;max-width:1160px;margin:0 auto;'>" +
            steps.map(function(step, i) {
              return "<div style='padding:56px 40px;background:" + (i%2===0?bone:"#fff") + ";border:1px solid #E2DBCC;'>" +
                "<div style='font-family:Fraunces,serif;font-size:72px;font-weight:300;color:" + brass + ";line-height:1;margin-bottom:24px;'>" + step[0] + "</div>" +
                "<div style='height:1px;background:" + brass + ";width:34px;margin-bottom:24px;'></div>" +
                "<div style='font-size:20px;font-weight:700;color:" + ink + ";margin-bottom:12px;'>" + step[1] + "</div>" +
                "<p style='font-size:16px;color:" + text + ";line-height:1.65;'>" + step[2] + "</p>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>" +
        processCallout + processClose;
    })(),

    contact: (function() {
      var formBox = "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;margin-bottom:24px;'>" +
        "<p style='font-size:14px;color:" + stone + ";line-height:1.8;'>Form fields: Name · Company · Email · What do you need? · Budget range (optional) · Message</p>" +
        "<p style='font-size:12px;color:" + stone + ";margin-top:12px;font-style:italic;'>Connect a forms plugin and replace this with the live shortcode.</p>" +
      "</div>";
      var contactClose = "<section style='background:" + ink + ";padding:96px 40px;text-align:center;'>" +
        "<h2 style='font-family:Fraunces,serif;font-weight:300;font-style:italic;font-size:clamp(32px,4.5vw,52px);color:" + warmWhite + ";max-width:720px;margin:0 auto 32px;line-height:1.1;'>" + (brief.tagline||"Ready to get started?") + "</h2>" +
        "<div style='font-size:14px;color:" + stone + ";letter-spacing:2px;text-transform:uppercase;'>" + (brief.signatureLine||"") + "</div>" +
      "</section>";

      if (variant === "B") {
        // Split: statement left, form right
        return "<section style='background:" + bone + ";padding:96px 40px;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:80px;max-width:1160px;margin:0 auto;align-items:start;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:24px;'>" + (brief.contactEyebrow||"Contact") + "</div>" +
              "<h2 style='font-family:Fraunces,serif;font-weight:300;font-size:clamp(36px,4.5vw,56px);color:" + ink + ";margin:0 0 32px;line-height:1.06;'>" + (brief.contactH1||"Tell us about your project.") + "</h2>" +
              "<p style='font-size:17px;color:" + text + ";line-height:1.65;margin-bottom:24px;'>" + (brief.contactIntro||"A quick note about what you need.") + "</p>" +
              "<p style='font-size:14px;color:" + stone + ";'>" + (brief.contactReassurance||"No sales team. A real reply from a real person.") + "</p>" +
            "</div>" +
            "<div>" +
              formBox +
              "<a style='display:inline-block;padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;'>" + (brief.contactCta||"Send it over") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>" + contactClose;
      }

      // Variant A: stacked
      return "<section style='background:" + bone + ";padding:88px 40px;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>" + (brief.contactEyebrow||"Contact") + "</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;'>" + (brief.contactH1||"Tell us about your project.") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";max-width:560px;'>" + (brief.contactIntro||"A quick note about what you need. You will get a real reply from a real person, usually within one business day.") + "</p>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:64px 40px;'>" +
          "<div style='max-width:680px;'>" +
            formBox +
            "<a style='display:inline-block;padding:16px 40px;background:" + brass + ";color:" + ink + ";font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;margin-bottom:20px;'>" + (brief.contactCta||"Send it over") + "</a>" +
            "<p style='font-size:14px;color:" + stone + ";margin-top:16px;'>" + (brief.contactReassurance||"No sales team. A real reply from a real person.") + "</p>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:72px 40px;border-top:1px solid #E2DBCC;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
            "<div><div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What happens next</div><p style='font-size:16px;color:" + text + ";line-height:1.65;'>You send a note. Within one business day, you hear back from the person who actually does the work. No account manager, no intro call just to learn what you need.</p></div>" +
            "<div><div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Not sure what you need?</div><p style='font-size:16px;color:" + text + ";line-height:1.65;'>Tell us what the company does and what you are trying to show. That is enough to start.</p></div>" +
          "</div>" +
        "</section>" +
        contactClose;
    })(),
  };

  var body = sections[activePage] || sections.home;

  return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>" + (brief.brandName || "Preview") + "</title>" +
    "<link href='" + fontUrl + "' rel='stylesheet'>" +
    "<style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter',system-ui,sans-serif;font-size:17px;line-height:1.65;background:" + bone + ";color:" + text + ";}img{max-width:100%;}section{width:100%;}</style>" +
    "</head><body>" + body + "</body></html>";
}

// ─── Styles ───────────────────────────────────────────────────────────────────
var T = {
  surface: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" },
  label: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "8px", display: "block" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", color: "#09090b", outline: "none", background: "#fff" },
  btnPrimary: { padding: "12px 24px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" },
  btnGhost: { padding: "10px 16px", background: "transparent", color: "#09090b", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  stepNum: function(active, done) { return { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, background: done ? "#000" : active ? "#000" : "#f3f4f6", color: done || active ? "#fff" : "#9ca3af", flexShrink: 0 }; },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomBuild() {
  const [brief, setBrief]               = useState(null);
  const [briefName, setBriefName]       = useState("");
  const [briefError, setBriefError]     = useState("");
  const [inspoUrls, setInspoUrls]       = useState([""]);
  const [crawlResults, setCrawlResults] = useState({});  // keyed by URL
  const [crawling, setCrawling]         = useState({});  // keyed by URL
  const [storedPatterns, setStoredPatterns] = useState({}); // persisted across sessions
  const [selectedPages, setPages]       = useState(["home"]);
  const [copyBriefOnly, setCopy]        = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("");
  const [generated, setGenerated]       = useState(null);
  const [previewPage, setPreviewPage]   = useState("home");
  const [layoutVariants, setLayoutVariants] = useState({}); // {pageId: "A"|"B"}
  const fileRef = useRef();
  const [parsing, setParsing]           = useState(false);
  const canGenerate = !!brief && selectedPages.length > 0;

  // ── Draft persistence ──────────────────────────────────────────────────────
  // Load saved draft on mount
  useEffect(() => {
    async function loadDraft() {
      if (!window.storage) return;
      try {
        const result = await window.storage.get("spec-blueprint-draft");
        if (!result || !result.value) return;
        const draft = JSON.parse(result.value);
        if (draft.brief)          setBrief(draft.brief);
        if (draft.briefName)      setBriefName(draft.briefName);
        if (draft.inspoUrls)      setInspoUrls(draft.inspoUrls);
        if (draft.selectedPages)  setPages(draft.selectedPages);
        if (draft.copyBriefOnly !== undefined) setCopy(draft.copyBriefOnly);
        if (draft.layoutVariants) setLayoutVariants(draft.layoutVariants);
        if (draft.generated)      setGenerated(draft.generated);
        if (draft.previewPage)    setPreviewPage(draft.previewPage);
        if (draft.crawlResults)   setCrawlResults(draft.crawlResults);
      } catch(e) {}
    }
    loadDraft();
  }, []);

  // Save draft whenever key state changes (debounced)
  useEffect(() => {
    if (!window.storage) return;
    const timer = setTimeout(() => {
      const draft = {
        brief,
        briefName,
        inspoUrls,
        selectedPages,
        copyBriefOnly,
        layoutVariants,
        previewPage,
        crawlResults,
        // generated pages can be large — only save metadata, not full JSON
        generated: generated ? {
          ...generated,
          pages: generated.pages.map(p => ({
            id: p.id,
            label: p.label,
            recommended: p.recommended,
            hasVariants: p.hasVariants,
            reason: p.reason,
            // store full data so preview and download work on return
            data: p.data,
            variantA: p.variantA,
            variantB: p.variantB,
          }))
        } : null,
      };
      window.storage.set("spec-blueprint-draft", JSON.stringify(draft)).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [brief, briefName, inspoUrls, selectedPages, copyBriefOnly, layoutVariants, previewPage, crawlResults, generated]);

  // Load persisted inspo patterns on mount
  useEffect(() => {
    async function loadPatterns() {
      try {
        const result = await window.storage.get("spec-inspo-patterns");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          // Handle both old per-page format and new flat pool format
          setStoredPatterns(parsed.pool ? { pool: parsed.pool } : parsed);
        }
      } catch (e) {
        // No stored patterns yet
      }
    }
    if (window.storage) loadPatterns();
  }, []);

  function handleFile(file) {
    if (!file) return;
    setBriefError("");
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "json") {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const raw = JSON.parse(e.target.result);
          const parsed = extractBrief(raw);
          setBrief(parsed);
          setBriefName(file.name);
          if (raw.sitemap) setPages(raw.sitemap.map(s => s.pageId));
        } catch { setBriefError("Could not parse this JSON file."); }
      };
      reader.readAsText(file);
    } else if (ext === "pdf") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: base64, type: "pdf", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBrief(data); setBriefName(file.name);
        } catch (err) { setBriefError("Could not parse the PDF: " + err.message); }
        finally { setParsing(false); }
      };
      reader.readAsDataURL(file);
    } else if (ext === "docx" || ext === "doc") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: base64, type: "docx", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBrief(data); setBriefName(file.name); setBriefError("");
        } catch (err) { setBriefError("Could not parse the Word doc: " + err.message); }
        finally { setParsing(false); }
      };
      reader.readAsDataURL(file);
    } else if (ext === "txt") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const res = await fetch("/api/parse-brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: e.target.result, type: "text", fileName: file.name }) });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBrief(data); setBriefName(file.name); setBriefError("");
        } catch (err) { setBriefError("Could not parse the file: " + err.message); }
        finally { setParsing(false); }
      };
      reader.readAsText(file);
    } else {
      setBriefError("Unsupported file type. Upload a PDF, JSON, DOCX, or TXT file.");
    }
  }

  function extractBrief(raw) {
    if (raw.designSystem && raw.brandBrief) {
      const colors = {};
      (raw.designSystem.colors || []).forEach(c => { colors[c.id] = c.hex; });
      const pages = raw.pages || [];
      const getField = (pageId, sectionType, fieldKey) => {
        const page = pages.find(p => p.pageId === pageId);
        if (!page) return "";
        const sec = page.sections?.find(s => s.sectionType === sectionType || s.captureAs === sectionType);
        if (!sec) return "";
        const fld = sec.fields?.find(f => f.key === fieldKey);
        return Array.isArray(fld?.value) ? fld.value.join(" · ") : fld?.value || "";
      };
      return {
        brandName: raw.project?.name || "",
        colors,
        fonts: raw.designSystem.fonts?.map(f => f.family) || ["Inter"],
        heroHeadline: getField("home","hero-dark","h1") || getField("home","hero","h1"),
        heroSubhead: getField("home","hero-dark","subhead"),
        heroCta1: (getField("home","hero-dark","buttons")||"").split("·")[0]?.trim() || "See the work",
        heroCta2: (getField("home","hero-dark","buttons")||"").split("·")[1]?.trim() || "See pricing",
        hookStatement: getField("home","statement-hook","statement"),
        serviceCards: pages.find(p=>p.pageId==="home")?.sections?.find(s=>s.captureAs==="card-grid-4")?.fields?.map(f=>[f.role.replace(/Card \d+ ?·? ?/,""),f.value])||[],
        differenceEyebrow: getField("home","eyebrow-heading-body","eyebrow"),
        differenceH2: getField("home","eyebrow-heading-body","h2"),
        differenceBody: getField("home","eyebrow-heading-body","body"),
        whoEyebrow: getField("home","who-section","eyebrow"),
        whoH2: getField("home","who-section","h2"),
        whoBody: getField("home","who-section","body"),
        workH2: getField("home","media-grid-link","h2"),
        pricingH2: getField("home","pricing-teaser","h2"),
        pricingSubhead: getField("home","pricing-teaser","body"),
        pricingCta: (getField("home","pricing-teaser","button")||"").split("·")[0]?.trim()||"See packages",
        tagline: raw.brandBrief?.tagline?.value||"",
        signatureLine: raw.brandBrief?.signatureLine?.value||"",
        closingCta: (getField("home","cta-pullquote-dark","button")||"").split("·")[0]?.trim()||"Start a project",
        aboutH1: getField("about","page-header","h1"),
        aboutStory: getField("about","story-block","story"),
        whyOneMaker: getField("about","eyebrow-heading-body","body"),
        founderValues: (getField("about","values-row","values")||"").split("·").map(v=>v.trim()).filter(Boolean),
        processH1: getField("process","page-header","h1"),
        processSteps: (raw.pages?.find(p=>p.pageId==="process")?.sections?.find(s=>s.captureAs==="numbered-steps")?.fields||[]).map(f=>[f.key,f.role,f.value]),
        contactH1: getField("contact","page-header","h1"),
        contactIntro: getField("contact","page-header","intro"),
        contactCta: getField("contact","contact-form","submit"),
        contactReassurance: getField("contact","contact-form","reassurance"),
        pricingTiers: (raw.pricing?.tiers||[]).map(t=>[t.name,t.subtitle||"",t.desc,t.price]),
      };
    }
    return { brandName: raw.brandName||raw.name||"", colors: raw.colors||{}, ...raw };
  }

  function addUrl() { setInspoUrls(u => [...u, ""]); }
  function updateUrl(i, v) { setInspoUrls(u => u.map((x, j) => j === i ? v : x)); }
  function removeUrl(i) {
    const url = inspoUrls[i];
    setInspoUrls(u => u.filter((_, j) => j !== i));
    setCrawlResults(r => { const n = {...r}; delete n[url]; return n; });
  }

  async function crawlUrl(url) {
    const trimmed = url.trim();
    if (!trimmed || crawlResults[trimmed] || crawling[trimmed]) return;
    setCrawling(c => ({ ...c, [trimmed]: true }));
    try {
      const res = await fetch("/api/crawl-inspo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setCrawlResults(r => {
          const updated = { ...r, [trimmed]: data };
          // Persist the merged pattern pool to storage
          if (window.storage && data.patterns) {
            const merged = buildInspoContext(updated, storedPatterns);
            window.storage.set("spec-inspo-patterns", JSON.stringify({ pool: merged })).catch(() => {});
            setStoredPatterns({ pool: merged });
          }
          return updated;
        });
      } else {
        setCrawlResults(r => ({ ...r, [trimmed]: { error: data.error || "Could not crawl this URL" } }));
      }
    } catch (err) {
      setCrawlResults(r => ({ ...r, [trimmed]: { error: err.message } }));
    } finally {
      setCrawling(c => { const n = {...c}; delete n[trimmed]; return n; });
    }
  }
  function togglePage(id) { setPages(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]); }

  async function generate() {
    if (!canGenerate) return;
    setGenerating(true);

    // Step 1: build shared inspo pool
    const inspoContext = buildInspoContext(crawlResults, storedPatterns);

    // Step 2: if we have patterns and inspo URLs, ask AI for recommendations
    let aiRecs = {};
    const hasInspo = inspoContext && inspoContext.length > 20;
    const variantPages = selectedPages.filter(p => p !== "home" && p !== "services");

    if (hasInspo && variantPages.length > 0) {
      setGeneratingStatus("Analyzing inspo patterns...");
      try {
        const res = await fetch("/api/analyze-inspo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patterns: inspoContext,
            pages: variantPages,
            brandVoice: [
              brief.brandName,
              (brief.voiceRules || []).join(". "),
              brief.tagline,
            ].filter(Boolean).join(" — "),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          aiRecs = data.recommendations || {};
        }
      } catch (e) {
        // Silent fallback — keyword matching handles it
      }
    }

    // Step 3: build pages
    setGeneratingStatus("Building pages...");
    await new Promise(r => setTimeout(r, 300)); // small pause so status is visible

    const pages = generatePages(brief, selectedPages, inspoContext, aiRecs);
    const variants = {};
    pages.forEach(p => { variants[p.id] = p.recommended || "A"; });
    setLayoutVariants(variants);
    setGenerated({ pages, inspoContext, aiRecs });
    setPreviewPage(selectedPages[0] || "home");
    setGenerating(false);
    setGeneratingStatus("");
  }

  function getPageData(p) {
    var variant = layoutVariants[p.id] || "A";
    return variant === "B" && p.variantB ? p.variantB : p.variantA || p.data;
  }

  function downloadPage(p) {
    const blob = new Blob([JSON.stringify(getPageData(p), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = p.id + ".json"; a.click(); URL.revokeObjectURL(a.href);
    // Auto-save this single page to the library
    if (brief && generated) {
      saveToLibrary(brief, [p], layoutVariants, layoutVariants);
    }
  }

  function downloadAll() {
    if (!generated) return;
    generated.pages.forEach((p, i) => setTimeout(() => {
      const blob = new Blob([JSON.stringify(getPageData(p), null, 2)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = p.id + ".json"; a.click(); URL.revokeObjectURL(a.href);
    }, i * 300));
    // Auto-save full build to library
    if (brief && generated) {
      saveToLibrary(brief, generated.pages, layoutVariants, layoutVariants);
    }
  }

  const steps = [
    { n: 1, label: "Brand Brief",   done: !!brief },
    { n: 2, label: "Inspo URLs",    done: inspoUrls.some(u => u.trim()) },
    { n: 3, label: "Pages",         done: selectedPages.length > 0 },
    { n: 4, label: "Copy Settings", done: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "Inter, system-ui, sans-serif" }}>

      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Brief to Blueprint</div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {(brief || generated) && (
            <button
              onClick={async () => {
                setBrief(null); setBriefName(""); setInspoUrls([""]); setPages(["home"]);
                setCopy(true); setGenerated(null); setLayoutVariants({}); setCrawlResults({});
                setPreviewPage("home");
                if (window.storage) { try { await window.storage.delete("spec-blueprint-draft"); } catch(e) {} }
              }}
              style={{ fontSize: "12px", color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "6px 12px", cursor: "pointer" }}>
              Clear draft
            </button>
          )}
          {steps.map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={T.stepNum(false, s.done)}>{s.done ? "✓" : s.n}</div>
              <span style={{ fontSize: "12px", color: s.done ? "#09090b" : "#9ca3af", fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
              {s.n < 4 && <span style={{ color: "#e5e7eb", margin: "0 4px" }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: generated ? "440px 1fr" : "1fr", gap: "0", minHeight: "calc(100vh - 57px)" }}>

        <div style={{ padding: "24px", borderRight: generated ? "1px solid #e5e7eb" : "none", overflowY: "auto", maxWidth: generated ? "440px" : "720px", margin: generated ? "0" : "0 auto" }}>

          {/* STEP 1 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, !!brief)}>1</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Brand Brief</div>
              {brief && <span style={{ fontSize: "12px", color: "#09090b", marginLeft: "auto" }}>✓ {briefName}</span>}
            </div>
            <div style={{ ...T.surface, border: brief ? "1px solid #e5e7eb" : "1px solid #e5e7eb" }}>
              {!brief ? (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    style={{ border: "2px dashed #e5e7eb", borderRadius: "6px", padding: "32px", textAlign: "center", cursor: "pointer" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#000"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>↑</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "4px" }}>Upload Brand Brief</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>PDF, DOCX, JSON, or TXT</div>
                    <input ref={fileRef} type="file" accept=".json,.pdf,.txt,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                  </div>
                  {parsing && <div style={{ marginTop: "12px", padding: "12px", background: "#f4f4f5", borderRadius: "6px", fontSize: "13px", color: "#09090b" }}>Reading brief — this takes a few seconds...</div>}
                  {briefError && <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>{briefError}</div>}
                </>
              ) : (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>{brief.brandName || "Brand loaded"}</div>
                  {brief.colors && (
                    <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                      {Object.entries(brief.colors).slice(0, 8).map(([id, hex]) => (
                        <div key={id} title={id + ": " + hex} style={{ width: "24px", height: "24px", borderRadius: "4px", background: hex, border: "1px solid rgba(0,0,0,.1)" }} />
                      ))}
                    </div>
                  )}
                  <button style={T.btnGhost} onClick={() => { setBrief(null); setBriefName(""); }}>Replace brief</button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, inspoUrls.some(u => u.trim()))}>2</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Inspo URLs</div>
              <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>Optional</span>
            </div>
            {Object.keys(storedPatterns).length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#f4f4f5", borderRadius: "6px", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#09090b" }}>
                  {Object.keys(storedPatterns).filter(k => k !== "site").length} page pattern{Object.keys(storedPatterns).filter(k => k !== "site").length !== 1 ? "s" : ""} learned from previous sessions
                </span>
                <button
                  onClick={async () => {
                    setStoredPatterns({});
                    if (window.storage) { try { await window.storage.delete("spec-inspo-patterns"); } catch(e) {} }
                  }}
                  style={{ fontSize: "11px", color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Clear
                </button>
              </div>
            )}
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                Paste a site URL and Spec will discover all pages in the nav, not just the home page. Each interior page informs the matching page type in your build.
              </div>
              {inspoUrls.map((url, i) => (
                <div key={i} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      style={{ ...T.input, flex: 1 }}
                      value={url}
                      onChange={e => updateUrl(i, e.target.value)}
                      onBlur={e => crawlUrl(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") crawlUrl(url); }}
                      placeholder="https://example.com"
                    />
                    {inspoUrls.length > 1 && <button onClick={() => removeUrl(i)} style={{ ...T.btnGhost, padding: "10px 12px" }}>×</button>}
                  </div>
                  {/* Crawl status */}
                  {crawling[url.trim()] && (
                    <div style={{ fontSize: "12px", color: "#6b7280", padding: "8px 12px", background: "#f4f4f5", borderRadius: "4px" }}>
                      Scanning site pages...
                    </div>
                  )}
                  {crawlResults[url.trim()] && !crawlResults[url.trim()].error && (
                    <div style={{ fontSize: "12px", background: "#f4f4f5", borderRadius: "4px", padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600, color: "#09090b", marginBottom: "6px" }}>
                        {crawlResults[url.trim()].pageCount} page{crawlResults[url.trim()].pageCount !== 1 ? "s" : ""} found
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(crawlResults[url.trim()].pages || []).map((p, pi) => (
                          <span key={pi} style={{ fontSize: "11px", padding: "3px 8px", background: "#e4e4e7", borderRadius: "3px", color: "#09090b" }}>
                            {p.pageType !== "other" ? p.pageType : p.path}
                          </span>
                        ))}
                      </div>
                      {crawlResults[url.trim()].patterns?.siteNotes && (
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "8px", lineHeight: 1.5 }}>
                          {crawlResults[url.trim()].patterns.siteNotes}
                        </div>
                      )}
                    </div>
                  )}
                  {crawlResults[url.trim()]?.error && (
                    <div style={{ fontSize: "12px", color: "#dc2626", padding: "6px 10px", background: "#fef2f2", borderRadius: "4px" }}>
                      {crawlResults[url.trim()].error}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={addUrl} style={{ ...T.btnGhost, marginTop: "4px", fontSize: "13px" }}>+ Add URL</button>
            </div>
          </div>

          {/* STEP 3 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, selectedPages.length > 0)}>3</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Pages to Build</div>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>Only checked pages are included in the export.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {ALL_PAGES.map(p => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: selectedPages.includes(p.id) ? "1px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#09090b" }}>
                    <input type="checkbox" checked={selectedPages.includes(p.id)} onChange={() => togglePage(p.id)} style={{ accentColor: "#000", width: "15px", height: "15px" }} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>{selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected</div>
            </div>
          </div>

          {/* STEP 4 */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, true)}>4</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Copy Settings</div>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>Use copy from brand brief only?</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ flex: 1, padding: "14px", border: copyBriefOnly ? "2px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", textAlign: "center" }}>
                  <input type="radio" name="copy" checked={copyBriefOnly} onChange={() => setCopy(true)} style={{ display: "none" }} />
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>Yes</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Brief copy used verbatim. Nothing is changed or generated by AI.</div>
                </label>
                <label style={{ flex: 1, padding: "14px", border: !copyBriefOnly ? "2px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", textAlign: "center" }}>
                  <input type="radio" name="copy" checked={!copyBriefOnly} onChange={() => setCopy(false)} style={{ display: "none" }} />
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>No</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>AI may draft blank fields in the brand voice. You approve before export.</div>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate || generating}
            style={{ ...T.btnPrimary, width: "100%", justifyContent: "center", padding: "16px 24px", fontSize: "15px", opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? "pointer" : "not-allowed" }}>
            {generating ? (generatingStatus || "Generating…") : "Generate " + selectedPages.length + " Page" + (selectedPages.length !== 1 ? "s" : "")}
          </button>
          {!brief && <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>Upload a brand brief to enable generation</div>}

          {generated && (
            <div style={{ marginTop: "24px", ...T.surface }}>
              <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Download</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {generated.pages.map(p => (
                  <button key={p.id} onClick={() => downloadPage(p)} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                    <span>{p.label}</span><span style={{ color: "#9ca3af" }}>↓ .json</span>
                  </button>
                ))}
                {generated.pages.length > 1 && (
                  <button onClick={downloadAll} style={{ ...T.btnPrimary, justifyContent: "center", marginTop: "4px" }}>Download All Pages</button>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                Import via WordPress → Templates → Saved Templates → Import Templates.
              </div>
            </div>
          )}
        </div>

        {generated && (
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600, marginRight: "4px" }}>PREVIEW</span>
              {generated.pages.map(p => (
                <button key={p.id}
                  onClick={() => setPreviewPage(p.id)}
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: previewPage === p.id ? "1px solid #000" : "1px solid #e5e7eb", borderRadius: "20px", background: previewPage === p.id ? "#000" : "#fff", color: previewPage === p.id ? "#fff" : "#09090b" }}>
                  {p.label}
                </button>
              ))}
              {/* Layout variant switcher — only for pages with two variants */}
              {generated.pages.filter(p => p.id === previewPage && p.hasVariants).map(p => (
                <div key="switcher" style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Layout</span>
                    {["A", "B"].map(v => (
                      <button key={v}
                        onClick={() => setLayoutVariants(prev => ({ ...prev, [p.id]: v }))}
                        style={{
                          padding: "5px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          border: (layoutVariants[p.id] || p.recommended) === v ? "1px solid #000" : "1px solid #e5e7eb",
                          borderRadius: "4px",
                          background: (layoutVariants[p.id] || p.recommended) === v ? "#000" : "#fff",
                          color: (layoutVariants[p.id] || p.recommended) === v ? "#fff" : "#6b7280",
                          position: "relative",
                        }}>
                        {v}
                        {v === p.recommended && (
                          <span style={{ position: "absolute", top: "-6px", right: "-6px", fontSize: "9px", background: "#C2A35B", color: "#1C1A17", borderRadius: "3px", padding: "1px 4px", fontWeight: 700, letterSpacing: "0.05em" }}>REC</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {p.reason && (
                    <div style={{ fontSize: "11px", color: "#6b7280", maxWidth: "280px", textAlign: "right", lineHeight: 1.4 }}>
                      {p.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <iframe
              srcDoc={buildPreviewHTML(brief, previewPage, layoutVariants[previewPage] || "A")}
              style={{ flex: 1, border: "none", width: "100%", minHeight: "calc(100vh - 100px)" }}
              title="Site preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}







