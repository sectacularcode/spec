// One editable button definition -- background color, text color, and an
// optional name (e.g. "Primary", "Secondary", "Outline"). This exists
// because "Accent" was being asked to double as icon color, hover state,
// AND button fill all at once, with no way to see what a real button
// actually looks like while building. A button is its own thing here: two
// colors the person picks directly, previewed live, not computed.

export default function ButtonEditor({ button, onChange, onRemove }) {
  return (
    <div style={{ position: "relative", border: "1px solid #DDE0E6", borderRadius: "8px", padding: "16px" }}>
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

      <div style={{ display: "flex", justifyContent: "center", padding: "18px 12px", background: "#F5F5F5", borderRadius: "6px", marginBottom: "14px" }}>
        <div style={{ display: "inline-block", padding: "11px 22px", borderRadius: "4px", background: button.background || "#333" }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "13px", color: button.textColor || "#fff", letterSpacing: "0.02em" }}>
            Call to action
          </span>
        </div>
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
