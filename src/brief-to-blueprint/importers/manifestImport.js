// Converts a Manifest export (see spec_manifest_export_example.json and the
// Manifest -> Spec Integration Requirements doc) into the flat brief shape
// generatePages() and the page builders already consume.
//
// This is a separate entry point from extractBrief.js on purpose — Manifest's
// shape (brand / page / blocks[], each block tagged with an elementType) is
// structurally different from both of extractBrief's supported formats, so it
// gets its own parser rather than overloading extractBrief with a third shape.
//
// NOT wired into the live upload flow yet. Call manifestToBrief() directly
// against a real exported file to validate the mapping before wiring this
// into IntakeForm.jsx's upload handler.

const REQUIRED_BRAND_FIELDS = ["id", "name"];
const REQUIRED_PAGE_FIELDS = ["id", "status", "blocks"];

// Element types Spec currently has a widget for. Anything outside this list
// still gets carried through (into brief._unmappedBlocks) instead of silently
// dropped, so the caller can surface "N blocks from this import weren't
// placed" instead of copy quietly going missing.
const MAPPED_TYPES = ["hero", "trust_stats", "feature", "faq", "testimonial", "map", "closing_cta"];

// Restricts a URL to safe schemes (http/https/tel/mailto/relative/anchor).
// Manifest export data is external, untrusted input — a URL field could
// carry a javascript: URI or similar. Duplicated here (rather than imported
// from helpers.js) so this parser has no dependency on the widget layer and
// can be unit-tested or reused independent of Elementor output.
var SAFE_URL_PATTERN = /^(https?:|tel:|mailto:|#|\/(?!\/))/i;
function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  var trimmed = url.trim();
  return SAFE_URL_PATTERN.test(trimmed) ? trimmed : "";
}

export class ManifestImportError extends Error {
  constructor(message, issues) {
    super(message);
    this.name = "ManifestImportError";
    this.issues = issues || [];
  }
}

// Throws with every problem found at once, not just the first one — so
// whoever's fixing the export (on either side) sees the full list in one
// pass instead of one round-trip per error.
export function validateManifestExport(raw) {
  var issues = [];
  if (!raw || typeof raw !== "object") {
    throw new ManifestImportError("Manifest export is not a valid object.", ["root: not an object"]);
  }

  if (!raw.brand || typeof raw.brand !== "object") {
    issues.push("brand: missing");
  } else {
    REQUIRED_BRAND_FIELDS.forEach(function (f) {
      if (!raw.brand[f]) issues.push("brand." + f + ": missing");
    });
  }

  if (!raw.page || typeof raw.page !== "object") {
    issues.push("page: missing");
  } else {
    REQUIRED_PAGE_FIELDS.forEach(function (f) {
      if (raw.page[f] === undefined || raw.page[f] === null) issues.push("page." + f + ": missing");
    });
    if (Array.isArray(raw.page.blocks) && raw.page.blocks.length === 0) {
      issues.push("page.blocks: empty — nothing to import");
    }
    if (raw.page.status && raw.page.status !== "final") {
      issues.push('page.status: "' + raw.page.status + '" — only "final" content should be imported, per the integration requirements doc');
    }
    (raw.page.blocks || []).forEach(function (b, i) {
      if (!b || !b.elementType) issues.push("page.blocks[" + i + "]: missing elementType");
    });
  }

  if (issues.length) {
    throw new ManifestImportError(
      "Manifest export failed validation (" + issues.length + " issue" + (issues.length > 1 ? "s" : "") + ").",
      issues
    );
  }
}

// Converts a validated Manifest export into Spec's flat brief shape.
// Throws ManifestImportError if validation fails — callers should catch
// this and show the .issues list rather than a generic parse error.
export function manifestToBrief(raw) {
  validateManifestExport(raw);

  var brand = raw.brand;
  var page = raw.page;
  var context = raw.context || {};

  var brief = {
    brandName: brand.name || "",
    colors: brand.colors || {},
    fonts: brand.fonts ? [brand.fonts.heading, brand.fonts.body].filter(Boolean) : undefined,
    referenceUrls: brand.referenceUrls || [],
    _manifestBrandId: brand.id,
    _manifestPageId: page.id,
    faqItems: [],
    _unmappedBlocks: [],
  };

  var featureCount = 0;
  var testimonialCount = 0;

  (page.blocks || []).forEach(function (block) {
    switch (block.elementType) {
      case "hero":
        brief.heroHeadline = block.title || "";
        brief.heroSubhead = block.subhead || "";
        brief.phoneCta = block.buttonLabel || "";
        brief.heroPrimaryUrl = sanitizeUrl(block.buttonUrl);
        brief.contactCta = block.secondaryButtonLabel || "";
        brief.heroSecondaryUrl = sanitizeUrl(block.secondaryButtonUrl);
        break;

      case "trust_stats":
        (block.stats || []).slice(0, 3).forEach(function (stat, i) {
          brief["trustStat" + (i + 1)] = stat.value || "";
          brief["trustLabel" + (i + 1)] = stat.label || "";
        });
        break;

      case "feature":
        featureCount += 1;
        if (featureCount <= 3) {
          brief["feature" + featureCount + "Heading"] = block.heading || "";
          brief["feature" + featureCount + "Body"] = block.body || "";
        } else {
          brief._unmappedBlocks.push({
            elementType: "feature",
            reason: "only 3 feature rows supported per landing page",
            block: block,
          });
        }
        break;

      case "faq":
        if (block.heading) brief.faqHeading = block.heading;
        (block.items || []).forEach(function (item) {
          brief.faqItems.push({ question: item.question || "", answer: item.answer || "" });
        });
        break;

      case "testimonial":
        testimonialCount += 1;
        if (testimonialCount <= 3) {
          brief["testimonial" + testimonialCount + "Quote"] = block.quote || "";
          brief["testimonial" + testimonialCount + "Name"] = block.name || "";
          brief["testimonial" + testimonialCount + "Title"] = block.title || "";
        } else {
          brief._unmappedBlocks.push({
            elementType: "testimonial",
            reason: "only 3 testimonials supported per landing page",
            block: block,
          });
        }
        break;

      case "map":
        brief.mapAddress = block.address || "";
        brief.mapUrl = sanitizeUrl(block.mapUrl);
        break;

      case "closing_cta":
        brief.closingCta = block.headline || "";
        brief.closingBody = block.body || "";
        break;

      default:
        brief._unmappedBlocks.push({
          elementType: block.elementType,
          reason: "no matching Spec widget yet",
          block: block,
        });
    }
  });

  // AI-drafting context, carried through for reference — not consumed by any
  // builder yet, but useful once blank-field drafting reads brief context.
  if (context.valueProposition) brief._manifestValueProposition = context.valueProposition;
  if (context.targetAudience) brief._manifestTargetAudience = context.targetAudience;
  if (context.phone && !brief.phoneCta) brief.phoneCta = "Call " + context.phone;
  if (context.address && !brief.mapAddress) brief.mapAddress = context.address;

  return brief;
}
