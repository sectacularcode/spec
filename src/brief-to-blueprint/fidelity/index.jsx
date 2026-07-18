import { useState, useRef, useEffect } from "react";
import { T } from "../styles.js";
import { authHeaders } from "../../utils/api.js";
import { manifestToBrief } from "../importers/manifestImport.js";
import { checkFidelity, summarizeForApproval, compareAgainstHistory } from "../utils/fidelityCheck.js";

export default function FidelityCheck() {
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [brandFilter, setBrandFilter] = useState("");
  const fileRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/fidelity-approvals", { headers: await authHeaders() });
      const data = await res.json();
      setHistory(data.approvals || []);
    } catch (e) {
      console.warn("loadHistory failed:", e.message);
    }
    setHistoryLoading(false);
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const raw = JSON.parse(e.target.result);
          if (raw.format !== "manifest.page-document/1") {
            setResults(prev => [...prev, { fileName: file.name, error: "Not a manifest.page-document/1 export" }]);
            return;
          }
          const brief = manifestToBrief(raw);
          const report = checkFidelity(raw, brief);
          const summary = summarizeForApproval(raw, brief);
          const brandName = raw.brand && raw.brand.name;
          const brandHistory = history.filter(h => h.brandName === brandName);
          const comparison = compareAgainstHistory(summary, brandHistory);
          setResults(prev => [...prev, { fileName: file.name, raw, brief, report, summary, comparison, approved: false }]);
        } catch (err) {
          setResults(prev => [...prev, { fileName: file.name, error: err.message }]);
        }
      };
      reader.readAsText(file);
    });
  }

  async function handleApprove(idx) {
    const r = results[idx];
    if (!r || r.error) return;
    const brandName = (r.raw.brand && r.raw.brand.name) || "";
    const pageSlug = (r.raw.page && r.raw.page.slug) || "";
    const id = brandName + ":" + pageSlug + ":" + Date.now();
    try {
      await fetch("/api/fidelity-approvals", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          entry: {
            id,
            brandName,
            pageSlug,
            sectionTypes: r.summary.sectionTypes,
            fieldSummary: r.summary.fieldSummary,
            reportSummary: r.summary.reportSummary,
          },
        }),
      });
      setResults(prev => prev.map((x, i) => (i === idx ? { ...x, approved: true } : x)));
      loadHistory();
    } catch (e) {
      console.warn("approve failed:", e.message);
    }
  }

  async function handleDeleteApproval(id) {
    try {
      await fetch("/api/fidelity-approvals?id=" + encodeURIComponent(id), { method: "DELETE", headers: await authHeaders() });
      loadHistory();
    } catch (e) {
      console.warn("delete failed:", e.message);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Clear all saved fidelity approvals? This can't be undone.")) return;
    try {
      await fetch("/api/fidelity-approvals?all=true", { method: "DELETE", headers: await authHeaders() });
      loadHistory();
    } catch (e) {
      console.warn("clear failed:", e.message);
    }
  }

  const filteredHistory = brandFilter
    ? history.filter(h => (h.brandName || "").toLowerCase().indexOf(brandFilter.toLowerCase()) !== -1)
    : history;

  const selected = selectedIdx != null ? results[selectedIdx] : null;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div style={{ fontSize: "20px", fontWeight: 700, color: "#09090b", marginBottom: "6px" }}>Fidelity reports</div>
      <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
        Checks a Manifest export against what Spec actually built from it -- every section and field, traced back to the real source, not just re-checked against Spec's own logic.
      </div>

      <div
        onClick={() => fileRef.current && fileRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{ border: "2px dashed #dde0e6", borderRadius: "8px", padding: "24px", textAlign: "center", cursor: "pointer", marginBottom: "24px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#09090b", marginBottom: "4px" }}>Drop Manifest exports to check</div>
        <div style={{ fontSize: "11px", color: "#6b7280" }}>Multiple JSON files at once -- each gets its own report</div>
        <input ref={fileRef} type="file" accept=".json" multiple style={{ display: "none" }} onChange={e => handleFiles(e.target.files)} />
      </div>

      {results.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={T.label}>{"This batch (" + results.length + ")"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#dde0e6", border: "1px solid #dde0e6", borderRadius: "8px", overflow: "hidden", marginTop: "8px" }}>
            {results.map((r, i) => (
              <div key={i} onClick={() => setSelectedIdx(i)}
                style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px", background: selectedIdx === i ? "#fffaf3" : "#fff", padding: "10px 12px", fontSize: "12px", alignItems: "center", cursor: "pointer" }}>
                <div style={{ color: "#09090b" }}>{r.error ? r.fileName : ((r.raw.page && r.raw.page.slug) || r.fileName)}</div>
                <div>
                  {r.error ? (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#991b1b", background: "#fef2f2", padding: "2px 8px", borderRadius: "10px" }}>Error</span>
                  ) : r.report.clean ? (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#166534", background: "#f0fdf4", padding: "2px 8px", borderRadius: "10px" }}>Clean</span>
                  ) : (
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#92400e", background: "#fffbeb", padding: "2px 8px", borderRadius: "10px" }}>Review</span>
                  )}
                </div>
                <div style={{ color: "#6b7280" }}>{r.error ? "--" : (r.report.summary.tracedCount + "/" + (r.report.summary.tracedCount + r.report.summary.missingCount))}</div>
                <div>
                  {!r.error && (r.approved ? (
                    <span style={{ fontSize: "11px", color: "#166534" }}>Approved</span>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); handleApprove(i); }} style={{ padding: "4px 10px", fontSize: "11px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>Approve</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && !selected.error && (
        <div style={{ ...T.surface, marginBottom: "32px" }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#09090b", marginBottom: "16px" }}>{selected.raw.page && selected.raw.page.slug}</div>

          {(selected.comparison.newTypes.length > 0 || selected.comparison.commonlyMissingTypes.length > 0) && (
            <div style={{ marginBottom: "16px", padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", marginBottom: "4px" }}>Compared to this brand's approved history</div>
              {selected.comparison.newTypes.length > 0 && (
                <div style={{ fontSize: "12px", color: "#78350f" }}>New section type not seen before: {selected.comparison.newTypes.join(", ")}</div>
              )}
              {selected.comparison.commonlyMissingTypes.length > 0 && (
                <div style={{ fontSize: "12px", color: "#78350f" }}>Usually present, missing here: {selected.comparison.commonlyMissingTypes.join(", ")}</div>
              )}
            </div>
          )}

          <div style={T.label}>Source sections</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0 16px" }}>
            {selected.report.sections.map((s, i) => (
              <div key={i} style={{ padding: "8px 10px", background: s.status === "mapped" ? "#f9fafb" : "#eff6ff", borderRadius: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "#09090b", fontWeight: 600 }}>{s.type}{s.heading ? " -- \"" + s.heading + "\"" : ""}</span>
                  <span style={{ color: s.status === "mapped" ? "#166534" : "#1e40af" }}>{s.status.replace("_", " ")}</span>
                </div>
                {s.copy && s.copy.length > 0 && (
                  <div style={{ marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                    {s.copy.map((line, j) => (
                      <div key={j} style={{ fontSize: "12px", color: "#44403c", lineHeight: 1.5 }}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={T.label}>Content provenance</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", margin: "8px 0 16px" }}>
            {selected.report.fields.filter(f => f.status !== "empty").map((f, i) => (
              <div key={i} style={{ fontSize: "12px", color: "#09090b" }}>
                <span style={{ color: f.status.indexOf("NOT FOUND") === 0 ? "#dc2626" : "#166534", fontWeight: 700 }}>{f.status.indexOf("NOT FOUND") === 0 ? "\u2717" : "\u2713"}</span>
                {" " + f.label + " -- " + f.status}
              </div>
            ))}
          </div>

          {selected.report.placeholders.length > 0 && (
            <>
              <div style={T.label}>Buttons</div>
              <div style={{ fontSize: "12px", color: "#7f1d1d", margin: "8px 0 16px" }}>
                {selected.report.placeholders.map((p, i) => <div key={i}>"{p.label}" ({p.section}) -- no real destination</div>)}
              </div>
            </>
          )}

          {selected.report.proposed.length > 0 && (
            <>
              <div style={T.label}>Suggested, not included</div>
              <div style={{ fontSize: "12px", color: "#1e3a8a", margin: "8px 0" }}>
                {selected.report.proposed.map((p, i) => <div key={i} style={{ marginBottom: i < selected.report.proposed.length - 1 ? "8px" : 0 }}>{p.type}: {p.rationale}</div>)}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={T.label}>Approved history</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input placeholder="Search by brand" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
            style={{ fontSize: "11px", padding: "5px 10px", border: "1px solid #dde0e6", borderRadius: "6px", width: "160px" }} />
          {history.length > 0 && (
            <button onClick={handleClearAll} style={{ padding: "5px 10px", fontSize: "11px", fontWeight: 600, background: "#fff", color: "#991b1b", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer" }}>Clear all</button>
          )}
        </div>
      </div>

      {historyLoading ? (
        <div style={{ fontSize: "12px", color: "#6b7280" }}>Loading...</div>
      ) : filteredHistory.length === 0 ? (
        <div style={{ fontSize: "12px", color: "#6b7280" }}>No approved pages yet. Approve a checked page above to start building history.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#dde0e6", border: "1px solid #dde0e6", borderRadius: "8px", overflow: "hidden" }}>
          {filteredHistory.map(h => (
            <div key={h.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 32px", background: "#fff", padding: "10px 12px", fontSize: "12px", alignItems: "center" }}>
              <div style={{ color: "#09090b" }}>{h.brandName}</div>
              <div style={{ color: "#6b7280" }}>{h.pageSlug}</div>
              <div style={{ color: "#9ca3af" }}>{new Date(h.createdAt).toLocaleDateString()}</div>
              <button onClick={() => handleDeleteApproval(h.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "14px" }}>&times;</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
