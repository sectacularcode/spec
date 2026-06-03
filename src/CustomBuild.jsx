import { useState, useRef } from "react";

// ─── Template Library (grows with every client build) ────────────────────────
const TEMPLATE_LIBRARY = [
  {
    id: "mile-marker-2026",
    client: "Mile Marker Films",
    industry: "Video Production",
    style: "Dark Premium · Editorial",
    tags: ["dark-premium", "warm-editorial", "confident", "direct"],
    industryFit: ["video-production","creative-agency","consulting","private-equity","luxury-services","hospitality","industrial","founder-led","photography","architecture"],
    pages: ["home","work","services","about","process","contact"],
    date: "2026-06-02",
    description: "Full-bleed dark hero, editorial splits, brass accent system, Fraunces display type. Built for a one-person filmmaker targeting industrial and founder-led companies.",
  }
];

// ─── Default page list ────────────────────────────────────────────────────────
const ALL_PAGES = [
  { id: "home",     label: "Home",               slug: "/" },
  { id: "work",     label: "Work / Portfolio",    slug: "/work" },
  { id: "services", label: "Services & Pricing",  slug: "/services" },
  { id: "about",    label: "About",               slug: "/about" },
  { id: "process",  label: "Process",             slug: "/process" },
  { id: "contact",  label: "Contact",             slug: "/contact" },
];

// ─── Elementor JSON generator — with full mobile/tablet responsiveness ─────────
function nid() { return Math.random().toString(16).slice(2, 9); }

// Responsive padding helper: scales down padY by 70% tablet, 55% mobile
function rPad(padY, padX = "40") {
  const y = parseInt(padY); const x = parseInt(padX);
  const yt = Math.round(y * 0.7); const ym = Math.round(y * 0.55);
  return {
    padding:        { unit:"px", top:String(y),  right:String(x),  bottom:String(y),  left:String(x),  isLinked:false },
    padding_tablet: { unit:"px", top:String(yt), right:"24",       bottom:String(yt), left:"24",        isLinked:false },
    padding_mobile: { unit:"px", top:String(ym), right:"20",       bottom:String(ym), left:"20",        isLinked:false },
  };
}

// Responsive font size: scales down by breakpoint
function rFont(px) {
  if (!px) return {};
  const t = Math.max(16, Math.round(px * 0.68));
  const m = Math.max(16, Math.round(px * 0.50));
  return {
    typography_font_size:        { unit:"px", size: px },
    typography_font_size_tablet: { unit:"px", size: t  },
    typography_font_size_mobile: { unit:"px", size: m  },
  };
}

function mkContainer(children, bg, opts = {}) {
  const direction = opts.direction || "column";
  const s = {
    content_width: "boxed",
    flex_direction: direction,
    flex_gap: { unit:"px", size: opts.gap||"20", column: opts.gap||"20", row: opts.gap||"20" },
    ...rPad(opts.padY || "80", opts.padX || "40"),
  };
  if (bg) { s.background_background = "classic"; s.background_color = bg; }
  if (opts.minH) {
    s.min_height = { unit:"vh", size: opts.minH };
    s.min_height_tablet = { unit:"vh", size: Math.round(opts.minH * 0.8) };
    s.min_height_mobile = { unit:"px", size: 520 };
    s.justify_content = "center";
  }
  if (opts.center) { s.align_items = "center"; s.text_align = "center"; }
  if (opts.grow) s._flex_grow = opts.grow;
  // Row containers: stack columns on tablet and mobile
  if (direction === "row" && !opts.keepRow) {
    s.flex_direction_tablet = "column";
    s.flex_direction_mobile = "column";
  }
  // Button rows: keep row on tablet, stack only on mobile
  if (direction === "row" && opts.buttonRow) {
    s.flex_direction_tablet = "row";
    s.flex_direction_mobile = "column";
    s.align_items_mobile = "center";
  }
  return { id: nid(), elType: "container", isInner: !!opts.isInner, settings: s, elements: children };
}

function mkHeading(text, color, size, opts = {}) {
  const s = { title: text, header_size: size, title_color: color, align: opts.align || "left" };
  // Mobile alignment: center if already center, else left
  s.align_tablet = opts.align || "left";
  s.align_mobile = opts.align === "center" ? "center" : "left";
  if (opts.eyebrow) {
    s.typography_typography = "custom";
    s.typography_font_family = "Inter";
    s.typography_font_weight = "600";
    s.typography_text_transform = "uppercase";
    s.typography_letter_spacing = { unit:"px", size: 2.5 };
    s.typography_font_size = { unit:"px", size: 12 };
    // eyebrow stays same size on all devices
  } else {
    if (opts.font || opts.weight || opts.px || opts.italic) {
      s.typography_typography = "custom";
      if (opts.font)   s.typography_font_family = opts.font;
      if (opts.weight) s.typography_font_weight = String(opts.weight);
      if (opts.italic) s.typography_font_style = "italic";
      Object.assign(s, rFont(opts.px));
    }
  }
  return { id: nid(), elType: "widget", widgetType: "heading", settings: s, elements: [] };
}

