// Collapsible section wrapper used throughout the editor sidebar.
// title — displayed in the header. icon — optional emoji. id — for scroll targeting.

export const Section = ({ title, _icon, id, children }) => (
  <div id={id} style={{ marginBottom: "16px", padding: "20px 24px 36px", borderRadius: "10px", background: "#ffffff", border: "1px solid #dde0e6", transition: "box-shadow 0.2s" }}>
    <div style={{ fontSize: "13px", color: "#09090b", textTransform: "none", letterSpacing: "0", fontWeight: 700, marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #dde0e6" }}>
      {title}
    </div>
    <div style={{ display: "grid", gap: "16px" }}>{children}</div>
  </div>
);