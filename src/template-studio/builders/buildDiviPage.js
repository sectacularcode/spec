import { THEMES } from "../constants/themes.js";
import { imgOrPlaceholder } from "../utils/images.js";
import { he } from "../utils/htmlEscape.js";
import { textOn, mutedTextOn, buttonOn, buttonVariations } from "../utils/colors.js";
// Builds Divi shortcode format for a page (secondary export format)
// Returns a plain string of Divi [et_pb_*] shortcodes.
export function buildDiviPage(page, brand) {
  const { primaryColor: pc, accentColor: ac, cardBgColor: card, bodyTextColor: body, headingFont: hf, bodyFont: bf } = brand;
  const ts = body;
  const theme = THEMES.find(t => t.id === brand.themeId);
  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
  const hc = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");

  // Responsive padding string: desktop "T|R|B|L" plus tablet/phone scaled-down variants.
  // Divi decodes HTML entities in shortcode attribute values the same way it decodes
  // tag content, so he() is safe (and required) in every attribute below.
  const dPad = (t, r, b, l) => {
    const mk = (mult) => `${Math.round(t * mult)}px|${Math.round(r * mult)}px|${Math.round(b * mult)}px|${Math.round(l * mult)}px`;
    return `custom_padding="${mk(1)}" custom_padding_tablet="${mk(0.7)}" custom_padding_phone="${mk(0.5)}" custom_padding_last_edited="on|desktop"`;
  };
  // Responsive font-size attribute trio for a given Divi attribute prefix (e.g. "header_font_size").
  const dFontAttr = (attr, size, tabletRatio = 0.8, phoneRatio = 0.6, min = 12) => {
    const t = Math.max(Math.round(size * tabletRatio), min);
    const p = Math.max(Math.round(size * phoneRatio), min);
    return `${attr}="${size}px" ${attr}_tablet="${t}px" ${attr}_phone="${p}px" ${attr}_last_edited="on|desktop"`;
  };

  // Divi shortcode helpers
  const dSec = (bg, pad = 100, inner = "") =>
    `[et_pb_section fb_built="1" background_color="${bg}" ${dPad(pad, 20, pad, 20)}]${inner}[/et_pb_section]`;
  const dRow = (cols = "4_4", inner = "") =>
    cols === "4_4" ? `[et_pb_row]${inner}[/et_pb_row]` : `[et_pb_row column_structure="${cols}"]${inner}[/et_pb_row]`;
  const dCol = (type = "4_4", inner = "") => `[et_pb_column type="${type}"]${inner}[/et_pb_column]`;
  const dHead = (text, tag = "h2", color = hc, font = hf, size = 48, align = "left") => {
    const k = tag === "h1" ? "" : tag.charAt(1) + "_";
    const tabletR = size > 50 ? 0.7 : 0.85;
    const phoneR = size > 50 ? 0.5 : 0.75;
    return `[et_pb_text header_${k}font="${font}|400|||||||" header_${k}text_color="${color}" ${dFontAttr(`header_${k}font_size`, size, tabletR, phoneR, 14)} text_orientation="${align}" module_alignment="${align}"]<${tag}>${he(text)}</${tag}>[/et_pb_text]`;
  };
  const dTxt = (html, color = ts, font = bf, size = 16, align = "left") =>
    `[et_pb_text text_font="${font}||||" text_text_color="${color}" ${dFontAttr("text_font_size", size, 0.95, 0.85, 13)} text_orientation="${align}"]<p>${he(html)}</p>[/et_pb_text]`;
  // variant "solid" (default) is the original behavior. variant "outline" renders
  // a transparent-fill bordered button, for pairing a Secondary CTA next to Primary.
  const dBtn = (text, link = "#", bg = ac, color = textOn(bg), align = "left", variant = "solid", borderColor = color) => {
    const bgAttr = variant === "outline" ? `button_bg_color="rgba(0,0,0,0)"` : `button_bg_color="${bg}"`;
    const borderAttr = variant === "outline" ? `button_border_width="2px" button_border_color="${borderColor}"` : "";
    return `[et_pb_button button_text="${he(text)}" button_url="${link}" button_alignment="${align}" custom_button="on" button_text_color="${color}" ${bgAttr} ${borderAttr} button_font="${bf}|700|on|on|||||" button_letter_spacing="2px" button_text_size="11px" custom_padding="16px|36px|16px|36px|true|true" custom_padding_tablet="14px|28px|14px|28px|true|true" custom_padding_phone="12px|24px|12px|24px|true|true" custom_padding_last_edited="on|desktop"][/et_pb_button]`;
  };
  const dImg = (url, alt = "") =>
    `[et_pb_image src="${url}" alt="${he(alt)}" align="center"][/et_pb_image]`;
  const dDiv = (h = 40) =>
    `[et_pb_divider color="transparent" divider_position="top" height="${h}px" hide_on_mobile="off"][/et_pb_divider]`;
  const dBlurb = (title, content) =>
    `[et_pb_blurb title="${he(title)}" header_font="${hf}|500|||||||" header_text_color="${hc}" header_font_size="22px" body_font="${bf}||||" body_text_color="${ts}" body_font_size="14px"]${he(content)}[/et_pb_blurb]`;
  const dTest = (text, name, role) =>
    `[et_pb_testimonial author="${he(name)}" job_title="${he(role)}" body_font="${hf}||||" body_text_color="${hc}" body_font_size="22px" author_font="${bf}|600||on|||||" author_text_color="${ac}"]${he(text)}[/et_pb_testimonial]`;
  const dCount = (num, suffix, label) =>
    `[et_pb_number_counter title="${he(label)}" number="${parseInt(num) || 0}" percent_sign="off" counter_color="${ac}" title_font="${bf}|500||on|||||" title_text_color="${hc}" number_font="${hf}||||" number_font_size="56px"][/et_pb_number_counter]`;
  const dAcc = (items) =>
    `[et_pb_accordion toggle_font="${hf}|400||||||" toggle_text_color="${hc}" icon_color="${ac}"]${items.map(([q, a]) => `[et_pb_accordion_item title="${he(q)}"]${he(a)}[/et_pb_accordion_item]`).join("")}[/et_pb_accordion]`;
  const dSocial = (links) =>
    `[et_pb_social_media_follow url_new_window="on" follow_button="off" icon_color="${hc}"]${links.map(l => `[et_pb_social_media_follow_network social_network="${l.key}" url="${l.url}" bg_color="transparent"]${he(l.label)}[/et_pb_social_media_follow_network]`).join("")}[/et_pb_social_media_follow]`;
  const dVid = (url) =>
    `[et_pb_video src="${url}"][/et_pb_video]`;
  const dForm = (title, fields, btn) => {
    const f = fields.map(fl => {
      const ft = /message|details|notes/i.test(fl) ? "text" : (/email/i.test(fl) ? "email" : "input");
      return `[et_pb_contact_field field_id="${fl.toLowerCase().replace(/[^a-z0-9]+/g, "_")}" field_title="${he(fl)}" field_type="${ft}" fullwidth_field="on"][/et_pb_contact_field]`;
    }).join("");
    return `[et_pb_contact_form title="${he(title)}" submit_button_text="${he(btn)}" custom_button="on" button_bg_color="${ac}" button_text_color="${textOn(ac)}" form_field_text_color="${hc}" form_field_background_color="transparent"]${f}[/et_pb_contact_form]`;
  };

  const sections = [];

  page.sections.forEach(s => {
    if (s === "Hero") {
      const img = imgOrPlaceholder(page.heroImage, `${brand.name}-hero`, 1600, 1000, brand.imageCategory);
      // Primary-only when brand.cta2 is blank (unchanged); Primary + Secondary side by
      // side in a two-column row when it's filled in, same pairing logic as the
      // Elementor builder so Divi export doesn't silently drop the Secondary CTA text.
      const heroVars = buttonVariations(pc, ac);
      const heroBtns = brand.cta2
        ? dRow("1_2,1_2",
            dCol("1_2", dBtn(brand.cta1, "#contact", heroVars.primary.bg, heroVars.primary.text, "left")) +
            dCol("1_2", dBtn(brand.cta2, "#contact", "transparent", heroVars.secondary.text, "left", "outline", heroVars.secondary.border))
          )
        : dBtn(brand.cta1, "#contact", heroVars.primary.bg, heroVars.primary.text, "left");
      const inner = dRow("4_4", dCol("4_4",
        dTxt(`●  STUDIO`, ac, bf, 11, "left") + dDiv(24) +
        dHead(page.heroHeading || brand.tagline, "h1", hc, hf, 84, "left") + dDiv(28) +
        dTxt(page.heroSubhead || (brand.keyMessages || "").split(".")[0], ts, bf, 18, "left") + dDiv(48) +
        heroBtns
      ));
      sections.push(`[et_pb_section fb_built="1" background_color="${pc}" background_image="${img}" background_blend="overlay" ${dPad(160, 20, 160, 20)}]${inner}[/et_pb_section]`);
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
      const cards = items.slice(0, 3).map((line, i) => {
        const [t, c, img] = line.split("|");
        const portImg = imgOrPlaceholder(img, `${brand.name}-portfolio-${i}`, 800, 1000, brand.imageCategory);
        return dCol("1_3", dImg(portImg, t || "") + dHead(t || "", "h3", hc, hf, 22, "left") + dTxt(c || "", ac, bf, 12, "left"));
      }).join("");
      const cardRow = dRow("1_3,1_3,1_3", cards);
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
      const cards = items.slice(0, 3).map(line => { const [tier, price, desc] = line.split("|"); return dCol("1_3", dHead(tier || "", "h4", hc, hf, 22, "center") + dHead(price || "", "h3", ac, hf, 40, "center") + dTxt(desc || "", ts, bf, 14, "center") + dDiv(24) + dBtn(brand.cta1, "#contact", ac, textOn(ac), "center")); }).join("");
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
      const ctaBtn = buttonOn(ac, pc);
      const inner = dRow("4_4", dCol("4_4",
        dHead(page.ctaHeading || "Ready to make something worth seeing?", "h2", textOn(ac), hf, 64, "center") + dDiv(28) +
        dTxt(brand.tagline || "", mutedTextOn(ac), bf, 17, "center") + dDiv(40) +
        dBtn(brand.cta1, "#contact", ctaBtn.btnBg, ctaBtn.btnText, "center")
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



// ──────────────────────────────────────────────────────────────────────────────
// AUDIT — categorized: critical, content, seo, aio, best
// Each item: { category, msg, fix?, target: { tab, section } }
// The target tells the UI exactly where to jump when the user clicks an item.
// ──────────────────────────────────────────────────────────────────────────────