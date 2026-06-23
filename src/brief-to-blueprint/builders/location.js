// Location page builder
// Variant A: Content-heavy / SEO-first (modeled on Epika Fleet pattern)
//   Full hero, intro paragraph, services checklist, address/info block,
//   supporting body section, map embed placeholder, CTA form.
// Variant B: Conversion-first (modeled on Fleet Mobile Maintenance pattern)
//   Hero with address/hours baked in below it, compact service list,
//   map embed, short CTA. Fewer words, faster to the point.
//
// Location data is passed in via brief.locationData (single) or brief itself
// when called from the bulk generator. Fields:
//   locationName, city, state, address, phone, hours,
//   headline, services (array of strings), mapEmbed (HTML string), ctaText

import { nid, rPad, rFont, mkContainer, mkHeading, mkText, mkButton, mkImagePh, mkSpacer, mkDivider } from "./helpers.js";

function getColors(colors) {
  return {
    ink:       colors.ink        || "#1C1A17",
    bone:      colors.bone       || "#EDE7DB",
    brass:     colors.brass      || "#C2A35B",
    brassDp:   colors["brass-deep"] || "#9C7E3A",
    warmWhite: colors["warm-white"] || "#FBFAF7",
    text:      colors.text       || "#2A2722",
    stone:     colors.stone      || "#8A8170",
    asphalt:   colors.asphalt    || "#2B2823",
  };
}

function mkMapEmbed(mapEmbed, stone) {
  // If a real embed code was provided, wrap it in an HTML widget shell.
  // Otherwise output a placeholder container.
  if (mapEmbed && mapEmbed.trim()) {
    return {
      id: nid(), elType: "widget", widgetType: "html",
      settings: { html: mapEmbed },
      elements: [],
    };
  }
  // Placeholder block
  return mkContainer([
    mkHeading("[ Map — paste Google Maps embed in Elementor HTML widget ]", stone, "h6", { eyebrow: true }),
  ], "#e8e8e8", { padY: "40", center: true });
}

function mkServicesList(services, text, brass) {
  var items = (Array.isArray(services) && services.length > 0)
    ? services
    : ["[Service 1]", "[Service 2]", "[Service 3]", "[Service 4]"];
  var html = "<ul style=\"margin:0;padding:0;list-style:none;\">" +
    items.map(function(s) {
      return "<li style=\"padding:8px 0 8px 28px;position:relative;border-bottom:1px solid rgba(0,0,0,0.07);\">" +
        "<span style=\"position:absolute;left:0;top:10px;display:inline-block;width:12px;height:2px;background:" + brass + ";\"></span>" +
        s + "</li>";
    }).join("") +
    "</ul>";
  return mkText(html, text);
}

function mkInfoBlock(loc, ink, stone, bone) {
  var name    = loc.locationName || "[Location Name]";
  var address = loc.address       || "[Street Address]";
  var city    = loc.city          || "[City]";
  var state   = loc.state         || "[State]";
  var phone   = loc.phone         || "[Phone Number]";
  var hours   = loc.hours         || "[Hours]";

  var addrCol = mkContainer([
    mkHeading("Address", stone, "h6", { eyebrow: true }),
    mkSpacer(8),
    mkText(address + "<br>" + city + ", " + state, ink),
  ], null, { padY: "0", grow: 1, isInner: true });

  var phoneCol = mkContainer([
    mkHeading("Phone", stone, "h6", { eyebrow: true }),
    mkSpacer(8),
    mkText("<a href=\"tel:" + phone.replace(/\D/g, "") + "\" style=\"color:inherit;text-decoration:none;font-weight:600;\">" + phone + "</a>", ink),
  ], null, { padY: "0", grow: 1, isInner: true });

  var hoursCol = mkContainer([
    mkHeading("Hours", stone, "h6", { eyebrow: true }),
    mkSpacer(8),
    mkText(hours, ink),
  ], null, { padY: "0", grow: 1, isInner: true });

  var row = mkContainer([addrCol, phoneCol, hoursCol], null, {
    direction: "row", gap: "40", padY: "0", isInner: true,
  });
  row.settings.flex_wrap = "wrap";

  return mkContainer([row], bone, { padY: "40" });
}

