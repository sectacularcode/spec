// Elementor JSON widget builders
// These are pure functions that return Elementor-compatible JSON objects.
// Every page builder imports from here — do not inline widget construction elsewhere.
//
// Naming convention: mk = "make" — mkContainer, mkHeading, mkText, etc.
// All widgets use Elementor's container/flexbox system (v4.x compatible).

import { he } from "../utils/htmlEscape.js";

// Generates a random Elementor widget ID (7-char hex)
export function nid() { return Math.random().toString(16).slice(2, 9); }

// Generates responsive padding settings (desktop / tablet / mobile)
function rPad(padY, padX) {
  padX = padX || "40";
  var y = parseInt(padY); var x = parseInt(padX);
  var yt = Math.round(y * 0.7); var ym = Math.round(y * 0.55);
  var xt = Math.min(parseInt(padX), 32);
  return {
    padding:        { unit:"px", top:String(y),  right:String(x),  bottom:String(y),  left:String(x),  isLinked:false },
    padding_tablet: { unit:"px", top:String(yt), right:String(xt), bottom:String(yt), left:String(xt), isLinked:false },
    padding_mobile: { unit:"px", top:String(ym), right:"20",       bottom:String(ym), left:"20",        isLinked:false },
  };
}

// Generates responsive font size settings
function rFont(px) {
  if (!px) return {};
  var t = Math.max(16, Math.round(px * 0.68));
  var m = Math.max(16, Math.round(px * 0.50));
  return {
    typography_font_size:        { unit:"px", size: px },
    typography_font_size_tablet: { unit:"px", size: t  },
    typography_font_size_mobile: { unit:"px", size: m  },
    typography_line_height:        { unit:"em", size: 1.1 },
    typography_line_height_tablet: { unit:"em", size: 1.15 },
    typography_line_height_mobile: { unit:"em", size: 1.2 },
  };
}

// Flexbox container (section or inner column)
export function mkContainer(children, bg, opts) {
  opts = opts || {};
  var direction = opts.direction || "column";
  var s = {
    content_width: opts.full ? "full" : "boxed",
    flex_direction: direction,
    flex_gap: { unit:"px", size: opts.gap||"20", column: opts.gap||"20", row: opts.gap||"20" },
    flex_gap_mobile: { unit:"px", size: "16", column: "16", row: "16" },
  };
  Object.assign(s, rPad(opts.padY || "80", opts.padX || "40"));
  if (bg) { s.background_background = "classic"; s.background_color = bg; }
  if (opts.minH) {
    s.min_height = { unit:"vh", size: opts.minH };
    s.min_height_tablet = { unit:"vh", size: Math.round(opts.minH * 0.75) };
    s.min_height_mobile = { unit:"px", size: 480 };
    s.justify_content = "center";
    s.justify_content_tablet = "center";
    s.justify_content_mobile = "center";
    s.flex_justify_content = "center";
    s.flex_justify_content_tablet = "center";
    s.flex_justify_content_mobile = "center";
  }
  if (direction === "row" && !opts.keepRow) {
    // Elementor's actual settings key for cross-axis alignment on a flex
    // container is `flex_align_items` (not `align_items`, which Elementor
    // silently ignores). Default to stretch so side-by-side columns —
    // e.g. an image column next to a text column — match height instead
    // of the image floating at its natural size inside a taller row.
    s.flex_align_items = "stretch";
    s.flex_direction_tablet = "column"; s.flex_direction_mobile = "column";
    s.flex_align_items_tablet = "flex-start"; s.flex_align_items_mobile = "flex-start";
  }
  if (direction === "row" && opts.buttonRow) {
    s.flex_direction_tablet = "row"; s.flex_direction_mobile = "column";
    s.flex_align_items_mobile = "center"; s.flex_wrap_mobile = "wrap";
  }
  if (opts.center) {
    s.flex_align_items = "center"; s.flex_align_items_tablet = "center"; s.flex_align_items_mobile = "center";
    s.text_align = "center"; s.text_align_tablet = "center"; s.text_align_mobile = "center";
  }
  if (opts.grow) {
    s._flex_grow = opts.grow;
    s.width_mobile = { unit:"%", size: 100 };
    s.width_tablet = { unit:"%", size: 100 };
  }
  if (opts.width) {
    s.width = { unit: "%", size: opts.width };
    s.width_tablet = { unit: "%", size: 100 };
    s.width_mobile = { unit: "%", size: 100 };
  }
  return { id: nid(), elType: "container", isInner: !!opts.isInner, settings: s, elements: children };
}

