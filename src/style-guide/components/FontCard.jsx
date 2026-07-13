// One font card. Two modes, same pattern as ColorSwatch: a template role
// (Heading/Body, Confirmed/Estimated badge) or a custom entry (free-text
// name only -- a font doesn't have a "usage" note the way a color does).

// Matches ColorSwatch's confidence-tier colors exactly, not just its
// language -- these two components describe the same underlying
// extraction mechanisms and need to look the same everywhere they show
// up, not just use similar-sounding labels. Found and fixed a real
// mismatch here: this "computed" tier was using #E3F2FA/#1D6FA5, which
// is ColorSwatch's color for its SAMPLED tier (a person manually reading
// a pixel) -- a different and deliberately distinct thing from computed
// (a headless browser's real getComputedStyle() read, no person
// involved; see ColorSwatch.jsx's own comment on why sampled and
// computed are intentionally different colors). A blue "Computed" badge
// here next to a blue "Sampled" badge in ColorSwatch would have taught
// the wrong association -- same color, opposite meaning. No "sampled"
// tier exists for fonts at all (there's no manual pixel-read equivalent
// for typography), so this only needed the computed value corrected to
// match ColorSwatch's actual computed teal, not a new tier added.
const CONFIDENCE_STYLES = {
  computed: { background: "#E0F5F1", color: "#0D7862" },
  confirmed: { background: "#E8F3E9", color: "#2F6E3E" },
  estimated: { background: "#FEF3E2", color: "#B45309" },
};

export default function FontCard({ font, onChange, onRemove }) {
  const confidenceStyle = CONFIDENCE_STYLES[font.confidence] || CONFIDENCE_STYLES.estimated;

  return (
    <div style={{ position: "relative", border: "1px solid #DDE0E6", borderRadius: "8px", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
            {font.custom ? (
              <input
                value={font.role || ""}
                onChange={e => onChange({ ...font, role: e.target.value })}
                placeholder="Role (e.g. Accent)"
                style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.05em", color: "#6B7280", border: "none", borderBottom: "1px solid #DDE0E6", padding: "0 0 2px", width: "100%" }}
              />
            ) : font.role}
          </div>
          <input
            value={font.name || ""}
            onChange={e => onChange({ ...font, name: e.target.value })}
            placeholder="Font name"
            style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "15px", fontWeight: 600, color: "#09090B",
              border: "none", width: "100%", padding: 0 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "8px" }}>
          {!font.custom && (
            <span style={{
              display: "inline-block", fontSize: "10px", fontWeight: 600, padding: "2px 7px",
              borderRadius: "10px", letterSpacing: "0.02em", ...confidenceStyle,
            }}>
              {font.confidence ? font.confidence[0].toUpperCase() + font.confidence.slice(1) : "Estimated"}
            </span>
          )}
          <button
            onClick={onRemove}
            title="Remove font"
            aria-label="Remove font"
            style={{
              width: "22px", height: "22px", borderRadius: "50%", background: "#fff", border: "1px solid #DDE0E6",
              color: "#6B635C", fontSize: "13px", lineHeight: 1, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
            }}
          >
            ×
          </button>
        </div>
      </div>
      <div style={{ fontSize: "22px", color: "#09090B", borderTop: "1px solid #DDE0E6", paddingTop: "12px", fontFamily: font.name ? `'${font.name}', sans-serif` : undefined }}>
        {font.name ? "The quick brown fox" : "—"}
      </div>
    </div>
  );
}
