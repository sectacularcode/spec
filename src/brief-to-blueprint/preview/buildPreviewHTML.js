import { selectPatterns } from "../utils/patterns.js";
import { he } from "../utils/htmlEscape.js";
import { buildLandingPreview } from "./pages/landingPreview.js";
import { buildHomePreview } from "./pages/homePreview.js";
import { buildWorkPreview } from "./pages/workPreview.js";
import { buildServicesPreview } from "./pages/servicesPreview.js";
import { buildAboutPreview } from "./pages/aboutPreview.js";
import { buildProcessPreview } from "./pages/processPreview.js";
import { buildContactPreview } from "./pages/contactPreview.js";
import { buildPricingPreview } from "./pages/pricingPreview.js";
import { buildPortfolioPreview } from "./pages/portfolioPreview.js";
import { buildLocationPreview } from "./pages/locationPreview.js";
import { buildTeamPreview } from "./pages/teamPreview.js";
import { buildBlogPreview } from "./pages/blogPreview.js";
import { buildBlogPostPreview } from "./pages/blogPostPreview.js";
import { buildFaqPreview } from "./pages/faqPreview.js";
import { buildTestimonialsPreview } from "./pages/testimonialsPreview.js";
import { buildEventsPreview } from "./pages/eventsPreview.js";
import { buildCareersPreview } from "./pages/careersPreview.js";
import { buildCaseStudyPreview } from "./pages/caseStudyPreview.js";
import { buildEventSinglePreview } from "./pages/eventSinglePreview.js";
import { buildPressPreview } from "./pages/pressPreview.js";
import { buildPartnersPreview } from "./pages/partnersPreview.js";
import { buildResourcesPreview } from "./pages/resourcesPreview.js";
import { buildDownloadsPreview } from "./pages/downloadsPreview.js";

// Generates a complete HTML document string for the preview iframe.
// All user-controlled brief fields are sanitized via he() before insertion.
// The variant param ("A" or "B") controls which layout variant is shown.
//
// To add a new page preview:
//   1. Create preview/pages/xPreview.js exporting buildXPreview(brief,
//      variant, inspoContext, colors, patterns) -- follow any existing
//      file in preview/pages/ for the pattern (colors is the resolved
//      8-key palette object, not brief.colors directly).
//   2. Import it above and add `x: function() { return buildXPreview(...); },`
//      to the sections object below -- keep it wrapped in a function so it
//      stays lazy (only the active page's builder actually runs per render).
//   3. Add a pattern override in the override block above the sections
//      object, if the page needs one.
//   4. If the page needs A/B, ensure generatePages.js returns hasVariants: true.

// he() is imported separately but re-exported for backward compat with any
// callers that may import it from here
export { he };

