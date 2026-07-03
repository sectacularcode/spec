import { useState, useRef } from "react";
import { authHeaders } from "../../utils/api.js";

// BulkLocationModal
// Opens from a dedicated "Bulk Location Pages" button in Brief to Blueprint.
// Two entry paths:
//   1. Fill in locations manually (add as many as needed before generating)
//   2. Upload a pre-filled location brief DOCX/JSON
// After entry, a review screen shows all locations so you can verify before generating.
// On confirm, calls onGenerate(locations) which triggers page generation in the parent.

const EMPTY_LOC = {
  locationName: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  hours: "",
  headline: "",
  intro: "",
  services: "",   // newline-separated
  mapEmbed: "",
  ctaText: "",
};

const S = {
  label: { display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" },
  hint:  { fontSize: "11px", color: "#9ca3af", marginBottom: "6px", lineHeight: 1.5 },
  input: { width: "100%", padding: "9px 12px", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "9px 12px", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box", resize: "vertical", fontFamily: "'Be Vietnam Pro', sans-serif", lineHeight: 1.6 },
  field: { marginBottom: "14px" },
};

function LocationCard({ loc, idx, onChange, onRemove, total }) {
  const set = (k, v) => onChange(idx, { ...loc, [k]: v });
  return (
    <div style={{ border: "1px solid #dde0e6", borderRadius: "10px", padding: "20px", background: "#fff", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#09090b" }}>Location {idx + 1}</div>
        {total > 1 && (
          <button onClick={() => onRemove(idx)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}>×</button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <div>
          <label style={S.label}>Location name</label>
          <input style={S.input} value={loc.locationName} onChange={e => set("locationName", e.target.value)} placeholder="e.g. Statesville Shop" />
        </div>
        <div>
          <label style={S.label}>City</label>
          <input style={S.input} value={loc.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Statesville" />
        </div>
        <div>
          <label style={S.label}>State</label>
          <input style={S.input} value={loc.state} onChange={e => set("state", e.target.value)} placeholder="e.g. NC" />
        </div>
      </div>

      <div style={S.field}>
        <label style={S.label}>Street address</label>
        <input style={S.input} value={loc.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 123 Main Street, City, ST 00000" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <div>
          <label style={S.label}>Phone</label>
          <input style={S.input} value={loc.phone} onChange={e => set("phone", e.target.value)} placeholder="e.g. (555) 000-0000" />
        </div>
        <div>
          <label style={S.label}>Hours</label>
          <input style={S.input} value={loc.hours} onChange={e => set("hours", e.target.value)} placeholder="e.g. M–F: 8am – 5pm" />
        </div>
      </div>

      <div style={S.field}>
        <label style={S.label}>Page headline <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — auto-generated if blank)</span></label>
        <input style={S.input} value={loc.headline} onChange={e => set("headline", e.target.value)} placeholder="e.g. [Your Service] in [City], [State] — leave blank to auto-generate" />
      </div>

      <div style={S.field}>
        <label style={S.label}>Intro paragraph <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <textarea rows={3} style={S.textarea} value={loc.intro} onChange={e => set("intro", e.target.value)} placeholder="Brief intro about this location — what you do here, who you serve." />
      </div>

      <div style={S.field}>
        <label style={S.label}>Services at this location <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(one per line)</span></label>
        <textarea rows={4} style={S.textarea} value={loc.services} onChange={e => set("services", e.target.value)} placeholder={"Diesel engine diagnostics\nBrake inspection and repair\nDOT compliance checks\nPreventative maintenance"} />
      </div>

      <div style={S.field}>
        <label style={S.label}>CTA button text <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
        <input style={S.input} value={loc.ctaText} onChange={e => set("ctaText", e.target.value)} placeholder="e.g. Request service" />
      </div>

      <div style={S.field}>
        <label style={S.label}>Map embed code <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional — paste Google Maps iframe)</span></label>
        <textarea rows={2} style={{ ...S.textarea, fontFamily: "monospace", fontSize: "11px" }} value={loc.mapEmbed} onChange={e => set("mapEmbed", e.target.value)} placeholder='<iframe src="https://www.google.com/maps/embed?..." width="100%" height="400" ...></iframe>' />
      </div>
    </div>
  );
}

function ReviewScreen({ locations, template, setTemplate, onBack, onConfirm }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>Review {locations.length} location{locations.length !== 1 ? "s" : ""}</div>
        <div style={{ fontSize: "13px", color: "#6b7280" }}>Verify each location before generating. Go back to edit any field.</div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={S.label}>Page template style</label>
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          {["A", "B"].map(v => (
            <label key={v} style={{ flex: 1, padding: "14px", border: template === v ? "2px solid #b45309" : "1px solid #dde0e6", borderRadius: "8px", cursor: "pointer", background: template === v ? "rgba(180,83,9,0.05)" : "#fff" }}>
              <input type="radio" name="template" value={v} checked={template === v} onChange={() => setTemplate(v)} style={{ display: "none" }} />
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#09090b", marginBottom: "4px" }}>
                {v === "A" ? "Content-heavy (SEO)" : "Conversion-first"}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.5 }}>
                {v === "A"
                  ? "Full hero, service checklist, supporting body, map, CTA. More text, built for ranking."
                  : "Hero with info below, compact services, map, fast CTA. Fewer words, higher conversion."}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {locations.map((loc, i) => (
          <div key={i} style={{ border: "1px solid #dde0e6", borderRadius: "8px", padding: "16px", background: "#fff" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#09090b", marginBottom: "8px" }}>
              {loc.locationName || "Location " + (i + 1)}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.7 }}>
              <div>{loc.city}{loc.state ? ", " + loc.state : ""}</div>
              {loc.address && <div>{loc.address}</div>}
              {loc.phone && <div>{loc.phone}</div>}
              {loc.hours && <div>{loc.hours}</div>}
            </div>
            {loc.services && (
              <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {loc.services.split("\n").filter(Boolean).slice(0, 3).map((s, j) => (
                  <span key={j} style={{ fontSize: "10px", padding: "2px 7px", background: "rgba(180,83,9,0.08)", color: "#b45309", borderRadius: "10px", whiteSpace: "nowrap" }}>{s}</span>
                ))}
                {loc.services.split("\n").filter(Boolean).length > 3 && (
                  <span style={{ fontSize: "10px", color: "#9ca3af" }}>+{loc.services.split("\n").filter(Boolean).length - 3} more</span>
                )}
              </div>
            )}
            {!loc.mapEmbed && (
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#f59e0b", fontWeight: 600 }}>⚠ No map embed — placeholder will be used</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button onClick={onBack} style={{ padding: "10px 20px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", color: "#6b7280", cursor: "pointer" }}>← Back to edit</button>
        <button onClick={onConfirm} style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 600, background: "#b45309", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
          Generate {locations.length} page{locations.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}

export function BulkLocationModal({ _brief, onClose, onGenerate, _userId }) {
  const [step, setStep] = useState("entry");   // "entry" | "review"
  const [locations, setLocations] = useState([{ ...EMPTY_LOC }]);
  const [template, setTemplate] = useState("A");
  const [uploadError, setUploadError] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef();

  function updateLoc(idx, val) {
    setLocations(prev => prev.map((l, i) => i === idx ? val : l));
  }
  function addLoc() {
    setLocations(prev => [...prev, { ...EMPTY_LOC }]);
  }
  function removeLoc(idx) {
    setLocations(prev => prev.filter((_, i) => i !== idx));
  }

  function parseLocationsFromJSON(data) {
    // Accept either array of location objects or {locations: [...]}
    var arr = Array.isArray(data) ? data : (data.locations || []);
    if (!arr.length) throw new Error("No locations found in file.");
    return arr.map(function(l) {
      return {
        locationName: l.locationName || l.name || "",
        city:         l.city || "",
        state:        l.state || "",
        address:      l.address || "",
        phone:        l.phone || "",
        hours:        l.hours || "",
        headline:     l.headline || "",
        intro:        l.intro || "",
        services:     Array.isArray(l.services) ? l.services.join("\n") : (l.services || ""),
        mapEmbed:     l.mapEmbed || l.map_embed || "",
        ctaText:      l.ctaText || l.cta || "",
      };
    });
  }

  async function handleFile(file) {
    if (!file) return;
    setUploadError("");
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "json") {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          const locs = parseLocationsFromJSON(data);
          setLocations(locs);
        } catch(err) {
          setUploadError("Could not parse JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    } else if (ext === "docx" || ext === "doc") {
      setParsing(true);
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const base64 = e.target.result.split(",")[1];
          const res = await fetch("/api/parse-brief", {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ content: base64, type: "docx", fileName: file.name, mode: "locations" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Parsing failed");
          // Server returns { locations: [...] }
          if (data.locations && data.locations.length) {
            setLocations(data.locations.map(l => ({
              locationName: l.locationName || "",
              city:         l.city || "",
              state:        l.state || "",
              address:      l.address || "",
              phone:        l.phone || "",
              hours:        l.hours || "",
              headline:     l.headline || "",
              intro:        l.intro || "",
              services:     Array.isArray(l.services) ? l.services.join("\n") : (l.services || ""),
              mapEmbed:     l.mapEmbed || "",
              ctaText:      l.ctaText || "",
            })));
          } else {
            throw new Error("No location data found in the document.");
          }
        } catch(err) {
          setUploadError("Could not parse the file: " + err.message);
        } finally {
          setParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setUploadError("Upload a JSON or DOCX file. Use the downloadable template to fill in location data.");
    }
  }

  function downloadTemplate() {
    // Generate a JSON template the team can fill out and upload back
    const template = {
      _note: "Fill in each location object and upload this file back into Spec to generate bulk location pages. Replace all placeholder values with real information for each location.",
      locations: [
        {
          locationName: "Location Name (e.g. Downtown Studio, Westside Shop)",
          city: "City Name",
          state: "ST",
          address: "123 Main Street, City, ST 00000",
          phone: "(555) 000-0000",
          hours: "Mon–Fri: 9:00am – 5:00pm",
          headline: "Your Service or Business in City, State (leave blank to auto-generate)",
          intro: "A 1-2 sentence intro about what you offer at this location and who you serve. This appears at the top of the page below the headline.",
          services: [
            "Service or offering #1",
            "Service or offering #2",
            "Service or offering #3",
            "Service or offering #4"
          ],
          mapEmbed: "<iframe src=\"https://www.google.com/maps/embed?pb=YOUR_EMBED_ID\" width=\"100%\" height=\"400\" style=\"border:0;\" allowfullscreen loading=\"lazy\"></iframe>",
          ctaText: "Contact us (leave blank to use default from brand brief)",
        },
        {
          locationName: "Second Location Name",
          city: "City Name",
          state: "ST",
          address: "456 Example Ave, City, ST 00000",
          phone: "(555) 000-0001",
          hours: "Mon–Sat: 8:00am – 6:00pm",
          headline: "",
          intro: "",
          services: [
            "Service or offering #1",
            "Service or offering #2"
          ],
          mapEmbed: "",
          ctaText: "",
        },
      ],
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spec-location-brief-template.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function handleConfirm() {
    const locs = locations.map(l => ({
      ...l,
      services: l.services.split("\n").map(s => s.trim()).filter(Boolean),
    }));
    onGenerate(locs, template);
    onClose();
  }

  // A location needs enough real data to be worth a page — city is what the
  // slug and headline are built from, phone is the primary CTA target.
  // Street address is optional (service-area/mobile businesses may not have one).
  const validLocations = locations.filter(l =>
    !!(l.city && l.city.trim()) &&
    !!(l.phone && String(l.phone).trim())
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#eeedf1", borderRadius: "12px", width: "100%", maxWidth: "860px", maxHeight: "92vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #dde0e6", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Bulk Location Pages</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
              {step === "entry" ? "Add locations manually or upload a pre-filled template." : "Review before generating."}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
        </div>

        {step === "entry" ? (
          <>
            {/* Upload strip */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid #dde0e6", background: "#fff", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 600, background: "#fff", color: "#09090b", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                ↑ Upload location brief
              </button>
              <input ref={fileRef} type="file" accept=".json,.docx" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
              <button
                onClick={downloadTemplate}
                style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: "#fff", color: "#6b7280", border: "1px solid #dde0e6", borderRadius: "6px", cursor: "pointer" }}>
                ↓ Download template
              </button>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>JSON or DOCX · Fill out the template, send to team, upload the completed file.</div>
              {parsing && <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 600 }}>Reading file…</div>}
              {uploadError && <div style={{ fontSize: "12px", color: "#dc2626" }}>{uploadError}</div>}
            </div>

            {/* Location cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {locations.map((loc, i) => (
                <LocationCard key={i} loc={loc} idx={i} onChange={updateLoc} onRemove={removeLoc} total={locations.length} />
              ))}
              <button
                onClick={addLoc}
                style={{ width: "100%", padding: "14px", fontSize: "13px", fontWeight: 500, background: "#fff", border: "2px dashed #dde0e6", borderRadius: "10px", color: "#6b7280", cursor: "pointer" }}
                onMouseOver={e => e.currentTarget.style.borderColor = "#b45309"}
                onMouseOut={e => e.currentTarget.style.borderColor = "#dde0e6"}>
                + Add another location
              </button>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #dde0e6", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {locations.length} location{locations.length !== 1 ? "s" : ""} added
                {validLocations.length < locations.length && (
                  <span style={{ color: "#dc2626" }}> — {locations.length - validLocations.length} missing city or phone</span>
                )}
              </div>
              <button
                onClick={() => setStep("review")}
                disabled={validLocations.length === 0}
                style={{ padding: "10px 24px", fontSize: "13px", fontWeight: 600, background: validLocations.length > 0 ? "#b45309" : "#dde0e6", color: "#fff", border: "none", borderRadius: "6px", cursor: validLocations.length > 0 ? "pointer" : "not-allowed" }}>
                Review {validLocations.length} location{validLocations.length !== 1 ? "s" : ""} →
              </button>
            </div>
          </>
        ) : (
          <ReviewScreen
            locations={validLocations}
            template={template}
            setTemplate={setTemplate}
            onBack={() => setStep("entry")}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}
