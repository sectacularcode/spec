import { mkContainer, mkHeading, mkText, mkButton, mkImageBg, mkSpacer } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
import { bestTextColor } from "../../utils/contrast.js";

export function buildAboutPage(C, brief, inspoHint, patterns) {
  var ink = C.ink, brass = C.brass, bone = C.bone,
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;
  // Real button colors from the Style Guide's Buttons section when
  // defined; otherwise the same brassDp fill as always, with a computed
  // (not blindly hardcoded) safe text color.
  var definedBtn = brief.buttons && brief.buttons[0];
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, text || "#1a1a1a");

  var header = mkContainer([
    mkHeading(brief.aboutEyebrow || "About", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.aboutH1 || "One person. Every frame.", ink, "h1", { weight: 800, px: 64 }),
  ], bone, { padY: "88" });

  var closing = mkContainer([mkButton("Start a project", btnBg, btnText)], bone, { padY: "80", center: true });

  // ── Variant A: Story + portrait split ─────────────────────────────────────
  var storyLeft = mkContainer([
    mkText(he(brief.aboutStory || "[Founder story — pulled from brief. Fill in if missing.]"), text),
    mkSpacer(24),
    mkText(he(brief.aboutStory2 || "[Second paragraph — additional context about the founder's background and what led to this work.]"), text),
  ], null, { padY: "0", width: 50, isInner: true });

  var storyRight = mkImageBg("Founder portrait — on location, not in a studio.", { width: 50 });

  var storyRow = mkContainer([storyLeft, storyRight], null, { direction: "row", gap: "64", padY: "0", isInner: true });
  var storySection = mkContainer([storyRow], bone, { padY: "80" });

  var whySection = mkContainer([
    mkHeading(brief.whyEyebrow || "Why this approach", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.whyH2 || "One mind on the whole project.", ink, "h2", { weight: 800, px: 44 }),
    mkSpacer(24),
    mkText(he(brief.whyOneMaker || "[Why this approach — pulled from brief. Explain what makes the method different and why it matters to clients.]"), text),
  ], "#ffffff", { padY: "80" });

  var values = (brief.founderValues || ["Grounded", "Forward", "Exact", "Singular", "Human"]).map(function(v) {
    var card = mkContainer([
      mkSpacer(8),
      mkHeading(v, ink, "h3", { weight: 700, px: 22 }),
    ], null, { padY: "32", isInner: true });
    card.settings.border_border = "solid";
    card.settings.border_width = { unit:"px", top:"0", right:"0", bottom:"0", left:"3", isLinked:false };
    card.settings.border_color = brass;
    card.settings.padding = { unit:"px", top:"16", right:"20", bottom:"16", left:"20", isLinked:false };
    card.settings._flex_grow = 1;
    return card;
  });
  var valuesRow = mkContainer(values, null, { direction: "row", gap: "16", padY: "0", isInner: true });
  valuesRow.settings.flex_wrap = "wrap";
  var valuesSection = mkContainer([
    mkHeading(brief.valuesEyebrow || "What we stand for", brassDp, "h6", { eyebrow: true }),
    mkSpacer(32),
    valuesRow,
  ], bone, { padY: "72" });

  var variantA = { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [header, storySection, whySection, valuesSection, closing] };

  // ── Variant B: Vertical milestone timeline ─────────────────────────────────
  var milestones = (brief.milestones || [
    ["The beginning", "How it started and what drove the decision to build this."],
    ["Finding the niche", "The moment the right clients and right work became clear."],
    ["The work that mattered", "The projects that defined the approach and proved the model."],
    ["Where it stands now", "What the studio is today and where it is headed."],
  ]);

  var timelineItems = milestones.map(function(m, i) {
    var isEven = i % 2 === 0;
    var dot = mkContainer([], brass, { padY: "0", isInner: true });
    dot.settings.width = { unit:"px", size: 12 };
    dot.settings.height = { unit:"px", size: 12 };
    dot.settings.border_radius = { unit:"%", top:"50", right:"50", bottom:"50", left:"50", isLinked:true };

    return mkContainer([
      mkContainer([dot], null, { padY: "0", isInner: true }),
      mkSpacer(20),
      mkHeading(m[0], ink, "h3", { weight: 700, px: 22 }),
      mkSpacer(8),
      mkText(he(m[1]), text),
    ], isEven ? bone : "#ffffff", { padY: "48", padX: "40", isInner: false });
  });

  var timeline = mkContainer(timelineItems, null, { gap: "0", padY: "0" });

  var portraitSection = mkContainer([
    mkImageBg("Founder portrait — on location.", { width: 50 }),
    mkContainer([
      mkHeading(brief.whyEyebrow || "Why this approach", brassDp, "h6", { eyebrow: true }),
      mkSpacer(16),
      mkText(he(brief.whyOneMaker || "[Why this approach — pulled from brief.]"), text),
      mkSpacer(32),
      mkButton("Start a project", btnBg, btnText),
    ], null, { padY: "0", width: 50, isInner: true }),
  ], bone, { direction: "row", gap: "64", padY: "80" });

  var variantB = { version: "0.4", title: "About", type: "page", page_settings: {},
    content: [header, timeline, portraitSection, valuesSection, closing] };

  var aboutPattern = (patterns && patterns.about) || "split-image";
  var recommended = (aboutPattern === "timeline" || aboutPattern === "team-grid") ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

