// ─── Page & Form Constants ────────────────────────────────────────────────────
// All static data for Brief to Blueprint — page definitions, form tabs,
// default colors and pricing tiers. Import from here, don't define inline.

export const INTAKE_TABS = ["Brand", "Positioning", "Design", "Sitemap", "Copy", "Pricing"];

export const DEFAULT_COLORS = [
  { name: "Ink",        hex: "", use: "Primary text, dark section backgrounds" },
  { name: "Accent",     hex: "", use: "Buttons, accent elements" },
  { name: "Accent Deep",hex: "", use: "Links, hover states" },
  { name: "Background", hex: "", use: "Primary surface, default background" },
  { name: "Dark Panel", hex: "", use: "Dark panels, cards, pricing tiers" },
  { name: "Muted",      hex: "", use: "Muted labels, captions" },
  { name: "Warm White", hex: "", use: "Clean surface, text on dark" },
  { name: "Text",       hex: "", use: "Body copy on light backgrounds" },
];

export const DEFAULT_TIERS = [
  { name: "", subtitle: "", description: "", price: "" },
  { name: "", subtitle: "", description: "", price: "" },
  { name: "", subtitle: "", description: "", price: "" },
];

// Core pages — always available in every build
export const ALL_PAGES = [
  { id: "home",     label: "Home",               slug: "/" },
  { id: "work",     label: "Work / Portfolio",    slug: "/work" },
  { id: "services", label: "Services & Pricing",  slug: "/services" },
  { id: "about",    label: "About",               slug: "/about" },
  { id: "process",  label: "Process",             slug: "/process" },
  { id: "contact",  label: "Contact",             slug: "/contact" },
];

// Additional pages — shown in the "+ Add Page" dropdown
export const ADDITIONAL_PAGE_TYPES = [
  { id: "landing",      label: "Landing Page",      slug: "/landing" },
  { id: "team",         label: "Team",              slug: "/team" },
  { id: "blog",         label: "Blog / Journal",    slug: "/blog" },
  { id: "blog-post",    label: "Blog Post",         slug: "/blog/post" },
  { id: "case-study",   label: "Case Study",        slug: "/case-study" },
  { id: "testimonials", label: "Testimonials",      slug: "/testimonials" },
  { id: "faq",          label: "FAQ",               slug: "/faq" },
  { id: "pricing",      label: "Pricing",           slug: "/pricing" },
  { id: "portfolio",    label: "Portfolio Single",  slug: "/portfolio/project" },
  { id: "events",       label: "Events",            slug: "/events" },
  { id: "event-single", label: "Event Single",      slug: "/events/event" },
  { id: "location",     label: "Location",          slug: "/location" },
  { id: "careers",      label: "Careers",           slug: "/careers" },
  { id: "press",        label: "Press / Media",     slug: "/press" },
  { id: "partners",     label: "Partners",          slug: "/partners" },
  { id: "resources",    label: "Resources",         slug: "/resources" },
  { id: "downloads",    label: "Downloads",         slug: "/downloads" },
  { id: "thank-you",    label: "Thank You",         slug: "/thank-you" },
  { id: "privacy",      label: "Privacy Policy",    slug: "/privacy-policy" },
  { id: "terms",        label: "Terms of Service",  slug: "/terms" },
  { id: "404",          label: "404",               slug: "/404" },
];
