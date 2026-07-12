import { useState, useEffect, useCallback } from "react";
import { authHeaders, formatErrorMessage } from "../utils/api.js";
import ColorSwatch from "./components/ColorSwatch.jsx";
import FontCard from "./components/FontCard.jsx";
import SavedLibrary from "./components/SavedLibrary.jsx";
import StyleDocument from "./components/StyleDocument.jsx";
import { parseStyleGuideHtml } from "./utils/export.js";
import { ConfirmDialog } from "../components/ConfirmDialog.jsx";

// Spec's 8 template color roles <-> the fixed keys brand_styles actually
// stores (see api/brand-styles.js's COLOR_KEYS). Custom/"Additional"
// colors are NOT part of this map on purpose -- see the note above
// saveToLibrary() below for why they don't persist to the library yet.
const ROLE_TO_KEY = {
  "Heading": "ink", "Body text": "text", "Accent": "brass", "Accent — hover": "brass-deep",
  "Background": "bone", "Dark panel": "asphalt", "Muted": "stone", "Text on dark": "warm-white",
};
const KEY_TO_ROLE = Object.fromEntries(Object.entries(ROLE_TO_KEY).map(([role, key]) => [key, role]));

function colorsToKeyedObject(colors) {
  const out = {};
  for (const c of colors) {
    if (!c.custom && ROLE_TO_KEY[c.role] && c.hex) out[ROLE_TO_KEY[c.role]] = c.hex;
  }
  return out;
}

function keyedObjectToColors(obj) {
  return Object.entries(obj || {})
    .filter(([key]) => KEY_TO_ROLE[key])
    .map(([key, hex]) => ({ role: KEY_TO_ROLE[key], hex, confidence: "confirmed", custom: false }));
}

function fontsToKeyedObject(fonts) {
  const heading = fonts.find(f => f.role === "Heading");
  const body = fonts.find(f => f.role === "Body");
  return { heading: heading?.name || "", body: body?.name || "" };
}

function keyedObjectToFonts(obj) {
  const out = [];
  if (obj?.heading) out.push({ role: "Heading", name: obj.heading, confidence: "confirmed", custom: false });
  if (obj?.body) out.push({ role: "Body", name: obj.body, confidence: "confirmed", custom: false });
  return out;
}

