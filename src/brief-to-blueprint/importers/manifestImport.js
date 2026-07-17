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

      // Element types Spec currently has a widget for are exactly the case
      // labels above (hero, trust_stats, feature, faq, testimonial, map,
      // closing_cta). Anything outside that list falls through to here and
      // still gets carried through (into brief._unmappedBlocks) instead of
      // silently dropped, so the caller can surface "N blocks from this
      // import weren't placed" instead of copy quietly going missing.
      //
      // This used to be tracked separately as a MAPPED_TYPES array, defined
      // but never actually referenced anywhere -- this switch's own case
      // list was already the real, active source of truth, and the array
      // was dead weight duplicating it. Removed the array; if a genuine
      // need for a standalone list of known types comes up later (e.g. for
      // validation before this switch runs), derive it from these case
      // labels rather than maintaining a second hardcoded copy that can
      // drift out of sync with what's actually handled below.
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

  // Manifest has no concept of a real services checklist and never sends
  // brief.servicesList -- without this, the checklist section defaulted to
  // showing fabricated "Service one, Service two..." filler on every single
  // imported page, requiring it to be manually hidden every time. Confirmed
  // real complaint, July 2026: no real content there should mean the section
  // doesn't render, not that it renders with invented placeholder text.
  if (!Array.isArray(brief.servicesList) || brief.servicesList.length === 0) {
    brief.skipServicesChecklist = true;
  }

  // Same class of bug, same fix: the current page-document format has no
  // trust_stats section type at all (confirmed against the real v1.5.0
  // schema), so trustStat1-3 never get set for any current-format
  // import -- every page defaulted to showing fabricated "10+ Years in
  // business / 500+ Projects completed / 98% Client satisfaction," not
  // real content. The legacy format DOES have a real trust_stats block it
  // can parse (see the legacy dispatch above), so this only fires when no
  // real value actually made it through either path.
  if (!brief.trustStat1 && !brief.trustStat2 && !brief.trustStat3) {
    brief.skipTrustStats = true;
  }

  return brief;
}

// ─── manifest.page-document/1 — the real, live format ──────────────────────

const PAGE_DOCUMENT_FORMAT = "manifest.page-document/1";

// Flattens a rich-text array (e.g. hero.subheading: [{type:"text", text},
// {type:"link", text, url}]) into a plain string. Every run type with a
// .text field contributes its visible text -- including link runs, whose
// visible text is real content even though the href gets dropped here.
// Correct for every RichText field EXCEPT faq item.answer -- see
// richTextToSafeHtml below for that one, and why it needs different
// handling (most of Spec's text widgets genuinely are plain text with no
// anchor support, but Elementor's accordion tab_content, which is what faq
// answers render into, is a real WYSIWYG field -- confirmed against
// helpers.js's mkAccordion).
function flattenRichText(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.map(function (item) { return item && item.text ? item.text : ""; }).join("").trim();
}

