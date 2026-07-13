import { useState, useEffect } from "react";
import { authHeaders } from "../utils/api.js";
import ButtonEditor from "../style-guide/components/ButtonEditor.jsx";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";

// Matches COLOR_KEYS in api/_lib/brandValidation.js exactly -- kept as a
// separate frontend constant rather than importing across the api/src
// boundary, same as every other tool in this app already does for its own
// color-key lists.
const COLOR_FIELDS = [
  { key: "ink", label: "Ink" },
  { key: "brass", label: "Brass" },
  { key: "brass-deep", label: "Brass — deep" },
  { key: "bone", label: "Bone" },
  { key: "asphalt", label: "Asphalt" },
  { key: "stone", label: "Stone" },
  { key: "warm-white", label: "Warm white" },
  { key: "text", label: "Text" },
];

function emptyBrand() {
  return {
    id: "brand-" + Date.now(),
    name: "", manifest_brand_id: null, colors: {}, fonts: {}, buttons: [],
    feature_layout: [], post_closing_layout: [], skip_services_checklist: false,
    source_url: "", notes: "",
  };
}

function formatDate(iso) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch { return ""; }
}

// Same background+hex-input pattern as ButtonEditor's own ColorField --
// kept local rather than imported since ButtonEditor's version isn't
// exported separately, and this one needs a label prop for the 8 fixed
// color-role names instead of "Background"/"Text".
function ColorField({ label, hex, onChange }) {
  return (
    <div>
      <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6b7280", margin: "0 0 5px" }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #dde0e6", borderRadius: "5px", padding: "3px 6px" }}>
        <input
          type="color"
          value={/^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : "#ffffff"}
          onChange={e => onChange(e.target.value)}
          style={{ width: "22px", height: "22px", padding: 0, border: "none", background: "none", cursor: "pointer", flexShrink: 0 }}
        />
        <input
          value={hex || ""}
          onChange={e => { const v = e.target.value; if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v); }}
          placeholder="#000000"
          style={{ fontFamily: "'Inter', monospace", fontSize: "11px", fontWeight: 600, color: "#09090b", border: "none", width: "100%", padding: "3px 0", background: "transparent" }}
        />
      </div>
    </div>
  );
}

function ColorSwatchStrip({ colors }) {
  const present = COLOR_FIELDS.filter(f => colors && colors[f.key]);
  if (present.length === 0) return <div style={{ fontSize: "11px", color: "#9ca3af" }}>No colors saved</div>;
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {present.map(f => (
        <div key={f.key} title={f.label} style={{ width: "18px", height: "18px", borderRadius: "4px", background: colors[f.key], border: "1px solid rgba(0,0,0,0.08)" }} />
      ))}
    </div>
  );
}

