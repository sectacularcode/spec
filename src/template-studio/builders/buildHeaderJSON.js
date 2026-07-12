import { THEMES } from "../constants/themes.js";
import { textOn, headingColorOn } from "../utils/colors.js";
import { uid, eContainer, eSection, eHead, eBtn, eNavMenu, eSocial } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
// Builds Elementor JSON for the site header (Theme Builder global template)
export function buildHeaderJSON(brand) {
  const { primaryColor: pc, accentColor: ac, headingFont: hf, bodyFont: bf, headerStyle = "Editorial" } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const hColor = headingColorOn(pc, theme && theme.headingColor);

  // Header is a sticky bar with reduced vertical padding
  const sec = eSection(pc, 20, 20);
  sec.settings.padding = { unit: "px", top: "18", right: "60", bottom: "18", left: "60", isLinked: false };
  sec.settings.padding_tablet = { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false };
  sec.settings.padding_mobile = { unit: "px", top: "14", right: "20", bottom: "14", left: "20", isLinked: false };
  sec.settings.position = "sticky";
  sec.settings.z_index = { unit: "px", size: 100, sizes: [] };

  // Logo block — image if URL, text fallback
  const logoEl = brand.logoUrl
    ? { id: uid(), elType: "widget", widgetType: "image", elements: [],
        settings: { image: { url: brand.logoUrl, id: "" }, image_size: "medium", align: "left",
          width: { unit: "px", size: 140, sizes: [] }, link_to: "custom",
          link: { url: "/", is_external: "", nofollow: "" } } }
    : eHead(brand.logoText || brand.name, "h6", hColor, hf, 20, "left");

  // Nav menu widget — pulls from WordPress menu by name
  const navEl = eNavMenu(brand.primaryMenu || "");
  // Override nav styling for header context
  navEl.settings.menu_typography_typography = "custom";
  navEl.settings.menu_typography_font_family = bf;
  navEl.settings.menu_typography_font_size = { unit: "px", size: 12, sizes: [] };
  navEl.settings.menu_typography_letter_spacing = { unit: "px", size: 1, sizes: [] };
  navEl.settings.menu_typography_text_transform = "uppercase";
  navEl.settings.color_menu_item = hColor;
  navEl.settings.color_menu_item_hover = ac;
  navEl.settings.color_menu_item_active = ac;
  navEl.settings.pointer = "underline";
  navEl.settings.pointer_color = ac;
  // Switch to hamburger menu on tablet/mobile
  navEl.settings.menu_mobile_breakpoint = "tablet";
  navEl.settings.toggle = "burger";
  navEl.settings.toggle_color = hColor;

  // Social icons block for header — small, inline
  const socialEl = (brand.socialLinks || []).length && brand.showSocialInNav
    ? (() => {
        const s = eSocial(brand.socialLinks || [], hColor, ac);
        s.settings.icon_size = { unit: "px", size: 14, sizes: [] };
        s.settings.icon_padding = { unit: "em", size: 0.4, sizes: [] };
        s.settings.icon_spacing = { unit: "px", size: 8, sizes: [] };
        return s;
      })()
    : null;

  // CTA button for Premium header style
  const ctaEl = (() => {
    const b = eBtn(brand.cta1 || "Get in touch", "#contact", ac, textOn(ac), bf, "right");
    b.settings.typography_font_size = { unit: "px", size: 11, sizes: [] };
    b.settings.button_padding = { unit: "px", top: "12", right: "24", bottom: "12", left: "24", isLinked: false };
    return b;
  })();

  if (headerStyle === "Editorial") {
    // Minimal: logo left, nav center, social right (3 columns)
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 24, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colNav = eContainer({ content_width: "full", flex_grow: 1, flex_shrink: 1 });
    colNav.elements.push(navEl);
    const colSocial = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    if (socialEl) colSocial.elements.push(socialEl);
    row.elements.push(colLogo, colNav, colSocial);
    sec.elements.push(row);
  } else if (headerStyle === "Studio") {
    // Centered logo, nav below — magazine masthead feel
    const colLogo = eContainer({ content_width: "full", align_items: "center" });
    colLogo.elements.push(logoEl);
    sec.elements.push(colLogo);
    const colNav = eContainer({ content_width: "full", align_items: "center" });
    navEl.settings.align = "center";
    colNav.elements.push(navEl);
    sec.elements.push(colNav);
  } else if (headerStyle === "Agency") {
    // Logo left, nav right, social inline with nav
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 32, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colRight = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_gap: { unit: "px", size: 24, sizes: [] },
      flex_grow: 0, flex_shrink: 0,
      align_items: "center",
    });
    colRight.elements.push(navEl);
    if (socialEl) colRight.elements.push(socialEl);
    row.elements.push(colLogo, colRight);
    sec.elements.push(row);
  } else if (headerStyle === "Premium") {
    // Premium — logo left, nav center, CTA + social right
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 32, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colNav = eContainer({ content_width: "full", flex_grow: 1, flex_shrink: 1, align_items: "center" });
    colNav.elements.push(navEl);
    const colRight = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_gap: { unit: "px", size: 16, sizes: [] },
      flex_grow: 0, flex_shrink: 0,
      align_items: "center",
    });
    if (socialEl) colRight.elements.push(socialEl);
    colRight.elements.push(ctaEl);
    row.elements.push(colLogo, colNav, colRight);
    sec.elements.push(row);
  } else if (headerStyle === "Social First") {
    // Logo left, social icons right — no nav
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 24, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colSocial = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    if (socialEl) colSocial.elements.push(socialEl);
    row.elements.push(colLogo, colSocial);
    sec.elements.push(row);
  } else if (headerStyle === "Transparent") {
    // Transparent background — overlays the hero, goes solid on scroll via CSS
    sec.settings.background_background = "classic";
    sec.settings.background_color = "transparent";
    sec.settings.position = "fixed";
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 24, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colNav = eContainer({ content_width: "full", flex_grow: 1, flex_shrink: 1 });
    colNav.elements.push(navEl);
    const colRight = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    if (socialEl) colRight.elements.push(socialEl);
    row.elements.push(colLogo, colNav, colRight);
    sec.elements.push(row);
  }

  return { version: "0.4", title: `${he(brand.name)} — Header`, type: "header", content: [sec] };
}

// ──────────────────────────────────────────────────────────────────────────────
// DIVI BUILDER — outputs Divi layout JSON for WordPress
// Divi stores layouts as WordPress shortcodes (et_pb_*) wrapped in JSON envelope.
// Import: WordPress → Divi → Divi Library → Import & Export → Import
// Or: open page with Divi Builder → Load from Library → Your saved templates
// ──────────────────────────────────────────────────────────────────────────────