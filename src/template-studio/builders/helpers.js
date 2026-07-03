// Elementor JSON widget builders for Template Studio
// All return Elementor-compatible JSON objects using the container/flexbox system (v4.x).
// Import what you need — do not construct widget JSON inline in page builders.

import { textOn, isLight } from "../utils/colors.js";
import { he } from "../utils/htmlEscape.js";

export const uid = () => Math.random().toString(36).slice(2, 9);

// Container helpers — uses Elementor's modern Container architecture (3.16+)
// content_width: "full" makes the container stretch edge-to-edge.
// boxed_width gives generous internal padding for the editorial look.
export const eContainer = (settings = {}) => ({
  id: uid(),
  elType: "container",
  isInner: false,
  settings: {
    container_type: "flex",
    content_width: "full",
    flex_direction: "column",
    flex_gap: { unit: "px", size: 0, sizes: [] },
    ...settings,
  },
  elements: [],
});

// Outer section container — full browser width, with background and generous edge padding
export const eSection = (bg = "", padTop = 100, padBot = 100) => eContainer({
  content_width: "full",
  background_background: bg ? "classic" : "",
  background_color: bg,
  padding: { unit: "px", top: String(padTop), right: "100", bottom: String(padBot), left: "100", isLinked: false },
  padding_tablet: { unit: "px", top: String(Math.round(padTop * 0.7)), right: "60", bottom: String(Math.round(padBot * 0.7)), left: "60", isLinked: false },
  padding_mobile: { unit: "px", top: String(Math.round(padTop * 0.5)), right: "24", bottom: String(Math.round(padBot * 0.5)), left: "24", isLinked: false },
});

// Row container — for multi-column layouts. Smaller gap to prevent wrap.
export const eRow = (gap = 24) => eContainer({
  content_width: "full",
  flex_direction: "row",
  flex_direction_mobile: "column",
  flex_wrap: "wrap",
  flex_gap: { unit: "px", size: gap, sizes: [] },
  flex_gap_mobile: { unit: "px", size: Math.round(gap * 0.75), sizes: [] },
  flex_align_items: "stretch",
  width: { unit: "%", size: 100, sizes: [] },
});

// Column inside a row — widths are slightly under theoretical to leave room for gaps
export const eCol = (size = 100) => {
  const c = eContainer({
    content_width: "full",
    width: { unit: "%", size, sizes: [] },
    width_tablet: { unit: "%", size: size < 100 ? 48 : 100, sizes: [] },
    width_mobile: { unit: "%", size: 100, sizes: [] },
    flex_grow: 0,
    flex_shrink: 0,
  });
  c.isInner = true;
  return c;
};

// ──────────────────────────────────────────────────────────────────────────────
// RESPONSIVE SIZE HELPERS — auto-generates desktop / tablet / mobile sizes
// so a 84px hero heading becomes ~63px on tablet, ~46px on mobile, etc.
// All Elementor widgets support typography_font_size_tablet/_mobile suffixes.
// ──────────────────────────────────────────────────────────────────────────────
const rPx = (size, tabletRatio = 0.78, mobileRatio = 0.58, min = 14) => ({
  desktop: { unit: "px", size, sizes: [] },
  tablet: { unit: "px", size: Math.max(Math.round(size * tabletRatio), min), sizes: [] },
  mobile: { unit: "px", size: Math.max(Math.round(size * mobileRatio), min), sizes: [] },
});

export const eHead = (text, tag = "h2", color = "#000", font = "Inter", size = 32, align = "left") => {
  // Headings scale more aggressively on small screens (big hero text shrinks more)
  const tabletR = size > 50 ? 0.7 : 0.85;
  const mobileR = size > 50 ? 0.5 : 0.75;
  const r = rPx(size, tabletR, mobileR, 12);
  return {
    id: uid(), elType: "widget", widgetType: "heading", elements: [],
    settings: {
      title: he(text), header_size: tag, align,
      align_tablet: align,
      align_mobile: align,
      title_color: color,
      typography_typography: "custom", typography_font_family: font,
      typography_font_size: r.desktop,
      typography_font_size_tablet: r.tablet,
      typography_font_size_mobile: r.mobile,
      typography_font_weight: tag === "h1" ? "400" : "500",
      typography_line_height: { unit: "em", size: 1.15, sizes: [] },
      typography_line_height_mobile: { unit: "em", size: 1.2, sizes: [] },
    },
  };
};

