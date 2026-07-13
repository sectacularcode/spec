// Detects and repairs two confirmed bugs in already-created isCustom
// projects, both from before their respective fixes shipped:
//
// 1. aboutHeading/ctaHeading silently stuck on generic professional-
//    services defaults ("Why clients keep coming back.", "Ready to get
//    started?") because the old AI schema never asked for them.
// 2. imageCategory wrongly set to "editorial" (beauty/skincare/fashion)
//    for themes with no actual connection to that category.
//
// Both fixes going forward are already in place (index.jsx's isCustom
// schema + applyBriefRecommendation, and sanitizeImageCategory in
// images.js) -- this module is specifically for repairing data that was
// already written to the database before those fixes existed. Scoped to
// the calling user's own projects only, via the existing /api/projects
// endpoints (already user-scoped) -- no elevated access needed or used.

import { sanitizeImageCategory } from "../template-studio/utils/images.js";

const GENERIC_ABOUT_HEADING = "Why clients keep coming back.";
const GENERIC_CTA_HEADING = "Ready to get started?";
const GENERIC_ABOUT_BODY = "We built this business around a simple idea: do excellent work, be honest about what it costs, and treat every client like they matter. That approach has driven every project we've taken on.";

// Pure, no side effects. Returns a list of { projectId, projectName,
// pageId, pageName, issues: [...] } -- one entry per PAGE that has at
// least one issue, not per project, since aboutHeading/ctaHeading are
// page-level fields and a project can have multiple pages.
export function scanForLegacyContent(projects) {
  const results = [];
  for (const project of projects || []) {
    const brand = project.brand || {};
    const imageCategoryIssue =
      brand.imageCategory === "editorial" &&
      sanitizeImageCategory("editorial", brand.description || "") === "default";

    for (const page of project.pages || []) {
      const issues = [];

      // Only flag the heading as stale if the body is genuinely
      // customized (non-empty and not itself the generic default) --
      // otherwise this could be a page that was never meant to have
      // AI content applied at all, and "fixing" the heading without a
      // real theme to generate from would just replace one wrong value
      // with a different unfounded one.
      const hasCustomizedBody = page.aboutBody && page.aboutBody !== GENERIC_ABOUT_BODY;
      if (page.aboutHeading === GENERIC_ABOUT_HEADING && hasCustomizedBody) {
        issues.push({ type: "aboutHeading", oldValue: page.aboutHeading });
      }
      if (page.ctaHeading === GENERIC_CTA_HEADING && hasCustomizedBody) {
        issues.push({ type: "ctaHeading", oldValue: page.ctaHeading });
      }
      // imageCategory lives on brand, not the page, but reported per-page
      // here so the UI can show it alongside whatever page it affects
      // most visibly (About/Hero images) without a separate list.
      if (imageCategoryIssue && (page.pageType === "Homepage" || project.pages[0] === page)) {
        issues.push({ type: "imageCategory", oldValue: "editorial" });
      }

      if (issues.length > 0) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          pageId: page.id,
          pageName: page.name,
          issues,
        });
      }
    }
  }
  return results;
}

// Regenerates aboutHeading/ctaHeading for one flagged page via a small,
// targeted AI call -- uses the project's own already-stored context
// (description, existing body copy, hero heading) so the replacement
// actually matches the established theme rather than being generated
// from nothing. Best-effort and non-throwing: returns null on any
// failure, and the caller should leave the original value in place
// rather than write a null/partial result.
export async function regenerateHeadings(authHeadersFn, brand, page) {
  try {
    const systemPrompt = `Generate a corrected about-section heading and CTA heading for an existing business page, matching its established theme and voice. Return ONLY valid JSON -- no preamble, no markdown fences:
{
  "aboutHeading": "5-9 words, a pointed statement fully in the theme's voice, not a label",
  "ctaHeading": "5-10 words, a closing call-to-action line fully in the theme's voice"
}
Both must be specific to the actual business described below. Do not use generic phrases like "Why clients keep coming back" or "Ready to get started?" -- those are exactly what's being replaced.`;
    const userPrompt = `Business description: ${brand.description || brand.name || "unknown"}
Existing about section body copy (for tone/voice reference): ${page.aboutBody || ""}
Existing hero heading (for tone/voice reference): ${page.heroHeading || ""}
Return the corrected JSON now.`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const res = await fetch("/api/generate-copy", {
      method: "POST",
      headers: await authHeadersFn(),
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    const responseText = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
    const clean = responseText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed || typeof parsed.aboutHeading !== "string" || typeof parsed.ctaHeading !== "string") return null;
    return { aboutHeading: parsed.aboutHeading, ctaHeading: parsed.ctaHeading };
  } catch {
    return null;
  }
}

// Applies the scan results to a fresh copy of the projects array --
// mechanical imageCategory correction is applied unconditionally (no AI
// needed, deterministic); heading corrections use the AI-regenerated
// values passed in via headingFixes (keyed by pageId), falling back to
// leaving the original value untouched if regeneration failed for that
// page rather than ever writing a blank/null heading.
export function applyLegacyContentFixes(projects, scanResults, headingFixes) {
  const issuesByProject = new Map();
  for (const r of scanResults) {
    if (!issuesByProject.has(r.projectId)) issuesByProject.set(r.projectId, []);
    issuesByProject.get(r.projectId).push(r);
  }

  return (projects || []).map(project => {
    const projectIssues = issuesByProject.get(project.id);
    if (!projectIssues) return project;

    let brand = project.brand;
    const hasImageCategoryFix = projectIssues.some(r => r.issues.some(i => i.type === "imageCategory"));
    if (hasImageCategoryFix) {
      brand = { ...brand, imageCategory: "default" };
    }

    const pages = (project.pages || []).map(page => {
      const pageIssue = projectIssues.find(r => r.pageId === page.id);
      if (!pageIssue) return page;
      const fix = headingFixes[page.id];
      if (!fix) return page; // regeneration failed or wasn't attempted -- leave untouched
      const wantsAboutFix = pageIssue.issues.some(i => i.type === "aboutHeading");
      const wantsCtaFix = pageIssue.issues.some(i => i.type === "ctaHeading");
      return {
        ...page,
        aboutHeading: wantsAboutFix ? fix.aboutHeading : page.aboutHeading,
        ctaHeading: wantsCtaFix ? fix.ctaHeading : page.ctaHeading,
      };
    });

    return { ...project, brand, pages };
  });
}
