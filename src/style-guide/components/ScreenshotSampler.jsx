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

const MAX_DISPLAY_WIDTH = 900; // caps the image's BUFFER size on load, not
                                 // its on-screen size -- keeps memory/canvas
                                 // cost sane on huge screenshots while zoom
                                 // (below) handles on-screen precision.

const ZOOM_LEVELS = [1, 1.5, 2, 3, 4, 6, 8]; // multiples of the fitted buffer size

export default function ScreenshotSampler({ onSample }) {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [bufferSize, setBufferSize] = useState({ width: 0, height: 0 });
  const [zoomIndex, setZoomIndex] = useState(0);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Every click adds to this queue instead of firing onSample immediately,
  // so a person can sample several colors from the image in a row -- all
  // reviewed and role-assigned right here -- then push them to the Colors
  // grid up top in one shot, instead of round-tripping to the top of the
  // page and back for every single color.
  const [pendingList, setPendingList] = useState([]); // [{ id, hex, role }]

  const zoom = ZOOM_LEVELS[zoomIndex];

  // The canvas is ALWAYS mounted (visibility toggled via CSS, never
  // conditionally rendered) so canvasRef.current is guaranteed to exist
  // by the time an image finishes loading -- see handleFile below.
  // Previously the canvas only rendered once imageLoaded was true, which
  // meant the very first image on a fresh mount had nowhere to draw into:
  // canvasRef.current was null, the draw step bailed out silently, and
  // imageLoaded never flipped true. Selecting a file looked like it did
  // nothing.
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
        if (!canvas) {
          setError("Couldn't prepare the canvas for that image -- try again.");
          return;
        }
        // The canvas's pixel BUFFER is capped at MAX_DISPLAY_WIDTH so we're
        // not holding a giant retina screenshot in memory. On-screen size
        // is controlled separately via CSS width/height driven by `zoom`,
        // so zooming in never touches or re-reads the source image.
        const fitScale = Math.min(1, MAX_DISPLAY_WIDTH / img.width);
        const w = Math.round(img.width * fitScale);
        const h = Math.round(img.height * fitScale);
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        setBufferSize({ width: w, height: h });
        setImageLoaded(true);
        setZoomIndex(0);
        setPendingList([]);
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
    // rect reflects the CURRENT on-screen size, which changes with zoom;
    // canvas.width/height is the fixed pixel buffer set on load. Scaling
    // the click point by that ratio keeps the sampled pixel accurate at
    // any zoom level, including zoomed-in clicks on a single-pixel-wide
    // font stroke that would be impossible to hit at 100%.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.min(canvas.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
    const py = Math.min(canvas.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)));
    const ctx = canvas.getContext("2d");
    const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
    const hex = "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase();

    setPendingList(list => {
      const usedRoles = new Set(list.map(p => p.role));
      const nextRole = TEMPLATE_ROLES.find(role => !usedRoles.has(role)) || "Custom";
      return [...list, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, hex, role: nextRole }];
    });
  }

  function updatePendingRole(id, role) {
    setPendingList(list => list.map(p => (p.id === id ? { ...p, role } : p)));
  }

  function removePending(id) {
    setPendingList(list => list.filter(p => p.id !== id));
  }

  function confirmAddAll() {
    if (pendingList.length === 0) return;
    pendingList.forEach(p => onSample(p.hex, p.role));
    setPendingList([]);
  }

  function reset() {
    setImageLoaded(false);
    setFileName("");
    setBufferSize({ width: 0, height: 0 });
    setZoomIndex(0);
    setPendingList([]);
    setError("");
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function zoomIn() {
    setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  }
  function zoomOut() {
    setZoomIndex(i => Math.max(0, i - 1));
  }
  function resetZoom() {
    setZoomIndex(0);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }
  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  }

  const displayWidth = Math.round(bufferSize.width * zoom);
  const displayHeight = Math.round(bufferSize.height * zoom);

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
        Upload a screenshot, a design export, or a photo of a brand guide. Zoom in to click precisely, sample as many colors as you want, then add them all at once.
      </p>

      {/* Dropzone: hidden via CSS once an image is loaded, never unmounted
          mid-flow so drag state and the file input stay stable. */}
      <div style={{ display: imageLoaded ? "none" : "block" }}>
        <label
          style={{ ...dropZone, ...(isDragging ? dropZoneActive : {}) }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={e => handleFile(e.target.files?.[0])}
            style={{ display: "none" }}
          />
          <span style={{ fontSize: "20px", lineHeight: 1 }}>+</span>
          <span>{isDragging ? "Drop it here" : "Choose an image, or drag one in"}</span>
        </label>
      </div>

      {/* Canvas is ALWAYS in the DOM -- just hidden until an image is
          loaded -- so the ref is available the first time handleFile runs. */}
      <div style={{ display: imageLoaded ? "block" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <button onClick={zoomOut} disabled={zoomIndex === 0} style={{ ...ghostBtn, ...zoomBtnStyle, opacity: zoomIndex === 0 ? 0.4 : 1 }}>−</button>
          <span style={{ fontSize: "12px", color: "#6B7280", minWidth: "42px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} style={{ ...ghostBtn, ...zoomBtnStyle, opacity: zoomIndex === ZOOM_LEVELS.length - 1 ? 0.4 : 1 }}>+</button>
          {zoomIndex > 0 && <button onClick={resetZoom} style={clearLink}>Reset zoom</button>}
          <span style={{ fontSize: "11px", color: "#B0B0B0", marginLeft: "auto" }}>Zoom in for thin text or small details</span>
        </div>

        <div style={{ overflow: "auto", maxHeight: "480px", border: "1px solid #DDE0E6", borderRadius: "6px", background: "#F5F5F5" }}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ display: "block", cursor: "crosshair", width: displayWidth ? `${displayWidth}px` : "auto", height: displayHeight ? `${displayHeight}px` : "auto" }}
          />
        </div>
        <p style={{ fontSize: "11px", color: "#B0B0B0", margin: "8px 0 0" }}>{fileName}</p>

        {pendingList.length > 0 && (
          <div style={{ marginTop: "14px", padding: "12px 14px", background: "#FEF3E2", border: "1px solid #FBEBD1", borderRadius: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#09090B" }}>
                {pendingList.length} color{pendingList.length === 1 ? "" : "s"} sampled
              </span>
              <button onClick={() => setPendingList([])} style={ghostBtn}>Clear all</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
              {pendingList.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: p.hex, border: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Inter', monospace", fontSize: "12px", fontWeight: 600, color: "#09090B", width: "70px", flexShrink: 0 }}>{p.hex}</span>
                  <select
                    value={p.role}
                    onChange={e => updatePendingRole(p.id, e.target.value)}
                    style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                  >
                    {TEMPLATE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                    <option value="Custom">Custom color</option>
                  </select>
                  <button onClick={() => removePending(p.id)} style={ghostBtn}>✕</button>
                </div>
              ))}
            </div>

            <button onClick={confirmAddAll} style={{ ...primaryBtn, width: "100%" }}>
              Add {pendingList.length} color{pendingList.length === 1 ? "" : "s"} to grid
            </button>
          </div>
        )}
      </div>

      {error && <p style={{ fontSize: "12px", color: "#C93939", margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}

const dropZone = {
  border: "1.5px dashed #DDE0E6", borderRadius: "8px", display: "flex", alignItems: "center",
  justifyContent: "center", minHeight: "120px", cursor: "pointer", color: "#6B7280", fontSize: "13px",
  fontWeight: 600, flexDirection: "column", gap: "6px", background: "transparent",
  fontFamily: "'Be Vietnam Pro', sans-serif", transition: "border-color 0.12s, background 0.12s",
};
const dropZoneActive = {
  borderColor: "#B45309", background: "#FEF3E2", color: "#B45309",
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
const zoomBtnStyle = {
  border: "1px solid #DDE0E6", borderRadius: "6px", width: "28px", height: "28px", padding: 0,
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px",
};
const clearLink = {
  background: "none", border: "none", color: "#B45309", fontFamily: "'Be Vietnam Pro', sans-serif",
  fontSize: "11px", fontWeight: 600, cursor: "pointer", padding: 0, textDecoration: "underline",
};