// Escapes `text` before wrapping — use this for plain user/brief copy.
export const eTxt = (text, color = "#666", font = "Inter", size = 16, align = "left") =>
  eTxtRaw(`<p>${he(text)}</p>`, color, font, size, align);

// Does NOT escape — use only when the caller has already built (and escaped
// the user-data leaves of) an intentional HTML fragment, e.g. testimonial
// name/role wrapped in <strong>/<span>.
export const eTxtRaw = (html, color = "#666", font = "Inter", size = 16, align = "left") => {
  const r = rPx(size, 0.95, 0.9, 13);
  return {
    id: uid(), elType: "widget", widgetType: "text-editor", elements: [],
    settings: {
      editor: html, align,
      align_tablet: align,
      align_mobile: align,
      text_color: color,
      typography_typography: "custom", typography_font_family: font,
      typography_font_size: r.desktop,
      typography_font_size_tablet: r.tablet,
      typography_font_size_mobile: r.mobile,
      typography_line_height: { unit: "em", size: 1.7, sizes: [] },
    },
  };
};

export const eBtn = (text, link = "#", bg = "#000", color = "#fff", font = "Inter", align = "left") => ({
  id: uid(), elType: "widget", widgetType: "button", elements: [],
  settings: {
    text, link: { url: link, is_external: "", nofollow: "" }, align,
    align_tablet: align, align_mobile: align,
    button_text_color: color, background_color: bg,
    typography_typography: "custom", typography_font_family: font,
    typography_font_size: { unit: "px", size: 12, sizes: [] },
    typography_font_size_mobile: { unit: "px", size: 11, sizes: [] },
    typography_letter_spacing: { unit: "px", size: 2, sizes: [] },
    typography_text_transform: "uppercase",
    button_padding: { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false },
    button_padding_mobile: { unit: "px", top: "14", right: "24", bottom: "14", left: "24", isLinked: false },
    border_radius: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true },
  },
});

export const eSpacer = (h = 40) => ({
  id: uid(), elType: "widget", widgetType: "spacer", elements: [],
  settings: {
    space: { unit: "px", size: h, sizes: [] },
    space_tablet: { unit: "px", size: Math.round(h * 0.8), sizes: [] },
    space_mobile: { unit: "px", size: Math.round(h * 0.6), sizes: [] },
  },
});

export const eImg = (url, _alt = "") => ({
  id: uid(), elType: "widget", widgetType: "image", elements: [],
  settings: { image: { url, id: "" }, image_size: "full", align: "center", caption_source: "none" },
});

export const eIconBox = (title, desc, num, color, accent, font, bf) => {
  const tr = rPx(20, 0.95, 0.9, 16);
  const dr = rPx(14, 0.95, 0.9, 13);
  return {
    id: uid(), elType: "widget", widgetType: "icon-box", elements: [],
    settings: {
      title_text: num ? `${num}. ${title}` : title,
      description_text: desc,
      icon_align: "left",
      // Hide the default star icon — we use the number prefix instead
      selected_icon: { value: "", library: "" },
      icon: "",
      primary_color: accent,
      title_color: color,
      description_color: "#888",
      title_typography_typography: "custom", title_typography_font_family: font,
      title_typography_font_size: tr.desktop,
      title_typography_font_size_tablet: tr.tablet,
      title_typography_font_size_mobile: tr.mobile,
      description_typography_typography: "custom", description_typography_font_family: bf,
      description_typography_font_size: dr.desktop,
      description_typography_font_size_tablet: dr.tablet,
      description_typography_font_size_mobile: dr.mobile,
      description_typography_line_height: { unit: "em", size: 1.6, sizes: [] },
    },
  };
};

export const eCounter = (num, suffix, label, accent, color, font, bf) => {
  const nr = rPx(56, 0.65, 0.55, 32);
  const lr = rPx(13, 0.95, 0.9, 11);
  return {
    id: uid(), elType: "widget", widgetType: "counter", elements: [],
    settings: {
      starting_number: 0, ending_number: parseInt(num) || 0,
      suffix, title: label,
      duration: 2000,
      number_color: accent,
      title_color: color,
      typography_number_typography: "custom", typography_number_font_family: font,
      typography_number_font_size: nr.desktop,
      typography_number_font_size_tablet: nr.tablet,
      typography_number_font_size_mobile: nr.mobile,
      typography_title_typography: "custom", typography_title_font_family: bf,
      typography_title_font_size: lr.desktop,
      typography_title_font_size_tablet: lr.tablet,
      typography_title_font_size_mobile: lr.mobile,
    },
  };
};

