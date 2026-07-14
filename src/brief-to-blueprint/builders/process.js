import { mkContainer, mkHeading, mkText, mkButton, mkSpacer, mkDivider } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
import { bestTextColor } from "../../utils/contrast.js";

export function buildProcessPage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;
  var definedBtn = brief.buttons && brief.buttons[0];
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, text || "#1a1a1a");

  var header = mkContainer([
    mkHeading(brief.processEyebrow || "Process", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.processH1 || "How it gets made.", ink, "h1", { weight: 800, px: 64 }),
    mkSpacer(16),
    mkText(he(brief.processIntro || "Simple and calm, from first call to final files. No maze, no surprises."), text),
  ], bone, { padY: "96" });

  var defaultSteps = [
    ["01", "The intro", "A short call to understand the company and the goal. No charge, no maze."],
    ["02", "The plan", "A clear scope and a fixed quote up front. You know the price before anything starts."],
    ["03", "The work", "One focused engagement, lean and calm. No chaos, no surprises on your end."],
    ["04", "The review", "A first draft, then a set number of revision rounds. No open-ended feedback loops."],
    ["05", "Delivery", "Final files in every format you need, ready to use immediately."],
  ];
  var steps = brief.processSteps || defaultSteps;

  var callout = mkContainer([
    mkHeading(brief.calloutEyebrow || "What to expect", brass, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText(he(brief.calloutBody || "[What to expect — timeline and delivery details. Fill in from client brief.]"), warmWhite),
  ], ink, { padY: "96" });

  var closing = mkContainer([mkButton("Start a project", btnBg, btnText)], bone, { padY: "96", center: true });

  // ── Variant A: Two-column numbered grid ───────────────────────────────────
  var gridSteps = steps.map(function(step, i) {
    var num = step[0]; var title = step[1]; var body = step[2];
    return mkContainer([
      mkHeading(num, brass, "h1", { font: "Fraunces", weight: 300, px: 80 }),
      mkSpacer(24),
      mkDivider(brass),
      mkSpacer(24),
      mkHeading(title, ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(12),
      mkText(he(body), text),
    ], i % 2 === 0 ? bone : "#ffffff", { padY: "64", padX: "40" });
  });

  var stepsRow1 = mkContainer(gridSteps.slice(0, 2), null, { direction: "row", gap: "0", padY: "0", isInner: true });
  var stepsRow2 = mkContainer(gridSteps.slice(2, 4), null, { direction: "row", gap: "0", padY: "0", isInner: true });
  var stepsRow3 = gridSteps.length > 4
    ? mkContainer([gridSteps[4]], null, { direction: "row", gap: "0", padY: "0", isInner: true })
    : null;
  var gridContent = stepsRow3
    ? mkContainer([stepsRow1, stepsRow2, stepsRow3], bone, { padY: "0", padX: "0", gap: "0" })
    : mkContainer([stepsRow1, stepsRow2], bone, { padY: "0", padX: "0", gap: "0" });

  var variantA = { version: "0.4", title: he(brief.brandName || "Site") + " — Process", type: "page", page_settings: {},
    content: [header, gridContent, callout, closing] };

  // ── Variant B: Horizontal flowing timeline ────────────────────────────────
  var timelineSteps = steps.map(function(step) {
    var num = step[0]; var title = step[1]; var body = step[2];
    var card = mkContainer([
      mkHeading(num, brass, "h2", { font: "Fraunces", weight: 300, px: 56 }),
      mkSpacer(16),
      mkHeading(title, ink, "h4", { weight: 700, px: 18 }),
      mkSpacer(8),
      mkText(he(body), text),
    ], "#ffffff", { padY: "40", padX: "32", isInner: true });
    card.settings.border_border = "solid";
    card.settings.border_width = { unit:"px", top:"3", right:"0", bottom:"0", left:"0", isLinked:false };
    card.settings.border_color = brass;
    card.settings._flex_grow = 1;
    return card;
  });
  var timelineRow = mkContainer(timelineSteps, null, { direction: "row", gap: "20", padY: "0", isInner: true });
  timelineRow.settings.flex_wrap = "wrap";
  var timelineSection = mkContainer([timelineRow], bone, { padY: "96" });

  var variantB = { version: "0.4", title: he(brief.brandName || "Site") + " — Process", type: "page", page_settings: {},
    content: [header, timelineSection, callout, closing] };

  var processPattern = (patterns && patterns.process) || "numbered-vertical";
  var recommended = (processPattern === "horizontal-timeline" || processPattern === "icon-cards") ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