// Heading widget (h1–h6). `text` is always plain copy (no caller embeds real
// tags here) so it's safe — and correct — to escape unconditionally.
export function mkHeading(text, color, size, opts) {
  opts = opts || {};
  var s = {
    title: he(text), header_size: size, title_color: color,
    align: opts.align || "left", align_tablet: opts.align || "left",
    align_mobile: opts.align === "center" ? "center" : "left",
  };
  if (opts.eyebrow) {
    s.typography_typography = "custom"; s.typography_font_family = "Inter";
    s.typography_font_weight = "600"; s.typography_text_transform = "uppercase";
    s.typography_letter_spacing = { unit:"px", size: 2.5 };
    s.typography_letter_spacing_mobile = { unit:"px", size: 2 };
    s.typography_font_size = { unit:"px", size: 12 };
    s.typography_font_size_tablet = { unit:"px", size: 11 };
    s.typography_font_size_mobile = { unit:"px", size: 10 };
  } else if (opts.font || opts.weight || opts.px || opts.italic) {
    s.typography_typography = "custom";
    if (opts.font)   s.typography_font_family = opts.font;
    if (opts.weight) s.typography_font_weight = String(opts.weight);
    if (opts.italic) s.typography_font_style = "italic";
    Object.assign(s, rFont(opts.px));
  }
  return { id: nid(), elType: "widget", widgetType: "heading", settings: s, elements: [] };
}

// Rich text / paragraph widget
export function mkText(html, color, align) {
  align = align || "left";
  var s = {
    editor: "<p>" + html + "</p>", text_color: color,
    typography_typography: "custom",
    typography_font_size: { unit:"px", size: 17 }, typography_font_size_tablet: { unit:"px", size: 16 }, typography_font_size_mobile: { unit:"px", size: 15 },
    typography_line_height: { unit:"em", size: 1.65 }, typography_line_height_tablet: { unit:"em", size: 1.6 }, typography_line_height_mobile: { unit:"em", size: 1.55 },
  };
  if (align === "center") { s.text_align = "center"; s.text_align_tablet = "center"; s.text_align_mobile = "left"; }
  return { id: nid(), elType: "widget", widgetType: "text-editor", settings: s, elements: [] };
}

// Button widget. `label` is always plain copy — safe to escape unconditionally.
export function mkButton(label, bgColor, textColor) {
  return { id: nid(), elType: "widget", widgetType: "button", settings: {
    text: he(label), link: { url: "#" },
    background_color: bgColor, button_text_color: textColor,
    border_radius: { unit:"px", top:"2", right:"2", bottom:"2", left:"2", isLinked:true },
    typography_typography: "custom", typography_font_family: "Inter",
    typography_font_weight: "600", typography_text_transform: "uppercase",
    typography_letter_spacing: { unit:"px", size: 1.5 },
    typography_font_size: { unit:"px", size: 13 }, typography_font_size_tablet: { unit:"px", size: 13 }, typography_font_size_mobile: { unit:"px", size: 13 },
    padding:        { unit:"px", top:"16", right:"32", bottom:"16", left:"32", isLinked:false },
    padding_tablet: { unit:"px", top:"14", right:"28", bottom:"14", left:"28", isLinked:false },
    padding_mobile: { unit:"px", top:"14", right:"24", bottom:"14", left:"24", isLinked:false },
  }, elements: [] };
}

