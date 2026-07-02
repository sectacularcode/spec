// Template library utilities
// Saves completed builds and individual sections to Upstash Redis
// so they can be surfaced in the swap drawer and library browser.

import { kvStorageGet, kvStorageSet } from "./storage.js";

// Infers visual style tags, tone tags, and industry fit from a brief.
// These tags power the library filter UI.
export function inferTags(brief, pages, layoutVariants) {
  var colors = brief.colors || {};
  var ink = (colors.ink || "#000000").toLowerCase();
  var bone = (colors.bone || colors["warm-white"] || "#ffffff").toLowerCase();
  var brass = (colors.brass || colors.accent || "").toLowerCase();

  var visualTags = [];
  var isDark = ink === "#1c1a17" || ink === "#000000" || ink === "#09090b" || ink === "#111111";
  var isWarm = bone.indexOf("e") !== -1 || bone.indexOf("f3f1") !== -1 || bone.indexOf("ede") !== -1;
  var hasBrass = brass.indexOf("c2a") !== -1 || brass.indexOf("9c7") !== -1 || brass.indexOf("c49") !== -1;
  var hasGold = brass.indexOf("c49") !== -1 || brass.indexOf("d4a") !== -1;

  if (isDark) visualTags.push("dark-hero");
  if (isWarm) visualTags.push("warm-palette");
  if (hasBrass || hasGold) visualTags.push("brass-accent");

  var usedB = Object.values(layoutVariants || {}).some(function(v) { return v === "B"; });
  if (usedB) visualTags.push("editorial");
  if (!usedB) visualTags.push("structured");

  var toneTags = [];
  var rules = (brief.voiceRules || []).join(" ").toLowerCase();
  if (rules.indexOf("confident") !== -1 || rules.indexOf("quiet") !== -1) toneTags.push("confident");
  if (rules.indexOf("plain") !== -1 || rules.indexOf("no buzzword") !== -1) toneTags.push("direct");
  if (rules.indexOf("warm") !== -1) toneTags.push("warm");
  if (rules.indexOf("premium") !== -1 || rules.indexOf("luxury") !== -1) toneTags.push("premium");
  if (rules.indexOf("minimal") !== -1 || rules.indexOf("simple") !== -1) toneTags.push("minimal");
  if (rules.indexOf("bold") !== -1 || rules.indexOf("strong") !== -1) toneTags.push("bold");

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

  var styleLabel = [
    isDark ? "Dark" : "Light",
    isWarm ? "Warm" : "Cool",
    hasBrass ? "Brass Accent" : "",
    usedB ? "Editorial" : "Structured",
  ].filter(Boolean).join(" · ");

  return { visualTags, toneTags, industryFit: [...new Set(industryFit)], styleLabel };
}

// Saves a completed build to the template library and each section to the section library.
// Both are stored in Upstash Redis with a 50-build / 300-section cap (oldest dropped).
export async function saveToLibrary(brief, pages, layoutVariants, selectedVariants) {
  try {
    var existing = [];
    try {
      var stored = await kvStorageGet("spec-template-library");
      if (stored && stored.value) existing = JSON.parse(stored.value);
    } catch(e) {}

    var tags = inferTags(brief, pages, selectedVariants || layoutVariants);
    var id = "build-" + Date.now();
    var entry = {
      id,
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

    var deduped = existing.filter(function(e) {
      return !(e.client === entry.client && e.date === entry.date && e.source === "blueprint");
    });
    deduped.unshift(entry);
    if (deduped.length > 50) deduped = deduped.slice(0, 50);
    await kvStorageSet("spec-template-library", JSON.stringify(deduped), userId);

    // Save individual sections for the swap drawer
    var existingSections = [];
    try {
      var storedSections = await kvStorageGet("spec-section-library");
      if (storedSections && storedSections.value) existingSections = JSON.parse(storedSections.value);
    } catch(e) {}

    var newSections = [];
    pages.forEach(function(p) {
      var pageData = (selectedVariants || {})[p.id] === "B" && p.variantB ? p.variantB : p.variantA || p.data;
      if (!pageData || !pageData.content) return;
      pageData.content.forEach(function(section, si) {
        newSections.push({
          id: "section-" + Date.now() + "-" + si,
          buildId: id,
          client: brief.brandName || "Unnamed Client",
          date: new Date().toISOString().slice(0, 10),
          pageId: p.id,
          pageLabel: p.label,
          sectionIndex: si,
          colors: brief.colors || {},
          tags: tags.visualTags.concat(tags.toneTags),
          industryFit: tags.industryFit,
          data: section,
        });
      });
    });

    var combinedSections = newSections.concat(existingSections);
    if (combinedSections.length > 300) combinedSections = combinedSections.slice(0, 300);
    await kvStorageSet("spec-section-library", JSON.stringify(combinedSections), userId);

  } catch(e) {
    console.warn("saveToLibrary failed:", e);
  }
}
