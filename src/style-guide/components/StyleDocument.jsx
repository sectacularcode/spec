import { useRef } from "react";
import { downloadStyleGuideHtml, downloadStyleGuidePdf, exportStyleGuideImage } from "../utils/export.js";
import { pickReadableColor, bestTextColor, MIN_CONTRAST_LARGE_TEXT } from "../../utils/contrast.js";

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
export default function StyleDocument({ brandName, sourceUrl, colors, fonts, buttons = [] }) {
  const exportRef = useRef(null);

  const mainColors = colors.filter(c => !c.custom);
  const extraColors = colors.filter(c => c.custom);
  const compact = mainColors.length > 5;

  const headingFont = fonts.find(f => f.role === "Heading") || fonts[0];
  const bodyFont = fonts.find(f => f.role === "Body") || fonts[1];
  const otherFonts = fonts.filter(f => f !== headingFont && f !== bodyFont);
  // A site with only one detectable font (or a body-tag CSS selector that
  // never matched -- see fontsToKeyedObject's comment in index.jsx for
  // the same root cause) leaves bodyFont undefined. That shouldn't ALSO
  // erase the Eyebrow/Body specimens and the entire Button section, which
  // is what happened when they were both gated behind {bodyFont && ...}.
  const textFont = bodyFont || headingFont;
  const buttonFontFamily = textFont?.name ? `'${textFont.name}', sans-serif` : undefined;

  // The extracted "Heading" color has no memory of what background it sat
  // on at the source -- a light heading pulled from a dark hero section
  // renders as invisible text the moment it's placed on this document's
  // white page. Falling back through "Body text" (Spec's own role for
  // "copy on light") then "Dark panel"/"Secondary text" before a hardcoded
  // near-black means the sheet always uses something dark enough to read,
  // while still preferring an on-brand color over generic black wherever
  // one actually works.
  const rawHeadingHex = mainColors.find(c => c.role === "Heading")?.hex;
  const bodyTextHex = mainColors.find(c => c.role === "Body text")?.hex;
  const darkPanelHex = mainColors.find(c => c.role === "Dark panel")?.hex;
  const mutedHex = mainColors.find(c => c.role === "Secondary text")?.hex;
  const readableHeadingColor = pickReadableColor(
    "#FFFFFF",
    [rawHeadingHex, bodyTextHex, darkPanelHex, mutedHex],
    MIN_CONTRAST_LARGE_TEXT
  );

  // Same problem, different shape: the button always used white text on
  // top of whatever the extracted Accent color was. If Accent turns out
  // to be a pale mint or similar light color, white-on-white-ish is just
  // as unreadable as light-on-white was for headings above.
  const accentHex = mainColors.find(c => c.role === "Accent")?.hex || "#333";
  const buttonTextColor = bestTextColor(accentHex, bodyTextHex || "#1a1a1a");
  // A button fill color alone doesn't show how a button actually reads --
  // a light accent that's meant to pop against a dark hero section looks
  // like a washed-out nothing sitting directly on the document's own
  // white page. Showing it on both a light AND dark surface from the
  // brand's own palette (falling back to hardcoded white/near-black only
  // if those roles weren't captured) gives an honest picture either way,
  // instead of asserting which context is the "real" one.
  const lightPanelHex = mainColors.find(c => c.role === "Background")?.hex || "#FFFFFF";
  const darkPanelDemoHex = darkPanelHex || "#1a1a1a";

  const exportData = { brandName, sourceUrl, colors, fonts, buttons };

  return (
    <div>
      <div style={{ maxWidth: "820px", margin: "32px auto 64px", background: "#fff", border: "1px solid #DDE0E6", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ padding: "56px 64px" }}>
          <div id="style-doc-exportable" ref={exportRef} style={{ fontFamily: "'Inter', sans-serif" }}>
            <p style={sectionEyebrow}>Style guide</p>
            <h1 style={{ fontSize: "44px", margin: "0 0 8px", lineHeight: 1.05, fontFamily: headingFont?.name ? `'${headingFont.name}', serif` : undefined, color: readableHeadingColor }}>
              {brandName || "Untitled brand"}
            </h1>
            {sourceUrl && <p style={{ fontSize: "13px", color: "#8a8a8a", margin: "0 0 44px" }}>{safeHostname(sourceUrl)}</p>}

            <p style={sectionLabel(true)}>Colors</p>
            <div style={swatchGrid(compact)}>
              {mainColors.map(c => (
                <div key={c.role} style={{ width: swatchItemWidth(compact), flexShrink: 0 }}>
                  <div style={{ width: "100%", position: "relative", paddingTop: "100%", borderRadius: "4px", marginBottom: compact ? "7px" : "10px", background: c.hex, border: c.hex.toLowerCase() === "#ffffff" ? "1px solid #ececec" : "none" }} />
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
                    <div key={i} style={{ width: swatchItemWidth(compact), flexShrink: 0 }}>
                      <div style={{ width: "100%", position: "relative", paddingTop: "100%", borderRadius: "4px", marginBottom: compact ? "7px" : "10px", background: c.hex }} />
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
                    {label === "H1" ? <h1 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: readableHeadingColor }}>A headline in your heading font</h1>
                    : label === "H2" ? <h2 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: readableHeadingColor }}>A subheading right below it</h2>
                    : label === "H3" ? <h3 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: readableHeadingColor }}>A smaller section heading</h3>
                    : <h4 style={{ margin: 0, fontFamily: `'${headingFont.name}', serif`, fontWeight: 500, fontSize: px, color: readableHeadingColor }}>The smallest heading size</h4>}
                  </div>
                ))}
              </div>
            )}

            {headingFont && textFont && <div style={{ borderTop: "1px solid #ececec", margin: "32px 0" }} />}

            {textFont && (
              <div style={{ marginBottom: "36px" }}>
                {bodyFont && (
                  <div style={fontMeta}><span style={fontRoleLabel}>Body</span><span style={fontNameLabel}>{bodyFont.name}</span></div>
                )}
                <div style={typeRow}>
                  <div style={typeLabel}>Eyebrow</div>
                  <p style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8a8a", margin: 0, fontFamily: `'${textFont.name}', sans-serif`, fontWeight: 600 }}>Eyebrow / label</p>
                </div>
                <div style={typeRow}>
                  <div style={typeLabel}>Body<small style={typeLabelSmall}>15px</small></div>
                  <p style={{ fontSize: "15px", lineHeight: 1.65, color: "#3a3a3a", margin: 0, maxWidth: "520px", fontFamily: `'${textFont.name}', sans-serif` }}>
                    This is what body copy looks like in the extracted font, set at a normal reading size across a couple of full sentences.
                  </p>
                </div>
              </div>
            )}

            {/* Button demo -- deliberately its own block now, not nested
                inside the Body font section above. The button preview is
                the whole point of this feature; it shouldn't disappear
                just because extraction didn't find a distinct body font. */}
            <div style={{ marginBottom: "36px" }}>
              <div style={typeRow}>
                <div style={typeLabel}>Button{buttons.length !== 1 ? "s" : ""}</div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {buttons.length > 0 ? (
                    buttons.map((b, i) => (
                      <div key={i} style={buttonDemoPanel(lightPanelHex)}>
                        {b.name && <p style={buttonDemoLabel(false)}>{b.name}</p>}
                        <div style={{ display: "inline-block", padding: "11px 22px", borderRadius: "6px", background: b.background || "#333" }}>
                          <span style={{ fontFamily: buttonFontFamily, fontWeight: 600, fontSize: "13px", color: b.textColor || "#fff", letterSpacing: "0.02em" }}>Call to action</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    // No explicit buttons defined (older saved style, or
                    // just not built yet) -- fall back to the auto
                    // Accent-fill button shown on both a light and dark
                    // surface, same as before this feature existed.
                    <>
                      <div style={buttonDemoPanel(lightPanelHex)}>
                        <p style={buttonDemoLabel(false)}>On light</p>
                        <div style={{ display: "inline-block", padding: "11px 22px", borderRadius: "6px", background: accentHex }}>
                          <span style={{ fontFamily: buttonFontFamily, fontWeight: 600, fontSize: "13px", color: buttonTextColor, letterSpacing: "0.02em" }}>Call to action</span>
                        </div>
                      </div>
                      <div style={buttonDemoPanel(darkPanelDemoHex)}>
                        <p style={buttonDemoLabel(true)}>On dark</p>
                        <div style={{ display: "inline-block", padding: "11px 22px", borderRadius: "6px", background: accentHex }}>
                          <span style={{ fontFamily: buttonFontFamily, fontWeight: 600, fontSize: "13px", color: buttonTextColor, letterSpacing: "0.02em" }}>Call to action</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

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
            <button onClick={() => downloadStyleGuidePdf(exportRef.current, exportData)} style={exportBtn}>Download PDF</button>
            <button onClick={() => exportStyleGuideImage(exportRef.current, "jpeg", exportData)} style={exportBtn}>Download JPEG</button>
            <button onClick={() => exportStyleGuideImage(exportRef.current, "png", exportData)} style={exportBtn}>Download PNG</button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          /* Download PDF no longer calls window.print() (see export.js) --
             this block is kept only so a manual Cmd/Ctrl+P still isolates
             the document correctly instead of printing the whole app UI. */
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: letter; margin: 0.5in; }
          /* The real app nests this component many layers deep (App shell
             -> tab router -> Suspense -> this tree), unlike the flat
             single-page mockup this was first designed against -- a rule
             like "hide every direct child of body except X" only ever
             matches body's IMMEDIATE children, which in this app is just
             the React root div, not anything of ours. That silently hid
             the entire app, including the content it was supposed to
             print, which is why the print preview came back blank.
             visibility (not display) is the fix: hiding everything and
             then re-showing #style-doc-exportable and its descendants
             works regardless of how deeply nested it is, because a
             visible child can override a hidden ancestor's visibility --
             display:none can't be overridden that way. */
          body * { visibility: hidden; }
          #style-doc-exportable, #style-doc-exportable * { visibility: visible; }
          #style-doc-exportable { position: absolute; left: 0; top: 0; width: 100%; }
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
// Flexbox + explicit item widths instead of CSS Grid, and paddingTop
// percent squares instead of aspect-ratio (used at the call sites above) --
// both aspect-ratio and CSS Grid are known-inconsistent in html2canvas's
// rendering engine (confirmed against html2canvas 1.4.1, the version this
// app uses), which is why the live page always looked right while the
// exported PNG/JPEG/PDF came out with the swatch section collapsed or
// misplaced and everything after it shifted/cut off as a result.
function swatchGrid(compact) {
  return { display: "flex", flexWrap: "wrap", gap: compact ? "14px" : "20px", marginBottom: "8px" };
}
function swatchItemWidth(compact) {
  const cols = compact ? 6 : 4;
  const gapPx = compact ? 14 : 20;
  return `calc((100% - ${gapPx * (cols - 1)}px) / ${cols})`;
}
const fontMeta = { display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" };
const fontRoleLabel = { fontSize: "11px", fontWeight: 600, color: "#8a8a8a", textTransform: "uppercase", letterSpacing: "0.05em" };
const fontNameLabel = { fontSize: "14px", fontWeight: 600, color: "#1a1a1a" };
const typeRow = { display: "flex", alignItems: "baseline", gap: "20px", marginBottom: "14px" };
const typeLabel = { flexShrink: 0, width: "58px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "#8a8a8a" };
const typeLabelSmall = { display: "block", fontSize: "10px", fontWeight: 400, textTransform: "none", color: "#b0b0b0", marginTop: "2px" };
function buttonDemoPanel(bg) {
  return {
    background: bg, borderRadius: "8px", padding: "14px 18px",
    display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: "10px",
    border: bg.toLowerCase() === "#ffffff" ? "1px solid #ececec" : "none",
  };
}
function buttonDemoLabel(onDark) {
  return { fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: onDark ? "#b0b0b0" : "#8a8a8a", margin: 0 };
}

const exportBtn = { fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "12px", fontWeight: 600, padding: "9px 16px", borderRadius: "6px", cursor: "pointer", border: "1px solid #DDE0E6", background: "#fff", color: "#6B635C" };
const primaryExportBtn = { ...exportBtn, background: "#09090B", color: "#fff", borderColor: "#09090B" };
