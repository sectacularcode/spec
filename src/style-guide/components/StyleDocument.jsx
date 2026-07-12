import { useRef } from "react";
import { downloadStyleGuideHtml, printStyleGuide, exportStyleGuideImage } from "../utils/export.js";

// The shareable one-pager: brand name, colors (8 template roles plus any
// custom "Additional colors"), and full typography specimens. Deliberately
// neutral chrome (gray labels, no Spec branding) since this represents
// someone else's brand, not Spec's -- only the brand's own extracted
// colors and fonts should read as "designed," not this document's frame.
//
// #style-doc-exportable is the hard boundary every export function reads
// from. The format-choice callout and the download buttons are rendered
// as siblings OUTSIDE that element on purpose -- HTML export copies
// exportRef.innerHTML verbatim, and PNG/JPEG capture targets exportRef
// directly, so neither one can ever include the buttons that triggered
// them, regardless of what gets added to this component later.
export default function StyleDocument({ brandName, sourceUrl, colors, fonts }) {
  const exportRef = useRef(null);

  const mainColors = colors.filter(c => !c.custom);
  const extraColors = colors.filter(c => c.custom);
  const compact = mainColors.length > 5;

  const headingFont = fonts.find(f => f.role === "Heading") || fonts[0];
  const bodyFont = fonts.find(f => f.role === "Body") || fonts[1];
  const otherFonts = fonts.filter(f => f !== headingFont && f !== bodyFont);

  const exportData = { brandName, sourceUrl, colors, fonts };

  return (
    <div>
      <div style={{ maxWidth: "820px", margin: "32px auto 64px", background: "#fff", border: "1px solid #DDE0E6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} className="style-doc-page">
        <div style={{ padding: "56px 64px" }}>
          <div id="style-doc-exportable" ref={exportRef} style={{ fontFamily: "'Inter', sans-serif" }}>
            <p style={sectionEyebrow}>Style guide</p>
            <h1 style={{ fontSize: "44px", margin: "0 0 8px", lineHeight: 1.05, fontFamily: headingFont?.name ? `'${headingFont.name}', serif` : undefined, color: mainColors.find(c => c.role === "Heading")?.hex || "#1a1a1a" }}>
              {brandName || "Untitled brand"}
            </h1>
            {sourceUrl && <p style={{ fontSize: "13px", color: "#8a8a8a", margin: "0 0 44px" }}>{safeHostname(sourceUrl)}</p>}

            <p style={sectionLabel(true)}>Colors</p>
            <div style={swatchGrid(compact)}>
              {mainColors.map(c => (
                <div key={c.role}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: "4px", marginBottom: compact ? "7px" : "10px", background: c.hex, border: c.hex.toLowerCase() === "#ffffff" ? "1px solid #ececec" : "none" }} />
                  <p style={{ fontFamily: "'Inter', monospace", fontSize: compact ? "11px" : "13px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{c.hex}</p>
                  <p style={{ fontSize: compact ? "10px" : "11px", color: "#8a8a8a", margin: "2px 0 0" }}>{c.role}</p>
                </div>
              ))}
            </div>

            {extraColors.length > 0 && (
              <>
                <p style={{ ...sectionLabel(false), fontSize: "10px", paddingTop: "20px", borderTop: "none" }}>Additional colors</p>
                <div style={swatchGrid(compact)}>
                  {extraColors.map((c, i) => (
                    <div key={i}>
                      <div style={{ width: "100%", aspectRatio: "1", borderRadius: "4px", marginBottom: compact ? "7px" : "10px", background: c.hex }} />
                      <p style={{ fontFamily: "'Inter', monospace", fontSize: compact ? "11px" : "13px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>{c.hex}</p>
                      <p style={{ fontSize: compact ? "10px" : "11px", color: "#8a8a8a", margin: "2px 0 0" }}>{c.name || "Untitled"}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p style={sectionLabel(false)}>Typography</p>

            {headingFont && (
              <div style={{ marginBottom: "36px" }}>
                <div style={fontMeta}><span style={fontRoleLabel}>Heading</span><span style={fontNameLabel}>{headingFont.name}</span></div>
                {[["H1", 40], ["H2", 30], ["H3", 23], ["H4", 18]].map(([label, px]) => (
                  <div key={label} style={typeRow}>
                    <div style={typeLabel}>{label}<small style={typeLabelSmall}>{px}px</small></div>
                    {label === "H1" ? <h1 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: mainColors.find(c => c.role === "Heading")?.hex || "#1a1a1a" }}>Built for the long haul</h1>
                    : label === "H2" ? <h2 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: mainColors.find(c => c.role === "Heading")?.hex || "#1a1a1a" }}>Every piece, field-tested</h2>
                    : label === "H3" ? <h3 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: mainColors.find(c => c.role === "Heading")?.hex || "#1a1a1a" }}>Made to be repaired, not replaced</h3>
                    : <h4 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: mainColors.find(c => c.role === "Heading")?.hex || "#1a1a1a" }}>Care and maintenance</h4>}
                  </div>
                ))}
              </div>
            )}

            {headingFont && bodyFont && <div style={{ borderTop: "1px solid #ececec", margin: "32px 0" }} />}

            {bodyFont && (
              <div style={{ marginBottom: "36px" }}>
                <div style={fontMeta}><span style={fontRoleLabel}>Body</span><span style={fontNameLabel}>{bodyFont.name}</span></div>
                <div style={typeRow}>
                  <div style={typeLabel}>Eyebrow</div>
                  <p style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8a8a", margin: 0, fontFamily: `'${bodyFont.name}', sans-serif`, fontWeight: 600 }}>Eyebrow / label</p>
                </div>
                <div style={typeRow}>
                  <div style={typeLabel}>Body<small style={typeLabelSmall}>15px</small></div>
                  <p style={{ fontSize: "15px", lineHeight: 1.65, color: "#3a3a3a", margin: 0, maxWidth: "520px", fontFamily: `'${bodyFont.name}', sans-serif` }}>
                    This is what body copy looks like in the extracted font, set at a normal reading size across a couple of full sentences.
                  </p>
                </div>
                <div style={typeRow}>
                  <div style={typeLabel}>Button</div>
                  <div style={{ display: "inline-block", padding: "11px 22px", borderRadius: "4px", background: mainColors.find(c => c.role === "Accent")?.hex || "#333" }}>
                    <span style={{ fontFamily: `'${bodyFont.name}', sans-serif`, fontWeight: 600, fontSize: "13px", color: "#fff", letterSpacing: "0.02em" }}>Call to action</span>
                  </div>
                </div>
              </div>
            )}

            {otherFonts.map(f => (
              <div key={f.role + f.name} style={{ marginBottom: "36px" }}>
                <div style={fontMeta}><span style={fontRoleLabel}>{f.role || "Other"}</span><span style={fontNameLabel}>{f.name}</span></div>
                <div style={{ fontSize: "20px", fontFamily: `'${f.name}', sans-serif` }}>The quick brown fox jumps over the lazy dog</div>
              </div>
            ))}

            <p style={{ marginTop: "48px", paddingTop: "20px", borderTop: "1px solid #ececec", fontSize: "11px", color: "#b0b0b0" }}>
              Style guide generated by Spec
            </p>
          </div>

          <div style={{ background: "#FEF3E2", borderRadius: "8px", padding: "14px 16px", marginTop: "28px", display: "flex", gap: "10px" }}>
            <span style={{ fontSize: "14px", flexShrink: 0 }}>ⓘ</span>
            <p style={{ fontSize: "12px", color: "#7a4a0a", margin: 0, lineHeight: 1.6 }}>
              <strong>Re-uploading this to Spec later?</strong> Download HTML — it's the only format that keeps the colors and fonts readable.{" "}
              <strong>Sending it to a client or team?</strong> Download PDF, JPEG, or PNG — built to be viewed, not reloaded.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button onClick={() => downloadStyleGuideHtml(exportRef.current, exportData)} style={primaryExportBtn}>Download HTML</button>
            <button onClick={printStyleGuide} style={exportBtn}>Download PDF</button>
            <button onClick={() => exportStyleGuideImage(exportRef.current, "jpeg", exportData)} style={exportBtn}>Download JPEG</button>
            <button onClick={() => exportStyleGuideImage(exportRef.current, "png", exportData)} style={exportBtn}>Download PNG</button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: letter; margin: 0.5in; }
          body > *:not(.style-doc-print-root) { display: none !important; }
          .style-doc-page { border: none !important; box-shadow: none !important; max-width: none !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function safeHostname(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

const sectionEyebrow = { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8a8a", margin: "0 0 10px" };
function sectionLabel(first) {
  return { fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#8a8a8a", margin: "0 0 18px", paddingTop: first ? 0 : "32px", borderTop: first ? "none" : "1px solid #ececec" };
}
function swatchGrid(compact) {
  return { display: "grid", gridTemplateColumns: compact ? "repeat(6, 1fr)" : "repeat(4, 1fr)", gap: compact ? "14px" : "20px", marginBottom: "8px" };
}
const fontMeta = { display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" };
const fontRoleLabel = { fontSize: "11px", fontWeight: 600, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.05em" };
const fontNameLabel = { fontSize: "14px", fontWeight: 600, color: "#1a1a1a" };
const typeRow = { display: "flex", alignItems: "baseline", gap: "20px", marginBottom: "14px" };
const typeLabel = { flexShrink: 0, width: "58px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8a8a8a" };
const typeLabelSmall = { display: "block", fontSize: "10px", fontWeight: 400, textTransform: "none", color: "#b0b0b0", marginTop: "2px" };

const exportBtn = { fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "12px", fontWeight: 600, padding: "9px 16px", borderRadius: "6px", cursor: "pointer", border: "1px solid #DDE0E6", background: "#fff", color: "#6B635C" };
const primaryExportBtn = { ...exportBtn, background: "#09090B", color: "#fff", borderColor: "#09090B" };
