import { useState } from "react";
import { INTAKE_TABS, DEFAULT_COLORS, DEFAULT_TIERS, ALL_PAGES, ADDITIONAL_PAGE_TYPES } from "../../constants/pages.js";

// Multi-step intake form for manual brief entry.
// Produces a brief object that gets passed to generatePages() and buildPreviewHTML().
// Tabs are defined in INTAKE_TABS — add a tab there and a new step here.

export function IntakeForm({ onClose, onComplete }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    // Brand
    brandName: "", whatItIs: "", whoItIsFor: "", storyBehindName: "",
    voiceRules: "", tagline: "", signatureLine: "",
    // Design
    colors: DEFAULT_COLORS.map(c => ({ ...c })),
    primaryFont: "", accentFont: "", typographyNotes: "",
    buttonsLinks: "", componentMotif: "", layoutImagery: "",
    // Sitemap
    pages: ["Home", "Work / Portfolio", "Services & Pricing", "About", "Process", "Contact"],
    headerDescription: "", footerDescription: "",
    headerNav: "Work, Services, About, Process, Contact",
    headerCta: "Start a project",
    // Copy — Home
    heroEyebrow: "", heroH1: "", heroSubhead: "", heroCta1: "See the work", heroCta2: "See pricing",
    hookStatement: "",
    serviceCard1Title: "", serviceCard1Body: "",
    serviceCard2Title: "", serviceCard2Body: "",
    serviceCard3Title: "", serviceCard3Body: "",
    serviceCard4Title: "", serviceCard4Body: "",
    differenceEyebrow: "", differenceH2: "", differenceBody: "",
    whoEyebrow: "", whoH2: "", whoBody: "",
    workH2: "Recent work.", pricingTeaserH2: "", pricingTeaserBody: "", pricingTeaserCta: "See packages",
    closingPullQuote: "", closingCta: "Start a project",
    // Copy — About
    aboutEyebrow: "", aboutH1: "", aboutStory: "", whyOneMaker: "", founderValues: "",
    // Copy — Process
    processEyebrow: "", processH1: "", processIntro: "",
    step1Title: "", step1Body: "", step2Title: "", step2Body: "",
    step3Title: "", step3Body: "", step4Title: "", step4Body: "",
    step5Title: "", step5Body: "",
    // Copy — Contact
    contactEyebrow: "", contactH1: "", contactIntro: "",
    contactSubmit: "Send it over", contactReassurance: "",
    // Pricing
    tiers: DEFAULT_TIERS.map(t => ({ ...t })),
    alwaysIncluded: "",
    // Positioning & SEO
    valueProposition: "",
    targetAudience: "",
    primaryKeywords: "",
    secondaryKeywords: "",
    keyMessages: "",
    competitiveDifferentiator: "",
    seoPageTitles: ["Home", "Work", "Services", "About", "Process", "Contact"].map(page => ({ page, title: "", desc: "" })),
  });

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function setColor(i, key, val) {
    setForm(f => {
      const colors = f.colors.map((c, j) => j === i ? { ...c, [key]: val } : c);
      return { ...f, colors };
    });
  }
  function setTier(i, key, val) {
    setForm(f => {
      const tiers = f.tiers.map((t, j) => j === i ? { ...t, [key]: val } : t);
      return { ...f, tiers };
    });
  }
  function setPageTitle(i, key, val) {
    setForm(f => {
      const seoPageTitles = f.seoPageTitles.map((s, j) => j === i ? { ...s, [key]: val } : s);
      return { ...f, seoPageTitles };
    });
  }

  function buildBriefFromForm() {
    const colors = {};
    const colorNames = ["ink", "brass", "brass-deep", "bone", "asphalt", "stone", "warm-white", "text"];
    form.colors.forEach((c, i) => { if (c.hex) colors[colorNames[i]] = c.hex; });

    return {
      brandName: form.brandName,
      tagline: form.tagline,
      signatureLine: form.signatureLine,
      colors,
      fonts: [form.primaryFont, form.accentFont].filter(Boolean),
      voiceRules: form.voiceRules.split("\n").map(r => r.trim()).filter(Boolean),
      headerNav: form.headerNav.split(",").map(s => s.trim()),
      headerCta: form.headerCta,
      footerTagline: form.signatureLine,
      heroHeadline: form.heroH1,
      heroSubhead: form.heroSubhead,
      heroCta1: form.heroCta1,
      heroCta2: form.heroCta2,
      hookStatement: form.hookStatement,
      serviceCards: [
        [form.serviceCard1Title, form.serviceCard1Body],
        [form.serviceCard2Title, form.serviceCard2Body],
        [form.serviceCard3Title, form.serviceCard3Body],
        [form.serviceCard4Title, form.serviceCard4Body],
      ].filter(c => c[0] || c[1]),
      differenceEyebrow: form.differenceEyebrow,
      differenceH2: form.differenceH2,
      differenceBody: form.differenceBody,
      whoEyebrow: form.whoEyebrow,
      whoH2: form.whoH2,
      whoBody: form.whoBody,
      workH2: form.workH2,
      pricingH2: form.pricingTeaserH2,
      pricingSubhead: form.pricingTeaserBody,
      pricingCta: form.pricingTeaserCta,
      closingCta: form.closingCta,
      aboutEyebrow: form.aboutEyebrow,
      aboutH1: form.aboutH1,
      aboutStory: form.aboutStory,
      whyOneMaker: form.whyOneMaker,
      founderValues: form.founderValues.split(",").map(v => v.trim()).filter(Boolean),
      processEyebrow: form.processEyebrow,
      processH1: form.processH1,
      processIntro: form.processIntro,
      processSteps: [
        ["01", form.step1Title, form.step1Body],
        ["02", form.step2Title, form.step2Body],
        ["03", form.step3Title, form.step3Body],
        ["04", form.step4Title, form.step4Body],
        ["05", form.step5Title, form.step5Body],
      ].filter(s => s[1] || s[2]),
      contactEyebrow: form.contactEyebrow,
      contactH1: form.contactH1,
      contactIntro: form.contactIntro,
      contactCta: form.contactSubmit,
      contactReassurance: form.contactReassurance,
      pricingTiers: form.tiers.filter(t => t.name).map(t => [t.name, t.subtitle, t.description, t.price]),
      valueProposition: form.valueProposition,
      targetAudience: form.targetAudience,
      competitiveDifferentiator: form.competitiveDifferentiator,
      keyMessages: form.keyMessages.split("\n").map(m => m.trim()).filter(Boolean),
      primaryKeywords: form.primaryKeywords.split(",").map(k => k.trim()).filter(Boolean),
      secondaryKeywords: form.secondaryKeywords.split(",").map(k => k.trim()).filter(Boolean),
      seoPageTitles: form.seoPageTitles,
    };
  }

  const S = { // field styles
    label: { display: "block", fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" },
    hint: { fontSize: "11px", color: "#9ca3af", marginBottom: "6px", lineHeight: 1.5 },
    input: { width: "100%", maxWidth: "100%", padding: "9px 12px", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box" },
    textarea: { width: "100%", maxWidth: "100%", padding: "9px 12px", border: "1px solid #dde0e6", borderRadius: "4px", fontSize: "13px", color: "#09090b", outline: "none", background: "#fff", boxSizing: "border-box", resize: "vertical", fontFamily: "'Be Vietnam Pro', sans-serif", lineHeight: 1.6 },
    field: { marginBottom: "18px" },
    section: { marginBottom: "28px" },
    sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#09090b", marginBottom: "14px", paddingBottom: "8px", borderBottom: "1px solid #dde0e6" },
  };

  const tabs = {
    0: ( // Brand
      <div>
        <div style={S.section}>
          <div style={S.sectionTitle}>01 · The Brand in Brief</div>
          <div style={S.field}>
            <label style={S.label}>Brand name</label>
            <input style={S.input} value={form.brandName} onChange={e => set("brandName", e.target.value)} placeholder="e.g. Specish Studio" />
          </div>
          <div style={S.field}>
            <label style={S.label}>What it is</label>
            <div style={S.hint}>Feeds tone and framing for the whole site. Not placed on a page directly.</div>
            <textarea rows={4} style={S.textarea} value={form.whatItIs} onChange={e => set("whatItIs", e.target.value)} placeholder="e.g. Specish Studio is a full-service creative agency. We write, design, and build every project in-house…" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Who it is for</label>
            <div style={S.hint}>The audience the site speaks to. Shapes voice and the Who it is for section on Home.</div>
            <textarea rows={4} style={S.textarea} value={form.whoItIsFor} onChange={e => set("whoItIsFor", e.target.value)} placeholder="Industrial and founder-led companies, and the businesses backed by private equity…" />
          </div>
          <div style={S.field}>
            <label style={S.label}>The story behind the name</label>
            <div style={S.hint}>Brand narrative. Informs the About page and the closing lines.</div>
            <textarea rows={4} style={S.textarea} value={form.storyBehindName} onChange={e => set("storyBehindName", e.target.value)} placeholder="e.g. The name came from the idea that every brand deserves a clear marker of where they started and where they're going…" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Voice, in five rules <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(one per line)</span></label>
            <div style={S.hint}>The rules the AI obeys on every drafted field. This is what makes copy sound like the brand.</div>
            <textarea rows={6} style={S.textarea} value={form.voiceRules} onChange={e => set("voiceRules", e.target.value)} placeholder={"Say less. Confidence is quiet. Short sentences win.\nPlain words. No buzzwords, no filler.\nSpecific beats grand. Show the detail instead of claiming greatness.\nClean punctuation. Commas and periods, not dashes.\nWarm, but grounded. Premium without trying too hard."} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Tagline</label>
            <div style={S.hint}>Closing call to action and footer area.</div>
            <input style={S.input} value={form.tagline} onChange={e => set("tagline", e.target.value)} placeholder="The stories that move a company forward." />
          </div>
          <div style={S.field}>
            <label style={S.label}>Signature line</label>
            <div style={S.hint}>Footer, beneath the wordmark.</div>
            <input style={S.input} value={form.signatureLine} onChange={e => set("signatureLine", e.target.value)} placeholder="Mark what matters." />
          </div>
        </div>
      </div>
    ),
    2: ( // Design
      <div>
        <div style={S.section}>
          <div style={S.sectionTitle}>02 · Design System</div>
          <div style={S.field}>
            <label style={S.label}>Color palette</label>
            <div style={S.hint}>Eight named colors. Each becomes a preset applied site-wide. Dominance rule: background and ink carry the site. Accent stays rare.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {form.colors.map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 110px 1fr", gap: "8px", alignItems: "center" }}>
                  <input style={{ ...S.input, fontSize: "13px" }} value={c.name} onChange={e => setColor(i, "name", e.target.value)} placeholder="Color name" />
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input type="color" value={c.hex || "#ffffff"} onChange={e => setColor(i, "hex", e.target.value)} style={{ width: "32px", height: "32px", border: "1px solid #dde0e6", borderRadius: "4px", cursor: "pointer", padding: "2px" }} />
                    <input style={{ ...S.input, fontSize: "12px", fontFamily: "monospace" }} value={c.hex} onChange={e => setColor(i, "hex", e.target.value)} placeholder="#000000" />
                  </div>
                  <input style={{ ...S.input, fontSize: "12px", color: "#6b7280" }} value={c.use} onChange={e => setColor(i, "use", e.target.value)} placeholder="Use…" />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={S.field}>
              <label style={S.label}>Primary font</label>
              <input style={S.input} value={form.primaryFont} onChange={e => set("primaryFont", e.target.value)} placeholder="Inter" />
            </div>
            <div style={S.field}>
              <label style={S.label}>Accent font</label>
              <input style={S.input} value={form.accentFont} onChange={e => set("accentFont", e.target.value)} placeholder="Fraunces" />
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Typography notes</label>
            <div style={S.hint}>Font roles, weights, sizes, and line heights. Becomes the typography presets in the brand kit.</div>
            <textarea rows={4} style={S.textarea} value={form.typographyNotes} onChange={e => set("typographyNotes", e.target.value)} placeholder={"Inter is the primary face. Fraunces is the accent, used only for the wordmark, hero, and pull-quotes.\nH1 · Inter 800, 1.1 lh\nBody · Inter 400, 17px, 1.65 lh"} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Buttons and links</label>
            <div style={S.hint}>Theme style for buttons and in-copy links.</div>
            <textarea rows={3} style={S.textarea} value={form.buttonsLinks} onChange={e => set("buttonsLinks", e.target.value)} placeholder="Primary button: brass fill, ink text, Inter 600, uppercase, 2px radius. Hover deepens to Brass Deep." />
          </div>
          <div style={S.field}>
            <label style={S.label}>Components and motif</label>
            <div style={S.hint}>Section styling rules — signature accents, card treatment, dark sections.</div>
            <textarea rows={3} style={S.textarea} value={form.componentMotif} onChange={e => set("componentMotif", e.target.value)} placeholder="The marker tick: a short brass bar. Cards: bone or warm white, one hairline border, generous padding." />
          </div>
          <div style={S.field}>
            <label style={S.label}>Layout and imagery</label>
            <div style={S.hint}>Layout defaults and photo direction.</div>
            <textarea rows={3} style={S.textarea} value={form.layoutImagery} onChange={e => set("layoutImagery", e.target.value)} placeholder="Generous whitespace. Content max width 1080–1200px. Imagery is real and grounded: people at work, plant floors, hands." />
          </div>
        </div>
      </div>
    ),
    3: ( // Sitemap
      <div>
        <div style={S.section}>
          <div style={S.sectionTitle}>03 · Sitemap and Global Elements</div>
          <div style={S.field}>
            <label style={S.label}>Pages to build</label>
            <div style={S.hint}>Check every page this site needs. The build will only generate what is selected.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
              {ALL_PAGES.concat(ADDITIONAL_PAGE_TYPES).map(p => {
                const currentPages = Array.isArray(form.pages)
                  ? form.pages
                  : (form.pages || "").split("\n").map(l => l.split("·")[0].trim()).filter(Boolean);
                const checked = currentPages.includes(p.label) || currentPages.includes(p.id);
                return (
                  <label key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: checked ? "#f0eff3" : "#ffffff", border: `1px solid ${checked ? "#000000" : "#dde0e6"}`, borderRadius: "6px", cursor: "pointer", fontSize: "13px", color: "#09090b", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        const next = e.target.checked
                          ? [...currentPages.filter(x => x !== p.label && x !== p.id), p.label]
                          : currentPages.filter(x => x !== p.label && x !== p.id);
                        set("pages", next);
                      }}
                      style={{ cursor: "pointer", accentColor: "#6b635c", width: "14px", height: "14px", flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: checked ? 600 : 400 }}>{p.label}</span>
                    <span style={{ fontSize: "11px", color: "#6b7280", marginLeft: "auto" }}>{p.slug}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Header nav links <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma-separated)</span></label>
            <input style={S.input} value={form.headerNav} onChange={e => set("headerNav", e.target.value)} placeholder="Work, Services, About, Process, Contact" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Header CTA button</label>
            <input style={S.input} value={form.headerCta} onChange={e => set("headerCta", e.target.value)} placeholder="Start a project" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Header description</label>
            <div style={S.hint}>Style and layout notes for the global header.</div>
            <textarea rows={3} style={S.textarea} value={form.headerDescription} onChange={e => set("headerDescription", e.target.value)} placeholder="Logo left. Links: Work, Services, About, Process, Contact. One brass button on the right: Start a project." />
          </div>
          <div style={S.field}>
            <label style={S.label}>Footer description</label>
            <div style={S.hint}>Style and layout notes for the global footer.</div>
            <textarea rows={3} style={S.textarea} value={form.footerDescription} onChange={e => set("footerDescription", e.target.value)} placeholder="Warm-white wordmark on Ink, the tagline beneath it, nav repeated, email address, and a small line." />
          </div>
        </div>
      </div>
    ),
    4: ( // Copy
      <div>
        <div style={S.section}>
          <div style={S.sectionTitle}>04 · Home Page Copy</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={S.field}><label style={S.label}>Hero eyebrow</label><input style={S.input} value={form.heroEyebrow} onChange={e => set("heroEyebrow", e.target.value)} placeholder="e.g. Specish Studio" /></div>
            <div style={S.field}><label style={S.label}>Hero CTA 1</label><input style={S.input} value={form.heroCta1} onChange={e => set("heroCta1", e.target.value)} placeholder="See the work" /></div>
          </div>
          <div style={S.field}><label style={S.label}>Hero H1 (display)</label><textarea rows={2} style={S.textarea} value={form.heroH1} onChange={e => set("heroH1", e.target.value)} placeholder="Films for companies worth marking." /></div>
          <div style={S.field}><label style={S.label}>Hero subhead</label><textarea rows={2} style={S.textarea} value={form.heroSubhead} onChange={e => set("heroSubhead", e.target.value)} placeholder="Full-service video for industrial and founder-led companies. One person, from the first idea to the final cut." /></div>
          <div style={S.field}><label style={S.label}>The honest hook</label><div style={S.hint}>Single statement block under the hero.</div><textarea rows={3} style={S.textarea} value={form.hookStatement} onChange={e => set("hookStatement", e.target.value)} placeholder="Most studios send a ten person crew and a vague quote. This is one maker who does all of it…" /></div>
          <div style={S.sectionTitle} style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "12px" }}>What we make — 4 cards</div>
          {[1,2,3,4].map(n => (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px", marginBottom: "10px" }}>
              <input style={{ ...S.input, fontSize: "13px" }} value={form["serviceCard" + n + "Title"]} onChange={e => set("serviceCard" + n + "Title", e.target.value)} placeholder={"Card " + n + " title"} />
              <input style={{ ...S.input, fontSize: "13px" }} value={form["serviceCard" + n + "Body"]} onChange={e => set("serviceCard" + n + "Body", e.target.value)} placeholder={"Card " + n + " body"} />
            </div>
          ))}
          <div style={{ ...S.section, marginTop: "20px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "12px" }}>The difference section</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
              <input style={{ ...S.input, fontSize: "13px" }} value={form.differenceEyebrow} onChange={e => set("differenceEyebrow", e.target.value)} placeholder="Eyebrow: Why one maker" />
              <input style={{ ...S.input, fontSize: "13px" }} value={form.differenceH2} onChange={e => set("differenceH2", e.target.value)} placeholder="H2: One person. The whole film." />
            </div>
            <textarea rows={3} style={S.textarea} value={form.differenceBody} onChange={e => set("differenceBody", e.target.value)} placeholder="No crew to feed, house, or fly. One mind carries the story…" />
          </div>
          <div style={{ ...S.section }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "12px" }}>Who it is for section</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
              <input style={{ ...S.input, fontSize: "13px" }} value={form.whoEyebrow} onChange={e => set("whoEyebrow", e.target.value)} placeholder="Eyebrow: Who it is for" />
              <input style={{ ...S.input, fontSize: "13px" }} value={form.whoH2} onChange={e => set("whoH2", e.target.value)} placeholder="H2: For the underfilmed." />
            </div>
            <textarea rows={3} style={S.textarea} value={form.whoBody} onChange={e => set("whoBody", e.target.value)} placeholder="Industrial and founder-led companies…" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "18px" }}>
            <div><label style={S.label}>Work H2</label><input style={S.input} value={form.workH2} onChange={e => set("workH2", e.target.value)} placeholder="Recent work." /></div>
            <div><label style={S.label}>Pricing teaser H2</label><input style={S.input} value={form.pricingTeaserH2} onChange={e => set("pricingTeaserH2", e.target.value)} placeholder="Clear prices." /></div>
            <div><label style={S.label}>Pricing CTA</label><input style={S.input} value={form.pricingTeaserCta} onChange={e => set("pricingTeaserCta", e.target.value)} placeholder="See packages" /></div>
          </div>
          <div style={S.field}><label style={S.label}>Closing pull-quote (Fraunces)</label><input style={S.input} value={form.closingPullQuote} onChange={e => set("closingPullQuote", e.target.value)} placeholder="The stories that move a company forward." /></div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>About page copy</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <input style={{ ...S.input, fontSize: "13px" }} value={form.aboutEyebrow} onChange={e => set("aboutEyebrow", e.target.value)} placeholder="Eyebrow: The maker" />
            <input style={{ ...S.input, fontSize: "13px" }} value={form.aboutH1} onChange={e => set("aboutH1", e.target.value)} placeholder="H1: One person. Every frame." />
          </div>
          <div style={S.field}><label style={S.label}>Founder story</label><div style={S.hint}>Use [brackets] for anything a human must confirm. AI never fills brackets.</div><textarea rows={5} style={S.textarea} value={form.aboutStory} onChange={e => set("aboutStory", e.target.value)} placeholder={"e.g. Specish Studio is [Founder Name]. They [what they do] — write, design, and build every project in-house…"} /></div>
          <div style={S.field}><label style={S.label}>Why one maker / approach</label><textarea rows={3} style={S.textarea} value={form.whyOneMaker} onChange={e => set("whyOneMaker", e.target.value)} placeholder="One mind on the whole film keeps the voice honest and the cost lean…" /></div>
          <div style={S.field}><label style={S.label}>Five values <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma-separated)</span></label><input style={S.input} value={form.founderValues} onChange={e => set("founderValues", e.target.value)} placeholder="Grounded, Forward, Exact, Singular, Human" /></div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Process page copy</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <input style={{ ...S.input, fontSize: "13px" }} value={form.processEyebrow} onChange={e => set("processEyebrow", e.target.value)} placeholder="Eyebrow: Process" />
            <input style={{ ...S.input, fontSize: "13px" }} value={form.processH1} onChange={e => set("processH1", e.target.value)} placeholder="H1: How a film gets made." />
          </div>
          <div style={S.field}><input style={S.input} value={form.processIntro} onChange={e => set("processIntro", e.target.value)} placeholder="Intro: Simple and calm, from first call to final files." /></div>
          {[1,2,3,4,5].map(n => (
            <div key={n} style={{ display: "grid", gridTemplateColumns: "40px 120px 1fr", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#6b7280", textAlign: "center" }}>0{n}</div>
              <input style={{ ...S.input, fontSize: "13px" }} value={form["step" + n + "Title"]} onChange={e => set("step" + n + "Title", e.target.value)} placeholder={"Step title"} />
              <input style={{ ...S.input, fontSize: "13px" }} value={form["step" + n + "Body"]} onChange={e => set("step" + n + "Body", e.target.value)} placeholder={"Step body copy"} />
            </div>
          ))}
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Contact page copy</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            <input style={{ ...S.input, fontSize: "13px" }} value={form.contactEyebrow} onChange={e => set("contactEyebrow", e.target.value)} placeholder="Eyebrow: Contact" />
            <input style={{ ...S.input, fontSize: "13px" }} value={form.contactH1} onChange={e => set("contactH1", e.target.value)} placeholder="H1: Tell me about the company." />
          </div>
          <div style={S.field}><textarea rows={3} style={S.textarea} value={form.contactIntro} onChange={e => set("contactIntro", e.target.value)} placeholder="A sentence or two about the business and what you are trying to show. You will get a real reply…" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div style={S.field}><label style={S.label}>Submit button</label><input style={S.input} value={form.contactSubmit} onChange={e => set("contactSubmit", e.target.value)} placeholder="Send it over" /></div>
            <div style={S.field}><label style={S.label}>Reassurance line</label><input style={S.input} value={form.contactReassurance} onChange={e => set("contactReassurance", e.target.value)} placeholder="No sales team. No automated funnel." /></div>
          </div>
        </div>
      </div>
    ),
    5: ( // Pricing
      <div>
        <div style={S.section}>
          <div style={S.sectionTitle}>05 · Pricing, Built Out</div>
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280", marginBottom: "12px" }}>The three tiers</div>
          {form.tiers.map((tier, i) => (
            <div key={i} style={{ border: "1px solid #dde0e6", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#09090b", marginBottom: "10px" }}>Tier {i + 1}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <input style={{ ...S.input, fontSize: "13px" }} value={tier.name} onChange={e => setTier(i, "name", e.target.value)} placeholder="Name e.g. Front Door" />
                <input style={{ ...S.input, fontSize: "13px" }} value={tier.subtitle} onChange={e => setTier(i, "subtitle", e.target.value)} placeholder="Subtitle e.g. CASH FLOW & TRUST" />
              </div>
              <textarea rows={2} style={{ ...S.textarea, fontSize: "13px", marginBottom: "8px" }} value={tier.description} onChange={e => setTier(i, "description", e.target.value)} placeholder="Description of this tier…" />
              <input style={{ ...S.input, fontSize: "13px" }} value={tier.price} onChange={e => setTier(i, "price", e.target.value)} placeholder="Price e.g. From 2.5K per film" />
            </div>
          ))}
          <div style={S.field}>
            <label style={S.label}>Always included (in every package)</label>
            <textarea rows={3} style={S.textarea} value={form.alwaysIncluded} onChange={e => set("alwaysIncluded", e.target.value)} placeholder="A set number of revision rounds, agreed up front. Professional lighting and audio, color grading, and a licensed music track." />
          </div>
          <div style={{ padding: "12px 14px", background: "#ffffff", borderRadius: "6px", fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
            Full service menu is pre-built in Spec based on the brief. Add or customize line items by editing the brief after generation.
          </div>
        </div>
      </div>
    ),
    1: ( // Positioning
      <div>
        <div style={S.section}>
          <div style={S.sectionTitle}>Positioning & Messaging</div>
          <div style={S.hint} style={{ marginBottom: "16px", fontSize: "12px", color: "#6b7280" }}>Define the strategic foundation. This feeds the AI when drafting copy and informs the SEO audit.</div>

          <div style={S.field}>
            <label style={S.label}>Core value proposition</label>
            <div style={S.hint}>One sentence. What this business does, for who, and why it's different.</div>
            <textarea rows={2} style={S.textarea} value={form.valueProposition} onChange={e => set("valueProposition", e.target.value)} placeholder="e.g. Full-service video production for industrial companies that need a real story, not a polished ad." />
          </div>

          <div style={S.field}>
            <label style={S.label}>Target audience</label>
            <div style={S.hint}>Who specifically. Be precise — industry, role, situation.</div>
            <textarea rows={2} style={S.textarea} value={form.targetAudience} onChange={e => set("targetAudience", e.target.value)} placeholder="e.g. Marketing directors at industrial and manufacturing companies with 50–500 employees." />
          </div>

          <div style={S.field}>
            <label style={S.label}>Competitive differentiator</label>
            <div style={S.hint}>What makes this brand the only real choice. Not just better — different.</div>
            <textarea rows={2} style={S.textarea} value={form.competitiveDifferentiator} onChange={e => set("competitiveDifferentiator", e.target.value)} placeholder="e.g. One person does everything — no crew, no game of telephone, no inflated budget." />
          </div>

          <div style={S.field}>
            <label style={S.label}>Key messages <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(one per line)</span></label>
            <div style={S.hint}>The 3–5 things the site must communicate. Every page should reinforce at least one.</div>
            <textarea rows={5} style={S.textarea} value={form.keyMessages} onChange={e => set("keyMessages", e.target.value)} placeholder={"One person, the whole film — voice stays consistent, cost stays lean.\nReal prices, published openly — no discovery call required.\nBuilt for the companies the big studios skip."} />
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>SEO Keywords</div>
          <div style={S.hint} style={{ marginBottom: "16px", fontSize: "12px", color: "#6b7280" }}>These feed the SEO audit and inform copy drafting. Primary keywords should appear in headings and opening paragraphs.</div>

          <div style={S.field}>
            <label style={S.label}>Primary keywords <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma-separated)</span></label>
            <div style={S.hint}>What this business needs to rank for. 2–4 terms max.</div>
            <input style={S.input} value={form.primaryKeywords} onChange={e => set("primaryKeywords", e.target.value)} placeholder="e.g. industrial video production, corporate video company, manufacturer video" />
          </div>

          <div style={S.field}>
            <label style={S.label}>Secondary keywords <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma-separated)</span></label>
            <div style={S.hint}>Supporting terms — long tail, location-based, service-specific.</div>
            <input style={S.input} value={form.secondaryKeywords} onChange={e => set("secondaryKeywords", e.target.value)} placeholder="e.g. founder story video, PE portfolio video, factory tour video, one-man video crew" />
          </div>
        </div>

        <div style={S.section}>
          <div style={S.sectionTitle}>Page Titles & Meta Descriptions</div>
          <div style={S.hint} style={{ marginBottom: "16px", fontSize: "12px", color: "#6b7280" }}>Used in the SEO audit and exported as a reference sheet for your SEO plugin (Yoast, RankMath, etc.).</div>
          {form.seoPageTitles.map((s, i) => (
            <div key={i} style={{ marginBottom: "18px", padding: "14px", border: "1px solid #dde0e6", borderRadius: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#09090b", marginBottom: "10px" }}>{s.page}</div>
              <div style={S.field}>
                <label style={S.label}>Title <span style={{ fontWeight: 400, color: s.title.length > 60 ? "#dc2626" : "#9ca3af" }}>{s.title.length}/60</span></label>
                <input style={S.input} value={s.title} onChange={e => setPageTitle(i, "title", e.target.value)} placeholder={"e.g. " + s.page + " | " + (form.brandName || "Brand Name")} />
              </div>
              <div>
                <label style={S.label}>Description <span style={{ fontWeight: 400, color: s.desc.length > 160 ? "#dc2626" : "#9ca3af" }}>{s.desc.length}/160</span></label>
                <textarea rows={2} style={S.textarea} value={s.desc} onChange={e => setPageTitle(i, "desc", e.target.value)} placeholder="Plain, specific, in voice. What this page is about and why someone should click." />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "760px", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#09090b" }}>Client intake form</div>
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Fill out each section — this replaces uploading a brief doc</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
        </div>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid #dde0e6", flexShrink: 0, overflowX: "auto" }}>
          {INTAKE_TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding: "10px 18px", fontSize: "13px", fontWeight: tab === i ? 600 : 400, color: tab === i ? "#09090b" : "#6b7280", background: "transparent", border: "none", cursor: "pointer", borderBottom: tab === i ? "2px solid #09090b" : "2px solid transparent", whiteSpace: "nowrap" }}>
              {t}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {tabs[tab]}
        </div>
        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #dde0e6", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {tab > 0 && <button onClick={() => setTab(tab - 1)} style={{ padding: "8px 16px", fontSize: "13px", border: "1px solid #dde0e6", borderRadius: "6px", background: "#fff", cursor: "pointer" }}>← {INTAKE_TABS[tab - 1]}</button>}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {tab < INTAKE_TABS.length - 1 ? (
              <button onClick={() => setTab(tab + 1)} style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Next → {INTAKE_TABS[tab + 1]}
              </button>
            ) : (
              <button onClick={() => onComplete(buildBriefFromForm(), form.brandName)} style={{ padding: "8px 24px", fontSize: "13px", fontWeight: 600, background: "#09090b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Build from intake →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Brief Review Modal ────────────────────────────────────────────────────────
