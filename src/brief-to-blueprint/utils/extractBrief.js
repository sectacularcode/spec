// Parses a raw JSON brief object (from file upload or the intake form export)
// into the normalized brief shape expected by generatePages() and buildPreviewHTML().
//
// Two formats are supported:
//   1. Native Spec format — has designSystem and brandBrief keys
//   2. Flat format — keys map directly to brief fields

export   function extractBrief(raw) {
    if (raw.designSystem && raw.brandBrief) {
      const colors = {};
      (raw.designSystem.colors || []).forEach(c => { colors[c.id] = c.hex; });
      const pages = raw.pages || [];
      const getField = (pageId, sectionType, fieldKey) => {
        const page = pages.find(p => p.pageId === pageId);
        if (!page) return "";
        const sec = page.sections?.find(s => s.sectionType === sectionType || s.captureAs === sectionType);
        if (!sec) return "";
        const fld = sec.fields?.find(f => f.key === fieldKey);
        return Array.isArray(fld?.value) ? fld.value.join(" · ") : fld?.value || "";
      };
      return {
        brandName: raw.project?.name || "",
        colors,
        fonts: raw.designSystem.fonts?.map(f => f.family) || ["Inter"],
        heroHeadline: getField("home","hero-dark","h1") || getField("home","hero","h1"),
        heroSubhead: getField("home","hero-dark","subhead"),
        heroCta1: (getField("home","hero-dark","buttons")||"").split("·")[0]?.trim() || "See the work",
        heroCta2: (getField("home","hero-dark","buttons")||"").split("·")[1]?.trim() || "See pricing",
        hookStatement: getField("home","statement-hook","statement"),
        serviceCards: pages.find(p=>p.pageId==="home")?.sections?.find(s=>s.captureAs==="card-grid-4")?.fields?.map(f=>[f.role.replace(/Card \d+ ?·? ?/,""),f.value])||[],
        differenceEyebrow: getField("home","eyebrow-heading-body","eyebrow"),
        differenceH2: getField("home","eyebrow-heading-body","h2"),
        differenceBody: getField("home","eyebrow-heading-body","body"),
        whoEyebrow: getField("home","who-section","eyebrow"),
        whoH2: getField("home","who-section","h2"),
        whoBody: getField("home","who-section","body"),
        workH2: getField("home","media-grid-link","h2"),
        pricingH2: getField("home","pricing-teaser","h2"),
        pricingSubhead: getField("home","pricing-teaser","body"),
        pricingCta: (getField("home","pricing-teaser","button")||"").split("·")[0]?.trim()||"See packages",
        tagline: raw.brandBrief?.tagline?.value||"",
        signatureLine: raw.brandBrief?.signatureLine?.value||"",
        closingCta: (getField("home","cta-pullquote-dark","button")||"").split("·")[0]?.trim()||"Start a project",
        aboutH1: getField("about","page-header","h1"),
        aboutStory: getField("about","story-block","story"),
        whyOneMaker: getField("about","eyebrow-heading-body","body"),
        founderValues: (getField("about","values-row","values")||"").split("·").map(v=>v.trim()).filter(Boolean),
        processH1: getField("process","page-header","h1"),
        processSteps: (raw.pages?.find(p=>p.pageId==="process")?.sections?.find(s=>s.captureAs==="numbered-steps")?.fields||[]).map(f=>[f.key,f.role,f.value]),
        contactH1: getField("contact","page-header","h1"),
        contactIntro: getField("contact","page-header","intro"),
        contactCta: getField("contact","contact-form","submit"),
        contactReassurance: getField("contact","contact-form","reassurance"),
        pricingTiers: (raw.pricing?.tiers||[]).map(t=>[t.name,t.subtitle||"",t.desc,t.price]),
      };
    }
    // Extract colors from text-based briefs (DOCX/TXT)
    var textColors = {};
    var rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);
    var hexMatches = rawStr.match(/#[0-9A-Fa-f]{6}/g) || [];
    if (hexMatches.length > 0) {
      // Map common color roles by order of appearance in intake form
      var colorNames = ["ink", "accent", "brass-deep", "bone", "asphalt", "stone", "warm-white", "text"];
      hexMatches.slice(0, 8).forEach(function(hex, i) {
        if (i < colorNames.length) textColors[colorNames[i]] = hex;
      });
      // Also try to detect by context
      var lowerStr = rawStr.toLowerCase();
      hexMatches.forEach(function(hex) {
        var idx = lowerStr.indexOf(hex.toLowerCase());
        var context = lowerStr.substring(Math.max(0, idx - 60), idx).toLowerCase();
        if (context.indexOf("amber") !== -1 || context.indexOf("accent") !== -1 || context.indexOf("primary accent") !== -1) textColors.brass = hex;
        if (context.indexOf("charcoal") !== -1 || context.indexOf("primary text") !== -1 || context.indexOf("ink") !== -1) textColors.ink = hex;
        if (context.indexOf("canvas") !== -1 || context.indexOf("background") !== -1 || context.indexOf("bone") !== -1) textColors.bone = hex;
        if (context.indexOf("stone") !== -1 || context.indexOf("secondary") !== -1 || context.indexOf("warm stone") !== -1) textColors.stone = hex;
        if (context.indexOf("border") !== -1 || context.indexOf("divider") !== -1) textColors.border = hex;
        if (context.indexOf("white") !== -1 || context.indexOf("clean") !== -1) textColors["warm-white"] = hex;
      });
    }
    return { brandName: raw.brandName||raw.name||"", colors: Object.keys(textColors).length > 0 ? textColors : (raw.colors||{}), ...raw };
  }
