// Fidelity check: compares a raw Manifest page-document JSON against the
// brief manifestToBrief() produced from it, and reports section-by-section
// and field-by-field whether everything in the brief traces back to real
// source content, and whether every real source section landed somewhere
// on the page (or was correctly excluded as proposed/unmapped).
//
// This does NOT re-derive correctness by re-running the parser's own logic
// against itself (that would just confirm the parser agrees with itself).
// It cross-checks against the RAW JSON TEXT directly -- flattening every
// string value in the source into one haystack and searching for each
// piece of brief content in it. If a brief field's value doesn't appear
// anywhere in the raw source text, it did not come from Manifest.

function flattenAllStrings(node, out) {
  if (typeof node === "string") {
    if (node.trim()) out.push(node);
  } else if (Array.isArray(node)) {
    node.forEach(n => flattenAllStrings(n, out));
  } else if (node && typeof node === "object") {
    Object.keys(node).forEach(k => flattenAllStrings(node[k], out));
  }
}

function buildHaystack(raw) {
  const strings = [];
  flattenAllStrings(raw, strings);
  return strings.join("\n---\n");
}

function tracesToSource(value, haystack) {
  if (!value) return { status: "empty", note: "" };
  const v = String(value).trim();
  if (!v) return { status: "empty", note: "" };
  if (haystack.includes(v)) return { status: "traced", note: "" };
  const fragments = v.split(/[,.]/).map(s => s.trim()).filter(s => s.length > 3);
  if (fragments.length > 1 && fragments.every(f => haystack.includes(f))) {
    return { status: "traced (assembled from source pieces)", note: "" };
  }
  return { status: "NOT FOUND IN SOURCE", note: v.slice(0, 80) };
}

const CONTENT_FIELDS = [
  ["heroHeadline", "Hero headline"],
  ["heroSubhead", "Hero subheadline"],
  ["phoneCta", "Hero primary button label"],
  ["contactCta", "Hero secondary button label"],
  ["faqHeading", "FAQ heading"],
  ["testimonialHeading", "Testimonials heading"],
  ["testimonial1Quote", "Testimonial 1 quote"],
  ["testimonial1Name", "Testimonial 1 name"],
  ["testimonial2Quote", "Testimonial 2 quote"],
  ["testimonial2Name", "Testimonial 2 name"],
  ["testimonial3Quote", "Testimonial 3 quote"],
  ["testimonial3Name", "Testimonial 3 name"],
  ["mapAddress", "Map address"],
  ["mapHeading", "Map heading"],
  ["mapNote", "Map descriptive note"],
  ["mapButtonLabel", "Map button label"],
  ["formHeading", "Form heading"],
  ["closingCta", "Closing CTA heading"],
  ["closingBody", "Closing CTA body"],
  ["closingCtaButtonLabel", "Closing CTA button label"],
];

export function checkFidelity(raw, brief) {
  const haystack = buildHaystack(raw);
  const slug = (raw.page && raw.page.slug) || "(unknown page)";
  const sections = [];
  const unmapped = brief._unmappedBlocks || [];

  (raw.sections || []).forEach((s, i) => {
    const heading = (s.heading && s.heading.text) || "";
    let status;
    if (s.proposed === true) status = "excluded_proposed";
    else if (unmapped.some(u => u.type === s.type && u.heading === heading)) status = "unmapped";
    else if (["hero", "testimonials", "faq", "map_location", "form", "cta", "text_section", "feature_cards"].includes(s.type)) status = "mapped";
    else status = "unmapped";
    sections.push({ index: i, type: s.type, heading, status });
  });

  const fields = CONTENT_FIELDS.map(([key, label]) => {
    const result = tracesToSource(brief[key], haystack);
    return { key, label, status: result.status, note: result.note };
  });

  const tracedCount = fields.filter(f => f.status === "traced" || f.status.indexOf("traced") === 0).length;
  const missingCount = fields.filter(f => f.status.indexOf("NOT FOUND") === 0).length;
  const emptyCount = fields.filter(f => f.status === "empty").length;
  const mappedCount = sections.filter(s => s.status === "mapped").length;
  const excludedCount = sections.filter(s => s.status === "excluded_proposed").length;
  const unmappedCount = sections.filter(s => s.status === "unmapped").length;

  const placeholders = brief._placeholderButtons || [];
  const proposed = brief._proposedBlocks || [];
  const unknownFields = brief._unknownFields || [];

  const clean = missingCount === 0 && unmappedCount === 0 && unknownFields.length === 0;

  return {
    slug,
    sections,
    fields,
    placeholders,
    proposed: proposed.map(p => ({ type: p.type, heading: p.heading, rationale: p.rationale })),
    unknownFields,
    summary: { mappedCount, excludedCount, unmappedCount, tracedCount, missingCount, emptyCount, placeholderCount: placeholders.length },
    clean,
  };
}

// Compact fingerprint of an approved page -- what actually gets stored
// (see api/fidelity-approvals.js), deliberately NOT the raw JSON or its
// full text content. Just enough shape to pattern-match a future import
// against: which section types were present, and which known fields on
// each were actually populated (not which values -- just which keys).
export function summarizeForApproval(raw, brief) {
  const sectionTypes = (raw.sections || []).map(s => s.type);
  const fieldSummary = {};
  (raw.sections || []).forEach(s => {
    if (!fieldSummary[s.type]) fieldSummary[s.type] = new Set();
    Object.keys(s).forEach(k => {
      if (["type", "intent", "proposed", "rationale"].indexOf(k) === -1) fieldSummary[s.type].add(k);
    });
  });
  const fieldSummaryPlain = {};
  Object.keys(fieldSummary).forEach(t => { fieldSummaryPlain[t] = Array.from(fieldSummary[t]); });

  const report = checkFidelity(raw, brief);
  return {
    sectionTypes,
    fieldSummary: fieldSummaryPlain,
    reportSummary: report.summary,
  };
}

// Compares a new page's shape against past approved pages for the same
// brand. Flags two kinds of anomaly, both informational (never blocking):
// a section type this brand's approved history has never seen before, and
// a section type most of the brand's approved pages have that this one is
// missing (not necessarily wrong -- not every page needs every section --
// but worth a second look before assuming it's fine).
export function compareAgainstHistory(newSummary, pastApprovals) {
  if (!pastApprovals || pastApprovals.length === 0) {
    return { isFirstForBrand: true, newTypes: [], commonlyMissingTypes: [] };
  }

  const pastTypeCounts = {};
  pastApprovals.forEach(a => {
    (a.sectionTypes || []).forEach(t => {
      pastTypeCounts[t] = (pastTypeCounts[t] || 0) + 1;
    });
  });

  const newTypeSet = new Set(newSummary.sectionTypes);
  const neverSeenBefore = newSummary.sectionTypes.filter(t => !pastTypeCounts[t]);

  // "Commonly present" = at least 60% of past approved pages for this
  // brand have it. A type below that threshold is just brand-specific
  // page variation, not a gap worth flagging.
  const threshold = Math.ceil(pastApprovals.length * 0.6);
  const commonlyMissingTypes = Object.keys(pastTypeCounts).filter(t =>
    pastTypeCounts[t] >= threshold && !newTypeSet.has(t)
  );

  return { isFirstForBrand: false, newTypes: neverSeenBefore, commonlyMissingTypes };
}
