// One color swatch card. Two modes:
// - Template role (color.custom is false): one of Spec's 8 fixed roles,
//   defined once in src/utils/colorRoles.js and reused here, shown with a
//   Confirmed/Derived/Estimated/Sampled badge reflecting how the value was
//   actually produced -- never invented.
// - Custom (color.custom is true): a color that doesn't map to any of the
//   8 roles. Free-text name AND usage note, both optional, both editable
//   by the person -- never constrained to a fixed dropdown, since a real
//   brand's extra colors ("sale badge red", "success green") don't fit a
//   short fixed list.

import { ROLE_TO_KEY } from "../../utils/colorRoles.js";

const CONFIDENCE_STYLES = {
  confirmed: { background: "#E8F3E9", color: "#2F6E3E" },
  derived:   { background: "#EEEEF8", color: "#5450A3" },
  estimated: { background: "#FEF3E2", color: "#B45309" },
  // Distinct from "confirmed" on purpose -- confirmed means a real CSS
  // signal matched algorithmically, sampled means a person looked at the
  // actual rendered pixel and picked it themselves. Both are trustworthy,
  // but they're different kinds of trustworthy and deserve an honest,
  // separate label rather than being folded into one bucket.
  sampled:   { background: "#E3F2FA", color: "#1D6FA5" },
  // Also distinct from "sampled" -- this is a headless browser reading the
  // real getComputedStyle() value automatically (Heading/Body text/
  // Background), or a filtered heuristic read (Accent/Secondary text, from
  // a styled link or footer), not a person confirming a pixel by eye.
  computed:  { background: "#E0F5F1", color: "#0D7862" },
};

const TEMPLATE_ROLES = Object.keys(ROLE_TO_KEY);

export default function ColorSwatch({ color, onChange, onRemove }) {
  const confidenceStyle = CONFIDENCE_STYLES[color.confidence] || CONFIDENCE_STYLES.estimated;

  return (
    <div style={{ position: "relative", border: "1px solid #DDE0E6", borderRadius: "8px", overflow: "hidden" }}>
      <button
        onClick={onRemove}
        title="Remove color"
        aria-label="Remove color"
        style={{
          position: "absolute", top: "8px", right: "8px", width: "20px", height: "20px",
          borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "1px solid #DDE0E6",
          color: "#6B635C", fontSize: "13px", lineHeight: 1, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}
      >
        ×
      </button>

      {color.custom ? (
        <input
          type="color"
          value={color.hex}
          onChange={e => onChange({ ...color, hex: e.target.value })}
          style={{ width: "100%", height: "64px", border: "none", padding: 0, cursor: "pointer", display: "block" }}
        />
      ) : (
        <div style={{ height: "64px", background: color.hex }} />
      )}

      <div style={{ padding: "10px 12px" }}>
        {color.custom ? (
          <>
            <input
              value={color.name || ""}
              onChange={e => onChange({ ...color, name: e.target.value })}
              placeholder="Name this color"
              style={inputStyle}
            />
            <input
              value={color.usage || ""}
              onChange={e => onChange({ ...color, usage: e.target.value })}
              placeholder="Where it's used (optional)"
              style={inputStyle}
            />
            <input
              value={color.hex}
              onChange={e => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange({ ...color, hex: v });
              }}
              placeholder="#000000"
              style={{ ...inputStyle, fontFamily: "'Inter', monospace", fontWeight: 600, color: "#09090B", marginBottom: 0 }}
            />
          </>
        ) : (
          <>
            <p style={{ fontFamily: "'Inter', monospace", fontSize: "12px", fontWeight: 600, color: "#09090B", margin: "0 0 6px" }}>
              {color.hex}
            </p>
            <select
              value={color.role}
              onChange={e => onChange({ ...color, role: e.target.value })}
              style={{ ...inputStyle, color: "#6B635C", padding: "4px 22px 4px 6px", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 5 5-5' stroke='%236b635c' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 6px center", cursor: "pointer", appearance: "none", WebkitAppearance: "none" }}
            >
              {TEMPLATE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <span style={{
              display: "inline-block", fontSize: "10px", fontWeight: 600, padding: "2px 7px",
              borderRadius: "10px", letterSpacing: "0.02em", ...confidenceStyle,
            }}>
              {color.confidence ? color.confidence[0].toUpperCase() + color.confidence.slice(1) : "Estimated"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "11px", color: "#09090B",
  border: "1px solid #DDE0E6", borderRadius: "4px", padding: "4px 6px", marginBottom: "6px", background: "#fff",
};