export const eAccordion = (items, color, accent, font, _bf) => ({
  id: uid(), elType: "widget", widgetType: "accordion", elements: [],
  settings: {
    tabs: items.map(([q, a]) => ({ _id: uid(), tab_title: he(q), tab_content: he(a) })),
    title_color: color,
    icon_color: accent,
    border_color: "rgba(255,255,255,0.08)",
    title_typography_typography: "custom", title_typography_font_family: font,
    title_typography_font_size: { unit: "px", size: 18, sizes: [] },
    title_typography_font_size_mobile: { unit: "px", size: 16, sizes: [] },
  },
});

// Social icons — uses shape "default" (just the icon, no background square)
// This fixes the issue where icon_secondary_color was making icons invisible.
export const eSocial = (links, color, accent) => ({
  id: uid(), elType: "widget", widgetType: "social-icons", elements: [],
  settings: {
    social_icon_list: links.map(l => ({
      _id: uid(),
      social_icon: { value: `fab fa-${l.key}`, library: "fa-brands" },
      link: { url: l.url, is_external: "true", nofollow: "true" },
    })),
    icon_color: "custom",
    icon_primary_color: color,           // icon glyph color
    icon_secondary_color: "transparent", // no background
    hover_primary_color: accent,         // icon turns accent on hover
    hover_secondary_color: "transparent",
    shape: "default",                    // no background shape — just clean icons
    columns: "0",
    icon_size: { unit: "px", size: 18, sizes: [] },
    icon_size_mobile: { unit: "px", size: 16, sizes: [] },
    icon_spacing: { unit: "px", size: 16, sizes: [] },
  },
});

export const eVideo = (url) => ({
  id: uid(), elType: "widget", widgetType: "video", elements: [],
  settings: { video_type: "youtube", youtube_url: url, aspect_ratio: "169" },
});

// Image carousel widget — used for team, portfolio, logo, and gallery carousels.
// Responsive: shows 3 slides on desktop, 2 on tablet, 1 on mobile by default.
// Supports captions, autoplay, navigation arrows, infinite loop.
export const eCarousel = (images, options = {}) => ({
  id: uid(), elType: "widget", widgetType: "image-carousel", elements: [],
  settings: {
    carousel: images.map(img => ({
      id: uid(),
      _id: uid(),
      url: img.url || img,
      alt: img.alt || "",
    })),
    slides_to_show: String(options.slides || 3),
    slides_to_show_tablet: String(options.slidesTablet || 2),
    slides_to_show_mobile: String(options.slidesMobile || 1),
    slides_to_scroll: "1",
    slides_to_scroll_tablet: "1",
    slides_to_scroll_mobile: "1",
    image_stretch: "yes",
    navigation: options.navigation || "both",
    autoplay: options.autoplay !== false ? "yes" : "",
    autoplay_speed: options.speed || 5000,
    infinite: "yes",
    pause_on_hover: "yes",
    speed: 600,
    image_size: "medium_large",
    caption_type: options.captions ? "caption" : "none",
    image_spacing_custom: { unit: "px", size: 20, sizes: [] },
    image_spacing_custom_tablet: { unit: "px", size: 16, sizes: [] },
    image_spacing_custom_mobile: { unit: "px", size: 12, sizes: [] },
    arrows_color: options.color || "#ffffff",
    arrows_size: { unit: "px", size: 24, sizes: [] },
    dots_color: options.accent || "#888888",
    caption_color: options.color || "#ffffff",
    caption_typography_typography: "custom",
    caption_typography_font_family: options.font || "Inter",
    caption_typography_font_size: { unit: "px", size: 13, sizes: [] },
    caption_typography_letter_spacing: { unit: "px", size: 1, sizes: [] },
    caption_typography_text_transform: "uppercase",
    caption_text_align: "center",
  },
});

