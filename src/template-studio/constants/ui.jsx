// UI option lists — page types, section options, style selectors, font choices
// Add new page types to PAGE_TYPES and new section types to SECTION_OPTIONS.


// ──────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────
export const PAGE_TYPES = ["Homepage", "About / Studio", "Services", "Work / Portfolio", "Case Study", "Blog Index", "Blog Post", "Blog Post — Recipe", "Pricing", "Press / Awards", "Careers", "Landing Page", "Shop", "Contact"];
export const SECTION_OPTIONS = ["Promo Banner", "Hero", "Marquee", "About", "Leadership", "Services", "Service Cards", "Portfolio", "Portfolio Carousel", "Process", "Team", "Team Carousel", "Logo Carousel", "Stats", "Pricing", "Testimonials", "Blog", "Social", "Video", "FAQ", "Form", "CTA"];

// Line-art UI icons (Lucide-style, 24px stroke 1.75). Use Icon({ name, size, color }).
export const UI_ICONS = {
  sparkles: (k) => [<path key={k+"a"} d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />, <path key={k+"b"} d="M19 13l.7 2.1L22 16l-2.3.9L19 19l-.7-2.1L16 16l2.3-.9L19 13z" />],
  plus: (k) => [<line key={k+"a"} x1="12" y1="5" x2="12" y2="19" />, <line key={k+"b"} x1="5" y1="12" x2="19" y2="12" />],
  upload: (k) => [<path key={k+"a"} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />, <polyline key={k+"b"} points="17 8 12 3 7 8" />, <line key={k+"c"} x1="12" y1="3" x2="12" y2="15" />],
  download: (k) => [<path key={k+"a"} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />, <polyline key={k+"b"} points="7 10 12 15 17 10" />, <line key={k+"c"} x1="12" y1="15" x2="12" y2="3" />],
  copy: (k) => [<rect key={k+"a"} x="9" y="9" width="13" height="13" rx="2" ry="2" />, <path key={k+"b"} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />],
  trash: (k) => [<polyline key={k+"a"} points="3 6 5 6 21 6" />, <path key={k+"b"} d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />, <path key={k+"c"} d="M10 11v6" />, <path key={k+"d"} d="M14 11v6" />],
  folder: (k) => [<path key={k+"a"} d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />],
  arrowLeft: (k) => [<line key={k+"a"} x1="19" y1="12" x2="5" y2="12" />, <polyline key={k+"b"} points="12 19 5 12 12 5" />],
  arrowRight: (k) => [<line key={k+"a"} x1="5" y1="12" x2="19" y2="12" />, <polyline key={k+"b"} points="12 5 19 12 12 19" />],
  eye: (k) => [<path key={k+"a"} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />, <circle key={k+"b"} cx="12" cy="12" r="3" />],
  alertTriangle: (k) => [<path key={k+"a"} d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />, <line key={k+"b"} x1="12" y1="9" x2="12" y2="13" />, <line key={k+"c"} x1="12" y1="17" x2="12.01" y2="17" />],
  check: (k) => [<polyline key={k+"a"} points="20 6 9 17 4 12" />],
  refresh: (k) => [<polyline key={k+"a"} points="23 4 23 10 17 10" />, <polyline key={k+"b"} points="1 20 1 14 7 14" />, <path key={k+"c"} d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />],
  x: (k) => [<line key={k+"a"} x1="18" y1="6" x2="6" y2="18" />, <line key={k+"b"} x1="6" y1="6" x2="18" y2="18" />],
  pin: (k) => [<line key={k+"a"} x1="12" y1="17" x2="12" y2="22" />, <path key={k+"b"} d="M5 17h14V8H5z" />, <path key={k+"c"} d="M9 8V4h6v4" />],
  edit: (k) => [<path key={k+"a"} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />, <path key={k+"b"} d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />],
  "file-text": (k) => [<path key={k+"a"} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />, <polyline key={k+"b"} points="14 2 14 8 20 8" />, <line key={k+"c"} x1="16" y1="13" x2="8" y2="13" />, <line key={k+"d"} x1="16" y1="17" x2="8" y2="17" />, <polyline key={k+"e"} points="10 9 9 9 8 9" />],
};

export const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.75, style = {} }) => {
  const renderPaths = UI_ICONS[name];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      {renderPaths ? renderPaths(name) : null}
    </svg>
  );
};
export const TONES = ["Editorial & Minimal", "Bold & Direct", "Friendly & Conversational", "Premium & Refined", "Professional", "Warm & Approachable", "Authoritative & Expert", "Playful & Creative", "Honest & Grounded", "Luxe & Aspirational", "Other"];
export const FOOTER_STYLES = ["Editorial", "Studio", "Agency", "Premium", "Two Column", "Dark Bar"];
export const HEADER_STYLES = ["Editorial", "Studio", "Agency", "Premium", "Social First", "Transparent"];
export const FONT_OPTIONS = [
  // Display & Serif
  "Yeseva One", "Playfair Display", "Cormorant Garamond", "Italiana", "Fraunces", "Spectral",
  "Libre Baskerville", "Merriweather", "Lora", "EB Garamond", "Crimson Text", "Roboto Slab",
  "Cardo", "Abril Fatface", "Bodoni Moda", "DM Serif Display", "Castoro",
  // Sans-serif & Modern
  "Manrope", "Montserrat", "Raleway", "Oswald", "Lato", "Nunito", "Poppins", "Inter",
  "Jost", "DM Sans", "Josefin Sans", "Work Sans", "Be Vietnam Pro", "Plus Jakarta Sans",
  "Outfit", "Sora", "Figtree", "Urbanist", "Lexend", "Mulish", "Barlow",
  // Monospace & Distinctive
  "Space Mono", "JetBrains Mono", "Space Grotesk", "IBM Plex Mono",
];

// ──────────────────────────────────────────────────────────────────────────────
// THEMES — curated, WCAG AA-tested color palettes.
// Each palette is hand-picked so backgrounds, text, and accents work together
// without requiring color theory knowledge. All meet 4.5:1 contrast minimum
// for body text and 3:1 for large text/UI elements.
// ──────────────────────────────────────────────────────────────────────────────
