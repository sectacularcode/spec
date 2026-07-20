import { useState, useEffect, lazy, Suspense } from "react";
import { SignIn, SignedIn, SignedOut, useUser, UserButton } from "@clerk/clerk-react";
import Dashboard from "./components/Dashboard.jsx";
import { authHeaders } from "./utils/api.js";

const ElementorBuilder = lazy(() => import("./template-studio/index.jsx"));
const CustomBuild      = lazy(() => import("./brief-to-blueprint/index.jsx"));
const StyleGuide       = lazy(() => import("./style-guide/index.jsx"));
const Brands           = lazy(() => import("./brands/index.jsx"));
const DesignSystem     = lazy(() => import("./design-system/index.jsx"));

function Spinner() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading…</div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#eeedf1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b", marginBottom: "24px" }}>
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

function ToolNav({ view, setView, tools, role, user }) {
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
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.04em", color: "#09090b", lineHeight: 1 }}>
            spec<span style={{ color: "#b45309" }}>.</span>
          </div>
          <div style={{ fontSize: "9px", color: "#ffffff", padding: "2px 6px", background: "#b45309", borderRadius: "6px", letterSpacing: "0.04em", fontWeight: 500 }}>beta</div>
        </div>

        {/* Center — tool tabs */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center" }}>
          {[
            tools.includes("template-studio") && { id: "template-studio", label: "Template Studio" },
            tools.includes("brief-to-blueprint") && { id: "brief-to-blueprint", label: "Brief to Blueprint" },
            // Shared utility for both tools, not its own gated permission --
            // available whenever either main tool is, positioned after
            // Brief to Blueprint since it's an "extra" tool rather than a
            // step used in between the other two.
            (tools.includes("template-studio") || tools.includes("brief-to-blueprint")) && { id: "style-guide", label: "Style Guide" },
            // Admin only for now, same role check pattern api/brands.js
            // itself uses -- not gated by the `tools` array since it isn't
            // a per-user permission like the other three, it's a shared
            // team resource.
            role === "admin" && { id: "brands", label: "Component Library" },
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

  // ?tool= in the URL takes priority over localStorage so a shared/bookmarked
  // link opens the right tool. ?build= (used by Brief to Blueprint's own deep
  // links) implies the tool too, as a fallback in case a link only has
  // ?build= without an explicit ?tool= -- keeps older-style links working.
  const [view, setViewRaw] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("tool") || (params.get("build") ? "brief-to-blueprint" : null);
      if (fromUrl) return fromUrl;
    } catch {}
    try { return localStorage.getItem("spec_app_view") || "dashboard"; } catch { return "dashboard"; }
  });

  function setView(v) {
    setViewRaw(v);
    try { localStorage.setItem("spec_app_view", v); } catch {}
    // Keep the URL's ?tool= in sync so switching tools stays shareable/
    // bookmarkable too. Dashboard is the default landing view, so it's left
    // out of the URL to keep the bare specish.com link clean; switching away
    // from a sub-tool's build/page also clears those params since they no
    // longer apply.
    try {
      const url = new URL(window.location.href);
      if (v === "dashboard") {
        url.searchParams.delete("tool");
        url.searchParams.delete("build");
        url.searchParams.delete("page");
      } else {
        url.searchParams.set("tool", v);
        if (v !== "brief-to-blueprint") {
          url.searchParams.delete("build");
          url.searchParams.delete("page");
        }
      }
      window.history.replaceState({}, "", url);
    } catch {}
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

  if (view === "template-studio" || view === "brief-to-blueprint" || view === "style-guide" || view === "brands" || view === "design-system") {
    return (
      <div style={{ width: "100%", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", boxSizing: "border-box" }}>
        <ToolNav view={view} setView={setView} tools={tools} role={role} user={user} />
        <Suspense fallback={<Spinner />}>
          {view === "template-studio"    && <ElementorBuilder userId={user?.id} />}
          {view === "brief-to-blueprint" && <CustomBuild userId={user?.id} role={role} />}
          {view === "style-guide"        && <StyleGuide role={role} />}
          {view === "brands"             && <Brands />}
          {view === "design-system"      && <DesignSystem />}
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
