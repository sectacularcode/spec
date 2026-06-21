import { useUser, UserButton } from "@clerk/clerk-react";
import { useState, useEffect } from "react";

const TOOLS = [
  {
    id: "template-studio",
    label: "Template Studio",
    desc: "Pre-built industry templates. Apply your brand, export clean Elementor JSON.",
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
    desc: "Upload a client brief. Generate a complete multi-page site structure with AI-drafted copy.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

export default function Dashboard({ onSelectTool, role, tools: allowedTools }) {
  const { user } = useUser();
  const [showAdmin, setShowAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserRole, setNewUserRole] = useState("staff");
  const [newUserTools, setNewUserTools] = useState(["template-studio", "brief-to-blueprint"]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const visibleTools = TOOLS.filter(t => allowedTools.includes(t.id));
  const isAdmin = role === "admin";
  const isManager = role === "manager" || role === "admin";

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list", requesterId: user?.id })
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch { setUsers([]); }
    setLoadingUsers(false);
  }

  async function saveUser() {
    if (!newUserId.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", requesterId: user?.id, userId: newUserId.trim(), role: newUserRole, tools: newUserTools })
      });
      setMsg("User saved.");
      setNewUserId("");
      loadUsers();
    } catch { setMsg("Error saving user."); }
    setSaving(false);
    setTimeout(() => setMsg(""), 3000);
  }

  async function removeUser(userId) {
    if (!window.confirm("Remove this user's role?")) return;
    await fetch("/api/user-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", requesterId: user?.id, userId })
    });
    loadUsers();
  }

  useEffect(() => {
    if (showAdmin && isManager) loadUsers();
  }, [showAdmin]);

  const S = {
    wrap: { minHeight: "100vh", background: "#eeedf1", fontFamily: "Inter, system-ui, sans-serif" },
    nav: { background: "#fff", borderBottom: "1px solid #dde0e6", height: "48px", display: "flex", alignItems: "center", padding: "0 32px", justifyContent: "space-between" },
    logo: { fontSize: "24px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b" },
    logoDot: { color: "#b45309" },
    beta: { fontSize: "9px", color: "#fff", padding: "2px 6px", background: "#b45309", borderRadius: "6px", fontWeight: 500, marginLeft: "6px", verticalAlign: "middle" },
    navRight: { display: "flex", alignItems: "center", gap: "16px" },
    email: { fontSize: "12px", color: "#6b7280" },
    rolePill: { fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: role === "admin" ? "#09090b" : role === "manager" ? "#b45309" : "#eeedf1", color: role === "staff" ? "#6b635c" : "#fff", textTransform: "uppercase", letterSpacing: "0.06em" },
        body: { maxWidth: "960px", margin: "0 auto", padding: "48px 24px" },
    greeting: { fontSize: "22px", fontWeight: 700, color: "#09090b", marginBottom: "4px" },
    sub: { fontSize: "14px", color: "#6b7280", marginBottom: "40px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginBottom: "48px" },
    card: { background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "28px", cursor: "pointer", transition: "box-shadow 0.15s", display: "flex", flexDirection: "column", gap: "12px" },
    cardLabel: { fontSize: "15px", fontWeight: 700, color: "#09090b" },
    cardDesc: { fontSize: "13px", color: "#6b7280", lineHeight: 1.5 },
    sectionHead: { fontSize: "13px", fontWeight: 700, color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" },
    adminBtn: { background: "none", border: "1px solid #dde0e6", borderRadius: "6px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, color: "#6b635c", cursor: "pointer", marginBottom: "24px" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "13px" },
    th: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #dde0e6", color: "#6b7280", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" },
    td: { padding: "10px 12px", borderBottom: "1px solid #eeedf1", color: "#09090b" },
    input: { padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", width: "100%", boxSizing: "border-box" },
    select: { padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", background: "#fff" },
    saveBtn: { padding: "8px 18px", background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    removeBtn: { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "12px", fontWeight: 600 },
  };

  return (
    <div style={S.wrap}>
      <div style={S.nav}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={S.logo}>spec<span style={S.logoDot}>.</span></span>
          <span style={S.beta}>beta</span>
        </div>
        <div style={S.navRight}>
          <span style={S.rolePill}>{role}</span>
          <span style={S.email}>{user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: "28px", height: "28px" },
              }
            }}
          />
        </div>
      </div>

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
          <div>
            <button style={S.adminBtn} onClick={() => setShowAdmin(!showAdmin)}>
              {showAdmin ? "Hide" : "Manage"} user access
            </button>

            {showAdmin && (
              <div>
                <div style={S.sectionHead}>User access</div>

                <div style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "12px" }}>Add or update a user</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "8px", alignItems: "end" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: 600 }}>Clerk User ID</div>
                      <input style={S.input} value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="user_abc123" />
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: 600 }}>Role</div>
                      <select style={S.select} value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                        {isAdmin && <option value="admin">Admin</option>}
                        {isAdmin && <option value="manager">Manager</option>}
                        <option value="staff">Staff</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: 600 }}>Tools</div>
                      <select style={S.select} value={newUserTools.join(",")} onChange={e => setNewUserTools(e.target.value.split(","))}>
                        <option value="template-studio,brief-to-blueprint">Both tools</option>
                        <option value="template-studio">Template Studio only</option>
                        <option value="brief-to-blueprint">Blueprint only</option>
                      </select>
                    </div>
                    <button style={S.saveBtn} onClick={saveUser} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                  {msg && <div style={{ fontSize: "12px", color: "#b45309", marginTop: "8px" }}>{msg}</div>}
                </div>

                {loadingUsers ? (
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading users…</div>
                ) : (
                  <div style={{ background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", overflow: "hidden" }}>
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>User ID</th>
                          <th style={S.th}>Role</th>
                          <th style={S.th}>Tools</th>
                          <th style={S.th}>Last updated</th>
                          {isAdmin && <th style={S.th}></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td style={S.td} colSpan="5">No users configured yet.</td></tr>
                        ) : users.map(u => (
                          <tr key={u.userId}>
                            <td style={{ ...S.td, fontFamily: "monospace", fontSize: "12px" }}>{u.userId}</td>
                            <td style={S.td}><span style={{ ...S.rolePill, fontSize: "10px" }}>{u.role}</span></td>
                            <td style={{ ...S.td, fontSize: "12px", color: "#6b7280" }}>{(u.tools || []).join(", ")}</td>
                            <td style={{ ...S.td, fontSize: "12px", color: "#6b7280" }}>{u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "—"}</td>
                            {isAdmin && <td style={S.td}><button style={S.removeBtn} onClick={() => removeUser(u.userId)}>Remove</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
