// Upload any image -- a screenshot, a Figma export, a photo of a printed
// brand guide -- and click anywhere on it to read off the actual color at
// that pixel. This exists because CSS-text extraction (extract-style.js)
// has a real ceiling: modern sites increasingly encode color through
// Tailwind utility classes or CSS variables built from separate RGB/HSL
// channel numbers, neither of which ever appears as a literal hex string
// in the stylesheet for a regex to find. Confirmed against two real sites
// (jpmorganchase.com, superside.com/blog) where a real, prominent brand
// color -- including a site's actual body-text color -- was completely
// invisible to the CSS approach. Sampling a pixel doesn't care how the
// color got there; it only cares what's actually on screen, which is the
// one thing that's always true regardless of the underlying CSS method.
//
// Deliberately entirely client-side: no upload endpoint, no third-party
// screenshot API, no per-use cost. The person already has (or can take)
// the image; this just reads pixels out of it.

import { useRef, useState, useCallback } from "react";

const TEMPLATE_ROLES = [
  "Heading", "Body text", "Accent", "Accent — hover",
  "Background", "Dark panel", "Muted", "Text on dark",
];

const MAX_DISPLAY_WIDTH = 900; // keeps large screenshots from overflowing
                                 // the panel; still plenty of resolution
                                 // to click individual UI elements precisely

export default function ScreenshotSampler({ onSample }) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pending, setPending] = useState(null); // { hex, role } | null -- the most recent click, not yet added
  const [error, setError] = useState("");

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image file.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // The canvas's own pixel buffer IS the displayed size here (no
        // separate CSS scale factor to track) -- simplest way to keep
        // click coordinates and pixel data in the same space.
        const scale = Math.min(1, MAX_DISPLAY_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setImageLoaded(true);
        setPending(null);
      };
      img.onerror = () => setError("Couldn't load that image -- try a different file.");
      img.src = reader.result;
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
    setFileName(file.name);
  }, []);

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // rect can differ from the canvas's own pixel buffer if CSS further
    // constrains its display width -- scaling the click point back into
    // buffer space keeps the sampled pixel accurate either way.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.floor((e.clientX - rect.left) * scaleX);
    const py = Math.floor((e.clientY - rect.top) * scaleY);
    const ctx = canvas.getContext("2d");
    const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
    const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();
    setPending({ hex, role: pending?.role || "Accent" });
  }

  function confirmAdd() {
    if (!pending) return;
    onSample(pending.hex, pending.role);
    setPending(null);
  }

  function reset() {
    setImageLoaded(false);
    setFileName("");
    setPending(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #DDE0E6", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B7280", margin: 0 }}>
          Sample colors from an image
        </p>
        {imageLoaded && (
          <button onClick={reset} style={clearLink}>Choose a different image</button>
        )}
      </div>
      <p style={{ fontSize: "12px", color: "#6B7280", margin: "0 0 14px" }}>
        Upload a screenshot, a design export, or a photo of a brand guide, then click anywhere on it to pick up the exact color at that spot.
      </p>

      {!imageLoaded ? (
        <label style={dropZone}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={e => handleFile(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
          <span>Choose an image</span>
        </label>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ maxWidth: "100%", height: "auto", display: "block", borderRadius: "6px", border: "1px solid #DDE0E6", cursor: "crosshair" }}
          />
          <p style={{ fontSize: "11px", color: "#B0B0B0", margin: "8px 0 0" }}>{fileName}</p>

          {pending && (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px", marginTop: "14px",
              padding: "12px 14px", background: "#FEF3E2", border: "1px solid #FBEBD1", borderRadius: "8px",
            }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: pending.hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
              <span style={{ fontFamily: "'Inter', monospace", fontSize: "13px", fontWeight: 600, color: "#09090B" }}>{pending.hex}</span>
              <select
                value={pending.role}
                onChange={e => setPending(p => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyle, width: "auto", flex: 1, marginBottom: 0 }}
              >
                {TEMPLATE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                <option value="Custom">Custom color</option>
              </select>
              <button onClick={confirmAdd} style={primaryBtn}>Add</button>
              <button onClick={() => setPending(null)} style={ghostBtn}>Cancel</button>
            </div>
          )}
        </>
      )}

      {error && <p style={{ fontSize: "12px", color: "#C93939", margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}

const dropZone = {
  border: "1.5px dashed #DDE0E6", borderRadius: "8px", display: "flex", alignItems: "center",
  justifyContent: "center", minHeight: "120px", cursor: "pointer", color: "#6B7280", fontSize: "13px",
  fontWeight: 600, flexDirection: "column", gap: "6px", background: "transparent",
  fontFamily: "'Be Vietnam Pro', sans-serif",
};
const inputStyle = {
  fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "12px", color: "#09090B",
  border: "1px solid #DDE0E6", borderRadius: "4px", padding: "6px 8px", background: "#fff",
};
const primaryBtn = {
  height: "30px", padding: "0 14px", background: "#B45309", color: "#fff", border: "none", borderRadius: "6px",
  fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
};
const ghostBtn = {
  height: "30px", padding: "0 12px", background: "transparent", color: "#6B7280", border: "none",
  fontFamily: "'Be Vietnam Pro', sans-serif", fontSize: "12px", fontWeight: 600, cursor: "pointer",
};
const clearLink = {
  background: "none", border: "none", color: "#B45309", fontFamily: "'Be Vietnam Pro', sans-serif",
  fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline",
};
