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
    home: buildHomePreview(brief, variant, inspoContext, colorsObj, patterns),

    work: buildWorkPreview(brief, variant, inspoContext, colorsObj, patterns),

    services: buildServicesPreview(brief, variant, inspoContext, colorsObj, patterns),
    about: buildAboutPreview(brief, variant, inspoContext, colorsObj, patterns),

    process: buildProcessPreview(brief, variant, inspoContext, colorsObj, patterns),

    contact: buildContactPreview(brief, variant, inspoContext, colorsObj, patterns),

    landing: buildLandingPreview(brief, variant, inspoContext, colorsObj),

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
                  "<div style='font-size:15px;font-weight:700;color:" + ink + ";'>" + he(m.name) + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";margin-top:4px;'>" + he(m.role) + "</div>" +
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
                  "<div style='font-size:16px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + he(m.name) + "</div>" +
                  "<div style='font-size:13px;color:" + brass + ";font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;'>" + he(m.role) + "</div>" +
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
              return "<div style='text-align:center;'><div style='background:#e0ddd7;aspect-ratio:1;margin-bottom:16px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Photo</div><div style='font-size:16px;font-weight:700;color:" + ink + ";'>" + he(m.name) + "</div><div style='font-size:14px;color:" + stone + ";margin-top:4px;'>" + he(m.role) + "</div></div>";
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

    pricing: buildPricingPreview(brief, variant, inspoContext, colorsObj, patterns),

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
            "<p style='font-size:clamp(22px,3vw,32px);color:" + warmWhite + ";line-height:1.5;font-weight:300;margin:0 0 40px;'>" + he(quotes[0].q) + "</p>" +
            "<div style='width:40px;height:2px;background:" + brass + ";margin:0 auto 24px;'></div>" +
            "<div style='font-size:15px;font-weight:700;color:" + warmWhite + ";'>" + he(quotes[0].name) + "</div>" +
            "<div style='font-size:13px;color:" + stone + ";margin-top:6px;'>" + he(quotes[0].role) + "</div>" +
          "</div>" +
        "</section>" +
        "<section style='background:" + bone + ";padding:80px 40px 96px;'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:32px;max-width:900px;margin:0 auto;'>" +
            quotes.slice(1).map(function(qt) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'>" +
                "<p style='font-size:16px;color:" + ink + ";line-height:1.6;margin:0 0 20px;'>" + he(qt.q) + "</p>" +
                "<div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + he(qt.name) + "</div>" +
                "<div style='font-size:13px;color:" + stone + ";'>" + he(qt.role) + "</div>" +
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
                  "<p style='font-size:18px;color:" + ink + ";line-height:1.6;margin:0 0 16px;font-style:italic;'>\u201c" + he(qt.q) + "\u201d</p>" +
                  "<div style='font-size:14px;font-weight:700;color:" + ink + ";'>" + he(qt.name) + "</div>" +
                  "<div style='font-size:13px;color:" + stone + ";'>" + he(qt.role) + "</div>" +
                "</div>" +
              "</div>";
            }).join("") +
          "</div></section>";
      } else {
        // card-grid (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:32px;max-width:1160px;margin:0 auto;'>" +
            quotes.map(function(qt) {
              return "<div style='background:#fff;border-left:3px solid " + brass + ";padding:32px;'><p style='font-family:Inter,sans-serif;font-size:18px;color:" + ink + ";line-height:1.5;margin:0 0 20px;'>" + he(qt.q) + "</p><div style='font-size:14px;font-weight:600;color:" + ink + ";'>" + he(qt.name) + "</div><div style='font-size:13px;color:" + stone + ";'>" + he(qt.role) + "</div></div>";
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
                    "<div style='font-size:12px;font-weight:800;color:" + brass + ";letter-spacing:1px;margin-bottom:10px;'>" + he(e.date) + "</div>" +
                    "<h3 style='font-size:17px;font-weight:700;color:" + ink + ";margin:0 0 8px;line-height:1.3;'>" + he(e.title) + "</h3>" +
                    "<p style='font-size:13px;color:" + stone + ";margin:0 0 20px;'>" + he(e.meta) + "</p>" +
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
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:2px;margin-bottom:16px;'>" + he(next.date) + "</div>" +
              "<h2 style='font-size:clamp(28px,4vw,44px);font-weight:800;color:" + warmWhite + ";margin:0 0 16px;line-height:1.15;'>" + he(next.title) + "</h2>" +
              "<p style='font-size:16px;color:" + warmWhite + ";opacity:.7;margin:0 0 32px;'>" + he(next.meta) + "</p>" +
              "<a style='display:inline-block;padding:14px 36px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;'>Register now</a>" +
            "</div>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:6px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Event image</div>" +
          "</div>" +
        "</section>" +
        header +
        "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
          evts.slice(1).map(function(e) {
            return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'>" +
              "<div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + he(e.date) + "</div>" +
              "<div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + he(e.title) + "</div><div style='font-size:14px;color:" + stone + ";'>" + he(e.meta) + "</div></div>" +
              "<a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else {
        // date-list (default)
        return header +
          "<section style='background:" + bone + ";padding:0 40px 96px;'><div style='max-width:900px;margin:0 auto;'>" +
            evts.map(function(e) {
              return "<div style='display:grid;grid-template-columns:100px 1fr auto;gap:24px;padding:28px 0;border-bottom:1px solid #E2DBCC;align-items:center;'><div style='font-size:14px;font-weight:800;color:" + brass + ";letter-spacing:1px;'>" + he(e.date) + "</div><div><div style='font-size:17px;font-weight:700;color:" + ink + ";margin-bottom:4px;'>" + he(e.title) + "</div><div style='font-size:14px;color:" + stone + ";'>" + he(e.meta) + "</div></div><a style='padding:10px 24px;background:" + brassDp + ";color:#ffffff;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;text-decoration:none;white-space:nowrap;border-radius:4px;'>Register</a></div>";
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
    portfolio: buildPortfolioPreview(brief, variant, inspoContext, colorsObj, patterns),

    // ── LOCATION ──
    location: buildLocationPreview(brief, variant, inspoContext, colorsObj, patterns),
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
