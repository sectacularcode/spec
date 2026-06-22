import { Section } from "../Section.jsx";
import { Icon } from "../Icon.jsx";
import { I } from "../../styles.js";
import { WEBSITE_TEMPLATES } from "../../constants/templates.js";

export default function PositioningTab({ ctx }) {
  const { brand, page, updBrand, updPage, generateStarterCopy, aiLoading, briefDirty } = ctx;
  return (
            <div className="editor-padding" style={{ padding: "24px 20px 40px", maxWidth: "1080px", margin: "0 auto" }}>

              <Section id="positioning-audience" title="Target Audience" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: "0 0 10px", lineHeight: 1.6 }}>Who you're talking to — their role, company type, industry, or life stage. The AI uses this to write copy that speaks directly to the right person, not a generic visitor.</p>
                <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={brand.targetAudience} onChange={e => updBrand("targetAudience", e.target.value)} placeholder="e.g. Small business owners looking for a premium online presence without the agency price tag." />
              </Section>

              <Section id="positioning-goals" title="Goals & What Success Looks Like" icon="">
                <div>
                  <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "10px", lineHeight: 1.5 }}>What the site is supposed to do. Pick everything that applies — these drive the CTA language in your AI-drafted copy. A coaching site is typically Bookings + Lead Generation. A services site is Lead Generation + Awareness.</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {["Lead Generation", "Direct Sales / E-commerce", "Bookings & Reservations", "Free Trial / Demo Sign-ups", "Account Creation / Registration", "Resource Downloads / Lead Magnets", "Awareness & Brand Building", "Community & Newsletter Growth", "Applications & Sign-ups", "Donations & Fundraising"].map(g => {
                      const currentGoals = brand.goals || (brand.goal ? [brand.goal] : []);
                      const isSelected = currentGoals.includes(g);
                      return (
                        <label key={g} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: isSelected ? "rgba(180, 83, 9, 0.1)" : "#ffffff", border: `1px solid ${isSelected ? "#b45309" : "#dde0e6"}`, borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: isSelected ? "#b45309" : "#09090b", userSelect: "none" }}>
                          <input type="checkbox" checked={isSelected} onChange={e => { const next = e.target.checked ? [...currentGoals, g] : currentGoals.filter(x => x !== g); updBrand("goals", next); updBrand("goal", next[0] || ""); }} style={{ cursor: "pointer", accentColor: "#b45309" }} />
                          {g}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <label style={I.lbl}>What does a win look like?</label>
                  <div style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 8px", lineHeight: 1.5 }}>One sentence — the specific result this site should drive. The more concrete, the better. The AI uses this to shape the tone and urgency of every drafted section.</div>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={brand.outcome || ""} onChange={e => updBrand("outcome", e.target.value)} placeholder="e.g. Book 4–6 qualified leads per month through the website contact form." />
                </div>
                <div>
                  <label style={I.lbl}>Key Messages</label>
                  <div style={{ fontSize: "12px", color: "#6b7280", margin: "4px 0 8px", lineHeight: 1.5 }}>The 2–4 things you want every visitor to walk away knowing. The AI weaves these into the hero, about section, and services naturally.</div>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.keyMessages} onChange={e => updBrand("keyMessages", e.target.value)} placeholder="e.g. 10 years in business. 100+ clients served. Full-service partner from strategy to delivery." />
                </div>
              </Section>

              <Section id="positioning-ctas" title="CTAs & Contact" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: "0 0 12px", lineHeight: 1.6 }}>Your call-to-action labels and contact details. These feed into the AI draft copy — hero buttons, nav CTA, footer, and contact form.</p>
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={I.lbl}>Primary CTA</label><input style={I.inp} value={brand.cta1} onChange={e => updBrand("cta1", e.target.value)} placeholder="e.g. Book a call" /></div>
                  <div><label style={I.lbl}>Secondary CTA</label><input style={I.inp} value={brand.cta2} onChange={e => updBrand("cta2", e.target.value)} placeholder="e.g. View our work" /></div>
                </div>
                <div>
                  <label style={I.lbl}>Final CTA Heading</label>
                  <input style={I.inp} value={page.ctaHeading || ""} onChange={e => updPage("ctaHeading", e.target.value)} placeholder="e.g. Ready to get started?" />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>The big conversion heading in the bottom CTA section before the footer. Each page can have a different one.</div>
                </div>
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><label style={I.lbl}>Contact Email</label><input style={I.inp} value={brand.contactEmail} onChange={e => updBrand("contactEmail", e.target.value)} placeholder="e.g. hello@yourbrand.com" /></div>
                  <div><label style={I.lbl}>Phone</label><input style={I.inp} value={brand.contactPhone} onChange={e => updBrand("contactPhone", e.target.value)} placeholder="e.g. (555) 000-0000" /></div>
                </div>
              </Section>

              <Section id="positioning-style-notes" title="Style Notes" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>Specific aesthetic principles you want applied — typography quirks, hierarchy preferences, ornamental rules, things you've seen and liked. Fed directly to the AI Draft Starter Copy as concrete style guidance.</p>
                <textarea
                  style={{ ...I.inp, resize: "vertical" }}
                  rows={5}
                  value={brand.styleNotes}
                  onChange={e => updBrand("styleNotes", e.target.value)}
                  placeholder="e.g. Lowercase navigation, dramatic numbered sections, generous negative space, all-caps eyebrow labels, dark background with one bold accent color, work-first hierarchy."
                />
              </Section>

              <Section id="positioning-keywords" title="Keywords for Search & AI Discovery" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: "0 0 12px", lineHeight: 1.6 }}>
                  The terms you want this site to rank for in Google and get cited in AI search (ChatGPT, Perplexity, Gemini). These are fed into Draft Starter Copy so copy gets written around them naturally — no stuffing, just context.
                </p>
                {(() => {
                  const activeTpl = brand.templateId ? WEBSITE_TEMPLATES.find(t => t.id === brand.templateId) : null;
                  if (!activeTpl) return null;
                  const tplKeywords = (activeTpl.industry || "").split(/[,—]/).map(s => s.trim()).filter(Boolean).slice(0, 5);
                  if (!tplKeywords.length) return null;
                  const currentList = (brand.primaryKeywords || "").split(",").map(s => s.trim()).filter(Boolean);
                  const missing = tplKeywords.filter(k => !currentList.some(c => c.toLowerCase() === k.toLowerCase()));
                  if (!missing.length) return null;
                  return (
                    <div style={{ padding: "12px 14px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "6px", marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#09090b", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Suggested from your {activeTpl.name} template</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {missing.map(k => (<button key={k} onClick={() => { const next = currentList.concat(k).join(", "); updBrand("primaryKeywords", next); }} style={{ padding: "5px 10px", background: "rgba(180, 83, 9, 0.1)", color: "#b45309", border: "1px solid rgba(180, 83, 9, 0.25)", borderRadius: "4px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}>+ {k}</button>))}
                      </div>
                      <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "8px" }}>Click a keyword to add it to your list below. These are pulled from your template's industry category.</div>
                    </div>
                  );
                })()}
                <div>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={3} value={brand.primaryKeywords || ""} onChange={e => updBrand("primaryKeywords", e.target.value)} placeholder="web design, brand strategy, small business website, creative agency" />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "5px" }}>Comma-separated. 3–5 is ideal.</div>
                </div>
              </Section>

              <Section id="positioning-seo" title="Page SEO — Meta Titles & Descriptions" icon="">
                <p style={{ fontSize: "12px", color: "#09090b", margin: "0 0 12px", lineHeight: 1.5 }}>Each page has its own SEO title and description — switch pages using the page pills above to fill them in for each one. After importing into WordPress, paste them into your SEO plugin (Yoast: <strong>SEO Title</strong> / Rank Math: <strong>Meta Title</strong>). Currently editing: <strong>{page.name}</strong></p>
                <div>
                  <label style={I.lbl}>SEO Title</label>
                  <input style={I.inp} value={page.metaTitle || ""} onChange={e => updPage("metaTitle", e.target.value)} placeholder={`${brand.name || "Brand Name"} | Short descriptor — keep under 60 characters`} />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>Format: Brand Name | Page descriptor. Example: Mile Marker Films | Video for Industrial Companies. Under 60 characters.</div>
                </div>
                <div>
                  <label style={I.lbl}>Meta Description</label>
                  <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={page.metaDesc || ""} onChange={e => updPage("metaDesc", e.target.value)} placeholder="150–160 characters. What shows under your page title in Google search results." />
                  <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "4px" }}>{page.metaDesc ? `${page.metaDesc.length} characters${page.metaDesc.length > 160 ? " — too long, trim to 160" : page.metaDesc.length < 120 ? " — a little short, aim for 150–160" : " ✓"}` : "Aim for 150–160 characters."}</div>
                </div>
              </Section>

              <Section id="positioning-draft" title="Draft Starter Copy with AI" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.6 }}>
                  Generates hero copy, about text, and key messaging using everything in this tab. Fill in Goals, Desired Outcome, and Keywords first — the more context you give, the less generic the output.
                </p>
                <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                <button
                  onClick={() => generateStarterCopy()}
                  disabled={aiLoading || !brand.goal || !brand.outcome}
                  style={{ padding: "12px 32px", background: "#b45309", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: (aiLoading || !((brand.goals && brand.goals.length) || brand.goal) || !brand.outcome) ? "not-allowed" : "pointer", opacity: (aiLoading || !((brand.goals && brand.goals.length) || brand.goal) || !brand.outcome) ? 0.4 : 1, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                  <Icon name="sparkles" size={15} color="#ffffff" />
                  {aiLoading ? "Drafting starter copy…" : "Draft Starter Copy with AI"}
                </button>
                </div>
                {(!((brand.goals && brand.goals.length) || brand.goal) || !brand.outcome) && (
                  <div style={{ fontSize: "12px", color: "#09090b", marginTop: "8px" }}>Pick at least one Goal and fill in "What does a win look like?" to enable AI copy drafting.</div>
                )}
                {briefDirty && ((brand.goals && brand.goals.length) || brand.goal) && brand.outcome && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#b45309", fontWeight: 500, marginTop: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#b45309", display: "inline-block" }} />
                    You've made changes — re-run Draft Starter Copy to update your copy
                  </div>
                )}
              </Section>

            </div>
  );
}

