import { useState } from "react";
import ElementorBuilder from "./elementor-builder";
import CustomBuild from "./CustomBuild";

export default function App() {
  const [mode, setMode] = useState("spec");
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <div style={{ fontSize: "15px", fontWeight: 800, color: "#09090b", marginRight: "32px", padding: "16px 0" }}>Spec</div>
        {[{ id: "spec", label: "AI Builder" }, { id: "custom", label: "Custom Build" }].map(tab => (
          <button key={tab.id} onClick={() => setMode(tab.id)} style={{ padding: "18px 16px", fontSize: "13px", fontWeight: mode === tab.id ? 700 : 500, color: mode === tab.id ? "#09090b" : "#6b7280", background: "transparent", border: "none", cursor: "pointer", borderBottom: mode === tab.id ? "2px solid #09090b" : "2px solid transparent" }}>
            {tab.label}
          </button>
        ))}
      </div>
      {mode === "spec" && <ElementorBuilder />}
      {mode === "custom" && <CustomBuild />}
    </div>
  );
}