// ── Variant A: Content-heavy / SEO ────────────────────────────────────────────
export function buildLocationPageA(colors, brief, loc) {
  var C = getColors(colors);
  var loc = loc || brief.locationData || {};

  var locationName = loc.locationName || "[Location Name]";
  var city         = loc.city         || "[City]";
  var state        = loc.state        || "[State]";
  var brandName    = brief.brandName  || "[Brand Name]";
  var headline     = loc.headline     || (brandName + " in " + city + ", " + state);
  var intro        = loc.intro        || ("When you need fast, reliable service in " + city + ", " + state + ", our team is ready. " + brandName + " provides " + city + " with the same quality and standards our customers expect.");
  var ctaText      = loc.ctaText      || brief.headerCta || "Request service";
  var services     = loc.services     || [];
  var supportBody  = loc.supportBody  || ("Our " + city + " location is staffed by certified technicians who understand the local market. We take pride in keeping your operations running — no unnecessary delays, no guesswork.");

  var sections = [];

  // Hero — full-width, dark, city + service in H1
  sections.push(mkContainer([
    mkHeading(brandName, C.brass, "h6", { eyebrow: true }),
    mkSpacer(24),
    mkHeading(headline, C.warmWhite, "h1", { weight: 800, px: 56 }),
    mkSpacer(20),
    mkText(city + ", " + state, C.stone),
    mkSpacer(32),
    mkButton(ctaText, C.brassDp, "#ffffff"),
  ], C.ink, { padY: "80", center: false }));

  // Address / phone / hours info strip
  sections.push(mkInfoBlock(loc, C.ink, C.stone, C.bone));

  // Intro paragraph
  sections.push(mkContainer([
    mkHeading("Service in " + city + " You Can Count On", C.ink, "h2", { weight: 700, px: 40 }),
    mkSpacer(20),
    mkText(intro, C.text),
  ], C.bone, { padY: "60" }));

  // Services checklist
  sections.push(mkContainer([
    mkHeading("Services We Offer in " + city + ", " + state, C.ink, "h2", { weight: 700, px: 36 }),
    mkSpacer(8),
    mkText("Our " + city + " team handles all of the following:", C.stone),
    mkSpacer(20),
    mkServicesList(services, C.text, C.brass),
  ], C.warmWhite, { padY: "60" }));

  // Supporting body + image split
  var supportText = mkContainer([
    mkHeading("What to Expect from Our " + city + " Team", C.ink, "h3", { weight: 700, px: 32 }),
    mkSpacer(16),
    mkText(supportBody, C.text),
    mkSpacer(24),
    mkButton(ctaText, C.brassDp, "#ffffff"),
  ], null, { padY: "0", grow: 1, isInner: true });

  var supportImg = mkContainer([
    mkImagePh(city + " location photo"),
  ], null, { padY: "0", grow: 1, isInner: true });

  var supportRow = mkContainer([supportText, supportImg], null, {
    direction: "row", gap: "48", padY: "0", isInner: true,
  });
  sections.push(mkContainer([supportRow], C.bone, { padY: "60" }));

  // Map embed
  sections.push(mkContainer([
    mkHeading("Find Us in " + city, C.ink, "h3", { weight: 700, px: 28 }),
    mkSpacer(16),
    mkMapEmbed(loc.mapEmbed, C.stone),
    mkSpacer(8),
    mkText(loc.address + " · " + city + ", " + state, C.stone),
  ], C.warmWhite, { padY: "60" }));

  // Closing CTA
  sections.push(mkContainer([
    mkHeading("Ready to get started in " + city + "?", C.warmWhite, "h2", { weight: 700, px: 40, align: "center" }),
    mkSpacer(24),
    mkButton(ctaText, C.brassDp, "#ffffff"),
  ], C.asphalt, { padY: "80", center: true }));

  return {
    version: "0.4",
    title: brandName + " — " + city + ", " + state,
    type: "page",
    page_settings: {},
    content: sections,
  };
}

// ── Variant B: Conversion-first ───────────────────────────────────────────────
export function buildLocationPageB(colors, brief, loc) {
  var C = getColors(colors);
  var loc = loc || brief.locationData || {};

  var locationName = loc.locationName || "[Location Name]";
  var city         = loc.city         || "[City]";
  var state        = loc.state        || "[State]";
  var brandName    = brief.brandName  || "[Brand Name]";
  var headline     = loc.headline     || (city + " Service: On-Site or In Our Shop.");
  var intro        = loc.intro        || ("When a job is down, everything slows down. In " + city + ", " + brandName + " gives you fast, reliable service so you can get back to work with less disruption.");
  var ctaText      = loc.ctaText      || brief.headerCta || "Request service";
  var services     = loc.services     || [];

  var sections = [];

  // Hero — image placeholder + headline
  sections.push(mkContainer([
    mkImagePh(city + " location"),
    mkSpacer(0),
    mkContainer([
      mkHeading(headline, C.warmWhite, "h1", { weight: 800, px: 48 }),
      mkSpacer(16),
      mkText(intro, C.warmWhite),
      mkSpacer(28),
      mkButton(ctaText, C.brassDp, "#ffffff"),
    ], C.asphalt, { padY: "60" }),
  ], C.asphalt, { padY: "0", gap: "0" }));

  // Address + phone + hours — tight strip right below hero
  sections.push(mkInfoBlock(loc, C.ink, C.stone, C.bone));

  // Services — compact list
  sections.push(mkContainer([
    mkHeading("Services in " + city + ", " + state, C.ink, "h2", { weight: 700, px: 36 }),
    mkSpacer(16),
    mkServicesList(services, C.text, C.brass),
    mkSpacer(24),
    mkButton(ctaText, C.brassDp, "#ffffff"),
  ], C.warmWhite, { padY: "60" }));

  // Map embed — prominent
  sections.push(mkContainer([
    mkMapEmbed(loc.mapEmbed, C.stone),
    mkSpacer(12),
    mkText("<strong>" + (loc.address || "[Address]") + "</strong><br>" + city + ", " + state + " · " + (loc.phone || "[Phone]") + " · " + (loc.hours || "[Hours]"), C.stone, "center"),
  ], C.bone, { padY: "48", center: true }));

  // Closing CTA
  sections.push(mkContainer([
    mkHeading("Serving " + city + " and surrounding areas.", C.warmWhite, "h2", { weight: 700, px: 36, align: "center" }),
    mkSpacer(24),
    mkButton(ctaText, C.brassDp, "#ffffff"),
  ], C.asphalt, { padY: "72", center: true }));

  return {
    version: "0.4",
    title: brandName + " — " + city + ", " + state + " (Conversion)",
    type: "page",
    page_settings: {},
    content: sections,
  };
}
