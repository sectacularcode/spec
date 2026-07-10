// Pattern selection utilities
// Scores layout patterns against the brief's industry and crawled inspo data.
// Used by buildPreviewHTML() and generatePages() to pick layouts.
//
// To add pattern detection for a new keyword, add a bump() call in parseInspoPatterns().
// To add a new industry mapping, add it to the relevant pattern entry in constants/patterns.js.

import { LAYOUT_PATTERNS } from "../../constants/patterns.js";

// Scans crawled inspo data for structural signal and returns a boost map
// { patternId: score }. inspoContext is a string produced by
// buildInspoContext() in utils/inspo.js — as of the screenshot-based
// upgrade, that's a JSON payload of { text, patternBoosts }, where
// patternBoosts comes from real visual classification (see
// crawl-inspo.js's classifyPageLayout) and is a stronger, more reliable
// signal than the text-keyword regex below. Older saved drafts may still
// hold the pre-upgrade plain-text format (buildInspoContext used to return
// raw joined notes, not JSON) — JSON.parse fails on those, and this falls
// straight back to scanning the raw string exactly as it always did, so
// nothing already saved breaks.
function parseInspoPatterns(inspoContext) {
  if (!inspoContext) return {};

  var boosts = {};
  var textToScan = inspoContext;

  try {
    var parsed = JSON.parse(inspoContext);
    if (parsed && typeof parsed === "object") {
      if (parsed.patternBoosts) {
        Object.keys(parsed.patternBoosts).forEach(function(id) {
          boosts[id] = (boosts[id] || 0) + parsed.patternBoosts[id];
        });
      }
      // Still scan the accompanying text for additional (weaker) signal —
      // a reference site's notes may mention structural details beyond
      // what got explicitly classified per section.
      textToScan = parsed.text || "";
    }
  } catch {
    // Not JSON — old plain-text format. textToScan stays as the raw string.
  }

  if (!textToScan) return boosts;
  var text = textToScan.toLowerCase();
  function bump(id, amt) { boosts[id] = (boosts[id] || 0) + (amt || 8); }

  if (text.match(/split.{0,20}(hero|left|right)|image.{0,10}(left|right).{0,20}text/)) { bump("split-left"); bump("split-right"); }
  if (text.match(/centered.{0,20}(headline|hero|title)|full.?width.{0,20}(text|headline)/)) bump("centered-bold");
  if (text.match(/full.?(image|bleed|background)|hero.{0,20}(background|photo|image)/)) bump("full-image");
  if (text.match(/minimal|large.{0,20}whitespace|clean.{0,20}layout/)) bump("minimal");
  if (text.match(/card.{0,10}grid|grid.{0,10}card|three.?column|3.?col/)) bump("card-grid");
  if (text.match(/alternating.?(row|image|text)|image.?text.?row/)) { bump("alternating-rows"); bump("alternating"); }
  if (text.match(/numbered.{0,20}(feature|step|block)/)) { bump("numbered-features"); bump("numbered-vertical"); }
  if (text.match(/icon.{0,10}(list|card|grid)/)) { bump("icon-list"); bump("icon-cards"); }
  if (text.match(/split.{0,10}image|image.{0,10}(left|right).{0,20}(text|copy)/)) bump("split-image");
  if (text.match(/long.?form|narrative|centered.{0,20}(story|text)/)) bump("centered-narrative");
  if (text.match(/team.{0,10}grid|team.{0,10}photo|headshot|staff.{0,10}photo/)) bump("team-grid");
  if (text.match(/timeline|company.{0,10}history|mileston/)) { bump("timeline"); bump("horizontal-timeline"); }
  if (text.match(/large.{0,10}quote|single.{0,10}(quote|testimonial)|featured.{0,10}quote/)) bump("single-large");
  if (text.match(/alternating.{0,10}(quote|testimonial)/)) bump("alternating");
  if (text.match(/dark.{0,20}(cta|section|band)|cta.{0,20}dark/)) bump("dark-full");
  if (text.match(/split.{0,10}(cta|call.to.action)|text.{0,10}left.{0,10}button/)) bump("split-cta");
  if (text.match(/minimal.{0,10}(cta|call)|single.?line.{0,10}(cta|button)/)) bump("minimal-line");
  if (text.match(/masonry|pinterest.?style/)) bump("masonry-grid");
  if (text.match(/case.?study.{0,10}card|project.{0,10}card/)) bump("case-study-cards");
  if (text.match(/full.?width.{0,20}(project|work|portfolio)|stacked.{0,10}(project|work)/)) bump("full-width-stacked");
  if (text.match(/horizontal.{0,10}timeline|step.{0,20}horizontal/)) bump("horizontal-timeline");
  if (text.match(/split.{0,10}(form|contact)|form.{0,10}right|info.{0,10}left/)) bump("split-form");
  if (text.match(/centered.{0,10}form|minimal.{0,10}(form|contact)/)) bump("centered-minimal");
  if (text.match(/\bmap\b|location.{0,10}detail|address.{0,20}detail/)) bump("full-details");
  if (text.match(/three.?tier|3.?tier|three.?column.{0,20}pric/)) bump("three-tier");
  if (text.match(/two.?tier|2.?tier|two.?column.{0,20}pric/)) bump("two-tier");
  if (text.match(/price.{0,10}list|simple.{0,10}pric/)) bump("simple-list");
  if (text.match(/featured.{0,10}(post|article)|hero.{0,10}(post|article)/)) bump("featured-plus-grid");
  if (text.match(/article.{0,10}list|list.{0,10}(view|layout)/)) bump("list-view");
  if (text.match(/accordion|expandable|collaps/)) bump("accordion");
  if (text.match(/two.?column.{0,10}(faq|q.?a)/)) bump("two-column");
  if (text.match(/categori.{0,10}(faq|question)|grouped.{0,10}faq/)) bump("categorized");

  return boosts;
}

// Picks the best layout pattern for each section type based on industry + inspo signals.
// Same brief always produces the same patterns. Different briefs produce different ones.
export function selectPatterns(brief, inspoContext) {
  var seed = 0;
  var seedStr = (brief.brandName || "") + (brief.industry || "") + (brief.heroHeadline || "") + (inspoContext || "");
  for (var i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
  seed = Math.abs(seed);

  var result = {};
  var industry = (brief.industry || brief.niche || "general").toLowerCase();
  var inspoBoosts = parseInspoPatterns(inspoContext);

  Object.keys(LAYOUT_PATTERNS).forEach(function(sectionType) {
    var options = LAYOUT_PATTERNS[sectionType];
    var scored = options.map(function(p, idx) {
      var score = 0;
      if (p.industries.includes("all")) score += 5;
      p.industries.forEach(function(ind) {
        if (industry.indexOf(ind) !== -1) score += 10;
      });
      if (inspoBoosts[p.id]) score += inspoBoosts[p.id];
      score += ((seed + idx * 7) % 5);
      return { pattern: p, score: score, idx: idx };
    });
    scored.sort(function(a, b) { return b.score - a.score || ((seed % 3) - 1); });
    result[sectionType] = scored[0].pattern.id;
  });

  return result;
}
