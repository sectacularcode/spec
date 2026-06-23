import { Section } from "../Section.jsx";
import { Icon } from "../Icon.jsx";
import { I } from "../../styles.js";
import { FONT_OPTIONS, TONES, PREMIUM_ACCENTS } from "../../constants/ui.jsx";
import { THEMES } from "../../constants/themes.js";
import { LAYOUTS } from "../../constants/layouts.js";
import { WEBSITE_TEMPLATES, applyWebsiteTemplate, applyTheme } from "../../constants/templates.js";
import { contrastRatio, isLight } from "../../utils/colors.js";

export default function BrandTab({ ctx }) {
  const { brand, page, project, pageIdx, updBrand, showAdvancedColors, setShowAdvancedColors, showAllThemes, setShowAllThemes, setProjects, activeId } = ctx;
  return (
            <>
              <div style={{ padding: "24px 24px 40px", maxWidth: "1400px", margin: "0 auto" }}>
              <Section id="brand-templates" title="Industry Template" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>
                  {brand.templateId
                    ? <>Your project is using a template already (likely from your AI recommendation). You can switch to a different one below — one click applies the new layout, theme, accent, fonts, and default copy.</>
                    : <>No template applied yet. Pick one below — one click applies the layout, theme, accent, fonts, section composition, and default copy. Or go back to the Projects page and describe your site to get an AI recommendation.</>}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginTop: "12px" }}>
                  {WEBSITE_TEMPLATES.map(t => {
                    // Active = this template's id matches the one stored on the brand when applied.
                    // Survives accent swaps, theme changes, font tweaks — until you apply a different template.
                    const isActive = brand.templateId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          // Apply directly — confirm() is blocked in sandboxed iframes (Claude artifacts).
                          // The "✓ APPLIED" badge gives instant feedback. To undo, just pick a different template.
                          setProjects(ps => ps.map(p => {
                            if (p.id !== activeId) return p;
                            const currentPage = p.pages[pageIdx];
                            if (!currentPage) return p;
                            const { brand: nb, page: np } = applyWebsiteTemplate(t, p.brand, currentPage, THEMES);
                            return { ...p, brand: nb, pages: p.pages.map((pg, i) => i === pageIdx ? { ...pg, ...np } : pg) };
                          }));
                        }}
                        style={{
                          padding: "16px",
                          background: "#ffffff",
                          border: isActive ? "2px solid #000000" : "1px solid #dde0e6",
                          borderRadius: "10px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all .15s",
                          position: "relative",
                        }}
                        onMouseOver={e => { if (!isActive) { e.currentTarget.style.borderColor = "#a3a39e"; } }}
                        onMouseOut={e => { if (!isActive) { e.currentTarget.style.borderColor = "#dde0e6"; } }}
                      >
                        {isActive && (
                          <div style={{ position: "absolute", top: "12px", right: "12px", background: "#b45309", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Icon name="check" size={11} color="#ffffff" /> Applied
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "200px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#000000", marginBottom: "10px", letterSpacing: "-0.02em", lineHeight: 1.3, paddingRight: isActive ? "70px" : 0 }}>{t.name}</div>
                          <div style={{ height: "1px", background: "#dde0e6", marginBottom: "12px" }} />
                          <div style={{ fontSize: "13px", color: "#09090b", lineHeight: 1.55, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{t.desc}</div>
                          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "auto" }}>
                            {t.homepageSections.slice(0, 5).map(s => (
                              <span key={s} style={{ fontSize: "9px", padding: "3px 8px", background: "rgba(180, 83, 9, 0.1)", color: "#b45309", borderRadius: "10px", whiteSpace: "nowrap", fontWeight: 500, letterSpacing: "0.02em" }}>{s}</span>
                            ))}
                            {t.homepageSections.length > 5 && <span style={{ fontSize: "9px", color: "#09090b", padding: "3px 4px", alignSelf: "center" }}>+{t.homepageSections.length - 5}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section id="brand-layout" title="Layout Style" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>
                  {brand.templateId
                    ? <>Your template applied a default layout, but you can swap to a different typographic personality without losing the template's sections, colors, or copy. Use this if you want, say, Agency sections with Magazine-style centered serif typography.</>
                    : <>Optional. Layout controls the typographic personality — hero composition, services rendering, heading sizes, alignments. Independent of color. If you pick a Website Template above, it sets a layout for you; you can override here.</>
                  }
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "10px", marginTop: "12px" }}>
                  {(() => {
                    // "Template Default" card — shows when a template is active.
                    // Resets the layout/fonts back to whatever the active template set.
                    if (!brand.templateId) return null;
                    const activeTemplate = WEBSITE_TEMPLATES.find(t => t.id === brand.templateId);
                    if (!activeTemplate) return null;
                    const defaultLayout = LAYOUTS.find(l => l.id === activeTemplate.layoutId);
                    const isOnDefault = brand.layoutId === activeTemplate.layoutId &&
                                        brand.headingFont === activeTemplate.headingFont &&
                                        brand.bodyFont === activeTemplate.bodyFont;
                    return (
                      <button onClick={() => {
                        setProjects(ps => ps.map(p => p.id === activeId ? {
                          ...p, brand: {
                            ...p.brand,
                            layoutId: activeTemplate.layoutId,
                            headingFont: activeTemplate.headingFont,
                            bodyFont: activeTemplate.bodyFont,
                          }
                        } : p));
                      }} style={{ padding: "18px 20px", background: "#ffffff", border: isOnDefault ? "2px solid #000000" : "1.5px dashed #dde0e6", borderRadius: "10px", cursor: "pointer", textAlign: "left", position: "relative", display: "flex", flexDirection: "column", minHeight: "180px" }}>
                        {isOnDefault && (
                          <div style={{ position: "absolute", top: "12px", right: "12px", background: "#b45309", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
                            <Icon name="check" size={11} color="#ffffff" /> Current
                          </div>
                        )}
                        {/* Aa preview in template's default heading font */}
                        <div style={{
                          fontFamily: `'${activeTemplate.headingFont || "Inter"}', Georgia, serif`,
                          fontSize: "32px",
                          lineHeight: 1,
                          color: "#a3a39e",
                          marginBottom: "14px",
                          fontWeight: activeTemplate.headingFont === "Cormorant Garamond" ? 400 : 500,
                          fontStyle: activeTemplate.headingFont === "Cormorant Garamond" ? "italic" : "normal",
                          letterSpacing: "-0.01em",
                        }}>Aa</div>
                        <div style={{ height: "1px", background: "#dde0e6", marginBottom: "12px" }} />
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", marginBottom: "4px", letterSpacing: "-0.02em", paddingRight: isOnDefault ? "70px" : 0 }}>None — Template Default</div>
                        <div style={{ fontSize: "12px", color: "#09090b", lineHeight: 1.55, marginBottom: "12px" }}>Keep {activeTemplate.name}'s built-in layout ({defaultLayout?.name || "default"}).</div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "auto", fontSize: "10px", color: "#09090b", flexWrap: "wrap" }}>
                          <span>From template</span>
                          <span>·</span>
                          <span>{activeTemplate.headingFont}</span>
                        </div>
                      </button>
                    );
                  })()}
                  {(() => {
                    const _activeTpl = brand.templateId ? WEBSITE_TEMPLATES.find(t => t.id === brand.templateId) : null;
                    const _isOnTplDefault = _activeTpl &&
                      brand.layoutId === _activeTpl.layoutId &&
                      brand.headingFont === _activeTpl.headingFont &&
                      brand.bodyFont === _activeTpl.bodyFont;
                    return LAYOUTS.map(l => {
                    const active = brand.layoutId === l.id && !_isOnTplDefault;
                    return (
                      <button key={l.id} onClick={() => {
                        setProjects(ps => ps.map(p => p.id === activeId ? {
                          ...p, brand: {
                            ...p.brand,
                            layoutId: l.id,
                            ...(l.headingFont ? { headingFont: l.headingFont } : {}),
                            ...(l.bodyFont ? { bodyFont: l.bodyFont } : {}),
                          }
                        } : p));
                      }} style={{ padding: "18px 20px", background: "#ffffff", border: active ? "2px solid #000000" : "1px solid #dde0e6", borderRadius: "10px", cursor: "pointer", textAlign: "left", position: "relative", transition: "border-color .15s", display: "flex", flexDirection: "column", minHeight: "180px" }}
                          onMouseOver={e => { if (!active) e.currentTarget.style.borderColor = "#a3a39e"; }}
                          onMouseOut={e => { if (!active) e.currentTarget.style.borderColor = "#dde0e6"; }}>
                        {active && (
                          <div style={{ position: "absolute", top: "12px", right: "12px", background: "#b45309", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
                            <Icon name="check" size={11} color="#ffffff" /> Active
                          </div>
                        )}
                        {/* Font preview Aa — rendered in the actual layout heading font */}
                        <div style={{
                          fontFamily: `'${l.headingFont || "Inter"}', Georgia, serif`,
                          fontSize: "32px",
                          lineHeight: 1,
                          color: "#09090b",
                          marginBottom: "14px",
                          fontWeight: l.headingFont === "Cormorant Garamond" ? 400 : (l.headingFont === "Oswald" || l.headingFont === "Yeseva One" ? 400 : 500),
                          fontStyle: l.headingFont === "Cormorant Garamond" ? "italic" : "normal",
                          letterSpacing: "-0.01em",
                        }}>Aa</div>
                        <div style={{ height: "1px", background: "#dde0e6", marginBottom: "12px" }} />
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", marginBottom: "4px", letterSpacing: "-0.02em", paddingRight: active ? "70px" : 0 }}>{l.name}</div>
                        <div style={{ fontSize: "12px", color: "#09090b", lineHeight: 1.55, marginBottom: "12px" }}>{l.desc}</div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "auto", fontSize: "10px", color: "#09090b", flexWrap: "wrap", alignItems: "center" }}>
                          <span>{l.headingFont || "Default"}</span>
                          <span>·</span>
                          <span>{l.cardRadius > 0 ? "Soft edges" : "Sharp edges"}</span>
                        </div>
                      </button>
                    );
                  });
                  })()}
                </div>
              </Section>





              <div style={{ border: "1px solid #dde0e6", borderRadius: "10px", marginBottom: "16px", overflow: "hidden" }}>
              <button onClick={() => setShowAdvancedColors(v => !v)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#ffffff", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#09090b" }}>
                <span>Advanced — Custom Brand Colors</span>
                <span style={{ fontSize: "12px", color: "#09090b" }}>{showAdvancedColors ? "▲ Hide" : "▼ Show"}</span>
              </button>
              {showAdvancedColors && <div style={{ padding: "16px" }}>
              <Section id="brand-colors" title="Quick Accent Swap" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>
                  Drop in your actual brand hex codes. Once you have at least 2 colors (Background + Accent), an <strong style={{ color: "#09090b" }}>"Apply Custom Brand Palette"</strong> button appears that swaps the live theme to use them.
                </p>
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { key: "background", label: "Background", placeholder: "#0a0a0a", note: "Main page background" },
                    { key: "accent", label: "Accent", placeholder: "#c8791a", note: "Buttons, links, highlights" },
                    { key: "text", label: "Text (optional)", placeholder: "#09090b", note: "Body/heading text on background" },
                    { key: "card", label: "Card / Panel (optional)", placeholder: "#111111", note: "Card backgrounds, panels" },
                  ].map(({ key, label, placeholder, note }) => {
                    const bc = brand.brandColors || {};
                    const val = bc[key] || "";
                    return (
                      <div key={key}>
                        <label style={I.lbl}>{label}</label>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input
                            type="color"
                            value={val || "#000000"}
                            onChange={e => updBrand("brandColors", { ...bc, [key]: e.target.value })}
                            style={{ width: "36px", height: "36px", padding: "2px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#ffffff", cursor: "pointer" }}
                          />
                          <input
                            style={{ ...I.inp, fontFamily: "monospace", textTransform: "lowercase" }}
                            value={val}
                            onChange={e => updBrand("brandColors", { ...bc, [key]: e.target.value })}
                            placeholder={placeholder}
                          />
                        </div>
                        <div style={{ fontSize: "10px", color: "#09090b", marginTop: "4px" }}>{note}</div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const bc = brand.brandColors || {};
                  const filled = ["background", "accent", "text", "card"].filter(k => bc[k] && /^#[0-9a-f]{6}$/i.test(bc[k]));
                  const canApply = filled.includes("background") && filled.includes("accent");
                  if (!canApply) return (
                    <div style={{ fontSize: "12px", color: "#09090b", padding: "10px 12px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px", lineHeight: 1.5 }}>
                      Add valid hex codes for at least Background and Accent to enable the custom palette.
                    </div>
                  );
                  // Preview swatch
                  const isDark = (() => {
                    const hex = bc.background.replace("#", "");
                    const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
                    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
                  })();
                  const txt = bc.text || (isDark ? "#09090b" : "#0a0a0a");
                  const cardBg = bc.card || (isDark ? "#181818" : "#f5f5f5");
                  return (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "center", marginTop: "4px" }}>
                        <div style={{ background: bc.background, padding: "16px", borderRadius: "8px", border: "1px solid #dde0e6" }}>
                          <div style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: txt, marginBottom: "4px" }}>Aa Preview</div>
                          <div style={{ fontSize: "12px", color: txt, opacity: 0.7, marginBottom: "10px" }}>Body text on background</div>
                          <span style={{ display: "inline-block", background: bc.accent, color: isDark ? "#0a0a0a" : "#09090b", padding: "5px 12px", borderRadius: "4px", fontSize: "10px", fontWeight: 600 }}>Accent Button</span>
                          <div style={{ background: cardBg, marginTop: "10px", padding: "8px 10px", borderRadius: "4px", fontSize: "10px", color: txt, opacity: 0.85 }}>Card / panel example</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const theme = {
                            id: "custom-brand",
                            primaryColor: bc.background,
                            cardBgColor: cardBg,
                            bodyTextColor: txt,
                            borderColor: isDark ? "#2a2a2a" : "#e5e5e5",
                            headingColor: txt,
                            mode: isDark ? "dark" : "light",
                          };
                          setProjects(ps => ps.map(p => p.id === activeId ? {
                            ...p, brand: {
                              ...p.brand,
                              themeId: "custom-brand",
                              themeMode: theme.mode,
                              primaryColor: theme.primaryColor,
                              cardBgColor: theme.cardBgColor,
                              bodyTextColor: theme.bodyTextColor,
                              borderColor: theme.borderColor,
                              accentColor: bc.accent,
                            }
                          } : p));
                        }}
                        style={{ padding: "12px 18px", background: "#09090b", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                        ✓ Apply Custom Brand Palette
                      </button>
                    </>
                  );
                })()}
              </Section>
              </div>}
            </div>

              <Section id="brand-theme" title="Background Theme" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>Pick a palette. All themes are tested for WCAG AA contrast — text stays readable, accents pop, and the elements complement the background automatically.</p>
                {(() => {
                  // Show a "Template default" indicator if the current theme matches the active template's theme
                  const activeTpl = brand.templateId ? WEBSITE_TEMPLATES.find(t => t.id === brand.templateId) : null;
                  if (!activeTpl || activeTpl.themeId !== brand.themeId) return null;
                  const tplTheme = THEMES.find(t => t.id === activeTpl.themeId);
                  return (
                    <div style={{ padding: "10px 14px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", color: "#09090b", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "#b45309", color: "#ffffff", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em" }}>TEMPLATE DEFAULT</span>
                      <span>Using <strong style={{ color: "#000000" }}>{tplTheme?.name}</strong> from the {activeTpl.name} template. Pick a different theme below to override.</span>
                    </div>
                  );
                })()}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
                  {(showAllThemes ? THEMES : THEMES.slice(0, 10)).map(t => {
                    const active = brand.themeId === t.id;
                    return (
                      <button key={t.id} onClick={() => setProjects(ps => ps.map(p => p.id === activeId ? { ...p, brand: applyTheme(t, p.brand) } : p))} style={{ padding: 0, background: "#ffffff", border: active ? "2px solid #000000" : "1px solid #dde0e6", borderRadius: "10px", cursor: "pointer", overflow: "hidden", textAlign: "left", transition: "border-color .15s", display: "flex", flexDirection: "column", minHeight: "200px", position: "relative" }}
                          onMouseOver={e => { if (!active) e.currentTarget.style.borderColor = "#a3a39e"; }}
                          onMouseOut={e => { if (!active) e.currentTarget.style.borderColor = "#dde0e6"; }}>
                        {active && (
                          <div style={{ position: "absolute", top: "10px", right: "10px", background: "#b45309", color: "#ffffff", fontSize: "10px", fontWeight: 500, padding: "4px 10px", borderRadius: "10px", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: "4px", zIndex: 1 }}>
                            <Icon name="check" size={11} color="#ffffff" /> Active
                          </div>
                        )}
                        {/* Full-bleed palette preview */}
                        <div style={{ background: t.primaryColor, padding: "18px 16px", minHeight: "100px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontFamily: "Georgia,serif", fontSize: "20px", color: t.headingColor, lineHeight: 1, fontWeight: 400, marginBottom: "4px" }}>Aa</div>
                            <div style={{ fontSize: "10px", color: t.bodyTextColor }}>Body text</div>
                          </div>
                          <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
                            <div style={{ width: "16px", height: "16px", background: t.accentColor, borderRadius: "50%" }} />
                            <div style={{ width: "16px", height: "16px", background: t.cardBgColor, border: `1px solid ${t.borderColor}`, borderRadius: "50%" }} />
                          </div>
                        </div>
                        {/* Meta block — title + divider + description */}
                        <div style={{ padding: "14px 16px", background: "#ffffff", display: "flex", flexDirection: "column", flex: 1 }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", letterSpacing: "-0.02em", marginBottom: "8px", paddingRight: active ? "70px" : 0 }}>{t.name}</div>
                          <div style={{ height: "1px", background: "#dde0e6", marginBottom: "10px" }} />
                          <div style={{ fontSize: "12px", color: "#09090b", lineHeight: 1.55 }}>{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {THEMES.length > 10 && (
                  <button onClick={() => setShowAllThemes(v => !v)} style={{ marginTop: "10px", padding: "8px 16px", background: "transparent", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 500, color: "#09090b", cursor: "pointer" }}>
                    {showAllThemes ? "▲ Show less" : `▼ Show ${THEMES.length - 10} more themes`}
                  </button>
                )}
                <div style={{ marginTop: "16px", padding: "20px 22px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "10px", overflow: "visible" }}>
                  <div style={{ fontSize: "12px", color: "#000000", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700, marginBottom: "6px" }}>Quick Accent Swap</div>
                  <p style={{ fontSize: "13px", color: "#09090b", margin: "0 0 16px", lineHeight: 1.55 }}>Override just the accent. Works with any theme.</p>
                  <div style={{ display: "flex", flexWrap: "nowrap", overflowX: "auto", gap: "10px", paddingBottom: "4px" }}>
                    {PREMIUM_ACCENTS.map(a => {
                      const active = brand.accentColor.toLowerCase() === a.value.toLowerCase();
                      const isLight = ["#ffffff", "#fafafa", "#f5f5f5"].includes(a.value.toLowerCase());
                      return (
                        <div key={a.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", minWidth: "46px", flexShrink: 0 }}>
                          <button
                            onClick={() => updBrand("accentColor", a.value)}
                            title={a.name}
                            style={{
                              width: "36px",
                              height: "36px",
                              background: a.value,
                              borderRadius: "50%",
                              border: active ? "2px solid #000000" : (isLight ? "1px solid #dde0e6" : "2px solid transparent"),
                              boxShadow: active ? "inset 0 0 0 2px #ffffff" : "none",
                              cursor: "pointer",
                              padding: 0,
                              transition: "transform 0.12s",
                            }}
                            onMouseOver={e => { if (!active) e.currentTarget.style.transform = "scale(1.08)"; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "scale(1)"; }}
                          />
                          <span style={{ fontSize: "9px", color: active ? "#000000" : "#09090b", fontWeight: active ? 600 : 400, letterSpacing: "0.02em", textAlign: "center", lineHeight: 1.2 }}>{a.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <details style={{ marginTop: "8px" }}>
                  <summary style={{ fontSize: "12px", color: "#09090b", cursor: "pointer", padding: "8px 0" }}>Advanced — override individual colors</summary>
                  <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                    <div><label style={I.lbl}>Primary BG</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.primaryColor} onChange={e => updBrand("primaryColor", e.target.value)} /></div>
                    <div><label style={I.lbl}>Accent</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.accentColor} onChange={e => updBrand("accentColor", e.target.value)} /></div>
                    <div><label style={I.lbl}>Card BG</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.cardBgColor} onChange={e => updBrand("cardBgColor", e.target.value)} /></div>
                    <div><label style={I.lbl}>Body Text</label><input type="color" style={{ ...I.inp, padding: "4px", height: "40px" }} value={brand.bodyTextColor} onChange={e => updBrand("bodyTextColor", e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop: "8px" }}><label style={I.lbl}>Border Color (hex)</label><input style={I.inp} value={brand.borderColor} onChange={e => updBrand("borderColor", e.target.value)} /></div>
                  <p style={{ fontSize: "12px", color: "#b45309", margin: "8px 0 0" }}>Overriding may break contrast. Stick to themes for guaranteed accessibility.</p>
                </details>
              </Section>

              <Section id="brand-contrast" title="Contrast Check" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>WCAG AA requires 4.5:1 for normal text and 3:1 for large text. These are your current ratios.</p>
                {(() => {
                  const pc = brand.primaryColor || "#ffffff";
                  const ac = brand.accentColor || "#000000";
                  const tc = brand.bodyTextColor || "#333333";
                  const hc = (() => { const theme = THEMES.find(t => t.id === brand.themeId); return (theme && theme.headingColor) || (isLight(pc) ? "#0a0a0a" : "#ffffff"); })();
                  const checks = [
                    { label: "Body text on background", fg: tc, bg: pc },
                    { label: "Heading on background", fg: hc, bg: pc },
                    { label: "Accent on background", fg: ac, bg: pc },
                    { label: "Button text on accent", fg: isLight(ac) ? "#0a0a0a" : "#ffffff", bg: ac },
                  ];
                  return (
                    <div style={{ display: "grid", gap: "8px" }}>
                      {checks.map(({ label, fg, bg }) => {
                        const ratio = contrastRatio(fg, bg);
                        const passAA = ratio >= 4.5;
                        const passLarge = ratio >= 3;
                        return (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: bg, border: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: fg, flexShrink: 0 }}>Aa</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "13px", color: "#09090b", fontWeight: 500 }}>{label}</div>
                              <div style={{ fontSize: "11px", color: "#6b7280" }}>{fg} on {bg}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: passAA ? "#16a34a" : passLarge ? "#b45309" : "#dc2626" }}>{ratio.toFixed(1)}:1</div>
                              <div style={{ fontSize: "10px", color: passAA ? "#16a34a" : passLarge ? "#b45309" : "#dc2626", fontWeight: 600 }}>{passAA ? "AA Pass" : passLarge ? "Large only" : "Fail"}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Section>
              <Section id="brand-typography" title="Typography" icon="">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={I.lbl}>Heading Font</label><select style={I.sel} value={brand.headingFont} onChange={e => updBrand("headingFont", e.target.value)}>{FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}</select></div>
                  <div><label style={I.lbl}>Body Font</label><select style={I.sel} value={brand.bodyFont} onChange={e => updBrand("bodyFont", e.target.value)}>{FONT_OPTIONS.map(f => <option key={f}>{f}</option>)}</select></div>
                </div>
                <p style={{ fontSize: "12px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>Pair a distinctive display font (heading) with a clean sans-serif (body). All fonts are Google Fonts and load automatically.</p>
              </Section>

              <Section id="brand-details" title="Design Details" icon="">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={I.lbl}>Button Corners</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[{ id: "sharp", label: "Sharp", radius: "0" }, { id: "subtle", label: "Subtle", radius: "4px" }, { id: "pill", label: "Pill", radius: "999px" }].map(opt => (
                        <button key={opt.id} onClick={() => updBrand("buttonRadius", opt.id)} style={{ flex: 1, padding: "10px 6px", background: (brand.buttonRadius || "subtle") === opt.id ? "#b45309" : "#ffffff", color: (brand.buttonRadius || "subtle") === opt.id ? "#ffffff" : "#09090b", border: (brand.buttonRadius || "subtle") === opt.id ? "none" : "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "center" }}>
                          <div style={{ width: "100%", height: "24px", background: (brand.buttonRadius || "subtle") === opt.id ? "rgba(255,255,255,0.3)" : "#dde0e6", borderRadius: opt.radius, marginBottom: "6px" }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={I.lbl}>Spacing</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[{ id: "tight", label: "Tight" }, { id: "balanced", label: "Balanced" }, { id: "generous", label: "Generous" }].map(opt => (
                        <button key={opt.id} onClick={() => updBrand("spacingDensity", opt.id)} style={{ flex: 1, padding: "10px 6px", background: (brand.spacingDensity || "balanced") === opt.id ? "#b45309" : "#ffffff", color: (brand.spacingDensity || "balanced") === opt.id ? "#ffffff" : "#09090b", border: (brand.spacingDensity || "balanced") === opt.id ? "none" : "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "center" }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={I.lbl}>Image Corners</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[{ id: "sharp", label: "Sharp", radius: "0" }, { id: "subtle", label: "Subtle", radius: "8px" }, { id: "round", label: "Round", radius: "16px" }].map(opt => (
                        <button key={opt.id} onClick={() => updBrand("imageRadius", opt.id)} style={{ flex: 1, padding: "10px 6px", background: (brand.imageRadius || "subtle") === opt.id ? "#b45309" : "#ffffff", color: (brand.imageRadius || "subtle") === opt.id ? "#ffffff" : "#09090b", border: (brand.imageRadius || "subtle") === opt.id ? "none" : "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "center" }}>
                          <div style={{ width: "100%", height: "24px", background: (brand.imageRadius || "subtle") === opt.id ? "rgba(255,255,255,0.3)" : "#dde0e6", borderRadius: opt.radius, marginBottom: "6px" }} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              </div>

            </>
  );
}

