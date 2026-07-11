// Shared destructive-action confirmation. Same visual language as the
// existing modals (GenerateFromKeywordsModal, BulkLocationModal) and the
// same red used by Template Studio's pre-existing deleteProject confirm --
// this doesn't introduce a new pattern, it extends the one that already
// existed for exactly one action to the other real data-loss actions that
// were missing it.
//
// Deliberately NOT used for in-progress-form row removals (a social link
// input, a reference URL input, a bulk-location row) -- those are trivially
// re-typable and gating them would just be friction, not safety.

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", fontFamily: "'Be Vietnam Pro', sans-serif", padding: "22px 24px" }}
      >
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b", marginBottom: "8px" }}>{title}</div>
        <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5, marginBottom: "20px" }}>{message}</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: "9px 12px", background: "#c93939", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            style={{ padding: "9px 14px", background: "transparent", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