export function buildPreviewHTML(brief, activePage, variant, inspoContext) {
  variant = variant || "A";

  // Sanitization happens per-field, at the point each page builder inserts
  // brief content into its HTML string (every builder does its own he()
  // calls -- verified across all 22 files in preview/pages/, and the five
  // that were missing it -- home/about/contact/process/services -- got it
  // added directly). A blanket whole-object he() pass used to run here
  // instead, which seemed like reasonable defense in depth but wasn't:
  // it ran before ANY builder saw the brief, so a field already carrying
  // deliberately pre-formed, safe HTML (brief.closingBody when
  // closingBodyIsHtml is true -- richTextToSafeHtml() in manifestImport.js
  // builds a real <a> tag into that string on purpose) got escaped into
  // literal visible "<a href=...>" text instead of rendering as a link,
  // and every other field got double-escaped on top of its own builder's
  // correct single pass (e.g. a real apostrophe ending up as literal
  // "&#39;" text on the page instead of an apostrophe). Per-field escaping
  // at the point of use is the only place that can tell "plain text, needs
  // escaping" apart from "pre-formed safe HTML, must not be touched again"
  // -- a blanket pass upstream of every builder never could.
  var patterns = selectPatterns(brief, inspoContext || "");

  // The Home page's A/B/C layouts are fixed hero+services combinations
  // (see generatePages.js), not something selectPatterns() alone knows
  // about -- without this override, switching A/B/C in the layout picker
  // would leave the preview showing the same thing every time, since
  // patterns.hero/services are otherwise inspo/content-driven only.
  var baseActivePageForPatterns = activePage.replace(/-\d+$/, "");
  if (baseActivePageForPatterns === "home") {
    if (variant === "A") { patterns.hero = "centered-bold"; }
    else if (variant === "B") { patterns.hero = "split-left"; }
    else if (variant === "C") { patterns.hero = "minimal"; patterns.services = "numbered-features"; }
  }

  // Strip timestamp suffix so custom pages (e.g. "faq-1718982345678") match
  // the same pattern-setting logic as their base type (e.g. "faq")
  var baseActivePage = activePage.replace(/-\d+$/, "");

  // Apply A/B variant overrides so the toggle actually changes the preview
  if (baseActivePage === "services") {
    patterns.services = (variant === "B") ? "alternating-rows" : "card-grid";
  }
  // NOTE: no generic "home" entry here (removed) -- the special-case block
  // above already fully handles home's A/B/C hero+services combination.
  // This block used to ALSO set patterns.hero for home via a plain A/B
  // ternary, which ran unconditionally right after the special-case block
  // and silently overwrote its correct C-variant "minimal" value back to
  // "centered-bold" every time (variant "C" !== "B", so the ternary's
  // false branch always fired) -- home page variant C's hero rendered
  // identically to variant A while its services section correctly stayed
  // on the C layout, a real, confirmed, live inconsistency. Verified
  // patterns.hero is genuinely read downstream (used to build the hero
  // section HTML) before removing this, and confirmed no other page type
  // has this same double-block collision -- home is the only page with a
  // preceding special-case override, everything else is handled by this
  // generic block alone.
  if (baseActivePage === "about") {
    patterns.about = (variant === "B") ? "team-grid" : "split-image";
  }
  if (baseActivePage === "process") {
    patterns.process = (variant === "B") ? "horizontal-timeline" : "numbered-vertical";
  }
  if (baseActivePage === "contact") {
    patterns.contact = (variant === "B") ? "split-form" : "centered-minimal";
  }
  if (baseActivePage === "work") {
    patterns.portfolio = (variant === "B") ? "case-study-cards" : "masonry-grid";
  }
  if (baseActivePage === "team") {
    patterns.team = (variant === "B") ? "featured-founder" : "photo-grid";
  }
  if (baseActivePage === "blog") {
    patterns.blog = (variant === "B") ? "featured-plus-grid" : "grid-3col";
  }
  if (baseActivePage === "testimonials") {
    patterns.testimonials = (variant === "B") ? "single-feature" : "card-grid";
  }
  if (baseActivePage === "events") {
    patterns.events = (variant === "B") ? "event-cards" : "date-list";
  }
  if (baseActivePage === "careers") {
    patterns.careers = (variant === "B") ? "values-first" : "job-list";
  }
  if (baseActivePage === "case-study") {
    patterns["case-study"] = (variant === "B") ? "editorial-light" : "dark-hero-metrics";
  }
  if (baseActivePage === "faq") {
    patterns.faq = (variant === "B") ? "two-column" : "accordion";
  }
  if (baseActivePage === "pricing") {
    patterns.pricing = (variant === "B") ? "two-tier" : "three-tier";
  }
  if (baseActivePage === "portfolio") {
    patterns.portfolio = (variant === "B") ? "editorial" : "dark-grid";
  }
  // No override entries here for landing, location, press, partners,
  // resources, downloads, blog-post, or event-single -- their sections
  // (below) branch on `variant` directly rather than reading a
  // patterns.X value, so a patterns.X entry for them would be computed
  // and never consumed. Confirmed this by tracing each one individually
  // before removing 8 exactly such dead assignments that were here.
  // landing's rendering lives entirely in ./pages/landingPreview.js and
  // takes variant as its own direct parameter; the other 7 check
  // `variant === "B"` inline within their own section function.

  // Per-key fallbacks for every color, not a single object-level check —
  // brief.colors can be a present-but-empty object (confirmed: every
  // Manifest import has brief.colors === {}, since Manifest's export
  // format carries no color data at all). {} is truthy in JS, so
  // `brief.colors || {defaults}` never falls through to the defaults —
  // C ends up {} and C.ink/C.brass/C.bone all evaluate to undefined,
  // which becomes the literal string "undefined" in a CSS value like
  // `background:undefined` — invalid CSS the browser silently drops,
  // rendering no background, no accent color, no visible section
  // structure at all. Every other color here already had its own
  // fallback and was fine; only these three were missing it.
  var colorDefaults = {
    ink: "#18181B", brass: "#52525B", "brass-deep": "#3F3F46",
    bone: "#F4F4F5", asphalt: "#27272A", stone: "#71717A",
    "warm-white": "#FAFAFA", text: "#3F3F46"
  };
  var C = brief.colors || {};
  var ink = C.ink || colorDefaults.ink,
      brass = C.brass || colorDefaults.brass,
      bone = C.bone || colorDefaults.bone,
      warmWhite = C["warm-white"] || colorDefaults["warm-white"], stone = C.stone || colorDefaults.stone,
      brassDp = C["brass-deep"] || colorDefaults["brass-deep"], asphalt = C.asphalt || colorDefaults.asphalt,
      text = C.text || colorDefaults.text;
  var fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap";
  // One resolved-palette object shared by every extracted page-preview module
  var colorsObj = { ink: ink, brass: brass, bone: bone, warmWhite: warmWhite, stone: stone, brassDp: brassDp, asphalt: asphalt, text: text };

  var sections = {
    home: function() { return buildHomePreview(brief, variant, inspoContext, colorsObj, patterns); },

    work: function() { return buildWorkPreview(brief, variant, inspoContext, colorsObj, patterns); },

    services: function() { return buildServicesPreview(brief, variant, inspoContext, colorsObj, patterns); },
    about: function() { return buildAboutPreview(brief, variant, inspoContext, colorsObj, patterns); },

    process: function() { return buildProcessPreview(brief, variant, inspoContext, colorsObj, patterns); },

    contact: function() { return buildContactPreview(brief, variant, inspoContext, colorsObj, patterns); },

    landing: function() { return buildLandingPreview(brief, variant, inspoContext, colorsObj); },

    // ── TEAM ──
    team: function() { return buildTeamPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── BLOG ──
    blog: function() { return buildBlogPreview(brief, variant, inspoContext, colorsObj, patterns); },

    "blog-post": function() { return buildBlogPostPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── FAQ ──
    faq: function() { return buildFaqPreview(brief, variant, inspoContext, colorsObj, patterns); },

    pricing: function() { return buildPricingPreview(brief, variant, inspoContext, colorsObj, patterns); },

    testimonials: function() { return buildTestimonialsPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── EVENTS ──
    events: function() { return buildEventsPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── CAREERS ──
    careers: function() { return buildCareersPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── CASE STUDY ──
    "case-study": function() { return buildCaseStudyPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── THANK YOU ──
    "thank-you": function() { return "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-size:48px;margin-bottom:24px;'>✓</div>" +
      "<h1 style='font-size:clamp(32px,5vw,48px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Thank you.</h1>" +
      "<p style='font-size:18px;color:" + text + ";max-width:480px;margin:0 auto 32px;line-height:1.7;'>Your message has been received. We will get back to you within one business day.</p>" +
      "<a href='/' style='font-size:14px;color:" + brassDp + ";text-decoration:underline;'>← Back to homepage</a>" +
    "</section>"; },

    // ── PRIVACY / TERMS ──
    privacy: function() { return "<section style='background:" + bone + ";padding:80px 40px;'><div style='max-width:760px;margin:0 auto;'>" +
      "<h1 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 32px;'>Privacy Policy</h1>" +
      "<div style='font-size:16px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:20px;'>Last updated: [Date]</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Information We Collect</h2><p style='margin-bottom:20px;'>Placeholder for your privacy policy content.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>How We Use Your Information</h2><p style='margin-bottom:20px;'>Placeholder for usage details.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Contact</h2><p>For questions about this policy, contact us at [email].</p></div>" +
    "</div></section>"; },

    terms: function() { return "<section style='background:" + bone + ";padding:80px 40px;'><div style='max-width:760px;margin:0 auto;'>" +
      "<h1 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 32px;'>Terms of Service</h1>" +
      "<div style='font-size:16px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:20px;'>Last updated: [Date]</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Agreement to Terms</h2><p style='margin-bottom:20px;'>By accessing this website, you agree to these terms.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Services</h2><p style='margin-bottom:20px;'>Description of services provided.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Limitation of Liability</h2><p>Standard limitation clause placeholder.</p></div>" +
    "</div></section>"; },

    // ── PORTFOLIO SINGLE ──
    portfolio: function() { return buildPortfolioPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── LOCATION ──
    location: function() { return buildLocationPreview(brief, variant, inspoContext, colorsObj, patterns); },
    // ── EVENT SINGLE ──
    "event-single": function() { return buildEventSinglePreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── PRESS / MEDIA ──
    press: function() { return buildPressPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── PARTNERS ──
    partners: function() { return buildPartnersPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── RESOURCES ──
    resources: function() { return buildResourcesPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── DOWNLOADS ──
    downloads: function() { return buildDownloadsPreview(brief, variant, inspoContext, colorsObj, patterns); },

    // ── 404 ──
    "404": function() { return "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-size:clamp(80px,15vw,160px);font-weight:800;color:" + brass + ";line-height:1;margin-bottom:16px;'>404</div>" +
      "<h1 style='font-size:clamp(24px,4vw,36px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Page not found</h1>" +
      "<p style='font-size:17px;color:" + text + ";max-width:400px;margin:0 auto 32px;line-height:1.7;'>The page you are looking for does not exist or has been moved.</p>" +
      "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Back to homepage</a>" +
    "</section>"; },

  };

  var ap = activePage.toLowerCase();
  // "other" is an alias for "landing" (see generatePages.js) — same builder,
  // different label in the UI. The sections dict below only has a
  // "landing" key; without this alias, an "other" page falls through every
  // fallback attempt to sections.home, showing the wrong preview entirely
  // for what's now the default page type on every Manifest import.
  if (ap === "other" || ap.indexOf("other-") === 0) ap = "landing";
  // Lazy dispatch -- sections' values are all zero-arg functions now, not
  // pre-built strings, so only the one page actually shown gets built
  // (previously every section was built on every render, then 21+ of the
  // 23 results were thrown away unused). Verified byte-for-byte identical
  // output to the eager version before shipping.
  var resolvedSection = sections[ap] 
    || sections[ap.replace(/-\d+$/, "")] 
    || sections[ap.split("-")[0]]
    || sections[ap.replace(/[^a-z]/g, "")]
    || sections.home;
  var body = resolvedSection();

  var navItems = (brief.pages || ["Home","About","Services","Contact"]).map(function(p) { return he(typeof p === "string" ? p : (p.label || p.name || p)); }).slice(0,6);

  return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>" + he(brief.brandName || "Preview") + "</title>" +
    "<link href='" + fontUrl + "' rel='stylesheet'>" +
    "<style>" +
      "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}" +
      "body{font-family:'Inter',system-ui,sans-serif;font-size:17px;line-height:1.65;background:" + bone + ";color:" + text + ";}" +
      "img{max-width:100%;}section{width:100%;}" +
      "#mobile-nav{display:none;}" +
      "@media(max-width:768px){" +
        ".nav-links{display:none !important;}" +
        ".hamburger{display:flex !important;}" +
        "#mobile-nav.open{display:block !important;}" +
        "section{padding:40px 20px !important;}" +
        "section > div{padding-left:0 !important;padding-right:0 !important;}" +
        "[style*='grid-template-columns']{grid-template-columns:1fr !important;gap:0 !important;}" +
        "section[style*='display:grid']{display:flex !important;flex-direction:column !important;}" +
        ".landing-img{min-height:240px !important;order:1 !important;}" +
        ".feature-text{order:2 !important;padding:24px 20px 32px 20px !important;}" +
        ".landing-img img{min-height:240px !important;height:240px !important;object-fit:cover !important;}" +
        "[style*='padding:72px 64px']{padding:28px 20px !important;}" +
        ".feature-text{padding-top:28px !important;}" +
        "[style*='padding:64px 56px']{padding:32px 20px !important;}" +
        "[style*='padding:40px 32px']{padding:24px 20px !important;}" +
        "[style*='padding:48px 36px']{padding:20px !important;}" +
        "[style*='padding:100px 40px']{padding:32px 20px !important;}" +
        "[style*='padding:80px 40px']{padding:40px 20px !important;}" +
        "[style*='padding:80px clamp']{padding:40px 20px !important;}" +
        "[style*='border-right:1px solid']{border-right:none !important;border-bottom:1px solid rgba(0,0,0,0.06) !important;}" +
        "[style*='display:flex'][style*='gap:16px']{flex-direction:column !important;gap:10px !important;}" +
        "[style*='display:flex'][style*='gap:24px']{flex-direction:column !important;gap:12px !important;}" +
        "[style*='display:flex'][style*='gap:32px']{flex-direction:column !important;gap:14px !important;}" +
        "[style*='display:flex'][style*='gap:40px']{flex-direction:column !important;gap:16px !important;}" +
        "[style*='display:flex'][style*='gap:48px'],[style*='display:flex'][style*='gap:64px'],[style*='display:flex'][style*='gap:80px']{flex-direction:column !important;gap:20px !important;}" +
        ".cta-btn{display:block !important;width:100% !important;box-sizing:border-box !important;text-align:center !important;margin-bottom:10px !important;}" +
        ".row-btn{display:inline-block !important;width:auto !important;max-width:fit-content !important;padding:10px 20px !important;font-size:12px !important;letter-spacing:0.08em !important;margin-top:8px !important;}" +
        ".footer-link{display:inline !important;width:auto !important;text-align:left !important;margin-bottom:0 !important;}" +
        "button[style*='padding:14px']{width:100% !important;box-sizing:border-box !important;}" +
        "h1{font-size:clamp(26px,7vw,36px) !important;line-height:1.15 !important;}" +
        "h2{font-size:clamp(20px,5vw,28px) !important;line-height:1.2 !important;}" +
        "h3{font-size:17px !important;}" +
        "[style*='aspect-ratio:16/9']{aspect-ratio:unset !important;height:180px !important;}" +
        "[style*='aspect-ratio:4/3']{aspect-ratio:unset !important;height:180px !important;}" +
        "[style*='aspect-ratio:3/4']{aspect-ratio:unset !important;height:200px !important;}" +
        "[style*='aspect-ratio:1']{aspect-ratio:unset !important;height:160px !important;}" +
        "div[style='height:120px']{height:36px !important;}" +
        "div[style='height:96px']{height:28px !important;}" +
        "div[style='height:80px']{height:24px !important;}" +
        "div[style='height:64px']{height:20px !important;}" +
        "div[style='height:48px']{height:14px !important;}" +
        "div[style='height:40px']{height:12px !important;}" +
        "div[style='height:32px']{height:10px !important;}" +
        "div[style='height:24px']{height:8px !important;}" +
        "[style*='min-height:80vh'],[style*='min-height:70vh']{min-height:50vh !important;padding-top:36px !important;padding-bottom:36px !important;}" +
        "[style*='min-height:420px']{min-height:240px !important;}" +
        "[style*='min-height:400px']{min-height:240px !important;}" +
        "[style*='max-width:1100px'],[style*='max-width:1060px'],[style*='max-width:900px']{max-width:100% !important;}" +
        "footer{padding:32px 20px !important;}" +
        "footer > div{flex-direction:column !important;gap:16px !important;align-items:flex-start !important;}" +
        ".footer-nav{flex-direction:column !important;gap:12px !important;align-items:flex-start !important;}" +
        ".benefit-row{padding:14px 0 !important;display:flex !important;flex-direction:row !important;align-items:center !important;gap:14px !important;}" +
        ".benefit-row:last-child{border-bottom:none !important;}" +
        ".benefit-check{font-size:20px !important;}" +
        ".benefit-text{font-size:13px !important;line-height:1.2 !important;}" +
        "[style*=\"box-shadow:0 1px 4px\"]{margin-bottom:12px !important;}" +
        "[style*='min-height:50vh']{min-height:0 !important;}" +
        "[style*='padding:80px clamp(24px,6vw,80px)']{padding:36px 20px !important;}" +
        "" +
        /* VARIANT A — fully left aligned on mobile */
        ".va-hero,.va-hero *{text-align:left !important;}" +
        ".va-trust .grid-cell{text-align:left !important;}" +
        ".va-cta{text-align:left !important;}" +
        ".va-cta h2,.va-cta p{text-align:left !important;}" +
        ".va-cta div[style*='justify-content:center']{justify-content:flex-start !important;}" +
        ".va-cta p[style*='margin-left:auto']{margin-left:0 !important;margin-right:0 !important;}" +
        ".var-a-wrap,.var-a-wrap *{text-align:left !important;}" +
        ".feature-text h2,.feature-text p{text-align:left !important;}" +
        ".feature-text .row-btn{align-self:flex-start !important;}" +
        /* VARIANT B — fully center aligned on mobile */
        ".var-b-hero,.var-b-hero *{text-align:center !important;}" +
        ".var-b-body{text-align:center !important;}" +
        ".var-b-body h2,.var-b-body p,.var-b-body div{text-align:center !important;}" +
        /* VARIANT C — center hero (default), left body */
        ".benefit-row,.benefit-row *{text-align:left !important;}" +

      "}" +
    "a.cta-btn,a.row-btn{transition:opacity 0.15s ease,transform 0.15s ease,background-color 0.15s ease,color 0.15s ease;}" +
    "a.cta-btn:hover{opacity:0.88;transform:translateY(-1px);}" +
    "a.row-btn:hover{background-color:" + brass + ";color:#ffffff;border-color:" + brass + ";opacity:1;}" +
    "</style>" +
    "</head><body>" +
    "<nav style='background:" + ink + ";padding:14px clamp(20px,5vw,60px);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:100;'>" +
      "<div style='font-family:Inter,sans-serif;font-weight:800;font-size:18px;color:" + warmWhite + ";'>" + he(brief.brandName || "Brand") + "</div>" +
      "<div class='nav-links' style='display:flex;gap:24px;align-items:center;'>" +
        navItems.map(function(l) { return "<a style='color:" + warmWhite + ";text-decoration:none;font-size:14px;font-weight:500;'>" + l + "</a>"; }).join("") +
        "<a style='padding:8px 20px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;text-decoration:none;border-radius:4px;margin-left:8px;'>" + he(brief.headerCta || "Get in touch") + "</a>" +
      "</div>" +
      "<button class='hamburger' onclick='toggleMobileNav()' style='display:none;background:none;border:none;cursor:pointer;padding:4px;'>" +
        "<svg id='ham-icon' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='" + warmWhite + "' stroke-width='2' stroke-linecap='round'>" +
          "<line x1='3' y1='6' x2='21' y2='6'/><line x1='3' y1='12' x2='21' y2='12'/><line x1='3' y1='18' x2='21' y2='18'/>" +
        "</svg>" +
        "<svg id='close-icon' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='" + warmWhite + "' stroke-width='2' stroke-linecap='round' style='display:none;'>" +
          "<line x1='4' y1='4' x2='20' y2='20'/><line x1='20' y1='4' x2='4' y2='20'/>" +
        "</svg>" +
      "</button>" +
    "</nav>" +
    "<div id='mobile-nav' style='background:" + ink + ";border-top:1px solid rgba(255,255,255,.1);'>" +
      "<div style='padding:8px 20px 20px;display:flex;flex-direction:column;gap:0;'>" +
        navItems.map(function(l) { return "<a style='color:" + warmWhite + ";text-decoration:none;font-size:16px;font-weight:500;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07);display:block;'>" + l + "</a>"; }).join("") +
        "<a style='margin-top:16px;padding:14px 20px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:4px;text-align:center;display:block;'>" + he(brief.headerCta || "Get in touch") + "</a>" +
      "</div>" +
    "</div>" +
    body +
    "<footer style='background:" + ink + ";padding:48px clamp(20px,5vw,60px);'>" +
      "<div style='display:flex;flex-direction:column;align-items:flex-start;gap:24px;max-width:1100px;margin:0 auto;'>" +
        "<div style='font-family:Inter,sans-serif;font-weight:800;font-size:18px;color:" + warmWhite + ";'>" + he(brief.brandName || "Brand") + "</div>" +
        (brief.tagline ? "<div style='font-size:13px;color:rgba(255,255,255,0.65);margin-top:-16px;'>" + he(brief.tagline) + "</div>" : "") +
        "<div class='footer-nav' style='display:flex;gap:24px;flex-wrap:wrap;'>" + navItems.map(function(l) { return "<a class='footer-link' style='color:rgba(255,255,255,0.8);text-decoration:none;font-size:13px;font-weight:500;'>" + l + "</a>"; }).join("") + "</div>" +
        (brief.contactEmail ? "<div style='font-size:13px;color:rgba(255,255,255,0.6);'>" + he(brief.contactEmail || "") + "</div>" : "") +
        "<div style='font-size:12px;color:rgba(255,255,255,0.35);padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);width:100%;'>" + he(brief.brandName || "Brand") + " &copy; " + new Date().getFullYear() + " &nbsp;&middot;&nbsp; <a class='footer-link' href='#' style='color:rgba(255,255,255,0.45);text-decoration:none;font-size:12px;'>Privacy Policy</a> &nbsp;&middot;&nbsp; <a class='footer-link' href='#' style='color:rgba(255,255,255,0.45);text-decoration:none;font-size:12px;'>Cookie Policy</a></div>" +
      "</div>" +
    "</footer>" +
    "<script>" +
      "function toggleMobileNav(){" +
        "var nav=document.getElementById('mobile-nav');" +
        "var ham=document.getElementById('ham-icon');" +
        "var cls=document.getElementById('close-icon');" +
        "var open=nav.classList.toggle('open');" +
        "ham.style.display=open?'none':'block';" +
        "cls.style.display=open?'block':'none';" +
      "}" +
      // Mobile padding catch-all — fires after render, catches clamp() values CSS can't target
      "if(window.innerWidth<=768){" +
        "document.querySelectorAll('section').forEach(function(el){" +
          "el.style.paddingTop='44px';" +
          "el.style.paddingBottom='44px';" +
          "el.style.paddingLeft='20px';" +
          "el.style.paddingRight='20px';" +
        "});" +
        "document.querySelectorAll('section > div').forEach(function(el){" +
          "el.style.paddingLeft='0';" +
          "el.style.paddingRight='0';" +
        "});" +
      "}" +
    "</script>" +
    "</body></html>";
}
