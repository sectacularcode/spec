// Converts a Manifest export into the flat brief shape generatePages() and
// the page builders already consume. Supports two formats:
//
// 1. manifest.page-document/1 — Manifest's real, already-existing native
//    export format (confirmed against a real file her system produced,
//    July 2026): { format, brand, page, provenance, brand_tokens,
//    sections[] }, each section tagged with a `type` (hero/text_section/
//    testimonials), not the original spec's `elementType`. This is the
//    live path — everything she actually sends comes in this shape.
//
// 2. The original brand/page.blocks[]/elementType shape from the initial
//    integration requirements doc — kept working for backward
//    compatibility with anything already built or tested against it
//    (spec_manifest_export_example.json, the Foothold Bouldering test
//    file), but not what Manifest actually produces in practice.
//
// manifestToBrief() dispatches on the `format` field. Both paths are
// separate from extractBrief.js on purpose — neither shape matches either
// of extractBrief's supported formats, so this stays its own entry point
// rather than overloading extractBrief with a third/fourth shape.

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

// Converts a validated legacy-format Manifest export into Spec's flat brief
// shape. Throws ManifestImportError if validation fails.
function legacyManifestToBrief(raw) {
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

// ─── manifest.page-document/1 — the real, live format ──────────────────────

const PAGE_DOCUMENT_FORMAT = "manifest.page-document/1";

// Flattens a rich-text array (e.g. hero.subheading: [{type:"text", text}])
// into a plain string. Manifest's rich-text arrays can in principle carry
// more than plain text runs; anything without a .text field is skipped
// rather than guessed at.
function flattenRichText(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.map(function (item) { return item && item.text ? item.text : ""; }).join("").trim();
}

// Flattens a text_section's `items` (paragraph blocks, each with its own
// rich_text array) into a plain string, paragraphs separated by a blank
// line. Only "paragraph" items are read — other item kinds (if Manifest
// adds them later) are skipped rather than guessed at.
function flattenTextSectionBody(items) {
  if (!Array.isArray(items)) return "";
  return items
    .map(function (item) {
      if (item && item.kind === "paragraph" && Array.isArray(item.rich_text)) {
        return item.rich_text.map(function (rt) { return rt && rt.text ? rt.text : ""; }).join("");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

// A button's real destination, or "" if it's explicitly marked as a
// placeholder. destination.kind === "placeholder" is Manifest's own system
// telling us the real URL isn't decided yet — that's a more reliable
// signal than guessing, so it's treated the same as "blank."
function pageDocumentButtonUrl(button) {
  if (!button || !button.destination) return "";
  if (button.destination.kind === "external" && button.destination.value) {
    return sanitizeUrl(button.destination.value);
  }
  return "";
}

function validateManifestPageDocument(raw) {
  var issues = [];
  if (!raw.brand || !raw.brand.id) issues.push("brand.id: missing");
  if (!raw.brand || !raw.brand.name) issues.push("brand.name: missing");
  if (!raw.page || !raw.page.id) issues.push("page.id: missing");
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) issues.push("sections: missing or empty");

  var state = raw.provenance && raw.provenance.content_state;
  if (state && state !== "marketing_approved") {
    issues.push('provenance.content_state: "' + state + '" — only marketing_approved content should be imported');
  }

  if (issues.length) {
    throw new ManifestImportError(
      "Manifest page-document export failed validation (" + issues.length + " issue" + (issues.length > 1 ? "s" : "") + ").",
      issues
    );
  }
}

// Converts a validated manifest.page-document/1 export into Spec's flat
// brief shape. Section-type mapping, grounded against a real export:
//
// - "hero" sections map directly.
// - "testimonials" sections map directly (no title/company field exists in
//   this format, so testimonial*Title stays blank rather than invented).
// - Within "text_section" entries, heading.level === 3 is used ONLY for
//   Q&A pairs in the real export this was built against — a genuine
//   structural signal already present in the data, not a guess.
// - The last section, if it carries buttons, is treated as the closing
//   CTA — confirmed against the real export, where every page ends this
//   way.
// - Every other text_section becomes a feature row via brief.features
//   (landing.js now accepts any number of these — no 3-row cap, so a page
//   with 10+ real content sections gets all of them placed).
// - Any section type outside hero/text_section/testimonials is flagged in
//   _unmappedBlocks rather than dropped.
function manifestPageDocumentToBrief(raw) {
  validateManifestPageDocument(raw);

  var brand = raw.brand;
  var page = raw.page || {};
  var sections = raw.sections || [];
  var provenance = raw.provenance || {};

  var brief = {
    brandName: brand.name || "",
    colors: {}, // not carried in this format
    referenceUrls: (raw.brand_tokens && raw.brand_tokens.reference_urls) || [],
    _manifestBrandId: brand.id,
    _manifestPageId: page.id,
    _manifestTitleTag: page.title_tag || "",
    _manifestMetaDescription: page.meta_description || "",
    faqItems: [],
    _unmappedBlocks: [],
    // Surfaces Manifest's own audit trail — flagged claims needing a real
    // receipt, buttons still pointing at placeholders — so a human sees
    // exactly what needs attention before this ships, instead of it
    // silently disappearing during import.
    _manifestWarnings: [],
  };

  if (provenance.clean === false && provenance.clean_reason) {
    brief._manifestWarnings.push(provenance.clean_reason);
  }
  if (provenance.grounding && Array.isArray(provenance.grounding.claim_flags)) {
    provenance.grounding.claim_flags.forEach(function (cf) {
      brief._manifestWarnings.push(
        'Unverified claim: "' + (cf.claim || "") + '" (scope: ' + (cf.scope || "unknown") + ", receipt: " + (cf.receipt || "missing") + ")"
      );
    });
  }

  var featurePairs = [];
  var faqPairs = [];

  sections.forEach(function (section, idx) {
    var isLast = idx === sections.length - 1;
    var headingText = section.heading ? section.heading.text || "" : "";
    var headingLevel = section.heading ? section.heading.level : null;

    if (section.type === "hero") {
      var heroButtons = section.buttons || [];
      brief.heroHeadline = headingText;
      brief.heroSubhead = flattenRichText(section.subheading);
      brief.phoneCta = heroButtons[0] ? heroButtons[0].label || "" : "";
      brief.heroPrimaryUrl = pageDocumentButtonUrl(heroButtons[0]);
      brief.contactCta = heroButtons[1] ? heroButtons[1].label || "" : "";
      brief.heroSecondaryUrl = pageDocumentButtonUrl(heroButtons[1]);
      return;
    }

    if (section.type === "testimonials") {
      (section.items || []).slice(0, 3).forEach(function (t, i) {
        brief["testimonial" + (i + 1) + "Quote"] = t.quote || "";
        brief["testimonial" + (i + 1) + "Name"] = t.author || "";
        brief["testimonial" + (i + 1) + "Title"] = "";
      });
      return;
    }

    if (section.type === "text_section") {
      if (headingLevel === 3) {
        faqPairs.push({ question: headingText, answer: flattenTextSectionBody(section.items) });
        return;
      }

      if (isLast && section.buttons && section.buttons.length) {
        brief.closingCta = headingText;
        brief.closingBody = flattenTextSectionBody(section.items);
        return;
      }

      // No cap here — every real content section becomes a feature row.
      // landing.js's makeFeatureRows() now accepts brief.features as a
      // variable-length array (see landing.js), so a page with 10+ real
      // sections gets all of them placed instead of the first 3 kept and
      // the rest flagged as unmapped.
      featurePairs.push({ heading: headingText, body: flattenTextSectionBody(section.items) });
      return;
    }

    brief._unmappedBlocks.push({ elementType: section.type, reason: "no matching Spec widget yet", heading: headingText });
  });

  if (featurePairs.length) brief.features = featurePairs;
  if (faqPairs.length) brief.faqItems = faqPairs;

  return brief;
}

// ─── Public entry point ─────────────────────────────────────────────────────

// Dispatches to the real page-document parser or the legacy schema parser
// based on the export's own `format` marker. Throws ManifestImportError if
// validation fails for whichever path is used — callers should catch this
// and show the .issues list rather than a generic parse error.
export function manifestToBrief(raw) {
  if (raw && raw.format === PAGE_DOCUMENT_FORMAT) {
    return manifestPageDocumentToBrief(raw);
  }
  return legacyManifestToBrief(raw);
}
