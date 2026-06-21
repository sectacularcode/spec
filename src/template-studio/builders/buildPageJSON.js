import { THEMES } from "../constants/themes.js";
import { LAYOUTS, getLayout, eyebrowText } from "../constants/layouts.js";
import { luminance, contrastRatio, isLight, textOn, mutedTextOn, subtleTextOn, buttonOn } from "../utils/colors.js";
import { IMAGE_LIBRARY, pickImage, imgOrPlaceholder } from "../utils/images.js";
import { SVG } from "../utils/svg.js";
import { he } from "../utils/htmlEscape.js";
import { uid, eContainer, eSection, eRow, eCol, rPx, eHead, eTxt, eBtn, eSpacer, eImg, eIconBox, eCounter, eAccordion, eSocial, eVideo, eCarousel, eForm, eNavMenu, eShortcode, eHTML, eMarquee } from "./helpers.js";
// Builds Elementor JSON for a single page based on its section list and brand settings.
// Iterates the page.sections array and routes each section type to the right widget builder.
// To add a new section type: add a case in the big if/else block below.

export function buildPageJSON(page, brand) {
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