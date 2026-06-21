// Escapes HTML special characters before inserting user input into preview HTML.
// Always use he() on brand/page field values — prevents XSS in the preview iframe.

export const he = (str) => String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");