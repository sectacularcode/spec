import { useState } from "react";

// Collapsible list of every saved brand style for this user. Reused as-is
// regardless of source (manual entry, Style Guide URL-scrape, or a
// previous upload) -- brand_styles doesn't distinguish, and neither does
// this list; source_url just renders differently per row when present.
export default function SavedLibrary({ styles, loading, onApply, onDelete, statusMessage }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ background: "#fff", border: "1px solid #DDE0E6", borderRadius: "10px", padding: collapsed ? "24px 24px 20px" : "24px" }}>
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: collapsed ? 0 : "14px" }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7280" }}>
          Saved style guides
        </span>
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px",
          borderRadius: "6px", fontSize: "18px", color: "#6B635C",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s",
        }}>
          ▾
        </span>
      </div>

      {statusMessage && (
        <p style={{ fontSize: "12px", color: "#B45309", margin: "0 0 12px" }}>{statusMessage}</p>
      )}

      {!collapsed && (
        loading ? (
          <p style={{ fontSize: "13px", color: "#6B7280" }}>Loading…</p>
        ) : styles.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#6B7280" }}>
            No saved style guides yet. Analyze a site or add colors above, then save one.
          </p>
        ) : (
          styles.map((style, i) => (
            <div
              key={style.brand_name}
              style={{
                display: "flex", alignItems: "center", gap: "16px", padding: "14px 0",
                borderBottom: i === styles.length - 1 ? "none" : "1px solid #DDE0E6",
              }}
            >
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                {Object.values(style.colors || {}).slice(0, 3).map((hex, j) => (
                  <div key={j} style={{ width: "18px", height: "18px", borderRadius: "4px", background: hex }} />
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{style.brand_name}</p>
                <p style={{ fontSize: "11px", color: "#6B7280", margin: "2px 0 0" }}>
                  {style.source_url ? new URL(style.source_url).hostname : "entered manually"}
                  {" · updated "}{formatRelativeDate(style.updated_at)}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button onClick={() => onDelete(style)} style={secondaryBtn}>Delete</button>
                <button onClick={() => onApply(style)} style={applyBtn}>Apply</button>
              </div>
            </div>
          ))
        )
      )}
    </div>
  );
}

function formatRelativeDate(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

const secondaryBtn = {
  fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "12px", fontWeight: 600, padding: "6px 12px",
  borderRadius: "5px", cursor: "pointer", background: "#fff", color: "#6B635C", border: "1px solid #DDE0E6",
};
const applyBtn = {
  ...secondaryBtn, background: "#FEF3E2", color: "#B45309", border: "1px solid #FEF3E2",
};
