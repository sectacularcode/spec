import { THEMES } from "../constants/themes.js";
// Generates the full HTML document string for the Template Studio preview iframe.
// Renders all page sections as HTML using brand colors, fonts, and layout settings.
// All user-controlled brand fields are sanitized via he() before insertion.

import { he } from "../utils/htmlEscape.js";
import { LAYOUTS, getLayout, eyebrowText } from "../constants/layouts.js";
import { SVG } from "../utils/svg.js";
import { IMAGE_LIBRARY, pickImage, imgOrPlaceholder } from "../utils/images.js";
import { luminance, contrastRatio, isLight, textOn, mutedTextOn, buttonOn } from "../utils/colors.js";

export function previewHTML(page, brand) {
  // Sanitize all brand string fields before any HTML insertion
  const safeBrand = {};
  Object.keys(brand || {}).forEach(k => {
    const v = (brand || {})[k];
    safeBrand[k] = typeof v === "string" ? he(v) : v;
  });
  brand = safeBrand;

  // Sanitize page string fields
  const safePage = {};
  Object.keys(page || {}).forEach(k => {
    const v = (page || {})[k];
    safePage[k] = typeof v === "string" ? he(v) : v;
  });
  page = safePage;

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
      const eyebrow = eyebrowText(layout.eyebrowStyle, page.heroEyebrow || page.pageType || "Welcome");
      const btnTxtColor = textOn(ac);

      // INTERIOR PAGE HEADER — clean text-only header for non-homepage pages
      const interiorTypes = ["About / Studio", "Services", "Work / Portfolio", "Case Study", "Blog Index", "Blog Post", "Blog Post — Recipe", "Pricing", "Press / Awards", "Careers", "Contact", "Leadership / Founder"];
      if (interiorTypes.includes(page.pageType)) {
        const isCaseStudy = page.pageType === "Case Study";
        const darkHeader = isCaseStudy || ["Leadership / Founder"].includes(page.pageType);
        const headerBg = darkHeader ? (isDark ? pc : "#0a0a0a") : pc;
        const headerText = darkHeader ? "#ffffff" : headingColor;
        const headerSub = darkHeader ? "rgba(255,255,255,0.7)" : ts;

        // Case Study — editorial dark header with accent rule, large display type, metadata strip
        if (isCaseStudy) {
          return `<section style="background:${headerBg};padding:clamp(80px,10vw,140px) clamp(24px,8vw,100px) clamp(48px,6vw,80px);">
            <div style="max-width:900px;">
              <div style="display:flex;align-items:center;gap:12px;margin:0 0 32px;">
                <div style="width:32px;height:2px;background:${ac};flex-shrink:0;"></div>
                <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0;">${eyebrow}</p>
              </div>
              <h1 data-edit="page.heroHeading" style="font-family:'${hf}',sans-serif;font-size:clamp(36px,5.5vw,80px);color:#ffffff;margin:0 0 28px;font-weight:400;line-height:1.05;">${heading || page.name}</h1>
              ${subhead ? `<p data-edit="page.heroSubhead" style="font-family:'${bf}',sans-serif;font-size:clamp(15px,1.4vw,19px);color:rgba(255,255,255,0.7);max-width:640px;line-height:1.65;margin:0 0 40px;">${subhead}</p>` : ""}
              <div style="display:flex;gap:32px;flex-wrap:wrap;padding-top:28px;border-top:1px solid rgba(255,255,255,0.15);">
                <div><p style="font-family:'${bf}',sans-serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:${ac};margin:0 0 6px;">Client</p><p style="font-family:'${bf}',sans-serif;font-size:14px;color:#ffffff;margin:0;font-weight:500;">${brand.name || "Client Name"}</p></div>
                <div><p style="font-family:'${bf}',sans-serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:${ac};margin:0 0 6px;">Industry</p><p style="font-family:'${bf}',sans-serif;font-size:14px;color:#ffffff;margin:0;font-weight:500;">${brand.industry || "Industry"}</p></div>
                <div><p style="font-family:'${bf}',sans-serif;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:${ac};margin:0 0 6px;">Year</p><p style="font-family:'${bf}',sans-serif;font-size:14px;color:#ffffff;margin:0;font-weight:500;">${new Date().getFullYear()}</p></div>
              </div>
            </div>
          </section>`;
        }

        // Standard interior pages (About/Studio, Services, etc.) — light, clean, left-aligned
        return `<section style="background:${headerBg};padding:clamp(60px,8vw,100px) clamp(24px,8vw,100px) clamp(40px,5vw,60px);">
          <p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 20px;">${eyebrow}</p>
          <h1 data-edit="page.heroHeading" style="font-family:'${hf}',sans-serif;font-size:clamp(36px,5vw,${layout.heroHeading || 64}px);color:${headerText};margin:0 0 16px;font-weight:700;line-height:1.1;letter-spacing:-0.02em;">${heading}</h1>
          ${subhead ? `<p data-edit="page.heroSubhead" style="font-family:'${bf}',sans-serif;font-size:clamp(15px,1.4vw,18px);color:${headerSub};margin:0;line-height:1.7;max-width:640px;">${subhead}</p>` : ""}
        </section>`;
      }

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
            <a href="#contact" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase;color:${textOn(ac)};background:${ac};padding:14px 28px;text-decoration:none;display:inline-block;">${brand.cta1}</a>
          </div>`; }).join("")}
        </div>
      </section>`;
    }

    if (s === "Testimonials") {
      const items = (page.testimonials || "").split("\n").filter(Boolean);
      return `<section style="background:${pc};padding:clamp(60px,10vw,140px) clamp(24px,8vw,100px);border-top:1px solid ${bdr};">
        <p data-edit="page.testimonialsEyebrow" style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 60px;">${page.testimonialsEyebrow || "Kind Words"}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;">
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


    if (s === "Portfolio Masonry") {
      const items = (page.portfolio || "").split("\n").filter(Boolean);
      // Assign mixed aspect ratios based on position for masonry feel
      const ratios = ["3/4","4/3","1/1","3/4","4/3","1/1","4/5","16/9","1/1"];
      const tiles = items.map((line, i) => {
        const [t, c, img] = line.split("|");
        const portImg = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 800, 1000, brand.imageCategory);
        const ratio = ratios[i % ratios.length];
        const isWide = ratio === "4/3" || ratio === "16/9";
        return `<div style="min-width:0;${isWide ? "grid-column:span 2;" : ""}">
          <div style="aspect-ratio:${ratio};background:url('${portImg}') center/cover no-repeat;overflow:hidden;"></div>
          ${t ? `<p style="font-family:'${bf}',sans-serif;font-size:12px;color:${ts};margin:10px 0 2px;font-weight:500;">${t}</p>` : ""}
          ${c ? `<p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};margin:0;letter-spacing:.05em;text-transform:uppercase;">${c}</p>` : ""}
        </div>`;
      }).join("");
      const filterCats = [...new Set(items.map(l => l.split("|")[1]).filter(Boolean))];
      const filters = filterCats.length > 1 ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 40px;">
        <button style="padding:6px 16px;background:${headingColor};color:${pc};border:none;border-radius:20px;font-family:'${bf}',sans-serif;font-size:11px;font-weight:600;cursor:pointer;letter-spacing:.05em;">All</button>
        ${filterCats.map(cat => `<button style="padding:6px 16px;background:transparent;color:${ts};border:1px solid ${bdr};border-radius:20px;font-family:'${bf}',sans-serif;font-size:11px;cursor:pointer;letter-spacing:.05em;">${cat}</button>`).join("")}
      </div>` : "";
      return `<section style="background:${pc};padding:clamp(60px,8vw,100px) clamp(24px,8vw,100px);">
        <div style="margin:0 0 48px;">
          ${page.portfolioEyebrow ? `<p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 12px;">${page.portfolioEyebrow}</p>` : ""}
          <h2 style="font-family:'${hf}',sans-serif;font-size:clamp(28px,4vw,48px);color:${headingColor};margin:0;font-weight:700;letter-spacing:-.02em;">${page.portfolioHeading || "Selected work."}</h2>
        </div>
        ${filters}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;grid-auto-rows:auto;">
          ${tiles}
        </div>
      </section>`;
    }

    if (s === "Reel") {
      return `<section style="background:#000;padding:0;position:relative;">
        <div style="aspect-ratio:16/9;background:#111;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
          <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.5));"></div>
          <div style="position:relative;z-index:2;text-align:center;">
            <div style="width:60px;height:60px;border-radius:50%;border:2px solid rgba(255,255,255,0.7);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
              <div style="width:0;height:0;border-top:12px solid transparent;border-bottom:12px solid transparent;border-left:20px solid rgba(255,255,255,0.9);margin-left:4px;"></div>
            </div>
            <p style="font-family:'${bf}',sans-serif;font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:.2em;text-transform:uppercase;margin:0;">${page.heroEyebrow || "Showreel"}</p>
            <h2 style="font-family:'${hf}',sans-serif;font-size:clamp(28px,4vw,56px);color:#fff;margin:8px 0 0;font-weight:700;letter-spacing:-.02em;">${page.heroHeading || brand.name}</h2>
          </div>
        </div>
      </section>`;
    }

    if (s === "Portfolio Grid") {
      const items = (page.portfolio || "").split("\n").filter(Boolean);
      const tiles = items.map((line, i) => {
        const [t, c, img] = line.split("|");
        const portImg = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 800, 800, brand.imageCategory);
        return `<div style="min-width:0;position:relative;group;">
          <div style="aspect-ratio:1/1;background:url('${portImg}') center/cover no-repeat;overflow:hidden;">
            <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;">
              <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.6);display:flex;align-items:center;justify-content:center;">
                <div style="width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:12px solid rgba(255,255,255,0.9);margin-left:3px;"></div>
              </div>
            </div>
          </div>
          ${t ? `<p style="font-family:'${bf}',sans-serif;font-size:13px;color:${headingColor};margin:10px 0 2px;font-weight:500;">${t}</p>` : ""}
          ${c ? `<p style="font-family:'${bf}',sans-serif;font-size:11px;color:${ac};margin:0;letter-spacing:.05em;text-transform:uppercase;">${c}</p>` : ""}
        </div>`;
      }).join("");
      const filterCats = [...new Set(items.map(l => l.split("|")[1]).filter(Boolean))];
      const filters = filterCats.length > 1 ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 40px;">
        <button style="padding:6px 16px;background:${headingColor};color:${pc};border:none;border-radius:20px;font-family:'${bf}',sans-serif;font-size:11px;font-weight:600;cursor:pointer;">All</button>
        ${filterCats.map(cat => `<button style="padding:6px 16px;background:transparent;color:${ts};border:1px solid ${bdr};border-radius:20px;font-family:'${bf}',sans-serif;font-size:11px;cursor:pointer;">${cat}</button>`).join("")}
      </div>` : "";
      return `<section style="background:${pc};padding:clamp(60px,8vw,100px) clamp(24px,8vw,100px);">
        <div style="margin:0 0 48px;">
          ${page.portfolioEyebrow ? `<p style="font-family:'${bf}',sans-serif;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:${ac};margin:0 0 12px;">${page.portfolioEyebrow}</p>` : ""}
          <h2 style="font-family:'${hf}',sans-serif;font-size:clamp(28px,4vw,48px);color:${headingColor};margin:0;font-weight:700;letter-spacing:-.02em;">${page.portfolioHeading || "Selected films."}</h2>
        </div>
        ${filters}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">${tiles}</div>
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
      #mobile-nav{display:none;}
      @media(max-width:768px){
        .footer-grid{grid-template-columns:1fr !important;gap:20px !important;}
        .about-grid{grid-template-columns:1fr !important;gap:24px !important;}
        .nav-links{display:none !important;}
        .hamburger{display:flex !important;}
        #mobile-nav.open{display:block !important;}
        .hero-split{grid-template-columns:1fr !important;gap:24px !important;}
        .hero-split>div:last-child{height:200px !important;width:100% !important;border-radius:8px !important;}
        section [style*="grid-template-columns: repeat"],section [style*="grid-template-columns:repeat"]{grid-template-columns:1fr !important;gap:16px !important;}
        section [style*="grid-template-columns: 80px"],section [style*="grid-template-columns:80px"]{grid-template-columns:1fr !important;gap:12px !important;}
        section [style*="grid-template-columns: 1fr 1fr"],section [style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr !important;gap:20px !important;}
        [style*="display:flex"][style*="gap:48px"],[style*="display:flex"][style*="gap:64px"],[style*="display:flex"][style*="gap:80px"]{flex-direction:column !important;gap:20px !important;}
        section{padding:32px 18px !important;}
        section > div{padding-left:0 !important;padding-right:0 !important;}
        section > div > *{margin-left:0 !important;margin-right:0 !important;}
        [style*="aspect-ratio:16/9"],[style*="aspect-ratio: 16/9"]{aspect-ratio:unset !important;height:180px !important;}
        [style*="aspect-ratio:4/3"],[style*="aspect-ratio: 4/3"]{aspect-ratio:unset !important;height:180px !important;}
        [style*="aspect-ratio:3/4"],[style*="aspect-ratio: 3/4"]{aspect-ratio:unset !important;height:200px !important;}
        [style*="aspect-ratio:1;"],[style*="aspect-ratio: 1;"]{aspect-ratio:unset !important;height:160px !important;}
        div[style*="height:120px"]{height:24px !important;}
        div[style*="height:96px"]{height:20px !important;}
        div[style*="height:80px"]{height:16px !important;}
        div[style*="height:64px"]{height:14px !important;}
        div[style*="height:48px"]{height:12px !important;}
        div[style*="height:40px"]{height:10px !important;}
        div[style*="height:32px"]{height:8px !important;}
        div[style*="height:24px"]{height:6px !important;}
        div[style*="height:16px"]{height:4px !important;}
        h1{font-size:clamp(26px,7vw,38px) !important;line-height:1.15 !important;margin-bottom:16px !important;}
        h2{font-size:clamp(22px,6vw,30px) !important;margin-bottom:14px !important;}
        h3{font-size:17px !important;margin-bottom:10px !important;}
        h2[style*="margin:0 0 80px"]{margin-bottom:24px !important;}
        h2[style*="margin:0 0 60px"]{margin-bottom:20px !important;}
        h2[style*="margin:0 0 40px"]{margin-bottom:16px !important;}
        a[style*="display:inline-block"]{white-space:normal !important;text-align:center !important;width:100% !important;box-sizing:border-box !important;}box-sizing:border-box !important;
        nav{padding:14px 20px !important;}
        .cta-grid{grid-template-columns:1fr !important;}
        [style*="min-height:80vh"],[style*="min-height: 80vh"]{min-height:50vh !important;}
        footer{padding:32px 20px !important;}
        .footer-grid > div{padding-left:0 !important;}
      }
      /* Inline editing affordances */
      [data-edit]{position:relative;cursor:text;transition:outline 0.15s, background 0.15s;outline:1px dashed transparent;outline-offset:6px;border-radius:2px;}
      [data-edit]:hover{outline:1px dashed rgba(124,58,237,0.6);background:rgba(124,58,237,0.04);}
      [data-edit]:focus{outline:2px solid rgba(124,58,237,0.9);background:rgba(124,58,237,0.06);}
      [data-edit]:focus::before{content:attr(data-edit);position:absolute;top:-22px;left:0;background:#b45309;color:#fff;font-family:system-ui,sans-serif;font-size:9px;padding:3px 7px;border-radius:3px;letter-spacing:0.05em;text-transform:uppercase;font-weight:600;font-style:normal;pointer-events:none;}
      [data-edit-toast]{position:fixed;bottom:20px;right:20px;background:#0a0a14;color:#fff;padding:10px 16px;border-radius:6px;font-family:system-ui,sans-serif;font-size:12px;border:1px solid #b45309;box-shadow:0 4px 16px rgba(0,0,0,0.4);z-index:9999;opacity:0;transition:opacity 0.2s;pointer-events:none;}
      [data-edit-toast].show{opacity:1;}
    </style>
    </head><body>
    <nav style="position:sticky;top:0;background:${pc}f5;backdrop-filter:blur(10px);padding:20px clamp(24px,8vw,100px);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid ${bdr};z-index:100;">
      <a href="#" style="text-decoration:none;display:inline-flex;align-items:center;">${logoHTML(18, "left")}</a>
      <div class="nav-links" style="display:flex;align-items:center;">${navLinks}${navSocial}</div>
      <button class="hamburger" onclick="toggleMobileNav()" style="display:none;align-items:center;cursor:pointer;background:none;border:none;padding:4px;">
        <svg id="ham-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${headingColor}" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        <svg id="close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${headingColor}" stroke-width="2" stroke-linecap="round" style="display:none;"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg>
      </button>
    </nav>
    <div id="mobile-nav" style="background:${pc};border-top:1px solid ${bdr};padding:0 20px;">
      <div style="display:flex;flex-direction:column;">
        ${(brand.navItems || ["Home","About","Services","Contact"]).map(item => `<a href="#" style="color:${headingColor};text-decoration:none;font-size:16px;font-weight:500;padding:14px 0;border-bottom:1px solid ${bdr};display:block;">${item}</a>`).join("")}
      </div>
    </div>
    ${page.sections.map(section).join("")}
    ${footer}
    <div id="edit-toast" data-edit-toast>✓ Saved</div>
    <script>
      // Inline editing: contentEditable + postMessage on blur back to parent App
      function toggleMobileNav() {
        var nav = document.getElementById('mobile-nav');
        var ham = document.getElementById('ham-icon');
        var cls = document.getElementById('close-icon');
        var open = nav.classList.toggle('open');
        ham.style.display = open ? 'none' : 'block';
        cls.style.display = open ? 'block' : 'none';
      }
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