import { THEMES } from "../constants/themes.js";
import { eSection, eHead, eTxt, eSpacer, eSocial, eNavMenu } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
// Builds Elementor JSON for the site footer (Theme Builder global template)
export function buildFooterJSON(brand) {
  const { accentColor: ac, cardBgColor: card, headingFont: hf, bodyFont: bf, footerStyle } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const headingColor = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
  const body = isDark ? "#888" : "#666";
  const sec = eSection(card, 80, 60);
  const push = (...els) => els.forEach(e => sec.elements.push(e));

  if (footerStyle === "Editorial") {
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 32, "center"),
      eTxt(brand.tagline || "", body, bf, 13, "center"),
      eSpacer(24),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(24),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`, body, bf, 11, "center"),
    );
  } else if (footerStyle === "Studio") {
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 28, "center"),
      eSpacer(16),
      eNavMenu(brand.primaryMenu || ""),
      eSpacer(24),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(24),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}`, body, bf, 11, "center"),
    );
  } else if (footerStyle === "Agency") {
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 28, "left"),
      eTxt(brand.tagline || "", body, bf, 14, "left"),
      eSpacer(16),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(32),
      eNavMenu(brand.primaryMenu || ""),
      eSpacer(32),
      eTxt(brand.contactEmail || "", body, bf, 14, "left"),
      eSpacer(24),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}. ${brand.utilityMenu || ""}`, body, bf, 11, "left"),
    );
  } else {
    // Premium — 4 column
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 28, "left"),
      eTxt(brand.tagline || "", body, bf, 14, "left"),
      eSpacer(16),
      eTxt(brand.contactEmail || "", body, bf, 14, "left"),
      eSpacer(16),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(48),
      eHead("PAGES", "h6", ac, bf, 11, "left"),
      eSpacer(12),
      eNavMenu(brand.primaryMenu || ""),
      eSpacer(48),
      eHead("LEGAL", "h6", ac, bf, 11, "left"),
      eSpacer(12),
      eNavMenu(brand.utilityMenu || ""),
      eSpacer(48),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`, body, bf, 11, "left"),
    );
  }

  return { version: "0.4", title: `${he(brand.name)} — Footer`, type: "footer", content: [sec] };
}

// ──────────────────────────────────────────────────────────────────────────────
// BUILD HEADER JSON — separate Theme Builder template for site navigation
// Import: WordPress → Templates → Theme Builder → Header → Add New → Import
// Set display conditions to "Entire Site" so the header shows on every page.
// Four styles match the four footer styles for a cohesive system.
// ──────────────────────────────────────────────────────────────────────────────
