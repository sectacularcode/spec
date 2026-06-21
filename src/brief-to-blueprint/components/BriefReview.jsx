import { useState } from "react";

// Displays a parsed brief for user review before generating pages.
// Shown after file upload — lets the user edit any AI-parsed field
// before it becomes the working brief.

export function BriefReview({ parsed, onConfirm, onClose }) {
  const [draft, setDraft] = useState(parsed || {});

  function upd(key, val) { setDraft(d => ({ ...d, [key]: val })); }

  const S = {
    label: { display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" },
    input: { width: "100%", padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "8px 10px", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box", resize: "vertical", fontFamily: "'Be Vietnam Pro', sans-serif", lineHeight: 1.5 },
    field: { marginBottom: "14px" },
    section: { marginBottom: "24px", paddingBottom: "20px", borderBottom: "1px solid #f4f4f5" },
    sectionTitle: { fontSize: "12px", fontWeight: 700, color: "#09090b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" },
  };

  const FIELDS = [
    { section: "Brand", fields: [
      { key: "brandName", label: "Brand name", type: "input" },
      { key: "tagline", label: "Tagline", type: "input" },
      { key: "signatureLine", label: "Signature line", type: "input" },
      { key: "voiceRules", label: "Voice rules", type: "textarea", rows: 4, isArray: true },
    ]},
    { section: "Home page", fields: [
      { key: "heroHeadline", label: "Hero H1", type: "input" },
      { key: "heroSubhead", label: "Hero subhead", type: "textarea", rows: 2 },
      { key: "hookStatement", label: "Honest hook", type: "textarea", rows: 2 },
      { key: "differenceH2", label: "Difference H2", type: "input" },
      { key: "differenceBody", label: "Difference body", type: "textarea", rows: 2 },
      { key: "whoH2", label: "Who it is for H2", type: "input" },
      { key: "whoBody", label: "Who it is for body", type: "textarea", rows: 2 },
    ]},
    { section: "About & Process", fields: [
      { key: "aboutH1", label: "About H1", type: "input" },
      { key: "aboutStory", label: "Founder story", type: "textarea", rows: 3 },
      { key: "processH1", label: "Process H1", type: "input" },
      { key: "processIntro", label: "Process intro", type: "input" },
    ]},
    { section: "Contact", fields: [
      { key: "contactH1", label: "Contact H1", type: "input" },
      { key: "contactIntro", label: "Contact intro", type: "textarea", rows: 2 },
      { key: "contactReassurance", label: "Reassurance line", type: "input" },
    ]},
  ];

  const missingCount = FIELDS.flatMap(s => s.fields).filter(f => {
    const val = draft[f.key];
    return !val || (Array.isArray(val) ? val.length === 0 : val.trim() === "");
  }).length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "680px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Review parsed brief</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              Fix anything before generating.
              {missingCount > 0 && <span style={{ marginLeft: "8px", color: "#f59e0b", fontWeight: 600 }}>{missingCount} blank field{missingCount !== 1 ? "s" : ""} — AI can draft these if you select "No" on copy settings.</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {draft.colors && Object.keys(draft.colors).length > 0 && (
            <div style={{ marginBottom: "20px", padding: "14px", background: "#f9f9f9", borderRadius: "8px" }}>
              <div style={S.sectionTitle}>Colors extracted</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {Object.entries(draft.colors).map(([name, hex]) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: hex, border: "1px solid rgba(0,0,0,0.1)" }} />
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>{name}: {hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {FIELDS.map(section => (
            <div key={section.section} style={S.section}>
              <div style={S.sectionTitle}>{section.section}</div>
              {section.fields.map(f => {
                const val = draft[f.key];
                const displayVal = f.isArray && Array.isArray(val) ? val.join("\n") : (val || "");
                const isEmpty = !displayVal || displayVal.trim() === "";
                return (
                  <div key={f.key} style={S.field}>
                    <label style={{ ...S.label, color: isEmpty ? "#f59e0b" : "#6b7280" }}>
                      {f.label} {isEmpty && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— blank</span>}
                    </label>
                    {f.type === "input" ? (
                      <input style={{ ...S.input, borderColor: isEmpty ? "#fcd34d" : "#dde0e6" }} value={displayVal} onChange={e => upd(f.key, e.target.value)} placeholder={isEmpty ? "Not found in brief — type here to add" : ""} />
                    ) : (
                      <textarea rows={f.rows || 2} style={{ ...S.textarea, borderColor: isEmpty ? "#fcd34d" : "#dde0e6" }} value={displayVal} onChange={e => upd(f.key, f.isArray ? e.target.value.split("\n").filter(Boolean) : e.target.value)} placeholder={isEmpty ? "Not found in brief — type here to add" : ""} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 16px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", cursor: "pointer", color: "#6b7280" }}>Cancel</button>
          <button onClick={() => onConfirm(draft)} style={{ padding: "8px 24px", fontSize: "13px", fontWeight: 600, background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Looks good — use this brief →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Library helpers ───────────────────────────────────────────────────────────
