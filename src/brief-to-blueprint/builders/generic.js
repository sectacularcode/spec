import { mkContainer, mkHeading, mkText, mkButton, mkSpacer } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
import { bestTextColor } from "../../utils/contrast.js";

export function buildGenericPage(colors, brief, pageDef, inspoContext, variant) {
  var ink = colors.ink || "#1C1A17";
  var bone = colors.bone || "#EDE7DB";
  var brass = colors.brass || "#52525B";
  var brassDp = colors["brass-deep"] || "#3F3F46";
  var warmWhite = colors["warm-white"] || "#FBFAF7";
  var text = colors.text || "#2A2722";
  var stone = colors.stone || "#8A8170";
  var asphalt = colors.asphalt || "#2B2823";
  var definedBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "primary"; }) || (brief.buttons && brief.buttons[0]);
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, text);
  var label = pageDef.label;
  var pid = pageDef.id;
  var isDark = (variant === "B");

  // Hero — Variant A: light bone bg, Variant B: dark ink bg
  var heroEyebrow = mkHeading(brief.brandName || "", isDark ? brass : brass, "h6", { eyebrow: true, align: isDark ? "left" : "left" });
  var heroH1 = mkHeading(label, isDark ? warmWhite : ink, "h1", { font: (brief.fonts && brief.fonts[1]) || "Inter", weight: 800, px: 52 });
  var heroContainer = mkContainer([heroEyebrow, mkSpacer(16), heroH1], isDark ? ink : bone, { padY: "112", minH: 50, center: true });

  // Page-type specific sections
  var sections = [];
  sections.push(heroContainer);

  // Page-specific content
  if (pid === "team") {
    sections.push(mkContainer([
      mkHeading("The team.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("The people behind the work.", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "blog" || pid === "blog-post") {
    sections.push(mkContainer([
      mkHeading(pid === "blog" ? "Journal." : "[Post title]", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText(pid === "blog" ? "Thinking, writing, and updates from the studio." : "[Post content — add in WordPress editor]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "faq") {
    sections.push(mkContainer([
      mkHeading("Questions, answered.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add your FAQ items in Elementor after import]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "testimonials") {
    sections.push(mkContainer([
      mkHeading("Kind words.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add testimonials in Elementor after import]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "careers") {
    sections.push(mkContainer([
      mkHeading("Work with us.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add open roles and career information here]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "press") {
    sections.push(mkContainer([
      mkHeading("Press & media.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add press mentions, media kit, and brand assets here]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "pricing") {
    sections.push(mkContainer([
      mkHeading("Investment.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("Transparent pricing. No surprises.", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "landing") {
    sections.push(mkContainer([
      mkHeading(brief.tagline || "[Landing page headline]", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText(he(brief.hookStatement || "[Landing page subheadline — specific and direct]"), stone),
      mkSpacer(24),
      mkButton(brief.heroCta1 || "Get started", btnBg, btnText),
    ], bone, { padY: "80", center: true }));
  } else if (pid === "thank-you") {
    sections.push(mkContainer([
      mkHeading("You're all set.", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("We'll be in touch shortly.", stone),
    ], bone, { padY: "80", center: true }));
  } else if (pid === "privacy" || pid === "terms") {
    sections.push(mkContainer([
      mkHeading(pid === "privacy" ? "Privacy Policy" : "Terms of Service", text, "h2", { weight: 700, px: 32 }),
      mkSpacer(16),
      mkText("[Add your " + (pid === "privacy" ? "privacy policy" : "terms of service") + " content here — consult a legal professional]", stone),
    ], bone, { padY: "80" }));
  } else if (pid === "404") {
    sections.push(mkContainer([
      mkHeading("404", brass, "h1", { weight: 800, px: 80 }),
      mkSpacer(8),
      mkHeading("Page not found.", text, "h2", { weight: 700, px: 36 }),
      mkSpacer(16),
      mkText("The page you're looking for doesn't exist or has moved.", stone),
      mkSpacer(24),
      mkButton("Go home", btnBg, btnText),
    ], bone, { padY: "80", center: true }));
  } else {
    // Generic fallback
    sections.push(mkContainer([
      mkHeading(label + ".", text, "h2", { weight: 700, px: 40 }),
      mkSpacer(16),
      mkText("[Add content for this page in Elementor after import]", stone),
    ], bone, { padY: "80" }));
  }

  // Closing CTA
  sections.push(mkContainer([
    mkHeading(brief.tagline || brief.closingCta || "Ready to get started?", warmWhite, "h2", { font: (brief.fonts && brief.fonts[1]) || "Inter", weight: 400, px: 40 }),
    mkSpacer(24),
    mkButton(brief.headerCta || "Start a project", btnBg, btnText),
  ], asphalt, { padY: "96", center: true }));

  return { version: "0.4", title: he(brief.brandName || "Site") + " — " + he(label), type: "page", page_settings: {}, content: sections };
}