// Image placeholder (user fills in after import) — Option B: a container
// with a background image instead of an Image widget. background_image /
// background_position / background_size are confirmed-working keys — and as
// of this version, confirmed against a real production Elementor export
// (CS Repair's own site), which uses this exact pattern: a fixed-percentage
// `width` on each column (not flex-grow) and NO explicit height on the
// image side at all — it just relies on the browser's default flex stretch
// behavior to match the text column's natural content height. That's what
// this now does too, instead of the earlier flex-grow + fixed-min-height
// approach. Size is set beyond 100% (150%, single-value so aspect ratio is
// preserved) rather than plain "cover" — CS Repair's own template actually
// uses plain "cover" and gets its tight look purely from photo choice, but
// this zooms in further by default regardless of the uploaded photo's own
// composition, since not every photo will be a tight close-up.
// `opts.width` (0-100) sets a fixed column width instead of flex-grow, for
// side-by-side split layouts. `opts.minHeight` sets an explicit height in
// px for standalone cards/grids where there's no sibling content to stretch
// against. `caption` is plain text — safe to escape unconditionally.
export function mkImageBg(caption, opts) {
  opts = opts || {};
  var width = opts.width;
  var minHeight = opts.minHeight;
  var passThrough = Object.assign({}, opts);
  delete passThrough.width;
  delete passThrough.minHeight;
  var captionBadge = {
    id: nid(), elType: "widget", widgetType: "text-editor",
    settings: {
      editor: "<p>" + he(caption || "") + "</p>",
      text_color: "#6B635C",
      typography_typography: "custom",
      typography_font_size: { unit: "px", size: 13 },
      typography_font_style: "italic",
      text_align: "center",
      background_background: "classic",
      background_color: "#FFFFFFDD",
      padding: { unit: "px", top: "6", right: "14", bottom: "6", left: "14", isLinked: false },
      border_radius: { unit: "px", top: "4", right: "4", bottom: "4", left: "4", isLinked: true },
    },
    elements: [],
  };
  var box = mkContainer([captionBadge], "#DDE0E6", Object.assign({
    isInner: true, full: true, padY: "0", padX: "0",
  }, passThrough));
  box.settings.background_image = { url: "", id: "" };
  box.settings.background_position = "center center";
  box.settings.background_size = "150%";
  // Badge sits bottom-center: flex_justify_content is the main axis (vertical,
  // since this box is column-direction) and flex_align_items is the cross
  // axis (horizontal).
  box.settings.flex_justify_content = "flex-end";
  box.settings.flex_align_items = "center";
  if (width) {
    box.settings.width = { unit: "%", size: width };
    box.settings.width_tablet = { unit: "%", size: 100 };
  }
  if (minHeight) {
    box.settings.min_height = { unit: "px", size: minHeight };
    box.settings.min_height_tablet = { unit: "px", size: Math.round(minHeight * 0.85) };
    box.settings.min_height_mobile = { unit: "px", size: Math.round(minHeight * 0.7) };
  } else {
    // No desktop height (matches production reference) — just sane
    // tablet/mobile fallbacks so the placeholder isn't invisible before
    // the row's own content gives it a real height to stretch to.
    box.settings.min_height_tablet = { unit: "px", size: 400 };
    box.settings.min_height_mobile = { unit: "px", size: 220 };
  }
  return box;
}

// Vertical spacer
export function mkSpacer(px) {
  return { id: nid(), elType: "widget", widgetType: "spacer", settings: {
    space:        { unit:"px", size: px },
    space_tablet: { unit:"px", size: Math.round(px * 0.7) },
    space_mobile: { unit:"px", size: Math.round(px * 0.5) },
  }, elements: [] };
}

// Horizontal divider line
export function mkDivider(color) {
  return { id: nid(), elType: "widget", widgetType: "divider",
    settings: { color: color || "#E2DBCC", weight: { unit:"px", size: 1 } },
    elements: [] };
}
