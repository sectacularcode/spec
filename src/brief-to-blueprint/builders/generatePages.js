import { ALL_PAGES, ADDITIONAL_PAGE_TYPES } from "../../constants/pages.js";
import { selectPatterns } from "../utils/patterns.js";
import { buildHomePage } from "./home.js";
import { buildWorkPage } from "./work.js";
import { buildServicesPage, buildServicesPageLight } from "./services.js";
import { buildAboutPage } from "./about.js";
import { buildProcessPage } from "./process.js";
import { buildContactPage } from "./contact.js";
import { buildGenericPage } from "./generic.js";
import { buildLocationPageA, buildLocationPageB } from "./location.js";
import { buildLandingPage, scoreLandingVariants } from "./landing.js";

// Orchestrates all page builders into a list of page objects.
// Each page object includes both variantA and variantB Elementor JSON
// so the preview and download can switch between them without regenerating.
//
// To add a new page type:
//   1. Add a builder function in a new file (e.g. builders/landing.js)
//   2. Import it here and add a routing case below
//   3. Add the page to ADDITIONAL_PAGE_TYPES in constants/pages.js

export function generatePages(brief, selectedPages, inspoContext, aiRecs, customPagesArg) {
  // Per-key merge with the SAME defaults buildPreviewHTML.js uses — not an
  // object-level ||. brief.colors is often a present-but-empty {} (every
  // Manifest import ships no color data), and {} is truthy, so the old
  // `brief.colors || {defaults}` never fell through; each builder's own,
  // slightly DIFFERENT per-key fallback constants then took over and the
  // exported palette silently drifted from the preview's whenever any color
  // key was missing. Falsy values ("" / null) also fall back per key.
  var colorDefaults = {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  var providedColors = brief.colors || {};
  var colors = Object.assign({}, colorDefaults);
  Object.keys(providedColors).forEach(function(k) {
    if (providedColors[k]) colors[k] = providedColors[k];
  });
  var recs = aiRecs || {};
  var allPageDefs = ALL_PAGES.concat(ADDITIONAL_PAGE_TYPES).concat(customPagesArg || []);
  var patterns = selectPatterns(brief, inspoContext || "");

  return selectedPages.map(function(pid) {
    var pageDef = allPageDefs.find(function(p) { return p.id === pid; }) || { id: pid, label: pid.replace(/-\d+$/, "").replace(/(^|-)(.)/g, function(_, s, c) { return (s ? " " : "") + c.toUpperCase(); }), slug: "/" + pid.replace(/-\d+$/, "") };
    var label = pageDef.label;
    var result = null;

    if (pid === "home") {
      var homePatterns = Object.assign({}, patterns);
      homePatterns.hero = "centered-bold";
      var homeA = buildHomePage(colors, brief, inspoContext, homePatterns);
      var homePatternsB = Object.assign({}, patterns);
      homePatternsB.hero = "split-left";
      var homeB = buildHomePage(colors, brief, inspoContext, homePatternsB);
      // Layout C — a third, genuinely distinct combination: the "minimal"
      // hero (large centered text, no image, single CTA) paired with the
      // "numbered-features" cards treatment, instead of A/B's shared
      // bordered-card-grid look. Both patterns already existed in the
      // preview; the numbered-features cards treatment didn't exist in
      // the real export until now (see home.js).
      var homePatternsC = Object.assign({}, patterns);
      homePatternsC.hero = "minimal";
      homePatternsC.services = "numbered-features";
      var homeC = buildHomePage(colors, brief, inspoContext, homePatternsC);
      var homeRec = (patterns.hero === "split-left" || patterns.hero === "split-right") ? "B" : "A";
      var homeData = homeRec === "B" ? homeB : homeA;
      return { id: pid, label: label, data: homeData, variantA: homeA, variantB: homeB, variantC: homeC, recommended: homeRec, recommendedReasoned: true, hasVariants: true, hasVariantC: true };
    }
    if (pid === "services") {
      var svcA = buildServicesPage(colors, brief, inspoContext);
      var svcB = buildServicesPageLight(colors, brief, inspoContext);
      var svcRec = (patterns.pricing === "simple-list" || patterns.pricing === "two-tier") ? "B" : "A";
      return { id: pid, label: label, data: svcRec === "B" ? svcB : svcA, variantA: svcA, variantB: svcB, recommended: svcRec, recommendedReasoned: true, hasVariants: true };
    }
    if (pid === "work")    result = buildWorkPage(colors, brief, inspoContext);
    if (pid === "about")   result = buildAboutPage(colors, brief, inspoContext, patterns);
    if (pid === "process") result = buildProcessPage(colors, brief, inspoContext, patterns);
    if (pid === "contact") result = buildContactPage(colors, brief, inspoContext, patterns);

    // Additional and custom page types
    if (!result) {
      // Location pages — two layout variants (SEO vs conversion)
      if (pid === "location" || pid.startsWith("location-")) {
        var locData = brief.locationData || {};
        var locA = buildLocationPageA(colors, brief, locData);
        var locB = buildLocationPageB(colors, brief, locData);
        return { id: pid, label: label, data: locA, variantA: locA, variantB: locB, recommended: "A", recommendedReasoned: false, hasVariants: true };
      }
      // Landing pages — three conversion-focused layouts
      // A = Awareness/Feature, B = Lead Capture (form + testimonials), C = Minimal Retargeting
      //
      // "other" is an alias for this same builder — for content that
      // doesn't cleanly fit any of Spec's fixed page types (e.g. a
      // Manifest import of a single bespoke local-SEO page). It's labeled
      // separately in the UI so it's not confusing to see "Landing Page"
      // on something that isn't an ad landing page, but under the hood it
      // uses the exact same builder, since that's the one that actually
      // reads brief.features/faqItems/testimonials/closingCta — the fields
      // manifestImport.js populates. Building this via "home" or another
      // fixed page type would silently produce an empty-looking page,
      // since those builders read entirely different field names.
      if (pid === "landing" || pid === "other" || pid.startsWith("landing-") || pid.startsWith("other-")) {
        var landA = buildLandingPage(colors, brief, inspoContext, "A");
        var landB = buildLandingPage(colors, brief, inspoContext, "B");
        var landC = buildLandingPage(colors, brief, inspoContext, "C");
        // Variant D — a real, reusable visual-variety template (see
        // landing.js's Variant D dispatch), brand-agnostic by design.
        var landD = buildLandingPage(colors, brief, inspoContext, "D");
        // Variant E — Narrative/Trust-First, a genuinely different
        // awareness-stage structure (social proof moved up, secondary
        // CTAs interleaved), not just another style cycle.
        var landE = buildLandingPage(colors, brief, inspoContext, "E");
        // Variant F — Location: headline + address/hours/map combined into
        // one section instead of a separate dark hero. New, added alongside
        // the others (not a replacement) -- best for pages with a real
        // business address, picked per-page like every other variant.
        var landF = buildLandingPage(colors, brief, inspoContext, "F");
        // Score B/C/D/E against real content signals in the brief instead
        // of a hardcoded default -- see scoreLandingVariants in landing.js.
        var landRec = scoreLandingVariants(brief);
        // Attach C/D/E/F as named extras so the UI can expose them alongside A/B
        var landResult = { id: pid, label: label, data: landA, variantA: landA, variantB: landB, variantC: landC, variantD: landD, variantE: landE, variantF: landF, recommended: landRec, recommendedReasoned: true, hasVariants: true, hasVariantC: true, hasVariantD: true, hasVariantE: true, hasVariantF: true };
        return landResult;
      }
      // Utility pages — no meaningful A/B variation
      var utilityPages = ["thank-you", "privacy", "terms", "404"];
      if (utilityPages.includes(pid)) {
        var gd = buildGenericPage(colors, brief, pageDef, inspoContext, "A");
        return { id: pid, label: label, data: gd, variantA: gd, variantB: null, recommended: "A", hasVariants: false };
      }
      // Standalone pricing page — reuse services builders
      if (pid === "pricing") {
        var pA = buildServicesPage(colors, brief, inspoContext);
        var pB = buildServicesPageLight(colors, brief, inspoContext);
        var pRec = (patterns.pricing === "simple-list" || patterns.pricing === "two-tier") ? "B" : "A";
        return { id: pid, label: label, data: pRec === "B" ? pB : pA, variantA: pA, variantB: pB, recommended: pRec, recommendedReasoned: true, hasVariants: true };
      }
      // Standalone portfolio page — reuse work builders
      if (pid === "portfolio") {
        var portResult = buildWorkPage(colors, brief, inspoContext);
        var portRec = portResult.recommended || "A";
        return { id: pid, label: label, data: portRec === "B" ? portResult.variantB : portResult.variantA, variantA: portResult.variantA, variantB: portResult.variantB, recommended: portRec, recommendedReasoned: true, hasVariants: true };
      }
      // All other pattern-driven pages — A = light hero, B = dark hero
      var gA = buildGenericPage(colors, brief, pageDef, inspoContext, "A");
      var gB = buildGenericPage(colors, brief, pageDef, inspoContext, "B");
      return { id: pid, label: label, data: gA, variantA: gA, variantB: gB, recommended: "A", recommendedReasoned: false, hasVariants: true };
    }

    var recommended = (recs[pid] && recs[pid].variant) ? recs[pid].variant : result.recommended;

    return {
      id: pid,
      label: label,
      data: recommended === "B" ? result.variantB : result.variantA,
      variantA: result.variantA,
      variantB: result.variantB,
      recommended: recommended,
      recommendedReasoned: true,
      hasVariants: true,
    };
  }).filter(function(p) { return p !== null; });
}
