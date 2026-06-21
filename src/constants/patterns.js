// ─── Layout Pattern Library ───────────────────────────────────────────────────
// Each key is a section type. Each entry defines a visual layout variant,
// the industries it suits best, and a human label for the UI.
//
// selectPatterns() in CustomBuild.jsx scores these against the brief's
// industry and crawled inspo data to pick the best layout per section.
//
// To add a new variant:
//   1. Add an entry here with a unique id, label, and industries array
//   2. Add a rendering case in buildPreviewHTML() sections object
//   3. Add an A/B override in the pattern override block at the top of buildPreviewHTML()

export const LAYOUT_PATTERNS = {
  hero: [
    { id: "split-left",    label: "Split — text left, image right",     industries: ["agency", "saas", "consulting"] },
    { id: "split-right",   label: "Split — image left, text right",     industries: ["creative", "photography", "design"] },
    { id: "centered-bold", label: "Centered headline, no image",        industries: ["law", "finance", "enterprise"] },
    { id: "full-image",    label: "Full image background with overlay", industries: ["hospitality", "events", "real-estate"] },
    { id: "minimal",       label: "Minimal text, large whitespace",     industries: ["studio", "architecture", "luxury"] },
  ],
  services: [
    { id: "card-grid",         label: "3-column card grid",         industries: ["saas", "consulting", "agency"] },
    { id: "alternating-rows",  label: "Alternating image-text rows", industries: ["creative", "photography", "design"] },
    { id: "icon-list",         label: "Icon + text list",           industries: ["law", "finance", "healthcare"] },
    { id: "numbered-features", label: "Numbered feature blocks",    industries: ["saas", "tech", "startup"] },
  ],
  about: [
    { id: "split-image",       label: "Image left, text right",       industries: ["agency", "studio", "consulting"] },
    { id: "centered-narrative",label: "Centered long-form story",     industries: ["founder", "personal-brand"] },
    { id: "team-grid",         label: "Team grid with bios",          industries: ["law", "agency", "enterprise"] },
    { id: "timeline",          label: "Company timeline",             industries: ["enterprise", "manufacturing", "established"] },
  ],
  testimonials: [
    { id: "card-grid",         label: "3-column quote cards",               industries: ["agency", "saas", "consulting"] },
    { id: "single-large",      label: "One large centered quote",           industries: ["luxury", "studio", "architecture"] },
    { id: "alternating",       label: "Alternating left-right quotes",      industries: ["creative", "personal-brand"] },
    { id: "single-feature",    label: "Single large dark feature quote",    industries: ["luxury", "studio", "architecture"] },
    { id: "alternating-quotes",label: "Alternating left-right with avatar", industries: ["creative", "personal-brand", "services"] },
  ],
  cta: [
    { id: "dark-full",   label: "Dark full-width with heading", industries: ["all"] },
    { id: "split-cta",   label: "Text left, button right",      industries: ["saas", "consulting"] },
    { id: "minimal-line",label: "Single line with button",      industries: ["studio", "luxury", "minimal"] },
  ],
  portfolio: [
    { id: "masonry-grid",      label: "Masonry image grid",           industries: ["photography", "design", "creative"] },
    { id: "case-study-cards",  label: "Case study cards with text",   industries: ["agency", "consulting", "law"] },
    { id: "full-width-stacked",label: "Full-width stacked projects",  industries: ["architecture", "studio"] },
    { id: "editorial",         label: "Editorial — full image + meta",industries: ["design", "photography", "brand"] },
  ],
  process: [
    { id: "numbered-vertical",  label: "Numbered vertical steps", industries: ["agency", "consulting", "services"] },
    { id: "horizontal-timeline",label: "Horizontal timeline",     industries: ["enterprise", "manufacturing"] },
    { id: "icon-cards",         label: "Icon cards grid",         industries: ["saas", "tech", "startup"] },
  ],
  contact: [
    { id: "split-form",     label: "Info left, form right",           industries: ["agency", "consulting", "services"] },
    { id: "centered-minimal",label: "Centered minimal form",          industries: ["studio", "luxury", "minimal"] },
    { id: "full-details",   label: "Full details with map placeholder",industries: ["local", "real-estate", "hospitality"] },
  ],
  pricing: [
    { id: "three-tier", label: "3-column pricing cards",     industries: ["saas", "agency", "services"] },
    { id: "two-tier",   label: "2-column with feature list", industries: ["consulting", "studio"] },
    { id: "simple-list",label: "Simple price list",          industries: ["creative", "photography", "freelance"] },
  ],
  blog: [
    { id: "grid-3col",        label: "3-column article grid",    industries: ["agency", "saas", "media"] },
    { id: "featured-plus-grid",label: "Featured post + grid",    industries: ["creative", "editorial"] },
    { id: "list-view",        label: "List with thumbnails",     industries: ["law", "consulting", "finance"] },
  ],
  faq: [
    { id: "accordion",  label: "Expandable accordion", industries: ["saas", "services", "agency"] },
    { id: "two-column", label: "Two-column Q&A",        industries: ["enterprise", "consulting"] },
    { id: "categorized",label: "Categorized sections",  industries: ["saas", "complex"] },
  ],
  landing: [
    { id: "centered-dark",label: "Dark centered hero + numbered benefits",   industries: ["saas", "startup", "agency"] },
    { id: "split-light",  label: "Light split hero + alternating benefits",  industries: ["consulting", "services", "creative"] },
    { id: "social-proof", label: "Light hero + logo strip + feature cards",  industries: ["saas", "enterprise", "b2b"] },
  ],
  team: [
    { id: "photo-grid",      label: "Equal photo grid with name and role",       industries: ["agency", "consulting", "law"] },
    { id: "featured-founder",label: "Featured founder large + supporting team",  industries: ["founder", "studio", "startup"] },
    { id: "horizontal-list", label: "Horizontal list with bio text",             industries: ["enterprise", "finance", "healthcare"] },
  ],
  events: [
    { id: "date-list",    label: "Date-anchored list with register button", industries: ["all"] },
    { id: "event-cards",  label: "Card grid with image and date badge",     industries: ["hospitality", "creative", "entertainment"] },
    { id: "featured-next",label: "Featured next event hero + list",         industries: ["enterprise", "conference", "education"] },
  ],
  careers: [
    { id: "job-list",    label: "Clean job list with apply buttons",   industries: ["all"] },
    { id: "values-first",label: "Culture and values section + job list",industries: ["startup", "agency", "creative"] },
    { id: "split-layout",label: "Culture copy left, open roles right", industries: ["enterprise", "saas", "consulting"] },
  ],
  "case-study": [
    { id: "dark-hero-metrics",label: "Dark hero + challenge/solution/result",      industries: ["agency", "consulting", "creative"] },
    { id: "editorial-light",  label: "Light editorial with large image + quote",   industries: ["design", "photography", "brand"] },
    { id: "numbers-first",    label: "Big stat numbers lead + narrative",          industries: ["saas", "enterprise", "b2b"] },
  ],
};
