// src/brief-to-blueprint/styles.js
// UI style tokens for Brief to Blueprint.
// Import directly in any component that needs them.

export const T = {
  surface: { background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "20px" },
  stepNum: (active, complete) => ({
    width: "24px", height: "24px", borderRadius: "50%",
    background: complete ? "#b45309" : active ? "#09090b" : "#dde0e6",
    color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: 700, flexShrink: 0,
  }),
  label: { fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" },
  input: { padding: "10px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontFamily: "'Be Vietnam Pro', sans-serif", outline: "none", background: "#ffffff", color: "#09090b" },
  btnGhost: { padding: "10px 16px", fontSize: "13px", fontWeight: 500, background: "#ffffff", color: "#6b635c", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" },
  btnPrimary: { padding: "10px 20px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#ffffff", border: "none", borderRadius: "6px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" },
};
