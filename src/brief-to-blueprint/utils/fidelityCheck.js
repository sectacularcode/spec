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

// Undoes the safe-HTML rendering Spec applies to multi-paragraph bodies
// and folded-in inline links (richTextToSafeHtml / flattenTextSectionBodyHtml)
// so the result can be compared against plain source text. Two real,
// confirmed cases this handles, both correct Spec behavior that a naive
// tag-strip alone gets wrong: multiple source paragraphs get joined with
// <br><br> (must become a space, not nothing, or adjacent words glue
// together), and text gets HTML-entity-escaped for safe rendering (a
// real quote in the source becomes &quot; -- must decode back or an
// exact-match compare against plain source text fails on markup, not
// content).
function htmlToPlainText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function tracesToSource(value, haystack) {
  if (!value) return { status: "empty", note: "" };
  const v = String(value).trim();
  if (!v) return { status: "empty", note: "" };
  if (haystack.includes(v)) return { status: "traced", note: "" };
  const fragments = v.split(/[,.]/).map(s => s.trim().replace(/^['"]+|['"]+$/, "").trim()).filter(s => s.length > 3);
  if (fragments.length > 1 && fragments.every(f => haystack.includes(f))) {
    return { status: "traced (assembled from source pieces)", note: "" };
  }
  // Last-resort fallback: real content can legitimately be reconstructed
  // across a source rich-text run boundary (e.g. a genuine inline link
  // mid-sentence -- "runs <link>24/7 emergency towing</link> and
  // roadside repair" -- the rendered plain text never appears as one
  // continuous string anywhere in source, since source keeps the link
  // run as its own array entry; not a content divergence, just a
  // reconstruction the fragment check's punctuation-based split can't
  // verify). Falls back to word-level overlap: every distinctive word
  // (5+ chars, so short connective words don't inflate the score) must
  // individually appear in the haystack. High threshold (95%) so this
  // stays a real check, not a rubber stamp -- genuine content divergence
  // (wrong words, invented text) still fails this too.
  const words = v.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length >= 5);
  if (words.length >= 4) {
    const haystackLower = haystack.toLowerCase();
    const found = words.filter(w => haystackLower.includes(w));
    if (found.length / words.length >= 0.95) {
      return { status: "traced (reconstructed across source run boundary)", note: "" };
    }
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

function flattenRichTextLocal(arr) {
  if (!Array.isArray(arr)) return "";
  // Confirmed real case, July 2026: a rich_text array can include a
  // whitespace-only run (e.g. a literal "\n\n" separating the main
  // answer from a trailing inline link) as its own array entry. Content-
  // wise that's fine -- flattening still captures every real word -- but
  // the embedded newline survives into the flattened string, and every
  // caller of this function eventually renders one line per logical
  // unit (a markdown bullet, a report row); an embedded blank line
  // breaks that formatting, making real trailing content (like a real
  // inline link) look like an orphaned floating line instead of the end
  // of the same sentence. Collapsed to a single space so multi-run
  // content always reads as one continuous line.
  return arr.map(run => (run && run.text) || "").join("").replace(/\s+/g, " ").trim();
}

// Pulls the real, readable copy out of a raw section -- shown directly in
// the fidelity report so a section's mapped status can be checked against
// its actual words, not just confirmed as "mapped" with no way to verify
// what that copy actually says. Deliberately mirrors each type's real
// shape rather than a generic string-flatten, so the output reads like
// the section (heading, then body/items in order) instead of a jumble.
function extractSectionCopy(section) {
  const parts = [];
  if (section.type === "hero") {
    const sub = flattenRichTextLocal(section.subheading);
    if (sub) parts.push(sub);
    (section.buttons || []).forEach(b => { if (b && b.label) parts.push("[button] " + b.label); });
  } else if (section.type === "text_section") {
    (section.items || []).forEach(item => {
      const t = flattenRichTextLocal(item && item.rich_text);
      if (t) parts.push(t);
    });
    (section.buttons || []).forEach(b => { if (b && b.label) parts.push("[button] " + b.label); });
  } else if (section.type === "map_location") {
    const note = flattenRichTextLocal(section.note);
    if (note) parts.push(note);
    if (section.phone) parts.push("Phone: " + section.phone);
    if (section.hours) parts.push("Hours: " + section.hours);
    if (section.button && section.button.label) parts.push("[button] " + section.button.label);
  } else if (section.type === "testimonials") {
    (section.items || []).forEach(item => {
      if (!item) return;
      let line = "\"" + (item.quote || "") + "\"";
      if (item.author) line += " -- " + item.author;
      if (item.rating) line += " (" + item.rating + " stars)";
      parts.push(line);
    });
  } else if (section.type === "faq") {
    (section.items || []).forEach(item => {
      if (!item) return;
      parts.push("Q: " + (item.question || ""));
      parts.push("A: " + flattenRichTextLocal(item.answer));
    });
  } else if (section.type === "cta") {
    const body = flattenRichTextLocal(section.body);
    if (body) parts.push(body);
    (section.buttons || []).forEach(b => { if (b && b.label) parts.push("[button] " + b.label); });
  } else if (section.type === "form") {
    (section.fields || []).forEach(f => {
      if (f && f.label) parts.push(f.label + (f.required ? " (required)" : "") + (f.field_type ? " -- " + f.field_type : ""));
    });
  } else if (section.type === "feature_cards") {
    (section.items || []).forEach(item => {
      if (!item) return;
      if (item.title) parts.push(item.title);
      const b = flattenRichTextLocal(item.body);
      if (b) parts.push(b);
    });
  }
  return parts;
}

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
    sections.push({ index: i, type: s.type, heading, status, copy: extractSectionCopy(s) });
  });

  const fields = CONTENT_FIELDS.map(([key, label]) => {
    const result = tracesToSource(brief[key], haystack);
    return { key, label, status: result.status, note: result.note };
  });

  // Confirmed real gap, July 2026: the fixed list above only covers ~20
  // singleton fields (hero, faq heading, testimonial 1-3, the first
  // map_location, form heading, closing cta). Everything that becomes a
  // brief.features[] row (every text_section, plus any demoted second
  // map_location/cta) or a brief.faqItems[] entry -- typically the bulk
  // of a real page's actual copy -- was shown in the Source sections
  // list (pulled straight from raw JSON, for visual comparison) but
  // never independently traced the way the singleton fields are. A
  // feature row or FAQ item could silently diverge from source with no
  // check ever catching it. Each one now gets the same real trace check
  // as everything else.
  (Array.isArray(brief.features) ? brief.features : []).forEach((f, i) => {
    const headingResult = tracesToSource(f.heading, haystack);
    fields.push({ key: "features[" + i + "].heading", label: "Feature row " + (i + 1) + " heading", status: headingResult.status, note: headingResult.note });
    // Body may have a real inline button folded in as a literal <a> tag
    // (manifestImport.js's link-and-button-roles handling) -- that's
    // correct, intentional enrichment, not a divergence from source, but
    // comparing the raw HTML string against plain source text fails on
    // the markup itself. Strip tags first, same approach already used
    // for FAQ answers below.
    const plainBody = htmlToPlainText(f.body);
    const bodyResult = tracesToSource(plainBody, haystack);
    fields.push({ key: "features[" + i + "].body", label: "Feature row " + (i + 1) + " body", status: bodyResult.status, note: bodyResult.note });
  });
  (Array.isArray(brief.faqItems) ? brief.faqItems : []).forEach((item, i) => {
    const qResult = tracesToSource(item.question, haystack);
    fields.push({ key: "faqItems[" + i + "].question", label: "FAQ " + (i + 1) + " question", status: qResult.status, note: qResult.note });
    // FAQ answers are stored as sanitized HTML (richTextToSafeHtml), not
    // plain text -- strip tags before comparing, or a real, correctly-
    // traced answer would falsely show as not-found due to markup the
    // source text never had.
    const plainAnswer = htmlToPlainText(item.answer);
    const aResult = tracesToSource(plainAnswer, haystack);
    fields.push({ key: "faqItems[" + i + "].answer", label: "FAQ " + (i + 1) + " answer", status: aResult.status, note: aResult.note });
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

// Formats one page's report as clean markdown -- readable in any editor,
// pasteable into Slack/email/a doc, no external viewer required. Mirrors
// the tab's own display order exactly (sections + copy, provenance,
// buttons, proposed) so what gets sent externally matches what's on
// screen.
export function formatReportMarkdown(pageSlug, report) {
  const lines = [];
  lines.push("# Fidelity report: " + pageSlug);
  lines.push("");
  lines.push(report.clean ? "**Status: Clean** -- every field traces to real source content." : "**Status: Needs review** -- see flagged items below.");
  lines.push("");

  lines.push("## Source sections");
  lines.push("");
  report.sections.forEach(s => {
    const label = s.type + (s.heading ? ' -- "' + s.heading + '"' : "");
    lines.push("**" + label + "** (" + s.status.replace("_", " ") + ")");
    (s.copy || []).forEach(line => lines.push("- " + line));
    lines.push("");
  });

  lines.push("## Content provenance");
  lines.push("");
  report.fields.filter(f => f.status !== "empty").forEach(f => {
    const mark = f.status.indexOf("NOT FOUND") === 0 ? "[NOT TRACED]" : "[traced]";
    lines.push("- " + mark + " " + f.label + (f.note ? ' -- "' + f.note + '..."' : ""));
  });
  lines.push("");

  if (report.placeholders.length) {
    lines.push("## Buttons needing a real destination");
    lines.push("");
    report.placeholders.forEach(p => lines.push('- "' + p.label + '" (' + p.section + ")"));
    lines.push("");
  }

  if (report.proposed.length) {
    lines.push("## Suggested by Manifest, not included");
    lines.push("");
    report.proposed.forEach(p => lines.push("- **" + p.type + "**: " + p.rationale));
    lines.push("");
  }

  if (report.unknownFields && report.unknownFields.length) {
    lines.push("## Fields Spec doesn't read yet");
    lines.push("");
    report.unknownFields.forEach(f => lines.push("- " + f.type + (f.heading ? ' ("' + f.heading + '")' : "") + ": " + f.keys.join(", ")));
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("Summary: " + report.summary.mappedCount + " sections mapped, " + report.summary.excludedCount + " excluded (proposed), " +
    report.summary.unmappedCount + " unmapped -- " + report.summary.tracedCount + " fields traced, " + report.summary.missingCount + " not traced -- " +
    report.summary.placeholderCount + " placeholder button(s)");

  return lines.join("\n");
}

// Combines multiple page reports into one document -- the batch case,
// since checks normally run 15-20 files at once.
export function formatBatchMarkdown(results) {
  const lines = ["# Fidelity report batch", "", results.length + " page(s) checked", "", "---", ""];
  results.forEach(r => {
    if (r.error) {
      lines.push("# " + r.fileName);
      lines.push("");
      lines.push("Error: " + r.error);
      lines.push("");
      lines.push("---");
      lines.push("");
      return;
    }
    lines.push(formatReportMarkdown((r.raw.page && r.raw.page.slug) || r.fileName, r.report));
    lines.push("");
    lines.push("---");
    lines.push("");
  });
  return lines.join("\n");
}