function mkText(html, color, align = "left") {
  const s = { editor: `<p>${html}</p>`, text_color: color };
  if (align === "center") { s.text_align = "center"; s.text_align_tablet = "center"; s.text_align_mobile = "center"; }
  return { id: nid(), elType: "widget", widgetType: "text-editor", settings: s, elements: [] };
}

function mkButton(label, bgColor, textColor) {
  return { id: nid(), elType: "widget", widgetType: "button",
    settings: {
      text: label, link: { url: "#" },
      background_color: bgColor, button_text_color: textColor,
      border_radius: { unit:"px", top:"2", right:"2", bottom:"2", left:"2", isLinked:true },
      typography_typography: "custom", typography_font_family: "Inter",
      typography_font_weight: "600", typography_text_transform: "uppercase",
      typography_letter_spacing: { unit:"px", size: 1.5 },
      padding:        { unit:"px", top:"16", right:"32", bottom:"16", left:"32", isLinked:false },
      padding_mobile: { unit:"px", top:"14", right:"24", bottom:"14", left:"24", isLinked:false },
    }, elements: [] };
}

function mkImagePh(caption) {
  return { id: nid(), elType: "widget", widgetType: "image",
    settings: { image: { url:"", id:"" }, caption_source:"custom", caption: caption||"" },
    elements: [] };
}

function mkSpacer(px) {
  return { id: nid(), elType: "widget", widgetType: "spacer",
    settings: {
      space:        { unit:"px", size: px },
      space_tablet: { unit:"px", size: Math.round(px * 0.7) },
      space_mobile: { unit:"px", size: Math.round(px * 0.5) },
    }, elements: [] };
}

function buildHomePage(C, brief) {
  const colors = C;
  const ink = colors.ink, brass = colors.brass, bone = colors.bone,
        warmWhite = colors["warm-white"] || "#FBFAF7", stone = colors.stone || "#8A8170",
        asphalt = colors.asphalt, brassDp = colors["brass-deep"] || "#9C7E3A", text = colors.text;

  const hero = mkContainer([
    mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true, align: "center" }),
    mkSpacer(24),
    mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1",
      { font: "Fraunces", weight: 300, px: 72, align: "center" }),
    mkSpacer(28),
    mkText(brief.heroSubhead || "Your subheadline here.", warmWhite, "center"),
    mkSpacer(40),
    mkContainer([
      mkButton(brief.heroCta1 || "See the work", brass, ink),
      mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
    ], null, { direction: "row", gap: "16", padY: "0", center: true, isInner: true, buttonRow: true }),
  ], ink, { padY: "120", minH: 90, center: true });

  const hook = mkContainer([
    mkHeading(brief.hookStatement || "Your honest hook statement.", ink, "h2",
      { font: "Inter", weight: 700, px: 36, align: "center" }),
  ], bone, { padY: "100", center: true });

  const cards = (() => {
    const cds = (brief.serviceCards || [
      ["Proof", "Testimonials and case studies that help your team close."],
      ["People", "Recruiting, origin stories, the human core of the company."],
      ["Brand", "Founder stories, vision, the company's own voice."],
      ["Exit", "The story a business shows when it is ready to be bought."],
    ]).map(([title, body]) => {
      const c = mkContainer([
        mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
        mkSpacer(8),
        mkText(body, stone),
      ], "#ffffff", { padY: "32", isInner: true });
      c.settings.border_border = "solid";
      c.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "0", left: "3", isLinked: false };
      c.settings.border_color = brass;
      c.settings.padding = { unit: "px", top: "32", right: "28", bottom: "32", left: "28", isLinked: false };
      c.settings._flex_grow = 1;
      return c;
    });
    const row = mkContainer(cds, null, { direction: "row", gap: "20", padY: "0", isInner: true });
    row.settings.flex_wrap = "wrap";
    return mkContainer([row], bone, { padY: "80" });
  })();

  const split = (() => {
    const left = mkContainer([
      mkHeading(brief.differenceEyebrow || "Why one maker", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.differenceH2 || "The headline here.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    const right = mkContainer([
      mkText(brief.differenceBody || "The supporting body copy for this section.", text),
    ], null, { padY: "0", grow: 1, isInner: true });
    const row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true, keepRow: false });
    return mkContainer([row], bone, { padY: "96" });
  })();

  const work = mkContainer([
    mkHeading(brief.workH2 || "Recent work.", ink, "h2", { px: 44, weight: 800 }),
    mkSpacer(48),
    mkContainer(
      (brief.workItems || ["Film 1","Film 2","Film 3"]).map(w =>
        mkContainer([mkImagePh(w), mkSpacer(12), mkText(`<strong>${w}</strong>`, stone)],
          null, { padY: "0", grow: 1, isInner: true })
      ), null, { direction: "row", gap: "24", padY: "0", isInner: true }
    ),
  ], bone, { padY: "80" });

  const pricingTeaser = mkContainer([
    mkHeading(brief.pricingH2 || "Clear prices. No discovery-call maze.", ink, "h2",
      { px: 44, weight: 800, align: "center" }),
    mkSpacer(24),
    mkText(brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open.", stone, "center"),
    mkSpacer(40),
    mkContainer([mkButton(brief.pricingCta || "See packages", brass, ink)],
      null, { padY: "0", center: true, isInner: true }),
  ], bone, { padY: "112", center: true });

  const closing = mkContainer([
    mkHeading(brief.tagline || "The stories that move a company forward.", warmWhite, "h1",
      { font: "Fraunces", weight: 300, px: 64, italic: true, align: "center" }),
    mkSpacer(48),
    mkContainer([mkButton(brief.closingCta || "Start a project", brass, ink)],
      null, { padY: "0", center: true, isInner: true }),
  ], ink, { padY: "120", minH: 70, center: true });

  return { version: "0.4", title: "Home", type: "page", page_settings: {},
    content: [hero, hook, cards, split, work, pricingTeaser, closing] };
}

