import { useState, lazy, Suspense } from "react";
import { SignIn, SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";

// Lazy load each tool — browser only downloads what is needed for the active tab
const ElementorBuilder = lazy(() => import("./template-studio/index.jsx"));
const CustomBuild      = lazy(() => import("./brief-to-blueprint/index.jsx"));

function Spinner() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading…</div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#eeedf1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b", marginBottom: "24px" }}>
        spec<span style={{ color: "#b45309" }}>.</span>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: { width: "100%", maxWidth: "400px" },
            card: { boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #dde0e6", borderRadius: "12px" },
            headerTitle: { display: "none" },
            headerSubtitle: { display: "none" },
            socialButtonsBlockButton: { borderRadius: "6px", border: "1px solid #dde0e6" },
            formButtonPrimary: { background: "#b45309", borderRadius: "6px", fontSize: "13px", fontWeight: 600 },
            footerActionLink: { color: "#b45309" },
          }
        }}
      />
    </div>
  );
}

export default function App() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const [mode, setMode] = useState(function() {
    try { return localStorage.getItem("spec_tab_mode") || "spec"; } catch(e) { return "spec"; }
  });

  function switchMode(m) {
    setMode(m);
    try { localStorage.setItem("spec_tab_mode", m); } catch(e) {}
  }

  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
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
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
                {user && (
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{user.primaryEmailAddress?.emailAddress}</span>
                )}
                <button
                  onClick={() => signOut()}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", color: "#6b635c" }}
                  title="Sign out">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b635c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b635c" }}>Sign out</span>
                </button>
              </div>
            </div>
          </div>
          <Suspense fallback={<Spinner />}>
            {mode === "spec"   && <ElementorBuilder />}
            {mode === "custom" && <CustomBuild />}
          </Suspense>
        </div>
      </SignedIn>
    </>
  );
}
