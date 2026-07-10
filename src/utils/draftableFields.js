// Single source of truth for which brief fields draft-copy.js can fill when
// blank, and the "is this field blank" predicate. Imported by both the
// server (api/draft-copy.js, which actually calls the model) and the client
// (Brief to Blueprint's pre-generation cost estimate), so the two can never
// silently drift apart — a field added or removed here shows up correctly
// in both places automatically.

export const DRAFTABLE_FIELDS = [
  { key: "heroHeadline", label: "Hero headline", hint: "A short, punchy headline for the hero section. 5-10 words max. Should include or allude to a primary keyword if possible." },
  { key: "heroSubhead", label: "Hero subheadline", hint: "A single sentence expanding on the headline. Plain, specific, speaks directly to the target audience." },
  { key: "hookStatement", label: "Honest hook", hint: "One or two sentences that call out the problem and position this brand as the solution. No buzzwords." },
  { key: "differenceH2", label: "Difference headline", hint: "A short H2 that names the key differentiator. 4-8 words. Should reflect the competitive differentiator." },
  { key: "differenceBody", label: "Difference body copy", hint: "2-3 sentences explaining what makes this brand different. Specific, not generic. Reference the competitive differentiator." },
  { key: "whoH2", label: "Who it is for headline", hint: "A short H2 that names the target audience. 3-6 words." },
  { key: "whoBody", label: "Who it is for body", hint: "2-3 sentences describing the ideal client using the target audience definition. Be specific." },
  { key: "aboutStory", label: "About story", hint: "The founder or company story. When it started, what drove it, who it serves." },
  { key: "whyOneMaker", label: "Why this approach", hint: "2-3 sentences on the approach and why it works for clients. Reference the competitive differentiator." },
  { key: "processIntro", label: "Process intro", hint: "One sentence about what to expect — calm, specific, no jargon." },
  { key: "contactIntro", label: "Contact intro", hint: "2-3 sentences inviting the visitor to get in touch. Warm but direct. Reference the key CTA." },
  { key: "contactReassurance", label: "Contact reassurance", hint: "One short sentence under the form. Specific promise, no sales team language." },
];

// Matches draft-copy.js's own blank-detection exactly: empty/whitespace-only
// counts as blank; text containing both "[" and "]" is treated as an
// intentional human placeholder, not something to auto-draft over.
export function isFieldBlank(brief, key) {
  const val = brief ? brief[key] : undefined;
  if (!val || String(val).trim() === "") return true;
  if (String(val).includes("[") && String(val).includes("]")) return false;
  return false;
}

export function countBlankDraftableFields(brief) {
  if (!brief) return 0;
  return DRAFTABLE_FIELDS.filter(f => isFieldBlank(brief, f.key)).length;
}
