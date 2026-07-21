import { THEMES } from "../constants/themes.js";
import { isLight, headingColorOn } from "../utils/colors.js";
import { he } from "../utils/htmlEscape.js";
// Builds Divi shortcode format for the site footer
export function buildDiviFooter(brand) {
  const { accentColor: ac, cardBgColor: card, headingFont: hf, bodyFont: bf, footerStyle } = brand;
  const theme = THEMES.find(t => t.id === brand.themeId);
  // Footer's own background is cardBgColor, not primaryColor -- computed from the
  // footer's actual background rather than a global site-mode flag that can go
  // stale relative to it. Same fix as buildFooterJSON.js (Elementor equivalent).
  const isDark = !isLight(card);
  const hc = headingColorOn(card, theme && theme.headingColor);
  const body = isDark ? "#888" : "#666";
  const logoText = brand.logoText || brand.name;

  // NOTE: `html` here is a caller-composed fragment (may legitimately contain
  // literal tags like <strong>/<a> for static labels) — callers are
  // responsible for escaping their own user-data leaves before calling this.
  const txt = (html, color = body, size = 13, align = "left") =>
    `[et_pb_text text_font="${bf}||||" text_text_color="${color}" text_font_size="${size}px" text_orientation="${align}"]<p>${html}</p>[/et_pb_text]`;
  // `text` is always plain (logoText) — safe to escape unconditionally.
  const head = (text, size = 28, align = "left") =>
    `[et_pb_text header_2_font="${hf}|400|||||||" header_2_text_color="${hc}" header_2_font_size="${size}px" text_orientation="${align}" module_alignment="${align}"]<h2>${he(text)}</h2>[/et_pb_text]`;
  const logo = (size, align) => brand.logoUrl
    ? `[et_pb_image src="${brand.logoUrl}" alt="${he(brand.name)}" align="${align}"][/et_pb_image]`
    : head(logoText, size, align);
  const social = `[et_pb_social_media_follow url_new_window="on" follow_button="off" icon_color="${hc}" module_alignment="center"]${(brand.socialLinks || []).map(l => `[et_pb_social_media_follow_network social_network="${l.key}" url="${l.url}" bg_color="transparent"]${he(l.label)}[/et_pb_social_media_follow_network]`).join("")}[/et_pb_social_media_follow]`;
  const menu = (m) => (m || "").split(",").map(item => `<a href="#" style="display:block;color:${body};text-decoration:none;margin-bottom:10px;font-family:${bf};font-size:13px;">${he(item.trim())}</a>`).join("");

  const tagline = he(brand.tagline || "");
  const contactEmail = he(brand.contactEmail || "");
  const contactPhone = he(brand.contactPhone || "");
  const copyright = he(brand.name);
  const utilityLine = he(brand.utilityMenu || "");

  let inner;
  if (footerStyle === "Editorial") {
    inner = `[et_pb_row][et_pb_column type="4_4"]${logo(28, "center")}${txt(tagline, body, 13, "center")}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${social}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${txt(`© ${new Date().getFullYear()} ${copyright}. All rights reserved.`, body, 11, "center")}[/et_pb_column][/et_pb_row]`;
  } else if (footerStyle === "Studio") {
    inner = `[et_pb_row][et_pb_column type="4_4"]${logo(28, "center")}[et_pb_divider color="transparent" height="16px"][/et_pb_divider]${txt(menu(brand.primaryMenu), body, 13, "center")}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${social}[et_pb_divider color="transparent" height="24px"][/et_pb_divider]${txt(`© ${new Date().getFullYear()} ${copyright}`, body, 11, "center")}[/et_pb_column][/et_pb_row]`;
  } else if (footerStyle === "Agency") {
    inner = `[et_pb_row column_structure="1_3,1_3,1_3"][et_pb_column type="1_3"]${logo(24, "left")}${txt(tagline, body, 13, "left")}${social}[/et_pb_column][et_pb_column type="1_3"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Pages</strong>`, ac, 11, "left")}${txt(menu(brand.primaryMenu), body, 13, "left")}[/et_pb_column][et_pb_column type="1_3"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Contact</strong>`, ac, 11, "left")}${txt(contactEmail, body, 13, "left")}${txt(contactPhone, body, 13, "left")}[/et_pb_column][/et_pb_row][et_pb_row][et_pb_column type="4_4"]${txt(`© ${new Date().getFullYear()} ${copyright}. ${utilityLine}`, body, 11, "left")}[/et_pb_column][/et_pb_row]`;
  } else {
    inner = `[et_pb_row column_structure="1_2,1_4,1_4"][et_pb_column type="1_2"]${logo(28, "left")}${txt(tagline, body, 14, "left")}${txt(contactEmail, body, 13, "left")}${social}[/et_pb_column][et_pb_column type="1_4"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Pages</strong>`, ac, 11, "left")}${txt(menu(brand.primaryMenu), body, 13, "left")}[/et_pb_column][et_pb_column type="1_4"]${txt(`<strong style="color:${ac};text-transform:uppercase;letter-spacing:0.15em;font-size:11px;">Legal</strong>`, ac, 11, "left")}${txt(menu(brand.utilityMenu), body, 13, "left")}[/et_pb_column][/et_pb_row][et_pb_row][et_pb_column type="4_4"]${txt(`© ${new Date().getFullYear()} ${copyright}. All rights reserved.`, body, 11, "left")}[/et_pb_column][/et_pb_row]`;
  }

  if (footerStyle === "Two Column") {
    inner = `[et_pb_row column_structure="1_2,1_2"][et_pb_column type="1_2"]${logo(24, "left")}${txt(tagline, body, 13, "left")}${txt(`© ${new Date().getFullYear()} ${copyright}`, body, 11, "left")}[/et_pb_column][et_pb_column type="1_2"]${txt(menu(brand.primaryMenu), body, 13, "right")}[/et_pb_column][/et_pb_row]`;
  } else if (footerStyle === "Dark Bar") {
    const darkCard = "#0a0a0a";
    inner = `[et_pb_row][et_pb_column type="4_4"]<div style="display:flex;justify-content:space-between;align-items:center;">${he(logoText)}<span style="color:#888;font-size:11px;">© ${new Date().getFullYear()} ${copyright}. All rights reserved.</span></div>[/et_pb_column][/et_pb_row]`;
    const shortcodeDark = `[et_pb_section fb_built="1" background_color="${darkCard}" custom_padding="20px|20px|20px|20px" custom_padding_tablet="16px|16px|16px|16px" custom_padding_phone="12px|16px|12px|16px" custom_padding_last_edited="on|desktop"]${inner}[/et_pb_section]`;
    return { context: "et_builder", data: { "1": shortcodeDark }, presets: {}, global_colors: [] };
  }

  const shortcode = `[et_pb_section fb_built="1" background_color="${card}" custom_padding="80px|20px|40px|20px" custom_padding_tablet="56px|20px|28px|20px" custom_padding_phone="40px|20px|20px|20px" custom_padding_last_edited="on|desktop"]${inner}[/et_pb_section]`;

  return {
    context: "et_builder",
    data: { "1": shortcode },
    presets: {},
    global_colors: [],
    thumbnails: [],
    images: {},
  };
}
