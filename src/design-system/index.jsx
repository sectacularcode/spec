import { useState } from "react";

// Every value on this page was verified against real live code before being
// written here (see the July 2026 session that built this) -- this is meant
// to be the answer to "wait, was that font/radius/color actually decided,
// or did it just drift?" the next time that question comes up. If a value
// here and a value in real running code ever disagree, the real code is
// probably right and this page is stale -- fix this page to match, the same
// way outdated docs get fixed, not the other way around.

const COLORS = [
  { name: "Amber", hex: "#B45309", use: "Primary accent, buttons, active states, badges" },
  { name: "Amber wash", hex: "#FEF3E2", use: "Selected states, light amber backgrounds, pill fills" },
  { name: "Canvas", hex: "#EEEDF1", use: "Page background, canvas area" },
  { name: "White", hex: "#FFFFFF", use: "Cards, input backgrounds, clean surfaces" },
  { name: "Charcoal", hex: "#09090B", use: "Primary text, headings" },
  { name: "Warm stone", hex: "#6B635C", use: "Secondary buttons, muted UI elements" },
  { name: "Cool gray", hex: "#6B7280", use: "Helper text, labels, hints" },
  { name: "Border", hex: "#DDE0E6", use: "Universal border color, dividers" },
];

const SECTIONS = ["Typography", "Colors", "Buttons", "Badges", "Cards & rows", "Form controls"];

