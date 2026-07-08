import { mkContainer, mkHeading, mkText, mkButton, mkImageBg, mkSpacer } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";

export function buildHomePage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;
  var heroPattern = (patterns && patterns.hero) || "centered-bold";

  // ── HERO — pattern-driven ──────────────────────────────────────────────────
  var hero;
  if (heroPattern === "split-left") {
    // Text left, image placeholder right
    var heroTextCol = mkContainer([
      mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1", { weight: 800, px: 56 }),
      mkSpacer(24),
      mkText(he(brief.heroSubhead || "Your subheadline here."), warmWhite),
      mkSpacer(40),
      mkContainer([
        mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff"),
        mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
      ], null, { direction: "row", gap: "16", padY: "0", isInner: true, buttonRow: true }),
    ], null, { padY: "0", width: 50, isInner: true });
    var heroImgCol = mkImageBg("Hero image", { width: 50 });
    var heroRow = mkContainer([heroTextCol, heroImgCol], null, { direction: "row", gap: "64", padY: "0", isInner: true });
    hero = mkContainer([heroRow], ink, { padY: "80" });
  } else if (heroPattern === "split-right") {
    // Image placeholder left, text right
    var heroImgColR = mkImageBg("Hero image", { width: 50 });
    var heroTextColR = mkContainer([
      mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true }),
      mkSpacer(20),
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1", { weight: 800, px: 56 }),
      mkSpacer(24),
      mkText(he(brief.heroSubhead || "Your subheadline here."), warmWhite),
      mkSpacer(40),
      mkContainer([
        mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff"),
        mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
      ], null, { direction: "row", gap: "16", padY: "0", isInner: true, buttonRow: true }),
    ], null, { padY: "0", width: 50, isInner: true });
    var heroRowR = mkContainer([heroImgColR, heroTextColR], null, { direction: "row", gap: "64", padY: "0", isInner: true });
    hero = mkContainer([heroRowR], ink, { padY: "80" });
  } else if (heroPattern === "minimal") {
    // Large whitespace, minimal text, no image
    hero = mkContainer([
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1",
        { font: "Fraunces", weight: 300, px: 80, align: "center" }),
      mkSpacer(48),
      mkContainer([mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff")],
        null, { padY: "0", center: true, isInner: true }),
    ], ink, { padY: "140", minH: 80, center: true });
  } else {
    // centered-bold / full-image / default — centered layout
    hero = mkContainer([
      mkHeading(brief.brandName || "Brand Name", brass, "h6", { eyebrow: true, align: "center" }),
      mkSpacer(24),
      mkHeading(brief.heroHeadline || "Your headline here.", warmWhite, "h1",
        { font: "Fraunces", weight: 300, px: 72, align: "center" }),
      mkSpacer(28),
      mkText(he(brief.heroSubhead || "Your subheadline here."), warmWhite, "center"),
      mkSpacer(40),
      mkContainer([
        mkButton(brief.heroCta1 || "See the work", brassDp, "#ffffff"),
        mkButton(brief.heroCta2 || "See pricing", "rgba(0,0,0,0)", warmWhite),
      ], null, { direction: "row", gap: "16", padY: "0", center: true, isInner: true, buttonRow: true }),
    ], ink, { padY: "80", minH: 0, center: true });
  }

  var hook = mkContainer([
    mkHeading(brief.hookStatement || "Your honest hook statement.", ink, "h2",
      { font: "Inter", weight: 700, px: 36, align: "center" }),
  ], bone, { padY: "60", center: true });

  var cards = (function() {
    var cds = (brief.serviceCards || [
      ["Proof", "Testimonials and case studies that help your team close."],
      ["People", "Recruiting, origin stories, the human core of the company."],
      ["Brand", "Founder stories, vision, the company's own voice."],
      ["Exit", "The story a business shows when it is ready to be bought."],
    ]).map(function(pair) {
      var title = pair[0]; var body = pair[1];
      var c = mkContainer([
        mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
        mkSpacer(8),
        mkText(he(body), stone),
      ], "#ffffff", { padY: "32", isInner: true });
      c.settings.border_border = "solid";
      c.settings.border_width = { unit: "px", top: "0", right: "0", bottom: "0", left: "3", isLinked: false };
      c.settings.border_color = brass;
      c.settings.padding = { unit: "px", top: "32", right: "28", bottom: "32", left: "28", isLinked: false };
      c.settings._flex_grow = 1;
      return c;
    });
    var row = mkContainer(cds, null, { direction: "row", gap: "20", padY: "0", isInner: true });
    row.settings.flex_wrap = "wrap";
    return mkContainer([row], bone, { padY: "80" });
  })();

  var split = (function() {
    var left = mkContainer([
      mkHeading(brief.differenceEyebrow || "Why one maker", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.differenceH2 || "One person. The whole film.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var right = mkContainer([
      mkText(he(brief.differenceBody || "[The difference — explain what sets this apart. Pulled from brand brief.]"), text),
    ], null, { padY: "0", grow: 1, isInner: true });
    var row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true });
    return mkContainer([row], bone, { padY: "96" });
  })();

  var whoSection = (function() {
    var left = mkContainer([
      mkHeading(brief.whoEyebrow || "Who it is for", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(brief.whoH2 || "For the underfilmed.", ink, "h2", { px: 48, weight: 800 }),
    ], null, { padY: "0", grow: 1, isInner: true });
    var right = mkContainer([
      mkText(he(brief.whoBody || "[Who this is for — pulled from brand brief. Describe the ideal client specifically.]"), text),
    ], null, { padY: "0", grow: 1, isInner: true });
    var row = mkContainer([left, right], null, { direction: "row", gap: "80", padY: "0", isInner: true });
    return mkContainer([row], bone, { padY: "96" });
  })();

  var work = mkContainer([
    mkHeading(brief.workH2 || "Recent work.", ink, "h2", { px: 44, weight: 800 }),
    mkSpacer(48),
    mkContainer(
      (brief.workItems || ["Film 1","Film 2","Film 3"]).map(function(w) {
        return mkContainer([mkImageBg(w, { minHeight: 220 }), mkSpacer(12), mkText("<strong>" + he(w) + "</strong>", stone)],
          null, { padY: "0", grow: 1, isInner: true });
      }), null, { direction: "row", gap: "24", padY: "0", isInner: true }
    ),
  ], bone, { padY: "80" });

  var pricingTeaser = mkContainer([
    mkHeading(brief.pricingH2 || "Clear prices. No discovery-call maze.", ink, "h2",
      { px: 44, weight: 800, align: "center" }),
    mkSpacer(24),
    mkText(he(brief.pricingSubhead || "Pick a package or build a plan, with real numbers in the open."), stone, "center"),
    mkSpacer(40),
    mkContainer([mkButton(brief.pricingCta || "See packages", brassDp, "#ffffff")],
      null, { padY: "0", center: true, isInner: true }),
  ], bone, { padY: "112", center: true });

  var closing = mkContainer([
    mkHeading(brief.tagline || "The stories that move a company forward.", warmWhite, "h1",
      { font: "Fraunces", weight: 300, px: 64, italic: true, align: "center" }),
    mkSpacer(48),
    mkContainer([mkButton(brief.closingCta || "Start a project", brassDp, "#ffffff")],
      null, { padY: "0", center: true, isInner: true }),
  ], ink, { padY: "120", minH: 70, center: true });

  return { version: "0.4", title: "Home", type: "page", page_settings: {},
    content: [hero, hook, cards, split, whoSection, work, pricingTeaser, closing] };
}

