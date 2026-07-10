import { selectPatterns, parseInspoPatterns } from "../utils/patterns.js";
import { he } from "../utils/htmlEscape.js";

// Mirrors landing.js's selectFeatureRowStyle() exactly — same density
// thresholds, same inspo-signal override, same relevant pattern IDs. This
// duplication is deliberate: keeping the logic inline in each file (rather
// than one importing a shared helper from the other) matches how the rest
// of this file already mirrors landing.js's structure independently, and
// avoids a preview-only file depending on an export-only one. If the
// thresholds or pattern mapping ever change, update both.
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

// Generates a complete HTML document string for the preview iframe.
// All user-controlled brief fields are sanitized via he() before insertion.
// The variant param ("A" or "B") controls which layout variant is shown.
//
// To add a new page preview:
//   1. Add a section key to the sections object below
//   2. Add a pattern override in the override block at the top
//   3. If the page needs A/B, ensure generatePages.js returns hasVariants: true

// he() is imported separately but re-exported for backward compat with any
// callers that may import it from here
export { he };

export function buildPreviewHTML(brief, activePage, variant, inspoContext) {
  variant = variant || "A";

  // Sanitize all string fields up-front so every downstream insertion is XSS-safe
  var safe = {};
  Object.keys(brief || {}).forEach(function(k) {
    var v = (brief || {})[k];
    safe[k] = typeof v === "string" ? he(v) : v;
  });
  brief = safe;

  var patterns = selectPatterns(brief, inspoContext || "");

  // Strip timestamp suffix so custom pages (e.g. "faq-1718982345678") match
  // the same pattern-setting logic as their base type (e.g. "faq")
  var baseActivePage = activePage.replace(/-\d+$/, "");

  // Apply A/B variant overrides so the toggle actually changes the preview
  if (baseActivePage === "services") {
    patterns.services = (variant === "B") ? "alternating-rows" : "card-grid";
  }
  if (baseActivePage === "home") {
    patterns.hero = (variant === "B") ? "split-left" : "centered-bold";
  }
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
  if (baseActivePage === "landing") {
    patterns.landing = (variant === "B") ? "split-light" : "centered-dark";
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
  if (baseActivePage === "location") {
    patterns.location = (variant === "B") ? "centered" : "map-split";
  }
  if (baseActivePage === "press") {
    patterns.press = (variant === "B") ? "featured-hero" : "list";
  }
  if (baseActivePage === "partners") {
    patterns.partners = (variant === "B") ? "description-list" : "logo-grid";
  }
  if (baseActivePage === "resources") {
    patterns.resources = (variant === "B") ? "category-list" : "card-grid";
  }
  if (baseActivePage === "downloads") {
    patterns.downloads = (variant === "B") ? "card-grid" : "simple-list";
  }
  if (baseActivePage === "blog-post") {
    patterns["blog-post"] = (variant === "B") ? "wide-editorial" : "narrow-centered";
  }
  if (baseActivePage === "event-single") {
    patterns["event-single"] = (variant === "B") ? "light-centered" : "dark-hero";
  }
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
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  var C = brief.colors || {};
  var ink = C.ink || colorDefaults.ink,
      brass = C.brass || colorDefaults.brass,
      bone = C.bone || colorDefaults.bone,
      warmWhite = C["warm-white"] || colorDefaults["warm-white"], stone = C.stone || colorDefaults.stone,
      brassDp = C["brass-deep"] || colorDefaults["brass-deep"], asphalt = C.asphalt || colorDefaults.asphalt,
      text = C.text || colorDefaults.text;
  var fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap";

  var sections = {
    home: (function() {
      var hp = patterns.hero;
      
      // ── HERO VARIANTS ──
      var heroHTML = "";
      if (hp === "split-right") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + (brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "centered-bold") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(80px,12vw,140px) clamp(24px,8vw,80px);text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>" + (brief.brandName || "Brand") + "</div>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,72px);color:" + warmWhite + ";margin:0 0 24px;line-height:1.05;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;margin:0 auto 40px;line-height:1.7;max-width:560px;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<div style='display:flex;gap:12px;justify-content:center;flex-wrap:wrap;'>" +
              "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
              "<a style='padding:14px 40px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + (brief.heroCta2 || "Learn more") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "full-image") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(100px,15vw,180px) clamp(24px,8vw,80px);text-align:center;position:relative;'>" +
          "<div style='position:absolute;inset:0;background:#e0ddd7;opacity:0.3;'></div>" +
          "<div style='position:relative;max-width:700px;margin:0 auto;'>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,64px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.08;text-shadow:0 2px 20px rgba(0,0,0,0.3);'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";margin:0 0 36px;line-height:1.7;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>";
      } else if (hp === "minimal") {
        heroHTML = "<section style='background:" + bone + ";padding:clamp(100px,15vw,200px) clamp(24px,8vw,80px);'>" +
          "<div style='max-width:800px;'>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(40px,7vw,80px);color:" + ink + ";margin:0 0 24px;line-height:1.05;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + stone + ";margin:0 0 40px;line-height:1.7;max-width:480px;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<a style='padding:14px 32px;background:" + ink + ";color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:0;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>";
      } else { // split-left (default)
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + (brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + (brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;max-width:480px;'>" + (brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<div style='display:flex;gap:12px;flex-wrap:wrap;'>" +
                "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + (brief.heroCta1 || "Get started") + "</a>" +
                "<a style='padding:14px 32px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + (brief.heroCta2 || "Learn more") + "</a>" +
              "</div>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
          "</div>" +
        "</section>";
      }
      
      // ── SERVICES VARIANTS ──
      var sp = patterns.services;
      var svcCards = (brief.serviceCards || [["Service One","Description of what this service provides."],["Service Two","Description of what this service provides."],["Service Three","Description of what this service provides."]]);
      var servicesHTML = "";
      if (sp === "alternating-rows") {
        servicesHTML = "<section style='background:" + bone + ";padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='max-width:1100px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 48px;'>" + (brief.servicesHeading || "Our services") + "</h2>" +
          svcCards.map(function(pair, idx) {
            var imgFirst = idx % 2 === 0;
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:48px;'>" +
              (imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Image</div>" : "") +
              "<div><h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:16px;color:" + stone + ";line-height:1.7;margin:0;'>" + pair[1] + "</p></div>" +
              (!imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Image</div>" : "") +
            "</div>";
          }).join("") +
        "</div></section>";
      } else if (sp === "numbered-features") {
        servicesHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);'><div style='max-width:900px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 48px;'>" + (brief.servicesHeading || "Our services") + "</h2>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else { // card-grid
        servicesHTML = "<section style='background:" + bone + ";padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='max-width:1100px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 40px;'>" + (brief.servicesHeading || "Our services") + "</h2>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            svcCards.map(function(pair) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'><div style='width:40px;height:3px;background:" + brass + ";margin-bottom:20px;'></div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div>";
            }).join("") +
          "</div>" +
        "</div></section>";
      }

      // ── ABOUT VARIANTS ──
      var ap = patterns.about;
      var aboutHTML = "";
      if (ap === "centered-narrative") {
        aboutHTML = "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);'><div style='max-width:720px;margin:0 auto;text-align:center;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 24px;line-height:1.15;'>" + (brief.aboutHeading || "Our story") + "</h2>" +
          "<p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0;text-align:left;'>" + (brief.aboutBody || "Your company story goes here.") + "</p>" +
        "</div></section>";
      } else { // split-image
        aboutHTML = "<section style='background:#ffffff;padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>About image</div>" +
          "<div>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
            "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 16px;line-height:1.15;'>" + (brief.aboutHeading || "About the company") + "</h2>" +
            "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0;'>" + (brief.aboutBody || "Your company story goes here.") + "</p>" +
          "</div>" +
        "</div></section>";
      }

      // ── TESTIMONIALS ──
      var tp = patterns.testimonials;
      var testimonialsHTML = "";
      if (tp === "single-large") {
        testimonialsHTML = "<section style='background:" + bone + ";padding:100px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:32px;'>Kind words</div>" +
          "<p style='font-size:clamp(20px,3vw,28px);color:" + ink + ";line-height:1.5;font-style:italic;margin:0 0 24px;'>This changed everything for our business. The quality of work exceeded every expectation.</p>" +
          "<div style='font-size:14px;font-weight:600;color:" + ink + ";'>Client Name</div><div style='font-size:13px;color:" + stone + ";'>CEO, Company</div>" +
        "</div></section>";
      } else { // card-grid
        testimonialsHTML = "<section style='background:" + bone + ";padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='max-width:1100px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Kind words</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 28px;'>What our clients say</h2>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            ["This changed everything for our business.", "Professional and genuinely cared about the outcome.", "We saw results within the first month."].map(function(q) {
              return "<div style='background:#ffffff;border-left:3px solid " + brass + ";padding:28px;'><p style='font-size:17px;color:" + ink + ";line-height:1.5;margin:0 0 16px;font-style:italic;'>" + q + "</p><div style='font-size:14px;font-weight:600;color:" + ink + ";'>Client Name</div><div style='font-size:13px;color:" + stone + ";'>Role, Company</div></div>";
            }).join("") +
          "</div>" +
        "</div></section>";
      }

      // ── CTA VARIANTS ──
      var cp = patterns.cta;
      var ctaHTML = "";
      if (cp === "split-cta") {
        ctaHTML = "<section style='background:" + ink + ";padding:60px clamp(24px,8vw,80px);'><div style='display:flex;justify-content:space-between;align-items:center;max-width:1160px;margin:0 auto;flex-wrap:wrap;gap:24px;'>" +
          "<h2 style='font-weight:800;font-size:clamp(20px,3vw,32px);color:" + warmWhite + ";margin:0;'>" + (brief.tagline || "Ready to get started?") + "</h2>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Start a project</a>" +
        "</div></section>";
      } else if (cp === "minimal-line") {
        ctaHTML = "<section style='background:" + bone + ";padding:60px clamp(24px,8vw,80px);text-align:center;border-top:1px solid #E2DBCC;'>" +
          "<a style='font-size:16px;color:" + brassDp + ";text-decoration:underline;font-weight:600;'>" + (brief.heroCta1 || "Start a project") + " →</a>" +
        "</section>";
      } else { // dark-full
        ctaHTML = "<section style='background:" + ink + ";padding:80px clamp(24px,8vw,80px);text-align:center;'>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,4vw,44px);color:" + warmWhite + ";margin:0 0 12px;'>" + (brief.tagline || "Ready to get started?") + "</h2>" +
          "<p style='font-size:14px;color:" + stone + ";letter-spacing:2px;text-transform:uppercase;margin:0 0 32px;'>" + (brief.signatureLine || "") + "</p>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Start a project</a>" +
        "</section>";
      }

      // ── HOOK ──
      var hookHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 16px;line-height:1.15;'>" + (brief.hookStatement || "The problem you solve, stated clearly.") + "</h2>" +
        "<p style='font-size:17px;color:" + text + ";line-height:1.7;margin:0;'>" + (brief.hookBody || "") + "</p>" +
      "</div></section>";

      // ── PRICING TEASER ──
      var pricingHTML = "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 16px;'>Clear pricing. No surprises.</h2>" +
        "<p style='font-size:17px;color:" + text + ";line-height:1.7;margin:0 0 32px;'>See what it costs before you book a call.</p>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>See pricing</a>" +
      "</div></section>";

      return heroHTML + hookHTML + servicesHTML + aboutHTML + testimonialsHTML + pricingHTML + ctaHTML;
    })(),

    work: (function() {
      var wp = patterns.portfolio || "masonry-grid";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Work</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Selected projects</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>A look at what we have built.</p>" +
      "</div></section>";
      var body = "";
      if (wp === "case-study-cards") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          [1,2,3,4].map(function(n) {
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-bottom:40px;background:#fff;border:1px solid #E2DBCC;border-radius:4px;overflow:hidden;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
              "<div style='padding:32px;'><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>Category</div>" +
              "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>Project Title " + n + "</h3>" +
              "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Brief description of this project and the results achieved.</p></div></div>";
          }).join("") + "</div></section>";
      } else if (wp === "full-width-stacked") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          [1,2,3].map(function(n) {
            return "<div style='margin-bottom:48px;'><div style='background:#e0ddd7;aspect-ratio:21/9;display:flex;align-items:center;justify-content:center;color:" + stone + ";margin-bottom:20px;border-radius:4px;'>Project " + n + " — full width image</div>" +
              "<div style='display:flex;justify-content:space-between;align-items:baseline;'>" +
              "<h3 style='font-size:20px;font-weight:700;color:" + ink + ";margin:0;'>Project Title " + n + "</h3>" +
              "<span style='font-size:13px;color:" + stone + ";'>Category · Year</span></div></div>";
          }).join("") + "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:20px;max-width:1160px;margin:0 auto;'>" +
          [1,2,3,4,5,6].map(function(n) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:" + (n % 2 === 0 ? "4/3" : "3/4") + ";display:flex;align-items:center;justify-content:center;color:" + stone + ";border-radius:4px;margin-bottom:12px;'>Project " + n + "</div>" +
              "<div style='font-size:15px;font-weight:600;color:" + ink + ";'>Project Title " + n + "</div>" +
              "<div style='font-size:13px;color:" + stone + ";'>Category</div></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
    })(),

    services: (function() {
      var sp = patterns.services;
      var svcCards = brief.serviceCards || [["Service One","Description goes here."],["Service Two","Description goes here."],["Service Three","Description goes here."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'>" +
        "<div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Services</div>" +
          "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.servicesH1 || "What we offer") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>" + (brief.servicesSubhead || "Our full range of services.") + "</p>" +
        "</div></section>";
      var body = "";
      if (sp === "alternating-rows") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            var imgFirst = idx % 2 === 0;
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:48px;'>" +
              (imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" : "") +
              "<div><h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:16px;color:" + stone + ";line-height:1.7;margin:0;'>" + pair[1] + "</p></div>" +
              (!imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" : "") +
            "</div>";
          }).join("") + "</div></section>";
      } else if (sp === "numbered-features") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div></div>";
          }).join("") + "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          svcCards.map(function(pair) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'><div style='width:40px;height:3px;background:" + brass + ";margin-bottom:20px;'></div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + pair[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + pair[1] + "</p></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
    })(),
    about: (function() {
      var ap = patterns.about;
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.aboutHeading || "Our story") + "</h1>" +
      "</div></section>";
      var body = "";
      if (ap === "centered-narrative") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.8;margin:0 0 32px;'>" + (brief.aboutBody || "Your company story goes here.") + "</p>" +
          "<div style='display:flex;gap:32px;flex-wrap:wrap;margin-top:40px;'>" +
            ["Direct", "Useful", "Opinionated", "Human"].map(function(v) {
              return "<div style='font-size:15px;font-weight:700;color:" + brass + ";'>" + v + "</div>";
            }).join("") +
          "</div></div></section>";
      } else if (ap === "team-grid") {
        body = "<section style='background:" + bone + ";padding:40px 40px 48px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0 0 48px;'>" + (brief.aboutBody || "Your company story.") + "</p></div></section>" +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:1160px;margin:0 auto;text-align:center;'>" +
            ["Founder", "Lead Designer", "Strategist", "Developer"].map(function(role) {
              return "<div><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Photo</div><div style='font-weight:700;color:" + ink + ";'>[Name]</div><div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + role + "</div></div>";
            }).join("") +
          "</div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>About image</div>" +
          "<div><p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0;'>" + (brief.aboutBody || "Your company story.") + "</p></div>" +
        "</div></section>";
      }
      return header + body;
    })(),

    process: (function() {
      var pp = patterns.process || "numbered-vertical";
      var steps = brief.processSteps || [["Discovery","We learn about your business and goals."],["Strategy","We create a plan tailored to you."],["Execute","We bring the plan to life."],["Deliver","You get the finished product, ready to use."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Process</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.processH1 || "How it works") + "</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>Simple and calm, from first call to final files.</p>" +
      "</div></section>";
      var body = "";
      if (pp === "icon-cards") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          steps.map(function(s, i) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;text-align:center;'>" +
              "<div style='font-size:32px;font-weight:800;color:" + brass + ";margin-bottom:16px;'>0" + (i+1) + "</div>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + s[0] + "</h3>" +
              "<p style='font-size:14px;color:" + stone + ";line-height:1.6;margin:0;'>" + s[1] + "</p></div>";
          }).join("") + "</div></section>";
      } else if (pp === "horizontal-timeline") {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:flex;gap:0;position:relative;'>" +
            steps.map(function(s, i) {
              return "<div style='flex:1;text-align:center;padding:0 16px;'>" +
                "<div style='width:32px;height:32px;background:" + brass + ";border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:700;'>" + (i+1) + "</div>" +
                "<h3 style='font-size:16px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + s[0] + "</h3>" +
                "<p style='font-size:13px;color:" + stone + ";line-height:1.5;margin:0;'>" + s[1] + "</p></div>";
            }).join("") +
          "</div></div></section>";
      } else {
        body = "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          steps.map(function(s, i) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;" + (i < steps.length-1 ? "border-bottom:1px solid #E2DBCC;" : "") + "'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (i+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + s[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + s[1] + "</p></div></div>";
          }).join("") + "</div></section>";
      }
      return header + body;
    })(),

    contact: (function() {
      var cp2 = patterns.contact || "split-form";
      if (cp2 === "centered-minimal") {
        return "<section style='background:" + bone + ";padding:100px 40px;text-align:center;'><div style='max-width:560px;margin:0 auto;'>" +
          "<h1 style='font-weight:800;font-size:clamp(32px,5vw,48px);color:" + ink + ";margin:0 0 16px;'>" + (brief.contactH1 || "Get in touch") + "</h1>" +
          "<p style='font-size:17px;color:" + text + ";margin:0 0 40px;line-height:1.7;'>" + (brief.contactSubhead || "We will get back to you within one business day.") + "</p>" +
          "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:8px;text-align:left;'>" +
            ["Name", "Email", "Message"].map(function(f) {
              return "<div style='margin-bottom:16px;'><div style='font-size:13px;font-weight:600;color:" + ink + ";margin-bottom:6px;'>" + f + "</div><div style='background:#f9f9f9;border:1px solid #E2DBCC;padding:12px;border-radius:4px;color:" + stone + ";font-size:14px;'>Enter " + f.toLowerCase() + "</div></div>";
            }).join("") +
            "<a style='display:block;padding:14px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;text-align:center;'>" + (brief.contactButton || "Send it over") + "</a>" +
          "</div></div></section>";
      } else {
        return "<section style='background:" + bone + ";padding:88px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:1160px;margin:0 auto;'>" +
          "<div>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Contact</div>" +
            "<h1 style='font-weight:800;font-size:clamp(32px,4vw,48px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>" + (brief.contactH1 || "Tell us about your project.") + "</h1>" +
            "<p style='font-size:17px;color:" + text + ";margin:0 0 32px;line-height:1.7;'>" + (brief.contactSubhead || "A real reply, usually within one business day.") + "</p>" +
            "<p style='font-size:15px;color:" + stone + ";'>" + (brief.contactReassurance || "No sales team. No automated funnel. Just one maker who will read it and write back.") + "</p>" +
          "</div>" +
          "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:8px;'>" +
            ["Name", "Email", "Company", "What do you need?", "Message"].map(function(f) {
              return "<div style='margin-bottom:16px;'><div style='font-size:13px;font-weight:600;color:" + ink + ";margin-bottom:6px;'>" + f + "</div><div style='background:#f9f9f9;border:1px solid #E2DBCC;padding:12px;border-radius:4px;color:" + stone + ";font-size:14px;'></div></div>";
            }).join("") +
            "<a style='display:block;padding:14px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;text-align:center;'>" + (brief.contactButton || "Send it over") + "</a>" +
          "</div>" +
        "</div></section>";
      }
    })(),

    landing: (function() {
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
      var close = brief.closingCta    || brief.tagline  || "Ready to get started?";
      var closeBody = brief.closingBody || "Reach out today and we'll get back to you within one business day.";
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
            return [f.heading || "", f.body || "", makeSvgPh(800, 600, industryMeta.label, f.heading || "Feature image", phBg)];
          })
        : [[f1h, f1b, img1], [f2h, f2b, img2], [f3h, f3b, img3]];
      var featureRowsDataB = (Array.isArray(brief.features) && brief.features.length > 0)
        ? brief.features.map(function (f, i) {
            return [f.heading || "", f.body || "", makeSvgPh(800, 600, industryMeta.label, f.heading || "Feature image", phBg), i % 2 === 1];
          })
        : [[f1h, f1b, img1, false], [f2h, f2b, img2, true], [f3h, f3b, img3, false]];
      var featureRowStyle = selectFeatureRowStyle(inspoContext, featureRowsData.length);

      // Mirrors landing.js's renderFeatureLayout() — same per-section
      // override mechanism, rendered as HTML strings instead of Elementor
      // JSON. When brief.featureLayout is set, this takes over entirely
      // for the feature-row area; the uniform style above is unused.
      function renderCuratedFeatureLayoutHTML() {
        var rawFeatures = Array.isArray(brief.features) ? brief.features : [];
        var htmlParts = [];
        brief.featureLayout.forEach(function (entry, rowIdx) {
          var items = (entry.indices || []).map(function (i) { return rawFeatures[i]; }).filter(Boolean);
          if (!items.length) return;
          var bg = rowIdx % 2 === 0 ? "#ffffff" : bone;
          var f = items[0];

          if (entry.style === "grouped-header") {
            var colWidth = Math.floor(100 / items.length);
            htmlParts.push(
              "<section style='background:#ffffff;padding:56px clamp(24px,6vw,64px);'>" +
                "<div style='font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + (entry.header || "") + "</div>" +
                "<div style='display:grid;grid-template-columns:repeat(" + items.length + ",1fr);gap:32px;'>" +
                  items.map(function (it) {
                    return "<div><h4 style='font-size:16px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + (it.heading || "") + "</h4><p style='font-size:14px;color:" + text + ";line-height:1.6;margin:0;'>" + (it.body || "") + "</p></div>";
                  }).join("") +
                "</div>" +
              "</section>"
            );
            return;
          }

          if (entry.style === "centered-cta") {
            htmlParts.push(
              "<section style='background:" + bg + ";padding:56px clamp(24px,6vw,64px);text-align:center;'>" +
                "<h3 style='font-size:clamp(18px,2.2vw,24px);font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + (f.heading || "") + "</h3>" +
                "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0 auto 20px;max-width:640px;'>" + (f.body || "") + "</p>" +
                "<a class='row-btn' style='" + btnDark + "display:inline-block;'>" + cta2 + "</a>" +
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
                "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + ffHeading + "</h3>" +
                (ffSubhead ? "<p style='font-size:14px;color:" + stone + ";margin:0 0 20px;'>" + ffSubhead + "</p>" : "") +
                ffFields.map(function (lbl) {
                  return "<div style='margin-bottom:12px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + lbl + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#ffffff;font-size:14px;color:#bbb;box-sizing:border-box;'>" + lbl + "...</div></div>";
                }).join("") +
                "<button style='padding:12px 28px;background:" + brass + ";color:#fff;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:6px;'>" + ffCta + "</button>" +
                "</div>" +
              "</section>"
            );
            return;
          }

          if (entry.style === "map-beside") {
            htmlParts.push(
              "<section style='background:" + bg + ";display:grid;grid-template-columns:1fr 1fr;'>" +
                "<div style='padding:56px 48px;display:flex;flex-direction:column;justify-content:center;'>" +
                  "<h2 style='font-size:clamp(20px,2.5vw,28px);font-weight:700;color:" + brass + ";margin:0 0 14px;'>" + (f.heading || "") + "</h2>" +
                  "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0;'>" + (f.body || "") + "</p>" +
                "</div>" +
                "<div class='landing-img' style='min-height:320px;height:100%;overflow:hidden;background:" + bone + ";display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:12px;'>Map placeholder</div>" +
              "</section>"
            );
            return;
          }

          if (entry.style === "split-right" || entry.style === "split-left" || entry.style === "split-cta-right" || entry.style === "split-cta-left") {
            var imgLeft = entry.style === "split-left" || entry.style === "split-cta-left";
            var withBtn = entry.style === "split-cta-right" || entry.style === "split-cta-left";
            var img = makeSvgPh(800, 600, industryMeta.label, f.heading || "Feature image", phBg);
            var textBlock = "<div style='padding:56px 48px;display:flex;flex-direction:column;justify-content:center;'>" +
              "<h2 style='font-size:clamp(20px,2.5vw,28px);font-weight:700;color:" + brass + ";margin:0 0 14px;'>" + (f.heading || "") + "</h2>" +
              "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0" + (withBtn ? " 0 20px" : "") + ";'>" + (f.body || "") + "</p>" +
              (withBtn ? "<a class='row-btn' style='" + btnDark + "'>" + cta2 + "</a>" : "") +
            "</div>";
            var imgBlock = "<div class='landing-img' style='min-height:320px;height:100%;overflow:hidden;'><img src=\"" + img + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:320px;'/></div>";
            htmlParts.push(
              "<section style='background:" + bg + ";display:grid;grid-template-columns:1fr 1fr;'>" +
                (imgLeft ? imgBlock + textBlock : textBlock + imgBlock) +
              "</section>"
            );
            return;
          }

          // "plain" fallback
          htmlParts.push(
            "<section style='background:" + bg + ";padding:44px clamp(24px,6vw,64px);'>" +
              "<div style='width:28px;height:2px;background:" + brass + ";margin-bottom:14px;'></div>" +
              "<h3 style='font-size:clamp(17px,2vw,22px);font-weight:700;color:" + ink + ";margin:0 0 10px;'>" + (f.heading || "") + "</h3>" +
              "<p style='font-size:14px;color:" + text + ";line-height:1.7;margin:0;'>" + (f.body || "") + "</p>" +
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
      var faqItemsList = Array.isArray(brief.faqItems) && brief.faqItems.length ? brief.faqItems : [
        { question: "FAQ question one",   answer: "Answer, in brand voice." },
        { question: "FAQ question two",   answer: "Answer, in brand voice." },
        { question: "FAQ question three", answer: "Answer, in brand voice." },
        { question: "FAQ question four",  answer: "Answer, in brand voice." },
        { question: "FAQ question five",  answer: "Answer, in brand voice." },
      ];
      // Plain, dependency-free open/close: a checkbox-driven CSS accordion
      // (no JS needed for the preview) so the interaction is visible without
      // wiring up click handlers just for this static HTML preview.
      var faqHTML = "<section style='background:#ffffff;padding:80px clamp(24px,6vw,80px);'>" +
          "<div style='max-width:1140px;margin:0 auto;'>" +
            "<h2 style='font-size:clamp(24px,3vw,32px);font-weight:800;color:" + brass + ";margin:0 0 28px;'>" + (brief.faqHeading || "Frequently Asked Questions") + "</h2>" +
            faqItemsList.map(function(f, i) {
              var cbId = "faq-cb-" + i;
              return "<div class='faq-item' style='border:1px solid #dde0e6;border-top:none;'>" +
                "<input type='checkbox' id='" + cbId + "' class='faq-toggle' style='display:none;'" + (i === 0 ? " checked" : "") + "/>" +
                "<label for='" + cbId + "' style='display:flex;align-items:center;gap:10px;padding:18px 20px;cursor:pointer;font-weight:700;font-size:15px;color:#1a1a1a;'>" +
                  "<span class='faq-icon' style='font-size:16px;color:" + brass + ";width:14px;'></span>" + f.question +
                "</label>" +
                "<div class='faq-answer' style='display:none;padding:0 20px 20px 44px;font-size:14px;color:" + stone + ";line-height:1.6;'>" + f.answer + "</div>" +
              "</div>";
            }).join("") +
            "<style>.faq-icon::before{content:'+';}.faq-toggle:checked ~ label .faq-icon::before{content:'\u2212';}.faq-toggle:checked ~ label{color:" + brass + " !important;}.faq-toggle:checked + label + .faq-answer{display:block !important;}.faq-item:first-child{border-top:1px solid #dde0e6;}</style>" +
          "</div>" +
        "</section>";
      var svcs  = Array.isArray(brief.servicesList) ? brief.servicesList : ["Service one","Service two","Service three","Service four","Service five","Service six"];
      var b1    = brief.benefit1 || "Faster results with less hassle";
      var b2    = brief.benefit2 || "One team handles everything end to end";
      var b3    = brief.benefit3 || "Decades of proven experience";
      var tq1   = brief.testimonial1Quote || "Working with this team was a game changer for our operation. The quality and speed exceeded every expectation.";
      var tn1   = brief.testimonial1Name  || "Client Name";
      var tt1   = brief.testimonial1Title || "Operations Manager";
      var tq2   = brief.testimonial2Quote || "We've tried other vendors. Nobody comes close on turnaround time and quality of work.";
      var tn2   = brief.testimonial2Name  || "Client Name";
      var tt2   = brief.testimonial2Title || "Fleet Director";
      var tq3   = brief.testimonial3Quote || "Straightforward pricing, no surprises, and they always deliver on time.";
      var tn3   = brief.testimonial3Name  || "Client Name";
      var tt3   = brief.testimonial3Title || "Business Owner";
      var formH = brief.formHeading    || "Request a Quote";
      var formS = brief.formSubhead    || "We'll get back to you within one business day.";
      var formC = brief.formCta        || "Send It Over";
      var formR = brief.formReassurance|| "No sales team. A real reply.";

      var btnStyle = "display:inline-block;padding:14px 32px;background:" + brass + ";color:#ffffff;font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:3px;";
      var btnOutline = "display:inline-block;padding:13px 28px;background:transparent;color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border:2px solid rgba(255,255,255,0.6);border-radius:3px;";
      var btnDark = "display:inline-block;padding:10px 24px;background:transparent;color:" + ink + ";font-weight:600;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border:2px solid " + brass + ";border-radius:3px;align-self:flex-start;width:fit-content;";

      // ── VARIANT B — Lead Form ──────────────────────────────────────────────
      if (variant === "B") {
        var formFieldsB = Array.isArray(brief.formFields) ? brief.formFields : ["Name", "Company", "Phone", "What do you need?", "Message"];
        return "<section style='background:" + dark + ";padding:clamp(48px,8vh,80px) clamp(24px,6vw,80px);position:relative;'>" +
            "<div class='var-b-hero' style='max-width:1100px;margin:0 auto;text-align:center;'>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.7);margin-bottom:16px;'>" + (brief.heroEyebrow != null ? brief.heroEyebrow : (brief.brandName||"Brand")) + "</div>" +
              "<h1 style='font-weight:800;font-size:clamp(32px,5vw,56px);color:#ffffff;margin:0 0 18px;line-height:1.08;'>" + h1 + "</h1>" +
              (hook ? "<p style='font-size:18px;color:rgba(255,255,255,0.85);margin:0 0 12px;line-height:1.6;font-style:italic;'>" + hook + "</p>" : "") +
              "<p style='font-size:clamp(14px,3.5vw,16px);color:rgba(255,255,255,0.8);margin:0 0 24px;line-height:1.55;max-width:580px;margin-left:auto;margin-right:auto;'>" + sub + "</p>" +
              "<a style='" + btnStyle.replace("background:"+brass, "background:#ffffff").replace("color:#ffffff", "color:"+dark) + "'>" + cta1 + "</a>" +
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
                "<div style='display:flex;flex-direction:row;gap:24px;'>" +
                  [{ s: s1, l: l1 }, { s: s2, l: l2 }, { s: s3, l: l3 }].map(function(t) {
                    return "<div><div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;margin-bottom:4px;'>" + t.s + "</div><div style='font-size:13px;color:" + stone + ";font-weight:500;'>" + t.l + "</div></div>";
                  }).join("") +
                "</div>" +
              "</div>" +
              "<div style='background:#ffffff;border:1px solid #dde0e6;border-radius:8px;padding:40px;'>" +
                "<h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + formH + "</h3>" +
                "<p style='font-size:14px;color:" + stone + ";margin:0 0 24px;'>" + formS + "</p>" +
                formFieldsB.map(function(f) {
                  return "<div style='margin-bottom:14px;'><label style='display:block;font-size:12px;font-weight:600;color:" + stone + ";text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;'>" + f + "</label><div style='width:100%;padding:10px 14px;border:1px solid #dde0e6;border-radius:4px;background:#f9f9f9;font-size:14px;color:#bbb;box-sizing:border-box;'>" + f + "...</div></div>";
                }).join("") +
                "<button style='width:100%;padding:14px;background:" + brass + ";color:#fff;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;border:none;border-radius:4px;cursor:pointer;margin-top:8px;'>" + formC + "</button>" +
                "<p style='font-size:12px;color:" + stone + ";text-align:center;margin:10px 0 0;'>" + formR + "</p>" +
              "</div>" +
            "</div>" +
          "</section>" +
          "<section style='background:" + dark + ";padding:70px clamp(24px,6vw,80px);text-align:center;'>" +
            "<div style='max-width:640px;margin:0 auto;'>" +
              "<p style='font-size:21px;font-style:italic;color:#ffffff;line-height:1.5;margin:0 0 18px;'>&#8220;" + tq1 + "&#8221;</p>" +
              "<div style='width:28px;height:2px;background:" + brass + ";margin:0 auto 14px;'></div>" +
              "<p style='font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 22px;'>" + tn1 + " &middot; " + tt1 + "</p>" +
              "<div style='display:flex;justify-content:center;gap:6px;'>" +
                "<div style='width:6px;height:6px;border-radius:50%;background:" + brass + ";'></div>" +
                "<div style='width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);'></div>" +
                "<div style='width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.25);'></div>" +
              "</div>" +
            "</div>" +
          "</section>" +
          (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0 ? renderCuratedFeatureLayoutHTML() :
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
            var textContent = "<h2 style='font-size:clamp(22px,3vw,34px);font-weight:700;color:" + brass + ";margin:0 0 16px;'>" + f[0] + "</h2><p style='font-size:16px;color:" + text + ";line-height:1.75;margin:0 0 28px;'>" + f[1] + "</p><a class='row-btn' style='" + btnDark + "'>" + cta2 + "</a></div>";
            var imgRight = !imgLeft ? "<div class='landing-img' style='min-height:400px;height:100%;overflow:hidden;'><img src=\"" + f[2] + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:400px;'/></div>" : "";
            return "<section style='display:grid;grid-template-columns:1fr 1fr;background:" + (i%2===0?"#ffffff":bone) + ";'>" + cols + textContent + imgRight + "</section>";
          }).join("")) +
          "<section style='background:" + dark + ";padding:80px 40px;text-align:center;'>" +
            "<h2 style='font-size:clamp(26px,4vw,40px);font-weight:700;color:#ffffff;margin:0 0 12px;'>" + close + "</h2>" +
            "<p style='font-size:16px;color:rgba(255,255,255,0.8);margin:0 0 32px;max-width:560px;margin-left:auto;margin-right:auto;'>" + closeBody + "</p>" +
            "<div style='display:flex;gap:16px;justify-content:center;flex-wrap:wrap;'>" +
              "<a class='cta-btn' style='" + btnStyle.replace("background:"+brass,"background:#ffffff").replace("color:#ffffff","color:"+dark) + "'>" + cta1 + "</a>" +
              "<a class='cta-btn' style='" + btnOutline + "'>" + cta2 + "</a>" +
            "</div>" +
          "</section>" +
          faqHTML;
      }

      // ── VARIANT C — Minimal Retargeting ────────────────────────────────────
      if (variant === "C") {
        return "<section style='background:" + brass + ";padding:clamp(80px,12vh,140px) clamp(24px,6vw,80px);text-align:center;min-height:50vh;display:flex;align-items:center;'>" +
            "<div style='max-width:760px;margin:0 auto;width:100%;'>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:20px;'>" + (brief.heroEyebrow != null ? brief.heroEyebrow : (brief.brandName||"Brand")) + "</div>" +
              "<h1 style='font-weight:800;font-size:clamp(36px,6vw,72px);color:#ffffff;margin:0 0 20px;line-height:1.05;'>" + h1 + "</h1>" +
              "<p style='font-size:clamp(14px,1.5vw,18px);color:rgba(255,255,255,0.85);margin:0 0 32px;line-height:1.55;max-width:520px;margin-left:auto;margin-right:auto;'>" + sub + "</p>" +
              "<div style='display:flex;gap:16px;justify-content:center;flex-wrap:wrap;'>" +
                "<a class='cta-btn' style='" + btnStyle.replace("background:"+brass,"background:#ffffff").replace("color:#ffffff","color:"+brass) + "'>" + cta1 + "</a>" +
                "<a class='cta-btn' style='" + btnOutline + "'>" + cta2 + "</a>" +
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
          "<section style='background:" + bone + ";padding:0;display:grid;grid-template-columns:1fr 1fr;'>" +
            "<div class='landing-img' style='min-height:420px;height:100%;overflow:hidden;'><img src=\"" + img1 + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:420px;'/></div>" +
            "<div style='padding:64px 56px;display:flex;flex-direction:column;justify-content:center;'>" +
              "<p style='font-size:20px;font-style:italic;color:" + ink + ";line-height:1.65;margin:0 0 24px;'>&#8220;" + tq1 + "&#8221;</p>" +
              "<div style='width:36px;height:2px;background:" + brass + ";margin-bottom:14px;'></div>" +
              "<div style='font-size:15px;font-weight:600;color:" + ink + ";'>" + tn1 + "</div>" +
              "<div style='font-size:13px;color:" + stone + ";'>" + tt1 + "</div>" +
            "</div>" +
          "</section>" +
          "<section style='background:" + brass + ";padding:100px 40px;text-align:center;'>" +
            "<h2 style='font-size:clamp(26px,4vw,44px);font-weight:800;color:#ffffff;margin:0 0 12px;'>" + close + "</h2>" +
            "<p style='font-size:16px;color:rgba(255,255,255,0.8);margin:0 0 36px;max-width:480px;margin-left:auto;margin-right:auto;'>" + closeBody + "</p>" +
            "<a class='cta-btn' style='" + btnStyle.replace("background:"+brass,"background:#ffffff").replace("color:#ffffff","color:"+brass) + "display:block;max-width:280px;margin:0 auto;text-align:center;'>" + cta1 + "</a>" +
            "<p style='font-size:13px;color:rgba(255,255,255,0.6);margin:16px 0 0;'>" + formR + "</p>" +
          "</section>";
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
              "<a class='cta-btn' style='" + btnStyle.replace("background:"+brass,"background:#ffffff").replace("color:#ffffff","color:"+brass) + "display:inline-block;'>" + cta1 + "</a>" +
              "<a class='cta-btn' style='" + btnOutline + "display:inline-block;'>" + cta2 + "</a>" +
            "</div>" +
          "</div></div>" +
        "</section>" +
        "<section class='va-trust' style='background:#ffffff;padding:0;border-bottom:1px solid #f0f0f0;'>" +
          "<div style='display:grid;grid-template-columns:repeat(3,1fr);'>" +
            [{ s:s1,l:l1 },{ s:s2,l:l2 },{ s:s3,l:l3 }].map(function(t,i) {
              return "<div class='grid-cell' style='padding:40px 32px;text-align:center;" + (i<2?"border-right:1px solid #f0f0f0;":"") + "'><div style='font-size:42px;font-weight:800;color:" + brass + ";line-height:1;margin-bottom:6px;'>" + t.s + "</div><div style='font-size:14px;color:" + stone + ";font-weight:500;letter-spacing:0.02em;'>" + t.l + "</div></div>";
            }).join("") +
          "</div>" +
        "</section>" +
        (Array.isArray(brief.featureLayout) && brief.featureLayout.length > 0 ? renderCuratedFeatureLayoutHTML() :
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
          var textDiv = "<div class='feature-text' style='padding:72px 64px;display:flex;flex-direction:column;justify-content:center;'><h2 style='font-size:clamp(20px,2.5vw,32px);font-weight:700;color:" + brass + ";margin:0 0 14px;'>" + f[0] + "</h2><p style='font-size:16px;color:" + text + ";line-height:1.75;margin:0 0 28px;'>" + f[1] + "</p><a class='row-btn' style='" + btnDark + "'>" + cta2 + "</a></div>";
          var imgDiv  = "<div class='landing-img' style='min-height:400px;height:100%;overflow:hidden;'><img src=\"" + f[2] + "\" alt='feature' style='width:100%;height:100%;object-fit:cover;display:block;min-height:400px;'/></div>";
          return "<section style='display:grid;grid-template-columns:1fr 1fr;background:" + (i%2===0?"#ffffff":bone) + ";'>" + (f[3] ? imgDiv+textDiv : textDiv+imgDiv) + "</section>";
        }).join("")) +
        (brief.skipServicesChecklist ? "" :
        "<section style='background:" + bone + ";padding:80px clamp(24px,6vw,80px);border-top:1px solid rgba(0,0,0,0.08);'>" +
          "<h2 style='font-size:clamp(22px,3vw,32px);font-weight:700;color:" + ink + ";margin:0 0 32px;'>" + (brief.servicesHeading||"What We Do") + "</h2>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;max-width:900px;'>" +
            svcs.map(function(s) {
              return "<div style='padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:15px;color:" + text + ";display:flex;align-items:center;gap:10px;'><span style='color:" + brass + ";font-weight:700;'>✓</span>" + s + "</div>";
            }).join("") +
          "</div>" +
        "</section>") +
        "<section class='va-cta' style='background:" + brass + ";padding:80px 40px;text-align:center;'>" +
          "<h2 style='font-size:clamp(26px,4vw,42px);font-weight:700;color:#ffffff;margin:0 0 12px;'>" + close + "</h2>" +
          "<p style='font-size:16px;color:rgba(255,255,255,0.8);margin:0 0 32px;max-width:540px;margin-left:auto;margin-right:auto;'>" + closeBody + "</p>" +
          "<div style='display:flex;gap:16px;justify-content:center;flex-wrap:wrap;'>" +
            "<a class='cta-btn' style='" + btnStyle.replace("background:"+brass,"background:#ffffff").replace("color:#ffffff","color:"+brass) + "'>" + cta1 + "</a>" +
            "<a class='cta-btn' style='" + btnOutline + "'>" + cta2 + "</a>" +
          "</div>" +
        "</section>" +
        faqHTML;
    })(),

    // ── TEAM ──
    team: (function() {
      var tp = patterns.team || "photo-grid";
      var members = [
        { role: "Founder & CEO", name: "[Name]" },
        { role: "Lead Designer", name: "[Name]" },
        { role: "Strategist", name: "[Name]" },
        { role: "Developer", name: "[Name]" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>The Team</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>The people behind the work.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>Every person here chose to be here.</p>" +
      "</section>";
      if (tp === "featured-founder") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
            "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:56px;padding-bottom:56px;border-bottom:1px solid #E2DBCC;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:3/4;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Founder photo</div>" +
              "<div>" +
                "<div style='font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brass + ";margin-bottom:12px;'>Founder</div>" +
                "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:800;color:" + ink + ";margin:0 0 8px;'>[Founder Name]</h2>" +
                "<p style='font-size:15px;color:" + stone + ";margin-bottom:20px;'>Founder & CEO</p>" +
                "<p style='font-size:16px;color:" + text + ";line-height:1.7;'>A short founder bio that establishes credibility and voice. Who they are, where they came from, and why they started this.</p>" +
              "</div>" +
            "</div>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;'>" +
              members.slice(1).map(function(m) {
                return "<div style='text-align:center;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:14px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div>" +
                  "<div style='font-size:15px;font-weight:700;color:" + ink + ";'>" + m.name + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + m.role + "</div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</div></section>";
      } else if (tp === "horizontal-list") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            members.map(function(m) {
              return "<div style='display:grid;grid-template-columns:100px 1fr;gap:28px;padding:32px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div style='background:#e0ddd7;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Photo</div>" +
                "<div>" +
                  "<div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + m.name + "</div>" +
                  "<div style='font-size:13px;color:" + brass + ";font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;'>" + m.role + "</div>" +
                  "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Short bio for this team member — background, focus, and what they bring.</p>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // photo-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            members.map(function(m) {
              return "<div style='text-align:center;'><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div><div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + m.name + "</div><div style='font-size:14px;color:" + stone + ";margin-top:4px;'>" + m.role + "</div></div>";
            }).join("") +
          "</div></section>";
      }
    })(),

    // ── BLOG ──
    blog: (function() {
      var bp = patterns.blog || "grid-3col";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Journal</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 48px;line-height:1.1;'>Latest thoughts</h1>" +
      "</div></section>";
      var articles = ["Strategy & Growth", "Behind the Scenes", "Industry Insights", "Case Study", "Tips & Guides", "News"];
      if (bp === "featured-plus-grid") {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:16/10;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Featured image</div>" +
            "<div style='display:flex;flex-direction:column;justify-content:center;'><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;'>Featured</div>" +
            "<h2 style='font-size:28px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>Featured Article Title</h2>" +
            "<p style='font-size:16px;color:" + stone + ";line-height:1.6;margin:0;'>A longer excerpt that gives readers a reason to dive into this featured piece.</p></div>" +
          "</div>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            articles.slice(0,3).map(function(cat) {
              return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;margin-bottom:12px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" +
                "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>" + cat + "</div>" +
                "<h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>Article Title</h3>" +
                "<p style='font-size:14px;color:" + stone + ";line-height:1.5;margin:0;'>Short excerpt text.</p></div>";
            }).join("") +
          "</div></div></section>";
      } else if (bp === "list-view") {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          articles.slice(0,5).map(function(cat) {
            return "<div style='display:grid;grid-template-columns:120px 1fr;gap:20px;padding:24px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='background:#e0ddd7;aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Thumb</div>" +
              "<div><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>" + cat + "</div>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 4px;'>Article Title Goes Here</h3>" +
              "<p style='font-size:13px;color:" + stone + ";margin:0;'>5 min read</p></div></div>";
          }).join("") +
        "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
          articles.slice(0,3).map(function(cat) {
            return "<div><div style='background:#e0ddd7;aspect-ratio:16/10;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Image</div>" +
              "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;'>" + cat + "</div>" +
              "<h3 style='font-size:20px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>Article Title Goes Here</h3>" +
              "<p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>Short excerpt giving readers a reason to click through.</p>" +
              "<div style='font-size:13px;color:" + stone + ";margin-top:12px;'>5 min read</div></div>";
          }).join("") +
        "</div></section>";
      }
    })(),

    "blog-post": (function() {
      if (variant === "B") {
        // Wide editorial — no sidebar column, wider content, pull quote prominent
        return "<section style='background:" + bone + ";padding:80px 40px 40px;max-width:880px;margin:0 auto;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;font-weight:600;'>Category</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Article Title Goes Here</h1>" +
          "<p style='font-size:15px;color:" + stone + ";margin-bottom:40px;'>Published on [Date] · 5 min read</p>" +
        "</section>" +
        "<section style='background:#e0ddd7;padding:0;'><div style='aspect-ratio:21/9;max-height:480px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Featured image — full width</div></section>" +
        "<section style='background:" + bone + ";padding:56px 40px 96px;'><div style='max-width:880px;margin:0 auto;'>" +
          "<blockquote style='border-left:4px solid " + brass + ";padding:20px 28px;margin:0 0 40px;font-size:22px;color:" + ink + ";font-style:italic;line-height:1.5;background:#fff;border-radius:0 4px 4px 0;'>A key pull quote that sets the tone for the piece and gives readers a reason to keep reading.</blockquote>" +
          "<div style='font-size:17px;color:" + text + ";line-height:1.85;'>" +
            "<p style='margin-bottom:24px;'>Opening paragraph of the article. This is where you hook the reader and set up the premise of what they will learn.</p>" +
            "<h2 style='font-size:26px;font-weight:700;color:" + ink + ";margin:48px 0 16px;'>Section heading</h2>" +
            "<p style='margin-bottom:24px;'>Body copy continues here with supporting details, examples, and insights that develop the main argument.</p>" +
            "<p>Concluding thoughts that tie everything together and lead naturally to a call to action.</p>" +
          "</div>" +
        "</div></section>";
      }
      // Variant A — narrow centered with featured image (current)
      return "<section style='background:" + bone + ";padding:80px 40px;max-width:760px;margin:0 auto;'>" +
        "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;'>Category</div>" +
        "<h1 style='font-size:clamp(32px,5vw,48px);font-weight:800;color:" + ink + ";margin:0 0 16px;line-height:1.15;'>Article Title Goes Here</h1>" +
        "<p style='font-size:15px;color:" + stone + ";margin-bottom:32px;'>Published on [Date] · 5 min read</p>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/9;margin-bottom:40px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Featured image</div>" +
        "<div style='font-size:17px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:24px;'>Opening paragraph of the article. This is where you hook the reader and set up the premise.</p><h2 style='font-size:24px;font-weight:700;color:" + ink + ";margin:40px 0 16px;'>Section heading</h2><p style='margin-bottom:24px;'>Body copy continues here with supporting details, examples, and insights.</p><blockquote style='border-left:3px solid " + brass + ";padding:16px 24px;margin:32px 0;color:" + ink + ";font-size:18px;'>A pull quote that highlights a key insight from the article.</blockquote><p>Concluding thoughts that tie everything together and lead to a call to action.</p></div>" +
      "</section>";
    })(),

    // ── FAQ ──
    faq: (function() {
      var fp = patterns.faq || "accordion";
      var questions = [["How does pricing work?","Every price is a starting point that scales with scope."],["What is the typical timeline?","Most projects wrap in 2-4 weeks depending on complexity."],["Do you offer revisions?","Yes, a set number of revision rounds agreed up front."],["What do I need to get started?","A brief conversation about your business and goals."],["Can I see examples?","Absolutely. Check our work page for recent projects."]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>FAQ</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Common questions</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;'>If you do not see your answer here, reach out directly.</p>" +
      "</div></section>";
      if (fp === "two-column") {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1160px;margin:0 auto;'>" +
          questions.map(function(q) {
            return "<div style='padding:24px 0;border-bottom:1px solid #E2DBCC;'><h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + q[0] + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + q[1] + "</p></div>";
          }).join("") +
        "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
          questions.map(function(q) {
            return "<div style='border-bottom:1px solid #E2DBCC;padding:24px 0;'><div style='display:flex;justify-content:space-between;align-items:center;'><h3 style='font-size:17px;font-weight:600;color:" + ink + ";margin:0;'>" + q[0] + "</h3><span style='font-size:20px;color:" + brass + ";'>+</span></div><p style='font-size:15px;color:" + stone + ";line-height:1.7;margin:12px 0 0;'>" + q[1] + "</p></div>";
          }).join("") +
        "</div></section>";
      }
    })(),

    pricing: (function() {
      var pp2 = patterns.pricing || "three-tier";
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;text-align:center;'><div style='max-width:800px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Pricing</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Simple, transparent pricing</h1>" +
        "<p style='font-size:17px;color:" + text + ";margin:0;'>No hidden fees. Pick what works.</p>" +
      "</div></section>";
      var tiers = [["Starter","$500","For small projects"],["Professional","$1,500","For growing businesses"],["Enterprise","Custom","For large-scale needs"]];
      if (pp2 === "two-tier") {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto;'>" +
          tiers.slice(0,2).map(function(t, i) {
            var featured = i === 1;
            return "<div style='background:" + (featured ? asphalt : "#fff") + ";border:1px solid #E2DBCC;padding:48px 32px;text-align:center;border-radius:4px;'>" +
              "<div style='font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + (featured ? brass : brassDp) + ";margin-bottom:16px;'>" + t[0] + "</div>" +
              "<div style='font-size:clamp(36px,5vw,52px);font-weight:800;color:" + (featured ? warmWhite : ink) + ";margin-bottom:8px;'>" + t[1] + "</div>" +
              "<p style='font-size:15px;color:" + stone + ";margin-bottom:32px;'>" + t[2] + "</p>" +
              "<a style='display:inline-block;padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Get started</a></div>";
          }).join("") + "</div></section>";
      } else {
        return header + "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1000px;margin:0 auto;'>" +
          tiers.map(function(t, i) {
            var featured = i === 1;
            return "<div style='background:" + (featured ? asphalt : "#fff") + ";border:1px solid #E2DBCC;padding:40px 32px;text-align:center;border-radius:4px;'>" +
              "<div style='font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + (featured ? brass : brassDp) + ";margin-bottom:16px;'>" + t[0] + "</div>" +
              "<div style='font-size:clamp(32px,4vw,48px);font-weight:800;color:" + (featured ? warmWhite : ink) + ";margin-bottom:8px;'>" + t[1] + "</div>" +
              "<p style='font-size:14px;color:" + stone + ";margin-bottom:32px;'>" + t[2] + "</p>" +
              "<a style='display:inline-block;padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Get started</a></div>";
          }).join("") + "</div></section>";
      }
    })(),

    testimonials: (function() {
      var tp = patterns.testimonials || "card-grid";
      var quotes = [
        { q: "This changed everything for our business.", name: "Client Name", role: "Role, Company" },
        { q: "Professional, efficient, and genuinely cared about the outcome.", name: "Client Name", role: "Role, Company" },
        { q: "We saw results within the first month.", name: "Client Name", role: "Role, Company" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 48px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Testimonials</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>What our clients say.</h1>" +
      "</section>";
      if (tp === "single-feature") {
        return "<section style='background:" + ink + ";padding:120px 40px;text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:60px;color:" + brass + ";line-height:1;margin-bottom:24px;'>\u201c</div>" +
            "<p style='font-size:clamp(22px,3vw,32px);color:" + warmWhite + ";line-height:1.5;font-weight:300;margin:0 0 40px;'>" + quotes[0].q + "</p>" +
            "<div style='width:40px;height:2px;background:" + brass + ";margin:0 auto 24px;'></div>" +
            "<div style='font-size:15px;font-weight:700;color:" + warmWhite + ";'>" + quotes[0].name + "</div>" +
            "<div style='font-size:13px;color:" + stone + ";margin-top:6px;'>" + quotes[0].role + "</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px 96px;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:900px;margin:0 auto;'>" +
            quotes.slice(1).map(function(qt) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'>" +
                "<p style='font-size:16px;color:" + ink + ";line-height:1.6;margin:0 0 20px;'>" + qt.q + "</p>" +
                "<div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + qt.name + "</div>" +
                "<div style='font-size:13px;color:" + stone + ";'>" + qt.role + "</div>" +
              "</div>";
            }).join("") +
          "</div>" +
        "</section>";
      } else if (tp === "alternating-quotes") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:960px;margin:0 auto;'>" +
            quotes.map(function(qt, i) {
              var isRight = i % 2 === 1;
              return "<div style='display:grid;grid-template-columns:72px 1fr;gap:24px;padding:40px 0;border-bottom:1px solid #E2DBCC;align-items:start;" + (isRight ? "direction:rtl;" : "") + "'>" +
                "<div style='background:#e0ddd7;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;" + (isRight ? "direction:ltr;" : "") + "'>Photo</div>" +
                "<div style='" + (isRight ? "direction:ltr;text-align:right;" : "") + "'>" +
                  "<p style='font-size:18px;color:" + ink + ";line-height:1.6;margin:0 0 16px;font-style:italic;'>\u201c" + qt.q + "\u201d</p>" +
                  "<div style='font-size:14px;font-weight:700;color:" + ink + ";'>" + qt.name + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";'>" + qt.role + "</div>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // card-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            quotes.map(function(qt) {
              return "<div style='background:#fff;border-left:3px solid " + brass + ";padding:32px;'><p style='font-family:Inter,sans-serif;font-size:18px;color:" + ink + ";line-height:1.5;margin:0 0 20px;'>" + qt.q + "</p><div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + qt.name + "</div><div style='font-size:13px;color:" + stone + ";'>" + qt.role + "</div></div>";
            }).join("") +
          "</div></section>";
      }
    })(),

    // ── EVENTS ──
    events: (function() {
      var ep = patterns.events || "date-list";
      var evts = [
        { date: "JAN 15", title: "Workshop: Brand Strategy Fundamentals", meta: "10:00 AM — 2:00 PM · Virtual" },
        { date: "FEB 22", title: "Networking Mixer", meta: "6:00 PM — 9:00 PM · Downtown Studio" },
        { date: "MAR 10", title: "Annual Conference", meta: "All Day · Convention Center" },
      ];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Events</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>Upcoming events.</h1>" +
      "</section>";
      if (ep === "event-cards") {
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'>" +
            "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:28px;max-width:1160px;margin:0 auto;'>" +
              evts.map(function(e) {
                return "<div style='background:#ffffff;border:1px solid #E2DBCC;border-radius:6px;overflow:hidden;'>" +
                  "<div style='background:#e0ddd7;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
                  "<div style='padding:24px;'>" +
                    "<div style='font-size:12px;font-weight:800;color:" + brass + ";letter-spacing:1px;margin-bottom:10px;'>" + e.date + "</div>" +
                    "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;line-height:1.3;'>" + e.title + "</h3>" +
                    "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;'>" + e.meta + "</p>" +
                    "<a style='display:inline-block;padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register</a>" +
                  "</div>" +
                "</div>";
              }).join("") +
            "</div>" +
          "</section>";
      } else if (ep === "featured-next") {
        var next = evts[0];
        return "<section style='background:" + ink + ";padding:96px 40px;'>" +
          "<div style='max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Next Event</div>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:2px;margin-bottom:16px;'>" + next.date + "</div>" +
              "<h2 style='font-size:clamp(28px,4vw,44px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.15;'>" + next.title + "</h2>" +
              "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;margin:0 0 32px;'>" + next.meta + "</p>" +
              "<a style='display:inline-block;padding:14px 36px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register now</a>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          evts.slice(1).map(function(e) {
            return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + e.date + "</div>" +
              "<div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + e.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + e.meta + "</div></div>" +
              "<a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else {
        // date-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            evts.map(function(e) {
              return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'><div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + e.date + "</div><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + e.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + e.meta + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a></div>";
            }).join("") +
          "</div></section>";
      }
    })(),

    // ── CAREERS ──
    careers: (function() {
      var cp = patterns.careers || "job-list";
      var jobs = [
        { title: "Senior Designer", meta: "Full-time · Remote" },
        { title: "Project Manager", meta: "Full-time · Hybrid" },
        { title: "Content Strategist", meta: "Contract · Remote" },
      ];
      var values = ["Ownership", "Craft", "Clarity", "Speed", "Honesty"];
      var header = "<section style='background:" + bone + ";padding:88px 40px 56px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Careers</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Work with us.</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0;line-height:1.65;'>We are always looking for talented people who care about the craft.</p>" +
      "</section>";
      var jobList = "<div style='max-width:800px;margin:0 auto;'>" +
        jobs.map(function(j) {
          return "<div style='display:flex;justify-content:space-between;align-items:center;padding:24px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + j.title + "</div><div style='font-size:14px;color:" + stone + ";'>" + j.meta + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Apply</a></div>";
        }).join("") +
      "</div>";
      if (cp === "values-first") {
        return "<section style='background:" + ink + ";padding:80px 40px;'>" +
          "<div style='max-width:1060px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>Our values</div>" +
            "<div style='display:flex;gap:24px;flex-wrap:wrap;'>" +
              values.map(function(v) {
                return "<div style='padding:14px 24px;border:1px solid rgba(255,255,255,.15);color:" + warmWhite + ";font-size:14px;font-weight:600;border-radius:4px;'>" + v + "</div>";
              }).join("") +
            "</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'>" + jobList + "</section>";
      } else if (cp === "split-layout") {
        return header +
          "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<h2 style='font-size:24px;font-weight:800;color:" + ink + ";margin:0 0 16px;'>Why join us</h2>" +
              "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin-bottom:28px;'>We move fast, care about craft, and give people room to own their work. No bureaucracy. No bottlenecks.</p>" +
              "<div style='display:flex;flex-direction:column;gap:12px;'>" +
                values.map(function(v) {
                  return "<div style='display:flex;align-items:center;gap:12px;'><div style='width:6px;height:6px;background:" + brass + ";border-radius:50%;flex-shrink:0;'></div><span style='font-size:15px;font-weight:600;color:" + ink + ";'>" + v + "</span></div>";
                }).join("") +
              "</div>" +
            "</div>" +
            "<div>" +
              "<h2 style='font-size:24px;font-weight:800;color:" + ink + ";margin:0 0 24px;'>Open roles</h2>" +
              jobs.map(function(j) {
                return "<div style='display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + j.title + "</div><div style='font-size:13px;color:" + stone + ";'>" + j.meta + "</div></div><a style='padding:8px 20px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Apply</a></div>";
              }).join("") +
            "</div>" +
          "</div></section>";
      } else {
        // job-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'>" + jobList + "</section>";
      }
    })(),

    // ── CASE STUDY ──
    "case-study": (function() {
      var csp = patterns["case-study"] || "dark-hero-metrics";
      var metrics = [
        { label: "Challenge", body: "What the client was facing" },
        { label: "Solution", body: "How we approached it" },
        { label: "Result", body: "The measurable outcome" },
      ];
      if (csp === "editorial-light") {
        return "<section style='background:" + bone + ";padding:100px 40px 60px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Case Study</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Client Name: Project Title</h1>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.7;margin:0;'>Brief overview of the challenge and what was delivered.</p>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:16/9;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:56px;'>Project hero image</div>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 56px;'><div style='max-width:800px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:32px;padding:40px 0;border-top:1px solid #E2DBCC;border-bottom:1px solid #E2DBCC;margin-bottom:48px;'>" +
            metrics.map(function(m) {
              return "<div><div style='font-size:11px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-weight:600;'>" + m.label + "</div><p style='font-size:15px;color:" + text + ";line-height:1.6;margin:0;'>" + m.body + "</p></div>";
            }).join("") +
          "</div>" +
          "<div style='font-size:17px;color:" + text + ";line-height:1.8;'>" +
            "<p style='margin-bottom:24px;'>The full editorial narrative goes here. Context, approach, execution, and results written for a reader who wants the story, not a slide deck.</p>" +
            "<blockquote style='border-left:3px solid " + brass + ";padding:16px 24px;margin:32px 0;font-size:20px;color:" + ink + ";font-style:italic;line-height:1.5;'>A pull quote that highlights a key moment or result from the project.</blockquote>" +
            "<p>Concluding section with results and what came next.</p>" +
          "</div>" +
        "</div></section>";
      } else if (csp === "numbers-first") {
        var stats = [["3x", "Revenue growth"], ["6mo", "Time to results"], ["98%", "Client retention"]];
        return "<section style='background:" + bone + ";padding:100px 40px 60px;'><div style='max-width:800px;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Case Study</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 20px;line-height:1.1;'>Client Name: Project Title</h1>" +
          "<p style='font-size:18px;color:" + text + ";line-height:1.7;margin:0;'>Brief overview of the challenge and the outcome.</p>" +
        "</div></section>" +
        "<section style='background:" + ink + ";padding:80px 40px;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;max-width:900px;margin:0 auto;text-align:center;'>" +
            stats.map(function(s) {
              return "<div><div style='font-size:clamp(48px,6vw,72px);font-weight:800;color:" + brass + ";line-height:1;margin-bottom:8px;'>" + s[0] + "</div><div style='font-size:14px;color:" + warmWhite + ";opacity:.7;text-transform:uppercase;letter-spacing:1px;'>" + s[1] + "</div></div>";
            }).join("") +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;max-width:900px;margin:0 auto;'>" +
          metrics.map(function(m) {
            return "<div><div style='font-size:13px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;'>" + m.label + "</div><p style='font-size:16px;color:" + text + ";line-height:1.6;'>" + m.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 80px;max-width:760px;margin:0 auto;'><div style='font-size:17px;color:" + text + ";line-height:1.8;'><p>The full narrative goes here — context, approach, execution, and the story behind the numbers.</p></div></section>";
      } else {
        // dark-hero-metrics (default)
        return "<section style='background:" + ink + ";padding:100px 40px;'>" +
          "<div style='max-width:800px;'>" +
            "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Case Study</div>" +
            "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + warmWhite + ";margin:0 0 24px;line-height:1.1;'>Client Name: Project Title</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;line-height:1.7;'>Brief overview of the challenge and the outcome.</p>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;max-width:900px;margin:0 auto 48px;text-align:center;'>" +
          metrics.map(function(m) {
            return "<div><div style='font-size:13px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;font-weight:600;'>" + m.label + "</div><p style='font-size:16px;color:" + text + ";line-height:1.6;'>" + m.body + "</p></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 80px;max-width:760px;margin:0 auto;'><div style='font-size:17px;color:" + text + ";line-height:1.8;'><p>The full case study narrative goes here — context, approach, execution, and results with real numbers.</p></div></section>";
      }
    })(),

    // ── THANK YOU ──
    "thank-you": "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-size:48px;margin-bottom:24px;'>✓</div>" +
      "<h1 style='font-size:clamp(32px,5vw,48px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Thank you.</h1>" +
      "<p style='font-size:18px;color:" + text + ";max-width:480px;margin:0 auto 32px;line-height:1.7;'>Your message has been received. We will get back to you within one business day.</p>" +
      "<a href='/' style='font-size:14px;color:" + brassDp + ";text-decoration:underline;'>← Back to homepage</a>" +
    "</section>",

    // ── PRIVACY / TERMS ──
    privacy: "<section style='background:" + bone + ";padding:80px 40px;'><div style='max-width:760px;margin:0 auto;'>" +
      "<h1 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 32px;'>Privacy Policy</h1>" +
      "<div style='font-size:16px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:20px;'>Last updated: [Date]</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Information We Collect</h2><p style='margin-bottom:20px;'>Placeholder for your privacy policy content.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>How We Use Your Information</h2><p style='margin-bottom:20px;'>Placeholder for usage details.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Contact</h2><p>For questions about this policy, contact us at [email].</p></div>" +
    "</div></section>",

    terms: "<section style='background:" + bone + ";padding:80px 40px;'><div style='max-width:760px;margin:0 auto;'>" +
      "<h1 style='font-size:clamp(28px,4vw,40px);font-weight:800;color:" + ink + ";margin:0 0 32px;'>Terms of Service</h1>" +
      "<div style='font-size:16px;color:" + text + ";line-height:1.8;'><p style='margin-bottom:20px;'>Last updated: [Date]</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Agreement to Terms</h2><p style='margin-bottom:20px;'>By accessing this website, you agree to these terms.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Services</h2><p style='margin-bottom:20px;'>Description of services provided.</p><h2 style='font-size:20px;font-weight:700;color:" + ink + ";margin:32px 0 12px;'>Limitation of Liability</h2><p>Standard limitation clause placeholder.</p></div>" +
    "</div></section>",

    // ── 404 ──
    "404": "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-family:Inter,sans-serif;font-size:clamp(80px,15vw,160px);font-weight:300;color:" + brass + ";line-height:1;margin-bottom:16px;'>404</div>" +
      "<h1 style='font-size:clamp(24px,4vw,36px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Page not found.</h1>" +
      "<p style='font-size:17px;color:" + text + ";max-width:400px;margin:0 auto 32px;'>The page you are looking for does not exist or has been moved.</p>" +
      "<a href='/' style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;display:inline-block;'>Back to homepage</a>" +
    "</section>",

    // ── PORTFOLIO SINGLE ──
    portfolio: (function() {
      if (variant === "B") {
        // Editorial: bone hero + single full-width image + case study narrative
        return "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:800px;'>" +
          "<div style='font-size:12px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;font-weight:600;'>Portfolio</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Project Title</h1>" +
          "<p style='font-size:17px;color:" + text + ";margin:0;line-height:1.7;'>Client Name · Category · Year</p>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:0 40px 40px;'><div style='background:#e0ddd7;aspect-ratio:16/7;max-width:1160px;margin:0 auto;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Project hero image</div></section>" +
        "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='display:grid;grid-template-columns:1fr 2fr;gap:64px;max-width:1160px;margin:0 auto;'>" +
          "<div>" +
            "<div style='margin-bottom:32px;'><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Client</div><p style='font-size:15px;color:" + text + ";'>Client Name</p></div>" +
            "<div style='margin-bottom:32px;'><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Category</div><p style='font-size:15px;color:" + text + ";'>Category</p></div>" +
            "<div><div style='font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:8px;'>Year</div><p style='font-size:15px;color:" + text + ";'>2026</p></div>" +
          "</div>" +
          "<div><p style='font-size:17px;color:" + text + ";line-height:1.8;'>Full project description, approach, and results go here. This editorial layout gives the narrative room to breathe alongside the images.</p></div>" +
        "</div></section>";
      }
      // Variant A — dark hero + image grid (current)
      return "<section style='background:" + ink + ";padding:100px 40px;'>" +
        "<div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;'>Portfolio</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.1;'>Project Title</h1>" +
        "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;'>Client Name · Category · Year</p>" +
      "</section>" +
      "<section style='background:" + bone + ";padding:64px 40px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:16px;max-width:1160px;margin:0 auto;'>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
        "<div style='background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Project image</div>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:48px 40px 96px;'><div style='max-width:760px;margin:0 auto;font-size:17px;color:" + text + ";line-height:1.8;'><p>Project description and details go here.</p></div></section>";
    })(),

    // ── LOCATION ──
    location: (function() {
      if (variant === "B") {
        // Centered — address first, map below
        return "<section style='background:" + bone + ";padding:88px 40px;text-align:center;'><div style='max-width:640px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Location</div>" +
          "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 24px;'>Visit us.</h1>" +
          "<p style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>123 Main Street, Suite 100</p>" +
          "<p style='font-size:16px;color:" + stone + ";margin:0 0 32px;'>City, State 00000</p>" +
          "<div style='display:flex;gap:32px;justify-content:center;flex-wrap:wrap;margin-bottom:48px;'>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Phone</div><div style='font-size:15px;color:" + text + ";'>(555) 000-0000</div></div>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Email</div><div style='font-size:15px;color:" + text + ";'>hello@brand.com</div></div>" +
            "<div><div style='font-size:12px;font-weight:600;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;'>Hours</div><div style='font-size:15px;color:" + text + ";'>Mon–Fri 9am–5pm</div></div>" +
          "</div>" +
        "</div></section>" +
        "<section style='background:#e0ddd7;padding:0;'><div style='aspect-ratio:21/9;max-height:360px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:14px;'>Map embed</div></section>";
      }
      // Variant A — map left, address right (current)
      return "<section style='background:" + bone + ";padding:88px 40px;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Location</div>" +
        "<h1 style='font-size:clamp(36px,5vw,56px);font-weight:800;color:" + ink + ";margin:0 0 48px;'>Visit us.</h1>" +
        "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;max-width:1000px;'>" +
          "<div><div style='background:#e0ddd7;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;margin-bottom:16px;'>Map embed</div></div>" +
          "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:16px;'>Address</h3><p style='font-size:16px;color:" + text + ";line-height:1.7;margin-bottom:24px;'>123 Main Street<br>Suite 100<br>City, State 00000</p><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin-bottom:16px;'>Hours</h3><p style='font-size:16px;color:" + text + ";line-height:1.7;'>Monday – Friday: 9am – 5pm<br>Saturday – Sunday: Closed</p></div>" +
        "</div>" +
      "</section>";
    })(),
    // ── EVENT SINGLE ──
    "event-single": (function() {
      if (variant === "B") {
        // Light centered layout
        return "<section style='background:" + bone + ";padding:88px 40px;text-align:center;'><div style='max-width:640px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Event</div>" +
          "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Event Title Goes Here</h1>" +
          "<div style='display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;'>" +
            "<span style='font-size:15px;color:" + stone + ";'>March 15, 2026</span>" +
            "<span style='font-size:15px;color:" + stone + ";'>6:00 PM — 9:00 PM</span>" +
            "<span style='font-size:15px;color:" + stone + ";'>Downtown Convention Center</span>" +
          "</div>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;margin-bottom:48px;'>Register Now</a>" +
        "</div></section>" +
        "<section style='background:#ffffff;padding:64px 40px;'><div style='max-width:720px;margin:0 auto;'>" +
          "<h2 style='font-weight:700;font-size:24px;color:" + ink + ";margin:0 0 16px;'>About This Event</h2>" +
          "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0 0 32px;'>Event description with details about what attendees can expect, who should attend, and what they will learn or experience.</p>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;'>" +
            "<div><h3 style='font-weight:700;font-size:15px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;'>Schedule</h3><p style='font-size:15px;color:" + stone + ";line-height:1.8;'>6:00 PM — Doors open<br>6:30 PM — Opening remarks<br>7:00 PM — Main session<br>8:30 PM — Networking</p></div>" +
            "<div><h3 style='font-weight:700;font-size:15px;color:" + brassDp + ";text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;'>Location</h3><div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Map embed</div></div>" +
          "</div>" +
        "</div></section>";
      }
      // Variant A — dark hero (current)
      return "<section style='background:" + ink + ";padding:88px 40px;'><div style='max-width:900px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:16px;'>Event</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + warmWhite + ";margin:0 0 16px;line-height:1.1;'>Event Title Goes Here</h1>" +
        "<div style='display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;'>" +
          "<span style='font-size:15px;color:" + stone + ";'>March 15, 2026</span>" +
          "<span style='font-size:15px;color:" + stone + ";'>6:00 PM — 9:00 PM</span>" +
          "<span style='font-size:15px;color:" + stone + ";'>Downtown Convention Center</span>" +
        "</div>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Register Now</a>" +
      "</div></section>" +
      "<section style='background:" + bone + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;max-width:900px;margin:0 auto;'>" +
        "<div><div style='background:#e0ddd7;aspect-ratio:16/10;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";'>Event image</div></div>" +
        "<div><h2 style='font-weight:700;font-size:24px;color:" + ink + ";margin:0 0 16px;'>About This Event</h2><p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0 0 24px;'>Event description with details about what attendees can expect.</p><h3 style='font-weight:700;font-size:16px;color:" + ink + ";margin:0 0 12px;'>Schedule</h3><p style='font-size:15px;color:" + stone + ";line-height:1.8;margin:0;'>6:00 PM — Doors open<br>6:30 PM — Opening remarks<br>7:00 PM — Main session<br>9:00 PM — Close</p></div>" +
      "</div></section>";
    })(),

    // ── PRESS / MEDIA ──
    press: (function() {
      var articles = [["How This Startup is Changing the Game","Forbes · January 2026"],["10 Companies to Watch in 2026","Inc. · March 2026"],["The Future of Digital Services","TechCrunch · May 2026"]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Press</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>In the media</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Coverage, features, and media mentions.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Featured hero article + grid
        return "<section style='background:" + ink + ";padding:80px 40px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
          "<div><div style='font-size:12px;color:" + brass + ";text-transform:uppercase;letter-spacing:2px;margin-bottom:16px;'>Featured Coverage</div>" +
          "<h2 style='font-size:clamp(24px,3vw,36px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.2;'>" + articles[0][0] + "</h2>" +
          "<p style='font-size:15px;color:" + stone + ";margin:0 0 24px;'>" + articles[0][1] + "</p>" +
          "<a style='font-size:14px;color:" + brass + ";font-weight:600;text-decoration:none;'>Read the story →</a></div>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Press image</div>" +
        "</div></section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:1160px;margin:0 auto;'>" +
          articles.slice(1).map(function(a) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:28px;border-radius:4px;'>" +
              "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + a[0] + "</h3>" +
              "<div style='font-size:13px;color:" + stone + ";margin-bottom:16px;'>" + a[1] + "</div>" +
              "<a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;'>Read →</a></div>";
          }).join("") +
        "</div></section>";
      }
      // Variant A — logo bar + article list (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 48px;'><div style='max-width:1160px;margin:0 auto;'>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;padding:40px 0;border-bottom:1px solid #E2DBCC;'>" +
            ["Forbes", "Inc.", "TechCrunch", "Fast Company", "Bloomberg"].map(function(pub) {
              return "<div style='text-align:center;padding:20px;background:#fff;border:1px solid #E2DBCC;border-radius:4px;'><div style='font-size:18px;font-weight:700;color:" + stone + ";'>" + pub + "</div></div>";
            }).join("") +
          "</div>" +
        "</div></section>" +
        "<section style='background:" + bone + ";padding:40px 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          articles.map(function(a) {
            return "<div style='display:grid;grid-template-columns:1fr auto;gap:24px;padding:24px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 4px;'>" + a[0] + "</h3><div style='font-size:14px;color:" + stone + ";'>" + a[1] + "</div></div>" +
              "<a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;white-space:nowrap;'>Read →</a></div>";
          }).join("") +
        "</div></section>";
    })(),

    // ── PARTNERS ──
    partners: (function() {
      var partnerList = ["Partner One","Partner Two","Partner Three","Partner Four","Partner Five","Partner Six"];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Partners</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Companies we work with</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Strategic partnerships that strengthen what we deliver.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Description list
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
            partnerList.map(function(p) {
              return "<div style='display:grid;grid-template-columns:80px 1fr;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div style='background:#e0ddd7;width:64px;height:64px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:10px;'>Logo</div>" +
                "<div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + p + "</div><p style='font-size:14px;color:" + stone + ";margin:0;line-height:1.5;'>A brief description of what this partner does and how the relationship benefits clients.</p></div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      }
      // Variant A — logo grid (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 48px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          partnerList.map(function(p) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:40px 24px;text-align:center;border-radius:4px;'>" +
              "<div style='background:#e0ddd7;width:80px;height:80px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:11px;'>Logo</div>" +
              "<div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + p + "</div></div>";
          }).join("") +
        "</div></section>" +
        "<section style='background:#ffffff;padding:80px 40px;text-align:center;'><div style='max-width:600px;margin:0 auto;'>" +
          "<h2 style='font-weight:800;font-size:28px;color:" + ink + ";margin:0 0 16px;'>Become a partner</h2>" +
          "<p style='font-size:16px;color:" + text + ";margin:0 0 32px;line-height:1.7;'>Interested in working together? We would love to hear from you.</p>" +
          "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Get in touch</a>" +
        "</div></section>";
    })(),

    // ── RESOURCES ──
    resources: (function() {
      var items = [["Getting Started Guide","A step-by-step walkthrough for new clients.","PDF"],["Brand Toolkit","Templates, guidelines, and assets for your brand.","ZIP"],["Project Brief Template","Fill this out before our first meeting.","DOCX"],["Case Study Collection","Real results from real projects.","PDF"]];
      var header = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Resources</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Guides, tools, and downloads</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Everything you need to get the most out of working with us.</p>" +
      "</div></section>";
      if (variant === "B") {
        // Categorized list
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
            items.map(function(r) {
              return "<div style='display:grid;grid-template-columns:1fr auto;gap:24px;padding:20px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
                "<div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + r[0] + "</div><div style='font-size:14px;color:" + stone + ";'>" + r[1] + "</div></div>" +
                "<div style='display:flex;align-items:center;gap:12px;'><span style='font-size:11px;font-weight:700;color:" + brassDp + ";background:rgba(180,83,9,.1);padding:4px 8px;border-radius:3px;'>" + r[2] + "</span><a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;white-space:nowrap;'>Download →</a></div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      }
      // Variant A — card grid (current)
      return header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          items.map(function(r) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:28px;border-radius:4px;display:flex;gap:20px;align-items:flex-start;'>" +
              "<div style='width:48px;height:48px;background:" + bone + ";border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:" + brassDp + ";flex-shrink:0;'>" + r[2] + "</div>" +
              "<div><h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 6px;'>" + r[0] + "</h3><p style='font-size:14px;color:" + stone + ";line-height:1.5;margin:0 0 12px;'>" + r[1] + "</p><a style='font-size:13px;color:" + brassDp + ";font-weight:600;text-decoration:none;'>Download →</a></div></div>";
          }).join("") +
        "</div></section>";
    })(),

    // ── DOWNLOADS ──
    // ── DOWNLOADS ──
    downloads: (function() {
      var ditems = [["Brand Guidelines Template","Start with a professional framework."],["Social Media Calendar","Plan your content month by month."],["Project Scope Template","Define deliverables before you start."],["Invoice Template","Clean, professional billing."]];
      var dheader = "<section style='background:" + bone + ";padding:88px 40px 40px;'><div style='max-width:1160px;margin:0 auto;'>" +
        "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>Downloads</div>" +
        "<h1 style='font-weight:800;font-size:clamp(36px,5vw,56px);color:" + ink + ";margin:0 0 16px;line-height:1.1;'>Free downloads</h1>" +
        "<p style='font-size:17px;color:" + text + ";max-width:560px;margin:0 0 48px;line-height:1.65;'>Grab what you need. No email required.</p>" +
      "</div></section>";
      if (variant === "B") {
        return dheader + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;max-width:1160px;margin:0 auto;'>" +
          ditems.map(function(d) {
            return "<div style='background:#fff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;text-align:center;'>" +
              "<div style='width:48px;height:48px;background:rgba(180,83,9,.1);border-radius:10px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:" + brassDp + ";'>PDF</div>" +
              "<h3 style='font-size:15px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + d[0] + "</h3>" +
              "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;line-height:1.5;'>" + d[1] + "</p>" +
              "<a style='padding:10px 20px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Download</a>" +
            "</div>";
          }).join("") + "</div></section>";
      }
      return dheader + "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:800px;margin:0 auto;'>" +
        ditems.map(function(d) {
          return "<div style='display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #E2DBCC;'><div><div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + d[0] + "</div><div style='font-size:14px;color:" + stone + ";'>" + d[1] + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;white-space:nowrap;'>Download</a></div>";
        }).join("") +
      "</div></section>";
    })(),

    // ── 404 ──
    "404": "<section style='background:" + bone + ";min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;'>" +
      "<div style='font-size:clamp(80px,15vw,160px);font-weight:800;color:" + brass + ";line-height:1;margin-bottom:16px;'>404</div>" +
      "<h1 style='font-size:clamp(24px,4vw,36px);font-weight:800;color:" + ink + ";margin:0 0 16px;'>Page not found</h1>" +
      "<p style='font-size:17px;color:" + text + ";max-width:400px;margin:0 auto 32px;line-height:1.7;'>The page you are looking for does not exist or has been moved.</p>" +
      "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Back to homepage</a>" +
    "</section>",

  };

  var ap = activePage.toLowerCase();
  // "other" is an alias for "landing" (see generatePages.js) — same builder,
  // different label in the UI. The sections dict below only has a
  // "landing" key; without this alias, an "other" page falls through every
  // fallback attempt to sections.home, showing the wrong preview entirely
  // for what's now the default page type on every Manifest import.
  if (ap === "other" || ap.indexOf("other-") === 0) ap = "landing";
  var body = sections[ap] 
    || sections[ap.replace(/-\d+$/, "")] 
    || sections[ap.split("-")[0]]
    || sections[ap.replace(/[^a-z]/g, "")]
    || sections.home;

  var navItems = (brief.pages || ["Home","About","Services","Contact"]).map(function(p) { return typeof p === "string" ? p : (p.label || p.name || p); }).slice(0,6);

  return "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>" +
    "<title>" + (brief.brandName || "Preview") + "</title>" +
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
      "<div style='font-family:Inter,sans-serif;font-weight:800;font-size:18px;color:" + warmWhite + ";'>" + (brief.brandName || "Brand") + "</div>" +
      "<div class='nav-links' style='display:flex;gap:24px;align-items:center;'>" +
        navItems.map(function(l) { return "<a style='color:" + warmWhite + ";text-decoration:none;font-size:14px;font-weight:500;'>" + l + "</a>"; }).join("") +
        "<a style='padding:8px 20px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;text-decoration:none;border-radius:4px;margin-left:8px;'>" + (brief.headerCta || "Get in touch") + "</a>" +
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
        "<a style='margin-top:16px;padding:14px 20px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:4px;text-align:center;display:block;'>" + (brief.headerCta || "Get in touch") + "</a>" +
      "</div>" +
    "</div>" +
    body +
    "<footer style='background:" + ink + ";padding:48px clamp(20px,5vw,60px);'>" +
      "<div style='display:flex;flex-direction:column;align-items:flex-start;gap:24px;max-width:1100px;margin:0 auto;'>" +
        "<div style='font-family:Inter,sans-serif;font-weight:800;font-size:18px;color:" + warmWhite + ";'>" + (brief.brandName || "Brand") + "</div>" +
        (brief.tagline ? "<div style='font-size:13px;color:rgba(255,255,255,0.65);margin-top:-16px;'>" + brief.tagline + "</div>" : "") +
        "<div class='footer-nav' style='display:flex;gap:24px;flex-wrap:wrap;'>" + navItems.map(function(l) { return "<a class='footer-link' style='color:rgba(255,255,255,0.8);text-decoration:none;font-size:13px;font-weight:500;'>" + l + "</a>"; }).join("") + "</div>" +
        (brief.contactEmail ? "<div style='font-size:13px;color:rgba(255,255,255,0.6);'>" + (brief.contactEmail || "") + "</div>" : "") +
        "<div style='font-size:12px;color:rgba(255,255,255,0.35);padding-top:8px;border-top:1px solid rgba(255,255,255,0.1);width:100%;'>" + (brief.brandName || "Brand") + " &copy; " + new Date().getFullYear() + " &nbsp;&middot;&nbsp; <a class='footer-link' href='#' style='color:rgba(255,255,255,0.45);text-decoration:none;font-size:12px;'>Privacy Policy</a> &nbsp;&middot;&nbsp; <a class='footer-link' href='#' style='color:rgba(255,255,255,0.45);text-decoration:none;font-size:12px;'>Cookie Policy</a></div>" +
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
