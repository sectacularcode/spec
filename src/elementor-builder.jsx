import { useState, useMemo, useEffect } from "react";

// ──────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────────────
const PAGE_TYPES = ["Homepage", "About / Studio", "Services", "Work / Portfolio", "Case Study", "Blog Index", "Blog Post", "Blog Post — Recipe", "Pricing", "Press / Awards", "Careers", "Landing Page", "Shop", "Contact"];
const SECTION_OPTIONS = ["Promo Banner", "Hero", "Marquee", "About", "Leadership", "Services", "Service Cards", "Portfolio", "Portfolio Carousel", "Process", "Team", "Team Carousel", "Logo Carousel", "Stats", "Pricing", "Testimonials", "Blog", "Social", "Video", "FAQ", "Form", "CTA"];

// Line-art UI icons (Lucide-style, 24px stroke 1.75). Use Icon({ name, size, color }).
const UI_ICONS = {
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
};

const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.75, style = {} }) => {
  const renderPaths = UI_ICONS[name];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      {renderPaths ? renderPaths(name) : null}
    </svg>
  );
};
const TONES = ["Editorial & Minimal", "Bold & Direct", "Friendly & Conversational", "Premium & Refined", "Professional"];
const FOOTER_STYLES = ["Editorial", "Studio", "Agency", "Premium"];
const HEADER_STYLES = ["Editorial", "Studio", "Agency", "Premium"];
const FONT_OPTIONS = ["Yeseva One", "Playfair Display", "Cormorant Garamond", "Italiana", "Fraunces", "Spectral", "Libre Baskerville", "Merriweather", "Manrope", "Montserrat", "Raleway", "Oswald", "Lato", "Nunito", "Poppins", "Inter", "Roboto Slab", "Jost", "DM Sans", "Josefin Sans", "Work Sans", "Space Mono", "JetBrains Mono"];

// ──────────────────────────────────────────────────────────────────────────────
// THEMES — curated, WCAG AA-tested color palettes.
// Each palette is hand-picked so backgrounds, text, and accents work together
// without requiring color theory knowledge. All meet 4.5:1 contrast minimum
// for body text and 3:1 for large text/UI elements.
// ──────────────────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: "editorial-dark",
    name: "Editorial Dark",
    desc: "Deep black + champagne gold. The premium editorial standard. Studios, agencies, creative.",
    mode: "dark",
    primaryColor: "#0a0a0a",
    cardBgColor: "#141414",
    accentColor: "#c9a86a",
    bodyTextColor: "#a8a8a8",
    borderColor: "#1f1f1f",
    headingColor: "#fafafa",
  },
  {
    id: "onyx-bronze",
    name: "Onyx & Bronze",
    desc: "Soft black + warm bronze. Luxury hospitality, jewelry, premium services.",
    mode: "dark",
    primaryColor: "#1a1614",
    cardBgColor: "#241f1b",
    accentColor: "#b87333",
    bodyTextColor: "#b5ab9f",
    borderColor: "#2a241f",
    headingColor: "#f5ede0",
  },
  {
    id: "midnight",
    name: "Midnight",
    desc: "Deep ink navy + soft coral. Modern tech with warmth. SaaS, fintech, B2B.",
    mode: "dark",
    primaryColor: "#0d1424",
    cardBgColor: "#161e30",
    accentColor: "#ed7464",
    bodyTextColor: "#a8b3c7",
    borderColor: "#1f2940",
    headingColor: "#ffffff",
  },
  {
    id: "espresso",
    name: "Espresso",
    desc: "Deep coffee brown + warm cream. Cozy, organic. Cafes, food, hospitality.",
    mode: "dark",
    primaryColor: "#1c1410",
    cardBgColor: "#26190f",
    accentColor: "#e8c8a0",
    bodyTextColor: "#b8a99a",
    borderColor: "#332419",
    headingColor: "#f5ebe0",
  },
  {
    id: "forest",
    name: "Forest",
    desc: "Deep forest green + warm sand. Grounded, natural. Wellness, sustainability.",
    mode: "dark",
    primaryColor: "#15241d",
    cardBgColor: "#1d2f27",
    accentColor: "#d4b896",
    bodyTextColor: "#a8b5af",
    borderColor: "#26392f",
    headingColor: "#f0ebe0",
  },
  {
    id: "pure-minimal",
    name: "Pure Minimal",
    desc: "White + pure black. Maximum contrast, gallery feel. Portfolios, art, fashion.",
    mode: "light",
    primaryColor: "#ffffff",
    cardBgColor: "#f7f7f5",
    accentColor: "#0a0a0a",
    bodyTextColor: "#4a4a4a",
    borderColor: "#e8e8e6",
    headingColor: "#0a0a0a",
  },
  {
    id: "bone-ink",
    name: "Bone & Ink",
    desc: "Bone white + deep ink navy. Editorial print feel. Publishing, consulting.",
    mode: "light",
    primaryColor: "#f3eee2",
    cardBgColor: "#e8e0d0",
    accentColor: "#1f2940",
    bodyTextColor: "#3d3a35",
    borderColor: "#d4ccb8",
    headingColor: "#1a2238",
  },
  {
    id: "linen-clay",
    name: "Linen & Clay",
    desc: "Warm linen + earthy terracotta. Artisan, approachable. Beauty, ceramics, food.",
    mode: "light",
    primaryColor: "#f8f1e7",
    cardBgColor: "#ede2d2",
    accentColor: "#a64f30",
    bodyTextColor: "#4a3a30",
    borderColor: "#dccdb8",
    headingColor: "#2a1810",
  },
  {
    id: "sage-stone",
    name: "Sage & Stone",
    desc: "Muted sage + warm stone. Calm, refined wellness. Spa, mindfulness, health.",
    mode: "light",
    primaryColor: "#f4f1ea",
    cardBgColor: "#e6e6dc",
    accentColor: "#4a5d44",
    bodyTextColor: "#4a4a42",
    borderColor: "#d4d4c8",
    headingColor: "#26302a",
  },
  {
    id: "charcoal-blush",
    name: "Charcoal & Blush",
    desc: "Soft charcoal + dusty rose. Feminine but refined. Beauty, fashion, lifestyle.",
    mode: "light",
    primaryColor: "#f8f0ec",
    cardBgColor: "#ede0d8",
    accentColor: "#3a2828",
    bodyTextColor: "#4a3a3a",
    borderColor: "#e0d0c8",
    headingColor: "#1a1010",
  },
  {
    id: "neon-mono",
    name: "Neon Mono",
    desc: "Black background with electric neon green accent. Y2K, tech, indie energy.",
    mode: "dark",
    primaryColor: "#0a0a0a",
    cardBgColor: "#141414",
    accentColor: "#39ff14",
    bodyTextColor: "#a0a0a0",
    borderColor: "#222222",
    headingColor: "#ffffff",
  },
  {
    id: "hot-pink-mono",
    name: "Hot Pink Pop",
    desc: "Crisp white with bold hot pink accent. Beauty, lifestyle, bold consumer.",
    mode: "light",
    primaryColor: "#ffffff",
    cardBgColor: "#fafafa",
    accentColor: "#ff2d87",
    bodyTextColor: "#4a4a4a",
    borderColor: "#e8e8e8",
    headingColor: "#0a0a0a",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// LAYOUTS — distinct structural/typographic personalities. Independent of color.
// Picks the size, spacing, alignment, and ornamental treatment for each section.
// Inspired by reference sites:
// - Editorial Minimal: Rosalie, Lustre, Breef
// - Editorial Bold: Faure, Nevo
// - Magazine: Print-inspired editorials
// - Studio Modern: Refined card-based studios
// - Brutalist: Raw, oversized experimental
// ──────────────────────────────────────────────────────────────────────────────
const LAYOUTS = [
  {
    id: "editorial-minimal",
    name: "Editorial Minimal",
    headingFont: "Yeseva One",
    bodyFont: "DM Sans",
    desc: "Standard hero, generous grid services. Restraint, work-first. Rosalie, Lustre, Breef.",
    heroVariant: "left-standard",
    servicesVariant: "grid-numbered",
    heroAlign: "left",
    heroPadding: 140,
    heroHeading: 84,
    sectionPadding: 100,
    sectionHeading: 48,
    sectionAlign: "left",
    eyebrowStyle: "dot",
    cardRadius: 0,
    aboutLayout: "split",
  },
  {
    id: "editorial-bold",
    name: "Editorial Bold",
    headingFont: "Manrope",
    bodyFont: "Inter",
    desc: "Split hero with image, services as full-width list rows. Faure, Nevo.",
    heroVariant: "split-image",
    servicesVariant: "list-row",
    heroAlign: "left",
    heroPadding: 100,
    heroHeading: 96,
    sectionPadding: 100,
    sectionHeading: 64,
    sectionAlign: "left",
    eyebrowStyle: "lower",
    cardRadius: 0,
    aboutLayout: "split",
  },
  {
    id: "magazine",
    name: "Magazine",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    desc: "Centered hero, services with huge serif numbers. Print-editorial feel.",
    heroVariant: "centered-bold",
    servicesVariant: "serif-stack",
    heroAlign: "center",
    heroPadding: 160,
    heroHeading: 88,
    sectionPadding: 120,
    sectionHeading: 56,
    sectionAlign: "center",
    eyebrowStyle: "number",
    cardRadius: 0,
    aboutLayout: "stacked",
  },
  {
    id: "studio-modern",
    name: "Studio Modern",
    headingFont: "Inter",
    bodyFont: "Inter",
    desc: "Split rounded hero, services in soft rounded cards. Modern, tech-forward.",
    heroVariant: "split-image-rounded",
    servicesVariant: "cards-padded",
    heroAlign: "left",
    heroPadding: 100,
    heroHeading: 64,
    sectionPadding: 100,
    sectionHeading: 40,
    sectionAlign: "center",
    eyebrowStyle: "upper",
    cardRadius: 16,
    aboutLayout: "split",
  },
  {
    id: "brutalist",
    name: "Brutalist",
    headingFont: "Oswald",
    bodyFont: "Inter",
    desc: "Hero is just massive overflowing text. Services as raw list rows. Experimental.",
    heroVariant: "minimal-text",
    servicesVariant: "list-row",
    heroAlign: "left",
    heroPadding: 60,
    heroHeading: 144,
    sectionPadding: 80,
    sectionHeading: 80,
    sectionAlign: "left",
    eyebrowStyle: "bracket",
    cardRadius: 0,
    aboutLayout: "split",
  },
  {
    id: "swiss-grid",
    name: "Swiss Grid",
    headingFont: "Inter",
    bodyFont: "Inter",
    desc: "Clean Helvetica-style grid system. Corporate polish without flair. B2B, professional services, consulting.",
    heroVariant: "split-image",
    servicesVariant: "grid-numbered",
    heroAlign: "left",
    heroPadding: 120,
    heroHeading: 72,
    sectionPadding: 120,
    sectionHeading: 44,
    sectionAlign: "left",
    eyebrowStyle: "upper",
    cardRadius: 0,
    aboutLayout: "split",
  },
  {
    id: "boutique-luxury",
    name: "Boutique Luxury",
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
    desc: "Thin italic serif, ultra-spacious, refined. Hotels, jewelry, fashion houses, luxury hospitality.",
    heroVariant: "centered-bold",
    servicesVariant: "serif-stack",
    heroAlign: "center",
    heroPadding: 180,
    heroHeading: 92,
    sectionPadding: 140,
    sectionHeading: 52,
    sectionAlign: "center",
    eyebrowStyle: "upper",
    cardRadius: 0,
    aboutLayout: "stacked",
  },
  {
    id: "apple-minimal",
    name: "Apple Minimal",
    headingFont: "Inter",
    bodyFont: "Inter",
    desc: "Centered sans, image-led, extreme whitespace. Product brands, tech startups, premium consumer goods.",
    heroVariant: "centered-bold",
    servicesVariant: "cards-padded",
    heroAlign: "center",
    heroPadding: 140,
    heroHeading: 80,
    sectionPadding: 120,
    sectionHeading: 56,
    sectionAlign: "center",
    eyebrowStyle: "upper",
    cardRadius: 16,
    aboutLayout: "stacked",
  },
  {
    id: "modern-tech",
    name: "Modern Tech",
    headingFont: "Manrope",
    bodyFont: "Inter",
    desc: "Bold sans with gradient-friendly accents. SaaS, fintech, AI startups, dev platforms.",
    heroVariant: "split-image",
    servicesVariant: "cards-padded",
    heroAlign: "left",
    heroPadding: 110,
    heroHeading: 88,
    sectionPadding: 100,
    sectionHeading: 56,
    sectionAlign: "left",
    eyebrowStyle: "upper",
    cardRadius: 12,
    aboutLayout: "split",
  },
  {
    id: "mono-terminal",
    name: "Mono Terminal",
    headingFont: "Space Mono",
    bodyFont: "Space Mono",
    desc: "Monospace technical aesthetic with bracket eyebrows. Dev tools, AI infra, technical documentation, indie tech.",
    heroVariant: "left-standard",
    servicesVariant: "list-row",
    heroAlign: "left",
    heroPadding: 100,
    heroHeading: 64,
    sectionPadding: 80,
    sectionHeading: 36,
    sectionAlign: "left",
    eyebrowStyle: "bracket",
    cardRadius: 0,
    aboutLayout: "split",
  },
  {
    id: "wedding-editorial",
    name: "Wedding Editorial",
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
    desc: "Romantic serif with extreme spaciousness. Wedding photography, hospitality, events, lifestyle weddings.",
    heroVariant: "fullbleed-overlay",
    servicesVariant: "serif-stack",
    heroAlign: "center",
    heroPadding: 200,
    heroHeading: 80,
    sectionPadding: 140,
    sectionHeading: 48,
    sectionAlign: "center",
    eyebrowStyle: "upper",
    cardRadius: 0,
    aboutLayout: "stacked",
  },
];

const getLayout = (id) => LAYOUTS.find(l => l.id === id) || LAYOUTS[0];

// Eyebrow text formatter based on layout style
const eyebrowText = (style, text) => {
  const u = (text || "").toUpperCase();
  const l = (text || "").toLowerCase();
  if (style === "dot") return `●  ${u}`;
  if (style === "lower") return l;
  if (style === "number") return u;
  if (style === "bracket") return `[ ${u} ]`;
  return u;
};

// ──────────────────────────────────────────────────────────────────────────────
// WEBSITE TEMPLATES — full industry-specific presets. Picking one applies layout,
// theme, accent, fonts, section composition, AND default copy in a single click.
// Each template is a complete starting point — swap copy/images and ship.
// Inspired by reference sites in the screenshots: Superside, VaynerMedia, Cohley,
// Pola Marketing, Skims, Loft, Nike, Poosh, Goop, Rosalie, Lustre.
// ──────────────────────────────────────────────────────────────────────────────
const WEBSITE_TEMPLATES = [
  {
    id: "agency",
    name: "Marketing & Growth Agency",
    icon: "🎯",
    industry: "Marketing, Creative, Advertising",
    goals: ["Lead Generation", "Awareness & Brand Building"],
    desc: "Bold ad-creative agency. Marquee tickers, work grids, service cards. Like Superside, VaynerMedia, Cohley.",
    layoutId: "editorial-bold", themeId: "midnight", accentColor: "#c8ff00",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "marketing",
    homepageSections: ["Hero", "Marquee", "Logo Carousel", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Testimonials", "Blog", "CTA"],
    defaults: {
      tagline: "The modern agency of record.",
      heroEyebrow: "The Modern Agency",
      servicesHeading: "What we do.",
      servicesEyebrow: "Capabilities",
      description: "We're a full-stack creative agency built for performance. Brand-trained pods, AI-enhanced workflows, and senior creatives — delivering scroll-stopping work for the world's most ambitious brands.",
      heroHeading: "On-brand, on-time ads designed to perform.",
      heroSubhead: "Whether it's digital, social, display, or print — get the ads you need fast and flexibly with our full-stack creative team.",
      keyMessages: "Scroll-stopping creative at scale. Brand-trained AI workflows. 24/7 dedicated pods. Performance that compounds.",
      cta1: "Book a demo", cta2: "See our work",
      portfolioHeading: "Recent Work",
      marqueeText: "We put creative at the center of everything we do",
      aboutHeading: "Built for brands that need creative that compounds.",
      aboutBody: "We started this agency because the old model is broken. Quarterly retainers, slow turnarounds, junior handoffs, agency markup. We're built differently — dedicated senior pods, async-first communication, and AI workflows that compress weeks into days. No middlemen. No surprises. Just creative that performs.",
      services: "Brand Strategy|Positioning, voice, and messaging that actually moves people\nPerformance Creative|Ads that test, learn, and convert across every platform\nSocial Content|Organic posts, reels, and stories built for engagement\nEmail & Lifecycle|Sequences that nurture leads and re-engage customers",
      portfolio: "Nike Air Max Launch|Performance Campaign|https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop&q=80\nSpotify Wrapped|Brand Campaign|https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop&q=80\nAirbnb Belonging|Social Series|https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=1000&fit=crop&q=80\nDoorDash Local|Out of Home|https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=1000&fit=crop&q=80",
      process: "Brief|Async intake and rapid creative kickoff in 48 hours\nDesign|Concept rounds with brand-trained pods\nProduce|Full delivery in days, not weeks\nIterate|Performance feedback loop on every asset",
      stats: "200|+|Brands Served\n50|K+|Assets Delivered\n3|Days|Average Turnaround\n98|%|Client Retention",
      testimonials: "They turned around our launch creative in 5 days flat — that used to take us 5 weeks.|VP Marketing|Series B SaaS\nThe brand-trained pod model is the future. Like having an in-house team without the overhead.|CMO|Consumer Brand",
      blog: "How AI is changing creative workflows in 2026|Strategy|6 min read|https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop&q=80\nThe playbook for B2B marketers building trust at scale|Marketing|8 min read|https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80\nWhy your ad creative loses effectiveness — and how to fix it|Performance|5 min read|https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop&q=80",
      faq: "How fast can you start?|Most engagements kick off within 48 hours. Brand-trained pods come pre-loaded with your assets and tone.\nWhat's included?|Strategy, design, copy, motion, and project management — all under one retainer.\nDo you work with agencies?|Yes, white-label and named partnerships available.\nWhat's the minimum commitment?|Three months for retainer engagements. Sprints available as one-offs.",
      pricing: "Sprint|$15K|2-week project, 1 deliverable, 2 rounds\nRetainer|$25K/mo|Ongoing pod, unlimited briefs, 24-hour turn\nEnterprise|Custom|Dedicated team, SLAs, multi-brand support",
      forms: "Book a demo|Name,Email,Company,Role,What you need help with|Book my demo",
      ctaHeading: "Ready to ship better creative, faster?",
    },
  },
  {
    id: "production",
    name: "Production Studio (Physical Space)",
    icon: "🎬",
    industry: "Production studios with a physical space — full-service production companies, photography studios, video production houses, branding agencies, content production studios. Anything with brick-and-mortar location, a full team, and category-based service offerings. NOT for solo freelancers (use Studio/Portfolio) or marketing-focused agencies (use Marketing Agency).",
    goals: ["Lead Generation", "Awareness & Brand Building"],
    desc: "Premium content production studio. Bold sans-serif, .01-.04 process cards, service category grid. Like Pola Marketing.",
    layoutId: "editorial-bold", themeId: "pure-minimal", accentColor: "#3b82f6",
    headingFont: "Inter", bodyFont: "Inter", imageCategory: "production",
    homepageSections: ["Hero", "Logo Carousel", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Testimonials", "Form"],
    defaults: {
      tagline: "Premium content that moves product.",
      heroEyebrow: "Premium Production",
      servicesHeading: "What we shoot.",
      servicesEyebrow: "Services",
      description: "A full-service content production studio for premium brands. From white background product photography to brand films, we handle every step — strategy, shoot, post, delivery.",
      heroHeading: "White background product photography.",
      heroSubhead: "Premium product-focused photos delivered on time and ready to drive clicks.",
      keyMessages: "Trusted by leading brands. On-time delivery. Studio + on-location. Full creative direction.",
      cta1: "Request shoot", cta2: "View portfolio",
      portfolioHeading: "Recent Work",
      aboutHeading: "A studio built on craft.",
      aboutBody: "Ten years producing premium content for brands you know. Our team has shot for Sephora, Glossier, Apple, and dozens of D2C brands you'll see on every shelf. We're not a marketplace, not freelance hub — we're an in-house production team you can plug into for one campaign or every campaign.",
      services: "Product Photography|Studio-shot white background images for e-commerce and catalogs\nLifestyle & Editorial|On-figure and contextual imagery with art direction\nVideo Production|Long and short-form video for social and brand campaigns\nPost-Production|Retouching, color, and asset organization built for catalog",
      portfolio: "Clinique Spring Launch|Product Photography|https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&h=1000&fit=crop&q=80\nNike Apparel Lookbook|Lifestyle Editorial|https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop&q=80\nGlossier Brand Film|Video Production|https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=1000&fit=crop&q=80\nApple Studio Series|Product Showcase|https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop&q=80",
      process: "Plan|Creative brief, shot list, art direction, talent and location lock\nShoot|Full day or multi-day in-studio or on-location with our crew\nPost|Retouching, color, and final delivery in your formats\nDeliver|Organized asset library, ready for catalog and ads",
      stats: "10|+|Years in Production\n200|+|Brand Campaigns\n50|K+|Assets Delivered\n100|%|On-Time Delivery",
      testimonials: "Best production partner we've worked with. They get our brand and ship work that performs.|Brand Director|Beauty Brand\nThey think strategically about every frame. Not just photographers — collaborators.|Marketing Lead|Premium D2C",
      faq: "How long does a typical shoot take?|Most product shoots are 1-2 days. Lifestyle and video usually 2-3 days. Always scoped clearly upfront.\nDo you handle talent and locations?|Yes, full production including casting, scouting, and permits.\nWhat's your turnaround on post?|Standard delivery is 7-10 business days. Rush available for 48-hour turnaround.\nCan you work to our brand guidelines?|Absolutely. We brand-train our team on every engagement.",
      pricing: "Product Day|$3,500|1 day, 1 location, up to 20 finals\nLifestyle Day|$7,500|1 day, talent and location included, 30 finals\nFull Campaign|$15K+|Multi-day, strategy + shoot + post, custom scoped",
      forms: "Request a quote|Name,Email,Company,Project Type,Budget Range,Timeline,Project Details|Request quote",
      ctaHeading: "Ready to make something worth seeing?",
    },
  },
  {
    id: "ecommerce",
    name: "Online Store / E-commerce",
    icon: "🛍️",
    industry: "Retail, Fashion, Consumer Products",
    goals: ["Direct Sales / E-commerce", "Community & Newsletter Growth"],
    desc: "Product-led brand. Top promo banner, full-bleed image hero, category grids. Like Skims, Loft, Nike.",
    layoutId: "studio-modern", themeId: "pure-minimal", accentColor: "#0a0a0a",
    headingFont: "Inter", bodyFont: "Inter", imageCategory: "product",
    homepageSections: ["Promo Banner", "Hero", "Logo Carousel", "Service Cards", "Portfolio Carousel", "Testimonials", "Form"],
    defaults: {
      tagline: "Premium essentials, redesigned.",
      heroEyebrow: "New Collection",
      servicesHeading: "Shop the collection.",
      servicesEyebrow: "Shop",
      description: "Premium everyday essentials designed in-house and made to last. Sustainable materials, fair pricing, no middlemen.",
      heroHeading: "New collection drops now.",
      heroSubhead: "Discover the latest arrivals — built for everyday.",
      keyMessages: "Free shipping over $75. Easy 30-day returns. Sustainable materials. Made to last.",
      cta1: "Shop now", cta2: "Shop best sellers",
      portfolioHeading: "Featured Products",
      promoBanner: "FREE SHIPPING ON ORDERS OVER $75  ·  EASY 30-DAY RETURNS",
      aboutHeading: "Built better. Made to last. Worn every day.",
      aboutBody: "We started this brand because we were tired of fast fashion and disposable basics. Every piece in our collection is designed in-house, made from sustainable materials, and tested for years of wear. No bloated retailer markups. No greenwashing. Just essentials, done right and priced fairly.",
      services: "New Arrivals|This week's fresh drops and limited edition pieces\nBest Sellers|The styles everyone is buying right now\nThe Essentials|Wardrobe foundations you'll reach for daily\nThe Edit|Curated collections for every occasion",
      portfolio: "Spring Collection|New Arrivals|https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop&q=80\nThe Knit Edit|Best Sellers|https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1000&fit=crop&q=80\nLeather Goods|Accessories|https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=1000&fit=crop&q=80\nMinimal Watches|Accessories|https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop&q=80",
      stats: "50|K+|Happy Customers\n4.9|★|Average Rating\n100|%|Money-Back Guarantee\n98|%|Repeat Buyers",
      testimonials: "Best basics I've ever bought. Three years in and they still look new.|Sarah J.|Verified Customer\nThe customer service is incredible. They actually care.|Mike R.|Verified Customer",
      faq: "What's your return policy?|Free returns within 30 days. No questions asked.\nDo you ship internationally?|Yes, to most countries. Free shipping on orders over $75 worldwide.\nHow do I find my size?|Detailed size guide on every product page. Free exchanges if it doesn't fit.\nAre your materials sustainable?|Yes — organic cotton, recycled wool, ethical leather. Full transparency on each product page.",
      forms: "Join the list|Email|Subscribe & save 10%",
      ctaHeading: "Ready to upgrade your wardrobe?",
    },
  },
  {
    id: "lifestyle-blog",
    name: "Lifestyle / Travel Blog",
    icon: "📝",
    industry: "Lifestyle and travel content brands — lifestyle bloggers, travel bloggers, style bloggers, travel creators, home/decor bloggers, wellness bloggers, food bloggers, parenting bloggers, homemaker content, beauty bloggers, family lifestyle. Magazine-style sites built around an ongoing blog/article feed with author bio and featured articles. NOT for professional services (use Freelance/Personal Brand) or e-commerce (use E-commerce).",
    goals: ["Awareness & Brand Building", "Community & Newsletter Growth"],
    desc: "Magazine-style personal brand or lifestyle blog. Centered hero, featured articles, author bio. Like Poosh, Goop.",
    layoutId: "magazine", themeId: "linen-clay", accentColor: "#a64f30",
    headingFont: "Playfair Display", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "About", "Blog", "Leadership", "Portfolio Carousel", "Stats", "Form"],
    defaults: {
      tagline: "Live well. Look closer.",
      heroEyebrow: "The Journal",
      servicesHeading: "Stories worth your time.",
      servicesEyebrow: "The Latest",
      description: "A weekly journal on wellness, beauty, food, and intentional living. Read by 250K women every Sunday.",
      heroHeading: "Stories on wellness, beauty, food, and the things that make life better.",
      heroSubhead: "A weekly journal from our founder and the team. Real talk on what works.",
      keyMessages: "Honest reviews. Curated recommendations. Recipes you'll actually make. Real conversations.",
      cta1: "Read the journal", cta2: "Subscribe",
      portfolioHeading: "Latest Posts",
      aboutHeading: "An honest take on living well.",
      aboutBody: "Started as a Sunday newsletter to twelve friends. Five years and 250,000 readers later, it's still that — just for more people. We write the honest reviews we wanted to read, share the recipes we actually make, and recommend the things we actually use. No sponsored content disguised as editorial. No influencer noise. Just real.",
      blog: "How to build a morning routine that actually sticks|Wellness|6 min read|https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80\nThe minimalist skincare edit our editor swears by|Beauty|4 min read|https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop&q=80\nA Sunday dinner recipe everyone will text you about|Food|8 min read|https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop&q=80\nWhat we're packing for a weekend in the country|Travel|5 min read|https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80",
      portfolio: "The Wellness Edit|Curated Picks|https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=1000&fit=crop&q=80\nFavorite Recipes|Food Series|https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&h=1000&fit=crop&q=80\nHome Tour|Lifestyle|https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=1000&fit=crop&q=80\nBeauty Reviews|Beauty|https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=1000&fit=crop&q=80",
      stats: "250|K|Weekly Readers\n1|M+|Monthly Page Views\n5|Years|In Publication\n98|%|Open Rate",
      testimonials: "The only newsletter I actually read every week.|Reader Since 2022|Newsletter Subscriber\nFinally, recommendations from someone who's actually tested everything.|Long-time Reader|Subscriber",
      forms: "Join the weekly newsletter|Email|Subscribe",
      ctaHeading: "Join 250K women who read every Sunday.",
      leaders: "Founder|Editor in Chief|https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80|This isn't a brand. It's a perspective.|Started as a personal newsletter. Now a publication read by 250K women every week. Mother of two. Probably making coffee right now.",
    },
  },
  {
    id: "studio-portfolio",
    name: "Solo Filmmaker / Photographer",
    icon: "🎞️",
    industry: "Solo media creators — freelance photographers, freelance videographers, solo media producers, small media teams. Showcase-style work-first portfolio. Best for freelance/solopreneur visual creators who want a premium cinematic site. NOT for production studios with physical space (use Production Studio instead) or bloggers (use Freelance/Personal Brand or Lifestyle Blog).",
    goals: ["Lead Generation", "Awareness & Brand Building"],
    desc: "Cinematic black studio. Bold sans-serif, numbered service rows, work-first. Like Lumen Frame, Stink, Smuggler.",
    layoutId: "editorial-bold", themeId: "editorial-dark", accentColor: "#c8791a",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "production",
    homepageSections: ["Hero", "Logo Carousel", "About", "Services", "Process", "Portfolio Carousel", "Stats", "Testimonials", "CTA"],
    defaults: {
      tagline: "The film your brand deserves.",
      heroEyebrow: "EST. 2015 — MULTI-INDUSTRY",
      servicesHeading: "Five video formats. One cinematic standard.",
      servicesEyebrow: "What We Do",
      description: "A cinematic video studio building broadcast-grade film for brands across every industry. From founder interviews to scroll-stopping short-form, we engineer story-led video built around the result you actually need.",
      heroHeading: "The film your brand deserves.",
      heroSubhead: "Cinematic, on-brand, on-schedule. Story-led direction, cinema-grade craft, multi-channel masters.",
      keyMessages: "Story-led direction. Cinema-grade craft. Multi-channel masters. Built for performance.",
      cta1: "Start a project", cta2: "Watch the reel",
      portfolioHeading: "Recent Work",
      aboutHeading: "Cinematic, on-brand, on-schedule.",
      aboutBody: "We started this studio because most brand video looks the same — overlit, overcut, and underbuilt. Our work doesn't. Every film starts with a script worth shooting and ends with edits engineered against the metrics that matter — retention, CTR, conversion. Cinema cameras, prime glass, considered lighting, and a team that obsesses over the hook, the tension, and the close.",
      services: "Founder & Expert Interviews|Cinematic interview setups with multi-cam coverage, broadcast-grade audio and lighting that makes your spokesperson look like the category leader\nCustomer Testimonials|Real stories from real clients, filmed and edited to build trust and drive conversion across every stage of your funnel\nSocial Short-Form (Reels, TikTok, Shorts)|Scroll-stopping short-form content built natively for the platforms and formats your audience actually uses\nPerformance & Brand Video Ads|Paid video built around the brief — hook, hold, and convert. Every frame earns its place\nBrand Films & About-Us Stories|Long-form brand stories that capture who you are and why it matters — the film your company has always deserved",
      portfolio: "Foundry — Founder Interview|Interviews\nHelix — Customer Story|Testimonials\nNorth Star — Brand Film|Brand Film\nAtlas Series — Social|Short-Form\nLuma — Performance Spot|Ads\nNovus — Founder Profile|Interviews",
      process: "Brief|Story strategy, script, and shot list locked in pre-production\nShoot|Cinema cameras, prime lenses, considered lighting — on location or in studio\nEdit|Hero cut plus 9:16, 1:1, and 6-second cut-downs for every channel\nDeliver|Final masters, color, sound, and the asset library your team needs to ship",
      stats: "10|Years|Behind the camera\n200|+|Films Shipped\n50|+|Brands Filmed\n4K|Native|Cinema-Grade Capture",
      testimonials: "Best brand film we've ever made. Doubled our conversion on the landing page.|VP Brand|B2B SaaS\nThey treat every project like the film their reel depends on. That's why we keep coming back.|Marketing Lead|Consumer Brand",
      forms: "Start a project|Name,Email,Company,Project Type,Budget,Timeline,Project Details|Start a project",
      ctaHeading: "Let's build something cinematic.",
    },
  },
  {
    id: "freelance",
    name: "Solo Professional / Creator",
    icon: "💼",
    industry: "Solo professionals and creators — bloggers, content creators, social media creators, UGC creators, writers, consultants, designers, strategists, freelance photographers, freelance videographers, voice-over artists, copywriters, illustrators, marketing freelancers, dev freelancers. Anyone solo who needs a personal-brand-first site. Use this when the brand is built around the person, not the work showcase. NOT for media-showcase sites (use Studio/Portfolio) or lifestyle/travel bloggers (use Lifestyle Blog).",
    goals: ["Lead Generation", "Awareness & Brand Building"],
    desc: "Solo expert positioning. Personal hero, services, work samples, FAQ. For writers, designers, devs, consultants flying solo.",
    layoutId: "studio-modern", themeId: "bone-ink", accentColor: "#3b3b58",
    headingFont: "Inter", bodyFont: "Inter", imageCategory: "marketing",
    homepageSections: ["Hero", "About", "Services", "Process", "Portfolio Carousel", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Independent. Senior. Selective.",
      heroEyebrow: "Independent Senior",
      servicesHeading: "How I can help.",
      servicesEyebrow: "Services",
      description: "Independent senior consultant. Ten years working across startups, agencies, and Fortune 500. Selective about engagements, focused on outcomes.",
      heroHeading: "I help ambitious brands ship work they're proud of.",
      heroSubhead: "Ten years freelancing for teams from seed-stage to Fortune 500. One project at a time, fully embedded.",
      keyMessages: "Senior-level work. Direct communication. No agency markup. Available for 1-2 engagements at a time.",
      cta1: "Check availability", cta2: "See my work",
      portfolioHeading: "Recent Work",
      aboutHeading: "Senior-level work. Direct communication. No middlemen.",
      aboutBody: "I've spent the last decade as a senior independent across companies of every size — from two-person seed startups to publicly traded brands. I freelance because I do my best work when I'm fully embedded with one or two teams at a time. No agency overhead, no project manager between us, no junior handoffs. Just direct collaboration with someone who's done this for a decade.",
      services: "Strategy & Positioning|Sprints to clarify offer, audience, and messaging\nDesign & Identity|Logo, brand system, and the assets to roll it out\nWebsite & Landing Pages|Fast, conversion-focused builds with copy included\nFractional Engagements|Ongoing partnership, retainer or sprint-based",
      portfolio: "Series A SaaS rebrand|Brand Identity|https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=1000&fit=crop&q=80\nE-commerce launch site|Web Design|https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=1000&fit=crop&q=80\nFintech messaging sprint|Strategy|https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1000&fit=crop&q=80\nWellness brand system|Identity|https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=1000&fit=crop&q=80",
      process: "Intro Call|30 minutes to see if there's a fit and scope the work\nProposal|Detailed scope, timeline, and pricing within 48 hours\nKickoff|Async intake, brand immersion, and project plan\nDelivery|Iterative work with regular check-ins until you're thrilled",
      stats: "10|+|Years Freelancing\n80|+|Clients Served\n4.9|★|Project Rating\n95|%|Repeat & Referral",
      testimonials: "Honestly the best freelancer we've worked with. We've extended every engagement.|Head of Brand|Series C Startup\nDirect, senior, and ridiculously fast. Worth every dollar.|Founder|D2C Brand",
      faq: "What's your typical project timeline?|Most engagements run 4-8 weeks. Sprints are 1-2 weeks. Always scoped clearly upfront.\nDo you work with agencies?|Yes, white-label or as named senior — flexible based on the relationship.\nWhat's your rate?|Project-based pricing starting at $5K. Retainers and sprints quoted separately.\nWhere are you based?|Remote-first. Work with clients globally. Available for kickoff travel.",
      pricing: "Sprint|$5K|1-2 week focused engagement, single deliverable\nProject|$15K|4-6 week scoped project, full process\nRetainer|$8K/mo|Ongoing partnership, 20 hours/month, priority access",
      forms: "Get in touch|Name,Email,Company,Project Type,Timeline,About the project|Send message",
      ctaHeading: "Have a project? Let's talk.",
    },
  },
  {
    id: "trades",
    name: "Home Services & Trades",
    icon: "🔧",
    industry: "Electrician, Plumber, Contractor, Landscaper, HVAC, Handyman",
    goals: ["Lead Generation", "Bookings & Reservations"],
    desc: "Local trade business. Phone-prominent hero, service grid, trust signals, service areas. Built for getting found and booked.",
    layoutId: "modern-tech", themeId: "pure-minimal", accentColor: "#f97316",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "trades",
    homepageSections: ["Promo Banner", "Hero", "Service Cards", "Process", "Stats", "Logo Carousel", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Licensed. Insured. On time.",
      heroEyebrow: "Family Owned, Locally Trusted",
      servicesHeading: "What we fix and install.",
      servicesEyebrow: "Services",
      description: "Locally owned and family operated for over 20 years. Licensed, insured, and trusted by thousands of homeowners and businesses.",
      heroHeading: "Fast, professional service when you need it.",
      heroSubhead: "Family-owned and locally trusted for over 20 years. Same-day appointments available.",
      keyMessages: "Licensed and insured. 24/7 emergency service. Free estimates. 100% satisfaction guarantee.",
      cta1: "Get a free quote", cta2: "Call now",
      portfolioHeading: "Recent Projects",
      promoBanner: "24/7 EMERGENCY SERVICE  ·  FREE ESTIMATES  ·  CALL (555) 123-4567",
      aboutHeading: "The neighborhood's trusted team for 20+ years.",
      aboutBody: "Founded in 2003, we've grown from a one-person operation into the area's most trusted service. We've stayed family-owned because we believe in doing the work right, treating people fairly, and standing behind everything we install. Our technicians are licensed, background-checked, and trained on the latest equipment.",
      services: "Emergency Repairs|Same-day response for urgent issues, day or night\nNew Installations|Quality installs backed by manufacturer warranty\nInspections & Maintenance|Annual tune-ups to catch problems before they cost you\nCommercial Service|Long-term contracts for businesses and property managers",
      process: "Free Estimate|Call or text — we come out and quote on the spot\nSchedule|Most jobs scheduled within 48 hours, emergencies same-day\nWork Performed|Licensed techs, clean job site, on-time arrival\nWalkthrough|Show you what we did, you're 100% satisfied or we make it right",
      stats: "20|+|Years Serving the Area\n5,000|+|Happy Customers\n4.9|★|Google Rating\n24|/7|Emergency Response",
      testimonials: "Showed up on time, fixed it right the first time, charged exactly what they quoted.|Sarah M.|Homeowner\nUsed them for emergency repair at 2am. Lifesavers.|Mark T.|Local Business Owner",
      faq: "Are you licensed and insured?|Yes — fully licensed, bonded, and insured. Happy to share documentation.\nDo you offer free estimates?|Yes, on any job over $200. No-obligation and on the spot.\nWhat's your warranty?|All installations come with a 2-year labor warranty plus manufacturer warranties.\nHow soon can you come out?|Most non-emergency calls scheduled within 48 hours. Emergencies same-day, 24/7.",
      forms: "Get a Free Estimate|Name,Phone,Email,Service Needed,Address,Best Time to Call,Describe the Job|Request quote",
      ctaHeading: "Need it fixed today? We're ready.",
    },
  },
  {
    id: "automotive",
    name: "Consumer Auto & Repair",
    icon: "🚗",
    industry: "Consumer/passenger vehicles only — car dealerships, used car lots, auto repair shops, car mechanics, auto detailing, tire shops, car wash, oil change shops, body shops, exotic car rentals, classic car restoration, auto parts retailers, mobile car mechanics. Personal vehicle market only. NOT for semis, fleet trucks, or commercial vehicles (use Trucking/Fleet Services instead).",
    goals: ["Lead Generation", "Bookings & Reservations"],
    desc: "Vehicle-led brand. Sleek hero, service categories, inventory or work showcase, stats. Built for moving wheels.",
    layoutId: "modern-tech", themeId: "charcoal-blush", accentColor: "#dc2626",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "automotive",
    homepageSections: ["Hero", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Drive better. Period.",
      heroEyebrow: "Family-Owned Since 1998",
      servicesHeading: "What we do.",
      servicesEyebrow: "Services",
      description: "Family-owned dealership since 1998. Hand-selected inventory, certified technicians, and service that doesn't end at the sale.",
      heroHeading: "Premium vehicles, expert service, no nonsense.",
      heroSubhead: "Family-owned since 1998. Hand-selected inventory. Service that doesn't end at the sale.",
      keyMessages: "25+ years in business. Certified technicians. Hand-picked inventory. Lifetime service warranty.",
      cta1: "Browse inventory", cta2: "Schedule service",
      portfolioHeading: "Recent Builds",
      aboutHeading: "Three generations. One promise: do right by the customer.",
      aboutBody: "We've been family-owned since 1998, and we've grown by doing one thing: treating customers the way we'd want to be treated. Every vehicle on our lot is hand-inspected before it's listed. Every technician is factory-trained and certified. Every sale comes with our lifetime service guarantee. We don't do hidden fees, last-minute add-ons, or pressure tactics. Never have, never will.",
      services: "New & Pre-Owned|Hand-selected vehicles, every one inspected and certified\nService & Repair|Factory-trained techs, OEM parts, transparent pricing\nDetailing & Restoration|Showroom finish, paint correction, full interior\nFinancing & Trade-In|Top dollar for trades, competitive financing",
      portfolio: "2024 Performance Coupe|New Arrival|https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=1000&fit=crop&q=80\nClassic Restoration|Restoration Project|https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&h=1000&fit=crop&q=80\nLuxury SUV|Pre-Owned|https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&h=1000&fit=crop&q=80\nDaily Driver|Certified Used|https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=1000&fit=crop&q=80",
      process: "Browse|Online or in-person, no pressure ever\nTest Drive|Take any vehicle out, as long as you need\nFair Pricing|Transparent pricing, no surprises, financing for every credit profile\nDrive Off|Lifetime service guarantee and a relationship that lasts",
      stats: "25|+|Years in Business\n10,000|+|Vehicles Sold\n4.9|★|Customer Rating\n98|%|Repeat & Referral",
      testimonials: "Best car-buying experience I've had. Zero pressure, fair pricing, in and out in two hours.|Jennifer L.|Customer\nBeen taking our family's cars here for 15 years. Wouldn't go anywhere else.|Robert K.|Long-time Customer",
      faq: "Do you offer financing?|Yes, financing available for every credit profile. Apply online or in-store.\nWhat's included in the lifetime service guarantee?|State inspections, multi-point checks, and discounted service for as long as you own the vehicle.\nDo you accept trade-ins?|Yes, top-dollar trade values. Bring your vehicle in for a free appraisal.\nDo you offer warranty on used vehicles?|Yes, every certified pre-owned vehicle comes with a 30-day/1,000-mile warranty.",
      forms: "Schedule a visit|Name,Phone,Email,Vehicle of Interest,Preferred Date,Notes|Book appointment",
      ctaHeading: "Find your next vehicle.",
    },
  },
  {
    id: "coaching",
    name: "Coaching & Consulting",
    icon: "🎯",
    industry: "Business Coaches, Consultants, Entrepreneurs, Course Creators",
    goals: ["Lead Generation", "Bookings & Reservations"],
    desc: "Personal authority brand. Founder-led hero, programs, transformations, testimonials. For coaches and experts.",
    layoutId: "apple-minimal", themeId: "linen-clay", accentColor: "#a64f30",
    headingFont: "Playfair Display", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "Leadership", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Testimonials", "Pricing", "FAQ", "Form"],
    defaults: {
      tagline: "Build the business you actually want.",
      heroEyebrow: "Executive Coaching",
      servicesHeading: "How we work together.",
      servicesEyebrow: "Programs",
      description: "Executive coaching for founders ready to scale without burning out. Strategy, systems, and accountability from a former operator.",
      heroHeading: "Helping founders turn vision into traction.",
      heroSubhead: "Strategy, systems, and accountability for entrepreneurs ready to scale without burning out.",
      keyMessages: "10+ years coaching founders from idea to seven figures. Group programs and 1:1. No fluff — clarity and execution.",
      cta1: "Book a free call", cta2: "See client results",
      portfolioHeading: "Client Wins",
      aboutHeading: "Strategy without execution is a wish.",
      aboutBody: "I spent ten years as an operator before becoming a coach. Built and sold two companies. Made every mistake in the book. Now I help founders find the shortcuts I missed and avoid the mistakes I made. My clients are ambitious, coachable, and ready to do the work — not looking for hype, just results.",
      services: "1:1 Coaching|Twelve weeks of focused work on your biggest growth lever\nMastermind|Small cohort of ambitious founders, weekly calls, lifetime network\nIntensive Day|One day, deep dive into your business, plan to leave with\nKeynote & Workshop|Live training for teams, conferences, and corporate retreats",
      portfolio: "From 6 to 7 figures in 18 months|SaaS Founder|https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=1000&fit=crop&q=80\nQuit corporate, launched agency|Career Pivot|https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=1000&fit=crop&q=80\n3x revenue, half the hours|Service Business|https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=1000&fit=crop&q=80\nRaised $2M seed round|Tech Startup|https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=1000&fit=crop&q=80",
      process: "Discovery Call|Free 30 minutes to see if we're a fit\nDeep Dive|Two-hour intensive to understand your business, goals, blockers\nCustom Roadmap|Personalized 90-day plan with milestones and accountability\nWeekly Execution|Weekly calls, async support, adjustments as we go",
      stats: "500|+|Founders Coached\n$50|M+|Client Revenue Added\n10|+|Years Coaching\n4.9|★|Program Rating",
      testimonials: "Best investment I've made in my business. Period.|SaaS Founder|Coaching Client\nShe doesn't sell hype. She gives you the playbook and makes sure you actually execute.|Agency Owner|Mastermind Member",
      pricing: "1:1 Coaching|$10K|12 weeks of focused work on your biggest growth lever\nMastermind|$15K|6 months in a cohort of ambitious founders\nIntensive Day|$5K|One day, deep dive, comprehensive plan to take home\nKeynote|$15K+|Live training for teams, conferences, retreats",
      faq: "Who do you work with?|Founders doing $250K-$5M ready to scale. Service-based, SaaS, e-commerce, agencies.\nWhat makes you different from other coaches?|I'm a former operator. I've built and sold companies. I give you the playbook plus the accountability.\nHow long is the commitment?|1:1 is 12 weeks. Mastermind is 6 months. We start with a discovery call.\nDo you have a guarantee?|Yes — if you do the work and don't see results in the first 6 weeks of 1:1, I'll refund the program.",
      leaders: "Founder|Executive Coach|https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80|Strategy without execution is a wish. Execution without strategy is exhausting.|Former operator turned coach. Built and sold two companies before age 35. Now I help founders avoid the mistakes I made and find the shortcuts I missed.",
      forms: "Free Strategy Call|Name,Email,Phone,Business Stage,Biggest Challenge Right Now|Book my call",
      ctaHeading: "Ready to scale without the burnout?",
    },
  },
  {
    id: "real-estate",
    name: "Real Estate Agent",
    icon: "🏡",
    industry: "Realtors, Brokers, Real Estate Teams, Property Management",
    goals: ["Lead Generation", "Bookings & Reservations"],
    desc: "Hyper-local personal brand. Photo hero, recent listings, neighborhood expertise, big stats. Built for getting buyers and sellers.",
    layoutId: "apple-minimal", themeId: "bone-ink", accentColor: "#1f2940",
    headingFont: "Playfair Display", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Leadership", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Your neighborhood. Your agent.",
      heroEyebrow: "Top 1% Agent",
      servicesHeading: "How I work with you.",
      servicesEyebrow: "Services",
      description: "Hyper-local real estate expertise. Top 1% agent in the area. 15 years. 500+ closings. Specialized in luxury and first-time buyers.",
      heroHeading: "Buying or selling? Let's get you the right deal.",
      heroSubhead: "15 years selling homes in this neighborhood. 500+ closings. Top 1% in the region.",
      keyMessages: "Hyper-local expertise. Top 1% nationally. White-glove service. Aggressive negotiator.",
      cta1: "Schedule a consult", cta2: "View listings",
      portfolioHeading: "Recent Listings",
      aboutHeading: "The neighborhood's most trusted agent.",
      aboutBody: "I've been selling homes in this neighborhood for 15 years. I know every block, every school district, every contractor worth calling. My clients work with me because I'm direct, I do my homework, and I negotiate aggressively on their behalf. Whether you're buying your first home or your fifth, you deserve an agent who treats your transaction like the biggest financial decision of your life — because it usually is.",
      services: "Buying|First-time buyers to luxury — full representation, off-market access\nSelling|Strategic pricing, professional staging, aggressive marketing\nInvestment Property|Rental yields, flip analysis, portfolio strategy\nRelocation|Out-of-state moves, virtual tours, neighborhood briefings",
      portfolio: "Modern Farmhouse|Sold $1.2M Over Ask|https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=1000&fit=crop&q=80\nDowntown Loft|Sold in 7 Days|https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=1000&fit=crop&q=80\nWaterfront Estate|Sold $4.8M|https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&h=1000&fit=crop&q=80\nFirst-Time Buyer|Found Their Dream|https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=1000&fit=crop&q=80",
      process: "Intro Call|We chat about goals, timeline, and what matters to you\nMarket Strategy|Custom analysis of comps, pricing, and positioning\nWhite-Glove Execution|Pro photos, staging, marketing, showings — I handle it\nClose & Beyond|Skilled negotiation through closing and long after",
      stats: "15|+|Years in Real Estate\n500|+|Homes Sold\n$250|M+|In Sales Volume\n1|%|Top Producer Nationally",
      testimonials: "She got us $80K over asking and closed in 9 days. Worth every penny.|Buyer & Seller|Recent Client\nHands-down the best agent in this neighborhood. She knows everyone.|Repeat Client|Investor",
      faq: "What's your commission?|Standard commission, negotiable based on the engagement. Transparent and discussed upfront.\nHow long does it take to sell?|My average listing sells in 14 days. Pricing strategy and staging make the difference.\nDo you work with first-time buyers?|Absolutely — half my business. We'll walk through every step.\nDo you handle out-of-state buyers?|Yes, virtual tours, neighborhood briefings, full remote process available.",
      leaders: "Lead Agent|Realtor® — Top 1% Nationally|https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80|The right agent doesn't sell you a house. They get you the right one for the right price.|15 years in real estate. 500+ closings. Top 1% nationally and the only agent in this neighborhood with that distinction. Lives, works, and raises a family here.",
      forms: "Schedule a free consultation|Name,Phone,Email,Buying or Selling,Timeline,Neighborhoods of interest|Book my consult",
      ctaHeading: "Ready to buy or sell? Let's talk.",
    },
  },
  {
    id: "restaurant",
    name: "Restaurant & Café",
    icon: "🍽️",
    industry: "Restaurants, Cafes, Bars, Food Service",
    goals: ["Bookings & Reservations", "Awareness & Brand Building"],
    desc: "Atmosphere-led food brand. Hero with food, menu categories, story, photos, reservations. Built for foot traffic and bookings.",
    layoutId: "magazine", themeId: "espresso", accentColor: "#d4a574",
    headingFont: "Playfair Display", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "About", "Service Cards", "Portfolio Carousel", "Testimonials", "Stats", "FAQ", "Form"],
    defaults: {
      tagline: "Seasonal. Local. Unforgettable.",
      heroEyebrow: "Open Tuesday–Sunday",
      servicesHeading: "When you visit.",
      servicesEyebrow: "The Experience",
      description: "Neighborhood restaurant rooted in seasonal cooking and the relationships behind every plate. Open since 2018.",
      heroHeading: "Cooked with care. Sourced with intention.",
      heroSubhead: "A neighborhood restaurant where seasonal menus meet warm hospitality. Dinner nightly. Brunch on weekends.",
      keyMessages: "Seasonal menus. Locally sourced. Family-owned. Open since 2018. Reservations recommended.",
      cta1: "Make a reservation", cta2: "View menu",
      portfolioHeading: "News & Updates",
      aboutHeading: "A restaurant rooted in the neighborhood.",
      aboutBody: "We opened in 2018 with a simple idea: cook the food we want to eat, source it from people we trust, and treat every guest like family. Our menu changes with the seasons. Our wine list features small producers. Our team has been with us for years. There's nothing trendy about what we do — we just care a lot.",
      services: "Dinner|Tuesday through Sunday, 5pm to 10pm — seasonal tasting and a la carte\nBrunch|Saturday & Sunday, 10am to 2pm — local eggs, sourdough, fresh juice\nPrivate Events|Buyouts and semi-private dining for 12-60 guests\nWine Club|Monthly curated wines from small producers, with notes from our somm",
      portfolio: "Spring Tasting Menu|Seasonal Series|https://images.unsplash.com/photo-1493770348161-369560ae357d?w=800&h=1000&fit=crop&q=80\nSunday Brunch|Weekend Classic|https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=1000&fit=crop&q=80\nThe Wine Cellar|Curated Selection|https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=1000&fit=crop&q=80\nPrivate Dining|Events|https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=1000&fit=crop&q=80",
      stats: "7|Years|Open and serving\n4.8|★|Average Rating\n200|+|Wines on the List\n90|%|Local Ingredients",
      testimonials: "The best meal we've had in years. Already booked for our anniversary.|Tom & Lisa|Diners\nFavorite restaurant in the city. The team treats every guest like a regular.|Maria|Regular",
      faq: "Do you take reservations?|Yes, recommended. Book online up to 30 days in advance.\nDo you accommodate dietary restrictions?|Absolutely. Let us know when you book — we'll work with vegan, gluten-free, allergies.\nIs there a dress code?|Smart casual. No flip-flops or athletic wear at dinner.\nDo you host private events?|Yes, full buyouts and semi-private dining available. Inquire below.",
      forms: "Reservation request|Name,Email,Phone,Party Size,Preferred Date,Time,Special Requests|Request reservation",
      ctaHeading: "We can't wait to feed you.",
    },
  },
  {
    id: "medical",
    name: "Medical & Dental Practice",
    icon: "🩺",
    industry: "Doctors, Dentists, Clinics, Wellness Practices",
    goals: ["Bookings & Reservations", "Lead Generation"],
    desc: "Trust-led healthcare brand. Insurance banner, calm hero, services, doctor bios, FAQ. Built for patient bookings.",
    layoutId: "swiss-grid", themeId: "sage-stone", accentColor: "#4a5d44",
    headingFont: "Inter", bodyFont: "Inter", imageCategory: "default",
    homepageSections: ["Promo Banner", "Hero", "Service Cards", "Process", "Leadership", "Stats", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Compassionate care. Modern medicine.",
      heroEyebrow: "Accepting New Patients",
      servicesHeading: "What we treat.",
      servicesEyebrow: "Services",
      description: "A modern medical practice focused on prevention, transparency, and patient experience. Most major insurance accepted.",
      heroHeading: "Healthcare that treats you like a person.",
      heroSubhead: "Same-week appointments. Most insurance accepted. Telehealth available.",
      keyMessages: "Board-certified providers. Same-week appointments. Most insurance accepted. Telehealth available.",
      cta1: "Book appointment", cta2: "Patient portal",
      portfolioHeading: "Patient Resources",
      promoBanner: "ACCEPTING NEW PATIENTS  ·  MOST INSURANCE ACCEPTED  ·  SAME-WEEK APPOINTMENTS",
      aboutHeading: "Healthcare without the runaround.",
      aboutBody: "We opened this practice because healthcare shouldn't feel like a factory. Long waits, rushed appointments, hidden fees — that's the old model. We do things differently: appointments start on time, your provider actually listens, and pricing is transparent. Board-certified physicians, in-network with most insurance, and same-week availability for new patients.",
      services: "Primary Care|Annual physicals, screenings, chronic condition management\nPreventive Wellness|Bloodwork, lifestyle planning, proactive screening\nSpecialty Care|Referrals, second opinions, coordinated specialist care\nTelehealth|Virtual visits available for most consultations",
      process: "Book Online|Pick your provider, time, and reason for visit\nCheck In|Digital check-in — paperwork done before you arrive\nYour Visit|Appointments start on time. We listen. We explain.\nFollow Up|Easy patient portal access, prescriptions sent same-day",
      stats: "15|+|Years in Practice\n10,000|+|Patients Served\n4.9|★|Patient Rating\n98|%|Same-Week Availability",
      testimonials: "Finally a doctor who listens. Best healthcare experience I've had as an adult.|Patient|Verified Review\nMy whole family comes here. We trust them completely.|Patient|Verified Review",
      faq: "What insurance do you accept?|Most major plans — Aetna, BCBS, Cigna, United, and more. Self-pay rates available.\nHow soon can I be seen?|New patients seen within the week. Existing patients usually same-day or next-day.\nDo you offer telehealth?|Yes, virtual visits available for most non-urgent issues.\nWhat should I bring to my first visit?|ID, insurance card, and a list of current medications. That's it.",
      leaders: "Lead Physician|MD, Board-Certified|https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=1000&fit=crop&q=80|Healthcare should be a conversation, not a transaction.|15 years in practice. Board-certified in Internal Medicine. Trained at top institutions. Spends real time with patients because that's how medicine should work.",
      forms: "Request an appointment|Name,Email,Phone,Date of Birth,Reason for Visit,Insurance Provider,Preferred Date|Request appointment",
      ctaHeading: "Ready for healthcare that actually cares?",
    },
  },
  {
    id: "law",
    name: "Law Firm",
    icon: "⚖️",
    industry: "Attorneys, Law Firms, Legal Services",
    goals: ["Lead Generation", "Bookings & Reservations"],
    desc: "Authority-led firm. Calm hero, practice areas, attorney bios, case results. Built for credibility and consultations.",
    layoutId: "swiss-grid", themeId: "onyx-bronze", accentColor: "#b87333",
    headingFont: "Playfair Display", bodyFont: "Inter", imageCategory: "default",
    homepageSections: ["Hero", "Service Cards", "Process", "Leadership", "Stats", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Decades of experience. Results that matter.",
      heroEyebrow: "Boutique Practice",
      servicesHeading: "Our practice areas.",
      servicesEyebrow: "Practice Areas",
      description: "Boutique law firm representing individuals and businesses in complex matters. Trial-tested, settlement-savvy, and selective about our clients.",
      heroHeading: "When the stakes are high, experience matters.",
      heroSubhead: "A boutique firm representing individuals and businesses. Decades of trial experience. Selective about clients.",
      keyMessages: "Trial-tested attorneys. Decades of experience. Selective representation. Free consultation.",
      cta1: "Schedule consultation", cta2: "Our practice areas",
      portfolioHeading: "Recent Cases",
      aboutHeading: "Boutique firm. Big firm experience.",
      aboutBody: "We're a boutique firm by design. Big firms have hundreds of attorneys, layers of bureaucracy, and clients who feel like case numbers. We're different. Every client works directly with a senior attorney. Every matter gets the attention it deserves. We're selective about who we represent because that's the only way to deliver the results our clients expect.",
      services: "Business & Commercial|Contracts, disputes, M&A, employment matters\nPersonal Injury|Auto accidents, premises liability, wrongful death\nEstate Planning|Wills, trusts, probate, asset protection\nLitigation|Complex civil litigation in state and federal court",
      process: "Initial Consultation|Free 30-minute consult to discuss your matter\nCase Review|Detailed analysis and strategic recommendations\nRepresentation|Active representation with direct partner-level attention\nResolution|Aggressive advocacy through trial or favorable settlement",
      stats: "30|+|Years Combined Experience\n500|+|Cases Resolved\n95|%|Favorable Outcomes\n4.9|★|Client Rating",
      testimonials: "They treated my case like it was the only one they had. Got me a settlement I didn't think was possible.|Personal Injury Client|Verified\nHonest, direct, and ruthless in court. Exactly what we needed.|Business Client|Verified",
      faq: "Do you offer free consultations?|Yes — 30 minutes, no obligation, to discuss your matter and whether we're a fit.\nWhat's your fee structure?|Hourly, flat fee, or contingency depending on the matter. Always discussed upfront.\nDo you take every case?|No. We're selective — we only take cases we believe in and have the bandwidth to handle properly.\nHow long will my case take?|Every case is different. We'll give you a realistic timeline after the initial review.",
      leaders: "Managing Partner|Founding Attorney|https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1000&fit=crop&q=80|The best lawyers don't just know the law. They know when to fight and when to settle.|30+ years practicing. Trial-tested across hundreds of cases. Founded this firm to give clients the senior attention they deserve.",
      forms: "Schedule a free consultation|Name,Email,Phone,Type of Matter,Brief Description|Schedule consultation",
      ctaHeading: "Let's discuss your matter.",
    },
  },
  {
    id: "photography",
    name: "Event Photographer (Sessions)",
    icon: "📸",
    industry: "Event and portrait photographers specifically — wedding photographers, portrait photographers, family photographers, lifestyle photographers, newborn photographers, brand photographers, documentary photographers. Built around galleries, packages, and booking inquiries. Use Studio/Portfolio for commercial/brand-work-led photo or video freelancers; use this for photographers selling sessions and packages to consumers.",
    goals: ["Bookings & Reservations", "Lead Generation"],
    desc: "Single-photographer portfolio. Image-led hero, packages, galleries, process. Built for booking inquiries.",
    layoutId: "boutique-luxury", themeId: "pure-minimal", accentColor: "#2d2d2d",
    headingFont: "Cormorant Garamond", bodyFont: "Inter", imageCategory: "editorial",
    homepageSections: ["Hero", "Portfolio Carousel", "About", "Service Cards", "Process", "Pricing", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Moments worth keeping.",
      heroEyebrow: "Booking 2026",
      servicesHeading: "Sessions & packages.",
      servicesEyebrow: "Packages",
      description: "A photographer telling honest, timeless stories — weddings, portraits, and the moments in between. Based in the city, available worldwide.",
      heroHeading: "Light, breath, and the in-between.",
      heroSubhead: "Documentary-style photography for weddings, portraits, and the families behind them. Available for 2026 dates.",
      keyMessages: "Documentary-style approach. Editorial sensibility. Booking 12-18 months out. Available for destination work.",
      cta1: "Check availability", cta2: "View galleries",
      portfolioHeading: "Recent Work",
      aboutHeading: "Hi, I'm here for the real moments.",
      aboutBody: "I've been photographing weddings and portraits for ten years. My approach is documentary-style — I'd rather catch a real laugh than pose a fake one. My work has been featured in Vogue, Brides, and Magnolia. I work with about twenty couples a year because that's how I keep the experience personal and the work consistent.",
      services: "Weddings|Full-day documentary coverage from getting ready to last dance\nPortraits|Couples, families, maternity — natural and unposed\nBrand & Editorial|Lookbooks, lifestyle content, brand campaigns\nDestination|Travel weddings and elopements worldwide",
      portfolio: "Tuscany Wedding|Destination|https://images.unsplash.com/photo-1522335789203-aaa7d50d3b86?w=800&h=1000&fit=crop&q=80\nMountain Elopement|Intimate|https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=1000&fit=crop&q=80\nFamily Session|Portrait|https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=1000&fit=crop&q=80\nEditorial Campaign|Brand|https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=1000&fit=crop&q=80",
      process: "Inquiry|Tell me about your day, your story, what you're picturing\nConsultation|We chat (video or coffee) to make sure we're a fit\nBooking|Contract, retainer, and we're on the calendar\nThe Day|Documentary coverage — I capture, you live the moment",
      stats: "10|Years|Photographing\n200|+|Weddings\n50|+|Destination Trips\n100|%|Custom Albums",
      testimonials: "She caught moments I didn't even know happened. The photos make us cry every time.|Couple|2024 Wedding\nWorth every penny. We'll have these photos forever.|Couple|2023 Wedding",
      pricing: "Half-Day|$3,500|6 hours coverage, online gallery, full print rights\nFull Wedding|$6,500|10 hours coverage, second shooter, gallery, custom album\nDestination|$8,500+|Travel included, multi-day coverage, custom packaging\nPortrait Session|$650|2-hour session, online gallery, print release",
      faq: "How far in advance do you book?|12-18 months for weddings. 4-6 weeks for portrait sessions.\nDo you travel for destination work?|Yes, worldwide. Travel and accommodation are included in destination packages.\nHow long until I get my photos?|Sneak peeks within 48 hours. Full gallery within 6 weeks.\nDo you have insurance?|Yes, fully insured for venues that require it.",
      forms: "Inquire about your date|Name,Email,Phone,Event Date,Event Location,Type of Session,Tell me about your story|Send inquiry",
      ctaHeading: "Available for 2026. Let's talk.",
    },
  },
  {
    id: "fitness",
    name: "Fitness & Personal Training",
    icon: "💪",
    industry: "Personal Trainers, Gyms, Fitness Coaches, Wellness",
    goals: ["Bookings & Reservations", "Lead Generation"],
    desc: "High-energy fitness brand. Transformation hero, programs, results, testimonials. Built for getting clients signed up.",
    layoutId: "modern-tech", themeId: "charcoal-blush", accentColor: "#c8ff00",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Testimonials", "Pricing", "FAQ", "Form"],
    defaults: {
      tagline: "Real results. No shortcuts.",
      heroEyebrow: "Real Results",
      servicesHeading: "How we train together.",
      servicesEyebrow: "Programs",
      description: "Personal training and online coaching that actually changes bodies and habits. 10 years coaching. 500+ transformations.",
      heroHeading: "Stop starting over.",
      heroSubhead: "Personal training and online coaching built for results that last. 12-week programs, custom nutrition, real accountability.",
      keyMessages: "Certified trainer. 10+ years coaching. Custom programs. Real accountability. No quick fixes.",
      cta1: "Get started", cta2: "See transformations",
      portfolioHeading: "Latest Programs",
      aboutHeading: "Coaching that actually works.",
      aboutBody: "I've been coaching for ten years. I've worked with everyone from total beginners to competitive athletes. The thing they all have in common? They got real results — and kept them — because we built the habits along with the workouts. No 30-day quick fixes. No miracle protocols. Just consistent work, custom programming, and real accountability.",
      services: "1:1 Personal Training|In-person sessions, customized to your goals and body\nOnline Coaching|Custom programming, weekly check-ins, app-based delivery\nNutrition Coaching|Sustainable eating that supports your training and life\nGroup Training|Small group classes, semi-private programming",
      portfolio: "Lost 40lbs in 6 months|Body Recomposition|https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=1000&fit=crop&q=80\nFirst marathon at 50|Endurance|https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop&q=80\nDeadlifted 2x body weight|Strength|https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=1000&fit=crop&q=80\nPostpartum comeback|Recovery|https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=1000&fit=crop&q=80",
      process: "Assessment|Goals, history, movement, lifestyle — full picture\nProgram Design|Custom training and nutrition built around your reality\nExecution|Sessions, check-ins, adjustments — we work the plan together\nResults|Sustainable change, not a 30-day reset",
      stats: "10|+|Years Coaching\n500|+|Clients Transformed\n4.9|★|Client Rating\n90|%|Hit Their Goal",
      testimonials: "Lost 30 pounds and gained more strength than I had in college. Best investment I've made in myself.|Client|6-month program\nFirst trainer who actually listened. Built a plan that fit my life, not the other way around.|Client|1:1 Training",
      pricing: "1:1 Training|$150/session|In-person, 60 minutes, custom programming\nOnline Coaching|$300/mo|Custom program, weekly check-ins, app delivery\n12-Week Transformation|$2,500|Full program, training + nutrition, hybrid coaching\nGroup Training|$200/mo|Small group, 3x/week, semi-private",
      faq: "What's your training style?|Strength-focused, evidence-based, periodized. We progress like an athlete, even if you're not one.\nDo I need to be in shape to start?|No. Most of my clients start from zero. We meet you where you are.\nDo you do online only?|I offer both. In-person if you're local, online globally.\nWhat's your nutrition philosophy?|Sustainable, not restrictive. Real food, flexible structure, no eliminating food groups.",
      forms: "Start your transformation|Name,Email,Phone,Current Fitness Level,Primary Goal,How long have you been training|Get started",
      ctaHeading: "Done starting over? Let's go.",
    },
  },
  {
    id: "nonprofit",
    name: "Nonprofit & Mission-Driven",
    icon: "🤝",
    industry: "Nonprofits, Charities, Foundations, Mission-Driven Orgs",
    goals: ["Donations & Fundraising", "Awareness & Brand Building", "Community & Newsletter Growth"],
    desc: "Mission-led organization. Impact hero, programs, leadership, stories, donation form. Built for engagement and giving.",
    layoutId: "editorial-minimal", themeId: "sage-stone", accentColor: "#4a5d44",
    headingFont: "Playfair Display", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "About", "Service Cards", "Stats", "Leadership", "Portfolio Carousel", "Testimonials", "Form"],
    defaults: {
      tagline: "Change starts where we choose to look.",
      heroEyebrow: "501(c)(3) Nonprofit",
      servicesHeading: "Our programs.",
      servicesEyebrow: "Programs",
      description: "A nonprofit organization working to expand access, opportunity, and dignity for the communities we serve. 501(c)(3). Founded in 2014.",
      heroHeading: "Real change. Measurable impact.",
      heroSubhead: "We're a nonprofit working to expand opportunity in our communities. Every dollar funds programs — not overhead.",
      keyMessages: "501(c)(3) nonprofit. 90% of funds go to programs. Volunteer-led leadership. Transparent annual reports.",
      cta1: "Donate now", cta2: "Get involved",
      portfolioHeading: "Recent Impact",
      aboutHeading: "Why this work matters.",
      aboutBody: "We started this organization in 2014 because we saw a gap that wasn't being filled. Ten years later, we've served over 50,000 people, built partnerships with community leaders, and proven that focused, measurable work changes lives. We're proud to be volunteer-led at the board level, lean on operations, and transparent about every dollar that comes in.",
      services: "Programs|Direct services to the people we serve, every day\nAdvocacy|Policy work and community organizing for systemic change\nPartnerships|Collaboration with community orgs amplifies impact\nResearch|Data and reporting that informs our work and the field",
      portfolio: "Annual Impact Report|2024 Results|https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1000&fit=crop&q=80\nCommunity Initiative|Local Programs|https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=800&h=1000&fit=crop&q=80\nVolunteer Stories|Get Involved|https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=1000&fit=crop&q=80\nAdvocacy Wins|Policy Impact|https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=1000&fit=crop&q=80",
      stats: "50|K+|People Served\n10|Years|In the Community\n90|%|To Programs\n500|+|Active Volunteers",
      testimonials: "This organization changed my life. They didn't just give us support — they gave us a community.|Program Participant|2024\nThe most effective nonprofit I've donated to. Every dollar shows up in their work.|Long-time Donor|Monthly Giver",
      leaders: "Executive Director|Founder|https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80|We don't measure success by donations raised. We measure it by lives changed.|Founded this organization ten years ago after seeing the gap firsthand. Background in community organizing and public policy. Lives the mission.",
      forms: "Make a difference|Name,Email,Amount (optional),How would you like to help|Get involved",
      ctaHeading: "Your support changes lives.",
    },
  },
  {
    id: "education",
    name: "Online Course & Education",
    icon: "🎓",
    industry: "Online Courses, Bootcamps, Schools, Edtech, Educators",
    goals: ["Applications & Sign-ups", "Lead Generation"],
    desc: "Student-outcome focused. Big curriculum, testimonials, results, instructor bio, pricing. Built for course enrollment.",
    layoutId: "modern-tech", themeId: "midnight", accentColor: "#7c3aed",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "marketing",
    homepageSections: ["Hero", "Service Cards", "Process", "Portfolio Carousel", "Stats", "Leadership", "Testimonials", "Pricing", "FAQ", "Form"],
    defaults: {
      tagline: "Learn the skills that get you paid.",
      heroEyebrow: "Apply Now",
      servicesHeading: "Programs we offer.",
      servicesEyebrow: "Programs",
      description: "An online learning platform that teaches in-demand skills through project-based curriculum, real mentorship, and job-ready outcomes.",
      heroHeading: "Skills that change your career, not your weekend.",
      heroSubhead: "Project-based programs, real mentorship, and the network to actually get hired. Next cohort starts soon.",
      keyMessages: "Project-based curriculum. 1:1 mentorship. Job placement support. 90%+ completion rate.",
      cta1: "Apply now", cta2: "View curriculum",
      portfolioHeading: "Student Highlights",
      aboutHeading: "Education built for outcomes.",
      aboutBody: "Most online courses are video libraries you never finish. Most bootcamps are expensive and inflexible. We built this differently — project-based curriculum, weekly 1:1 mentorship, and a community that holds you accountable. Our students don't just learn — they ship work, build portfolios, and get hired.",
      services: "Foundations Cohort|12 weeks from zero to job-ready in your chosen track\nAdvanced Specialization|6 months going deep into a specific discipline\n1:1 Mentorship|Weekly calls with senior practitioners in your field\nCareer Coaching|Resume, portfolio, interview prep, and job placement support",
      portfolio: "Backend Engineering Track|12-Week Cohort|https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=1000&fit=crop&q=80\nProduct Design Specialization|6-Month Deep Dive|https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=1000&fit=crop&q=80\nData Analytics|Foundations|https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=1000&fit=crop&q=80\nMarketing Operations|Career Track|https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=1000&fit=crop&q=80",
      process: "Apply|Quick application to make sure the program is a fit\nKickoff|Cohort starts together, intro session, set your goals\nLearn & Build|Live sessions, projects, 1:1 mentor calls every week\nLand the Job|Portfolio, job prep, intros to our hiring partners",
      stats: "5,000|+|Students Graduated\n90|%|Completion Rate\n78|%|Hired Within 6 Months\n4.9|★|Program Rating",
      testimonials: "Worth every dollar. Got a job three weeks after graduating. The mentorship made the difference.|Graduate|Career Switcher\nFinally a program that actually prepared me to do the job, not just talk about it.|Graduate|Foundations Cohort",
      pricing: "Foundations|$2,500|12 weeks, weekly mentorship, project-based\nSpecialization|$5,000|6 months, advanced curriculum, capstone\nFull Program|$7,500|12 weeks + 6 months specialization, full career support\nPayment Plans|Available|Split payments and income share options available",
      faq: "Do I need experience to apply?|For Foundations, no — designed for beginners. Specialization requires some background.\nIs it live or self-paced?|Hybrid — weekly live sessions and 1:1 mentorship, asynchronous coursework you can do on your schedule.\nDo you guarantee a job?|We don't guarantee jobs (no one honest does), but 78% of our grads are hired within 6 months.\nWhat's the refund policy?|Two-week no-questions-asked refund window after the cohort starts.",
      leaders: "Founder|Lead Instructor|https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=1000&fit=crop&q=80|Most education trains you for tests. We train you for work.|10+ years as a practitioner before becoming an educator. Built this program because the existing options weren't producing students ready for real jobs.",
      forms: "Apply for the next cohort|Name,Email,Phone,Track of Interest,Current Experience,Why are you interested|Apply now",
      ctaHeading: "Next cohort starts soon. Apply now.",
    },
  },
  {
    id: "trucking",
    name: "Commercial Trucking & Fleet",
    icon: "🚛",
    industry: "Heavy-duty and medium-duty commercial vehicles only — semi trucks, big rigs, construction trucks, dump trucks, delivery fleets (Amazon, UPS, FedEx vans), school buses, transit buses, RVs, trailers, owner-operators, mobile diesel technicians, fleet repair brick-and-mortar shops, fleet maintenance services, DOT inspections, roadside assistance for commercial vehicles, logistics & dispatch. Commercial fleet operations only. NOT for personal cars or auto repair (use Automotive/Transportation instead).",
    goals: ["Lead Generation", "Applications & Sign-ups"],
    desc: "24/7 fleet operation. Bold yellow CTAs, urgent hero, coast-to-coast service map. Like TopTech Fleet, Epika Fleet.",
    layoutId: "modern-tech", themeId: "midnight", accentColor: "#fbbf24",
    headingFont: "Manrope", bodyFont: "Inter", imageCategory: "trades",
    homepageSections: ["Promo Banner", "Hero", "Service Cards", "Process", "Stats", "Portfolio Carousel", "Logo Carousel", "Testimonials", "FAQ", "Form"],
    defaults: {
      tagline: "Keeping you moving. Anytime, anywhere.",
      heroEyebrow: "24/7 Fleet Maintenance & Emergency Repair",
      servicesHeading: "Mile one to mile one million.",
      servicesEyebrow: "What We Handle",
      description: "A nationwide fleet maintenance and emergency repair network. Coast to coast coverage, 24/7 dispatch, and the service providers to get your trucks back on the road.",
      heroHeading: "Keeping you moving.",
      heroSubhead: "24/7 fleet maintenance and emergency repair from a coast-to-coast network of certified service providers. One call. Anywhere in the country. Anytime.",
      keyMessages: "24/7 dispatch. Nationwide coverage. Certified providers. Real-time tracking. Same-hour response in major markets.",
      cta1: "Get help now", cta2: "Become a provider",
      portfolioHeading: "Fleet News",
      promoBanner: "24/7 EMERGENCY DISPATCH  ·  CALL 1-800-555-FLEET  ·  COAST TO COAST",
      aboutHeading: "Forget the letdowns.",
      aboutBody: "Fleet downtime costs you thousands an hour. The old model — calling shop after shop, hoping someone has a bay open — doesn't work for modern fleets. We built a nationwide network of vetted, certified service providers backed by 24/7 dispatch, real-time tracking, and the systems your operations team actually needs. From routine PM to emergency roadside, we get you back on the road faster.",
      services: "Emergency Roadside Repair|Same-hour dispatch in major markets, 24/7, nationwide — diesel, hydraulics, electrical, tires\nPreventative Maintenance|Scheduled PM at certified shops with digital DVIRs, parts tracking, and unified billing\nMobile Service|Onsite mechanics for fleets that can't afford the drive in — yards, distribution centers, terminals\nTire & Wheel Service|Mounted, balanced, replaced — passenger, commercial, and OTR\nFleet Inspections & DOT|Annual inspections, DOT compliance, brake adjustments, lighting and air systems\nNational Account Management|Single point of contact, consolidated invoicing, fleet-wide reporting and analytics",
      portfolio: "Regional Carrier — 450 Trucks|National Account\nFood-Service Fleet — 1,200 Vehicles|National Account\nLast-Mile Delivery — Coast to Coast|National Account\nLong-Haul Owner-Operators|Network Partners\nMunicipal Fleet — 600 Vehicles|Public Sector\nLogistics Provider — 2,000+ Trucks|Enterprise",
      process: "Call or App|24/7 dispatch picks up in under 60 seconds — describe the issue, share location\nMatch|We assign the closest certified provider with availability and parts in stock\nTrack|Real-time ETA, technician credentials, and live updates to your operations team\nBack on the Road|Unified billing, digital paperwork, fleet-wide reporting — back in service",
      stats: "1,500|+|Certified Providers\n48|States|Nationwide Coverage\n60|Sec|Dispatch Response\n24|/7|Always On",
      testimonials: "Got a driver back on the road in 90 minutes outside Amarillo at 2am. Saved the load and the relationship with the customer.|Operations Director|Regional Carrier\nThe unified billing and reporting alone is worth it. The 24/7 dispatch is why we'll never leave.|VP Fleet|National Logistics Provider",
      faq: "How fast is dispatch?|Calls answered in under 60 seconds, 24/7. Average tech arrival in major markets is 90 minutes.\nWhat geographic coverage do you have?|48 states. 1,500+ certified providers from coast to coast. Even rural routes covered through our partner network.\nDo you handle all truck classes?|Yes — Class 3 through Class 8, plus trailers, reefers, and yard equipment.\nHow does billing work?|Single national account with consolidated monthly invoicing. Net 30 terms for qualified fleets.\nAre your providers certified?|Yes. Every shop and mobile tech is vetted, insured, and certified before joining the network.",
      forms: "Get help now|Name,Company,Phone,Email,Fleet Size,Service Needed,Location,Urgency|Get help now",
      ctaHeading: "Trucks down? We're already moving.",
    },
  },
  {
    id: "wedding-planner",
    name: "Wedding & Event Planner",
    icon: "💍",
    industry: "Wedding Planners, Event Planners, Destination Coordinators",
    goals: ["Bookings & Reservations", "Lead Generation"],
    desc: "Romantic event planner. Fullbleed hero, serif type, booking-led. Soft palette, couple-focused storytelling.",
    layoutId: "wedding-editorial", themeId: "linen-clay", accentColor: "#9c6b56",
    headingFont: "Cormorant Garamond", bodyFont: "Inter", imageCategory: "lifestyle",
    homepageSections: ["Hero", "About", "Service Cards", "Process", "Portfolio Carousel", "Pricing", "Testimonials", "Leadership", "FAQ", "Form"],
    defaults: {
      tagline: "Weddings worth remembering.",
      heroEyebrow: "Booking 2026 & 2027",
      servicesHeading: "How we plan together.",
      servicesEyebrow: "Services",
      description: "A full-service wedding and event planning studio for couples who want their celebration to feel personal, intentional, and unmistakably theirs. Based locally, available for destination weddings worldwide.",
      heroHeading: "The wedding you've imagined, brought to life.",
      heroSubhead: "Full-service planning for couples who want their day to feel personal, intentional, and unmistakably theirs.",
      keyMessages: "Full-service planning. Partial planning. Month-of coordination. Destination weddings. 12 weddings a year so every one gets us at our best.",
      cta1: "Inquire about your date", cta2: "View weddings",
      portfolioHeading: "Recent Celebrations",
      aboutHeading: "Hi, I'm the planner you've been looking for.",
      aboutBody: "I've planned over 200 weddings across the last decade, from intimate backyard ceremonies to multi-day destination celebrations in Tuscany, Mexico, and beyond. My approach isn't about Pinterest boards and trend chasing — it's about listening carefully, asking better questions, and building a day that feels like the two of you. I take twelve couples a year so every one gets the kind of attention this day deserves.",
      services: "Full Planning|14+ months of partnership — design, vendors, logistics, day-of, everything\nPartial Planning|You've started — I take it from here. Vendor coordination, design refinement, day-of\nMonth-Of Coordination|You planned it. I run it. Six weeks out, I take the reins so you can be a guest at your own wedding\nDestination Weddings|Local-anywhere planning, vendor sourcing, multi-day events, travel logistics for guests\nElopements & Micro-Weddings|Intimate ceremonies with the same care as a 200-guest celebration\nCorporate & Private Events|Anniversaries, milestone birthdays, brand activations, fundraisers",
      portfolio: "Tuscan Villa Wedding|Destination — Italy\nMountain Elopement|Intimate — Aspen\nGarden Estate Ceremony|Full-Service — Local\nBeach Multi-Day|Destination — Tulum\nUrban Loft Reception|Partial Planning — NYC\nVineyard Weekend|Full-Service — Napa",
      process: "First Conversation|A complimentary discovery call to talk about your vision and see if we're a fit\nDesign & Direction|Mood, palette, narrative — we build the day from the feeling outward\nVendor Curation|Hand-picked vendors I trust, briefed on your story before they ever quote\nThe Wedding|I'm there from the first vendor arrival to the last guest goodnight — you're a guest at your own wedding",
      stats: "10|Years|Planning Weddings\n200|+|Couples Married\n12|/Year|Couples I Take On\n100|%|Custom, Never Templated",
      testimonials: "I genuinely don't know how anyone gets married without her. She thought of things we'd have never thought to think of.|The Hendersons|2024 Wedding\nWe had a real, beautiful, on-time wedding — and got to actually enjoy it. That's the gift.|The Patel-Reyes|Destination, 2023",
      pricing: "Full Planning|$15,000+|14+ months, full design and logistics, unlimited meetings\nPartial Planning|$8,500|Pick up where you left off, vendor coordination, day-of\nMonth-Of Coordination|$3,500|Six weeks out — timeline, vendor briefing, run-of-show\nDestination|$25,000+|Full planning plus travel, accommodation logistics, multi-day events",
      faq: "How far in advance do couples book?|Most book 14-18 months out for full planning. Month-of coordination usually 3-6 months out.\nDo you travel for destination weddings?|Yes, worldwide. Travel and accommodation are billed separately and discussed upfront.\nWhy only 12 couples a year?|Because anything more and I can't give your day the focus it deserves. This is my actual cap.\nDo you work with our vendors or yours?|Both. I have a vetted vendor network I love, but I'll happily work with vendors you've already booked.",
      leaders: "Founder|Lead Planner & Creative Director|https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=1000&fit=crop&q=80|A great wedding doesn't feel produced. It feels like you, on the best day of your life.|10+ years planning weddings across four continents. Trained at one of the country's top event firms before going independent. Lives for the moment when the couple sees their first look reveal.",
      forms: "Inquire about your date|Name,Partner's Name,Email,Phone,Event Date,Estimated Guest Count,Venue or Location,Planning Service Needed,Tell me about your story|Send inquiry",
      ctaHeading: "Available for 2026 & 2027. Let's talk.",
    },
  },
];

// Apply a website template — sets layout, theme, fonts, accent, sections, and copy
const applyWebsiteTemplate = (template, brand, page) => {
  const theme = THEMES.find(t => t.id === template.themeId);
  const d = template.defaults || {};
  const newBrand = {
    ...brand,
    templateId: template.id,
    layoutId: template.layoutId,
    themeId: template.themeId,
    accentColor: template.accentColor,
    headingFont: template.headingFont || brand.headingFont,
    bodyFont: template.bodyFont || brand.bodyFont,
    imageCategory: template.imageCategory || "editorial",
    ...(theme ? {
      primaryColor: theme.primaryColor,
      cardBgColor: theme.cardBgColor,
      bodyTextColor: theme.bodyTextColor,
      borderColor: theme.borderColor,
      themeMode: theme.mode,
    } : {}),
    tagline: d.tagline || brand.tagline,
    // Description and Key Messages are user-written prose — DON'T apply template defaults.
    // The empty state shows instructive placeholders instead. The AI Draft Starter Copy
    // will fill these in based on the user's real brand context.
    description: brand.description || "",
    keyMessages: brand.keyMessages || "",
    cta1: d.cta1 || brand.cta1,
    cta2: d.cta2 || brand.cta2,
    marqueeText: d.marqueeText ?? brand.marqueeText ?? "",
    promoBanner: d.promoBanner ?? brand.promoBanner ?? "",
    // Template's intended goals (multi-select) — overrides brand's current goals
    goals: template.goals && template.goals.length ? template.goals : (brand.goals || []),
    // Also keep singular goal field synced to first goal for backward compatibility
    goal: template.goals && template.goals.length ? template.goals[0] : brand.goal,
  };
  // Override every page field that templates define — so applying Coaching
  // doesn't leave Process/Stats/About reading like a production studio.
  const newPage = {
    ...page,
    sections: template.homepageSections,
    heroHeading: d.heroHeading || page.heroHeading,
    heroSubhead: d.heroSubhead || page.heroSubhead,
    aboutHeading: d.aboutHeading || page.aboutHeading,
    aboutBody: d.aboutBody || page.aboutBody,
    services: d.services || page.services,
    portfolio: d.portfolio || page.portfolio,
    process: d.process || page.process,
    team: d.team || page.team,
    blog: d.blog || page.blog,
    stats: d.stats || page.stats,
    testimonials: d.testimonials || page.testimonials,
    pricing: d.pricing || page.pricing,
    faq: d.faq || page.faq,
    forms: d.forms || page.forms,
    // CTA Heading is a user-written conversion line — keep empty so placeholder shows
    ctaHeading: page.ctaHeading || "",
    leaders: d.leaders || page.leaders,
    promoBanner: d.promoBanner ?? page.promoBanner ?? "",
    servicesHeading: d.servicesHeading || page.servicesHeading || "",
    servicesEyebrow: d.servicesEyebrow || page.servicesEyebrow || "",
    heroEyebrow: d.heroEyebrow || page.heroEyebrow || "",
  };
  return { brand: newBrand, page: newPage };
};

// ──────────────────────────────────────────────────────────────────────────────
// TAB_ORDER — the linear workflow steps in the editor. Drives the Next/Back
// navigation footer at the bottom of every tab so users feel a guided flow.
const TAB_ORDER = [
  { id: "discovery", label: "Discovery" },
  { id: "brand", label: "Brand" },
  { id: "page", label: "Page" },
  { id: "content", label: "Content" },
  { id: "social", label: "Social" },
  { id: "footer", label: "Header & Footer" },
  { id: "export", label: "Export & Import" },
];

// ──────────────────────────────────────────────────────────────────────────────
// PREMIUM ACCENT SWATCHES — quick-swap accent colors that pair well with any
// theme. Click one to override just the accent. Includes everything from
// editorial restraint (champagne, sage) to bold modern (neon, coral, electric).
// ──────────────────────────────────────────────────────────────────────────────
const PREMIUM_ACCENTS = [
  { name: "Champagne", value: "#c9a86a" },
  { name: "Bronze", value: "#b87333" },
  { name: "Terracotta", value: "#a64f30" },
  { name: "Burgundy", value: "#722f37" },
  { name: "Dusty Rose", value: "#c97d7d" },
  { name: "Coral", value: "#ed7464" },
  { name: "Sage", value: "#4a5d44" },
  { name: "Forest", value: "#2d4a3e" },
  { name: "Ink Navy", value: "#1f2940" },
  { name: "Electric Blue", value: "#3b82f6" },
  { name: "Neon Green", value: "#39ff14" },
  { name: "Acid Lime", value: "#c8ff00" },
  { name: "Hot Pink", value: "#ff2d92" },
  { name: "Pure Black", value: "#0a0a0a" },
  { name: "Pure White", value: "#ffffff" },
];

const applyTheme = (theme, brand) => ({
  ...brand,
  primaryColor: theme.primaryColor,
  cardBgColor: theme.cardBgColor,
  accentColor: theme.accentColor,
  bodyTextColor: theme.bodyTextColor,
  borderColor: theme.borderColor,
  themeId: theme.id,
  themeMode: theme.mode,
});

// ──────────────────────────────────────────────────────────────────────────────
// COLOR CONTRAST HELPERS — ensures text is always readable on its background.
// Uses perceptual luminance (WCAG-style) to pick black or white text dynamically.
// ──────────────────────────────────────────────────────────────────────────────
const luminance = (hex) => {
  if (!hex || typeof hex !== "string") return 0.5;
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  const r = parseInt(h.substr(0, 2), 16) / 255;
  const g = parseInt(h.substr(2, 2), 16) / 255;
  const b = parseInt(h.substr(4, 2), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
const isLight = (hex) => luminance(hex) > 0.55;
const textOn = (bg) => isLight(bg) ? "#0a0a0a" : "#ffffff";
const mutedTextOn = (bg) => isLight(bg) ? "rgba(10,10,10,0.65)" : "rgba(255,255,255,0.75)";
const subtleTextOn = (bg) => isLight(bg) ? "rgba(10,10,10,0.5)" : "rgba(255,255,255,0.55)";

// Returns a sensible button color pair that works on any section background
const buttonOn = (sectionBg, accent) => {
  // If accent has enough contrast with section bg, use it.
  // Otherwise fall back to textOn (black or white) for guaranteed readability.
  const accentLum = luminance(accent);
  const sectionLum = luminance(sectionBg);
  const hasContrast = Math.abs(accentLum - sectionLum) > 0.25;
  const btnBg = hasContrast ? accent : textOn(sectionBg);
  const btnText = textOn(btnBg);
  return { btnBg, btnText };
};

// Returns image URL if provided, otherwise a stable Picsum placeholder
// ──────────────────────────────────────────────────────────────────────────────
// IMAGE LIBRARY — curated Unsplash photo IDs by industry/category. Used as
// fallback when no custom image URL is provided. Photos are CDN-served (no API
// key needed). Each template sets brand.imageCategory which steers fallback
// imagery to match the industry — agency gets creative-team shots, production
// gets cameras/lighting, e-commerce gets product shots, etc.
// ──────────────────────────────────────────────────────────────────────────────
const IMAGE_LIBRARY = {
  // Marketing agency: creative teams, ad work, brainstorm, modern offices
  marketing: [
    "1551434678-e076c223a692", "1556761175-5973dc0f32e7", "1552664730-d307ca884978",
    "1486312338219-ce68d2c6f44d", "1542744173-8e7e53415bb0", "1517048676732-d65bc937f952",
    "1559136555-9303baea8ebd", "1521737604893-d14cc237f11d", "1542626991-cbc4e32524cc",
    "1556761175-b413da4baf72", "1497215842964-222b430dc094", "1531545514256-b1400bc00f31",
  ],
  // Production studio: cameras, lenses, lighting, studio spaces, photographers
  production: [
    "1502920917128-1aa500764cbd", "1485846234645-a62644f84728", "1492691527719-9d1e07e534b4",
    "1486818711795-cdc8e3a6f23a", "1518770660439-4636190af475", "1454165804606-c3d57bc86b40",
    "1532800783378-1bed60adaf58", "1518495973542-4542c06a5843", "1500634245200-e5245c7574ef",
    "1542038784456-1ea8e935640e", "1500634245200-e5245c7574ef", "1452457750107-cd084dce177d",
  ],
  // E-commerce: products, fashion, packaging, lifestyle product shots
  product: [
    "1542291026-7eec264c27ff", "1523275335684-37898b6baf30", "1505740420928-5e560c06d30e",
    "1556228720-195a672e8a03", "1583394838336-acd977736f90", "1591047139829-d91aecb6caea",
    "1571781926291-c477ebfd024b", "1556905055-8f358a7a47b2", "1596462502278-27bfdc403348",
    "1485518882345-15568b007407", "1490481651871-ab68de25d43d", "1576566588028-4147f3842f27",
  ],
  // Lifestyle blog: wellness, food, home, travel, cozy moments
  lifestyle: [
    "1545205597-3d9d02c29597", "1506905925346-21bda4d32df4", "1499209974431-9dddcece7f88",
    "1490645935967-10de6ba17061", "1493770348161-369560ae357d", "1551218808-94e220e084d2",
    "1542838132-92c53300491e", "1571019613454-1cb2f99b2d8b", "1490818387583-1baba5e638af",
    "1519681393784-d120267933ba", "1499209974431-9dddcece7f88", "1516589178581-6cd7833ae3b2",
  ],
  // Editorial / beauty studio portfolio: high-end beauty, lips, skincare, fashion
  editorial: [
    "1596462502278-27bfdc403348", "1522335789203-aaa7d50d3b86", "1556228578-8c89e6adf883",
    "1571781926291-c477ebfd024b", "1597586124394-fbd6ef244026", "1487412947147-5cebf100ffc2",
    "1556228852-80b6e5eeff06", "1522335789203-aaa7d50d3b86", "1556909114-f6e7ad7d3136",
    "1583001931096-959e9a1a6223", "1610992015732-2449b76344bc", "1571781926291-c477ebfd024b",
  ],
  // Portraits — for team, leadership, testimonial avatars
  portrait: [
    "1494790108377-be9c29b29330", "1500648767791-00dcc994a43e", "1438761681033-6461ffad8d80",
    "1472099645785-5658abf4ff4e", "1580489944761-15a19d654956", "1531746020798-e6953c6e8e04",
    "1573496359142-b8d87734a5a2", "1517841905240-472988babdf9", "1534528741775-53994a69daeb",
    "1544005313-94ddf0286df2", "1607746882042-944635dfe10e", "1492562080023-ab3db95bfbce",
  ],
  // Trades / skilled services — tools, construction, electrical, plumbing, carpentry, contractors
  trades: [
    "1504917595217-d4dc5ebe6122", "1581094288338-2314dddb7ece", "1503387762-cf76f7d1f9be",
    "1517490232338-06b912a786b5", "1565008447742-97f6f38c985c", "1581094794329-c8112a89af12",
    "1572297983-5c3d96ad95a3", "1581092446327-9b52bd1570c2", "1581094272901-8a5b8c4e7d83",
    "1530124566582-a618bc2615dc", "1581093588401-fbb62a02f120", "1503387762-cf76f7d1f9be",
  ],
  // Automotive / transportation — cars, garages, mechanics, fleet, luxury vehicles
  automotive: [
    "1583121274602-3e2820c69888", "1502877338535-766e1452684a", "1492144534655-ae79c964c9d7",
    "1494976388531-d1058494cdd8", "1493238792000-8113da705763", "1503376780353-7e6692767b70",
    "1542362567-b07e54358753", "1485291571150-772bcfc10da5", "1503376780353-7e6692767b70",
    "1552519507-da3b142c6e3d", "1492144534655-ae79c964c9d7", "1583121274602-3e2820c69888",
  ],
  // Default — generic office/workspace fallback
  default: [
    "1497366216548-37526070297c", "1497366754035-f200968a6e72", "1497366811353-6870744d04b2",
    "1497032628192-86f99bcd76bc", "1542744173-8e7e53415bb0", "1556761175-5973dc0f32e7",
  ],
};

// Pick a deterministic image from a category based on seed (so same seed always returns same image)
const pickImage = (category, seed, w, h) => {
  const list = IMAGE_LIBRARY[category] || IMAGE_LIBRARY.default;
  let hash = 0;
  const s = String(seed || "x");
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % list.length;
  return `https://images.unsplash.com/photo-${list[idx]}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
};

// Returns the provided URL, or a category-appropriate Unsplash photo as fallback.
// Category steers the type of image (marketing/production/product/lifestyle/editorial/portrait).
const imgOrPlaceholder = (url, seed, w = 800, h = 1000, category = "editorial") => {
  if (url && url.trim()) return url.trim();
  return pickImage(category, seed, w, h);
};

// Line-art social icons
const SVG = {
  instagram: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="${c}"/></svg>`,
  tiktok: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4a4 4 0 0 0 4 4"/></svg>`,
  youtube: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><polygon points="10,9 15,12 10,15" fill="${c}"/></svg>`,
  linkedin: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="10" x2="8" y2="16"/><circle cx="8" cy="7" r="0.5" fill="${c}"/><path d="M12 16v-4a2 2 0 0 1 4 0v4"/><line x1="12" y1="10" x2="12" y2="16"/></svg>`,
  facebook: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a4 4 0 0 0-4 4v3H8v4h3v8h4v-8h3l1-4h-4V6a1 1 0 0 1 1-1h3z"/></svg>`,
  pinterest: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M10 22l2-8M9 12a3 3 0 1 1 6 0c0 2-1 4-3 4s-3-2-3-4"/></svg>`,
  threads: (c, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 11.5c-.5-3-2.5-5-5-5-3 0-5 2-5 5 0 2.5 1.5 4.5 4 5 2.5.5 4-1 4-2.5 0-2-2-2.5-3-1.5"/><path d="M12 22c5 0 9-3 9-9.5C21 5 17 2.5 12 2.5S3 5 3 12.5C3 19 7 22 12 22z"/></svg>`,
};

// ──────────────────────────────────────────────────────────────────────────────
// INITIAL STATE — Editorial Vibes pre-loaded
// ──────────────────────────────────────────────────────────────────────────────
const EV_BRAND = {
  name: "Editorial Vibes",
  industry: "Premium content production studio — beauty, health, wellness & lifestyle",
  tagline: "Content that moves product.",
  description: "Editorial Vibes is a premium content production studio founded in 2015. We produce video, product photography, model photography, and lifestyle photography for beauty, health, wellness and lifestyle brands. 100+ clients including Sephora, Laura Mercier, Kérastase, La Roche-Posay, Garnier. Full production partner from brief to final delivery.",
  targetAudience: "Brand managers and marketing directors at premium product-based brands; PE firms with consumer portfolio companies.",
  keyMessages: "Premium studio quality with strategy behind every shoot. 10 years in business. 100+ brand clients. Full production partner — video, photo, and consulting under one roof.",
  tone: "Editorial & Minimal",
  goal: "Lead Generation",
  goals: ["Lead Generation", "Awareness & Brand Building"],
  outcome: "Book 4–6 qualified project inquiries per month from premium beauty and wellness brands.",
  primaryKeywords: "content production studio, beauty brand photography, video production, premium brand content, product photography",
  brandColors: { background: "", accent: "", text: "", card: "" },
  templateId: "studio-portfolio",
  imageCategory: "editorial",
  themeId: "editorial-dark",
  themeMode: "dark",
  layoutId: "editorial-minimal",
  primaryColor: "#0a0a0a",
  accentColor: "#c7a572",
  cardBgColor: "#111111",
  bodyTextColor: "#a8a8a8",
  borderColor: "#1f1f1f",
  headingFont: "Yeseva One",
  bodyFont: "DM Sans",
  logoUrl: "",
  logoText: "Editorial Vibes",
  cta1: "Start a project",
  cta2: "See the work",
  inspoUrls: "https://www.rosalie.agency/\nhttps://www.lustre.nyc/\nhttps://www.breef.com/\nhttps://faure.octrace.com/\nhttps://nevo.themevillain.com/",
  styleNotes: "Dark background, lowercase or all-caps navigation, work-first hierarchy, extreme restraint on copy, editorial feel. Numbered services. Split layouts. Generous negative space.",
  footerStyle: "Premium",
  headerStyle: "Editorial",
  multiMenu: true,
  primaryMenu: "Home, Work, Services, About, Contact",
  utilityMenu: "Privacy, Terms, Sitemap",
  socialLinks: [
    { key: "instagram", label: "Instagram", url: "https://instagram.com/editorialvibes" },
    { key: "tiktok", label: "TikTok", url: "https://tiktok.com/@editorialvibes" },
    { key: "youtube", label: "YouTube", url: "https://youtube.com/@editorialvibes" },
  ],
  showSocialInNav: true,
  showSocialInPage: true,
  showSocialInFooter: true,
  contactEmail: "hello@editorialvibes.com",
  contactPhone: "",
  address: "",
  founderName: "Kalei",
  founderTitle: "Founder & Creative Director",
  founderBio: "10+ years producing premium content for the world's biggest beauty brands.",
  clientLogos: "Sephora\nLaura Mercier\nKérastase\nLa Roche-Posay\nGarnier\nL'Oréal",
};

// BLANK_BRAND — a clean slate for new projects. Keeps the structural defaults
// (theme, layout, fonts, colors) so the project still renders, but clears all
// content fields and replaces them with placeholders the user will overwrite.
const BLANK_BRAND = {
  name: "New Project",
  industry: "",
  tagline: "",
  description: "",
  targetAudience: "",
  keyMessages: "",
  tone: "Editorial & Minimal",
  goal: "Lead Generation",
  goals: [],
  outcome: "",
  primaryKeywords: "",
  brandColors: { background: "", accent: "", text: "", card: "" },
  templateId: "",
  imageCategory: "editorial",
  themeId: "editorial-dark",
  themeMode: "dark",
  layoutId: "editorial-minimal",
  primaryColor: "#0a0a0a",
  accentColor: "#c7a572",
  cardBgColor: "#111111",
  bodyTextColor: "#a8a8a8",
  borderColor: "#1f1f1f",
  headingFont: "Yeseva One",
  bodyFont: "DM Sans",
  logoUrl: "",
  logoText: "",
  cta1: "Get started",
  cta2: "Learn more",
  inspoUrls: "",
  styleNotes: "",
  footerStyle: "Premium",
  headerStyle: "Editorial",
  multiMenu: false,
  primaryMenu: "Home, About, Services, Contact",
  utilityMenu: "Privacy, Terms",
  socialLinks: [],
  showSocialInNav: true,
  showSocialInPage: true,
  showSocialInFooter: true,
  contactEmail: "",
  contactPhone: "",
  address: "",
  founderName: "",
  founderTitle: "",
  founderBio: "",
  clientLogos: "",
  marqueeText: "",
  promoBanner: "",
};

const newPage = (name = "Homepage", pageType = "Homepage") => {
  const template = PAGE_TEMPLATES[pageType] || PAGE_TEMPLATES["Homepage"];
  return {
    name,
    pageType,
    sections: template.sections,
    heroHeading: template.heroHeading || "",
    heroSubhead: template.heroSubhead || "",
    heroImage: "",
    aboutImage: "",
    aboutHeading: template.aboutHeading || "About",
    aboutBody: template.aboutBody || "",
    services: template.services || "Video Production|Long & short-form video for social and brand campaigns\nProduct Photography|Editorial product imagery with art direction\nModel & Lifestyle|On-figure shoots and lifestyle content\nContent Strategy|Consulting on content systems and ROI",
    portfolio: template.portfolio || "Sephora Spring Campaign|Beauty Editorial|\nKérastase Hero Product|Product Photography|\nGarnier Skincare Launch|Video & Photo|\nLaura Mercier Lifestyle|Brand Content|",
    process: template.process || "Discover|Kickoff workshop to align on goals, audience, deliverables\nPlan|Creative direction, mood boards, shot lists, talent, locations\nProduce|Full shoot day with crew, equipment, and art direction\nDeliver|Edit, color, sound, and final asset handoff",
    team: template.team || "Kalei|Founder & Creative Director|\nLena|Producer|\nMarcus|Director of Photography|\nSarah|Post Production Lead|",
    blog: template.blog || "The case for premium content in 2026|Strategy|6 min read\nWhy your hero shot matters more than your ad spend|Production|4 min read\nHow we scaled Sephora's spring campaign in 3 weeks|Case Study|8 min read",
    stats: template.stats || "10|+|Years in Business\n100|+|Brand Clients\n500|+|Campaigns Delivered\n50|M+|Impressions Generated",
    testimonials: template.testimonials || "Editorial Vibes turned our launch into our best-performing quarter ever.|Marketing Director|Top 10 Beauty Brand\nThey don't just shoot — they think strategically about every frame.|Brand Manager|Skincare Brand",
    pricing: template.pricing || "Starter|$3,500|1 day shoot, 1 location, 20 finals\nGrowth|$7,500|2 day shoot, 2 locations, 50 finals + video\nFull Campaign|$15,000+|Full production, strategy, multi-deliverable",
    faq: template.faq || "How long does production take?|2-4 weeks from kickoff to delivery typically\nDo you handle talent and locations?|Yes, full production including casting and scouting\nWhat's included in a shoot day?|Director, photographer, assistants, equipment, and post",
    videoUrl: "",
    forms: template.forms || "Project Inquiry|Name,Email,Company,Project Type,Budget,Timeline,Project Details|Send Inquiry",
    ctaHeading: template.ctaHeading || "Ready to make something worth seeing?",
    heroEyebrow: template.heroEyebrow || "",
    aboutEyebrow: template.aboutEyebrow || "About",
    servicesEyebrow: template.servicesEyebrow || "Services",
    clientsEyebrow: template.clientsEyebrow || "Trusted By",
    portfolioEyebrow: template.portfolioEyebrow || "Selected Work",
    teamEyebrow: template.teamEyebrow || "The Team",
    leadershipEyebrow: template.leadershipEyebrow || "Leadership",
    processEyebrow: template.processEyebrow || "How We Work",
    testimonialsEyebrow: template.testimonialsEyebrow || "Kind Words",
    blogEyebrow: template.blogEyebrow || "Journal",
    faqEyebrow: template.faqEyebrow || "FAQ",
    pricingEyebrow: template.pricingEyebrow || "Pricing",
    socialEyebrow: template.socialEyebrow || "Follow Along",
    contactEyebrow: template.contactEyebrow || "Contact",
    sectionEyebrow: template.sectionEyebrow || "",
    portfolioHeading: template.portfolioHeading || "Recent projects.",
    processHeading: template.processHeading || "The process.",
    teamHeading: template.teamHeading || "People who make it happen.",
    blogHeading: template.blogHeading || "Recent posts.",
    pricingHeading: template.pricingHeading || "Investment.",
    faqHeading: template.faqHeading || "Questions, answered.",
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// PAGE TEMPLATES — pre-built section layouts and starter content for each page type.
// Industry research: based on top agencies (Rosalie, Lustre, Faure, Breef) and
// production companies (MJZ, Anonymous Content, RSA, Coffee & TV).
// ──────────────────────────────────────────────────────────────────────────────
const PAGE_TEMPLATES = {
  "Homepage": {
    sections: ["Hero", "About", "Services", "Portfolio Carousel", "Stats", "Logo Carousel", "Testimonials", "CTA", "Contact"],
    heroHeading: "Premium content that moves product.",
    heroSubhead: "We produce video, photo, and strategy for beauty, health, wellness & lifestyle brands.",
  },
  "About / Studio": {
    sections: ["Hero", "About", "Leadership", "Stats", "Team Carousel", "Process", "Clients", "Testimonials", "CTA"],
    heroHeading: "A studio built on craft.",
    heroSubhead: "Ten years. One hundred brands. Thousands of frames that moved product.",
    aboutHeading: "Our story.",
    aboutBody: "Founded in 2015, Editorial Vibes started as a one-woman operation shooting product photography for indie beauty brands. Today we're a full production studio working with the world's biggest names in beauty and wellness — but we still operate with the same obsession over every frame.",
  },
  "Leadership / Founder": {
    sections: ["Hero", "Leadership", "Stats", "Portfolio Carousel", "Testimonials", "Contact"],
    heroHeading: "Meet the people behind the work.",
    heroSubhead: "The founders, creative directors, and producers shaping every project.",
    leaders: "Kalei|Founder & Creative Director||Great content lives at the intersection of strategy and craft. We don't pick one.|10+ years producing premium beauty content. Previously led production at agencies serving L'Oréal Group brands. Trained at Parsons. Believes in long lunches and short briefs.",
  },
  "Services": {
    sections: ["Hero", "Services", "Process", "Portfolio", "Pricing", "FAQ", "CTA", "Contact"],
    heroHeading: "What we make.",
    heroSubhead: "Video, photography, and creative strategy — built around your brand and your goals.",
  },
  "Work / Portfolio": {
    sections: ["Hero", "Portfolio", "Clients", "Stats", "CTA"],
    heroHeading: "Selected work.",
    heroSubhead: "A decade of campaigns, content, and creative for the brands you know.",
  },
  "Case Study": {
    sections: ["Hero", "About", "Portfolio", "Stats", "Testimonials", "CTA"],
    heroHeading: "Sephora Spring Campaign 2026",
    heroSubhead: "How we produced a 12-asset launch in 14 days.",
    aboutHeading: "The challenge.",
    aboutBody: "Sephora needed a complete spring campaign across video, photo, and social — produced in two weeks for a national launch. Tight timeline, premium quality, no compromises.",
    portfolio: "Final Hero Image|Campaign Photography|\n15-second Spot|Social Video|\nBehind the Scenes|Process Documentation|\nLifestyle Series|Model Photography|",
    stats: "14|days|From brief to delivery\n12|assets|Photo + video deliverables\n3X|ROI|Performance vs. previous campaign",
  },
  "Contact": {
    sections: ["Hero", "Contact", "Social"],
    heroHeading: "Let's talk.",
    heroSubhead: "Tell us about your project and we'll be in touch within 24 hours.",
    forms: "Project Inquiry|Name,Email,Company,Project Type,Budget,Timeline,Project Details|Send Inquiry\nGeneral Question|Name,Email,Message|Send Message",
  },
  "Blog Index": {
    // Editorial mosaic: featured Hero post on top, asymmetric Blog grid below,
    // category Marquee strip, social proof, newsletter, footer CTA.
    sections: ["Hero", "Marquee", "Blog", "Logo Carousel", "Testimonials", "Form", "CTA"],
    heroHeading: "Notes from the studio.",
    heroSubhead: "Thinking on content, production, and what makes work actually work. New essays monthly across strategy, production, and craft.",
    marquee: "Strategy  ·  Production  ·  Case Study  ·  Opinion  ·  How-To  ·  Reflection",
    blog: "The case for premium content in 2026|Strategy|6 min read|https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop&q=80\nWhy your hero shot matters more than your ad spend|Production|4 min read|https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&q=80\nHow we scaled Sephora's spring campaign in 3 weeks|Case Study|8 min read|https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop&q=80\nThe death of the lifestyle stock photo|Opinion|5 min read|https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop&q=80\nProduction crews: in-house vs. agency, broken down|How-To|7 min read|https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=80\nWhat we learned from 100 brand shoots|Reflection|9 min read|https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop&q=80",
    forms: "Subscribe to the Journal|Email|Subscribe",
    ctaHeading: "Get new essays in your inbox.",
    testimonials: "The Editorial Vibes journal is required reading if you care about production craft.|Maya R.|Creative Director, Glossier\nFinally — writing about content that actually says something.|James L.|VP Marketing, Kérastase",
  },
  "Blog Post": {
    // Editorial long-form article. Hero with title + byline, About as the article body,
    // Stats as inline pull-out numbers, Portfolio Carousel as related reading, newsletter, CTA.
    sections: ["Hero", "About", "Stats", "Testimonials", "Portfolio Carousel", "Form", "CTA"],
    heroHeading: "The case for premium content in 2026",
    heroSubhead: "By Kalei Lagunero  ·  6 min read  ·  March 2026  ·  Strategy",
    aboutHeading: "The argument.",
    aboutBody: "We're in a moment where every brand has access to AI-generated content, stock photography, and rapid creative tools. So what's the value of premium production? Honestly — more than ever. When every brand can hit 'good enough,' the brands that invest in great become unmistakable. Premium content isn't about the gear or the budget — it's about the editorial decisions that make a piece feel inevitable. The wide shot held a beat longer. The product styled like an artifact. The model who isn't smiling. These are the choices that turn content into brand. The brands winning in 2026 aren't the ones producing the most — they're the ones producing the most considered.",
    stats: "3X|engagement|vs. stock-led campaigns\n47%|recall lift|after premium hero shoot\n14|days|average production timeline",
    testimonials: "Reading this felt like getting the answer to a question I didn't know how to ask. Bookmarking forever.|Maya R.|Creative Director, Glossier",
    portfolio: "Why your hero shot matters more than your ad spend|Strategy|\nHow we scaled Sephora's spring campaign|Case Study|\nThe death of the lifestyle stock photo|Opinion|\nProduction crews: in-house vs. agency|How-To|",
    forms: "Subscribe to the Journal|Email|Get future essays",
    ctaHeading: "Want to work with us?",
  },
  "Blog Post — Recipe": {
    // Structured how-to / recipe post. Hero with dish title + meta, About as the intro paragraph,
    // Services as the ingredients list, Process as the numbered directions, FAQ as additional notes,
    // Portfolio Carousel as related recipes, newsletter, CTA.
    sections: ["Hero", "About", "Services", "Process", "FAQ", "Portfolio Carousel", "Form", "CTA"],
    heroHeading: "Lemon Crinkle Cookies",
    heroSubhead: "Dessert  ·  Vegetarian  ·  Makes 12 cookies  ·  10 min prep  ·  10–12 min bake",
    aboutHeading: "Meet the cookie that belongs at every summer dinner party.",
    aboutBody: "These cookies feel nostalgic and a little fancy without requiring much effort, which is exactly our kind of baking project. Soft, chewy lemon crinkle cookies with a bright citrus flavor, a sugary crackle top, and just the right amount of sweetness. Make them for a weekend treat, bring them to dinner, or freeze the dough balls for a future dessert emergency. They also make an excellent base for ice cream sandwiches — which, in our opinion, is the natural next move.",
    services: "3/4 cup|Unsalted organic butter, softened\n1 cup|Unrefined granulated sugar\nZest and juice|Of 2 lemons\n1 egg + 1 egg yolk|Room temperature\n2 1/4 cups|All-purpose organic flour\n1 1/2 tsp|Cornstarch\n1 tsp|Baking powder\n1/2 tsp|Baking soda\n1/2 tsp|Salt\n1 cup|Unrefined granulated sugar (for rolling)\n1 cup|Powdered sugar (for rolling)",
    process: "Cream butter & sugar|In a bowl, cream together the softened butter, granulated sugar, lemon juice, and lemon zest until light and fluffy.\nAdd eggs|Add the egg and egg yolk, mixing until fully combined.\nWhisk dry ingredients|In a separate bowl, whisk together the flour, cornstarch, baking powder, baking soda, and salt.\nCombine|Add the dry ingredients to the wet ingredients and mix until just combined. The dough will be very sticky, which is normal.\nChill|Cover the bowl in cling wrap and refrigerate for at least 1 hour, ideally 2. You can also chill overnight.\nPrep oven|Preheat the oven to 350°F (175°C). Line two baking sheets with parchment paper.\nShape & roll|Scoop the dough into 12 portions (about 3 tablespoons each) and roll into balls. Roll each ball first in granulated sugar, then in powdered sugar.\nBake|Place 6 cookies per baking sheet, spacing them about 2 inches apart. Bake for 10–12 minutes, or until the edges are set.\nCool|Let the cookies cool on the baking sheet for 5 minutes before transferring to a wire rack.",
    faq: "Can I make these dairy-free?|Substitute with a plant-based butter — this shouldn't significantly affect the recipe.\nCan I make these gluten-free?|Use a 1:1 gluten-free flour substitute.\nCan I freeze the dough?|Yes. After chilling and shaping, freeze the dough balls. When ready to bake, roll them in the sugars just before baking.\nCan I make them more lemony?|Increase the zest and juice — but balance with a small amount of extra flour if the dough gets too sticky.\nAny other uses?|These work beautifully as ice cream sandwich bases for a summer dessert.",
    portfolio: "The Famous Italian Chopped Salad|Recipe|\nCrispy Lemon Parmesan Potatoes|Recipe|\nWhipped Feta Dip with Hot Honey Carrots|Recipe|\nBlack Sesame Cucumber Salad|Recipe|",
    forms: "Get new recipes weekly|Email|Send me recipes",
    ctaHeading: "Hungry for more?",
  },
  "Careers": {
    sections: ["Hero", "About", "Team", "Process", "Form"],
    heroHeading: "Build with us.",
    heroSubhead: "We hire makers, thinkers, and the kind of people who care about every frame.",
    aboutHeading: "Why work here.",
    aboutBody: "We're a tight team that values craft over hustle, ownership over hierarchy, and great work over big budgets. If you want to do your best work with people who care, this is the place.",
    process: "Apply|Send your portfolio and a note about what you're looking for\nMeet|30-min intro call with the founder\nProject|A small paid project to see how we work together\nDecide|If it's a fit, we offer. If not, we send referrals",
    forms: "Apply|Name,Email,Role,Portfolio URL,Why Editorial Vibes|Submit Application",
  },
  "Pricing": {
    sections: ["Hero", "Pricing", "FAQ", "Testimonials", "CTA", "Contact"],
    heroHeading: "Simple, transparent pricing.",
    heroSubhead: "Three packages designed around what brands actually need. Custom work always available.",
  },
  "Press / Awards": {
    sections: ["Hero", "Clients", "Portfolio", "Stats", "Contact"],
    heroHeading: "Press & recognition.",
    heroSubhead: "Awards, mentions, and the work that earned them.",
    portfolio: "Best Beauty Campaign 2025|Cannes Shortlist|\nFeatured in Vogue|March 2025|\nAdweek Spotlight|Production Studios to Watch|",
  },
  "Landing Page": {
    sections: ["Hero", "Services", "Stats", "Testimonials", "Pricing", "FAQ", "CTA", "Form"],
    heroHeading: "Get your brand's next campaign shot in 14 days.",
    heroSubhead: "Premium production, fixed timeline, transparent pricing. Limited spots for Q3.",
    forms: "Reserve Your Spot|Name,Email,Brand,Timeline|Reserve Now",
  },
  "Shop": {
    sections: ["Hero", "Portfolio", "Testimonials", "FAQ", "Contact"],
    heroHeading: "Shop.",
    heroSubhead: "Limited edition prints, presets, and digital tools from our studio.",
    portfolio: "Print Pack Vol. 1|$95|\nLightroom Presets|$45|\nProduction Templates|$120|\nFull Bundle|$220|",
  },
};

const EV_PROJECT = { id: "ev", name: "Editorial Vibes", brand: EV_BRAND, pages: [newPage("Homepage")] };

// ──────────────────────────────────────────────────────────────────────────────
// ELEMENTOR JSON BUILDERS — native widgets only
// ──────────────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

// Container helpers — uses Elementor's modern Container architecture (3.16+)
// content_width: "full" makes the container stretch edge-to-edge.
// boxed_width gives generous internal padding for the editorial look.
const eContainer = (settings = {}) => ({
  id: uid(),
  elType: "container",
  isInner: false,
  settings: {
    content_width: "full",
    flex_direction: "column",
    flex_gap: { unit: "px", size: 0, sizes: [] },
    ...settings,
  },
  elements: [],
});

// Outer section container — full browser width, with background and generous edge padding
const eSection = (bg = "", padTop = 100, padBot = 100) => eContainer({
  content_width: "full",
  background_background: bg ? "classic" : "",
  background_color: bg,
  padding: { unit: "px", top: String(padTop), right: "100", bottom: String(padBot), left: "100", isLinked: false },
  padding_tablet: { unit: "px", top: String(Math.round(padTop * 0.7)), right: "60", bottom: String(Math.round(padBot * 0.7)), left: "60", isLinked: false },
  padding_mobile: { unit: "px", top: String(Math.round(padTop * 0.5)), right: "24", bottom: String(Math.round(padBot * 0.5)), left: "24", isLinked: false },
});

// Row container — for multi-column layouts. Smaller gap to prevent wrap.
const eRow = (gap = 24) => eContainer({
  content_width: "full",
  flex_direction: "row",
  flex_wrap: "wrap",
  flex_gap: { unit: "px", size: gap, sizes: [] },
  width: { unit: "%", size: 100, sizes: [] },
});

// Column inside a row — widths are slightly under theoretical to leave room for gaps
const eCol = (size = 100) => eContainer({
  content_width: "full",
  width: { unit: "%", size, sizes: [] },
  width_tablet: { unit: "%", size: size < 100 ? 48 : 100, sizes: [] },
  width_mobile: { unit: "%", size: 100, sizes: [] },
  flex_grow: 0,
  flex_shrink: 0,
});

// ──────────────────────────────────────────────────────────────────────────────
// RESPONSIVE SIZE HELPERS — auto-generates desktop / tablet / mobile sizes
// so a 84px hero heading becomes ~63px on tablet, ~46px on mobile, etc.
// All Elementor widgets support typography_font_size_tablet/_mobile suffixes.
// ──────────────────────────────────────────────────────────────────────────────
const rPx = (size, tabletRatio = 0.78, mobileRatio = 0.58, min = 14) => ({
  desktop: { unit: "px", size, sizes: [] },
  tablet: { unit: "px", size: Math.max(Math.round(size * tabletRatio), min), sizes: [] },
  mobile: { unit: "px", size: Math.max(Math.round(size * mobileRatio), min), sizes: [] },
});

const eHead = (text, tag = "h2", color = "#000", font = "Inter", size = 32, align = "left") => {
  // Headings scale more aggressively on small screens (big hero text shrinks more)
  const tabletR = size > 50 ? 0.7 : 0.85;
  const mobileR = size > 50 ? 0.5 : 0.75;
  const r = rPx(size, tabletR, mobileR, 12);
  return {
    id: uid(), elType: "widget", widgetType: "heading", elements: [],
    settings: {
      title: text, header_size: tag, align,
      align_tablet: align,
      align_mobile: align,
      title_color: color,
      typography_typography: "custom", typography_font_family: font,
      typography_font_size: r.desktop,
      typography_font_size_tablet: r.tablet,
      typography_font_size_mobile: r.mobile,
      typography_font_weight: tag === "h1" ? "400" : "500",
      typography_line_height: { unit: "em", size: 1.15, sizes: [] },
      typography_line_height_mobile: { unit: "em", size: 1.2, sizes: [] },
    },
  };
};

const eTxt = (text, color = "#666", font = "Inter", size = 16, align = "left") => {
  const r = rPx(size, 0.95, 0.9, 13);
  return {
    id: uid(), elType: "widget", widgetType: "text-editor", elements: [],
    settings: {
      editor: `<p>${text}</p>`, align,
      align_tablet: align,
      align_mobile: align,
      text_color: color,
      typography_typography: "custom", typography_font_family: font,
      typography_font_size: r.desktop,
      typography_font_size_tablet: r.tablet,
      typography_font_size_mobile: r.mobile,
      typography_line_height: { unit: "em", size: 1.7, sizes: [] },
    },
  };
};

const eBtn = (text, link = "#", bg = "#000", color = "#fff", font = "Inter", align = "left") => ({
  id: uid(), elType: "widget", widgetType: "button", elements: [],
  settings: {
    text, link: { url: link, is_external: "", nofollow: "" }, align,
    align_tablet: align, align_mobile: align,
    button_text_color: color, background_color: bg,
    typography_typography: "custom", typography_font_family: font,
    typography_font_size: { unit: "px", size: 12, sizes: [] },
    typography_font_size_mobile: { unit: "px", size: 11, sizes: [] },
    typography_letter_spacing: { unit: "px", size: 2, sizes: [] },
    typography_text_transform: "uppercase",
    button_padding: { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false },
    button_padding_mobile: { unit: "px", top: "14", right: "24", bottom: "14", left: "24", isLinked: false },
    border_radius: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true },
  },
});

const eSpacer = (h = 40) => ({
  id: uid(), elType: "widget", widgetType: "spacer", elements: [],
  settings: {
    space: { unit: "px", size: h, sizes: [] },
    space_tablet: { unit: "px", size: Math.round(h * 0.8), sizes: [] },
    space_mobile: { unit: "px", size: Math.round(h * 0.6), sizes: [] },
  },
});

const eImg = (url, alt = "") => ({
  id: uid(), elType: "widget", widgetType: "image", elements: [],
  settings: { image: { url, id: "" }, image_size: "full", align: "center", caption_source: "none" },
});

const eIconBox = (title, desc, num, color, accent, font, bf) => {
  const tr = rPx(20, 0.95, 0.9, 16);
  const dr = rPx(14, 0.95, 0.9, 13);
  return {
    id: uid(), elType: "widget", widgetType: "icon-box", elements: [],
    settings: {
      title_text: num ? `${num}. ${title}` : title,
      description_text: desc,
      icon_align: "left",
      // Hide the default star icon — we use the number prefix instead
      selected_icon: { value: "", library: "" },
      icon: "",
      primary_color: accent,
      title_color: color,
      description_color: "#888",
      title_typography_typography: "custom", title_typography_font_family: font,
      title_typography_font_size: tr.desktop,
      title_typography_font_size_tablet: tr.tablet,
      title_typography_font_size_mobile: tr.mobile,
      description_typography_typography: "custom", description_typography_font_family: bf,
      description_typography_font_size: dr.desktop,
      description_typography_font_size_tablet: dr.tablet,
      description_typography_font_size_mobile: dr.mobile,
      description_typography_line_height: { unit: "em", size: 1.6, sizes: [] },
    },
  };
};

const eCounter = (num, suffix, label, accent, color, font, bf) => {
  const nr = rPx(56, 0.65, 0.55, 32);
  const lr = rPx(13, 0.95, 0.9, 11);
  return {
    id: uid(), elType: "widget", widgetType: "counter", elements: [],
    settings: {
      starting_number: 0, ending_number: parseInt(num) || 0,
      suffix, title: label,
      duration: 2000,
      number_color: accent,
      title_color: color,
      typography_number_typography: "custom", typography_number_font_family: font,
      typography_number_font_size: nr.desktop,
      typography_number_font_size_tablet: nr.tablet,
      typography_number_font_size_mobile: nr.mobile,
      typography_title_typography: "custom", typography_title_font_family: bf,
      typography_title_font_size: lr.desktop,
      typography_title_font_size_tablet: lr.tablet,
      typography_title_font_size_mobile: lr.mobile,
    },
  };
};

const eTestimonial = (text, name, role, color, accent, font, bf) => ({
  id: uid(), elType: "widget", widgetType: "testimonial", elements: [],
  settings: {
    testimonial_content: text,
    testimonial_name: name,
    testimonial_job: role,
    testimonial_alignment: "left",
    testimonial_image_position: "none",
    content_color: color,
    name_text_color: accent,
    job_text_color: "#888",
  },
});

const eAccordion = (items, color, accent, font, bf) => ({
  id: uid(), elType: "widget", widgetType: "accordion", elements: [],
  settings: {
    tabs: items.map(([q, a]) => ({ _id: uid(), tab_title: q, tab_content: a })),
    title_color: color,
    icon_color: accent,
    border_color: "rgba(255,255,255,0.08)",
    title_typography_typography: "custom", title_typography_font_family: font,
    title_typography_font_size: { unit: "px", size: 18, sizes: [] },
    title_typography_font_size_mobile: { unit: "px", size: 16, sizes: [] },
  },
});

// Social icons — uses shape "default" (just the icon, no background square)
// This fixes the issue where icon_secondary_color was making icons invisible.
const eSocial = (links, color, accent) => ({
  id: uid(), elType: "widget", widgetType: "social-icons", elements: [],
  settings: {
    social_icon_list: links.map(l => ({
      _id: uid(),
      social_icon: { value: `fab fa-${l.key}`, library: "fa-brands" },
      link: { url: l.url, is_external: "true", nofollow: "true" },
    })),
    icon_color: "custom",
    icon_primary_color: color,           // icon glyph color
    icon_secondary_color: "transparent", // no background
    hover_primary_color: accent,         // icon turns accent on hover
    hover_secondary_color: "transparent",
    shape: "default",                    // no background shape — just clean icons
    columns: "0",
    icon_size: { unit: "px", size: 18, sizes: [] },
    icon_size_mobile: { unit: "px", size: 16, sizes: [] },
    icon_spacing: { unit: "px", size: 16, sizes: [] },
  },
});

const eVideo = (url) => ({
  id: uid(), elType: "widget", widgetType: "video", elements: [],
  settings: { video_type: "youtube", youtube_url: url, aspect_ratio: "169" },
});

// Image carousel widget — used for team, portfolio, logo, and gallery carousels.
// Responsive: shows 3 slides on desktop, 2 on tablet, 1 on mobile by default.
// Supports captions, autoplay, navigation arrows, infinite loop.
const eCarousel = (images, options = {}) => ({
  id: uid(), elType: "widget", widgetType: "image-carousel", elements: [],
  settings: {
    carousel: images.map(img => ({
      id: uid(),
      _id: uid(),
      url: img.url || img,
      alt: img.alt || "",
    })),
    slides_to_show: String(options.slides || 3),
    slides_to_show_tablet: String(options.slidesTablet || 2),
    slides_to_show_mobile: String(options.slidesMobile || 1),
    slides_to_scroll: "1",
    slides_to_scroll_tablet: "1",
    slides_to_scroll_mobile: "1",
    image_stretch: "yes",
    navigation: options.navigation || "both",
    autoplay: options.autoplay !== false ? "yes" : "",
    autoplay_speed: options.speed || 5000,
    infinite: "yes",
    pause_on_hover: "yes",
    speed: 600,
    image_size: "medium_large",
    caption_type: options.captions ? "caption" : "none",
    image_spacing_custom: { unit: "px", size: 20, sizes: [] },
    image_spacing_custom_tablet: { unit: "px", size: 16, sizes: [] },
    image_spacing_custom_mobile: { unit: "px", size: 12, sizes: [] },
    arrows_color: options.color || "#ffffff",
    arrows_size: { unit: "px", size: 24, sizes: [] },
    dots_color: options.accent || "#888888",
    caption_color: options.color || "#ffffff",
    caption_typography_typography: "custom",
    caption_typography_font_family: options.font || "Inter",
    caption_typography_font_size: { unit: "px", size: 13, sizes: [] },
    caption_typography_letter_spacing: { unit: "px", size: 1, sizes: [] },
    caption_typography_text_transform: "uppercase",
    caption_text_align: "center",
  },
});

const eForm = (title, fields, btn, accent, labelColor, font) => ({
  id: uid(), elType: "widget", widgetType: "form", elements: [],
  settings: {
    form_name: title,
    form_fields: fields.map(f => ({
      _id: uid(),
      custom_id: f.toLowerCase().replace(/\s+/g, "_"),
      field_type: /message|details|notes/i.test(f) ? "textarea" : (/email/i.test(f) ? "email" : "text"),
      field_label: f, placeholder: f,
      required: "true", width: "100",
      rows: /message|details|notes/i.test(f) ? 4 : undefined,
    })),
    button_text: btn,
    button_size: "sm",
    button_width: "", // auto, not full-width
    button_align: "start",
    button_background_color: accent,
    button_text_color: textOn(accent),
    button_typography_typography: "custom",
    button_typography_font_family: font,
    button_typography_font_size: { unit: "px", size: 11, sizes: [] },
    button_typography_letter_spacing: { unit: "px", size: 2, sizes: [] },
    button_typography_text_transform: "uppercase",
    button_typography_font_weight: "600",
    button_padding: { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false },
    button_border_radius: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true },
    // Label and field styling — everything flush left
    label_color: labelColor,
    label_typography_typography: "custom",
    label_typography_font_family: font,
    label_typography_font_size: { unit: "px", size: 10, sizes: [] },
    label_typography_letter_spacing: { unit: "px", size: 1.5, sizes: [] },
    label_typography_text_transform: "uppercase",
    label_typography_font_weight: "700",
    label_spacing: { unit: "px", size: 6, sizes: [] },
    field_text_color: labelColor,
    field_background_color: "transparent",
    field_border_color: isLight(labelColor) ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
    field_border_width: { unit: "px", top: "0", right: "0", bottom: "1", left: "0", isLinked: false },
    field_typography_typography: "custom",
    field_typography_font_family: font,
    field_typography_font_size: { unit: "px", size: 15, sizes: [] },
    field_padding: { unit: "px", top: "12", right: "0", bottom: "12", left: "0", isLinked: false },
    field_border_radius: { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true },
    row_gap: { unit: "px", size: 24, sizes: [] },
  },
});

const eNavMenu = (menu) => ({
  id: uid(), elType: "widget", widgetType: "nav-menu", elements: [],
  settings: { menu, layout: "horizontal", align: "right" },
});

// Shortcode widget — embeds any WordPress shortcode (WPForms, Contact Form 7,
// Gravity Forms, Fluent Forms, Ninja Forms, Formidable, etc.) inside the
// Elementor layout. User creates form in their plugin, pastes shortcode here.
const eShortcode = (shortcode) => ({
  id: uid(), elType: "widget", widgetType: "shortcode", elements: [],
  settings: { shortcode },
});

// Raw HTML widget — used for marquee, custom embed, anything not in native widgets
const eHTML = (html) => ({
  id: uid(), elType: "widget", widgetType: "html", elements: [],
  settings: { html },
});

// Marquee — scrolling text bar with CSS animation. Signature agency look
// (VaynerMedia, Superside style). Plays continuously across the section.
const eMarquee = (text, color, accent, font, bgColor) => {
  const cid = "m" + Math.random().toString(36).slice(2, 9);
  const item = `<span class="${cid}-i">${text}</span><span class="${cid}-d">●</span>`;
  const items = Array(8).fill(item).join("");
  const html = `<style>
.${cid}-wrap { background: ${bgColor}; overflow: hidden; padding: 28px 0; width: 100%; }
.${cid}-track { display: flex; width: max-content; animation: ${cid}-scroll 40s linear infinite; }
.${cid}-i { font-family: '${font}', sans-serif; font-size: clamp(22px, 3.5vw, 44px); font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: ${color}; padding: 0 32px; white-space: nowrap; flex-shrink: 0; }
.${cid}-d { font-size: clamp(22px, 3.5vw, 44px); color: ${accent}; padding: 0 6px; flex-shrink: 0; }
@keyframes ${cid}-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
</style>
<div class="${cid}-wrap"><div class="${cid}-track">${items}${items}</div></div>`;
  return eHTML(html);
};

// ──────────────────────────────────────────────────────────────────────────────
// BUILD ELEMENTOR PAGE JSON
// ──────────────────────────────────────────────────────────────────────────────
function buildPageJSON(page, brand) {
  const { primaryColor: pc, accentColor: ac, cardBgColor: card, bodyTextColor: body, headingFont: hf, bodyFont: bf } = brand;
  const ts = body;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark" || pc.toLowerCase() === "#0a0a0a" || pc.toLowerCase() === "#000000" || pc === "#111111";
  const headingColor = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
  const sections = [];
  const push = (parent, ...els) => els.forEach(e => parent.elements.push(e));

  // Layout style — controls structural personality (spacing, sizes, alignment)
  const layout = getLayout(brand.layoutId);

  // Helper: column width based on item count. Values leave room for the row gap
  // so columns always fit on one line instead of wrapping.
  const widthFor = (count) => count === 1 ? 100 : count === 2 ? 48 : count === 3 ? 31 : 23;

  // Helper: build a multi-column row inside a section
  const multiCol = (section, items, renderItem, gap = 24) => {
    const row = eRow(gap);
    const w = widthFor(Math.min(items.length, 4));
    items.forEach((item, i) => {
      const col = eCol(w);
      renderItem(col, item, i);
      row.elements.push(col);
    });
    section.elements.push(row);
  };

  page.sections.forEach(s => {
    if (s === "Hero") {
      const hColor = textOn(pc);
      const bColor = mutedTextOn(pc);
      const heading = page.heroHeading || brand.tagline;
      const subhead = page.heroSubhead || brand.keyMessages.split(".")[0];
      const eyebrow = eyebrowText(layout.eyebrowStyle, page.heroEyebrow || "Welcome");
      const heroImg = imgOrPlaceholder(page.heroImage, `${brand.name}-hero`, 1200, 900, brand.imageCategory);
      const v = layout.heroVariant || "left-standard";

      if (v === "split-image" || v === "split-image-rounded") {
        // Text on left 55%, image card on right 40%. Asymmetric editorial feel.
        const sec = eSection(pc, layout.heroPadding, layout.heroPadding);
        const row = eRow(48);
        const colText = eCol(55);
        push(colText,
          eHead(eyebrow, "h6", ac, bf, 11, "left"),
          eSpacer(20),
          eHead(heading, "h1", hColor, hf, layout.heroHeading, "left"),
          eSpacer(24),
          eTxt(subhead, bColor, bf, 18, "left"),
          eSpacer(40),
          eBtn(brand.cta1, "#contact", ac, textOn(ac), bf, "left"),
        );
        const colImg = eCol(40);
        const img = eImg(heroImg, "Hero");
        if (v === "split-image-rounded") {
          img.settings._border_radius = { unit: "px", top: layout.cardRadius, right: layout.cardRadius, bottom: layout.cardRadius, left: layout.cardRadius, isLinked: true };
        }
        push(colImg, img);
        row.elements.push(colText, colImg);
        sec.elements.push(row);
        sections.push(sec);
      } else if (v === "centered-bold") {
        // Centered massive type, no image. Magazine masthead energy.
        const sec = eSection(pc, Math.round(layout.heroPadding * 1.15), Math.round(layout.heroPadding * 1.15));
        push(sec,
          eHead(eyebrow, "h6", ac, bf, 11, "center"),
          eSpacer(28),
          eHead(heading, "h1", hColor, hf, layout.heroHeading, "center"),
          eSpacer(28),
          eTxt(subhead, bColor, bf, 20, "center"),
          eSpacer(48),
          eBtn(brand.cta1, "#contact", ac, textOn(ac), bf, "center"),
        );
        sections.push(sec);
      } else if (v === "minimal-text") {
        // Just oversized heading. Tight padding. No image. Brutalist energy.
        const sec = eSection(pc, layout.heroPadding, Math.round(layout.heroPadding * 1.4));
        push(sec,
          eHead(eyebrow, "h6", ac, bf, 11, "left"),
          eSpacer(60),
          eHead(heading, "h1", hColor, hf, layout.heroHeading, "left"),
          eSpacer(60),
          eBtn(brand.cta1, "#contact", ac, textOn(ac), bf, "left"),
        );
        sections.push(sec);
      } else if (v === "fullbleed-overlay") {
        // Image as background, text overlaid bottom-left.
        const sec = eSection(pc, 200, 200);
        sec.settings.background_image = { url: heroImg, id: "" };
        sec.settings.background_position = "center center";
        sec.settings.background_size = "cover";
        sec.settings.background_overlay_background = "classic";
        sec.settings.background_overlay_color = "#000000";
        sec.settings.background_overlay_opacity = { unit: "px", size: 0.45, sizes: [] };
        push(sec,
          eHead(eyebrow, "h6", ac, bf, 11, "left"),
          eSpacer(20),
          eHead(heading, "h1", "#ffffff", hf, layout.heroHeading, "left"),
          eSpacer(24),
          eTxt(subhead, "rgba(255,255,255,0.85)", bf, 18, "left"),
          eSpacer(40),
          eBtn(brand.cta1, "#contact", "#ffffff", "#0a0a0a", bf, "left"),
        );
        sections.push(sec);
      } else {
        // Default: left-standard. Text left-aligned with optional bg image overlay.
        const sec = eSection(pc, layout.heroPadding, layout.heroPadding);
        if (page.heroImage) {
          sec.settings.background_image = { url: page.heroImage, id: "" };
          sec.settings.background_position = "center center";
          sec.settings.background_size = "cover";
          sec.settings.background_overlay_background = "classic";
          sec.settings.background_overlay_color = pc;
          sec.settings.background_overlay_opacity = { unit: "px", size: 0.5, sizes: [] };
        }
        push(sec,
          eHead(eyebrow, "h6", ac, bf, 11, layout.heroAlign),
          eSpacer(20),
          eHead(heading, "h1", hColor, hf, layout.heroHeading, layout.heroAlign),
          eSpacer(24),
          eTxt(subhead, bColor, bf, 18, layout.heroAlign),
          eSpacer(40),
          eBtn(brand.cta1, "#contact", ac, textOn(ac), bf, layout.heroAlign),
        );
        sections.push(sec);
      }
    }

    if (s === "About") {
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      const bColor = mutedTextOn(card);
      const img = imgOrPlaceholder(page.aboutImage, `${brand.name}-about`, 800, 1000, brand.imageCategory);
      const row = eRow(40);
      const colText = eCol(48);
      push(colText,
        eHead(eyebrowText(layout.eyebrowStyle, "About"), "h6", ac, bf, 11, "left"),
        eSpacer(16),
        eHead(page.aboutHeading || `Built for brands that need content that performs.`, "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(20),
        eTxt(page.aboutBody || brand.description, bColor, bf, 16, "left"),
      );
      const colImg = eCol(48);
      push(colImg, eImg(img, "About"));
      row.elements.push(colText, colImg);
      sec.elements.push(row);
      sections.push(sec);
    }

    if (s === "Services") {
      const sec = eSection(pc, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(pc);
      const bColor = mutedTextOn(pc);
      const eyebrow = page.servicesEyebrow || "Services";
      const heading = page.servicesHeading || "Our services.";
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, eyebrow), "h6", ac, bf, 11, layout.sectionAlign),
        eSpacer(16),
        eHead(heading, "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(48),
      );
      const items = (page.services || "").split("\n").filter(Boolean);
      const v = layout.servicesVariant || "grid-numbered";

      if (v === "list-row") {
        // Each service is a full-width row: number | title | description
        // Editorial Bold and Brutalist energy. Visual divider between rows.
        items.forEach((line, i) => {
          const [title, desc] = line.split("|");
          const row = eRow(32);
          const colNum = eCol(10);
          push(colNum, eHead(String(i + 1).padStart(2, "0"), "h3", ac, hf, 40, "left"));
          const colTitle = eCol(35);
          push(colTitle, eHead(title || "Service", "h3", hColor, hf, 28, "left"));
          const colDesc = eCol(50);
          push(colDesc, eTxt(desc || "", bColor, bf, 16, "left"));
          row.elements.push(colNum, colTitle, colDesc);
          // Set bottom padding/border on row container for divider effect
          row.settings.padding = { unit: "px", top: "32", right: "0", bottom: "32", left: "0", isLinked: false };
          row.settings._border_border = "solid";
          row.settings._border_width = { unit: "px", top: "0", right: "0", bottom: "1", left: "0", isLinked: false };
          row.settings._border_color = isLight(pc) ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";
          sec.elements.push(row);
        });
      } else if (v === "cards-padded") {
        // 3-col rounded soft cards. Studio Modern feel.
        multiCol(sec, items, (col, line, i) => {
          col.settings.background_color = card;
          col.settings.padding = { unit: "px", top: "40", right: "32", bottom: "40", left: "32", isLinked: false };
          col.settings.padding_mobile = { unit: "px", top: "28", right: "20", bottom: "28", left: "20", isLinked: false };
          col.settings.border_radius = { unit: "px", top: layout.cardRadius, right: layout.cardRadius, bottom: layout.cardRadius, left: layout.cardRadius, isLinked: true };
          const [title, desc] = line.split("|");
          push(col,
            eHead(String(i + 1).padStart(2, "0"), "h6", ac, bf, 11, "left"),
            eSpacer(20),
            eHead(title || "Service", "h3", textOn(card), hf, 22, "left"),
            eSpacer(12),
            eTxt(desc || "", mutedTextOn(card), bf, 14, "left"),
          );
        }, 24);
      } else if (v === "serif-stack") {
        // 3-col with HUGE serif numbers stacked above titles. Magazine feel.
        multiCol(sec, items, (col, line, i) => {
          const [title, desc] = line.split("|");
          push(col,
            eHead(String(i + 1).padStart(2, "0"), "h3", ac, hf, 72, layout.sectionAlign),
            eSpacer(20),
            eHead(title || "Service", "h3", hColor, hf, 22, layout.sectionAlign),
            eSpacer(12),
            eTxt(desc || "", bColor, bf, 14, layout.sectionAlign),
          );
        }, 32);
      } else {
        // Default: grid-numbered (current Editorial Minimal)
        multiCol(sec, items, (col, line, i) => {
          const [title, desc] = line.split("|");
          push(col, eIconBox(title || "Service", desc || "", String(i + 1).padStart(2, "0"), hColor, ac, hf, bf));
        }, 24);
      }
      sections.push(sec);
    }

    if (s === "Process") {
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, "How We Work"), "h6", ac, bf, 11, layout.sectionAlign),
        eSpacer(16),
        eHead("The process.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(48),
      );
      const items = (page.process || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line, i) => {
        const [title, desc] = line.split("|");
        push(col, eIconBox(`${String(i + 1).padStart(2, "0")} — ${title || ""}`, desc || "", "", hColor, ac, hf, bf));
      }, 24);
      sections.push(sec);
    }

    if (s === "Team") {
      const sec = eSection(pc, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(pc);
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, "The Team"), "h6", ac, bf, 11, layout.sectionAlign),
        eSpacer(16),
        eHead("People who make it happen.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(48),
      );
      const items = (page.team || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line, i) => {
        const [name, role, img] = line.split("|");
        const teamImg = imgOrPlaceholder(img, `${brand.name}-team-${name}-${i}`, 600, 750, "portrait");
        push(col, eImg(teamImg, name || ""), eSpacer(16), eHead(name || "", "h3", hColor, hf, 20, "left"), eTxt(role || "", ac, bf, 12, "left"));
      }, 24);
      sections.push(sec);
    }

    if (s === "Clients") {
      const sec = eSection(card, Math.round(layout.sectionPadding * 0.8), Math.round(layout.sectionPadding * 0.8));
      const hColor = textOn(card);
      const clientList = (brand.clientLogos || "").split("\n").filter(Boolean).join("  ·  ");
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "Trusted By"), "h6", ac, bf, 11, "center"), eSpacer(20), eTxt(clientList, hColor, hf, 20, "center"));
      sections.push(sec);
    }

    if (s === "Blog") {
      const sec = eSection(pc, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(pc);
      const bColor = mutedTextOn(pc);
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "Journal"), "h6", ac, bf, 11, layout.sectionAlign), eSpacer(16), eHead("Recent posts.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign), eSpacer(48));
      const items = (page.blog || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line, i) => {
        const [title, cat, meta] = line.split("|");
        const postImg = imgOrPlaceholder("", `${brand.name}-blog-${i}`, 800, 500, brand.imageCategory);
        push(col, eImg(postImg, title || ""), eSpacer(16), eTxt(cat || "", ac, bf, 11, "left"), eHead(title || "", "h3", hColor, hf, 20, "left"), eTxt(meta || "", bColor, bf, 13, "left"));
      }, 24);
      sections.push(sec);
    }

    if (s === "Portfolio") {
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "Selected Work"), "h6", ac, bf, 11, layout.sectionAlign), eSpacer(16), eHead("Recent projects.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign), eSpacer(48));
      const items = (page.portfolio || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line, i) => {
        const [title, cat, img] = line.split("|");
        const portImg = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 800, 1000, brand.imageCategory);
        push(col,
          eImg(portImg, title || ""),
          eSpacer(16),
          eHead(title || "Project", "h3", hColor, hf, 20, "left"),
          eTxt(cat || "Category", ac, bf, 12, "left"),
        );
      }, 24);
      sections.push(sec);
    }

    if (s === "Stats") {
      const sec = eSection(pc, Math.round(layout.sectionPadding * 0.8), Math.round(layout.sectionPadding * 0.8));
      const hColor = textOn(pc);
      const items = (page.stats || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line) => {
        const [n, suf, lab] = line.split("|");
        push(col, eCounter(n, suf, lab, ac, hColor, hf, bf));
      }, 24);
      sections.push(sec);
    }

    if (s === "Pricing") {
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      const bColor = mutedTextOn(card);
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "Pricing"), "h6", ac, bf, 11, "center"), eSpacer(16), eHead("Investment.", "h2", hColor, hf, layout.sectionHeading, "center"), eSpacer(48));
      const items = (page.pricing || "").split("\n").filter(Boolean);
      const { btnBg, btnText } = buttonOn(card, ac);
      multiCol(sec, items, (col, line) => {
        const [tier, price, desc] = line.split("|");
        push(col,
          eHead(tier || "Tier", "h4", hColor, hf, 24, "center"),
          eSpacer(8),
          eHead(price || "—", "h3", ac, hf, 36, "center"),
          eSpacer(16),
          eTxt(desc || "", bColor, bf, 14, "center"),
          eSpacer(24),
          eBtn(brand.cta1, "#contact", btnBg, btnText, bf, "center"),
        );
      }, 24);
      sections.push(sec);
    }

    if (s === "Testimonials") {
      // Custom testimonial render (no widget = no default avatar)
      const sec = eSection(pc, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(pc);
      const bColor = mutedTextOn(pc);
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "Kind Words"), "h6", ac, bf, 11, layout.sectionAlign), eSpacer(40));
      const items = (page.testimonials || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line) => {
        const [q, n, r] = line.split("|");
        push(col,
          eHead(`"${q || ""}"`, "h3", hColor, hf, 22, "left"),
          eSpacer(20),
          eTxt(`<strong style="color:${ac};">— ${n || ""}</strong>${r ? `, <span style="opacity:0.7;">${r}</span>` : ""}`, bColor, bf, 13, "left"),
        );
      }, 32);
      sections.push(sec);
    }

    if (s === "FAQ") {
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      const items = (page.faq || "").split("\n").filter(Boolean).map(l => l.split("|"));
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "FAQ"), "h6", ac, bf, 11, layout.sectionAlign), eSpacer(16), eHead("Questions, answered.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign), eSpacer(40), eAccordion(items, hColor, ac, hf, bf));
      sections.push(sec);
    }

    if (s === "Social") {
      const sec = eSection(pc, Math.round(layout.sectionPadding * 0.8), Math.round(layout.sectionPadding * 0.8));
      const hColor = textOn(pc);
      push(sec, eHead(eyebrowText(layout.eyebrowStyle, "Follow"), "h6", ac, bf, 11, "center"), eSpacer(20), eSocial(brand.socialLinks || [], hColor, ac));
      sections.push(sec);
    }

    if (s === "Video") {
      const sec = eSection(card, Math.round(layout.sectionPadding * 0.8), Math.round(layout.sectionPadding * 0.8));
      push(sec, eVideo(page.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
      sections.push(sec);
    }

    if (s === "CTA") {
      const sec = eSection(ac, 100, 100);
      const hColor = textOn(ac);
      const bColor = mutedTextOn(ac);
      const { btnBg, btnText } = buttonOn(ac, pc);
      push(sec,
        eHead(page.ctaHeading || "Ready to make something worth seeing?", "h2", hColor, hf, 56, "center"),
        eSpacer(20),
        eTxt(brand.tagline || "Let's build content that performs.", bColor, bf, 17, "center"),
        eSpacer(32),
        eBtn(brand.cta1, "#contact", btnBg, btnText, bf, "center"),
      );
      sections.push(sec);
    }

    if (s === "Contact" || s === "Form") {
      // 2-column: copy left, form right (matches Rosalie/Lustre/Faure pattern)
      // Format per form: Title|Fields(comma)|Button text|Shortcode (optional)
      // If Shortcode is provided, it's rendered instead of the built-in form
      // — supports WPForms, Contact Form 7, Gravity Forms, Fluent Forms, etc.
      const allForms = (page.forms || "").split("\n").filter(Boolean);
      allForms.forEach(f => {
        const [title, fieldStr, cta, shortcode] = f.split("|");
        const fields = (fieldStr || "Name,Email,Message").split(",").filter(Boolean);
        const bg = s === "Form" ? card : pc;
        const sec = eSection(bg, 100, 100);
        const hColor = textOn(bg);
        const bColor = mutedTextOn(bg);

        const row = eRow(40);
        const colLeft = eCol(48);
        push(colLeft,
          eHead(eyebrowText(layout.eyebrowStyle, "Contact"), "h6", ac, bf, 11, "left"),
          eSpacer(16),
          eHead(title || "Let's talk.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
          eSpacer(20),
          eTxt("Tell us about your project and we'll be in touch within 24 hours.", bColor, bf, 16, "left"),
          eSpacer(32),
          eTxt(`<strong style="color:${ac};font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Email</strong><br><span style="font-size:16px;">${brand.contactEmail || "hello@yourbrand.com"}</span>`, hColor, bf, 14, "left"),
        );
        const colRight = eCol(48);
        if (shortcode && shortcode.trim()) {
          // Use the plugin's form via shortcode
          push(colRight, eShortcode(shortcode.trim()));
        } else {
          // Use Elementor's built-in form widget
          push(colRight, eForm(title || "Contact", fields, cta || "Send", ac, hColor, bf));
        }
        row.elements.push(colLeft, colRight);
        sec.elements.push(row);
        sections.push(sec);
      });
    }

    if (s === "Leadership") {
      // Featured person layout: large portrait left, name/title/quote/bio right
      // One section per leader for visual breathing room. Format per leader:
      // Name|Title|ImageURL|Quote|Bio
      const leaders = (page.leaders || "").split("\n").filter(Boolean);
      leaders.forEach((line, idx) => {
        const [name, title, leaderImg, quote, bio] = line.split("|");
        // Alternate left/right image placement for visual variation when 2+ leaders
        const imageOnLeft = idx % 2 === 0;
        const bg = idx % 2 === 0 ? pc : card;
        const sec = eSection(bg, layout.sectionPadding, layout.sectionPadding);
        const hColor = textOn(bg);
        const bColor = mutedTextOn(bg);

        const row = eRow(48);
        const portraitImg = imgOrPlaceholder(leaderImg, `${brand.name}-leader-${name}-${idx}`, 700, 900, "portrait");

        const colImg = eCol(40);
        push(colImg, eImg(portraitImg, name || "Leader"));

        const colContent = eCol(56);
        push(colContent,
          eHead(eyebrowText(layout.eyebrowStyle, "Leadership"), "h6", ac, bf, 11, "left"),
          eSpacer(16),
          eHead(name || "Leader", "h2", hColor, hf, Math.max(layout.sectionHeading, 48), "left"),
          eSpacer(8),
          eTxt(title || "Title", ac, bf, 14, "left"),
          ...(quote ? [
            eSpacer(32),
            eHead(`"${quote}"`, "h4", hColor, hf, 22, "left"),
          ] : []),
          ...(bio ? [
            eSpacer(28),
            eTxt(bio, bColor, bf, 16, "left"),
          ] : []),
        );

        if (imageOnLeft) {
          row.elements.push(colImg, colContent);
        } else {
          row.elements.push(colContent, colImg);
        }
        sec.elements.push(row);
        sections.push(sec);
      });
    }

    if (s === "Team Carousel") {
      // Carousel of team members with name + role as captions
      const sec = eSection(pc, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(pc);
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, "The Team"), "h6", ac, bf, 11, layout.sectionAlign),
        eSpacer(16),
        eHead("People who make it happen.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(48),
      );
      const teamLines = (page.team || "").split("\n").filter(Boolean);
      const teamImages = teamLines.map((line, i) => {
        const [name, role, img] = line.split("|");
        return {
          url: imgOrPlaceholder(img, `${brand.name}-team-${name}-${i}`, 600, 750, "portrait"),
          alt: `${name} — ${role}`,
        };
      });
      if (teamImages.length) {
        push(sec, eCarousel(teamImages, {
          slides: Math.min(teamImages.length, 4),
          slidesTablet: 2,
          slidesMobile: 1,
          captions: true,
          autoplay: true,
          color: hColor,
          accent: ac,
          font: bf,
        }));
      }
      sections.push(sec);
    }

    if (s === "Portfolio Carousel") {
      // Carousel of work/projects with titles as captions
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, "Selected Work"), "h6", ac, bf, 11, layout.sectionAlign),
        eSpacer(16),
        eHead("Recent projects.", "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(48),
      );
      const portLines = (page.portfolio || "").split("\n").filter(Boolean);
      const portImages = portLines.map((line, i) => {
        const [title, cat, img] = line.split("|");
        return {
          url: imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 1000, 750, brand.imageCategory),
          alt: title || `Project ${i + 1}`,
        };
      });
      if (portImages.length) {
        push(sec, eCarousel(portImages, {
          slides: Math.min(portImages.length, 3),
          slidesTablet: 2,
          slidesMobile: 1,
          captions: true,
          autoplay: true,
          speed: 6000,
          color: hColor,
          accent: ac,
          font: bf,
        }));
      }
      sections.push(sec);
    }

    if (s === "Logo Carousel") {
      // Carousel of client logos - text-based "logos" for now (client names cycled)
      // Users can replace with actual logo image URLs by editing the imported template
      const sec = eSection(card, Math.round(layout.sectionPadding * 0.6), Math.round(layout.sectionPadding * 0.6));
      const hColor = textOn(card);
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, "Trusted By"), "h6", ac, bf, 11, "center"),
        eSpacer(24),
      );
      const clientNames = (brand.clientLogos || "").split("\n").filter(Boolean);
      // Use Picsum placeholder logos seeded by client name — user replaces with real logo URLs
      const logoImages = clientNames.map((name, i) => ({
        url: imgOrPlaceholder("", `logo-${name}-${i}`, 300, 120),
        alt: name,
      }));
      if (logoImages.length) {
        push(sec, eCarousel(logoImages, {
          slides: Math.min(logoImages.length, 5),
          slidesTablet: 3,
          slidesMobile: 2,
          captions: false,
          autoplay: true,
          speed: 3000,
          navigation: "none",
          color: hColor,
          accent: ac,
          font: bf,
        }));
      }
      sections.push(sec);
    }

    if (s === "Marquee") {
      // Continuously scrolling text bar. Signature agency aesthetic.
      const sec = eSection(pc, 0, 0);
      sec.settings.padding = { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true };
      const text = brand.marqueeText || page.marqueeText || "We put creative at the center of everything we do";
      push(sec, eMarquee(text, textOn(pc), ac, hf, pc));
      sections.push(sec);
    }

    if (s === "Promo Banner") {
      // Thin top-of-page banner. E-commerce signature (shipping/sale callouts).
      const sec = eSection(textOn(pc) === "#ffffff" ? ac : "#0a0a0a", 0, 0);
      sec.settings.padding = { unit: "px", top: "12", right: "16", bottom: "12", left: "16", isLinked: false };
      const bg = textOn(pc) === "#ffffff" ? ac : "#0a0a0a";
      const fg = textOn(bg);
      const text = brand.promoBanner || page.promoBanner || "FREE SHIPPING ON ORDERS OVER $75  ·  EASY 30-DAY RETURNS";
      push(sec, eHTML(`<div style="text-align:center;font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${fg};font-weight:600;">${text}</div>`));
      sections.push(sec);
    }

    if (s === "Service Cards") {
      // Service category cards — clean text-only cards (no image, kept simple per request)
      // Data format: Title|Description (3rd pipe ignored if present from legacy data)
      const sec = eSection(card, layout.sectionPadding, layout.sectionPadding);
      const hColor = textOn(card);
      const eyebrow = page.servicesEyebrow || "Services";
      const heading = page.servicesHeading || "Our services.";
      push(sec,
        eHead(eyebrowText(layout.eyebrowStyle, eyebrow), "h6", ac, bf, 11, layout.sectionAlign),
        eSpacer(16),
        eHead(heading, "h2", hColor, hf, layout.sectionHeading, layout.sectionAlign),
        eSpacer(48),
      );
      const items = (page.services || "").split("\n").filter(Boolean);
      multiCol(sec, items, (col, line) => {
        const [title, desc] = line.split("|");
        col.settings.background_color = pc;
        col.settings.padding = { unit: "px", top: "36", right: "32", bottom: "36", left: "32", isLinked: false };
        col.settings.border_radius = { unit: "px", top: layout.cardRadius || 8, right: layout.cardRadius || 8, bottom: layout.cardRadius || 8, left: layout.cardRadius || 8, isLinked: true };
        push(col,
          eHead(title || "Service", "h3", textOn(pc), hf, 22, "left"),
          eSpacer(12),
          eTxt(desc || "", mutedTextOn(pc), bf, 15, "left"),
        );
      }, 24);
      sections.push(sec);
    }
  });

  return { version: "0.4", title: `${brand.name} — ${page.name}`, type: "page", content: sections };
}

// ──────────────────────────────────────────────────────────────────────────────
// BUILD FOOTER JSON — separate Theme Builder template
// ──────────────────────────────────────────────────────────────────────────────
function buildFooterJSON(brand) {
  const { accentColor: ac, cardBgColor: card, headingFont: hf, bodyFont: bf, footerStyle } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const headingColor = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
  const body = isDark ? "#888" : "#666";
  const sec = eSection(card, 80, 60);
  const push = (...els) => els.forEach(e => sec.elements.push(e));

  if (footerStyle === "Editorial") {
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 32, "center"),
      eTxt(brand.tagline || "", body, bf, 13, "center"),
      eSpacer(24),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(24),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`, body, bf, 11, "center"),
    );
  } else if (footerStyle === "Studio") {
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 28, "center"),
      eSpacer(16),
      eNavMenu(brand.primaryMenu || ""),
      eSpacer(24),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(24),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}`, body, bf, 11, "center"),
    );
  } else if (footerStyle === "Agency") {
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 28, "left"),
      eTxt(brand.tagline || "", body, bf, 14, "left"),
      eSpacer(16),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(32),
      eNavMenu(brand.primaryMenu || ""),
      eSpacer(32),
      eTxt(brand.contactEmail || "", body, bf, 14, "left"),
      eSpacer(24),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}. ${brand.utilityMenu || ""}`, body, bf, 11, "left"),
    );
  } else {
    // Premium — 4 column
    push(
      eHead(brand.logoText || brand.name, "h3", headingColor, hf, 28, "left"),
      eTxt(brand.tagline || "", body, bf, 14, "left"),
      eSpacer(16),
      eTxt(brand.contactEmail || "", body, bf, 14, "left"),
      eSpacer(16),
      eSocial(brand.socialLinks || [], headingColor, ac),
      eSpacer(48),
      eHead("PAGES", "h6", ac, bf, 11, "left"),
      eSpacer(12),
      eNavMenu(brand.primaryMenu || ""),
      eSpacer(48),
      eHead("LEGAL", "h6", ac, bf, 11, "left"),
      eSpacer(12),
      eNavMenu(brand.utilityMenu || ""),
      eSpacer(48),
      eTxt(`© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`, body, bf, 11, "left"),
    );
  }

  return { version: "0.4", title: `${brand.name} — Footer`, type: "footer", content: [sec] };
}

// ──────────────────────────────────────────────────────────────────────────────
// BUILD HEADER JSON — separate Theme Builder template for site navigation
// Import: WordPress → Templates → Theme Builder → Header → Add New → Import
// Set display conditions to "Entire Site" so the header shows on every page.
// Four styles match the four footer styles for a cohesive system.
// ──────────────────────────────────────────────────────────────────────────────
function buildHeaderJSON(brand) {
  const { primaryColor: pc, accentColor: ac, headingFont: hf, bodyFont: bf, headerStyle = "Editorial" } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const hColor = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
  const body = mutedTextOn(pc);

  // Header is a sticky bar with reduced vertical padding
  const sec = eSection(pc, 20, 20);
  sec.settings.padding = { unit: "px", top: "18", right: "60", bottom: "18", left: "60", isLinked: false };
  sec.settings.padding_tablet = { unit: "px", top: "16", right: "32", bottom: "16", left: "32", isLinked: false };
  sec.settings.padding_mobile = { unit: "px", top: "14", right: "20", bottom: "14", left: "20", isLinked: false };
  sec.settings.position = "sticky";
  sec.settings.z_index = { unit: "px", size: 100, sizes: [] };

  // Logo block — image if URL, text fallback
  const logoEl = brand.logoUrl
    ? { id: uid(), elType: "widget", widgetType: "image", elements: [],
        settings: { image: { url: brand.logoUrl, id: "" }, image_size: "medium", align: "left",
          width: { unit: "px", size: 140, sizes: [] }, link_to: "custom",
          link: { url: "/", is_external: "", nofollow: "" } } }
    : eHead(brand.logoText || brand.name, "h6", hColor, hf, 20, "left");

  // Nav menu widget — pulls from WordPress menu by name
  const navEl = eNavMenu(brand.primaryMenu || "");
  // Override nav styling for header context
  navEl.settings.menu_typography_typography = "custom";
  navEl.settings.menu_typography_font_family = bf;
  navEl.settings.menu_typography_font_size = { unit: "px", size: 12, sizes: [] };
  navEl.settings.menu_typography_letter_spacing = { unit: "px", size: 1, sizes: [] };
  navEl.settings.menu_typography_text_transform = "uppercase";
  navEl.settings.color_menu_item = hColor;
  navEl.settings.color_menu_item_hover = ac;
  navEl.settings.color_menu_item_active = ac;
  navEl.settings.pointer = "underline";
  navEl.settings.pointer_color = ac;
  // Switch to hamburger menu on tablet/mobile
  navEl.settings.menu_mobile_breakpoint = "tablet";
  navEl.settings.toggle = "burger";
  navEl.settings.toggle_color = hColor;

  // Social icons block for header — small, inline
  const socialEl = (brand.socialLinks || []).length && brand.showSocialInNav
    ? (() => {
        const s = eSocial(brand.socialLinks || [], hColor, ac);
        s.settings.icon_size = { unit: "px", size: 14, sizes: [] };
        s.settings.icon_padding = { unit: "em", size: 0.4, sizes: [] };
        s.settings.icon_spacing = { unit: "px", size: 8, sizes: [] };
        return s;
      })()
    : null;

  // CTA button for Premium header style
  const ctaEl = (() => {
    const b = eBtn(brand.cta1 || "Get in touch", "#contact", ac, textOn(ac), bf, "right");
    b.settings.typography_font_size = { unit: "px", size: 11, sizes: [] };
    b.settings.button_padding = { unit: "px", top: "12", right: "24", bottom: "12", left: "24", isLinked: false };
    return b;
  })();

  if (headerStyle === "Editorial") {
    // Minimal: logo left, nav center, social right (3 columns)
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 24, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colNav = eContainer({ content_width: "full", flex_grow: 1, flex_shrink: 1 });
    colNav.elements.push(navEl);
    const colSocial = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    if (socialEl) colSocial.elements.push(socialEl);
    row.elements.push(colLogo, colNav, colSocial);
    sec.elements.push(row);
  } else if (headerStyle === "Studio") {
    // Centered logo, nav below — magazine masthead feel
    const colLogo = eContainer({ content_width: "full", align_items: "center" });
    colLogo.elements.push(logoEl);
    sec.elements.push(colLogo);
    const colNav = eContainer({ content_width: "full", align_items: "center" });
    navEl.settings.align = "center";
    colNav.elements.push(navEl);
    sec.elements.push(colNav);
  } else if (headerStyle === "Agency") {
    // Logo left, nav right, social inline with nav
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 32, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colRight = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_gap: { unit: "px", size: 24, sizes: [] },
      flex_grow: 0, flex_shrink: 0,
      align_items: "center",
    });
    colRight.elements.push(navEl);
    if (socialEl) colRight.elements.push(socialEl);
    row.elements.push(colLogo, colRight);
    sec.elements.push(row);
  } else {
    // Premium — logo left, nav center, CTA + social right
    const row = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "nowrap",
      flex_gap: { unit: "px", size: 32, sizes: [] },
      width: { unit: "%", size: 100, sizes: [] },
      align_items: "center",
      justify_content: "space-between",
    });
    const colLogo = eContainer({ content_width: "full", flex_grow: 0, flex_shrink: 0 });
    colLogo.elements.push(logoEl);
    const colNav = eContainer({ content_width: "full", flex_grow: 1, flex_shrink: 1, align_items: "center" });
    colNav.elements.push(navEl);
    const colRight = eContainer({
      content_width: "full",
      flex_direction: "row",
      flex_gap: { unit: "px", size: 16, sizes: [] },
      flex_grow: 0, flex_shrink: 0,
      align_items: "center",
    });
    if (socialEl) colRight.elements.push(socialEl);
    colRight.elements.push(ctaEl);
    row.elements.push(colLogo, colNav, colRight);
    sec.elements.push(row);
  }

  return { version: "0.4", title: `${brand.name} — Header`, type: "header", content: [sec] };
}

// ──────────────────────────────────────────────────────────────────────────────
// DIVI BUILDER — outputs Divi layout JSON for WordPress
// Divi stores layouts as WordPress shortcodes (et_pb_*) wrapped in JSON envelope.
// Import: WordPress → Divi → Divi Library → Import & Export → Import
// Or: open page with Divi Builder → Load from Library → Your saved templates
// ──────────────────────────────────────────────────────────────────────────────
function buildDiviPage(page, brand) {
  const { primaryColor: pc, accentColor: ac, cardBgColor: card, bodyTextColor: body, headingFont: hf, bodyFont: bf } = brand;
  const ts = body;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const hc = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");

  // Divi shortcode helpers
  const dSec = (bg, pad = 100, inner = "") =>
    `[et_pb_section fb_built="1" background_color="${bg}" custom_padding="${pad}px|20px|${pad}px|20px"]${inner}[/et_pb_section]`;
  const dRow = (cols = "4_4", inner = "") =>
    cols === "4_4" ? `[et_pb_row]${inner}[/et_pb_row]` : `[et_pb_row column_structure="${cols}"]${inner}[/et_pb_row]`;
  const dCol = (type = "4_4", inner = "") => `[et_pb_column type="${type}"]${inner}[/et_pb_column]`;
  const dHead = (text, tag = "h2", color = hc, font = hf, size = 48, align = "left") => {
    const k = tag === "h1" ? "" : tag.charAt(1) + "_";
    return `[et_pb_text header_${k}font="${font}|400|||||||" header_${k}text_color="${color}" header_${k}font_size="${size}px" text_orientation="${align}" module_alignment="${align}"]<${tag}>${text}</${tag}>[/et_pb_text]`;
  };
  const dTxt = (html, color = ts, font = bf, size = 16, align = "left") =>
    `[et_pb_text text_font="${font}||||" text_text_color="${color}" text_font_size="${size}px" text_orientation="${align}"]<p>${html}</p>[/et_pb_text]`;
  const dBtn = (text, link = "#", bg = ac, color = "#fff", align = "left") =>
    `[et_pb_button button_text="${text}" button_url="${link}" button_alignment="${align}" custom_button="on" button_text_color="${color}" button_bg_color="${bg}" button_font="${bf}|700|on|on|||||" button_letter_spacing="2px" button_text_size="11px" custom_padding="16px|36px|16px|36px|true|true"][/et_pb_button]`;
  const dImg = (url, alt = "") =>
    `[et_pb_image src="${url}" alt="${alt}" align="center"][/et_pb_image]`;
  const dDiv = (h = 40) =>
    `[et_pb_divider color="transparent" divider_position="top" height="${h}px" hide_on_mobile="off"][/et_pb_divider]`;
  const dBlurb = (title, content) =>
    `[et_pb_blurb title="${title}" header_font="${hf}|500|||||||" header_text_color="${hc}" header_font_size="22px" body_font="${bf}||||" body_text_color="${ts}" body_font_size="14px"]${content}[/et_pb_blurb]`;
  const dTest = (text, name, role) =>
    `[et_pb_testimonial author="${name}" job_title="${role}" body_font="${hf}||||" body_text_color="${hc}" body_font_size="22px" author_font="${bf}|600||on|||||" author_text_color="${ac}"]${text}[/et_pb_testimonial]`;
  const dCount = (num, suffix, label) =>
    `[et_pb_number_counter title="${label}" number="${parseInt(num) || 0}" percent_sign="off" counter_color="${ac}" title_font="${bf}|500||on|||||" title_text_color="${hc}" number_font="${hf}||||" number_font_size="56px"][/et_pb_number_counter]`;
  const dAcc = (items) =>
    `[et_pb_accordion toggle_font="${hf}|400||||||" toggle_text_color="${hc}" icon_color="${ac}"]${items.map(([q, a]) => `[et_pb_accordion_item title="${q}"]${a}[/et_pb_accordion_item]`).join("")}[/et_pb_accordion]`;
  const dSocial = (links) =>
    `[et_pb_social_media_follow url_new_window="on" follow_button="off" icon_color="${hc}"]${links.map(l => `[et_pb_social_media_follow_network social_network="${l.key}" url="${l.url}" bg_color="transparent"]${l.label}[/et_pb_social_media_follow_network]`).join("")}[/et_pb_social_media_follow]`;
  const dVid = (url) =>
    `[et_pb_video src="${url}"][/et_pb_video]`;
  const dForm = (title, fields, btn) => {
    const f = fields.map(fl => {
      const ft = /message|details|notes/i.test(fl) ? "text" : (/email/i.test(fl) ? "email" : "input");
      return `[et_pb_contact_field field_id="${fl.toLowerCase().replace(/\s+/g, "_")}" field_title="${fl}" field_type="${ft}" fullwidth_field="on"][/et_pb_contact_field]`;
    }).join("");
    return `[et_pb_contact_form title="${title}" submit_button_text="${btn}" custom_button="on" button_bg_color="${ac}" button_text_color="#ffffff" form_field_text_color="${hc}" form_field_background_color="transparent"]${f}[/et_pb_contact_form]`;
  };

  const sections = [];

  page.sections.forEach(s => {
    if (s === "Hero") {
      const img = imgOrPlaceholder(page.heroImage, `${brand.name}-hero`, 1600, 1000, brand.imageCategory);
      const inner = dRow("4_4", dCol("4_4",
        dTxt(`●  STUDIO`, ac, bf, 11, "left") + dDiv(24) +
        dHead(page.heroHeading || brand.tagline, "h1", hc, hf, 84, "left") + dDiv(28) +
        dTxt(page.heroSubhead || brand.keyMessages.split(".")[0], ts, bf, 18, "left") + dDiv(48) +
        dBtn(brand.cta1, "#contact", ac, "#fff", "left")
      ));
      sections.push(`[et_pb_section fb_built="1" background_color="${pc}" background_image="${img}" background_blend="overlay" custom_padding="160px|20px|160px|20px"]${inner}[/et_pb_section]`);
    }

    if (s === "About") {
      const img = imgOrPlaceholder(page.aboutImage, `${brand.name}-about`, 800, 1000, brand.imageCategory);
      const inner = dRow("1_2,1_2",
        dCol("1_2", dTxt("ABOUT", ac, bf, 11, "left") + dDiv(16) + dHead(page.aboutHeading || "About", "h2", hc, hf, 48, "left") + dDiv(28) + dTxt(page.aboutBody || brand.description, ts, bf, 17, "left")) +
        dCol("1_2", dImg(img, "About"))
      );
      sections.push(dSec(card, 140, inner));
    }

    if (s === "Services") {
      const items = (page.services || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt(page.servicesEyebrow || "SERVICES", ac, bf, 11, "left") + dDiv(16) + dHead(page.servicesHeading || "Our services.", "h2", hc, hf, 52, "left") + dDiv(40)));
      const cols = items.slice(0, 4).map((line, i) => { const [t, d] = line.split("|"); return dCol("1_4", dBlurb(`${String(i + 1).padStart(2, "0")} ${t || ""}`, d || "")); }).join("");
      const itemsRow = dRow("1_4,1_4,1_4,1_4", cols);
      sections.push(dSec(pc, 140, headRow + itemsRow));
    }

    if (s === "Process") {
      const items = (page.process || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt("HOW WE WORK", ac, bf, 11, "left") + dDiv(16) + dHead("The process.", "h2", hc, hf, 48, "left") + dDiv(40)));
      const cols = items.slice(0, 4).map((line, i) => { const [t, d] = line.split("|"); return dCol("1_4", dBlurb(`Step ${String(i + 1).padStart(2, "0")} — ${t || ""}`, d || "")); }).join("");
      const itemsRow = dRow("1_4,1_4,1_4,1_4", cols);
      sections.push(dSec(card, 140, headRow + itemsRow));
    }

    if (s === "Portfolio") {
      const items = (page.portfolio || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt("SELECTED WORK", ac, bf, 11, "left") + dDiv(16) + dHead("Recent projects.", "h2", hc, hf, 52, "left") + dDiv(40)));
      const cards = items.map((line, i) => {
        const [t, c, img] = line.split("|");
        const portImg = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 800, 1000, brand.imageCategory);
        return dCol("1_3", dImg(portImg, t || "") + dHead(t || "", "h3", hc, hf, 22, "left") + dTxt(c || "", ac, bf, 12, "left"));
      }).join("");
      const cardRow = dRow("1_3,1_3,1_3", cards.slice(0, 3 * 200)); // safety
      sections.push(dSec(card, 140, headRow + cardRow));
    }

    if (s === "Team") {
      const items = (page.team || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt("THE TEAM", ac, bf, 11, "left") + dDiv(16) + dHead("People who make it happen.", "h2", hc, hf, 48, "left") + dDiv(40)));
      const cards = items.slice(0, 4).map((line, i) => {
        const [n, role, img] = line.split("|");
        const tImg = imgOrPlaceholder(img, `${brand.name}-team-${n}-${i}`, 600, 750, "portrait");
        return dCol("1_4", dImg(tImg, n || "") + dHead(n || "", "h3", hc, hf, 20, "left") + dTxt(role || "", ac, bf, 12, "left"));
      }).join("");
      sections.push(dSec(pc, 140, headRow + dRow("1_4,1_4,1_4,1_4", cards)));
    }

    if (s === "Clients") {
      const list = (brand.clientLogos || "").split("\n").filter(Boolean).join(" · ");
      const inner = dRow("4_4", dCol("4_4", dTxt("TRUSTED BY", ac, bf, 11, "center") + dDiv(24) + dHead(list, "h3", hc, hf, 20, "center")));
      sections.push(dSec(card, 100, inner));
    }

    if (s === "Stats") {
      const items = (page.stats || "").split("\n").filter(Boolean).slice(0, 4);
      const cards = items.map(line => { const [n, suf, lab] = line.split("|"); return dCol("1_4", dCount(n, suf, lab)); }).join("");
      sections.push(dSec(pc, 120, dRow("1_4,1_4,1_4,1_4", cards)));
    }

    if (s === "Pricing") {
      const items = (page.pricing || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt("PRICING", ac, bf, 11, "center") + dDiv(16) + dHead("Investment.", "h2", hc, hf, 52, "center") + dDiv(40)));
      const cards = items.slice(0, 3).map(line => { const [tier, price, desc] = line.split("|"); return dCol("1_3", dHead(tier || "", "h4", hc, hf, 22, "center") + dHead(price || "", "h3", ac, hf, 40, "center") + dTxt(desc || "", ts, bf, 14, "center") + dDiv(24) + dBtn(brand.cta1, "#contact", ac, "#fff", "center")); }).join("");
      sections.push(dSec(card, 140, headRow + dRow("1_3,1_3,1_3", cards)));
    }

    if (s === "Testimonials") {
      const items = (page.testimonials || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt("KIND WORDS", ac, bf, 11, "left") + dDiv(40)));
      const cards = items.slice(0, 2).map(line => { const [q, n, r] = line.split("|"); return dCol("1_2", dTest(q || "", n || "", r || "")); }).join("");
      sections.push(dSec(pc, 140, headRow + dRow("1_2,1_2", cards)));
    }

    if (s === "Blog") {
      const items = (page.blog || "").split("\n").filter(Boolean);
      const headRow = dRow("4_4", dCol("4_4", dTxt("JOURNAL", ac, bf, 11, "left") + dDiv(16) + dHead("Recent posts.", "h2", hc, hf, 48, "left") + dDiv(40)));
      const cards = items.slice(0, 3).map((line, i) => { const [t, c, m] = line.split("|"); const img = imgOrPlaceholder("", `${brand.name}-blog-${i}`, 800, 500, brand.imageCategory); return dCol("1_3", dImg(img, t || "") + dTxt(c || "", ac, bf, 11, "left") + dHead(t || "", "h3", hc, hf, 20, "left") + dTxt(m || "", ts, bf, 13, "left")); }).join("");
      sections.push(dSec(pc, 140, headRow + dRow("1_3,1_3,1_3", cards)));
    }

    if (s === "FAQ") {
      const items = (page.faq || "").split("\n").filter(Boolean).map(l => l.split("|"));
      const inner = dRow("4_4", dCol("4_4", dTxt("FAQ", ac, bf, 11, "left") + dDiv(16) + dHead("Questions, answered.", "h2", hc, hf, 48, "left") + dDiv(40) + dAcc(items)));
      sections.push(dSec(card, 140, inner));
    }

    if (s === "Social") {
      const inner = dRow("4_4", dCol("4_4", dTxt("FOLLOW", ac, bf, 11, "center") + dDiv(24) + dSocial(brand.socialLinks || [])));
      sections.push(dSec(pc, 100, inner));
    }

    if (s === "Video") {
      sections.push(dSec(card, 80, dRow("4_4", dCol("4_4", dVid(page.videoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ")))));
    }

    if (s === "CTA") {
      const inner = dRow("4_4", dCol("4_4",
        dHead(page.ctaHeading || "Ready to make something worth seeing?", "h2", "#ffffff", hf, 64, "center") + dDiv(28) +
        dTxt(brand.tagline || "", "rgba(255,255,255,0.85)", bf, 17, "center") + dDiv(40) +
        dBtn(brand.cta1, "#contact", "#ffffff", ac, "center")
      ));
      sections.push(dSec(ac, 160, inner));
    }

    if (s === "Contact" || s === "Form") {
      (page.forms || "").split("\n").filter(Boolean).forEach(f => {
        const [title, fieldStr, cta] = f.split("|");
        const fields = (fieldStr || "Name,Email,Message").split(",").filter(Boolean);
        const inner = dRow("4_4", dCol("4_4",
          dTxt("CONTACT", ac, bf, 11, "left") + dDiv(16) +
          dHead(title || "Let's talk.", "h2", hc, hf, 52, "left") + dDiv(40) +
          dForm(title || "Contact", fields, cta || "Send")
        ));
        sections.push(dSec(s === "Form" ? card : pc, 140, inner));
      });
    }
  });

  return {
    context: "et_builder",
    data: { "1": sections.join("\n") },
    presets: {},
    global_colors: [],
    thumbnails: [],
    images: {},
  };
}

function buildDiviFooter(brand) {
  const { accentColor: ac, cardBgColor: card, headingFont: hf, bodyFont: bf, footerStyle } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const hc = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
  const body = isDark ? "#888" : "#666";
  const logoText = brand.logoText || brand.name;

  const txt = (html, color = body, size = 13, align = "left") =>
    `[et_pb_text text_font="${bf}||||" text_text_color="${color}" text_font_size="${size}px" text_orientation="${align}"]<p>${html}</p>[/et_pb_text]`;
  const head = (text, size = 28, align = "left") =>
    `[et_pb_text header_2_font="${hf}|400|||||||" header_2_text_color="${hc}" header_2_font_size="${size}px" text_orientation="${align}" module_alignment="${align}"]<h2>${text}</h2>[/et_pb_text]`;
  const logo = (size, align) => brand.logoUrl
    ? `[et_pb_image src="${brand.logoUrl}" alt="${brand.name}" align="${align}"][/et_pb_image]`
    : head(logoText, size, align);
  const social = `[et_pb_social_media_follow url_new_window="on" follow_button="off" icon_color="${hc}" module_alignment="center"]${(brand.socialLinks || []).map(l => `[et_pb_social_media_follow_network social_network="${l.key}" url="${l.url}" bg_color="transparent"]${l.label}[/et_pb_social_media_follow_network]`).join("")}[/et_pb_social_media_follow]`;
  const menu = (m) => (m || "").split(",").map(item => `<a href="#" style="display:block;color:${body};text-decoration:none;margin-bottom:10px;font-family:${bf};font-size:13px;">${item.trim()}</a>`).join("");

  let inner = "";
  if (footerStyle === "Editorial") {
    inner = `[et_pb_row][et_pb_column type="4_4"]${logo(28, "center")}${txt(brand.tagline || "", body, 13, "center")}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${social}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${txt(`© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`, body, 11, "center")}[/et_pb_column][/et_pb_row]`;
  } else if (footerStyle === "Studio") {
    inner = `[et_pb_row][et_pb_column type="4_4"]${logo(28, "center")}[et_pb_divider color="transparent" height="16px"][/et_pb_divider]${txt(menu(brand.primaryMenu), body, 13, "center")}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${social}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${txt(`© ${new Date().getFullYear()} ${brand.name}`, body, 11, "center")}[/et_pb_column][/et_pb_row]`;
  } else if (footerStyle === "Agency") {
    inner = `[et_pb_row column_structure="1_3,1_3,1_3"][et_pb_column type="1_3"]${logo(24, "left")}${txt(brand.tagline || "", body, 13, "left")}${social}[/et_pb_column][et_pb_column type="1_3"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Pages</strong>`, ac, 11, "left")}${txt(menu(brand.primaryMenu), body, 13, "left")}[/et_pb_column][et_pb_column type="1_3"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Contact</strong>`, ac, 11, "left")}${txt(brand.contactEmail || "", body, 13, "left")}${txt(brand.contactPhone || "", body, 13, "left")}[/et_pb_column][/et_pb_row][et_pb_row][et_pb_column type="4_4"]${txt(`© ${new Date().getFullYear()} ${brand.name}. ${brand.utilityMenu || ""}`, body, 11, "left")}[/et_pb_column][/et_pb_row]`;
  } else {
    inner = `[et_pb_row column_structure="1_2,1_4,1_4"][et_pb_column type="1_2"]${logo(28, "left")}${txt(brand.tagline || "", body, 14, "left")}${txt(brand.contactEmail || "", body, 13, "left")}${social}[/et_pb_column][et_pb_column type="1_4"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Pages</strong>`, ac, 11, "left")}${txt(menu(brand.primaryMenu), body, 13, "left")}[/et_pb_column][et_pb_column type="1_4"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Legal</strong>`, ac, 11, "left")}${txt(menu(brand.utilityMenu), body, 13, "left")}[/et_pb_column][/et_pb_row][et_pb_row][et_pb_column type="4_4"]${txt(`© ${new Date().getFullYear()} ${brand.name}. All rights reserved.`, body, 11, "left")}[/et_pb_column][/et_pb_row]`;
  }

  const shortcode = `[et_pb_section fb_built="1" background_color="${card}" custom_padding="80px|20px|40px|20px"]${inner}[/et_pb_section]`;

  return {
    context: "et_builder",
    data: { "1": shortcode },
    presets: {},
    global_colors: [],
    thumbnails: [],
    images: {},
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// AUDIT — categorized: critical, content, seo, aio, best
// Each item: { category, msg, fix?, target: { tab, section } }
// The target tells the UI exactly where to jump when the user clicks an item.
// ──────────────────────────────────────────────────────────────────────────────
function auditBrand(brand, pages) {
  const issues = [];
  const add = (category, msg, fix, target) => issues.push({ category, msg, fix, target });

  // ─── CRITICAL — page won't function well without these
  if (!brand.logoUrl && !brand.logoText) add("critical", "No logo URL or text fallback", "Add a logo URL or a text-based logo in Logo & Identity.", { tab: "brand", section: "brand-logo" });
  if (!brand.tagline) add("critical", "Missing tagline", "Add a tagline in Business — it shows in hero and footer.", { tab: "brand", section: "brand-business" });
  if (!brand.primaryColor || !brand.accentColor) add("critical", "Primary or accent color missing", "Pick a Theme and Accent in the Brand tab.", { tab: "brand", section: "brand-theme" });
  if (!brand.cta1) add("critical", "Primary CTA is empty", "Add a primary CTA in Logo & Identity (e.g. 'Book a call').", { tab: "brand", section: "brand-logo" });
  if (!brand.contactEmail) add("critical", "No contact email", "Used in footer and contact forms — add in Logo & Identity.", { tab: "brand", section: "brand-logo" });

  // ─── CONTENT — sections turned on but empty
  pages.forEach(p => {
    const has = (s) => p.sections.includes(s);
    if (!p.heroHeading) add("content", `${p.name}: hero heading is empty`, "Add a hero heading or apply a template.", { tab: "page", section: "page-hero" });
    if (has("Portfolio") && !p.portfolio) add("content", `${p.name}: Portfolio section is on but no items added`, "Add items — Title|Category|ImageURL per line.", { tab: "content", section: "content-portfolio" });
    if (has("Portfolio Carousel") && !p.portfolio) add("content", `${p.name}: Portfolio Carousel is on but no items`, "Add items in the Portfolio block.", { tab: "content", section: "content-portfolio" });
    if (has("Services") && !p.services) add("content", `${p.name}: Services section is on but no services`, "Add services — Title|Description per line.", { tab: "content", section: "content-services" });
    if (has("Service Cards") && !p.services) add("content", `${p.name}: Service Cards section is on but no services`, "Add services in the Services block.", { tab: "content", section: "content-services" });
    if (has("Process") && !p.process) add("content", `${p.name}: Process section is on but no steps`, "Add steps — Step Title|Description per line.", { tab: "content", section: "content-process" });
    if (has("Stats") && !p.stats) add("content", `${p.name}: Stats section is on but no stats`, "Add stats — Number|Suffix|Label per line.", { tab: "content", section: "content-stats" });
    if (has("Testimonials") && !p.testimonials) add("content", `${p.name}: Testimonials section is on but no testimonials`, "Add testimonials — Quote|Name|Role per line.", { tab: "content", section: "content-testimonials" });
    if (has("FAQ") && !p.faq) add("content", `${p.name}: FAQ section is on but no questions`, "Add FAQs — Question|Answer per line.", { tab: "content", section: "content-faq" });
    if (has("Team") && !p.team) add("content", `${p.name}: Team section is on but no members`, "Add team members — Name|Role|ImageURL per line.", { tab: "content", section: "content-team" });
    if (has("Leadership") && !p.leaders) add("content", `${p.name}: Leadership section is on but no leaders`, "Add leaders in the Leadership block.", { tab: "content", section: "content-leadership" });
    if (has("Pricing") && !p.pricing) add("content", `${p.name}: Pricing section is on but no tiers`, "Add pricing — Tier|Price|Description per line.", { tab: "content", section: "content-pricing" });
    if (has("Blog") && !p.blog) add("content", `${p.name}: Blog section is on but no posts`, "Add posts in the Blog Posts block.", { tab: "content", section: "content-blog" });
    if (has("Form") && !p.forms) add("content", `${p.name}: Form section is on but no form configured`, "Configure the form in the Forms block.", { tab: "content", section: "content-forms" });
  });

  // ─── SEO — search engine optimization
  const tagLen = (brand.tagline || "").length;
  if (tagLen > 0 && tagLen < 10) add("seo", "Tagline is very short", "Aim for 10–70 characters — describes the brand promise.", { tab: "brand", section: "brand-business" });
  if (tagLen > 70) add("seo", "Tagline is too long", "Trim to under 70 characters for better display in search results.", { tab: "brand", section: "brand-business" });

  const desc = (brand.description || "").trim();
  if (!desc) add("seo", "No brand description", "Add a 1–2 sentence description — used as the meta description.", { tab: "brand", section: "brand-business" });
  else if (desc.length < 80) add("seo", "Description is too short for SEO", "Expand to 80–160 characters — that's the sweet spot for meta descriptions.", { tab: "brand", section: "brand-business" });
  else if (desc.length > 200) add("seo", "Description is long for a meta description", "Tighten to under 160 characters — search engines truncate longer ones.", { tab: "brand", section: "brand-business" });

  const keywords = (brand.primaryKeywords || "").split(",").map(k => k.trim().toLowerCase()).filter(Boolean);
  if (!keywords.length) {
    add("seo", "No primary keywords set", "Add 3–5 in the Brand Brief — these power SEO and AI search audits.", { tab: "brand", section: "brand-brief" });
  } else {
    const heroBlob = (pages[0]?.heroHeading + " " + pages[0]?.heroSubhead + " " + (brand.tagline || "")).toLowerCase();
    const aboutBlob = ((pages[0]?.aboutBody || "") + " " + (brand.description || "")).toLowerCase();
    const heroHits = keywords.filter(k => heroBlob.includes(k));
    const aboutHits = keywords.filter(k => aboutBlob.includes(k));
    if (heroHits.length === 0) add("seo", "No primary keywords appear in your hero", `Work at least one of "${keywords.slice(0, 3).join('", "')}" naturally into the hero.`, { tab: "page", section: "page-hero" });
    if (aboutHits.length === 0) add("seo", "No primary keywords appear in your about copy", "Search engines weigh About heavily — work in at least one primary keyword.", { tab: "page", section: "page-about" });
  }

  if (pages[0] && !pages[0].heroHeading) add("seo", "Hero heading is empty — bad for ranking", "The H1 is the single most important on-page SEO signal.", { tab: "page", section: "page-hero" });

  // ─── AIO — AI search optimization
  const activeGoals = brand.goals && brand.goals.length ? brand.goals : (brand.goal ? [brand.goal] : []);
  if (!activeGoals.length) add("aio", "No primary goal set", "Set at least one goal in Brand Brief — AI search relies on clear intent signals.", { tab: "brand", section: "brand-brief" });
  if (!brand.outcome) add("aio", "No desired outcome specified", "Add an outcome sentence in Brand Brief — helps LLMs understand what your page is for.", { tab: "brand", section: "brand-brief" });

  const aboutWords = (pages[0]?.aboutBody || "").split(/\s+/).filter(Boolean).length;
  if (aboutWords > 0 && aboutWords < 60) add("aio", "About copy is too thin to be cited by AI search", "Aim for 80–150 words with specific facts — LLMs cite specific, factual passages.", { tab: "page", section: "page-about" });

  const hasFAQ = pages.some(p => p.sections.includes("FAQ") && p.faq);
  if (!hasFAQ) add("aio", "No FAQ section on any page", "FAQs in Q&A format are the single most cited content type by AI search.", { tab: "page", section: "page-sections" });

  const hasStats = pages.some(p => p.sections.includes("Stats") && p.stats);
  if (!hasStats) add("aio", "No stats anywhere on the site", "Specific numbers (years in business, clients served, outcomes) get cited by AI summaries.", { tab: "page", section: "page-sections" });

  const hero = (pages[0]?.heroHeading || "").toLowerCase();
  if (hero && hero.split(/\s+/).length < 5) add("aio", "Hero heading is very short", "Aim for 8–14 words — LLMs need enough context to understand what you offer.", { tab: "page", section: "page-hero" });

  // ─── BEST PRACTICES — patterns that perform
  const homepage = pages[0];
  if (homepage && !homepage.sections.includes("Testimonials")) add("best", "No testimonials on the homepage", "Social proof above the fold lifts conversion 20–40%.", { tab: "page", section: "page-sections" });
  if (homepage && !homepage.sections.includes("CTA") && !homepage.sections.includes("Form") && !homepage.sections.includes("Contact")) add("best", "No CTA, Form, or Contact section on the homepage", "Every homepage should have a clear conversion path.", { tab: "page", section: "page-sections" });
  if (homepage && !homepage.sections.includes("Logo Carousel") && !homepage.sections.includes("Clients") && homepage.sections.includes("Services")) add("best", "Service business with no client logos or social proof", "Add a Logo Carousel with brands you've worked with.", { tab: "page", section: "page-sections" });

  // Check CTA alignment against ANY of the user's goals (not just the first one)
  if (brand.cta1 && activeGoals.length) {
    const cta = brand.cta1.toLowerCase();
    const matchesAny = activeGoals.some(g => {
      if (g === "Bookings & Reservations") return /book|reserve|schedule|appointment|call|consult/i.test(cta);
      if (g === "Direct Sales / E-commerce") return /shop|buy|order|cart|sale|now/i.test(cta);
      if (g === "Lead Generation") return /get|start|book|call|demo|quote|inquire|contact/i.test(cta);
      if (g === "Donations & Fundraising") return /donate|give|support|contribute/i.test(cta);
      if (g === "Applications & Sign-ups") return /apply|sign up|join|enroll|register/i.test(cta);
      if (g === "Community & Newsletter Growth") return /subscribe|join|sign up|newsletter/i.test(cta);
      if (g === "Free Trial / Demo Sign-ups") return /trial|demo|try|start|get started|sign up|free/i.test(cta);
      if (g === "Account Creation / Registration") return /sign up|register|create|join|get started|start/i.test(cta);
      if (g === "Resource Downloads / Lead Magnets") return /download|get|grab|access|free|guide/i.test(cta);
      return true; // Awareness — any CTA is fine
    });
    if (!matchesAny) {
      add("best", "Your CTA doesn't match any of your goals", `"${brand.cta1}" doesn't reflect ${activeGoals.join(" or ")}. Match the verb to what you want visitors to do.`, { tab: "brand", section: "brand-logo" });
    }
  }

  if (!(brand.socialLinks || []).length) add("best", "No social links added", "Adds trust signals — even 1–2 links help.", { tab: "social", section: "social-links" });
  if (!brand.inspoUrls) add("best", "No inspiration URLs", "Optional — feeds into the AI Draft Starter Copy for aesthetic context.", { tab: "discovery", section: "inspo-sites" });

  return issues;
}

// ──────────────────────────────────────────────────────────────────────────────
// PREVIEW HTML — matches Rosalie/Lustre/Faure aesthetic
// ──────────────────────────────────────────────────────────────────────────────
function previewHTML(page, brand) {
  const { primaryColor: pc, accentColor: ac, cardBgColor: card, bodyTextColor: body, borderColor: bdr, headingFont: hf, bodyFont: bf } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const headingColor = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
  const ts = body;
  const sl = brand.socialLinks || [];
  const layout = getLayout(brand.layoutId);

  // Logo helper — uses WordPress URL when present, falls back to text.
  // Adds onerror handler so broken image URLs gracefully degrade to text.
  const logoHTML = (size = 28, align = "left") => brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.name}" style="height:${Math.round(size * 1.4)}px;width:auto;display:block;${align === "center" ? "margin:0 auto;" : ""}" onerror="this.outerHTML='<span style=\\'font-family:&quot;${hf}&quot;,serif;font-size:${size}px;color:${headingColor};font-weight:400;display:inline-block;\\'>${(brand.logoText || brand.name).replace(/'/g, "&#39;")}</span>'"/>`
    : `<span style="font-family:'${hf}',serif;font-size:${size}px;color:${headingColor};font-weight:400;display:inline-block;">${brand.logoText || brand.name}</span>`;

  const navSocial = brand.showSocialInNav ? sl.map(s => SVG[s.key] ? `<a href="${s.url}" target="_blank" style="color:${ts};display:inline-flex;align-items:center;margin-left:14px;">${SVG[s.key](ts, 18)}</a>` : "").join("") : "";

  const section = (s) => {
    if (s === "Hero") {
      const heroBg = imgOrPlaceholder(page.heroImage, `${brand.name}-hero`, 1600, 1000, brand.imageCategory);
      const heading = page.heroHeading || brand.tagline;
      const subhead = page.heroSubhead || (brand.keyMessages || "").split(".")[0];
      const v = layout.heroVariant || "left-standard";
      const eyebrow = eyebrowText(layout.eyebrowStyle, page.heroEyebrow || "Welcome");
      const btnTxtColor = luminance(ac) > 0.6 ? "#0a0a0a" : "#ffffff";

      // SPLIT IMAGE — text left 55%, image card right 40% (Agency, Production templates)
      if (v === "split-image" || v === "split-image-rounded") {
        const radius = v === "split-image-rounded" ? `${layout.cardRadius || 16}px` : "0";
        return `<section style="background:${pc};padding:clamp(80px,10vw,140px) clamp(24px,8vw,100px);">
          <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:60px;align-items:center;" class="hero-split">
            <div>
              <p data-edit="page.heroEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 28px;">${eyebrow}</p>
              <h1 data-edit="page.heroHeading" style="font-family:'${hf}',sans-serif;font-size:clamp(40px,6vw,${layout.heroHeading}px);color:${headingColor};margin:0 0 28px;font-weight:700;line-height:1.05;letter-spacing:-0.02em;">${heading}</h1>
              <p data-edit="page.heroSubhead" style="font-family:'${bf}',sans-serif;font-size:clamp(15px,1.4vw,18px);color:${ts};margin:0 0 40px;line-height:1.7;">${subhead}</p>
              <a data-edit="brand.cta1" href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:${btnTxtColor};background:${ac};padding:18px 36px;text-decoration:none;display:inline-block;font-weight:600;">${brand.cta1}</a>
            </div>
            <div style="aspect-ratio:4/5;background:url('${heroBg}') center/cover no-repeat;border-radius:${radius};"></div>
          </div>
        </section>`;
      }

      // CENTERED BOLD — magazine masthead, big centered serif, no image (Magazine, Lifestyle Blog)
      if (v === "centered-bold") {
        return `<section style="background:${pc};padding:clamp(100px,14vw,200px) clamp(24px,8vw,100px);text-align:center;">
          <p data-edit="page.heroEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 32px;">${eyebrow}</p>
          <h1 data-edit="page.heroHeading" style="font-family:'${hf}',serif;font-size:clamp(44px,7vw,${layout.heroHeading}px);color:${headingColor};margin:0 auto 32px;font-weight:400;line-height:1.1;max-width:1200px;font-style:italic;">${heading}</h1>
          <p data-edit="page.heroSubhead" style="font-family:'${bf}',sans-serif;font-size:clamp(16px,1.5vw,20px);color:${ts};max-width:680px;margin:0 auto 48px;line-height:1.7;">${subhead}</p>
          <a data-edit="brand.cta1" href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:${btnTxtColor};background:${ac};padding:18px 40px;text-decoration:none;display:inline-block;font-weight:600;">${brand.cta1}</a>
        </section>`;
      }

      // MINIMAL TEXT — just oversized heading, brutalist energy (Brutalist layout)
      if (v === "minimal-text") {
        return `<section style="background:${pc};padding:clamp(40px,6vw,80px) clamp(24px,8vw,100px) clamp(60px,10vw,120px);">
          <p data-edit="page.heroEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 60px;">${eyebrow}</p>
          <h1 data-edit="page.heroHeading" style="font-family:'${hf}',sans-serif;font-size:clamp(56px,12vw,${layout.heroHeading}px);color:${headingColor};margin:0 0 60px;font-weight:900;line-height:0.95;letter-spacing:-0.04em;text-transform:uppercase;">${heading}</h1>
          <a data-edit="brand.cta1" href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:${btnTxtColor};background:${ac};padding:18px 36px;text-decoration:none;display:inline-block;font-weight:600;">${brand.cta1}</a>
        </section>`;
      }

      // FULLBLEED OVERLAY — image as bg, text overlay (E-commerce, lifestyle)
      if (v === "fullbleed-overlay") {
        return `<section style="background:url('${heroBg}') center/cover no-repeat;padding:clamp(120px,16vw,200px) clamp(24px,8vw,100px);min-height:90vh;display:flex;flex-direction:column;justify-content:flex-end;position:relative;">
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,0.6) 100%);"></div>
          <div style="position:relative;z-index:2;">
            <p data-edit="page.heroEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#ffffff;margin:0 0 24px;opacity:0.9;">${eyebrow}</p>
            <h1 data-edit="page.heroHeading" style="font-family:'${hf}',sans-serif;font-size:clamp(40px,7vw,${layout.heroHeading}px);color:#ffffff;margin:0 0 24px;font-weight:700;line-height:1.05;max-width:900px;">${heading}</h1>
            <p data-edit="page.heroSubhead" style="font-family:'${bf}',sans-serif;font-size:clamp(15px,1.4vw,18px);color:rgba(255,255,255,0.85);max-width:600px;margin:0 0 40px;line-height:1.6;">${subhead}</p>
            <a data-edit="brand.cta1" href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#0a0a0a;background:#ffffff;padding:18px 36px;text-decoration:none;display:inline-block;font-weight:600;">${brand.cta1}</a>
          </div>
        </section>`;
      }

      // DEFAULT (left-standard) — current Editorial Minimal / Studio Portfolio look
      const overlayDir = isDark ? "180deg, transparent 0%," : "180deg, rgba(255,255,255,0.6) 0%,";
      return `<section style="background:${pc};padding:clamp(80px,12vw,160px) clamp(24px,8vw,100px);min-height:90vh;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;">
        <div style="position:absolute;inset:0;background:url('${heroBg}') center/cover no-repeat;opacity:${isDark ? 0.35 : 0.55};"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(${overlayDir} ${pc} 100%);"></div>
        <div style="position:relative;z-index:2;">
          <p data-edit="page.heroEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 32px;">${eyebrow}</p>
          <h1 data-edit="page.heroHeading" style="font-family:'${hf}',serif;font-size:clamp(48px,8vw,${layout.heroHeading}px);color:${headingColor};margin:0 0 32px;font-weight:400;line-height:1.05;max-width:1100px;">${heading}</h1>
          <p data-edit="page.heroSubhead" style="font-family:'${bf}',sans-serif;font-size:clamp(15px,1.4vw,19px);color:${ts};max-width:640px;margin:0 0 56px;line-height:1.7;">${subhead}</p>
          <div><a data-edit="brand.cta1" href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:${btnTxtColor};background:${ac};padding:18px 36px;text-decoration:none;display:inline-block;">${brand.cta1}</a></div>
        </div>
      </section>`;
    }

    if (s === "About") {
      const aboutImg = imgOrPlaceholder(page.aboutImage, `${brand.name}-about`, 800, 1000, brand.imageCategory);
      return `<section style="background:${card};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;" class="about-grid">
          <div>
            <p data-edit="page.aboutEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;">${page.aboutEyebrow || "About"}</p>
            <h2 data-edit="page.aboutHeading" style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 32px;font-weight:400;line-height:1.15;">${page.aboutHeading || "Built for brands that need content that performs."}</h2>
            <p data-edit="page.aboutBody" style="font-family:'${bf}',sans-serif;font-size:17px;color:${ts};line-height:1.8;margin:0;">${page.aboutBody || brand.description}</p>
          </div>
          <div style="aspect-ratio:4/5;background:url('${aboutImg}') center/cover no-repeat;"></div>
        </div>
      </section>`;
    }

    if (s === "Services") {
      const items = (page.services || "").split("\n").filter(Boolean);
      const v = layout.servicesVariant || "grid-numbered";
      const heading = page.servicesHeading || "Our services.";
      const eyebrow = eyebrowText(layout.eyebrowStyle, page.servicesEyebrow || "Services");

      // LIST ROW — full-width rows, divider between (Editorial Bold, Brutalist)
      if (v === "list-row") {
        return `<section style="background:${pc};padding:clamp(60px,10vw,100px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
          <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.sectionEyebrow">${eyebrow}</p>
          <h2 style="font-family:'${hf}',sans-serif;font-size:clamp(36px,5vw,${layout.sectionHeading}px);color:${headingColor};margin:0 0 64px;font-weight:700;letter-spacing:-0.02em;" data-edit="page.servicesHeading">${heading}</h2>
          <div>
            ${items.map((line, i) => { const [t, d] = line.split("|"); return `<div style="display:grid;grid-template-columns:80px 1.5fr 2fr;gap:32px;padding:32px 0;border-bottom:1px solid ${bdr};align-items:start;">
              <div style="font-family:'${hf}',sans-serif;font-size:32px;color:${ac};font-weight:700;line-height:1;">${String(i + 1).padStart(2, "0")}</div>
              <h3 style="font-family:'${hf}',sans-serif;font-size:24px;color:${headingColor};margin:0;font-weight:600;line-height:1.2;">${t || ""}</h3>
              <p style="font-family:'${bf}',sans-serif;font-size:15px;color:${ts};line-height:1.7;margin:0;">${d || ""}</p>
            </div>`; }).join("")}
          </div>
        </section>`;
      }

      // CARDS PADDED — rounded soft cards (Studio Modern)
      if (v === "cards-padded") {
        const radius = `${layout.cardRadius || 16}px`;
        return `<section style="background:${pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};text-align:center;">
          <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.sectionEyebrow">${eyebrow}</p>
          <h2 style="font-family:'${hf}',sans-serif;font-size:clamp(28px,4vw,${layout.sectionHeading}px);color:${headingColor};margin:0 0 56px;font-weight:500;" data-edit="page.servicesHeading">${heading}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;text-align:left;">
            ${items.map((line, i) => { const [t, d] = line.split("|"); return `<div style="background:${card};padding:40px 32px;border-radius:${radius};">
              <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${ac};margin:0 0 20px;font-weight:600;" data-edit="page.serviceNumber_${i}">${String(i + 1).padStart(2, "0")}</p>
              <h3 style="font-family:'${hf}',sans-serif;font-size:22px;color:${headingColor};margin:0 0 12px;font-weight:500;">${t || ""}</h3>
              <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ts};line-height:1.6;margin:0;">${d || ""}</p>
            </div>`; }).join("")}
          </div>
        </section>`;
      }

      // SERIF STACK — huge serif numbers stacked above (Magazine, Lifestyle)
      if (v === "serif-stack") {
        return `<section style="background:${pc};padding:clamp(60px,10vw,120px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};text-align:center;">
          <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.sectionEyebrow">${eyebrow}</p>
          <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,5vw,${layout.sectionHeading}px);color:${headingColor};margin:0 0 72px;font-weight:400;font-style:italic;" data-edit="page.servicesHeading">${heading}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:48px;">
            ${items.map((line, i) => { const [t, d] = line.split("|"); return `<div>
              <p style="font-family:'${hf}',serif;font-size:64px;color:${ac};margin:0 0 24px;font-weight:400;line-height:1;">${String(i + 1).padStart(2, "0")}</p>
              <h3 style="font-family:'${hf}',serif;font-size:22px;color:${headingColor};margin:0 0 12px;font-weight:400;">${t || ""}</h3>
              <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ts};line-height:1.7;margin:0;">${d || ""}</p>
            </div>`; }).join("")}
          </div>
        </section>`;
      }

      // DEFAULT — grid numbered (Editorial Minimal, Studio Portfolio)
      return `<section style="background:${pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;" data-edit="page.servicesEyebrow">${page.servicesEyebrow || eyebrow}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(36px,5vw,${layout.sectionHeading}px);color:${headingColor};margin:0 0 80px;font-weight:400;" data-edit="page.servicesHeading">${heading}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1px;background:${bdr};border:1px solid ${bdr};">
          ${items.map((line, i) => { const [t, d] = line.split("|"); return `<div style="background:${pc};padding:48px 36px;">
            <p style="font-family:'${hf}',serif;font-size:14px;color:${ac};margin:0 0 24px;letter-spacing:.05em;">${String(i + 1).padStart(2, "0")}</p>
            <h3 style="font-family:'${hf}',serif;font-size:24px;color:${headingColor};margin:0 0 16px;font-weight:400;">${t || ""}</h3>
            <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ts};line-height:1.7;margin:0;">${d || ""}</p>
          </div>`; }).join("")}
        </div>
      </section>`;
    }

    if (s === "Process") {
      const items = (page.process || "").split("\n").filter(Boolean);
      return `<section style="background:${card};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p data-edit="page.processEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;">${page.processEyebrow || "How We Work"}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 80px;font-weight:400;" data-edit="page.processHeading">${page.processHeading || "The process."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:40px;">
          ${items.map((line, i) => { const [t, d] = line.split("|"); return `<div style="border-top:2px solid ${ac};padding-top:24px;">
            <p style="font-family:'${hf}',serif;font-size:14px;color:${ac};margin:0 0 16px;letter-spacing:.05em;">Step ${String(i + 1).padStart(2, "0")}</p>
            <h3 style="font-family:'${hf}',serif;font-size:22px;color:${headingColor};margin:0 0 12px;font-weight:400;">${t || ""}</h3>
            <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ts};line-height:1.7;margin:0;">${d || ""}</p>
          </div>`; }).join("")}
        </div>
      </section>`;
    }

    if (s === "Team") {
      const items = (page.team || "").split("\n").filter(Boolean);
      return `<section style="background:${pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p data-edit="page.teamEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;">${page.teamEyebrow || "The Team"}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 80px;font-weight:400;" data-edit="page.teamHeading">${page.teamHeading || "People who make it happen."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:40px;">
          ${items.map((line, i) => {
            const [n, role, img] = line.split("|");
            const teamImg = imgOrPlaceholder(img, `${brand.name}-team-${n}-${i}`, 600, 750, "portrait");
            return `<div>
              <div style="aspect-ratio:4/5;background:url('${teamImg}') center/cover no-repeat;margin:0 0 16px;"></div>
              <h3 style="font-family:'${hf}',serif;font-size:20px;color:${headingColor};margin:0 0 4px;font-weight:400;">${n || ""}</h3>
              <p style="font-family:'${bf}',sans-serif;font-size:12px;color:${ac};letter-spacing:.1em;text-transform:uppercase;margin:0;">${role || ""}</p>
            </div>`;
          }).join("")}
        </div>
      </section>`;
    }

    if (s === "Clients") {
      const items = (brand.clientLogos || "").split("\n").filter(Boolean);
      return `<section style="background:${card};padding:clamp(60px,10vw,120px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};text-align:center;">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 40px;" data-edit="page.clientsEyebrow">${page.clientsEyebrow || "Trusted By"}</p>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:48px 64px;max-width:1100px;margin:0 auto;">
          ${items.map(c => `<div style="font-family:'${hf}',serif;font-size:24px;color:${headingColor};opacity:.6;letter-spacing:.02em;">${c}</div>`).join("")}
        </div>
      </section>`;
    }

    if (s === "Blog") {
      const items = (page.blog || "").split("\n").filter(Boolean);
      return `<section style="background:${pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p data-edit="page.blogEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;">${page.blogEyebrow || "Journal"}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 80px;font-weight:400;" data-edit="page.blogHeading">${page.blogHeading || "Recent posts."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;">
          ${items.map((line, i) => {
            const [title, cat, meta] = line.split("|");
            const postImg = imgOrPlaceholder("", `${brand.name}-blog-${i}`, 800, 500, brand.imageCategory);
            return `<article>
              <div style="aspect-ratio:16/10;background:url('${postImg}') center/cover no-repeat;margin:0 0 20px;"></div>
              <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};letter-spacing:.15em;text-transform:uppercase;margin:0 0 12px;">${cat || ""}</p>
              <h3 style="font-family:'${hf}',serif;font-size:22px;color:${headingColor};margin:0 0 12px;font-weight:400;line-height:1.3;">${title || ""}</h3>
              <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};margin:0;">${meta || ""}</p>
            </article>`;
          }).join("")}
        </div>
      </section>`;
    }

    if (s === "Portfolio") {
      const items = (page.portfolio || "").split("\n").filter(Boolean);
      return `<section style="background:${card};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin:0 0 60px;flex-wrap:wrap;gap:24px;">
          <div><p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.portfolioEyebrow">${page.portfolioEyebrow || "Selected Work"}</p>
          <h2 data-edit="page.portfolioHeading" style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0;font-weight:400;">${page.portfolioHeading || "Recent projects."}</h2></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;">
          ${items.map((line, i) => {
            const [t, c, img] = line.split("|");
            const portImg = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 800, 1000, brand.imageCategory);
            return `<div>
              <div style="aspect-ratio:4/5;background:url('${portImg}') center/cover no-repeat;margin:0 0 20px;"></div>
              <h3 style="font-family:'${hf}',serif;font-size:22px;color:${headingColor};margin:0 0 6px;font-weight:400;">${t || ""}</h3>
              <p style="font-family:'${bf}',sans-serif;font-size:12px;color:${ac};letter-spacing:.1em;text-transform:uppercase;margin:0;">${c || ""}</p>
            </div>`;
          }).join("")}
        </div>
      </section>`;
    }

    if (s === "Stats") {
      const items = (page.stats || "").split("\n").filter(Boolean);
      return `<section style="background:${pc};padding:clamp(60px,10vw,120px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:48px;">
          ${items.map(line => { const [n, suf, lab] = line.split("|"); return `<div>
            <p style="font-family:'${hf}',serif;font-size:clamp(48px,5vw,72px);color:${ac};margin:0;font-weight:400;line-height:1;">${n || ""}${suf || ""}</p>
            <p style="font-family:'${bf}',sans-serif;font-size:12px;color:${ts};margin:12px 0 0;letter-spacing:.1em;text-transform:uppercase;">${lab || ""}</p>
          </div>`; }).join("")}
        </div>
      </section>`;
    }

    if (s === "Pricing") {
      const items = (page.pricing || "").split("\n").filter(Boolean);
      return `<section style="background:${card};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};text-align:center;">
        <p data-edit="page.pricingEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;">${page.pricingEyebrow || "Pricing"}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(36px,5vw,64px);color:${headingColor};margin:0 0 80px;font-weight:400;" data-edit="page.pricingHeading">${page.pricingHeading || "Investment."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1100px;margin:0 auto;">
          ${items.map(line => { const [tier, price, desc] = line.split("|"); return `<div style="background:${pc};padding:48px 32px;border:1px solid ${bdr};">
            <h3 style="font-family:'${hf}',serif;font-size:22px;color:${headingColor};margin:0 0 16px;font-weight:400;">${tier || ""}</h3>
            <p style="font-family:'${hf}',serif;font-size:40px;color:${ac};margin:0 0 24px;font-weight:400;">${price || ""}</p>
            <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ts};line-height:1.7;margin:0 0 32px;">${desc || ""}</p>
            <a href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#fff;background:${ac};padding:14px 28px;text-decoration:none;display:inline-block;">${brand.cta1}</a>
          </div>`; }).join("")}
        </div>
      </section>`;
    }

    if (s === "Testimonials") {
      const items = (page.testimonials || "").split("\n").filter(Boolean);
      return `<section style="background:${pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p data-edit="page.testimonialsEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 60px;">${page.testimonialsEyebrow || "Kind Words"}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:64px;">
          ${items.map(line => { const [q, n, r] = line.split("|"); return `<div>
            <p style="font-family:'${hf}',serif;font-size:clamp(22px,2vw,28px);color:${headingColor};line-height:1.5;font-weight:400;margin:0 0 32px;">${q || ""}</p>
            <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ac};margin:0;letter-spacing:.05em;">— ${n || ""}, <span style="color:${ts};">${r || ""}</span></p>
          </div>`; }).join("")}
        </div>
      </section>`;
    }

    if (s === "FAQ") {
      const items = (page.faq || "").split("\n").filter(Boolean);
      return `<section style="background:${card};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p data-edit="page.faqEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;">${page.faqEyebrow || "FAQ"}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 60px;font-weight:400;" data-edit="page.faqHeading">${page.faqHeading || "Questions, answered."}</h2>
        <div>${items.map(line => { const [q, a] = line.split("|"); return `<details style="border-bottom:1px solid ${bdr};padding:24px 0;"><summary style="font-family:'${hf}',serif;font-size:20px;color:${headingColor};cursor:pointer;font-weight:400;list-style:none;">${q || ""}</summary><p style="font-family:'${bf}',sans-serif;font-size:15px;color:${ts};line-height:1.8;margin:16px 0 0;">${a || ""}</p></details>`; }).join("")}</div>
      </section>`;
    }

    if (s === "Social" && brand.showSocialInPage) {
      return `<section style="background:${pc};padding:clamp(60px,10vw,100px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};text-align:center;">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 32px;" data-edit="page.socialEyebrow">${page.socialEyebrow || "Follow Along"}</p>
        <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;">
          ${sl.map(s => SVG[s.key] ? `<a href="${s.url}" target="_blank" style="color:${ts};text-decoration:none;display:flex;flex-direction:column;align-items:center;gap:10px;">${SVG[s.key](ts, 28)}<span style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.1em;text-transform:uppercase;">${s.label}</span></a>` : "").join("")}
        </div>
      </section>`;
    }

    if (s === "Video") {
      return `<section style="background:${card};padding:clamp(40px,6vw,80px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <div style="aspect-ratio:16/9;background:${pc};display:flex;align-items:center;justify-content:center;color:${ts};font-family:'${bf}',sans-serif;font-size:14px;">Video Embed — ${page.videoUrl || "Add URL"}</div>
      </section>`;
    }

    if (s === "CTA") return `<section style="background:${ac};padding:clamp(80px,12vw,160px) clamp(24px,8vw,100px);text-align:center;">
      <h2 style="font-family:'${hf}',serif;font-size:clamp(36px,6vw,80px);color:#fff;margin:0 0 24px;font-weight:400;max-width:900px;margin-left:auto;margin-right:auto;line-height:1.1;">${page.ctaHeading || "Ready to make something worth seeing?"}</h2>
      <p style="font-family:'${bf}',sans-serif;font-size:17px;color:rgba(255,255,255,.85);margin:0 0 40px;">${brand.tagline || ""}</p>
      <a href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:${ac};background:#fff;padding:18px 40px;text-decoration:none;display:inline-block;">${brand.cta1}</a>
    </section>`;

    if (s === "Contact" || s === "Form") {
      const allForms = (page.forms || "").split("\n").filter(Boolean);
      return allForms.map(f => {
        const [title, fStr, cta] = f.split("|");
        const fields = (fStr || "Name,Email,Message").split(",").filter(Boolean);
        return `<section id="contact" style="background:${s === "Form" ? card : pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
          <div style="max-width:640px;">
            <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;" data-edit="page.contactEyebrow">${page.contactEyebrow || "Contact"}</p>
            <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 40px;font-weight:400;">${title || "Let's talk."}</h2>
            <form style="display:flex;flex-direction:column;gap:18px;">
              ${fields.map(fl => /message|details|notes/i.test(fl)
                ? `<textarea placeholder="${fl}" rows="5" style="background:transparent;border:none;border-bottom:1px solid ${bdr};padding:14px 0;color:${headingColor};font-family:'${bf}',sans-serif;font-size:15px;resize:vertical;outline:none;"></textarea>`
                : `<input placeholder="${fl}" style="background:transparent;border:none;border-bottom:1px solid ${bdr};padding:14px 0;color:${headingColor};font-family:'${bf}',sans-serif;font-size:15px;outline:none;"/>`).join("")}
              <button type="button" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:#fff;background:${ac};padding:16px 32px;border:none;cursor:pointer;margin-top:16px;align-self:flex-start;">${cta || "Send"}</button>
            </form>
          </div>
        </section>`;
      }).join("");
    }

    if (s === "Leadership") {
      const leaders = (page.leaders || "").split("\n").filter(Boolean);
      return leaders.map((line, idx) => {
        const [name, title, leaderImg, quote, bio] = line.split("|");
        const imgSrc = imgOrPlaceholder(leaderImg, `${brand.name}-leader-${name}-${idx}`, 700, 900, "portrait");
        const bg = idx % 2 === 0 ? pc : card;
        const imageOnLeft = idx % 2 === 0;
        const imgCol = `<div style="flex:0 0 40%;"><img src="${imgSrc}" alt="${name || ""}" style="width:100%;height:auto;display:block;"/></div>`;
        const txtCol = `<div style="flex:1;">
          <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.leadershipEyebrow">${page.leadershipEyebrow || "Leadership"}</p>
          <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,56px);color:${headingColor};margin:0 0 8px;font-weight:400;line-height:1.15;">${name || "Leader"}</h2>
          <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ac};margin:0 0 32px;">${title || "Title"}</p>
          ${quote ? `<h4 style="font-family:'${hf}',serif;font-size:clamp(20px,2.5vw,24px);color:${headingColor};margin:0 0 28px;font-weight:400;line-height:1.4;font-style:italic;">"${quote}"</h4>` : ""}
          ${bio ? `<p style="font-family:'${bf}',sans-serif;font-size:16px;color:${ts};margin:0;line-height:1.7;">${bio}</p>` : ""}
        </div>`;
        return `<section style="background:${bg};padding:clamp(60px,10vw,${layout.sectionPadding}px) clamp(24px,8vw,100px);">
          <div style="display:flex;gap:48px;align-items:center;flex-wrap:wrap;">
            ${imageOnLeft ? imgCol + txtCol : txtCol + imgCol}
          </div>
        </section>`;
      }).join("");
    }

    if (s === "Team Carousel") {
      const teamLines = (page.team || "").split("\n").filter(Boolean);
      const cards = teamLines.map((line, i) => {
        const [name, role, img] = line.split("|");
        const src = imgOrPlaceholder(img, `${brand.name}-team-${name}-${i}`, 600, 750, "portrait");
        return `<div style="min-width:0;">
          <img src="${src}" alt="${name || ""}" style="width:100%;aspect-ratio:4/5;object-fit:cover;display:block;"/>
          <p style="font-family:'${bf}',sans-serif;font-size:12px;letter-spacing:.15em;text-transform:uppercase;color:${headingColor};margin:16px 0 4px;">${name || ""}</p>
          <p style="font-family:'${bf}',sans-serif;font-size:12px;color:${ac};margin:0;">${role || ""}</p>
        </div>`;
      }).join("");
      return `<section style="background:${pc};padding:clamp(60px,10vw,${layout.sectionPadding}px) clamp(24px,8vw,100px);">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.teamEyebrow">${page.teamEyebrow || "The Team"}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,${layout.sectionHeading}px);color:${headingColor};margin:0 0 48px;font-weight:400;" data-edit="page.teamHeading">${page.teamHeading || "People who make it happen."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;">${cards}</div>
      </section>`;
    }

    if (s === "Portfolio Carousel") {
      const portLines = (page.portfolio || "").split("\n").filter(Boolean);
      const cards = portLines.map((line, i) => {
        const [title, cat, img] = line.split("|");
        const src = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 1000, 750, brand.imageCategory);
        return `<div style="min-width:0;">
          <img src="${src}" alt="${title || ""}" style="width:100%;aspect-ratio:4/3;object-fit:cover;display:block;"/>
          <h3 style="font-family:'${hf}',serif;font-size:20px;color:${headingColor};margin:16px 0 4px;font-weight:500;">${title || ""}</h3>
          <p style="font-family:'${bf}',sans-serif;font-size:12px;color:${ac};margin:0;">${cat || ""}</p>
        </div>`;
      }).join("");
      return `<section style="background:${card};padding:clamp(60px,10vw,${layout.sectionPadding}px) clamp(24px,8vw,100px);">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.portfolioEyebrow">${page.portfolioEyebrow || "Selected Work"}</p>
        <h2 data-edit="page.portfolioHeading" style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,${layout.sectionHeading}px);color:${headingColor};margin:0 0 48px;font-weight:400;">${page.portfolioHeading || "Recent projects."}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">${cards}</div>
      </section>`;
    }

    if (s === "Logo Carousel") {
      const clientNames = (brand.clientLogos || "").split("\n").filter(Boolean);
      const logos = clientNames.map((name) =>
        `<div style="flex:0 0 auto;padding:0 32px;font-family:'${hf}',serif;font-size:22px;color:${headingColor};opacity:0.55;white-space:nowrap;">${name}</div>`
      ).join("");
      return `<section style="background:${card};padding:clamp(40px,6vw,80px) 0;overflow:hidden;">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 24px;text-align:center;" data-edit="page.clientsEyebrow">${page.clientsEyebrow || "Trusted By"}</p>
        <div style="display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;">${logos}</div>
      </section>`;
    }

    if (s === "Marquee") {
      const text = brand.marqueeText || page.marqueeText || "We put creative at the center of everything we do";
      const cid = "mp" + Math.random().toString(36).slice(2, 9);
      const item = `<span class="${cid}-i">${text}</span><span class="${cid}-d">●</span>`;
      const items = Array(8).fill(item).join("");
      return `<style>
.${cid}-wrap { background: ${pc}; overflow: hidden; padding: 28px 0; }
.${cid}-track { display: flex; width: max-content; animation: ${cid}-scroll 40s linear infinite; }
.${cid}-i { font-family: '${hf}', sans-serif; font-size: clamp(20px, 3.5vw, 42px); font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: ${headingColor}; padding: 0 32px; white-space: nowrap; flex-shrink: 0; }
.${cid}-d { font-size: clamp(20px, 3.5vw, 42px); color: ${ac}; padding: 0 6px; flex-shrink: 0; }
@keyframes ${cid}-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
</style>
<section class="${cid}-wrap"><div class="${cid}-track">${items}${items}</div></section>`;
    }

    if (s === "Promo Banner") {
      const bg = isDark ? ac : "#0a0a0a";
      const fg = isDark && bg === ac ? (luminance(ac) > 0.6 ? "#0a0a0a" : "#fff") : "#ffffff";
      const text = brand.promoBanner || page.promoBanner || "FREE SHIPPING ON ORDERS OVER $75  ·  EASY 30-DAY RETURNS";
      return `<section style="background:${bg};padding:12px 16px;text-align:center;">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${fg};margin:0;font-weight:600;">${text}</p>
      </section>`;
    }

    if (s === "Service Cards") {
      const items = (page.services || "").split("\n").filter(Boolean);
      const cards = items.map((line) => {
        const [title, desc] = line.split("|");
        return `<div style="background:${pc};border-radius:8px;padding:36px 32px;">
          <h3 style="font-family:'${hf}',serif;font-size:22px;color:${headingColor};margin:0 0 12px;font-weight:500;">${title || "Service"}</h3>
          <p style="font-family:'${bf}',sans-serif;font-size:15px;color:${ts};margin:0;line-height:1.6;">${desc || ""}</p>
        </div>`;
      }).join("");
      const eyebrow = page.servicesEyebrow || "Services";
      const heading = page.servicesHeading || "Our services.";
      return `<section style="background:${card};padding:clamp(60px,10vw,100px) clamp(24px,8vw,100px);">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 16px;" data-edit="page.sectionEyebrow">${eyebrow}</p>
        <h2 style="font-family:'${hf}',serif;font-size:clamp(32px,4vw,48px);color:${headingColor};margin:0 0 48px;font-weight:400;" data-edit="page.servicesHeading">${heading}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px;">${cards}</div>
      </section>`;
    }

    return "";
  };

  const footer = (() => {
    const fs = brand.footerStyle;
    const footerSocial = brand.showSocialInFooter ? sl.map(s => SVG[s.key] ? `<a href="${s.url}" target="_blank" style="color:${ts};display:inline-flex;margin:0 10px;">${SVG[s.key](ts, 20)}</a>` : "").join("") : "";
    if (fs === "Editorial") {
      return `<footer style="background:${card};padding:80px clamp(24px,8vw,100px) 40px;border-top:1px solid ${bdr};text-align:center;">
        <div style="margin:0 0 12px;">${logoHTML(28, "center")}</div>
        <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};margin:0 0 24px;">${brand.tagline || ""}</p>
        <div style="margin:0 0 24px;">${footerSocial}</div>
        <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ts};margin:0;">© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
      </footer>`;
    }
    if (fs === "Studio") {
      return `<footer style="background:${card};padding:80px clamp(24px,8vw,100px) 40px;border-top:1px solid ${bdr};text-align:center;">
        <div style="margin:0 0 24px;">${logoHTML(28, "center")}</div>
        <nav style="margin:0 0 24px;">${(brand.primaryMenu || "").split(",").map(m => `<a href="#" style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};text-decoration:none;margin:0 16px;">${m.trim()}</a>`).join("")}</nav>
        <div style="margin:0 0 24px;">${footerSocial}</div>
        <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ts};margin:0;">© ${new Date().getFullYear()} ${brand.name}</p>
      </footer>`;
    }
    if (fs === "Agency") {
      return `<footer style="background:${card};padding:80px clamp(24px,8vw,100px) 40px;border-top:1px solid ${bdr};">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:48px;margin:0 0 48px;">
          <div>
            <div style="margin:0 0 12px;">${logoHTML(24, "left")}</div>
            <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};margin:0 0 16px;line-height:1.7;">${brand.tagline || ""}</p>
            <div>${footerSocial}</div>
          </div>
          <div>
            <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};letter-spacing:.2em;text-transform:uppercase;margin:0 0 16px;">Pages</p>
            ${(brand.primaryMenu || "").split(",").map(m => `<a href="#" style="display:block;font-family:'${bf}',sans-serif;font-size:13px;color:${ts};text-decoration:none;margin:0 0 10px;">${m.trim()}</a>`).join("")}
          </div>
          <div>
            <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};letter-spacing:.2em;text-transform:uppercase;margin:0 0 16px;">Contact</p>
            <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};margin:0 0 10px;">${brand.contactEmail || ""}</p>
            <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};margin:0;">${brand.contactPhone || ""}</p>
          </div>
        </div>
        <div style="border-top:1px solid ${bdr};padding-top:32px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;">
          <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ts};margin:0;">© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
          <nav>${(brand.utilityMenu || "").split(",").map(m => `<a href="#" style="font-family:'${bf}',sans-serif;font-size:11px;color:${ts};text-decoration:none;margin:0 0 0 24px;">${m.trim()}</a>`).join("")}</nav>
        </div>
      </footer>`;
    }
    // Premium
    return `<footer style="background:${card};padding:100px clamp(24px,8vw,100px) 40px;border-top:1px solid ${bdr};">
      <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:48px;margin:0 0 64px;" class="footer-grid">
        <div>
          <div style="margin:0 0 16px;">${logoHTML(28, "left")}</div>
          <p style="font-family:'${bf}',sans-serif;font-size:14px;color:${ts};margin:0 0 20px;line-height:1.7;">${brand.tagline || ""}</p>
          <p style="font-family:'${bf}',sans-serif;font-size:13px;color:${ts};margin:0 0 16px;">${brand.contactEmail || ""}</p>
          <div>${footerSocial}</div>
        </div>
        <div>
          <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};letter-spacing:.2em;text-transform:uppercase;margin:0 0 20px;">Pages</p>
          ${(brand.primaryMenu || "").split(",").map(m => `<a href="#" style="display:block;font-family:'${bf}',sans-serif;font-size:13px;color:${ts};text-decoration:none;margin:0 0 12px;">${m.trim()}</a>`).join("")}
        </div>
        <div>
          <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};letter-spacing:.2em;text-transform:uppercase;margin:0 0 20px;">Services</p>
          ${((page.services || "").split("\n").slice(0, 5).map(l => l.split("|")[0])).map(m => `<a href="#" style="display:block;font-family:'${bf}',sans-serif;font-size:13px;color:${ts};text-decoration:none;margin:0 0 12px;">${m}</a>`).join("")}
        </div>
        <div>
          <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};letter-spacing:.2em;text-transform:uppercase;margin:0 0 20px;">Follow</p>
          ${sl.map(s => `<a href="${s.url}" target="_blank" style="display:flex;align-items:center;gap:10px;font-family:'${bf}',sans-serif;font-size:13px;color:${ts};text-decoration:none;margin:0 0 12px;">${SVG[s.key] ? SVG[s.key](ts, 16) : ""}<span>${s.label}</span></a>`).join("")}
        </div>
      </div>
      <div style="border-top:1px solid ${bdr};padding-top:32px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ts};margin:0;">© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
        <nav>${(brand.utilityMenu || "").split(",").map(m => `<a href="#" style="font-family:'${bf}',sans-serif;font-size:11px;color:${ts};text-decoration:none;margin:0 0 0 24px;">${m.trim()}</a>`).join("")}</nav>
      </div>
    </footer>`;
  })();

  // Always-on nav
  const navLinks = (brand.primaryMenu || "").split(",").map(m => `<a href="#" style="font-family:'${bf}',sans-serif;font-size:12px;color:${headingColor};text-decoration:none;margin:0 0 0 28px;letter-spacing:.05em;">${m.trim()}</a>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(hf).replace(/%20/g, "+")}&family=${encodeURIComponent(bf).replace(/%20/g, "+")}:wght@400;500&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:${pc};color:${ts};font-family:'${bf}',sans-serif;}
      @media(max-width:768px){.footer-grid{grid-template-columns:1fr !important;}.about-grid{grid-template-columns:1fr !important;gap:40px !important;}}
      /* Inline editing affordances */
      [data-edit]{position:relative;cursor:text;transition:outline 0.15s, background 0.15s;outline:1px dashed transparent;outline-offset:6px;border-radius:2px;}
      [data-edit]:hover{outline:1px dashed rgba(124,58,237,0.6);background:rgba(124,58,237,0.04);}
      [data-edit]:focus{outline:2px solid rgba(124,58,237,0.9);background:rgba(124,58,237,0.06);}
      [data-edit]:focus::before{content:attr(data-edit);position:absolute;top:-22px;left:0;background:#7c3aed;color:#fff;font-family:system-ui,sans-serif;font-size:9px;padding:3px 7px;border-radius:3px;letter-spacing:0.05em;text-transform:uppercase;font-weight:600;font-style:normal;pointer-events:none;}
      [data-edit-toast]{position:fixed;bottom:20px;right:20px;background:#0a0a14;color:#fff;padding:10px 16px;border-radius:6px;font-family:system-ui,sans-serif;font-size:12px;border:1px solid #7c3aed;box-shadow:0 4px 16px rgba(0,0,0,0.4);z-index:9999;opacity:0;transition:opacity 0.2s;pointer-events:none;}
      [data-edit-toast].show{opacity:1;}
    </style>
    </head><body>
    <nav style="position:sticky;top:0;background:${pc}f5;backdrop-filter:blur(10px);padding:20px clamp(24px,8vw,100px);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${bdr};z-index:100;">
      <a href="#" style="text-decoration:none;display:inline-flex;align-items:center;">${logoHTML(18, "left")}</a>
      <div style="display:flex;align-items:center;">${navLinks}${navSocial}</div>
    </nav>
    ${page.sections.map(section).join("")}
    ${footer}
    <div id="edit-toast" data-edit-toast>✓ Saved</div>
    <script>
      // Inline editing: contentEditable + postMessage on blur back to parent App
      (function() {
        const toast = document.getElementById('edit-toast');
        const showToast = (msg) => {
          if (!toast) return;
          toast.textContent = msg;
          toast.classList.add('show');
          clearTimeout(toast._t);
          toast._t = setTimeout(() => toast.classList.remove('show'), 1400);
        };
        document.querySelectorAll('[data-edit]').forEach(el => {
          el.contentEditable = 'true';
          el.spellcheck = true;
          el.addEventListener('keydown', e => {
            // Prevent Enter from creating new paragraphs inside headings/buttons
            if (e.key === 'Enter' && (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'A' || el.tagName === 'P' && el.style.textTransform === 'uppercase')) {
              e.preventDefault();
              el.blur();
            }
          });
          el.addEventListener('blur', () => {
            const field = el.getAttribute('data-edit');
            const value = (el.innerText || '').trim();
            if (!field) return;
            window.parent.postMessage({ type: 'preview-edit', field, value }, '*');
            showToast('✓ Saved to ' + field.split('.').pop());
          });
          // Prevent clicks on buttons from navigating
          if (el.tagName === 'A') {
            el.addEventListener('click', e => { e.preventDefault(); });
          }
        });
      })();
    </script>
    </body></html>`;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────────────────────────────────────

// Section wrapper — kept at module scope so React doesn't remount its children
// on every state change (would otherwise reset scroll position on each click).
// Accepts id so the audit can scroll to and flash-highlight a specific section.
const Section = ({ title, icon, id, children }) => (
  <div id={id} style={{ marginBottom: "28px", padding: "8px", borderRadius: "8px", transition: "background 0.4s, box-shadow 0.4s" }}>
    <div style={{ fontSize: "12px", color: "#000000", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "16px" }}>
      {title}
    </div>
    <div style={{ display: "grid", gap: "16px" }}>{children}</div>
  </div>
);

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [view, setView] = useState("projects"); // projects | editor | preview
  const [tab, setTab] = useState("discovery");
  const [pageIdx, setPageIdx] = useState(0);
  const [showAudit, setShowAudit] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [exportFormat, setExportFormat] = useState("elementor"); // "elementor" or "divi"
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState(null); // null | { heroHeading, heroSubhead, aboutHeading, aboutBody, cta1, cta2, tagline, keyMessages }
  const [aiError, setAiError] = useState("");
  const [aiFieldRegen, setAiFieldRegen] = useState(""); // name of field currently being regenerated (e.g. "tagline"), or "" if none

  // AI Site Brief — projects view "Describe your site" feature
  const [briefText, setBriefText] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefRec, setBriefRec] = useState(null);
  const [briefError, setBriefError] = useState("");
  const [lockedTemplateId, setLockedTemplateId] = useState(""); // "" = let AI pick; otherwise force this template

  // Persistence — load projects from window.storage on mount, save on changes
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [showAdvancedColors, setShowAdvancedColors] = React.useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => { try { return window.localStorage.getItem("specWelcomeDone") === "1"; } catch(e) { return false; } });
  const [importMsg, setImportMsg] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // project id pending delete confirmation

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const result = await window.storage.get("projects");
          if (result && result.value && !cancelled) {
            const parsed = JSON.parse(result.value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Migration: ensure every project's brand has a goals array.
              // Older projects only have singular `goal` (string) — convert to array.
              parsed.forEach(p => {
                if (p.brand) {
                  if (!Array.isArray(p.brand.goals)) {
                    p.brand.goals = p.brand.goal ? [p.brand.goal] : [];
                  }
                }
                // Migration: "Clients" and "Contact" sections were merged into
                // "Logo Carousel" and "Form" respectively (they rendered identically).
                // De-dupe and rename any leftover instances.
                // Also renames legacy page types: Journal/Blog → Blog Index, Single Post → Blog Post.
                if (Array.isArray(p.pages)) {
                  p.pages.forEach(pg => {
                    if (Array.isArray(pg.sections)) {
                      pg.sections = pg.sections.map(s => s === "Clients" ? "Logo Carousel" : s === "Contact" ? "Form" : s);
                      // De-dupe in-order
                      pg.sections = pg.sections.filter((s, i, a) => a.indexOf(s) === i);
                    }
                    // Rename legacy page types
                    if (pg.pageType === "Journal / Blog") pg.pageType = "Blog Index";
                    if (pg.pageType === "Single Post") pg.pageType = "Blog Post";
                  });
                }
              });
              setProjects(parsed);
              setActiveId(parsed[0].id);
            }
          }
        }
      } catch (e) {
        // No saved data, key doesn't exist, or parse error — keep default EV_PROJECT
      } finally {
        if (!cancelled) setStorageLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Save projects to storage whenever they change (after initial load)
  useEffect(() => {
    if (!storageLoaded) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        if (typeof window !== "undefined" && window.storage && !cancelled) {
          await window.storage.set("projects", JSON.stringify(projects));
        }
      } catch (e) {
        // Storage write failed — fail silently, user can export to file as backup
      }
    }, 600); // debounce
    return () => { cancelled = true; clearTimeout(timer); };
  }, [projects, storageLoaded]);

  const project = projects.find(p => p.id === activeId) || projects[0];
  const brand = project ? project.brand : null;
  const page = project ? (project.pages[pageIdx] || project.pages[0]) : null;
  const audit = useMemo(() => project ? auditBrand(brand, project.pages) : [], [brand, project]);

  const updBrand = (k, v) => setProjects(ps => ps.map(p => p.id === activeId ? {
    ...p,
    brand: { ...p.brand, [k]: v },
    // When the business name changes, mirror it onto the project name so the
    // Projects page card label stays accurate (e.g. "Ben Papa Films" not "Untitled").
    ...(k === "name" ? { name: v || "Untitled" } : {}),
  } : p));
  const updPage = (k, v) => setProjects(ps => ps.map(p => p.id === activeId ? { ...p, pages: p.pages.map((pg, i) => i === pageIdx ? { ...pg, [k]: v } : pg) } : p));

  // Jump from an audit item to the exact section it refers to.
  // Switches tab, scrolls to the section, briefly highlights it.
  const goToSection = (tab, sectionId) => {
    if (tab) setTab(tab);
    setShowAudit(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.background = "rgba(124, 58, 237, 0.18)";
      el.style.boxShadow = "0 0 0 2px rgba(124, 58, 237, 0.6)";
      setTimeout(() => {
        el.style.background = "";
        el.style.boxShadow = "";
      }, 2200);
    }, 180);
  };

  // Listen for inline edits posted from the preview iframe.
  // Messages look like { type: 'preview-edit', field: 'page.heroHeading', value: 'New text' }
  // The field path tells us whether to update brand or the active page.
  useEffect(() => {
    const handler = (event) => {
      const data = event.data;
      if (!data || data.type !== "preview-edit" || typeof data.field !== "string") return;
      const [scope, key] = data.field.split(".");
      if (!scope || !key) return;
      const value = (data.value || "").trim();
      if (scope === "brand") {
        setProjects(ps => ps.map(p => p.id === activeId ? { ...p, brand: { ...p.brand, [key]: value } } : p));
      } else if (scope === "page") {
        setProjects(ps => ps.map(p => p.id === activeId ? { ...p, pages: p.pages.map((pg, i) => i === pageIdx ? { ...pg, [key]: value } : pg) } : p));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [activeId, pageIdx]);

  // Scroll to top whenever the tab changes — each tab is a workflow step, so users
  // should land at the top of the new section, not mid-scroll from the previous one.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [tab]);

  // AI COPY GENERATOR — calls Claude API to draft hero, about, CTAs based on Brand Brief.
  // Returns JSON we can preview in a modal, then accept or regenerate.
  const generateStarterCopy = async () => {
    setAiLoading(true);
    setAiError("");
    setAiDraft(null);
    try {
      const b = brand || {};
      const template = WEBSITE_TEMPLATES.find(t => t.id === b.templateId);
      const templateName = template ? template.name : "general business";
      // Combine multi-goal array OR singular goal field for prompt
      const goalsList = (b.goals && b.goals.length) ? b.goals.join(", ") : (b.goal || "");
      const systemPrompt = `You are a senior brand copywriter who writes for websites. You write tight, specific, on-brand copy — never generic or AI-sounding. You vary sentence rhythm and never lean on jargon. You write the way the brand would actually speak.

You return ONLY valid JSON matching this exact schema, no preamble or trailing prose:
{
  "tagline": "5-9 word tagline that captures the brand's promise. Punchy.",
  "heroHeading": "8-14 words. Declarative. Confident. Front-loads the primary keyword naturally if it fits.",
  "heroSubhead": "1 sentence, 15-25 words. Answers what + who + why-now. Avoids fluff.",
  "aboutHeading": "5-9 words. A pointed statement, not a label.",
  "aboutBody": "80-130 words. First person if it's a solo brand, otherwise 'we'. Includes specific facts (years, numbers, named clients/wins if known). Naturally uses at least one primary keyword. Reads like a human wrote it.",
  "cta1": "2-3 words. The primary action verb + object. E.g. 'Book a call', 'Get started', 'Shop now'.",
  "cta2": "2-3 words. The secondary action. E.g. 'View our work', 'See pricing'.",
  "keyMessages": "3-4 short phrases separated by periods. The pillars that should show up across the site."
}`;
      const userPrompt = `Write starter homepage copy for this brand:

Business: ${b.name || ""}
Industry: ${b.industry || templateName}
Template style: ${templateName}
Primary goals (the site should support ALL of these): ${goalsList}
Desired outcome: ${b.outcome || ""}
Primary keywords (work these in naturally where they fit): ${b.primaryKeywords || "(none specified)"}
Tone: ${b.tone || "professional but warm"}
Target audience: ${b.targetAudience || "(not specified)"}
${b.description ? `Existing description for context: ${b.description}` : ""}
${b.inspoUrls ? `Inspiration sites (the user loves the aesthetic of these — match the voice and rhythm): ${b.inspoUrls.replace(/\n/g, ", ")}` : ""}
${b.styleNotes ? `Style notes (specific aesthetic principles to honor): ${b.styleNotes}` : ""}
${b.clientLogos ? `Past clients / brands worked with (cite where natural, especially in About body): ${b.clientLogos.replace(/\n/g, ", ")}` : ""}
${b.founderName ? `Founder: ${b.founderName}${b.founderTitle ? `, ${b.founderTitle}` : ""}` : ""}

Important guardrails:
- Match the goals to the CTA verb: if bookings is among them, the primary CTA should be booking-oriented ("Book a call"). If e-commerce, shopping-oriented ("Shop now"). If lead gen, contact-oriented ("Get in touch"). If free trial, product-engagement ("Start free trial", "Try it free"). If account creation, sign-up-oriented ("Sign up", "Create your account"). If resource downloads, content-oriented ("Get the guide", "Download free"). If donations, giving-oriented ("Donate now"). Pick the CTA that serves the strongest goal — if multiple goals, the primary CTA should serve the highest-intent conversion.
- Work in primary keywords naturally — never stuff them.
- No clichés ("nestled in", "passion for", "unleash your potential", "your trusted partner", "we are dedicated to").
- Be specific. If you don't have a fact, write something concrete the brand can swap in (e.g. "Founded in 2015" not "established for years").
- Return ONLY the JSON object. No markdown fences, no explanation.`;

      // Timeout safety net — abort if API hangs for more than 30 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "x-api-key": "",
          "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      // Strip code fences if model added them despite instructions
      const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(clean);
      setAiDraft(parsed);
    } catch (e) {
      const msg = e.name === "AbortError"
        ? "Request timed out after 30 seconds. The AI service may be slow right now — try again."
        : `Couldn't draft copy: ${e.message}. Try again.`;
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // Regenerate a single field of the AI draft — keeps everything else intact.
  // Useful when the user likes most of the copy but wants a different CTA or tagline.
  const regenerateField = async (fieldName) => {
    if (!aiDraft) return;
    setAiFieldRegen(fieldName);
    const fieldLabels = {
      tagline: "Tagline (5-9 words, punchy)",
      heroHeading: "Hero Heading (8-14 words, declarative, confident)",
      heroSubhead: "Hero Subhead (1 sentence, 15-25 words, what + who + why-now)",
      aboutHeading: "About Heading (5-9 words, a pointed statement, not a label)",
      aboutBody: "About Body (80-130 words, first person or 'we', specific facts, naturally uses a primary keyword)",
      cta1: "Primary CTA (2-3 words, verb + object, e.g. 'Book a call', 'Get started', 'Shop now')",
      cta2: "Secondary CTA (2-3 words, e.g. 'View our work', 'See pricing')",
      keyMessages: "Key Messages (3-4 short phrases separated by periods, the brand's pillars)",
    };
    try {
      const b = brand || {};
      const template = WEBSITE_TEMPLATES.find(t => t.id === b.templateId);
      const templateName = template ? template.name : "general business";
      const goalsList = (b.goals && b.goals.length) ? b.goals.join(", ") : (b.goal || "");
      const systemPrompt = `You are a senior brand copywriter. You write tight, specific, on-brand copy — never generic or AI-sounding. Return ONLY the new value as plain text — no JSON, no quotes wrapping it, no explanation.`;
      const userPrompt = `Regenerate ONLY the ${fieldLabels[fieldName] || fieldName} for this brand. Write something noticeably different from the previous version. Keep the same tone and intent but try a fresh angle.

Brand context:
- Business: ${b.name || ""}
- Industry: ${b.industry || templateName}
- Template: ${templateName}
- Goals: ${goalsList}
- Outcome: ${b.outcome || ""}
- Keywords: ${b.primaryKeywords || "(none)"}
- Tone: ${b.tone || "professional but warm"}
- Audience: ${b.targetAudience || ""}

Previous version of ${fieldName} (the one to REPLACE — write something different):
"${aiDraft[fieldName] || ""}"

The other fields in the draft (for context — DON'T rewrite these, just match their voice):
${Object.keys(aiDraft).filter(k => k !== fieldName).map(k => `- ${k}: ${aiDraft[k]}`).join("\n")}

Return ONLY the new ${fieldName} value as plain text.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "x-api-key": "",
          "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 400,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      // Strip leading/trailing quotes if Claude wrapped the answer
      const clean = text.replace(/^["']|["']$/g, "").trim();
      setAiDraft(prev => ({ ...prev, [fieldName]: clean }));
    } catch (e) {
      // Silent fail — keep the existing value, show a brief flash via field state
      console.warn(`Couldn't regenerate ${fieldName}:`, e.message);
    } finally {
      setAiFieldRegen("");
    }
  };

  // Apply the AI draft to brand + active page
  const applyAiDraft = () => {
    if (!aiDraft) return;
    setProjects(ps => ps.map(p => p.id === activeId ? {
      ...p,
      brand: {
        ...p.brand,
        tagline: aiDraft.tagline || p.brand.tagline,
        keyMessages: aiDraft.keyMessages || p.brand.keyMessages,
        cta1: aiDraft.cta1 || p.brand.cta1,
        cta2: aiDraft.cta2 || p.brand.cta2,
      },
      pages: p.pages.map((pg, i) => i === pageIdx ? {
        ...pg,
        heroHeading: aiDraft.heroHeading || pg.heroHeading,
        heroSubhead: aiDraft.heroSubhead || pg.heroSubhead,
        aboutHeading: aiDraft.aboutHeading || pg.aboutHeading,
        aboutBody: aiDraft.aboutBody || pg.aboutBody,
      } : pg),
    } : p));
    setAiDraft(null);
    setTab("brand"); // Move to the next workflow step so they can see how copy looks with visual design
  };

  // AI Site Brief — describe your site, get template/layout/theme/colors/fonts/brief recommendations
  const describeMySite = async () => {
    if (!briefText.trim() && !lockedTemplateId) return;
    setBriefLoading(true);
    setBriefError("");
    setBriefRec(null);
    const templateList = WEBSITE_TEMPLATES.map(t => `${t.id} (${t.name} — ${t.industry})`).join("\n");
    const layoutList = LAYOUTS.map(l => `${l.id} (${l.name})`).join("\n");
    const themeList = THEMES.map(t => `${t.id} (${t.name} — ${t.mode})`).join("\n");
    const lockedTpl = lockedTemplateId ? WEBSITE_TEMPLATES.find(t => t.id === lockedTemplateId) : null;
    const systemPrompt = lockedTpl
      ? `The user has already chosen the "${lockedTpl.name}" template (id: ${lockedTpl.id}, industry: ${lockedTpl.industry}). DO NOT change the template. Recommend layout, palette, fonts, and brand brief that complement this template and fit the user's description.

Return ONLY a valid JSON object — no preamble, no markdown fences:
{
  "templateId": "${lockedTpl.id}",
  "templateReason": "1 short sentence explaining how this template fits the user's description",
  "layoutId": "from list below",
  "layoutReason": "1 short sentence",
  "themeId": "from list below OR null if customColors better",
  "customColors": null OR {"background":"#hex","accent":"#hex","text":"#hex","card":"#hex"},
  "themeReason": "1 short sentence",
  "headingFont": "Manrope|Inter|Playfair Display|Cormorant Garamond|Yeseva One|Italiana|Oswald|Space Mono|Fraunces",
  "bodyFont": "Inter|DM Sans|Lato|Manrope|Space Mono",
  "fontReason": "1 short sentence",
  "goals": ["array of 1-3 goals from this list — Lead Generation, Direct Sales / E-commerce, Bookings & Reservations, Awareness & Brand Building, Community & Newsletter Growth, Applications & Sign-ups, Donations & Fundraising"],
  "outcome": "1 specific sentence",
  "primaryKeywords": "5 comma-separated keywords",
  "tagline": "5-9 word tagline",
  "heroEyebrow": "2-4 word eyebrow",
  "projectName": "1-3 word project name"
}

Layouts:
${layoutList}

Themes (or use customColors if vibe doesn't match):
${themeList}

Rules: use customColors for unusual vibes (neon, earthy clay, navy+gold), serifs for editorial/wedding, sans for tech/agency, mono for indie/terminal. For goals, include EVERY goal the site naturally serves (an e-commerce site is usually Direct Sales + Newsletter Growth; a coaching site is Bookings + Lead Generation). Keep all reasons to ONE short sentence.`
      : `You recommend a website template, layout, palette, fonts, and brand brief from a user description.

Return ONLY a valid JSON object — no preamble, no markdown fences:
{
  "templateId": "from list below",
  "templateReason": "1 short sentence",
  "layoutId": "from list below",
  "layoutReason": "1 short sentence",
  "themeId": "from list below OR null if customColors better",
  "customColors": null OR {"background":"#hex","accent":"#hex","text":"#hex","card":"#hex"},
  "themeReason": "1 short sentence",
  "headingFont": "Manrope|Inter|Playfair Display|Cormorant Garamond|Yeseva One|Italiana|Oswald|Space Mono|Fraunces",
  "bodyFont": "Inter|DM Sans|Lato|Manrope|Space Mono",
  "fontReason": "1 short sentence",
  "goals": ["array of 1-3 goals from this list — Lead Generation, Direct Sales / E-commerce, Bookings & Reservations, Awareness & Brand Building, Community & Newsletter Growth, Applications & Sign-ups, Donations & Fundraising"],
  "outcome": "1 specific sentence",
  "primaryKeywords": "5 comma-separated keywords",
  "tagline": "5-9 word tagline",
  "heroEyebrow": "2-4 word eyebrow",
  "projectName": "1-3 word project name"
}

Templates:
${templateList}

Layouts:
${layoutList}

Themes (or use customColors if vibe doesn't match):
${themeList}

Rules: match template to niche, use customColors for unusual vibes (neon, earthy clay, navy+gold), serifs for editorial/wedding, sans for tech/agency, mono for indie/terminal. For goals, include EVERY goal the site naturally serves (an e-commerce site is usually Direct Sales + Newsletter Growth; a coaching site is Bookings + Lead Generation). Keep all reasons to ONE short sentence.`;
    // Pull in everything the user has already filled out, so the recommendation
    // is informed by their existing context — business info, brand brief,
    // inspiration URLs, brand assets. Empty fields are simply skipped.
    // When no project exists (empty state on Projects page), brand is null — use empty object.
    const b = brand || {};
    const ctx = [];
    if (b.name && b.name !== "Untitled" && b.name !== "Editorial Vibes" && b.name !== "New Project") ctx.push(`Existing business name: ${b.name}`);
    if (b.industry) ctx.push(`Industry: ${b.industry}`);
    if (b.tagline) ctx.push(`Current tagline: ${b.tagline}`);
    if (b.description) ctx.push(`Existing description: ${b.description}`);
    if (b.targetAudience) ctx.push(`Target audience: ${b.targetAudience}`);
    if (b.keyMessages) ctx.push(`Key messages: ${b.keyMessages}`);
    if (b.tone) ctx.push(`Tone: ${b.tone}`);
    if (b.goal) ctx.push(`Primary goal: ${b.goal}`);
    if (b.outcome) ctx.push(`Desired outcome: ${b.outcome}`);
    if (b.primaryKeywords) ctx.push(`Primary keywords already set: ${b.primaryKeywords}`);
    if (b.inspoUrls) ctx.push(`Inspiration sites (use these to infer aesthetic preferences): ${b.inspoUrls.replace(/\n/g, ", ")}`);
    if (b.styleNotes) ctx.push(`Style notes (concrete aesthetic principles to apply): ${b.styleNotes}`);
    if (b.clientLogos) ctx.push(`Client logos / past brands worked with: ${b.clientLogos.replace(/\n/g, ", ")}`);
    if (b.founderName) ctx.push(`Founder: ${b.founderName}${b.founderTitle ? `, ${b.founderTitle}` : ""}`);
    if (b.founderBio) ctx.push(`Founder bio: ${b.founderBio}`);
    const contextBlock = ctx.length
      ? `\n\nExisting context from this project (use it to refine your recommendation):\n${ctx.map(c => `- ${c}`).join("\n")}`
      : "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "x-api-key": "",
          "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 800,
          system: systemPrompt,
          messages: [{ role: "user", content: briefText.trim()
            ? `Describe of the site I want to build:\n\n${briefText}${contextBlock}`
            : `I've already chosen the ${lockedTpl?.name || "template"}. Give me your best recommendations for layout, colors, fonts, goal, outcome, keywords, tagline, hero eyebrow, and a clean project name that fits this template.${contextBlock}` }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
      const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      setBriefRec(JSON.parse(clean));
    } catch (e) {
      const msg = e.name === "AbortError"
        ? "Request timed out after 30 seconds. The AI service may be slow right now — try again."
        : `Couldn't analyze: ${e.message}. Try again or pick a template manually.`;
      setBriefError(msg);
    } finally {
      setBriefLoading(false);
    }
  };

  // Apply the AI brief recommendation — creates a new project from the suggestions
  const applyBriefRecommendation = () => {
    if (!briefRec) return;
    const r = briefRec;
    const template = WEBSITE_TEMPLATES.find(t => t.id === r.templateId);
    if (!template) { setBriefError("Recommended template not found. Try a manual start."); return; }
    // Start from BLANK_BRAND (no leftover EV content), then layer template, then layer AI overrides
    let brand = { ...BLANK_BRAND, name: r.projectName || "New Project", industry: briefText.slice(0, 80) };
    let page = newPage("Homepage", "Homepage");
    const applied = applyWebsiteTemplate(template, brand, page);
    brand = applied.brand;
    page = applied.page;
    // Layer the AI brief on top
    brand = {
      ...brand,
      layoutId: r.layoutId || brand.layoutId,
      headingFont: r.headingFont || brand.headingFont,
      bodyFont: r.bodyFont || brand.bodyFont,
      goals: Array.isArray(r.goals) && r.goals.length ? r.goals : (r.goal ? [r.goal] : (brand.goals || [])),
      goal: Array.isArray(r.goals) && r.goals.length ? r.goals[0] : (r.goal || brand.goal),
      outcome: r.outcome || brand.outcome,
      primaryKeywords: r.primaryKeywords || brand.primaryKeywords,
      tagline: r.tagline || brand.tagline,
    };
    // Apply custom colors if provided, else apply named theme
    if (r.customColors && r.customColors.background && r.customColors.accent) {
      const bc = r.customColors;
      const isDark = (() => {
        const h = bc.background.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
      })();
      brand = {
        ...brand,
        brandColors: bc,
        themeId: "custom-brand",
        themeMode: isDark ? "dark" : "light",
        primaryColor: bc.background,
        cardBgColor: bc.card || (isDark ? "#181818" : "#f5f5f5"),
        bodyTextColor: bc.text || (isDark ? "#a8a8a8" : "#4a4a4a"),
        borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
        accentColor: bc.accent,
      };
    } else if (r.themeId) {
      const theme = THEMES.find(t => t.id === r.themeId);
      if (theme) brand = applyTheme(theme, brand);
    }
    page = { ...page, heroEyebrow: r.heroEyebrow || page.heroEyebrow };
    const newId = `proj-${Date.now()}`;
    setProjects(ps => [...ps, { id: newId, name: brand.name, brand, pages: [page] }]);
    setActiveId(newId);
    setPageIdx(0);
    setBriefRec(null);
    setBriefText("");
    setView("editor");
  };

  // Apply the AI brief to the CURRENT active project (overwrites brand + active page)
  const applyBriefToCurrent = () => {
    if (!briefRec) return;
    const r = briefRec;
    const template = WEBSITE_TEMPLATES.find(t => t.id === r.templateId);
    if (!template) { setBriefError("Recommended template not found."); return; }
    setProjects(ps => ps.map(p => {
      if (p.id !== activeId) return p;
      // Apply template to current brand + current page
      let { brand: newBrand, page: newPage } = applyWebsiteTemplate(template, p.brand, p.pages[pageIdx]);
      // Layer the AI brief on top
      newBrand = {
        ...newBrand,
        layoutId: r.layoutId || newBrand.layoutId,
        headingFont: r.headingFont || newBrand.headingFont,
        bodyFont: r.bodyFont || newBrand.bodyFont,
        goals: Array.isArray(r.goals) && r.goals.length ? r.goals : (r.goal ? [r.goal] : (newBrand.goals || [])),
        goal: Array.isArray(r.goals) && r.goals.length ? r.goals[0] : (r.goal || newBrand.goal),
        outcome: r.outcome || newBrand.outcome,
        primaryKeywords: r.primaryKeywords || newBrand.primaryKeywords,
        tagline: r.tagline || newBrand.tagline,
      };
      // Apply custom colors if provided, else apply named theme
      if (r.customColors && r.customColors.background && r.customColors.accent) {
        const bc = r.customColors;
        const isDark = (() => {
          const h = bc.background.replace("#", "");
          const rr = parseInt(h.slice(0, 2), 16), gg = parseInt(h.slice(2, 4), 16), bb = parseInt(h.slice(4, 6), 16);
          return (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255 < 0.5;
        })();
        newBrand = {
          ...newBrand,
          brandColors: bc,
          themeId: "custom-brand",
          themeMode: isDark ? "dark" : "light",
          primaryColor: bc.background,
          cardBgColor: bc.card || (isDark ? "#181818" : "#f5f5f5"),
          bodyTextColor: bc.text || (isDark ? "#a8a8a8" : "#4a4a4a"),
          borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
          accentColor: bc.accent,
        };
      } else if (r.themeId) {
        const theme = THEMES.find(t => t.id === r.themeId);
        if (theme) newBrand = applyTheme(theme, newBrand);
      }
      newPage = { ...newPage, heroEyebrow: r.heroEyebrow || newPage.heroEyebrow };
      const newPages = p.pages.map((pg, i) => i === pageIdx ? newPage : pg);
      // Also update the project name if the AI suggested one (and the current project is still untitled/new)
      const shouldRename = r.projectName && (p.name === "Untitled" || p.name === "New Project" || !p.name);
      return { ...p, brand: { ...newBrand, ...(shouldRename ? { name: r.projectName } : {}) }, pages: newPages, ...(shouldRename ? { name: r.projectName } : {}) };
    }));
    setBriefRec(null);
    setBriefText("");
    setTab("brand"); // Send them to Brand tab to see what got applied
  };
  const toggleSection = (s) => updPage("sections", page.sections.includes(s) ? page.sections.filter(x => x !== s) : [...page.sections, s]);
  const addPage = (pageType = "Homepage") => {
    const np = newPage(pageType === "Homepage" ? `Page ${project.pages.length + 1}` : pageType, pageType);
    setProjects(ps => ps.map(p => p.id === activeId ? { ...p, pages: [...p.pages, np] } : p));
    setPageIdx(project.pages.length);
    setShowAddPage(false);
  };
  const delPage = (i) => { if (project.pages.length <= 1) return; setProjects(ps => ps.map(p => p.id === activeId ? { ...p, pages: p.pages.filter((_, x) => x !== i) } : p)); setPageIdx(0); };

  const addSocial = () => updBrand("socialLinks", [...(brand.socialLinks || []), { key: "instagram", label: "Instagram", url: "" }]);
  const updSocial = (i, k, v) => updBrand("socialLinks", brand.socialLinks.map((s, x) => x === i ? { ...s, [k]: v } : s));
  const delSocial = (i) => updBrand("socialLinks", brand.socialLinks.filter((_, x) => x !== i));

  const resetProject = (id) => {
  setProjects(ps => ps.map(p => p.id === id ? {
    ...p,
    name: "New Project",
    brand: { ...BLANK_BRAND },
    pages: [newPage()],
  } : p));
  setImportMsg("Project reset to blank.");
  setTimeout(() => setImportMsg(""), 3000);
};

  const newProject = () => {
    const id = uid();
    const np = { id, name: "New Project", brand: { ...BLANK_BRAND }, pages: [newPage()] };
    setProjects(ps => [...ps, np]);
    setActiveId(id);
    setView("editor");
    setPageIdx(0);
    setTab("discovery"); // Land on Discovery so they start by filling in the business info
  };

  // Duplicate an existing project — clones brand + pages with a fresh id
  const duplicateProject = (sourceId) => {
    const source = projects.find(p => p.id === sourceId);
    if (!source) return;
    const id = uid();
    // Deep clone via JSON to avoid shared refs in pages/brand
    const cloned = JSON.parse(JSON.stringify(source));
    cloned.id = id;
    cloned.name = `${source.name} (Copy)`;
    cloned.brand = { ...cloned.brand, name: cloned.name };
    setProjects(ps => [...ps, cloned]);
    setImportMsg(`Duplicated "${source.name}".`);
    setTimeout(() => setImportMsg(""), 3500);
  };

  // Delete a project — uses inline confirmation state (window.confirm is blocked in artifact sandbox)
  const deleteProject = (id) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    // If we deleted the active project, jump to another one (or to Projects view if none left)
    if (activeId === id) {
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        setView("projects"); // Empty state — Projects page shows + New / Import tiles
      }
    }
    setImportMsg(`Deleted "${target.name}".`);
    setTimeout(() => setImportMsg(""), 3500);
    setConfirmDeleteId(null);
  };

  // Export a project as a JSON backup file (re-importable)
  const exportProjectFile = (proj) => {
    const payload = {
      _format: "spec-project",
      _tool: "Spec",
      _version: 1,
      _exportedAt: new Date().toISOString(),
      project: proj,
    };
    const safeName = (proj.name || "project").replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
    download(`${safeName}_backup.json`, payload);
  };

  // Import a project JSON file — adds it as a new project (with new id to avoid collisions)
  const importProjectFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        // Accept two shapes: wrapped {project: {...}} or raw {id, name, brand, pages}
        const proj = parsed.project || parsed;
        if (!proj.brand || !Array.isArray(proj.pages)) {
          throw new Error("Doesn't look like a valid project file. Expected brand and pages fields.");
        }
        // Always assign a fresh id to avoid colliding with existing projects
        proj.id = uid();
        proj.name = proj.name ? `${proj.name} (Imported)` : "Imported Project";
        proj.brand = { ...proj.brand, name: proj.name };
        setProjects(ps => [...ps, proj]);
        setActiveId(proj.id);
        setImportMsg(`Imported "${proj.name}".`);
        setTimeout(() => setImportMsg(""), 4000);
        event.target.value = ""; // reset input so same file can be re-uploaded
      } catch (err) {
        setImportMsg(`Import failed: ${err.message}`);
        setTimeout(() => setImportMsg(""), 5000);
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      setImportMsg("Couldn't read the file.");
      setTimeout(() => setImportMsg(""), 4000);
    };
    reader.readAsText(file);
  };

  const download = (filename, data) => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      alert("Download blocked by browser sandbox. Try opening this in a new tab.\n\n" + err.message);
    }
  };

  const downloadPage = () => {
    const slug = `${brand.name.replace(/\s+/g, "-").toLowerCase()}-${page.name.replace(/\s+/g, "-").toLowerCase()}-${exportFormat}.json`;
    const data = exportFormat === "divi" ? buildDiviPage(page, brand) : buildPageJSON(page, brand);
    download(slug, data);
  };
  const downloadHeader = () => {
    const slug = `${brand.name.replace(/\s+/g, "-").toLowerCase()}-header-${exportFormat}.json`;
    // Note: Divi header support uses the same page builder approach
    const data = exportFormat === "divi" ? buildDiviPage({ name: "Header", sections: [] }, brand) : buildHeaderJSON(brand);
    download(slug, data);
  };
  const downloadFooter = () => {
    const slug = `${brand.name.replace(/\s+/g, "-").toLowerCase()}-footer-${exportFormat}.json`;
    const data = exportFormat === "divi" ? buildDiviFooter(brand) : buildFooterJSON(brand);
    download(slug, data);
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const I = {
    lbl: { display: "block", fontSize: "11px", color: "#000000", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 },
    inp: { width: "100%", padding: "11px 13px", background: "#ffffff", border: "1px solid #e5e7eb", color: "#000000", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", outline: "none", lineHeight: 1.5 },
    btn: { padding: "9px 16px", background: "#000000", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
    btnGhost: { padding: "9px 16px", background: "#ffffff", color: "#27272a", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ padding: "10px 16px", background: tab === id ? "#eeeeec" : "transparent", color: tab === id ? "#18181b" : "#71717a", border: "none", borderBottom: tab === id ? "2px solid #18181b" : "2px solid transparent", fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</button>
  );

  // Builder format toggle — applies to both Page and Footer downloads
  const FormatToggle = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "3px", marginRight: "4px" }}>
      <span style={{ fontSize: "10px", color: "#a3a39e", padding: "0 6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Export</span>
      <button onClick={() => setExportFormat("elementor")} style={{ padding: "5px 10px", background: exportFormat === "elementor" ? "#18181b" : "transparent", color: exportFormat === "elementor" ? "#ffffff" : "#71717a", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>Elementor</button>
      <button onClick={() => setExportFormat("divi")} style={{ padding: "5px 10px", background: exportFormat === "divi" ? "#18181b" : "transparent", color: exportFormat === "divi" ? "#ffffff" : "#71717a", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>Divi</button>
    </div>
  );

  // If there are no projects at all, force the Projects view (which has + New / Import tiles)

  const exportBrief = () => {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const layout = LAYOUTS ? LAYOUTS.find(l => l.id === brand.layoutId) : null;
    const theme = THEMES ? THEMES.find(t => t.id === brand.themeId) : null;
    const sl = brand.socialLinks || [];

    const section = (label, content) => content ? `
      <div class="section">
        <div class="section-label">${label}</div>
        ${content}
      </div>
      <hr class="divider">
    ` : "";

    const field = (label, value) => value ? `
      <div class="field">
        <div class="field-key">${label}</div>
        <div class="field-val">${value}</div>
      </div>
    ` : "";

    const copyBlock = (label, value) => value ? `
      <div class="copy-block">
        <div class="copy-label">${label}</div>
        <div class="copy-text">${value}</div>
      </div>
    ` : "";

    const pill = (text) => `<span class="pill">${text}</span>`;
    const chip = (text) => `<span class="chip">${text}</span>`;

    const pagesHTML = project.pages.filter(p => p.heroHeading || p.aboutBody || p.services).map(p => `
      <div class="page-block">
        <div class="page-name">${p.name}</div>
        <div class="chips">${(p.sections || []).map(chip).join("")}</div>
        ${p.heroHeading ? `<div class="page-copy"><span class="copy-label">Hero</span> ${p.heroHeading}</div>` : ""}
        ${p.heroSubhead ? `<div class="page-copy"><span class="copy-label">Subhead</span> ${p.heroSubhead}</div>` : ""}
        ${p.aboutBody ? `<div class="page-copy"><span class="copy-label">About</span> ${p.aboutBody}</div>` : ""}
      </div>
    `).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${brand.name} — Brand Brief</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:#18181b;background:#fff;padding:48px;max-width:800px;margin:0 auto}
  .doc-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:1px solid #e4e4e7;margin-bottom:32px}
  .brand-name{font-size:24px;font-weight:600;color:#09090b}
  .brand-desc{font-size:13px;color:#71717a;margin-top:4px}
  .doc-meta{font-size:11px;color:#a1a1aa;text-align:right;line-height:1.8}
  .spec-mark{font-size:11px;font-weight:600;color:#52525b;letter-spacing:.05em;text-transform:uppercase}
  .section{margin-bottom:28px}
  .section-label{font-size:10px;font-weight:600;color:#a1a1aa;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px}
  .divider{border:none;border-top:1px solid #f4f4f5;margin:0 0 28px}
  .field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .field{margin-bottom:12px}
  .field-key{font-size:11px;color:#71717a;margin-bottom:2px}
  .field-val{font-size:13px;color:#18181b;line-height:1.5}
  .pill-group{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
  .pill{font-size:11px;padding:3px 10px;border-radius:20px;background:#f4f4f5;color:#52525b;border:1px solid #e4e4e7}
  .copy-block{background:#fafafa;border-radius:6px;padding:12px 14px;margin-bottom:8px;border:1px solid #f4f4f5}
  .copy-label{font-size:10px;color:#a1a1aa;letter-spacing:.05em;text-transform:uppercase;margin-bottom:4px}
  .copy-text{font-size:13px;color:#18181b;line-height:1.6}
  .copy-text.large{font-size:15px;font-weight:500}
  .cta-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .color-swatch{display:flex;align-items:center;gap:8px}
  .swatch{width:18px;height:18px;border-radius:4px;border:1px solid #e4e4e7;flex-shrink:0}
  .page-block{border:1px solid #f4f4f5;border-radius:6px;padding:12px 14px;margin-bottom:8px}
  .page-name{font-size:13px;font-weight:500;color:#09090b;margin-bottom:8px}
  .chips{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
  .chip{font-size:10px;padding:2px 7px;border-radius:4px;background:#f4f4f5;color:#71717a;border:1px solid #e4e4e7}
  .page-copy{font-size:12px;color:#52525b;margin-top:6px;line-height:1.5}
  .page-copy .copy-label{display:inline;font-size:10px;color:#a1a1aa;letter-spacing:.05em;text-transform:uppercase;margin-right:6px;font-weight:600}
  .kw{font-size:13px;color:#18181b;line-height:1.9}
  .social-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
  .social-item{font-size:12px;color:#52525b;background:#fafafa;padding:3px 10px;border-radius:4px;border:1px solid #e4e4e7}
  .footer{padding-top:24px;border-top:1px solid #e4e4e7;display:flex;justify-content:space-between;align-items:center;margin-top:8px}
  .footer-text{font-size:10px;color:#a1a1aa}
  @media print{body{padding:32px}button{display:none}}
</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <div class="brand-name">${brand.name || "Unnamed Brand"}</div>
      <div class="brand-desc">${brand.description ? brand.description.substring(0, 100) + (brand.description.length > 100 ? "..." : "") : ""}</div>
    </div>
    <div class="doc-meta">
      <div class="spec-mark">Brand Brief</div>
      <div>${today}</div>
      <div>Generated by Spec</div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Brand Identity</div>
    <div class="field-grid">
      ${brand.primaryColor ? `<div class="field"><div class="field-key">Primary Color</div><div class="color-swatch"><div class="swatch" style="background:${brand.primaryColor}"></div><span class="field-val">${brand.primaryColor}</span></div></div>` : ""}
      ${brand.accentColor ? `<div class="field"><div class="field-key">Accent Color</div><div class="color-swatch"><div class="swatch" style="background:${brand.accentColor}"></div><span class="field-val">${brand.accentColor}</span></div></div>` : ""}
      ${brand.headingFont ? `<div class="field"><div class="field-key">Heading Font</div><div class="field-val">${brand.headingFont}</div></div>` : ""}
      ${brand.bodyFont ? `<div class="field"><div class="field-key">Body Font</div><div class="field-val">${brand.bodyFont}</div></div>` : ""}
      ${layout ? `<div class="field"><div class="field-key">Layout Template</div><div class="field-val">${layout.name || brand.layoutId}</div></div>` : ""}
      ${theme ? `<div class="field"><div class="field-key">Theme</div><div class="field-val">${theme.name || brand.themeId}</div></div>` : ""}
      ${brand.logoUrl ? `<div class="field"><div class="field-key">Logo URL</div><div class="field-val" style="word-break:break-all;font-size:11px">${brand.logoUrl}</div></div>` : ""}
    </div>
  </div>
  <hr class="divider">

  <div class="section">
    <div class="section-label">Contact & Site Info</div>
    <div class="field-grid">
      ${field("Contact Email", brand.contactEmail)}
      ${field("Contact Phone", brand.contactPhone)}
      ${field("Site URL / Domain", brand.siteUrl)}
    </div>
    ${sl.length ? `<div class="field"><div class="field-key">Social Links</div><div class="social-row">${sl.map(s => `<span class="social-item">${s.label}: ${s.url}</span>`).join("")}</div></div>` : ""}
  </div>
  <hr class="divider">

  <div class="section">
    <div class="section-label">Goals & Strategy</div>
    ${(brand.goals || []).length ? `<div class="field"><div class="field-key">Primary Goals</div><div class="pill-group">${(brand.goals || []).map(pill).join("")}</div></div>` : ""}
    ${field("Desired Outcome", brand.desiredOutcome)}
    ${field("Target Audience", brand.targetAudience)}
    ${field("Tone", brand.tone)}
  </div>
  <hr class="divider">

  <div class="section">
    <div class="section-label">SEO & Messaging</div>
    ${brand.primaryKeywords ? `<div class="field"><div class="field-key">Primary Keywords</div><div class="kw">${brand.primaryKeywords.split(",").map(k => k.trim()).join(" · ")}</div></div>` : ""}
    ${brand.keyMessages ? `<div class="field" style="margin-top:12px"><div class="field-key">Key Messages</div><div class="field-val">${brand.keyMessages}</div></div>` : ""}
  </div>
  <hr class="divider">

  ${brand.inspoUrls ? `<div class="section"><div class="section-label">Inspiration</div>${field("Inspiration URLs", brand.inspoUrls)}${field("Style Notes", brand.styleNotes)}</div><hr class="divider">` : ""}

  <div class="section">
    <div class="section-label">Starter Copy</div>
    ${copyBlock("Tagline", brand.tagline)}
    ${project.pages[0] ? copyBlock("Hero Heading", project.pages[0].heroHeading) : ""}
    ${project.pages[0] ? copyBlock("Hero Subhead", project.pages[0].heroSubhead) : ""}
    ${project.pages[0] ? copyBlock("About", project.pages[0].aboutBody) : ""}
    <div class="cta-grid">
      ${copyBlock("Primary CTA", brand.cta1)}
      ${copyBlock("Secondary CTA", brand.cta2)}
    </div>
  </div>
  <hr class="divider">

  ${brand.clientLogos ? `<div class="section"><div class="section-label">Client / Brand List</div><div class="pill-group">${brand.clientLogos.split("\n").filter(Boolean).map(pill).join("")}</div></div><hr class="divider">` : ""}

  ${brand.primaryMenu ? `<div class="section"><div class="section-label">Navigation</div><div class="pill-group">${brand.primaryMenu.split(",").map(m => pill(m.trim())).join("")}</div></div><hr class="divider">` : ""}

  ${pagesHTML ? `<div class="section"><div class="section-label">Pages</div>${pagesHTML}</div><hr class="divider">` : ""}

  <div class="footer">
    <div class="footer-text">${brand.name} · Brand Brief · ${today}</div>
    <div class="footer-text">Generated by Spec · elementor-builder2.vercel.app</div>
  </div>

  <script>window.print();</script>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  };

  const effectiveView = projects.length === 0 ? "projects" : view;

  // ── PREVIEW VIEW ───────────────────────────────────────────────────────────

  if (!welcomeDismissed && projects.length === 0 && storageLoaded) return (
    <div style={{ minHeight: "100vh", background: "#fafaf9", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", color: "#09090b", marginBottom: "32px" }}>spec</div>
        <h1 style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 400, color: "#09090b", lineHeight: 1.1, marginBottom: "20px" }}>Build better websites,<br/>faster.</h1>
        <p style={{ fontSize: "15px", color: "#71717a", lineHeight: 1.7, marginBottom: "40px", maxWidth: "380px", margin: "0 auto 40px" }}>Plan, build, and export Elementor and Divi templates — with AI-drafted copy, brand briefs, and one-click template export.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <button onClick={() => { setWelcomeDismissed(true); newProject(); }} style={{ padding: "14px 32px", background: "#09090b", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer", width: "100%", maxWidth: "280px" }}>
            Start a Project
          </button>
          <button onClick={() => setWelcomeDismissed(true)} style={{ padding: "12px 32px", background: "transparent", color: "#71717a", border: "1px solid #e4e4e7", borderRadius: "8px", fontSize: "13px", cursor: "pointer", width: "100%", maxWidth: "280px" }}>
            Browse Projects Page
          </button>
        </div>
        
      </div>
    </div>
  );

  if (effectiveView === "preview" && project) return (
    <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", flexDirection: "column", zIndex: 1000 }}>
      <div style={{ padding: "10px 16px", background: "#18181b", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ color: "#ffffff", fontSize: "13px", fontWeight: 500 }}>
          Preview — {brand.name} / {page.name}
          <span style={{ marginLeft: "12px", fontSize: "11px", color: "#a3a39e", fontWeight: 400 }}>Click any heading or paragraph to edit inline</span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <FormatToggle />
          <button onClick={downloadPage} style={{ padding: "8px 14px", background: "#ffffff", color: "#18181b", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Download Template</button>
          <button onClick={downloadHeader} style={{ padding: "8px 14px", background: "transparent", color: "#ffffff", border: "1px solid #3f3f46", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Header Template</button>
          <button onClick={downloadFooter} style={{ padding: "8px 14px", background: "transparent", color: "#ffffff", border: "1px solid #3f3f46", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Footer Template</button>
          <button onClick={() => setView("editor")} style={{ padding: "8px 14px", background: "transparent", color: "#a3a39e", border: "1px solid #3f3f46", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>← Back to Editor</button>
        </div>
      </div>
      <iframe srcDoc={previewHTML(page, brand)} style={{ flex: 1, border: "none", width: "100%", background: "#000" }} title="Preview" sandbox="allow-same-origin allow-scripts" />
    </div>
  );

  // ── PROJECTS VIEW ──────────────────────────────────────────────────────────
  if (effectiveView === "projects") return (
    <div style={{ minHeight: "100vh", background: "#f5f5f4", color: "#18181b", padding: "clamp(20px,5vw,40px) clamp(12px,3vw,24px)", fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Yeseva+One&family=Manrope:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Oswald:wght@500;700&family=Space+Mono&family=Inter:wght@500;700&display=swap');
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; }
        @media(max-width:600px){
          input, textarea, select{font-size:16px !important;}
        }
      `}</style>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", color: "#09090b" }}>spec</div>
          <div style={{ fontSize: "10px", color: "#71717a", padding: "3px 9px", background: "#ffffff", border: "1px solid #e8e6dd", borderRadius: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Beta</div>
        </div>
        <h1 style={{ fontSize: "28px", margin: "0 0 6px", fontWeight: 600, letterSpacing: "-0.02em", color: "#09090b" }}>Projects</h1>
        <p style={{ color: "#52525b", fontSize: "13px", margin: "0 0 32px", lineHeight: 1.6 }}>Plan, spec, and export Elementor or Divi templates.</p>

        {/* AI Describe Your Site — optional guided start */}
        <div style={{ background: "#ffffff", border: "1px solid #ebe9e2", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Icon name="sparkles" size={18} color="#000000" />
            <h2 style={{ fontSize: "16px", margin: 0, fontWeight: 600, color: "#09090b", letterSpacing: "-0.01em" }}>Describe your site — get a custom recommendation</h2>
          </div>
          <p style={{ fontSize: "12px", color: "#52525b", margin: "0 0 16px", lineHeight: 1.6 }}>
            Describe your site and get a template, layout, colors, and starter copy.
          </p>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "10px", color: "#000000", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "6px" }}>
              Already know which template you want? (optional)
            </label>
            <select
              value={lockedTemplateId}
              onChange={e => setLockedTemplateId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", background: "#f5f5f4", color: "#18181b", border: lockedTemplateId ? "1px solid #7c3aed" : "1px solid #ebe9e2", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
              <option value="">Let AI pick the best template (recommended)</option>
              {WEBSITE_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.industry.split(/[,—]/)[0].trim().slice(0, 40)}</option>
              ))}
            </select>
            <div style={{ fontSize: "10px", color: "#71717a", marginTop: "6px", lineHeight: 1.5 }}>
              {lockedTemplateId
                ? "Pinned. AI will keep this template and recommend everything else (layout, colors, fonts, brief)."
                : ""}
            </div>
          </div>
          <div style={{ marginBottom: "6px", fontSize: "11px", color: "#71717a" }}>
            {lockedTemplateId
              ? "Description below is now optional — your locked template gives me enough to work with. Add details to personalize the brief further."
              : ""}
          </div>
          <textarea
            value={briefText}
            onChange={e => setBriefText(e.target.value)}
            placeholder={lockedTemplateId
              ? "Optional: add specifics like audience, vibe, or a target outcome to personalize the recommendation. Leave blank to use smart defaults for this template."
              : "e.g. A modern fitness coaching site for women over 40. Warm but no-nonsense. Earthy palette."}
            style={{ width: "100%", minHeight: "100px", padding: "12px 14px", background: "#f5f5f4", color: "#18181b", border: "1px solid #ebe9e2", borderRadius: "8px", fontSize: "13px", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, outline: "none" }}
          />
          <div style={{ display: "flex", gap: "10px", marginTop: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={describeMySite}
              disabled={briefLoading || (!briefText.trim() && !lockedTemplateId)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 18px",
                background: briefLoading ? "#18181b" : "#09090b",
                color: "#fff", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 500,
                cursor: (briefLoading || (!briefText.trim() && !lockedTemplateId)) ? "not-allowed" : "pointer",
                opacity: (briefLoading || (!briefText.trim() && !lockedTemplateId)) ? 0.4 : 1,
              }}>
              <Icon name="sparkles" size={14} color="#fff" />
              {briefLoading ? "Analyzing…" : "Get my recommendation"}
            </button>
            {briefLoading && <span style={{ fontSize: "11px", color: "#000000", fontWeight: 500 }}>Picking template, layout, colors, fonts… usually 5–10 seconds.</span>}
          </div>
          {briefLoading && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "#f5f5f4", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "11px", color: "#52525b", lineHeight: 1.6 }}>
              <div style={{ marginBottom: "4px", color: "#000000", fontWeight: 500 }}></div>
              
            </div>
          )}
          {briefError && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "12px", color: "#991b1b" }}>
              {briefError}
            </div>
          )}
        </div>

        {/* Recommendation card */}
        {briefRec && (
          <div style={{ background: "#ffffff", border: "1px solid #e7e7e4", borderRadius: "12px", padding: "32px 36px", marginBottom: "28px" }}>
            {/* Header row — template name + action buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px", flexWrap: "wrap", paddingBottom: "24px", borderBottom: "1px solid #e7e7e4" }}>
              <div style={{ flex: "1 1 280px" }}>
                <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "6px" }}>Recommended Template</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#09090b", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: briefRec.templateReason ? "8px" : 0 }}>{WEBSITE_TEMPLATES.find(t => t.id === briefRec.templateId)?.name || briefRec.templateId}</div>
                {briefRec.templateReason && <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55 }}>{briefRec.templateReason}</div>}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={applyBriefRecommendation} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#000000", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                  <Icon name="check" size={14} color="#fff" /> Create this project
                </button>
                <button onClick={describeMySite} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#ffffff", color: "#18181b", border: "1px solid #e7e7e4", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                  <Icon name="refresh" size={14} color="#18181b" /> Regenerate
                </button>
                <button onClick={() => setBriefRec(null)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", color: "#52525b", border: "1px solid #e7e7e4", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>
                  Discard
                </button>
              </div>
            </div>

            {/* Tagline pull-quote (if present) */}
            {briefRec.tagline && (
              <div style={{ marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid #e7e7e4" }}>
                <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>The Brief</div>
                <div style={{ fontSize: "16px", color: "#09090b", fontStyle: "italic", lineHeight: 1.45, letterSpacing: "-0.01em", fontWeight: 500 }}>"{briefRec.tagline.replace(/^["']|["']$/g, "")}"</div>
              </div>
            )}

            {/* Spec sheet — 2-column masthead grid */}
            <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 36px" }}>
              {/* Layout */}
              {briefRec.layoutId && (
                <div>
                  <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Layout</div>
                  <div style={{ fontSize: "16px", color: "#09090b", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.015em" }}>{LAYOUTS.find(l => l.id === briefRec.layoutId)?.name || briefRec.layoutId}</div>
                  {briefRec.layoutReason && <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55 }}>{briefRec.layoutReason}</div>}
                </div>
              )}

              {/* Palette with visual swatches */}
              {(briefRec.customColors || briefRec.themeId) && (
                <div>
                  <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Palette</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                    {(() => {
                      // Build swatch list from custom colors or from the recommended theme
                      let swatches = [];
                      if (briefRec.customColors) {
                        swatches = [briefRec.customColors.background, briefRec.customColors.accent, briefRec.customColors.text || briefRec.customColors.card].filter(Boolean);
                      } else {
                        const theme = THEMES.find(t => t.id === briefRec.themeId);
                        if (theme) swatches = [theme.primaryColor, theme.accentColor, theme.cardBgColor];
                      }
                      return swatches.slice(0, 3).map((c, i) => (
                        <div key={i} style={{ width: "24px", height: "24px", background: c, border: "1px solid #e7e7e4", borderRadius: "4px" }} />
                      ));
                    })()}
                    <span style={{ fontSize: "16px", color: "#09090b", fontWeight: 700, marginLeft: "4px", letterSpacing: "-0.015em" }}>
                      {briefRec.customColors ? "Custom colors" : (THEMES.find(t => t.id === briefRec.themeId)?.name || briefRec.themeId)}
                    </span>
                  </div>
                  {briefRec.themeReason && <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55 }}>{briefRec.themeReason}</div>}
                </div>
              )}

              {/* Typography with rendered sample */}
              {briefRec.headingFont && (
                <div>
                  <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Typography</div>
                  <div style={{ fontSize: "22px", color: "#09090b", fontFamily: `'${briefRec.headingFont}', Georgia, serif`, lineHeight: 1.1, marginBottom: "4px", fontWeight: 500 }}>{briefRec.headingFont}</div>
                  <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55 }}>
                    Display heading{briefRec.bodyFont ? ` — paired with ${briefRec.bodyFont} for body` : ""}.{briefRec.fontReason ? ` ${briefRec.fontReason}` : ""}
                  </div>
                </div>
              )}

              {/* Goals */}
              {((Array.isArray(briefRec.goals) && briefRec.goals.length) || briefRec.goal) && (
                <div>
                  <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Goals</div>
                  <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6, fontWeight: 500 }}>
                    {(Array.isArray(briefRec.goals) && briefRec.goals.length ? briefRec.goals : [briefRec.goal]).join(" · ")}
                  </div>
                </div>
              )}

              {/* Outcome */}
              {briefRec.outcome && (
                <div>
                  <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Desired Outcome</div>
                  <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6 }}>{briefRec.outcome}</div>
                </div>
              )}

              {/* Keywords */}
              {briefRec.primaryKeywords && (
                <div>
                  <div style={{ fontSize: "9px", color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Keywords</div>
                  <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6 }}>{briefRec.primaryKeywords}</div>
                </div>
              )}
            </div>
          </div>
        )}




        <h2 style={{ fontSize: "14px", margin: "0 0 14px", fontWeight: 600, color: "#09090b", letterSpacing: "-0.01em" }}>Your projects</h2>
        {projects.length === 0 && (
          <div style={{ marginBottom: "20px", padding: "20px 24px", background: "#ffffff", border: "1px solid #ebe9e2", borderRadius: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "6px" }}>No projects yet — start with one of the tiles below</div>
            <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.6 }}>
              Start a new project or describe your site above for an AI recommendation.
            </div>
          </div>
        )}
        {importMsg && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", background: importMsg.startsWith("Import failed") ? "#fef2f2" : "#f7f4ff", border: importMsg.startsWith("Import failed") ? "1px solid #fecaca" : "1px solid #e8def9", borderRadius: "8px", fontSize: "12px", color: importMsg.startsWith("Import failed") ? "#991b1b" : "#5b21b6" }}>
            {importMsg}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "14px" }}>
          {projects.map(p => {
            const hasTemplate = !!p.brand.templateId;
            const displayName = p.name || p.brand.name || "Untitled";
            const hasDescription = !!p.brand.industry;
            const isPendingDelete = confirmDeleteId === p.id;
            return (
              <div key={p.id} style={{ background: "#ffffff", border: isPendingDelete ? "1px solid #fecaca" : "1px solid #ebe9e2", padding: "18px 20px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div onClick={() => { setActiveId(p.id); setView("editor"); setPageIdx(0); }} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px", color: "#09090b", letterSpacing: "-0.01em" }}>{displayName}</div>
                  <div style={{ fontSize: "11px", color: "#71717a", marginBottom: "12px" }}>
                    {p.pages.length} page{p.pages.length !== 1 ? "s" : ""}
                    {hasDescription ? <> · {p.brand.industry}</> : <span style={{ color: "#a3a39e" }}> · No description yet</span>}
                  </div>
                  {hasTemplate ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <div style={{ width: "18px", height: "18px", background: p.brand.primaryColor, border: "1px solid #ebe9e2", borderRadius: "3px" }} />
                      <div style={{ width: "18px", height: "18px", background: p.brand.accentColor, border: "1px solid #ebe9e2", borderRadius: "3px" }} />
                      <span style={{ fontSize: "10px", color: "#71717a", marginLeft: "4px" }}>
                        {WEBSITE_TEMPLATES.find(t => t.id === p.brand.templateId)?.name || "Template applied"}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "10px", color: "#71717a", fontStyle: "italic", padding: "6px 10px", background: "#f5f5f4", border: "1px dashed #d4d2c8", borderRadius: "4px", display: "inline-block" }}>
                      No template applied yet
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", paddingTop: "12px", borderTop: "1px solid #f0eee6" }}>
                  {isPendingDelete ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} style={{ flex: 1, padding: "8px 10px", background: "#c93939", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Yes, delete "{displayName}"</button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} style={{ padding: "8px 12px", background: "transparent", color: "#52525b", border: "1px solid #ebe9e2", borderRadius: "6px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setActiveId(p.id); setView("editor"); setPageIdx(0); }} style={{ flex: 1, padding: "8px 10px", background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>Open</button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }} title="Duplicate this project" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#52525b", border: "1px solid #ebe9e2", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="copy" size={14} color="#52525b" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); exportProjectFile(p); }} title="Download as JSON backup file" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#52525b", border: "1px solid #ebe9e2", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="download" size={14} color="#52525b" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); resetProject(p.id); }} title="Reset to blank" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#52525b", border: "1px solid #ebe9e2", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="refresh" size={14} color="#52525b" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }} title="Delete this project" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#c93939", border: "1px solid #ebe9e2", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="trash" size={14} color="#c93939" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <button onClick={newProject} style={{ background: "transparent", border: "1.5px dashed #d4d2c8", color: "#52525b", padding: "32px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon name="plus" size={18} color="#52525b" /> New Project
          </button>
          <label style={{ background: "transparent", border: "1.5px dashed #d4d2c8", color: "#52525b", padding: "32px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 500, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon name="upload" size={18} color="#52525b" /> Import Project JSON
            <input type="file" accept="application/json,.json" onChange={importProjectFile} style={{ display: "none" }} />
          </label>
        </div>
        <p style={{ fontSize: "11px", color: "#71717a", marginTop: "20px", lineHeight: 1.6 }}>
          Projects auto-save in your browser. Use the download icon on a project card to save a JSON backup (handy for sharing or as a safety net).
        </p>
      </div>
    </div>
  );

  // ── EDITOR VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f4", color: "#18181b", fontFamily: "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Yeseva+One&family=Manrope:wght@400;500;700&family=Playfair+Display:wght@400;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Oswald:wght@500;700&family=Space+Mono&family=Inter:wght@500;700&display=swap');
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; box-sizing: border-box; }
        /* Mobile + tablet responsiveness */
        @media(max-width:900px){
          .main-grid{grid-template-columns:1fr !important;}
          .right-panel{display:none}
          /* Force any fixed 2-col grid to collapse on mobile */
          .responsive-2col{grid-template-columns:1fr !important;}
          .responsive-4col{grid-template-columns:1fr 1fr !important;}
          /* Header rows stack on small screens */
          .editor-header-row{flex-wrap:wrap !important; gap:8px !important;}
        }
        @media(max-width:600px){
          /* Tablet → mobile: full collapse */
          .responsive-2col, .responsive-4col{grid-template-columns:1fr !important;}
          .tab-bar button{padding:8px 10px !important; font-size:11px !important;}
          .editor-padding{padding:0 12px 40px !important;}
        }
        /* Inputs and buttons always full-width on touch */
        @media(max-width:600px){
          input, textarea, select{font-size:16px !important;} /* prevents iOS zoom on focus */
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#f5f5f4", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        {/* Row 1: brand + view actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => setView("projects")} style={{ ...I.btnGhost, padding: "8px 14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icon name="arrowLeft" size={14} color="#52525b" /> All Projects
            </button>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", color: "#000000", lineHeight: 1 }}>spec</div>
              <div style={{ fontSize: "11px", color: "#52525b", marginTop: "4px" }}>{brand.name} · {project.pages.length} page{project.pages.length !== 1 ? "s" : ""} · Exporting for {exportFormat === "divi" ? "Divi" : "Elementor"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setShowAudit(!showAudit)} style={{ ...I.btnGhost, color: audit.length ? "#b45309" : "#52525b", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icon name="alertTriangle" size={14} color={audit.length ? "#b45309" : "#52525b"} /> Audit ({audit.length})
            </button>
            <button onClick={() => exportProjectFile(project)} style={{ ...I.btnGhost, display: "inline-flex", alignItems: "center", gap: "6px" }} title="Download this project as a JSON backup">
              <Icon name="download" size={14} color="#52525b" /> Save Backup
            </button>
            <button onClick={exportBrief} style={{ padding: "9px 14px", background: "transparent", color: "#52525b", border: "1px solid #e4e4e7", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icon name="file-text" size={14} color="#52525b" /> Export Brief
            </button>
            <button onClick={() => setView("preview")} style={{ ...I.btn, background: "#000000", color: "#ffffff", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icon name="eye" size={14} color="#ffffff" /> Preview Page
            </button>
          </div>
        </div>

      </div>

      {/* Audit drawer — categorized */}
      {showAudit && (
        <div style={{ background: "#ffffff", borderBottom: "1px solid #e5e7eb", padding: "20px 24px", maxHeight: "420px", overflowY: "auto" }}>
          {audit.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#000000", fontWeight: 600 }}>Everything looks good. Ready to build.</div>
          ) : (
            <>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#18181b", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Build Audit — {audit.length} item{audit.length !== 1 ? "s" : ""}</div>
              {["critical", "content", "seo", "aio", "best"].map(cat => {
                const items = audit.filter(a => a.category === cat);
                if (!items.length) return null;
                const label = { critical: "🚨 Critical", content: "Content", seo: "SEO", aio: "🤖 AI Search", best: "Best Practices" }[cat];
                const color = { critical: "#ef4444", content: "#b45309", seo: "#3b82f6", aio: "#000000", best: "#000000" }[cat];
                return (
                  <div key={cat} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", color, fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label} ({items.length})</div>
                    {items.map((a, i) => {
                      const TABLABEL = { brand: "Brand", page: "Page", content: "Content", inspo: "Inspiration", social: "Social & Nav", footer: "Header & Footer", export: "Export" };
                      const target = a.target;
                      const clickable = target && target.section;
                      return (
                        <button
                          key={i}
                          onClick={clickable ? () => goToSection(target.tab, target.section) : undefined}
                          disabled={!clickable}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            fontSize: "12px", color: "#27272a", padding: "8px 12px",
                            lineHeight: 1.5, borderLeft: `2px solid ${color}`,
                            background: "#f5f5f4", border: `1px solid #f4f4f5`, borderLeftWidth: "3px", borderLeftColor: color,
                            borderRadius: "4px", marginBottom: "6px",
                            cursor: clickable ? "pointer" : "default",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (clickable) e.currentTarget.style.background = "#eeeeec"; }}
                          onMouseLeave={e => { if (clickable) e.currentTarget.style.background = "#f5f5f4"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                            <strong style={{ color: "#18181b" }}>{a.msg}</strong>
                            {clickable && (
                              <span style={{ fontSize: "10px", color: "#52525b", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                                {TABLABEL[target.tab] || target.tab} → →
                              </span>
                            )}
                          </div>
                          {a.fix && <div style={{ color: "#52525b", marginTop: "4px", fontSize: "11px" }}>→ {a.fix}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* AI Draft Modal — preview the generated copy before applying */}
      {(aiDraft || aiError || aiLoading) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px", maxWidth: "720px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            {aiError ? (
              <>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#ef4444", marginBottom: "12px" }}>Couldn't draft copy</div>
                <div style={{ fontSize: "13px", color: "#27272a", marginBottom: "20px", lineHeight: 1.6 }}>{aiError}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setAiError(""); generateStarterCopy(); }} style={{ padding: "10px 18px", background: "#000000", color: "#18181b", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
                  <button onClick={() => setAiError("")} style={{ padding: "10px 18px", background: "transparent", color: "#27272a", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            ) : (aiLoading && !aiDraft) ? (
              <>
                <div style={{ fontSize: "11px", color: "#27272a", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Drafting</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#18181b", marginBottom: "20px" }}>Writing your starter copy…</div>
                <div style={{ fontSize: "12px", color: "#27272a", lineHeight: 1.6, marginBottom: "20px" }}>
                  Writing tagline, hero heading, hero subhead, about copy, CTAs, and key messages based on your brand brief. Usually 8–15 seconds.
                </div>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ marginBottom: "10px", background: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                    <div style={{ height: "10px", width: "30%", background: "#eeeeec", borderRadius: "3px", marginBottom: "8px" }} />
                    <div style={{ height: "12px", width: "85%", background: "#eeeeec", borderRadius: "3px" }} />
                  </div>
                ))}
              </>
            ) : aiDraft && (
              <>
                <div style={{ fontSize: "11px", color: "#27272a", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Draft Preview</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#18181b", marginBottom: "8px" }}>Review and edit the starter copy</div>
                <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "20px", lineHeight: 1.5 }}>
                  Edit any field directly. Click <strong style={{ color: "#27272a" }}>↻</strong> next to a label to regenerate just that field. When you like it, click Apply.
                </div>

                {[
                  { key: "tagline", label: "Tagline", multiline: false },
                  { key: "heroHeading", label: "Hero Heading", multiline: false },
                  { key: "heroSubhead", label: "Hero Subhead", multiline: true, rows: 2 },
                  { key: "aboutHeading", label: "About Heading", multiline: false },
                  { key: "aboutBody", label: "About Body", multiline: true, rows: 6 },
                  { key: "cta1", label: "Primary CTA", multiline: false },
                  { key: "cta2", label: "Secondary CTA", multiline: false },
                  { key: "keyMessages", label: "Key Messages", multiline: true, rows: 3 },
                ].map(({ key, label, multiline, rows }) => {
                  const value = aiDraft[key] || "";
                  const isRegenerating = aiFieldRegen === key;
                  return (
                    <div key={key} style={{ marginBottom: "14px", background: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: isRegenerating ? "1px solid #18181b" : "1px solid #e5e7eb", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
                        <button
                          onClick={() => regenerateField(key)}
                          disabled={!!aiFieldRegen}
                          title={`Regenerate just the ${label.toLowerCase()}`}
                          style={{
                            background: isRegenerating ? "#000000" : "transparent",
                            color: isRegenerating ? "#ffffff" : "#52525b",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            padding: "4px 9px",
                            fontSize: "10px",
                            fontWeight: 500,
                            cursor: aiFieldRegen ? "not-allowed" : "pointer",
                            opacity: (aiFieldRegen && !isRegenerating) ? 0.4 : 1,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}>
                          <Icon name="refresh" size={11} color={isRegenerating ? "#ffffff" : "#52525b"} />
                          {isRegenerating ? "Regenerating…" : "Regenerate"}
                        </button>
                      </div>
                      {multiline ? (
                        <textarea
                          value={value}
                          onChange={e => setAiDraft({ ...aiDraft, [key]: e.target.value })}
                          rows={rows || 3}
                          disabled={isRegenerating}
                          style={{ width: "100%", padding: "8px 10px", background: "#f5f5f4", color: "#18181b", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "13px", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5, opacity: isRegenerating ? 0.5 : 1 }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={e => setAiDraft({ ...aiDraft, [key]: e.target.value })}
                          disabled={isRegenerating}
                          style={{ width: "100%", padding: "8px 10px", background: "#f5f5f4", color: "#18181b", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "13px", fontFamily: "inherit", opacity: isRegenerating ? 0.5 : 1 }}
                        />
                      )}
                    </div>
                  );
                })}

                <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                  <button onClick={applyAiDraft} disabled={!!aiFieldRegen || aiLoading} style={{ padding: "12px 20px", background: "#000000", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: (aiFieldRegen || aiLoading) ? "not-allowed" : "pointer", opacity: (aiFieldRegen || aiLoading) ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="check" size={14} color="#ffffff" /> Apply to brand & page
                  </button>
                  <button onClick={() => { setAiDraft(null); generateStarterCopy(); }} disabled={!!aiFieldRegen || aiLoading} style={{ padding: "12px 20px", background: "#ffffff", color: "#27272a", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: (aiFieldRegen || aiLoading) ? "not-allowed" : "pointer", opacity: (aiFieldRegen || aiLoading) ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="refresh" size={14} color="#27272a" /> Regenerate all
                  </button>
                  <button onClick={() => { setAiDraft(null); setAiFieldRegen(""); }} disabled={!!aiFieldRegen} style={{ padding: "12px 20px", background: "transparent", color: "#52525b", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: aiFieldRegen ? "not-allowed" : "pointer" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", minHeight: "calc(100vh - 60px)" }}>
        {/* LEFT — FORM */}
        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(100vh - 60px)" }}>
          {/* Page tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center", position: "relative" }}>
            {project.pages.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button onClick={() => setPageIdx(i)} style={{ padding: "8px 14px", background: i === pageIdx ? "#000000" : "#ffffff", color: i === pageIdx ? "#ffffff" : "#27272a", border: i === pageIdx ? "1px solid #000000" : "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>{p.name}</button>
                {project.pages.length > 1 && <button onClick={() => delPage(i)} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer", fontSize: "14px" }}>×</button>}
              </div>
            ))}
            <button onClick={() => setShowAddPage(!showAddPage)} style={{ ...I.btnGhost, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icon name="plus" size={13} color="#52525b" /> Add Page
            </button>
            {showAddPage && (
              <div style={{ position: "absolute", top: "44px", right: "0", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px", zIndex: 30, minWidth: "280px", maxHeight: "420px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", padding: "0 4px", fontWeight: 600 }}>Start from a template</div>
                {PAGE_TYPES.map(pt => (
                  <button key={pt} onClick={() => addPage(pt)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", color: "#27272a", fontSize: "13px", cursor: "pointer", borderRadius: "4px", marginBottom: "2px" }} onMouseEnter={e => e.currentTarget.style.background = "#eeeeec"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontWeight: 600, color: "#000000" }}>{pt}</div>
                    <div style={{ fontSize: "11px", color: "#71717a", marginTop: "2px" }}>{(PAGE_TEMPLATES[pt]?.sections || []).slice(0, 4).join(" · ")}{PAGE_TEMPLATES[pt]?.sections?.length > 4 ? " ..." : ""}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="tab-bar" style={{ borderBottom: "1px solid #e7e7e4", marginBottom: "20px", display: "flex", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <TabBtn id="discovery" label="Discovery" />
            <TabBtn id="brand" label="Brand" />
            <TabBtn id="page" label="Page" />
            <TabBtn id="content" label="Content" />
            <TabBtn id="social" label="Social" />
            <TabBtn id="footer" label="Header & Footer" />
            <TabBtn id="export" label="Export & Import" />
          </div>

          {/* DISCOVERY TAB */}
          {tab === "discovery" && (
            <div className="editor-padding" style={{ padding: "0 20px 40px", maxWidth: "900px" }}>
              {/* Project switcher — quick "where am I + jump to another project" bar */}
              <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 220px", minWidth: "180px" }}>
                  <label style={{ display: "block", fontSize: "10px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "3px" }}>Editing</label>
                  <input
                    type="text"
                    value={brand.name || ""}
                    onChange={e => updBrand("name", e.target.value)}
                    placeholder="Type a project name…"
                    style={{ width: "100%", padding: "6px 0", background: "transparent", color: "#000000", border: "none", borderBottom: "1px solid transparent", fontSize: "16px", fontWeight: 700, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s" }}
                    onFocus={e => e.target.style.borderBottomColor = "#000000"}
                    onBlur={e => e.target.style.borderBottomColor = "transparent"}
                  />
                </div>
                {projects.length > 1 && (
                  <select
                    value={activeId}
                    onChange={e => { setActiveId(e.target.value); setPageIdx(0); }}
                    style={{ padding: "9px 12px", background: "#ffffff", color: "#27272a", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", minWidth: "180px" }}
                    title="Switch to another project">
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
                <button onClick={newProject} style={{ padding: "9px 14px", background: "#000000", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="plus" size={13} color="#ffffff" /> New Project
                </button>
                <button onClick={() => setView("projects")} style={{ padding: "9px 14px", background: "transparent", color: "#27272a", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "6px" }} title="View, duplicate, import, or export projects">
                  <Icon name="folder" size={13} color="#27272a" /> Manage Projects
                </button>
              </div>

<Section id="inspo-sites" title="Inspiration Sites" icon="✨">
                <p style={{ fontSize: "12px", color: "#71717a", margin: 0 }}>URLs of sites you love. The AI Draft Starter Copy uses these to infer aesthetic preferences — adding more or different sites here will change the recommendation when you regenerate.</p>
                <div><label style={I.lbl}>Inspiration URLs (one per line)</label><textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={6} value={brand.inspoUrls} onChange={e => updBrand("inspoUrls", e.target.value)} placeholder="https://faure.octrace.com&#10;https://nevo.themevillain.com&#10;https://breef.com" /></div>
                <div style={{ marginTop: "12px", padding: "12px 14px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "11px", color: "#27272a", lineHeight: 1.6 }}>
                  <strong style={{ color: "#27272a" }}>How this gets used:</strong> Whenever you go to Discovery → Brand Brief and click <strong>Draft Starter Copy</strong>, these URLs are sent to the AI as aesthetic context. To refresh recommendations after adding new URLs, head to Discovery and re-run Draft Starter Copy.
                </div>
              </Section>

              <Section id="inspo-keywords" title="Keywords for Search & AI Discovery" icon="🔑">
                <p style={{ fontSize: "12px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>
                  Terms you want this site to rank for in Google AND get cited in AI search (ChatGPT, Perplexity, Gemini, and similar). These are also fed to the AI Draft Starter Copy so copy gets written around them naturally.
                </p>
                {(() => {
                  const activeTpl = brand.templateId ? WEBSITE_TEMPLATES.find(t => t.id === brand.templateId) : null;
                  if (!activeTpl) return null;
                  const tplKeywords = (activeTpl.industry || "").split(/[,—]/).map(s => s.trim()).filter(Boolean).slice(0, 5);
                  if (!tplKeywords.length) return null;
                  const currentList = (brand.primaryKeywords || "").split(",").map(s => s.trim()).filter(Boolean);
                  const missing = tplKeywords.filter(k => !currentList.some(c => c.toLowerCase() === k.toLowerCase()));
                  if (!missing.length) return null;
                  return (
                    <div style={{ padding: "12px 14px", background: "#f5f5f4", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                      <div style={{ fontSize: "11px", color: "#27272a", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested from your {activeTpl.name} template</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {missing.map(k => (
                          <button key={k} onClick={() => {
                            const next = currentList.concat(k).join(", ");
                            updBrand("primaryKeywords", next);
                          }} style={{ padding: "5px 10px", background: "#eeeeec", color: "#27272a", border: "1px solid #e5e7eb", borderRadius: "4px", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>
                            + {k}
                          </button>
                        ))}
                      </div>
                      <div style={{ fontSize: "10px", color: "#52525b", marginTop: "8px" }}>Click a chip to add it to your keywords below.</div>
                    </div>
                  );
                })()}
                <div>
                  <label style={I.lbl}>Primary Keywords (comma-separated)</label>
                  <textarea
                    style={{ ...I.inp, resize: "vertical" }}
                    rows={3}
                    value={brand.primaryKeywords || ""}
                    onChange={e => updBrand("primaryKeywords", e.target.value)}
                    placeholder="freelance videographer, video production, cinematic video, music video, brand film"
                  />
                  <div style={{ fontSize: "10px", color: "#71717a", marginTop: "5px" }}>3–5 keywords ideal. Same field as Discovery → Brand Brief — edits sync.</div>
                </div>
              </Section>

                            
              <Section id="founder" title="Founder" icon="👤">
                <div><label style={I.lbl}>Founder Name</label><input style={I.inp} value={brand.founderName} onChange={e => updBrand("founderName", e.target.value)} placeholder="e.g. Alex Morgan" /></div>
                <div><label style={I.lbl}>Founder Title</label><input style={I.inp} value={brand.founderTitle} onChange={e => updBrand("founderTitle", e.target.value)} placeholder="e.g. Founder & Creative Director" /></div>
                <div><label style={I.lbl}>Founder Bio</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.founderBio} onChange={e => updBrand("founderBio", e.target.value)} /></div>
              </Section>

                            <Section id="brand-business" title="Business" icon="🏢">
                <div>
                  <label style={I.lbl}>Business Name</label>
                  <input style={I.inp} value={brand.name} onChange={e => updBrand("name", e.target.value)} placeholder="e.g. Ben Papa Films" />
                  <div style={{ fontSize: "10px", color: "#71717a", marginTop: "4px" }}>This is also the project name shown on the Projects page.</div>
                </div>
                <div><label style={I.lbl}>Industry / Tagline Line</label><input style={I.inp} value={brand.industry} onChange={e => updBrand("industry", e.target.value)} placeholder="e.g. Documentary & commercial film production" /></div>
                <div><label style={I.lbl}>Tagline (used in hero)</label><input style={I.inp} value={brand.tagline} onChange={e => updBrand("tagline", e.target.value)} placeholder="e.g. Stories told in motion." /></div>
                <div><label style={I.lbl}>Description</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={4} value={brand.description} onChange={e => updBrand("description", e.target.value)} placeholder="1–2 sentences describing what you do. Used as the meta description for SEO." /></div>
                <div><label style={I.lbl}>Target Audience</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={brand.targetAudience} onChange={e => updBrand("targetAudience", e.target.value)} placeholder="Who you're talking to. Be specific about role, company size, or life stage." /></div>
                <div><label style={I.lbl}>Key Messages</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.keyMessages} onChange={e => updBrand("keyMessages", e.target.value)} placeholder="2–4 sentences. What you want every visitor to walk away knowing." /></div>
                <div><label style={I.lbl}>Marquee Text (used by Marquee section)</label><input style={I.inp} value={brand.marqueeText || ""} onChange={e => updBrand("marqueeText", e.target.value)} placeholder="A short rotating message — e.g. 'We put story first'" /></div>
                <div><label style={I.lbl}>Promo Banner Text (used by Promo Banner section)</label><input style={I.inp} value={brand.promoBanner || ""} onChange={e => updBrand("promoBanner", e.target.value)} placeholder="e.g. FREE SHIPPING ON ORDERS OVER $75  ·  EASY 30-DAY RETURNS" /></div>
                <div><label style={I.lbl}>Tone</label><select style={I.inp} value={brand.tone} onChange={e => updBrand("tone", e.target.value)}>{TONES.map(t => <option key={t}>{t}</option>)}</select></div>
              </Section>

              <Section id="brand-brief" title="Brand Brief — Goals & SEO" icon="🎯">
                <p style={{ fontSize: "12px", color: "#27272a", margin: 0, lineHeight: 1.6 }}>
                  This drives the audit's SEO and AI-search recommendations, and powers the "Draft Starter Copy" button below. The more specific you are, the better the audit and the AI copy.
                </p>
                <div>
                  <label style={I.lbl}>Primary Goals — select all that apply</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
                    {["Lead Generation", "Direct Sales / E-commerce", "Bookings & Reservations", "Free Trial / Demo Sign-ups", "Account Creation / Registration", "Resource Downloads / Lead Magnets", "Awareness & Brand Building", "Community & Newsletter Growth", "Applications & Sign-ups", "Donations & Fundraising"].map(g => {
                      const currentGoals = brand.goals || (brand.goal ? [brand.goal] : []);
                      const isSelected = currentGoals.includes(g);
                      return (
                        <label key={g} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: isSelected ? "#eeeeec" : "#f5f5f4", border: `1px solid ${isSelected ? "#000000" : "#e7e7e4"}`, borderRadius: "6px", cursor: "pointer", fontSize: "12px", color: isSelected ? "#18181b" : "#52525b", userSelect: "none" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              const next = e.target.checked ? [...currentGoals, g] : currentGoals.filter(x => x !== g);
                              updBrand("goals", next);
                              // Keep singular `goal` synced for backward compat (audit + AI prompt)
                              updBrand("goal", next[0] || "");
                            }}
                            style={{ cursor: "pointer", accentColor: "#000000" }}
                          />
                          {g}
                        </label>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: "10px", color: "#71717a", marginTop: "8px" }}>
                    Pick everything the site should do. An e-commerce site is often Sales + Newsletter Growth. A coaching site is often Bookings + Lead Generation. A SaaS product is often Free Trial + Account Creation. A consultant is often Lead Generation + Resource Downloads.
                  </div>
                </div>
                <div>
                  <label style={I.lbl}>Desired Outcome (one sentence)</label>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={brand.outcome || ""} onChange={e => updBrand("outcome", e.target.value)} placeholder="Example: Book 4-6 qualified strategy calls per month from B2B SaaS founders." />
                </div>
                <div>
                  <label style={I.lbl}>Primary Keywords (comma-separated)</label>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={brand.primaryKeywords || ""} onChange={e => updBrand("primaryKeywords", e.target.value)} placeholder="Example: executive coaching, business strategy, founder mentorship, scale without burnout" />
                  <div style={{ fontSize: "11px", color: "#52525b", marginTop: "6px", lineHeight: 1.5 }}>
                    The terms you want this page to rank for in Google AND get cited in AI search (ChatGPT, Perplexity, Gemini, and similar). Most pages should target 3–5 keywords.
                  </div>
                </div>
                <button
                  onClick={() => generateStarterCopy()}
                  disabled={aiLoading || !brand.goal || !brand.outcome}
                  style={{
                    marginTop: "8px", padding: "14px 18px",
                    background: "#000000",
                    color: "#ffffff", border: "none", borderRadius: "8px",
                    fontSize: "13px", fontWeight: 500, cursor: (aiLoading || !((brand.goals && brand.goals.length) || brand.goal) || !brand.outcome) ? "not-allowed" : "pointer",
                    opacity: (aiLoading || !((brand.goals && brand.goals.length) || brand.goal) || !brand.outcome) ? 0.4 : 1,
                    display: "inline-flex", alignItems: "center", gap: "8px",
                  }}>
                  <Icon name="sparkles" size={15} color="#ffffff" />
                  {aiLoading ? "Drafting starter copy…" : "Draft Starter Copy with AI"}
                </button>
                {(!((brand.goals && brand.goals.length) || brand.goal) || !brand.outcome) && (
                  <div style={{ fontSize: "11px", color: "#52525b", marginTop: "-4px" }}>
                    Pick at least one Goal and add a Desired Outcome to enable AI copy drafting.
                  </div>
                )}
              </Section>

            </div>
          )}

          {/* BRAND TAB */}
          {tab === "brand" && (
            <>
              <Section id="brand-templates" title="Industry Template" icon="🎨">
                <p style={{ fontSize: "12px", color: "#27272a", margin: 0, lineHeight: 1.6 }}>
                  {brand.templateId
                    ? <>Your project is using a template already (likely from your AI recommendation). You can switch to a different one below — one click applies the new layout, theme, accent, fonts, and default copy.</>
                    : <>No template applied yet. Pick one below — one click applies the layout, theme, accent, fonts, section composition, and default copy. Or go back to the Projects page and describe your site to get an AI recommendation.</>}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px", marginTop: "12px" }}>
                  {WEBSITE_TEMPLATES.map(t => {
                    // Active = this template's id matches the one stored on the brand when applied.
                    // Survives accent swaps, theme changes, font tweaks — until you apply a different template.
                    const isActive = brand.templateId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          // Apply directly — confirm() is blocked in sandboxed iframes (Claude artifacts).
                          // The "✓ APPLIED" badge gives instant feedback. To undo, just pick a different template.
                          setProjects(ps => ps.map(p => {
                            if (p.id !== activeId) return p;
                            const currentPage = p.pages[pageIdx];
                            if (!currentPage) return p;
                            const { brand: nb, page: np } = applyWebsiteTemplate(t, p.brand, currentPage);
                            return { ...p, brand: nb, pages: p.pages.map((pg, i) => i === pageIdx ? { ...pg, ...np } : pg) };
                          }));
                        }}
                        style={{
                          padding: "16px",
                          background: "#ffffff",
                          border: isActive ? "2px solid #000000" : "1px solid #e5e7eb",
                          borderRadius: "10px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all .15s",
                          position: "relative",
                        }}
                        onMouseOver={e => { if (!isActive) { e.currentTarget.style.borderColor = "#a3a39e"; } }}
                        onMouseOut={e => { if (!isActive) { e.currentTarget.style.borderColor = "#e7e7e4"; } }}
                      >
                        {isActive && (
                          <div style={{ position: "absolute", top: "12px", right: "12px", background: "#000000", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Icon name="check" size={11} color="#ffffff" /> Applied
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "200px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#000000", marginBottom: "10px", letterSpacing: "-0.02em", lineHeight: 1.3, paddingRight: isActive ? "70px" : 0 }}>{t.name}</div>
                          <div style={{ height: "1px", background: "#e7e7e4", marginBottom: "12px" }} />
                          <div style={{ fontSize: "12px", color: "#52525b", lineHeight: 1.55, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.desc}</div>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "auto" }}>
                            {t.homepageSections.slice(0, 5).map(s => (
                              <span key={s} style={{ fontSize: "9px", padding: "3px 8px", background: "#000000", color: "#ffffff", borderRadius: "10px", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "0.02em" }}>{s}</span>
                            ))}
                            {t.homepageSections.length > 5 && <span style={{ fontSize: "9px", color: "#71717a", padding: "3px 4px", alignSelf: "center" }}>+{t.homepageSections.length - 5}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section id="brand-layout" title="Layout Style" icon="📐">
                <p style={{ fontSize: "12px", color: "#27272a", margin: 0, lineHeight: 1.6 }}>
                  {brand.templateId
                    ? <>Your template applied a default layout, but you can swap to a different typographic personality without losing the template's sections, colors, or copy. Use this if you want, say, Agency sections with Magazine-style centered serif typography.</>
                    : <>Optional. Layout controls the typographic personality — hero composition, services rendering, heading sizes, alignments. Independent of color. If you pick a Website Template above, it sets a layout for you; you can override here.</>
                  }
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px", marginTop: "12px" }}>
                  {(() => {
                    // "Template Default" card — shows when a template is active.
                    // Resets the layout/fonts back to whatever the active template set.
                    if (!brand.templateId) return null;
                    const activeTemplate = WEBSITE_TEMPLATES.find(t => t.id === brand.templateId);
                    if (!activeTemplate) return null;
                    const defaultLayout = LAYOUTS.find(l => l.id === activeTemplate.layoutId);
                    const isOnDefault = brand.layoutId === activeTemplate.layoutId &&
                                        brand.headingFont === activeTemplate.headingFont &&
                                        brand.bodyFont === activeTemplate.bodyFont;
                    return (
                      <button onClick={() => {
                        setProjects(ps => ps.map(p => p.id === activeId ? {
                          ...p, brand: {
                            ...p.brand,
                            layoutId: activeTemplate.layoutId,
                            headingFont: activeTemplate.headingFont,
                            bodyFont: activeTemplate.bodyFont,
                          }
                        } : p));
                      }} style={{ padding: "18px 20px", background: "#ffffff", border: isOnDefault ? "2px solid #000000" : "1.5px dashed #d6d6d2", borderRadius: "10px", cursor: "pointer", textAlign: "left", position: "relative", display: "flex", flexDirection: "column", minHeight: "180px" }}>
                        {isOnDefault && (
                          <div style={{ position: "absolute", top: "12px", right: "12px", background: "#000000", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
                            <Icon name="check" size={11} color="#ffffff" /> Current
                          </div>
                        )}
                        {/* Aa preview in template's default heading font */}
                        <div style={{
                          fontFamily: `'${activeTemplate.headingFont || "Inter"}', Georgia, serif`,
                          fontSize: "32px",
                          lineHeight: 1,
                          color: "#a3a39e",
                          marginBottom: "14px",
                          fontWeight: activeTemplate.headingFont === "Cormorant Garamond" ? 400 : 500,
                          fontStyle: activeTemplate.headingFont === "Cormorant Garamond" ? "italic" : "normal",
                          letterSpacing: "-0.01em",
                        }}>Aa</div>
                        <div style={{ height: "1px", background: "#e7e7e4", marginBottom: "12px" }} />
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", marginBottom: "4px", letterSpacing: "-0.02em", paddingRight: isOnDefault ? "70px" : 0 }}>None — Template Default</div>
                        <div style={{ fontSize: "11px", color: "#52525b", lineHeight: 1.55, marginBottom: "12px" }}>Keep {activeTemplate.name}'s built-in layout ({defaultLayout?.name || "default"}).</div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "auto", fontSize: "10px", color: "#71717a", flexWrap: "wrap" }}>
                          <span>From template</span>
                          <span>·</span>
                          <span>{activeTemplate.headingFont}</span>
                        </div>
                      </button>
                    );
                  })()}
                  {(() => {
                    const _activeTpl = brand.templateId ? WEBSITE_TEMPLATES.find(t => t.id === brand.templateId) : null;
                    const _isOnTplDefault = _activeTpl &&
                      brand.layoutId === _activeTpl.layoutId &&
                      brand.headingFont === _activeTpl.headingFont &&
                      brand.bodyFont === _activeTpl.bodyFont;
                    return LAYOUTS.map(l => {
                    const active = brand.layoutId === l.id && !_isOnTplDefault;
                    return (
                      <button key={l.id} onClick={() => {
                        setProjects(ps => ps.map(p => p.id === activeId ? {
                          ...p, brand: {
                            ...p.brand,
                            layoutId: l.id,
                            ...(l.headingFont ? { headingFont: l.headingFont } : {}),
                            ...(l.bodyFont ? { bodyFont: l.bodyFont } : {}),
                          }
                        } : p));
                      }} style={{ padding: "18px 20px", background: "#ffffff", border: active ? "2px solid #000000" : "1px solid #e7e7e4", borderRadius: "10px", cursor: "pointer", textAlign: "left", position: "relative", transition: "border-color .15s", display: "flex", flexDirection: "column", minHeight: "180px" }}
                          onMouseOver={e => { if (!active) e.currentTarget.style.borderColor = "#a3a39e"; }}
                          onMouseOut={e => { if (!active) e.currentTarget.style.borderColor = "#e7e7e4"; }}>
                        {active && (
                          <div style={{ position: "absolute", top: "12px", right: "12px", background: "#000000", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
                            <Icon name="check" size={11} color="#ffffff" /> Active
                          </div>
                        )}
                        {/* Font preview Aa — rendered in the actual layout heading font */}
                        <div style={{
                          fontFamily: `'${l.headingFont || "Inter"}', Georgia, serif`,
                          fontSize: "32px",
                          lineHeight: 1,
                          color: "#09090b",
                          marginBottom: "14px",
                          fontWeight: l.headingFont === "Cormorant Garamond" ? 400 : (l.headingFont === "Oswald" || l.headingFont === "Yeseva One" ? 400 : 500),
                          fontStyle: l.headingFont === "Cormorant Garamond" ? "italic" : "normal",
                          letterSpacing: "-0.01em",
                        }}>Aa</div>
                        <div style={{ height: "1px", background: "#e7e7e4", marginBottom: "12px" }} />
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", marginBottom: "4px", letterSpacing: "-0.02em", paddingRight: active ? "70px" : 0 }}>{l.name}</div>
                        <div style={{ fontSize: "11px", color: "#52525b", lineHeight: 1.55, marginBottom: "12px" }}>{l.desc}</div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "auto", fontSize: "10px", color: "#71717a", flexWrap: "wrap", alignItems: "center" }}>
                          <span>{l.headingFont || "Default"}</span>
                          <span>·</span>
                          <span>{l.cardRadius > 0 ? "Soft edges" : "Sharp edges"}</span>
                        </div>
                      </button>
                    );
                  });
                  })()}
                </div>
              </Section>





              <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", marginBottom: "16px", overflow: "hidden" }}>
              <button onClick={() => setShowAdvancedColors(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#fafaf9", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#09090b" }}>
                <span>🎨 Advanced — Custom Brand Colors</span>
                <span style={{ fontSize: "11px", color: "#71717a" }}>{showAdvancedColors ? "▲ Hide" : "▼ Show"}</span>
              </button>
              {showAdvancedColors && <div style={{ padding: "16px" }}>
              <Section id="brand-colors" title="" icon="">
                <p style={{ fontSize: "12px", color: "#27272a", margin: 0, lineHeight: 1.6 }}>
                  Drop in your actual brand hex codes. Once you have at least 2 colors (Background + Accent), an <strong style={{ color: "#18181b" }}>"Apply Custom Brand Palette"</strong> button appears that swaps the live theme to use them.
                </p>
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { key: "background", label: "Background", placeholder: "#0a0a0a", note: "Main page background" },
                    { key: "accent", label: "Accent", placeholder: "#c8791a", note: "Buttons, links, highlights" },
                    { key: "text", label: "Text (optional)", placeholder: "#18181b", note: "Body/heading text on background" },
                    { key: "card", label: "Card / Panel (optional)", placeholder: "#111111", note: "Card backgrounds, panels" },
                  ].map(({ key, label, placeholder, note }) => {
                    const bc = brand.brandColors || {};
                    const val = bc[key] || "";
                    return (
                      <div key={key}>
                        <label style={I.lbl}>{label}</label>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            type="color"
                            value={val || "#000000"}
                            onChange={e => updBrand("brandColors", { ...bc, [key]: e.target.value })}
                            style={{ width: "36px", height: "36px", padding: "2px", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#f5f5f4", cursor: "pointer" }}
                          />
                          <input
                            style={{ ...I.inp, fontFamily: "monospace", textTransform: "lowercase" }}
                            value={val}
                            onChange={e => updBrand("brandColors", { ...bc, [key]: e.target.value })}
                            placeholder={placeholder}
                          />
                        </div>
                        <div style={{ fontSize: "10px", color: "#71717a", marginTop: "4px" }}>{note}</div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const bc = brand.brandColors || {};
                  const filled = ["background", "accent", "text", "card"].filter(k => bc[k] && /^#[0-9a-f]{6}$/i.test(bc[k]));
                  const canApply = filled.includes("background") && filled.includes("accent");
                  if (!canApply) return (
                    <div style={{ fontSize: "11px", color: "#52525b", padding: "10px 12px", background: "#f5f5f4", border: "1px solid #e5e7eb", borderRadius: "6px", lineHeight: 1.5 }}>
                      Add valid hex codes for at least Background and Accent to enable the custom palette.
                    </div>
                  );
                  // Preview swatch
                  const isDark = (() => {
                    const hex = bc.background.replace("#", "");
                    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
                    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
                  })();
                  const txt = bc.text || (isDark ? "#18181b" : "#0a0a0a");
                  const cardBg = bc.card || (isDark ? "#181818" : "#f5f5f5");
                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                        <div style={{ background: bc.background, padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                          <div style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: txt, marginBottom: "4px" }}>Aa Preview</div>
                          <div style={{ fontSize: "11px", color: txt, opacity: 0.7, marginBottom: "10px" }}>Body text on background</div>
                          <span style={{ display: "inline-block", background: bc.accent, color: isDark ? "#0a0a0a" : "#18181b", padding: "5px 12px", borderRadius: "4px", fontSize: "10px", fontWeight: 600 }}>Accent Button</span>
                          <div style={{ background: cardBg, marginTop: "10px", padding: "8px 10px", borderRadius: "4px", fontSize: "10px", color: txt, opacity: 0.85 }}>Card / panel example</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const theme = {
                            id: "custom-brand",
                            primaryColor: bc.background,
                            cardBgColor: cardBg,
                            bodyTextColor: txt,
                            borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
                            headingColor: txt,
                            mode: isDark ? "dark" : "light",
                          };
                          setProjects(ps => ps.map(p => p.id === activeId ? {
                            ...p, brand: {
                              ...p.brand,
                              themeId: "custom-brand",
                              themeMode: theme.mode,
                              primaryColor: theme.primaryColor,
                              cardBgColor: theme.cardBgColor,
                              bodyTextColor: theme.bodyTextColor,
                              borderColor: theme.borderColor,
                              accentColor: bc.accent,
                            }
                          } : p));
                        }}
                        style={{ padding: "12px 18px", background: "#18181b", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                        ✓ Apply Custom Brand Palette
                      </button>
                    </>
                  );
                })()}
              </Section>


              <Section id="brand-theme" title="Background Theme" icon="🎨">
                <p style={{ fontSize: "12px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>Pick a palette. All themes are tested for WCAG AA contrast — text stays readable, accents pop, and the elements complement the background automatically.</p>
                {(() => {
                  // Show a "Template default" indicator if the current theme matches the active template's theme
                  const activeTpl = brand.templateId ? WEBSITE_TEMPLATES.find(t => t.id === brand.templateId) : null;
                  if (!activeTpl || activeTpl.themeId !== brand.themeId) return null;
                  const tplTheme = THEMES.find(t => t.id === activeTpl.themeId);
                  return (
                    <div style={{ padding: "10px 14px", background: "#f5f5f4", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "11px", color: "#27272a", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#000000", color: "#ffffff", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em" }}>TEMPLATE DEFAULT</span>
                      <span>Using <strong style={{ color: "#000000" }}>{tplTheme?.name}</strong> from the {activeTpl.name} template. Pick a different theme below to override.</span>
                    </div>
                  );
                })()}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
                  {THEMES.map(t => {
                    const active = brand.themeId === t.id;
                    return (
                      <button key={t.id} onClick={() => setProjects(ps => ps.map(p => p.id === activeId ? { ...p, brand: applyTheme(t, p.brand) } : p))} style={{ padding: 0, background: "#ffffff", border: active ? "2px solid #000000" : "1px solid #e7e7e4", borderRadius: "10px", cursor: "pointer", overflow: "hidden", textAlign: "left", transition: "border-color .15s", display: "flex", flexDirection: "column", minHeight: "200px", position: "relative" }}
                          onMouseOver={e => { if (!active) e.currentTarget.style.borderColor = "#a3a39e"; }}
                          onMouseOut={e => { if (!active) e.currentTarget.style.borderColor = "#e7e7e4"; }}>
                        {active && (
                          <div style={{ position: "absolute", top: "10px", right: "10px", background: "#000000", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
                            <Icon name="check" size={11} color="#ffffff" /> Active
                          </div>
                        )}
                        {/* Full-bleed palette preview */}
                        <div style={{ background: t.primaryColor, padding: "18px 16px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontFamily: "Georgia,serif", fontSize: "20px", color: t.headingColor, lineHeight: 1, fontWeight: 400, marginBottom: "4px" }}>Aa</div>
                            <div style={{ fontSize: "10px", color: t.bodyTextColor }}>Body text</div>
                          </div>
                          <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                            <div style={{ width: "16px", height: "16px", background: t.accentColor, borderRadius: "50%" }} />
                            <div style={{ width: "16px", height: "16px", background: t.cardBgColor, border: `1px solid ${t.borderColor}`, borderRadius: "50%" }} />
                          </div>
                        </div>
                        {/* Meta block — title + divider + description */}
                        <div style={{ padding: "14px 16px", background: "#ffffff", display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", letterSpacing: "-0.02em", marginBottom: "8px", paddingRight: active ? "70px" : 0 }}>{t.name}</div>
                          <div style={{ height: "1px", background: "#e7e7e4", marginBottom: "10px" }} />
                          <div style={{ fontSize: "11px", color: "#52525b", lineHeight: 1.55 }}>{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: "16px", padding: "20px 22px", background: "#ffffff", border: "1px solid #e7e7e4", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#000000", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "6px" }}>Quick Accent Swap</div>
                  <p style={{ fontSize: "12px", color: "#52525b", margin: "0 0 16px", lineHeight: 1.55 }}>Override just the accent. Works with any theme.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {PREMIUM_ACCENTS.map(a => {
                      const active = brand.accentColor.toLowerCase() === a.value.toLowerCase();
                      const isLight = ["#ffffff", "#fafafa", "#f5f5f5"].includes(a.value.toLowerCase());
                      return (
                        <div key={a.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => updBrand("accentColor", a.value)}
                            title={a.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              background: a.value,
                              borderRadius: "50%",
                              border: active ? "2px solid #000000" : (isLight ? "1px solid #e7e7e4" : "2px solid transparent"),
                              boxShadow: active ? "inset 0 0 0 2px #ffffff" : "none",
                              cursor: "pointer",
                              padding: 0,
                              transition: "transform 0.12s",
                            }}
                            onMouseOver={e => { if (!active) e.currentTarget.style.transform = "scale(1.08)"; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
                          />
                          <span style={{ fontSize: "9px", color: active ? "#000000" : "#71717a", fontWeight: active ? 600 : 400, letterSpacing: "0.02em", textAlign: "center", lineHeight: 1.2 }}>{a.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <details style={{ marginTop: "8px" }}>
                  <summary style={{ fontSize: "11px", color: "#52525b", cursor: "pointer", padding: "8px 0" }}>Advanced — override individual colors</summary>
                  <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                    <div><label style={I.lbl}>Primary BG</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.primaryColor} onChange={e => updBrand("primaryColor", e.target.value)} /></div>
                    <div><label style={I.lbl}>Accent</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.accentColor} onChange={e => updBrand("accentColor", e.target.value)} /></div>
                    <div><label style={I.lbl}>Card BG</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.cardBgColor} onChange={e => updBrand("cardBgColor", e.target.value)} /></div>
                    <div><label style={I.lbl}>Body Text</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.bodyTextColor} onChange={e => updBrand("bodyTextColor", e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop: "8px" }}><label style={I.lbl}>Border Color (hex)</label><input style={I.inp} value={brand.borderColor} onChange={e => updBrand("borderColor", e.target.value)} /></div>
                  <p style={{ fontSize: "11px", color: "#b45309", margin: "8px 0 0" }}>Overriding may break contrast. Stick to themes for guaranteed accessibility.</p>
                </details>
              </Section>

              <Section id="brand-typography" title="Typography" icon="🔤">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={I.lbl}>Heading Font</label><select style={I.inp} value={brand.headingFont} onChange={e => updBrand("headingFont", e.target.value)}>{FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}</select></div>
                  <div><label style={I.lbl}>Body Font</label><select style={I.inp} value={brand.bodyFont} onChange={e => updBrand("bodyFont", e.target.value)}>{FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}</select></div>
                </div>
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>Pair a distinctive display font (heading) with a clean sans-serif (body). All fonts are Google Fonts and load automatically.</p>
              </Section>

              <Section id="brand-logo" title="Logo, Identity & CTAs" icon="🎯">
                <div><label style={I.lbl}>Logo URL (WordPress media URL)</label><input style={I.inp} value={brand.logoUrl} onChange={e => updBrand("logoUrl", e.target.value)} placeholder="https://yoursite.com/wp-content/uploads/logo.png" /></div>
                <div><label style={I.lbl}>Logo Text Fallback</label><input style={I.inp} value={brand.logoText} onChange={e => updBrand("logoText", e.target.value)} placeholder="Your business name" /></div>
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={I.lbl}>Primary CTA</label><input style={I.inp} value={brand.cta1} onChange={e => updBrand("cta1", e.target.value)} placeholder="e.g. Book a call" /></div>
                  <div><label style={I.lbl}>Secondary CTA</label><input style={I.inp} value={brand.cta2} onChange={e => updBrand("cta2", e.target.value)} placeholder="e.g. View our work" /></div>
                </div>
                <div>
                  <label style={I.lbl}>Final CTA Heading (used in the bottom CTA section before footer)</label>
                  <input style={I.inp} value={page.ctaHeading} onChange={e => updPage("ctaHeading", e.target.value)} placeholder="e.g. Ready to ship better creative, faster?" />
                  <div style={{ fontSize: "10px", color: "#71717a", marginTop: "4px" }}>This is the big conversion heading on the homepage's bottom CTA section. Each page can have a different one.</div>
                </div>
                <div><label style={I.lbl}>Contact Email</label><input style={I.inp} value={brand.contactEmail} onChange={e => updBrand("contactEmail", e.target.value)} /></div>
                <div><label style={I.lbl}>Phone</label><input style={I.inp} value={brand.contactPhone} onChange={e => updBrand("contactPhone", e.target.value)} /></div>
              </Section>
              <Section id="brand-style-notes" title="Style Notes" icon="📝">
                <p style={{ fontSize: "12px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>Specific aesthetic principles you want applied — typography quirks, hierarchy preferences, ornamental rules, things you've seen and liked. Fed to the AI Draft Starter Copy as concrete style guidance.</p>
                <textarea
                  style={{ ...I.inp, resize: "vertical" }}
                  rows={5}
                  value={brand.styleNotes}
                  onChange={e => updBrand("styleNotes", e.target.value)}
                  placeholder="e.g. Lowercase navigation, dramatic numbered sections, generous negative space, all-caps eyebrow labels, dark background with one bold accent color, work-first hierarchy."
                />
              </Section>
              </div>}
            </div>
              <Section id="brand-assets" title="Brand Assets — Clients & Founder" icon="📦">
                <div>
                  <label style={I.lbl}>Client Logos / Brands Worked With (one per line)</label>
                  <textarea style={{ ...I.inp, resize: "vertical", fontSize: "12px" }} rows={5} value={brand.clientLogos} onChange={e => updBrand("clientLogos", e.target.value)} placeholder="Sephora&#10;Glossier&#10;Kérastase" />
                  <div style={{ fontSize: "10px", color: "#71717a", marginTop: "4px" }}>Used in the Logo Carousel section and as context for the AI when drafting copy.</div>
                </div>
                
              </Section>
            </>
          )}

          {/* PAGE TAB */}
          {tab === "page" && (
            <>
              <Section id="page-setup" title="Page Setup" icon="📄">
                <div><label style={I.lbl}>Page Name</label><input style={I.inp} value={page.name} onChange={e => updPage("name", e.target.value)} /></div>
                <div><label style={I.lbl}>Page Type</label><select style={I.inp} value={page.pageType} onChange={e => updPage("pageType", e.target.value)}>{PAGE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              </Section>
              <Section id="page-nav" title="Navigation Menus" icon="🧭">
                <p style={{ fontSize: "12px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>Header and footer menu items. Menus output as Elementor Nav Menu widgets linked to WordPress menus by name — create matching menus in WP → Appearance → Menus.</p>
                <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#27272a" }}>
                  <input type="checkbox" checked={brand.multiMenu} onChange={e => updBrand("multiMenu", e.target.checked)} style={{ accentColor: "#000000" }} /> Enable multi-menu (primary + utility)
                </label>
                <div><label style={I.lbl}>Primary Menu (comma-separated)</label><input style={I.inp} value={brand.primaryMenu} onChange={e => updBrand("primaryMenu", e.target.value)} placeholder="Home, About, Services, Work, Contact" /></div>
                {brand.multiMenu && <div><label style={I.lbl}>Utility Menu (footer/legal)</label><input style={I.inp} value={brand.utilityMenu} onChange={e => updBrand("utilityMenu", e.target.value)} placeholder="Privacy, Terms, Sitemap" /></div>}
              </Section>
              <Section id="page-sections" title="Sections on this Page" icon="🧩">
                <p style={{ fontSize: "12px", color: "#52525b", margin: 0, lineHeight: 1.55 }}>Compose the page top to bottom. Tap a section in the library to add it to the outline. Tap the × to remove.</p>
                <div style={{ background: "#ffffff", border: "1px solid #e7e7e4", borderRadius: "10px", padding: "22px 24px" }}>
                  {/* PAGE OUTLINE — selected sections in order */}
                  <div style={{ fontSize: "9px", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, marginBottom: "12px" }}>
                    Page Outline {page.sections.length > 0 && <span style={{ color: "#a3a39e" }}>· {page.sections.length} {page.sections.length === 1 ? "section" : "sections"}</span>}
                  </div>
                  {page.sections.length === 0 ? (
                    <div style={{ padding: "20px 16px", background: "#f5f5f4", border: "1px dashed #d6d6d2", borderRadius: "8px", textAlign: "center", fontSize: "12px", color: "#71717a", marginBottom: "24px" }}>
                      No sections added yet. Tap a section from the library below to start composing this page.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
                      {page.sections.map((s, i) => (
                        <div key={`${s}-${i}`} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "#f9f9f7", border: "1px solid #e7e7e4", borderRadius: "8px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "#09090b", fontVariantNumeric: "tabular-nums", minWidth: "20px", letterSpacing: "0.02em" }}>{String(i + 1).padStart(2, "0")}</span>
                          <span style={{ flex: 1, fontSize: "13px", color: "#09090b", fontWeight: 500 }}>{s}</span>
                          <button
                            onClick={() => toggleSection(s)}
                            title={`Remove ${s}`}
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", color: "#71717a", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", transition: "color 0.15s, background 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.color = "#c93939"; e.currentTarget.style.background = "#fef2f2"; }}
                            onMouseOut={e => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "transparent"; }}>
                            <Icon name="x" size={14} color="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: "1px", background: "#e7e7e4", marginBottom: "18px" }} />

                  {/* AVAILABLE LIBRARY — unselected sections as add pills */}
                  <div style={{ fontSize: "9px", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, marginBottom: "12px" }}>Available Sections</div>
                  {(() => {
                    const allOptions = SECTION_OPTIONS.filter((v, i, a) => a.indexOf(v) === i);
                    const available = allOptions.filter(s => !page.sections.includes(s));
                    if (available.length === 0) {
                      return <div style={{ fontSize: "12px", color: "#71717a", fontStyle: "italic" }}>All sections added.</div>;
                    }
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {available.map(s => (
                          <button
                            key={s}
                            onClick={() => toggleSection(s)}
                            style={{ fontSize: "12px", padding: "7px 12px", background: "#ffffff", border: "1px solid #e7e7e4", borderRadius: "999px", color: "#27272a", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "4px", transition: "border-color 0.15s, background 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = "#000000"; e.currentTarget.style.background = "#f9f9f7"; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = "#e7e7e4"; e.currentTarget.style.background = "#ffffff"; }}>
                            <Icon name="plus" size={11} color="#52525b" /> {s}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </Section>
            </>
          )}

          {/* CONTENT TAB */}
          {tab === "content" && (
            <>
              <Section id="page-hero" title="Hero" icon="🚀">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Shows at the very top of the page — the first thing visitors see when they arrive.</p>
                <div><label style={I.lbl}>Hero Heading</label><input style={I.inp} value={page.heroHeading} onChange={e => updPage("heroHeading", e.target.value)} /></div>
                <div><label style={I.lbl}>Hero Subhead</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={page.heroSubhead} onChange={e => updPage("heroSubhead", e.target.value)} /></div>
                <div><label style={I.lbl}>Hero Image URL (WordPress media URL)</label><input style={I.inp} value={page.heroImage} onChange={e => updPage("heroImage", e.target.value)} placeholder="https://yoursite.com/wp-content/uploads/hero.jpg" /></div>
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Leave empty to use a placeholder photo. Paste your WordPress media URL when ready.</p>
              </Section>
              <Section id="page-about" title="About" icon="📖">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>A story section that typically sits below the hero or after a logo carousel. Usually image-and-text side by side.</p>
                <div><label style={I.lbl}>About Heading</label><input style={I.inp} value={page.aboutHeading} onChange={e => updPage("aboutHeading", e.target.value)} /></div>
                <div><label style={I.lbl}>About Body</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={4} value={page.aboutBody} onChange={e => updPage("aboutBody", e.target.value)} placeholder="Leave blank to use brand description" /></div>
                <div><label style={I.lbl}>About Image URL (WordPress media URL)</label><input style={I.inp} value={page.aboutImage} onChange={e => updPage("aboutImage", e.target.value)} placeholder="https://yoursite.com/wp-content/uploads/about.jpg" /></div>
              </Section>
              <Section id="content-services" title="Services — Title|Description per line" icon="⚙️">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Mid-page grid or list showing what you offer. Typically follows the hero/about, before portfolio.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={5} value={page.services} onChange={e => updPage("services", e.target.value)} />
              </Section>
              <Section id="content-portfolio" title="Portfolio — Title|Category|ImageURL per line" icon="🖼️">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Visual showcase of past work — usually a grid or carousel of project cards.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={6} value={page.portfolio} onChange={e => updPage("portfolio", e.target.value)} placeholder={"Sephora Spring Campaign|Beauty Editorial|https://yoursite.com/wp-content/uploads/sephora.jpg\nKérastase Hero|Product Photography|"} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Add your WordPress image URL as the 3rd field. Leave the URL blank (keep the trailing pipe) to use a placeholder photo.</p>
              </Section>
              <Section id="content-process" title="Process — Step Title|Description per line" icon="🔄">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Step-by-step breakdown of how you work. Often appears between services and testimonials.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={5} value={page.process} onChange={e => updPage("process", e.target.value)} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Numbered automatically. Best on About, Services, Careers pages.</p>
              </Section>
              <Section id="content-team" title="Team — Name|Role|ImageURL per line" icon="👥">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Grid of team member cards (portrait + name + role). Usually on About pages.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={5} value={page.team} onChange={e => updPage("team", e.target.value)} placeholder={"Kalei|Founder & Creative Director|https://yoursite.com/wp-content/uploads/kalei.jpg\nLena|Producer|"} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Used by both "Team" (grid) and "Team Carousel" sections. Best on About, Studio, Careers pages.</p>
              </Section>
              <Section id="content-leadership" title="Leadership — Name|Title|ImageURL|Quote|Bio per line" icon="⭐">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Large editorial profiles for founders or principals. Typically on About / Leadership pages.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={4} value={page.leaders || ""} onChange={e => updPage("leaders", e.target.value)} placeholder={"Kalei|Founder & Creative Director|https://...|Great content lives at the intersection of strategy and craft.|10+ years producing premium content for L'Oréal Group brands."} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>Renders as a magazine-style 2-column profile per leader — large portrait, name, title, pulled quote, full bio. Image position alternates left/right when you have multiple leaders. Best for founder pages, About, leadership directory.</p>
              </Section>
              <Section id="content-stats" title="Stats — Number|Suffix|Label per line" icon="📊">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Strip of big numbers — years in business, projects shipped, clients served. Often above testimonials.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={4} value={page.stats} onChange={e => updPage("stats", e.target.value)} />
              </Section>
              <Section id="content-testimonials" title="Testimonials — Quote|Name|Role per line" icon="💬">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Carousel or grid of client quotes. Usually near the bottom of the homepage, before the final CTA.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={4} value={page.testimonials} onChange={e => updPage("testimonials", e.target.value)} />
              </Section>
              <Section id="content-pricing" title="Pricing — Tier|Price|Description per line" icon="💰">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Pricing tiers shown as side-by-side cards. Usually on Services, Landing, or Shop pages.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={4} value={page.pricing} onChange={e => updPage("pricing", e.target.value)} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Leave empty to skip — best on Services, Landing, Shop pages.</p>
              </Section>
              <Section id="content-faq" title="FAQ — Question|Answer per line" icon="❓">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Accordion of common questions. Usually toward the bottom of the page, after testimonials.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={4} value={page.faq} onChange={e => updPage("faq", e.target.value)} />
              </Section>
              <Section id="content-video" title="Video URL (YouTube/Vimeo)" icon="🎬">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Embedded video block. Can sit anywhere — often between hero and about, or in a process section.</p>
                <input style={I.inp} value={page.videoUrl} onChange={e => updPage("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
              </Section>
              <Section id="content-forms" title="Forms — Title|Fields|Button|Shortcode (optional) per line" icon="📝">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Contact form section. Usually appears near the bottom of the page, before the footer.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={5} value={page.forms} onChange={e => updPage("forms", e.target.value)} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: "#27272a" }}>Built-in form:</strong> Project Inquiry|Name,Email,Message|Send<br />
                  <strong style={{ color: "#27272a" }}>With form plugin:</strong> Project Inquiry|||[wpforms id="123"]<br />
                  Add a 4th field with your plugin's shortcode (WPForms, Contact Form 7, Gravity Forms, Fluent Forms, Ninja Forms, etc.) and the tool will use that instead. Leave fields/button empty when using a shortcode.
                </p>
              </Section>
              <Section id="content-blog" title="Blog Posts Preview" icon="📰">
                <p style={{ fontSize: "11px", color: "#52525b", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>Preview cards for recent posts. Usually on the homepage near the bottom, or as the main grid on a Blog Index page.</p>
                <p style={{ fontSize: "12px", color: "#27272a", margin: 0, lineHeight: 1.6 }}>
                  This is for the <strong>preview cards</strong> that show on the homepage or a blog index page — not for writing actual blog posts. Each line becomes a card with title, category, and read-time meta. Write the real posts inside WordPress later.
                </p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }} rows={5} value={page.blog} onChange={e => updPage("blog", e.target.value)} placeholder={"How we approach hero shots|Strategy|6 min read\nThe ROI of premium content|Insights|4 min read"} />
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Format: <code style={{ background: "#eeeeec", padding: "1px 4px", borderRadius: "3px" }}>Title|Category|Meta</code> per line. Best on Journal, Blog Index pages. Placeholder images auto-applied.</p>
              </Section>
            </>
          )}

          {/* SOCIAL TAB */}
          {tab === "social" && (
            <>
              <Section id="social-links" title="Social Media Links" icon="📱">
                {brand.socialLinks.map((s, i) => (
                  <div key={i} className="responsive-4col" style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 30px", gap: "8px", alignItems: "end" }}>
                    <select style={I.inp} value={s.key} onChange={e => updSocial(i, "key", e.target.value)}>
                      {Object.keys(SVG).map(k => <option key={k}>{k}</option>)}
                    </select>
                    <input style={I.inp} value={s.label} onChange={e => updSocial(i, "label", e.target.value)} placeholder="Label" />
                    <input style={I.inp} value={s.url} onChange={e => updSocial(i, "url", e.target.value)} placeholder="URL" />
                    <button onClick={() => delSocial(i)} style={{ ...I.btnGhost, padding: "8px" }}>×</button>
                  </div>
                ))}
                <button onClick={addSocial} style={{ ...I.btnGhost, alignSelf: "start" }}>+ Add Social</button>
                <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#27272a" }}><input type="checkbox" checked={brand.showSocialInNav} onChange={e => updBrand("showSocialInNav", e.target.checked)} style={{ accentColor: "#000000" }} /> Show icons in top navigation</label>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#27272a" }}><input type="checkbox" checked={brand.showSocialInPage} onChange={e => updBrand("showSocialInPage", e.target.checked)} style={{ accentColor: "#000000" }} /> Show as a section while scrolling (requires "Social" section enabled)</label>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#27272a" }}><input type="checkbox" checked={brand.showSocialInFooter} onChange={e => updBrand("showSocialInFooter", e.target.checked)} style={{ accentColor: "#000000" }} /> Show in footer</label>
                </div>
              </Section>
            </>
          )}

          {/* FOOTER TAB */}
          {tab === "footer" && (
            <>
              <Section id="footer-header" title="Header Style" icon="⬆">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px" }}>
                  {HEADER_STYLES.map(f => (
                    <button key={f} onClick={() => updBrand("headerStyle", f)} style={{ padding: "16px", background: "#ffffff", border: brand.headerStyle === f ? "2px solid #000000" : "1px solid #e5e7eb", color: "#000000", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }} onMouseOver={e => { if (brand.headerStyle !== f) e.currentTarget.style.borderColor = "#a3a39e"; }} onMouseOut={e => { if (brand.headerStyle !== f) e.currentTarget.style.borderColor = "#e7e7e4"; }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>{f}</div>
                      <div style={{ fontSize: "11px", color: "#52525b" }}>
                        {f === "Editorial" && "Logo left, nav center, social right"}
                        {f === "Studio" && "Centered logo with nav below — masthead"}
                        {f === "Agency" && "Logo left, nav + social right"}
                        {f === "Premium" && "Logo, nav, social + CTA button"}
                      </div>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Download separately and import once in Elementor → Theme Builder → Header. Set display conditions to "Entire Site".</p>
              </Section>
              <Section id="footer-footer" title="Footer Style" icon="⬇">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px" }}>
                  {FOOTER_STYLES.map(f => (
                    <button key={f} onClick={() => updBrand("footerStyle", f)} style={{ padding: "16px", background: "#ffffff", border: brand.footerStyle === f ? "2px solid #000000" : "1px solid #e5e7eb", color: "#000000", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }} onMouseOver={e => { if (brand.footerStyle !== f) e.currentTarget.style.borderColor = "#a3a39e"; }} onMouseOut={e => { if (brand.footerStyle !== f) e.currentTarget.style.borderColor = "#e7e7e4"; }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>{f}</div>
                      <div style={{ fontSize: "11px", color: "#52525b" }}>
                        {f === "Editorial" && "Minimal centered — logo, social, copyright"}
                        {f === "Studio" && "Centered with nav links"}
                        {f === "Agency" && "3-column with menu and contact"}
                        {f === "Premium" && "4-column full with services, follow, legal"}
                      </div>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Download separately and import once in Elementor → Theme Builder → Footer. Set to display on all pages.</p>
              </Section>
            </>
          )}
        </div>

        {/* EXPORT & IMPORT TAB */}
        {tab === "export" && (
          <div className="editor-padding" style={{ padding: "0 20px 40px", maxWidth: "900px" }}>
            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Active Page</div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "#18181b", marginBottom: "4px" }}>{page.name}</div>
              <div style={{ fontSize: "13px", color: "#52525b" }}>{page.sections.length} section{page.sections.length !== 1 ? "s" : ""}</div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Download</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                <button onClick={downloadPage} style={{ padding: "10px 16px", background: "#000000", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="download" size={14} color="#ffffff" /> Download Template
                </button>
                <button onClick={downloadHeader} style={{ padding: "10px 16px", background: "transparent", color: "#18181b", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="download" size={14} color="#18181b" /> Header Template
                </button>
                <button onClick={downloadFooter} style={{ padding: "10px 16px", background: "transparent", color: "#18181b", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="download" size={14} color="#18181b" /> Footer Template
                </button>
              </div>
              <div style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>What you'll get</div>
              <div style={{ fontSize: "13px", color: "#27272a", lineHeight: 1.7 }}>
                {exportFormat === "elementor" ? (
                  <><strong style={{ color: "#18181b" }}>Page JSON</strong> — Elementor template using native widgets (Heading, Text, Button, Icon Box, Image, Counter, Testimonial, Accordion, Social Icons, Video, Form).<br /><br />
                  <strong style={{ color: "#18181b" }}>Footer Template</strong> — separate Theme Builder template. Import once under Theme Builder → Footer.</>
                ) : (
                  <><strong style={{ color: "#18181b" }}>Page JSON</strong> — Divi layout using native modules (et_pb_text, et_pb_button, et_pb_blurb, et_pb_image, et_pb_number_counter, et_pb_testimonial, et_pb_accordion, et_pb_social_media_follow, et_pb_video, et_pb_contact_form).<br /><br />
                  <strong style={{ color: "#18181b" }}>Footer Template</strong> — separate Divi layout. Import via Theme Builder or insert into a Global Footer template.</>
                )}
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px" }}>
              <div style={{ fontSize: "11px", color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>How to import — {exportFormat === "divi" ? "Divi" : "Elementor"}</div>
              {exportFormat === "elementor" ? (
                <ol style={{ fontSize: "13px", color: "#27272a", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
                  <li>WordPress → Templates → Saved Templates</li>
                  <li>Click <em>Import Templates</em>, upload the .json</li>
                  <li>Edit your existing page with Elementor</li>
                  <li>Click the gray folder icon → My Templates → Insert</li>
                  <li>For footer: Templates → Theme Builder → Footer → Add New → Import</li>
                </ol>
              ) : (
                <ol style={{ fontSize: "13px", color: "#27272a", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
                  <li>WordPress → Divi → Divi Library</li>
                  <li>Click <em>Import & Export</em> → Import tab → upload the .json</li>
                  <li>Edit your existing page with the Divi Builder</li>
                  <li>Click <em>Load From Library</em> → Your Saved Layouts → Use This Layout</li>
                  <li>For footer: Divi → Theme Builder → Add Global Footer → Build From Scratch → Load From Library</li>
                </ol>
              )}
            </div>
          </div>
        )}

        {/* Workflow Back/Next navigation — visible on every tab */}
        {(() => {
          const idx = TAB_ORDER.findIndex(t => t.id === tab);
          if (idx === -1) return null;
          const prev = idx > 0 ? TAB_ORDER[idx - 1] : null;
          const next = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;
          return (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "24px 20px", marginTop: "30px", borderTop: "1px solid #e5e7eb", flexWrap: "wrap" }}>
              {prev ? (
                <button
                  onClick={() => setTab(prev.id)}
                  style={{ padding: "12px 18px", background: "#ffffff", color: "#000000", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon name="arrowLeft" size={14} color="#000000" /> Back to {prev.label}
                </button>
              ) : <div />}
              <div style={{ fontSize: "11px", color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
                Step {idx + 1} of {TAB_ORDER.length}
              </div>
              {next ? (
                <button
                  onClick={() => setTab(next.id)}
                  style={{ padding: "12px 20px", background: "#000000", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  Next: {next.label} <Icon name="arrowRight" size={14} color="#ffffff" />
                </button>
              ) : (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#000000", fontWeight: 500 }}>
                  <Icon name="check" size={14} color="#000000" /> End of workflow
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
