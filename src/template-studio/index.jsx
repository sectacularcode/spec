import { useState, useMemo, useEffect } from "react";

// Constants
import { PAGE_TYPES, SECTION_OPTIONS, TONES, FOOTER_STYLES, HEADER_STYLES, FONT_OPTIONS } from "./constants/ui.jsx";
import { THEMES } from "./constants/themes.js";
import { LAYOUTS, getLayout, eyebrowText } from "./constants/layouts.js";
import { WEBSITE_TEMPLATES, PAGE_TEMPLATES, BLANK_BRAND, newPage, applyWebsiteTemplate, applyTheme, layoutHeaderStyle, layoutFooterStyle } from "./constants/templates.js";

// Utils
import { luminance, contrastRatio, isLight, textOn, mutedTextOn, subtleTextOn, buttonOn } from "./utils/colors.js";
import { IMAGE_LIBRARY, pickImage, imgOrPlaceholder } from "./utils/images.js";
import { SVG } from "./utils/svg.js";
import { auditBrand } from "./utils/audit.js";
import { he } from "./utils/htmlEscape.js";

// Builders
import { uid, eContainer, eSection, eRow, eCol, rPx, eHead, eTxt, eBtn, eSpacer, eImg, eIconBox, eCounter, eAccordion, eSocial, eVideo, eCarousel, eForm, eNavMenu, eShortcode, eHTML, eMarquee } from "./builders/helpers.js";
import { buildPageJSON } from "./builders/buildPageJSON.js";
import { buildHeaderJSON } from "./builders/buildHeaderJSON.js";
import { buildFooterJSON } from "./builders/buildFooterJSON.js";
import { buildDiviPage } from "./builders/buildDiviPage.js";
import { buildDiviFooter } from "./builders/buildDiviFooter.js";

// Preview
import { previewHTML } from "./preview/previewHTML.js";

// Components
import { Section } from "./components/Section.jsx";
import { Icon } from "./components/Icon.jsx";

// Tab components
import DiscoveryTab from "./components/tabs/DiscoveryTab.jsx";
import PositioningTab from "./components/tabs/PositioningTab.jsx";
import BrandTab from "./components/tabs/BrandTab.jsx";
import ContentTab from "./components/tabs/ContentTab.jsx";
import SocialTab from "./components/tabs/SocialTab.jsx";
import HeaderFooterTab from "./components/tabs/HeaderFooterTab.jsx";
import ExportTab from "./components/tabs/ExportTab.jsx";

// Styles
import { I } from "./styles.js";

