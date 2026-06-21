import { nid, rPad, rFont, mkContainer, mkHeading, mkText, mkButton, mkImagePh, mkSpacer, mkDivider } from "./helpers.js";
import { inspoMatchesVariant } from "../utils/inspo.js";

export function buildWorkPage(C, brief, inspoHint) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", asphalt = C.asphalt, text = C.text;

  var header = mkContainer([
    mkHeading(brief.workEyebrow || "Work", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.workH1 || "Selected work.", ink, "h1", { weight: 800, px: 64 }),
    mkSpacer(16),
    mkText(brief.workIntro || "A look at the stories so far. Customer and team films, brand work, and the films that help a company show what it has become.", text),
  ], bone, { padY: "88" });

  var closing = mkContainer([mkButton("Start a project", brassDp, "#ffffff")], bone, { padY: "80", center: true });

  // ── Variant A: Standard grid with filter row ──────────────────────────────
  var filterCategories = brief.workCategories || ["All", "Stories & testimonials", "People & culture", "Brand & leadership", "Exit"];
  var filterRow = mkContainer([
    mkContainer(
      filterCategories.map(function(label, i) {
        var btn = mkButton(label, i === 0 ? brass : "transparent", i === 0 ? ink : brassDp);
        btn.settings.border_border = "solid";
        btn.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
        btn.settings.border_color = i === 0 ? brass : brassDp;
        btn.settings.padding = { unit:"px", top:"10", right:"20", bottom:"10", left:"20", isLinked:false };
        return btn;
      }), null, { direction: "row", gap: "10", padY: "0", isInner: true }
    ),
  ], bone, { padY: "24", padX: "40" });

  var gridTiles = (brief.workItems || []).map(function(title) {
    var tile = mkContainer([
      mkImagePh(title),
      mkSpacer(16),
      mkHeading(title, ink, "h4", { weight: 700 }),
      mkSpacer(4),
      mkText("[Project type — fill in]", stone),
      mkSpacer(4),
      mkText("[One line of context about this project]", stone),
    ], "#ffffff", { padY: "0", isInner: true });
    tile.settings.border_border = "solid";
    tile.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
    tile.settings.border_color = "#E2DBCC";
    tile.settings._flex_grow = 1;
    return tile;
  });

  // If no work items in brief, show flagged placeholder tiles
  if (gridTiles.length === 0) {
    for (var wi = 0; wi < 6; wi++) {
      var pt = mkContainer([
        mkImagePh("[Upload project image " + (wi+1) + "]"),
        mkSpacer(16),
        mkHeading("[Project title " + (wi+1) + "]", ink, "h4", { weight: 700 }),
        mkSpacer(4),
        mkText("[Project type]", stone),
      ], "#ffffff", { padY: "0", isInner: true });
      pt.settings.border_border = "solid";
      pt.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
      pt.settings.border_color = "#E2DBCC";
      pt.settings._flex_grow = 1;
      gridTiles.push(pt);
    }
  }
  var grid = mkContainer(gridTiles, null, { direction: "row", gap: "24", padY: "0", isInner: true });
  grid.settings.flex_wrap = "wrap";
  var gridSection = mkContainer([grid], bone, { padY: "64" });

  var variantA = { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [header, filterRow, gridSection, closing] };

  // ── Variant B: Editorial — featured hero tile + supporting grid ───────────
  var items = brief.workItems || [];
  var featured = items[0] || "[Featured project title]";
  var featuredTile = mkContainer([
    mkContainer([
      mkImagePh(featured),
    ], null, { padY: "0", grow: 1, isInner: true }),
    mkContainer([
      mkHeading("Featured", brass, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkHeading(featured, ink, "h2", { weight: 800, px: 44 }),
      mkSpacer(12),
      mkText("[Add a one paragraph description of this project when publishing.]", text),
      mkSpacer(24),
      mkButton("View project", brassDp, "#ffffff"),
    ], null, { padY: "48", grow: 1, isInner: true }),
  ], "#ffffff", { direction: "row", gap: "0", padY: "0" });
  featuredTile.settings.border_border = "solid";
  featuredTile.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  featuredTile.settings.border_color = "#E2DBCC";

  var supportingItems = items.length > 1 ? items.slice(1) : ["[Project 2]", "[Project 3]", "[Project 4]", "[Project 5]"];
  var supportingTiles = supportingItems.map(function(title) {
    var t = mkContainer([
      mkImagePh(title),
      mkSpacer(12),
      mkHeading(title, ink, "h4", { weight: 700 }),
      mkSpacer(4),
      mkText("[Project type]", stone),
    ], "#ffffff", { padY: "24", isInner: true });
    t.settings.border_border = "solid";
    t.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
    t.settings.border_color = "#E2DBCC";
    t.settings._flex_grow = 1;
    return t;
  });
  var supportingRow = mkContainer(supportingTiles, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  supportingRow.settings.flex_wrap = "wrap";

  var editorialSection = mkContainer([featuredTile, mkSpacer(20), supportingRow], bone, { padY: "64" });

  var variantB = { version: "0.4", title: "Work", type: "page", page_settings: {},
    content: [header, editorialSection, closing] };

  // Recommend B if inspo hints suggest editorial/featured/case-study style
  var recommended = inspoMatchesVariant(inspoHint, ["editorial", "featured", "case study", "full bleed", "hero image", "spotlight"])
    ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

