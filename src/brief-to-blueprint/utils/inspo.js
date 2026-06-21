// Inspo URL utilities
// Processes crawled site data into a flat text pool that feeds the pattern scorer.

// Checks if a crawled inspo hint string contains any of the given keywords.
// Used by page builders to pick between layout variants.
export function inspoMatchesVariant(hint, keywords) {
  if (!hint) return false;
  var lower = hint.toLowerCase();
  return keywords.some(function(k) { return lower.indexOf(k) !== -1; });
}

// Merges all crawled results + stored patterns into a single text string.
// This string is what gets passed to selectPatterns() and the AI analysis API.
export function buildInspoContext(crawlResults, storedPatterns) {
  var allNotes = [];

  if (storedPatterns) {
    Object.keys(storedPatterns).forEach(function(key) {
      if (storedPatterns[key]) allNotes.push(storedPatterns[key]);
    });
  }

  Object.keys(crawlResults).forEach(function(url) {
    var result = crawlResults[url];
    if (!result || result.error || !result.patterns) return;
    if (result.patterns.siteNotes) allNotes.push(result.patterns.siteNotes);
    var pages = result.patterns.pages || {};
    Object.keys(pages).forEach(function(pageType) {
      if (pages[pageType]) allNotes.push("[" + pageType + "] " + pages[pageType]);
    });
  });

  return allNotes.join(" | ");
}