// Minimal, local HTML-escape -- duplicated rather than imported, same
// reasoning as sanitizeUrl above: this parser stays free of any dependency
// on the widget/rendering layer so it can be unit-tested or reused on its
// own.
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Renders a rich-text array to safe, ready-to-embed HTML, preserving link
// runs as real <a href> anchors instead of dropping their destination --
// unlike flattenRichText, which is correct everywhere else RichText
// appears but was silently losing every link inside a faq answer (flagged
// directly in Manifest's own v1.5.0 handoff doc). Escapes each run's own
// text individually before assembling, so the result is safe to drop
// straight into Elementor JSON as-is -- callers must NOT run this through
// an HTML-escape again, or the real <a> tags themselves get escaped into
// visible text instead of rendering as links. An unresolvable/unsafe URL
// (sanitizeUrl returns "") keeps the run's visible text and silently
// drops just the link, rather than shipping a broken or dangerous href.
function richTextToSafeHtml(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.map(function (item) {
    if (!item || !item.text) return "";
    if (item.type === "link") {
      var safeUrl = sanitizeUrl(item.url);
      if (safeUrl) return '<a href="' + escapeHtml(safeUrl) + '">' + escapeHtml(item.text) + "</a>";
    }
    return escapeHtml(item.text);
  }).join("").trim();
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
    // brand_tokens.colors/fonts are open key-value objects in the real
    // schema (any string key), currently unpopulated in every real export
    // seen so far -- but the field itself already exists, so this reads
    // it whenever it's there rather than assuming it never will be.
    // Spec's color slots expect specific keys (ink/brass/brass-deep/bone/
    // asphalt/stone/warm-white/text) -- Manifest sending those exact names
    // makes this a direct match; anything else still degrades gracefully,
    // since every one of Spec's color reads already has its own per-key
    // fallback (confirmed fix, July 2026 -- see landing.js/buildPreviewHTML.js).
    colors: (raw.brand_tokens && raw.brand_tokens.colors) || {},
    // Other builders (home.js, generic.js) read brief.fonts as an array
    // ([heading, body]), not an object -- Manifest's brand_tokens.fonts is
    // an open object, so this converts rather than passing through raw,
    // which would silently mismatch (fonts[1] on an object is undefined,
    // not a crash, but not the real font either). Recommends "heading"/
    // "body" as the two keys Manifest sends, since those are what this
    // maps from.
    fonts: (raw.brand_tokens && raw.brand_tokens.fonts)
      ? [raw.brand_tokens.fonts.heading || raw.brand_tokens.fonts.body, raw.brand_tokens.fonts.body || raw.brand_tokens.fonts.heading]
      : undefined,
    referenceUrls: (raw.brand_tokens && raw.brand_tokens.reference_urls) || [],
    _manifestBrandId: brand.id,
    _manifestPageId: page.id,
    _manifestTitleTag: page.title_tag || "",
    _manifestMetaDescription: page.meta_description || "",
    faqItems: [],
    _unmappedBlocks: [],
    // Surfaces Manifest's own audit trail -- flagged claims needing a real
    // receipt, unverified technical claims pending expert review -- so a
    // human sees exactly what needs attention before this ships, instead
    // of it silently disappearing. Distinct from _placeholderButtons below:
    // this is Manifest's own freeform prose passed through as-is, genuinely
    // secondary (each item already has its own correction path -- a
    // write-back mechanism, a CFR citation to verify against). Nothing in
    // here is an action Kalei needs to take before publishing.
    _manifestWarnings: [],
    // Structural check Spec does itself, not dependent on parsing
    // Manifest's prose -- every button whose real URL came back empty
    // (pageDocumentButtonUrl returning "") but which has a real label,
    // meaning it's a genuine button that's missing its destination, not an
    // unused slot. Unlike _manifestWarnings, every item here is a real
    // "you must supply this before publishing" requirement -- a placeholder
    // button ships as a dead link if nobody fills it in.
    _placeholderButtons: [],
  };

  // page.type (1.5.0, additive) -- routes an import to the right Spec page
  // type instead of every Manifest import hardcoding "other" at the call
  // site. Deliberately narrower than Manifest's own suggested mapping
  // table: checked each candidate builder's real field reads before
  // trusting it, not just the table. home.js reads brief.serviceCards/
  // whoH2/differenceEyebrow/workItems/pricingH2..., services.js reads
  // brief.pricingTiers/pricingMenu/servicesH1..., and the generic-page
  // fallback (buildGenericPage, what any other unmapped pid lands on)
  // reads only brandName/tagline/hookStatement/buttons -- none of them
  // read brief.features/faqItems/testimonials/mapAddress, which is the
  // entire vocabulary this function actually produces. Only pid "landing"
  // and pid "other" dispatch to buildLandingPage, the one builder that
  // reads that vocabulary (generatePages.js: `pid === "landing" || pid
  // === "other"`) -- routing "homepage"/"service_detail"/"blog"/
  // "category" to their suggested builders would silently ship a page
  // missing every real section from the export. So: "landing" gets its
  // own real pid (a genuine improvement over "other" -- correct label,
  // correct slug); "local_service" also routes to "landing", not
  // Manifest's suggested "location" pid (that builder is Spec's own
  // manually-curated multi-location workflow -- brief.locationData:
  // intro/services/supportBody/mapEmbed, none of which this parser
  // produces -- Variant F already consumes exactly what map_location
  // sends and is production-tested on MESO and Freeway); everything else
  // (including absent/unrecognized types) falls back to "other",
  // unchanged from today's existing behavior.
  if (page.type === "landing") {
    brief._suggestedPid = "landing";
  } else if (page.type === "local_service") {
    brief._suggestedPid = "landing";
    brief._suggestedVariant = "F";
  } else {
    brief._suggestedPid = "other";
  }

  // Tracks a button in _placeholderButtons only when it's a genuine labeled
  // button with no resolvable URL -- an empty button slot (no label at all)
  // isn't a placeholder, it's just absent, and shouldn't show up as
  // something to fix.
  function trackPlaceholderButton(label, url, section) {
    if (label && !url) brief._placeholderButtons.push({ label: label, section: section });
  }

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
      trackPlaceholderButton(brief.phoneCta, brief.heroPrimaryUrl, "Hero");
      brief.contactCta = heroButtons[1] ? heroButtons[1].label || "" : "";
      brief.heroSecondaryUrl = pageDocumentButtonUrl(heroButtons[1]);
      trackPlaceholderButton(brief.contactCta, brief.heroSecondaryUrl, "Hero");
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
        faqPairs.push({ question: item.question || "", answer: richTextToSafeHtml(item.answer), answerIsHtml: true });
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
      // mode (1.2.0, additive): "pin" is a real storefront customers visit;
      // "service_area" is a mobile/no-storefront business with no single
      // destination to send someone to. Missing mode = pin, matching the
      // format spec's own stated default.
      var mode = section.mode === "service_area" ? "service_area" : "pin";
      if (addressParts.length) {
        brief.mapAddress = addressParts.join(", ");
        brief.mapMode = mode;
        // Kept separately from the concatenated mapAddress string above --
        // needed to disambiguate multiple location pages for the same
        // brand (e.g. Allentown vs Bethlehem) in the generated page title,
        // which a parsed substring of mapAddress can't cleanly provide.
        if (loc.city) brief.mapCity = loc.city;
        // phone/hours/email: not part of the schema yet (requested
        // alongside the structured location object), but reading them now
        // means this works the moment Manifest starts sending them, with
        // zero further Spec changes needed.
        if (section.phone) brief.mapPhone = section.phone;
        if (section.hours) brief.mapHours = section.hours;
        if (section.email) brief.mapEmail = section.email;
        // Manifest's own section heading/button label were previously
        // discarded here in favor of the builder's hardcoded "Find Us" /
        // "Get Directions" -- inconsistent with every other section type in
        // this file, which all prefer real supplied copy over an invented
        // default. Pass them through; the builder still falls back to its
        // own defaults when either is absent.
        if (headingText) brief.mapHeading = headingText;
        if (section.button && section.button.label) brief.mapButtonLabel = section.button.label;
        // directions_url / maps_url (1.2.0) are computed straight from the
        // governed address -- prefer them outright over the button's own
        // destination, which is very often an unresolved placeholder (real
        // case: the AFS Saginaw sample ships one, so brief.mapUrl was
        // silently ending up empty and the whole "Get Directions" button
        // was quietly not rendering). Pin mode wants a real point-to-point
        // route (directions_url); service-area mode has no single
        // destination to route to, so the general maps_url search link is
        // the one that actually fits there. Both fall back to the button
        // URL for pre-1.2.0 exports that don't carry the new fields yet.
        var btnUrl = pageDocumentButtonUrl(section.button);
        var directionsUrl = section.directions_url || btnUrl;
        var viewUrl = section.maps_url || btnUrl;
        brief.mapUrl = mode === "service_area" ? (viewUrl || directionsUrl) : (directionsUrl || viewUrl);
        // directions_url/maps_url (both computed from the governed address,
        // not the button itself) can genuinely fill in even when the
        // button's own destination is a placeholder -- only flag this one
        // if brief.mapUrl itself came back empty, meaning nothing resolved.
        trackPlaceholderButton(section.button && section.button.label, brief.mapUrl, "Map");
        if (noteText) brief._manifestMapNote = noteText;
      } else if (noteText) {
        // No structured address to build the real map widget from -- the
        // content is still real, so it becomes a feature row instead of
        // silently disappearing. Never invents an address to fill the gap.
        featurePairs.push({ heading: headingText, body: noteText });
        // The section's own button (e.g. "Get Directions") has nowhere to
        // render without a real map, but it must still be tracked --
        // confirmed real bug, July 2026: this was the one place on the page
        // where a button could silently disappear entirely (not rendered,
        // not flagged, just gone), because the primary branch above is the
        // only place trackPlaceholderButton() normally runs for map_location,
        // and map_location is deliberately excluded from the generic
        // catch-all pass below (it has its own directions_url/maps_url-aware
        // logic that pass doesn't know about). This fallback needs its own
        // check so a button here gets the same "needs a real destination"
        // visibility as every other button on the page.
        trackPlaceholderButton(section.button && section.button.label, pageDocumentButtonUrl(section.button), "Map");
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
      // Capture the section's own button (label + resolved URL) so a real,
      // page-specific CTA (e.g. "See how our mobile and on-site fleet
      // service works.") survives into the built page instead of being
      // silently dropped -- confirmed real gap, July 2026: this only ever
      // fed heading/body into featurePairs, so every text_section button
      // except the page's final closing CTA had nowhere to render at all.
      // Only the first button is kept, matching the single-button-per-row
      // capacity every landing.js row style has; a second real button on
      // the same section still gets its normal placeholder-tracking pass
      // below, same as before.
      var secBtn = section.buttons && section.buttons[0];
      featurePairs.push({
        heading: headingText,
        body: flattenTextSectionBody(section.items),
        buttonLabel: secBtn ? secBtn.label || "" : "",
        buttonUrl: secBtn ? pageDocumentButtonUrl(secBtn) : "",
      });
      return;
    }

    // Unknown section type -- per the spec's own additive-versioning rule,
    // this must never crash. Flagged, not dropped: if there's readable
    // text on it, surface that too rather than losing it entirely.
    brief._unmappedBlocks.push({ elementType: section.type, reason: "no matching Spec widget yet", heading: headingText });
  });

  // Second pass, deliberately separate from the type-dispatch loop above:
  // catches placeholder buttons on every OTHER section type. hero and
  // map_location are excluded here since they're already tracked above
  // with their own fallback-aware logic (map's directions_url/maps_url can
  // resolve even when the raw button is a placeholder -- this generic pass
  // doesn't know that nuance, so it must not re-check map). Confirmed via
  // a real file (AFS Saginaw round 3) that text_section inline/secondary
  // buttons -- including the page's actual closing CTA button -- were
  // being silently missed entirely without this: the original hero+map-only
  // check caught 1 of 4 real placeholder buttons in that file.
  sections.forEach(function (section) {
    if (section.type === "hero" || section.type === "map_location") return;
    (section.buttons || []).forEach(function (btn) {
      trackPlaceholderButton(btn && btn.label, pageDocumentButtonUrl(btn), section.type === "text_section" ? "Body" : section.type);
    });
  });

  if (featurePairs.length) brief.features = featurePairs;
  if (faqPairs.length) brief.faqItems = faqPairs;

  // The one-off AFS_BRAND_ID curated layout that used to live here has
  // been removed -- brief.featureLayout/postClosingLayout are now set
  // through a real per-section style picker in the UI (index.jsx),
  // available for any brand rather than one hardcoded id. If AFS's page
  // needs regenerating from a fresh Manifest export, its layout (split
  // right/centered callout/split left/grouped "Our Services" pair/split +
  // button/plain rows/map beside, with the pricing form moved after the
  // closing CTA) can be reproduced through that picker directly.

  // Manifest has no concept of a real services checklist and never sends
  // brief.servicesList -- without this, the checklist section defaulted to
  // showing fabricated "Service one, Service two..." filler on every single
  // imported page, requiring it to be manually hidden every time. Confirmed
  // real complaint, July 2026: no real content there should mean the section
  // doesn't render, not that it renders with invented placeholder text.
  if (!Array.isArray(brief.servicesList) || brief.servicesList.length === 0) {
    brief.skipServicesChecklist = true;
  }

  // Same class of bug, same fix: the current page-document format has no
  // trust_stats section type at all (confirmed against the real v1.5.0
  // schema), so trustStat1-3 never get set for any current-format
  // import -- every page defaulted to showing fabricated "10+ Years in
  // business / 500+ Projects completed / 98% Client satisfaction," not
  // real content. The legacy format DOES have a real trust_stats block it
  // can parse (see the legacy dispatch above), so this only fires when no
  // real value actually made it through either path.
  if (!brief.trustStat1 && !brief.trustStat2 && !brief.trustStat3) {
    brief.skipTrustStats = true;
  }

  return brief;
}