export default function StyleGuide({ role }) {
  const [url, setUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [colors, setColors] = useState([]);
  const [fonts, setFonts] = useState([]);
  const [sourceUrl, setSourceUrl] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStatus, setAnalyzeStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [savedStyles, setSavedStyles] = useState([]);
  const [loadingStyles, setLoadingStyles] = useState(true);

  const [view, setView] = useState("edit"); // "edit" | "document"
  const [documentSource, setDocumentSource] = useState(null); // the style shown when view === "document"
  const [pendingClear, setPendingClear] = useState(null); // "all" | "colors" | "fonts" | null -- drives the confirm dialog below

  const loadSavedStyles = useCallback(async () => {
    setLoadingStyles(true);
    try {
      const res = await fetch("/api/brand-styles", { headers: await authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSavedStyles(data.styles || []);
      }
    } catch {
      // Saved-styles list is a convenience view, not required for the
      // rest of the tab to work -- fail quietly rather than blocking the
      // whole page over a list that can just be refreshed later.
    }
    setLoadingStyles(false);
  }, []);

  useEffect(() => { loadSavedStyles(); }, [loadSavedStyles]);

  async function analyzeUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setAnalyzing(true);
    setAnalyzeStatus("");
    try {
      const res = await fetch("/api/extract-style", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setColors((data.colors || []).map(c => ({ ...c, custom: false })));
        setFonts((data.fonts || []).map(f => ({ ...f, custom: false })));
        if (data.brandNameGuess && !brandName) setBrandName(data.brandNameGuess);
        setSourceUrl(data.origin || trimmed);
        setAnalyzeStatus(`Found ${data.colors?.length || 0} colors, ${data.fonts?.length || 0} fonts.`);
      } else {
        setAnalyzeStatus(formatErrorMessage(role, res.status, data.error, "Couldn't analyze that site — try again."));
      }
    } catch (e) {
      setAnalyzeStatus(formatErrorMessage(role, null, e.message, "Couldn't analyze that site — try again."));
    }
    setAnalyzing(false);
  }

  // Only supports re-importing a Spec-generated HTML export in this pass
  // -- reading the hidden data block back out, which is free and exact.
  // Reading an arbitrary PDF or image from somewhere else needs Claude to
  // actually look at it, which is a real (if small) cost per upload and a
  // separate, deliberate addition rather than something to fold in here
  // silently.
  async function handleFileUpload(file) {
    setUploadStatus("Reading…");
    try {
      const text = await file.text();
      const parsed = parseStyleGuideHtml(text);
      if (!parsed) {
        setUploadStatus("That doesn't look like a Style Guide exported from Spec. Uploading a style guide from elsewhere isn't supported yet.");
        return;
      }
      setBrandName(parsed.brandName || "");
      setColors(Array.isArray(parsed.colors) ? parsed.colors : []);
      setFonts(Array.isArray(parsed.fonts) ? parsed.fonts : []);
      setSourceUrl(parsed.sourceUrl || "");
      setUploadStatus("Loaded from " + file.name + ".");
    } catch (e) {
      setUploadStatus(formatErrorMessage(role, null, e.message, "Couldn't read that file."));
    }
  }

  function updateColor(index, updated) {
    setColors(cs => cs.map((c, i) => i === index ? updated : c));
  }
  function removeColor(index) {
    setColors(cs => cs.filter((_, i) => i !== index));
  }
  function addColor() {
    setColors(cs => [...cs, { custom: true, hex: "#6B6B6B", name: "", usage: "" }]);
  }

  function updateFont(index, updated) {
    setFonts(fs => fs.map((f, i) => i === index ? updated : f));
  }
  function removeFont(index) {
    setFonts(fs => fs.filter((_, i) => i !== index));
  }
  function addFont() {
    setFonts(fs => [...fs, { custom: true, role: "", name: "", confidence: "confirmed" }]);
  }

  // Clearing an analyzed/edited section is real potential data loss --
  // re-typing 8 colors by hand isn't "trivial" the way removing one row
  // is (which is why individual swatch/font removal above doesn't
  // confirm) -- so these three go through the same ConfirmDialog every
  // other real data-loss action in this app already uses.
  function requestClearAll() { setPendingClear("all"); }
  function requestClearColors() { setPendingClear("colors"); }
  function requestClearFonts() { setPendingClear("fonts"); }

  function confirmClear() {
    if (pendingClear === "all") {
      setBrandName(""); setUrl(""); setColors([]); setFonts([]); setSourceUrl("");
      setAnalyzeStatus(""); setUploadStatus(""); setSaveStatus("");
    } else if (pendingClear === "colors") {
      setColors([]);
    } else if (pendingClear === "fonts") {
      setFonts([]);
    }
    setPendingClear(null);
  }

  const clearDialogCopy = {
    all: { title: "Start a new style guide?", message: "This clears the brand name, colors, and fonts on this page. Anything already saved to the library is unaffected.", confirmLabel: "Start new" },
    colors: { title: "Clear all colors?", message: "Removes every color shown here, including anything found by analyzing a site. This only affects this page -- nothing saved to the library is touched.", confirmLabel: "Clear colors" },
    fonts: { title: "Clear all fonts?", message: "Removes every font shown here. This only affects this page -- nothing saved to the library is touched.", confirmLabel: "Clear fonts" },
  };

  // Custom ("Additional colors") entries and any font beyond Heading/Body
  // don't have a place to live in brand_styles yet -- COLOR_KEYS there is
  // a fixed 8-slot allowlist by design, and fonts is just {heading, body}.
  // They still work for the document/exports generated from THIS session,
  // they just don't round-trip through the saved library until that
  // schema grows to support them. Flagged in the save status rather than
  // silently dropping them with no explanation.
  async function saveToLibrary() {
    if (!brandName.trim()) {
      setSaveStatus("Add a brand name first.");
      return;
    }
    setSaveStatus("Saving…");
    const droppedCustomColors = colors.filter(c => c.custom).length;
    const droppedExtraFonts = Math.max(0, fonts.filter(f => !f.custom).length - 2) + fonts.filter(f => f.custom).length;
    try {
      const res = await fetch("/api/brand-styles", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          brand_name: brandName.trim(),
          colors: colorsToKeyedObject(colors),
          fonts: fontsToKeyedObject(fonts),
          source_url: sourceUrl || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const note = droppedCustomColors > 0
          ? ` (${droppedCustomColors} custom color${droppedCustomColors > 1 ? "s" : ""} shown here isn't saved to the library yet — still in this session's document/exports.)`
          : "";
        setSaveStatus(`Saved as ${data.brand_name}'s style guide.${note}`);
        loadSavedStyles();
      } else {
        setSaveStatus(formatErrorMessage(role, res.status, data.error, "Couldn't save — try again."));
      }
    } catch (e) {
      setSaveStatus(formatErrorMessage(role, null, e.message, "Couldn't save — try again."));
    }
    setTimeout(() => setSaveStatus(""), 8000);
  }

  function applyStyle(style) {
    setBrandName(style.brand_name);
    setColors(keyedObjectToColors(style.colors));
    setFonts(keyedObjectToFonts(style.fonts));
    setSourceUrl(style.source_url || "");
    setSaveStatus(`Loaded ${style.brand_name}'s style guide for editing.`);
    setTimeout(() => setSaveStatus(""), 4000);
  }

  function viewStyle(style) {
    setDocumentSource({
      brandName: style.brand_name,
      sourceUrl: style.source_url,
      colors: keyedObjectToColors(style.colors),
      fonts: keyedObjectToFonts(style.fonts),
    });
    setView("document");
  }

  if (view === "document" && documentSource) {
    return (
      <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 64px" }}>
        <button onClick={() => setView("edit")} style={{ ...secondaryBtn, marginBottom: "20px" }}>← Back to Style Guide</button>
        <StyleDocument {...documentSource} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "32px 24px 64px", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 4px" }}>Style guide</h1>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 28px" }}>
            Pull real colors and fonts from any live site, or build one from scratch. Saved guides are reusable across Brief to Blueprint and Template Studio.
          </p>
        </div>
        <button onClick={requestClearAll} style={{ ...secondaryBtn, flexShrink: 0, whiteSpace: "nowrap" }}>+ New style guide</button>
      </div>

      <Card>
        <CardLabel>Brand name</CardLabel>
        <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Glow Society" style={nameInput} />
      </Card>

      <Card>
        <CardLabel>Website URL</CardLabel>
        <div style={{ display: "flex", gap: "10px" }}>
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && analyzeUrl()} placeholder="https://example.com" style={urlInput} />
          <button onClick={analyzeUrl} disabled={analyzing} style={primaryBtn}>{analyzing ? "Analyzing…" : "Analyze site"}</button>
        </div>
        {analyzeStatus && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: analyzeStatus.startsWith("Found") ? "#2F6E3E" : "#B45309", background: analyzeStatus.startsWith("Found") ? "#E8F3E9" : "#FEF3E2", padding: "5px 10px", borderRadius: "20px", marginTop: "12px", fontWeight: 500 }}>
            {analyzeStatus.startsWith("Found") ? "✓ " : ""}{analyzeStatus}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#DDE0E6" }} />
          <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "#DDE0E6" }} />
        </div>

        <label style={{ border: "1.5px dashed #DDE0E6", borderRadius: "8px", padding: "18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 2px" }}>Upload a style guide</p>
            <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>
              {uploadStatus || "A Spec export (.html) reloads instantly and free."}
            </p>
          </div>
          <input type="file" accept=".html" style={{ display: "none" }} onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
          <span style={{ ...secondaryBtn, flexShrink: 0 }}>Choose file</span>
        </label>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <CardLabel noMargin>Colors {colors.length > 0 ? `(${colors.length})` : ""}</CardLabel>
          {colors.length > 0 && <button onClick={requestClearColors} style={clearLink}>Clear colors</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {colors.map((c, i) => (
            <ColorSwatch key={i} color={c} onChange={updated => updateColor(i, updated)} onRemove={() => removeColor(i)} />
          ))}
          <button onClick={addColor} style={addTile}>
            <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
            <span>Add color</span>
          </button>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <CardLabel noMargin>Fonts {fonts.length > 0 ? `(${fonts.length})` : ""}</CardLabel>
          {fonts.length > 0 && <button onClick={requestClearFonts} style={clearLink}>Clear fonts</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
          {fonts.map((f, i) => (
            <FontCard key={i} font={f} onChange={updated => updateFont(i, updated)} onRemove={() => removeFont(i)} />
          ))}
          <button onClick={addFont} style={{ ...addTile, minHeight: "100px" }}>
            <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
            <span>Add font</span>
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={saveToLibrary} style={primaryBtn}>Save to library</button>
          {saveStatus && <span style={{ fontSize: "12px", color: "#6B7280" }}>{saveStatus}</span>}
        </div>
      </Card>

      {colors.length + fonts.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
          background: "#FEF3E2", border: "1px solid #FBEBD1", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px",
        }}>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 2px", color: "#09090B" }}>See it as a real document</p>
            <p style={{ fontSize: "11px", color: "#6B7280", margin: 0 }}>Brand name, swatches, and full type specimens on one shareable page.</p>
          </div>
          <button
            onClick={() => { setDocumentSource({ brandName, sourceUrl, colors, fonts }); setView("document"); }}
            style={{ ...primaryBtn, flexShrink: 0 }}
          >
            View brand sheet
          </button>
        </div>
      )}

      <SavedLibrary
        styles={savedStyles}
        loading={loadingStyles}
        onApply={applyStyle}
        onView={viewStyle}
        onDownload={viewStyle}
      />

      <ConfirmDialog
        open={!!pendingClear}
        title={pendingClear ? clearDialogCopy[pendingClear].title : ""}
        message={pendingClear ? clearDialogCopy[pendingClear].message : ""}
        confirmLabel={pendingClear ? clearDialogCopy[pendingClear].confirmLabel : "Clear"}
        onConfirm={confirmClear}
        onCancel={() => setPendingClear(null)}
      />
    </div>
  );
}

