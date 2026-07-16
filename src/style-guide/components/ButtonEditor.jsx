// One editable button definition -- background color, text color, and an
// optional name (e.g. "Primary", "Secondary", "Outline"). This exists
// because "Accent" was being asked to double as icon color, hover state,
// AND button fill all at once, with no way to see what a real button
// actually looks like while building. A button is its own thing here: two
// colors the person picks directly, previewed live, not computed.
//
// locked (new): Primary and Secondary are guaranteed, always-present slots
// now -- every builder across Brief to Blueprint looks buttons up BY NAME
// ("primary"/"secondary", case-insensitive), not by array position, so
// those two names have to actually exist and can't be typed wrong,
// renamed away, or deleted. Locked hides the remove button and renders
// the name as a static label instead of an editable input. Any button
// beyond the first two stays fully free-form (name, add, remove) exactly
// as before.
//
// Caption + outline preview (new): confirmed real gap -- Secondary never
// renders as a filled button anywhere in the actual pages (landing.js/
// landingPreview.js always draw it as an outline/transparent button, only
// ever paired next to Primary, never alone), but this editor's preview
// swatch showed it filled, same as Primary. Someone picking Secondary's
// color saw something that didn't match what actually ships. Fixed by
// rendering the real outline style specifically for the locked Secondary
// slot, plus a one-line caption under both locked names saying where each
// one actually shows up. Free-form buttons beyond the first two aren't
// looked up by name anywhere yet (confirmed -- only "primary"/"secondary"
// are read), so they keep the generic filled preview and no caption
// rather than claiming a render behavior that doesn't exist yet.

const LOCKED_CAPTIONS = {
  primary: "Filled button — hero, forms, closing CTA",
  secondary: "Outline button — always paired next to Primary",
};

export default function ButtonEditor({ button, onChange, onRemove, locked }) {
  const roleKey = (button.name || "").trim().toLowerCase();
  const isSecondary = locked && roleKey === "secondary";
  const caption = locked ? LOCKED_CAPTIONS[roleKey] : null;

  return (
    <div style={{ position: "relative", border: "1px solid #DDE0E6", borderRadius: "8px", padding: "16px" }}>
      {!locked && (
        <button
          onClick={onRemove}
          title="Remove button"
          aria-label="Remove button"
          style={{
            position: "absolute", top: "10px", right: "10px", width: "22px", height: "22px",
            borderRadius: "50%", background: "#fff", border: "1px solid #DDE0E6",
            color: "#6B635C", fontSize: "13px", lineHeight: 1, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          }}
        >
          ×
        </button>
      )}

      {locked ? (
        <p style={{
          fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
          letterSpacing: "0.05em", color: "#6B7280", margin: "0 0 2px", paddingBottom: caption ? "0" : "6px", borderBottom: caption ? "none" : "1px solid #DDE0E6",
        }}>
          {button.name}
        </p>
      ) : (
        <input
          value={button.name || ""}
          onChange={e => onChange({ ...button, name: e.target.value })}
          placeholder="Name (e.g. Primary)"
          style={{
            fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.05em", color: "#6B7280", border: "none", borderBottom: "1px solid #DDE0E6",
            padding: "0 0 6px", marginBottom: "14px", width: "70%", background: "transparent",
          }}
        />
      )}

      {caption && (
        <p style={{
          fontSize: "10px", color: "#9CA3AF", margin: "0 0 12px", paddingBottom: "6px",
          borderBottom: "1px solid #DDE0E6", lineHeight: 1.4,
        }}>
          {caption}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "center", padding: "18px 12px", background: "#F5F5F5", borderRadius: "6px", marginBottom: "14px" }}>
        {isSecondary ? (
          <div style={{
            display: "inline-block", padding: "9px 20px", borderRadius: "6px", background: "transparent",
            border: "2px solid " + (button.background || "#333"),
          }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: button.background || "#333", letterSpacing: "0.02em" }}>
              Call to action
            </span>
          </div>
        ) : (
          <div style={{ display: "inline-block", padding: "11px 22px", borderRadius: "6px", background: button.background || "#333" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: button.textColor || "#fff", letterSpacing: "0.02em" }}>
              Call to action
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <ColorField label="Background" hex={button.background || ""} onChange={hex => onChange({ ...button, background: hex })} />
        <ColorField label="Text" hex={button.textColor || ""} onChange={hex => onChange({ ...button, textColor: hex })} />
      </div>
    </div>
  );
}

function ColorField({ label, hex, onChange }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6B7280", margin: "0 0 5px" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #DDE0E6", borderRadius: "5px", padding: "3px 6px" }}>
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#000000"}
          onChange={e => onChange(e.target.value)}
          style={{ width: "22px", height: "22px", padding: 0, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}
        />
        <input
          value={hex}
          onChange={e => {
            const v = e.target.value;
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
          }}
          placeholder="#000000"
          style={{
            fontFamily: "'Inter', monospace", fontSize: "11px", fontWeight: 600, color: "#09090B",
            border: "none", width: "100%", padding: "3px 0", background: "transparent",
          }}
        />
      </div>
    </div>
  );
}
