import { useState, useEffect, lazy, Suspense } from "react";
import { SignIn, SignedIn, SignedOut, useUser, UserButton } from "@clerk/clerk-react";
import Dashboard from "./components/Dashboard.jsx";
import { authHeaders } from "./utils/api.js";

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

function ToolNav({ view, setView, tools, user }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#ffffff", borderBottom: "1px solid #e5e7eb", width: "100%", boxSizing: "border-box" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", padding: "0 24px", boxSizing: "border-box", position: "relative", height: "48px" }}>

        {/* Left — back arrow + logo (separate so logo click doesnt navigate) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "auto" }}>
          <button
            onClick={() => setView("dashboard")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", display: "flex", alignItems: "center", color: "#6b7280", borderRadius: "4px" }}
            title="Back to dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b", lineHeight: 1 }}>
            spec<span style={{ color: "#b45309" }}>.</span>
          </div>
          <div style={{ fontSize: "9px", color: "#ffffff", padding: "2px 6px", background: "#b45309", borderRadius: "6px", letterSpacing: "0.04em", fontWeight: 500 }}>beta</div>
        </div>

        {/* Center — tool tabs */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center" }}>
          {[
            tools.includes("template-studio") && { id: "template-studio", label: "Template Studio" },
            tools.includes("brief-to-blueprint") && { id: "brief-to-blueprint", label: "Brief to Blueprint" },
          ].filter(Boolean).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setView(tab.id);
                if (tab.id === "template-studio") window.dispatchEvent(new Event("spec-go-projects"));
              }}
              style={{ padding: "18px 16px", fontSize: "13px", fontWeight: view === tab.id ? 700 : 500, color: view === tab.id ? "#09090b" : "#6b7280", background: "transparent", border: "none", cursor: "pointer", borderBottom: view === tab.id ? "2px solid #09090b" : "2px solid transparent", whiteSpace: "nowrap" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right — email + user profile button */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          {user && <span style={{ fontSize: "12px", color: "#6b7280" }}>{user.primaryEmailAddress?.emailAddress}</span>}
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: "28px", height: "28px" },
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user } = useUser();

  const [view, setViewRaw] = useState(() => {
    try { return localStorage.getItem("spec_app_view") || "dashboard"; } catch(e) { return "dashboard"; }
  });

  function setView(v) {
    setViewRaw(v);
    try { localStorage.setItem("spec_app_view", v); } catch(e) {}
  }
  const [role, setRole]             = useState("staff");
  const [tools, setTools]           = useState(["template-studio", "brief-to-blueprint"]);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch("/api/user-role", { headers: await authHeaders() });
        const d = await res.json();
        setRole(d.role || "staff");
        setTools(d.tools || ["template-studio", "brief-to-blueprint"]);
      } catch {
        // keep defaults
      }
      setRoleLoaded(true);
    })();
  }, [user]);

  if (!roleLoaded) return <Spinner />;

  if (view === "template-studio" || view === "brief-to-blueprint") {
    return (
      <div style={{ width: "100%", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}>
        <ToolNav view={view} setView={setView} tools={tools} user={user} />
        <Suspense fallback={<Spinner />}>
          {view === "template-studio"    && <ElementorBuilder userId={user?.id} />}
          {view === "brief-to-blueprint" && <CustomBuild userId={user?.id} role={role} />}
        </Suspense>
      </div>
    );
  }

  return (
    <Dashboard
      role={role}
      tools={tools}
      onSelectTool={(toolId) => setView(toolId)}
    />
  );
}

export default function App() {
  return (
    <>
      <SignedOut>
        <LoginScreen />
      </SignedOut>
      <SignedIn>
        <AppShell />
      </SignedIn>
    </>
  );
}