export default function App({ userId } = {}) {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(function(){try{return localStorage.getItem("spec_activeId")||"";}catch(e){return "";}});
  const [view, setView] = useState(function(){try{return localStorage.getItem("spec_view")||"projects";}catch(e){return "projects";}});
  useEffect(() => { const h = () => setView("projects"); window.addEventListener("spec-go-projects", h); return () => window.removeEventListener("spec-go-projects", h); }, []);
  const [mobilePreviewTS, setMobilePreviewTS] = useState(false);
  const TAB_ORDER = [
  { id: "discovery",   label: "Discovery" },
  { id: "positioning", label: "Positioning" },
  { id: "brand",       label: "Visual" },
  { id: "content",     label: "Content" },
  { id: "social",      label: "Social" },
  { id: "footer",      label: "Header & Footer" },
  { id: "export",      label: "Export & Import" },
];

const [tab, setTab] = useState(function(){try{return localStorage.getItem("spec_tab")||"discovery";}catch(e){return "discovery";}});
  const [pageIdx, setPageIdx] = useState(function(){try{return parseInt(localStorage.getItem("spec_pageIdx")||"0",10);}catch(e){return 0;}});
  const [showAudit, setShowAudit] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);
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
  const [showAdvancedColors, setShowAdvancedColors] = useState(false);
  const [briefDirty, setBriefDirty] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(() => { try { return !!window.localStorage.getItem("sw"); } catch(e) { return false; } });
  const [importMsg, setImportMsg] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // project id pending delete confirmation
  const [savedBuilds, setSavedBuilds] = useState([]); // Blueprint builds saved to library
  const [libraryFilter, setLibraryFilter] = useState({ visual: "", industry: "" }); // browser filters

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lsRaw = (() => { try { return localStorage.getItem("projects"); } catch(e2) { return null; } })();
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

                    // Migration: strip old branded demo copy that was hardcoded in
                    // PAGE_TEMPLATES before the refactor (e.g. "Sephora Spring Campaign 2026").
                    // These strings should never appear as real client content.
                    const brandedStrings = [
                      "Sephora Spring Campaign 2026",
                      "How we produced a 12-asset launch in 14 days.",
                      "Sephora needed a complete spring campaign",
                      "Clinique Spring Launch",
                      "Nike Air Max Launch",
                      "Glossier Brand Film",
                      "Apple Studio Series",
                      "Spotify Wrapped",
                      "Airbnb Belonging",
                      "DoorDash Local",
                      "How we scaled Sephora",
                      "By Kalei Lagunero",
                    ];
                    const fieldsToClear = ["heroHeading","heroSubhead","aboutHeading","aboutBody","portfolio","blog","stats"];
                    fieldsToClear.forEach(field => {
                      if (pg[field] && brandedStrings.some(s => pg[field].includes(s))) {
                        pg[field] = "";
                      }
                    });
                  });
                }
              });
              setProjects(parsed);
              var sid=null;try{sid=localStorage.getItem("spec_activeId");}catch(e){}
              setActiveId(sid&&parsed.find(function(x){return x.id===sid;})?sid:parsed[0].id);
            }
          }
        } else if (lsRaw) {
          try {
            const lsParsed = JSON.parse(lsRaw);
            if (Array.isArray(lsParsed) && lsParsed.length > 0 && !cancelled) {
              setProjects(lsParsed);
              var sid2=null;try{sid2=localStorage.getItem("spec_activeId");}catch(e){}
              setActiveId(sid2&&lsParsed.find(function(x){return x.id===sid2;})?sid2:lsParsed[0].id);
            }
          } catch(e3) {}
        }
      } catch (e) {
        // No saved data or parse error — start with empty projects list
      } finally {
        if (!cancelled) setStorageLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(function(){if(!storageLoaded)return;try{if(activeId)localStorage.setItem("spec_activeId",activeId);localStorage.setItem("spec_view",view);localStorage.setItem("spec_tab",tab);localStorage.setItem("spec_pageIdx",String(pageIdx));}catch(e){}}, [activeId,view,tab,pageIdx,storageLoaded]);

  // Save projects to storage whenever they change (after initial load)
  useEffect(() => {
    if (!storageLoaded) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        try { localStorage.setItem("projects", JSON.stringify(projects)); } catch(e) {}
        if (typeof window !== "undefined" && window.storage && !cancelled) {
          await window.storage.set("projects", JSON.stringify(projects));
        }
      } catch (e) {
        // Storage write failed — fail silently, user can export to file as backup
      }
    }, 600); // debounce
    return () => { cancelled = true; clearTimeout(timer); };
  }, [projects, storageLoaded]);

  // Load Blueprint saved builds from storage
  useEffect(() => {
    async function loadSavedBuilds() {
      if (typeof window === "undefined" || !window.storage) return;
      try {
        const result = await window.storage.get("spec-template-library");
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          if (Array.isArray(parsed)) setSavedBuilds(parsed);
        }
      } catch(e) {}
    }
    loadSavedBuilds();
    // Poll every 10s so new Blueprint saves appear without a page refresh
    const interval = setInterval(loadSavedBuilds, 10000);
    return () => clearInterval(interval);
  }, []);

  const project = projects.find(p => p.id === activeId) || projects[0] || null;
  const brand = project ? project.brand : null;
  const page = project ? (project.pages[pageIdx] || project.pages[0]) : null;
  const audit = useMemo(() => project ? auditBrand(brand, project.pages) : [], [brand, project]);

  const updBrand = (k, v) => { setBriefDirty(true); return setProjects(ps => ps.map(p => p.id === activeId ? {
    ...p,
    brand: { ...p.brand, [k]: v },
    // When the business name changes, mirror it onto the project name so the
    // Projects page card label stays accurate (e.g. "Ben Papa Films" not "Untitled").
    ...(k === "name" ? { name: v || "Untitled" } : {}),
  } : p));
  };
  const updPage = (k, v) => setProjects(ps => ps.map(p => p.id === activeId ? { ...p, pages: p.pages.map((pg, i) => i === pageIdx ? { ...pg, [k]: v } : pg) } : p));

  const clearDemoContent = () => {
    setProjects(prev => {
      return prev.map(proj => {
        if (proj.id !== activeId) return proj;
        const updatedPages = proj.pages.map((pg, idx) => {
          if (idx !== pageIdx) return pg;
          return {
            ...pg,
            heroHeading: "", heroSubhead: "", heroImage: "",
            heroEyebrow: "",
            aboutHeading: "", aboutBody: "", aboutImage: "",
            aboutEyebrow: "",
            services: "", servicesHeading: "", servicesEyebrow: "",
            portfolio: "", portfolioHeading: "", portfolioEyebrow: "",
            process: "", processHeading: "", processEyebrow: "",
            leaders: "", leadershipEyebrow: "",
            stats: "",
            testimonials: "", testimonialsEyebrow: "",
            pricing: "", pricingHeading: "", pricingEyebrow: "",
            faq: "", faqHeading: "", faqEyebrow: "",
            blog: "", blogHeading: "", blogEyebrow: "",
            team: "", teamHeading: "", teamEyebrow: "",
            videoUrl: "",
            ctaHeading: "",
            forms: "",
          };
        });
        return { ...proj, pages: updatedPages };
      });
    });
  };

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
    setBriefDirty(false);
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
  "aboutBody": "80-130 words. First person if it's a solo brand, otherwise 'we'. Includes specific facts (years, numbers, types of clients served — never real brand names). Naturally uses at least one primary keyword. Reads like a human wrote it.",
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
${b.differentiator ? `What makes them different (use this to avoid generic copy — this is the core hook): ${b.differentiator}` : ""}
${b.description ? `Existing description for context: ${b.description}` : ""}
${b.inspoUrls ? `Inspiration sites (the user loves the aesthetic of these — match the voice and rhythm): ${b.inspoUrls.replace(/\n/g, ", ")}` : ""}
${b.styleNotes ? `Style notes (specific aesthetic principles to honor): ${b.styleNotes}` : ""}
${b.clientLogos ? `Notable context about this brand (use for tone and specificity only — never cite these as client names in the copy): ${b.clientLogos.replace(/\n/g, ", ")}` : ""}
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

      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(userId ? { "x-spec-user-id": userId } : {}) },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
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
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(userId ? { "x-spec-user-id": userId } : {}) },
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
    if (b.differentiator) ctx.push(`What makes them different: ${b.differentiator}`);
    if (b.clientLogos) ctx.push(`Client logos / past brands worked with: ${b.clientLogos.replace(/\n/g, ", ")}`);
    if (b.founderName) ctx.push(`Founder: ${b.founderName}${b.founderTitle ? `, ${b.founderTitle}` : ""}`);
    if (b.founderBio) ctx.push(`Founder bio: ${b.founderBio}`);
    const contextBlock = ctx.length
      ? `\n\nExisting context from this project (use it to refine your recommendation):\n${ctx.map(c => `- ${c}`).join("\n")}`
      : "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(userId ? { "x-spec-user-id": userId } : {}) },
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

  const addSocial = () => updBrand("socialLinks", [...(brand.socialLinks || []), { key: "instagram", label: "", url: "" }]);
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

  const downloadAll = async () => {
    try {
      // Dynamically load JSZip from CDN
      if (!window.JSZip) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const zip = new window.JSZip();
      const brandSlug = brand.name.replace(/\s+/g, "-").toLowerCase();
      const fmt = exportFormat;

      // Add all pages
      project.pages.forEach(pg => {
        const pageData = fmt === "divi" ? buildDiviPage(pg, brand) : buildPageJSON(pg, brand);
        const pageSlug = pg.name.replace(/\s+/g, "-").toLowerCase();
        zip.file(`${brandSlug}-${pageSlug}-${fmt}.json`, JSON.stringify(pageData, null, 2));
      });

      // Add header
      const headerData = fmt === "divi" ? buildDiviPage({ name: "Header", sections: [] }, brand) : buildHeaderJSON(brand);
      zip.file(`${brandSlug}-header-${fmt}.json`, JSON.stringify(headerData, null, 2));

      // Add footer
      const footerData = fmt === "divi" ? buildDiviFooter(brand) : buildFooterJSON(brand);
      zip.file(`${brandSlug}-footer-${fmt}.json`, JSON.stringify(footerData, null, 2));

      // Add a README
      const pageList = project.pages.map((pg, i) => `  ${i + 1}. ${pg.name} — ${brandSlug}-${pg.name.replace(/\s+/g, "-").toLowerCase()}-${fmt}.json`).join("\n");
      zip.file("README.txt", `${brand.name} — Spec Export\n${"=".repeat(40)}\nFormat: ${fmt === "divi" ? "Divi" : "Elementor"}\n\nPages:\n${pageList}\n\nHeader: ${brandSlug}-header-${fmt}.json\nFooter: ${brandSlug}-footer-${fmt}.json\n\nImport instructions:\n- Pages: WordPress → Templates → Saved Templates → Import\n- Header/Footer: WordPress → Templates → Theme Builder → Import`);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${brandSlug}-${fmt}-templates.zip`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    } catch (err) {
      alert("ZIP download failed: " + err.message);
    }
  };

  // Styles (I) imported from ./styles.js

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ padding: "6px 12px", background: tab === id ? "rgba(255,255,255,0.18)" : "transparent", color: "#ffffff", border: "none", borderRadius: "7px", fontSize: "12px", fontWeight: 700, cursor: "pointer", margin: "2px", whiteSpace: "nowrap" }}>{label}</button>
  );

  // Builder format toggle — applies to both Page and Footer downloads
  const FormatToggle = () => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px", padding: "3px", marginRight: "4px" }}>
      <span style={{ fontSize: "10px", color: "#a3a39e", padding: "0 6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Export</span>
      <button onClick={() => setExportFormat("elementor")} style={{ padding: "5px 10px", background: exportFormat === "elementor" ? "#b45309" : "transparent", color: exportFormat === "elementor" ? "#ffffff" : "#6b7280", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Elementor</button>
      <button onClick={() => setExportFormat("divi")} style={{ padding: "5px 10px", background: exportFormat === "divi" ? "#b45309" : "transparent", color: exportFormat === "divi" ? "#ffffff" : "#6b7280", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Divi</button>
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

  const shareBrief = () => {
    try {
      // Slim payload — only what the brief view needs, truncate long text
      const slim = {
        n: project.name,
        b: {
          nm: brand.name, tg: brand.tagline,
          ds: (brand.description || "").substring(0, 400),
          km: (brand.keyMessages || "").substring(0, 300),
          pc: brand.primaryColor, ac: brand.accentColor,
          hf: brand.headingFont, bf: brand.bodyFont,
          li: brand.layoutId, ti: brand.themeId,
          gl: brand.goals, ta: brand.targetAudience, tn: brand.tone,
          ce: brand.contactEmail, cp: brand.contactPhone,
          lu: brand.logoUrl, sl: brand.socialLinks,
        },
        pg: (project.pages || []).map(pg => ({
          nm: pg.name, sc: pg.sections,
          hh: pg.heroHeading, hs: pg.heroSubhead,
          ab: (pg.aboutBody || "").substring(0, 200),
        })),
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
      const url = `${window.location.origin}${window.location.pathname}#brief=${encoded}`;
      navigator.clipboard.writeText(url).then(() => {
        alert("Link copied! Send it to your client — no login needed.");
      }).catch(() => {
        window.prompt("Copy this link:", url);
      });
    } catch(e) {
      alert("Could not generate share link: " + e.message);
    }
  };

  const effectiveView = projects.length === 0 ? "projects" : view;

  // ── SHARED BRIEF VIEW — read-only, opened via shareBrief link ──────────────
  const sharedBriefData = (() => {
    try {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#brief=")) {
        const raw = JSON.parse(decodeURIComponent(escape(atob(hash.slice(7)))));
        // Handle slim key format (new) and full format (old)
        if (raw.b) {
          const b = raw.b;
          return {
            name: raw.n,
            brand: {
              name: b.nm, tagline: b.tg, description: b.ds, keyMessages: b.km,
              primaryColor: b.pc, accentColor: b.ac, headingFont: b.hf, bodyFont: b.bf,
              layoutId: b.li, themeId: b.ti, goals: b.gl, targetAudience: b.ta, tone: b.tn,
              contactEmail: b.ce, contactPhone: b.cp, logoUrl: b.lu, socialLinks: b.sl,
            },
            pages: (raw.pg || []).map(pg => ({
              name: pg.nm, sections: pg.sc,
              heroHeading: pg.hh, heroSubhead: pg.hs, aboutBody: pg.ab,
            })),
          };
        }
        return raw; // old full format
      }
    } catch(e) {}
    return null;
  })();

  if (sharedBriefData) {
    const sb = sharedBriefData.brand || {};
    const spages = sharedBriefData.pages || [];
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const slb = sb.socialLinks || [];
    const layoutB = LAYOUTS ? LAYOUTS.find(l => l.id === sb.layoutId) : null;
    const themeB = THEMES ? THEMES.find(t => t.id === sb.themeId) : null;
    return (
      <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize: "13px", color: "#18181b", background: "#fff", padding: "48px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "24px", borderBottom: "1px solid #e4e4e7", marginBottom: "32px" }}>
          <div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: "#09090b" }}>{sb.name || "Brand Brief"}</div>
            <div style={{ fontSize: "13px", color: "#71717a", marginTop: "4px" }}>{sb.description ? sb.description.substring(0, 100) + (sb.description.length > 100 ? "..." : "") : ""}</div>
          </div>
          <div style={{ fontSize: "11px", color: "#a1a1aa", textAlign: "right", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 600, color: "#52525b", letterSpacing: ".05em", textTransform: "uppercase" }}>Brand Brief</div>
            <div>{today}</div>
            <div>Generated by Spec</div>
            <div style={{ marginTop: "8px", fontSize: "10px", background: "#f4f4f5", padding: "3px 8px", borderRadius: "4px", color: "#71717a" }}>Read-only view</div>
          </div>
        </div>
        {sb.tagline && <div style={{ marginBottom: "32px" }}><div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "8px" }}>Tagline</div><div style={{ fontSize: "18px", fontWeight: 500, color: "#09090b" }}>{sb.tagline}</div></div>}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "12px" }}>Brand Identity</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {sb.primaryColor && <div><div style={{ fontSize: "11px", color: "#71717a", marginBottom: "2px" }}>Primary Color</div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "18px", height: "18px", borderRadius: "4px", border: "1px solid #e4e4e7", background: sb.primaryColor }} /><span>{sb.primaryColor}</span></div></div>}
            {sb.accentColor && <div><div style={{ fontSize: "11px", color: "#71717a", marginBottom: "2px" }}>Accent Color</div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "18px", height: "18px", borderRadius: "4px", border: "1px solid #e4e4e7", background: sb.accentColor }} /><span>{sb.accentColor}</span></div></div>}
            {sb.headingFont && <div><div style={{ fontSize: "11px", color: "#71717a", marginBottom: "2px" }}>Heading Font</div><div>{sb.headingFont}</div></div>}
            {sb.bodyFont && <div><div style={{ fontSize: "11px", color: "#71717a", marginBottom: "2px" }}>Body Font</div><div>{sb.bodyFont}</div></div>}
            {layoutB && <div><div style={{ fontSize: "11px", color: "#71717a", marginBottom: "2px" }}>Layout</div><div>{layoutB.name}</div></div>}
            {themeB && <div><div style={{ fontSize: "11px", color: "#71717a", marginBottom: "2px" }}>Theme</div><div>{themeB.name}</div></div>}
          </div>
        </div>
        {sb.description && <div style={{ marginBottom: "28px" }}><div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "8px" }}>About</div><div style={{ lineHeight: 1.7 }}>{sb.description}</div></div>}
        {sb.keyMessages && <div style={{ marginBottom: "28px" }}><div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "8px" }}>Key Messages</div><div style={{ lineHeight: 1.7 }}>{sb.keyMessages}</div></div>}
        {(sb.goals || []).length > 0 && <div style={{ marginBottom: "28px" }}><div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "8px" }}>Goals</div><div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{(sb.goals || []).map((g, i) => <span key={i} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: "#f4f4f5", color: "#52525b", border: "1px solid #e4e4e7" }}>{g}</span>)}</div></div>}
        {spages.length > 0 && <div style={{ marginBottom: "28px" }}><div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "12px" }}>Pages</div>{spages.map((pg, i) => (<div key={i} style={{ border: "1px solid #f4f4f5", borderRadius: "6px", padding: "12px 14px", marginBottom: "8px" }}><div style={{ fontSize: "13px", fontWeight: 500, color: "#09090b", marginBottom: "8px" }}>{pg.name}</div><div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>{(pg.sections || []).map((sec, j) => <span key={j} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", background: "#f4f4f5", color: "#71717a", border: "1px solid #e4e4e7" }}>{sec}</span>)}</div>{pg.heroHeading && <div style={{ fontSize: "12px", color: "#52525b", marginTop: "6px" }}><span style={{ fontSize: "10px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: ".05em", marginRight: "6px", fontWeight: 600 }}>Hero</span>{pg.heroHeading}</div>}{pg.aboutBody && <div style={{ fontSize: "12px", color: "#52525b", marginTop: "6px" }}><span style={{ fontSize: "10px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: ".05em", marginRight: "6px", fontWeight: 600 }}>About</span>{pg.aboutBody.substring(0, 120)}...</div>}</div>))}</div>}
        {slb.length > 0 && <div style={{ marginBottom: "28px" }}><div style={{ fontSize: "10px", fontWeight: 600, color: "#a1a1aa", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "8px" }}>Social</div><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{slb.map((s, i) => <span key={i} style={{ fontSize: "12px", color: "#52525b", background: "#fafafa", padding: "3px 10px", borderRadius: "4px", border: "1px solid #e4e4e7" }}>{s.label}: {s.url}</span>)}</div></div>}
        <div style={{ paddingTop: "24px", borderTop: "1px solid #e4e4e7", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div style={{ fontSize: "10px", color: "#a1a1aa" }}>Generated by Spec · {today}</div>
          <div style={{ fontSize: "10px", color: "#a1a1aa" }}>Read-only client brief</div>
        </div>
      </div>
    );
  }

  // ── PREVIEW VIEW ───────────────────────────────────────────────────────────

  if (effectiveView === "preview" && project) return (
    <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", flexDirection: "column", zIndex: 1000 }}>
      <div style={{ padding: "10px 16px", background: "#09090b", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ color: "#ffffff", fontSize: "14px", fontWeight: 500 }}>
            Preview — {brand.name} / {page.name}
            <span style={{ marginLeft: "12px", fontSize: "12px", color: "#a3a39e", fontWeight: 400 }}>Click any heading or paragraph to edit inline</span>
          </div>
          <div style={{ display: "flex", border: "1px solid #3f3f46", borderRadius: "6px", overflow: "hidden", flexShrink: 0 }}>
            <button onClick={() => setMobilePreviewTS(false)} style={{ padding: "5px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none", background: !mobilePreviewTS ? "#b45309" : "transparent", color: !mobilePreviewTS ? "#ffffff" : "#a3a39e", borderRight: "1px solid rgba(255,255,255,0.15)" }}>Desktop</button>
            <button onClick={() => setMobilePreviewTS(true)} style={{ padding: "5px 10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none", background: mobilePreviewTS ? "#b45309" : "transparent", color: mobilePreviewTS ? "#ffffff" : "#a3a39e" }}>Mobile</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <FormatToggle />
          <button onClick={downloadPage} style={{ padding: "8px 14px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Download Template</button>
          <button onClick={downloadHeader} style={{ padding: "8px 14px", background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Header Template</button>
          <button onClick={downloadFooter} style={{ padding: "8px 14px", background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Footer Template</button>
          {project.pages.length > 1 && <button onClick={downloadAll} style={{ padding: "8px 14px", background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Download All (.zip)</button>}
          <button onClick={() => setView("editor")} style={{ padding: "8px 14px", background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>← Back to Editor</button>
        </div>
      </div>
      {mobilePreviewTS ? (
        <div style={{ flex: 1, overflow: "auto", background: "#1a1a1a", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 0" }}>
          <iframe srcDoc={previewHTML(page, brand)} style={{ width: "390px", minHeight: "844px", border: "1px solid #3f3f46", borderRadius: "12px", flexShrink: 0, background: "#000", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }} title="Preview" sandbox="allow-same-origin allow-scripts" />
        </div>
      ) : (
        <iframe srcDoc={previewHTML(page, brand)} style={{ flex: 1, border: "none", width: "100%", background: "#000" }} title="Preview" sandbox="allow-same-origin allow-scripts" />
      )}
    </div>
  );

  // ── PROJECTS VIEW ──────────────────────────────────────────────────────────
  if (effectiveView === "projects") return (
    <div style={{ minHeight: "100vh", background: "#eeedf1", color: "#09090b", padding: "clamp(20px,5vw,40px) clamp(12px,3vw,24px)", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <style>{`
        
        @media(max-width:600px){
          input, textarea, select{font-size:16px !important;}
        }
      `}</style>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", margin: "0 0 6px", fontWeight: 200, letterSpacing: "0", color: "#09090b" }}>Projects</h1>
        <p style={{ color: "#09090b", fontSize: "14px", margin: "0 0 32px", lineHeight: 1.6 }}>Plan, spec, and export Elementor or Divi templates.</p>

        {/* AI Describe Your Site — optional guided start */}
        <div style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "12px", padding: "24px", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <Icon name="sparkles" size={18} color="#000000" />
            <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 200, color: "#09090b", letterSpacing: "0" }}>Describe your site — get a custom recommendation</h2>
          </div>
          <p style={{ fontSize: "13px", color: "#09090b", margin: "0 0 16px", lineHeight: 1.6 }}>
            
          </p>
          <div style={{ marginBottom: "10px" }}>
            
            <textarea
              value={briefText}
              onChange={e => setBriefText(e.target.value)}
              placeholder="e.g. A modern fitness coaching site for women over 40. Warm but no-nonsense. Earthy palette."
              style={{ width: "100%", minHeight: "80px", padding: "12px 14px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <select
              value={lockedTemplateId}
              onChange={e => setLockedTemplateId(e.target.value)}
              style={{ width: "100%", padding: "10px 40px 10px 12px", background: "#ffffff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 14px center", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", cursor: "pointer", outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none" }}>
              <option value="">Already know which template? Pick one (optional)</option>
              {WEBSITE_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.industry.split(/[,—]/)[0].trim().slice(0, 40)}</option>
              ))}
            </select>
            
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={describeMySite}
              disabled={briefLoading || (!briefText.trim() && !lockedTemplateId)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 18px",
                background: briefLoading ? "#b45309" : "#b45309",
                color: "#fff", border: "none", borderRadius: "8px",
                fontSize: "14px", fontWeight: 500,
                cursor: (briefLoading || (!briefText.trim() && !lockedTemplateId)) ? "not-allowed" : "pointer",
                opacity: (briefLoading || (!briefText.trim() && !lockedTemplateId)) ? 0.4 : 1,
              }}>
              <Icon name="sparkles" size={14} color="#fff" />
              {briefLoading ? "Analyzing…" : "Get my recommendation"}
            </button>
            {briefLoading && <span style={{ fontSize: "12px", color: "#000000", fontWeight: 500 }}>Picking template, layout, colors, fonts… usually 5–10 seconds.</span>}
          </div>
          {briefLoading && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", color: "#09090b", lineHeight: 1.6 }}>
              <div style={{ marginBottom: "4px", color: "#000000", fontWeight: 500 }}></div>
              
            </div>
          )}
          {briefError && (
            <div style={{ marginTop: "14px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", color: "#991b1b" }}>
              {briefError}
            </div>
          )}
        </div>

        {/* Blueprint Library — builds saved from Brief to Blueprint */}
        {savedBuilds.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>Blueprint Library</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>{savedBuilds.length} build{savedBuilds.length !== 1 ? "s" : ""} saved from Brief to Blueprint</div>
              </div>
              {/* Filter controls */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={libraryFilter.visual}
                  onChange={e => setLibraryFilter(f => ({ ...f, visual: e.target.value }))}
                  style={{ padding: "8px 36px 8px 12px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 12px center", color: "#09090b", cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", boxSizing: "border-box" }}>
                  <option value="">All visual styles</option>
                  {[...new Set(savedBuilds.flatMap(b => b.visualTags || []))].map(tag => (
                    <option key={tag} value={tag}>{tag.replace(/-/g, " ")}</option>
                  ))}
                </select>
                <select
                  value={libraryFilter.industry}
                  onChange={e => setLibraryFilter(f => ({ ...f, industry: e.target.value }))}
                  style={{ padding: "8px 36px 8px 12px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 12px center", color: "#09090b", cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", boxSizing: "border-box" }}>
                  <option value="">All industries</option>
                  {[...new Set(savedBuilds.flatMap(b => b.industryFit || []))].sort().map(ind => (
                    <option key={ind} value={ind}>{ind.replace(/-/g, " ")}</option>
                  ))}
                </select>
                {(libraryFilter.visual || libraryFilter.industry) && (
                  <button onClick={() => setLibraryFilter({ visual: "", industry: "" })} style={{ padding: "8px 12px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", color: "#6b7280", cursor: "pointer" }}>Clear</button>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {savedBuilds
                .filter(b => {
                  if (libraryFilter.visual && !(b.visualTags || []).includes(libraryFilter.visual)) return false;
                  if (libraryFilter.industry && !(b.industryFit || []).includes(libraryFilter.industry)) return false;
                  return true;
                })
                .map(build => {
                  var colors = build.colors || {};
                  var ink = colors.ink || "#1C1A17";
                  var bone = colors.bone || "#EDE7DB";
                  var brass = colors.brass || "#C2A35B";
                  var stone = colors.stone || "#8A8170";
                  return (
                    <div key={build.id} style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", overflow: "hidden" }}>
                      {/* Color swatch preview */}
                      <div style={{ height: "80px", background: ink, display: "flex", alignItems: "flex-end", padding: "12px 16px", gap: "6px" }}>
                        {Object.values(colors).slice(0, 6).map((hex, i) => (
                          <div key={i} title={hex} style={{ width: "20px", height: "20px", borderRadius: "50%", background: hex, border: "1px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                        ))}
                        {brass && <div style={{ width: "28px", height: "4px", background: brass, borderRadius: "2px", alignSelf: "center", marginLeft: "4px" }} />}
                      </div>
                      <div style={{ padding: "16px" }}>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b", marginBottom: "2px" }}>{build.client}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px" }}>{build.style} · {build.date}</div>
                        <div style={{ fontSize: "12px", color: "#09090b", lineHeight: 1.5, marginBottom: "12px" }}>{build.description}</div>
                        {/* Tags */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "12px" }}>
                          {(build.tags || []).slice(0, 4).map(tag => (
                            <span key={tag} style={{ fontSize: "11px", padding: "3px 8px", background: "#f4f4f5", borderRadius: "3px", color: "#09090b" }}>{tag.replace(/-/g, " ")}</span>
                          ))}
                        </div>
                        {/* Industry fit */}
                        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "12px" }}>
                          Fits: {(build.industryFit || []).slice(0, 4).map(i => i.replace(/-/g, " ")).join(", ")}
                          {(build.industryFit || []).length > 4 ? " +" + ((build.industryFit || []).length - 4) + " more" : ""}
                        </div>
                        {/* Pages */}
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "14px" }}>
                          {(build.pages || []).map(p => (
                            <span key={p.id} style={{ fontSize: "11px", padding: "2px 8px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "3px", color: "#15803d" }}>{p.label || p.id}</span>
                          ))}
                        </div>
                        {/* Actions */}
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => {
                              // Download all pages from this saved build
                              (build.pages || []).forEach((p, i) => {
                                setTimeout(() => {
                                  const blob = new Blob([JSON.stringify(p.data, null, 2)], { type: "application/json" });
                                  const a = document.createElement("a");
                                  a.href = URL.createObjectURL(blob);
                                  a.download = (build.client || "build").replace(/\s+/g, "-").toLowerCase() + "-" + p.id + ".json";
                                  a.click();
                                  URL.revokeObjectURL(a.href);
                                }, i * 300);
                              });
                            }}
                            style={{ flex: 1, padding: "9px 0", fontSize: "12px", fontWeight: 600, background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                            Download Pages
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.storage) return;
                              try {
                                const result = await window.storage.get("spec-template-library");
                                if (!result || !result.value) return;
                                const existing = JSON.parse(result.value);
                                const updated = existing.filter(b => b.id !== build.id);
                                await fetch("/api/storage", { method: "POST", headers: { "Content-Type": "application/json", ...(userId ? { "x-spec-user-id": userId } : {}) }, body: JSON.stringify({ action: "set", key: "spec-template-library", value: JSON.stringify(updated) }) });
                                setSavedBuilds(updated);
                              } catch(e) {}
                            }}
                            style={{ padding: "9px 12px", fontSize: "12px", fontWeight: 500, background: "#fff", color: "#6b7280", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            {savedBuilds.filter(b => {
              if (libraryFilter.visual && !(b.visualTags || []).includes(libraryFilter.visual)) return false;
              if (libraryFilter.industry && !(b.industryFit || []).includes(libraryFilter.industry)) return false;
              return true;
            }).length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "13px", border: "1px dashed #dde0e6", borderRadius: "8px" }}>
                No builds match these filters.
              </div>
            )}
          </div>
        )}

        {briefRec && (
          <div style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "12px", padding: "32px 36px", marginBottom: "28px" }}>
            {/* Header row — template name + action buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "16px", flexWrap: "wrap", paddingBottom: "24px", borderBottom: "1px solid #dde0e6" }}>
              <div style={{ flex: "1 1 280px" }}>
                <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "6px" }}>Recommended Template</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#09090b", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: briefRec.templateReason ? "8px" : 0 }}>{WEBSITE_TEMPLATES.find(t => t.id === briefRec.templateId)?.name || briefRec.templateId}</div>
                {briefRec.templateReason && <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.55 }}>{briefRec.templateReason}</div>}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={applyBriefRecommendation} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#6b635c", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  <Icon name="check" size={14} color="#fff" /> Create this project
                </button>
                <button onClick={describeMySite} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  <Icon name="refresh" size={14} color="#09090b" /> Regenerate
                </button>
                <button onClick={() => setBriefRec(null)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                  Discard
                </button>
              </div>
            </div>

            {/* Tagline pull-quote (if present) */}
            {briefRec.tagline && (
              <div style={{ marginBottom: "28px", paddingBottom: "24px", borderBottom: "1px solid #dde0e6" }}>
                <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>The Brief</div>
                <div style={{ fontSize: "16px", color: "#09090b", fontStyle: "italic", lineHeight: 1.45, letterSpacing: "-0.01em", fontWeight: 500 }}>"{briefRec.tagline.replace(/^["']|["']$/g, "")}"</div>
              </div>
            )}

            {/* Spec sheet — 2-column masthead grid */}
            <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 36px" }}>
              {/* Layout */}
              {briefRec.layoutId && (
                <div>
                  <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Layout</div>
                  <div style={{ fontSize: "16px", color: "#09090b", fontWeight: 700, marginBottom: "6px", letterSpacing: "-0.015em" }}>{LAYOUTS.find(l => l.id === briefRec.layoutId)?.name || briefRec.layoutId}</div>
                  {briefRec.layoutReason && <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.55 }}>{briefRec.layoutReason}</div>}
                </div>
              )}

              {/* Palette with visual swatches */}
              {(briefRec.customColors || briefRec.themeId) && (
                <div>
                  <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Palette</div>
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
                        <div key={i} style={{ width: "24px", height: "24px", background: c, border: "1px solid #dde0e6", borderRadius: "4px" }} />
                      ));
                    })()}
                    <span style={{ fontSize: "16px", color: "#09090b", fontWeight: 700, marginLeft: "4px", letterSpacing: "-0.015em" }}>
                      {briefRec.customColors ? "Custom colors" : (THEMES.find(t => t.id === briefRec.themeId)?.name || briefRec.themeId)}
                    </span>
                  </div>
                  {briefRec.themeReason && <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.55 }}>{briefRec.themeReason}</div>}
                </div>
              )}

              {/* Typography with rendered sample */}
              {briefRec.headingFont && (
                <div>
                  <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Typography</div>
                  <div style={{ fontSize: "22px", color: "#09090b", fontFamily: `'${briefRec.headingFont}', Georgia, serif`, lineHeight: 1.1, marginBottom: "4px", fontWeight: 500 }}>{briefRec.headingFont}</div>
                  <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.55 }}>
                    Display heading{briefRec.bodyFont ? ` — paired with ${briefRec.bodyFont} for body` : ""}.{briefRec.fontReason ? ` ${briefRec.fontReason}` : ""}
                  </div>
                </div>
              )}

              {/* Goals */}
              {((Array.isArray(briefRec.goals) && briefRec.goals.length) || briefRec.goal) && (
                <div>
                  <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Goals</div>
                  <div style={{ fontSize: "14px", color: "#09090b", lineHeight: 1.6, fontWeight: 500 }}>
                    {(Array.isArray(briefRec.goals) && briefRec.goals.length ? briefRec.goals : [briefRec.goal]).join(" · ")}
                  </div>
                </div>
              )}

              {/* Outcome */}
              {briefRec.outcome && (
                <div>
                  <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Desired Outcome</div>
                  <div style={{ fontSize: "14px", color: "#09090b", lineHeight: 1.6 }}>{briefRec.outcome}</div>
                </div>
              )}

              {/* Keywords */}
              {briefRec.primaryKeywords && (
                <div>
                  <div style={{ fontSize: "9px", color: "#09090b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "8px" }}>Keywords</div>
                  <div style={{ fontSize: "14px", color: "#09090b", lineHeight: 1.6 }}>{briefRec.primaryKeywords}</div>
                </div>
              )}
            </div>
          </div>
        )}




        <h2 style={{ fontSize: "22px", margin: "0 0 14px", fontWeight: 200, color: "#09090b", letterSpacing: "0" }}>Your projects</h2>
        {projects.length === 0 && (
          <div style={{ marginBottom: "20px", padding: "20px 24px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#09090b", marginBottom: "6px" }}></div>
            <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6 }}>
              
            </div>
          </div>
        )}
        {importMsg && (
          <div style={{ marginBottom: "16px", padding: "12px 16px", background: importMsg.startsWith("Import failed") ? "#fef2f2" : "#f5f5f7", border: importMsg.startsWith("Import failed") ? "1px solid #fecaca" : "1px solid #dde0e6", borderRadius: "8px", fontSize: "13px", color: importMsg.startsWith("Import failed") ? "#991b1b" : "#09090b" }}>
            {importMsg}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "14px", overflow: "hidden" }}>
          {projects.map(p => {
            const hasTemplate = !!p.brand.templateId;
            const displayName = p.name || p.brand.name || "Untitled";
            const hasDescription = !!p.brand.industry;
            const isPendingDelete = confirmDeleteId === p.id;
            return (
              <div key={p.id} style={{ background: "#ffffff", border: isPendingDelete ? "1px solid #fecaca" : "1px solid #dde0e6", padding: "18px 20px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden", minWidth: 0 }}>
                <div onClick={() => { setActiveId(p.id); setView("editor"); setPageIdx(0); }} style={{ cursor: "pointer", flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "4px", color: "#09090b", letterSpacing: "0" }}>{displayName}</div>
                  <div style={{ fontSize: "12px", color: "#09090b", marginBottom: "12px" }}>
                    {p.pages.length} page{p.pages.length !== 1 ? "s" : ""}
                    {hasDescription ? <> · {p.brand.industry}</> : <span style={{ color: "#a3a39e" }}> · No description yet</span>}
                  </div>
                  {hasTemplate ? (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <div style={{ width: "18px", height: "18px", background: p.brand.primaryColor, border: "1px solid #dde0e6", borderRadius: "3px" }} />
                      <div style={{ width: "18px", height: "18px", background: p.brand.accentColor, border: "1px solid #dde0e6", borderRadius: "3px" }} />
                      <span style={{ fontSize: "10px", color: "#09090b", marginLeft: "4px" }}>
                        {WEBSITE_TEMPLATES.find(t => t.id === p.brand.templateId)?.name || "Template applied"}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "10px", color: "#09090b", fontStyle: "italic", padding: "6px 10px", background: "#ffffff", border: "1px dashed #dde0e6", borderRadius: "4px", display: "inline-block" }}>
                      No template applied yet
                    </div>
                  )}
                </div>
                <div onClick={e => e.stopPropagation()} style={{ borderTop: "1px solid #dde0e6", paddingTop: "12px" }}>
                  <label style={{ display: "block", fontSize: "10px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "4px" }}>Inspiration URLs</label>
                  <textarea
                    value={p.brand.inspoUrls || ""}
                    onChange={e => setProjects(ps => ps.map(proj => proj.id === p.id ? { ...proj, brand: { ...proj.brand, inspoUrls: e.target.value } } : proj))}
                    placeholder={"https://example.com\nhttps://another.com"}
                    rows={2}
                    style={{ width: "100%", padding: "8px 10px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", resize: "vertical", lineHeight: 1.5, outline: "none", boxSizing: "border-box", display: "block", maxWidth: "100%" }}
                  />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "3px" }}>Feeds AI copy drafting — one URL per line</div>
                </div>
                <div style={{ display: "flex", gap: "6px", paddingTop: "12px", borderTop: "1px solid #dde0e6" }}>
                  {isPendingDelete ? (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }} style={{ flex: 1, padding: "8px 10px", background: "#c93939", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Yes, delete "{displayName}"</button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }} style={{ padding: "8px 12px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setActiveId(p.id); setView("editor"); setPageIdx(0); }} style={{ flex: 1, padding: "8px 10px", background: "#6b635c", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>Open</button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateProject(p.id); }} title="Duplicate this project" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="copy" size={14} color="#09090b" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); exportProjectFile(p); }} title="Download as JSON backup file" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="download" size={14} color="#09090b" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); resetProject(p.id); }} title="Reset to blank" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="refresh" size={14} color="#09090b" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }} title="Delete this project" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 10px", background: "transparent", color: "#c93939", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                        <Icon name="trash" size={14} color="#c93939" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <button onClick={newProject} style={{ background: "transparent", border: "1.5px dashed #dde0e6", color: "#09090b", padding: "32px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon name="plus" size={18} color="#09090b" /> New Project
          </button>
          <label style={{ background: "transparent", border: "1.5px dashed #dde0e6", color: "#09090b", padding: "32px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 500, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <Icon name="upload" size={18} color="#09090b" /> Import Project
            <input type="file" accept="application/json,.json" onChange={importProjectFile} style={{ display: "none" }} />
          </label>
        </div>
        <p style={{ fontSize: "12px", color: "#09090b", marginTop: "20px", lineHeight: 1.6 }}>
          Projects auto-save in your browser. Use the download icon on a project card to save a backup.
        </p>
      </div>
    </div>
  );

  // ── EDITOR VIEW ────────────────────────────────────────────────────────────
  // ── Shared context passed to all tab components ──────────────────────────
  const ctx = {
    brand, page, project, pageIdx, audit,
    updBrand, updPage, updSocial, delSocial, clearDemoContent,
    generateStarterCopy, aiLoading,
    showAdvancedColors, setShowAdvancedColors,
    showAllThemes, setShowAllThemes,
    downloadPage, downloadHeader, downloadFooter, downloadAll,
    exportBrief, shareBrief, exportFormat,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", color: "#09090b", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <style>{`
        
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
          .editor-padding{padding:24px 12px 40px !important;}
          .tab-panel-bg{background-image: radial-gradient(circle, #dddce3 1px, transparent 1px); background-size: 24px 24px;}
        }
        /* Inputs and buttons always full-width on touch */
        @media(max-width:600px){
          input, textarea, select{font-size:16px !important;} /* prevents iOS zoom on focus */
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #dde0e6", padding: "8px 0", position: "sticky", top: "48px", zIndex: 50 }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          {/* Left: All Projects + project info */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => setView("projects")} style={{ padding: "7px 14px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
              <Icon name="arrowLeft" size={13} color="#ffffff" /> All Projects
            </button>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em", color: "#000000", lineHeight: 1 }}>{brand.name || "Untitled"}</div>
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>{project.pages.length} page{project.pages.length !== 1 ? "s" : ""} · {exportFormat === "divi" ? "Divi" : "Elementor"}</div>
            </div>
          </div>
          {/* Right: Audit icon + Preview */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={() => setShowAudit(!showAudit)} title={`Audit — ${audit.length} item${audit.length !== 1 ? "s" : ""}`} style={{ background: "none", border: "none", padding: "7px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", color: audit.length ? "#b45309" : "#a1a1aa", fontSize: "12px", fontWeight: 600, borderRadius: "6px" }}>
              <Icon name="alertTriangle" size={14} color={audit.length ? "#b45309" : "#a1a1aa"} /> {audit.length}
            </button>
            <button onClick={() => setView("preview")} style={{ padding: "7px 14px", background: "#6b635c", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <Icon name="eye" size={13} color="#ffffff" /> Preview
            </button>
          </div>
        </div>
      </div>

      {/* Audit panel — slides in from right */}
      {showAudit && (
        <div style={{ position: "fixed", top: 0, right: 0, width: "360px", height: "100vh", background: "#ffffff", borderLeft: "1px solid #dde0e6", zIndex: 200, display: "flex", flexDirection: "column", boxShadow: "-4px 0 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #dde0e6", flexShrink: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#09090b" }}>Build Audit — {audit.length} item{audit.length !== 1 ? "s" : ""}</div>
            <button onClick={() => setShowAudit(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#09090b", fontSize: "18px", lineHeight: 1 }}>×</button>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px" }}>
          {audit.length === 0 ? (
            <div style={{ fontSize: "14px", color: "#000000", fontWeight: 600 }}>Everything looks good. Ready to build.</div>
          ) : (
            <>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#09090b", marginBottom: "14px" }}>Build Audit — {audit.length} item{audit.length !== 1 ? "s" : ""}</div>
              {["critical", "content", "seo", "aio", "best"].map(cat => {
                const items = audit.filter(a => a.category === cat);
                if (!items.length) return null;
                const label = { critical: "Critical", content: "Content", seo: "SEO", aio: "AI Search", best: "Best Practices" }[cat];
                const color = { critical: "#b45309", content: "#b45309", seo: "#6b635c", aio: "#6b635c", best: "#6b635c" }[cat];
                return (
                  <div key={cat} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color, fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label} ({items.length})</div>
                    {items.map((a, i) => {
                      const TABLABEL = { brand: "Visual", page: "Page", content: "Content", inspo: "Inspiration", social: "Social & Nav", footer: "Header & Footer", export: "Export" };
                      const target = a.target;
                      const clickable = target && target.section;
                      return (
                        <button
                          key={i}
                          onClick={clickable ? () => goToSection(target.tab, target.section) : undefined}
                          disabled={!clickable}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            fontSize: "13px", color: "#09090b", padding: "8px 12px",
                            lineHeight: 1.5, borderLeft: `2px solid ${color}`,
                            background: "#ffffff", border: `1px solid #f4f4f5`, borderLeftWidth: "3px", borderLeftColor: color,
                            borderRadius: "4px", marginBottom: "6px",
                            cursor: clickable ? "pointer" : "default",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={e => { if (clickable) e.currentTarget.style.background = "#f0eff3"; }}
                          onMouseLeave={e => { if (clickable) e.currentTarget.style.background = "#f5f5f7"; }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                            <strong style={{ color: "#09090b" }}>{a.msg}</strong>
                            {clickable && (
                              <span style={{ fontSize: "10px", color: "#09090b", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                                {TABLABEL[target.tab] || target.tab} →
                              </span>
                            )}
                          </div>
                          {a.fix && <div style={{ color: "#09090b", marginTop: "4px", fontSize: "12px" }}>→ {a.fix}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
          </div>
        </div>
      )}

      {/* AI Draft Modal — preview the generated copy before applying */}
      {(aiDraft || aiError || aiLoading) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "12px", padding: "28px", maxWidth: "720px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            {aiError ? (
              <>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#ef4444", marginBottom: "12px" }}>Couldn't draft copy</div>
                <div style={{ fontSize: "14px", color: "#09090b", marginBottom: "20px", lineHeight: 1.6 }}>{aiError}</div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => { setAiError(""); generateStarterCopy(); }} style={{ padding: "10px 18px", background: "#6b635c", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Try again</button>
                  <button onClick={() => setAiError("")} style={{ padding: "10px 18px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
              </>
            ) : (aiLoading && !aiDraft) ? (
              <>
                <div style={{ fontSize: "12px", color: "#09090b", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Drafting</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#09090b", marginBottom: "20px" }}>Writing your starter copy…</div>
                <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.6, marginBottom: "20px" }}>
                  Writing tagline, hero heading, hero subhead, about copy, CTAs, and key messages based on your brand brief. Usually 8–15 seconds.
                </div>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ marginBottom: "10px", background: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: "1px solid #dde0e6" }}>
                    <div style={{ height: "10px", width: "30%", background: "#f0eff3", borderRadius: "3px", marginBottom: "8px" }} />
                    <div style={{ height: "12px", width: "85%", background: "#f0eff3", borderRadius: "3px" }} />
                  </div>
                ))}
              </>
            ) : aiDraft && (
              <>
                <div style={{ fontSize: "12px", color: "#09090b", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Draft Preview</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#09090b", marginBottom: "8px" }}>Review and edit the starter copy</div>
                <div style={{ fontSize: "13px", color: "#09090b", marginBottom: "20px", lineHeight: 1.5 }}>
                  Edit any field directly. Click <strong style={{ color: "#09090b" }}>↻</strong> next to a label to regenerate just that field. When you like it, click Apply.
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
                    <div key={key} style={{ marginBottom: "14px", background: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: isRegenerating ? "1px solid #b45309" : "1px solid #dde0e6", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ fontSize: "10px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{label}</div>
                        <button
                          onClick={() => regenerateField(key)}
                          disabled={!!aiFieldRegen}
                          title={`Regenerate just the ${label.toLowerCase()}`}
                          style={{
                            background: isRegenerating ? "#b45309" : "transparent",
                            color: isRegenerating ? "#ffffff" : "#09090b",
                            border: "1px solid #dde0e6",
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
                          <Icon name="refresh" size={11} color={isRegenerating ? "#ffffff" : "#6b635c"} />
                          {isRegenerating ? "Regenerating…" : "Regenerate"}
                        </button>
                      </div>
                      {multiline ? (
                        <textarea
                          value={value}
                          onChange={e => setAiDraft({ ...aiDraft, [key]: e.target.value })}
                          rows={rows || 3}
                          disabled={isRegenerating}
                          style={{ width: "100%", padding: "8px 10px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "14px", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5, opacity: isRegenerating ? 0.5 : 1, boxSizing: "border-box" }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={value}
                          onChange={e => setAiDraft({ ...aiDraft, [key]: e.target.value })}
                          disabled={isRegenerating}
                          style={{ width: "100%", padding: "8px 10px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "14px", fontFamily: "inherit", opacity: isRegenerating ? 0.5 : 1, boxSizing: "border-box" }}
                        />
                      )}
                    </div>
                  );
                })}

                <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
                  <button onClick={applyAiDraft} disabled={!!aiFieldRegen || aiLoading} style={{ padding: "12px 20px", background: "#6b635c", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: (aiFieldRegen || aiLoading) ? "not-allowed" : "pointer", opacity: (aiFieldRegen || aiLoading) ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="check" size={14} color="#ffffff" /> Apply to brand & page
                  </button>
                  <button onClick={() => { setAiDraft(null); generateStarterCopy(); }} disabled={!!aiFieldRegen || aiLoading} style={{ padding: "12px 20px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: (aiFieldRegen || aiLoading) ? "not-allowed" : "pointer", opacity: (aiFieldRegen || aiLoading) ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="refresh" size={14} color="#09090b" /> Regenerate all
                  </button>
                  <button onClick={() => { setAiDraft(null); setAiFieldRegen(""); }} disabled={!!aiFieldRegen} style={{ padding: "12px 20px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: aiFieldRegen ? "not-allowed" : "pointer" }}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr", minHeight: "calc(100vh - 60px)" }}>
        {/* LEFT — FORM */}
        <div className="tab-panel-bg" style={{ padding: "0", overflowY: "auto", maxHeight: "calc(100vh - 60px)", background: "#eeedf1" }}>

          {/* Tabs — full width warm stone bar */}
          <div style={{ background: "rgba(107, 99, 92, 0.82)", width: "100%", paddingTop: "10px" }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>
              <div className="tab-bar" style={{ display: "flex", justifyContent: "center", overflowX: "auto", WebkitOverflowScrolling: "touch", paddingTop: "18px", paddingBottom: "16px" }}>
                <TabBtn id="discovery" label="Discovery" />
                <TabBtn id="positioning" label="Positioning" />
                <TabBtn id="brand" label="Visual" />
                <TabBtn id="content" label="Content" />
                <TabBtn id="social" label="Social" />
                <TabBtn id="footer" label="Header & Footer" />
                <TabBtn id="export" label="Export & Import" />
              </div>
              {/* Divider between tabs and page pills */}
              <div style={{ height: "1px", background: "rgba(255,255,255,0.15)", margin: "0 0 0 0" }} />
            {/* Page switcher row — pills centered, Add Page right */}
            <div style={{ display: "flex", alignItems: "center", padding: "16px 0 20px", position: "relative" }}>
              <div style={{ flex: 1, display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                {project.pages.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <button onClick={() => setPageIdx(i)} style={{ padding: "6px 18px", background: i === pageIdx ? "#ffffff" : "transparent", color: i === pageIdx ? "#09090b" : "#ffffff", border: `1px solid ${i === pageIdx ? "#ffffff" : "rgba(255,255,255,0.5)"}`, borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{p.name}</button>
                    {project.pages.length > 1 && <button onClick={() => delPage(i)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "13px", lineHeight: 1, padding: "0 1px" }}>×</button>}
                  </div>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowAddPage(!showAddPage)} style={{ padding: "6px 14px", background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "999px", fontSize: "13px", fontWeight: 400, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="plus" size={11} color="#ffffff" /> Add Page
                </button>
                {showAddPage && (
                  <div style={{ position: "absolute", top: "36px", right: "0", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "8px", padding: "12px", zIndex: 30, minWidth: "280px", maxHeight: "420px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                    <div style={{ fontSize: "12px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px", padding: "0 4px", fontWeight: 600 }}>Start from a template</div>
                    {PAGE_TYPES.map(pt => (
                      <button key={pt} onClick={() => addPage(pt)} style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", color: "#09090b", fontSize: "14px", cursor: "pointer", borderRadius: "4px", marginBottom: "2px" }} onMouseEnter={e => e.currentTarget.style.background = "#f0eff3"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ fontWeight: 600, color: "#000000" }}>{pt}</div>
                        <div style={{ fontSize: "12px", color: "#09090b", marginTop: "2px" }}>{(PAGE_TEMPLATES[pt]?.sections || []).slice(0, 4).join(" · ")}{PAGE_TEMPLATES[pt]?.sections?.length > 4 ? " ..." : ""}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* DISCOVERY TAB */}
          {tab === "discovery" && <DiscoveryTab ctx={ctx} />}

                    {/* POSITIONING TAB */}
          {tab === "positioning" && <PositioningTab ctx={ctx} />}

                    {/* BRAND TAB */}
          {tab === "brand" && <BrandTab ctx={ctx} />}

                    {/* CONTENT TAB */}
          {tab === "content" && <ContentTab ctx={ctx} />}

                    {/* SOCIAL TAB */}
          {tab === "social" && <SocialTab ctx={ctx} />}

                    {/* HEADER & FOOTER TAB */}
          {tab === "footer" && <HeaderFooterTab ctx={ctx} />}

                    {/* EXPORT & IMPORT TAB */}
          {tab === "export" && <ExportTab ctx={ctx} />}

                  {/* Workflow Back/Next navigation — visible on every tab */}
        {(() => {
          const idx = TAB_ORDER.findIndex(t => t.id === tab);
          if (idx === -1) return null;
          const prev = idx > 0 ? TAB_ORDER[idx - 1] : null;
          const next = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;
          return (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "24px 20px", marginTop: "30px", borderTop: "1px solid #dde0e6", flexWrap: "wrap" }}>
              {prev ? (
                <button
                  onClick={() => setTab(prev.id)}
                  style={{ padding: "8px 16px", background: "#ffffff", color: "#6b635c", border: "1px solid #6b635c", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" }}>
                  <Icon name="arrowLeft" size={14} color="#000000" /> Back to {prev.label}
                </button>
              ) : <div />}
              <div style={{ fontSize: "12px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
                Step {idx + 1} of {TAB_ORDER.length}
              </div>
              {next ? (
                <button
                  onClick={() => setTab(next.id)}
                  style={{ padding: "8px 18px", background: "#6b635c", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" }}>
                  Next: {next.label} <Icon name="arrowRight" size={14} color="#ffffff" />
                </button>
              ) : (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#000000", fontWeight: 500 }}>
                  <Icon name="check" size={14} color="#000000" /> End of workflow
                </div>
              )}
            </div>
          );
        })()}
        </div>
      </div>
    </div>
  );
}
