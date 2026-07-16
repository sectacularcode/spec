import { mkContainer, mkHeading, mkText, mkButton, mkSpacer, mkDivider } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";

import { bestTextColor } from "../../utils/contrast.js";

export function buildServicesPage(C, brief, _inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#3F3F46", asphalt = C.asphalt || "#2B2823", text = C.text;
  var definedBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "primary"; }) || (brief.buttons && brief.buttons[0]);
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, text || "#1a1a1a");

  var header = mkContainer([
    mkHeading(brief.servicesEyebrow || "Services & Pricing", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.servicesH1 || "Straightforward pricing, upfront.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(20),
    mkText("Real prices, in the open. Pick a package, or build a plan. No 30 minute call required to learn what something costs.", text),
  ], bone, { padY: "96" });

  // Three tiers on dark background
  var tiers = (brief.pricingTiers || [
    ["01  Front Door", "CASH FLOW & TRUST", "Productized story and testimonial packages with set scope and open pricing. The simple way to start working together.", "From 2.5K per film"],
    ["02  Premium", "MARGIN & CRAFT", "Brand films, founder stories, and exit work. Built around your story and priced to the project. The films that move the needle.", "From 12K per film"],
    ["03  The Partner Plan", "RECURRING", "An embedded video partner across your portfolio or for one company. Predictable monthly output, no constant re-quoting.", "From 4K per month"],
  ]).map(function(tier) {
    var name = tier[0]; var sub = tier[1]; var desc = tier[2]; var price = tier[3];
    var card = mkContainer([
      mkHeading(name, warmWhite, "h3", { weight: 700, px: 28 }),
      mkSpacer(6),
      mkHeading(sub || "", stone, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkDivider("#4a4640"),
      mkSpacer(20),
      mkText(he(desc || ""), warmWhite),
      mkSpacer(24),
      mkHeading(price || "", brass, "h3", { weight: 700, px: 32 }),
    ], asphalt, { padY: "48", padX: "36", isInner: true });
    card.settings._flex_grow = 1;
    return card;
  });

  var tiersRow = mkContainer(tiers, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  tiersRow.settings.flex_wrap = "wrap";

  // Always included block
  var alwaysIncluded = mkContainer([
    mkHeading("Always included, in every package", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("A set number of revision rounds, agreed up front, so feedback never runs open-ended. Professional lighting and audio, color grading, and a licensed music track. Delivery in web and social formats, plus short cutdowns from the same footage.", text),
  ], "#ffffff", { padY: "32", padX: "36", isInner: true });
  alwaysIncluded.settings.border_border = "solid";
  alwaysIncluded.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  alwaysIncluded.settings.border_color = "#E2DBCC";

  var tiersSection = mkContainer([tiersRow, mkSpacer(24), alwaysIncluded], ink, { padY: "88" });

  // Full menu — grouped by category. Read entirely from brief.pricingMenu:
  // an array of { category, items: [{ name, price, desc, includes }] }.
  // No hardcoded industry content and no bracket-placeholder fallback —
  // this is an optional supplementary section (the 3-tier row above already
  // makes a complete page on its own), so when a brief has no menu items,
  // the section is skipped entirely rather than showing filler.
  var menuCategories = brief.pricingMenu || [];

  var menuSections = menuCategories.map(function(cat) {
    var rows = (cat.items || []).map(function(item) {
      var namePrice = mkContainer([
        mkHeading(item.name || "", ink, "h4", { weight: 700, px: 18 }),
        mkHeading(item.price || "", brassDp, "h5", { weight: 600 }),
      ], null, { direction: "row", gap: "20", padY: "0", isInner: true });
      var row = mkContainer([
        namePrice,
        mkSpacer(8),
        mkText(he(item.desc || ""), text),
        mkSpacer(4),
        mkText("<em>Includes: " + he(item.includes || "") + "</em>", stone),
        mkSpacer(20),
        mkDivider(),
      ], null, { padY: "0", isInner: true });
      return row;
    });

    return mkContainer([
      mkHeading(cat.category || "", ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(8),
      mkDivider(brass),
      mkSpacer(24),
    ].concat(rows), null, { padY: "0", isInner: true });
  });

  // Only built when the brief actually supplies menu items — the 3-tier row
  // above is already a complete page on its own, so this optional section
  // is omitted entirely rather than showing filler when there's nothing real
  // to put in it.
  var menuSection = null;
  if (menuCategories.length > 0) {
    var menuRow = mkContainer(menuSections, null, { direction: "row", gap: "48", padY: "0", isInner: true });
    menuRow.settings.flex_wrap = "wrap";
    menuSection = mkContainer([
      mkHeading(brief.pricingMenuHeading || "The full menu", ink, "h2", { weight: 800, px: 44 }),
      mkSpacer(48),
      menuRow,
    ], bone, { padY: "96" });
  }

  // How pricing works
  var pricingNote = mkContainer([
    mkHeading("How pricing works", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText(he(brief.pricingNote || "Every price is a starting point. It scales with scope. Most packages come in good, better, and best versions, so a client can choose by budget without a negotiation."), text),
  ], "#ffffff", { padY: "56", padX: "40" });
  pricingNote.settings.border_border = "solid";
  pricingNote.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"3", isLinked:false };
  pricingNote.settings.border_color = brass;

  var pricingNoteSection = mkContainer([pricingNote], bone, { padY: "64" });

  var closing = mkContainer([
    mkText("Not sure where to start? Tell me about the company.", stone, "center"),
    mkSpacer(24),
    mkButton(brief.headerCta || "Start a project", btnBg, btnText),
  ], bone, { padY: "96", center: true });

  return { version: "0.4", title: he(brief.brandName || "Site") + " — Services & Pricing", type: "page", page_settings: {},
    content: [header, tiersSection, menuSection, pricingNoteSection, closing].filter(Boolean) };
}

export function buildServicesPageLight(C, brief, _inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#3F3F46", asphalt = C.asphalt || "#2B2823", text = C.text;
  var definedBtn = (brief.buttons || []).find(function(b) { return (b.name || "").trim().toLowerCase() === "primary"; }) || (brief.buttons && brief.buttons[0]);
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, text || "#1a1a1a");

  var header = mkContainer([
    mkHeading(brief.servicesEyebrow || "Services & pricing", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.servicesH1 || "Straightforward pricing, upfront.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(20),
    mkText("Real prices, in the open. Pick a package, or build a plan.", text),
  ], bone, { padY: "96" });

  var tiers = (brief.pricingTiers || [
    ["Front Door", "CASH FLOW & TRUST", "Productized story and testimonial packages with set scope and open pricing.", "From 2.5K per film"],
    ["Premium", "MARGIN & CRAFT", "Brand films, founder stories, and exit work. Built around your story and priced to the project.", "From 12K per film"],
    ["Partner Plan", "RECURRING", "An embedded video partner. Predictable monthly output, no constant re-quoting.", "From 4K per month"],
  ]).map(function(tier, i) {
    var featured = i === 1;
    var card = mkContainer([
      mkHeading(tier[1] || "", brassDp, "h6", { eyebrow: true }),
      mkSpacer(12),
      mkHeading(tier[0], featured ? warmWhite : ink, "h3", { weight: 700, px: 24 }),
      mkSpacer(16),
      mkDivider(featured ? "rgba(255,255,255,.2)" : "#E2DBCC"),
      mkSpacer(16),
      mkText(he(tier[2] || ""), featured ? warmWhite : text),
      mkSpacer(20),
      mkHeading(tier[3] || "", featured ? brass : brassDp, "h4", { weight: 700, px: 28 }),
      mkSpacer(24),
      mkButton("Learn more", featured ? btnBg : "transparent", featured ? btnText : btnBg),
    ], featured ? asphalt : "#ffffff", { padY: "44", padX: "36", isInner: true });
    card.settings._flex_grow = 1;
    if (!featured) {
      card.settings.border_border = "solid";
      card.settings.border_width = { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true };
      card.settings.border_color = "#E2DBCC";
    }
    return card;
  });

  var tiersRow = mkContainer(tiers, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  tiersRow.settings.flex_wrap = "wrap";
  var tiersSection = mkContainer([tiersRow], bone, { padY: "80" });

  var closing = mkContainer([
    mkText("Not sure where to start? Tell us about the company.", stone, "center"),
    mkSpacer(24),
    mkButton(brief.headerCta || "Start a project", btnBg, btnText),
  ], bone, { padY: "96", center: true });

  return { version: "0.4", title: he(brief.brandName || "Site") + " — Services & Pricing", type: "page", page_settings: {},
    content: [header, tiersSection, closing] };
}

