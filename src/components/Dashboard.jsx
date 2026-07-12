import { useState } from "react";
import { useUser, UserButton } from "@clerk/clerk-react";
import AdminPanel from "./AdminPanel.jsx";

const TOOLS = [
  {
    id: "template-studio",
    label: "Template Studio",
    desc: "Start from a pre-built industry template. Customize your brand, preview live, and export a ready-to-import page template.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: "brief-to-blueprint",
    label: "Brief to Blueprint",
    desc: "Upload a brand brief or fill out the intake form. Generate a structured, multi-page site blueprint with copy drafted in the brand's voice.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    id: "style-guide",
    label: "Style Guide",
    desc: "Pull real colors and fonts from any live site, or build one from scratch. Saved guides are reusable across your Brief to Blueprint builds.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.52-.2-1-.53-1.36-.32-.36-.53-.85-.53-1.39 0-1.1.9-2 2-2h2.36c2.27 0 4.1-1.83 4.1-4.1C21.4 6.02 17.19 2 12 2z"/>
      </svg>
    ),
  },
];

const ROLE_COLORS = {
  admin:   { bg: "#09090b", color: "#fff" },
  manager: { bg: "#b45309", color: "#fff" },
  staff:   { bg: "#eeedf1", color: "#6b635c" },
};

export default function Dashboard({ onSelectTool, role, tools: allowedTools }) {
  const { user } = useUser();
  const isAdmin   = role === "admin";
  const isManager = role === "manager" || role === "admin";
  // Style Guide isn't its own gated permission -- same rule as the top-nav
  // tab in App.jsx: available whenever either main tool is, since it's a
  // shared utility for both rather than a tool someone is granted on its
  // own. allowedTools never actually contains "style-guide" itself.
  const visibleTools = TOOLS.filter(t =>
    t.id === "style-guide"
      ? (allowedTools.includes("template-studio") || allowedTools.includes("brief-to-blueprint"))
      : allowedTools.includes(t.id)
  );
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.staff;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const S = {
    wrap: { minHeight: "100vh", background: "#eeedf1", fontFamily: "Inter, system-ui, sans-serif" },
    nav: { background: "#fff", borderBottom: "1px solid #dde0e6", height: "48px", display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between" },
    logo: { fontSize: "24px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b" },
    logoDot: { color: "#b45309" },
    beta: { fontSize: "9px", color: "#fff", padding: "2px 6px", background: "#b45309", borderRadius: "6px", fontWeight: 500, marginLeft: "6px", verticalAlign: "middle" },
    navRight: { display: "flex", alignItems: "center", gap: "16px" },
    rolePill: { fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: roleColor.bg, color: roleColor.color, textTransform: "uppercase", letterSpacing: "0.06em" },
    email: { fontSize: "12px", color: "#6b7280" },
    body: { maxWidth: "960px", margin: "0 auto", padding: "48px 24px" },
    greeting: { fontSize: "22px", fontWeight: 700, color: "#09090b", marginBottom: "4px" },
    sub: { fontSize: "14px", color: "#6b7280", marginBottom: "40px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "48px" },
    card: { background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "28px", cursor: "pointer", transition: "box-shadow 0.15s", display: "flex", flexDirection: "column", gap: "12px" },
    cardLabel: { fontSize: "15px", fontWeight: 700, color: "#09090b" },
    cardDesc: { fontSize: "13px", color: "#6b7280", lineHeight: 1.5 },
    manageBtn: { display: "inline-flex", alignItems: "center", gap: "8px", padding: "9px 18px", background: "#fff", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontWeight: 500, color: "#09090b", cursor: "pointer" },
    // Drawer
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? "auto" : "none", transition: "opacity 0.2s" },
    drawer: { position: "fixed", top: 0, right: 0, width: "min(600px, 100vw)", height: "100vh", background: "#fff", borderLeft: "1px solid #dde0e6", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-4px 0 32px rgba(0,0,0,0.1)", transform: drawerOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)" },
    drawerHead: { padding: "16px 24px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
    drawerTitle: { fontSize: "15px", fontWeight: 700, color: "#09090b" },
    drawerSub: { fontSize: "12px", color: "#6b7280", marginTop: "2px" },
    drawerClose: { background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px", lineHeight: 1 },
    drawerBody: { flex: 1, overflowY: "auto", padding: "0" },
  };

  return (
    <div style={S.wrap}>
      {/* Overlay */}
      <div style={S.overlay} onClick={() => setDrawerOpen(false)} />

      {/* Slide-in drawer */}
      <div style={S.drawer}>
        <div style={S.drawerHead}>
          <div>
            <div style={S.drawerTitle}>{isAdmin ? "Admin Panel" : "Team Management"}</div>
            <div style={S.drawerSub}>{isAdmin ? "Add users, update roles and tool access, or remove accounts." : "Add staff members and manage their tool access."}</div>
          </div>
          <button style={S.drawerClose} onClick={() => setDrawerOpen(false)}>×</button>
        </div>
        <div style={S.drawerBody}>
          <AdminPanel isAdmin={isAdmin} />
        </div>
      </div>

      {/* Nav */}
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={S.logo}>spec<span style={S.logoDot}>.</span></span>
          <span style={S.beta}>beta</span>
        </div>
        <div style={S.navRight}>
          <span style={S.rolePill}>{role}</span>
          <span style={S.email}>{user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton appearance={{ elements: { avatarBox: { width: "28px", height: "28px" } } }} />
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>
        <div style={S.greeting}>Hey{user?.firstName ? `, ${user.firstName}` : ""}.</div>
        <div style={S.sub}>Here are the tools you have access to.</div>

        <div style={S.grid}>
          {visibleTools.map(tool => (
            <div
              key={tool.id}
              style={S.card}
              onClick={() => onSelectTool(tool.id)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {tool.icon}
              <div style={S.cardLabel}>{tool.label}</div>
              <div style={S.cardDesc}>{tool.desc}</div>
            </div>
          ))}
        </div>

        {isManager && (
          <button style={S.manageBtn} onClick={() => setDrawerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {isAdmin ? "Manage users" : "Manage team"}
          </button>
        )}
      </div>
    </div>
  );
}
