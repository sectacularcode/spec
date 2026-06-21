// Builds Divi shortcode format for the site footer
export function buildDiviFooter(brand) {
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