// --- Public entry point -----------------------------------------------------

// Dispatches to the real page-document parser or the legacy schema parser
// based on the export's own `format` marker. Throws ManifestImportError if
// validation fails for whichever path is used -- callers should catch this
// and show the .issues list rather than a generic parse error.
export function manifestToBrief(raw) {
  // Wrong-file guard: a Spec-generated Elementor template dragged back into
  // this importer used to fail with a generic "brand: missing / page: missing"
  // list, which reads like a Manifest schema problem when it's really the
  // reverse of the July 2026 mix-up (Manifest export uploaded to WordPress).
  // Elementor templates are unmistakable: content array + version, and none
  // of Manifest's identifying fields (format/brand/sections).
  if (raw && Array.isArray(raw.content) && raw.version && !raw.format && !raw.brand && !raw.sections) {
    throw new ManifestImportError(
      "This is a Spec-generated Elementor template, not a Manifest export. This file gets uploaded to WordPress/Elementor -- the file that goes here is Manifest's export (usually named ..._page.json).",
      ["root: Elementor template detected (content + version fields)"]
    );
  }
  if (raw && raw.format === PAGE_DOCUMENT_FORMAT) {
    return manifestPageDocumentToBrief(raw);
  }
  return legacyManifestToBrief(raw);
}