export default function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid"); // "grid" | "form"
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadBrands(); }, []);

  async function loadBrands() {
    setLoading(true);
    try {
      const res = await fetch("/api/brands", { headers: await authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data.brands) ? data.brands : []);
      }
    } catch { /* leave brands as-is, grid just shows what it already had */ }
    setLoading(false);
  }

  function openCreate() { setEditing(emptyBrand()); setError(""); setView("form"); }
  function openEdit(brand) {
    setEditing({ ...brand, colors: brand.colors || {}, fonts: brand.fonts || {}, buttons: brand.buttons || [], source_url: brand.source_url || "", notes: brand.notes || "" });
    setError(""); setView("form");
  }
  function backToGrid() { setView("grid"); setEditing(null); setError(""); }

  function updColor(key, hex) { setEditing(e => ({ ...e, colors: { ...e.colors, [key]: hex } })); }
  function updFont(key, val) { setEditing(e => ({ ...e, fonts: { ...e.fonts, [key]: val } })); }
  function addButton() { setEditing(e => ({ ...e, buttons: [...(e.buttons || []), { name: "", background: "#b45309", textColor: "#ffffff" }] })); }
  function updButton(i, val) { setEditing(e => ({ ...e, buttons: e.buttons.map((b, idx) => idx === i ? val : b) })); }
  function removeButton(i) { setEditing(e => ({ ...e, buttons: e.buttons.filter((_, idx) => idx !== i) })); }

  async function save() {
    if (!editing.name || !editing.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          manifest_brand_id: editing.manifest_brand_id || null,
          colors: editing.colors || {},
          fonts: editing.fonts || {},
          buttons: editing.buttons || [],
          feature_layout: editing.feature_layout || [],
          post_closing_layout: editing.post_closing_layout || [],
          skip_services_checklist: !!editing.skip_services_checklist,
          source_url: editing.source_url || null,
          notes: editing.notes || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        await loadBrands();
        setView("grid"); setEditing(null);
      } else if (res.status === 409) {
        setError(data?.message || "A brand with that name already exists.");
      } else {
        setError(data?.error || "Couldn't save — try again.");
      }
    } catch {
      setError("Couldn't save — try again.");
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch("/api/brands?id=" + encodeURIComponent(deleteTarget.id), { method: "DELETE", headers: await authHeaders() });
    } catch { /* fall through to reload either way -- if the delete actually failed, the row still shows up and the person can retry */ }
    setDeleting(false);
    setDeleteTarget(null);
    setView("grid"); setEditing(null);
    loadBrands();
  }

  const filtered = brands.filter(b => !search.trim() || b.name.toLowerCase().includes(search.trim().toLowerCase()));

  const S = {
    wrap: { maxWidth: "1100px", margin: "0 auto", padding: "40px 24px", fontFamily: "'Be Vietnam Pro', sans-serif" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" },
    title: { fontSize: "22px", fontWeight: 700, color: "#09090b" },
    sub: { fontSize: "13px", color: "#6b7280", marginTop: "4px" },
    search: { flex: 1, maxWidth: "320px", padding: "9px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontFamily: "'Be Vietnam Pro', sans-serif" },
    newBtn: { padding: "9px 16px", background: "#b45309", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" },
    card: { background: "#fff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "18px", cursor: "pointer", display: "flex", flexDirection: "column", gap: "10px" },
    cardName: { fontSize: "14px", fontWeight: 700, color: "#09090b" },
    cardMeta: { fontSize: "11px", color: "#9ca3af" },
    empty: { padding: "60px 20px", textAlign: "center", color: "#6b7280", fontSize: "13px" },
    formWrap: { maxWidth: "720px" },
    backBtn: { background: "none", border: "none", color: "#6b7280", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", padding: 0, marginBottom: "20px" },
    label: { fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "#6b7280", margin: "0 0 6px" },
    input: { width: "100%", padding: "9px 12px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontFamily: "'Be Vietnam Pro', sans-serif", boxSizing: "border-box" },
    section: { marginBottom: "28px" },
    colorGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" },
    fontGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
    buttonList: { display: "flex", flexDirection: "column", gap: "12px" },
    addBtn: { padding: "8px 14px", background: "#fff", border: "1px dashed #dde0e6", borderRadius: "6px", fontSize: "12px", fontWeight: 500, color: "#6b7280", cursor: "pointer", alignSelf: "flex-start" },
    structureNote: { fontSize: "12px", color: "#6b7280", background: "#f9f9fa", border: "1px solid #dde0e6", borderRadius: "6px", padding: "12px 14px", lineHeight: 1.5 },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "20px", borderTop: "1px solid #dde0e6" },
    saveBtn: { padding: "10px 20px", background: "#b45309", color: "#fff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
    deleteBtn: { padding: "10px 16px", background: "#fff", color: "#c93939", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer" },
    errorMsg: { fontSize: "12px", color: "#c93939", marginBottom: "12px" },
  };

  if (view === "form" && editing) {
    const isNew = !brands.find(b => b.id === editing.id);
    const structureRows = (editing.feature_layout || []).length + (editing.post_closing_layout || []).length;
    return (
      <div style={S.wrap}>
        <button style={S.backBtn} onClick={backToGrid}>← Back to Brands</button>
        <div style={S.formWrap}>
          <div style={S.section}>
            <p style={S.label}>Brand / client name</p>
            <input style={S.input} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Northfield Coffee Roasters" />
          </div>

          <div style={S.section}>
            <p style={S.label}>Colors</p>
            <div style={S.colorGrid}>
              {COLOR_FIELDS.map(f => (
                <ColorField key={f.key} label={f.label} hex={editing.colors?.[f.key] || ""} onChange={hex => updColor(f.key, hex)} />
              ))}
            </div>
          </div>

          <div style={S.section}>
            <p style={S.label}>Fonts</p>
            <div style={S.fontGrid}>
              <input style={S.input} value={editing.fonts?.heading || ""} onChange={e => updFont("heading", e.target.value)} placeholder="Heading font" />
              <input style={S.input} value={editing.fonts?.body || ""} onChange={e => updFont("body", e.target.value)} placeholder="Body font" />
            </div>
          </div>

          <div style={S.section}>
            <p style={S.label}>Buttons</p>
            <div style={S.buttonList}>
              {(editing.buttons || []).map((b, i) => (
                <ButtonEditor key={i} button={b} onChange={val => updButton(i, val)} onRemove={() => removeButton(i)} />
              ))}
            </div>
            <button style={{ ...S.addBtn, marginTop: (editing.buttons || []).length ? "12px" : 0 }} onClick={addButton}>+ Add button</button>
          </div>

          <div style={S.section}>
            <p style={S.label}>Structure / layout</p>
            <div style={S.structureNote}>
              {structureRows > 0
                ? `${structureRows} section style${structureRows === 1 ? "" : "s"} saved from Brief to Blueprint's Section Styles panel.`
                : "No section layout saved yet. This fills in automatically once a Brief to Blueprint build for this client saves its Section Styles picks here."}
            </div>
          </div>

          <div style={S.section}>
            <p style={S.label}>Notes</p>
            <textarea
              style={{ ...S.input, minHeight: "90px", resize: "vertical", fontFamily: "'Be Vietnam Pro', sans-serif" }}
              value={editing.notes} onChange={e => setEditing({ ...editing, notes: e.target.value })}
              placeholder="Anything worth remembering about this client — preferences, quirks, history."
            />
          </div>

          <div style={S.section}>
            <p style={S.label}>Source URL</p>
            <input style={S.input} value={editing.source_url} onChange={e => setEditing({ ...editing, source_url: e.target.value })} placeholder="https://clientsite.com" />
          </div>

          {error && <div style={S.errorMsg}>{error}</div>}

          <div style={S.footer}>
            {!isNew ? (
              <button style={S.deleteBtn} onClick={() => setDeleteTarget(editing)}>Delete brand</button>
            ) : <span />}
            <button style={{ ...S.saveBtn, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>
              {saving ? "Saving…" : isNew ? "Create brand" : "Save changes"}
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={!!deleteTarget}
          title={`Delete ${deleteTarget?.name || "this brand"}?`}
          message="This removes the saved colors, fonts, and notes for this client. It doesn't affect any pages already built for them — this can't be undone."
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div>
          <div style={S.title}>Brands</div>
          <div style={S.sub}>Saved client profiles — look, structure, and notes, reusable across every future build.</div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input style={S.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands…" />
          <button style={S.newBtn} onClick={openCreate}>+ New Brand</button>
        </div>
      </div>

      {loading ? (
        <div style={S.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>{search ? "No brands match that search." : "No brands saved yet — click \u201c+ New Brand\u201d to add one."}</div>
      ) : (
        <div style={S.grid}>
          {filtered.map(b => (
            <div key={b.id} style={S.card} onClick={() => openEdit(b)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
              <div style={S.cardName}>{b.name}</div>
              <ColorSwatchStrip colors={b.colors} />
              <div style={S.cardMeta}>Updated {formatDate(b.updated_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
