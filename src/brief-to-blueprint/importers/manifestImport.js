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

// Flattens a rich-text array (e.g. hero.subheading: [{type:"text", text},
// {type:"link", text, url}]) into a plain string. Every run type with a
// .text field contributes its visible text -- including link runs, whose
// visible text is real content even though the href itself has nowhere to
// go, since Spec's text widgets are plain text, not rich HTML with
// embedded anchors.
function flattenRichText(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.map(function (item) { return item && item.text ? item.text : ""; }).join("").trim();
}

// Flattens a text_section's `items` into a plain string. Handles both
// documented item kinds: "paragraph" (a rich_text run) and "list" (ordered
// or unordered entries, each its own RichText) -- the list case was missing
// entirely before, silently dropping any list content.
function flattenTextSectionBody(items) {
  if (!Array.isArray(items)) return "";
  return items
    .map(function (item) {
      if (!item) return "";
      if (item.kind === "paragraph" && Array.isArray(item.rich_text)) {
        return flattenRichText(item.rich_text);
      }
      if (item.kind === "list" && Array.isArray(item.entries)) {
        return item.entries
          .map(function (entry, i) { return (item.ordered ? (i + 1) + ". " : "\u2022 ") + flattenRichText(entry); })
          .join("\n");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

// A button's real destination, or "" if it's explicitly a placeholder.
// destination.kind === "placeholder" is Manifest's own system telling us
// the real URL isn't decided yet -- more reliable than guessing, so it's
// treated the same as "blank." Handles all 4 real kinds: internal/external
// are already URLs or paths; tel/email need their scheme prefixed before
// sanitizeUrl will allow them through (a bare phone number like
// "6103980393" isn't a URL sanitizeUrl recognizes on its own).
function pageDocumentButtonUrl(button) {
  if (!button || !button.destination || !button.destination.value) return "";
  var d = button.destination;
  if (d.kind === "tel") return sanitizeUrl(d.value.indexOf("tel:") === 0 ? d.value : "tel:" + d.value);
  if (d.kind === "email") return sanitizeUrl(d.value.indexOf("mailto:") === 0 ? d.value : "mailto:" + d.value);
  return sanitizeUrl(d.value); // internal or external
}

function validateManifestPageDocument(raw) {
  var issues = [];
  if (!raw.brand || !raw.brand.id) issues.push("brand.id: missing");
  if (!raw.brand || !raw.brand.name) issues.push("brand.name: missing");
  if (!raw.page || !raw.page.id) issues.push("page.id: missing");
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) issues.push("sections: missing or empty");

  var state = raw.provenance && raw.provenance.content_state;
  if (state && state !== "marketing_approved" && state !== "leadership_approved") {
    issues.push('provenance.content_state: "' + state + '" -- only marketing_approved or leadership_approved content should be imported');
  }

  if (issues.length) {
    throw new ManifestImportError(
      "Manifest page-document export failed validation (" + issues.length + " issue" + (issues.length > 1 ? "s" : "") + ").",
      issues
    );
  }
}

// Converts a validated manifest.page-document/1 export into Spec's flat
// brief shape. Rewritten against the real, formal contract (page-document-v1.md
// + page-document-v1.schema.json) rather than pattern-matching a single
// sample -- the earlier version got two things wrong that looked right
// against one file: FAQ detection via heading.level === 3 (an accidental
// correlation, not a real rule -- faq is its own explicit section type) and
// closing-CTA detection via "last section with buttons" (a real fallback,
// but cta is the documented signal and takes priority when present).
//
// Section-type coverage, all 8 from the v1 catalog:
// - hero, testimonials -- map directly.
// - feature_cards -- maps directly to brief.features (title/body/image).
// - faq -- maps directly to brief.faqItems.
// - cta -- if any section has this explicit type, it's the closing CTA;
//   text_section's "last section with buttons" is only used as a fallback
//   when no explicit cta section exists (real files may use either).
// - map_location -- builds brief.mapAddress from location.{street,city,
//   region,postal_code} when present. When absent (confirmed real case:
//   Manifest doesn't always have structured address data), the section's
//   note text still becomes a feature row rather than silently vanishing
//   -- never invents an address, never drops real prose either.
// - form -- maps to the Variant B lead-form fields Spec already has a
//   widget for (formHeading/formSubhead/formFields).
// - text_section -- every remaining one becomes a feature row via
//   brief.features (landing.js accepts any number of these).
// - Anything outside this catalog is flagged in _unmappedBlocks, never
//   dropped silently -- matches the spec's own "unknown section types must
//   never crash" rule while still surfacing that something didn't land.
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
    // Surfaces Manifest's own audit trail -- flagged claims needing a real
    // receipt, unverified technical claims pending expert review, buttons
    // still pointing at placeholders -- so a human sees exactly what needs
    // attention before this ships, instead of it silently disappearing.
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
  // content_flags (1.1.0, additive) -- operator-marked flags on claims in
  // THIS page's copy, distinct from claim_flags (which flag the brand
  // memory generally). Every content flag counts against `clean`, so it
  // deserves the same visibility claim_flags already gets.
  if (Array.isArray(provenance.content_flags)) {
    provenance.content_flags.forEach(function (cf) {
      brief._manifestWarnings.push(
        'Unverified claim (' + (cf.status || "flagged") + '): "' + (cf.claim || "") + '"' + (cf.note ? " -- " + cf.note : "")
      );
    });
  }

  var featurePairs = [];
  var faqPairs = [];
  var hasCtaType = sections.some(function (s) { return s.type === "cta"; });

  sections.forEach(function (section, idx) {
    var isLast = idx === sections.length - 1;
    var headingText = section.heading ? section.heading.text || "" : "";

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
        brief["testimonial" + (i + 1) + "Title"] = t.role || "";
      });
      return;
    }

    if (section.type === "feature_cards") {
      (section.items || []).forEach(function (item) {
        featurePairs.push({ heading: item.title || "", body: flattenRichText(item.body) });
      });
      return;
    }

    if (section.type === "faq") {
      (section.items || []).forEach(function (item) {
        faqPairs.push({ question: item.question || "", answer: flattenRichText(item.answer) });
      });
      if (headingText && !brief.faqHeading) brief.faqHeading = headingText;
      return;
    }

    if (section.type === "cta") {
      brief.closingCta = headingText;
      brief.closingBody = flattenRichText(section.body);
      return;
    }

    if (section.type === "map_location") {
      var loc = section.location || {};
      var addressParts = [loc.street, loc.city, loc.region, loc.postal_code].filter(Boolean);
      var noteText = flattenRichText(section.note);
      if (addressParts.length) {
        brief.mapAddress = addressParts.join(", ");
        var mapBtnUrl = pageDocumentButtonUrl(section.button);
        if (mapBtnUrl) brief.mapUrl = mapBtnUrl;
        if (noteText) brief._manifestMapNote = noteText;
      } else if (noteText) {
        // No structured address to build the real map widget from -- the
        // content is still real, so it becomes a feature row instead of
        // silently disappearing. Never invents an address to fill the gap.
        featurePairs.push({ heading: headingText, body: noteText });
      }
      return;
    }

    if (section.type === "form") {
      brief.formHeading = headingText;
      brief.formSubhead = flattenRichText(section.body);
      brief.formFields = (section.fields || []).map(function (f) { return f.label || ""; }).filter(Boolean);
      return;
    }

    if (section.type === "text_section") {
      if (!hasCtaType && isLast && section.buttons && section.buttons.length) {
        brief.closingCta = headingText;
        brief.closingBody = flattenTextSectionBody(section.items);
        return;
      }
      featurePairs.push({ heading: headingText, body: flattenTextSectionBody(section.items) });
      return;
    }

    // Unknown section type -- per the spec's own additive-versioning rule,
    // this must never crash. Flagged, not dropped: if there's readable
    // text on it, surface that too rather than losing it entirely.
    brief._unmappedBlocks.push({ elementType: section.type, reason: "no matching Spec widget yet", heading: headingText });
  });

  if (featurePairs.length) brief.features = featurePairs;
  if (faqPairs.length) brief.faqItems = faqPairs;

  // One-off curated layout for a specific real page, set up directly at
  // Kalei's request after reviewing a mockup of it, then revised once more
  // (July 2026) to match her actual final, edited-in-Elementor version —
  // order changed, the form moved to after the closing CTA, and the real
  // shop address (found in her edited export, not previously available
  // anywhere in the Manifest data) now drives a real Google Maps widget.
  // The underlying mechanisms (brief.featureLayout, brief.postClosingLayout
  // — see landing.js's renderFeatureLayout/makePostClosingRows) are real
  // and reusable; this is just their first concrete usage, keyed to this
  // exact page.id until a proper per-section style picker exists in the
  // UI. Should move there once that's built, not accumulate more page-id
  // special cases here.
  var AFS_SAGINAW_PAGE_ID = "49c7efb7-c26a-4eb1-a287-7656f10b8472";
  if (page.id === AFS_SAGINAW_PAGE_ID && brief.features && brief.features.length >= 11) {
    brief.featureLayout = [
      { style: "split-right", indices: [0] },
      { style: "centered-cta", indices: [1] },
      { style: "split-left", indices: [2] },
      { style: "grouped-header", header: "Our Services", indices: [3, 4] },
      { style: "split-cta-right", indices: [5] },
      { style: "plain", indices: [7] },
      { style: "split-left", indices: [8] },
      { style: "plain", indices: [10] },
      { style: "map-beside", indices: [9] },
    ];
    // The pricing/form section ended up after the closing CTA in the
    // actual reviewed page, not with the other feature rows.
    brief.postClosingLayout = [
      { style: "embedded-form", indices: [6] },
    ];
    brief.skipServicesChecklist = true;
    // Real address, confirmed from her own edited export — Manifest's
    // source data never included one, so this couldn't have been set any
    // earlier than discovering it there.
    if (!brief.mapAddress) brief.mapAddress = "1013 Jarvis RD, Saginaw, TX 76179";
  }

  return brief;
}

// --- Public entry point -----------------------------------------------------

// Dispatches to the real page-document parser or the legacy schema parser
// based on the export's own `format` marker. Throws ManifestImportError if
// validation fails for whichever path is used -- callers should catch this
// and show the .issues list rather than a generic parse error.
export function manifestToBrief(raw) {
  if (raw && raw.format === PAGE_DOCUMENT_FORMAT) {
    return manifestPageDocumentToBrief(raw);
  }
  return legacyManifestToBrief(raw);
}
