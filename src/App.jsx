import { useState } from "react";
import ElementorBuilder from "./elementor-builder";
import CustomBuild from "./CustomBuild";

const PASS = "Spec#21?5!";
const STORAGE_KEY = "spec_auth";

function LoginScreen({ onAuth }) {
  const [val, setVal] = useState("");
  const [error, setError] = useState(false);

  function attempt() {
    if (val === PASS) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch(e) {}
      onAuth();
    } else {
      setError(true);
      setVal("");
      setTimeout(() => setError(false), 2000);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "360px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: "22px", fontWeight: 800, color: "#09090b", marginBottom: "4px" }}>spec.</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "28px" }}>Enter your password to continue.</div>
        <input
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && attempt()}
          placeholder="Password"
          autoFocus
          style={{ width: "100%", padding: "10px 12px", border: error ? "1px solid #dc2626" : "1px solid #e5e7eb", borderRadius: "6px", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px", background: error ? "#fef2f2" : "#fff" }}
        />
        {error && <div style={{ fontSize: "12px", color: "#dc2626", marginBottom: "10px" }}>Incorrect password.</div>}
        <button
          onClick={attempt}
          style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600, background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(function() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch(e) { return false; }
  });

  const [mode, setMode] = useState(function() {
    try { return localStorage.getItem("spec_tab_mode") || "spec"; } catch(e) { return "spec"; }
  });

  function switchMode(m) {
    setMode(m);
    try { localStorage.setItem("spec_tab_mode", m); } catch(e) {}
  }

  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ width: "100%", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box" }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", padding: "0 48px", boxSizing: "border-box", position: "relative", height: "48px" }}>
          {/* spec + Beta — left anchor */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "auto", marginLeft: "72px" }}>
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b", lineHeight: 1 }}>spec</div>
            <div style={{ fontSize: "9px", color: "#6b7280", padding: "2px 6px", background: "#eeedf1", border: "1px solid #dde0e6", borderRadius: "6px", letterSpacing: "0.04em", fontWeight: 500, alignSelf: "flex-end", marginBottom: "3px" }}>beta</div>
          </div>
          {/* Centered tabs */}
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center" }}>
            {[{ id: "spec", label: "Template Studio" }, { id: "custom", label: "Brief to Blueprint" }].map(tab => (
              <button key={tab.id} onClick={() => switchMode(tab.id)} style={{ padding: "18px 16px", fontSize: "13px", fontWeight: mode === tab.id ? 700 : 500, color: mode === tab.id ? "#09090b" : "#6b7280", background: "transparent", border: "none", cursor: "pointer", borderBottom: mode === tab.id ? "2px solid #09090b" : "2px solid transparent", whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Lock — right anchor */}
          <button
            onClick={() => { try { localStorage.removeItem(STORAGE_KEY); } catch(e) {} setAuthed(false); }}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", color: "#6b635c" }}
            title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b635c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b635c" }}>Sign out</span>
          </button>
        </div>
      </div>
      {mode === "spec" && <ElementorBuilder />}
      {mode === "custom" && <CustomBuild />}
    </div>
  );
}



