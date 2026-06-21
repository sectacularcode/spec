// Brand audit — checks for incomplete fields and returns warning objects shown in the Audit panel.
// Each warning has: type ("error"|"warning"|"best"|"aio"), message, detail, and a tab/section to navigate to.

export function auditBrand(brand, pages) {
  const issues = [];
  const add = (category, msg, fix, target) => issues.push({ category, msg, fix, target });

  // ─── CRITICAL — page won't function well without these
  if (!brand.logoUrl && !brand.logoText) add("critical", "No logo URL or text fallback", "Add a logo URL or a text-based logo in Logo & Identity.", { tab: "positioning", section: "positioning-ctas" });
  if (!brand.tagline) add("critical", "Missing tagline", "Add a tagline in Business — it shows in hero and footer.", { tab: "brand", section: "brand-business" });
  if (!brand.primaryColor || !brand.accentColor) add("critical", "Primary or accent color missing", "Pick a Theme and Accent in the Brand tab.", { tab: "brand", section: "brand-theme" });
  if (!brand.cta1) add("critical", "Primary CTA is empty", "Add a primary CTA in Logo & Identity (e.g. 'Book a call').", { tab: "positioning", section: "positioning-ctas" });
  if (!brand.contactEmail) add("critical", "No contact email", "Used in footer and contact forms — add in Logo & Identity.", { tab: "positioning", section: "positioning-ctas" });

  // ─── CONTENT — sections turned on but empty
  pages.forEach(p => {
    const has = (s) => p.sections.includes(s);
    if (!p.heroHeading) add("content", `${p.name}: hero heading is empty`, "Add a hero heading or apply a template.", { tab: "content", section: "page-hero" });
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
    add("seo", "No primary keywords set", "Add 3–5 in the Brand Brief — these power SEO and AI search audits.", { tab: "positioning", section: "positioning-goals" });
  } else {
    const heroBlob = (pages[0]?.heroHeading + " " + pages[0]?.heroSubhead + " " + (brand.tagline || "")).toLowerCase();
    const aboutBlob = ((pages[0]?.aboutBody || "") + " " + (brand.description || "")).toLowerCase();
    const heroHits = keywords.filter(k => heroBlob.includes(k));
    const aboutHits = keywords.filter(k => aboutBlob.includes(k));
    if (heroHits.length === 0) add("seo", "No primary keywords appear in your hero", `Work at least one of "${keywords.slice(0, 3).join('", "')}" naturally into the hero.`, { tab: "content", section: "page-hero" });
    if (aboutHits.length === 0) add("seo", "No primary keywords appear in your about copy", "Search engines weigh About heavily — work in at least one primary keyword.", { tab: "content", section: "page-about" });
  }

  if (pages[0] && !pages[0].heroHeading) add("seo", "Hero heading is empty — bad for ranking", "The H1 is the single most important on-page SEO signal.", { tab: "content", section: "page-hero" });

  // ─── AIO — AI search optimization
  const activeGoals = brand.goals && brand.goals.length ? brand.goals : (brand.goal ? [brand.goal] : []);
  if (!activeGoals.length) add("aio", "No primary goal set", "Set at least one goal in Brand Brief — AI search relies on clear intent signals.", { tab: "positioning", section: "positioning-goals" });
  if (!brand.outcome) add("aio", "No desired outcome specified", "Add an outcome sentence in Brand Brief — helps LLMs understand what your page is for.", { tab: "positioning", section: "positioning-goals" });

  const aboutWords = (pages[0]?.aboutBody || "").split(/\s+/).filter(Boolean).length;
  if (aboutWords > 0 && aboutWords < 60) add("aio", "About copy is too thin to be cited by AI search", "Aim for 80–150 words with specific facts — LLMs cite specific, factual passages.", { tab: "content", section: "page-about" });

  const hasFAQ = pages.some(p => p.sections.includes("FAQ") && p.faq);
  if (!hasFAQ) add("aio", "No FAQ section on any page", "FAQs in Q&A format are the single most cited content type by AI search.", { tab: "content", section: "page-sections" });

  const hasStats = pages.some(p => p.sections.includes("Stats") && p.stats);
  if (!hasStats) add("aio", "No stats anywhere on the site", "Specific numbers (years in business, clients served, outcomes) get cited by AI summaries.", { tab: "content", section: "page-sections" });

  const hero = (pages[0]?.heroHeading || "").toLowerCase();
  if (hero && hero.split(/\s+/).length < 5) add("aio", "Hero heading is very short", "Aim for 8–14 words — LLMs need enough context to understand what you offer.", { tab: "content", section: "page-hero" });

  // ─── BEST PRACTICES — patterns that perform
  const homepage = pages[0];
  if (homepage && !homepage.sections.includes("Testimonials")) add("best", "No testimonials on the homepage", "Social proof above the fold lifts conversion 20–40%.", { tab: "content", section: "page-sections" });
  if (homepage && !homepage.sections.includes("CTA") && !homepage.sections.includes("Form") && !homepage.sections.includes("Contact")) add("best", "No CTA, Form, or Contact section on the homepage", "Every homepage should have a clear conversion path.", { tab: "content", section: "page-sections" });
  if (homepage && !homepage.sections.includes("Logo Carousel") && !homepage.sections.includes("Clients") && homepage.sections.includes("Services")) add("best", "Service business with no client logos or social proof", "Add a Logo Carousel with brands you've worked with.", { tab: "content", section: "page-sections" });

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
      add("best", "Your CTA doesn't match any of your goals", `"${brand.cta1}" doesn't reflect ${activeGoals.join(" or ")}. Match the verb to what you want visitors to do.`, { tab: "positioning", section: "positioning-ctas" });
    }
  }

  if (!(brand.socialLinks || []).length) add("best", "No social links added", "Adds trust signals — even 1–2 links help.", { tab: "social", section: "social-links" });
  if (!brand.inspoUrls) add("best", "No inspiration URLs", "Optional — feeds into the AI Draft Starter Copy for aesthetic context.", { tab: "discovery", section: "inspo-sites" });

  return issues;
}
