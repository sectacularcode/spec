// Inspo URL utilities
// Processes crawled site data into a flat text pool that feeds the pattern scorer.

// Checks if a crawled inspo hint string contains any of the given keywords.
// Used by page builders to pick between layout variants.
export function inspoMatchesVariant(hint, keywords) {
  if (!hint) return false;
  var lower = hint.toLowerCase();
  return keywords.some(function(k) { return lower.indexOf(k) !== -1; });
}

// Merges all crawled results + stored patterns into a single string that
// feeds selectPatterns() and the AI analysis API.
//
// Returns a JSON-encoded string (still a plain string externally — every
// existing caller that treats inspoContext as a string, does .length
// checks on it, or stores it verbatim in a saved draft keeps working
// unchanged) containing both the human-readable notes (backward compatible
// with the old plain-text format) and an aggregated patternBoosts map built
// from real screenshot-based classification (see crawl-inspo.js) when
// available. parseInspoPatterns() in patterns.js tries to JSON.parse this;
// if it fails (an old saved draft with the pre-upgrade plain-text format),
// it falls back to scanning the raw string exactly as before.
export function buildInspoContext(crawlResults, storedPatterns) {
  var allNotes = [];
  var mergedBoosts = {};

  if (storedPatterns) {
    Object.keys(storedPatterns).forEach(function(key) {
      if (storedPatterns[key]) allNotes.push(storedPatterns[key]);
    });
  }

  Object.keys(crawlResults).forEach(function(url) {
    var result = crawlResults[url];
    if (!result || result.error) return;

    if (result.patterns) {
      if (result.patterns.siteNotes) allNotes.push(result.patterns.siteNotes);
      var pages = result.patterns.pages || {};
      Object.keys(pages).forEach(function(pageType) {
        if (pages[pageType]) allNotes.push("[" + pageType + "] " + pages[pageType]);
      });
    }

    if (result.patternBoosts) {
      Object.keys(result.patternBoosts).forEach(function(patternId) {
        mergedBoosts[patternId] = (mergedBoosts[patternId] || 0) + result.patternBoosts[patternId];
      });
    }
  });

  return JSON.stringify({ text: allNotes.join(" | "), patternBoosts: mergedBoosts });
}
