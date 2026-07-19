// Extracted verbatim from buildPreviewHTML.js's sections object (July 2026
// preview-split pass, same treatment landingPreview.js got). Output is
// byte-identical to the pre-split inline version -- verified against the
// original before shipping. colors carries the 8 resolved palette values
// buildPreviewHTML.js computes (defaults already applied).
import { he } from "../../utils/htmlEscape.js";

export function buildHomePreview(brief, variant, inspoContext, colors, patterns) {
  var ink = colors.ink, brass = colors.brass, bone = colors.bone, warmWhite = colors.warmWhite, stone = colors.stone, brassDp = colors.brassDp, text = colors.text;
      var hp = patterns.hero;
      
      // ── HERO VARIANTS ──
      var heroHTML = "";
      if (hp === "split-right") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:8px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Hero image</div>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + he(brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "centered-bold") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(80px,12vw,140px) clamp(24px,8vw,80px);text-align:center;'>" +
          "<div style='max-width:800px;margin:0 auto;'>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:24px;'>" + he(brief.brandName || "Brand") + "</div>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,72px);color:" + warmWhite + ";margin:0 0 24px;line-height:1.05;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";opacity:.8;margin:0 auto 40px;line-height:1.7;max-width:560px;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<div style='display:flex;gap:12px;justify-content:center;flex-wrap:wrap;'>" +
              "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
              "<a style='padding:14px 40px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + he(brief.heroCta2 || "Learn more") + "</a>" +
            "</div>" +
          "</div>" +
        "</section>";
      } else if (hp === "full-image") {
        heroHTML = "<section style='background:" + ink + ";padding:clamp(100px,15vw,180px) clamp(24px,8vw,80px);text-align:center;position:relative;'>" +
          "<div style='position:absolute;inset:0;background:#e0ddd7;opacity:0.3;'></div>" +
          "<div style='position:relative;max-width:700px;margin:0 auto;'>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(36px,6vw,64px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.08;text-shadow:0 2px 20px rgba(0,0,0,0.3);'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + warmWhite + ";margin:0 0 36px;line-height:1.7;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<a style='padding:16px 48px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:14px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>";
      } else if (hp === "minimal") {
        heroHTML = "<section style='background:" + bone + ";padding:clamp(100px,15vw,200px) clamp(24px,8vw,80px);'>" +
          "<div style='max-width:800px;'>" +
            "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(40px,7vw,80px);color:" + ink + ";margin:0 0 24px;line-height:1.05;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
            "<p style='font-size:18px;color:" + stone + ";margin:0 0 40px;line-height:1.7;max-width:480px;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
            "<a style='padding:14px 32px;background:" + ink + ";color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:0;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
          "</div>" +
        "</section>";
      } else { // split-left (default)
        heroHTML = "<section style='background:" + ink + ";padding:clamp(60px,10vw,100px) clamp(24px,8vw,80px);'>" +
          "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;max-width:1160px;margin:0 auto;'>" +
            "<div>" +
              "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brass + ";margin-bottom:20px;'>" + he(brief.brandName || "Brand") + "</div>" +
              "<h1 style='font-family:Inter,sans-serif;font-weight:800;font-size:clamp(32px,5vw,56px);color:" + warmWhite + ";margin:0 0 20px;line-height:1.1;'>" + he(brief.heroHeadline || "Your headline here.") + "</h1>" +
              "<p style='font-size:17px;color:" + warmWhite + ";opacity:.8;margin:0 0 32px;line-height:1.7;max-width:480px;'>" + he(brief.heroSubhead || "Subheadline goes here.") + "</p>" +
              "<div style='display:flex;gap:12px;flex-wrap:wrap;'>" +
                "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>" + he(brief.heroCta1 || "Get started") + "</a>" +
                "<a style='padding:14px 32px;background:transparent;color:" + warmWhite + ";font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,0.3);border-radius:4px;display:inline-block;'>" + he(brief.heroCta2 || "Learn more") + "</a>" +
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
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 48px;'>" + he(brief.servicesHeading || "Our services") + "</h2>" +
          svcCards.map(function(pair, idx) {
            var imgFirst = idx % 2 === 0;
            return "<div style='display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;margin-bottom:48px;'>" +
              (imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Image</div>" : "") +
              "<div><h3 style='font-size:22px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + he(pair[0]) + "</h3><p style='font-size:16px;color:" + stone + ";line-height:1.7;margin:0;'>" + he(pair[1]) + "</p></div>" +
              (!imgFirst ? "<div style='background:#e0ddd7;aspect-ratio:3/2;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>Image</div>" : "") +
            "</div>";
          }).join("") +
        "</div></section>";
      } else if (sp === "numbered-features") {
        servicesHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);'><div style='max-width:900px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 48px;'>" + he(brief.servicesHeading || "Our services") + "</h2>" +
          svcCards.map(function(pair, idx) {
            return "<div style='display:grid;grid-template-columns:60px 1fr;gap:24px;padding:28px 0;border-top:1px solid #E2DBCC;'>" +
              "<div style='font-size:36px;font-weight:800;color:" + brass + ";line-height:1;'>0" + (idx+1) + "</div>" +
              "<div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 8px;'>" + he(pair[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(pair[1]) + "</p></div>" +
            "</div>";
          }).join("") +
        "</div></section>";
      } else { // card-grid
        servicesHTML = "<section style='background:" + bone + ";padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='max-width:1100px;margin:0 auto;'>" +
          "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>What we do</div>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 40px;'>" + he(brief.servicesHeading || "Our services") + "</h2>" +
          "<div style='display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;'>" +
            svcCards.map(function(pair) {
              return "<div style='background:#ffffff;border:1px solid #E2DBCC;padding:32px;border-radius:4px;'><div style='width:40px;height:3px;background:" + brass + ";margin-bottom:20px;'></div><h3 style='font-size:18px;font-weight:700;color:" + ink + ";margin:0 0 12px;'>" + he(pair[0]) + "</h3><p style='font-size:15px;color:" + stone + ";line-height:1.6;margin:0;'>" + he(pair[1]) + "</p></div>";
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
          "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 24px;line-height:1.15;'>" + he(brief.aboutHeading || "Our story") + "</h2>" +
          "<p style='font-size:17px;color:" + text + ";line-height:1.8;margin:0;text-align:left;'>" + he(brief.aboutBody || "Your company story goes here.") + "</p>" +
        "</div></section>";
      } else { // split-image
        aboutHTML = "<section style='background:#ffffff;padding:48px clamp(24px,6vw,80px);border-top:1px solid #e5e7eb;'><div style='display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto;'>" +
          "<div style='background:#e0ddd7;aspect-ratio:4/3;border-radius:4px;display:flex;align-items:center;justify-content:center;color:" + stone + ";font-size:13px;'>About image</div>" +
          "<div>" +
            "<div style='font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:" + brassDp + ";margin-bottom:16px;'>About</div>" +
            "<h2 style='font-weight:800;font-size:clamp(24px,3.5vw,36px);color:" + ink + ";margin:0 0 16px;line-height:1.15;'>" + he(brief.aboutHeading || "About the company") + "</h2>" +
            "<p style='font-size:16px;color:" + text + ";line-height:1.7;margin:0;'>" + he(brief.aboutBody || "Your company story goes here.") + "</p>" +
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
          "<h2 style='font-weight:800;font-size:clamp(20px,3vw,32px);color:" + warmWhite + ";margin:0;'>" + he(brief.tagline || "Ready to get started?") + "</h2>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Start a project</a>" +
        "</div></section>";
      } else if (cp === "minimal-line") {
        ctaHTML = "<section style='background:" + bone + ";padding:60px clamp(24px,8vw,80px);text-align:center;border-top:1px solid #E2DBCC;'>" +
          "<a style='font-size:16px;color:" + brassDp + ";text-decoration:underline;font-weight:600;'>" + he(brief.heroCta1 || "Start a project") + " →</a>" +
        "</section>";
      } else { // dark-full
        ctaHTML = "<section style='background:" + ink + ";padding:80px clamp(24px,8vw,80px);text-align:center;'>" +
          "<h2 style='font-weight:800;font-size:clamp(24px,4vw,44px);color:" + warmWhite + ";margin:0 0 12px;'>" + he(brief.tagline || "Ready to get started?") + "</h2>" +
          "<p style='font-size:14px;color:" + stone + ";letter-spacing:2px;text-transform:uppercase;margin:0 0 32px;'>" + he(brief.signatureLine || "") + "</p>" +
          "<a style='padding:14px 40px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>Start a project</a>" +
        "</section>";
      }

      // ── HOOK ──
      var hookHTML = "<section style='background:" + bone + ";padding:80px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 16px;line-height:1.15;'>" + he(brief.hookStatement || "The problem you solve, stated clearly.") + "</h2>" +
        "<p style='font-size:17px;color:" + text + ";line-height:1.7;margin:0;'>" + he(brief.hookBody || "") + "</p>" +
      "</div></section>";

      // ── PRICING TEASER ──
      var pricingHTML = "<section style='background:#ffffff;padding:80px clamp(24px,8vw,80px);text-align:center;'><div style='max-width:720px;margin:0 auto;'>" +
        "<h2 style='font-weight:800;font-size:clamp(24px,4vw,40px);color:" + ink + ";margin:0 0 16px;'>Clear pricing. No surprises.</h2>" +
        "<p style='font-size:17px;color:" + text + ";line-height:1.7;margin:0 0 32px;'>See what it costs before you book a call.</p>" +
        "<a style='padding:14px 32px;background:" + brassDp + ";color:#ffffff;font-weight:600;font-size:13px;letter-spacing:1px;text-transform:uppercase;text-decoration:none;border-radius:4px;display:inline-block;'>See pricing</a>" +
      "</div></section>";

      return heroHTML + hookHTML + servicesHTML + aboutHTML + testimonialsHTML + pricingHTML + ctaHTML;
}
