import { mkContainer, mkHeading, mkText, mkButton, mkSpacer } from "./helpers.js";
import { he } from "../utils/htmlEscape.js";
import { bestTextColor } from "../../utils/contrast.js";

export function buildContactPage(C, brief, inspoHint, patterns) {
  var ink = C.ink, bone = C.bone,
      warmWhite = C["warm-white"] || "#FBFAF7", stone = C.stone || "#8A8170",
      brassDp = C["brass-deep"] || "#9C7E3A", text = C.text;
  var definedBtn = brief.buttons && brief.buttons[0];
  var btnBg = (definedBtn && definedBtn.background) || brassDp;
  var btnText = (definedBtn && definedBtn.textColor) || bestTextColor(btnBg, text || "#1a1a1a");

  var formPlaceholder = mkContainer([
    mkText("Form fields: Name · Company · Email · What do you need? · Budget range (optional) · Message", stone),
    mkSpacer(8),
    mkText("<em>Connect a forms plugin (Fluent Forms or WPForms) and replace this with the live shortcode.</em>", stone),
  ], "#ffffff", { padY: "32", padX: "36" });
  formPlaceholder.settings.border_border = "solid";
  formPlaceholder.settings.border_width = { unit:"px", top:"1", right:"1", bottom:"1", left:"1", isLinked:true };
  formPlaceholder.settings.border_color = "#E2DBCC";

  var closingDark = mkContainer([
    mkHeading(brief.tagline || "Ready to get started?", warmWhite, "h2",
      { font: "Fraunces", weight: 300, px: 52, italic: true, align: "center" }),
    mkSpacer(40),
    mkHeading(brief.signatureLine || "", stone, "h4", { align: "center" }),
  ], ink, { padY: "96", center: true });

  // ── Variant A: Stacked — header, form, reassurance, info split ────────────
  var headerA = mkContainer([
    mkHeading(brief.contactEyebrow || "Contact", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkHeading(brief.contactH1 || "Tell us about your project.", ink, "h1", { weight: 800, px: 56 }),
    mkSpacer(16),
    mkText(he(brief.contactIntro || "A quick note about what you need. You will get a real reply from a real person, usually within one business day."), text),
  ], bone, { padY: "88" });

  var formSectionA = mkContainer([
    formPlaceholder,
    mkSpacer(32),
    mkContainer([mkButton(brief.contactCta || "Send it over", btnBg, btnText)], null, { padY: "0", isInner: true }),
    mkSpacer(24),
    mkText(he(brief.contactReassurance || "No sales team. No automated funnel. A real reply from a real person."), stone),
  ], bone, { padY: "64" });

  var infoLeft = mkContainer([
    mkHeading("What happens next", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("You send a note. Within one business day, you hear back from the person who actually does the work. No account manager, no intro call just to learn what you need.", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var infoRight = mkContainer([
    mkHeading("Not sure what you need?", brassDp, "h6", { eyebrow: true }),
    mkSpacer(16),
    mkText("Tell us what the company does and what you are trying to show. That is enough to start. The right approach will become clear in the first conversation.", text),
  ], null, { padY: "0", grow: 1, isInner: true });

  var infoRow = mkContainer([infoLeft, infoRight], null, { direction: "row", gap: "64", padY: "0", isInner: true });
  var infoSection = mkContainer([infoRow], bone, { padY: "72" });

  var variantA = { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [headerA, formSectionA, infoSection, closingDark] };

  // ── Variant B: Split — big statement left, lean form right ────────────────
  var statementLeft = mkContainer([
    mkHeading(brief.contactEyebrow || "Contact", brassDp, "h6", { eyebrow: true }),
    mkSpacer(24),
    mkHeading(brief.contactH1 || "Tell us about your project.", ink, "h2", { font: "Fraunces", weight: 300, px: 56 }),
    mkSpacer(32),
    mkText(he(brief.contactIntro || "A quick note about what you need. You will get a real reply from a real person, usually within one business day."), text),
    mkSpacer(32),
    mkText(he(brief.contactReassurance || "No sales team. No automated funnel. A real reply from a real person."), stone),
  ], null, { padY: "0", grow: 1, isInner: true });

  var formRight = mkContainer([
    formPlaceholder,
    mkSpacer(24),
    mkButton(brief.contactCta || "Send it over", btnBg, btnText),
  ], null, { padY: "0", grow: 1, isInner: true });

  var splitRow = mkContainer([statementLeft, formRight], null, { direction: "row", gap: "80", padY: "0", isInner: true });
  var splitSection = mkContainer([splitRow], bone, { padY: "96" });

  var variantB = { version: "0.4", title: "Contact", type: "page", page_settings: {},
    content: [splitSection, closingDark] };

  var contactPattern = (patterns && patterns.contact) || "split-form";
  var recommended = (contactPattern === "split-form") ? "B" : "A";

  return { variantA: variantA, variantB: variantB, recommended: recommended };
}

