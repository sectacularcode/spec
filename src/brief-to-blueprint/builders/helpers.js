// Elementor JSON widget builders
// These are pure functions that return Elementor-compatible JSON objects.
// Every page builder imports from here — do not inline widget construction elsewhere.
//
// Naming convention: mk = "make" — mkContainer, mkHeading, mkText, etc.
// All widgets use Elementor's container/flexbox system (v4.x compatible).

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
    content_width: "boxed",
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
  }
  if (opts.center) {
    s.align_items = "center"; s.align_items_tablet = "center"; s.align_items_mobile = "center";
    s.text_align = "center"; s.text_align_tablet = "center"; s.text_align_mobile = "center";
  }
  if (opts.grow) {
    s._flex_grow = opts.grow;
    s.width_mobile = { unit:"%", size: 100 };
    s.width_tablet = { unit:"%", size: 100 };
  }
  if (direction === "row" && !opts.keepRow) {
    s.flex_direction_tablet = "column"; s.flex_direction_mobile = "column";
    s.align_items_tablet = "flex-start"; s.align_items_mobile = "flex-start";
  }
  if (direction === "row" && opts.buttonRow) {
    s.flex_direction_tablet = "row"; s.flex_direction_mobile = "column";
    s.align_items_mobile = "center"; s.flex_wrap_mobile = "wrap";
  }
  return { id: nid(), elType: "container", isInner: !!opts.isInner, settings: s, elements: children };
}

// Heading widget (h1–h6)
export function mkHeading(text, color, size, opts) {
  opts = opts || {};
  var s = {
    title: text, header_size: size, title_color: color,
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

// Button widget
export function mkButton(label, bgColor, textColor) {
  return { id: nid(), elType: "widget", widgetType: "button", settings: {
    text: label, link: { url: "#" },
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

// Image placeholder (user fills in after import)
export function mkImagePh(caption) {
  return { id: nid(), elType: "widget", widgetType: "image",
    settings: { image: { url:"", id:"" }, caption_source:"custom", caption: caption||"" },
    elements: [] };
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