export const eForm = (title, fields, btn, accent, labelColor, font) => ({
  id: uid(), elType: "widget", widgetType: "form", elements: [],
  settings: {
    form_name: title,
    form_fields: fields.map(f => ({
      _id: uid(),
      custom_id: f.toLowerCase().replace(/\s+/g, "_"),
      field_type: /message|details|notes/i.test(f) ? "textarea" : (/email/i.test(f) ? "email" : "text"),
      field_label: f, placeholder: f,
      required: "true", width: "100",
      rows: /message|details|notes/i.test(f) ? 4 : undefined,
    })),
    button_text: btn,
    button_size: "sm",
    button_width: "", // auto, not full-width
    button_align: "start",
    button_background_color: accent,
    button_text_color: textOn(accent),
    button_typography_typography: "custom",
    button_typography_font_family: font,
    button_typography_font_size: { unit: "px", size: 11, sizes: [] },
    button_typography_letter_spacing: { unit: "px", size: 2, sizes: [] },
    button_typography_text_transform: "uppercase",
    button_typography_font_weight: "600",
    button_padding: { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false },
    button_border_radius: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true },
    // Label and field styling — everything flush left
    label_color: labelColor,
    label_typography_typography: "custom",
    label_typography_font_family: font,
    label_typography_font_size: { unit: "px", size: 10, sizes: [] },
    label_typography_letter_spacing: { unit: "px", size: 1.5, sizes: [] },
    label_typography_text_transform: "uppercase",
    label_typography_font_weight: "700",
    label_spacing: { unit: "px", size: 6, sizes: [] },
    field_text_color: labelColor,
    field_background_color: "transparent",
    field_border_color: isLight(labelColor) ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
    field_border_width: { unit: "px", top: "0", right: "0", bottom: "1", left: "0", isLinked: false },
    field_typography_typography: "custom",
    field_typography_font_family: font,
    field_typography_font_size: { unit: "px", size: 15, sizes: [] },
    field_padding: { unit: "px", top: "12", right: "0", bottom: "12", left: "0", isLinked: false },
    field_border_radius: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true },
    row_gap: { unit: "px", size: 24, sizes: [] },
  },
});

export const eNavMenu = (menu) => ({
  id: uid(), elType: "widget", widgetType: "nav-menu", elements: [],
  settings: { menu, layout: "horizontal", align: "right" },
});

// Shortcode widget — embeds any WordPress shortcode (WPForms, Contact Form 7,
// Gravity Forms, Fluent Forms, Ninja Forms, Formidable, etc.) inside the
// Elementor layout. User creates form in their plugin, pastes shortcode here.
export const eShortcode = (shortcode) => ({
  id: uid(), elType: "widget", widgetType: "shortcode", elements: [],
  settings: { shortcode },
});

// Raw HTML widget — used for marquee, custom embed, anything not in native widgets
export const eHTML = (html) => ({
  id: uid(), elType: "widget", widgetType: "html", elements: [],
  settings: { html },
});

// Marquee — scrolling text bar with CSS animation. Signature agency look
// (VaynerMedia, Superside style). Plays continuously across the section.
export const eMarquee = (text, color, accent, font, bgColor) => {
  const cid = "m" + Math.random().toString(36).slice(2, 9);
  const item = `<span class="${cid}-i">${he(text)}</span><span class="${cid}-d">●</span>`;
  const items = Array(8).fill(item).join("");
  const html = `<style>
.${cid}-wrap { background: ${bgColor}; overflow: hidden; padding: 28px 0; width: 100%; }
.${cid}-track { display: flex; width: max-content; animation: ${cid}-scroll 40s linear infinite; }
.${cid}-i { font-family: '${font}', sans-serif; font-size: clamp(22px, 3.5vw, 44px); font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: ${color}; padding: 0 32px; white-space: nowrap; flex-shrink: 0; }
.${cid}-d { font-size: clamp(22px, 3.5vw, 44px); color: ${accent}; padding: 0 6px; flex-shrink: 0; }
@keyframes ${cid}-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
</style>
<div class="${cid}-wrap"><div class="${cid}-track">${items}${items}</div></div>`;
  return eHTML(html);
};

// ──────────────────────────────────────────────────────────────────────────────
// BUILD ELEMENTOR PAGE JSON
// ──────────────────────────────────────────────────────────────────────────────