import { nid, mkContainer, mkHeading, mkText, mkButton, mkSpacer } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
import { bestTextColor } from "../../utils/contrast.js";

// Global header and footer JSON builders.
// Export as separate templates — import via Elementor Theme Builder.

export function buildHeaderJSON(C, brief, inspoContext) {
  var ink = C.ink || "#1C1A17";
  var brass = C.brass || "#52525B";
  var brassDp = C["brass-deep"] || "#3F3F46";
  var warmWhite = C["warm-white"] || "#FBFAF7";
  var definedBtn = brief.buttons && brief.buttons[0];
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, C.text || "#1a1a1a");

  // Determine header style from inspo context
  var inspo = (inspoContext || "").toLowerCase();
  var isDark = inspo.indexOf("dark header") !== -1 || inspo.indexOf("dark nav") !== -1 || inspo.indexOf("dark background nav") !== -1;
  var isTransparent = inspo.indexOf("transparent") !== -1 || inspo.indexOf("overlay") !== -1;
  var isCentered = inspo.indexOf("centered logo") !== -1 || inspo.indexOf("center logo") !== -1;

  var bgColor = isDark ? ink : isTransparent ? "rgba(0,0,0,0)" : "#ffffff";
  var textColor = isDark ? warmWhite : ink;
  var borderColor = isDark ? "rgba(255,255,255,0.1)" : "#dde0e6";


  // Logo widget
  var logoWidget = {
    id: nid(),
    elType: "widget",
    widgetType: "heading",
    settings: {
      title: he(brief.brandName || "Brand Name"),
      header_size: "h4",
      title_color: isDark ? warmWhite : ink,
      typography_typography: "custom",
      typography_font_family: (brief.fonts && brief.fonts[0]) || "Inter",
      typography_font_weight: "800",
      typography_font_size: { unit: "px", size: 20 },
    },
    elements: []
  };

  // CTA button
  var ctaBtn = mkButton(brief.headerCta || "Start a project", btnBg, btnText);
  ctaBtn.settings.padding = { unit: "px", top: "12", right: "24", bottom: "12", left: "24", isLinked: false };

  // Nav menu widget — single widget for all links
  var navMenuWidget = {
    id: nid(),
    elType: "widget",
    widgetType: "nav-menu",
    settings: {
      layout: "horizontal",
      nav_menu_typography_typography: "custom",
      nav_menu_typography_font_family: "Inter",
      nav_menu_typography_font_weight: "500",
      nav_menu_typography_font_size: { unit: "px", size: 14 },
      color: textColor,
      color_hover: brass,
      mobile_breakpoint: "tablet",
      pointer: "none",
      item_gap: { unit: "px", size: 32 },
    },
    elements: []
  };

  // Layout: logo left, nav center/right, CTA right
  var logoCol = mkContainer([logoWidget], null, { padY: "0", isInner: true });
  logoCol.settings._flex_grow = 0;

  var navCol = mkContainer([navMenuWidget], null, { padY: "0", isInner: true });
  navCol.settings._flex_grow = 1;
  navCol.settings.justify_content = isCentered ? "center" : "flex-end";

  var ctaCol = mkContainer([ctaBtn], null, { padY: "0", isInner: true });
  ctaCol.settings._flex_grow = 0;

  var headerRow = mkContainer([logoCol, navCol, ctaCol], null, {
    direction: "row", gap: "24", padY: "0", isInner: false
  });
  headerRow.settings.flex_align_items = "center";
  headerRow.settings.padding = { unit: "px", top: "16", right: "40", bottom: "16", left: "40", isLinked: false };
  headerRow.settings.padding_tablet = { unit: "px", top: "14", right: "24", bottom: "14", left: "24", isLinked: false };
  headerRow.settings.padding_mobile = { unit: "px", top: "12", right: "16", bottom: "12", left: "16", isLinked: false };

  if (bgColor !== "rgba(0,0,0,0)") {
    headerRow.settings.background_background = "classic";
    headerRow.settings.background_color = bgColor;
  }

  headerRow.settings.border_border = "solid";
  headerRow.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "1", left: "0", isLinked: false };
  headerRow.settings.border_color = borderColor;

  return {
    version: "0.4",
    title: he(brief.brandName || "Site") + " — Header",
    type: "header",
    page_settings: {},
    content: [headerRow]
  };
}

