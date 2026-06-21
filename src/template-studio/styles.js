// src/template-studio/styles.js
// Shared input/label/button style tokens for Template Studio tabs.
// Import directly in any tab component that needs them.

export const I = {
  lbl: { display: "block", fontSize: "11px", color: "#6b7280", marginBottom: "6px", textTransform: "none", letterSpacing: "0", fontWeight: 600 },
  inp: { width: "100%", maxWidth: "100%", padding: "11px 13px", background: "#ffffff", border: "1px solid #dde0e6", color: "#000000", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", outline: "none", lineHeight: 1.5, boxSizing: "border-box" },
  sel: { width: "100%", maxWidth: "100%", padding: "11px 40px 11px 13px", background: "#ffffff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 14px center", border: "1px solid #dde0e6", color: "#000000", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", outline: "none", lineHeight: 1.5, boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", cursor: "pointer" },
  btn: { padding: "8px 16px", background: "#6b635c", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
  btnGhost: { padding: "8px 16px", background: "#ffffff", color: "#6b635c", border: "1px solid #6b635c", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
};
