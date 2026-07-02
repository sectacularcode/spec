import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { authHeaders } from "../utils/api.js";

const ROLE_COLORS = {
  admin:   { bg: "#09090b", color: "#fff" },
  manager: { bg: "#b45309", color: "#fff" },
  staff:   { bg: "#eeedf1", color: "#6b635c" },
};

const TOOL_OPTIONS = [
  { value: "template-studio,brief-to-blueprint", label: "Both tools" },
  { value: "template-studio", label: "Template Studio only" },
  { value: "brief-to-blueprint", label: "Blueprint only" },
];

function RolePill({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.staff;
  return (
    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {role}
    </span>
  );
}

export default function AdminPanel({ isAdmin, _isManager }) {
  const { user } = useUser();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [editingId, setEditingId]   = useState(null);
  const [editRole, setEditRole]     = useState("staff");
  const [editTools, setEditTools]   = useState("template-studio,brief-to-blueprint");
  const [newUserId, setNewUserId]   = useState("");
  const [newRole, setNewRole]       = useState("staff");
  const [newTools, setNewTools]     = useState("template-studio,brief-to-blueprint");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [msg, setMsg]               = useState({ text: "", type: "ok" });

  function flash(text, type = "ok") {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "ok" }), 3000);
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/user-role", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch { setUsers([]); }
    setLoading(false);
  }

  useEffect(() => { if (user?.id) loadUsers(); }, [user?.id]);

  async function addUser() {
    if (!newUserId.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user-role", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          action: "set",
          userId: newUserId.trim(),
          role: newRole,
          tools: newTools.split(","),
        }),
      });
      if (res.ok) {
        flash("User added.");
        setNewUserId("");
        setNewRole("staff");
        setNewTools("template-studio,brief-to-blueprint");
        loadUsers();
      } else {
        const d = await res.json();
        flash(d.error || "Failed to add user.", "err");
      }
    } catch { flash("Error adding user.", "err"); }
    setSaving(false);
  }

  async function saveEdit(userId) {
    setSaving(true);
    try {
      const res = await fetch("/api/user-role", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          action: "set",
          userId,
          role: editRole,
          tools: editTools.split(","),
        }),
      });
      if (res.ok) { flash("Saved."); setEditingId(null); loadUsers(); }
      else { const d = await res.json(); flash(d.error || "Failed.", "err"); }
    } catch { flash("Error saving.", "err"); }
    setSaving(false);
  }

  async function deleteUser(userId) {
    if (!window.confirm("Remove this user? They will lose all access.")) return;
    setDeleting(userId);
    try {
      await fetch("/api/user-role", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ action: "delete", userId }),
      });
      flash("User removed.");
      loadUsers();
    } catch { flash("Error removing user.", "err"); }
    setDeleting(null);
  }

  function startEdit(u) {
    setEditingId(u.userId);
    setEditRole(u.role || "staff");
    setEditTools((u.tools || ["template-studio", "brief-to-blueprint"]).join(","));
  }

  const S = {
    wrap: { background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", overflow: "hidden", marginTop: "32px" },
    header: { padding: "16px 20px", borderBottom: "1px solid #dde0e6", display: "flex", justifyContent: "space-between", alignItems: "center" },
    headerTitle: { fontSize: "13px", fontWeight: 700, color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em" },
    addBlock: { padding: "20px", borderBottom: "1px solid #dde0e6", background: "#fafafa" },
    addLabel: { fontSize: "11px", fontWeight: 600, color: "#6b7280", marginBottom: "10px" },
    addRow: { display: "grid", gridTemplateColumns: "1fr 120px 200px auto", gap: "8px", alignItems: "end" },
    fieldLabel: { fontSize: "11px", color: "#6b7280", fontWeight: 600, marginBottom: "4px" },
    input: { padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", width: "100%", boxSizing: "border-box", fontFamily: "Inter, system-ui, sans-serif" },
    select: { padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", background: "#fff", width: "100%", fontFamily: "Inter, system-ui, sans-serif" },
    btnPrimary: { padding: "8px 18px", background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
    btnSecondary: { padding: "6px 12px", background: "#fff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    btnDanger: { padding: "6px 12px", background: "none", color: "#dc2626", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    btnSave: { padding: "6px 12px", background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #dde0e6", color: "#6b7280", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", background: "#fafafa" },
    td: { padding: "12px 16px", borderBottom: "1px solid #eeedf1", fontSize: "13px", color: "#09090b", verticalAlign: "middle" },
    editRow: { display: "flex", gap: "8px", alignItems: "center" },
    msg: { fontSize: "12px", marginTop: "8px" },
    empty: { padding: "24px 16px", textAlign: "center", color: "#6b7280", fontSize: "13px" },
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.headerTitle}>User Management</div>
        <button style={S.btnSecondary} onClick={loadUsers}>Refresh</button>
      </div>

      {/* Add new user */}
      <div style={S.addBlock}>
        <div style={S.addLabel}>Add or update a user</div>
        <div style={S.addRow}>
          <div>
            <div style={S.fieldLabel}>Clerk User ID</div>
            <input
              style={S.input}
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              placeholder="user_abc123"
              onKeyDown={e => e.key === "Enter" && addUser()}
            />
          </div>
          <div>
            <div style={S.fieldLabel}>Role</div>
            <select style={S.select} value={newRole} onChange={e => setNewRole(e.target.value)}>
              {isAdmin && <option value="admin">Admin</option>}
              {isAdmin && <option value="manager">Manager</option>}
              <option value="staff">Staff</option>
            </select>
          </div>
          <div>
            <div style={S.fieldLabel}>Tool access</div>
            <select style={S.select} value={newTools} onChange={e => setNewTools(e.target.value)}>
              {TOOL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button style={S.btnPrimary} onClick={addUser} disabled={saving || !newUserId.trim()}>
            {saving ? "Saving…" : "Add user"}
          </button>
        </div>
        {msg.text && (
          <div style={{ ...S.msg, color: msg.type === "err" ? "#dc2626" : "#b45309" }}>{msg.text}</div>
        )}
      </div>

      {/* User table */}
      {loading ? (
        <div style={S.empty}>Loading users…</div>
      ) : users.length === 0 ? (
        <div style={S.empty}>No users configured yet. Add one above.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>User</th>
              <th style={S.th}>Role</th>
              <th style={S.th}>Tools</th>
              <th style={S.th}>Last updated</th>
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.userId} style={{ background: editingId === u.userId ? "#fffbf5" : "transparent" }}>
                <td style={S.td}>
                  <div style={{ fontWeight: 500, color: "#09090b", fontSize: "13px" }}>
                    {u.name || u.email || "Unknown"}
                  </div>
                  {u.email && u.name && (
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>{u.email}</div>
                  )}
                </td>
                <td style={S.td}>
                  {editingId === u.userId ? (
                    <select style={{ ...S.select, width: "auto" }} value={editRole} onChange={e => setEditRole(e.target.value)}>
                      {isAdmin && <option value="admin">Admin</option>}
                      {isAdmin && <option value="manager">Manager</option>}
                      <option value="staff">Staff</option>
                    </select>
                  ) : (
                    <RolePill role={u.role} />
                  )}
                </td>
                <td style={S.td}>
                  {editingId === u.userId ? (
                    <select style={{ ...S.select, width: "auto" }} value={editTools} onChange={e => setEditTools(e.target.value)}>
                      {TOOL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {(u.tools || []).join(", ")}
                    </span>
                  )}
                </td>
                <td style={{ ...S.td, fontSize: "12px", color: "#6b7280" }}>
                  {u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : "—"}
                </td>
                <td style={S.td}>
                  {editingId === u.userId ? (
                    <div style={S.editRow}>
                      <button style={S.btnSave} onClick={() => saveEdit(u.userId)} disabled={saving}>
                        {saving ? "…" : "Save"}
                      </button>
                      <button style={S.btnSecondary} onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={S.editRow}>
                      <button style={S.btnSecondary} onClick={() => startEdit(u)}>Edit</button>
                      {isAdmin && (
                        <button
                          style={S.btnDanger}
                          onClick={() => deleteUser(u.userId)}
                          disabled={deleting === u.userId}>
                          {deleting === u.userId ? "…" : "Remove"}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


