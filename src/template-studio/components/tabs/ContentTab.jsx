import { Section } from "../Section.jsx";
import { Icon } from "../Icon.jsx";
import { I } from "../../styles.js";
import { PAGE_TYPES, SECTION_OPTIONS } from "../../constants/ui.jsx";

export default function ContentTab({ ctx }) {
  const { brand, page, project, updPage, clearDemoContent, toggleSection } = ctx;
  return (
            <>
              <div style={{ maxWidth: "1080px", margin: "0 auto", width: "100%", padding: "24px 24px 40px" }}>
              {(!!(page.heroHeading || page.heroSubhead || page.aboutBody || page.services || page.process || page.testimonials || page.faq || page.portfolio || page.stats || page.pricing || page.blog || page.leaders)) && (
                <div style={{ marginBottom: "16px", padding: "12px 16px", background: "#ffffff", border: "1px solid #dde0e6", borderLeft: "3px solid #b45309", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>This page has demo content from the template. Clear it to start fresh with your client's copy.</div>
                  <button onClick={clearDemoContent} style={{ padding: "6px 14px", background: "#ffffff", color: "#b45309", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Clear demo content</button>
                </div>
              )}
              <Section id="page-setup" title="Page Setup" icon="">
                <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div><label style={I.lbl}>Page Name</label><input style={I.inp} value={page.name} onChange={e => updPage("name", e.target.value)} /></div>
                  <div><label style={I.lbl}>Page Type</label><select style={I.sel} value={page.pageType} onChange={e => updPage("pageType", e.target.value)}>{PAGE_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                </div>
              </Section>
              <Section id="page-sections" title="Sections on this Page" icon="">
                <p style={{ fontSize: "13px", color: "#09090b", margin: 0, lineHeight: 1.55 }}>Compose the page top to bottom. Tap a section in the library to add it to the outline. Tap the × to remove.</p>
                <div style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "10px", padding: "22px 24px" }}>
                  {/* PAGE OUTLINE — selected sections in order */}
                  <div style={{ fontSize: "9px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, marginBottom: "12px" }}>
                    Page Outline {page.sections.length > 0 && <span style={{ color: "#a3a39e" }}>· {page.sections.length} {page.sections.length === 1 ? "section" : "sections"}</span>}
                  </div>
                  {page.sections.length === 0 ? (
                    <div style={{ padding: "20px 16px", background: "#ffffff", border: "1px dashed #dde0e6", borderRadius: "8px", textAlign: "center", fontSize: "13px", color: "#09090b", marginBottom: "24px" }}>
                      No sections added yet. Tap a section from the library below to start composing this page.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "24px" }}>
                      {page.sections.map((s, i) => (
                        <div key={`${s}-${i}`} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(i));e.currentTarget.style.opacity="0.4";}} onDragEnd={e=>{e.currentTarget.style.opacity="1";document.querySelectorAll("[data-dnd]").forEach(el=>{el.style.borderTop="";el.style.borderBottom="";});}} onDragOver={e=>{e.preventDefault();const r=e.currentTarget.getBoundingClientRect();const mid=r.top+r.height/2;e.currentTarget.style.borderTop=e.clientY<mid?"2px solid #6b635c":"";e.currentTarget.style.borderBottom=e.clientY>=mid?"2px solid #6b635c":"";}} onDragLeave={e=>{e.currentTarget.style.borderTop="";e.currentTarget.style.borderBottom="";}} onDrop={e=>{e.preventDefault();e.currentTarget.style.borderTop="";e.currentTarget.style.borderBottom="";const from=parseInt(e.dataTransfer.getData("text/plain"),10);const r=e.currentTarget.getBoundingClientRect();const mid=r.top+r.height/2;let to=e.clientY<mid?i:i+1;if(from===to||from+1===to)return;const arr=[...page.sections];const[moved]=arr.splice(from,1);arr.splice(to>from?to-1:to,0,moved);updPage("sections",arr);}} data-dnd style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "8px", cursor: "grab", userSelect: "none" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#09090b", fontVariantNumeric: "tabular-nums", minWidth: "20px", letterSpacing: "0.02em" }}>{String(i + 1).padStart(2, "0")}</span>
                          <span style={{ flex: 1, fontSize: "14px", color: "#09090b", fontWeight: 500 }}>{s}</span>
                          <span title="Drag to reorder" style={{ display: "inline-flex", flexDirection: "column", gap: "3px", cursor: "grab", opacity: 0.4, flexShrink: 0 }}>{[0,1,2].map(r => (<span key={r} style={{ display: "flex", gap: "3px" }}><span style={{ width:"3px",height:"3px",borderRadius:"50%",background:"#b45309",display:"block" }}/><span style={{ width:"3px",height:"3px",borderRadius:"50%",background:"#b45309",display:"block" }}/></span>))}</span>
                          <button
                            onClick={() => toggleSection(s)}
                            title={`Remove ${s}`}
                            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", color: "#b45309", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "4px", transition: "color 0.15s, background 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.color = "#b45309"; e.currentTarget.style.background = "rgba(180, 83, 9, 0.1)"; }}
                            onMouseOut={e => { e.currentTarget.style.color = "#b45309"; e.currentTarget.style.background = "transparent"; }}>
                            <Icon name="x" size={14} color="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  <div style={{ height: "1px", background: "#dde0e6", marginBottom: "18px" }} />

                  {/* AVAILABLE LIBRARY — unselected sections as add pills */}
                  <div style={{ fontSize: "9px", color: "#09090b", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600, marginBottom: "12px" }}>Available Sections</div>
                  {(() => {
                    const allOptions = SECTION_OPTIONS.filter((v, i, a) => a.indexOf(v) === i);
                    const available = allOptions.filter(s => !page.sections.includes(s));
                    if (available.length === 0) {
                      return <div style={{ fontSize: "13px", color: "#09090b", fontStyle: "italic" }}>All sections added.</div>;
                    }
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {available.map(s => (
                          <button
                            key={s}
                            onClick={() => toggleSection(s)}
                            style={{ fontSize: "13px", padding: "7px 12px", background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "999px", color: "#09090b", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "4px", transition: "border-color 0.15s, background 0.15s" }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = "#000000"; e.currentTarget.style.background = "#f5f5f7"; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = "#dde0e6"; e.currentTarget.style.background = "#ffffff"; }}>
                            <Icon name="plus" size={11} color="#09090b" /> {s}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </Section>
              {page.sections.includes("Hero") && <Section id="page-hero" title="Hero Text" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>The first thing visitors see. Your main headline and supporting line.</p>
                <div><label style={I.lbl}>Heading</label><input style={I.inp} value={page.heroHeading || ""} onChange={e => updPage("heroHeading", e.target.value)} placeholder="e.g. Your main headline goes here." /></div>
                <div><label style={I.lbl}>Subheading</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={page.heroSubhead || ""} onChange={e => updPage("heroSubhead", e.target.value)} placeholder="e.g. A short supporting line under the headline." /></div>
                <div><label style={I.lbl}>Hero Image</label><input style={I.inp} value={page.heroImage || ""} onChange={e => updPage("heroImage", e.target.value)} placeholder="Paste your WordPress media URL — leave blank for a placeholder" /></div>
              </Section>}
              {page.sections.includes("About") && <Section id="page-about" title="About the Company" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>A short brand story — usually image and text side by side, just below the hero.</p>
                <div><label style={I.lbl}>Heading</label><input style={I.inp} value={page.aboutHeading || ""} onChange={e => updPage("aboutHeading", e.target.value)} placeholder="e.g. A short about heading." /></div>
                <div><label style={I.lbl}>Body</label><textarea style={{ ...I.inp, resize: "vertical" }} rows={4} value={page.aboutBody || ""} onChange={e => updPage("aboutBody", e.target.value)} placeholder="Write your about copy here, or leave blank to pull from your brand description." /></div>
              </Section>}
              {page.sections.some(s => s === "Services" || s === "Service Cards") && <Section id="content-services" title="Services" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>What you offer. Each line becomes a card or list item on the page.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={5} value={page.services || ""} onChange={e => updPage("services", e.target.value)} placeholder={"Service Name|What it includes or who it's for\nService Name|What it includes or who it's for"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One service per line. Format: <strong>Name|Description</strong></div>
              </Section>}
              {(page.sections.includes("Portfolio") || page.sections.includes("Portfolio Carousel")) && <Section id="content-portfolio" title="Portfolio" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>Your past work. Each line becomes a project card. Add placeholder images in Elementor after import.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontSize: "13px", maxWidth: "560px" }} rows={6} value={page.portfolio || ""} onChange={e => updPage("portfolio", e.target.value)} placeholder={"Project Name|Client or Category\nProject Name|Client or Category"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One project per line. Format: <strong>Project Name|Client or Category</strong>. Images are added in Elementor after import.</div>
              </Section>}
              {page.sections.includes("Process") && <Section id="content-process" title="Your Process" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>How you work, step by step. Steps are numbered automatically.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={5} value={page.process || ""} onChange={e => updPage("process", e.target.value)} placeholder={"Step Name|What happens at this stage\nStep Name|What happens at this stage"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One step per line. Format: <strong>Step Name|Description</strong></div>
              </Section>}
              {(page.sections.includes("Team") || page.sections.includes("Team Carousel")) && <Section id="content-team" title="Team" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>Your team members. Each line becomes a card with photo, name, and role.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={5} value={page.team || ""} onChange={e => updPage("team", e.target.value)} placeholder={"Name|Role|https://yoursite.com/wp-content/uploads/photo.jpg\nName|Role|"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One person per line. Format: <strong>Name|Role|Image URL</strong>. Leave image URL blank for a placeholder.</div>
              </Section>}
              {page.sections.includes("Leadership") && <Section id="content-leadership" title="Leadership" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>Full editorial profiles for founders or principals — large portrait, quote, and bio. Usually on About pages.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={4} value={page.leaders || ""} onChange={e => updPage("leaders", e.target.value)} placeholder={"Name|Title|Image URL|Pull quote|Short bio"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One leader per line. Format: <strong>Name|Title|Image URL|Quote|Bio</strong></div>
              </Section>}
              {page.sections.includes("Stats") && <Section id="content-stats" title="Stats" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>Big numbers that build credibility — years in business, projects shipped, clients served.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={4} value={page.stats || ""} onChange={e => updPage("stats", e.target.value)} placeholder={"10|+|Years in Business\n150||Projects Shipped\n98|%|Client Satisfaction"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One stat per line. Format: <strong>Number|Suffix|Label</strong>. Leave suffix blank if not needed.</div>
              </Section>}
              {page.sections.includes("Testimonials") && <Section id="content-testimonials" title="Client Testimonials" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>Client quotes shown as a carousel or grid. Add up to 3 — edit or add more directly in Elementor after import.</p>
                {(page.testimonials || "||\n||\n||").split("\n").slice(0, 3).map((line, i) => {
                  const parts = line.split("|");
                  return (
                    <div key={i} style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "8px", padding: "14px 16px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Testimonial {i + 1}</div>
                      <div style={{ marginBottom: "8px" }}>
                        <label style={I.lbl}>Quote</label>
                        <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={parts[0] || ""} placeholder="What the client said about working with you." onChange={e => { const lines = (page.testimonials || "||\n||\n||").split("\n"); const p = (lines[i] || "||").split("|"); p[0] = e.target.value; lines[i] = p.join("|"); updPage("testimonials", lines.join("\n")); }} />
                      </div>
                      <div className="responsive-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div><label style={I.lbl}>Name</label><input style={I.inp} value={parts[1] || ""} placeholder="Client Name" onChange={e => { const lines = (page.testimonials || "||\n||\n||").split("\n"); const p = (lines[i] || "||").split("|"); p[1] = e.target.value; lines[i] = p.join("|"); updPage("testimonials", lines.join("\n")); }} /></div>
                        <div><label style={I.lbl}>Role or Company</label><input style={I.inp} value={parts[2] || ""} placeholder="CEO, Company Name" onChange={e => { const lines = (page.testimonials || "||\n||\n||").split("\n"); const p = (lines[i] || "||").split("|"); p[2] = e.target.value; lines[i] = p.join("|"); updPage("testimonials", lines.join("\n")); }} /></div>
                      </div>
                    </div>
                  );
                })}
              </Section>}
              {page.sections.includes("Pricing") && <Section id="content-pricing" title="Pricing" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>Your pricing tiers, shown as side-by-side cards.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={4} value={page.pricing || ""} onChange={e => updPage("pricing", e.target.value)} placeholder={"Tier Name|$Price|What's included\nTier Name|$Price|What's included"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One tier per line. Format: <strong>Name|Price|Description</strong></div>
              </Section>}
              {page.sections.includes("FAQ") && <Section id="content-faq" title="FAQ" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px", lineHeight: 1.5 }}>Common questions shown in an accordion. Add up to 4 here — add more directly in Elementor after import.</p>
                {(page.faq || "||\n||\n||\n||").split("\n").slice(0, 4).map((line, i) => {
                  const parts = line.split("|");
                  return (
                    <div key={i} style={{ background: "#ffffff", border: "1px solid #dde0e6", borderRadius: "8px", padding: "14px 16px", marginBottom: "10px" }}>
                      <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>FAQ {i + 1}</div>
                      <div style={{ marginBottom: "8px" }}>
                        <label style={I.lbl}>Question</label>
                        <input style={I.inp} value={parts[0] || ""} placeholder="What's the most common question clients ask?" onChange={e => { const lines = (page.faq || "||\n||\n||\n||").split("\n"); const p = (lines[i] || "|").split("|"); p[0] = e.target.value; lines[i] = p.join("|"); updPage("faq", lines.join("\n")); }} />
                      </div>
                      <div>
                        <label style={I.lbl}>Answer</label>
                        <textarea style={{ ...I.inp, resize: "vertical" }} rows={2} value={parts[1] || ""} placeholder="A clear, concise answer." onChange={e => { const lines = (page.faq || "||\n||\n||\n||").split("\n"); const p = (lines[i] || "|").split("|"); p[1] = e.target.value; lines[i] = p.join("|"); updPage("faq", lines.join("\n")); }} />
                      </div>
                    </div>
                  );
                })}
              </Section>}
              {page.sections.includes("Video") && <Section id="content-video" title="Video" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>A YouTube or Vimeo embed. Can sit anywhere on the page.</p>
                <input style={I.inp} value={page.videoUrl || ""} onChange={e => updPage("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..." />
              </Section>}
              {page.sections.includes("Blog") && <Section id="content-blog" title="Blog Preview" icon="">
                <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>Preview cards for recent posts — shown on the homepage or a blog index page. Write the actual posts inside WordPress.</p>
                <textarea style={{ ...I.inp, resize: "vertical", fontFamily: "monospace", fontSize: "13px", maxWidth: "560px" }} rows={5} value={page.blog || ""} onChange={e => updPage("blog", e.target.value)} placeholder={"Post Title|Category|6 min read\nPost Title|Category|4 min read"} />
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>One post per line. Format: <strong>Title|Category|Read time</strong>. Placeholder images applied automatically.</div>
              </Section>}
              </div>
            </>
  );
}
