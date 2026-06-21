import { useState, useEffect, lazy, Suspense } from "react";

// Lazy load each tool — browser only downloads what's needed for the active tab
const ElementorBuilder = lazy(() => import("./elementor-builder"));
const CustomBuild      = lazy(() => import("./CustomBuild"));

function Spinner() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading…</div>
    </div>
  );
}

function LoginScreen({ onAuth }) {
  const [val, setVal]         = useState("");
  const [error, setError]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function attempt() {
    if (!val || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: val }),
      });
      if (res.ok) {
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password.");
        setVal("");
        setTimeout(() => setError(false), 3000);
      }
    } catch {
      setError("Could not reach the server. Try again.");
      setVal("");
      setTimeout(() => setError(false), 3000);
    }
    setLoading(false);
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
        {error && <div style={{ fontSize: "12px", color: "#dc2626", marginBottom: "10px" }}>{error}</div>}
        <button
          onClick={attempt}
          disabled={loading}
          style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: 600, background: loading ? "#6b7280" : "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Checking…" : "Continue"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed]     = useState(false);
  const [checking, setChecking] = useState(true);

  const [mode, setMode] = useState(function() {
    try { return localStorage.getItem("spec_tab_mode") || "spec"; } catch(e) { return "spec"; }
  });

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.json())
      .then(d => { if (d.authed) setAuthed(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  async function signOut() {
    try { await fetch("/api/signout", { method: "POST" }); } catch {}
    setAuthed(false);
  }

  function switchMode(m) {
    setMode(m);
    try { localStorage.setItem("spec_tab_mode", m); } catch(e) {}
  }

  if (checking) return <Spinner />;
  if (!authed)  return <LoginScreen onAuth={() => setAuthed(true)} />;

  return (
    <div style={{ width: "100%", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box" }}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", padding: "0 48px", boxSizing: "border-box", position: "relative", height: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "auto", marginLeft: "72px" }}>
            <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b", lineHeight: 1 }}>spec</div>
            <div style={{ fontSize: "9px", color: "#ffffff", padding: "2px 6px", background: "#b45309", border: "none", borderRadius: "6px", letterSpacing: "0.04em", fontWeight: 500, alignSelf: "flex-end", marginBottom: "3px" }}>beta</div>
          </div>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center" }}>
            {[{ id: "spec", label: "Template Studio" }, { id: "custom", label: "Brief to Blueprint" }].map(tab => (
              <button key={tab.id} onClick={() => { switchMode(tab.id); if (tab.id === "spec") window.dispatchEvent(new Event("spec-go-projects")); }} style={{ padding: "18px 16px", fontSize: "13px", fontWeight: mode === tab.id ? 700 : 500, color: mode === tab.id ? "#09090b" : "#6b7280", background: "transparent", border: "none", cursor: "pointer", borderBottom: mode === tab.id ? "2px solid #09090b" : "2px solid transparent", whiteSpace: "nowrap" }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={signOut}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", color: "#6b635c" }}
            title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b635c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b635c" }}>Sign out</span>
          </button>
        </div>
      </div>
      <Suspense fallback={<Spinner />}>
        {mode === "spec"   && <ElementorBuilder />}
        {mode === "custom" && <CustomBuild />}
      </Suspense>
    </div>
  );
}