function buildSimplePage(pageId, C, brief) {
  const ink = C.ink, bone = C.bone, text = C.text,
        brassDp = C["brass-deep"] || "#9C7E3A", warmWhite = C["warm-white"] || "#FBFAF7",
        brass = C.brass, asphalt = C.asphalt, stone = C.stone || "#8A8170";

  const header = (eyebrow, h1, intro) => mkContainer([
    mkHeading(eyebrow, brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(h1, ink, "h1", { weight: 800 }),
    ...(intro ? [mkSpacer(16), mkText(intro, text)] : []),
  ], bone, { padY: "88" });

  const closing = mkContainer([mkButton("Start a project", brass, ink)], bone, { padY: "64", center: true });

  if (pageId === "work") return { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [
      header("Work", "Selected films.", "A look at the stories so far."),
      mkContainer([mkImagePh("Film placeholder 1"), mkImagePh("Film placeholder 2"), mkImagePh("Film placeholder 3")].map(img => {
        const c = mkContainer([img], null, { padY: "0", grow: 1, isInner: true }); return c;
      }), bone, { padY: "48" }),
      closing,
    ]};

  if (pageId === "services") return { version: "0.4", title: "Services & Pricing", type: "page", page_settings: {},
    content: [
      header("Services & pricing", "Every way to work together.", "Real prices, in the open. No 30-minute call required."),
      mkContainer([
        mkHeading(brief.pricingH2 || "Packages", ink, "h2", { weight: 800 }),
        mkSpacer(40),
        ...((brief.pricingTiers || [
          ["Starter", "From $2.5K", "The simple way to start."],
          ["Premium", "From $12K", "The films that move the needle."],
          ["Partner", "From $4K/mo", "An embedded creative partner."],
        ]).map(([name, price, desc]) =>
          mkContainer([
            mkHeading(name, warmWhite, "h3", { weight: 700 }),
            mkSpacer(8),
            mkHeading(price, brass, "h4"),
            mkSpacer(8),
            mkText(desc, warmWhite),
          ], asphalt, { padY: "32", grow: 1, isInner: true })
        )),
      ], bone, { padY: "80" }),
      closing,
    ]};

  if (pageId === "about") return { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [
      header("The maker", brief.aboutH1 || "One person. Every frame."),
      mkContainer([
        mkText(brief.aboutStory || "The founder story goes here.", text),
        mkSpacer(40),
        mkImagePh("Portrait — shot on location, not in a studio."),
      ], bone, { padY: "72" }),
      mkContainer([
        mkHeading("Why one maker", brassDp, "h6", { eyebrow: true }),
        mkSpacer(16),
        mkText(brief.whyOneMaker || "Supporting copy about the approach.", text),
      ], bone, { padY: "64" }),
      closing,
    ]};

  if (pageId === "process") return { version: "0.4", title: "Process", type: "page", page_settings: {},
    content: [
      header("Process", brief.processH1 || "How it gets made.", "Simple and calm, from first call to final files."),
      mkContainer(
        (brief.processSteps || [
          ["01", "The intro", "A short call. No charge, no maze."],
          ["02", "The plan", "A clear scope and a fixed quote up front."],
          ["03", "The shoot", "One day, lean and calm."],
          ["04", "The edit", "A first cut, then set revision rounds."],
          ["05", "Delivery", "Final files in every format you need."],
        ]).map(([num, title, body]) =>
          mkContainer([
            mkHeading(num, brass, "h2", { font: "Fraunces", weight: 300, px: 56 }),
            mkSpacer(8),
            mkHeading(title, ink, "h3", { weight: 700 }),
            mkSpacer(8),
            mkText(body, text),
          ], null, { padY: "0", grow: 1, isInner: true })
        ), bone, { direction: "row", gap: "40", padY: "80" }
      ),
      closing,
    ]};

  if (pageId === "contact") return { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [
      header("Contact", brief.contactH1 || "Tell me about the company.",
        "You will get a real reply from the person who makes the films, usually within one business day."),
      mkContainer([
        mkText("Form fields: Name · Company · Email · What do you need? · Budget range (optional) · Message", stone),
        mkSpacer(24),
        mkButton(brief.contactCta || "Send it over", brass, ink),
        mkSpacer(16),
        mkText(brief.contactReassurance || "No sales team. No automated funnel. Just one maker who will read it and write back.", stone),
      ], bone, { padY: "64" }),
    ]};

  return null;
}

function generatePages(brief, selectedPages) {
  const colors = brief.colors || {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  return selectedPages.map(pid => {
    if (pid === "home") return { id: pid, label: "Home", data: buildHomePage(colors, brief) };
    const data = buildSimplePage(pid, colors, brief);
    const label = ALL_PAGES.find(p => p.id === pid)?.label || pid;
    return { id: pid, label, data };
  }).filter(p => p.data);
}

// ─── HTML Preview builder ─────────────────────────────────────────────────────
function buildPreviewHTML(brief, pages) {
  const C = brief.colors || {
    ink: "#1C1A17", brass: "#C2A35B", "brass-deep": "#9C7E3A",
    bone: "#EDE7DB", asphalt: "#2B2823", stone: "#8A8170",
    "warm-white": "#FBFAF7", text: "#2A2722"
  };
  const fonts = brief.fonts || ["Fraunces", "Inter"];
  const fontImport = `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Inter:wght@400;600;700;800&display=swap`;

  const sections = {
    home: `
      <section style="background:${C.ink};min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 40px;text-align:center;">
        <div style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${C.brass};margin-bottom:24px;">${brief.brandName || "Brand Name"}</div>
        <h1 style="font-family:'Fraunces',serif;font-weight:300;font-size:clamp(48px,7vw,80px);line-height:1.06;color:${C["warm-white"]};max-width:900px;margin:0 0 28px;">${brief.heroHeadline || "Your headline here."}</h1>
        <p style="font-size:18px;color:${C["warm-white"]};opacity:.8;max-width:560px;margin:0 0 40px;">${brief.heroSubhead || "Your subheadline here."}</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
          <a style="padding:14px 32px;background:${C.brass};color:${C.ink};font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;">${brief.heroCta1 || "See the work"}</a>
          <a style="padding:14px 32px;border:1px solid ${C.brass};color:${C["warm-white"]};font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;">${brief.heroCta2 || "See pricing"}</a>
        </div>
      </section>
      <section style="background:${C.bone};padding:100px 40px;text-align:center;">
        <h2 style="font-size:clamp(24px,3.5vw,40px);font-weight:700;color:${C.ink};max-width:800px;margin:0 auto;">${brief.hookStatement || "Your honest hook statement goes here."}</h2>
      </section>
      <section style="background:${C.bone};padding:80px 40px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;max-width:1160px;margin:0 auto;">
          ${(brief.serviceCards || [["Proof","Testimonials and case studies."],["People","Recruiting and culture films."],["Brand","Founder stories, vision."],["Exit","The story before the sale."]]).map(([t,b]) => `<div style="background:#fff;border-left:3px solid ${C.brass};padding:28px;"><div style="font-size:16px;font-weight:700;color:${C.ink};margin-bottom:8px;">${t}</div><div style="font-size:14px;color:${C.stone};line-height:1.6;">${b}</div></div>`).join("")}
        </div>
      </section>
      <section style="background:${C.bone};padding:96px 40px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;max-width:1160px;margin:0 auto;align-items:center;">
          <div>
            <div style="font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${C["brass-deep"]};margin-bottom:16px;">${brief.differenceEyebrow || "Why one maker"}</div>
            <h2 style="font-size:clamp(32px,4vw,52px);font-weight:800;color:${C.ink};line-height:1.1;margin:0;">${brief.differenceH2 || "One person. The whole film."}</h2>
          </div>
          <div style="font-size:17px;color:${C.text};line-height:1.65;">${brief.differenceBody || "Supporting body copy goes here explaining the core difference."}</div>
        </div>
      </section>
      <section style="background:${C.bone};padding:80px 40px;">
        <h2 style="font-size:clamp(28px,3.5vw,44px);font-weight:800;color:${C.ink};margin:0 0 48px;">${brief.workH2 || "Recent work."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1160px;">
          ${(brief.workItems || ["Film 1","Film 2","Film 3"]).map(w => `<div><div style="background:#e0ddd7;aspect-ratio:16/10;display:flex;align-items:center;justify-content:center;color:${C.stone};font-size:13px;">${w}</div><div style="font-size:14px;color:${C.stone};margin-top:12px;font-weight:600;">${w}</div></div>`).join("")}
        </div>
      </section>
      <section style="background:${C.bone};padding:112px 40px;text-align:center;">
        <h2 style="font-size:clamp(28px,3.5vw,48px);font-weight:800;color:${C.ink};max-width:640px;margin:0 auto 24px;">${brief.pricingH2 || "Clear prices. No discovery-call maze."}</h2>
        <p style="color:${C.stone};max-width:480px;margin:0 auto 40px;">${brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open."}</p>
        <a style="padding:16px 40px;background:${C.brass};color:${C.ink};font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;">${brief.pricingCta || "See packages"}</a>
      </section>
      <section style="background:${C.ink};min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 40px;text-align:center;">
        <h2 style="font-family:'Fraunces',serif;font-weight:300;font-style:italic;font-size:clamp(36px,5vw,68px);color:${C["warm-white"]};max-width:800px;margin:0 0 48px;line-height:1.1;">${brief.tagline || "The stories that move a company forward."}</h2>
        <a style="padding:16px 40px;background:${C.brass};color:${C.ink};font-weight:600;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;border-radius:2px;">${brief.closingCta || "Start a project"}</a>
      </section>
    `,
  };

  const activeSection = sections[pages[0]] || sections.home;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${brief.brandName || "Preview"} — Custom Build Preview</title>
<link href="${fontImport}" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; font-size: 17px; line-height: 1.65; background: ${C.bone}; color: ${C.text}; }
  img { max-width: 100%; }
  section { width: 100%; }
</style>
</head>
<body>${activeSection}</body>
</html>`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const T = {
  surface: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" },
  label: { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "8px", display: "block" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", color: "#09090b", outline: "none", background: "#fff" },
  btnPrimary: { padding: "12px 24px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" },
  btnGhost: { padding: "10px 16px", background: "transparent", color: "#09090b", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  stepNum: (active, done) => ({ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, background: done ? "#000" : active ? "#000" : "#f3f4f6", color: done || active ? "#fff" : "#9ca3af", flexShrink: 0 }),
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomBuild() {
  const [brief, setBrief]               = useState(null);
  const [briefName, setBriefName]       = useState("");
  const [briefError, setBriefError]     = useState("");
  const [inspoUrls, setInspoUrls]       = useState([""]);
  const [selectedTemplate, setTemplate] = useState(null);
  const [selectedPages, setPages]       = useState(["home"]);
  const [copyBriefOnly, setCopy]        = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [generated, setGenerated]       = useState(null); // { pages: [...], previewHTML }
  const [previewPage, setPreviewPage]   = useState("home");
  const fileRef = useRef();

  const [parsing, setParsing]           = useState(false);
  const canGenerate = !!brief && selectedPages.length > 0;

  // ── Brief upload — handles JSON, PDF, TXT ────────────────────────────────────
  function handleFile(file) {
    if (!file) return;
    setBriefError("");
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "json") {
      // Parse directly client-side
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const raw = JSON.parse(e.target.result);
          const parsed = extractBrief(raw);
          setBrief(parsed);
          setBriefName(file.name);
          if (raw.sitemap) setPages(raw.sitemap.map(s => s.pageId));
        } catch {
          setBriefError("Could not parse this JSON file. Make sure it is a Spec project JSON.");
        }
      };
      reader.readAsText(file);

    } else if (ext === "pdf") {
      // Send to API as base64 for Claude to extract
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: base64, type: "pdf", fileName: file.name }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBrief(data);
          setBriefName(file.name);
        } catch (err) {
          setBriefError("Could not parse the PDF: " + err.message);
        } finally { setParsing(false); }
      };
      reader.readAsDataURL(file);

    } else if (ext === "docx" || ext === "doc") {
      // Send DOCX as base64 — mammoth on the server converts it to text for Claude
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: base64, type: "docx", fileName: file.name }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBrief(data);
          setBriefName(file.name);
          setBriefError("");
        } catch (err) {
          setBriefError("Could not parse the Word doc: " + err.message);
        } finally { setParsing(false); }
      };
      reader.readAsDataURL(file);

    } else if (ext === "txt") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const res = await fetch("/api/parse-brief", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: e.target.result, type: "text", fileName: file.name }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          setBrief(data);
          setBriefName(file.name);
          setBriefError("");
        } catch (err) {
          setBriefError("Could not parse the file: " + err.message);
        } finally { setParsing(false); }
      };
      reader.readAsText(file);

    } else {
      setBriefError("Unsupported file type. Upload a PDF, JSON, or TXT file.");
    }
  }

  function extractBrief(raw) {
    // Handle the full contract JSON (from our generator)
    if (raw.designSystem && raw.brandBrief) {
      const colors = {};
      (raw.designSystem.colors || []).forEach(c => { colors[c.id] = c.hex; });
      const pages = raw.pages || [];
      const getField = (pageId, sectionType, fieldKey) => {
        const page = pages.find(p => p.pageId === pageId);
        if (!page) return "";
        const sec = page.sections?.find(s => s.sectionType === sectionType || s.captureAs === sectionType);
        if (!sec) return "";
        const fld = sec.fields?.find(f => f.key === fieldKey);
        return Array.isArray(fld?.value) ? fld.value.join(" · ") : fld?.value || "";
      };
      return {
        brandName: raw.project?.name || "",
        colors,
        fonts: raw.designSystem.fonts?.map(f => f.family) || ["Inter"],
        heroHeadline: getField("home", "hero-dark", "h1") || getField("home", "hero", "h1"),
        heroSubhead: getField("home", "hero-dark", "subhead"),
        heroCta1: (getField("home", "hero-dark", "buttons") || "").split("·")[0]?.trim() || "See the work",
        heroCta2: (getField("home", "hero-dark", "buttons") || "").split("·")[1]?.trim() || "See pricing",
        hookStatement: getField("home", "statement-hook", "statement"),
        serviceCards: pages.find(p => p.pageId === "home")?.sections?.find(s => s.captureAs === "card-grid-4")?.fields?.map(f => [f.role.replace(/Card \d+ ?·? ?/, ""), f.value]) || [],
        differenceEyebrow: getField("home", "eyebrow-heading-body", "eyebrow"),
        differenceH2: getField("home", "eyebrow-heading-body", "h2"),
        differenceBody: getField("home", "eyebrow-heading-body", "body"),
        workH2: getField("home", "media-grid-link", "h2"),
        pricingH2: getField("home", "pricing-teaser", "h2"),
        pricingSubhead: getField("home", "pricing-teaser", "body"),
        pricingCta: (getField("home", "pricing-teaser", "button") || "").split("·")[0]?.trim() || "See packages",
        tagline: raw.brandBrief?.tagline?.value || "",
        closingCta: (getField("home", "cta-pullquote-dark", "button") || "").split("·")[0]?.trim() || "Start a project",
        aboutH1: getField("about", "page-header", "h1"),
        aboutStory: getField("about", "story-block", "story"),
        whyOneMaker: getField("about", "eyebrow-heading-body", "body"),
        processH1: getField("process", "page-header", "h1"),
        contactH1: getField("contact", "page-header", "h1"),
        contactCta: getField("contact", "contact-form", "submit"),
        contactReassurance: getField("contact", "contact-form", "reassurance"),
        pricingTiers: (raw.pricing?.tiers || []).map(t => [t.name, t.price, t.desc]),
      };
    }
    // Handle simplified brief JSON
    return { brandName: raw.brandName || raw.name || "", colors: raw.colors || {}, ...raw };
  }

  // ── Inspo URLs ──────────────────────────────────────────────────────────────
  function addUrl() { setInspoUrls(u => [...u, ""]); }
  function updateUrl(i, v) { setInspoUrls(u => u.map((x, j) => j === i ? v : x)); }
  function removeUrl(i) { setInspoUrls(u => u.filter((_, j) => j !== i)); }

  // ── Page toggle ─────────────────────────────────────────────────────────────
  function togglePage(id) {
    setPages(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  // ── Generate ────────────────────────────────────────────────────────────────
  function generate() {
    if (!canGenerate) return;
    setGenerating(true);
    setTimeout(() => {
      const pages = generatePages(brief, selectedPages);
      const previewHTML = buildPreviewHTML(brief, selectedPages);
      setGenerated({ pages, previewHTML });
      setPreviewPage(selectedPages[0] || "home");
      setGenerating(false);
    }, 800);
  }

  // ── Download ────────────────────────────────────────────────────────────────
  function downloadPage(p) {
    const blob = new Blob([JSON.stringify(p.data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${p.id}.json`; a.click(); URL.revokeObjectURL(a.href);
  }

  function downloadAll() {
    if (!generated) return;
    generated.pages.forEach((p, i) => setTimeout(() => downloadPage(p), i * 300));
  }

  // ── Step status ─────────────────────────────────────────────────────────────
  const steps = [
    { n: 1, label: "Brand Brief",       done: !!brief },
    { n: 2, label: "Inspo URLs",        done: inspoUrls.some(u => u.trim()) },
    { n: 3, label: "Template Library",  done: true }, // optional
    { n: 4, label: "Pages",             done: selectedPages.length > 0 },
    { n: 5, label: "Copy Settings",     done: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Custom Build</div>
        
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          {steps.map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={T.stepNum(false, s.done)}>{s.done ? "✓" : s.n}</div>
              <span style={{ fontSize: "12px", color: s.done ? "#09090b" : "#9ca3af", fontWeight: s.done ? 600 : 400 }}>{s.label}</span>
              {s.n < 5 && <span style={{ color: "#e5e7eb", margin: "0 4px" }}>›</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: generated ? "440px 1fr" : "1fr", gap: "0", minHeight: "calc(100vh - 57px)" }}>

        {/* Left panel — pre-generate checklist */}
        <div style={{ padding: "24px", borderRight: generated ? "1px solid #e5e7eb" : "none", overflowY: "auto", maxWidth: generated ? "440px" : "720px", margin: generated ? "0" : "0 auto" }}>

          {/* STEP 1: Brand Brief */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, !!brief)}>1</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Brand Brief</div>
              {brief && <span style={{ fontSize: "12px", color: "#16a34a", marginLeft: "auto" }}>✓ {briefName}</span>}
            </div>
            <div style={{ ...T.surface, border: brief ? "1px solid #bbf7d0" : "1px solid #e5e7eb" }}>
              {!brief ? (
                <>
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    style={{ border: "2px dashed #e5e7eb", borderRadius: "6px", padding: "32px", textAlign: "center", cursor: "pointer", transition: "border-color .15s" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "#000"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>📄</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "4px" }}>Upload Brand Brief</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Drop the project JSON from Spec here, or click to browse</div>
                    <input ref={fileRef} type="file" accept=".json,.pdf,.txt,.docx" style={{ display: "none" }}
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>
                  {parsing && (
                    <div style={{ marginTop: "12px", padding: "12px", background: "#f0fdf4", borderRadius: "6px", fontSize: "13px", color: "#15803d", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>⏳</span> Reading brief with Claude — this takes a few seconds...
                    </div>
                  )}
                  {briefError && <div style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>{briefError}</div>}
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                    Accepts Word doc (.docx), PDF, JSON project file, or TXT.
                  </div>
                </>
              ) : (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>{brief.brandName || "Brand loaded"}</div>
                  {brief.colors && (
                    <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
                      {Object.entries(brief.colors).slice(0, 8).map(([id, hex]) => (
                        <div key={id} title={`${id}: ${hex}`} style={{ width: "24px", height: "24px", borderRadius: "4px", background: hex, border: "1px solid rgba(0,0,0,.1)" }} />
                      ))}
                    </div>
                  )}
                  <button style={T.btnGhost} onClick={() => { setBrief(null); setBriefName(""); }}>Replace brief</button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Inspo URLs */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, inspoUrls.some(u => u.trim()))}>2</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Inspo URLs</div>
              <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>Optional</span>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                Add sites whose layout, hero, or sections you want to reference. The generator uses these to select premium shell variants.
              </div>
              {inspoUrls.map((url, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input style={{ ...T.input, flex: 1 }} value={url}
                    onChange={e => updateUrl(i, e.target.value)}
                    placeholder="https://example.com" />
                  {inspoUrls.length > 1 && (
                    <button onClick={() => removeUrl(i)} style={{ ...T.btnGhost, padding: "10px 12px" }}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addUrl} style={{ ...T.btnGhost, marginTop: "4px", fontSize: "13px" }}>+ Add URL</button>
            </div>
          </div>

          {/* STEP 3: Template Library */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, !!selectedTemplate)}>3</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Template Library</div>
              <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>Optional</span>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                Use a past client build as the structural base. The layout shells are reused; all copy is replaced with the new brief.
              </div>
              {TEMPLATE_LIBRARY.map(t => (
                <div key={t.id}
                  onClick={() => setTemplate(selectedTemplate?.id === t.id ? null : t)}
                  style={{ padding: "14px", border: selectedTemplate?.id === t.id ? "2px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", marginBottom: "8px", transition: "border-color .15s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>{t.client}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{t.industry} · {t.style}</div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{t.date}</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px", lineHeight: 1.5 }}>{t.description}</div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                    {t.tags.map(tag => <span key={tag} style={{ fontSize: "11px", padding: "3px 8px", background: "#f3f4f6", borderRadius: "20px", color: "#374151" }}>{tag}</span>)}
                  </div>
                </div>
              ))}
              {selectedTemplate && (
                <div style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px" }}>✓ Using {selectedTemplate.client} as the structural base</div>
              )}
            </div>
          </div>

          {/* STEP 4: Pages */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, selectedPages.length > 0)}>4</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Pages to Build</div>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                Only checked pages are included in the export. Uncheck pages you don't need.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {ALL_PAGES.map(p => (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", border: selectedPages.includes(p.id) ? "1px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "#09090b", transition: "border-color .15s" }}>
                    <input type="checkbox" checked={selectedPages.includes(p.id)}
                      onChange={() => togglePage(p.id)}
                      style={{ accentColor: "#000", width: "15px", height: "15px" }} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
                {selectedPages.length} page{selectedPages.length !== 1 ? "s" : ""} selected
              </div>
            </div>
          </div>

          {/* STEP 5: Copy Settings */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={T.stepNum(true, true)}>5</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b" }}>Copy Settings</div>
            </div>
            <div style={T.surface}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>
                Use copy from brand brief only?
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ flex: 1, padding: "14px", border: copyBriefOnly ? "2px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", textAlign: "center" }}>
                  <input type="radio" name="copy" checked={copyBriefOnly} onChange={() => setCopy(true)} style={{ display: "none" }} />
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>Yes</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>Brief copy used verbatim. Nothing is changed or generated by AI.</div>
                </label>
                <label style={{ flex: 1, padding: "14px", border: !copyBriefOnly ? "2px solid #000" : "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", textAlign: "center" }}>
                  <input type="radio" name="copy" checked={!copyBriefOnly} onChange={() => setCopy(false)} style={{ display: "none" }} />
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b" }}>No</div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>AI may draft blank fields in the brand voice. You approve before export.</div>
                </label>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!canGenerate || generating}
            style={{ ...T.btnPrimary, width: "100%", justifyContent: "center", padding: "16px 24px", fontSize: "15px", opacity: canGenerate ? 1 : 0.4, cursor: canGenerate ? "pointer" : "not-allowed" }}>
            {generating ? "Generating…" : `Generate ${selectedPages.length} Page${selectedPages.length !== 1 ? "s" : ""}`}
          </button>
          {!brief && <div style={{ fontSize: "12px", color: "#9ca3af", textAlign: "center", marginTop: "8px" }}>Upload a brand brief to enable generation</div>}

          {/* Downloads (after generate) */}
          {generated && (
            <div style={{ marginTop: "24px", ...T.surface }}>
              <div style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: "12px" }}>Download</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {generated.pages.map(p => (
                  <button key={p.id} onClick={() => downloadPage(p)} style={{ ...T.btnGhost, textAlign: "left", display: "flex", justifyContent: "space-between" }}>
                    <span>{p.label}</span><span style={{ color: "#9ca3af" }}>↓ .json</span>
                  </button>
                ))}
                {generated.pages.length > 1 && (
                  <button onClick={downloadAll} style={{ ...T.btnPrimary, justifyContent: "center", marginTop: "4px" }}>
                    Download All Pages
                  </button>
                )}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                Rename each file from .json.txt to .json if needed, then import via WordPress → Templates → Saved Templates → Import Templates.
              </div>
            </div>
          )}
        </div>

        {/* Right panel — preview */}
        {generated && (
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 600, marginRight: "4px" }}>PREVIEW</span>
              {generated.pages.map(p => (
                <button key={p.id}
                  onClick={() => { setPreviewPage(p.id); }}
                  style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: previewPage === p.id ? "1px solid #000" : "1px solid #e5e7eb", borderRadius: "20px", background: previewPage === p.id ? "#000" : "#fff", color: previewPage === p.id ? "#fff" : "#09090b" }}>
                  {p.label}
                </button>
              ))}
            </div>
            <iframe
              srcDoc={buildPreviewHTML(brief, [previewPage])}
              style={{ flex: 1, border: "none", width: "100%", minHeight: "calc(100vh - 100px)" }}
              title="Site preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