function ColorField({ label, hex }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #dde0e6", borderRadius: "6px", padding: "3px 6px" }}>
      <div style={{ width: "18px", height: "18px", borderRadius: "4px", background: hex, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Inter', monospace", fontSize: "11px", fontWeight: 600, color: "#09090b" }}>{hex}</span>
      <span style={{ fontSize: "11px", color: "#6b7280" }}>{label}</span>
    </div>
  );
}

export default function DesignSystem() {
  const [active, setActive] = useState("Typography");

  const S = {
    page: { display: "flex", fontFamily: "'Be Vietnam Pro', sans-serif", minHeight: "100vh" },
    nav: { width: "200px", flexShrink: 0, borderRight: "1px solid #dde0e6", padding: "32px 0", position: "sticky", top: "48px", alignSelf: "flex-start", height: "calc(100vh - 48px)" },
    navItem: (isActive) => ({ display: "block", width: "100%", textAlign: "left", padding: "9px 24px", background: "none", border: "none", cursor: "pointer", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "13px", fontWeight: isActive ? 700 : 500, color: isActive ? "#09090b" : "#6b7280", borderLeft: isActive ? "2px solid #b45309" : "2px solid transparent" }),
    body: { flex: 1, maxWidth: "760px", padding: "40px 48px" },
    h1: { fontFamily: "'Outfit', sans-serif", fontSize: "26px", fontWeight: 800, color: "#09090b", margin: "0 0 6px" },
    sub: { fontSize: "14px", color: "#6b7280", margin: "0 0 40px", lineHeight: 1.6 },
    h2: { fontSize: "12px", fontWeight: 700, color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px", paddingBottom: "10px", borderBottom: "1px solid #dde0e6" },
    card: { background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "20px", marginBottom: "16px" },
    ruleLabel: { fontSize: "11px", fontWeight: 600, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" },
    ruleText: { fontSize: "13px", color: "#6b7280", lineHeight: 1.6 },
  };

  return (
    <div style={S.page}>
      <div style={S.nav}>
        {SECTIONS.map(s => (
          <button key={s} style={S.navItem(active === s)} onClick={() => setActive(s)}>{s}</button>
        ))}
      </div>

      <div style={S.body}>
        <div style={S.h1}>Design system</div>
        <div style={S.sub}>Every value here is verified against real live code, not assumed. Colors, fonts, and component patterns for Spec's own UI chrome (not the templates it generates for clients — those have their own separate font/color pools).</div>

        {active === "Typography" && (
          <>
            <div style={S.h2}>Typography</div>
            <div style={S.card}>
              <div style={S.ruleLabel}>Be Vietnam Pro — all UI content, labels, and body text</div>
              <div style={{ fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "22px", color: "#09090b", marginBottom: "8px" }}>The quick brown fox jumps over the lazy dog</div>
              <div style={S.ruleText}>Used everywhere in the actual tools — Template Studio, Brief to Blueprint, Style Guide, Component Library, Admin Panel. If you're building a new screen and unsure what font to use, it's this one.</div>
            </div>
            <div style={S.card}>
              <div style={S.ruleLabel}>Outfit 800 — logo wordmark and major headings only</div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "28px", fontWeight: 800, color: "#09090b", marginBottom: "8px" }}>spec<span style={{ color: "#b45309" }}>.</span></div>
              <div style={S.ruleText}>Reserved for the wordmark and large page-level headings, not general UI text. Don't use it for buttons, labels, or body copy.</div>
            </div>
            <div style={S.card}>
              <div style={{ ...S.ruleLabel, color: "#dc2626" }}>Inter — top nav only, nowhere else</div>
              <div style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "13px", color: "#09090b", marginBottom: "8px" }}>Template Studio · Brief to Blueprint · Style Guide · Component Library</div>
              <div style={S.ruleText}>Scoped specifically to the sticky tool-switcher bar at the top of the screen (inherited automatically by not overriding it — every tool screen below the nav explicitly sets Be Vietnam Pro on its own container). Dashboard, the login screen, and the loading spinner previously drifted onto Inter too — fixed. If you find Inter anywhere that isn't the top nav bar, that's drift, not a choice.</div>
            </div>
          </>
        )}

        {active === "Colors" && (
          <>
            <div style={S.h2}>Colors</div>
            <div style={S.card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {COLORS.map(c => (
                  <div key={c.hex}>
                    <ColorField label={c.name} hex={c.hex} />
                    <div style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 2px 0" }}>{c.use}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {active === "Buttons" && (
          <>
            <div style={S.h2}>Buttons</div>
            <div style={S.card}>
              <div style={S.ruleLabel}>6px radius, 13px font, 600 weight — every button, no exceptions</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px" }}>
                <button style={{ padding: "8px 18px", background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Primary</button>
                <button style={{ padding: "8px 18px", background: "#fff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Secondary</button>
                <button style={{ padding: "8px 18px", background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Save (dark)</button>
                <button style={{ padding: "8px 18px", background: "#c93939", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Destructive</button>
                <button style={{ padding: "8px 18px", background: "none", color: "#dc2626", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Remove (ghost)</button>
              </div>
              <div style={S.ruleText}>Verified against the shared ConfirmDialog component and Clerk's own sign-in button — 14 real instances across 6 files confirm 6px. A "4px" note briefly made it into memory and caused a real regression (Component Library and Admin Panel both got built/edited with 4px before this was caught) — if 4px shows up anywhere, it's that same mistake resurfacing, not a real variant.</div>
            </div>
          </>
        )}

        {active === "Badges" && (
          <>
            <div style={S.h2}>Badges &amp; pills</div>
            <div style={S.card}>
              <div style={S.ruleLabel}>Amber wash pills for tags and badges — always fully rounded, never a small-radius chip</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "#09090b", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Admin</span>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "#b45309", color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em" }}>Manager</span>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: "#eeedf1", color: "#6b635c", textTransform: "uppercase", letterSpacing: "0.05em" }}>Staff</span>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", background: "#fef3e2", color: "#b45309" }}>ecommerce</span>
                <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", background: "#fee2e2", color: "#dc2626" }}>Over limit</span>
              </div>
            </div>
          </>
        )}

        {active === "Cards & rows" && (
          <>
            <div style={S.h2}>Cards</div>
            <div style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
              <div style={S.ruleLabel}>White background, 1px border, 10px radius</div>
              <div style={S.ruleText}>The atomic container for every distinct section — Admin Panel's redesign moved from one continuous card to separate ones per section for exactly this reason: real visual separation needs real card boundaries, not thin dividers inside one card.</div>
            </div>

            <div style={S.h2}>Row list pattern</div>
            <div style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #eeedf1", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b" }}>Row title</div>
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", background: "#fef3e2", color: "#b45309" }}>badge</span>
                </div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>Secondary metadata line — dates, counts, owners, anything supporting</div>
              </div>
              <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b" }}>Second row</div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>Every row shares this exact shape — title line, metadata line, no exceptions</div>
              </div>
            </div>
            <div style={{ ...S.ruleText, marginTop: "10px" }}>Replaced wide multi-column tables everywhere in Admin Panel this session — none of them ever fit the panel's fixed width without either scrolling or squeezing. This is the pattern to reach for instead, any time a table's the instinct but the container is narrow.</div>
          </>
        )}

        {active === "Form controls" && (
          <>
            <div style={S.h2}>Form controls</div>
            <div style={S.card}>
              <div style={S.ruleLabel}>Inputs and selects — 6px radius, custom SVG chevron on every select</div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                <input
                  placeholder="Text input"
                  style={{ padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontFamily: "inherit", width: "160px", boxSizing: "border-box" }}
                  readOnly
                />
                <select
                  style={{ padding: "8px 34px 8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", background: "#fff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 5 5-5' stroke='%236b635c' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 12px center", width: "160px", fontFamily: "inherit", cursor: "pointer", outline: "none", appearance: "none", WebkitAppearance: "none", boxSizing: "border-box" }}
                  defaultValue="a"
                >
                  <option value="a">Custom select</option>
                  <option value="b">Option two</option>
                </select>
              </div>
              <div style={S.ruleText}>appearance:none + WebkitAppearance:none suppresses the native browser arrow, an inline SVG chevron replaces it, and real right-padding (34px) is reserved so the chevron never crowds the text. Never ship a &lt;select&gt; without this — it was a recurring, multi-file fix earlier this year precisely because it wasn't a standing convention until it got written down.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
