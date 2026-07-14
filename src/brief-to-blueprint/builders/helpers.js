// Elementor JSON widget builders
// These are pure functions that return Elementor-compatible JSON objects.
// Every page builder imports from here — do not inline widget construction elsewhere.
//
// Naming convention: mk = "make" — mkContainer, mkHeading, mkText, etc.
// All widgets use Elementor's container/flexbox system (v4.x compatible).

import { he } from "../utils/htmlEscape.js";

// Generates a random Elementor widget ID (7-char hex)
export function nid() { return Math.random().toString(16).slice(2, 9); }

// Generates responsive padding settings (desktop / laptop / tablet / mobile).
// Elementor treats "laptop" as its own breakpoint on many desktop widths and
// applies default padding when we don't override it — CS Repair's confirmed
// production template sets padding_laptop explicitly on every top-level row,
// so we mirror that here to prevent unwanted vertical space leaking between
// stacked feature rows.
function rPad(padY, padX) {
  padX = padX || "40";
  var y = parseInt(padY); var x = parseInt(padX);
  // Responsive scaling now mirrors the preview's clamp() rhythm (0.85 / 0.75 /
  // 0.6 of the desktop pad). The prior 0.7 / 0.55 factors were the source of
  // the "everything looks squeezed on tablet" gap between preview and export.
  var yl = Math.round(y * 0.85);
  var yt = Math.max(48, Math.round(y * 0.75)); var ym = Math.max(40, Math.round(y * 0.6));
  var xt = Math.min(parseInt(padX), 40);
  return {
    padding:        { unit:"px", top:String(y),  right:String(x),  bottom:String(y),  left:String(x),  isLinked:false },
    padding_laptop: { unit:"px", top:String(yl), right:String(x),  bottom:String(yl), left:String(x),  isLinked:false },
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
  var isBoxed = !opts.full;
  var s = {
    content_width: isBoxed ? "boxed" : "full",
    flex_direction: direction,
    flex_gap: { unit:"px", size: opts.gap||"20", column: opts.gap||"20", row: opts.gap||"20" },
    flex_gap_mobile: { unit:"px", size: "16", column: "16", row: "16" },
  };
  // boxed_width caps the content at the preview's actual max-width. Verified
  // key against Elementor's container.php (`boxed_width`, only read when
  // content_width === "boxed"). The preview's outer sections all sit inside
  // max-width:1100–1160px containers; without this, the export rendered every
  // section edge-to-edge on wide viewports and text sprawled across the row.
  // Inner containers (opts.isInner) never get boxed_width — they're already
  // constrained by the parent section and their own width:% setting.
  if (isBoxed && !opts.isInner) {
    var mw = opts.maxWidth || 1160;
    s.boxed_width = { unit: "px", size: mw };
    s.boxed_width_tablet = { unit: "%", size: 100 };
    s.boxed_width_mobile = { unit: "%", size: 100 };
  }
  Object.assign(s, rPad(opts.padY || "88", opts.padX || "40"));
  // Explicit zero margin at every breakpoint — matches CS Repair's confirmed
  // production template, prevents unwanted vertical space leaking between
  // stacked top-level rows on desktop/laptop breakpoints.
  s.margin = { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true };
  if (bg) { s.background_background = "classic"; s.background_color = bg; }
  if (opts.minH) {
    s.min_height = { unit:"vh", size: opts.minH };
    s.min_height_tablet = { unit:"vh", size: Math.round(opts.minH * 0.75) };
    s.min_height_mobile = { unit:"px", size: 480 };
    // flex_justify_content is the confirmed-correct key (verified against
    // real production Elementor exports) — no longer hedging with the
    // unprefixed justify_content, which was an earlier guess.
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
    // flex_align_items is the cross-axis; for a row-direction container the
    // cross-axis is vertical, so it never centered a button row horizontally.
    // Confirmed real bug, July 2026: every button row needed manual
    // re-centering after import. flex_justify_content (main axis) is what
    // actually centers row children horizontally.
    if (direction === "row") {
      s.flex_justify_content = "center"; s.flex_justify_content_tablet = "center"; s.flex_justify_content_mobile = "center";
    }
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
    // The preview renders in Inter (buildPreviewHTML's body rule). Custom
    // typography without a family inherits the WordPress kit's font on
    // import, so headings stopped matching the approved preview. Explicit
    // opts.font still wins.
    s.typography_font_family = opts.font || "Inter";
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
    // Inter to match the preview's body font — see mkHeading note above.
    typography_font_family: "Inter",
    typography_font_size: { unit:"px", size: 17 }, typography_font_size_tablet: { unit:"px", size: 16 }, typography_font_size_mobile: { unit:"px", size: 15 },
    typography_line_height: { unit:"em", size: 1.65 }, typography_line_height_tablet: { unit:"em", size: 1.6 }, typography_line_height_mobile: { unit:"em", size: 1.55 },
  };
  if (align === "center") { s.text_align = "center"; s.text_align_tablet = "center"; s.text_align_mobile = "left"; }
  return { id: nid(), elType: "widget", widgetType: "text-editor", settings: s, elements: [] };
}

// Button widget. `label` is always plain copy — safe to escape unconditionally.
export function mkButton(label, bgColor, textColor, url) {
  return { id: nid(), elType: "widget", widgetType: "button", settings: {
    text: he(label), link: { url: url || "#" },
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
// `caption` is accepted for backward compatibility with existing call
// sites but no longer rendered — confirmed real complaint, July 2026: the
// placeholder box alone is enough signal for where a photo goes; the
// caption text badge was getting manually deleted after every import.
export function mkImageBg(caption, opts) {
  opts = opts || {};
  var width = opts.width;
  var minHeight = opts.minHeight;
  var passThrough = Object.assign({}, opts);
  delete passThrough.width;
  delete passThrough.minHeight;
  delete passThrough.bg;
  // opts.bg lets callers override (the landing pages pass their preview's
  // accent tint). Default is #E0DDD7 — the exact image-placeholder color
  // every page preview in buildPreviewHTML.js uses. The old #DDE0E6 default
  // was a transposed near-miss that never matched any preview.
  var box = mkContainer([], opts.bg || "#E0DDD7", Object.assign({
    isInner: true, full: true, padY: "0", padX: "0",
  }, passThrough));
  box.settings.background_image = { url: "", id: "" };
  box.settings.background_position = "center center";
  box.settings.background_size = "150%";
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

// Native Elementor icon-list widget (check-mark bullet list). Shared across
// page builders. For a side-by-side split, wrap this in an isInner
// mkContainer with `width` set rather than sizing the widget itself —
// icon-list's own width setting wasn't reliably respected inside a flex
// row (confirmed real bug, July 2026: items shrank to their natural
// content width, leaving dead space beside them instead of filling the
// intended column).
export function mkIconList(items, accent, textColor, opts) {
  opts = opts || {};
  var fontSize = opts.fontSize || 15;
  var s = {
    icon_list: items.map(function(item) {
      return {
        text: he(item),
        selected_icon: { value: "far fa-check-circle", library: "fa-regular" },
        _id: nid().slice(0, 7),
      };
    }),
    icon_color: accent,
    text_color: textColor,
    space_between: { unit: "px", size: opts.spaceBetween || 14 },
    icon_size: { unit: "px", size: opts.iconSize || 16 },
    typography_typography: "custom",
    typography_font_family: "Inter", // matches the preview's body font — see mkHeading note
    typography_font_size: { unit: "px", size: fontSize },
    typography_font_size_tablet: { unit: "px", size: fontSize },
    typography_font_size_mobile: { unit: "px", size: Math.max(13, fontSize - 1) },
  };
  return { id: nid(), elType: "widget", widgetType: "icon-list", settings: s, elements: [] };
}

// Native Elementor Pro Form widget. Field types are inferred from the label
// text (email/phone/message) so briefs that just list field names in plain
// English ("Name", "Email", "Message") still get sensible input types.
// NOTE: form_fields sub-keys (field_type, field_label, placeholder,
// required, width, field_id) are Elementor's documented, stable Form-widget
// field schema. `required` is deliberately left unset on every field here —
// whoever imports the template sets that per-field in the Elementor editor
// rather than us guessing which fields a given client wants to force.
export function mkForm(fields, ctaLabel, opts) {
  opts = opts || {};
  var formFields = fields.map(function(label, i) {
    var lower = String(label).toLowerCase();
    var type = "text";
    if (lower.indexOf("email") !== -1) type = "email";
    else if (lower.indexOf("phone") !== -1) type = "tel";
    else if (lower.indexOf("message") !== -1 || lower.indexOf("comment") !== -1 || lower.indexOf("detail") !== -1) type = "textarea";
    return {
      _id: nid().slice(0, 7),
      field_type: type,
      field_label: he(label),
      placeholder: "",
      required: "",
      width: "100",
      field_id: "field_" + i,
    };
  });
  return {
    id: nid(), elType: "widget", widgetType: "form",
    settings: {
      form_name: he(opts.formName || "Lead Form"),
      form_fields: formFields,
      button_text: he(ctaLabel || "Submit"),
    },
    elements: [],
  };
}

// Native Elementor Accordion widget (core, not Pro) — confirmed via
// elementor.com/help/accordion-widget/: each item has a Title and Content
// field. Field key names (tab_title/tab_content) follow Elementor's Tabs
// widget naming convention, which the Accordion widget shares. Icon colors
// and active/hover state styling aren't set here (those style-tab keys
// aren't confirmed) — do one style pass in the Elementor editor after
// import if the open/closed icon colors need to match brand exactly.
// Color/border opts use Elementor's real accordion.php control names
// (title_color / tab_active_color / icon_color / icon_active_color /
// content_color / border_color). Without them the imported accordion took
// the WordPress theme's defaults and stopped matching the preview's FAQ.
export function mkAccordion(items, opts) {
  opts = opts || {};
  var s = {
    tabs: items.map(function(item) {
      return {
        _id: nid().slice(0, 7),
        tab_title: he(item.question),
        tab_content: he(item.answer),
      };
    }),
    selected_icon: { value: "fas fa-plus", library: "fa-solid" },
    selected_active_icon: { value: "fas fa-minus", library: "fa-solid" },
  };
  if (opts.titleColor)   s.title_color = opts.titleColor;
  if (opts.activeColor)  s.tab_active_color = opts.activeColor;
  if (opts.iconColor)    { s.icon_color = opts.iconColor; s.icon_active_color = opts.iconColor; }
  if (opts.contentColor) s.content_color = opts.contentColor;
  if (opts.borderColor)  s.border_color = opts.borderColor;
  return { id: nid(), elType: "widget", widgetType: "accordion", settings: s, elements: [] };
}
// "testimonial-carousel" schema — verified against Elementor Pro's actual
// widget source (modules/carousel/widgets/testimonial-carousel.php plus the
// carousel base.php it extends), July 2026, after the original guessed
// schema shipped and a real WordPress import rendered Elementor's built-in
// "Lorem ipsum / John Doe / CEO" default slides instead of the real quotes.
// The repeater key is `slides` (per-slide fields: content/name/title) — the
// old `testimonials` key with testimonial_* fields is silently ignored by
// Elementor, which then falls back to the widget's own defaults. Same for
// the additional options: the real keys are show_arrows and pagination
// ("bullets"/"fraction"/"progressbar"/""), not arrows/dots.
export function mkTestimonialCarousel(testimonials, opts) {
  opts = opts || {};
  return {
    id: nid(), elType: "widget", widgetType: "testimonial-carousel",
    settings: {
      slides: testimonials.map(function(t) {
        return {
          _id: nid().slice(0, 7),
          content: he(t.quote),
          name: he(t.name),
          title: he(t.title),
        };
      }),
      content_color: opts.textColor || "#FFFFFF",
      name_color: opts.nameColor || "#FFFFFF",
      title_color: opts.jobColor || "rgba(255,255,255,0.7)",
      // Italic quote at 21px in Inter — the preview's testimonial styling,
      // so the imported page reads the same as what was approved on screen.
      content_typography_typography: "custom",
      content_typography_font_family: "Inter",
      content_typography_font_style: "italic",
      content_typography_font_size: { unit: "px", size: 21 },
      // Dots only, no arrows — matches the preview's clean quote block.
      show_arrows: "",
      pagination: "bullets",
      autoplay: "yes",
      pause_on_hover: "yes",
      loop: "yes",
    },
    elements: [],
  };
}

// Restricts a URL to safe schemes before it's used as a link href. Content
// arriving from an external source (e.g. a Manifest export) is untrusted
// input — a URL-shaped field could carry a javascript: URI or a
// protocol-relative link pointing at attacker-controlled infrastructure.
// Falls back to "#" for anything outside the allowlist, matching the
// no-link default every button already uses.
var SAFE_URL_PATTERN = /^(https?:|tel:|mailto:|#|\/(?!\/))/i;
export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "#";
  var trimmed = url.trim();
  return SAFE_URL_PATTERN.test(trimmed) ? trimmed : "#";
}

// Map/location section — address text plus an optional "Get Directions"
// button linking out to a supplied Google Maps URL. Not an embedded map
// widget (no API key assumed on Spec's side) — a styled content block that
// matches the rest of the page. Renders only where the caller has a real
// address or map link; presence-checking is the caller's job (see
// makeMapSection() in landing.js).
// Native Elementor "google_maps" widget (Elementor core, not Pro) — a real
// embedded, interactive map, not a placeholder. Settings shape confirmed
// against a real, working exported widget (AFS Saginaw page, July 2026):
// just `address` (any string Google Maps can resolve) and `height`. No
// API key required for this native widget the way some premium map addons
// need one. Returns null if no address is available — callers should
// treat that as "nothing to render here," never guess an address to fill
// the gap.
export function mkGoogleMapsWidget(address, opts) {
  if (!address) return null;
  opts = opts || {};
  return {
    id: nid(), elType: "widget", widgetType: "google_maps",
    settings: {
      address: address,
      height: { unit: "px", size: opts.height || 400, sizes: [] },
    },
    elements: [],
    isInner: !!opts.isInner,
  };
}

// mode: "pin" (default) is a real storefront -- address, an embedded pin,
// and a "Get Directions" route. "service_area" (manifest.page-document/1,
// 1.2.0) is a mobile/no-storefront business -- per that spec's own words,
// "show coverage, not a storefront pin," so this skips the pinned embed
// entirely and reframes the address as a base of operations rather than a
// destination. opts.heading/opts.buttonLabel always win when supplied
// (Manifest's own copy) -- the mode-based defaults below only fill in when
// the caller has nothing more specific, same as every other builder default
// in this file.
export function mkMapSection(address, mapUrl, colors, opts) {
  opts = opts || {};
  colors = colors || {};
  var mode = opts.mode === "service_area" ? "service_area" : "pin";
  var ink = colors.ink || colors.text || "#1A1A1A";
  var accent = colors.brass || colors.accent || "#C2A35B";
  var bone = colors.bone || colors.background || "#F2F2F2";
  var stone = colors.stone || colors.muted || "#666666";
  // Optional real button colors from the caller (a defined Style Guide
  // button) -- falls back to the same accent/#FFFFFF pairing this always
  // used when not supplied, so any future caller that doesn't pass this
  // still gets identical behavior to before.
  var btnColors = opts.buttonColors || {};
  var mapBtnBg = btnColors.background || accent;
  var mapBtnText = btnColors.textColor || "#FFFFFF";
  var heading = opts.heading || (mode === "service_area" ? "Areas We Serve" : "Find Us");
  var children = [
    mkHeading(heading, ink, "h2", { weight: 700, px: 32, align: opts.center ? "center" : "left" }),
    mkSpacer(16),
  ];
  // Address/Phone/Hours info strip -- matches the pattern already proven in
  // location.js's mkInfoBlock. Built whenever real phone or hours copy is
  // available alongside the address; falls back to the original plain
  // address line otherwise, so a brief without this data renders exactly
  // as it always has.
  if (address && (opts.phone || opts.hours)) {
    var infoCols = [mkContainer([
      mkHeading("Address", stone, "h6", { eyebrow: true }),
      mkSpacer(8),
      mkText(he(address), ink),
    ], null, { isInner: true, padY: "0", grow: "1" })];
    if (opts.phone) {
      infoCols.push(mkContainer([
        mkHeading("Phone", stone, "h6", { eyebrow: true }),
        mkSpacer(8),
        mkText("<a href=\"tel:" + he(String(opts.phone).replace(/\D/g, "")) + "\" style=\"color:inherit;text-decoration:none;font-weight:600;\">" + he(opts.phone) + "</a>", ink),
      ], null, { isInner: true, padY: "0", grow: "1" }));
    }
    if (opts.hours) {
      infoCols.push(mkContainer([
        mkHeading("Hours", stone, "h6", { eyebrow: true }),
        mkSpacer(8),
        mkText(he(opts.hours), ink),
      ], null, { isInner: true, padY: "0", grow: "1" }));
    }
    var infoRow = mkContainer(infoCols, null, { direction: "row", gap: "40", padY: "0", isInner: true });
    infoRow.settings.flex_wrap = "wrap";
    children.push(infoRow);
    children.push(mkSpacer(28));
  } else if (address) {
    var addressLine = mode === "service_area"
      ? (opts.coverageText || ("Based in " + address + " -- serving the surrounding area."))
      : address;
    children.push(mkText("<p" + (opts.center ? " style='text-align:center'" : "") + ">" + he(addressLine) + "</p>", ink));
  }
  if (mode === "pin" && address) {
    children.push(mkSpacer(20));
    var mapWidget = mkGoogleMapsWidget(address, { height: opts.mapHeight || 400 });
    if (mapWidget) children.push(mapWidget);
  }
  // Button row -- Call Now alongside Get Directions/Check Your Area when a
  // real phone number is known, instead of directions being the only CTA.
  var mapButtons = [];
  if (opts.phone) {
    var callBtn = mkButton("Call " + opts.phone, mapBtnBg, mapBtnText);
    callBtn.settings.link = { url: sanitizeUrl("tel:" + String(opts.phone).replace(/\D/g, "")) };
    mapButtons.push(callBtn);
  }
  if (mapUrl) {
    var btnLabel = opts.buttonLabel || (mode === "service_area" ? "Check Your Area" : "Get Directions");
    var btn = mkButton(btnLabel, mapBtnBg, mapBtnText);
    btn.settings.link = { url: sanitizeUrl(mapUrl), is_external: "true" };
    mapButtons.push(btn);
  }
  if (mapButtons.length) {
    children.push(mkSpacer(20));
    children.push(mapButtons.length > 1
      ? mkContainer(mapButtons, null, { isInner: true, direction: "row", buttonRow: true, gap: "16", padY: "0", padX: "0", center: true })
      : mapButtons[0]);
  }
  return mkContainer(children, bone, { padY: opts.padY || "60", center: !!opts.center });
}