// ─── Footer builder ───────────────────────────────────────────────────────────
export function buildFooterJSON(C, brief, inspoContext) {
  var ink = C.ink || "#1C1A17";
  var brass = C.brass || "#52525B";
  var bone = C.bone || "#EDE7DB";
  var warmWhite = C["warm-white"] || "#FBFAF7";
  var stone = C.stone || "#8A8170";
  var text = C.text || "#2A2722";

  var inspo = (inspoContext || "").toLowerCase();
  var isDark = inspo.indexOf("dark footer") !== -1 || inspo.indexOf("dark background footer") !== -1;
  // Default footer to dark ink — common pattern for premium brands
  var bgColor = isDark || true ? ink : bone;
  var textColor = bgColor === ink ? warmWhite : text;
  var mutedColor = bgColor === ink ? stone : stone;

  var navLinks = brief.headerNav || ["Home", "Work", "Services", "About", "Process", "Contact"];

  // Brand column — logo, tagline, signature
  var brandCol = mkContainer([
    mkHeading(brief.brandName || "Brand Name", textColor, "h4", { weight: 800 }),
    mkSpacer(12),
    mkText(he(brief.tagline || ""), mutedColor),
    mkSpacer(8),
    mkText(he(brief.signatureLine || ""), mutedColor),
    mkSpacer(20),
    brief.contactEmail ? mkText(he(brief.contactEmail), mutedColor) : mkSpacer(0),
  ], null, { padY: "0", grow: 1, isInner: true });

  // Nav column
  var navItems = navLinks.map(function(label) {
    return mkHeading(label, mutedColor, "h6", { weight: 400 });
  });
  var navCol = mkContainer([
    mkHeading("Pages", brass, "h6", { eyebrow: true }),
    mkSpacer(16),
  ].concat(navItems), null, { padY: "0", grow: 1, isInner: true });

  // Determine footer style from inspo
  var isMinimal = inspo.indexOf("minimal footer") !== -1 || inspo.indexOf("simple footer") !== -1;


  if (isMinimal) {
    // Minimal: one row with logo + nav + copyright
    var minimalRow = mkContainer([
      mkHeading(brief.brandName || "Brand Name", textColor, "h5", { weight: 800 }),
      mkContainer(navLinks.map(function(l) { return mkHeading(l, mutedColor, "h6", { weight: 400 }); }),
        null, { direction: "row", gap: "24", padY: "0", isInner: true }),
      mkText("© " + new Date().getFullYear() + " " + he(brief.brandName || ""), mutedColor),
    ], null, { direction: "row", gap: "40", padY: "0", isInner: false });
    minimalRow.settings.flex_align_items = "center";
    minimalRow.settings.padding = { unit: "px", top: "32", right: "40", bottom: "32", left: "40", isLinked: false };
    minimalRow.settings.background_background = "classic";
    minimalRow.settings.background_color = bgColor;
    minimalRow.settings.border_border = "solid";
    minimalRow.settings.border_width = { unit: "px", top: "1", right: "0", bottom: "0", left: "0", isLinked: false };
    minimalRow.settings.border_color = "rgba(255,255,255,0.1)";

    return {
      version: "0.4",
      title: he(brief.brandName || "Site") + " — Footer",
      type: "footer",
      page_settings: {},
      content: [minimalRow]
    };
  }

  // Standard multi-column footer
  var mainRow = mkContainer([brandCol, navCol], null, {
    direction: "row", gap: "64", padY: "0", isInner: false
  });
  mainRow.settings.padding = { unit: "px", top: "64", right: "40", bottom: "48", left: "40", isLinked: false };
  mainRow.settings.padding_tablet = { unit: "px", top: "48", right: "24", bottom: "40", left: "24", isLinked: false };
  mainRow.settings.padding_mobile = { unit: "px", top: "40", right: "20", bottom: "32", left: "20", isLinked: false };
  mainRow.settings.background_background = "classic";
  mainRow.settings.background_color = bgColor;

  // Copyright row
  var copyrightBar = mkContainer([
    mkText("© " + new Date().getFullYear() + " " + he(brief.brandName || "") + ". All rights reserved.", mutedColor),
    brief.footerTagline ? mkText(he(brief.footerTagline), mutedColor) : mkSpacer(0),
  ], null, { direction: "row", gap: "24", padY: "0", isInner: false });
  copyrightBar.settings.padding = { unit: "px", top: "20", right: "40", bottom: "20", left: "40", isLinked: false };
  copyrightBar.settings.padding_mobile = { unit: "px", top: "16", right: "20", bottom: "16", left: "20", isLinked: false };
  copyrightBar.settings.background_background = "classic";
  copyrightBar.settings.background_color = bgColor;
  copyrightBar.settings.border_border = "solid";
  copyrightBar.settings.border_width = { unit: "px", top: "1", right: "0", bottom: "0", left: "0", isLinked: false };
  copyrightBar.settings.border_color = "rgba(255,255,255,0.08)";
  copyrightBar.settings.justify_content = "space-between";
  copyrightBar.settings.flex_align_items = "center";

  return {
    version: "0.4",
    title: he(brief.brandName || "Site") + " — Footer",
    type: "footer",
    page_settings: {},
    content: [mainRow, copyrightBar]
  };
}
