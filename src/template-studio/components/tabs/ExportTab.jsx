import { Icon } from "../Icon.jsx";

export default function ExportTab({ ctx }) {
  const { project, downloadPage, downloadHeader, downloadFooter, downloadAll, exportBrief, shareBrief, exportFormat } = ctx;
  return (
            <div className="editor-padding" style={{ padding: "24px 20px 40px", maxWidth: "1080px", margin: "0 auto" }}>
            <div style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "8px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Download</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap", marginBottom: "16px", overflowX: "auto", alignItems: "center" }}>
                <button onClick={downloadPage} style={{ padding: "8px 14px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <Icon name="download" size={14} color="#ffffff" /> Download Template
                </button>
                <button onClick={downloadHeader} style={{ padding: "8px 14px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <Icon name="download" size={14} color="#09090b" /> Header Template
                </button>
                <button onClick={downloadFooter} style={{ padding: "8px 14px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <Icon name="download" size={14} color="#09090b" /> Footer Template
                </button>
                <button onClick={exportBrief} style={{ padding: "8px 14px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <Icon name="file-text" size={14} color="#09090b" /> Export Brief
                </button>
                <button onClick={shareBrief} style={{ padding: "8px 14px", background: "#ffffff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  <Icon name="arrowRight" size={14} color="#09090b" /> Share Brief Link
                </button>
                {project.pages.length > 1 && (
                  <button onClick={downloadAll} style={{ padding: "10px 16px", background: "#6b635c", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Icon name="download" size={14} color="#ffffff" /> Download All Pages (.zip)
                  </button>
                )}
              </div>
              <div style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
                Header and footer templates are exported separately and uploaded in the Theme Builder.
              </div>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "8px", padding: "20px" }}>
              <div style={{ fontSize: "12px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>How to import — {exportFormat === "divi" ? "Divi" : "Elementor"}</div>
              {exportFormat === "elementor" ? (
                <ol style={{ fontSize: "14px", color: "#09090b", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
                  <li>WordPress → Templates → Saved Templates</li>
                  <li>Click <em>Import Templates</em>, upload the .json</li>
                  <li>Edit your existing page with Elementor</li>
                  <li>Click the gray folder icon → My Templates → Insert</li>
                  <li>For footer: Templates → Theme Builder → Footer → Add New → Import</li>
                </ol>
              ) : (
                <ol style={{ fontSize: "14px", color: "#09090b", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
                  <li>WordPress → Divi → Divi Library</li>
                  <li>Click <em>Import & Export</em> → Import tab → upload the .json</li>
                  <li>Edit your existing page with the Divi Builder</li>
                  <li>Click <em>Load From Library</em> → Your Saved Layouts → Use This Layout</li>
                  <li>For footer: Divi → Theme Builder → Add Global Footer → Build From Scratch → Load From Library</li>
                </ol>
              )}
            </div>
          </div>
  );
}
