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

// Server-side save already validates source_url is a real, parseable
// http/https URL (see api/brand-styles.js) -- but that validation was
// added after the table went live, so rows saved before it exists don't
// retroactively become clean. Defensive here rather than trusting every
// existing row predates that fix: falls back to showing the raw string
// if it isn't parseable, instead of letting a bad legacy value throw and
// crash this whole panel's render.
function safeHostname(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

export default function AdminPanel({ isAdmin }) {
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

  // Usage & Limits (admin only)
  const [usageByUser, setUsageByUser]     = useState([]);
  const [usageByClient, setUsageByClient] = useState([]);
  const [usageLoading, setUsageLoading]   = useState(false);
  const [usageMsg, setUsageMsg]           = useState({ text: "", type: "ok" });
  const [editingLimit, setEditingLimit]   = useState(null); // { scope, scopeId } or null
  const [limitInput, setLimitInput]       = useState(""); // dollars, as typed
  const [savingLimit, setSavingLimit]     = useState(false);
  const [modelHealth, setModelHealth]     = useState(null); // { allLive, models, checkedAt } or null
  const [checkingModels, setCheckingModels] = useState(false);

  // Error Log (admin only) — raw failures logged server-side by
  // api/_lib/errorLog.js's logError(). Read-only.
  const [errorLogs, setErrorLogs]         = useState([]);
  const [errorLogsLoading, setErrorLogsLoading] = useState(false);
  const [errorLogsMsg, setErrorLogsMsg]   = useState({ text: "", type: "ok" });

  // Template Queries (admin only) — aggregated counts of what people type
  // into "Describe your site" and "Generate from keywords", grouped by
  // normalized query text. Surfaces which niches keep going isCustom, i.e.
  // real candidates for new Template Studio templates.
  const [templateQueries, setTemplateQueries] = useState([]);
  const [templateQueriesLoading, setTemplateQueriesLoading] = useState(false);
  const [templateQueriesMsg, setTemplateQueriesMsg] = useState({ text: "", type: "ok" });

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
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        // Previously silent — a failed/forbidden request looked identical
        // to "there are no users" instead of surfacing the actual error.
        flash(data.error || "Failed to load users.", "err");
        setUsers([]);
      }
    } catch { flash("Error loading users.", "err"); setUsers([]); }
    setLoading(false);
  }

  useEffect(() => { if (user?.id) loadUsers(); }, [user?.id]);

  // ── Usage & Limits (admin only) ──────────────────────────────────────────
  async function loadUsage() {
    setUsageLoading(true);
    try {
      const res = await fetch("/api/usage-summary", { headers: await authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setUsageByUser(data.byUser || []);
        setUsageByClient(data.byClient || []);
      } else {
        setUsageMsg({ text: data.error || "Failed to load usage.", type: "err" });
      }
    } catch { setUsageMsg({ text: "Error loading usage.", type: "err" }); }
    setUsageLoading(false);
  }

  useEffect(() => { if (isAdmin && user?.id) loadUsage(); }, [isAdmin, user?.id]);

  // ── Error Log (admin only) ────────────────────────────────────────────
  async function loadErrorLogs() {
    setErrorLogsLoading(true);
    try {
      const res = await fetch("/api/error-logs", { headers: await authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setErrorLogs(data.logs || []);
      } else {
        setErrorLogsMsg({ text: data.error || "Failed to load error log.", type: "err" });
      }
    } catch { setErrorLogsMsg({ text: "Error loading error log.", type: "err" }); }
    setErrorLogsLoading(false);
  }

  useEffect(() => { if (isAdmin && user?.id) loadErrorLogs(); }, [isAdmin, user?.id]);

  // ── Template Queries (admin only) ───────────────────────────────────────
  async function loadTemplateQueries() {
    setTemplateQueriesLoading(true);
    try {
      const res = await fetch("/api/template-queries", { headers: await authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setTemplateQueries(data.queries || []);
        setTemplateQueriesMsg({ text: "", type: "ok" });
      } else {
        setTemplateQueriesMsg({ text: data.error || "Failed to load template queries.", type: "err" });
      }
    } catch { setTemplateQueriesMsg({ text: "Error loading template queries.", type: "err" }); }
    setTemplateQueriesLoading(false);
  }
  useEffect(() => { if (isAdmin && user?.id) loadTemplateQueries(); }, [isAdmin, user?.id]);

  // Saved Style Guides (admin only) — every user's saved Style Guide brand
  // entries, real colors/fonts, cross-user. Purely a reference list for
  // picking real brand data when building a new Template Studio template
  // -- not a live connection between the two tools, just a faster way to
  // see what's actually available than asking in chat each time.
  const [allStyleGuides, setAllStyleGuides] = useState([]);
  const [styleGuidesLoading, setStyleGuidesLoading] = useState(false);
  const [styleGuidesMsg, setStyleGuidesMsg] = useState({ text: "", type: "ok" });
  async function loadAllStyleGuides() {
    setStyleGuidesLoading(true);
    try {
      const res = await fetch("/api/brand-styles?all=true", { headers: await authHeaders() });
      const data = await res.json();
      if (res.ok) {
        setAllStyleGuides(data.styles || []);
        setStyleGuidesMsg({ text: "", type: "ok" });
      } else {
        setStyleGuidesMsg({ text: data.error || "Failed to load saved style guides.", type: "err" });
      }
    } catch { setStyleGuidesMsg({ text: "Error loading saved style guides.", type: "err" }); }
    setStyleGuidesLoading(false);
  }
  useEffect(() => { if (isAdmin && user?.id) loadAllStyleGuides(); }, [isAdmin, user?.id]);

  function startEditLimit(scope, scopeId, currentCents) {
    setEditingLimit({ scope, scopeId });
    setLimitInput(currentCents != null ? (currentCents / 100).toFixed(2) : "");
  }

  async function saveLimit() {
    if (!editingLimit) return;
    const dollars = parseFloat(limitInput);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setUsageMsg({ text: "Enter a valid dollar amount.", type: "err" });
      return;
    }
    setSavingLimit(true);
    try {
      const res = await fetch("/api/usage-limits", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ scope: editingLimit.scope, scopeId: editingLimit.scopeId, monthlyLimitCents: Math.round(dollars * 100) }),
      });
      if (res.ok) {
        setUsageMsg({ text: "Limit saved.", type: "ok" });
        setEditingLimit(null);
        loadUsage();
      } else {
        const d = await res.json();
        setUsageMsg({ text: d.error || "Failed to save limit.", type: "err" });
      }
    } catch { setUsageMsg({ text: "Error saving limit.", type: "err" }); }
    setSavingLimit(false);
    setTimeout(() => setUsageMsg({ text: "", type: "ok" }), 3000);
  }

  async function removeLimit(scope, scopeId) {
    try {
      const res = await fetch(`/api/usage-limits?scope=${encodeURIComponent(scope)}&scopeId=${encodeURIComponent(scopeId)}`, {
        method: "DELETE",
        headers: await authHeaders(),
      });
      if (res.ok) loadUsage();
    } catch { /* silent — non-critical, the limit stays visible and can be retried */ }
  }

  async function checkModelHealth() {
    setCheckingModels(true);
    try {
      const res = await fetch("/api/model-health", { headers: await authHeaders() });
      const data = await res.json();
      if (res.ok) setModelHealth(data);
      else setUsageMsg({ text: data.error || "Model check failed.", type: "err" });
    } catch { setUsageMsg({ text: "Error checking models.", type: "err" }); }
    setCheckingModels(false);
  }

  function formatCents(cents) {
    if (cents == null) return "—";
    return "$" + (cents / 100).toFixed(2);
  }

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
      const res = await fetch("/api/user-role", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ action: "delete", userId }),
      });
      if (res.ok) {
        flash("User removed.");
        loadUsers();
      } else {
        // Previously showed "User removed." unconditionally — e.g. the
        // server-side block on an admin deleting their own account would
        // silently fail while the UI claimed success.
        const d = await res.json();
        flash(d.error || "Failed to remove user.", "err");
      }
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

      {/* Usage & Limits — admin only, per explicit instruction; managers see
          the user table above but not spend/limit data. */}
      {isAdmin && (
        <div style={{ borderTop: "1px solid #dde0e6" }}>
          <div style={S.header}>
            <div style={S.headerTitle}>Usage &amp; Limits — This Month</div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button style={S.btnSecondary} onClick={checkModelHealth} disabled={checkingModels}>
                {checkingModels ? "Checking…" : "Check models"}
              </button>
              <button style={S.btnSecondary} onClick={loadUsage} disabled={usageLoading}>Refresh</button>
            </div>
          </div>

          {modelHealth && (
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #dde0e6", background: modelHealth.allLive ? "#f0fdf4" : "#fef2f2" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: modelHealth.allLive ? "#166534" : "#991b1b", marginBottom: "6px" }}>
                {modelHealth.allLive ? "All configured models are live." : "One or more configured models are no longer available."}
              </div>
              {modelHealth.models.map(m => (
                <div key={m.id} style={{ fontSize: "12px", color: "#3f3f46", display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.live ? "#16a34a" : "#dc2626", display: "inline-block", flexShrink: 0 }} />
                  <code style={{ fontSize: "11px" }}>{m.id}</code>
                  <span style={{ color: "#6b7280" }}>({m.usedIn.join(", ")})</span>
                </div>
              ))}
            </div>
          )}

          {usageMsg.text && (
            <div style={{ ...S.msg, padding: "8px 20px 0", color: usageMsg.type === "err" ? "#dc2626" : "#b45309" }}>{usageMsg.text}</div>
          )}

          {/* By account */}
          <div style={{ padding: "16px 20px 4px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>By Account</div>
          {usageLoading ? (
            <div style={S.empty}>Loading usage…</div>
          ) : usageByUser.length === 0 ? (
            <div style={S.empty}>No API calls logged this month yet.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Account</th>
                  <th style={S.th}>Calls</th>
                  <th style={S.th}>Spend</th>
                  <th style={S.th}>Limit</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {usageByUser.map(u => (
                  <tr key={u.userId}>
                    <td style={S.td}>
                      <div style={{ fontWeight: 500, fontSize: "13px" }}>{u.name || u.email || u.userId}</div>
                    </td>
                    <td style={S.td}>{u.callCount}</td>
                    <td style={S.td}>
                      {formatCents(u.costCents)}
                      {u.limitCents != null && u.costCents > u.limitCents && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 700, color: "#dc2626" }}>OVER LIMIT</span>
                      )}
                    </td>
                    <td style={S.td}>
                      {editingLimit?.scope === "user" && editingLimit?.scopeId === u.userId ? (
                        <div style={S.editRow}>
                          <input style={{ ...S.input, width: "80px" }} value={limitInput} onChange={e => setLimitInput(e.target.value)} placeholder="0.00" />
                          <button style={S.btnSave} onClick={saveLimit} disabled={savingLimit}>{savingLimit ? "…" : "Save"}</button>
                          <button style={S.btnSecondary} onClick={() => setEditingLimit(null)}>Cancel</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{formatCents(u.limitCents)}</span>
                      )}
                    </td>
                    <td style={S.td}>
                      {!(editingLimit?.scope === "user" && editingLimit?.scopeId === u.userId) && (
                        <div style={S.editRow}>
                          <button style={S.btnSecondary} onClick={() => startEditLimit("user", u.userId, u.limitCents)}>
                            {u.limitCents != null ? "Edit limit" : "Set limit"}
                          </button>
                          {u.limitCents != null && (
                            <button style={S.btnDanger} onClick={() => removeLimit("user", u.userId)}>Remove</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* By client/brand */}
          <div style={{ padding: "16px 20px 4px", fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>By Client / Brand</div>
          {usageLoading ? (
            <div style={S.empty}>Loading usage…</div>
          ) : usageByClient.length === 0 ? (
            <div style={S.empty}>No client-tagged calls logged this month yet.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Client</th>
                  <th style={S.th}>Calls</th>
                  <th style={S.th}>Spend</th>
                  <th style={S.th}>Limit</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {usageByClient.map(c => (
                  <tr key={c.clientName}>
                    <td style={S.td}><div style={{ fontWeight: 500, fontSize: "13px" }}>{c.clientName}</div></td>
                    <td style={S.td}>{c.callCount}</td>
                    <td style={S.td}>
                      {formatCents(c.costCents)}
                      {c.limitCents != null && c.costCents > c.limitCents && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", fontWeight: 700, color: "#dc2626" }}>OVER LIMIT</span>
                      )}
                    </td>
                    <td style={S.td}>
                      {editingLimit?.scope === "client" && editingLimit?.scopeId === c.clientName ? (
                        <div style={S.editRow}>
                          <input style={{ ...S.input, width: "80px" }} value={limitInput} onChange={e => setLimitInput(e.target.value)} placeholder="0.00" />
                          <button style={S.btnSave} onClick={saveLimit} disabled={savingLimit}>{savingLimit ? "…" : "Save"}</button>
                          <button style={S.btnSecondary} onClick={() => setEditingLimit(null)}>Cancel</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{formatCents(c.limitCents)}</span>
                      )}
                    </td>
                    <td style={S.td}>
                      {!(editingLimit?.scope === "client" && editingLimit?.scopeId === c.clientName) && (
                        <div style={S.editRow}>
                          <button style={S.btnSecondary} onClick={() => startEditLimit("client", c.clientName, c.limitCents)}>
                            {c.limitCents != null ? "Edit limit" : "Set limit"}
                          </button>
                          {c.limitCents != null && (
                            <button style={S.btnDanger} onClick={() => removeLimit("client", c.clientName)}>Remove</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ padding: "10px 20px 16px", fontSize: "11px", color: "#9ca3af" }}>
            Reporting only — limits are informational and don't block generation yet.
          </div>
        </div>
      )}

      {/* Error Log — admin only. Raw server-side failures (5xx-class only,
          not routine 400/401 rejections) written by api/_lib/errorLog.js.
          Read-only; no delete/clear yet. */}
      {isAdmin && (
        <div style={{ borderTop: "1px solid #dde0e6" }}>
          <div style={S.header}>
            <div style={S.headerTitle}>Error Log</div>
            <button style={S.btnSecondary} onClick={loadErrorLogs} disabled={errorLogsLoading}>
              {errorLogsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {errorLogsMsg.text && (
            <div style={{ ...S.msg, padding: "8px 20px 0", color: errorLogsMsg.type === "err" ? "#dc2626" : "#b45309" }}>{errorLogsMsg.text}</div>
          )}

          {errorLogsLoading ? (
            <div style={S.empty}>Loading error log…</div>
          ) : errorLogs.length === 0 ? (
            <div style={S.empty}>No errors logged. That's a good sign.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Time</th>
                  <th style={S.th}>Route</th>
                  <th style={S.th}>Method</th>
                  <th style={S.th}>User</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Message</th>
                </tr>
              </thead>
              <tbody>
                {errorLogs.map(log => (
                  <tr key={log.id}>
                    <td style={S.td}>{new Date(log.occurred_at).toLocaleString()}</td>
                    <td style={S.td}><code style={{ fontSize: "12px" }}>{log.route}</code></td>
                    <td style={S.td}>{log.method || "—"}</td>
                    <td style={S.td}><code style={{ fontSize: "11px" }}>{log.user_id || "—"}</code></td>
                    <td style={S.td}>{log.status_code || "—"}</td>
                    <td style={{ ...S.td, maxWidth: "360px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ padding: "10px 20px 16px", fontSize: "11px", color: "#9ca3af" }}>
            Shows the 100 most recent unexpected server errors, newest first. Routine validation/auth rejections aren't logged here.
          </div>
        </div>
      )}

      {/* Template Queries — admin only. Aggregated counts of what people
          type into "Describe your site" and "Generate from keywords",
          grouped by normalized query text -- captures every resolved
          attempt, not just ones the person explicitly saved. Read-only. */}
      {isAdmin && (
        <div style={{ borderTop: "1px solid #dde0e6" }}>
          <div style={S.header}>
            <div style={S.headerTitle}>Template Queries</div>
            <button style={S.btnSecondary} onClick={loadTemplateQueries} disabled={templateQueriesLoading}>
              {templateQueriesLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {templateQueriesMsg.text && (
            <div style={{ ...S.msg, padding: "8px 20px 0", color: templateQueriesMsg.type === "err" ? "#dc2626" : "#b45309" }}>{templateQueriesMsg.text}</div>
          )}

          {templateQueriesLoading ? (
            <div style={S.empty}>Loading template queries…</div>
          ) : templateQueries.length === 0 ? (
            <div style={S.empty}>Nothing logged yet.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Query</th>
                  <th style={S.th}>Total</th>
                  <th style={S.th}>Custom</th>
                  <th style={S.th}>Matched</th>
                  <th style={S.th}>Top Matched Template</th>
                  <th style={S.th}>Color Retry Fired</th>
                  <th style={S.th}>Color Retry Fixed It</th>
                  <th style={S.th}>Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {templateQueries.map(q => (
                  <tr key={q.normalized_query}>
                    <td style={S.td}>{q.normalized_query}</td>
                    <td style={S.td}>{q.total_count}</td>
                    <td style={S.td}>{q.custom_count > 0 ? q.custom_count : "—"}</td>
                    <td style={S.td}>{q.matched_count > 0 ? q.matched_count : "—"}</td>
                    <td style={S.td}><code style={{ fontSize: "12px" }}>{q.top_matched_template_id || "—"}</code></td>
                    <td style={S.td}>{q.color_retry_fired_count > 0 ? q.color_retry_fired_count : "—"}</td>
                    <td style={S.td}>
                      {q.color_retry_fired_count > 0
                        ? `${q.color_retry_succeeded_count} / ${q.color_retry_fired_count}`
                        : "—"}
                    </td>
                    <td style={S.td}>{new Date(q.last_seen).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ padding: "10px 20px 16px", fontSize: "11px", color: "#9ca3af" }}>
            Top 200 queries by frequency, grouped by normalized text. A high "Custom" count with no matched template is a real candidate for a new Template Studio template. "Color Retry Fixed It" shows successes/attempts for the automatic color-request correction -- a low ratio here means the retry mechanism itself needs work, not just individual prompts.
          </div>
        </div>
      )}

      {/* Saved Style Guides — admin only. Every user's saved Style Guide
          brand entries (real colors/fonts extracted or entered by hand),
          cross-user. Read-only reference list for picking real brand data
          when building a new Template Studio template -- not a live
          connection to Template Studio, just a faster way to see what's
          actually saved than asking in chat each time. */}
      {isAdmin && (
        <div style={{ borderTop: "1px solid #dde0e6" }}>
          <div style={S.header}>
            <div style={S.headerTitle}>Saved Style Guides</div>
            <button style={S.btnSecondary} onClick={loadAllStyleGuides} disabled={styleGuidesLoading}>
              {styleGuidesLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {styleGuidesMsg.text && (
            <div style={{ ...S.msg, padding: "8px 20px 0", color: styleGuidesMsg.type === "err" ? "#dc2626" : "#b45309" }}>{styleGuidesMsg.text}</div>
          )}

          {styleGuidesLoading ? (
            <div style={S.empty}>Loading saved style guides…</div>
          ) : allStyleGuides.length === 0 ? (
            <div style={S.empty}>No saved style guides yet.</div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Brand</th>
                  <th style={S.th}>Colors</th>
                  <th style={S.th}>Heading Font</th>
                  <th style={S.th}>Body Font</th>
                  <th style={S.th}>Source</th>
                  <th style={S.th}>Owner</th>
                  <th style={S.th}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {allStyleGuides.map(sg => (
                  <tr key={sg.user_id + "::" + sg.brand_name}>
                    <td style={S.td}>{sg.brand_name}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {Object.entries(sg.colors || {}).map(([key, hex]) => (
                          <div key={key} title={key + ": " + hex} style={{ width: "16px", height: "16px", borderRadius: "3px", background: hex, border: "1px solid #dde0e6", flexShrink: 0 }} />
                        ))}
                      </div>
                    </td>
                    <td style={S.td}>{sg.fonts?.heading || "—"}</td>
                    <td style={S.td}>{sg.fonts?.body || "—"}</td>
                    <td style={S.td}>
                      {sg.source_url
                        ? <a href={sg.source_url} target="_blank" rel="noreferrer" style={{ color: "#b45309" }}>{safeHostname(sg.source_url)}</a>
                        : <span style={{ color: "#9ca3af" }}>manual</span>}
                    </td>
                    <td style={S.td}><code style={{ fontSize: "11px" }}>{sg.user_id}</code></td>
                    <td style={S.td}>{new Date(sg.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ padding: "10px 20px 16px", fontSize: "11px", color: "#9ca3af" }}>
            Every saved Style Guide brand, across all users. When a template gets built using one of these as reference, note the brand name in a comment at that template's definition in constants/templates.js -- durable, visible in the file itself, no separate system to keep in sync.
          </div>
        </div>
      )}
    </div>
  );
}


