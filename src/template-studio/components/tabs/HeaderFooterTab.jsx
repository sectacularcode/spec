import { Section } from "../Section.jsx";
import { I } from "../../styles.js";
import { FOOTER_STYLES, HEADER_STYLES } from "../../constants/ui.jsx";
import { THEMES } from "../../constants/themes.js";
import { he } from "../../utils/htmlEscape.js";

export default function HeaderFooterTab({ ctx }) {
  const { brand, updBrand } = ctx;
  return (
            <>
              <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 24px 40px" }}>
              <Section id="nav-logo" title="Logo & Brand" icon="">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div><label style={I.lbl}>Logo Text</label><input style={I.inp} value={brand.logoText || ""} onChange={e => updBrand("logoText", e.target.value)} placeholder={brand.name || "Brand Name"} />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>Displayed in the header and footer. Upload your actual logo in Elementor after import.</div></div>
                  <div><label style={I.lbl}>Tagline</label><input style={I.inp} value={brand.tagline || ""} onChange={e => updBrand("tagline", e.target.value)} placeholder="e.g. Building brands that last." />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>Shown in the footer beneath the logo.</div></div>
                </div>
              </Section>
              <Section id="nav-menus" title="Navigation Menus" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px", lineHeight: 1.5 }}>Menu items for your header and footer. Create matching menus in WP → Appearance → Menus.</p>
                <div><label style={I.lbl}>Primary Menu (comma-separated)</label><input style={I.inp} value={brand.primaryMenu} onChange={e => updBrand("primaryMenu", e.target.value)} placeholder="Home, About, Services, Work, Contact" /></div>
                <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "#09090b" }}>
                  <input type="checkbox" checked={brand.multiMenu} onChange={e => updBrand("multiMenu", e.target.checked)} style={{ accentColor: "#6b635c" }} /> Enable utility menu (footer/legal links)
                </label>
                {brand.multiMenu && <div><label style={I.lbl}>Utility Menu (comma-separated)</label><input style={I.inp} value={brand.utilityMenu} onChange={e => updBrand("utilityMenu", e.target.value)} placeholder="Privacy, Terms, Sitemap" /></div>}
              </Section>
              <Section id="footer-header" title="Header Style" icon="">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px" }}>
                  {HEADER_STYLES.map(f => (
                    <button key={f} onClick={() => updBrand("headerStyle", f)} style={{ padding: "16px", background: "#ffffff", border: brand.headerStyle === f ? "2px solid #000000" : "1px solid #dde0e6", color: "#000000", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }} onMouseOver={e => { if (brand.headerStyle !== f) e.currentTarget.style.borderColor = "#a3a39e"; }} onMouseOut={e => { if (brand.headerStyle !== f) e.currentTarget.style.borderColor = "#dde0e6"; }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{f}</div>
                      <div style={{ fontSize: "12px", color: "#09090b" }}>
                        {f === "Editorial" && "Logo left, nav center, social right"}
                        {f === "Studio" && "Centered logo with nav below — masthead"}
                        {f === "Agency" && "Logo left, nav + social right"}
                        {f === "Premium" && "Logo, nav, social + CTA button"}
                        {f === "Social First" && "Logo left, social icons right — no nav links"}
                        {f === "Transparent" && "Transparent over hero, solid on scroll"}
                      </div>
                    </button>
                  ))}
                </div>
                {(() => {
                  const pc = brand.primaryColor || "#ffffff";
                  const ac = brand.accentColor || "#000000";
                  const bf = brand.bodyFont || "Inter";
                  const hf = brand.headingFont || "Inter";
                  const theme = THEMES.find(t => t.id === brand.themeId);
                  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
                  const hc = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
                  const tc = brand.bodyTextColor || (isDark ? "#aaa" : "#444");
                  const safeLogoText = he(brand.logoText || brand.name || "Brand");
                  const logoEl = brand.logoUrl
                    ? `<img src="${he(brand.logoUrl)}" style="height:28px;width:auto;" />`
                    : `<span style="font-family:'${hf}',sans-serif;font-size:20px;font-weight:700;color:${hc};">${safeLogoText}</span>`;
                  const navLinks = (brand.primaryMenu || "Home, About, Services, Contact").split(",").map(l =>
                    `<a href="#" style="font-family:'${bf}',sans-serif;font-size:13px;color:${tc};text-decoration:none;margin:0 12px;white-space:nowrap;">${he(l.trim())}</a>`).join("");
                  const btnTxt = `<a href="#" style="font-family:'${bf}',sans-serif;font-size:12px;font-weight:600;color:#fff;background:${ac};padding:8px 18px;text-decoration:none;border-radius:4px;white-space:nowrap;">${he(brand.cta1 || "Get in touch")}</a>`;
                  const hs = brand.headerStyle || "Editorial";
                  let headerHTML = "";
                  if (hs === "Editorial") headerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0 40px;height:60px;background:${pc};border-bottom:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}<div style="display:flex;">${navLinks}</div><div></div></div>`;
                  else if (hs === "Studio") headerHTML = `<div style="text-align:center;padding:16px 40px;background:${pc};border-bottom:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};"><div style="margin-bottom:10px;">${logoEl}</div><div>${navLinks}</div></div>`;
                  else if (hs === "Agency") headerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0 40px;height:60px;background:${pc};border-bottom:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}<div style="display:flex;align-items:center;">${navLinks}</div></div>`;
                  else if (hs === "Social First") headerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0 40px;height:60px;background:${pc};border-bottom:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}<div style="display:flex;align-items:center;gap:16px;">${(brand.socialLinks||[]).slice(0,4).map(_s=>`<span style="width:18px;height:18px;background:${tc};border-radius:50%;display:inline-block;opacity:0.6;"></span>`).join("")||`<span style="font-size:11px;color:${tc};opacity:0.6;">Social icons</span>`}</div></div>`;
                  else if (hs === "Transparent") headerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0 40px;height:60px;background:linear-gradient(to bottom,rgba(0,0,0,0.3),transparent);border:none;">${logoEl}<div style="display:flex;">${navLinks}</div><div></div></div><div style="font-size:10px;color:#6b7280;padding:4px 12px;background:#f5f5f7;text-align:center;">Starts transparent over hero — goes solid on scroll</div>`;
                  else headerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:0 40px;height:60px;background:${pc};border-bottom:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}<div style="display:flex;align-items:center;">${navLinks}</div>${btnTxt}</div>`;
                  return (
                    <div style={{ marginTop: "12px", border: "1px solid #dde0e6", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ fontSize: "10px", color: "#6b7280", padding: "6px 12px", background: "#f5f5f7", borderBottom: "1px solid #dde0e6", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Header Preview — {brand.headerStyle || "Editorial"}</div>
                      <div dangerouslySetInnerHTML={{ __html: headerHTML }} />
                    </div>
                  );
                })()}

              </Section>
              <Section id="footer-footer" title="Footer Style" icon="">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px" }}>
                  {FOOTER_STYLES.map(f => (
                    <button key={f} onClick={() => updBrand("footerStyle", f)} style={{ padding: "16px", background: "#ffffff", border: brand.footerStyle === f ? "2px solid #000000" : "1px solid #dde0e6", color: "#000000", borderRadius: "8px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }} onMouseOver={e => { if (brand.footerStyle !== f) e.currentTarget.style.borderColor = "#a3a39e"; }} onMouseOut={e => { if (brand.footerStyle !== f) e.currentTarget.style.borderColor = "#dde0e6"; }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{f}</div>
                      <div style={{ fontSize: "12px", color: "#09090b" }}>
                        {f === "Editorial" && "Minimal centered — logo, social, copyright"}
                        {f === "Studio" && "Centered with nav links"}
                        {f === "Agency" && "3-column with menu and contact"}
                        {f === "Premium" && "4-column full with services, follow, legal"}
                        {f === "Two Column" && "Logo + tagline left, nav links right"}
                        {f === "Dark Bar" && "Single row — logo left, copyright right, minimal"}
                      </div>
                    </button>
                  ))}
                </div>
                {(() => {
                  const pc = brand.primaryColor || "#ffffff";
                  const ac = brand.accentColor || "#c9a86a";
                  const bf = brand.bodyFont || "Inter";
                  const hf = brand.headingFont || "Inter";
                  const theme = THEMES.find(t => t.id === brand.themeId);
                  const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
                  const hc = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
                  const tc = brand.bodyTextColor || (isDark ? "#888" : "#666");
                  const safeLogoTextF = he(brand.logoText || brand.name || "Brand");
                  const logoEl = brand.logoUrl
                    ? `<img src="${he(brand.logoUrl)}" style="height:24px;width:auto;" />`
                    : `<span style="font-family:'${hf}',sans-serif;font-size:18px;font-weight:700;color:${hc};">${safeLogoTextF}</span>`;
                  const navLinks = (brand.primaryMenu || "Home, About, Services, Contact").split(",").map(l =>
                    `<a href="#" style="font-family:'${bf}',sans-serif;font-size:12px;color:${tc};text-decoration:none;margin:0 10px;">${he(l.trim())}</a>`).join("");
                  const tagline = brand.tagline ? `<p style="font-family:'${bf}',sans-serif;font-size:12px;color:${tc};margin:8px 0 0;">${he(brand.tagline)}</p>` : "";
                  const email = brand.contactEmail ? `<p style="font-family:'${bf}',sans-serif;font-size:12px;color:${tc};margin:6px 0 0;">${he(brand.contactEmail)}</p>` : "";
                  const copy = `<p style="font-family:'${bf}',sans-serif;font-size:11px;color:${tc};margin:16px 0 0;opacity:0.7;">© ${new Date().getFullYear()} ${he(brand.name || "Brand")}. All rights reserved.</p>`;
                  const fs = brand.footerStyle || "Editorial";
                  let footerHTML = "";
                  if (fs === "Editorial") {
                    footerHTML = `<div style="text-align:center;padding:48px 40px 32px;background:${pc};border-top:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}${tagline}<div style="margin:16px 0;">${navLinks}</div>${copy}</div>`;
                  } else if (fs === "Studio") {
                    footerHTML = `<div style="text-align:center;padding:48px 40px 32px;background:${pc};border-top:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}<div style="margin:16px 0;">${navLinks}</div>${copy}</div>`;
                  } else if (fs === "Agency") {
                    footerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;padding:48px 40px 32px;background:${pc};border-top:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};">${logoEl}${tagline}<div><p style="font-size:10px;color:${ac};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px;font-family:'${bf}',sans-serif;">Pages</p>${(brand.primaryMenu||"").split(",").map(l=>`<div style="font-size:12px;color:${tc};margin-bottom:6px;font-family:'${bf}',sans-serif;">${l.trim()}</div>`).join("")}</div><div><p style="font-size:10px;color:${ac};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px;font-family:'${bf}',sans-serif;">Contact</p>${email}</div></div>`;
                  } else if (fs === "Two Column") {
                    footerHTML = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;padding:48px 40px 32px;background:${pc};border-top:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};""><div>${logoEl}${tagline}${copy}</div><div style="text-align:right;">${(brand.primaryMenu||"").split(",").map(l=>`<div style="font-size:13px;color:${tc};margin-bottom:10px;font-family:'${bf}',sans-serif;">${l.trim()}</div>`).join("")}</div></div>`;
                  } else if (fs === "Dark Bar") {
                    const darkBg = isDark ? pc : "#0a0a0a";
                    const darkTc = "#888888";
                    const darkHc = "#ffffff";
                    const darkLogoEl = brand.logoUrl ? `<img src="${brand.logoUrl}" style="height:20px;width:auto;" />` : `<span style="font-family:'${hf}',sans-serif;font-size:16px;font-weight:700;color:${darkHc};">${brand.logoText || brand.name || "Brand"}</span>`;
                    footerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 40px;background:${darkBg};">${darkLogoEl}<p style="font-family:'${bf}',sans-serif;font-size:11px;color:${darkTc};margin:0;">© ${new Date().getFullYear()} ${brand.name||"Brand"}. All rights reserved.</p></div>`;
                  } else {
                    footerHTML = `<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px;padding:48px 40px 32px;background:${pc};border-top:1px solid ${brand.borderColor||"rgba(128,128,128,0.15)"};""><div>${logoEl}${tagline}${email}</div><div><p style="font-size:10px;color:${ac};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px;font-family:'${bf}',sans-serif;">Pages</p>${(brand.primaryMenu||"").split(",").map(l=>`<div style="font-size:12px;color:${tc};margin-bottom:6px;font-family:'${bf}',sans-serif;">${l.trim()}</div>`).join("")}</div><div><p style="font-size:10px;color:${ac};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px;font-family:'${bf}',sans-serif;">Legal</p>${(brand.utilityMenu||"Privacy, Terms").split(",").map(l=>`<div style="font-size:12px;color:${tc};margin-bottom:6px;font-family:'${bf}',sans-serif;">${l.trim()}</div>`).join("")}</div></div>`;
                  }
                  return (
                    <div style={{ marginTop: "12px", border: "1px solid #dde0e6", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ fontSize: "10px", color: "#6b7280", padding: "6px 12px", background: "#f5f5f7", borderBottom: "1px solid #dde0e6", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Footer Preview — {brand.footerStyle || "Editorial"}</div>
                      <div dangerouslySetInnerHTML={{ __html: footerHTML }} />
                    </div>
                  );
                })()}

              </Section>
              </div>
            </>
  );
}