function Card({ children }) {
  return <div style={{ background: "#fff", border: "1px solid #DDE0E6", borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>{children}</div>;
}
function CardLabel({ children, noMargin }) {
  return <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7280", margin: noMargin ? 0 : "0 0 14px" }}>{children}</p>;
}

const nameInput = { flex: 1, height: "38px", padding: "0 14px", border: "1px solid #DDE0E6", borderRadius: "6px", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "14px", fontWeight: 600, color: "#09090B", width: "100%", boxSizing: "border-box" };
const urlInput = { flex: 1, height: "38px", padding: "0 14px", border: "1px solid #DDE0E6", borderRadius: "6px", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "13px", color: "#09090B" };
const primaryBtn = { height: "38px", padding: "0 18px", background: "#B45309", color: "#fff", border: "none", borderRadius: "6px", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" };
const secondaryBtn = { height: "38px", padding: "0 18px", background: "#fff", color: "#6B635C", border: "1px solid #DDE0E6", borderRadius: "6px", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center" };
const addTile = { border: "1.5px dashed #DDE0E6", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "120px", cursor: "pointer", color: "#6B7280", fontSize: "13px", fontWeight: 600, flexDirection: "column", gap: "6px", background: "transparent", fontFamily: "'Be Vietnam Pro', sans-serif" };
const clearLink = { background: "none", border: "none", color: "#B45309", fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline" };
