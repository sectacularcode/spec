import { Section } from "../Section.jsx";
import { I } from "../../styles.js";
import { TONES } from "../../constants/ui.jsx";

export default function DiscoveryTab({ ctx }) {
  const { brand, updBrand } = ctx;
  return (
            <div className="editor-padding" style={{ padding: "24px 20px 40px", maxWidth: "1080px", margin: "0 auto" }}>

              <Section id="founder" title="Founder &amp; Brand" icon="">
                <div>
                  <label style={I.lbl}>Brand / Company Name</label>
                  <input style={I.inp} value={brand.name || ""} onChange={e => updBrand("name", e.target.value)} placeholder="e.g. Acme Design Co." />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>Used in the hero, about section, footer, and throughout AI-drafted copy.</div>
                </div>
                <div><label style={I.lbl}>Founder Name</label><input style={I.inp} value={brand.founderName} onChange={e => updBrand("founderName", e.target.value)} placeholder="e.g. Alex Morgan" /></div>
                <div><label style={I.lbl}>Founder Title</label><input style={I.inp} value={brand.founderTitle} onChange={e => updBrand("founderTitle", e.target.value)} placeholder="e.g. Founder & Creative Director" /></div>
                <div><label style={I.lbl}>Founder Bio</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.founderBio} onChange={e => updBrand("founderBio", e.target.value)} /></div>
                <div>
                  <label style={I.lbl}>Brand Description</label>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.description || ""} onChange={e => updBrand("description", e.target.value)} placeholder="What does this business do? 2-3 sentences. This is the elevator pitch the AI uses when drafting copy across the site." />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>The AI reads this before writing anything — the more specific, the less generic the output.</div>
                </div>
              </Section>

              <Section id="client-logos" title="Brands Worked With" icon="">
                <div>
                  <label style={I.lbl}>Brands Worked With (one per line)</label>
                  <textarea style={{ ...I.inp, resize: "vertical", fontSize: "13px" }} rows={5} value={brand.clientLogos} onChange={e => updBrand("clientLogos", e.target.value)} placeholder="Client or partner name&#10;Client or partner name&#10;Client or partner name" />
                  <div style={{ fontSize: "10px", color: "#09090b", marginTop: "4px" }}>One per line.</div>
                </div>
              </Section>

              <Section id="discovery-voice" title="Tone &amp; Voice" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: "0 0 12px", lineHeight: 1.6 }}>How the brand sounds. This shapes every word the AI drafts across the site.</p>
                <div><label style={I.lbl}>Tone</label><select style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "11px 40px 11px 13px", background: "#ffffff url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23000' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\") no-repeat right 14px center", border: "1px solid #dde0e6", color: "#000000", borderRadius: "6px", fontSize: "14px", fontFamily: "inherit", outline: "none", lineHeight: 1.5, appearance: "none", WebkitAppearance: "none" }} value={TONES.includes(brand.tone) ? brand.tone : (brand.tone ? "Other" : brand.tone)} onChange={e => updBrand("tone", e.target.value)}>{TONES.map(t => <option key={t}>{t}</option>)}</select></div>
                {(brand.tone === "Other" || (brand.tone && !TONES.slice(0, -1).includes(brand.tone))) && (
                  <div style={{ marginTop: "10px" }}>
                    <label style={I.lbl}>Describe the tone</label>
                    <input
                      style={I.inp}
                      value={TONES.includes(brand.tone) ? "" : brand.tone}
                      onChange={e => updBrand("tone", e.target.value)}
                      placeholder="e.g. Dry and witty, like a smart friend who happens to know everything"
                      autoFocus
                    />
                  </div>
                )}
              </Section>

              <Section id="discovery-differentiator" title="What sets this brand apart from competitors" icon="">
                <textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.differentiator || ""} onChange={e => updBrand("differentiator", e.target.value)} placeholder="e.g. What makes this brand different from everyone else in the space? Be specific." />
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>One or two sentences. What do they offer that no one else does, or does the same way? The AI uses this to avoid generic copy.</div>
              </Section>

            </div>
  );
}
