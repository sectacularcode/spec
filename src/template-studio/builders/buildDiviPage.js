import { THEMES } from "../constants/themes.js";
// Builds Divi shortcode format for a page (secondary export format)
// Returns a plain string of Divi [et_pb_*] shortcodes.
export function buildDiviPage(page, brand) {
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

  if (footerStyle === "Two Column") {
    inner = `[et_pb_row column_structure="1_2,1_2"][et_pb_column type="1_2"]${logo(24, "left")}${txt(brand.tagline || "", body, 13, "left")}${txt(`© ${new Date().getFullYear()} ${brand.name}`, body, 11, "left")}[/et_pb_column][et_pb_column type="1_2"]${txt(menu(brand.primaryMenu), body, 13, "right")}[/et_pb_column][/et_pb_row]`;
  } else if (footerStyle === "Dark Bar") {
    const darkCard = "#0a0a0a";
    inner = `[et_pb_row][et_pb_column type="4_4"]<div style="display:flex;justify-content:space-between;align-items:center;">${logoText}<span style="color:#888;font-size:11px;">© ${new Date().getFullYear()} ${brand.name}. All rights reserved.</span></div>[/et_pb_column][/et_pb_row]`;
    const shortcodeDark = `[et_pb_section fb_built="1" background_color="${darkCard}" custom_padding="20px|20px|20px|20px"]${inner}[/et_pb_section]`;
    return { context: "et_builder", data: { "1": shortcodeDark }, presets: {}, global_colors: [] };
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