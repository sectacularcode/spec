import { Section } from "../Section.jsx";
import { I } from "../../styles.js";
import { SVG } from "../../utils/svg.js";
import { THEMES } from "../../constants/themes.js";

export default function SocialTab({ ctx }) {
  const { brand, updBrand, updSocial, delSocial } = ctx;
  return (
            <>
              <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", padding: "24px 24px 40px" }}>
              <Section id="social-links" title="Social Media Links" icon="">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "0px", alignItems: "start" }}>
                <div style={{ display: "grid", gap: "10px", paddingRight: "32px" }}>
                {brand.socialLinks.map((s, i) => (
                  <div key={i} className="responsive-4col" style={{ display: "grid", gridTemplateColumns: "140px 120px 1fr 30px", gap: "8px", alignItems: "end" }}>
                    <select style={{ width: "100%", padding: "11px 40px 11px 13px", background: "#ffffff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 14px center", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", color: "#09090b", outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none" }} value={s.key} onChange={e => updSocial(i, "key", e.target.value)}>
                      {Object.keys(SVG).map(k => <option key={k}>{k}</option>)}
                    </select>
                    <input style={I.inp} value={s.label || ""} onChange={e => updSocial(i, "label", e.target.value)} placeholder="@yourbrand" />
                    <input style={I.inp} value={s.url} onChange={e => updSocial(i, "url", e.target.value)} placeholder={
                      s.key === "instagram" ? "https://instagram.com/yourbrand" :
                      s.key === "tiktok" ? "https://tiktok.com/@yourbrand" :
                      s.key === "youtube" ? "https://youtube.com/@yourbrand" :
                      s.key === "linkedin" ? "https://linkedin.com/in/yourbrand" :
                      s.key === "facebook" ? "https://facebook.com/yourbrand" :
                      s.key === "pinterest" ? "https://pinterest.com/yourbrand" :
                      s.key === "threads" ? "https://threads.net/@yourbrand" :
                      "https://example.com/yourbrand"
                    } />
                    <button onClick={() => delSocial(i)} style={{ ...I.btnGhost, padding: "8px", color: "#b45309", borderColor: "#b45309" }}>×</button>
                  </div>
                ))}
                <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "#09090b" }}><input type="checkbox" checked={brand.showSocialInNav} onChange={e => updBrand("showSocialInNav", e.target.checked)} style={{ accentColor: "#6b635c" }} /> Show icons in top navigation</label>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "#09090b" }}><input type="checkbox" checked={brand.showSocialInPage} onChange={e => updBrand("showSocialInPage", e.target.checked)} style={{ accentColor: "#6b635c" }} /> Show as a section while scrolling (requires "Social" section enabled)</label>
                  <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", color: "#09090b" }}><input type="checkbox" checked={brand.showSocialInFooter} onChange={e => updBrand("showSocialInFooter", e.target.checked)} style={{ accentColor: "#6b635c" }} /> Show in footer</label>
                </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "24px", borderLeft: "1px solid #dde0e6", marginTop: "-4px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "10px" }}>Quick add</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {Object.keys(SVG).map(platform => {
                        const alreadyAdded = brand.socialLinks.some(s => s.key === platform);
                        return (
                          <button
                            key={platform}
                            onClick={() => { if (!alreadyAdded) updBrand("socialLinks", [...(brand.socialLinks || []), { key: platform, label: "", url: "" }]); }}
                            disabled={alreadyAdded}
                            style={{
                              padding: "6px 10px",
                              background: alreadyAdded ? "rgba(180, 83, 9, 0.1)" : "#ffffff",
                              color: alreadyAdded ? "#b45309" : "#09090b",
                              border: `1px solid ${alreadyAdded ? "rgba(180, 83, 9, 0.25)" : "#dde0e6"}`,
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: 500,
                              cursor: alreadyAdded ? "default" : "pointer",
                              opacity: alreadyAdded ? 0.6 : 1,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              textTransform: "capitalize",
                            }}>
                            <span dangerouslySetInnerHTML={{ __html: SVG[platform]("#09090b", 14) }} style={{ display: "inline-flex" }} />
                            {platform}
                            {alreadyAdded && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: "2px" }}>Preview</div>
                  {brand.socialLinks.length > 0 ? (() => {
                    const theme = THEMES.find(t => t.id === brand.themeId);
                    const isDark = (brand.themeMode || (theme && theme.mode)) === "dark";
                    const pc = brand.primaryColor || "#ffffff";
                    const hc = (theme && theme.headingColor) || (isDark ? "#ffffff" : "#0a0a0a");
                    const tc = brand.bodyTextColor || (isDark ? "#888" : "#666");
                    const iconHTML = brand.socialLinks.map(s => SVG[s.key] ? SVG[s.key](hc, 20) : "").filter(Boolean).join('<span style="display:inline-block;width:12px;"></span>');
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ padding: "20px 16px", background: pc, borderRadius: "8px", border: "1px solid #dde0e6", textAlign: "center" }}>
                          <div style={{ fontSize: "9px", color: tc, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", fontWeight: 600 }}>Brand</div>
                          <div dangerouslySetInnerHTML={{ __html: iconHTML }} />
                        </div>
                        <div style={{ padding: "20px 16px", background: "#ffffff", borderRadius: "8px", border: "1px solid #dde0e6", textAlign: "center" }}>
                          <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", fontWeight: 600 }}>White</div>
                          <div dangerouslySetInnerHTML={{ __html: brand.socialLinks.map(s => SVG[s.key] ? SVG[s.key]("#09090b", 20) : "").filter(Boolean).join('<span style="display:inline-block;width:12px;"></span>') }} />
                        </div>
                        <div style={{ padding: "20px 16px", background: "#0a0a0a", borderRadius: "8px", border: "1px solid #dde0e6", textAlign: "center" }}>
                          <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", fontWeight: 600 }}>Dark</div>
                          <div dangerouslySetInnerHTML={{ __html: brand.socialLinks.map(s => SVG[s.key] ? SVG[s.key]("#ffffff", 20) : "").filter(Boolean).join('<span style="display:inline-block;width:12px;"></span>') }} />
                        </div>
                      </div>
                    );
                  })() : (
                    <div style={{ textAlign: "center", padding: "40px 16px", color: "#a3a39e", fontSize: "12px", background: "#f5f5f7", borderRadius: "8px" }}>
                      Add a channel to preview
                    </div>
                  )}
                </div>
                </div>
              </Section>
              </div>
            </>
  );
}
